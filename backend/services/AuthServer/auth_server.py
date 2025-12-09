import os
from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker, scoped_session, joinedload
from backend.database.models.user import User, Base
from backend.database.models.resort_with_image import ResortWithImage
from backend.database.models.booking import Booking
from backend.database.models.notification import Notification
from backend.database.models.blog import Blog
from backend.database.models.enums import UserType, ResortStatus, ResortType
from pydantic import BaseModel, EmailStr
from typing import Optional
from dotenv import load_dotenv
import uuid
from pathlib import Path
from datetime import datetime
from fpdf import FPDF
import smtplib
from email.message import EmailMessage
import bcrypt

# Load environment variables from .env
# Find .env file in project root (go up from backend/services/AuthServer/ to project root)
project_root = Path(__file__).parent.parent.parent.parent
env_path = project_root / '.env'

# Also try find_dotenv() which searches automatically
from dotenv import find_dotenv
found_env = find_dotenv()

if env_path.exists():
    load_dotenv(dotenv_path=env_path, override=True)
    print(f"Loaded .env from: {env_path}")
elif found_env:
    load_dotenv(dotenv_path=found_env, override=True)
    print(f"Loaded .env from: {found_env}")
else:
    load_dotenv(override=True)  # Fallback - searches from current directory
    print("Using default load_dotenv() behavior")

DATABASE_URL = os.getenv('DATABASE_URL')

engine = create_engine(DATABASE_URL)
SessionLocal = scoped_session(sessionmaker(bind=engine))

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    phonenumber: str
    user_type: str  # 'Customer' or 'Company'
    name: str

class AdminSignupRequest(BaseModel):
    email: EmailStr
    password: str
    phonenumber: str
    name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    user_type: str  # 'Admin', 'Company', or 'Customer'

class AddResortRequest(BaseModel):
    name: str
    city: str
    country: str
    price: float
    status: str  # 'full', 'not full', 'open', 'closed'
    type: str  # 'hotel' or 'adventure'

class UpdateResortRequest(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    price: Optional[float] = None
    status: Optional[str] = None  # 'full', 'not full', 'open', 'closed'
    type: Optional[str] = None  # 'hotel' or 'adventure'

class BookingRequest(BaseModel):
    resort_id: str
    booking_date: str  # ISO format date string
    quantity: int  # Number of nights for hotels, number of tickets for adventures

class UpdateProfileRequest(BaseModel):
    user_id: str
    name: str
    phonenumber: str
    email: str

class UpdatePasswordRequest(BaseModel):
    user_id: str
    new_password: str

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Password hashing functions
def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hashed password."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

@app.post("/signup")
def signup(req: SignupRequest, db=Depends(get_db)):
    type_mapping = {'Customer': UserType.USER, 'Company': UserType.COMPANY, 'Admin': UserType.ADMIN}
    user_type = type_mapping.get(req.user_type)
    if user_type is None:
        raise HTTPException(status_code=400, detail="Invalid user type")
    # Check duplicate email
    if db.query(User).filter_by(email=req.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    # Hash the password before storing
    hashed_password = hash_password(req.password)
    user = User(
        user_id=uuid.uuid4(),
        name=req.name,
        phonenumber=req.phonenumber,
        email=req.email,
        password=hashed_password,
        type=user_type
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"user_id": str(user.user_id)}

@app.post("/login")
def login(req: LoginRequest, db=Depends(get_db)):
    # Find user by email
    user = db.query(User).filter_by(email=req.email).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password using bcrypt
    # Handle both hashed and plain text passwords for backward compatibility
    password_valid = False
    try:
        # Try to verify as hashed password first
        password_valid = verify_password(req.password, user.password)
    except (ValueError, Exception):
        # If verification fails, check if it's a legacy plain text password
        # This allows existing users to still login, but they should update their password
        if user.password == req.password:
            password_valid = True
            # Optionally, re-hash the password for security
            user.password = hash_password(req.password)
            db.commit()
    
    if not password_valid:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Map user type enum to string for frontend
    user_type_map = {
        UserType.USER: "Customer",
        UserType.COMPANY: "Company",
        UserType.ADMIN: "Admin"
    }
    
    actual_user_type = user_type_map.get(user.type, "Unknown")
    
    # Validate that the selected user type matches the actual user type
    if actual_user_type != req.user_type:
        raise HTTPException(
            status_code=403, 
            detail=f"Invalid account type. This account is registered as {actual_user_type}, not {req.user_type}. Please select the correct account type."
        )
    
    return {
        "user_id": str(user.user_id),
        "name": user.name,
        "email": user.email,
        "user_type": actual_user_type,
        "message": f"Welcome back, {user.name}!"
    }

@app.post("/admin/signup")
def admin_signup(req: AdminSignupRequest, db=Depends(get_db)):
    # Only admin should be able to access this in real scenario
    if db.query(User).filter_by(email=req.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    # Hash the password before storing
    hashed_password = hash_password(req.password)
    user = User(
        user_id=uuid.uuid4(),
        name=req.name,
        phonenumber=req.phonenumber,
        email=req.email,
        password=hashed_password,
        type=UserType.ADMIN
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"user_id": str(user.user_id)}

@app.get("/notifications")
def get_notifications(company_id: str, db=Depends(get_db)):
    """
    Get all notifications for a company with booking details.
    """
    # Validate company_id is a valid UUID
    try:
        company_uuid = uuid.UUID(company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid company ID format")
    
    # Verify the company exists
    company = db.query(User).filter_by(user_id=company_uuid).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Get all notifications for this company, ordered by most recent first
    notifications = db.query(Notification).filter_by(company_id=company_uuid).order_by(Notification.created_at.desc()).all()
    
    notifications_list = []
    for notif in notifications:
        try:
            # Get booking details using booking_id
            if not notif.booking_id:
                continue
                
            booking = db.query(Booking).filter_by(booking_id=notif.booking_id).first()
            if not booking:
                continue
            
            # Get user (customer) details
            user = db.query(User).filter_by(user_id=booking.user_id).first()
            if not user:
                continue
            
            # Get resort details to determine type
            resort = db.query(ResortWithImage).filter_by(resort_id=booking.resort_id).first()
            if not resort:
                continue
            
            # Get resort type as string
            if isinstance(resort.type, ResortType):
                resort_type_str = resort.type.value
            else:
                # Handle case where type might be a string
                resort_type_str = str(resort.type).split('.')[-1].lower() if '.' in str(resort.type) else str(resort.type).lower()
            
            notifications_list.append({
                "notification_id": str(notif.notification_id),
                "notification": notif.notification,
                "created_at": notif.created_at.isoformat(),
                "booking_details": {
                    "booking_id": str(booking.booking_id),
                    "customer_name": user.name,
                    "quantity": booking.quantity,
                    "total_price": float(booking.total_price),
                    "booking_date": booking.booking_date.strftime("%Y-%m-%d"),
                    "resort_type": resort_type_str
                }
            })
        except Exception as e:
            # Log error but continue processing other notifications
            print(f"Error processing notification {notif.notification_id}: {str(e)}")
            continue
    
    return {"notifications": notifications_list, "count": len(notifications_list)}

@app.delete("/notifications/{notification_id}")
def delete_notification(notification_id: str, company_id: str, db=Depends(get_db)):
    """
    Delete a notification. Only the company that owns the notification can delete it.
    """
    # Validate notification_id is a valid UUID
    try:
        notification_uuid = uuid.UUID(notification_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid notification ID format")
    
    # Validate company_id is a valid UUID
    try:
        company_uuid = uuid.UUID(company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid company ID format")
    
    # Find the notification
    notification = db.query(Notification).filter_by(notification_id=notification_uuid).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Verify the company owns this notification
    if notification.company_id != company_uuid:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this notification")
    
    # Store notification text for response
    notification_text = notification.notification
    
    # Delete the notification
    db.delete(notification)
    db.commit()
    
    return {
        "message": f"Notification deleted successfully"
    }

# ============================= Get the total count of bookings for a company

@app.get("/bookings/count")
def get_booking_count(company_id: str, db=Depends(get_db)):
    """
    Get the total count of bookings for a company.
    """
    # Validate company_id is a valid UUID
    try:
        company_uuid = uuid.UUID(company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid company ID format")
    
    # Count bookings for this company
    booking_count = db.query(Booking).filter_by(company_id=company_uuid).count()
    
    return {"booking_count": booking_count}

#================================= get all boookings by a user

@app.get("/bookings/user")
def get_user_bookings(user_id: str, db=Depends(get_db)):
    """
    Get all bookings for a user (customer) with resort details.
    """
    from datetime import datetime
    
    # Validate user_id is a valid UUID
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    # Verify the user exists
    user = db.query(User).filter_by(user_id=user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all bookings for this user, ordered by booking date descending
    bookings = db.query(Booking).filter_by(user_id=user_uuid).order_by(Booking.booking_date.desc()).all()
    
    bookings_list = []
    current_date = datetime.now().date()
    
    for booking in bookings:
        try:
            # Get resort details
            resort = db.query(ResortWithImage).filter_by(resort_id=booking.resort_id).first()
            if not resort:
                continue
            
            # Get company details
            company = db.query(User).filter_by(user_id=booking.company_id).first()
            if not company:
                continue
            
            # Get resort type as string
            if isinstance(resort.type, ResortType):
                resort_type_str = resort.type.value
            else:
                resort_type_str = str(resort.type).split('.')[-1].lower() if '.' in str(resort.type) else str(resort.type).lower()
            
            # Check if booking date has passed
            booking_date_obj = booking.booking_date.date() if hasattr(booking.booking_date, 'date') else booking.booking_date
            is_past = booking_date_obj < current_date
            
            bookings_list.append({
                "booking_id": str(booking.booking_id),
                "resort_id": str(booking.resort_id),
                "resort_name": resort.name,
                "company_name": company.name,
                "city": resort.city,
                "country": resort.country,
                "resort_type": resort_type_str,
                "quantity": booking.quantity,
                "total_price": float(booking.total_price),
                "booking_date": booking.booking_date.strftime("%Y-%m-%d"),
                "created_at": booking.created_at.isoformat() if booking.created_at else None,
                "is_past": is_past,
                "pdf_filename": booking.pdf_filename
            })
        except Exception as e:
            # Log error but continue processing other bookings
            print(f"Error processing booking {booking.booking_id}: {str(e)}")
            continue
    
    return {"bookings": bookings_list, "count": len(bookings_list)}
# ================================== get all bookings by a company
@app.get("/bookings/company")
def get_company_bookings(company_id: str, db=Depends(get_db)):
    """
    Get all bookings for a company with customer and resort details.
    """
    from datetime import datetime
    
    # Validate company_id is a valid UUID
    try:
        company_uuid = uuid.UUID(company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid company ID format")
    
    # Verify the company exists
    company = db.query(User).filter_by(user_id=company_uuid).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Get all bookings for this company, ordered by booking date descending
    bookings = db.query(Booking).filter_by(company_id=company_uuid).order_by(Booking.booking_date.desc()).all()
    
    bookings_list = []
    current_date = datetime.now().date()
    
    for booking in bookings:
        try:
            # Get customer (user) details
            customer = db.query(User).filter_by(user_id=booking.user_id).first()
            if not customer:
                continue
            
            # Get resort details
            resort = db.query(ResortWithImage).filter_by(resort_id=booking.resort_id).first()
            if not resort:
                continue
            
            # Get resort type as string
            if isinstance(resort.type, ResortType):
                resort_type_str = resort.type.value
            else:
                resort_type_str = str(resort.type).split('.')[-1].lower() if '.' in str(resort.type) else str(resort.type).lower()
            
            # Check if booking date has passed
            booking_date_obj = booking.booking_date.date() if hasattr(booking.booking_date, 'date') else booking.booking_date
            is_past = booking_date_obj < current_date
            
            bookings_list.append({
                "booking_id": str(booking.booking_id),
                "resort_id": str(booking.resort_id),
                "resort_name": resort.name,
                "customer_name": customer.name,
                "customer_email": customer.email,
                "city": resort.city,
                "country": resort.country,
                "resort_type": resort_type_str,
                "quantity": booking.quantity,
                "total_price": float(booking.total_price),
                "booking_date": booking.booking_date.strftime("%Y-%m-%d"),
                "created_at": booking.created_at.isoformat() if booking.created_at else None,
                "is_past": is_past,
                "pdf_filename": booking.pdf_filename
            })
        except Exception as e:
            # Log error but continue processing other bookings
            print(f"Error processing booking {booking.booking_id}: {str(e)}")
            continue
    
    return {"bookings": bookings_list, "count": len(bookings_list)}


# ================================== create a new booking by user

@app.post("/bookings")
def create_booking(req: BookingRequest, user_id: str, db=Depends(get_db)):
    """
    Create a new booking. user_id should be passed as a query parameter from the logged-in user.
    """
    from datetime import datetime
    
    # Validate user_id is a valid UUID
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    # Validate resort_id is a valid UUID
    try:
        resort_uuid = uuid.UUID(req.resort_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid resort ID format")
    
    # Find the resort
    resort = db.query(ResortWithImage).filter_by(resort_id=resort_uuid).first()
    if not resort:
        raise HTTPException(status_code=404, detail="Resort not found")
    
    # Check if resort is available
    if resort.status == ResortStatus.FULL or resort.status == ResortStatus.CLOSED:
        raise HTTPException(status_code=400, detail="Resort is not available for booking")
    
    # Verify the user exists
    user = db.query(User).filter_by(user_id=user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get company_id from the resort
    company_id = resort.company_id
    
    # Parse booking date
    try:
        # Try parsing ISO format with timezone
        booking_date = datetime.fromisoformat(req.booking_date.replace('Z', '+00:00'))
    except ValueError:
        try:
            # Try parsing ISO format without timezone
            booking_date = datetime.fromisoformat(req.booking_date)
        except ValueError:
            try:
                # Try parsing date-only format (YYYY-MM-DD)
                from datetime import date as date_class
                date_obj = date_class.fromisoformat(req.booking_date)
                booking_date = datetime.combine(date_obj, datetime.min.time())
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid booking date format. Use ISO format (YYYY-MM-DD)")
    
    # Validate quantity
    if req.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")
    
    # Calculate total price
    total_price = float(resort.price) * req.quantity
    
    # Create booking
    booking = Booking(
        resort_id=resort_uuid,
        user_id=user_uuid,
        company_id=company_id,
        booking_date=booking_date,
        quantity=req.quantity,
        total_price=total_price
    )
    
    db.add(booking)
    db.commit()
    db.refresh(booking)
    
    # Create notification for the company
    # Format: "{username} booked a {resort name} for {date}"
    booking_date_str = booking_date.strftime("%Y-%m-%d")
    if resort.type == ResortType.HOTEL:
        if req.quantity == 1:
            notification_text = f"{user.name} booked 1 night in {resort.name} for {booking_date_str}"
        else:
            notification_text = f"{user.name} booked {req.quantity} nights in {resort.name} for {booking_date_str}"
    elif resort.type == ResortType.ADVENTURE:
        if req.quantity == 1:
            notification_text = f"{user.name} booked 1 ticket for {resort.name} for {booking_date_str}"
        else:
            notification_text = f"{user.name} booked {req.quantity} tickets for {resort.name} for {booking_date_str}"
    else:
        # Fallback for unknown types
        notification_text = f"{user.name} booked a {resort.name} for {booking_date_str}"
    
    # Create notification with booking_id
    try:
        notification = Notification(
            company_id=company_id,
            booking_id=booking.booking_id,
            notification=notification_text
        )
        
        db.add(notification)
        db.commit()
    except Exception as e:
        # Log error but don't fail the booking
        print(f"Error creating notification: {str(e)}")
        db.rollback()
    
    # Generate PDF receipt
    pdf_uuid = str(booking.booking_id)
    pdf_filename = f"{pdf_uuid}.pdf"
    pdf_path = PDFS_DIR / pdf_filename
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=16)
    pdf.cell(0, 12, "Booking Confirmation", ln=1, align='C')
    pdf.set_font("Arial", size=12)
    pdf.ln(6)
    pdf.cell(0, 10, f"Booking ID: {booking.booking_id}", ln=1)
    pdf.cell(0, 10, f"User: {user.name} (Email: {user.email})", ln=1)
    pdf.cell(0, 10, f"Resort: {resort.name}", ln=1)
    pdf.cell(0, 10, f"Company: {user.name}", ln=1)
    pdf.cell(0, 10, f"Booking Date: {booking_date.strftime('%Y-%m-%d')}", ln=1)
    pdf.cell(0, 10, f"Quantity: {req.quantity}", ln=1)
    pdf.cell(0, 10, f"Total Price: ${total_price:.2f}", ln=1)
    pdf.output(str(pdf_path))
    booking.pdf_filename = pdf_filename
    db.commit()
    
    # Send booking confirmation email with PDF attachment
    try:
        send_booking_confirmation_email(
            user.email,
            user.name,
            resort.name,
            booking_date_str,
            pdf_path
        )
    except Exception as e:
        # Log error but don't fail the booking
        print(f"Error sending booking confirmation email: {str(e)}")

    return {
        "booking_id": str(booking.booking_id),
        "resort_id": str(booking.resort_id),
        "user_id": str(booking.user_id),
        "company_id": str(booking.company_id),
        "booking_date": booking.booking_date.isoformat(),
        "quantity": booking.quantity,
        "total_price": float(booking.total_price),
        "message": "Booking created successfully"
    }

# ==================== RESORTS WITH IMAGE ENDPOINTS ====================

# Ensure pictures directory exists
PICTURES_DIR = Path("pictures")
PICTURES_DIR.mkdir(exist_ok=True)

PDFS_DIR = Path("pdfs")
PDFS_DIR.mkdir(exist_ok=True)

# Email configuration from environment variables
# Load these after dotenv is loaded
MAIL_SMTP_SERVER = os.getenv('MAIL_SMTP_SERVER')
MAIL_SMTP_PORT = int(os.getenv('MAIL_SMTP_PORT', 587))
MAIL_USERNAME = os.getenv('MAIL_USERNAME')
MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
MAIL_FROM = os.getenv('MAIL_FROM')

# Debug: Print loaded email config (without password)
if MAIL_SMTP_SERVER:
    print(f"Email config loaded - Server: {MAIL_SMTP_SERVER}, Port: {MAIL_SMTP_PORT}, From: {MAIL_FROM}, Username: {MAIL_USERNAME}")
else:
    print("Email config not loaded from environment variables")

def send_booking_confirmation_email(to_email: str, user_name: str, resort_name: str, booking_date_str: str, pdf_path: Path):
    """
    Send booking confirmation email with PDF attachment.
    """
    # Check which variables are missing for better debugging
    missing_vars = []
    if not MAIL_SMTP_SERVER:
        missing_vars.append("MAIL_SMTP_SERVER")
    if not MAIL_USERNAME:
        missing_vars.append("MAIL_USERNAME")
    if not MAIL_PASSWORD:
        missing_vars.append("MAIL_PASSWORD")
    if not MAIL_FROM:
        missing_vars.append("MAIL_FROM")
    
    if missing_vars:
        print(f"Email configuration incomplete. Missing variables: {', '.join(missing_vars)}")
        print("Please add these to your .env file in the project root directory.")
        return False
    
    try:
        # Create email message
        msg = EmailMessage()
        msg['Subject'] = f'Booking Confirmation - {resort_name}'
        msg['From'] = MAIL_FROM
        msg['To'] = to_email
        
        # Email body
        email_body = f"""Hello {user_name},

Thank you for your booking at {resort_name}!

Booking Details:
- Resort: {resort_name}
- Booking Date: {booking_date_str}

Please find your booking confirmation PDF attached to this email.

We look forward to serving you!

Best regards,
Roamly Team"""
        
        msg.set_content(email_body)
        
        # Attach PDF
        if pdf_path.exists():
            with open(pdf_path, 'rb') as f:
                file_data = f.read()
                msg.add_attachment(
                    file_data,
                    maintype='application',
                    subtype='pdf',
                    filename=pdf_path.name
                )
        
        # Send email
        with smtplib.SMTP(MAIL_SMTP_SERVER, MAIL_SMTP_PORT) as smtp:
            smtp.starttls()
            smtp.login(MAIL_USERNAME, MAIL_PASSWORD)
            smtp.send_message(msg)
        
        print(f"Booking confirmation email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send booking confirmation email: {str(e)}")
        return False


# adding a new resort by company
@app.post("/resorts-with-image")
async def add_resort_with_image(
    company_id: str = Form(...),
    name: str = Form(...),
    city: str = Form(...),
    country: str = Form(...),
    price: float = Form(...),
    status: str = Form(...),
    type: str = Form(...),
    image: UploadFile = File(None),
    instagram_link: Optional[str] = Form(None),
    facebook_link: Optional[str] = Form(None),
    googlemap_link: Optional[str] = Form(None),
    db=Depends(get_db)
):
    """
    Add a new resort with optional image. company_id should be passed as a form field.
    """
    # Validate company_id is a valid UUID
    try:
        company_uuid = uuid.UUID(company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid company ID format")
    
    # Verify the company exists and is actually a Company type
    company = db.query(User).filter_by(user_id=company_uuid).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if company.type != UserType.COMPANY:
        raise HTTPException(status_code=403, detail="Only companies can add resorts")
    
    # Map status string to enum
    status_mapping = {
        'full': ResortStatus.FULL,
        'not full': ResortStatus.NOT_FULL,
        'open': ResortStatus.OPEN,
        'closed': ResortStatus.CLOSED
    }
    resort_status = status_mapping.get(status.lower())
    if not resort_status:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {list(status_mapping.keys())}")
    
    # Map type string to enum
    type_mapping = {
        'hotel': ResortType.HOTEL,
        'adventure': ResortType.ADVENTURE
    }
    resort_type = type_mapping.get(type.lower())
    if not resort_type:
        raise HTTPException(status_code=400, detail=f"Invalid type. Must be one of: {list(type_mapping.keys())}")
    
    # Validate price is positive
    if price <= 0:
        raise HTTPException(status_code=400, detail="Price must be greater than 0")
    
    # Generate unique resort ID
    resort_uuid = uuid.uuid4()
    image_filename = None
    
    # Handle image upload if provided
    if image and image.filename:
        # Validate file type
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
        file_ext = Path(image.filename).suffix.lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}")
        
        # Validate file size (max 10MB)
        contents = await image.read()
        if len(contents) > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        image_filename = f"{resort_uuid}_{timestamp}{file_ext}"
        image_path = PICTURES_DIR / image_filename
        
        # Save file
        with open(image_path, "wb") as buffer:
            buffer.write(contents)
    
    # Create resort
    resort = ResortWithImage(
        resort_id=resort_uuid,
        name=name,
        company_id=company_uuid,
        city=city,
        country=country,
        price=price,
        status=resort_status,
        type=resort_type,
        image_name=image_filename,
        instagram_link=instagram_link if instagram_link else None,
        facebook_link=facebook_link if facebook_link else None,
        googlemap_link=googlemap_link if googlemap_link else None
    )
    
    db.add(resort)
    db.commit()
    db.refresh(resort)
    
    return {
        "resort_id": str(resort.resort_id),
        "name": resort.name,
        "image_name": resort.image_name,
        "message": "Resort added successfully"
    }

@app.get("/resorts-with-image")
def get_resorts_with_image(company_id: Optional[str] = None, country: Optional[str] = None, db=Depends(get_db)):
    """
    Get all resorts with images, optionally filtered by company_id or country.
    """
    query = db.query(ResortWithImage).outerjoin(User, ResortWithImage.company_id == User.user_id).add_entity(User)
    
    if company_id:
        try:
            company_uuid = uuid.UUID(company_id)
            query = query.filter(ResortWithImage.company_id == company_uuid)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid company ID format")
    
    if country:
        query = query.filter(ResortWithImage.country.ilike(f"%{country}%"))
    
    results = query.all()
    
    resorts_list = []
    status_map = {
        ResortStatus.FULL: "full",
        ResortStatus.NOT_FULL: "not full",
        ResortStatus.OPEN: "open",
        ResortStatus.CLOSED: "closed"
    }
    type_map = {
        ResortType.HOTEL: "hotel",
        ResortType.ADVENTURE: "adventure"
    }
    
    for row in results:
        resort, user = row if len(row) == 2 else (row[0], None)
        company_name = user.name if user else "Unknown Company"
        
        resorts_list.append({
            "resort_id": str(resort.resort_id),
            "name": resort.name,
            "city": resort.city,
            "country": resort.country,
            "price": float(resort.price),
            "status": status_map.get(resort.status, "unknown"),
            "type": type_map.get(resort.type, "unknown"),
            "instagram_link": resort.instagram_link,
            "facebook_link": resort.facebook_link,
            "googlemap_link": resort.googlemap_link,
            "company_name": company_name,
            "image_name": resort.image_name
        })
    
    return {"resorts": resorts_list, "count": len(resorts_list)}

@app.put("/resorts-with-image/{resort_id}")
async def update_resort_with_image(
    resort_id: str,
    company_id: str = Form(...),
    name: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    country: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    status: Optional[str] = Form(None),
    type: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    instagram_link: Optional[str] = Form(None),
    facebook_link: Optional[str] = Form(None),
    googlemap_link: Optional[str] = Form(None),
    db=Depends(get_db)
):
    """
    Update resort details with optional image. Only the company that owns the resort can update it.
    """
    # Validate resort_id is a valid UUID
    try:
        resort_uuid = uuid.UUID(resort_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid resort ID format")
    
    # Validate company_id is a valid UUID
    try:
        company_uuid = uuid.UUID(company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid company ID format")
    
    # Find the resort
    resort = db.query(ResortWithImage).filter_by(resort_id=resort_uuid).first()
    if not resort:
        raise HTTPException(status_code=404, detail="Resort not found")
    
    # Verify the company owns this resort
    if resort.company_id != company_uuid:
        raise HTTPException(status_code=403, detail="You do not have permission to update this resort")
    
    # Verify the company exists and is actually a Company type
    company = db.query(User).filter_by(user_id=company_uuid).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if company.type != UserType.COMPANY:
        raise HTTPException(status_code=403, detail="Only companies can update resorts")
    
    # Update fields if provided
    if name is not None:
        resort.name = name
    
    if city is not None:
        resort.city = city
    
    if country is not None:
        resort.country = country
    
    if price is not None:
        if price <= 0:
            raise HTTPException(status_code=400, detail="Price must be greater than 0")
        resort.price = price
    
    if status is not None:
        status_mapping = {
            'full': ResortStatus.FULL,
            'not full': ResortStatus.NOT_FULL,
            'open': ResortStatus.OPEN,
            'closed': ResortStatus.CLOSED
        }
        resort_status = status_mapping.get(status.lower())
        if not resort_status:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {list(status_mapping.keys())}")
        resort.status = resort_status
    
    if type is not None:
        type_mapping = {
            'hotel': ResortType.HOTEL,
            'adventure': ResortType.ADVENTURE
        }
        resort_type = type_mapping.get(type.lower())
        if not resort_type:
            raise HTTPException(status_code=400, detail=f"Invalid type. Must be one of: {list(type_mapping.keys())}")
        resort.type = resort_type
    
    # Handle image update if provided
    if image and image.filename:
        # Delete old image if exists
        if resort.image_name:
            old_image_path = PICTURES_DIR / resort.image_name
            if old_image_path.exists():
                old_image_path.unlink()
        
        # Validate file type
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
        file_ext = Path(image.filename).suffix.lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}")
        
        # Validate file size (max 10MB)
        contents = await image.read()
        if len(contents) > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        image_filename = f"{resort_uuid}_{timestamp}{file_ext}"
        image_path = PICTURES_DIR / image_filename
        
        # Save file
        with open(image_path, "wb") as buffer:
            buffer.write(contents)
        
        resort.image_name = image_filename
    
    # Update link fields if provided
    if instagram_link is not None:
        resort.instagram_link = instagram_link if instagram_link else None
    
    if facebook_link is not None:
        resort.facebook_link = facebook_link if facebook_link else None
    
    if googlemap_link is not None:
        resort.googlemap_link = googlemap_link if googlemap_link else None
    
    # Map enum values to strings for response
    status_map = {
        ResortStatus.FULL: "full",
        ResortStatus.NOT_FULL: "not full",
        ResortStatus.OPEN: "open",
        ResortStatus.CLOSED: "closed"
    }
    
    type_map = {
        ResortType.HOTEL: "hotel",
        ResortType.ADVENTURE: "adventure"
    }
    
    db.commit()
    db.refresh(resort)
    
    return {
        "resort_id": str(resort.resort_id),
        "name": resort.name,
        "city": resort.city,
        "country": resort.country,
        "price": float(resort.price),
        "status": status_map.get(resort.status, "unknown"),
        "type": type_map.get(resort.type, "unknown"),
        "image_name": resort.image_name,
        "instagram_link": resort.instagram_link,
        "facebook_link": resort.facebook_link,
        "googlemap_link": resort.googlemap_link,
        "message": "Resort updated successfully"
    }

@app.delete("/resorts-with-image/{resort_id}")
def delete_resort_with_image(resort_id: str, company_id: str, db=Depends(get_db)):
    """
    Delete a resort with image. Only the company that owns the resort can delete it.
    """
    # Validate resort_id is a valid UUID
    try:
        resort_uuid = uuid.UUID(resort_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid resort ID format")
    
    # Validate company_id is a valid UUID
    try:
        company_uuid = uuid.UUID(company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid company ID format")
    
    # Find the resort
    resort = db.query(ResortWithImage).filter_by(resort_id=resort_uuid).first()
    if not resort:
        raise HTTPException(status_code=404, detail="Resort not found")
    
    # Verify the company owns this resort
    if resort.company_id != company_uuid:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this resort")
    
    # Delete associated image file if exists
    if resort.image_name:
        image_path = PICTURES_DIR / resort.image_name
        if image_path.exists():
            image_path.unlink()
    
    # Delete the resort
    db.delete(resort)
    db.commit()
    
    return {
        "message": "Resort deleted successfully"
    }

@app.get("/images/{filename}")
def get_image(filename: str):
    """
    Serve resort images from the pictures directory.
    """
    image_path = PICTURES_DIR / filename
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    
    return FileResponse(image_path)

@app.get("/pdfs/{filename}")
def get_pdf(filename: str):
    pdf_path = PDFS_DIR / filename
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF not found")
    return FileResponse(pdf_path, media_type="application/pdf", filename=filename)

# ==================== BLOG ENDPOINTS ====================

# Ensure blog_images directory exists
BLOG_IMAGES_DIR = Path("blog_images")
BLOG_IMAGES_DIR.mkdir(exist_ok=True)

@app.post("/blogs")
async def create_blog(
    company_id: str = Form(...),
    resort_id: str = Form(...),
    caption: str = Form(...),
    image: Optional[UploadFile] = File(None),
    db=Depends(get_db)
):
    """
    Create a new blog post for a resort. company_id and resort_id should be passed as form fields.
    """
    # Validate company_id is a valid UUID
    try:
        company_uuid = uuid.UUID(company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid company ID format")
    
    # Validate resort_id is a valid UUID
    try:
        resort_uuid = uuid.UUID(resort_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid resort ID format")
    
    # Verify the company exists and is actually a Company type
    company = db.query(User).filter_by(user_id=company_uuid).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if company.type != UserType.COMPANY:
        raise HTTPException(status_code=403, detail="Only companies can create blogs")
    
    # Verify the resort exists and belongs to the company
    resort = db.query(ResortWithImage).filter_by(resort_id=resort_uuid).first()
    if not resort:
        raise HTTPException(status_code=404, detail="Resort not found")
    
    if resort.company_id != company_uuid:
        raise HTTPException(status_code=403, detail="You can only create blogs for your own resorts")
    
    # Validate caption
    if not caption or len(caption.strip()) == 0:
        raise HTTPException(status_code=400, detail="Caption cannot be empty")
    
    # Generate unique blog ID
    blog_uuid = uuid.uuid4()
    image_filename = None
    
    # Handle image upload if provided
    if image and image.filename:
        # Validate file type
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
        file_ext = Path(image.filename).suffix.lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}")
        
        # Validate file size (max 10MB)
        contents = await image.read()
        if len(contents) > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
        
        # Generate unique filename (uuid.png)
        image_filename = f"{blog_uuid}.png"
        image_path = BLOG_IMAGES_DIR / image_filename
        
        # Save file
        with open(image_path, "wb") as buffer:
            buffer.write(contents)
    
    # Create blog
    blog = Blog(
        blog_id=blog_uuid,
        company_id=company_uuid,
        resort_id=resort_uuid,
        caption=caption.strip(),
        image_name=image_filename
    )
    
    db.add(blog)
    db.commit()
    db.refresh(blog)
    
    return {
        "blog_id": str(blog.blog_id),
        "company_id": str(blog.company_id),
        "resort_id": str(blog.resort_id),
        "caption": blog.caption,
        "image_name": blog.image_name,
        "created_at": blog.created_at.isoformat(),
        "message": "Blog created successfully"
    }

@app.get("/blogs")
def get_blogs(company_id: Optional[str] = None, resort_id: Optional[str] = None, db=Depends(get_db)):
    """
    Get all blogs, optionally filtered by company_id or resort_id.
    """
    query = db.query(Blog).outerjoin(ResortWithImage, Blog.resort_id == ResortWithImage.resort_id).add_entity(ResortWithImage)
    
    if company_id:
        try:
            company_uuid = uuid.UUID(company_id)
            query = query.filter(Blog.company_id == company_uuid)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid company ID format")
    
    if resort_id:
        try:
            resort_uuid = uuid.UUID(resort_id)
            query = query.filter(Blog.resort_id == resort_uuid)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid resort ID format")
    
    results = query.order_by(Blog.created_at.desc()).all()
    
    blogs_list = []
    for row in results:
        blog, resort = row if len(row) == 2 else (row[0], None)
        resort_name = resort.name if resort else "Unknown Resort"
        
        blogs_list.append({
            "blog_id": str(blog.blog_id),
            "company_id": str(blog.company_id),
            "resort_id": str(blog.resort_id),
            "resort_name": resort_name,
            "caption": blog.caption,
            "image_name": blog.image_name,
            "created_at": blog.created_at.isoformat()
        })
    
    return {"blogs": blogs_list, "count": len(blogs_list)}

@app.delete("/blogs/{blog_id}")
async def delete_blog(blog_id: str, company_id: str, db=Depends(get_db)):
    """Delete a blog post by blog_id. Only the company that created it can delete it."""
    import uuid as uuidlib
    try:
        blog_uuid = uuidlib.UUID(blog_id)
        company_uuid = uuidlib.UUID(company_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid IDs.")

    blog = db.query(Blog).filter_by(blog_id=blog_uuid, company_id=company_uuid).first()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found or you do not have permission to delete it.")
    db.delete(blog)
    db.commit()
    return {"message": "Blog deleted successfully."}

@app.get("/blog-images/{filename}")
def get_blog_image(filename: str):
    """
    Serve blog images from the blog_images directory.
    """
    image_path = BLOG_IMAGES_DIR / filename
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    
    return FileResponse(image_path)

@app.get("/user/{user_id}")
def get_user_profile(user_id: str, db=Depends(get_db)):
    """
    Get user profile information.
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    user = db.query(User).filter_by(user_id=user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "user_id": str(user.user_id),
        "name": user.name,
        "phonenumber": user.phonenumber,
        "email": user.email,
        "type": str(user.type)
    }

@app.put("/user/profile")
def update_user_profile(req: UpdateProfileRequest, db=Depends(get_db)):
    """
    Update user profile fields except password.
    """
    try:
        user_uuid = uuid.UUID(req.user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    user = db.query(User).filter_by(user_id=user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.name = req.name
    user.phonenumber = req.phonenumber
    user.email = req.email
    db.commit()
    db.refresh(user)
    return {
        "user_id": str(user.user_id),
        "name": user.name,
        "phonenumber": user.phonenumber,
        "email": user.email,
        "type": str(user.type)
    }

@app.put("/user/password")
def update_user_password(req: UpdatePasswordRequest, db=Depends(get_db)):
    """
    Update user password.
    """
    try:
        user_uuid = uuid.UUID(req.user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    user = db.query(User).filter_by(user_id=user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Hash the new password before storing
    hashed_password = hash_password(req.new_password)
    user.password = hashed_password
    db.commit()
    return {"message": "Password updated successfully."}

@app.delete("/user/{user_id}")
def delete_user(user_id: str, db=Depends(get_db)):
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    user = db.query(User).filter_by(user_id=user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "Account deleted"}

@app.get("/companies-with-revenue")
def get_companies_with_revenue(db=Depends(get_db)):
    """
    Get all registered companies with their total revenue calculated from bookings.
    """
    # Get all users with type Company
    companies = db.query(User).filter_by(type=UserType.COMPANY).all()
    
    companies_list = []
    
    for company in companies:
        # Calculate total revenue by summing total_price from all bookings for this company
        total_revenue = db.query(func.sum(Booking.total_price)).filter_by(company_id=company.user_id).scalar()
        
        # If no bookings, revenue is 0
        revenue = float(total_revenue) if total_revenue is not None else 0.0
        
        # Count number of resorts for this company
        resort_count = db.query(func.count(ResortWithImage.resort_id)).filter_by(company_id=company.user_id).scalar()
        resort_count = int(resort_count) if resort_count is not None else 0
        
        # Count number of bookings for this company
        booking_count = db.query(func.count(Booking.booking_id)).filter_by(company_id=company.user_id).scalar()
        booking_count = int(booking_count) if booking_count is not None else 0
        
        companies_list.append({
            "company_id": str(company.user_id),
            "name": company.name,
            "email": company.email,
            "revenue": revenue,
            "resort_count": resort_count,
            "booking_count": booking_count
        })
    
    return {"companies": companies_list, "count": len(companies_list)}

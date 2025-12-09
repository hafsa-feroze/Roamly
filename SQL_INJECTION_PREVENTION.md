# SQL Injection Prevention via ORM Parameterized Queries

## Where SQL Injection Prevention is Used in This Project

SQLAlchemy ORM **automatically uses parameterized queries** (also called prepared statements) whenever you use methods like `.filter_by()`, `.filter()`, or pass parameters to queries. This prevents SQL injection attacks.

---

## ✅ **Safe Examples from Your Codebase**

### **1. Login Endpoint (Line 154)**
```python
@app.post("/login")
def login(req: LoginRequest, db=Depends(get_db)):
    user = db.query(User).filter_by(email=req.email).first()
```

**Why it's safe:** 
- `.filter_by(email=req.email)` automatically parameterizes the `req.email` value
- Even if `req.email` contains malicious SQL like `' OR '1'='1`, it's treated as a string literal, not executable SQL
- SQLAlchemy generates: `SELECT * FROM users WHERE email = ?` with `req.email` as a parameter

**Vulnerable alternative (RAW SQL - DON'T DO THIS):**
```python
# ❌ DANGEROUS - SQL Injection vulnerability
query = f"SELECT * FROM users WHERE email = '{req.email}'"
db.execute(query)  # If email is: ' OR '1'='1, this would return all users!
```

---

### **2. Signup - Email Duplicate Check (Line 134)**
```python
@app.post("/signup")
def signup(req: SignupRequest, db=Depends(get_db)):
    if db.query(User).filter_by(email=req.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
```

**Why it's safe:**
- `.filter_by(email=req.email)` uses parameterized queries
- The email value is bound as a parameter, not concatenated into SQL string

---

### **3. Get User Bookings (Line 360)**
```python
@app.get("/bookings/user")
def get_user_bookings(user_id: str, db=Depends(get_db)):
    user_uuid = uuid.UUID(user_id)  # Validates UUID format first
    bookings = db.query(Booking).filter_by(user_id=user_uuid).order_by(Booking.booking_date.desc()).all()
```

**Why it's safe:**
- `.filter_by(user_id=user_uuid)` parameterizes the UUID
- UUID validation (`uuid.UUID(user_id)`) adds extra security layer
- Even if conversion fails, raises ValueError before query execution

---

### **4. Get Notifications (Line 238)**
```python
@app.get("/notifications")
def get_notifications(company_id: str, db=Depends(get_db)):
    company_uuid = uuid.UUID(company_id)  # Validation
    notifications = db.query(Notification).filter_by(company_id=company_uuid).order_by(Notification.created_at.desc()).all()
```

**Why it's safe:**
- Parameterized query via `.filter_by(company_id=company_uuid)`
- UUID validation prevents invalid input

---

### **5. Get Resorts by Company (Line 839)**
```python
@app.get("/resorts-with-image")
def get_resorts_with_image(company_id: Optional[str] = None, country: Optional[str] = None, db=Depends(get_db)):
    if company_id:
        company_uuid = uuid.UUID(company_id)
        query = query.filter(ResortWithImage.company_id == company_uuid)
```

**Why it's safe:**
- `.filter(ResortWithImage.company_id == company_uuid)` uses parameterized queries
- SQLAlchemy translates `==` to SQL `WHERE company_id = ?` with parameter binding

---

### **6. Revenue Calculation (Line 1354)**
```python
@app.get("/companies-with-revenue")
def get_companies_with_revenue(db=Depends(get_db)):
    for company in companies:
        total_revenue = db.query(func.sum(Booking.total_price)).filter_by(company_id=company.user_id).scalar()
```

**Why it's safe:**
- `.filter_by(company_id=company.user_id)` parameterizes the value
- Aggregate functions like `func.sum()` are also safe when used with ORM

---

### **7. Get Blogs (Line 1197)**
```python
@app.get("/blogs")
def get_blogs(company_id: Optional[str] = None, resort_id: Optional[str] = None, db=Depends(get_db)):
    query = db.query(Blog).outerjoin(ResortWithImage, Blog.resort_id == ResortWithImage.resort_id)
    
    if company_id:
        company_uuid = uuid.UUID(company_id)
        query = query.filter(Blog.company_id == company_uuid)
```

**Why it's safe:**
- `.filter(Blog.company_id == company_uuid)` uses parameterized queries
- Join operations are safe when using ORM relationships

---

## ⚠️ **Potential Concern (Still Safe, But Could Be Better)**

### **Country Filter with String Formatting (Line 844)**
```python
if country:
    query = query.filter(ResortWithImage.country.ilike(f"%{country}%"))
```

**Current status:** Still safe because SQLAlchemy ORM parameterizes even when using f-strings in filter expressions. The `%` wildcards are part of the SQL LIKE pattern, not user input being directly inserted.

**Better practice (More explicit):**
```python
if country:
    query = query.filter(ResortWithImage.country.ilike(f"%{country}%"))
    # OR even better:
    # query = query.filter(ResortWithImage.country.ilike(concat('%', country, '%')))
```

However, this is **still safe** because SQLAlchemy handles the parameterization internally.

---

## 🔒 **How SQLAlchemy ORM Prevents SQL Injection**

### **1. Parameterized Queries (Prepared Statements)**

When you write:
```python
db.query(User).filter_by(email=req.email).first()
```

SQLAlchemy internally generates:
```sql
SELECT * FROM users WHERE email = ?   -- PostgreSQL: WHERE email = $1
-- Parameter value: req.email (bound separately)
```

**The SQL command structure and parameter values are kept separate**, so malicious input can't modify the SQL structure.

---

### **2. Type Safety**

SQLAlchemy uses Python types that map to SQL types:
- `uuid.UUID` → SQL UUID type
- `int` → SQL INTEGER
- `str` → SQL VARCHAR/TEXT
- ORM validates types before execution

---

### **3. Query Builder Pattern**

ORM query builder methods (`.filter_by()`, `.filter()`, `.join()`) generate SQL safely:
- No string concatenation
- Automatic escaping of special characters
- Proper handling of NULL values

---

## 📊 **Comparison: Safe vs Vulnerable**

| ✅ **Safe (ORM)** | ❌ **Vulnerable (Raw SQL)** |
|-------------------|----------------------------|
| `db.query(User).filter_by(email=email).first()` | `db.execute(f"SELECT * FROM users WHERE email = '{email}'")` |
| `db.query(Booking).filter_by(user_id=user_id).all()` | `db.execute(f"SELECT * FROM bookings WHERE user_id = {user_id}")` |
| `query.filter(Resort.name.ilike(f"%{search}%"))` | `db.execute(f"SELECT * FROM resorts WHERE name LIKE '%{search}%'")` |

---

## 🎯 **Key Points for Viva**

1. **Every `.filter_by()` and `.filter()` call in your project uses parameterized queries**
2. **UUID validation** (`uuid.UUID()`) adds an extra layer of security
3. **Pydantic models** validate input before it reaches the database
4. **SQLAlchemy ORM automatically handles parameterization** - you don't need to manually escape values
5. **Even string formatting in filters is safe** because SQLAlchemy still parameterizes the final query

---

## 📍 **All Safe Locations in Your Code**

| Line | Endpoint | Method | Protection |
|------|----------|--------|------------|
| 134 | `/signup` | `filter_by(email=req.email)` | ✅ Parameterized |
| 154 | `/login` | `filter_by(email=req.email)` | ✅ Parameterized |
| 204 | `/admin/signup` | `filter_by(email=req.email)` | ✅ Parameterized |
| 233 | `/notifications` | `filter_by(user_id=company_uuid)` | ✅ Parameterized + UUID validation |
| 238 | `/notifications` | `filter_by(company_id=company_uuid)` | ✅ Parameterized + UUID validation |
| 247, 252, 257 | `/notifications` | Multiple `filter_by()` calls | ✅ All parameterized |
| 306 | `/notifications/{id}` | `filter_by(notification_id=...)` | ✅ Parameterized + UUID validation |
| 339 | `/bookings/count` | `filter_by(company_id=...)` | ✅ Parameterized + UUID validation |
| 355, 360 | `/bookings/user` | `filter_by(user_id=...)` | ✅ Parameterized + UUID validation |
| 368, 373 | `/bookings/user` | `filter_by(resort_id=...)` | ✅ Parameterized |
| 423, 428 | `/bookings/company` | `filter_by(...)` | ✅ Parameterized + UUID validation |
| 498, 507 | `/bookings` POST | `filter_by(...)` | ✅ Parameterized + UUID validation |
| 744, 745 | `/resorts-with-image` POST | `filter_by(user_id=...)` | ✅ Parameterized + UUID validation |
| 839 | `/resorts-with-image` GET | `filter(company_id == ...)` | ✅ Parameterized + UUID validation |
| 844 | `/resorts-with-image` GET | `filter(country.ilike(...))` | ✅ Parameterized (f-string safe) |
| 913, 922 | `/resorts-with-image/{id}` PUT | `filter_by(...)` | ✅ Parameterized + UUID validation |
| 1055, 1064 | `/resorts-with-image/{id}` DELETE | `filter_by(...)` | ✅ Parameterized + UUID validation |
| 1125, 1133 | `/blogs` POST | `filter_by(...)` | ✅ Parameterized + UUID validation |
| 1197 | `/blogs` GET | `filter(...)` | ✅ Parameterized + UUID validation |
| 1242 | `/blogs/{id}` DELETE | `filter_by(blog_id=..., company_id=...)` | ✅ Parameterized + UUID validation |
| 1270, 1292, 1319, 1335 | User endpoints | `filter_by(user_id=...)` | ✅ Parameterized + UUID validation |
| 1354, 1360, 1364 | `/companies-with-revenue` | `filter_by(company_id=...)` | ✅ Parameterized |

**All 37+ query operations in your codebase use parameterized queries!** ✅

---

## 💡 **Answer for Viva**

**Q: Where did you use SQL injection prevention via ORM parameterized queries?**

**A:** 
*"SQL injection prevention is automatically implemented throughout the entire backend because we use SQLAlchemy ORM exclusively. Every database query in our codebase uses ORM methods like `filter_by()` or `filter()`, which internally use parameterized queries (prepared statements).*

*For example, in the login endpoint, when we query `db.query(User).filter_by(email=req.email)`, SQLAlchemy automatically parameterizes the email value. Even if a malicious user tried to inject SQL like `' OR '1'='1`, it would be treated as a literal string value, not executable SQL.*

*Additionally, we validate UUIDs before using them in queries using `uuid.UUID()`, which adds an extra layer of security. Pydantic models also validate input types before data reaches the database layer.*

*We never use raw SQL string concatenation anywhere in the codebase, which would be vulnerable to SQL injection. All queries go through SQLAlchemy ORM, ensuring automatic protection."*

---

## 🔍 **How to Verify**

You can see the actual parameterized SQL being generated by enabling SQLAlchemy logging:
```python
import logging
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
```

This will show queries like:
```
SELECT users.user_id, users.email, users.password 
FROM users 
WHERE users.email = ?  -- Parameter: 'test@example.com'
```

Notice the `?` placeholder - that's the parameterized query in action!



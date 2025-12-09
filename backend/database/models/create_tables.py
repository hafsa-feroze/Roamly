from sqlalchemy import create_engine
from .base import Base
from .user import User
from .resort_with_image import ResortWithImage
from .booking import Booking
from .notification import Notification
from .blog import Blog
import os
from dotenv import load_dotenv

# Load environment variables from .env file (assume it's in backend directory)
load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')

engine = create_engine(DATABASE_URL)

if __name__ == "__main__":
    # Import all models to ensure they're registered with Base
    Base.metadata.create_all(engine)
    print("Tables created successfully!")

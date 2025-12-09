from enum import Enum

class UserType(Enum):
    USER = "user"
    COMPANY = "company"
    ADMIN = "admin"

class ResortStatus(Enum):
    FULL = "full"
    NOT_FULL = "not full"
    OPEN = "open"
    CLOSED = "closed"

class ResortType(Enum):
    HOTEL = "hotel"
    ADVENTURE = "adventure"




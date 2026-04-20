from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    designation: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    designation: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
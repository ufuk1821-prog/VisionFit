from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    ad: str
    soyad: str
    email: EmailStr
    sifre: str

class UserLogin(BaseModel):
    email: EmailStr
    sifre: str
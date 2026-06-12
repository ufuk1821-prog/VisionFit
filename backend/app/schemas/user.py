from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional

class UserCreate(BaseModel):
    ad: str
    soyad: str
    email: EmailStr
    sifre: str

class UserLogin(BaseModel):
    email: EmailStr
    sifre: str

class UserProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ad: str
    soyad: str
    email: EmailStr
    boy: Optional[float] = None
    kilo: Optional[float] = None
    yas: Optional[int] = None
    cinsiyet: Optional[str] = None
    aktiflik_seviyesi: Optional[str] = None
    hedef: Optional[str] = None

class UserProfileUpdate(BaseModel):
    ad: Optional[str] = None
    soyad: Optional[str] = None
    boy: Optional[float] = None
    kilo: Optional[float] = None
    yas: Optional[int] = None
    cinsiyet: Optional[str] = None
    aktiflik_seviyesi: Optional[str] = None
    hedef: Optional[str] = None
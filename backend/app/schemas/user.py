import re
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from typing import Optional

class UserCreate(BaseModel):
    ad: str
    soyad: str
    email: EmailStr
    sifre: str

    @field_validator("sifre")
    @classmethod
    def sifre_kontrol(cls, v):
        if len(v) < 8:
            raise ValueError("Şifre en az 8 karakter olmalıdır.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Şifre en az 1 büyük harf içermelidir.")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=]', v):
            raise ValueError("Şifre en az 1 özel karakter içermelidir.")
        return v

class UserLogin(BaseModel):
    email: EmailStr
    sifre: str

class ResendVerificationRequest(BaseModel):
    email: EmailStr

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

class PasswordChangeRequest(BaseModel):
    mevcut_sifre: str
    yeni_sifre: str
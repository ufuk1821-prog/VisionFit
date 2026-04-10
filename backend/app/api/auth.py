from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_sifre, sifre_dogrula, token_olustur
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin

router = APIRouter(prefix="/api/auth", tags=["Kimlik Dogrulama"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if len(user.sifre) < 6:
        raise HTTPException(status_code=400, detail="Sifre en az 6 karakter olmalidir")
    
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Bu email zaten kayitli")
    
    new_user = User(
        ad=user.ad, 
        soyad=user.soyad, 
        email=user.email, 
        sifre=hash_sifre(user.sifre)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"mesaj": "Kullanici basariyla kaydedildi", "kullanici": {"id": new_user.id, "email": new_user.email}}

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not sifre_dogrula(user.sifre, db_user.sifre):
        raise HTTPException(status_code=400, detail="Gecersiz email veya sifre")
    
    token = token_olustur({"sub": db_user.email})
    return {"mesaj": "Giris basarili", "token": token}
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.core.security import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Kimlik Dogrulama"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_data: dict, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_data.get("email")).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Bu email zaten kayitli.")
    
    new_user = User(
        ad=user_data.get("ad"),
        soyad=user_data.get("soyad"),
        email=user_data.get("email"),
        sifre=get_password_hash(user_data.get("sifre"))
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"mesaj": "Kayit basarili", "user": new_user.email}

@router.post("/login")
def login(user_data: dict, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.get("email")).first()
    if not user or not verify_password(user_data.get("sifre"), user.sifre):
        raise HTTPException(status_code=400, detail="Gecersiz email veya sifre")
    
    token = create_access_token(data={"sub": user.email})
    return {"mesaj": "Giris basarili", "token": token}
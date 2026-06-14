import os
import secrets
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.limiter import limiter
from app.schemas.user import UserCreate, UserLogin, ResendVerificationRequest
from app.services.email import send_verification_email

router = APIRouter(prefix="/api/auth", tags=["Kimlik Dogrulama"])

IS_TESTING = os.getenv("TESTING") == "True"


@router.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def register(request: Request, user_data: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Bu email zaten kayıtlı.")

    if IS_TESTING:
        email_dogrulandi = True
        dogrulama_token = None
    else:
        email_dogrulandi = False
        dogrulama_token = secrets.token_urlsafe(32)

    new_user = User(
        ad=user_data.ad,
        soyad=user_data.soyad,
        email=user_data.email,
        sifre=get_password_hash(user_data.sifre),
        email_dogrulandi=email_dogrulandi,
        dogrulama_token=dogrulama_token,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if not IS_TESTING:
        send_verification_email(new_user.email, new_user.ad, dogrulama_token)

    return {
        "mesaj": "Kayıt başarılı",
        "user": new_user.email,
        "email_dogrulama_gerekli": not email_dogrulandi,
    }


@router.post("/login")
@limiter.limit("10/minute")
def login(request: Request, user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.sifre, user.sifre):
        raise HTTPException(status_code=400, detail="Geçersiz email veya şifre")

    if not user.email_dogrulandi:
        raise HTTPException(status_code=403, detail="E-posta adresiniz doğrulanmamış. Lütfen gelen kutunuzu kontrol edin.")

    token = create_access_token(data={"sub": user.email})
    return {"mesaj": "Giriş başarılı", "token": token}


@router.get("/verify-email/{token}")
def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.dogrulama_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Geçersiz veya süresi dolmuş doğrulama bağlantısı.")

    user.email_dogrulandi = True
    user.dogrulama_token = None
    db.commit()
    return {"mesaj": "E-posta adresiniz başarıyla doğrulandı."}


@router.post("/resend-verification")
def resend_verification(data: ResendVerificationRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if user and not user.email_dogrulandi:
        token = secrets.token_urlsafe(32)
        user.dogrulama_token = token
        db.commit()
        if not IS_TESTING:
            send_verification_email(user.email, user.ad, token)

    return {"mesaj": "Eğer bu e-posta kayıtlıysa ve doğrulanmamışsa, yeni bir doğrulama bağlantısı gönderildi."}
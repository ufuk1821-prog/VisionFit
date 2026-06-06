import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from app.core.database import get_db
from app.models.user import User
from app.core.security import get_password_hash, verify_password, create_access_token
from app.schemas.user import UserCreate, UserLogin

router = APIRouter(prefix="/api/auth", tags=["Kimlik Dogrulama"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Kimlik dogrulanamadi",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        secret_key = os.getenv("JWT_SECRET", "super_secret_crypto_key_998877")
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Bu email zaten kayitli.")
    
    new_user = User(
        ad=user_data.ad,
        soyad=user_data.soyad,
        email=user_data.email,
        sifre=get_password_hash(user_data.sifre)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"mesaj": "Kayit basarili", "user": new_user.email}

@router.post("/login")
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.sifre, user.sifre):
        raise HTTPException(status_code=400, detail="Gecersiz email veya sifre")
    
    token = create_access_token(data={"sub": user.email})
    return {"mesaj": "Giris basarili", "token": token}
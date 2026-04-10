from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import bcrypt
from jose import jwt
from datetime import datetime, timedelta, timezone
import os

import backend.app.models.user as user, schemas
from backend.app.core.database import engine, get_db
from dotenv import load_dotenv

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    user.Base.metadata.create_all(bind=engine)
    print("\n" + "="*60)
    print("Veritabani ve Tablolar Basariyla Senkronize Edildi")
    print("Sunucu Ayaga Kalkti: http://127.0.0.1:8000")
    print("API Dokumantasyonu icin: http://127.0.0.1:8000/docs")
    print("="*60 + "\n")
    yield

app = FastAPI(
    title="VisionFit API",
    description="Yapay Zeka Destekli Akilli Fitness Sistemi Backend Motoru",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"

@app.get("/", tags=["Genel"])
def root():
    return {"mesaj": "VisionFit FastAPI Motoru Calisiyor"}

@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED, tags=["Kimlik Dogrulama"])
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if len(user.sifre) < 6:
        raise HTTPException(status_code=400, detail="Sifre en az 6 karakter olmalidir")
    
    db_user = db.query(user.User).filter(user.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Bu email zaten kayitli")
    
    hashed_password = bcrypt.hashpw(user.sifre.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    new_user = user.User(ad=user.ad, soyad=user.soyad, email=user.email, sifre=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"mesaj": "Kullanici basariyla kaydedildi", "kullanici": {"id": new_user.id, "email": new_user.email}}

@app.post("/api/auth/login", tags=["Kimlik Dogrulama"])
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(user.User).filter(user.User.email == user.email).first()
    
    if not db_user or not bcrypt.checkpw(user.sifre.encode('utf-8'), db_user.sifre.encode('utf-8')):
        raise HTTPException(status_code=400, detail="Gecersiz email veya sifre")
    
    expire = datetime.now(timezone.utc) + timedelta(hours=1)
    to_encode = {"sub": db_user.email, "exp": expire}
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return {"mesaj": "Giris basarili", "token": token}
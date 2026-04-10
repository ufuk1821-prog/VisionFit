import os
import bcrypt
from jose import jwt
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"

def hash_sifre(sifre: str) -> str:
    return bcrypt.hashpw(sifre.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def sifre_dogrula(sifre: str, hashed_sifre: str) -> bool:
    return bcrypt.checkpw(sifre.encode('utf-8'), hashed_sifre.encode('utf-8'))

def token_olustur(data: dict):
    expire = datetime.now(timezone.utc) + timedelta(hours=1)
    to_encode = data.copy()
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
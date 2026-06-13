import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from app.core.database import engine, Base
from app.api import auth, news, users, steps, badges, nutrition
from app.api.analyze import router as analyze_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    max_retries = 5
    for i in range(max_retries):
        try:
            Base.metadata.create_all(bind=engine)
            with engine.connect() as conn:
                conn.execute(text('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS boy FLOAT'))
                conn.execute(text('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS kilo FLOAT'))
                conn.execute(text('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS yas INTEGER'))
                conn.execute(text('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS cinsiyet VARCHAR(20)'))
                conn.execute(text('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS aktiflik_seviyesi VARCHAR(30)'))
                conn.execute(text('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS hedef VARCHAR(30)'))
                conn.execute(text('ALTER TABLE workout_history ADD COLUMN IF NOT EXISTS user_id INTEGER'))
                conn.commit()
            break
        except OperationalError:
            time.sleep(2)
    yield

app = FastAPI(
    title="VisionFit API",
    version="2.0.0",
    lifespan=lifespan
)

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://visionfit-backend.onrender.com",
    "https://vision-fit-git-main-ufuk1821-s-projects.vercel.app",
    "https://vision-fit-ashy.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(news.router)
app.include_router(users.router)
app.include_router(steps.router)
app.include_router(badges.router)
app.include_router(nutrition.router)
app.include_router(analyze_router, prefix="/api/analyze", tags=["Analyze"])

@app.get("/")
def root():
    return {"status": "VisionFit API Aktif ve Calisiyor!"}
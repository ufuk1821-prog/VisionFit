import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.database import engine, Base
from app.core.limiter import limiter
from app.api import auth, users, steps, badges, nutrition, workout_notes, local_llm, exercise_images
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
                conn.execute(text('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS email_dogrulandi BOOLEAN DEFAULT TRUE'))
                conn.execute(text('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS dogrulama_token VARCHAR(100)'))
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

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
app.include_router(users.router)
app.include_router(steps.router)
app.include_router(badges.router)
app.include_router(nutrition.router)
app.include_router(workout_notes.router)
app.include_router(exercise_images.router)
app.include_router(local_llm.router)
app.include_router(analyze_router, prefix="/api/analyze", tags=["Analyze"])

@app.get("/")
def root():
    return {"status": "VisionFit API Aktif ve Calisiyor!"}
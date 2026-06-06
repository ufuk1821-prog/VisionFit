import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy.exc import OperationalError
from app.core.database import engine, Base
from app.api.analyze import router as analyze_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    max_retries = 5
    for i in range(max_retries):
        try:
            Base.metadata.create_all(bind=engine)
            break
        except OperationalError:
            time.sleep(2)
    yield

app = FastAPI(
    title="VisionFit API",
    version="1.5.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router, prefix="/api/analyze", tags=["Analyze"])

@app.get("/")
def root():
    return {"status": "VisionFit API Aktif ve Calisiyor!"}
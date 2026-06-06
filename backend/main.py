from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import engine, Base
from app.api import auth, news
from app.api.analyze import router as analyze_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.drop_all(bind=engine) 
    
    Base.metadata.create_all(bind=engine)
    print("\n" + "="*60)
    print("VISIONFIT BACKEND AKTİF")
    print("Veritabani Sifirlandi ve Yeniden Kuruldu!")
    print("="*60 + "\n")
    yield

app = FastAPI(
    title="VisionFit API - Vize",
    description="Katmanli Mimari, Otomatik Tablo Yönetimi",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(news.router)
app.include_router(analyze_router, prefix="/api/analyze", tags=["Yapay Zeka Analiz"])

@app.get("/", tags=["Genel"])
def root():
    return {"mesaj": "VisionFit API Sorunsuz Calisiyor"}
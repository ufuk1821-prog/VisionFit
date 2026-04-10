from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import engine, Base
from app.api import auth, news

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    print("\n" + "="*60)
    print("VISIONFIT BACKEND: VİZE SEVİYESİ AKTİF (%60 Tamamlandi)")
    print("Modüller: Auth, News, AnalysisHistory")
    print("="*60 + "\n")
    yield

app = FastAPI(
    title="VisionFit API - Vize Sürümü",
    description="Katmanli Mimari ve Genisletilmis Veritabani Semasi",
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

app.include_router(auth.router)
app.include_router(news.router)

@app.get("/", tags=["Genel"])
def root():
    return {"durum": "VisionFit Vize API Calisiyor", "versiyon": "1.5.0"}
from pydantic import BaseModel

class DietRecommendation(BaseModel):
    bmi: float
    kategori: str
    gunluk_kalori_onerisi: int
    oneri_mesaji: str
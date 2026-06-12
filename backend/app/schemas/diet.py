from pydantic import BaseModel
from typing import List

class DietPlan(BaseModel):
    baslik: str
    kalori: int
    protein_g: int
    karbonhidrat_g: int
    yag_g: int
    ornek_ogunler: List[str]

class DietRecommendation(BaseModel):
    bmi: float
    bmi_kategori: str
    bmr: int
    tdee: int
    hedef_kalori: int
    hedef: str
    planlar: List[DietPlan]

class DietCustomRequest(BaseModel):
    istek: str

class DietCustomResponse(BaseModel):
    oneri: str
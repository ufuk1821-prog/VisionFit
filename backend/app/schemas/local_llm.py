from pydantic import BaseModel
from typing import Dict, List


class AntrenorYorumuRequest(BaseModel):
    skorlar: Dict[str, int]


class DiyetOnerisiRequest(BaseModel):
    bmi: float
    bmi_kategori: str
    hedef: str
    hedef_kalori: int
    protein_g: int
    karbonhidrat_g: int
    yag_g: int
    istek: str


class DefterAnaliziRequest(BaseModel):
    hareket: str
    agirliklar: List[float]
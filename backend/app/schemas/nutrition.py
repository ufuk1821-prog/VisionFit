from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class FoodItem(BaseModel):
    anahtar: str
    ad: str
    protein: float
    karbonhidrat: float
    yag: float

class MealLogCreate(BaseModel):
    ogun_tipi: str
    besin_anahtari: str
    gram: float
    tarih: Optional[str] = None

class MealLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ogun_tipi: str
    besin_anahtari: str
    besin_adi: str
    gram: float
    kalori: float
    protein_g: float
    karbonhidrat_g: float
    yag_g: float
    tarih: datetime

class WaterLogCreate(BaseModel):
    miktar_ml: int
    tarih: Optional[str] = None
    
class WaterLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    miktar_ml: int
    tarih: datetime
from pydantic import BaseModel
from typing import Dict, List, Optional, Union


class AntrenorYorumuRequest(BaseModel):
    hareket: str
    genel_skor: float
    kategori_skorlari: Dict[str, float]


class GecmisOturum(BaseModel):
    kategori_skorlari: Dict[str, float]
    agirlik: Optional[float] = None


class GecmisAnaliziRequest(BaseModel):
    hareket: str
    gecmis_antrenmanlar: List[GecmisOturum]


class DiyetProfil(BaseModel):
    yas: Optional[int] = None
    cinsiyet: Optional[str] = None
    boy_cm: Optional[int] = None
    kilo_kg: Optional[int] = None
    aktivite_duzeyi: Optional[str] = None
    hedef: Optional[str] = None
    hedef_kalori: Optional[int] = None


class DiyetPlan(BaseModel):
    plan_adi: Optional[str] = None
    kahvalti: List[str] = []
    ogle: List[str] = []
    aksam: List[str] = []
    ara_ogun: List[str] = []
    gunluk_kalori: Optional[Union[int, str]] = None
    porsiyon_bilgisi: Optional[Union[str, dict]] = None


class DiyetOnerisiRequest(BaseModel):
    profil: DiyetProfil
    plan: DiyetPlan
    kullanici_notu: Optional[str] = ""
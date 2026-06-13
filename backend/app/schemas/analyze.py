from pydantic import BaseModel
from typing import List, Optional

class PoseData(BaseModel):
    landmarks: List[float]

class SessionData(BaseModel):
    frames: List[List[float]]

class KategoriSonuc(BaseModel):
    skor: float
    mesaj: str

class SessionResult(BaseModel):
    toplam_kare: int
    squat_kare: int
    genel_skor: float
    genel_form: KategoriSonuc
    diz_hizasi: KategoriSonuc
    omurga_notrluğu: KategoriSonuc
    kalca_derinligi: KategoriSonuc
    diz_cokusu: KategoriSonuc
    agirlik_merkezi: KategoriSonuc
    olumlu_mesaj: str
    gelistirilecek_mesaj: str
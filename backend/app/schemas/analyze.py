from pydantic import BaseModel, Field
from typing import List


class PoseData(BaseModel):
    landmarks: List[float] = Field(
        ...,
        min_length=132,
        description="33 MediaPipe landmark x (x, y, z, visibility) = 132 değer.",
    )


class SessionData(BaseModel):
    frames: List[List[float]] = Field(
        ...,
        min_length=1,
        description="Her biri en az 132 değer içeren poz kareleri.",
    )


class KategoriSonuc(BaseModel):
    skor: float = Field(..., ge=0, le=100)
    mesaj: str


class SessionResult(BaseModel):
    toplam_kare: int
    squat_kare: int
    genel_skor: float = Field(..., ge=0, le=100)
    genel_form: KategoriSonuc
    diz_hizasi: KategoriSonuc
    omurga_notrluğu: KategoriSonuc
    kalca_derinligi: KategoriSonuc
    agirlik_merkezi: KategoriSonuc
    olumlu_mesaj: str
    gelistirilecek_mesaj: str


class BicepsCurlSessionResult(BaseModel):
    toplam_kare: int
    analiz_kare: int
    genel_skor: float = Field(..., ge=0, le=100)
    dirsek_sabitligi: KategoriSonuc
    govde_salinimi: KategoriSonuc
    hareket_acikligi: KategoriSonuc
    bilek_hizasi: KategoriSonuc
    olumlu_mesaj: str
    gelistirilecek_mesaj: str


class DeadliftSessionResult(BaseModel):
    toplam_kare: int
    analiz_kare: int
    genel_skor: float = Field(..., ge=0, le=100)
    omurga_notrluğu: KategoriSonuc
    kalca_pozisyonu: KategoriSonuc
    bar_yolu: KategoriSonuc
    denge: KategoriSonuc
    olumlu_mesaj: str
    gelistirilecek_mesaj: str

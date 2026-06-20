import os
import requests
from fastapi import APIRouter, Depends
from app.core.security import get_current_user

router = APIRouter(prefix="/api/exercise-images", tags=["Egzersiz Görselleri"])

PEXELS_API_KEY = os.getenv("PEXELS_API_KEY", "")
PEXELS_URL = "https://api.pexels.com/v1/search"

_cache = {}


@router.get("/{sorgu}")
async def gorsel_getir(sorgu: str, current_user=Depends(get_current_user)):
    if not PEXELS_API_KEY:
        return {"url": None}

    anahtar = sorgu.lower().strip()
    if anahtar in _cache:
        return {"url": _cache[anahtar]}

    try:
        yanit = requests.get(
            PEXELS_URL,
            params={
                "query": f"{sorgu} gym exercise workout",
                "per_page": 1,
                "orientation": "landscape",
            },
            headers={"Authorization": PEXELS_API_KEY},
            timeout=10,
        )
        veri = yanit.json()
        sonuclar = veri.get("photos", [])

        if not sonuclar:
            _cache[anahtar] = None
            return {"url": None}

        url = sonuclar[0]["src"]["large"]
        _cache[anahtar] = url
        return {"url": url}
    except Exception:
        return {"url": None}
import os
import requests
from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user

router = APIRouter(prefix="/api/exercise-images", tags=["Egzersiz Görselleri"])

UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY", "")
UNSPLASH_URL = "https://api.unsplash.com/search/photos"

_cache = {}


@router.get("/{sorgu}")
async def gorsel_getir(sorgu: str, current_user=Depends(get_current_user)):
    if not UNSPLASH_ACCESS_KEY:
        return {"url": None}

    anahtar = sorgu.lower().strip()
    if anahtar in _cache:
        return {"url": _cache[anahtar]}

    try:
        yanit = requests.get(
            UNSPLASH_URL,
            params={
                "query": f"{sorgu} exercise gym",
                "per_page": 1,
                "orientation": "landscape",
            },
            headers={"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"},
            timeout=10,
        )
        veri = yanit.json()
        sonuclar = veri.get("results", [])

        if not sonuclar:
            _cache[anahtar] = None
            return {"url": None}

        url = sonuclar[0]["urls"]["regular"]
        _cache[anahtar] = url
        return {"url": url}
    except Exception:
        return {"url": None}

import argparse
import hashlib
import json
import math
import random
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


SEED = 20260621

HAREKET_ETIKETLERI = {
    "squat": "Squat",
    "deadlift": "Deadlift",
    "biceps_curl": "Biceps Curl",
}

HAREKET_KATEGORILERI = {
    "squat": [
        "Omurga Nötrlüğü",
        "Kalça Derinliği",
        "Diz Hizası",
        "Diz Çöküşü",
        "Ağırlık Merkezi",
    ],
    "deadlift": [
        "Omurga Nötrlüğü",
        "Kalça Pozisyonu",
        "Bar Yolu",
        "Denge",
    ],
    "biceps_curl": [
        "Dirsek Sabitliği",
        "Gövde Salınımı Kontrolü",
        "Hareket Açıklığı",
        "Bilek Hizası",
    ],
}

KATEGORI_GUCLU_IFADELERI = {
    "Omurga Nötrlüğü": [
        "sırt ve bel hizasının hareket boyunca kontrollü kaldığını gösteriyor",
        "gövde hattını koruma konusunda başarılı olduğunu gösteriyor",
        "omurga pozisyonunu istikrarlı biçimde koruduğunu gösteriyor",
    ],
    "Kalça Derinliği": [
        "hareket açıklığını yeterli düzeyde kullandığını gösteriyor",
        "iniş derinliğini kontrollü biçimde tamamladığını gösteriyor",
        "çömelme derinliğinin güçlü bir seviyede olduğunu gösteriyor",
    ],
    "Diz Hizası": [
        "dizlerini ayak yönüyle uyumlu tuttuğunu gösteriyor",
        "diz hattını hareket boyunca dengeli koruduğunu gösteriyor",
        "dizlerin doğru çizgide ilerlediğini gösteriyor",
    ],
    "Diz Çöküşü": [
        "dizlerin içe kapanmasını iyi kontrol ettiğini gösteriyor",
        "yanal diz stabilitesinin güçlü olduğunu gösteriyor",
        "dizlerinin hareket boyunca dengeli kaldığını gösteriyor",
    ],
    "Ağırlık Merkezi": [
        "denge ve yük dağılımını iyi koruduğunu gösteriyor",
        "ayak tabanı basıncını kontrollü dağıttığını gösteriyor",
        "iniş ve kalkış boyunca dengeni koruduğunu gösteriyor",
    ],
    "Kalça Pozisyonu": [
        "başlangıç ve çekiş sırasında kalça konumunu iyi koruduğunu gösteriyor",
        "kalça konumunun hareket boyunca tutarlı kaldığını gösteriyor",
        "kalça kontrolünün kaldırışa olumlu katkı sağladığını gösteriyor",
    ],
    "Bar Yolu": [
        "barı kontrollü ve vücuda yakın bir hatta taşıdığını gösteriyor",
        "barın doğrusal ve tutarlı bir yol izlediğini gösteriyor",
        "bar kontrolünün deadlift boyunca güçlü olduğunu gösteriyor",
    ],
    "Denge": [
        "yük dağılımını hareket boyunca dengeli tuttuğunu gösteriyor",
        "kaldırış sırasında kontrolünü koruduğunu gösteriyor",
        "ayak tabanı ve gövde dengesinin güçlü olduğunu gösteriyor",
    ],
    "Dirsek Sabitliği": [
        "dirseklerini gövde yanında tutarlı biçimde koruduğunu gösteriyor",
        "dirsek kontrolünün hareket boyunca güçlü olduğunu gösteriyor",
        "dirseklerin öne kaçmasını iyi sınırladığını gösteriyor",
    ],
    "Gövde Salınımı Kontrolü": [
        "gövde momentumunu iyi kontrol ettiğini gösteriyor",
        "hareketi sallanmadan tamamladığını gösteriyor",
        "gövde sabitliğinin biceps curl boyunca güçlü olduğunu gösteriyor",
    ],
    "Hareket Açıklığı": [
        "tekrarları yeterli hareket aralığında tamamladığını gösteriyor",
        "alt ve üst pozisyonları kontrollü kullandığını gösteriyor",
        "hareket genişliğinin güçlü olduğunu gösteriyor",
    ],
    "Bilek Hizası": [
        "bileğini nötr ve kontrollü tuttuğunu gösteriyor",
        "bilek pozisyonunun tekrarlar boyunca tutarlı olduğunu gösteriyor",
        "bilek kontrolünün hareket kalitesini desteklediğini gösteriyor",
    ],
}

KATEGORI_ONERILERI = {
    "Omurga Nötrlüğü": [
        "Sırt ve bel hizasını hareket boyunca sabit tutmaya odaklan.",
        "Gövde hattını korumak için başlangıç pozisyonunu daha kontrollü kur.",
        "Omurga pozisyonunu her tekrarda aynı çizgide korumaya çalış.",
    ],
    "Kalça Derinliği": [
        "İniş derinliğini kontrollü biçimde ve kademeli olarak geliştirmeye odaklan.",
        "Hareket açıklığını bozmadan kalçanı biraz daha aşağı indirmeye çalış.",
        "Derinliği artırırken denge ve gövde kontrolünü koru.",
    ],
    "Diz Hizası": [
        "Dizlerini ayak yönüyle aynı çizgide tutmaya odaklan.",
        "İniş ve kalkış sırasında diz hattını daha tutarlı koru.",
        "Dizlerin öne veya yana kaçmasını azaltacak kontrollü tekrarlar yap.",
    ],
    "Diz Çöküşü": [
        "Dizlerinin içe kapanmamasına ve dışarı doğru dengeli kalmasına odaklan.",
        "İniş sırasında dizlerini ayak yönüyle aynı hatta tut.",
        "Diz stabilitesini korumak için hareketi daha kontrollü tamamla.",
    ],
    "Ağırlık Merkezi": [
        "Yükü ayak tabanına dengeli dağıtmaya odaklan.",
        "İniş ve kalkışta ağırlık merkezinin öne kaymasını azalt.",
        "Topuk, orta ayak ve parmak tabanı temasını dengeli koru.",
    ],
    "Kalça Pozisyonu": [
        "Başlangıçta kalça konumunu daha tutarlı kurmaya odaklan.",
        "Çekiş boyunca kalçanın erken yükselmesini veya geride kalmasını azalt.",
        "Kalça ve gövde konumunu kaldırış boyunca birlikte kontrol et.",
    ],
    "Bar Yolu": [
        "Barı vücuda yakın ve mümkün olduğunca doğrusal bir hatta tutmaya odaklan.",
        "Barın çekiş sırasında öne uzaklaşmasını azalt.",
        "Bar yolunu başlangıçtan kilitlemeye kadar tutarlı koru.",
    ],
    "Denge": [
        "Yükü iki ayağa eşit dağıtmaya ve gövde kontrolünü korumaya odaklan.",
        "Kaldırış boyunca denge noktanı sabit tut.",
        "Başlangıç ve bitiş pozisyonları arasında yük dağılımını daha tutarlı koru.",
    ],
    "Dirsek Sabitliği": [
        "Dirseklerini gövde yanında sabit tutmaya odaklan.",
        "Dirseklerin öne veya yana kaçmasını azalt.",
        "Omuz hareketini sınırlayıp dirsek konumunu her tekrarda koru.",
    ],
    "Gövde Salınımı Kontrolü": [
        "Gövde momentumunu azaltıp hareketi kol kontrolüyle tamamlamaya odaklan.",
        "Öne ve arkaya sallanmayı azaltarak gövdeni sabit tut.",
        "Tekrar boyunca karın ve gövde kontrolünü koru.",
    ],
    "Hareket Açıklığı": [
        "Tekrarları kontrollü ve yeterli hareket aralığında tamamlamaya odaklan.",
        "Alt ve üst pozisyonlarda hareketi yarım bırakmamaya çalış.",
        "Her tekrarda benzer hareket açıklığını koru.",
    ],
    "Bilek Hizası": [
        "Bileğini nötr ve sabit bir pozisyonda tutmaya odaklan.",
        "Tekrarın üst bölümünde bileğin bükülmesini azalt.",
        "Kavrama boyunca bilek hizasını kontrollü koru.",
    ],
}

TEK_ANTRENMAN_SENARYOLARI = [
    "yüksek_dengeli",
    "tek_zayıf",
    "iki_zayıf",
    "kritik_bir_alan",
    "orta_seviye",
    "karışık",
]

GECMIS_SENARYOLARI = [
    "düzenli_yükseliş",
    "düzenli_düşüş",
    "son_oturumda_ani_düşüş",
    "uzun_süreli_plato",
    "ağırlık_artarken_form_düşüşü",
    "ağırlık_sabitken_form_gelişimi",
    "bir_kategori_gelişirken_diğeri_geriliyor",
    "son_tekrarlarda_yorgunluk",
]

ANTRENOR_TALIMATLARI = [
    (
        "Aşağıdaki VisionFit antrenman analizini değerlendir. "
        "Yalnızca geçerli JSON üret. Hareket adını ve kategori adlarını değiştirme. "
        "Verilmeyen ağırlık, ağrı, sakatlık, tekrar veya ekipman bilgisi uydurma."
    ),
    (
        "Verilen hareket ve kategori skorlarına göre Türkçe AI antrenör analizi oluştur. "
        "Yanıt yalnızca JSON olmalı. En güçlü ve geliştirilmesi gereken kategori adlarını "
        "girdideki biçimiyle kullan."
    ),
    (
        "VisionFit skorlarını inceleyerek kısa ve yapıcı bir antrenör değerlendirmesi yaz. "
        "Sadece JSON döndür ve başka bir hareketten söz etme."
    ),
]

GECMIS_TALIMATLARI = [
    (
        "Aşağıdaki geçmiş antrenman oturumlarını karşılaştır. "
        "Sayısal değişimleri doğru yorumla ve yalnızca geçerli JSON üret. "
        "Hareket ve kategori adlarını değiştirme."
    ),
    (
        "VisionFit geçmiş antrenman verilerindeki yükseliş, düşüş, plato, ani düşüş "
        "ve ağırlık-form ilişkisini değerlendir. Yanıt yalnızca JSON olmalı."
    ),
    (
        "Geçmiş oturumları kategori bazında analiz ederek Türkçe gelişim yorumu üret. "
        "Verilmeyen bilgileri uydurma ve sadece JSON döndür."
    ),
]

DIYET_TALIMATLARI = [
    (
        "Aşağıdaki seçilmiş diyet planını kullanıcı profili ve kullanıcı notuna göre değerlendir. "
        "Protein dağılımı, sebze, meyve, lif, kalori veya porsiyon bilgisini kontrol et. "
        "Alerji veya tercih çelişkisini açıkça belirt. Yalnızca geçerli JSON üret."
    ),
    (
        "VisionFit tarafından seçilen diyet planını analiz et. "
        "Kullanıcı notu ile plan arasında uyumsuzluk varsa belirt, bilgi yoksa uydurma. "
        "Yanıt yalnızca JSON olmalı."
    ),
    (
        "Kullanıcı profili, hedefi ve seçilen plan içeriğine göre Türkçe diyet değerlendirmesi oluştur. "
        "Hazır övgü yerine gerçek eksikleri ve uyumları belirt. Sadece JSON döndür."
    ),
]

DIYET_SENARYOLARI = [
    "dengeli_uyumlu",
    "kahvaltı_proteini_eksik",
    "öğle_proteini_eksik",
    "sebze_eksik",
    "meyve_eksik",
    "lif_düşük",
    "kalori_porsiyon_belirsiz",
    "kalori_hedefi_uyumsuz",
    "yumurta_alerjisi_uyumlu",
    "laktoz_uyumlu",
    "gluten_uyumlu",
    "vejetaryen_uyumlu",
    "vegan_uyumlu",
    "kuruyemiş_alerjisi_uyumlu",
    "balık_tercihi_uyumlu",
    "yumurta_alerjisi_çelişkisi",
    "laktoz_çelişkisi",
    "gluten_çelişkisi",
    "vejetaryen_çelişkisi",
    "vegan_çelişkisi",
    "kuruyemiş_alerjisi_çelişkisi",
    "balık_tercihi_çelişkisi",
    "hazırlama_süresi_çelişkisi",
    "çoklu_eksik",
]

MEAL_OPTIONS = {
    "kahvalti": [
        {"ad": "Yumurtalı omlet, domates ve tam tahıllı ekmek", "etiketler": {"protein", "egg", "vegetable", "fiber", "gluten"}, "sure": 15},
        {"ad": "Yoğurt, yulaf ve elma", "etiketler": {"protein", "dairy", "fiber", "fruit", "gluten"}, "sure": 5},
        {"ad": "Peynirli tam tahıllı tost ve salatalık", "etiketler": {"protein", "dairy", "fiber", "vegetable", "gluten"}, "sure": 10},
        {"ad": "Tofu karışımı, domates ve glutensiz ekmek", "etiketler": {"protein", "vegan", "vegetable", "fiber"}, "sure": 15},
        {"ad": "Soya yoğurdu, muz ve chia", "etiketler": {"protein", "vegan", "fruit", "fiber"}, "sure": 5},
        {"ad": "Fındık ezmeli ekmek ve muz", "etiketler": {"nuts", "fruit", "gluten"}, "sure": 5},
        {"ad": "Çay ve beyaz ekmek", "etiketler": {"gluten"}, "sure": 3},
        {"ad": "Sade pirinç patlağı ve kahve", "etiketler": set(), "sure": 3},
    ],
    "ogle": [
        {"ad": "Izgara tavuk, bulgur ve salata", "etiketler": {"protein", "meat", "gluten", "vegetable", "fiber"}, "sure": 30},
        {"ad": "Mercimek yemeği, pirinç ve salata", "etiketler": {"protein", "vegan", "vegetable", "fiber"}, "sure": 25},
        {"ad": "Ton balıklı salata ve tam tahıllı ekmek", "etiketler": {"protein", "fish", "vegetable", "fiber", "gluten"}, "sure": 10},
        {"ad": "Nohutlu kinoa salatası", "etiketler": {"protein", "vegan", "vegetable", "fiber"}, "sure": 20},
        {"ad": "Köfte, patates ve yoğurt", "etiketler": {"protein", "meat", "dairy"}, "sure": 35},
        {"ad": "Peynirli makarna", "etiketler": {"protein", "dairy", "gluten"}, "sure": 20},
        {"ad": "Normal makarna ve domates sosu", "etiketler": {"gluten"}, "sure": 15},
        {"ad": "Pirinç pilavı", "etiketler": set(), "sure": 15},
    ],
    "aksam": [
        {"ad": "Fırında somon, sebze ve patates", "etiketler": {"protein", "fish", "vegetable", "fiber"}, "sure": 40},
        {"ad": "Izgara hindi, pirinç ve brokoli", "etiketler": {"protein", "meat", "vegetable", "fiber"}, "sure": 30},
        {"ad": "Kuru fasulye, bulgur ve salata", "etiketler": {"protein", "vegan", "gluten", "vegetable", "fiber"}, "sure": 30},
        {"ad": "Tofu, sebze ve pirinç", "etiketler": {"protein", "vegan", "vegetable", "fiber"}, "sure": 25},
        {"ad": "Biftek ve patates", "etiketler": {"protein", "meat"}, "sure": 40},
        {"ad": "Yoğurtlu sebze yemeği ve ekmek", "etiketler": {"protein", "dairy", "vegetable", "fiber", "gluten"}, "sure": 25},
        {"ad": "Kremalı makarna", "etiketler": {"dairy", "gluten"}, "sure": 20},
        {"ad": "Beyaz ekmek ve çorba", "etiketler": {"gluten"}, "sure": 15},
    ],
    "ara_ogun": [
        {"ad": "Elma ve kefir", "etiketler": {"fruit", "fiber", "protein", "dairy"}, "sure": 2},
        {"ad": "Muz ve yoğurt", "etiketler": {"fruit", "fiber", "protein", "dairy"}, "sure": 2},
        {"ad": "Fındık ve mandalina", "etiketler": {"nuts", "fruit", "fiber"}, "sure": 1},
        {"ad": "Havuç ve humus", "etiketler": {"vegetable", "fiber", "protein", "vegan"}, "sure": 5},
        {"ad": "Soya sütü ve elma", "etiketler": {"protein", "vegan", "fruit", "fiber"}, "sure": 2},
        {"ad": "Pirinç patlağı", "etiketler": set(), "sure": 1},
        {"ad": "Şekersiz çay", "etiketler": set(), "sure": 1},
    ],
}

KULLANICI_NOTLARI = {
    "yok": {"metin": "", "yasak": set()},
    "yumurta": {"metin": "Yumurtaya alerjim var.", "yasak": {"egg"}},
    "laktoz": {"metin": "Laktoz intoleransım var.", "yasak": {"dairy"}},
    "gluten": {"metin": "Glutensiz besleniyorum.", "yasak": {"gluten"}},
    "vejetaryen": {"metin": "Vejetaryen besleniyorum.", "yasak": {"meat", "fish"}},
    "vegan": {"metin": "Vegan besleniyorum.", "yasak": {"meat", "fish", "egg", "dairy"}},
    "kuruyemis": {"metin": "Fındık ve fıstığa alerjim var.", "yasak": {"nuts"}},
    "balik": {"metin": "Balık sevmiyorum.", "yasak": {"fish"}},
    "hazirlama": {"metin": "Yemek hazırlamak için en fazla 15 dakikam var.", "yasak": set(), "max_sure": 15},
}

TR_MAP = str.maketrans({
    "ç": "c", "ğ": "g", "ı": "i", "ö": "o", "ş": "s", "ü": "u",
    "Ç": "c", "Ğ": "g", "İ": "i", "I": "i", "Ö": "o", "Ş": "s", "Ü": "u",
})


def compact_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def normalize_text(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "").translate(TR_MAP).lower()).strip()


def clip(value: float, low: int = 15, high: int = 100) -> int:
    return int(max(low, min(high, round(value))))


def seviye_belirle(score: int) -> str:
    if score < 40:
        return "kritik"
    if score < 60:
        return "zayıf"
    if score < 75:
        return "geliştirilmeli"
    if score < 88:
        return "iyi"
    return "çok_iyi"


def genel_skor_hesapla(scores: dict[str, int]) -> int:
    return clip(sum(scores.values()) / len(scores) + random.uniform(-2.0, 2.0))


def skor_dizisi(start: int, end: int, n: int, jitter: int = 1) -> list[int]:
    if n == 1:
        return [clip(end)]

    values = []
    for index in range(n):
        ratio = index / (n - 1)
        value = start + (end - start) * ratio + random.randint(-jitter, jitter)
        values.append(clip(value))

    values[0] = clip(start)
    values[-1] = clip(end)
    return values



def guclu_zayif_belirle(scores: dict[str, int]) -> tuple[str, str]:
    ordered = sorted(scores, key=lambda category: (scores[category], category))
    return ordered[-1], ordered[0]


def tek_antrenman_skorlari_uret(
    movement: str,
    scenario: str,
) -> dict[str, int]:
    categories = HAREKET_KATEGORILERI[movement]

    if scenario == "yüksek_dengeli":
        scores = {category: random.randint(80, 96) for category in categories}

    elif scenario == "tek_zayıf":
        scores = {category: random.randint(76, 94) for category in categories}
        weak = random.choice(categories)
        scores[weak] = random.randint(45, 64)

    elif scenario == "iki_zayıf":
        scores = {category: random.randint(74, 91) for category in categories}
        for weak in random.sample(categories, 2):
            scores[weak] = random.randint(42, 63)

    elif scenario == "kritik_bir_alan":
        scores = {category: random.randint(64, 86) for category in categories}
        weak = random.choice(categories)
        scores[weak] = random.randint(20, 38)

    elif scenario == "orta_seviye":
        scores = {category: random.randint(58, 78) for category in categories}

    else:
        scores = {category: random.randint(45, 94) for category in categories}

    return scores


def tek_antrenman_yorumu(
    movement: str,
    general_score: int,
    scores: dict[str, int],
    strongest: str,
    weakest: str,
) -> str:
    label = HAREKET_ETIKETLERI[movement]
    strong_score = scores[strongest]
    weak_score = scores[weakest]
    strong_phrase = random.choice(KATEGORI_GUCLU_IFADELERI[strongest])
    advice = random.choice(KATEGORI_ONERILERI[weakest])

    templates = [
        (
            f"{label} analizinde genel skorun {general_score}. "
            f"{strongest}, {strong_score} puanla en güçlü alan olarak öne çıkıyor ve {strong_phrase}. "
            f"{weakest}, {weak_score} puanla geliştirilmesi gereken temel nokta. "
            f"{advice} Güçlü yönünü korurken bu alana odaklanman formunu daha dengeli hâle getirecektir."
        ),
        (
            f"Bu {label} oturumunda {strongest} {strong_score} puanla en başarılı kategori oldu; bu sonuç {strong_phrase}. "
            f"Buna karşılık {weakest} {weak_score} puanda kaldı. "
            f"{advice} Genel skorun {general_score} olduğu için düzenli ve kontrollü tekrarlarla ilerlemeye devam edebilirsin."
        ),
        (
            f"{label} hareketindeki kategori skorlarını inceledim. "
            f"{strongest} alanındaki {strong_score} puan güçlü bir kontrol gösterirken, {weakest} alanındaki {weak_score} puan gelişim ihtiyacını gösteriyor. "
            f"{advice} Genel skorun {general_score}; bu iki alan arasındaki farkı azaltmak daha dengeli bir form sağlayacaktır."
        ),
    ]

    return random.choice(templates)


def tek_antrenman_ornegi_uret(
    movement: str,
    scenario: str,
) -> dict[str, Any]:
    scores = tek_antrenman_skorlari_uret(movement, scenario)
    general_score = genel_skor_hesapla(scores)
    strongest, weakest = guclu_zayif_belirle(scores)

    input_payload = {
        "tip": "antrenor",
        "hareket": movement,
        "genel_skor": general_score,
        "kategori_skorlari": {
            "Genel Form": general_score,
            **scores,
        },
        "kullanici_notu": "",
    }

    output_payload = {
        "tip": "antrenor",
        "hareket": movement,
        "genel_seviye": seviye_belirle(general_score),
        "guclu_alan": strongest,
        "gelistirilecek_alan": weakest,
        "yorum": tek_antrenman_yorumu(
            movement,
            general_score,
            scores,
            strongest,
            weakest,
        ),
    }

    return {
        "instruction": random.choice(ANTRENOR_TALIMATLARI),
        "input": compact_json(input_payload),
        "output": compact_json(output_payload),
    }


def gecmis_oturumlari_uret(
    movement: str,
    scenario: str,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    categories = HAREKET_KATEGORILERI[movement]
    n = random.randint(4, 7)
    category_series: dict[str, list[int]] = {}
    weights: list[float | None] = [None] * n
    repeat_scores: list[int] | None = None

    if scenario == "düzenli_yükseliş":
        for category in categories:
            start = random.randint(45, 64)
            end = min(96, start + random.randint(13, 25))
            category_series[category] = skor_dizisi(start, end, n)

    elif scenario == "düzenli_düşüş":
        for category in categories:
            start = random.randint(76, 94)
            end = max(35, start - random.randint(13, 25))
            category_series[category] = skor_dizisi(start, end, n)

    elif scenario == "son_oturumda_ani_düşüş":
        for category in categories:
            base = random.randint(72, 89)
            values = [clip(base + random.randint(-2, 2)) for _ in range(n - 1)]
            values.append(clip(base - random.randint(16, 30)))
            category_series[category] = values

    elif scenario == "uzun_süreli_plato":
        for category in categories:
            base = random.randint(60, 80)
            category_series[category] = [clip(base + random.randint(-2, 2)) for _ in range(n)]

    elif scenario == "ağırlık_artarken_form_düşüşü":
        start_weight = random.choice([20, 30, 40, 50, 60, 80])
        step = random.choice([2.5, 5.0])
        weights = [start_weight + step * index for index in range(n)]

        for category in categories:
            start = random.randint(76, 92)
            end = max(38, start - random.randint(12, 24))
            category_series[category] = skor_dizisi(start, end, n)

    elif scenario == "ağırlık_sabitken_form_gelişimi":
        weight = random.choice([15, 20, 30, 40, 50, 60])
        weights = [weight] * n

        for category in categories:
            start = random.randint(45, 66)
            end = min(95, start + random.randint(13, 25))
            category_series[category] = skor_dizisi(start, end, n)

    elif scenario == "bir_kategori_gelişirken_diğeri_geriliyor":
        improved, declined = random.sample(categories, 2)

        for category in categories:
            if category == improved:
                start = random.randint(45, 62)
                end = min(95, start + random.randint(18, 30))
            elif category == declined:
                start = random.randint(75, 92)
                end = max(35, start - random.randint(18, 30))
            else:
                start = random.randint(62, 82)
                end = clip(start + random.randint(-3, 3))

            category_series[category] = skor_dizisi(start, end, n)

    else:
        for category in categories:
            base = random.randint(68, 84)
            category_series[category] = [clip(base + random.randint(-3, 3)) for _ in range(n)]

        repeat_count = random.choice([6, 8, 10])
        start_repeat = random.randint(86, 94)
        repeat_scores = [
            clip(start_repeat - int((index / max(1, repeat_count - 1)) * random.randint(18, 30)))
            for index in range(repeat_count)
        ]
        repeat_scores[0] = start_repeat
        repeat_scores[-1] = clip(start_repeat - random.randint(20, 30))

    sessions = []

    for index in range(n):
        current_scores = {
            category: category_series[category][index]
            for category in categories
        }
        general = genel_skor_hesapla(current_scores)
        session = {
            "sira": index + 1,
            "genel_skor": general,
            "kategori_skorlari": {
                "Genel Form": general,
                **current_scores,
            },
        }

        if weights[index] is not None:
            session["agirlik_kg"] = weights[index]

        if repeat_scores is not None and index == n - 1:
            session["tekrar_skorlari"] = repeat_scores

        sessions.append(session)

    first_scores = sessions[0]["kategori_skorlari"]
    last_scores = sessions[-1]["kategori_skorlari"]
    deltas = {
        category: last_scores[category] - first_scores[category]
        for category in categories
    }

    strongest, weakest = guclu_zayif_belirle(
        {category: last_scores[category] for category in categories}
    )

    positive_deltas = {key: value for key, value in deltas.items() if value > 0}
    negative_deltas = {key: value for key, value in deltas.items() if value < 0}

    most_improved = max(positive_deltas, key=positive_deltas.get) if positive_deltas else ""
    most_declined = min(negative_deltas, key=negative_deltas.get) if negative_deltas else ""

    summary = {
        "n": n,
        "first_general": sessions[0]["genel_skor"],
        "last_general": sessions[-1]["genel_skor"],
        "strongest": strongest,
        "weakest": weakest,
        "most_improved": most_improved,
        "most_declined": most_declined,
        "deltas": deltas,
        "weights": weights,
        "repeat_scores": repeat_scores,
    }

    return sessions, summary


def gecmis_yorumu(
    movement: str,
    scenario: str,
    summary: dict[str, Any],
) -> str:
    label = HAREKET_ETIKETLERI[movement]
    n = summary["n"]
    first_general = summary["first_general"]
    last_general = summary["last_general"]
    strongest = summary["strongest"]
    weakest = summary["weakest"]
    improved = summary["most_improved"]
    declined = summary["most_declined"]
    deltas = summary["deltas"]
    weights = summary["weights"]
    repeat_scores = summary["repeat_scores"]

    if scenario == "düzenli_yükseliş":
        trend_sentence = (
            f"Son {n} {label} oturumunda Genel Form {first_general} puandan "
            f"{last_general} puana düzenli biçimde yükseldi."
        )
    elif scenario == "düzenli_düşüş":
        trend_sentence = (
            f"Son {n} {label} oturumunda Genel Form {first_general} puandan "
            f"{last_general} puana düzenli biçimde düştü."
        )
    elif scenario == "son_oturumda_ani_düşüş":
        trend_sentence = (
            f"{label} geçmişi önceki oturumlarda dengeli ilerlerken son oturumda "
            f"Genel Form {last_general} puana ani biçimde düştü."
        )
    elif scenario == "uzun_süreli_plato":
        trend_sentence = (
            f"Son {n} {label} oturumunda Genel Form {first_general} ile "
            f"{last_general} puan arasında kaldı ve belirgin bir plato oluştu."
        )
    elif scenario == "ağırlık_artarken_form_düşüşü":
        trend_sentence = (
            f"{label} ağırlığı {weights[0]:g} kg'dan {weights[-1]:g} kg'a yükselirken "
            f"Genel Form {first_general} puandan {last_general} puana düştü."
        )
    elif scenario == "ağırlık_sabitken_form_gelişimi":
        trend_sentence = (
            f"{label} ağırlığı {weights[0]:g} kg'da sabit kalırken Genel Form "
            f"{first_general} puandan {last_general} puana yükseldi."
        )
    elif scenario == "bir_kategori_gelişirken_diğeri_geriliyor":
        trend_sentence = (
            f"{label} geçmişinde {improved} {deltas[improved]:+d} puan gelişirken "
            f"{declined} {deltas[declined]:+d} puan geriledi."
        )
    else:
        trend_sentence = (
            f"Son {label} oturumunda tekrar skorları {repeat_scores[0]} puandan "
            f"{repeat_scores[-1]} puana indi; son tekrarlarda yorgunluk kaynaklı form düşüşü görülüyor."
        )

    improvement_sentence = (
        f"En fazla gelişen kategori {improved} oldu."
        if improved
        else "Kategori skorlarında belirgin bir gelişim alanı oluşmadı."
    )
    decline_sentence = (
        f"En fazla gerileyen kategori {declined} oldu."
        if declined
        else "Kategori skorlarında belirgin bir gerileme oluşmadı."
    )

    return (
        f"{trend_sentence} Son oturumda {strongest} en güçlü alan, "
        f"{weakest} ise geliştirilmesi gereken alan olarak öne çıkıyor. "
        f"{improvement_sentence} {decline_sentence} "
        f"{random.choice(KATEGORI_ONERILERI[weakest])}"
    )


def gecmis_ornegi_uret(
    movement: str,
    scenario: str,
) -> dict[str, Any]:
    sessions, summary = gecmis_oturumlari_uret(movement, scenario)

    input_payload = {
        "tip": "antrenor",
        "hareket": movement,
        "gecmis_antrenmanlar": sessions,
        "kullanici_notu": "",
    }

    output_payload = {
        "tip": "antrenor",
        "hareket": movement,
        "trend": scenario,
        "guclu_alan": summary["strongest"],
        "gelistirilecek_alan": summary["weakest"],
        "en_fazla_gelisen": summary["most_improved"],
        "en_fazla_gerileyen": summary["most_declined"],
        "yorum": gecmis_yorumu(movement, scenario, summary),
    }

    return {
        "instruction": random.choice(GECMIS_TALIMATLARI),
        "input": compact_json(input_payload),
        "output": compact_json(output_payload),
    }


def activity_factor(level: str) -> float:
    return {
        "Düşük": 1.2,
        "Hafif aktif": 1.375,
        "Orta aktif": 1.55,
        "Çok aktif": 1.725,
    }[level]


def hedef_kalori_hesapla(
    age: int,
    gender: str,
    height: int,
    weight: int,
    activity: str,
    goal: str,
) -> int:
    if gender == "Erkek":
        bmr = 10 * weight + 6.25 * height - 5 * age + 5
    else:
        bmr = 10 * weight + 6.25 * height - 5 * age - 161

    maintenance = bmr * activity_factor(activity)

    if goal == "Kilo vermek":
        maintenance -= 400
    elif goal == "Kilo almak":
        maintenance += 300

    return int(round(maintenance / 50) * 50)


def option_is_allowed(option: dict[str, Any], forbidden: set[str]) -> bool:
    return not bool(option["etiketler"] & forbidden)


def choose_option(
    slot: str,
    forbidden: set[str],
    require_tags: set[str] | None = None,
    forbid_tags: set[str] | None = None,
) -> dict[str, Any]:
    require_tags = require_tags or set()
    forbid_tags = forbid_tags or set()

    candidates = [
        option
        for option in MEAL_OPTIONS[slot]
        if option_is_allowed(option, forbidden)
        and require_tags.issubset(option["etiketler"])
        and not bool(option["etiketler"] & forbid_tags)
    ]

    if not candidates:
        candidates = [
            option
            for option in MEAL_OPTIONS[slot]
            if option_is_allowed(option, forbidden)
            and not bool(option["etiketler"] & forbid_tags)
        ]

    if not candidates:
        raise ValueError(
            f"{slot} için uygun öğün bulunamadı. "
            f"Yasaklar={forbidden}, gerekli={require_tags}, kaçınılan={forbid_tags}"
        )

    return random.choice(candidates)


def conflict_note_for_scenario(scenario: str) -> str:
    return {
        "yumurta_alerjisi_uyumlu": "yumurta",
        "laktoz_uyumlu": "laktoz",
        "gluten_uyumlu": "gluten",
        "vejetaryen_uyumlu": "vejetaryen",
        "vegan_uyumlu": "vegan",
        "kuruyemiş_alerjisi_uyumlu": "kuruyemis",
        "balık_tercihi_uyumlu": "balik",
        "yumurta_alerjisi_çelişkisi": "yumurta",
        "laktoz_çelişkisi": "laktoz",
        "gluten_çelişkisi": "gluten",
        "vejetaryen_çelişkisi": "vejetaryen",
        "vegan_çelişkisi": "vegan",
        "kuruyemiş_alerjisi_çelişkisi": "kuruyemis",
        "balık_tercihi_çelişkisi": "balik",
        "hazırlama_süresi_çelişkisi": "hazirlama",
    }.get(scenario, "yok")


def required_conflict_tag(scenario: str) -> str:
    return {
        "yumurta_alerjisi_çelişkisi": "egg",
        "laktoz_çelişkisi": "dairy",
        "gluten_çelişkisi": "gluten",
        "vejetaryen_çelişkisi": "meat",
        "vegan_çelişkisi": random.choice(["meat", "egg", "dairy"]),
        "kuruyemiş_alerjisi_çelişkisi": "nuts",
        "balık_tercihi_çelişkisi": "fish",
    }[scenario]


def force_conflict(
    plan_options: dict[str, dict[str, Any]],
    scenario: str,
) -> None:
    if scenario == "hazırlama_süresi_çelişkisi":
        candidates = []
        for slot, options in MEAL_OPTIONS.items():
            for option in options:
                if option["sure"] > 15:
                    candidates.append((slot, option))
        slot, option = random.choice(candidates)
        plan_options[slot] = option
        return

    tag = required_conflict_tag(scenario)
    slots = list(plan_options)
    random.shuffle(slots)

    for slot in slots:
        candidates = [
            option
            for option in MEAL_OPTIONS[slot]
            if tag in option["etiketler"]
        ]
        if candidates:
            plan_options[slot] = random.choice(candidates)
            return

    raise ValueError(f"{scenario} için çelişkili öğün bulunamadı.")


def diyet_plani_uret(
    scenario: str,
) -> tuple[dict[str, Any], dict[str, Any]]:
    age = random.randint(18, 55)
    gender = random.choice(["Erkek", "Kadın"])
    height = random.randint(155, 198)
    weight = random.randint(50, 140)
    activity = random.choice(["Düşük", "Hafif aktif", "Orta aktif", "Çok aktif"])
    goal = random.choice(["Kilo vermek", "Kilo korumak", "Kilo almak"])
    target_calories = hedef_kalori_hesapla(age, gender, height, weight, activity, goal)

    note_key = conflict_note_for_scenario(scenario)
    note_data = KULLANICI_NOTLARI[note_key]
    forbidden = note_data["yasak"]

    plan_options = {
        "kahvalti": choose_option("kahvalti", forbidden, require_tags={"protein"}),
        "ogle": choose_option("ogle", forbidden, require_tags={"protein", "vegetable"}),
        "aksam": choose_option("aksam", forbidden, require_tags={"protein", "vegetable"}),
        "ara_ogun": choose_option("ara_ogun", forbidden, require_tags={"fruit"}),
    }

    if scenario == "kahvaltı_proteini_eksik":
        plan_options["kahvalti"] = choose_option(
            "kahvalti",
            forbidden,
            forbid_tags={"protein"},
        )
    elif scenario == "öğle_proteini_eksik":
        plan_options["ogle"] = choose_option(
            "ogle",
            forbidden,
            forbid_tags={"protein"},
        )
    elif scenario == "sebze_eksik":
        for slot in ["kahvalti", "ogle", "aksam", "ara_ogun"]:
            plan_options[slot] = choose_option(
                slot,
                forbidden,
                forbid_tags={"vegetable"},
            )
    elif scenario == "meyve_eksik":
        plan_options["ara_ogun"] = choose_option(
            "ara_ogun",
            forbidden,
            forbid_tags={"fruit"},
        )
    elif scenario == "lif_düşük":
        for slot in ["kahvalti", "ogle", "aksam", "ara_ogun"]:
            plan_options[slot] = choose_option(
                slot,
                forbidden,
                forbid_tags={"fiber"},
            )
    elif scenario == "çoklu_eksik":
        plan_options["kahvalti"] = choose_option(
            "kahvalti",
            forbidden,
            forbid_tags={"protein", "vegetable", "fiber"},
        )
        plan_options["ogle"] = choose_option(
            "ogle",
            forbidden,
            forbid_tags={"protein", "vegetable", "fiber"},
        )
        plan_options["ara_ogun"] = choose_option(
            "ara_ogun",
            forbidden,
            forbid_tags={"fruit", "fiber", "protein"},
        )
    elif scenario.endswith("çelişkisi"):
        force_conflict(plan_options, scenario)

    all_tags = set()
    max_prep = 0
    for option in plan_options.values():
        all_tags.update(option["etiketler"])
        max_prep = max(max_prep, option["sure"])

    breakfast_protein = "protein" in plan_options["kahvalti"]["etiketler"]
    lunch_protein = "protein" in plan_options["ogle"]["etiketler"]
    dinner_protein = "protein" in plan_options["aksam"]["etiketler"]
    vegetable_exists = "vegetable" in all_tags
    fruit_exists = "fruit" in all_tags
    fiber_exists = "fiber" in all_tags

    calorie_known = scenario != "kalori_porsiyon_belirsiz"
    portion_known = scenario != "kalori_porsiyon_belirsiz"

    if scenario == "kalori_hedefi_uyumsuz":
        plan_calories = target_calories + random.choice([-650, -550, 500, 650])
    else:
        plan_calories = target_calories + random.randint(-100, 100)

    if not calorie_known:
        plan_calories_value: int | str = "Belirtilmemiş"
    else:
        plan_calories_value = int(round(plan_calories / 10) * 10)

    if portion_known:
        portion_info: str | dict[str, str] = {
            "kahvalti": "1 porsiyon",
            "ogle": "1 porsiyon",
            "aksam": "1 porsiyon",
            "ara_ogun": "1 küçük porsiyon",
        }
    else:
        portion_info = "Belirtilmemiş"

    plan = {
        "plan_adi": f"Plan {random.randint(1, 3)}",
        "kahvalti": [plan_options["kahvalti"]["ad"]],
        "ogle": [plan_options["ogle"]["ad"]],
        "aksam": [plan_options["aksam"]["ad"]],
        "ara_ogun": [plan_options["ara_ogun"]["ad"]],
        "gunluk_kalori": plan_calories_value,
        "porsiyon_bilgisi": portion_info,
        "en_uzun_hazirlama_suresi_dk": max_prep,
    }

    profile = {
        "yas": age,
        "cinsiyet": gender,
        "boy_cm": height,
        "kilo_kg": weight,
        "aktivite_duzeyi": activity,
        "hedef": goal,
    }

    if scenario == "kalori_hedefi_uyumsuz" or random.random() < 0.75:
        profile["hedef_kalori"] = target_calories

    conflict_tags = note_data["yasak"] & all_tags
    note_conflict = bool(conflict_tags)

    max_allowed_prep = note_data.get("max_sure")
    if max_allowed_prep is not None and max_prep > max_allowed_prep:
        note_conflict = True

    facts = {
        "target_calories": target_calories,
        "plan_calories": plan_calories_value,
        "calorie_known": calorie_known,
        "portion_known": portion_known,
        "breakfast_protein": breakfast_protein,
        "lunch_protein": lunch_protein,
        "dinner_protein": dinner_protein,
        "vegetable_exists": vegetable_exists,
        "fruit_exists": fruit_exists,
        "fiber_exists": fiber_exists,
        "note_text": note_data["metin"],
        "note_conflict": note_conflict,
        "conflict_tags": conflict_tags,
        "plan_options": plan_options,
        "goal": goal,
        "max_prep": max_prep,
        "max_allowed_prep": max_allowed_prep,
    }

    input_payload = {
        "tip": "diyet",
        "profil": profile,
        "plan": plan,
        "kullanici_notu": note_data["metin"],
    }

    return input_payload, facts


def conflict_description(facts: dict[str, Any]) -> str:
    if not facts["note_text"]:
        return "Kullanıcı notuyla ek bir çelişki bulunmuyor."

    if not facts["note_conflict"]:
        return f"Plan, '{facts['note_text']}' notuyla uyumlu görünüyor."

    conflicting_meals = [
        option["ad"]
        for option in facts["plan_options"].values()
        if option["etiketler"] & facts["conflict_tags"]
    ]
    meal = conflicting_meals[0] if conflicting_meals else "plandaki bir öğün"

    note = normalize_text(facts["note_text"])

    if "yumurta" in note:
        return f"Yumurta alerjisi ile '{meal}' seçeneği çelişiyor."
    if "laktoz" in note:
        return f"Laktoz intoleransı ile '{meal}' seçeneği çelişiyor."
    if "gluten" in note:
        return f"Glutensiz beslenme notu ile '{meal}' seçeneği çelişiyor."
    if "vejetaryen" in note:
        return f"Vejetaryen beslenme tercihi ile '{meal}' seçeneği çelişiyor."
    if "vegan" in note:
        return f"Vegan beslenme tercihi ile '{meal}' seçeneği çelişiyor."
    if "findik" in note or "fistik" in note:
        return f"Kuruyemiş alerjisi ile '{meal}' seçeneği çelişiyor."
    if "balik" in note:
        return f"Balık tercih etmeme notu ile '{meal}' seçeneği çelişiyor."
    if "dakika" in note:
        return (
            f"Kullanıcının en fazla {facts['max_allowed_prep']} dakikalık hazırlama isteğine rağmen "
            f"planda {facts['max_prep']} dakikaya kadar hazırlama süresi bulunuyor."
        )

    return f"Kullanıcı notu ile '{meal}' seçeneği çelişiyor."


def diyet_output_uret(
    input_payload: dict[str, Any],
    facts: dict[str, Any],
) -> dict[str, Any]:
    missing_protein_meals = []
    if not facts["breakfast_protein"]:
        missing_protein_meals.append("kahvaltı")
    if not facts["lunch_protein"]:
        missing_protein_meals.append("öğle")
    if not facts["dinner_protein"]:
        missing_protein_meals.append("akşam")

    if missing_protein_meals:
        protein_eval = (
            f"{', '.join(missing_protein_meals)} öğününde belirgin bir protein kaynağı bulunmuyor."
        )
    else:
        protein_eval = "Kahvaltı, öğle ve akşam öğünlerinde protein kaynağı bulunuyor."

    vegetable_eval = (
        "Planda sebze bulunuyor."
        if facts["vegetable_exists"]
        else "Planda belirgin bir sebze seçeneği bulunmuyor."
    )
    fruit_eval = (
        "Planda meyve bulunuyor."
        if facts["fruit_exists"]
        else "Planda meyve bulunmuyor."
    )
    fiber_eval = (
        "Plan lif kaynakları içeriyor."
        if facts["fiber_exists"]
        else "Planın lif içeriği düşük veya belirsiz görünüyor."
    )

    profile = input_payload["profil"]
    target_calorie_in_profile = profile.get("hedef_kalori")

    if not facts["calorie_known"] and not facts["portion_known"]:
        calorie_eval = (
            "Günlük kalori ve porsiyon bilgisi belirtilmediği için enerji uyumu kesin değerlendirilemiyor."
        )
        target_eval = (
            f"Planın {facts['goal'].lower()} hedefiyle uyumu kalori bilgisi olmadığı için belirsiz."
        )
    elif target_calorie_in_profile is None:
        calorie_eval = (
            f"Planın günlük kalorisi {facts['plan_calories']} kcal olarak verilmiş, "
            "ancak profil içinde hedef kalori bulunmuyor."
        )
        target_eval = (
            f"Planın {facts['goal'].lower()} hedefiyle genel uyumu değerlendirilebilir, "
            "fakat kesin enerji karşılaştırması için hedef kalori gerekir."
        )
    else:
        difference = int(facts["plan_calories"]) - int(target_calorie_in_profile)
        if abs(difference) <= 150:
            calorie_eval = (
                f"Plan kalorisi {facts['plan_calories']} kcal ve hedef kalori "
                f"{target_calorie_in_profile} kcal; aradaki fark sınırlı."
            )
            target_eval = f"Plan {facts['goal'].lower()} hedefiyle genel olarak uyumlu görünüyor."
        else:
            calorie_eval = (
                f"Plan kalorisi {facts['plan_calories']} kcal ve hedef kalori "
                f"{target_calorie_in_profile} kcal; arada {abs(difference)} kcal fark var."
            )
            target_eval = f"Plan {facts['goal'].lower()} hedefiyle tam uyumlu görünmüyor."

    note_eval = conflict_description(facts)

    critical_count = sum([
        bool(missing_protein_meals),
        not facts["vegetable_exists"],
        not facts["fruit_exists"],
        not facts["fiber_exists"],
        not facts["calorie_known"] or not facts["portion_known"],
        facts["note_conflict"],
    ])

    if facts["note_conflict"]:
        compatibility = "uyumsuz"
    elif critical_count == 0:
        compatibility = "uyumlu"
    else:
        compatibility = "kısmen_uyumlu"

    conclusion = {
        "uyumlu": "Planın mevcut yapısı dengeli ve kullanıcı bilgileriyle uyumlu görünüyor.",
        "kısmen_uyumlu": "Plan kullanılabilir, ancak belirtilen eksikler giderilmeden tam dengeli sayılmaz.",
        "uyumsuz": "Kullanıcı notuyla çelişen öğün değiştirilmeden bu plan uygun kabul edilmemeli.",
    }[compatibility]

    comment = " ".join([
        target_eval,
        protein_eval,
        vegetable_eval,
        fruit_eval,
        fiber_eval,
        calorie_eval,
        note_eval,
        conclusion,
    ])

    return {
        "tip": "diyet",
        "uyum": compatibility,
        "hedef_uyumu": target_eval,
        "protein_degerlendirmesi": protein_eval,
        "sebze_degerlendirmesi": vegetable_eval,
        "meyve_degerlendirmesi": fruit_eval,
        "lif_degerlendirmesi": fiber_eval,
        "kalori_porsiyon_degerlendirmesi": calorie_eval,
        "kullanici_notu_degerlendirmesi": note_eval,
        "yorum": comment,
    }


def diyet_ornegi_uret(scenario: str) -> dict[str, Any]:
    input_payload, facts = diyet_plani_uret(scenario)
    output_payload = diyet_output_uret(input_payload, facts)

    return {
        "instruction": random.choice(DIYET_TALIMATLARI),
        "input": compact_json(input_payload),
        "output": compact_json(output_payload),
    }


def contains_foreign_script(text: str) -> bool:
    return bool(
        re.search(
            r"[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]",
            text,
        )
    )


def validate_example(example: dict[str, Any]) -> None:
    required_keys = {"instruction", "input", "output"}
    if set(example) != required_keys:
        raise ValueError(f"Örnek alanları hatalı: {set(example)}")

    if not example["instruction"].strip():
        raise ValueError("Talimat boş.")

    input_payload = json.loads(example["input"])
    output_payload = json.loads(example["output"])

    if contains_foreign_script(example["instruction"] + example["input"] + example["output"]):
        raise ValueError("Türkçe dışı yazı sistemi bulundu.")

    if input_payload.get("tip") != output_payload.get("tip"):
        raise ValueError("Girdi ve çıktı tipi uyuşmuyor.")

    if input_payload["tip"] == "antrenor":
        movement = input_payload["hareket"]
        if output_payload.get("hareket") != movement:
            raise ValueError("Antrenör hareketi uyuşmuyor.")

        comment = normalize_text(output_payload.get("yorum", ""))
        movement_label = normalize_text(HAREKET_ETIKETLERI[movement])
        if movement_label not in comment:
            raise ValueError("Yorumda hareket adı yok.")

        for key in ["guclu_alan", "gelistirilecek_alan"]:
            category = output_payload.get(key, "")
            if not category:
                raise ValueError(f"{key} boş.")
            if normalize_text(category) not in comment:
                raise ValueError(f"Yorumda {key} geçmiyor: {category}")

        wrong_movements = {
            "squat": ["deadlift", "biceps curl"],
            "deadlift": ["squat", "biceps curl"],
            "biceps_curl": ["squat", "deadlift"],
        }[movement]
        if any(wrong in comment for wrong in wrong_movements):
            raise ValueError("Yorumda yanlış hareket adı var.")

    else:
        comment = normalize_text(output_payload.get("yorum", ""))
        required_words = ["protein", "sebze", "meyve", "lif"]
        if not all(word in comment for word in required_words):
            raise ValueError("Diyet yorumunda temel değerlendirme alanları eksik.")

        note = normalize_text(input_payload.get("kullanici_notu", ""))
        if note:
            note_eval = normalize_text(output_payload.get("kullanici_notu_degerlendirmesi", ""))
            if not note_eval:
                raise ValueError("Kullanıcı notu değerlendirmesi boş.")


def example_hash(example: dict[str, Any]) -> str:
    canonical = compact_json(example)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def generate_balanced_examples(
    single_count: int,
    history_count: int,
    diet_count: int,
) -> list[tuple[dict[str, Any], str, str]]:
    result: list[tuple[dict[str, Any], str, str]] = []
    movements = list(HAREKET_ETIKETLERI)

    for index in range(single_count):
        movement = movements[index % len(movements)]
        scenario = TEK_ANTRENMAN_SENARYOLARI[
            (index // len(movements)) % len(TEK_ANTRENMAN_SENARYOLARI)
        ]
        result.append((tek_antrenman_ornegi_uret(movement, scenario), "tek_antrenman", f"{movement}:{scenario}"))

    for index in range(history_count):
        movement = movements[index % len(movements)]
        scenario = GECMIS_SENARYOLARI[
            (index // len(movements)) % len(GECMIS_SENARYOLARI)
        ]
        result.append((gecmis_ornegi_uret(movement, scenario), "gecmis_antrenman", f"{movement}:{scenario}"))

    for index in range(diet_count):
        scenario = DIYET_SENARYOLARI[index % len(DIYET_SENARYOLARI)]
        result.append((diyet_ornegi_uret(scenario), "diyet", scenario))

    return result


def deduplicate_and_validate(
    records: list[tuple[dict[str, Any], str, str]],
) -> list[tuple[dict[str, Any], str, str]]:
    unique = []
    seen = set()

    for example, kind, scenario in records:
        validate_example(example)
        digest = example_hash(example)
        if digest in seen:
            continue
        seen.add(digest)
        unique.append((example, kind, scenario))

    return unique


def stratified_split(
    records: list[tuple[dict[str, Any], str, str]],
    validation_ratio: float,
    test_ratio: float,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    groups: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)

    for example, kind, scenario in records:
        groups[(kind, scenario)].append(example)

    train: list[dict[str, Any]] = []
    validation: list[dict[str, Any]] = []
    test: list[dict[str, Any]] = []

    for group_records in groups.values():
        random.shuffle(group_records)
        n = len(group_records)
        test_n = max(1, round(n * test_ratio)) if n >= 3 else 0
        validation_n = max(1, round(n * validation_ratio)) if n >= 3 else 0

        test.extend(group_records[:test_n])
        validation.extend(group_records[test_n:test_n + validation_n])
        train.extend(group_records[test_n + validation_n:])

    random.shuffle(train)
    random.shuffle(validation)
    random.shuffle(test)

    return train, validation, test


def write_jsonl(path: Path, examples: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8") as file:
        for example in examples:
            file.write(json.dumps(example, ensure_ascii=False) + "\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="VisionFit için yapılandırılmış Türkçe fine-tune verisi üretir."
    )
    parser.add_argument("--tek-antrenman", type=int, default=5000)
    parser.add_argument("--gecmis-antrenman", type=int, default=5000)
    parser.add_argument("--diyet", type=int, default=6000)
    parser.add_argument("--seed", type=int, default=SEED)
    parser.add_argument("--validation-orani", type=float, default=0.05)
    parser.add_argument("--test-orani", type=float, default=0.05)
    parser.add_argument("--cikti-klasoru", type=str, default="visionfit_dataset")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    random.seed(args.seed)

    if args.tek_antrenman <= 0 or args.gecmis_antrenman <= 0 or args.diyet <= 0:
        raise ValueError("Örnek sayıları sıfırdan büyük olmalıdır.")

    if args.validation_orani < 0 or args.test_orani < 0:
        raise ValueError("Bölme oranları negatif olamaz.")

    if args.validation_orani + args.test_orani >= 0.5:
        raise ValueError("Validation ve test oranlarının toplamı 0.5'ten küçük olmalıdır.")

    output_dir = Path(args.cikti_klasoru)
    output_dir.mkdir(parents=True, exist_ok=True)

    records = generate_balanced_examples(
        single_count=args.tek_antrenman,
        history_count=args.gecmis_antrenman,
        diet_count=args.diyet,
    )

    records = deduplicate_and_validate(records)
    random.shuffle(records)

    all_examples = [example for example, _, _ in records]
    train, validation, test = stratified_split(
        records,
        validation_ratio=args.validation_orani,
        test_ratio=args.test_orani,
    )

    write_jsonl(output_dir / "egitim_verisi.jsonl", all_examples)
    write_jsonl(output_dir / "egitim_verisi_train.jsonl", train)
    write_jsonl(output_dir / "egitim_verisi_validation.jsonl", validation)
    write_jsonl(output_dir / "egitim_verisi_test.jsonl", test)

    kind_counter = Counter(kind for _, kind, _ in records)
    scenario_counter = Counter(scenario for _, _, scenario in records)

    summary = {
        "seed": args.seed,
        "toplam_ornek": len(all_examples),
        "train": len(train),
        "validation": len(validation),
        "test": len(test),
        "alan_dagilimi": dict(sorted(kind_counter.items())),
        "senaryo_dagilimi": dict(sorted(scenario_counter.items())),
        "dosyalar": [
            "egitim_verisi.jsonl",
            "egitim_verisi_train.jsonl",
            "egitim_verisi_validation.jsonl",
            "egitim_verisi_test.jsonl",
        ],
    }

    with (output_dir / "veri_ozeti.json").open("w", encoding="utf-8") as file:
        json.dump(summary, file, ensure_ascii=False, indent=2)

    print(f"Toplam benzersiz örnek: {len(all_examples)}")
    print(f"Train: {len(train)}")
    print(f"Validation: {len(validation)}")
    print(f"Test: {len(test)}")
    print(f"Çıktı klasörü: {output_dir.resolve()}")
    print("Tüm örnekler JSON olarak doğrulandı.")


if __name__ == "__main__":
    main()

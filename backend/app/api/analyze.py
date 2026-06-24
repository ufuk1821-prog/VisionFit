import math
from typing import Dict, List, Optional, Sequence, Tuple

import numpy as np
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import get_current_user
from app.models.history import WorkoutHistory
from app.schemas.analyze import (
    BicepsCurlSessionResult,
    DeadliftSessionResult,
    KategoriSonuc,
    PoseData,
    SessionData,
    SessionResult,
)
from app.schemas.history import HistoryRead


router = APIRouter()

LANDMARK_COUNT = 33
VALUES_PER_LANDMARK = 4
MIN_FRAME_LENGTH = LANDMARK_COUNT * VALUES_PER_LANDMARK
VISIBILITY_THRESHOLD = 0.55
EPSILON = 1e-8

NOSE = 0
LEFT_EAR = 7
RIGHT_EAR = 8
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12
LEFT_ELBOW = 13
RIGHT_ELBOW = 14
LEFT_WRIST = 15
RIGHT_WRIST = 16
LEFT_INDEX = 19
RIGHT_INDEX = 20
LEFT_HIP = 23
RIGHT_HIP = 24
LEFT_KNEE = 25
RIGHT_KNEE = 26
LEFT_ANKLE = 27
RIGHT_ANKLE = 28
LEFT_HEEL = 29
RIGHT_HEEL = 30
LEFT_FOOT_INDEX = 31
RIGHT_FOOT_INDEX = 32


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


Point = Tuple[float, float]


def _clamp(value: float, minimum: float = 0.0, maximum: float = 100.0) -> float:
    return float(max(minimum, min(maximum, value)))


def _safe_percentile(values: Sequence[float], percentile: float) -> float:
    if not values:
        return 0.0
    return float(np.percentile(np.asarray(values, dtype=float), percentile))


def _robust_mean(values: Sequence[float], trim_ratio: float = 0.15) -> float:

    clean = np.asarray([float(v) for v in values if np.isfinite(float(v))], dtype=float)
    if clean.size == 0:
        return 0.0
    clean.sort()
    trim = int(clean.size * trim_ratio)
    if trim > 0 and clean.size - 2 * trim >= 3:
        clean = clean[trim:-trim]
    return float(np.mean(clean))


def _median_smooth(values: Sequence[float], window: int = 3) -> List[float]:

    numbers = [float(v) for v in values]
    if len(numbers) < 3 or window < 3:
        return numbers
    radius = window // 2
    result: List[float] = []
    for index in range(len(numbers)):
        start = max(0, index - radius)
        end = min(len(numbers), index + radius + 1)
        result.append(float(np.median(numbers[start:end])))
    return result


def _session_side(
    frames: Sequence[Sequence[float]],
    left_indices: Sequence[int],
    right_indices: Sequence[int],
) -> str:

    left_scores: List[float] = []
    right_scores: List[float] = []
    for frame in frames:
        if len(frame) < MIN_FRAME_LENGTH:
            continue
        left_scores.append(min(visibility(frame, idx) for idx in left_indices))
        right_scores.append(min(visibility(frame, idx) for idx in right_indices))
    if not left_scores or not right_scores:
        return "left"
    return "left" if float(np.median(left_scores)) >= float(np.median(right_scores)) else "right"


def _biceps_view(frames: Sequence[Sequence[float]]) -> str:

    ratios: List[float] = []
    required = [LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_HIP, RIGHT_HIP]
    for frame in frames:
        if len(frame) < MIN_FRAME_LENGTH or not landmarks_visible(frame, required, threshold=0.40):
            continue
        shoulder_mid = midpoint(point(frame, LEFT_SHOULDER), point(frame, RIGHT_SHOULDER))
        hip_mid = midpoint(point(frame, LEFT_HIP), point(frame, RIGHT_HIP))
        torso = point_distance(shoulder_mid, hip_mid)
        if torso < EPSILON:
            continue
        shoulder_width = point_distance(point(frame, LEFT_SHOULDER), point(frame, RIGHT_SHOULDER))
        ratios.append(shoulder_width / torso)
    if not ratios:
        return "side"
    return "front" if float(np.median(ratios)) >= 0.42 else "side"


def calculate_angle(a: Point, b: Point, c: Point) -> float:

    a_np = np.asarray(a, dtype=float)
    b_np = np.asarray(b, dtype=float)
    c_np = np.asarray(c, dtype=float)

    ba = a_np - b_np
    bc = c_np - b_np

    ba_norm = float(np.linalg.norm(ba))
    bc_norm = float(np.linalg.norm(bc))
    if ba_norm < EPSILON or bc_norm < EPSILON:
        return 0.0

    cosine = float(np.dot(ba, bc) / (ba_norm * bc_norm))
    cosine = max(-1.0, min(1.0, cosine))
    return float(math.degrees(math.acos(cosine)))


def calculate_line_angle(a: Point, b: Point) -> float:

    return float(math.degrees(math.atan2(b[1] - a[1], b[0] - a[0])))


def point_distance(a: Point, b: Point) -> float:
    return float(math.dist(a, b))


def extract_landmark(lm_flat: Sequence[float], idx: int) -> Tuple[float, float, float, float]:
    base = idx * VALUES_PER_LANDMARK
    return (
        float(lm_flat[base]),
        float(lm_flat[base + 1]),
        float(lm_flat[base + 2]),
        float(lm_flat[base + 3]),
    )


def point(lm_flat: Sequence[float], idx: int) -> Point:
    x, y, _, _ = extract_landmark(lm_flat, idx)
    return x, y


def point_xz(lm_flat: Sequence[float], idx: int) -> Point:
    x, _, z, _ = extract_landmark(lm_flat, idx)
    return x, z


def point_line_distance(value: Point, start: Point, end: Point) -> float:
    line_length = point_distance(start, end)
    if line_length < EPSILON:
        return 0.0
    numerator = abs(
        (end[1] - start[1]) * value[0]
        - (end[0] - start[0]) * value[1]
        + end[0] * start[1]
        - end[1] * start[0]
    )
    return float(numerator / line_length)


def visibility(lm_flat: Sequence[float], idx: int) -> float:
    return extract_landmark(lm_flat, idx)[3]


def midpoint(a: Point, b: Point) -> Point:
    return ((a[0] + b[0]) / 2.0, (a[1] + b[1]) / 2.0)


def landmarks_visible(
    lm_flat: Sequence[float],
    indices: Sequence[int],
    threshold: float = VISIBILITY_THRESHOLD,
) -> bool:
    if len(lm_flat) < MIN_FRAME_LENGTH:
        return False
    return all(visibility(lm_flat, idx) >= threshold for idx in indices)


def choose_visible_side(
    lm_flat: Sequence[float],
    left_indices: Sequence[int],
    right_indices: Sequence[int],
) -> str:
    left_score = min(visibility(lm_flat, idx) for idx in left_indices)
    right_score = min(visibility(lm_flat, idx) for idx in right_indices)
    return "left" if left_score >= right_score else "right"


def normalized_distance(distance: float, body_scale: float) -> float:
    if body_scale < EPSILON:
        return 999.0
    return float(distance / body_scale)


def score_from_error(error: float, full_penalty_at: float) -> float:
    if full_penalty_at <= 0:
        return 0.0
    return round(_clamp(100.0 * (1.0 - error / full_penalty_at)), 1)


def category(score: float, good_message: str, bad_message: str) -> KategoriSonuc:
    return KategoriSonuc(
        skor=round(_clamp(score), 1),
        mesaj=good_message if score >= 75 else bad_message,
    )


def build_summary(
    categories: Sequence[Tuple[str, float]],
) -> Tuple[List[str], List[str], str, str]:
    positive = [name for name, score in categories if score >= 75]
    problems = [name for name, score in categories if score < 75]

    positive_message = (
        "Tebrikler! "
        + ", ".join(positive).capitalize()
        + " kategorilerinde başarılıydınız."
        if positive
        else "Antrenman tamamlandı."
    )
    improvement_message = (
        "Geliştirilecek alanlar: " + ", ".join(problems) + "."
        if problems
        else "Harika antrenman! Tüm kategorilerde formunuz iyiydi."
    )
    return positive, problems, positive_message, improvement_message


def save_history(
    db: Session,
    user_id: int,
    movement_name: str,
    score: float,
    angle: int,
    note: str,
) -> WorkoutHistory:
    record = WorkoutHistory(
        user_id=user_id,
        hareket_adi=movement_name,
        eminlik_skoru=round(_clamp(score), 1),
        diz_acisi=angle,
        antrenor_notu=note,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record



def analyze_single_frame_squat(
    lm_flat: Sequence[float],
    side: Optional[str] = None,
) -> Optional[Dict[str, float | bool]]:
    left_chain = [LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE, LEFT_ANKLE]
    right_chain = [RIGHT_SHOULDER, RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE]
    selected_side = side or choose_visible_side(lm_flat, left_chain, right_chain)
    selected = left_chain if selected_side == "left" else right_chain

    if not landmarks_visible(lm_flat, selected, threshold=0.50):
        return None

    shoulder, hip, knee, ankle = [point(lm_flat, idx) for idx in selected]
    torso_length = point_distance(shoulder, hip)
    shin_length = point_distance(knee, ankle)
    if torso_length < EPSILON or shin_length < EPSILON:
        return None

    knee_angle = calculate_angle(hip, knee, ankle)
    hip_angle = calculate_angle(shoulder, hip, knee)
    torso_from_vertical = abs(abs(calculate_line_angle(hip, shoulder)) - 90.0)

    in_squat = 55.0 <= knee_angle <= 145.0

    spine_score = score_from_error(max(0.0, torso_from_vertical - 18.0), 48.0)

    if 65.0 <= knee_angle <= 105.0:
        depth_score = 100.0
    elif knee_angle > 105.0:
        depth_score = score_from_error(knee_angle - 105.0, 55.0)
    else:
        depth_score = score_from_error(65.0 - knee_angle, 45.0)

    knee_over_toe = normalized_distance(abs(knee[0] - ankle[0]), shin_length)
    knee_alignment_score = score_from_error(max(0.0, knee_over_toe - 0.12), 0.85)

    hip_xz = point_xz(lm_flat, selected[1])
    knee_xz = point_xz(lm_flat, selected[2])
    ankle_xz = point_xz(lm_flat, selected[3])
    leg_line_length = point_distance(hip_xz, ankle_xz)
    valgus_deviation = normalized_distance(
        point_line_distance(knee_xz, hip_xz, ankle_xz),
        leg_line_length,
    )
    valgus_score = score_from_error(max(0.0, valgus_deviation - 0.035), 0.20)

    body_center_x = shoulder[0] * 0.20 + hip[0] * 0.55 + knee[0] * 0.25
    balance_error = normalized_distance(abs(body_center_x - ankle[0]), torso_length)
    balance_score = score_from_error(max(0.0, balance_error - 0.12), 0.75)

    return {
        "in_squat": in_squat,
        "knee_angle": knee_angle,
        "hip_angle": hip_angle,
        "spine_score": spine_score,
        "depth_score": depth_score,
        "knee_alignment_score": knee_alignment_score,
        "valgus_score": valgus_score,
        "balance_score": balance_score,
    }


@router.post("/squat")
async def analyze_squat(
    data: PoseData,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = analyze_single_frame_squat(data.landmarks)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vücut noktaları yeterince net algılanamadı.",
        )

    angle = int(round(float(result["knee_angle"])))
    geometric_score = round(
        _clamp(
            float(result["spine_score"]) * 0.22
            + float(result["depth_score"]) * 0.25
            + float(result["knee_alignment_score"]) * 0.18
            + float(result["valgus_score"]) * 0.15
            + float(result["balance_score"]) * 0.20
        ),
        1,
    )
    movement_class = "dogru_squat" if geometric_score >= 70 else "yanlis_squat"

    if angle > 160:
        situation = "Ayakta Bekliyor"
    elif geometric_score >= 75:
        situation = "İyi Form"
    elif angle > 105:
        situation = "Yarım Squat"
    else:
        situation = "Formu Kontrol Edin"

    record = save_history(
        db,
        current_user.id,
        movement_class,
        geometric_score,
        angle,
        situation,
    )
    return {
        "kayit_id": record.id,
        "hareket": movement_class,
        "eminlik": geometric_score,
        "aci": angle,
        "antrenor_mesaji": situation,
        "mesaj": "Veritabanına başarıyla kaydedildi!",
    }


@router.post("/session", response_model=SessionResult)
async def analyze_session(
    data: SessionData,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    valid_frames = [frame for frame in data.frames if len(frame) >= MIN_FRAME_LENGTH]
    if len(valid_frames) < 8:
        raise HTTPException(status_code=400, detail="Analiz için en az 8 geçerli kare gereklidir.")

    side = _session_side(
        valid_frames,
        [LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE, LEFT_ANKLE],
        [RIGHT_SHOULDER, RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE],
    )
    results = [
        result
        for frame in valid_frames
        for result in [analyze_single_frame_squat(frame, side=side)]
        if result is not None
    ]
    if len(results) < 8:
        raise HTTPException(status_code=400, detail="Yeterli sayıda net vücut karesi bulunamadı.")


    smoothed_angles = _median_smooth([float(item["knee_angle"]) for item in results], 5)
    for item, angle in zip(results, smoothed_angles):
        item["knee_angle"] = angle
        item["in_squat"] = 55.0 <= angle <= 145.0

    movement_frames = [item for item in results if bool(item["in_squat"])]
    if len(movement_frames) < 5:
        raise HTTPException(
            status_code=400,
            detail="Squat hareketi tespit edilemedi. Tam iniş ve kalkışın görünmesini sağlayın.",
        )

    knee_angles = [float(item["knee_angle"]) for item in movement_frames]
    movement_range = _safe_percentile(knee_angles, 90) - _safe_percentile(knee_angles, 10)
    if movement_range < 22:
        raise HTTPException(status_code=400, detail="Yeterli squat hareket açıklığı tespit edilemedi.")


    sorted_frames = sorted(movement_frames, key=lambda item: float(item["knee_angle"]))
    dip_count = max(5, int(round(len(sorted_frames) * 0.35)))
    dip_frames = sorted_frames[:min(len(sorted_frames), dip_count)]

    def robust_score(key: str, source: Sequence[Dict[str, float | bool]]) -> float:
        return round(_robust_mean([float(item[key]) for item in source]), 1)


    spine_score = robust_score("spine_score", dip_frames)
    depth_score = robust_score("depth_score", dip_frames)
    knee_score = robust_score("knee_alignment_score", dip_frames)
    valgus_score = robust_score("valgus_score", dip_frames)
    balance_score = robust_score("balance_score", dip_frames)

    general_score = round(
        _clamp(
            spine_score * 0.22
            + depth_score * 0.25
            + knee_score * 0.18
            + valgus_score * 0.15
            + balance_score * 0.20
        ) * 2.0
    ) / 2.0

    general = category(
        general_score,
        "Genel squat formu dengeli ve tutarlı.",
        "Genel squat formunda geliştirilmesi gereken noktalar var.",
    )
    spine = category(spine_score, "Gövde kontrolü ve omurga hizası korunuyor.", "Gövde kontrolünde bozulma var. Göğsünüzü kontrollü tutun.")
    depth = category(depth_score, "Squat derinliği yeterli.", "Squat derinliği uygun değil. Diz seviyesine veya biraz altına kontrollü biçimde inin.")
    knee_alignment = category(knee_score, "Diz ve ayak bileği hizası dengeli.", "Diz-ayak bileği hizasında belirgin sapma var.")
    valgus = category(valgus_score, "Dizlerin kalça-ayak bileği hattı korunuyor.", "Dizlerde içe veya dışa doğru sapma tespit edildi.")
    balance = category(balance_score, "Ağırlık merkezi ayak tabanı üzerinde dengeli.", "Ağırlık merkezi öne veya arkaya kayıyor.")

    _, problems, positive_message, improvement_message = build_summary([
        ("genel form", general_score),
        ("omurga nötrlüğü", spine_score),
        ("kalça derinliği", depth_score),
        ("diz hizası", knee_score),
        ("diz çöküşü", valgus_score),
        ("ağırlık merkezi", balance_score),
    ])

    average_knee_angle = int(round(_robust_mean([float(item["knee_angle"]) for item in dip_frames])))
    note = f"Skor: %{general_score} | " + (", ".join(problems) if problems else "Tüm kategoriler iyi")
    save_history(db, current_user.id, "squat_session", general_score, average_knee_angle, note)

    return SessionResult(
        toplam_kare=len(results),
        squat_kare=len(movement_frames),
        genel_skor=general_score,
        genel_form=general,
        omurga_notrluğu=spine,
        kalca_derinligi=depth,
        diz_hizasi=knee_alignment,
        diz_cokusu=valgus,
        agirlik_merkezi=balance,
        olumlu_mesaj=positive_message,
        gelistirilecek_mesaj=improvement_message,
    )


def analyze_single_frame_biceps_curl(
    lm_flat: Sequence[float],
    view: str,
    side: Optional[str] = None,
) -> Optional[Dict[str, float | str]]:
    torso_indices = [LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_HIP, RIGHT_HIP]
    if not landmarks_visible(lm_flat, torso_indices, threshold=0.40):
        return None

    shoulder_mid = midpoint(point(lm_flat, LEFT_SHOULDER), point(lm_flat, RIGHT_SHOULDER))
    hip_mid = midpoint(point(lm_flat, LEFT_HIP), point(lm_flat, RIGHT_HIP))
    torso_length = point_distance(shoulder_mid, hip_mid)
    if torso_length < EPSILON:
        return None

    if view == "front":
        arm_data: List[Tuple[float, float, float]] = []
        for shoulder_idx, elbow_idx, wrist_idx in [
            (LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST),
            (RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST),
        ]:
            if not landmarks_visible(lm_flat, [shoulder_idx, elbow_idx, wrist_idx], threshold=0.45):
                continue
            shoulder = point(lm_flat, shoulder_idx)
            elbow = point(lm_flat, elbow_idx)
            wrist = point(lm_flat, wrist_idx)
            upper_arm = point_distance(shoulder, elbow)
            if upper_arm < EPSILON:
                continue
            angle = calculate_angle(shoulder, elbow, wrist)
            lateral_drift = normalized_distance(abs(elbow[0] - shoulder[0]), upper_arm)
            arm_data.append((angle, lateral_drift, visibility(lm_flat, elbow_idx)))
        if not arm_data:
            return None

        elbow_angle = float(np.average([a[0] for a in arm_data], weights=[max(a[2], 0.1) for a in arm_data]))
        elbow_drift = float(np.average([a[1] for a in arm_data], weights=[max(a[2], 0.1) for a in arm_data]))
        torso_metric = normalized_distance(abs(shoulder_mid[0] - hip_mid[0]), torso_length)
        return {
            "view": "front",
            "elbow_angle": elbow_angle,
            "elbow_drift": elbow_drift,
            "torso_metric": torso_metric,
            "wrist_score": -1.0,
        }

    left_chain = [LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST]
    right_chain = [RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST]
    selected_side = side or choose_visible_side(lm_flat, left_chain, right_chain)
    chain = left_chain if selected_side == "left" else right_chain
    if not landmarks_visible(lm_flat, chain, threshold=0.45):
        return None

    shoulder, elbow, wrist = [point(lm_flat, idx) for idx in chain]
    upper_arm_length = point_distance(shoulder, elbow)
    if upper_arm_length < EPSILON:
        return None

    elbow_angle = calculate_angle(shoulder, elbow, wrist)
    elbow_drift = normalized_distance(abs(elbow[0] - shoulder[0]), upper_arm_length)
    torso_from_vertical = abs(abs(calculate_line_angle(hip_mid, shoulder_mid)) - 90.0)

    index_idx = LEFT_INDEX if selected_side == "left" else RIGHT_INDEX
    wrist_score = -1.0
    if visibility(lm_flat, index_idx) >= 0.45:
        wrist_angle = calculate_angle(elbow, wrist, point(lm_flat, index_idx))
        wrist_score = score_from_error(abs(wrist_angle - 170.0), 70.0)

    return {
        "view": "side",
        "elbow_angle": elbow_angle,
        "elbow_drift": elbow_drift,
        "torso_metric": torso_from_vertical,
        "wrist_score": wrist_score,
    }


@router.post("/biceps-curl-session", response_model=BicepsCurlSessionResult)
async def analyze_biceps_curl_session(
    data: SessionData,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    valid_frames = [frame for frame in data.frames if len(frame) >= MIN_FRAME_LENGTH]
    if len(valid_frames) < 8:
        raise HTTPException(status_code=400, detail="Biceps curl analizi için en az 8 geçerli kare gereklidir.")

    view = _biceps_view(valid_frames)
    side = None
    if view == "side":
        side = _session_side(
            valid_frames,
            [LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST],
            [RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST],
        )

    results = [
        result
        for frame in valid_frames
        for result in [analyze_single_frame_biceps_curl(frame, view=view, side=side)]
        if result is not None
    ]
    if len(results) < 6:
        raise HTTPException(status_code=400, detail="Biceps curl analizi için yeterli sayıda net kare bulunamadı.")

    elbow_angles = _median_smooth([float(item["elbow_angle"]) for item in results], 5)
    min_angle = _safe_percentile(elbow_angles, 10)
    max_angle = _safe_percentile(elbow_angles, 90)
    movement_range = max_angle - min_angle
    if movement_range < 28:
        raise HTTPException(status_code=400, detail="Biceps curl hareketi tespit edilemedi. Kolunuzu tam açıp kontrollü biçimde bükün.")

    extension_score = score_from_error(max(0.0, 145.0 - max_angle), 60.0)
    flexion_score = score_from_error(max(0.0, min_angle - 65.0), 70.0)
    rom_score = round((extension_score + flexion_score) / 2.0, 1)

    drift_values = _median_smooth([float(item["elbow_drift"]) for item in results], 5)
    drift_85 = _safe_percentile(drift_values, 85)

    drift_free = 0.32 if view == "front" else 0.10
    drift_penalty = 0.75 if view == "front" else 0.70
    elbow_stability_score = score_from_error(max(0.0, drift_85 - drift_free), drift_penalty)

    torso_values = _median_smooth([float(item["torso_metric"]) for item in results], 5)
    torso_variation = _safe_percentile(torso_values, 90) - _safe_percentile(torso_values, 10)
    if view == "front":
        torso_stability_score = score_from_error(max(0.0, torso_variation - 0.025), 0.22)
    else:
        torso_stability_score = score_from_error(max(0.0, torso_variation - 3.0), 24.0)

    wrist_values = [float(item["wrist_score"]) for item in results if float(item["wrist_score"]) >= 0]
    wrist_reliable = view == "side" and len(wrist_values) >= max(3, len(results) // 3)
    wrist_score = round(_robust_mean(wrist_values), 1) if wrist_reliable else 0.0

    view_name = "önden" if view == "front" else "yandan"
    elbow_category = category(
        elbow_stability_score,
        f"Dirsekler {view_name} çekimde genel olarak sabit kaldı.",
        f"Dirseklerde {view_name} çekimde belirgin kayma var. Üst kolunuzu sabit tutun.",
    )
    torso_category = category(
        torso_stability_score,
        "Gövde salınımı düşük; momentum kullanımı sınırlı.",
        "Gövde salınımı tespit edildi. Ağırlığı azaltıp kontrollü tekrar yapın.",
    )
    rom_category = category(
        rom_score,
        "Hareket açıklığı yeterli; açma ve bükme evreleri tamamlandı.",
        "Hareket açıklığı sınırlı. Dirseği kontrollü açıp daha fazla bükün.",
    )
    wrist_category = (
        category(wrist_score, "Bilek hizası genel olarak nötr.", "Bilekte belirgin bükülme var. Bileği ön kolla aynı hizada tutun.")
        if wrist_reliable
        else KategoriSonuc(skor=0.0, mesaj="Bilek hizası bu açıdan güvenilir biçimde değerlendirilemedi.")
    )

    if wrist_reliable:
        score_parts = [(elbow_stability_score, 0.30), (torso_stability_score, 0.25), (rom_score, 0.30), (wrist_score, 0.15)]
    else:
        score_parts = [(elbow_stability_score, 0.35), (torso_stability_score, 0.30), (rom_score, 0.35)]
    general_score = round(_clamp(sum(score * weight for score, weight in score_parts)) * 2.0) / 2.0

    summary_categories = [("dirsek sabitliği", elbow_stability_score), ("gövde salınımı kontrolü", torso_stability_score), ("hareket açıklığı", rom_score)]
    if wrist_reliable:
        summary_categories.append(("bilek hizası", wrist_score))
    _, problems, positive_message, improvement_message = build_summary(summary_categories)

    note = f"Skor: %{general_score} | Açı: {view_name} | " + (", ".join(problems) if problems else "Tüm kategoriler iyi")
    save_history(db, current_user.id, "biceps_curl_session", general_score, int(round((min_angle + max_angle) / 2.0)), note)

    return BicepsCurlSessionResult(
        toplam_kare=len(results),
        analiz_kare=len(results),
        genel_skor=general_score,
        dirsek_sabitligi=elbow_category,
        govde_salinimi=torso_category,
        hareket_acikligi=rom_category,
        bilek_hizasi=wrist_category,
        olumlu_mesaj=f"{positive_message} Çekim açısı otomatik olarak {view_name} algılandı.",
        gelistirilecek_mesaj=improvement_message,
    )


def _arm_frame_metrics(
    lm_flat: Sequence[float],
) -> Optional[Dict[str, float]]:
    required = [
        LEFT_SHOULDER,
        RIGHT_SHOULDER,
        LEFT_ELBOW,
        RIGHT_ELBOW,
        LEFT_WRIST,
        RIGHT_WRIST,
        LEFT_HIP,
        RIGHT_HIP,
    ]
    if not landmarks_visible(lm_flat, required, threshold=0.42):
        return None

    left_shoulder = point(lm_flat, LEFT_SHOULDER)
    right_shoulder = point(lm_flat, RIGHT_SHOULDER)
    left_elbow = point(lm_flat, LEFT_ELBOW)
    right_elbow = point(lm_flat, RIGHT_ELBOW)
    left_wrist = point(lm_flat, LEFT_WRIST)
    right_wrist = point(lm_flat, RIGHT_WRIST)
    left_hip = point(lm_flat, LEFT_HIP)
    right_hip = point(lm_flat, RIGHT_HIP)

    shoulder_mid = midpoint(left_shoulder, right_shoulder)
    hip_mid = midpoint(left_hip, right_hip)
    torso_length = point_distance(shoulder_mid, hip_mid)
    if torso_length < EPSILON:
        return None

    left_upper = point_distance(left_shoulder, left_elbow)
    right_upper = point_distance(right_shoulder, right_elbow)
    left_forearm = point_distance(left_elbow, left_wrist)
    right_forearm = point_distance(right_elbow, right_wrist)
    if min(left_upper, right_upper, left_forearm, right_forearm) < EPSILON:
        return None

    left_elbow_angle = calculate_angle(left_shoulder, left_elbow, left_wrist)
    right_elbow_angle = calculate_angle(right_shoulder, right_elbow, right_wrist)
    left_shoulder_angle = calculate_angle(left_hip, left_shoulder, left_elbow)
    right_shoulder_angle = calculate_angle(right_hip, right_shoulder, right_elbow)

    left_wrist_alignment = normalized_distance(
        abs(left_wrist[0] - left_elbow[0]),
        left_forearm,
    )
    right_wrist_alignment = normalized_distance(
        abs(right_wrist[0] - right_elbow[0]),
        right_forearm,
    )
    torso_lean = normalized_distance(
        abs(shoulder_mid[0] - hip_mid[0]),
        torso_length,
    )

    return {
        "left_elbow_angle": left_elbow_angle,
        "right_elbow_angle": right_elbow_angle,
        "left_shoulder_angle": left_shoulder_angle,
        "right_shoulder_angle": right_shoulder_angle,
        "left_wrist_alignment": left_wrist_alignment,
        "right_wrist_alignment": right_wrist_alignment,
        "torso_lean": torso_lean,
    }


@router.post("/shoulder-press-session")
async def analyze_shoulder_press_session(
    data: SessionData,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    results = [
        result
        for frame in data.frames
        if len(frame) >= MIN_FRAME_LENGTH
        for result in [_arm_frame_metrics(frame)]
        if result is not None
    ]
    if len(results) < 8:
        raise HTTPException(
            status_code=400,
            detail="Shoulder press analizi için yeterli sayıda net kare bulunamadı.",
        )

    left_elbow = _median_smooth(
        [float(item["left_elbow_angle"]) for item in results],
        5,
    )
    right_elbow = _median_smooth(
        [float(item["right_elbow_angle"]) for item in results],
        5,
    )
    mean_elbow = [
        (left + right) / 2.0
        for left, right in zip(left_elbow, right_elbow)
    ]
    minimum_angle = _safe_percentile(mean_elbow, 10)
    maximum_angle = _safe_percentile(mean_elbow, 90)
    movement_range = maximum_angle - minimum_angle
    if movement_range < 35:
        raise HTTPException(
            status_code=400,
            detail="Shoulder press hareketi tespit edilemedi. Kolları omuz seviyesinden tam yukarı uzatın.",
        )

    start_score = score_from_error(
        max(0.0, abs(minimum_angle - 90.0) - 18.0),
        55.0,
    )
    lockout_score = score_from_error(
        max(0.0, 155.0 - maximum_angle),
        45.0,
    )
    rom_score = round((start_score + lockout_score) / 2.0, 1)

    symmetry_values = [
        abs(left - right)
        for left, right in zip(left_elbow, right_elbow)
    ]
    symmetry_error = _safe_percentile(symmetry_values, 85)
    symmetry_score = score_from_error(
        max(0.0, symmetry_error - 8.0),
        35.0,
    )

    wrist_values = [
        (
            float(item["left_wrist_alignment"])
            + float(item["right_wrist_alignment"])
        )
        / 2.0
        for item in results
    ]
    wrist_error = _safe_percentile(wrist_values, 85)
    wrist_score = score_from_error(max(0.0, wrist_error - 0.12), 0.70)

    torso_values = _median_smooth(
        [float(item["torso_lean"]) for item in results],
        5,
    )
    torso_variation = (
        _safe_percentile(torso_values, 90)
        - _safe_percentile(torso_values, 10)
    )
    torso_score = score_from_error(
        max(0.0, torso_variation - 0.025),
        0.20,
    )

    left_shoulder = _median_smooth(
        [float(item["left_shoulder_angle"]) for item in results],
        5,
    )
    right_shoulder = _median_smooth(
        [float(item["right_shoulder_angle"]) for item in results],
        5,
    )
    shoulder_peak = _safe_percentile(
        [
            (left + right) / 2.0
            for left, right in zip(left_shoulder, right_shoulder)
        ],
        90,
    )
    overhead_score = score_from_error(
        max(0.0, 155.0 - shoulder_peak),
        50.0,
    )

    general_score = round(
        _clamp(
            rom_score * 0.30
            + wrist_score * 0.20
            + symmetry_score * 0.20
            + lockout_score * 0.15
            + torso_score * 0.15
        ) * 2.0
    ) / 2.0

    categories = [
        ("hareket açıklığı", rom_score),
        ("dirsek-bilek hizası", wrist_score),
        ("sağ-sol simetri", symmetry_score),
        ("üst kilitleme", lockout_score),
        ("gövde kontrolü", torso_score),
    ]
    _, problems, positive_message, improvement_message = build_summary(categories)

    save_history(
        db,
        current_user.id,
        "shoulder_press_session",
        general_score,
        int(round(maximum_angle)),
        f"Skor: %{general_score} | "
        + (", ".join(problems) if problems else "Tüm kategoriler iyi"),
    )

    return {
        "toplam_kare": len(results),
        "analiz_kare": len(results),
        "genel_skor": general_score,
        "hareket_acikligi": category(
            rom_score,
            "Başlangıç ve üst pozisyon hareket açıklığı yeterli.",
            "Kolları omuz seviyesinden tam yukarı uzatın.",
        ),
        "dirsek_bilek_hizasi": category(
            wrist_score,
            "Dirsek ve bilek hattı kontrollü.",
            "Bilekleri dirseklerin üzerinde tutun.",
        ),
        "sag_sol_simetri": category(
            symmetry_score,
            "İki kol uyumlu hareket ediyor.",
            "Kolları aynı hız ve yükseklikte hareket ettirin.",
        ),
        "ust_kilitleme": category(
            min(lockout_score, overhead_score),
            "Üst pozisyonda kollar yeterince uzanıyor.",
            "Üst pozisyonda dirsekleri kontrollü biçimde açın.",
        ),
        "govde_kontrolu": category(
            torso_score,
            "Gövde hareket boyunca dengeli.",
            "Bel ve gövde salınımını azaltın.",
        ),
        "olumlu_mesaj": positive_message,
        "gelistirilecek_mesaj": improvement_message,
    }


@router.post("/lateral-raise-session")
async def analyze_lateral_raise_session(
    data: SessionData,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    results = [
        result
        for frame in data.frames
        if len(frame) >= MIN_FRAME_LENGTH
        for result in [_arm_frame_metrics(frame)]
        if result is not None
    ]
    if len(results) < 8:
        raise HTTPException(
            status_code=400,
            detail="Lateral raise analizi için yeterli sayıda net kare bulunamadı.",
        )

    left_raise = _median_smooth(
        [float(item["left_shoulder_angle"]) for item in results],
        5,
    )
    right_raise = _median_smooth(
        [float(item["right_shoulder_angle"]) for item in results],
        5,
    )
    mean_raise = [
        (left + right) / 2.0
        for left, right in zip(left_raise, right_raise)
    ]
    minimum_raise = _safe_percentile(mean_raise, 10)
    maximum_raise = _safe_percentile(mean_raise, 90)
    movement_range = maximum_raise - minimum_raise
    if movement_range < 35:
        raise HTTPException(
            status_code=400,
            detail="Lateral raise hareketi tespit edilemedi. Kolları yandan omuz seviyesine kaldırın.",
        )

    bottom_score = score_from_error(
        max(0.0, minimum_raise - 30.0),
        55.0,
    )
    if 75.0 <= maximum_raise <= 105.0:
        height_score = 100.0
    elif maximum_raise < 75.0:
        height_score = score_from_error(75.0 - maximum_raise, 50.0)
    else:
        height_score = score_from_error(maximum_raise - 105.0, 45.0)
    rom_score = round((bottom_score + height_score) / 2.0, 1)

    symmetry_values = [
        abs(left - right)
        for left, right in zip(left_raise, right_raise)
    ]
    symmetry_error = _safe_percentile(symmetry_values, 85)
    symmetry_score = score_from_error(
        max(0.0, symmetry_error - 7.0),
        32.0,
    )

    left_elbow = _median_smooth(
        [float(item["left_elbow_angle"]) for item in results],
        5,
    )
    right_elbow = _median_smooth(
        [float(item["right_elbow_angle"]) for item in results],
        5,
    )
    elbow_values = [
        (left + right) / 2.0
        for left, right in zip(left_elbow, right_elbow)
    ]
    elbow_error = _robust_mean(
        [abs(value - 165.0) for value in elbow_values]
    )
    elbow_score = score_from_error(max(0.0, elbow_error - 8.0), 45.0)

    torso_values = _median_smooth(
        [float(item["torso_lean"]) for item in results],
        5,
    )
    torso_variation = (
        _safe_percentile(torso_values, 90)
        - _safe_percentile(torso_values, 10)
    )
    torso_score = score_from_error(
        max(0.0, torso_variation - 0.020),
        0.18,
    )

    peak_frames = sorted(
        results,
        key=lambda item: (
            float(item["left_shoulder_angle"])
            + float(item["right_shoulder_angle"])
        )
        / 2.0,
        reverse=True,
    )[:max(3, len(results) // 4)]
    peak_angles = [
        (
            float(item["left_shoulder_angle"])
            + float(item["right_shoulder_angle"])
        )
        / 2.0
        for item in peak_frames
    ]
    peak_variation = (
        _safe_percentile(peak_angles, 90)
        - _safe_percentile(peak_angles, 10)
    )
    control_score = score_from_error(
        max(0.0, peak_variation - 8.0),
        35.0,
    )

    general_score = round(
        _clamp(
            height_score * 0.25
            + symmetry_score * 0.22
            + elbow_score * 0.18
            + torso_score * 0.20
            + rom_score * 0.15
        ) * 2.0
    ) / 2.0

    categories = [
        ("kol kaldırma açısı", height_score),
        ("sağ-sol simetri", symmetry_score),
        ("dirsek pozisyonu", elbow_score),
        ("gövde salınımı", torso_score),
        ("hareket açıklığı", rom_score),
    ]
    _, problems, positive_message, improvement_message = build_summary(categories)

    save_history(
        db,
        current_user.id,
        "lateral_raise_session",
        general_score,
        int(round(maximum_raise)),
        f"Skor: %{general_score} | "
        + (", ".join(problems) if problems else "Tüm kategoriler iyi"),
    )

    return {
        "toplam_kare": len(results),
        "analiz_kare": len(results),
        "genel_skor": general_score,
        "kol_kaldirma_acisi": category(
            height_score,
            "Kollar omuz seviyesine kontrollü biçimde ulaşıyor.",
            "Kolları omuz seviyesine kadar kaldırın ve aşırı yükseltmeyin.",
        ),
        "sag_sol_simetri": category(
            symmetry_score,
            "İki kol uyumlu hareket ediyor.",
            "Kolları aynı yükseklik ve hızda kaldırın.",
        ),
        "dirsek_pozisyonu": category(
            elbow_score,
            "Dirsek açısı hareket boyunca kontrollü.",
            "Dirsekleri hafif kırık ve sabit tutun.",
        ),
        "govde_salinimi": category(
            torso_score,
            "Gövde salınımı düşük.",
            "Ağırlığı azaltıp gövdeyi sabit tutun.",
        ),
        "hareket_acikligi": category(
            min(rom_score, control_score),
            "Alt ve üst pozisyon hareket açıklığı yeterli.",
            "Kolları kontrollü indirip her tekrarda aynı aralığı kullanın.",
        ),
        "olumlu_mesaj": positive_message,
        "gelistirilecek_mesaj": improvement_message,
    }


def analyze_single_frame_deadlift(
    lm_flat: Sequence[float],
) -> Optional[Dict[str, float | str]]:
    left_chain = [
        LEFT_EAR,
        LEFT_SHOULDER,
        LEFT_WRIST,
        LEFT_HIP,
        LEFT_KNEE,
        LEFT_ANKLE,
    ]
    right_chain = [
        RIGHT_EAR,
        RIGHT_SHOULDER,
        RIGHT_WRIST,
        RIGHT_HIP,
        RIGHT_KNEE,
        RIGHT_ANKLE,
    ]

    side = choose_visible_side(lm_flat, left_chain, right_chain)
    chain = left_chain if side == "left" else right_chain
    if not landmarks_visible(lm_flat, chain, threshold=0.45):
        return None

    ear = point(lm_flat, chain[0])
    shoulder = point(lm_flat, chain[1])
    wrist = point(lm_flat, chain[2])
    hip = point(lm_flat, chain[3])
    knee = point(lm_flat, chain[4])
    ankle = point(lm_flat, chain[5])

    torso_length = point_distance(shoulder, hip)
    shin_length = point_distance(knee, ankle)
    if torso_length < EPSILON or shin_length < EPSILON:
        return None

    hip_angle = calculate_angle(shoulder, hip, knee)
    knee_angle = calculate_angle(hip, knee, ankle)

    head_shoulder_hip_angle = calculate_angle(ear, shoulder, hip)
    spine_error = abs(head_shoulder_hip_angle - 165.0)
    spine_score = score_from_error(max(0.0, spine_error - 8.0), 70.0)

    wrist_to_shin = normalized_distance(
        abs(wrist[0] - ((knee[0] + ankle[0]) / 2.0)),
        shin_length,
    )

    body_center_x = shoulder[0] * 0.25 + hip[0] * 0.50 + knee[0] * 0.25
    balance_error = normalized_distance(abs(body_center_x - ankle[0]), torso_length)

    return {
        "side": side,
        "hip_angle": hip_angle,
        "knee_angle": knee_angle,
        "spine_score": spine_score,
        "wrist_x": wrist[0],
        "wrist_y": wrist[1],
        "wrist_to_shin": wrist_to_shin,
        "balance_error": balance_error,
    }


@router.post("/deadlift-session", response_model=DeadliftSessionResult)
async def analyze_deadlift_session(
    data: SessionData,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    results = [
        result
        for frame in data.frames
        if len(frame) >= MIN_FRAME_LENGTH
        for result in [analyze_single_frame_deadlift(frame)]
        if result is not None
    ]

    if len(results) < 5:
        raise HTTPException(
            status_code=400,
            detail="Deadlift analizi için yeterli sayıda net kare bulunamadı.",
        )

    hip_angles = [float(item["hip_angle"]) for item in results]
    wrist_y_values = [float(item["wrist_y"]) for item in results]

    hip_range = _safe_percentile(hip_angles, 90) - _safe_percentile(hip_angles, 10)
    wrist_vertical_range = _safe_percentile(
        wrist_y_values, 90
    ) - _safe_percentile(wrist_y_values, 10)

    if hip_range < 25 or wrist_vertical_range < 0.10:
        raise HTTPException(
            status_code=400,
            detail=(
                "Tam deadlift hareketi tespit edilemedi. "
                "Başlangıç ve kilitlenme pozisyonlarının tamamı görünmelidir."
            ),
        )

    spine_score = round(
        float(np.mean([float(item["spine_score"]) for item in results])),
        1,
    )

    bottom_count = max(3, len(results) // 4)
    bottom_frames = sorted(
        results,
        key=lambda item: float(item["wrist_y"]),
        reverse=True,
    )[:bottom_count]
    top_frames = sorted(
        results,
        key=lambda item: float(item["wrist_y"]),
    )[:bottom_count]

    bottom_hip_angle = float(
        np.mean([float(item["hip_angle"]) for item in bottom_frames])
    )
    top_hip_angle = float(
        np.mean([float(item["hip_angle"]) for item in top_frames])
    )

    bottom_score = score_from_error(abs(bottom_hip_angle - 75.0), 70.0)
    lockout_score = score_from_error(abs(top_hip_angle - 170.0), 55.0)
    hip_position_score = round((bottom_score + lockout_score) / 2.0, 1)

    wrist_x_values = [float(item["wrist_x"]) for item in results]
    bar_path_variation = _safe_percentile(
        wrist_x_values, 90
    ) - _safe_percentile(wrist_x_values, 10)
    average_shin_distance = float(
        np.mean([float(item["wrist_to_shin"]) for item in bottom_frames])
    )

    vertical_path_score = score_from_error(
        max(0.0, bar_path_variation - 0.015),
        0.18,
    )
    shin_proximity_score = score_from_error(
        max(0.0, average_shin_distance - 0.10),
        0.90,
    )
    bar_path_score = round(
        (vertical_path_score * 0.55 + shin_proximity_score * 0.45),
        1,
    )

    balance_errors = [float(item["balance_error"]) for item in results]
    balance_error_90 = _safe_percentile(balance_errors, 90)
    balance_score = score_from_error(max(0.0, balance_error_90 - 0.08), 0.75)

    spine_category = category(
        spine_score,
        "Baş-omuz-kalça hizası genel olarak korunuyor.",
        "Baş-omuz-kalça hizasında bozulma var. Omurgayı nötr tutmaya çalışın.",
    )
    hip_category = category(
        hip_position_score,
        "Başlangıç ve kilitlenme evrelerinde kalça menteşesi uyumlu.",
        "Kalça menteşesi yetersiz. Hareketi kalçadan başlatıp üstte tam kilitlenin.",
    )
    bar_category = category(
        bar_path_score,
        "Bileklerin temsil ettiği yaklaşık bar yolu vücuda yakın ve dikey.",
        "Yaklaşık bar yolu vücuttan uzaklaşıyor veya yatay sapma gösteriyor.",
    )
    balance_category = category(
        balance_score,
        "Ağırlık merkezi ayak tabanı üzerinde dengeli.",
        "Ağırlık merkezi öne veya arkaya kayıyor.",
    )

    general_score = round(
        _clamp(
            spine_score * 0.30
            + hip_position_score * 0.30
            + bar_path_score * 0.25
            + balance_score * 0.15
        ),
        1,
    )

    _, problems, positive_message, improvement_message = build_summary(
        [
            ("omurga hizası", spine_score),
            ("kalça pozisyonu", hip_position_score),
            ("bar yolu", bar_path_score),
            ("denge", balance_score),
        ]
    )

    note = f"Skor: %{general_score} | " + (
        ", ".join(problems) if problems else "Tüm kategoriler iyi"
    )
    save_history(
        db,
        current_user.id,
        "deadlift_session",
        general_score,
        int(round(bottom_hip_angle)),
        note,
    )

    return DeadliftSessionResult(
        toplam_kare=len(results),
        analiz_kare=len(results),
        genel_skor=general_score,
        omurga_notrluğu=spine_category,
        kalca_pozisyonu=hip_category,
        bar_yolu=bar_category,
        denge=balance_category,
        olumlu_mesaj=positive_message,
        gelistirilecek_mesaj=improvement_message,
    )


def _line_deviation(
    landmarks: Sequence[float],
    upper: Tuple[int, int],
    middle: Tuple[int, int],
    lower: Tuple[int, int],
) -> Optional[float]:
    upper_point = midpoint(point(landmarks, upper[0]), point(landmarks, upper[1]))
    middle_point = midpoint(point(landmarks, middle[0]), point(landmarks, middle[1]))
    lower_point = midpoint(point(landmarks, lower[0]), point(landmarks, lower[1]))

    line_length = point_distance(upper_point, lower_point)
    if line_length < EPSILON:
        return None

    numerator = abs(
        (lower_point[1] - upper_point[1]) * middle_point[0]
        - (lower_point[0] - upper_point[0]) * middle_point[1]
        + lower_point[0] * upper_point[1]
        - lower_point[1] * upper_point[0]
    )
    return float(numerator / line_length)


def _line_analysis_and_save(
    db: Session,
    current_user,
    data: PoseData,
    required_points: Sequence[int],
    upper: Tuple[int, int],
    middle: Tuple[int, int],
    lower: Tuple[int, int],
    movement_name: str,
    high_message: Tuple[str, str],
    low_message: Tuple[str, str],
    good_message: Tuple[str, str],
    threshold: float = 0.05,
):
    landmarks = data.landmarks
    if not landmarks_visible(landmarks, required_points, threshold=0.40):
        raise HTTPException(
            status_code=400,
            detail="Vücudunuz net görünmüyor. Tüm vücudunuz kadraja girmelidir.",
        )

    deviation = _line_deviation(landmarks, upper, middle, lower)
    if deviation is None:
        raise HTTPException(status_code=400, detail="Pozisyon tespit edilemedi.")

    if deviation <= threshold:
        situation, message = good_message
    elif deviation <= threshold * 2:
        situation, message = low_message
    else:
        situation, message = high_message

    score = score_from_error(deviation, threshold * 4)
    record = save_history(
        db,
        current_user.id,
        movement_name,
        score,
        0,
        f"{situation}: {message}",
    )
    return {
        "kayit_id": record.id,
        "durum": situation,
        "skor": score,
        "fark": round(deviation, 4),
        "antrenor_mesaji": message,
    }


@router.post("/plank")
async def analyze_plank(
    data: PoseData,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return _line_analysis_and_save(
        db,
        current_user,
        data,
        [LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_HIP, RIGHT_HIP, LEFT_ANKLE, RIGHT_ANKLE],
        (LEFT_SHOULDER, RIGHT_SHOULDER),
        (LEFT_HIP, RIGHT_HIP),
        (LEFT_ANKLE, RIGHT_ANKLE),
        "plank",
        ("Belirgin Hat Bozukluğu", "Kalçanızı omuz-ayak hattına yaklaştırın."),
        ("Geliştirilebilir", "Vücudunuzu biraz daha düz tutun."),
        ("İyi Form", "Vücudunuz omuzdan ayak bileğine düz bir hat oluşturuyor."),
    )


@router.post("/sinav")
async def analyze_sinav(
    data: PoseData,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return _line_analysis_and_save(
        db,
        current_user,
        data,
        [LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_HIP, RIGHT_HIP, LEFT_ANKLE, RIGHT_ANKLE],
        (LEFT_SHOULDER, RIGHT_SHOULDER),
        (LEFT_HIP, RIGHT_HIP),
        (LEFT_ANKLE, RIGHT_ANKLE),
        "sinav",
        ("Belirgin Hat Bozukluğu", "Bel ve kalçanızı omuz-ayak hattına getirin."),
        ("Geliştirilebilir", "Gövde hattınızı biraz daha düz tutun."),
        ("İyi Form", "Gövdeniz şınav boyunca düz bir hat oluşturuyor."),
    )


@router.post("/yan-plank")
async def analyze_yan_plank(
    data: PoseData,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return _line_analysis_and_save(
        db,
        current_user,
        data,
        [LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_HIP, RIGHT_HIP, LEFT_ANKLE, RIGHT_ANKLE],
        (LEFT_SHOULDER, RIGHT_SHOULDER),
        (LEFT_HIP, RIGHT_HIP),
        (LEFT_ANKLE, RIGHT_ANKLE),
        "yan_plank",
        ("Kalça Hattı Bozuk", "Kalçanızı omuz-ayak hattına getirin."),
        ("Geliştirilebilir", "Kalçanızı biraz daha sabit tutun."),
        ("İyi Form", "Vücudunuz yan plankta düz bir hat oluşturuyor."),
    )


@router.post("/kopru")
async def analyze_kopru(
    data: PoseData,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return _line_analysis_and_save(
        db,
        current_user,
        data,
        [LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_HIP, RIGHT_HIP, LEFT_KNEE, RIGHT_KNEE],
        (LEFT_SHOULDER, RIGHT_SHOULDER),
        (LEFT_HIP, RIGHT_HIP),
        (LEFT_KNEE, RIGHT_KNEE),
        "kopru",
        ("Kalça Hattı Bozuk", "Kalçanızı omuz-diz hattına getirin."),
        ("Geliştirilebilir", "Kalçanızı biraz daha yükseltin."),
        ("İyi Form", "Kalçanız omuz-diz hattına yakın."),
    )


@router.post("/supermen")
async def analyze_superman(
    data: PoseData,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    landmarks = data.landmarks
    required = [
        LEFT_SHOULDER,
        RIGHT_SHOULDER,
        LEFT_HIP,
        RIGHT_HIP,
        LEFT_ANKLE,
        RIGHT_ANKLE,
    ]
    if not landmarks_visible(landmarks, required, threshold=0.40):
        raise HTTPException(
            status_code=400,
            detail="Vücudunuz net görünmüyor. Tüm vücudunuz kadraja girmelidir.",
        )

    deviation = _line_deviation(
        landmarks,
        (LEFT_SHOULDER, RIGHT_SHOULDER),
        (LEFT_HIP, RIGHT_HIP),
        (LEFT_ANKLE, RIGHT_ANKLE),
    )
    if deviation is None:
        raise HTTPException(status_code=400, detail="Pozisyon tespit edilemedi.")

    score = round(_clamp((deviation / 0.15) * 100.0), 1)
    if deviation >= 0.08:
        situation = "İyi Form"
        message = "Kol ve bacak kaldırma yüksekliği yeterli."
    else:
        situation = "Yetersiz Kaldırma"
        message = "Kol ve bacaklarınızı biraz daha yukarı kaldırın."

    record = save_history(
        db,
        current_user.id,
        "supermen",
        score,
        0,
        f"{situation}: {message}",
    )
    return {
        "kayit_id": record.id,
        "durum": situation,
        "skor": score,
        "fark": round(deviation, 4),
        "antrenor_mesaji": message,
    }


@router.post("/duvar-squat")
async def analyze_wall_squat(
    data: PoseData,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    landmarks = data.landmarks
    side = choose_visible_side(
        landmarks,
        [LEFT_HIP, LEFT_KNEE, LEFT_ANKLE],
        [RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE],
    )
    indices = (
        [LEFT_HIP, LEFT_KNEE, LEFT_ANKLE]
        if side == "left"
        else [RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE]
    )
    if not landmarks_visible(landmarks, indices):
        raise HTTPException(status_code=400, detail="Bacak noktaları net görünmüyor.")

    angle = calculate_angle(
        point(landmarks, indices[0]),
        point(landmarks, indices[1]),
        point(landmarks, indices[2]),
    )
    score = score_from_error(abs(angle - 90.0), 50.0)

    if 80 <= angle <= 100:
        situation = "İyi Form"
        message = "Diz açınız yaklaşık 90 derece."
    elif angle < 80:
        situation = "Çok Derin"
        message = "Biraz yukarı kalkın."
    else:
        situation = "Yeterince Derin Değil"
        message = "Biraz daha aşağı inin."

    record = save_history(
        db,
        current_user.id,
        "duvar_squat",
        score,
        int(round(angle)),
        f"{situation}: {message}",
    )
    return {
        "kayit_id": record.id,
        "durum": situation,
        "skor": score,
        "aci": round(angle, 1),
        "antrenor_mesaji": message,
    }


@router.post("/lunge")
async def analyze_lunge(
    data: PoseData,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    landmarks = data.landmarks
    side = choose_visible_side(
        landmarks,
        [LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE, LEFT_ANKLE],
        [RIGHT_SHOULDER, RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE],
    )
    indices = (
        [LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE, LEFT_ANKLE]
        if side == "left"
        else [RIGHT_SHOULDER, RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE]
    )
    if not landmarks_visible(landmarks, indices):
        raise HTTPException(status_code=400, detail="Lunge noktaları net görünmüyor.")

    shoulder, hip, knee, ankle = [point(landmarks, idx) for idx in indices]
    knee_angle = calculate_angle(hip, knee, ankle)
    torso_from_vertical = abs(abs(calculate_line_angle(hip, shoulder)) - 90.0)

    knee_score = score_from_error(abs(knee_angle - 90.0), 60.0)
    torso_score = score_from_error(max(0.0, torso_from_vertical - 5.0), 40.0)
    score = round((knee_score * 0.65 + torso_score * 0.35), 1)

    if score >= 75:
        situation, message = "İyi Form", "Ön diz açısı ve gövde kontrolü iyi."
    elif torso_score < knee_score:
        situation, message = "Gövde Kontrolü Zayıf", "Gövdenizi daha dik tutun."
    else:
        situation, message = "Diz Açısı Uygun Değil", "Ön dizi yaklaşık 90 dereceye getirin."

    record = save_history(
        db,
        current_user.id,
        "lunge",
        score,
        int(round(knee_angle)),
        f"{situation}: {message}",
    )
    return {
        "kayit_id": record.id,
        "durum": situation,
        "skor": score,
        "antrenor_mesaji": message,
    }


@router.post("/omuz-acikligi")
async def analyze_shoulder_openness(
    data: PoseData,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    landmarks = data.landmarks
    required = [LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_WRIST, RIGHT_WRIST]
    if not landmarks_visible(landmarks, required, threshold=0.40):
        raise HTTPException(status_code=400, detail="Omuz ve bilek noktaları net görünmüyor.")

    left_difference = abs(point(landmarks, LEFT_WRIST)[1] - point(landmarks, LEFT_SHOULDER)[1])
    right_difference = abs(point(landmarks, RIGHT_WRIST)[1] - point(landmarks, RIGHT_SHOULDER)[1])
    average_difference = (left_difference + right_difference) / 2.0
    score = score_from_error(average_difference, 0.20)

    situation = "İyi Form" if score >= 75 else "Kollar Omuz Hizasında Değil"
    message = (
        "Kollar omuz hizasında dengeli."
        if score >= 75
        else "Kollarınızı omuz hizasına getirin."
    )
    record = save_history(
        db,
        current_user.id,
        "omuz_acikligi",
        score,
        0,
        f"{situation}: {message}",
    )
    return {
        "kayit_id": record.id,
        "durum": situation,
        "skor": score,
        "antrenor_mesaji": message,
    }


@router.post("/one-egilme")
async def analyze_forward_fold(
    data: PoseData,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    landmarks = data.landmarks
    side = choose_visible_side(
        landmarks,
        [LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE, LEFT_ANKLE, LEFT_WRIST],
        [RIGHT_SHOULDER, RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE, RIGHT_WRIST],
    )
    indices = (
        [LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE, LEFT_ANKLE, LEFT_WRIST]
        if side == "left"
        else [RIGHT_SHOULDER, RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE, RIGHT_WRIST]
    )
    if not landmarks_visible(landmarks, indices, threshold=0.40):
        raise HTTPException(status_code=400, detail="Gerekli vücut noktaları görünmüyor.")

    shoulder, hip, knee, ankle, wrist = [point(landmarks, idx) for idx in indices]
    hip_angle = calculate_angle(shoulder, hip, knee)
    leg_length = point_distance(hip, ankle)
    hand_to_ankle = normalized_distance(point_distance(wrist, ankle), leg_length)

    hip_score = score_from_error(max(0.0, hip_angle - 70.0), 100.0)
    reach_score = score_from_error(hand_to_ankle, 1.0)
    score = round((hip_score * 0.55 + reach_score * 0.45), 1)

    situation = "İyi Esneklik" if score >= 75 else "Geliştirme Gerekli"
    message = (
        "Kalça açısı ve el-ayak mesafesi iyi."
        if score >= 75
        else "Dizleri kontrollü tutup hamstring esnekliğini geliştirin."
    )
    record = save_history(
        db,
        current_user.id,
        "one_egilme",
        score,
        int(round(hip_angle)),
        f"{situation}: {message}",
    )
    return {
        "kayit_id": record.id,
        "durum": situation,
        "skor": score,
        "antrenor_mesaji": message,
    }


@router.post("/ters-kopru")
async def analyze_reverse_bridge(
    data: PoseData,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    landmarks = data.landmarks
    side = choose_visible_side(
        landmarks,
        [LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE, LEFT_ANKLE],
        [RIGHT_SHOULDER, RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE],
    )
    indices = (
        [LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE, LEFT_ANKLE]
        if side == "left"
        else [RIGHT_SHOULDER, RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE]
    )
    if not landmarks_visible(landmarks, indices):
        raise HTTPException(status_code=400, detail="Gerekli vücut noktaları görünmüyor.")

    shoulder, hip, knee, ankle = [point(landmarks, idx) for idx in indices]
    knee_angle = calculate_angle(hip, knee, ankle)
    hip_line_deviation = _line_deviation(
        landmarks,
        (LEFT_SHOULDER, RIGHT_SHOULDER),
        (LEFT_HIP, RIGHT_HIP),
        (LEFT_KNEE, RIGHT_KNEE),
    )
    if hip_line_deviation is None:
        raise HTTPException(status_code=400, detail="Kalça hattı ölçülemedi.")

    knee_score = score_from_error(abs(knee_angle - 90.0), 65.0)
    hip_score = score_from_error(hip_line_deviation, 0.20)
    score = round((knee_score * 0.45 + hip_score * 0.55), 1)

    situation = "İyi Form" if score >= 75 else "Kalça veya Diz Pozisyonu Hatalı"
    message = (
        "Kalça yüksekliği ve diz açısı uygun."
        if score >= 75
        else "Kalçanızı yükseltip diz açınızı ayarlayın."
    )
    record = save_history(
        db,
        current_user.id,
        "ters_kopru",
        score,
        int(round(knee_angle)),
        f"{situation}: {message}",
    )
    return {
        "kayit_id": record.id,
        "durum": situation,
        "skor": score,
        "antrenor_mesaji": message,
    }


@router.get("/history", response_model=List[HistoryRead])
async def get_history(
    sayfa: int = 1,
    sayfa_boyutu: int = 20,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    page = max(1, sayfa)
    page_size = min(100, max(1, sayfa_boyutu))

    query = (
        db.query(WorkoutHistory)
        .filter(WorkoutHistory.user_id == current_user.id)
        .order_by(WorkoutHistory.tarih.desc())
    )
    return query.offset((page - 1) * page_size).limit(page_size).all()


@router.get("/history/sayim")
async def get_history_count(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    total = (
        db.query(WorkoutHistory)
        .filter(WorkoutHistory.user_id == current_user.id)
        .count()
    )
    return {"toplam": total}


@router.delete("/history/{kayit_id}")
async def delete_history(
    kayit_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    record = (
        db.query(WorkoutHistory)
        .filter(
            WorkoutHistory.id == kayit_id,
            WorkoutHistory.user_id == current_user.id,
        )
        .first()
    )

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kayıt bulunamadı.",
        )

    db.delete(record)
    db.commit()
    return {"mesaj": "Kayıt silindi."}

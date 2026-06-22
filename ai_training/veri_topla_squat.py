import cv2
import mediapipe as mp
import csv
import numpy as np
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, 'squat_veri.csv')

VIDEOLAR = [
    ('squat_dogru_1.mp4', 'dogru_squat'),
    ('squat_dogru_2.mp4', 'dogru_squat'),
    ('squat_dogru_3.mp4', 'dogru_squat'),
    ('squat_yanlis_1.mp4', 'yanlis_squat'),
    ('squat_yanlis_2.mp4', 'yanlis_squat'),
    ('squat_yanlis_3.mp4', 'yanlis_squat'),
]

mp_pose = mp.solutions.pose

if os.path.exists(csv_path):
    os.remove(csv_path)
    print("Eski veri silindi.")

toplam_frame = 0

for video_dosya, sinif in VIDEOLAR:
    video_path = os.path.join(script_dir, video_dosya)

    if not os.path.exists(video_path):
        print(f"UYARI: {video_dosya} bulunamadı, atlanıyor.")
        continue

    cap = cv2.VideoCapture(video_path)
    video_toplam = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    video_tespit = 0

    with mp_pose.Pose(
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as pose:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(image)

            if not results.pose_landmarks:
                continue

            row = list(
                np.array(
                    [
                        [
                            landmark.x,
                            landmark.y,
                            landmark.z,
                            landmark.visibility,
                        ]
                        for landmark in results.pose_landmarks.landmark
                    ]
                ).flatten()
            )

            with open(csv_path, mode='a', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow([sinif] + row)

            video_tespit += 1
            toplam_frame += 1

    cap.release()

    oran = (video_tespit / video_toplam * 100) if video_toplam else 0
    print(
        f"{video_dosya}: {video_tespit}/{video_toplam} "
        f"frame tespit edildi (%{oran:.1f})"
    )

print(f"\nToplam {toplam_frame} frame kaydedildi → {csv_path}")

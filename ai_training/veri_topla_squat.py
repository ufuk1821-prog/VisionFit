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
    frame_sayisi = 0
    tespit_sayisi = 0

    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            frame_sayisi += 1
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            results = pose.process(image)
            if results.pose_landmarks:
                tespit_sayisi += 1
                row = list(np.array([
                    [lm.x, lm.y, lm.z, lm.visibility]
                    for lm in results.pose_landmarks.landmark
                ]).flatten())
                row.insert(0, sinif)
                with open(csv_path, mode='a', newline='') as f:
                    csv.writer(f).writerow(row)

    cap.release()
    toplam_frame += tespit_sayisi
    print(f"{video_dosya}: {tespit_sayisi}/{frame_sayisi} frame tespit edildi (%{tespit_sayisi/frame_sayisi*100:.1f})")

print(f"\nToplam {toplam_frame} frame kaydedildi → squat_veri.csv")
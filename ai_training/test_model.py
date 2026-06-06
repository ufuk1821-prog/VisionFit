import cv2
import mediapipe as mp
import pandas as pd
import numpy as np
import pickle
import os
import warnings
import math

warnings.filterwarnings('ignore')

def calculate_angle(a, b, c):
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    radians = math.atan2(c[1]-b[1], c[0]-b[0]) - math.atan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians*180.0/math.pi)
    if angle > 180.0:
        angle = 360 - angle
    return angle

script_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(script_dir, 'squat_model.pkl')
video_path = os.path.join(script_dir, 'yanlis_squat.mp4')

with open(model_path, 'rb') as f:
    model = pickle.load(f)

mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose
cap = cv2.VideoCapture(video_path)

with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        frame = cv2.resize(frame, (800, 600))
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(image)
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        
        if results.pose_landmarks:
            mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
            try:
                pose_landmarks = results.pose_landmarks.landmark
                row = list(np.array([[landmark.x, landmark.y, landmark.z, landmark.visibility] for landmark in pose_landmarks]).flatten())
                
                X = pd.DataFrame([row])
                hareket_sinifi = model.predict(X)[0]
                
                hip = [pose_landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].x, pose_landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].y]
                knee = [pose_landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].x, pose_landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].y]
                ankle = [pose_landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].x, pose_landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].y]
                
                angle = calculate_angle(hip, knee, ankle)
                
                cv2.rectangle(image, (0,0), (800, 40), (0, 0, 0), -1)
                
                if hareket_sinifi == 'dogru_squat':
                    durum = "FORM: OK"
                    renk = (0, 255, 0)
                else:
                    hata = "DIZ KONTROL ET" if angle < 90 else "BELI BUKUYORSUN"
                    durum = f"UYARI: {hata}"
                    renk = (0, 0, 255)
                    
                cv2.putText(image, f'{durum} | ACI: {int(angle)}', (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, renk, 2, cv2.LINE_AA)
                
            except:
                pass
                
        cv2.imshow('VisionFit Analiz', image)
        if cv2.waitKey(30) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()
import cv2
import mediapipe as mp
import csv
import numpy as np
import os

script_dir = os.path.dirname(os.path.abspath(__file__))

video_path = os.path.join(script_dir, 'yanlis_squat.mp4')
csv_path = os.path.join(script_dir, 'squat_veri.csv')

mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose


cap = cv2.VideoCapture(video_path)

with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image.flags.writeable = False
        
        results = pose.process(image)
        
        image.flags.writeable = True
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        
        if results.pose_landmarks:
            mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
            
            try:
                pose_landmarks = results.pose_landmarks.landmark
                row = list(np.array([[landmark.x, landmark.y, landmark.z, landmark.visibility] for landmark in pose_landmarks]).flatten())
                
                row.insert(0, 'yanlis_squat')
                
                with open(csv_path, mode='a', newline='') as f:
                    csv_writer = csv.writer(f, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
                    csv_writer.writerow(row)
            except:
                pass
                
        cv2.imshow('VisionFit Yanlis Veri Toplama', image)
        
        if cv2.waitKey(30) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()
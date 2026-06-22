import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import pickle
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, 'squat_veri.csv')
model_path = os.path.join(script_dir, 'squat_model.pkl')

print("1. Veriler Excel'den okunuyor...")
sutun_sayisi = 33 * 4
sutunlar = ['hareket_sinifi'] + [f'x{i}' for i in range(sutun_sayisi)]
df = pd.read_csv(csv_path, header=None, names=sutunlar)

X = df.drop('hareket_sinifi', axis=1)
y = df['hareket_sinifi']

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.3,
    random_state=1234,
)

print("2. VisionFit Yapay Zekası (Random Forest) eğitiliyor...")
pipeline = make_pipeline(
    StandardScaler(),
    RandomForestClassifier(n_estimators=100, random_state=1234),
)
model = pipeline.fit(X_train, y_train)

print("3. Eğitim bitti, test aşamasına geçiliyor...")
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print("-" * 30)
print(f"BÜYÜK SONUÇ - Modelin Doğruluk Oranı (Accuracy): %{accuracy * 100:.2f}")
print("-" * 30)

with open(model_path, 'wb') as f:
    pickle.dump(model, f)

print(f"Harika! Yapay zeka beyni '{model_path}' olarak klasöre kaydedildi.")

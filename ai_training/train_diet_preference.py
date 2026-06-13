import os
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

FOODS = ["yumurta", "et", "tavuk", "balik", "sut", "peynir", "yogurt", "ekmek", "seker", "mercimek", "nohut"]

POSITIVE_TEMPLATES = [
    "{food} seviyorum",
    "{food} bayilirim",
    "{food} cok severim",
    "{food} olsun lutfen",
    "{food} bol olsun",
    "{food} tercih ederim",
    "{food} istiyorum",
    "{food} yemeyi severim",
    "{food} cok lezzetli bence",
    "{food} her gun yiyebilirim",
]

NEGATIVE_TEMPLATES = [
    "{food}a alerjim var",
    "{food}e alerjim var",
    "{food} sevmiyorum",
    "{food} istemiyorum",
    "{food} olmasin",
    "{food} yemiyorum",
    "{food} tuketemiyorum",
    "{food} hic sevmem",
    "{food} bana dokunuyor",
    "{food}dan uzak durmak istiyorum",
]

def build_dataset():
    texts = []
    labels = []

    for food in FOODS:
        for template in POSITIVE_TEMPLATES:
            texts.append(template.format(food=food))
            labels.append(1)

        for template in NEGATIVE_TEMPLATES:
            texts.append(template.format(food=food))
            labels.append(0)

    return texts, labels

def train_model():
    texts, labels = build_dataset()

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 4))),
        ("clf", LogisticRegression(max_iter=1000)),
    ])

    pipeline.fit(texts, labels)
    return pipeline

def save_model(pipeline):
    output_dir = os.path.join(os.path.dirname(__file__), "..", "backend", "app", "services")
    output_path = os.path.join(output_dir, "diet_preference_model.pkl")

    with open(output_path, "wb") as f:
        pickle.dump(pipeline, f)

    print(f"Model kaydedildi: {output_path}")

if __name__ == "__main__":
    model = train_model()
    save_model(model)
import os
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import LinearSVC
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

FOODS = [
    "yumurta", "et", "tavuk", "balik", "sut", "peynir", "yogurt", "ekmek",
    "seker", "mercimek", "nohut", "pirinc", "makarna", "patates", "domates",
    "salatalik", "biber", "havuc", "muz", "elma", "ceviz", "findik", "badem",
    "zeytin", "zeytinyagi", "tereyagi", "bal", "cikolata", "kahve", "cay",
]

ALLERJI_TEMPLATES = [
    "{food}a alerjim var",
    "{food}e alerjim var",
    "{food} alerjisi var",
    "{food} bana dokunuyor",
    "{food} yedikten sonra hastalaniyorum",
    "{food} tuketemiyorum, alerjik",
    "{food}a karsi alerjik durumum var",
    "{food} icerikli urunlere alerjim var",
    "{food} kesinlikle yiyemiyorum, alerjim var",
    "{food} bunyeme zarar veriyor, alerjim var",
]

NEGATIVE_TEMPLATES = [
    "{food} sevmiyorum",
    "{food} istemiyorum",
    "{food} hic sevmem",
    "{food} pek sevmiyorum",
    "{food} olmasin",
    "{food} yemek istemiyorum",
    "{food} tadini sevmiyorum",
    "{food} canim istemiyor",
    "{food} bana iyi gelmiyor",
    "{food} tercih etmiyorum",
]

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
    "{food} en sevdigim yiyeceklerden",
]

def build_dataset():
    texts = []
    labels = []

    for food in FOODS:
        for template in ALLERJI_TEMPLATES:
            texts.append(template.format(food=food))
            labels.append(0)

        for template in NEGATIVE_TEMPLATES:
            texts.append(template.format(food=food))
            labels.append(1)

        for template in POSITIVE_TEMPLATES:
            texts.append(template.format(food=food))
            labels.append(2)

    return texts, labels

def evaluate_models(X_train, X_test, y_train, y_test):
    candidates = {
        "Lojistik Regresyon": LogisticRegression(max_iter=1000),
        "Multinomial Naive Bayes": MultinomialNB(),
        "Linear SVM": LinearSVC(max_iter=5000),
    }

    results = {}

    for name, clf in candidates.items():
        pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 4))),
            ("clf", clf),
        ])

        pipeline.fit(X_train, y_train)
        predictions = pipeline.predict(X_test)
        accuracy = accuracy_score(y_test, predictions)
        report = classification_report(y_test, predictions, target_names=["Alerji", "Sevmiyor", "Seviyor"])

        results[name] = {
            "pipeline": pipeline,
            "accuracy": accuracy,
            "report": report,
        }

    return results

def save_report(results, best_name):
    output_dir = os.path.join(os.path.dirname(__file__))
    report_path = os.path.join(output_dir, "diet_preference_report.txt")

    with open(report_path, "w", encoding="utf-8") as f:
        f.write("VisionFit Diyet Tercih Modeli - Degerlendirme Raporu\n")
        f.write("=" * 55 + "\n\n")

        for name, data in results.items():
            f.write(f"Model: {name}\n")
            f.write(f"Dogruluk (Accuracy): {data['accuracy']:.4f}\n")
            f.write(data["report"])
            f.write("\n" + "-" * 55 + "\n\n")

        f.write(f"Secilen Model: {best_name}\n")

    print(f"Rapor kaydedildi: {report_path}")

def save_model(pipeline):
    output_dir = os.path.join(os.path.dirname(__file__), "..", "backend", "app", "services")
    output_path = os.path.join(output_dir, "diet_preference_model.pkl")

    with open(output_path, "wb") as f:
        pickle.dump(pipeline, f)

    print(f"Model kaydedildi: {output_path}")

if __name__ == "__main__":
    texts, labels = build_dataset()

    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.2, random_state=42, stratify=labels
    )

    print(f"Toplam ornek sayisi: {len(texts)}")
    print(f"Egitim seti: {len(X_train)} | Test seti: {len(X_test)}")
    print()

    results = evaluate_models(X_train, X_test, y_train, y_test)

    for name, data in results.items():
        print(f"{name}: dogruluk = {data['accuracy']:.4f}")

    best_name = max(results, key=lambda name: results[name]["accuracy"])
    print()
    print(f"En iyi model: {best_name}")

    save_model(results[best_name]["pipeline"])
    save_report(results, best_name)
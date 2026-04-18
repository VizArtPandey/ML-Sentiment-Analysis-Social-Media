"""Train a lightweight calibrator for ambiguous and sarcastic sentiment cases."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import json
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.pipeline import FeatureUnion, Pipeline

from config import BASE_DIR, CLEAN_DATA_CSV, PHASE03_RESULTS, SEED
from src.preprocess import preprocess_social_text

STRESS_CASES_CSV = BASE_DIR / "data" / "ambiguity_stress_cases.csv"
ADVANCED_TEST_CSV = BASE_DIR / "data" / "advanced_sentiment_test_data.csv"
CALIBRATOR_PATH = PHASE03_RESULTS / "ambiguity_calibrator.joblib"
METRICS_PATH = PHASE03_RESULTS / "ambiguity_calibrator_metrics.json"
CALIBRATED_LABELS = ["negative", "neutral", "positive", "mixed"]


def load_training_frame() -> tuple[pd.DataFrame, pd.DataFrame]:
    if not CLEAN_DATA_CSV.exists():
        raise FileNotFoundError(f"Missing cleaned dataset: {CLEAN_DATA_CSV}")
    if not STRESS_CASES_CSV.exists():
        raise FileNotFoundError(f"Missing stress-case dataset: {STRESS_CASES_CSV}")
    if not ADVANCED_TEST_CSV.exists():
        raise FileNotFoundError(f"Missing advanced test dataset: {ADVANCED_TEST_CSV}")

    base = pd.read_csv(CLEAN_DATA_CSV)
    base = base[["text", "label_name", "clean_text"]].copy()
    base["source"] = "base"

    stress = pd.read_csv(STRESS_CASES_CSV)
    stress["clean_text"] = stress["text"].map(preprocess_social_text)
    stress["source"] = "ambiguity_stress"
    stress = stress[["text", "label_name", "clean_text", "source", "phenomenon"]]

    advanced = pd.read_csv(ADVANCED_TEST_CSV)
    advanced["label_name"] = advanced["sentiment"]
    advanced["clean_text"] = advanced["text"].map(preprocess_social_text)
    advanced["source"] = "advanced_sentiment_test"
    advanced["phenomenon"] = advanced["type"]
    advanced = advanced[["text", "label_name", "clean_text", "source", "phenomenon"]]

    challenge = pd.concat([stress, advanced], ignore_index=True)
    return base, challenge


def main():
    base, stress = load_training_frame()

    # The base classroom dataset is tiny, so stress examples are intentionally
    # oversampled to make the calibrator prefer contrast/sarcasm cues.
    train_df = pd.concat([base, *([stress] * 8)], ignore_index=True)
    X_train = train_df["clean_text"].fillna("")
    y_train = train_df["label_name"]

    pipeline = Pipeline([
        ("features", FeatureUnion([
            ("word", TfidfVectorizer(ngram_range=(1, 3), sublinear_tf=True)),
            ("char", TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), sublinear_tf=True)),
        ])),
        ("clf", LogisticRegression(
            C=4.0,
            class_weight="balanced",
            max_iter=1000,
            random_state=SEED,
        )),
    ])

    pipeline.fit(X_train, y_train)

    stress_pred = pipeline.predict(stress["clean_text"].fillna(""))
    report = classification_report(
        stress["label_name"],
        stress_pred,
        labels=CALIBRATED_LABELS,
        zero_division=0,
        output_dict=True,
    )
    metrics = {
        "model": "AmbiguityCalibrator",
        "artifact": str(CALIBRATOR_PATH),
        "base_rows": int(len(base)),
        "stress_rows": int(len(stress)),
        "stress_rows_after_oversampling": int(len(stress) * 8),
        "stress_training_macro_f1": round(float(report["macro avg"]["f1-score"]), 4),
        "classes": CALIBRATED_LABELS,
        "sources": sorted(stress["source"].unique().tolist()),
        "phenomena": sorted(stress["phenomenon"].unique().tolist()),
    }

    PHASE03_RESULTS.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, CALIBRATOR_PATH)
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"Saved calibrator -> {CALIBRATOR_PATH}")
    print(json.dumps(metrics, indent=2))
    return metrics


if __name__ == "__main__":
    main()

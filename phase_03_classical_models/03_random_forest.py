"""Random Forest classifier with TF-IDF features and full evaluation."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import json
import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import (classification_report, confusion_matrix,
                              f1_score, precision_score, recall_score)
from sklearn.pipeline import Pipeline

from config import (CLEAN_DATA_CSV, LABEL_MAP, PHASE03_RESULTS, RF_N_ESTIMATORS,
                    SEED, SENTIMENT_LABELS, SKLEARN_N_JOBS,
                    TFIDF_MAX_FEATURES, TFIDF_NGRAM_RANGE)

CLEAN_CSV = CLEAN_DATA_CSV


def load_splits(df):
    train = df[df["split"].isin(["train", "validation"])].copy()
    test  = df[df["split"] == "test"].copy()
    return (train["clean_text"].fillna(""), train["label_name"],
            test["clean_text"].fillna(""),  test["label_name"])


def plot_cm(y_true, y_pred, out: Path):
    cm = confusion_matrix(y_true, y_pred, labels=SENTIMENT_LABELS)
    fig, ax = plt.subplots(figsize=(7, 5))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Oranges",
                xticklabels=SENTIMENT_LABELS, yticklabels=SENTIMENT_LABELS, ax=ax)
    ax.set_title("Random Forest — Confusion Matrix")
    ax.set_xlabel("Predicted"); ax.set_ylabel("Actual")
    plt.tight_layout(); plt.savefig(out, dpi=180); plt.close()
    print(f"Saved → {out}")


def plot_feature_importance(pipeline: Pipeline, top_n: int, out: Path):
    vectorizer = pipeline.named_steps["tfidf"]
    clf = pipeline.named_steps["clf"]
    importances = clf.feature_importances_
    feature_names = np.array(vectorizer.get_feature_names_out())
    top_idx = np.argsort(importances)[::-1][:top_n]

    fig, ax = plt.subplots(figsize=(10, 7))
    ax.barh(list(reversed(feature_names[top_idx])),
            list(reversed(importances[top_idx])),
            color="#e67e22", edgecolor="white")
    ax.set_title(f"Random Forest — Top-{top_n} Feature Importances")
    ax.set_xlabel("Mean Gini Importance")
    plt.tight_layout(); plt.savefig(out, dpi=180); plt.close()
    print(f"Saved → {out}")


def main():
    if not CLEAN_CSV.exists():
        from phase_02_feature_engineering.text_cleaning import main as clean_main
        clean_main()

    df = pd.read_csv(CLEAN_CSV)
    if "label_name" not in df.columns:
        df["label_name"] = df["label"].map(LABEL_MAP)

    X_train, y_train, X_test, y_test = load_splits(df)

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(max_features=TFIDF_MAX_FEATURES,
                                   ngram_range=TFIDF_NGRAM_RANGE,
                                   sublinear_tf=True)),
        ("clf", RandomForestClassifier(n_estimators=RF_N_ESTIMATORS,
                                        class_weight="balanced",
                                        random_state=SEED,
                                        n_jobs=SKLEARN_N_JOBS)),
    ])

    print(f"Training Random Forest (n_estimators={RF_N_ESTIMATORS})…")
    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)

    metrics = {
        "model": "RandomForest",
        "n_estimators": RF_N_ESTIMATORS,
        "test_macro_f1": round(float(f1_score(y_test, y_pred, average="macro",
                                               labels=SENTIMENT_LABELS, zero_division=0)), 4),
        "test_macro_precision": round(float(precision_score(y_test, y_pred, average="macro",
                                                            labels=SENTIMENT_LABELS, zero_division=0)), 4),
        "test_macro_recall": round(float(recall_score(y_test, y_pred, average="macro",
                                                      labels=SENTIMENT_LABELS, zero_division=0)), 4),
    }

    PHASE03_RESULTS.mkdir(parents=True, exist_ok=True)
    with open(PHASE03_RESULTS / "rf_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)
    joblib.dump(pipeline, PHASE03_RESULTS / "rf_model.joblib")
    print(f"Model saved → {PHASE03_RESULTS / 'rf_model.joblib'}")

    print("\n=== Random Forest ===")
    print(classification_report(y_test, y_pred, labels=SENTIMENT_LABELS, zero_division=0))
    print("Summary:", metrics)

    plot_cm(y_test, y_pred, PHASE03_RESULTS / "confusion_matrix_rf.png")
    plot_feature_importance(pipeline, 25, PHASE03_RESULTS / "rf_feature_importance.png")
    return metrics


if __name__ == "__main__":
    main()

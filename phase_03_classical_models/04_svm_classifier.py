"""LinearSVC + CalibratedClassifierCV for probability estimates — full eval."""
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
from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import (classification_report, confusion_matrix,
                              f1_score, precision_score, recall_score,
                              roc_auc_score, roc_curve)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelBinarizer
from sklearn.svm import LinearSVC

from config import (CLEAN_DATA_CSV, LABEL_MAP, PHASE03_RESULTS, SEED,
                    SENTIMENT_LABELS, SVM_C, TFIDF_MAX_FEATURES, TFIDF_NGRAM_RANGE)

CLEAN_CSV = CLEAN_DATA_CSV


def load_splits(df):
    train = df[df["split"].isin(["train", "validation"])].copy()
    test  = df[df["split"] == "test"].copy()
    return (train["clean_text"].fillna(""), train["label_name"],
            test["clean_text"].fillna(""),  test["label_name"])


def plot_cm(y_true, y_pred, out: Path):
    cm = confusion_matrix(y_true, y_pred, labels=SENTIMENT_LABELS)
    fig, ax = plt.subplots(figsize=(7, 5))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Purples",
                xticklabels=SENTIMENT_LABELS, yticklabels=SENTIMENT_LABELS, ax=ax)
    ax.set_title("SVM (LinearSVC) — Confusion Matrix")
    ax.set_xlabel("Predicted"); ax.set_ylabel("Actual")
    plt.tight_layout(); plt.savefig(out, dpi=180); plt.close()
    print(f"Saved → {out}")


def plot_roc(y_test, y_proba, classes, out: Path):
    lb = LabelBinarizer()
    y_bin = lb.fit_transform(y_test)
    fig, ax = plt.subplots(figsize=(8, 6))
    colors = ["#e74c3c", "#95a5a6", "#2ecc71"]
    for i, (cls, color) in enumerate(zip(classes, colors)):
        fpr, tpr, _ = roc_curve(y_bin[:, i], y_proba[:, i])
        auc = roc_auc_score(y_bin[:, i], y_proba[:, i])
        ax.plot(fpr, tpr, color=color, lw=2, label=f"{cls} (AUC={auc:.3f})")
    ax.plot([0, 1], [0, 1], "k--", lw=1)
    ax.set_title("ROC Curves — SVM")
    ax.set_xlabel("FPR"); ax.set_ylabel("TPR")
    ax.legend()
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

    svc = CalibratedClassifierCV(LinearSVC(C=SVM_C, class_weight="balanced",
                                            random_state=SEED, max_iter=3000), cv=3)
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(max_features=TFIDF_MAX_FEATURES,
                                   ngram_range=TFIDF_NGRAM_RANGE,
                                   sublinear_tf=True)),
        ("clf", svc),
    ])

    print(f"Training SVM (C={SVM_C}) with CalibratedClassifierCV…")
    pipeline.fit(X_train, y_train)
    y_pred  = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)
    classes = pipeline.classes_

    metrics = {
        "model": "SVM_LinearSVC",
        "C": SVM_C,
        "test_macro_f1": round(float(f1_score(y_test, y_pred, average="macro",
                                               labels=SENTIMENT_LABELS, zero_division=0)), 4),
        "test_macro_precision": round(float(precision_score(y_test, y_pred, average="macro",
                                                            labels=SENTIMENT_LABELS, zero_division=0)), 4),
        "test_macro_recall": round(float(recall_score(y_test, y_pred, average="macro",
                                                      labels=SENTIMENT_LABELS, zero_division=0)), 4),
    }

    PHASE03_RESULTS.mkdir(parents=True, exist_ok=True)
    with open(PHASE03_RESULTS / "svm_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)
    joblib.dump(pipeline, PHASE03_RESULTS / "svm_model.joblib")
    print(f"Model saved → {PHASE03_RESULTS / 'svm_model.joblib'}")

    print("\n=== SVM Classifier ===")
    print(classification_report(y_test, y_pred, labels=SENTIMENT_LABELS, zero_division=0))
    print("Summary:", metrics)

    plot_cm(y_test, y_pred, PHASE03_RESULTS / "confusion_matrix_svm.png")
    plot_roc(y_test, y_proba, classes, PHASE03_RESULTS / "roc_curves_svm.png")
    return metrics


if __name__ == "__main__":
    main()

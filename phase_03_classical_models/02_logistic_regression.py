"""GridSearch-tuned TF-IDF + Logistic Regression with full evaluation."""
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
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (classification_report, confusion_matrix,
                              f1_score, precision_score, recall_score,
                              roc_auc_score, roc_curve)
from sklearn.model_selection import GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelBinarizer

from config import (CLEAN_DATA_CSV, LABEL_MAP, LR_MAX_ITER,
                    PHASE03_RESULTS, SEED, SENTIMENT_LABELS,
                    SKLEARN_N_JOBS, TFIDF_MAX_FEATURES, TFIDF_NGRAM_RANGE)

CLEAN_CSV = CLEAN_DATA_CSV


def load_splits(df):
    train = df[df["split"].isin(["train", "validation"])].copy()
    test  = df[df["split"] == "test"].copy()
    return (train["clean_text"].fillna(""), train["label_name"],
            test["clean_text"].fillna(""),  test["label_name"])


def plot_cm(y_true, y_pred, out: Path):
    cm = confusion_matrix(y_true, y_pred, labels=SENTIMENT_LABELS)
    fig, ax = plt.subplots(figsize=(7, 5))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Greens",
                xticklabels=SENTIMENT_LABELS, yticklabels=SENTIMENT_LABELS, ax=ax)
    ax.set_title("Logistic Regression — Confusion Matrix")
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
    ax.set_title("ROC Curves — Logistic Regression")
    ax.set_xlabel("False Positive Rate"); ax.set_ylabel("True Positive Rate")
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

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(max_features=TFIDF_MAX_FEATURES,
                                   ngram_range=TFIDF_NGRAM_RANGE,
                                   sublinear_tf=True)),
        ("clf", LogisticRegression(max_iter=LR_MAX_ITER, solver="lbfgs",
                                    class_weight="balanced", random_state=SEED)),
    ])

    param_grid = {"clf__C": [0.1, 0.5, 1.0, 5.0]}
    print("Running GridSearchCV (4-fold) …")
    gs = GridSearchCV(pipeline, param_grid, cv=4, scoring="f1_macro",
                      n_jobs=SKLEARN_N_JOBS, verbose=1)
    gs.fit(X_train, y_train)
    best = gs.best_estimator_
    print(f"Best C: {gs.best_params_['clf__C']}  |  CV F1: {gs.best_score_:.4f}")

    y_pred  = best.predict(X_test)
    y_proba = best.predict_proba(X_test)
    classes = best.classes_

    metrics = {
        "model": "LogisticRegression",
        "best_C": gs.best_params_["clf__C"],
        "cv_macro_f1": round(float(gs.best_score_), 4),
        "test_macro_f1": round(float(f1_score(y_test, y_pred, average="macro",
                                               labels=SENTIMENT_LABELS, zero_division=0)), 4),
        "test_macro_precision": round(float(precision_score(y_test, y_pred, average="macro",
                                                            labels=SENTIMENT_LABELS, zero_division=0)), 4),
        "test_macro_recall": round(float(recall_score(y_test, y_pred, average="macro",
                                                      labels=SENTIMENT_LABELS, zero_division=0)), 4),
    }

    PHASE03_RESULTS.mkdir(parents=True, exist_ok=True)
    with open(PHASE03_RESULTS / "lr_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)
    joblib.dump(best, PHASE03_RESULTS / "lr_model.joblib")
    print(f"Model saved → {PHASE03_RESULTS / 'lr_model.joblib'}")

    print("\n=== Logistic Regression ===")
    print(classification_report(y_test, y_pred, labels=SENTIMENT_LABELS, zero_division=0))
    print("Summary:", metrics)

    plot_cm(y_test, y_pred, PHASE03_RESULTS / "confusion_matrix_lr.png")
    plot_roc(y_test, y_proba, classes, PHASE03_RESULTS / "roc_curves_lr.png")
    return metrics


if __name__ == "__main__":
    main()

"""VADER baseline: rule-based sentiment on the test set with full evaluation."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import json
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.metrics import (classification_report, confusion_matrix,
                              f1_score, precision_score, recall_score)

from config import CLEAN_DATA_CSV, LABEL_MAP, PHASE03_RESULTS, SENTIMENT_LABELS
from src.vader_fallback import get_sentiment_analyzer

CLEAN_CSV = CLEAN_DATA_CSV


def vader_label(text: str, analyzer) -> str:
    scores = analyzer.polarity_scores(str(text))
    compound = scores["compound"]
    if compound >= 0.05:
        return "positive"
    elif compound <= -0.05:
        return "negative"
    return "neutral"


def plot_cm(y_true, y_pred, out: Path):
    cm = confusion_matrix(y_true, y_pred, labels=SENTIMENT_LABELS)
    fig, ax = plt.subplots(figsize=(7, 5))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=SENTIMENT_LABELS, yticklabels=SENTIMENT_LABELS, ax=ax)
    ax.set_title("VADER — Confusion Matrix")
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    plt.tight_layout()
    plt.savefig(out, dpi=180)
    plt.close()
    print(f"Saved → {out}")


def plot_score_dist(df_test: pd.DataFrame, out: Path):
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.hist(df_test["vader_compound"], bins=50, color="#e67e22", edgecolor="white", alpha=0.85)
    ax.axvline(0.05, color="green", linestyle="--", label="pos threshold")
    ax.axvline(-0.05, color="red", linestyle="--", label="neg threshold")
    ax.set_title("VADER Compound Score Distribution (Test Set)")
    ax.set_xlabel("Compound score")
    ax.set_ylabel("Frequency")
    ax.legend()
    plt.tight_layout()
    plt.savefig(out, dpi=180)
    plt.close()
    print(f"Saved → {out}")


def main():
    if not CLEAN_CSV.exists():
        from phase_02_feature_engineering.text_cleaning import main as clean_main
        clean_main()

    df = pd.read_csv(CLEAN_CSV)
    if "label_name" not in df.columns:
        df["label_name"] = df["label"].map(LABEL_MAP)

    test = df[df["split"] == "test"].copy()
    analyzer = get_sentiment_analyzer()

    test["vader_compound"] = test["text"].apply(lambda t: analyzer.polarity_scores(t)["compound"])
    test["vader_pred"] = test["text"].apply(lambda t: vader_label(t, analyzer))

    y_true = test["label_name"]
    y_pred = test["vader_pred"]

    metrics = {
        "model": "VADER",
        "macro_f1": round(f1_score(y_true, y_pred, average="macro", zero_division=0), 4),
        "macro_precision": round(precision_score(y_true, y_pred, average="macro", zero_division=0), 4),
        "macro_recall": round(recall_score(y_true, y_pred, average="macro", zero_division=0), 4),
    }

    PHASE03_RESULTS.mkdir(parents=True, exist_ok=True)
    with open(PHASE03_RESULTS / "vader_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    print("\n=== VADER Baseline ===")
    print(classification_report(y_true, y_pred, labels=SENTIMENT_LABELS, zero_division=0))
    print("Summary:", metrics)

    plot_cm(y_true, y_pred, PHASE03_RESULTS / "confusion_matrix_vader.png")
    plot_score_dist(test, PHASE03_RESULTS / "vader_score_distribution.png")

    return metrics


if __name__ == "__main__":
    main()

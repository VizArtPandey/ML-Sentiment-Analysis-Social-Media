"""Aggregate all classical-model metrics and produce the unified F1 bar chart."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import json
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from config import PHASE03_RESULTS

METRIC_FILES = {
    "VADER":               "vader_metrics.json",
    "Logistic Regression": "lr_metrics.json",
    "Random Forest":       "rf_metrics.json",
    "SVM":                 "svm_metrics.json",
}
COLORS = ["#e74c3c", "#3498db", "#e67e22", "#8e44ad"]


def load_metrics() -> pd.DataFrame:
    rows = []
    for model_name, fname in METRIC_FILES.items():
        fpath = PHASE03_RESULTS / fname
        if not fpath.exists():
            print(f"WARNING: {fpath} not found — skipping {model_name}")
            continue
        with open(fpath) as f:
            data = json.load(f)
        rows.append({
            "model": model_name,
            "macro_f1": data.get("test_macro_f1", data.get("macro_f1", 0.0)),
            "macro_precision": data.get("test_macro_precision", data.get("macro_precision", 0.0)),
            "macro_recall": data.get("test_macro_recall", data.get("macro_recall", 0.0)),
        })
    return pd.DataFrame(rows)


def plot_f1_bar(df: pd.DataFrame, out: Path):
    fig, ax = plt.subplots(figsize=(9, 5))
    x = np.arange(len(df))
    bars = ax.bar(x, df["macro_f1"], width=0.5,
                  color=COLORS[:len(df)], edgecolor="white", linewidth=0.8)
    for bar, val in zip(bars, df["macro_f1"]):
        ax.text(bar.get_x() + bar.get_width() / 2,
                bar.get_height() + 0.005,
                f"{val:.4f}", ha="center", va="bottom", fontweight="bold", fontsize=11)
    ax.set_xticks(x)
    ax.set_xticklabels(df["model"], fontsize=11)
    ax.set_ylabel("Macro F1-Score")
    ax.set_ylim(0, 1.0)
    ax.set_title("Classical Models — Macro F1 Comparison", fontsize=14, pad=12)
    ax.axhline(0.5, color="gray", linestyle="--", linewidth=0.8, label="random baseline")
    ax.legend()
    plt.tight_layout()
    plt.savefig(out, dpi=180)
    plt.close()
    print(f"Saved → {out}")


def plot_grouped_metrics(df: pd.DataFrame, out: Path):
    metrics = ["macro_f1", "macro_precision", "macro_recall"]
    labels  = ["F1", "Precision", "Recall"]
    x = np.arange(len(df))
    width = 0.25

    fig, ax = plt.subplots(figsize=(11, 6))
    for i, (metric, label) in enumerate(zip(metrics, labels)):
        bars = ax.bar(x + i * width, df[metric], width=width,
                      label=label, edgecolor="white")

    ax.set_xticks(x + width)
    ax.set_xticklabels(df["model"], fontsize=10)
    ax.set_ylabel("Score")
    ax.set_ylim(0, 1.0)
    ax.set_title("Classical Models — F1 / Precision / Recall", fontsize=14)
    ax.legend()
    plt.tight_layout()
    plt.savefig(out, dpi=180)
    plt.close()
    print(f"Saved → {out}")


def main():
    df = load_metrics()
    if df.empty:
        print("No metric files found. Run phases 01–04 first.")
        return

    PHASE03_RESULTS.mkdir(parents=True, exist_ok=True)
    csv_path = PHASE03_RESULTS / "metrics_summary.csv"
    df.to_csv(csv_path, index=False)
    print(f"Metrics summary saved → {csv_path}")

    print("\n=== Classical Model Comparison ===")
    print(df.to_string(index=False))

    plot_f1_bar(df, PHASE03_RESULTS / "f1_comparison.png")
    plot_grouped_metrics(df, PHASE03_RESULTS / "f1_precision_recall_comparison.png")


if __name__ == "__main__":
    main()

"""Final benchmark: VADER + LR + RF + SVM + BiLSTM side-by-side."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import json
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from config import PHASE03_RESULTS, PHASE04_MODELS

ALL_METRIC_SOURCES = {
    "VADER":               PHASE03_RESULTS / "vader_metrics.json",
    "Logistic Regression": PHASE03_RESULTS / "lr_metrics.json",
    "Random Forest":       PHASE03_RESULTS / "rf_metrics.json",
    "SVM":                 PHASE03_RESULTS / "svm_metrics.json",
    "BiLSTM":              PHASE04_MODELS  / "bilstm_metrics.json",
}

MODEL_COLORS = {
    "VADER":               "#e74c3c",
    "Logistic Regression": "#3498db",
    "Random Forest":       "#e67e22",
    "SVM":                 "#8e44ad",
    "BiLSTM":              "#27ae60",
}


def load_all_metrics() -> pd.DataFrame:
    rows = []
    for model_name, fpath in ALL_METRIC_SOURCES.items():
        if not fpath.exists():
            print(f"WARNING: {fpath} missing — skipping {model_name}")
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


def plot_benchmark_bar(df: pd.DataFrame, out: Path):
    colors = [MODEL_COLORS.get(m, "#bdc3c7") for m in df["model"]]
    fig, ax = plt.subplots(figsize=(11, 6))
    x = np.arange(len(df))
    bars = ax.bar(x, df["macro_f1"], width=0.55, color=colors, edgecolor="white", linewidth=0.8)

    for bar, val, model in zip(bars, df["macro_f1"], df["model"]):
        ax.text(bar.get_x() + bar.get_width() / 2,
                bar.get_height() + 0.005,
                f"{val:.4f}", ha="center", va="bottom", fontweight="bold", fontsize=11)
        if model == "BiLSTM":
            bar.set_hatch("//")
            bar.set_edgecolor("white")

    ax.set_xticks(x)
    ax.set_xticklabels(df["model"], fontsize=11)
    ax.set_ylabel("Macro F1-Score", fontsize=12)
    ax.set_ylim(0, 1.0)
    ax.set_title("All Models — Final Benchmark (Macro F1)", fontsize=14, pad=12)
    ax.axhline(0.33, color="gray", linestyle=":", linewidth=1, label="random (3-class)")
    ax.legend(fontsize=10)

    best_idx = df["macro_f1"].idxmax()
    best_bar = bars[best_idx]
    ax.annotate("★ Best", xy=(best_bar.get_x() + best_bar.get_width() / 2,
                               best_bar.get_height() + 0.025),
                ha="center", color="gold", fontsize=12, fontweight="bold")

    plt.tight_layout()
    plt.savefig(out, dpi=180)
    plt.close()
    print(f"Saved → {out}")


def plot_multi_metric_radar(df: pd.DataFrame, out: Path):
    metrics = ["macro_f1", "macro_precision", "macro_recall"]
    labels  = ["F1", "Precision", "Recall"]
    n = len(df)
    x = np.arange(len(metrics))
    width = 0.15

    fig, ax = plt.subplots(figsize=(11, 6))
    for i, (_, row) in enumerate(df.iterrows()):
        color = MODEL_COLORS.get(row["model"], "#bdc3c7")
        ax.bar(x + i * width, [row[m] for m in metrics], width=width,
               label=row["model"], color=color, edgecolor="white")

    ax.set_xticks(x + width * (n - 1) / 2)
    ax.set_xticklabels(labels, fontsize=12)
    ax.set_ylabel("Score")
    ax.set_ylim(0, 1.0)
    ax.set_title("All Models — F1 / Precision / Recall Benchmark", fontsize=14)
    ax.legend(loc="lower right")
    plt.tight_layout()
    plt.savefig(out, dpi=180)
    plt.close()
    print(f"Saved → {out}")


def main():
    df = load_all_metrics()
    if df.empty:
        print("No metrics found. Run phases 01–04 first.")
        return

    PHASE04_MODELS.mkdir(parents=True, exist_ok=True)
    csv_path = PHASE04_MODELS / "all_models_benchmark.csv"
    df.to_csv(csv_path, index=False)
    print(f"Benchmark CSV saved → {csv_path}")

    print("\n" + "=" * 60)
    print("FINAL BENCHMARK — ALL MODELS")
    print("=" * 60)
    print(df.to_string(index=False))

    best_row = df.loc[df["macro_f1"].idxmax()]
    print(f"\n★ Best model: {best_row['model']}  (Macro F1 = {best_row['macro_f1']:.4f})")

    plot_benchmark_bar(df, PHASE04_MODELS / "all_models_benchmark.png")
    plot_multi_metric_radar(df, PHASE04_MODELS / "all_models_multi_metric.png")


if __name__ == "__main__":
    main()

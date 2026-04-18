from __future__ import annotations
"""Plot 1: bar chart  |  Plot 2: pie chart — class distribution."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

from config import LABEL_MAP, PHASE01_PLOTS, RAW_DATA_CSV

CACHE_CSV = RAW_DATA_CSV
COLORS = {"negative": "#e74c3c", "neutral": "#95a5a6", "positive": "#2ecc71"}


def load_df() -> pd.DataFrame:
    if not CACHE_CSV.exists():
        from phase_01_data_exploration.load_dataset import main as load_main
        load_main()
    df = pd.read_csv(CACHE_CSV)
    if "label_name" not in df.columns:
        df["label_name"] = df["label"].map(LABEL_MAP)
    return df


def plot_bar(counts: pd.Series, out: Path):
    fig, ax = plt.subplots(figsize=(7, 5))
    bars = ax.bar(counts.index, counts.values,
                  color=[COLORS[l] for l in counts.index], edgecolor="white", linewidth=0.8)
    for bar, val in zip(bars, counts.values):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 80,
                f"{val:,}", ha="center", va="bottom", fontweight="bold")
    ax.set_title("Class Distribution — tweet_eval Sentiment", fontsize=14, pad=12)
    ax.set_xlabel("Sentiment Class")
    ax.set_ylabel("Number of Samples")
    ax.set_ylim(0, counts.max() * 1.15)
    plt.tight_layout()
    plt.savefig(out, dpi=180)
    plt.close()
    print(f"Saved → {out}")


def plot_pie(counts: pd.Series, out: Path):
    fig, ax = plt.subplots(figsize=(6, 6))
    wedges, texts, autotexts = ax.pie(
        counts.values,
        labels=counts.index,
        autopct="%1.1f%%",
        colors=[COLORS[l] for l in counts.index],
        startangle=140,
        pctdistance=0.82,
        wedgeprops={"linewidth": 1.2, "edgecolor": "white"},
    )
    for at in autotexts:
        at.set_fontsize(11)
        at.set_fontweight("bold")
    ax.set_title("Sentiment Class Share", fontsize=14)
    plt.tight_layout()
    plt.savefig(out, dpi=180)
    plt.close()
    print(f"Saved → {out}")


def main():
    df = load_df()
    counts = df["label_name"].value_counts().reindex(["negative", "neutral", "positive"])
    PHASE01_PLOTS.mkdir(parents=True, exist_ok=True)
    plot_bar(counts, PHASE01_PLOTS / "class_distribution_bar.png")
    plot_pie(counts, PHASE01_PLOTS / "class_distribution_pie.png")
    print(counts.to_string())


if __name__ == "__main__":
    main()

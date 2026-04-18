from __future__ import annotations
"""Plot 1: character-length histograms  |  Plot 2: word-count box plots per class."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

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
    df["char_len"] = df["text"].astype(str).str.len()
    df["word_count"] = df["text"].astype(str).str.split().str.len()
    return df


def plot_char_hist(df: pd.DataFrame, out: Path):
    fig, axes = plt.subplots(1, 3, figsize=(15, 4), sharey=True)
    for ax, label in zip(axes, ["negative", "neutral", "positive"]):
        sub = df[df["label_name"] == label]["char_len"]
        ax.hist(sub, bins=40, color=COLORS[label], edgecolor="white", alpha=0.85)
        ax.axvline(sub.mean(), color="black", linestyle="--", linewidth=1.2)
        ax.set_title(f"{label.capitalize()} (μ={sub.mean():.0f})")
        ax.set_xlabel("Character length")
        ax.set_ylabel("Count")
    fig.suptitle("Character-Length Distribution per Class", fontsize=14, y=1.02)
    plt.tight_layout()
    plt.savefig(out, dpi=180, bbox_inches="tight")
    plt.close()
    print(f"Saved → {out}")


def plot_wordcount_box(df: pd.DataFrame, out: Path):
    fig, ax = plt.subplots(figsize=(8, 5))
    palette = [COLORS[l] for l in ["negative", "neutral", "positive"]]
    sns.boxplot(data=df, x="label_name", y="word_count",
                order=["negative", "neutral", "positive"],
                palette=palette, ax=ax, linewidth=1.2)
    ax.set_title("Word-Count Distribution per Sentiment Class", fontsize=14)
    ax.set_xlabel("Sentiment")
    ax.set_ylabel("Word count")
    plt.tight_layout()
    plt.savefig(out, dpi=180)
    plt.close()
    print(f"Saved → {out}")


def main():
    df = load_df()
    PHASE01_PLOTS.mkdir(parents=True, exist_ok=True)
    plot_char_hist(df, PHASE01_PLOTS / "char_length_histogram.png")
    plot_wordcount_box(df, PHASE01_PLOTS / "word_count_boxplot.png")
    print("\nLength statistics per class:")
    print(df.groupby("label_name")[["char_len", "word_count"]].describe().round(1).to_string())


if __name__ == "__main__":
    main()

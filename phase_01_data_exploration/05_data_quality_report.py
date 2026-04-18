from __future__ import annotations
"""Generate a CSV data-quality report + a duplicate heatmap PNG."""
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
REPORT_CSV = PHASE01_PLOTS / "data_quality_report.csv"


def load_df() -> pd.DataFrame:
    if not CACHE_CSV.exists():
        from phase_01_data_exploration.load_dataset import main as load_main
        load_main()
    df = pd.read_csv(CACHE_CSV)
    if "label_name" not in df.columns:
        df["label_name"] = df["label"].map(LABEL_MAP)
    return df


def build_quality_report(df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for label in ["negative", "neutral", "positive"]:
        sub = df[df["label_name"] == label]
        rows.append({
            "class": label,
            "n_samples": len(sub),
            "n_null_text": sub["text"].isnull().sum(),
            "n_empty_text": (sub["text"].astype(str).str.strip() == "").sum(),
            "n_duplicates": sub["text"].duplicated().sum(),
            "avg_char_len": sub["text"].astype(str).str.len().mean().round(1),
            "avg_word_count": sub["text"].astype(str).str.split().str.len().mean().round(1),
            "max_char_len": sub["text"].astype(str).str.len().max(),
        })
    report = pd.DataFrame(rows)
    report.to_csv(REPORT_CSV, index=False)
    print(f"Quality report saved → {REPORT_CSV}")
    return report


def plot_quality_heatmap(report: pd.DataFrame, out: Path):
    numeric_cols = ["n_null_text", "n_empty_text", "n_duplicates",
                    "avg_char_len", "avg_word_count", "max_char_len"]
    heat_data = report.set_index("class")[numeric_cols]
    fig, ax = plt.subplots(figsize=(10, 4))
    sns.heatmap(heat_data, annot=True, fmt=".1f", cmap="YlOrRd",
                linewidths=0.5, linecolor="white", ax=ax)
    ax.set_title("Data Quality Heatmap per Sentiment Class", fontsize=13, pad=10)
    plt.tight_layout()
    plt.savefig(out, dpi=180)
    plt.close()
    print(f"Saved → {out}")


def plot_null_bar(df: pd.DataFrame, out: Path):
    null_counts = df.isnull().sum()
    fig, ax = plt.subplots(figsize=(6, 4))
    ax.bar(null_counts.index, null_counts.values, color="#3498db", edgecolor="white")
    ax.set_title("Null Value Counts per Column", fontsize=13)
    ax.set_ylabel("Count")
    for i, v in enumerate(null_counts.values):
        ax.text(i, v + 0.2, str(v), ha="center", fontweight="bold")
    plt.tight_layout()
    plt.savefig(out, dpi=180)
    plt.close()
    print(f"Saved → {out}")


def main():
    df = load_df()
    PHASE01_PLOTS.mkdir(parents=True, exist_ok=True)
    report = build_quality_report(df)
    print("\nData Quality Report:")
    print(report.to_string(index=False))
    plot_quality_heatmap(report, PHASE01_PLOTS / "data_quality_heatmap.png")
    plot_null_bar(df, PHASE01_PLOTS / "null_values_bar.png")


if __name__ == "__main__":
    main()

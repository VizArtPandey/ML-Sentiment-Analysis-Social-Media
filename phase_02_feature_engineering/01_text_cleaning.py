from __future__ import annotations
"""Clean raw tweet text and plot before/after character-length distributions."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import re
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

from config import (CLEAN_DATA_CSV, LABEL_MAP, PHASE01_PLOTS,
                    PHASE02_ARTIFACTS, RAW_DATA_CSV, SEED)

CACHE_CSV = RAW_DATA_CSV
CLEAN_CSV = CLEAN_DATA_CSV
PLOTS_DIR = PHASE01_PLOTS.parent.parent / "phase_02_feature_engineering" / "plots"

URL_RE = re.compile(r"https?://\S+|www\.\S+")
MENTION_RE = re.compile(r"@\w+")
HASHTAG_RE = re.compile(r"#(\w+)")
EMOJI_RE = re.compile("["
    "\U0001F600-\U0001F64F\U0001F300-\U0001F5FF"
    "\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF"
    "\U00002702-\U000027B0\U000024C2-\U0001F251]+", flags=re.UNICODE)
REPEAT_RE = re.compile(r"(.)\1{2,}")
SPACE_RE = re.compile(r"\s+")

CONTRACTIONS = {
    "can't": "cannot", "won't": "will not", "n't": " not",
    "'re": " are", "'s": " is", "'m": " am", "'ll": " will",
    "'ve": " have", "'d": " would",
}


def clean_text(text: str) -> str:
    text = str(text).strip().lower()
    for k, v in CONTRACTIONS.items():
        text = text.replace(k, v)
    text = URL_RE.sub(" url ", text)
    text = MENTION_RE.sub(" user ", text)
    text = HASHTAG_RE.sub(r" \1 ", text)
    text = EMOJI_RE.sub(" ", text)
    text = REPEAT_RE.sub(r"\1\1", text)
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return SPACE_RE.sub(" ", text).strip()


def plot_before_after(df: pd.DataFrame, out: Path):
    PLOTS_DIR.mkdir(parents=True, exist_ok=True)
    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    for ax, col, title in zip(axes,
                               ["char_len_raw", "char_len_clean"],
                               ["Raw text length", "Clean text length"]):
        ax.hist(df[col], bins=50, color="#3498db", edgecolor="white", alpha=0.85)
        ax.axvline(df[col].mean(), color="red", linestyle="--", linewidth=1.5)
        ax.set_title(f"{title} (μ={df[col].mean():.0f})")
        ax.set_xlabel("Character count")
        ax.set_ylabel("Frequency")
    fig.suptitle("Text Length: Before vs After Cleaning", fontsize=14)
    plt.tight_layout()
    plt.savefig(out, dpi=180)
    plt.close()
    print(f"Saved → {out}")


def main():
    if not CACHE_CSV.exists():
        from phase_01_data_exploration.load_dataset import main as load_main
        load_main()

    df = pd.read_csv(CACHE_CSV)
    if "label_name" not in df.columns:
        df["label_name"] = df["label"].map(LABEL_MAP)
    if "source" not in df.columns:
        df["source"] = "unknown"

    df["char_len_raw"] = df["text"].astype(str).str.len()
    df["clean_text"] = df["text"].apply(clean_text)
    df["char_len_clean"] = df["clean_text"].str.len()

    CLEAN_CSV.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(CLEAN_CSV, index=False)
    print(f"Cleaned dataset saved → {CLEAN_CSV}")

    plot_before_after(df, PHASE02_ARTIFACTS.parent / "plots" / "text_length_before_after.png")

    PHASE02_ARTIFACTS.mkdir(parents=True, exist_ok=True)
    df[["text", "clean_text", "label", "label_name", "split", "source"]].to_csv(
        PHASE02_ARTIFACTS / "cleaned_df.csv", index=False
    )

    print("\nCleaning stats:")
    print(f"  Raw avg length  : {df['char_len_raw'].mean():.1f}")
    print(f"  Clean avg length: {df['char_len_clean'].mean():.1f}")
    print(f"  Reduction       : {(1 - df['char_len_clean'].mean() / df['char_len_raw'].mean()) * 100:.1f}%")
    print("\nSample cleaned texts:")
    for _, row in df.sample(3, random_state=SEED).iterrows():
        print(f"  RAW  : {row['text'][:80]}")
        print(f"  CLEAN: {row['clean_text'][:80]}")
        print()


if __name__ == "__main__":
    main()

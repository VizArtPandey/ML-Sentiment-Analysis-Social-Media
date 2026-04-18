from __future__ import annotations
"""Plot 1: WordCloud per class  |  Plot 2: top-20 words bar chart per class."""
import sys
from pathlib import Path
from collections import Counter

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

try:
    from wordcloud import WordCloud
except ImportError:
    WordCloud = None

from config import LABEL_MAP, SEED, PHASE01_PLOTS, RAW_DATA_CSV

CACHE_CSV = RAW_DATA_CSV
COLORS = {"negative": "#e74c3c", "neutral": "#95a5a6", "positive": "#2ecc71"}
STOP_WORDS = {
    "the", "a", "an", "is", "it", "in", "of", "to", "and", "for",
    "i", "you", "my", "me", "we", "at", "on", "be", "are", "was",
    "http", "user", "rt", "co", "t", "s", "just", "that", "this",
}


def tokenize(text: str) -> list[str]:
    import re
    words = re.findall(r"[a-z]{3,}", str(text).lower())
    return [w for w in words if w not in STOP_WORDS]


def load_df() -> pd.DataFrame:
    if not CACHE_CSV.exists():
        from phase_01_data_exploration.load_dataset import main as load_main
        load_main()
    df = pd.read_csv(CACHE_CSV)
    if "label_name" not in df.columns:
        df["label_name"] = df["label"].map(LABEL_MAP)
    return df


def plot_wordclouds(df: pd.DataFrame, out: Path):
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))
    for ax, label in zip(axes, ["negative", "neutral", "positive"]):
        text = " ".join(df[df["label_name"] == label]["text"].astype(str).tolist())
        if WordCloud is not None:
            wc = WordCloud(
                width=600, height=400,
                background_color="white",
                colormap="RdYlGn" if label == "positive" else ("Reds" if label == "negative" else "Greys"),
                stopwords=STOP_WORDS,
                random_state=SEED,
                max_words=150,
            ).generate(text)
            ax.imshow(wc, interpolation="bilinear")
            ax.axis("off")
        else:
            tokens = tokenize(text)
            counts = Counter(tokens).most_common(20) or [("no_terms", 1)]
            words = [word for word, _ in counts]
            freqs = [freq for _, freq in counts]
            ax.barh(list(reversed(words)), list(reversed(freqs)),
                    color=COLORS[label], edgecolor="white")
            ax.set_xlabel("Frequency")
        ax.set_title(f"{label.capitalize()} Tweets", fontsize=13, pad=8)
    fig.suptitle("WordCloud per Sentiment Class", fontsize=15, y=1.01)
    plt.tight_layout()
    plt.savefig(out, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Saved → {out}")


def plot_top_words(df: pd.DataFrame, out: Path, top_n: int = 20):
    fig, axes = plt.subplots(1, 3, figsize=(18, 6))
    for ax, label in zip(axes, ["negative", "neutral", "positive"]):
        tokens = []
        for txt in df[df["label_name"] == label]["text"].astype(str):
            tokens.extend(tokenize(txt))
        counts = Counter(tokens).most_common(top_n)
        if not counts:
            counts = [("no_terms", 1)]
        words, freqs = zip(*counts)
        ax.barh(list(reversed(words)), list(reversed(freqs)),
                color=COLORS[label], edgecolor="white")
        ax.set_title(f"Top-{top_n} Words — {label.capitalize()}", fontsize=12)
        ax.set_xlabel("Frequency")
    fig.suptitle("Most Frequent Words per Sentiment Class", fontsize=14, y=1.01)
    plt.tight_layout()
    plt.savefig(out, dpi=180, bbox_inches="tight")
    plt.close()
    print(f"Saved → {out}")


def main():
    df = load_df()
    PHASE01_PLOTS.mkdir(parents=True, exist_ok=True)
    plot_wordclouds(df, PHASE01_PLOTS / "wordclouds_per_class.png")
    plot_top_words(df, PHASE01_PLOTS / "top20_words_per_class.png")


if __name__ == "__main__":
    main()

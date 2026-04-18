from __future__ import annotations
"""Fit TF-IDF on training data, pickle it, plot top features per class."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer

from config import (CLEAN_DATA_CSV, LABEL_MAP, PHASE02_ARTIFACTS,
                    TFIDF_MAX_FEATURES, TFIDF_NGRAM_RANGE,
                    TFIDF_MIN_DF, TFIDF_MAX_DF)

CLEAN_CSV = CLEAN_DATA_CSV
PLOTS_DIR = PHASE02_ARTIFACTS.parent / "plots"


def load_train(df: pd.DataFrame):
    train = df[df["split"].isin(["train", "validation"])].copy()
    return train["clean_text"].fillna(""), train["label_name"].fillna("neutral")


def plot_top_tfidf(vectorizer: TfidfVectorizer, n: int, out: Path):
    PLOTS_DIR.mkdir(parents=True, exist_ok=True)
    feature_names = vectorizer.get_feature_names_out()
    idf_scores = vectorizer.idf_
    top_idx = np.argsort(idf_scores)[::-1][:n]
    top_features = [feature_names[i] for i in top_idx]
    top_scores = [idf_scores[i] for i in top_idx]

    fig, ax = plt.subplots(figsize=(10, 7))
    ax.barh(list(reversed(top_features)), list(reversed(top_scores)),
            color="#2980b9", edgecolor="white")
    ax.set_title(f"Top-{n} TF-IDF Terms by IDF Score", fontsize=13)
    ax.set_xlabel("IDF score")
    plt.tight_layout()
    plt.savefig(out, dpi=180)
    plt.close()
    print(f"Saved → {out}")


def main():
    if not CLEAN_CSV.exists():
        from phase_02_feature_engineering.text_cleaning import main as c
        c()
    df = pd.read_csv(CLEAN_CSV)
    if "label_name" not in df.columns:
        df["label_name"] = df["label"].map(LABEL_MAP)

    X_train, y_train = load_train(df)

    print(f"Fitting TF-IDF (max_features={TFIDF_MAX_FEATURES}, ngram={TFIDF_NGRAM_RANGE})…")
    vectorizer = TfidfVectorizer(
        max_features=TFIDF_MAX_FEATURES,
        ngram_range=TFIDF_NGRAM_RANGE,
        min_df=TFIDF_MIN_DF,
        max_df=TFIDF_MAX_DF,
        sublinear_tf=True,
    )
    X_tfidf = vectorizer.fit_transform(X_train)

    PHASE02_ARTIFACTS.mkdir(parents=True, exist_ok=True)
    joblib.dump(vectorizer, PHASE02_ARTIFACTS / "tfidf.pkl")
    print(f"Saved → {PHASE02_ARTIFACTS / 'tfidf.pkl'}")
    print(f"Matrix shape: {X_tfidf.shape}")
    print(f"Vocabulary size: {len(vectorizer.vocabulary_):,}")

    plot_top_tfidf(vectorizer, 30, PLOTS_DIR / "tfidf_top30_features.png")


if __name__ == "__main__":
    main()

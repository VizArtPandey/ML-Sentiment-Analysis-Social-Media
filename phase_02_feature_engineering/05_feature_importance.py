from __future__ import annotations
"""Chi-squared feature ranking; plot top-30 features bar chart."""
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
from sklearn.feature_selection import chi2
from sklearn.preprocessing import LabelEncoder

from config import CLEAN_DATA_CSV, LABEL_MAP, PHASE02_ARTIFACTS

CLEAN_CSV = CLEAN_DATA_CSV
PLOTS_DIR = PHASE02_ARTIFACTS.parent / "plots"
TFIDF_PKL = PHASE02_ARTIFACTS / "tfidf.pkl"


def plot_chi2(feature_names: np.ndarray, scores: np.ndarray, top_n: int, out: Path):
    PLOTS_DIR.mkdir(parents=True, exist_ok=True)
    top_idx = np.argsort(scores)[::-1][:top_n]
    top_feats = feature_names[top_idx]
    top_scores = scores[top_idx]

    fig, ax = plt.subplots(figsize=(10, 8))
    colors = plt.cm.plasma(np.linspace(0.2, 0.9, top_n))
    ax.barh(list(reversed(top_feats)), list(reversed(top_scores)),
            color=list(reversed(colors)), edgecolor="white")
    ax.set_title(f"Chi-Squared Feature Importance — Top {top_n}", fontsize=13)
    ax.set_xlabel("Chi² score")
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

    train = df[df["split"].isin(["train", "validation"])].copy()
    X_text = train["clean_text"].fillna("")
    y = train["label_name"]

    if TFIDF_PKL.exists():
        print("Loading existing TF-IDF…")
        vectorizer = joblib.load(TFIDF_PKL)
        X = vectorizer.transform(X_text)
    else:
        print("Fitting new TF-IDF…")
        vectorizer = TfidfVectorizer(max_features=20_000, ngram_range=(1, 2), sublinear_tf=True)
        X = vectorizer.fit_transform(X_text)

    le = LabelEncoder()
    y_enc = le.fit_transform(y)

    print("Computing chi-squared scores…")
    chi2_scores, _ = chi2(X, y_enc)
    feature_names = np.array(vectorizer.get_feature_names_out())

    plot_chi2(feature_names, chi2_scores, 30, PLOTS_DIR / "chi2_feature_importance.png")

    top_30_idx = np.argsort(chi2_scores)[::-1][:30]
    result_df = pd.DataFrame({
        "feature": feature_names[top_30_idx],
        "chi2_score": chi2_scores[top_30_idx],
    })
    out_csv = PHASE02_ARTIFACTS / "chi2_top30.csv"
    result_df.to_csv(out_csv, index=False)
    print(f"Chi-squared top-30 saved → {out_csv}")
    print(result_df.to_string(index=False))


if __name__ == "__main__":
    main()

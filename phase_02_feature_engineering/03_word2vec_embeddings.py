from __future__ import annotations
"""Train Word2Vec embeddings and produce a t-SNE 2-D scatter plot."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.manifold import TSNE

from config import CLEAN_DATA_CSV, LABEL_MAP, SEED, PHASE02_ARTIFACTS, EMBEDDING_DIM

try:
    from gensim.models import Word2Vec
except ImportError:
    Word2Vec = None

CLEAN_CSV = CLEAN_DATA_CSV
PLOTS_DIR = PHASE02_ARTIFACTS.parent / "plots"
COLORS = {"negative": "#e74c3c", "neutral": "#95a5a6", "positive": "#2ecc71"}


def load_sentences(df: pd.DataFrame) -> list[list[str]]:
    return [str(t).split() for t in df["clean_text"].fillna("")]


def plot_tsne(model, words: list[str], label_map: dict[str, str], out: Path):
    PLOTS_DIR.mkdir(parents=True, exist_ok=True)
    vecs, valid_words, valid_labels = [], [], []
    for word, label in label_map.items():
        if word in model.wv:
            vecs.append(model.wv[word])
            valid_words.append(word)
            valid_labels.append(label)

    if len(vecs) < 2:
        print("Not enough vocabulary for t-SNE. Skipping.")
        return

    vecs = np.array(vecs)
    embedded = TSNE(n_components=2, random_state=SEED, perplexity=min(30, len(vecs) - 1)).fit_transform(vecs)

    fig, ax = plt.subplots(figsize=(10, 7))
    for label in set(valid_labels):
        mask = [i for i, l in enumerate(valid_labels) if l == label]
        ax.scatter(embedded[mask, 0], embedded[mask, 1],
                   c=COLORS.get(label, "#3498db"), label=label, alpha=0.75, s=60)
    for i, word in enumerate(valid_words):
        ax.annotate(word, (embedded[i, 0], embedded[i, 1]), fontsize=7, alpha=0.6)
    ax.set_title("t-SNE — Word2Vec Sentiment Word Embeddings", fontsize=13)
    ax.legend()
    plt.tight_layout()
    plt.savefig(out, dpi=150)
    plt.close()
    print(f"Saved → {out}")


def plot_tfidf_term_fallback(df: pd.DataFrame, label_map: dict[str, str], out: Path):
    from sklearn.feature_extraction.text import TfidfVectorizer

    vectorizer = TfidfVectorizer()
    X = vectorizer.fit_transform(df["clean_text"].fillna(""))
    vocab = vectorizer.vocabulary_

    vecs, valid_words, valid_labels = [], [], []
    for word, label in label_map.items():
        if word in vocab:
            vecs.append(X[:, vocab[word]].toarray().ravel())
            valid_words.append(word)
            valid_labels.append(label)

    if len(vecs) < 2:
        print("Not enough vocabulary for fallback t-SNE. Skipping.")
        return

    vecs = np.array(vecs)
    embedded = TSNE(n_components=2, random_state=SEED,
                    perplexity=min(5, len(vecs) - 1)).fit_transform(vecs)

    PLOTS_DIR.mkdir(parents=True, exist_ok=True)
    fig, ax = plt.subplots(figsize=(10, 7))
    for label in set(valid_labels):
        mask = [i for i, l in enumerate(valid_labels) if l == label]
        ax.scatter(embedded[mask, 0], embedded[mask, 1],
                   c=COLORS.get(label, "#3498db"), label=label, alpha=0.75, s=60)
    for i, word in enumerate(valid_words):
        ax.annotate(word, (embedded[i, 0], embedded[i, 1]), fontsize=8, alpha=0.7)
    ax.set_title("Fallback t-SNE - TF-IDF Term Vectors", fontsize=13)
    ax.legend()
    plt.tight_layout()
    plt.savefig(out, dpi=150)
    plt.close()
    print(f"Saved → {out}")

    pd.DataFrame({"word": valid_words, "label": valid_labels}).to_csv(
        PHASE02_ARTIFACTS / "word2vec_fallback_terms.csv",
        index=False,
    )


def main():
    if not CLEAN_CSV.exists():
        from phase_02_feature_engineering.text_cleaning import main as clean_main
        clean_main()

    df = pd.read_csv(CLEAN_CSV)
    if "label_name" not in df.columns:
        df["label_name"] = df["label"].map(LABEL_MAP)

    train = df[df["split"].isin(["train", "validation"])]
    sentences = load_sentences(train)

    # sentiment anchor words for t-SNE
    anchor_negative = ["hate", "terrible", "awful", "worst", "bad", "horrible", "sad", "angry"]
    anchor_neutral  = ["okay", "fine", "normal", "average", "moderate", "regular"]
    anchor_positive = ["love", "great", "amazing", "awesome", "good", "happy", "excellent"]

    word_label_map = {w: "negative" for w in anchor_negative}
    word_label_map.update({w: "neutral"  for w in anchor_neutral})
    word_label_map.update({w: "positive" for w in anchor_positive})

    if Word2Vec is None:
        print("gensim is not installed; creating fallback TF-IDF term t-SNE plot.")
        PHASE02_ARTIFACTS.mkdir(parents=True, exist_ok=True)
        plot_tfidf_term_fallback(train, word_label_map, PLOTS_DIR / "word2vec_tsne.png")
        return

    print(f"Training Word2Vec on {len(sentences):,} sentences (dim={EMBEDDING_DIM})…")
    w2v = Word2Vec(
        sentences,
        vector_size=EMBEDDING_DIM,
        window=5,
        min_count=3,
        workers=4,
        seed=SEED,
        epochs=10,
    )

    PHASE02_ARTIFACTS.mkdir(parents=True, exist_ok=True)
    w2v.save(str(PHASE02_ARTIFACTS / "word2vec.model"))
    print(f"Saved → {PHASE02_ARTIFACTS / 'word2vec.model'}")
    print(f"Vocabulary size: {len(w2v.wv):,}")
    plot_tsne(w2v, list(word_label_map), word_label_map, PLOTS_DIR / "word2vec_tsne.png")

    print("\nNearest neighbors for 'good':")
    if "good" in w2v.wv:
        for word, sim in w2v.wv.most_similar("good", topn=5):
            print(f"  {word:<20} {sim:.4f}")


if __name__ == "__main__":
    main()

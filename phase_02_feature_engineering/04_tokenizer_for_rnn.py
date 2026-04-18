from __future__ import annotations
"""Fit Keras Tokenizer + pad sequences; save tokenizer.pkl; plot sequence-length histogram."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from config import (CLEAN_DATA_CSV, LABEL_MAP, PHASE02_ARTIFACTS,
                    VOCAB_SIZE, MAX_SEQ_LEN)

CLEAN_CSV = CLEAN_DATA_CSV
PLOTS_DIR = PHASE02_ARTIFACTS.parent / "plots"


def load_train_texts(df: pd.DataFrame) -> list[str]:
    return df[df["split"].isin(["train", "validation"])]["clean_text"].fillna("").tolist()


def plot_seq_lengths(lengths: list[int], max_len: int, out: Path):
    PLOTS_DIR.mkdir(parents=True, exist_ok=True)
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.hist(lengths, bins=50, color="#8e44ad", edgecolor="white", alpha=0.85)
    ax.axvline(max_len, color="red", linestyle="--", linewidth=1.5, label=f"MAX_SEQ_LEN={max_len}")
    ax.axvline(np.mean(lengths), color="orange", linestyle="--", linewidth=1.2,
               label=f"Mean={np.mean(lengths):.0f}")
    ax.set_title("Token Sequence Lengths after Tokenization", fontsize=13)
    ax.set_xlabel("Token count")
    ax.set_ylabel("Frequency")
    ax.legend()
    plt.tight_layout()
    plt.savefig(out, dpi=180)
    plt.close()
    print(f"Saved → {out}")


def main():
    # import Keras tokenizer here (heavy import only when needed)
    from tensorflow.keras.preprocessing.text import Tokenizer
    from tensorflow.keras.preprocessing.sequence import pad_sequences

    if not CLEAN_CSV.exists():
        from phase_02_feature_engineering.text_cleaning import main as clean_main
        clean_main()

    df = pd.read_csv(CLEAN_CSV)
    if "label_name" not in df.columns:
        df["label_name"] = df["label"].map(LABEL_MAP)

    train_texts = load_train_texts(df)

    print(f"Fitting Keras Tokenizer (vocab_size={VOCAB_SIZE})…")
    tokenizer = Tokenizer(num_words=VOCAB_SIZE, oov_token="<OOV>")
    tokenizer.fit_on_texts(train_texts)

    seqs = tokenizer.texts_to_sequences(train_texts)
    lengths = [len(s) for s in seqs]
    padded = pad_sequences(seqs, maxlen=MAX_SEQ_LEN, padding="post", truncating="post")

    PHASE02_ARTIFACTS.mkdir(parents=True, exist_ok=True)
    joblib.dump(tokenizer, PHASE02_ARTIFACTS / "tokenizer.pkl")
    print(f"Saved → {PHASE02_ARTIFACTS / 'tokenizer.pkl'}")
    print(f"Effective vocab size : {min(VOCAB_SIZE, len(tokenizer.word_index)):,}")
    print(f"Padded matrix shape  : {padded.shape}")
    print(f"Avg sequence length  : {np.mean(lengths):.1f}")
    print(f"95th-pct length      : {np.percentile(lengths, 95):.0f}")

    plot_seq_lengths(lengths, MAX_SEQ_LEN, PLOTS_DIR / "token_sequence_lengths.png")


if __name__ == "__main__":
    main()

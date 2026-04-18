"""Train the BiLSTM model with EarlyStopping + ModelCheckpoint."""
import sys
import random
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import tensorflow as tf

from config import (BATCH_SIZE, BILSTM_MODEL_PATH, CLEAN_DATA_CSV,
                    EARLY_STOPPING_PATIENCE, EPOCHS,
                    LABEL_MAP, MAX_SEQ_LEN, PHASE04_MODELS, PHASE02_ARTIFACTS,
                    SEED, SENTIMENT_LABELS, VOCAB_SIZE)
from phase_04_rnn_bilstm.build_bilstm import build_bilstm

# reproducibility
random.seed(SEED)
np.random.seed(SEED)
tf.random.set_seed(SEED)

CLEAN_CSV = CLEAN_DATA_CSV
TOKENIZER_PKL = PHASE02_ARTIFACTS / "tokenizer.pkl"


def load_and_pad(df: pd.DataFrame, tokenizer, split_names: list[str]) -> tuple:
    from tensorflow.keras.preprocessing.sequence import pad_sequences

    sub = df[df["split"].isin(split_names)].copy()
    texts = sub["clean_text"].fillna("").tolist()
    labels_raw = sub["label_name"].tolist()

    label_idx = {l: i for i, l in enumerate(SENTIMENT_LABELS)}
    y = np.array([label_idx[l] for l in labels_raw], dtype=np.int32)

    seqs = tokenizer.texts_to_sequences(texts)
    X = pad_sequences(seqs, maxlen=MAX_SEQ_LEN, padding="post", truncating="post")
    return X, y


def plot_history(history, out: Path):
    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    axes[0].plot(history.history["loss"],     label="train loss")
    axes[0].plot(history.history["val_loss"], label="val loss")
    axes[0].set_title("Loss"); axes[0].set_xlabel("Epoch"); axes[0].legend()
    axes[1].plot(history.history["accuracy"],     label="train acc")
    axes[1].plot(history.history["val_accuracy"], label="val acc")
    axes[1].set_title("Accuracy"); axes[1].set_xlabel("Epoch"); axes[1].legend()
    plt.suptitle("BiLSTM Training History", fontsize=13)
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

    if not TOKENIZER_PKL.exists():
        print("Tokenizer not found — running phase 02 tokenizer first…")
        from phase_02_feature_engineering.tokenizer_for_rnn import main as tok_main
        tok_main()

    tokenizer = joblib.load(TOKENIZER_PKL)

    X_train, y_train = load_and_pad(df, tokenizer, ["train"])
    X_val,   y_val   = load_and_pad(df, tokenizer, ["validation"])
    X_test,  y_test  = load_and_pad(df, tokenizer, ["test"])

    print(f"Train: {X_train.shape}  Val: {X_val.shape}  Test: {X_test.shape}")

    model = build_bilstm(vocab_size=min(VOCAB_SIZE, len(tokenizer.word_index) + 2))

    PHASE04_MODELS.mkdir(parents=True, exist_ok=True)
    checkpoint_path = str(BILSTM_MODEL_PATH)

    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor="val_loss",
                                          patience=EARLY_STOPPING_PATIENCE,
                                          restore_best_weights=True),
        tf.keras.callbacks.ModelCheckpoint(checkpoint_path,
                                            monitor="val_loss",
                                            save_best_only=True,
                                            verbose=1),
        tf.keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5,
                                              patience=2, min_lr=1e-5, verbose=1),
    ]

    print(f"\nTraining BiLSTM for up to {EPOCHS} epochs…")
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        callbacks=callbacks,
        verbose=1,
    )

    plot_history(history, PHASE04_MODELS / "training_history.png")

    loss, acc = model.evaluate(X_test, y_test, verbose=0)
    print(f"\nTest loss: {loss:.4f}  |  Test accuracy: {acc:.4f}")
    print(f"Best model checkpoint: {checkpoint_path}")

    # save test arrays for evaluation script
    np.save(PHASE04_MODELS / "X_test.npy", X_test)
    np.save(PHASE04_MODELS / "y_test.npy", y_test)


if __name__ == "__main__":
    main()

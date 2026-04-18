"""Generate token-importance attention heatmap for sample texts."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
import numpy as np
import tensorflow as tf

from config import (BILSTM_MODEL_PATH, PHASE02_ARTIFACTS, PHASE04_MODELS, MAX_SEQ_LEN,
                    SEED, SENTIMENT_LABELS)
from phase_04_rnn_bilstm.build_bilstm import AttentionLayer

SAMPLE_TEXTS = [
    "I absolutely love this product, it's amazing!",
    "This is the worst experience I've ever had.",
    "The weather today is okay, nothing special.",
    "Wow, just wow. I'm speechless.",
    "Not bad, but could definitely be better.",
]


def get_attention_model(model: tf.keras.Model) -> tf.keras.Model:
    """Build a sub-model that outputs [predictions, attention_weights]."""
    attn_layer = model.get_layer("attention")
    bilstm_out = model.get_layer("bilstm").output
    _, attn_weights = attn_layer(bilstm_out)
    return tf.keras.Model(inputs=model.inputs,
                           outputs=[model.output, attn_weights])


def predict_with_attention(text: str, attn_model, tokenizer) -> tuple:
    from tensorflow.keras.preprocessing.sequence import pad_sequences

    seq = tokenizer.texts_to_sequences([text])
    padded = pad_sequences(seq, maxlen=MAX_SEQ_LEN, padding="post", truncating="post")
    proba, weights = attn_model.predict(padded, verbose=0)
    tokens = text.lower().split()[:MAX_SEQ_LEN]
    weights_squeezed = weights[0, :len(tokens), 0]
    return proba[0], tokens, weights_squeezed


def plot_attention_heatmap(results: list[dict], out: Path):
    n = len(results)
    fig, axes = plt.subplots(n, 1, figsize=(14, 2.5 * n))
    if n == 1:
        axes = [axes]

    cmap = plt.cm.YlOrRd
    for ax, res in zip(axes, results):
        tokens  = res["tokens"]
        weights = res["weights"]
        pred    = res["pred"]
        conf    = res["confidence"]

        norm_w = (weights - weights.min()) / (weights.max() - weights.min() + 1e-8)

        for i, (tok, w) in enumerate(zip(tokens, norm_w)):
            color = cmap(w)
            ax.add_patch(plt.Rectangle((i, 0), 1, 1, color=color))
            ax.text(i + 0.5, 0.5, tok, ha="center", va="center",
                    fontsize=9, fontweight="bold" if w > 0.6 else "normal",
                    color="white" if w > 0.5 else "black")

        ax.set_xlim(0, len(tokens))
        ax.set_ylim(0, 1)
        ax.set_yticks([])
        ax.set_xticks([])
        ax.set_title(f'Prediction: {pred} ({conf:.1%}) — "{res["text"][:60]}"',
                      fontsize=10, pad=4)

    plt.suptitle("BiLSTM Attention Weights — Token Importance Heatmap",
                  fontsize=13, y=1.01)
    plt.tight_layout()
    plt.savefig(out, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Saved → {out}")


def main():
    tokenizer_path = PHASE02_ARTIFACTS / "tokenizer.pkl"
    model_path = BILSTM_MODEL_PATH

    if not model_path.exists():
        print("BiLSTM model not found. Run 02_train_rnn.py first.")
        return
    if not tokenizer_path.exists():
        print("Tokenizer not found. Run phase_02 first.")
        return

    print("Loading model and tokenizer…")
    model = tf.keras.models.load_model(str(model_path),
                                        custom_objects={"AttentionLayer": AttentionLayer})
    tokenizer = joblib.load(tokenizer_path)
    attn_model = get_attention_model(model)

    results = []
    for text in SAMPLE_TEXTS:
        proba, tokens, weights = predict_with_attention(text, attn_model, tokenizer)
        pred_idx = proba.argmax()
        results.append({
            "text": text,
            "tokens": tokens,
            "weights": weights,
            "pred": SENTIMENT_LABELS[pred_idx],
            "confidence": float(proba[pred_idx]),
        })
        print(f"  [{SENTIMENT_LABELS[pred_idx]:8s} {proba[pred_idx]:.2%}] {text}")

    PHASE04_MODELS.mkdir(parents=True, exist_ok=True)
    plot_attention_heatmap(results, PHASE04_MODELS / "attention_heatmap.png")


if __name__ == "__main__":
    main()

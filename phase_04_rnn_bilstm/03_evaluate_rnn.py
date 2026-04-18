"""Evaluate the BiLSTM: F1 + ROC vs classical models, confusion matrix."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import json
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import tensorflow as tf
from sklearn.metrics import (classification_report, confusion_matrix,
                              f1_score, precision_score, recall_score,
                              roc_auc_score, roc_curve)
from sklearn.preprocessing import LabelBinarizer

from config import BILSTM_MODEL_PATH, PHASE04_MODELS, SENTIMENT_LABELS
from phase_04_rnn_bilstm.build_bilstm import AttentionLayer


def load_model_and_data():
    model = tf.keras.models.load_model(
        str(BILSTM_MODEL_PATH),
        custom_objects={"AttentionLayer": AttentionLayer},
    )
    X_test = np.load(PHASE04_MODELS / "X_test.npy")
    y_test = np.load(PHASE04_MODELS / "y_test.npy")
    return model, X_test, y_test


def plot_cm(y_true_idx, y_pred_idx, out: Path):
    cm = confusion_matrix(y_true_idx, y_pred_idx)
    fig, ax = plt.subplots(figsize=(7, 5))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=SENTIMENT_LABELS, yticklabels=SENTIMENT_LABELS, ax=ax)
    ax.set_title("BiLSTM — Confusion Matrix")
    ax.set_xlabel("Predicted"); ax.set_ylabel("Actual")
    plt.tight_layout(); plt.savefig(out, dpi=180); plt.close()
    print(f"Saved → {out}")


def plot_roc(y_test_idx, y_proba, out: Path):
    lb = LabelBinarizer()
    y_bin = lb.fit_transform(y_test_idx)
    if y_bin.shape[1] == 1:
        y_bin = np.hstack([1 - y_bin, y_bin])

    fig, ax = plt.subplots(figsize=(8, 6))
    colors = ["#e74c3c", "#95a5a6", "#2ecc71"]
    for i, (cls, color) in enumerate(zip(SENTIMENT_LABELS, colors)):
        if i >= y_proba.shape[1]:
            break
        fpr, tpr, _ = roc_curve(y_bin[:, i], y_proba[:, i])
        auc = roc_auc_score(y_bin[:, i], y_proba[:, i])
        ax.plot(fpr, tpr, color=color, lw=2, label=f"{cls} (AUC={auc:.3f})")
    ax.plot([0, 1], [0, 1], "k--", lw=1)
    ax.set_title("ROC Curves — BiLSTM")
    ax.set_xlabel("FPR"); ax.set_ylabel("TPR"); ax.legend()
    plt.tight_layout(); plt.savefig(out, dpi=180); plt.close()
    print(f"Saved → {out}")


def main():
    print("Loading BiLSTM model…")
    model, X_test, y_test = load_model_and_data()

    y_proba = model.predict(X_test, verbose=0)
    y_pred  = y_proba.argmax(axis=1)

    labels_true = [SENTIMENT_LABELS[i] for i in y_test]
    labels_pred = [SENTIMENT_LABELS[i] for i in y_pred]

    metrics = {
        "model": "BiLSTM",
        "test_macro_f1": round(float(f1_score(y_test, y_pred, average="macro",
                                               labels=list(range(len(SENTIMENT_LABELS))),
                                               zero_division=0)), 4),
        "test_macro_precision": round(float(precision_score(y_test, y_pred, average="macro",
                                                            labels=list(range(len(SENTIMENT_LABELS))),
                                                            zero_division=0)), 4),
        "test_macro_recall": round(float(recall_score(y_test, y_pred, average="macro",
                                                      labels=list(range(len(SENTIMENT_LABELS))),
                                                      zero_division=0)), 4),
    }

    PHASE04_MODELS.mkdir(parents=True, exist_ok=True)
    with open(PHASE04_MODELS / "bilstm_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    print("\n=== BiLSTM Evaluation ===")
    print(classification_report(labels_true, labels_pred, labels=SENTIMENT_LABELS, zero_division=0))
    print("Summary:", metrics)

    plot_cm(y_test, y_pred, PHASE04_MODELS / "confusion_matrix_bilstm.png")
    plot_roc(y_test, y_proba, PHASE04_MODELS / "roc_curves_bilstm.png")
    return metrics


if __name__ == "__main__":
    main()

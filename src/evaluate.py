from __future__ import annotations
import json
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score
from wordcloud import WordCloud

from src.config import METRICS_PATH, CLASSIFICATION_REPORT_PATH, CONFUSION_MATRIX_PATH, TEST_PREDICTIONS_PATH, WORDCLOUD_PATH

def save_metrics(y_true, y_pred):
    metrics = {"accuracy": float(accuracy_score(y_true, y_pred)), "macro_f1": float(f1_score(y_true, y_pred, average="macro"))}
    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    return metrics

def save_classification_report(y_true, y_pred):
    report = classification_report(y_true, y_pred, digits=4)
    with open(CLASSIFICATION_REPORT_PATH, "w", encoding="utf-8") as f:
        f.write(report)
    return report

def save_confusion_matrix(y_true, y_pred, labels):
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    plt.figure(figsize=(7, 5))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=labels, yticklabels=labels)
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.title("Confusion Matrix")
    plt.tight_layout()
    plt.savefig(CONFUSION_MATRIX_PATH, dpi=180)
    plt.close()
    return cm

def save_prediction_file(test_df: pd.DataFrame):
    test_df.to_csv(TEST_PREDICTIONS_PATH, index=False)

def save_wordcloud(df: pd.DataFrame):
    text = " ".join(df["clean_text"].fillna("").astype(str).tolist())
    if not text.strip():
        return
    wc = WordCloud(width=1200, height=600, background_color="white").generate(text)
    plt.figure(figsize=(12, 6))
    plt.imshow(wc, interpolation="bilinear")
    plt.axis("off")
    plt.tight_layout()
    plt.savefig(WORDCLOUD_PATH, dpi=180)
    plt.close()

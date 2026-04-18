from __future__ import annotations
from src.config import RISK_CONFIDENCE_THRESHOLD, SENTIMENT_LABELS


EMOJI_MAP = {"positive": "😊", "neutral": "😐", "negative": "😡"}


def sentiment_to_emoji(label: str) -> str:
    return EMOJI_MAP.get(label, "🧠")


def normalize_label_counts():
    return {label: 0 for label in SENTIMENT_LABELS}


def build_risk_flag(
    baseline_label: str,
    baseline_conf: float,
    transformer_label: str = None,
    transformer_conf: float = None,
) -> str:
    issues = []
    if baseline_conf is not None and baseline_conf < RISK_CONFIDENCE_THRESHOLD:
        issues.append("Low baseline confidence")
    if transformer_conf is not None and transformer_conf < RISK_CONFIDENCE_THRESHOLD:
        issues.append("Low transformer confidence")
    if transformer_label is not None and baseline_label != transformer_label:
        issues.append("Model disagreement")
    return " | ".join(issues) if issues else "No major risk"


def build_consensus_label(*labels: str) -> str:
    valid_labels = [label for label in labels if label in SENTIMENT_LABELS]
    if not valid_labels:
        return "unknown"

    counts = {}
    for label in valid_labels:
        counts[label] = counts.get(label, 0) + 1

    top_label = max(counts, key=counts.get)
    if counts[top_label] > len(valid_labels) / 2:
        return top_label
    return "mixed"


def format_scores_as_text(scores) -> str:
    return "\n".join([f"{item['label']}: {item['score']:.4f}" for item in scores])


def make_summary_card(label: str, confidence: float) -> str:
    return f"{sentiment_to_emoji(label)}  Prediction: {label.title()} | Confidence: {confidence:.2%}"

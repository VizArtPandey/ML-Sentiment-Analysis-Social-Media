"""Unified predict(text, model_name) entry point for all deployed pipelines."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config import MAX_SEQ_LEN, SENTIMENT_LABELS
from src.ambiguity_calibrator import calibrate_sentiment
from src.preprocess import preprocess_social_text
from phase_06_huggingface_deploy.model_loader import get_models


def _vader_predict(text: str, analyzer) -> dict:
    scores = analyzer.polarity_scores(text)
    compound = scores["compound"]
    if compound >= 0.05:
        label, conf = "positive", min(0.99, 0.5 + compound * 0.5)
    elif compound <= -0.05:
        label, conf = "negative", min(0.99, 0.5 - compound * 0.5)
    else:
        label, conf = "neutral", 0.6
    proba = {"positive": 0.0, "neutral": 0.0, "negative": 0.0, "mixed": 0.0}
    proba[label] = conf
    rest = (1 - conf) / 2
    for k in proba:
        if k != label:
            proba[k] = rest
    return {
        "label": label,
        "confidence": round(conf, 4),
        "scores": {k: round(float(v), 4) for k, v in proba.items()},
    }


def _sklearn_predict(text: str, model) -> dict:
    clean = preprocess_social_text(text)
    proba = model.predict_proba([clean])[0]
    classes = model.classes_
    idx = int(proba.argmax())
    return {
        "label": str(classes[idx]),
        "confidence": round(float(proba[idx]), 4),
        "scores": {str(c): round(float(p), 4) for c, p in zip(classes, proba)},
    }


def _bilstm_predict(text: str, model, tokenizer) -> dict:
    from tensorflow.keras.preprocessing.sequence import pad_sequences

    clean = preprocess_social_text(text)
    seq   = tokenizer.texts_to_sequences([clean])
    padded = pad_sequences(seq, maxlen=MAX_SEQ_LEN, padding="post", truncating="post")
    proba = model.predict(padded, verbose=0)[0]
    idx = int(proba.argmax())
    return {
        "label": SENTIMENT_LABELS[idx],
        "confidence": round(float(proba[idx]), 4),
        "scores": {l: round(float(p), 4) for l, p in zip(SENTIMENT_LABELS, proba)},
    }


def predict(text: str, model_name: str = "all") -> dict:
    """
    model_name: 'calibrated' | 'vader' | 'lr' | 'rf' | 'svm' | 'bilstm' | 'all'
    Returns dict with keys matching model_name(s).
    """
    models = get_models()
    results = {}

    if model_name in ("vader", "all") and models.get("vader"):
        results["vader"] = _vader_predict(text, models["vader"])

    if model_name in ("lr", "all") and models.get("lr"):
        results["lr"] = _sklearn_predict(text, models["lr"])

    if model_name in ("rf", "all") and models.get("rf"):
        results["rf"] = _sklearn_predict(text, models["rf"])

    if model_name in ("svm", "all") and models.get("svm"):
        results["svm"] = _sklearn_predict(text, models["svm"])

    if model_name in ("bilstm", "all") and models.get("bilstm") and models.get("tokenizer"):
        results["bilstm"] = _bilstm_predict(text, models["bilstm"], models["tokenizer"])

    if model_name in ("calibrated", "all"):
        results["calibrated"] = calibrate_sentiment(
            text,
            results,
            models.get("ambiguity_calibrator"),
        )

    return results

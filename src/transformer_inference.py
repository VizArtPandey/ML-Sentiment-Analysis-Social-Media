import os

from src.config import TRANSFORMER_LOCAL_ONLY, TRANSFORMER_MODEL_NAME
from src.preprocess import preprocess_for_cardiffnlp


LABEL_NORMALIZATION = {
    "negative": "negative",
    "neutral": "neutral",
    "positive": "positive",
    "label_0": "negative",
    "label_1": "neutral",
    "label_2": "positive",
}

_TRANSFORMER_STATE = {
    "attempted": False,
    "pipeline": None,
    "error": None,
}


def get_transformer_pipeline():
    if _TRANSFORMER_STATE["pipeline"] is not None:
        return _TRANSFORMER_STATE["pipeline"]

    if _TRANSFORMER_STATE["attempted"]:
        raise RuntimeError(_TRANSFORMER_STATE["error"] or "Transformer pipeline unavailable.")

    _TRANSFORMER_STATE["attempted"] = True

    try:
        if TRANSFORMER_LOCAL_ONLY:
            os.environ.setdefault("HF_HUB_OFFLINE", "1")
            os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

        from transformers import pipeline

        transformer_pipeline = pipeline(
            "text-classification",
            model=TRANSFORMER_MODEL_NAME,
            tokenizer=TRANSFORMER_MODEL_NAME,
            top_k=None,
            truncation=True,
            local_files_only=TRANSFORMER_LOCAL_ONLY,
        )
        _TRANSFORMER_STATE["pipeline"] = transformer_pipeline
        _TRANSFORMER_STATE["error"] = None
        return transformer_pipeline
    except Exception as exc:
        _TRANSFORMER_STATE["error"] = str(exc)
        raise


def transformer_loaded() -> bool:
    return _TRANSFORMER_STATE["pipeline"] is not None


def normalize_label(label: str) -> str:
    return LABEL_NORMALIZATION.get(str(label).strip().lower(), str(label).strip().lower())


def predict_with_transformer(text: str):
    pipe = get_transformer_pipeline()
    clean_text = preprocess_for_cardiffnlp(text)
    raw_scores = pipe(clean_text)[0]
    scores = [{"label": normalize_label(item["label"]), "score": float(item["score"])} for item in raw_scores]
    scores = sorted(scores, key=lambda item: item["score"], reverse=True)
    best = scores[0]
    return {
        "label": best["label"],
        "confidence": best["score"],
        "scores": scores,
        "model_name": TRANSFORMER_MODEL_NAME,
    }

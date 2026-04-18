"""Load all models once at FastAPI startup; expose a unified predict interface."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import logging
import numpy as np

from config import (AMBIGUITY_CALIBRATOR_PATH, BILSTM_MODEL_PATH, MAX_SEQ_LEN, PHASE02_ARTIFACTS,
                    PHASE03_RESULTS, SENTIMENT_LABELS)
from src.ambiguity_calibrator import calibrate_sentiment
from src.preprocess import preprocess_social_text

logger = logging.getLogger(__name__)

_models: dict = {}
_attention_build_failed = False


def _try_load_vader():
    try:
        from src.vader_fallback import get_sentiment_analyzer
        return get_sentiment_analyzer()
    except Exception as e:
        logger.warning(f"VADER load failed: {e}")
        return None


def _try_load_lr():
    return _try_load_joblib_model("lr_model.joblib", "LR")


def _try_load_rf():
    return _try_load_joblib_model("rf_model.joblib", "Random Forest")


def _try_load_svm():
    return _try_load_joblib_model("svm_model.joblib", "SVM")


def _try_load_ambiguity_calibrator():
    try:
        import joblib
        return joblib.load(AMBIGUITY_CALIBRATOR_PATH) if AMBIGUITY_CALIBRATOR_PATH.exists() else None
    except Exception as e:
        logger.warning(f"Ambiguity calibrator load failed: {e}")
        return None


def _try_load_joblib_model(filename: str, label: str):
    try:
        import joblib
        path = PHASE03_RESULTS / filename
        return joblib.load(path) if path.exists() else None
    except Exception as e:
        logger.warning(f"{label} load failed: {e}")
        return None


def _try_load_bilstm():
    """Load BiLSTM model, preferring the native Keras 3 checkpoint."""
    try:
        import joblib
        import tensorflow as tf
        from phase_04_rnn_bilstm.build_bilstm import AttentionLayer

        tok_path = PHASE02_ARTIFACTS / "tokenizer.pkl"
        if not tok_path.exists():
            return None, None

        tokenizer = joblib.load(tok_path)

        h5_path = BILSTM_MODEL_PATH.with_suffix(".h5")
        model_paths = [path for path in (BILSTM_MODEL_PATH, h5_path) if path.exists()]
        if not model_paths:
            logger.warning("BiLSTM model not found. Run: python -m phase_04_rnn_bilstm.02_train_rnn")
            return None, None

        last_error = None
        for model_path in model_paths:
            try:
                logger.info(f"Loading BiLSTM from {model_path.name}…")
                model = tf.keras.models.load_model(
                    str(model_path),
                    custom_objects={"AttentionLayer": AttentionLayer},
                )
                return model, tokenizer
            except Exception as exc:
                last_error = exc
                logger.warning(f"BiLSTM load from {model_path.name} failed: {exc}")
        raise last_error
    except Exception as e:
        msg = str(e)
        if "keras.src" in msg or "Functional" in msg:
            logger.warning(
                "BiLSTM .keras file requires Keras 3. "
                "Retrain with: python -m phase_04_rnn_bilstm.02_train_rnn  (saves .h5 for Keras 2)"
            )
        else:
            logger.warning(f"BiLSTM load failed: {e}")
        return None, None


def startup():
    global _models, _attention_build_failed
    _attention_build_failed = False
    logger.info("Loading all models…")
    _models["vader"] = _try_load_vader()

    _models["lr"] = _try_load_lr()
    _models["rf"] = _try_load_rf()
    _models["svm"] = _try_load_svm()
    _models["ambiguity_calibrator"] = _try_load_ambiguity_calibrator()

    bilstm, tokenizer = _try_load_bilstm()
    _models["bilstm"]    = bilstm
    _models["tokenizer"] = tokenizer
    try:
        _models["attention_model"] = _build_attention_model(bilstm) if bilstm is not None else None
    except Exception as e:
        logger.warning(f"Attention model build failed: {e}")
        _models["attention_model"] = None
        _attention_build_failed = True

    loaded = {k: v is not None for k, v in _models.items()}
    logger.info(f"Models ready: {loaded}")
    return loaded


def models_loaded() -> dict[str, bool]:
    return {k: v is not None for k, v in _models.items()}


def predict_vader(text: str) -> dict | None:
    analyzer = _models.get("vader")
    if not analyzer:
        return None
    scores = analyzer.polarity_scores(text)
    compound = scores["compound"]
    if compound >= 0.05:
        label, conf = "positive", min(0.99, 0.5 + compound * 0.5)
    elif compound <= -0.05:
        label, conf = "negative", min(0.99, 0.5 - compound * 0.5)
    else:
        label, conf = "neutral", 0.60
    proba = {l: 0.0 for l in SENTIMENT_LABELS}
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


def predict_lr(text: str) -> dict | None:
    return _predict_sklearn_model(text, _models.get("lr"))


def predict_rf(text: str) -> dict | None:
    return _predict_sklearn_model(text, _models.get("rf"))


def predict_svm(text: str) -> dict | None:
    return _predict_sklearn_model(text, _models.get("svm"))


def _predict_sklearn_model(text: str, model) -> dict | None:
    if not model:
        return None
    clean = preprocess_social_text(text)
    proba = model.predict_proba([clean])[0]
    idx   = int(proba.argmax())
    return {
        "label": str(model.classes_[idx]),
        "confidence": round(float(proba[idx]), 4),
        "scores": {str(c): round(float(p), 4) for c, p in zip(model.classes_, proba)},
    }


def _build_attention_model(model):
    if model is None:
        return None
    import tensorflow as tf

    attn_layer = model.get_layer("attention")
    bilstm_out = model.get_layer("bilstm").output
    _, attn_w = attn_layer(bilstm_out)
    return tf.keras.Model(inputs=model.inputs, outputs=[model.output, attn_w])


def predict_bilstm(text: str) -> tuple[dict | None, dict | None]:
    """Returns (prediction_dict, attention_dict)."""
    global _attention_build_failed
    model = _models.get("bilstm")
    tokenizer = _models.get("tokenizer")
    attn_model = _models.get("attention_model")
    if not model or not tokenizer:
        return None, None

    try:
        from tensorflow.keras.preprocessing.sequence import pad_sequences
    except Exception as e:
        logger.warning(f"BiLSTM prediction unavailable: {e}")
        return None, None

    clean = preprocess_social_text(text)
    seq   = tokenizer.texts_to_sequences([clean])
    padded = pad_sequences(seq, maxlen=MAX_SEQ_LEN, padding="post", truncating="post")

    if attn_model is None and not _attention_build_failed:
        try:
            attn_model = _build_attention_model(model)
            _models["attention_model"] = attn_model
        except Exception as e:
            logger.warning(f"Attention weights unavailable: {e}")
            _models["attention_model"] = None
            _attention_build_failed = True

    weights = None
    if attn_model is not None:
        proba, weights = attn_model.predict(padded, verbose=0)
        proba = proba[0]
        weights = weights[0]       # (MAX_SEQ_LEN, 1)
    else:
        proba = model.predict(padded, verbose=0)[0]

    idx = int(proba.argmax())
    tokens  = clean.split()[:MAX_SEQ_LEN]
    w_slice = weights[:len(tokens), 0].tolist() if weights is not None else []

    prediction = {
        "label": SENTIMENT_LABELS[idx],
        "confidence": round(float(proba[idx]), 4),
        "scores": {l: round(float(p), 4) for l, p in zip(SENTIMENT_LABELS, proba)},
    }
    attention = {"tokens": tokens, "weights": w_slice} if weights is not None else None
    return prediction, attention


def predict_all(text: str) -> dict:
    vader_res            = predict_vader(text)
    lr_res               = predict_lr(text)
    bilstm_res, attn_res = predict_bilstm(text)
    outputs = {
        "vader":     vader_res,
        "lr":        lr_res,
        "rf":        predict_rf(text),
        "svm":       predict_svm(text),
        "bilstm":    bilstm_res,
        "attention": attn_res,
    }
    outputs["calibrated"] = calibrate_sentiment(text, outputs, _models.get("ambiguity_calibrator"))
    return outputs

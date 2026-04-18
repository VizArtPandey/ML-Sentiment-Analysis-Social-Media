"""Load all trained models once at startup for Gradio inference."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import joblib
from config import AMBIGUITY_CALIBRATOR_PATH, BILSTM_MODEL_PATH, PHASE02_ARTIFACTS, PHASE03_RESULTS

_cache: dict = {}


def _load_vader():
    from src.vader_fallback import get_sentiment_analyzer
    return get_sentiment_analyzer()


def _load_lr():
    return _load_joblib_model("lr_model.joblib")


def _load_rf():
    return _load_joblib_model("rf_model.joblib")


def _load_svm():
    return _load_joblib_model("svm_model.joblib")


def _load_ambiguity_calibrator():
    if not AMBIGUITY_CALIBRATOR_PATH.exists():
        return None
    return joblib.load(AMBIGUITY_CALIBRATOR_PATH)


def _load_joblib_model(filename: str):
    path = PHASE03_RESULTS / filename
    if not path.exists():
        return None
    return joblib.load(path)


def _load_bilstm():
    try:
        import tensorflow as tf
        from phase_04_rnn_bilstm.build_bilstm import AttentionLayer
    except Exception as exc:
        print(f"BiLSTM unavailable: {exc}")
        return None, None

    path = BILSTM_MODEL_PATH
    if not path.exists():
        return None, None
    model = tf.keras.models.load_model(str(path), custom_objects={"AttentionLayer": AttentionLayer})

    tokenizer_path = PHASE02_ARTIFACTS / "tokenizer.pkl"
    tokenizer = joblib.load(tokenizer_path) if tokenizer_path.exists() else None
    return model, tokenizer


def get_models() -> dict:
    if _cache:
        return _cache
    print("Loading models…")
    _cache["vader"]     = _load_vader()
    _cache["lr"]        = _load_lr()
    _cache["rf"]        = _load_rf()
    _cache["svm"]       = _load_svm()
    _cache["ambiguity_calibrator"] = _load_ambiguity_calibrator()
    bilstm, tokenizer   = _load_bilstm()
    _cache["bilstm"]    = bilstm
    _cache["tokenizer"] = tokenizer
    print("All models loaded.")
    return _cache

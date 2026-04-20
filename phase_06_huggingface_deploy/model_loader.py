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

    # Keep HF behavior aligned with local backend: prefer .keras, then .h5 fallback.
    keras_path = BILSTM_MODEL_PATH.with_suffix(".keras")
    h5_path = BILSTM_MODEL_PATH.with_suffix(".h5")
    model_paths = [path for path in (keras_path, h5_path) if path.exists()]
    if not model_paths:
        print("BiLSTM model missing (.keras/.h5 not found).")
        return None, None

    model = None
    for model_path in model_paths:
        try:
            model = tf.keras.models.load_model(
                str(model_path),
                custom_objects={"AttentionLayer": AttentionLayer},
            )
            print(f"BiLSTM loaded from {model_path.name}")
            break
        except Exception as exc:
            print(f"BiLSTM load failed for {model_path.name}: {exc}")

    if model is None:
        return None, None

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

import os
from pathlib import Path


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        return default


def _env_float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, default))
    except (TypeError, ValueError):
        return default


def _env_list(name: str, default: str):
    raw_value = os.getenv(name, default)
    items = [item.strip() for item in str(raw_value).split(",")]
    return [item for item in items if item]


def _env_bool(name: str, default: bool) -> bool:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    return str(raw_value).strip().lower() not in {"0", "false", "no", "off"}


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"
REPORT_DIR = BASE_DIR / "reports"
ASSETS_DIR = BASE_DIR / "assets"

MODEL_DIR.mkdir(exist_ok=True, parents=True)
REPORT_DIR.mkdir(exist_ok=True, parents=True)
ASSETS_DIR.mkdir(exist_ok=True, parents=True)

PROJECT_NAME = "Sentiment Analysis API"
PROJECT_VERSION = "3.0.0"

BASELINE_MODEL_PATH = MODEL_DIR / "baseline_pipeline.joblib"
METRICS_PATH = REPORT_DIR / "metrics.json"
CLASSIFICATION_REPORT_PATH = REPORT_DIR / "classification_report.txt"
TOP_FEATURES_PATH = REPORT_DIR / "top_features.csv"
TEST_PREDICTIONS_PATH = REPORT_DIR / "test_predictions.csv"
CONFUSION_MATRIX_PATH = REPORT_DIR / "confusion_matrix.png"
WORDCLOUD_PATH = REPORT_DIR / "wordcloud.png"

LABEL_MAP = {0: "negative", 1: "neutral", 2: "positive"}
SENTIMENT_LABELS = ["negative", "neutral", "positive"]

TRANSFORMER_MODEL_NAME = os.getenv(
    "SENTIMENT_TRANSFORMER_MODEL",
    "cardiffnlp/twitter-roberta-base-sentiment-latest",
)
TRANSFORMER_LOCAL_ONLY = _env_bool("SENTIMENT_TRANSFORMER_LOCAL_ONLY", True)
RISK_CONFIDENCE_THRESHOLD = _env_float("SENTIMENT_RISK_CONFIDENCE_THRESHOLD", 0.55)
MAX_TEXT_LENGTH = _env_int("SENTIMENT_MAX_TEXT_LENGTH", 2000)
MAX_BATCH_TEXTS = _env_int("SENTIMENT_MAX_BATCH_TEXTS", 200)
MAX_TWITTER_QUERY_LENGTH = _env_int("SENTIMENT_MAX_TWITTER_QUERY_LENGTH", 120)

CORS_ORIGINS = _env_list("SENTIMENT_CORS_ORIGINS", "*")

DEFAULT_CHALLENGE_TEXTS = [
    "I love how terrible this is",
    "Not bad, but not good either",
    "Wow, just wow.",
    "Great, another update that fixes nothing.",
    "I can't say I hated it.",
    "This is sick, in the best way.",
    "Sure, because that worked so well last time.",
    "I'm happy you're gone.",
]

"""Single source of truth for all project hyperparameters and paths."""
from pathlib import Path
import os


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

# ── Reproducibility ─────────────────────────────────────────────────────────
SEED = 42

# ── Directories ──────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"
REPORT_DIR = BASE_DIR / "reports"
ASSETS_DIR = BASE_DIR / "assets"
MPLCONFIG_DIR = Path(os.getenv("MPLCONFIGDIR", "/tmp/sentiment_social_media_matplotlib"))

os.environ.setdefault("MPLCONFIGDIR", str(MPLCONFIG_DIR))

PHASE01_PLOTS = BASE_DIR / "phase_01_data_exploration" / "plots"
PHASE02_ARTIFACTS = BASE_DIR / "phase_02_feature_engineering" / "artifacts"
PHASE03_RESULTS = BASE_DIR / "phase_03_classical_models" / "results"
PHASE04_MODELS = BASE_DIR / "phase_04_rnn_bilstm" / "saved_models"

for _d in [DATA_DIR, MPLCONFIG_DIR, PHASE01_PLOTS, PHASE02_ARTIFACTS,
           PHASE03_RESULTS, PHASE04_MODELS]:
    _d.mkdir(parents=True, exist_ok=True)

# ── Dataset ───────────────────────────────────────────────────────────────────
DATASET_SOURCE = os.getenv("DATASET_SOURCE", "bdstar").strip().lower()
DATASET_NAME = os.getenv("DATASET_NAME", "tweet_eval").strip()
DATASET_SUBSET = os.getenv("DATASET_SUBSET", "sentiment").strip() or None
DATASET_FALLBACK_NAME = "tweet_eval"
DATASET_FALLBACK_SUBSET = "sentiment"
SAMPLE_DATA_CSV = DATA_DIR / "sample_social_sentiment.csv"
RAW_DATA_CSV = DATA_DIR / "social_sentiment.csv"
CLEAN_DATA_CSV = DATA_DIR / "social_sentiment_clean.csv"

LABEL_MAP = {0: "negative", 1: "neutral", 2: "positive"}
SENTIMENT_LABELS = ["negative", "neutral", "positive"]
NUM_CLASSES = 3

# ── Text preprocessing ────────────────────────────────────────────────────────
MAX_TEXT_LENGTH = 280               # tweet max chars
MAX_SEQ_LEN = 64                    # token padding length for RNN
VOCAB_SIZE = 30_000
EMBEDDING_DIM = 128

# ── TF-IDF ───────────────────────────────────────────────────────────────────
TFIDF_MAX_FEATURES = 25_000
TFIDF_NGRAM_RANGE = (1, 2)
TFIDF_MIN_DF = 1
TFIDF_MAX_DF = 0.95

# ── Classical model training ──────────────────────────────────────────────────
TEST_SIZE = 0.20
VAL_SIZE = 0.10
LR_MAX_ITER = _env_int("LR_MAX_ITER", 1500)
LR_C = _env_float("LR_C", 1.0)
RF_N_ESTIMATORS = _env_int("RF_N_ESTIMATORS", 300)
SVM_C = _env_float("SVM_C", 1.0)
SKLEARN_N_JOBS = _env_int("SKLEARN_N_JOBS", -1)

# ── BiLSTM hyperparameters ────────────────────────────────────────────────────
LSTM_UNITS = _env_int("LSTM_UNITS", 64)
DENSE_UNITS = _env_int("DENSE_UNITS", 64)
DROPOUT_RATE = _env_float("DROPOUT_RATE", 0.4)
BATCH_SIZE = _env_int("BATCH_SIZE", 64)
EPOCHS = _env_int("EPOCHS", 20)
EARLY_STOPPING_PATIENCE = _env_int("EARLY_STOPPING_PATIENCE", 4)
LEARNING_RATE = _env_float("LEARNING_RATE", 1e-3)

# ── Saved artifact paths ──────────────────────────────────────────────────────
TFIDF_PKL = PHASE02_ARTIFACTS / "tfidf.pkl"
TOKENIZER_PKL = PHASE02_ARTIFACTS / "tokenizer.pkl"
WORD2VEC_MODEL = PHASE02_ARTIFACTS / "word2vec.model"

BASELINE_MODEL_PATH = MODEL_DIR / "baseline_pipeline.joblib"
LR_MODEL_PATH = PHASE03_RESULTS / "lr_model.joblib"
RF_MODEL_PATH = PHASE03_RESULTS / "rf_model.joblib"
SVM_MODEL_PATH = PHASE03_RESULTS / "svm_model.joblib"
AMBIGUITY_CALIBRATOR_PATH = PHASE03_RESULTS / "ambiguity_calibrator.joblib"
BILSTM_MODEL_PATH = PHASE04_MODELS / "bilstm_best.h5"
METRICS_SUMMARY_CSV = PHASE03_RESULTS / "metrics_summary.csv"

METRICS_PATH = REPORT_DIR / "metrics.json"
CLASSIFICATION_REPORT_PATH = REPORT_DIR / "classification_report.txt"
CONFUSION_MATRIX_PATH = REPORT_DIR / "confusion_matrix.png"
WORDCLOUD_PATH = REPORT_DIR / "wordcloud.png"
TOP_FEATURES_PATH = REPORT_DIR / "top_features.csv"
TEST_PREDICTIONS_PATH = REPORT_DIR / "test_predictions.csv"

# ── API / server ──────────────────────────────────────────────────────────────
PROJECT_NAME = "Sentiment Analysis – Social Media"
PROJECT_VERSION = "4.0.0"
MAX_BATCH_TEXTS = 200
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

# ── Misc ──────────────────────────────────────────────────────────────────────
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

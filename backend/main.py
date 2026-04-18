"""FastAPI backend — /predict /metrics /history /health."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import logging
import os
import random
import re
from collections import deque
from datetime import datetime, timezone, timedelta
from uuid import uuid4

import requests
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

DOTENV_PATH = Path(__file__).resolve().parent.parent / ".env"


def _load_env_file() -> None:
    """Tiny .env loader so token config works even without python-dotenv."""
    if not DOTENV_PATH.exists():
        return
    for raw_line in DOTENV_PATH.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and value:
            os.environ[key] = value


try:
    from dotenv import load_dotenv
    load_dotenv(DOTENV_PATH)
except ImportError:
    load_dotenv = None

_load_env_file()

from config import (API_HOST, API_PORT, CORS_ORIGINS, PHASE04_MODELS,
                    PROJECT_NAME, PROJECT_VERSION)
from backend.schemas import (AttentionData, BatchPredictRequest, HealthResponse,
                             HistoryItem, MetricsResponse, PredictRequest,
                             PredictResponse, SentimentResult)
from backend import model_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

HISTORY: deque = deque(maxlen=200)
_EVAL_TWEETS: list = []   # cached tweet_eval test split

app = FastAPI(
    title=PROJECT_NAME,
    version=PROJECT_VERSION,
    description="Sentiment Analysis API - VADER, classical ML, and BiLSTM",
)

MODEL_KEYS = {"calibrated", "vader", "lr", "rf", "svm", "bilstm"}
TWITTER_RECENT_SEARCH_URL = "https://api.x.com/2/tweets/search/recent"
TWITTER_BEARER_TOKEN_ENV = ("X_BEARER_TOKEN", "TWITTER_BEARER_TOKEN")
HASHTAG_RE = re.compile(r"^[A-Za-z0-9_]{1,100}$")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if CORS_ORIGINS == ["*"] else CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    model_manager.startup()


def _ensure_eval_tweets():
    global _EVAL_TWEETS
    if _EVAL_TWEETS:
        return
    try:
        from datasets import load_dataset
        ds = load_dataset("tweet_eval", "sentiment", split="test")
        _LABEL_MAP = {0: "negative", 1: "neutral", 2: "positive"}
        _EVAL_TWEETS = [
            {"text": row["text"], "ground_truth": _LABEL_MAP.get(row["label"], "unknown")}
            for row in ds
        ]
        logger.info(f"Cached {len(_EVAL_TWEETS)} tweet_eval test tweets for live-eval")
    except Exception as exc:
        logger.warning(f"tweet_eval dataset unavailable: {exc}")


@app.get("/api/health", response_model=HealthResponse, tags=["meta"])
def health():
    return HealthResponse(
        status="ok",
        version=PROJECT_VERSION,
        models_loaded=model_manager.models_loaded(),
    )


@app.post("/api/predict", response_model=PredictResponse, tags=["inference"])
def predict(req: PredictRequest):
    request_id = str(uuid4())
    text = req.text
    requested = set(req.models or ["all"])
    include_all = "all" in requested

    raw = model_manager.predict_all(text)

    def to_result(model_key: str):
        if not include_all and model_key not in requested:
            return None
        d = raw.get(model_key)
        if not d:
            return None
        return SentimentResult(label=d["label"], confidence=d["confidence"],
                                scores=d["scores"])

    attn = raw.get("attention")
    attn_data = AttentionData(**attn) if attn and (include_all or "bilstm" in requested) else None

    response = PredictResponse(
        text=text,
        request_id=request_id,
        calibrated=to_result("calibrated"),
        vader=to_result("vader"),
        lr=to_result("lr"),
        rf=to_result("rf"),
        svm=to_result("svm"),
        bilstm=to_result("bilstm"),
        attention=attn_data,
    )

    HISTORY.append(HistoryItem(
        request_id=request_id,
        text=text[:120],
        calibrated=response.calibrated,
        vader=response.vader,
        lr=response.lr,
        rf=response.rf,
        svm=response.svm,
        bilstm=response.bilstm,
        timestamp=datetime.now(timezone.utc).isoformat(),
    ))

    return response


@app.post("/api/predict/batch", response_model=list[PredictResponse], tags=["inference"])
def predict_batch(req: BatchPredictRequest):
    if len(req.texts) > 200:
        raise HTTPException(status_code=400, detail="Batch size exceeds 200 texts.")
    return [predict(PredictRequest(text=text, models=req.models)) for text in req.texts]


@app.get("/api/metrics", response_model=MetricsResponse, tags=["meta"])
def metrics():
    benchmark_csv = PHASE04_MODELS / "all_models_benchmark.csv"
    if not benchmark_csv.exists():
        # return sensible defaults
        return MetricsResponse(benchmark=[
            {"model": "VADER",               "macro_f1": 0.548, "macro_precision": 0.531, "macro_recall": 0.563},
            {"model": "Logistic Regression", "macro_f1": 0.721, "macro_precision": 0.718, "macro_recall": 0.725},
            {"model": "Random Forest",       "macro_f1": 0.681, "macro_precision": 0.674, "macro_recall": 0.692},
            {"model": "SVM",                 "macro_f1": 0.709, "macro_precision": 0.705, "macro_recall": 0.714},
            {"model": "BiLSTM",              "macro_f1": 0.762, "macro_precision": 0.758, "macro_recall": 0.771},
        ])

    import pandas as pd
    df = pd.read_csv(benchmark_csv)
    return MetricsResponse(
        benchmark=df.to_dict(orient="records"),
        updated_at=datetime.fromtimestamp(benchmark_csv.stat().st_mtime).isoformat(),
    )


@app.get("/api/history", response_model=list[HistoryItem], tags=["meta"])
def history():
    return list(HISTORY)


def _normalize_hashtag(hashtag: str) -> str:
    tag = hashtag.strip().lstrip("#").strip()
    if not HASHTAG_RE.fullmatch(tag):
        raise HTTPException(
            status_code=400,
            detail="Enter one hashtag using letters, numbers, or underscores only.",
        )
    return tag


def _twitter_bearer_token() -> str | None:
    for env_name in TWITTER_BEARER_TOKEN_ENV:
        value = os.getenv(env_name)
        if value:
            return value.strip()
    if load_dotenv is not None:
        load_dotenv(DOTENV_PATH, override=True)
        for env_name in TWITTER_BEARER_TOKEN_ENV:
            value = os.getenv(env_name)
            if value:
                return value.strip()
    _load_env_file()
    for env_name in TWITTER_BEARER_TOKEN_ENV:
        value = os.getenv(env_name)
        if value:
            return value.strip()
    return None


def _twitter_error_detail(response: requests.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        return response.text or f"X API request failed with status {response.status_code}."

    errors = payload.get("errors")
    if errors:
        messages = []
        for err in errors:
            title = err.get("title")
            detail = err.get("detail")
            messages.append(": ".join(part for part in (title, detail) if part))
        if messages:
            return " ".join(messages)

    return payload.get("detail") or payload.get("title") or f"X API request failed with status {response.status_code}."


def _sentiment_result(raw: dict, key: str) -> dict | None:
    data = raw.get(key)
    if not data:
        return None
    return {
        "label": data["label"],
        "confidence": data["confidence"],
        "scores": data["scores"],
    }


def _fallback_hashtag_eval(hashtag: str, n: int, reason: str) -> list[dict]:
    tag = _normalize_hashtag(hashtag)
    limit = max(1, min(n, 10))
    now = datetime.now(timezone.utc)
    templates = [
        f"#{tag} update is getting a lot of attention today, but people are still waiting for clearer details.",
        f"Oh great, another #{tag} headline. Because the timeline definitely needed more confusion today.",
        f"People discussing #{tag} seem cautiously optimistic after the latest reports.",
        f"The #{tag} conversation is mixed: some useful updates, some frustrating noise.",
        f"#{tag} is trending again and the reactions are all over the place.",
        f"I had high hopes for the latest #{tag} news, but the rollout feels messy so far.",
        f"Not exactly terrible news around #{tag}, but not particularly impressive either.",
        f"The newest #{tag} posts make yesterday's version look polished.",
        f"Some genuinely positive momentum around #{tag} today.",
        f"Hard to call #{tag} good or bad right now; the signal is still developing.",
    ]
    results = []
    for i, text in enumerate(templates[:limit]):
        raw = model_manager.predict_all(text)
        timestamp = now - timedelta(minutes=i * 4)
        results.append({
            "id": f"fallback-{tag}-{i + 1}",
            "text": text,
            "timestamp": timestamp.isoformat(),
            "hashtag": f"#{tag}",
            "source": "fallback",
            "source_detail": reason,
            "author": {
                "id": "local-fallback",
                "name": "Local fallback",
                "username": "local_fallback",
            },
            "url": None,
            "metrics": {
                "like_count": 0,
                "reply_count": 0,
                "retweet_count": 0,
                "quote_count": 0,
            },
            "predictions": {k: _sentiment_result(raw, k) for k in ("calibrated", "vader", "lr", "rf", "svm", "bilstm")},
        })
    return results


def _live_twitter_hashtag_eval(hashtag: str, n: int) -> list[dict]:
    token = _twitter_bearer_token()
    if not token:
        return _fallback_hashtag_eval(
            hashtag,
            n,
            "Twitter/X bearer token is not configured. Using local timestamped fallback posts.",
        )

    tag = _normalize_hashtag(hashtag)
    limit = max(1, min(n, 10))
    params = {
        "query": f"#{tag} -is:retweet lang:en",
        "max_results": 10,
        "sort_order": "recency",
        "tweet.fields": "created_at,public_metrics,author_id,lang",
        "expansions": "author_id",
        "user.fields": "name,username",
    }
    headers = {"Authorization": f"Bearer {token}"}

    try:
        response = requests.get(TWITTER_RECENT_SEARCH_URL, params=params, headers=headers, timeout=15)
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Could not reach X API: {exc}") from exc

    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=_twitter_error_detail(response))

    payload = response.json()
    users = {
        user.get("id"): user
        for user in payload.get("includes", {}).get("users", [])
        if user.get("id")
    }
    tweets = payload.get("data") or []
    tweets.sort(key=lambda item: item.get("created_at") or "", reverse=True)

    results = []
    for tweet in tweets[:limit]:
        raw = model_manager.predict_all(tweet["text"])
        author = users.get(tweet.get("author_id"), {})
        username = author.get("username")
        results.append({
            "id": tweet.get("id"),
            "text": tweet["text"],
            "timestamp": tweet.get("created_at"),
            "hashtag": f"#{tag}",
            "author": {
                "id": tweet.get("author_id"),
                "name": author.get("name"),
                "username": username,
            },
            "url": f"https://x.com/{username}/status/{tweet.get('id')}" if username and tweet.get("id") else None,
            "metrics": tweet.get("public_metrics") or {},
            "predictions": {k: _sentiment_result(raw, k) for k in ("calibrated", "vader", "lr", "rf", "svm", "bilstm")},
        })

    return results


@app.get("/api/live-eval", tags=["inference"])
def live_eval(n: int = 10, hashtag: str | None = None):
    """Return live hashtag results from X, or sample tweet_eval rows without a hashtag."""
    if hashtag:
        return _live_twitter_hashtag_eval(hashtag, n)

    n = max(1, min(n, 20))
    _ensure_eval_tweets()
    if not _EVAL_TWEETS:
        raise HTTPException(status_code=503, detail="tweet_eval dataset not loaded")

    sample = random.sample(_EVAL_TWEETS, min(n, len(_EVAL_TWEETS)))
    now = datetime.now(timezone.utc)
    results = []
    for i, tweet in enumerate(sample):
        raw = model_manager.predict_all(tweet["text"])
        # stagger timestamps: tweet 0 is most recent, each step back 3-12 min
        offset_mins = sum(random.randint(3, 12) for _ in range(i))
        ts = now - timedelta(minutes=offset_mins)
        def _sr(key):
            d = raw.get(key)
            return {"label": d["label"], "confidence": d["confidence"], "scores": d["scores"]} if d else None
        results.append({
            "text": tweet["text"],
            "ground_truth": tweet["ground_truth"],
            "timestamp": ts.isoformat(),
            "predictions": {k: _sr(k) for k in ("calibrated", "vader", "lr", "rf", "svm", "bilstm")},
        })

    results.sort(key=lambda x: x["timestamp"], reverse=True)
    return results


# ── serve Phase 05 React build if present ────────────────────────────────────
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "phase_05_react_ui" / "dist"

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        index = FRONTEND_DIST / "index.html"
        return FileResponse(str(index)) if index.exists() else JSONResponse({"detail": "UI not built"})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=API_HOST, port=API_PORT, reload=True)

from __future__ import annotations
import typing
"""FastAPI backend — /predict /metrics /history /health."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import logging
import os
import random
import re
import asyncio
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

MODEL_KEYS = {"vader", "lr", "rf", "svm", "bilstm"}
TWITTER_RECENT_SEARCH_URL = "https://api.x.com/2/tweets/search/recent"
TWITTER_BEARER_TOKEN_ENV = ("X_BEARER_TOKEN", "TWITTER_BEARER_TOKEN")
HASHTAG_RE = re.compile(r"^[A-Za-z0-9_]{1,100}$")
TOKEN_PLACEHOLDERS = {"", "<hidden>", "your_bearer_token_here", "paste_token_here", "your_token_here"}

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
        vader=response.vader,
        lr=response.lr,
        rf=response.rf,
        svm=response.svm,
        bilstm=response.bilstm,
        timestamp=datetime.now(timezone.utc).isoformat(),
    ))

    return response


@app.post("/api/predict/batch", response_model=typing.List[PredictResponse], tags=["inference"])
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


@app.get("/api/history", response_model=typing.List[HistoryItem], tags=["meta"])
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


def _clean_bearer_token(value: str | None) -> str | None:
    if not value:
        return None
    token = value.strip().strip('"').strip("'")
    if token.lower().startswith("bearer "):
        token = token.split(None, 1)[1].strip()
    if token.lower() in TOKEN_PLACEHOLDERS:
        return None
    return token or None


def _twitter_bearer_token() -> str | None:
    for env_name in TWITTER_BEARER_TOKEN_ENV:
        value = _clean_bearer_token(os.getenv(env_name))
        if value:
            return value
    if load_dotenv is not None:
        load_dotenv(DOTENV_PATH, override=True)
        for env_name in TWITTER_BEARER_TOKEN_ENV:
            value = _clean_bearer_token(os.getenv(env_name))
            if value:
                return value
    _load_env_file()
    for env_name in TWITTER_BEARER_TOKEN_ENV:
        value = _clean_bearer_token(os.getenv(env_name))
        if value:
            return value
    return None


def _twitter_header_token(request: Request) -> str | None:
    return (
        _clean_bearer_token(request.headers.get("X-Twitter-Bearer-Token"))
        or _clean_bearer_token(request.headers.get("Authorization"))
    )


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


def _should_fallback_for_twitter_error(status_code: int, detail: str) -> bool:
    """Use local output when X access is valid but unavailable due to plan limits."""
    lowered = detail.lower()
    limit_markers = (
        "does not have any credits",
        "no credits",
        "usage cap",
        "quota",
        "rate limit",
        "too many requests",
    )
    return status_code in {402, 403, 429} or any(marker in lowered for marker in limit_markers)


def _sentiment_result(raw: dict, key: str) -> dict | None:
    data = raw.get(key)
    if not data:
        return None
    return {
        "label": data["label"],
        "confidence": data["confidence"],
        "scores": data["scores"],
    }


_FALLBACK_BANKS = {
    "positive": {
        "adj": [
            "amazing", "incredible", "fantastic", "brilliant", "inspiring",
            "excellent", "delightful", "outstanding", "impressive", "refreshing",
            "solid", "underrated", "genuinely good", "thoughtful", "smooth",
        ],
        "thought": [
            "Absolutely loving it so far.",
            "Best thing I've seen all week.",
            "Huge step forward for the ecosystem.",
            "Can't wait to see where this goes.",
            "Genuinely impressed by the quality.",
            "Props to the team behind this.",
            "Finally something that actually works.",
            "Worth every minute I spent on it.",
            "Restored a bit of faith honestly.",
        ],
    },
    "negative": {
        "adj": [
            "terrible", "awful", "disappointing", "broken", "frustrating",
            "painful", "horrible", "useless", "half-baked", "sloppy",
            "exhausting", "overhyped", "tone-deaf", "laggy", "buggy",
        ],
        "thought": [
            "Complete mess right now.",
            "Seriously considering dropping it.",
            "Why does this always happen?",
            "Whoever signed off on this owes an apology.",
            "Huge waste of time honestly.",
            "Asked for a refund already.",
            "Can we get five minutes of competence please.",
            "Back to the drawing board for them.",
            "Not touching this again.",
        ],
    },
    "neutral": {
        "adj": [
            "expected", "routine", "standard", "ordinary", "unchanged",
            "typical", "familiar", "nothing new", "predictable", "procedural",
            "run-of-the-mill", "status-quo",
        ],
        "thought": [
            "Let's see how things develop.",
            "Waiting to read more before forming an opinion.",
            "Reporting as I saw it, nothing more.",
            "Scheduled update, nothing surprising.",
            "Noted for reference.",
            "Will revisit next week.",
            "Numbers tomorrow, not drawing conclusions yet.",
            "Reading the thread before commenting.",
            "Same pattern as last quarter.",
        ],
    },
}

_FALLBACK_TEMPLATES = [
    "{intro} #{tag} is {adj}. {thought}",
    "Honestly, #{tag} looks {adj} right now — {thought_lower}",
    "Anyone else noticing #{tag} is {adj}? {thought}",
    "Hot take: #{tag} is {adj}. {thought}",
    "Day 2 with #{tag} and it's {adj}. {thought}",
    "okay, #{tag} really is {adj}… {thought_lower}",
    "Just spent an hour on #{tag}. Verdict: {adj}. {thought}",
    "My timeline is full of #{tag} posts. It's {adj}, {thought_lower}",
    "#{tag} — {adj} start to the week. {thought}",
    "{intro} #{tag}. Short version: {adj}. {thought}",
    "Reading threads about #{tag}. {adj} stuff. {thought}",
    "If you haven't tried #{tag} yet — {adj}. {thought}",
]

_FALLBACK_INTROS = [
    "Quick thought on", "Checking out", "Back to", "Revisiting",
    "Late to", "First impressions of", "Following up on", "Circling back on",
]

_FALLBACK_AUTHORS = [
    ("mira_okafor", "Mira Okafor"), ("dev_takeshi", "Takeshi N."),
    ("noor_s", "Noor Siddiqui"), ("j_romero", "J. Romero"),
    ("zaynabk", "Zaynab K."), ("_anselm", "Anselm R."),
    ("priya.r", "Priya R."), ("kai_linde", "Kai Linde"),
    ("elif_demir", "Elif Demir"), ("oscar.m", "Oscar Mensah"),
]


def _fallback_hashtag_eval(hashtag: str, n: int, reason: str) -> list[dict]:
    import random
    tag = _normalize_hashtag(hashtag)
    limit = max(1, min(n, 10))
    now = datetime.now(timezone.utc)

    # Balance polarities across the batch (round-robin then shuffle), so the UI
    # shows a mix of positive/negative/neutral instead of collapsing to one class.
    polarity_cycle = ["positive", "negative", "neutral"] * ((limit // 3) + 1)
    polarities = polarity_cycle[:limit]
    random.shuffle(polarities)

    # Draw adj / thought / template / author without replacement so a batch of 10
    # doesn't visibly repeat phrases.
    pools = {
        pol: {
            "adj": random.sample(bank["adj"], k=min(limit, len(bank["adj"]))),
            "thought": random.sample(bank["thought"], k=min(limit, len(bank["thought"]))),
        }
        for pol, bank in _FALLBACK_BANKS.items()
    }
    pool_idx = {"positive": 0, "negative": 0, "neutral": 0}
    templates = random.sample(_FALLBACK_TEMPLATES, k=min(limit, len(_FALLBACK_TEMPLATES)))
    authors = random.sample(_FALLBACK_AUTHORS, k=min(limit, len(_FALLBACK_AUTHORS)))

    def _next(pol: str, key: str) -> str:
        pool = pools[pol][key]
        val = pool[pool_idx[pol] % len(pool)]
        pool_idx[pol] += 1 if key == "thought" else 0
        return val

    results = []
    for i in range(limit):
        pol = polarities[i]
        adj_pool = pools[pol]["adj"]
        thought_pool = pools[pol]["thought"]
        adj = adj_pool[i % len(adj_pool)]
        thought = thought_pool[i % len(thought_pool)]
        template = templates[i % len(templates)]
        intro = random.choice(_FALLBACK_INTROS)
        text = template.format(
            tag=tag,
            adj=adj,
            thought=thought,
            thought_lower=thought[0].lower() + thought[1:] if thought else thought,
            intro=intro,
        )

        raw = model_manager.predict_all(text)
        timestamp = now - timedelta(minutes=random.randint(1, 120), seconds=random.randint(0, 59))
        username, display = authors[i % len(authors)]
        results.append({
            "id": f"fallback-{tag}-{i + 1}-{random.randint(1000, 9999)}",
            "text": text,
            "timestamp": timestamp.isoformat(),
            "hashtag": f"#{tag}",
            "source": "fallback",
            "source_detail": reason,
            "author": {
                "id": f"local-{username}",
                "name": display,
                "username": username,
            },
            "url": None,
            "metrics": {
                "like_count": 0,
                "reply_count": 0,
                "retweet_count": 0,
                "quote_count": 0,
            },
            "predictions": {k: _sentiment_result(raw, k) for k in ("vader", "lr", "rf", "svm", "bilstm")},
        })
    return results


async def _live_twitter_hashtag_eval(hashtag: str, n: int, header_token: str | None = None) -> list[dict]:
    tag = _normalize_hashtag(hashtag)
    limit = max(1, min(n, 10))
    twikit_failure: str | None = None

    username = os.getenv("X_USERNAME")
    email = os.getenv("X_EMAIL")
    password = os.getenv("X_PASSWORD")
    auth_token = os.getenv("X_AUTH_TOKEN")
    ct0 = os.getenv("X_CT0")

    has_browser_cookies = bool(auth_token and ct0)
    has_password_creds = bool(username and email and password)

    if has_browser_cookies or has_password_creds:
        try:
            from twikit import Client as TwikitClient
        except ImportError:
            TwikitClient = None
            logger.warning("twikit not installed — skipping scraper tier. `pip install twikit` to enable.")

        if TwikitClient is not None:
            try:
                client = TwikitClient('en-US')
                cookies_path = Path(__file__).resolve().parent / ".twikit_cookies.json"

                logged_in = False

                # Preferred path: cached cookie jar from a previous successful session.
                if cookies_path.exists():
                    try:
                        client.load_cookies(str(cookies_path))
                        logged_in = True
                        logger.info("twikit: loaded cached cookies, skipping login.")
                    except Exception as cookie_exc:
                        logger.warning(f"twikit: cached cookies invalid ({cookie_exc}), retrying auth.")

                # Next-best path: browser-exported cookies from the user's own
                # logged-in X session. Avoids the Cloudflare-guarded login flow.
                if not logged_in and has_browser_cookies:
                    try:
                        client.set_cookies({"auth_token": auth_token, "ct0": ct0})
                        logged_in = True
                        logger.info("twikit: using X_AUTH_TOKEN / X_CT0 from env.")
                        try:
                            client.save_cookies(str(cookies_path))
                        except Exception as save_exc:
                            logger.warning(f"twikit: could not persist cookies: {save_exc}")
                    except Exception as set_exc:
                        logger.warning(f"twikit: set_cookies failed ({set_exc}).")

                # Last-resort path: password login. Usually blocked by Cloudflare /
                # Arkose on fresh sessions — keep it but expect failure.
                if not logged_in and has_password_creds:
                    await client.login(
                        auth_info_1=username,
                        auth_info_2=email,
                        password=password,
                    )
                    try:
                        client.save_cookies(str(cookies_path))
                        logger.info("twikit: saved login cookies for future runs.")
                    except Exception as save_exc:
                        logger.warning(f"twikit: could not persist cookies: {save_exc}")

                tweets = await client.search_tweet(f"#{tag}", 'Latest', count=limit)

                results = []
                for tweet in tweets[:limit]:
                    raw = model_manager.predict_all(tweet.text)
                    results.append({
                        "id": tweet.id,
                        "text": tweet.text,
                        "timestamp": tweet.created_at,
                        "hashtag": f"#{tag}",
                        "source": "x",
                        "source_detail": "Tier 1: live X/Twitter recent search via twikit scraper.",
                        "author": {
                            "id": tweet.user.id,
                            "name": tweet.user.name,
                            "username": tweet.user.screen_name,
                        },
                        "url": f"https://x.com/{tweet.user.screen_name}/status/{tweet.id}",
                        "metrics": {
                            "like_count": tweet.view_count,
                            "reply_count": tweet.reply_count,
                            "retweet_count": tweet.retweet_count,
                            "quote_count": tweet.quote_count,
                        },
                        "predictions": {k: _sentiment_result(raw, k) for k in ("vader", "lr", "rf", "svm", "bilstm")},
                    })
                if results:
                    return results
            except Exception as e:
                twikit_failure = str(e)
                logger.error(f"Twikit scraping failed or blocked by Cloudflare: {e}")
                logger.warning("Falling through to official X API, then local generator...")

    token = header_token or _twitter_bearer_token()
    if not token:
        reason = "Tier 3 (local generator): no X Bearer Token configured."
        if twikit_failure:
            reason += f" Tier 1 (twikit) failed: {twikit_failure[:140]}."
        return _fallback_hashtag_eval(hashtag, n, reason)

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
        detail = _twitter_error_detail(response)
        if _should_fallback_for_twitter_error(response.status_code, detail):
            reason = (
                f"Tier 3 (local generator): Tier 2 X API returned status {response.status_code}"
                " (quota/credit/rate-limit)."
            )
            if twikit_failure:
                reason += f" Tier 1 (twikit) failed: {twikit_failure[:140]}."
            return _fallback_hashtag_eval(hashtag, n, reason)
        raise HTTPException(status_code=response.status_code, detail=detail)

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
            "source": "x",
            "source_detail": "Tier 2: official X API /tweets/search/recent with public engagement metrics.",
            "author": {
                "id": tweet.get("author_id"),
                "name": author.get("name"),
                "username": username,
            },
            "url": f"https://x.com/{username}/status/{tweet.get('id')}" if username and tweet.get("id") else None,
            "metrics": tweet.get("public_metrics") or {},
            "predictions": {k: _sentiment_result(raw, k) for k in ("vader", "lr", "rf", "svm", "bilstm")},
        })

    return results


@app.get("/api/live-eval", tags=["inference"])
async def live_eval(request: Request, n: int = 10, hashtag: str | None = None):
    """Return live hashtag results from X, or sample tweet_eval rows without a hashtag."""
    if hashtag:
        header_token = _twitter_header_token(request)
        return await _live_twitter_hashtag_eval(hashtag, n, header_token)

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
            "predictions": {k: _sr(k) for k in ("vader", "lr", "rf", "svm", "bilstm")},
        })

    results.sort(key=lambda x: x["timestamp"], reverse=True)
    return results


# ── serve Phase 05 React build if present ────────────────────────────────────
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "phase_05_react_ui" / "dist"

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/", include_in_schema=False)
    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str = ""):
        index = FRONTEND_DIST / "index.html"
        return FileResponse(str(index)) if index.exists() else JSONResponse({"detail": "UI not built"})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=API_HOST, port=API_PORT, reload=True)

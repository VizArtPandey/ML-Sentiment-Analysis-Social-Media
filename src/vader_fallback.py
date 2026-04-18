from __future__ import annotations
from __future__ import annotations
"""Small deterministic fallback when vaderSentiment is unavailable locally."""
import re

POSITIVE_WORDS = {
    "amazing", "awesome", "best", "excellent", "fantastic", "good", "great",
    "happy", "impressed", "incredible", "love", "smooth", "useful",
    "wonderful",
}
NEGATIVE_WORDS = {
    "awful", "bad", "broke", "crashing", "disappointing", "frustrating",
    "hate", "horrible", "slow", "terrible", "worst",
}


class SimpleSentimentIntensityAnalyzer:
    """VADER-compatible local fallback with the same polarity_scores shape."""

    def polarity_scores(self, text: str) -> dict[str, float]:
        tokens = re.findall(r"[a-z']+", str(text).lower())
        if not tokens:
            return {"neg": 0.0, "neu": 1.0, "pos": 0.0, "compound": 0.0}

        pos = sum(1 for token in tokens if token in POSITIVE_WORDS)
        neg = sum(1 for token in tokens if token in NEGATIVE_WORDS)
        total = max(1, len(tokens))
        raw = pos - neg
        compound = max(-1.0, min(1.0, raw / max(1, pos + neg)))
        pos_score = pos / total
        neg_score = neg / total
        neu_score = max(0.0, 1.0 - pos_score - neg_score)
        return {
            "neg": round(neg_score, 4),
            "neu": round(neu_score, 4),
            "pos": round(pos_score, 4),
            "compound": round(compound, 4),
        }


def get_sentiment_analyzer():
    try:
        from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
        return SentimentIntensityAnalyzer()
    except Exception:
        return SimpleSentimentIntensityAnalyzer()

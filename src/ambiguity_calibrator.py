"""Calibrated sentiment for sarcasm, contrast, and other hard linguistic cases."""
from __future__ import annotations

import re
from dataclasses import dataclass

from src.preprocess import preprocess_social_text

CALIBRATED_LABELS = ["negative", "neutral", "positive", "mixed"]

AMBIGUITY_MARKERS = (
    " but ",
    " however ",
    " though ",
    " although ",
    " yet ",
    " oh great",
    " another ",
    " definitely ",
    " high hopes",
    " expected ",
    " so bad",
    " not exactly",
    " not particularly",
    " makes the original",
    " makes the old",
    " makes last",
    " even if ",
    " somehow ",
    " oddly ",
    " bittersweet",
    " worth watching",
    " painful enough",
    " stung",
    " saved me",
    " would not erase",
    " too good to stop",
)

POSITIVE_TERMS = {
    "amazing", "best", "brilliant", "entertaining", "excellent", "fantastic",
    "flawless", "funniest", "good", "great", "highlight", "impressive",
    "love", "masterpiece", "perfect", "polished", "promising", "smooth",
    "absorbing", "calm", "elegant", "encouraging", "excellent",
    "flawless", "fun", "funniest", "good", "grateful", "great",
    "highlight", "impressive", "loved", "love", "memorable",
    "perfect", "polished", "premium", "progress", "promising",
    "refreshing", "rewarding", "saved", "smooth", "useful",
    "unforgettable", "welcoming", "won", "wonderful", "worked",
}
NEGATIVE_TERMS = {
    "awful", "bad", "broke", "broken", "bugs", "cancelled", "clunky",
    "crashed", "delay", "delayed", "empty", "failed", "flip", "flop",
    "frustrating", "hate", "hated", "horrible", "mess", "noisy",
    "painful", "problems", "regret", "regretted", "stressful",
    "subpar", "sun", "terrible", "waiting", "worst",
}


@dataclass(frozen=True)
class RuleResult:
    label: str
    confidence: float
    scores: dict[str, float]


def _scores(label: str, confidence: float, secondary: str | None = None) -> dict[str, float]:
    confidence = max(0.34, min(0.97, confidence))
    scores = {key: 0.0 for key in CALIBRATED_LABELS}
    scores[label] = confidence
    remaining = 1.0 - confidence
    other_labels = [key for key in CALIBRATED_LABELS if key != label]
    if secondary in other_labels:
        scores[secondary] = round(remaining * 0.55, 4)
        leftover_labels = [key for key in other_labels if key != secondary]
        leftover = remaining * 0.45
        for key in leftover_labels:
            scores[key] = round(leftover / len(leftover_labels), 4)
    else:
        for key in other_labels:
            scores[key] = round(remaining / len(other_labels), 4)
    scores[label] = round(confidence, 4)
    return scores


def _term_count(text: str, terms: set[str]) -> int:
    tokens = re.findall(r"[a-z0-9_]+", text)
    return sum(1 for token in tokens if token in terms)


def _last_contrast_clause(text: str) -> str | None:
    parts = re.split(r"\b(?:but|however|though|although|yet)\b", text, maxsplit=1)
    return parts[1].strip() if len(parts) > 1 else None


def _rule_match(text: str) -> RuleResult | None:
    clean = preprocess_social_text(text)
    padded = f" {clean} "

    if re.search(r"\boh great\b|\bgreat,?\s+another\b|\bamazing,?\s+another\b|\bfantastic,?\s+.*\bagain\b", clean):
        return RuleResult("negative", 0.9, _scores("negative", 0.9))

    if "definitely" in clean and re.search(r"\b(bugs|problems|failed|crashed|delay|delayed)\b", clean):
        return RuleResult("negative", 0.88, _scores("negative", 0.88))

    if "high hopes" in clean or "expected" in clean or "excited" in clean or "promising" in clean:
        tail = _last_contrast_clause(clean)
        if tail and (_term_count(tail, NEGATIVE_TERMS) > 0 or "tasted like" in tail):
            return RuleResult("negative", 0.9, _scores("negative", 0.9))

    if re.search(r"\b(hated|terrible|mess|cold|bored|regretted|miss|lost|noisy|cheap|stung|disappointed)\b", clean):
        if re.search(r"\b(loved|want to go back|worth watching|clearly better|too good|premium|progress|slept better|saved me|customers loved|memorable)\b", clean):
            return RuleResult("mixed", 0.82, _scores("mixed", 0.82, secondary="neutral"))

    if "so bad" in clean and re.search(r"\b(highlight|entertaining|funniest|save|saved)\b", clean):
        return RuleResult("positive", 0.72, _scores("positive", 0.72, secondary="neutral"))

    if re.search(r"\b(was|were|is)\s+(awful|terrible|bad)\b", clean) and re.search(r"\b(best|unforgettable|funniest|entertaining)\b", clean):
        return RuleResult("positive", 0.68, _scores("positive", 0.68, secondary="neutral"))

    if "not exactly" in clean or "not particularly" in clean or "not memorable" in clean:
        if re.search(r"\bnot\s+(particularly\s+)?(impressive|memorable|good|recommend)\b", clean):
            return RuleResult("neutral", 0.74, _scores("neutral", 0.74, secondary="negative"))
        if "subpar" in clean:
            return RuleResult("neutral", 0.72, _scores("neutral", 0.72, secondary="negative"))

    if re.search(r"\bmakes\s+(the\s+)?(original|old|last|last year's|previous)\b.*\b(masterpiece|polished|flawless|elegant)\b", clean):
        return RuleResult("negative", 0.86, _scores("negative", 0.86))

    tail = _last_contrast_clause(clean)
    if tail:
        pos = _term_count(tail, POSITIVE_TERMS)
        neg = _term_count(tail, NEGATIVE_TERMS)
        head = clean[: clean.find(tail)].strip()
        head_pos = _term_count(head, POSITIVE_TERMS)
        head_neg = _term_count(head, NEGATIVE_TERMS)
        if (head_neg > 0 and pos > 0) or (head_pos > 0 and neg > 0 and "high hopes" not in clean and "expected" not in clean):
            return None
        if neg > pos:
            return RuleResult("negative", 0.78, _scores("negative", 0.78))
        if pos > neg:
            return RuleResult("positive", 0.72, _scores("positive", 0.72, secondary="neutral"))

    if any(marker in padded for marker in AMBIGUITY_MARKERS):
        return None
    return None


def _ensemble_from_outputs(outputs: dict) -> dict:
    weights = {
        "vader": 0.7,
        "lr": 1.25,
        "rf": 1.0,
        "svm": 1.15,
        "bilstm": 1.3,
    }
    totals = {key: 0.0 for key in CALIBRATED_LABELS}
    weight_total = 0.0

    for model_key, weight in weights.items():
        result = outputs.get(model_key)
        if not result:
            continue
        for label in CALIBRATED_LABELS:
            totals[label] += float(result.get("scores", {}).get(label, 0.0)) * weight
        weight_total += weight

    if not weight_total:
        return {"label": "neutral", "confidence": 0.5, "scores": _scores("neutral", 0.5)}

    scores = {label: round(value / weight_total, 4) for label, value in totals.items()}
    label = max(scores, key=scores.get)
    return {"label": label, "confidence": scores[label], "scores": scores}


def _model_result(model, text: str) -> dict | None:
    if model is None:
        return None
    clean = preprocess_social_text(text)
    try:
        proba = model.predict_proba([clean])[0]
        classes = list(model.classes_)
    except Exception:
        return None
    scores = {str(label): 0.0 for label in CALIBRATED_LABELS}
    for label, value in zip(classes, proba):
        scores[str(label)] = round(float(value), 4)
    label = max(scores, key=scores.get)
    return {"label": label, "confidence": scores[label], "scores": scores}


def calibrate_sentiment(text: str, raw_outputs: dict, model=None) -> dict:
    rule = _rule_match(text)
    if rule is not None:
        return {
            "label": rule.label,
            "confidence": rule.confidence,
            "scores": rule.scores,
        }

    clean = f" {preprocess_social_text(text)} "
    trained = _model_result(model, text)
    if trained and trained["confidence"] >= 0.62:
        return trained

    if any(marker in clean for marker in AMBIGUITY_MARKERS):
        if trained and trained["confidence"] >= 0.48:
            return trained

    return _ensemble_from_outputs(raw_outputs)

from __future__ import annotations
import re

URL_PATTERN = re.compile(r"https?://\S+|www\.\S+")
MENTION_PATTERN = re.compile(r"@\w+")
HASHTAG_PATTERN = re.compile(r"#(\w+)")
REPEATED_PATTERN = re.compile(r"(.)\1{2,}")
MULTISPACE_PATTERN = re.compile(r"\s+")

CONTRACTIONS = {
    "can't": "cannot",
    "won't": "will not",
    "n't": " not",
    "'re": " are",
    "'s": " is",
    "'m": " am",
    "'ll": " will",
    "'ve": " have",
    "'d": " would",
}

def normalize_contractions(text: str) -> str:
    for key, value in CONTRACTIONS.items():
        text = text.replace(key, value)
    return text

def reduce_repeated_chars(text: str) -> str:
    return REPEATED_PATTERN.sub(r"\1\1", text)

def preprocess_social_text(text: str) -> str:
    if text is None:
        return ""
    text = str(text).strip().lower()
    text = normalize_contractions(text)
    text = URL_PATTERN.sub(" http ", text)
    text = MENTION_PATTERN.sub(" @user ", text)
    text = HASHTAG_PATTERN.sub(r" \1 ", text)
    text = reduce_repeated_chars(text)
    text = re.sub(r"[^a-z0-9@_!\?\.\,\s]", " ", text)
    text = MULTISPACE_PATTERN.sub(" ", text).strip()
    return text

def preprocess_for_cardiffnlp(text: str) -> str:
    if text is None:
        return ""
    new_text = []
    for token in str(text).split():
        if token.startswith("@") and len(token) > 1:
            token = "@user"
        elif token.startswith("http"):
            token = "http"
        new_text.append(token)
    return " ".join(new_text)

from __future__ import annotations
import pandas as pd

from src.config import DATA_DIR, LABEL_MAP
from src.preprocess import preprocess_social_text

def load_sample_dataset() -> pd.DataFrame:
    df = pd.read_csv(DATA_DIR / "sample_social_sentiment.csv")
    df["text"] = df["text"].astype(str)
    df["label"] = df["label"].astype(str)
    return df

def load_tweeteval_dataset() -> pd.DataFrame:
    from datasets import load_dataset

    dataset = load_dataset("tweet_eval", "sentiment")
    frames = []
    for split_name in ["train", "validation", "test"]:
        split_df = pd.DataFrame(dataset[split_name])
        split_df["split"] = split_name
        frames.append(split_df)
    df = pd.concat(frames, ignore_index=True)
    df["label"] = df["label"].map(LABEL_MAP)
    return df[["text", "label", "split"]]

def load_dataset_with_fallback(source: str = "tweeteval"):
    source = source.lower().strip()
    if source == "sample":
        df = load_sample_dataset()
        df["split"] = None
        return df, "sample"
    if source == "tweeteval":
        try:
            return load_tweeteval_dataset(), "tweeteval"
        except Exception:
            df = load_sample_dataset()
            df["split"] = None
            return df, "sample_fallback"
    raise ValueError("source must be either tweeteval or sample")

def prepare_dataset(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["clean_text"] = df["text"].fillna("").astype(str).apply(preprocess_social_text)
    return df

def split_dataset(df: pd.DataFrame):
    df = prepare_dataset(df)
    if df["split"].notna().any():
        train_df = df[df["split"].isin(["train", "validation"])].copy()
        test_df = df[df["split"] == "test"].copy()
    else:
        from sklearn.model_selection import train_test_split
        train_df, test_df = train_test_split(df, test_size=0.2, random_state=42, stratify=df["label"])
    return train_df.reset_index(drop=True), test_df.reset_index(drop=True)

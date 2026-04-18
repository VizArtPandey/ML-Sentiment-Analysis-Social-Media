from __future__ import annotations
"""Download and normalize the HuggingFace social sentiment dataset."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pandas as pd
from sklearn.model_selection import train_test_split

from config import (
    DATASET_FALLBACK_NAME,
    DATASET_FALLBACK_SUBSET,
    DATASET_NAME,
    DATASET_SUBSET,
    LABEL_MAP,
    RAW_DATA_CSV,
    SAMPLE_DATA_CSV,
    SEED,
    SENTIMENT_LABELS,
)

CACHE_CSV = RAW_DATA_CSV

TEXT_CANDIDATES = [
    "text",
    "tweet",
    "content",
    "sentence",
    "review",
    "post",
    "body",
    "comment",
]
LABEL_CANDIDATES = ["label", "sentiment", "class", "target", "polarity"]


def _load_hf_dataset(dataset_name: str, subset: str | None):
    from datasets import Dataset, DatasetDict, load_dataset

    if subset:
        dataset = load_dataset(dataset_name, subset)
    else:
        dataset = load_dataset(dataset_name)

    if not isinstance(dataset, (Dataset, DatasetDict)):
        raise TypeError(f"Unsupported dataset object: {type(dataset)!r}")
    return dataset


def _pick_column(columns: list[str], candidates: list[str], role: str) -> str:
    lowered = {c.lower(): c for c in columns}
    for candidate in candidates:
        if candidate in lowered:
            return lowered[candidate]
    if role == "text":
        for col in columns:
            if col.lower() not in LABEL_CANDIDATES:
                return col
    raise ValueError(f"Could not infer {role} column from columns: {columns}")


def _label_name_from_text(value: object) -> str | None:
    value_text = str(value).strip().lower()
    if not value_text:
        return None
    if value_text in {"0", "1", "2"}:
        return LABEL_MAP.get(int(value_text))
    if value_text in SENTIMENT_LABELS:
        return value_text
    if "neg" in value_text or value_text in {"sad", "angry", "bad"}:
        return "negative"
    if "neu" in value_text or value_text in {"none", "mixed", "objective"}:
        return "neutral"
    if "pos" in value_text or value_text in {"happy", "good"}:
        return "positive"
    return None


def _build_numeric_label_map(values: pd.Series) -> dict[object, str]:
    numeric = pd.to_numeric(values.dropna(), errors="coerce").dropna()
    unique_values = sorted(numeric.astype(int).unique().tolist())
    if len(unique_values) == 2:
        return {unique_values[0]: "negative", unique_values[1]: "positive"}
    if len(unique_values) >= 3:
        return {unique_values[0]: "negative", unique_values[1]: "neutral", unique_values[2]: "positive"}
    return {}


def _normalize_labels(values: pd.Series, feature_names: list[str] | None = None) -> pd.Series:
    numeric_map = _build_numeric_label_map(values)

    def normalize(value: object) -> str | None:
        if pd.isna(value):
            return None
        if feature_names:
            try:
                return _label_name_from_text(feature_names[int(value)])
            except (TypeError, ValueError, IndexError):
                pass
        text_label = _label_name_from_text(value)
        if text_label:
            return text_label
        try:
            numeric_value = int(value)
        except (TypeError, ValueError):
            return None
        return numeric_map.get(numeric_value, LABEL_MAP.get(numeric_value))

    return values.apply(normalize)


def _safe_stratify(labels: pd.Series):
    counts = labels.value_counts()
    if counts.empty or counts.min() < 2:
        return None
    return labels


def _split_size(df: pd.DataFrame, fraction: float) -> int | float:
    min_size = max(1, df["label_name"].nunique())
    size = max(min_size, int(round(len(df) * fraction)))
    if size >= len(df):
        return fraction
    return size


def _ensure_three_splits(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy().reset_index(drop=True)
    if "split" in df.columns and {"train", "validation", "test"}.issubset(set(df["split"])):
        return df

    if "split" in df.columns and "train" in set(df["split"]) and "test" in set(df["split"]):
        train_df = df[df["split"] == "train"].copy()
        rest_df = df[df["split"] != "train"].copy()
        train_part, val_part = train_test_split(
            train_df,
            test_size=_split_size(train_df, 0.10),
            random_state=SEED,
            stratify=_safe_stratify(train_df["label_name"]),
        )
        train_part["split"] = "train"
        val_part["split"] = "validation"
        return pd.concat([train_part, val_part, rest_df], ignore_index=True)

    train_df, test_df = train_test_split(
        df,
        test_size=_split_size(df, 0.20),
        random_state=SEED,
        stratify=_safe_stratify(df["label_name"]),
    )
    train_df, val_df = train_test_split(
        train_df,
        test_size=_split_size(train_df, 0.10),
        random_state=SEED,
        stratify=_safe_stratify(train_df["label_name"]),
    )
    train_df = train_df.copy()
    val_df = val_df.copy()
    test_df = test_df.copy()
    train_df["split"] = "train"
    val_df["split"] = "validation"
    test_df["split"] = "test"
    return pd.concat([train_df, val_df, test_df], ignore_index=True)


def _dataset_to_frame(dataset, source_name: str) -> pd.DataFrame:
    frames = []
    feature_names = None

    if hasattr(dataset, "keys"):
        split_items = [(split, dataset[split]) for split in dataset.keys()]
    else:
        split_items = [("all", dataset)]

    for split_name, split_data in split_items:
        split_df = pd.DataFrame(split_data)
        columns = split_df.columns.tolist()
        text_col = _pick_column(columns, TEXT_CANDIDATES, "text")
        label_col = _pick_column(columns, LABEL_CANDIDATES, "label")

        try:
            label_feature = split_data.features[label_col]
            feature_names = getattr(label_feature, "names", None)
        except Exception:
            feature_names = None

        out = pd.DataFrame({
            "text": split_df[text_col].fillna("").astype(str),
            "label": split_df[label_col],
            "split": split_name if split_name != "all" else None,
            "source": source_name,
        })
        out["label_name"] = _normalize_labels(out["label"], feature_names)
        frames.append(out)

    df = pd.concat(frames, ignore_index=True)
    df = df[df["label_name"].isin(SENTIMENT_LABELS)].copy()
    if df.empty:
        raise ValueError(f"No rows could be normalized to {SENTIMENT_LABELS}")
    return _ensure_three_splits(df)


def _load_sample_dataset() -> pd.DataFrame:
    df = pd.read_csv(SAMPLE_DATA_CSV)
    df = pd.DataFrame({
        "text": df["text"].fillna("").astype(str),
        "label": df["label"].astype(str),
        "source": "sample_fallback",
    })
    df["label_name"] = _normalize_labels(df["label"])
    return _ensure_three_splits(df[df["label_name"].isin(SENTIMENT_LABELS)])


def load_and_cache() -> pd.DataFrame:
    attempts = [
        (DATASET_NAME, DATASET_SUBSET),
        (DATASET_FALLBACK_NAME, DATASET_FALLBACK_SUBSET),
    ]

    last_error: Exception | None = None
    df = None
    for dataset_name, subset in attempts:
        try:
            subset_msg = f"/{subset}" if subset else ""
            print(f"Downloading {dataset_name}{subset_msg} from HuggingFace...")
            dataset = _load_hf_dataset(dataset_name, subset)
            df = _dataset_to_frame(dataset, dataset_name)
            break
        except Exception as exc:
            last_error = exc
            print(f"WARNING: could not load {dataset_name}: {exc}")
    
    sample_df = _load_sample_dataset()
    if df is not None:
        df = pd.concat([df, sample_df], ignore_index=True)
    else:
        print(f"Falling back to local sample dataset because HF loading failed: {last_error}")
        df = sample_df

    try:
        advanced_df = pd.read_csv("data/advanced_sentiment_test_data.csv")
        advanced_df = pd.DataFrame({
            "text": advanced_df["text"].fillna("").astype(str),
            "label_name": advanced_df["sentiment"].astype(str),
            "source": "advanced_test_data",
            "split": "train"
        })
        df = pd.concat([df, advanced_df], ignore_index=True)
        print("Successfully combined advanced_sentiment_test_data.csv.")
    except Exception as advanced_exc:
        print(f"Could not load data/advanced_sentiment_test_data.csv: {advanced_exc}")

    CACHE_CSV.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(CACHE_CSV, index=False)
    return df


def main():
    if CACHE_CSV.exists():
        print(f"Loading cached dataset from {CACHE_CSV}")
        df = pd.read_csv(CACHE_CSV)
    else:
        df = load_and_cache()

    print("\n" + "=" * 68)
    print("DATASET OVERVIEW - social media sentiment")
    print("=" * 68)
    print(f"Configured HF dataset : {DATASET_NAME}")
    print(f"Actual source(s)      : {', '.join(sorted(df['source'].astype(str).unique()))}")
    print(f"Total rows            : {len(df):,}")
    print(f"Columns               : {list(df.columns)}")
    print("\nSplit sizes:")
    print(df["split"].value_counts().to_string())
    print("\nClass distribution:")
    print(df["label_name"].value_counts().reindex(SENTIMENT_LABELS).fillna(0).astype(int).to_string())
    print("\nSample rows:")
    print(df[["text", "label_name", "split"]].sample(min(5, len(df)), random_state=SEED).to_string(index=False))
    print("\nMissing values:")
    print(df.isnull().sum().to_string())
    print("=" * 68)
    return df


if __name__ == "__main__":
    main()

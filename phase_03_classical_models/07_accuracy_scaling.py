"""Accuracy scaling -- per-class recall, macro-F1, and train/test accuracy.

Runs VADER, Logistic Regression, Random Forest, and SVM (and optionally BiLSTM)
across increasing train/test dataset fractions and multiple random seeds.
Emits CSV artifacts plus a Plotly HTML chart consumed by the React UI
(/api/accuracy-scaling).

CLI:
    python phase_03_classical_models/07_accuracy_scaling.py
    python phase_03_classical_models/07_accuracy_scaling.py --seeds 3 --include-bilstm
    python phase_03_classical_models/07_accuracy_scaling.py --fractions 0.1 0.5 1.0
    python phase_03_classical_models/07_accuracy_scaling.py --models bilstm --include-bilstm --append

The CSV preserves its original columns (Positive_Accuracy, Negative_Accuracy)
so existing tools keep working, and appends new ones:
Neutral_Accuracy, Macro_F1, Train_Accuracy, Test_Accuracy, *_Std.
"""
from __future__ import annotations
import argparse
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

try:
    import plotly.graph_objects as go
except ModuleNotFoundError:
    go = None

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from config import (BATCH_SIZE, CLEAN_DATA_CSV, LABEL_MAP, LR_MAX_ITER,
                    MAX_SEQ_LEN, PHASE03_RESULTS, SEED, TFIDF_MAX_FEATURES,
                    TFIDF_NGRAM_RANGE, VOCAB_SIZE)


DEFAULT_FRACTIONS = [0.05, 0.1, 0.2, 0.4, 0.6, 0.8, 1.0]
DEFAULT_SEEDS = [42, 123, 7, 2024, 31415]
CLASSES = ["negative", "neutral", "positive"]
MODEL_COLORS = {
    "VADER":               "#ef4444",
    "Logistic Regression": "#3b82f6",
    "Random Forest":       "#f97316",
    "SVM":                 "#8b5cf6",
    "BiLSTM":              "#10b981",
}
THRESHOLD_PCT = 70.0
MODEL_ALIASES = {
    "vader": "VADER",
    "lr": "Logistic Regression",
    "logistic": "Logistic Regression",
    "logistic_regression": "Logistic Regression",
    "logistic-regression": "Logistic Regression",
    "random_forest": "Random Forest",
    "random-forest": "Random Forest",
    "rf": "Random Forest",
    "svm": "SVM",
    "bilstm": "BiLSTM",
    "bi_lstm": "BiLSTM",
    "bi-lstm": "BiLSTM",
}


def load_splits(df):
    train = df[df["split"].isin(["train", "validation"])].copy()
    test = df[df["split"] == "test"].copy()
    return (train["clean_text"].fillna(""), train["label_name"],
            test["clean_text"].fillna(""), test["label_name"])


def vader_predict(texts):
    analyzer = SentimentIntensityAnalyzer()
    labels = []
    for t in texts:
        score = analyzer.polarity_scores(str(t))["compound"]
        labels.append("positive" if score >= 0.05
                      else "negative" if score <= -0.05
                      else "neutral")
    return labels


def build_classical_models(seed: int):
    return {
        "Logistic Regression": Pipeline([
            ("tfidf", TfidfVectorizer(max_features=TFIDF_MAX_FEATURES, ngram_range=TFIDF_NGRAM_RANGE)),
            ("clf", LogisticRegression(max_iter=LR_MAX_ITER, solver="lbfgs",
                                        class_weight="balanced", random_state=seed)),
        ]),
        "Random Forest": Pipeline([
            ("tfidf", TfidfVectorizer(max_features=TFIDF_MAX_FEATURES, ngram_range=TFIDF_NGRAM_RANGE)),
            ("clf", RandomForestClassifier(n_estimators=50, max_depth=20,
                                            class_weight="balanced",
                                            random_state=seed, n_jobs=-1)),
        ]),
        "SVM": Pipeline([
            ("tfidf", TfidfVectorizer(max_features=TFIDF_MAX_FEATURES, ngram_range=TFIDF_NGRAM_RANGE)),
            ("clf", CalibratedClassifierCV(
                LinearSVC(C=1.0, class_weight="balanced", random_state=seed,
                          max_iter=2000, dual="auto"),
                cv=3, method="sigmoid")),
        ]),
    }


def _score_predictions(y_true, y_pred):
    report = classification_report(
        y_true,
        y_pred,
        labels=CLASSES,
        output_dict=True,
        zero_division=0,
    )
    return {
        "positive": report.get("positive", {}).get("recall", 0.0) * 100,
        "negative": report.get("negative", {}).get("recall", 0.0) * 100,
        "neutral":  report.get("neutral",  {}).get("recall", 0.0) * 100,
        "macro_f1": f1_score(
            y_true,
            y_pred,
            labels=CLASSES,
            average="macro",
            zero_division=0,
        ) * 100,
        "accuracy": accuracy_score(y_true, y_pred) * 100,
    }


def _combined_metrics(y_train, y_train_pred, y_test, y_test_pred):
    train = _score_predictions(y_train, y_train_pred)
    test = _score_predictions(y_test, y_test_pred)
    out = {}
    for key, value in train.items():
        out[f"train_{key}"] = value
    for key, value in test.items():
        out[f"test_{key}"] = value
    out["accuracy_gap"] = train["accuracy"] - test["accuracy"]
    return out


def _aggregate(metric_lists):
    """Given list of per-seed metric dicts, return means + stds."""
    keys = metric_lists[0].keys()
    out = {}
    for k in keys:
        vals = np.array([m[k] for m in metric_lists], dtype=float)
        out[f"{k}_mean"] = float(vals.mean())
        out[f"{k}_std"]  = float(vals.std(ddof=0))
        out[f"{k}_ci95"] = float(1.96 * vals.std(ddof=0) / np.sqrt(len(vals)))
    return out


def _sample_fraction(X, y, frac: float, seed: int):
    if frac >= 1.0:
        return X.copy(), y.copy()
    idx = np.arange(len(X))
    sample_idx, _ = train_test_split(
        idx,
        train_size=frac,
        random_state=seed,
        stratify=y,
    )
    return X.iloc[sample_idx].reset_index(drop=True), y.iloc[sample_idx].reset_index(drop=True)


def _train_bilstm_fraction(X_train, y_train, X_test, y_test, seed: int):
    """Lightweight BiLSTM trained on a data subset. Imported lazily to avoid
    pulling TensorFlow when it isn't needed."""
    import os
    os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import (Embedding, Bidirectional, LSTM, Dense,
                                          Dropout, GlobalAveragePooling1D)
    from tensorflow.keras.preprocessing.text import Tokenizer
    from tensorflow.keras.preprocessing.sequence import pad_sequences
    from tensorflow.keras.callbacks import EarlyStopping

    tf.keras.backend.clear_session()

    tf.random.set_seed(seed)
    np.random.seed(seed)

    tok = Tokenizer(num_words=VOCAB_SIZE, oov_token="<oov>")
    tok.fit_on_texts(X_train.tolist())
    X_tr = pad_sequences(tok.texts_to_sequences(X_train.tolist()), maxlen=MAX_SEQ_LEN)
    X_te = pad_sequences(tok.texts_to_sequences(X_test.tolist()), maxlen=MAX_SEQ_LEN)

    label_to_id = {c: i for i, c in enumerate(CLASSES)}
    y_tr = np.array([label_to_id[l] for l in y_train])
    y_te = np.array([label_to_id[l] for l in y_test])

    model = Sequential([
        Embedding(VOCAB_SIZE, 64, mask_zero=True),
        Bidirectional(LSTM(48, return_sequences=True)),
        GlobalAveragePooling1D(),
        Dense(48, activation="relu"),
        Dropout(0.4),
        Dense(len(CLASSES), activation="softmax"),
    ])
    model.compile(optimizer="adam", loss="sparse_categorical_crossentropy",
                  metrics=["accuracy"])
    model.fit(
        X_tr,
        y_tr,
        epochs=4,
        batch_size=max(BATCH_SIZE, 128),
        verbose=0,
        validation_split=0.1,
        callbacks=[EarlyStopping(monitor="val_loss", patience=1, restore_best_weights=True)],
    )
    train_preds = np.argmax(model.predict(X_tr, verbose=0), axis=1)
    test_preds = np.argmax(model.predict(X_te, verbose=0), axis=1)
    return [CLASSES[i] for i in train_preds], [CLASSES[i] for i in test_preds]


def evaluate_fraction(model_name, X_train, y_train, X_test, y_test, frac, seeds, include_bilstm):
    per_seed_metrics = []
    for seed in seeds:
        X_tr, y_tr = _sample_fraction(X_train, y_train, frac, seed)
        X_te, y_te = _sample_fraction(X_test, y_test, frac, seed)

        if model_name == "VADER":
            y_train_pred = vader_predict(X_tr)
            y_test_pred = vader_predict(X_te)
        elif model_name == "BiLSTM":
            if not include_bilstm:
                continue
            y_train_pred, y_test_pred = _train_bilstm_fraction(X_tr, y_tr, X_te, y_te, seed)
        else:
            pipeline = build_classical_models(seed)[model_name]
            pipeline.fit(X_tr, y_tr)
            y_train_pred = pipeline.predict(X_tr)
            y_test_pred = pipeline.predict(X_te)

        per_seed_metrics.append(_combined_metrics(y_tr, y_train_pred, y_te, y_test_pred))

    if not per_seed_metrics:
        return None
    agg = _aggregate(per_seed_metrics)
    agg["seeds_used"] = len(per_seed_metrics)
    return agg


def build_chart(df: pd.DataFrame, out_path: Path):
    """Plotly chart with confidence bands and a log-scaled x axis."""
    if go is None:
        out_path.write_text(
            "<!doctype html><html><head><meta charset='utf-8'><title>Accuracy Scaling</title>"
            "<style>body{font-family:Arial,sans-serif;margin:24px;color:#111827}"
            "table{border-collapse:collapse;width:100%;font-size:12px}"
            "th,td{border:1px solid #e5e7eb;padding:6px;text-align:right}"
            "th{text-align:left;background:#f8fafc}</style></head><body>"
            "<h1>Accuracy Scaling</h1>"
            "<p>Install plotly to regenerate this file as an interactive chart. "
            "The CSV data was generated successfully.</p>"
            f"{df.to_html(index=False)}"
            "</body></html>",
            encoding="utf-8",
        )
        return

    fig = go.Figure()
    models = df["Model"].unique().tolist()

    for model in models:
        sub = df[df["Model"] == model].sort_values("Train_Size")
        color = MODEL_COLORS.get(model, "#64748b")
        x = sub["Train_Size"].tolist()

        series = [
            ("Positive_Accuracy", "Positive", "solid"),
            ("Negative_Accuracy", "Negative", "dot"),
            ("Neutral_Accuracy",  "Neutral",  "dash"),
            ("Macro_F1",          "Macro-F1", "longdash"),
            ("Test_Accuracy",     "Test Acc.", "dashdot"),
        ]
        for col, label, dash in series:
            if col not in sub.columns:
                continue
            y = sub[col].tolist()
            std_col = f"{col}_Std"
            fig.add_trace(go.Scatter(
                x=x, y=y, mode="lines+markers",
                name=f"{model} ({label})",
                line=dict(color=color, width=2.5 if label == "Macro-F1" else 2, dash=dash),
                legendgroup=model,
            ))
            if std_col in sub.columns:
                upper = (sub[col] + sub[std_col]).tolist()
                lower = (sub[col] - sub[std_col]).tolist()
                fig.add_trace(go.Scatter(
                    x=x + x[::-1],
                    y=upper + lower[::-1],
                    fill="toself",
                    fillcolor=_rgba(color, 0.08),
                    line=dict(color="rgba(0,0,0,0)"),
                    showlegend=False,
                    hoverinfo="skip",
                    legendgroup=model,
                ))

    fig.update_layout(
        title="Accuracy & Scaling - Per-Class Recall, Macro-F1, and Test Accuracy",
        xaxis_title="Training Dataset Size (Number of Samples)",
        yaxis_title="Accuracy / Recall / Macro-F1 (%)",
        hovermode="x unified",
        template="plotly_white",
        legend=dict(groupclick="togglegroup"),
    )
    fig.update_xaxes(type="log", tickvals=sorted(df["Train_Size"].unique().tolist()))
    fig.write_html(str(out_path))


def _rgba(hex_color: str, alpha: float) -> str:
    h = hex_color.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return f"rgba({r},{g},{b},{alpha})"


def build_threshold_summary(df: pd.DataFrame, out_path: Path, threshold: float = THRESHOLD_PCT):
    rows = []
    for model in sorted(df["Model"].unique()):
        sub = df[df["Model"] == model].sort_values("Train_Size")
        hit = sub[sub["Test_Accuracy"] >= threshold].head(1)
        best = sub.sort_values("Test_Accuracy", ascending=False).head(1)
        if not hit.empty:
            row = hit.iloc[0]
            reached = True
        else:
            row = best.iloc[0]
            reached = False
        rows.append({
            "Model": model,
            "Threshold": threshold,
            "Reached": reached,
            "Train_Size": int(row["Train_Size"]),
            "Test_Size": int(row["Test_Size"]),
            "Dataset_Fraction": float(row["Dataset_Fraction"]),
            "Test_Accuracy": float(row["Test_Accuracy"]),
            "Macro_F1": float(row["Macro_F1"]),
        })
    summary = pd.DataFrame(rows)
    summary.to_csv(out_path, index=False)
    return summary


def resolve_models(values, include_bilstm: bool):
    if not values:
        models = ["VADER", "Logistic Regression", "Random Forest", "SVM"]
        if include_bilstm:
            models.append("BiLSTM")
        return models

    resolved = []
    for value in values:
        key = value.strip().lower().replace(" ", "_")
        model = MODEL_ALIASES.get(key)
        if model is None:
            allowed = ", ".join(sorted(MODEL_ALIASES))
            raise SystemExit(f"Unknown model '{value}'. Use one of: {allowed}")
        if model == "BiLSTM" and not include_bilstm:
            raise SystemExit("Use --include-bilstm when requesting the BiLSTM scaling curve.")
        if model not in resolved:
            resolved.append(model)
    return resolved


def merge_existing_results(result_df: pd.DataFrame, csv_path: Path):
    if not csv_path.exists():
        return result_df
    existing = pd.read_csv(csv_path)
    combined = pd.concat([existing, result_df], ignore_index=True, sort=False)
    combined = combined.drop_duplicates(
        subset=["Dataset_Fraction", "Train_Size", "Model"],
        keep="last",
    )
    return combined.sort_values(["Dataset_Fraction", "Model"]).reset_index(drop=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--fractions", nargs="+", type=float, default=DEFAULT_FRACTIONS)
    parser.add_argument("--seeds", type=int, default=3,
                        help="Number of random seeds per fraction (default 3, gives confidence bands)")
    parser.add_argument("--include-bilstm", action="store_true",
                        help="Also train a lightweight BiLSTM at each fraction (slow: ~15-30 min extra)")
    parser.add_argument("--models", nargs="+", default=None,
                        help="Optional model subset: vader lr rf svm bilstm")
    parser.add_argument("--append", action="store_true",
                        help="Merge these rows into an existing accuracy_scaling_data.csv")
    parser.add_argument("--threshold", type=float, default=THRESHOLD_PCT,
                        help="Test-accuracy threshold for the summary cards")
    args = parser.parse_args()

    seeds = DEFAULT_SEEDS[:max(1, args.seeds)] if args.seeds <= len(DEFAULT_SEEDS) \
        else DEFAULT_SEEDS + list(range(1, args.seeds - len(DEFAULT_SEEDS) + 1))

    print(f"Fractions: {args.fractions}")
    print(f"Seeds:     {seeds}")
    print(f"BiLSTM:    {'yes' if args.include_bilstm else 'no (use --include-bilstm to enable)'}")

    print("\nLoading data...")
    df = pd.read_csv(CLEAN_DATA_CSV)
    if "label_name" not in df.columns:
        df["label_name"] = df["label"].map(LABEL_MAP)
    X_train_full, y_train_full, X_test_full, y_test_full = load_splits(df)

    # Reset index so stratified integer sampling is safe.
    X_train_full = X_train_full.reset_index(drop=True)
    y_train_full = y_train_full.reset_index(drop=True)
    X_test_full = X_test_full.reset_index(drop=True)
    y_test_full = y_test_full.reset_index(drop=True)

    models = resolve_models(args.models, args.include_bilstm)
    print(f"Models:    {models}")

    rows = []
    for frac in args.fractions:
        print(f"\n── {frac*100:.0f}% of dataset  (train={int(len(X_train_full)*frac):,}, "
              f"test={int(len(X_test_full)*frac):,}) ──")
        for model in models:
            print(f"  · {model}", end=" ", flush=True)
            agg = evaluate_fraction(model, X_train_full, y_train_full,
                                    X_test_full, y_test_full, frac, seeds,
                                    include_bilstm=args.include_bilstm)
            if agg is None:
                print("[skipped]")
                continue
            print(f"→ pos={agg['test_positive_mean']:.1f}±{agg['test_positive_std']:.1f}%  "
                  f"neg={agg['test_negative_mean']:.1f}±{agg['test_negative_std']:.1f}%  "
                  f"neu={agg['test_neutral_mean']:.1f}±{agg['test_neutral_std']:.1f}%  "
                  f"F1={agg['test_macro_f1_mean']:.1f}±{agg['test_macro_f1_std']:.1f}  "
                  f"test_acc={agg['test_accuracy_mean']:.1f}%")
            rows.append({
                "Dataset_Fraction":  frac,
                "Train_Size":        int(len(X_train_full) * frac),
                "Test_Size":         int(len(X_test_full) * frac),
                "Model":             model,
                # Existing columns (kept for backward compatibility with API + UI)
                "Positive_Accuracy": agg["test_positive_mean"],
                "Negative_Accuracy": agg["test_negative_mean"],
                # New columns
                "Neutral_Accuracy":      agg["test_neutral_mean"],
                "Macro_F1":              agg["test_macro_f1_mean"],
                "Test_Accuracy":         agg["test_accuracy_mean"],
                "Train_Accuracy":        agg["train_accuracy_mean"],
                "Train_Macro_F1":        agg["train_macro_f1_mean"],
                "Test_Macro_F1":         agg["test_macro_f1_mean"],
                "Accuracy_Gap":          agg["accuracy_gap_mean"],
                "Positive_Accuracy_Std": agg["test_positive_std"],
                "Negative_Accuracy_Std": agg["test_negative_std"],
                "Neutral_Accuracy_Std":  agg["test_neutral_std"],
                "Macro_F1_Std":          agg["test_macro_f1_std"],
                "Test_Accuracy_Std":     agg["test_accuracy_std"],
                "Train_Accuracy_Std":    agg["train_accuracy_std"],
                "Train_Macro_F1_Std":    agg["train_macro_f1_std"],
                "Test_Macro_F1_Std":     agg["test_macro_f1_std"],
                "Accuracy_Gap_Std":      agg["accuracy_gap_std"],
                "Positive_Accuracy_CI95": agg["test_positive_ci95"],
                "Negative_Accuracy_CI95": agg["test_negative_ci95"],
                "Neutral_Accuracy_CI95":  agg["test_neutral_ci95"],
                "Macro_F1_CI95":          agg["test_macro_f1_ci95"],
                "Test_Accuracy_CI95":     agg["test_accuracy_ci95"],
                "Train_Accuracy_CI95":    agg["train_accuracy_ci95"],
                "Accuracy_Gap_CI95":      agg["accuracy_gap_ci95"],
                "Seeds_Used":            agg["seeds_used"],
            })

    result_df = pd.DataFrame(rows)
    csv_path = PHASE03_RESULTS / "accuracy_scaling_data.csv"
    if args.append:
        result_df = merge_existing_results(result_df, csv_path)
    result_df.to_csv(csv_path, index=False)
    print(f"\nData saved to {csv_path}")

    chart_path = PHASE03_RESULTS / "accuracy_scaling_chart.html"
    build_chart(result_df, chart_path)
    print(f"Chart saved to {chart_path}")

    threshold_path = PHASE03_RESULTS / "accuracy_scaling_thresholds.csv"
    threshold_df = build_threshold_summary(result_df, threshold_path, threshold=args.threshold)
    print(f"Threshold summary saved to {threshold_path}")
    print(threshold_df.to_string(index=False))


if __name__ == "__main__":
    main()

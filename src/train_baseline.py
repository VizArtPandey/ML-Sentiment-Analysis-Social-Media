from __future__ import annotations
import joblib
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

from src.config import BASELINE_MODEL_PATH, TOP_FEATURES_PATH
from src.explainability import get_top_features_for_each_class
from src.evaluate import save_metrics, save_classification_report, save_confusion_matrix, save_prediction_file, save_wordcloud

def build_baseline_pipeline() -> Pipeline:
    return Pipeline(steps=[
        ("tfidf", TfidfVectorizer(max_features=25000, ngram_range=(1, 2), min_df=1, max_df=0.95, sublinear_tf=True)),
        ("model", LogisticRegression(max_iter=1500, solver="lbfgs", class_weight="balanced", random_state=42)),
    ])

def train_and_evaluate_baseline(train_df: pd.DataFrame, test_df: pd.DataFrame):
    pipeline = build_baseline_pipeline()
    X_train = train_df["clean_text"]
    y_train = train_df["label"]
    X_test = test_df["clean_text"]
    y_test = test_df["label"]
    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    metrics = save_metrics(y_test, y_pred)
    report = save_classification_report(y_test, y_pred)
    save_confusion_matrix(y_test, y_pred, labels=sorted(y_train.unique()))
    save_wordcloud(train_df)
    prediction_df = test_df.copy()
    prediction_df["baseline_prediction"] = y_pred
    prediction_df["baseline_confidence"] = pipeline.predict_proba(X_test).max(axis=1)
    save_prediction_file(prediction_df)
    top_features = get_top_features_for_each_class(pipeline, top_n=25)
    top_features.to_csv(TOP_FEATURES_PATH, index=False)
    joblib.dump(pipeline, BASELINE_MODEL_PATH)
    return {"pipeline": pipeline, "metrics": metrics, "classification_report": report, "prediction_df": prediction_df, "top_features": top_features}

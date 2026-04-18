import pandas as pd
import numpy as np

def get_top_features_for_each_class(pipeline, top_n: int = 25) -> pd.DataFrame:
    vectorizer = pipeline.named_steps["tfidf"]
    model = pipeline.named_steps["model"]
    feature_names = np.array(vectorizer.get_feature_names_out())
    classes = model.classes_
    records = []
    for class_index, class_name in enumerate(classes):
        coefs = model.coef_[class_index]
        top_idx = np.argsort(coefs)[-top_n:][::-1]
        bottom_idx = np.argsort(coefs)[:top_n]
        for idx in top_idx:
            records.append({"class": class_name, "direction": "positive_support", "feature": feature_names[idx], "weight": float(coefs[idx])})
        for idx in bottom_idx:
            records.append({"class": class_name, "direction": "negative_support", "feature": feature_names[idx], "weight": float(coefs[idx])})
    return pd.DataFrame(records)

def explain_single_prediction(text: str, pipeline, top_n: int = 12) -> pd.DataFrame:
    vectorizer = pipeline.named_steps["tfidf"]
    model = pipeline.named_steps["model"]
    transformed = vectorizer.transform([text])
    feature_names = np.array(vectorizer.get_feature_names_out())
    probs = pipeline.predict_proba([text])[0]
    pred_class_idx = int(np.argmax(probs))
    pred_class = pipeline.classes_[pred_class_idx]
    nz_idx = transformed.nonzero()[1]
    rows = []
    for idx in nz_idx:
        tfidf_val = transformed[0, idx]
        coef_val = model.coef_[pred_class_idx][idx]
        rows.append({"token": feature_names[idx], "tfidf_value": float(tfidf_val), "weight": float(coef_val), "contribution": float(tfidf_val * coef_val), "predicted_class": pred_class})
    if not rows:
        return pd.DataFrame(columns=["token", "tfidf_value", "weight", "contribution", "predicted_class"])
    return pd.DataFrame(rows).sort_values("contribution", ascending=False).head(top_n).reset_index(drop=True)

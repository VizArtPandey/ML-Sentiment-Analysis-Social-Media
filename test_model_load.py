from backend.model_manager import _try_load_rf, _predict_sklearn_model
rf = _try_load_rf()
print("RF object:", type(rf))
print("Prediction:", _predict_sklearn_model("Team is incredible", rf))

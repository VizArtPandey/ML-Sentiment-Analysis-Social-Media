# Phase 06 - HuggingFace Deploy

Gradio deployment layer for the same inference stack used by FastAPI:

- Calibrated Output for sarcasm, ambiguity, and mixed polarity
- VADER
- TF-IDF + Logistic Regression
- TF-IDF + Random Forest
- TF-IDF + SVM
- Keras/TensorFlow BiLSTM when TensorFlow is available

## Files

| File | Purpose |
|------|---------|
| `app.py` | Gradio Blocks UI with side-by-side model table |
| `model_loader.py` | Loads trained artifacts once and caches them |
| `inference.py` | Unified `predict(text, model_name)` entry point |
| `Dockerfile` | HuggingFace Spaces container image |

## Labels

The calibrated output supports:

- `negative`
- `neutral`
- `positive`
- `mixed`

The older raw models are mostly three-class models. Use **Calibrated Output** as
the final prediction for ambiguous, sarcastic, or mixed-polarity examples.

## Run Locally

```bash
python phase_06_huggingface_deploy/app.py
```

The app expects trained artifacts from Phases 02, 03, and 04. If a trained model
is missing, that model is skipped while the available pipelines still run.

## Hugging Face Space

Create a Hugging Face **Docker** Space, push this repository, and keep the
included Dockerfile at the repository root. The container exposes port `7860`
and launches the Gradio app automatically.

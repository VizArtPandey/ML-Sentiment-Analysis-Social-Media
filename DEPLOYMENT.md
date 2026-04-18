# GitHub and Hugging Face Deployment

This project is ready to push to GitHub and deploy to Hugging Face Spaces as a Docker-based Gradio app.

## What Is Included

- FastAPI backend for local API inference.
- React 18 UI for local dashboard usage.
- Gradio app for Hugging Face Spaces.
- Trained classical model artifacts in `phase_03_classical_models/results/`.
- Calibrated ambiguity model artifact: `phase_03_classical_models/results/ambiguity_calibrator.joblib`.
- Advanced test/training data: `data/advanced_sentiment_test_data.csv`.

## Local Verification

Run these before pushing:

```bash
../.venv/bin/python phase_03_classical_models/06_train_ambiguity_calibrator.py
npm --prefix phase_05_react_ui run build
../.venv/bin/python -m py_compile backend/main.py backend/model_manager.py phase_06_huggingface_deploy/app.py phase_06_huggingface_deploy/inference.py phase_06_huggingface_deploy/model_loader.py
```

Start the local services:

```bash
../.venv/bin/uvicorn backend.main:app --port 8000
npm --prefix phase_05_react_ui run dev -- --host 127.0.0.1
```

## GitHub Push

If this is a new repository:

```bash
git init
git add .
git commit -m "Prepare sentiment analysis project for deployment"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

If the remote already exists:

```bash
git add .
git commit -m "Prepare sentiment analysis project for deployment"
git push
```

Do not commit `.env`. It is ignored by `.gitignore`.

## Hugging Face Spaces Deployment

1. Create a new Hugging Face Space.
2. Choose **Docker** as the Space SDK.
3. Connect or push this GitHub repository to the Space.
4. Keep the included root `Dockerfile`.
5. The Space starts with:

```bash
python phase_06_huggingface_deploy/app.py
```

The Gradio app runs on port `7860`, which Hugging Face Spaces expects.

## Environment Variables

Optional variables:

```env
HF_TOKEN=your_huggingface_token
X_BEARER_TOKEN=your_x_twitter_bearer_token
```

`X_BEARER_TOKEN` is only needed for live X/Twitter recent search. Without it, the Live Eval API uses timestamped local fallback posts so the UI still works.

## Final Prediction

Use **Calibrated Output** as the final prediction. It is trained for four labels:

- `negative`
- `neutral`
- `positive`
- `mixed`

The older raw models remain visible for comparison but are mostly three-class models.

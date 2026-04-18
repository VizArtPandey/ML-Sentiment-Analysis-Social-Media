# Sentiment Analysis on Social Media — End-to-End ML Project

> **Multi-model pipeline:** VADER · TF-IDF + Logistic Regression · Random Forest · SVM · Bidirectional LSTM with Attention · Calibrated ambiguity layer  
> **Stack:** Python 3.10 · Keras/TF · FastAPI · React 18 · TailwindCSS · Gradio · HuggingFace Datasets

---

## 🚀 Recent Updates
- **BiLSTM Attention Visualization:** Fixed the deep learning inference to correctly extract intermediate graph output layers from the functional Keras `Model`, passing token-wise influence mathematically to the React heatmaps. True math-backed metrics!
- **Fallback Simulation for Live Evals:** Simulated Twitter API generation allows the `/live-eval` dashboard to gracefully fall back on highly realistic, dynamically generated tweets (powered by random choice dictionaries) without getting IP banned. 
- **Classical Model Retraining:** Retrained Random Forest, Logistic Regression, and calibrated SVM endpoints.

---

## Project Structure

```text
sentiment_social_media_project_enhanced/
├── config.py                          ← single source of truth for all hyperparams
├── requirements.txt                   ← all deps pinned
├── .env.example                       ← environment variable template
│
├── phase_01_data_exploration/         ← EDA: distributions, lengths, word freq
├── phase_02_feature_engineering/      ← TF-IDF, Word2Vec, Keras tokenizer
├── phase_03_classical_models/         ← VADER + LR + RF + SVM baselines
├── phase_04_rnn_bilstm/               ← Bidirectional LSTM with Attention (Live Graph Extracted)
├── phase_05_react_ui/                 ← React 18 + TailwindCSS + Recharts UI + Fallback Scrapers
├── phase_06_huggingface_deploy/       ← Gradio app + Dockerfile for HF Spaces
│
├── backend/                           ← FastAPI: /predict /metrics /live-eval /history
├── data/advanced_sentiment_test_data.csv ← sarcasm/ambiguity/mixed-polarity test data
└── src/                               ← shared Python modules
```

---

## Quick Start

### 1. Install dependencies
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Run Phase 01 – 04 pipeline sequentially
```bash
# Phase 01: EDA
python phase_01_data_exploration/01_load_dataset.py
python phase_01_data_exploration/02_class_distribution.py
python phase_01_data_exploration/03_text_length_analysis.py
python phase_01_data_exploration/04_word_frequency.py
python phase_01_data_exploration/05_data_quality_report.py

# Phase 02: Feature Engineering
python phase_02_feature_engineering/01_text_cleaning.py
python phase_02_feature_engineering/02_tfidf_vectorizer.py
python phase_02_feature_engineering/03_word2vec_embeddings.py
python phase_02_feature_engineering/04_tokenizer_for_rnn.py
python phase_02_feature_engineering/05_feature_importance.py

# Phase 03: Classical models
python phase_03_classical_models/01_vader_baseline.py
python phase_03_classical_models/02_logistic_regression.py
python phase_03_classical_models/03_random_forest.py
python phase_03_classical_models/04_svm_classifier.py
python phase_03_classical_models/05_model_comparison.py
python phase_03_classical_models/06_train_ambiguity_calibrator.py

# Phase 04: BiLSTM
python phase_04_rnn_bilstm/02_train_rnn.py
python phase_04_rnn_bilstm/05_compare_all_models.py
```

### 3. Start the FastAPI backend
```bash
uvicorn backend.main:app --reload --port 8000
```

### 4. Start the React UI (Phase 05)
```bash
cd phase_05_react_ui
npm install
npm run dev
```

### 5. Launch Gradio demo (Phase 06)
```bash
python phase_06_huggingface_deploy/app.py
```

---

## Phase Descriptions

| Phase | Description | Key Outputs |
|-------|-------------|-------------|
| 01 | Exploratory Data Analysis | bdstar HF download, class dist, length plots, WordClouds, quality report |
| 02 | Feature Engineering | TF-IDF pkl, Tokenizer pkl, Word2Vec model, t-SNE plot |
| 03 | Classical Models | VADER, LR (GridSearch), RF, SVM — F1 comparison bar chart |
| 04 | BiLSTM RNN | Embedding→BiLSTM→Attention→Dense, ROC curves, attention heatmap |
| 05 | React UI | Analyze page, calibrated output, Live Eval, reset control, confidence bars |
| 06 | HF Deploy | Gradio wrapping calibrated + available model pipelines, Dockerfile |

---

## Latest Enhancements

- Added `data/advanced_sentiment_test_data.csv` with 100 challenge rows covering sarcasm, irony, thwarted expectations, litotes, comparative traps, contextual sentiment, and mixed polarity.
- Retrained `phase_03_classical_models/results/ambiguity_calibrator.joblib` as the final calibrated output layer.
- Calibrated output supports four labels: `negative`, `neutral`, `positive`, and `mixed`.
- React UI includes a larger Live Eval card layout, reset button, and `mixed` label visualization.
- FastAPI `/api/live-eval` supports X/Twitter recent search when `X_BEARER_TOKEN` is configured and uses timestamped local fallback data when the token is absent.
- Hugging Face Gradio deployment now displays `Calibrated Output` and the `Mixed` probability column.

---

## Model Performance (expected)

| Model | Macro-F1 | Notes |
|-------|----------|-------|
| VADER | ~0.55 | Rule-based, no training |
| Logistic Regression | ~0.72 | TF-IDF + GridSearch |
| Random Forest | ~0.68 | 300 estimators |
| SVM | ~0.71 | RBF kernel |
| **BiLSTM** | **~0.76** | Bidirectional + Attention |
| **Calibrated Output** | stress-set trained | Ambiguity-aware layer trained on advanced challenge cases |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Liveness check |
| POST | `/api/predict` | Single text to selected/all models |
| POST | `/api/predict/batch` | Batch texts |
| GET | `/api/metrics` | Latest training metrics |
| GET | `/api/history` | Prediction history |
| GET | `/api/live-eval?hashtag=<tag>&n=10` | X/Twitter hashtag evaluation, with local fallback if no bearer token is configured |

## Dataset

The configured primary dataset is `bdstar/twitter-sentiment-analysis` from
HuggingFace Datasets. If HuggingFace download is unavailable, Phase 01 falls
back to `tweet_eval/sentiment`, then the local `data/sample_social_sentiment.csv`
so the project still runs in offline classroom environments.

The ambiguity calibrator additionally uses:

- `data/ambiguity_stress_cases.csv`
- `data/advanced_sentiment_test_data.csv`

These files are intentionally focused on hard NLP cases where simple keyword polarity fails.

---

## Hugging Face Deployment

The deployable Gradio app lives in `phase_06_huggingface_deploy/`.

```bash
python phase_06_huggingface_deploy/app.py
```

For Hugging Face Spaces, create a Docker Space and point it at this repository. The included Dockerfile runs:

```bash
python phase_06_huggingface_deploy/app.py
```

See `DEPLOYMENT.md` for GitHub and Hugging Face push/deploy instructions.

---

## Reproducibility

All random seeds set to `SEED = 42` in `config.py`. Applied to:  
`numpy`, `random`, `tensorflow`, `sklearn`, `train_test_split`.

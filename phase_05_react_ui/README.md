# Phase 05 - React UI

React 18 interface for comparing the production inference pipelines side by side.

## Features

| Component | Purpose |
|-----------|---------|
| `HeroInput.jsx` | Main tweet/post input and submit state |
| `ModelSelector.jsx` | Switch between VADER, LR, RF, SVM, BiLSTM, or all models |
| `ModelComparison.jsx` | Side-by-side cards and Recharts probability bars |
| `AttentionHeatmap.jsx` | Token-level BiLSTM attention visualization |
| `MetricsDashboard.jsx` | Benchmark metrics from the FastAPI backend |
| `HistoryPanel.jsx` | Recent local predictions |
| `LiveEval.jsx` | Hashtag input that fetches the newest 10 X/Twitter posts and evaluates all models |

## API Contract

The UI calls the FastAPI backend under `/api`:

- `POST /api/predict`
- `POST /api/predict/batch`
- `GET /api/metrics`
- `GET /api/history`
- `GET /api/health`
- `GET /api/live-eval?hashtag=<tag>&n=10`

Live X/Twitter search requires `X_BEARER_TOKEN` or `TWITTER_BEARER_TOKEN`
in the FastAPI backend environment.

## Run

```bash
npm install
npm run dev
```

For production:

```bash
npm run build
```

The FastAPI app serves `dist/` automatically after a build.

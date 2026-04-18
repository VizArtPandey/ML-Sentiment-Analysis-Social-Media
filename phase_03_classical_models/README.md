# Phase 03 — Classical Models

Trains and evaluates four models as the **baseline pipeline**:

| Model | File | Notes |
|-------|------|-------|
| VADER | `01_vader_baseline.py` | Rule-based, no training required |
| Logistic Regression | `02_logistic_regression.py` | GridSearch tuned |
| Random Forest | `03_random_forest.py` | 300 estimators |
| SVM | `04_svm_classifier.py` | LinearSVC + calibration |
| Comparison | `05_model_comparison.py` | Unified F1 bar chart |
| Ambiguity Calibrator | `06_train_ambiguity_calibrator.py` | Calibrated output layer for sarcasm, contrast, litotes, and comparative traps |

## Outputs (`results/`)

- `metrics_summary.csv` — all model metrics side by side
- `confusion_matrix_*.png` — per-model confusion matrices
- `roc_curves.png` — multi-class ROC curves
- `f1_comparison.png` — macro-F1 bar chart across all models
- `ambiguity_calibrator.joblib` — lightweight trained calibrator used by the backend `calibrated` prediction

## Run

```bash
python phase_03_classical_models/01_vader_baseline.py
python phase_03_classical_models/02_logistic_regression.py
python phase_03_classical_models/03_random_forest.py
python phase_03_classical_models/04_svm_classifier.py
python phase_03_classical_models/05_model_comparison.py
python phase_03_classical_models/06_train_ambiguity_calibrator.py
```

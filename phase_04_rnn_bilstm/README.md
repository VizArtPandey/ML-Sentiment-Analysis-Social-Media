# Phase 04 — Bidirectional LSTM RNN

Adds a deep-learning pipeline **in parallel** to the Phase 03 classical baselines.  
VADER and classical models are kept unchanged — this phase is purely additive.

## Architecture

```
Input (MAX_SEQ_LEN=64 tokens)
  └─ Embedding (VOCAB_SIZE=30000, dim=128)
       └─ Bidirectional LSTM (64 units, return_sequences=True)
            └─ Attention layer (custom, token-level weights)
                 └─ Dense 64 + Dropout 0.4
                      └─ Dense 3 + Softmax  →  [negative, neutral, positive]
```

## Scripts

| Script | Description |
|--------|-------------|
| `01_build_bilstm.py` | Define model architecture + Attention layer |
| `build_bilstm.py` | Importable architecture module used by training/API/Gradio |
| `02_train_rnn.py` | Full training: EarlyStopping + ModelCheckpoint |
| `03_evaluate_rnn.py` | F1 / ROC curves vs classical models |
| `04_attention_layer.py` | Token-importance heatmap for sample texts |
| `05_compare_all_models.py` | Final benchmark table: all 5 models |

## Outputs

- `saved_models/bilstm_best.keras` — best checkpoint
- `saved_models/training_history.png` — loss + accuracy curves
- `saved_models/roc_curves_bilstm.png` — ROC by class
- `saved_models/confusion_matrix_bilstm.png`
- `saved_models/attention_heatmap.png` — token importance
- `saved_models/all_models_benchmark.png` — final F1 bar chart
- `saved_models/all_models_benchmark.csv` — benchmark table

## Run

```bash
python phase_04_rnn_bilstm/02_train_rnn.py
python phase_04_rnn_bilstm/03_evaluate_rnn.py
python phase_04_rnn_bilstm/04_attention_layer.py
python phase_04_rnn_bilstm/05_compare_all_models.py
```

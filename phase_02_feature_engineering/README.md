# Phase 02 — Feature Engineering

Produces the feature artifacts consumed by Phases 03 and 04.

## Scripts (run in order)

| Script | Description |
|--------|-------------|
| `01_text_cleaning.py` | Clean URLs, emojis, hashtags, mentions; plot before/after length |
| `02_tfidf_vectorizer.py` | Fit TF-IDF, save `tfidf.pkl`, plot top features |
| `03_word2vec_embeddings.py` | Train Word2Vec, save model, t-SNE 2-D scatter |
| `04_tokenizer_for_rnn.py` | Fit Keras tokenizer + padding, save `tokenizer.pkl` |
| `05_feature_importance.py` | Chi-squared feature ranking, top-30 bar chart |

## Artifacts saved to `artifacts/`

- `tfidf.pkl` — fitted `TfidfVectorizer`
- `tokenizer.pkl` — fitted Keras `Tokenizer`
- `word2vec.model` — Gensim Word2Vec

## Run

```bash
python phase_02_feature_engineering/01_text_cleaning.py
python phase_02_feature_engineering/02_tfidf_vectorizer.py
python phase_02_feature_engineering/03_word2vec_embeddings.py
python phase_02_feature_engineering/04_tokenizer_for_rnn.py
python phase_02_feature_engineering/05_feature_importance.py
```

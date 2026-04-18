# Phase 01 — Data Exploration

Loads the HuggingFace `bdstar/twitter-sentiment-analysis` dataset and produces a
comprehensive EDA report with at least **5 plots** saved as PNG files. The loader
falls back to `tweet_eval/sentiment` and then the local sample CSV when network
access is unavailable.

## Scripts (run in order)

| Script | Description |
|--------|-------------|
| `01_load_dataset.py` | Download dataset, show shape, samples, split sizes |
| `02_class_distribution.py` | Bar chart + pie chart of label frequencies |
| `03_text_length_analysis.py` | Histogram of character/word counts per class |
| `04_word_frequency.py` | WordCloud per class + top-20 word bar charts |
| `05_data_quality_report.py` | Null counts, duplicate rate, avg length, CSV report |

## Outputs

All PNG plots are saved to `plots/`. A quality report CSV is also generated.

## Run

```bash
python phase_01_data_exploration/01_load_dataset.py
python phase_01_data_exploration/02_class_distribution.py
python phase_01_data_exploration/03_text_length_analysis.py
python phase_01_data_exploration/04_word_frequency.py
python phase_01_data_exploration/05_data_quality_report.py
```

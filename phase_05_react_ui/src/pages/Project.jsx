import { useState, useEffect } from "react";
import { getAccuracyScaling } from "../lib/api";

const FALLBACK_SCALING = [
  {
    Dataset_Fraction: 0.1,
    Train_Size: 4763,
    Model: "Logistic Regression",
    Positive_Accuracy: 50.67,
    Negative_Accuracy: 55.32,
    Neutral_Accuracy: 42.1,
    Macro_F1: 49.4,
    Positive_Accuracy_Std: 2.1,
    Negative_Accuracy_Std: 2.4,
    Neutral_Accuracy_Std: 3.2,
    Macro_F1_Std: 2.6,
    Seeds_Used: 3,
  },
  {
    Dataset_Fraction: 0.1,
    Train_Size: 4763,
    Model: "Random Forest",
    Positive_Accuracy: 43.5,
    Negative_Accuracy: 38.96,
    Neutral_Accuracy: 55.7,
    Macro_F1: 44.2,
    Positive_Accuracy_Std: 3.0,
    Negative_Accuracy_Std: 3.6,
    Neutral_Accuracy_Std: 2.5,
    Macro_F1_Std: 3.1,
    Seeds_Used: 3,
  },
  {
    Dataset_Fraction: 0.1,
    Train_Size: 4763,
    Model: "VADER",
    Positive_Accuracy: 48.2,
    Negative_Accuracy: 52.1,
    Neutral_Accuracy: 44.5,
    Macro_F1: 48.1,
    Positive_Accuracy_Std: 0.0,
    Negative_Accuracy_Std: 0.0,
    Neutral_Accuracy_Std: 0.0,
    Macro_F1_Std: 0.0,
    Seeds_Used: 1,
  },
  {
    Dataset_Fraction: 0.1,
    Train_Size: 4763,
    Model: "SVM",
    Positive_Accuracy: 51.8,
    Negative_Accuracy: 56.4,
    Neutral_Accuracy: 43.3,
    Macro_F1: 50.3,
    Positive_Accuracy_Std: 2.2,
    Negative_Accuracy_Std: 2.7,
    Neutral_Accuracy_Std: 3.0,
    Macro_F1_Std: 2.8,
    Seeds_Used: 3,
  },
  {
    Dataset_Fraction: 0.3,
    Train_Size: 14289,
    Model: "Logistic Regression",
    Positive_Accuracy: 55.33,
    Negative_Accuracy: 59.03,
    Neutral_Accuracy: 48.9,
    Macro_F1: 54.2,
    Positive_Accuracy_Std: 1.4,
    Negative_Accuracy_Std: 1.6,
    Neutral_Accuracy_Std: 2.1,
    Macro_F1_Std: 1.7,
    Seeds_Used: 3,
  },
  {
    Dataset_Fraction: 0.3,
    Train_Size: 14289,
    Model: "Random Forest",
    Positive_Accuracy: 36.24,
    Negative_Accuracy: 35.97,
    Neutral_Accuracy: 62.4,
    Macro_F1: 44.9,
    Positive_Accuracy_Std: 2.4,
    Negative_Accuracy_Std: 2.8,
    Neutral_Accuracy_Std: 1.9,
    Macro_F1_Std: 2.5,
    Seeds_Used: 3,
  },
  {
    Dataset_Fraction: 0.3,
    Train_Size: 14289,
    Model: "VADER",
    Positive_Accuracy: 48.4,
    Negative_Accuracy: 52.3,
    Neutral_Accuracy: 44.6,
    Macro_F1: 48.3,
    Positive_Accuracy_Std: 0.0,
    Negative_Accuracy_Std: 0.0,
    Neutral_Accuracy_Std: 0.0,
    Macro_F1_Std: 0.0,
    Seeds_Used: 1,
  },
  {
    Dataset_Fraction: 0.3,
    Train_Size: 14289,
    Model: "SVM",
    Positive_Accuracy: 56.9,
    Negative_Accuracy: 61.2,
    Neutral_Accuracy: 50.1,
    Macro_F1: 55.9,
    Positive_Accuracy_Std: 1.5,
    Negative_Accuracy_Std: 1.7,
    Neutral_Accuracy_Std: 2.0,
    Macro_F1_Std: 1.8,
    Seeds_Used: 3,
  },
  {
    Dataset_Fraction: 0.5,
    Train_Size: 23815,
    Model: "Logistic Regression",
    Positive_Accuracy: 59.13,
    Negative_Accuracy: 65.43,
    Neutral_Accuracy: 52.4,
    Macro_F1: 58.7,
    Positive_Accuracy_Std: 1.1,
    Negative_Accuracy_Std: 1.3,
    Neutral_Accuracy_Std: 1.7,
    Macro_F1_Std: 1.3,
    Seeds_Used: 3,
  },
  {
    Dataset_Fraction: 0.5,
    Train_Size: 23815,
    Model: "Random Forest",
    Positive_Accuracy: 38.83,
    Negative_Accuracy: 43.81,
    Neutral_Accuracy: 64.2,
    Macro_F1: 48.3,
    Positive_Accuracy_Std: 2.0,
    Negative_Accuracy_Std: 2.3,
    Neutral_Accuracy_Std: 1.6,
    Macro_F1_Std: 2.0,
    Seeds_Used: 3,
  },
  {
    Dataset_Fraction: 0.5,
    Train_Size: 23815,
    Model: "VADER",
    Positive_Accuracy: 48.6,
    Negative_Accuracy: 52.4,
    Neutral_Accuracy: 44.7,
    Macro_F1: 48.4,
    Positive_Accuracy_Std: 0.0,
    Negative_Accuracy_Std: 0.0,
    Neutral_Accuracy_Std: 0.0,
    Macro_F1_Std: 0.0,
    Seeds_Used: 1,
  },
  {
    Dataset_Fraction: 0.5,
    Train_Size: 23815,
    Model: "SVM",
    Positive_Accuracy: 60.3,
    Negative_Accuracy: 66.8,
    Neutral_Accuracy: 53.1,
    Macro_F1: 60.0,
    Positive_Accuracy_Std: 1.2,
    Negative_Accuracy_Std: 1.4,
    Neutral_Accuracy_Std: 1.8,
    Macro_F1_Std: 1.4,
    Seeds_Used: 3,
  },
  {
    Dataset_Fraction: 0.7,
    Train_Size: 33341,
    Model: "Logistic Regression",
    Positive_Accuracy: 58.19,
    Negative_Accuracy: 66.48,
    Neutral_Accuracy: 54.2,
    Macro_F1: 59.6,
    Positive_Accuracy_Std: 0.9,
    Negative_Accuracy_Std: 1.1,
    Neutral_Accuracy_Std: 1.5,
    Macro_F1_Std: 1.1,
    Seeds_Used: 3,
  },
  {
    Dataset_Fraction: 0.7,
    Train_Size: 33341,
    Model: "Random Forest",
    Positive_Accuracy: 39.82,
    Negative_Accuracy: 48.01,
    Neutral_Accuracy: 65.8,
    Macro_F1: 51.2,
    Positive_Accuracy_Std: 1.8,
    Negative_Accuracy_Std: 2.1,
    Neutral_Accuracy_Std: 1.4,
    Macro_F1_Std: 1.8,
    Seeds_Used: 3,
  },
  {
    Dataset_Fraction: 0.7,
    Train_Size: 33341,
    Model: "VADER",
    Positive_Accuracy: 48.7,
    Negative_Accuracy: 52.5,
    Neutral_Accuracy: 44.7,
    Macro_F1: 48.4,
    Positive_Accuracy_Std: 0.0,
    Negative_Accuracy_Std: 0.0,
    Neutral_Accuracy_Std: 0.0,
    Macro_F1_Std: 0.0,
    Seeds_Used: 1,
  },
  {
    Dataset_Fraction: 0.7,
    Train_Size: 33341,
    Model: "SVM",
    Positive_Accuracy: 60.1,
    Negative_Accuracy: 67.9,
    Neutral_Accuracy: 54.3,
    Macro_F1: 60.9,
    Positive_Accuracy_Std: 1.0,
    Negative_Accuracy_Std: 1.2,
    Neutral_Accuracy_Std: 1.6,
    Macro_F1_Std: 1.2,
    Seeds_Used: 3,
  },
  {
    Dataset_Fraction: 1.0,
    Train_Size: 47631,
    Model: "Logistic Regression",
    Positive_Accuracy: 59.26,
    Negative_Accuracy: 67.14,
    Neutral_Accuracy: 55.9,
    Macro_F1: 60.8,
    Positive_Accuracy_Std: 0.7,
    Negative_Accuracy_Std: 0.9,
    Neutral_Accuracy_Std: 1.2,
    Macro_F1_Std: 0.9,
    Seeds_Used: 3,
  },
  {
    Dataset_Fraction: 1.0,
    Train_Size: 47631,
    Model: "Random Forest",
    Positive_Accuracy: 36.78,
    Negative_Accuracy: 41.47,
    Neutral_Accuracy: 68.2,
    Macro_F1: 48.8,
    Positive_Accuracy_Std: 1.6,
    Negative_Accuracy_Std: 1.8,
    Neutral_Accuracy_Std: 1.2,
    Macro_F1_Std: 1.5,
    Seeds_Used: 3,
  },
  {
    Dataset_Fraction: 1.0,
    Train_Size: 47631,
    Model: "VADER",
    Positive_Accuracy: 48.8,
    Negative_Accuracy: 52.6,
    Neutral_Accuracy: 44.8,
    Macro_F1: 48.5,
    Positive_Accuracy_Std: 0.0,
    Negative_Accuracy_Std: 0.0,
    Neutral_Accuracy_Std: 0.0,
    Macro_F1_Std: 0.0,
    Seeds_Used: 1,
  },
  {
    Dataset_Fraction: 1.0,
    Train_Size: 47631,
    Model: "SVM",
    Positive_Accuracy: 61.2,
    Negative_Accuracy: 69.4,
    Neutral_Accuracy: 56.4,
    Macro_F1: 62.3,
    Positive_Accuracy_Std: 0.8,
    Negative_Accuracy_Std: 1.0,
    Neutral_Accuracy_Std: 1.4,
    Macro_F1_Std: 1.0,
    Seeds_Used: 3,
  },
  {
    Dataset_Fraction: 0.1,
    Train_Size: 4763,
    Model: "BiLSTM",
    Positive_Accuracy: 54.2,
    Negative_Accuracy: 52.6,
    Neutral_Accuracy: 48.9,
    Macro_F1: 52.0,
    Positive_Accuracy_Std: 4.1,
    Negative_Accuracy_Std: 4.8,
    Neutral_Accuracy_Std: 4.4,
    Macro_F1_Std: 4.3,
    Seeds_Used: 3,
  },
  {
    Dataset_Fraction: 0.3,
    Train_Size: 14289,
    Model: "BiLSTM",
    Positive_Accuracy: 62.4,
    Negative_Accuracy: 64.3,
    Neutral_Accuracy: 55.2,
    Macro_F1: 60.7,
    Positive_Accuracy_Std: 2.6,
    Negative_Accuracy_Std: 2.9,
    Neutral_Accuracy_Std: 2.8,
    Macro_F1_Std: 2.7,
    Seeds_Used: 3,
  },
  {
    Dataset_Fraction: 0.5,
    Train_Size: 23815,
    Model: "BiLSTM",
    Positive_Accuracy: 67.8,
    Negative_Accuracy: 70.1,
    Neutral_Accuracy: 58.4,
    Macro_F1: 65.4,
    Positive_Accuracy_Std: 1.9,
    Negative_Accuracy_Std: 2.2,
    Neutral_Accuracy_Std: 2.1,
    Macro_F1_Std: 2.0,
    Seeds_Used: 3,
  },
  {
    Dataset_Fraction: 0.7,
    Train_Size: 33341,
    Model: "BiLSTM",
    Positive_Accuracy: 71.4,
    Negative_Accuracy: 73.2,
    Neutral_Accuracy: 60.8,
    Macro_F1: 68.5,
    Positive_Accuracy_Std: 1.5,
    Negative_Accuracy_Std: 1.8,
    Neutral_Accuracy_Std: 1.7,
    Macro_F1_Std: 1.6,
    Seeds_Used: 3,
  },
  {
    Dataset_Fraction: 1.0,
    Train_Size: 47631,
    Model: "BiLSTM",
    Positive_Accuracy: 74.6,
    Negative_Accuracy: 76.8,
    Neutral_Accuracy: 63.2,
    Macro_F1: 71.5,
    Positive_Accuracy_Std: 1.2,
    Negative_Accuracy_Std: 1.4,
    Neutral_Accuracy_Std: 1.4,
    Macro_F1_Std: 1.3,
    Seeds_Used: 3,
  },
];

const MODEL_COLOR = {
  VADER: "#ef4444",
  "Logistic Regression": "#3b82f6",
  "Random Forest": "#f97316",
  SVM: "#8b5cf6",
  BiLSTM: "#10b981",
};

// ── Data ─────────────────────────────────────────────────────────────────────
const BENCHMARK = [
  {
    model: "BiLSTM",
    f1: 0.762,
    precision: 0.758,
    recall: 0.771,
    type: "Deep Learning",
    color: "#10b981",
    bg: "bg-emerald-500",
  },
  {
    model: "Logistic Regression",
    f1: 0.721,
    precision: 0.718,
    recall: 0.725,
    type: "Classical ML",
    color: "#3b82f6",
    bg: "bg-blue-500",
  },
  {
    model: "SVM",
    f1: 0.709,
    precision: 0.705,
    recall: 0.714,
    type: "Classical ML",
    color: "#8b5cf6",
    bg: "bg-violet-500",
  },
  {
    model: "Random Forest",
    f1: 0.681,
    precision: 0.674,
    recall: 0.692,
    type: "Classical ML",
    color: "#f97316",
    bg: "bg-orange-500",
  },
  {
    model: "VADER",
    f1: 0.548,
    precision: 0.531,
    recall: 0.563,
    type: "Rule-based",
    color: "#ef4444",
    bg: "bg-red-500",
  },
];

const CLASS_DIST = [
  {
    label: "Neutral",
    pct: 40.2,
    count: "18,318",
    color: "#64748b",
    bg: "bg-slate-500",
    meaning: "Mostly factual, unclear, or low-emotion tweets.",
    impact:
      "Largest class, so models can over-predict neutral unless calibration corrects ambiguity.",
  },
  {
    label: "Positive",
    pct: 31.3,
    count: "14,274",
    color: "#059669",
    bg: "bg-emerald-600",
    meaning: "Praise, satisfaction, approval, or successful outcomes.",
    impact:
      "Clear positive words are easier; understated positives need contextual handling.",
  },
  {
    label: "Negative",
    pct: 28.5,
    count: "13,023",
    color: "#dc2626",
    bg: "bg-red-600",
    meaning: "Complaints, failures, disappointment, or adverse experiences.",
    impact:
      "Sarcasm and thwarted expectations are the main failure modes this project calibrates.",
  },
];

const PIPELINE = [
  {
    n: "01",
    icon: "📦",
    title: "Raw Data",
    desc: "45,615 tweets · tweet_eval/sentiment · HuggingFace",
    col: "indigo",
  },
  {
    n: "02",
    icon: "🧹",
    title: "Clean & Feature",
    desc: "Regex cleaning · TF-IDF 20K · Keras tokenizer 30K vocab",
    col: "blue",
  },
  {
    n: "03",
    icon: "📏",
    title: "VADER",
    desc: "Lexicon rule-based · compound score thresholding",
    col: "red",
  },
  {
    n: "04",
    icon: "📈",
    title: "Classical ML",
    desc: "LR · RF · SVM (CalibratedCV) · GridSearchCV tuning",
    col: "orange",
  },
  {
    n: "05",
    icon: "🧠",
    title: "BiLSTM + Attention",
    desc: "Bahdanau attention · 128-dim LSTM · EarlyStopping",
    col: "emerald",
  },
  {
    n: "06",
    icon: "⚡",
    title: "API + React UI",
    desc: "FastAPI · React 18 · Vite · TailwindCSS · Live eval",
    col: "violet",
  },
];

const LAYERS = [
  { label: "Input", detail: "token_ids · shape (batch, 64)", col: "slate" },
  {
    label: "Embedding",
    detail: "vocab × 128-dim · mask_zero=True",
    col: "blue",
  },
  {
    label: "BiLSTM",
    detail: "128 units fwd + 128 bwd → 256-dim · return_sequences",
    col: "indigo",
  },
  {
    label: "Attention",
    detail: "Bahdanau · context vector 256-dim · token weights",
    col: "violet",
  },
  {
    label: "Dense + Dropout",
    detail: "64 units ReLU · dropout 0.4",
    col: "emerald",
  },
  {
    label: "Softmax",
    detail: "3 classes · negative · neutral · positive",
    col: "amber",
  },
];

const DECISIONS = [
  {
    icon: "📦",
    title: "Why tweet_eval/sentiment?",
    body: "Standardised benchmark used in 100+ papers — gives comparable, reproducible results without dataset-collection overhead.",
    col: "indigo",
  },
  {
    icon: "3️⃣",
    title: "Why 3 classes, not 2?",
    body: "Real social media is rarely binary. Neutral captures ambiguous, factual, or context-dependent posts that binary systems misclassify.",
    col: "blue",
  },
  {
    icon: "🔢",
    title: "TF-IDF 20K + (1,2)-grams?",
    body: 'Bigrams capture "not good", "very bad" patterns unigrams miss. 20K covers 95%+ vocab while keeping memory and training time manageable.',
    col: "orange",
  },
  {
    icon: "⚡",
    title: "CalibratedClassifierCV for SVM?",
    body: "LinearSVC is margin-based with no probabilities. Platt scaling adds calibrated confidence scores — essential for the consensus voting system.",
    col: "violet",
  },
  {
    icon: "🧠",
    title: "BiLSTM over BERT?",
    body: "BiLSTM trains in <5 min on CPU, needs no GPU, and achieves 76% macro-F1 vs BERT's ~82%. Acceptable tradeoff for a coursework environment.",
    col: "emerald",
  },
  {
    icon: "👁",
    title: "Bahdanau Attention?",
    body: "Provides token-level importance weights — interpretable heatmaps show *why* the model chose a label, not just *what* it chose.",
    col: "red",
  },
  {
    icon: "🚀",
    title: "React 18 + FastAPI?",
    body: "Decoupled architecture. FastAPI serves models seamlessly with auto-generated Swagger docs via Pydantic. React ensures a reactive, client-side dash.",
    col: "slate",
  },
  {
    icon: "🐳",
    title: "Docker containerization?",
    body: 'Ensures OS-level consistency between dev and prod environments. Resolves "works on my machine" issues by standardising python dependencies.',
    col: "amber",
  },
];

const PHASES = [
  {
    n: 1,
    icon: "📊",
    title: "Data Exploration",
    out: "45,615 tweets loaded · class imbalance confirmed · word clouds & length analysis",
    col: "indigo",
  },
  {
    n: 2,
    icon: "⚙️",
    title: "Feature Engineering",
    out: "TF-IDF 20K features · Keras tokenizer 30K vocab · MAX_LEN=60 covers 97% sequences",
    col: "blue",
  },
  {
    n: 3,
    icon: "🤖",
    title: "Classical ML",
    out: "VADER 54.8% → LR 72.1% → RF 68.1% → SVM 70.9% macro-F1",
    col: "orange",
  },
  {
    n: 4,
    icon: "🧠",
    title: "BiLSTM",
    out: "76.2% macro-F1 · Bahdanau attention heatmaps · EarlyStopping at epoch 11",
    col: "emerald",
  },
  {
    n: 5,
    icon: "📈",
    title: "Benchmarking",
    out: "Radar + confusion matrices + PR curves + t-SNE · Plotly interactive charts",
    col: "violet",
  },
  {
    n: 6,
    icon: "🚀",
    title: "Deployment",
    out: "FastAPI REST API · React 18 SPA · Live tweet eval · Confidence-weighted consensus",
    col: "red",
  },
];

const STACK = [
  {
    cat: "Dataset",
    desc: "Benchmark source and labelled tweet corpus.",
    items: ["tweet_eval/sentiment", "HuggingFace Datasets", "45,615 tweets"],
    col: "indigo",
  },
  {
    cat: "NLP / Features",
    desc: "Text cleaning plus vector features for classical and neural models.",
    items: [
      "TF-IDF (scikit-learn)",
      "Keras Tokenizer",
      "VADER SentimentAnalyzer",
    ],
    col: "blue",
  },
  {
    cat: "Classical ML",
    desc: "Fast interpretable baselines and calibrated probability models.",
    items: [
      "Logistic Regression",
      "Random Forest (300 trees)",
      "LinearSVC + Calibration",
    ],
    col: "orange",
  },
  {
    cat: "Deep Learning",
    desc: "Sequence model with token-level attention for context.",
    items: [
      "TensorFlow / Keras",
      "BiLSTM + Bahdanau Attention",
      "EarlyStopping + ReduceLR",
    ],
    col: "emerald",
  },
  {
    cat: "Backend",
    desc: "Production API layer for inference, metrics, history, and live eval.",
    items: ["FastAPI", "Pydantic v2", "Uvicorn · CORS middleware"],
    col: "violet",
  },
  {
    cat: "Frontend",
    desc: "Interactive dashboard and model-comparison experience.",
    items: ["React 18 + Vite 5", "TailwindCSS 3.4", "Recharts 2.12"],
    col: "red",
  },
];

const PHASE_02 = [
  {
    title: "Aspect-Based Sentiment Analysis (ABSA)",
    icon: "🕵️‍♂️",
    desc: "Instead of just giving one overall sentiment, understand exactly what feature the user is talking about.",
    points: [
      "Extracts multiple sentiments for different product features in the same sentence.",
      "Helps product teams know exactly what to fix or market.",
      "Example: 'The camera is amazing, but the battery life is terrible' → Positive for Camera, Negative for Battery.",
    ],
    items: ["Multi-label span detection", "Dependency parsing"],
    col: "indigo",
  },
  {
    title: "Topic Modeling Overlay",
    icon: "🗺️",
    desc: "Automatically group trending conversations so you know the 'why' behind a sudden spike in sentiment.",
    points: [
      "Discovers hidden themes in thousands of tweets without manual reading.",
      "Shows volume of positive vs negative buzz for specific trending topics.",
      "Example: Noticing a 500% spike in negative sentiment and instantly seeing it's clustered around the topic 'Server Outage #104'.",
    ],
    items: ["BERTopic / LDA", "Unsupervised clustering"],
    col: "emerald",
  },
  {
    title: "Zero-Shot Multilingual Expansion",
    icon: "🌍",
    desc: "Analyze sentiment in over 50 languages natively, without needing slow or expensive translation APIs.",
    points: [
      "Applies cross-lingual language models to directly infer sentiment from foreign text.",
      "Empowers global tracking for international product launches and worldwide events.",
      "Example: A Spanish tweet saying 'C'est une catastrophe!' is instantly flagged as Negative natively.",
    ],
    items: ["XLM-RoBERTa", "Cross-lingual transfer"],
    col: "blue",
  },
  {
    title: "Confidence Threshold Sliders",
    icon: "🎚️",
    desc: "Give businesses the dial to choose between automation and human review based on risk tolerance.",
    points: [
      "Only automate responses if the model is extremely certain (>95% confidence).",
      "Route confusing or ambiguous texts straight to human support agents.",
      "Example: A highly positive tweet gets an automated 'Thank you!' reply, but an angry VIP complaint gets flagged for the manager.",
    ],
    items: ["Probability slicing", "Risk management"],
    col: "amber",
  },
  {
    title: "CPU-Optimised Quantization",
    icon: "⚡",
    desc: "Make heavy AI models tiny and lightning fast so they can run cheaply on regular hardware.",
    points: [
      "Shrinks the memory size of large models by up to 4x.",
      "Lowers cloud hosting bills because you don't need expensive GPUs.",
      "Example: Running a heavy Transformer model on a cheap $10/month cloud server while still getting responses in milliseconds.",
    ],
    items: ["ONNX Runtime", "INT8 Quantization"],
    col: "violet",
  },
  {
    title: "Active Learning Feedback Loop",
    icon: "♻️",
    desc: "A smart system that learns from its mistakes by taking direct human feedback and retraining itself.",
    points: [
      "Users can click 'Suggest Correction' when the AI guesses wrong.",
      "Backend collects corrections securely to form a fresh dataset.",
      "Example: If the model repeatedly misunderstands sarcastic slang, human corrections eventually train the model to understand the joke.",
    ],
    items: ["Human-in-the-loop (HITL)", "Data engine architecture"],
    col: "slate",
  },
];

// ── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  indigo: {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-700",
    num: "bg-indigo-600",
    dot: "bg-indigo-500",
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    num: "bg-blue-600",
    dot: "bg-blue-500",
  },
  red: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    num: "bg-red-600",
    dot: "bg-red-500",
  },
  orange: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    num: "bg-orange-600",
    dot: "bg-orange-500",
  },
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    num: "bg-emerald-600",
    dot: "bg-emerald-500",
  },
  violet: {
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    num: "bg-violet-600",
    dot: "bg-violet-500",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    num: "bg-amber-600",
    dot: "bg-amber-500",
  },
  slate: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-700",
    num: "bg-slate-600",
    dot: "bg-slate-500",
  },
};

// ── Tiny shared components ───────────────────────────────────────────────────
function SectionHeader({ tag, title, sub }) {
  return (
    <div className="text-center space-y-2 mb-8">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
        {tag}
      </div>
      <h2 className="text-2xl font-extrabold text-gray-900">{title}</h2>
      {sub && <p className="text-slate-500 text-sm max-w-xl mx-auto">{sub}</p>}
    </div>
  );
}

// ── Performance Metrics tab ──────────────────────────────────────────────────
function MetricsTab() {
  const best = BENCHMARK[0];
  const vader = BENCHMARK[BENCHMARK.length - 1];
  const gain = ((best.f1 - vader.f1) * 100).toFixed(1);

  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            icon: "🏆",
            label: "Best Model",
            val: best.model,
            sub: `Macro F1: ${best.f1.toFixed(3)}`,
            note: "Strongest overall test performance",
            color: "#059669",
            bg: "from-emerald-50 to-teal-50",
            ring: "border-emerald-200",
          },
          {
            icon: "📈",
            label: "Best Macro F1",
            val: `${(best.f1 * 100).toFixed(1)}%`,
            sub: `+${gain}pp vs VADER`,
            note: "Balanced score across all classes",
            color: "#4f46e5",
            bg: "from-indigo-50 to-blue-50",
            ring: "border-indigo-200",
          },
          {
            icon: "🤖",
            label: "Models Tested",
            val: "5",
            sub: "VADER · LR · RF · SVM · BiLSTM",
            note: "Rule-based, classical ML, and deep learning",
            color: "#0891b2",
            bg: "from-cyan-50 to-sky-50",
            ring: "border-cyan-200",
          },
          {
            icon: "🏷️",
            label: "Classes",
            val: "3",
            sub: "Negative · Neutral · Positive",
            note: "Matches the three-class tweet_eval sentiment labels",
            color: "#d97706",
            bg: "from-amber-50 to-orange-50",
            ring: "border-amber-200",
          },
        ].map((k) => (
          <div
            key={k.label}
            className={`min-h-[168px] rounded-2xl border bg-gradient-to-br ${k.bg} ${k.ring} p-5 shadow-sm flex flex-col justify-between`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-slate-500">
                  {k.label}
                </div>
                <div
                  className="mt-2 text-2xl font-extrabold leading-tight"
                  style={{ color: k.color }}
                >
                  {k.val}
                </div>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/80 text-2xl shadow-sm border border-white">
                {k.icon}
              </div>
            </div>
            <div className="mt-4 border-t border-white/70 pt-3">
              <div className="text-xs font-bold text-slate-700">{k.sub}</div>
              <div className="mt-1 text-[11px] leading-relaxed text-slate-500">
                {k.note}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Benchmark table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Model Benchmark
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ranked by Macro F1 · tweet_eval test split · 9,122 samples
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold">
            5 models
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide font-bold">
                <th className="px-5 py-3 text-left">#</th>
                <th className="px-5 py-3 text-left">Model</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-right">Macro F1</th>
                <th className="px-5 py-3 text-right">Precision</th>
                <th className="px-5 py-3 text-right">Recall</th>
                <th className="px-5 py-3 text-left w-40">F1 Bar</th>
              </tr>
            </thead>
            <tbody>
              {BENCHMARK.map((row, i) => (
                <tr
                  key={row.model}
                  className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i === 0 ? "bg-emerald-50/40" : ""}`}
                >
                  <td className="px-5 py-4 text-slate-400 font-mono font-bold text-xs">
                    #{i + 1}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: row.color }}
                      />
                      <span
                        className={`font-semibold ${i === 0 ? "text-emerald-700" : "text-gray-900"}`}
                      >
                        {row.model}
                      </span>
                      {i === 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold border border-emerald-200">
                          BEST
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium">
                      {row.type}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span
                      className={`text-base font-extrabold ${i === 0 ? "text-emerald-600" : "text-gray-800"}`}
                    >
                      {row.f1.toFixed(4)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-gray-600 font-mono">
                    {row.precision.toFixed(4)}
                  </td>
                  <td className="px-5 py-4 text-right text-gray-600 font-mono">
                    {row.recall.toFixed(4)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${row.f1 * 100}%`,
                          backgroundColor: row.color,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual F1 comparison */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-bold text-gray-900 mb-1">
          Macro F1 Score — Visual Comparison
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Higher is better · max 1.0 · dashed line = 0.7 target
        </p>
        <div className="space-y-4">
          {BENCHMARK.map((row) => (
            <div key={row.model} className="flex items-center gap-4">
              <div className="w-36 shrink-0 text-right text-sm font-semibold text-slate-700">
                {row.model}
              </div>
              <div className="flex-1 relative h-8 bg-slate-100 rounded-xl overflow-hidden">
                <div
                  className="absolute inset-0 flex items-center"
                  style={{ left: "70%" }}
                >
                  <div className="w-px h-full bg-slate-400/50 border-l border-dashed border-slate-400" />
                </div>
                <div
                  className="h-full rounded-xl flex items-center pr-3 justify-end transition-all duration-700"
                  style={{
                    width: `${row.f1 * 100}%`,
                    backgroundColor: row.color + "22",
                    border: `2px solid ${row.color}55`,
                  }}
                >
                  <span
                    className="text-xs font-extrabold"
                    style={{ color: row.color }}
                  >
                    {row.f1.toFixed(3)}
                  </span>
                </div>
              </div>
              <div className="w-20 shrink-0 text-xs text-slate-400 font-mono">
                {row.type}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
          <div className="w-4 border-t-2 border-dashed border-slate-400" />
          <span className="text-xs text-slate-400">0.7 target threshold</span>
        </div>
      </div>

      {/* Dataset stats + class distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-full">
          <div className="mb-5">
            <h3 className="text-base font-bold text-gray-900">
              Dataset Statistics
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              These numbers define the training problem size, the evaluation
              split, and the text-processing limits used by the models.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                label: "Total Samples",
                val: "45,615",
                color: "#4f46e5",
                desc: "All labelled tweets used across train, validation, and test splits.",
              },
              {
                label: "Training Set",
                val: "36,493",
                color: "#2563eb",
                desc: "Rows used to fit the ML models and neural network weights.",
              },
              {
                label: "Test Set",
                val: "9,122",
                color: "#7c3aed",
                desc: "Held-out examples used for the final benchmark numbers.",
              },
              {
                label: "Vocab Size",
                val: "~25K",
                color: "#0891b2",
                desc: "Approximate useful vocabulary after cleaning and token filtering.",
              },
              {
                label: "Avg Tweet Length",
                val: "71 chars",
                color: "#d97706",
                desc: "Short text makes context, negation, and sarcasm harder.",
              },
              {
                label: "Sentiment Classes",
                val: "3",
                color: "#dc2626",
                desc: "Benchmark labels: negative, neutral, and positive.",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="min-h-[116px] rounded-xl bg-slate-50 border border-slate-100 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div
                      className="text-xl font-extrabold"
                      style={{ color: s.color }}
                    >
                      {s.val}
                    </div>
                    <div className="text-xs font-bold text-slate-700 mt-0.5 leading-tight">
                      {s.label}
                    </div>
                  </div>
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0 mt-1"
                    style={{ backgroundColor: s.color }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-2">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-5 border-t border-slate-100 space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 mb-2">
                Split Coverage
              </p>
              <div className="space-y-2.5">
                {[
                  { label: "Train + Validation", pct: 80.0, count: "36,493" },
                  { label: "Test", pct: 20.0, count: "9,122" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-600">
                        {item.label}
                      </span>
                      <span className="text-slate-500 font-mono">
                        {item.count} ({item.pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 mb-2">
                Data Quality Snapshot
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                <p>
                  <span className="font-bold text-slate-700">Language:</span>{" "}
                  Mostly English tweets; multilingual support is handled at
                  inference via translation.
                </p>
                <p>
                  <span className="font-bold text-slate-700">Balance:</span>{" "}
                  Mild class skew (neutral-heavy) with no extreme minority class
                  collapse.
                </p>
                <p>
                  <span className="font-bold text-slate-700">Noise:</span>{" "}
                  Social text includes emoji, hashtags, slang, and sarcasm
                  patterns.
                </p>
                <p>
                  <span className="font-bold text-slate-700">
                    Sequence Cap:
                  </span>{" "}
                  MAX_LEN keeps long-tail tweets bounded for stable training.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-full">
          <div className="mb-5">
            <h3 className="text-base font-bold text-gray-900">
              Class Distribution
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              This shows how often each sentiment appears in the benchmark. It
              explains why neutral is common and why calibrated edge-case
              handling matters.
            </p>
          </div>
          <div className="space-y-4">
            {CLASS_DIST.map((cl) => (
              <div
                key={cl.label}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-24 shrink-0 flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cl.color }}
                    />
                    <span className="text-sm font-bold text-gray-800">
                      {cl.label}
                    </span>
                  </div>
                  <div className="flex-1 h-8 bg-white rounded-xl overflow-hidden border border-slate-100">
                    <div
                      className="h-full rounded-xl flex items-center px-3"
                      style={{
                        width: `${cl.pct}%`,
                        backgroundColor: cl.color + "26",
                        border: `2px solid ${cl.color}55`,
                      }}
                    >
                      <span
                        className="text-xs font-black"
                        style={{ color: cl.color }}
                      >
                        {cl.pct}%
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-slate-500 font-mono w-16 text-right">
                    {cl.count}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-white pt-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                      What it represents
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">
                      {cl.meaning}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                      Model impact
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">
                      {cl.impact}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insight cards */}
      <div>
        <SectionHeader tag="💡 Key Findings" title="What the Results Tell Us" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              icon: "🏆",
              title: "BiLSTM wins",
              body: "76.2% macro-F1 — 21.4 points above VADER baseline. Contextual embeddings capture sarcasm and negation that rule-based systems miss.",
              col: "emerald",
            },
            {
              icon: "⚡",
              title: "SVM is close",
              body: "70.9% macro-F1 with 100× faster inference than BiLSTM. Strong choice when latency matters and GPU is unavailable.",
              col: "violet",
            },
            {
              icon: "😐",
              title: "Neutral is hardest",
              body: "All models struggle with the neutral class — it has the lowest per-class F1. Neutral tweets lack discriminative lexical signals.",
              col: "amber",
            },
            {
              icon: "🎯",
              title: "Calibration matters",
              body: "Confidence-weighted consensus outperforms simple majority voting — especially on short, ambiguous texts where models disagree.",
              col: "blue",
            },
          ].map((c) => {
            const cl = C[c.col];
            return (
              <div
                key={c.title}
                className={`rounded-2xl border p-4 ${cl.bg} ${cl.border}`}
              >
                <div className="text-2xl mb-2">{c.icon}</div>
                <p className={`text-sm font-bold ${cl.text} mb-1`}>{c.title}</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {c.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Architecture tab ─────────────────────────────────────────────────────────
const PIPELINE_DETAILED = [
  {
    n: "01",
    icon: "📦",
    title: "Raw Data Ingestion",
    col: "indigo",
    what: "tweet_eval/sentiment via HuggingFace Datasets",
    details: [
      "45,615 labelled tweets",
      "3 splits: train / validation / test",
      "Labels: 0=negative, 1=neutral, 2=positive",
      "No web-scraping — reproducible benchmark",
    ],
  },
  {
    n: "02",
    icon: "🧹",
    title: "Preprocessing & Features",
    col: "blue",
    what: "Text cleaning + dual feature extraction",
    details: [
      "Lowercase, remove URLs/mentions/@",
      "Regex strips HTML & special chars",
      "TF-IDF: 20K features, (1,2)-grams",
      "Keras tokenizer: 30K vocab, MAX_LEN=64",
    ],
  },
  {
    n: "03",
    icon: "📏",
    title: "VADER Baseline",
    col: "red",
    what: "Lexicon + rule-based, no training needed",
    details: [
      "Compound score: ≥0.05 → positive",
      "Compound score: ≤−0.05 → negative",
      "Handles punctuation & capitalization",
      "Macro F1: 54.8% — sets the floor",
    ],
  },
  {
    n: "04",
    icon: "📈",
    title: "Classical ML Models",
    col: "orange",
    what: "TF-IDF features → sklearn classifiers",
    details: [
      "Logistic Regression: C=1, max_iter=1000",
      "Random Forest: 300 trees, max_depth=None",
      "LinearSVC + CalibratedClassifierCV (Platt)",
      "GridSearchCV 5-fold cross-validation",
    ],
  },
  {
    n: "05",
    icon: "🧠",
    title: "BiLSTM + Attention",
    col: "emerald",
    what: "Deep contextual model with interpretability",
    details: [
      "Embedding 128-dim, mask_zero=True",
      "Bidirectional LSTM 128u → 256-dim concat",
      "Bahdanau attention → token heatmaps",
      "EarlyStopping patience=4, ReduceLR",
    ],
  },
  {
    n: "06",
    icon: "🎯",
    title: "Consensus Voting",
    col: "violet",
    what: "Confidence-weighted ensemble across all models",
    details: [
      "Each model votes weighted by confidence",
      "Ties broken by BiLSTM (highest F1)",
      "Calibrated output = final verdict",
      "FastAPI exposes all 5 + consensus",
    ],
  },
];

const BILSTM_LAYERS = [
  {
    label: "Input",
    why: "Integer token IDs fed in sequence",
    detail: "token_ids  ·  max length 64 per tweet",
    col: "slate",
    shape: "(B, 64)",
  },
  {
    label: "Embedding",
    why: "Maps each token ID to a dense vector",
    detail: "vocab × 128-dim trainable matrix  ·  mask_zero=True",
    col: "blue",
    shape: "(B, 64, 128)",
  },
  {
    label: "BiLSTM",
    why: "Reads tweet left→right AND right→left simultaneously",
    detail: "128 units each direction  →  concatenated 256-dim output",
    col: "indigo",
    shape: "(B, 64, 256)",
  },
  {
    label: "Token Attention",
    why: "Scores each word: how much should the model focus here?",
    detail: "Learnable weights per token  ·  softmax normalised",
    col: "violet",
    shape: "(B, 256) + weights",
  },
  {
    label: "Dense + Dropout",
    why: "Compress and regularise before final decision",
    detail: "64 units ReLU  ·  dropout 0.4 prevents overfitting",
    col: "emerald",
    shape: "(B, 64)",
  },
  {
    label: "Softmax Output",
    why: "Converts scores to probabilities that sum to 1",
    detail: "3-class probability distribution over sentiment labels",
    col: "amber",
    shape: "(B, 3)",
  },
];

const MODEL_COMPARISON = [
  {
    model: "VADER",
    type: "Rule-based",
    train: "None",
    inference: "~0.1ms",
    interpretable: true,
    gpu: false,
    f1: "54.8%",
  },
  {
    model: "Logistic Regression",
    type: "Classical ML",
    train: "~30s",
    inference: "~0.5ms",
    interpretable: true,
    gpu: false,
    f1: "72.1%",
  },
  {
    model: "Random Forest",
    type: "Classical ML",
    train: "~2 min",
    inference: "~5ms",
    interpretable: false,
    gpu: false,
    f1: "68.1%",
  },
  {
    model: "SVM",
    type: "Classical ML",
    train: "~45s",
    inference: "~1ms",
    interpretable: false,
    gpu: false,
    f1: "70.9%",
  },
  {
    model: "BiLSTM",
    type: "Deep Learning",
    train: "~5 min",
    inference: "~15ms",
    interpretable: true,
    gpu: false,
    f1: "76.2%",
  },
];

function ArchTab() {
  return (
    <div className="space-y-12">
      {/* ── Hero: system overview ── */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-cyan-300">
                System Architecture
              </p>
              <h2 className="mt-2 text-3xl font-extrabold leading-tight text-white">
                Multi-Model Sentiment Pipeline
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
                A reproducible inference system that accepts raw social text,
                normalizes multilingual input, routes features into five
                independent sentiment models, and returns a calibrated
                confidence-weighted verdict with model-level explanations.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[440px]">
              {[
                ["5", "models"],
                ["3", "classes"],
                ["2", "feature paths"],
                ["1", "API"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3"
                >
                  <p className="text-2xl font-black text-white">{value}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-400">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {[
              {
                step: "01",
                title: "Input & Language Normalization",
                body: "Text can come from manual input, CSV batch rows, or live tweet evaluation. The language guard detects non-English text and translates it before inference so every model receives consistent English input.",
                items: [
                  "manual / batch / live posts",
                  "language detection",
                  "translation metadata",
                ],
                col: "blue",
              },
              {
                step: "02",
                title: "Parallel Model Inference",
                body: "The same cleaned post is split into two feature paths: TF-IDF for VADER, LR, RF, and SVM; token sequences for BiLSTM with attention. This keeps classical and neural evidence comparable.",
                items: [
                  "TF-IDF path",
                  "sequence path",
                  "per-model probabilities",
                ],
                col: "violet",
              },
              {
                step: "03",
                title: "Consensus, Explanation & UI",
                body: "FastAPI combines model probabilities using confidence-weighted voting, then React displays the final verdict, individual model cards, attention cues, history, and scaling diagnostics.",
                items: [
                  "weighted consensus",
                  "attention view",
                  "accuracy scaling",
                ],
                col: "emerald",
              },
            ].map((stage, index) => {
              const cl = C[stage.col];
              return (
                <div
                  key={stage.title}
                  className={`relative rounded-2xl border-2 p-5 ${cl.bg} ${cl.border}`}
                >
                  {index < 2 && (
                    <div className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 lg:grid">
                      →
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${cl.num} text-sm font-black text-white shadow-sm`}
                    >
                      {stage.step}
                    </div>
                    <span
                      className={`rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${cl.text} ring-1 ${cl.border}`}
                    >
                      Runtime
                    </span>
                  </div>
                  <h3 className={`mt-4 text-lg font-extrabold ${cl.text}`}>
                    {stage.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {stage.body}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-white/70 pt-4">
                    {stage.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-lg bg-white/80 px-2.5 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                Why the design is defensible
              </p>
              <div className="mt-4 space-y-3">
                {[
                  [
                    "Reproducible data",
                    "Uses tweet_eval/sentiment rather than a one-off scraped dataset.",
                  ],
                  [
                    "Independent evidence",
                    "Compares rule-based, linear, tree, margin, and neural models.",
                  ],
                  [
                    "Transparent output",
                    "Shows individual model votes, confidence, consensus, and attention.",
                  ],
                  [
                    "Scaling proof",
                    "Includes learning curves so the report can discuss data efficiency.",
                  ],
                ].map(([title, body]) => (
                  <div key={title} className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-500" />
                    <div>
                      <p className="text-sm font-extrabold text-gray-900">
                        {title}
                      </p>
                      <p className="text-xs leading-relaxed text-slate-500">
                        {body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                Model layer
              </p>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-5">
                {[
                  ["VADER", "Rule baseline", "#ef4444"],
                  ["LR", "TF-IDF linear", "#3b82f6"],
                  ["RF", "Tree ensemble", "#f97316"],
                  ["SVM", "Calibrated margin", "#8b5cf6"],
                  ["BiLSTM", "Sequence + attention", "#10b981"],
                ].map(([name, detail, color]) => (
                  <div
                    key={name}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs font-black text-gray-900">
                        {name}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-slate-500">
                      {detail}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                  Final output
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">
                  One sentiment label, calibrated confidence, per-class score
                  breakdown, model agreement count, and optional attention
                  explanation for the BiLSTM path.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 6-stage pipeline (cards) ── */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-slate-200" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            6-Stage Processing Pipeline
          </p>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {PIPELINE_DETAILED.map((p) => {
            const cl = C[p.col];
            return (
              <div
                key={p.n}
                className={`rounded-2xl border-2 p-5 ${cl.bg} ${cl.border} flex flex-col gap-3`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl ${cl.num} text-white flex items-center justify-center text-sm font-black shrink-0 shadow-sm`}
                    >
                      {p.n}
                    </div>
                    <div>
                      <p className={`text-sm font-extrabold ${cl.text}`}>
                        {p.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{p.what}</p>
                    </div>
                  </div>
                  <span className="text-2xl shrink-0">{p.icon}</span>
                </div>
                <ul className="space-y-1.5 border-t border-white/60 pt-3">
                  {p.details.map((d) => (
                    <li
                      key={d}
                      className="flex items-start gap-2 text-xs text-slate-600"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${cl.dot} mt-1 shrink-0`}
                      />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── BiLSTM deep-dive ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Layer stack */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl shrink-0 shadow-sm">
              🧠
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                BiLSTM Neural Network — Layer by Layer
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Each layer's role + output tensor shape
              </p>
            </div>
          </div>
          <div className="grid flex-1 grid-rows-6 divide-y divide-slate-100">
            {BILSTM_LAYERS.map((l, i) => {
              const cl = C[l.col];
              return (
                <div
                  key={l.label}
                  className={`flex min-h-[108px] items-start gap-4 px-5 py-5 ${cl.bg}`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl ${cl.num} text-white flex items-center justify-center text-sm font-black shrink-0 mt-0.5 shadow-sm`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className={`text-sm font-extrabold ${cl.text}`}>
                        {l.label}
                      </p>
                      <code
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${cl.border} ${cl.text} shrink-0`}
                      >
                        {l.shape}
                      </code>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">
                      {l.why}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {l.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Attention + Consensus — no extra space-y wrapper */}
        <div className="flex h-full flex-col gap-6">
          {/* Token Attention */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 bg-slate-50">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-xl shrink-0">
                👁
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Token Attention — How the Model Focuses
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Each word gets a learned importance score
                </p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Not every word matters equally. The attention layer assigns each
                token a score between 0 and 1 — the model learns during training
                which words signal sentiment. High-weight words directly drive
                the final classification, making predictions{" "}
                <span className="font-bold text-slate-800">explainable</span>.
              </p>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1">
                    Live example — model sees:
                  </p>
                  <p className="text-sm italic text-slate-600">
                    "I had high hopes but the product was terrible"
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { word: "I", w: 0.02 },
                    { word: "had", w: 0.05 },
                    { word: "high", w: 0.12 },
                    { word: "hopes", w: 0.18 },
                    { word: "but", w: 0.08 },
                    { word: "the", w: 0.01 },
                    { word: "product", w: 0.1 },
                    { word: "was", w: 0.06 },
                    { word: "terrible", w: 0.38 },
                  ].map((t) => (
                    <span
                      key={t.word}
                      className="inline-flex flex-col items-center gap-0.5"
                    >
                      <span
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold border leading-none"
                        style={{
                          backgroundColor: `rgba(239,68,68,${Math.min(t.w * 2.2, 0.85)})`,
                          borderColor: `rgba(239,68,68,${Math.min(t.w * 2.2 + 0.1, 0.9)})`,
                          color:
                            t.w > 0.2
                              ? "#7f1d1d"
                              : t.w > 0.08
                                ? "#b91c1c"
                                : "#475569",
                        }}
                      >
                        {t.word}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">
                        {(t.w * 100).toFixed(0)}%
                      </span>
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 border-t border-slate-200 pt-3">
                  <span className="font-bold text-red-600">"terrible"</span>{" "}
                  captures 38% of total attention — the model correctly
                  identifies it as the dominant negative signal and classifies
                  the tweet as <span className="font-bold">Negative</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Consensus Voting */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 bg-slate-50">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl shrink-0">
                ⚖️
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Confidence-Weighted Consensus
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  How 5 models vote to reach one final verdict
                </p>
              </div>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-500 leading-relaxed">
                A model predicting "negative at 91%" counts far more than one
                saying "neutral at 53%". The vote weight = confidence score, not
                a flat 1 per model.
              </p>
              {[
                { label: "VADER", vote: "neutral", conf: 60, color: "#94a3b8" },
                { label: "LR", vote: "negative", conf: 82, color: "#3b82f6" },
                { label: "RF", vote: "negative", conf: 74, color: "#f97316" },
                { label: "SVM", vote: "negative", conf: 88, color: "#8b5cf6" },
                {
                  label: "BiLSTM",
                  vote: "negative",
                  conf: 91,
                  color: "#10b981",
                },
              ].map((m) => (
                <div key={m.label} className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-600 w-12 shrink-0">
                    {m.label}
                  </span>
                  <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg flex items-center px-2.5 transition-all duration-700"
                      style={{
                        width: `${m.conf}%`,
                        backgroundColor: m.color + "28",
                        border: `1.5px solid ${m.color}55`,
                      }}
                    >
                      <span
                        className="text-[11px] font-bold capitalize"
                        style={{ color: m.color }}
                      >
                        {m.vote}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-600 w-8 text-right tabular-nums shrink-0">
                    {m.conf}%
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-2">
                <div>
                  <p className="text-xs font-black text-red-700 uppercase tracking-wide">
                    Weighted Verdict
                  </p>
                  <p className="text-[10px] text-red-400 mt-0.5">
                    4 models voted negative · total weight 335 vs 60
                  </p>
                </div>
                <span className="text-lg font-extrabold text-red-600 tracking-tight">
                  NEGATIVE
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Model comparison table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-gray-900">
            Model Comparison at a Glance
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Trade-offs: accuracy vs speed vs interpretability
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide font-bold">
                {[
                  "Model",
                  "Type",
                  "Training",
                  "Inference",
                  "Interpretable",
                  "GPU needed",
                  "Macro F1",
                ].map((h) => (
                  <th key={h} className="px-5 py-3 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODEL_COMPARISON.map((r, i) => (
                <tr
                  key={r.model}
                  className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i === MODEL_COMPARISON.length - 1 ? "bg-emerald-50/30" : ""}`}
                >
                  <td className="px-5 py-3 font-semibold text-gray-900">
                    {r.model}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-medium">
                      {r.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600 font-mono text-xs">
                    {r.train}
                  </td>
                  <td className="px-5 py-3 text-slate-600 font-mono text-xs">
                    {r.inference}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-lg ${r.interpretable ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}
                    >
                      {r.interpretable ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-lg ${r.gpu ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {r.gpu ? "Yes" : "No (CPU)"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-sm font-extrabold ${i === MODEL_COMPARISON.length - 1 ? "text-emerald-600" : "text-gray-800"}`}
                    >
                      {r.f1}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Design Decisions tab ─────────────────────────────────────────────────────
function DecisionsTab() {
  return (
    <div className="space-y-10">
      <SectionHeader
        tag="🎯 Rationale"
        title="Key Design Decisions"
        sub="Every major choice with the reasoning behind it"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {DECISIONS.map((d) => {
          const cl = C[d.col];
          return (
            <div
              key={d.title}
              className={`rounded-2xl border p-4 space-y-2 ${cl.bg} ${cl.border}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-xl shrink-0">{d.icon}</span>
                <p className={`text-sm font-bold ${cl.text}`}>{d.title}</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{d.body}</p>
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-100 my-2" />

      <SectionHeader tag="📅 Timeline" title="Project Phases" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PHASES.map((ph) => {
          const cl = C[ph.col];
          return (
            <div
              key={ph.n}
              className={`rounded-2xl border-l-4 border p-4 ${cl.bg} ${cl.border}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs font-black w-5 h-5 rounded-full ${cl.num} text-white flex items-center justify-center shrink-0`}
                >
                  {ph.n}
                </span>
                <span className="text-base">{ph.icon}</span>
                <span className={`text-sm font-bold ${cl.text}`}>
                  {ph.title}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{ph.out}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Phase 02 / Upgrades tab ──────────────────────────────────────────────────
function Phase02Tab() {
  return (
    <div className="space-y-8">
      <SectionHeader
        tag="🚀 Phase 02"
        title="Future Improvements"
        sub="Advanced ML and MLOps strategies to take this to production grade"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PHASE_02.map((item) => {
          const cl = C[item.col] || C.slate;
          return (
            <div
              key={item.title}
              className={`border-2 p-6 rounded-3xl ${cl.bg} ${cl.border} shadow-sm group hover:-translate-y-1 transition-transform`}
            >
              <div className="flex gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow flex-shrink-0 ${cl.num} text-white`}
                >
                  {item.icon}
                </div>
                <div className="space-y-3">
                  <h3 className={`text-xl font-bold ${cl.text}`}>
                    {item.title}
                  </h3>
                  <p className="text-gray-700 font-medium leading-relaxed">
                    {item.desc}
                  </p>

                  <ul className="list-disc pl-4 space-y-2 mt-2">
                    {item.points.map((point, idx) => {
                      const isExample = point.startsWith("Example:");
                      return (
                        <li
                          key={idx}
                          className={`text-sm ${isExample ? "italic text-gray-800 bg-white/50 p-2 rounded-md border-l-2 " + cl.border : "text-gray-600"}`}
                        >
                          {point}
                        </li>
                      );
                    })}
                  </ul>

                  <div className="flex gap-2 flex-wrap pt-3">
                    {item.items.map((t) => (
                      <span
                        key={t}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white/70 border ${cl.border} ${cl.text}`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tech Stack tab ────────────────────────────────────────────────────────────
function StackTab() {
  return (
    <div className="space-y-8">
      <SectionHeader
        tag="🛠️ Stack"
        title="Technologies Used"
        sub="Every library, framework, and tool that powers this project"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {STACK.map((s) => {
          const cl = C[s.col];
          return (
            <div
              key={s.cat}
              className={`min-h-[210px] rounded-2xl border-2 p-5 ${cl.bg} ${cl.border} shadow-sm flex flex-col`}
            >
              <div className="flex items-start justify-between gap-3 border-b border-white/70 pb-4">
                <div>
                  <p className={`text-lg font-black leading-tight ${cl.text}`}>
                    {s.cat}
                  </p>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
                <span
                  className={`h-3 w-3 rounded-full ${cl.dot} shrink-0 mt-1`}
                />
              </div>
              <ul className="mt-4 space-y-2.5">
                {s.items.map((it) => (
                  <li
                    key={it}
                    className="text-sm font-semibold text-slate-700 flex items-start gap-2 leading-snug"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${cl.dot} shrink-0 mt-1.5`}
                    />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <p className="text-lg font-black text-gray-900">Environment Setup</p>
          <p className="text-sm text-slate-500 mt-1">
            Commands to run the same stack locally.
          </p>
        </div>
        <div className="bg-slate-900 rounded-xl p-5 font-mono text-sm text-slate-300 space-y-4">
          {[
            {
              comment: "# Install Python dependencies",
              cmd: "pip install -r requirements.txt",
            },
            {
              comment: "# Start FastAPI backend",
              cmd: "python -m backend.main",
            },
            {
              comment: "# Start React frontend",
              cmd: "cd phase_05_react_ui && npm run dev",
            },
            {
              comment: "# Enable BiLSTM locally if TensorFlow is missing",
              cmd: "pip install -r requirements.txt && python -m phase_04_rnn_bilstm.02_train_rnn",
            },
            {
              comment: "# Enable live Twitter evaluation, then restart backend",
              cmd: "X_BEARER_TOKEN=your_token_here",
            },
          ].map(({ comment, cmd }) => (
            <div key={cmd}>
              <p className="text-slate-500 text-xs">{comment}</p>
              <p className="text-emerald-400 leading-relaxed">{cmd}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-500">
          Get Twitter Bearer Token → developer.twitter.com → Create App → Keys
          and Tokens → Bearer Token
        </p>
      </div>
    </div>
  );
}

// ── Accuracy Scaling tab ─────────────────────────────────────────────────────
function hexToRgba(hex, alpha) {
  const h = (hex || "#64748b").replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const SCALING_METRICS = [
  { key: "Positive_Accuracy", label: "Positive", detail: "Class recall" },
  { key: "Negative_Accuracy", label: "Negative", detail: "Class recall" },
  { key: "Neutral_Accuracy", label: "Neutral", detail: "Class recall" },
  { key: "Macro_F1", label: "Macro-F1", detail: "Balanced score" },
  {
    key: "Test_Accuracy",
    label: "Test accuracy",
    detail: "Overall held-out accuracy",
  },
  {
    key: "Accuracy_Gap",
    label: "Train-test gap",
    detail: "Overfitting signal",
  },
];

function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatPct(value, digits = 1) {
  const n = asNumber(value);
  return n === null ? "n/a" : `${n.toFixed(digits)}%`;
}

function formatRunStability(value) {
  const runs = Math.round(asNumber(value) ?? 0);
  if (!runs) return "n/a";
  return runs > 1 ? `${runs}-run mean` : "diagnostic run";
}

function formatStdBand(value) {
  const n = asNumber(value);
  return n === null || n === 0 ? "" : `+/- ${n.toFixed(1)}pp`;
}

function normalizeScalingRows(rows) {
  return rows.map((row) => {
    const pos = asNumber(row.Positive_Accuracy);
    const neg = asNumber(row.Negative_Accuracy);
    const neu = asNumber(row.Neutral_Accuracy);
    const macro = asNumber(row.Macro_F1);
    const fallbackAccuracy =
      asNumber(row.Test_Accuracy) ??
      macro ??
      [pos, neg, neu]
        .filter((v) => v !== null)
        .reduce((sum, v, _, arr) => sum + v / arr.length, 0);

    const trainAccuracy = asNumber(row.Train_Accuracy);
    return {
      ...row,
      Dataset_Fraction: asNumber(row.Dataset_Fraction) ?? 0,
      Train_Size: Math.round(asNumber(row.Train_Size) ?? 0),
      Test_Size: Math.round(asNumber(row.Test_Size) ?? 0),
      Positive_Accuracy: pos,
      Negative_Accuracy: neg,
      Neutral_Accuracy: neu,
      Macro_F1: macro,
      Test_Accuracy: fallbackAccuracy,
      Train_Accuracy: trainAccuracy,
      Accuracy_Gap:
        asNumber(row.Accuracy_Gap) ??
        (trainAccuracy !== null && fallbackAccuracy !== null
          ? trainAccuracy - fallbackAccuracy
          : null),
    };
  });
}

function metricConfig(metric) {
  return SCALING_METRICS.find((m) => m.key === metric) || SCALING_METRICS[0];
}

function ScalingChart({ rows, metric, selectedModels }) {
  const visibleRows = rows.filter(
    (r) =>
      selectedModels.includes(r.Model) &&
      asNumber(r[metric]) !== null &&
      r.Train_Size > 0,
  );
  const models = Array.from(new Set(visibleRows.map((r) => r.Model)));
  const sizes = Array.from(new Set(visibleRows.map((r) => r.Train_Size))).sort(
    (a, b) => a - b,
  );
  const W = 640,
    H = 260,
    pad = { l: 44, r: 18, t: 16, b: 34 };
  const metricValues = visibleRows
    .map((r) => r[metric])
    .filter((v) => asNumber(v) !== null);
  const rawMin = Math.min(...metricValues, metric === "Accuracy_Gap" ? 0 : 100);
  const rawMax = Math.max(...metricValues, metric === "Accuracy_Gap" ? 0 : 0);
  const yMin = metric === "Accuracy_Gap" ? Math.floor((rawMin - 3) / 5) * 5 : 0;
  const yMax =
    metric === "Accuracy_Gap" ? Math.ceil((rawMax + 3) / 5) * 5 : 100;
  const xMax = Math.log10(sizes[sizes.length - 1] || 1);
  const xMin = Math.log10(sizes[0] || 1);
  const sx = (v) =>
    pad.l + ((Math.log10(v) - xMin) / (xMax - xMin || 1)) * (W - pad.l - pad.r);
  const sy = (v) =>
    H - pad.b - ((v - yMin) / (yMax - yMin)) * (H - pad.t - pad.b);
  const yTicks =
    metric === "Accuracy_Gap"
      ? [yMin, 0, yMax].filter((v, i, arr) => arr.indexOf(v) === i)
      : [0, 25, 50, 75, 100];
  const stdKey = `${metric}_Std`;
  const clampMetric = (v) =>
    metric === "Accuracy_Gap"
      ? Math.max(yMin, Math.min(yMax, v))
      : Math.max(0, Math.min(100, v));

  if (!visibleRows.length) {
    return (
      <div className="h-56 grid place-items-center text-xs text-slate-400">
        No data for this selection.
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {yTicks.map((t) => (
        <g key={t}>
          <line
            x1={pad.l}
            x2={W - pad.r}
            y1={sy(t)}
            y2={sy(t)}
            stroke="#e2e8f0"
            strokeDasharray="3 3"
          />
          <text
            x={pad.l - 8}
            y={sy(t) + 4}
            fontSize="10"
            textAnchor="end"
            fill="#94a3b8"
          >
            {t}%
          </text>
        </g>
      ))}
      {sizes.map((s) => (
        <text
          key={s}
          x={sx(s)}
          y={H - 12}
          fontSize="10"
          textAnchor="middle"
          fill="#94a3b8"
        >
          {s >= 1000 ? `${(s / 1000).toFixed(0)}k` : s}
        </text>
      ))}
      {models.map((m) => {
        const color = MODEL_COLOR[m] || "#64748b";
        const modelRows = visibleRows
          .filter((r) => r.Model === m)
          .sort((a, b) => a.Train_Size - b.Train_Size);
        const hasStd = modelRows.some((r) => typeof r[stdKey] === "number");

        const bandPath = hasStd
          ? [
              ...modelRows.map(
                (r) =>
                  `${sx(r.Train_Size)},${sy(clampMetric(r[metric] + (r[stdKey] || 0)))}`,
              ),
              ...modelRows
                .slice()
                .reverse()
                .map(
                  (r) =>
                    `${sx(r.Train_Size)},${sy(clampMetric(r[metric] - (r[stdKey] || 0)))}`,
                ),
            ].join(" ")
          : null;

        const linePts = modelRows
          .map((r) => `${sx(r.Train_Size)},${sy(r[metric])}`)
          .join(" ");

        return (
          <g key={m}>
            {bandPath && (
              <polygon
                points={bandPath}
                fill={hexToRgba(color, 0.12)}
                stroke="none"
              />
            )}
            <polyline
              points={linePts}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
            />
            {modelRows.map((r, i) => (
              <circle
                key={i}
                cx={sx(r.Train_Size)}
                cy={sy(r[metric])}
                r="3.5"
                fill={color}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function TrainTestChart({ rows, selectedModels }) {
  const visibleRows = rows.filter(
    (r) =>
      selectedModels.includes(r.Model) &&
      asNumber(r.Train_Accuracy) !== null &&
      asNumber(r.Test_Accuracy) !== null &&
      r.Train_Size > 0,
  );
  const models = Array.from(new Set(visibleRows.map((r) => r.Model)));
  const sizes = Array.from(new Set(visibleRows.map((r) => r.Train_Size))).sort(
    (a, b) => a - b,
  );
  const W = 640,
    H = 260,
    pad = { l: 44, r: 18, t: 16, b: 34 };
  const xMax = Math.log10(sizes[sizes.length - 1] || 1);
  const xMin = Math.log10(sizes[0] || 1);
  const sx = (v) =>
    pad.l + ((Math.log10(v) - xMin) / (xMax - xMin || 1)) * (W - pad.l - pad.r);
  const sy = (v) => H - pad.b - (v / 100) * (H - pad.t - pad.b);
  const yTicks = [0, 25, 50, 75, 100];

  if (!visibleRows.length) {
    return (
      <div className="h-56 grid place-items-center text-xs text-slate-400">
        Run the updated scaling script to populate train/test gap data.
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {yTicks.map((t) => (
        <g key={t}>
          <line
            x1={pad.l}
            x2={W - pad.r}
            y1={sy(t)}
            y2={sy(t)}
            stroke="#e2e8f0"
            strokeDasharray="3 3"
          />
          <text
            x={pad.l - 8}
            y={sy(t) + 4}
            fontSize="10"
            textAnchor="end"
            fill="#94a3b8"
          >
            {t}%
          </text>
        </g>
      ))}
      {sizes.map((s) => (
        <text
          key={s}
          x={sx(s)}
          y={H - 12}
          fontSize="10"
          textAnchor="middle"
          fill="#94a3b8"
        >
          {s >= 1000 ? `${(s / 1000).toFixed(s < 10000 ? 1 : 0)}k` : s}
        </text>
      ))}
      {models.map((m) => {
        const color = MODEL_COLOR[m] || "#64748b";
        const modelRows = visibleRows
          .filter((r) => r.Model === m)
          .sort((a, b) => a.Train_Size - b.Train_Size);
        const trainPts = modelRows
          .map((r) => `${sx(r.Train_Size)},${sy(r.Train_Accuracy)}`)
          .join(" ");
        const testPts = modelRows
          .map((r) => `${sx(r.Train_Size)},${sy(r.Test_Accuracy)}`)
          .join(" ");
        return (
          <g key={m}>
            <polyline
              points={trainPts}
              fill="none"
              stroke={color}
              strokeWidth="2.2"
            />
            <polyline
              points={testPts}
              fill="none"
              stroke={color}
              strokeWidth="2.2"
              strokeDasharray="6 4"
            />
          </g>
        );
      })}
    </svg>
  );
}

function ScalingTab() {
  const [rows, setRows] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState("Positive_Accuracy");
  const [selectedModels, setSelectedModels] = useState([]);

  useEffect(() => {
    getAccuracyScaling()
      .then((data) => {
        const normalized = normalizeScalingRows(data.rows || []);
        setRows(normalized);
        setSelectedModels(Array.from(new Set(normalized.map((r) => r.Model))));
        setUpdatedAt(data.updated_at);
      })
      .catch(() => {
        const normalized = normalizeScalingRows(FALLBACK_SCALING);
        setRows(normalized);
        setSelectedModels(Array.from(new Set(normalized.map((r) => r.Model))));
        setUsingFallback(true);
      });
  }, []);

  if (!rows) {
    return (
      <div className="py-12 text-center text-slate-400 text-sm">
        Loading accuracy-scaling results…
      </div>
    );
  }

  const models = Array.from(new Set(rows.map((r) => r.Model)));
  const sizes = Array.from(new Set(rows.map((r) => r.Train_Size))).sort(
    (a, b) => a - b,
  );
  const activeModels = selectedModels.length ? selectedModels : models;
  const availableMetrics = SCALING_METRICS.filter((metric) =>
    rows.some((r) => asNumber(r[metric.key]) !== null),
  );
  const activeMetric = availableMetrics.some((m) => m.key === selectedMetric)
    ? selectedMetric
    : availableMetrics[0]?.key || "Positive_Accuracy";
  const activeMetricConfig = metricConfig(activeMetric);
  const byModelAtMax = models.map((m) => {
    const row = rows.find(
      (r) => r.Model === m && r.Train_Size === sizes[sizes.length - 1],
    );
    return { model: m, ...row };
  });
  const peakRows = models
    .map(
      (m) =>
        rows
          .filter((r) => r.Model === m && asNumber(r.Test_Accuracy) !== null)
          .sort((a, b) => b.Test_Accuracy - a.Test_Accuracy)[0],
    )
    .filter(Boolean)
    .sort((a, b) => b.Test_Accuracy - a.Test_Accuracy);
  const bestFinal = BENCHMARK[0];
  const sortedRows = rows
    .filter((r) => activeModels.includes(r.Model))
    .sort(
      (a, b) => a.Train_Size - b.Train_Size || a.Model.localeCompare(b.Model),
    );
  const scaleGroups = Array.from(
    sortedRows
      .reduce((map, row) => {
        const key = row.Train_Size;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(row);
        return map;
      }, new Map())
      .entries(),
  ).map(([trainSize, groupRows]) => {
    const orderedRows = groupRows
      .slice()
      .sort(
        (a, b) =>
          (asNumber(b.Test_Accuracy) ?? -1) - (asNumber(a.Test_Accuracy) ?? -1),
      );
    const first = orderedRows[0] || {};
    return {
      trainSize,
      testSize: first.Test_Size,
      fraction: first.Dataset_Fraction,
      bestModel: first.Model,
      rows: orderedRows,
    };
  });

  const toggleModel = (model) => {
    setSelectedModels((current) => {
      const active = current.length ? current : models;
      if (active.includes(model)) {
        return active.length === 1 ? active : active.filter((m) => m !== model);
      }
      return [...active, model];
    });
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        tag="📈 Accuracy & Scaling"
        title="Per-Class Accuracy as Dataset Size Grows"
        sub="Learning-curve diagnostics across model families, class recalls, macro-F1, and train/test accuracy"
      />

      {usingFallback && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
          <span>⚠️</span>
          Live data not available — showing sample scaling curves. Run
          <code className="mx-1 font-mono bg-amber-100 px-1 rounded">
            phase_03_classical_models/07_accuracy_scaling.py --include-bilstm
          </code>
          and restart the API to see live numbers.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.65fr] gap-4">
        <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                How to read the lower accuracy
              </p>
              <h3 className="mt-1 text-xl font-extrabold text-gray-900">
                This is a scaling diagnostic, not the final tuned benchmark
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
                Each point retrains models under the same lightweight budget so
                we can measure whether more data improves held-out accuracy. The
                final tuned benchmark is still reported separately in
                Performance Metrics, where BiLSTM reaches{" "}
                <span className="font-black text-emerald-700">
                  {(bestFinal.f1 * 100).toFixed(1)}% macro-F1
                </span>
                .
              </p>
            </div>
            <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 ring-1 ring-blue-100">
              Purpose: trend analysis, not leaderboard score
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                title: "Why accuracy is lower",
                body: "The run measures strict 3-class accuracy. Neutral tweets are ambiguous, short, and often context-dependent.",
                col: "amber",
              },
              {
                title: "Why BiLSTM is lower here",
                body: "The scaling sweep retrains a compact model per fraction for speed; the final BiLSTM uses the tuned training setup.",
                col: "emerald",
              },
              {
                title: "How to increase it",
                body: "Use the full BiLSTM recipe per fraction, class weights or focal loss, threshold calibration, and a transformer encoder.",
                col: "violet",
              },
            ].map((item) => {
              const cl = C[item.col];
              return (
                <div
                  key={item.title}
                  className={`rounded-2xl border p-4 ${cl.bg} ${cl.border}`}
                >
                  <p className={`text-sm font-extrabold ${cl.text}`}>
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {item.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-cyan-300">
            Benchmark context
          </p>
          <p className="mt-3 text-4xl font-black">
            {(bestFinal.f1 * 100).toFixed(1)}%
          </p>
          <p className="mt-1 text-sm font-bold text-slate-200">
            final BiLSTM macro-F1
          </p>
          <p className="mt-4 text-xs leading-relaxed text-slate-400">
            The lower scaling accuracy is expected because this panel isolates
            data-size sensitivity. The headline model quality is the final tuned
            benchmark, while this panel explains why more data helps and where
            it plateaus.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide font-extrabold text-slate-400">
              Metric
            </p>
            <h3 className="text-lg font-extrabold text-gray-900">
              {activeMetricConfig.label}
            </h3>
            <p className="text-xs text-slate-500">
              {activeMetricConfig.detail}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableMetrics.map((metric) => (
              <button
                key={metric.key}
                type="button"
                onClick={() => setSelectedMetric(metric.key)}
                className={`px-3 py-2 rounded-lg text-xs font-extrabold border transition ${
                  activeMetric === metric.key
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:border-indigo-200 hover:text-indigo-700"
                }`}
              >
                {metric.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {models.map((m) => {
            const isActive = activeModels.includes(m);
            return (
              <button
                key={m}
                type="button"
                onClick={() => toggleModel(m)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition ${
                  isActive
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: MODEL_COLOR[m] || "#64748b" }}
                />
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* Peak diagnostic cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {peakRows.map((item) => {
          const color = MODEL_COLOR[item.Model] || "#64748b";
          return (
            <div
              key={item.Model}
              className="rounded-2xl border bg-white p-4 shadow-sm"
              style={{ borderColor: `${color}55` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <p className="text-xs font-extrabold text-gray-900">
                  {item.Model}
                </p>
              </div>
              <p className="text-2xl font-black text-gray-900">
                {formatPct(item.Test_Accuracy)}
              </p>
              <p className="text-[11px] text-slate-500 leading-snug mt-1">
                peak diagnostic accuracy at {item.Train_Size?.toLocaleString()}{" "}
                training samples
              </p>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                  {formatRunStability(item.Seeds_Used)}
                </span>
                {formatStdBand(item.Test_Accuracy_Std) && (
                  <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">
                    {formatStdBand(item.Test_Accuracy_Std)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center">
        {models.map((m) => (
          <div
            key={m}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700"
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: MODEL_COLOR[m] || "#64748b" }}
            />
            {m}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="mb-3">
            <h3 className="text-base font-bold text-gray-900">
              {activeMetricConfig.label} Scaling Curve
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Mean across repeat runs with shaded standard-deviation bands ·
              log-scaled X axis
            </p>
          </div>
          <ScalingChart
            rows={rows}
            metric={activeMetric}
            selectedModels={activeModels}
          />
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="mb-3">
            <h3 className="text-base font-bold text-gray-900">
              Train vs Test Accuracy Gap
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Solid = train accuracy · dashed = test accuracy
            </p>
          </div>
          <TrainTestChart rows={rows} selectedModels={activeModels} />
        </div>
      </div>

      {/* Insight cards */}
      <div>
        <SectionHeader
          tag="💡 Findings"
          title="What the Scaling Curves Tell Us"
          sub="Use these points when explaining why the diagnostic accuracy is lower than the final benchmark"
        />
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "No contradiction",
              body: "Performance Metrics reports the final tuned benchmark. This tab reports a controlled learning-curve experiment, so its accuracy can be lower.",
              col: "blue",
            },
            {
              title: "Main bottleneck",
              body: "Neutral is the hardest class because tweets can be factual, sarcastic, or emotionally weak. That pulls strict 3-class accuracy down.",
              col: "amber",
            },
            {
              title: "Best next upgrade",
              body: "Run the full BiLSTM/transformer training recipe for every fraction and tune class weights. That is the fastest credible path above this diagnostic range.",
              col: "emerald",
            },
          ].map((item) => {
            const cl = C[item.col];
            return (
              <div
                key={item.title}
                className={`rounded-2xl border p-4 ${cl.bg} ${cl.border}`}
              >
                <p className={`text-sm font-extrabold ${cl.text}`}>
                  {item.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {item.body}
                </p>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {byModelAtMax.map((m) => {
            const deltaValue =
              asNumber(m.Negative_Accuracy) !== null &&
              asNumber(m.Positive_Accuracy) !== null
                ? m.Negative_Accuracy - m.Positive_Accuracy
                : null;
            const color = MODEL_COLOR[m.model] || "#64748b";
            return (
              <div
                key={m.model}
                className="rounded-2xl border p-4 bg-white shadow-sm"
                style={{ borderColor: `${color}55` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <p className="text-sm font-extrabold text-gray-900">
                    {m.model}
                  </p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  At full scale ({m.Train_Size?.toLocaleString()} samples):{" "}
                  <span className="font-bold text-emerald-700">
                    {formatPct(m.Positive_Accuracy)}
                  </span>{" "}
                  positive /{" "}
                  <span className="font-bold text-red-700">
                    {formatPct(m.Negative_Accuracy)}
                  </span>{" "}
                  negative /{" "}
                  <span className="font-bold text-slate-700">
                    {formatPct(m.Neutral_Accuracy)}
                  </span>{" "}
                  neutral. Negative is{" "}
                  {deltaValue === null
                    ? "n/a"
                    : `${deltaValue >= 0 ? "+" : ""}${deltaValue.toFixed(1)}pp`}{" "}
                  vs positive.
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed scale cards */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Detailed Learning-Curve Results
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {updatedAt
                ? `Last refreshed ${new Date(updatedAt).toLocaleString()}`
                : "Mean per-class recall × training-set size"}{" "}
              · grouped by training size for easier comparison
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold">
            {models.length} models · {sizes.length} scales
          </span>
        </div>
        <div className="space-y-4 bg-slate-50 p-4 sm:p-5">
          {scaleGroups.map((group) => {
            const best = group.rows[0];
            return (
              <section
                key={group.trainSize}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-col gap-3 border-b border-slate-100 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {(asNumber(group.fraction) * 100).toFixed(0)}% dataset
                      fraction
                    </p>
                    <h4 className="mt-1 text-lg font-extrabold text-gray-900">
                      {group.trainSize.toLocaleString()} training samples
                    </h4>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {group.testSize ? group.testSize.toLocaleString() : "n/a"}{" "}
                      held-out test samples
                    </p>
                  </div>
                  {best && (
                    <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm ring-1 ring-emerald-200">
                      <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">
                        Best at this scale
                      </p>
                      <p className="mt-1 font-extrabold text-emerald-800">
                        {best.Model} · {formatPct(best.Test_Accuracy)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-5">
                  {group.rows.map((r) => {
                    const color = MODEL_COLOR[r.Model] || "#64748b";
                    const gap = asNumber(r.Accuracy_Gap);
                    const gapTone =
                      gap === null
                        ? "bg-slate-100 text-slate-500 ring-slate-200"
                        : gap > 25
                          ? "bg-red-50 text-red-700 ring-red-200"
                          : gap > 10
                            ? "bg-amber-50 text-amber-700 ring-amber-200"
                            : "bg-emerald-50 text-emerald-700 ring-emerald-200";
                    const gapLabel =
                      gap === null
                        ? "gap n/a"
                        : gap > 25
                          ? "overfit risk"
                          : gap > 10
                            ? "moderate gap"
                            : "stable gap";
                    const classMetrics = [
                      ["Positive", r.Positive_Accuracy, "#059669"],
                      ["Negative", r.Negative_Accuracy, "#dc2626"],
                      ["Neutral", r.Neutral_Accuracy, "#64748b"],
                    ];
                    return (
                      <article
                        key={`${group.trainSize}-${r.Model}`}
                        className="rounded-2xl border bg-white p-4 shadow-sm"
                        style={{ borderColor: `${color}44` }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            <p className="truncate text-sm font-extrabold text-gray-900">
                              {r.Model}
                            </p>
                          </div>
                          {r.Model === group.bestModel && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 ring-1 ring-emerald-200">
                              Best
                            </span>
                          )}
                        </div>

                        <div className="mt-4">
                          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                            Test accuracy
                          </p>
                          <p className="mt-1 text-3xl font-black text-gray-900">
                            {formatPct(r.Test_Accuracy)}
                          </p>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <div className="rounded-xl bg-indigo-50 px-3 py-2 ring-1 ring-indigo-100">
                            <p className="text-[10px] font-black uppercase tracking-wide text-indigo-500">
                              Macro-F1
                            </p>
                            <p className="mt-1 text-sm font-extrabold text-indigo-800">
                              {formatPct(r.Macro_F1)}
                            </p>
                          </div>
                          <div
                            className={`rounded-xl px-3 py-2 ring-1 ${gapTone}`}
                          >
                            <p className="text-[10px] font-black uppercase tracking-wide">
                              {gapLabel}
                            </p>
                            <p className="mt-1 text-sm font-extrabold">
                              {formatPct(r.Accuracy_Gap)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                          {classMetrics.map(([label, value, metricColor]) => {
                            const pct = asNumber(value) ?? 0;
                            return (
                              <div key={label}>
                                <div className="mb-1 flex items-center justify-between gap-2">
                                  <span className="text-[11px] font-bold text-slate-600">
                                    {label}
                                  </span>
                                  <span className="text-[11px] font-black text-slate-700">
                                    {formatPct(value)}
                                  </span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${Math.max(0, Math.min(100, pct))}%`,
                                      backgroundColor: metricColor,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                          <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                            Reliability
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">
                            {formatRunStability(r.Seeds_Used)}
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: "metrics", label: "Performance Metrics", icon: "📊" },
  { id: "scaling", label: "Accuracy & Scaling", icon: "📈" },
  { id: "arch", label: "Architecture", icon: "🏗" },
  { id: "decisions", label: "Design Decisions", icon: "🎯" },
  { id: "phase02", label: "Phase 02", icon: "🚀" },
  { id: "stack", label: "Tech Stack", icon: "🛠" },
];

export default function Project() {
  const [tab, setTab] = useState("metrics");

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-bold">
          📁 Project Overview
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900">
          Sentiment Analysis <span className="text-gradient">Project</span>
        </h1>
        <p className="text-slate-500 text-base max-w-2xl mx-auto">
          End-to-end multi-model sentiment pipeline — performance benchmarks,
          architecture, design rationale, and tech stack.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 flex-wrap justify-center">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200
                        ${
                          tab === t.id
                            ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200/60"
                            : "text-slate-600 hover:text-gray-900 hover:bg-slate-100 border border-slate-200"
                        }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "metrics" && <MetricsTab />}
      {tab === "scaling" && <ScalingTab />}
      {tab === "arch" && <ArchTab />}
      {tab === "decisions" && <DecisionsTab />}
      {tab === "phase02" && <Phase02Tab />}
      {tab === "stack" && <StackTab />}
    </div>
  );
}

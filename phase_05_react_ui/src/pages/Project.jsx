import { useState } from 'react'

// ── Data ─────────────────────────────────────────────────────────────────────
const BENCHMARK = [
  { model: 'BiLSTM',              f1: 0.762, precision: 0.758, recall: 0.771, type: 'Deep Learning', color: '#10b981', bg: 'bg-emerald-500' },
  { model: 'Logistic Regression', f1: 0.721, precision: 0.718, recall: 0.725, type: 'Classical ML',  color: '#3b82f6', bg: 'bg-blue-500'    },
  { model: 'SVM',                 f1: 0.709, precision: 0.705, recall: 0.714, type: 'Classical ML',  color: '#8b5cf6', bg: 'bg-violet-500'  },
  { model: 'Random Forest',       f1: 0.681, precision: 0.674, recall: 0.692, type: 'Classical ML',  color: '#f97316', bg: 'bg-orange-500'  },
  { model: 'VADER',               f1: 0.548, precision: 0.531, recall: 0.563, type: 'Rule-based',    color: '#ef4444', bg: 'bg-red-500'     },
]

const CLASS_DIST = [
  { label: 'Neutral',  pct: 40.2, count: '18,318', color: '#94a3b8', bg: 'bg-slate-400'   },
  { label: 'Positive', pct: 31.3, count: '14,274', color: '#10b981', bg: 'bg-emerald-500' },
  { label: 'Negative', pct: 28.5, count: '13,023', color: '#ef4444', bg: 'bg-red-500'     },
]

const PIPELINE = [
  { n: '01', icon: '📦', title: 'Raw Data',          desc: '45,615 tweets · tweet_eval/sentiment · HuggingFace',      col: 'indigo' },
  { n: '02', icon: '🧹', title: 'Clean & Feature',   desc: 'Regex cleaning · TF-IDF 20K · Keras tokenizer 30K vocab', col: 'blue'   },
  { n: '03', icon: '📏', title: 'VADER',              desc: 'Lexicon rule-based · compound score thresholding',         col: 'red'    },
  { n: '04', icon: '📈', title: 'Classical ML',       desc: 'LR · RF · SVM (CalibratedCV) · GridSearchCV tuning',      col: 'orange' },
  { n: '05', icon: '🧠', title: 'BiLSTM + Attention', desc: 'Bahdanau attention · 128-dim LSTM · EarlyStopping',       col: 'emerald'},
  { n: '06', icon: '⚡', title: 'API + React UI',     desc: 'FastAPI · React 18 · Vite · TailwindCSS · Live eval',     col: 'violet' },
]

const LAYERS = [
  { label: 'Input',           detail: 'token_ids · shape (batch, 64)',                          col: 'slate'   },
  { label: 'Embedding',       detail: 'vocab × 128-dim · mask_zero=True',                       col: 'blue'    },
  { label: 'BiLSTM',          detail: '128 units fwd + 128 bwd → 256-dim · return_sequences',   col: 'indigo'  },
  { label: 'Attention',       detail: 'Bahdanau · context vector 256-dim · token weights',      col: 'violet'  },
  { label: 'Dense + Dropout', detail: '64 units ReLU · dropout 0.4',                            col: 'emerald' },
  { label: 'Softmax',         detail: '3 classes · negative · neutral · positive',               col: 'amber'   },
]

const DECISIONS = [
  { icon: '📦', title: 'Why tweet_eval/sentiment?',    body: 'Standardised benchmark used in 100+ papers — gives comparable, reproducible results without dataset-collection overhead.',                                                col: 'indigo'  },
  { icon: '3️⃣', title: 'Why 3 classes, not 2?',       body: 'Real social media is rarely binary. Neutral captures ambiguous, factual, or context-dependent posts that binary systems misclassify.',                                  col: 'blue'    },
  { icon: '🔢', title: 'TF-IDF 20K + (1,2)-grams?',   body: 'Bigrams capture "not good", "very bad" patterns unigrams miss. 20K covers 95%+ vocab while keeping memory and training time manageable.',                              col: 'orange'  },
  { icon: '⚡', title: 'CalibratedClassifierCV for SVM?', body: 'LinearSVC is margin-based with no probabilities. Platt scaling adds calibrated confidence scores — essential for the consensus voting system.',                    col: 'violet'  },
  { icon: '🧠', title: 'BiLSTM over BERT?',            body: 'BiLSTM trains in <5 min on CPU, needs no GPU, and achieves 76% macro-F1 vs BERT\'s ~82%. Acceptable tradeoff for a coursework environment.',                         col: 'emerald' },
  { icon: '👁', title: 'Bahdanau Attention?',          body: 'Provides token-level importance weights — interpretable heatmaps show *why* the model chose a label, not just *what* it chose.',                                       col: 'red'     },
]

const PHASES = [
  { n: 1, icon: '📊', title: 'Data Exploration',    out: '45,615 tweets loaded · class imbalance confirmed · word clouds & length analysis',   col: 'indigo'  },
  { n: 2, icon: '⚙️', title: 'Feature Engineering', out: 'TF-IDF 20K features · Keras tokenizer 30K vocab · MAX_LEN=60 covers 97% sequences', col: 'blue'    },
  { n: 3, icon: '🤖', title: 'Classical ML',        out: 'VADER 54.8% → LR 72.1% → RF 68.1% → SVM 70.9% macro-F1',                           col: 'orange'  },
  { n: 4, icon: '🧠', title: 'BiLSTM',              out: '76.2% macro-F1 · Bahdanau attention heatmaps · EarlyStopping at epoch 11',           col: 'emerald' },
  { n: 5, icon: '📈', title: 'Benchmarking',        out: 'Radar + confusion matrices + PR curves + t-SNE · Plotly interactive charts',          col: 'violet'  },
  { n: 6, icon: '🚀', title: 'Deployment',          out: 'FastAPI REST API · React 18 SPA · Live tweet eval · Confidence-weighted consensus',   col: 'red'     },
]

const STACK = [
  { cat: 'Dataset',        items: ['tweet_eval/sentiment', 'HuggingFace Datasets', '45,615 tweets'],            col: 'indigo'  },
  { cat: 'NLP / Features', items: ['TF-IDF (scikit-learn)', 'Keras Tokenizer', 'VADER SentimentAnalyzer'],      col: 'blue'    },
  { cat: 'Classical ML',   items: ['Logistic Regression', 'Random Forest (300 trees)', 'LinearSVC + Calibration'], col: 'orange' },
  { cat: 'Deep Learning',  items: ['TensorFlow / Keras', 'BiLSTM + Bahdanau Attention', 'EarlyStopping + ReduceLR'], col: 'emerald'},
  { cat: 'Backend',        items: ['FastAPI', 'Pydantic v2', 'Uvicorn · CORS middleware'],                       col: 'violet'  },
  { cat: 'Frontend',       items: ['React 18 + Vite 5', 'TailwindCSS 3.4', 'Recharts 2.12'],                    col: 'red'     },
]

// ── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  indigo:  { bg: 'bg-indigo-50',  border: 'border-indigo-200',  text: 'text-indigo-700',  num: 'bg-indigo-600',  dot: 'bg-indigo-500'  },
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    num: 'bg-blue-600',    dot: 'bg-blue-500'    },
  red:     { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     num: 'bg-red-600',     dot: 'bg-red-500'     },
  orange:  { bg: 'bg-orange-50',  border: 'border-orange-200',  text: 'text-orange-700',  num: 'bg-orange-600',  dot: 'bg-orange-500'  },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', num: 'bg-emerald-600', dot: 'bg-emerald-500' },
  violet:  { bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-700',  num: 'bg-violet-600',  dot: 'bg-violet-500'  },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   num: 'bg-amber-600',   dot: 'bg-amber-500'   },
  slate:   { bg: 'bg-slate-50',   border: 'border-slate-200',   text: 'text-slate-700',   num: 'bg-slate-600',   dot: 'bg-slate-500'   },
}

// ── Tiny shared components ───────────────────────────────────────────────────
function SectionHeader({ tag, title, sub }) {
  return (
    <div className="text-center space-y-2 mb-8">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">{tag}</div>
      <h2 className="text-2xl font-extrabold text-gray-900">{title}</h2>
      {sub && <p className="text-slate-500 text-sm max-w-xl mx-auto">{sub}</p>}
    </div>
  )
}

// ── Performance Metrics tab ──────────────────────────────────────────────────
function MetricsTab() {
  const best = BENCHMARK[0]
  const vader = BENCHMARK[BENCHMARK.length - 1]
  const gain = ((best.f1 - vader.f1) * 100).toFixed(1)

  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: '🏆', label: 'Best Model',    val: best.model,                     sub: `F1: ${best.f1.toFixed(3)}`, color: '#10b981' },
          { icon: '📈', label: 'Best Macro F1', val: `${(best.f1*100).toFixed(1)}%`, sub: `+${gain}pp vs VADER`,       color: '#4f46e5' },
          { icon: '🤖', label: 'Models Tested', val: '5',                            sub: 'VADER · LR · RF · SVM · BiLSTM', color: '#0891b2' },
          { icon: '🏷️', label: 'Classes',       val: '3',                            sub: 'Neg · Neutral · Positive',   color: '#d97706' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="text-2xl mb-3">{k.icon}</div>
            <div className="text-2xl font-extrabold" style={{ color: k.color }}>{k.val}</div>
            <div className="text-sm font-semibold text-gray-700 mt-0.5">{k.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Benchmark table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Model Benchmark</h3>
            <p className="text-xs text-slate-400 mt-0.5">Ranked by Macro F1 · tweet_eval test split · 9,122 samples</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold">5 models</span>
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
                <tr key={row.model} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i === 0 ? 'bg-emerald-50/40' : ''}`}>
                  <td className="px-5 py-4 text-slate-400 font-mono font-bold text-xs">#{i+1}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                      <span className={`font-semibold ${i === 0 ? 'text-emerald-700' : 'text-gray-900'}`}>{row.model}</span>
                      {i === 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold border border-emerald-200">BEST</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4"><span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium">{row.type}</span></td>
                  <td className="px-5 py-4 text-right"><span className={`text-base font-extrabold ${i === 0 ? 'text-emerald-600' : 'text-gray-800'}`}>{row.f1.toFixed(4)}</span></td>
                  <td className="px-5 py-4 text-right text-gray-600 font-mono">{row.precision.toFixed(4)}</td>
                  <td className="px-5 py-4 text-right text-gray-600 font-mono">{row.recall.toFixed(4)}</td>
                  <td className="px-5 py-4">
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${row.f1 * 100}%`, backgroundColor: row.color }} />
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
        <h3 className="text-base font-bold text-gray-900 mb-1">Macro F1 Score — Visual Comparison</h3>
        <p className="text-xs text-slate-400 mb-6">Higher is better · max 1.0 · dashed line = 0.7 target</p>
        <div className="space-y-4">
          {BENCHMARK.map(row => (
            <div key={row.model} className="flex items-center gap-4">
              <div className="w-36 shrink-0 text-right text-sm font-semibold text-slate-700">{row.model}</div>
              <div className="flex-1 relative h-8 bg-slate-100 rounded-xl overflow-hidden">
                <div className="absolute inset-0 flex items-center" style={{ left: '70%' }}>
                  <div className="w-px h-full bg-slate-400/50 border-l border-dashed border-slate-400" />
                </div>
                <div className="h-full rounded-xl flex items-center pr-3 justify-end transition-all duration-700"
                     style={{ width: `${row.f1 * 100}%`, backgroundColor: row.color + '22', border: `2px solid ${row.color}55` }}>
                  <span className="text-xs font-extrabold" style={{ color: row.color }}>{row.f1.toFixed(3)}</span>
                </div>
              </div>
              <div className="w-20 shrink-0 text-xs text-slate-400 font-mono">{row.type}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
          <div className="w-4 border-t-2 border-dashed border-slate-400" />
          <span className="text-xs text-slate-400">0.7 target threshold</span>
        </div>
      </div>

      {/* Dataset stats + class distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Dataset Statistics</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Samples',    val: '45,615', color: '#4f46e5' },
              { label: 'Training Set',     val: '36,493', color: '#3b82f6' },
              { label: 'Test Set',         val: '9,122',  color: '#8b5cf6' },
              { label: 'Vocab Size',       val: '~25K',   color: '#0891b2' },
              { label: 'Avg Tweet Length', val: '71 chars', color: '#d97706' },
              { label: 'Sentiment Classes',val: '3',      color: '#dc2626' },
            ].map(s => (
              <div key={s.label} className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                <div className="text-lg font-extrabold" style={{ color: s.color }}>{s.val}</div>
                <div className="text-xs text-slate-500 mt-0.5 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Class Distribution</h3>
          <div className="space-y-4">
            {CLASS_DIST.map(cl => (
              <div key={cl.label} className="flex items-center gap-3">
                <div className="w-20 shrink-0 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cl.color }} />
                  <span className="text-sm font-semibold text-gray-700">{cl.label}</span>
                </div>
                <div className="flex-1 h-7 bg-slate-100 rounded-xl overflow-hidden">
                  <div className="h-full rounded-xl flex items-center px-3"
                       style={{ width: `${cl.pct}%`, backgroundColor: cl.color + '28', border: `2px solid ${cl.color}50` }}>
                    <span className="text-xs font-bold" style={{ color: cl.color }}>{cl.pct}%</span>
                  </div>
                </div>
                <span className="text-sm text-slate-500 font-mono w-14 text-right">{cl.count}</span>
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
            { icon: '🏆', title: 'BiLSTM wins',        body: '76.2% macro-F1 — 21.4 points above VADER baseline. Contextual embeddings capture sarcasm and negation that rule-based systems miss.',                   col: 'emerald' },
            { icon: '⚡', title: 'SVM is close',        body: '70.9% macro-F1 with 100× faster inference than BiLSTM. Strong choice when latency matters and GPU is unavailable.',                                     col: 'violet'  },
            { icon: '😐', title: 'Neutral is hardest',  body: 'All models struggle with the neutral class — it has the lowest per-class F1. Neutral tweets lack discriminative lexical signals.',                       col: 'amber'   },
            { icon: '🎯', title: 'Calibration matters', body: 'Confidence-weighted consensus outperforms simple majority voting — especially on short, ambiguous texts where models disagree.',                          col: 'blue'    },
          ].map(c => {
            const cl = C[c.col]
            return (
              <div key={c.title} className={`rounded-2xl border p-4 ${cl.bg} ${cl.border}`}>
                <div className="text-2xl mb-2">{c.icon}</div>
                <p className={`text-sm font-bold ${cl.text} mb-1`}>{c.title}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{c.body}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Architecture tab ─────────────────────────────────────────────────────────
const PIPELINE_DETAILED = [
  {
    n: '01', icon: '📦', title: 'Raw Data Ingestion', col: 'indigo',
    what: 'tweet_eval/sentiment via HuggingFace Datasets',
    details: ['45,615 labelled tweets', '3 splits: train / validation / test', 'Labels: 0=negative, 1=neutral, 2=positive', 'No web-scraping — reproducible benchmark'],
  },
  {
    n: '02', icon: '🧹', title: 'Preprocessing & Features', col: 'blue',
    what: 'Text cleaning + dual feature extraction',
    details: ['Lowercase, remove URLs/mentions/@', 'Regex strips HTML & special chars', 'TF-IDF: 20K features, (1,2)-grams', 'Keras tokenizer: 30K vocab, MAX_LEN=64'],
  },
  {
    n: '03', icon: '📏', title: 'VADER Baseline', col: 'red',
    what: 'Lexicon + rule-based, no training needed',
    details: ['Compound score: ≥0.05 → positive', 'Compound score: ≤−0.05 → negative', 'Handles punctuation & capitalization', 'Macro F1: 54.8% — sets the floor'],
  },
  {
    n: '04', icon: '📈', title: 'Classical ML Models', col: 'orange',
    what: 'TF-IDF features → sklearn classifiers',
    details: ['Logistic Regression: C=1, max_iter=1000', 'Random Forest: 300 trees, max_depth=None', 'LinearSVC + CalibratedClassifierCV (Platt)', 'GridSearchCV 5-fold cross-validation'],
  },
  {
    n: '05', icon: '🧠', title: 'BiLSTM + Attention', col: 'emerald',
    what: 'Deep contextual model with interpretability',
    details: ['Embedding 128-dim, mask_zero=True', 'Bidirectional LSTM 128u → 256-dim concat', 'Bahdanau attention → token heatmaps', 'EarlyStopping patience=4, ReduceLR'],
  },
  {
    n: '06', icon: '🎯', title: 'Consensus Voting', col: 'violet',
    what: 'Confidence-weighted ensemble across all models',
    details: ['Each model votes weighted by confidence', 'Ties broken by BiLSTM (highest F1)', 'Calibrated output = final verdict', 'FastAPI exposes all 5 + consensus'],
  },
]

const BILSTM_LAYERS = [
  { label: 'Input',              why: 'Integer token IDs fed in sequence',                  detail: 'token_ids  ·  max length 64 per tweet',                     col: 'slate',   shape: '(B, 64)'           },
  { label: 'Embedding',         why: 'Maps each token ID to a dense vector',                detail: 'vocab × 128-dim trainable matrix  ·  mask_zero=True',       col: 'blue',    shape: '(B, 64, 128)'      },
  { label: 'BiLSTM',            why: 'Reads tweet left→right AND right→left simultaneously', detail: '128 units each direction  →  concatenated 256-dim output', col: 'indigo',  shape: '(B, 64, 256)'      },
  { label: 'Token Attention',   why: 'Scores each word: how much should the model focus here?', detail: 'Learnable weights per token  ·  softmax normalised',    col: 'violet',  shape: '(B, 256) + weights'},
  { label: 'Dense + Dropout',   why: 'Compress and regularise before final decision',        detail: '64 units ReLU  ·  dropout 0.4 prevents overfitting',        col: 'emerald', shape: '(B, 64)'           },
  { label: 'Softmax Output',    why: 'Converts scores to probabilities that sum to 1',       detail: '3-class probability distribution over sentiment labels',     col: 'amber',   shape: '(B, 3)'            },
]

const MODEL_COMPARISON = [
  { model: 'VADER',               type: 'Rule-based',    train: 'None',    inference: '~0.1ms', interpretable: true,  gpu: false, f1: '54.8%' },
  { model: 'Logistic Regression', type: 'Classical ML',  train: '~30s',    inference: '~0.5ms', interpretable: true,  gpu: false, f1: '72.1%' },
  { model: 'Random Forest',       type: 'Classical ML',  train: '~2 min',  inference: '~5ms',   interpretable: false, gpu: false, f1: '68.1%' },
  { model: 'SVM',                 type: 'Classical ML',  train: '~45s',    inference: '~1ms',   interpretable: false, gpu: false, f1: '70.9%' },
  { model: 'BiLSTM',              type: 'Deep Learning', train: '~5 min',  inference: '~15ms',  interpretable: true,  gpu: false, f1: '76.2%' },
]

function ArchTab() {
  return (
    <div className="space-y-12">

      {/* ── Hero: system overview ── */}
      <div className="relative bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl overflow-hidden">
        <div className="absolute inset-0"
             style={{ backgroundImage: 'radial-gradient(circle at 15% 60%, rgba(99,102,241,0.25) 0%, transparent 50%), radial-gradient(circle at 85% 20%, rgba(16,185,129,0.2) 0%, transparent 45%)' }} />
        <div className="relative z-10 p-8 pb-0">
          <p className="text-xs font-black uppercase tracking-widest text-indigo-300 mb-2">System Architecture</p>
          <h2 className="text-3xl font-extrabold text-white mb-3">Multi-Model Sentiment Pipeline</h2>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            A layered architecture combining rule-based lexicons, classical ML classifiers, and a deep contextual model —
            fused through confidence-weighted consensus and served via REST API.
          </p>
        </div>

        {/* Flow diagram — full-width strip */}
        <div className="relative z-10 mt-8 px-8 pb-8">
          <div className="flex items-stretch gap-0 rounded-2xl overflow-hidden border border-white/10">
            {[
              { n:'1', label:'Raw Tweet',  sub:'User input text',          icon:'💬', bg:'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950', border:'border-slate-400/30' },
              { n:'2', label:'Preprocess', sub:'Clean · normalise · tokenise', icon:'🧹', bg:'bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-800', border:'border-cyan-300/30' },
              { n:'3', label:'5 Models',   sub:'VADER · LR · RF · SVM · BiLSTM', icon:'🤖', bg:'bg-gradient-to-br from-indigo-600 via-violet-700 to-purple-800', border:'border-indigo-300/30' },
              { n:'4', label:'Consensus',  sub:'Confidence-weighted vote',  icon:'⚖️', bg:'bg-gradient-to-br from-fuchsia-600 via-violet-700 to-indigo-800', border:'border-fuchsia-300/30' },
              { n:'5', label:'Verdict',    sub:'Positive · Neutral · Negative · Mixed', icon:'✅', bg:'bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800', border:'border-emerald-300/30' },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center flex-1 min-w-0">
                <div className={`relative flex-1 min-h-[170px] flex flex-col items-center justify-center gap-3 overflow-hidden py-7 px-4 ${step.bg} border-r ${step.border} text-center shadow-inner`}>
                  <div className="absolute inset-x-0 top-0 h-px bg-white/25" />
                  <div className="w-10 h-10 rounded-full bg-white/12 border border-white/25 flex items-center justify-center text-xs font-black text-white/80 shadow-sm">{step.n}</div>
                  <div className="text-3xl drop-shadow-sm">{step.icon}</div>
                  <div>
                    <p className="text-white text-base font-extrabold leading-tight">{step.label}</p>
                    <p className="text-white/65 text-[11px] mt-1 leading-tight">{step.sub}</p>
                  </div>
                </div>
                {i < 4 && (
                  <div className="shrink-0 flex flex-col items-center justify-center h-full px-0 z-10">
                    <svg width="20" height="40" viewBox="0 0 20 40" fill="none">
                      <path d="M0 20 L12 20 M8 14 L20 20 L8 26" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 6-stage pipeline (cards) ── */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-slate-200" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">6-Stage Processing Pipeline</p>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {PIPELINE_DETAILED.map((p) => {
            const cl = C[p.col]
            return (
              <div key={p.n} className={`rounded-2xl border-2 p-5 ${cl.bg} ${cl.border} flex flex-col gap-3`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl ${cl.num} text-white flex items-center justify-center text-sm font-black shrink-0 shadow-sm`}>{p.n}</div>
                    <div>
                      <p className={`text-sm font-extrabold ${cl.text}`}>{p.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{p.what}</p>
                    </div>
                  </div>
                  <span className="text-2xl shrink-0">{p.icon}</span>
                </div>
                <ul className="space-y-1.5 border-t border-white/60 pt-3">
                  {p.details.map(d => (
                    <li key={d} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className={`w-1.5 h-1.5 rounded-full ${cl.dot} mt-1 shrink-0`} />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── BiLSTM deep-dive ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

        {/* Layer stack */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl shrink-0 shadow-sm">🧠</div>
            <div>
              <h3 className="text-base font-bold text-gray-900">BiLSTM Neural Network — Layer by Layer</h3>
              <p className="text-xs text-slate-400 mt-0.5">Each layer's role + output tensor shape</p>
            </div>
          </div>
          <div className="grid flex-1 grid-rows-6 divide-y divide-slate-100">
            {BILSTM_LAYERS.map((l, i) => {
              const cl = C[l.col]
              return (
                <div key={l.label} className={`flex min-h-[108px] items-start gap-4 px-5 py-5 ${cl.bg}`}>
                  <div className={`w-9 h-9 rounded-xl ${cl.num} text-white flex items-center justify-center text-sm font-black shrink-0 mt-0.5 shadow-sm`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className={`text-sm font-extrabold ${cl.text}`}>{l.label}</p>
                      <code className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${cl.border} ${cl.text} shrink-0`}>{l.shape}</code>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">{l.why}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{l.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right column: Attention + Consensus — no extra space-y wrapper */}
        <div className="flex h-full flex-col gap-6">

          {/* Token Attention */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 bg-slate-50">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-xl shrink-0">👁</div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Token Attention — How the Model Focuses</h3>
                <p className="text-xs text-slate-400 mt-0.5">Each word gets a learned importance score</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Not every word matters equally. The attention layer assigns each token a score between 0 and 1 —
                the model learns during training which words signal sentiment. High-weight words directly drive
                the final classification, making predictions <span className="font-bold text-slate-800">explainable</span>.
              </p>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1">Live example — model sees:</p>
                  <p className="text-sm italic text-slate-600">"I had high hopes but the product was terrible"</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { word:'I',        w:0.02 }, { word:'had',      w:0.05 },
                    { word:'high',     w:0.12 }, { word:'hopes',    w:0.18 },
                    { word:'but',      w:0.08 }, { word:'the',      w:0.01 },
                    { word:'product',  w:0.10 }, { word:'was',      w:0.06 },
                    { word:'terrible', w:0.38 },
                  ].map(t => (
                    <span key={t.word} className="inline-flex flex-col items-center gap-0.5">
                      <span className="px-2.5 py-1.5 rounded-lg text-xs font-bold border leading-none"
                            style={{
                              backgroundColor: `rgba(239,68,68,${Math.min(t.w * 2.2, 0.85)})`,
                              borderColor: `rgba(239,68,68,${Math.min(t.w * 2.2 + 0.1, 0.9)})`,
                              color: t.w > 0.2 ? '#7f1d1d' : t.w > 0.08 ? '#b91c1c' : '#475569',
                            }}>
                        {t.word}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">{(t.w * 100).toFixed(0)}%</span>
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 border-t border-slate-200 pt-3">
                  <span className="font-bold text-red-600">"terrible"</span> captures 38% of total attention — the model correctly identifies it as the dominant negative signal and classifies the tweet as <span className="font-bold">Negative</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Consensus Voting */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 bg-slate-50">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl shrink-0">⚖️</div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Confidence-Weighted Consensus</h3>
                <p className="text-xs text-slate-400 mt-0.5">How 5 models vote to reach one final verdict</p>
              </div>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-500 leading-relaxed">
                A model predicting "negative at 91%" counts far more than one saying "neutral at 53%".
                The vote weight = confidence score, not a flat 1 per model.
              </p>
              {[
                { label:'VADER',  vote:'neutral',  conf:60, color:'#94a3b8' },
                { label:'LR',     vote:'negative', conf:82, color:'#3b82f6' },
                { label:'RF',     vote:'negative', conf:74, color:'#f97316' },
                { label:'SVM',    vote:'negative', conf:88, color:'#8b5cf6' },
                { label:'BiLSTM', vote:'negative', conf:91, color:'#10b981' },
              ].map(m => (
                <div key={m.label} className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-600 w-12 shrink-0">{m.label}</span>
                  <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                    <div className="h-full rounded-lg flex items-center px-2.5 transition-all duration-700"
                         style={{ width:`${m.conf}%`, backgroundColor:m.color+'28', border:`1.5px solid ${m.color}55` }}>
                      <span className="text-[11px] font-bold capitalize" style={{ color:m.color }}>{m.vote}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-600 w-8 text-right tabular-nums shrink-0">{m.conf}%</span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-2">
                <div>
                  <p className="text-xs font-black text-red-700 uppercase tracking-wide">Weighted Verdict</p>
                  <p className="text-[10px] text-red-400 mt-0.5">4 models voted negative · total weight 335 vs 60</p>
                </div>
                <span className="text-lg font-extrabold text-red-600 tracking-tight">NEGATIVE</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Model comparison table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-gray-900">Model Comparison at a Glance</h3>
          <p className="text-xs text-slate-400 mt-0.5">Trade-offs: accuracy vs speed vs interpretability</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide font-bold">
                {['Model','Type','Training','Inference','Interpretable','GPU needed','Macro F1'].map(h => (
                  <th key={h} className="px-5 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODEL_COMPARISON.map((r, i) => (
                <tr key={r.model} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i === MODEL_COMPARISON.length - 1 ? 'bg-emerald-50/30' : ''}`}>
                  <td className="px-5 py-3 font-semibold text-gray-900">{r.model}</td>
                  <td className="px-5 py-3"><span className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-medium">{r.type}</span></td>
                  <td className="px-5 py-3 text-slate-600 font-mono text-xs">{r.train}</td>
                  <td className="px-5 py-3 text-slate-600 font-mono text-xs">{r.inference}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${r.interpretable ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                      {r.interpretable ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${r.gpu ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                      {r.gpu ? 'Yes' : 'No (CPU)'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-sm font-extrabold ${i === MODEL_COMPARISON.length - 1 ? 'text-emerald-600' : 'text-gray-800'}`}>{r.f1}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

// ── Design Decisions tab ─────────────────────────────────────────────────────
function DecisionsTab() {
  return (
    <div className="space-y-10">
      <SectionHeader tag="🎯 Rationale" title="Key Design Decisions" sub="Every major choice with the reasoning behind it" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {DECISIONS.map(d => {
          const cl = C[d.col]
          return (
            <div key={d.title} className={`rounded-2xl border p-4 space-y-2 ${cl.bg} ${cl.border}`}>
              <div className="flex items-start gap-2">
                <span className="text-xl shrink-0">{d.icon}</span>
                <p className={`text-sm font-bold ${cl.text}`}>{d.title}</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{d.body}</p>
            </div>
          )
        })}
      </div>

      <div className="border-t border-slate-100 my-2" />

      <SectionHeader tag="📅 Timeline" title="Project Phases" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PHASES.map(ph => {
          const cl = C[ph.col]
          return (
            <div key={ph.n} className={`rounded-2xl border-l-4 border p-4 ${cl.bg} ${cl.border}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-black w-5 h-5 rounded-full ${cl.num} text-white flex items-center justify-center shrink-0`}>{ph.n}</span>
                <span className="text-base">{ph.icon}</span>
                <span className={`text-sm font-bold ${cl.text}`}>{ph.title}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{ph.out}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Tech Stack tab ────────────────────────────────────────────────────────────
function StackTab() {
  return (
    <div className="space-y-8">
      <SectionHeader tag="🛠️ Stack" title="Technologies Used" sub="Every library, framework, and tool that powers this project" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {STACK.map(s => {
          const cl = C[s.col]
          return (
            <div key={s.cat} className={`rounded-2xl border p-4 ${cl.bg} ${cl.border}`}>
              <p className={`text-xs font-black uppercase tracking-wide mb-2 ${cl.text}`}>{s.cat}</p>
              <ul className="space-y-1">
                {s.items.map(it => (
                  <li key={it} className="text-xs text-slate-600 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${cl.dot}`} />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <p className="text-sm font-bold text-gray-900">Environment Setup</p>
        <div className="bg-slate-900 rounded-xl p-5 font-mono text-xs text-slate-300 space-y-3">
          {[
            { comment: '# Install Python dependencies', cmd: 'pip install -r requirements.txt' },
            { comment: '# Start FastAPI backend',       cmd: 'python -m backend.main' },
            { comment: '# Start React frontend',        cmd: 'cd phase_05_react_ui && npm run dev' },
            { comment: '# Retrain BiLSTM (saves .h5 for Keras 2)',  cmd: 'python -m phase_04_rnn_bilstm.02_train_rnn' },
            { comment: '# Enable live Twitter evaluation', cmd: 'export X_BEARER_TOKEN=your_token_here' },
          ].map(({ comment, cmd }) => (
            <div key={cmd}>
              <p className="text-slate-500">{comment}</p>
              <p className="text-emerald-400">{cmd}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400">Get Twitter Bearer Token → developer.twitter.com → Create App → Keys and Tokens → Bearer Token</p>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'metrics',   label: 'Performance Metrics', icon: '📊' },
  { id: 'arch',      label: 'Architecture',         icon: '🏗' },
  { id: 'decisions', label: 'Design Decisions',     icon: '🎯' },
  { id: 'stack',     label: 'Tech Stack',           icon: '🛠' },
]

export default function Project() {
  const [tab, setTab] = useState('metrics')

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
          End-to-end multi-model sentiment pipeline — performance benchmarks, architecture, design rationale, and tech stack.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 flex-wrap justify-center">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200
                        ${tab === t.id
                          ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200/60'
                          : 'text-slate-600 hover:text-gray-900 hover:bg-slate-100 border border-slate-200'}`}
          >
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'metrics'   && <MetricsTab />}
      {tab === 'arch'      && <ArchTab />}
      {tab === 'decisions' && <DecisionsTab />}
      {tab === 'stack'     && <StackTab />}
    </div>
  )
}

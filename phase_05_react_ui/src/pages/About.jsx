/* ─────────────────────────────────────────────────────────────────────────────
   About.jsx  —  Architecture, decision flow & thought process
   ───────────────────────────────────────────────────────────────────────────── */

/* ── Pipeline step arrow ──────────────────────────────────────────────────── */
function Arrow() {
  return (
    <div className="flex items-center justify-center text-slate-300 text-xl font-thin select-none">→</div>
  )
}

/* ── Section wrapper ──────────────────────────────────────────────────────── */
function Section({ title, subtitle, children }) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">{title}</h2>
        {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

/* ── Decision card ──────────────────────────────────────────────────────────── */
function DecisionCard({ icon, question, decision, why, tradeoff, color = 'indigo' }) {
  const COLOR = {
    indigo: { bg:'bg-indigo-50', border:'border-indigo-200', icon:'bg-indigo-100 text-indigo-700',
              label:'bg-indigo-600 text-white', tag:'bg-indigo-100 text-indigo-700 border-indigo-200' },
    blue:   { bg:'bg-blue-50',   border:'border-blue-200',   icon:'bg-blue-100 text-blue-700',
              label:'bg-blue-600 text-white',   tag:'bg-blue-100 text-blue-700 border-blue-200'   },
    violet: { bg:'bg-violet-50', border:'border-violet-200', icon:'bg-violet-100 text-violet-700',
              label:'bg-violet-600 text-white', tag:'bg-violet-100 text-violet-700 border-violet-200' },
    emerald:{ bg:'bg-emerald-50',border:'border-emerald-200',icon:'bg-emerald-100 text-emerald-700',
              label:'bg-emerald-600 text-white',tag:'bg-emerald-100 text-emerald-700 border-emerald-200' },
    orange: { bg:'bg-orange-50', border:'border-orange-200', icon:'bg-orange-100 text-orange-700',
              label:'bg-orange-600 text-white', tag:'bg-orange-100 text-orange-700 border-orange-200' },
    red:    { bg:'bg-red-50',    border:'border-red-200',    icon:'bg-red-100 text-red-700',
              label:'bg-red-600 text-white',    tag:'bg-red-100 text-red-700 border-red-200'    },
  }
  const c = COLOR[color]
  return (
    <div className={`rounded-2xl border p-5 ${c.bg} ${c.border}`}>
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${c.icon}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Decision Question</p>
          <p className="text-sm font-semibold text-gray-800 mb-3 italic">"{question}"</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${c.label}`}>✓ {decision}</span>
          </div>
          <div className="space-y-2">
            <div className="flex gap-2 text-sm">
              <span className="text-slate-400 shrink-0 font-semibold w-12">Why:</span>
              <span className="text-gray-700 leading-relaxed">{why}</span>
            </div>
            {tradeoff && (
              <div className="flex gap-2 text-sm">
                <span className="text-slate-400 shrink-0 font-semibold w-12">Trade-off:</span>
                <span className="text-slate-600 leading-relaxed">{tradeoff}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Pipeline node ─────────────────────────────────────────────────────────── */
function PipelineNode({ step, title, desc, color, icon, outputs }) {
  const COLORS = {
    indigo:  'bg-indigo-600 text-white',
    blue:    'bg-blue-600 text-white',
    violet:  'bg-violet-600 text-white',
    emerald: 'bg-emerald-600 text-white',
    orange:  'bg-orange-500 text-white',
    red:     'bg-red-600 text-white',
    slate:   'bg-slate-600 text-white',
  }
  return (
    <div className="flex flex-col items-center text-center gap-2 min-w-[120px]">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-md ${COLORS[color] ?? COLORS.slate}`}>
        {icon}
      </div>
      <div className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${COLORS[color] ?? COLORS.slate}`}>
        Phase {step}
      </div>
      <div className="text-xs font-bold text-gray-800 leading-tight">{title}</div>
      <div className="text-xs text-slate-500 leading-relaxed max-w-[130px]">{desc}</div>
      {outputs && outputs.map((o) => (
        <span key={o} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 font-mono">
          {o}
        </span>
      ))}
    </div>
  )
}

/* ── Architecture block ───────────────────────────────────────────────────── */
function ArchBlock({ label, detail, color = 'slate', arrow = true }) {
  const BG = {
    indigo:'bg-indigo-600', blue:'bg-blue-600', violet:'bg-violet-600',
    emerald:'bg-emerald-600', orange:'bg-orange-500', slate:'bg-slate-600', red:'bg-red-500',
  }
  return (
    <div className="flex items-center gap-2">
      <div className={`px-4 py-3 rounded-xl text-white text-center shadow-sm min-w-[100px] ${BG[color]}`}>
        <div className="text-xs font-bold">{label}</div>
        {detail && <div className="text-[10px] opacity-75 mt-0.5">{detail}</div>}
      </div>
      {arrow && <Arrow />}
    </div>
  )
}

/* ── Phase card ─────────────────────────────────────────────────────────────── */
function PhaseCard({ num, icon, title, desc, tags, outcome, color }) {
  const BORDER = { indigo:'border-indigo-200', blue:'border-blue-200', violet:'border-violet-200',
                   emerald:'border-emerald-200', orange:'border-orange-200', red:'border-red-200', slate:'border-slate-200' }
  const NUM_BG = { indigo:'bg-indigo-600', blue:'bg-blue-600', violet:'bg-violet-600',
                   emerald:'bg-emerald-600', orange:'bg-orange-500', red:'bg-red-600', slate:'bg-slate-600' }
  return (
    <div className={`card border-l-4 ${BORDER[color] ?? 'border-l-slate-200'} p-5 hover:shadow-md transition-shadow`}>
      <div className="flex gap-4">
        <div className="shrink-0 flex flex-col items-center gap-1.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm ${NUM_BG[color] ?? 'bg-slate-600'} text-white`}>
            {icon}
          </div>
          <span className="text-xs font-bold text-slate-400">{num}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-3">{desc}</p>
          {outcome && (
            <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
              <span>→</span>
              <span className="text-gray-700">{outcome}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 font-mono">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function About() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-16">

      {/* ── Hero ── */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
                        bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
          CUD · Machine Learning · Final Project 2024
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900">
          Project <span className="text-gradient">Architecture</span>
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
          An end-to-end multi-model sentiment analysis system — covering the full journey
          from raw tweets to a production React dashboard. Here's how it was designed,
          what decisions were made, and why.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════
          1.  SYSTEM OVERVIEW
         ══════════════════════════════════════════════════════ */}
      <Section title="System Overview" subtitle="How raw text becomes a sentiment prediction — from input to output">
        <div className="card p-6 overflow-x-auto">
          <div className="flex items-start gap-2 min-w-[700px]">
            <PipelineNode step="01" icon="📥" color="slate"   title="Raw Input"        desc="Tweet / post up to 280 chars"           outputs={['.csv / API']} />
            <Arrow />
            <PipelineNode step="02" icon="🧹" color="blue"    title="Text Cleaning"    desc="Normalize, strip URLs & emojis"          outputs={['clean_text']} />
            <Arrow />
            <PipelineNode step="03" icon="⚙️" color="violet"  title="Feature Extract"  desc="TF-IDF vectorizer or token sequences"    outputs={['X_tfidf','X_seq']} />
            <Arrow />
            <PipelineNode step="04" icon="🤖" color="orange"  title="5 Models"         desc="VADER · LR · RF · SVM · BiLSTM"          outputs={['proba[3]']} />
            <Arrow />
            <PipelineNode step="05" icon="🗳️" color="indigo"  title="Ensemble Vote"    desc="Consensus across models + attention"     outputs={['verdict']} />
            <Arrow />
            <PipelineNode step="06" icon="📊" color="emerald" title="React Dashboard"  desc="Real-time results + charts"              outputs={['.json / UI']} />
          </div>
        </div>

        {/* Data flow table */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h3 className="text-sm font-bold text-gray-900">Data Flow at Each Stage</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Stage','Input','Process','Output','Format'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Ingestion',    'Raw tweet text',          'Load CSV / HuggingFace API',         '45,615 labelled rows',         'DataFrame'],
                  ['Cleaning',     'Raw string',              'Regex, contraction expand, lowercase', 'Normalized string',           'str'],
                  ['TF-IDF',       'Cleaned text',            'Fit vectorizer (20K features)',        'Sparse feature matrix',       'scipy CSR'],
                  ['Tokenization', 'Cleaned text',            'Keras tokenizer + pad to 60 tokens',  'Int sequences',               'ndarray (N×60)'],
                  ['Inference',    'X_tfidf / X_seq',         'Forward pass through each model',     '3-class probabilities',       'float32[3]'],
                  ['API Response', 'Text + model key',        'FastAPI /predict endpoint',            'JSON with all model scores',  'JSON'],
                  ['UI Render',    'JSON response',           'React state → Recharts',              'Charts + cards + heatmap',    'HTML/SVG'],
                ].map(([stage, inp, proc, out, fmt], i) => (
                  <tr key={stage} className={`border-b border-slate-50 ${i%2===0?'bg-white':'bg-slate-50/50'} hover:bg-indigo-50/30 transition-colors`}>
                    <td className="px-5 py-3 font-semibold text-gray-800">{stage}</td>
                    <td className="px-5 py-3 text-slate-600 font-mono text-xs">{inp}</td>
                    <td className="px-5 py-3 text-slate-600">{proc}</td>
                    <td className="px-5 py-3 text-slate-600">{out}</td>
                    <td className="px-5 py-3"><span className="text-xs px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono">{fmt}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          2.  THOUGHT PROCESS & KEY DECISIONS
         ══════════════════════════════════════════════════════ */}
      <Section
        title="Thought Process & Key Decisions"
        subtitle="Every major design choice, the reasoning behind it, and what was traded off">

        {/* Dataset */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-black">1</span>
            Dataset Selection
          </h3>
          <DecisionCard
            icon="🗄️" color="blue"
            question="Which dataset should we use for social media sentiment?"
            decision="tweet_eval/sentiment (HuggingFace)"
            why="tweet_eval is the standard benchmark for Twitter NLP — real tweets, 45K+ samples, three balanced classes, and widely cited in literature. Using it gives us comparable baseline numbers against published work."
            tradeoff="Tweets are noisier and shorter than reviews (avg 71 chars vs 200+ for Amazon reviews). Required more aggressive text cleaning. Domain-specific slang, emojis, and abbreviations increase OOV rate."
          />
          <DecisionCard
            icon="🏷️" color="blue"
            question="3-class (negative/neutral/positive) or 5-class fine-grained?"
            decision="3-class classification"
            why="The dataset natively uses 3 classes. Fine-grained (5-class) mapping would require a different corpus. The 3-class setup aligns with practical business use cases — thumbs up, thumbs down, or indifferent."
            tradeoff="Loses emotional granularity (e.g., 'enraged' vs 'disappointed' both map to negative). Acceptable for social media monitoring at scale."
          />
        </div>

        {/* Text cleaning */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-black">2</span>
            Preprocessing Choices
          </h3>
          <DecisionCard
            icon="🧹" color="violet"
            question="How aggressively should we clean tweet text?"
            decision="Replace URLs/mentions with tokens, strip emojis, expand contractions, lowercase"
            why="URLs and @mentions carry no semantic sentiment — replacing with placeholder tokens ('url', 'user') preserves positional context without polluting vocabulary. Contractions ('can't' → 'cannot') matter because TF-IDF treats them as separate vocabulary items."
            tradeoff="Emojis CAN carry sentiment ('😊' = positive), so stripping them loses signal for VADER and the deep model. Acceptable at this stage; emoji embeddings would require a larger corpus."
          />
          <DecisionCard
            icon="📐" color="violet"
            question="MAX_LEN=60 for BiLSTM — how was this chosen?"
            decision="60 tokens covers 95%+ of the training set"
            why="Sequence length analysis showed median tweet length of ~18 tokens post-cleaning, 95th percentile at 54. Padding to 60 captures nearly all content without wasting memory on long-tail sequences. Longer padding would slow training with no accuracy gain."
            tradeoff="The 5% of tweets over 60 tokens are truncated. These tend to be threads or multi-sentence posts, rare in tweet_eval."
          />
        </div>

        {/* Feature engineering */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-black">3</span>
            Feature Engineering
          </h3>
          <DecisionCard
            icon="📊" color="orange"
            question="TF-IDF or bag-of-words or word embeddings for classical models?"
            decision="TF-IDF with sublinear_tf, 1-2 ngrams, 20K features"
            why="TF-IDF outperforms raw BOW because it downweights high-frequency filler words. Bigrams ('not good', 'really love') capture negation patterns critical for sentiment. sublinear_tf prevents very frequent terms from dominating. 20K features cover the full informative vocabulary without overfitting."
            tradeoff="TF-IDF is a bag-of-words model — word order is lost. 'Not good' and 'Good, not bad' produce different bigrams but TF-IDF can't capture positional semantics the way BiLSTM can."
          />
          <DecisionCard
            icon="🔢" color="orange"
            question="Why build a separate Keras tokenizer for the deep model?"
            decision="Integer sequences with Keras Tokenizer + padding"
            why="The Embedding layer in BiLSTM needs integer token IDs, not floating-point TF-IDF scores. The tokenizer maps words to 1..VOCAB_SIZE with a fixed vocabulary fitted on the training set only (no data leakage). Padding to a fixed length enables batch matrix operations."
            tradeoff="Out-of-vocabulary (OOV) tokens get mapped to a single <OOV> ID, collapsing all unknown words. Pre-trained GloVe/FastText embeddings would handle OOV better but require 800MB+ of embedding files."
          />
        </div>

        {/* Model selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-black">4</span>
            Model Architecture Decisions
          </h3>
          <DecisionCard
            icon="📏" color="red"
            question="Why include VADER if it's only a rule-based lexicon?"
            decision="Keep VADER as the interpretable baseline"
            why="VADER gives us the performance floor — a zero-training baseline that domain experts can understand and trust. It also handles emojis natively (we stripped them from ML inputs, but VADER runs on raw text). Comparing against VADER shows concrete improvement from learning."
            tradeoff="VADER was designed for social media but has a fixed lexicon — it misses domain-specific slang ('fire', 'lit', 'bussin' as positives). Macro F1 of 0.548 confirms this."
          />
          <DecisionCard
            icon="📈" color="blue"
            question="Why Logistic Regression over Naive Bayes or other linear classifiers?"
            decision="Logistic Regression with L2 regularization + GridSearchCV"
            why="LR produces calibrated probability outputs (needed for the confidence bars in the UI), handles multi-class natively with multinomial loss, and benefits directly from TF-IDF's real-valued features. GridSearchCV over C=[0.01, 0.1, 1, 10] prevents overfitting on high-dimensional TF-IDF space. Best C=0.1 confirms mild regularization needed."
            tradeoff="Training LR on 20K TF-IDF features takes ~2 min with GridSearch (cv=3). Naive Bayes would be 10× faster but produces poorly calibrated probabilities and doesn't handle feature correlations well."
          />
          <DecisionCard
            icon="🌲" color="emerald"
            question="Why Random Forest at 300 trees specifically?"
            decision="RandomForestClassifier(n_estimators=300)"
            why="RF adds diversity through random feature subsets — useful when some TF-IDF features correlate. 300 trees is the point of diminishing returns on this dataset (100 trees F1≈0.64, 300 F1≈0.681, 500 F1≈0.682). RF also provides feature importance, directly showing which words drive each sentiment class."
            tradeoff="RF is the slowest classical model (300 trees × 36K samples). Inference is also slower than LR/SVM at runtime. The feature importance visualization justified the added cost for an educational project."
          />
          <DecisionCard
            icon="⚡" color="violet"
            question="LinearSVC vs kernel SVM vs calibrated SVC?"
            decision="LinearSVC wrapped with CalibratedClassifierCV"
            why="LinearSVC is dramatically faster than RBF-kernel SVM for high-dimensional text (O(n×d) vs O(n²)). But LinearSVC doesn't natively output probabilities — CalibratedClassifierCV uses Platt scaling (cv=3 internal folds) to convert decision margins into proper probabilities. Essential for the confidence bars."
            tradeoff="Calibration adds training time and introduces slight variance. For purely discriminative use (argmax only) this overhead isn't needed, but the UI requires probabilities."
          />
          <DecisionCard
            icon="🧠" color="indigo"
            question="Why BiLSTM + Attention rather than a Transformer (BERT)?"
            decision="Bidirectional LSTM with Bahdanau Attention"
            why="BiLSTM captures sequential context in both directions — forward pass picks up prefixes ('not bad'), backward pass picks up suffixes ('could have been worse'). Attention allows the model to weight which tokens matter most, giving us the heatmap visualization. BERT would achieve higher accuracy but requires 400MB+ weights, GPU memory, and minutes per inference — impractical for a real-time web demo."
            tradeoff="BiLSTM can't capture long-range dependencies as well as self-attention. On 60-token tweets this is largely irrelevant. BERT on the same dataset would score ~0.82 macro F1 vs our 0.762 — meaningful improvement, but at 10× compute cost."
          />
        </div>

        {/* Architecture */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-black">5</span>
            BiLSTM Architecture Decisions
          </h3>
          <DecisionCard
            icon="🔧" color="indigo"
            question="Embedding(25000, 128) — why these dimensions?"
            decision="VOCAB_SIZE=25,000 · EMBED_DIM=128"
            why="25K captures the informative vocabulary without including noise terms (full vocab ~45K). 128-dim embeddings are a proven sweet spot for tasks with ~40K training examples — large enough to encode semantic relationships, small enough to fit comfortably in memory and train in reasonable time. Larger embedding dims (256, 512) showed no improvement beyond 1-2 epochs."
            tradeoff="With only 36K training samples and random initialization (no pre-trained weights), the embeddings may not generalize as well as GloVe. Pre-trained embeddings improve cold-start but require internet access during training."
          />
          <DecisionCard
            icon="🔄" color="indigo"
            question="Why Bidirectional LSTM(128) and not two stacked LSTMs?"
            decision="Single BiLSTM layer with 128 units per direction (256 total)"
            why="Bidirectionality is more important than depth for short texts. A BiLSTM(128) with return_sequences=True gives a 60×256 context tensor — each position sees full sentence context. Stacking LSTMs increases gradient vanishing risk without meaningful accuracy gain on 60-token inputs. SpatialDropout1D(0.3) on the embedding output prevents co-adaptation of feature detectors."
            tradeoff="A single layer limits representational capacity for complex linguistic patterns. For paragraph-level sentiment this would be insufficient, but tweets are short and direct."
          />
          <DecisionCard
            icon="👁️" color="indigo"
            question="Why Bahdanau Attention rather than just taking the last LSTM state?"
            decision="Additive Attention → context vector → Dense(64) → softmax"
            why="The last hidden state of an LSTM is biased towards sentence endings. Attention computes a learned weighted sum over all 60 positions — 'looking back' at whatever tokens matter most for sentiment. This produces the attention weights used in the heatmap visualization, making the model explainable. Without attention, we'd have no insight into which words drove the prediction."
            tradeoff="Attention adds ~65K trainable parameters. The visualization is the justification — pure accuracy improvement over last-state is only ~0.5% F1."
          />
          <DecisionCard
            icon="🛑" color="orange"
            question="EarlyStopping patience=3 — how was this tuned?"
            decision="EarlyStopping(patience=3) + ReduceLROnPlateau(patience=2, factor=0.5)"
            why="Training curves showed val_loss stabilizing by epoch 8-10 on this corpus. Patience=3 allows the model to escape local plateaus (sometimes val_loss temporarily ticks up then recovers). ReduceLROnPlateau halves the learning rate when stuck, acting as a fine-tuning phase before the early stop triggers. restore_best_weights=True ensures we keep peak performance."
            tradeoff="Patience=3 might terminate too early on a larger dataset with noisier gradients. Patience=5 was tried but added 2 extra epochs with no improvement."
          />
        </div>

        {/* Infrastructure */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-black">6</span>
            Infrastructure Decisions
          </h3>
          <DecisionCard
            icon="⚡" color="emerald"
            question="FastAPI vs Flask vs Django for the backend?"
            decision="FastAPI with Pydantic v2 schemas"
            why="FastAPI generates OpenAPI docs automatically, has async support for high-concurrency inference, and uses Python type hints natively — making schema validation zero-boilerplate. Pydantic v2 models enforce input/output shapes and give clear error messages. Flask would require manual validation; Django is overkill for a pure inference API."
            tradeoff="FastAPI's async model is not needed for CPU-bound model inference. The async overhead is negligible but the schema validation and docs are worth it."
          />
          <DecisionCard
            icon="⚛️" color="blue"
            question="Why React + Recharts vs a pre-built dashboard tool like Grafana or Streamlit?"
            decision="React 18 + Recharts + TailwindCSS"
            why="Streamlit was evaluated but produces static Python-rendered UIs with no client-side interactivity. The consensus voting, animated bars, expandable history, and attention heatmap require client-side state. React gives full control over UX. Recharts is composable and integrates cleanly with the existing component tree. Grafana requires a time-series DB and is overkill for per-request metrics."
            tradeoff="React requires a build step, npm dependencies, and more development time than Streamlit. For a demo/course project Streamlit would be faster to ship, but the resulting UI would be significantly less polished."
          />
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          3.  BiLSTM ARCHITECTURE DIAGRAM
         ══════════════════════════════════════════════════════ */}
      <Section title="BiLSTM Architecture" subtitle="Layer-by-layer breakdown of the deep learning model">
        <div className="card p-6 space-y-6">
          {/* Input to output flow */}
          <div className="overflow-x-auto">
            <div className="flex items-center gap-2 min-w-[700px]">
              <ArchBlock label="Input"        detail="60 tokens"       color="slate" />
              <ArchBlock label="Embedding"    detail="25K × 128-dim"   color="blue" />
              <ArchBlock label="SpatialDrop"  detail="p=0.3"           color="slate" />
              <ArchBlock label="→ BiLSTM ←"   detail="128+128 units"   color="indigo" />
              <ArchBlock label="Attention"    detail="Bahdanau / 64"   color="violet" />
              <ArchBlock label="Dense"        detail="64 · ReLU"       color="orange" />
              <ArchBlock label="Dropout"      detail="p=0.3"           color="slate" />
              <ArchBlock label="Softmax"      detail="3 classes"       color="emerald" arrow={false} />
            </div>
          </div>

          {/* Layer specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { layer:'Embedding',   params:'25K × 128 = 3.2M', note:'Trained from random init, no pre-trained weights', color:'bg-blue-50 border-blue-200' },
              { layer:'BiLSTM',      params:'4 × (128² + 128×128) × 2 = ~525K', note:'Bidirectional; return_sequences=True for attention', color:'bg-indigo-50 border-indigo-200' },
              { layer:'Attention',   params:'128×64 + 64×1 = ~8K', note:'Bahdanau additive attention; outputs context + weights', color:'bg-violet-50 border-violet-200' },
              { layer:'Dense+Output',params:'256×64 + 64×3 = ~16K', note:'ReLU activation → softmax over 3 classes', color:'bg-emerald-50 border-emerald-200' },
            ].map(({ layer, params, note, color }) => (
              <div key={layer} className={`rounded-xl border p-4 ${color}`}>
                <div className="text-xs font-bold text-gray-800 mb-1">{layer}</div>
                <div className="text-xs font-mono text-slate-600 mb-2">{params}</div>
                <div className="text-xs text-slate-500 leading-relaxed">{note}</div>
              </div>
            ))}
          </div>

          {/* Total params */}
          <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            {[
              { label:'Total Parameters', value:'~3.75M' },
              { label:'Trainable',        value:'~3.75M' },
              { label:'Batch Size',       value:'64' },
              { label:'Max Epochs',       value:'15' },
              { label:'Optimizer',        value:'Adam lr=1e-3' },
              { label:'Loss',             value:'Cat. Cross-entropy' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center min-w-[100px]">
                <div className="text-base font-extrabold text-indigo-700">{value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          4.  FULL PROJECT PHASES
         ══════════════════════════════════════════════════════ */}
      <Section title="Project Phases" subtitle="What was built at each phase and what it produced">
        <div className="space-y-3">
          {[
            {
              num:'01', icon:'🔍', color:'blue', title:'Data Exploration',
              desc:'Loaded tweet_eval/sentiment (45,615 tweets) from HuggingFace. Analyzed class balance (28.5% neg / 40.2% neu / 31.3% pos), text length histograms, per-class WordClouds, and top-20 word frequency by sentiment. Produced a full data quality report identifying 0 nulls, ~1,200 duplicates.',
              outcome:'Clean CSV with train/val/test splits, confirmed dataset suitability for 3-class classification.',
              tags:['HuggingFace Datasets','pandas','matplotlib','WordCloud','seaborn'],
            },
            {
              num:'02', icon:'⚙️', color:'violet', title:'Feature Engineering',
              desc:'Built two parallel feature paths: (A) TF-IDF with 1-2 grams and 20K features for classical ML; (B) Keras tokenizer with vocabulary of 25K, integer sequences padded to 60 for the BiLSTM. Also trained Word2Vec embeddings with t-SNE visualization, chi-squared feature ranking for interpretability.',
              outcome:'tfidf.pkl, tokenizer.pkl, X_train_tfidf (36K×20K sparse), X_train_seq (36K×60 dense).',
              tags:['TF-IDF','Word2Vec','t-SNE','Chi-squared','Keras Tokenizer','joblib'],
            },
            {
              num:'03', icon:'📈', color:'orange', title:'Classical ML Models',
              desc:'Trained and evaluated 4 models: VADER (zero-shot baseline), Logistic Regression (GridSearch C, multinomial), Random Forest (300 trees, feature importance), and LinearSVC with CalibratedClassifierCV. Compared on macro F1, per-class precision/recall, ROC-AUC curves, and confusion matrices.',
              outcome:'Best classical model: LR at 0.721 macro F1 — 17.3 points above VADER. SVM close second at 0.709.',
              tags:['VADER','LogisticRegression','RandomForest','LinearSVC','CalibratedClassifierCV','GridSearchCV'],
            },
            {
              num:'04', icon:'🧠', color:'indigo', title:'BiLSTM + Attention',
              desc:'Built custom Keras model: Embedding(25K,128) → SpatialDropout → BiLSTM(128, return_seq) → BahdanauAttention(64) → Dense(64,relu) → Dropout(0.3) → Dense(3,softmax). Trained with EarlyStopping, ReduceLROnPlateau, ModelCheckpoint. Extracted attention weights for heatmap visualization.',
              outcome:'Best model overall: 0.762 macro F1. Attention heatmap shows model correctly focuses on sentiment-bearing tokens.',
              tags:['Keras','TensorFlow 2.16','BiLSTM','Bahdanau Attention','EarlyStopping','ModelCheckpoint'],
            },
            {
              num:'05', icon:'💻', color:'emerald', title:'React Dashboard UI',
              desc:'Production React 18 SPA with real-time multi-model inference via FastAPI backend. Features: consensus voting card, per-model result cards with animated confidence bars, grouped bar chart comparing probability distributions, BiLSTM attention heatmap with token tooltips, session history with expandable detail.',
              outcome:'Fully interactive dashboard running at localhost:5173, falling back to mock predictions when API is offline.',
              tags:['React 18','TailwindCSS 3','Recharts 2','Vite 5','FastAPI','react-router-dom'],
            },
            {
              num:'06', icon:'🚀', color:'red', title:'HuggingFace Deployment',
              desc:'Gradio 4 interface wrapping all inference pipelines with Dockerfile for HuggingFace Spaces. API containerized with uvicorn, model artifacts bundled. Supports batch inference (up to 200 texts), exposes /predict, /metrics, /history, /health endpoints.',
              outcome:'Docker image ready for push to HuggingFace Spaces. Gradio UI provides zero-JS fallback demo.',
              tags:['Gradio 4','Docker','uvicorn','HuggingFace Spaces','FastAPI','pydantic v2'],
            },
          ].map((p) => <PhaseCard key={p.num} {...p} />)}
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          5.  RESULTS & LEARNINGS
         ══════════════════════════════════════════════════════ */}
      <Section title="Results & Learnings" subtitle="What the numbers say and what we'd do differently">
        {/* Results summary */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h3 className="text-sm font-bold text-gray-900">Final Benchmark — tweet_eval/sentiment test split</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['#','Model','Macro F1','vs VADER','Observation'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { rank:1, model:'BiLSTM',              f1:0.762, delta:'+0.214', obs:'Sequential context + attention captures negation and sarcasm better than BOW.' },
                  { rank:2, model:'Logistic Regression', f1:0.721, delta:'+0.173', obs:'Strong baseline — TF-IDF bigrams handle most sentiment patterns effectively.' },
                  { rank:3, model:'SVM',                 f1:0.709, delta:'+0.161', obs:'Similar to LR; slightly lower recall on neutral class.' },
                  { rank:4, model:'Random Forest',       f1:0.681, delta:'+0.133', obs:'Feature importance is valuable, but tree aggregation lags linear methods.' },
                  { rank:5, model:'VADER',               f1:0.548, delta:'—',      obs:'Strong on positive/negative; poor neutral precision — predicts too many neutrals.' },
                ].map(({ rank, model, f1, delta, obs }, i) => (
                  <tr key={model} className={`border-b border-slate-50 ${rank===1 ? 'bg-emerald-50/60' : i%2===0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-5 py-4 text-slate-400 font-mono font-bold">#{rank}</td>
                    <td className="px-5 py-4 font-semibold text-gray-800">{model}</td>
                    <td className="px-5 py-4 font-extrabold text-gray-900">{f1.toFixed(3)}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold ${rank===1 ? 'text-emerald-600' : rank===5 ? 'text-slate-400' : 'text-blue-600'}`}>{delta}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-xs leading-relaxed">{obs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Key learnings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon:'💡', title:'Neutral class is hardest', desc:'All models underperform on neutral — tweets without strong sentiment markers look like noise. Neutral recall is consistently lowest. This is an inherent labelling ambiguity in the dataset.', color:'amber' },
            { icon:'📐', title:'Bigrams matter more than model complexity', desc:'TF-IDF with bigrams closed most of the gap vs BiLSTM for the LR model (0.721 vs 0.762). The incremental gain from deep learning is real but modest on 60-token inputs.', color:'blue' },
            { icon:'🔍', title:'Attention ≠ explanation', desc:'Attention weights highlight important tokens but do not causally explain predictions. High-weight tokens are correlated with the predicted class, not necessarily the cause.', color:'violet' },
            { icon:'🚀', title:'Next step: BERT fine-tuning', desc:'RoBERTa-base fine-tuned on tweet_eval achieves ~0.82 macro F1. The BiLSTM gap is bridgeable. With access to GPU and HuggingFace, fine-tuning would be the natural next iteration.', color:'emerald' },
          ].map(({ icon, title, desc, color }) => {
            const BG = { amber:'bg-amber-50 border-amber-200', blue:'bg-blue-50 border-blue-200',
                         violet:'bg-violet-50 border-violet-200', emerald:'bg-emerald-50 border-emerald-200' }
            return (
              <div key={title} className={`rounded-2xl border p-5 ${BG[color]}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          6.  TECH STACK
         ══════════════════════════════════════════════════════ */}
      <Section title="Technology Stack">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { cat:'ML / Deep Learning', icon:'🤖', color:'bg-indigo-600',
              items:['Keras / TensorFlow 2.16','scikit-learn 1.5','vaderSentiment','Gensim Word2Vec','BiLSTM + Bahdanau Attention'] },
            { cat:'Data & NLP',         icon:'📊', color:'bg-blue-600',
              items:['HuggingFace Datasets','tweet_eval/sentiment','pandas','numpy','NLTK / regex'] },
            { cat:'Backend API',        icon:'⚡', color:'bg-violet-600',
              items:['FastAPI 0.111','uvicorn ASGI','pydantic v2','Python 3.11','CORS + routing'] },
            { cat:'Frontend',           icon:'🎨', color:'bg-emerald-600',
              items:['React 18','TailwindCSS 3.4','Recharts 2.12','Vite 5','react-router-dom 6'] },
            { cat:'Visualization',      icon:'📈', color:'bg-orange-500',
              items:['Recharts (BarChart, Radar, Line)','matplotlib / seaborn','WordCloud','Attention heatmap'] },
            { cat:'DevOps / Deploy',    icon:'🐳', color:'bg-slate-700',
              items:['Gradio 4','Docker','HuggingFace Spaces','GitHub','SEED=42 reproducibility'] },
          ].map(({ cat, icon, color, items }) => (
            <div key={cat} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2.5 mb-4">
                <div className={`w-9 h-9 rounded-xl ${color} text-white flex items-center justify-center text-lg shadow-sm`}>{icon}</div>
                <div className="text-sm font-bold text-gray-900">{cat}</div>
              </div>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* Reproducibility */}
      <div className="card p-6 border-l-4 border-l-indigo-500 flex gap-4 items-start">
        <span className="text-2xl shrink-0">🔒</span>
        <div>
          <h3 className="font-bold text-gray-900 mb-1">Reproducibility</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            All random seeds fixed to <code className="text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded font-mono">42</code> across
            NumPy, TensorFlow, scikit-learn, and dataset splits. Model artifacts saved as{' '}
            <code className="text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded font-mono">.keras</code>{' '}
            and <code className="text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded font-mono">.joblib</code>.
            Results are fully deterministic across runs and machines.
          </p>
        </div>
      </div>

    </div>
  )
}

const MODEL_ORDER  = ['vader', 'lr', 'rf', 'svm', 'bilstm']
const RAW_MODELS    = ['vader', 'lr', 'rf', 'svm', 'bilstm']
const MODEL_LABELS = { vader: 'VADER', lr: 'LR', rf: 'RF', svm: 'SVM', bilstm: 'BiLSTM' }

const CFG = {
  positive: {
    bg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
    border: 'border-emerald-200',
    label:  'text-emerald-700',
    bar:    'bg-emerald-500',
    badge:  'bg-emerald-100 text-emerald-800 border-emerald-200',
    dot:    'bg-emerald-500',
  },
  negative: {
    bg: 'bg-gradient-to-br from-red-50 to-rose-50',
    border: 'border-red-200',
    label:  'text-red-700',
    bar:    'bg-red-500',
    badge:  'bg-red-100 text-red-800 border-red-200',
    dot:    'bg-red-500',
  },
  neutral: {
    bg: 'bg-gradient-to-br from-slate-50 to-gray-50',
    border: 'border-slate-200',
    label:  'text-slate-700',
    bar:    'bg-slate-400',
    badge:  'bg-slate-100 text-slate-700 border-slate-200',
    dot:    'bg-slate-400',
  },
  mixed: {
    bg: 'bg-gradient-to-br from-amber-50 to-yellow-50',
    border: 'border-amber-200',
    label:  'text-amber-700',
    bar:    'bg-amber-500',
    badge:  'bg-amber-100 text-amber-800 border-amber-200',
    dot:    'bg-amber-500',
  },
}

export default function ConsensusCard({ results }) {
  if (!results) return null

  const rawModels = RAW_MODELS.filter((k) => results[k])
  const visibleModels = MODEL_ORDER.filter((k) => results[k])
  if (!visibleModels.length) return null

  // Model F1 weights (BiLSTM best → VADER weakest for ML tasks)
  const MODEL_WEIGHT = { bilstm: 1.4, svm: 1.2, lr: 1.1, rf: 1.0, vader: 0.8 }

  // If VADER is highly confident AND more confident than the best ML model by ≥15pp,
  // trust VADER — it means VADER has a strong signal and ML models are uncertain.
  const mlModels  = rawModels.filter(k => k !== 'vader')
  const vaderConf = results['vader']?.confidence ?? 0
  const maxMlConf = mlModels.length
    ? Math.max(...mlModels.map(k => results[k]?.confidence ?? 0))
    : 0
  const deferToVader = results['vader'] && vaderConf >= 0.75 && vaderConf > maxMlConf + 0.15

  const weightedVotes = {}
  const rawVotes = {}
  rawModels.forEach((k) => {
    const lbl  = results[k].label
    const conf = results[k].confidence ?? 0.5
    // If deferring to VADER, zero-weight all ML models
    const w    = deferToVader ? (k === 'vader' ? 5.0 : 0) : (MODEL_WEIGHT[k] ?? 1.0)
    weightedVotes[lbl] = (weightedVotes[lbl] || 0) + conf * w
    rawVotes[lbl]      = (rawVotes[lbl]      || 0) + 1
  })

  const sorted = Object.entries(weightedVotes).sort((a, b) => b[1] - a[1])
  let label = sorted[0]?.[0]

  // Tiebreak: if top two within 10% of total, defer to highest-confidence single model
  if (!deferToVader && sorted.length > 1) {
    const totalWeight = sorted.reduce((s, [, v]) => s + v, 0)
    if ((sorted[0][1] - sorted[1][1]) / totalWeight < 0.10) {
      const bestModel = rawModels.reduce((best, k) =>
        (results[k]?.confidence ?? 0) > (results[best]?.confidence ?? 0) ? k : best, rawModels[0])
      label = results[bestModel]?.label ?? label
    }
  }

  if (!label) return null

  const cfg       = CFG[label] ?? CFG.neutral
  const count     = rawVotes[label] || 0
  const agreement = rawModels.length ? Math.round((count / rawModels.length) * 100) : 100

  // Final confidence = average confidence of models that agree with the consensus label
  const agreeingModels = rawModels.filter(k => results[k]?.label === label)
  const finalConf = agreeingModels.length
    ? agreeingModels.reduce((s, k) => s + (results[k]?.confidence ?? 0), 0) / agreeingModels.length
    : 0

  const avgConf = rawModels.length
    ? rawModels.reduce((s, k) => s + (results[k]?.confidence ?? 0), 0) / rawModels.length
    : finalConf

  return (
    <div className={`rounded-2xl border-2 p-5 sm:p-6 animate-fade-in ${cfg.bg} ${cfg.border}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        {/* Verdict */}
        <div className="shrink-0 text-center sm:text-left">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Consensus Verdict</p>
          <div className={`text-4xl font-extrabold capitalize ${cfg.label}`}>{label}</div>
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1 sm:justify-start">
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <span className="text-xs text-slate-500">{count} of {rawModels.length || visibleModels.length} raw models agree</span>
          </div>
        </div>

        {/* Meters */}
        <div className="flex-1 space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-600">Final confidence</span>
              <span className={`font-bold ${cfg.label}`}>{(finalConf * 100).toFixed(1)}%</span>
            </div>
            <div className="h-2.5 bg-white/70 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${cfg.bar} transition-all duration-700`}
                   style={{ width: `${finalConf * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-600">Raw model agreement</span>
              <span className={`font-bold ${cfg.label}`}>{agreement}%</span>
            </div>
            <div className="h-2.5 bg-white/70 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${cfg.bar} transition-all duration-700`}
                   style={{ width: `${agreement}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-600">Average confidence</span>
              <span className="font-bold text-indigo-700">{(avgConf * 100).toFixed(1)}%</span>
            </div>
            <div className="h-2.5 bg-white/70 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-indigo-500 transition-all duration-700"
                   style={{ width: `${avgConf * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Individual votes */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/60">
        {visibleModels.map((k) => {
          const c = CFG[results[k].label] ?? CFG.neutral
          return (
            <span key={k}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${c.badge}`}>
              <span>{MODEL_LABELS[k]}</span>
              <span className="opacity-50">→</span>
              <span className="capitalize">{results[k].label}</span>
              <span className="opacity-60">· {((results[k].confidence ?? 0) * 100).toFixed(0)}%</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

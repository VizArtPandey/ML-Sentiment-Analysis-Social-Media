import { useState } from 'react'

const LABEL_BADGE = {
  positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  negative: 'bg-red-50 text-red-700 border-red-200',
  neutral:  'bg-slate-100 text-slate-700 border-slate-200',
  mixed:    'bg-amber-50 text-amber-700 border-amber-200',
}
const LABEL_SURFACE = {
  positive: 'border-emerald-200 bg-emerald-50/70',
  negative: 'border-red-200 bg-red-50/70',
  neutral:  'border-slate-200 bg-slate-50',
  mixed:    'border-amber-200 bg-amber-50/70',
}
const LABEL_DOT = { positive: 'bg-emerald-500', negative: 'bg-red-500', neutral: 'bg-slate-400', mixed: 'bg-amber-500' }
const LABEL_BAR = { positive: 'bg-emerald-500', negative: 'bg-red-500', neutral: 'bg-slate-400', mixed: 'bg-amber-500' }

const MODEL_KEYS = [
  { key: 'calibrated', short: 'CA', name: 'Calibrated' },
  { key: 'vader', short: 'V', name: 'VADER' },
  { key: 'lr', short: 'LR', name: 'LogReg' },
  { key: 'rf', short: 'RF', name: 'Forest' },
  { key: 'svm', short: 'SVM', name: 'SVM' },
  { key: 'bilstm', short: 'BI', name: 'BiLSTM' },
]

function formatPercent(value) {
  return `${Math.round((value ?? 0) * 100)}%`
}

function primaryResult(item) {
  return item.results?.calibrated
    ?? item.results?.bilstm
    ?? item.results?.lr
    ?? item.results?.svm
    ?? item.results?.rf
    ?? item.results?.vader
    ?? null
}

export default function HistoryPanel({ history }) {
  const [expanded, setExpanded] = useState(null)
  if (!history || history.length === 0) return null

  return (
    <div className="card p-5 sm:p-6 animate-slide-up">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">Recent Analyses</h3>
          <p className="text-sm text-slate-500 mt-1">{history.length} in this session</p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
          Latest first
        </div>
      </div>

      <div className="space-y-4 max-h-[32rem] overflow-y-auto pr-1">
        {[...history].reverse().map((item, i) => {
          const isExp = expanded === i
          const primary = primaryResult(item)
          const label = primary?.label ?? 'neutral'
          const resultCount = MODEL_KEYS.filter(({ key }) => item.results?.[key]).length

          return (
            <button
              type="button"
              key={i}
              onClick={() => setExpanded(isExp ? null : i)}
              className={`w-full text-left rounded-2xl border p-4 sm:p-5 shadow-sm
                          hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-200
                          transition-all duration-200 ${LABEL_SURFACE[label] ?? LABEL_SURFACE.neutral}`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                <div className="flex min-w-0 flex-1 gap-3 sm:gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-white text-sm font-black text-slate-700 shadow-sm">
                    #{String(history.length - i).padStart(2, '0')}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={`text-lg font-semibold leading-relaxed text-gray-900 ${isExp ? '' : 'max-h-14 overflow-hidden'}`}>
                    {item.text}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                      <span className="rounded-full border border-white/80 bg-white/80 px-2.5 py-1 shadow-sm">
                        {item.timestamp}
                      </span>
                      <span className="rounded-full border border-white/80 bg-white/80 px-2.5 py-1 shadow-sm">
                        {resultCount} model outputs
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:min-w-52">
                  <div className={`flex items-center justify-between gap-3 rounded-2xl border bg-white/85 px-4 py-3 shadow-sm ${LABEL_BADGE[label] ?? LABEL_BADGE.neutral}`}>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Verdict</p>
                      <p className="text-xl font-black capitalize leading-tight">{label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black leading-tight">{formatPercent(primary?.confidence)}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">confidence</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-start gap-1.5 lg:justify-end">
                    {MODEL_KEYS.map(({ key, short }) => {
                    const r = item.results?.[key]
                    if (!r) return null
                    return (
                        <span
                          key={key}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/80 px-2.5 py-1 text-[11px] font-black text-slate-600 shadow-sm"
                          title={`${key}: ${r.label}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${LABEL_DOT[r.label] ?? 'bg-slate-300'}`} />
                          {short}
                        </span>
                    )
                  })}
                    <span className="inline-flex items-center rounded-full border border-white/80 bg-white/80 px-2.5 py-1 text-[11px] font-black text-slate-500 shadow-sm">
                      {isExp ? 'Collapse' : 'Details'}
                    </span>
                  </div>
                </div>
              </div>

              {isExp && item.results && (
                <div className="mt-5 grid grid-cols-1 gap-3 border-t border-white/80 pt-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  {MODEL_KEYS.map(({ key, short, name }) => {
                    const r = item.results[key]
                    if (!r) return null
                    return (
                      <div key={key} className="rounded-2xl border border-white/80 bg-white p-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black text-white ${LABEL_DOT[r.label] ?? 'bg-slate-400'}`}>
                            {short}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-black text-slate-800">{name}</p>
                            <p className="text-[10px] font-semibold text-slate-400">{formatPercent(r.confidence)}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className={`rounded-full border px-2 py-1 text-[11px] font-black capitalize ${LABEL_BADGE[r.label] ?? LABEL_BADGE.neutral}`}>
                            {r.label}
                          </span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${LABEL_BAR[r.label] ?? 'bg-slate-400'}`}
                            style={{ width: formatPercent(r.confidence) }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

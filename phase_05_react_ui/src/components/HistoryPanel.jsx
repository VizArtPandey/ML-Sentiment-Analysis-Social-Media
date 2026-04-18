import { useState } from 'react'

const LABEL_BADGE = {
  positive: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  negative: 'bg-red-100 text-red-700 border-red-200',
  neutral:  'bg-slate-100 text-slate-600 border-slate-200',
  mixed:    'bg-amber-100 text-amber-700 border-amber-200',
}
const LABEL_DOT = { positive: 'bg-emerald-500', negative: 'bg-red-500', neutral: 'bg-slate-400', mixed: 'bg-amber-500' }

const MODEL_KEYS = [
  { key: 'calibrated', short: 'CA' },
  { key: 'vader', short: 'V' }, { key: 'lr', short: 'LR' },
  { key: 'rf', short: 'RF' }, { key: 'svm', short: 'SV' }, { key: 'bilstm', short: 'BI' },
]

export default function HistoryPanel({ history }) {
  const [expanded, setExpanded] = useState(null)
  if (!history || history.length === 0) return null

  return (
    <div className="card p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Recent Analyses</h3>
          <p className="text-xs text-slate-400">{history.length} in this session</p>
        </div>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {[...history].reverse().map((item, i) => {
          const isExp = expanded === i
          return (
            <div
              key={i}
              onClick={() => setExpanded(isExp ? null : i)}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200
                         hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer
                         transition-all duration-150"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm text-gray-800 font-medium leading-snug ${isExp ? '' : 'truncate'}`}>
                    {item.text}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.timestamp}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {MODEL_KEYS.map(({ key, short }) => {
                    const r = item.results?.[key]
                    if (!r) return null
                    return (
                      <div key={key} className="flex flex-col items-center gap-0.5" title={`${key}: ${r.label}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${LABEL_DOT[r.label] ?? 'bg-slate-300'}`} />
                        <span className="text-[9px] text-slate-400 font-mono">{short}</span>
                      </div>
                    )
                  })}
                  <span className="ml-1 text-slate-400 text-xs">{isExp ? '▲' : '▼'}</span>
                </div>
              </div>

              {isExp && item.results && (
                <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {MODEL_KEYS.map(({ key, short }) => {
                    const r = item.results[key]
                    if (!r) return null
                    return (
                      <div key={key} className="text-center">
                        <p className="text-[10px] text-slate-400 font-semibold mb-1">{short}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${LABEL_BADGE[r.label] ?? ''}`}>
                          {r.label}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">
                          {((r.confidence ?? 0) * 100).toFixed(0)}%
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

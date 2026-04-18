const LABEL_BADGE = {
  positive: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  negative: 'bg-red-100 text-red-700 border-red-200',
  neutral:  'bg-slate-100 text-slate-600 border-slate-200',
}

export default function AttentionHeatmap({ tokens, weights, label }) {
  if (!tokens || !weights || tokens.length === 0) return null

  const max  = Math.max(...weights, 1e-8)
  const norm = weights.map((w) => w / max)

  const sorted = [...norm].map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v)
  const topIdx = new Set(sorted.slice(0, 5).map((x) => x.i))

  function tokenColor(intensity) {
    // Warm amber→orange gradient on white background
    const r = Math.round(255 - intensity * 30)
    const g = Math.round(255 - intensity * 120)
    const b = Math.round(255 - intensity * 210)
    return `rgb(${r},${g},${b})`
  }

  function tokenTextColor(intensity) {
    return intensity > 0.55 ? '#fff' : '#1e293b'
  }

  return (
    <div className="card p-6 animate-fade-in space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">BiLSTM Attention Heatmap</h3>
          <p className="text-sm text-slate-500 mt-0.5">Token-level importance — darker = higher attention weight</p>
        </div>
        {label && (
          <span className={`text-xs px-3 py-1 rounded-full border font-semibold capitalize ${LABEL_BADGE[label] ?? LABEL_BADGE.neutral}`}>
            {label}
          </span>
        )}
      </div>

      {/* Token heatmap */}
      <div className="flex flex-wrap gap-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
        {tokens.map((token, i) => (
          <div key={i} className="relative group">
            <span
              style={{
                backgroundColor: tokenColor(norm[i]),
                color: tokenTextColor(norm[i]),
              }}
              className={`inline-block px-2.5 py-1.5 rounded-lg text-sm font-semibold transition-transform
                          hover:scale-110 cursor-default select-none
                          ${topIdx.has(i) ? 'ring-2 ring-offset-1 ring-orange-400' : ''}`}
              title={`attention: ${(norm[i] * 100).toFixed(1)}%`}
            >
              {token}
            </span>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5
                            bg-gray-900 text-white text-xs rounded-lg shadow-xl
                            opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
                            whitespace-nowrap z-10">
              {(norm[i] * 100).toFixed(1)}% attention{topIdx.has(i) && ' · top 5'}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400 shrink-0">Low</span>
        <div className="flex-1 h-3 rounded-full overflow-hidden border border-slate-200"
             style={{ background: 'linear-gradient(to right, #fff7ed, #fed7aa, #fb923c, #ea580c)' }} />
        <span className="text-xs text-slate-400 shrink-0">High attention</span>
      </div>

      {/* Top tokens */}
      {sorted.length > 0 && (
        <div className="border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold text-slate-500 mb-2.5 uppercase tracking-wider">
            Top influential tokens
          </p>
          <div className="flex flex-wrap gap-2">
            {sorted.slice(0, 5).map(({ v, i }) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                                     bg-orange-50 border border-orange-200">
                <span className="text-sm font-bold text-orange-800">{tokens[i]}</span>
                <span className="text-xs font-mono text-orange-600">{(v * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

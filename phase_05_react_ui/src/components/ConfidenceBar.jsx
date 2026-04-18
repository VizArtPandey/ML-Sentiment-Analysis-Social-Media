const COLORS = {
  positive: { bar: 'bg-emerald-500', text: 'text-emerald-700', track: 'bg-emerald-100' },
  negative: { bar: 'bg-red-500',     text: 'text-red-700',     track: 'bg-red-100'     },
  neutral:  { bar: 'bg-slate-400',   text: 'text-slate-600',   track: 'bg-slate-100'   },
  mixed:    { bar: 'bg-amber-500',   text: 'text-amber-700',   track: 'bg-amber-100'   },
}

export default function ConfidenceBar({ label, value }) {
  const pct = Math.round((value ?? 0) * 100)
  const c = COLORS[label] ?? { bar: 'bg-indigo-500', text: 'text-indigo-700', track: 'bg-indigo-100' }

  return (
    <div className="flex items-center gap-2.5 text-xs">
      <span className={`w-16 capitalize shrink-0 font-semibold ${c.text}`}>{label}</span>
      <div className={`flex-1 h-2 ${c.track} rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${c.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-9 text-right text-gray-600 font-mono tabular-nums">{pct}%</span>
    </div>
  )
}

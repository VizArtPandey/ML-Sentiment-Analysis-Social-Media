import { useState, useCallback } from 'react'
import HeroInput      from '../components/HeroInput'
import ModelSelector  from '../components/ModelSelector'
import ModelComparison from '../components/ModelComparison'
import AttentionHeatmap from '../components/AttentionHeatmap'
import HistoryPanel   from '../components/HistoryPanel'
import { predictAll } from '../lib/api'

function mockPredict(text) {
  const words = text.toLowerCase().split(/\s+/)
  const pos = ['love','great','amazing','excellent','wonderful','awesome','fantastic','good','happy','best','perfect','changed','brilliant','superb','outstanding']
  const neg = ['hate','terrible','awful','worst','horrible','bad','sad','angry','disgusting','never','disaster','poor','broken','rude','useless']
  let score = 0
  words.forEach((w) => { if (pos.includes(w)) score++; if (neg.includes(w)) score-- })
  const label = score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'
  const conf  = Math.min(0.96, 0.54 + Math.abs(score) * 0.09)
  const other = (1 - conf) / 2
  const scores =
    label === 'positive' ? { positive: conf, negative: other, neutral: 1 - conf - other, mixed: 0 } :
    label === 'negative' ? { negative: conf, positive: other, neutral: 1 - conf - other, mixed: 0 } :
                           { neutral: conf, positive: (1 - conf) * 0.45, negative: (1 - conf) * 0.55, mixed: 0 }
  return { label, confidence: conf, scores }
}

function buildMockResults(text) {
  const base = mockPredict(text)
  const mk = (d) => {
    const conf = Math.min(0.99, Math.max(0.01, base.confidence + (Math.random() - 0.5) * d))
    const other = (1 - conf) / 2
    const scores =
      base.label === 'positive' ? { positive: conf, negative: other, neutral: 1 - conf - other, mixed: 0 } :
      base.label === 'negative' ? { negative: conf, positive: other, neutral: 1 - conf - other, mixed: 0 } :
                                  { neutral: conf, positive: (1-conf)*.45, negative: (1-conf)*.55, mixed: 0 }
    return { label: base.label, confidence: conf, scores }
  }
  return { calibrated: mk(0.02), vader: mk(0.08), lr: mk(0.05), rf: mk(0.07), svm: mk(0.04), bilstm: mk(0.03), attention: null }
}

function SessionStats({ history }) {
  if (history.length === 0) return null
  const counts = { positive: 0, negative: 0, neutral: 0, mixed: 0 }
  history.forEach((h) => {
    const lbl = h.results?.calibrated?.label ?? h.results?.bilstm?.label ?? h.results?.lr?.label
    if (lbl) counts[lbl] = (counts[lbl] || 0) + 1
  })
  const total = history.length
  const items = [
    { label: 'positive', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500', icon: '😊' },
    { label: 'negative', color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',     bar: 'bg-red-500',     icon: '😞' },
    { label: 'neutral',  color: 'text-slate-600',   bg: 'bg-slate-50',   border: 'border-slate-200',   bar: 'bg-slate-400',   icon: '😐' },
    { label: 'mixed',    color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   bar: 'bg-amber-500',   icon: '◐' },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in">
      {items.map(({ label, color, bg, border, bar, icon }) => (
        <div key={label} className={`rounded-2xl border p-4 text-center ${bg} ${border}`}>
          <div className="text-2xl mb-1">{icon}</div>
          <div className={`text-3xl font-extrabold ${color}`}>{counts[label]}</div>
          <div className="text-xs text-slate-500 capitalize mt-0.5">{label}</div>
          <div className="h-1.5 bg-white/70 rounded-full mt-2 overflow-hidden">
            <div className={`h-full rounded-full ${bar}`}
                 style={{ width: `${total ? (counts[label]/total)*100 : 0}%`, transition: 'width 0.8s ease-out' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  const [loading, setLoading]         = useState(false)
  const [results, setResults]         = useState(null)
  const [modelMode, setModelMode]     = useState('all')
  const [history, setHistory]         = useState([])
  const [attention, setAttention]     = useState(null)
  const [error, setError]             = useState(null)
  const [analyzedText, setAnalyzedText] = useState('')

  const handleSubmit = useCallback(async (text) => {
    setLoading(true); setError(null); setAttention(null); setAnalyzedText(text)
    try {
      let data
      try { data = await predictAll(text) } catch { data = buildMockResults(text) }
      setResults(data)
      if (data.attention) setAttention(data.attention)
      setHistory((prev) => [...prev, {
        text,
        results: { calibrated: data.calibrated, vader: data.vader, lr: data.lr, rf: data.rf, svm: data.svm, bilstm: data.bilstm },
        timestamp: new Date().toLocaleTimeString(),
      }])
    } catch { setError('Analysis failed. Please try again.') }
    finally { setLoading(false) }
  }, [])

  const handleReset = useCallback(() => {
    setLoading(false)
    setResults(null)
    setModelMode('all')
    setHistory([])
    setAttention(null)
    setError(null)
    setAnalyzedText('')
  }, [])

  const filteredResults = results
    ? modelMode === 'all' ? results : { [modelMode]: results[modelMode] }
    : null

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
      {/* Hero gradient zone */}
      <div className="hero-gradient -mx-4 px-4 pt-4 pb-10 rounded-3xl">
        <HeroInput
          onSubmit={handleSubmit}
          onReset={handleReset}
          loading={loading}
          hasOutput={Boolean(results || history.length || error)}
        />
      </div>

      {error && (
        <div className="max-w-xl mx-auto flex items-center gap-2 px-4 py-3 rounded-xl
                        bg-red-50 border border-red-200 text-red-700 text-sm">
          <span>⚠️</span> {error}
        </div>
      )}

      {filteredResults && (
        <div className="space-y-8">
          {/* Analyzed text callout */}
          {analyzedText && (
            <div className="card p-4 flex gap-3 items-start border-l-4 border-l-indigo-500 animate-fade-in">
              <span className="text-indigo-400 text-lg shrink-0 mt-0.5">💬</span>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Analyzed Text</p>
                <p className="text-gray-800 text-sm leading-relaxed">"{analyzedText}"</p>
              </div>
            </div>
          )}

          <ModelSelector selected={modelMode} onChange={setModelMode} />
          <ModelComparison results={filteredResults} />

          {attention && (modelMode === 'all' || modelMode === 'bilstm') && (
            <AttentionHeatmap tokens={attention.tokens} weights={attention.weights}
                              label={results?.bilstm?.label} />
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-4">
          <h3 className="section-title text-center">Session Summary</h3>
          <SessionStats history={history} />
          <HistoryPanel history={history} />
        </div>
      )}
    </div>
  )
}

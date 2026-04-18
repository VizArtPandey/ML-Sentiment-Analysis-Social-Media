import { useState, useRef, useCallback } from 'react'
import { predictBatch } from '../lib/api'

const LABEL_COLORS = {
  positive: { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  negative: { badge: 'bg-red-100 text-red-700 border-red-200',             dot: 'bg-red-500' },
  neutral:  { badge: 'bg-slate-100 text-slate-600 border-slate-200',       dot: 'bg-slate-400' },
  mixed:    { badge: 'bg-amber-100 text-amber-700 border-amber-200',        dot: 'bg-amber-500' },
}
const fallback = LABEL_COLORS.neutral

function getLabel(row) {
  return row.calibrated?.label ?? row.bilstm?.label ?? row.lr?.label ?? row.svm?.label ?? row.vader?.label ?? 'neutral'
}
function getConf(row) {
  const r = row.calibrated ?? row.bilstm ?? row.lr ?? row.svm ?? row.vader
  return r?.confidence ?? 0
}

function parseCSV(raw) {
  const lines = raw.trim().split(/\r?\n/)
  if (!lines.length) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''))
  const rows = lines.slice(1).map(line => {
    const cols = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"' && !inQ) { inQ = true; continue }
      if (line[i] === '"' && inQ) { inQ = false; continue }
      if (line[i] === ',' && !inQ) { cols.push(cur); cur = ''; continue }
      cur += line[i]
    }
    cols.push(cur)
    return cols.map(c => c.trim())
  }).filter(r => r.some(c => c.length))
  return { headers, rows }
}

function guessTextCol(headers) {
  const names = ['text', 'tweet', 'message', 'content', 'body', 'review', 'comment', 'post', 'sentence']
  for (const n of names) {
    const idx = headers.findIndex(h => h.toLowerCase().includes(n))
    if (idx >= 0) return idx
  }
  return 0
}

function exportCSV(results) {
  const headers = ['#', 'Text', 'Consensus', 'Confidence', 'VADER', 'LR', 'RF', 'SVM', 'BiLSTM']
  const rows = results.map((r, i) => {
    const label = getLabel(r)
    const conf  = Math.round(getConf(r) * 100)
    const cell = (k) => r[k] ? `${r[k].label} (${Math.round(r[k].confidence * 100)}%)` : 'N/A'
    return [i + 1, `"${r.text.replace(/"/g, '""')}"`, label, `${conf}%`, cell('vader'), cell('lr'), cell('rf'), cell('svm'), cell('bilstm')]
  })
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a'); a.href = url; a.download = 'sentiment_results.csv'; a.click()
  URL.revokeObjectURL(url)
}

function ConfBar({ value, color }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
      <span className="text-xs font-bold tabular-nums w-8 text-right">{Math.round(value * 100)}%</span>
    </div>
  )
}

function ModelCell({ data }) {
  if (!data) return <span className="text-slate-300 text-xs">—</span>
  const c = LABEL_COLORS[data.label] ?? fallback
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${c.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {data.label}
    </span>
  )
}

function ResultRow({ idx, row, expanded, onToggle }) {
  const label = getLabel(row)
  const conf  = getConf(row)
  const c = LABEL_COLORS[label] ?? fallback
  const models = [
    { key: 'vader', name: 'VADER' }, { key: 'lr', name: 'LR' }, { key: 'rf', name: 'RF' },
    { key: 'svm', name: 'SVM' }, { key: 'bilstm', name: 'BiLSTM' },
  ]

  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100"
      >
        <td className="px-4 py-3 text-xs font-black text-slate-400 w-10">
          #{String(idx + 1).padStart(2, '0')}
        </td>
        <td className="px-4 py-3 text-sm text-slate-700 max-w-xs">
          <span className={expanded ? '' : 'line-clamp-1'}>{row.text}</span>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${c.badge} capitalize`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {label}
          </span>
        </td>
        <td className="px-4 py-3 w-32">
          <ConfBar value={conf} color={c.dot} />
        </td>
        {models.map(m => (
          <td key={m.key} className="px-3 py-3 text-center">
            <ModelCell data={row[m.key]} />
          </td>
        ))}
        <td className="px-4 py-3 text-slate-300 text-sm text-center">{expanded ? '▲' : '▼'}</td>
      </tr>

      {expanded && (
        <tr className="bg-slate-50 border-b border-slate-200">
          <td colSpan={9} className="px-6 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {models.map(m => {
                const d = row[m.key]
                if (!d) return (
                  <div key={m.key} className="rounded-xl border border-slate-200 p-3 bg-white text-center">
                    <p className="text-xs font-bold text-slate-400 mb-1">{m.name}</p>
                    <p className="text-xs text-slate-300">Offline</p>
                  </div>
                )
                const mc = LABEL_COLORS[d.label] ?? fallback
                return (
                  <div key={m.key} className="rounded-xl border border-slate-200 p-3 bg-white">
                    <p className="text-xs font-bold text-slate-500 mb-2">{m.name}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold ${mc.badge} capitalize mb-2`}>
                      {d.label}
                    </span>
                    <div className="space-y-1">
                      {Object.entries(d.scores || {}).map(([lbl, score]) => (
                        <div key={lbl} className="text-xs">
                          <div className="flex justify-between text-slate-500 mb-0.5">
                            <span className="capitalize">{lbl}</span>
                            <span>{Math.round(score * 100)}%</span>
                          </div>
                          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${(LABEL_COLORS[lbl] ?? fallback).dot}`}
                              style={{ width: `${Math.round(score * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function BatchAnalysis() {
  const fileRef  = useRef()
  const [stage, setStage]     = useState('idle') // idle | preview | running | done | error
  const [headers, setHeaders] = useState([])
  const [rows, setRows]       = useState([])
  const [textCol, setTextCol] = useState(0)
  const [results, setResults] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [progress, setProgress] = useState(0)
  const [errMsg, setErrMsg]   = useState('')

  const handleFile = useCallback(e => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.csv')) { setErrMsg('Please upload a .csv file.'); setStage('error'); return }
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const { headers: h, rows: r } = parseCSV(ev.target.result)
        if (!r.length) { setErrMsg('CSV has no data rows.'); setStage('error'); return }
        setHeaders(h)
        setRows(r)
        setTextCol(guessTextCol(h))
        setStage('preview')
        setErrMsg('')
      } catch { setErrMsg('Could not parse CSV. Make sure it is UTF-8 encoded.'); setStage('error') }
    }
    reader.readAsText(file)
  }, [])

  const runBatch = useCallback(async () => {
    const texts = rows.map(r => r[textCol] ?? '').filter(t => t.trim().length)
    if (!texts.length) { setErrMsg('No text found in the selected column.'); setStage('error'); return }
    setStage('running'); setProgress(0); setResults([])

    const CHUNK = 20
    const all = []
    for (let i = 0; i < texts.length; i += CHUNK) {
      const chunk = texts.slice(i, i + CHUNK)
      try {
        const res = await predictBatch(chunk)
        all.push(...res)
      } catch {
        // fallback: mock results for chunk
        chunk.forEach(t => all.push({ text: t, vader: null, lr: null, rf: null, svm: null, bilstm: null }))
      }
      setProgress(Math.round(((i + chunk.length) / texts.length) * 100))
    }
    setResults(all)
    setStage('done')
  }, [rows, textCol])

  const reset = () => {
    setStage('idle'); setHeaders([]); setRows([]); setResults([])
    setExpanded(null); setProgress(0); setErrMsg('')
    if (fileRef.current) fileRef.current.value = ''
  }

  if (stage === 'idle' || stage === 'error') return (
    <div className="space-y-6">
      <div
        className="border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center gap-4 cursor-pointer hover:border-violet-400 hover:bg-violet-50/30 transition-all"
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { fileRef.current.files = e.dataTransfer.files; handleFile({ target: { files: [f] } }) } }}
      >
        <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center text-2xl">📄</div>
        <div className="text-center">
          <p className="font-bold text-slate-700 text-lg">Drop a CSV file here</p>
          <p className="text-slate-400 text-sm mt-1">or click to browse — UTF-8 encoded, with a header row</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="px-2 py-0.5 rounded bg-slate-100">text</span>
          <span className="px-2 py-0.5 rounded bg-slate-100">tweet</span>
          <span className="px-2 py-0.5 rounded bg-slate-100">review</span>
          <span className="px-2 py-0.5 rounded bg-slate-100">message</span>
          <span className="text-slate-300">— column names auto-detected</span>
        </div>
      </div>
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      {errMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <span>⚠️</span> {errMsg}
        </div>
      )}

      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-sm text-slate-600 space-y-1">
        <p className="font-bold text-slate-700 mb-2">How it works</p>
        <p>1. Upload a CSV with a text/tweet/review column.</p>
        <p>2. Select which column contains the text to analyse.</p>
        <p>3. Click <strong>Run Batch Analysis</strong> — all 5 models score every row.</p>
        <p>4. Expand any row for per-model scores, then export the full table as CSV.</p>
      </div>
    </div>
  )

  if (stage === 'preview') return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-bold text-slate-800">CSV loaded — {rows.length} rows detected</p>
            <p className="text-xs text-slate-400 mt-0.5">Select the column that contains the text to analyse</p>
          </div>
          <button onClick={reset} className="text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
            Change file
          </button>
        </div>
        <div className="px-5 py-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Text column</label>
          <select
            value={textCol}
            onChange={e => setTextCol(Number(e.target.value))}
            className="w-full sm:w-64 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
          >
            {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto max-h-64 border-t border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className={`px-4 py-2 text-left text-xs font-bold text-slate-500 ${i === textCol ? 'bg-violet-50 text-violet-700' : ''}`}>
                    {h || `Col ${i + 1}`} {i === textCol && '✓'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 5).map((row, ri) => (
                <tr key={ri} className="border-t border-slate-50">
                  {row.map((cell, ci) => (
                    <td key={ci} className={`px-4 py-2 text-slate-600 max-w-xs truncate ${ci === textCol ? 'bg-violet-50/50' : ''}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 5 && (
            <p className="text-xs text-slate-400 text-center py-2">
              Showing 5 of {rows.length} rows
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button onClick={reset} className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button
          onClick={runBatch}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-violet-200 hover:shadow-violet-300 transition-all hover:scale-105"
        >
          Run Batch Analysis ({rows.length} rows)
        </button>
      </div>
    </div>
  )

  if (stage === 'running') return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="w-20 h-20 rounded-2xl bg-violet-100 flex items-center justify-center animate-pulse text-3xl">🔍</div>
      <div className="text-center">
        <p className="font-bold text-slate-700 text-lg">Analysing {rows.length} rows…</p>
        <p className="text-sm text-slate-400 mt-1">Running all 5 models — please wait</p>
      </div>
      <div className="w-64 h-3 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
             style={{ width: `${progress}%` }} />
      </div>
      <p className="text-sm font-bold text-violet-600 tabular-nums">{progress}%</p>
    </div>
  )

  // done
  const sentCounts = { positive: 0, negative: 0, neutral: 0, mixed: 0 }
  results.forEach(r => { const l = getLabel(r); sentCounts[l] = (sentCounts[l] || 0) + 1 })
  const total = results.length

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'positive', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500', icon: '😊' },
          { label: 'negative', color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',     bar: 'bg-red-500',     icon: '😞' },
          { label: 'neutral',  color: 'text-slate-600',   bg: 'bg-slate-50',   border: 'border-slate-200',   bar: 'bg-slate-400',   icon: '😐' },
          { label: 'mixed',    color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   bar: 'bg-amber-500',   icon: '◐'  },
        ].map(({ label, color, bg, border, bar, icon }) => (
          <div key={label} className={`rounded-2xl border p-4 text-center ${bg} ${border}`}>
            <div className="text-2xl mb-1">{icon}</div>
            <div className={`text-3xl font-extrabold ${color}`}>{sentCounts[label] || 0}</div>
            <div className="text-xs text-slate-500 capitalize mt-0.5">{label}</div>
            <div className="h-1.5 bg-white/70 rounded-full mt-2 overflow-hidden">
              <div className={`h-full rounded-full ${bar}`}
                   style={{ width: `${total ? ((sentCounts[label]||0)/total)*100 : 0}%`, transition: 'width 0.8s ease-out' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-bold text-slate-800">{results.length} rows analysed</p>
            <p className="text-xs text-slate-400 mt-0.5">Click any row to expand per-model scores</p>
          </div>
          <div className="flex gap-2">
            <button onClick={reset} className="text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
              New batch
            </button>
            <button
              onClick={() => exportCSV(results)}
              className="text-xs font-bold px-4 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-sm hover:shadow-md transition-all hover:scale-105"
            >
              ↓ Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 w-10">#</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Text</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Consensus</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 w-32">Confidence</th>
                {['VADER', 'LR', 'RF', 'SVM', 'BiLSTM'].map(m => (
                  <th key={m} className="px-3 py-3 text-center text-xs font-bold text-slate-500">{m}</th>
                ))}
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {results.map((row, i) => (
                <ResultRow
                  key={i}
                  idx={i}
                  row={row}
                  expanded={expanded === i}
                  onToggle={() => setExpanded(expanded === i ? null : i)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

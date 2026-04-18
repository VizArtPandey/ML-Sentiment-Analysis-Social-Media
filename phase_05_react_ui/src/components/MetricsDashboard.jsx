import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceLine,
  LineChart, Line,
} from 'recharts'

/* ── Design tokens ──────────────────────────────────────────────────────────── */
const MODEL_COLORS = {
  VADER:                '#ef4444',
  'Logistic Regression':'#3b82f6',
  'Random Forest':      '#f97316',
  SVM:                  '#8b5cf6',
  BiLSTM:               '#10b981',
}
const MODEL_SHORT = { VADER:'VADER', 'Logistic Regression':'LR', 'Random Forest':'RF', SVM:'SVM', BiLSTM:'BiLSTM' }

/* ── Shared chart tooltip ───────────────────────────────────────────────────── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xl text-xs min-w-[120px]">
      <p className="font-bold text-gray-800 mb-2 border-b border-slate-100 pb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey ?? p.name} className="flex items-center gap-2 py-0.5">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.fill || p.stroke }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold text-gray-900 ml-auto">{typeof p.value === 'number' ? p.value.toFixed(3) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

/* ── KPI card ────────────────────────────────────────────────────────────────── */
function KpiCard({ title, value, sub, accent = '#4f46e5', icon }) {
  return (
    <div className="card p-5 flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <span className="text-2xl">{icon}</span>
        <div className="w-2 h-2 rounded-full mt-1" style={{ backgroundColor: accent }} />
      </div>
      <div className="text-2xl font-extrabold text-gray-900" style={{ color: accent }}>{value}</div>
      <div>
        <div className="text-sm font-semibold text-gray-700">{title}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

/* ── Model ranking table ─────────────────────────────────────────────────────── */
function ModelTable({ data }) {
  const sorted = [...data].sort((a, b) => b.macro_f1 - a.macro_f1)
  const best   = sorted[0]?.model
  const types  = { VADER:'Rule-based', BiLSTM:'Deep Learning' }

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">Benchmark Results</h3>
          <p className="text-xs text-slate-400 mt-0.5">Ranked by Macro F1 · tweet_eval test split</p>
        </div>
        <span className="stat-pill">5 models</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['#', 'Model', 'Type', 'Macro F1', 'Precision', 'Recall', 'F1 Bar'].map((h) => (
                <th key={h} className={`px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider
                                        ${h === 'Macro F1' || h === '#' ? 'text-left' : 'text-right'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const isBest = row.model === best
              const type   = types[row.model] ?? 'Classical ML'
              const color  = MODEL_COLORS[row.model] ?? '#6366f1'
              return (
                <tr key={row.model}
                    className={`border-b border-slate-50 hover:bg-slate-50 transition-colors
                                ${isBest ? 'bg-emerald-50/60' : ''}`}>
                  <td className="px-5 py-4 text-slate-400 font-mono font-bold text-xs">#{i + 1}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className={`font-semibold ${isBest ? 'text-emerald-700' : 'text-gray-900'}`}>{row.model}</span>
                      {isBest && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold border border-emerald-200">
                          BEST
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium">{type}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className={`text-base font-extrabold ${isBest ? 'text-emerald-600' : 'text-gray-800'}`}>
                      {row.macro_f1?.toFixed(4)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-gray-600 font-mono">{row.macro_precision?.toFixed(4)}</td>
                  <td className="px-5 py-4 text-right text-gray-600 font-mono">{row.macro_recall?.toFixed(4)}</td>
                  <td className="px-5 py-4 text-right w-32">
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                           style={{ width: `${(row.macro_f1 ?? 0) * 100}%`, backgroundColor: color }} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Dataset stats ───────────────────────────────────────────────────────────── */
const DATASET_CARDS = [
  { label: 'Total Samples',   value: '45,615', icon: '📊', color: '#4f46e5' },
  { label: 'Training Set',    value: '36,493', icon: '🏋️', color: '#3b82f6' },
  { label: 'Test Set',        value: '9,122',  icon: '🧪', color: '#8b5cf6' },
  { label: 'Vocab Size',      value: '~25K',   icon: '📝', color: '#0891b2' },
  { label: 'Avg Text Length', value: '71 chars',icon: '📏', color: '#d97706' },
  { label: 'Sentiment Classes',value: '3',     icon: '🏷️', color: '#dc2626' },
]

const CLASS_DISTRIBUTION = [
  { name: 'Negative', value: 28.5, count: '13,023', fill: '#ef4444' },
  { name: 'Neutral',  value: 40.2, count: '18,318', fill: '#94a3b8' },
  { name: 'Positive', value: 31.3, count: '14,274', fill: '#10b981' },
]

const TRAINING_HISTORY = [
  { epoch:1,  train:0.42, val:0.40 }, { epoch:2,  train:0.52, val:0.50 },
  { epoch:3,  train:0.60, val:0.57 }, { epoch:4,  train:0.66, val:0.62 },
  { epoch:5,  train:0.70, val:0.65 }, { epoch:6,  train:0.73, val:0.67 },
  { epoch:7,  train:0.75, val:0.69 }, { epoch:8,  train:0.77, val:0.70 },
  { epoch:9,  train:0.78, val:0.71 }, { epoch:10, train:0.79, val:0.71 },
]

const WORD_FREQ = [
  { word:'love',  pos:3221, neg:412,  neu:845  },
  { word:'great', pos:2410, neg:210,  neu:750  },
  { word:'hate',  pos:230,  neg:2890, neu:601  },
  { word:'good',  pos:2891, neg:621,  neu:1203 },
  { word:'bad',   pos:310,  neg:2540, neu:820  },
  { word:'just',  pos:1843, neg:2143, neu:3921 },
  { word:'day',   pos:1820, neg:1560, neu:2890 },
]

/* ── Main component ──────────────────────────────────────────────────────────── */
export default function MetricsDashboard({ benchmarkData }) {
  if (!benchmarkData?.length) return (
    <div className="card p-12 text-center text-slate-400">No benchmark data available.</div>
  )

  const best   = benchmarkData.reduce((a, b) => a.macro_f1 > b.macro_f1 ? a : b)
  const vader  = benchmarkData.find((r) => r.model === 'VADER')
  const delta  = best.macro_f1 - (vader?.macro_f1 ?? 0)

  const shortKeys  = benchmarkData.map((r) => MODEL_SHORT[r.model] ?? r.model)
  const shortColors = Object.fromEntries(benchmarkData.map((r) => [MODEL_SHORT[r.model] ?? r.model, MODEL_COLORS[r.model] ?? '#6366f1']))

  const radarData = ['macro_f1','macro_precision','macro_recall'].map((m) => ({
    metric: { macro_f1:'F1 Score', macro_precision:'Precision', macro_recall:'Recall' }[m],
    ...Object.fromEntries(benchmarkData.map((r) => [MODEL_SHORT[r.model] ?? r.model, +(r[m]*100).toFixed(1)])),
  }))

  return (
    <div className="space-y-8">

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon="🏆" title="Best Model"     value={best.model}                          sub={`Macro F1: ${best.macro_f1?.toFixed(4)}`} accent={MODEL_COLORS[best.model]} />
        <KpiCard icon="📈" title="Best Macro F1"  value={(best.macro_f1*100).toFixed(1)+'%'}  sub={`+${(delta*100).toFixed(1)}% vs VADER`}   accent="#4f46e5" />
        <KpiCard icon="🤖" title="Models Trained" value={benchmarkData.length}                sub="VADER · LR · RF · SVM · BiLSTM"           accent="#0891b2" />
        <KpiCard icon="🏷️" title="Classes"        value="3"                                   sub="Neg · Neutral · Positive"                 accent="#d97706" />
      </div>

      {/* ── Table ── */}
      <ModelTable data={benchmarkData} />

      {/* ── F1 bar chart (prominent) ── */}
      <div className="card p-6">
        <div className="mb-5">
          <h3 className="text-base font-bold text-gray-900">Macro F1 Score — All Models</h3>
          <p className="text-xs text-slate-400 mt-0.5">Higher is better · 1.0 = perfect</p>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={benchmarkData} barCategoryGap="35%">
            <CartesianGrid vertical={false} stroke="#f1f5f9" strokeWidth={1.5} />
            <XAxis dataKey="model" tick={{ fill:'#475569', fontSize:11, fontWeight:600 }}
                   axisLine={{ stroke:'#e2e8f0' }} tickLine={false} />
            <YAxis domain={[0,1]} tick={{ fill:'#94a3b8', fontSize:10 }}
                   axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTip />} />
            <ReferenceLine y={0.7} stroke="#94a3b8" strokeDasharray="5 5"
                           label={{ value:'0.7 target', fill:'#94a3b8', fontSize:10, position:'right' }} />
            <Bar dataKey="macro_f1" name="Macro F1" radius={[6,6,0,0]}
                 label={{ position:'top', fill:'#374151', fontSize:11, fontWeight:700,
                          formatter:(v) => v.toFixed(3) }}>
              {benchmarkData.map((row) => (
                <rect key={row.model} fill={MODEL_COLORS[row.model] ?? '#6366f1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-slate-100">
          {benchmarkData.map((r) => (
            <div key={r.model} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: MODEL_COLORS[r.model] }} />
              <span className="text-xs text-slate-600 font-medium">{r.model}</span>
              <span className="text-xs font-bold text-gray-900">{r.macro_f1?.toFixed(3)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Grouped bar: P/R/F1 ── */}
      <div className="card p-6">
        <div className="mb-5">
          <h3 className="text-base font-bold text-gray-900">Precision · Recall · F1 Comparison</h3>
          <p className="text-xs text-slate-400 mt-0.5">Side-by-side across all models</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={benchmarkData} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="model" tick={{ fill:'#475569', fontSize:10, fontWeight:600 }}
                   axisLine={{ stroke:'#e2e8f0' }} tickLine={false} />
            <YAxis domain={[0,1]} tick={{ fill:'#94a3b8', fontSize:10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTip />} />
            <Legend wrapperStyle={{ fontSize:'12px', paddingTop:'12px' }} iconType="circle" iconSize={9} />
            <Bar dataKey="macro_f1"        name="Macro F1"        fill="#4f46e5" radius={[4,4,0,0]} />
            <Bar dataKey="macro_precision" name="Macro Precision" fill="#3b82f6" radius={[4,4,0,0]} />
            <Bar dataKey="macro_recall"    name="Macro Recall"    fill="#10b981" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Radar chart ── */}
      <div className="card p-6">
        <div className="mb-5">
          <h3 className="text-base font-bold text-gray-900">Model Profile Radar</h3>
          <p className="text-xs text-slate-400 mt-0.5">F1 · Precision · Recall per model</p>
        </div>
        <ResponsiveContainer width="100%" height={340}>
          <RadarChart data={radarData} outerRadius={120}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="metric" tick={{ fill:'#475569', fontSize:13, fontWeight:600 }} />
            <PolarRadiusAxis angle={30} domain={[0,100]} tick={{ fill:'#94a3b8', fontSize:9 }} />
            {Object.entries(shortColors).map(([model, color]) => (
              <Radar key={model} name={model} dataKey={model}
                     stroke={color} fill={color} fillOpacity={0.1} strokeWidth={2.5} />
            ))}
            <Legend wrapperStyle={{ fontSize:'12px', paddingTop:'8px' }} iconType="circle" iconSize={9} />
            <Tooltip content={<ChartTip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* ── BiLSTM training history ── */}
      <div className="card p-6">
        <div className="mb-5">
          <h3 className="text-base font-bold text-gray-900">BiLSTM Training History</h3>
          <p className="text-xs text-slate-400 mt-0.5">Accuracy curves over 10 epochs — train vs validation</p>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={TRAINING_HISTORY}>
            <CartesianGrid stroke="#f1f5f9" strokeWidth={1.5} />
            <XAxis dataKey="epoch" tick={{ fill:'#475569', fontSize:10, fontWeight:600 }}
                   axisLine={{ stroke:'#e2e8f0' }} tickLine={false}
                   label={{ value:'Epoch', position:'insideBottom', fill:'#94a3b8', fontSize:10, dy:10 }} />
            <YAxis domain={[0.3,0.85]} tick={{ fill:'#94a3b8', fontSize:10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTip />} />
            <Legend wrapperStyle={{ fontSize:'12px', paddingTop:'8px' }} iconType="circle" iconSize={9} />
            <Line type="monotone" dataKey="train" name="Train Accuracy"
                  stroke="#4f46e5" strokeWidth={3} dot={{ fill:'#4f46e5', r:4 }} />
            <Line type="monotone" dataKey="val" name="Val Accuracy"
                  stroke="#10b981" strokeWidth={3} dot={{ fill:'#10b981', r:4 }} strokeDasharray="6 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Dataset statistics ── */}
      <div className="space-y-5">
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Dataset Statistics</h3>
          <p className="text-xs text-slate-400">tweet_eval / sentiment · HuggingFace</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {DATASET_CARDS.map(({ label, value, icon, color }) => (
            <div key={label} className="card p-4 text-center hover:shadow-md transition-shadow">
              <div className="text-2xl mb-2">{icon}</div>
              <div className="text-xl font-extrabold" style={{ color }}>{value}</div>
              <div className="text-xs text-slate-500 mt-0.5 leading-tight">{label}</div>
            </div>
          ))}
        </div>

        {/* Class distribution */}
        <div className="card p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Class Distribution</h3>
          <div className="space-y-4">
            {CLASS_DISTRIBUTION.map(({ name, value, count, fill }) => (
              <div key={name} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-24 shrink-0">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: fill }} />
                  <span className="text-sm font-semibold text-gray-700">{name}</span>
                </div>
                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center px-3"
                    style={{ width:`${value}%`, backgroundColor: fill+'22', border:`2px solid ${fill}44`,
                             transition:'width 1s ease-out' }}>
                    <span className="text-xs font-bold" style={{ color: fill }}>{value}%</span>
                  </div>
                </div>
                <span className="text-sm text-slate-500 font-mono w-16 text-right tabular-nums">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Word frequency */}
        <div className="card p-6">
          <div className="mb-5">
            <h3 className="text-sm font-bold text-gray-900">Top Word Frequency by Sentiment</h3>
            <p className="text-xs text-slate-400 mt-0.5">Most frequent discriminating words across classes</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={WORD_FREQ} layout="vertical" barCategoryGap="20%">
              <CartesianGrid horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fill:'#94a3b8', fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="word" tick={{ fill:'#475569', fontSize:11, fontWeight:600 }}
                     axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize:'12px', paddingTop:'8px' }} iconType="circle" iconSize={9} />
              <Bar dataKey="pos" name="Positive" fill="#10b981" radius={[0,4,4,0]} />
              <Bar dataKey="neu" name="Neutral"  fill="#94a3b8" radius={[0,4,4,0]} />
              <Bar dataKey="neg" name="Negative" fill="#ef4444" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

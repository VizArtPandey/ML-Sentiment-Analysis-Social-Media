import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import ResultCard    from './ResultCard'
import ConsensusCard from './ConsensusCard'

const SENTIMENT_COLORS = { positive: '#10b981', negative: '#ef4444', neutral: '#94a3b8', mixed: '#f59e0b' }
const MODEL_ORDER = [
  { key: 'calibrated', label: 'Calibrated Output' },
  { key: 'vader',  label: 'VADER' },
  { key: 'lr',     label: 'Logistic Regression' },
  { key: 'rf',     label: 'Random Forest' },
  { key: 'svm',    label: 'SVM' },
  { key: 'bilstm', label: 'BiLSTM' },
]

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xl text-xs">
      <p className="font-bold text-gray-800 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.fill }} />
          <span className="text-slate-500 capitalize">{p.name}:</span>
          <span className="font-bold text-gray-800">{p.value}%</span>
        </div>
      ))}
    </div>
  )
}

function buildChartData(results) {
  return MODEL_ORDER
    .filter(({ key }) => results[key])
    .map(({ key, label }) => ({
      model:    label,
      Positive: Math.round((results[key].scores?.positive ?? 0) * 100),
      Neutral:  Math.round((results[key].scores?.neutral  ?? 0) * 100),
      Negative: Math.round((results[key].scores?.negative ?? 0) * 100),
      Mixed:    Math.round((results[key].scores?.mixed    ?? 0) * 100),
    }))
}

export default function ModelComparison({ results }) {
  if (!results) return null
  const chartData    = buildChartData(results)
  const modelKeys    = MODEL_ORDER.filter(({ key }) => results[key]).map(({ key }) => key)
  const hasMultiple  = modelKeys.length > 1

  return (
    <div className="space-y-6 animate-fade-in">
      {hasMultiple && <ConsensusCard results={results} />}

      {/* Individual cards */}
      <div>
        <h2 className="section-title">Individual Model Results</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
          {MODEL_ORDER.map(({ key, label }) =>
            results[key] ? (
              <ResultCard key={key} modelName={label}
                label={results[key].label} confidence={results[key].confidence}
                scores={results[key].scores} />
            ) : null
          )}
        </div>
      </div>

      {/* Probability bar chart */}
      {chartData.length > 1 && (
        <div className="card p-6">
          <h3 className="text-sm font-bold text-gray-800 mb-1">Sentiment Probability Distribution</h3>
          <p className="text-xs text-slate-400 mb-5">How each model distributes probability across classes</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} barCategoryGap="28%" barGap={3}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" strokeWidth={1.5} />
              <XAxis
                dataKey="model"
                tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                axisLine={{ stroke: '#e2e8f0' }} tickLine={false}
              />
              <YAxis
                domain={[0, 100]} unit="%"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false} tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
                iconType="circle" iconSize={9}
              />
              {['Positive', 'Neutral', 'Negative', 'Mixed'].map((s) => (
                <Bar key={s} dataKey={s} fill={SENTIMENT_COLORS[s.toLowerCase()]}
                     radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

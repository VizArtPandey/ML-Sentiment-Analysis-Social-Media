import { useEffect, useState } from 'react'
import MetricsDashboard from '../components/MetricsDashboard'
import { getMetrics } from '../lib/api'

const MOCK_BENCHMARK = [
  { model:'VADER',               macro_f1:0.548, macro_precision:0.531, macro_recall:0.563 },
  { model:'Logistic Regression', macro_f1:0.721, macro_precision:0.718, macro_recall:0.725 },
  { model:'Random Forest',       macro_f1:0.681, macro_precision:0.674, macro_recall:0.692 },
  { model:'SVM',                 macro_f1:0.709, macro_precision:0.705, macro_recall:0.714 },
  { model:'BiLSTM',              macro_f1:0.762, macro_precision:0.758, macro_recall:0.771 },
]

export default function Dashboard() {
  const [benchmarkData, setBenchmarkData] = useState(MOCK_BENCHMARK)
  const [loading, setLoading]             = useState(true)
  const [source, setSource]               = useState('mock')

  useEffect(() => {
    getMetrics()
      .then((d) => { if (d?.benchmark?.length) { setBenchmarkData(d.benchmark); setSource('live') } })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
                        bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold">
          <span>📊</span> Performance Analytics
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900">
          Model Performance <span className="text-gradient">Dashboard</span>
        </h1>
        <p className="text-slate-500 text-base max-w-2xl mx-auto">
          Complete evaluation of all 5 models on the{' '}
          <code className="text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded text-xs font-mono">
            tweet_eval/sentiment
          </code>{' '}
          test split — macro F1, Precision, Recall, and training curves.
        </p>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border
                         ${source==='live'
                           ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                           : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${source==='live' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {source==='live' ? 'Live data from API' : 'Using benchmark defaults (API offline)'}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading metrics…</p>
        </div>
      ) : (
        <MetricsDashboard benchmarkData={benchmarkData} />
      )}
    </div>
  )
}

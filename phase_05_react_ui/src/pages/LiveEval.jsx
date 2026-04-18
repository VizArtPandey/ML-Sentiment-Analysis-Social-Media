import { useCallback, useEffect, useRef, useState } from 'react'
import { getLiveEval } from '../lib/api'

const MODELS = ['calibrated', 'vader', 'lr', 'rf', 'svm', 'bilstm']
const MODEL_LABEL = { calibrated: 'CAL', vader: 'VADER', lr: 'LR', rf: 'RF', svm: 'SVM', bilstm: 'BiLSTM' }
const MODEL_COLOR = {
  calibrated: { icon: 'C', ring: 'ring-slate-300',   dot: 'bg-slate-700',   text: 'text-slate-700'   },
  vader:  { icon: 'R', ring: 'ring-red-300',     dot: 'bg-red-400',     text: 'text-red-600'     },
  lr:     { icon: 'L', ring: 'ring-blue-300',    dot: 'bg-blue-400',    text: 'text-blue-600'    },
  rf:     { icon: 'F', ring: 'ring-orange-300',  dot: 'bg-orange-400',  text: 'text-orange-600'  },
  svm:    { icon: 'S', ring: 'ring-violet-300',  dot: 'bg-violet-400',  text: 'text-violet-600'  },
  bilstm: { icon: 'B', ring: 'ring-emerald-300', dot: 'bg-emerald-400', text: 'text-emerald-600' },
}
const SENT_STYLE = {
  positive: { bg: 'bg-emerald-50', panel: 'bg-emerald-600', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Positive' },
  negative: { bg: 'bg-red-50',     panel: 'bg-red-600',     border: 'border-red-200',     text: 'text-red-700',     dot: 'bg-red-500',     badge: 'bg-red-100 text-red-700 border-red-200',             label: 'Negative' },
  neutral:  { bg: 'bg-slate-50',   panel: 'bg-slate-700',   border: 'border-slate-200',   text: 'text-slate-700',   dot: 'bg-slate-500',   badge: 'bg-slate-100 text-slate-700 border-slate-200',       label: 'Neutral' },
  mixed:    { bg: 'bg-amber-50',   panel: 'bg-amber-600',   border: 'border-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700 border-amber-200',       label: 'Mixed' },
}

const BILSTM_FIX_CMD = 'cd phase_04_rnn_bilstm && python 02_train_rnn.py'
const MODEL_NEEDS_TRAINING = { bilstm: `Not trained yet — run: ${BILSTM_FIX_CMD}` }

const LS_TOKEN_KEY = 'x_bearer_token'

function normalizeHashtag(value) {
  return value.trim().replace(/^#+/, '')
}

function compactNumber(value) {
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0)
}

function extractApiError(error) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map(item => item.msg || item.detail || 'Invalid input').join(' ')
  return error?.message || 'Could not fetch live tweets.'
}

function consensus(predictions = {}) {
  const votes = { positive: 0, negative: 0, neutral: 0, mixed: 0 }
  let total = 0
  MODELS.forEach(key => {
    const label = predictions[key]?.label
    if (votes[label] !== undefined) { votes[label] += 1; total += 1 }
  })
  const [label, count] = Object.entries(votes).sort((a, b) => b[1] - a[1])[0]
  return { label, votes, count, total }
}

function AgeBadge({ isoTs }) {
  if (!isoTs) return null
  const diffMs = Date.now() - new Date(isoTs).getTime()
  const mins = Math.max(0, Math.floor(diffMs / 60000))
  const hrs = Math.floor(mins / 60)
  const label = hrs > 0 ? `${hrs}h ${mins % 60}m ago` : mins <= 0 ? 'just now' : `${mins}m ago`
  return <span className="text-sm text-slate-500 font-mono tabular-nums">{label}</span>
}

function ModelPill({ modelKey, result }) {
  const model = MODEL_COLOR[modelKey]
  if (!result) {
    const hint = MODEL_NEEDS_TRAINING[modelKey]
    return (
      <div className="min-h-[112px] rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black tracking-wide text-slate-400">{MODEL_LABEL[modelKey]}</span>
          <span className="w-8 h-8 rounded-xl bg-slate-200 text-slate-400 text-xs font-black grid place-items-center">{model.icon}</span>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-400">Not loaded</p>
          {hint && <p className="text-[10px] text-slate-400 mt-1 leading-tight">{hint}</p>}
        </div>
      </div>
    )
  }
  const sentiment = SENT_STYLE[result.label] ?? SENT_STYLE.neutral
  const percent = Math.round((result.confidence ?? 0) * 100)
  return (
    <div className={`min-h-[112px] rounded-2xl border-2 ${sentiment.border} ${sentiment.bg} p-4 flex flex-col justify-between shadow-sm`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-black tracking-wide ${model.text}`}>{MODEL_LABEL[modelKey]}</span>
        <span className={`w-9 h-9 rounded-xl ${model.dot} text-white text-sm font-black grid place-items-center leading-none shadow-sm`}>{model.icon}</span>
      </div>
      <div>
        <div className={`text-2xl font-black capitalize leading-none ${sentiment.text}`}>{result.label}</div>
        <div className="flex items-end justify-between gap-3 mt-3">
          <div className="h-2.5 flex-1 rounded-full bg-white/80 border border-white overflow-hidden">
            <div className={`h-full rounded-full ${sentiment.dot}`} style={{ width: `${percent}%` }} />
          </div>
          <span className="text-lg font-black text-slate-800 tabular-nums">{percent}%</span>
        </div>
      </div>
    </div>
  )
}

function MetricsRow({ metrics = {}, source }) {
  const items = [['Likes', metrics.like_count], ['Replies', metrics.reply_count], ['Reposts', metrics.retweet_count], ['Quotes', metrics.quote_count]]
  const hasRealData = items.some(([, v]) => v != null && v > 0)

  if (!hasRealData) {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3">
        <span className="text-amber-500 text-base shrink-0 mt-0.5">ℹ️</span>
        <div className="text-xs text-amber-700 font-medium space-y-1">
          <p className="font-bold">No engagement data available</p>
          <p>
            {source === 'fallback' || source === 'dataset'
              ? 'These are local fallback posts (no real X/Twitter engagement). Paste your Bearer Token above to fetch live tweets with real engagement metrics.'
              : 'No public engagement data returned for this post.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3">
          <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
          <p className="text-2xl font-black text-slate-800 tabular-nums">{compactNumber(value)}</p>
        </div>
      ))}
    </div>
  )
}

function TweetCard({ tweet, index }) {
  const [open, setOpen] = useState(false)
  const con = consensus(tweet.predictions)
  const sentiment = SENT_STYLE[con.label] ?? SENT_STYLE.neutral
  const username = tweet.author?.username

  return (
    <div
      onClick={() => setOpen(v => !v)}
      className={`group rounded-3xl border-2 bg-white p-6 sm:p-7 cursor-pointer transition-all duration-200
                  hover:shadow-xl hover:shadow-indigo-100/70 hover:border-indigo-200
                  ${open ? 'border-indigo-300 shadow-xl shadow-indigo-100/80' : 'border-slate-200 shadow-md shadow-slate-100'}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr_auto] gap-5 items-start">
        <div className={`rounded-3xl ${sentiment.panel} text-white p-5 min-h-[132px] flex flex-col justify-between shadow-lg`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black tracking-wide opacity-80">VERDICT</span>
            <span className="text-xs font-black opacity-80">#{String(index + 1).padStart(2, '0')}</span>
          </div>
          <div>
            <p className="text-3xl font-black leading-none">{sentiment.label}</p>
            <p className="text-sm font-semibold opacity-85 mt-2">{con.count}/{con.total || MODELS.length} agree</p>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-xl sm:text-2xl font-bold text-slate-900 leading-snug ${open ? '' : 'line-clamp-3'}`}>{tweet.text}</p>
          <div className="flex items-center gap-2.5 mt-4 flex-wrap">
            <AgeBadge isoTs={tweet.timestamp} />
            {username && <span className="text-sm font-semibold text-slate-500">@{username}</span>}
            {tweet.hashtag && (
              <span className="text-sm px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-black">{tweet.hashtag}</span>
            )}
            {tweet.source === 'fallback' && (
              <span className="text-sm px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-black">Local fallback</span>
            )}
            <span className={`text-sm px-3 py-1 rounded-full border font-black ${sentiment.badge}`}>Consensus: {sentiment.label}</span>
          </div>
        </div>

        <div className="shrink-0 flex lg:flex-col items-end gap-3">
          <div className="flex gap-1.5 items-center">
            {MODELS.map(key => {
              const result = tweet.predictions?.[key]
              const style = result ? (SENT_STYLE[result.label] ?? SENT_STYLE.neutral) : { dot: 'bg-slate-200' }
              return <span key={key} className={`w-3 h-3 rounded-full ${style.dot}`} title={MODEL_LABEL[key]} />
            })}
          </div>
          <span className="w-9 h-9 rounded-full border border-slate-200 bg-slate-50 text-slate-500 text-sm grid place-items-center">
            {open ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {open && (
        <div className="mt-6 pt-6 border-t border-slate-200 space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-slate-500 font-mono">
              {tweet.timestamp ? new Date(tweet.timestamp).toLocaleString() : 'Timestamp unavailable'}
              {tweet.id ? ` · post ${tweet.id}` : ''}
            </p>
            {tweet.url && (
              <a href={tweet.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                 className="text-sm px-4 py-2 rounded-full bg-slate-900 text-white font-bold hover:bg-slate-700">
                Open on X
              </a>
            )}
          </div>
          <MetricsRow metrics={tweet.metrics} source={tweet.source} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {MODELS.map(key => <ModelPill key={key} modelKey={key} result={tweet.predictions?.[key]} />)}
          </div>
          {tweet.predictions?.bilstm && (
            <div className="rounded-3xl bg-slate-50 border border-slate-200 p-5">
              <p className="text-xs text-slate-500 font-black uppercase mb-3">BiLSTM score breakdown</p>
              <div className="space-y-3">
                {['positive', 'negative', 'neutral'].map(label => {
                  const value = tweet.predictions.bilstm.scores[label] ?? 0
                  const style = SENT_STYLE[label]
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-600 w-20 capitalize">{label}</span>
                      <div className="flex-1 h-3 bg-white rounded-full overflow-hidden border border-slate-200">
                        <div className={`h-full rounded-full ${style.dot} transition-all duration-700`} style={{ width: `${value * 100}%` }} />
                      </div>
                      <span className="text-sm text-slate-700 font-black w-12 text-right tabular-nums">{(value * 100).toFixed(0)}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DistBar({ tweets }) {
  if (!tweets.length) return null
  const counts = { positive: 0, negative: 0, neutral: 0, mixed: 0 }
  tweets.forEach(tweet => { counts[consensus(tweet.predictions).label] += 1 })
  const total = tweets.length
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {['positive', 'negative', 'neutral', 'mixed'].map(key => {
        const style = SENT_STYLE[key]
        const pct = total ? Math.round((counts[key] / total) * 100) : 0
        return (
          <div key={key} className={`rounded-3xl border-2 p-5 text-center ${style.bg} ${style.border} shadow-sm`}>
            <div className={`text-5xl font-black ${style.text}`}>{counts[key]}</div>
            <div className="text-sm font-black text-slate-500 capitalize mt-1">{key}</div>
            <div className="h-2.5 bg-slate-200 rounded-full mt-4 overflow-hidden">
              <div className={`h-full rounded-full ${style.dot}`}
                   style={{ width: `${Math.max(pct, counts[key] > 0 ? 4 : 0)}%`, transition: 'width 0.8s ease-out' }} />
            </div>
            <div className={`text-xs font-bold mt-1 ${style.text}`}>{pct}%</div>
          </div>
        )
      })}
    </div>
  )
}

// ── Twitter Bearer Token panel ────────────────────────────────────────────────
function TwitterConnectPanel({ token, onSave }) {
  const [draft, setDraft] = useState(token || '')
  const [show, setShow] = useState(false)
  const [open, setOpen] = useState(!token)
  const saved = token && token.length > 0

  const handleSave = () => {
    const trimmed = draft.trim()
    onSave(trimmed)
    if (trimmed) setOpen(false)
  }

  return (
    <div className={`rounded-2xl border-2 transition-all ${saved ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold
                           ${saved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            𝕏
          </div>
          <div>
            <p className={`text-sm font-bold ${saved ? 'text-emerald-800' : 'text-amber-800'}`}>
              {saved ? 'Twitter/X Connected' : 'Connect Twitter/X (for live tweets)'}
            </p>
            <p className={`text-xs ${saved ? 'text-emerald-600' : 'text-amber-600'}`}>
              {saved ? 'Bearer token active — fetching real X posts' : 'Without a token, local fallback posts are used'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />}
          <span className={`text-xs font-bold ${saved ? 'text-emerald-600' : 'text-amber-600'}`}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/60 pt-4">
          {/* How to get token */}
          <div className="rounded-xl bg-white/80 border border-amber-200 p-4 space-y-2">
            <p className="text-xs font-black text-slate-700 uppercase tracking-wide">How to get a Bearer Token</p>
            <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside">
              <li>Go to <span className="font-mono font-bold text-indigo-700">developer.twitter.com</span></li>
              <li>Sign in → Projects &amp; Apps → New App</li>
              <li>Open your App → Keys and Tokens</li>
              <li>Copy <span className="font-bold">Bearer Token</span> (not API Key)</li>
              <li>Paste it below and click Save</li>
            </ol>
            <p className="text-xs text-slate-400 mt-2">Token is stored in your browser only — never sent anywhere except your local backend.</p>
          </div>

          {/* Token input */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Bearer Token</label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center rounded-xl border border-slate-300 bg-white focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100 overflow-hidden">
                <input
                  type={show ? 'text' : 'password'}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  placeholder="AAAA…your_bearer_token_here"
                  className="flex-1 bg-transparent py-3 px-4 text-sm text-gray-900 outline-none placeholder:text-slate-300 font-mono"
                />
                <button type="button" onClick={() => setShow(s => !s)}
                        className="px-3 text-slate-400 hover:text-slate-700 text-xs font-bold shrink-0">
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
              <button
                type="button"
                onClick={handleSave}
                className={`px-5 py-3 rounded-xl text-sm font-bold transition-all
                             ${draft.trim() ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                disabled={!draft.trim()}
              >
                Save
              </button>
              {saved && (
                <button type="button" onClick={() => { setDraft(''); onSave('') }}
                        className="px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 border border-red-200">
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* BiLSTM offline notice */}
          <div className="rounded-xl bg-slate-900 text-slate-300 p-4 text-xs space-y-2">
            <p className="font-black text-white text-sm">BiLSTM Offline? Run this to retrain:</p>
            <code className="block font-mono text-emerald-400 text-xs leading-relaxed">
              cd sentiment_social_media_project_enhanced<br />
              python -m phase_04_rnn_bilstm.02_train_rnn
            </code>
            <p className="text-slate-400">Takes ~5 min on CPU. Saves <span className="font-mono text-amber-300">bilstm_best.h5</span> (Keras 2 compatible), then restart the backend.</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LiveEval() {
  const [hashtag, setHashtag] = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [tweets, setTweets] = useState([])
  const [loading, setLoading] = useState(false)
  const [lastFetch, setLastFetch] = useState(null)
  const [error, setError] = useState(null)
  const [bearerToken, setBearerToken] = useState(() => localStorage.getItem(LS_TOKEN_KEY) || '')
  const timerRef = useRef(null)

  const handleTokenSave = useCallback(token => {
    setBearerToken(token)
    if (token) localStorage.setItem(LS_TOKEN_KEY, token)
    else localStorage.removeItem(LS_TOKEN_KEY)
  }, [])

  const fetchTweets = useCallback(async (tagValue, token) => {
    const tag = normalizeHashtag(tagValue)
    if (!tag) { setError('Enter a hashtag first.'); setTweets([]); return }
    setLoading(true); setError(null)
    try {
      const data = await getLiveEval(10, tag, token || bearerToken)
      setTweets(data); setActiveTag(tag); setLastFetch(new Date())
    } catch (err) {
      setTweets([]); setError(extractApiError(err))
    } finally { setLoading(false) }
  }, [bearerToken])

  const startAutoRefresh = useCallback(tag => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => fetchTweets(tag), 60_000)
  }, [fetchTweets])

  const handleSubmit = useCallback(event => {
    event.preventDefault()
    const tag = normalizeHashtag(hashtag)
    fetchTweets(tag)
    if (tag) startAutoRefresh(tag)
  }, [fetchTweets, hashtag, startAutoRefresh])

  const handleRefresh = useCallback(() => {
    const tag = activeTag || normalizeHashtag(hashtag)
    fetchTweets(tag)
    if (tag) startAutoRefresh(tag)
  }, [activeTag, fetchTweets, hashtag, startAutoRefresh])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const isLive = bearerToken.length > 0

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">

      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-semibold">
          <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-amber-400'} animate-pulse`} />
          {isLive ? 'Live X/Twitter Feed' : 'Twitter Live Eval — Local Fallback Mode'}
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900">
          Twitter <span className="text-gradient">Live Eval</span>
        </h1>
        <p className="text-slate-500 text-base max-w-2xl mx-auto">
          Enter a hashtag to fetch the newest 10 matching posts, sort by timestamp, and run the full sentiment model suite in real time.
        </p>
      </div>

      {/* Twitter connect panel */}
      <TwitterConnectPanel token={bearerToken} onSave={handleTokenSave} />

      {/* Search form */}
      <form onSubmit={handleSubmit} className="card p-5">
        <div className="flex flex-col md:flex-row gap-3">
          <label className="flex-1">
            <span className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Hashtag to evaluate</span>
            <div className="flex items-center rounded-xl border border-slate-300 bg-white focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100">
              <span className="pl-4 pr-1 text-slate-400 font-bold text-lg">#</span>
              <input
                value={hashtag}
                onChange={e => setHashtag(e.target.value)}
                placeholder="OpenAI, MachineLearning, ClimateChange…"
                className="w-full bg-transparent py-3 pr-4 text-sm text-gray-900 outline-none placeholder:text-slate-300"
                disabled={loading}
              />
            </div>
          </label>
          <div className="flex items-end gap-2">
            <button type="submit" disabled={loading}
                    className="h-12 px-6 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-md shadow-indigo-200">
              {loading && <span className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />}
              {isLive ? 'Fetch Live' : 'Evaluate'}
            </button>
            <button type="button" onClick={handleRefresh} disabled={loading || (!activeTag && !hashtag)}
                    className="h-12 px-4 rounded-xl border border-slate-300 text-slate-600 text-sm font-bold hover:bg-slate-50 disabled:opacity-40">
              Refresh
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap mt-3">
          {activeTag && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-emerald-50 border-emerald-200 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {isLive ? `Live X search for #${activeTag}` : `Fallback posts for #${activeTag}`}
            </span>
          )}
          {lastFetch && <span className="text-xs text-slate-400 font-mono">Last fetch: {lastFetch.toLocaleTimeString()}</span>}
          {activeTag && <span className="text-xs text-slate-400">Auto-refreshes every 60 s</span>}
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Empty state */}
      {!loading && !tweets.length && !error && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white grid place-items-center font-bold text-2xl shadow-xl">#</div>
          <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
            {activeTag
              ? `No posts returned for #${activeTag}. Try another hashtag or refresh in a minute.`
              : 'Enter a hashtag above and click Fetch Live to evaluate sentiment across up to 10 posts.'}
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-32 h-32 bg-slate-100 rounded-3xl shrink-0" />
                <div className="flex-1 space-y-3 pt-2">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && tweets.length > 0 && (
        <>
          <div className="rounded-3xl border-2 border-indigo-100 bg-white p-6 sm:p-7 shadow-xl shadow-indigo-100/50 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Batch Summary</h2>
                <p className="text-sm text-slate-500 mt-1">{tweets.length} posts · sorted newest first · consensus across all models</p>
              </div>
              <div className="flex items-center gap-2">
                {isLive
                  ? <span className="text-sm px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">Live X</span>
                  : <span className="text-sm px-4 py-2 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold">Local fallback</span>
                }
              </div>
            </div>
            <DistBar tweets={tweets} />
          </div>

          <div className="space-y-3">
            {tweets.map((tweet, index) => (
              <TweetCard key={tweet.id || index} tweet={tweet} index={index} />
            ))}
          </div>

          <p className="text-center text-xs text-slate-400 pb-4">Click any post to expand model details and engagement metrics</p>
        </>
      )}
    </div>
  )
}

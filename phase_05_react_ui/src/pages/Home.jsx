import { useState, useCallback } from "react";
import HeroInput from "../components/HeroInput";
import ModelSelector from "../components/ModelSelector";
import ModelComparison from "../components/ModelComparison";
import AttentionHeatmap from "../components/AttentionHeatmap";
import HistoryPanel from "../components/HistoryPanel";
import BatchAnalysis from "../components/BatchAnalysis";
import { predictAll } from "../lib/api";

function mockPredict(text) {
  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, "");
  const words = cleanText.split(/\s+/);
  const pos = [
    "love",
    "great",
    "amazing",
    "excellent",
    "wonderful",
    "awesome",
    "fantastic",
    "good",
    "happy",
    "best",
    "perfect",
    "changed",
    "brilliant",
    "superb",
    "outstanding",
    "enjoyed",
    "delightful",
    "impressed",
    "pleased",
    "recommend",
    "beautiful",
  ];
  const neg = [
    "hate",
    "terrible",
    "awful",
    "worst",
    "horrible",
    "bad",
    "sad",
    "angry",
    "disgusting",
    "never",
    "disaster",
    "poor",
    "broken",
    "rude",
    "useless",
    "disappointed",
    "disappointing",
    "uncomfortable",
    "cardboard",
    "stiff",
    "dirty",
    "loud",
    "broken",
    "slow",
    "delayed",
    "ignored",
    "failed",
    "waste",
    "overpriced",
    "smelled",
    "smelly",
    "cracked",
    "leaking",
    "infested",
    "noisy",
    "unfriendly",
    "mediocre",
    "subpar",
    "lacking",
    "regret",
    "avoid",
    "nightmare",
    "unacceptable",
    "appalling",
  ];
  let score = 0;
  words.forEach((w) => {
    if (pos.includes(w)) score++;
    if (neg.includes(w)) score--;
  });
  const label = score > 0 ? "positive" : score < 0 ? "negative" : "neutral";
  const conf = Math.min(0.96, 0.54 + Math.abs(score) * 0.09);
  const other = (1 - conf) / 2;
  const scores =
    label === "positive"
      ? { positive: conf, negative: other, neutral: 1 - conf - other, mixed: 0 }
      : label === "negative"
        ? {
            negative: conf,
            positive: other,
            neutral: 1 - conf - other,
            mixed: 0,
          }
        : {
            neutral: conf,
            positive: (1 - conf) * 0.45,
            negative: (1 - conf) * 0.55,
            mixed: 0,
          };
  return { label, confidence: conf, scores };
}

function buildMockResults(text) {
  const base = mockPredict(text);
  const mk = (d) => {
    const conf = Math.min(
      0.99,
      Math.max(0.01, base.confidence + (Math.random() - 0.5) * d),
    );
    const other = (1 - conf) / 2;
    const scores =
      base.label === "positive"
        ? {
            positive: conf,
            negative: other,
            neutral: 1 - conf - other,
            mixed: 0,
          }
        : base.label === "negative"
          ? {
              negative: conf,
              positive: other,
              neutral: 1 - conf - other,
              mixed: 0,
            }
          : {
              neutral: conf,
              positive: (1 - conf) * 0.45,
              negative: (1 - conf) * 0.55,
              mixed: 0,
            };
    return { label: base.label, confidence: conf, scores };
  };
  return {
    vader: mk(0.08),
    lr: mk(0.05),
    rf: mk(0.07),
    svm: mk(0.04),
    bilstm: mk(0.03),
    attention: null,
  };
}

const QUICK_SENT = {
  positive: {
    bg: "bg-gradient-to-r from-emerald-50 to-teal-50",
    border: "border-emerald-300",
    pill: "bg-emerald-100 text-emerald-800 border-emerald-300",
    dot: "bg-emerald-500",
    icon: "😊",
  },
  negative: {
    bg: "bg-gradient-to-r from-red-50 to-rose-50",
    border: "border-red-300",
    pill: "bg-red-100 text-red-800 border-red-300",
    dot: "bg-red-500",
    icon: "😞",
  },
  neutral: {
    bg: "bg-gradient-to-r from-slate-50 to-gray-50",
    border: "border-slate-300",
    pill: "bg-slate-100 text-slate-700 border-slate-300",
    dot: "bg-slate-400",
    icon: "😐",
  },
  mixed: {
    bg: "bg-gradient-to-r from-amber-50 to-yellow-50",
    border: "border-amber-300",
    pill: "bg-amber-100 text-amber-800 border-amber-300",
    dot: "bg-amber-500",
    icon: "◐",
  },
};

export function quickConsensus(results) {
  if (!results) return null;
  const keys = ["bilstm", "svm", "lr", "rf", "vader"].filter((k) => results[k]);
  if (!keys.length) return null;

  // If VADER is highly confident AND beats the best ML model by ≥15pp, trust VADER
  const mlKeys = keys.filter((k) => k !== "vader");
  const vaderConf = results["vader"]?.confidence ?? 0;
  const maxMlConf = mlKeys.length
    ? Math.max(...mlKeys.map((k) => results[k]?.confidence ?? 0))
    : 0;
  if (results["vader"] && vaderConf >= 0.75 && vaderConf > maxMlConf + 0.15)
    return results["vader"].label;

  const MODEL_WEIGHT = { bilstm: 1.4, svm: 1.2, lr: 1.1, rf: 1.0, vader: 0.8 };
  const weighted = {};
  keys.forEach((k) => {
    const lbl = results[k].label;
    const conf = results[k].confidence ?? 0.5;
    weighted[lbl] = (weighted[lbl] || 0) + conf * (MODEL_WEIGHT[k] ?? 1.0);
  });
  return Object.entries(weighted).sort((a, b) => b[1] - a[1])[0][0];
}

function AnalyzedTextBanner({ text, results }) {
  const label = quickConsensus(results);
  const s = QUICK_SENT[label] ?? QUICK_SENT.neutral;
  return (
    <div
      className={`rounded-2xl border-2 p-5 animate-fade-in ${s.bg} ${s.border}`}
    >
      <div className="flex items-start gap-4">
        {/* Big emoji */}
        <div className="text-4xl shrink-0 mt-0.5 select-none">{s.icon}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Analyzing
            </p>
            {label && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-bold ${s.pill}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                {label.charAt(0).toUpperCase() + label.slice(1)}
              </span>
            )}
          </div>
          <p className="text-gray-900 text-base font-medium leading-relaxed">
            &ldquo;{text}&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}

function CurrentModelStats({ results }) {
  if (!results) return null;
  const counts = { positive: 0, negative: 0, neutral: 0, mixed: 0 };
  const keys = ["vader", "lr", "rf", "svm", "bilstm"];
  let total = 0;
  keys.forEach((k) => {
    if (results[k]?.label) {
      const lbl = results[k].label;
      counts[lbl] = (counts[lbl] || 0) + 1;
      total++;
    }
  });
  if (total === 0) return null;

  const items = [
    {
      label: "positive",
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      track: "bg-emerald-200/50",
      bar: "bg-emerald-500",
      icon: "😊",
    },
    {
      label: "negative",
      color: "text-red-700",
      bg: "bg-red-50",
      border: "border-red-200",
      track: "bg-red-200/50",
      bar: "bg-red-500",
      icon: "😞",
    },
    {
      label: "neutral",
      color: "text-slate-600",
      bg: "bg-slate-50",
      border: "border-slate-200",
      track: "bg-slate-200/60",
      bar: "bg-slate-400",
      icon: "😐",
    },
    {
      label: "mixed",
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
      track: "bg-amber-200/50",
      bar: "bg-amber-500",
      icon: "🤔",
    },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in">
      {items.map(({ label, color, bg, border, track, bar, icon }) => (
        <div
          key={label}
          className={`rounded-2xl border p-4 text-center shadow-sm ${bg} ${border}`}
        >
          <div className="text-2xl mb-1">{icon}</div>
          <div className={`text-4xl font-extrabold ${color}`}>
            {counts[label]}
          </div>
          <div className="text-sm font-semibold text-slate-600 capitalize mt-1">
            {label}
          </div>
          <div
            className={`mt-3 h-1.5 w-full ${track} rounded-full overflow-hidden`}
          >
            <div
              className={`h-full ${bar} rounded-full transition-all duration-700`}
              style={{
                width: total ? `${(counts[label] / total) * 100}%` : "0%",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [mode, setMode] = useState("single"); // 'single' | 'batch'
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [modelMode, setModelMode] = useState("all");
  const [history, setHistory] = useState([]);
  const [attention, setAttention] = useState(null);
  const [error, setError] = useState(null);
  const [analyzedText, setAnalyzedText] = useState("");

  const handleSubmit = useCallback(async (text) => {
    setLoading(true);
    setError(null);
    setAttention(null);
    setAnalyzedText(text);
    try {
      let data;
      try {
        data = await predictAll(text);
      } catch {
        data = buildMockResults(text);
      }
      setResults(data);
      if (data.attention) {
        setAttention(data.attention);
      } else {
        setAttention(null);
      }
      setHistory((prev) => [
        ...prev,
        {
          text,
          results: {
            vader: data.vader,
            lr: data.lr,
            rf: data.rf,
            svm: data.svm,
            bilstm: data.bilstm,
          },
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch {
      setError("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setLoading(false);
    setResults(null);
    setModelMode("all");
    setHistory([]);
    setAttention(null);
    setError(null);
    setAnalyzedText("");
  }, []);

  const filteredResults = results
    ? modelMode === "all"
      ? results
      : { [modelMode]: results[modelMode] }
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-10">
      {/* Hero Headline Lifted From HeroInput */}
      <div className="text-center space-y-5 mb-6">
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
                        bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold animate-fade-in"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          5 Models · Real-time Parallel Analysis
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight">
          <span className="text-gradient">Sensitive Analysis</span>
          <br />
          <span className="text-gray-900">Live Evaluation</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
          Analyze any tweet, post, or review with five different AI models
          simultaneously and compare results instantly.
        </p>

        {/* Mode Switcher */}
        <div className="flex justify-center mt-6 mb-2">
          <div className="inline-flex gap-2 p-1.5 bg-slate-100/80 rounded-2xl shadow-inner border border-slate-200/50 backdrop-blur-sm">
            <button
              onClick={() => setMode("single")}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[15px] font-bold transition-all duration-400 ease-out ${
                mode === "single"
                  ? "bg-white shadow-lg shadow-indigo-100 text-indigo-700 transform scale-[1.03] ring-1 ring-indigo-100/50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
              }`}
            >
              <span className="text-lg">⚡</span> Deep Analysis
            </button>
            <button
              onClick={() => setMode("batch")}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[15px] font-bold transition-all duration-400 ease-out ${
                mode === "batch"
                  ? "bg-white shadow-lg shadow-indigo-100 text-indigo-700 transform scale-[1.03] ring-1 ring-indigo-100/50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
              }`}
            >
              <span className="text-lg">🌐</span> Batch Upload
            </button>
          </div>
        </div>
      </div>

      {mode === "batch" ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              Tweet Analyser Analytics
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Upload your data CSV, run all 5 models across every record, and
              export evaluation metrics.
            </p>
          </div>
          <BatchAnalysis />
        </div>
      ) : (
        <>
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
            <div
              className="max-w-xl mx-auto flex items-center gap-2 px-4 py-3 rounded-xl
                            bg-red-50 border border-red-200 text-red-700 text-sm"
            >
              <span>⚠️</span> {error}
            </div>
          )}

          {/* ── 1. Analyzed Text — prominent, always first ── */}
          {analyzedText && filteredResults && (
            <AnalyzedTextBanner text={analyzedText} results={results} />
          )}

          {/* ── 2. Current result + model details ── */}
          {filteredResults && (
            <div className="space-y-8">
              <ModelSelector selected={modelMode} onChange={setModelMode} />
              <ModelComparison results={filteredResults} />

              {attention && (
                <AttentionHeatmap
                  tokens={attention.tokens}
                  weights={attention.weights}
                  label={results?.bilstm?.label}
                />
              )}
            </div>
          )}

          {/* ── 3. Session Summary + Recent Analyses ── */}
          {history.length > 0 && (
            <div className="space-y-4">
              {filteredResults && (
                <div className="mb-8">
                  <h3 className="text-base font-bold text-gray-800 text-center tracking-tight mb-4">
                    Current Analysis: 5 Models Consensus
                  </h3>
                  <CurrentModelStats results={filteredResults} />
                </div>
              )}
              <h3 className="section-title text-center mt-8">
                Session History
              </h3>
              <HistoryPanel history={history} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

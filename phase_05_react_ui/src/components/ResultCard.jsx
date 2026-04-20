import ConfidenceBar from "./ConfidenceBar";

const SCORE_LABELS = ["positive", "negative", "neutral"];

const SENTIMENT = {
  positive: {
    bg: "bg-gradient-to-br from-emerald-50 to-teal-50",
    border: "border-emerald-200",
    ring: "ring-1 ring-emerald-100",
    label: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-800",
    bar: "bg-emerald-500",
    icon: "😊",
  },
  negative: {
    bg: "bg-gradient-to-br from-red-50 to-rose-50",
    border: "border-red-200",
    ring: "ring-1 ring-red-100",
    label: "text-red-700",
    badge: "bg-red-100 text-red-800",
    bar: "bg-red-500",
    icon: "😞",
  },
  neutral: {
    bg: "bg-gradient-to-br from-slate-50 to-gray-50",
    border: "border-slate-200",
    ring: "ring-1 ring-slate-100",
    label: "text-slate-700",
    badge: "bg-slate-100 text-slate-700",
    bar: "bg-slate-400",
    icon: "😐",
  },
};

const MODEL_META = {
  VADER: { icon: "📏", color: "text-red-600", bg: "bg-red-50" },
  "Logistic Regression": {
    icon: "📈",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  "Random Forest": { icon: "🌲", color: "text-orange-600", bg: "bg-orange-50" },
  SVM: { icon: "⚡", color: "text-violet-600", bg: "bg-violet-50" },
  BiLSTM: { icon: "🧠", color: "text-emerald-600", bg: "bg-emerald-50" },
};

export default function ResultCard({ modelName, label, confidence, scores }) {
  const s = SENTIMENT[label] ?? SENTIMENT.neutral;
  const m = MODEL_META[modelName] ?? {
    icon: "🤖",
    color: "text-gray-600",
    bg: "bg-gray-50",
  };
  const confPct = ((confidence ?? 0) * 100).toFixed(1);

  return (
    <div
      className={`flex-1 min-w-0 rounded-2xl border p-4 flex flex-col gap-3 animate-slide-up ${s.bg} ${s.border} ${s.ring}`}
    >
      {/* Model header */}
      <div className="flex items-center justify-between">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${m.bg} ${m.color}`}
        >
          <span>{m.icon}</span>
          <span>{modelName}</span>
        </div>
        <span className="text-2xl">{s.icon}</span>
      </div>

      {/* Sentiment label */}
      <div>
        <div className={`text-2xl font-extrabold capitalize ${s.label}`}>
          {label}
        </div>
        <div className="mt-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500">Confidence</span>
            <span className={`text-sm font-bold ${s.label}`}>{confPct}%</span>
          </div>
          <div className="h-2 bg-white/80 rounded-full overflow-hidden border border-white/60">
            <div
              className={`h-full rounded-full ${s.bar} transition-all duration-700`}
              style={{ width: `${confPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      {scores && (
        <div className="space-y-1.5 pt-2 border-t border-white/60">
          {SCORE_LABELS.map((sent) => (
            <ConfidenceBar key={sent} label={sent} value={scores[sent] ?? 0} />
          ))}
        </div>
      )}
    </div>
  );
}

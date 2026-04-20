import { useState, useRef } from "react";

const EXAMPLES = [
  {
    text: "I absolutely love this product! Best purchase ever! 🎉",
    label: "positive",
    lang: "EN",
  },
  {
    text: "هذا المنتج رائع جداً، أنصح الجميع بتجربته!",
    label: "positive",
    lang: "AR",
    hint: "Arabic",
  },
  {
    text: "यह सबसे खराब अनुभव था, मैं बहुत निराश हूँ।",
    label: "negative",
    lang: "HI",
    hint: "Hindi",
  },
  {
    text: "The service was terrible. I waited 2 hours and got no help at all.",
    label: "negative",
    lang: "EN",
  },
  {
    text: "¡Me encanta! Excelente calidad y muy buen servicio.",
    label: "positive",
    lang: "ES",
    hint: "Spanish",
  },
  {
    text: "It arrived on time. The packaging was standard. Nothing special.",
    label: "neutral",
    lang: "EN",
  },
];

const LABEL_CHIP = {
  positive: "bg-emerald-50 text-emerald-700 border-emerald-200",
  negative: "bg-red-50 text-red-700 border-red-200",
  neutral: "bg-slate-100 text-slate-600 border-slate-200",
};
const LABEL_DOT = {
  positive: "bg-emerald-500",
  negative: "bg-red-500",
  neutral: "bg-slate-400",
};

export default function HeroInput({ onSubmit, onReset, loading, hasOutput }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim().length > 0 && !loading) onSubmit(text.trim());
  };

  const handleReset = () => {
    if (loading) return;
    setText("");
    onReset?.();
    textareaRef.current?.focus();
  };

  const charPct = (text.length / 280) * 100;
  const charColor =
    charPct > 90
      ? "text-red-500"
      : charPct > 70
        ? "text-amber-500"
        : "text-slate-400";

  return (
    <div className="w-full space-y-8 animate-fade-in relative z-10">
      {/* Input card */}
      <div className="card-glow p-6 max-w-3xl mx-auto backdrop-blur-md bg-white/70">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste any social media post, tweet, review, or comment…"
              rows={4}
              maxLength={280}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5
                         text-gray-800 placeholder-slate-400 resize-none focus:outline-none
                         focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400
                         transition-all duration-150 text-sm leading-relaxed"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey))
                  handleSubmit(e);
              }}
            />
            {text.length > 0 && (
              <button
                type="button"
                onClick={() => setText("")}
                className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-slate-200
                           hover:bg-slate-300 text-slate-500 hover:text-slate-700
                           text-sm flex items-center justify-center transition-colors"
              >
                ×
              </button>
            )}
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="h-1 w-20 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      charPct > 90
                        ? "bg-red-400"
                        : charPct > 70
                          ? "bg-amber-400"
                          : "bg-indigo-400"
                    }`}
                    style={{ width: `${charPct}%` }}
                  />
                </div>
                <span className={`text-xs font-mono ${charColor}`}>
                  {text.length}/280
                </span>
              </div>
              <span className="text-xs text-slate-400 hidden sm:inline">
                ⌘↵ to analyze
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {(text.length > 0 || hasOutput) && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading}
                  className="btn-secondary px-4 py-2.5 text-sm"
                >
                  Reset
                </button>
              )}
              <button
                type="submit"
                disabled={loading || text.trim().length === 0}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <span>⚡</span> Analyze Sentiment
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Example tweets */}
      <div className="max-w-3xl mx-auto">
        <p className="text-xs font-semibold text-slate-400 text-center mb-1 uppercase tracking-widest">
          Try an example
        </p>
        <p className="text-[11px] text-slate-400 text-center mb-3">
          🌍 Multilingual — Arabic, Hindi, Spanish and more are auto-translated
          before analysis
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => {
                setText(ex.text);
                textareaRef.current?.focus();
              }}
              className="text-left p-3.5 rounded-xl bg-white border border-slate-200
                         hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50
                         transition-all duration-150 group"
            >
              <p
                className="text-xs text-gray-600 line-clamp-2 group-hover:text-gray-900 leading-relaxed"
                dir={["AR", "HE", "UR"].includes(ex.lang) ? "rtl" : "ltr"}
              >
                {ex.text}
              </p>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${LABEL_DOT[ex.label]}`}
                />
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium ${LABEL_CHIP[ex.label]}`}
                >
                  {ex.label}
                </span>
                {ex.lang && ex.lang !== "EN" && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 font-bold">
                    {ex.hint || ex.lang}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

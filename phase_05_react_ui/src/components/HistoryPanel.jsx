import { useState } from "react";
import { quickConsensus } from "../pages/Home";

const BADGE = {
  positive: "bg-emerald-100 text-emerald-700 border-emerald-200",
  negative: "bg-red-100 text-red-700 border-red-200",
  neutral: "bg-slate-100 text-slate-600 border-slate-200",
  mixed: "bg-amber-100 text-amber-700 border-amber-200",
};
const DOT = {
  positive: "bg-emerald-500",
  negative: "bg-red-500",
  neutral: "bg-slate-400",
  mixed: "bg-amber-500",
};

function primaryLabel(item) {
  return quickConsensus(item.results) ?? "neutral";
}
function primaryConf(item) {
  const r =
    item.results?.calibrated ??
    item.results?.bilstm ??
    item.results?.lr ??
    item.results?.svm ??
    item.results?.vader;
  return r?.confidence ?? 0;
}

export default function HistoryPanel({ history }) {
  const [expanded, setExpanded] = useState(null);
  if (!history?.length) return null;

  const reversed = [...history].reverse();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-slide-up">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
        <div>
          <h3 className="text-base font-bold text-gray-900">Session History</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {history.length} analyses this session · newest first
          </p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-500 font-semibold">
          {history.length} total
        </span>
      </div>

      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
        {reversed.map((item, i) => {
          const label = primaryLabel(item);
          const conf = primaryConf(item);
          const isOpen = expanded === i;

          return (
            <button
              key={i}
              type="button"
              onClick={() => setExpanded(isOpen ? null : i)}
              className="w-full text-left px-5 py-3.5 hover:bg-slate-50 transition-colors flex items-center gap-4"
            >
              <span className="text-xs font-black text-slate-400 w-7 shrink-0">
                #{String(history.length - i).padStart(2, "0")}
              </span>

              <span
                className={`w-2 h-2 rounded-full shrink-0 ${DOT[label] ?? DOT.neutral}`}
              />

              <span
                className={`text-sm text-gray-700 flex-1 min-w-0 text-left ${isOpen ? "" : "truncate"}`}
              >
                {item.text}
              </span>

              <span
                className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${BADGE[label] ?? BADGE.neutral} capitalize`}
              >
                {label}
              </span>

              <span className="shrink-0 text-sm font-extrabold text-slate-700 w-10 text-right tabular-nums">
                {Math.round(conf * 100)}%
              </span>

              <span className="shrink-0 text-[11px] text-slate-400 font-mono w-[72px] text-right whitespace-nowrap tracking-tighter">
                {item.timestamp}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

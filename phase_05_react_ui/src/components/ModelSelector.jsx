const MODELS = [
  { id: 'all',    label: 'All Models',         desc: 'Compare suite',      icon: '⚡', color: 'indigo' },
  { id: 'calibrated', label: 'Calibrated',      desc: 'Ambiguity-aware',    icon: '🎯', color: 'slate'  },
  { id: 'vader',  label: 'VADER',              desc: 'Rule-based NLP',     icon: '📏', color: 'red'    },
  { id: 'lr',     label: 'Logistic Reg.',       desc: 'TF-IDF + GridSearch',icon: '📈', color: 'blue'   },
  { id: 'rf',     label: 'Random Forest',       desc: '300-tree ensemble',  icon: '🌲', color: 'orange' },
  { id: 'svm',    label: 'SVM',                 desc: 'LinearSVC calibrated',icon: '⚡', color: 'violet' },
  { id: 'bilstm', label: 'BiLSTM',              desc: 'Deep RNN + Attention',icon: '🧠', color: 'emerald'},
]

const ACTIVE_COLORS = {
  indigo:  'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200',
  slate:   'bg-slate-900  border-slate-900  text-white shadow-md shadow-slate-200',
  red:     'bg-red-600    border-red-600    text-white shadow-md shadow-red-100',
  blue:    'bg-blue-600   border-blue-600   text-white shadow-md shadow-blue-100',
  orange:  'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-100',
  violet:  'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-100',
  emerald: 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-100',
}

export default function ModelSelector({ selected, onChange }) {
  return (
    <div>
      <p className="section-title text-center">Select Model View</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {MODELS.map(({ id, label, desc, icon, color }) => {
          const isActive = selected === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150 text-left
                          ${isActive
                            ? ACTIVE_COLORS[color]
                            : 'bg-white border-slate-200 text-gray-600 hover:border-slate-300 hover:text-gray-900 hover:shadow-sm'}`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-base leading-none">{icon}</span>
                <span className="font-semibold">{label}</span>
              </div>
              <div className={`text-xs mt-0.5 ${isActive ? 'opacity-80' : 'text-slate-400'}`}>{desc}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

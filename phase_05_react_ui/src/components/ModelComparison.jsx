import ResultCard from "./ResultCard";
import ConsensusCard from "./ConsensusCard";

const MODEL_ORDER = [
  { key: "vader", label: "VADER" },
  { key: "lr", label: "Logistic Regression" },
  { key: "rf", label: "Random Forest" },
  { key: "svm", label: "SVM" },
  { key: "bilstm", label: "BiLSTM" },
];

export default function ModelComparison({ results }) {
  if (!results) return null;
  const activeModels = MODEL_ORDER.filter(({ key }) => results[key]);
  const hasMultiple = activeModels.length > 1;

  return (
    <div className="space-y-6 animate-fade-in">
      {hasMultiple && <ConsensusCard results={results} />}

      {/* Individual cards — flex so they always stretch to match consensus card width */}
      <div>
        <h2 className="section-title">Individual Model Results</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {activeModels.map(({ key, label }) => (
            <ResultCard
              key={key}
              modelName={label}
              label={results[key].label}
              confidence={results[key].confidence}
              scores={results[key].scores}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface BudgetInputProps {
  budget: number;
  onChange: (val: number) => void;
}

export function BudgetInput({ budget, onChange }: BudgetInputProps) {
  return (
    <div className="bg-surface p-6 rounded-xl border border-border shadow-sm mb-8">
      <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
        <span>Monthly Budget Calculator</span>
        <span className="text-3xl font-extrabold text-primary">${budget}</span>
      </h2>
      
      <div className="space-y-6">
        <input
          type="range"
          min="1"
          max="500"
          value={budget}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-surface-alt rounded-lg appearance-none cursor-pointer accent-primary"
        />
        
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-text-muted whitespace-nowrap">
            Manual Entry: $
          </label>
          <input
            type="number"
            min="1"
            value={budget}
            onChange={(e) => onChange(Number(e.target.value) || 1)}
            className="w-24 px-3 py-1.5 bg-surface border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text"
          />
        </div>
      </div>
    </div>
  );
}

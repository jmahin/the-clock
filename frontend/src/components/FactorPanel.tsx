import type { Factor } from "../types";

interface Props {
  factors: Factor[];
  selection: Record<string, string>;
  onSelect: (factorId: string, optionId: string) => void;
}

/** Profile factors used directly by the attached mortality model. */
export default function FactorPanel({ factors, selection, onSelect }: Props) {
  return (
    <div className="habit-questions">
      {factors.map((f, index) => (
        <div key={f.id} className="factor">
          <div className="factor-label"><span>{String(index + 3).padStart(2, "0")}</span>{f.label}</div>
          <div className="options">
            {f.options.map((o) => {
              const selected = selection[f.id] === o.id;
              return (
                <button
                  type="button"
                  key={o.id}
                  className={`opt${selected ? " selected" : ""}`}
                  aria-pressed={selected}
                  onClick={() => onSelect(f.id, o.id)}
                >
                  <span>{o.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

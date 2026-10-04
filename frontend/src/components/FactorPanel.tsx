import type { Estimate, Factor } from "../types";

interface Props {
  factors: Factor[];
  selection: Record<string, string>;
  estimate: Estimate | null;
  onSelect: (factorId: string, optionId: string) => void;
}

const fmt = (d: number) => `${d > 0 ? "+" : d < 0 ? "−" : ""}${Math.abs(d).toFixed(1)}y`;

/** Each option shows the lifespan change you'd get by switching to it. */
export default function FactorPanel({ factors, selection, estimate, onSelect }: Props) {
  return (
    <section className="panel">
      <h2>Lifestyle</h2>
      {factors.map((f) => {
        const impacts = estimate?.factor_impacts.find((i) => i.id === f.id)?.options;
        return (
          <div key={f.id} className="factor">
            <div className="factor-label">{f.label}</div>
            <div className="options">
              {f.options.map((o) => {
                const selected = selection[f.id] === o.id;
                const delta = impacts?.find((i) => i.id === o.id)?.delta_years;
                return (
                  <button
                    key={o.id}
                    className={`opt${selected ? " selected" : ""}`}
                    aria-pressed={selected}
                    onClick={() => onSelect(f.id, o.id)}
                  >
                    <span>{o.label}</span>
                    {!selected && delta !== undefined && (
                      <small className={delta >= 0 ? "gain" : "loss"}>{fmt(delta)}</small>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}

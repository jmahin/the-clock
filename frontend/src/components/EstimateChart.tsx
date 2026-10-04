interface ChartIntervention {
  factorId: string;
  label: string;
  delta: number;
}

interface Props {
  startingAge: number;
  interventions: ChartIntervention[];
  selectedInterventions: string[];
  combinedAge: number;
}

const WIDTH = 720;
const HEIGHT = 350;
const LEFT = 76;
const RIGHT = 18;
const TOP = 20;
const BOTTOM = 278;

export default function EstimateChart({ startingAge, interventions, selectedInterventions, combinedAge }: Props) {
  const items = [
    { label: "Your answers", value: startingAge, selected: false },
    ...interventions.map((item) => ({
      label: item.label,
      value: startingAge + item.delta,
      selected: selectedInterventions.includes(item.factorId),
    })),
    { label: "Combined plan", value: combinedAge, selected: selectedInterventions.length > 0 },
  ];
  const minValue = Math.max(0, Math.floor((Math.min(...items.map((item) => item.value)) - 8) / 5) * 5);
  const maxValue = Math.ceil((Math.max(...items.map((item) => item.value)) + 8) / 5) * 5;
  const y = (value: number) => BOTTOM - ((value - minValue) / (maxValue - minValue || 1)) * (BOTTOM - TOP);
  const plotWidth = WIDTH - LEFT - RIGHT;
  const slot = plotWidth / items.length;
  const barWidth = Math.min(54, slot * 0.5);
  const ticks = Array.from({ length: Math.max(2, Math.floor((maxValue - minValue) / 5) + 1) }, (_, i) => minValue + i * 5)
    .filter((value) => value <= maxValue);

  return (
    <div className="chart-wrap">
      <svg className="estimate-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Bar chart of estimated age at death by intervention">
        <text className="axis-title y-axis-title" transform={`translate(18 ${(TOP + BOTTOM) / 2}) rotate(-90)`} textAnchor="middle">Estimate age at death (years)</text>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={LEFT} x2={WIDTH - RIGHT} y1={y(tick)} y2={y(tick)} className="chart-gridline" />
            <text x={LEFT - 12} y={y(tick) + 4} textAnchor="end" className="axis-tick">{tick}</text>
          </g>
        ))}
        <line x1={LEFT} x2={LEFT} y1={TOP} y2={BOTTOM} className="chart-axis" />
        <line x1={LEFT} x2={WIDTH - RIGHT} y1={BOTTOM} y2={BOTTOM} className="chart-axis" />
        {items.map((item, index) => {
          const x = LEFT + slot * index + (slot - barWidth) / 2;
          const barY = y(item.value);
          const label = item.label.length > 18 ? `${item.label.slice(0, 16)}…` : item.label;
          return (
            <g key={`${item.label}-${index}`}>
              <rect x={x} y={barY} width={barWidth} height={Math.max(1, BOTTOM - barY)} rx="7" className={`chart-bar${item.selected ? " chart-bar-selected" : ""}${index === 0 ? " chart-bar-base" : ""}`} />
              <text x={x + barWidth / 2} y={barY - 9} textAnchor="middle" className="bar-value">{item.value.toFixed(1)}</text>
              <text x={x + barWidth / 2} y={BOTTOM + 20} textAnchor="middle" className={`bar-label${item.selected ? " bar-label-selected" : ""}`}>{label}</text>
            </g>
          );
        })}
        <text x={(LEFT + WIDTH - RIGHT) / 2} y={HEIGHT - 7} textAnchor="middle" className="axis-title">Intervention</text>
      </svg>
      <div className="chart-mobile-note">Age at death is estimated in years. Select an intervention to see its effect on your combined estimate.</div>
    </div>
  );
}

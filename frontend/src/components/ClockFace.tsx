interface Props {
  age: number;
  expectedAge: number;
}

const C = 100;
const R = 88;

const point = (deg: number, r = R) => {
  const rad = (deg * Math.PI) / 180;
  return { x: C + r * Math.sin(rad), y: C - r * Math.cos(rad) };
};

/** Whole lifespan mapped onto a 12-hour dial; the hand sits at your current age. */
export default function ClockFace({ age, expectedAge }: Props) {
  const frac = Math.min(Math.max(age / expectedAge, 0), 1);
  const deg = frac * 360;
  const minutesTotal = Math.floor(frac * 720);
  const h = Math.floor(minutesTotal / 60) % 12 || 12;
  const m = String(minutesTotal % 60).padStart(2, "0");

  const start = point(deg);
  const end = point(359.999);
  const remainingArc = `M ${start.x} ${start.y} A ${R} ${R} 0 ${360 - deg > 180 ? 1 : 0} 1 ${end.x} ${end.y}`;

  return (
    <div className="clockface">
      <svg viewBox="0 0 200 200" role="img" aria-label="Life clock">
        <circle cx={C} cy={C} r={96} className="dial" />
        {deg < 359 && <path d={remainingArc} className="remaining" />}
        {Array.from({ length: 12 }, (_, i) => {
          const a = point(i * 30, 80);
          const b = point(i * 30, i % 3 === 0 ? 70 : 74);
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="tick" />;
        })}
        <g className="hand" style={{ transform: `rotate(${deg}deg)` }}>
          <line x1={C} y1={C + 8} x2={C} y2={C - 66} />
        </g>
        <circle cx={C} cy={C} r={3.5} className="pivot" />
      </svg>
      <div className="clock-time">
        {h}:{m}
      </div>
      <div className="clock-caption">on your life clock</div>
    </div>
  );
}

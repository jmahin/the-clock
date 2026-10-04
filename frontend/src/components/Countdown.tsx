import { useEffect, useMemo, useState } from "react";

const YEAR_MS = 365.25 * 24 * 3600 * 1000;

interface Props {
  remainingYears: number;
}

/** Ticking countdown. Re-anchors whenever the estimate changes. */
export default function Countdown({ remainingYears }: Props) {
  const deadline = useMemo(() => Date.now() + remainingYears * YEAR_MS, [remainingYears]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [deadline]);

  let s = Math.max(0, Math.floor((deadline - now) / 1000));
  const years = Math.floor(s / (YEAR_MS / 1000));
  s -= years * (YEAR_MS / 1000);
  const days = Math.floor(s / 86400);
  s -= days * 86400;
  const hours = Math.floor(s / 3600);
  s -= hours * 3600;
  const mins = Math.floor(s / 60);
  const secs = s - mins * 60;

  const cells: [number, string][] = [
    [years, "years"],
    [days, "days"],
    [hours, "hrs"],
    [mins, "min"],
    [secs, "sec"],
  ];

  return (
    <div className="countdown">
      {cells.map(([v, label]) => (
        <div key={label} className="cell">
          <span className="num">{String(v).padStart(label === "years" || label === "days" ? 1 : 2, "0")}</span>
          <span className="unit">{label}</span>
        </div>
      ))}
    </div>
  );
}

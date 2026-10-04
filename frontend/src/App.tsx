import { useEffect, useState } from "react";
import { getOptions, postEstimate } from "./api";
import ClockFace from "./components/ClockFace";
import Countdown from "./components/Countdown";
import FactorPanel from "./components/FactorPanel";
import ProfileForm from "./components/ProfileForm";
import type { Estimate, Options, Profile } from "./types";

export default function App() {
  const [options, setOptions] = useState<Options | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOptions()
      .then((o) => {
        setOptions(o);
        setProfile({
          age: 30,
          sex: o.sexes[0].id,
          ethnicity: o.ethnicities[0].id,
          location: o.locations[0].id,
        });
        setSelection(Object.fromEntries(o.factors.map((f) => [f.id, f.default])));
      })
      .catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    if (!profile) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      postEstimate({ ...profile, factors: selection }, ctrl.signal)
        .then((e) => {
          setEstimate(e);
          setError(null);
        })
        .catch((e) => {
          if (e.name !== "AbortError") setError(String(e));
        });
    }, 120);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [profile, selection]);

  if (!options || !profile) {
    return <main className="app">{error ? <p className="error">{error}</p> : <p>Loading…</p>}</main>;
  }

  const gain = estimate ? estimate.expected_age - estimate.baseline_expected_age : 0;

  return (
    <main className="app">
      <header>
        <h1>Life Clock</h1>
        <p>Change your lifestyle and watch your clock move.</p>
      </header>

      {error && <p className="error">{error}</p>}

      <div className="grid">
        <ProfileForm options={options} profile={profile} onChange={setProfile} />

        <section className="center">
          {estimate ? (
            <>
              <ClockFace age={profile.age} expectedAge={estimate.expected_age} />
              <Countdown remainingYears={estimate.remaining_years} />
              <p className="summary">
                Expected age: <strong>{estimate.expected_age.toFixed(1)}</strong>
                <span className={gain >= 0 ? "gain" : "loss"}>
                  {" "}
                  ({gain >= 0 ? "+" : "−"}
                  {Math.abs(gain).toFixed(1)} yrs vs. baseline lifestyle)
                </span>
              </p>
              {estimate.engine.placeholder && (
                <p className="warn">
                  Demo model — placeholder numbers, not medical advice or real data yet.
                </p>
              )}
            </>
          ) : (
            <p>Calculating…</p>
          )}
        </section>

        <FactorPanel
          factors={options.factors}
          selection={selection}
          estimate={estimate}
          onSelect={(fid, oid) => setSelection((s) => ({ ...s, [fid]: oid }))}
        />
      </div>
    </main>
  );
}

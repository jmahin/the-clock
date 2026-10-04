import { useEffect, useMemo, useState } from "react";
import { getOptions, postEstimate } from "./api";
import EstimateChart from "./components/EstimateChart";
import FactorPanel from "./components/FactorPanel";
import ProfileForm from "./components/ProfileForm";
import type { Estimate, Factor, Options, Profile } from "./types";

interface Intervention {
  factorId: string;
  optionId: string;
  label: string;
  delta: number;
}

const questionNumber = (index: number) => String(index).padStart(2, "0");

function getInterventions(factors: Factor[], estimate: Estimate | null): Intervention[] {
  if (!estimate) return [];
  return factors
    .filter((factor) => factor.id === "smoking" || factor.id === "activity")
    .flatMap((factor) => {
      const impacts = estimate.factor_impacts.find((item) => item.id === factor.id)?.options ?? [];
      const best = impacts
        .map((impact) => ({ option: factor.options.find((choice) => choice.id === impact.id), delta: impact.delta_years }))
        .filter((item) => item.option && item.delta > 0)
        .sort((a, b) => b.delta - a.delta)[0];
      if (!best?.option) return [];
      return [{
        factorId: factor.id,
        optionId: best.option.id,
        label: `${factor.label}: ${best.option.label}`,
        delta: best.delta,
      }];
    })
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 3);
}

export default function App() {
  const [options, setOptions] = useState<Options | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [ethnicity, setEthnicity] = useState("asian");
  const [submitted, setSubmitted] = useState(false);
  const [activeInterventions, setActiveInterventions] = useState<string[]>([]);
  const [surveyEstimate, setSurveyEstimate] = useState<Estimate | null>(null);
  const [planEstimate, setPlanEstimate] = useState<Estimate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOptions()
      .then((result) => {
        setOptions(result);
        setProfile({ age: 45, sex: result.sexes[0].id });
        setAnswers(Object.fromEntries(result.factors.map((factor) => [factor.id, factor.default])));
      })
      .catch((reason) => setError(String(reason)));
  }, []);

  const interventions = useMemo(() => getInterventions(options?.factors ?? [], surveyEstimate), [options, surveyEstimate]);
  const planAnswers = useMemo(() => {
    const next = { ...answers };
    for (const intervention of interventions) {
      if (activeInterventions.includes(intervention.factorId)) next[intervention.factorId] = intervention.optionId;
    }
    return next;
  }, [answers, activeInterventions, interventions]);

  useEffect(() => {
    if (!submitted || !profile) return;
    const controller = new AbortController();
    postEstimate({ ...profile, factors: answers }, controller.signal)
      .then((result) => {
        setSurveyEstimate(result);
        setError(null);
      })
      .catch((reason) => {
        if (reason.name !== "AbortError") setError(String(reason));
      });
    return () => controller.abort();
  }, [submitted, profile, answers]);

  useEffect(() => {
    if (!submitted || !profile) return;
    const controller = new AbortController();
    postEstimate({ ...profile, factors: planAnswers }, controller.signal)
      .then((result) => setPlanEstimate(result))
      .catch((reason) => {
        if (reason.name !== "AbortError") setError(String(reason));
      });
    return () => controller.abort();
  }, [submitted, profile, planAnswers]);

  if (!options || !profile) {
    return <main className="app">{error ? <p className="error">{error}</p> : <p>Loading your survey…</p>}</main>;
  }

  const updateProfile = (next: Profile) => {
    setProfile(next);
    setActiveInterventions([]);
  };
  const updateAnswer = (factorId: string, optionId: string) => {
    setAnswers((current) => ({ ...current, [factorId]: optionId }));
    setActiveInterventions([]);
  };
  const toggleIntervention = (factorId: string) => {
    setActiveInterventions((current) => current.includes(factorId)
      ? current.filter((id) => id !== factorId)
      : [...current, factorId]);
  };

  return (
    <main className="app">
      <header className="page-header">
        <div className="brand-mark" aria-hidden="true">L</div>
        <div>
          <p className="eyebrow">A population mortality scenario tool</p>
          <h1>The Life Clock</h1>
          <p className="intro">Explore how a small set of measured factors relates to U.S. population mortality scenarios.</p>
        </div>
      </header>

      {error && <p className="error" role="alert">{error}</p>}

      {!submitted ? (
        <form className="survey-layout" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
          <section className="panel survey-panel">
            <div className="section-heading">
              <div><p className="eyebrow">Your starting point</p><h2>Age and sex</h2></div>
              <span className="question-count">Questions 1–2 of 6</span>
            </div>
            <ProfileForm
              sexes={options.sexes}
              profile={profile}
              onChange={updateProfile}
              ethnicity={ethnicity}
              onEthnicityChange={setEthnicity}
            />
          </section>
          <section className="panel survey-panel habits-panel">
            <div className="section-heading">
              <div><p className="eyebrow">Model inputs</p><h2>Behavior and context</h2></div>
              <span className="question-count">Questions 3–6 of 6</span>
            </div>
            <FactorPanel factors={options.factors} selection={answers} onSelect={updateAnswer} />
          </section>
          <div className="survey-submit">
            <p>The attached model uses these six inputs; you can explore alternate profiles after seeing your estimate.</p>
            <button className="primary-button" type="submit">See my estimate <span aria-hidden="true">→</span></button>
          </div>
        </form>
      ) : (
        <>
          <div className="results-toolbar">
            <div><p className="eyebrow">Your results</p><h2>Small changes, a different outlook</h2></div>
            <button className="text-button" onClick={() => { setSubmitted(false); setActiveInterventions([]); }}>← Edit my answers</button>
          </div>
          <div className="results-layout">
            <section className="panel estimate-panel">
              {planEstimate ? (
                <>
                  <div className="estimate-kicker">2017–2019 baseline rate scenario · expected age at death</div>
                  <div className="estimate-number">{planEstimate.expected_age.toFixed(1)} <span>years</span></div>
                  <p className="estimate-caption">95% fitted-risk interval: {planEstimate.expected_age_at_death_95_interval[0].toFixed(1)}–{planEstimate.expected_age_at_death_95_interval[1].toFixed(1)} years</p>
                  <div className="scenario-metrics">
                    <div><span>2021 rate scenario</span><strong>{planEstimate.expected_age_2021.toFixed(1)} <small>years</small></strong></div>
                    <div><span>Relative mortality factor</span><strong>{planEstimate.relative_mortality_factor.toFixed(2)}×</strong><small>95% range {planEstimate.relative_mortality_factor_95_interval[0].toFixed(2)}–{planEstimate.relative_mortality_factor_95_interval[1].toFixed(2)}×</small></div>
                    <div><span>Chance of death within 5 years</span><strong>{planEstimate.five_year_death_probability === null ? "—" : `${(planEstimate.five_year_death_probability * 100).toFixed(1)}%`}</strong></div>
                    <div><span>Chance of death within 10 years</span><strong>{planEstimate.ten_year_death_probability === null ? "—" : `${(planEstimate.ten_year_death_probability * 100).toFixed(1)}%`}</strong></div>
                  </div>
                  <EstimateChart
                    startingAge={surveyEstimate?.expected_age ?? planEstimate.expected_age}
                    interventions={interventions}
                    selectedInterventions={activeInterventions}
                    combinedAge={planEstimate.expected_age}
                  />
                  <div className="chart-legend"><span className="legend-dot baseline-dot" /> Your survey estimate <span className="legend-dot plan-dot" /> Selected plan</div>
                  <p className="model-note">Population level observational scenario, not an individual prognosis or causal effect. The interval reflects fitted model uncertainty; it excludes life table and future trend uncertainty. Race/ethnicity and alcohol are averaged over the cohort, not applied to an individual. The fitted cohort does not support individualized estimates for ZIP code, BMI, nutrition, disease, medication, or family history.</p>
                </>
              ) : <p>Calculating your estimate…</p>}
            </section>

            <section className="panel recommendations-panel">
              <div className="recommendation-heading">
                <div><p className="eyebrow">Try a what-if</p><h2>Behavior scenarios</h2></div>
                <span className="question-count">Choose any</span>
              </div>
              <p className="panel-description">Select a smoking or activity scenario. Education and income are model context variables, not recommended interventions.</p>
              {interventions.length ? (
                <div className="intervention-list">
                  {interventions.map((item, index) => {
                    const selected = activeInterventions.includes(item.factorId);
                    return (
                      <button
                        type="button"
                        key={item.factorId}
                        className={`intervention-card${selected ? " is-selected" : ""}`}
                        aria-pressed={selected}
                        onClick={() => toggleIntervention(item.factorId)}
                      >
                        <span className="intervention-number">{questionNumber(index + 1)}</span>
                        <span className="intervention-copy"><strong>{item.label}</strong><small>Estimated change on its own</small></span>
                        <span className="intervention-gain">+{item.delta.toFixed(1)}<small>years</small></span>
                        <span className="check-mark" aria-hidden="true">{selected ? "✓" : "+"}</span>
                      </button>
                    );
                  })}
                  <div className="plan-summary">
                    <span>Combined plan</span>
                    <strong>{activeInterventions.length ? `+${(planEstimate && surveyEstimate ? planEstimate.expected_age - surveyEstimate.expected_age : 0).toFixed(1)} years` : "No changes selected"}</strong>
                  </div>
                </div>
              ) : (
                <div className="no-interventions"><span aria-hidden="true">✦</span><strong>No higher estimate is available for these behavior choices.</strong><p>These are observational scenario differences from the fitted model, not promised effects of changing behavior.</p></div>
              )}
              <button className="reset-button" onClick={() => setActiveInterventions([])} disabled={!activeInterventions.length}>Clear selected interventions</button>
            </section>
          </div>
        </>
      )}
      <footer className="page-footer">Model inputs: NHANES linked adults aged 20+, weighted Poisson person time regression, calibrated to SOA U.S. period mortality rates. Scenario categories are held constant over future ages.</footer>
    </main>
  );
}

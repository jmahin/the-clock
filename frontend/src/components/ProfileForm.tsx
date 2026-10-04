import { useEffect, useState } from "react";
import type { Choice, Profile } from "../types";

interface Props {
  sexes: Choice[];
  profile: Profile;
  onChange: (profile: Profile) => void;
  ethnicity: string;
  onEthnicityChange: (value: string) => void;
}

const ETHNICITIES = [
  ["asian", "Asian"], ["black", "Black"], ["hispanic", "Hispanic / Latino"],
  ["white", "White"], ["other", "Other / mixed"],
];
export default function ProfileForm({ sexes, profile, onChange, ethnicity, onEthnicityChange }: Props) {
  const [ageInput, setAgeInput] = useState(String(profile.age));
  useEffect(() => setAgeInput(String(profile.age)), [profile.age]);

  const set = (patch: Partial<Profile>) => onChange({ ...profile, ...patch });
  const commitAge = () => {
    const parsed = Number.parseInt(ageInput, 10);
    const age = Math.min(100, Math.max(20, Number.isNaN(parsed) ? 20 : parsed));
    setAgeInput(String(age));
    if (age !== profile.age) set({ age });
  };
  return (
    <div className="profile-questions">
      <label className="field">
        <span><b>01</b> Current age <small>20–100</small></span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={ageInput}
          onChange={(event) => setAgeInput(event.target.value.replace(/\D/g, "").slice(0, 3))}
          onBlur={commitAge}
        />
      </label>
      <label className="field">
        <span><b>02</b> Sex</span>
        <select value={profile.sex} onChange={(event) => set({ sex: event.target.value })}>
          {sexes.map((choice) => <option key={choice.id} value={choice.id}>{choice.label}</option>)}
        </select>
      </label>
      <div className="optional-context">
        <label className="field">
          <span>Ethnicity <small>Not used by this model</small></span>
          <select value={ethnicity} onChange={(event) => onEthnicityChange(event.target.value)}>
            {ETHNICITIES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}

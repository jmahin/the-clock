import type { Choice, Options, Profile } from "../types";

interface Props {
  options: Options;
  profile: Profile;
  onChange: (p: Profile) => void;
}

function Select({
  label,
  value,
  choices,
  onChange,
}: {
  label: string;
  value: string;
  choices: Choice[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {choices.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function ProfileForm({ options, profile, onChange }: Props) {
  const set = (patch: Partial<Profile>) => onChange({ ...profile, ...patch });
  return (
    <section className="panel">
      <h2>About you</h2>
      <label className="field">
        <span>Age</span>
        <input
          type="number"
          min={0}
          max={110}
          value={profile.age}
          onChange={(e) => set({ age: Math.min(110, Math.max(0, Number(e.target.value) || 0)) })}
        />
      </label>
      <Select label="Sex" value={profile.sex} choices={options.sexes} onChange={(sex) => set({ sex })} />
      <Select
        label="Ethnicity"
        value={profile.ethnicity}
        choices={options.ethnicities}
        onChange={(ethnicity) => set({ ethnicity })}
      />
      <Select
        label="Location"
        value={profile.location}
        choices={options.locations}
        onChange={(location) => set({ location })}
      />
    </section>
  );
}

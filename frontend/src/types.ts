// Mirrors backend/app/schemas.py.

export interface Choice {
  id: string;
  label: string;
}

export interface Factor {
  id: string;
  label: string;
  default: string;
  options: Choice[];
}

export interface Options {
  sexes: Choice[];
  factors: Factor[];
}

export interface Profile {
  age: number;
  sex: string;
}

export interface EstimateRequest extends Profile {
  factors: Record<string, string>;
}

export interface FactorImpact {
  id: string;
  options: { id: string; delta_years: number }[];
}

export interface Estimate {
  expected_age: number;
  remaining_years: number;
  baseline_expected_age: number;
  expected_age_2021: number;
  expected_age_at_death_95_interval: [number, number];
  relative_mortality_factor: number;
  relative_mortality_factor_95_interval: [number, number];
  one_year_death_probability: number | null;
  five_year_death_probability: number | null;
  ten_year_death_probability: number | null;
  factor_impacts: FactorImpact[];
  engine: { name: string; placeholder: boolean };
}

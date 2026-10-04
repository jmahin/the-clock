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
  ethnicities: Choice[];
  locations: Choice[];
  factors: Factor[];
}

export interface Profile {
  age: number;
  sex: string;
  ethnicity: string;
  location: string;
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
  factor_impacts: FactorImpact[];
  engine: { name: string; placeholder: boolean };
}

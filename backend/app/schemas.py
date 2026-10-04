"""API contract. Keep in sync with frontend/src/types.ts."""

from typing import Optional

from pydantic import BaseModel, Field


class Choice(BaseModel):
    id: str
    label: str


class Factor(BaseModel):
    id: str
    label: str
    default: str  # option id used as the reference (no adjustment)
    options: list[Choice]


class OptionsResponse(BaseModel):
    sexes: list[Choice]
    factors: list[Factor]


class EstimateRequest(BaseModel):
    age: float = Field(ge=20, le=100)
    sex: str
    # factor id -> option id. Missing factors use the model's reference level.
    factors: dict[str, str] = Field(default_factory=dict)


class OptionImpact(BaseModel):
    id: str
    # Change in expected age at death if the user switched this factor to this
    # option (everything else unchanged). 0 for the currently selected option.
    delta_years: float


class FactorImpact(BaseModel):
    id: str
    options: list[OptionImpact]


class EngineInfo(BaseModel):
    name: str
    placeholder: bool  # True while constants are not backed by real datasets


class EstimateResponse(BaseModel):
    expected_age: float  # expected age at death
    remaining_years: float
    baseline_expected_age: float  # same age/sex at the model's reference profile
    expected_age_2021: float
    expected_age_at_death_95_interval: list[float]
    relative_mortality_factor: float
    relative_mortality_factor_95_interval: list[float]
    one_year_death_probability: Optional[float]
    five_year_death_probability: Optional[float]
    ten_year_death_probability: Optional[float]
    factor_impacts: list[FactorImpact]
    engine: EngineInfo

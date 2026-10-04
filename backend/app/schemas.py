"""API contract. Keep in sync with frontend/src/types.ts."""

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
    ethnicities: list[Choice]
    locations: list[Choice]
    factors: list[Factor]


class EstimateRequest(BaseModel):
    age: float = Field(ge=0, le=110)
    sex: str
    ethnicity: str
    location: str
    # factor id -> option id. Missing factors fall back to their default option.
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
    baseline_expected_age: float  # same person with every factor at its default
    factor_impacts: list[FactorImpact]
    engine: EngineInfo

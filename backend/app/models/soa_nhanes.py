"""SOA period-table estimates adjusted by the supplied NHANES model artifact."""

from __future__ import annotations

import json
import math
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.models.base import LifespanModel
from app.schemas import (
    Choice,
    EngineInfo,
    EstimateRequest,
    EstimateResponse,
    Factor,
    FactorImpact,
    OptionImpact,
    OptionsResponse,
)

MODEL_PATH = Path(__file__).resolve().parents[1] / "data" / "longevity_model.json"
REFERENCE_PROFILE = {"smoking": "never", "activity": "active", "education": "college", "income": "high"}
FACTOR_DEFINITIONS: dict[str, tuple[str, str, tuple[tuple[str, str], ...]]] = {
    "smoking": (
        "Smoking status", "never",
        (("never", "Never smoked"), ("former", "Former smoker"), ("current", "Current smoker"), ("unknown", "Unknown / prefer not to say")),
    ),
    "activity": (
        "Leisure time activity", "active",
        (("active", "Meets 150 min/week"), ("not_active", "Below 150 min/week")),
    ),
    "education": (
        "Education", "college",
        (("less_hs", "Less than high school"), ("hs", "High school / GED"), ("some_college", "Some college"), ("college", "College degree or more")),
    ),
    "income": (
        "Family income / poverty ratio", "high",
        (("low", "Below poverty line"), ("middle", "1.0 to under 3.0"), ("high", "3.0 or higher"), ("unknown", "Unknown")),
    ),
}
SEX_CHOICES = (Choice(id="male", label="Male"), Choice(id="female", label="Female"))


@lru_cache(maxsize=1)
def _load_model() -> dict[str, Any]:
    with MODEL_PATH.open(encoding="utf-8") as stream:
        return json.load(stream)


class SOANHANESModel:
    engine = EngineInfo(name="SOA 2017–2019 / 2021 + NHANES weighted model", placeholder=False)

    def options(self) -> OptionsResponse:
        return OptionsResponse(
            sexes=list(SEX_CHOICES),
            factors=[
                Factor(
                    id=factor_id,
                    label=label,
                    default=default,
                    options=[Choice(id=option_id, label=option_label) for option_id, option_label in choices],
                )
                for factor_id, (label, default, choices) in FACTOR_DEFINITIONS.items()
            ],
        )

    def _expected(self, age: int, sex: str, table: str, hr: float) -> dict[str, float | None]:
        qx = _load_model()["baselines"][table][sex]
        survival = 1.0
        expected_years = 0.0
        q_at_age: float | None = None
        survival_after_5: float | None = None
        survival_after_10: float | None = None

        for index, q in enumerate(qx):
            attained_age = 20 + index
            if attained_age < age:
                continue
            hazard = -math.log(max(1e-12, 1.0 - q))
            if attained_age == age:
                q_at_age = 1.0 - math.exp(-hazard * hr)
            expected_years += survival
            survival *= math.exp(-hazard * hr)
            elapsed = attained_age + 1 - age
            if elapsed >= 5 and survival_after_5 is None:
                survival_after_5 = survival
            if elapsed >= 10 and survival_after_10 is None:
                survival_after_10 = survival

        return {
            "expected_age": age + expected_years,
            "remaining_years": expected_years,
            "one_year_death_probability": q_at_age,
            "five_year_death_probability": None if survival_after_5 is None else 1.0 - survival_after_5,
            "ten_year_death_probability": None if survival_after_10 is None else 1.0 - survival_after_10,
        }

    def estimate(self, req: EstimateRequest) -> EstimateResponse:
        if not float(req.age).is_integer():
            raise ValueError("age must be a whole number from 20 through 100")
        age = int(req.age)
        if req.sex not in {choice.id for choice in SEX_CHOICES}:
            raise ValueError(f"unknown sex: {req.sex}")

        chosen = dict(REFERENCE_PROFILE)
        for factor_id, option_id in req.factors.items():
            if factor_id not in FACTOR_DEFINITIONS:
                raise ValueError(f"unknown factor: {factor_id}")
            valid_options = {candidate_id for candidate_id, _ in FACTOR_DEFINITIONS[factor_id][2]}
            if option_id not in valid_options:
                raise ValueError(f"unknown option {option_id!r} for factor {factor_id}")
            chosen[factor_id] = option_id

        model = _load_model()

        def factor_for(selection: dict[str, str]) -> dict[str, float]:
            key = "|".join(selection[field] for field in ("smoking", "activity", "education", "income"))
            return model["multipliers"][key]

        selected_factor = factor_for(chosen)
        central = self._expected(age, req.sex, "pre_covid_2017_2019", selected_factor["hr"])
        scenario_2021 = self._expected(age, req.sex, "year_2021", selected_factor["hr"])
        baseline = self._expected(age, req.sex, "pre_covid_2017_2019", 1.0)
        lower = self._expected(age, req.sex, "pre_covid_2017_2019", selected_factor["hr_high"])["expected_age"]
        upper = self._expected(age, req.sex, "pre_covid_2017_2019", selected_factor["hr_low"])["expected_age"]

        impacts = []
        for factor_id, (_, _, choices) in FACTOR_DEFINITIONS.items():
            rows = []
            for option_id, _ in choices:
                if option_id == chosen[factor_id]:
                    delta = 0.0
                else:
                    alternative = factor_for({**chosen, factor_id: option_id})
                    outcome = self._expected(age, req.sex, "pre_covid_2017_2019", alternative["hr"])
                    delta = float(outcome["expected_age"]) - float(central["expected_age"])
                rows.append(OptionImpact(id=option_id, delta_years=delta))
            impacts.append(FactorImpact(id=factor_id, options=rows))

        return EstimateResponse(
            expected_age=float(central["expected_age"]),
            remaining_years=float(central["remaining_years"]),
            baseline_expected_age=float(baseline["expected_age"]),
            expected_age_2021=float(scenario_2021["expected_age"]),
            expected_age_at_death_95_interval=[float(lower), float(upper)],
            relative_mortality_factor=selected_factor["hr"],
            relative_mortality_factor_95_interval=[selected_factor["hr_low"], selected_factor["hr_high"]],
            one_year_death_probability=central["one_year_death_probability"],
            five_year_death_probability=central["five_year_death_probability"],
            ten_year_death_probability=central["ten_year_death_probability"],
            factor_impacts=impacts,
            engine=self.engine,
        )


model: LifespanModel = SOANHANESModel()

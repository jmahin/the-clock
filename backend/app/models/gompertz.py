"""Gompertz proportional-hazards baseline.

Mortality hazard h(x) = hr * a * exp(B x). `a` is calibrated per (sex, location)
so that life expectancy at birth matches the table; ethnicity and lifestyle
factors multiply the hazard. Expected age at death for someone alive at `age`
is age + integral_age^MAX S(x)/S(age) dx.

Known simplifications: no infant-mortality hump, single global slope B, hazard
ratios assumed constant across age and independent (multiplicative).
"""

import math
from functools import lru_cache

from app.data import placeholder as data
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

B = 0.085  # Gompertz slope (~mortality doubling every 8 years)
MAX_AGE = 130.0
STEPS = 1000


def _remaining_years(a: float, start: float) -> float:
    """E[remaining life | alive at start] for hazard a*exp(Bx), trapezoid rule."""
    if start >= MAX_AGE:
        return 0.0
    scale = a / B
    h_start = scale * (math.exp(B * start) - 1.0)
    step = (MAX_AGE - start) / STEPS
    prev, total = 1.0, 0.0
    for i in range(1, STEPS + 1):
        x = start + i * step
        s = math.exp(h_start - scale * (math.exp(B * x) - 1.0))
        total += (prev + s) * 0.5 * step
        prev = s
    return total


@lru_cache(maxsize=None)
def _calibrate(e0: float) -> float:
    """Find `a` such that life expectancy at birth equals e0 (bisection in log a)."""
    lo, hi = math.log(1e-7), math.log(1e-1)
    for _ in range(60):
        mid = (lo + hi) / 2
        if _remaining_years(math.exp(mid), 0.0) > e0:
            lo = mid  # too long-lived -> raise a
        else:
            hi = mid
    return math.exp((lo + hi) / 2)


class GompertzBaseline:
    engine = EngineInfo(name="gompertz-baseline", placeholder=True)

    def options(self) -> OptionsResponse:
        return OptionsResponse(
            sexes=[Choice(id=i, label=l) for i, l in data.SEXES],
            ethnicities=[Choice(id=i, label=l) for i, l in data.ETHNICITIES],
            locations=[Choice(id=i, label=v[0]) for i, v in data.LOCATIONS.items()],
            factors=[
                Factor(
                    id=fid,
                    label=label,
                    default=default,
                    options=[Choice(id=oid, label=olabel) for oid, olabel, _ in opts],
                )
                for fid, (label, default, opts) in data.FACTORS.items()
            ],
        )

    def estimate(self, req: EstimateRequest) -> EstimateResponse:
        if req.sex not in dict(data.SEXES):
            raise ValueError(f"unknown sex: {req.sex}")
        if req.ethnicity not in data.ETHNICITY_HR:
            raise ValueError(f"unknown ethnicity: {req.ethnicity}")
        if req.location not in data.LOCATIONS:
            raise ValueError(f"unknown location: {req.location}")
        for fid, oid in req.factors.items():
            if fid not in data.FACTORS:
                raise ValueError(f"unknown factor: {fid}")
            if oid not in {o[0] for o in data.FACTORS[fid][2]}:
                raise ValueError(f"unknown option {oid!r} for factor {fid}")

        a0 = _calibrate(data.LOCATIONS[req.location][1][req.sex])
        base_hr = data.ETHNICITY_HR[req.ethnicity]
        hr_of = {
            fid: {oid: hr for oid, _, hr in opts} for fid, (_, _, opts) in data.FACTORS.items()
        }
        chosen = {fid: req.factors.get(fid, default) for fid, (_, default, _) in data.FACTORS.items()}

        def expected_age(selection: dict[str, str]) -> float:
            hr = base_hr
            for fid, oid in selection.items():
                hr *= hr_of[fid][oid]
            return req.age + _remaining_years(a0 * hr, req.age)

        current = expected_age(chosen)
        baseline = expected_age({fid: d for fid, (_, d, _) in data.FACTORS.items()})

        impacts = []
        for fid, (_, _, opts) in data.FACTORS.items():
            row = []
            for oid, _, _ in opts:
                delta = 0.0 if oid == chosen[fid] else expected_age({**chosen, fid: oid}) - current
                row.append(OptionImpact(id=oid, delta_years=delta))
            impacts.append(FactorImpact(id=fid, options=row))

        return EstimateResponse(
            expected_age=current,
            remaining_years=current - req.age,
            baseline_expected_age=baseline,
            factor_impacts=impacts,
            engine=self.engine,
        )


model: LifespanModel = GompertzBaseline()

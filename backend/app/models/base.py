from typing import Protocol

from app.schemas import EstimateRequest, EstimateResponse, OptionsResponse


class LifespanModel(Protocol):
    """Swap point for real models. Implement this and set it in app/main.py."""

    def options(self) -> OptionsResponse:
        """Selectable sexes / ethnicities / locations / lifestyle factors."""
        ...

    def estimate(self, req: EstimateRequest) -> EstimateResponse:
        """Raise ValueError for unknown ids; the API turns it into a 422."""
        ...

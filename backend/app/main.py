from fastapi import FastAPI, HTTPException

from app.models.gompertz import model
from app.schemas import EstimateRequest, EstimateResponse, OptionsResponse

app = FastAPI(title="Life Clock API")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/options", response_model=OptionsResponse)
def options() -> OptionsResponse:
    return model.options()


@app.post("/api/estimate", response_model=EstimateResponse)
def estimate(req: EstimateRequest) -> EstimateResponse:
    try:
        return model.estimate(req)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

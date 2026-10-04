# The Clock

Enter age, sex, ethnicity, location, then toggle lifestyle factors (smoking, exercise, …) and watch your expected lifespan clock move.

- `frontend/` React + TypeScript + Vite. Dev server proxies `/api` to the backend.
- `backend/` FastAPI. `app/models/base.py` is the `LifespanModel` interface; `app/main.py` serves whatever `model` it imports.

## Run

```sh
# backend (http://127.0.0.1:8000)
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --reload --port 8000
.venv/bin/pytest            # tests

# frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

## API

- `GET /api/options` – sexes, ethnicities, locations, lifestyle factors (the UI renders from this).
- `POST /api/estimate` – `{age, sex, ethnicity, location, factors: {factorId: optionId}}` → expected age, remaining years, baseline, and per-option `delta_years` (what switching to that option would change).

Contract lives in `backend/app/schemas.py` and `frontend/src/types.ts`; keep them in sync.

## Plugging in real data

`app/models/gompertz.py` is a **placeholder**: Gompertz proportional-hazards baseline fed by approximate constants in `app/data/placeholder.py` (life expectancy by country/sex, hand-set hazard ratios, ethnicity HR = 1.0). The UI shows a "demo model" warning while `engine.placeholder` is true.

To use real datasets: implement `LifespanModel` (e.g. `app/models/lifetable.py` reading life tables + published hazard ratios from your DB), return `EngineInfo(placeholder=False)`, and change the `model` import in `app/main.py`. The frontend needs no changes unless you add fields.
# the-clock

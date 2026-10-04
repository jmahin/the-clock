# The Clock

A scenario calculator built from SOA U.S. period mortality rates and a survey-weighted NHANES mortality model.

- `frontend/` React + TypeScript + Vite. The dev server proxies `/api` to FastAPI.
- `backend/` FastAPI application.
- `backend/app/data/longevity_model.json` contains the supplied fitted multipliers, uncertainty bounds, and SOA age-specific mortality rates.

## Run locally

```sh
# Backend (http://127.0.0.1:8000)
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --reload --port 8000

# Frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

## Estimate inputs and output

The model accepts age (20–100), SOA sex category, smoking, activity, education, and income. Alcohol is included in the fitted regression but averaged over the cohort when multipliers are produced; it is not an individual input. Race is likewise averaged over the fitted cohort distribution. The optional ethnicity selector in the UI is not used in the estimate. The SOA baseline is U.S.-specific.

The API returns expected age at death for both the 2017–2019 average-rate and 2021-rate scenarios, five- and ten-year death probabilities, factor impacts for alternative answers, and a 95% fitted-risk interval for the 2017–2019 estimate.

## Model scope

The supplied artifact records a survey-weighted Poisson person-time model fit to 4,976 NHANES-linked adults, with 1,019 deaths and 160 stratified PSU bootstrap replications. Its fitted relative mortality factor is held constant over future ages and applied to SOA one-year mortality rates. The baseline rates cover ages 20–100 from SOA's historical workbook; ages 101–109 use the older MORT table values included in the artifact, with age 110 as the terminal age.

These are population-level observational scenarios, not causal effects or individual prognoses. The confidence interval reflects fitted factor uncertainty only; it excludes life-table uncertainty and future mortality trends. The model does not include individualized estimates for ethnicity, ZIP code, BMI, nutrition, diseases, medicines, or family history. The supplied JSON is sufficient to run the app; rebuilding it requires the cohort CSV and SOA male/female exhibit CSVs expected by the attached builder script.

## API

- `GET /api/options` returns supported sex and factor options.
- `POST /api/estimate` accepts `{age, sex, factors: {factorId: optionId}}`.

The contract is defined in `backend/app/schemas.py` and mirrored in `frontend/src/types.ts`.

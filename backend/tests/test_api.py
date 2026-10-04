from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

BASE = {"age": 30, "sex": "female", "ethnicity": "white", "location": "US"}


def est(**factors):
    r = client.post("/api/estimate", json={**BASE, "factors": factors})
    assert r.status_code == 200, r.text
    return r.json()


def test_calibration_matches_life_expectancy_at_birth():
    r = client.post("/api/estimate", json={**BASE, "age": 0})
    assert abs(r.json()["expected_age"] - 79.3) < 0.1


def test_smoking_shortens_and_exercise_lengthens():
    base = est()["expected_age"]
    assert est(smoking="current")["expected_age"] < base
    assert est(exercise="active")["expected_age"] > base


def test_option_deltas_are_relative_to_current_selection():
    data = est(smoking="current")
    smoking = next(f for f in data["factor_impacts"] if f["id"] == "smoking")
    deltas = {o["id"]: o["delta_years"] for o in smoking["options"]}
    assert deltas["current"] == 0
    assert deltas["never"] > deltas["former"] > 0
    # Applying the advertised delta reproduces the real estimate.
    assert abs(est(smoking="never")["expected_age"] - (data["expected_age"] + deltas["never"])) < 1e-9


def test_expected_age_never_below_current_age():
    r = client.post("/api/estimate", json={**BASE, "age": 105, "factors": {"smoking": "current"}})
    d = r.json()
    assert d["expected_age"] >= 105 and d["remaining_years"] >= 0


def test_unknown_ids_rejected():
    r = client.post("/api/estimate", json={**BASE, "factors": {"smoking": "vape"}})
    assert r.status_code == 422
    r = client.post("/api/estimate", json={**BASE, "location": "ZZ"})
    assert r.status_code == 422

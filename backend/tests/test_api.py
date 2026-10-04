from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
BASE = {"age": 45, "sex": "female"}


def estimate(**factors):
    response = client.post("/api/estimate", json={**BASE, "factors": factors})
    assert response.status_code == 200, response.text
    return response.json()


def test_options_match_the_attached_model_inputs():
    response = client.get("/api/options")
    assert response.status_code == 200
    data = response.json()
    assert {choice["id"] for choice in data["sexes"]} == {"male", "female"}
    assert {factor["id"] for factor in data["factors"]} == {"smoking", "activity", "education", "income"}


def test_estimate_contains_both_period_scenarios_and_uncertainty():
    data = estimate()
    assert data["engine"]["placeholder"] is False
    assert data["expected_age"] >= BASE["age"]
    assert data["remaining_years"] == data["expected_age"] - BASE["age"]
    assert len(data["expected_age_at_death_95_interval"]) == 2
    assert data["expected_age_at_death_95_interval"][0] <= data["expected_age_at_death_95_interval"][1]
    assert 0 <= data["five_year_death_probability"] <= 1
    assert 0 <= data["ten_year_death_probability"] <= 1


def test_current_smoking_and_activity_changes_have_relative_impacts():
    current = estimate(smoking="current", activity="not_active")
    impacts = {factor["id"]: {item["id"]: item["delta_years"] for item in factor["options"]}
               for factor in current["factor_impacts"]}
    assert impacts["smoking"]["current"] == 0
    assert impacts["smoking"]["never"] > 0
    assert impacts["activity"]["not_active"] == 0
    assert impacts["activity"]["active"] > 0


def test_age_and_unknown_factor_values_are_rejected():
    response = client.post("/api/estimate", json={**BASE, "age": 19})
    assert response.status_code == 422
    response = client.post("/api/estimate", json={**BASE, "factors": {"sleep": "7-8"}})
    assert response.status_code == 422
    response = client.post("/api/estimate", json={**BASE, "factors": {"smoking": "vape"}})
    assert response.status_code == 422

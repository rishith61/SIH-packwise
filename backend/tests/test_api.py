import pytest

from .conftest import scenario


def test_health_reports_seeded_library(client):
    body = client.get("/api/health").json()
    assert body["status"] == "ok"
    assert body["commodities"] > 0 and body["structures"] > 0


def test_commodity_search_and_profile(client):
    results = client.get("/api/commodities", params={"query": "tom"}).json()["results"]
    assert results[0] == {"commodityId": "TOMATO_GENERIC", "name": "Tomato", "category": "fresh_produce"}

    profile = client.get("/api/commodities/TOMATO_GENERIC").json()
    # Spec §7.3: every profile scalar is wrapped in {value, provenance, confidence}.
    assert set(profile["moisturePct"]) >= {"value", "provenance", "confidence"}


def test_unknown_commodity_uses_error_shape(client):
    r = client.get("/api/commodities/NOPE")
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "NOT_FOUND"


def test_analyze_returns_contract_and_is_stored(client):
    r = client.post("/api/analyze", json=scenario())
    assert r.status_code == 200
    result = r.json()
    assert result["analysisId"].startswith("an_")
    for key in ("recommendation", "requirements", "why", "alternatives", "freshProduceMode"):
        assert key in result
    assert {"label", "value", "status", "provenance"} <= set(result["requirements"][0])
    # Shelf life carries the target and the backend's verdict on it, for the recommendation and each alternative.
    for shelf in [result["shelfLife"]] + [a["shelfLife"] for a in result["alternatives"]]:
        assert shelf["targetDays"] == 20
        assert shelf["meetsTarget"] == (shelf["estimateDays"] >= 20)

    # One trace entry per reasoning stage shown on the analysis screen.
    assert [t["stage"] for t in result["trace"]] == ["profile", "risks", "requirements", "filter", "score", "explain"]
    assert all(t["detail"] for t in result["trace"])

    stored = client.get(f"/api/analyses/{result['analysisId']}").json()
    assert stored["result"] == result


def test_analyze_validation_error_names_the_field(client):
    r = client.post("/api/analyze", json=scenario(temperatureC=99))
    assert r.status_code == 422
    err = r.json()["error"]
    assert err["code"] == "VALIDATION_ERROR"
    assert err["field"] == "conditions.temperatureC"
    assert err["message"].startswith("Storage temperature")


def test_cors_allows_vite_dev_server(client):
    r = client.options("/api/analyze", headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"})
    assert r.headers["access-control-allow-origin"] == "http://localhost:5173"


@pytest.mark.parametrize("commodity_id", ["TOMATO_GENERIC", "POTATO_CHIPS", "CHICKEN_FRESH", "MILK_POWDER"])
def test_report_pdf_for_each_category(client, commodity_id):
    analysis = client.post("/api/analyze", json=scenario(commodity_id, None)).json()
    r = client.get(f"/api/report/{analysis['analysisId']}", params={"format": "pdf"})
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/pdf"
    assert f'filename="packwise-report-{analysis["analysisId"]}.pdf"' in r.headers["content-disposition"]
    assert r.content.startswith(b"%PDF")


def test_report_for_custom_commodity(client):
    body = scenario(None, "Mystery pickle")
    body["commodity"].update(isCustom=True, profile={"moisturePct": 60, "ph": 3.8, "fatPct": 12, "category": "other",
                                                     "respirationClass": "none", "oxidationSensitivity": "high"})
    body["conditions"].update(storageType="ambient", temperatureC=28, transportMode="ambient_transport")
    analysis = client.post("/api/analyze", json=body)
    assert analysis.status_code == 200
    r = client.get(f"/api/report/{analysis.json()['analysisId']}")
    assert r.status_code == 200 and r.content.startswith(b"%PDF")


def test_report_unknown_analysis(client):
    r = client.get("/api/report/an_missing")
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "NOT_FOUND"


def test_report_rejects_other_formats(client):
    analysis = client.post("/api/analyze", json=scenario()).json()
    r = client.get(f"/api/report/{analysis['analysisId']}", params={"format": "docx"})
    assert r.status_code == 422
    assert r.json()["error"]["field"] == "format"


def test_evaluate_library_structure(client):
    r = client.post("/api/evaluate", json={"scenario": scenario(), "structure": {"structureId": "MACRO_LDPE"}})
    assert r.status_code == 200


STARVE = "starve respiring produce"


def _violations(client, layers, perforation="none"):
    body = {"scenario": scenario(), "structure": {"layers": layers, "perforation": perforation}}
    r = client.post("/api/evaluate", json=body)
    assert r.status_code == 200
    return " ".join(r.json()["violations"])


def test_custom_sealed_laminate_is_ruled_out_for_produce(client):
    foil = [{"materialId": "BOPET", "thicknessUm": 12}, {"materialId": "AL_FOIL", "thicknessUm": 9}, {"materialId": "CPP", "thicknessUm": 50}]
    assert STARVE in _violations(client, foil)
    # Perforating the same stack opens a gas-exchange path.
    assert STARVE not in _violations(client, foil, "micro")


def test_custom_single_plain_film_is_a_produce_bag(client):
    assert STARVE not in _violations(client, [{"materialId": "LDPE", "thicknessUm": 30}])


def test_what_if_reports_direction_of_change(client):
    base = scenario()
    warmer = scenario(temperatureC=14)  # still within the chilled range (-2 to 15 °C)
    r = client.post("/api/what-if", json={"baseline": {"scenario": base}, "variant": {"scenario": warmer}})
    assert r.status_code == 200
    body = r.json()
    shelf = next(c for c in body["changes"] if c["indicator"].startswith("Estimated shelf life"))
    assert shelf["after"] < shelf["before"] and shelf["direction"] == "worse"
    assert "variantRecommendation" in body

"""Feature vector for food + condition + packaging combinations (Team Report §9.2)."""
import math

ORD3 = {"low": 0, "medium": 1, "high": 2}
RESP = {"none": 0, "low": 1, "medium": 2, "high": 3}
STORAGE = {"ambient": 0, "chilled": 1, "frozen": 2}
SEAL = {"none": 0, "low": 1, "medium": 2, "high": 3}

FEATURES = (
    "moisture_pct", "fat_pct", "ph", "respiration", "oxidation",
    "temperature_c", "rh_pct", "storage", "transport_stress",
    "log_otr_test", "log_wvtr_test", "gauge_um", "seal", "perforated",
)
TARGET = "observed_shelf_life_days"


def from_scenario(sc, ev) -> dict[str, float]:
    s = ev.structure
    return {
        "moisture_pct": float(sc.v("moisturePct") or 0),
        "fat_pct": float(sc.v("fatPct") or 0),
        "ph": float(sc.v("ph") or 6.0),
        "respiration": RESP.get(sc.v("respirationClass") or "none", 0),
        "oxidation": ORD3.get(sc.v("oxidationSensitivity") or "medium", 1),
        "temperature_c": sc.temperature_c,
        "rh_pct": sc.rh * 100,
        "storage": STORAGE[sc.storage_type],
        "transport_stress": ORD3[sc.transport_stress],
        "log_otr_test": math.log10(max(ev.otr_test, 1e-3)),
        "log_wvtr_test": math.log10(max(ev.wvtr_test, 1e-3)),
        "gauge_um": s.total_gauge_um,
        "seal": SEAL[s.seal_layer.material.sealability],
        "perforated": 1.0 if ev.perforation and ev.perforation.get("required") else 0.0,
    }


def vector(row: dict) -> list[float]:
    return [float(row[f]) for f in FEATURES]

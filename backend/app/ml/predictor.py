"""Loads the trained shelf-life model when enabled; otherwise the engine keeps its rule estimates."""
import logging
import math
from functools import lru_cache

from ..config import get_settings
from .features import FEATURES, from_scenario, vector

log = logging.getLogger("packwise.ml")


@lru_cache
def get_predictor():
    settings = get_settings()
    if not settings.ml_enabled or not settings.ml_artifact_path.exists():
        return None
    try:
        import joblib

        artifact = joblib.load(settings.ml_artifact_path)
    except Exception:  # missing sklearn/joblib or a corrupt file: fall back to rules
        log.exception("Shelf-life model failed to load; using rule estimates")
        return None
    if artifact.get("features") != list(FEATURES):
        log.warning("Shelf-life model was trained on a different feature set; using rule estimates")
        return None
    model = artifact["model"]
    band = min(0.5, max(0.1, float(artifact.get("cvMape", 0.3))))

    def predict(sc, ev):
        days = math.exp(float(model.predict([vector(from_scenario(sc, ev))])[0]))
        return days, band

    return predict

"""Train the shelf-life regressor: `python -m app.ml.train [path/to/observations.csv]`.

Refuses to train on fewer than 50 real observations or fewer than 3 commodities.
Labels must be observed shelf lives, never outputs of this engine's own rules
(Team Report §9.4). Validation uses GroupKFold by commodity so near-duplicate
records from one product family can't leak between folds.
"""
import csv
import sys
from datetime import datetime, timezone
from pathlib import Path

from ..config import BACKEND_DIR, get_settings
from .features import FEATURES, TARGET, vector

MIN_ROWS = 50
MIN_GROUPS = 3
DEFAULT_CSV = BACKEND_DIR / "data" / "shelf_life_observations.csv"


def load_rows(path: Path) -> list[dict]:
    with path.open(newline="", encoding="utf-8") as fh:
        return [r for r in csv.DictReader(fh) if r.get(TARGET)]


def train(path: Path = DEFAULT_CSV) -> dict:
    import joblib
    import numpy as np
    from sklearn.ensemble import GradientBoostingRegressor
    from sklearn.model_selection import GroupKFold

    rows = load_rows(path)
    groups = [r["commodity_id"] for r in rows]
    if len(rows) < MIN_ROWS or len(set(groups)) < MIN_GROUPS:
        raise SystemExit(
            f"Not training: {len(rows)} observations across {len(set(groups))} commodities "
            f"(need ≥ {MIN_ROWS} rows and ≥ {MIN_GROUPS} commodities of real measured shelf life)."
        )
    x = np.array([vector(r) for r in rows])
    y = np.log(np.array([float(r[TARGET]) for r in rows]))  # shelf life is multiplicative; fit in log space

    errors = []
    for train_idx, test_idx in GroupKFold(n_splits=min(5, len(set(groups)))).split(x, y, groups):
        model = GradientBoostingRegressor(random_state=0).fit(x[train_idx], y[train_idx])
        pred = np.exp(model.predict(x[test_idx]))
        actual = np.exp(y[test_idx])
        errors.extend(np.abs(pred - actual) / actual)
    mape = float(np.mean(errors))

    model = GradientBoostingRegressor(random_state=0).fit(x, y)
    artifact = {
        "model": model, "features": list(FEATURES), "cvMape": mape, "rows": len(rows),
        "commodities": len(set(groups)), "trainedAt": datetime.now(timezone.utc).isoformat(), "source": str(path),
    }
    out = get_settings().ml_artifact_path
    out.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, out)
    return {"artifact": str(out), "rows": len(rows), "cvMape": round(mape, 3)}


if __name__ == "__main__":
    print(train(Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_CSV))

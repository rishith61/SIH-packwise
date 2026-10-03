from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..engine.context import PROFILE_KEYS
from ..errors import ApiError
from ..repo import get_commodity, search_commodities

router = APIRouter(tags=["commodities"])

# Engine parameters exposed next to the profile (the wizard ignores them; the report and Builder can show them).
EXTRA_KEYS = ("awInitial", "awCritical", "moistureCriticalPct", "o2WindowPct", "co2WindowPct", "chillThresholdC")
EMPTY = {"value": None, "provenance": None, "confidence": None}


@router.get("/api/commodities")
def search(query: str = Query("", max_length=80), db: Session = Depends(get_db)) -> dict:
    return {"results": [{"commodityId": c.id, "name": c.name, "category": c.category} for c in search_commodities(db, query)]}


@router.get("/api/commodities/{commodity_id}")
def detail(commodity_id: str, db: Session = Depends(get_db)) -> dict:
    record = get_commodity(db, commodity_id)
    if record is None:
        raise ApiError("NOT_FOUND", "That commodity is no longer in the catalog.", 404)
    body = {"commodityId": record.id, "name": record.name, "category": record.category}
    for key in PROFILE_KEYS:
        p = record.params.get(key)
        body[key] = p.wrapped() if p is not None else dict(EMPTY)
    for key in EXTRA_KEYS:
        p = record.get(key)
        if p is not None:
            body[key] = p.wrapped()
    body["aliases"] = record.aliases
    body["source"] = record.source
    return body

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Union
import os

from ..services.marketing_engine import (
    generate_creatives, localize_creatives,
    bandit, simulate_impression, brand_score
)

router = APIRouter()

# --------- Schemas ---------
class Brand(BaseModel):
    name: str
    palette: List[str]
    tone: List[str] = ["playful"]
    banned_phrases: List[str] = []
    logo_url: str = ""

class Brief(BaseModel):
    product: str
    audience: str
    value_props: List[str]
    cta: str
    channels: List[str] = ["Instagram"]
    regions: List[str] = ["IN", "US"]

class Creative(BaseModel):
    id: str
    region: str = "base"
    headline: str
    primary_text: str
    image_url: str
    scores: Dict[str, float] = {}

class Feedback(BaseModel):
    creative_id: str
    region: str
    clicked: int  # 0/1

# --------- In-memory DB ---------
DB: Dict[str, Any] = {"brand": None, "brief": None, "creatives": [], "localized": {}}

# small helper for serialization
def _dump(x: Any) -> Any:
    # pydantic v2 models
    if hasattr(x, "model_dump"):
        return x.model_dump()
    # dataclasses / simple objects
    if hasattr(x, "__dict__"):
        return x.__dict__
    return x

# --------- Routes ---------
@router.post("/brand")
def set_brand(b: Brand):
    DB["brand"] = b
    return {"ok": True}

@router.post("/brief")
def set_brief(br: Brief):
    DB["brief"] = br
    return {"ok": True}

@router.post("/generate", response_model=List[Creative])
def generate():
    if not DB["brand"] or not DB["brief"]:
        raise HTTPException(400, "Set /brand and /brief first")
    items = generate_creatives(DB["brand"], DB["brief"], n=4)
    # optional extra score pass
    for c in items:
        c.scores["brand"] = c.scores.get("brand", brand_score())
    DB["creatives"] = items
    return items

@router.post("/localize")
def localize():
    if not DB["creatives"]:
        raise HTTPException(400, "Run /generate first")
    reg = localize_creatives(DB["creatives"], DB["brief"])
    DB["localized"] = reg
    return {k: [_dump(c) for c in v] for k, v in reg.items()}

@router.get("/serve")
def serve(region: str):
    loc = DB["localized"].get(region, [])
    if not loc:
        raise HTTPException(400, "Run /localize first")
    cid = bandit.choose(region, [c.id for c in loc])
    chosen = next(c for c in loc if c.id == cid)
    return {"region": region, "creative": _dump(chosen)}

@router.post("/feedback")
def feedback(f: Feedback):
    bandit.update(f.region, f.creative_id, f.clicked)
    return {"ok": True}

@router.post("/simulate")
def simulate(region: str, n: int = 200):
    loc = DB["localized"].get(region, [])
    if not loc:
        raise HTTPException(400, "Run /localize first")
    for _ in range(n):
        cid = bandit.choose(region, [c.id for c in loc])
        cobj = next(c for c in loc if c.id == cid)
        click = simulate_impression(region, cobj)
        bandit.update(region, cid, click)
    return {"ok": True, "events": n}

@router.get("/dashboard")
def dashboard():
    return {
        "brand": _dump(DB["brand"]),
        "brief": _dump(DB["brief"]),
        "creatives": [_dump(c) for c in DB["creatives"]],
        "localized": {k: [_dump(c) for c in v] for k, v in DB["localized"].items()},
        "bandit": bandit.snapshot(),
    }

# Optional: quick config endpoint to verify env is loaded (safe—no secrets)
@router.get("/config")
def config():
    return {
        "openai_text_model": os.getenv("OPENAI_TEXT_MODEL", "unset"),
        "openai_image_model": os.getenv("OPENAI_IMAGE_MODEL", "unset"),
        "openai_key_present": bool(os.getenv("OPENAI_API_KEY"))  # True/False only
    }

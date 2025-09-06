# backend/services/marketing_engine.py
import uuid, random, math, os
from typing import List, Dict, Tuple
from dataclasses import dataclass

# ✅ Use the HF-backed helpers you added in backend/models/inference.py
from ..models.inference import (
    generate_copy_gpt,      # now HF flan-t5 small under the hood
    transcreate_copy_gpt,   # MarianMT (en<->hi) or currency tweaks
    generate_image_gpt      # placeholder path for now
)

# ---------- Data model used across routes ----------
@dataclass
class Creative:
    id: str
    region: str
    headline: str
    primary_text: str
    image_url: str
    scores: Dict[str, float]

# ---------- Simple brand score (heuristic) ----------
def brand_score(logo_present: int = 1) -> float:
    # keep simple; 0.6–1.0
    return round(0.6 + 0.4 * random.random(), 2)

# ---------- Local fallback (if HF fails) ----------
def _stub_copies(brief, n=4):
    product = brief.product if hasattr(brief, "product") else brief["product"]
    vp0 = brief.value_props[0] if hasattr(brief, "value_props") else brief["value_props"][0]
    cta = brief.cta if hasattr(brief, "cta") else brief["cta"]
    base = f"{vp0} • {cta}"
    seeds = ["Level up your day", f"{product}: pure boost", "Energy that lasts", "Zero sugar. All power."]
    return [{"headline": h, "primary_text": base, "tags": ["fallback"]} for h in seeds[:n]]

# ---------- Generation (text via HF; image placeholder) ----------
def generate_creatives(brand, brief, n: int = 4) -> List[Creative]:
    # make sure dict-like for the inference helpers
    b = brand.model_dump() if hasattr(brand, "model_dump") else (brand.dict() if hasattr(brand, "dict") else brand)
    br = brief.model_dump() if hasattr(brief, "model_dump") else (brief.dict() if hasattr(brief, "dict") else brief)

    try:
        copies = generate_copy_gpt(b, br, n=n)  # HF flan-t5
    except Exception:
        copies = _stub_copies(brief, n)

    out: List[Creative] = []
    for c in copies:
        cid = f"C{uuid.uuid4().hex[:6]}"
        # images: placeholder path (HF image not wired)
        try:
            img_url = generate_image_gpt(b, br, c)  # returns /static/<fname>.png
        except Exception:
            img_url = f"/static/{cid}.png"

        out.append(Creative(
            id=cid,
            region="base",
            headline=c["headline"][:40],
            primary_text=c["primary_text"][:120],
            image_url=img_url,
            scores={"brand": brand_score()}
        ))
    return out

# ---------- Localization / “Transcreation” ----------
def localize_creatives(creatives: List[Creative], brief) -> Dict[str, List[Creative]]:
    regions = brief.regions if hasattr(brief, "regions") else brief["regions"]
    by_region: Dict[str, List[Creative]] = {r: [] for r in regions}

    # Grab brand/brief dicts for the inference helper
    from ..api.routes import DB
    brand_d = DB["brand"].model_dump() if hasattr(DB["brand"], "model_dump") else (DB["brand"].dict() if hasattr(DB["brand"], "dict") else DB["brand"])
    brief_d = DB["brief"].model_dump() if hasattr(DB["brief"], "model_dump") else (DB["brief"].dict() if hasattr(DB["brief"], "dict") else DB["brief"])

    for c in creatives:
        base = {"headline": c.headline, "primary_text": c.primary_text}
        for r in regions:
            try:
                loc = transcreate_copy_gpt(brand_d, brief_d, base, r)
            except Exception:
                # currency-only fallback
                prefix = "₹ " if r == "IN" else "$ "
                loc = {"headline": base["headline"], "primary_text": prefix + base["primary_text"], "notes": "fallback"}

            rid = f"{c.id}-{r}"
            by_region[r].append(Creative(
                id=rid,
                region=r,
                headline=loc["headline"][:40],
                primary_text=loc["primary_text"][:120],
                image_url=c.image_url,   # reuse base image for MVP
                scores=c.scores.copy()
            ))
    return by_region

# ---------- Thompson Sampling (unchanged) ----------
class Bandit:
    def __init__(self):
        # state[(region, creative_id)] = [alpha, beta, impressions, clicks]
        self.state: Dict[Tuple[str, str], List[float]] = {}

    def _key(self, region: str, cid: str): return (region, cid)

    def ensure(self, region: str, cid: str):
        if self._key(region, cid) not in self.state:
            self.state[self._key(region, cid)] = [1.0, 1.0, 0, 0]

    def choose(self, region: str, cids: List[str]) -> str:
        best, best_theta = None, -1
        for cid in cids:
            self.ensure(region, cid)
            a, b, *_ = self.state[self._key(region, cid)]
            theta = random.betavariate(a, b)
            if theta > best_theta:
                best_theta, best = theta, cid
        return best

    def update(self, region: str, cid: str, clicked: int):
        a, b, imp, clk = self.state[self._key(region, cid)]
        if clicked: a += 1
        else:       b += 1
        imp += 1; clk += clicked
        self.state[self._key(region, cid)] = [a, b, imp, clk]

    def snapshot(self):
        rows = []
        for (region, cid), (a, b, imp, clk) in self.state.items():
            ctr = (clk/imp) if imp > 0 else 0.0
            rows.append({
                "region": region, "creative_id": cid,
                "alpha": a, "beta": b,
                "impressions": imp, "clicks": clk,
                "ctr": round(ctr, 4)
            })
        return rows

bandit = Bandit()

# ---------- Simple simulator (unchanged) ----------
def sigmoid(x): return 1/(1+math.exp(-x))

def true_ctr(brand_s: float, cultural_match: int, contrast_ok: int) -> float:
    noise = random.gauss(0, 0.05)
    z = -2.0 + 1.6*brand_s + 0.8*cultural_match + 0.4*contrast_ok + noise
    return max(0.01, min(0.9, sigmoid(z)))

def simulate_impression(region: str, creative: Creative) -> int:
    b = creative.scores.get("brand", 0.6)
    # very rough proxy: give IN a small cultural lift (you can refine)
    cultural = 1 if region == "IN" else 0
    contrast = 1
    p = true_ctr(b, cultural, contrast)
    return 1 if random.random() < p else 0

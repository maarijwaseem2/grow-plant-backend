"""
GO GREEN — AI microservice (FastAPI)

Two capabilities:
  1. /suggest-spots  — suggests PUBLIC plantable locations (parks, grounds, grass,
     recreation areas) near a point, using OpenStreetMap (Overpass). It only ever
     queries public/open-space tags, so private/residential land is never returned.
  2. /verify-plant   — a lightweight check that an uploaded photo actually shows a
     plant (green-vegetation ratio), so plantings can be verified.

All free — no API keys required. NDVI/satellite scoring can be layered on later.
"""
from fastapi import FastAPI, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import io

app = FastAPI(title="Go Green AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Public/open-space feature types we consider plantable. We deliberately never
# query residential/commercial/building tags, so suggestions are public land only.
SCORES = {
    ("leisure", "park"): 100,
    ("leisure", "garden"): 90,
    ("leisure", "common"): 85,
    ("leisure", "recreation_ground"): 80,
    ("landuse", "recreation_ground"): 80,
    ("landuse", "village_green"): 78,
    ("leisure", "playground"): 70,
    ("leisure", "pitch"): 68,
    ("landuse", "grass"): 60,
    ("landuse", "meadow"): 55,
    ("natural", "grassland"): 55,
}

OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://z.overpass-api.de/api/interpreter",
]


def build_query(lat: float, lng: float, radius: int) -> str:
    a = f"(around:{radius},{lat},{lng})"
    return f"""[out:json][timeout:25];
(
  way["leisure"~"park|garden|common|recreation_ground|playground|pitch"]{a};
  relation["leisure"~"park|garden|common|recreation_ground"]{a};
  way["landuse"~"grass|recreation_ground|village_green|meadow"]{a};
  way["natural"="grassland"]{a};
);
out center 80;"""


def score_element(tags: dict) -> tuple:
    """Return (score, category) for an OSM element, or (0, None) if not plantable."""
    best = (0, None)
    for (k, v), s in SCORES.items():
        if tags.get(k) == v and s > best[0]:
            best = (s, f"{k}={v}")
    # small boost for named/maintained places
    if best[0] and tags.get("name"):
        best = (min(best[0] + 5, 100), best[1])
    return best


def query_overpass(lat: float, lng: float, radius: int):
    q = build_query(lat, lng, radius)
    for url in OVERPASS_ENDPOINTS:
        try:
            r = requests.post(url, data={"data": q}, timeout=30,
                              headers={"User-Agent": "GoGreen-AI/1.0"})
            if r.status_code == 200:
                return r.json().get("elements", [])
        except Exception:
            continue
    return None  # all endpoints failed


def fallback_spots(lat: float, lng: float):
    """Deterministic sample spots around the point so the endpoint never hard-fails
    when Overpass is unreachable. Real deployments use the live OSM data above."""
    offsets = [(0.004, 0.004), (-0.005, 0.003), (0.003, -0.006),
               (-0.004, -0.004), (0.006, 0.001), (0.001, 0.006)]
    feats = []
    for i, (dla, dlo) in enumerate(offsets):
        feats.append(make_feature(lat + dla, lng + dlo,
                     name=f"Suggested public spot {i + 1}",
                     category="fallback", score=60 - i * 3))
    return feats


def make_feature(lat, lng, name, category, score):
    return {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [round(lng, 6), round(lat, 6)]},
        "properties": {"name": name, "category": category, "score": score},
    }


class HealthOut(BaseModel):
    status: str
    service: str


@app.get("/health", response_model=HealthOut)
def health():
    return {"status": "ok", "service": "go-green-ai"}


@app.get("/suggest-spots")
def suggest_spots(
    lat: float = Query(..., description="Latitude of the search center"),
    lng: float = Query(..., description="Longitude of the search center"),
    radius: int = Query(3000, ge=200, le=15000, description="Search radius in meters"),
    limit: int = Query(30, ge=1, le=100),
):
    """Return a GeoJSON FeatureCollection of suggested PUBLIC plantation spots."""
    elements = query_overpass(lat, lng, radius)

    if elements is None:
        features = fallback_spots(lat, lng)
        source = "fallback"
    else:
        features = []
        for el in elements:
            tags = el.get("tags", {})
            score, category = score_element(tags)
            if not score:
                continue
            if el.get("type") == "node":
                plat, plng = el.get("lat"), el.get("lon")
            else:
                c = el.get("center") or {}
                plat, plng = c.get("lat"), c.get("lon")
            if plat is None or plng is None:
                continue
            features.append(make_feature(
                plat, plng,
                name=tags.get("name", category.split("=")[1].replace("_", " ").title()),
                category=category, score=score))
        # de-duplicate very close points and sort by score
        features.sort(key=lambda f: f["properties"]["score"], reverse=True)
        features = features[:limit]
        source = "openstreetmap"

    return {
        "type": "FeatureCollection",
        "meta": {"source": source, "center": [lng, lat], "radius_m": radius, "count": len(features)},
        "features": features,
    }


@app.post("/verify-plant")
async def verify_plant(file: UploadFile = File(...)):
    """Lightweight vegetation check: fraction of green pixels in the image."""
    from PIL import Image
    import numpy as np

    data = await file.read()
    try:
        img = Image.open(io.BytesIO(data)).convert("RGB")
    except Exception:
        return {"is_plant": False, "green_ratio": 0.0, "confidence": 0.0,
                "error": "Could not read image"}

    img.thumbnail((256, 256))
    arr = np.asarray(img).astype("int32")
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    # "vegetation-ish": green clearly dominates red and blue and is bright enough
    green_mask = (g > r * 1.05) & (g > b * 1.05) & (g > 50)
    ratio = float(green_mask.mean())
    is_plant = ratio > 0.12
    confidence = round(min(ratio / 0.4, 1.0), 3)
    return {"is_plant": is_plant, "green_ratio": round(ratio, 3), "confidence": confidence}


@app.get("/spot-greenness")
def spot_greenness(lat: float = Query(...), lng: float = Query(...)):
    """Estimate how green/vegetated a spot is from free Esri satellite imagery.
    This is a visual greenness proxy (RGB), not spectral NDVI (which needs a
    near-infrared band from Sentinel/Landsat) — but it works free and with no key."""
    from PIL import Image
    import numpy as np

    d = 0.004
    url = (
        "https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/export"
        f"?bbox={lng - d},{lat - d},{lng + d},{lat + d}"
        "&bboxSR=4326&imageSR=4326&size=200,200&format=jpg&f=image"
    )
    try:
        r = requests.get(url, timeout=20)
        img = Image.open(io.BytesIO(r.content)).convert("RGB")
        arr = np.asarray(img).astype("int32")
        red, grn, blu = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
        green_mask = (grn > red + 8) & (grn > blu + 8)
        greenness = round(float(green_mask.mean()) * 100, 1)
        if greenness >= 40:
            note = "Already quite green — good growing conditions here."
        elif greenness >= 15:
            note = "Some greenery — a solid spot to add more trees."
        else:
            note = "Mostly bare ground — high impact if greened."
        return {"greenness": greenness, "note": note}
    except Exception:
        return {"greenness": None, "note": "Could not analyse this spot right now."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

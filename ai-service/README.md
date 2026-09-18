# Go Green — AI microservice (FastAPI)

Public-land plantation spot finder + plant photo verification. No API keys needed.

## Run
```
cd ai-service
python -m venv venv && source venv/bin/activate   # (Windows: venv\Scripts\activate)
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Endpoints
- `GET  /health`
- `GET  /suggest-spots?lat=24.86&lng=67.01&radius=3000&limit=30`
  Returns a GeoJSON FeatureCollection of suggested PUBLIC plantable spots
  (parks, grounds, grass, recreation areas) from OpenStreetMap. Private and
  residential land is never queried, so it never appears in suggestions.
  If Overpass is temporarily unreachable it returns a small deterministic
  fallback set so the map still works.
- `POST /verify-plant` (multipart form field `file`) → `{ is_plant, green_ratio, confidence }`

## Later
NDVI/Sentinel-2 scoring and a real leaf-detection model can be layered on top of
this same API (the NestJS gateway and frontend won't need to change).

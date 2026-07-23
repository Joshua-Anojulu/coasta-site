# DFW Geometry Provenance

## Source

- Data: OpenStreetMap contributors
- License: Open Database License 1.0
- Attribution: © OpenStreetMap contributors
- Endpoint: https://overpass-api.de/api/interpreter
- Snapshot date: 2026-07-20T00:00:00Z
- Raw response sha256: 04af114d84a79b867dbe4377bc1c63b75b04802c14af643444134bbf0a5ab2e8

## Exact Overpass query

```overpass
[out:json][timeout:180][date:"2026-07-20T00:00:00Z"];
way["highway"~"^(motorway|trunk)$"](32.55,-97.55,33.05,-96.55)->.roads;
rel(bw.roads)["type"="route"]["route"="road"]->.roadrels;
way["natural"="water"](32.55,-97.55,33.05,-96.55)->.waterways;
(
  rel["natural"="water"](32.55,-97.55,33.05,-96.55);
  rel["water"="river"](32.55,-97.55,33.05,-96.55);
)->.waterrels;
.roads out body geom;
.roadrels out body;
.waterways out body geom;
.waterrels out body geom;
```

## Transformation

Motorway and trunk links are excluded by the query. Whitelisted roads are clipped segment by segment to the DFW bbox, canonicalized, deduplicated, simplified, and quantized. Concurrent route memberships remain on one physical segment. Water polygons larger than 2 square kilometers are clipped and simplified. Only outer rings are retained; holes are deliberately dropped because the fill is visually faint at hero scale.

## Extraction statistics

- Routes matched: DNT, I-20, I-30, I-35E, I-35W, I-635, I-820, Loop-12, PGBT, SH-114, SH-183, US-175, US-75
- Road segments: 236
- Road points before simplification: 20994
- Road points after simplification: 1551
- Maximum measured road deviation: 44.99 meters
- Water rings: 10
- Water points after simplification: 420
- Road tolerance: 45 meters
- Coordinate precision: 6 decimals
- Optional routes dropped: none
- Generated module raw size: 64089 bytes

## Required corridor spans

| Route | Raw clipped span km | Simplified span km | Retained |
|---|---:|---:|---:|
| I-35E | 58.51 | 58.51 | 100.0% |
| I-35W | 55.99 | 55.99 | 100.0% |
| I-30 | 94.85 | 94.85 | 100.0% |
| I-20 | 95.26 | 95.26 | 100.0% |
| I-635 | 54.69 | 54.68 | 100.0% |
| I-820 | 33.20 | 33.19 | 100.0% |
| US-75 | 32.76 | 32.76 | 100.0% |
| DNT | 30.31 | 30.31 | 100.0% |

The derived geometry and this provenance file must be reviewed for ODbL share alike publication before a public launch. See `docs/LAUNCH-CHECKLIST.md`.

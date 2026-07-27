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

## ODbL share alike: RESOLVED 2026-07-27

The question was whether shipping this derived geometry triggers the ODbL share alike term. It does.
The coverage map is a Produced Work, which on its own would need only attribution, but the derived
database itself is bundled into the client and therefore reaches every visitor. Under ODbL that is
Public Use of a Derivative Database, which obliges us to offer that database under ODbL. Attribution
alone does not discharge it, and this repository being private is not publication either.

**Resolution: publish, do not drop.** The dataset is emitted to
`public/data/dfw-geometry.odbl.json` by `npm run export:geodata`, carrying its licence, the exact
Overpass query, the pinned snapshot date, the raw response hash, and the derivation description. The
site footer attributes OpenStreetMap, names the licence, and links the download, so a recipient of
the Produced Work can reach the database it came from.

Camera positions are included deliberately. They are computed against OpenStreetMap road
coordinates, so they are part of the derivative database rather than independent data.

Regenerate with `npm run export:geodata` whenever the snapshot changes; a stale published dataset
would be worse than none.

---

## OpenStreetMap data REMOVED from the site, 2026-07-27

The coverage map was abandoned as a design decision. It was the only thing on
the site using OpenStreetMap data, so with it gone the site ships **no
derivative database at all**. Consequences, stated plainly so nobody has to
re-derive them later:

- **ODbL share alike no longer applies.** It applied because the derived
  geometry was bundled and reached every visitor, which is Public Use of a
  Derivative Database. Nothing is bundled now.
- **The attribution requirement no longer applies**, so the footer credit was
  removed. That removal is correct, not an oversight.
- `public/data/dfw-geometry.odbl.json`, `scripts/export-geometry-odbl.mjs`,
  `lib/geometry/` and `data/dfw-geometry.snapshot.ts` are all deleted. They
  remain in git history and can be restored intact if a map ever returns.

The road on the site today is procedural perspective geometry drawn in canvas.
It is not derived from OpenStreetMap or from any other dataset.

**If a map ever comes back, the ODbL obligation comes back with it.** Restore
the export script and the footer credit together with the geometry; the earlier
section of this file records exactly why both halves are required.

## Camera photography removed, 2026-07-27

The ten licensed Wikimedia Commons frames are no longer used: the drive world
draws its scene rather than photographing it, and the coverage chapter that
held the last two frames is gone. The licensing and screening record above is
retained because the frames are recoverable from git, and because the sourcing
analysis (TxDOT live cameras are not licensable, paid or free-licence stock is
the realistic route) stays true if photography ever returns.

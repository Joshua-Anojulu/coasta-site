# CH5 DFW geometry handoff

This build does not issue an Overpass request. The renderer consumes the typed
`GeometrySnapshot` interface in `lib/geometry/types.ts`. The preserved pinned
snapshot is stored in `data/dfw-geometry.snapshot.ts`, with its source,
transformation, hash, and open ODbL question recorded in
`data/PROVENANCE.md`.

If the geometry must be refreshed, a human must first resolve the ODbL launch
gate, then run the following query outside this build and pin the raw response
as a reviewed build artifact:

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

The human handoff must update the snapshot date, endpoint, raw response hash,
transformation record, and named licensing sign-off before the new artifact is
eligible for launch.


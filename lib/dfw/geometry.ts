export const BOUNDS = { minLon: -97.05, maxLon: -96.6, minLat: 32.6, maxLat: 33.05 };

type Highway = { name: string; major: boolean; points: [number, number][] };

export const HIGHWAYS: Highway[] = [
  { name: "I-35E", major: true, points: [
    [-96.994, 32.62], [-96.91, 32.68], [-96.87, 32.74], [-96.83, 32.79],
    [-96.828, 32.86], [-96.86, 32.93], [-96.9, 32.99], [-96.94, 33.05],
  ]},
  { name: "US-75", major: true, points: [
    [-96.79, 32.78], [-96.782, 32.83], [-96.77, 32.88], [-96.769, 32.924],
    [-96.765, 32.97], [-96.75, 33.02], [-96.74, 33.05],
  ]},
  { name: "I-635", major: true, points: [
    [-97.0, 32.9], [-96.94, 32.925], [-96.87, 32.93], [-96.8, 32.928],
    [-96.769, 32.924], [-96.71, 32.91], [-96.66, 32.87], [-96.63, 32.82],
    [-96.64, 32.76], [-96.67, 32.72],
  ]},
  { name: "I-30", major: true, points: [
    [-97.05, 32.755], [-96.95, 32.76], [-96.86, 32.77], [-96.8, 32.78],
    [-96.76, 32.772], [-96.68, 32.76], [-96.6, 32.75],
  ]},
  { name: "I-20", major: false, points: [
    [-97.05, 32.67], [-96.94, 32.665], [-96.83, 32.66], [-96.72, 32.66], [-96.6, 32.665],
  ]},
  { name: "DNT", major: false, points: [
    [-96.805, 32.79], [-96.807, 32.85], [-96.81, 32.91], [-96.82, 32.97], [-96.825, 33.05],
  ]},
];

export const CAMERAS: { id: string; lonlat: [number, number] }[] = [
  { id: "CAM-021", lonlat: [-96.91, 32.68] },
  { id: "CAM-052", lonlat: [-96.83, 32.81] },
  { id: "CAM-063", lonlat: [-96.828, 32.86] },
  { id: "CAM-114", lonlat: [-96.769, 32.924] },
  { id: "CAM-131", lonlat: [-96.87, 32.93] },
  { id: "CAM-142", lonlat: [-96.71, 32.91] },
  { id: "CAM-155", lonlat: [-96.63, 32.82] },
  { id: "CAM-207", lonlat: [-96.76, 32.772] },
  { id: "CAM-218", lonlat: [-96.86, 32.77] },
  { id: "CAM-233", lonlat: [-96.95, 32.76] },
  { id: "CAM-301", lonlat: [-96.765, 32.97] },
  { id: "CAM-317", lonlat: [-96.81, 32.91] },
];

export function project(
  [lon, lat]: [number, number], w: number, h: number, pad = 40
): [number, number] {
  const x = pad + ((lon - BOUNDS.minLon) / (BOUNDS.maxLon - BOUNDS.minLon)) * (w - pad * 2);
  const y = h - pad - ((lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * (h - pad * 2);
  return [x, y];
}

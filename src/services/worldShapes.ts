/**
 * World shapes and continent colours for the country map (ported from spfx-vector-map).
 *   - the bundled world-atlas TopoJSON is decoded once into GeoJSON features
 *   - every shape is classified into a continent from its centroid (utils/getContinent)
 *   - fitCountry() frames one shape in the 800x400 geoEqualEarth map
 *   - one base colour per continent is mixed into fill / hover / selected shades
 */
import worldTopo from 'world-atlas/countries-110m.json';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { Continent, getContinent } from '../utils/getContinent';

export type CountryFeature = Feature<Geometry, { name?: string }>;

export const CONTINENTS: Continent[] = ['Africa', 'Antarctica', 'Asia', 'Europe', 'North America', 'Oceania', 'South America'];

export const CONTINENT_COLORS: Record<Continent, string> = {
  'Africa': '#e0a11b',
  'Antarctica': '#8fb0c4',
  'Asia': '#d13438',
  'Europe': '#0f6cbd',
  'North America': '#107c10',
  'Oceania': '#8764b8',
  'South America': '#ca5010'
};

/** Hand-tuned centre + zoom per continent for the 800x400 geoEqualEarth map (scale 147). */
export const CONTINENT_VIEWS: Record<Continent, { coordinates: [number, number]; zoom: number }> = {
  'Africa': { coordinates: [18, 2], zoom: 2.2 },
  'Antarctica': { coordinates: [0, -75], zoom: 1.6 },
  'Asia': { coordinates: [92, 32], zoom: 1.9 },
  'Europe': { coordinates: [15, 53], zoom: 3.4 },
  'North America': { coordinates: [-100, 48], zoom: 2 },
  'Oceania': { coordinates: [148, -26], zoom: 2.6 },
  'South America': { coordinates: [-60, -22], zoom: 2.2 }
};

/* ---------- shapes ---------- */

export const WORLD_TOPO = worldTopo;

export const WORLD_FEATURES: CountryFeature[] = (() => {
  const topo = worldTopo as unknown as Topology<{ countries: GeometryCollection<{ name?: string }> }>;
  const fc = feature(topo, topo.objects.countries) as FeatureCollection<Geometry, { name?: string }>;
  return fc.features;
})();

/** Strips leading zeros so "004" and "4" both find Afghanistan. */
export const normalizeNumeric = (id: string | number | undefined): string =>
  id === undefined || id === null ? '' : String(id).trim().replace(/^0+(?=\d)/, '');

const FEATURE_BY_NUMERIC: Record<string, CountryFeature> = (() => {
  const out: Record<string, CountryFeature> = {};
  WORLD_FEATURES.forEach(f => { const k = normalizeNumeric(f.id as string | number | undefined); if (k) { out[k] = f; } });
  return out;
})();

export const featureByNumeric = (numeric: string | undefined): CountryFeature | undefined =>
  numeric ? FEATURE_BY_NUMERIC[normalizeNumeric(numeric)] : undefined;

/** Shape name → feature (for list rows without a numeric code). */
export const featureByName = (name: string | undefined): CountryFeature | undefined => {
  const n = (name || '').trim().toLowerCase();
  return n ? WORLD_FEATURES.filter(f => ((f.properties && f.properties.name) || '').toLowerCase() === n)[0] : undefined;
};

const outerRings = (geometry: Geometry | undefined): number[][][] => {
  if (!geometry) { return []; }
  if (geometry.type === 'Polygon') { return [geometry.coordinates[0]]; }
  if (geometry.type === 'MultiPolygon') { return geometry.coordinates.map(poly => poly[0]).filter(Boolean); }
  return [];
};

/** Average of the largest outer ring — good enough to classify a continent. */
export const roughCentroid = (geo: CountryFeature | undefined): [number, number] | undefined => {
  if (!geo) { return undefined; }
  let ring: number[][] | undefined;
  outerRings(geo.geometry).forEach(r => { if (!ring || r.length > ring.length) { ring = r; } });
  if (!ring || ring.length === 0) { return undefined; }
  const pts: number[][] = ring;
  let minLng = Infinity, maxLng = -Infinity;
  pts.forEach(pt => { minLng = Math.min(minLng, pt[0]); maxLng = Math.max(maxLng, pt[0]); });
  const wraps = maxLng - minLng > 180;
  let lng = 0, lat = 0;
  pts.forEach(pt => { lng += wraps && pt[0] < 0 ? pt[0] + 360 : pt[0]; lat += pt[1]; });
  lng /= pts.length;
  if (lng > 180) { lng -= 360; }
  return [lng, lat / pts.length];
};

const FEATURE_CONTINENT: Record<string, Continent> = (() => {
  const out: Record<string, Continent> = {};
  WORLD_FEATURES.forEach((f, i) => {
    const c = roughCentroid(f);
    if (c) { out[f.id === undefined || f.id === null ? `idx${i}` : normalizeNumeric(f.id as string)] = getContinent(c[1], c[0]); }
  });
  return out;
})();

/** Continent of a rendered geography (geometric classification). */
export const continentOfGeo = (geo: { id?: string | number; geometry?: Geometry }): Continent | undefined => {
  const k = normalizeNumeric(geo.id as string | number | undefined);
  if (k && k !== '-99') { return FEATURE_CONTINENT[k]; }
  const c = roughCentroid(geo as CountryFeature);
  return c ? getContinent(c[1], c[0]) : undefined;
};

export interface ICountryFit { center: [number, number]; scale: number }

/**
 * Projection centre and scale that frame one country in the 800x400 map. Longitudes are
 * shifted when a shape crosses the antimeridian (Russia, Fiji, the US with the Aleutians).
 * geoEqualEarth at scale 147 fits the world (~5.41·scale px wide, ~2.63·scale px tall).
 */
export const fitCountry = (geo: CountryFeature | undefined): ICountryFit => {
  const rings = geo ? outerRings(geo.geometry) : [];
  if (rings.length === 0) { return { center: [0, 10], scale: 147 }; }
  const pts: number[][] = [];
  rings.forEach(r => r.forEach(pt => pts.push(pt)));
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  pts.forEach(([lng, lat]) => {
    minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
  });
  if (maxLng - minLng > 180) {
    minLng = Infinity; maxLng = -Infinity;
    pts.forEach(([lng]) => { const l = lng < 0 ? lng + 360 : lng; minLng = Math.min(minLng, l); maxLng = Math.max(maxLng, l); });
  }
  let centerLng = (minLng + maxLng) / 2;
  if (centerLng > 180) { centerLng -= 360; }
  const lngSpan = Math.max(maxLng - minLng, 0.5);
  const latSpan = Math.max(maxLat - minLat, 0.5);
  const padding = 0.72;
  const scaleForLng = (800 * padding * 360) / (5.41 * lngSpan);
  const scaleForLat = (400 * padding * 180) / (2.63 * latSpan);
  const scale = Math.max(120, Math.min(scaleForLng, scaleForLat, 147 * 160));
  return { center: [centerLng, (minLat + maxLat) / 2], scale };
};

/* ---------- colours ---------- */

export interface IShade { base: string; fill: string; hover: string; selected: string; tint: string; text: string }

const toRgb = (hex: string): [number, number, number] => {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) { h = h.split('').map(ch => ch + ch).join(''); }
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = ([r, g, b]: [number, number, number]): string =>
  '#' + [r, g, b].map(v => { const s = Math.max(0, Math.min(255, Math.round(v))).toString(16); return s.length === 1 ? '0' + s : s; }).join('');

export const mix = (color: string, into: string, amount: number): string => {
  const a = toRgb(color);
  const b = toRgb(into);
  return toHex([a[0] + (b[0] - a[0]) * amount, a[1] + (b[1] - a[1]) * amount, a[2] + (b[2] - a[2]) * amount]);
};

/** Shade set for a base colour, tuned for the neumorphic light (#e9edf3) / dark (#262a33) surfaces. */
export const shadeFor = (base: string, dark: boolean): IShade => dark
  ? { base, fill: mix(base, '#262a33', 0.45), hover: mix(base, '#262a33', 0.2), selected: base, tint: mix(base, '#262a33', 0.84), text: mix(base, '#ffffff', 0.35) }
  : { base, fill: mix(base, '#ffffff', 0.5), hover: mix(base, '#ffffff', 0.28), selected: mix(base, '#ffffff', 0.05), tint: mix(base, '#e9edf3', 0.86), text: mix(base, '#000000', 0.15) };

export const continentShade = (continent: Continent, dark: boolean): IShade => shadeFor(CONTINENT_COLORS[continent], dark);

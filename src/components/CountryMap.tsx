/**
 * FEATURE (ask: "the vector map for the selected country as well as the continent in
 * relation to the dropdown"): pure SVG world map (react-simple-maps over the bundled
 * world-atlas TopoJSON). Three framings:
 *   nothing selected → the world, every continent in its colour
 *   continent        → zoomed to the continent, other continents muted
 *   country          → framed on the country (fitCountry), its continent kept in context
 * Clicking a shape reports its ISO numeric id so the explorer can select the row.
 */
import * as React from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import styles from './CountryMap.module.scss';
import { useTheme } from '../theme/ThemeContext';
import { Continent } from '../utils/getContinent';
import {
  CONTINENTS, CONTINENT_VIEWS, WORLD_TOPO, continentOfGeo, continentShade, featureByNumeric, fitCountry, normalizeNumeric
} from '../services/worldShapes';

export interface ICountryMapProps {
  continent?: Continent;
  /** ISO numeric of the selected country ("840"). */
  selectedNumeric?: string;
  /** Continent per shape id from the list (overrides the geometric classification). */
  continentByNumeric?: Record<string, Continent>;
  /** Shape ids that have a row in the list (drawn clickable). */
  knownNumerics?: Record<string, boolean>;
  onSelectShape?: (numeric: string, name: string) => void;
  onHover?: (name: string | undefined, continent: Continent | undefined) => void;
  className?: string;
}

export const CountryMap: React.FC<ICountryMapProps> = ({ continent, selectedNumeric, continentByNumeric, knownNumerics, onSelectShape, onHover, className }) => {
  const { isDark } = useTheme();
  const shades = React.useMemo(() => {
    const out = {} as Record<Continent, ReturnType<typeof continentShade>>;
    CONTINENTS.forEach(c => { out[c] = continentShade(c, isDark); });
    return out;
  }, [isDark]);
  const muted = isDark ? '#3a4150' : '#cfd6e0';
  const stroke = isDark ? '#1b1e25' : '#ffffff';

  const selectedFeature = React.useMemo(() => featureByNumeric(selectedNumeric), [selectedNumeric]);
  const fit = React.useMemo(() => fitCountry(selectedFeature), [selectedFeature]);

  // framing
  const scale = selectedFeature ? fit.scale : 147;
  const view = selectedFeature
    ? { coordinates: fit.center, zoom: 1 }
    : continent ? CONTINENT_VIEWS[continent] : { coordinates: [0, 10] as [number, number], zoom: 1 };

  const selKey = normalizeNumeric(selectedNumeric);
  const continentOf = (geo: { id?: string | number; geometry?: GeoJSON.Geometry }): Continent | undefined => {
    const k = normalizeNumeric(geo.id as string | number | undefined);
    return (continentByNumeric && continentByNumeric[k]) || continentOfGeo(geo);
  };

  return (
    <div className={`${styles.root} ${className || ''}`} style={continent ? { background: shades[continent].tint } : undefined}>
      <ComposableMap projection="geoEqualEarth" projectionConfig={{ scale }} width={800} height={400} className={styles.svg} aria-label="World map">
        <ZoomableGroup center={view.coordinates} zoom={view.zoom} minZoom={0.6} maxZoom={16}>
          <Geographies geography={WORLD_TOPO}>
            {({ geographies }) => geographies.map(geo => {
              const k = normalizeNumeric(geo.id as string | number | undefined);
              const c = continentOf(geo);
              const shade = c ? shades[c] : undefined;
              const inFocus = !continent || c === continent;
              const isSelected = !!selKey && k === selKey;
              const known = !knownNumerics || !!knownNumerics[k];
              const fill = isSelected ? (shade ? shade.selected : muted) : inFocus && shade ? shade.fill : muted;
              const hover = inFocus && shade ? shade.hover : muted;
              const name = (geo.properties as { name?: string }).name || '';
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => { if (onSelectShape && k && k !== '-99') { onSelectShape(k, name); } }}
                  onMouseEnter={() => { if (onHover) { onHover(name, c); } }}
                  onMouseLeave={() => { if (onHover) { onHover(undefined, undefined); } }}
                  style={{
                    default: { fill, stroke, strokeWidth: isSelected ? 1 : 0.5, outline: 'none', cursor: known ? 'pointer' : 'default', transition: 'fill 0.2s ease', opacity: inFocus ? 1 : 0.55 },
                    hover: { fill: hover, stroke, strokeWidth: 0.6, outline: 'none', cursor: known ? 'pointer' : 'default' },
                    pressed: { fill: shade ? shade.selected : muted, outline: 'none' }
                  }}
                >
                  <title>{name}{c ? ` — ${c}` : ''}</title>
                </Geography>
              );
            })}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
};

export default CountryMap;

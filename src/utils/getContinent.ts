export type Continent =
  | 'Africa'
  | 'Antarctica'
  | 'Asia'
  | 'Europe'
  | 'North America'
  | 'Oceania'
  | 'South America';

/**
 * Eastern edge of Africa as a longitude for a given latitude. Follows the
 * Egypt/Israel border, the Gulf of Aqaba, the Red Sea axis, the Gulf of Aden
 * (so the Horn of Africa stays African) and finally the Indian Ocean so that
 * Madagascar, the Seychelles and Mauritius are counted as Africa.
 */
const africaEastLimit = (lat: number): number => {
  if (lat >= 31.3) { return 34.2; }                        // Mediterranean coast → Rafah
  if (lat >= 29.5) { return 34.25 + (31.3 - lat) * 0.361; } // Egypt–Israel land border
  if (lat >= 27.7) { return 34.65; }                       // Gulf of Aqaba (Sinai stays Africa)
  if (lat >= 12.5) { return 33.9 + (27.7 - lat) * 0.612; } // Red Sea axis down to Bab-el-Mandeb
  if (lat >= 0) { return 52; }                             // Gulf of Aden → Cape Guardafui
  return 60;                                               // Indian Ocean islands
};

/** Northern edge of Africa: Maghreb reaches ~37°N, Libya/Egypt only ~33°N. */
const africaNorthLimit = (lng: number): number => (lng > 12 ? 33.5 : lng >= 0 ? 37.5 : 35.95);

/**
 * Approximates the continent for a coordinate using geographic boundaries.
 * Accurate for typical city locations; a few border regions (e.g. the
 * Europe/Asia divide through the Caucasus) are judgment calls.
 */
export const getContinent = (lat: number, lng: number): Continent => {
  if (lat < -60) {
    return 'Antarctica';
  }

  // Pacific islands west of the antimeridian (Samoa, French Polynesia...)
  if (lng < -140 && lat < 15) {
    return 'Oceania';
  }

  // The Americas (Panama and the rest of Central America stay North American;
  // Colombia's Pacific coast west of the Darién is South American)
  if (lng < -30) {
    if ((lat < 12.5 && lng > -75) || (lat < 8.9 && lng > -77.5) || (lat < 7.5 && lng > -78.5) || (lat < 2 && lng > -92)) {
      return 'South America';
    }
    return 'North America';
  }

  // Sub-Antarctic Indian Ocean islands (Kerguelen, Crozet, Heard)
  if (lat < -40 && lng > 30 && lng < 110) {
    return 'Antarctica';
  }

  // Oceania: Australia, New Zealand, Melanesia (from the PNG border at 141°E), Polynesia
  if ((lng >= 110 && lat <= -10) || (lng >= 129 && lat < -8) || (lng >= 141 && lat < 0)) {
    return 'Oceania';
  }

  // Africa: south of the Mediterranean and west of the Red Sea / Indian Ocean
  // line (which bends east so Ethiopia, Somalia, Kenya, Tanzania, Mozambique
  // and Madagascar are not mistaken for Asia).
  if (lng > -30 && lng < africaEastLimit(lat) && lat < africaNorthLimit(lng)) {
    return 'Africa';
  }

  // Asia: east of the Urals (~60°E), the Middle East, and Anatolia/Caucasus
  if (lng >= 60) {
    return 'Asia';
  }
  if (lat < 35.5 && lng >= 34) {
    return 'Asia';
  }
  if (lat < 42 && lng > 26) {
    return 'Asia';
  }
  // Caucasus: keep Georgia with Armenia and Azerbaijan
  if (lat < 43.6 && lng >= 40) {
    return 'Asia';
  }

  return 'Europe';
};

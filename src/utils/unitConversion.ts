export type UnitSystem = 'metric' | 'imperial';

export interface UnitLabels {
  lengthSmall: string;   // cm vs in
  lengthDepth: string;   // m vs ft
  weightSmall: string;   // g vs oz
  weightLarge: string;   // kg vs lb
  windSpeed: string;     // m/s vs kt (knots)
  temperature: string;   // °C vs °F
  tideHeight: string;    // cm vs ft
  waveHeight: string;    // m vs ft
}

export const UNIT_LABELS: Record<UnitSystem, UnitLabels> = {
  metric: {
    lengthSmall: 'cm',
    lengthDepth: 'm',
    weightSmall: 'g',
    weightLarge: 'kg',
    windSpeed: 'm/s',
    temperature: '°C',
    tideHeight: 'cm',
    waveHeight: 'm',
  },
  imperial: {
    lengthSmall: 'in',
    lengthDepth: 'ft',
    weightSmall: 'oz',
    weightLarge: 'lb',
    windSpeed: 'kt', // Knots is standard for nautical & global angling
    temperature: '°F',
    tideHeight: 'ft',
    waveHeight: 'ft',
  },
};

/**
 * Format fish length (stored in cm in DB)
 */
export function formatFishLength(cm: number | undefined | null, unit: UnitSystem = 'metric'): string {
  if (cm === undefined || cm === null || isNaN(cm) || cm <= 0) return '-';
  if (unit === 'imperial') {
    const inches = cm * 0.393701;
    return `${inches.toFixed(1)} in`;
  }
  return `${cm.toFixed(1)} cm`;
}

/**
 * Convert user input length into cm for storage
 */
export function parseLengthToCm(value: number, fromUnit: UnitSystem = 'metric'): number {
  if (isNaN(value) || value <= 0) return 0;
  if (fromUnit === 'imperial') {
    return Math.round(value * 2.54 * 10) / 10;
  }
  return Math.round(value * 10) / 10;
}

/**
 * Convert stored cm into display value number
 */
export function convertLengthFromCm(cm: number | undefined | null, toUnit: UnitSystem = 'metric'): number | undefined {
  if (cm === undefined || cm === null || isNaN(cm)) return undefined;
  if (toUnit === 'imperial') {
    return Math.round(cm * 0.393701 * 10) / 10;
  }
  return cm;
}

/**
 * Format fish weight (stored in grams in DB)
 */
export function formatFishWeight(grams: number | undefined | null, unit: UnitSystem = 'metric'): string {
  if (grams === undefined || grams === null || isNaN(grams) || grams <= 0) return '-';
  if (unit === 'imperial') {
    const lbs = grams / 453.59237;
    if (lbs < 1) {
      const oz = grams / 28.34952;
      return `${oz.toFixed(1)} oz`;
    }
    return `${lbs.toFixed(2)} lb`;
  }
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(2)} kg`;
  }
  return `${Math.round(grams)} g`;
}

/**
 * Convert user input weight into grams for storage
 */
export function parseWeightToGrams(value: number, fromUnit: UnitSystem = 'metric', asPounds = true): number {
  if (isNaN(value) || value <= 0) return 0;
  if (fromUnit === 'imperial') {
    return asPounds ? Math.round(value * 453.59237) : Math.round(value * 28.34952);
  }
  return Math.round(value); // in grams
}

/**
 * Convert stored grams into display value number
 */
export function convertWeightFromGrams(grams: number | undefined | null, toUnit: UnitSystem = 'metric'): { value: number; unit: string } | undefined {
  if (grams === undefined || grams === null || isNaN(grams)) return undefined;
  if (toUnit === 'imperial') {
    const lbs = grams / 453.59237;
    return { value: Math.round(lbs * 100) / 100, unit: 'lb' };
  }
  if (grams >= 1000) {
    return { value: Math.round((grams / 1000) * 100) / 100, unit: 'kg' };
  }
  return { value: Math.round(grams), unit: 'g' };
}

/**
 * Format wind speed (stored in m/s) - supports knots or mph
 */
export function formatWindSpeed(speedMs: number | undefined | null, unit: UnitSystem = 'metric', preferKnots = true): string {
  if (speedMs === undefined || speedMs === null || isNaN(speedMs)) return '-';
  if (unit === 'imperial') {
    if (preferKnots) {
      const knots = speedMs * 1.94384;
      return `${knots.toFixed(1)} kt`;
    }
    const mph = speedMs * 2.23694;
    return `${mph.toFixed(1)} mph`;
  }
  return `${speedMs.toFixed(1)} m/s`;
}

/**
 * Convert user wind input into m/s for storage
 */
export function parseWindSpeedToMs(value: number, fromUnit: UnitSystem = 'metric', isKnots = true): number {
  if (isNaN(value)) return 0;
  if (fromUnit === 'imperial') {
    return isKnots ? Math.round((value / 1.94384) * 10) / 10 : Math.round((value / 2.23694) * 10) / 10;
  }
  return Math.round(value * 10) / 10;
}

/**
 * Convert stored m/s to display number
 */
export function convertWindSpeedFromMs(speedMs: number | undefined | null, toUnit: UnitSystem = 'metric', isKnots = true): number | undefined {
  if (speedMs === undefined || speedMs === null || isNaN(speedMs)) return undefined;
  if (toUnit === 'imperial') {
    return isKnots ? Math.round(speedMs * 1.94384 * 10) / 10 : Math.round(speedMs * 2.23694 * 10) / 10;
  }
  return speedMs;
}

/**
 * Format temperature (stored in Celsius)
 */
export function formatTemperature(tempC: number | undefined | null, unit: UnitSystem = 'metric'): string {
  if (tempC === undefined || tempC === null || isNaN(tempC)) return '-';
  if (unit === 'imperial') {
    const tempF = (tempC * 1.8) + 32;
    return `${Math.round(tempF)}°F`;
  }
  return `${tempC.toFixed(1)}°C`;
}

/**
 * Convert user temp input into Celsius for storage
 */
export function parseTemperatureToC(value: number, fromUnit: UnitSystem = 'metric'): number {
  if (isNaN(value)) return 0;
  if (fromUnit === 'imperial') {
    return Math.round(((value - 32) / 1.8) * 10) / 10;
  }
  return Math.round(value * 10) / 10;
}

/**
 * Convert stored Celsius to display number
 */
export function convertTemperatureFromC(tempC: number | undefined | null, toUnit: UnitSystem = 'metric'): number | undefined {
  if (tempC === undefined || tempC === null || isNaN(tempC)) return undefined;
  if (toUnit === 'imperial') {
    return Math.round(((tempC * 1.8) + 32) * 10) / 10;
  }
  return tempC;
}

/**
 * Format tide level / height (stored in cm)
 */
export function formatTideHeight(heightCm: number | undefined | null, unit: UnitSystem = 'metric'): string {
  if (heightCm === undefined || heightCm === null || isNaN(heightCm)) return '-';
  if (unit === 'imperial') {
    const ft = heightCm / 30.48;
    return `${ft.toFixed(1)} ft`;
  }
  return `${Math.round(heightCm)} cm`;
}

/**
 * Format wave height (stored in meters)
 */
export function formatWaveHeight(meters: number | undefined | null, unit: UnitSystem = 'metric'): string {
  if (meters === undefined || meters === null || isNaN(meters)) return '-';
  if (unit === 'imperial') {
    const ft = meters * 3.28084;
    return `${ft.toFixed(1)} ft`;
  }
  return `${meters.toFixed(1)} m`;
}

/**
 * Format depth (e.g. 15m -> 49ft)
 */
export function formatDepth(meters: number | undefined | null, unit: UnitSystem = 'metric'): string {
  if (meters === undefined || meters === null || isNaN(meters)) return '-';
  if (unit === 'imperial') {
    const ft = meters * 3.28084;
    return `${ft.toFixed(1)} ft`;
  }
  return `${meters.toFixed(1)} m`;
}

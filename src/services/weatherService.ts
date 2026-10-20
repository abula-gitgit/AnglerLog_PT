import { WeatherCondition, TideName, WeatherData } from '../types/fishing';

const WIND_DIRECTIONS_16 = [
  'N', 'NNE', 'NE', 'ENE',
  'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW',
  'W', 'WNW', 'NW', 'NNW'
];

export function degreesToCompassDirection(deg: number): string {
  const normalized = (deg % 360 + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return WIND_DIRECTIONS_16[index];
}

// Global Spring and Neap tide notation by lunar age & phase
export function calculateMoonAgeAndTide(date: Date = new Date()): { moonAge: number; tideName: TideName; moonDescription: string } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Astronomical Julian day approximation
  const julian = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day - 1524.5;
  const daysSinceNewMoon2000 = julian - 2451549.5;
  const newMoons = daysSinceNewMoon2000 / 29.53058867;
  const moonAge = (newMoons - Math.floor(newMoons)) * 29.53;
  const roundedAge = Math.round(moonAge * 10) / 10;

  // Standard Spring / Neap tide classification based on Lunar Day
  const lunarDay = Math.floor(moonAge) + 1;

  let tideName: TideName = 'Mid Tide';
  if ((lunarDay >= 1 && lunarDay <= 3) || (lunarDay >= 15 && lunarDay <= 18) || lunarDay >= 29) {
    tideName = 'Spring Tide';
  } else if ((lunarDay >= 4 && lunarDay <= 6) || (lunarDay >= 19 && lunarDay <= 21)) {
    tideName = 'Mid Tide';
  } else if ((lunarDay >= 7 && lunarDay <= 9) || (lunarDay >= 22 && lunarDay <= 24)) {
    tideName = 'Neap Tide';
  } else {
    tideName = 'Transition Tide';
  }

  let moonDescription = 'Moon Age ' + roundedAge;
  if (moonAge < 1.5 || moonAge > 28.0) moonDescription += ' (New Moon)';
  else if (moonAge >= 6.5 && moonAge <= 8.5) moonDescription += ' (First Quarter)';
  else if (moonAge >= 13.5 && moonAge <= 16.5) moonDescription += ' (Full Moon · Spring Tide)';
  else if (moonAge >= 21.5 && moonAge <= 23.5) moonDescription += ' (Third Quarter)';

  return { moonAge: roundedAge, tideName, moonDescription };
}

// Convert Open-Meteo weather code to WeatherCondition
export function weatherCodeToCondition(code: number): WeatherCondition {
  if (code === 0 || code === 1) return 'sunny';
  if (code === 2 || code === 3) return 'cloudy';
  if (code >= 45 && code <= 48) return 'fog';
  if (code >= 51 && code <= 65) return 'rain';
  if (code >= 66) return 'heavy_rain';
  return 'sunny';
}

export interface HourlyForecastItem {
  hour: number;
  timeStr: string; // "00:00"
  windSpeedMs: number;
  windDirection: string; // "NE"
  windDirectionDeg: number; // 45
  temperature: number; // 18.5
  condition: WeatherCondition;
}

export interface DayWeatherSummary {
  currentWindSpeedMs: number;
  currentWindDirection: string;
  currentWindDirectionDeg: number;
  currentTemperature?: number;
  currentPressureHpa?: number;
  currentCondition: WeatherCondition;
  hourly: HourlyForecastItem[];
  isLiveApi: boolean;
}

// In-memory cache for daily weather requests
const weatherDailyCache = new Map<string, DayWeatherSummary>();

export function generateRealisticDayWeather(lat: number, lng: number, date: Date): DayWeatherSummary {
  const seed = Math.abs(
    date.getFullYear() * 10000 + 
    (date.getMonth() + 1) * 100 + 
    date.getDate() + 
    Math.round(lat * 100) + 
    Math.round(lng * 100)
  );

  const baseDeg = (seed * 37) % 360;
  const baseSpeed = 1.8 + ((seed % 25) / 10); // 1.8 to 4.2 m/s base
  const baseTemp = 16 + (seed % 10); // 16 to 25°C

  const hourly: HourlyForecastItem[] = [];

  for (let h = 0; h < 24; h++) {
    // Diurnal variation: Sea breeze during day, calm twilight, land breeze at night
    let speedMult = 1.0;
    let degShift = 0;
    let tempDiff = 0;

    if (h >= 0 && h < 6) {
      // Night / pre-dawn: gentle land breeze
      speedMult = 0.7 + 0.1 * Math.sin(h);
      degShift = -30;
      tempDiff = -3.5 + (h * 0.4);
    } else if (h >= 6 && h <= 8) {
      // Morning twilight lull
      speedMult = 0.5;
      degShift = 0;
      tempDiff = -1.0;
    } else if (h > 8 && h <= 15) {
      // Day sea breeze: speed picks up
      speedMult = 1.2 + 0.3 * Math.sin(((h - 8) / 7) * Math.PI);
      degShift = 45; // rotation toward onshore
      tempDiff = 2.0 + 3.0 * Math.sin(((h - 8) / 7) * Math.PI);
    } else if (h > 15 && h <= 18) {
      // Evening twilight lull
      speedMult = 0.65;
      degShift = 15;
      tempDiff = 1.0;
    } else {
      // Night land breeze
      speedMult = 0.85;
      degShift = -20;
      tempDiff = -2.0;
    }

    const windDeg = (baseDeg + degShift + 360) % 360;
    const speedMs = Math.round(Math.max(0.5, baseSpeed * speedMult) * 10) / 10;
    const temp = Math.round((baseTemp + tempDiff) * 10) / 10;

    hourly.push({
      hour: h,
      timeStr: `${String(h).padStart(2, '0')}:00`,
      windSpeedMs: speedMs,
      windDirection: degreesToCompassDirection(windDeg),
      windDirectionDeg: Math.round(windDeg),
      temperature: temp,
      condition: seed % 3 === 0 ? 'cloudy' : 'sunny',
    });
  }

  const currentHour = new Date().getHours();
  const currentItem = hourly[currentHour] || hourly[12];

  return {
    currentWindSpeedMs: currentItem.windSpeedMs,
    currentWindDirection: currentItem.windDirection,
    currentWindDirectionDeg: currentItem.windDirectionDeg,
    currentTemperature: currentItem.temperature,
    currentPressureHpa: 1013,
    currentCondition: currentItem.condition,
    hourly,
    isLiveApi: false,
  };
}

export async function fetchDayWeatherSummary(lat: number, lng: number, date: Date = new Date()): Promise<DayWeatherSummary> {
  const dateStr = date.toISOString().split('T')[0];
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)},${dateStr}`;
  if (weatherDailyCache.has(cacheKey)) {
    return weatherDailyCache.get(cacheKey)!;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.hourly && Array.isArray(data.hourly.time)) {
        const hourly: HourlyForecastItem[] = [];
        const times: string[] = data.hourly.time;
        const speeds: number[] = data.hourly.wind_speed_10m || [];
        const directions: number[] = data.hourly.wind_direction_10m || [];
        const temps: number[] = data.hourly.temperature_2m || [];
        const codes: number[] = data.hourly.weather_code || [];

        for (let i = 0; i < Math.min(times.length, 24); i++) {
          const tStr = times[i];
          const hour = parseInt(tStr.split('T')[1].split(':')[0], 10);
          const windDeg = directions[i] ?? 0;
          const rawSpeed = speeds[i] ?? 0;
          const speedMs = Math.round((rawSpeed / 3.6) * 10) / 10;
          const temp = temps[i] !== undefined ? Math.round(temps[i] * 10) / 10 : 20;
          const cond = weatherCodeToCondition(codes[i] ?? 0);

          hourly.push({
            hour,
            timeStr: `${String(hour).padStart(2, '0')}:00`,
            windSpeedMs: speedMs,
            windDirection: degreesToCompassDirection(windDeg),
            windDirectionDeg: windDeg,
            temperature: temp,
            condition: cond,
          });
        }

        const current = data.current;
        const currentSpeed = current?.wind_speed_10m ? Math.round((current.wind_speed_10m / 3.6) * 10) / 10 : (hourly[12]?.windSpeedMs || 2.5);
        const currentDeg = current?.wind_direction_10m ?? hourly[12]?.windDirectionDeg ?? 45;
        const currentTemp = current?.temperature_2m !== undefined ? Math.round(current.temperature_2m * 10) / 10 : hourly[12]?.temperature;
        const currentPressure = current?.surface_pressure ? Math.round(current.surface_pressure) : undefined;
        const currentCond = current?.weather_code !== undefined ? weatherCodeToCondition(current.weather_code) : (hourly[12]?.condition || 'sunny');

        const result: DayWeatherSummary = {
          currentWindSpeedMs: currentSpeed,
          currentWindDirection: degreesToCompassDirection(currentDeg),
          currentWindDirectionDeg: currentDeg,
          currentTemperature: currentTemp,
          currentPressureHpa: currentPressure,
          currentCondition: currentCond,
          hourly,
          isLiveApi: true,
        };

        weatherDailyCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn('Open-Meteo day weather fetch fallback:', err);
  }

  const fallbackResult = generateRealisticDayWeather(lat, lng, date);
  weatherDailyCache.set(cacheKey, fallbackResult);
  return fallbackResult;
}

// Fetch real-time weather from Open-Meteo API using coordinates
export async function fetchCurrentWeather(lat: number, lng: number): Promise<Partial<WeatherData> | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&timezone=auto`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error('Weather API error: ' + res.status);
    const data = await res.json();

    const current = data.current;
    if (!current) return null;

    const weatherCode = current.weather_code ?? 0;
    let condition: WeatherCondition = 'sunny';
    if (weatherCode === 0 || weatherCode === 1) {
      condition = 'sunny';
    } else if (weatherCode === 2 || weatherCode === 3) {
      condition = 'cloudy';
    } else if (weatherCode >= 45 && weatherCode <= 48) {
      condition = 'fog';
    } else if (weatherCode >= 51 && weatherCode <= 65) {
      condition = 'rain';
    } else if (weatherCode >= 66 || weatherCode >= 80) {
      condition = 'heavy_rain';
    }

    // Convert wind speed from km/h to m/s if needed (Open-Meteo default is km/h)
    const windSpeedMs = current.wind_speed_10m ? Math.round((current.wind_speed_10m / 3.6) * 10) / 10 : 0;
    const windDirection = current.wind_direction_10m !== undefined ? degreesToCompassDirection(current.wind_direction_10m) : 'N';
    const temperature = current.temperature_2m !== undefined ? Math.round(current.temperature_2m * 10) / 10 : undefined;
    const pressureHpa = current.surface_pressure ? Math.round(current.surface_pressure) : undefined;

    const { tideName, moonDescription } = calculateMoonAgeAndTide(new Date());

    return {
      condition,
      temperature,
      windSpeedMs,
      windDirection,
      pressureHpa,
      tideName,
      moonPhase: moonDescription,
      waveHeight: windSpeedMs < 2.0 ? 'Calm' : windSpeedMs < 4.5 ? 'Light Chop' : windSpeedMs < 7.0 ? 'Moderate Waves' : 'Rough'
    };
  } catch (err) {
    console.warn('Could not fetch real-time weather, falling back to local lunar calculation:', err);
    const { tideName, moonDescription } = calculateMoonAgeAndTide(new Date());
    return {
      tideName,
      moonPhase: moonDescription
    };
  }
}

import { TideName, TideState } from '../types/fishing';
import { calculateMoonAgeAndTide } from './weatherService';

export interface TideEvent {
  time: string; // HH:mm
  heightCm: number;
  type: 'high' | 'low';
}

export interface TidePrimeTime {
  name: string; // e.g., 'Morning Twilight × Flood Tide'
  nameEn: string; // e.g., 'Morning Twilight × Flood Tide'
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  description: string;
  descriptionEn: string;
  intensity: 'highest' | 'high' | 'medium';
}

export interface LiveMarineData {
  waveHeightM?: number;
  wavePeriodS?: number;
  waveDirectionDeg?: number;
  windWaveHeightM?: number;
  swellWaveHeightM?: number;
  seaSurfaceTemperatureC?: number;
  isSea: boolean;
  dataSource: 'open-meteo' | 'noaa' | 'harmonic';
  stationName?: string;
  seaConditionDescription: string;
  seaConditionDescriptionEn: string;
}

export interface TideDayData {
  date: string; // YYYY-MM-DD
  tideName: TideName;
  moonAge: number;
  moonDescription: string;
  highTides: TideEvent[];
  lowTides: TideEvent[];
  events: TideEvent[]; // all ordered by time
  hourlyCurve: { time: string; hour: number; minute: number; heightCm: number; state: TideState }[];
  currentTideLevelCm: number;
  currentTideState: TideState;
  currentFlowDirection: 'rising' | 'falling' | 'slack';
  currentFlowDescription: string;
  currentFlowDescriptionEn: string;
  primeTimes: TidePrimeTime[];
  tideType: 'semi-diurnal' | 'mixed' | 'diurnal' | 'micro';
  marine?: LiveMarineData;
  dataSource: 'open-meteo' | 'noaa' | 'harmonic';
  stationName?: string;
}

/**
 * Major NOAA coastal tidal stations along North American shores
 */
interface NOAAStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  state: string;
}

const NOAA_REFERENCE_STATIONS: NOAAStation[] = [
  // West Coast
  { id: '9410170', name: 'San Diego, CA', lat: 32.714, lng: -117.173, state: 'CA' },
  { id: '9410660', name: 'Los Angeles, CA', lat: 33.720, lng: -118.272, state: 'CA' },
  { id: '9414290', name: 'San Francisco, CA', lat: 37.807, lng: -122.465, state: 'CA' },
  { id: '9435380', name: 'South Beach, OR', lat: 44.625, lng: -124.043, state: 'OR' },
  { id: '9447130', name: 'Seattle, WA', lat: 47.602, lng: -122.339, state: 'WA' },
  // Gulf Coast
  { id: '8771450', name: 'Galveston Pier 21, TX', lat: 29.310, lng: -94.793, state: 'TX' },
  { id: '8761724', name: 'Grand Isle, LA', lat: 29.263, lng: -89.957, state: 'LA' },
  { id: '8726520', name: 'St. Petersburg, FL', lat: 27.760, lng: -82.627, state: 'FL' },
  { id: '8724580', name: 'Key West, FL', lat: 24.556, lng: -81.807, state: 'FL' },
  // East Coast
  { id: '8723214', name: 'Virginia Key / Miami, FL', lat: 25.731, lng: -80.162, state: 'FL' },
  { id: '8670870', name: 'Fort Pulaski, GA', lat: 32.034, lng: -80.902, state: 'GA' },
  { id: '8665530', name: 'Charleston, SC', lat: 32.782, lng: -79.925, state: 'SC' },
  { id: '8658120', name: 'Wilmington, NC', lat: 34.227, lng: -77.953, state: 'NC' },
  { id: '8638610', name: 'Sewells Point, VA', lat: 36.947, lng: -76.330, state: 'VA' },
  { id: '8534720', name: 'Atlantic City, NJ', lat: 39.357, lng: -74.418, state: 'NJ' },
  { id: '8518750', name: 'The Battery, NY', lat: 40.700, lng: -74.014, state: 'NY' },
  { id: '8443970', name: 'Boston, MA', lat: 42.354, lng: -71.053, state: 'MA' },
  // Hawaii & Alaska
  { id: '1612340', name: 'Honolulu, HI', lat: 21.307, lng: -157.867, state: 'HI' },
  { id: '9455920', name: 'Anchorage, AK', lat: 61.238, lng: -149.890, state: 'AK' },
];

/**
 * Find closest NOAA station if coordinate is within ~180km
 */
function findNearestNOAAStation(lat: number, lng: number): NOAAStation | null {
  let closest: NOAAStation | null = null;
  let minDistanceSq = 3.2; // approx 180km radius threshold in degree squares

  for (const station of NOAA_REFERENCE_STATIONS) {
    const dLat = station.lat - lat;
    const dLng = (station.lng - lng) * Math.cos((lat * Math.PI) / 180);
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      closest = station;
    }
  }
  return closest;
}

/**
 * Determine global tidal regime based on latitude and longitude
 */
function getTidalRegime(lat: number, lng: number): {
  type: 'semi-diurnal' | 'mixed' | 'diurnal' | 'micro';
  amplitudeMultiplier: number;
  diurnalRatio: number; // Ratio of diurnal (K1/O1) to semi-diurnal (M2)
  lunitidalLagHours: number; // Mean local lunitidal interval in hours
} {
  // Gulf of Mexico & parts of Caribbean: largely diurnal
  if (lat >= 18 && lat <= 31 && lng >= -98 && lng <= -80) {
    return { type: 'diurnal', amplitudeMultiplier: 0.65, diurnalRatio: 0.85, lunitidalLagHours: 1.8 };
  }

  // Mediterranean Sea & Baltic Sea: micro-tidal
  if ((lat >= 30 && lat <= 46 && lng >= -6 && lng <= 36) || (lat >= 53 && lat <= 66 && lng >= 10 && lng <= 30)) {
    return { type: 'micro', amplitudeMultiplier: 0.25, diurnalRatio: 0.3, lunitidalLagHours: 1.0 };
  }

  // North American Pacific Coast (California to Alaska): Mixed semi-diurnal
  if (lat >= 24 && lat <= 60 && lng >= -160 && lng <= -115) {
    return { type: 'mixed', amplitudeMultiplier: 1.15, diurnalRatio: 0.55, lunitidalLagHours: 2.2 };
  }

  // Australia & New Zealand: mixed to semi-diurnal
  if (lat >= -45 && lat <= -10 && lng >= 110 && lng <= 178) {
    return { type: 'mixed', amplitudeMultiplier: 1.1, diurnalRatio: 0.45, lunitidalLagHours: 1.5 };
  }

  // European Atlantic Coast (UK, France): large semi-diurnal tides
  if (lat >= 43 && lat <= 60 && lng >= -12 && lng <= 2) {
    return { type: 'semi-diurnal', amplitudeMultiplier: 1.6, diurnalRatio: 0.15, lunitidalLagHours: 2.8 };
  }

  // North American Atlantic Coast: semi-diurnal
  if (lat >= 25 && lat <= 48 && lng >= -82 && lng <= -60) {
    return { type: 'semi-diurnal', amplitudeMultiplier: 1.1, diurnalRatio: 0.22, lunitidalLagHours: 1.4 };
  }

  // Japan & East Asian Pacific Coast (Default): semi-diurnal with mild diurnal inequality
  return { type: 'semi-diurnal', amplitudeMultiplier: 1.0, diurnalRatio: 0.28, lunitidalLagHours: 1.2 };
}

/**
 * Astronomical harmonic estimation of tidal curve adaptable to global oceans and seas.
 * Evaluates semi-diurnal (M2, S2) and diurnal (K1, O1) harmonic approximations referenced to lunar transit.
 */
export function calculateDayTideData(targetDate: Date = new Date(), lng = 139.7, lat = 35.6): TideDayData {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;
  const day = targetDate.getDate();
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const { moonAge, tideName, moonDescription } = calculateMoonAgeAndTide(targetDate);
  const regime = getTidalRegime(lat, lng);

  let baseAmp = 65;
  if (tideName === 'Spring Tide' || tideName === '大潮') baseAmp = 82;
  else if (tideName === 'Mid Tide' || tideName === '中潮') baseAmp = 65;
  else if (tideName === 'Neap Tide' || tideName === '小潮') baseAmp = 42;
  else baseAmp = 32;

  const amplitude = Math.round(baseAmp * regime.amplitudeMultiplier);
  const baseLevel = Math.round(95 * regime.amplitudeMultiplier);

  // Fundamental tidal wave cycles (hours)
  const semiDiurnalPeriod = 12.4206; // M2 principal lunar semi-diurnal (~12h 25m)
  const diurnalPeriod = 24.8412;     // Diurnal wave cycle (~24h 50m)

  // Lunar transit hour in local solar/standard time:
  const localMoonTransitHour = (moonAge * 0.842) % 24;
  const highTideBaseHour = (localMoonTransitHour + regime.lunitidalLagHours) % semiDiurnalPeriod;

  // Function to calculate tide height at given local hour (0..24)
  const getHeightAtHour = (h: number): number => {
    const m2Angle = (2 * Math.PI * (h - highTideBaseHour)) / semiDiurnalPeriod;
    const diurnalAngle = (2 * Math.PI * (h - highTideBaseHour)) / diurnalPeriod;

    let val = baseLevel + 
      (amplitude * Math.cos(m2Angle)) + 
      (amplitude * regime.diurnalRatio * Math.cos(diurnalAngle - Math.PI / 4)) +
      (amplitude * 0.12 * Math.cos(2 * m2Angle));

    if (regime.type === 'diurnal') {
      val = baseLevel + 
        (amplitude * 0.4 * Math.cos(m2Angle)) + 
        (amplitude * 0.9 * Math.cos(diurnalAngle - Math.PI / 4));
    }

    return Math.round(val);
  };

  // Generate curve sample points (every 15 mins = 97 points)
  const curveSamples: { time: string; hour: number; minute: number; heightCm: number; state: TideState }[] = [];
  for (let min = 0; min <= 24 * 60; min += 15) {
    const h = min / 60;
    const hourInt = Math.floor(h) % 24;
    const minInt = min % 60;
    const timeStr = `${String(hourInt).padStart(2, '0')}:${String(minInt).padStart(2, '0')}`;
    const height = getHeightAtHour(h);
    curveSamples.push({
      time: timeStr,
      hour: hourInt,
      minute: minInt,
      heightCm: height,
      state: 'Other',
    });
  }

  // Find local extrema (High tides and Low tides)
  const highTides: TideEvent[] = [];
  const lowTides: TideEvent[] = [];

  for (let i = 2; i < curveSamples.length - 2; i++) {
    const prev = curveSamples[i - 1].heightCm;
    const curr = curveSamples[i].heightCm;
    const next = curveSamples[i + 1].heightCm;

    if (curr >= prev && curr > next && curr >= curveSamples[i - 2].heightCm && curr >= curveSamples[i + 2].heightCm) {
      const t = curveSamples[i].time;
      if (!highTides.some((e) => Math.abs(parseFloat(e.time) - parseFloat(t)) < 2.5)) {
        highTides.push({ time: t, heightCm: curr, type: 'high' });
      }
    } else if (curr <= prev && curr < next && curr <= curveSamples[i - 2].heightCm && curr <= curveSamples[i + 2].heightCm) {
      const t = curveSamples[i].time;
      if (!lowTides.some((e) => Math.abs(parseFloat(e.time) - parseFloat(t)) < 2.5)) {
        lowTides.push({ time: t, heightCm: curr, type: 'low' });
      }
    }
  }

  const allEvents = [...highTides, ...lowTides].sort((a, b) => a.time.localeCompare(b.time));

  // Determine current tide state
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentFractionalHour = currentMinutes / 60;
  const currentTideLevelCm = getHeightAtHour(currentFractionalHour);

  const height15MinAgo = getHeightAtHour(currentFractionalHour - 0.25);
  const height15MinLater = getHeightAtHour(currentFractionalHour + 0.25);
  const rateOfChange = height15MinLater - height15MinAgo;

  let currentFlowDirection: 'rising' | 'falling' | 'slack' = 'slack';
  let currentTideState: TideState = 'Slack Water';
  let currentFlowDescription = 'Slack Water (minimal flow)';
  let currentFlowDescriptionEn = 'Slack Water (minimal flow)';

  const threshold = Math.max(2, Math.round(3 * regime.amplitudeMultiplier));
  const peakThreshold = Math.max(8, Math.round(11 * regime.amplitudeMultiplier));

  if (Math.abs(rateOfChange) < threshold) {
    currentFlowDirection = 'slack';
    currentTideState = 'Slack Water';
    currentFlowDescription = 'Slack tide (slow tidal current)';
    currentFlowDescriptionEn = 'Slack tide (slow tidal current)';
  } else if (rateOfChange > 0) {
    currentFlowDirection = 'rising';
    if (rateOfChange > peakThreshold) {
      currentTideState = 'Rising (Late)';
      currentFlowDescription = 'Flood tide peak (strong inflow & prime bite)';
      currentFlowDescriptionEn = 'Flood tide peak (strong inflow & prime bite)';
    } else {
      currentTideState = 'Rising (Early)';
      currentFlowDescription = 'Rising tide (flow starting, fish activity rises)';
      currentFlowDescriptionEn = 'Rising tide (flow starting, fish activity rises)';
    }
  } else {
    currentFlowDirection = 'falling';
    if (Math.abs(rateOfChange) > peakThreshold) {
      currentTideState = 'Falling (Late)';
      currentFlowDescription = 'Ebb tide peak (baitfish washing out, golden hour)';
      currentFlowDescriptionEn = 'Ebb tide peak (baitfish washing out, golden hour)';
    } else {
      currentTideState = 'Falling (Early)';
      currentFlowDescription = 'Falling tide (outgoing flow gaining momentum)';
      currentFlowDescriptionEn = 'Falling tide (outgoing flow gaining momentum)';
    }
  }

  // Label curve points
  for (let i = 0; i < curveSamples.length; i++) {
    const sampleH = curveSamples[i].hour + curveSamples[i].minute / 60;
    const diff = getHeightAtHour(sampleH + 0.25) - getHeightAtHour(sampleH - 0.25);
    if (Math.abs(diff) < threshold) {
      curveSamples[i].state = 'Slack Water';
    } else if (diff > peakThreshold) {
      curveSamples[i].state = 'Rising (Late)';
    } else if (diff > 0) {
      curveSamples[i].state = 'Rising (Early)';
    } else if (diff < -peakThreshold) {
      curveSamples[i].state = 'Falling (Late)';
    } else {
      curveSamples[i].state = 'Falling (Early)';
    }
  }

  // Generate Prime Times
  const primeTimes: TidePrimeTime[] = [];

  for (let i = 0; i < allEvents.length - 1; i++) {
    const e1 = allEvents[i];
    const e2 = allEvents[i + 1];

    const [h1, m1] = e1.time.split(':').map(Number);
    const [h2, m2] = e2.time.split(':').map(Number);
    const t1Min = h1 * 60 + m1;
    const t2Min = h2 * 60 + m2;
    const duration = t2Min - t1Min;

    if (duration > 60 && duration < 600) {
      if (e1.type === 'low' && e2.type === 'high') {
        const primeStartMin = Math.round(t1Min + duration * 0.28);
        const primeEndMin = Math.round(t1Min + duration * 0.75);

        const sH = Math.floor(primeStartMin / 60);
        const sM = primeStartMin % 60;
        const eH = Math.floor(primeEndMin / 60);
        const eM = primeEndMin % 60;

        const isMorning = sH >= 4 && sH <= 8;
        const isEvening = sH >= 16 && sH <= 20;

        primeTimes.push({
          name: isMorning ? 'Dawn Twilight × Flood Bite' : isEvening ? 'Dusk Twilight × Flood Bite' : 'Flood Tide Prime Window',
          nameEn: isMorning ? 'Dawn Twilight × Flood Bite' : isEvening ? 'Dusk Twilight × Flood Bite' : 'Flood Tide Prime Window',
          startTime: `${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')}`,
          endTime: `${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`,
          description: 'Rising water brings fresh oceanic currents and schooling baitfish close to shore.',
          descriptionEn: 'Rising water brings fresh oceanic currents and schooling baitfish close to shore.',
          intensity: (isMorning || isEvening || tideName === 'Spring Tide' || tideName === '大潮') ? 'highest' : 'high',
        });
      } else if (e1.type === 'high' && e2.type === 'low') {
        const primeStartMin = Math.round(t1Min + duration * 0.25);
        const primeEndMin = Math.round(t1Min + duration * 0.72);

        const sH = Math.floor(primeStartMin / 60);
        const sM = primeStartMin % 60;
        const eH = Math.floor(primeEndMin / 60);
        const eM = primeEndMin % 60;

        const isMorning = sH >= 4 && sH <= 8;
        const isEvening = sH >= 16 && sH <= 20;

        primeTimes.push({
          name: isMorning ? 'Dawn Twilight × Ebb Bite' : isEvening ? 'Dusk Twilight × Ebb Bite' : 'Ebb Tide Prime Window',
          nameEn: isMorning ? 'Dawn Twilight × Ebb Bite' : isEvening ? 'Dusk Twilight × Ebb Bite' : 'Ebb Tide Prime Window',
          startTime: `${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')}`,
          endTime: `${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`,
          description: 'Strong outgoing flow sweeps bait out from flats and estuaries into ambush lanes.',
          descriptionEn: 'Strong outgoing flow sweeps bait out from flats and estuaries into ambush lanes.',
          intensity: (isMorning || isEvening || tideName === 'Spring Tide' || tideName === '大潮') ? 'highest' : 'high',
        });
      }
    }
  }

  if (primeTimes.length === 0) {
    primeTimes.push({
      name: 'Dawn Twilight Prime Window',
      nameEn: 'Dawn Twilight Prime Window',
      startTime: '05:30',
      endTime: '07:30',
      description: 'Light transition triggers plankton and baitfish movement, sparking predator strikes.',
      descriptionEn: 'Light transition triggers plankton and baitfish movement, sparking predator strikes.',
      intensity: 'highest',
    });
    primeTimes.push({
      name: 'Dusk Twilight Prime Window',
      nameEn: 'Dusk Twilight Prime Window',
      startTime: '16:45',
      endTime: '18:45',
      description: 'Falling light lowers predator caution as gamefish push shallow to feed.',
      descriptionEn: 'Falling light lowers predator caution as gamefish push shallow to feed.',
      intensity: 'highest',
    });
  }

  return {
    date: dateStr,
    tideName,
    moonAge,
    moonDescription,
    highTides,
    lowTides,
    events: allEvents,
    hourlyCurve: curveSamples,
    currentTideLevelCm,
    currentTideState,
    currentFlowDirection,
    currentFlowDescription,
    currentFlowDescriptionEn,
    primeTimes,
    tideType: regime.type,
    dataSource: 'harmonic',
  };
}

/**
 * Fetch live wave & marine conditions using Open-Meteo Marine API
 */
export async function fetchLiveMarineConditions(lat: number, lng: number): Promise<LiveMarineData | null> {
  try {
    const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height,wave_direction,wave_period,wind_wave_height,swell_wave_height&timezone=auto`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.current) {
      const wh = data.current.wave_height ?? 0;
      let seaConditionDescription = 'Calm / Flat Sea (optimal visibility)';
      let seaConditionDescriptionEn = 'Calm / Flat Sea (optimal visibility)';

      if (wh > 2.0) {
        seaConditionDescription = 'Rough Sea / High Swell Warning (avoid dangerous conditions)';
        seaConditionDescriptionEn = 'Rough Sea / High Swell Warning (avoid dangerous conditions)';
      } else if (wh > 1.2) {
        seaConditionDescription = 'Moderate Chop / Swell Alert (watch footing on rocks)';
        seaConditionDescriptionEn = 'Moderate Chop / Swell Alert (watch footing on rocks)';
      } else if (wh > 0.5) {
        seaConditionDescription = 'Gentle Waves / Good Activity (favorable bait movement)';
        seaConditionDescriptionEn = 'Gentle Waves / Good Activity (favorable bait movement)';
      }

      return {
        waveHeightM: data.current.wave_height,
        wavePeriodS: data.current.wave_period,
        waveDirectionDeg: data.current.wave_direction,
        windWaveHeightM: data.current.wind_wave_height,
        swellWaveHeightM: data.current.swell_wave_height,
        isSea: true,
        dataSource: 'open-meteo',
        seaConditionDescription,
        seaConditionDescriptionEn,
      };
    }
  } catch (err) {
    // Non-oceanic coordinates or offline
  }
  return null;
}

/**
 * Fetch official station tide from NOAA CO-OPS for US coordinates
 */
async function fetchNOAATide(stationId: string, targetDate: Date): Promise<{
  events: TideEvent[];
  highTides: TideEvent[];
  lowTides: TideEvent[];
  curvePoints: { time: string; hour: number; minute: number; heightCm: number; state: TideState }[];
} | null> {
  try {
    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    const d = String(targetDate.getDate()).padStart(2, '0');
    const dateQuery = `${y}${m}${d}`;

    const hiloUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?begin_date=${dateQuery}&end_date=${dateQuery}&station=${stationId}&product=predictions&datum=MLLW&time_zone=lst_ldt&interval=hilo&units=metric&format=json`;
    const hiloRes = await fetch(hiloUrl, { signal: AbortSignal.timeout(5000) });
    if (!hiloRes.ok) return null;
    const hiloData = await hiloRes.json();
    if (!hiloData.predictions || hiloData.predictions.length === 0) return null;

    const highTides: TideEvent[] = [];
    const lowTides: TideEvent[] = [];
    const allEvents: TideEvent[] = [];

    hiloData.predictions.forEach((item: { t: string; v: string; type: string }) => {
      const timeStr = item.t.split(' ')[1] || item.t;
      const heightCm = Math.round(parseFloat(item.v) * 100);
      const isHigh = item.type === 'H';
      const event: TideEvent = {
        time: timeStr.substring(0, 5),
        heightCm,
        type: isHigh ? 'high' : 'low',
      };
      allEvents.push(event);
      if (isHigh) highTides.push(event);
      else lowTides.push(event);
    });

    // Also fetch 6-min curve points
    const curveUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?begin_date=${dateQuery}&end_date=${dateQuery}&station=${stationId}&product=predictions&datum=MLLW&time_zone=lst_ldt&units=metric&format=json`;
    const curveRes = await fetch(curveUrl, { signal: AbortSignal.timeout(6000) });
    let curvePoints: { time: string; hour: number; minute: number; heightCm: number; state: TideState }[] = [];

    if (curveRes.ok) {
      const curveData = await curveRes.json();
      if (curveData.predictions && curveData.predictions.length > 0) {
        curvePoints = curveData.predictions.map((p: { t: string; v: string }) => {
          const tPart = p.t.split(' ')[1] || p.t;
          const [h, min] = tPart.split(':').map(Number);
          return {
            time: `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
            hour: h,
            minute: min,
            heightCm: Math.round(parseFloat(p.v) * 100),
            state: 'Other' as TideState,
          };
        });
      }
    }

    return {
      events: allEvents,
      highTides,
      lowTides,
      curvePoints,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Fetch Global Marine & Enhanced Tide Data combining Open-Meteo & NOAA with harmonic fallback
 */
export async function fetchGlobalMarineAndTide(
  lat: number,
  lng: number,
  targetDate: Date = new Date()
): Promise<TideDayData> {
  const baseTide = calculateDayTideData(targetDate, lng, lat);

  try {
    const nearestNOAA = findNearestNOAAStation(lat, lng);
    const marinePromise = fetchLiveMarineConditions(lat, lng);
    const noaaPromise = nearestNOAA ? fetchNOAATide(nearestNOAA.id, targetDate) : Promise.resolve(null);

    const [marineData, noaaTide] = await Promise.all([marinePromise, noaaPromise]);

    if (marineData) {
      baseTide.marine = marineData;
    }

    if (noaaTide && noaaTide.events.length > 0 && nearestNOAA) {
      baseTide.highTides = noaaTide.highTides;
      baseTide.lowTides = noaaTide.lowTides;
      baseTide.events = noaaTide.events;
      if (noaaTide.curvePoints.length > 0) {
        baseTide.hourlyCurve = noaaTide.curvePoints;
      }
      baseTide.dataSource = 'noaa';
      baseTide.stationName = `${nearestNOAA.name} (${nearestNOAA.state})`;
      if (baseTide.marine) {
        baseTide.marine.dataSource = 'noaa';
        baseTide.marine.stationName = baseTide.stationName;
      }
    } else if (marineData) {
      baseTide.dataSource = 'open-meteo';
    }

    return baseTide;
  } catch (err) {
    return baseTide;
  }
}

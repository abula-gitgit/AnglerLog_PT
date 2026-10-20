import { CatchLog, FishingSpot, WeatherData, TideName, TideState } from '../types/fishing';
import { calculateDayTideData } from './tideService';

export interface TimeSlotStat {
  slot: string; // 'Dawn Twilight (04:00 - 07:59)' etc.
  count: number;
  percentage: number;
}

export interface TidePhaseStat {
  phase: string; // 'Falling / Ebb Tide', 'Rising / Flood Tide', 'Slack Water / High-Low Turn'
  count: number;
  percentage: number;
}

export interface LureRankingItem {
  name: string;
  count: number;
  speciesList: string[];
  maxSizeCm: number;
}

export interface RecommendedTimeWindow {
  title: string;
  time: string;
  startTime: string;
  endTime: string;
  intensity: 'highest' | 'high' | 'medium';
  reason: string;
}

export interface HitPatternPredictionResult {
  totalCatchesAnalyzed: number;
  spotName?: string;
  todayScore: number; // 0 - 100
  scoreGrade: 'S' | 'A' | 'B' | 'C';
  headline: string;
  summary: string;
  todayTideName: TideName;
  todayMoonAge: number;
  currentFlowDescription: string;
  bestTimeSlots: TimeSlotStat[];
  tidePhaseStats: TidePhaseStat[];
  tideNameStats: { tideName: TideName; count: number; percentage: number }[];
  windDirectionStats: { direction: string; count: number }[];
  topLures: LureRankingItem[];
  tacticalAdvices: { category: string; text: string }[];
  recommendedTimeWindows: RecommendedTimeWindow[];
}

export function analyzeHitPatternAndPredict(
  allCatches: CatchLog[],
  targetSpot?: FishingSpot,
  targetDate: Date = new Date(),
  _currentWeather?: WeatherData
): HitPatternPredictionResult {
  // Filter catches for specific spot if requested and has at least 2 catches; otherwise analyze all catches for broader learning
  let relevantCatches = allCatches.filter((c) => !c.isNoCatch && c.species !== 'No Catch Logged' && c.species !== '釣果なし');
  let isSpotSpecific = false;

  if (targetSpot) {
    const spotCatches = relevantCatches.filter((c) => c.spotId === targetSpot.id);
    if (spotCatches.length >= 2) {
      relevantCatches = spotCatches;
      isSpotSpecific = true;
    }
  }

  const total = relevantCatches.length;

  // 1. Time of Day slots
  const slotCounts: Record<string, number> = {
    'Dawn Twilight (04:00 - 07:59)': 0,
    'Daytime (08:00 - 15:59)': 0,
    'Dusk Twilight (16:00 - 19:59)': 0,
    'Night (20:00 - 03:59)': 0,
  };

  relevantCatches.forEach((c) => {
    if (!c.time) return;
    const hour = parseInt(c.time.split(':')[0], 10);
    if (hour >= 4 && hour < 8) slotCounts['Dawn Twilight (04:00 - 07:59)']++;
    else if (hour >= 8 && hour < 16) slotCounts['Daytime (08:00 - 15:59)']++;
    else if (hour >= 16 && hour < 20) slotCounts['Dusk Twilight (16:00 - 19:59)']++;
    else slotCounts['Night (20:00 - 03:59)']++;
  });

  const bestTimeSlots: TimeSlotStat[] = Object.entries(slotCounts).map(([slot, count]) => ({
    slot,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));

  // 2. Tide Phase Analysis
  const phaseCounts: Record<string, number> = {
    'Falling / Ebb Tide': 0,
    'Rising / Flood Tide': 0,
    'Slack Water / Turn of Tide': 0,
  };

  relevantCatches.forEach((c) => {
    const state = c.weather?.tideState;
    if (state === 'Falling (Early)' || state === 'Falling (Late)' || state === '下げ3分' || state === '下げ7分') {
      phaseCounts['Falling / Ebb Tide']++;
    } else if (state === 'Rising (Early)' || state === 'Rising (Late)' || state === '上げ3分' || state === '上げ7分') {
      phaseCounts['Rising / Flood Tide']++;
    } else {
      phaseCounts['Slack Water / Turn of Tide']++;
    }
  });

  const tidePhaseStats: TidePhaseStat[] = Object.entries(phaseCounts).map(([phase, count]) => ({
    phase,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));

  // 3. Tide Name Analysis
  const tideNameCounts: Record<string, number> = {
    'Spring Tide': 0,
    'Mid Tide': 0,
    'Neap Tide': 0,
    'Transition Tide': 0,
  };

  relevantCatches.forEach((c) => {
    const tName = c.weather?.tideName;
    if (!tName) return;
    if (tName === 'Spring Tide' || tName === '大潮') {
      tideNameCounts['Spring Tide']++;
    } else if (tName === 'Mid Tide' || tName === '中潮') {
      tideNameCounts['Mid Tide']++;
    } else if (tName === 'Neap Tide' || tName === '小潮') {
      tideNameCounts['Neap Tide']++;
    } else {
      tideNameCounts['Transition Tide']++;
    }
  });

  const tideNameStats = (['Spring Tide', 'Mid Tide', 'Neap Tide', 'Transition Tide'] as TideName[]).map((tideName) => ({
    tideName,
    count: tideNameCounts[tideName] || 0,
    percentage: total > 0 ? Math.round(((tideNameCounts[tideName] || 0) / total) * 100) : 0,
  }));

  // 4. Wind Direction Stats
  const windCounts: Record<string, number> = {};
  relevantCatches.forEach((c) => {
    const wd = c.weather?.windDirection;
    if (wd) {
      windCounts[wd] = (windCounts[wd] || 0) + 1;
    }
  });

  const windDirectionStats = Object.entries(windCounts)
    .map(([direction, count]) => ({ direction, count }))
    .sort((a, b) => b.count - a.count);

  // 5. Top Lures / Baits
  const lureMap = new Map<string, { count: number; species: Set<string>; maxSize: number }>();
  relevantCatches.forEach((c) => {
    const lure = c.lureOrBait?.trim();
    if (!lure) return;
    const existing = lureMap.get(lure) || { count: 0, species: new Set<string>(), maxSize: 0 };
    existing.count += c.quantity || 1;
    if (c.species) existing.species.add(c.species);
    if (c.sizeCm && c.sizeCm > existing.maxSize) existing.maxSize = c.sizeCm;
    lureMap.set(lure, existing);
  });

  const topLures: LureRankingItem[] = Array.from(lureMap.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      speciesList: Array.from(data.species),
      maxSizeCm: data.maxSize,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 6. Today's Prime Time Scoring & Advice Generation
  const dayTide = calculateDayTideData(targetDate, targetSpot?.lng || -80.6278, targetSpot?.lat || 24.9242);
  let score = 55; // base score

  // Score boost from today's tide
  if (dayTide.tideName === 'Spring Tide' || dayTide.tideName === '大潮') score += 18;
  else if (dayTide.tideName === 'Mid Tide' || dayTide.tideName === '中潮') score += 14;
  else if (dayTide.tideName === 'Neap Tide' || dayTide.tideName === '小潮') score += 5;
  else score += 8;

  // Score boost from current flow direction matching past hits
  const mostSuccessfulPhase = tidePhaseStats.sort((a, b) => b.count - a.count)[0];
  if (mostSuccessfulPhase) {
    if (
      (dayTide.currentFlowDirection === 'falling' && mostSuccessfulPhase.phase.includes('Falling')) ||
      (dayTide.currentFlowDirection === 'rising' && mostSuccessfulPhase.phase.includes('Rising'))
    ) {
      score += 15;
    }
  }

  // Current hour overlap with best slot
  const currentHour = targetDate.getHours();
  const isTwilightNow = (currentHour >= 4 && currentHour <= 7) || (currentHour >= 16 && currentHour <= 19);
  if (isTwilightNow) score += 15;

  score = Math.min(98, Math.max(30, score));

  let scoreGrade: 'S' | 'A' | 'B' | 'C' = 'B';
  if (score >= 85) scoreGrade = 'S';
  else if (score >= 70) scoreGrade = 'A';
  else if (score >= 50) scoreGrade = 'B';
  else scoreGrade = 'C';

  // Construct tactical advices
  const tacticalAdvices: { category: string; text: string }[] = [];

  if (topLures.length > 0) {
    tacticalAdvices.push({
      category: 'Lure Selection',
      text: `Top Performer: "${topLures[0].name}" (recorded up to ${topLures[0].maxSizeCm || '-'} cm) is recommended as the prime search bait.`,
    });
  }

  const bestSlot = bestTimeSlots.sort((a, b) => b.count - a.count)[0];
  if (bestSlot && bestSlot.count > 0) {
    tacticalAdvices.push({
      category: 'Prime Window',
      text: `Peak Timing: ${bestSlot.slot} generated the highest bite volume (${bestSlot.percentage}% of catches). Target this window with focused casts.`,
    });
  }

  if (mostSuccessfulPhase && mostSuccessfulPhase.count > 0) {
    tacticalAdvices.push({
      category: 'Tidal Pattern',
      text: `Tidal Trend: ${mostSuccessfulPhase.phase} produced the strongest bite concentration (${mostSuccessfulPhase.percentage}%). Focus on peak moving water.`,
    });
  }

  if (windDirectionStats.length > 0) {
    tacticalAdvices.push({
      category: 'Wind & Positioning',
      text: `Wind Pattern: Historical catches peaked during a ${windDirectionStats[0].direction} wind. Position your drift or cast with current and wind lines.`,
    });
  }

  if (targetSpot?.currentNotes) {
    tacticalAdvices.push({
      category: 'Spot Strategy',
      text: `Spot Characteristics: ${targetSpot.currentNotes}`,
    });
  }

  // Fallback defaults if few catches
  if (tacticalAdvices.length === 0) {
    tacticalAdvices.push({
      category: 'Core Strategy',
      text: `Focus high-percentage efforts during low-light twilight windows and the active 2-hour flow swings before and after tide slack.`,
    });
    tacticalAdvices.push({
      category: 'Pilot Lure Choice',
      text: `Begin with versatile subsurface search baits covering mid-depth water columns, adjusting lure weight and cadence to match current speed.`,
    });
    tacticalAdvices.push({
      category: 'Data Logging',
      text: `Keep logging catch times, tidal phases, and water temperatures to continuously calibrate AI pattern predictions!`,
    });
  }

  // Best recommended windows today
  const recommendedTimeWindows: RecommendedTimeWindow[] = dayTide.primeTimes.map((pt) => ({
    title: pt.name,
    time: `${pt.startTime} - ${pt.endTime}`,
    startTime: pt.startTime,
    endTime: pt.endTime,
    intensity: pt.intensity,
    reason: pt.description,
  }));

  // Headline
  let headline = '';
  if (scoreGrade === 'S') {
    headline = `🎯 Prime Solunar Bite (${score}% · Rank S): Tidal phase (${dayTide.tideName}) and current flow match your highest-yielding historical patterns!`;
  } else if (scoreGrade === 'A') {
    headline = `✨ Highly Favorable (${score}% · Rank A): Strong water movement and favorable feeding conditions expect solid activity.`;
  } else if (scoreGrade === 'B') {
    headline = `🎣 Good Potential (${score}% · Rank B): Work structure transitions, weed edges, and early current changes thoroughly.`;
  } else {
    headline = `💡 Technical Approach (${score}% · Rank C): Tidal flow is sluggish; slow presentations, finesse rigs, and deep structure will trigger strikes.`;
  }

  const summary = isSpotSpecific
    ? `Analyzing ${total} historical catch records for "${targetSpot?.name}"`
    : `Analyzing ${total} journal catch records across all fishing spots`;

  return {
    totalCatchesAnalyzed: total,
    spotName: targetSpot?.name,
    todayScore: score,
    scoreGrade,
    headline,
    summary,
    todayTideName: dayTide.tideName,
    todayMoonAge: Math.round(dayTide.moonAge * 10) / 10,
    currentFlowDescription: dayTide.currentFlowDescription,
    bestTimeSlots,
    tidePhaseStats,
    tideNameStats,
    windDirectionStats,
    topLures,
    tacticalAdvices,
    recommendedTimeWindows,
  };
}

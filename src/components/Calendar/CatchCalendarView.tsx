import React, { useState, useMemo } from 'react';
import { FishingSpot, CatchLog } from '../../types/fishing';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Fish, Trophy, 
  MapPin, Plus, Award, Compass, Edit, Eye, Sparkles
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { formatTideName, formatTideState, formatSpeciesName, formatSpotName } from '../../utils/formatI18n';

interface CatchCalendarViewProps {
  spots: FishingSpot[];
  catches: CatchLog[];
  onSelectCatch: (catchLog: CatchLog) => void;
  onSelectSpot: (spot: FishingSpot) => void;
  onAddCatch: (spot?: FishingSpot, prefill?: Partial<CatchLog>) => void;
  onEditCatch: (catchLog: CatchLog) => void;
}

interface MonthBiggestCatch {
  species: string;
  sizeCm: number;
  date: string;
  spotName: string;
}

interface CalendarDayCell {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSunday: boolean;
  isSaturday: boolean;
}

const WEEKDAYS = [
  { label: 'Sun', full: 'Sunday', color: 'text-rose-400' },
  { label: 'Mon', full: 'Monday', color: 'text-slate-300' },
  { label: 'Tue', full: 'Tuesday', color: 'text-slate-300' },
  { label: 'Wed', full: 'Wednesday', color: 'text-slate-300' },
  { label: 'Thu', full: 'Thursday', color: 'text-slate-300' },
  { label: 'Fri', full: 'Friday', color: 'text-slate-300' },
  { label: 'Sat', full: 'Saturday', color: 'text-sky-400' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Helper to identify empty / no-catch logs
const isNoCatchEntry = (c: CatchLog): boolean => {
  return !!c.isNoCatch || !c.species || c.species === 'No Catch Logged' || c.species === '釣果なし' || c.species.toLowerCase().includes('skunk');
};

export const CatchCalendarView: React.FC<CatchCalendarViewProps> = ({
  spots,
  catches,
  onSelectCatch,
  onSelectSpot,
  onAddCatch,
  onEditCatch,
}) => {
  const { formatLength, formatWeight, formatWind, formatTemp } = useLanguage();

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  // Current viewed month state
  const [currentYear, setCurrentYear] = useState<number>(() => {
    if (catches.length > 0) {
      const dates = catches.map((c) => c.date).filter(Boolean).sort().reverse();
      if (dates[0]) {
        const parts = dates[0].split('-');
        if (parts[0]) return parseInt(parts[0], 10);
      }
    }
    return today.getFullYear();
  });

  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    if (catches.length > 0) {
      const dates = catches.map((c) => c.date).filter(Boolean).sort().reverse();
      if (dates[0]) {
        const parts = dates[0].split('-');
        if (parts[1]) return parseInt(parts[1], 10) - 1;
      }
    }
    return today.getMonth();
  });

  // Selected date for day inspector panel
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    if (catches.length > 0) {
      const dates = catches.map((c) => c.date).filter(Boolean).sort().reverse();
      if (dates[0]) return dates[0];
    }
    return todayStr;
  });

  // Filters for Calendar
  const [spotFilter, setSpotFilter] = useState<string>('all');
  const [speciesFilter, setSpeciesFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'caught' | 'nocatch'>('all');

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDateStr(todayStr);
  };

  // Spot lookup map
  const spotMap = useMemo(() => {
    const map = new Map<string, FishingSpot>();
    spots.forEach((s) => map.set(s.id, s));
    return map;
  }, [spots]);

  // Spots sorted by alphabetical order for filter dropdown
  const sortedSpots = useMemo(() => {
    return [...spots].sort((a, b) => a.name.localeCompare(b.name));
  }, [spots]);

  // All unique species across all catches
  const allSpeciesList = useMemo(() => {
    const set = new Set<string>();
    catches.forEach((c) => {
      if (isNoCatchEntry(c)) return;
      if (c.items && c.items.length > 0) {
        c.items.forEach((item) => {
          if (item.species.trim()) set.add(item.species.trim());
        });
      } else if (c.species) {
        c.species.split(/[,&/]/).forEach((s) => {
          const trimmed = s.trim();
          if (trimmed && trimmed !== 'No Catch Logged') set.add(trimmed);
        });
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [catches]);

  // Calculate All-Time Personal Best (PB) size per species
  const allTimePbMap = useMemo(() => {
    const map = new Map<string, number>();
    catches.forEach((c) => {
      if (c.isNoCatch || c.species === 'No Catch Logged' || c.species === '釣果なし') return;
      if (c.items && c.items.length > 0) {
        c.items.forEach((item) => {
          if (item.species && item.sizeCm) {
            const current = map.get(item.species) || 0;
            if (item.sizeCm > current) map.set(item.species, item.sizeCm);
          }
        });
      } else if (c.species && c.sizeCm) {
        const current = map.get(c.species) || 0;
        if (c.sizeCm > current) map.set(c.species, c.sizeCm);
      }
    });
    return map;
  }, [catches]);

  // Helper to test if a catch log contains an all-time personal best record
  const checkCatchHasPb = (catchLog: CatchLog): { hasPb: boolean; pbSpecies?: string; pbSize?: number } => {
    if (catchLog.isNoCatch || catchLog.species === 'No Catch Logged' || catchLog.species === '釣果なし') return { hasPb: false };

    if (catchLog.items && catchLog.items.length > 0) {
      for (const item of catchLog.items) {
        if (item.species && item.sizeCm && item.sizeCm > 0) {
          const pb = allTimePbMap.get(item.species);
          if (pb && item.sizeCm >= pb) {
            return { hasPb: true, pbSpecies: item.species, pbSize: item.sizeCm };
          }
        }
      }
    } else if (catchLog.species && catchLog.sizeCm && catchLog.sizeCm > 0) {
      const pb = allTimePbMap.get(catchLog.species);
      if (pb && catchLog.sizeCm >= pb) {
        return { hasPb: true, pbSpecies: catchLog.species, pbSize: catchLog.sizeCm };
      }
    }
    return { hasPb: false };
  };

  // Helper to extract maximum size in a catch log
  const getCatchMaxSize = (catchLog: CatchLog): number => {
    if (catchLog.isNoCatch || catchLog.species === 'No Catch Logged' || catchLog.species === '釣果なし') return 0;
    if (catchLog.items && catchLog.items.length > 0) {
      return Math.max(...catchLog.items.map((i) => i.sizeCm || 0), 0);
    }
    return catchLog.sizeCm || 0;
  };

  // Filtered catches based on filter bar
  const filteredCatches = useMemo(() => {
    return catches.filter((c) => {
      // Spot filter
      if (spotFilter !== 'all' && c.spotId !== spotFilter) {
        return false;
      }

      // Type filter
      const isNoCatch = c.isNoCatch || c.species === 'No Catch Logged' || c.species === '釣果なし';
      if (typeFilter === 'caught' && isNoCatch) return false;
      if (typeFilter === 'nocatch' && !isNoCatch) return false;

      // Species filter
      if (speciesFilter !== 'all') {
        if (isNoCatch) return false;
        if (c.items && c.items.length > 0) {
          const hasSpecies = c.items.some((item) => item.species === speciesFilter);
          if (!hasSpecies) return false;
        } else if (!c.species.includes(speciesFilter)) {
          return false;
        }
      }

      return true;
    });
  }, [catches, spotFilter, speciesFilter, typeFilter]);

  // Group catches by dateString (YYYY-MM-DD)
  const catchesByDate = useMemo(() => {
    const map = new Map<string, CatchLog[]>();
    filteredCatches.forEach((c) => {
      if (!c.date) return;
      const list = map.get(c.date) || [];
      list.push(c);
      map.set(c.date, list);
    });
    return map;
  }, [filteredCatches]);

  // Map of planned fishing trips (spots with planDate)
  const plansByDate = useMemo(() => {
    const map = new Map<string, FishingSpot[]>();
    spots.forEach((s) => {
      if (s.planDate) {
        const list = map.get(s.planDate) || [];
        list.push(s);
        map.set(s.planDate, list);
      }
    });
    return map;
  }, [spots]);

  // Month-specific catches (regardless of filter for overall month stats)
  const currentMonthCatches = useMemo(() => {
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    return catches.filter((c) => c.date && c.date.startsWith(prefix));
  }, [catches, currentYear, currentMonth]);

  // Month Statistics
  const monthStats = useMemo<{
    uniqueDays: number;
    totalOutings: number;
    caughtOutings: number;
    noCatchOutings: number;
    totalFish: number;
    biggestCatch: MonthBiggestCatch | null;
    pbCount: number;
  }>(() => {
    const totalOutings = currentMonthCatches.length;
    const noCatchOutings = currentMonthCatches.filter((c) => c.isNoCatch || c.species === 'No Catch Logged' || c.species === '釣果なし').length;
    const caughtOutings = totalOutings - noCatchOutings;
    const totalFish = currentMonthCatches.reduce((acc, c) => acc + (c.isNoCatch ? 0 : (c.quantity || 1)), 0);

    // Unique days fished
    const uniqueDays = new Set(currentMonthCatches.map((c) => c.date)).size;

    // Month's biggest fish
    let biggestCatch: MonthBiggestCatch | null = null;
    let pbCount = 0;

    currentMonthCatches.forEach((c) => {
      const pbCheck = checkCatchHasPb(c);
      if (pbCheck.hasPb) pbCount++;

      if (c.items && c.items.length > 0) {
        c.items.forEach((item) => {
          if (item.species && item.sizeCm) {
            const currentMax = biggestCatch ? biggestCatch.sizeCm : 0;
            if (!biggestCatch || item.sizeCm > currentMax) {
              biggestCatch = {
                species: item.species,
                sizeCm: item.sizeCm,
                date: c.date,
                spotName: c.spotName
              };
            }
          }
        });
      } else if (c.species && c.sizeCm) {
        const currentMax = biggestCatch ? biggestCatch.sizeCm : 0;
        if (!biggestCatch || c.sizeCm > currentMax) {
          biggestCatch = {
            species: c.species,
            sizeCm: c.sizeCm,
            date: c.date,
            spotName: c.spotName
          };
        }
      }
    });

    return {
      uniqueDays,
      totalOutings,
      caughtOutings,
      noCatchOutings,
      totalFish,
      biggestCatch,
      pbCount
    };
  }, [currentMonthCatches, allTimePbMap]);

  // Top catches of the month (ranking)
  const monthlyHighlights = useMemo(() => {
    interface HighlightItem {
      id: string;
      species: string;
      sizeCm: number;
      weightGrams?: number;
      date: string;
      time: string;
      spotName: string;
      lureOrBait: string;
      isPb: boolean;
      catchLog: CatchLog;
    }

    const items: HighlightItem[] = [];

    currentMonthCatches.forEach((c) => {
      if (c.isNoCatch || c.species === 'No Catch Logged' || c.species === '釣果なし') return;

      if (c.items && c.items.length > 0) {
        c.items.forEach((item) => {
          if (item.species && item.sizeCm && item.sizeCm > 0) {
            const pb = allTimePbMap.get(item.species);
            const isPb = !!pb && item.sizeCm >= pb;
            items.push({
              id: `${c.id}-${item.id}`,
              species: item.species,
              sizeCm: item.sizeCm,
              weightGrams: item.weightGrams,
              date: c.date,
              time: c.time,
              spotName: c.spotName,
              lureOrBait: item.lureOrBait || c.lureOrBait || 'Unspecified',
              isPb,
              catchLog: c
            });
          }
        });
      } else if (c.species && c.sizeCm && c.sizeCm > 0) {
        const pb = allTimePbMap.get(c.species);
        const isPb = !!pb && c.sizeCm >= pb;
        items.push({
          id: c.id,
          species: c.species,
          sizeCm: c.sizeCm,
          weightGrams: c.weightGrams,
          date: c.date,
          time: c.time,
          spotName: c.spotName,
          lureOrBait: c.lureOrBait || 'Unspecified',
          isPb,
          catchLog: c
        });
      }
    });

    return items.sort((a, b) => b.sizeCm - a.sizeCm).slice(0, 5);
  }, [currentMonthCatches, allTimePbMap]);

  // Generate Calendar Matrix Cells (Sunday to Saturday)
  const calendarCells = useMemo<CalendarDayCell[]>(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const firstDayWeekday = firstDayOfMonth.getDay(); // 0 is Sunday
    const daysInMonth = lastDayOfMonth.getDate();

    const cells: CalendarDayCell[] = [];

    // 1. Days from previous month to fill the first row
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevDate = new Date(currentYear, currentMonth - 1, dayNum);
      const y = prevDate.getFullYear();
      const m = String(prevDate.getMonth() + 1).padStart(2, '0');
      const d = String(dayNum).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      cells.push({
        date: prevDate,
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSunday: prevDate.getDay() === 0,
        isSaturday: prevDate.getDay() === 6
      });
    }

    // 2. Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(currentYear, currentMonth, d);
      const mStr = String(currentMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateStr = `${currentYear}-${mStr}-${dStr}`;

      cells.push({
        date: curDate,
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSunday: curDate.getDay() === 0,
        isSaturday: curDate.getDay() === 6
      });
    }

    // 3. Days from next month to complete matrix (total rows: 5 or 6, cell count multiple of 7)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let nextDay = 1; nextDay <= remaining; nextDay++) {
      const nextDate = new Date(currentYear, currentMonth + 1, nextDay);
      const y = nextDate.getFullYear();
      const m = String(nextDate.getMonth() + 1).padStart(2, '0');
      const d = String(nextDay).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      cells.push({
        date: nextDate,
        dateStr,
        dayNumber: nextDay,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSunday: nextDate.getDay() === 0,
        isSaturday: nextDate.getDay() === 6
      });
    }

    return cells;
  }, [currentYear, currentMonth, todayStr]);

  // Selected date catches
  const selectedCatches = useMemo(() => {
    return catchesByDate.get(selectedDateStr) || [];
  }, [catchesByDate, selectedDateStr]);

  // Selected date plans
  const selectedPlans = useMemo(() => {
    return plansByDate.get(selectedDateStr) || [];
  }, [plansByDate, selectedDateStr]);

  // Selected date formatted in English
  const selectedDateFormatted = useMemo(() => {
    if (!selectedDateStr) return '';
    const parts = selectedDateStr.split('-');
    if (parts.length < 3) return selectedDateStr;
    const y = parts[0];
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const dayOfWeekIdx = new Date(parseInt(y, 10), m - 1, d).getDay();
    const dayName = WEEKDAYS[dayOfWeekIdx]?.full || '';
    const monthName = MONTH_NAMES[m - 1] || '';
    return `${dayName}, ${monthName} ${d}, ${y}`;
  }, [selectedDateStr]);

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-y-auto">
      {/* Top Header / Control Bar */}
      <div className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 py-3 sm:px-6 sticky top-0 z-30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Month Title & Navigation */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1 shadow-inner">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 py-1 text-center min-w-[150px]">
                <span className="font-bold text-base text-white tracking-wide">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </span>
              </div>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleGoToday}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              This Month
            </button>

            <span className="hidden sm:inline-block text-xs text-slate-400">
              Catch Calendar Journal
            </span>
          </div>

          {/* Filter Bar & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Spot Filter */}
            <select
              value={spotFilter}
              onChange={(e) => setSpotFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-sky-500 max-w-[150px] truncate cursor-pointer"
            >
              <option value="all">All Spots</option>
              {sortedSpots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Species Filter */}
            <select
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-sky-500 max-w-[130px] truncate cursor-pointer"
            >
              <option value="all">All Species</option>
              {allSpeciesList.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </select>

            {/* Mode Filter */}
            <div className="flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-xl text-xs">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  typeFilter === 'all' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTypeFilter('caught')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  typeFilter === 'caught' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Catches
              </button>
              <button
                onClick={() => setTypeFilter('nocatch')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  typeFilter === 'nocatch' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Skunked
              </button>
            </div>

            {/* CTA Add Catch for selected date */}
            <button
              onClick={() => onAddCatch(undefined, { date: selectedDateStr || todayStr })}
              className="flex items-center gap-1 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-950 transition-all whitespace-nowrap ml-auto shrink-0 cursor-pointer"
              title="Log a catch"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Log Catch</span>
            </button>
          </div>
        </div>

        {/* Monthly Summary Statistics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl px-3 py-2 flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-slate-400 truncate">Days Fished</div>
              <div className="text-sm font-bold text-white font-mono flex items-center gap-1.5 whitespace-nowrap truncate">
                <span>{monthStats.uniqueDays} days</span>
                <span className="text-[11px] font-normal text-slate-500 truncate">({monthStats.totalOutings} trips)</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl px-3 py-2 flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Fish className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-slate-400 truncate">Total Fish Landed</div>
              <div className="text-sm font-bold text-emerald-400 font-mono flex items-center gap-1.5 whitespace-nowrap truncate">
                <span>{monthStats.totalFish} fish</span>
                <span className="text-[11px] font-normal text-slate-500 truncate">
                  ({monthStats.caughtOutings} successful)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl px-3 py-2 flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-slate-400 truncate">Month Trophy Size</div>
              <div className="text-sm font-bold text-amber-300 font-mono truncate whitespace-nowrap">
                {monthStats.biggestCatch ? (
                  <span>
                    {monthStats.biggestCatch.species} · {formatLength(monthStats.biggestCatch.sizeCm)}
                  </span>
                ) : (
                  <span className="text-slate-500 text-xs font-normal">No records</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl px-3 py-2 flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-slate-400 truncate">Personal Records</div>
              <div className="text-sm font-bold text-purple-300 font-mono truncate whitespace-nowrap">
                {monthStats.pbCount > 0 ? (
                  <span>{monthStats.pbCount} PB Records!</span>
                ) : (
                  <span className="text-slate-500 text-xs font-normal">Standard catches</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Calendar on Left/Top + Day Inspector & Highlights on Right/Bottom */}
      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Calendar Grid (lg: 8 cols) */}
          <div className="lg:col-span-8 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950/70 text-center py-2.5 text-xs font-bold select-none">
              {WEEKDAYS.map((w, idx) => (
                <div key={idx} className={`${w.color}`}>
                  <span>{w.label}</span>
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 auto-rows-fr gap-px bg-slate-800/80">
              {calendarCells.map((cell) => {
                const dayCatches = catchesByDate.get(cell.dateStr) || [];
                const dayPlans = plansByDate.get(cell.dateStr) || [];
                const hasOuting = dayCatches.length > 0;
                const isSelected = cell.dateStr === selectedDateStr;

                // Day totals
                const dayFishCount = dayCatches.reduce(
                  (sum, c) => sum + (c.isNoCatch ? 0 : (c.quantity || 1)), 
                  0
                );
                const hasNoCatchOnly = hasOuting && dayCatches.every((c) => c.isNoCatch || c.species === 'No Catch Logged' || c.species === '釣果なし');

                // Check for Personal Best or Important Record on this day
                let dayPbInfo: { hasPb: boolean; pbSpecies?: string; pbSize?: number } = { hasPb: false };
                let maxFishOnDay = 0;
                let primarySpecies = '';

                dayCatches.forEach((c) => {
                  const pb = checkCatchHasPb(c);
                  if (pb.hasPb && !dayPbInfo.hasPb) {
                    dayPbInfo = pb;
                  }
                  const size = getCatchMaxSize(c);
                  if (size > maxFishOnDay) {
                    maxFishOnDay = size;
                    primarySpecies = c.items?.[0]?.species || c.species;
                  }
                });

                // Weather and tide snippet from latest catch on that day
                const latestCatch = dayCatches[0];
                const tideName = latestCatch?.weather?.tideName;

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    className={`min-h-[90px] sm:min-h-[105px] p-1 sm:p-2 text-left flex flex-col justify-between transition-all relative overflow-hidden cursor-pointer ${
                      cell.isCurrentMonth ? 'bg-slate-900' : 'bg-slate-950/40 text-slate-600'
                    } ${
                      isSelected
                        ? 'ring-2 ring-sky-500 bg-sky-950/30 z-10'
                        : 'hover:bg-slate-800/50'
                    } ${
                      hasOuting && !isSelected ? 'bg-slate-900/90' : ''
                    }`}
                  >
                    {/* Day Number Row */}
                    <div className="flex items-center justify-between w-full min-w-0">
                      <span
                        className={`text-xs font-mono font-bold inline-flex items-center justify-center rounded-md shrink-0 ${
                          cell.isToday
                            ? 'bg-sky-500 text-white w-5 h-5 shadow-sm'
                            : isSelected
                            ? 'text-sky-300 font-extrabold'
                            : cell.isSunday
                            ? 'text-rose-400'
                            : cell.isSaturday
                            ? 'text-sky-400'
                            : cell.isCurrentMonth
                            ? 'text-slate-300'
                            : 'text-slate-600'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {/* Tide micro-badge */}
                      {tideName && (
                        <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 bg-slate-950/70 px-1 py-0.2 rounded border border-slate-800 hidden sm:inline-block whitespace-nowrap shrink-0">
                          {formatTideName(tideName)}
                        </span>
                      )}
                    </div>

                    {/* Middle: Catch summaries / Important Record Badge */}
                    <div className="my-0.5 space-y-0.5 sm:space-y-1 w-full flex-1 flex flex-col justify-center min-w-0 overflow-hidden">
                      {hasOuting && (
                        <>
                          {/* 1. Important Record / PB Tag if exists */}
                          {dayPbInfo.hasPb ? (
                            <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 rounded px-1 py-0.2 sm:px-1.5 sm:py-0.5 text-[9px] sm:text-[10px] font-bold text-amber-300 shadow-xs whitespace-nowrap min-w-0 overflow-hidden">
                              <Trophy className="w-2.5 h-2.5 shrink-0 text-amber-400" />
                              <span className="truncate">PB {formatLength(dayPbInfo.pbSize)}</span>
                            </div>
                          ) : maxFishOnDay >= 50 ? (
                            <div className="flex items-center gap-1 bg-sky-500/10 border border-sky-500/30 rounded px-1 py-0.2 sm:px-1.5 sm:py-0.5 text-[9px] sm:text-[10px] font-bold text-sky-300 whitespace-nowrap min-w-0 overflow-hidden">
                              <Award className="w-2.5 h-2.5 shrink-0 text-sky-400" />
                              <span className="truncate">Trophy {formatLength(maxFishOnDay)}</span>
                            </div>
                          ) : null}

                          {/* 2. Catch Quantity & Species Tag */}
                          {hasNoCatchOnly ? (
                            <div className="bg-slate-800/80 border border-slate-700/80 text-slate-300 rounded px-1 py-0.2 sm:px-1.5 sm:py-0.5 text-[9px] sm:text-[10px] font-medium flex items-center justify-between whitespace-nowrap gap-1 min-w-0 overflow-hidden">
                              <span className="truncate">Skunked</span>
                              <span className="font-mono text-amber-400 text-[9px] shrink-0">0 fish</span>
                            </div>
                          ) : (
                            <div className="bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 rounded px-1 py-0.2 sm:px-1.5 sm:py-0.5 text-[9px] sm:text-[10px] font-semibold flex items-center justify-between shadow-xs whitespace-nowrap gap-1 min-w-0 overflow-hidden">
                              <span className="truncate min-w-0">
                                {primarySpecies || `${dayCatches.length} species`}
                              </span>
                              <span className="font-mono font-bold text-emerald-300 shrink-0 text-[9px] sm:text-[10px]">
                                {dayFishCount}
                              </span>
                            </div>
                          )}

                          {/* Multiple Outings Dot indicator */}
                          {dayCatches.length > 1 && (
                            <div className="text-[8px] sm:text-[9px] text-slate-400 text-right pr-0.5 whitespace-nowrap truncate leading-none">
                              +{dayCatches.length - 1} trips
                            </div>
                          )}
                        </>
                      )}

                      {/* Planned fishing trip on this day */}
                      {dayPlans.length > 0 && !hasOuting && (
                        <div className="bg-purple-950/60 border border-purple-800/70 text-purple-300 rounded px-1 py-0.2 sm:px-1.5 sm:py-0.5 text-[9px] sm:text-[10px] font-medium flex items-center gap-1 whitespace-nowrap min-w-0 overflow-hidden">
                          <Compass className="w-2.5 h-2.5 shrink-0 text-purple-400" />
                          <span className="truncate">Plan: {dayPlans[0].name}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom: Location snippet */}
                    {latestCatch ? (
                      <div className="text-[8px] sm:text-[9px] text-slate-400 truncate w-full flex items-center gap-0.5 min-w-0 leading-none">
                        <MapPin className="w-2.5 h-2.5 shrink-0 text-slate-500" />
                        <span className="truncate">{latestCatch.spotName}</span>
                      </div>
                    ) : (
                      <div className="h-2.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="font-medium text-slate-300">Legend:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Catches logged (fish count)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span>🏆 Personal Best / Trophy (PB)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                <span>Skunked / Scouting trip</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                <span>📅 Planned trip date</span>
              </div>
            </div>
          </div>

          {/* Right Column: Selected Day Inspector & Monthly Highlights (lg: 4 cols) */}
          <div className="lg:col-span-4 space-y-6 flex flex-col">
            
            {/* 1. Day Detail Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex-1 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <div className="text-xs text-sky-400 font-semibold flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>Selected Date</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {selectedDateFormatted}
                  </h3>
                </div>

                <button
                  onClick={() => onAddCatch(undefined, { date: selectedDateStr })}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-500/20 hover:bg-sky-500 text-sky-300 hover:text-white border border-sky-500/30 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  title="Log a catch for this date"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Catch</span>
                </button>
              </div>

              {/* Day Catches List */}
              <div className="mt-4 space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
                {selectedCatches.length > 0 ? (
                  selectedCatches.map((c) => {
                    const pbCheck = checkCatchHasPb(c);
                    const isNoCatch = c.isNoCatch || c.species === 'No Catch Logged' || c.species === '釣果なし';
                    const spot = spotMap.get(c.spotId);

                    return (
                      <div
                        key={c.id}
                        className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 space-y-2.5 transition-all"
                      >
                        {/* Spot & Time Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <button
                              type="button"
                              onClick={() => spot && onSelectSpot(spot)}
                              className="text-xs font-bold text-white hover:text-sky-400 flex items-center gap-1 text-left transition-colors cursor-pointer"
                            >
                              <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                              <span className="line-clamp-1">{formatSpotName(c.spotName)}</span>
                            </button>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {c.time || 'Time unspecified'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {isNoCatch ? (
                              <span className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md font-medium whitespace-nowrap">
                                Skunked (0 fish)
                              </span>
                            ) : (
                              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md whitespace-nowrap">
                                Total: {c.quantity} fish
                              </span>
                            )}
                          </div>
                        </div>

                        {/* PB Ribbon if achieved */}
                        {pbCheck.hasPb && (
                          <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/10 border border-amber-500/40 rounded-lg px-2.5 py-1 flex items-center gap-1.5 text-xs font-bold text-amber-300 whitespace-nowrap min-w-0 overflow-hidden">
                            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">Personal Best Record! ({formatSpeciesName(pbCheck.pbSpecies)} · {formatLength(pbCheck.pbSize)})</span>
                          </div>
                        )}

                        {/* Catch Species Breakdown */}
                        {!isNoCatch && (
                          <div className="space-y-1 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                            {c.items && c.items.length > 0 ? (
                              c.items.map((item, idx) => (
                                <div
                                  key={item.id || idx}
                                  className="flex items-center justify-between text-xs py-0.5 border-b border-slate-800/50 last:border-0"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <Fish className="w-3 h-3 text-sky-400 shrink-0" />
                                    <span className="font-semibold text-slate-200 truncate">
                                      {formatSpeciesName(item.species)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 font-mono text-slate-400 text-[11px] shrink-0 whitespace-nowrap">
                                    {item.sizeCm && (
                                      <span className="text-sky-300 font-bold">
                                        {formatLength(item.sizeCm)}
                                      </span>
                                    )}
                                    {item.weightGrams && (
                                      <span>{formatWeight(item.weightGrams)}</span>
                                    )}
                                    <span className="text-white font-bold">{item.quantity} fish</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-200 truncate">{formatSpeciesName(c.species)}</span>
                                <span className="font-mono text-sky-300 font-bold shrink-0 whitespace-nowrap ml-2">
                                  {c.sizeCm ? formatLength(c.sizeCm) : ''} ({c.quantity} fish)
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Weather & Tide quick snippet */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-mono">
                          {c.weather?.tideName && (
                            <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded whitespace-nowrap">
                              {formatTideName(c.weather.tideName)}
                              {c.weather.tideState ? ` (${formatTideState(c.weather.tideState)})` : ''}
                            </span>
                          )}
                          {c.weather?.temperature !== undefined && (
                            <span className="whitespace-nowrap">{formatTemp(c.weather.temperature)}</span>
                          )}
                          {c.weather?.windSpeedMs !== undefined && (
                            <span className="whitespace-nowrap">Wind {formatWind(c.weather.windSpeedMs)}</span>
                          )}
                          {c.lureOrBait && (
                            <span className="truncate max-w-[130px] whitespace-nowrap" title={c.lureOrBait}>
                              🎣 {c.lureOrBait}
                            </span>
                          )}
                        </div>

                        {/* Notes preview */}
                        {c.notes && (
                          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-900/40 p-2 rounded border border-slate-800/40">
                            {c.notes}
                          </p>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
                          <button
                            type="button"
                            onClick={() => onSelectCatch(c)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs text-sky-400 hover:text-sky-300 hover:bg-sky-950/40 rounded transition-colors whitespace-nowrap cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditCatch(c)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors whitespace-nowrap cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 px-4 border border-dashed border-slate-800 rounded-xl space-y-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500">
                      <Fish className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-slate-300">
                        No catch logs for this date
                      </div>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        Record your catches or scouting results to build your personalized fishing logbook.
                      </p>
                    </div>
                    <button
                      onClick={() => onAddCatch(undefined, { date: selectedDateStr })}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl shadow-md transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Log Catch for {selectedDateStr}</span>
                    </button>
                  </div>
                )}

                {/* Planned fishing trips list */}
                {selectedPlans.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                    <div className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-purple-400" />
                      <span>Planned Trips for this Date</span>
                    </div>
                    {selectedPlans.map((planSpot) => (
                      <div
                        key={planSpot.id}
                        className="bg-purple-950/30 border border-purple-800/40 rounded-xl p-3 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-white">
                            {planSpot.name}
                          </div>
                          {planSpot.planNotes && (
                            <div className="text-[11px] text-purple-200/80 mt-0.5 line-clamp-1">
                              {planSpot.planNotes}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectSpot(planSpot)}
                          className="px-2.5 py-1 text-xs bg-purple-500/20 hover:bg-purple-500 text-purple-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          View Spot
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Monthly Highlights & Top Catches Ranking */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">
                    {MONTH_NAMES[currentMonth]} Top Trophy Catches
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">By Size</span>
              </div>

              <div className="mt-3 space-y-2">
                {monthlyHighlights.length > 0 ? (
                  monthlyHighlights.map((hl, idx) => (
                    <div
                      key={hl.id}
                      onClick={() => onSelectCatch(hl.catchLog)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                            idx === 0
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : idx === 1
                              ? 'bg-slate-300/20 text-slate-200 border border-slate-300/40'
                              : idx === 2
                              ? 'bg-amber-700/20 text-amber-500 border border-amber-700/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs truncate">
                              {hl.species}
                            </span>
                            {hl.isPb && (
                              <span className="text-[9px] font-bold text-amber-400 bg-amber-500/20 px-1 py-0.2 rounded">
                                PB
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {hl.date} · {hl.spotName}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-mono font-bold text-sky-400">
                          {formatLength(hl.sizeCm)}
                        </div>
                        {hl.weightGrams && (
                          <div className="text-[10px] font-mono text-slate-400">
                            {formatWeight(hl.weightGrams)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No trophy catches recorded for this month yet
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

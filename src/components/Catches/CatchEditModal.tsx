import React, { useState, useEffect, useMemo } from 'react';
import { CatchLog, CatchFishItem, FishingSpot, WeatherData, WeatherCondition, TideName, TideState, WaveCondition, TackleSet } from '../../types/fishing';
import { saveCatch, getAllCatches, getAllTackles } from '../../services/db';
import { processAndAutoSavePhoto } from '../../services/photoStorage';
import { fetchCurrentWeather } from '../../services/weatherService';
import { TideGraph } from '../Tide/TideGraph';
import { useLanguage } from '../../i18n/LanguageContext';
import { 
  parseLengthToCm, 
  convertLengthFromCm, 
  parseWeightToGrams, 
  convertWeightFromGrams, 
  parseTemperatureToC, 
  convertTemperatureFromC, 
  parseWindSpeedToMs, 
  convertWindSpeedFromMs 
} from '../../utils/unitConversion';
import { formatTideName, formatTideState, formatWaveCondition } from '../../utils/formatI18n';
import { 
  X, Save, Fish, CloudSun, Wind, Waves, Camera, Plus, 
  Trash2, Compass, Sparkles, RefreshCw, Calendar, Clock, Ruler, AlertCircle, Briefcase, Check
} from 'lucide-react';

interface CatchEditModalProps {
  initialCatch?: Partial<CatchLog> | null;
  spots: FishingSpot[];
  catches?: CatchLog[];
  defaultSpotId?: string;
  onClose: () => void;
  onSaved: (catchLog: CatchLog) => void;
}

interface FishItemInput {
  id: string;
  species: string;
  sizeCm: string;
  weightGrams: string;
  quantity: number;
  lureOrBait?: string;
  notes?: string;
}

const COMMON_SPECIES = [
  'Striped Bass', 'Largemouth Bass', 'Trout', 'Redfish', 
  'Flounder', 'Snook', 'Bluefish', 'Walleye', 
  'Crappie', 'Catfish', 'Tuna'
];

const WEATHER_CONDITIONS: { value: WeatherCondition; label: string; icon: string }[] = [
  { value: 'sunny', label: 'Sunny / Clear', icon: '☀️' },
  { value: 'cloudy', label: 'Cloudy', icon: '☁️' },
  { value: 'rain', label: 'Rain', icon: '🌧️' },
  { value: 'heavy_rain', label: 'Storm / Heavy Rain', icon: '⛈️' },
  { value: 'fog', label: 'Fog / Mist', icon: '🌫️' },
  { value: 'windy', label: 'High Wind', icon: '💨' },
];

const TIDE_NAMES: TideName[] = ['Spring Tide', 'Mid Tide', 'Neap Tide', 'Transition Tide'];

const TIDE_STATES: TideState[] = [
  'Rising (Early)', 'Rising (Late)', 'High Tide', 'Slack Water', 
  'Falling (Early)', 'Falling (Late)', 'Low Tide', 'Other'
];

const WAVE_CONDITIONS: WaveCondition[] = ['Calm', 'Light Chop', 'Moderate Waves', 'Rough'];

export const CatchEditModal: React.FC<CatchEditModalProps> = ({
  initialCatch,
  spots,
  catches: initialCatches,
  defaultSpotId,
  onClose,
  onSaved,
}) => {
  const { isEn, unitSystem, units } = useLanguage();
  const isEdit = !!initialCatch?.id;

  const formatInitialLength = (cm?: number) => {
    if (cm === undefined || cm === null || isNaN(cm)) return '';
    if (unitSystem === 'imperial') {
      const v = convertLengthFromCm(cm, 'imperial');
      return v !== undefined ? String(v) : '';
    }
    return String(cm);
  };

  const formatInitialWeight = (g?: number) => {
    if (g === undefined || g === null || isNaN(g)) return '';
    if (unitSystem === 'imperial') {
      const v = convertWeightFromGrams(g, 'imperial');
      return v !== undefined ? String(v.value) : '';
    }
    return String(g);
  };

  const formatInitialTemp = (c?: number) => {
    if (c === undefined || c === null || isNaN(c)) return '';
    if (unitSystem === 'imperial') {
      const v = convertTemperatureFromC(c, 'imperial');
      return v !== undefined ? String(v) : '';
    }
    return String(c);
  };

  const formatInitialWind = (ms?: number) => {
    if (ms === undefined || ms === null || isNaN(ms)) return '';
    if (unitSystem === 'imperial') {
      const v = convertWindSpeedFromMs(ms, 'imperial');
      return v !== undefined ? String(v) : '';
    }
    return String(ms);
  };

  const now = new Date();
  const defaultDate = now.toISOString().split('T')[0];
  const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [allCatches, setAllCatches] = useState<CatchLog[]>(initialCatches || []);

  useEffect(() => {
    if (initialCatches) {
      setAllCatches(initialCatches);
    } else {
      getAllCatches().then(setAllCatches).catch(console.error);
    }
  }, [initialCatches]);

  // Map each spot to its usage count & last outing date
  const spotUsageMap = useMemo(() => {
    const map = new Map<string, { count: number; lastDate: string }>();
    allCatches.forEach((c) => {
      if (!c.spotId) return;
      const current = map.get(c.spotId) || { count: 0, lastDate: '' };
      current.count += 1;
      if (c.date && (!current.lastDate || c.date > current.lastDate)) {
        current.lastDate = c.date;
      }
      map.set(c.spotId, current);
    });
    return map;
  }, [allCatches]);

  // Sort spots by usage frequency (most used first, ties by recent date, then 50音順)
  const sortedSpots = useMemo(() => {
    return [...spots].sort((a, b) => {
      const usageA = spotUsageMap.get(a.id);
      const countA = usageA?.count || 0;
      const usageB = spotUsageMap.get(b.id);
      const countB = usageB?.count || 0;

      // 1. Primary: Frequency of use (descending)
      if (countB !== countA) {
        return countB - countA;
      }

      // 2. Secondary: If both have usage, sort by most recent outing date (descending)
      if (countA > 0 && usageA && usageB) {
        if (usageB.lastDate !== usageA.lastDate) {
          return usageB.lastDate.localeCompare(usageA.lastDate);
        }
      }

      // 3. Fallback: Alphabetical
      return a.name.localeCompare(b.name, 'en');
    });
  }, [spots, spotUsageMap]);

  const [spotId, setSpotId] = useState<string>(
    initialCatch?.spotId || defaultSpotId || (sortedSpots[0]?.id || spots[0]?.id || '')
  );

  // If spotId is empty or not found, update to the most used spot
  useEffect(() => {
    if (!spotId && sortedSpots.length > 0) {
      setSpotId(sortedSpots[0].id);
    }
  }, [spotId, sortedSpots]);
  const [date, setDate] = useState<string>(initialCatch?.date || defaultDate);
  const [time, setTime] = useState<string>(initialCatch?.time || defaultTime);

  // Catch Mode: No-Catch (Skunked) vs Fish Caught
  const [isNoCatch, setIsNoCatch] = useState<boolean>(
    initialCatch?.isNoCatch || initialCatch?.species === 'No Catch Logged' || initialCatch?.species === '釣果なし' || false
  );

  // Multi-species Fish items list
  const [fishItems, setFishItems] = useState<FishItemInput[]>(() => {
    if (initialCatch?.items && initialCatch.items.length > 0) {
      return initialCatch.items.map((item, idx) => ({
        id: item.id || `fish-${idx}-${Date.now()}`,
        species: item.species || '',
        sizeCm: formatInitialLength(item.sizeCm),
        weightGrams: formatInitialWeight(item.weightGrams),
        quantity: item.quantity || 1,
        lureOrBait: item.lureOrBait || '',
        notes: item.notes || '',
      }));
    }
    if (initialCatch?.species && initialCatch.species !== 'No Catch Logged' && initialCatch.species !== '釣果なし') {
      return [{
        id: 'fish-1',
        species: initialCatch.species,
        sizeCm: formatInitialLength(initialCatch.sizeCm),
        weightGrams: formatInitialWeight(initialCatch.weightGrams),
        quantity: initialCatch.quantity || 1,
        lureOrBait: initialCatch.lureOrBait || '',
        notes: '',
      }];
    }
    return [{
      id: 'fish-1',
      species: 'Striped Bass',
      sizeCm: '',
      weightGrams: '',
      quantity: 1,
      lureOrBait: '',
      notes: '',
    }];
  });

  const handleAddFishItem = () => {
    setFishItems((prev) => [
      ...prev,
      {
        id: 'fish-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        species: '',
        sizeCm: '',
        weightGrams: '',
        quantity: 1,
        lureOrBait: '',
        notes: '',
      },
    ]);
  };

  const handleRemoveFishItem = (id: string) => {
    if (fishItems.length <= 1) return;
    setFishItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateFishItem = (id: string, updates: Partial<FishItemInput>) => {
    setFishItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Tackle
  const [tackles, setTackles] = useState<TackleSet[]>([]);
  const [selectedTackleSetId, setSelectedTackleSetId] = useState<string>(initialCatch?.tackle?.tackleSetId || '');
  const [rod, setRod] = useState<string>(initialCatch?.tackle?.rod || '');
  const [reel, setReel] = useState<string>(initialCatch?.tackle?.reel || '');
  const [mainLine, setMainLine] = useState<string>(initialCatch?.tackle?.mainLine || '');
  const [leader, setLeader] = useState<string>(initialCatch?.tackle?.leader || '');

  // Load tackles on mount
  useEffect(() => {
    getAllTackles().then((list) => {
      setTackles(list);
      if (!initialCatch?.id && !selectedTackleSetId && list.length > 0) {
        const def = list.find((t) => t.isDefault) || list[0];
        if (def) {
          setSelectedTackleSetId(def.id);
          setRod(def.rod);
          setReel(def.reel);
          setMainLine(def.mainLine);
          setLeader(def.leader);
        }
      }
    }).catch(console.error);
  }, []);

  const handleApplyTackle = (tId: string) => {
    setSelectedTackleSetId(tId);
    const target = tackles.find((t) => t.id === tId);
    if (target) {
      setRod(target.rod);
      setReel(target.reel);
      setMainLine(target.mainLine);
      setLeader(target.leader);
      if (!lureOrBait && target.favoriteLures?.length) {
        setLureOrBait(target.favoriteLures[0]);
      }
    }
  };

  // Lure & Action (Global / General)
  const [lureOrBait, setLureOrBait] = useState<string>(initialCatch?.lureOrBait || '');
  const [actionOrRange, setActionOrRange] = useState<string>(initialCatch?.actionOrRange || '');

  // Weather & Tide
  const [condition, setCondition] = useState<WeatherCondition>(initialCatch?.weather?.condition || 'sunny');
  const [temperature, setTemperature] = useState<string>(formatInitialTemp(initialCatch?.weather?.temperature));
  const [waterTemperature, setWaterTemperature] = useState<string>(formatInitialTemp(initialCatch?.weather?.waterTemperature));
  const [windDirection, setWindDirection] = useState<string>(initialCatch?.weather?.windDirection || 'NE');
  const [windSpeedMs, setWindSpeedMs] = useState<string>(formatInitialWind(initialCatch?.weather?.windSpeedMs));
  const [pressureHpa, setPressureHpa] = useState<string>(initialCatch?.weather?.pressureHpa ? String(initialCatch.weather.pressureHpa) : '');
  const [tideName, setTideName] = useState<TideName>((formatTideName(initialCatch?.weather?.tideName) as TideName) || 'Mid Tide');
  const [tideState, setTideState] = useState<TideState>((formatTideState(initialCatch?.weather?.tideState) as TideState) || 'Falling (Early)');
  const [waveHeight, setWaveHeight] = useState<WaveCondition>((formatWaveCondition(initialCatch?.weather?.waveHeight) as WaveCondition) || 'Light Chop');
  const [moonPhase, setMoonPhase] = useState<string>(initialCatch?.weather?.moonPhase || '');

  // TideGraph Modal state
  const [showTideModal, setShowTideModal] = useState<boolean>(false);

  // Auto weather fetching state
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);

  // Notes & Photos
  const [notes, setNotes] = useState<string>(initialCatch?.notes || '');
  const [photoIds, setPhotoIds] = useState<string[]>(initialCatch?.photoIds || []);
  const [uploadedPhotosPreview, setUploadedPhotosPreview] = useState<{ id: string; url: string }[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Auto fetch real weather based on selected spot
  const handleAutoFetchWeather = async () => {
    const selectedSpot = spots.find((s) => s.id === spotId);
    if (!selectedSpot) {
      alert('Please select a fishing spot first.');
      return;
    }

    setIsFetchingWeather(true);
    try {
      const data = await fetchCurrentWeather(selectedSpot.lat, selectedSpot.lng);
      if (data) {
        if (data.condition) setCondition(data.condition);
        if (data.temperature !== undefined) setTemperature(String(data.temperature));
        if (data.windSpeedMs !== undefined) setWindSpeedMs(String(data.windSpeedMs));
        if (data.windDirection) setWindDirection(data.windDirection);
        if (data.pressureHpa !== undefined) setPressureHpa(String(data.pressureHpa));
        if (data.tideName) setTideName(formatTideName(data.tideName) as TideName);
        if (data.moonPhase) setMoonPhase(data.moonPhase);
        if (data.waveHeight) setWaveHeight(formatWaveCondition(data.waveHeight) as WaveCondition);
      }
    } catch (err) {
      console.warn('Weather auto-fetch failed:', err);
    } finally {
      setIsFetchingWeather(false);
    }
  };

  // Immediate photo upload & auto-save to IndexedDB
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    try {
      const addedIds: string[] = [];
      const newPreviews: { id: string; url: string }[] = [];

      for (let i = 0; i < files.length; i++) {
        const primarySpecies = isNoCatch 
          ? 'Trip Photo (No Catch)' 
          : fishItems.find((f) => f.species.trim())?.species || 'Catch Photo';
        const photo = await processAndAutoSavePhoto(files[i], {
          spotId,
          caption: `${primarySpecies} (${date})`
        });
        addedIds.push(photo.id);
        newPreviews.push({ id: photo.id, url: photo.dataUrl });
      }

      setPhotoIds((prev) => [...prev, ...addedIds]);
      setUploadedPhotosPreview((prev) => [...prev, ...newPreviews]);
    } catch (err) {
      console.error(err);
      alert('Failed to save photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedSpot = spots.find((s) => s.id === spotId);
    const spotName = selectedSpot ? selectedSpot.name : 'Unlisted Spot';

    const catchId = initialCatch?.id || 'catch-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const nowIso = new Date().toISOString();

    let finalSpecies = '';
    let finalQuantity = 0;
    let finalSizeCm: number | undefined = undefined;
    let finalWeightGrams: number | undefined = undefined;
    let finalItems: CatchFishItem[] = [];

    if (isNoCatch) {
      finalSpecies = 'No Catch Logged';
      finalQuantity = 0;
      finalItems = [];
    } else {
      const validItems = fishItems.filter((i) => i.species.trim().length > 0);
      if (validItems.length === 0) {
        alert('Please enter at least one target species caught.\nIf you did not catch anything, select "No Catch (Skunked)".');
        return;
      }

      finalItems = validItems.map((item) => ({
        id: item.id,
        species: item.species.trim(),
        sizeCm: item.sizeCm ? parseLengthToCm(parseFloat(item.sizeCm), unitSystem) : undefined,
        weightGrams: item.weightGrams ? parseWeightToGrams(parseFloat(item.weightGrams), unitSystem) : undefined,
        quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
        lureOrBait: item.lureOrBait?.trim() || undefined,
        notes: item.notes?.trim() || undefined,
      }));

      // Species summary
      if (finalItems.length === 1) {
        finalSpecies = finalItems[0].species;
      } else {
        finalSpecies = finalItems.map((i) => i.species).join(', ');
      }

      finalQuantity = finalItems.reduce((sum, i) => sum + (i.quantity || 1), 0);

      const sizes = finalItems
        .map((i) => i.sizeCm)
        .filter((s): s is number => typeof s === 'number' && s > 0);
      if (sizes.length > 0) {
        finalSizeCm = Math.max(...sizes);
      }

      const weights = finalItems
        .map((i) => i.weightGrams)
        .filter((w): w is number => typeof w === 'number' && w > 0);
      if (weights.length > 0) {
        finalWeightGrams = weights.reduce((sum, w) => sum + w, 0);
      }
    }

    const catchData: CatchLog = {
      id: catchId,
      spotId,
      spotName,
      date,
      time,
      isNoCatch,
      items: finalItems,
      species: finalSpecies,
      sizeCm: finalSizeCm,
      weightGrams: finalWeightGrams,
      quantity: finalQuantity,
      tackle: {
        tackleSetId: selectedTackleSetId || undefined,
        tackleSetName: tackles.find((t) => t.id === selectedTackleSetId)?.name || undefined,
        rod: rod.trim() || undefined,
        reel: reel.trim() || undefined,
        mainLine: mainLine.trim() || undefined,
        leader: leader.trim() || undefined,
      },
      lureOrBait: lureOrBait.trim(),
      actionOrRange: actionOrRange.trim(),
      weather: {
        condition,
        temperature: temperature ? parseTemperatureToC(parseFloat(temperature), unitSystem) : undefined,
        waterTemperature: waterTemperature ? parseTemperatureToC(parseFloat(waterTemperature), unitSystem) : undefined,
        windDirection: windDirection.trim() || undefined,
        windSpeedMs: windSpeedMs ? parseWindSpeedToMs(parseFloat(windSpeedMs), unitSystem) : undefined,
        pressureHpa: pressureHpa ? parseFloat(pressureHpa) : undefined,
        tideName,
        tideState,
        waveHeight,
        moonPhase: moonPhase.trim() || undefined,
      },
      notes: notes.trim(),
      photoIds,
      createdAt: initialCatch?.createdAt || nowIso,
      updatedAt: nowIso,
    };

    try {
      await saveCatch(catchData);

      // If marked as wishlist spot, record outing completes the exploration
      if (selectedSpot && selectedSpot.wishlistSpot) {
        try {
          const { saveSpot } = await import('../../services/db');
          const updatedSpot = { ...selectedSpot, wishlistSpot: false, updatedAt: nowIso };
          await saveSpot(updatedSpot);
        } catch (err) {
          console.warn('Failed to update spot wishlist status:', err);
        }
      }

      onSaved(catchData);
    } catch (err) {
      console.error('Save catch failed:', err);
      alert('Failed to save catch log.');
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">
              {isEdit ? 'Fang bearbeiten' : 'Log New Catch'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Record species, length, weight, weather, tide conditions, lures, and photos
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Section 1: Spot & Date/Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Spot selector */}
            <div className="space-y-1 sm:col-span-1">
              <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                <span>Fishing Spot <span className="text-rose-400">*</span></span>
                <span className="text-[10px] text-sky-400 font-normal">Frequent First</span>
              </label>
              <select
                required
                value={spotId}
                onChange={(e) => setSpotId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500"
              >
                {sortedSpots.map((s) => {
                  const usage = spotUsageMap.get(s.id);
                  const count = usage?.count || 0;
                  return (
                    <option key={s.id} value={s.id}>
                      {count > 0 ? `${s.name} (${count} trips)` : s.name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                <span>Date</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500"
              >
              </input>
            </div>

            {/* Time */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>Hookup Time</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500"
              >
              </input>
            </div>
          </div>

          {/* Section 2: Catch Type (Fish Caught vs No Catch / Skunk) */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-4">
            
            {/* Catch Mode Selector: Fish Caught vs No Catch */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Catch Status
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNoCatch(false)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 sm:px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    !isNoCatch
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Fish className="w-4 h-4 shrink-0" />
                  <span>Fish Caught (Log Species)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsNoCatch(true)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 sm:px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    isNoCatch
                      ? 'bg-amber-600/90 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-sm shrink-0">🚫</span>
                  <span>No Catch (Skunked)</span>
                </button>
              </div>
            </div>

            {/* If No Catch */}
            {isNoCatch ? (
              <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl text-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
                  <span>ℹ️ Logged as No Catch (Skunked Outing)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Logging outings with zero fish provides critical intelligence on seasonal water temps, tide cycles, and lure presentations.
                </p>
                <div className="text-[11px] text-slate-400 pt-1">
                  ※ Fish species and size entries are skipped. Enter weather, tide conditions, tackle setup, and notes below.
                </div>
              </div>
            ) : (
              /* If Fish Caught */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Fish className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="text-xs font-bold text-white whitespace-nowrap">Target Species & Size List</span>
                    <span className="text-[11px] font-mono bg-sky-950 text-sky-300 px-2 py-0.5 rounded-full border border-sky-800 whitespace-nowrap shrink-0">
                      {fishItems.length} species
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddFishItem}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600/90 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add Species</span>
                  </button>
                </div>

                {/* Quick Species Select Suggestions */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400 block">Popular Species (Tap to auto-fill latest row):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_SPECIES.map((sp) => (
                      <button
                        type="button"
                        key={sp}
                        onClick={() => {
                          const targetId = fishItems[fishItems.length - 1].id;
                          handleUpdateFishItem(targetId, { species: sp });
                        }}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 rounded-lg text-xs transition-colors whitespace-nowrap shrink-0"
                      >
                        {sp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* List of fish item cards */}
                <div className="space-y-3">
                  {fishItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3 relative group"
                    >
                      {/* Item header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-200">
                            Species #{index + 1}
                          </span>
                        </div>

                        {fishItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFishItem(item.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors text-xs flex items-center gap-1"
                            title="Delete this species"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Delete</span>
                          </button>
                        )}
                      </div>

                      {/* Species Name */}
                      <div>
                        <input
                          type="text"
                          required={!isNoCatch}
                          placeholder="Species name (e.g., Striped Bass, Redfish, Flounder, Trout...)"
                          value={item.species}
                          onChange={(e) => handleUpdateFishItem(item.id, { species: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 placeholder:text-slate-500"
                        />
                      </div>

                      {/* Size, Weight, Quantity */}
                      <div className="grid grid-cols-3 gap-2.5">
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-1">
                            Length ({units.lengthSmall})
                          </span>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.1"
                              placeholder={unitSystem === 'imperial' ? '18.5' : '45.0'}
                              value={item.sizeCm}
                              onChange={(e) => handleUpdateFishItem(item.id, { sizeCm: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 pointer-events-none">
                              {units.lengthSmall}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 block mb-1">
                            Weight ({units.weightLarge})
                          </span>
                          <div className="relative">
                            <input
                              type="number"
                              step={unitSystem === 'imperial' ? '0.1' : '10'}
                              placeholder={unitSystem === 'imperial' ? '3.5' : '1200'}
                              value={item.weightGrams}
                              onChange={(e) => handleUpdateFishItem(item.id, { weightGrams: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 pointer-events-none">
                              {units.weightLarge}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 block mb-1">
                            Count <span className="text-rose-400">*</span>
                          </span>
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              required={!isNoCatch}
                              value={item.quantity}
                              onChange={(e) => handleUpdateFishItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 pointer-events-none">
                              fish
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Optional per-fish Hit Lure/Bait or Sub-point memo */}
                      <div className="pt-0.5">
                        <input
                          type="text"
                          placeholder="Effective lure / bait for this fish (optional, e.g., 3/8oz Jighead + Paddle Tail)"
                          value={item.lureOrBait || ''}
                          onChange={(e) => handleUpdateFishItem(item.id, { lureOrBait: e.target.value })}
                          className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-slate-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add another fish button at bottom */}
                <button
                  type="button"
                  onClick={handleAddFishItem}
                  className="w-full py-2.5 border border-dashed border-sky-500/40 hover:border-sky-500/80 bg-sky-950/20 hover:bg-sky-950/40 text-sky-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Another Species (Mixed Catch / Bycatch)</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 3: Weather & Tide conditions */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <CloudSun className="w-4 h-4 text-amber-400" />
                <span>Weather & Tide Intelligence</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTideModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-semibold transition-colors shadow-sm whitespace-nowrap shrink-0"
                  title="Select tide conditions and time from interactive tide chart"
                >
                  <Waves className="w-3.5 h-3.5 shrink-0" />
                  <span>📊 Pick from Tide Chart</span>
                </button>
                <button
                  type="button"
                  onClick={handleAutoFetchWeather}
                  disabled={isFetchingWeather}
                  className="flex items-center gap-1 px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                  title="Auto-fetch live weather, wind, and solunar data for this spot"
                >
                  <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isFetchingWeather ? 'animate-spin' : ''}`} />
                  <span>Auto-Fetch Weather</span>
                </button>
              </div>
            </div>

            {/* Weather Condition */}
            <div className="flex flex-wrap gap-2">
              {WEATHER_CONDITIONS.map((cond) => (
                <button
                  type="button"
                  key={cond.value}
                  onClick={() => setCondition(cond.value)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    condition === cond.value
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  <span className="shrink-0">{cond.icon}</span>
                  <span>{cond.label}</span>
                </button>
              ))}
            </div>

            {/* Tide Name & Tide State */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Tide Cycle</span>
                <select
                  value={tideName}
                  onChange={(e) => setTideName(e.target.value as TideName)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  {TIDE_NAMES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Tide Phase & Flow</span>
                <select
                  value={tideState}
                  onChange={(e) => setTideState(e.target.value as TideState)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  {TIDE_STATES.map((ts) => (
                    <option key={ts} value={ts}>
                      {ts}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Temp, Wind, Pressure, Wave */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">
                  Air Temp ({units.temperature})
                </span>
                <input
                  type="number"
                  step="0.1"
                  placeholder={unitSystem === 'imperial' ? '72.0' : '22.5'}
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block mb-1">
                  Water Temp ({units.temperature})
                </span>
                <input
                  type="number"
                  step="0.1"
                  placeholder={unitSystem === 'imperial' ? '68.0' : '21.0'}
                  value={waterTemperature}
                  onChange={(e) => setWaterTemperature(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block mb-1">
                  Wind ({units.windSpeed})
                </span>
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="NE"
                    value={windDirection}
                    onChange={(e) => setWindDirection(e.target.value)}
                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1.5 text-xs text-white"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder={units.windSpeed}
                    value={windSpeedMs}
                    onChange={(e) => setWindSpeedMs(e.target.value)}
                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Wave & Swell</span>
                <select
                  value={waveHeight}
                  onChange={(e) => setWaveHeight(e.target.value as WaveCondition)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1.5 text-xs text-white"
                >
                  {WAVE_CONDITIONS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Lure, Range & Tackle */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-200">
                  Hit Lure / Presentation / Bait
                </label>
                <input
                  type="text"
                  placeholder="e.g., SP Minnow 15F / 3/8oz Swimbait Jighead / Live Mullet"
                  value={lureOrBait}
                  onChange={(e) => setLureOrBait(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-200">
                  Depth Range & Action / Strike Pattern
                </label>
                <input
                  type="text"
                  placeholder="e.g., Slow retrieve along bridge shadow line, bouncing bottom on pause"
                  value={actionOrRange}
                  onChange={(e) => setActionOrRange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Registered Tackle Selector */}
            {tackles.length > 0 && (
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    Auto-Fill from My Tackle Box
                  </span>
                  <span className="text-[10px] text-slate-400">Tap to auto-fill rod, reel, and line specs</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tackles.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleApplyTackle(t.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 border whitespace-nowrap shrink-0 ${
                        selectedTackleSetId === t.id
                          ? 'bg-sky-500/20 text-sky-200 border-sky-400'
                          : 'bg-slate-900 text-slate-300 border-slate-700/80 hover:bg-slate-800'
                      }`}
                    >
                      {selectedTackleSetId === t.id && <Check className="w-3 h-3 text-sky-400 shrink-0" />}
                      <span className="truncate max-w-[150px] sm:max-w-[200px]">{t.name}</span>
                    </button>
                  ))}
                </div>

                {/* Favorite lures for selected tackle */}
                {(() => {
                  const activeT = tackles.find((t) => t.id === selectedTackleSetId);
                  if (activeT?.favoriteLures && activeT.favoriteLures.length > 0) {
                    return (
                      <div className="pt-1.5 border-t border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block mb-1">
                          Confidence lures for "{activeT.name}" (Tap to use):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {activeT.favoriteLures.map((l, lIdx) => (
                            <button
                              key={lIdx}
                              type="button"
                              onClick={() => setLureOrBait(l)}
                              className="px-2 py-0.5 rounded text-[11px] bg-slate-900 hover:bg-sky-950/50 hover:text-sky-300 text-slate-300 border border-slate-700 transition-colors whitespace-nowrap shrink-0"
                            >
                              + {l}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}

            {/* Tackle collapsible/simple grid */}
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 block">Tackle Setup Specifications</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Rod (e.g., 7ft Medium)"
                  value={rod}
                  onChange={(e) => setRod(e.target.value)}
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Reel (e.g., 2500 Spinning)"
                  value={reel}
                  onChange={(e) => setReel(e.target.value)}
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Line (e.g., 20lb Braid)"
                  value={mainLine}
                  onChange={(e) => setMainLine(e.target.value)}
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Leader (e.g., 15lb Fluoro)"
                  value={leader}
                  onChange={(e) => setLeader(e.target.value)}
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Notes & Memo */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200">
              Field Notes, Activity & Observations
            </label>
            <textarea
              rows={3}
              placeholder="Water clarity, bait presence, surface activity, strike reaction, stomach contents, notes for next trip..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Section 6: Photos (Auto-save) */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-sky-400" />
                <span>Catch Photos (Auto-Saved)</span>
              </label>
              <label className="cursor-pointer text-xs font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1">
                <span>{isUploadingPhoto ? 'Wird gespeichert...' : '+ Add Photos'}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  disabled={isUploadingPhoto}
                  className="hidden"
                />
              </label>
            </div>

            {uploadedPhotosPreview.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                {uploadedPhotosPreview.map((p) => (
                  <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                    <img src={p.url} alt="Uploaded catch" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-slate-500">
              Photos uploaded are automatically compressed and saved locally on this device.
            </p>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl shadow-md shadow-sky-950 flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isEdit ? 'Save Changes' : 'Log Catch'}</span>
            </button>
          </div>

        </form>

        {/* Tide Graph Modal */}
        {showTideModal && (
          <div className="fixed inset-0 z-[1300] flex items-center justify-center p-1.5 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-2xl max-h-[96vh] overflow-y-auto">
              <TideGraph
                spotName={sortedSpots.find((s) => s.id === spotId)?.name}
                lng={sortedSpots.find((s) => s.id === spotId)?.lng || 139.7}
                lat={sortedSpots.find((s) => s.id === spotId)?.lat || 35.6}
                initialDate={new Date(date || Date.now())}
                selectedTime={time}
                onClose={() => setShowTideModal(false)}
                onSelectTime={(pickedTime, pickedState, pickedName) => {
                  setTime(pickedTime);
                  setTideState(pickedState);
                  setTideName(pickedName);
                  setShowTideModal(false);
                }}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

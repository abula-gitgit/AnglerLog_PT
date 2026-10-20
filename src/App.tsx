import React, { useState, useEffect } from 'react';
import { FishingSpot, CatchLog, SpotType, TackleSet } from './types/fishing';
import { getAllSpots, getAllCatches, getAllTackles, deleteSpot, deleteCatch, clearSampleData, loadSampleData, isSampleSpotItem } from './services/db';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { SpotMap } from './components/Map/SpotMap';
import { SpotList } from './components/Spots/SpotList';
import { SpotDetailModal } from './components/Spots/SpotDetailModal';
import { SpotEditModal } from './components/Spots/SpotEditModal';
import { CatchList } from './components/Catches/CatchList';
import { CatchDetailModal } from './components/Catches/CatchDetailModal';
import { CatchEditModal } from './components/Catches/CatchEditModal';
import { CatchCalendarView } from './components/Calendar/CatchCalendarView';
import { PhotoGalleryView } from './components/Photos/PhotoGalleryView';
import { TrophyDashboard } from './components/Analytics/TrophyDashboard';
import { BackupModal } from './components/Backup/BackupModal';
import { PrivacyPolicyModal } from './components/Legal/PrivacyPolicyModal';
import { UserManualModal } from './components/Help/UserManualModal';
import { PWAInstallButton } from './components/Common/PWAInstallButton';
import { OfflineIndicator } from './components/Common/OfflineIndicator';
import { TackleBoxModal } from './components/Tackle/TackleBoxModal';
import { TideGraph } from './components/Tide/TideGraph';
import { FishingCompassModal } from './components/Compass/FishingCompassModal';
import { PatternPredictionModal } from './components/Analytics/PatternPredictionModal';
import { ScreenDropdownBadge } from './components/Navigation/ScreenDropdownBadge';
import { BottomAdBanner } from './components/Ads/BottomAdBanner';
import { AdSettingsModal } from './components/Ads/AdSettingsModal';
import { isAdBannerEnabled } from './config/adConfig';
import { 
  Map, ListFilter, Fish, Calendar, Camera, BarChart3, Plus 
} from 'lucide-react';

type TabView = 'map' | 'spots' | 'catches' | 'calendar' | 'photos' | 'analytics';

function AppContent() {
  const { t, isEn, unitSystem, setUnitSystem } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabView>('map');
  const [spots, setSpots] = useState<FishingSpot[]>([]);
  const [catches, setCatches] = useState<CatchLog[]>([]);
  const [tackles, setTackles] = useState<TackleSet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals & Selections
  const [selectedSpot, setSelectedSpot] = useState<FishingSpot | null>(null);
  const [selectedCatch, setSelectedCatch] = useState<CatchLog | null>(null);
  const [isEditingSpot, setIsEditingSpot] = useState<boolean>(false);
  const [spotEditInitial, setSpotEditInitial] = useState<Partial<FishingSpot> | null>(null);
  const [isEditingCatch, setIsEditingCatch] = useState<boolean>(false);
  const [catchEditInitial, setCatchEditInitial] = useState<Partial<CatchLog> | null>(null);
  const [defaultSpotForCatch, setDefaultSpotForCatch] = useState<string | undefined>(undefined);
  const [isBackupOpen, setIsBackupOpen] = useState<boolean>(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState<boolean>(false);
  const [isUserManualOpen, setIsUserManualOpen] = useState<boolean>(false);

  // Tactical Fishing Tools Modal States
  const [isTackleBoxOpen, setIsTackleBoxOpen] = useState<boolean>(false);
  const [isTideGraphOpen, setIsTideGraphOpen] = useState<boolean>(false);
  const [isCompassOpen, setIsCompassOpen] = useState<boolean>(false);
  const [isPatternPredictionOpen, setIsPatternPredictionOpen] = useState<boolean>(false);

  // Ad Banner States (Strictly controlled by app creator only)
  const [isAdBannerActive, setIsAdBannerActive] = useState<boolean>(() => isAdBannerEnabled());
  const [isAdSettingsOpen, setIsAdSettingsOpen] = useState<boolean>(false);
  const [creatorTapCount, setCreatorTapCount] = useState<number>(0);

  // Check URL query parameter (?admin=1 or ?creator=1) for creator debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === '1' || params.get('creator') === '1') {
        setIsAdSettingsOpen(true);
      }
    }
  }, []);

  const handleLogoClick = () => {
    setActiveTab('map');
    // Secret 5-tap creator gesture to test ad banner settings
    setCreatorTapCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setIsAdSettingsOpen(true);
        return 0;
      }
      return next;
    });
  };

  // Map state
  const [mapTargetSpotId, setMapTargetSpotId] = useState<string | null>(null);

  // Initial data load
  const loadData = async () => {
    try {
      const [loadedSpots, loadedCatches, loadedTackles] = await Promise.all([
        getAllSpots(),
        getAllCatches(),
        getAllTackles(),
      ]);
      setSpots(loadedSpots);
      setCatches(loadedCatches);
      setTackles(loadedTackles);
    } catch (err) {
      console.error('Failed to load database:', err);
    } finally {
      setLoading(false);
    }
  };

  const [showSampleBanner, setShowSampleBanner] = useState<boolean>(true);
  const hasSampleData = spots.some(isSampleSpotItem);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === '1' || params.get('sample') === '1') {
      loadSampleData(true).then(() => loadData());
    } else {
      loadData();
    }
  }, []);

  const handleClearSampleData = async () => {
    if (window.confirm('Eliminar todos os pesqueiros e capturas de exemplo?\nPode recarregar os dados de demonstração a qualquer momento.')) {
      await clearSampleData();
      await loadData();
      setShowSampleBanner(false);
    }
  };

  const handleToggleSampleData = async () => {
    if (hasSampleData) {
      if (window.confirm('Eliminar todos os pesqueiros e capturas de exemplo?\nPode recarregar os dados de demonstração a qualquer momento.')) {
        await clearSampleData();
        await loadData();
        setShowSampleBanner(false);
      }
    } else {
      await loadSampleData(true);
      await loadData();
      setShowSampleBanner(true);
    }
  };

  // Handlers for Spots
  const handleAddSpotAtCoords = (coords: { lat: number; lng: number }) => {
    setSpotEditInitial({
      lat: coords.lat,
      lng: coords.lng,
      spotType: 'breakwater',
      favorite: false,
    });
    setIsEditingSpot(true);
  };

  const handleOpenAddSpot = () => {
    setSpotEditInitial(null);
    setIsEditingSpot(true);
  };

  const handleEditSpot = (spot: FishingSpot) => {
    setSelectedSpot(null);
    setSpotEditInitial(spot);
    setIsEditingSpot(true);
  };

  const handleDeleteSpot = async (spotId: string) => {
    await deleteSpot(spotId);
    setSelectedSpot(null);
    await loadData();
  };

  const handleSpotSaved = async (spot: FishingSpot) => {
    setIsEditingSpot(false);
    setSpotEditInitial(null);
    await loadData();
    // Highlight on map if in map view
    setMapTargetSpotId(spot.id);
  };

  // Handlers for Catches
  const handleOpenAddCatch = (spot?: FishingSpot, prefill?: Partial<CatchLog>) => {
    const initial: Partial<CatchLog> = {
      ...(spot ? { spotId: spot.id } : {}),
      ...(prefill || {}),
    };
    setCatchEditInitial(Object.keys(initial).length > 0 ? initial : null);
    setDefaultSpotForCatch(spot?.id || prefill?.spotId || (spots[0]?.id ?? ''));
    setIsEditingCatch(true);
  };

  const handleEditCatch = (catchLog: CatchLog) => {
    setSelectedCatch(null);
    setCatchEditInitial(catchLog);
    setIsEditingCatch(true);
  };

  const handleDeleteCatch = async (catchId: string) => {
    await deleteCatch(catchId);
    setSelectedCatch(null);
    await loadData();
  };

  const handleCatchSaved = async () => {
    setIsEditingCatch(false);
    setCatchEditInitial(null);
    await loadData();
  };

  const handleShowSpotOnMap = (spot: FishingSpot) => {
    setMapTargetSpotId(spot.id);
    setActiveTab('map');
  };

  const handleGoToSpotFromCatch = (spotId: string) => {
    const spot = spots.find((s) => s.id === spotId);
    if (spot) {
      setSelectedCatch(null);
      setSelectedSpot(spot);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white">
      
      {/* Top Bar Contract:
          [Brand title, one line] — [4-6 nav links, 1-2 word labels, single-line] — [1-2 primary actions]
      */}
      <header className="h-14 sm:h-16 px-2 sm:px-3 md:px-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-1.5 sm:gap-3 shrink-0 relative z-[1150] w-full min-w-0 max-w-full overflow-visible">
        
        {/* Zone 1: Brand wordmark with custom app icon */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg md:text-xl font-bold tracking-tight text-white hover:text-amber-300 transition-colors shrink-0"
          >
            <img
              src="/icon.svg"
              alt="AnglerLog"
              className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-lg shadow-md shadow-amber-950/70 object-contain ring-1 ring-amber-500/30 shrink-0"
            />
            <span className="truncate">AnglerLog</span>
          </button>
        </div>

        {/* Zone 2: Navigation links / tabs (visible on xl+ desktop) */}
        <nav className="hidden xl:flex items-center gap-0.5 2xl:gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80 shrink-0">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1.5 px-2.5 2xl:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'map'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Map className="w-3.5 h-3.5 shrink-0" />
            <span>{t.tabMap}</span>
          </button>

          <button
            onClick={() => setActiveTab('spots')}
            className={`flex items-center gap-1.5 px-2.5 2xl:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'spots'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5 shrink-0" />
            <span>{t.tabSpots} ({spots.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('catches')}
            className={`flex items-center gap-1.5 px-2.5 2xl:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'catches'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Fish className="w-3.5 h-3.5 shrink-0" />
            <span>{t.tabCatches} ({catches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-1.5 px-2.5 2xl:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'calendar'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>{t.tabCalendar}</span>
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={`flex items-center gap-1.5 px-2.5 2xl:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'photos'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5 shrink-0" />
            <span>{t.tabPhotos}</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-2.5 2xl:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span>{t.tabAnalytics}</span>
          </button>
        </nav>

        {/* Zone 3: Navigation Dropdown & Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0 min-w-0">
          {/* Quick Unit System Toggle (Metric ⇄ Imperial) - compact, visible on md+ screens */}
          <button
            onClick={() => setUnitSystem(unitSystem === 'metric' ? 'imperial' : 'metric')}
            className="hidden md:flex items-center gap-1 px-2 py-1.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold shadow-inner transition-all group shrink-0"
            title={unitSystem === 'metric' ? 'Metric (cm, kg, m/s) → Click to switch to Imperial (in, lb, kt)' : 'Imperial (in, lb, kt) → Click to switch to Metric (cm, kg, m/s)'}
          >
            <span className="text-sky-400 text-xs">📐</span>
            <span className="font-mono text-[11px] text-sky-200">
              {unitSystem === 'metric' ? 'cm/kg' : 'in/lb'}
            </span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Screen Selection Dropdown Badge (Quick access to all screens, tactical tools, guide & units) */}
          <ScreenDropdownBadge
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            spotsCount={spots.length}
            catchesCount={catches.length}
            onOpenTideGraph={() => setIsTideGraphOpen(true)}
            onOpenCompass={() => setIsCompassOpen(true)}
            onOpenTackleBox={() => setIsTackleBoxOpen(true)}
            onOpenPatternPrediction={() => setIsPatternPredictionOpen(true)}
            onOpenBackup={() => setIsBackupOpen(true)}
            onOpenPrivacyPolicy={() => setIsPrivacyPolicyOpen(true)}
            onOpenManual={() => setIsUserManualOpen(true)}
            hasSampleData={hasSampleData}
            onToggleSampleData={handleToggleSampleData}
          />

          {/* Primary Action CTA */}
          <button
            onClick={() => handleOpenAddCatch()}
            aria-label={t.btnAddCatch}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-950 transition-all whitespace-nowrap shrink-0"
            title={t.btnAddCatch}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
            <span className="whitespace-nowrap">
              <span className="inline sm:hidden">Registar</span>
              <span className="hidden sm:inline">{t.btnAddCatch}</span>
            </span>
          </button>
        </div>

      </header>

      {/* Sample Demonstration Banner */}
      {showSampleBanner && hasSampleData && (
        <div className="bg-gradient-to-r from-amber-950/95 via-slate-900/95 to-amber-950/95 border-b border-amber-500/40 px-3 sm:px-6 py-2 text-xs flex flex-wrap items-center justify-between gap-2 z-[1100] shrink-0 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 text-[11px] whitespace-nowrap">
              🔰 MODO DE DEMONSTRAÇÃO
            </span>
            <span className="text-slate-200 text-xs">
              Dados de exemplo carregados (pesqueiros e capturas). Experimente livremente todas as funcionalidades!
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearSampleData}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold transition-colors text-[11px] whitespace-nowrap"
            >
              Eliminar dados demo
            </button>
            <button
              onClick={() => setShowSampleBanner(false)}
              className="text-slate-400 hover:text-white p-1 text-xs"
              title="Ocultar"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-400 gap-2 text-xs">
            <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading fishing data...</span>
          </div>
        ) : (
          <>
            {activeTab === 'map' && (
              <SpotMap
                spots={spots}
                catches={catches}
                selectedSpotId={mapTargetSpotId}
                onSelectSpot={(spot) => setSelectedSpot(spot)}
                onAddSpotAtCoords={handleAddSpotAtCoords}
                onAddCatchForSpot={(spot) => handleOpenAddCatch(spot)}
              />
            )}

            {activeTab === 'spots' && (
              <SpotList
                spots={spots}
                catches={catches}
                onSelectSpot={(spot) => setSelectedSpot(spot)}
                onAddSpot={handleOpenAddSpot}
                onAddCatch={(spot) => handleOpenAddCatch(spot)}
                onShowOnMap={handleShowSpotOnMap}
                onDeleteSpot={handleDeleteSpot}
                onSwitchToMap={() => setActiveTab('map')}
              />
            )}

            {activeTab === 'catches' && (
              <CatchList
                catches={catches}
                spots={spots}
                onSelectCatch={(catchLog) => setSelectedCatch(catchLog)}
                onAddCatch={() => handleOpenAddCatch()}
                onSelectSpot={(spot) => setSelectedSpot(spot)}
              />
            )}

            {activeTab === 'calendar' && (
              <CatchCalendarView
                spots={spots}
                catches={catches}
                onSelectCatch={(catchLog) => setSelectedCatch(catchLog)}
                onSelectSpot={(spot) => setSelectedSpot(spot)}
                onAddCatch={(spot, prefill) => handleOpenAddCatch(spot, prefill)}
                onEditCatch={handleEditCatch}
              />
            )}

            {activeTab === 'photos' && (
              <PhotoGalleryView
                spots={spots}
                catches={catches}
                onSelectSpot={(spot) => setSelectedSpot(spot)}
                onSelectCatch={(catchLog) => setSelectedCatch(catchLog)}
              />
            )}

            {activeTab === 'analytics' && (
              <TrophyDashboard
                spots={spots}
                catches={catches}
                onSelectSpot={(spot) => setSelectedSpot(spot)}
                onSelectCatch={(catchLog) => setSelectedCatch(catchLog)}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Ad Banner Slot: 
          Creator can configure on/off. When disabled, returns null leaving zero empty whitespace.
      */}
      <BottomAdBanner
        isEnabled={isAdBannerActive}
      />

      {/* Modals */}
      {/* 1. Spot Detail Modal */}
      {selectedSpot && (
        <SpotDetailModal
          spot={selectedSpot}
          catches={catches}
          onClose={() => setSelectedSpot(null)}
          onEdit={handleEditSpot}
          onDelete={handleDeleteSpot}
          onAddCatch={(s) => {
            setSelectedSpot(null);
            handleOpenAddCatch(s);
          }}
          onSelectCatch={(c) => {
            setSelectedSpot(null);
            setSelectedCatch(c);
          }}
          onSpotUpdated={loadData}
        />
      )}

      {/* 2. Spot Edit Modal */}
      {isEditingSpot && (
        <SpotEditModal
          initialSpot={spotEditInitial}
          onClose={() => {
            setIsEditingSpot(false);
            setSpotEditInitial(null);
          }}
          onSaved={handleSpotSaved}
          onDelete={handleDeleteSpot}
        />
      )}

      {/* 3. Catch Detail Modal */}
      {selectedCatch && (
        <CatchDetailModal
          catchLog={selectedCatch}
          spot={spots.find((s) => s.id === selectedCatch.spotId)}
          onClose={() => setSelectedCatch(null)}
          onEdit={handleEditCatch}
          onDelete={handleDeleteCatch}
          onGoToSpot={handleGoToSpotFromCatch}
          onCatchUpdated={loadData}
        />
      )}

      {/* 4. Catch Edit Modal */}
      {isEditingCatch && (
        <CatchEditModal
          initialCatch={catchEditInitial}
          spots={spots}
          catches={catches}
          defaultSpotId={defaultSpotForCatch}
          onClose={() => {
            setIsEditingCatch(false);
            setCatchEditInitial(null);
          }}
          onSaved={handleCatchSaved}
        />
      )}

      {/* 5. Backup / Restore Modal */}
      {isBackupOpen && (
        <BackupModal
          onClose={() => setIsBackupOpen(false)}
          onDataRestored={loadData}
          onOpenPrivacyPolicy={() => setIsPrivacyPolicyOpen(true)}
        />
      )}

      {/* 5.5. Privacy Policy & Data Protection Modal */}
      {isPrivacyPolicyOpen && (
        <PrivacyPolicyModal
          onClose={() => setIsPrivacyPolicyOpen(false)}
          onOpenBackup={() => setIsBackupOpen(true)}
        />
      )}

      {/* 5.8. User Manual & Guide Modal */}
      {isUserManualOpen && (
        <UserManualModal
          onClose={() => setIsUserManualOpen(false)}
          onOpenTideGraph={() => setIsTideGraphOpen(true)}
          onOpenCompass={() => setIsCompassOpen(true)}
          onOpenTackleBox={() => setIsTackleBoxOpen(true)}
          onOpenPatternPrediction={() => setIsPatternPredictionOpen(true)}
          onOpenBackup={() => setIsBackupOpen(true)}
          onOpenPrivacyPolicy={() => setIsPrivacyPolicyOpen(true)}
        />
      )}

      {/* 6. Tackle Box Modal */}
      {isTackleBoxOpen && (
        <TackleBoxModal
          tackles={tackles}
          catches={catches}
          onClose={() => setIsTackleBoxOpen(false)}
          onTacklesUpdated={loadData}
          onSelectTackleForCatch={(tackle) => {
            setIsTackleBoxOpen(false);
            handleOpenAddCatch(undefined, {
              tackle: {
                tackleSetId: tackle.id,
                tackleSetName: tackle.name,
                rod: tackle.rod,
                reel: tackle.reel,
                mainLine: tackle.mainLine,
                leader: tackle.leader,
              },
              lureOrBait: tackle.favoriteLures?.[0] || '',
            });
          }}
        />
      )}

      {/* 7. Tide Graph Modal */}
      {isTideGraphOpen && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center p-1.5 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[96vh] overflow-y-auto">
            <TideGraph
              spotName={spots[0]?.name || 'Coastal Ocean Waters'}
              lat={spots[0]?.lat || 24.92}
              lng={spots[0]?.lng || -80.62}
              onClose={() => setIsTideGraphOpen(false)}
            />
          </div>
        </div>
      )}

      {/* 8. Fishing Compass Modal */}
      {isCompassOpen && (
        <FishingCompassModal
          spots={spots}
          onClose={() => setIsCompassOpen(false)}
        />
      )}

      {/* 9. Pattern Prediction Modal */}
      {isPatternPredictionOpen && (
        <PatternPredictionModal
          spots={spots}
          catches={catches}
          onClose={() => setIsPatternPredictionOpen(false)}
        />
      )}

      {/* 10. Ad Banner Settings Modal (For App Creator) */}
      {isAdSettingsOpen && (
        <AdSettingsModal
          isEnabled={isAdBannerActive}
          onToggleEnabled={(val: boolean) => setIsAdBannerActive(val)}
          onClose={() => setIsAdSettingsOpen(false)}
        />
      )}

      {/* Offline Status & Cache Indicator */}
      <OfflineIndicator />

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import {
  Map,
  ListFilter,
  Fish,
  Calendar,
  Camera,
  BarChart3,
  ChevronDown,
  Check,
  Waves,
  Wind,
  Briefcase,
  Sparkles,
  Shield,
  ShieldCheck,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export type ScreenTabType = 'map' | 'spots' | 'catches' | 'calendar' | 'photos' | 'analytics';

interface ScreenDropdownBadgeProps {
  activeTab: ScreenTabType;
  onSelectTab: (tab: ScreenTabType) => void;
  spotsCount?: number;
  catchesCount?: number;
  onOpenTideGraph?: () => void;
  onOpenCompass?: () => void;
  onOpenTackleBox?: () => void;
  onOpenPatternPrediction?: () => void;
  onOpenBackup?: () => void;
  onOpenPrivacyPolicy?: () => void;
  onOpenManual?: () => void;
  hasSampleData?: boolean;
  onToggleSampleData?: () => void;
}

interface TabConfig {
  id: ScreenTabType;
  label: string;
  labelEn: string;
  shortLabel: string;
  shortLabelEn: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const TABS: TabConfig[] = [
  {
    id: 'map',
    label: 'Fishing Map',
    labelEn: 'Fishing Map',
    shortLabel: 'Map',
    shortLabelEn: 'Map',
    icon: Map,
    accentColor: 'text-sky-400',
  },
  {
    id: 'spots',
    label: 'Spot List',
    labelEn: 'Spot List',
    shortLabel: 'Spots',
    shortLabelEn: 'Spots',
    icon: ListFilter,
    accentColor: 'text-emerald-400',
  },
  {
    id: 'catches',
    label: 'Catch Logs',
    labelEn: 'Catch Logs',
    shortLabel: 'Catches',
    shortLabelEn: 'Catches',
    icon: Fish,
    accentColor: 'text-cyan-400',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    labelEn: 'Calendar',
    shortLabel: 'Calendar',
    shortLabelEn: 'Calendar',
    icon: Calendar,
    accentColor: 'text-amber-400',
  },
  {
    id: 'photos',
    label: 'Photo Gallery',
    labelEn: 'Photo Gallery',
    shortLabel: 'Photos',
    shortLabelEn: 'Photos',
    icon: Camera,
    accentColor: 'text-pink-400',
  },
  {
    id: 'analytics',
    label: 'Trophy Analytics',
    labelEn: 'Trophy Analytics',
    shortLabel: 'Analytics',
    shortLabelEn: 'Analytics',
    icon: BarChart3,
    accentColor: 'text-purple-400',
  },
];

export const ScreenDropdownBadge: React.FC<ScreenDropdownBadgeProps> = ({
  activeTab,
  onSelectTab,
  spotsCount,
  catchesCount,
  onOpenTideGraph,
  onOpenCompass,
  onOpenTackleBox,
  onOpenPatternPrediction,
  onOpenBackup,
  onOpenPrivacyPolicy,
  onOpenManual,
  hasSampleData,
  onToggleSampleData,
}) => {
  const { isEn, unitSystem, setUnitSystem, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0];
  const CurrentIcon = currentTab.icon;
  const currentTabLabel = isEn ? currentTab.labelEn : currentTab.label;

  const getCountBadge = (tabId: ScreenTabType) => {
    if (tabId === 'spots' && spotsCount !== undefined) {
      return spotsCount;
    }
    if (tabId === 'catches' && catchesCount !== undefined) {
      return catchesCount;
    }
    return null;
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left shrink-0">
      {/* Trigger Badge */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all border shadow-sm shrink-0 ${
          isOpen
            ? 'bg-slate-800 text-white border-sky-500 ring-2 ring-sky-500/20 shadow-sky-950/40'
            : 'bg-slate-800/90 hover:bg-slate-800 text-slate-100 border-slate-700/80 hover:border-slate-600'
        }`}
        title="Screen & Tools menu"
      >
        <CurrentIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${currentTab.accentColor}`} />
        <span className="whitespace-nowrap flex items-center">
          <span className="inline sm:hidden">{currentTab.shortLabelEn}</span>
          <span className="hidden sm:inline">{currentTabLabel}</span>
          {currentTab.id === 'spots' && spotsCount !== undefined && (
            <span className="ml-1 text-[10px] text-slate-400 font-mono font-normal hidden md:inline">({spotsCount})</span>
          )}
          {currentTab.id === 'catches' && catchesCount !== undefined && (
            <span className="ml-1 text-[10px] text-slate-400 font-mono font-normal hidden md:inline">({catchesCount})</span>
          )}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-sky-400' : ''
          }`}
        />
      </button>

      {/* Invisible backdrop for mobile touch & outside dismiss */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[1190]"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-1.5 w-64 sm:w-72 max-w-[calc(100vw-1.5rem)] max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-[1200] animate-in fade-in slide-in-from-top-2 duration-150 divide-y divide-slate-800"
        >
          {/* Section 1: Main Screens */}
          <div className="pb-2">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between mb-1">
              <span>Views & Screens</span>
              <span className="text-[9px] text-sky-400 font-mono font-semibold">VIEWS</span>
            </div>

            <div className="space-y-0.5">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const count = getCountBadge(tab.id);
                const label = tab.labelEn;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onSelectTab(tab.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all ${
                      isActive
                        ? 'bg-sky-500/20 text-white font-bold border border-sky-500/40 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${tab.accentColor}`} />
                      <span className="truncate">{label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {count !== null && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                            isActive
                              ? 'bg-sky-500/30 text-sky-200'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                      {isActive ? (
                        <Check className="w-3.5 h-3.5 text-sky-400" />
                      ) : (
                        <div className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Tactical Fishing Support Tools */}
          {(onOpenTideGraph || onOpenCompass || onOpenTackleBox || onOpenPatternPrediction) && (
            <div className="py-2">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between mb-1">
                <span>Tactical Fishing Tools</span>
                <span className="text-[9px] text-cyan-400 font-mono font-semibold">TOOLS</span>
              </div>

              <div className="space-y-0.5">
                {onOpenTideGraph && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenTideGraph();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-slate-300 hover:text-cyan-200 hover:bg-cyan-950/30 transition-all group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center shrink-0">
                        <Waves className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <span className="truncate font-medium">Tide Graph & Lunar Curve</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  </button>
                )}

                {onOpenCompass && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenCompass();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-slate-300 hover:text-sky-200 hover:bg-sky-950/30 transition-all group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-sky-950/60 border border-sky-800/40 flex items-center justify-center shrink-0">
                        <Wind className="w-3.5 h-3.5 text-sky-400" />
                      </div>
                      <span className="truncate font-medium">Digital Compass & Wind</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 transition-colors" />
                  </button>
                )}

                {onOpenTackleBox && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenTackleBox();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-slate-300 hover:text-amber-200 hover:bg-amber-950/30 transition-all group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-amber-950/60 border border-amber-800/40 flex items-center justify-center shrink-0">
                        <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <span className="truncate font-medium">My Tackle Box</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                  </button>
                )}

                {onOpenPatternPrediction && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenPatternPrediction();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-slate-300 hover:text-purple-200 hover:bg-purple-950/30 transition-all group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-purple-950/60 border border-purple-800/40 flex items-center justify-center shrink-0">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <span className="truncate font-medium">Bite & Pattern Predictor</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 transition-colors" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Data Management & Help */}
          {(onOpenBackup || onOpenPrivacyPolicy || onOpenManual) && (
            <div className="py-2">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between mb-1">
                <span>Data & Help</span>
                <span className="text-[9px] text-emerald-400 font-mono font-semibold">HELP</span>
              </div>

              <div className="space-y-0.5">
                {onOpenManual && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenManual();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-slate-300 hover:text-sky-200 hover:bg-sky-950/30 transition-all group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-sky-950/60 border border-sky-800/40 flex items-center justify-center shrink-0">
                        <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                      </div>
                      <span className="truncate font-medium">User Guide & Manual</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 transition-colors shrink-0" />
                  </button>
                )}

                {onOpenBackup && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenBackup();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-slate-300 hover:text-emerald-200 hover:bg-emerald-950/30 transition-all group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center shrink-0">
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="truncate font-medium">Backup & Restore</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0" />
                  </button>
                )}

                {onToggleSampleData && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsOpen(false);
                      onToggleSampleData();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-slate-300 hover:text-amber-200 hover:bg-amber-950/30 transition-all group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-amber-950/60 border border-amber-800/40 flex items-center justify-center shrink-0 text-[11px]">
                        🔰
                      </div>
                      <span className="truncate font-medium">
                        {hasSampleData ? 'Clear Demo Sample Data' : 'Reload Demo Sample Data'}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0" />
                  </button>
                )}

                {onOpenPrivacyPolicy && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenPrivacyPolicy();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-slate-300 hover:text-emerald-200 hover:bg-emerald-950/30 transition-all group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="truncate font-medium">Privacy Policy</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Section 5: Unit System Switcher */}
          <div className="pt-2">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between mb-1">
              <span className="flex items-center gap-1">
                <span>📐</span>
                <span>Unit System</span>
              </span>
              <span className="text-[9px] text-sky-400 font-mono font-semibold">
                {unitSystem === 'metric' ? 'METRIC' : 'IMPERIAL'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setUnitSystem('metric')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all ${
                  unitSystem === 'metric'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="cm / kg / m/s / °C"
              >
                cm / kg / m/s
              </button>
              <button
                type="button"
                onClick={() => setUnitSystem('imperial')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all ${
                  unitSystem === 'imperial'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="inch / lb / knots / °F"
              >
                in / lb / kt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

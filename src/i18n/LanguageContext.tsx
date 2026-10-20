import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations, Translations } from './translations';
import { 
  UnitSystem, 
  UNIT_LABELS, 
  UnitLabels, 
  formatFishLength, 
  formatFishWeight, 
  formatWindSpeed, 
  formatTemperature, 
  formatTideHeight, 
  formatWaveHeight, 
  formatDepth 
} from '../utils/unitConversion';

interface LanguageContextType {
  lang: Language;
  setLanguage: (lang: Language) => void;
  unitSystem: UnitSystem;
  setUnitSystem: (system: UnitSystem) => void;
  units: UnitLabels;
  t: Translations;
  isPt: boolean;
  isIt: boolean;
  isEs: boolean;
  isDe: boolean;
  isFr: boolean;
  isEn: boolean;
  // Formatters that respect current unitSystem
  formatLength: (cm: number | undefined | null) => string;
  formatWeight: (grams: number | undefined | null) => string;
  formatWind: (speedMs: number | undefined | null) => string;
  formatTemp: (tempC: number | undefined | null) => string;
  formatTide: (heightCm: number | undefined | null) => string;
  formatWave: (meters: number | undefined | null) => string;
  formatDepth: (meters: number | undefined | null) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_UNIT_KEY = 'anglerlog_unit_system';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Edição portuguesa permanente
  const lang: Language = 'pt';

  const [unitSystem, setUnitSystemState] = useState<UnitSystem>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_UNIT_KEY);
      if (saved === 'metric' || saved === 'imperial') return saved;
    }
    // Norma portuguesa e europeia: Sistema métrico (cm, kg, km/h, °C) predefinido
    return 'metric';
  });

  const setLanguage = (_newLang: Language) => {
    // Fixo em português
  };

  const setUnitSystem = (system: UnitSystem) => {
    setUnitSystemState(system);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_UNIT_KEY, system);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = 'pt';
    }
  }, []);

  const value: LanguageContextType = {
    lang,
    setLanguage,
    unitSystem,
    setUnitSystem,
    units: UNIT_LABELS[unitSystem],
    t: translations.pt,
    isPt: true,
    isIt: false,
    isEs: false,
    isDe: false,
    isFr: false,
    isEn: false,
    formatLength: (cm) => formatFishLength(cm, unitSystem),
    formatWeight: (grams) => formatFishWeight(grams, unitSystem),
    formatWind: (speedMs) => formatWindSpeed(speedMs, unitSystem),
    formatTemp: (tempC) => formatTemperature(tempC, unitSystem),
    formatTide: (heightCm) => formatTideHeight(heightCm, unitSystem),
    formatWave: (meters) => formatWaveHeight(meters, unitSystem),
    formatDepth: (meters) => formatDepth(meters, unitSystem),
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

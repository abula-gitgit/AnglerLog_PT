import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  MapPin, 
  Camera, 
  HardDrive, 
  AlertTriangle, 
  HelpCircle, 
  X, 
  CheckCircle2, 
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

interface PrivacyPolicyModalProps {
  onClose: () => void;
  onOpenBackup?: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  onClose,
  onOpenBackup,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<'summary' | 'full'>('summary');

  const handleCopySummary = () => {
    const text = `[AnglerLog Privacy Policy Summary]
1. 100% On-Device Local Storage: Your fishing waypoints, GPS coordinates, catch photos, and tackle setups are never sent to external cloud servers; they are stored exclusively in your browser's IndexedDB. Your secret spots remain entirely confidential.
2. Geolocation (GPS): Used solely for rendering local map views and calculating wind angles; no tracking or server-side telemetry is ever performed.
3. Photo Storage: Photos are stored locally in your device's browser database.
4. Data Sovereignty: You can export and restore complete backups as a standalone JSON file at any time.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-[1300] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="privacy-modal-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Privacy Policy & Data Protection
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                  100% Local Storage
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Protecting your secret fishing spots, GPS waypoints, and trophy records
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="px-4 sm:px-6 pt-3 pb-2 bg-slate-900/50 border-b border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveSection('summary')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeSection === 'summary'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Quick Summary
            </button>
            <button
              onClick={() => setActiveSection('full')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeSection === 'full'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Terms & Legal
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/privacy/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-sky-400 hover:text-white bg-sky-950/40 hover:bg-sky-900/60 border border-sky-800/50 rounded-xl transition-colors"
              title="Open full policy page in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Web Page (/privacy/)</span>
              <span className="sm:hidden">Web</span>
            </a>

            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition-colors"
              title="Copy summary to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copy Summary</span>
                  <span className="sm:hidden">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-300 text-xs sm:text-sm leading-relaxed">
          
          {activeSection === 'summary' ? (
            <div className="space-y-4">
              
              {/* Highlight Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-sky-950/60 via-slate-900 to-indigo-950/50 border border-sky-500/30">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 shrink-0 mt-0.5">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm sm:text-base">
                      Three Core Security Guarantees for Anglers
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-normal">
                      AnglerLog is engineered from the ground up as a private offline fishing journal. The secret spots, flats coordinates, and honey holes you worked hard to discover will never be published to a public feed, shared with third parties, or uploaded to a remote database.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-xs mb-1.5">
                    <HardDrive className="w-4 h-4 shrink-0" />
                    <span>1. Local-Only Storage</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-normal">
                    All waypoints, catch records, catch photos, and tackle setups are saved solely to your browser IndexedDB. No centralized server sync.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1.5">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>2. Private Geolocation</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-normal">
                    GPS coordinates are processed entirely inside your client browser to center maps and compute wind angles. Zero tracking.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs mb-1.5">
                    <Camera className="w-4 h-4 shrink-0" />
                    <span>3. EXIF & Photo Privacy</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-normal">
                    Trophy photos remain stored inside local browser storage. They are never uploaded to social platforms or external cloud servers.
                  </p>
                </div>
              </div>

              {/* Data Safety & Backup recommendation */}
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-400 space-y-1">
                  <span className="font-bold text-slate-200">
                    Recommended Data Backup Practice
                  </span>
                  <p>
                    Because data lives directly inside your browser storage, clearing website cookies or browsing history may remove stored items. Use the "Data Management & Backup" menu to export your data to a secure JSON file periodically.
                  </p>
                </div>
              </div>

            </div>
          ) : (
            <div className="space-y-6 text-slate-300">
              
              <section className="space-y-2">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
                  Article 1 (Purpose & Core Principle)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  AnglerLog ("the Application") provides anglers worldwide with a reliable, offline-first personal fishing log and marine waypoint journal. The application is built on the core principle of total privacy: all user logs remain on the client device.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
                  Article 2 (Collection & Processing of Data)
                </h3>
                <div className="space-y-2 text-xs text-slate-400">
                  <p>
                    1. Waypoint & Coordinate Data: Latitude, longitude, spot notes, water depths, and bottom structure are stored locally in IndexedDB.
                  </p>
                  <p>
                    2. Catch Records & Gear: Fish species, lengths, weights, tackle setups, and lure notes are stored locally.
                  </p>
                  <p>
                    3. Real-Time Geolocation: GPS and network geolocation are queried solely within the client browser to center map views and fetch local marine weather from public APIs (Open-Meteo). Geolocation is never logged or stored by the Application developer.
                  </p>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
                  Article 3 (Third-Party Services & External APIs)
                </h3>
                <div className="space-y-2 text-xs text-slate-400">
                  <p>
                    1. Open-Meteo Weather API: Fetches public atmospheric pressure, temperature, wind vectors, and wave height data using spot latitude and longitude.
                  </p>
                  <p>
                    2. NOAA CO-OPS Tidal API: Provides harmonic water level predictions for US and international coastal reference stations.
                  </p>
                  <p>
                    3. Map Tile Providers (Esri, CartoDB, OpenTopoMap): Public map tiles are retrieved to render visual map layers in your browser.
                  </p>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
                  Article 4 (Backup & Data Protection)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Because all information is held in the browser IndexedDB, users are strongly advised to export JSON backups to their private cloud drive or personal storage on a regular basis.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-amber-500 rounded-full inline-block"></span>
                  Article 5 (Safety & Marine Disclaimer)
                </h3>
                <div className="space-y-2 text-xs text-slate-400">
                  <p>
                    Tide charts, solunar bite times, and weather data provided by AnglerLog are predictive estimates. Real-world water heights, ocean currents, rips, and weather can vary significantly based on local topography and offshore storms.
                  </p>
                  <p className="text-amber-300">
                    Always consult official marine safety authorities (US Coast Guard, NOAA, local maritime agencies), wear a certified personal flotation device (PFD/life jacket), and respect restricted access areas. The developer assumes no liability for accidents or damages arising from the use of this application.
                  </p>
                </div>
              </section>

              <section className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-1">
                  <span>Effective Date: October 2026</span>
                  <span>AnglerLog Global Team</span>
                </div>
              </section>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-slate-900/95">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Waypoints & catches are stored locally on your device</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {onOpenBackup && (
              <button
                onClick={() => {
                  onClose();
                  onOpenBackup();
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-colors border border-slate-700"
              >
                Open Backup
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-sky-950"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

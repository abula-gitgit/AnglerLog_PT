import React, { useState, useEffect } from 'react';
import { CatchLog, StoredPhoto } from '../../types/fishing';
import { useLanguage } from '../../i18n/LanguageContext';
import { formatTideName, formatTideState, formatSpeciesName, formatSpotName } from '../../utils/formatI18n';
import { 
  X, Download, Share2, Copy, Check, ShieldCheck, Sparkles
} from 'lucide-react';

interface CatchShareModalProps {
  isOpen: boolean;
  catchLog: CatchLog;
  photos: StoredPhoto[];
  onClose: () => void;
}

type CardFormat = 'square' | 'portrait';
type ThemeMode = 'ocean' | 'dark' | 'midnight';

export const CatchShareModal: React.FC<CatchShareModalProps> = ({
  isOpen,
  catchLog,
  photos,
  onClose,
}) => {
  const { formatLength, formatWeight, formatTemp, formatWind } = useLanguage();
  const [format, setFormat] = useState<CardFormat>('square');
  const [theme, setTheme] = useState<ThemeMode>('ocean');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(photos.length > 0 ? 0 : -1);
  const [showTackle, setShowTackle] = useState<boolean>(true);
  const [showWeather, setShowWeather] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    if (photos.length > 0 && selectedPhotoIndex === -1) {
      setSelectedPhotoIndex(0);
    }
  }, [photos.length]);

  useEffect(() => {
    if (isOpen) {
      generateImage();
    }
  }, [isOpen, format, theme, selectedPhotoIndex, showTackle, showWeather, catchLog]);

  const generateImage = async () => {
    setIsGenerating(true);
    try {
      const canvas = document.createElement('canvas');
      const width = 1080;
      const height = format === 'square' ? 1080 : 1350;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Draw Background
      const activePhoto = selectedPhotoIndex >= 0 && photos[selectedPhotoIndex] ? photos[selectedPhotoIndex] : null;

      if (activePhoto && activePhoto.dataUrl) {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const imgAspect = img.width / img.height;
            const canvasAspect = width / height;
            let drawW = width;
            let drawH = height;
            let drawX = 0;
            let drawY = 0;

            if (imgAspect > canvasAspect) {
              drawW = height * imgAspect;
              drawX = (width - drawW) / 2;
            } else {
              drawH = width / imgAspect;
              drawY = (height - drawH) / 2;
            }

            ctx.drawImage(img, drawX, drawY, drawW, drawH);

            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, 'rgba(8, 15, 30, 0.78)');
            gradient.addColorStop(0.35, 'rgba(8, 15, 30, 0.25)');
            gradient.addColorStop(0.65, 'rgba(8, 15, 30, 0.68)');
            gradient.addColorStop(1, 'rgba(5, 10, 20, 0.96)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            resolve();
          };
          img.onerror = () => {
            drawFallbackGradient(ctx, width, height, theme);
            resolve();
          };
          img.src = activePhoto.dataUrl;
        });
      } else {
        drawFallbackGradient(ctx, width, height, theme);
      }

      // Outer accent border
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, width - 14, height - 14);

      // Inner subtle border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.strokeRect(28, 28, width - 56, height - 56);

      // 2. Header: Logo & Protected Spot Badge
      ctx.fillStyle = '#38bdf8';
      ctx.font = '800 26px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('ANGLERLOG', 50, 75);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('PRIVATE FISHING JOURNAL', 50, 96);

      // Protected Spot Confidential Badge (Right Top)
      const badgeText = '📍 LOCATION: SECRET (PROTECTED)';
      ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
      const badgeWidth = ctx.measureText(badgeText).width + 32;
      const badgeX = width - 50 - badgeWidth;
      
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      roundRect(ctx, badgeX, 55, badgeWidth, 36, 18);
      ctx.fill();
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fda4af';
      ctx.fillText(badgeText, badgeX + 16, 79);

      // 3. Date & Environmental Banner
      let curY = 150;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
      const timeStr = catchLog.time ? ` ${catchLog.time}` : '';
      ctx.fillText(`${catchLog.date}${timeStr}`, 50, curY);

      curY += 34;
      if (showWeather && catchLog.weather) {
        const w = catchLog.weather;
        const envParts: string[] = [];
        if (w.tideName) {
          const tideStr = formatTideName(w.tideName);
          const stateStr = w.tideState ? ` (${formatTideState(w.tideState)})` : '';
          envParts.push(`Tide: ${tideStr}${stateStr}`);
        }
        if (w.temperature !== undefined) envParts.push(`Air: ${formatTemp(w.temperature)}`);
        if (w.waterTemperature !== undefined) envParts.push(`Water: ${formatTemp(w.waterTemperature)}`);
        if (w.windDirection && w.windSpeedMs !== undefined) envParts.push(`Wind: ${w.windDirection} ${formatWind(w.windSpeedMs)}`);
        if (w.pressureHpa) envParts.push(`${w.pressureHpa} hPa`);

        if (envParts.length > 0) {
          ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
          ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(envParts.join('  •  '), 50, curY);
          curY += 28;
        }
      }

      // Divider line
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(50, curY);
      ctx.lineTo(width - 50, curY);
      ctx.stroke();

      // 4. Main Focus: Fish Species, Size, Weight
      let bottomY = height - 65;

      // Bottom Branding Bar
      ctx.fillStyle = 'rgba(148, 163, 184, 0.78)';
      ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('RECORDED WITH ANGLERLOG • ZERO EXIF LEAKS • ANGLER-LOG.APP', 50, bottomY);

      bottomY -= 35;

      // Tackle & Lure Info Box
      if (showTackle && (catchLog.lureOrBait || catchLog.actionOrRange || catchLog.tackle?.rod)) {
        const infoItems: string[] = [];
        if (catchLog.lureOrBait) infoItems.push(`LURE / BAIT: ${catchLog.lureOrBait}`);
        if (catchLog.actionOrRange) infoItems.push(`PRESENTATION: ${catchLog.actionOrRange.slice(0, 52)}`);
        if (catchLog.tackle?.rod) infoItems.push(`ROD: ${catchLog.tackle.rod}`);
        if (catchLog.tackle?.reel) infoItems.push(`REEL: ${catchLog.tackle.reel}`);
        if (catchLog.tackle?.mainLine) infoItems.push(`LINE: ${catchLog.tackle.mainLine}`);

        const displayItems = infoItems.slice(0, 4);
        const boxH = displayItems.length * 30 + 26;
        const boxY = bottomY - boxH;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        roundRect(ctx, 50, boxY, width - 100, boxH, 16);
        ctx.fill();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        let textY = boxY + 32;
        ctx.font = '600 17px "Plus Jakarta Sans", sans-serif';
        for (const item of displayItems) {
          ctx.fillStyle = 'rgba(224, 242, 254, 0.92)';
          ctx.fillText(item, 72, textY);
          textY += 30;
        }

        bottomY = boxY - 28;
      }

      // Hero Fish Catch Specs
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 58px "Plus Jakarta Sans", sans-serif';
      const speciesName = catchLog.isNoCatch ? 'Angeltag-Bericht' : formatSpeciesName(catchLog.species);
      ctx.fillText(speciesName, 50, bottomY - 92);

      if (!catchLog.isNoCatch && (catchLog.sizeCm || catchLog.weightGrams || catchLog.quantity)) {
        let specX = 50;
        if (catchLog.sizeCm) {
          ctx.fillStyle = '#38bdf8';
          ctx.font = '900 76px "Plus Jakarta Sans", sans-serif';
          const sizeText = formatLength(catchLog.sizeCm);
          ctx.fillText(sizeText, specX, bottomY);
          const sizeW = ctx.measureText(sizeText).width;
          specX += sizeW + 48;
        }

        if (catchLog.weightGrams) {
          ctx.fillStyle = '#fbbf24';
          ctx.font = '900 60px "Plus Jakarta Sans", sans-serif';
          const weightFormatted = formatWeight(catchLog.weightGrams);
          ctx.fillText(weightFormatted, specX, bottomY);
          const weightW = ctx.measureText(weightFormatted).width;
          specX += weightW + 48;
        }

        if (catchLog.quantity && catchLog.quantity > 1) {
          ctx.fillStyle = '#a7f3d0';
          ctx.font = 'bold 42px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(`${catchLog.quantity} Landed`, specX, bottomY - 4);
        }
      }

      const url = canvas.toDataURL('image/png');
      setPreviewUrl(url);
    } catch (err) {
      console.error('Error generating card:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const drawFallbackGradient = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number,
    themeMode: ThemeMode
  ) => {
    const gradient = ctx.createRadialGradient(
      width * 0.5, height * 0.4, 80,
      width * 0.5, height * 0.5, width * 0.85
    );

    if (themeMode === 'ocean') {
      gradient.addColorStop(0, '#0c4a6e');
      gradient.addColorStop(0.5, '#07243c');
      gradient.addColorStop(1, '#030d17');
    } else if (themeMode === 'dark') {
      gradient.addColorStop(0, '#1e293b');
      gradient.addColorStop(0.5, '#0f172a');
      gradient.addColorStop(1, '#020617');
    } else {
      gradient.addColorStop(0, '#1e1b4b');
      gradient.addColorStop(0.6, '#0f172a');
      gradient.addColorStop(1, '#020617');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    for (let y = 80; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(width - 40, y);
      ctx.stroke();
    }
  };

  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    const safeDate = catchLog.date.replace(/[^0-9]/g, '');
    const safeSpecies = (catchLog.species || 'fish').replace(/\s+/g, '_');
    a.download = `AnglerLog_${safeSpecies}_${safeDate}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (!previewUrl) return;
    try {
      const blob = await (await fetch(previewUrl)).blob();
      const file = new File([blob], `AnglerLog_${catchLog.species}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Catch: ${formatSpeciesName(catchLog.species)}`,
          text: `Cattura condivisa con AnglerLog (Posizione GPS protetta) #Pesca #AnglerLog`,
          files: [file]
        });
      } else {
        handleDownload();
      }
    } catch (err) {
      console.warn('Share canceled or failed:', err);
    }
  };

  const handleCopy = async () => {
    if (!previewUrl) return;
    try {
      const blob = await (await fetch(previewUrl)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      handleDownload();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[94vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-sky-950 shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex flex-wrap items-center gap-2">
                <span>Generatore Scheda Cattura</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>GPS Segreto Protetto</span>
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Nasconde completamente le coordinate GPS e il nome esatto dello spot, mostrando le tue catture e i dettagli tecnici.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Split View */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-5 p-4 sm:p-6">
          
          {/* Controls Column (5 cols) */}
          <div className="md:col-span-5 space-y-4 text-xs">
            
            {/* Format Option */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <label className="font-bold text-slate-300 block">Proporzioni Scheda</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('square')}
                  className={`py-2 px-3 rounded-xl font-bold border text-center transition-all ${
                    format === 'square'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Quadrato (1:1)
                  <span className="block text-[10px] font-normal text-slate-400">Post Social / Instagram</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('portrait')}
                  className={`py-2 px-3 rounded-xl font-bold border text-center transition-all ${
                    format === 'portrait'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Verticale (4:5)
                  <span className="block text-[10px] font-normal text-slate-400">Storie / Feed Verticale</span>
                </button>
              </div>
            </div>

            {/* Theme & Photo Option */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <label className="font-bold text-slate-300 block">Tema di Sfondo & Fotografia</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setTheme('ocean')}
                  className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition-all ${
                    theme === 'ocean' ? 'bg-sky-500/20 text-sky-300 border-sky-500/50' : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Oceano Profondo
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition-all ${
                    theme === 'dark' ? 'bg-sky-500/20 text-sky-300 border-sky-500/50' : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Lavagna Tattica
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('midnight')}
                  className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition-all ${
                    theme === 'midnight' ? 'bg-sky-500/20 text-sky-300 border-sky-500/50' : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Mezzanotte
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedPhotoIndex(-1)}
                  className={`px-3 py-2 rounded-xl font-bold border text-center transition-all flex items-center gap-1.5 ${
                    selectedPhotoIndex === -1
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Senza foto (Gradiente)</span>
                </button>

                {photos.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedPhotoIndex === idx
                        ? 'border-sky-400 scale-105'
                        : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Content Toggles */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <label className="font-bold text-slate-300 block">Dettagli da Mostrare</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showWeather}
                    onChange={(e) => setShowWeather(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700"
                  />
                  <span>Includi marea, temperatura e vento</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showTackle}
                    onChange={(e) => setShowTackle(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700"
                  />
                  <span>Mostra esche e attrezzatura da pesca</span>
                </label>
              </div>
            </div>

            {/* Privacy Guarantee Note */}
            <div className="p-3.5 rounded-2xl bg-sky-950/30 border border-sky-500/30 text-sky-200 text-[11px] leading-relaxed flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold mb-0.5">100% Privacy Guaranteed</div>
                Spot name "{formatSpotName(catchLog.spotName)}" and GPS coordinates are never drawn on the card. All EXIF metadata is stripped locally on your device.
              </div>
            </div>

          </div>

          {/* Preview Column (7 cols) */}
          <div className="md:col-span-7 flex flex-col items-center justify-center bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mb-3"></div>
                <span>Rendering card image...</span>
              </div>
            ) : previewUrl ? (
              <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-2xl border border-slate-700">
                <img src={previewUrl} alt="Catch Card Preview" className="w-full h-auto object-contain" />
              </div>
            ) : null}
          </div>

        </div>

        {/* Footer Action Buttons */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            {copied ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" />
                <span>Copied to clipboard! Ready to paste into social media</span>
              </span>
            ) : (
              <span>Generated 100% locally in your browser (Zero server uploads)</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Image</span>
            </button>

            <button
              onClick={handleShare}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Condividi Scheda</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Save PNG</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

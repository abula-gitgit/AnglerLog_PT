import React, { useState, useMemo } from 'react';
import { TackleSet, CatchLog } from '../../types/fishing';
import { saveTackle, deleteTackle } from '../../services/db';
import { DeleteConfirmModal } from '../Common/DeleteConfirmModal';
import { 
  Briefcase, Plus, Edit2, Trash2, Check, Star, 
  Fish, Award, X, Sparkles, 
  Search, ArrowRight, AlertCircle
} from 'lucide-react';

interface TackleBoxModalProps {
  tackles: TackleSet[];
  catches: CatchLog[];
  onClose: () => void;
  onTacklesUpdated: () => void;
  onSelectTackleForCatch?: (tackle: TackleSet) => void;
}

interface TacklePreset {
  title: string;
  targetFish: string;
  name: string;
  rod: string;
  reel: string;
  mainLine: string;
  leader: string;
  favoriteLures: string[];
  notes: string;
}

const STARTER_PRESETS: TacklePreset[] = [
  {
    title: '🐟 Striped Bass / Inshore Coastal',
    targetFish: 'Striped Bass',
    name: 'Inshore Bass Technical',
    rod: '9ft Medium-Light Fast Action',
    reel: '3000 Series Spinning Reel (6.2:1)',
    mainLine: 'PE #0.8 (16lb Braid) 150m',
    leader: 'Fluorocarbon 16lb 4ft',
    favoriteLures: ['SP Minnow 15F', 'Paddle Tail Swimbait 4"', 'Vibration Blade 1/2oz'],
    notes: 'Tailored for bridge shadow lines, river mouths, and slow retrieves along current rips.',
  },
  {
    title: '🎣 Largemouth Bass / Freshwater',
    targetFish: 'Largemouth Bass',
    name: 'Versatile Medium Baitcaster',
    rod: '6ft 10in Medium-Heavy Fast Baitcaster',
    reel: '7.1:1 High Speed Baitcast Reel',
    mainLine: '14lb 100% Fluorocarbon',
    leader: 'Direct tie',
    favoriteLures: ['Chatterbait 3/8oz', 'Senko 5" Green Pumpkin', 'Squarebill Crankbait'],
    notes: 'All-around setup for pitching docks, working grass lines, and swimming jigs.',
  },
  {
    title: '✨ Finesse / Ultralight Trout & Panfish',
    targetFish: 'Trout / Panfish',
    name: 'Ultralight Finesse Spin',
    rod: '6ft Ultralight Slow Action',
    reel: '1000 Series Shallow Spool Spinning',
    mainLine: '4lb Monofilament / Ester Line',
    leader: 'Fluorocarbon 3lb 3ft',
    favoriteLures: ['1/32oz Micro Jighead + 1.5" Grub', 'Rooster Tail Spinner 1/16oz', 'Micro Spoon 1.5g'],
    notes: 'Ultralight setup designed to detect subtle takes and protect micro-diameter lines.',
  },
  {
    title: '🌊 Surf & Jetty / Coastal Pelagics',
    targetFish: 'Flounder / Bluefish / Mackerel',
    name: 'Surf & Long Distance Casting',
    rod: '10ft Heavy Surf Casting Rod',
    reel: '5000 Series Saltwater Spinning Reel',
    mainLine: 'PE #1.5 (30lb Braid) 300m',
    leader: 'Fluorocarbon 30lb 6ft',
    favoriteLures: ['Casting Jig 2oz', 'Bucktail Jig 1.5oz', 'Metal Spoon 40g'],
    notes: 'Maximum distance and heavy duty hardware to withstand breaking waves and rocky shores.',
  },
];

const TARGET_SUGGESTIONS = [
  'Striped Bass', 'Largemouth Bass', 'Trout', 'Redfish', 
  'Flounder', 'Snook', 'Bluefish', 'Crappie'
];

export const TackleBoxModal: React.FC<TackleBoxModalProps> = ({
  tackles,
  catches,
  onClose,
  onTacklesUpdated,
  onSelectTackleForCatch,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingTackle, setEditingTackle] = useState<Partial<TackleSet> | null>(null);
  const [lureInput, setLureInput] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TackleSet | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTargetFilter, setSelectedTargetFilter] = useState<string>('all');
  const [showPresetsInForm, setShowPresetsInForm] = useState<boolean>(false);

  // Compute available target fish categories for filter
  const targetFilterOptions = useMemo(() => {
    const set = new Set<string>();
    tackles.forEach((t) => {
      if (t.targetFish?.trim()) set.add(t.targetFish.trim());
    });
    return Array.from(set);
  }, [tackles]);

  // Filtered tackles
  const filteredTackles = useMemo(() => {
    return tackles.filter((t) => {
      if (selectedTargetFilter !== 'all') {
        if (t.targetFish?.trim() !== selectedTargetFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = t.name.toLowerCase().includes(q);
        const matchRod = t.rod.toLowerCase().includes(q);
        const matchReel = t.reel.toLowerCase().includes(q);
        const matchLine = t.mainLine.toLowerCase().includes(q);
        const matchTarget = t.targetFish?.toLowerCase().includes(q);
        const matchLure = t.favoriteLures?.some((l) => l.toLowerCase().includes(q));
        if (!matchName && !matchRod && !matchReel && !matchLine && !matchTarget && !matchLure) {
          return false;
        }
      }
      return true;
    });
  }, [tackles, selectedTargetFilter, searchQuery]);

  const handleOpenAdd = () => {
    setEditingTackle({
      id: `tackle-${Date.now()}`,
      name: '',
      targetFish: '',
      rod: '',
      reel: '',
      mainLine: '',
      leader: '',
      favoriteLures: [],
      notes: '',
      isDefault: tackles.length === 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setLureInput('');
    setFormError(null);
    setShowPresetsInForm(tackles.length === 0);
    setIsEditing(true);
  };

  const handleOpenEdit = (tackle: TackleSet) => {
    setEditingTackle({ ...tackle });
    setLureInput(tackle.favoriteLures?.join(', ') || '');
    setFormError(null);
    setShowPresetsInForm(false);
    setIsEditing(true);
  };

  const handleApplyPreset = (preset: TacklePreset) => {
    setEditingTackle((prev) => ({
      ...prev,
      name: preset.name,
      targetFish: preset.targetFish,
      rod: preset.rod,
      reel: preset.reel,
      mainLine: preset.mainLine,
      leader: preset.leader,
      favoriteLures: preset.favoriteLures,
      notes: preset.notes,
    }));
    setLureInput(preset.favoriteLures.join(', '));
  };

  const handleQuickAddPreset = async (preset: TacklePreset) => {
    const isFirst = tackles.length === 0;
    const newTackle: TackleSet = {
      id: `tackle-${Date.now()}`,
      name: preset.name,
      targetFish: preset.targetFish,
      rod: preset.rod,
      reel: preset.reel,
      mainLine: preset.mainLine,
      leader: preset.leader,
      favoriteLures: preset.favoriteLures,
      notes: preset.notes,
      isDefault: isFirst,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveTackle(newTackle);
    onTacklesUpdated();
  };

  const handleSetDefault = async (tackleId: string) => {
    for (const t of tackles) {
      if (t.id === tackleId && !t.isDefault) {
        await saveTackle({ ...t, isDefault: true, updatedAt: new Date().toISOString() });
      } else if (t.id !== tackleId && t.isDefault) {
        await saveTackle({ ...t, isDefault: false, updatedAt: new Date().toISOString() });
      }
    }
    onTacklesUpdated();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTackle || !editingTackle.name?.trim()) {
      setFormError('Please enter a name for this tackle setup.');
      return;
    }

    const lures = lureInput
      .split(/[,、]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const updated: TackleSet = {
      id: editingTackle.id || `tackle-${Date.now()}`,
      name: editingTackle.name.trim(),
      targetFish: editingTackle.targetFish?.trim() || undefined,
      rod: editingTackle.rod?.trim() || '',
      reel: editingTackle.reel?.trim() || '',
      mainLine: editingTackle.mainLine?.trim() || '',
      leader: editingTackle.leader?.trim() || '',
      favoriteLures: lures,
      notes: editingTackle.notes?.trim() || '',
      isDefault: !!editingTackle.isDefault,
      createdAt: editingTackle.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If marked default, unmark others
    if (updated.isDefault) {
      for (const t of tackles) {
        if (t.id !== updated.id && t.isDefault) {
          await saveTackle({ ...t, isDefault: false });
        }
      }
    }

    await saveTackle(updated);
    setIsEditing(false);
    setEditingTackle(null);
    setFormError(null);
    onTacklesUpdated();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteTackle(deleteTarget.id);
      onTacklesUpdated();
      if (isEditing && editingTackle?.id === deleteTarget.id) {
        setIsEditing(false);
        setEditingTackle(null);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete tackle failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Compute stats per tackle
  const getTackleStats = (tackle: TackleSet) => {
    const matched = catches.filter(
      (c) =>
        c.tackle?.tackleSetId === tackle.id ||
        (tackle.rod && c.tackle?.rod?.toLowerCase().includes(tackle.rod.toLowerCase())) ||
        (tackle.name && c.tackle?.tackleSetName === tackle.name)
    );

    const totalFish = matched.reduce((acc, c) => acc + (c.quantity || 1), 0);
    const maxSize = matched.reduce((max, c) => Math.max(max, c.sizeCm || 0), 0);

    return { count: matched.length, totalFish, maxSize };
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        
        {/* Mobile pull handle bar */}
        <div className="sm:hidden w-10 h-1 bg-slate-700 rounded-full mx-auto my-2 shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:p-5 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight truncate">My Tackle Box</h2>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 shrink-0 whitespace-nowrap">
                  {filteredTackles.length !== tackles.length ? `${filteredTackles.length} / ${tackles.length}` : `${tackles.length} setups`}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden xs:block truncate">
                Manage your rods, reels, line systems, and confidence lures
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isEditing && (
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Setup</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar (when not editing and 2+ tackles) */}
        {!isEditing && tackles.length >= 2 && (
          <div className="px-3.5 sm:px-5 py-2.5 bg-slate-950/40 border-b border-slate-800/80 space-y-2 shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search setups, rods, reels, lures..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              {targetFilterOptions.length > 0 && (
                <select
                  value={selectedTargetFilter}
                  onChange={(e) => setSelectedTargetFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-sky-500 shrink-0 max-w-[140px] truncate"
                >
                  <option value="all">All Species</option>
                  {targetFilterOptions.map((tgt) => (
                    <option key={tgt} value={tgt}>
                      {tgt}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          
          {isEditing && editingTackle ? (
            /* Editing / Creating Form */
            <form onSubmit={handleSave} className="space-y-4 bg-slate-950/90 p-4 sm:p-5 rounded-2xl border border-slate-800 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-sky-400" />
                  <span>{editingTackle.name ? 'Modifica assetto' : 'Nuovo assetto / combo'}</span>
                </h3>
                
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>

              {/* Preset Loader Toggle for Form */}
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Auto-fill from popular setups</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPresetsInForm(!showPresetsInForm)}
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-medium"
                  >
                    {showPresetsInForm ? 'Close' : 'View Templates'}
                  </button>
                </div>

                {showPresetsInForm && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {STARTER_PRESETS.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className="text-left p-2.5 rounded-xl bg-slate-950 hover:bg-sky-950/40 border border-slate-800 hover:border-sky-500/50 transition-all text-xs space-y-1 group"
                      >
                        <div className="font-bold text-slate-200 group-hover:text-sky-300 flex items-center justify-between">
                          <span>{preset.title}</span>
                          <span className="text-[10px] text-sky-400 font-normal">Apply +</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {preset.rod} / {preset.reel}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="space-y-3.5">
                {/* 1. Basic Info */}
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tackle Setup Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Inshore Fluke Setup, Heavy Swimbait Rod"
                      value={editingTackle.name || ''}
                      onChange={(e) => setEditingTackle({ ...editingTackle, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Primary Target Species
                      </label>
                      <span className="text-[10px] text-slate-500">Tap to auto-fill</span>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g., Striped Bass, Redfish, Trout"
                      value={editingTackle.targetFish || ''}
                      onChange={(e) => setEditingTackle({ ...editingTackle, targetFish: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
                    />
                    {/* Suggestion Chips */}
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {TARGET_SUGGESTIONS.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setEditingTackle({ ...editingTackle, targetFish: sug })}
                          className="px-2 py-0.5 rounded-lg text-[11px] bg-slate-900 hover:bg-sky-950/60 text-slate-400 hover:text-sky-300 border border-slate-800 transition-colors whitespace-nowrap shrink-0"
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Gear Details: Rod & Reel */}
                <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800/80 space-y-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Rod & Reel Specifications
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Rod (Blank / Length / Action)</label>
                      <input
                        type="text"
                        placeholder="e.g., 7ft Medium Fast Spinning Rod"
                        value={editingTackle.rod || ''}
                        onChange={(e) => setEditingTackle({ ...editingTackle, rod: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Reel (Size / Model / Ratio)</label>
                      <input
                        type="text"
                        placeholder="e.g., 2500 Spinning Reel 6.0:1"
                        value={editingTackle.reel || ''}
                        onChange={(e) => setEditingTackle({ ...editingTackle, reel: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Line System: Main line & Leader */}
                <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800/80 space-y-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Line System
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-sky-300 mb-1">Filo madre / Trecciato</label>
                      <input
                        type="text"
                        placeholder="e.g., 20lb Braided Line 200yd"
                        value={editingTackle.mainLine || ''}
                        onChange={(e) => setEditingTackle({ ...editingTackle, mainLine: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-cyan-300 mb-1">Terminale (Fluorocarbon / Finale)</label>
                      <input
                        type="text"
                        placeholder="e.g., 15lb Fluorocarbon Leader 4ft"
                        value={editingTackle.leader || ''}
                        onChange={(e) => setEditingTackle({ ...editingTackle, leader: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Favorite Lures */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confidence Lures / Rigs
                  </label>
                  <p className="text-[11px] text-slate-500 mb-1">
                    Separate multiple lures with commas (,)
                  </p>
                  <input
                    type="text"
                    placeholder="e.g., Jighead 3/8oz + Swimbait, Topwater Popper, Kastmaster 1/2oz"
                    value={lureInput}
                    onChange={(e) => setLureInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* 5. Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Setup Notes & Rigging Reminders
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g., Light drag setting for delicate hooksets. Carry spare spool with 15lb fluorocarbon for rocky structure."
                    value={editingTackle.notes || ''}
                    onChange={(e) => setEditingTackle({ ...editingTackle, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Default checkbox & Action buttons */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:bg-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={editingTackle.isDefault || false}
                    onChange={(e) => setEditingTackle({ ...editingTackle, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 text-sky-500 focus:ring-0"
                  />
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/50" />
                    <span className="font-semibold text-white">Set as Default Tackle</span>
                    <span className="text-[11px] text-slate-400">(Pre-selected when logging catches)</span>
                  </div>
                </label>

                <div className="flex items-center justify-between gap-2">
                  {editingTackle.id && tackles.some((t) => t.id === editingTackle.id) ? (
                    <button
                      type="button"
                      onClick={() => {
                        const target = tackles.find((t) => t.id === editingTackle.id);
                        if (target) setDeleteTarget(target);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 border border-rose-900/60 rounded-xl text-xs font-semibold transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setFormError(null);
                      }}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Setup</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            /* Tackle Cards List */
            <>
              {tackles.length === 0 ? (
                /* Empty state with starter presets */
                <div className="p-5 sm:p-7 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <p className="text-sm sm:text-base font-bold text-white">No tackle setups registered yet</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Register your rods, reels, line setups, and confidence lures to auto-populate them in one tap when recording catches.
                    </p>
                  </div>

                  {/* Quick Starter Templates */}
                  <div className="space-y-2 pt-2 text-left max-w-lg mx-auto">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                      One-Tap Starter Templates
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {STARTER_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuickAddPreset(preset)}
                          className="p-3 bg-slate-900/90 hover:bg-sky-950/40 border border-slate-800 hover:border-sky-500/50 rounded-xl text-left transition-all group flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-200 group-hover:text-sky-300">
                              {preset.title}
                            </span>
                            <span className="text-[10px] text-sky-400 font-semibold flex items-center gap-0.5">
                              Add <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 leading-snug">
                            {preset.rod}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleOpenAdd}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl shadow-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Custom Setup</span>
                    </button>
                  </div>
                </div>
              ) : filteredTackles.length === 0 ? (
                /* No matches for search query */
                <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 space-y-2">
                  <Search className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-300">No matching tackle setups found</p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedTargetFilter('all'); }}
                    className="text-xs text-sky-400 hover:underline"
                  >
                    Reset Search Filter
                  </button>
                </div>
              ) : (
                /* List of Tackle Cards */
                <div className="grid grid-cols-1 gap-3 sm:gap-3.5">
                  {filteredTackles.map((tackle) => {
                    const stats = getTackleStats(tackle);
                    return (
                      <div
                        key={tackle.id}
                        className="p-3.5 sm:p-4 bg-slate-950/80 hover:bg-slate-950 rounded-2xl border border-slate-800 space-y-3 transition-colors relative group"
                      >
                        {/* Title Bar & Badges */}
                        <div className="flex flex-col xs:flex-row xs:items-start justify-between gap-2.5">
                          <div className="space-y-1.5 min-w-0 flex-1">
                            {/* Tackle Name & Badges */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight break-words">
                                {tackle.name}
                              </h3>

                              {tackle.isDefault ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-950 shrink-0 whitespace-nowrap">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  Default
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSetDefault(tackle.id)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-slate-400 hover:text-amber-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors shrink-0 whitespace-nowrap"
                                  title="Click to set as default"
                                >
                                  <Star className="w-3 h-3" />
                                  <span>Set as Default</span>
                                </button>
                              )}

                              {tackle.targetFish && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30 shrink-0 whitespace-nowrap">
                                  <Fish className="w-2.5 h-2.5" />
                                  <span>Target: {tackle.targetFish}</span>
                                </span>
                              )}
                            </div>

                            {/* Catch Stats Badge */}
                            {stats.count > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] bg-emerald-950/30 border border-emerald-800/40 rounded-xl px-2.5 py-1 text-emerald-300 font-semibold w-fit">
                                <span className="flex items-center gap-1 whitespace-nowrap shrink-0">
                                  <Fish className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  Record: {stats.totalFish} fish ({stats.count} outings)
                                </span>
                                {stats.maxSize > 0 && (
                                  <span className="flex items-center gap-1 text-amber-300 font-mono pl-1.5 border-l border-emerald-800/60 whitespace-nowrap shrink-0">
                                    <Award className="w-3 h-3 text-amber-400 shrink-0" />
                                    Max {stats.maxSize} cm
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action Toolbar */}
                          <div className="flex items-center gap-1.5 shrink-0 self-end xs:self-start">
                            {onSelectTackleForCatch && (
                              <button
                                onClick={() => onSelectTackleForCatch(tackle)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center gap-1 mr-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Use</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenEdit(tackle)}
                              className="p-2 text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors"
                              title="Edit tackle"
                              aria-label="Edit tackle"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-sky-400" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(tackle);
                              }}
                              className="p-2 text-slate-400 hover:text-rose-400 bg-slate-900/80 hover:bg-rose-950/40 rounded-xl border border-slate-800 transition-colors"
                              title="Delete tackle"
                              aria-label="Delete tackle"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="bg-slate-900/90 rounded-xl border border-slate-800/90 overflow-hidden divide-y divide-slate-800/70 text-xs">
                          
                          {/* Mobile View */}
                          <div className="sm:hidden p-3 space-y-2.5">
                            <div className="space-y-1.5">
                              <div className="flex items-start gap-2">
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-800/90 px-1.5 py-0.5 rounded shrink-0 w-12 text-center">
                                  Rod
                                </span>
                                <span className="font-semibold text-slate-100 text-xs leading-snug break-words flex-1">
                                  {tackle.rod || <span className="text-slate-500 font-normal italic">Unset</span>}
                                </span>
                              </div>

                              <div className="flex items-start gap-2">
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-800/90 px-1.5 py-0.5 rounded shrink-0 w-12 text-center">
                                  Reel
                                </span>
                                <span className="font-semibold text-slate-100 text-xs leading-snug break-words flex-1">
                                  {tackle.reel || <span className="text-slate-500 font-normal italic">Unset</span>}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-800/60">
                              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                                <span className="text-[10px] text-slate-400 block font-medium mb-0.5">Filo madre</span>
                                <span className="font-semibold text-sky-300 text-xs font-mono break-words block leading-snug">
                                  {tackle.mainLine || <span className="text-slate-500 font-normal italic">Unset</span>}
                                </span>
                              </div>

                              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                                <span className="text-[10px] text-slate-400 block font-medium mb-0.5">Vorfach</span>
                                <span className="font-semibold text-cyan-300 text-xs font-mono break-words block leading-snug">
                                  {tackle.leader || <span className="text-slate-500 font-normal italic">Unset</span>}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Desktop View */}
                          <div className="hidden sm:grid sm:grid-cols-4 gap-3 p-3 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium mb-1">Canna</span>
                              <span className="font-semibold text-white break-words block leading-snug">
                                {tackle.rod || <span className="text-slate-500 font-normal italic">Unset</span>}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium mb-1">Mulinello</span>
                              <span className="font-semibold text-white break-words block leading-snug">
                                {tackle.reel || <span className="text-slate-500 font-normal italic">Unset</span>}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium mb-1">Filo madre</span>
                              <span className="font-semibold text-sky-300 break-words block leading-snug font-mono">
                                {tackle.mainLine || <span className="text-slate-500 font-normal italic">Unset</span>}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium mb-1">Terminale</span>
                              <span className="font-semibold text-cyan-300 break-words block leading-snug font-mono">
                                {tackle.leader || <span className="text-slate-500 font-normal italic">Unset</span>}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Confidence Lures Chips */}
                        {tackle.favoriteLures && tackle.favoriteLures.length > 0 && (
                          <div className="space-y-1.5 pt-0.5">
                            <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-semibold">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              <span>Esche di fiducia ({tackle.favoriteLures.length})</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {tackle.favoriteLures.map((lure, lIdx) => (
                                <span
                                  key={lIdx}
                                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900 text-slate-200 border border-slate-700/80 shadow-sm hover:border-slate-600 transition-colors whitespace-nowrap shrink-0"
                                >
                                  {lure}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Setting Notes */}
                        {tackle.notes && (
                          <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/60 text-xs text-slate-300 flex items-start gap-2">
                            <span className="text-amber-400 shrink-0 text-sm">💡</span>
                            <span className="break-words leading-relaxed text-[11px]">{tackle.notes}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

        </div>

      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Elimina assetto"
        message={`Sei sicuro di voler eliminare "${deleteTarget?.name}"?`}
        subMessage="Nota: Le catture registrate con questa attrezzatura manterranno la loro descrizione testuale."
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  X,
  Copy,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  ArrowRight,
  Sparkles,
  Repeat,
  Layers,
  Zap,
  Sun,
  Moon,
  Sunrise,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AgendaEvent, FamilyMember, RoutineTemplate, RoutineActivity, TimeOfDay } from '../types/family';
import { soundEffects, spreekBericht } from '../utils/audio';
import { IconVisual } from './IconVisual';
import {
  getTodayDateStr,
  parseLocalDate,
  addDays,
  getWeekMonday,
  formatDutchFullDate,
} from '../utils/dateUtils';

interface CopyEventsModalProps {
  isOpen: boolean;
  events: AgendaEvent[];
  members: FamilyMember[];
  initialSourceDate?: string;
  initialSelectedEventId?: string;
  onBatchCopyEvents: (copiedEvents: AgendaEvent[]) => void;
  onSaveCustomRoutine?: (template: RoutineTemplate) => void;
  onClose: () => void;
}

export type CopyMode = 'dagdeel' | 'volledigedag' | 'selectie' | 'week';
export type SelectedDagdeel = 'ochtend' | 'middag' | 'avond' | 'all';

export const CopyEventsModal: React.FC<CopyEventsModalProps> = ({
  isOpen,
  events,
  members,
  initialSourceDate,
  initialSelectedEventId,
  onBatchCopyEvents,
  onSaveCustomRoutine,
  onClose,
}) => {
  const todayStr = useMemo(() => getTodayDateStr(), []);

  // Copy Mode: 'volledigedag', 'dagdeel', 'selectie', or 'week'
  const [copyMode, setCopyMode] = useState<CopyMode>(
    initialSelectedEventId ? 'selectie' : 'volledigedag'
  );

  // Selected Dagdeel filter when in 'dagdeel' mode
  const [selectedDagdeel, setSelectedDagdeel] = useState<SelectedDagdeel>('ochtend');

  // Source Date for day/selectie modes
  const [sourceDate, setSourceDate] = useState<string>(initialSourceDate || todayStr);

  // Filter events on source date
  const sourceDayEvents = useMemo(() => {
    return events
      .filter((e) => e.date === sourceDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [events, sourceDate]);

  // Group source day events by dagdeel
  const groupedSourceEvents = useMemo(() => {
    const ochtend = sourceDayEvents.filter(
      (e) => e.timeOfDay === 'ochtend' || parseInt(e.startTime.split(':')[0], 10) < 12
    );
    const middag = sourceDayEvents.filter(
      (e) =>
        (e.timeOfDay === 'middag' ||
          (parseInt(e.startTime.split(':')[0], 10) >= 12 &&
            parseInt(e.startTime.split(':')[0], 10) < 17)) &&
        !ochtend.includes(e)
    );
    const avond = sourceDayEvents.filter(
      (e) =>
        (e.timeOfDay === 'avond' || parseInt(e.startTime.split(':')[0], 10) >= 17) &&
        !ochtend.includes(e) &&
        !middag.includes(e)
    );
    return { ochtend, middag, avond };
  }, [sourceDayEvents]);

  // Selected event IDs to copy from source day
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>(() => {
    if (initialSelectedEventId) return [initialSelectedEventId];
    return sourceDayEvents.map((e) => e.id);
  });

  // Whenever source day or copy mode changes, update selected event IDs automatically
  React.useEffect(() => {
    if (initialSelectedEventId && copyMode === 'selectie') {
      return;
    }

    if (copyMode === 'volledigedag') {
      setSelectedEventIds(sourceDayEvents.map((e) => e.id));
    } else if (copyMode === 'dagdeel') {
      if (selectedDagdeel === 'ochtend') {
        setSelectedEventIds(groupedSourceEvents.ochtend.map((e) => e.id));
      } else if (selectedDagdeel === 'middag') {
        setSelectedEventIds(groupedSourceEvents.middag.map((e) => e.id));
      } else if (selectedDagdeel === 'avond') {
        setSelectedEventIds(groupedSourceEvents.avond.map((e) => e.id));
      } else {
        setSelectedEventIds(sourceDayEvents.map((e) => e.id));
      }
    } else if (copyMode === 'selectie') {
      // Keep existing selection or select all if empty
      if (selectedEventIds.length === 0) {
        setSelectedEventIds(sourceDayEvents.map((e) => e.id));
      }
    }
  }, [sourceDate, copyMode, selectedDagdeel, sourceDayEvents, groupedSourceEvents, initialSelectedEventId]);

  // Target Destination Dates mode
  const [targetType, setTargetType] = useState<'single' | 'multidays' | 'nextweek'>('single');
  const [targetDate, setTargetDate] = useState<string>(() => addDays(sourceDate || todayStr, 1));

  // Multi-day selection (weekdays: 1=Ma, 2=Di, ..., 7=Zo)
  const [targetWeekdays, setTargetWeekdays] = useState<number[]>([1, 2, 3, 4, 5]); // default Ma t/m Vr

  // Week copy mode: Source Monday & Target Monday
  const [sourceWeekMonday, setSourceWeekMonday] = useState<string>(() => getWeekMonday(todayStr));
  const [targetWeekMonday, setTargetWeekMonday] = useState<string>(() => addDays(getWeekMonday(todayStr), 7));

  // Error message & inline routine saving states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSavingRoutineOpen, setIsSavingRoutineOpen] = useState(false);
  const [customRoutineName, setCustomRoutineName] = useState('');

  // Re-sync when modal opens with new props
  React.useEffect(() => {
    if (isOpen) {
      const src = initialSourceDate || getTodayDateStr();
      setSourceDate(src);
      setTargetDate(addDays(src, 1));
      setSourceWeekMonday(getWeekMonday(src));
      setTargetWeekMonday(addDays(getWeekMonday(src), 7));
      setErrorMessage(null);
      setIsSavingRoutineOpen(false);

      if (initialSelectedEventId) {
        setCopyMode('selectie');
        setSelectedEventIds([initialSelectedEventId]);
      } else {
        setCopyMode('volledigedag');
      }
    }
  }, [isOpen, initialSourceDate, initialSelectedEventId]);

  if (!isOpen) return null;

  // Toggle single event to copy
  const handleToggleEvent = (evId: string) => {
    soundEffects.playTap();
    if (selectedEventIds.includes(evId)) {
      setSelectedEventIds(selectedEventIds.filter((id) => id !== evId));
    } else {
      setSelectedEventIds([...selectedEventIds, evId]);
    }
  };

  // Toggle target weekday
  const handleToggleWeekday = (dayNum: number) => {
    soundEffects.playTap();
    if (targetWeekdays.includes(dayNum)) {
      if (targetWeekdays.length > 1) {
        setTargetWeekdays(targetWeekdays.filter((d) => d !== dayNum));
      }
    } else {
      setTargetWeekdays([...targetWeekdays, dayNum].sort());
    }
  };

  // Calculate target dates list safely using local date functions
  const destinationDates: string[] = [];
  if (copyMode === 'week') {
    // Week copy handled separately
  } else if (targetType === 'single') {
    destinationDates.push(targetDate);
  } else if (targetType === 'nextweek') {
    // Next week same weekday
    destinationDates.push(addDays(sourceDate, 7));
  } else {
    // Multi-days for current week matching selected weekdays
    const mondayStr = getWeekMonday(sourceDate);
    targetWeekdays.forEach((wDay) => {
      const dayDateStr = addDays(mondayStr, wDay - 1);
      if (dayDateStr !== sourceDate || targetWeekdays.length === 1) {
        destinationDates.push(dayDateStr);
      }
    });
  }

  // Events in source week
  const sourceWeekEvents = useMemo(() => {
    if (copyMode !== 'week') return [];
    const mondayStr = sourceWeekMonday;
    const weekDays = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(mondayStr, i));
    return events.filter((e) => weekDays.includes(e.date));
  }, [events, sourceWeekMonday, copyMode]);

  // Execute Copy
  const handleExecuteCopy = () => {
    const copiedEvents: AgendaEvent[] = [];

    if (copyMode === 'week') {
      // Copy entire week
      if (sourceWeekEvents.length === 0) {
        setErrorMessage('Er zijn geen activiteiten gevonden in de geselecteerde week om te kopiëren.');
        return;
      }

      const diffDays = Math.round(
        (parseLocalDate(targetWeekMonday).getTime() - parseLocalDate(sourceWeekMonday).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      sourceWeekEvents.forEach((ev) => {
        const newDateStr = addDays(ev.date, diffDays);
        copiedEvents.push({
          ...ev,
          id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          date: newDateStr,
          completed: false,
        });
      });
    } else {
      // Day, dagdeel or selected activities
      const eventsToDuplicate = events.filter((e) => selectedEventIds.includes(e.id));

      if (eventsToDuplicate.length === 0) {
        setErrorMessage('Selecteer minimaal 1 activiteit om te kopiëren.');
        return;
      }

      if (destinationDates.length === 0) {
        setErrorMessage('Kies minimaal 1 doeldag om naar te kopiëren.');
        return;
      }

      destinationDates.forEach((destDate) => {
        eventsToDuplicate.forEach((ev) => {
          copiedEvents.push({
            ...ev,
            id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            date: destDate,
            completed: false,
          });
        });
      });
    }

    setErrorMessage(null);
    soundEffects.playVictoryFanfare();
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
    });

    onBatchCopyEvents(copiedEvents);
    spreekBericht(
      `${copiedEvents.length} activiteiten zijn succesvol in één keer gekopieerd en geplaatst!`
    );
    onClose();
  };

  const handleOpenSaveRoutineModal = () => {
    const selected = events.filter((e) => selectedEventIds.includes(e.id));
    if (selected.length === 0) {
      setErrorMessage('Selecteer minimaal 1 activiteit om op te slaan als vaste routine.');
      return;
    }
    setErrorMessage(null);
    setCustomRoutineName(`Mijn Routine (${selected.length} activiteiten)`);
    setIsSavingRoutineOpen(true);
  };

  const handleConfirmSaveCustomRoutine = () => {
    const selected = events.filter((e) => selectedEventIds.includes(e.id));
    if (selected.length === 0 || !customRoutineName.trim()) return;

    const routineActivities: RoutineActivity[] = selected.map((ev, idx) => ({
      id: `act_${Date.now()}_${idx}`,
      title: ev.title,
      startTime: ev.startTime,
      endTime: ev.endTime,
      iconId: ev.iconId,
      iconEmoji: ev.iconEmoji,
      iconImageDataUrl: ev.iconImageDataUrl,
      iconLabel: ev.iconLabel,
      timeOfDay: ev.timeOfDay,
      notes: ev.notes,
      isRoutine: true,
    }));

    const newTemplate: RoutineTemplate = {
      id: `rt_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: customRoutineName.trim(),
      description: `Zelfgemaakte routine met ${selected.length} activiteiten`,
      emoji: selected[0]?.iconEmoji || '⭐',
      category: 'aangepast',
      activities: routineActivities,
      isCustom: true,
    };

    if (onSaveCustomRoutine) {
      onSaveCustomRoutine(newTemplate);
    }
    setIsSavingRoutineOpen(false);
    soundEffects.playVictoryFanfare();
    confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    spreekBericht(`Routine "${newTemplate.name}" is succesvol opgeslagen in je bibliotheek!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto no-print">
      <div
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-blue-300 my-4 flex flex-col max-h-[94vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-100 via-sky-100 to-indigo-100 border-b border-blue-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-xs border-2 border-white">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>Activiteiten Kopiëren & Plakken</span>
                <span className="px-2 py-0.5 rounded-full bg-white text-[11px] font-black text-blue-900 border border-blue-300">
                  ⚡ Snel & Nauwkeurig
                </span>
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Kopieer volledige dagen, dagdelen (ochtend/middag/avond) of losse activiteiten in 1 klik
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-slate-600 shadow-xs transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              soundEffects.playTap();
              setCopyMode('volledigedag');
            }}
            className={`py-2 px-3.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              copyMode === 'volledigedag'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>📅 Volledige Dag Kopiëren</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playTap();
              setCopyMode('dagdeel');
            }}
            className={`py-2 px-3.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              copyMode === 'dagdeel'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Sunrise className="w-3.5 h-3.5" />
            <span>🌅 Dagdeel Kopiëren (Ochtend / Middag / Avond)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playTap();
              setCopyMode('selectie');
            }}
            className={`py-2 px-3.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              copyMode === 'selectie'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>📋 Vrije Selectie</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playTap();
              setCopyMode('week');
            }}
            className={`py-2 px-3.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              copyMode === 'week'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>🔁 Hele Week Dupliceren</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs font-bold flex items-center justify-between shadow-2xs">
              <span className="flex items-center gap-1.5">
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-600 hover:text-rose-900 font-black px-1 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Inline Save As Routine Dialog */}
          {isSavingRoutineOpen && (
            <div className="p-4 rounded-2xl bg-indigo-50 border-2 border-indigo-300 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-indigo-600" />
                  <span>Sla deze {selectedEventIds.length} activiteiten op als vaste herbruikbare routine</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsSavingRoutineOpen(false)}
                  className="text-indigo-400 hover:text-indigo-800 text-xs font-bold cursor-pointer"
                >
                  Annuleren
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customRoutineName}
                  onChange={(e) => setCustomRoutineName(e.target.value)}
                  placeholder="Bijv. Vaste Woensdagochtend of Weekendroutine..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-indigo-200 bg-white font-bold text-slate-800 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleConfirmSaveCustomRoutine}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer whitespace-nowrap"
                >
                  ✓ Opslaan in Bibliotheek
                </button>
              </div>
            </div>
          )}
          {/* ============================================================== */}
          {/* MODE 1, 2 & 3: DAG, DAGDEEL OF VRIJE SELECTIE                  */}
          {/* ============================================================== */}
          {copyMode !== 'week' && (
            <>
              {/* Step 1: Bron Dag & Wat wil je kopiëren? */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <label className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                    <span>1. Brondag (Waar vandaan?):</span>
                    <span className="text-blue-700 normal-case font-bold">
                      {formatDutchFullDate(sourceDate)}
                    </span>
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSourceDate(todayStr)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                        sourceDate === todayStr
                          ? 'bg-blue-100 border-blue-400 text-blue-900 font-black'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Vandaag
                    </button>
                    <button
                      type="button"
                      onClick={() => setSourceDate(addDays(todayStr, 1))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                        sourceDate === addDays(todayStr, 1)
                          ? 'bg-blue-100 border-blue-400 text-blue-900 font-black'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Morgen
                    </button>
                    <input
                      type="date"
                      value={sourceDate}
                      onChange={(e) => setSourceDate(e.target.value)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white font-bold"
                    />
                  </div>
                </div>

                {/* Specific Dagdeel selection bar (when in dagdeel mode or selectie mode) */}
                {copyMode === 'dagdeel' && (
                  <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 space-y-2">
                    <span className="text-[11px] font-black uppercase text-blue-950 tracking-wider block">
                      Kies het dagdeel om te kopiëren:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.playTap();
                          setSelectedDagdeel('ochtend');
                        }}
                        className={`p-2.5 rounded-xl border-2 flex items-center justify-between transition-all cursor-pointer ${
                          selectedDagdeel === 'ochtend'
                            ? 'bg-white border-blue-600 shadow-sm ring-2 ring-blue-300 text-blue-950 font-black'
                            : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🌅</span>
                          <div className="text-left leading-tight">
                            <span className="text-xs font-black block">Ochtend</span>
                            <span className="text-[10px] text-slate-500">Voor 12:00</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-xs font-black">
                          {groupedSourceEvents.ochtend.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.playTap();
                          setSelectedDagdeel('middag');
                        }}
                        className={`p-2.5 rounded-xl border-2 flex items-center justify-between transition-all cursor-pointer ${
                          selectedDagdeel === 'middag'
                            ? 'bg-white border-blue-600 shadow-sm ring-2 ring-blue-300 text-blue-950 font-black'
                            : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">☀️</span>
                          <div className="text-left leading-tight">
                            <span className="text-xs font-black block">Middag</span>
                            <span className="text-[10px] text-slate-500">12:00 - 17:00</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-xs font-black">
                          {groupedSourceEvents.middag.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.playTap();
                          setSelectedDagdeel('avond');
                        }}
                        className={`p-2.5 rounded-xl border-2 flex items-center justify-between transition-all cursor-pointer ${
                          selectedDagdeel === 'avond'
                            ? 'bg-white border-blue-600 shadow-sm ring-2 ring-blue-300 text-blue-950 font-black'
                            : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🌙</span>
                          <div className="text-left leading-tight">
                            <span className="text-xs font-black block">Avond</span>
                            <span className="text-[10px] text-slate-500">Na 17:00</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-xs font-black">
                          {groupedSourceEvents.avond.length}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Items to copy on source date */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 font-bold mb-1.5">
                    <span>
                      Geselecteerde activiteiten om te kopiëren ({selectedEventIds.length} van {sourceDayEvents.length}):
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedEventIds(sourceDayEvents.map((e) => e.id))}
                        className="text-blue-700 hover:underline font-bold"
                      >
                        Alles ({sourceDayEvents.length})
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setSelectedEventIds([])}
                        className="text-slate-500 hover:underline"
                      >
                        Wissen
                      </button>
                    </div>
                  </div>

                  {sourceDayEvents.length === 0 ? (
                    <div className="text-center py-6 bg-white rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                      Geen activiteiten gevonden op {formatDutchFullDate(sourceDate)}. Kies een andere datum met geplande activiteiten.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {sourceDayEvents.map((ev) => {
                        const isChecked = selectedEventIds.includes(ev.id);
                        return (
                          <div
                            key={ev.id}
                            onClick={() => handleToggleEvent(ev.id)}
                            className={`p-2.5 rounded-xl border-2 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-white border-blue-500 shadow-2xs font-black text-slate-900'
                                : 'bg-slate-100/80 border-slate-200 opacity-60 text-slate-600'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                                  isChecked
                                    ? 'bg-blue-600 text-white'
                                    : 'border border-slate-300 bg-white'
                                }`}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <IconVisual emoji={ev.iconEmoji} imageDataUrl={ev.iconImageDataUrl} className="text-xl shrink-0" imageClassName="w-7 h-7 object-contain" />
                              <div className="min-w-0">
                                <span className="text-xs truncate block">
                                  {ev.title}
                                </span>
                                {ev.location && (
                                  <span className="text-[10px] text-slate-400 truncate block">
                                    📍 {ev.location}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 text-xs font-bold bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 text-slate-700">
                              <Clock className="w-3 h-3 text-blue-500" />
                              <span>{ev.startTime}</span>
                              {ev.endTime && <span> - {ev.endTime}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Waar wil je naartoe kopiëren / plakken? */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3.5">
                <label className="text-xs font-black uppercase text-amber-950 tracking-wider block">
                  2. Waar naartoe kopiëren (Doeldagen)?
                </label>

                {/* Target Type Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playTap();
                      setTargetType('single');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      targetType === 'single'
                        ? 'bg-amber-500 text-white shadow-xs font-black'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-100/50'
                    }`}
                  >
                    📅 1 Specifieke Dag
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playTap();
                      setTargetType('multidays');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      targetType === 'multidays'
                        ? 'bg-amber-500 text-white shadow-xs font-black'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-100/50'
                    }`}
                  >
                    🔁 Meerdere Weekdagen
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playTap();
                      setTargetType('nextweek');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      targetType === 'nextweek'
                        ? 'bg-amber-500 text-white shadow-xs font-black'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-100/50'
                    }`}
                  >
                    ⏩ Volgende Week Zelfde Dag
                  </button>
                </div>

                {/* Option A: Single Target Date */}
                {targetType === 'single' && (
                  <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setTargetDate(addDays(sourceDate, 1))}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 cursor-pointer"
                      >
                        Morgen (+1 dag)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTargetDate(addDays(sourceDate, 2))}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer"
                      >
                        Overmorgen (+2 dagen)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTargetDate(addDays(sourceDate, 7))}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer"
                      >
                        Volgende week (+7 dagen)
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600">Doeldag kiezen:</span>
                      <input
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-black"
                      />
                      <span className="text-xs font-bold text-amber-900">
                        ({formatDutchFullDate(targetDate)})
                      </span>
                    </div>
                  </div>
                )}

                {/* Option B: Multi-days selector */}
                {targetType === 'multidays' && (
                  <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        Kies de weekdagen van deze week om naar te plakken:
                      </span>
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setTargetWeekdays([1, 2, 3, 4, 5])}
                          className="text-amber-800 font-bold hover:underline"
                        >
                          Ma t/m Vr (Schoolweek)
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setTargetWeekdays([6, 7])}
                          className="text-amber-800 font-bold hover:underline"
                        >
                          Weekend
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setTargetWeekdays([1, 2, 3, 4, 5, 6, 7])}
                          className="text-amber-800 font-bold hover:underline"
                        >
                          Alle 7
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {[
                        { num: 1, label: 'Ma', name: 'Maandag' },
                        { num: 2, label: 'Di', name: 'Dinsdag' },
                        { num: 3, label: 'Wo', name: 'Woensdag' },
                        { num: 4, label: 'Do', name: 'Donderdag' },
                        { num: 5, label: 'Vr', name: 'Vrijdag' },
                        { num: 6, label: 'Za', name: 'Zaterdag' },
                        { num: 7, label: 'Zo', name: 'Zondag' },
                      ].map((day) => {
                        const isDaySelected = targetWeekdays.includes(day.num);
                        return (
                          <button
                            key={day.num}
                            type="button"
                            onClick={() => handleToggleWeekday(day.num)}
                            className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              isDaySelected
                                ? 'bg-amber-500 text-white shadow-2xs'
                                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                            }`}
                            title={day.name}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Option C: Next week same day info */}
                {targetType === 'nextweek' && (
                  <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs font-bold text-amber-950 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-amber-600" />
                    <span>
                      Wordt geplakt op exact dezelfde dag volgende week:{' '}
                      <strong>{formatDutchFullDate(addDays(sourceDate, 7))}</strong>
                    </span>
                  </div>
                )}

                {/* Destination Preview list */}
                <div className="text-xs text-slate-700 bg-white/70 p-2.5 rounded-xl border border-amber-200 flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold flex items-center gap-1">
                    <span>🎯 Doeldagen ({destinationDates.length}):</span>
                    <span className="text-amber-900 font-extrabold">
                      {destinationDates.map((d) => d.split('-').slice(1).reverse().join('/')).join(', ')}
                    </span>
                  </span>
                  <span className="font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                    Totaal nieuw: {selectedEventIds.length * destinationDates.length} afspraken
                  </span>
                </div>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* MODE 4: WEEK COPY                                              */}
          {/* ============================================================== */}
          {copyMode === 'week' && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-4">
              <span className="text-xs font-black uppercase text-indigo-950 tracking-wider block">
                Hele Week Kopiëren naar Volgende Week:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-3.5 rounded-xl border border-indigo-200 space-y-1">
                  <span className="text-xs font-bold text-slate-600 block">Bronweek (Maandag):</span>
                  <input
                    type="date"
                    value={sourceWeekMonday}
                    onChange={(e) => setSourceWeekMonday(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-black"
                  />
                  <span className="text-[11px] text-slate-500 font-semibold block mt-1">
                    Bevat {sourceWeekEvents.length} geplande activiteiten
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-indigo-200 space-y-1">
                  <span className="text-xs font-bold text-slate-600 block">Doelweek (Maandag):</span>
                  <input
                    type="date"
                    value={targetWeekMonday}
                    onChange={(e) => setTargetWeekMonday(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-black"
                  />
                  <span className="text-[11px] text-slate-500 font-semibold block mt-1">
                    Alle {sourceWeekEvents.length} afspraken worden hiernaartoe gedupliceerd
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with action buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {copyMode !== 'week' && onSaveCustomRoutine && selectedEventIds.length > 0 && (
              <button
                type="button"
                onClick={handleOpenSaveRoutineModal}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-white text-indigo-900 border border-indigo-200 hover:bg-indigo-50 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Sla deze geselecteerde activiteiten op als herbruikbare vaste routine"
              >
                <Zap className="w-3.5 h-3.5 text-indigo-600" />
                <span>Opslaan als Vaste Routine</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Annuleren
            </button>

            <button
              type="button"
              onClick={handleExecuteCopy}
              disabled={
                copyMode === 'week'
                  ? sourceWeekEvents.length === 0
                  : selectedEventIds.length === 0 || destinationDates.length === 0
              }
              className="px-6 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <Copy className="w-4 h-4" />
              <span>
                {copyMode === 'week'
                  ? `Kopieer Hele Week (${sourceWeekEvents.length} afspraken)`
                  : `Kopieer & Plak (${selectedEventIds.length * destinationDates.length} afspraken)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

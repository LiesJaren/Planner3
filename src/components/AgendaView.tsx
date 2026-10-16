import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Volume2,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Download,
  Clock,
  Sparkles,
  MapPin,
  Printer,
  Copy,
  Zap,
  Trash2,
  CalendarDays,
  Eye,
  Check,
  Sun,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AgendaEvent, FamilyMember, TimeOfDay } from '../types/family';
import { soundEffects, spreekBericht } from '../utils/audio';
import { IconVisual } from './IconVisual';
import { downloadICS } from '../utils/calendarExport';
import {
  getTodayDateStr,
  parseLocalDate,
  addDays,
  getWeekMonday,
  formatDutchFullDate,
  formatDutchShortDate,
  getDutchDayName,
} from '../utils/dateUtils';

export interface AgendaClipboard {
  type: 'day' | 'dagdeel';
  label: string;
  sourceDate: string;
  sourceDagdeel?: 'ochtend' | 'middag' | 'avond';
  events: AgendaEvent[];
}

interface AgendaViewProps {
  events: AgendaEvent[];
  members: FamilyMember[];
  initialDate?: string;
  initialViewType?: 'dag' | 'week';
  onAddEvent: (date?: string, timeOfDay?: TimeOfDay) => void;
  onEditEvent: (event: AgendaEvent) => void;
  onDeleteEvent?: (eventId: string) => void;
  onDuplicateEvent?: (event: AgendaEvent, targetDate?: string) => void;
  onClearDayEvents?: (dateStr: string) => void;
  onToggleComplete: (eventId: string) => void;
  onOpenPrintModal?: (dateStr?: string, scope?: 'week' | 'day') => void;
  onOpenInsertRoutineModal?: (dateStr?: string) => void;
  onOpenCopyModal?: (sourceDateStr?: string, eventId?: string) => void;
  onBatchInsertEvents?: (newEvents: AgendaEvent[]) => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  events,
  members,
  initialDate,
  initialViewType,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  onDuplicateEvent,
  onClearDayEvents,
  onToggleComplete,
  onOpenPrintModal,
  onOpenInsertRoutineModal,
  onOpenCopyModal,
  onBatchInsertEvents,
}) => {
  const [currentDateStr, setCurrentDateStr] = useState<string>(() => initialDate || getTodayDateStr());
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');
  const [viewType, setViewType] = useState<'dag' | 'week'>(() => initialViewType || 'week');
  const [speakingEventId, setSpeakingEventId] = useState<string | null>(null);

  useEffect(() => {
    if (initialDate) {
      setCurrentDateStr(initialDate);
    }
  }, [initialDate]);

  useEffect(() => {
    if (initialViewType) {
      setViewType(initialViewType);
    }
  }, [initialViewType]);

  // Fast 1-click clipboard for copying/pasting days and dagdelen
  const [clipboard, setClipboard] = useState<AgendaClipboard | null>(() => {
    try {
      const saved = localStorage.getItem('familieplanner_clipboard');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const todayStr = useMemo(() => getTodayDateStr(), []);
  const isToday = currentDateStr === todayStr;

  // Change date helpers (single day)
  const handlePrevDay = () => {
    soundEffects.playTap();
    setCurrentDateStr((prev) => addDays(prev, -1));
  };

  const handleNextDay = () => {
    soundEffects.playTap();
    setCurrentDateStr((prev) => addDays(prev, 1));
  };

  // Change week helpers (jump 7 days)
  const handlePrevWeek = () => {
    soundEffects.playTap();
    setCurrentDateStr((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    soundEffects.playTap();
    setCurrentDateStr((prev) => addDays(prev, 7));
  };

  const handleGoToday = () => {
    soundEffects.playTap();
    setCurrentDateStr(todayStr);
  };

  const handleSelectDay = (dateStr: string) => {
    soundEffects.playTap();
    setCurrentDateStr(dateStr);
  };

  // Instant Copy & Paste helpers for Days & Dagdelen
  const handleCopyDay = (dateStr: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundEffects.playTap();
    const evs = events.filter((ev) => ev.date === dateStr);
    if (evs.length === 0) {
      showToast('Er zijn geen activiteiten op deze dag om te kopiëren.');
      return;
    }
    const clip: AgendaClipboard = {
      type: 'day',
      label: `Hele dag (${formatDutchFullDate(dateStr)})`,
      sourceDate: dateStr,
      events: evs,
    };
    setClipboard(clip);
    try {
      localStorage.setItem('familieplanner_clipboard', JSON.stringify(clip));
    } catch {}
    showToast(`📋 ${evs.length} activiteiten gekopieerd! Klik op een andere dag op "📥 Plakken".`);
    spreekBericht(`Dag gekopieerd met ${evs.length} activiteiten! Klik op een andere dag om te plakken.`);
  };

  const handleCopyDagdeel = (
    dateStr: string,
    dagdeel: 'ochtend' | 'middag' | 'avond',
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    soundEffects.playTap();
    const dayEvs = events.filter((ev) => ev.date === dateStr);
    const dagdeelEvs = dayEvs.filter((ev) => {
      const h = parseInt(ev.startTime.split(':')[0], 10);
      if (dagdeel === 'ochtend') return ev.timeOfDay === 'ochtend' || h < 12;
      if (dagdeel === 'middag') return ev.timeOfDay === 'middag' || (h >= 12 && h < 17);
      return ev.timeOfDay === 'avond' || h >= 17;
    });

    if (dagdeelEvs.length === 0) {
      showToast(`Er zijn geen ${dagdeel}activiteiten op deze dag om te kopiëren.`);
      return;
    }

    const clip: AgendaClipboard = {
      type: 'dagdeel',
      label: `${dagdeel.toUpperCase()} (${formatDutchFullDate(dateStr)})`,
      sourceDate: dateStr,
      sourceDagdeel: dagdeel,
      events: dagdeelEvs,
    };
    setClipboard(clip);
    try {
      localStorage.setItem('familieplanner_clipboard', JSON.stringify(clip));
    } catch {}
    showToast(
      `📋 ${dagdeelEvs.length} ${dagdeel}activiteiten gekopieerd! Klik op "📥 Plakken" op een willekeurige dag.`
    );
    spreekBericht(`${dagdeel} gekopieerd met ${dagdeelEvs.length} activiteiten!`);
  };

  const handlePasteToDay = (targetDateStr: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!clipboard || clipboard.events.length === 0) {
      showToast('Kopieer eerst een dag of dagdeel voordat je kunt plakken.');
      return;
    }
    soundEffects.playVictoryFanfare();
    confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });

    const clonedEvents: AgendaEvent[] = clipboard.events.map((ev, idx) => ({
      ...ev,
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}_${idx}`,
      date: targetDateStr,
      completed: false,
    }));

    if (onBatchInsertEvents) {
      onBatchInsertEvents(clonedEvents);
    } else if (onDuplicateEvent) {
      clonedEvents.forEach((ev) => onDuplicateEvent(ev, targetDateStr));
    }
    showToast(
      `🎉 ${clonedEvents.length} activiteiten geplakt op ${formatDutchFullDate(targetDateStr)}!`
    );
    spreekBericht(`${clonedEvents.length} activiteiten geplakt!`);
  };

  const handlePasteToDagdeel = (
    targetDateStr: string,
    targetDagdeel: 'ochtend' | 'middag' | 'avond',
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    if (!clipboard || clipboard.events.length === 0) {
      showToast('Kopieer eerst een dag of dagdeel voordat je kunt plakken.');
      return;
    }
    soundEffects.playVictoryFanfare();
    confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });

    const clonedEvents: AgendaEvent[] = clipboard.events.map((ev, idx) => ({
      ...ev,
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}_${idx}`,
      date: targetDateStr,
      timeOfDay: targetDagdeel,
      completed: false,
    }));

    if (onBatchInsertEvents) {
      onBatchInsertEvents(clonedEvents);
    } else if (onDuplicateEvent) {
      clonedEvents.forEach((ev) => onDuplicateEvent(ev, targetDateStr));
    }
    showToast(`🎉 ${clonedEvents.length} activiteiten geplakt in ${targetDagdeel}!`);
    spreekBericht(`${clonedEvents.length} activiteiten geplakt!`);
  };

  const handleClearClipboard = () => {
    setClipboard(null);
    try {
      localStorage.removeItem('familieplanner_clipboard');
    } catch {}
    showToast('Klembord geleegd.');
  };

  // Format Dutch full date: "Dinsdag 13 oktober 2026"
  const formattedDutchDate = useMemo(() => {
    return formatDutchFullDate(currentDateStr);
  }, [currentDateStr]);

  // Calculate nights of sleep countdown
  const getNightsSleep = (eventDateStr: string) => {
    const today = parseLocalDate(todayStr);
    const target = parseLocalDate(eventDateStr);
    const diffMs = target.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Vandaag!';
    if (diffDays === 1) return 'Morgen (1 nachtje)';
    if (diffDays > 1) return `Nog ${diffDays} nachtjes slapen!`;
    return null;
  };

  // Compute 7 days of the currently selected week (Monday to Sunday)
  const weekDays = useMemo(() => {
    const mondayStr = getWeekMonday(currentDateStr);
    const days = [];

    for (let i = 0; i < 7; i++) {
      const str = addDays(mondayStr, i);
      const cur = parseLocalDate(str);
      const dayEvents = events
        .filter((e) => {
          const matchesDate = e.date === str;
          const matchesMember =
            selectedMemberFilter === 'all' ||
            e.memberIds.includes(selectedMemberFilter);
          return matchesDate && matchesMember;
        })
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      days.push({
        dateStr: str,
        dateObj: cur,
        name: cur.toLocaleDateString('nl-NL', { weekday: 'long' }),
        shortName: cur.toLocaleDateString('nl-NL', { weekday: 'short' }),
        dayNum: cur.getDate(),
        monthShort: cur.toLocaleDateString('nl-NL', { month: 'short' }),
        isCurrent: str === currentDateStr,
        isToday: str === todayStr,
        isWeekend: i >= 5,
        events: dayEvents,
        dayIndex: i,
      });
    }
    return days;
  }, [currentDateStr, events, selectedMemberFilter, todayStr]);

  // Week Title label
  const weekRangeTitle = useMemo(() => {
    if (weekDays.length < 7) return '';
    const first = weekDays[0];
    const last = weekDays[6];
    return `${first.dayNum} ${first.monthShort} t/m ${last.dayNum} ${last.monthShort} ${first.dateObj.getFullYear()}`;
  }, [weekDays]);

  // Filter events for the single selected day
  const dayEvents = useMemo(() => {
    return events
      .filter((e) => {
        const matchesDate = e.date === currentDateStr;
        const matchesMember =
          selectedMemberFilter === 'all' ||
          e.memberIds.includes(selectedMemberFilter);
        return matchesDate && matchesMember;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [events, currentDateStr, selectedMemberFilter]);

  const handleSpeak = (event: AgendaEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playTap();
    setSpeakingEventId(event.id);

    const involvedNames = event.memberIds
      .map((id) => members.find((m) => m.id === id)?.name.split(' ')[0])
      .filter(Boolean)
      .join(' en ');

    const textToSpeak = `Om ${event.startTime}: ${event.title}${
      involvedNames ? `, voor ${involvedNames}` : ''
    }${event.location ? `, in ${event.location}` : ''}.`;

    spreekBericht(textToSpeak, () => setSpeakingEventId(null));
  };

  const handleCheckRoutine = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleComplete(eventId);

    const ev = events.find((item) => item.id === eventId);
    if (!ev?.completed) {
      soundEffects.playSuccessChime();
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6'],
      });
      spreekBericht(`Super gedaan! ${ev?.title || 'Taak'} afgevinkt!`);
    } else {
      soundEffects.playTap();
    }
  };

  const handleExportICS = () => {
    soundEffects.playTap();
    downloadICS(events, members);
  };

  // Group current day's events by morning / noon / evening
  const groupedDayEvents = useMemo(() => {
    const ochtend = dayEvents.filter(
      (e) =>
        e.timeOfDay === 'ochtend' ||
        parseInt(e.startTime.split(':')[0], 10) < 12
    );
    const middag = dayEvents.filter(
      (e) =>
        (e.timeOfDay === 'middag' ||
          (parseInt(e.startTime.split(':')[0], 10) >= 12 &&
            parseInt(e.startTime.split(':')[0], 10) < 17)) &&
        !ochtend.includes(e)
    );
    const avond = dayEvents.filter(
      (e) =>
        (e.timeOfDay === 'avond' ||
          parseInt(e.startTime.split(':')[0], 10) >= 17) &&
        !ochtend.includes(e) &&
        !middag.includes(e)
    );
    return { ochtend, middag, avond };
  }, [dayEvents]);

  // Color & Badge config for days in week view
  const DAY_ACCENTS = [
    { badge: '🚀 Raketstart', border: 'border-sky-300', bg: 'bg-sky-50/50', header: 'bg-gradient-to-r from-sky-100 to-blue-100', text: 'text-sky-950', dot: 'bg-sky-500' },
    { badge: '🍀 Speurneus', border: 'border-emerald-300', bg: 'bg-emerald-50/50', header: 'bg-gradient-to-r from-emerald-100 to-teal-100', text: 'text-emerald-950', dot: 'bg-emerald-500' },
    { badge: '🎈 Speelmiddag', border: 'border-amber-300', bg: 'bg-amber-50/50', header: 'bg-gradient-to-r from-amber-100 to-yellow-100', text: 'text-amber-950', dot: 'bg-amber-500' },
    { badge: '⭐ Topperdag', border: 'border-purple-300', bg: 'bg-purple-50/50', header: 'bg-gradient-to-r from-purple-100 to-indigo-100', text: 'text-purple-950', dot: 'bg-purple-500' },
    { badge: '🎉 Bijna Weekend', border: 'border-pink-300', bg: 'bg-pink-50/50', header: 'bg-gradient-to-r from-pink-100 to-rose-100', text: 'text-pink-950', dot: 'bg-pink-500' },
    { badge: '⚽ Weekendpret', border: 'border-orange-400', bg: 'bg-orange-50/60', header: 'bg-gradient-to-r from-orange-200 to-amber-200', text: 'text-orange-950', dot: 'bg-orange-500' },
    { badge: '🥞 Gezinsdag', border: 'border-yellow-400', bg: 'bg-yellow-50/60', header: 'bg-gradient-to-r from-yellow-200 to-amber-200', text: 'text-yellow-950', dot: 'bg-yellow-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Planner Controls */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-md border-2 border-amber-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Week & Day Navigation Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center bg-amber-50 p-1 rounded-2xl border border-amber-200 shadow-2xs">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="px-2.5 py-1.5 rounded-xl hover:bg-white text-slate-700 text-xs font-bold transition-colors flex items-center gap-0.5"
                title="1 week terug (7 dagen)"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Vorige week</span>
              </button>
              <button
                type="button"
                onClick={handleGoToday}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isToday
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-amber-800 hover:bg-white'
                }`}
              >
                Vandaag
              </button>
              <button
                type="button"
                onClick={handleNextWeek}
                className="px-2.5 py-1.5 rounded-xl hover:bg-white text-slate-700 text-xs font-bold transition-colors flex items-center gap-0.5"
                title="1 week vooruit (7 dagen)"
              >
                <span className="hidden sm:inline">Volgende week</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 capitalize flex items-center gap-2">
                  <span>{viewType === 'week' ? `Week ${weekRangeTitle}` : formattedDutchDate}</span>
                  {isToday && (
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Vandaag
                    </span>
                  )}
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                {viewType === 'week'
                  ? `7 dagen in beeld • Klik op een dag om in te vullen of afspraken te bewerken`
                  : `${dayEvents.length} ${dayEvents.length === 1 ? 'activiteit' : 'activiteiten'} gepland voor deze dag`}
              </span>
            </div>
          </div>

          {/* Right Action buttons: View Switcher, Routines, Copy, Print & Add */}
          <div className="flex items-center flex-wrap gap-2">
            {/* View Switcher: 1 Bepaalde Dag vs Hele Week */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border-2 border-slate-300 shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  setViewType('dag');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewType === 'dag'
                    ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-300'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>📅 1 Bepaalde Dag Invullen</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  setViewType('week');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewType === 'week'
                    ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-300'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>🗓️ Hele Week (7 Dagen)</span>
              </button>
            </div>

            {/* Batch Routine Insert Button */}
            {onOpenInsertRoutineModal && (
              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  onOpenInsertRoutineModal(currentDateStr);
                }}
                className="px-3 py-2 rounded-2xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer active:scale-95"
                title="Voeg een vaste routine in (ochtend, school, avond etc.)"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-400" />
                <span className="hidden sm:inline">Routine Invoegen</span>
                <span className="sm:hidden">Routine</span>
              </button>
            )}

            {/* Batch Copy Button */}
            {onOpenCopyModal && (
              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  onOpenCopyModal(currentDateStr);
                }}
                className="px-3 py-2 rounded-2xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-200 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer active:scale-95"
                title="Kopieer dezelfde activiteiten naar andere dagen"
              >
                <Copy className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Kopiëren</span>
              </button>
            )}

            {/* Print 1 A4 */}
            {onOpenPrintModal && (
              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  onOpenPrintModal(currentDateStr, viewType === 'dag' ? 'day' : 'week');
                }}
                className="px-3 py-2 rounded-2xl text-xs font-bold bg-gradient-to-r from-amber-100 to-yellow-100 hover:from-amber-200 hover:to-yellow-200 text-amber-950 border border-amber-300 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer active:scale-95"
                title="Printen naar PDF op 1 pagina A4 formaat"
              >
                <Printer className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">
                  {viewType === 'dag' ? '🖨️ Print deze Dag (A4)' : '🖨️ Print Week (A4)'}
                </span>
              </button>
            )}

            {/* Export ICS */}
            <button
              type="button"
              onClick={handleExportICS}
              className="px-2.5 py-2 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
              title="Exporteer agenda naar .ics (Google/Apple Agenda)"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Big Primary Action: Add Event for selected day */}
            <button
              type="button"
              onClick={() => onAddEvent(currentDateStr)}
              className="px-4 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Afspraak</span>
            </button>
          </div>
        </div>

        {/* ACTIVE CLIPBOARD NOTIFICATION BANNER */}
        {clipboard && (
          <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-blue-100 via-indigo-50 to-blue-100 border-2 border-blue-400 shadow-sm flex items-center justify-between gap-3 flex-wrap animate-in fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl shrink-0">📋</span>
              <div>
                <span className="text-xs font-black text-blue-950 block">
                  Klembord actief: {clipboard.label} ({clipboard.events.length} activiteiten)
                </span>
                <span className="text-[11px] text-blue-800 font-medium">
                  Klik op een willekeurige dag op <strong>&apos;📥 Plakken&apos;</strong> om deze activiteiten direct in te voegen!
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handlePasteToDay(currentDateStr)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <span>📥 Plak op geselecteerde dag ({formatDutchShortDate(currentDateStr)})</span>
              </button>
              <button
                type="button"
                onClick={handleClearClipboard}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 cursor-pointer"
              >
                Wissen
              </button>
            </div>
          </div>
        )}

        {/* ALWAYS-VISIBLE 7-DAY INTERACTIVE SWITCHER BAR WITH DATEPICKER */}
        {/* Allows immediate 1-click day switching, showing dates, day names, event counts & active highlight */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <span>📅</span> Kies dag om te bekijken of in te vullen:
              </span>
              {/* Direct HTML5 Datepicker for picking any arbitrary day */}
              <input
                type="date"
                value={currentDateStr}
                onChange={(e) => {
                  if (e.target.value) handleSelectDay(e.target.value);
                }}
                className="px-2.5 py-1 text-xs font-bold rounded-xl border border-slate-300 bg-white cursor-pointer hover:border-amber-400"
                title="Kies een specifieke dag uit de kalender"
              />
              {!isToday && (
                <button
                  type="button"
                  onClick={handleGoToday}
                  className="px-2 py-0.5 rounded-lg text-xs font-black bg-amber-100 text-amber-950 hover:bg-amber-200 border border-amber-300 cursor-pointer"
                >
                  Naar Vandaag
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={handlePrevDay}
                className="px-2.5 py-1 rounded-xl text-slate-700 hover:bg-slate-100 font-bold border border-slate-200 cursor-pointer"
                title="1 dag terug"
              >
                ← Vorige dag
              </button>
              <span className="text-xs font-black text-amber-950 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                {formatDutchFullDate(currentDateStr)}
              </span>
              <button
                type="button"
                onClick={handleNextDay}
                className="px-2.5 py-1 rounded-xl text-slate-700 hover:bg-slate-100 font-bold border border-slate-200 cursor-pointer"
                title="1 dag vooruit"
              >
                Volgende dag →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {weekDays.map((wd) => {
              const accent = DAY_ACCENTS[wd.dayIndex] || DAY_ACCENTS[0];
              const isSelected = wd.isCurrent;

              return (
                <button
                  key={wd.dateStr}
                  type="button"
                  onClick={() => handleSelectDay(wd.dateStr)}
                  className={`flex flex-col items-center justify-between p-2 rounded-2xl border-2 transition-all cursor-pointer relative group text-left ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/90 shadow-md ring-2 ring-amber-400/40 scale-[1.02] z-10'
                      : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/40 shadow-2xs'
                  }`}
                >
                  {/* Top indicator: Day abbreviation */}
                  <div className="w-full flex items-center justify-between leading-none mb-1">
                    <span
                      className={`text-[10px] font-black uppercase ${
                        isSelected ? 'text-amber-950 font-extrabold' : 'text-slate-500'
                      }`}
                    >
                      {wd.shortName}
                    </span>
                    {wd.isToday && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" title="Vandaag" />
                    )}
                  </div>

                  {/* Day Date Number */}
                  <span
                    className={`text-base sm:text-lg font-black my-0.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-transform ${
                      wd.isToday
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : isSelected
                        ? 'bg-amber-200 text-amber-950'
                        : 'text-slate-800'
                    }`}
                  >
                    {wd.dayNum}
                  </span>

                  {/* Activity Badge Count */}
                  <div className="w-full flex items-center justify-center mt-1">
                    {wd.events.length > 0 ? (
                      <span
                        className={`text-[9.5px] font-black px-1.5 py-0.2 rounded-full ${
                          isSelected
                            ? 'bg-amber-500 text-white'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {wd.events.length} {wd.events.length === 1 ? 'afspraak' : 'afspraken'}
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-300 font-medium">vrij</span>
                    )}
                  </div>

                  {/* Quick Add Button on Day Hover/Focus */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      soundEffects.playTap();
                      onAddEvent(wd.dateStr);
                    }}
                    className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-amber-500 hover:bg-amber-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-black shadow-sm"
                    title={`+ Afspraak toevoegen voor ${wd.name}`}
                  >
                    +
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Member filter chips */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold text-slate-600 shrink-0">Filter op wie:</span>
            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                setSelectedMemberFilter('all');
              }}
              className={`px-3 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                selectedMemberFilter === 'all'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>👨‍👩‍👧‍👦</span>
              <span>Heel het Gezin</span>
            </button>

            {members.map((member) => {
              const isSelected = selectedMemberFilter === member.id;
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    soundEffects.playTap();
                    setSelectedMemberFilter(member.id);
                  }}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  style={{
                    backgroundColor: isSelected ? member.color : undefined,
                  }}
                >
                  <span>{member.avatar}</span>
                  <span>{member.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Quick shortcuts for selected day */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {onOpenInsertRoutineModal && (
              <button
                type="button"
                onClick={() => onOpenInsertRoutineModal(currentDateStr)}
                className="text-amber-800 hover:text-amber-950 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-400" />
                <span>Routine voor geselecteerde dag</span>
              </button>
            )}
            {dayEvents.length > 0 && onOpenCopyModal && (
              <>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => onOpenCopyModal(currentDateStr)}
                  className="text-blue-700 hover:text-blue-900 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-blue-600" />
                  <span>Kopieer deze dag</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: ECHT INTERACTIEF WEEKOVERZICHT (7 KOLOMMEN NAAST ELKAAR) */}
      {/* Elke dag apart invullen (+ Afspraak, + Routine), aanklikken en bewerken */}
      {/* ========================================================================= */}
      {viewType === 'week' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-slate-900">
                🗓️ Volledig Weekoverzicht: {weekRangeTitle}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black border border-amber-300">
                7 Dagen Interactief
              </span>
            </div>
            <span className="text-xs text-slate-500 font-semibold hidden md:inline">
              Klik op een afspraak om te bewerken • Klik op <strong className="text-amber-600">+</strong> om direct voor die dag in te vullen
            </span>
          </div>

          {/* 7 Columns Grid: 1 column per day */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
            {weekDays.map((wd) => {
              const accent = DAY_ACCENTS[wd.dayIndex] || DAY_ACCENTS[0];
              const isSelected = wd.isCurrent;

              return (
                <div
                  key={wd.dateStr}
                  className={`bg-white rounded-3xl border-2 transition-all flex flex-col overflow-hidden shadow-2xs hover:shadow-md ${
                    isSelected
                      ? 'border-amber-500 ring-2 ring-amber-400/30'
                      : wd.isWeekend
                      ? 'border-orange-200'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Day Column Header */}
                  <div
                    onClick={() => handleSelectDay(wd.dateStr)}
                    className={`p-3 border-b cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 border-amber-400'
                        : `${accent.header} border-slate-200 hover:opacity-90`
                    }`}
                  >
                    <div className="flex items-center justify-between leading-none mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                        {accent.badge}
                      </span>
                      {wd.isToday && (
                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[8px] font-black">
                          VANDAAG
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 capitalize">
                          {wd.shortName} {wd.dayNum} {wd.monthShort}
                        </h3>
                        <span className="text-[10px] font-bold text-slate-600">
                          {wd.events.length} {wd.events.length === 1 ? 'afspraak' : 'afspraken'}
                        </span>
                      </div>

                      {/* Day Focus Button - Vul deze dag in */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectDay(wd.dateStr);
                          setViewType('dag');
                        }}
                        className="px-2 py-1 rounded-xl text-[10px] font-black bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-500 hover:to-yellow-400 text-amber-950 border border-amber-400 shadow-2xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                        title={`Open en bewerk specifiek ${wd.name}`}
                      >
                        <Sun className="w-3 h-3 text-amber-900 fill-amber-300" />
                        <span>✏️ Vul in</span>
                      </button>
                    </div>

                    {/* Quick Add Actions for this specific day */}
                    <div className="grid grid-cols-2 gap-1 mt-2.5 pt-2 border-t border-black/10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundEffects.playTap();
                          onAddEvent(wd.dateStr);
                        }}
                        className="px-2 py-1.5 rounded-xl text-[11px] font-black bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-1 shadow-2xs transition-transform active:scale-95 cursor-pointer"
                        title={`Nieuwe afspraak toevoegen op ${wd.name}`}
                      >
                        <Plus className="w-3 h-3 stroke-[3]" />
                        <span>Afspraak</span>
                      </button>

                      {onOpenInsertRoutineModal && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            soundEffects.playTap();
                            onOpenInsertRoutineModal(wd.dateStr);
                          }}
                          className="px-2 py-1.5 rounded-xl text-[11px] font-black bg-white hover:bg-amber-50 text-amber-950 border border-amber-300 flex items-center justify-center gap-1 shadow-2xs transition-transform active:scale-95 cursor-pointer"
                          title={`Routine toevoegen op ${wd.name}`}
                        >
                          <Zap className="w-3 h-3 text-amber-600 fill-amber-400" />
                          <span>Routine</span>
                        </button>
                      )}
                    </div>

                    {/* Instant Paste button if clipboard is active */}
                    {clipboard && (
                      <button
                        type="button"
                        onClick={(e) => handlePasteToDay(wd.dateStr, e)}
                        className="w-full mt-1.5 px-2 py-1.5 rounded-xl text-[10px] font-black bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1 shadow-2xs transition-transform active:scale-95 cursor-pointer animate-pulse"
                        title={`Plak ${clipboard.events.length} activiteiten op ${wd.name}`}
                      >
                        <span>📥 Plak {clipboard.events.length} afspraken</span>
                      </button>
                    )}
                  </div>

                  {/* Day Column Events List */}
                  <div className="p-2 space-y-2 flex-1 min-h-[220px] bg-slate-50/50">
                    {wd.events.length === 0 ? (
                      <div
                        onClick={() => onAddEvent(wd.dateStr)}
                        className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-amber-400 bg-white/70 hover:bg-amber-50/50 transition-all cursor-pointer group"
                      >
                        <span className="text-2xl group-hover:scale-110 transition-transform">🎈</span>
                        <span className="text-xs font-black text-slate-700 mt-1">
                          Vrije dag
                        </span>
                        <span className="text-[10px] text-amber-700 font-bold mt-0.5 group-hover:underline">
                          + Klik om in te vullen
                        </span>
                      </div>
                    ) : (
                      wd.events.map((event) => {
                        const involvedMembers = members.filter((m) =>
                          event.memberIds.includes(m.id)
                        );

                        return (
                          <div
                            key={event.id}
                            onClick={() => onEditEvent(event)}
                            className={`p-2.5 rounded-2xl border-2 transition-all cursor-pointer shadow-2xs hover:shadow-md bg-white hover:border-amber-400 group relative ${
                              event.completed
                                ? 'border-emerald-200 bg-emerald-50/40 opacity-80'
                                : 'border-slate-200'
                            }`}
                            title="Klik om deze afspraak aan te passen"
                          >
                            <div className="flex items-start gap-2">
                              {/* Icon */}
                              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                                <IconVisual emoji={event.iconEmoji} imageDataUrl={event.iconImageDataUrl} imageClassName="w-7 h-7 object-contain" />
                              </div>

                              <div className="flex-1 min-w-0">
                                {/* Time & fast buttons */}
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[10px] font-black text-amber-900 bg-amber-100/80 px-1.5 py-0.2 rounded-md">
                                    {event.startTime}
                                    {event.endTime && ` - ${event.endTime}`}
                                  </span>

                                  {/* Quick Actions inside week card */}
                                  <div className="flex items-center gap-0.5 opacity-90 group-hover:opacity-100">
                                    {/* TTS */}
                                    <button
                                      type="button"
                                      onClick={(e) => handleSpeak(event, e)}
                                      className="w-5 h-5 rounded-md hover:bg-amber-100 text-amber-800 flex items-center justify-center"
                                      title="Lees voor"
                                    >
                                      <Volume2 className="w-3 h-3" />
                                    </button>

                                    {/* Duplicate */}
                                    {onDuplicateEvent && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          soundEffects.playTap();
                                          onDuplicateEvent(event);
                                        }}
                                        className="w-5 h-5 rounded-md hover:bg-blue-100 text-blue-700 flex items-center justify-center"
                                        title="Kopieer"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    )}

                                    {/* Delete */}
                                    {onDeleteEvent && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          soundEffects.playTap();
                                          if (
                                            window.confirm(
                                              `Weet je zeker dat je "${event.title}" wilt verwijderen?`
                                            )
                                          ) {
                                            onDeleteEvent(event.id);
                                          }
                                        }}
                                        className="w-5 h-5 rounded-md hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center"
                                        title="Verwijder"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Title */}
                                <h4
                                  className={`text-xs font-black text-slate-900 mt-1 truncate ${
                                    event.completed ? 'line-through text-slate-500' : ''
                                  }`}
                                >
                                  {event.title}
                                </h4>

                                {event.location && (
                                  <p className="text-[9px] text-slate-500 truncate flex items-center gap-0.5 mt-0.5">
                                    <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                    <span>{event.location}</span>
                                  </p>
                                )}

                                {/* Bottom card row: member dots & check */}
                                <div className="flex items-center justify-between gap-1 mt-1.5 pt-1 border-t border-slate-100">
                                  <div className="flex items-center gap-0.5 overflow-hidden">
                                    {involvedMembers.map((m) => (
                                      <span
                                        key={m.id}
                                        className="w-2 h-2 rounded-full inline-block shrink-0"
                                        style={{ backgroundColor: m.color }}
                                        title={m.name}
                                      />
                                    ))}
                                    <span className="text-[9px] font-bold text-slate-500 truncate ml-0.5">
                                      {involvedMembers.map((m) => m.name.split(' ')[0]).join(', ')}
                                    </span>
                                  </div>

                                  {/* Checkbox toggle */}
                                  <button
                                    type="button"
                                    onClick={(e) => handleCheckRoutine(event.id, e)}
                                    className="text-xs shrink-0 cursor-pointer p-0.5"
                                    title={event.completed ? 'Gereed' : 'Nog te doen'}
                                  >
                                    {event.completed ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    ) : (
                                      <Circle className="w-3.5 h-3.5 text-slate-300 hover:text-amber-500" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Day Footer quick bar */}
                  <div className="p-2 bg-white border-t border-slate-200 flex items-center justify-between text-[10px] flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => onAddEvent(wd.dateStr)}
                      className="text-amber-800 font-extrabold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 stroke-[3]" />
                      <span>Toevoegen</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {wd.events.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => handleCopyDay(wd.dateStr, e)}
                          className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-0.5 cursor-pointer"
                          title="Kopieer alle afspraken van deze dag"
                        >
                          <Copy className="w-2.5 h-2.5 text-blue-600" />
                          <span>Kopieer</span>
                        </button>
                      )}

                      {wd.events.length > 0 && onClearDayEvents && (
                        <button
                          type="button"
                          onClick={() => {
                            soundEffects.playTap();
                            if (
                              window.confirm(
                                `Weet je zeker dat je alle afspraken voor ${wd.name} wilt wissen?`
                              )
                            ) {
                              onClearDayEvents(wd.dateStr);
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 font-bold"
                          title="Wis dag"
                        >
                          Wissen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: 1 BEPAALDE DAG INVULLEN & BEKIJKEN (FOCUS OP 1 DAG) */}
      {/* Ochtend, Middag & Avond overzichtelijk apart invullen en bewerken */}
      {/* ========================================================================= */}
      {viewType === 'dag' && (
        <div className="space-y-5">
          {/* Day Focus Header Banner */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border-2 border-amber-300 shadow-sm flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center text-2xl shadow-xs shrink-0">
                ☀️
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                    📅 Dagfocus & Invullen
                  </span>
                  {isToday ? (
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                      Vandaag
                    </span>
                  ) : (
                    (() => {
                      const countdown = getNightsSleep(currentDateStr);
                      return countdown ? (
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                          {countdown}
                        </span>
                      ) : null;
                    })()
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 capitalize mt-0.5">
                  {formattedDutchDate}
                </h2>
                <span className="text-xs text-slate-500 font-semibold">
                  {dayEvents.length} {dayEvents.length === 1 ? 'activiteit' : 'activiteiten'} gepland voor deze dag
                </span>
              </div>
            </div>

            {/* Day Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onAddEvent(currentDateStr)}
                className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                title="Voeg een nieuwe afspraak toe voor deze dag"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ Afspraak Toevoegen</span>
              </button>

              {onOpenInsertRoutineModal && (
                <button
                  type="button"
                  onClick={() => onOpenInsertRoutineModal(currentDateStr)}
                  className="px-3.5 py-2 rounded-xl text-xs font-black bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
                  title="Voeg een complete routine in voor deze dag"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-400" />
                  <span>Routine Invoegen</span>
                </button>
              )}

              {onOpenPrintModal && (
                <button
                  type="button"
                  onClick={() => onOpenPrintModal(currentDateStr, 'day')}
                  className="px-3.5 py-2 rounded-xl text-xs font-black bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Print enkel deze specifieke dag op A4 formaat"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-700" />
                  <span>🖨️ Print deze Dag (A4)</span>
                </button>
              )}

              <button
                type="button"
                onClick={(e) => handleCopyDay(currentDateStr, e)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Kopieer alle afspraken van deze dag naar klembord"
              >
                <Copy className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Kopieer Dag</span>
              </button>

              {clipboard && (
                <button
                  type="button"
                  onClick={(e) => handlePasteToDay(currentDateStr, e)}
                  className="px-3 py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer animate-pulse"
                  title="Plak gekopieerde activiteiten op deze dag"
                >
                  <span>📥 Plak {clipboard.events.length} afspraken</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setViewType('week')}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
                title="Terug naar overzicht van alle 7 dagen"
              >
                🗓️ Weekoverzicht
              </button>

              {onClearDayEvents && dayEvents.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playTap();
                    if (
                      window.confirm(
                        `Weet je zeker dat je alle ${dayEvents.length} afspraken van deze dag wilt wissen?`
                      )
                    ) {
                      onClearDayEvents(currentDateStr);
                    }
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Wis alle afspraken voor deze dag"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 3 STRUCTURED SECTIONS: OCHTEND, MIDDAG & AVOND */}
          <div className="space-y-6">
            {/* 1. OCHTEnd Section */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-sky-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-sky-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌅</span>
                  <h3 className="text-base font-black text-sky-950 uppercase tracking-wide">
                    Ochtend (vóór 12:00)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 text-xs font-black">
                    {groupedDayEvents.ochtend.length}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onAddEvent(currentDateStr, 'ochtend')}
                    className="px-3 py-1.5 rounded-xl text-xs font-black bg-sky-500 hover:bg-sky-600 text-white flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                    title="Voeg een afspraak toe in de ochtend"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                    <span>+ Ochtend afspraak</span>
                  </button>

                  {groupedDayEvents.ochtend.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => handleCopyDagdeel(currentDateStr, 'ochtend', e)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1 cursor-pointer"
                      title="Kopieer enkel het ochtenddeel"
                    >
                      <Copy className="w-3 h-3 text-sky-600" />
                      <span className="hidden sm:inline">Kopieer ochtend</span>
                    </button>
                  )}

                  {clipboard && (
                    <button
                      type="button"
                      onClick={(e) => handlePasteToDagdeel(currentDateStr, 'ochtend', e)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Plak gekopieerde taken in de ochtend"
                    >
                      <span>📥 Plakken</span>
                    </button>
                  )}
                </div>
              </div>

              {groupedDayEvents.ochtend.length === 0 ? (
                <div
                  onClick={() => onAddEvent(currentDateStr, 'ochtend')}
                  className="p-5 text-center border-2 border-dashed border-sky-200 hover:border-sky-400 bg-sky-50/30 hover:bg-sky-50/70 rounded-2xl cursor-pointer transition-all group"
                >
                  <span className="text-xl block mb-1">🌅</span>
                  <span className="text-xs font-bold text-sky-900 group-hover:underline">
                    + Nog geen ochtendafspraken. Klik hier om een ochtendafspraak toe te voegen (bijv. ontbijt, school, sport).
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {groupedDayEvents.ochtend.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      members={members}
                      isSpeaking={speakingEventId === event.id}
                      onSpeak={handleSpeak}
                      onCheck={handleCheckRoutine}
                      onEdit={onEditEvent}
                      onDeleteSingle={onDeleteEvent}
                      onDuplicateSingle={onDuplicateEvent ? () => onDuplicateEvent(event) : undefined}
                      onCopySingle={onOpenCopyModal ? () => onOpenCopyModal(event.date, event.id) : undefined}
                      getNightsSleep={getNightsSleep}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 2. MIDDAG Section */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-amber-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-amber-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">☀️</span>
                  <h3 className="text-base font-black text-amber-950 uppercase tracking-wide">
                    Middag (12:00 - 17:30)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
                    {groupedDayEvents.middag.length}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onAddEvent(currentDateStr, 'middag')}
                    className="px-3 py-1.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                    title="Voeg een afspraak toe in de middag"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                    <span>+ Middag afspraak</span>
                  </button>

                  {groupedDayEvents.middag.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => handleCopyDagdeel(currentDateStr, 'middag', e)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1 cursor-pointer"
                      title="Kopieer enkel het middagdeel"
                    >
                      <Copy className="w-3 h-3 text-amber-600" />
                      <span className="hidden sm:inline">Kopieer middag</span>
                    </button>
                  )}

                  {clipboard && (
                    <button
                      type="button"
                      onClick={(e) => handlePasteToDagdeel(currentDateStr, 'middag', e)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Plak gekopieerde taken in de middag"
                    >
                      <span>📥 Plakken</span>
                    </button>
                  )}
                </div>
              </div>

              {groupedDayEvents.middag.length === 0 ? (
                <div
                  onClick={() => onAddEvent(currentDateStr, 'middag')}
                  className="p-5 text-center border-2 border-dashed border-amber-200 hover:border-amber-400 bg-amber-50/30 hover:bg-amber-50/70 rounded-2xl cursor-pointer transition-all group"
                >
                  <span className="text-xl block mb-1">☀️</span>
                  <span className="text-xs font-bold text-amber-900 group-hover:underline">
                    + Nog geen middagafspraken. Klik hier om een middagafspraak toe te voegen (bijv. diëtiste, zwemmen, afspreken).
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {groupedDayEvents.middag.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      members={members}
                      isSpeaking={speakingEventId === event.id}
                      onSpeak={handleSpeak}
                      onCheck={handleCheckRoutine}
                      onEdit={onEditEvent}
                      onDeleteSingle={onDeleteEvent}
                      onDuplicateSingle={onDuplicateEvent ? () => onDuplicateEvent(event) : undefined}
                      onCopySingle={onOpenCopyModal ? () => onOpenCopyModal(event.date, event.id) : undefined}
                      getNightsSleep={getNightsSleep}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 3. AVOND Section */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-indigo-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌙</span>
                  <h3 className="text-base font-black text-indigo-950 uppercase tracking-wide">
                    Avond (vanaf 17:30)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-xs font-black">
                    {groupedDayEvents.avond.length}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onAddEvent(currentDateStr, 'avond')}
                    className="px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                    title="Voeg een afspraak toe in de avond"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                    <span>+ Avond afspraak</span>
                  </button>

                  {groupedDayEvents.avond.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => handleCopyDagdeel(currentDateStr, 'avond', e)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 flex items-center gap-1 cursor-pointer"
                      title="Kopieer enkel het avonddeel"
                    >
                      <Copy className="w-3 h-3 text-indigo-600" />
                      <span className="hidden sm:inline">Kopieer avond</span>
                    </button>
                  )}

                  {clipboard && (
                    <button
                      type="button"
                      onClick={(e) => handlePasteToDagdeel(currentDateStr, 'avond', e)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Plak gekopieerde taken in de avond"
                    >
                      <span>📥 Plakken</span>
                    </button>
                  )}
                </div>
              </div>

              {groupedDayEvents.avond.length === 0 ? (
                <div
                  onClick={() => onAddEvent(currentDateStr, 'avond')}
                  className="p-5 text-center border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/70 rounded-2xl cursor-pointer transition-all group"
                >
                  <span className="text-xl block mb-1">🌙</span>
                  <span className="text-xs font-bold text-indigo-900 group-hover:underline">
                    + Nog geen avondafspraken. Klik hier om een avondafspraak toe te voegen (bijv. avondeten, tanden poetsen, verhaaltje).
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {groupedDayEvents.avond.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      members={members}
                      isSpeaking={speakingEventId === event.id}
                      onSpeak={handleSpeak}
                      onCheck={handleCheckRoutine}
                      onEdit={onEditEvent}
                      onDeleteSingle={onDeleteEvent}
                      onDuplicateSingle={onDuplicateEvent ? () => onDuplicateEvent(event) : undefined}
                      onCopySingle={onOpenCopyModal ? () => onOpenCopyModal(event.date, event.id) : undefined}
                      getNightsSleep={getNightsSleep}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Child-friendly event card component
interface EventCardProps {
  event: AgendaEvent;
  members: FamilyMember[];
  isSpeaking: boolean;
  onSpeak: (event: AgendaEvent, e: React.MouseEvent) => void;
  onCheck: (eventId: string, e: React.MouseEvent) => void;
  onEdit: (event: AgendaEvent) => void;
  onDeleteSingle?: (eventId: string) => void;
  onDuplicateSingle?: () => void;
  onCopySingle?: () => void;
  getNightsSleep: (dateStr: string) => string | null;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  members,
  isSpeaking,
  onSpeak,
  onCheck,
  onEdit,
  onDeleteSingle,
  onDuplicateSingle,
  onCopySingle,
  getNightsSleep,
}) => {
  const involvedMembers = members.filter((m) => event.memberIds.includes(m.id));
  const countdown = getNightsSleep(event.date);

  return (
    <div
      onClick={() => onEdit(event)}
      className={`bg-white rounded-3xl p-4 sm:p-5 border-2 transition-all cursor-pointer shadow-xs hover:shadow-md group relative overflow-hidden ${
        event.completed
          ? 'border-emerald-200 bg-emerald-50/30 opacity-75'
          : 'border-slate-100 hover:border-amber-300'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Big Kid-Friendly Icon badge */}
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-3xl shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
          <IconVisual emoji={event.iconEmoji} imageDataUrl={event.iconImageDataUrl} imageClassName="w-10 h-10 object-contain" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            {/* Time */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>{event.startTime}</span>
              {event.endTime && <span> - {event.endTime}</span>}
            </div>

            <div className="flex items-center gap-1">
              {/* Quick 1-click duplicate button */}
              {onDuplicateSingle && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundEffects.playTap();
                    onDuplicateSingle();
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 flex items-center justify-center transition-colors cursor-pointer"
                  title="Snel dupliceren in 1 klik"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Advanced multi-day copy button */}
              {onCopySingle && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundEffects.playTap();
                    onCopySingle();
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 flex items-center justify-center transition-colors cursor-pointer"
                  title="Kopieer naar andere weekdagen..."
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Fast 1-click delete button */}
              {onDeleteSingle && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundEffects.playTap();
                    if (
                      window.confirm(
                        `Weet je zeker dat je "${event.title}" wilt verwijderen?`
                      )
                    ) {
                      onDeleteSingle(event.id);
                    }
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                  title="Snel verwijderen"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Read aloud sound button */}
              <button
                type="button"
                onClick={(e) => onSpeak(event, e)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isSpeaking
                    ? 'bg-amber-500 text-white animate-pulse'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                }`}
                title="Lees voor in het Nederlands"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Title */}
          <h4
            className={`text-base font-bold text-slate-900 mt-1 line-clamp-1 ${
              event.completed ? 'line-through text-slate-500' : ''
            }`}
          >
            {event.title}
          </h4>

          {/* Location or Notes if any */}
          {event.location && (
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 line-clamp-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{event.location}</span>
            </p>
          )}

          {event.notes && (
            <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100 line-clamp-2">
              {event.notes}
            </p>
          )}

          {/* Bottom row: Member avatars & Routine checkbox / countdown */}
          <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100">
            {/* Involved members */}
            <div className="flex items-center gap-1">
              {involvedMembers.length > 0 ? (
                involvedMembers.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold text-slate-800 shadow-2xs border"
                    style={{
                      backgroundColor: `${m.color}20`,
                      borderColor: `${m.color}40`,
                    }}
                    title={m.name}
                  >
                    <span>{m.avatar}</span>
                    <span className="hidden sm:inline">{m.name.split(' ')[0]}</span>
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-slate-400">Heel het gezin</span>
              )}
            </div>

            {/* Checkbox for routines or Nights sleep badge */}
            {event.isRoutine ? (
              <button
                type="button"
                onClick={(e) => onCheck(event.id, e)}
                className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 p-1 rounded-lg cursor-pointer"
              >
                {event.completed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Klaar!</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4 text-slate-300" />
                    <span className="text-slate-600">Nog doen</span>
                  </>
                )}
              </button>
            ) : countdown ? (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {countdown}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

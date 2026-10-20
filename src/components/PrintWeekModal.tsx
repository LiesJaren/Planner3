import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MemberAvatar } from './MemberAvatar';
import {
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Sparkles,
  Users,
  FileDown,
  Star,
  Palette,
  Smile,
  Sun,
  CheckCircle2,
  Heart,
  Pencil,
  Image as ImageIcon,
  Loader2,
  Check,
  Zap,
  Calendar,
  Layers,
  Sliders,
  Maximize2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { AgendaEvent, FamilyMember, GroceryItem } from '../types/family';
import { soundEffects, spreekBericht } from '../utils/audio';
import { IconVisual } from './IconVisual';
import kidsMascotImg from '../assets/images/kids_mode_mascot_1791799911638.jpg';
import {
  formatLocalDate,
  getTodayDateStr,
  parseLocalDate,
  addDays,
  getWeekMonday,
  formatDutchFullDate,
  formatDutchShortDate,
  getDutchDayName,
} from '../utils/dateUtils';

interface PrintWeekModalProps {
  isOpen: boolean;
  events: AgendaEvent[];
  members: FamilyMember[];
  groceries: GroceryItem[];
  defaultDate?: string;
  initialScope?: 'week' | 'day';
  onNavigateToDay?: (dateStr: string) => void;
  onClose: () => void;
}

export type PrintTheme = 'regenboog' | 'superheld' | 'pastel' | 'zonnig' | 'inkleur';

export interface DayThemeConfig {
  borderColor: string;
  headerBg: string;
  headerText: string;
  dateColor: string;
  bg: string;
  cardBg: string;
  cardBorder: string;
  badge: string;
  accentColor: string;
  isWeekend?: boolean;
}

export const RAINBOW_DAY_THEMES: DayThemeConfig[] = [
  {
    badge: '🚀 Raketstart',
    borderColor: 'border-sky-300',
    headerBg: 'bg-sky-200',
    headerText: 'text-sky-950',
    dateColor: 'text-sky-800',
    bg: 'bg-sky-50/50',
    cardBg: 'bg-white',
    cardBorder: 'border-sky-200',
    accentColor: '#0284c7',
  },
  {
    badge: '🍀 Speurneus',
    borderColor: 'border-emerald-300',
    headerBg: 'bg-emerald-200',
    headerText: 'text-emerald-950',
    dateColor: 'text-emerald-800',
    bg: 'bg-emerald-50/50',
    cardBg: 'bg-white',
    cardBorder: 'border-emerald-200',
    accentColor: '#059669',
  },
  {
    badge: '🎈 Speelmiddag',
    borderColor: 'border-amber-300',
    headerBg: 'bg-amber-200',
    headerText: 'text-amber-950',
    dateColor: 'text-amber-800',
    bg: 'bg-amber-50/50',
    cardBg: 'bg-white',
    cardBorder: 'border-amber-200',
    accentColor: '#b45309',
  },
  {
    badge: '⭐ Topperdag',
    borderColor: 'border-purple-300',
    headerBg: 'bg-purple-200',
    headerText: 'text-purple-950',
    dateColor: 'text-purple-800',
    bg: 'bg-purple-50/50',
    cardBg: 'bg-white',
    cardBorder: 'border-purple-200',
    accentColor: '#7e22ce',
  },
  {
    badge: '🎉 Bijna Weekend',
    borderColor: 'border-pink-300',
    headerBg: 'bg-pink-200',
    headerText: 'text-pink-950',
    dateColor: 'text-pink-800',
    bg: 'bg-pink-50/50',
    cardBg: 'bg-white',
    cardBorder: 'border-pink-200',
    accentColor: '#be185d',
  },
  {
    badge: '⚽ Weekend Pret',
    borderColor: 'border-orange-400',
    headerBg: 'bg-orange-200',
    headerText: 'text-orange-950',
    dateColor: 'text-orange-900',
    bg: 'bg-orange-50/70',
    cardBg: 'bg-white',
    cardBorder: 'border-orange-300',
    accentColor: '#c2410c',
    isWeekend: true,
  },
  {
    badge: '🥞 Gezinsdag',
    borderColor: 'border-yellow-400',
    headerBg: 'bg-yellow-200',
    headerText: 'text-yellow-950',
    dateColor: 'text-yellow-900',
    bg: 'bg-yellow-50/70',
    cardBg: 'bg-white',
    cardBorder: 'border-yellow-300',
    accentColor: '#a16207',
    isWeekend: true,
  },
];

export const SUPERHELD_DAY_THEMES: DayThemeConfig[] = [
  {
    badge: '🚀 Raketstart',
    borderColor: 'border-blue-400',
    headerBg: 'bg-blue-300',
    headerText: 'text-blue-950',
    dateColor: 'text-blue-900',
    bg: 'bg-blue-50/50',
    cardBg: 'bg-white',
    cardBorder: 'border-blue-200',
    accentColor: '#1d4ed8',
  },
  {
    badge: '⚡ Bliksemsnel',
    borderColor: 'border-emerald-400',
    headerBg: 'bg-emerald-300',
    headerText: 'text-emerald-950',
    dateColor: 'text-emerald-900',
    bg: 'bg-emerald-50/50',
    cardBg: 'bg-white',
    cardBorder: 'border-emerald-200',
    accentColor: '#047857',
  },
  {
    badge: '🦸 Superheld',
    borderColor: 'border-amber-400',
    headerBg: 'bg-amber-300',
    headerText: 'text-amber-950',
    dateColor: 'text-amber-900',
    bg: 'bg-amber-50/50',
    cardBg: 'bg-white',
    cardBorder: 'border-amber-200',
    accentColor: '#b45309',
  },
  {
    badge: '🛡️ Schildkracht',
    borderColor: 'border-indigo-400',
    headerBg: 'bg-indigo-300',
    headerText: 'text-indigo-950',
    dateColor: 'text-indigo-900',
    bg: 'bg-indigo-50/50',
    cardBg: 'bg-white',
    cardBorder: 'border-indigo-200',
    accentColor: '#4338ca',
  },
  {
    badge: '💥 Turbo Kracht',
    borderColor: 'border-rose-400',
    headerBg: 'bg-rose-300',
    headerText: 'text-rose-950',
    dateColor: 'text-rose-900',
    bg: 'bg-rose-50/50',
    cardBg: 'bg-white',
    cardBorder: 'border-rose-200',
    accentColor: '#be123c',
  },
  {
    badge: '🌟 Mega Pret',
    borderColor: 'border-amber-500',
    headerBg: 'bg-amber-300',
    headerText: 'text-amber-950',
    dateColor: 'text-amber-900',
    bg: 'bg-amber-50/70',
    cardBg: 'bg-white',
    cardBorder: 'border-amber-300',
    accentColor: '#b45309',
    isWeekend: true,
  },
  {
    badge: '🥞 Kampioensdag',
    borderColor: 'border-orange-500',
    headerBg: 'bg-orange-300',
    headerText: 'text-orange-950',
    dateColor: 'text-orange-900',
    bg: 'bg-orange-50/70',
    cardBg: 'bg-white',
    cardBorder: 'border-orange-300',
    accentColor: '#c2410c',
    isWeekend: true,
  },
];

export const PASTEL_DAY_THEMES: DayThemeConfig[] = [
  {
    badge: '📘 Maandag',
    borderColor: 'border-slate-300',
    headerBg: 'bg-slate-100',
    headerText: 'text-slate-800',
    dateColor: 'text-slate-700',
    bg: 'bg-slate-50/40',
    cardBg: 'bg-white',
    cardBorder: 'border-slate-200',
    accentColor: '#475569',
  },
  {
    badge: '📗 Dinsdag',
    borderColor: 'border-teal-200',
    headerBg: 'bg-teal-100',
    headerText: 'text-teal-900',
    dateColor: 'text-teal-800',
    bg: 'bg-teal-50/30',
    cardBg: 'bg-white',
    cardBorder: 'border-teal-200',
    accentColor: '#0f766e',
  },
  {
    badge: '📙 Woensdag',
    borderColor: 'border-amber-200',
    headerBg: 'bg-amber-100',
    headerText: 'text-amber-900',
    dateColor: 'text-amber-800',
    bg: 'bg-amber-50/30',
    cardBg: 'bg-white',
    cardBorder: 'border-amber-200',
    accentColor: '#b45309',
  },
  {
    badge: '📕 Donderdag',
    borderColor: 'border-indigo-200',
    headerBg: 'bg-indigo-100',
    headerText: 'text-indigo-900',
    dateColor: 'text-indigo-800',
    bg: 'bg-indigo-50/30',
    cardBg: 'bg-white',
    cardBorder: 'border-indigo-200',
    accentColor: '#4338ca',
  },
  {
    badge: '🌸 Vrijdag',
    borderColor: 'border-rose-200',
    headerBg: 'bg-rose-100',
    headerText: 'text-rose-900',
    dateColor: 'text-rose-800',
    bg: 'bg-rose-50/30',
    cardBg: 'bg-white',
    cardBorder: 'border-rose-200',
    accentColor: '#be185d',
  },
  {
    badge: '🌞 Zaterdag',
    borderColor: 'border-orange-300',
    headerBg: 'bg-orange-100',
    headerText: 'text-orange-900',
    dateColor: 'text-orange-800',
    bg: 'bg-orange-50/40',
    cardBg: 'bg-white',
    cardBorder: 'border-orange-200',
    accentColor: '#c2410c',
    isWeekend: true,
  },
  {
    badge: '✨ Zondag',
    borderColor: 'border-yellow-300',
    headerBg: 'bg-yellow-100',
    headerText: 'text-yellow-900',
    dateColor: 'text-yellow-800',
    bg: 'bg-yellow-50/40',
    cardBg: 'bg-white',
    cardBorder: 'border-yellow-200',
    accentColor: '#a16207',
    isWeekend: true,
  },
];

export const ZONNIG_DAY_THEMES: DayThemeConfig[] = [
  {
    badge: '☀️ Maandag',
    borderColor: 'border-amber-300',
    headerBg: 'bg-amber-100',
    headerText: 'text-amber-950',
    dateColor: 'text-amber-800',
    bg: 'bg-amber-50/40',
    cardBg: 'bg-white',
    cardBorder: 'border-amber-200',
    accentColor: '#d97706',
  },
  {
    badge: '☀️ Dinsdag',
    borderColor: 'border-amber-300',
    headerBg: 'bg-amber-100',
    headerText: 'text-amber-950',
    dateColor: 'text-amber-800',
    bg: 'bg-amber-50/40',
    cardBg: 'bg-white',
    cardBorder: 'border-amber-200',
    accentColor: '#d97706',
  },
  {
    badge: '☀️ Woensdag',
    borderColor: 'border-yellow-300',
    headerBg: 'bg-yellow-200',
    headerText: 'text-yellow-950',
    dateColor: 'text-yellow-800',
    bg: 'bg-yellow-50/40',
    cardBg: 'bg-white',
    cardBorder: 'border-yellow-200',
    accentColor: '#ca8a04',
  },
  {
    badge: '☀️ Donderdag',
    borderColor: 'border-amber-300',
    headerBg: 'bg-amber-100',
    headerText: 'text-amber-950',
    dateColor: 'text-amber-800',
    bg: 'bg-amber-50/40',
    cardBg: 'bg-white',
    cardBorder: 'border-amber-200',
    accentColor: '#d97706',
  },
  {
    badge: '☀️ Vrijdag',
    borderColor: 'border-orange-300',
    headerBg: 'bg-orange-100',
    headerText: 'text-orange-950',
    dateColor: 'text-orange-800',
    bg: 'bg-orange-50/40',
    cardBg: 'bg-white',
    cardBorder: 'border-orange-200',
    accentColor: '#ea580c',
  },
  {
    badge: '🎈 Zaterdag',
    borderColor: 'border-orange-400',
    headerBg: 'bg-orange-200',
    headerText: 'text-orange-950',
    dateColor: 'text-orange-900',
    bg: 'bg-orange-50/60',
    cardBg: 'bg-white',
    cardBorder: 'border-orange-300',
    accentColor: '#c2410c',
    isWeekend: true,
  },
  {
    badge: '🥞 Zondag',
    borderColor: 'border-yellow-400',
    headerBg: 'bg-yellow-200',
    headerText: 'text-yellow-950',
    dateColor: 'text-yellow-900',
    bg: 'bg-yellow-50/60',
    cardBg: 'bg-white',
    cardBorder: 'border-yellow-300',
    accentColor: '#a16207',
    isWeekend: true,
  },
];

export const INKLEUR_DAY_THEMES: DayThemeConfig[] = [
  {
    badge: '🖍️ Maandag',
    borderColor: 'border-slate-800',
    headerBg: 'bg-slate-100',
    headerText: 'text-slate-900',
    dateColor: 'text-slate-900',
    bg: 'bg-white',
    cardBg: 'bg-white',
    cardBorder: 'border-slate-800',
    accentColor: '#0f172a',
  },
  {
    badge: '🖍️ Dinsdag',
    borderColor: 'border-slate-800',
    headerBg: 'bg-slate-100',
    headerText: 'text-slate-900',
    dateColor: 'text-slate-900',
    bg: 'bg-white',
    cardBg: 'bg-white',
    cardBorder: 'border-slate-800',
    accentColor: '#0f172a',
  },
  {
    badge: '🖍️ Woensdag',
    borderColor: 'border-slate-800',
    headerBg: 'bg-slate-100',
    headerText: 'text-slate-900',
    dateColor: 'text-slate-900',
    bg: 'bg-white',
    cardBg: 'bg-white',
    cardBorder: 'border-slate-800',
    accentColor: '#0f172a',
  },
  {
    badge: '🖍️ Donderdag',
    borderColor: 'border-slate-800',
    headerBg: 'bg-slate-100',
    headerText: 'text-slate-900',
    dateColor: 'text-slate-900',
    bg: 'bg-white',
    cardBg: 'bg-white',
    cardBorder: 'border-slate-800',
    accentColor: '#0f172a',
  },
  {
    badge: '🖍️ Vrijdag',
    borderColor: 'border-slate-800',
    headerBg: 'bg-slate-100',
    headerText: 'text-slate-900',
    dateColor: 'text-slate-900',
    bg: 'bg-white',
    cardBg: 'bg-white',
    cardBorder: 'border-slate-800',
    accentColor: '#0f172a',
  },
  {
    badge: '🖍️ Zaterdag',
    borderColor: 'border-slate-800',
    headerBg: 'bg-slate-100',
    headerText: 'text-slate-900',
    dateColor: 'text-slate-900',
    bg: 'bg-white',
    cardBg: 'bg-white',
    cardBorder: 'border-slate-800',
    accentColor: '#0f172a',
    isWeekend: true,
  },
  {
    badge: '🖍️ Zondag',
    borderColor: 'border-slate-800',
    headerBg: 'bg-slate-100',
    headerText: 'text-slate-900',
    dateColor: 'text-slate-900',
    bg: 'bg-white',
    cardBg: 'bg-white',
    cardBorder: 'border-slate-800',
    accentColor: '#0f172a',
    isWeekend: true,
  },
];

export const PrintWeekModal: React.FC<PrintWeekModalProps> = ({
  isOpen,
  events,
  members,
  groceries,
  defaultDate,
  initialScope,
  onNavigateToDay,
  onClose,
}) => {
  // Monday of selected week
  const [selectedMondayStr, setSelectedMondayStr] = useState<string>(() => {
    return getWeekMonday(defaultDate || getTodayDateStr());
  });

  // Print Scope: 'week' (7 days A4 landscape) or 'day' (1 specific day A4)
  const [printScope, setPrintScope] = useState<'week' | 'day'>(() => initialScope || 'week');

  // Single Day selection for 1-day print
  const [selectedDayStr, setSelectedDayStr] = useState<string>(() => {
    return defaultDate || getTodayDateStr();
  });

  // Printer settings & orientation
  const [printOrientation, setPrintOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [printDensity, setPrintDensity] = useState<'compact' | 'comfort' | 'groot'>('compact');

  // Customization & ink saving options
  const [activeTheme, setActiveTheme] = useState<PrintTheme>('regenboog');
  const [ecoInkSaver, setEcoInkSaver] = useState(false);
  const [showPrinterTips, setShowPrinterTips] = useState(false);

  const [includeGroceries, setIncludeGroceries] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeStars, setIncludeStars] = useState(true);
  const [includeWeatherDoodles, setIncludeWeatherDoodles] = useState(true);
  const [includeColoringStars, setIncludeColoringStars] = useState(true);
  const [includeCheckboxes, setIncludeCheckboxes] = useState(true);
  const [includeDrawingCorner, setIncludeDrawingCorner] = useState(true);
  const [includeFamilyMembers, setIncludeFamilyMembers] = useState(true);
  const [includeTimes, setIncludeTimes] = useState(true);
  const [includeLocations, setIncludeLocations] = useState(true);
  const [familyNote, setFamilyNote] = useState('Samen maken we er een superleuke dag van! 🌈⭐');

  // Sync defaultDate and initialScope props when modal opens
  useEffect(() => {
    if (isOpen) {
      if (defaultDate) {
        setSelectedDayStr(defaultDate);
        setSelectedMondayStr(getWeekMonday(defaultDate));
      }
      if (initialScope) {
        setPrintScope(initialScope);
      }
    }
  }, [defaultDate, initialScope, isOpen]);

  // Adjust default orientation when changing scope
  useEffect(() => {
    if (printScope === 'day') {
      setPrintOrientation('portrait');
    } else {
      setPrintOrientation('landscape');
    }
  }, [printScope]);

  // Child info (Jaren)
  const childMember = members.find((m) => m.role === 'kind') || members[0];
  const childStars = childMember?.stars ?? 0;
  const childFirstName = childMember ? childMember.name.split(' ')[0] : 'Jaren';

  // Compute 7 days of the week safely using addDays (NO UTC shift!)
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const str = addDays(selectedMondayStr, i);
      const cur = parseLocalDate(str);
      const dayName = cur.toLocaleDateString('nl-NL', { weekday: 'long' });
      const dayShort = cur.toLocaleDateString('nl-NL', { weekday: 'short' });
      const dayNum = cur.getDate();
      const monthShort = cur.toLocaleDateString('nl-NL', { month: 'short' });

      // Find events for this day - all events from early morning to late evening
      const dayEvents = events
        .filter((e) => e.date === str)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      days.push({
        dateStr: str,
        dateObj: cur,
        dayName,
        dayShort,
        shortName: dayShort,
        name: dayName,
        dayNum,
        monthShort,
        events: dayEvents,
        isWeekend: i >= 5,
        dayIndex: i,
      });
    }
    return days;
  }, [selectedMondayStr, events]);

  // Navigate weeks
  const handlePrevWeek = () => {
    soundEffects.playTap();
    setSelectedMondayStr((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    soundEffects.playTap();
    setSelectedMondayStr((prev) => addDays(prev, 7));
  };

  const handleCurrentWeek = () => {
    soundEffects.playTap();
    const today = getTodayDateStr();
    setSelectedMondayStr(getWeekMonday(today));
    setSelectedDayStr(today);
  };

  const printSheetRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  // Single Day events
  const singleDayEvents = useMemo(() => {
    return events
      .filter((e) => e.date === selectedDayStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [events, selectedDayStr]);

  const handleDownloadPDF = async () => {
    if (!printSheetRef.current || isGeneratingPDF) return;
    setIsGeneratingPDF(true);
    soundEffects.playTap();
    try {
      const element = printSheetRef.current;

      // Use html-to-image toPng which natively supports modern CSS, Tailwind and sRGB colors
      const imgData = await toPng(element, {
        quality: 0.98,
        pixelRatio: 2, // 2x DPI for super sharp text and graphics on physical paper
        backgroundColor: '#ffffff',
        skipFonts: true,
        cacheBust: true,
      });

      const isPortrait = printOrientation === 'portrait';
      const pdf = new jsPDF({
        orientation: isPortrait ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // A4 dimensions in mm
      const pdfWidth = isPortrait ? 210 : 297;
      const pdfHeight = isPortrait ? 297 : 210;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

      const fileName =
        printScope === 'day'
          ? `familieplanner_dag_${selectedDayStr}.pdf`
          : `familieplanner_week_${weekDays[0]?.dateStr || 'a4'}.pdf`;
      pdf.save(fileName);

      soundEffects.playVictoryFanfare();
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
      });
      spreekBericht('Je vrolijke PDF is gedownload en klaar om af te drukken!');
      setDownloadSuccessMessage('🎉 PDF succesvol gedownload! Klaar voor de printer!');
      setTimeout(() => setDownloadSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Fout bij het genereren van de PDF:', err);
      try {
        window.print();
      } catch {
        alert('Er ging iets mis bij het genereren van de PDF. Probeer het opnieuw.');
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!printSheetRef.current || isGeneratingImage) return;
    setIsGeneratingImage(true);
    soundEffects.playTap();
    try {
      const element = printSheetRef.current;
      const imgData = await toPng(element, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        skipFonts: true,
        cacheBust: true,
      });

      const link = document.createElement('a');
      const fileName =
        printScope === 'day'
          ? `familieplanner_dag_${selectedDayStr}.png`
          : `familieplanner_week_${weekDays[0]?.dateStr || 'a4'}.png`;
      link.download = fileName;
      link.href = imgData;
      link.click();

      soundEffects.playSuccessChime();
      spreekBericht('Je afbeelding is gedownload!');
      setDownloadSuccessMessage('📸 Afbeelding (.png) opgeslagen in Downloads!');
      setTimeout(() => setDownloadSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Fout bij het opslaan van de afbeelding:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleBrowserPrint = () => {
    soundEffects.playTap();
    try {
      window.print();
    } catch (e) {
      console.warn('window.print() geblokkeerd, download PDF...', e);
      handleDownloadPDF();
    }
  };

  const weekTitle = useMemo(() => {
    if (weekDays.length < 7) return '';
    const first = weekDays[0];
    const last = weekDays[6];
    return `${first.dayNum} ${first.monthShort} t/m ${last.dayNum} ${last.monthShort} ${first.dateObj.getFullYear()}`;
  }, [weekDays]);

  // Unchecked groceries to display at bottom
  const importantGroceries = useMemo(() => {
    return groceries.filter((g) => !g.checked).slice(0, 8);
  }, [groceries]);

  if (!isOpen) return null;

  return (
    <>
      {/* Screen Modal for preview & controls */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/65 backdrop-blur-xs no-print overflow-y-auto">
        <div
          className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-amber-300 my-2 flex flex-col max-h-[96vh]"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="px-5 py-3 bg-gradient-to-r from-amber-200 via-orange-100 to-amber-100 border-b-2 border-amber-300 flex items-center justify-between shrink-0 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-xs border-2 border-white">
                🖨️
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                  <span>Afdrukken & Printerinstellingen Beheren</span>
                  <span className="px-2 py-0.5 rounded-full bg-white text-[11px] font-black text-amber-900 border border-amber-300 shadow-2xs">
                    {printScope === 'week' ? '🗓️ Hele Week A4' : '📅 1 Dagoverzicht A4'}
                  </span>
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  Beheer zelf je pagina-indeling, oriëntatie, thema en wat je wilt afdrukken.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {downloadSuccessMessage && (
                <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300 flex items-center gap-1 shadow-2xs">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> {downloadSuccessMessage}
                </span>
              )}

              {/* Direct PDF Download */}
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                title="Download direct een haarscherp A4 PDF bestand"
              >
                {isGeneratingPDF ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4" />
                )}
                <span>{isGeneratingPDF ? 'PDF Bezig...' : '📥 Download PDF'}</span>
              </button>

              <button
                type="button"
                onClick={handleBrowserPrint}
                className="px-3 py-2 rounded-xl text-xs font-black bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                title="Browser afdrukdialoogvenster"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Afdrukken</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-slate-600 shadow-xs transition-colors cursor-pointer"
                aria-label="Sluit afdrukvenster"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* PRINTER SETTINGS CONTROL CENTER (Full User Control) */}
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 shrink-0 space-y-2.5">
            {/* Row 1: Print Scope (Hele Week vs 1 Dag) & Orientation & Format */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Scope Switcher */}
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border-2 border-amber-300 shadow-2xs">
                <span className="text-[11px] font-black text-slate-500 px-2 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-amber-600" /> Afdrukken:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playTap();
                    setPrintScope('week');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    printScope === 'week'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-amber-50'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>🗓️ Hele Week (7 Dagen)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playTap();
                    setPrintScope('day');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    printScope === 'day'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-amber-50'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>📅 1 Bepaalde Dag (Groot A4)</span>
                </button>
              </div>

              {/* Orientation & Density Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300 shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-slate-500 px-1">Oriëntatie:</span>
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playTap();
                      setPrintOrientation('landscape');
                    }}
                    className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      printOrientation === 'landscape'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    ↔️ Liggend (A4)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playTap();
                      setPrintOrientation('portrait');
                    }}
                    className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      printOrientation === 'portrait'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    ↕️ Staand (A4)
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300 shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-slate-500 px-1">Dichtheid:</span>
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playTap();
                      setPrintDensity('compact');
                    }}
                    className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      printDensity === 'compact'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    title="Compact: garandeert dat alle afspraken van 07:00 tot 22:00 netjes op 1 vel passen"
                  >
                    ⚡ Alles Passend (07-22u)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playTap();
                      setPrintDensity('comfort');
                    }}
                    className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      printDensity === 'comfort'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    title="Ruimere kaarten en comfortabele tussenruimte"
                  >
                    🎨 Ruimer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playTap();
                      setPrintDensity('groot');
                    }}
                    className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      printDensity === 'groot'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    title="Extra grote letters en pictogrammen speciaal voor jonge kinderen"
                  >
                    🔤 Grote Letters
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Day Selection when printScope === 'day' OR Week Navigator when printScope === 'week' */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
              {printScope === 'day' ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                    <span>📌 Kies welke dag je wilt printen:</span>
                  </span>

                  {/* Quick day buttons */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                    {weekDays.map((wd) => {
                      const isChosen = wd.dateStr === selectedDayStr;
                      return (
                        <button
                          key={wd.dateStr}
                          type="button"
                          onClick={() => {
                            soundEffects.playTap();
                            setSelectedDayStr(wd.dateStr);
                          }}
                          className={`px-2 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                            isChosen
                              ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-300'
                              : 'bg-white hover:bg-amber-50 text-slate-700 border border-slate-200'
                          }`}
                        >
                          <span>{wd.shortName || wd.dayShort}</span>
                          <span className="text-[10px] opacity-80">{wd.dayNum}</span>
                          {wd.events.length > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* HTML5 Date Picker */}
                  <input
                    type="date"
                    value={selectedDayStr}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedDayStr(e.target.value);
                        setSelectedMondayStr(getWeekMonday(e.target.value));
                      }
                    }}
                    className="px-2.5 py-1 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                  />
                  <span className="text-xs font-black text-amber-900 bg-amber-100 px-2 py-1 rounded-xl border border-amber-300">
                    {formatDutchFullDate(selectedDayStr)} ({singleDayEvents.length} afspraken)
                  </span>

                  {/* Direct button to fill in & edit this specific day in the planner */}
                  {onNavigateToDay && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playTap();
                        onNavigateToDay(selectedDayStr);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer ml-auto"
                      title="Sluit dit afdrukvenster en open deze specifieke dag direct in de planner om activiteiten toe te voegen of aan te passen"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>✏️ Deze dag invullen in planner</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white rounded-xl border border-slate-200 p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={handlePrevWeek}
                      className="p-1 rounded-lg hover:bg-slate-200 text-slate-700 cursor-pointer"
                      title="Vorige week"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCurrentWeek}
                      className="px-2.5 py-1 text-xs font-black text-amber-800 hover:bg-amber-50 rounded-lg cursor-pointer"
                    >
                      Deze week
                    </button>
                    <button
                      type="button"
                      onClick={handleNextWeek}
                      className="p-1 rounded-lg hover:bg-slate-200 text-slate-700 cursor-pointer"
                      title="Volgende week"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs font-black text-slate-800 bg-amber-100/70 px-2.5 py-1 rounded-xl border border-amber-300">
                    🗓️ Week: {weekTitle}
                  </span>
                </div>
              )}

              {/* Theme Picker */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                <span className="text-[11px] font-black text-slate-500 pl-1 pr-0.5 flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5" /> Thema:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playTap();
                    setActiveTheme('regenboog');
                  }}
                  className={`px-2 py-0.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    activeTheme === 'regenboog'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  🌈 Regenboog
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playTap();
                    setActiveTheme('superheld');
                  }}
                  className={`px-2 py-0.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    activeTheme === 'superheld'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  🦸 Superheld
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playTap();
                    setActiveTheme('pastel');
                  }}
                  className={`px-2 py-0.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    activeTheme === 'pastel'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  🎨 Pastel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playTap();
                    setActiveTheme('zonnig');
                  }}
                  className={`px-2 py-0.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    activeTheme === 'zonnig'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  ☀️ Zonnig
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playTap();
                    setActiveTheme('inkleur');
                  }}
                  className={`px-2 py-0.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    activeTheme === 'inkleur'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Inkleur editie: zwart-wit lijntekening die kinderen zelf kunnen inkleuren!"
                >
                  🖍️ Inkleurplaat
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playTap();
                    setEcoInkSaver(!ecoInkSaver);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                    ecoInkSaver
                      ? 'bg-slate-900 text-white shadow-xs ring-2 ring-slate-400'
                      : 'text-slate-700 hover:bg-slate-100 border border-slate-300'
                  }`}
                  title="Inktbesparende modus: zet alle kleuren om in strakke zwarte lijnen en witte achtergronden om inkt te besparen"
                >
                  <span>🖨️ Inktbesparing</span>
                  {ecoInkSaver && <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />}
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrinterTips(!showPrinterTips)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    showPrinterTips
                      ? 'bg-amber-200 text-amber-950 border border-amber-400 font-black shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                  title="Handige tips voor fysieke printerinstellingen op A4"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>💡 Tips</span>
                </button>
              </div>
            </div>

            {/* Row 3: Visual Elements Toggles (Vinkjes, Sterren, Doodles, Tijden, Locaties, etc.) */}
            <div className="flex items-center flex-wrap gap-3 text-xs font-bold text-slate-700 pt-1.5 border-t border-slate-200">
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-amber-700">
                <input
                  type="checkbox"
                  checked={includeCheckboxes}
                  onChange={(e) => setIncludeCheckboxes(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                />
                <span>☑️ Afvinkvakjes</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer hover:text-amber-700">
                <input
                  type="checkbox"
                  checked={includeColoringStars}
                  onChange={(e) => setIncludeColoringStars(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                />
                <span>⭐ Dagsterren</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer hover:text-amber-700">
                <input
                  type="checkbox"
                  checked={includeWeatherDoodles}
                  onChange={(e) => setIncludeWeatherDoodles(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                />
                <span>☀️ Weer & Emotie</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer hover:text-amber-700">
                <input
                  type="checkbox"
                  checked={includeDrawingCorner}
                  onChange={(e) => setIncludeDrawingCorner(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                />
                <span>🖍️ Teken/Stickervak</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer hover:text-amber-700">
                <input
                  type="checkbox"
                  checked={includeGroceries}
                  onChange={(e) => setIncludeGroceries(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                />
                <span>🛒 Boodschappen Speurtocht</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer hover:text-amber-700">
                <input
                  type="checkbox"
                  checked={includeFamilyMembers}
                  onChange={(e) => setIncludeFamilyMembers(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                />
                <span>👥 Wie doet wat</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer hover:text-amber-700">
                <input
                  type="checkbox"
                  checked={includeTimes}
                  onChange={(e) => setIncludeTimes(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                />
                <span>🕒 Tijdstippen</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer hover:text-amber-700">
                <input
                  type="checkbox"
                  checked={includeLocations}
                  onChange={(e) => setIncludeLocations(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                />
                <span>📍 Locaties</span>
              </label>
            </div>

            {/* Helpful Printer Guidelines for users */}
            {showPrinterTips && (
              <div className="bg-amber-50 border-2 border-amber-300 p-3 rounded-2xl text-xs text-amber-950 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between font-black text-amber-900">
                  <span className="flex items-center gap-1.5">
                    <span>🖨️</span> Printerinstellingen Beheren — Tips voor Thuisprinters:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPrinterTips(false)}
                    className="text-amber-800 hover:text-amber-950 text-[11px] font-bold"
                  >
                    ✕ Sluiten
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="bg-white p-2 rounded-xl border border-amber-200 shadow-2xs">
                    <strong className="block text-slate-900 mb-0.5">1. Papierformaat: A4</strong>
                    Selecteer in het printermenu <strong>A4 (210 × 297 mm)</strong>. Zowel <em>Liggend</em> (hele week) als <em>Staand</em> (dagplanning) zijn geoptimaliseerd.
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-amber-200 shadow-2xs">
                    <strong className="block text-slate-900 mb-0.5">2. Achtergronden AAN</strong>
                    Zet in het browser printdialoogvenster <strong>&apos;Achtergrondafbeeldingen&apos;</strong> (Background Graphics) aan voor mooie zachte kleuren.
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-amber-200 shadow-2xs">
                    <strong className="block text-slate-900 mb-0.5">3. Marges op Geen/Minimaal</strong>
                    Zet marges op <strong>&apos;Minimaal&apos;</strong> of <strong>&apos;Geen&apos;</strong> zodat de planner de volledige A4 benut.
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10.5px] text-amber-900 bg-amber-100/70 px-2.5 py-1 rounded-xl">
                  <span>💡 <strong>Tip voor het scherpste resultaat:</strong> Klik rechtsboven op <strong>&quot;📥 Download PDF&quot;</strong>. Dit levert een vlijmscherp A4 document op om direct af te drukken.</span>
                </div>
              </div>
            )}
          </div>

          {/* Screen Preview Container (Shows exactly what will be printed/downloaded) */}
          <div className="flex-1 overflow-auto p-3 sm:p-5 bg-slate-100/90 flex items-center justify-center">
            <div
              className={`w-full bg-white rounded-2xl shadow-xl border-2 border-slate-300 p-2 sm:p-3 text-slate-900 overflow-hidden ${
                printOrientation === 'portrait' ? 'max-w-2xl' : 'max-w-5xl'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-black text-amber-800 mb-2 uppercase tracking-wider pb-1 border-b border-slate-100">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Live Afdrukvoorbeeld ({printScope === 'week' ? 'Hele Week' : '1 Bepaalde Dag'} • A4{' '}
                  {printOrientation === 'portrait' ? 'Staand' : 'Liggend'})
                </span>
                <span className="text-slate-400 font-bold normal-case">
                  Van ochtend 07:00 tot avond 22:00 zichtbaar
                </span>
              </div>

              <div
                ref={printSheetRef}
                id="printable-week-canvas-wrapper"
                className="bg-white rounded-xl p-1 sm:p-2"
                style={{
                  minHeight: printOrientation === 'portrait' ? '700px' : '480px',
                }}
              >
                {printScope === 'week' ? (
                  <PrintableWeekSheet
                    weekDays={weekDays}
                    members={members}
                    weekTitle={weekTitle}
                    theme={activeTheme}
                    density={printDensity}
                    ecoInkSaver={ecoInkSaver}
                    includeGroceries={includeGroceries}
                    includeNotes={includeNotes}
                    includeStars={includeStars}
                    includeWeatherDoodles={includeWeatherDoodles}
                    includeColoringStars={includeColoringStars}
                    includeCheckboxes={includeCheckboxes}
                    includeDrawingCorner={includeDrawingCorner}
                    includeFamilyMembers={includeFamilyMembers}
                    includeTimes={includeTimes}
                    includeLocations={includeLocations}
                    childFirstName={childFirstName}
                    childStars={childStars}
                    familyNote={familyNote}
                    groceries={importantGroceries}
                  />
                ) : (
                  <PrintableDaySheet
                    dayDateStr={selectedDayStr}
                    events={singleDayEvents}
                    members={members}
                    theme={activeTheme}
                    density={printDensity}
                    ecoInkSaver={ecoInkSaver}
                    orientation={printOrientation}
                    includeGroceries={includeGroceries}
                    includeNotes={includeNotes}
                    includeStars={includeStars}
                    includeWeatherDoodles={includeWeatherDoodles}
                    includeColoringStars={includeColoringStars}
                    includeCheckboxes={includeCheckboxes}
                    includeDrawingCorner={includeDrawingCorner}
                    includeFamilyMembers={includeFamilyMembers}
                    includeTimes={includeTimes}
                    includeLocations={includeLocations}
                    childFirstName={childFirstName}
                    childStars={childStars}
                    familyNote={familyNote}
                    groceries={importantGroceries}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Footer with note input and download actions */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            {includeNotes ? (
              <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                <span className="text-xs font-black text-slate-700 shrink-0">💬 Gezinsboodschap:</span>
                <input
                  type="text"
                  value={familyNote}
                  onChange={(e) => setFamilyNote(e.target.value)}
                  placeholder="Typ een gezinsnotitie of leuke spreuk..."
                  className="w-full max-w-md px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-amber-400 outline-none"
                />
              </div>
            ) : (
              <div className="text-xs text-slate-500 font-bold">
                🌈 Vrolijke Familieplanner • Exact passend op 1 A4 vel voor op de koelkast
              </div>
            )}

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto flex-wrap justify-end">
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={isGeneratingImage}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Download als afbeelding voor WhatsApp of fotoprint"
              >
                {isGeneratingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5 text-purple-600" />}
                <span className="hidden sm:inline">Afbeelding (.png)</span>
              </button>

              <button
                type="button"
                onClick={handleBrowserPrint}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Browser afdrukdialoogvenster"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Browser Print</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Sluiten
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingPDF ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4" />
                )}
                <span>
                  {isGeneratingPDF
                    ? 'PDF Bezig...'
                    : `📥 Download PDF (1 A4 ${printOrientation === 'portrait' ? 'Staand' : 'Liggend'})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden-On-Screen element for browser window.print() */}
      <div className="print-only" data-print-orientation={printOrientation}>
        {printScope === 'week' ? (
          <PrintableWeekSheet
            weekDays={weekDays}
            members={members}
            weekTitle={weekTitle}
            theme={activeTheme}
            density={printDensity}
            ecoInkSaver={ecoInkSaver}
            includeGroceries={includeGroceries}
            includeNotes={includeNotes}
            includeStars={includeStars}
            includeWeatherDoodles={includeWeatherDoodles}
            includeColoringStars={includeColoringStars}
            includeCheckboxes={includeCheckboxes}
            includeDrawingCorner={includeDrawingCorner}
            includeFamilyMembers={includeFamilyMembers}
            includeTimes={includeTimes}
            includeLocations={includeLocations}
            childFirstName={childFirstName}
            childStars={childStars}
            familyNote={familyNote}
            groceries={importantGroceries}
          />
        ) : (
          <PrintableDaySheet
            dayDateStr={selectedDayStr}
            events={singleDayEvents}
            members={members}
            theme={activeTheme}
            density={printDensity}
            ecoInkSaver={ecoInkSaver}
            orientation={printOrientation}
            includeGroceries={includeGroceries}
            includeNotes={includeNotes}
            includeStars={includeStars}
            includeWeatherDoodles={includeWeatherDoodles}
            includeColoringStars={includeColoringStars}
            includeCheckboxes={includeCheckboxes}
            includeDrawingCorner={includeDrawingCorner}
            includeFamilyMembers={includeFamilyMembers}
            includeTimes={includeTimes}
            includeLocations={includeLocations}
            childFirstName={childFirstName}
            childStars={childStars}
            familyNote={familyNote}
            groceries={importantGroceries}
          />
        )}
      </div>
    </>
  );
};

// =========================================================================
// 1. PRINTABLE WEEK SHEET (7 Days Grid - ALL DAY from 07:00 to 22:00)
// =========================================================================
interface PrintableWeekSheetProps {
  weekDays: Array<{
    dateStr: string;
    dayName: string;
    dayShort: string;
    shortName?: string;
    name?: string;
    dayNum: number;
    monthShort: string;
    events: AgendaEvent[];
    isWeekend: boolean;
    dayIndex: number;
  }>;
  members: FamilyMember[];
  weekTitle: string;
  theme?: PrintTheme;
  density?: 'compact' | 'comfort' | 'groot';
  ecoInkSaver?: boolean;
  includeGroceries: boolean;
  includeNotes: boolean;
  includeStars?: boolean;
  includeWeatherDoodles?: boolean;
  includeColoringStars?: boolean;
  includeCheckboxes?: boolean;
  includeDrawingCorner?: boolean;
  includeFamilyMembers?: boolean;
  includeTimes?: boolean;
  includeLocations?: boolean;
  childFirstName?: string;
  childStars?: number;
  familyNote: string;
  groceries: GroceryItem[];
}

const PrintableWeekSheet: React.FC<PrintableWeekSheetProps> = ({
  weekDays,
  members,
  weekTitle,
  theme = 'regenboog',
  density = 'compact',
  ecoInkSaver = false,
  includeGroceries,
  includeNotes,
  includeStars = true,
  includeWeatherDoodles = true,
  includeColoringStars = true,
  includeCheckboxes = true,
  includeDrawingCorner = true,
  includeFamilyMembers = true,
  includeTimes = true,
  includeLocations = true,
  childFirstName = 'Jaren',
  childStars = 0,
  familyNote,
  groceries,
}) => {
  const effectiveTheme = ecoInkSaver ? 'inkleur' : theme;
  const themeConfigs = useMemo(() => {
    if (effectiveTheme === 'superheld') return SUPERHELD_DAY_THEMES;
    if (effectiveTheme === 'pastel') return PASTEL_DAY_THEMES;
    if (effectiveTheme === 'zonnig') return ZONNIG_DAY_THEMES;
    if (effectiveTheme === 'inkleur') return INKLEUR_DAY_THEMES;
    return RAINBOW_DAY_THEMES;
  }, [effectiveTheme]);

  return (
    <div className="w-full bg-white text-slate-900 font-sans print-sheet flex flex-col justify-between select-none">
      {/* Vrolijke Header Band met Mascotte, Weekdoel & Gezinslegende */}
      <div className="flex items-center justify-between pb-1 mb-1 border-b-2 border-amber-400 shrink-0 gap-2 bg-amber-50/60 px-2 py-1 rounded-xl">
        {/* Left: Mascot & Playful Title */}
        <div className="flex items-center gap-2">
          <div className="relative shrink-0">
            <img
              src={kidsMascotImg}
              alt="Mascotte"
              className="w-9 h-9 rounded-xl border border-amber-400 shadow-2xs object-cover"
            />
            <span className="absolute -top-1 -right-1 text-[10px]">⭐</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-black tracking-tight text-slate-900 leading-none">
                🌟 {childFirstName}&apos;s Vrolijke Weekplanner & Gezinsavontuur! 🎈
              </h1>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 text-[7.5px] font-black border border-amber-500 shadow-2xs">
                Groep 3 Topper 🚀
              </span>
            </div>
            <p className="text-[8.5px] font-bold text-amber-900 mt-0.5 flex items-center gap-1">
              <span>🗓️ Week van {weekTitle}</span>
              <span>•</span>
              <span className="text-amber-800">
                Ochtend, middag & avond gepland • Afvinken & sterren verdienen! ✨
              </span>
            </p>
          </div>
        </div>

        {/* Center/Right: Kid 5-Star Milestone Ladder & Family Members */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {includeStars && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs">
              <span className="text-[8px] font-black uppercase tracking-wider">🏆 Doel:</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((st) => (
                  <span
                    key={st}
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] font-black ${
                      st <= (childStars % 5 || (childStars > 0 ? 5 : 0))
                        ? 'bg-amber-400 border-amber-600 text-amber-950'
                        : 'bg-white border-amber-300 text-amber-400'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-[7.5px] font-extrabold text-amber-900">(5 = Pannenkoeken! 🥞)</span>
            </div>
          )}

          {includeFamilyMembers && (
            <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-xl border border-slate-200">
              <span className="text-[7.5px] font-black text-slate-500 uppercase mr-0.5">Gezin:</span>
              {members.map((m) => (
                <div
                  key={m.id}
                  className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded-full text-[7.5px] font-bold border border-slate-200 bg-slate-50"
                >
                  <MemberAvatar avatar={m.avatar} name={m.name} />
                  <span className="truncate max-w-[50px] font-extrabold">{m.name.split(' ')[0]}</span>
                  <span
                    className="w-1.5 h-1.5 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: m.color }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 7 Days Grid - Renders ALL EVENTS from Morning through Evening */}
      <div className="grid grid-cols-7 gap-1 flex-1 min-h-[340px]">
        {weekDays.map((day) => {
          const cfg = themeConfigs[day.dayIndex] || themeConfigs[0];

          // Separate day events into dagdelen so all afternoon and evening items are crystal clear
          const ochtendEvents = day.events.filter(
            (e) => e.timeOfDay === 'ochtend' || parseInt(e.startTime.split(':')[0], 10) < 12
          );
          const middagEvents = day.events.filter(
            (e) =>
              (e.timeOfDay === 'middag' ||
                (parseInt(e.startTime.split(':')[0], 10) >= 12 &&
                  parseInt(e.startTime.split(':')[0], 10) < 17)) &&
              !ochtendEvents.includes(e)
          );
          const avondEvents = day.events.filter(
            (e) =>
              (e.timeOfDay === 'avond' || parseInt(e.startTime.split(':')[0], 10) >= 17) &&
              !ochtendEvents.includes(e) &&
              !middagEvents.includes(e)
          );

          return (
            <div
              key={day.dateStr}
              className={`border-2 rounded-xl flex flex-col shadow-2xs transition-all ${cfg.borderColor} ${cfg.bg}`}
            >
              {/* Day Header */}
              <div className={`p-1 text-center border-b ${cfg.borderColor} ${cfg.headerBg} relative shrink-0`}>
                <div className="flex items-center justify-between px-0.5 leading-none">
                  <span className="text-[7.5px] font-black uppercase tracking-wider text-slate-800 truncate">
                    {cfg.badge}
                  </span>
                  <span className="text-[8px] font-extrabold uppercase text-slate-700">
                    {day.dayShort}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <span className={`text-[11px] font-black ${cfg.dateColor} leading-none`}>
                    {day.dayNum} {day.monthShort}
                  </span>
                </div>

                {/* Weather & Mood Doodles */}
                {includeWeatherDoodles && (
                  <div className="mt-0.5 pt-0.5 border-t border-black/10 flex items-center justify-between px-0.5 text-[8px] text-slate-700 select-none">
                    <span title="Omcirkel het weer!">☀️ ⛅ 🌧️</span>
                    <span title="Hoe voel ik me?">😄 😊 🥳</span>
                  </div>
                )}
              </div>

              {/* Day Events Container - Fits all events from morning to evening */}
              <div className="p-1 space-y-1 flex-1 flex flex-col justify-start">
                {day.events.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-1 rounded-lg border border-dashed border-amber-300 bg-white/80 min-h-[100px]">
                    <span className="text-sm">🎈</span>
                    <span className="text-[8px] font-black text-amber-900 mt-0.5">Vrije Speeltijd!</span>
                    <span className="text-[7px] text-slate-500">Buiten spelen of lego ✨</span>
                  </div>
                ) : (
                  <>
                    {/* Render each event neatly */}
                    {day.events.map((ev) => {
                      const evMembers = members.filter((m) => ev.memberIds.includes(m.id));
                      const isAvond =
                        ev.timeOfDay === 'avond' || parseInt(ev.startTime.split(':')[0], 10) >= 17;
                      const isMiddag =
                        (ev.timeOfDay === 'middag' ||
                          parseInt(ev.startTime.split(':')[0], 10) >= 12) &&
                        !isAvond;

                      return (
                        <div
                          key={ev.id}
                          className={`rounded-md border shadow-2xs flex items-start gap-1 leading-tight ${cfg.cardBg} ${cfg.cardBorder} ${
                            isAvond ? 'border-l-3 border-l-indigo-400' : isMiddag ? 'border-l-3 border-l-amber-400' : 'border-l-3 border-l-sky-400'
                          } ${density === 'groot' ? 'p-1 sm:p-1.5' : density === 'comfort' ? 'p-1' : 'p-0.5 sm:p-1'}`}
                        >
                          {/* Checkbox for kids */}
                          {includeCheckboxes && (
                            <span
                              className={`rounded-full border border-slate-400 mt-0.5 shrink-0 inline-block bg-slate-50 text-center ${
                                density === 'groot' ? 'w-3.5 h-3.5' : density === 'comfort' ? 'w-3 h-3' : 'w-2.5 h-2.5'
                              }`}
                              title="Zet een vinkje als dit klaar is!"
                            />
                          )}

                          {/* Emoji icon */}
                          <span className={`shrink-0 leading-none mt-0.2 ${
                            density === 'groot' ? 'text-sm' : density === 'comfort' ? 'text-xs' : 'text-[11px]'
                          }`}>
                            <IconVisual emoji={ev.iconEmoji} imageDataUrl={ev.iconImageDataUrl} imageUrl={ev.iconImageUrl} imageClassName="w-5 h-5 object-contain" />
                          </span>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-0.5">
                              {includeTimes && (
                                <span
                                  className={`font-black ${density === 'groot' ? 'text-[8.5px]' : 'text-[7.5px]'}`}
                                  style={{ color: cfg.accentColor }}
                                >
                                  {ev.startTime}
                                  {ev.endTime && <span className="text-slate-400 font-normal"> - {ev.endTime}</span>}
                                </span>
                              )}

                              {/* Member dots */}
                              {includeFamilyMembers && (
                                <div className="flex items-center gap-0.5 shrink-0 ml-auto">
                                  {evMembers.map((m) => (
                                    <span
                                      key={m.id}
                                      className="w-1.5 h-1.5 rounded-full inline-block"
                                      style={{ backgroundColor: m.color }}
                                      title={m.name}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>

                            <p className={`font-black text-slate-900 truncate ${
                              density === 'groot' ? 'text-[9px]' : density === 'comfort' ? 'text-[8.5px]' : 'text-[8px]'
                            }`}>
                              {ev.title}
                            </p>

                            {includeLocations && ev.location && (
                              <p className="text-[6.5px] text-slate-500 truncate">
                                📍 {ev.location}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Bottom Inkleur-sterren voor Jaren (☆ ☆ ☆) */}
              {includeColoringStars && (
                <div className="p-0.5 text-center border-t border-slate-200/80 bg-white shrink-0">
                  <div className="flex items-center justify-center gap-0.5 text-[7px] font-black text-amber-900">
                    <span className="text-[6.5px] uppercase">Dag:</span>
                    <span className="text-[9px] text-amber-400 font-normal tracking-widest">
                      ☆ ☆ ☆
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Footer Band: Boodschappen Speurtocht + Sticker/Tekenhoekje + Gezinsboodschap */}
      <div className="mt-1 pt-1 border-t-2 border-amber-300 grid grid-cols-1 md:grid-cols-12 gap-1.5 shrink-0 items-center">
        {includeGroceries && (
          <div className="md:col-span-5 p-1 rounded-xl border border-emerald-300 bg-emerald-50/70 flex items-center gap-1.5">
            <div className="flex items-center gap-1 text-[8px] font-black text-emerald-950 shrink-0">
              <ShoppingBag className="w-3 h-3 text-emerald-600" />
              <span>🛒 Speurtocht:</span>
            </div>
            <div className="flex items-center gap-1 flex-wrap overflow-hidden">
              {groceries.length === 0 ? (
                <span className="text-[7.5px] text-slate-500 font-semibold">
                  Alles in huis! Lekker smullen! 🍏
                </span>
              ) : (
                groceries.slice(0, 6).map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-0.5 text-[7.5px] font-extrabold text-slate-800 bg-white px-1 py-0.2 rounded border border-emerald-300 shadow-2xs"
                  >
                    <span className="w-2 h-2 rounded-xs border border-slate-400 inline-block mr-0.5" />
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </span>
                ))
              )}
            </div>
          </div>
        )}

        {includeDrawingCorner && (
          <div className="md:col-span-3 p-1 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50/60 text-center flex items-center justify-center gap-1">
            <span className="text-xs">🎨</span>
            <span className="text-[7.5px] font-black text-purple-900">
              {childFirstName}&apos;s Sticker- of Tekenplekje! 🖍️
            </span>
          </div>
        )}

        {includeNotes && (
          <div className="md:col-span-4 p-1 rounded-xl border border-amber-300 bg-amber-50/80 flex items-center justify-between">
            <span className="text-[8px] font-black text-amber-950 flex items-center gap-1 truncate">
              <span>💬</span> {familyNote}
            </span>
            <span className="text-[7px] text-amber-800 font-black shrink-0 pl-1">
              📌 Koelkast A4
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// =========================================================================
// 2. PRINTABLE DAY SHEET (1 Specific Day A4 - Morning, Noon & Evening!)
// =========================================================================
interface PrintableDaySheetProps {
  dayDateStr: string;
  events: AgendaEvent[];
  members: FamilyMember[];
  theme?: PrintTheme;
  density?: 'compact' | 'comfort' | 'groot';
  ecoInkSaver?: boolean;
  orientation?: 'landscape' | 'portrait';
  includeGroceries: boolean;
  includeNotes: boolean;
  includeStars?: boolean;
  includeWeatherDoodles?: boolean;
  includeColoringStars?: boolean;
  includeCheckboxes?: boolean;
  includeDrawingCorner?: boolean;
  includeFamilyMembers?: boolean;
  includeTimes?: boolean;
  includeLocations?: boolean;
  childFirstName?: string;
  childStars?: number;
  familyNote: string;
  groceries: GroceryItem[];
}

const PrintableDaySheet: React.FC<PrintableDaySheetProps> = ({
  dayDateStr,
  events,
  members,
  theme = 'regenboog',
  density = 'compact',
  ecoInkSaver = false,
  orientation = 'portrait',
  includeGroceries,
  includeNotes,
  includeStars = true,
  includeWeatherDoodles = true,
  includeColoringStars = true,
  includeCheckboxes = true,
  includeDrawingCorner = true,
  includeFamilyMembers = true,
  includeTimes = true,
  includeLocations = true,
  childFirstName = 'Jaren',
  childStars = 0,
  familyNote,
  groceries,
}) => {
  const dutchFullDate = useMemo(() => formatDutchFullDate(dayDateStr), [dayDateStr]);

  // Group events into 3 day parts
  const ochtendEvents = useMemo(
    () => events.filter((e) => e.timeOfDay === 'ochtend' || parseInt(e.startTime.split(':')[0], 10) < 12),
    [events]
  );
  const middagEvents = useMemo(
    () =>
      events.filter(
        (e) =>
          (e.timeOfDay === 'middag' ||
            (parseInt(e.startTime.split(':')[0], 10) >= 12 &&
              parseInt(e.startTime.split(':')[0], 10) < 17)) &&
          !ochtendEvents.includes(e)
      ),
    [events, ochtendEvents]
  );
  const avondEvents = useMemo(
    () =>
      events.filter(
        (e) =>
          (e.timeOfDay === 'avond' || parseInt(e.startTime.split(':')[0], 10) >= 17) &&
          !ochtendEvents.includes(e) &&
          !middagEvents.includes(e)
      ),
    [events, ochtendEvents, middagEvents]
  );

  return (
    <div className={`w-full bg-white text-slate-900 font-sans print-sheet flex flex-col justify-between select-none p-2 sm:p-4 ${
      ecoInkSaver ? 'grayscale' : ''
    }`}>
      {/* Cheerful Day Banner */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b-3 border-amber-400 gap-3 bg-amber-50/70 p-2.5 rounded-2xl">
        <div className="flex items-center gap-3">
          <img
            src={kidsMascotImg}
            alt="Mascotte"
            className="w-14 h-14 rounded-2xl border-2 border-amber-400 shadow-xs object-cover"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-xs font-black">
                🌟 Dagplanning voor {childFirstName}
              </span>
              <span className="text-xs text-amber-800 font-bold">Groep 3 Kanjer</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 capitalize mt-0.5">
              {dutchFullDate}
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Vandaag maken we er een superleuke en gezellige dag van! 🎈
            </p>
          </div>
        </div>

        {/* Weather & Mood Pickers for Child */}
        {includeWeatherDoodles && (
          <div className="bg-white p-2 rounded-2xl border-2 border-amber-200 text-center shrink-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              🖍️ Omcirkel vandaag:
            </span>
            <div className="flex items-center gap-2 text-base">
              <span title="Zonnig">☀️</span>
              <span title="Half bewolkt">⛅</span>
              <span title="Regen">🌧️</span>
              <span className="text-slate-300">|</span>
              <span title="Blij">😄</span>
              <span title="Super">🥳</span>
              <span title="Lief">🥰</span>
            </div>
          </div>
        )}
      </div>

      {/* 3 Main Sections: Ochtend, Middag, Avond */}
      <div
        className={`grid gap-3 flex-1 ${
          orientation === 'landscape' ? 'grid-cols-3' : 'grid-cols-1'
        }`}
      >
        {/* 1. OCHTEnd */}
        <div className="border-2 border-sky-300 rounded-2xl bg-sky-50/40 p-2.5 flex flex-col">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b-2 border-sky-200">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">🌅</span>
              <h2 className="text-sm font-black text-sky-950 uppercase tracking-wide">
                1. Ochtend (vóór 12:00)
              </h2>
            </div>
            <span className="text-xs font-bold text-sky-800">
              {ochtendEvents.length} {ochtendEvents.length === 1 ? 'taak' : 'taken'}
            </span>
          </div>

          <div className="space-y-1.5 flex-1">
            {ochtendEvents.length === 0 ? (
              <div className="h-full min-h-[60px] flex items-center justify-center text-xs text-sky-700 italic border border-dashed border-sky-200 rounded-xl bg-white/60 p-2">
                Rustige ochtend! Lekker ontbijten 🥪
              </div>
            ) : (
              ochtendEvents.map((ev) => (
                <DayEventItem
                  key={ev.id}
                  event={ev}
                  members={members}
                  density={density}
                  includeCheckboxes={includeCheckboxes}
                  includeFamilyMembers={includeFamilyMembers}
                  includeTimes={includeTimes}
                  includeLocations={includeLocations}
                />
              ))
            )}
          </div>
        </div>

        {/* 2. MIDDAG */}
        <div className="border-2 border-amber-300 rounded-2xl bg-amber-50/40 p-2.5 flex flex-col">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b-2 border-amber-200">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">☀️</span>
              <h2 className="text-sm font-black text-amber-950 uppercase tracking-wide">
                2. Middag (12:00 - 17:30)
              </h2>
            </div>
            <span className="text-xs font-bold text-amber-800">
              {middagEvents.length} {middagEvents.length === 1 ? 'activiteit' : 'activiteiten'}
            </span>
          </div>

          <div className="space-y-1.5 flex-1">
            {middagEvents.length === 0 ? (
              <div className="h-full min-h-[60px] flex items-center justify-center text-xs text-amber-700 italic border border-dashed border-amber-200 rounded-xl bg-white/60 p-2">
                Vrije middag! Lekker buiten spelen of knutselen 🎨
              </div>
            ) : (
              middagEvents.map((ev) => (
                <DayEventItem
                  key={ev.id}
                  event={ev}
                  members={members}
                  density={density}
                  includeCheckboxes={includeCheckboxes}
                  includeFamilyMembers={includeFamilyMembers}
                  includeTimes={includeTimes}
                  includeLocations={includeLocations}
                />
              ))
            )}
          </div>
        </div>

        {/* 3. AVOND */}
        <div className="border-2 border-indigo-300 rounded-2xl bg-indigo-50/40 p-2.5 flex flex-col">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b-2 border-indigo-200">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">🌙</span>
              <h2 className="text-sm font-black text-indigo-950 uppercase tracking-wide">
                3. Avond (17:30 - Bedtijd)
              </h2>
            </div>
            <span className="text-xs font-bold text-indigo-800">
              {avondEvents.length} {avondEvents.length === 1 ? 'stap' : 'stappen'}
            </span>
          </div>

          <div className="space-y-1.5 flex-1">
            {avondEvents.length === 0 ? (
              <div className="h-full min-h-[60px] flex items-center justify-center text-xs text-indigo-700 italic border border-dashed border-indigo-200 rounded-xl bg-white/60 p-2">
                Gezellige rustige avond & verhaaltje voor het slapen gaan 📖
              </div>
            ) : (
              avondEvents.map((ev) => (
                <DayEventItem
                  key={ev.id}
                  event={ev}
                  members={members}
                  density={density}
                  includeCheckboxes={includeCheckboxes}
                  includeFamilyMembers={includeFamilyMembers}
                  includeTimes={includeTimes}
                  includeLocations={includeLocations}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Star Milestone & Notes & Drawing Corner */}
      <div className="mt-3 pt-2 border-t-2 border-amber-300 grid grid-cols-1 md:grid-cols-12 gap-2 shrink-0 items-center">
        {/* 5 Daily Stars for Child */}
        {includeColoringStars && (
          <div className="md:col-span-4 p-2 rounded-2xl border-2 border-amber-300 bg-amber-50/80 text-center">
            <span className="text-[10px] font-black uppercase text-amber-900 block mb-0.5">
              ⭐ Mijn Dag-Sterren (Kleur in bij elke voltooide taak!):
            </span>
            <div className="flex items-center justify-center gap-1 text-lg text-amber-400">
              <span>☆</span>
              <span>☆</span>
              <span>☆</span>
              <span>☆</span>
              <span>☆</span>
            </div>
          </div>
        )}

        {/* Drawing & Sticker Corner */}
        {includeDrawingCorner && (
          <div className="md:col-span-4 p-2 rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50/60 text-center">
            <span className="text-[10px] font-black text-purple-900 block">
              🎨 {childFirstName}&apos;s Sticker- of Tekenplekje:
            </span>
            <div className="h-8 flex items-center justify-center text-xs text-purple-400">
              Plak hier een mooie beloningssticker! 🖍️
            </div>
          </div>
        )}

        {/* Family Note */}
        {includeNotes && (
          <div className="md:col-span-4 p-2 rounded-2xl border-2 border-amber-300 bg-white">
            <span className="text-[10px] font-black text-slate-500 uppercase block mb-0.5">
              💬 Boodschap van Papa & Mama:
            </span>
            <p className="text-xs font-black text-amber-900 truncate">{familyNote}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-component for individual events in Single Day Print Sheet
interface DayEventItemProps {
  event: AgendaEvent;
  members: FamilyMember[];
  density?: 'compact' | 'comfort' | 'groot';
  includeCheckboxes?: boolean;
  includeFamilyMembers?: boolean;
  includeTimes?: boolean;
  includeLocations?: boolean;
}

const DayEventItem: React.FC<DayEventItemProps> = ({
  event,
  members,
  includeCheckboxes,
  includeFamilyMembers,
  density,
  includeTimes = true,
  includeLocations = true,
}) => {
  const evMembers = members.filter((m) => event.memberIds.includes(m.id));

  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between gap-2 ${
      density === 'groot' ? 'p-2.5' : 'p-1.5 sm:p-2'
    }`}>
      <div className="flex items-center gap-2 min-w-0">
        {includeCheckboxes && (
          <span
            className="w-4 h-4 rounded-full border-2 border-slate-400 shrink-0 inline-block bg-slate-50"
            title="Kleur in als dit klaar is!"
          />
        )}
        <IconVisual emoji={event.iconEmoji} imageDataUrl={event.iconImageDataUrl} imageUrl={event.iconImageUrl} className={`${density === 'groot' ? 'text-2xl' : 'text-xl'} shrink-0`} imageClassName="w-7 h-7 object-contain" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`${density === 'groot' ? 'text-sm' : 'text-xs'} font-black text-slate-900 truncate`}>{event.title}</span>
            {includeTimes && (
              <span className={`${density === 'groot' ? 'text-xs' : 'text-[10px]'} font-bold text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded-md`}>
                {event.startTime}
                {event.endTime && ` - ${event.endTime}`}
              </span>
            )}
          </div>
          {includeLocations && event.location && (
            <span className={`${density === 'groot' ? 'text-[11px]' : 'text-[9px]'} text-slate-500 block truncate`}>📍 {event.location}</span>
          )}
        </div>
      </div>

      {includeFamilyMembers && evMembers.length > 0 && (
        <div className="flex items-center gap-0.5 shrink-0">
          {evMembers.map((m) => (
            <span
              key={m.id}
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: m.color }}
              title={m.name}
            />
          ))}
        </div>
      )}
    </div>
  );
};

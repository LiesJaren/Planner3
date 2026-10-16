import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Sparkles,
  Check,
  Calendar,
  Clock,
  Users,
  Plus,
  Trash2,
  Edit2,
  Copy,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  Sun,
  Moon,
  Smile,
  Zap,
  Bookmark,
  CheckCircle2,
  Palette,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  AgendaEvent,
  FamilyMember,
  RoutineTemplate,
  RoutineActivity,
  TimeOfDay,
  Role,
  ActivityIcon,
  IconCategoryMeta,
} from '../types/family';
import { DEFAULT_ROUTINES } from '../data/defaultRoutines';
import { getIconById } from '../data/iconLibrary';
import { IconPickerModal } from './IconPickerModal';
import { soundEffects, spreekBericht } from '../utils/audio';
import { IconVisual } from './IconVisual';
import {
  getTodayDateStr,
  parseLocalDate,
  addDays,
  getWeekMonday,
  formatDutchFullDate,
} from '../utils/dateUtils';

const QUICK_EMOJIS = [
  '🌅', '🌙', '🎒', '⚽', '🏊', '🥋', '🎨', '🎵',
  '🚲', '🧹', '🍕', '🍦', '📚', '🛁', '🪥', '⭐',
  '👕', '🥪', '🚀', '🏕️', '🎮', '🧩', '🐶', '🥗',
];

const ACTIVITY_QUICK_PRESETS = [
  { emoji: '🪥', label: 'Tanden poetsen', id: 'zorg_tanden', timeOfDay: 'ochtend' as const },
  { emoji: '🎒', label: 'School', id: 'schooltas', timeOfDay: 'ochtend' as const },
  { emoji: '🥣', label: 'Ontbijt eten', id: 'eten_ontbijt', timeOfDay: 'ochtend' as const },
  { emoji: '👕', label: 'Aankleden', id: 'dagelijks_opstaan', timeOfDay: 'ochtend' as const },
  { emoji: '📖', label: 'Huiswerk / Boek lezen', id: 'school_huiswerk', timeOfDay: 'middag' as const },
  { emoji: '⚽', label: 'Sport / Training', id: 'sportbal', timeOfDay: 'middag' as const },
  { emoji: '🏊‍♂️', label: 'Zwemles', id: 'zwemles', timeOfDay: 'middag' as const },
  { emoji: '🥪', label: 'Middagmaal', id: 'maaltijd', timeOfDay: 'middag' as const },
  { emoji: '🍎', label: 'Fruitje eten', id: 'fruit_appel', timeOfDay: 'middag' as const },
  { emoji: '🍽️', label: 'Avondeten samen', id: 'maaltijd', timeOfDay: 'avond' as const },
  { emoji: '🛁', label: 'Douche of bad', id: 'badderen', timeOfDay: 'avond' as const },
  { emoji: '🛏️', label: 'Naar bed & verhaaltje', id: 'bedje', timeOfDay: 'avond' as const },
  { emoji: '🩺', label: 'Afspraak arts / diëtiste', id: 'zorg_arts', timeOfDay: 'middag' as const },
  { emoji: '🧸', label: 'Vrij spelen', id: 'spelen', timeOfDay: 'middag' as const },
  { emoji: '🧹', label: 'Kamer opruimen', id: 'opruimen', timeOfDay: 'avond' as const },
];

interface InsertRoutineModalProps {
  isOpen: boolean;
  defaultDate?: string;
  members: FamilyMember[];
  customTemplates?: RoutineTemplate[];
  initialMode?: 'insert' | 'create';
  initialTemplateId?: string;
  customIcons?: ActivityIcon[];
  customCategories?: IconCategoryMeta[];
  onOpenCreateIconModal?: () => void;
  onSaveCustomTemplate?: (template: RoutineTemplate) => void;
  onDeleteCustomTemplate?: (templateId: string) => void;
  onBatchInsertEvents: (events: AgendaEvent[]) => void;
  onClose: () => void;
}

export const InsertRoutineModal: React.FC<InsertRoutineModalProps> = ({
  isOpen,
  defaultDate,
  members,
  customTemplates = [],
  initialMode = 'insert',
  initialTemplateId,
  customIcons = [],
  customCategories = [],
  onOpenCreateIconModal,
  onSaveCustomTemplate,
  onDeleteCustomTemplate,
  onBatchInsertEvents,
  onClose,
}) => {
  // Modal Mode: 'insert' or 'create' (or 'edit')
  const [modalMode, setModalMode] = useState<'insert' | 'create'>(initialMode);

  // All templates combined (defaults + customs)
  const allTemplates = useMemo(() => {
    return [...customTemplates, ...DEFAULT_ROUTINES];
  }, [customTemplates]);

  // Selected template for insertion
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialTemplateId || allTemplates[0]?.id || 'rt_ochtend_school'
  );

  const selectedTemplate = useMemo(() => {
    return allTemplates.find((t) => t.id === selectedTemplateId) || allTemplates[0];
  }, [allTemplates, selectedTemplateId]);

  // Reset selectedTemplateId if initialTemplateId changes
  useEffect(() => {
    if (initialTemplateId) {
      setSelectedTemplateId(initialTemplateId);
    }
  }, [initialTemplateId]);

  // Target Date selection using accurate local dates
  const todayStr = useMemo(() => getTodayDateStr(), []);
  const [targetDateMode, setTargetDateMode] = useState<'single' | 'multidays'>('single');
  const [targetDate, setTargetDate] = useState<string>(defaultDate || todayStr);

  // For multi-days selection (e.g., entire school week Ma t/m Vr)
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 2, 3, 4, 5]); // 1=Ma, 2=Di, etc.

  // Target members: default to Jaren (or child)
  const childMember = members.find((m) => m.role === 'kind') || members[0];
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([
    childMember?.id || 'm3',
  ]);

  // Toggled activities in the selected routine
  const [activeActivityIds, setActiveActivityIds] = useState<string[]>([]);

  // When selectedTemplate changes, reset activeActivityIds to all activities of that template
  useEffect(() => {
    if (selectedTemplate) {
      setActiveActivityIds(selectedTemplate.activities.map((a) => a.id));
    }
  }, [selectedTemplate]);

  // =========================================================================
  // CUSTOM ROUTINE BUILDER STATE
  // =========================================================================
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [routineFormName, setRoutineFormName] = useState('');
  const [routineFormEmoji, setRoutineFormEmoji] = useState('⭐');
  const [routineFormIconId, setRoutineFormIconId] = useState('ster');
  const [routineFormDesc, setRoutineFormDesc] = useState('');
  const [routineFormCategory, setRoutineFormCategory] = useState<string>('ochtend');
  const [routineFormSuggestedDays, setRoutineFormSuggestedDays] = useState('Ma t/m Vr');
  const [routineFormTargetRole, setRoutineFormTargetRole] = useState<Role | 'all'>('kind');

  // Activities inside the custom routine being built
  const [builderActivities, setBuilderActivities] = useState<RoutineActivity[]>([
    {
      id: `act_${Date.now()}_1`,
      title: 'Opstaan & kleren klaarmaken',
      startTime: '07:15',
      endTime: '07:35',
      iconId: 'dagelijks_opstaan',
      iconEmoji: '👕',
      iconLabel: 'Opstaan',
      timeOfDay: 'ochtend',
      notes: 'Zelf aankleden',
      isRoutine: true,
    },
    {
      id: `act_${Date.now()}_2`,
      title: 'Tanden poetsen & wassen',
      startTime: '07:35',
      endTime: '07:45',
      iconId: 'zorg_tanden',
      iconEmoji: '🪥',
      iconLabel: 'Tanden poetsen',
      timeOfDay: 'ochtend',
      notes: '2 minuten goed poetsen',
      isRoutine: true,
    },
  ]);

  // Activity form inside builder (for adding OR editing an activity)
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [actFormTitle, setActFormTitle] = useState('');
  const [actFormStartTime, setActFormStartTime] = useState('08:00');
  const [actFormEndTime, setActFormEndTime] = useState('08:30');
  const [actFormEmoji, setActFormEmoji] = useState('🎒');
  const [actFormImageDataUrl, setActFormImageDataUrl] = useState<string | undefined>();
  const [actFormImageUrl, setActFormImageUrl] = useState<string | undefined>();
  const [actFormIconId, setActFormIconId] = useState('schooltas');
  const [actFormIconLabel, setActFormIconLabel] = useState('School');
  const [actFormNotes, setActFormNotes] = useState('');
  const [actFormTimeOfDay, setActFormTimeOfDay] = useState<TimeOfDay>('ochtend');

  // IconPickerModal state
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [iconPickerTarget, setIconPickerTarget] = useState<'routine' | 'activity'>('activity');
  const [quickIconEditActId, setQuickIconEditActId] = useState<string | null>(null);
  const [builderError, setBuilderError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Compute target dates to insert safely using dateUtils
  const targetDateList: string[] = [];
  if (targetDateMode === 'single') {
    targetDateList.push(targetDate);
  } else {
    // Generate dates for current week matching selected weekdays
    const mondayStr = getWeekMonday(targetDate || todayStr);
    selectedWeekdays.forEach((dayNum) => {
      // 1=Monday, 2=Tuesday... 7=Sunday
      targetDateList.push(addDays(mondayStr, dayNum - 1));
    });
  }

  // Toggle single activity inside routine
  const handleToggleActivity = (actId: string) => {
    soundEffects.playTap();
    if (activeActivityIds.includes(actId)) {
      setActiveActivityIds(activeActivityIds.filter((id) => id !== actId));
    } else {
      setActiveActivityIds([...activeActivityIds, actId]);
    }
  };

  // Toggle member
  const handleToggleMember = (mId: string) => {
    soundEffects.playTap();
    if (selectedMemberIds.includes(mId)) {
      if (selectedMemberIds.length > 1) {
        setSelectedMemberIds(selectedMemberIds.filter((id) => id !== mId));
      }
    } else {
      setSelectedMemberIds([...selectedMemberIds, mId]);
    }
  };

  // Toggle weekday for multi-day insertion
  const handleToggleWeekday = (dayNum: number) => {
    soundEffects.playTap();
    if (selectedWeekdays.includes(dayNum)) {
      if (selectedWeekdays.length > 1) {
        setSelectedWeekdays(selectedWeekdays.filter((d) => d !== dayNum));
      }
    } else {
      setSelectedWeekdays([...selectedWeekdays, dayNum].sort());
    }
  };

  // Submit and batch insert
  const handleInsert = () => {
    if (!selectedTemplate) return;

    const chosenActivities = selectedTemplate.activities.filter((a) =>
      activeActivityIds.includes(a.id)
    );

    if (chosenActivities.length === 0) {
      alert('Selecteer minimaal 1 activiteit uit de routine om in te voegen.');
      return;
    }

    const newEvents: AgendaEvent[] = [];

    // For every target date, add each chosen activity
    targetDateList.forEach((dStr) => {
      chosenActivities.forEach((act) => {
        const ev: AgendaEvent = {
          id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: act.title,
          date: dStr,
          startTime: act.startTime || act.time || '08:00',
          endTime: act.endTime,
          iconId: act.iconId,
          iconEmoji: act.iconEmoji,
          iconImageDataUrl: act.iconImageDataUrl,
          iconImageUrl: act.iconImageUrl,
          iconLabel: act.iconLabel,
          memberIds: selectedMemberIds,
          timeOfDay: act.timeOfDay,
          notes: act.notes,
          isRoutine: act.isRoutine ?? true,
          completed: false,
        };
        newEvents.push(ev);
      });
    });

    soundEffects.playVictoryFanfare();
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
    });

    onBatchInsertEvents(newEvents);
    spreekBericht(
      `Hoera! De routine "${selectedTemplate.name}" is met ${newEvents.length} activiteiten ingepland!`
    );
    onClose();
  };

  // Builder actions
  const handleStartNewRoutine = () => {
    soundEffects.playTap();
    setEditingRoutineId(null);
    setRoutineFormName('');
    setRoutineFormEmoji('⭐');
    setRoutineFormIconId('ster');
    setRoutineFormDesc('');
    setRoutineFormCategory('ochtend');
    setRoutineFormSuggestedDays('Ma t/m Vr');
    setRoutineFormTargetRole('kind');
    setBuilderActivities([
      {
        id: `act_${Date.now()}_1`,
        title: 'Opstaan & klaarmaken',
        startTime: '07:30',
        endTime: '08:00',
        iconId: 'dagelijks_opstaan',
        iconEmoji: '👕',
        iconLabel: 'Opstaan',
        timeOfDay: 'ochtend',
        notes: '',
        isRoutine: true,
      },
      {
        id: `act_${Date.now()}_2`,
        title: 'Lekker ontbijten',
        startTime: '08:00',
        endTime: '08:25',
        iconId: 'eten_ontbijt',
        iconEmoji: '🥣',
        iconLabel: 'Ontbijten',
        timeOfDay: 'ochtend',
        notes: '',
        isRoutine: true,
      },
    ]);
    resetActivityForm();
    setModalMode('create');
  };

  const handleEditExistingRoutine = (template: RoutineTemplate) => {
    soundEffects.playTap();
    setEditingRoutineId(template.id);
    setRoutineFormName(template.name || template.title || '');
    setRoutineFormEmoji(template.emoji || template.icon || '⭐');
    setRoutineFormIconId(template.id);
    setRoutineFormDesc(template.description || '');
    setRoutineFormCategory(template.category || 'dagelijks');
    setRoutineFormSuggestedDays(Array.isArray(template.suggestedDays) ? template.suggestedDays.join(',') : (template.suggestedDays || ''));
    setRoutineFormTargetRole((template.targetMemberRole as "all" | Role) || 'kind');
    setBuilderActivities([...template.activities]);
    resetActivityForm();
    setModalMode('create');
  };

  const handleDuplicateRoutine = (template: RoutineTemplate) => {
    soundEffects.playTap();
    setEditingRoutineId(null);
    setRoutineFormName(`${template.name || template.title || 'Routine'} (Kopie)`);
    setRoutineFormEmoji(template.emoji || template.icon || '⭐');
    setRoutineFormIconId(template.id);
    setRoutineFormDesc(template.description || '');
    setRoutineFormCategory(template.category || 'dagelijks');
    setRoutineFormSuggestedDays(Array.isArray(template.suggestedDays) ? template.suggestedDays.join(',') : (template.suggestedDays || ''));
    setRoutineFormTargetRole((template.targetMemberRole as "all" | Role) || 'kind');
    setBuilderActivities(
      template.activities.map((act) => ({
        ...act,
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      }))
    );
    resetActivityForm();
    setModalMode('create');
  };

  const resetActivityForm = () => {
    setEditingActivityId(null);
    setActFormTitle('');
    setActFormStartTime('08:00');
    setActFormEndTime('08:30');
    setActFormEmoji('🎒');
    setActFormImageDataUrl(undefined);
    setActFormImageUrl(undefined);
    setActFormIconId('schooltas');
    setActFormIconLabel('School');
    setActFormNotes('');
    setActFormTimeOfDay('ochtend');
  };

  const handleEditActivityInBuilder = (act: RoutineActivity) => {
    soundEffects.playTap();
    setEditingActivityId(act.id);
    setActFormTitle(act.title);
    setActFormStartTime(act.startTime || act.time || '08:00');
    setActFormEndTime(act.endTime || '');
    setActFormEmoji(act.iconEmoji || act.icon || '⭐');
    setActFormImageDataUrl(act.iconImageDataUrl);
    setActFormImageUrl(act.iconImageUrl);
    setActFormIconId(act.iconId || act.icon || 'ic_star');
    setActFormIconLabel(act.iconLabel || act.title || 'Activiteit');
    setActFormNotes(act.notes || '');
    setActFormTimeOfDay(act.timeOfDay || 'ochtend');
  };

  const handleSaveActivityToBuilder = () => {
    if (!actFormTitle.trim()) {
      setBuilderError('Vul een titel in voor deze activiteit (of klik op een van de vrolijke snelkeuzes).');
      return;
    }
    setBuilderError(null);
    soundEffects.playTap();

    if (editingActivityId) {
      // Updating existing activity
      setBuilderActivities((prev) =>
        prev.map((act) =>
          act.id === editingActivityId
            ? {
                ...act,
                title: actFormTitle.trim(),
                startTime: actFormStartTime,
                endTime: actFormEndTime || undefined,
                iconId: actFormIconId,
                iconEmoji: actFormEmoji,
                iconImageDataUrl: actFormImageDataUrl,
                iconImageUrl: actFormImageUrl,
                iconLabel: actFormIconLabel,
                timeOfDay: actFormTimeOfDay,
                notes: actFormNotes.trim() || undefined,
              }
            : act
        )
      );
      resetActivityForm();
    } else {
      // Adding new activity
      const newAct: RoutineActivity = {
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: actFormTitle.trim(),
        startTime: actFormStartTime,
        endTime: actFormEndTime || undefined,
        iconId: actFormIconId,
        iconEmoji: actFormEmoji,
        iconImageDataUrl: actFormImageDataUrl,
        iconImageUrl: actFormImageUrl,
        iconLabel: actFormIconLabel,
        timeOfDay: actFormTimeOfDay,
        notes: actFormNotes.trim() || undefined,
        isRoutine: true,
      };
      setBuilderActivities((prev) => [...prev, newAct]);
      resetActivityForm();
    }
  };

  const handleDeleteActivityFromBuilder = (id: string) => {
    soundEffects.playTap();
    setBuilderActivities((prev) => prev.filter((a) => a.id !== id));
    if (editingActivityId === id) {
      resetActivityForm();
    }
  };

  const handleDuplicateActivityInBuilder = (act: RoutineActivity) => {
    soundEffects.playTap();
    const cloned: RoutineActivity = {
      ...act,
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: `${act.title} (Kopie)`,
    };
    setBuilderActivities((prev) => [...prev, cloned]);
  };

  const handleMoveActivity = (index: number, direction: 'up' | 'down') => {
    soundEffects.playTap();
    const newArr = [...builderActivities];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newArr.length) return;
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    setBuilderActivities(newArr);
  };

  // Handle selected icon from IconPickerModal
  const handleSelectIconFromPicker = (icon: ActivityIcon) => {
    soundEffects.playTap();
    if (quickIconEditActId) {
      setBuilderActivities((prev) =>
        prev.map((a) =>
          a.id === quickIconEditActId
            ? { ...a, iconEmoji: icon.emoji, iconImageDataUrl: icon.imageDataUrl, iconImageUrl: icon.imageUrl, iconId: icon.id, iconLabel: icon.label }
            : a
        )
      );
      if (editingActivityId === quickIconEditActId) {
        setActFormEmoji(icon.emoji);
        setActFormImageDataUrl(icon.imageDataUrl);
        setActFormImageUrl(icon.imageUrl);
        setActFormIconId(icon.id);
        setActFormIconLabel(icon.label);
      }
      setQuickIconEditActId(null);
    } else if (iconPickerTarget === 'routine') {
      setRoutineFormEmoji(icon.emoji);
      setRoutineFormIconId(icon.id);
    } else {
      setActFormEmoji(icon.emoji);
      setActFormImageDataUrl(icon.imageDataUrl);
      setActFormImageUrl(icon.imageUrl);
      setActFormIconId(icon.id);
      setActFormIconLabel(icon.label);
      if (!actFormTitle.trim()) {
        setActFormTitle(icon.label.split('/')[0].trim());
      }
    }
    setIsIconPickerOpen(false);
  };

  const handleApplyActivityPreset = (preset: typeof ACTIVITY_QUICK_PRESETS[0]) => {
    soundEffects.playTap();
    setActFormEmoji(preset.emoji);
    setActFormImageDataUrl(undefined);
    setActFormImageUrl(undefined);
    setActFormIconId(preset.id);
    setActFormIconLabel(preset.label);
    setActFormTimeOfDay(preset.timeOfDay);
    if (!actFormTitle.trim() || ACTIVITY_QUICK_PRESETS.some((p) => p.label === actFormTitle)) {
      setActFormTitle(preset.label);
    }
    setBuilderError(null);
  };

  const handleSaveRoutineTemplate = (autoInsertAfterSave: boolean = false) => {
    if (!routineFormName.trim()) {
      setBuilderError('Geef je routine eerst een herkenbare naam in stap 1.');
      return;
    }

    if (builderActivities.length === 0) {
      setBuilderError('Voeg minimaal 1 activiteit toe aan je routine in stap 3.');
      return;
    }
    setBuilderError(null);

    const templateId =
      editingRoutineId || `rt_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newTemplate: RoutineTemplate = {
      id: templateId,
      name: routineFormName.trim(),
      description: routineFormDesc.trim() || `Zelfgemaakte routine met ${builderActivities.length} activiteiten`,
      emoji: routineFormEmoji || '⭐',
      category: routineFormCategory as any,
      suggestedDays: routineFormSuggestedDays.trim() || undefined,
      targetMemberRole: routineFormTargetRole,
      activities: builderActivities,
      isCustom: true,
    };

    if (onSaveCustomTemplate) {
      onSaveCustomTemplate(newTemplate);
    }

    setSelectedTemplateId(newTemplate.id);
    soundEffects.playVictoryFanfare();
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    spreekBericht(`Routine "${newTemplate.name}" is opgeslagen in je bibliotheek!`);

    if (autoInsertAfterSave) {
      setModalMode('insert');
    } else {
      setModalMode('insert');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto no-print">
        <div
          className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-amber-300 my-4 flex flex-col max-h-[94vh]"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-amber-100 via-orange-100 to-yellow-100 border-b border-amber-300 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-xs border-2 border-white">
                <Zap className="w-6 h-6 fill-amber-200" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>Vaste Routines & Pakketten</span>
                  <span className="px-2 py-0.5 rounded-full bg-white text-[11px] font-black text-amber-900 border border-amber-300">
                    ⚡ 1-Klik Inplannen
                  </span>
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  Plan in 1 klik complete ochtend-, school- of avondroutines in voor meerdere dagen
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

          {/* Mode Switcher Tabs */}
          <div className="px-6 pt-3 pb-2 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  setModalMode('insert');
                }}
                className={`py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalMode === 'insert'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Routine Invoegen ({allTemplates.length} Beschikbaar)</span>
              </button>

              <button
                type="button"
                onClick={handleStartNewRoutine}
                className={`py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalMode === 'create'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nieuwe Routine Bouwen & Opmaken</span>
              </button>
            </div>

            {modalMode === 'insert' && (
              <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-xl hidden sm:inline-block">
                🗓️ Doel: {formatDutchFullDate(targetDate)}
              </span>
            )}
          </div>

          {/* ========================================================================= */}
          {/* MODE 1: ROUTINE KIEZEN EN INVOEGEN                                        */}
          {/* ========================================================================= */}
          {modalMode === 'insert' && (
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Step 1: Routine Template Carousel / List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                    <span>1. Kies een Routine Sjabloon:</span>
                    <span className="text-amber-800 font-bold normal-case">
                      ({allTemplates.length} sjablonen)
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={handleStartNewRoutine}
                    className="text-xs font-black text-indigo-700 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Zelf nieuwe routine ontwerpen</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {allTemplates.map((template) => {
                    const isSelected = template.id === selectedTemplateId;
                    return (
                      <div
                        key={template.id}
                        onClick={() => {
                          soundEffects.playTap();
                          setSelectedTemplateId(template.id);
                        }}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between text-left relative ${
                          isSelected
                            ? 'bg-amber-50/90 border-amber-500 shadow-sm ring-2 ring-amber-300'
                            : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-2xl p-1 bg-white rounded-xl border border-slate-100 shrink-0 shadow-2xs">
                              {template.emoji}
                            </span>
                            <div className="flex items-center gap-1">
                              {template.isCustom && (
                                <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[9px] font-black">
                                  Eigen
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-950 text-[9.5px] font-black">
                                {template.activities.length} taken
                              </span>
                            </div>
                          </div>

                          <h3 className="text-xs font-black text-slate-900 mt-2 line-clamp-1">
                            {template.name}
                          </h3>
                          <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                            {template.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[10px]">
                          <span className="text-slate-400 font-semibold truncate">
                            {template.suggestedDays || 'Elke dag'}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditExistingRoutine(template);
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                              title="Routine bewerken"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateRoutine(template);
                              }}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Routine dupliceren"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            {template.isCustom && onDeleteCustomTemplate && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Routine "${template.name}" verwijderen?`)) {
                                    onDeleteCustomTemplate(template.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                                title="Routine verwijderen"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Activiteitenlijst van de geselecteerde routine */}
              {selectedTemplate && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <span>{selectedTemplate.emoji}</span>
                      <span>Activiteiten in dit pakket ({activeActivityIds.length} geselecteerd):</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveActivityIds(selectedTemplate.activities.map((a) => a.id))
                        }
                        className="text-[11px] font-black text-amber-700 hover:underline"
                      >
                        Alles selecteren
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => handleEditExistingRoutine(selectedTemplate)}
                        className="text-[11px] font-black text-indigo-700 hover:underline flex items-center gap-0.5 ml-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Routine bewerken & icoontjes aanpassen</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {selectedTemplate.activities.map((act) => {
                      const isChecked = activeActivityIds.includes(act.id);
                      return (
                        <div
                          key={act.id}
                          onClick={() => handleToggleActivity(act.id)}
                          className={`p-2.5 rounded-xl border-2 transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            isChecked
                              ? 'bg-white border-amber-400 shadow-2xs font-bold text-slate-900'
                              : 'bg-slate-100 border-slate-200 opacity-60 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center ${
                                isChecked
                                  ? 'bg-amber-500 text-white'
                                  : 'border border-slate-300 bg-white'
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <IconVisual emoji={act.iconEmoji} imageDataUrl={act.iconImageDataUrl} imageUrl={act.iconImageUrl} className="text-xl shrink-0" imageClassName="w-6 h-6 object-contain" />
                            <div className="min-w-0">
                              <span className="text-xs truncate block">
                                {act.title}
                              </span>
                              {act.notes && (
                                <span className="text-[10px] text-slate-400 truncate block">
                                  💡 {act.notes}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>{act.startTime}</span>
                            {act.endTime && <span>- {act.endTime}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Doeldagen & Gezinslid selecteren */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date Selection */}
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                  <label className="text-xs font-black uppercase text-amber-950 tracking-wider block">
                    2. Wanneer inplannen?
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playTap();
                        setTargetDateMode('single');
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        targetDateMode === 'single'
                          ? 'bg-amber-500 text-white shadow-xs font-black'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      📅 1 Specifieke Dag
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playTap();
                        setTargetDateMode('multidays');
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        targetDateMode === 'multidays'
                          ? 'bg-amber-500 text-white shadow-xs font-black'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      🔁 Meerdere Dagen (bijv. Ma-Vr)
                    </button>
                  </div>

                  {targetDateMode === 'single' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setTargetDate(todayStr)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                            targetDate === todayStr
                              ? 'bg-amber-200 border-amber-400 text-amber-950 font-black'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          Vandaag
                        </button>
                        <button
                          type="button"
                          onClick={() => setTargetDate(addDays(todayStr, 1))}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                            targetDate === addDays(todayStr, 1)
                              ? 'bg-amber-200 border-amber-400 text-amber-950 font-black'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          Morgen
                        </button>
                      </div>
                      <input
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-bold"
                      />
                      <span className="text-[11px] text-amber-900 font-bold block">
                        Datum: {formatDutchFullDate(targetDate)}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-700 block">
                        Kies de weekdagen om in te vullen:
                      </span>
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
                          const isDaySelected = selectedWeekdays.includes(day.num);
                          return (
                            <button
                              key={day.num}
                              type="button"
                              onClick={() => handleToggleWeekday(day.num)}
                              className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                isDaySelected
                                  ? 'bg-amber-500 text-white shadow-2xs'
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                              }`}
                              title={day.name}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-2 text-xs pt-1">
                        <button
                          type="button"
                          onClick={() => setSelectedWeekdays([1, 2, 3, 4, 5])}
                          className="text-amber-800 font-bold hover:underline"
                        >
                          Ma t/m Vr (Schoolweek)
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setSelectedWeekdays([6, 7])}
                          className="text-amber-800 font-bold hover:underline"
                        >
                          Weekend
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setSelectedWeekdays([1, 2, 3, 4, 5, 6, 7])}
                          className="text-amber-800 font-bold hover:underline"
                        >
                          Alle 7 dagen
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Member Selector */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <label className="text-xs font-black uppercase text-slate-800 tracking-wider block">
                    3. Voor welk gezinslid?
                  </label>
                  <div className="space-y-1.5">
                    {members.map((m) => {
                      const isSel = selectedMemberIds.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() => handleToggleMember(m.id)}
                          className={`p-2 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                            isSel
                              ? 'bg-white border-amber-400 shadow-2xs font-black text-slate-900'
                              : 'bg-slate-100 border-slate-200 text-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow-2xs"
                              style={{ backgroundColor: m.color }}
                            >
                              {m.avatar}
                            </span>
                            <span className="text-xs">{m.name}</span>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center ${
                              isSel
                                ? 'bg-amber-500 text-white'
                                : 'border border-slate-300 bg-white'
                            }`}
                          >
                            {isSel && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODE 2: ZELF NIEUWE ROUTINE MAKEN OF BESTAANDE BEWERKEN                   */}
          {/* ========================================================================= */}
          {modalMode === 'create' && (
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Template Information */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4 text-indigo-600" />
                    <span>Stap 1: Routine Gegevens & Icoon</span>
                  </span>
                  {editingRoutineId && (
                    <span className="text-[10px] font-bold bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full">
                      Bewerken van bestaande routine
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Routine Naam:
                    </label>
                    <input
                      type="text"
                      value={routineFormName}
                      onChange={(e) => setRoutineFormName(e.target.value)}
                      placeholder="Bijv. Ochtendroutine Groep 3, Zorg & Logopedie, Sport..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Routine Icoon:
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl p-1 bg-white rounded-xl border border-slate-200 shrink-0">
                        {routineFormEmoji}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.playTap();
                          setIconPickerTarget('routine');
                          setIsIconPickerOpen(true);
                        }}
                        className="flex-1 px-3 py-2 text-xs font-bold bg-white hover:bg-indigo-50 text-indigo-900 border border-indigo-300 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <Palette className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Kies Icoon</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick emoji presets */}
                <div>
                  <span className="text-[10.5px] font-bold text-slate-500 block mb-1">
                    Of kies snel een emoji:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_EMOJIS.map((emoji, idx) => (
                      <button
                        key={`quick-${emoji}-${idx}`}
                        type="button"
                        onClick={() => setRoutineFormEmoji(emoji)}
                        className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                          routineFormEmoji === emoji
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 hover:bg-indigo-50'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Dagdeel / Categorie:
                    </label>
                    <select
                      value={routineFormCategory}
                      onChange={(e) => setRoutineFormCategory(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-bold focus:outline-hidden"
                    >
                      <option value="ochtend">🌅 Ochtend</option>
                      <option value="middag">☀️ Middag</option>
                      <option value="avond">🌙 Avond & Bedtijd</option>
                      <option value="school">🎒 School</option>
                      <option value="sport">⚽ Sport & Club</option>
                      <option value="weekend">🎉 Weekend</option>
                      <option value="aangepast">⭐ Zorg & Gezondheid</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Suggestie dagen:
                    </label>
                    <input
                      type="text"
                      value={routineFormSuggestedDays}
                      onChange={(e) => setRoutineFormSuggestedDays(e.target.value)}
                      placeholder="Bijv. Ma t/m Vr, Woensdag..."
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-bold focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Voor wie bedoeld:
                    </label>
                    <select
                      value={routineFormTargetRole}
                      onChange={(e) => setRoutineFormTargetRole(e.target.value as any)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-bold focus:outline-hidden"
                    >
                      <option value="kind">👶 Jaren / Kinderen</option>
                      <option value="ouder">👨‍👩‍👧 Ouders (Birger & Lieselot)</option>
                      <option value="all">👨‍👩‍👦 Heel het Gezin</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Korte Omschrijving:
                  </label>
                  <input
                    type="text"
                    value={routineFormDesc}
                    onChange={(e) => setRoutineFormDesc(e.target.value)}
                    placeholder="Bijv. Vaste stappen om rustig klaar te maken voor school"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Step 2: Activiteiten in deze Routine */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                    <span>Stap 2: Activiteiten in deze Routine ({builderActivities.length})</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold">
                    Klik op een activiteit of potloodje om aan te passen
                  </span>
                </div>

                {builderActivities.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-500 text-xs">
                    Nog geen activiteiten in deze routine. Voeg er hieronder een toe met de icoonkiezer!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {builderActivities.map((act, idx) => {
                      const isBeingEdited = editingActivityId === act.id;
                      return (
                        <div
                          key={act.id}
                          className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
                            isBeingEdited
                              ? 'bg-amber-50 border-amber-400 shadow-md ring-2 ring-amber-300/40'
                              : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-black text-slate-400 w-5">
                              #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                soundEffects.playTap();
                                setQuickIconEditActId(act.id);
                                setIconPickerTarget('activity');
                                setIsIconPickerOpen(true);
                              }}
                              className="text-2xl shrink-0 p-1.5 bg-white hover:bg-amber-100 rounded-xl border border-slate-200 hover:border-amber-400 shadow-2xs transition-all cursor-pointer group/icon relative"
                              title="Klik om direct een ander icoon te kiezen voor deze activiteit"
                            >
                              <IconVisual emoji={act.iconEmoji} imageDataUrl={act.iconImageDataUrl} imageUrl={act.iconImageUrl} imageClassName="w-8 h-8 object-contain" />
                              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 text-[8px] opacity-0 group-hover/icon:opacity-100 transition-opacity">
                                ✏️
                              </span>
                            </button>
                            <div className="min-w-0">
                              <span className="text-xs font-black text-slate-900 block truncate">
                                {act.title}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                  {act.startTime}
                                  {act.endTime && ` - ${act.endTime}`}
                                </span>
                                {act.notes && (
                                  <span className="text-[10px] text-slate-400 truncate">
                                    💡 {act.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleEditActivityInBuilder(act)}
                              className={`px-2 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition-colors cursor-pointer ${
                                isBeingEdited
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-slate-100 hover:bg-amber-100 text-slate-700'
                              }`}
                              title="Activiteit bewerken & icoon aanpassen"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>{isBeingEdited ? 'Bezig' : 'Bewerk'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDuplicateActivityInBuilder(act)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Activiteit dupliceren"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleMoveActivity(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                              title="Omhoog verplaatsen"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveActivity(idx, 'down')}
                              disabled={idx === builderActivities.length - 1}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                              title="Omlaag verplaatsen"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteActivityFromBuilder(act.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Verwijder activiteit"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Step 3: Activiteit Toevoegen of Bewerken Kaart */}
                <div className="p-4 rounded-2xl bg-slate-50 border-2 border-dashed border-amber-300 space-y-3">
                  {builderError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center justify-between">
                      <span>⚠️ {builderError}</span>
                      <button
                        type="button"
                        onClick={() => setBuilderError(null)}
                        className="text-rose-600 hover:text-rose-900 font-black text-sm px-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>
                        {editingActivityId
                          ? 'Geselecteerde Activiteit Aanpassen:'
                          : 'Stap 3: Nieuwe Activiteit Toevoegen aan deze Routine:'}
                      </span>
                    </span>

                    {editingActivityId && (
                      <button
                        type="button"
                        onClick={resetActivityForm}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-0.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Annuleren (Nieuw maken)</span>
                      </button>
                    )}
                  </div>

                  {/* Vrolijke Snelkeuzes voor Kinderactiviteiten */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-600 block mb-1">
                      Snel kiezen (icoon + titel):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {ACTIVITY_QUICK_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleApplyActivityPreset(preset)}
                          className={`px-2 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer shadow-2xs ${
                            actFormEmoji === preset.emoji && actFormTitle === preset.label
                              ? 'bg-amber-500 text-white border-amber-600 scale-105'
                              : 'bg-white hover:bg-amber-100/70 border-slate-200 text-slate-700'
                          }`}
                          title={`Kies ${preset.label}`}
                        >
                          <span>{preset.emoji}</span>
                          <span className="text-[11px]">{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    {/* Title */}
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        value={actFormTitle}
                        onChange={(e) => setActFormTitle(e.target.value)}
                        placeholder="Activiteit titel (bijv. Tanden poetsen, Diëtiste, School...)"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-hidden"
                      />
                    </div>

                    {/* Time */}
                    <div className="sm:col-span-3 flex items-center gap-1">
                      <input
                        type="time"
                        value={actFormStartTime}
                        onChange={(e) => setActFormStartTime(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-bold text-center"
                        title="Starttijd"
                      />
                      <span className="text-xs text-slate-400">-</span>
                      <input
                        type="time"
                        value={actFormEndTime}
                        onChange={(e) => setActFormEndTime(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-bold text-center"
                        title="Eindtijd"
                      />
                    </div>

                    {/* Icon Picker Trigger */}
                    <div className="sm:col-span-4 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.playTap();
                          setIconPickerTarget('activity');
                          setIsIconPickerOpen(true);
                        }}
                        className="flex-1 px-3 py-2 text-xs font-black bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                        title="Kies een icoon uit de iconenbibliotheek (zorg, diëtiste, sport, school...)"
                      >
                        <IconVisual emoji={actFormEmoji} imageDataUrl={actFormImageDataUrl} imageUrl={actFormImageUrl} className="text-lg inline-flex w-7 h-7 items-center justify-center" imageClassName="w-full h-full object-contain" />
                        <Palette className="w-3.5 h-3.5 text-amber-600" />
                        <span>Kies Icoon</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveActivityToBuilder}
                        className="px-4 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>{editingActivityId ? 'Opslaan' : '+ Voeg toe'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Notes & TimeOfDay */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      value={actFormNotes}
                      onChange={(e) => setActFormNotes(e.target.value)}
                      placeholder="Tip of notitie voor Jaren (optioneel, bijv. '2 minuten poetsen')"
                      className="flex-1 min-w-[200px] px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                    />

                    <select
                      value={actFormTimeOfDay}
                      onChange={(e) => setActFormTimeOfDay(e.target.value as any)}
                      className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-semibold"
                    >
                      <option value="ochtend">🌅 Ochtend</option>
                      <option value="middag">☀️ Middag</option>
                      <option value="avond">🌙 Avond</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer with Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            {modalMode === 'insert' ? (
              <>
                <div className="text-xs text-slate-600">
                  Totaal in te voegen:{' '}
                  <strong className="text-amber-900 font-black">
                    {activeActivityIds.length * targetDateList.length} activiteiten
                  </strong>{' '}
                  ({activeActivityIds.length} activiteiten over {targetDateList.length} dag(en))
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Sluiten
                  </button>
                  <button
                    type="button"
                    onClick={handleInsert}
                    disabled={activeActivityIds.length === 0}
                    className="px-6 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      ⚡ Voeg {activeActivityIds.length * targetDateList.length} Activiteiten In
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setModalMode('insert')}
                  className="text-xs font-bold text-slate-600 hover:underline cursor-pointer"
                >
                  ← Terug naar Routine Kiezen
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setModalMode('insert')}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
                  >
                    Annuleren
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveRoutineTemplate(false)}
                    className="px-4 py-2 rounded-xl text-xs font-black bg-white text-indigo-900 border-2 border-indigo-300 hover:bg-indigo-50 shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Bookmark className="w-4 h-4 text-indigo-600" />
                    <span>Opslaan in Bibliotheek</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveRoutineTemplate(true)}
                    className="px-5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Opslaan & Direct Invoegen</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Icon Picker Modal for picking icons in routine or activities */}
      <IconPickerModal
        isOpen={isIconPickerOpen}
        selectedIconId={
          quickIconEditActId
            ? builderActivities.find((a) => a.id === quickIconEditActId)?.iconId
            : iconPickerTarget === 'routine'
            ? routineFormIconId
            : actFormIconId
        }
        customIcons={customIcons}
        customCategories={customCategories}
        onSelectIcon={handleSelectIconFromPicker}
        onOpenCreateIconModal={onOpenCreateIconModal}
        onClose={() => {
          setIsIconPickerOpen(false);
          setQuickIconEditActId(null);
        }}
      />
    </>
  );
};

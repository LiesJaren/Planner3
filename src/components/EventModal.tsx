import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, FileText, Check, Sparkles } from 'lucide-react';
import { AgendaEvent, FamilyMember, TimeOfDay, ActivityIcon, IconCategoryMeta } from '../types/family';
import { ACTIVITY_ICONS, getIconById } from '../data/iconLibrary';
import { IconPickerModal } from './IconPickerModal';
import { getTodayDateStr, formatDutchFullDate, addDays, getWeekDaysList } from '../utils/dateUtils';
import { soundEffects } from '../utils/audio';
import { IconVisual } from './IconVisual';
import { MemberAvatar } from './MemberAvatar';

interface EventModalProps {
  isOpen: boolean;
  initialEvent?: AgendaEvent | null;
  defaultDate?: string;
  defaultTimeOfDay?: TimeOfDay;
  members: FamilyMember[];
  customIcons?: ActivityIcon[];
  customCategories?: IconCategoryMeta[];
  onOpenCreateIconModal?: () => void;
  onOpenCreateCategoryModal?: () => void;
  onDeleteCustomIcon?: (iconId: string) => void;
  onSave: (eventData: Omit<AgendaEvent, 'id'>, eventId?: string) => void;
  onDelete?: (eventId: string) => void;
  onClose: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  initialEvent,
  defaultDate,
  defaultTimeOfDay,
  members,
  customIcons = [],
  customCategories = [],
  onOpenCreateIconModal,
  onOpenCreateCategoryModal,
  onDeleteCustomIcon,
  onSave,
  onDelete,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('15:00');
  const [selectedIconId, setSelectedIconId] = useState('schooltas');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('middag');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isRoutine, setIsRoutine] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  useEffect(() => {
    if (initialEvent) {
      setTitle(initialEvent.title);
      setDate(initialEvent.date);
      setStartTime(initialEvent.startTime || '14:00');
      setEndTime(initialEvent.endTime || '');
      setSelectedIconId(initialEvent.iconId || 'schooltas');
      setSelectedMemberIds(initialEvent.memberIds || []);
      setTimeOfDay(initialEvent.timeOfDay || 'middag');
      setLocation(initialEvent.location || '');
      setNotes(initialEvent.notes || '');
      setIsRoutine(!!initialEvent.isRoutine);
    } else {
      const todayStr = defaultDate || getTodayDateStr();
      const initialTod = defaultTimeOfDay || 'middag';
      const initialStart =
        initialTod === 'ochtend' ? '08:30' : initialTod === 'avond' ? '18:30' : '14:00';
      const initialEnd =
        initialTod === 'ochtend' ? '09:30' : initialTod === 'avond' ? '19:30' : '15:00';
      const initialIcon =
        initialTod === 'ochtend' ? 'ontbijt' : initialTod === 'avond' ? 'avondeten' : 'schooltas';

      setTitle('');
      setDate(todayStr);
      setStartTime(initialStart);
      setEndTime(initialEnd);
      setSelectedIconId(initialIcon);
      setSelectedMemberIds(members.map((m) => m.id)); // Default to whole family
      setTimeOfDay(initialTod);
      setLocation('');
      setNotes('');
      setIsRoutine(false);
    }
  }, [initialEvent, defaultDate, defaultTimeOfDay, members, isOpen]);

  // Automatically adjust time of day when start time changes
  const handleStartTimeChange = (newTime: string) => {
    setStartTime(newTime);
    const hour = parseInt(newTime.split(':')[0], 10);
    if (!isNaN(hour)) {
      if (hour < 12) setTimeOfDay('ochtend');
      else if (hour < 17) setTimeOfDay('middag');
      else setTimeOfDay('avond');
    }
  };

  const currentIcon = getIconById(selectedIconId, customIcons);

  // Quick 1-tap presets
  const applyPreset = (preset: {
    title: string;
    iconId: string;
    timeOfDay: TimeOfDay;
    startTime: string;
    endTime: string;
  }) => {
    soundEffects.playTap();
    setTitle(preset.title);
    setSelectedIconId(preset.iconId);
    setTimeOfDay(preset.timeOfDay);
    setStartTime(preset.startTime);
    setEndTime(preset.endTime);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    soundEffects.playSuccessChime();
    onSave(
      {
        title: title.trim(),
        date,
        startTime,
        endTime: endTime || undefined,
        iconId: currentIcon.id,
        iconEmoji: currentIcon.emoji,
        iconImageDataUrl: currentIcon.imageDataUrl,
        iconLabel: currentIcon.label,
        memberIds: selectedMemberIds.length > 0 ? selectedMemberIds : members.map((m) => m.id),
        timeOfDay,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        isRoutine,
        completed: initialEvent ? initialEvent.completed : false,
      },
      initialEvent?.id
    );
    onClose();
  };

  const toggleMember = (memberId: string) => {
    soundEffects.playTap();
    if (selectedMemberIds.includes(memberId)) {
      // Don't allow empty if this is the only one, or allow it
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== memberId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, memberId]);
    }
  };

  const selectAllMembers = () => {
    soundEffects.playTap();
    if (selectedMemberIds.length === members.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(members.map((m) => m.id));
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <div
          className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-amber-300 my-8"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-amber-200 via-amber-100 to-orange-100 border-b border-amber-300 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconVisual emoji={currentIcon.emoji} imageDataUrl={currentIcon.imageDataUrl} className="text-3xl w-9 h-9 inline-flex items-center justify-center" imageClassName="w-full h-full object-contain" />
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {initialEvent ? 'Afspraak Wijzigen' : 'Nieuwe Afspraak / Activiteit'}
                </h2>
                <p className="text-xs text-slate-600">
                  Zelf invullen met vrolijke iconen en kleuren
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-slate-600 shadow-xs transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Quick 1-tap presets strip */}
            {!initialEvent && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <span className="text-[11px] font-bold text-amber-900 block mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Snelkiezer voor het gezin:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { title: 'Zwemles', iconId: 'zwemles', timeOfDay: 'middag' as const, startTime: '15:30', endTime: '16:30' },
                    { title: 'Basisschool', iconId: 'schooltas', timeOfDay: 'ochtend' as const, startTime: '08:30', endTime: '15:00' },
                    { title: 'Voetbaltraining', iconId: 'sportbal', timeOfDay: 'middag' as const, startTime: '16:00', endTime: '17:00' },
                    { title: 'Avondeten', iconId: 'maaltijd', timeOfDay: 'avond' as const, startTime: '18:00', endTime: '18:45' },
                    { title: 'Bedtijd & Boekje', iconId: 'bedje', timeOfDay: 'avond' as const, startTime: '19:30', endTime: '20:00' },
                    { title: 'Verjaardagsfeest', iconId: 'verjaardag_taart', timeOfDay: 'middag' as const, startTime: '14:00', endTime: '17:00' },
                  ].map((preset) => (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-amber-200 hover:bg-amber-100 text-slate-800 transition-colors shadow-2xs"
                    >
                      {ACTIVITY_ICONS.find((i) => i.id === preset.iconId)?.emoji} {preset.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Title & Icon selector trigger */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Wat gaan we doen? *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsIconPickerOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-amber-100/70 border-2 border-amber-300 hover:border-amber-500 hover:bg-amber-200 text-slate-800 transition-all shrink-0 font-bold text-sm"
                  title="Klik om een kindvriendelijk icoon te kiezen"
                >
                  <IconVisual emoji={currentIcon.emoji} imageDataUrl={currentIcon.imageDataUrl} className="text-2xl inline-flex w-8 h-8 items-center justify-center" imageClassName="w-full h-full object-contain" />
                  <span className="text-xs text-amber-900 underline hidden sm:inline">Kies icoon</span>
                </button>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Bijv. Zwemles, School, Voetbal, Pannenkoeken eten..."
                  className="flex-1 px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-amber-400 focus:outline-hidden text-sm text-slate-800 font-medium"
                />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-1 flex-wrap">
                <span>Gekozen:</span>
                <strong className="text-slate-800">{currentIcon.label}</strong>
                <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px]">
                  {currentIcon.categoryLabel}
                </span>
                {currentIcon.tags && currentIcon.tags.length > 0 && (
                  <span className="text-slate-400 text-[10px]">
                    (#{currentIcon.tags.join(', #')})
                  </span>
                )}
              </div>
            </div>

            {/* Who is involved? (Family members selector) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Voor wie is deze afspraak?
                </label>
                <button
                  type="button"
                  onClick={selectAllMembers}
                  className="text-xs text-amber-700 hover:text-amber-800 font-semibold"
                >
                  {selectedMemberIds.length === members.length ? 'Niemand' : 'Iedereen'}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {members.map((member) => {
                  const isSelected = selectedMemberIds.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleMember(member.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-2xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/80 shadow-xs'
                          : 'border-slate-100 bg-slate-50 opacity-60 hover:opacity-100 hover:bg-white'
                      }`}
                    >
                      <span className="text-xl"><MemberAvatar avatar={member.avatar} name={member.name} /></span>
                      <div className="overflow-hidden">
                        <span className="text-xs font-bold text-slate-800 block truncate">
                          {member.name}
                        </span>
                        <span className="text-[10px] text-slate-600 block">
                          {member.age ? `${member.age} jr` : member.role}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-amber-600 ml-auto shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Datum *
                  </span>
                  <span className="text-amber-800 font-bold capitalize text-[11px]">
                    {formatDutchFullDate(date)}
                  </span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-amber-400"
                />
                {/* 1-tap quick day jump pills */}
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  {[
                    { label: 'Vandaag', offset: 0 },
                    { label: 'Morgen', offset: 1 },
                    { label: '+2 dagen', offset: 2 },
                  ].map((btn) => {
                    const btnDate = addDays(getTodayDateStr(), btn.offset);
                    const isSelected = date === btnDate;
                    return (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => {
                          soundEffects.playTap();
                          setDate(btnDate);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-lg font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                            : 'bg-white hover:bg-amber-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {btn.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Starttijd
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Eindtijd
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-amber-400"
                />
              </div>
            </div>

            {/* Time of Day Segmented Control (Helps 6 year old identify Morning, Afternoon, Evening) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Dagdeel (duidelijk voor kinderen)
              </label>
              <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-2xl">
                {[
                  { id: 'ochtend' as const, label: 'Ochtend', emoji: '🌅' },
                  { id: 'middag' as const, label: 'Middag', emoji: '☀️' },
                  { id: 'avond' as const, label: 'Avond', emoji: '🌙' },
                ].map((part) => (
                  <button
                    key={part.id}
                    type="button"
                    onClick={() => {
                      soundEffects.playTap();
                      setTimeOfDay(part.id);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      timeOfDay === part.id
                        ? 'bg-white text-slate-900 shadow-sm border border-amber-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{part.emoji}</span>
                    <span>{part.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Location & Notes */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Waar? (Locatie)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Bijv. Zwembad De Spetter, Thuis, Park..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" /> Notitie / Herinnering
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Bijv. Handdoek meenemen, Papa rijdt..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-amber-400"
                />
              </div>
            </div>

            {/* Daily Routine / Task checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="is-routine-cb"
                type="checkbox"
                checked={isRoutine}
                onChange={(e) => setIsRoutine(e.target.checked)}
                className="w-4 h-4 rounded-md text-amber-600 focus:ring-amber-500 border-slate-300"
              />
              <label htmlFor="is-routine-cb" className="text-xs text-slate-700 cursor-pointer">
                Herhaalbare dagtaak / routine (zoals tanden poetsen of kamer opruimen)
              </label>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
              {initialEvent && onDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Weet je zeker dat je deze afspraak wilt verwijderen?')) {
                      onDelete(initialEvent.id);
                      onClose();
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                >
                  Verwijderen
                </button>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md hover:shadow-lg transition-all"
                >
                  {initialEvent ? 'Opslaan' : 'Toevoegen aan Agenda'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Sub-modal icon picker */}
      <IconPickerModal
        isOpen={isIconPickerOpen}
        selectedIconId={selectedIconId}
        customIcons={customIcons}
        customCategories={customCategories}
        onSelectIcon={(icon) => setSelectedIconId(icon.id)}
        onOpenCreateIconModal={onOpenCreateIconModal}
        onOpenCreateCategoryModal={onOpenCreateCategoryModal}
        onDeleteCustomIcon={onDeleteCustomIcon}
        onClose={() => setIsIconPickerOpen(false)}
      />
    </>
  );
};

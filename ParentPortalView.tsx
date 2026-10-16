import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Star,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  Printer,
  Wand2,
  Gift,
  CheckCircle2,
  UserCheck,
  Search,
  Filter,
  Trophy,
  Award,
  ArrowRight,
  Clock,
  MapPin,
  Check,
  RotateCcw,
  Users,
  Smile,
  Tag,
  Palette,
  Loader2,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  FamilyMember,
  AgendaEvent,
  Reward,
  GroceryItem,
  ActivityIcon,
  IconCategoryMeta,
  TimeOfDay,
} from '../types/family';
import { soundEffects, spreekBericht } from '../utils/audio';
import { IconVisual } from './IconVisual';
import { ACTIVITY_ICONS, getAllCategories } from '../data/iconLibrary';
import { generateIconWithAI } from '../utils/aiIconGenerator';
import { getTodayDateStr } from '../utils/dateUtils';

interface ParentPortalViewProps {
  members: FamilyMember[];
  events: AgendaEvent[];
  rewards: Reward[];
  groceries: GroceryItem[];
  customIcons: ActivityIcon[];
  customCategories: IconCategoryMeta[];
  onAddEvent: (date?: string) => void;
  onEditEvent: (event: AgendaEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onToggleCompleteEvent: (eventId: string) => void;
  onAddReward: () => void;
  onEditReward: (reward: Reward) => void;
  onDeleteReward: (rewardId: string) => void;
  onRedeemReward: (rewardId: string, memberId: string, deductStars: boolean, approvedBy: string) => void;
  onClaimReward: (rewardId: string, memberId: string) => void;
  onResetRewardStatus?: (rewardId: string) => void;
  onUpdateMemberStars: (memberId: string, newStars: number) => void;
  onSaveCustomIcon: (newIcon: ActivityIcon) => void;
  onDeleteCustomIcon: (iconId: string) => void;
  onOpenPrintModal: (dateStr?: string) => void;
  onOpenInsertRoutineModal?: (dateStr?: string) => void;
  onOpenCopyModal?: (sourceDateStr?: string, eventId?: string) => void;
  onOpenFamilySettings: () => void;
  onOpenCreateIconModal: () => void;
  onEditMember: (member: FamilyMember) => void;
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({
  members,
  events,
  rewards,
  groceries,
  customIcons,
  customCategories,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  onToggleCompleteEvent,
  onAddReward,
  onEditReward,
  onDeleteReward,
  onRedeemReward,
  onClaimReward,
  onResetRewardStatus,
  onUpdateMemberStars,
  onSaveCustomIcon,
  onDeleteCustomIcon,
  onOpenPrintModal,
  onOpenInsertRoutineModal,
  onOpenCopyModal,
  onOpenFamilySettings,
  onOpenCreateIconModal,
  onEditMember,
}) => {
  // Navigation within the parent portal
  const [activeTab, setActiveTab] = useState<'beloningen' | 'activiteiten' | 'iconen' | 'afdrukken' | 'gezin'>('beloningen');

  // Active parent acting in the portal: default to Birger or Lieselot
  const parents = useMemo(() => members.filter((m) => m.role === 'ouder'), [members]);
  const defaultParentName = parents.find((p) => p.name.toLowerCase().includes('birger'))?.name || parents[0]?.name || 'Papa Birger';
  const [activeParent, setActiveParent] = useState<string>(defaultParentName);

  // Identify Jaren (child)
  const childMember = useMemo(() => {
    return (
      members.find((m) => m.name.toLowerCase().includes('jaren')) ||
      members.find((m) => m.role === 'kind') ||
      members[0]
    );
  }, [members]);

  const jarenStars = childMember?.stars ?? 0;
  const jarenFirstName = childMember ? childMember.name.split(' ')[0] : 'Jaren';

  // 5-Star Milestone Check
  const hasReached5Stars = jarenStars >= 5;

  // Selected reward for 5-star milestone redemption
  const fiveStarRewards = useMemo(() => {
    return rewards.filter((r) => r.starCost <= 5 && r.status !== 'redeemed');
  }, [rewards]);

  const [selectedRewardToGrant, setSelectedRewardToGrant] = useState<string>(
    fiveStarRewards[0]?.id || ''
  );
  const [customGrantNote, setCustomGrantNote] = useState('');
  const [customRewardTitle, setCustomRewardTitle] = useState('');
  const [isCustomRewardOpen, setIsCustomRewardOpen] = useState(false);

  // Quick reasons for awarding stars
  const QUICK_STAR_REASONS = [
    { label: 'Tanden gepoetst 🪥', stars: 1 },
    { label: 'Kamer opgeruimd 🧹', stars: 1 },
    { label: 'Zelf schoenen & jas aan 👟', stars: 1 },
    { label: 'Bord leeggegeten 🥦', stars: 1 },
    { label: 'Super geholpen 💛', stars: 1 },
    { label: 'Zwemles geoefend 🏊', stars: 2 },
    { label: 'Heel lief gespeeld 🧸', stars: 1 },
  ];

  // Activities tab state
  const [eventSearch, setEventSearch] = useState('');
  const [eventMemberFilter, setEventMemberFilter] = useState<string>('all');
  const [eventTimeFilter, setEventTimeFilter] = useState<'all' | 'vandaag' | 'dezeweek'>('all');

  // AI Icon Generator state inside portal
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingIcon, setIsGeneratingIcon] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{
    label: string;
    emoji: string;
    category: string;
    suggestedColor: string;
    tags: string[];
    reasoning: string;
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Icon catalog search in portal
  const [iconCatalogSearch, setIconCatalogSearch] = useState('');
  const [selectedIconCat, setSelectedIconCat] = useState<string>('all');

  const allCategories = useMemo(() => getAllCategories(customCategories), [customCategories]);
  const allIcons = useMemo(() => [...customIcons, ...ACTIVITY_ICONS], [customIcons]);

  const filteredIcons = useMemo(() => {
    return allIcons.filter((ic) => {
      const matchCat = selectedIconCat === 'all' || ic.category === selectedIconCat;
      const q = iconCatalogSearch.toLowerCase().trim();
      const matchQuery =
        !q ||
        ic.label.toLowerCase().includes(q) ||
        ic.categoryLabel.toLowerCase().includes(q) ||
        (ic.tags && ic.tags.some((t) => t.toLowerCase().includes(q)));
      return matchCat && matchQuery;
    });
  }, [allIcons, selectedIconCat, iconCatalogSearch]);

  // Filter events for the activities tab
  const todayStr = useMemo(() => getTodayDateStr(), []);
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Member filter
      if (eventMemberFilter !== 'all') {
        if (!ev.memberIds.includes(eventMemberFilter) && ev.memberIds.length > 0) return false;
      }

      // Time filter
      if (eventTimeFilter === 'vandaag' && ev.date !== todayStr) return false;
      if (eventTimeFilter === 'dezeweek') {
        const today = new Date();
        const evDate = new Date(ev.date);
        const diffDays = (evDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
        if (diffDays < -1 || diffDays > 7) return false;
      }

      // Search query
      if (eventSearch.trim()) {
        const q = eventSearch.toLowerCase().trim();
        const matchesTitle = ev.title.toLowerCase().includes(q);
        const matchesLocation = ev.location?.toLowerCase().includes(q);
        const matchesIcon = ev.iconLabel.toLowerCase().includes(q);
        if (!matchesTitle && !matchesLocation && !matchesIcon) return false;
      }

      return true;
    }).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }, [events, eventMemberFilter, eventTimeFilter, eventSearch, todayStr]);

  // Handlers for Stars
  const handleAwardStars = (count: number, reason?: string) => {
    if (!childMember) return;
    const newCount = Math.max(0, jarenStars + count);
    onUpdateMemberStars(childMember.id, newCount);

    if (count > 0) {
      soundEffects.playSuccessChime();
      confetti({
        particleCount: count >= 2 ? 80 : 40,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#ec4899', '#3b82f6', '#10b981'],
      });
      const reasonMsg = reason ? ` voor ${reason}` : '';
      spreekBericht(`Goed gedaan ${jarenFirstName}! ${count === 1 ? '1 ster' : count + ' sterren'} erbij${reasonMsg}!`);
    } else {
      soundEffects.playTap();
    }
  };

  // Grant 5-Star Reward Decision by Birger or Lieselot
  const handleGrant5StarReward = () => {
    if (!childMember) return;

    let targetReward: Reward | undefined;

    if (isCustomRewardOpen && customRewardTitle.trim()) {
      // Create and grant new custom reward
      const newReward: Reward = {
        id: `rw_${Date.now()}`,
        title: customRewardTitle.trim(),
        emoji: '🎁',
        starCost: 5,
        targetMemberId: childMember.id,
        description: customGrantNote.trim() || `Bijzondere beloning goedgekeurd door ${activeParent}`,
        status: 'redeemed',
        claimedAt: Date.now(),
        redeemedAt: Date.now(),
        redeemedBy: activeParent,
        createdAt: Date.now(),
      };
      onEditReward(newReward); // Add to rewards
      targetReward = newReward;
    } else {
      targetReward = rewards.find((r) => r.id === selectedRewardToGrant);
    }

    if (!targetReward) {
      alert('Kies eerst een beloning om toe te kennen aan Jaren.');
      return;
    }

    soundEffects.playVictoryFanfare();
    confetti({
      particleCount: 150,
      spread: 120,
      origin: { y: 0.5 },
      colors: ['#f59e0b', '#e11d48', '#8b5cf6', '#10b981'],
    });

    // Deduct 5 stars and set reward as redeemed by Birger/Lieselot
    onRedeemReward(targetReward.id, childMember.id, true, activeParent);

    spreekBericht(
      `Hoera ${jarenFirstName}! ${activeParent} heeft jouw 5-sterren beloning goedgekeurd: "${targetReward.title}"! Wat heb je hard gewerkt!`
    );

    // Reset local inputs
    setCustomRewardTitle('');
    setCustomGrantNote('');
    setIsCustomRewardOpen(false);
  };

  // AI Icon Generation Handler
  const handleGenerateAiIcon = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingIcon(true);
    setAiError(null);
    try {
      soundEffects.playTap();
      const result = await generateIconWithAI(aiPrompt.trim());
      setGeneratedResult(result);
      soundEffects.playSuccessChime();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Kon icoon niet genereren';
      setAiError(message);
    } finally {
      setIsGeneratingIcon(false);
    }
  };

  const handleSaveGeneratedIcon = () => {
    if (!generatedResult) return;
    const cat = allCategories.find((c) => c.id === generatedResult.category);
    const newIcon: ActivityIcon = {
      id: `ai_${Date.now()}`,
      label: generatedResult.label,
      emoji: generatedResult.emoji,
      category: generatedResult.category,
      categoryLabel: cat?.name || 'Vrije tijd',
      suggestedColor: generatedResult.suggestedColor,
      tags: generatedResult.tags,
      reasoning: generatedResult.reasoning,
      isCustom: true,
    };
    onSaveCustomIcon(newIcon);
    soundEffects.playSuccessChime();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#8b5cf6', '#3b82f6', '#f59e0b'],
    });
    setGeneratedResult(null);
    setAiPrompt('');
  };

  // Quick add routine activities
  const handleQuickAddRoutine = (title: string, emoji: string, time: string, timeOfDay: TimeOfDay) => {
    const newEvent: AgendaEvent = {
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      date: todayStr,
      startTime: time,
      iconId: `ic_${Date.now()}`,
      iconEmoji: emoji,
      iconImageDataUrl: undefined,
      iconLabel: title,
      memberIds: [childMember?.id || 'm3'],
      timeOfDay,
      isRoutine: true,
      completed: false,
    };
    onEditEvent(newEvent);
    soundEffects.playSuccessChime();
  };

  return (
    <div className="space-y-6">
      {/* Top Parent Portal Banner with Identity Selector */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border-3 border-amber-400/80">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black tracking-wide shadow-sm">
              <ShieldCheck className="w-4 h-4 text-slate-950" /> Ouderportaal • Volledig Gezinsbeheer
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Beheer door Birger & Lieselot
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Beheer hier alle activiteiten, genereer AI-iconen, houd de 5-sterren doelen van Jaren bij en druk de weekplanning af op 1 A4 blad.
            </p>
          </div>

          {/* Active Parent Selector */}
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 flex flex-col gap-1 shrink-0">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" /> Ingelogde Ouder:
            </span>
            <div className="flex items-center gap-1.5">
              {parents.map((p) => {
                const isActive = activeParent.toLowerCase().includes(p.name.toLowerCase());
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      soundEffects.playTap();
                      setActiveParent(p.name);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 shadow-md scale-102'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <span>{p.avatar}</span>
                    <span>{p.name.split(' ')[0]}</span>
                    {isActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Tabs within Parent Portal */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-5 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => {
              soundEffects.playTap();
              setActiveTab('beloningen');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'beloningen'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'bg-white/5 text-slate-200 hover:bg-white/15'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>⭐ Sterren & Beloningen</span>
            {hasReached5Stars && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full animate-bounce">
                5★!
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playTap();
              setActiveTab('activiteiten');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'activiteiten'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'bg-white/5 text-slate-200 hover:bg-white/15'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>🗓️ Afspraken ({events.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playTap();
              setActiveTab('iconen');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'iconen'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'bg-white/5 text-slate-200 hover:bg-white/15'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span>🎨 AI Iconen ({allIcons.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playTap();
              setActiveTab('afdrukken');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'afdrukken'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'bg-white/5 text-slate-200 hover:bg-white/15'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>🖨️ Afdrukken 1 A4</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playTap();
              setActiveTab('gezin');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'gezin'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'bg-white/5 text-slate-200 hover:bg-white/15'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>👨‍👩‍👦 Gezinsleden ({members.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STERREN & 5-STERREN BELONINGSBESLUIT VOOR JAREN                     */}
      {/* ========================================================================= */}
      {activeTab === 'beloningen' && (
        <div className="space-y-6">
          {/* Main 5-Stars Status Meter for Jaren */}
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-lg border-3 border-amber-300">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-white text-slate-900 border-3 border-amber-200 shadow-md flex items-center justify-center text-5xl">
                  {childMember?.avatar || '👦'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black bg-amber-900/60 px-3 py-1 rounded-full text-amber-200 uppercase tracking-wider">
                      Gamification & Beloningen
                    </span>
                    <span className="text-xs font-bold bg-white/20 px-2.5 py-0.5 rounded-full">
                      Doel: 5 Sterren
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black mt-1">
                    Sterrenstand van {childMember?.name || 'Jaren'}:{' '}
                    <span className="text-yellow-200">{jarenStars} ⭐</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-amber-100">
                    Bij 5 verdiende sterren beslissen Birger en Lieselot welke extra beloning Jaren krijgt!
                  </p>
                </div>
              </div>

              {/* 5-Star Milestone Meter Visual */}
              <div className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/30 text-center w-full md:w-auto shrink-0">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-100 mb-2">
                  5-Sterren Meter
                </div>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((starNum) => {
                    const isFilled = jarenStars >= starNum;
                    return (
                      <div
                        key={starNum}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                          isFilled
                            ? 'bg-amber-300 text-amber-950 shadow-md scale-110 font-black'
                            : 'bg-black/20 text-white/40 border border-white/20'
                        }`}
                      >
                        {isFilled ? '⭐' : '☆'}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 text-xs font-bold text-amber-100">
                  {jarenStars >= 5 ? (
                    <span className="text-yellow-300 font-black animate-pulse">
                      🎉 5-Sterren Doel Behaald!
                    </span>
                  ) : (
                    <span>Nog {5 - jarenStars} sterren tot beloning</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Star Award Buttons */}
            <div className="mt-5 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-amber-100">Sterren aanpassen:</span>
                <button
                  type="button"
                  onClick={() => handleAwardStars(1)}
                  className="bg-white hover:bg-amber-100 text-amber-900 font-black px-3.5 py-1.5 rounded-xl text-xs shadow-sm transition-all flex items-center gap-1 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" /> 1 Ster Toekennen
                </button>
                <button
                  type="button"
                  onClick={() => handleAwardStars(2, 'extra knappe prestatie')}
                  className="bg-amber-300 hover:bg-amber-200 text-slate-950 font-black px-3.5 py-1.5 rounded-xl text-xs shadow-sm transition-all flex items-center gap-1 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" /> +2 Sterren (Extra Knap!)
                </button>
                <button
                  type="button"
                  onClick={() => handleAwardStars(-1)}
                  disabled={jarenStars <= 0}
                  className="bg-black/20 hover:bg-black/30 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all disabled:opacity-40"
                >
                  -1 Ster
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Wil je de sterren van ${jarenFirstName} resetten naar 0?`)) {
                      onUpdateMemberStars(childMember.id, 0);
                    }
                  }}
                  className="text-white/70 hover:text-white text-xs underline font-semibold ml-2"
                >
                  Reset naar 0
                </button>
              </div>

              {/* Speech readout button */}
              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  spreekBericht(
                    `Hoi ${jarenFirstName}! Je hebt nu ${jarenStars} sterren verdiend! ${
                      jarenStars >= 5
                        ? 'Gefeliciteerd, dat zijn er minstens 5! Vraag papa Birger of mama Lieselot naar je beloning!'
                        : `Nog ${5 - jarenStars} sterren en dan mag je een superleuke beloning kiezen!`
                    }`
                  );
                }}
                className="bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center gap-1.5"
              >
                <span>🔊</span> Spreek stand uit voor Jaren
              </button>
            </div>
          </div>

          {/* Snelknoppen voor typische complimenten / routines */}
          <div className="bg-white rounded-3xl p-5 border-2 border-amber-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Snel een compliment en ster geven:
            </h3>
            <div className="flex flex-wrap gap-2">
              {QUICK_STAR_REASONS.map((reason, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAwardStars(reason.stars, reason.label)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 transition-all flex items-center gap-1.5 shadow-2xs hover:scale-102 active:scale-98"
                >
                  <span>{reason.label}</span>
                  <span className="bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-md font-black text-[10px]">
                    +{reason.stars}★
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* DE BESLISSING VAN BIRGER / LIESELOT: 5-STERREN BELONING TOEKENNEN         */}
          {/* ========================================================================= */}
          <div
            className={`rounded-3xl p-6 border-3 transition-all ${
              hasReached5Stars
                ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 border-emerald-400 shadow-lg'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black mb-2 bg-emerald-600 text-white">
                  <Award className="w-4 h-4" /> Ouderbesluit: Beloning Toekennen
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  {hasReached5Stars
                    ? `🎉 ${jarenFirstName} heeft 5 sterren behaald! Welke beloning kiezen ${activeParent} & partner?`
                    : `Beloningsbesluit voorbereiden (huidige stand: ${jarenStars} / 5 sterren)`}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1">
                  Hier bepalen <strong>Birger</strong> en <strong>Lieselot</strong> welke beloning Jaren ontvangt zodra de mijlpaal bereikt is. Na toekenning worden 5 sterren verrekend en wordt de beloning in de historie geregistreerd.
                </p>
              </div>

              {hasReached5Stars && (
                <div className="hidden sm:flex flex-col items-center bg-emerald-500 text-white px-4 py-2 rounded-2xl shadow-sm text-center">
                  <span className="text-2xl font-black">5★</span>
                  <span className="text-[10px] font-bold uppercase">Mijlpaal!</span>
                </div>
              )}
            </div>

            {/* Selection form */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  1. Kies een beloning uit de lijst (standaard 5 sterren):
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {rewards.map((rw) => {
                    const isSelected = selectedRewardToGrant === rw.id && !isCustomRewardOpen;
                    const isRedeemed = rw.status === 'redeemed';
                    return (
                      <div
                        key={rw.id}
                        onClick={() => {
                          setIsCustomRewardOpen(false);
                          setSelectedRewardToGrant(rw.id);
                        }}
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-100/80 border-emerald-500 shadow-sm'
                            : isRedeemed
                            ? 'bg-slate-50 border-slate-200 opacity-60'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{rw.emoji}</span>
                          <div>
                            <div className="text-xs font-black text-slate-900">
                              {rw.title}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {rw.description || 'Vrolijke beloning'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg">
                            {rw.starCost}★
                          </span>
                          {isRedeemed && (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded-md">
                              Reeds gehad
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Option to create a spontaneous reward */}
                <button
                  type="button"
                  onClick={() => setIsCustomRewardOpen(!isCustomRewardOpen)}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isCustomRewardOpen ? 'Annuleer eigen beloning' : 'Of verzin een spontane nieuwe beloning'}</span>
                </button>

                {isCustomRewardOpen && (
                  <div className="p-3 bg-white rounded-2xl border-2 border-emerald-300 space-y-2">
                    <input
                      type="text"
                      value={customRewardTitle}
                      onChange={(e) => setCustomRewardTitle(e.target.value)}
                      placeholder="Bijv. Samen bowlen of Lego uitkiezen..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-500 font-bold"
                    />
                    <input
                      type="text"
                      value={customGrantNote}
                      onChange={(e) => setCustomGrantNote(e.target.value)}
                      placeholder="Notitie (bijv. goedgekeurd door Birger)"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 text-slate-600"
                    />
                  </div>
                )}
              </div>

              {/* Action Box */}
              <div className="bg-white/80 backdrop-blur-xs p-5 rounded-2xl border-2 border-emerald-200 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-700">
                    2. Goedkeurende ouder:
                  </div>
                  <div className="flex items-center gap-2">
                    {parents.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setActiveParent(p.name)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                          activeParent.toLowerCase().includes(p.name.toLowerCase())
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span>{p.avatar}</span>
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
                    <strong>Wat gebeurt er?</strong>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-amber-900">
                      <li>Er worden 5 sterren afgetrokken van Jaren&apos;s saldo.</li>
                      <li>De beloning wordt feestelijk uitgereikt met fanfare en confetti.</li>
                      <li>Geregistreerd als: &quot;Goedgekeurd door {activeParent}&quot;.</li>
                    </ul>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGrant5StarReward}
                  disabled={!hasReached5Stars && !confirm}
                  className={`w-full py-3.5 px-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${
                    hasReached5Stars
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white cursor-pointer shadow-emerald-200'
                      : 'bg-emerald-600/80 hover:bg-emerald-600 text-white cursor-pointer'
                  }`}
                >
                  <Gift className="w-5 h-5" />
                  <span>
                    🎁 Beloning Toekennen aan {jarenFirstName} ({activeParent})
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Beloningen Catalogus Beheer */}
          <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Beloningen Catalogus Beheer
                </h3>
                <p className="text-xs text-slate-500">
                  Voeg nieuwe beloningen toe, wijzig het aantal vereiste sterren of pas omschrijvingen aan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  onAddReward();
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Nieuwe Beloning Toevoegen</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {rewards.map((rw) => (
                <div
                  key={rw.id}
                  className="p-4 rounded-2xl border-2 border-slate-200 hover:border-amber-300 bg-white transition-all flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{rw.emoji}</span>
                      <span className="text-xs font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-lg">
                        {rw.starCost} Sterren
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900">{rw.title}</h4>
                    {rw.description && (
                      <p className="text-xs text-slate-500">{rw.description}</p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        rw.status === 'redeemed'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {rw.status === 'redeemed' ? 'Reeds uitgereikt' : 'Beschikbaar'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditReward(rw)}
                        className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-amber-50"
                        title="Bewerken"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Weet je zeker dat je "${rw.title}" wilt verwijderen?`)) {
                            onDeleteReward(rw.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Verwijderen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ACTIVITEITEN & AFSPRAKEN BEHEER (TOEVOEGEN / VERWIJDEREN)          */}
      {/* ========================================================================= */}
      {activeTab === 'activiteiten' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="bg-white rounded-3xl p-5 border-2 border-amber-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Activiteiten & Afspraken Beheer
              </h2>
              <p className="text-xs text-slate-500">
                Voeg afspraken toe voor Birger, Lieselot of Jaren, of verwijder voltooide items.
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  onAddEvent();
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white font-black px-4 py-2.5 rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Nieuwe Afspraak</span>
              </button>

              {onOpenInsertRoutineModal && (
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playTap();
                    onOpenInsertRoutineModal(todayStr);
                  }}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-950 font-black px-3.5 py-2.5 rounded-xl text-xs border border-amber-300 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  title="Voeg een vaste routine in (meerdere activiteiten in 1 keer)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-400" />
                  <span>⚡ Routine Invoegen</span>
                </button>
              )}

              {onOpenCopyModal && (
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playTap();
                    onOpenCopyModal(todayStr);
                  }}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-900 font-black px-3.5 py-2.5 rounded-xl text-xs border border-blue-200 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  title="Kopieer dezelfde activiteiten of dagen in 1 keer"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                  <span>📋 Kopiëren (1x)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onOpenPrintModal()}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-1"
                title="Printen naar PDF op 1 pagina A4 formaat liggend"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden md:inline">Print 1 A4</span>
              </button>
            </div>
          </div>

          {/* Quick Routines Add strip with multi-activity packages */}
          <div className="bg-amber-50/70 rounded-3xl p-4 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Vaste Routinepakketten (meerdere activiteiten in 1 keer invoegen):</span>
              </span>

              {onOpenInsertRoutineModal && (
                <button
                  type="button"
                  onClick={() => onOpenInsertRoutineModal(todayStr)}
                  className="text-xs font-black text-amber-800 hover:underline flex items-center gap-1"
                >
                  <span>⚡ Alle Routines & Multi-dagen...</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {onOpenInsertRoutineModal ? (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenInsertRoutineModal(todayStr)}
                    className="px-3.5 py-2 rounded-xl text-xs font-black bg-white hover:bg-amber-100 text-slate-900 border border-amber-300 shadow-2xs flex items-center gap-1.5 hover:scale-101 active:scale-98 transition-all"
                  >
                    <span>🌅 Ochtend Schooldag (5 taken in 1x)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenInsertRoutineModal(todayStr)}
                    className="px-3.5 py-2 rounded-xl text-xs font-black bg-white hover:bg-amber-100 text-slate-900 border border-amber-300 shadow-2xs flex items-center gap-1.5 hover:scale-101 active:scale-98 transition-all"
                  >
                    <span>🌙 Avond & Bedtijd (5 taken in 1x)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenInsertRoutineModal(todayStr)}
                    className="px-3.5 py-2 rounded-xl text-xs font-black bg-white hover:bg-amber-100 text-slate-900 border border-amber-300 shadow-2xs flex items-center gap-1.5 hover:scale-101 active:scale-98 transition-all"
                  >
                    <span>🏊 Woensdag Zwemles (4 taken in 1x)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenInsertRoutineModal(todayStr)}
                    className="px-3.5 py-2 rounded-xl text-xs font-black bg-white hover:bg-amber-100 text-slate-900 border border-amber-300 shadow-2xs flex items-center gap-1.5 hover:scale-101 active:scale-98 transition-all"
                  >
                    <span>⚽ Zaterdag Sport & Weekend (4 taken in 1x)</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleQuickAddRoutine('Basisschool', '🎒', '08:30', 'ochtend')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-800 border border-amber-200"
                >
                  🎒 Basisschool
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
              <input
                type="text"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                placeholder="Zoek activiteit, locatie of icoon..."
                className="w-full text-xs font-medium focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={eventMemberFilter}
                onChange={(e) => setEventMemberFilter(e.target.value)}
                className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden"
              >
                <option value="all">Iedereen in gezin</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.avatar} {m.name}
                  </option>
                ))}
              </select>

              <select
                value={eventTimeFilter}
                onChange={(e) => setEventTimeFilter(e.target.value as any)}
                className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden"
              >
                <option value="all">Alle datums</option>
                <option value="vandaag">Vandaag</option>
                <option value="dezeweek">Deze week</option>
              </select>
            </div>
          </div>

          {/* Events List with Direct Edit & Delete */}
          <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 pb-2 border-b border-slate-100">
              <span>{filteredEvents.length} activiteiten gevonden</span>
              <span>Acties: bewerken of verwijderen</span>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <span className="text-4xl">🗓️</span>
                <p className="text-sm font-bold text-slate-700">Geen activiteiten gevonden</p>
                <button
                  type="button"
                  onClick={() => onAddEvent()}
                  className="text-xs font-black text-amber-600 hover:underline"
                >
                  Voeg een nieuwe activiteit toe
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredEvents.map((ev) => {
                  const evMembers = members.filter((m) => ev.memberIds.includes(m.id));
                  return (
                    <div
                      key={ev.id}
                      className="p-3.5 rounded-2xl border border-slate-200 hover:border-amber-300 bg-white hover:bg-amber-50/20 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <IconVisual emoji={ev.iconEmoji} imageDataUrl={ev.iconImageDataUrl} className="text-3xl shrink-0" imageClassName="w-10 h-10 object-contain" />
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-slate-900 truncate">
                              {ev.title}
                            </span>
                            {ev.isRoutine && (
                              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.2 rounded-full">
                                Routine
                              </span>
                            )}
                            {ev.completed && (
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full flex items-center gap-0.5">
                                <Check className="w-3 h-3 stroke-[3]" /> Klaar
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                            <span className="font-bold text-amber-900">
                              📅 {ev.date} om {ev.startTime}
                            </span>
                            {ev.location && (
                              <span className="flex items-center gap-0.5">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {ev.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Members involved + Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center -space-x-1.5">
                          {evMembers.map((m) => (
                            <span
                              key={m.id}
                              className="w-6 h-6 rounded-full border border-white flex items-center justify-center text-xs shadow-2xs"
                              style={{ backgroundColor: m.color }}
                              title={m.name}
                            >
                              {m.avatar}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                          {onOpenCopyModal && (
                            <button
                              type="button"
                              onClick={() => {
                                soundEffects.playTap();
                                onOpenCopyModal(ev.date, ev.id);
                              }}
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                              title="Kopieer deze activiteit naar een andere dag"
                            >
                              <ArrowRight className="w-4 h-4 text-blue-600" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onEditEvent(ev)}
                            className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                            title="Bewerken"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Weet je zeker dat je "${ev.title}" wilt verwijderen?`)) {
                                soundEffects.playTap();
                                onDeleteEvent(ev.id);
                              }
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Verwijderen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ICONEN BEHEER & AI ICON GENERATOR                                  */}
      {/* ========================================================================= */}
      {activeTab === 'iconen' && (
        <div className="space-y-6">
          {/* AI Generator Card */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white rounded-3xl p-6 shadow-lg border-3 border-purple-400/60">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-400 text-purple-950 text-xs font-black">
                <Wand2 className="w-3.5 h-3.5" /> AI Icoon Generator
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white">
                Bedenk een activiteit, AI genereert het perfecte icoon!
              </h2>
              <p className="text-xs sm:text-sm text-purple-200">
                Typ een afspraak zoals &quot;Paardrijden manege&quot;, &quot;Gitaarles&quot;, &quot;Zwemdiploma halen&quot; of &quot;Pizza bakken&quot;. AI kiest automatisch het meest herkenbare pictogram voor jonge kinderen.
              </p>
            </div>

            {/* Input prompt */}
            <div className="mt-5 flex flex-col sm:flex-row gap-2 max-w-2xl">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateAiIcon()}
                placeholder="Bijv. Judoles in de dojo, trompet spelen, kinderboerderij..."
                className="flex-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-purple-300 text-xs sm:text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-400"
              />
              <button
                type="button"
                onClick={handleGenerateAiIcon}
                disabled={isGeneratingIcon || !aiPrompt.trim()}
                className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGeneratingIcon ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Bezig met bedenken...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Genereer Icoon ✨</span>
                  </>
                )}
              </button>
            </div>

            {aiError && (
              <div className="mt-3 text-xs text-rose-300 flex items-center gap-1 font-semibold">
                <AlertCircle className="w-4 h-4" /> {aiError}
              </div>
            )}

            {/* Live generated preview */}
            {generatedResult && (
              <div className="mt-5 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/30 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-2xl animate-fade-in">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <span
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-md border-2 border-white"
                    style={{ backgroundColor: generatedResult.suggestedColor }}
                  >
                    {generatedResult.emoji}
                  </span>
                  <div>
                    <h3 className="text-base font-black text-white">
                      {generatedResult.label}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-md text-purple-200">
                        {generatedResult.category}
                      </span>
                      {generatedResult.tags.map((tg, i) => (
                        <span key={i} className="text-[10px] font-semibold text-purple-300">
                          #{tg}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-purple-200 mt-1 italic">
                      &quot;{generatedResult.reasoning}&quot;
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveGeneratedIcon}
                  className="px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Opslaan in Bibliotheek</span>
                </button>
              </div>
            )}
          </div>

          {/* Icon Library Explorer */}
          <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Iconen Bibliotheek ({allIcons.length} Pictogrammen)
                </h3>
                <p className="text-xs text-slate-500">
                  Herkenbare categorieën speciaal voor kinderen en gezinsafspraken.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenCreateIconModal()}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-black text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Zelf Icoon Ontwerpen</span>
                </button>
              </div>
            </div>

            {/* Filter & Search */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex-1">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={iconCatalogSearch}
                  onChange={(e) => setIconCatalogSearch(e.target.value)}
                  placeholder="Zoek icoon (bijv. voetbal, zwemmen, gitaar, school)..."
                  className="w-full text-xs font-semibold focus:outline-hidden"
                />
              </div>

              <select
                value={selectedIconCat}
                onChange={(e) => setSelectedIconCat(e.target.value)}
                className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50"
              >
                <option value="all">Alle Categorieën ({allIcons.length})</option>
                {allCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Icons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-[460px] overflow-y-auto p-1">
              {filteredIcons.map((ic) => (
                <div
                  key={ic.id}
                  className="p-3 rounded-2xl border-2 border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50/30 transition-all flex flex-col items-center text-center justify-between group"
                >
                  <IconVisual
                    emoji={ic.emoji}
                    imageDataUrl={ic.imageDataUrl}
                    className="text-3xl my-1 group-hover:scale-110 transition-transform"
                    imageClassName="w-10 h-10 object-contain"
                  />
                  <div className="w-full">
                    <span className="text-xs font-black text-slate-900 block truncate">
                      {ic.label}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {ic.categoryLabel}
                    </span>
                  </div>

                  {ic.isCustom && (
                    <div className="mt-2 pt-1.5 border-t border-slate-100 w-full flex items-center justify-between">
                      <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1 rounded">
                        Zelfgemaakt
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteCustomIcon(ic.id)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                        title="Verwijder dit custom icoon"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: WEEKPLANNING AFDRUKKEN (1 A4 BLAD FORMAAT LIGGEND)                 */}
      {/* ========================================================================= */}
      {activeTab === 'afdrukken' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-100 via-orange-100 to-amber-100 rounded-3xl p-6 sm:p-8 border-3 border-amber-300 shadow-md">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-black shadow-xs">
                  <Printer className="w-4 h-4" /> 1 Blad A4 Liggend Formaat
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Printen naar PDF op 1 Pagina A4 Formaat Liggend
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 max-w-xl">
                  Met 1 klik print je de complete weekplanning liggend uit op <strong>exact 1 A4 vel</strong> of sla je deze op als digitaal PDF-bestand.
                  Inclusief herkenbare pictogrammen, starttijden, kleurtjes van gezinsleden en de 5-stermeter van Jaren!
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenPrintModal()}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-black px-5 py-3 rounded-2xl text-sm shadow-md transition-all flex items-center gap-2 active:scale-95"
                  >
                    <Printer className="w-4 h-4" />
                    <span>📄 Opslaan als PDF / Afdrukken (1 A4 Liggend)</span>
                  </button>
                </div>
              </div>

              {/* Preview illustration representation */}
              <div className="w-full md:w-72 bg-white rounded-2xl border-2 border-amber-300 p-4 shadow-sm space-y-2 shrink-0">
                <div className="flex items-center justify-between border-b pb-2 text-[11px] font-bold text-slate-700">
                  <span>A4 Liggend PDF</span>
                  <span className="text-emerald-700 font-black">Exact 1 Pagina</span>
                </div>
                <div className="grid grid-cols-7 gap-1 h-20 bg-amber-50/60 p-1.5 rounded-lg border border-amber-200">
                  {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((d, i) => (
                    <div key={i} className="bg-white rounded p-1 text-[8px] font-bold text-center border border-slate-200">
                      <span>{d}</span>
                      <div className="mt-1 text-[10px]">
                        {i === 0 ? '🎒' : i === 2 ? '🏊' : i === 5 ? '🥞' : '⭐'}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 text-center">
                  Koelkastversie met afvinkhokjes en stermeter
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: GEZINSLEDEN & INSTELLINGEN                                         */}
      {/* ========================================================================= */}
      {activeTab === 'gezin' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Gezinsleden Beheren
                </h3>
                <p className="text-xs text-slate-500">
                  Birger, Lieselot en Jaren met hun eigen herkenbare kleuren en avatars.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onOpenFamilySettings()}
                className="bg-amber-500 hover:bg-amber-600 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
              >
                <Users className="w-4 h-4" />
                <span>Gezin & Backup Instellingen</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl border-2 border-slate-200 bg-white flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border-2 border-white shadow-xs"
                      style={{ backgroundColor: m.color }}
                    >
                      {m.avatar}
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{m.name}</h4>
                      <p className="text-xs text-slate-500 capitalize">
                        {m.role === 'ouder' ? 'Ouder' : `Kind${m.age ? ` (${m.age} jaar)` : ''}`}
                      </p>
                      {m.role === 'kind' && (
                        <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md inline-block mt-1">
                          {m.stars ?? 0} Sterren
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEditMember(m)}
                    className="p-2 text-slate-400 hover:text-amber-600 rounded-xl hover:bg-amber-50"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

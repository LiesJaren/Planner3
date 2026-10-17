import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Smile,
  Shield,
  ShoppingBag,
  Printer,
  Plus,
  Star,
  Users,
  Sparkles,
  Volume2,
  CheckCircle,
  Trash2,
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
  RoutineTemplate,
} from './types/family';

import { AgendaView } from './components/AgendaView';
import { KidsModeView } from './components/KidsModeView';
import { ParentPortalView } from './components/ParentPortalView';
import { PrintWeekModal } from './components/PrintWeekModal';
import { EventModal } from './components/EventModal';
import { CopyEventsModal } from './components/CopyEventsModal';
import { InsertRoutineModal } from './components/InsertRoutineModal';
import { CreateIconModal } from './components/CreateIconModal';
import { IconPickerModal } from './components/IconPickerModal';

import { soundEffects, spreekBericht } from './utils/audio';
import { getTodayDateStr, addDays, getWeekMonday } from './utils/dateUtils';
import { ACTIVITY_ICONS } from './data/iconLibrary';

const DEFAULT_MEMBERS: FamilyMember[] = [
  { id: 'm1', name: 'Papa Birger', role: 'ouder', color: '#3b82f6', avatar: '👨' },
  { id: 'm2', name: 'Mama Lieselot', role: 'ouder', color: '#10b981', avatar: '👩' },
  { id: 'm3', name: 'Jaren (6 jr)', role: 'kind', color: '#f59e0b', avatar: '👦', stars: 5, rewardsEarned: 2 },
];

const INITIAL_GROCERIES: GroceryItem[] = [
  { id: 'g1', name: 'Halfvolle Melk', quantity: '2', unit: 'pakken', category: 'Zuivel', checked: false, icon: '🥛' },
  { id: 'g2', name: 'Volkoren Brood', quantity: '1', unit: 'brood', category: 'Bakkerij', checked: false, icon: '🍞' },
  { id: 'g3', name: 'Bananen', quantity: '1', unit: 'tros', category: 'Fruit & Groente', checked: false, icon: '🍌' },
  { id: 'g4', name: 'Eieren (vrije uitloop)', quantity: '10', unit: 'stuks', category: 'Zuivel', checked: true, icon: '🥚' },
  { id: 'g5', name: 'Chocolade Hagelslag', quantity: '1', unit: 'pak', category: 'Beleg', checked: false, icon: '🍫' },
  { id: 'g6', name: 'Appels (Elstar)', quantity: '6', unit: 'stuks', category: 'Fruit & Groente', checked: false, icon: '🍎' },
];

const INITIAL_REWARDS: Reward[] = [
  { id: 'r1', title: 'Zelf pannenkoeken bakken met stroop', icon: '🥞', emoji: '🥞', starsCost: 5, starCost: 5, description: 'Samen beslag maken en versieren', status: 'available' },
  { id: 'r2', title: '30 minuten extra schermtijd / gamen', icon: '🎮', emoji: '🎮', starsCost: 3, starCost: 3, description: 'Lekker bouwen in Lego of favoriete spel', status: 'available' },
  { id: 'r3', title: 'Zelf 2 bollen ijs kiezen bij ijssalon', icon: '🍦', emoji: '🍦', starsCost: 5, starCost: 5, description: 'Met spikkels en slagroom', status: 'available' },
  { id: 'r4', title: 'Middagje binnenspeeltuin of zwemparadijs', icon: '🎪', emoji: '🎪', starsCost: 10, starCost: 10, description: 'Klimmen, klauteren en glijden', status: 'available' },
];

function loadStoredArray<T>(key: string, legacyKey?: string): T[] | null {
  const keys = legacyKey ? [key, legacyKey] : [key];
  for (const storageKey of keys) {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === null) continue;
      const parsed: unknown = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed as T[];
      console.warn(`Ignoring invalid saved data for ${storageKey}: expected an array`);
    } catch (error) {
      console.warn(`Could not load saved data for ${storageKey}:`, error);
    }
  }
  return null;
}

export default function App() {
  const today = getTodayDateStr();
  const monday = getWeekMonday(today);

  // Core Persistent State
  const [activeTab, setActiveTab] = useState<'agenda' | 'kids' | 'ouders' | 'boodschappen'>('agenda');

  const [members, setMembers] = useState<FamilyMember[]>(() => {
    return loadStoredArray<FamilyMember>('fp_members', 'familieplanner_members_v2') ?? DEFAULT_MEMBERS;
  });

  const [events, setEvents] = useState<AgendaEvent[]>(() => {
    const savedEvents = loadStoredArray<AgendaEvent>('fp_events', 'familieplanner_events_v2');
    if (savedEvents) return savedEvents;

    // Seed realistic initial events around current week
    return [
      {
        id: 'ev_1',
        title: 'Opstaan & Tanden poetsen',
        date: today,
        startTime: '07:30',
        endTime: '08:00',
        memberIds: ['m3'],
        timeOfDay: 'ochtend',
        icon: '🪥',
        iconEmoji: '🪥',
        iconLabel: 'Tanden poetsen',
        isRoutine: true,
        completed: true,
      },
      {
        id: 'ev_2',
        title: 'Naar school (Groep 3)',
        date: today,
        startTime: '08:30',
        endTime: '15:15',
        memberIds: ['m3', 'm2'],
        timeOfDay: 'ochtend',
        icon: '🎒',
        iconEmoji: '🎒',
        iconLabel: 'School',
        location: 'Basisschool De Regenboog',
      },
      {
        id: 'ev_3',
        title: 'Zwemles - Diploma A',
        date: addDays(monday, 2), // Wednesday
        startTime: '15:30',
        endTime: '16:30',
        memberIds: ['m3', 'm1'],
        timeOfDay: 'middag',
        icon: '🏊',
        iconEmoji: '🏊',
        iconLabel: 'Zwemles',
        location: 'Zwembad De Vrolijke Dolfijn',
      },
      {
        id: 'ev_4',
        title: 'Voetbaltraining F-pupillen',
        date: addDays(monday, 4), // Friday
        startTime: '17:00',
        endTime: '18:00',
        memberIds: ['m3', 'm1'],
        timeOfDay: 'avond',
        icon: '⚽',
        iconEmoji: '⚽',
        iconLabel: 'Voetbal',
        location: 'Sportpark Middenmeer',
      },
      {
        id: 'ev_5',
        title: 'Pannenkoeken bakken gezinsdag',
        date: addDays(monday, 5), // Saturday
        startTime: '10:00',
        endTime: '12:00',
        memberIds: ['m1', 'm2', 'm3'],
        timeOfDay: 'ochtend',
        icon: '🥞',
        iconEmoji: '🥞',
        iconLabel: 'Pannenkoeken',
      },
    ];
  });

  const [groceries, setGroceries] = useState<GroceryItem[]>(() => {
    return loadStoredArray<GroceryItem>('fp_groceries', 'familieplanner_groceries_v2') ?? INITIAL_GROCERIES;
  });

  const [rewards, setRewards] = useState<Reward[]>(() => {
    return loadStoredArray<Reward>('fp_rewards', 'familieplanner_rewards_v2') ?? INITIAL_REWARDS;
  });

  const [customIcons, setCustomIcons] = useState<ActivityIcon[]>(() => {
    return loadStoredArray<ActivityIcon>('fp_custom_icons', 'familieplanner_custom_icons_v2') ?? [];
  });

  const [customCategories, setCustomCategories] = useState<IconCategoryMeta[]>(() => {
    return loadStoredArray<IconCategoryMeta>('fp_custom_categories', 'familieplanner_custom_cats_v2') ?? [];
  });

  // Local storage auto sync
  useEffect(() => {
    try {
      localStorage.setItem('fp_members', JSON.stringify(members));
      localStorage.setItem('fp_events', JSON.stringify(events));
      localStorage.setItem('fp_groceries', JSON.stringify(groceries));
      localStorage.setItem('fp_rewards', JSON.stringify(rewards));
      localStorage.setItem('fp_custom_icons', JSON.stringify(customIcons));
      localStorage.setItem('fp_custom_categories', JSON.stringify(customCategories));
    } catch (error) {
      console.warn('Could not save planner data to local storage:', error);
    }
  }, [members, events, groceries, rewards, customIcons, customCategories]);

  // Modal Control States
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);
  const [eventModalDate, setEventModalDate] = useState<string>(today);
  const [eventModalTimeOfDay, setEventModalTimeOfDay] = useState<TimeOfDay | undefined>();

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printDate, setPrintDate] = useState<string>(today);
  const [printScope, setPrintScope] = useState<'week' | 'day'>('week');

  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copySourceDate, setCopySourceDate] = useState<string>(today);
  const [copyEventId, setCopyEventId] = useState<string | undefined>();

  const [isInsertRoutineModalOpen, setIsInsertRoutineModalOpen] = useState(false);
  const [routineTargetDate, setRoutineTargetDate] = useState<string>(today);

  const [isCreateIconModalOpen, setIsCreateIconModalOpen] = useState(false);
  const [isIconPickerModalOpen, setIsIconPickerModalOpen] = useState(false);

  // New grocery form state
  const [newGroceryName, setNewGroceryName] = useState('');
  const [newGroceryQty, setNewGroceryQty] = useState('1');

  // Child member quick access
  const childMember = members.find((m) => m.role === 'kind') || members[2];
  const childStars = childMember?.stars ?? 0;

  // Handlers for Event Management
  const handleOpenAddEvent = (date?: string, timeOfDay?: TimeOfDay) => {
    soundEffects.playTap();
    setEditingEvent(null);
    setEventModalDate(date || today);
    setEventModalTimeOfDay(timeOfDay);
    setIsEventModalOpen(true);
  };

  const handleOpenEditEvent = (event: AgendaEvent) => {
    soundEffects.playTap();
    setEditingEvent(event);
    setEventModalDate(event.date);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = (eventData: Omit<AgendaEvent, 'id'>, eventId?: string) => {
    soundEffects.playSuccessChime();
    if (eventId) {
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...eventData, id: eventId } : e))
      );
    } else {
      const newEv: AgendaEvent = {
        ...eventData,
        id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      };
      setEvents((prev) => [...prev, newEv]);
    }
    setIsEventModalOpen(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    soundEffects.playTap();
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const handleToggleCompleteEvent = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const completed = !e.completed;
          if (completed && childMember && e.memberIds.includes(childMember.id)) {
            // Reward child with 1 star
            setMembers((mList) =>
              mList.map((m) =>
                m.id === childMember.id ? { ...m, stars: (m.stars || 0) + 1 } : m
              )
            );
          }
          return { ...e, completed };
        }
        return e;
      })
    );
  };

  const handleBatchInsertEvents = (newEvents: AgendaEvent[]) => {
    soundEffects.playVictoryFanfare();
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    setEvents((prev) => [...prev, ...newEvents]);
  };

  // Handlers for Stars & Rewards
  const handleUpdateMemberStars = (memberId: string, newStars: number) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, stars: Math.max(0, newStars) } : m))
    );
  };

  const handleAddReward = () => {
    soundEffects.playTap();
    const title = prompt('Titel van de nieuwe beloning:');
    if (!title?.trim()) return;
    const cost = parseInt(prompt('Aantal sterren benodigd (bijv. 5):') || '5', 10);
    const newRew: Reward = {
      id: `rw_${Date.now()}`,
      title: title.trim(),
      icon: '🎁',
      emoji: '🎁',
      starsCost: cost,
      starCost: cost,
      status: 'available',
    };
    setRewards((prev) => [...prev, newRew]);
  };

  const handleEditReward = (reward: Reward) => {
    setRewards((prev) => {
      const exists = prev.some((r) => r.id === reward.id);
      if (exists) {
        return prev.map((r) => (r.id === reward.id ? reward : r));
      }
      return [...prev, reward];
    });
  };

  const handleDeleteReward = (rewardId: string) => {
    soundEffects.playTap();
    setRewards((prev) => prev.filter((r) => r.id !== rewardId));
  };

  const handleClaimReward = (rewardId: string, _memberId: string) => {
    setRewards((prev) =>
      prev.map((r) => (r.id === rewardId ? { ...r, status: 'claimed' } : r))
    );
  };

  const handleRedeemReward = (
    rewardId: string,
    memberId: string,
    deductStars: boolean,
    approvedBy?: string
  ) => {
    const rew = rewards.find((r) => r.id === rewardId);
    const cost = rew?.starCost ?? rew?.starsCost ?? 5;

    if (deductStars) {
      handleUpdateMemberStars(memberId, Math.max(0, childStars - cost));
    }

    setRewards((prev) =>
      prev.map((r) =>
        r.id === rewardId
          ? {
              ...r,
              status: 'redeemed',
              redeemedAt: Date.now(),
              redeemedBy: approvedBy || 'Ouder',
            }
          : r
      )
    );
  };

  // Grocery Handlers
  const handleToggleGroceryCheck = (id: string) => {
    soundEffects.playTap();
    setGroceries((prev) =>
      prev.map((g) => (g.id === id ? { ...g, checked: !g.checked } : g))
    );
  };

  const handleAddGrocery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroceryName.trim()) return;
    soundEffects.playSuccessChime();
    const newItem: GroceryItem = {
      id: `g_${Date.now()}`,
      name: newGroceryName.trim(),
      quantity: newGroceryQty.trim() || '1',
      unit: 'stuks',
      category: 'Algemeen',
      checked: false,
      icon: '🛒',
    };
    setGroceries((prev) => [newItem, ...prev]);
    setNewGroceryName('');
    setNewGroceryQty('1');
  };

  const handleDeleteGrocery = (id: string) => {
    soundEffects.playTap();
    setGroceries((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/30 text-slate-800">
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-amber-200 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo & Family identity */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center text-2xl shadow-sm border-2 border-white">
              🌟
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>FamiliePlanner</span>
                <span className="hidden sm:inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Gezinsagenda
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Birger, Lieselot & Jaren 🎒⚽⭐
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                setActiveTab('agenda');
              }}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'agenda'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Agenda</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                setActiveTab('kids');
              }}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'kids'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Smile className="w-4 h-4" />
              <span>Kindermodus</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                setActiveTab('ouders');
              }}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ouders'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Ouderportaal</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                setActiveTab('boodschappen');
              }}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'boodschappen'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Boodschappen</span>
            </button>
          </nav>

          {/* Right quick tools: Stars meter + Print shortcut */}
          <div className="flex items-center gap-2">
            {/* Quick Star Counter for Jaren */}
            <div
              onClick={() => {
                soundEffects.playStarChime();
                setActiveTab('kids');
              }}
              className="px-3 py-1.5 rounded-2xl bg-amber-100 hover:bg-amber-200 border-2 border-amber-300 flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 shadow-2xs"
              title="Sterren van Jaren - Klik om naar Kindermodus te gaan"
            >
              <Star className="w-4 h-4 fill-amber-500 text-amber-500 animate-bounce" />
              <span className="text-xs font-black text-amber-950">
                ⭐ {childStars}
              </span>
            </div>

            {/* Print 1 A4 Quick Action */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                setPrintDate(today);
                setPrintScope('week');
                setIsPrintModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-2xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-sm flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
              title="Druk de weekplanning af op 1 vel A4 voor op de koelkast"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden md:inline">Print 1 A4</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'agenda' && (
          <AgendaView
            events={events}
            members={members}
            initialDate={today}
            onAddEvent={handleOpenAddEvent}
            onEditEvent={handleOpenEditEvent}
            onDeleteEvent={handleDeleteEvent}
            onToggleComplete={handleToggleCompleteEvent}
            onOpenPrintModal={(d, scope) => {
              setPrintDate(d || today);
              setPrintScope(scope || 'week');
              setIsPrintModalOpen(true);
            }}
            onOpenInsertRoutineModal={(d) => {
              setRoutineTargetDate(d || today);
              setIsInsertRoutineModalOpen(true);
            }}
            onOpenCopyModal={(d, evId) => {
              setCopySourceDate(d || today);
              setCopyEventId(evId);
              setIsCopyModalOpen(true);
            }}
            onBatchInsertEvents={handleBatchInsertEvents}
          />
        )}

        {activeTab === 'kids' && (
          <KidsModeView
            events={events}
            groceries={groceries}
            members={members}
            rewards={rewards}
            onToggleEventComplete={handleToggleCompleteEvent}
            onToggleGroceryCheck={handleToggleGroceryCheck}
            onAddReward={handleAddReward}
            onEditReward={handleEditReward}
            onDeleteReward={handleDeleteReward}
            onClaimReward={handleClaimReward}
            onRedeemReward={handleRedeemReward}
            onUpdateMemberStars={handleUpdateMemberStars}
          />
        )}

        {activeTab === 'ouders' && (
          <ParentPortalView
            members={members}
            events={events}
            rewards={rewards}
            groceries={groceries}
            customIcons={customIcons}
            customCategories={customCategories}
            onAddEvent={handleOpenAddEvent}
            onEditEvent={handleOpenEditEvent}
            onDeleteEvent={handleDeleteEvent}
            onToggleCompleteEvent={handleToggleCompleteEvent}
            onAddReward={handleAddReward}
            onEditReward={handleEditReward}
            onDeleteReward={handleDeleteReward}
            onClaimReward={handleClaimReward}
            onRedeemReward={(rewId, memId, deduct, approvedBy) =>
              handleRedeemReward(rewId, memId, deduct, approvedBy)
            }
            onUpdateMemberStars={handleUpdateMemberStars}
            onSaveCustomIcon={(newIcon) => {
              setCustomIcons((prev) => [...prev, newIcon]);
            }}
            onDeleteCustomIcon={(iconId) => {
              setCustomIcons((prev) => prev.filter((i) => i.id !== iconId));
            }}
            onOpenPrintModal={(d) => {
              setPrintDate(d || today);
              setPrintScope('week');
              setIsPrintModalOpen(true);
            }}
            onOpenInsertRoutineModal={(d) => {
              setRoutineTargetDate(d || today);
              setIsInsertRoutineModalOpen(true);
            }}
            onOpenCopyModal={(d, evId) => {
              setCopySourceDate(d || today);
              setCopyEventId(evId);
              setIsCopyModalOpen(true);
            }}
            onOpenFamilySettings={() => {
              soundEffects.playTap();
              alert('Gezinsbeheer: Namen en voorkeuren worden direct opgeslagen in LocalStorage.');
            }}
            onOpenCreateIconModal={() => setIsCreateIconModalOpen(true)}
            onEditMember={(m) => {
              setMembers((prev) => prev.map((item) => (item.id === m.id ? m : item)));
            }}
          />
        )}

        {/* Tab 4: Boodschappenlijstje */}
        {activeTab === 'boodschappen' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-6 shadow-md border-3 border-emerald-400 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-4xl shadow-inner border border-white/30">
                  🛒
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black">
                    Gedeeld Boodschappenlijstje
                  </h2>
                  <p className="text-xs sm:text-sm text-emerald-100 font-medium">
                    Voor Birger en Lieselot in de supermarkt en voor Jaren in de speurtochtmodus!
                  </p>
                </div>
              </div>

              <div className="bg-white/20 px-4 py-2 rounded-2xl border border-white/30 text-center">
                <span className="text-[10px] uppercase font-black text-emerald-100 block">Nog te halen</span>
                <span className="text-xl font-black text-white">
                  {groceries.filter((g) => !g.checked).length} artikelen
                </span>
              </div>
            </div>

            {/* Quick Add Form */}
            <form
              onSubmit={handleAddGrocery}
              className="bg-white p-4 rounded-3xl border-2 border-emerald-200 shadow-sm flex flex-col sm:flex-row items-center gap-3"
            >
              <input
                type="text"
                value={newGroceryName}
                onChange={(e) => setNewGroceryName(e.target.value)}
                placeholder="Bijv. Roombeboter, aardbeien, pannenkoekenmeel..."
                className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold focus:outline-hidden focus:border-emerald-500 w-full"
              />
              <input
                type="text"
                value={newGroceryQty}
                onChange={(e) => setNewGroceryQty(e.target.value)}
                placeholder="Aantal"
                className="w-full sm:w-24 px-3 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold focus:outline-hidden focus:border-emerald-500 text-center"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Toevoegen</span>
              </button>
            </form>

            {/* Grocery items list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {groceries.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleGroceryCheck(item.id)}
                  className={`p-4 rounded-3xl border-2 transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    item.checked
                      ? 'bg-emerald-50/60 border-emerald-300 text-slate-400'
                      : 'bg-white border-slate-200 hover:border-emerald-400 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-3xl shrink-0">{item.icon || '🛒'}</span>
                    <div className="min-w-0">
                      <h4
                        className={`text-sm font-black truncate ${
                          item.checked ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {item.name}
                      </h4>
                      <span className="text-xs text-slate-500 font-semibold">
                        {item.quantity} {item.unit || ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                        item.checked
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'border-2 border-slate-300 bg-slate-50'
                      }`}
                    >
                      {item.checked && <CheckCircle className="w-4 h-4" />}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGrocery(item.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      title="Verwijder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Global Modals */}
      <EventModal
        isOpen={isEventModalOpen}
        initialEvent={editingEvent}
        defaultDate={eventModalDate}
        defaultTimeOfDay={eventModalTimeOfDay}
        members={members}
        customIcons={customIcons}
        customCategories={customCategories}
        onOpenCreateIconModal={() => setIsCreateIconModalOpen(true)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        onClose={() => {
          setIsEventModalOpen(false);
          setEditingEvent(null);
        }}
      />

      <PrintWeekModal
        isOpen={isPrintModalOpen}
        events={events}
        members={members}
        groceries={groceries}
        defaultDate={printDate}
        initialScope={printScope}
        onNavigateToDay={(d) => {
          setIsPrintModalOpen(false);
          setActiveTab('agenda');
        }}
        onClose={() => setIsPrintModalOpen(false)}
      />

      <CopyEventsModal
        isOpen={isCopyModalOpen}
        events={events}
        members={members}
        initialSourceDate={copySourceDate}
        initialSelectedEventId={copyEventId}
        onBatchCopyEvents={handleBatchInsertEvents}
        onClose={() => setIsCopyModalOpen(false)}
      />

      <InsertRoutineModal
        isOpen={isInsertRoutineModalOpen}
        defaultDate={routineTargetDate}
        members={members}
        customIcons={customIcons}
        onBatchInsertEvents={handleBatchInsertEvents}
        onClose={() => setIsInsertRoutineModalOpen(false)}
      />

      <CreateIconModal
        isOpen={isCreateIconModalOpen}
        customCategories={customCategories}
        onSaveIcon={(newIcon) => {
          setCustomIcons((prev) => [...prev, newIcon]);
          setIsCreateIconModalOpen(false);
        }}
        onClose={() => setIsCreateIconModalOpen(false)}
      />

      <IconPickerModal
        isOpen={isIconPickerModalOpen}
        customIcons={customIcons}
        customCategories={customCategories}
        onSelectIcon={() => setIsIconPickerModalOpen(false)}
        onClose={() => setIsIconPickerModalOpen(false)}
      />
    </div>
  );
}

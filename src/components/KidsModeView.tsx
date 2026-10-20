import React, { useState, useMemo } from 'react';
import { Volume2, Star, CheckCircle, Sparkles, Trophy, ShoppingBag, Calendar, Gift, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AgendaEvent, FamilyMember, GroceryItem, Reward } from '../types/family';
import { soundEffects, spreekBericht } from '../utils/audio';
import { IconVisual } from './IconVisual';
import { getTodayDateStr, addDays, formatDutchFullDate } from '../utils/dateUtils';
import kidsMascotImg from '../assets/images/kids_mode_mascot_1791799911638.jpg';
import { RewardsView } from './RewardsView';
import { MilestoneBadgesSection } from './MilestoneBadgesSection';
import { MILESTONE_BADGES, getNextMilestone } from '../data/milestoneBadges';
import { MemberAvatar } from './MemberAvatar';

interface KidsModeViewProps {
  events: AgendaEvent[];
  groceries: GroceryItem[];
  members: FamilyMember[];
  rewards: Reward[];
  onToggleEventComplete: (eventId: string) => void;
  onToggleGroceryCheck: (groceryId: string) => void;
  onAddReward: () => void;
  onEditReward: (reward: Reward) => void;
  onDeleteReward: (rewardId: string) => void;
  onClaimReward: (rewardId: string, memberId: string) => void;
  onRedeemReward: (rewardId: string, memberId: string, deductStars: boolean) => void;
  onResetRewardStatus?: (rewardId: string) => void;
  onUpdateMemberStars: (memberId: string, newStars: number) => void;
  initialSubTab?: 'dag' | 'medailles' | 'speurtocht' | 'beloningen';
}

export const KidsModeView: React.FC<KidsModeViewProps> = ({
  events,
  groceries,
  members,
  rewards,
  onToggleEventComplete,
  onToggleGroceryCheck,
  onAddReward,
  onEditReward,
  onDeleteReward,
  onClaimReward,
  onRedeemReward,
  onResetRewardStatus,
  onUpdateMemberStars,
  initialSubTab = 'dag',
}) => {
  const [subTab, setSubTab] = useState<'dag' | 'medailles' | 'speurtocht' | 'beloningen'>(initialSubTab);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Find kids in the family or fallback to first member
  const kids = useMemo(() => members.filter((m) => m.role === 'kind'), [members]);
  const [selectedKidId, setSelectedKidId] = useState<string>(
    kids[0]?.id || members[0]?.id || ''
  );

  const selectedKid = members.find((m) => m.id === selectedKidId) || kids[0] || members[0];
  const selectedKidStars = selectedKid?.stars ?? 0;

  const todayStr = useMemo(() => getTodayDateStr(), []);
  const [activeDateStr, setActiveDateStr] = useState<string>(() => getTodayDateStr());

  // Today's events for this child or family on activeDateStr
  const todayKidEvents = useMemo(() => {
    return events
      .filter(
        (e) =>
          e.date === activeDateStr &&
          (e.memberIds.length === 0 ||
            e.memberIds.includes(selectedKidId) ||
            e.memberIds.length === members.length)
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [events, activeDateStr, selectedKidId, members]);

  // Group events into 3 parts of the day
  const ochtendEvents = todayKidEvents.filter(
    (e) => e.timeOfDay === 'ochtend' || parseInt(e.startTime.split(':')[0], 10) < 12
  );
  const middagEvents = todayKidEvents.filter(
    (e) =>
      (e.timeOfDay === 'middag' ||
        (parseInt(e.startTime.split(':')[0], 10) >= 12 &&
          parseInt(e.startTime.split(':')[0], 10) < 17)) &&
      !ochtendEvents.includes(e)
  );
  const avondEvents = todayKidEvents.filter(
    (e) =>
      (e.timeOfDay === 'avond' || parseInt(e.startTime.split(':')[0], 10) >= 17) &&
      !ochtendEvents.includes(e) &&
      !middagEvents.includes(e)
  );

  // Star count calculation (persistent child stars)
  const achievedRewardsCount = rewards.filter(
    (r) =>
      (!r.targetMemberId || r.targetMemberId === 'all' || (selectedKid && r.targetMemberId === selectedKid.id)) &&
      r.status !== 'redeemed' &&
      selectedKidStars >= (r.starCost ?? r.starsCost ?? 5)
  ).length;

  const handleSpeakItem = (title: string, time: string, id: string) => {
    soundEffects.playTap();
    setSpeakingId(id);
    const kidName = selectedKid ? selectedKid.name.split(' ')[0] : 'Kanjer';
    const text = `Hoi ${kidName}! Om ${time}: ${title}!`;
    spreekBericht(text, () => setSpeakingId(null));
  };

  const handleTaskClick = (event: AgendaEvent) => {
    const nextCompleted = !event.completed;
    onToggleEventComplete(event.id);

    if (nextCompleted) {
      soundEffects.playSuccessChime();
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#f59e0b', '#ec4899', '#3b82f6', '#10b981'],
      });
      const kidName = selectedKid ? selectedKid.name.split(' ')[0] : 'Kanjer';
      const newStars = selectedKidStars + 1;
      if (selectedKid) {
        onUpdateMemberStars(selectedKid.id, newStars);
      }

      // Check if this star unlocks a milestone badge (e.g., 10, 25, 50, 75, 100 stars)
      const hitMilestone = MILESTONE_BADGES.find((b) => b.starRequirement === newStars);
      if (hitMilestone) {
        soundEffects.playVictoryFanfare();
        confetti({
          particleCount: 150,
          spread: 120,
          origin: { y: 0.5 },
          colors: ['#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#3b82f6'],
        });
        spreekBericht(
          `HOERA ${kidName}! Mijlpaal bereikt! Je hebt zojuist de ${hitMilestone.title} behaald met ${newStars} sterren! ${hitMilestone.cheerMessage}`
        );
        return;
      }

      const unlockedNow = rewards.filter(
        (r) =>
          (!r.targetMemberId || r.targetMemberId === 'all' || (selectedKid && r.targetMemberId === selectedKid.id)) &&
          r.status !== 'redeemed' &&
          r.starCost === newStars
      );
      if (unlockedNow.length > 0) {
        soundEffects.playFanfare();
        spreekBericht(
          `Geweldig ${kidName}! Je hebt nu ${newStars} sterren! Je beloning "${unlockedNow[0].title}" is ontgrendeld!`
        );
      } else {
        spreekBericht(`Goed gedaan ${kidName}! Je hebt een ster verdiend! Je hebt nu ${newStars} sterren!`);
      }
    } else {
      soundEffects.playTap();
      if (selectedKid) {
        onUpdateMemberStars(selectedKid.id, Math.max(0, selectedKidStars - 1));
      }
    }
  };

  const handleTreasureClick = (item: GroceryItem) => {
    const nextChecked = !item.checked;
    onToggleGroceryCheck(item.id);

    if (nextChecked) {
      soundEffects.playSuccessChime();
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#3b82f6'],
      });
      const newStars = selectedKidStars + 1;
      if (selectedKid) {
        onUpdateMemberStars(selectedKid.id, newStars);
      }

      const hitMilestone = MILESTONE_BADGES.find((b) => b.starRequirement === newStars);
      if (hitMilestone) {
        const kidName = selectedKid ? selectedKid.name.split(' ')[0] : 'Kanjer';
        soundEffects.playVictoryFanfare();
        spreekBericht(
          `HOERA ${kidName}! Mijlpaal bereikt! ${hitMilestone.title} behaald met ${newStars} sterren!`
        );
      } else {
        spreekBericht(`Gevonden! ${item.name} zit in de winkelwagen! +1 ster verdiend!`);
      }
    } else {
      soundEffects.playTap();
      if (selectedKid) {
        onUpdateMemberStars(selectedKid.id, Math.max(0, selectedKidStars - 1));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Friendly Child Banner with Mascot */}
      <div className="bg-gradient-to-r from-amber-200 via-orange-100 to-amber-100 rounded-3xl p-5 sm:p-6 border-3 border-amber-300 shadow-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <img
              src={kidsMascotImg}
              alt="Vrolijke Vosje Mascotte"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl shadow-md border-2 border-white object-cover shrink-0"
            />
            <div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white text-xs font-black text-amber-900 shadow-2xs mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Kindermodus (Vanaf 6 jaar)
              </span>
              <h2 className="text-2xl font-black text-slate-900">
                Hoi {selectedKid ? selectedKid.name.split(' ')[0] : 'Kanjer'}! 👋
              </h2>
              <p className="text-xs text-slate-700 font-medium">
                Tik op een kaartje om te horen wat we gaan doen!
              </p>
            </div>
          </div>

          {/* Star Trophy Counter - Clickable to open Medailles & Mijlpalen */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playTap();
              setSubTab('medailles');
            }}
            className="bg-white/95 rounded-2xl p-3 sm:p-4 border-2 border-amber-300 shadow-sm flex items-center gap-3 hover:bg-amber-50 hover:scale-102 transition-all cursor-pointer text-left group"
            title="Bekijk je medailles en mijlpalen (25, 50, 100 sterren)!"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white text-2xl shadow-inner shrink-0 group-hover:rotate-6 transition-transform">
              <Trophy className="w-7 h-7 text-amber-950" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold text-amber-900 uppercase block">
                Mijn Sterren & Medailles
              </span>
              <span className="text-2xl font-black text-amber-600 flex items-center gap-1">
                ⭐ {selectedKidStars}
              </span>
            </div>
          </button>
        </div>

        {/* Child Selector Tabs (if multiple kids) */}
        {kids.length > 1 && (
          <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold text-slate-700 shrink-0">Kies kind:</span>
            {kids.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  setSelectedKidId(k.id);
                }}
                className={`px-3 py-1.5 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all ${
                  selectedKidId === k.id
                    ? 'bg-amber-500 text-white shadow-xs scale-105'
                    : 'bg-white text-slate-800 hover:bg-amber-100'
                }`}
              >
                <span className="text-lg"><MemberAvatar avatar={k.avatar} name={k.name} /></span>
                <span>{k.name}</span>
                <span className="px-1 py-0.5 rounded-md bg-white/40 text-[10px] font-black">
                  ⭐ {k.stars || 0}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* View Switcher: 4 Tabs: Mijn Dag, Medailles Mijlpalen, Speurtocht, Beloningen */}
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2 bg-white/70 p-1.5 rounded-2xl border border-amber-200">
          <button
            type="button"
            onClick={() => {
              soundEffects.playTap();
              setSubTab('dag');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
              subTab === 'dag'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Mijn Dag Vandaag</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playTap();
              setSubTab('medailles');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all relative ${
              subTab === 'medailles'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-md'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-950 fill-amber-300" />
            <span>Medailles (25, 50, 100⭐)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playTap();
              setSubTab('speurtocht');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
              subTab === 'speurtocht'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Speurtocht! 🔍</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playTap();
              setSubTab('beloningen');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all relative ${
              subTab === 'beloningen'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Beloningen 🎁</span>
            {achievedRewardsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                {achievedRewardsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Subtab 1: Mijn Dag (Morning, Noon, Evening Big Cards) */}
      {subTab === 'dag' && (
        <div className="space-y-6">
          {/* Compact Milestone Teaser Card in Day view */}
          {(() => {
            const { nextBadge, starsNeeded, progressPercent } = getNextMilestone(selectedKidStars);
            if (!nextBadge) return null;
            return (
              <div
                onClick={() => {
                  soundEffects.playTap();
                  setSubTab('medailles');
                }}
                className="bg-white rounded-2xl p-3.5 sm:p-4 border-2 border-amber-300 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shrink-0">
                    {nextBadge.iconEmoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">
                        Volgende Mijlpaal:
                      </span>
                      <span className="text-xs font-black text-slate-900">
                        {nextBadge.title} ({nextBadge.starRequirement} ⭐)
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-600 font-medium">
                      Nog <span className="font-black text-amber-700">{starsNeeded}</span> sterretjes tot je volgende medaille!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:block text-right">
                    <span className="text-xs font-black text-amber-700 block">{progressPercent}%</span>
                    <div className="w-20 h-2 bg-amber-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-black text-amber-800 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                    Bekijk 🏅
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Vrolijke Dag-schakelaar voor kinderen */}
          <div className="bg-white rounded-2xl p-3 border-2 border-amber-300 shadow-2xs flex items-center justify-between gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                setActiveDateStr((prev) => addDays(prev, -1));
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-black bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 transition-colors cursor-pointer"
            >
              ← Vorige dag
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-slate-800 capitalize flex items-center gap-1.5">
                <span>📅</span>
                <span>{formatDutchFullDate(activeDateStr)}</span>
                {activeDateStr === todayStr && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black">
                    Vandaag
                  </span>
                )}
              </span>
              {activeDateStr !== todayStr && (
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playTap();
                    setActiveDateStr(todayStr);
                  }}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-200 text-amber-950 hover:bg-amber-300 cursor-pointer"
                >
                  Naar Vandaag
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                setActiveDateStr((prev) => addDays(prev, 1));
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-black bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 transition-colors cursor-pointer"
            >
              Volgende dag →
            </button>
          </div>

          {todayKidEvents.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border-2 border-dashed border-amber-200">
              <span className="text-6xl block mb-2">🎉</span>
              <h3 className="text-lg font-black text-slate-800">
                Geen afspraken meer voor vandaag!
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Lekker spelen of een boekje lezen!
              </p>
            </div>
          ) : (
            <>
              {/* Ochtend */}
              {ochtendEvents.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🌅</span>
                    <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">
                      Ochtend
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {ochtendEvents.map((event) => (
                      <KidEventTile
                        key={event.id}
                        event={event}
                        isSpeaking={speakingId === event.id}
                        onSpeak={handleSpeakItem}
                        onComplete={handleTaskClick}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Middag */}
              {middagEvents.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">☀️</span>
                    <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">
                      Middag
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {middagEvents.map((event) => (
                      <KidEventTile
                        key={event.id}
                        event={event}
                        isSpeaking={speakingId === event.id}
                        onSpeak={handleSpeakItem}
                        onComplete={handleTaskClick}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Avond */}
              {avondEvents.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🌙</span>
                    <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">
                      Avond
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {avondEvents.map((event) => (
                      <KidEventTile
                        key={event.id}
                        event={event}
                        isSpeaking={speakingId === event.id}
                        onSpeak={handleSpeakItem}
                        onComplete={handleTaskClick}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Subtab: Medailles & Mijlpalen (Visual Badges for 10, 25, 50, 75, 100, 150, 200 stars) */}
      {subTab === 'medailles' && (
        <MilestoneBadgesSection
          currentStars={selectedKidStars}
          childName={selectedKid ? selectedKid.name.split(' ')[0] : 'Jaren'}
          isParentView={false}
          onAdjustStars={(delta) => {
            if (selectedKid) {
              onUpdateMemberStars(selectedKid.id, Math.max(0, selectedKidStars + delta));
            }
          }}
        />
      )}

      {/* Subtab 2: Supermarkt Speurtocht (Gamified Grocery finding for kids) */}
      {subTab === 'speurtocht' && (
        <div className="space-y-4">
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-center">
            <h3 className="text-base font-black text-emerald-950 flex items-center justify-center gap-2">
              <span>🕵️‍♀️</span> Boodschappen Speurtocht!
            </h3>
            <p className="text-xs text-emerald-800 mt-1">
              Zoek deze spulletjes in de supermarkt en tik erop als je ze hebt gevonden!
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {groceries.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTreasureClick(item)}
                className={`p-4 rounded-3xl border-3 flex flex-col items-center justify-center text-center transition-all relative overflow-hidden min-h-[140px] group ${
                  item.checked
                    ? 'border-emerald-500 bg-emerald-100/70 shadow-inner scale-95'
                    : 'border-slate-200 bg-white hover:border-emerald-300 hover:scale-105 shadow-sm'
                }`}
              >
                {item.checked && (
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-xs">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                )}
                <span className="text-5xl mb-2 transform group-hover:scale-110 transition-transform">
                  {item.icon}
                </span>
                <span
                  className={`text-sm font-black ${
                    item.checked ? 'text-emerald-800 line-through' : 'text-slate-800'
                  }`}
                >
                  {item.name}
                </span>
                <span className="text-xs font-semibold text-slate-500 mt-0.5">
                  {item.quantity} {item.unit}
                </span>
                <span
                  className={`mt-2 text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                    item.checked
                      ? 'bg-emerald-200 text-emerald-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {item.checked ? 'Gevonden! ⭐' : 'Zoek mij! 🔍'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 3: Beloningen & Sterren Doelen */}
      {subTab === 'beloningen' && (
        <RewardsView
          rewards={rewards}
          members={members}
          onAddReward={onAddReward}
          onEditReward={onEditReward}
          onDeleteReward={onDeleteReward}
          onClaimReward={onClaimReward}
          onRedeemReward={onRedeemReward}
          onResetRewardStatus={onResetRewardStatus}
          onUpdateMemberStars={onUpdateMemberStars}
          isParentModeDefault={false}
        />
      )}
    </div>
  );
};

// Big, High-Legibility Tile for Kids
interface KidEventTileProps {
  event: AgendaEvent;
  isSpeaking: boolean;
  onSpeak: (title: string, time: string, id: string) => void;
  onComplete: (event: AgendaEvent) => void;
}

const KidEventTile: React.FC<KidEventTileProps> = ({
  event,
  isSpeaking,
  onSpeak,
  onComplete,
}) => {
  return (
    <div
      onClick={() => onComplete(event)}
      className={`p-4 sm:p-5 rounded-3xl border-3 transition-all cursor-pointer flex items-center gap-4 relative overflow-hidden ${
        event.completed
          ? 'border-emerald-400 bg-emerald-50/70 shadow-inner'
          : 'border-amber-200 bg-white hover:border-amber-400 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Big Visual Icon */}
      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-amber-100/70 border-2 border-amber-300 flex items-center justify-center text-4xl sm:text-5xl shrink-0 shadow-2xs">
        <IconVisual emoji={event.iconEmoji || event.icon || '⭐'} imageDataUrl={event.iconImageDataUrl} imageClassName="w-12 h-12 object-contain" />
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-xs font-black text-amber-700 block">
          ⏰ {event.startTime}
        </span>
        <h4
          className={`text-base sm:text-lg font-black text-slate-900 line-clamp-1 ${
            event.completed ? 'line-through text-slate-400' : ''
          }`}
        >
          {event.title}
        </h4>
        <span className="text-xs text-slate-500 font-medium line-clamp-1">
          {event.iconLabel}
        </span>

        {/* Big Tap completion tag */}
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`text-xs font-black px-2.5 py-1 rounded-xl inline-flex items-center gap-1 ${
              event.completed
                ? 'bg-emerald-500 text-white shadow-2xs'
                : 'bg-amber-100 text-amber-900'
            }`}
          >
            {event.completed ? (
              <>
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>Klaar! +1 Ster</span>
              </>
            ) : (
              <span>Tik als je klaar bent!</span>
            )}
          </span>
        </div>
      </div>

      {/* Audio Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSpeak(event.title, event.startTime, event.id);
        }}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
          isSpeaking
            ? 'bg-amber-500 text-white animate-pulse'
            : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
        }`}
        title="Laat horen wat dit is!"
      >
        <Volume2 className="w-6 h-6" />
      </button>
    </div>
  );
};

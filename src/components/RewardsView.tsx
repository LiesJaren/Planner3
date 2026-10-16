import React from 'react';
import { Gift, Star, Check, Plus, Edit2, Trash2, Sparkles, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Reward, FamilyMember } from '../types/family';
import { soundEffects, spreekBericht } from '../utils/audio';

interface RewardsViewProps {
  rewards: Reward[];
  members: FamilyMember[];
  onAddReward: () => void;
  onEditReward: (reward: Reward) => void;
  onDeleteReward: (rewardId: string) => void;
  onClaimReward: (rewardId: string, memberId: string) => void;
  onRedeemReward: (rewardId: string, memberId: string, deductStars: boolean) => void;
  onResetRewardStatus?: (rewardId: string) => void;
  onUpdateMemberStars: (memberId: string, newStars: number) => void;
  isParentModeDefault?: boolean;
}

export const RewardsView: React.FC<RewardsViewProps> = ({
  rewards,
  members,
  onAddReward,
  onEditReward,
  onDeleteReward,
  onClaimReward,
  onRedeemReward,
  onResetRewardStatus,
  onUpdateMemberStars,
  isParentModeDefault = false,
}) => {
  const childMember = members.find((m) => m.role === 'kind') || members[0];
  const childStars = childMember?.stars ?? 0;
  const childName = childMember ? childMember.name.split(' ')[0] : 'Jaren';

  const handleClaim = (reward: Reward) => {
    if (!childMember) return;
    const cost = reward.starCost ?? reward.starsCost ?? 5;
    if (childStars < cost) {
      soundEffects.playTap();
      spreekBericht(`Je hebt nog ${cost - childStars} sterren nodig voor ${reward.title}!`);
      return;
    }
    soundEffects.playVictoryFanfare();
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    onClaimReward(reward.id, childMember.id);
    spreekBericht(`Hoera! Je hebt ${reward.title} aangevraagd bij papa of mama!`);
  };

  const handleRedeem = (reward: Reward) => {
    if (!childMember) return;
    const cost = reward.starCost ?? reward.starsCost ?? 5;
    soundEffects.playVictoryFanfare();
    confetti({ particleCount: 100, spread: 90, origin: { y: 0.6 } });
    onRedeemReward(reward.id, childMember.id, true);
    spreekBericht(`Gefeliciteerd ${childName}! ${reward.title} is ingewisseld! Veel plezier!`);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 rounded-3xl p-6 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-4xl shadow-inner border border-white/30">
            🎁
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black">
              Beloningen & Sterren Doelen
            </h2>
            <p className="text-xs sm:text-sm font-medium text-pink-100">
              Spaar sterren door routines en taken te doen en wissel in voor een leuke verrassing!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-xs px-4 py-2 rounded-2xl border border-white/30 text-center">
            <span className="text-[10px] uppercase font-black text-pink-100 block">Jouw Sterren</span>
            <span className="text-xl font-black text-amber-200">⭐ {childStars}</span>
          </div>

          {isParentModeDefault && (
            <button
              type="button"
              onClick={onAddReward}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-black text-xs shadow-md flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Nieuwe Beloning</span>
            </button>
          )}
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {rewards.map((reward) => {
          const cost = reward.starCost ?? reward.starsCost ?? 5;
          const canAfford = childStars >= cost;
          const isClaimed = reward.status === 'claimed' || reward.status === 'aangevraagd';
          const isRedeemed = reward.status === 'redeemed' || reward.status === 'ingewisseld';

          return (
            <div
              key={reward.id}
              className={`p-5 rounded-3xl border-3 transition-all flex flex-col justify-between bg-white relative shadow-sm hover:shadow-md ${
                isRedeemed
                  ? 'border-emerald-300 bg-emerald-50/30'
                  : isClaimed
                  ? 'border-indigo-300 bg-indigo-50/30'
                  : canAfford
                  ? 'border-amber-300 ring-2 ring-amber-200/50'
                  : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl shadow-2xs">
                    {reward.emoji || reward.icon || '🎁'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{cost} sterren</span>
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900">{reward.title}</h3>
                {reward.description && (
                  <p className="text-xs text-slate-600 mt-1">{reward.description}</p>
                )}
              </div>

              {/* Status and Action button */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {isRedeemed ? (
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 flex items-center gap-1">
                    <Check className="w-4 h-4 stroke-[3]" /> Ingewisseld!
                  </span>
                ) : isClaimed ? (
                  <div className="flex items-center gap-2 w-full justify-between">
                    <span className="text-xs font-black text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-xl">
                      Aangevraagd ⌛
                    </span>
                    {isParentModeDefault && (
                      <button
                        type="button"
                        onClick={() => handleRedeem(reward)}
                        className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs"
                      >
                        Goedkeuren
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleClaim(reward)}
                    disabled={!canAfford}
                    className={`w-full py-2.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-1.5 ${
                      canAfford
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-md active:scale-95 cursor-pointer'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{canAfford ? 'Kies deze beloning! 🎉' : `Nog ${cost - childStars} sterren nodig`}</span>
                  </button>
                )}

                {isParentModeDefault && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditReward(reward)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                      title="Bewerken"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteReward(reward.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="Verwijderen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

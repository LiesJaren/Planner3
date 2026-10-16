import React from 'react';
import { Trophy, Star, Award, CheckCircle } from 'lucide-react';
import { MILESTONE_BADGES, getNextMilestone } from '../data/milestoneBadges';
import { soundEffects } from '../utils/audio';

interface MilestoneBadgesSectionProps {
  currentStars: number;
  childName: string;
  isParentView?: boolean;
  onAdjustStars?: (delta: number) => void;
}

export const MilestoneBadgesSection: React.FC<MilestoneBadgesSectionProps> = ({
  currentStars,
  childName,
  isParentView = false,
  onAdjustStars,
}) => {
  const { current, next } = getNextMilestone(currentStars);
  const remaining = next ? next.minStars - currentStars : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-3xl p-6 text-slate-900 shadow-md border-3 border-amber-300">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-16 h-16 rounded-2xl bg-white/40 flex items-center justify-center text-4xl shadow-inner">
              🏆
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black">
                Medailles & Mijlpalen van {childName}
              </h2>
              <p className="text-xs sm:text-sm font-bold text-amber-950 mt-0.5">
                Huidige score: <span className="text-base sm:text-lg font-black">{currentStars} ⭐ sterren</span>
                {next && ` • Nog ${remaining} sterren tot ${next.title}!`}
              </p>
            </div>
          </div>

          {isParentView && onAdjustStars && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  onAdjustStars(-1);
                }}
                className="w-9 h-9 rounded-xl bg-white hover:bg-amber-100 font-black text-slate-800 shadow-xs flex items-center justify-center text-base"
                title="-1 ster"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playStarChime();
                  onAdjustStars(1);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-xs flex items-center gap-1"
                title="+1 ster"
              >
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> +1 Ster
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {MILESTONE_BADGES.map((badge) => {
          const isUnlocked = currentStars >= badge.minStars;
          return (
            <div
              key={badge.id}
              className={`p-5 rounded-3xl border-3 transition-all flex flex-col justify-between relative overflow-hidden ${
                isUnlocked
                  ? 'bg-white border-amber-400 shadow-md scale-[1.01]'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              {isUnlocked && (
                <div className="absolute top-3 right-3 bg-emerald-500 text-white rounded-full p-1 shadow-xs">
                  <CheckCircle className="w-4 h-4" />
                </div>
              )}

              <div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-3 shadow-2xs"
                  style={{ backgroundColor: isUnlocked ? `${badge.color}25` : '#e2e8f0' }}
                >
                  {badge.icon}
                </div>
                <h3 className="text-base font-black text-slate-900">{badge.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{badge.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-black">
                <span className={isUnlocked ? 'text-amber-600' : 'text-slate-400'}>
                  ⭐ {badge.minStars} sterren nodig
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  isUnlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {isUnlocked ? 'Ontgrendeld! 🎉' : 'Nog niet'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

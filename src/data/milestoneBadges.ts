export interface MilestoneBadge {
  id: string;
  minStars: number;
  starRequirement: number;
  title: string;
  icon: string;
  iconEmoji: string;
  description: string;
  cheerMessage: string;
  color: string;
}

export const MILESTONE_BADGES: MilestoneBadge[] = [
  { id: 'mb_5', minStars: 5, starRequirement: 5, title: 'Sterren Starter', icon: '⭐', iconEmoji: '⭐', description: 'De eerste 5 sterren verdiend!', cheerMessage: 'Geweldig begin!', color: '#f59e0b' },
  { id: 'mb_10', minStars: 10, starRequirement: 10, title: 'Hulpheld', icon: '🦸', iconEmoji: '🦸', description: '10 sterren! Echte gezinssuperheld!', cheerMessage: 'Superheld in huis!', color: '#3b82f6' },
  { id: 'mb_25', minStars: 25, starRequirement: 25, title: 'Klusjes Kampioen', icon: '🏆', iconEmoji: '🏆', description: 'Al 25 sterren verzameld!', cheerMessage: 'Een echte kampioen!', color: '#10b981' },
  { id: 'mb_50', minStars: 50, starRequirement: 50, title: 'Gouden Speurneus', icon: '🥇', iconEmoji: '🥇', description: '50 sterren mijlpaal bereikt!', cheerMessage: 'Goud waard!', color: '#eab308' },
  { id: 'mb_75', minStars: 75, starRequirement: 75, title: 'Raket Versneller', icon: '🚀', iconEmoji: '🚀', description: '75 sterren! Supersnel bezig!', cheerMessage: 'Als een raket vooruit!', color: '#8b5cf6' },
  { id: 'mb_100', minStars: 100, starRequirement: 100, title: 'Legendarische Topper', icon: '👑', iconEmoji: '👑', description: '100 sterren! De absolute kroon!', cheerMessage: 'Koning van de weekplanner!', color: '#ec4899' },
];

export function getNextMilestone(currentStars: number): {
  current: MilestoneBadge | null;
  next: MilestoneBadge | null;
  nextBadge: MilestoneBadge | null;
  starsNeeded: number;
  progressPercent: number;
} {
  const earned = MILESTONE_BADGES.filter((b) => currentStars >= b.starRequirement);
  const current = earned.length > 0 ? earned[earned.length - 1] : null;
  const next = MILESTONE_BADGES.find((b) => currentStars < b.starRequirement) || null;
  const nextBadge = next;
  const prevRequirement = current ? current.starRequirement : 0;
  const nextRequirement = next ? next.starRequirement : prevRequirement + 10;
  const starsNeeded = next ? Math.max(0, next.starRequirement - currentStars) : 0;
  const range = nextRequirement - prevRequirement;
  const progress = currentStars - prevRequirement;
  const progressPercent = range > 0 ? Math.min(100, Math.max(0, Math.round((progress / range) * 100))) : 100;

  return { current, next, nextBadge, starsNeeded, progressPercent };
}

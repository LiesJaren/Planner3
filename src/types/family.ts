export type Role = 'ouder' | 'kind';

export type TimeOfDay = 'ochtend' | 'middag' | 'avond';

export interface FamilyMember {
  id: string;
  name: string;
  role: Role;
  color: string;
  avatar: string;
  age?: number;
  stars?: number;
  rewardsEarned?: number;
}

export interface AgendaEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime?: string; // HH:MM
  time?: string;
  memberId?: string;
  memberIds: string[];
  timeOfDay?: TimeOfDay;
  icon?: string;
  iconId?: string;
  iconEmoji?: string;
  iconLabel?: string;
  iconImageDataUrl?: string;
  iconImageUrl?: string;
  category?: string;
  location?: string;
  notes?: string;
  completed?: boolean;
  isRoutine?: boolean;
  routineId?: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: number | string;
  unit?: string;
  category?: string;
  checked: boolean;
  icon?: string;
}

export interface Reward {
  id: string;
  title: string;
  icon?: string;
  emoji?: string;
  starCost?: number;
  starsCost?: number;
  targetMemberId?: string;
  approvedBy?: string;
  claimedBy?: string;
  claimedAt?: number;
  redeemedAt?: number;
  redeemedBy?: string;
  status?: 'beschikbaar' | 'aangevraagd' | 'ingewisseld' | 'available' | 'claimed' | 'redeemed' | string;
  createdAt?: number | string;
  description?: string;
}

export interface RoutineActivity {
  id: string;
  title: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  timeOfDay?: TimeOfDay;
  notes?: string;
  icon?: string;
  iconId?: string;
  iconEmoji?: string;
  iconLabel?: string;
  iconImageDataUrl?: string;
  iconImageUrl?: string;
  category?: string;
  targetMemberId?: string;
  order?: number;
  isRoutine?: boolean;
}

export interface RoutineTemplate {
  id: string;
  title?: string;
  name?: string;
  icon?: string;
  iconId?: string;
  iconImageDataUrl?: string;
  iconImageUrl?: string;
  emoji?: string;
  category?: string;
  description?: string;
  dagdeel?: TimeOfDay;
  isCustom?: boolean;
  suggestedDays?: number[] | string;
  targetMemberRole?: string;
  activities: RoutineActivity[];
}

export type IconCategory =
  | 'sport'
  | 'school'
  | 'eten'
  | 'muziek'
  | 'creatief'
  | 'club'
  | 'zwemmen'
  | 'dieren'
  | 'feest'
  | 'zorg'
  | 'buiten'
  | 'techniek'
  | 'huishoud'
  | 'vakantie'
  | 'dagelijks'
  | string;

export interface IconCategoryMeta {
  id: string;
  label?: string;
  name: string;
  icon?: string;
  emoji?: string;
  color?: string;
  description?: string;
  isCustom?: boolean;
}

export interface ActivityIcon {
  id: string;
  label: string;
  emoji: string;
  category: IconCategory;
  categoryLabel?: string;
  color?: string;
  suggestedColor?: string;
  tags?: string[];
  reasoning?: string;
  imageDataUrl?: string;
  imageUrl?: string;
  isCustom?: boolean;
}

import { ActivityIcon, IconCategoryMeta } from '../types/family';

export const ICON_CATEGORIES: IconCategoryMeta[] = [
  { id: 'sport', label: 'Sport & Beweging', name: 'Sport & Beweging', icon: '⚽', emoji: '⚽', color: '#3b82f6', isCustom: false },
  { id: 'school', label: 'School & Leren', name: 'School & Leren', icon: '🎒', emoji: '🎒', color: '#10b981', isCustom: false },
  { id: 'eten', label: 'Eten & Drinken', name: 'Eten & Drinken', icon: '🍽️', emoji: '🍽️', color: '#f59e0b', isCustom: false },
  { id: 'muziek', label: 'Muziek & Dans', name: 'Muziek & Dans', icon: '🎵', emoji: '🎵', color: '#8b5cf6', isCustom: false },
  { id: 'creatief', label: 'Creatief & Knutselen', name: 'Creatief & Knutselen', icon: '🎨', emoji: '🎨', color: '#ec4899', isCustom: false },
  { id: 'club', label: 'Club & Hobby', name: 'Club & Hobby', icon: '🏕️', emoji: '🏕️', color: '#06b6d4', isCustom: false },
  { id: 'zwemmen', label: 'Zwemmen & Water', name: 'Zwemmen & Water', icon: '🏊', emoji: '🏊', color: '#0284c7', isCustom: false },
  { id: 'dieren', label: 'Dieren & Natuur', name: 'Dieren & Natuur', icon: '🐾', emoji: '🐾', color: '#84cc16', isCustom: false },
  { id: 'feest', label: 'Feest & Uitje', name: 'Feest & Uitje', icon: '🎉', emoji: '🎉', color: '#f43f5e', isCustom: false },
  { id: 'zorg', label: 'Zorg & Gezondheid', name: 'Zorg & Gezondheid', icon: '🩺', emoji: '🩺', color: '#ef4444', isCustom: false },
  { id: 'buiten', label: 'Buiten Spelen', name: 'Buiten Spelen', icon: '🌳', emoji: '🌳', color: '#10b981', isCustom: false },
  { id: 'techniek', label: 'Techniek & Games', name: 'Techniek & Games', icon: '🎮', emoji: '🎮', color: '#6366f1', isCustom: false },
  { id: 'huishoud', label: 'Huishoud & Helpen', name: 'Huishoud & Helpen', icon: '🧹', emoji: '🧹', color: '#64748b', isCustom: false },
  { id: 'vakantie', label: 'Vakantie & Reis', name: 'Vakantie & Reis', icon: '✈️', emoji: '✈️', color: '#eab308', isCustom: false },
  { id: 'dagelijks', label: 'Dagritme & Slapen', name: 'Dagritme & Slapen', icon: '☀️', emoji: '☀️', color: '#f97316', isCustom: false },
];

export const POPULAR_CATEGORY_TAGS: string[] = [
  'Sport',
  'School',
  'Eten',
  'Muziek',
  'Creatief',
  'Club',
  'Zwemmen',
  'Dieren',
  'Feest',
  'Zorg',
  'Buiten',
  'Techniek',
  'Huishoud',
  'Vakantie',
  'Dagelijks',
  'Wekelijks',
  'Weekend',
  'Ochtend',
  'Avond',
];

export const ACTIVITY_ICONS: ActivityIcon[] = [
  // School & Routine
  { id: 'schooltas', label: 'Naar School', emoji: '🎒', category: 'school', categoryLabel: 'School & Leren', color: '#3b82f6', tags: ['School', 'Leren'] },
  { id: 'schoolbus', label: 'Schoolbus', emoji: '🚌', category: 'school', categoryLabel: 'School & Leren', color: '#f59e0b', tags: ['School', 'Vervoer'] },
  { id: 'huiswerk', label: 'Huiswerk & Lezen', emoji: '📚', category: 'school', categoryLabel: 'School & Leren', color: '#8b5cf6', tags: ['School', 'Lezen'] },
  { id: 'tandenpoetsen', label: 'Tanden Poetsen', emoji: '🪥', category: 'dagelijks', categoryLabel: 'Dagritme & Slapen', color: '#06b6d4', tags: ['Dagelijks', 'Routine'] },
  { id: 'aankleden', label: 'Aankleden & Schoenen', emoji: '👕', category: 'dagelijks', categoryLabel: 'Dagritme & Slapen', color: '#10b981', tags: ['Dagelijks', 'Routine'] },
  { id: 'slapen', label: 'Naar Bed & Slapen', emoji: '🌙', category: 'dagelijks', categoryLabel: 'Dagritme & Slapen', color: '#6366f1', tags: ['Dagelijks', 'Bedtijd'] },
  { id: 'ontbijt', label: 'Ontbijten', emoji: '🥣', category: 'eten', categoryLabel: 'Eten & Drinken', color: '#f59e0b', tags: ['Eten', 'Ochtend'] },
  { id: 'lunch', label: 'Middagmaal', emoji: '🥪', category: 'eten', categoryLabel: 'Eten & Drinken', color: '#f97316', tags: ['Eten', 'Middag'] },
  { id: 'avondeten', label: 'Gezinsdiner', emoji: '🍽️', category: 'eten', categoryLabel: 'Eten & Drinken', color: '#ef4444', tags: ['Eten', 'Avond'] },
  { id: 'pannenkoek', label: 'Pannenkoeken Bakken', emoji: '🥞', category: 'eten', categoryLabel: 'Eten & Drinken', color: '#f59e0b', tags: ['Eten', 'Feest'] },

  // Sport
  { id: 'voetbal', label: 'Voetbaltraining', emoji: '⚽', category: 'sport', categoryLabel: 'Sport & Beweging', color: '#10b981', tags: ['Sport', 'Wekelijks'] },
  { id: 'zwemles', label: 'Zwemles', emoji: '🏊', category: 'zwemmen', categoryLabel: 'Zwemmen & Water', color: '#0284c7', tags: ['Sport', 'Zwemmen'] },
  { id: 'turnen', label: 'Turnen / Gym', emoji: '🤸', category: 'sport', categoryLabel: 'Sport & Beweging', color: '#ec4899', tags: ['Sport', 'Bewegen'] },
  { id: 'judo', label: 'Judo Training', emoji: '🥋', category: 'sport', categoryLabel: 'Sport & Beweging', color: '#3b82f6', tags: ['Sport', 'Zelfverdediging'] },
  { id: 'fietsen', label: 'Fietsen', emoji: '🚴', category: 'sport', categoryLabel: 'Sport & Beweging', color: '#059669', tags: ['Sport', 'Buiten'] },
  { id: 'paardrijden', label: 'Paardrijden Manege', emoji: '🐴', category: 'sport', categoryLabel: 'Sport & Beweging', color: '#d97706', tags: ['Sport', 'Dieren'] },
  { id: 'basketbal', label: 'Basketbal', emoji: '🏀', category: 'sport', categoryLabel: 'Sport & Beweging', color: '#ea580c', tags: ['Sport'] },
  { id: 'schaatsen', label: 'Schaatsen', emoji: '⛸️', category: 'sport', categoryLabel: 'Sport & Beweging', color: '#0ea5e9', tags: ['Sport', 'Winter'] },

  // Muziek & Dans
  { id: 'gitaar', label: 'Gitaarles', emoji: '🎸', category: 'muziek', categoryLabel: 'Muziek & Dans', color: '#ec4899', tags: ['Muziek', 'Les'] },
  { id: 'piano', label: 'Pianoles', emoji: '🎹', category: 'muziek', categoryLabel: 'Muziek & Dans', color: '#8b5cf6', tags: ['Muziek', 'Les'] },
  { id: 'zingen', label: 'Zangles / Koor', emoji: '🎤', category: 'muziek', categoryLabel: 'Muziek & Dans', color: '#f43f5e', tags: ['Muziek'] },
  { id: 'dansles', label: 'Dansles / Ballet', emoji: '🩰', category: 'muziek', categoryLabel: 'Muziek & Dans', color: '#f472b6', tags: ['Dans', 'Bewegen'] },

  // Creatief & Spelen
  { id: 'knutselen', label: 'Knutselen & Tekenen', emoji: '🎨', category: 'creatief', categoryLabel: 'Creatief & Knutselen', color: '#8b5cf6', tags: ['Creatief', 'Knutselen'] },
  { id: 'lego', label: 'Lego & Bouwen', emoji: '🧱', category: 'creatief', categoryLabel: 'Creatief & Knutselen', color: '#ef4444', tags: ['Spelen', 'Bouwen'] },
  { id: 'gamen', label: 'Gamen / Schermtijd', emoji: '🎮', category: 'techniek', categoryLabel: 'Techniek & Games', color: '#6366f1', tags: ['Schermtijd', 'Ontspanning'] },
  { id: 'speeltuin', label: 'Buiten Speeltuin', emoji: '🛝', category: 'buiten', categoryLabel: 'Buiten Spelen', color: '#10b981', tags: ['Buiten', 'Spelen'] },
  { id: 'scouting', label: 'Scouting / Jeugdbeweging', emoji: '🏕️', category: 'club', categoryLabel: 'Club & Hobby', color: '#059669', tags: ['Club', 'Buiten'] },

  // Gezondheid & Zorg
  { id: 'tandarts', label: 'Tandarts Controle', emoji: '🦷', category: 'zorg', categoryLabel: 'Zorg & Gezondheid', color: '#0284c7', tags: ['Zorg', 'Gezondheid'] },
  { id: 'dokter', label: 'Huisarts / Dokter', emoji: '🩺', category: 'zorg', categoryLabel: 'Zorg & Gezondheid', color: '#ef4444', tags: ['Zorg'] },
  { id: 'kapper', label: 'Naar de Kapper', emoji: '✂️', category: 'zorg', categoryLabel: 'Zorg & Gezondheid', color: '#f59e0b', tags: ['Zorg', 'Uiterlijk'] },
  { id: 'badje', label: 'In Bad / Douchen', emoji: '🛁', category: 'dagelijks', categoryLabel: 'Dagritme & Slapen', color: '#38bdf8', tags: ['Dagelijks', 'Verzorging'] },

  // Feest & Familie
  { id: 'verjaardag', label: 'Verjaardagsfeestje', emoji: '🎂', category: 'feest', categoryLabel: 'Feest & Uitje', color: '#ec4899', tags: ['Feest', 'Jarig'] },
  { id: 'familie', label: 'Opa en Oma op Bezoek', emoji: '👵', category: 'feest', categoryLabel: 'Feest & Uitje', color: '#a855f7', tags: ['Familie', 'Gezellig'] },
  { id: 'bioscoop', label: 'Bioscoop / Film', emoji: '🍿', category: 'feest', categoryLabel: 'Feest & Uitje', color: '#eab308', tags: ['Uitje', 'Film'] },
  { id: 'boodschappen', label: 'Boodschappen Doen', emoji: '🛒', category: 'eten', categoryLabel: 'Eten & Drinken', color: '#10b981', tags: ['Gezin', 'Winkel'] },
  { id: 'vakantie', label: 'Op Vakantie!', emoji: '✈️', category: 'vakantie', categoryLabel: 'Vakantie & Reis', color: '#0ea5e9', tags: ['Vakantie', 'Reizen'] },
];

export function getAllCategories(customCategories: IconCategoryMeta[] = []): IconCategoryMeta[] {
  const merged = [...ICON_CATEGORIES];
  customCategories.forEach((cc) => {
    if (!merged.some((m) => m.id === cc.id)) {
      merged.push({
        ...cc,
        name: cc.name || cc.label || 'Aangepast',
        emoji: cc.emoji || cc.icon || '📁',
        isCustom: true,
      });
    }
  });
  return merged;
}

export function getIconById(id: string, customIcons: ActivityIcon[] = []): ActivityIcon {
  return (
    customIcons.find((icon) => icon.id === id) ||
    ACTIVITY_ICONS.find((icon) => icon.id === id) ||
    ACTIVITY_ICONS[0]
  );
}

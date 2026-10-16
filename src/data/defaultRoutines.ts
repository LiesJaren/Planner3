import { RoutineTemplate } from '../types/family';

export const DEFAULT_ROUTINES: RoutineTemplate[] = [
  {
    id: 'ochtend_schooldag',
    title: 'Ochtendroutine Schooldag',
    icon: '🎒',
    category: 'school',
    description: 'Opstaan, ontbijten, tanden poetsen, aankleden en tas klaarmaken',
    dagdeel: 'ochtend',
    activities: [
      { id: 'act_1', title: 'Opstaan & Wassen', time: '07:15', icon: '☀️', iconEmoji: '☀️', iconLabel: 'Opstaan', category: 'dagelijks' },
      { id: 'act_2', title: 'Ontbijten aan tafel', time: '07:30', icon: '🥣', iconEmoji: '🥣', iconLabel: 'Ontbijt', category: 'eten' },
      { id: 'act_3', title: 'Tanden poetsen', time: '07:50', icon: '🪥', iconEmoji: '🪥', iconLabel: 'Tanden poetsen', category: 'dagelijks' },
      { id: 'act_4', title: 'Aankleden & Schoenen', time: '08:00', icon: '👕', iconEmoji: '👕', iconLabel: 'Aankleden', category: 'dagelijks' },
      { id: 'act_5', title: 'Schooltas klaarmaken', time: '08:15', icon: '🎒', iconEmoji: '🎒', iconLabel: 'Schooltas', category: 'school' },
    ],
  },
  {
    id: 'avond_bedtijd',
    title: 'Avondroutine & Bedtijd',
    icon: '🌙',
    category: 'dagelijks',
    description: 'Gezinsdiner, speelgoed opruimen, badje en verhaaltje voor het slapen gaan',
    dagdeel: 'avond',
    activities: [
      { id: 'act_6', title: 'Avondeten met gezin', time: '17:45', icon: '🍽️', iconEmoji: '🍽️', iconLabel: 'Avondeten', category: 'eten' },
      { id: 'act_7', title: 'Speelgoed opruimen', time: '18:45', icon: '🧹', iconEmoji: '🧹', iconLabel: 'Opruimen', category: 'huishoud' },
      { id: 'act_8', title: 'In bad of douchen', time: '19:00', icon: '🛁', iconEmoji: '🛁', iconLabel: 'In bad', category: 'dagelijks' },
      { id: 'act_9', title: 'Pyjama & Tandenpoetsen', time: '19:25', icon: '🪥', iconEmoji: '🪥', iconLabel: 'Tanden poetsen', category: 'dagelijks' },
      { id: 'act_10', title: 'Voorlezen & Slapen', time: '19:40', icon: '📖', iconEmoji: '📖', iconLabel: 'Voorlezen', category: 'dagelijks' },
    ],
  },
  {
    id: 'woensdagmiddag_club',
    title: 'Woensdagmiddag Vrij & Sport',
    icon: '🎈',
    category: 'club',
    description: 'Vrije middag met buitenspelen, zwemles of sporttraining',
    dagdeel: 'middag',
    activities: [
      { id: 'act_11', title: 'Gezellige Lunch', time: '12:30', icon: '🥪', iconEmoji: '🥪', iconLabel: 'Lunch', category: 'eten' },
      { id: 'act_12', title: 'Vrij spelen / Knutselen', time: '13:15', icon: '🎨', iconEmoji: '🎨', iconLabel: 'Knutselen', category: 'creatief' },
      { id: 'act_13', title: 'Zwemles / Sportclub', time: '15:00', icon: '🏊', iconEmoji: '🏊', iconLabel: 'Zwemles', category: 'sport' },
      { id: 'act_14', title: 'Tussendoortje & Fruit', time: '16:30', icon: '🍎', iconEmoji: '🍎', iconLabel: 'Fruit', category: 'eten' },
    ],
  },
  {
    id: 'weekend_gezinsdag',
    title: 'Weekend Gezinsdag',
    icon: '🥞',
    category: 'feest',
    description: 'Lekker rustig wakker worden, pannenkoeken en een gezellig uitje',
    dagdeel: 'ochtend',
    activities: [
      { id: 'act_15', title: 'Pannenkoeken ontbijt', time: '09:00', icon: '🥞', iconEmoji: '🥞', iconLabel: 'Pannenkoeken', category: 'eten' },
      { id: 'act_16', title: 'Buitenactiviteit / Wandelen', time: '10:30', icon: '🌳', iconEmoji: '🌳', iconLabel: 'Wandelen', category: 'buiten' },
    ],
  },
];

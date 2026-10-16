import React, { useState } from 'react';
import {
  X,
  Wand2,
  Palette,
  Sparkles,
  Check,
  Loader2,
  FolderPlus,
  Tag,
  Plus,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ActivityIcon, IconCategory, IconCategoryMeta } from '../types/family';
import { ICON_CATEGORIES, getAllCategories, POPULAR_CATEGORY_TAGS } from '../data/iconLibrary';
import { soundEffects } from '../utils/audio';
import { IconVisual } from './IconVisual';

interface CreateIconModalProps {
  isOpen: boolean;
  customCategories?: IconCategoryMeta[];
  onSaveIcon: (newIcon: ActivityIcon) => void;
  onSaveCategory?: (newCategory: IconCategoryMeta) => void;
  onClose: () => void;
  initialTarget?: 'activiteit' | 'categorie';
  initialCategory?: string;
}

const EMOJI_SETS_BY_CATEGORY: Record<string, string[]> = {
  sport: ['⚽', '🏀', '🎾', '🏐', '🏑', '🏸', '🏓', '🥊', '🥋', '🛹', '🛼', '⛸️', '🤸', '🧗', '🏄', '🏃', '🚴', '🏊', '🐴', '🩰', '🥇', '🏹', '🎳'],
  school: ['🎒', '🏫', '📚', '📖', '📝', '✏️', '✍️', '📐', '📏', '🔢', '🏛️', '🔬', '🔭', '🧪', '🚌', '🧩', '🗣️', '💻', '💡', '🎓'],
  eten: ['🍽️', '🥣', '🥪', '🥞', '🍕', '🍔', '🍟', '🌮', '🍝', '🍣', '🍎', '🍌', '🍓', '🍇', '🥑', '🥕', '🍦', '🍩', '🍪', '🍰', '🍿', '🧋', '🧃', '🍢', '🛒'],
  muziek: ['🎵', '🎶', '🎸', '🎹', '🥁', '🎺', '🎷', '🎻', '🎤', '🎧', '🪗', '🪕', '📻'],
  creatief: ['🎨', '🖌️', '🖍️', '✂️', '🧱', '🏺', '🎭', '📷', '🧵', '🧶', '✨', '🌈'],
  club: ['🏕️', '🎲', '🧩', '🧸', '🤝', '🚩', '🎪', '🎯', '🎳', '🪄'],
  zwemmen: ['🏊', '🏊‍♂️', '🏊‍♀️', '🌊', '🤿', '🩱', '🩲', '🎈', '🏖️'],
  dieren: ['🐕', '🐈', '🐇', '🐹', '🐴', '🐎', '🐐', '🐑', '🐄', '🐖', '🦒', '🦁', '🐼', '🦊', '🐻', '🐸', '🦆', '🦉', '🐠', '🐾'],
  feest: ['🎉', '🎂', '🎈', '🎁', '🎪', '🎡', '🎢', '🍿', '🪅', '🎆', '🥳', '👑'],
  zorg: ['🩺', '🦷', '🩹', '💊', '✂️', '👓', '👵', '👴', '❤️', '🛁', '🪥', '💆'],
  buiten: ['🌳', '🌲', '🌿', '🌱', '🛝', '🏖️', '⛰️', '⛺', '🧺', '🪁', '🎣', '☀️', '🌻', '🌸'],
  techniek: ['🎮', '🕹️', '📱', '💻', '🤖', '🚀', '👾', '📺'],
  huishoud: ['🧹', '🧼', '🧺', '🪴', '🥣', '🗑️', '🛏️', '🧽', '🚪', '🪟'],
  vakantie: ['✈️', '🚗', '🚆', '🚢', '🏖️', '🏨', '⛺', '🗺️', '🧳', '🏛️'],
  dagelijks: ['🛏️', '⏰', '😴', '👕', '🪥', '🛁', '🧸', '☀️', '🌙', '⭐'],
};

const ALL_POPULAR_EMOJIS = [
  '⚽', '🏀', '🎾', '🏊', '🥋', '🩰', '🐴', '🛹', '⛸️', '🧗',
  '🎒', '📚', '📝', '🏫', '🎨', '✂️', '🧱', '🎸', '🎹', '🥁',
  '🎤', '🍽️', '🥞', '🍕', '🍎', '🍦', '🍪', '🐕', '🐈', '🐾',
  '🎉', '🎂', '🎁', '🍿', '🎡', '🩺', '🦷', '🩹', '👵', '🛝',
  '🏖️', '🌲', '⛺', '🎮', '📱', '🤖', '🧹', '🪴', '✈️', '🚗',
  '🛏️', '⏰', '🧸', '⭐', '🌈', '☀️', '❤️', '✨'
];

const COLOR_PALETTE = [
  '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6',
  '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#d97706', '#a855f7', '#15803d', '#e11d48'
];

const PRESET_SUBTAGS = [
  'Wekelijks',
  'Buiten',
  'Bal',
  'Water',
  'Les',
  'Rust',
  'Creatief',
  'Samen',
  'Klusje',
  'Gezellig',
  'Spelen',
  'Gezond'
];

const LOCAL_FALLBACKS: Record<string, Partial<ActivityIcon>> = {
  paard: { label: 'Paardrijles', emoji: '🐴', category: 'sport', tags: ['Sport', 'Dieren', 'Wekelijks'], suggestedColor: '#d97706', reasoning: 'Paarden zijn direct herkenbaar voor jonge kinderen.' },
  judo: { label: 'Judoles', emoji: '🥋', category: 'sport', tags: ['Sport', 'Wekelijks'], suggestedColor: '#3b82f6', reasoning: 'Het judopak en de band zijn heel visueel.' },
  karate: { label: 'Karateles', emoji: '🥋', category: 'sport', tags: ['Sport', 'Wekelijks'], suggestedColor: '#ef4444', reasoning: 'Herkenbaar vechtsport icoon.' },
  gitaar: { label: 'Gitaarles', emoji: '🎸', category: 'muziek', tags: ['Muziek', 'Instrument', 'Wekelijks'], suggestedColor: '#ec4899', reasoning: 'Muziekinstrumenten zijn leuk en herkenbaar.' },
  piano: { label: 'Pianoles', emoji: '🎹', category: 'muziek', tags: ['Muziek', 'Instrument', 'Wekelijks'], suggestedColor: '#8b5cf6', reasoning: 'Pianotoetsen spreken tot de verbeelding.' },
  drum: { label: 'Drumles', emoji: '🥁', category: 'muziek', tags: ['Muziek', 'Ritme'], suggestedColor: '#f97316', reasoning: 'Trommels zijn heel leuk en ritmisch!' },
  zwemmen: { label: 'Zwemles', emoji: '🏊', category: 'zwemmen', tags: ['Water', 'Sport', 'Wekelijks'], suggestedColor: '#0284c7', reasoning: 'Water en zwemmen voor diploma.' },
  bibliotheek: { label: 'Bibliotheek', emoji: '🏛️', category: 'school', tags: ['School', 'Boeken'], suggestedColor: '#10b981', reasoning: 'Boekenstapels zijn duidelijk voor kleuters en groep 3.' },
  trampoline: { label: 'Trampolinepark', emoji: '🤸', category: 'club', tags: ['Club', 'Springen'], suggestedColor: '#f97316', reasoning: 'Lekker springen en bewegen!' },
  scouting: { label: 'Scouting / Chiro', emoji: '🏕️', category: 'club', tags: ['Club', 'Buiten', 'Wekelijks'], suggestedColor: '#059669', reasoning: 'Avontuur en tenten in het weekend.' },
  lego: { label: 'Lego bouwen', emoji: '🧱', category: 'creatief', tags: ['Creatief', 'Spelen'], suggestedColor: '#ef4444', reasoning: 'Blokjes zijn heel herkenbaar!' },
  hond: { label: 'Hond uitlaten', emoji: '🐕', category: 'dieren', tags: ['Dieren', 'Buiten'], suggestedColor: '#d97706', reasoning: 'Leuk rondje met de trouwe viervoeter.' },
  strand: { label: 'Strand & Zee', emoji: '🏖️', category: 'buiten', tags: ['Buiten', 'Zomer', 'Water'], suggestedColor: '#0284c7', reasoning: 'Zon en strand.' },
  tent: { label: 'Kamperen in tent', emoji: '⛺', category: 'vakantie', tags: ['Uitje', 'Vakantie'], suggestedColor: '#15803d', reasoning: 'Avontuur buiten!' },
  game: { label: 'Gametijd', emoji: '🎮', category: 'techniek', tags: ['Gamen', 'Spelen'], suggestedColor: '#8b5cf6', reasoning: 'Spelletjescontroller voor digitale tijd.' },
};

export const CreateIconModal: React.FC<CreateIconModalProps> = ({
  isOpen,
  customCategories = [],
  onSaveIcon,
  onSaveCategory,
  onClose,
  initialTarget = 'activiteit',
  initialCategory,
}) => {
  // Main Tab: 'activiteit' vs 'categorie'
  const [targetType, setTargetType] = useState<'activiteit' | 'categorie'>(initialTarget);

  // Sub-mode for activity icon: AI vs Manual
  const [activityMode, setActivityMode] = useState<'ai' | 'handmatig'>('ai');

  // Activity Icon States
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const allAvailableCategories = getAllCategories(customCategories);

  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('⭐');
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [category, setCategory] = useState<IconCategory>(() => {
    return initialCategory || 'sport';
  });
  const [selectedTags, setSelectedTags] = useState<string[]>(['Sport']);
  const [newTagInput, setNewTagInput] = useState('');
  const [suggestedColor, setSuggestedColor] = useState('#3b82f6');
  const [reasoning, setReasoning] = useState<string | null>(null);

  // Custom Category Creation States
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('📁');
  const [newCatColor, setNewCatColor] = useState('#8b5cf6');
  const [newCatDescription, setNewCatDescription] = useState('');

  if (!isOpen) return null;

  // Handler for category tag click
  const handleSelectCategoryTag = (catMeta: IconCategoryMeta) => {
    soundEffects.playTap();
    setCategory(catMeta.id);
    if (catMeta.color) {
      setSuggestedColor(catMeta.color);
    }
    // Set appropriate primary tag
    const mainTagName = catMeta.name.split(' ')[0].replace('&', '').trim();
    if (mainTagName && !selectedTags.includes(mainTagName)) {
      setSelectedTags([mainTagName, ...selectedTags.filter((t) => t !== mainTagName)]);
    }
  };

  const handleToggleSubtag = (tag: string) => {
    soundEffects.playTap();
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddNewTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = newTagInput.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      soundEffects.playTap();
      setSelectedTags([...selectedTags, trimmed]);
      setNewTagInput('');
    }
  };

  const handleGenerateAI = async () => {
    if (!prompt.trim()) return;

    soundEffects.playTap();
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const res = await fetch('/api/generate-icon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!res.ok) {
        throw new Error('Server kon geen icoon genereren');
      }

      const data = await res.json();
      if (data.label && data.emoji) {
        setLabel(data.label);
        setEmoji(data.emoji);
        setImageDataUrl(undefined);
        if (data.category) setCategory(data.category);
        if (data.suggestedColor) setSuggestedColor(data.suggestedColor);
        if (Array.isArray(data.tags) && data.tags.length > 0) {
          setSelectedTags(data.tags);
        }
        setReasoning(data.reasoning || null);
        soundEffects.playSuccessChime();
      } else {
        throw new Error('Onverwacht antwoordformaat');
      }
    } catch {
      // Fallback heuristic matching
      const lower = prompt.toLowerCase();
      const matchedKey = Object.keys(LOCAL_FALLBACKS).find((k) => lower.includes(k));
      if (matchedKey) {
        const fb = LOCAL_FALLBACKS[matchedKey];
        setLabel(fb.label || prompt.trim());
        setEmoji(fb.emoji || '⭐');
        setImageDataUrl(undefined);
        setCategory(fb.category || 'sport');
        setSuggestedColor(fb.suggestedColor || '#f59e0b');
        setSelectedTags(fb.tags || ['Sport', 'Wekelijks']);
        setReasoning(fb.reasoning || 'Speciaal samengesteld voor jonge gezinsleden.');
      } else {
        setLabel(prompt.trim());
        setEmoji('🌟');
        setImageDataUrl(undefined);
        setCategory('sport');
        setSuggestedColor('#3b82f6');
        setSelectedTags(['Activiteit', 'Wekelijks']);
        setReasoning('Kleurrijk en direct herkenbaar voor de familie agenda!');
      }
      soundEffects.playSuccessChime();
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePasteIcon = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const imageItem = Array.from(e.clipboardData.items).find((item) =>
      item.type.startsWith('image/')
    );
    if (!imageItem) return;

    e.preventDefault();
    const imageFile = imageItem.getAsFile();
    if (!imageFile) {
      setPasteError('De afbeelding kon niet uit het klembord worden gelezen.');
      return;
    }

    try {
      const bitmap = await createImageBitmap(imageFile);
      try {
        const canvas = document.createElement('canvas');
        const maxDimension = 192;
        const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas is niet beschikbaar');

        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const compressedImage = canvas.toDataURL('image/webp', 0.75);
        if (compressedImage.length > 300_000) {
          throw new Error('De afbeelding is nog te groot na verkleinen');
        }

        setImageDataUrl(compressedImage);
        setPasteError(null);
      } finally {
        bitmap.close();
      }
    } catch {
      setPasteError('Deze afbeelding kon niet worden verwerkt. Probeer een andere afbeelding.');
    }
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    soundEffects.playSuccessChime();
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: [suggestedColor, '#f59e0b', '#10b981', '#3b82f6'],
    });

    const categoryObj = allAvailableCategories.find((c) => c.id === category);
    const newIcon: ActivityIcon = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: label.trim(),
      emoji,
      imageDataUrl,
      category,
      categoryLabel: categoryObj ? categoryObj.name : 'Aangepast',
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      suggestedColor,
      isCustom: true,
      reasoning: reasoning || undefined,
    };

    onSaveIcon(newIcon);
    onClose();
  };

  const handleSaveNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    soundEffects.playSuccessChime();
    confetti({
      particleCount: 60,
      spread: 80,
      origin: { y: 0.6 },
      colors: [newCatColor, '#ec4899', '#8b5cf6', '#3b82f6'],
    });

    const slug = newCatName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');
    const newCategoryMeta: IconCategoryMeta = {
      id: `cat_${slug}_${Date.now().toString(36)}`,
      name: newCatName.trim(),
      emoji: newCatEmoji || '📁',
      color: newCatColor,
      description: newCatDescription.trim() || undefined,
      isCustom: true,
    };

    if (onSaveCategory) {
      onSaveCategory(newCategoryMeta);
    }

    // Automatically set the new category as active in activity view
    setCategory(newCategoryMeta.id);
    setSuggestedColor(newCatColor);
    setTargetType('activiteit');
  };

  const currentCategoryMeta = allAvailableCategories.find((c) => c.id === category);

  // Emojis for the currently chosen category
  const categorySpecificEmojis = EMOJI_SETS_BY_CATEGORY[category] || ALL_POPULAR_EMOJIS;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-amber-300 my-4 sm:my-8 flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-200 via-orange-100 to-amber-100 border-b border-amber-300 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">
                Iconen & Categorieën Beheren
              </h2>
              <p className="text-xs text-slate-600">
                Ontwerp eigen iconen voor activiteiten of creëer een nieuwe categorie
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

        {/* Primary Tabs: Activiteit Icoon vs Nieuwe Categorie */}
        <div className="px-6 pt-3 bg-amber-50/50 border-b border-amber-200 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundEffects.playTap();
              setTargetType('activiteit');
            }}
            className={`pb-3 px-3 text-xs sm:text-sm font-black flex items-center gap-2 transition-all border-b-3 ${
              targetType === 'activiteit'
                ? 'border-amber-500 text-amber-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Activiteit Icoon Toevoegen</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playTap();
              setTargetType('categorie');
            }}
            className={`pb-3 px-3 text-xs sm:text-sm font-black flex items-center gap-2 transition-all border-b-3 ${
              targetType === 'categorie'
                ? 'border-amber-500 text-amber-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderPlus className="w-4 h-4 text-purple-500" />
            <span>Nieuwe Categorie Maken</span>
            {customCategories.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-700 font-bold">
                {customCategories.length} eigen
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Activiteit Icoon Ontwerpen / Genereren */}
        {targetType === 'activiteit' && (
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
            {/* Sub Mode Toggle: AI vs Handmatig */}
            <div className="flex items-center justify-between bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  setActivityMode('ai');
                }}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                  activityMode === 'ai'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>AI Icoon Generator</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  setActivityMode('handmatig');
                }}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                  activityMode === 'handmatig'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Zelf Ontwerpen</span>
              </button>
            </div>

            {/* Categorie-tags Balk (Quick Category Tags) */}
            <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-600" />
                  <span>Kies Categorie-Tag:</span>
                </span>
                <span className="text-[11px] font-bold text-amber-800">
                  Actief: {currentCategoryMeta?.name || 'Sport'}
                </span>
              </div>

              {/* Scrollable category tags strip */}
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-0.5">
                {allAvailableCategories.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategoryTag(cat)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all border shrink-0 ${
                        isSelected
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs scale-102'
                          : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300'
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.name.split(' ')[0]}</span>
                      {cat.isCustom && (
                        <span className="text-[9px] px-1 rounded-sm bg-purple-200 text-purple-900 font-bold">
                          Eigen
                        </span>
                      )}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playTap();
                    setTargetType('categorie');
                  }}
                  className="px-2.5 py-1 rounded-xl text-xs font-black text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3 h-3" />
                  <span>Nieuwe Categorie</span>
                </button>
              </div>
            </div>

            {/* AI Generator Box */}
            {activityMode === 'ai' && (
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 space-y-3">
                <label className="block text-xs font-black text-amber-950 uppercase tracking-wider">
                  Welke activiteit wil je toevoegen?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Bijv. Tennisles, Gitaarles, Scouting, Pannenkoeken bakken..."
                    className="flex-1 px-4 py-2.5 rounded-2xl border-2 border-amber-300 bg-white text-sm text-slate-900 focus:outline-hidden focus:border-amber-500 font-medium"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleGenerateAI();
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={isGenerating || !prompt.trim()}
                    onClick={handleGenerateAI}
                    className="px-4 py-2.5 rounded-2xl text-xs font-black bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Genereren...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        <span>Genereer Icoon</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Inspiration Prompt Pills */}
                <div className="flex flex-wrap gap-1.5 items-center pt-1">
                  <span className="text-[11px] font-bold text-amber-800">Suggesties:</span>
                  {[
                    'Tennisles',
                    'Gitaarles',
                    'Scouting kamp',
                    'Zwemdiploma halen',
                    'Paardrijden',
                    'Pannenkoeken',
                    'Dierentuin',
                    'Bibliotheek',
                  ].map((idea) => (
                    <button
                      key={idea}
                      type="button"
                      onClick={() => {
                        setPrompt(idea);
                        soundEffects.playTap();
                      }}
                      className="text-[11px] px-2 py-0.5 rounded-lg bg-white border border-amber-200 text-amber-900 hover:bg-amber-100 font-medium"
                    >
                      {idea}
                    </button>
                  ))}
                </div>

                {generationError && (
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded-xl">
                    {generationError}
                  </p>
                )}
              </div>
            )}

            {/* Live Preview Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 flex flex-col sm:flex-row items-center gap-4">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-md border-3 shrink-0"
                style={{
                  backgroundColor: `${suggestedColor}20`,
                  borderColor: suggestedColor,
                }}
              >
                <IconVisual emoji={emoji || '⭐'} imageDataUrl={imageDataUrl} imageClassName="w-14 h-14 object-contain" />
              </div>

              <div className="flex-1 text-center sm:text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Voorbeeld in de agenda
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {label || 'Jouw nieuwe activiteit'}
                </h3>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap mt-1">
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center gap-1">
                    <span>{currentCategoryMeta?.emoji}</span>
                    <span>{currentCategoryMeta?.name || 'Sport'}</span>
                  </span>
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200"
                    >
                      #{tag}
                    </span>
                  ))}
                  <span
                    className="w-3.5 h-3.5 rounded-full inline-block border border-white shadow-2xs"
                    style={{ backgroundColor: suggestedColor }}
                    title="Themakleur"
                  />
                </div>
                {reasoning && (
                  <p className="text-[11px] text-amber-900 bg-amber-100/70 p-1.5 rounded-xl mt-2 font-medium">
                    💡 <strong>Tip voor kinderen:</strong> {reasoning}
                  </p>
                )}
              </div>
            </div>

            {/* Customization Form */}
            <form onSubmit={handleSaveActivity} className="space-y-4">
              {/* Title / Label */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Naam van de activiteit *
                </label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Bijv. Tennisles of Gitaarles"
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-amber-400 focus:outline-hidden text-sm text-slate-900 font-semibold"
                />
              </div>

              {/* Sub-tags Organization */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Organiseer met Tags (om snel te filteren)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PRESET_SUBTAGS.map((t) => {
                    const isSelected = selectedTags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleToggleSubtag(t)}
                        className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-all border ${
                          isSelected
                            ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {t}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={handleAddNewTag}
                    placeholder="Typ een eigen tag en druk Enter (bijv. Zwemmen, Weekend)"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-amber-400 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewTag}
                    disabled={!newTagInput.trim()}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-xs font-bold text-slate-800 rounded-xl"
                  >
                    Tag Toevoegen
                  </button>
                </div>
              </div>

              {/* Emoji Picker */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Kies een passend icoon / emoji
                  </label>
                  <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                    Gekozen:
                    <IconVisual emoji={emoji} imageDataUrl={imageDataUrl} className="inline-flex w-7 h-7 text-lg" />
                  </span>
                </div>

                <div className="mb-3 rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50 p-3">
                  <label className="block text-xs font-bold text-sky-950 mb-1">
                    Plak hier een emoji of gekopieerde afbeelding
                  </label>
                  <input
                    type="text"
                    value={emoji}
                    onChange={(e) => {
                      setEmoji(e.target.value);
                      setImageDataUrl(undefined);
                      setPasteError(null);
                    }}
                    onPaste={handlePasteIcon}
                    aria-label="Plak een emoji of afbeelding als icoon"
                    placeholder="Klik hier en druk op Ctrl+V"
                    className="w-full px-3 py-2 rounded-xl border border-sky-200 bg-white text-2xl text-slate-900 focus:outline-hidden focus:border-sky-500"
                  />
                  <p className="text-[11px] text-sky-900 mt-1">
                    Zoek een afbeelding op internet, kies met rechts ‘Afbeelding kopiëren’, klik in dit veld en druk op Ctrl+V.
                  </p>
                  {imageDataUrl && (
                    <button
                      type="button"
                      onClick={() => setImageDataUrl(undefined)}
                      className="mt-2 text-xs font-bold text-red-700 hover:text-red-900"
                    >
                      Afbeelding verwijderen
                    </button>
                  )}
                  {pasteError && (
                    <p role="alert" className="mt-2 text-xs font-semibold text-red-700">
                      {pasteError}
                    </p>
                  )}
                </div>

                {/* Category specific emoji shortcuts */}
                <div className="mb-2">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">
                    Passend bij categorie {currentCategoryMeta?.name}:
                  </span>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-200 max-h-24 overflow-y-auto">
                    {categorySpecificEmojis.map((em, idx) => (
                      <button
                        key={`cat-em-${em}-${idx}`}
                        type="button"
                        onClick={() => {
                          soundEffects.playTap();
                          setEmoji(em);
                          setImageDataUrl(undefined);
                        }}
                        className={`w-8 h-8 text-lg rounded-xl flex items-center justify-center transition-all ${
                          emoji === em
                            ? 'bg-amber-400 scale-110 shadow-xs'
                            : 'bg-white hover:bg-slate-200'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Popular general emojis */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">
                    Alle populaire symbolen:
                  </span>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-200 max-h-24 overflow-y-auto">
                    {ALL_POPULAR_EMOJIS.map((em, idx) => (
                      <button
                        key={`pop-em-${em}-${idx}`}
                        type="button"
                        onClick={() => {
                          soundEffects.playTap();
                          setEmoji(em);
                          setImageDataUrl(undefined);
                        }}
                        className={`w-8 h-8 text-lg rounded-xl flex items-center justify-center transition-all ${
                          emoji === em
                            ? 'bg-amber-400 scale-110 shadow-xs'
                            : 'bg-white hover:bg-slate-200'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom emoji or symbol text input */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-semibold whitespace-nowrap">
                    Of typ zelf een emoji/symbool:
                  </span>
                  <input
                    type="text"
                    maxLength={4}
                    value={emoji}
                    onChange={(e) => {
                      setEmoji(e.target.value);
                      setImageDataUrl(undefined);
                    }}
                    className="w-16 px-2 py-1 rounded-xl border-2 border-slate-200 text-center text-lg focus:border-amber-400 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Color selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kleur van het kaartje
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_PALETTE.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => {
                        soundEffects.playTap();
                        setSuggestedColor(col);
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-2xs"
                      style={{ backgroundColor: col }}
                    >
                      {suggestedColor === col && (
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={!label.trim()}
                  className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Icoon Opslaan in Bibliotheek</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Nieuwe Categorie Ontwerpen */}
        {targetType === 'categorie' && (
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200">
              <h3 className="text-sm font-black text-purple-950 flex items-center gap-1.5 mb-1">
                <FolderPlus className="w-4 h-4 text-purple-600" />
                <span>Nieuwe Categorie Ontwerpen</span>
              </h3>
              <p className="text-xs text-purple-900 leading-relaxed">
                Maak een eigen categorie (bijv. "Dansschool", "Jeugdclub", "Geloof & Bezinning", "Hobby's"). 
                Deze categorie verschijnt direct als filter in de agenda en icoonkiezer!
              </p>
            </div>

            {/* Live Preview of Category Badge */}
            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm border-2 shrink-0"
                style={{
                  backgroundColor: `${newCatColor}20`,
                  borderColor: newCatColor,
                }}
              >
                <span>{newCatEmoji || '📁'}</span>
              </div>
              <div className="flex-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Voorbeeld Categorie-Tab
                </span>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-white mt-1 shadow-xs" style={{ backgroundColor: newCatColor }}>
                  <span>{newCatEmoji || '📁'}</span>
                  <span>{newCatName || 'Nieuwe Categorie'}</span>
                </div>
                {newCatDescription && (
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    {newCatDescription}
                  </p>
                )}
              </div>
            </div>

            <form onSubmit={handleSaveNewCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Categorienaam *
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Bijv. Dansschool, Scouting, Geloof, Hobby's..."
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-purple-400 focus:outline-hidden text-sm text-slate-900 font-bold"
                />
              </div>

              {/* Emoji for category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Icoon / Emoji voor de Categorie
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-200 max-h-24 overflow-y-auto mb-2">
                  {[
                    '📁', '🩰', '⛺', '🎨', '🎵', '⚽', '🏊', '🚴', '🐴', '🐕',
                    '🧁', '🎉', '🩺', '📚', '🎒', '🎮', '🧹', '✈️', '🌟', '❤️',
                    '💎', '🚀', '🌲', '🎪', '🏰', '🧩', '🎳', '🏆', '🎯', '🕯️'
                  ].map((em, idx) => (
                    <button
                      key={`newcat-em-${em}-${idx}`}
                      type="button"
                      onClick={() => {
                        soundEffects.playTap();
                        setNewCatEmoji(em);
                      }}
                      className={`w-8 h-8 text-lg rounded-xl flex items-center justify-center transition-all ${
                        newCatEmoji === em
                          ? 'bg-purple-400 scale-110 shadow-xs text-white'
                          : 'bg-white hover:bg-slate-200'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-semibold">
                    Of typ zelf een emoji:
                  </span>
                  <input
                    type="text"
                    maxLength={4}
                    value={newCatEmoji}
                    onChange={(e) => setNewCatEmoji(e.target.value)}
                    className="w-16 px-2 py-1 rounded-xl border-2 border-slate-200 text-center text-lg focus:border-purple-400 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Category Color */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Themakleur voor de categorie
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_PALETTE.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => {
                        soundEffects.playTap();
                        setNewCatColor(col);
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-2xs"
                      style={{ backgroundColor: col }}
                    >
                      {newCatColor === col && (
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Korte toelichting (optioneel)
                </label>
                <input
                  type="text"
                  value={newCatDescription}
                  onChange={(e) => setNewCatDescription(e.target.value)}
                  placeholder="Bijv. Alle danslessen, repetities en optredens"
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-purple-400 focus:outline-hidden text-sm text-slate-900 font-medium"
                />
              </div>

              {/* Existing custom categories overview if any */}
              {customCategories.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs font-bold text-slate-500 block mb-1">
                    Reeds aangemaakte eigen categorieën:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {customCategories.map((c) => (
                      <span
                        key={c.id}
                        className="px-2.5 py-1 rounded-xl text-xs font-black text-slate-800 bg-slate-100 border border-slate-200 flex items-center gap-1"
                      >
                        <span>{c.emoji}</span>
                        <span>{c.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setTargetType('activiteit')}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Terug naar Activiteiten
                </button>
                <button
                  type="submit"
                  disabled={!newCatName.trim()}
                  className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Categorie Aanmaken</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

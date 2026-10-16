import React, { useState, useMemo } from 'react';
import { X, Search, Sparkles, Plus, Trash2, Wand2, FolderPlus, Tag } from 'lucide-react';
import { ACTIVITY_ICONS, getAllCategories, POPULAR_CATEGORY_TAGS } from '../data/iconLibrary';
import { ActivityIcon, IconCategory, IconCategoryMeta } from '../types/family';
import { soundEffects } from '../utils/audio';
import { IconVisual } from './IconVisual';

interface IconPickerModalProps {
  isOpen: boolean;
  selectedIconId?: string;
  customIcons?: ActivityIcon[];
  customCategories?: IconCategoryMeta[];
  onSelectIcon: (icon: ActivityIcon) => void;
  onOpenCreateIconModal?: () => void;
  onOpenCreateCategoryModal?: () => void;
  onDeleteCustomIcon?: (iconId: string) => void;
  onClose: () => void;
}

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  isOpen,
  selectedIconId,
  customIcons = [],
  customCategories = [],
  onSelectIcon,
  onOpenCreateIconModal,
  onOpenCreateCategoryModal,
  onDeleteCustomIcon,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<IconCategory | 'all' | 'custom'>('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const allCategories = useMemo(() => {
    return getAllCategories(customCategories);
  }, [customCategories]);

  // Combine default library with user's custom created icons
  const allIcons = useMemo(() => {
    return [...customIcons, ...ACTIVITY_ICONS];
  }, [customIcons]);

  const filteredIcons = useMemo(() => {
    const normalizeText = (str: string) =>
      str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    return allIcons.filter((icon) => {
      let matchesCategory = true;
      if (activeCategory === 'custom') {
        matchesCategory = !!icon.isCustom;
      } else if (activeCategory !== 'all') {
        matchesCategory = icon.category === activeCategory;
      }

      let matchesTag = true;
      if (activeTag) {
        const normTag = normalizeText(activeTag);
        matchesTag = !!(
          (icon.tags && icon.tags.some((t) => normalizeText(t).includes(normTag))) ||
          normalizeText(icon.categoryLabel || '').includes(normTag) ||
          normalizeText(icon.category).includes(normTag)
        );
      }

      const normQuery = normalizeText(searchQuery.trim());
      const matchesSearch =
        !normQuery ||
        normalizeText(icon.label).includes(normQuery) ||
        normalizeText(icon.categoryLabel || '').includes(normQuery) ||
        (icon.tags &&
          icon.tags.some((t) => normalizeText(t).includes(normQuery)));

      return matchesCategory && matchesTag && matchesSearch;
    });
  }, [allIcons, activeCategory, activeTag, searchQuery]);

  if (!isOpen) return null;

  const handleSelect = (icon: ActivityIcon) => {
    soundEffects.playTap();
    onSelectIcon(icon);
    onClose();
  };

  const handleTagToggle = (tag: string) => {
    soundEffects.playTap();
    if (activeTag === tag) {
      setActiveTag(null);
    } else {
      setActiveTag(tag);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border-4 border-amber-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="icon-picker-title"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-100 via-orange-100 to-amber-100 border-b border-amber-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden="true">
              🎨
            </span>
            <div>
              <h2
                id="icon-picker-title"
                className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2"
              >
                Kies of Maak een Vrolijk Icoon
              </h2>
              <p className="text-xs text-slate-600">
                Groot aanbod kindvriendelijke iconen verdeeld over categorieën & tags
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-slate-600 shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label="Sluit icoonkiezer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Action Bar: Create Icon / Category */}
        <div className="px-6 py-3 bg-amber-50/90 border-b border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Mis je een activiteit of wil je een eigen categorie?</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenCreateCategoryModal && (
              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  onOpenCreateCategoryModal();
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 flex items-center gap-1.5 transition-all shadow-2xs"
              >
                <FolderPlus className="w-3.5 h-3.5 text-purple-700" />
                <span>+ Categorie</span>
              </button>
            )}

            {onOpenCreateIconModal && (
              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  onOpenCreateIconModal();
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>+ Icoon Maken / AI</span>
              </button>
            )}
          </div>
        </div>

        {/* Search input */}
        <div className="px-6 pt-3 pb-2 shrink-0">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zoek bijv. judo, gitaar, school, tennis, pizza, scouting, zwemmen..."
              className="w-full pl-11 pr-4 py-2 rounded-2xl border-2 border-slate-200 focus:border-amber-400 focus:outline-hidden text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Category Tabs Strip */}
        <div className="px-6 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-100 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundEffects.playTap();
              setActiveCategory('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${
              activeCategory === 'all'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            🌈 Alles ({allIcons.length})
          </button>

          {customIcons.length > 0 && (
            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                setActiveCategory('custom');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-colors shrink-0 flex items-center gap-1 ${
                activeCategory === 'custom'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
              }`}
            >
              <span>⭐</span>
              <span>Eigen Creaties ({customIcons.length})</span>
            </button>
          )}

          {allCategories.map((cat) => {
            const count = allIcons.filter((i) => i.category === cat.id).length;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  setActiveCategory(cat.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors shrink-0 flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name.split(' ')[0]}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                )}
                {cat.isCustom && (
                  <span className="text-[9px] px-1 bg-purple-200 text-purple-900 font-black rounded-sm">
                    Eigen
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Tag Filter Chips */}
        <div className="px-6 py-1.5 bg-slate-50/80 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 shrink-0">
            <Tag className="w-3 h-3 text-slate-400" />
            <span>Tags:</span>
          </span>
          {POPULAR_CATEGORY_TAGS.map((tag) => {
            const isTagActive = activeTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagToggle(tag)}
                className={`text-[11px] px-2 py-0.5 rounded-lg font-bold transition-all whitespace-nowrap shrink-0 border ${
                  isTagActive
                    ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-900'
                }`}
              >
                #{tag}
              </button>
            );
          })}
          {activeTag && (
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className="text-[11px] px-2 py-0.5 rounded-lg font-bold text-red-600 hover:bg-red-50 whitespace-nowrap shrink-0"
            >
              ✕ Wis filter
            </button>
          )}
        </div>

        {/* Icons Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredIcons.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl block mb-2">🔍</span>
              <p className="text-slate-600 font-bold">
                Geen icoon gevonden voor "{searchQuery || activeTag || 'deze selectie'}"
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Ontwerp direct zelf een passend icoon met de hand of laat de AI eentje maken!
              </p>
              {onOpenCreateIconModal && (
                <button
                  type="button"
                  onClick={onOpenCreateIconModal}
                  className="mt-4 px-5 py-2.5 rounded-2xl text-xs font-black bg-amber-500 text-white hover:bg-amber-600 inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Maak dit icoon zelf aan!</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
              {filteredIcons.map((icon) => {
                const isSelected = icon.id === selectedIconId;
                return (
                  <div
                    key={icon.id}
                    className={`relative rounded-2xl border-2 transition-all text-center min-h-[105px] group flex flex-col items-center justify-between p-2.5 cursor-pointer select-none ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/90 shadow-md scale-[1.02]'
                        : 'border-slate-100 bg-white hover:border-amber-300 hover:bg-amber-50/30 hover:scale-[1.02]'
                    }`}
                    onClick={() => handleSelect(icon)}
                  >
                    {/* Badges top */}
                    <div className="w-full flex items-center justify-between text-[9px] mb-1">
                      {icon.isCustom ? (
                        <span className="font-black bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-full">
                          Eigen ⭐
                        </span>
                      ) : (
                        <span className="text-slate-400 font-semibold truncate max-w-[80px]">
                          {(icon.categoryLabel || icon.category || '').split(' ')[0]}
                        </span>
                      )}

                      {icon.isCustom && onDeleteCustomIcon && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Icoon "${icon.label}" verwijderen?`)) {
                              onDeleteCustomIcon(icon.id);
                            }
                          }}
                          className="w-5 h-5 rounded-full bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-600 flex items-center justify-center transition-colors"
                          title="Verwijder dit eigen icoon"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Emoji */}
                    <IconVisual
                      emoji={icon.emoji}
                      imageDataUrl={icon.imageDataUrl}
                      className="text-3xl sm:text-4xl my-0.5 transform group-hover:scale-110 transition-transform"
                      imageClassName="w-10 h-10 object-contain"
                    />

                    {/* Label & Tags */}
                    <div className="w-full mt-1">
                      <span className="text-xs font-black text-slate-800 line-clamp-1 block leading-tight">
                        {icon.label}
                      </span>
                      {icon.tags && icon.tags.length > 0 && (
                        <div className="flex items-center justify-center gap-1 mt-0.5 overflow-hidden">
                          <span className="text-[8px] font-bold text-amber-800 bg-amber-100/80 px-1 py-0.2 rounded-sm truncate">
                            #{icon.tags[0]}
                          </span>
                          {icon.tags.length > 1 && (
                            <span className="text-[8px] text-slate-400">+{icon.tags.length - 1}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-600 font-medium">
            Totaal <strong>{filteredIcons.length}</strong> iconen in deze selectie
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};

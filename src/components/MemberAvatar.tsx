import React from 'react';

/**
 * Controleert of een avatar-waarde een afbeelding is (data-URL of http-link)
 * in plaats van een emoji-tekst.
 */
export const isImageAvatar = (avatar?: string): boolean => {
  if (!avatar) return false;
  const value = avatar.trim();
  return value.startsWith('data:image/') || value.startsWith('http://') || value.startsWith('https://');
};

interface MemberAvatarProps {
  avatar?: string;
  name?: string;
  fallback?: string;
  /** Tailwind-classes die alleen gelden voor afbeeldings-avatars. */
  className?: string;
}

/**
 * Toont het avatar van een gezinslid: emoji's als tekst (zoals vroeger),
 * afbeeldingen als rond passend prentje.
 */
export const MemberAvatar: React.FC<MemberAvatarProps> = ({ avatar, name, fallback = '👦', className }) => {
  const value = (avatar ?? '').trim() || fallback;
  if (isImageAvatar(value)) {
    return (
      <img
        src={value}
        alt={name ? `Avatar van ${name}` : 'Avatar'}
        className={`w-[1.15em] h-[1.15em] rounded-full object-cover inline-block align-middle shrink-0 ${className ?? ''}`}
      />
    );
  }
  return <>{value}</>;
};

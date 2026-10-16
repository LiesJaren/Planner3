import React from 'react';

export interface IconVisualProps {
  emoji?: string;
  imageDataUrl?: string;
  imageUrl?: string;
  className?: string;
  imageClassName?: string;
}

export const IconVisual: React.FC<IconVisualProps> = ({
  emoji = '⭐',
  imageDataUrl,
  imageUrl,
  className,
  imageClassName = 'w-full h-full object-contain',
}) => {
  const imgSrc = imageDataUrl || imageUrl;

  return (
    <span className={className}>
      {imgSrc && (/^data:image\//.test(imgSrc) || /^https?:\/\//.test(imgSrc) || /^\//.test(imgSrc)) ? (
        <img src={imgSrc} alt="" className={imageClassName} />
      ) : (
        emoji || '⭐'
      )}
    </span>
  );
};

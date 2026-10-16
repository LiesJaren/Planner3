import React from 'react';

interface IconVisualProps {
  emoji: string;
  imageDataUrl?: string;
  className?: string;
  imageClassName?: string;
}

export const IconVisual: React.FC<IconVisualProps> = ({
  emoji,
  imageDataUrl,
  className,
  imageClassName = 'w-full h-full object-contain',
}) => (
  <span className={className}>
    {imageDataUrl && /^data:image\/(?:webp|png|jpeg);base64,/.test(imageDataUrl) ? (
      <img src={imageDataUrl} alt="" className={imageClassName} />
    ) : (
      emoji
    )}
  </span>
);

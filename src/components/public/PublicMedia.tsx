import React, { useState } from 'react';

interface StudioImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  fallbackLabel?: string;
}

export const StudioImage: React.FC<StudioImageProps> = ({
  src,
  alt,
  className = 'h-full w-full object-cover',
  loading = 'lazy',
  fallbackLabel = 'KeedoHub Studio Archive',
}) => {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="flex h-full w-full items-center justify-center bg-[#121212] p-6 text-center"
      >
        <div className="space-y-1.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#FF1E1E]">
            KeedoHub Visual
          </p>
          <p className="text-xs text-neutral-400">{fallbackLabel}</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

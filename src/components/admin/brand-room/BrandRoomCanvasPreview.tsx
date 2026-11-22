import React, { useMemo, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import type { CanvasDesign } from '../../../types/designStudio';
import type { MarketingFormatSpec } from '../../../types/brandRoom';
import { renderCanvasDesignToSvgBlob } from '../../../lib/productPackager';
import { renderCanvasDesignToSvgString } from '../../../lib/productPackager';

interface BrandRoomCanvasPreviewProps {
  design?: CanvasDesign | null;
  canvasDesignJson?: string;
  previewUrl?: string;
  alt?: string;
  title?: string;
  maxHeightPx?: number;
  format?: MarketingFormatSpec;
  showSafeZones?: boolean;
  className?: string;
}

export const BrandRoomCanvasPreview: React.FC<BrandRoomCanvasPreviewProps> = ({
  design,
  canvasDesignJson,
  previewUrl,
  alt,
  title,
  maxHeightPx,
  format,
  showSafeZones = false,
  className = '',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const resolvedDesign = useMemo<CanvasDesign | null>(() => {
    if (design) return design;
    if (!canvasDesignJson) return null;
    try {
      return JSON.parse(canvasDesignJson) as CanvasDesign;
    } catch {
      return null;
    }
  }, [design, canvasDesignJson]);

  const svgDataUri = useMemo(() => {
    if (!resolvedDesign) return '';
    try {
      const svg = renderCanvasDesignToSvgString(resolvedDesign);
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    } catch {
      return '';
    }
  }, [resolvedDesign]);

  const resolvedSrc = !imgFailed && previewUrl ? previewUrl : svgDataUri;
  const label = alt || title || 'KeedoHub Brand Room artwork';

  return (
    <div
      style={maxHeightPx ? { maxHeight: `${maxHeightPx}px` } : undefined}
      className={`relative w-full h-full overflow-hidden bg-[#0A0A0A] border border-[#1E1E1E] flex items-center justify-center ${className}`}
    >
      {resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={label}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          style={maxHeightPx ? { maxHeight: `${maxHeightPx}px` } : undefined}
          className="h-full w-full object-contain"
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-neutral-500">
          <ImageIcon size={22} className="text-[#FF1E1E]/70" />
          <span className="text-[11px] font-mono text-neutral-400 truncate max-w-full">
            {label}
          </span>
        </div>
      )}

      {showSafeZones && format && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div
            className="absolute border border-dashed border-[#FF1E1E]/75 bg-[#FF1E1E]/5"
            style={{
              top: `${format.safeAreaTopPct}%`,
              bottom: `${format.safeAreaBottomPct}%`,
              left: `${format.safeAreaSidePct}%`,
              right: `${format.safeAreaSidePct}%`,
            }}
          />
          <span className="absolute bottom-1.5 left-2 bg-black/85 px-1.5 py-0.5 text-[9px] font-mono text-[#FF1E1E]">
            Safe Zone ({100 - format.safeAreaSidePct * 2}% × {100 - format.safeAreaTopPct - format.safeAreaBottomPct}%)
          </span>
        </div>
      )}
    </div>
  );
};

export function buildSafeSvgDownloadUrl(design: CanvasDesign): string {
  const blob = renderCanvasDesignToSvgBlob(design);
  return URL.createObjectURL(blob);
}

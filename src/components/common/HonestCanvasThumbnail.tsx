/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LYRICAL ENT — Honest Canvas Thumbnail Preview Renderer
 * Renders the real visual composition of any CanvasDesign without mockups or fake previews
 */

import React from 'react';
import { CanvasDesign } from '../../types/designStudio';
import { LineArtRenderer } from './LineArtRenderer';
import { LyricalLogoConcept } from '../brand/LogoConcepts';

interface HonestCanvasThumbnailProps {
  design: CanvasDesign;
  className?: string;
  aspectClass?: string;
}

export const HonestCanvasThumbnail: React.FC<HonestCanvasThumbnailProps> = ({
  design,
  className = '',
  aspectClass = 'aspect-[4/3]'
}) => {
  return (
    <div 
      className={`w-full ${aspectClass} border border-[#222222] rounded overflow-hidden relative select-none shadow-md group-hover:border-[#555] transition-colors ${className}`}
      style={{ backgroundColor: design.backgroundColor || '#080808' }}
    >
      {/* Real Canvas Elements Render Loop */}
      {design.elements
        .filter(el => el.visible)
        .sort((a, b) => a.zIndex - b.zIndex)
        .map(el => {
          return (
            <div
              key={el.id}
              className="absolute pointer-events-none transition-transform"
              style={{
                left: `${el.x}%`,
                top: `${el.y}%`,
                transform: `translate(-50%, -50%) rotate(${el.rotation || 0}deg)`,
                opacity: el.opacity ?? 1,
                width: el.width ? `${el.width}%` : 'auto',
                height: el.height ? `${el.height}%` : 'auto'
              }}
            >
              {/* Text Element */}
              {el.type === 'text' && (
                <div
                  className={`leading-none truncate max-w-full ${
                    el.fontFamily === 'serif' ? 'font-serif' :
                    el.fontFamily === 'mono' ? 'font-mono' :
                    el.fontFamily === 'display' ? 'font-black' : 'font-sans'
                  }`}
                  style={{
                    fontSize: `${Math.max(6.5, Math.min(22, (el.fontSize || 36) * 0.19))}px`,
                    fontWeight: el.fontWeight || '700',
                    textAlign: el.textAlign || 'center',
                    color: el.color || '#FFFFFF',
                    letterSpacing: `${(el.letterSpacing || 0) * 0.5}px`,
                    textTransform: el.textTransform || 'uppercase'
                  }}
                >
                  {el.text || ''}
                </div>
              )}

              {/* Image Element */}
              {el.type === 'image' && (
                <div className="w-full h-full relative overflow-hidden rounded-[1px]">
                  <img 
                    src={el.src || '/src/assets/images/artist_showcase_portrait_1792791744296.jpg'} 
                    alt={el.name}
                    className={`w-full h-full object-${el.objectFit || 'cover'} ${
                      el.filter === 'noir' ? 'grayscale contrast-125' :
                      el.filter === 'contrast' ? 'contrast-150' : ''
                    }`}
                  />
                </div>
              )}

              {/* Original Line Art Vector Illustration */}
              {el.type === 'illustration' && (
                <div className="w-full h-full flex items-center justify-center">
                  <LineArtRenderer 
                    itemOrId={el.illustrationId || 'mic_studio_condenser'}
                    color={el.strokeColor || '#FFFFFF'}
                    strokeWidth={el.strokeWidth || 1.8}
                    isFilled={el.isFilled}
                    size="100%"
                    className="w-full h-full"
                  />
                </div>
              )}

              {/* Shape Element */}
              {el.type === 'shape' && (
                <div 
                  className="w-full h-full"
                  style={{
                    border: `${Math.max(1, Math.round((el.borderWidth || 2) * 0.5))}px solid ${el.borderColor || '#FFFFFF'}`,
                    borderRadius: el.shapeType === 'circle' ? '9999px' : '0px'
                  }}
                />
              )}

              {/* Logo Element */}
              {el.type === 'logo' && (
                <div className="w-5 h-5 flex items-center justify-center">
                  <LyricalLogoConcept 
                    conceptId={el.logoConceptId || 'classic'}
                    variant={el.logoVariant || 'monogram'}
                    theme={el.logoTheme === 'black' ? 'monochrome-black' : 'monochrome-white'}
                    size={20}
                  />
                </div>
              )}
            </div>
          );
        })}

      {/* Subtle Texture Overlay in Preview */}
      {design.textureOverlay && design.textureOverlay !== 'none' && (
        <div 
          className="absolute inset-0 pointer-events-none mix-blend-overlay"
          style={{
            opacity: (design.textureOpacity || 0.35) * 0.8,
            backgroundImage: design.textureOverlay === 'fine_grid' 
              ? 'radial-gradient(rgba(255,255,255,0.2) 1px, transparent 0)' 
              : 'none',
            backgroundSize: '8px 8px'
          }}
        >
          {design.textureOverlay === 'vignette' && (
            <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(0,0,0,0.8)_100%)]" />
          )}
        </div>
      )}

      {/* Bottom Subtle Aspect & Elements Stamp */}
      <div className="absolute bottom-1 right-1.5 z-10 px-1 py-0.5 bg-black/60 rounded text-[7.5px] font-mono text-neutral-400 backdrop-blur-xs">
        {design.elements.length} ELEMS
      </div>
    </div>
  );
};

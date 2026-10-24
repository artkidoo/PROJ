/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LYRICAL ENT — Vector Line Art SVG Renderer
 */

import React from 'react';
import { LineArtItem, getLineArtItemById } from '../../data/lineArtLibrary';

export interface LineArtRendererProps {
  itemOrId: LineArtItem | string;
  size?: number | string;
  className?: string;
  color?: string;
  strokeWidth?: number;
  isFilled?: boolean;
  opacity?: number;
}

export const LineArtRenderer: React.FC<LineArtRendererProps> = ({
  itemOrId,
  size = 48,
  className = '',
  color = 'currentColor',
  strokeWidth,
  isFilled = false,
  opacity = 1
}) => {
  const item: LineArtItem | undefined = typeof itemOrId === 'string' ? getLineArtItemById(itemOrId) : itemOrId;

  if (!item) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={`select-none shrink-0 ${className}`}
      >
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
      </svg>
    );
  }

  const effectiveStrokeWidth = strokeWidth !== undefined ? strokeWidth : item.defaultStrokeWidth;

  return (
    <svg
      width={size}
      height={size}
      viewBox={item.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none shrink-0 transition-colors ${className}`}
      style={{ color, opacity }}
      aria-label={item.name}
    >
      {item.paths.map((p, idx) => {
        const pathColor = p.fill === 'currentColor' || isFilled ? color : p.fill || 'none';
        const pathStroke = p.stroke === 'none' ? 'none' : color;
        const widthVal = p.strokeWidth !== undefined ? p.strokeWidth : effectiveStrokeWidth;

        if (p.type === 'rect') {
          return (
            <rect
              key={idx}
              x={p.x}
              y={p.y}
              width={p.width}
              height={p.height}
              rx={p.rx as any}
              fill={pathColor}
              stroke={pathStroke}
              strokeWidth={widthVal}
              strokeDasharray={p.strokeDasharray}
              opacity={p.opacity}
            />
          );
        }

        if (p.type === 'circle') {
          return (
            <circle
              key={idx}
              cx={p.cx}
              cy={p.cy}
              r={p.r}
              fill={pathColor}
              stroke={pathStroke}
              strokeWidth={widthVal}
              strokeDasharray={p.strokeDasharray}
              opacity={p.opacity}
            />
          );
        }

        if (p.type === 'line') {
          return (
            <line
              key={idx}
              x1={p.x1}
              y1={p.y1}
              x2={p.x2}
              y2={p.y2}
              stroke={pathStroke}
              strokeWidth={widthVal}
              strokeLinecap={p.strokeLinecap || 'round'}
              strokeDasharray={p.strokeDasharray}
              opacity={p.opacity}
            />
          );
        }

        if (p.type === 'polygon') {
          return (
            <polygon
              key={idx}
              points={p.points}
              fill={pathColor}
              stroke={pathStroke}
              strokeWidth={widthVal}
              strokeLinejoin={p.strokeLinejoin || 'miter'}
              opacity={p.opacity}
            />
          );
        }

        if (p.type === 'polyline') {
          return (
            <polyline
              key={idx}
              points={p.points}
              fill={pathColor}
              stroke={pathStroke}
              strokeWidth={widthVal}
              strokeLinecap={p.strokeLinecap || 'round'}
              strokeLinejoin={p.strokeLinejoin || 'round'}
              opacity={p.opacity}
            />
          );
        }

        // Default path
        return (
          <path
            key={idx}
            d={p.d}
            fill={pathColor}
            stroke={pathStroke}
            strokeWidth={widthVal}
            strokeLinecap={p.strokeLinecap || 'round'}
            strokeLinejoin={p.strokeLinejoin || 'round'}
            strokeDasharray={p.strokeDasharray}
            opacity={p.opacity}
          />
        );
      })}
    </svg>
  );
};

/**
 * Generate Raw SVG string of any Line Art Item for Vector SVG export
 */
export function getLineArtSvgString(
  item: LineArtItem,
  color: string = '#FFFFFF',
  strokeWidth?: number,
  isFilled: boolean = false
): string {
  const effectiveStrokeWidth = strokeWidth !== undefined ? strokeWidth : item.defaultStrokeWidth;

  const innerSvg = item.paths.map(p => {
    const pathColor = p.fill === 'currentColor' || isFilled ? color : p.fill || 'none';
    const pathStroke = p.stroke === 'none' ? 'none' : color;
    const widthVal = p.strokeWidth !== undefined ? p.strokeWidth : effectiveStrokeWidth;

    if (p.type === 'rect') {
      return `<rect x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" rx="${(p as any).rx || 0}" fill="${pathColor}" stroke="${pathStroke}" stroke-width="${widthVal}" ${p.strokeDasharray ? `stroke-dasharray="${p.strokeDasharray}"` : ''} ${p.opacity !== undefined ? `opacity="${p.opacity}"` : ''} />`;
    }
    if (p.type === 'circle') {
      return `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" fill="${pathColor}" stroke="${pathStroke}" stroke-width="${widthVal}" ${p.strokeDasharray ? `stroke-dasharray="${p.strokeDasharray}"` : ''} ${p.opacity !== undefined ? `opacity="${p.opacity}"` : ''} />`;
    }
    if (p.type === 'line') {
      return `<line x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}" stroke="${pathStroke}" stroke-width="${widthVal}" stroke-linecap="${p.strokeLinecap || 'round'}" ${p.strokeDasharray ? `stroke-dasharray="${p.strokeDasharray}"` : ''} ${p.opacity !== undefined ? `opacity="${p.opacity}"` : ''} />`;
    }
    if (p.type === 'polygon') {
      return `<polygon points="${p.points}" fill="${pathColor}" stroke="${pathStroke}" stroke-width="${widthVal}" ${p.opacity !== undefined ? `opacity="${p.opacity}"` : ''} />`;
    }
    if (p.type === 'polyline') {
      return `<polyline points="${p.points}" fill="${pathColor}" stroke="${pathStroke}" stroke-width="${widthVal}" ${p.opacity !== undefined ? `opacity="${p.opacity}"` : ''} />`;
    }
    return `<path d="${p.d}" fill="${pathColor}" stroke="${pathStroke}" stroke-width="${widthVal}" stroke-linecap="${p.strokeLinecap || 'round'}" stroke-linejoin="${p.strokeLinejoin || 'round'}" ${p.strokeDasharray ? `stroke-dasharray="${p.strokeDasharray}"` : ''} ${p.opacity !== undefined ? `opacity="${p.opacity}"` : ''} />`;
  }).join('\n    ');

  return `
    <g class="line-art-${item.id}">
      ${innerSvg}
    </g>
  `;
}

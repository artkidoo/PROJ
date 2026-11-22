import type { CanvasElement } from '../types/designStudio';

export interface ShapePreviewStyle {
  backgroundColor: string;
  border: string;
  borderRadius: string;
  height?: string;
}

export interface Canvas2DShapeContext {
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  fillRect(x: number, y: number, w: number, h: number): void;
  strokeRect(x: number, y: number, w: number, h: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void;
  fill(): void;
  stroke(): void;
}

function escapeXmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Computes consistent inline preview styles for interactive DOM rendering of shape elements.
 */
export function getShapePreviewStyle(el: CanvasElement): ShapePreviewStyle {
  const shapeType = el.shapeType || 'rectangle';
  const strokeWidth = Math.max(1, el.borderWidth || 2);

  if (shapeType === 'rectangle') {
    const fill = el.fillColor || (!el.borderColor ? '#FFFFFF' : 'transparent');
    const border =
      el.borderColor && el.borderWidth
        ? `${el.borderWidth}px solid ${el.borderColor}`
        : 'none';
    return {
      backgroundColor: fill,
      border,
      borderRadius: '0px',
    };
  }

  if (shapeType === 'line' || shapeType === 'divider') {
    return {
      backgroundColor: el.fillColor || el.borderColor || '#FFFFFF',
      border: 'none',
      borderRadius: '0px',
      height: `${strokeWidth}px`,
    };
  }

  if (shapeType === 'circle') {
    const hasFill = Boolean(el.fillColor);
    return {
      backgroundColor: el.fillColor || 'transparent',
      border:
        hasFill && !el.borderColor
          ? 'none'
          : `${strokeWidth}px solid ${el.borderColor || '#FFFFFF'}`,
      borderRadius: '9999px',
    };
  }

  // 'frame' or fallback structural outline box
  return {
    backgroundColor: el.fillColor || 'transparent',
    border: `${strokeWidth}px solid ${el.borderColor || '#FFFFFF'}`,
    borderRadius: '0px',
  };
}

/**
 * Serializes a canvas shape element to its vector SVG markup at target canvas dimensions.
 */
export function renderShapeToSvgString(
  el: CanvasElement,
  width: number,
  height: number,
): string {
  const pixelX = (el.x / 100) * width;
  const pixelY = (el.y / 100) * height;
  const opacity = el.opacity ?? 1;
  const rotation = el.rotation || 0;
  const shapeType = el.shapeType || 'rectangle';
  const transformAttr = rotation
    ? ` transform="rotate(${rotation} ${pixelX} ${pixelY})"`
    : '';

  if (shapeType === 'frame') {
    const fW = ((el.width || 90) / 100) * width;
    const fH = ((el.height || 90) / 100) * height;
    const fill = el.fillColor ? escapeXmlAttr(el.fillColor) : 'none';
    const stroke = escapeXmlAttr(el.borderColor || '#FFFFFF');
    const strokeWidth = el.borderWidth || 2;
    return `<rect x="${pixelX - fW / 2}" y="${pixelY - fH / 2}" width="${fW}" height="${fH}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"${transformAttr} />`;
  }

  if (shapeType === 'rectangle') {
    const rW = ((el.width || 50) / 100) * width;
    const rH = Math.max(2, ((el.height || 2) / 100) * height);
    const fill = escapeXmlAttr(el.fillColor || (!el.borderColor ? '#FFFFFF' : 'none'));
    const strokeAttr =
      el.borderColor && el.borderWidth
        ? ` stroke="${escapeXmlAttr(el.borderColor)}" stroke-width="${el.borderWidth}"`
        : '';
    return `<rect x="${pixelX - rW / 2}" y="${pixelY - rH / 2}" width="${rW}" height="${rH}" fill="${fill}"${strokeAttr} opacity="${opacity}"${transformAttr} />`;
  }

  if (shapeType === 'line' || shapeType === 'divider') {
    const lW = ((el.width || 80) / 100) * width;
    const stroke = escapeXmlAttr(el.borderColor || el.fillColor || '#FFFFFF');
    const strokeWidth = el.borderWidth || 2;
    return `<line x1="${pixelX - lW / 2}" y1="${pixelY}" x2="${pixelX + lW / 2}" y2="${pixelY}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"${transformAttr} />`;
  }

  if (shapeType === 'circle') {
    const radius = (((el.width || 20) / 100) * width) / 2;
    const fill = el.fillColor ? escapeXmlAttr(el.fillColor) : 'none';
    const hasFill = Boolean(el.fillColor);
    const stroke = hasFill && !el.borderColor ? 'none' : escapeXmlAttr(el.borderColor || '#FFFFFF');
    const strokeWidth = el.borderWidth || 2;
    return `<circle cx="${pixelX}" cy="${pixelY}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}" />`;
  }

  return '';
}

/**
 * Draws a canvas shape element onto an HTML5 2D canvas context (PNG/JPEG raster export).
 * Assumes ctx.globalAlpha and rotation transform are already configured on the context.
 */
export function drawShapeOnCanvas2D(
  ctx: Canvas2DShapeContext,
  el: CanvasElement,
  width: number,
  height: number,
): void {
  const posX = (el.x / 100) * width;
  const posY = (el.y / 100) * height;
  const shapeType = el.shapeType || 'rectangle';
  const scaledStrokeWidth = Math.max(
    2,
    Math.round((el.borderWidth || 2) * (width / 1200)),
  );

  ctx.strokeStyle = el.borderColor || '#FFFFFF';
  ctx.lineWidth = scaledStrokeWidth;

  if (shapeType === 'frame') {
    const fW = ((el.width || 90) / 100) * width;
    const fH = ((el.height || 90) / 100) * height;
    const x = posX - fW / 2;
    const y = posY - fH / 2;
    if (el.fillColor) {
      ctx.fillStyle = el.fillColor;
      ctx.fillRect(x, y, fW, fH);
    }
    ctx.strokeRect(x, y, fW, fH);
    return;
  }

  if (shapeType === 'rectangle') {
    const rW = ((el.width || 50) / 100) * width;
    const rH = Math.max(2, ((el.height || 2) / 100) * height);
    const x = posX - rW / 2;
    const y = posY - rH / 2;
    if (el.fillColor || !el.borderColor) {
      ctx.fillStyle = el.fillColor || '#FFFFFF';
      ctx.fillRect(x, y, rW, rH);
    }
    if (el.borderColor && el.borderWidth) {
      ctx.strokeStyle = el.borderColor;
      ctx.strokeRect(x, y, rW, rH);
    }
    return;
  }

  if (shapeType === 'line' || shapeType === 'divider') {
    const lW = ((el.width || 80) / 100) * width;
    ctx.strokeStyle = el.borderColor || el.fillColor || '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(posX - lW / 2, posY);
    ctx.lineTo(posX + lW / 2, posY);
    ctx.stroke();
    return;
  }

  if (shapeType === 'circle') {
    const radius = (((el.width || 20) / 100) * width) / 2;
    ctx.beginPath();
    ctx.arc(posX, posY, radius, 0, Math.PI * 2);
    if (el.fillColor) {
      ctx.fillStyle = el.fillColor;
      ctx.fill();
    }
    if (!el.fillColor || el.borderColor) {
      ctx.strokeStyle = el.borderColor || '#FFFFFF';
      ctx.stroke();
    }
  }
}

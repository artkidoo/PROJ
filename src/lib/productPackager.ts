import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import type { CreativeProduct } from '../types/creativeProduct';
import type { CanvasDesign } from '../types/designStudio';
import { getConceptGlyphSvg, getThemeColors } from '../components/brand/LogoConcepts';
import { getLineArtItemById } from '../data/lineArtLibrary';
import { getLineArtSvgString } from '../components/common/LineArtRenderer';
import { resolveProductFamily, slugifyProductTitle } from './creativeProductAccess';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Serializes any CanvasDesign (from Template Families, Master Templates, or Admin Canvas)
 * into a clean, editable SVG vector document.
 */
export function renderCanvasDesignToSvgString(design: CanvasDesign): string {
  const { width, height } = design;
  let svgElements = '';

  design.elements
    .filter(el => el.visible)
    .sort((a, b) => a.zIndex - b.zIndex)
    .forEach(el => {
      const pixelX = (el.x / 100) * width;
      const pixelY = (el.y / 100) * height;

      if (el.type === 'text') {
        const fontStack =
          el.fontFamily === 'serif'
            ? 'Georgia, serif'
            : el.fontFamily === 'mono'
              ? 'Courier, monospace'
              : el.fontFamily === 'display'
                ? 'Impact, sans-serif'
                : 'Helvetica, Arial, sans-serif';
        const scaledSize = Math.round((el.fontSize || 36) * (width / 1200));
        const anchor = el.textAlign === 'center' ? 'middle' : el.textAlign === 'right' ? 'end' : 'start';
        const lines = (el.text || '').split('\n');
        const lineHeight = scaledSize * (el.lineHeight || 1.15);
        const textNodes = lines
          .map(
            (line, i) =>
              `<tspan x="${pixelX}" y="${pixelY + i * lineHeight}">${escapeXml(line)}</tspan>`,
          )
          .join('');
        svgElements += `
          <text x="${pixelX}" y="${pixelY}" fill="${el.color || '#FFFFFF'}" font-family="${fontStack}" font-size="${scaledSize}" font-weight="${el.fontWeight || '700'}" text-anchor="${anchor}" letter-spacing="${el.letterSpacing || 0}" opacity="${el.opacity}" transform="rotate(${el.rotation || 0} ${pixelX} ${pixelY})">
            ${textNodes}
          </text>
        `;
      } else if (el.type === 'image' && el.src) {
        const imgW = ((el.width || 60) / 100) * width;
        const imgH = ((el.height || 50) / 100) * height;
        const imgX = pixelX - imgW / 2;
        const imgY = pixelY - imgH / 2;
        svgElements += `<image href="${escapeXml(el.src)}" x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" opacity="${el.opacity}" preserveAspectRatio="${el.objectFit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice'}" transform="rotate(${el.rotation || 0} ${pixelX} ${pixelY})" />`;
      } else if (el.type === 'illustration') {
        const item = getLineArtItemById(el.illustrationId || 'mic_studio_condenser');
        if (item) {
          const illW = ((el.width || 30) / 100) * width;
          const illH = ((el.height || 30) / 100) * height;
          const rawSvg = getLineArtSvgString(item, el.strokeColor || '#FFFFFF', el.strokeWidth, el.isFilled);
          svgElements += `
            <g transform="translate(${pixelX - illW / 2}, ${pixelY - illH / 2}) rotate(${el.rotation || 0} ${illW / 2} ${illH / 2}) scale(${illW / 100}, ${illH / 100})" opacity="${el.opacity}">
              ${rawSvg}
            </g>
          `;
        }
      } else if (el.type === 'shape') {
        if (el.shapeType === 'frame') {
          const fW = ((el.width || 90) / 100) * width;
          const fH = ((el.height || 90) / 100) * height;
          svgElements += `<rect x="${(width - fW) / 2}" y="${(height - fH) / 2}" width="${fW}" height="${fH}" fill="none" stroke="${el.borderColor || '#FFFFFF'}" stroke-width="${el.borderWidth || 2}" opacity="${el.opacity}" />`;
        } else if (el.shapeType === 'rectangle') {
          const rW = ((el.width || 50) / 100) * width;
          const rH = Math.max(2, ((el.height || 2) / 100) * height);
          svgElements += `<rect x="${pixelX - rW / 2}" y="${pixelY - rH / 2}" width="${rW}" height="${rH}" fill="${el.fillColor || '#FFFFFF'}" opacity="${el.opacity}" />`;
        } else if (el.shapeType === 'line') {
          const lW = ((el.width || 80) / 100) * width;
          svgElements += `<line x1="${pixelX - lW / 2}" y1="${pixelY}" x2="${pixelX + lW / 2}" y2="${pixelY}" stroke="${el.borderColor || '#FFFFFF'}" stroke-width="${el.borderWidth || 2}" opacity="${el.opacity}" />`;
        } else if (el.shapeType === 'circle') {
          const radius = (((el.width || 20) / 100) * width) / 2;
          svgElements += `<circle cx="${pixelX}" cy="${pixelY}" r="${radius}" fill="none" stroke="${el.borderColor || '#FFFFFF'}" stroke-width="${el.borderWidth || 2}" opacity="${el.opacity}" />`;
        }
      } else if (el.type === 'logo') {
        const logoW = Math.round(width * ((el.width || 14) / 100));
        const logoH = Math.round(height * ((el.height || 14) / 100));
        const conceptId = el.logoConceptId || 'classic';
        const { fg, bg, sub, accent } = getThemeColors(
          el.logoTheme === 'black'
            ? 'monochrome-black'
            : el.logoTheme === 'gold'
              ? 'gold-accent'
              : 'monochrome-white',
        );
        const glyph = getConceptGlyphSvg(conceptId, fg, bg, sub, accent);
        svgElements += `
          <g transform="translate(${pixelX - logoW / 2}, ${pixelY - logoH / 2}) scale(${logoW / 100}, ${logoH / 100})" opacity="${el.opacity}">
            ${glyph}
          </g>
        `;
      }
    });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="${design.backgroundColor || '#080808'}" />
  ${svgElements}
</svg>`.trim();
}

export function renderCanvasDesignToSvgBlob(design: CanvasDesign): Blob {
  const svg = renderCanvasDesignToSvgString(design);
  return new Blob([svg], { type: 'image/svg+xml' });
}

/**
 * Off-screen HTML5 Canvas renderer converting a CanvasDesign into a real high-res PNG or JPEG Blob.
 */
export async function renderCanvasDesignToRasterBlob(
  design: CanvasDesign,
  format: 'png' | 'jpeg' = 'png',
): Promise<Blob> {
  const { width, height } = design;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Browser canvas context is unavailable for off-screen rendering.');
  }

  ctx.fillStyle = design.backgroundColor || '#080808';
  ctx.fillRect(0, 0, width, height);

  const sorted = [...design.elements]
    .filter(el => el.visible)
    .sort((a, b) => a.zIndex - b.zIndex);

  for (const el of sorted) {
    ctx.save();
    ctx.globalAlpha = el.opacity;
    const posX = (el.x / 100) * width;
    const posY = (el.y / 100) * height;

    if (el.rotation) {
      ctx.translate(posX, posY);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.translate(-posX, -posY);
    }

    if (el.type === 'text') {
      let fontName = 'sans-serif';
      if (el.fontFamily === 'serif') fontName = 'Georgia, serif';
      if (el.fontFamily === 'mono') fontName = 'monospace';
      if (el.fontFamily === 'display') fontName = 'Impact, sans-serif';

      const scaledSize = Math.round((el.fontSize || 36) * (width / 1200));
      ctx.font = `${el.fontWeight || '700'} ${scaledSize}px ${fontName}`;
      ctx.fillStyle = el.color || '#FFFFFF';
      ctx.textAlign = el.textAlign || 'center';

      const lines = (el.text || '').split('\n');
      const lineHeight = scaledSize * (el.lineHeight || 1.15);
      lines.forEach((line, idx) => {
        ctx.fillText(line, posX, posY + idx * lineHeight);
      });
    } else if (el.type === 'image' && el.src) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>(resolve => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = el.src!;
        });
        if (img.naturalWidth > 0) {
          const imgW = ((el.width || 60) / 100) * width;
          const imgH = ((el.height || 50) / 100) * height;
          const imgX = posX - imgW / 2;
          const imgY = posY - imgH / 2;
          if (el.filter === 'noir' || el.filter === 'grayscale') {
            ctx.filter = 'grayscale(100%) contrast(120%)';
          } else if (el.filter === 'contrast') {
            ctx.filter = 'contrast(140%)';
          }
          ctx.drawImage(img, imgX, imgY, imgW, imgH);
          ctx.filter = 'none';
        }
      } catch {
        // Skip unreachable image cleanly
      }
    } else if (el.type === 'illustration') {
      const item = getLineArtItemById(el.illustrationId || 'mic_studio_condenser');
      if (item) {
        try {
          const illW = ((el.width || 30) / 100) * width;
          const illH = ((el.height || 30) / 100) * height;
          const rawSvg = getLineArtSvgString(item, el.strokeColor || '#FFFFFF', el.strokeWidth, el.isFilled);
          const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${item.viewBox}" width="${illW}" height="${illH}">${rawSvg}</svg>`;
          const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
          const svgUrl = URL.createObjectURL(svgBlob);
          const img = new Image();
          await new Promise<void>(resolve => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = svgUrl;
          });
          ctx.drawImage(img, posX - illW / 2, posY - illH / 2, illW, illH);
          URL.revokeObjectURL(svgUrl);
        } catch {
          // ignore
        }
      }
    } else if (el.type === 'shape') {
      ctx.strokeStyle = el.borderColor || '#FFFFFF';
      ctx.fillStyle = el.fillColor || '#FFFFFF';
      ctx.lineWidth = Math.max(2, Math.round((el.borderWidth || 2) * (width / 1200)));

      if (el.shapeType === 'frame') {
        const fW = ((el.width || 90) / 100) * width;
        const fH = ((el.height || 90) / 100) * height;
        ctx.strokeRect((width - fW) / 2, (height - fH) / 2, fW, fH);
      } else if (el.shapeType === 'rectangle') {
        const rW = ((el.width || 50) / 100) * width;
        const rH = Math.max(2, ((el.height || 2) / 100) * height);
        ctx.fillRect(posX - rW / 2, posY - rH / 2, rW, rH);
      } else if (el.shapeType === 'line') {
        const lW = ((el.width || 80) / 100) * width;
        ctx.beginPath();
        ctx.moveTo(posX - lW / 2, posY);
        ctx.lineTo(posX + lW / 2, posY);
        ctx.stroke();
      } else if (el.shapeType === 'circle') {
        const radius = (((el.width || 20) / 100) * width) / 2;
        ctx.beginPath();
        ctx.arc(posX, posY, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (el.type === 'logo') {
      const logoW = Math.round(width * ((el.width || 14) / 100));
      const logoH = Math.round(height * ((el.height || 14) / 100));
      const conceptId = el.logoConceptId || 'classic';
      const { fg, bg, sub, accent } = getThemeColors(
        el.logoTheme === 'black'
          ? 'monochrome-black'
          : el.logoTheme === 'gold'
            ? 'gold-accent'
            : 'monochrome-white',
      );
      const glyph = getConceptGlyphSvg(conceptId, fg, bg, sub, accent);
      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${logoW}" height="${logoH}">${glyph}</svg>`;
      try {
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        const img = new Image();
        await new Promise<void>(resolve => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = svgUrl;
        });
        ctx.drawImage(img, posX - logoW / 2, posY - logoH / 2, logoW, logoH);
        URL.revokeObjectURL(svgUrl);
      } catch {
        ctx.strokeStyle = '#FFFFFF';
        ctx.strokeRect(posX - logoW / 2, posY - logoH / 2, logoW, logoH);
      }
    }

    ctx.restore();
  }

  if (design.textureOverlay === 'vignette') {
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.25,
      width / 2,
      height / 2,
      width * 0.7,
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${design.textureOpacity || 0.45})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const quality = format === 'jpeg' ? 0.94 : 1.0;

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to encode rendered canvas artwork.'));
      },
      mime,
      quality,
    );
  });
}

/**
 * Builds a real multi-page print/digital PDF pack customized to the Creative Product
 * (Business Document layouts, Brand Guidelines, Artist EPK/Press Kits, or Production Spec Booklets).
 */
export function generateStructuredDocumentPdfBlob(
  product: CreativeProduct,
  workspaceLabel = 'KEEDOHUB STUDIO',
): Blob {
  const family = resolveProductFamily(product);
  const isWidescreenDeck =
    product.subcategory.toLowerCase().includes('pitch') ||
    product.subcategory.toLowerCase().includes('presentation') ||
    product.dimensionSpecs.some(s => s.aspectRatio.includes('16:9'));

  const pdf = new jsPDF({
    orientation: isWidescreenDeck ? 'landscape' : 'portrait',
    unit: 'mm',
    format: isWidescreenDeck ? [297, 167] : 'a4',
  });

  const pageWidth = isWidescreenDeck ? 297 : 210;
  const pageHeight = isWidescreenDeck ? 167 : 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // --- PAGE 1: DARK STUDIO COVER ---
  pdf.setFillColor(10, 10, 10);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Red structural accent bar
  pdf.setFillColor(255, 30, 30);
  pdf.rect(margin, margin, 26, 2.5, 'F');

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(255, 30, 30);
  pdf.text(`KEEDOHUB CREATIVE HUB  //  ${family.toUpperCase()}`, margin, margin + 10);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(isWidescreenDeck ? 24 : 22);
  pdf.setTextColor(255, 255, 255);
  const titleLines = pdf.splitTextToSize(product.title.toUpperCase(), contentWidth);
  pdf.text(titleLines, margin, margin + 28);

  const afterTitleY = margin + 28 + titleLines.length * 9 + 4;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10.5);
  pdf.setTextColor(200, 200, 200);
  const summaryLines = pdf.splitTextToSize(product.summary || product.description || '', contentWidth);
  pdf.text(summaryLines, margin, afterTitleY);

  // Meta Spec Box on Cover
  const boxY = Math.min(pageHeight - 54, afterTitleY + summaryLines.length * 5.2 + 12);
  pdf.setFillColor(18, 18, 18);
  pdf.setDrawColor(42, 42, 42);
  pdf.rect(margin, boxY, contentWidth, 26, 'FD');

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(160, 160, 160);
  pdf.text('AUDIENCE', margin + 5, boxY + 8);
  pdf.text('SUBCATEGORY', margin + contentWidth * 0.28, boxY + 8);
  pdf.text('VERSION', margin + contentWidth * 0.62, boxY + 8);
  pdf.text('FORMATS', margin + contentWidth * 0.78, boxY + 8);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text(product.audience, margin + 5, boxY + 16);
  pdf.text(product.subcategory || product.category, margin + contentWidth * 0.28, boxY + 16);
  pdf.text(product.version || 'v1.0', margin + contentWidth * 0.62, boxY + 16);
  pdf.text((product.supportedFormats || []).slice(0, 4).join(' / ') || 'PDF', margin + contentWidth * 0.78, boxY + 16);

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(130, 130, 130);
  pdf.text(`PREPARED BY KEEDOHUB STUDIO · ${workspaceLabel.toUpperCase()}`, margin, pageHeight - 10);
  pdf.text('PAGE 01', pageWidth - margin, pageHeight - 10, { align: 'right' });

  // --- PAGE 2: WORKING TEMPLATE / DELIVERABLES & DIMENSION MATRIX ---
  pdf.addPage(isWidescreenDeck ? [297, 167] : 'a4', isWidescreenDeck ? 'landscape' : 'portrait');
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  pdf.setFillColor(10, 10, 10);
  pdf.rect(0, 0, pageWidth, 22, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(255, 255, 255);
  pdf.text(product.title, margin, 14);
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 30, 30);
  pdf.text(family.toUpperCase(), pageWidth - margin, 14, { align: 'right' });

  let py = 34;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10.5);
  pdf.setTextColor(15, 15, 15);
  pdf.text('INCLUDED DELIVERABLES & PRODUCTION SCOPE', margin, py);
  py += 6;

  const deliverables = product.deliverablesSummary.length > 0
    ? product.deliverablesSummary
    : [product.summary || 'Studio creative template & deliverable pack'];

  deliverables.forEach((item, idx) => {
    pdf.setFillColor(246, 246, 246);
    pdf.setDrawColor(225, 225, 225);
    pdf.rect(margin, py, contentWidth, 9, 'FD');
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(255, 30, 30);
    pdf.text(`0${idx + 1}`, margin + 3, py + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(25, 25, 25);
    pdf.text(String(item).slice(0, 105), margin + 12, py + 6);
    py += 11;
  });

  if (product.dimensionSpecs.length > 0 && py < pageHeight - 48) {
    py += 6;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10.5);
    pdf.setTextColor(15, 15, 15);
    pdf.text('PLATFORM & PRINT DIMENSION SPECIFICATIONS', margin, py);
    py += 6;

    pdf.setFillColor(20, 20, 20);
    pdf.rect(margin, py, contentWidth, 8, 'F');
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text('PLATFORM / PLACEMENT', margin + 3, py + 5.5);
    pdf.text('DIMENSIONS', margin + contentWidth * 0.44, py + 5.5);
    pdf.text('ASPECT / NOTES', margin + contentWidth * 0.72, py + 5.5);
    py += 8;

    product.dimensionSpecs.slice(0, 6).forEach(spec => {
      if (py > pageHeight - 24) return;
      pdf.setDrawColor(220, 220, 220);
      pdf.rect(margin, py, contentWidth, 8.5, 'S');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(15, 15, 15);
      pdf.text(spec.platform.slice(0, 38), margin + 3, py + 5.7);
      pdf.setFont('courier', 'bold');
      pdf.setTextColor(200, 20, 20);
      pdf.text(spec.dimensions.slice(0, 28), margin + contentWidth * 0.44, py + 5.7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 80, 80);
      pdf.text(spec.aspectRatio.slice(0, 26), margin + contentWidth * 0.72, py + 5.7);
      py += 8.5;
    });
  }

  // --- PAGE 3 FOR DOCUMENT / PRESS / IDENTITY PACKS: EDITABLE FORM SPREAD ---
  const needsEditableSpread =
    family === 'Business Documents' ||
    family === 'Artist Branding & Press' ||
    family === 'Brand Identity';

  if (needsEditableSpread) {
    pdf.addPage(isWidescreenDeck ? [297, 167] : 'a4', isWidescreenDeck ? 'landscape' : 'portrait');
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    pdf.setDrawColor(20, 20, 20);
    pdf.setLineWidth(0.9);
    pdf.line(margin, 28, pageWidth - margin, 28);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(15, 15, 15);
    pdf.text('[YOUR BRAND / ARTIST NAME]', margin, 20);

    pdf.setFont('courier', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(255, 30, 30);
    pdf.text(`${(product.subcategory || family).toUpperCase()} MASTER SPREAD`, pageWidth - margin, 20, {
      align: 'right',
    });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(40, 40, 40);
    const guideText =
      family === 'Business Documents'
        ? 'Commercial Document Ready Sheet: Pair this layout with the included layered SVG file to insert your client address, line-item table, tax/payment terms, and executive signature seal.'
        : family === 'Artist Branding & Press'
          ? 'Official Press & EPK Sheet: Replace bracketed sections in the layered SVG or submit a customization request in your Artist Workspace to tailor photography, streaming milestones, and booking details.'
          : 'Brand Governance Master: Apply your registered wordmark, hex color swatches, typography hierarchy, and clear-space grid across all digital and print assets.';
    const guideLines = pdf.splitTextToSize(guideText, contentWidth);
    pdf.text(guideLines, margin, 38);

    // Structured Wireframe Table Box
    const gridY = 58;
    pdf.setFillColor(248, 248, 248);
    pdf.setDrawColor(210, 210, 210);
    pdf.rect(margin, gridY, contentWidth, Math.min(72, pageHeight - gridY - 26), 'FD');
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(20, 20, 20);
    pdf.text('EDITABLE CONTENT ZONES (MATCHES INCLUDED SVG ARTBOARD)', margin + 6, gridY + 10);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(70, 70, 70);
    deliverables.slice(0, 4).forEach((d, idx) => {
      pdf.text(`[Section ${idx + 1}]  ${d}`, margin + 6, gridY + 20 + idx * 10);
    });
  }

  return pdf.output('blob');
}

/**
 * Generates an editable vector SVG master template with clean named groups,
 * safe-zone guides, and bracketed editable text placeholders sized to the product.
 */
export function generateEditableProductSvgBlob(product: CreativeProduct): Blob {
  const family = resolveProductFamily(product);
  const spec = product.dimensionSpecs[0];
  const isVertical = spec?.aspectRatio?.includes('9:16');
  const isWide = spec?.aspectRatio?.includes('16:9') || spec?.aspectRatio?.includes('21:9') || spec?.aspectRatio?.includes('3:1');
  const width = isVertical ? 1080 : isWide ? 1920 : 1200;
  const height = isVertical ? 1920 : isWide ? 1080 : 1200;
  const isDocument = family === 'Business Documents' || family === 'Artist Branding & Press';
  const bg = isDocument ? '#FAFAFA' : '#080808';
  const fg = isDocument ? '#111111' : '#FFFFFF';
  const muted = isDocument ? '#555555' : '#A3A3A3';
  const border = isDocument ? '#D4D4D4' : '#262626';

  const deliverablesMarkup = (product.deliverablesSummary || [])
    .slice(0, 4)
    .map(
      (item, idx) =>
        `<text x="${Math.round(width * 0.1)}" y="${Math.round(height * (0.58 + idx * 0.065))}" fill="${muted}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(width * 0.022)}" font-weight="500">0${idx + 1}. ${escapeXml(item)}</text>`,
    )
    .join('\n    ');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <g id="background">
    <rect width="${width}" height="${height}" fill="${bg}" />
    <rect x="${Math.round(width * 0.04)}" y="${Math.round(height * 0.04)}" width="${Math.round(width * 0.92)}" height="${Math.round(height * 0.92)}" fill="none" stroke="${border}" stroke-width="2" />
  </g>
  <g id="brand-accent">
    <rect x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.1)}" width="${Math.round(width * 0.12)}" height="6" fill="#FF1E1E" />
    <text x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.16)}" fill="#FF1E1E" font-family="Courier, monospace" font-size="${Math.round(width * 0.018)}" font-weight="700" letter-spacing="3">${escapeXml(family.toUpperCase())} // ${escapeXml(product.audience.toUpperCase())}</text>
  </g>
  <g id="editable-headline">
    <text x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.30)}" fill="${fg}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(width * 0.048)}" font-weight="800">${escapeXml(product.title.slice(0, 38))}</text>
    <text x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.38)}" fill="${muted}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(width * 0.024)}" font-weight="400">${escapeXml(product.subcategory || product.category)} · Edit text &amp; colors in Illustrator / Figma / Inkscape</text>
  </g>
  <g id="deliverable-zones">
    <line x1="${Math.round(width * 0.08)}" y1="${Math.round(height * 0.46)}" x2="${Math.round(width * 0.92)}" y2="${Math.round(height * 0.46)}" stroke="${border}" stroke-width="2" />
    ${deliverablesMarkup}
  </g>
  <g id="footer-specs">
    <text x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.90)}" fill="${muted}" font-family="Courier, monospace" font-size="${Math.round(width * 0.016)}">KEEDOHUB CREATIVE HUB  |  VERSION ${escapeXml(product.version || 'v1.0')}  |  ${width}×${height} ARTBOARD</text>
  </g>
</svg>`;

  return new Blob([svg], { type: 'image/svg+xml' });
}

/**
 * Packages rendered CanvasDesigns (PNG + editable SVG) and/or a structured studio PDF + Spec README
 * into a single downloadable ZIP archive ready to attach as a real client deliverable.
 */
export async function packageProductDeliverablesZip(params: {
  product: CreativeProduct;
  designs?: CanvasDesign[];
  includeDocumentPdf?: boolean;
  workspaceLabel?: string;
}): Promise<Blob> {
  const { product, designs = [], includeDocumentPdf = true, workspaceLabel = 'KeedoHub Studio' } = params;
  const zip = new JSZip();
  const slug = slugifyProductTitle(product.title || 'creative-pack');

  const specText = [
    '========================================================================',
    `KEEDOHUB CREATIVE PRODUCT DELIVERABLE PACK: ${product.title.toUpperCase()}`,
    '========================================================================',
    `Product ID: ${product.id}`,
    `Audience: ${product.audience}`,
    `Product Family: ${resolveProductFamily(product)}`,
    `Category: ${product.category}${product.subcategory ? ` / ${product.subcategory}` : ''}`,
    `Version: ${product.version || 'v1.0'}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    'INCLUDED DELIVERABLES:',
    ...(product.deliverablesSummary.length > 0
      ? product.deliverablesSummary.map((d, i) => `  ${i + 1}. ${d}`)
      : ['  - Studio master template bundle']),
    '',
    'DIMENSION SPECIFICATIONS:',
    ...(product.dimensionSpecs.length > 0
      ? product.dimensionSpecs.map(s => `  - ${s.platform}: ${s.dimensions} (${s.aspectRatio})`)
      : ['  - Standard digital & print master specifications']),
  ].join('\n');

  zip.file('00_PACK_SPECIFICATIONS.txt', specText);

  if (includeDocumentPdf) {
    const pdfBlob = generateStructuredDocumentPdfBlob(product, workspaceLabel);
    zip.file(`01_${slug}_studio_pack.pdf`, pdfBlob);
  }

  const editableSvg = generateEditableProductSvgBlob(product);
  zip.file(`02_${slug}_editable_master.svg`, editableSvg);

  for (let i = 0; i < designs.length; i++) {
    const d = designs[i];
    const dSlug = slugifyProductTitle(d.name || `template-${i + 1}`);
    const svgBlob = renderCanvasDesignToSvgBlob(d);
    zip.file(`03_templates/0${i + 1}_${dSlug}_${d.width}x${d.height}.svg`, svgBlob);
    try {
      const pngBlob = await renderCanvasDesignToRasterBlob(d, 'png');
      zip.file(`03_templates/0${i + 1}_${dSlug}_${d.width}x${d.height}.png`, pngBlob);
    } catch {
      // If headless/canvas unavailable in a unit test environment, keep SVG clean
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}

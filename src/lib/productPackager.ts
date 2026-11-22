import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import type { CreativeProduct } from '../types/creativeProduct';
import type { CanvasDesign } from '../types/designStudio';
import { getConceptGlyphSvg, getThemeColors } from '../components/brand/LogoConcepts';
import { getLineArtItemById } from '../data/lineArtLibrary';
import { getLineArtSvgString } from '../components/common/LineArtRenderer';
import { resolveProductFamily, slugifyProductTitle } from './creativeProductAccess';
import { drawShapeOnCanvas2D, renderShapeToSvgString } from './canvasShapeRenderer';

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
export function renderCanvasDesignToSvgString(
  design: CanvasDesign,
  options?: { shapeRenderer?: typeof renderShapeToSvgString },
): string {
  const { width, height } = design;
  const shapeRenderer = options?.shapeRenderer || renderShapeToSvgString;
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
        svgElements += shapeRenderer(el, width, height);
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
      drawShapeOnCanvas2D(ctx, el, width, height);
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

  // --- PAGE 3 FOR DOCUMENT / PRESS / IDENTITY PACKS: TAILORED STRUCTURED MASTER SPREAD ---
  const spreadKind = detectDocumentSpreadKind(product, family);
  const needsEditableSpread =
    family === 'Business Documents' ||
    family === 'Artist Branding & Press' ||
    family === 'Brand Identity' ||
    spreadKind !== 'generic';

  if (needsEditableSpread) {
    pdf.addPage(isWidescreenDeck ? [297, 167] : 'a4', isWidescreenDeck ? 'landscape' : 'portrait');
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    pdf.setDrawColor(20, 20, 20);
    pdf.setLineWidth(0.9);
    pdf.line(margin, 26, pageWidth - margin, 26);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.setTextColor(15, 15, 15);
    pdf.text(`[${workspaceLabel.toUpperCase()}]`, margin, 19);

    pdf.setFont('courier', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(255, 30, 30);
    pdf.text(`${(product.subcategory || family).toUpperCase()} // MASTER TEMPLATE`, pageWidth - margin, 19, {
      align: 'right',
    });

    if (spreadKind === 'invoice') {
      // Structured Commercial Invoice & Receipt Master
      pdf.setFillColor(248, 248, 248);
      pdf.setDrawColor(215, 215, 215);
      pdf.rect(margin, 32, contentWidth * 0.56, 28, 'FD');
      pdf.rect(margin + contentWidth * 0.6, 32, contentWidth * 0.4, 28, 'FD');

      pdf.setFont('courier', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(255, 30, 30);
      pdf.text('BILL TO / CLIENT ENTITY', margin + 4, 38);
      pdf.text('INVOICE META & STATUS', margin + contentWidth * 0.6 + 4, 38);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(35, 35, 35);
      pdf.text('[Client Organization Name]', margin + 4, 45);
      pdf.text('[Street Address · City · Tax ID / VAT]', margin + 4, 51);
      pdf.text('[billing@client-domain.com]', margin + 4, 57);

      pdf.setFont('courier', 'bold');
      pdf.text('INV NO:   INV-2026-001', margin + contentWidth * 0.6 + 4, 45);
      pdf.text('ISSUED:   [YYYY-MM-DD]', margin + contentWidth * 0.6 + 4, 51);
      pdf.text('TERMS:    NET 14 DAYS · PAID RECEIPT SEAL', margin + contentWidth * 0.6 + 4, 57);

      // Line-Item Table
      let ty = 68;
      pdf.setFillColor(18, 18, 18);
      pdf.rect(margin, ty, contentWidth, 9, 'F');
      pdf.setFont('courier', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(255, 255, 255);
      pdf.text('DESCRIPTION / CREATIVE DELIVERABLE', margin + 4, ty + 6);
      pdf.text('QTY', margin + contentWidth * 0.58, ty + 6);
      pdf.text('UNIT RATE', margin + contentWidth * 0.70, ty + 6);
      pdf.text('TOTAL', margin + contentWidth - 4, ty + 6, { align: 'right' });
      ty += 9;

      const sampleRows = [
        ['[Line Item 01 — Creative Direction & Master Pack]', '1', '$0,000.00', '$0,000.00'],
        ['[Line Item 02 — Deliverable Variants & Source Files]', '1', '$0,000.00', '$0,000.00'],
        ['[Line Item 03 — Commercial Usage & Print Setup]', '1', '$0,000.00', '$0,000.00'],
      ];
      sampleRows.forEach(row => {
        pdf.setDrawColor(225, 225, 225);
        pdf.rect(margin, ty, contentWidth, 10, 'S');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor(30, 30, 30);
        pdf.text(row[0], margin + 4, ty + 6.5);
        pdf.setFont('courier', 'normal');
        pdf.text(row[1], margin + contentWidth * 0.58, ty + 6.5);
        pdf.text(row[2], margin + contentWidth * 0.70, ty + 6.5);
        pdf.text(row[3], margin + contentWidth - 4, ty + 6.5, { align: 'right' });
        ty += 10;
      });

      // Subtotal / Tax / Balance Summary Box
      const sumY = ty + 8;
      pdf.setFillColor(246, 246, 246);
      pdf.setDrawColor(20, 20, 20);
      pdf.rect(margin + contentWidth * 0.54, sumY, contentWidth * 0.46, 28, 'FD');
      pdf.setFont('courier', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(40, 40, 40);
      pdf.text('SUBTOTAL:            $0,000.00', margin + contentWidth * 0.58, sumY + 8);
      pdf.text('TAX / VAT (0%):      $0.00', margin + contentWidth * 0.58, sumY + 15);
      pdf.setTextColor(255, 30, 30);
      pdf.text('TOTAL DUE / PAID:    $0,000.00', margin + contentWidth * 0.58, sumY + 23);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(70, 70, 70);
      pdf.text('BANK REMITTANCE & WIRE INSTRUCTIONS:', margin, sumY + 8);
      pdf.text('[Bank Name · Account / IBAN · SWIFT / Routing Code]', margin, sumY + 15);
      pdf.text('Quote Invoice Number as payment reference.', margin, sumY + 22);
    } else if (spreadKind === 'proposal') {
      // Structured Commercial Proposal & Quotation Layout
      pdf.setFillColor(248, 248, 248);
      pdf.setDrawColor(215, 215, 215);
      pdf.rect(margin, 32, contentWidth, 24, 'FD');
      pdf.setFont('courier', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(255, 30, 30);
      pdf.text('EXECUTIVE SCOPE SUMMARY', margin + 4, 39);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(30, 30, 30);
      pdf.text('[Prepared for Client Organization — Project Objective, Commercial KPIs & Timeline Overview]', margin + 4, 48);

      // Phase Timeline Columns
      const colW = (contentWidth - 8) / 3;
      ['PHASE 01 · DISCOVERY', 'PHASE 02 · PRODUCTION', 'PHASE 03 · HANDOFF'].forEach((label, idx) => {
        const cx = margin + idx * (colW + 4);
        pdf.setFillColor(250, 250, 250);
        pdf.setDrawColor(210, 210, 210);
        pdf.rect(cx, 62, colW, 28, 'FD');
        pdf.setFont('courier', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(15, 15, 15);
        pdf.text(label, cx + 4, 70);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(80, 80, 80);
        pdf.text(`[Week ${idx * 2 + 1}–${idx * 2 + 2} Milestone Scope]`, cx + 4, 79);
      });

      // Priced Quotation Table + Signature Footer
      let pyProp = 98;
      pdf.setFillColor(18, 18, 18);
      pdf.rect(margin, pyProp, contentWidth, 8.5, 'F');
      pdf.setFont('courier', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(255, 255, 255);
      pdf.text('PROPOSAL DELIVERABLE MODULE', margin + 4, pyProp + 5.8);
      pdf.text('ESTIMATED FEE', margin + contentWidth - 4, pyProp + 5.8, { align: 'right' });
      pyProp += 8.5;

      deliverables.slice(0, 3).forEach((d, idx) => {
        pdf.setDrawColor(220, 220, 220);
        pdf.rect(margin, pyProp, contentWidth, 9.5, 'S');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor(25, 25, 25);
        pdf.text(`0${idx + 1}. ${d.slice(0, 75)}`, margin + 4, pyProp + 6.2);
        pdf.setFont('courier', 'bold');
        pdf.text('$[0,000]', margin + contentWidth - 4, pyProp + 6.2, { align: 'right' });
        pyProp += 9.5;
      });

      const sigY = Math.min(pageHeight - 36, pyProp + 14);
      pdf.setDrawColor(40, 40, 40);
      pdf.line(margin, sigY + 14, margin + contentWidth * 0.44, sigY + 14);
      pdf.line(margin + contentWidth * 0.56, sigY + 14, pageWidth - margin, sigY + 14);
      pdf.setFont('courier', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(80, 80, 80);
      pdf.text('CLIENT AUTHORIZED SIGNATURE & DATE', margin, sigY + 20);
      pdf.text('PROVIDER SIGN-OFF & VALIDITY (30 DAYS)', margin + contentWidth * 0.56, sigY + 20);
    } else if (spreadKind === 'deck') {
      // 16:9 Pitch Deck & Presentation Slide Frame Grid
      const frameW = (contentWidth - 8) / 2;
      const frameH = Math.min(48, (pageHeight - 54) / 2);
      const slides = [
        ['SLIDE 01 · PROBLEM & OPPORTUNITY', '[Articulate core market gap & urgency metric]'],
        ['SLIDE 02 · SOLUTION & PRODUCT', '[Core offering architecture + visual showcase]'],
        ['SLIDE 03 · TRACTION & METRICS', '[ARR / Growth % / Retained Clients KPI Strip]'],
        ['SLIDE 04 · ROADMAP & THE ASK', '[Milestone horizon, use of funds & contact desk]'],
      ];
      slides.forEach(([head, body], idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const sx = margin + col * (frameW + 8);
        const sy = 32 + row * (frameH + 6);
        pdf.setFillColor(idx === 0 ? 15 : 247, idx === 0 ? 15 : 247, idx === 0 ? 15 : 247);
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(sx, sy, frameW, frameH, 'FD');
        pdf.setFont('courier', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(255, 30, 30);
        pdf.text(head, sx + 5, sy + 10);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor(idx === 0 ? 235 : 40, idx === 0 ? 235 : 40, idx === 0 ? 235 : 40);
        pdf.text(body, sx + 5, sy + 20);
      });
    } else if (spreadKind === 'epk') {
      // Official Artist EPK / Biography / Press Release Spread
      pdf.setFillColor(16, 16, 16);
      pdf.rect(margin, 32, contentWidth, 24, 'F');
      pdf.setFont('courier', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(255, 30, 30);
      pdf.text('OFFICIAL ARTIST ELECTRONIC PRESS KIT // PRESS & BOOKING ONE-SHEET', margin + 5, 40);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(255, 255, 255);
      pdf.text('[ARTIST STAGE NAME]  —  [PRIMARY GENRE / CITY]', margin + 5, 49);

      const leftW = contentWidth * 0.58;
      pdf.setFillColor(248, 248, 248);
      pdf.setDrawColor(215, 215, 215);
      pdf.rect(margin, 62, leftW, 66, 'FD');
      pdf.rect(margin + leftW + 6, 62, contentWidth - leftW - 6, 66, 'FD');

      pdf.setFont('courier', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(15, 15, 15);
      pdf.text('ARTIST BIOGRAPHY & EDITORIAL NARRATIVE', margin + 5, 70);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(65, 65, 65);
      pdf.text('[Short 50-word curator pitch + 150-word full editorial bio.', margin + 5, 80);
      pdf.text('Pair with high-res press photography & live footage links.]', margin + 5, 87);
      pdf.setFont('courier', 'bold');
      pdf.setTextColor(255, 30, 30);
      pdf.text('KEY DISCOGRAPHY & ISRC/UPC:', margin + 5, 102);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(40, 40, 40);
      pdf.text('• [Latest Single / Album Title] — [Release Date] · [ISRC]', margin + 5, 110);
      pdf.text('• [Focus Track / Feature Highlight] — [Streaming Total]', margin + 5, 117);

      const rx = margin + leftW + 10;
      pdf.setFont('courier', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(15, 15, 15);
      pdf.text('METRICS & BOOKING DESK', rx, 70);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(55, 55, 55);
      pdf.text('Monthly Listeners: [000K+]', rx, 82);
      pdf.text('Editorial Playlists: [List]', rx, 90);
      pdf.text('Press Quotes: "[Publication]"', rx, 98);
      pdf.text('Mgmt Email: [mgmt@domain.com]', rx, 110);
      pdf.text('Booking Agent: [Phone / Desk]', rx, 118);
    } else if (spreadKind === 'brand') {
      // Brand Guidelines, Logo Clear-Space & Color Token Governance Sheet
      pdf.setFillColor(248, 248, 248);
      pdf.setDrawColor(215, 215, 215);
      pdf.rect(margin, 32, contentWidth * 0.48, 50, 'FD');
      pdf.rect(margin + contentWidth * 0.52, 32, contentWidth * 0.48, 50, 'FD');

      pdf.setFont('courier', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(15, 15, 15);
      pdf.text('LOGO CLEAR-SPACE & 3MM BLEED SAFE ZONE', margin + 5, 40);
      pdf.setDrawColor(255, 30, 30);
      pdf.rect(margin + 14, 48, contentWidth * 0.48 - 28, 26, 'S');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('[PRIMARY WORDMARK LOCKUP]', margin + 20, 63);

      const col2X = margin + contentWidth * 0.52 + 5;
      pdf.setFont('courier', 'bold');
      pdf.setFontSize(8);
      pdf.text('APPROVED COLOR TOKENS (HEX / RGB)', col2X, 40);
      const swatches: [string, [number, number, number]][] = [
        ['PRIMARY INK · #0A0A0A', [10, 10, 10]],
        ['SIGNAL ACCENT · #FF1E1E', [255, 30, 30]],
        ['PAPER CANVAS · #FAFAFA', [235, 235, 235]],
      ];
      swatches.forEach(([label, rgb], idx) => {
        const sy = 47 + idx * 11;
        pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
        pdf.rect(col2X, sy, 10, 7, 'F');
        pdf.setFont('courier', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(35, 35, 35);
        pdf.text(label, col2X + 14, sy + 5.2);
      });

      pdf.setFillColor(250, 250, 250);
      pdf.setDrawColor(215, 215, 215);
      pdf.rect(margin, 90, contentWidth, 42, 'FD');
      pdf.setFont('courier', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(15, 15, 15);
      pdf.text('TYPOGRAPHY SCALE & PRINT PRODUCTION CHECKLIST', margin + 5, 98);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(65, 65, 65);
      deliverables.slice(0, 3).forEach((d, idx) => {
        pdf.text(`• ${d}`, margin + 5, 108 + idx * 8);
      });
    } else {
      // Structured Business Document (Profiles, Brochures, Onboarding, Reports, Catalogues)
      const colW = (contentWidth - 8) / 3;
      const bandTitles =
        spreadKind === 'onboarding'
          ? ['01 · WELCOME & SLA', '02 · KICKOFF CHECKLIST', '03 · ASSET HANDOFF']
          : spreadKind === 'brochure'
            ? ['PANEL 1 · COVER / HOOK', 'PANEL 2 · CORE OFFERING', 'PANEL 3 · CONTACT & QR']
            : ['01 · OVERVIEW & VISION', '02 · CAPABILITIES / SKUS', '03 · CREDENTIALS & DESK'];

      bandTitles.forEach((title, idx) => {
        const bx = margin + idx * (colW + 4);
        pdf.setFillColor(248, 248, 248);
        pdf.setDrawColor(210, 210, 210);
        pdf.rect(bx, 32, colW, 74, 'FD');
        pdf.setFont('courier', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(255, 30, 30);
        pdf.text(title, bx + 4, 41);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor(55, 55, 55);
        const zoneText = deliverables[idx] || product.summary || 'Edit section inside SVG artboard';
        const wrapped = pdf.splitTextToSize(zoneText, colW - 8);
        pdf.text(wrapped, bx + 4, 51);
      });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(80, 80, 80);
      pdf.text(
        'Print & Digital Master Guide: Pair this layout with the bundled editable SVG vector artboard to swap copy, tables & logos.',
        margin,
        120,
      );
    }
  }

  return pdf.output('blob');
}

type DocumentSpreadKind =
  | 'invoice'
  | 'proposal'
  | 'deck'
  | 'epk'
  | 'brand'
  | 'onboarding'
  | 'brochure'
  | 'profile'
  | 'generic';

function detectDocumentSpreadKind(product: CreativeProduct, family: string): DocumentSpreadKind {
  const hay = `${product.id} ${product.subcategory} ${product.title}`.toLowerCase();
  if (hay.includes('invoice') || hay.includes('receipt')) return 'invoice';
  if (hay.includes('proposal') || hay.includes('quotation')) return 'proposal';
  if (hay.includes('pitch') || hay.includes('presentation')) return 'deck';
  if (hay.includes('onboarding') || hay.includes('welcome')) return 'onboarding';
  if (hay.includes('brochure') || hay.includes('report')) return 'brochure';
  if (hay.includes('company profile') || hay.includes('catalogue')) return 'profile';
  if (family === 'Artist Branding & Press' || hay.includes('epk') || hay.includes('media kit') || hay.includes('biography') || hay.includes('press release')) return 'epk';
  if (family === 'Brand Identity' || hay.includes('guideline') || hay.includes('logo') || hay.includes('stationery') || hay.includes('letterhead') || hay.includes('business card')) return 'brand';
  return 'generic';
}

/**
 * Generates an editable vector SVG master template with clean named groups,
 * safe-zone guides, and bracketed editable text placeholders tailored to the product domain.
 */
export function generateEditableProductSvgBlob(product: CreativeProduct): Blob {
  const family = resolveProductFamily(product);
  const spreadKind = detectDocumentSpreadKind(product, family);
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
  const panelBg = isDocument ? '#FFFFFF' : '#121212';

  let domainZonesMarkup = '';
  if (spreadKind === 'invoice') {
    domainZonesMarkup = `
    <rect x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.45)}" width="${Math.round(width * 0.84)}" height="${Math.round(height * 0.06)}" fill="#111111" />
    <text x="${Math.round(width * 0.10)}" y="${Math.round(height * 0.49)}" fill="#FFFFFF" font-family="Courier, monospace" font-size="${Math.round(width * 0.017)}" font-weight="700">ITEM DESCRIPTION</text>
    <text x="${Math.round(width * 0.58)}" y="${Math.round(height * 0.49)}" fill="#FFFFFF" font-family="Courier, monospace" font-size="${Math.round(width * 0.017)}" font-weight="700">QTY</text>
    <text x="${Math.round(width * 0.70)}" y="${Math.round(height * 0.49)}" fill="#FFFFFF" font-family="Courier, monospace" font-size="${Math.round(width * 0.017)}" font-weight="700">RATE</text>
    <text x="${Math.round(width * 0.82)}" y="${Math.round(height * 0.49)}" fill="#FFFFFF" font-family="Courier, monospace" font-size="${Math.round(width * 0.017)}" font-weight="700">TOTAL</text>
    <rect x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.52)}" width="${Math.round(width * 0.84)}" height="${Math.round(height * 0.16)}" fill="${panelBg}" stroke="${border}" stroke-width="2" />
    <text x="${Math.round(width * 0.10)}" y="${Math.round(height * 0.58)}" fill="${fg}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(width * 0.02)}">[01. Creative Deliverable Package]</text>
    <text x="${Math.round(width * 0.10)}" y="${Math.round(height * 0.64)}" fill="${muted}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(width * 0.02)}">[02. Production &amp; Commercial Usage Rights]</text>
    <rect x="${Math.round(width * 0.55)}" y="${Math.round(height * 0.72)}" width="${Math.round(width * 0.37)}" height="${Math.round(height * 0.11)}" fill="${panelBg}" stroke="#111111" stroke-width="2" />
    <text x="${Math.round(width * 0.58)}" y="${Math.round(height * 0.78)}" fill="#FF1E1E" font-family="Courier, monospace" font-size="${Math.round(width * 0.022)}" font-weight="700">TOTAL DUE: $0,000.00</text>`;
  } else if (spreadKind === 'proposal') {
    domainZonesMarkup = `
    <rect x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.45)}" width="${Math.round(width * 0.26)}" height="${Math.round(height * 0.18)}" fill="${panelBg}" stroke="${border}" stroke-width="2" />
    <rect x="${Math.round(width * 0.37)}" y="${Math.round(height * 0.45)}" width="${Math.round(width * 0.26)}" height="${Math.round(height * 0.18)}" fill="${panelBg}" stroke="${border}" stroke-width="2" />
    <rect x="${Math.round(width * 0.66)}" y="${Math.round(height * 0.45)}" width="${Math.round(width * 0.26)}" height="${Math.round(height * 0.18)}" fill="${panelBg}" stroke="${border}" stroke-width="2" />
    <text x="${Math.round(width * 0.10)}" y="${Math.round(height * 0.51)}" fill="#FF1E1E" font-family="Courier, monospace" font-size="${Math.round(width * 0.016)}" font-weight="700">PHASE 01 SCOPE</text>
    <text x="${Math.round(width * 0.39)}" y="${Math.round(height * 0.51)}" fill="#FF1E1E" font-family="Courier, monospace" font-size="${Math.round(width * 0.016)}" font-weight="700">PHASE 02 TIMELINE</text>
    <text x="${Math.round(width * 0.68)}" y="${Math.round(height * 0.51)}" fill="#FF1E1E" font-family="Courier, monospace" font-size="${Math.round(width * 0.016)}" font-weight="700">FEE SCHEDULE</text>
    <line x1="${Math.round(width * 0.08)}" y1="${Math.round(height * 0.78)}" x2="${Math.round(width * 0.46)}" y2="${Math.round(height * 0.78)}" stroke="${fg}" stroke-width="2" />
    <text x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.82)}" fill="${muted}" font-family="Courier, monospace" font-size="${Math.round(width * 0.015)}">CLIENT ACCEPTANCE SIGNATURE &amp; DATE</text>`;
  } else if (spreadKind === 'brand') {
    domainZonesMarkup = `
    <rect x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.46)}" width="${Math.round(width * 0.42)}" height="${Math.round(height * 0.24)}" fill="none" stroke="#FF1E1E" stroke-dasharray="8 6" stroke-width="2" />
    <text x="${Math.round(width * 0.12)}" y="${Math.round(height * 0.59)}" fill="${fg}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(width * 0.024)}" font-weight="700">[LOGO CLEAR-SPACE ZONE]</text>
    <rect x="${Math.round(width * 0.54)}" y="${Math.round(height * 0.46)}" width="${Math.round(width * 0.11)}" height="${Math.round(height * 0.11)}" fill="#0A0A0A" stroke="${border}" stroke-width="2" />
    <rect x="${Math.round(width * 0.68)}" y="${Math.round(height * 0.46)}" width="${Math.round(width * 0.11)}" height="${Math.round(height * 0.11)}" fill="#FF1E1E" />
    <rect x="${Math.round(width * 0.82)}" y="${Math.round(height * 0.46)}" width="${Math.round(width * 0.10)}" height="${Math.round(height * 0.11)}" fill="#FAFAFA" stroke="${border}" stroke-width="2" />
    <text x="${Math.round(width * 0.54)}" y="${Math.round(height * 0.63)}" fill="${muted}" font-family="Courier, monospace" font-size="${Math.round(width * 0.016)}">SWATCH TOKENS: #0A0A0A · #FF1E1E · #FAFAFA</text>`;
  } else {
    const deliverablesMarkup = (product.deliverablesSummary || [])
      .slice(0, 4)
      .map(
        (item, idx) =>
          `<text x="${Math.round(width * 0.1)}" y="${Math.round(height * (0.56 + idx * 0.065))}" fill="${muted}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(width * 0.022)}" font-weight="500">0${idx + 1}. ${escapeXml(item)}</text>`,
      )
      .join('\n    ');
    domainZonesMarkup = `
    <line x1="${Math.round(width * 0.08)}" y1="${Math.round(height * 0.46)}" x2="${Math.round(width * 0.92)}" y2="${Math.round(height * 0.46)}" stroke="${border}" stroke-width="2" />
    ${deliverablesMarkup}`;
  }

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
    ${domainZonesMarkup}
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

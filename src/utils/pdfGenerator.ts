import { jsPDF } from 'jspdf';
import { CorporateDocument, BrandGuidelinesData } from '../types';

export interface BusinessCardData {
  fullName: string;
  position: string;
  department: string;
  phone: string;
  email: string;
  website: string;
  socialHandle: string;
  showQr: boolean;
  qrContent: string;
}

/**
 * Generates an A4 corporate document PDF with LYRICAL ENT branding
 */
export const generateCorporateDocumentPdf = (doc: CorporateDocument): void => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Top header rule
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1.2);
  pdf.line(margin, margin + 22, pageWidth - margin, margin + 22);

  // Brand Name & Monogram mark
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.text('LYRICAL ENT', margin, margin + 10);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('RECORD LABEL · PRODUCTION SOUND LAB · ARTIST MANAGEMENT', margin, margin + 15);

  // Company location on right
  pdf.setFontSize(8);
  pdf.setTextColor(40, 40, 40);
  pdf.text('LYRICAL ENT LLC', pageWidth - margin, margin + 8, { align: 'right' });
  pdf.text('London · Los Angeles · Global Operations', pageWidth - margin, margin + 12, { align: 'right' });
  pdf.text('contact@lyricalent.com · www.lyricalent.com', pageWidth - margin, margin + 16, { align: 'right' });

  // Metadata Strip
  let currentY = margin + 30;
  pdf.setFillColor(245, 245, 245);
  pdf.rect(margin, currentY, contentWidth, 14, 'F');
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.3);
  pdf.rect(margin, currentY, contentWidth, 14, 'S');

  pdf.setFontSize(7);
  pdf.setFont('courier', 'normal');
  pdf.setTextColor(100, 100, 100);

  const colWidth = contentWidth / 4;
  pdf.text('DOCUMENT REF', margin + 4, currentY + 5);
  pdf.text('DATE ISSUED', margin + colWidth + 4, currentY + 5);
  pdf.text('DOCUMENT TYPE', margin + colWidth * 2 + 4, currentY + 5);
  pdf.text('STATUS', margin + colWidth * 3 + 4, currentY + 5);

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(0, 0, 0);
  pdf.text(doc.referenceNo || 'LYR-DOC-2026', margin + 4, currentY + 10);
  pdf.text(doc.date || '2026-10-23', margin + colWidth + 4, currentY + 10);
  pdf.text(doc.type.toUpperCase().replace('_', ' '), margin + colWidth * 2 + 4, currentY + 10);
  pdf.text(doc.status.toUpperCase(), margin + colWidth * 3 + 4, currentY + 10);

  currentY += 22;

  // Recipient Box
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(110, 110, 110);
  pdf.text('PREPARED FOR / ADDRESSEE:', margin, currentY);

  currentY += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  pdf.text(doc.recipientName, margin, currentY);

  if (doc.recipientOrg) {
    currentY += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(50, 50, 50);
    pdf.text(doc.recipientOrg, margin, currentY);
  }

  if (doc.recipientAddress) {
    currentY += 4;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(70, 70, 70);
    const splitAddr = pdf.splitTextToSize(doc.recipientAddress, contentWidth / 2);
    pdf.text(splitAddr, margin, currentY);
    currentY += (splitAddr.length - 1) * 3.5;
  }

  if (doc.recipientEmail) {
    currentY += 4;
    pdf.setFont('courier', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(80, 80, 80);
    pdf.text(`Email: ${doc.recipientEmail}`, margin, currentY);
  }

  currentY += 8;

  // Subject line
  if (doc.subject || doc.title) {
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.4);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 5;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    const subjectText = `RE: ${doc.subject || doc.title}`;
    const splitSubject = pdf.splitTextToSize(subjectText, contentWidth);
    pdf.text(splitSubject, margin, currentY);
    currentY += splitSubject.length * 5;

    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 6;
  }

  // Body content
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(20, 20, 20);
  const splitBody = pdf.splitTextToSize(doc.bodyContent, contentWidth);
  pdf.text(splitBody, margin, currentY);
  currentY += splitBody.length * 4.8 + 6;

  // Items table if invoice or quotation
  if (doc.items && doc.items.length > 0) {
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.6);
    pdf.line(margin, currentY, pageWidth - margin, currentY);

    pdf.setFillColor(248, 248, 248);
    pdf.rect(margin, currentY, contentWidth, 7, 'F');

    pdf.setFont('courier', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);
    pdf.text('DESCRIPTION', margin + 3, currentY + 4.5);
    pdf.text('QTY', pageWidth - margin - 60, currentY + 4.5, { align: 'center' });
    pdf.text('UNIT PRICE', pageWidth - margin - 35, currentY + 4.5, { align: 'right' });
    pdf.text('TOTAL', pageWidth - margin - 3, currentY + 4.5, { align: 'right' });

    currentY += 7;
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.3);

    let grandTotal = 0;
    doc.items.forEach(item => {
      const lineTotal = (item.quantity || 1) * (item.unitPrice || 0);
      grandTotal += lineTotal;

      pdf.line(margin, currentY, pageWidth - margin, currentY);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(30, 30, 30);
      const descLines = pdf.splitTextToSize(item.description, contentWidth - 75);
      pdf.text(descLines, margin + 3, currentY + 4.5);

      pdf.setFont('courier', 'normal');
      pdf.setFontSize(8.5);
      pdf.text(String(item.quantity || 1), pageWidth - margin - 60, currentY + 4.5, { align: 'center' });
      pdf.text(`$${(item.unitPrice || 0).toLocaleString()}`, pageWidth - margin - 35, currentY + 4.5, { align: 'right' });
      
      pdf.setFont('courier', 'bold');
      pdf.text(`$${lineTotal.toLocaleString()}`, pageWidth - margin - 3, currentY + 4.5, { align: 'right' });

      currentY += Math.max(descLines.length * 4.5, 7);
    });

    // Grand total row
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.8);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    pdf.setFillColor(242, 242, 242);
    pdf.rect(margin, currentY, contentWidth, 8, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.text('GRAND TOTAL (USD):', pageWidth - margin - 45, currentY + 5.5, { align: 'right' });

    pdf.setFont('courier', 'bold');
    pdf.setFontSize(10);
    pdf.text(`$${grandTotal.toLocaleString()}`, pageWidth - margin - 3, currentY + 5.5, { align: 'right' });
    currentY += 12;
  }

  // Terms and notes
  if (doc.paymentTerms) {
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(0, 0, 0);
    pdf.text('TERMS & CONDITIONS:', margin, currentY);
    pdf.setFont('courier', 'normal');
    pdf.text(doc.paymentTerms, margin + 36, currentY);
    currentY += 5;
  }

  if (doc.notes) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(8);
    pdf.setTextColor(90, 90, 90);
    const splitNotes = pdf.splitTextToSize(doc.notes, contentWidth);
    pdf.text(splitNotes, margin, currentY);
    currentY += splitNotes.length * 4 + 4;
  }

  // Signature Block at Bottom
  const footerY = Math.max(currentY + 10, pageHeight - 45);
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.line(margin, footerY, pageWidth - margin, footerY);

  // Author details
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(110, 110, 110);
  pdf.text('AUTHORIZED EXECUTIVE SIGNATURE:', margin, footerY + 6);

  pdf.setFont('times', 'italic');
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Ojo Abdulkareem', margin, footerY + 13);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.text(doc.authorName || 'Ojo Abdulkareem', margin, footerY + 18);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(90, 90, 90);
  pdf.text(`${doc.authorRole || 'Managing Director'} · LYRICAL ENT LLC`, margin, footerY + 22);

  // Official Seal box on right
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.8);
  pdf.rect(pageWidth - margin - 32, footerY + 4, 32, 20);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text('LE', pageWidth - margin - 16, footerY + 12, { align: 'center' });

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(5.5);
  pdf.text('OFFICIAL SEAL', pageWidth - margin - 16, footerY + 16, { align: 'center' });
  pdf.setFontSize(4.5);
  pdf.setTextColor(100, 100, 100);
  pdf.text('CATALOG REGISTRY', pageWidth - margin - 16, footerY + 19, { align: 'center' });

  // Page number footer
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(130, 130, 130);
  pdf.text('LYRICAL ENT LLC · 100% PRIVATE & CONFIDENTIAL · NOT FOR UNAUTHORIZED REDISTRIBUTION', margin, pageHeight - 8);
  pdf.text('PAGE 1 OF 1', pageWidth - margin, pageHeight - 8, { align: 'right' });

  // Save PDF
  const filename = `${doc.referenceNo || 'LYRICAL_ENT_DOC'}.pdf`;
  pdf.save(filename);
};

export type BusinessCardTemplateId = 
  | 'executive_black' 
  | 'white_minimal' 
  | 'monogram_signature'
  | 'luxury_black'
  | 'creative_agency'
  | 'music_executive'
  | 'artist_manager'
  | 'producer'
  | 'artist'
  | 'minimal_monogram'
  | 'bold_typography'
  | 'modern_corporate';

export const generateBusinessCardPdf = (
  card: BusinessCardData,
  template: BusinessCardTemplateId | string,
  printReady: boolean = false
): void => {
  // Standard card is 90x54 mm. With 3mm bleed on each side, canvas is 96x60 mm.
  const bleed = printReady ? 3 : 0;
  const widthMm = 90 + bleed * 2;
  const heightMm = 54 + bleed * 2;

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [widthMm, heightMm]
  });

  const renderFront = (isSecondPage: boolean = false) => {
    if (isSecondPage) pdf.addPage([widthMm, heightMm], 'landscape');

    const originX = bleed;
    const originY = bleed;
    const cardW = 90;
    const cardH = 54;

    // Draw background
    if (template === 'executive_black') {
      pdf.setFillColor(12, 12, 12);
      pdf.rect(0, 0, widthMm, heightMm, 'F');
      
      // Subtle architectural grid line
      pdf.setDrawColor(35, 35, 35);
      pdf.setLineWidth(0.4);
      pdf.line(originX + 8, originY + 22, originX + cardW - 8, originY + 22);

      // Header Brand
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(255, 255, 255);
      pdf.text('LYRICAL ENT', originX + 8, originY + 12);

      pdf.setFont('courier', 'normal');
      pdf.setFontSize(5);
      pdf.setTextColor(160, 160, 160);
      pdf.text('RECORD LABEL & PRODUCTION LAB', originX + 8, originY + 17);

      // Person Name
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255);
      pdf.text(card.fullName, originX + 8, originY + 30);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(200, 200, 200);
      pdf.text(card.position, originX + 8, originY + 34);

      pdf.setFont('courier', 'normal');
      pdf.setFontSize(5.5);
      pdf.setTextColor(140, 140, 140);
      pdf.text(card.department.toUpperCase(), originX + 8, originY + 38);

      // Contact details on right
      const contactX = originX + cardW - 8;
      pdf.setFont('courier', 'normal');
      pdf.setFontSize(5.5);
      pdf.setTextColor(180, 180, 180);
      pdf.text(card.phone, contactX, originY + 30, { align: 'right' });
      pdf.text(card.email, contactX, originY + 34, { align: 'right' });
      pdf.text(card.website, contactX, originY + 38, { align: 'right' });
      pdf.text(card.socialHandle, contactX, originY + 42, { align: 'right' });

      // Monogram mark top right
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(0.4);
      pdf.rect(contactX - 10, originY + 8, 10, 10);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(255, 255, 255);
      pdf.text('LE', contactX - 5, originY + 14.5, { align: 'center' });

    } else if (template === 'white_minimal') {
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, widthMm, heightMm, 'F');

      // Subtle border
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.6);
      pdf.rect(originX + 5, originY + 5, cardW - 10, cardH - 10);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text('LYRICAL ENT', originX + 9, originY + 14);

      pdf.setFont('courier', 'normal');
      pdf.setFontSize(5);
      pdf.setTextColor(100, 100, 100);
      pdf.text('RECORD LABEL & STUDIO', originX + 9, originY + 18);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.setTextColor(0, 0, 0);
      pdf.text(card.fullName, originX + 9, originY + 28);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(80, 80, 80);
      pdf.text(card.position, originX + 9, originY + 32);

      pdf.setFont('courier', 'normal');
      pdf.setFontSize(5);
      pdf.setTextColor(120, 120, 120);
      pdf.text(card.department.toUpperCase(), originX + 9, originY + 36);

      const contactX = originX + cardW - 9;
      pdf.setFont('courier', 'normal');
      pdf.setFontSize(5.5);
      pdf.setTextColor(40, 40, 40);
      pdf.text(card.phone, contactX, originY + 28, { align: 'right' });
      pdf.text(card.email, contactX, originY + 32, { align: 'right' });
      pdf.text(card.website, contactX, originY + 36, { align: 'right' });
      pdf.text(card.socialHandle, contactX, originY + 40, { align: 'right' });

      // Clean LE monogram
      pdf.setFillColor(0, 0, 0);
      pdf.rect(contactX - 9, originY + 9, 9, 9, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      pdf.setTextColor(255, 255, 255);
      pdf.text('LE', contactX - 4.5, originY + 15, { align: 'center' });

    } else { // monogram_signature
      pdf.setFillColor(18, 18, 18);
      pdf.rect(0, 0, widthMm, heightMm, 'F');

      // Left stark band
      pdf.setFillColor(0, 0, 0);
      pdf.rect(originX, originY, 26, cardH, 'F');

      // LE monogram on left band
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(0.5);
      pdf.rect(originX + 6, originY + 12, 14, 14);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255);
      pdf.text('LE', originX + 13, originY + 21, { align: 'center' });

      pdf.setFont('courier', 'bold');
      pdf.setFontSize(4.5);
      pdf.text('LYRICAL', originX + 13, originY + 32, { align: 'center' });
      pdf.text('STUDIO', originX + 13, originY + 35, { align: 'center' });

      // Right Content
      const mainX = originX + 32;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10.5);
      pdf.setTextColor(255, 255, 255);
      pdf.text(card.fullName, mainX, originY + 16);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(200, 200, 200);
      pdf.text(card.position, mainX, originY + 21);

      pdf.setFont('courier', 'normal');
      pdf.setFontSize(5.5);
      pdf.setTextColor(140, 140, 140);
      pdf.text(card.department.toUpperCase(), mainX, originY + 25);

      pdf.setDrawColor(50, 50, 50);
      pdf.setLineWidth(0.3);
      pdf.line(mainX, originY + 28, originX + cardW - 8, originY + 28);

      pdf.setFont('courier', 'normal');
      pdf.setFontSize(5.5);
      pdf.setTextColor(180, 180, 180);
      pdf.text(`TEL: ${card.phone}`, mainX, originY + 34);
      pdf.text(`MAIL: ${card.email}`, mainX, originY + 38);
      pdf.text(`WEB: ${card.website}`, mainX, originY + 42);
      pdf.text(`TAG: ${card.socialHandle}`, mainX, originY + 46);
    }

    // If print ready with bleed, draw crop marks
    if (printReady) {
      drawCropMarks(pdf, bleed, cardW, cardH);
    }
  };

  const renderBack = () => {
    pdf.addPage([widthMm, heightMm], 'landscape');

    const originX = bleed;
    const originY = bleed;
    const cardW = 90;
    const cardH = 54;

    if (template === 'executive_black') {
      pdf.setFillColor(8, 8, 8);
      pdf.rect(0, 0, widthMm, heightMm, 'F');

      // Concentric vinyl groove circles
      pdf.setDrawColor(24, 24, 24);
      pdf.setLineWidth(0.3);
      pdf.circle(originX + cardW / 2, originY + cardH / 2, 22);
      pdf.circle(originX + cardW / 2, originY + cardH / 2, 16);
      pdf.circle(originX + cardW / 2, originY + cardH / 2, 10);

      // Center framed monogram
      pdf.setFillColor(0, 0, 0);
      pdf.rect(originX + cardW / 2 - 8, originY + cardH / 2 - 8, 16, 16, 'F');
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(0.6);
      pdf.rect(originX + cardW / 2 - 8, originY + cardH / 2 - 8, 16, 16, 'S');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(255, 255, 255);
      pdf.text('LE', originX + cardW / 2, originY + cardH / 2 + 3.5, { align: 'center' });

      // Subline
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(255, 255, 255);
      pdf.text('LYRICAL ENT', originX + cardW / 2, originY + cardH - 8, { align: 'center' });

      pdf.setFont('courier', 'normal');
      pdf.setFontSize(4.5);
      pdf.setTextColor(150, 150, 150);
      pdf.text('LONDON · LOS ANGELES · ENTERTAINMENT GROUP', originX + cardW / 2, originY + cardH - 5, { align: 'center' });

    } else if (template === 'white_minimal') {
      pdf.setFillColor(250, 250, 250);
      pdf.rect(0, 0, widthMm, heightMm, 'F');

      // Minimal geometric box
      pdf.setFillColor(0, 0, 0);
      pdf.rect(originX + cardW / 2 - 9, originY + cardH / 2 - 12, 18, 18, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(255, 255, 255);
      pdf.text('LE', originX + cardW / 2, originY + cardH / 2 - 0.5, { align: 'center' });

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(0, 0, 0);
      pdf.text('LYRICAL ENT', originX + cardW / 2, originY + cardH / 2 + 12, { align: 'center' });

      pdf.setFont('courier', 'normal');
      pdf.setFontSize(4.5);
      pdf.setTextColor(120, 120, 120);
      pdf.text('www.lyricalent.com', originX + cardW / 2, originY + cardH / 2 + 16, { align: 'center' });

    } else { // monogram_signature
      pdf.setFillColor(10, 10, 10);
      pdf.rect(0, 0, widthMm, heightMm, 'F');

      // Watermark monogram large
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(48);
      pdf.setTextColor(20, 20, 20);
      pdf.text('LE', originX + cardW / 2, originY + cardH / 2 + 16, { align: 'center' });

      // Foreground lockup
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(255, 255, 255);
      pdf.text('LYRICAL ENT', originX + cardW / 2, originY + cardH / 2 - 3, { align: 'center' });

      pdf.setFont('courier', 'normal');
      pdf.setFontSize(5);
      pdf.setTextColor(180, 180, 180);
      pdf.text('ARTIST DEVELOPMENT & SOUND ARCHITECTURE', originX + cardW / 2, originY + cardH / 2 + 2, { align: 'center' });
    }

    if (printReady) {
      drawCropMarks(pdf, bleed, cardW, cardH);
    }
  };

  // Render Front & Back
  renderFront(false);
  renderBack();

  const filePrefix = printReady ? 'LYRICAL_BUSINESS_CARD_PRINT_READY_3MM' : 'LYRICAL_BUSINESS_CARD_DIGITAL';
  pdf.save(`${filePrefix}_${card.fullName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`);
};

/**
 * Draws standard offset trim/crop marks for printing press
 */
function drawCropMarks(pdf: jsPDF, bleed: number, cardW: number, cardH: number) {
  const lineLen = 3;
  const offset = 1;
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(0.25);

  const corners = [
    { x: bleed, y: bleed },
    { x: bleed + cardW, y: bleed },
    { x: bleed, y: bleed + cardH },
    { x: bleed + cardW, y: bleed + cardH }
  ];

  corners.forEach(c => {
    // horizontal mark
    const hStartX = c.x === bleed ? c.x - offset - lineLen : c.x + offset;
    const hEndX = c.x === bleed ? c.x - offset : c.x + offset + lineLen;
    pdf.line(hStartX, c.y, hEndX, c.y);

    // vertical mark
    const vStartY = c.y === bleed ? c.y - offset - lineLen : c.y + offset;
    const vEndY = c.y === bleed ? c.y - offset : c.y + offset + lineLen;
    pdf.line(c.x, vStartY, c.x, vEndY);
  });
}

/**
 * Generates official Brand Guidelines multi-page PDF
 */
export const generateBrandGuidelinesPdf = (guidelines: BrandGuidelinesData): void => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // --- PAGE 1: COVER ---
  pdf.setFillColor(10, 10, 10);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Decorative frame
  pdf.setDrawColor(40, 40, 40);
  pdf.setLineWidth(0.8);
  pdf.rect(margin - 5, margin - 5, contentWidth + 10, pageHeight - margin * 2 + 10);

  // Big Monogram box
  pdf.setFillColor(0, 0, 0);
  pdf.rect(margin, margin + 40, 40, 40, 'F');
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(1.2);
  pdf.rect(margin, margin + 40, 40, 40, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.setTextColor(255, 255, 255);
  pdf.text('LE', margin + 20, margin + 65, { align: 'center' });

  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.setTextColor(255, 255, 255);
  pdf.text('LYRICAL ENT', margin, margin + 110);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(14);
  pdf.setTextColor(180, 180, 180);
  pdf.text('OFFICIAL BRAND IDENTITY & DESIGN CONSTITUTION', margin, margin + 120);

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  pdf.text('VERSION 2.4.0 — MASTER RELEASE', margin, margin + 130);

  pdf.setDrawColor(80, 80, 80);
  pdf.setLineWidth(0.5);
  pdf.line(margin, margin + 140, pageWidth - margin, margin + 140);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(180, 180, 180);
  const introText = 'This brand manual establishes the mandatory visual identity, typographic standards, logo exclusion zones, and production specifications for LYRICAL ENT LLC, its recording artists, subsidiaries, packaging, and digital channels worldwide.';
  const splitIntro = pdf.splitTextToSize(introText, contentWidth - 10);
  pdf.text(splitIntro, margin, margin + 150);

  // Footer Cover
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(140, 140, 140);
  pdf.text('CONFIDENTIAL DOCUMENT · STRICTLY ENFORCED · LYRICAL ENT LLC', margin, pageHeight - margin);
  pdf.text('ISSUED: 2026', pageWidth - margin, pageHeight - margin, { align: 'right' });

  // --- PAGE 2: LOGO SYSTEM & CLEAR SPACE ---
  pdf.addPage('a4', 'portrait');
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Page Header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text('01. OFFICIAL LOGO SYSTEM & EXCLUSION RULES', margin, margin + 5);

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(120, 120, 120);
  pdf.text('LYRICAL ENT BRAND MANUAL · PAGE 2', pageWidth - margin, margin + 5, { align: 'right' });

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.8);
  pdf.line(margin, margin + 8, pageWidth - margin, margin + 8);

  let py = margin + 18;

  // Box 1: Primary Lockup
  pdf.setFillColor(245, 245, 245);
  pdf.rect(margin, py, contentWidth, 38, 'F');
  pdf.setDrawColor(210, 210, 210);
  pdf.rect(margin, py, contentWidth, 38, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('LYRICAL ENT', margin + 10, py + 18);
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 100, 100);
  pdf.text('PRIMARY MASTER LOCKUP — COMBINES FRAMED MONOGRAM & WORDMARK', margin + 10, py + 25);

  py += 46;

  // Clear space explanation
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text('EXCLUSION ZONE (CLEAR SPACE)', margin, py);

  py += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(40, 40, 40);
  const clearSpaceLines = pdf.splitTextToSize(guidelines.clearSpaceRules, contentWidth);
  pdf.text(clearSpaceLines, margin, py);

  py += clearSpaceLines.length * 4.5 + 8;

  // Minimum Size Specification
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text('MINIMUM REPRODUCTION SIZES', margin, py);

  py += 6;
  pdf.setFillColor(248, 248, 248);
  pdf.rect(margin, py, contentWidth / 2 - 4, 18, 'F');
  pdf.rect(margin + contentWidth / 2 + 4, py, contentWidth / 2 - 4, 18, 'F');

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(0, 0, 0);
  pdf.text('PRINT REPRODUCTION', margin + 6, py + 7);
  pdf.text('DIGITAL DISPLAY', margin + contentWidth / 2 + 10, py + 7);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text(guidelines.minLogoSizePrint, margin + 6, py + 13);
  pdf.text(guidelines.minLogoSizeDigital, margin + contentWidth / 2 + 10, py + 13);

  py += 26;

  // Background rules
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text('SURFACE & BACKGROUND RULES', margin, py);

  py += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(40, 40, 40);
  const bgLines = pdf.splitTextToSize(guidelines.backgroundRules, contentWidth);
  pdf.text(bgLines, margin, py);

  // --- PAGE 3: PALETTE & TYPOGRAPHY ---
  pdf.addPage('a4', 'portrait');
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text('02. COLOUR PALETTE & TYPOGRAPHIC STANDARDS', margin, margin + 5);

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(120, 120, 120);
  pdf.text('LYRICAL ENT BRAND MANUAL · PAGE 3', pageWidth - margin, margin + 5, { align: 'right' });

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.8);
  pdf.line(margin, margin + 8, pageWidth - margin, margin + 8);

  py = margin + 18;

  // Color Swatches
  const swatches = [
    { name: 'Absolute Black', hex: '#000000', rgb: '0, 0, 0', cmyk: '60, 40, 40, 100', bg: [0, 0, 0], text: [255, 255, 255] },
    { name: 'Pure White', hex: '#FFFFFF', rgb: '255, 255, 255', cmyk: '0, 0, 0, 0', bg: [255, 255, 255], text: [0, 0, 0], border: true },
    { name: 'Charcoal Noir', hex: '#171717', rgb: '23, 23, 23', cmyk: '50, 40, 40, 90', bg: [23, 23, 23], text: [255, 255, 255] },
    { name: 'Neutral Grey', hex: '#A3A3A3', rgb: '163, 163, 163', cmyk: '0, 0, 0, 40', bg: [163, 163, 163], text: [0, 0, 0] }
  ];

  const swatchW = (contentWidth - 9) / 4;
  swatches.forEach((sw, i) => {
    const sx = margin + i * (swatchW + 3);
    pdf.setFillColor(sw.bg[0], sw.bg[1], sw.bg[2]);
    pdf.rect(sx, py, swatchW, 26, 'F');
    if (sw.border) {
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(sx, py, swatchW, 26, 'S');
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(0, 0, 0);
    pdf.text(sw.name, sx, py + 32);

    pdf.setFont('courier', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(90, 90, 90);
    pdf.text(sw.hex, sx, py + 36);
    pdf.text(`RGB: ${sw.rgb}`, sx, py + 40);
  });

  py += 50;

  // Typography Section
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text('APPROVED TYPOGRAPHY MATRIX', margin, py);

  py += 6;
  pdf.setFillColor(248, 248, 248);
  pdf.rect(margin, py, contentWidth, 34, 'F');
  pdf.setDrawColor(220, 220, 220);
  pdf.rect(margin, py, contentWidth, 34, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Plus Jakarta Sans — Primary Headline & Display Font', margin + 6, py + 10);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(70, 70, 70);
  pdf.text('Used for track titles, billboard campaign graphics, executive covers, and brand headers.', margin + 6, py + 16);

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(0, 0, 0);
  pdf.text('JetBrains Mono — Technical Metadata & Document Figures', margin + 6, py + 24);
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(70, 70, 70);
  pdf.text('ISRC identifiers, legal split percentages, timestamp codes, and invoices.', margin + 6, py + 29);

  py += 44;

  // Brand Voice & Art Direction
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text('BRAND VOICE & EDITORIAL TONE', margin, py);

  py += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(40, 40, 40);
  const voiceLines = pdf.splitTextToSize(guidelines.brandVoice, contentWidth);
  pdf.text(voiceLines, margin, py);

  py += voiceLines.length * 4.5 + 8;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text('PHOTOGRAPHY & ART DIRECTION', margin, py);

  py += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(40, 40, 40);
  const photoLines = pdf.splitTextToSize(guidelines.photographyDirection, contentWidth);
  pdf.text(photoLines, margin, py);

  // --- PAGE 4: PROHIBITIONS & INCORRECT USAGE ---
  pdf.addPage('a4', 'portrait');
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text('03. INCORRECT LOGO USAGE & DESIGN DISCIPLINE', margin, margin + 5);

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(120, 120, 120);
  pdf.text('LYRICAL ENT BRAND MANUAL · PAGE 4', pageWidth - margin, margin + 5, { align: 'right' });

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.8);
  pdf.line(margin, margin + 8, pageWidth - margin, margin + 8);

  py = margin + 18;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text('STRICTLY PROHIBITED TREATMENTS', margin, py);

  py += 8;

  guidelines.incorrectUsageRules.forEach((rule, idx) => {
    pdf.setFillColor(255, 245, 245);
    pdf.rect(margin, py, contentWidth, 11, 'F');
    pdf.setDrawColor(240, 200, 200);
    pdf.rect(margin, py, contentWidth, 11, 'S');

    pdf.setFont('courier', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(180, 0, 0);
    pdf.text(`[VIOLATION 0${idx + 1}]`, margin + 4, py + 7);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(40, 40, 40);
    pdf.text(rule, margin + 35, py + 7);

    py += 14;
  });

  py += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text('CONTACT & EXECUTIVE ENQUIRIES', margin, py);

  py += 6;
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(60, 60, 60);
  pdf.text('LYRICAL ENT LLC · Brand Governance Directorate', margin, py);
  pdf.text('London Sound Labs: 42 Bermondsey St, London SE1 3UD', margin, py + 5);
  pdf.text('Los Angeles Sound Labs: 7200 Santa Monica Blvd, West Hollywood, CA 90046', margin, py + 10);
  pdf.text('Email: brand@lyricalent.com · Web: www.lyricalent.com', margin, py + 15);

  pdf.save('LYRICAL_ENT_BRAND_GUIDELINES_v2.4.pdf');
};

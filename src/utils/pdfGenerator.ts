import { jsPDF } from 'jspdf';
import type {
  BrandGuidelinesData,
  CorporateDocument,
  InvoiceRecord,
  ProposalRecord,
  Workspace,
} from '../types';
import { formatMoney } from '../lib/financeDocuments';

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

export interface BusinessCardBrandOptions {
  workspaceName?: string;
  monogram?: string;
  tagline?: string;
  website?: string;
}

export interface SplitSheetPdfParams {
  referenceNo?: string;
  title: string;
  isrc?: string;
  artistName: string;
  workspaceName?: string;
  executionDate: string;
  contributors: Array<{
    name: string;
    role: string;
    percent: number;
    pro?: string;
    ipi?: string;
  }>;
  notes?: string;
}

export interface ArtistEpkPdfParams {
  artistName: string;
  genre?: string;
  biography: string;
  workspaceName?: string;
  links?: {
    spotify?: string;
    appleMusic?: string;
    youtube?: string;
    instagram?: string;
    website?: string;
  };
  releases?: Array<{
    title: string;
    type: string;
    releaseDate?: string;
    distributionStatus?: string;
    isrc?: string;
  }>;
}

export interface TracklistCreditsPdfParams {
  releaseTitle: string;
  artistName: string;
  releaseType: string;
  releaseDate?: string;
  upc?: string;
  isrc?: string;
  rightsInfo?: string;
  workspaceName?: string;
  tracks: Array<{
    trackNumber: number;
    title: string;
    featuredArtists?: string;
    producer?: string;
    songwriters?: string;
    duration?: string;
    isrc?: string;
  }>;
}

export function deriveWorkspaceMonogram(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return 'KH';
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase();
  }
  return cleaned.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'KH';
}

function deriveWorkspaceBrandMeta(workspace?: Partial<Workspace>) {
  const name = workspace?.name?.trim() || workspace?.brand?.name?.trim() || 'KeedoHub Client';
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'keedohub';
  const monogram = deriveWorkspaceMonogram(name);
  const tagline =
    workspace?.brand?.tagline?.trim() || 'CREATIVE PRODUCTION · ASSET MANAGEMENT · BRAND SYSTEM';
  const email = workspace?.contactEmail?.trim() || `hello@${slug}.com`;
  const website = `www.${slug}.com`;
  return { name, slug, monogram, tagline, email, website };
}

/**
 * jsPDF built-in Helvetica lacks the Unicode Naira glyph (U+20A6),
 * so normalize Naira prefix cleanly to "NGN " inside exported PDFs.
 */
function formatPdfMoney(amount: number, currency: string = 'USD'): string {
  return formatMoney(amount, currency).replace('₦', 'NGN ');
}

function ensurePageSpace(pdf: jsPDF, currentY: number, neededMm: number, pageHeight = 297, margin = 20): number {
  if (currentY + neededMm <= pageHeight - margin) {
    return currentY;
  }
  pdf.addPage('a4', 'portrait');
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, 210, pageHeight, 'F');
  return margin;
}

/**
 * Generates an A4 workspace document PDF with dynamic workspace branding
 */
export const generateCorporateDocumentPdf = (doc: CorporateDocument, workspace: Workspace): void => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const brand = deriveWorkspaceBrandMeta(workspace);
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const currency = doc.currency || 'USD';

  // Background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Top header rule
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1.2);
  pdf.line(margin, margin + 22, pageWidth - margin, margin + 22);

  // Workspace Name & Tagline
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.text(brand.name, margin, margin + 10);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(100, 100, 100);
  pdf.text(brand.tagline.toUpperCase().slice(0, 68), margin, margin + 15);

  // Issuer contact on right
  pdf.setFontSize(8);
  pdf.setTextColor(40, 40, 40);
  pdf.text(brand.name, pageWidth - margin, margin + 8, { align: 'right' });
  pdf.text('KeedoHub Workspace Document', pageWidth - margin, margin + 12, { align: 'right' });
  pdf.text(brand.email, pageWidth - margin, margin + 16, { align: 'right' });

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

  const fallbackRef = `KH-DOC-${(doc.date || new Date().toISOString().slice(0, 10)).replace(/-/g, '')}`;
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(0, 0, 0);
  pdf.text(doc.referenceNo || fallbackRef, margin + 4, currentY + 10);
  pdf.text(doc.date || new Date().toISOString().slice(0, 10), margin + colWidth + 4, currentY + 10);
  pdf.text(doc.type.toUpperCase().replace(/_/g, ' ').slice(0, 18), margin + colWidth * 2 + 4, currentY + 10);
  pdf.text((doc.status || 'Draft').toUpperCase(), margin + colWidth * 3 + 4, currentY + 10);

  currentY += 22;

  // Recipient Box
  if (doc.recipientName || doc.recipientOrg || doc.recipientEmail || doc.recipientAddress) {
    pdf.setFont('courier', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(110, 110, 110);
    pdf.text('PREPARED FOR / ADDRESSEE:', margin, currentY);

    if (doc.recipientName) {
      currentY += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.text(doc.recipientName, margin, currentY);
    }

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
  }

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

  // Body content with multi-page wrapping
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(20, 20, 20);
  const splitBody: string[] = pdf.splitTextToSize(doc.bodyContent || '', contentWidth);
  for (const line of splitBody) {
    currentY = ensurePageSpace(pdf, currentY, 6, pageHeight, margin + 15);
    pdf.text(line, margin, currentY);
    currentY += 4.7;
  }
  currentY += 4;

  // Legacy items table support (kept for reading archived legacy docs)
  if (doc.items && doc.items.length > 0) {
    currentY = ensurePageSpace(pdf, currentY, 30, pageHeight, margin + 15);
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
      currentY = ensurePageSpace(pdf, currentY, 10, pageHeight, margin + 15);
      pdf.line(margin, currentY, pageWidth - margin, currentY);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(30, 30, 30);
      const descLines = pdf.splitTextToSize(item.description, contentWidth - 75);
      pdf.text(descLines, margin + 3, currentY + 4.5);

      pdf.setFont('courier', 'normal');
      pdf.setFontSize(8.5);
      pdf.text(String(item.quantity || 1), pageWidth - margin - 60, currentY + 4.5, { align: 'center' });
      pdf.text(formatPdfMoney(item.unitPrice || 0, currency), pageWidth - margin - 35, currentY + 4.5, { align: 'right' });

      pdf.setFont('courier', 'bold');
      pdf.text(formatPdfMoney(lineTotal, currency), pageWidth - margin - 3, currentY + 4.5, { align: 'right' });

      currentY += Math.max(descLines.length * 4.5, 7);
    });

    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.8);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    pdf.setFillColor(242, 242, 242);
    pdf.rect(margin, currentY, contentWidth, 8, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`TOTAL (${currency}):`, pageWidth - margin - 45, currentY + 5.5, { align: 'right' });

    pdf.setFont('courier', 'bold');
    pdf.setFontSize(10);
    pdf.text(formatPdfMoney(doc.totalAmount ?? grandTotal, currency), pageWidth - margin - 3, currentY + 5.5, {
      align: 'right',
    });
    currentY += 12;
  }

  // Terms and notes
  if (doc.paymentTerms) {
    currentY = ensurePageSpace(pdf, currentY, 10, pageHeight, margin + 15);
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(0, 0, 0);
    pdf.text('TERMS & CONDITIONS:', margin, currentY);
    pdf.setFont('courier', 'normal');
    pdf.text(doc.paymentTerms, margin + 36, currentY);
    currentY += 5;
  }

  if (doc.notes) {
    currentY = ensurePageSpace(pdf, currentY, 12, pageHeight, margin + 15);
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(8);
    pdf.setTextColor(90, 90, 90);
    const splitNotes = pdf.splitTextToSize(doc.notes, contentWidth);
    pdf.text(splitNotes, margin, currentY);
    currentY += splitNotes.length * 4 + 4;
  }

  // Signature Block at Bottom
  currentY = ensurePageSpace(pdf, currentY, 38, pageHeight, margin);
  const footerY = Math.max(currentY + 6, pageHeight - 45);
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.line(margin, footerY, pageWidth - margin, footerY);

  const signatoryName = doc.authorName?.trim() || `${brand.name} Signatory`;
  const signatoryRole = doc.authorRole?.trim() || 'Authorized Representative';

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(110, 110, 110);
  pdf.text('AUTHORIZED WORKSPACE SIGNATORY:', margin, footerY + 6);

  pdf.setFont('times', 'italic');
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text(signatoryName, margin, footerY + 13);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.text(signatoryName, margin, footerY + 18);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(90, 90, 90);
  pdf.text(`${signatoryRole} · ${brand.name}`, margin, footerY + 22);

  // Official Seal box on right
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.8);
  pdf.rect(pageWidth - margin - 32, footerY + 4, 32, 20);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text(brand.monogram, pageWidth - margin - 16, footerY + 12, { align: 'center' });

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(5.5);
  pdf.text('WORKSPACE SEAL', pageWidth - margin - 16, footerY + 16, { align: 'center' });
  pdf.setFontSize(4.5);
  pdf.setTextColor(100, 100, 100);
  pdf.text('KEEDOHUB VERIFIED', pageWidth - margin - 16, footerY + 19, { align: 'center' });

  // Footer strip
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(130, 130, 130);
  pdf.text(`${brand.name} · CONFIDENTIAL WORKSPACE RECORD · SECURED VIA KEEDOHUB`, margin, pageHeight - 8);

  const filename = `${(doc.referenceNo || brand.slug).replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  pdf.save(filename);
};

/**
 * Generates an official KeedoHub Commercial Invoice / Payment Receipt A4 PDF
 */
export const generateCommercialInvoicePdf = (invoice: InvoiceRecord, workspace?: Workspace): void => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const wsName = workspace?.name?.trim() || invoice.recipientOrg || invoice.recipientName || 'Client Workspace';
  const currency = invoice.currency || 'USD';

  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Top Header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.text('KEEDOHUB', margin, margin + 9);

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(95, 95, 95);
  pdf.text('CREATIVE ECOSYSTEM & PRODUCTION PLATFORM · COMMERCIAL BILLING', margin, margin + 14);

  // Status Badge
  const statusLabel = invoice.status.toUpperCase();
  const statusColor: [number, number, number] =
    invoice.status === 'Paid'
      ? [16, 125, 76]
      : invoice.status === 'Overdue'
        ? [185, 28, 28]
        : invoice.status === 'Partially Paid'
          ? [180, 105, 14]
          : invoice.status === 'Void'
            ? [110, 110, 110]
            : [20, 20, 20];
  pdf.setFillColor(...statusColor);
  pdf.rect(pageWidth - margin - 40, margin + 3, 40, 9, 'F');
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text(statusLabel, pageWidth - margin - 20, margin + 9, { align: 'center' });

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1.1);
  pdf.line(margin, margin + 20, pageWidth - margin, margin + 20);

  // Metadata strip
  let currentY = margin + 27;
  pdf.setFillColor(246, 246, 246);
  pdf.rect(margin, currentY, contentWidth, 14, 'F');
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.3);
  pdf.rect(margin, currentY, contentWidth, 14, 'S');

  const colW = contentWidth / 4;
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(6.8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('INVOICE NO', margin + 3, currentY + 5);
  pdf.text('ISSUE DATE', margin + colW + 3, currentY + 5);
  pdf.text('DUE DATE', margin + colW * 2 + 3, currentY + 5);
  pdf.text('CURRENCY', margin + colW * 3 + 3, currentY + 5);

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(0, 0, 0);
  pdf.text(invoice.referenceNo, margin + 3, currentY + 10.5);
  pdf.text(invoice.issueDate || '-', margin + colW + 3, currentY + 10.5);
  pdf.text(invoice.dueDate || 'Upon Receipt', margin + colW * 2 + 3, currentY + 10.5);
  pdf.text(currency, margin + colW * 3 + 3, currentY + 10.5);

  currentY += 22;

  // Billed To Block
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(110, 110, 110);
  pdf.text('BILLED TO CLIENT WORKSPACE:', margin, currentY);
  currentY += 5;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  pdf.text(invoice.recipientName || wsName, margin, currentY);

  if (invoice.recipientOrg || wsName) {
    currentY += 4.5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);
    pdf.text(invoice.recipientOrg || wsName, margin, currentY);
  }
  if (invoice.recipientEmail) {
    currentY += 4.2;
    pdf.setFont('courier', 'normal');
    pdf.setFontSize(8);
    pdf.text(invoice.recipientEmail, margin, currentY);
  }
  if (invoice.recipientAddress) {
    currentY += 4.2;
    const addrLines = pdf.splitTextToSize(invoice.recipientAddress, contentWidth * 0.65);
    pdf.text(addrLines, margin, currentY);
    currentY += (addrLines.length - 1) * 3.8;
  }

  currentY += 8;

  // Title / Subject
  pdf.setDrawColor(215, 215, 215);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10.5);
  pdf.setTextColor(0, 0, 0);
  pdf.text(invoice.title || invoice.subject || 'Commercial Invoice', margin, currentY);
  currentY += 5;
  if (invoice.bodyContent) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.8);
    pdf.setTextColor(45, 45, 45);
    const bodyLines = pdf.splitTextToSize(invoice.bodyContent, contentWidth);
    pdf.text(bodyLines, margin, currentY);
    currentY += bodyLines.length * 4.3 + 4;
  } else {
    currentY += 3;
  }

  // Line items table
  currentY = ensurePageSpace(pdf, currentY, 35, pageHeight, margin + 15);
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.6);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  pdf.setFillColor(246, 246, 246);
  pdf.rect(margin, currentY, contentWidth, 7.5, 'F');

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(7.8);
  pdf.setTextColor(0, 0, 0);
  pdf.text('ITEM DESCRIPTION', margin + 3, currentY + 5);
  pdf.text('QTY', pageWidth - margin - 62, currentY + 5, { align: 'center' });
  pdf.text('UNIT RATE', pageWidth - margin - 35, currentY + 5, { align: 'right' });
  pdf.text('AMOUNT', pageWidth - margin - 3, currentY + 5, { align: 'right' });
  currentY += 7.5;

  pdf.setDrawColor(225, 225, 225);
  pdf.setLineWidth(0.25);

  (invoice.items || []).forEach(item => {
    const qty = Number(item.quantity || 1);
    const rate = Number(item.unitPrice || 0);
    const lineTotal = item.total ?? qty * rate;
    const descLines = pdf.splitTextToSize(item.description || 'Service Item', contentWidth - 76);
    const rowH = Math.max(descLines.length * 4.3 + 2, 7.5);
    currentY = ensurePageSpace(pdf, currentY, rowH + 4, pageHeight, margin + 15);

    pdf.line(margin, currentY, pageWidth - margin, currentY);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(25, 25, 25);
    pdf.text(descLines, margin + 3, currentY + 4.8);

    pdf.setFont('courier', 'normal');
    pdf.setFontSize(8.2);
    pdf.text(String(qty), pageWidth - margin - 62, currentY + 4.8, { align: 'center' });
    pdf.text(formatPdfMoney(rate, currency), pageWidth - margin - 35, currentY + 4.8, { align: 'right' });
    pdf.setFont('courier', 'bold');
    pdf.text(formatPdfMoney(lineTotal, currency), pageWidth - margin - 3, currentY + 4.8, { align: 'right' });

    currentY += rowH;
  });

  // Financial Summary Box
  currentY = ensurePageSpace(pdf, currentY, 40, pageHeight, margin + 15);
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.7);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;

  const summaryXLabel = pageWidth - margin - 50;
  const summaryXVal = pageWidth - margin - 3;

  const drawSummaryRow = (label: string, value: string, bold = false, accent = false) => {
    pdf.setFont('courier', bold ? 'bold' : 'normal');
    pdf.setFontSize(bold ? 9 : 8.2);
    pdf.setTextColor(accent ? 16 : 30, accent ? 125 : 30, accent ? 76 : 30);
    pdf.text(label, summaryXLabel, currentY, { align: 'right' });
    pdf.text(value, summaryXVal, currentY, { align: 'right' });
    currentY += 5.2;
  };

  drawSummaryRow('SUBTOTAL:', formatPdfMoney(invoice.subtotal || 0, currency));
  if ((invoice.discountAmount || 0) > 0) {
    drawSummaryRow('DISCOUNT:', `-${formatPdfMoney(invoice.discountAmount, currency)}`);
  }
  if ((invoice.taxRate || 0) > 0) {
    drawSummaryRow(`TAX (${invoice.taxRate}%):`, formatPdfMoney(invoice.taxAmount || 0, currency));
  }
  drawSummaryRow(`INVOICE TOTAL (${currency}):`, formatPdfMoney(invoice.totalAmount || 0, currency), true);
  drawSummaryRow('AMOUNT PAID:', formatPdfMoney(invoice.totalPaid || 0, currency), false, (invoice.totalPaid || 0) > 0);

  pdf.setFillColor(242, 242, 242);
  pdf.rect(pageWidth - margin - 86, currentY - 3.5, 86, 8, 'F');
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(0, 0, 0);
  pdf.text('BALANCE DUE:', summaryXLabel, currentY + 2, { align: 'right' });
  pdf.text(formatPdfMoney(invoice.balanceDue || 0, currency), summaryXVal, currentY + 2, { align: 'right' });
  currentY += 12;

  // Payment & Receipt Ledger
  if (invoice.payments && invoice.payments.length > 0) {
    currentY = ensurePageSpace(pdf, currentY, 26, pageHeight, margin + 15);
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);
    pdf.text('RECORDED PAYMENTS & RECEIPT LEDGER', margin, currentY);
    currentY += 4;

    invoice.payments.forEach(payment => {
      currentY = ensurePageSpace(pdf, currentY, 8, pageHeight, margin + 15);
      pdf.setFillColor(248, 248, 248);
      pdf.rect(margin, currentY, contentWidth, 6.5, 'F');
      pdf.setFont('courier', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(30, 30, 30);
      pdf.text(
        `${payment.receiptNumber || payment.id} · ${payment.date} · ${payment.method} · Ref: ${payment.reference || 'N/A'}`,
        margin + 3,
        currentY + 4.4,
      );
      pdf.setFont('courier', 'bold');
      pdf.text(formatPdfMoney(payment.amount, currency), pageWidth - margin - 3, currentY + 4.4, {
        align: 'right',
      });
      currentY += 7.5;
    });
    currentY += 4;
  }

  if (invoice.paymentTerms) {
    currentY = ensurePageSpace(pdf, currentY, 10, pageHeight, margin + 10);
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(0, 0, 0);
    pdf.text('PAYMENT TERMS:', margin, currentY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(invoice.paymentTerms, margin + 30, currentY);
    currentY += 5;
  }
  if (invoice.notes) {
    currentY = ensurePageSpace(pdf, currentY, 10, pageHeight, margin + 10);
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(7.8);
    pdf.setTextColor(90, 90, 90);
    const noteLines = pdf.splitTextToSize(invoice.notes, contentWidth);
    pdf.text(noteLines, margin, currentY);
  }

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(130, 130, 130);
  pdf.text(
    `ISSUED BY KEEDOHUB (${invoice.issuedByName || 'PLATFORM ADMIN'}) · SERVER-VERIFIED BILLING RECORD`,
    margin,
    pageHeight - 8,
  );

  pdf.save(`${(invoice.referenceNo || invoice.id).replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
};

/**
 * Generates an official KeedoHub Commercial Proposal / Quotation A4 PDF
 */
export const generateCommercialProposalPdf = (proposal: ProposalRecord, workspace?: Workspace): void => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const wsName = workspace?.name?.trim() || proposal.recipientOrg || proposal.recipientName || 'Client Workspace';
  const currency = proposal.currency || 'USD';

  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.text('KEEDOHUB', margin, margin + 9);

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(95, 95, 95);
  pdf.text(
    `${proposal.type.replace(/_/g, ' ').toUpperCase()} · COMMERCIAL SCOPE & AGREEMENT`,
    margin,
    margin + 14,
  );

  pdf.setFillColor(18, 18, 18);
  pdf.rect(pageWidth - margin - 46, margin + 3, 46, 9, 'F');
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text(proposal.status.toUpperCase(), pageWidth - margin - 23, margin + 9, { align: 'center' });

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1.1);
  pdf.line(margin, margin + 20, pageWidth - margin, margin + 20);

  let currentY = margin + 27;
  pdf.setFillColor(246, 246, 246);
  pdf.rect(margin, currentY, contentWidth, 14, 'F');
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.3);
  pdf.rect(margin, currentY, contentWidth, 14, 'S');

  const colW = contentWidth / 4;
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(6.8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('PROPOSAL REF', margin + 3, currentY + 5);
  pdf.text('ISSUE DATE', margin + colW + 3, currentY + 5);
  pdf.text('VALID UNTIL', margin + colW * 2 + 3, currentY + 5);
  pdf.text('ESTIMATED VALUE', margin + colW * 3 + 3, currentY + 5);

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(0, 0, 0);
  pdf.text(proposal.referenceNo, margin + 3, currentY + 10.5);
  pdf.text(proposal.issueDate || '-', margin + colW + 3, currentY + 10.5);
  pdf.text(proposal.validUntil || 'Open', margin + colW * 2 + 3, currentY + 10.5);
  pdf.text(formatPdfMoney(proposal.totalAmount || 0, currency), margin + colW * 3 + 3, currentY + 10.5);

  currentY += 22;

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(110, 110, 110);
  pdf.text('PREPARED FOR:', margin, currentY);
  currentY += 5;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  pdf.text(proposal.recipientName || wsName, margin, currentY);

  if (proposal.recipientOrg || wsName) {
    currentY += 4.5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);
    pdf.text(proposal.recipientOrg || wsName, margin, currentY);
  }
  currentY += 8;

  pdf.setDrawColor(215, 215, 215);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  pdf.text(proposal.title, margin, currentY);
  currentY += 6;

  if (proposal.bodyContent) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.2);
    pdf.setTextColor(25, 25, 25);
    const bodyLines: string[] = pdf.splitTextToSize(proposal.bodyContent, contentWidth);
    for (const line of bodyLines) {
      currentY = ensurePageSpace(pdf, currentY, 6, pageHeight, margin + 15);
      pdf.text(line, margin, currentY);
      currentY += 4.6;
    }
    currentY += 4;
  }

  if (proposal.items && proposal.items.length > 0) {
    currentY = ensurePageSpace(pdf, currentY, 32, pageHeight, margin + 15);
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.6);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    pdf.setFillColor(246, 246, 246);
    pdf.rect(margin, currentY, contentWidth, 7.5, 'F');
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(7.8);
    pdf.setTextColor(0, 0, 0);
    pdf.text('PROPOSED DELIVERABLE / SCOPE ITEM', margin + 3, currentY + 5);
    pdf.text('QTY', pageWidth - margin - 62, currentY + 5, { align: 'center' });
    pdf.text('RATE', pageWidth - margin - 35, currentY + 5, { align: 'right' });
    pdf.text('TOTAL', pageWidth - margin - 3, currentY + 5, { align: 'right' });
    currentY += 7.5;

    proposal.items.forEach(item => {
      const qty = Number(item.quantity || 1);
      const rate = Number(item.unitPrice || 0);
      const lineTotal = item.total ?? qty * rate;
      const descLines = pdf.splitTextToSize(item.description || 'Deliverable', contentWidth - 76);
      const rowH = Math.max(descLines.length * 4.3 + 2, 7.5);
      currentY = ensurePageSpace(pdf, currentY, rowH + 4, pageHeight, margin + 15);
      pdf.setDrawColor(225, 225, 225);
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(25, 25, 25);
      pdf.text(descLines, margin + 3, currentY + 4.8);
      pdf.setFont('courier', 'normal');
      pdf.text(String(qty), pageWidth - margin - 62, currentY + 4.8, { align: 'center' });
      pdf.text(formatPdfMoney(rate, currency), pageWidth - margin - 35, currentY + 4.8, { align: 'right' });
      pdf.setFont('courier', 'bold');
      pdf.text(formatPdfMoney(lineTotal, currency), pageWidth - margin - 3, currentY + 4.8, { align: 'right' });
      currentY += rowH;
    });

    currentY += 4;
    pdf.setFillColor(242, 242, 242);
    pdf.rect(margin, currentY, contentWidth, 8, 'F');
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`PROPOSAL TOTAL (${currency}):`, pageWidth - margin - 46, currentY + 5.5, { align: 'right' });
    pdf.text(formatPdfMoney(proposal.totalAmount || 0, currency), pageWidth - margin - 3, currentY + 5.5, {
      align: 'right',
    });
    currentY += 12;
  }

  if (proposal.clientResponse) {
    currentY = ensurePageSpace(pdf, currentY, 18, pageHeight, margin + 12);
    pdf.setFillColor(248, 248, 248);
    pdf.rect(margin, currentY, contentWidth, 14, 'F');
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(0, 0, 0);
    pdf.text(
      `CLIENT RESPONSE: ${proposal.clientResponse.action.toUpperCase()} (${proposal.clientResponse.respondedAt.slice(0, 10)})`,
      margin + 3,
      currentY + 5.2,
    );
    if (proposal.clientResponse.comment) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(proposal.clientResponse.comment.slice(0, 110), margin + 3, currentY + 10.5);
    }
    currentY += 18;
  }

  if (proposal.paymentTerms) {
    currentY = ensurePageSpace(pdf, currentY, 10, pageHeight, margin + 10);
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(0, 0, 0);
    pdf.text('PROPOSED TERMS:', margin, currentY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(proposal.paymentTerms, margin + 32, currentY);
  }

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(130, 130, 130);
  pdf.text(
    `ISSUED BY KEEDOHUB (${proposal.issuedByName || 'PLATFORM ADMIN'}) · COMMERCIAL PROPOSAL RECORD`,
    margin,
    pageHeight - 8,
  );

  pdf.save(`${(proposal.referenceNo || proposal.id).replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
};

/**
 * Generates an A4 Songwriter & Producer Split Sheet PDF
 */
export const generateSplitSheetPdf = (params: SplitSheetPdfParams): void => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const wsName = params.workspaceName?.trim() || params.artistName || 'Artist Workspace';

  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, 297, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(17);
  pdf.setTextColor(0, 0, 0);
  pdf.text('SONGWRITER & PRODUCER SPLIT SHEET', margin, margin + 9);

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(95, 95, 95);
  pdf.text(`${wsName.toUpperCase()} · PUBLISHING & COMPOSITION ALLOCATION`, margin, margin + 14);

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.line(margin, margin + 19, pageWidth - margin, margin + 19);

  let y = margin + 27;
  pdf.setFillColor(246, 246, 246);
  pdf.rect(margin, y, contentWidth, 18, 'F');
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`TRACK TITLE: ${params.title}`, margin + 4, y + 6.5);
  pdf.text(`RECORDING ARTIST: ${params.artistName}`, margin + 4, y + 12.5);
  pdf.text(`ISRC: ${params.isrc || 'PENDING'}`, pageWidth - margin - 4, y + 6.5, { align: 'right' });
  pdf.text(`DATE: ${params.executionDate}`, pageWidth - margin - 4, y + 12.5, { align: 'right' });
  y += 26;

  pdf.setFillColor(20, 20, 20);
  pdf.rect(margin, y, contentWidth, 7.5, 'F');
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text('CONTRIBUTOR NAME', margin + 3, y + 5);
  pdf.text('ROLE', margin + 62, y + 5);
  pdf.text('PRO / IPI', margin + 112, y + 5);
  pdf.text('SHARE %', pageWidth - margin - 3, y + 5, { align: 'right' });
  y += 7.5;

  let totalPct = 0;
  params.contributors.forEach(contrib => {
    totalPct += Number(contrib.percent || 0);
    pdf.setDrawColor(225, 225, 225);
    pdf.rect(margin, y, contentWidth, 9, 'S');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(0, 0, 0);
    pdf.text(contrib.name || '-', margin + 3, y + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text((contrib.role || '-').slice(0, 26), margin + 62, y + 6);
    pdf.setFont('courier', 'normal');
    pdf.setFontSize(7.5);
    pdf.text(`${contrib.pro || 'N/A'} ${contrib.ipi ? `(${contrib.ipi})` : ''}`, margin + 112, y + 6);
    pdf.setFont('courier', 'bold');
    pdf.text(`${Number(contrib.percent || 0).toFixed(2)}%`, pageWidth - margin - 3, y + 6, { align: 'right' });
    y += 9;
  });

  pdf.setFillColor(242, 242, 242);
  pdf.rect(margin, y, contentWidth, 8, 'F');
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(0, 0, 0);
  pdf.text('TOTAL COMPOSITION OWNERSHIP:', margin + 4, y + 5.5);
  pdf.text(`${totalPct.toFixed(2)}%`, pageWidth - margin - 3, y + 5.5, { align: 'right' });
  y += 16;

  if (params.notes) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(50, 50, 50);
    const noteLines = pdf.splitTextToSize(params.notes, contentWidth);
    pdf.text(noteLines, margin, y);
    y += noteLines.length * 4.4 + 8;
  }

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(110, 110, 110);
  pdf.text('SIGNATURE VERIFICATION LINES:', margin, y);
  y += 10;
  params.contributors.forEach(contrib => {
    y = ensurePageSpace(pdf, y, 14, 297, margin);
    pdf.setDrawColor(160, 160, 160);
    pdf.line(margin, y + 4, margin + 85, y + 4);
    pdf.line(margin + 95, y + 4, pageWidth - margin, y + 4);
    pdf.setFontSize(7);
    pdf.text(`${contrib.name || 'Contributor'} — Signature`, margin, y + 8);
    pdf.text('Date Executed', margin + 95, y + 8);
    y += 14;
  });

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(130, 130, 130);
  pdf.text(
    'DRAFTING TEMPLATE ONLY — NOT FORMAL LEGAL COUNSEL · GENERATED VIA KEEDOHUB ARTIST WORKSPACE',
    margin,
    289,
  );

  const safeTitle = params.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'TRACK';
  pdf.save(`SPLIT_SHEET_${safeTitle}.pdf`);
};

/**
 * Generates an Artist Electronic Press Kit (EPK) PDF
 */
export const generateArtistEpkPdf = (params: ArtistEpkPdfParams): void => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Editorial Dark Header Band
  pdf.setFillColor(12, 12, 12);
  pdf.rect(0, 0, pageWidth, 58, 'F');
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(180, 180, 180);
  pdf.text('OFFICIAL ELECTRONIC PRESS KIT (EPK)', margin, 18);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(255, 255, 255);
  pdf.text(params.artistName.toUpperCase(), margin, 32);

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(210, 210, 210);
  pdf.text(
    `${(params.genre || 'Independent Artist').toUpperCase()} · ${params.workspaceName || params.artistName}`,
    margin,
    42,
  );

  let y = 70;
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(0, 0, 0);
  pdf.text('01. ARTIST BIOGRAPHY', margin, y);
  y += 6;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(35, 35, 35);
  const bioLines: string[] = pdf.splitTextToSize(params.biography || 'Biography pending update.', contentWidth);
  for (const line of bioLines) {
    y = ensurePageSpace(pdf, y, 6, 297, margin + 12);
    pdf.text(line, margin, y);
    y += 4.8;
  }
  y += 8;

  // Links
  const linkEntries = Object.entries(params.links || {}).filter(([, val]) => Boolean(val && val.trim()));
  if (linkEntries.length > 0) {
    y = ensurePageSpace(pdf, y, 25, 297, margin + 12);
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.text('02. OFFICIAL CHANNELS & DSP PROFILES', margin, y);
    y += 6;

    linkEntries.forEach(([label, val]) => {
      y = ensurePageSpace(pdf, y, 7, 297, margin + 12);
      pdf.setFont('courier', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(80, 80, 80);
      pdf.text(`${label.toUpperCase()}:`, margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(String(val), margin + 32, y);
      y += 5.5;
    });
    y += 6;
  }

  // Discography
  if (params.releases && params.releases.length > 0) {
    y = ensurePageSpace(pdf, y, 26, 297, margin + 12);
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.text('03. SELECTED DISCOGRAPHY & RELEASES', margin, y);
    y += 6;

    params.releases.forEach(rel => {
      y = ensurePageSpace(pdf, y, 10, 297, margin + 12);
      pdf.setFillColor(246, 246, 246);
      pdf.rect(margin, y, contentWidth, 8, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${rel.title} (${rel.type})`, margin + 3, y + 5.3);
      pdf.setFont('courier', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(80, 80, 80);
      pdf.text(
        `${rel.releaseDate || 'TBD'} · ${rel.distributionStatus || 'Active'}${rel.isrc ? ` · ${rel.isrc}` : ''}`,
        pageWidth - margin - 3,
        y + 5.3,
        { align: 'right' },
      );
      y += 10;
    });
  }

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(130, 130, 130);
  pdf.text(`${params.artistName.toUpperCase()} EPK · GENERATED VIA KEEDOHUB`, margin, 289);
  pdf.save(`${params.artistName.replace(/[^a-zA-Z0-9_-]/g, '_')}_EPK.pdf`);
};

/**
 * Generates an A4 Tracklist & Release Credits Sheet PDF
 */
export const generateTracklistCreditsPdf = (params: TracklistCreditsPdfParams): void => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, 297, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(17);
  pdf.setTextColor(0, 0, 0);
  pdf.text('RELEASE TRACKLIST & CREDITS SHEET', margin, margin + 9);

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(95, 95, 95);
  pdf.text(
    `${(params.workspaceName || params.artistName).toUpperCase()} · MASTER METADATA & LINER NOTES`,
    margin,
    margin + 14,
  );
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.line(margin, margin + 19, pageWidth - margin, margin + 19);

  let y = margin + 26;
  pdf.setFillColor(246, 246, 246);
  pdf.rect(margin, y, contentWidth, 18, 'F');
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`RELEASE: ${params.releaseTitle} (${params.releaseType})`, margin + 4, y + 6.5);
  pdf.text(`ARTIST: ${params.artistName}`, margin + 4, y + 12.5);
  pdf.text(`STREET DATE: ${params.releaseDate || 'TBD'}`, pageWidth - margin - 4, y + 6.5, { align: 'right' });
  pdf.text(`UPC/ISRC: ${params.upc || params.isrc || 'PENDING'}`, pageWidth - margin - 4, y + 12.5, {
    align: 'right',
  });
  y += 25;

  params.tracks.forEach(track => {
    y = ensurePageSpace(pdf, y, 22, 297, margin + 12);
    pdf.setDrawColor(220, 220, 220);
    pdf.setFillColor(250, 250, 250);
    pdf.rect(margin, y, contentWidth, 18, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(0, 0, 0);
    pdf.text(
      `${String(track.trackNumber).padStart(2, '0')}. ${track.title}${track.featuredArtists ? ` (feat. ${track.featuredArtists})` : ''}`,
      margin + 4,
      y + 6,
    );
    pdf.setFont('courier', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(80, 80, 80);
    pdf.text(
      `${track.duration || '0:00'}${track.isrc ? ` · ISRC: ${track.isrc}` : ''}`,
      pageWidth - margin - 4,
      y + 6,
      { align: 'right' },
    );

    pdf.text(`PRODUCER: ${track.producer || 'TBA'}`, margin + 4, y + 11.5);
    pdf.text(`SONGWRITERS: ${track.songwriters || 'TBA'}`, margin + 4, y + 15.8);
    y += 21;
  });

  if (params.rightsInfo) {
    y = ensurePageSpace(pdf, y, 14, 297, margin + 10);
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(0, 0, 0);
    pdf.text('RIGHTS & COPYRIGHT NOTICE:', margin, y + 4);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.2);
    pdf.text(params.rightsInfo, margin, y + 9);
  }

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(130, 130, 130);
  pdf.text(`${params.artistName.toUpperCase()} RELEASE CREDITS · SECURED VIA KEEDOHUB`, margin, 289);
  pdf.save(`${params.releaseTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_TRACKLIST_CREDITS.pdf`);
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
  printReady: boolean = false,
  brandOptions?: BusinessCardBrandOptions,
): void => {
  const brandName = (brandOptions?.workspaceName || 'BRAND STUDIO').trim().toUpperCase();
  const brandMonogram = (brandOptions?.monogram || deriveWorkspaceMonogram(brandName)).toUpperCase();
  const brandTagline = (brandOptions?.tagline || 'BRAND IDENTITY & CREATIVE STUDIO').trim().toUpperCase();
  const brandWebsite = (brandOptions?.website || card.website || 'www.keedohub.com').trim();
  const brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'workspace';

  // Standard card is 90x54 mm. With 3mm bleed on each side, canvas is 96x60 mm.
  const bleed = printReady ? 3 : 0;
  const widthMm = 90 + bleed * 2;
  const heightMm = 54 + bleed * 2;

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [widthMm, heightMm],
  });

  const renderFront = (isSecondPage: boolean = false) => {
    if (isSecondPage) pdf.addPage([widthMm, heightMm], 'landscape');

    const originX = bleed;
    const originY = bleed;
    const cardW = 90;
    const cardH = 54;

    if (template === 'white_minimal') {
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, widthMm, heightMm, 'F');

      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.6);
      pdf.rect(originX + 5, originY + 5, cardW - 10, cardH - 10);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(brandName.slice(0, 24), originX + 9, originY + 14);

      pdf.setFont('courier', 'normal');
      pdf.setFontSize(5);
      pdf.setTextColor(100, 100, 100);
      pdf.text(brandTagline.slice(0, 34), originX + 9, originY + 18);

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

      pdf.setFillColor(0, 0, 0);
      pdf.rect(contactX - 9, originY + 9, 9, 9, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      pdf.setTextColor(255, 255, 255);
      pdf.text(brandMonogram, contactX - 4.5, originY + 15, { align: 'center' });
    } else if (template === 'monogram_signature') {
      pdf.setFillColor(18, 18, 18);
      pdf.rect(0, 0, widthMm, heightMm, 'F');

      pdf.setFillColor(0, 0, 0);
      pdf.rect(originX, originY, 26, cardH, 'F');

      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(0.5);
      pdf.rect(originX + 6, originY + 12, 14, 14);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255);
      pdf.text(brandMonogram, originX + 13, originY + 21, { align: 'center' });

      const firstWord = brandName.split(/\s+/)[0] || brandName;
      pdf.setFont('courier', 'bold');
      pdf.setFontSize(4.5);
      pdf.text(firstWord.slice(0, 12), originX + 13, originY + 32, { align: 'center' });
      pdf.text('STUDIO', originX + 13, originY + 35, { align: 'center' });

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
    } else {
      pdf.setFillColor(12, 12, 12);
      pdf.rect(0, 0, widthMm, heightMm, 'F');

      pdf.setDrawColor(35, 35, 35);
      pdf.setLineWidth(0.4);
      pdf.line(originX + 8, originY + 22, originX + cardW - 8, originY + 22);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(255, 255, 255);
      pdf.text(brandName.slice(0, 24), originX + 8, originY + 12);

      pdf.setFont('courier', 'normal');
      pdf.setFontSize(5);
      pdf.setTextColor(160, 160, 160);
      pdf.text(brandTagline.slice(0, 38), originX + 8, originY + 17);

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

      const contactX = originX + cardW - 8;
      pdf.setFont('courier', 'normal');
      pdf.setFontSize(5.5);
      pdf.setTextColor(180, 180, 180);
      pdf.text(card.phone, contactX, originY + 30, { align: 'right' });
      pdf.text(card.email, contactX, originY + 34, { align: 'right' });
      pdf.text(card.website, contactX, originY + 38, { align: 'right' });
      pdf.text(card.socialHandle, contactX, originY + 42, { align: 'right' });

      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(0.4);
      pdf.rect(contactX - 10, originY + 8, 10, 10);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(255, 255, 255);
      pdf.text(brandMonogram, contactX - 5, originY + 14.5, { align: 'center' });
    }

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

    if (template === 'white_minimal') {
      pdf.setFillColor(250, 250, 250);
      pdf.rect(0, 0, widthMm, heightMm, 'F');

      pdf.setFillColor(0, 0, 0);
      pdf.rect(originX + cardW / 2 - 9, originY + cardH / 2 - 12, 18, 18, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(255, 255, 255);
      pdf.text(brandMonogram, originX + cardW / 2, originY + cardH / 2 - 0.5, { align: 'center' });

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(0, 0, 0);
      pdf.text(brandName.slice(0, 28), originX + cardW / 2, originY + cardH / 2 + 12, { align: 'center' });

      pdf.setFont('courier', 'normal');
      pdf.setFontSize(4.5);
      pdf.setTextColor(120, 120, 120);
      pdf.text(brandWebsite, originX + cardW / 2, originY + cardH / 2 + 16, { align: 'center' });
    } else if (template === 'monogram_signature') {
      pdf.setFillColor(10, 10, 10);
      pdf.rect(0, 0, widthMm, heightMm, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(48);
      pdf.setTextColor(20, 20, 20);
      pdf.text(brandMonogram, originX + cardW / 2, originY + cardH / 2 + 16, { align: 'center' });

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(255, 255, 255);
      pdf.text(brandName.slice(0, 28), originX + cardW / 2, originY + cardH / 2 - 3, { align: 'center' });

      pdf.setFont('courier', 'normal');
      pdf.setFontSize(5);
      pdf.setTextColor(180, 180, 180);
      pdf.text(brandTagline.slice(0, 42), originX + cardW / 2, originY + cardH / 2 + 2, { align: 'center' });
    } else {
      pdf.setFillColor(8, 8, 8);
      pdf.rect(0, 0, widthMm, heightMm, 'F');

      pdf.setDrawColor(24, 24, 24);
      pdf.setLineWidth(0.3);
      pdf.circle(originX + cardW / 2, originY + cardH / 2, 22);
      pdf.circle(originX + cardW / 2, originY + cardH / 2, 16);
      pdf.circle(originX + cardW / 2, originY + cardH / 2, 10);

      pdf.setFillColor(0, 0, 0);
      pdf.rect(originX + cardW / 2 - 8, originY + cardH / 2 - 8, 16, 16, 'F');
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(0.6);
      pdf.rect(originX + cardW / 2 - 8, originY + cardH / 2 - 8, 16, 16, 'S');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(255, 255, 255);
      pdf.text(brandMonogram, originX + cardW / 2, originY + cardH / 2 + 3.5, { align: 'center' });

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(255, 255, 255);
      pdf.text(brandName.slice(0, 28), originX + cardW / 2, originY + cardH - 8, { align: 'center' });

      pdf.setFont('courier', 'normal');
      pdf.setFontSize(4.5);
      pdf.setTextColor(150, 150, 150);
      pdf.text(brandWebsite.toUpperCase(), originX + cardW / 2, originY + cardH - 5, { align: 'center' });
    }

    if (printReady) {
      drawCropMarks(pdf, bleed, cardW, cardH);
    }
  };

  renderFront(false);
  renderBack();

  const filePrefix = printReady
    ? `${brandSlug.toUpperCase()}_BUSINESS_CARD_PRINT_READY_3MM`
    : `${brandSlug.toUpperCase()}_BUSINESS_CARD_DIGITAL`;
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
    { x: bleed + cardW, y: bleed + cardH },
  ];

  corners.forEach(c => {
    const hStartX = c.x === bleed ? c.x - offset - lineLen : c.x + offset;
    const hEndX = c.x === bleed ? c.x - offset : c.x + offset + lineLen;
    pdf.line(hStartX, c.y, hEndX, c.y);

    const vStartY = c.y === bleed ? c.y - offset - lineLen : c.y + offset;
    const vEndY = c.y === bleed ? c.y - offset : c.y + offset + lineLen;
    pdf.line(c.x, vStartY, c.x, vEndY);
  });
}

/**
 * Generates official Brand Guidelines multi-page PDF parameterized by workspace
 */
export const generateBrandGuidelinesPdf = (guidelines: BrandGuidelinesData, workspace: Workspace): void => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const brand = deriveWorkspaceBrandMeta(workspace);
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // --- PAGE 1: COVER ---
  pdf.setFillColor(10, 10, 10);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  pdf.setDrawColor(40, 40, 40);
  pdf.setLineWidth(0.8);
  pdf.rect(margin - 5, margin - 5, contentWidth + 10, pageHeight - margin * 2 + 10);

  pdf.setFillColor(0, 0, 0);
  pdf.rect(margin, margin + 40, 40, 40, 'F');
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(1.2);
  pdf.rect(margin, margin + 40, 40, 40, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.setTextColor(255, 255, 255);
  pdf.text(brand.monogram, margin + 20, margin + 65, { align: 'center' });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(26);
  pdf.setTextColor(255, 255, 255);
  pdf.text(brand.name, margin, margin + 110);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(13);
  pdf.setTextColor(180, 180, 180);
  pdf.text('OFFICIAL BRAND IDENTITY & DESIGN CONSTITUTION', margin, margin + 120);

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  pdf.text('MASTER BRAND SYSTEM RELEASE', margin, margin + 130);

  pdf.setDrawColor(80, 80, 80);
  pdf.setLineWidth(0.5);
  pdf.line(margin, margin + 140, pageWidth - margin, margin + 140);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(180, 180, 180);
  const introText = `This brand manual establishes the visual identity, typographic standards, logo exclusion zones, and production specifications for ${brand.name}, its collateral, packaging, and digital channels.`;
  const splitIntro = pdf.splitTextToSize(introText, contentWidth - 10);
  pdf.text(splitIntro, margin, margin + 150);

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(140, 140, 140);
  pdf.text(`CONFIDENTIAL DOCUMENT · ${brand.name} · SECURED VIA KEEDOHUB`, margin, pageHeight - margin);
  pdf.text(`ISSUED: ${new Date().getFullYear()}`, pageWidth - margin, pageHeight - margin, { align: 'right' });

  // --- PAGE 2: LOGO SYSTEM & CLEAR SPACE ---
  pdf.addPage('a4', 'portrait');
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text('01. OFFICIAL LOGO SYSTEM & EXCLUSION RULES', margin, margin + 5);

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(120, 120, 120);
  pdf.text(`${brand.name.toUpperCase()} BRAND MANUAL · PAGE 2`, pageWidth - margin, margin + 5, { align: 'right' });

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.8);
  pdf.line(margin, margin + 8, pageWidth - margin, margin + 8);

  let py = margin + 18;

  pdf.setFillColor(245, 245, 245);
  pdf.rect(margin, py, contentWidth, 38, 'F');
  pdf.setDrawColor(210, 210, 210);
  pdf.rect(margin, py, contentWidth, 38, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text(brand.name.toUpperCase(), margin + 10, py + 18);
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 100, 100);
  pdf.text('PRIMARY MASTER LOCKUP — COMBINES FRAMED MONOGRAM & WORDMARK', margin + 10, py + 25);

  py += 46;

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
  pdf.text(`${brand.name.toUpperCase()} BRAND MANUAL · PAGE 3`, pageWidth - margin, margin + 5, { align: 'right' });

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.8);
  pdf.line(margin, margin + 8, pageWidth - margin, margin + 8);

  py = margin + 18;

  const swatches = [
    { name: 'Primary Token', hex: workspace.brand?.primaryColor || '#000000', rgb: 'Brand Primary', bg: [10, 10, 10], text: [255, 255, 255] },
    { name: 'Pure White', hex: '#FFFFFF', rgb: '255, 255, 255', bg: [255, 255, 255], text: [0, 0, 0], border: true },
    { name: 'Secondary Token', hex: workspace.brand?.secondaryColor || '#171717', rgb: 'Surface Dark', bg: [23, 23, 23], text: [255, 255, 255] },
    { name: 'Neutral Grey', hex: '#A3A3A3', rgb: '163, 163, 163', bg: [163, 163, 163], text: [0, 0, 0] },
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
    pdf.text(sw.rgb, sx, py + 40);
  });

  py += 50;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text('APPROVED TYPOGRAPHY MATRIX', margin, py);

  py += 6;
  pdf.setFillColor(248, 248, 248);
  pdf.rect(margin, py, contentWidth, 34, 'F');
  pdf.setDrawColor(220, 220, 220);
  pdf.rect(margin, py, contentWidth, 34, 'S');

  const displayFont = workspace.brand?.typography?.displayFont || 'Plus Jakarta Sans';
  const bodyFont = workspace.brand?.typography?.bodyFont || 'Inter';

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`${displayFont} — Primary Headline & Display Font`, margin + 6, py + 10);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(70, 70, 70);
  pdf.text('Used for executive covers, campaign graphics, and workspace headings.', margin + 6, py + 16);

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`${bodyFont} / Mono — Body Copy & Technical Metadata`, margin + 6, py + 24);
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(70, 70, 70);
  pdf.text('Document references, legal clauses, specifications, and collateral copy.', margin + 6, py + 29);

  py += 44;

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
  pdf.text(`${brand.name.toUpperCase()} BRAND MANUAL · PAGE 4`, pageWidth - margin, margin + 5, { align: 'right' });

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
  pdf.text('CONTACT & WORKSPACE GOVERNANCE', margin, py);

  py += 6;
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(60, 60, 60);
  pdf.text(`${brand.name} · Brand Governance`, margin, py);
  pdf.text(`Email: ${brand.email}`, margin, py + 5);
  pdf.text('Managed via KEEDOHUB Platform', margin, py + 10);

  pdf.save(`${brand.name.replace(/\s+/g, '_')}_BRAND_GUIDELINES.pdf`);
};

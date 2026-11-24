import type {
  CommercialCurrency,
  CorporateDocument,
  DocumentItem,
  DocumentType,
  InvoiceRecord,
  InvoiceStatus,
} from '../types';

export const COMMERCIAL_CURRENCIES: CommercialCurrency[] = ['USD', 'GBP', 'EUR', 'NGN', 'CAD'];

export const COMMERCIAL_DOCUMENT_TYPES = [
  'invoice',
  'receipt',
  'proposal',
  'quotation',
  'partnership_proposal',
  'sponsorship_proposal',
  'commercial_contract',
] as const;

export const ARTIST_DOCUMENT_TYPE_OPTIONS: Array<{
  type: DocumentType;
  label: string;
  shortDesc: string;
}> = [
  { type: 'split_sheet', label: 'Songwriter Split Sheet', shortDesc: '100% publishing & composer allocation' },
  { type: 'producer_agreement_memo', label: 'Producer Engagement Memo', shortDesc: 'Beat fee & master points record' },
  { type: 'video_release_memo', label: 'Video Likeness & Location Release', shortDesc: 'Broadcast & music video clearance' },
  { type: 'master_authorization', label: 'Master Release Authorization', shortDesc: 'DSP distribution & release sign-off' },
  { type: 'epk', label: 'Artist EPK (Press Kit)', shortDesc: 'Biography, highlights, streaming links & releases' },
  { type: 'tracklist_credits', label: 'Tracklist & Credit Sheet', shortDesc: 'Track sequence, ISRC, producer & writers' },
  { type: 'artist_onboarding', label: 'Artist Legal & PRO Intake', shortDesc: 'Legal entity, PRO/IPI & SoundExchange dossier' },
  { type: 'album_budget', label: 'Release Budget Sheet', shortDesc: 'Recording, mixing, artwork & promo cost plan' },
  { type: 'asset_handover', label: 'Master & Stem Handover', shortDesc: 'Custody log for WAV stems and master files' },
  { type: 'official_letter', label: 'Official Artist Correspondence', shortDesc: 'General representation & press correspondence' },
];

export const BRAND_DOCUMENT_TYPE_OPTIONS: Array<{
  type: DocumentType;
  label: string;
  shortDesc: string;
}> = [
  { type: 'company_profile', label: 'Company Profile', shortDesc: 'Brand overview, capability brief & mission' },
  { type: 'official_letter', label: 'Official Business Letter', shortDesc: 'Formal partner & executive correspondence' },
  { type: 'letterhead', label: 'Brand Letterhead Template', shortDesc: 'Stationery copy & formal dispatch layout' },
  { type: 'business_report', label: 'Campaign / Brand Report', shortDesc: 'Executive performance & creative summary' },
  { type: 'asset_handover', label: 'Asset Handover Certificate', shortDesc: 'Delivery sign-off for files & brand kits' },
  { type: 'meeting_agenda', label: 'Meeting Agenda', shortDesc: 'Structured stakeholder or creative call agenda' },
  { type: 'meeting_minutes', label: 'Meeting Minutes', shortDesc: 'Decisions & action items log' },
  { type: 'internal_memo', label: 'Internal Brand Memo', shortDesc: 'Team alignment & operational note' },
  { type: 'business_card', label: 'Business Card Record', shortDesc: 'Saved executive print/digital card brief' },
  { type: 'email_signature', label: 'Email Signature Spec', shortDesc: 'Saved HTML signature specification' },
];

export function isCommercialDocumentType(rawType: unknown): boolean {
  if (typeof rawType !== 'string') return false;
  const normalized = rawType.trim().toLowerCase();
  return (COMMERCIAL_DOCUMENT_TYPES as readonly string[]).includes(normalized);
}

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  GBP: '£',
  EUR: '€',
  NGN: '₦',
  CAD: 'CA$',
};

export function formatMoney(amount: number, currency: string = 'USD'): string {
  const safeCurrency = COMMERCIAL_CURRENCIES.includes(currency as CommercialCurrency)
    ? currency
    : 'USD';
  const symbol = CURRENCY_SYMBOLS[safeCurrency] || `${safeCurrency} `;
  const val = roundMoney(Number.isFinite(amount) ? amount : 0);
  return `${symbol}${val.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function calculateCommercialTotals(params: {
  items: DocumentItem[];
  taxRate?: number;
  discountAmount?: number;
}): {
  items: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
} {
  const normalizedItems = (params.items || []).map(item => {
    const quantity = Number.isFinite(Number(item.quantity)) && Number(item.quantity) > 0
      ? Number(item.quantity)
      : 1;
    const unitPrice = Number.isFinite(Number(item.unitPrice)) && Number(item.unitPrice) >= 0
      ? roundMoney(Number(item.unitPrice))
      : 0;
    const total = roundMoney(quantity * unitPrice);
    return {
      description: String(item.description || '').trim(),
      quantity,
      unitPrice,
      total,
    };
  });

  const subtotal = roundMoney(normalizedItems.reduce((sum, item) => sum + item.total, 0));
  const rawTaxRate = Number(params.taxRate ?? 0);
  const taxRate = Number.isFinite(rawTaxRate) && rawTaxRate >= 0 ? Math.min(100, rawTaxRate) : 0;
  const rawDiscount = Number(params.discountAmount ?? 0);
  const discountAmount = Number.isFinite(rawDiscount) && rawDiscount >= 0
    ? Math.min(subtotal, roundMoney(rawDiscount))
    : 0;
  const taxableBase = Math.max(0, roundMoney(subtotal - discountAmount));
  const taxAmount = roundMoney((taxableBase * taxRate) / 100);
  const totalAmount = Math.max(0, roundMoney(taxableBase + taxAmount));

  return {
    items: normalizedItems,
    subtotal,
    taxRate,
    taxAmount,
    discountAmount,
    totalAmount,
  };
}

export function deriveClientInvoiceStatus(
  invoice: Pick<InvoiceRecord, 'status' | 'totalAmount' | 'totalPaid' | 'dueDate'>,
  todayIso: string = new Date().toISOString().slice(0, 10),
): InvoiceStatus {
  if (invoice.status === 'Void') return 'Void';
  if (invoice.status === 'Draft') return 'Draft';
  const totalAmount = roundMoney(invoice.totalAmount || 0);
  const totalPaid = roundMoney(invoice.totalPaid || 0);
  const balance = roundMoney(totalAmount - totalPaid);
  if (balance <= 0.005 && totalAmount > 0) return 'Paid';
  if (totalPaid > 0 && balance > 0.005) {
    if (invoice.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(invoice.dueDate) && invoice.dueDate < todayIso) {
      return 'Overdue';
    }
    return 'Partially Paid';
  }
  if (invoice.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(invoice.dueDate) && invoice.dueDate < todayIso) {
    return 'Overdue';
  }
  return invoice.status || 'Issued';
}

export function isLegacyCommercialWorkspaceDoc(doc: Pick<CorporateDocument, 'type' | 'issuedByAdmin'>): boolean {
  return doc.issuedByAdmin === true || isCommercialDocumentType(doc.type);
}

export function validateSplitContributorsTotal(contributors: Array<{ percent: number }>): {
  total: number;
  isValid: boolean;
} {
  const total = roundMoney(
    contributors.reduce((sum, entry) => sum + (Number.isFinite(entry.percent) ? entry.percent : 0), 0),
  );
  return {
    total,
    isValid: Math.abs(total - 100) < 0.01,
  };
}

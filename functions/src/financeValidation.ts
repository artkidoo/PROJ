export class FinanceValidationError extends Error {
  code: 'invalid-argument' | 'failed-precondition' | 'permission-denied';

  constructor(
    code: 'invalid-argument' | 'failed-precondition' | 'permission-denied',
    message: string,
  ) {
    super(message);
    this.name = 'FinanceValidationError';
    this.code = code;
  }
}

export type AllowedCurrency = 'USD' | 'GBP' | 'EUR' | 'NGN' | 'CAD';
export type AllowedInvoiceStatus = 'Draft' | 'Issued' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Void';
export type AllowedProposalType = 'quotation' | 'partnership_proposal' | 'sponsorship_proposal' | 'proposal';
export type AllowedProposalStatus =
  | 'Draft'
  | 'Issued'
  | 'Sent'
  | 'Under Review'
  | 'Revision Requested'
  | 'Approved'
  | 'Declined'
  | 'Expired';
export type AllowedPaymentMethod = 'Wire Transfer' | 'ACH' | 'Credit Card' | 'Paystack' | 'Flutterwave' | 'Check' | 'Crypto' | 'Other';

export interface ValidatedLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ValidatedPaymentRecord {
  id: string;
  receiptNumber: string;
  amount: number;
  date: string;
  reference: string;
  method: AllowedPaymentMethod;
  recordedBy: string;
  recordedByUid: string;
  notes?: string;
}

export interface ProposalRevisionItem {
  version: number;
  actorUid: string;
  actorName: string;
  actorRole: 'Admin' | 'Client';
  action: 'Created' | 'Updated' | 'Issued' | 'Revised' | 'Approved' | 'Revision Requested' | 'Declined';
  comment?: string;
  timestamp: string;
}

export const ALLOWED_CURRENCIES = new Set<AllowedCurrency>(['USD', 'GBP', 'EUR', 'NGN', 'CAD']);
export const ALLOWED_PAYMENT_METHODS = new Set<AllowedPaymentMethod>([
  'Wire Transfer',
  'ACH',
  'Credit Card',
  'Paystack',
  'Flutterwave',
  'Check',
  'Crypto',
  'Other',
]);
export const ALLOWED_PROPOSAL_TYPES = new Set<AllowedProposalType>([
  'quotation',
  'partnership_proposal',
  'sponsorship_proposal',
  'proposal',
]);
export const CLIENT_RESPONDABLE_PROPOSAL_STATUSES = new Set<AllowedProposalStatus>([
  'Issued',
  'Sent',
  'Under Review',
  'Revision Requested',
]);

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function cleanText(value: unknown, label: string, maxLen: number, required: boolean): string {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new FinanceValidationError('invalid-argument', `${label} is required.`);
    }
    return '';
  }
  if (typeof value !== 'string') {
    throw new FinanceValidationError('invalid-argument', `${label} must be a string.`);
  }
  const trimmed = value.trim();
  if (required && trimmed.length === 0) {
    throw new FinanceValidationError('invalid-argument', `${label} is required.`);
  }
  if (trimmed.length > maxLen) {
    throw new FinanceValidationError('invalid-argument', `${label} must be ${maxLen} characters or fewer.`);
  }
  return trimmed;
}

export function validateCalendarDate(value: unknown, label: string, required: boolean): string {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new FinanceValidationError('invalid-argument', `${label} is required.`);
    }
    return '';
  }
  if (typeof value !== 'string') {
    throw new FinanceValidationError('invalid-argument', `${label} must be YYYY-MM-DD.`);
  }
  const date = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new FinanceValidationError('invalid-argument', `${label} must be in YYYY-MM-DD format.`);
  }
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new FinanceValidationError('invalid-argument', `${label} is not a valid calendar date.`);
  }
  return date;
}

export function validateCurrency(value: unknown): AllowedCurrency {
  if (value === undefined || value === null || value === '') return 'USD';
  if (typeof value !== 'string') {
    throw new FinanceValidationError('invalid-argument', 'Currency must be a string.');
  }
  const upper = value.trim().toUpperCase() as AllowedCurrency;
  if (!ALLOWED_CURRENCIES.has(upper)) {
    throw new FinanceValidationError(
      'invalid-argument',
      `Unsupported currency "${value}". Allowed currencies: USD, GBP, EUR, NGN, CAD.`,
    );
  }
  return upper;
}

export function sanitizeLineItems(
  rawItems: unknown,
  requireAtLeastOne: boolean,
): ValidatedLineItem[] {
  if (rawItems === undefined || rawItems === null) {
    if (requireAtLeastOne) {
      throw new FinanceValidationError('invalid-argument', 'At least one line item is required.');
    }
    return [];
  }
  if (!Array.isArray(rawItems)) {
    throw new FinanceValidationError('invalid-argument', 'Line items must be an array.');
  }
  if (requireAtLeastOne && rawItems.length === 0) {
    throw new FinanceValidationError('invalid-argument', 'At least one line item is required.');
  }
  if (rawItems.length > 50) {
    throw new FinanceValidationError('invalid-argument', 'Line items cannot exceed 50 rows.');
  }

  return rawItems.map((entry, idx) => {
    if (!entry || typeof entry !== 'object') {
      throw new FinanceValidationError('invalid-argument', `Line item #${idx + 1} is invalid.`);
    }
    const raw = entry as Record<string, unknown>;
    const description = cleanText(raw.description, `Line item #${idx + 1} description`, 300, true);
    const quantityRaw = raw.quantity === undefined ? 1 : Number(raw.quantity);
    if (!Number.isFinite(quantityRaw) || quantityRaw <= 0 || quantityRaw > 100000) {
      throw new FinanceValidationError(
        'invalid-argument',
        `Line item #${idx + 1} quantity must be between 1 and 100000.`,
      );
    }
    const unitPriceRaw = Number(raw.unitPrice ?? 0);
    if (!Number.isFinite(unitPriceRaw) || unitPriceRaw < 0 || unitPriceRaw > 10000000) {
      throw new FinanceValidationError(
        'invalid-argument',
        `Line item #${idx + 1} unitPrice must be between 0 and 10000000.`,
      );
    }
    const unitPrice = roundCurrency(unitPriceRaw);
    const quantity = Math.round(quantityRaw * 100) / 100;
    const total = roundCurrency(quantity * unitPrice);
    return { description, quantity, unitPrice, total };
  });
}

export function computeMonetarySummary(params: {
  items: ValidatedLineItem[];
  taxRate?: unknown;
  discountAmount?: unknown;
}) {
  const subtotal = roundCurrency(params.items.reduce((acc, item) => acc + item.total, 0));
  const taxRateRaw = params.taxRate === undefined || params.taxRate === '' ? 0 : Number(params.taxRate);
  if (!Number.isFinite(taxRateRaw) || taxRateRaw < 0 || taxRateRaw > 100) {
    throw new FinanceValidationError('invalid-argument', 'taxRate must be between 0 and 100.');
  }
  const taxRate = Math.round(taxRateRaw * 100) / 100;

  const discountRaw =
    params.discountAmount === undefined || params.discountAmount === ''
      ? 0
      : Number(params.discountAmount);
  if (!Number.isFinite(discountRaw) || discountRaw < 0 || discountRaw > subtotal) {
    throw new FinanceValidationError(
      'invalid-argument',
      'discountAmount must be between 0 and the invoice subtotal.',
    );
  }
  const discountAmount = roundCurrency(discountRaw);
  const discountedBase = Math.max(0, roundCurrency(subtotal - discountAmount));
  const taxAmount = roundCurrency((discountedBase * taxRate) / 100);
  const totalAmount = Math.max(0, roundCurrency(discountedBase + taxAmount));

  return {
    subtotal,
    taxRate,
    taxAmount,
    discountAmount,
    totalAmount,
  };
}

export function validateAndComputeInvoicePayload(params: {
  input: Record<string, unknown>;
  existing?: Record<string, unknown> | null;
  nowIso: string;
}) {
  const { input, existing, nowIso } = params;
  const title = cleanText(input.title, 'Invoice title', 160, true);
  const referenceNo = cleanText(
    input.referenceNo || existing?.referenceNo,
    'Reference number',
    64,
    true,
  );
  const currency = validateCurrency(input.currency ?? existing?.currency);
  const issueDate = validateCalendarDate(
    input.issueDate || existing?.issueDate || nowIso.slice(0, 10),
    'Issue date',
    true,
  );
  const dueDate = validateCalendarDate(input.dueDate ?? existing?.dueDate ?? '', 'Due date', false);
  const recipientName = cleanText(input.recipientName, 'Recipient name', 120, true);
  const recipientOrg = cleanText(input.recipientOrg, 'Recipient organization', 120, false);
  const recipientEmail = cleanText(input.recipientEmail, 'Recipient email', 254, false);
  const recipientAddress = cleanText(input.recipientAddress, 'Recipient address', 300, false);
  const subject = cleanText(input.subject, 'Subject', 200, false);
  const bodyContent = cleanText(input.bodyContent, 'Body content', 5000, false);
  const paymentTerms = cleanText(input.paymentTerms, 'Payment terms', 300, false);
  const notes = cleanText(input.notes, 'Notes', 2000, false);
  const projectId = cleanText(input.projectId, 'Project ID', 128, false);

  const items = sanitizeLineItems(input.items, true);
  const money = computeMonetarySummary({
    items,
    taxRate: input.taxRate,
    discountAmount: input.discountAmount,
  });

  if (money.totalAmount <= 0) {
    throw new FinanceValidationError('invalid-argument', 'Invoice totalAmount must be greater than 0.');
  }

  const existingPayments = Array.isArray(existing?.payments)
    ? (existing!.payments as ValidatedPaymentRecord[])
    : [];
  const totalPaid = roundCurrency(
    existingPayments.reduce((sum, p) => sum + (Number(p?.amount) || 0), 0),
  );
  const balanceDue = Math.max(0, roundCurrency(money.totalAmount - totalPaid));

  const requestedStatus = typeof input.status === 'string' ? input.status.trim() : 'Issued';
  const validAdminInputStatuses = new Set<AllowedInvoiceStatus>([
    'Draft',
    'Issued',
    'Partially Paid',
    'Paid',
    'Overdue',
    'Void',
  ]);
  if (!validAdminInputStatuses.has(requestedStatus as AllowedInvoiceStatus)) {
    throw new FinanceValidationError('invalid-argument', `Invalid invoice status "${requestedStatus}".`);
  }

  let finalStatus: AllowedInvoiceStatus;
  if (requestedStatus === 'Void') {
    finalStatus = 'Void';
  } else if (existing?.status === 'Void') {
    throw new FinanceValidationError('failed-precondition', 'Voided invoices cannot be reopened.');
  } else if (totalPaid > 0 && balanceDue <= 0.005) {
    finalStatus = 'Paid';
  } else if (totalPaid > 0 && balanceDue > 0.005) {
    finalStatus = dueDate && dueDate < nowIso.slice(0, 10) ? 'Overdue' : 'Partially Paid';
  } else if (requestedStatus === 'Draft') {
    finalStatus = 'Draft';
  } else if (requestedStatus === 'Overdue' || (dueDate && dueDate < nowIso.slice(0, 10))) {
    finalStatus = 'Overdue';
  } else {
    finalStatus = 'Issued';
  }

  return {
    title,
    referenceNo,
    currency,
    issueDate,
    dueDate,
    recipientName,
    recipientOrg,
    recipientEmail,
    recipientAddress,
    subject,
    bodyContent,
    items,
    ...money,
    payments: existingPayments,
    totalPaid,
    balanceDue,
    paymentTerms,
    notes,
    projectId,
    status: finalStatus,
  };
}

export function computePaymentApplication(params: {
  invoice: {
    status: string;
    totalAmount: number;
    totalPaid?: number;
    balanceDue?: number;
    payments?: ValidatedPaymentRecord[];
    referenceNo?: string;
  };
  amount: unknown;
  method: unknown;
  date: unknown;
  reference?: unknown;
  notes?: unknown;
  recordedByName: string;
  recordedByUid: string;
  nowIso: string;
}) {
  const { invoice, nowIso } = params;
  if (invoice.status === 'Draft') {
    throw new FinanceValidationError(
      'failed-precondition',
      'Issue the draft invoice before recording manual payments.',
    );
  }
  if (invoice.status === 'Void') {
    throw new FinanceValidationError(
      'failed-precondition',
      'Payments cannot be recorded on a voided invoice.',
    );
  }

  const amountRaw = Number(params.amount);
  if (!Number.isFinite(amountRaw) || amountRaw <= 0) {
    throw new FinanceValidationError('invalid-argument', 'Payment amount must be greater than 0.');
  }
  const amount = roundCurrency(amountRaw);
  const method = String(params.method || '').trim() as AllowedPaymentMethod;
  if (!ALLOWED_PAYMENT_METHODS.has(method)) {
    throw new FinanceValidationError('invalid-argument', `Invalid payment method "${params.method}".`);
  }
  const date = validateCalendarDate(params.date || nowIso.slice(0, 10), 'Payment date', true);
  const reference =
    cleanText(params.reference, 'Payment reference', 100, false) ||
    `PAY-${nowIso.slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
  const notes = cleanText(params.notes, 'Payment notes', 500, false);

  const existingPayments = Array.isArray(invoice.payments) ? invoice.payments : [];
  const currentTotalPaid = roundCurrency(
    existingPayments.reduce((acc, p) => acc + (Number(p?.amount) || 0), 0),
  );
  const totalAmount = roundCurrency(Number(invoice.totalAmount) || 0);
  const currentBalanceDue = Math.max(0, roundCurrency(totalAmount - currentTotalPaid));

  if (currentBalanceDue <= 0.005) {
    throw new FinanceValidationError('failed-precondition', 'This invoice is already fully paid.');
  }
  if (amount > currentBalanceDue + 0.005) {
    throw new FinanceValidationError(
      'invalid-argument',
      `Payment amount (${amount.toFixed(2)}) exceeds remaining balance due (${currentBalanceDue.toFixed(2)}).`,
    );
  }

  const nextPaymentNumber = existingPayments.length + 1;
  const receiptNumber = `RCT-${(invoice.referenceNo || 'INV').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 20)}-${String(nextPaymentNumber).padStart(2, '0')}`;
  const paymentRecord: ValidatedPaymentRecord = {
    id: `pay_${Date.now()}_${nextPaymentNumber}`,
    receiptNumber,
    amount,
    date,
    reference,
    method,
    recordedBy: params.recordedByName,
    recordedByUid: params.recordedByUid,
    ...(notes ? { notes } : {}),
  };

  const payments = [...existingPayments, paymentRecord];
  const totalPaid = roundCurrency(currentTotalPaid + amount);
  const balanceDue = Math.max(0, roundCurrency(totalAmount - totalPaid));
  const nextStatus: AllowedInvoiceStatus = balanceDue <= 0.005 ? 'Paid' : 'Partially Paid';

  return {
    paymentRecord,
    payments,
    totalPaid,
    balanceDue,
    nextStatus,
  };
}

export function validateAndComputeProposalPayload(params: {
  input: Record<string, unknown>;
  existing?: Record<string, unknown> | null;
  actorUid: string;
  actorName: string;
  nowIso: string;
}) {
  const { input, existing, actorUid, actorName, nowIso } = params;
  const rawType = typeof (input.type ?? existing?.type) === 'string'
    ? String(input.type ?? existing?.type).trim()
    : 'quotation';
  if (!ALLOWED_PROPOSAL_TYPES.has(rawType as AllowedProposalType)) {
    throw new FinanceValidationError('invalid-argument', `Unsupported proposal type "${rawType}".`);
  }
  const type = rawType as AllowedProposalType;

  const title = cleanText(input.title, 'Proposal title', 160, true);
  const referenceNo = cleanText(
    input.referenceNo || existing?.referenceNo,
    'Reference number',
    64,
    true,
  );
  const currency = validateCurrency(input.currency ?? existing?.currency);
  const issueDate = validateCalendarDate(
    input.issueDate || existing?.issueDate || nowIso.slice(0, 10),
    'Issue date',
    true,
  );
  const validUntil = validateCalendarDate(
    input.validUntil ?? existing?.validUntil ?? '',
    'Valid until date',
    false,
  );
  const recipientName = cleanText(input.recipientName, 'Recipient name', 120, true);
  const recipientOrg = cleanText(input.recipientOrg, 'Recipient organization', 120, false);
  const recipientEmail = cleanText(input.recipientEmail, 'Recipient email', 254, false);
  const recipientAddress = cleanText(input.recipientAddress, 'Recipient address', 300, false);
  const subject = cleanText(input.subject, 'Subject', 200, false);
  const bodyContent = cleanText(input.bodyContent, 'Proposal body content', 5000, true);
  const paymentTerms = cleanText(input.paymentTerms, 'Payment terms', 300, false);
  const notes = cleanText(input.notes, 'Notes', 2000, false);
  const projectId = cleanText(input.projectId, 'Project ID', 128, false);
  const adminRevisionNote = cleanText(input.revisionNote, 'Revision note', 1000, false);

  const items = sanitizeLineItems(input.items, false);
  const money = computeMonetarySummary({
    items,
    taxRate: input.taxRate,
    discountAmount: input.discountAmount,
  });

  const requestedStatus = typeof input.status === 'string' ? input.status.trim() : 'Issued';
  const validProposalStatuses = new Set<AllowedProposalStatus>([
    'Draft',
    'Issued',
    'Sent',
    'Under Review',
    'Revision Requested',
    'Approved',
    'Declined',
    'Expired',
  ]);
  if (!validProposalStatuses.has(requestedStatus as AllowedProposalStatus)) {
    throw new FinanceValidationError('invalid-argument', `Invalid proposal status "${requestedStatus}".`);
  }

  const prevHistory = Array.isArray(existing?.revisionHistory)
    ? (existing!.revisionHistory as ProposalRevisionItem[])
    : [];
  const nextVersion = prevHistory.length + 1;
  const action: ProposalRevisionItem['action'] = !existing
    ? requestedStatus === 'Draft'
      ? 'Created'
      : 'Issued'
    : existing.status === 'Revision Requested' && ['Issued', 'Sent', 'Under Review'].includes(requestedStatus)
      ? 'Revised'
      : requestedStatus === 'Issued' && existing.status === 'Draft'
        ? 'Issued'
        : 'Updated';

  const newEntry: ProposalRevisionItem = {
    version: nextVersion,
    actorUid,
    actorName,
    actorRole: 'Admin',
    action,
    ...(adminRevisionNote ? { comment: adminRevisionNote } : {}),
    timestamp: nowIso,
  };

  return {
    type,
    title,
    referenceNo,
    currency,
    issueDate,
    validUntil,
    recipientName,
    recipientOrg,
    recipientEmail,
    recipientAddress,
    subject,
    bodyContent,
    items,
    ...money,
    paymentTerms,
    notes,
    projectId,
    status: requestedStatus as AllowedProposalStatus,
    revisionHistory: [...prevHistory, newEntry].slice(-50),
  };
}

export function validateClientProposalResponse(params: {
  proposal: Record<string, unknown>;
  response: unknown;
  comment: unknown;
  uid: string;
  actorName: string;
  nowIso: string;
}) {
  const { proposal, response, comment, uid, actorName, nowIso } = params;
  const currentStatus = String(proposal.status || '') as AllowedProposalStatus;
  if (!CLIENT_RESPONDABLE_PROPOSAL_STATUSES.has(currentStatus)) {
    throw new FinanceValidationError(
      'failed-precondition',
      `Proposal in status "${currentStatus}" cannot be responded to right now.`,
    );
  }

  const cleanResponse = typeof response === 'string' ? response.trim() : '';
  if (!['Approved', 'Revision Requested', 'Declined'].includes(cleanResponse)) {
    throw new FinanceValidationError(
      'invalid-argument',
      'response must be "Approved", "Revision Requested", or "Declined".',
    );
  }
  const typedResponse = cleanResponse as 'Approved' | 'Revision Requested' | 'Declined';
  const cleanComment = cleanText(
    comment,
    'Comment',
    1500,
    typedResponse === 'Revision Requested',
  );

  const prevHistory = Array.isArray(proposal.revisionHistory)
    ? (proposal.revisionHistory as ProposalRevisionItem[])
    : [];

  const historyEntry: ProposalRevisionItem = {
    version: prevHistory.length + 1,
    actorUid: uid,
    actorName,
    actorRole: 'Client',
    action: typedResponse,
    ...(cleanComment ? { comment: cleanComment } : {}),
    timestamp: nowIso,
  };

  return {
    nextStatus: typedResponse as AllowedProposalStatus,
    clientResponse: {
      action: typedResponse,
      ...(cleanComment ? { comment: cleanComment } : {}),
      respondedByUid: uid,
      respondedByName: actorName,
      respondedAt: nowIso,
    },
    revisionHistory: [...prevHistory, historyEntry].slice(-50),
  };
}

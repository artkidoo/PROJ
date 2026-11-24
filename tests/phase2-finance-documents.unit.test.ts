import assert from 'node:assert/strict';
import {
  calculateCommercialTotals,
  deriveClientInvoiceStatus,
  formatMoney,
  isCommercialDocumentType,
  isLegacyCommercialWorkspaceDoc,
  validateSplitContributorsTotal,
} from '../src/lib/financeDocuments';
import {
  LEGACY_FINANCE_STORAGE_PREFIX,
  buildInvoiceCallablePayloadFromLegacy,
  buildNonCommercialWorkspaceDocPayloadFromLegacy,
  buildProposalCallablePayloadFromLegacy,
  classifyLegacyDocumentTarget,
  readLegacyLocalStorageFinanceRecords,
} from '../src/lib/legacyFinanceMigration';
import {
  FinanceValidationError,
  computeMonetarySummary,
  computePaymentApplication,
  validateAndComputeInvoicePayload,
  validateAndComputeProposalPayload,
  validateClientProposalResponse,
} from '../functions/src/financeValidation';
import type { CorporateDocument, Workspace } from '../src/types';

function makeWorkspace(id: string, name: string): Workspace {
  return {
    id,
    name,
    type: 'Brand',
    clientCategory: 'brand',
    ownerId: 'user-1',
    status: 'Active',
    description: 'Workspace',
    contactEmail: 'brand@example.com',
    brand: {
      name,
      primaryColor: '#FF1E1E',
      secondaryColor: '#0A0A0A',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function run() {
  // 1. financeDocuments: calculations, rounding & multi-currency formatting
  const calc = calculateCommercialTotals({
    items: [
      { description: 'Brand Kit', quantity: 2, unitPrice: 450.125, total: 0 },
      { description: 'Press Deck', quantity: 1, unitPrice: 300, total: 0 },
    ],
    taxRate: 7.5,
    discountAmount: 100,
  });
  // 450.125 rounds to 450.13 -> *2 = 900.26 + 300 = 1200.26
  assert.equal(calc.subtotal, 1200.26);
  assert.equal(calc.discountAmount, 100);
  // taxable = 1100.26, tax 7.5% = 82.5195 -> 82.52, total = 1182.78
  assert.equal(calc.taxAmount, 82.52);
  assert.equal(calc.totalAmount, 1182.78);

  // Discount capped at subtotal
  const capped = calculateCommercialTotals({
    items: [{ description: 'Item', quantity: 1, unitPrice: 100, total: 100 }],
    taxRate: 10,
    discountAmount: 500,
  });
  assert.equal(capped.discountAmount, 100);
  assert.equal(capped.taxAmount, 0);
  assert.equal(capped.totalAmount, 0);

  assert.equal(formatMoney(1250.5, 'USD'), '$1,250.50');
  assert.equal(formatMoney(1250.5, 'GBP'), '£1,250.50');
  assert.equal(formatMoney(1250.5, 'EUR'), '€1,250.50');
  assert.equal(formatMoney(1250.5, 'NGN'), '₦1,250.50');
  assert.equal(formatMoney(1250.5, 'CAD'), 'CA$1,250.50');
  assert.equal(formatMoney(100, 'UNKNOWN'), '$100.00');

  // 2. deriveClientInvoiceStatus
  assert.equal(
    deriveClientInvoiceStatus({ status: 'Void', totalAmount: 1000, totalPaid: 0, dueDate: '2020-01-01' }, '2026-06-01'),
    'Void',
  );
  assert.equal(
    deriveClientInvoiceStatus({ status: 'Draft', totalAmount: 1000, totalPaid: 0, dueDate: '2020-01-01' }, '2026-06-01'),
    'Draft',
  );
  assert.equal(
    deriveClientInvoiceStatus({ status: 'Issued', totalAmount: 1000, totalPaid: 1000, dueDate: '2020-01-01' }, '2026-06-01'),
    'Paid',
  );
  assert.equal(
    deriveClientInvoiceStatus({ status: 'Issued', totalAmount: 1000, totalPaid: 400, dueDate: '2026-12-01' }, '2026-06-01'),
    'Partially Paid',
  );
  assert.equal(
    deriveClientInvoiceStatus({ status: 'Issued', totalAmount: 1000, totalPaid: 400, dueDate: '2026-01-01' }, '2026-06-01'),
    'Overdue',
  );
  assert.equal(
    deriveClientInvoiceStatus({ status: 'Issued', totalAmount: 1000, totalPaid: 0, dueDate: '2026-01-01' }, '2026-06-01'),
    'Overdue',
  );
  assert.equal(
    deriveClientInvoiceStatus({ status: 'Issued', totalAmount: 1000, totalPaid: 0, dueDate: '2026-12-01' }, '2026-06-01'),
    'Issued',
  );

  // 3. Commercial document detection & split sheet validation
  assert.equal(isCommercialDocumentType('invoice'), true);
  assert.equal(isCommercialDocumentType('QUOTATION'), true);
  assert.equal(isCommercialDocumentType('partnership_proposal'), true);
  assert.equal(isCommercialDocumentType('split_sheet'), false);
  assert.equal(isCommercialDocumentType('company_profile'), false);

  assert.equal(isLegacyCommercialWorkspaceDoc({ type: 'official_letter', issuedByAdmin: true }), true);
  assert.equal(isLegacyCommercialWorkspaceDoc({ type: 'invoice', issuedByAdmin: false }), true);
  assert.equal(isLegacyCommercialWorkspaceDoc({ type: 'split_sheet' }), false);

  assert.deepEqual(validateSplitContributorsTotal([{ percent: 50 }, { percent: 50 }]), {
    total: 100,
    isValid: true,
  });
  assert.deepEqual(validateSplitContributorsTotal([{ percent: 60 }, { percent: 30 }]), {
    total: 90,
    isValid: false,
  });

  // 4. legacyFinanceMigration: non-destructive reader & payload builders
  const legacyDocs: CorporateDocument[] = [
    {
      id: 'legacy-inv-1',
      workspaceId: 'ws-apex-brand',
      type: 'invoice',
      title: 'Retainer Invoice',
      referenceNo: 'INV-9001',
      date: '2026-02-01',
      validityDate: '2026-03-01',
      recipientName: 'Maya Chen',
      recipientOrg: 'Apex Dynamics',
      authorName: 'Admin',
      authorRole: 'Finance',
      status: 'Issued',
      subject: 'Retainer',
      bodyContent: 'Services',
      currency: 'GBP',
      items: [{ description: 'Design Retainer', quantity: 1, unitPrice: 1500, total: 1500 }],
      taxRate: 20,
      createdAt: '2026-02-01T00:00:00.000Z',
    },
    {
      id: 'legacy-prop-1',
      workspaceId: 'ws-unknown',
      type: 'quotation',
      title: 'Launch Quote',
      referenceNo: 'QT-101',
      date: '2026-02-10',
      recipientName: 'Apex Team',
      recipientOrg: 'Apex Dynamics',
      authorName: 'Admin',
      authorRole: 'Producer',
      status: 'Approved',
      subject: 'Launch Package',
      bodyContent: 'Deliverables scope',
      totalAmount: 2400,
      createdAt: '2026-02-10T00:00:00.000Z',
    },
    {
      id: 'legacy-doc-1',
      workspaceId: 'ws-live-1',
      type: 'company_profile',
      title: 'Apex Brand Profile',
      referenceNo: 'DOC-001',
      date: '2026-02-12',
      recipientName: 'Apex Team',
      authorName: 'Maya Chen',
      authorRole: 'Brand Lead',
      status: 'Approved',
      subject: 'Brand Dossier',
      bodyContent: 'Story',
      createdAt: '2026-02-12T00:00:00.000Z',
    },
  ];

  const storageMap = new Map<string, string>([
    [`${LEGACY_FINANCE_STORAGE_PREFIX}_documents`, JSON.stringify(legacyDocs)],
    [`${LEGACY_FINANCE_STORAGE_PREFIX}_workspaces`, JSON.stringify([{ id: 'ws-live-1', name: 'Live Studio' }])],
  ]);
  const mockStorage: Pick<Storage, 'getItem'> = {
    getItem: (key: string) => storageMap.get(key) ?? null,
  };
  const liveWorkspaces = [makeWorkspace('ws-live-1', 'Apex Dynamics')];

  assert.equal(classifyLegacyDocumentTarget('invoice'), 'invoice');
  assert.equal(classifyLegacyDocumentTarget('receipt'), 'invoice');
  assert.equal(classifyLegacyDocumentTarget('quotation'), 'proposal');
  assert.equal(classifyLegacyDocumentTarget('partnership_proposal'), 'proposal');
  assert.equal(classifyLegacyDocumentTarget('split_sheet'), 'workspace_document');

  const inspected = readLegacyLocalStorageFinanceRecords(liveWorkspaces, mockStorage);
  assert.equal(inspected.length, 3);
  // Existing storage map remains untouched (read-only)
  assert.equal(storageMap.size, 2);

  assert.equal(inspected[0].targetCollection, 'invoice');
  assert.equal(inspected[0].suggestedFirestoreWorkspaceId, 'ws-live-1'); // matched by name 'Apex Dynamics'
  assert.equal(inspected[0].computedTotal, 1800); // 1500 + 20% VAT

  assert.equal(inspected[1].targetCollection, 'proposal');
  assert.equal(inspected[1].suggestedFirestoreWorkspaceId, 'ws-live-1'); // matched by recipientOrg 'Apex Dynamics'
  assert.equal(inspected[1].computedTotal, 2400);

  assert.equal(inspected[2].targetCollection, 'workspace_document');
  assert.equal(inspected[2].suggestedFirestoreWorkspaceId, 'ws-live-1'); // matched by direct ID

  const invPayload = buildInvoiceCallablePayloadFromLegacy(inspected[0], 'ws-live-1');
  assert.equal(invPayload.id, 'legacy_legacy-inv-1');
  assert.equal(invPayload.currency, 'GBP');
  assert.equal(invPayload.taxRate, 20);

  const propPayload = buildProposalCallablePayloadFromLegacy(inspected[1], 'ws-live-1');
  assert.equal(propPayload.type, 'quotation');
  assert.equal(propPayload.status, 'Approved');
  assert.equal(propPayload.items.length, 1);
  assert.equal(propPayload.items[0].unitPrice, 2400);

  const wsDocPayload = buildNonCommercialWorkspaceDocPayloadFromLegacy(inspected[2], 'ws-live-1');
  assert.equal(wsDocPayload.type, 'company_profile');
  assert.equal(wsDocPayload.workspaceId, 'ws-live-1');

  // 5. Server-side financeValidation helpers
  const nowIso = '2026-06-15T12:00:00.000Z';

  // computeMonetarySummary
  const summary = computeMonetarySummary({
    items: [{ description: 'Mix & Master', quantity: 2, unitPrice: 500, total: 1000 }],
    taxRate: 10,
    discountAmount: 100,
  });
  assert.equal(summary.subtotal, 1000);
  assert.equal(summary.discountAmount, 100);
  assert.equal(summary.taxAmount, 90);
  assert.equal(summary.totalAmount, 990);

  assert.throws(
    () =>
      computeMonetarySummary({
        items: [{ description: 'Item', quantity: 1, unitPrice: 100, total: 100 }],
        discountAmount: 150,
      }),
    FinanceValidationError,
  );

  // validateAndComputeInvoicePayload
  const validatedInvoice = validateAndComputeInvoicePayload({
    input: {
      title: 'Album Artwork Package',
      referenceNo: 'INV-2026-001',
      currency: 'USD',
      issueDate: '2026-06-01',
      dueDate: '2026-06-30',
      recipientName: 'Kaelen Ross',
      items: [{ description: 'Cover Art', quantity: 1, unitPrice: 1200 }],
      taxRate: 5,
      status: 'Issued',
    },
    nowIso,
  });
  assert.equal(validatedInvoice.totalAmount, 1260);
  assert.equal(validatedInvoice.balanceDue, 1260);
  assert.equal(validatedInvoice.status, 'Issued');

  // Reopening voided invoice rejected
  assert.throws(
    () =>
      validateAndComputeInvoicePayload({
        input: {
          title: 'Voided',
          referenceNo: 'INV-VOID',
          recipientName: 'Client',
          items: [{ description: 'Item', quantity: 1, unitPrice: 100 }],
          status: 'Issued',
        },
        existing: { status: 'Void', referenceNo: 'INV-VOID' },
        nowIso,
      }),
    FinanceValidationError,
  );

  // computePaymentApplication: partial + final + receipt numbering + overpayment guard
  const firstPayment = computePaymentApplication({
    invoice: {
      status: 'Issued',
      totalAmount: 1260,
      payments: [],
      referenceNo: 'INV-2026-001',
    },
    amount: 500,
    method: 'Wire Transfer',
    date: '2026-06-15',
    reference: 'WIRE-001',
    recordedByName: 'Admin HQ',
    recordedByUid: 'admin-1',
    nowIso,
  });
  assert.equal(firstPayment.paymentRecord.receiptNumber, 'RCT-INV-2026-001-01');
  assert.equal(firstPayment.totalPaid, 500);
  assert.equal(firstPayment.balanceDue, 760);
  assert.equal(firstPayment.nextStatus, 'Partially Paid');

  assert.throws(
    () =>
      computePaymentApplication({
        invoice: {
          status: 'Partially Paid',
          totalAmount: 1260,
          payments: firstPayment.payments,
          referenceNo: 'INV-2026-001',
        },
        amount: 800,
        method: 'ACH',
        date: '2026-06-16',
        recordedByName: 'Admin HQ',
        recordedByUid: 'admin-1',
        nowIso,
      }),
    /exceeds remaining balance due/,
  );

  const finalPayment = computePaymentApplication({
    invoice: {
      status: 'Partially Paid',
      totalAmount: 1260,
      payments: firstPayment.payments,
      referenceNo: 'INV-2026-001',
    },
    amount: 760,
    method: 'ACH',
    date: '2026-06-16',
    recordedByName: 'Admin HQ',
    recordedByUid: 'admin-1',
    nowIso,
  });
  assert.equal(finalPayment.paymentRecord.receiptNumber, 'RCT-INV-2026-001-02');
  assert.equal(finalPayment.totalPaid, 1260);
  assert.equal(finalPayment.balanceDue, 0);
  assert.equal(finalPayment.nextStatus, 'Paid');

  // Draft & Void invoices cannot receive manual payments
  assert.throws(
    () =>
      computePaymentApplication({
        invoice: { status: 'Draft', totalAmount: 500, payments: [] },
        amount: 100,
        method: 'ACH',
        date: '2026-06-15',
        recordedByName: 'Admin',
        recordedByUid: 'admin-1',
        nowIso,
      }),
    /Issue the draft invoice/,
  );
  assert.throws(
    () =>
      computePaymentApplication({
        invoice: { status: 'Void', totalAmount: 500, payments: [] },
        amount: 100,
        method: 'ACH',
        date: '2026-06-15',
        recordedByName: 'Admin',
        recordedByUid: 'admin-1',
        nowIso,
      }),
    /voided invoice/,
  );

  // validateAndComputeProposalPayload & validateClientProposalResponse
  const proposal = validateAndComputeProposalPayload({
    input: {
      type: 'partnership_proposal',
      title: 'Q3 Co-Branding Proposal',
      referenceNo: 'PROP-2026-01',
      currency: 'USD',
      recipientName: 'Northbound Co.',
      bodyContent: 'Scope of collaboration and rollout deliverables.',
      items: [{ description: 'Campaign Package', quantity: 1, unitPrice: 3000 }],
      status: 'Issued',
    },
    actorUid: 'admin-1',
    actorName: 'Admin HQ',
    nowIso,
  });
  assert.equal(proposal.totalAmount, 3000);
  assert.equal(proposal.revisionHistory.length, 1);
  assert.equal(proposal.revisionHistory[0].action, 'Issued');

  // Revision Requested requires a comment
  assert.throws(
    () =>
      validateClientProposalResponse({
        proposal: { status: 'Issued', revisionHistory: proposal.revisionHistory },
        response: 'Revision Requested',
        comment: '   ',
        uid: 'client-1',
        actorName: 'Northbound Owner',
        nowIso,
      }),
    /Comment is required/,
  );

  const revReq = validateClientProposalResponse({
    proposal: { status: 'Issued', revisionHistory: proposal.revisionHistory },
    response: 'Revision Requested',
    comment: 'Please adjust Phase 2 timeline.',
    uid: 'client-1',
    actorName: 'Northbound Owner',
    nowIso,
  });
  assert.equal(revReq.nextStatus, 'Revision Requested');
  assert.equal(revReq.clientResponse.comment, 'Please adjust Phase 2 timeline.');
  assert.equal(revReq.revisionHistory.length, 2);

  // Client approval from Revision Requested works, and afterwards Draft/Approved/Declined cannot be responded to again
  const approved = validateClientProposalResponse({
    proposal: { status: 'Revision Requested', revisionHistory: revReq.revisionHistory },
    response: 'Approved',
    comment: 'Approved!',
    uid: 'client-1',
    actorName: 'Northbound Owner',
    nowIso,
  });
  assert.equal(approved.nextStatus, 'Approved');
  assert.equal(approved.revisionHistory.length, 3);

  assert.throws(
    () =>
      validateClientProposalResponse({
        proposal: { status: 'Approved', revisionHistory: approved.revisionHistory },
        response: 'Declined',
        comment: 'Too late',
        uid: 'client-1',
        actorName: 'Northbound Owner',
        nowIso,
      }),
    /cannot be responded to right now/,
  );

  console.log('ALL PHASE 2 FINANCE & DOCUMENT UNIT TESTS PASSED');
}

run();

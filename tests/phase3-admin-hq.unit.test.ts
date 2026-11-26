/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Phase 3 Admin HQ Restructuring Unit & Structural Verification Tests
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  ADMIN_HQ_SECTIONS,
  classifyCreativeProductSegment,
  computeDepartmentFinanceSummary,
  formatAdminHQHash,
  inferDepartmentFromCategory,
  isProjectShowcaseEligible,
  isTemplateFamilyRelevantToDepartment,
  isTemplateRelevantToDepartment,
  normalizeAdminSubTab,
  parseAdminHQHash,
  resolveClientDepartment,
  resolveProjectDepartment,
  resolveWorkspaceDepartment,
} from '../src/lib/adminHQNavigation';
import type {
  ClientProfile,
  ClientProject,
  InvoiceRecord,
  ProposalRecord,
  Workspace,
} from '../src/types';

function run() {
  // 1. Exact 8 Admin HQ primary sections & sub-tab structure
  console.log('[TEST 1] Verify exact 8 canonical Admin HQ sections');
  assert.equal(ADMIN_HQ_SECTIONS.length, 8);
  assert.deepEqual(
    ADMIN_HQ_SECTIONS.map(s => s.id),
    [
      'hq-overview',
      'artist-department',
      'brand-department',
      'shared-operations',
      'creative-products',
      'finance',
      'brand-room',
      'platform-settings',
    ],
  );

  assert.deepEqual(
    ADMIN_HQ_SECTIONS.find(s => s.id === 'artist-department')?.subTabs,
    [
      'accounts-workspaces',
      'requests-projects',
      'releases',
      'deliverables-reviews',
      'templates-documents',
    ],
  );
  assert.deepEqual(
    ADMIN_HQ_SECTIONS.find(s => s.id === 'brand-department')?.subTabs,
    [
      'accounts-workspaces',
      'requests-projects',
      'deliverables-reviews',
      'templates-collateral',
    ],
  );
  assert.deepEqual(
    ADMIN_HQ_SECTIONS.find(s => s.id === 'shared-operations')?.subTabs,
    [
      'requests-enquiries',
      'master-studio',
      'qa-reviews',
      'services-packages',
    ],
  );
  assert.deepEqual(
    ADMIN_HQ_SECTIONS.find(s => s.id === 'finance')?.subTabs,
    ['overview', 'subscriptions', 'plans', 'payments', 'invoices', 'proposals'],
  );

  // 2. Hash parsing, formatting & legacy alias backwards compatibility
  console.log('[TEST 2] Verify URL hash routing, normalization & legacy aliases');
  assert.deepEqual(parseAdminHQHash(''), { section: 'hq-overview' });
  assert.deepEqual(parseAdminHQHash('#/public/services'), { section: 'hq-overview' });
  assert.deepEqual(parseAdminHQHash('#/admin/artist-department/releases'), {
    section: 'artist-department',
    subTab: 'releases',
  });
  assert.deepEqual(parseAdminHQHash('#/admin/artist-department/unknown-tab'), {
    section: 'artist-department',
    subTab: 'accounts-workspaces',
  });
  assert.deepEqual(parseAdminHQHash('#/admin/invoices-payments'), {
    section: 'finance',
    subTab: 'invoices',
  });
  assert.deepEqual(parseAdminHQHash('#/admin/creative-requests'), {
    section: 'shared-operations',
    subTab: 'requests-enquiries',
  });
  assert.equal(formatAdminHQHash('hq-overview'), '#/admin/hq-overview');
  assert.equal(
    formatAdminHQHash('brand-department', 'templates-collateral'),
    '#/admin/brand-department/templates-collateral',
  );
  assert.equal(normalizeAdminSubTab('brand-room', 'anything'), undefined);

  // 3. Client, Workspace & Project department partitioning (including legacy mappings)
  console.log('[TEST 3] Verify Artist vs Brand department partitioning & legacy mapping');
  assert.equal(
    resolveClientDepartment({ accountType: 'Artist' } as ClientProfile),
    'Artist',
  );
  assert.equal(
    resolveClientDepartment({
      accountType: 'Brand',
      rawLegacyAccountType: 'Record Label',
    } as ClientProfile),
    'Brand',
  );
  assert.equal(
    resolveWorkspaceDepartment({ type: 'Agency' } as Workspace),
    'Brand',
  );
  assert.equal(
    resolveWorkspaceDepartment({ type: 'Artist', clientCategory: 'artist' } as Workspace),
    'Artist',
  );
  assert.equal(inferDepartmentFromCategory('Cover Artwork & Visuals'), 'Artist');
  assert.equal(inferDepartmentFromCategory('Brand Identity System'), 'Brand');

  const clientsByUid = new Map<string, Pick<ClientProfile, 'accountType' | 'rawLegacyAccountType'>>([
    ['u-artist', { accountType: 'Artist' }],
    ['u-brand', { accountType: 'Brand', rawLegacyAccountType: 'Company' }],
  ]);
  const workspacesById = new Map<string, Pick<Workspace, 'type' | 'clientCategory'>>([
    ['w-artist', { type: 'Artist', clientCategory: 'artist' }],
    ['w-label', { type: 'Label', clientCategory: 'label' }],
  ]);

  assert.equal(
    resolveProjectDepartment(
      { id: 'p1', clientUid: 'u-artist', workspaceId: 'w-artist', category: 'Cover Art' },
      clientsByUid,
      workspacesById,
    ),
    'Artist',
  );
  assert.equal(
    resolveProjectDepartment(
      { id: 'p2', clientUid: 'u-brand', workspaceId: 'w-label', category: 'Brand Identity' },
      clientsByUid,
      workspacesById,
    ),
    'Brand',
  );
  assert.equal(
    resolveProjectDepartment(
      { id: 'p3', clientUid: 'unknown', workspaceId: undefined, category: 'Custom Consultation' },
      clientsByUid,
      workspacesById,
    ),
    'Unassigned',
  );

  // 4. Creative Products 3-audience segment partitioning
  console.log('[TEST 4] Verify Creative Products segment classification');
  assert.equal(classifyCreativeProductSegment('Artist'), 'artist');
  assert.equal(classifyCreativeProductSegment('Brand'), 'brand');
  assert.equal(classifyCreativeProductSegment('Business'), 'brand');
  assert.equal(classifyCreativeProductSegment('Brand & Business'), 'brand');
  assert.equal(classifyCreativeProductSegment('Shared'), 'shared');

  // 5. Template relevance filtering
  console.log('[TEST 5] Verify Template & Template Family department scoping');
  assert.equal(isTemplateRelevantToDepartment('Music Release Poster', 'Artist'), true);
  assert.equal(isTemplateRelevantToDepartment('Corporate Profile', 'Artist'), false);
  assert.equal(isTemplateRelevantToDepartment('Corporate Profile', 'Brand'), true);
  assert.equal(isTemplateFamilyRelevantToDepartment('Artist Branding', 'artist', 'Artist'), true);
  assert.equal(isTemplateFamilyRelevantToDepartment('Clean Commercial', 'commercial', 'Brand'), true);

  // 6. Brand Room showcase opt-in consent privacy gate
  console.log('[TEST 6] Verify Brand Room showcase privacy gate (opt-in required)');
  const completedNoConsent: ClientProject = {
    id: 'proj-private',
    clientUid: 'u-artist',
    title: 'Private Album Launch',
    description: 'Confidential release',
    category: 'Music Release Package',
    status: 'Completed',
    stage: 'Delivered',
    progress: 100,
    startDate: '2026-01-01',
    expectedDeliveryDate: '2026-02-01',
    createdAt: '2026-01-01',
    updatedAt: '2026-02-01',
  };
  assert.equal(isProjectShowcaseEligible(completedNoConsent, new Set()), false);
  assert.equal(
    isProjectShowcaseEligible(completedNoConsent, new Set(['proj-private'])),
    true,
  );
  assert.equal(
    isProjectShowcaseEligible({ ...completedNoConsent, allowPublicShowcase: true }, new Set()),
    true,
  );
  assert.equal(
    isProjectShowcaseEligible(
      { ...completedNoConsent, status: 'In Progress', stage: 'In Production', progress: 40, allowPublicShowcase: true },
      new Set(['proj-private']),
    ),
    false,
  );

  // 7. Finance department & currency summary
  console.log('[TEST 7] Verify multi-currency & Artist vs Brand finance aggregation');
  const invoices: InvoiceRecord[] = [
    {
      id: 'inv-1',
      referenceNo: 'INV-001',
      title: 'EP Artwork',
      workspaceId: 'w-artist',
      clientUid: 'u-artist',
      recipientName: 'Kora',
      recipientEmail: 'kora@example.com',
      bodyContent: 'EP Artwork scope invoice',
      currency: 'USD',
      issueDate: '2026-01-10',
      dueDate: '2026-01-20',
      status: 'Paid',
      items: [{ description: 'Cover', quantity: 1, unitPrice: 500, total: 500 }],
      subtotal: 500,
      taxRate: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 500,
      totalPaid: 500,
      balanceDue: 0,
      payments: [
        {
          id: 'pay-1',
          amount: 500,
          date: '2026-01-12',
          reference: 'WIRE-001',
          method: 'Wire Transfer',
          recordedBy: 'admin-1',
        },
      ],
      issuedByAdmin: true,
      issuedByUid: 'admin-1',
      createdAt: '2026-01-10',
      updatedAt: '2026-01-12',
    },
    {
      id: 'inv-2',
      referenceNo: 'INV-002',
      title: 'Brand Rebrand',
      workspaceId: 'w-label',
      clientUid: 'u-brand',
      recipientName: 'Apex',
      recipientEmail: 'apex@example.com',
      bodyContent: 'Brand Identity system invoice',
      currency: 'USD',
      issueDate: '2026-01-01',
      dueDate: '2026-01-05',
      status: 'Issued',
      items: [{ description: 'Identity', quantity: 1, unitPrice: 1200, total: 1200 }],
      subtotal: 1200,
      taxRate: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 1200,
      totalPaid: 0,
      balanceDue: 1200,
      payments: [],
      issuedByAdmin: true,
      issuedByUid: 'admin-1',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'inv-void',
      referenceNo: 'INV-003',
      title: 'Cancelled Draft',
      workspaceId: 'w-label',
      clientUid: 'u-brand',
      recipientName: 'Apex',
      recipientEmail: 'apex@example.com',
      bodyContent: 'Voided invoice',
      currency: 'USD',
      issueDate: '2026-01-01',
      dueDate: '2026-01-15',
      status: 'Void',
      items: [{ description: 'Voided', quantity: 1, unitPrice: 9000, total: 9000 }],
      subtotal: 9000,
      taxRate: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 9000,
      totalPaid: 0,
      balanceDue: 0,
      payments: [],
      issuedByAdmin: true,
      issuedByUid: 'admin-1',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];
  const proposals: ProposalRecord[] = [
    {
      id: 'prop-1',
      referenceNo: 'PROP-001',
      type: 'quotation',
      title: 'Tour Graphics',
      workspaceId: 'w-artist',
      clientUid: 'u-artist',
      recipientName: 'Kora',
      recipientEmail: 'kora@example.com',
      bodyContent: 'Tour visual kit quotation',
      currency: 'USD',
      issueDate: '2026-02-01',
      validUntil: '2026-03-01',
      status: 'Sent',
      items: [{ description: 'Tour Assets', quantity: 1, unitPrice: 800, total: 800 }],
      subtotal: 800,
      taxRate: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 800,
      issuedByAdmin: true,
      issuedByUid: 'admin-1',
      createdAt: '2026-02-01',
      updatedAt: '2026-02-01',
    },
  ];

  const finSummary = computeDepartmentFinanceSummary(
    invoices,
    proposals,
    workspacesById,
    clientsByUid,
    '2026-02-15',
  );
  assert.equal(finSummary.activeInvoicesCount, 2);
  assert.equal(finSummary.paidInvoicesCount, 1);
  assert.equal(finSummary.overdueInvoicesCount, 1);
  assert.equal(finSummary.artistInvoicesCount, 1);
  assert.equal(finSummary.brandInvoicesCount, 1);
  assert.equal(finSummary.awaitingProposalsCount, 1);
  assert.equal(finSummary.byCurrency.length, 1);
  assert.equal(finSummary.byCurrency[0].invoiced, 1700);
  assert.equal(finSummary.byCurrency[0].collected, 500);
  assert.equal(finSummary.byCurrency[0].outstanding, 1200);
  assert.equal(finSummary.byCurrency[0].artistInvoiced, 500);
  assert.equal(finSummary.byCurrency[0].brandInvoiced, 1200);
  assert.equal(finSummary.byCurrency[0].quotedPipeline, 800);

  // 8. Structural verification of Phase 3 components
  console.log('[TEST 8] Verify Phase 3 architectural boundaries in source files');
  const root = process.cwd();
  const adminHqSrc = fs.readFileSync(path.join(root, 'src/components/admin/AdminHQ.tsx'), 'utf8');
  const releasesSrc = fs.readFileSync(
    path.join(root, 'src/components/admin/AdminArtistReleasesPanel.tsx'),
    'utf8',
  );
  const financeConsoleSrc = fs.readFileSync(
    path.join(root, 'src/components/admin/AdminFinanceConsole.tsx'),
    'utf8',
  );
  const showcaseSrc = fs.readFileSync(
    path.join(root, 'src/components/admin/brand-room/PortfolioShowcasesPanel.tsx'),
    'utf8',
  );

  assert.ok(adminHqSrc.includes('ADMIN_HQ_SECTIONS'));
  assert.ok(adminHqSrc.includes('parseAdminHQHash'));
  assert.ok(adminHqSrc.includes("case 'brand-room'"));
  assert.ok(!releasesSrc.includes('collectionGroup('), 'Releases panel must not use collectionGroup(releases)');
  assert.ok(!financeConsoleSrc.includes('localStorage'), 'Finance console must be purely Firestore-backed');
  assert.ok(showcaseSrc.includes('isProjectShowcaseEligible'));

  console.log('ALL PHASE 3 ADMIN HQ UNIT & STRUCTURAL TESTS PASSED.');
}

run();

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  const engine = await import('../functions/src/subscriptionEngine');
  const access = await import('../src/lib/creativeProductAccess');
  const subsLib = await import('../src/lib/subscriptions');
  const navLib = await import('../src/lib/adminHQNavigation');

  console.log('[PHASE 7 TEST 1] Subscription plan validation & Nigeria-first NGN/USD pricing');
  const plan = engine.sanitizeSubscriptionPlanInput({
    name: 'Artist Pro Membership',
    description: 'Unlimited release artwork templates, EPK packs, and streaming assets.',
    audience: 'Artist',
    tierName: 'Pro',
    currency: 'NGN',
    billingFrequencies: ['Monthly', 'Annual'],
    monthlyPrice: 25000,
    annualPrice: 250000,
    includedCategories: ['Streaming Platform Packs', 'Music Release Promo Packs'],
    includedProductIds: ['prod_artist_epk_1'],
    downloadLimitPerPeriod: -1,
    trialDays: 7,
    gracePeriodDays: 5,
    renewalBehavior: 'Auto-Renew',
    visibility: 'Public',
    status: 'Published',
  });
  assert.equal(plan.currency, 'NGN');
  assert.equal(plan.monthlyPrice, 25000);
  assert.equal(plan.annualPrice, 250000);
  assert.equal(plan.audience, 'Artist');

  assert.throws(
    () =>
      engine.sanitizeSubscriptionPlanInput({
        name: 'Bad Plan',
        description: 'Invalid price test',
        audience: 'Shared',
        currency: 'NGN',
        billingFrequencies: ['Monthly'],
        monthlyPrice: -50,
        annualPrice: 0,
      }),
    /0 or greater/i,
  );

  console.log('[PHASE 7 TEST 2] Department isolation & server-side checkout price enforcement');
  const artistTerms = engine.resolvePlanBillingTerms({
    plan,
    department: 'Artist',
    billingFrequency: 'Annual',
    nowIso: '2026-11-26T10:00:00.000Z',
  });
  assert.equal(artistTerms.amount, 250000);
  assert.equal(artistTerms.currency, 'NGN');
  assert.equal(artistTerms.periodDays, 365);

  assert.throws(
    () =>
      engine.resolvePlanBillingTerms({
        plan,
        department: 'Brand',
        billingFrequency: 'Monthly',
      }),
    /not available for Brand accounts/i,
  );

  assert.throws(
    () =>
      engine.resolvePlanBillingTerms({
        plan: { ...plan, status: 'Draft' },
        department: 'Artist',
        billingFrequency: 'Monthly',
      }),
    /not published/i,
  );

  const oneTimeProd = engine.resolveProductOneTimePrice({
    status: 'Published',
    isPurchasable: true,
    purchasePrice: 15000,
    purchaseCurrency: 'NGN',
  });
  assert.equal(oneTimeProd.amount, 15000);
  assert.equal(oneTimeProd.currency, 'NGN');

  assert.throws(
    () =>
      engine.resolveProductOneTimePrice({
        status: 'Draft',
        isPurchasable: true,
        purchasePrice: 15000,
        purchaseCurrency: 'NGN',
      }),
    /Only published/i,
  );

  console.log('[PHASE 7 TEST 3] Paystack HMAC-SHA512 & Flutterwave verif-hash webhook verification');
  const rawBody = JSON.stringify({ event: 'charge.success', data: { reference: 'KH-PAY-TEST123' } });
  const paystackSecret = 'sk_test_keedohub_secret_123';
  const validPaystackSig = crypto.createHmac('sha512', paystackSecret).update(rawBody).digest('hex');
  assert.equal(engine.verifyPaystackWebhookSignature(rawBody, validPaystackSig, paystackSecret), true);
  assert.equal(engine.verifyPaystackWebhookSignature(rawBody, 'tampered_sig', paystackSecret), false);
  assert.equal(engine.verifyPaystackWebhookSignature(rawBody, validPaystackSig, ''), false);

  assert.equal(engine.verifyFlutterwaveWebhookSignature('flw_hash_secret_99', 'flw_hash_secret_99'), true);
  assert.equal(engine.verifyFlutterwaveWebhookSignature('wrong_hash', 'flw_hash_secret_99'), false);
  assert.equal(engine.verifyFlutterwaveWebhookSignature('', 'flw_hash_secret_99'), false);

  console.log('[PHASE 7 TEST 4] Provider settlement validation (tampered amount/currency rejected)');
  assert.equal(
    engine.validateVerifiedProviderPayment({
      provider: 'paystack',
      providerStatus: 'success',
      paidAmountMajor: 25000,
      paidCurrency: 'NGN',
      expectedAmountMajor: 25000,
      expectedCurrency: 'NGN',
    }).ok,
    true,
  );
  assert.equal(
    engine.validateVerifiedProviderPayment({
      provider: 'paystack',
      providerStatus: 'success',
      paidAmountMajor: 500,
      paidCurrency: 'NGN',
      expectedAmountMajor: 25000,
      expectedCurrency: 'NGN',
    }).ok,
    false,
  );
  assert.equal(
    engine.validateVerifiedProviderPayment({
      provider: 'flutterwave',
      providerStatus: 'successful',
      paidAmountMajor: 25000,
      paidCurrency: 'USD',
      expectedAmountMajor: 25000,
      expectedCurrency: 'NGN',
    }).ok,
    false,
  );

  console.log('[PHASE 7 TEST 5] Automated invoice + receipt creation & strict idempotency');
  const nowIso = '2026-11-26T12:00:00.000Z';
  const autoInv = engine.buildAutomatedInvoiceData({
    invoiceId: 'inv_tx_1',
    referenceNo: 'KH-PAYTX1',
    workspaceId: 'ws_1',
    clientUid: 'client_1',
    recipientName: 'Seyi Vibes Studio',
    title: 'Artist Pro Membership (Monthly Subscription)',
    description: 'Artist Pro Membership (Monthly Subscription)',
    currency: 'NGN',
    amount: 25000,
    nowIso,
    paymentRecord: {
      id: 'tx_1',
      receiptNumber: 'RCP-PAYTX1',
      amount: 25000,
      reference: 'KH-PAY-TX1',
      method: 'Paystack',
      notes: 'Verified via Paystack webhook',
    },
  });
  assert.equal(autoInv.status, 'Paid');
  assert.equal(autoInv.balanceDue, 0);
  assert.equal(autoInv.items.length, 1);
  assert.equal(autoInv.payments[0].receiptNumber, 'RCP-PAYTX1');

  const firstAppend = engine.appendPaymentToExistingInvoiceIdempotent({
    existingInvoice: { totalAmount: 25000, payments: [] },
    paymentId: 'tx_1',
    receiptNumber: 'RCP-PAYTX1',
    amount: 25000,
    reference: 'KH-PAY-TX1',
    method: 'Paystack',
    nowIso,
  });
  assert.equal(firstAppend.alreadyRecorded, false);
  assert.equal(firstAppend.updates.status, 'Paid');

  const dupAppend = engine.appendPaymentToExistingInvoiceIdempotent({
    existingInvoice: { totalAmount: 25000, payments: firstAppend.updates.payments },
    paymentId: 'tx_1',
    receiptNumber: 'RCP-PAYTX1',
    amount: 25000,
    reference: 'KH-PAY-TX1',
    method: 'Paystack',
    nowIso,
  });
  assert.equal(dupAppend.alreadyRecorded, true);

  console.log('[PHASE 7 TEST 6] Subscription lifecycle automation & entitlement synchronization');
  const periodEndEnteredGrace = engine.evaluateSubscriptionLifecycle({
    subscription: {
      status: 'Active',
      planName: 'Artist Pro Membership',
      currentPeriodEnd: '2026-11-25T00:00:00.000Z',
      cancelAtPeriodEnd: false,
      renewalBehavior: 'Auto-Renew',
      retryCount: 0,
      maxRetries: 3,
    },
    gracePeriodDays: 5,
    nowIso: '2026-11-26T00:00:00.000Z',
  });
  assert.equal(periodEndEnteredGrace.changed, true);
  assert.equal(periodEndEnteredGrace.nextStatus, 'Grace Period');

  const graceExpiredToSuspended = engine.evaluateSubscriptionLifecycle({
    subscription: {
      status: 'Grace Period',
      planName: 'Artist Pro Membership',
      currentPeriodEnd: '2026-11-20T00:00:00.000Z',
      graceEndsAt: '2026-11-25T00:00:00.000Z',
      cancelAtPeriodEnd: false,
      renewalBehavior: 'Auto-Renew',
      retryCount: 1,
      maxRetries: 3,
    },
    gracePeriodDays: 5,
    nowIso: '2026-11-26T00:00:00.000Z',
  });
  assert.equal(graceExpiredToSuspended.changed, true);
  assert.equal(graceExpiredToSuspended.nextStatus, 'Suspended');

  const cancelAtPeriodEndResult = engine.evaluateSubscriptionLifecycle({
    subscription: {
      status: 'Active',
      planName: 'Artist Pro Membership',
      currentPeriodEnd: '2026-11-25T00:00:00.000Z',
      cancelAtPeriodEnd: true,
      renewalBehavior: 'Auto-Renew',
      retryCount: 0,
      maxRetries: 3,
    },
    gracePeriodDays: 5,
    nowIso: '2026-11-26T00:00:00.000Z',
  });
  assert.equal(cancelAtPeriodEndResult.changed, true);
  assert.equal(cancelAtPeriodEndResult.nextStatus, 'Cancelled');

  console.log('[PHASE 7 TEST 7] Entitlement sync & permanent one-time purchase preservation');
  const activePatch = engine.computeWorkspaceEntitlementSyncPatch({
    existingWorkspace: { contractedPackageIds: ['pkg_contract'] },
    subscription: {
      id: 'sub_1',
      planId: 'plan_1',
      status: 'Active',
      currentPeriodEnd: '2026-12-26T00:00:00.000Z',
      includedProductIds: ['prod_sub_only'],
      includedCategories: ['Streaming Platform Packs'],
      includedPackageIds: ['pkg_sub_bonus'],
    },
    activePurchasedProductIds: ['prod_bought_forever'],
    activePurchasedPackageIds: [],
    nowIso: '2026-11-26T00:00:00.000Z',
  });
  assert.deepEqual(activePatch.subscriptionEntitledProductIds, ['prod_sub_only']);
  assert.deepEqual(activePatch.purchasedProductIds, ['prod_bought_forever']);
  assert.ok((activePatch.activePackageIds as string[]).includes('pkg_sub_bonus'));

  // After subscription expires/suspends, subscription entitlements revoke cleanly while one-time purchases stay!
  const suspendedPatch = engine.computeWorkspaceEntitlementSyncPatch({
    existingWorkspace: { contractedPackageIds: ['pkg_contract'] },
    subscription: {
      id: 'sub_1',
      planId: 'plan_1',
      status: 'Suspended',
      currentPeriodEnd: '2026-11-25T00:00:00.000Z',
      includedProductIds: ['prod_sub_only'],
      includedCategories: ['Streaming Platform Packs'],
      includedPackageIds: ['pkg_sub_bonus'],
    },
    activePurchasedProductIds: ['prod_bought_forever'],
    activePurchasedPackageIds: [],
    nowIso: '2026-11-26T00:00:00.000Z',
  });
  assert.deepEqual(suspendedPatch.subscriptionEntitledProductIds, []);
  assert.deepEqual(suspendedPatch.subscriptionEntitledCategories, []);
  assert.deepEqual(suspendedPatch.purchasedProductIds, ['prod_bought_forever']);
  assert.ok(!(suspendedPatch.activePackageIds as string[]).includes('pkg_sub_bonus'));

  const restrictedSubProduct = {
    id: 'prod_sub_only',
    title: 'Spotify Release Pack',
    category: 'Streaming Platform Packs',
    status: 'Published' as const,
    audience: 'Artist' as const,
    accessType: 'IncludedInPackage' as const,
    assignedWorkspaceIds: [],
    includedPackageIds: ['pkg_pro_pack'],
    files: [],
    instantStudioPackEligible: true,
  };
  const boughtProduct = {
    id: 'prod_bought_forever',
    title: 'Deluxe Tour Poster Kit',
    category: 'Artist Branding & Press',
    status: 'Published' as const,
    audience: 'Artist' as const,
    accessType: 'RequestRequired' as const,
    isPurchasable: true,
    purchasePrice: 15000,
    purchaseCurrency: 'NGN' as const,
    assignedWorkspaceIds: [],
    includedPackageIds: [],
    files: [],
    instantStudioPackEligible: true,
  };

  // Active subscription grants access to prod_sub_only; suspended revokes prod_sub_only but keeps prod_bought_forever
  assert.equal(
    access.isClientEligibleForProductDownload({
      product: restrictedSubProduct,
      clientBucket: 'Artist',
      workspaceId: 'ws_1',
      workspaceStatus: 'Active',
      purchasedProductIds: ['prod_bought_forever'],
      activeSubscription: {
        status: 'Active',
        expiresAt: '2026-12-26T00:00:00.000Z',
        entitledProductIds: ['prod_sub_only'],
        entitledCategories: [],
      },
      nowIso: '2026-11-26T00:00:00.000Z',
    }),
    true,
  );
  assert.equal(
    access.isClientEligibleForProductDownload({
      product: restrictedSubProduct,
      clientBucket: 'Artist',
      workspaceId: 'ws_1',
      workspaceStatus: 'Active',
      purchasedProductIds: ['prod_bought_forever'],
      activeSubscription: {
        status: 'Suspended',
        expiresAt: '2026-11-25T00:00:00.000Z',
        entitledProductIds: [],
        entitledCategories: [],
      },
      nowIso: '2026-11-26T00:00:00.000Z',
    }),
    false,
  );
  assert.equal(
    access.isClientEligibleForProductDownload({
      product: boughtProduct,
      clientBucket: 'Artist',
      workspaceId: 'ws_1',
      workspaceStatus: 'Active',
      purchasedProductIds: ['prod_bought_forever'],
      activeSubscription: { status: 'Suspended' },
    }),
    true,
  );

  console.log('[PHASE 7 TEST 8] Analytics separation of MRR/ARR vs collected cash & refunds');
  const analytics = subsLib.computeSubscriptionAnalytics({
    subscriptions: [
      {
        id: 'sub_a',
        workspaceId: 'ws_a',
        clientUid: 'u_a',
        planId: 'p_artist',
        planName: 'Artist Pro',
        planAudience: 'Artist',
        department: 'Artist',
        status: 'Active',
        provider: 'paystack',
        billingFrequency: 'Annual',
        currency: 'NGN',
        recurringAmount: 240000,
        renewalBehavior: 'Auto-Renew',
        currentPeriodStart: '2026-01-01T00:00:00.000Z',
        currentPeriodEnd: '2027-01-01T00:00:00.000Z',
        cancelAtPeriodEnd: false,
        retryCount: 0,
        maxRetries: 3,
        downloadsUsedThisPeriod: 4,
        downloadLimitPerPeriod: -1,
        includedProductIds: [],
        includedCategories: [],
        includedPackageIds: [],
        history: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'sub_b',
        workspaceId: 'ws_b',
        clientUid: 'u_b',
        planId: 'p_brand',
        planName: 'Brand Growth',
        planAudience: 'Brand',
        department: 'Brand',
        status: 'Cancelled',
        provider: 'flutterwave',
        billingFrequency: 'Monthly',
        currency: 'USD',
        recurringAmount: 99,
        renewalBehavior: 'Auto-Renew',
        currentPeriodStart: '2026-01-01T00:00:00.000Z',
        currentPeriodEnd: '2026-02-01T00:00:00.000Z',
        cancelAtPeriodEnd: false,
        retryCount: 0,
        maxRetries: 3,
        downloadsUsedThisPeriod: 1,
        downloadLimitPerPeriod: -1,
        includedProductIds: [],
        includedCategories: [],
        includedPackageIds: [],
        history: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
      },
    ],
    transactions: [
      {
        id: 'tx_a',
        reference: 'KH-PAY-1',
        provider: 'paystack',
        intentType: 'subscription',
        workspaceId: 'ws_a',
        clientUid: 'u_a',
        department: 'Artist',
        description: 'Artist Pro Annual',
        currency: 'NGN',
        expectedAmount: 240000,
        amount: 240000,
        refundedAmount: 0,
        status: 'Succeeded',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'tx_b',
        reference: 'KH-FLW-2',
        provider: 'flutterwave',
        intentType: 'one_time_product',
        workspaceId: 'ws_b',
        clientUid: 'u_b',
        department: 'Brand',
        description: 'Brand Guide Pack',
        currency: 'USD',
        expectedAmount: 150,
        amount: 150,
        refundedAmount: 50,
        status: 'Partially Refunded',
        createdAt: '2026-01-02T00:00:00.000Z',
        updatedAt: '2026-01-03T00:00:00.000Z',
      },
    ],
  });
  const ngnBucket = analytics.byCurrency.find(b => b.currency === 'NGN');
  assert.ok(ngnBucket);
  assert.equal(ngnBucket.mrr, 20000);
  assert.equal(ngnBucket.arr, 240000);
  assert.equal(ngnBucket.cashCollected, 240000);
  const usdBucket = analytics.byCurrency.find(b => b.currency === 'USD');
  assert.ok(usdBucket);
  assert.equal(usdBucket.mrr, 0, 'Cancelled subscription must NOT contribute to MRR');
  assert.equal(usdBucket.cashCollected, 100);
  assert.equal(usdBucket.refundedTotal, 50);

  console.log('[PHASE 7 TEST 9] Security rules & architectural boundary verification');
  const root = process.cwd();
  const rulesSrc = fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8');
  for (const col of ['subscriptionPlans', 'subscriptions', 'subscriptionEvents', 'paymentTransactions', 'oneTimePurchases', 'paymentWebhookEvents']) {
    assert.ok(rulesSrc.includes(`match /${col}/`), `Missing Firestore rule for ${col}`);
  }
  assert.ok(rulesSrc.includes('clientHasPurchasedProduct'), 'Missing purchase access rule');
  assert.ok(rulesSrc.includes('clientHasSubscriptionAccessToProduct'), 'Missing subscription access rule');

  assert.ok(navLib.ADMIN_HQ_SECTIONS.find(s => s.id === 'finance')?.subTabs?.includes('subscriptions'));
  assert.ok(navLib.ADMIN_HQ_SECTIONS.find(s => s.id === 'finance')?.subTabs?.includes('plans'));
  assert.ok(navLib.ADMIN_HQ_SECTIONS.find(s => s.id === 'finance')?.subTabs?.includes('payments'));

  const hubSrc = fs.readFileSync(path.join(root, 'src/components/client/ClientCreativeHub.tsx'), 'utf8');
  const wsSrc = fs.readFileSync(path.join(root, 'src/components/client/ClientWorkspace.tsx'), 'utf8');
  const finSrc = fs.readFileSync(path.join(root, 'src/components/admin/AdminFinanceConsole.tsx'), 'utf8');
  assert.ok(!hubSrc.includes('DesignCanvasEditor'), 'ClientCreativeHub must never import DesignCanvasEditor');
  assert.ok(!wsSrc.includes('DesignCanvasEditor'), 'ClientWorkspace must never import DesignCanvasEditor');
  assert.ok(!finSrc.includes('localStorage'), 'AdminFinanceConsole must remain Firestore-backed');
  assert.ok(hubSrc.includes('CheckoutModal'), 'ClientCreativeHub must integrate CheckoutModal');
  assert.ok(wsSrc.includes('ClientBillingCenter'), 'ClientWorkspace must integrate ClientBillingCenter');

  console.log('ALL PHASE 7 SUBSCRIPTION & PAYMENT AUTOMATION TESTS PASSED.');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

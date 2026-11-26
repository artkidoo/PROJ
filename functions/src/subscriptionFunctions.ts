import * as functions from 'firebase-functions';
import type * as admin from 'firebase-admin';
import {
  AllowedCurrency,
  FinanceValidationError,
  roundCurrency,
  validateCurrency,
} from './financeValidation';
import {
  addDaysIso,
  appendPaymentToExistingInvoiceIdempotent,
  BillingFrequency,
  buildAutomatedInvoiceData,
  callFlutterwaveInitialize,
  callFlutterwaveRefund,
  callFlutterwaveVerify,
  callPaystackInitialize,
  callPaystackRefund,
  callPaystackVerify,
  computeWorkspaceEntitlementSyncPatch,
  DEFAULT_PAYMENT_SETTINGS,
  ENTITLED_SUBSCRIPTION_STATUSES,
  evaluateSubscriptionLifecycle,
  PaymentProviderId,
  PaymentSettingsData,
  resolvePlanBillingTerms,
  resolveProductOneTimePrice,
  resolveServicePackageOneTimePrice,
  sanitizePaymentSettingsInput,
  sanitizeSubscriptionPlanInput,
  SubscriptionStatus,
  validateVerifiedProviderPayment,
  verifyFlutterwaveWebhookSignature,
  verifyPaystackWebhookSignature,
} from './subscriptionEngine';

export interface SubscriptionFunctionDeps {
  db: admin.firestore.Firestore;
  assertActiveAdmin: (uid: string, deniedMessage?: string) => Promise<void>;
  notifyUser: (
    uid: string,
    eventKey: string,
    title: string,
    message: string,
    type: string,
    projectId?: string,
    entityId?: string,
    dueDate?: string,
  ) => Promise<void>;
  notifyAdmins: (
    eventKey: string,
    title: string,
    message: string,
    type: string,
    projectId?: string,
    entityId?: string,
  ) => Promise<void>;
  isSuspendedProfileStatus: (status: unknown) => boolean;
  requireSafeDocId: (value: unknown, label: string) => string;
  matchesClientAudienceServer: (accountType: unknown, productAudience: unknown) => boolean;
}

function getProviderRuntimeSecrets() {
  const paystackSecretKey = (process.env.PAYSTACK_SECRET_KEY || '').trim();
  const paystackWebhookSecret = (process.env.PAYSTACK_WEBHOOK_SECRET || paystackSecretKey).trim();
  const flutterwaveSecretKey = (process.env.FLUTTERWAVE_SECRET_KEY || '').trim();
  const flutterwaveSecretHash = (process.env.FLUTTERWAVE_SECRET_HASH || '').trim();
  return {
    paystackSecretKey,
    paystackWebhookSecret,
    flutterwaveSecretKey,
    flutterwaveSecretHash,
  };
}

function resolveAccountDepartment(accountType: unknown, workspaceType: unknown): 'Artist' | 'Brand' {
  const raw = String(accountType || workspaceType || 'Brand').trim().toLowerCase();
  return raw === 'artist' ? 'Artist' : 'Brand';
}

function mapErrorToHttpsError(err: unknown): functions.https.HttpsError {
  if (err instanceof functions.https.HttpsError) return err;
  if (err instanceof FinanceValidationError) {
    return new functions.https.HttpsError(err.code, err.message);
  }
  const msg = err instanceof Error ? err.message : String(err || 'Operation failed.');
  return new functions.https.HttpsError('internal', msg);
}

export function createSubscriptionFunctions(deps: SubscriptionFunctionDeps) {
  const {
    db,
    assertActiveAdmin,
    notifyUser,
    notifyAdmins,
    isSuspendedProfileStatus,
    requireSafeDocId,
    matchesClientAudienceServer,
  } = deps;

  async function loadPaymentSettings(): Promise<PaymentSettingsData> {
    const snap = await db.collection('settings').doc('payments').get();
    if (!snap.exists) return DEFAULT_PAYMENT_SETTINGS;
    return {
      ...DEFAULT_PAYMENT_SETTINGS,
      ...(snap.data() as Partial<PaymentSettingsData>),
    };
  }

  async function syncWorkspaceEntitlementsFromDb(workspaceId: string): Promise<void> {
    const nowIso = new Date().toISOString();
    const wsRef = db.collection('workspaces').doc(workspaceId);
    const [wsSnap, subsSnap, purchasesSnap] = await Promise.all([
      wsRef.get(),
      db.collection('subscriptions').where('workspaceId', '==', workspaceId).get(),
      db.collection('oneTimePurchases').where('workspaceId', '==', workspaceId).get(),
    ]);
    if (!wsSnap.exists) return;

    const allSubs = subsSnap.docs
      .map(d => d.data() as Record<string, unknown>)
      .sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));

    const activeSubDoc =
      allSubs.find(s => ENTITLED_SUBSCRIPTION_STATUSES.has(String(s.status || '') as SubscriptionStatus)) ||
      allSubs[0] ||
      null;

    const activePurchases = purchasesSnap.docs
      .map(d => d.data() as Record<string, unknown>)
      .filter(p => {
        if (p.status !== 'Active') return false;
        if (p.expiresAt && Date.parse(String(p.expiresAt)) <= Date.parse(nowIso)) return false;
        return true;
      });

    const activePurchasedProductIds: string[] = [];
    const activePurchasedPackageIds: string[] = [];
    for (const p of activePurchases) {
      if (Array.isArray(p.grantedProductIds)) {
        for (const pid of p.grantedProductIds) {
          if (typeof pid === 'string' && pid.trim()) activePurchasedProductIds.push(pid.trim());
        }
      }
      if (Array.isArray(p.grantedPackageIds)) {
        for (const pkgId of p.grantedPackageIds) {
          if (typeof pkgId === 'string' && pkgId.trim()) activePurchasedPackageIds.push(pkgId.trim());
        }
      }
    }

    const patch = computeWorkspaceEntitlementSyncPatch({
      existingWorkspace: wsSnap.data() || {},
      subscription: activeSubDoc
        ? {
            id: String(activeSubDoc.id || ''),
            planId: String(activeSubDoc.planId || ''),
            status: String(activeSubDoc.status || 'Pending') as SubscriptionStatus,
            currentPeriodEnd: String(activeSubDoc.currentPeriodEnd || ''),
            includedProductIds: Array.isArray(activeSubDoc.includedProductIds)
              ? (activeSubDoc.includedProductIds as string[])
              : [],
            includedCategories: Array.isArray(activeSubDoc.includedCategories)
              ? (activeSubDoc.includedCategories as string[])
              : [],
            includedPackageIds: Array.isArray(activeSubDoc.includedPackageIds)
              ? (activeSubDoc.includedPackageIds as string[])
              : [],
          }
        : null,
      activePurchasedProductIds,
      activePurchasedPackageIds,
      nowIso,
    });

    await wsRef.update(patch);
  }

  async function assertClientWorkspaceAccess(uid: string, workspaceId: string) {
    const [profileSnap, wsSnap, membershipSnap] = await Promise.all([
      db.collection('clientProfiles').doc(uid).get(),
      db.collection('workspaces').doc(workspaceId).get(),
      db.collection('workspaces').doc(workspaceId).collection('memberships').doc(uid).get(),
    ]);

    if (!profileSnap.exists || profileSnap.get('onboardingComplete') !== true || isSuspendedProfileStatus(profileSnap.get('status'))) {
      throw new functions.https.HttpsError('permission-denied', 'Active client profile required.');
    }
    if (!wsSnap.exists || !['Active', 'Onboarding'].includes(String(wsSnap.get('status') || 'Active'))) {
      throw new functions.https.HttpsError('permission-denied', 'Workspace is not active.');
    }
    const isOwner = wsSnap.get('ownerId') === uid;
    const isMember = membershipSnap.exists && membershipSnap.get('status') === 'Active';
    if (!isOwner && !isMember) {
      throw new functions.https.HttpsError('permission-denied', 'You do not have access to this workspace.');
    }
    return { profileSnap, wsSnap };
  }

  async function finalizeSettledTransaction(params: {
    txRef: admin.firestore.DocumentReference;
    providerStatus: string;
    paidAmountMajor: number;
    paidCurrency: string;
    channel?: string;
    providerReference?: string;
    customerCode?: string;
    authorizationCode?: string;
    actorRole: 'Client' | 'Webhook' | 'Admin' | 'System';
    actorUid?: string;
  }) {
    const nowIso = new Date().toISOString();
    const txSnap = await params.txRef.get();
    if (!txSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Payment transaction record not found.');
    }
    const txData = txSnap.data() || {};

    // Strict idempotency guard: if already Succeeded, return existing state cleanly without duplicating invoices/grants
    if (txData.status === 'Succeeded') {
      return {
        alreadySettled: true,
        txData,
      };
    }

    const expectedAmount = Number(txData.expectedAmount || txData.amount || 0);
    const expectedCurrency = validateCurrency(txData.currency || 'NGN');
    const provider = String(txData.provider || 'paystack') as PaymentProviderId;

    const validation = validateVerifiedProviderPayment({
      provider,
      providerStatus: params.providerStatus,
      paidAmountMajor: params.paidAmountMajor,
      paidCurrency: params.paidCurrency,
      expectedAmountMajor: expectedAmount,
      expectedCurrency,
    });

    if (!validation.ok) {
      await params.txRef.update({
        status: 'Failed',
        failureReason: validation.reason || 'Payment verification failed.',
        updatedAt: nowIso,
      });
      throw new functions.https.HttpsError('failed-precondition', validation.reason || 'Payment verification failed.');
    }

    const workspaceId = String(txData.workspaceId || '');
    const clientUid = String(txData.clientUid || '');
    const reference = String(txData.reference || params.txRef.id);
    const receiptNumber =
      typeof txData.receiptNumber === 'string' && txData.receiptNumber
        ? txData.receiptNumber
        : `RCP-${reference.replace(/[^A-Z0-9]/gi, '').slice(-8).toUpperCase()}`;
    const paymentMethodLabel = provider === 'flutterwave' ? 'Flutterwave' : 'Paystack';

    const [wsSnap, profileSnap] = await Promise.all([
      db.collection('workspaces').doc(workspaceId).get(),
      db.collection('clientProfiles').doc(clientUid).get(),
    ]);

    const recipientName = String(profileSnap.get('displayName') || wsSnap.get('name') || 'Client');
    const recipientOrg = String(wsSnap.get('name') || profileSnap.get('organizationName') || '');
    const recipientEmail = String(profileSnap.get('email') || wsSnap.get('contactEmail') || '');

    let invoiceId = String(txData.invoiceId || '');
    let subscriptionId = String(txData.subscriptionId || '');
    let purchaseId = String(txData.purchaseId || '');

    const intentType = String(txData.intentType || '');

    await db.runTransaction(async transaction => {
      const freshTx = await transaction.get(params.txRef);
      if (!freshTx.exists || freshTx.get('status') === 'Succeeded') {
        return;
      }

      // 1. Create or update invoice idempotently
      if (intentType === 'invoice' && invoiceId) {
        const invRef = db.collection('invoices').doc(invoiceId);
        const invSnap = await transaction.get(invRef);
        if (invSnap.exists) {
          const { alreadyRecorded, updates } = appendPaymentToExistingInvoiceIdempotent({
            existingInvoice: invSnap.data() || {},
            paymentId: params.txRef.id,
            receiptNumber,
            amount: params.paidAmountMajor,
            reference,
            method: paymentMethodLabel,
            nowIso,
            notes: `Verified online payment via ${paymentMethodLabel}`,
          });
          if (!alreadyRecorded) {
            transaction.update(invRef, updates);
          }
        }
      } else {
        if (!invoiceId) {
          invoiceId = `inv_${params.txRef.id}`;
        }
        const invRef = db.collection('invoices').doc(invoiceId);
        const existingInvSnap = await transaction.get(invRef);
        if (!existingInvSnap.exists) {
          const invoiceDoc = buildAutomatedInvoiceData({
            invoiceId,
            referenceNo: `KH-${reference.replace(/[^A-Z0-9]/gi, '').slice(-8).toUpperCase()}`,
            workspaceId,
            clientUid,
            recipientName,
            recipientOrg,
            recipientEmail,
            title: String(txData.description || 'KeedoHub Billing Charge'),
            description: String(txData.description || 'Verified online payment'),
            currency: expectedCurrency,
            amount: expectedAmount,
            nowIso,
            paymentRecord: {
              id: params.txRef.id,
              receiptNumber,
              amount: params.paidAmountMajor,
              reference,
              method: paymentMethodLabel,
              notes: `Verified ${paymentMethodLabel} checkout (${params.channel || 'online'})`,
            },
          });
          transaction.create(invRef, invoiceDoc);
        } else {
          const { alreadyRecorded, updates } = appendPaymentToExistingInvoiceIdempotent({
            existingInvoice: existingInvSnap.data() || {},
            paymentId: params.txRef.id,
            receiptNumber,
            amount: params.paidAmountMajor,
            reference,
            method: paymentMethodLabel,
            nowIso,
          });
          if (!alreadyRecorded) {
            transaction.update(invRef, updates);
          }
        }
      }

      // 2. Apply Subscription Activation / Plan Change OR One-Time Purchase Entitlement
      if (intentType === 'subscription' || intentType === 'plan_change') {
        const planId = String(txData.planId || '');
        const planRef = db.collection('subscriptionPlans').doc(planId);
        const planSnap = await transaction.get(planRef);
        if (!planSnap.exists) {
          throw new functions.https.HttpsError('not-found', 'Subscription plan no longer exists.');
        }
        const planData = planSnap.data() || {};
        const billingFrequency = (String(txData.billingFrequency || 'Monthly') === 'Annual' ? 'Annual' : 'Monthly') as BillingFrequency;
        const periodDays = billingFrequency === 'Annual' ? 365 : Number(planData.durationDays || 30);
        const periodEnd = addDaysIso(nowIso, periodDays);

        if (!subscriptionId) {
          subscriptionId = `sub_${workspaceId}_${planId}_${Date.now()}`;
        }
        const subRef = db.collection('subscriptions').doc(subscriptionId);
        const subSnap = await transaction.get(subRef);
        const existingHistory = subSnap.exists && Array.isArray(subSnap.get('history')) ? (subSnap.get('history') as unknown[]) : [];
        const previousStatus = subSnap.exists ? (String(subSnap.get('status') || 'Pending') as SubscriptionStatus) : 'Pending';
        const previousPlanId = subSnap.exists ? String(subSnap.get('planId') || '') : '';

        const actionType =
          intentType === 'plan_change'
            ? 'plan_changed'
            : previousStatus === 'Active' || previousStatus === 'Grace Period' || previousStatus === 'Past Due'
              ? 'renewed'
              : 'activated';

        const subPayload = {
          id: subscriptionId,
          workspaceId,
          clientUid,
          planId,
          planName: String(planData.name || 'Membership Plan'),
          planAudience: String(planData.audience || 'Shared'),
          department: resolveAccountDepartment(profileSnap.get('accountType'), wsSnap.get('type')),
          status: 'Active' as SubscriptionStatus,
          provider,
          billingFrequency,
          currency: expectedCurrency,
          recurringAmount: expectedAmount,
          renewalBehavior: String(planData.renewalBehavior || 'Auto-Renew'),
          ...(params.customerCode ? { providerCustomerCode: params.customerCode } : {}),
          ...(params.authorizationCode ? { providerAuthorizationCode: params.authorizationCode } : {}),
          currentPeriodStart: nowIso,
          currentPeriodEnd: periodEnd,
          nextBillingDate: planData.renewalBehavior === 'Manual Renewal' ? '' : periodEnd,
          graceEndsAt: '',
          cancelAtPeriodEnd: false,
          pendingPlanId: '',
          pendingPlanFrequency: '',
          retryCount: 0,
          maxRetries: 3,
          lastPaymentError: '',
          lastTransactionId: params.txRef.id,
          lastInvoiceId: invoiceId,
          downloadsUsedThisPeriod: subSnap.exists && actionType !== 'renewed' ? Number(subSnap.get('downloadsUsedThisPeriod') || 0) : 0,
          downloadLimitPerPeriod: Number(planData.downloadLimitPerPeriod ?? -1),
          includedProductIds: Array.isArray(planData.includedProductIds) ? planData.includedProductIds : [],
          includedCategories: Array.isArray(planData.includedCategories) ? planData.includedCategories : [],
          includedPackageIds: Array.isArray(planData.includedPackageIds) ? planData.includedPackageIds : [],
          history: [
            ...existingHistory.slice(-49),
            {
              id: `hist_${Date.now()}`,
              action: actionType,
              fromStatus: previousStatus,
              toStatus: 'Active',
              ...(previousPlanId && previousPlanId !== planId ? { fromPlanId: previousPlanId } : {}),
              toPlanId: planId,
              note: `Verified ${paymentMethodLabel} payment (${reference})`,
              ...(params.actorUid ? { actorUid: params.actorUid } : {}),
              actorRole: params.actorRole,
              timestamp: nowIso,
            },
          ],
          createdAt: subSnap.exists ? String(subSnap.get('createdAt') || nowIso) : nowIso,
          updatedAt: nowIso,
        };

        transaction.set(subRef, subPayload, { merge: true });

        const eventRef = db.collection('subscriptionEvents').doc();
        transaction.create(eventRef, {
          id: eventRef.id,
          subscriptionId,
          workspaceId,
          clientUid,
          eventType:
            intentType === 'plan_change'
              ? 'plan_changed'
              : actionType === 'renewed'
                ? 'renewal_succeeded'
                : 'subscription_activated',
          summary: `${String(planData.name)} (${billingFrequency}) ${actionType} via ${paymentMethodLabel}.`,
          metadata: { transactionId: params.txRef.id, reference, amount: expectedAmount, currency: expectedCurrency },
          createdAt: nowIso,
        });
      } else if (intentType === 'one_time_product') {
        const productId = String(txData.productId || '');
        const prodSnap = await transaction.get(db.collection('creativeProducts').doc(productId));
        if (!prodSnap.exists) {
          throw new functions.https.HttpsError('not-found', 'Purchased creative product no longer exists.');
        }
        if (!purchaseId) purchaseId = `pur_${params.txRef.id}`;
        const purRef = db.collection('oneTimePurchases').doc(purchaseId);
        transaction.set(purRef, {
          id: purchaseId,
          workspaceId,
          clientUid,
          itemType: 'creative_product',
          itemId: productId,
          itemTitle: String(prodSnap.get('title') || txData.description || 'Creative Resource'),
          productAudience: String(prodSnap.get('audience') || 'Shared'),
          grantedProductIds: [productId],
          grantedPackageIds: [],
          entitlementType: 'permanent',
          status: 'Active',
          currency: expectedCurrency,
          amount: expectedAmount,
          transactionId: params.txRef.id,
          invoiceId,
          receiptNumber,
          purchasedAt: nowIso,
          updatedAt: nowIso,
        });
      } else if (intentType === 'one_time_package') {
        const packageId = String(txData.packageId || '');
        const pkgSnap = await transaction.get(db.collection('services').doc(packageId));
        if (!pkgSnap.exists) {
          throw new functions.https.HttpsError('not-found', 'Purchased service package no longer exists.');
        }
        if (!purchaseId) purchaseId = `pur_${params.txRef.id}`;
        const purRef = db.collection('oneTimePurchases').doc(purchaseId);
        transaction.set(purRef, {
          id: purchaseId,
          workspaceId,
          clientUid,
          itemType: 'service_package',
          itemId: packageId,
          itemTitle: String(pkgSnap.get('name') || txData.description || 'Service Package'),
          grantedProductIds: [],
          grantedPackageIds: [packageId],
          entitlementType: 'permanent',
          status: 'Active',
          currency: expectedCurrency,
          amount: expectedAmount,
          transactionId: params.txRef.id,
          invoiceId,
          receiptNumber,
          purchasedAt: nowIso,
          updatedAt: nowIso,
        });
      }

      // 3. Mark payment transaction Succeeded
      transaction.update(params.txRef, {
        status: 'Succeeded',
        amount: params.paidAmountMajor,
        receiptNumber,
        invoiceId,
        ...(subscriptionId ? { subscriptionId } : {}),
        ...(purchaseId ? { purchaseId } : {}),
        ...(params.providerReference ? { providerReference: params.providerReference } : {}),
        ...(params.channel ? { channel: params.channel } : {}),
        verifiedAt: nowIso,
        updatedAt: nowIso,
      });
    });

    // 4. Sync workspace entitlement cache outside transaction
    await syncWorkspaceEntitlementsFromDb(workspaceId);

    // 5. Notify client & admins idempotently
    await Promise.all([
      notifyUser(
        clientUid,
        `payment_succeeded_${params.txRef.id}`,
        'Payment Verified & Receipt Issued',
        `${String(txData.description || 'Payment')} (${expectedCurrency} ${expectedAmount.toLocaleString()}) confirmed. Receipt ${receiptNumber}.`,
        intentType === 'subscription' || intentType === 'plan_change' ? 'subscription' : 'invoice',
        undefined,
        invoiceId,
      ),
      notifyAdmins(
        `admin_payment_${params.txRef.id}`,
        `Payment Received · ${expectedCurrency} ${expectedAmount.toLocaleString()}`,
        `${recipientOrg || recipientName} settled ${String(txData.description || reference)} via ${paymentMethodLabel}.`,
        'finance',
        undefined,
        invoiceId,
      ),
    ]);

    const updatedTx = (await params.txRef.get()).data() || txData;
    return {
      alreadySettled: false,
      txData: updatedTx,
    };
  }

  // =======================================================================
  // 1. Safe Gateway Runtime Config (Public/Client Safe — Never Exposes Secrets)
  // =======================================================================
  const getPaymentSystemConfig = functions.https.onCall(async (_data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
    }
    const settings = await loadPaymentSettings();
    const secrets = getProviderRuntimeSecrets();
    return {
      settings,
      providers: {
        paystack: {
          enabled: settings.enabledProviders.includes('paystack'),
          secretConfigured: Boolean(secrets.paystackSecretKey),
          webhookConfigured: Boolean(secrets.paystackWebhookSecret),
          ready: settings.enabledProviders.includes('paystack') && Boolean(secrets.paystackSecretKey),
        },
        flutterwave: {
          enabled: settings.enabledProviders.includes('flutterwave'),
          secretConfigured: Boolean(secrets.flutterwaveSecretKey),
          webhookConfigured: Boolean(secrets.flutterwaveSecretHash),
          ready: settings.enabledProviders.includes('flutterwave') && Boolean(secrets.flutterwaveSecretKey),
        },
      },
    };
  });

  // =======================================================================
  // 2. Admin Subscription Plan CRUD & Payment Settings
  // =======================================================================
  const adminSaveSubscriptionPlan = functions.https.onCall(async (data, context) => {
    try {
      if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
      await assertActiveAdmin(context.auth.uid);
      if (!data || typeof data !== 'object') {
        throw new functions.https.HttpsError('invalid-argument', 'Plan payload is required.');
      }
      const sanitized = sanitizeSubscriptionPlanInput(data as Record<string, unknown>);
      const nowIso = new Date().toISOString();
      const planId = sanitized.id
        ? requireSafeDocId(sanitized.id, 'Plan ID')
        : db.collection('subscriptionPlans').doc().id;
      const planRef = db.collection('subscriptionPlans').doc(planId);
      const existingSnap = await planRef.get();

      const record = {
        ...sanitized,
        id: planId,
        createdAt: existingSnap.exists ? String(existingSnap.get('createdAt') || nowIso) : nowIso,
        createdByUid: existingSnap.exists ? String(existingSnap.get('createdByUid') || context.auth.uid) : context.auth.uid,
        updatedAt: nowIso,
        updatedByUid: context.auth.uid,
      };

      await planRef.set(record, { merge: true });
      await db.collection('adminAuditLogs').add({
        actorUid: context.auth.uid,
        actorName: context.auth.token.name || context.auth.uid,
        action: existingSnap.exists ? 'update_subscription_plan' : 'create_subscription_plan',
        target: `subscriptionPlans/${planId}`,
        details: JSON.stringify({ name: record.name, currency: record.currency, status: record.status, audience: record.audience }),
        createdAt: nowIso,
      });

      return {
        success: true,
        planId,
        message: existingSnap.exists ? 'Subscription plan updated.' : 'Subscription plan created.',
      };
    } catch (err) {
      throw mapErrorToHttpsError(err);
    }
  });

  const adminSetSubscriptionPlanStatus = functions.https.onCall(async (data, context) => {
    try {
      if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
      await assertActiveAdmin(context.auth.uid);
      const payload = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
      const planId = requireSafeDocId(payload.planId, 'Plan ID');
      const status = String(payload.status || '').trim();
      if (!['Draft', 'Published', 'Inactive', 'Archived'].includes(status)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid plan status.');
      }
      const planRef = db.collection('subscriptionPlans').doc(planId);
      const snap = await planRef.get();
      if (!snap.exists) {
        throw new functions.https.HttpsError('not-found', 'Subscription plan not found.');
      }
      const nowIso = new Date().toISOString();
      await planRef.update({ status, updatedAt: nowIso, updatedByUid: context.auth.uid });
      await db.collection('adminAuditLogs').add({
        actorUid: context.auth.uid,
        actorName: context.auth.token.name || context.auth.uid,
        action: 'set_subscription_plan_status',
        target: `subscriptionPlans/${planId}`,
        details: JSON.stringify({ status }),
        createdAt: nowIso,
      });
      return { success: true, message: `Plan status updated to ${status}.` };
    } catch (err) {
      throw mapErrorToHttpsError(err);
    }
  });

  const adminUpdatePaymentSettings = functions.https.onCall(async (data, context) => {
    try {
      if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
      await assertActiveAdmin(context.auth.uid);
      if (!data || typeof data !== 'object') {
        throw new functions.https.HttpsError('invalid-argument', 'Payment settings payload is required.');
      }
      const existing = await loadPaymentSettings();
      const sanitized = sanitizePaymentSettingsInput(data as Record<string, unknown>, existing);
      const nowIso = new Date().toISOString();
      await db.collection('settings').doc('payments').set(
        {
          ...sanitized,
          updatedAt: nowIso,
          updatedByUid: context.auth.uid,
        },
        { merge: true },
      );
      await db.collection('adminAuditLogs').add({
        actorUid: context.auth.uid,
        actorName: context.auth.token.name || context.auth.uid,
        action: 'update_payment_settings',
        target: 'settings/payments',
        details: JSON.stringify({ activeProvider: sanitized.activeProvider, defaultCurrency: sanitized.defaultCurrency }),
        createdAt: nowIso,
      });
      return { success: true, message: 'Payment gateway & billing automation settings saved.' };
    } catch (err) {
      throw mapErrorToHttpsError(err);
    }
  });

  // =======================================================================
  // 3. Initialize Server-Authoritative Checkout Session
  // =======================================================================
  const initializeCheckoutPayment = functions.https.onCall(async (data, context) => {
    try {
      if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
      const uid = context.auth.uid;
      const payload = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
      const workspaceId = requireSafeDocId(payload.workspaceId, 'Workspace ID');
      const intentType = String(payload.intentType || '').trim();
      if (!['subscription', 'plan_change', 'one_time_product', 'one_time_package', 'invoice'].includes(intentType)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid checkout intent type.');
      }

      const { profileSnap, wsSnap } = await assertClientWorkspaceAccess(uid, workspaceId);
      const department = resolveAccountDepartment(profileSnap.get('accountType'), wsSnap.get('type'));
      const settings = await loadPaymentSettings();
      const secrets = getProviderRuntimeSecrets();

      const requestedProvider = String(payload.provider || settings.activeProvider).trim().toLowerCase() as PaymentProviderId;
      if (requestedProvider !== 'paystack' && requestedProvider !== 'flutterwave') {
        throw new functions.https.HttpsError('invalid-argument', 'Unsupported payment provider.');
      }
      if (!settings.enabledProviders.includes(requestedProvider)) {
        throw new functions.https.HttpsError('failed-precondition', `${requestedProvider} is not enabled by platform settings.`);
      }

      const email = String(profileSnap.get('email') || context.auth.token.email || wsSnap.get('contactEmail') || '').trim();
      if (!email) {
        throw new functions.https.HttpsError('failed-precondition', 'A valid billing email address is required on your profile.');
      }
      const customerName = String(profileSnap.get('displayName') || wsSnap.get('name') || 'KeedoHub Client');

      let amountMajor = 0;
      let currency: AllowedCurrency = 'NGN';
      let description = '';
      let planId = '';
      let billingFrequency: BillingFrequency = 'Monthly';
      let productId = '';
      let packageId = '';
      let invoiceId = '';
      let subscriptionId = '';

      if (intentType === 'subscription' || intentType === 'plan_change') {
        if (!settings.enableSubscriptions) {
          throw new functions.https.HttpsError('failed-precondition', 'Subscriptions are currently paused.');
        }
        planId = requireSafeDocId(payload.planId, 'Plan ID');
        billingFrequency = String(payload.billingFrequency || 'Monthly') === 'Annual' ? 'Annual' : 'Monthly';
        const planSnap = await db.collection('subscriptionPlans').doc(planId).get();
        if (!planSnap.exists) {
          throw new functions.https.HttpsError('not-found', 'Selected subscription plan not found.');
        }
        const planData = planSnap.data() || {};
        const terms = resolvePlanBillingTerms({
          plan: {
            status: String(planData.status || ''),
            audience: String(planData.audience || ''),
            currency: String(planData.currency || 'NGN'),
            billingFrequencies: Array.isArray(planData.billingFrequencies) ? planData.billingFrequencies : ['Monthly'],
            monthlyPrice: Number(planData.monthlyPrice || 0),
            annualPrice: Number(planData.annualPrice || 0),
            effectiveFrom: typeof planData.effectiveFrom === 'string' ? planData.effectiveFrom : undefined,
            effectiveUntil: typeof planData.effectiveUntil === 'string' ? planData.effectiveUntil : undefined,
          },
          department,
          billingFrequency,
        });
        amountMajor = terms.amount;
        currency = terms.currency;
        description = `${String(planData.name || 'Membership')} (${billingFrequency} Subscription)`;
        if (intentType === 'plan_change' && typeof payload.subscriptionId === 'string' && payload.subscriptionId.trim()) {
          subscriptionId = requireSafeDocId(payload.subscriptionId, 'Subscription ID');
        }
      } else if (intentType === 'one_time_product') {
        if (!settings.enableOneTimePurchases) {
          throw new functions.https.HttpsError('failed-precondition', 'One-time purchases are currently disabled.');
        }
        productId = requireSafeDocId(payload.productId, 'Product ID');
        const prodSnap = await db.collection('creativeProducts').doc(productId).get();
        if (!prodSnap.exists) {
          throw new functions.https.HttpsError('not-found', 'Creative resource not found.');
        }
        const prodData = prodSnap.data() || {};
        if (!matchesClientAudienceServer(profileSnap.get('accountType') || wsSnap.get('type'), prodData.audience)) {
          throw new functions.https.HttpsError('permission-denied', 'This resource is not available for your account type.');
        }
        const priceInfo = resolveProductOneTimePrice({
          status: typeof prodData.status === 'string' ? prodData.status : undefined,
          isPurchasable: prodData.isPurchasable === true,
          purchasePrice: typeof prodData.purchasePrice === 'number' ? prodData.purchasePrice : undefined,
          purchaseCurrency: typeof prodData.purchaseCurrency === 'string' ? prodData.purchaseCurrency : undefined,
          priceUsd: typeof prodData.priceUsd === 'number' ? prodData.priceUsd : undefined,
        });
        amountMajor = priceInfo.amount;
        currency = priceInfo.currency;
        description = `Creative Resource Purchase: ${String(prodData.title || productId)}`;
      } else if (intentType === 'one_time_package') {
        if (!settings.enableOneTimePurchases) {
          throw new functions.https.HttpsError('failed-precondition', 'One-time purchases are currently disabled.');
        }
        packageId = requireSafeDocId(payload.packageId, 'Package ID');
        const pkgSnap = await db.collection('services').doc(packageId).get();
        if (!pkgSnap.exists) {
          throw new functions.https.HttpsError('not-found', 'Service package not found.');
        }
        const pkgData = pkgSnap.data() || {};
        const priceInfo = resolveServicePackageOneTimePrice({
          isActive: pkgData.isActive === true,
          priceUsd: typeof pkgData.priceUsd === 'number' ? pkgData.priceUsd : undefined,
          currency: typeof pkgData.currency === 'string' ? pkgData.currency : undefined,
          isPurchasableOneTime: typeof pkgData.isPurchasableOneTime === 'boolean' ? pkgData.isPurchasableOneTime : undefined,
          billingType: typeof pkgData.billingType === 'string' ? pkgData.billingType : undefined,
        });
        amountMajor = priceInfo.amount;
        currency = priceInfo.currency;
        description = `Studio Package: ${String(pkgData.name || packageId)}`;
      } else if (intentType === 'invoice') {
        invoiceId = requireSafeDocId(payload.invoiceId, 'Invoice ID');
        const invSnap = await db.collection('invoices').doc(invoiceId).get();
        if (!invSnap.exists || invSnap.get('workspaceId') !== workspaceId) {
          throw new functions.https.HttpsError('not-found', 'Invoice not found in this workspace.');
        }
        const invStatus = String(invSnap.get('status') || '');
        if (invStatus === 'Void' || invStatus === 'Draft' || invStatus === 'Paid') {
          throw new functions.https.HttpsError('failed-precondition', `Invoice with status "${invStatus}" cannot be paid online.`);
        }
        const balanceDue = roundCurrency(Number(invSnap.get('balanceDue') ?? invSnap.get('totalAmount') ?? 0));
        if (balanceDue <= 0) {
          throw new functions.https.HttpsError('failed-precondition', 'Invoice has zero remaining balance.');
        }
        amountMajor = balanceDue;
        currency = validateCurrency(invSnap.get('currency') || 'USD');
        description = `Invoice Settlement: ${String(invSnap.get('referenceNo') || invoiceId)} · ${String(invSnap.get('title') || '')}`.slice(0, 160);
      }

      const nowIso = new Date().toISOString();
      const txRef = db.collection('paymentTransactions').doc();
      const reference = `KH-${requestedProvider.slice(0, 3).toUpperCase()}-${txRef.id.slice(0, 12).toUpperCase()}`;

      let callbackUrl = typeof payload.callbackUrl === 'string' && payload.callbackUrl.trim() ? payload.callbackUrl.trim() : '';
      if (callbackUrl) {
        try {
          const parsed = new URL(callbackUrl);
          parsed.searchParams.set('checkout_ref', reference);
          parsed.searchParams.set('provider', requestedProvider);
          callbackUrl = parsed.toString();
        } catch {
          callbackUrl = '';
        }
      }

      const providerConfigured =
        requestedProvider === 'paystack'
          ? Boolean(secrets.paystackSecretKey)
          : Boolean(secrets.flutterwaveSecretKey);

      let authorizationUrl = '';
      if (providerConfigured) {
        if (requestedProvider === 'paystack') {
          const initRes = await callPaystackInitialize({
            secretKey: secrets.paystackSecretKey,
            email,
            amountMajor,
            currency,
            reference,
            callbackUrl: callbackUrl || undefined,
            metadata: {
              transactionId: txRef.id,
              workspaceId,
              clientUid: uid,
              intentType,
              planId,
              productId,
              packageId,
              invoiceId,
            },
          });
          authorizationUrl = initRes.authorizationUrl;
        } else {
          const initRes = await callFlutterwaveInitialize({
            secretKey: secrets.flutterwaveSecretKey,
            email,
            customerName,
            amountMajor,
            currency,
            reference,
            redirectUrl: callbackUrl || 'https://keedohub.com/billing/callback',
            title: 'KeedoHub Studio Checkout',
            description,
            meta: {
              transactionId: txRef.id,
              workspaceId,
              clientUid: uid,
              intentType,
            },
          });
          authorizationUrl = initRes.authorizationUrl;
        }
      }

      const txPayload = {
        id: txRef.id,
        reference,
        provider: requestedProvider,
        intentType,
        workspaceId,
        clientUid: uid,
        department,
        ...(planId ? { planId } : {}),
        ...(subscriptionId ? { subscriptionId } : {}),
        ...(intentType === 'subscription' || intentType === 'plan_change' ? { billingFrequency } : {}),
        ...(productId ? { productId } : {}),
        ...(packageId ? { packageId } : {}),
        ...(invoiceId ? { invoiceId } : {}),
        description,
        currency,
        expectedAmount: amountMajor,
        amount: amountMajor,
        refundedAmount: 0,
        status: providerConfigured ? 'Pending' : 'Initialized',
        ...(authorizationUrl ? { authorizationUrl } : {}),
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await txRef.set(txPayload);

      return {
        success: true,
        transactionId: txRef.id,
        reference,
        provider: requestedProvider,
        providerConfigured,
        authorizationUrl: authorizationUrl || undefined,
        amount: amountMajor,
        currency,
        description,
        invoiceId,
        message: providerConfigured
          ? `Checkout initialized with ${requestedProvider}. Complete payment at the secure gateway.`
          : `${requestedProvider.toUpperCase()} server credentials (API secret key) are not configured on Cloud Functions yet. Configure environment secrets to process live transactions.`,
      };
    } catch (err) {
      throw mapErrorToHttpsError(err);
    }
  });

  // =======================================================================
  // 4. Server-Side Payment Verification (Never Trust Redirect Alone)
  // =======================================================================
  const verifyPaymentTransaction = functions.https.onCall(async (data, context) => {
    try {
      if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
      const uid = context.auth.uid;
      const payload = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
      const reference = typeof payload.reference === 'string' ? payload.reference.trim() : '';
      if (!reference) {
        throw new functions.https.HttpsError('invalid-argument', 'Payment reference is required.');
      }

      const txQuery = await db.collection('paymentTransactions').where('reference', '==', reference).limit(1).get();
      if (txQuery.empty) {
        throw new functions.https.HttpsError('not-found', 'No transaction found for that payment reference.');
      }
      const txDoc = txQuery.docs[0];
      const txData = txDoc.data() || {};

      // Only owning client/workspace member or active admin may verify
      if (txData.clientUid !== uid) {
        try {
          await assertClientWorkspaceAccess(uid, String(txData.workspaceId || ''));
        } catch {
          await assertActiveAdmin(uid, 'You are not authorized to verify this payment.');
        }
      }

      if (txData.status === 'Succeeded') {
        return {
          success: true,
          verified: true,
          status: 'Succeeded',
          transactionId: txDoc.id,
          reference,
          receiptNumber: txData.receiptNumber,
          invoiceId: txData.invoiceId,
          subscriptionId: txData.subscriptionId,
          purchaseId: txData.purchaseId,
          message: 'Payment already verified and entitlements granted.',
        };
      }

      const provider = String(txData.provider || 'paystack') as PaymentProviderId;
      const secrets = getProviderRuntimeSecrets();

      if (provider === 'paystack') {
        if (!secrets.paystackSecretKey) {
          throw new functions.https.HttpsError(
            'failed-precondition',
            'Paystack secret key is not configured on the server; payment cannot be verified.',
          );
        }
        const verified = await callPaystackVerify({ secretKey: secrets.paystackSecretKey, reference });
        const result = await finalizeSettledTransaction({
          txRef: txDoc.ref,
          providerStatus: verified.status,
          paidAmountMajor: verified.amountMajor,
          paidCurrency: verified.currency,
          channel: verified.channel,
          providerReference: verified.providerReference,
          customerCode: verified.customerCode,
          authorizationCode: verified.authorizationCode,
          actorRole: 'Client',
          actorUid: uid,
        });
        return {
          success: true,
          verified: true,
          status: 'Succeeded',
          transactionId: txDoc.id,
          reference,
          receiptNumber: result.txData.receiptNumber,
          invoiceId: result.txData.invoiceId,
          subscriptionId: result.txData.subscriptionId,
          purchaseId: result.txData.purchaseId,
          message: 'Paystack payment verified and entitlements activated.',
        };
      } else {
        if (!secrets.flutterwaveSecretKey) {
          throw new functions.https.HttpsError(
            'failed-precondition',
            'Flutterwave secret key is not configured on the server; payment cannot be verified.',
          );
        }
        const flwTxId =
          typeof payload.providerTransactionId === 'string' && payload.providerTransactionId.trim()
            ? payload.providerTransactionId.trim()
            : undefined;
        const verified = await callFlutterwaveVerify({
          secretKey: secrets.flutterwaveSecretKey,
          transactionId: flwTxId,
          txRef: reference,
        });
        const result = await finalizeSettledTransaction({
          txRef: txDoc.ref,
          providerStatus: verified.status,
          paidAmountMajor: verified.amountMajor,
          paidCurrency: verified.currency,
          channel: verified.channel,
          providerReference: verified.providerReference,
          actorRole: 'Client',
          actorUid: uid,
        });
        return {
          success: true,
          verified: true,
          status: 'Succeeded',
          transactionId: txDoc.id,
          reference,
          receiptNumber: result.txData.receiptNumber,
          invoiceId: result.txData.invoiceId,
          subscriptionId: result.txData.subscriptionId,
          purchaseId: result.txData.purchaseId,
          message: 'Flutterwave payment verified and entitlements activated.',
        };
      }
    } catch (err) {
      throw mapErrorToHttpsError(err);
    }
  });

  // =======================================================================
  // 5. Client Cancellation & Plan Change
  // =======================================================================
  const cancelWorkspaceSubscription = functions.https.onCall(async (data, context) => {
    try {
      if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
      const uid = context.auth.uid;
      const payload = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
      const workspaceId = requireSafeDocId(payload.workspaceId, 'Workspace ID');
      const subscriptionId = requireSafeDocId(payload.subscriptionId, 'Subscription ID');
      const mode = String(payload.mode || 'period_end') === 'immediate' ? 'immediate' : 'period_end';
      const reason = typeof payload.reason === 'string' ? payload.reason.trim().slice(0, 500) : '';

      await assertClientWorkspaceAccess(uid, workspaceId);
      const subRef = db.collection('subscriptions').doc(subscriptionId);
      const subSnap = await subRef.get();
      if (!subSnap.exists || subSnap.get('workspaceId') !== workspaceId) {
        throw new functions.https.HttpsError('not-found', 'Subscription not found for this workspace.');
      }

      const settings = await loadPaymentSettings();
      if (mode === 'immediate' && settings.cancellationPolicy === 'period_end_only') {
        throw new functions.https.HttpsError('failed-precondition', 'Platform policy only permits end-of-period cancellations.');
      }
      if (mode === 'period_end' && settings.cancellationPolicy === 'immediate_only') {
        throw new functions.https.HttpsError('failed-precondition', 'Platform policy requires immediate cancellation.');
      }

      const currentStatus = String(subSnap.get('status') || '') as SubscriptionStatus;
      if (currentStatus === 'Cancelled' || currentStatus === 'Expired') {
        throw new functions.https.HttpsError('failed-precondition', `Subscription is already ${currentStatus}.`);
      }

      const nowIso = new Date().toISOString();
      const nextStatus: SubscriptionStatus = mode === 'immediate' ? 'Cancelled' : currentStatus;
      const existingHistory = Array.isArray(subSnap.get('history')) ? (subSnap.get('history') as unknown[]) : [];

      await subRef.update({
        status: nextStatus,
        cancelAtPeriodEnd: mode === 'period_end',
        cancelledAt: nowIso,
        ...(reason ? { cancellationReason: reason } : {}),
        nextBillingDate: mode === 'immediate' ? '' : subSnap.get('nextBillingDate'),
        history: [
          ...existingHistory.slice(-49),
          {
            id: `hist_${Date.now()}`,
            action: 'cancelled',
            fromStatus: currentStatus,
            toStatus: nextStatus,
            note: mode === 'immediate' ? `Cancelled immediately. ${reason}` : `Scheduled period-end cancellation. ${reason}`,
            actorUid: uid,
            actorRole: 'Client',
            timestamp: nowIso,
          },
        ],
        updatedAt: nowIso,
      });

      const eventRef = db.collection('subscriptionEvents').doc();
      await eventRef.create({
        id: eventRef.id,
        subscriptionId,
        workspaceId,
        clientUid: String(subSnap.get('clientUid') || uid),
        eventType: 'subscription_cancelled',
        summary:
          mode === 'immediate'
            ? `Subscription cancelled immediately by client.`
            : `Subscription set to cancel at period end (${String(subSnap.get('currentPeriodEnd') || '').slice(0, 10)}).`,
        createdAt: nowIso,
      });

      await syncWorkspaceEntitlementsFromDb(workspaceId);
      await notifyUser(
        uid,
        `sub_cancel_${subscriptionId}_${Date.now()}`,
        mode === 'immediate' ? 'Subscription Cancelled' : 'Cancellation Scheduled',
        mode === 'immediate'
          ? `Your ${String(subSnap.get('planName'))} membership has been cancelled immediately.`
          : `Your ${String(subSnap.get('planName'))} membership remains active until ${String(subSnap.get('currentPeriodEnd') || '').slice(0, 10)}.`,
        'subscription',
        undefined,
        subscriptionId,
      );

      return {
        success: true,
        status: nextStatus,
        message:
          mode === 'immediate'
            ? 'Subscription cancelled immediately and membership entitlements revoked.'
            : 'Cancellation scheduled for the end of the current billing period.',
      };
    } catch (err) {
      throw mapErrorToHttpsError(err);
    }
  });

  const changeWorkspaceSubscriptionPlan = functions.https.onCall(async (data, context) => {
    try {
      if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
      const uid = context.auth.uid;
      const payload = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
      const workspaceId = requireSafeDocId(payload.workspaceId, 'Workspace ID');
      const subscriptionId = requireSafeDocId(payload.subscriptionId, 'Subscription ID');
      const targetPlanId = requireSafeDocId(payload.targetPlanId, 'Target Plan ID');
      const billingFrequency: BillingFrequency =
        String(payload.billingFrequency || 'Monthly') === 'Annual' ? 'Annual' : 'Monthly';

      const { profileSnap, wsSnap } = await assertClientWorkspaceAccess(uid, workspaceId);
      const department = resolveAccountDepartment(profileSnap.get('accountType'), wsSnap.get('type'));
      const [subSnap, targetPlanSnap] = await Promise.all([
        db.collection('subscriptions').doc(subscriptionId).get(),
        db.collection('subscriptionPlans').doc(targetPlanId).get(),
      ]);
      if (!subSnap.exists || subSnap.get('workspaceId') !== workspaceId) {
        throw new functions.https.HttpsError('not-found', 'Subscription not found.');
      }
      if (!targetPlanSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Target subscription plan not found.');
      }
      const planData = targetPlanSnap.data() || {};
      const terms = resolvePlanBillingTerms({
        plan: {
          status: String(planData.status || ''),
          audience: String(planData.audience || ''),
          currency: String(planData.currency || 'NGN'),
          billingFrequencies: Array.isArray(planData.billingFrequencies) ? planData.billingFrequencies : ['Monthly'],
          monthlyPrice: Number(planData.monthlyPrice || 0),
          annualPrice: Number(planData.annualPrice || 0),
        },
        department,
        billingFrequency,
      });

      const currentAmount = Number(subSnap.get('recurringAmount') || 0);
      const isUpgrade = terms.amount > currentAmount || String(subSnap.get('currency') || '') !== terms.currency;

      if (isUpgrade) {
        // Upgrades require verified payment before granting higher-tier entitlements!
        return {
          success: true,
          requiresPayment: true,
          message: 'Complete checkout to verify payment and activate your upgraded plan immediately.',
        };
      }

      // Downgrades take effect on next renewal so current paid period stays intact
      const nowIso = new Date().toISOString();
      const existingHistory = Array.isArray(subSnap.get('history')) ? (subSnap.get('history') as unknown[]) : [];
      await subSnap.ref.update({
        pendingPlanId: targetPlanId,
        pendingPlanFrequency: billingFrequency,
        history: [
          ...existingHistory.slice(-49),
          {
            id: `hist_${Date.now()}`,
            action: 'plan_changed',
            fromStatus: String(subSnap.get('status') || 'Active'),
            toStatus: String(subSnap.get('status') || 'Active'),
            fromPlanId: String(subSnap.get('planId') || ''),
            toPlanId: targetPlanId,
            note: `Downgrade scheduled to ${String(planData.name)} (${billingFrequency}) for next period.`,
            actorUid: uid,
            actorRole: 'Client',
            timestamp: nowIso,
          },
        ],
        updatedAt: nowIso,
      });

      return {
        success: true,
        requiresPayment: false,
        message: `Plan switch to ${String(planData.name)} scheduled for your next billing date.`,
      };
    } catch (err) {
      throw mapErrorToHttpsError(err);
    }
  });

  // =======================================================================
  // 6. Admin Subscription Management & Verified Refund Workflow
  // =======================================================================
  const adminManageSubscription = functions.https.onCall(async (data, context) => {
    try {
      if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
      await assertActiveAdmin(context.auth.uid);
      const payload = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
      const workspaceId = requireSafeDocId(payload.workspaceId, 'Workspace ID');
      const action = String(payload.action || '').trim();
      const note = typeof payload.note === 'string' ? payload.note.trim().slice(0, 500) : '';
      const nowIso = new Date().toISOString();

      const wsSnap = await db.collection('workspaces').doc(workspaceId).get();
      if (!wsSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Workspace not found.');
      }

      if (action === 'sync_entitlements') {
        await syncWorkspaceEntitlementsFromDb(workspaceId);
        return { success: true, message: 'Workspace subscription and purchase entitlements synchronized.' };
      }

      if (action === 'grant') {
        const planId = requireSafeDocId(payload.planId, 'Plan ID');
        const billingFrequency: BillingFrequency =
          String(payload.billingFrequency || 'Monthly') === 'Annual' ? 'Annual' : 'Monthly';
        const planSnap = await db.collection('subscriptionPlans').doc(planId).get();
        if (!planSnap.exists) {
          throw new functions.https.HttpsError('not-found', 'Subscription plan not found.');
        }
        const planData = planSnap.data() || {};
        const subId = `sub_${workspaceId}_${planId}_${Date.now()}`;
        const periodEnd = addDaysIso(nowIso, billingFrequency === 'Annual' ? 365 : Number(planData.durationDays || 30));
        const amount = billingFrequency === 'Annual' ? Number(planData.annualPrice || 0) : Number(planData.monthlyPrice || 0);

        await db.collection('subscriptions').doc(subId).set({
          id: subId,
          workspaceId,
          clientUid: String(wsSnap.get('ownerId') || ''),
          planId,
          planName: String(planData.name || 'Membership Plan'),
          planAudience: String(planData.audience || 'Shared'),
          department: resolveAccountDepartment(undefined, wsSnap.get('type')),
          status: 'Active',
          provider: 'manual',
          billingFrequency,
          currency: validateCurrency(planData.currency || 'NGN'),
          recurringAmount: roundCurrency(amount),
          renewalBehavior: String(planData.renewalBehavior || 'Auto-Renew'),
          currentPeriodStart: nowIso,
          currentPeriodEnd: periodEnd,
          nextBillingDate: periodEnd,
          cancelAtPeriodEnd: false,
          retryCount: 0,
          maxRetries: 3,
          downloadsUsedThisPeriod: 0,
          downloadLimitPerPeriod: Number(planData.downloadLimitPerPeriod ?? -1),
          includedProductIds: Array.isArray(planData.includedProductIds) ? planData.includedProductIds : [],
          includedCategories: Array.isArray(planData.includedCategories) ? planData.includedCategories : [],
          includedPackageIds: Array.isArray(planData.includedPackageIds) ? planData.includedPackageIds : [],
          history: [
            {
              id: `hist_${Date.now()}`,
              action: 'admin_adjusted',
              toStatus: 'Active',
              toPlanId: planId,
              note: note || 'Granted by Admin HQ',
              actorUid: context.auth.uid,
              actorRole: 'Admin',
              timestamp: nowIso,
            },
          ],
          createdAt: nowIso,
          updatedAt: nowIso,
        });

        await syncWorkspaceEntitlementsFromDb(workspaceId);
        await db.collection('adminAuditLogs').add({
          actorUid: context.auth.uid,
          actorName: context.auth.token.name || context.auth.uid,
          action: 'admin_grant_subscription',
          target: `subscriptions/${subId}`,
          details: JSON.stringify({ workspaceId, planId, billingFrequency }),
          createdAt: nowIso,
        });

        return { success: true, subscriptionId: subId, status: 'Active', message: 'Membership granted and synced.' };
      }

      const subscriptionId = requireSafeDocId(payload.subscriptionId, 'Subscription ID');
      const subRef = db.collection('subscriptions').doc(subscriptionId);
      const subSnap = await subRef.get();
      if (!subSnap.exists || subSnap.get('workspaceId') !== workspaceId) {
        throw new functions.https.HttpsError('not-found', 'Subscription not found.');
      }

      const currentStatus = String(subSnap.get('status') || '') as SubscriptionStatus;
      let nextStatus: SubscriptionStatus = currentStatus;
      let histAction: 'suspended' | 'reactivated' | 'cancelled' | 'admin_adjusted' = 'admin_adjusted';

      if (action === 'suspend') {
        nextStatus = 'Suspended';
        histAction = 'suspended';
      } else if (action === 'reactivate') {
        nextStatus = 'Active';
        histAction = 'reactivated';
      } else if (action === 'cancel_immediate') {
        nextStatus = 'Cancelled';
        histAction = 'cancelled';
      } else {
        throw new functions.https.HttpsError('invalid-argument', 'Unsupported admin subscription action.');
      }

      const existingHistory = Array.isArray(subSnap.get('history')) ? (subSnap.get('history') as unknown[]) : [];
      await subRef.update({
        status: nextStatus,
        ...(action === 'reactivate'
          ? {
              cancelAtPeriodEnd: false,
              graceEndsAt: '',
              retryCount: 0,
              lastPaymentError: '',
              currentPeriodEnd:
                Date.parse(String(subSnap.get('currentPeriodEnd') || '')) > Date.now()
                  ? subSnap.get('currentPeriodEnd')
                  : addDaysIso(nowIso, String(subSnap.get('billingFrequency')) === 'Annual' ? 365 : 30),
            }
          : {}),
        history: [
          ...existingHistory.slice(-49),
          {
            id: `hist_${Date.now()}`,
            action: histAction,
            fromStatus: currentStatus,
            toStatus: nextStatus,
            note: note || `Admin action: ${action}`,
            actorUid: context.auth.uid,
            actorRole: 'Admin',
            timestamp: nowIso,
          },
        ],
        updatedAt: nowIso,
      });

      await syncWorkspaceEntitlementsFromDb(workspaceId);
      await db.collection('adminAuditLogs').add({
        actorUid: context.auth.uid,
        actorName: context.auth.token.name || context.auth.uid,
        action: `admin_subscription_${action}`,
        target: `subscriptions/${subscriptionId}`,
        details: JSON.stringify({ workspaceId, fromStatus: currentStatus, toStatus: nextStatus, note }),
        createdAt: nowIso,
      });

      return { success: true, subscriptionId, status: nextStatus, message: `Subscription updated to ${nextStatus}.` };
    } catch (err) {
      throw mapErrorToHttpsError(err);
    }
  });

  const adminProcessRefund = functions.https.onCall(async (data, context) => {
    try {
      if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
      await assertActiveAdmin(context.auth.uid);
      const payload = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
      const transactionId = requireSafeDocId(payload.transactionId, 'Transaction ID');
      const reason = typeof payload.reason === 'string' && payload.reason.trim()
        ? payload.reason.trim().slice(0, 400)
        : 'Admin refund issued';
      const revokeEntitlement = payload.revokeEntitlement !== false;

      const txRef = db.collection('paymentTransactions').doc(transactionId);
      const txSnap = await txRef.get();
      if (!txSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Payment transaction not found.');
      }
      const txData = txSnap.data() || {};
      if (!['Succeeded', 'Partially Refunded'].includes(String(txData.status || ''))) {
        throw new functions.https.HttpsError('failed-precondition', 'Only succeeded transactions can be refunded.');
      }

      const paidAmount = roundCurrency(Number(txData.amount || 0));
      const alreadyRefunded = roundCurrency(Number(txData.refundedAmount || 0));
      const maxRefundable = roundCurrency(paidAmount - alreadyRefunded);
      const requestedRefund =
        payload.amount !== undefined && payload.amount !== null && payload.amount !== ''
          ? roundCurrency(Number(payload.amount))
          : maxRefundable;

      if (!Number.isFinite(requestedRefund) || requestedRefund <= 0 || requestedRefund > maxRefundable) {
        throw new functions.https.HttpsError('invalid-argument', `Refund amount must be between 0.01 and ${maxRefundable}.`);
      }

      const provider = String(txData.provider || 'manual');
      const secrets = getProviderRuntimeSecrets();
      if (provider === 'paystack') {
        if (!secrets.paystackSecretKey) {
          throw new functions.https.HttpsError('failed-precondition', 'Paystack secret key is not configured on the server.');
        }
        await callPaystackRefund({
          secretKey: secrets.paystackSecretKey,
          reference: String(txData.reference || ''),
          amountMajor: requestedRefund,
          note: reason,
        });
      } else if (provider === 'flutterwave') {
        if (!secrets.flutterwaveSecretKey) {
          throw new functions.https.HttpsError('failed-precondition', 'Flutterwave secret key is not configured on the server.');
        }
        if (!txData.providerReference) {
          throw new functions.https.HttpsError('failed-precondition', 'Flutterwave provider transaction ID is missing.');
        }
        await callFlutterwaveRefund({
          secretKey: secrets.flutterwaveSecretKey,
          transactionId: String(txData.providerReference),
          amountMajor: requestedRefund,
          comments: reason,
        });
      }

      const nowIso = new Date().toISOString();
      const newRefundedTotal = roundCurrency(alreadyRefunded + requestedRefund);
      const isFullRefund = newRefundedTotal + 0.005 >= paidAmount;
      const nextTxStatus = isFullRefund ? 'Refunded' : 'Partially Refunded';
      const workspaceId = String(txData.workspaceId || '');

      await txRef.update({
        refundedAmount: newRefundedTotal,
        status: nextTxStatus,
        refundedAt: nowIso,
        updatedAt: nowIso,
      });

      if (revokeEntitlement && isFullRefund) {
        if (txData.purchaseId) {
          await db.collection('oneTimePurchases').doc(String(txData.purchaseId)).update({
            status: 'Refunded',
            refundedAt: nowIso,
            updatedAt: nowIso,
          });
        }
        if (txData.subscriptionId) {
          const subRef = db.collection('subscriptions').doc(String(txData.subscriptionId));
          const subSnap = await subRef.get();
          if (subSnap.exists) {
            const hist = Array.isArray(subSnap.get('history')) ? (subSnap.get('history') as unknown[]) : [];
            await subRef.update({
              status: 'Cancelled',
              history: [
                ...hist.slice(-49),
                {
                  id: `hist_${Date.now()}`,
                  action: 'refunded',
                  fromStatus: String(subSnap.get('status') || 'Active'),
                  toStatus: 'Cancelled',
                  note: reason,
                  actorUid: context.auth.uid,
                  actorRole: 'Admin',
                  timestamp: nowIso,
                },
              ],
              updatedAt: nowIso,
            });
          }
        }
        if (workspaceId) {
          await syncWorkspaceEntitlementsFromDb(workspaceId);
        }
      }

      await db.collection('adminAuditLogs').add({
        actorUid: context.auth.uid,
        actorName: context.auth.token.name || context.auth.uid,
        action: 'process_refund',
        target: `paymentTransactions/${transactionId}`,
        details: JSON.stringify({ amount: requestedRefund, status: nextTxStatus, reason, revokeEntitlement }),
        createdAt: nowIso,
      });

      if (txData.clientUid) {
        await notifyUser(
          String(txData.clientUid),
          `refund_${transactionId}_${newRefundedTotal}`,
          'Payment Refund Processed',
          `A refund of ${String(txData.currency)} ${requestedRefund.toLocaleString()} for ${String(txData.reference)} has been processed (${reason}).`,
          'invoice',
          undefined,
          String(txData.invoiceId || transactionId),
        );
      }

      return {
        success: true,
        status: nextTxStatus,
        refundedAmount: newRefundedTotal,
        message: `Refund of ${String(txData.currency)} ${requestedRefund.toLocaleString()} processed.`,
      };
    } catch (err) {
      throw mapErrorToHttpsError(err);
    }
  });

  // =======================================================================
  // 7. Verified Webhooks (Paystack & Flutterwave) with Replay/Idempotency
  // =======================================================================
  const paystackWebhook = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }
    try {
      const secrets = getProviderRuntimeSecrets();
      const sigHeader = req.get('x-paystack-signature') || '';
      const rawBody = req.rawBody ? req.rawBody : JSON.stringify(req.body || {});
      if (!verifyPaystackWebhookSignature(rawBody, sigHeader, secrets.paystackWebhookSecret)) {
        res.status(401).json({ received: false, error: 'Invalid Paystack webhook signature.' });
        return;
      }

      const event = (req.body && typeof req.body === 'object' ? req.body : {}) as {
        event?: string;
        data?: Record<string, unknown>;
      };
      const eventName = String(event.event || 'unknown');
      const dataObj = (event.data || {}) as Record<string, unknown>;
      const reference = String(dataObj.reference || '');
      const eventKey = `paystack_${eventName}_${reference || dataObj.id || Date.now()}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
      const webhookDocRef = db.collection('paymentWebhookEvents').doc(eventKey);

      const existingWebhook = await webhookDocRef.get();
      if (existingWebhook.exists && existingWebhook.get('processed') === true) {
        res.status(200).json({ received: true, duplicate: true });
        return;
      }

      const nowIso = new Date().toISOString();
      await webhookDocRef.set({
        id: eventKey,
        provider: 'paystack',
        event: eventName,
        reference,
        processed: false,
        receivedAt: nowIso,
      });

      if (eventName === 'charge.success' && reference) {
        const txQuery = await db.collection('paymentTransactions').where('reference', '==', reference).limit(1).get();
        if (!txQuery.empty) {
          const verified = await callPaystackVerify({ secretKey: secrets.paystackSecretKey, reference });
          await finalizeSettledTransaction({
            txRef: txQuery.docs[0].ref,
            providerStatus: verified.status,
            paidAmountMajor: verified.amountMajor,
            paidCurrency: verified.currency,
            channel: verified.channel,
            providerReference: verified.providerReference,
            customerCode: verified.customerCode,
            authorizationCode: verified.authorizationCode,
            actorRole: 'Webhook',
          });
        }
      } else if (eventName === 'invoice.payment_failed' && reference) {
        const txQuery = await db.collection('paymentTransactions').where('reference', '==', reference).limit(1).get();
        if (!txQuery.empty) {
          const txDoc = txQuery.docs[0];
          await txDoc.ref.update({
            status: 'Failed',
            failureReason: String(dataObj.gateway_response || 'Recurring charge failed'),
            updatedAt: nowIso,
          });
          const subId = String(txDoc.get('subscriptionId') || '');
          if (subId) {
            const subRef = db.collection('subscriptions').doc(subId);
            const subSnap = await subRef.get();
            if (subSnap.exists) {
              await subRef.update({
                status: 'Past Due',
                lastPaymentError: String(dataObj.gateway_response || 'Payment failed'),
                updatedAt: nowIso,
              });
            }
          }
        }
      }

      await webhookDocRef.update({ processed: true, processedAt: new Date().toISOString() });
      res.status(200).json({ received: true });
    } catch (err) {
      res.status(500).json({ received: false, error: err instanceof Error ? err.message : 'Webhook error' });
    }
  });

  const flutterwaveWebhook = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }
    try {
      const secrets = getProviderRuntimeSecrets();
      const verifHash = req.get('verif-hash') || '';
      if (!verifyFlutterwaveWebhookSignature(verifHash, secrets.flutterwaveSecretHash)) {
        res.status(401).json({ received: false, error: 'Invalid Flutterwave webhook signature.' });
        return;
      }

      const body = (req.body && typeof req.body === 'object' ? req.body : {}) as {
        event?: string;
        data?: Record<string, unknown>;
      };
      const eventName = String(body.event || 'unknown');
      const dataObj = (body.data || {}) as Record<string, unknown>;
      const txRefStr = String(dataObj.tx_ref || '');
      const flwTxId = dataObj.id ? String(dataObj.id) : '';
      const eventKey = `flw_${eventName}_${txRefStr || flwTxId || Date.now()}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
      const webhookDocRef = db.collection('paymentWebhookEvents').doc(eventKey);

      const existingWebhook = await webhookDocRef.get();
      if (existingWebhook.exists && existingWebhook.get('processed') === true) {
        res.status(200).json({ received: true, duplicate: true });
        return;
      }

      const nowIso = new Date().toISOString();
      await webhookDocRef.set({
        id: eventKey,
        provider: 'flutterwave',
        event: eventName,
        reference: txRefStr,
        processed: false,
        receivedAt: nowIso,
      });

      if (eventName === 'charge.completed' && txRefStr) {
        const txQuery = await db.collection('paymentTransactions').where('reference', '==', txRefStr).limit(1).get();
        if (!txQuery.empty && secrets.flutterwaveSecretKey) {
          const verified = await callFlutterwaveVerify({
            secretKey: secrets.flutterwaveSecretKey,
            transactionId: flwTxId || undefined,
            txRef: txRefStr,
          });
          await finalizeSettledTransaction({
            txRef: txQuery.docs[0].ref,
            providerStatus: verified.status,
            paidAmountMajor: verified.amountMajor,
            paidCurrency: verified.currency,
            channel: verified.channel,
            providerReference: verified.providerReference,
            actorRole: 'Webhook',
          });
        }
      }

      await webhookDocRef.update({ processed: true, processedAt: new Date().toISOString() });
      res.status(200).json({ received: true });
    } catch (err) {
      res.status(500).json({ received: false, error: err instanceof Error ? err.message : 'Webhook error' });
    }
  });

  // =======================================================================
  // 8. Scheduled Subscription Lifecycle Processor (Renewals, Grace, Expiry)
  // =======================================================================
  const processSubscriptionLifecycles = functions.pubsub
    .schedule('every 60 minutes')
    .onRun(async () => {
      const nowIso = new Date().toISOString();
      const settings = await loadPaymentSettings();
      const subsSnap = await db
        .collection('subscriptions')
        .where('status', 'in', ['Active', 'Trialing', 'Past Due', 'Grace Period'])
        .get();

      const workspacesToSync = new Set<string>();

      for (const subDoc of subsSnap.docs) {
        const subData = subDoc.data() || {};
        const evaluation = evaluateSubscriptionLifecycle({
          subscription: {
            status: String(subData.status || 'Active') as SubscriptionStatus,
            planName: String(subData.planName || 'Membership'),
            currentPeriodEnd: String(subData.currentPeriodEnd || nowIso),
            trialEndsAt: typeof subData.trialEndsAt === 'string' ? subData.trialEndsAt : undefined,
            graceEndsAt: typeof subData.graceEndsAt === 'string' ? subData.graceEndsAt : undefined,
            cancelAtPeriodEnd: subData.cancelAtPeriodEnd === true,
            renewalBehavior: String(subData.renewalBehavior || 'Auto-Renew') === 'Manual Renewal' ? 'Manual Renewal' : 'Auto-Renew',
            retryCount: Number(subData.retryCount || 0),
            maxRetries: Number(subData.maxRetries ?? settings.maxPaymentRetries),
          },
          gracePeriodDays: settings.defaultGracePeriodDays,
          nowIso,
        });

        if (evaluation.changed) {
          const hist = Array.isArray(subData.history) ? (subData.history as unknown[]) : [];
          await subDoc.ref.update({
            status: evaluation.nextStatus,
            retryCount: evaluation.nextRetryCount,
            ...(evaluation.nextGraceEndsAt ? { graceEndsAt: evaluation.nextGraceEndsAt } : {}),
            history: [
              ...hist.slice(-49),
              {
                id: `hist_${Date.now()}`,
                action:
                  evaluation.nextStatus === 'Grace Period'
                    ? 'grace_entered'
                    : evaluation.nextStatus === 'Suspended'
                      ? 'suspended'
                      : evaluation.nextStatus === 'Expired'
                        ? 'expired'
                        : 'cancelled',
                fromStatus: String(subData.status),
                toStatus: evaluation.nextStatus,
                note: evaluation.notificationMessage || 'Automated lifecycle transition',
                actorRole: 'System',
                timestamp: nowIso,
              },
            ],
            updatedAt: nowIso,
          });
          if (typeof subData.workspaceId === 'string') {
            workspacesToSync.add(subData.workspaceId);
          }
        }

        if (evaluation.eventType && evaluation.notificationTitle && evaluation.notificationMessage) {
          const clientUid = String(subData.clientUid || '');
          const eventKey = `sub_${subDoc.id}_${evaluation.eventType}_${nowIso.slice(0, 10)}`;
          await notifyUser(
            clientUid,
            eventKey,
            evaluation.notificationTitle,
            evaluation.notificationMessage,
            'subscription',
            undefined,
            subDoc.id,
          );
          if (evaluation.changed) {
            const eventRef = db.collection('subscriptionEvents').doc();
            await eventRef.create({
              id: eventRef.id,
              subscriptionId: subDoc.id,
              workspaceId: String(subData.workspaceId || ''),
              clientUid,
              eventType: evaluation.eventType,
              summary: evaluation.notificationMessage,
              createdAt: nowIso,
            });
          }
        }
      }

      for (const wsId of workspacesToSync) {
        await syncWorkspaceEntitlementsFromDb(wsId);
      }

      return null;
    });

  return {
    getPaymentSystemConfig,
    adminSaveSubscriptionPlan,
    adminSetSubscriptionPlanStatus,
    adminUpdatePaymentSettings,
    initializeCheckoutPayment,
    verifyPaymentTransaction,
    cancelWorkspaceSubscription,
    changeWorkspaceSubscriptionPlan,
    adminManageSubscription,
    adminProcessRefund,
    paystackWebhook,
    flutterwaveWebhook,
    processSubscriptionLifecycles,
  };
}

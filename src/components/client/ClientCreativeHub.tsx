import React, { useEffect, useMemo, useState } from 'react';
import { collection, documentId, onSnapshot, query, where } from 'firebase/firestore';
import { getBlob, ref } from 'firebase/storage';
import {
  ArrowUpRight,
  Bookmark,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileArchive,
  FileText,
  FolderCheck,
  FolderPlus,
  Heart,
  Image as ImageIcon,
  Layers,
  Lock,
  Package,
  Plus,
  Ruler,
  Search,
  Send,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import { auth, db, storage } from '../../lib/firebase';
import type { ClientProfile, Workspace } from '../../types';
import type { CreativeStarterParams } from '../../types/creativeProduction';
import type {
  CreativeProduct,
  CreativeProductAudience,
  CreativeProductDeliverableFile,
  CreativeResourceDrop,
  CreativeResourceType,
  FavouriteResource,
  ProductVariationOption,
  ResourceAccessHistoryItem,
  ResourceCollection,
} from '../../types/creativeProduct';
import type { CanvasDesign } from '../../types/designStudio';
import {
  ARTIST_CREATIVE_SERVICES,
  BRAND_BUSINESS_CREATIVE_SERVICES,
  buildProductRequestPrefill,
  type ClientExperienceConfig,
  type ClientTab,
  type ProductionRequestPrefill,
} from '../../lib/clientOS';
import {
  ARTIST_PRODUCT_FAMILIES,
  BRAND_BUSINESS_PRODUCT_FAMILIES,
  SHARED_PRODUCT_FAMILIES,
  formatBytesCompact,
  getApprovedDownloadableFiles,
  getProductDownloadStatusSummary,
  isClientEligibleForProductDownload,
  isClientEligibleForProductView,
  isWorkspaceStatusEligible,
  resolveActiveWorkspacePackageIds,
  resolveClientAudienceBucket,
  resolveProductFamily,
  slugifyProductTitle,
  STREAMING_PLATFORM_DIMENSIONS,
} from '../../lib/creativeProductAccess';
import { downloadProductStorageFile } from '../../lib/creativeProducts';
import {
  formatSubscriptionMoney,
  isSubscriptionStatusEntitled,
  resolveProductPurchaseTerms,
} from '../../lib/subscriptions';
import {
  DEFAULT_VARIATION_OPTIONS,
  resolveProductPreviewGallery,
} from '../../lib/creativeResourcePreviews';
import {
  addProductToCollection,
  createResourceCollection,
  deleteResourceCollection,
  recordResourceHistoryEntry,
  removeProductFromCollection,
  renameResourceCollection,
  splitCurrentAndArchivedDrops,
  subscribeClientCreativeDrops,
  subscribeUserCollections,
  subscribeUserFavourites,
  subscribeUserResourceHistory,
  toggleFavouriteResource,
  trackResourceEvent,
  verifyResourceDownloadAccess,
} from '../../lib/creativeEcosystem';
import {
  generateEditableProductSvgBlob,
  generateStructuredDocumentPdfBlob,
  packageMultipleProductsZip,
  packageProductDeliverablesZip,
  renderCanvasDesignToRasterBlob,
} from '../../lib/productPackager';
import { MASTER_CREATIVE_TEMPLATES } from '../../data/creativeTemplatesData';
import { TEMPLATE_FAMILIES } from '../../data/templateFamiliesData';
import { buildHonestDesignForTemplate } from '../../utils/templateDesignBuilder';
import { CheckoutModal, type CheckoutTarget } from '../billing/CheckoutModal';
import { Modal } from '../common/Modal';

export interface ClientCreativeHubProps {
  workspace: Workspace;
  clientProfile: ClientProfile | null;
  experience: ClientExperienceConfig;
  onRequestProduction: (prefill?: Partial<ProductionRequestPrefill>) => void;
  onNavigateSection: (tab: ClientTab) => void;
  onOpenInStudio?: (starter: CreativeStarterParams) => void;
}

type HubSectionTab = 'explore' | 'drops' | 'saved' | 'history';
type AccessFilterMode = 'all' | 'downloadable' | 'package' | 'assigned' | 'request-only';
type AudienceScopeMode = 'all' | 'core' | 'shared';
type SortMode = 'featured' | 'title' | 'newest';
type StudioExportFormat = 'ZIP' | 'PDF' | 'SVG' | 'PNG';

const RESOURCE_TYPE_OPTIONS: CreativeResourceType[] = [
  'Template',
  'Document Suite',
  'Social Pack',
  'Press & EPK',
  'Brand Kit',
  'Mockup & Print',
  'Motion & Canvas',
  'Shared Utility',
];

function triggerLocalBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function resolveTemplateDesignForProduct(product: CreativeProduct): CanvasDesign | undefined {
  if (product.linkedTemplateId) {
    const master = MASTER_CREATIVE_TEMPLATES.find(t => t.id === product.linkedTemplateId);
    if (master) return buildHonestDesignForTemplate(master);
    const fam = TEMPLATE_FAMILIES.find(f => f.id === product.linkedTemplateId);
    if (fam) return fam.design;
  }
  return undefined;
}

async function svgBlobToPngBlob(svgBlob: Blob, width = 1200, height = 1200): Promise<Blob> {
  const svgText = await svgBlob.text();
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
  return await new Promise<Blob>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable for PNG export.'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('PNG conversion returned empty blob.'))),
        'image/png',
      );
    };
    img.onerror = () => reject(new Error('Unable to rasterize SVG artwork into PNG.'));
    img.src = dataUrl;
  });
}

export const ClientCreativeHub: React.FC<ClientCreativeHubProps> = ({
  workspace,
  clientProfile,
  experience,
  onRequestProduction,
  onNavigateSection,
  onOpenInStudio,
}) => {
  const launchProductInStudio = (product: CreativeProduct) => {
    if (!onOpenInStudio) return;
    onOpenInStudio({
      source: 'resource',
      toolId: 'pack-template-customizer',
      title: `${product.title} (Studio Custom)`,
      linkedProductId: product.id,
      linkedProductTitle: product.title,
      prefillDesign: {
        headline: product.title.toUpperCase(),
        subtitle: product.summary || product.description,
        tagline: `${product.category} · ${product.resourceType || 'CREATIVE PACK'}`.toUpperCase(),
        genreOrCategory: product.category,
        imageUrl: product.previewImageUrl || '',
      },
    });
  };
  const activeUid = clientProfile?.uid || auth.currentUser?.uid || '';

  const clientBucket = useMemo(
    () => resolveClientAudienceBucket(clientProfile?.accountType, workspace.type),
    [clientProfile?.accountType, workspace.type],
  );

  const allowedQueryAudiences = useMemo<CreativeProductAudience[]>(() => {
    if (clientBucket === 'Artist') return ['Artist', 'Shared'];
    return ['Brand', 'Business', 'Brand & Business', 'Shared'];
  }, [clientBucket]);

  const productFamilies = useMemo(
    () => [
      ...(experience.isArtist ? ARTIST_PRODUCT_FAMILIES : BRAND_BUSINESS_PRODUCT_FAMILIES),
      ...SHARED_PRODUCT_FAMILIES,
    ],
    [experience.isArtist],
  );

  const serviceOptions = useMemo(
    () => (experience.isArtist ? ARTIST_CREATIVE_SERVICES : BRAND_BUSINESS_CREATIVE_SERVICES),
    [experience.isArtist],
  );

  const [hubTab, setHubTab] = useState<HubSectionTab>('explore');
  const [productsByQueryKey, setProductsByQueryKey] = useState<Record<string, CreativeProduct[]>>({});
  const [activeServicePackageIds, setActiveServicePackageIds] = useState<Set<string> | undefined>(undefined);
  const [drops, setDrops] = useState<CreativeResourceDrop[]>([]);
  const [favourites, setFavourites] = useState<FavouriteResource[]>([]);
  const [collections, setCollections] = useState<ResourceCollection[]>([]);
  const [historyItems, setHistoryItems] = useState<ResourceAccessHistoryItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadNotice, setDownloadNotice] = useState('');
  const [downloadingFileId, setDownloadingFileId] = useState('');
  const [studioExportBusy, setStudioExportBusy] = useState(false);

  const [audienceScope, setAudienceScope] = useState<AudienceScopeMode>('all');
  const [activeFamily, setActiveFamily] = useState<string>('All');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('All');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<'All' | CreativeResourceType>('All');
  const [accessFilter, setAccessFilter] = useState<AccessFilterMode>('all');
  const [sortMode, setSortMode] = useState<SortMode>('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStreamingMatrix, setShowStreamingMatrix] = useState(false);

  // Batch multi-select ZIP export
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [batchZipProgress, setBatchZipProgress] = useState('');

  // Modal & detail controls
  const [selectedProduct, setSelectedProduct] = useState<CreativeProduct | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [selectedExportFormat, setSelectedExportFormat] = useState<StudioExportFormat>('ZIP');
  const [selectedVariationId, setSelectedVariationId] = useState<string>(DEFAULT_VARIATION_OPTIONS[0].id);
  const [quickCollectionId, setQuickCollectionId] = useState<string>('');
  const [quickNewCollectionName, setQuickNewCollectionName] = useState('');

  // Collections tab CRUD
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [editingCollectionName, setEditingCollectionName] = useState('');
  const [collectionZipBusyId, setCollectionZipBusyId] = useState<string | null>(null);
  const [checkoutTarget, setCheckoutTarget] = useState<CheckoutTarget | null>(null);

  useEffect(() => {
    setActiveFamily('All');
    setActiveSubcategory('All');
    setResourceTypeFilter('All');
    setAudienceScope('all');
  }, [experience.isArtist]);

  useEffect(() => {
    setActiveSubcategory('All');
  }, [activeFamily]);

  // Subscribe to active service packages so deactivated or unknown packages never unlock products
  useEffect(() => {
    if (!workspace.id || clientProfile?.onboardingComplete !== true) {
      setActiveServicePackageIds(new Set());
      return;
    }
    const unsubServices = onSnapshot(
      query(collection(db, 'services'), where('isActive', '==', true)),
      snap => {
        setActiveServicePackageIds(new Set(snap.docs.map(d => d.id)));
      },
      err => {
        console.warn('Unable to load active service package catalog:', err);
        setActiveServicePackageIds(new Set());
      },
    );
    return () => unsubServices();
  }, [workspace.id, clientProfile?.onboardingComplete]);

  // User Ecosystem Subscriptions: Favourites, Collections, Resource History, Monthly Drops
  useEffect(() => {
    if (!activeUid) {
      setFavourites([]);
      setCollections([]);
      setHistoryItems([]);
      return;
    }
    const unsubFav = subscribeUserFavourites(activeUid, setFavourites);
    const unsubCols = subscribeUserCollections(activeUid, cols => {
      setCollections(cols);
      if (cols.length > 0) {
        setQuickCollectionId(prev => prev || cols[0].id);
      }
    });
    const unsubHist = subscribeUserResourceHistory(activeUid, setHistoryItems);
    return () => {
      unsubFav();
      unsubCols();
      unsubHist();
    };
  }, [activeUid]);

  useEffect(() => {
    if (!workspace.id || clientProfile?.onboardingComplete !== true || !isWorkspaceStatusEligible(workspace.status)) {
      setDrops([]);
      return;
    }
    return subscribeClientCreativeDrops(allowedQueryAudiences, setDrops);
  }, [workspace.id, workspace.status, clientProfile?.onboardingComplete, allowedQueryAudiences]);

  const validContractedPackageIds = useMemo(
    () =>
      resolveActiveWorkspacePackageIds({
        workspaceId: workspace.id,
        workspaceStatus: workspace.status,
        contractedPackageIds: workspace.contractedPackageIds,
        activePackageIds: workspace.activePackageIds,
        activeServicePackageIds,
        packageEntitlements: workspace.packageEntitlements,
      }),
    [
      workspace.id,
      workspace.status,
      workspace.contractedPackageIds,
      workspace.activePackageIds,
      workspace.packageEntitlements,
      activeServicePackageIds,
    ],
  );

  useEffect(() => {
    if (
      !workspace.id ||
      clientProfile?.onboardingComplete !== true ||
      !isWorkspaceStatusEligible(workspace.status)
    ) {
      setProductsByQueryKey({});
      setLoading(false);
      return;
    }

    const declaredPackages = [
      ...(Array.isArray(workspace.contractedPackageIds) ? workspace.contractedPackageIds : []),
      ...(Array.isArray(workspace.activePackageIds) ? workspace.activePackageIds : []),
    ];

    if (declaredPackages.length > 0 && activeServicePackageIds === undefined) {
      setLoading(true);
      return;
    }

    setLoading(true);
    setError('');
    setProductsByQueryKey({});

    const expectedKeys = new Set<string>();
    const settledKeys = new Set<string>();
    const unsubs: Array<() => void> = [];

    const markSettled = (key: string) => {
      settledKeys.add(key);
      if (settledKeys.size >= expectedKeys.size) {
        setLoading(false);
      }
    };

    for (const aud of allowedQueryAudiences) {
      const publicKey = `open:${aud}`;
      expectedKeys.add(publicKey);
      unsubs.push(
        onSnapshot(
          query(
            collection(db, 'creativeProducts'),
            where('status', '==', 'Published'),
            where('audience', '==', aud),
            where('accessType', 'in', ['Free', 'RequestRequired']),
          ),
          snap => {
            const rows = snap.docs.map(d => ({ id: d.id, ...d.data() } as CreativeProduct));
            setProductsByQueryKey(prev => ({ ...prev, [publicKey]: rows }));
            markSettled(publicKey);
          },
          err => {
            setError(err?.message || 'Unable to load Creative Hub products.');
            markSettled(publicKey);
          },
        ),
      );

      const defaultUnlockedKey = `unlocked:${aud}`;
      expectedKeys.add(defaultUnlockedKey);
      unsubs.push(
        onSnapshot(
          query(
            collection(db, 'creativeProducts'),
            where('status', '==', 'Published'),
            where('audience', '==', aud),
            where('unlockedByDefault', '==', true),
          ),
          snap => {
            const rows = snap.docs.map(d => ({ id: d.id, ...d.data() } as CreativeProduct));
            setProductsByQueryKey(prev => ({ ...prev, [defaultUnlockedKey]: rows }));
            markSettled(defaultUnlockedKey);
          },
          () => {
            markSettled(defaultUnlockedKey);
          },
        ),
      );

      const assignedKey = `assigned:${aud}`;
      expectedKeys.add(assignedKey);
      unsubs.push(
        onSnapshot(
          query(
            collection(db, 'creativeProducts'),
            where('status', '==', 'Published'),
            where('audience', '==', aud),
            where('assignedWorkspaceIds', 'array-contains', workspace.id),
          ),
          snap => {
            const rows = snap.docs.map(d => ({ id: d.id, ...d.data() } as CreativeProduct));
            setProductsByQueryKey(prev => ({ ...prev, [assignedKey]: rows }));
            markSettled(assignedKey);
          },
          err => {
            setError(err?.message || 'Unable to load workspace-assigned creative products.');
            markSettled(assignedKey);
          },
        ),
      );

      const purchasableKey = `purchasable:${aud}`;
      expectedKeys.add(purchasableKey);
      unsubs.push(
        onSnapshot(
          query(
            collection(db, 'creativeProducts'),
            where('status', '==', 'Published'),
            where('audience', '==', aud),
            where('isPurchasable', '==', true),
          ),
          snap => {
            const rows = snap.docs.map(d => ({ id: d.id, ...d.data() } as CreativeProduct));
            setProductsByQueryKey(prev => ({ ...prev, [purchasableKey]: rows }));
            markSettled(purchasableKey);
          },
          () => {
            markSettled(purchasableKey);
          },
        ),
      );

      if (
        isSubscriptionStatusEntitled(workspace.activeSubscriptionStatus) &&
        Array.isArray(workspace.subscriptionEntitledCategories) &&
        workspace.subscriptionEntitledCategories.length > 0
      ) {
        const subCatKey = `subcat:${aud}`;
        expectedKeys.add(subCatKey);
        unsubs.push(
          onSnapshot(
            query(
              collection(db, 'creativeProducts'),
              where('status', '==', 'Published'),
              where('audience', '==', aud),
              where('category', 'in', workspace.subscriptionEntitledCategories.slice(0, 10)),
            ),
            snap => {
              const rows = snap.docs.map(d => ({ id: d.id, ...d.data() } as CreativeProduct));
              setProductsByQueryKey(prev => ({ ...prev, [subCatKey]: rows }));
              markSettled(subCatKey);
            },
            () => {
              markSettled(subCatKey);
            },
          ),
        );
      }

      const unlockedProductIds = Array.from(
        new Set([
          ...(Array.isArray(workspace.purchasedProductIds) ? workspace.purchasedProductIds : []),
          ...(isSubscriptionStatusEntitled(workspace.activeSubscriptionStatus) &&
          Array.isArray(workspace.subscriptionEntitledProductIds)
            ? workspace.subscriptionEntitledProductIds
            : []),
        ]),
      ).filter(Boolean);

      if (unlockedProductIds.length > 0) {
        const unlockedIdsKey = `unlockedIds:${aud}`;
        expectedKeys.add(unlockedIdsKey);
        unsubs.push(
          onSnapshot(
            query(
              collection(db, 'creativeProducts'),
              where('status', '==', 'Published'),
              where('audience', '==', aud),
              where(documentId(), 'in', unlockedProductIds.slice(0, 30)),
            ),
            snap => {
              const rows = snap.docs.map(d => ({ id: d.id, ...d.data() } as CreativeProduct));
              setProductsByQueryKey(prev => ({ ...prev, [unlockedIdsKey]: rows }));
              markSettled(unlockedIdsKey);
            },
            () => {
              markSettled(unlockedIdsKey);
            },
          ),
        );
      }

      for (const pkgId of validContractedPackageIds) {
        const pkgKey = `pkg:${aud}:${pkgId}`;
        expectedKeys.add(pkgKey);
        unsubs.push(
          onSnapshot(
            query(
              collection(db, 'creativeProducts'),
              where('status', '==', 'Published'),
              where('audience', '==', aud),
              where('accessType', '==', 'IncludedInPackage'),
              where('includedPackageIds', 'array-contains', pkgId),
            ),
            snap => {
              const rows = snap.docs.map(d => ({ id: d.id, ...d.data() } as CreativeProduct));
              setProductsByQueryKey(prev => ({ ...prev, [pkgKey]: rows }));
              markSettled(pkgKey);
            },
            err => {
              setError(err?.message || 'Unable to load package-entitled creative products.');
              markSettled(pkgKey);
            },
          ),
        );
      }
    }

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [
    workspace.id,
    workspace.status,
    workspace.contractedPackageIds,
    workspace.activePackageIds,
    workspace.purchasedProductIds,
    workspace.activeSubscriptionStatus,
    workspace.subscriptionEntitledCategories,
    workspace.subscriptionEntitledProductIds,
    clientProfile?.onboardingComplete,
    allowedQueryAudiences,
    validContractedPackageIds,
    activeServicePackageIds,
  ]);

  const eligibilityBase = useMemo(
    () => ({
      clientBucket,
      workspaceId: workspace.id,
      workspaceStatus: workspace.status,
      contractedPackageIds: workspace.contractedPackageIds || [],
      activePackageIds: workspace.activePackageIds || [],
      activeServicePackageIds,
      packageEntitlements: workspace.packageEntitlements,
      purchasedProductIds: workspace.purchasedProductIds || [],
      activeSubscription: workspace.activeSubscriptionStatus
        ? {
            status: workspace.activeSubscriptionStatus,
            expiresAt: workspace.subscriptionExpiresAt,
            planId: workspace.activeSubscriptionPlanId,
            entitledProductIds: workspace.subscriptionEntitledProductIds,
            entitledCategories: workspace.subscriptionEntitledCategories,
          }
        : null,
    }),
    [
      clientBucket,
      workspace.id,
      workspace.status,
      workspace.contractedPackageIds,
      workspace.activePackageIds,
      activeServicePackageIds,
      workspace.packageEntitlements,
      workspace.purchasedProductIds,
      workspace.activeSubscriptionStatus,
      workspace.subscriptionExpiresAt,
      workspace.activeSubscriptionPlanId,
      workspace.subscriptionEntitledProductIds,
      workspace.subscriptionEntitledCategories,
    ],
  );

  const eligibleProducts = useMemo(() => {
    const merged = new Map<string, CreativeProduct>();
    for (const group of Object.values(productsByQueryKey)) {
      for (const product of group) {
        if (
          isClientEligibleForProductView({
            product,
            ...eligibilityBase,
          })
        ) {
          merged.set(product.id, product);
        }
      }
    }
    return Array.from(merged.values()).sort((a, b) => {
      if (Boolean(a.featured) !== Boolean(b.featured)) {
        return a.featured ? -1 : 1;
      }
      return (b.updatedAt || '').localeCompare(a.updatedAt || '');
    });
  }, [productsByQueryKey, eligibilityBase]);

  const eligibleProductsMap = useMemo(
    () => new Map(eligibleProducts.map(p => [p.id, p])),
    [eligibleProducts],
  );

  const favouriteIds = useMemo(() => new Set(favourites.map(f => f.productId)), [favourites]);

  const { currentDrops, archivedDrops, newDropProductIds } = useMemo(
    () => splitCurrentAndArchivedDrops(drops, clientBucket),
    [drops, clientBucket],
  );

  useEffect(() => {
    if (hubTab === 'drops' && currentDrops.length > 0 && workspace.id) {
      currentDrops.forEach(drop => {
        void trackResourceEvent({
          dropId: drop.id,
          action: 'drop_view',
          workspaceId: workspace.id,
          audience: drop.audience,
          title: drop.title,
        });
      });
    }
  }, [hubTab, currentDrops, workspace.id]);

  const canProductExportNow = (product: CreativeProduct): boolean => {
    const canDownload = isClientEligibleForProductDownload({ product, ...eligibilityBase });
    if (!canDownload) return false;
    return getApprovedDownloadableFiles(product.files).length > 0 || product.instantStudioPackEligible === true;
  };

  const downloadableCount = useMemo(
    () => eligibleProducts.filter(product => canProductExportNow(product)).length,
    [eligibleProducts, eligibilityBase],
  );

  const assignedCount = useMemo(
    () => eligibleProducts.filter(product => product.assignedWorkspaceIds?.includes(workspace.id)).length,
    [eligibleProducts, workspace.id],
  );

  const availableSubcategories = useMemo(() => {
    const pool =
      activeFamily === 'All' || activeFamily === '__assigned__'
        ? eligibleProducts
        : eligibleProducts.filter(p => resolveProductFamily(p) === activeFamily);
    return Array.from(new Set(pool.map(p => (p.subcategory || '').trim()).filter(Boolean)));
  }, [eligibleProducts, activeFamily]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = eligibleProducts.filter(product => {
      const family = resolveProductFamily(product);
      const summary = getProductDownloadStatusSummary({
        product,
        ...eligibilityBase,
      });
      const isReady = canProductExportNow(product);

      if (audienceScope === 'shared' && product.audience !== 'Shared') return false;
      if (audienceScope === 'core' && product.audience === 'Shared') return false;

      if (activeFamily === '__assigned__') {
        if (!summary.isAssignedToWorkspace && !isReady) return false;
      } else if (activeFamily !== 'All' && family !== activeFamily) {
        return false;
      }

      if (activeSubcategory !== 'All' && (product.subcategory || '').trim() !== activeSubcategory) {
        return false;
      }

      if (resourceTypeFilter !== 'All' && (product.resourceType || '') !== resourceTypeFilter) {
        return false;
      }

      if (accessFilter === 'downloadable' && !isReady) return false;
      if (
        accessFilter === 'package' &&
        product.accessType !== 'Free' &&
        product.accessType !== 'IncludedInPackage'
      ) {
        return false;
      }
      if (accessFilter === 'assigned' && !summary.isAssignedToWorkspace) return false;
      if (accessFilter === 'request-only' && product.accessType !== 'RequestRequired') return false;

      if (!q) return true;
      return (
        product.title.toLowerCase().includes(q) ||
        family.toLowerCase().includes(q) ||
        (product.resourceType || '').toLowerCase().includes(q) ||
        (product.industryTag || '').toLowerCase().includes(q) ||
        product.summary.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        (product.subcategory || '').toLowerCase().includes(q) ||
        product.deliverablesSummary.some(item => item.toLowerCase().includes(q))
      );
    });

    if (sortMode === 'title') {
      return [...list].sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sortMode === 'newest') {
      return [...list].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    }
    return list;
  }, [
    eligibleProducts,
    audienceScope,
    activeFamily,
    activeSubcategory,
    resourceTypeFilter,
    accessFilter,
    sortMode,
    searchQuery,
    eligibilityBase,
  ]);

  const openProductDetail = (product: CreativeProduct) => {
    setSelectedProduct(product);
    setActiveSlideIndex(0);
    const variations =
      product.variationOptions && product.variationOptions.length > 0
        ? product.variationOptions
        : DEFAULT_VARIATION_OPTIONS;
    setSelectedVariationId(variations[0]?.id || DEFAULT_VARIATION_OPTIONS[0].id);
    setSelectedExportFormat('ZIP');
    setError('');

    if (activeUid && workspace.id) {
      void recordResourceHistoryEntry({
        uid: activeUid,
        workspaceId: workspace.id,
        product,
        action: 'view',
      });
      void trackResourceEvent({
        productId: product.id,
        action: 'view',
        workspaceId: workspace.id,
        audience: product.audience,
        category: product.category,
        accessType: product.accessType,
        title: product.title,
      });
    }
  };

  const handleToggleFavourite = async (product: CreativeProduct, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!activeUid) return;
    const isFav = favouriteIds.has(product.id);
    try {
      const saved = await toggleFavouriteResource({
        uid: activeUid,
        workspaceId: workspace.id,
        product,
        currentlyFavourited: isFav,
      });
      setDownloadNotice(
        saved
          ? `Saved "${product.title}" to your Favourites.`
          : `Removed "${product.title}" from Favourites.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update favourite status.');
    }
  };

  const handleDownloadFile = async (product: CreativeProduct, file: CreativeProductDeliverableFile) => {
    const canDownload = isClientEligibleForProductDownload({
      product,
      ...eligibilityBase,
    });
    const isApprovedSafeFile = getApprovedDownloadableFiles(product.files).some(f => f.id === file.id);
    if (!canDownload || !file.isApprovedForClient || !isApprovedSafeFile) {
      setError('This deliverable is not currently unlocked for download in your workspace.');
      return;
    }
    setDownloadingFileId(file.id);
    setError('');
    setDownloadNotice('');
    try {
      const serverCheck = await verifyResourceDownloadAccess({
        productId: product.id,
        workspaceId: workspace.id,
        accessType: product.accessType,
        unlockedByDefault: product.unlockedByDefault,
      });
      if (!serverCheck.allowed) {
        void trackResourceEvent({
          productId: product.id,
          action: 'download_denied',
          workspaceId: workspace.id,
          audience: product.audience,
          category: product.category,
          accessType: product.accessType,
          title: product.title,
          format: file.fileFormat,
        });
        setError(serverCheck.reason || 'Access denied by server entitlement verification.');
        return;
      }

      await downloadProductStorageFile({
        storagePath: file.storagePath,
        fileName: file.fileName,
        isApprovedForClient: file.isApprovedForClient,
      });

      if (activeUid) {
        void recordResourceHistoryEntry({
          uid: activeUid,
          workspaceId: workspace.id,
          product,
          action: 'download',
          format: file.fileFormat,
        });
      }
      void trackResourceEvent({
        productId: product.id,
        action: 'download_success',
        workspaceId: workspace.id,
        audience: product.audience,
        category: product.category,
        accessType: product.accessType,
        title: product.title,
        format: file.fileFormat,
      });
      setDownloadNotice(`Downloaded "${file.label || file.fileName}" (${file.fileFormat}).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to download deliverable file.');
    } finally {
      setDownloadingFileId('');
    }
  };

  const handleStudioPackDownload = async (
    product: CreativeProduct,
    format: StudioExportFormat,
    variation?: ProductVariationOption,
  ) => {
    const canDownload = isClientEligibleForProductDownload({
      product,
      ...eligibilityBase,
    });
    const approvedFiles = canDownload ? getApprovedDownloadableFiles(product.files) : [];
    if (!canDownload || (approvedFiles.length === 0 && product.instantStudioPackEligible !== true)) {
      setError('This resource requires an eligible package or custom studio request before export.');
      return;
    }

    setStudioExportBusy(true);
    setError('');
    setDownloadNotice('');
    try {
      const serverCheck = await verifyResourceDownloadAccess({
        productId: product.id,
        workspaceId: workspace.id,
        accessType: product.accessType,
        unlockedByDefault: product.unlockedByDefault,
      });
      if (!serverCheck.allowed) {
        void trackResourceEvent({
          productId: product.id,
          action: 'download_denied',
          workspaceId: workspace.id,
          audience: product.audience,
          category: product.category,
          accessType: product.accessType,
          title: product.title,
          format,
        });
        setError(serverCheck.reason || 'Server entitlement verification denied this export.');
        return;
      }

      const slug = slugifyProductTitle(product.title);
      const linkedDesign = resolveTemplateDesignForProduct(product);
      const varSuffix = variation ? `-${slugifyProductTitle(variation.paletteMode || variation.label)}` : '';

      if (format === 'PDF') {
        const pdfBlob = generateStructuredDocumentPdfBlob(product, workspace.name);
        triggerLocalBlobDownload(pdfBlob, `${slug}${varSuffix}-studio-guide.pdf`);
      } else if (format === 'SVG') {
        const svgBlob = generateEditableProductSvgBlob(product, variation);
        triggerLocalBlobDownload(svgBlob, `${slug}${varSuffix}-editable-master.svg`);
      } else if (format === 'PNG') {
        if (linkedDesign) {
          const pngBlob = await renderCanvasDesignToRasterBlob(linkedDesign, 'png');
          triggerLocalBlobDownload(pngBlob, `${slug}${varSuffix}-master.png`);
        } else {
          const svgBlob = generateEditableProductSvgBlob(product, variation);
          const pngBlob = await svgBlobToPngBlob(svgBlob, 1200, 1200);
          triggerLocalBlobDownload(pngBlob, `${slug}${varSuffix}-master.png`);
        }
      } else {
        const zipBlob = await packageProductDeliverablesZip({
          product,
          designs: linkedDesign ? [linkedDesign] : [],
          includeDocumentPdf: true,
          workspaceLabel: workspace.name,
          variation,
        });
        triggerLocalBlobDownload(zipBlob, `${slug}${varSuffix}-studio-pack.zip`);
      }

      if (activeUid) {
        void recordResourceHistoryEntry({
          uid: activeUid,
          workspaceId: workspace.id,
          product,
          action: 'download',
          format,
          variation: variation?.label,
        });
      }
      void trackResourceEvent({
        productId: product.id,
        action: 'download_success',
        workspaceId: workspace.id,
        audience: product.audience,
        category: product.category,
        accessType: product.accessType,
        title: product.title,
        format,
      });

      setDownloadNotice(
        `Exported "${product.title}" (${format}${variation ? ` · ${variation.label}` : ''}).`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to package resource export.');
    } finally {
      setStudioExportBusy(false);
    }
  };

  const handleBatchZipExport = async (targetProducts: CreativeProduct[], archiveLabel: string) => {
    if (targetProducts.length === 0) return;
    setError('');
    setDownloadNotice('');
    setBatchZipProgress(`Preparing ${targetProducts.length} resource(s)…`);
    try {
      const designsByTemplateId: Record<string, CanvasDesign> = {};
      for (const p of targetProducts) {
        if (p.linkedTemplateId) {
          const d = resolveTemplateDesignForProduct(p);
          if (d) designsByTemplateId[p.linkedTemplateId] = d;
        }
      }

      const result = await packageMultipleProductsZip({
        products: targetProducts,
        eligibilityContext: eligibilityBase,
        workspaceLabel: workspace.name,
        designsByTemplateId,
        verifyServerAccess: async prod => {
          const check = await verifyResourceDownloadAccess({
            productId: prod.id,
            workspaceId: workspace.id,
            accessType: prod.accessType,
            unlockedByDefault: prod.unlockedByDefault,
          });
          if (!check.allowed) {
            void trackResourceEvent({
              productId: prod.id,
              action: 'download_denied',
              workspaceId: workspace.id,
              audience: prod.audience,
              category: prod.category,
              accessType: prod.accessType,
              title: prod.title,
              format: 'ZIP',
            });
          }
          return check;
        },
        fetchRemoteFile: async storagePath => await getBlob(ref(storage, storagePath)),
        onProgress: (done, total, title) => {
          setBatchZipProgress(`Bundling ${done}/${total}: ${title}`);
        },
      });

      const archiveSlug = slugifyProductTitle(archiveLabel || 'keedohub-collection');
      triggerLocalBlobDownload(result.blob, `${archiveSlug}-${workspace.id.slice(0, 6)}.zip`);

      for (const pid of result.includedProductIds) {
        const prod = targetProducts.find(item => item.id === pid);
        if (prod) {
          if (activeUid) {
            void recordResourceHistoryEntry({
              uid: activeUid,
              workspaceId: workspace.id,
              product: prod,
              action: 'download',
              format: 'ZIP',
            });
          }
          void trackResourceEvent({
            productId: prod.id,
            action: 'download_success',
            workspaceId: workspace.id,
            audience: prod.audience,
            category: prod.category,
            accessType: prod.accessType,
            title: prod.title,
            format: 'ZIP',
          });
        }
      }

      setSelectedBatchIds([]);
      setDownloadNotice(
        `Downloaded ZIP bundle containing ${result.includedProductIds.length} authorized resource(s).${
          result.skippedProductIds.length > 0
            ? ` ${result.skippedProductIds.length} restricted or unapproved item(s) were omitted.`
            : ''
        }`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create batch ZIP download.');
    } finally {
      setBatchZipProgress('');
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUid || !newCollectionName.trim()) return;
    setError('');
    try {
      const created = await createResourceCollection({
        uid: activeUid,
        workspaceId: workspace.id,
        name: newCollectionName,
        description: newCollectionDesc,
      });
      setNewCollectionName('');
      setNewCollectionDesc('');
      setQuickCollectionId(created.id);
      setDownloadNotice(`Created collection "${created.name}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create collection.');
    }
  };

  const handleQuickAddToCollection = async (product: CreativeProduct) => {
    if (!activeUid) return;
    setError('');
    try {
      let targetCol = collections.find(c => c.id === quickCollectionId);
      if (!targetCol && quickNewCollectionName.trim()) {
        targetCol = await createResourceCollection({
          uid: activeUid,
          workspaceId: workspace.id,
          name: quickNewCollectionName.trim(),
          initialProductIds: [product.id],
        });
        setQuickNewCollectionName('');
        setQuickCollectionId(targetCol.id);
        setDownloadNotice(`Created "${targetCol.name}" and added "${product.title}".`);
        return;
      }
      if (!targetCol) {
        setError('Create or select a collection first.');
        return;
      }
      await addProductToCollection({
        uid: activeUid,
        workspaceId: workspace.id,
        collectionItem: targetCol,
        product,
      });
      setDownloadNotice(`Added "${product.title}" to "${targetCol.name}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add resource to collection.');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="border border-red-900/60 bg-red-950/30 px-4 py-3 text-xs text-red-200 flex items-center justify-between gap-2">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="underline">Dismiss</button>
        </div>
      )}
      {downloadNotice && (
        <div role="status" className="border border-emerald-900/60 bg-emerald-950/20 px-4 py-3 text-xs text-emerald-200 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            <span>{downloadNotice}</span>
          </span>
          <button type="button" onClick={() => setDownloadNotice('')} className="underline text-emerald-300">
            Dismiss
          </button>
        </div>
      )}

      {/* Hub Summary Hero & Metrics */}
      <section className="border border-[#222222] bg-[#0C0C0C] p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">
              {experience.isArtist ? 'Artist Creative Ecosystem' : 'Brand Creative Ecosystem'}
            </p>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {experience.isArtist
                ? 'Streaming Visual Packs, Release Kits & Artist Press Systems'
                : 'Brand Identity Systems, Industry Packs & Executive Document Suites'}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl">
              {experience.isArtist
                ? 'Discover platform-ready packs, monthly creative drops, press & EPK templates, and shared production guides. Export instant ZIP/PDF/SVG kits, organize collections, or commission bespoke assets.'
                : 'Access Brand Identity kits, hospitality/retail/agency industry templates, executive Business Documents, monthly drops, and instant ZIP/PDF/SVG studio exports tailored to your workspace.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {experience.isArtist && (
              <button
                type="button"
                onClick={() => setShowStreamingMatrix(prev => !prev)}
                className="inline-flex items-center gap-1.5 border border-[#2E2E2E] bg-[#141414] px-3.5 py-2 text-xs font-medium text-neutral-200 hover:border-white"
              >
                <Ruler size={13} className="text-[#FF1E1E]" />
                <span>{showStreamingMatrix ? 'Hide Streaming Specs' : 'Streaming Dimensions'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigateSection('deliverables')}
              className="inline-flex items-center gap-1.5 border border-[#2E2E2E] bg-[#141414] px-3.5 py-2 text-xs font-medium text-neutral-200 hover:border-white"
            >
              <FolderCheck size={13} />
              <span>Project Deliverables</span>
            </button>
            <button
              type="button"
              onClick={() => onRequestProduction()}
              className="inline-flex items-center gap-1.5 bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-colors"
            >
              <Send size={13} />
              <span>Request Custom Service</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="border border-[#1E1E1E] bg-[#111111] p-3.5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Available Resources</p>
            <p className="mt-1.5 text-2xl font-black text-white font-mono tabular-nums">{eligibleProducts.length}</p>
          </div>
          <div className="border border-[#1E1E1E] bg-[#111111] p-3.5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Instant Downloads</p>
            <p className="mt-1.5 text-2xl font-black text-emerald-400 font-mono tabular-nums">{downloadableCount}</p>
          </div>
          <div className="border border-[#1E1E1E] bg-[#111111] p-3.5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Monthly Drops Active</p>
            <p className="mt-1.5 text-2xl font-black text-[#FF1E1E] font-mono tabular-nums">{currentDrops.length}</p>
          </div>
          <div className="border border-[#1E1E1E] bg-[#111111] p-3.5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Saved &amp; Collections</p>
            <p className="mt-1.5 text-2xl font-black text-white font-mono tabular-nums">
              {favourites.length} · {collections.length}
            </p>
          </div>
        </div>

        {/* Ecosystem Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Creative Hub Sections"
          className="flex flex-wrap items-center gap-2 border-t border-[#1A1A1A] pt-4"
        >
          {(
            [
              { id: 'explore', label: `Explore Catalog (${eligibleProducts.length})`, icon: Package },
              { id: 'drops', label: `Monthly Drops (${currentDrops.length + archivedDrops.length})`, icon: Calendar },
              { id: 'saved', label: `Saved & Collections (${favourites.length})`, icon: Bookmark },
              { id: 'history', label: `Recent History (${historyItems.length})`, icon: Clock },
            ] as const
          ).map(tab => {
            const Icon = tab.icon;
            const active = hubTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setHubTab(tab.id)}
                className={`inline-flex items-center gap-2 border px-3.5 py-2 text-xs font-mono transition-colors ${
                  active
                    ? 'border-[#FF1E1E] bg-[#FF1E1E] text-white font-semibold'
                    : 'border-[#252525] bg-[#111111] text-neutral-300 hover:border-white hover:text-white'
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ====================================================================
          TAB 1: EXPLORE CATALOG
         ==================================================================== */}
      {hubTab === 'explore' && (
        <>
          {/* Product Family Selector Cards */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">
                  Product Families &amp; Shared Utilities
                </p>
                <h3 className="text-sm font-bold text-white">Browse by Creative Collection</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveFamily('All')}
                  className={`border px-3 py-1 text-xs font-mono ${
                    activeFamily === 'All'
                      ? 'border-[#FF1E1E] bg-[#FF1E1E]/15 text-white'
                      : 'border-[#252525] bg-[#101010] text-neutral-400 hover:text-white'
                  }`}
                >
                  All Families ({eligibleProducts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFamily('__assigned__')}
                  className={`border px-3 py-1 text-xs font-mono ${
                    activeFamily === '__assigned__'
                      ? 'border-emerald-500/70 bg-emerald-950/30 text-emerald-200'
                      : 'border-[#252525] bg-[#101010] text-neutral-400 hover:text-white'
                  }`}
                >
                  Downloadable &amp; Assigned ({downloadableCount + assignedCount})
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {productFamilies.map((family, idx) => {
                const count = eligibleProducts.filter(p => resolveProductFamily(p) === family.label).length;
                const readyInFamily = eligibleProducts.filter(
                  p => resolveProductFamily(p) === family.label && canProductExportNow(p),
                ).length;
                const active = activeFamily === family.label;
                return (
                  <button
                    key={family.id}
                    type="button"
                    onClick={() => setActiveFamily(active ? 'All' : family.label)}
                    className={`text-left border p-4 transition-colors flex flex-col justify-between gap-2 ${
                      active
                        ? 'border-[#FF1E1E] bg-[#FF1E1E]/10'
                        : 'border-[#202020] bg-[#0C0C0C] hover:border-[#3A3A3A]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-[10px] font-mono uppercase">
                        <span className="text-[#FF1E1E]">0{idx + 1}</span>
                        <span className="text-neutral-400 tabular-nums">{count} packs</span>
                      </div>
                      <h4 className="text-sm font-bold text-white leading-snug">{family.label}</h4>
                      <p className="text-[11px] text-neutral-400 line-clamp-2">{family.description}</p>
                    </div>
                    <div className="pt-2 border-t border-[#1A1A1A] flex items-center justify-between text-[10px] font-mono">
                      <span className={readyInFamily > 0 ? 'text-emerald-400' : 'text-neutral-500'}>
                        {readyInFamily > 0 ? `${readyInFamily} ready now` : 'Specs & studio'}
                      </span>
                      <span className="text-neutral-400">{active ? 'Active' : 'Filter'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Artist Streaming Platform Dimension Guide */}
          {experience.isArtist &&
            (showStreamingMatrix || activeFamily === 'Streaming & Music Platform Assets') && (
              <section className="border border-[#242424] bg-[#0B0B0B] p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A1A1A] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">Streaming Platform Visual Specifications</h3>
                    <p className="text-xs text-neutral-500">
                      KeedoHub production specs across Spotify, Apple Music, YouTube Music, Audiomack &amp; Boomplay.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onRequestProduction({
                        title: `${workspace.name} — Multi-Platform Streaming Pack`,
                        category: 'Streaming Pack',
                        description:
                          'Full DSP visual suite formatted for Spotify, Apple Music, YouTube Music, Audiomack & Boomplay.',
                        targetPlatforms: [
                          'Spotify Canvas',
                          'Spotify Header',
                          'Apple Music',
                          'YouTube Music',
                          'Audiomack',
                          'Boomplay',
                        ],
                        requiredDeliverables: [
                          '3000×3000 Master Cover',
                          '1080×1920 Canvas/Reel',
                          'Wide Artist Headers',
                          'Milestone Cards',
                        ],
                        intendedUse: 'Multi-platform DSP release rollout',
                      })
                    }
                    className="text-xs font-semibold text-[#FF1E1E] hover:text-white inline-flex items-center gap-1"
                  >
                    <span>Request full streaming pack</span>
                    <ArrowUpRight size={13} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {STREAMING_PLATFORM_DIMENSIONS.map(spec => (
                    <div key={spec.platform} className="border border-[#1E1E1E] bg-[#111111] p-3 space-y-1">
                      <p className="text-xs font-bold text-white">{spec.platform}</p>
                      <p className="text-[11px] font-mono text-[#FF1E1E] tabular-nums">{spec.dimensions}</p>
                      <p className="text-[11px] text-neutral-400">
                        {spec.aspectRatio} · {spec.notes}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

          {/* Brand/Business Document Systems Callout */}
          {!experience.isArtist && (activeFamily === 'All' || activeFamily === 'Business Documents') && (
            <section className="border border-[#242424] bg-[#0B0B0B] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-white">
                  <FileText size={15} className="text-[#FF1E1E]" />
                  <h3 className="text-sm font-bold">Business Documents &amp; Executive Collateral</h3>
                </div>
                <p className="text-xs text-neutral-400">
                  Commission custom company profiles, commercial proposals, quotation &amp; invoice layouts, pitch decks, brochures, or client onboarding packs aligned with {workspace.name}.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigateSection('documents')}
                  className="border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-neutral-200 hover:border-white"
                >
                  Open Business Vault
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onRequestProduction({
                      title: `${workspace.name} — Business Document System`,
                      category: 'Business Cards',
                      description: `Requesting custom branded business documents (company profile, proposal layout, quotation/invoice suite, pitch deck, and onboarding packet) for ${workspace.name}.`,
                      intendedUse: 'Client proposals, sales collateral & executive presentations',
                      targetPlatforms: ['A4 / US Letter Print PDF', '16:9 Pitch Deck', 'Email PDF'],
                      requiredDeliverables: [
                        'Company Profile PDF',
                        'Proposal & Quotation Template',
                        'Invoice & Receipt Layout',
                        'Brochure / Pitch Deck',
                      ],
                      packagingSpec: 'PDF, SVG, ZIP',
                    })
                  }
                  className="bg-[#FF1E1E] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
                >
                  Request Document Suite
                </button>
              </div>
            </section>
          )}

          {/* Filters, Scope Switcher & Batch Toolbar */}
          <section className="space-y-3 border-t border-[#181818] pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    ['all', 'All Eligible'],
                    ['core', experience.isArtist ? 'Artist OS Packs' : 'Brand & Industry Packs'],
                    ['shared', 'Shared Utilities'],
                  ] as const
                ).map(([scopeId, label]) => (
                  <button
                    key={scopeId}
                    type="button"
                    onClick={() => setAudienceScope(scopeId)}
                    className={`border px-2.5 py-1 text-[11px] font-mono ${
                      audienceScope === scopeId
                        ? 'border-white bg-white text-black font-semibold'
                        : 'border-[#252525] bg-[#0F0F0F] text-neutral-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedBatchIds.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2 border border-[#FF1E1E]/60 bg-[#1A0808] px-3 py-1.5 text-xs">
                    <span className="font-mono text-white tabular-nums">
                      {selectedBatchIds.length} selected
                    </span>
                    <button
                      type="button"
                      disabled={Boolean(batchZipProgress)}
                      onClick={() => {
                        const batchProducts = filteredProducts.filter(p => selectedBatchIds.includes(p.id));
                        void handleBatchZipExport(batchProducts, 'keedohub-selected-resources');
                      }}
                      className="inline-flex items-center gap-1.5 bg-[#FF1E1E] px-3 py-1 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                    >
                      <FileArchive size={12} />
                      <span>{batchZipProgress || 'Download Selected ZIP'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedBatchIds([])}
                      className="border border-[#333] px-2 py-1 text-[11px] text-neutral-300 hover:text-white"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const readyIds = filteredProducts.filter(p => canProductExportNow(p)).map(p => p.id);
                      setSelectedBatchIds(readyIds.slice(0, 12));
                    }}
                    className="border border-[#2A2A2A] bg-[#121212] px-3 py-1.5 text-[11px] font-mono text-neutral-300 hover:border-white hover:text-white"
                  >
                    Select Ready Packs for Batch ZIP
                  </button>
                )}
              </div>
            </div>

            {availableSubcategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveSubcategory('All')}
                  className={`border px-2.5 py-1 text-[11px] font-mono ${
                    activeSubcategory === 'All'
                      ? 'border-white bg-white/10 text-white'
                      : 'border-[#232323] bg-[#0F0F0F] text-neutral-400 hover:text-white'
                  }`}
                >
                  All Focus Areas
                </button>
                {availableSubcategories.map(sub => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setActiveSubcategory(activeSubcategory === sub ? 'All' : sub)}
                    className={`border px-2.5 py-1 text-[11px] font-mono ${
                      activeSubcategory === sub
                        ? 'border-[#FF1E1E] bg-[#FF1E1E]/15 text-white'
                        : 'border-[#232323] bg-[#0F0F0F] text-neutral-400 hover:text-white'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder="Search packs, industries, specs…"
                  className="w-full border border-[#262626] bg-[#111111] pl-9 pr-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-[#FF1E1E] focus:outline-none"
                />
              </div>
              <select
                aria-label="Filter creative products by resource type"
                value={resourceTypeFilter}
                onChange={event =>
                  setResourceTypeFilter(event.target.value as 'All' | CreativeResourceType)
                }
                className="border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white"
              >
                <option value="All">All Resource Types</option>
                {RESOURCE_TYPE_OPTIONS.map(rt => (
                  <option key={rt} value={rt}>{rt}</option>
                ))}
              </select>
              <select
                aria-label="Filter creative products by access"
                value={accessFilter}
                onChange={event => setAccessFilter(event.target.value as AccessFilterMode)}
                className="border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white"
              >
                <option value="all">All Access Levels</option>
                <option value="downloadable">Download Ready (Files / Instant Pack)</option>
                <option value="package">Free &amp; Included in Package</option>
                <option value="assigned">Assigned to Your Workspace</option>
                <option value="request-only">Custom Production Request Only</option>
              </select>
              <select
                aria-label="Sort creative resources"
                value={sortMode}
                onChange={event => setSortMode(event.target.value as SortMode)}
                className="border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white"
              >
                <option value="featured">Sort: Featured &amp; Drops</option>
                <option value="newest">Sort: Recently Updated</option>
                <option value="title">Sort: Title (A–Z)</option>
              </select>
            </div>
          </section>

          {/* Product Catalog Grid */}
          {loading ? (
            <div className="border border-[#1E1E1E] bg-[#0C0C0C] p-12 text-center text-xs text-neutral-400">
              Loading Creative Hub catalog…
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="border border-dashed border-[#2C2C2C] bg-[#0C0C0C] p-10 text-center space-y-3">
              <Package size={26} className="mx-auto text-neutral-600" />
              <p className="text-sm font-semibold text-neutral-200">
                No published Creative Products match the current filter.
              </p>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                Switch Product Families or request any custom creative pack below — KeedoHub Studio will produce and publish files directly to your workspace.
              </p>
              <button
                type="button"
                onClick={() => {
                  setAudienceScope('all');
                  setActiveFamily('All');
                  setActiveSubcategory('All');
                  setResourceTypeFilter('All');
                  setAccessFilter('all');
                  setSearchQuery('');
                }}
                className="border border-[#333] bg-[#141414] px-3.5 py-2 text-xs text-white hover:border-[#FF1E1E]"
              >
                Reset Catalog Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map(product => {
                const family = resolveProductFamily(product);
                const accessSummary = getProductDownloadStatusSummary({
                  product,
                  ...eligibilityBase,
                });
                const approvedFiles = accessSummary.canDownload
                  ? getApprovedDownloadableFiles(product.files)
                  : [];
                const exportReady = canProductExportNow(product);
                const isFaved = favouriteIds.has(product.id);
                const isBatchChecked = selectedBatchIds.includes(product.id);
                const isNewDrop = newDropProductIds.has(product.id);
                const purchaseTerms = resolveProductPurchaseTerms(product);

                return (
                  <article
                    key={product.id}
                    className={`border bg-[#0C0C0C] flex flex-col hover:bg-[#141414] transition-colors overflow-hidden ${
                      isBatchChecked ? 'border-[#FF1E1E]' : 'border-[#1E1E1E]'
                    }`}
                  >
                    <div>
                      <div className="relative h-48 bg-[#121212] border-b border-[#1A1A1A] overflow-hidden">
                        {product.previewImageUrl ? (
                          <img
                            src={product.previewImageUrl}
                            alt={product.previewAlt || product.title}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-neutral-600">
                            <ImageIcon size={28} />
                          </div>
                        )}

                        {/* Top Overlays: Batch Checkbox, Drop Tag & Favourite Toggle */}
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {exportReady && (
                              <button
                                type="button"
                                aria-label={`Select ${product.title} for batch ZIP`}
                                onClick={() =>
                                  setSelectedBatchIds(prev =>
                                    isBatchChecked
                                      ? prev.filter(id => id !== product.id)
                                      : [...prev, product.id],
                                  )
                                }
                                className={`h-6 w-6 border flex items-center justify-center transition-colors ${
                                  isBatchChecked
                                    ? 'border-[#FF1E1E] bg-[#FF1E1E] text-white'
                                    : 'border-white/25 bg-black/75 text-neutral-300 hover:border-white'
                                }`}
                                title="Select for batch ZIP download"
                              >
                                {isBatchChecked && <Check size={12} />}
                              </button>
                            )}
                            {isNewDrop && (
                              <span className="bg-[#FF1E1E] px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-white">
                                New Drop
                              </span>
                            )}
                            {product.audience === 'Shared' && (
                              <span className="bg-black/80 border border-white/20 px-2 py-0.5 text-[10px] font-mono uppercase text-neutral-200">
                                Shared
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            aria-label={isFaved ? `Remove ${product.title} from favourites` : `Save ${product.title} to favourites`}
                            onClick={e => void handleToggleFavourite(product, e)}
                            className={`h-7 w-7 border flex items-center justify-center transition-colors ${
                              isFaved
                                ? 'border-[#FF1E1E] bg-[#FF1E1E] text-white'
                                : 'border-white/25 bg-black/75 text-neutral-300 hover:border-[#FF1E1E] hover:text-white'
                            }`}
                          >
                            <Heart size={13} className={isFaved ? 'fill-current' : ''} />
                          </button>
                        </div>

                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-4 py-2.5 flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-wider">
                          <span className="text-neutral-200 truncate">{family}</span>
                          <span
                            className={`shrink-0 ${
                              exportReady || accessSummary.state === 'purchased' || accessSummary.state === 'membership-unlocked'
                                ? 'text-emerald-400'
                                : accessSummary.state === 'workspace-assigned'
                                  ? 'text-white'
                                  : accessSummary.state === 'included-in-package' || accessSummary.state === 'purchasable'
                                    ? 'text-amber-300'
                                    : 'text-neutral-300'
                            }`}
                          >
                            {approvedFiles.length > 0
                              ? accessSummary.badgeLabel
                              : exportReady
                                ? accessSummary.isPurchased
                                  ? 'Purchased · Ready'
                                  : accessSummary.isMembershipUnlocked
                                    ? 'Membership · Ready'
                                    : 'Instant Studio Pack'
                                : purchaseTerms.purchasable
                                  ? formatSubscriptionMoney(purchaseTerms.amount, purchaseTerms.currency)
                                  : accessSummary.badgeLabel}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10px] font-mono uppercase tracking-wider text-[#FF1E1E] truncate">
                              {product.resourceType || product.category}
                              {product.industryTag ? ` · ${product.industryTag}` : ''}
                              {product.subcategory ? ` · ${product.subcategory}` : ''}
                            </p>
                            <h3 className="text-base font-bold text-white leading-snug">{product.title}</h3>
                          </div>
                          <span className="text-[10px] font-mono text-neutral-500 shrink-0 tabular-nums">{product.version}</span>
                        </div>
                        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                          {product.summary || product.description}
                        </p>
                        <p className="text-[11px] font-mono text-neutral-500">
                          Formats: {product.supportedFormats.join(' · ') || 'Custom'}
                        </p>
                        {product.deliverablesSummary.length > 0 && (
                          <ul className="pt-1 space-y-1 text-xs text-neutral-300">
                            {product.deliverablesSummary.slice(0, 3).map(item => (
                              <li key={item} className="truncate">
                                · {item}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto border-t border-[#181818] bg-[#090909] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => openProductDetail(product)}
                        className="border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs font-medium text-neutral-200 hover:border-white hover:text-white"
                      >
                        Preview &amp; Specs
                      </button>
                      <div className="flex flex-wrap items-center gap-2">
                        {exportReady && onOpenInStudio && (
                          <button
                            type="button"
                            onClick={() => launchProductInStudio(product)}
                            className="inline-flex items-center gap-1 border border-[#FF1E1E]/60 bg-[#1B0C0C] hover:bg-[#FF1E1E] px-2.5 py-1.5 text-xs font-semibold text-white transition-colors"
                          >
                            <Wand2 size={12} />
                            <span>Customize in Studio</span>
                          </button>
                        )}
                        {approvedFiles.length === 1 && (
                          <button
                            type="button"
                            disabled={downloadingFileId === approvedFiles[0].id}
                            onClick={() => void handleDownloadFile(product, approvedFiles[0])}
                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            <Download size={12} />
                            <span>{downloadingFileId === approvedFiles[0].id ? 'Downloading…' : 'Download'}</span>
                          </button>
                        )}
                        {approvedFiles.length > 1 && (
                          <button
                            type="button"
                            onClick={() => openProductDetail(product)}
                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            <Download size={12} />
                            <span>Files ({approvedFiles.length})</span>
                          </button>
                        )}
                        {approvedFiles.length === 0 && exportReady && (
                          <button
                            type="button"
                            onClick={() => openProductDetail(product)}
                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            <Download size={12} />
                            <span>Export Pack</span>
                          </button>
                        )}
                        {!exportReady && purchaseTerms.purchasable && (
                          <button
                            type="button"
                            onClick={() => setCheckoutTarget({ mode: 'one_time_product', product })}
                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white font-mono tabular-nums whitespace-nowrap"
                          >
                            <CreditCard size={12} />
                            <span>Buy {formatSubscriptionMoney(purchaseTerms.amount, purchaseTerms.currency)}</span>
                          </button>
                        )}
                        {!exportReady && product.accessType === 'IncludedInPackage' && (
                          <button
                            type="button"
                            onClick={() => onNavigateSection('billing')}
                            className="inline-flex items-center gap-1 border border-[#2E2E2E] bg-[#141414] hover:border-white px-2.5 py-1.5 text-xs font-semibold text-neutral-200 whitespace-nowrap"
                          >
                            <Sparkles size={12} className="text-amber-300" />
                            <span>Membership</span>
                          </button>
                        )}
                        {!exportReady && (
                          <button
                            type="button"
                            onClick={() =>
                              onRequestProduction(buildProductRequestPrefill({ product, workspaceName: workspace.name }))
                            }
                            className="inline-flex items-center gap-1 bg-[#FF1E1E] hover:bg-red-600 px-3 py-1.5 text-xs font-semibold text-white whitespace-nowrap"
                          >
                            <Send size={12} />
                            <span>Request Custom</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Additional Creative Services Grid */}
          <section className="border border-[#222222] bg-[#0C0C0C] p-5 sm:p-6 space-y-4">
            <div className="border-b border-[#1A1A1A] pb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">
                  Additional Creative Services
                </p>
                <h3 className="mt-1 text-base font-bold text-white">
                  {experience.isArtist ? 'Commission Artist Production Services' : 'Commission Brand & Business Creative Services'}
                </h3>
              </div>
              <span className="text-xs font-mono text-neutral-500">Routes directly to KeedoHub Admin HQ pipeline</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceOptions.map(service => (
                <div key={service.id} className="border border-[#1E1E1E] bg-[#111111] p-4 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                          {service.category} · Est. {service.turnaroundHint}
                        </p>
                        <h4 className="mt-1 text-sm font-bold text-white">{service.title}</h4>
                      </div>
                      <Layers size={15} className="text-[#FF1E1E] shrink-0" />
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">{service.subtitle}</p>
                    <div className="text-[11px] text-neutral-300 space-y-0.5 pt-1">
                      {service.deliverables.map(item => (
                        <p key={item}>· {item}</p>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-[#1A1A1A] pt-3">
                    <span className="text-[11px] font-mono text-neutral-500">
                      Formats: {service.defaultFormats.join(', ')}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onRequestProduction({
                          title: `${workspace.name} — ${service.title}`,
                          category: service.category,
                          description: `Commissioning "${service.title}" for ${workspace.name}.\n\n${service.subtitle}`,
                          requirements: `Included deliverables:\n- ${service.deliverables.join('\n- ')}`,
                          intendedUse: service.title,
                          requiredDeliverables: service.deliverables,
                          packagingSpec: service.defaultFormats.join(', '),
                        })
                      }
                      className="inline-flex items-center gap-1.5 bg-[#FF1E1E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
                    >
                      <Sparkles size={12} />
                      <span>Request</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ====================================================================
          TAB 2: MONTHLY DROPS & ARCHIVE
         ==================================================================== */}
      {hubTab === 'drops' && (
        <div className="space-y-6">
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">
                  Curated Monthly Drops
                </p>
                <h3 className="text-base font-bold text-white">Active Creative Collections</h3>
              </div>
              <span className="text-xs font-mono text-neutral-500">
                Published &amp; refreshed by KeedoHub Studio
              </span>
            </div>

            {currentDrops.length === 0 ? (
              <div className="border border-dashed border-[#2C2C2C] bg-[#0C0C0C] p-10 text-center space-y-2">
                <Calendar size={24} className="mx-auto text-neutral-600" />
                <p className="text-sm font-semibold text-neutral-200">No active monthly creative drops yet.</p>
                <p className="text-xs text-neutral-500">
                  Admin HQ publishes scheduled monthly drops here. Browse the full catalog anytime.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {currentDrops.map(drop => {
                  const dropProducts = drop.productIds
                    .map(pid => eligibleProductsMap.get(pid))
                    .filter((item): item is CreativeProduct => Boolean(item));
                  const readyDropProducts = dropProducts.filter(p => canProductExportNow(p));

                  return (
                    <div key={drop.id} className="border border-[#262626] bg-[#0C0C0C] overflow-hidden">
                      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
                        <div className="relative min-h-[200px] bg-[#121212] border-b lg:border-b-0 lg:border-r border-[#1F1F1F]">
                          {drop.heroImageUrl ? (
                            <img
                              src={drop.heroImageUrl}
                              alt={drop.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-neutral-600">
                              <Sparkles size={28} />
                            </div>
                          )}
                          <div className="absolute top-3 left-3 flex items-center gap-1.5">
                            <span className="bg-[#FF1E1E] px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase text-white">
                              {drop.monthKey} DROP
                            </span>
                            <span className="bg-black/80 border border-white/20 px-2 py-0.5 text-[10px] font-mono uppercase text-white">
                              {drop.accessLevel}
                            </span>
                          </div>
                        </div>

                        <div className="p-5 flex flex-col justify-between gap-4">
                          <div className="space-y-2">
                            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400">
                              {drop.audience} · Published {drop.publishDate?.slice(0, 10)}
                            </p>
                            <h4 className="text-lg font-bold text-white">{drop.title}</h4>
                            <p className="text-xs font-medium text-[#FF1E1E]">{drop.headline}</p>
                            <p className="text-xs text-neutral-400 leading-relaxed">{drop.description}</p>
                            {drop.highlightTags && drop.highlightTags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {drop.highlightTags.map(tag => (
                                  <span
                                    key={tag}
                                    className="border border-[#262626] bg-[#131313] px-2 py-0.5 text-[10px] font-mono text-neutral-300"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2 border-t border-[#1A1A1A] pt-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[11px] font-mono text-neutral-400">
                                {dropProducts.length} included resource(s) eligible for {workspace.name}
                              </span>
                              {readyDropProducts.length > 0 && (
                                <button
                                  type="button"
                                  disabled={Boolean(batchZipProgress)}
                                  onClick={() => void handleBatchZipExport(readyDropProducts, drop.title)}
                                  className="inline-flex items-center gap-1.5 bg-[#FF1E1E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                                >
                                  <FileArchive size={12} />
                                  <span>Download Drop Bundle ({readyDropProducts.length})</span>
                                </button>
                              )}
                            </div>

                            {dropProducts.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                {dropProducts.map(item => (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => openProductDetail(item)}
                                    className="text-left border border-[#222] bg-[#111] p-2.5 hover:border-[#FF1E1E] flex items-center justify-between gap-2"
                                  >
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                                      <p className="text-[10px] font-mono text-neutral-500 truncate">
                                        {item.resourceType || item.category}
                                      </p>
                                    </div>
                                    <ArrowUpRight size={13} className="text-[#FF1E1E] shrink-0" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {archivedDrops.length > 0 && (
            <section className="space-y-3 border-t border-[#1A1A1A] pt-5">
              <h3 className="text-sm font-bold text-neutral-300 font-mono uppercase tracking-wider">
                Previous Monthly Releases ({archivedDrops.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {archivedDrops.map(drop => (
                  <div key={drop.id} className="border border-[#1E1E1E] bg-[#0B0B0B] p-4 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase text-neutral-500">
                      <span>{drop.monthKey} · {drop.audience}</span>
                      <span>{drop.productIds.length} items</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{drop.title}</h4>
                    <p className="text-xs text-neutral-400">{drop.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ====================================================================
          TAB 3: SAVED & COLLECTIONS
         ==================================================================== */}
      {hubTab === 'saved' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-5">
          {/* Favourites Panel */}
          <section className="border border-[#202020] bg-[#0C0C0C] p-5 space-y-4">
            <div className="border-b border-[#1A1A1A] pb-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF1E1E]">Quick Library</p>
                <h3 className="text-sm font-bold text-white">Favourites ({favourites.length})</h3>
              </div>
              {favourites.length > 0 && (
                <button
                  type="button"
                  disabled={Boolean(batchZipProgress)}
                  onClick={() => {
                    const favProds = favourites
                      .map(f => eligibleProductsMap.get(f.productId))
                      .filter((p): p is CreativeProduct => Boolean(p))
                      .filter(p => canProductExportNow(p));
                    if (favProds.length === 0) {
                      setError('None of your favourited resources are currently unlocked for instant download.');
                      return;
                    }
                    void handleBatchZipExport(favProds, 'favourites-pack');
                  }}
                  className="inline-flex items-center gap-1.5 border border-[#333] bg-[#141414] px-2.5 py-1.5 text-[11px] font-mono text-white hover:border-[#FF1E1E]"
                >
                  <FileArchive size={12} />
                  <span>Download Favourites ZIP</span>
                </button>
              )}
            </div>

            {favourites.length === 0 ? (
              <p className="text-xs text-neutral-500 py-6 text-center">
                Click the heart icon on any Creative Resource to bookmark it here.
              </p>
            ) : (
              <div className="space-y-2.5">
                {favourites.map(fav => {
                  const prod = eligibleProductsMap.get(fav.productId);
                  return (
                    <div
                      key={fav.productId}
                      className="border border-[#1E1E1E] bg-[#111111] p-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {fav.previewImageUrlSnapshot && (
                          <img
                            src={fav.previewImageUrlSnapshot}
                            alt={fav.titleSnapshot || fav.productId}
                            className="h-11 w-11 object-cover border border-[#262626] shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {prod?.title || fav.titleSnapshot || fav.productId}
                          </p>
                          <p className="text-[10px] font-mono text-neutral-500 truncate">
                            {fav.categorySnapshot || prod?.category || fav.audience}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {prod && (
                          <button
                            type="button"
                            onClick={() => openProductDetail(prod)}
                            className="border border-[#2E2E2E] bg-[#161616] px-2.5 py-1 text-[11px] text-white hover:border-[#FF1E1E]"
                          >
                            Open
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            prod
                              ? void handleToggleFavourite(prod)
                              : activeUid &&
                                void toggleFavouriteResource({
                                  uid: activeUid,
                                  workspaceId: workspace.id,
                                  product: {
                                    id: fav.productId,
                                    title: fav.titleSnapshot || fav.productId,
                                    audience: fav.audience,
                                    category: fav.categorySnapshot || '',
                                    accessType: 'Free',
                                  } as CreativeProduct,
                                  currentlyFavourited: true,
                                })
                          }
                          className="border border-[#2E2E2E] p-1.5 text-neutral-400 hover:text-red-400"
                          aria-label="Remove favourite"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Collections Panel */}
          <section className="border border-[#202020] bg-[#0C0C0C] p-5 space-y-4">
            <div className="border-b border-[#1A1A1A] pb-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF1E1E]">Project Organization</p>
              <h3 className="text-sm font-bold text-white">Your Resource Collections ({collections.length})</h3>
            </div>

            <form onSubmit={e => void handleCreateCollection(e)} className="border border-[#1E1E1E] bg-[#111] p-3.5 space-y-2.5">
              <p className="text-[11px] font-mono uppercase text-neutral-400">Create New Collection</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  value={newCollectionName}
                  onChange={e => setNewCollectionName(e.target.value)}
                  placeholder="Collection name (e.g. Q4 EP Campaign)"
                  required
                  maxLength={80}
                  className="border border-[#2A2A2A] bg-[#0B0B0B] px-3 py-1.5 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
                />
                <input
                  value={newCollectionDesc}
                  onChange={e => setNewCollectionDesc(e.target.value)}
                  placeholder="Optional description or campaign note"
                  maxLength={200}
                  className="border border-[#2A2A2A] bg-[#0B0B0B] px-3 py-1.5 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 bg-[#FF1E1E] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
              >
                <FolderPlus size={12} />
                <span>Create Collection</span>
              </button>
            </form>

            {collections.length === 0 ? (
              <p className="text-xs text-neutral-500 py-4 text-center">
                No collections created yet. Group release kits, social packs, or business documents for one-click ZIP export.
              </p>
            ) : (
              <div className="space-y-3">
                {collections.map(col => {
                  const items = (col.productIds || [])
                    .map(pid => eligibleProductsMap.get(pid))
                    .filter((p): p is CreativeProduct => Boolean(p));

                  return (
                    <div key={col.id} className="border border-[#1F1F1F] bg-[#101010] p-4 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {editingCollectionId === col.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                value={editingCollectionName}
                                onChange={e => setEditingCollectionName(e.target.value)}
                                className="border border-[#FF1E1E] bg-[#0A0A0A] px-2.5 py-1 text-xs text-white"
                              />
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!activeUid || !editingCollectionName.trim()) return;
                                  await renameResourceCollection({
                                    uid: activeUid,
                                    collectionItem: col,
                                    name: editingCollectionName,
                                  });
                                  setEditingCollectionId(null);
                                }}
                                className="bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCollectionId(null)}
                                className="text-[11px] text-neutral-400"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <h4 className="text-sm font-bold text-white">{col.name}</h4>
                              {col.description && (
                                <p className="text-[11px] text-neutral-400 mt-0.5">{col.description}</p>
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {items.length > 0 && (
                            <button
                              type="button"
                              disabled={collectionZipBusyId === col.id}
                              onClick={async () => {
                                setCollectionZipBusyId(col.id);
                                await handleBatchZipExport(items, col.name);
                                setCollectionZipBusyId(null);
                              }}
                              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white"
                            >
                              <FileArchive size={11} />
                              <span>{collectionZipBusyId === col.id ? 'Bundling…' : `ZIP (${items.length})`}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCollectionId(col.id);
                              setEditingCollectionName(col.name);
                            }}
                            className="border border-[#2E2E2E] px-2 py-1 text-[11px] text-neutral-300 hover:text-white"
                          >
                            Rename
                          </button>
                          <button
                            type="button"
                            onClick={() => activeUid && void deleteResourceCollection(activeUid, col.id)}
                            className="border border-[#2E2E2E] p-1 text-neutral-400 hover:text-red-400"
                            aria-label={`Delete ${col.name}`}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {items.length === 0 ? (
                        <p className="text-[11px] text-neutral-500">
                          Empty collection — open any Creative Resource to add it here.
                        </p>
                      ) : (
                        <div className="space-y-1.5 border-t border-[#1A1A1A] pt-2.5">
                          {items.map(prod => (
                            <div
                              key={prod.id}
                              className="flex items-center justify-between gap-2 border border-[#1E1E1E] bg-[#0B0B0B] px-2.5 py-1.5 text-xs"
                            >
                              <button
                                type="button"
                                onClick={() => openProductDetail(prod)}
                                className="text-left text-neutral-200 hover:text-white truncate font-medium"
                              >
                                {prod.title}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  activeUid &&
                                  void removeProductFromCollection({
                                    uid: activeUid,
                                    collectionItem: col,
                                    productId: prod.id,
                                  })
                                }
                                className="text-[10px] font-mono text-neutral-500 hover:text-red-400 shrink-0"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ====================================================================
          TAB 4: RECENT ACCESS & DOWNLOAD HISTORY
         ==================================================================== */}
      {hubTab === 'history' && (
        <section className="border border-[#202020] bg-[#0C0C0C] p-5 space-y-4">
          <div className="border-b border-[#1A1A1A] pb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF1E1E]">Workspace Activity</p>
              <h3 className="text-sm font-bold text-white">Recent Views &amp; Downloads ({historyItems.length})</h3>
            </div>
          </div>

          {historyItems.length === 0 ? (
            <p className="text-xs text-neutral-500 py-8 text-center">
              Resources you preview or export will appear here for fast re-access.
            </p>
          ) : (
            <div className="divide-y divide-[#1A1A1A] border border-[#1A1A1A]">
              {historyItems.map(item => {
                const prod = eligibleProductsMap.get(item.productId);
                return (
                  <div
                    key={item.productId}
                    className="flex flex-wrap items-center justify-between gap-3 bg-[#0E0E0E] px-4 py-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.previewImageUrlSnapshot && (
                        <img
                          src={item.previewImageUrlSnapshot}
                          alt={item.titleSnapshot || item.productId}
                          className="h-10 w-10 object-cover border border-[#262626] shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">
                          {prod?.title || item.titleSnapshot || item.productId}
                        </p>
                        <p className="text-[10px] font-mono text-neutral-500 tabular-nums">
                          {item.lastAction.toUpperCase()}
                          {item.lastFormat ? ` · ${item.lastFormat}` : ''}
                          {item.lastVariation ? ` · ${item.lastVariation}` : ''}
                          {item.downloadCount > 0 ? ` · ${item.downloadCount} downloads` : ''}
                          {` · ${item.lastAccessedAt?.slice(0, 16).replace('T', ' ')}`}
                        </p>
                      </div>
                    </div>
                    {prod && (
                      <button
                        type="button"
                        onClick={() => openProductDetail(prod)}
                        className="border border-[#2E2E2E] bg-[#151515] px-3 py-1.5 text-xs text-white hover:border-[#FF1E1E]"
                      >
                        Open Resource
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ====================================================================
          PRODUCT DETAIL, MULTI-SLIDE GALLERY, COLLECTION & EXPORT MODAL
         ==================================================================== */}
      <Modal
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        maxWidth="xl"
        title={selectedProduct?.title || 'Creative Product Details'}
        subtitle={
          selectedProduct
            ? `${resolveProductFamily(selectedProduct)}${selectedProduct.resourceType ? ` · ${selectedProduct.resourceType}` : ''}${selectedProduct.subcategory ? ` · ${selectedProduct.subcategory}` : ''} · ${selectedProduct.version}`
            : undefined
        }
      >
        {selectedProduct && (() => {
          const accessSummary = getProductDownloadStatusSummary({
            product: selectedProduct,
            ...eligibilityBase,
          });
          const approvedFiles = accessSummary.canDownload
            ? getApprovedDownloadableFiles(selectedProduct.files)
            : [];
          const exportReady = canProductExportNow(selectedProduct);
          const gallery = resolveProductPreviewGallery(selectedProduct);
          const activeSlide = gallery[activeSlideIndex] || gallery[0];
          const variations =
            selectedProduct.variationOptions && selectedProduct.variationOptions.length > 0
              ? selectedProduct.variationOptions
              : DEFAULT_VARIATION_OPTIONS;
          const activeVariation =
            variations.find(v => v.id === selectedVariationId) || variations[0];
          const isFaved = favouriteIds.has(selectedProduct.id);

          return (
            <div className="space-y-5 text-xs">
              {/* Interactive Multi-Slide Preview Gallery */}
              {gallery.length > 0 && activeSlide && (
                <div className="space-y-2.5">
                  <div className="relative border border-[#222222] bg-[#101010] overflow-hidden">
                    <img
                      src={activeSlide.url}
                      alt={activeSlide.alt || selectedProduct.title}
                      referrerPolicy="no-referrer"
                      className="w-full max-h-80 object-contain bg-[#09090B]"
                    />
                    {activeSlide.caption && (
                      <div className="border-t border-[#1E1E1E] bg-[#0B0B0B] px-3.5 py-2 flex items-center justify-between gap-2 text-[11px] font-mono text-neutral-400">
                        <span>{activeSlide.caption}</span>
                        <span className="tabular-nums">
                          {activeSlideIndex + 1} / {gallery.length}
                        </span>
                      </div>
                    )}
                  </div>

                  {gallery.length > 1 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {gallery.map((slide, idx) => (
                        <button
                          key={`${slide.url.slice(0, 36)}-${idx}`}
                          type="button"
                          onClick={() => {
                            setActiveSlideIndex(idx);
                            if (activeUid && workspace.id) {
                              void trackResourceEvent({
                                productId: selectedProduct.id,
                                action: 'preview',
                                workspaceId: workspace.id,
                                audience: selectedProduct.audience,
                                category: selectedProduct.category,
                                accessType: selectedProduct.accessType,
                                title: selectedProduct.title,
                              });
                            }
                          }}
                          className={`border text-left overflow-hidden transition-colors ${
                            idx === activeSlideIndex
                              ? 'border-[#FF1E1E] bg-[#1A0808]'
                              : 'border-[#242424] bg-[#111] hover:border-white'
                          }`}
                        >
                          <img
                            src={slide.url}
                            alt={slide.alt}
                            className="h-14 w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Quick Bookmark & Collection Organizer */}
              <div className="border border-[#1E1E1E] bg-[#0F0F0F] p-3.5 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => void handleToggleFavourite(selectedProduct)}
                  className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium ${
                    isFaved
                      ? 'border-[#FF1E1E] bg-[#FF1E1E]/15 text-white'
                      : 'border-[#2E2E2E] bg-[#141414] text-neutral-300 hover:border-white'
                  }`}
                >
                  <Heart size={13} className={isFaved ? 'fill-[#FF1E1E] text-[#FF1E1E]' : ''} />
                  <span>{isFaved ? 'Saved in Favourites' : 'Save to Favourites'}</span>
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  {collections.length > 0 ? (
                    <select
                      aria-label="Choose collection"
                      value={quickCollectionId}
                      onChange={e => setQuickCollectionId(e.target.value)}
                      className="border border-[#2A2A2A] bg-[#141414] px-2.5 py-1.5 text-xs text-white"
                    >
                      {collections.map(col => (
                        <option key={col.id} value={col.id}>{col.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={quickNewCollectionName}
                      onChange={e => setQuickNewCollectionName(e.target.value)}
                      placeholder="New collection name…"
                      className="border border-[#2A2A2A] bg-[#141414] px-2.5 py-1.5 text-xs text-white w-44"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => void handleQuickAddToCollection(selectedProduct)}
                    className="inline-flex items-center gap-1 border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-white hover:border-[#FF1E1E]"
                  >
                    <Plus size={12} />
                    <span>Add to Collection</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border border-[#1E1E1E] bg-[#101010] p-3.5">
                <div>
                  <p className="text-[10px] font-mono uppercase text-neutral-500">Availability Status</p>
                  <p className="mt-0.5 font-semibold text-white">{accessSummary.badgeLabel}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase text-neutral-500">Formats</p>
                  <p className="mt-0.5 font-mono text-white">{selectedProduct.supportedFormats.join(', ') || 'Custom'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase text-neutral-500">Version</p>
                  <p className="mt-0.5 font-mono text-white tabular-nums">{selectedProduct.version}</p>
                </div>
              </div>

              <div className="border border-[#1E1E1E] bg-[#0D0D0D] px-3.5 py-2.5 text-neutral-300">
                {accessSummary.explanation}
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300">Overview</h4>
                <p className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">
                  {selectedProduct.description || selectedProduct.summary}
                </p>
              </div>

              {selectedProduct.deliverablesSummary.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300">Included Deliverables</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-neutral-300">
                    {selectedProduct.deliverablesSummary.map(item => (
                      <li key={item} className="border border-[#1E1E1E] bg-[#111111] px-3 py-2">
                        · {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedProduct.dimensionSpecs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300">Platform &amp; Print Dimensions</h4>
                  <div className="overflow-x-auto border border-[#1E1E1E]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#1E1E1E] bg-[#121212] text-[10px] font-mono uppercase text-neutral-400">
                          <th className="px-3 py-2">Platform / Placement</th>
                          <th className="px-3 py-2">Dimensions</th>
                          <th className="px-3 py-2">Aspect</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1A1A1A]">
                        {selectedProduct.dimensionSpecs.map((spec, idx) => (
                          <tr key={`${spec.platform}-${idx}`} className="bg-[#0B0B0B]">
                            <td className="px-3 py-2 font-medium text-white">{spec.platform}</td>
                            <td className="px-3 py-2 font-mono text-[#FF1E1E] tabular-nums">{spec.dimensions}</td>
                            <td className="px-3 py-2 text-neutral-400">{spec.aspectRatio}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Export & Deliverable Controls */}
              <div className="space-y-4 border-t border-[#1E1E1E] pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Client Export &amp; Approved Deliverables
                </h4>

                {!exportReady ? (
                  <div className="border border-[#262626] bg-[#121212] p-4 space-y-3 text-neutral-300">
                    <div className="flex items-start gap-2.5">
                      <Lock size={14} className="text-[#FF1E1E] shrink-0 mt-0.5" />
                      <p>
                        {resolveProductPurchaseTerms(selectedProduct).purchasable
                          ? `Unlock lifetime download & Studio customization rights for this resource via one-time purchase (${formatSubscriptionMoney(resolveProductPurchaseTerms(selectedProduct).amount, resolveProductPurchaseTerms(selectedProduct).currency)}) or an eligible Studio Membership.`
                          : selectedProduct.accessType === 'IncludedInPackage'
                            ? 'This Creative Product unlocks automatically with an active Creative Resource Membership or contracted Studio Package, or can be commissioned custom below.'
                            : 'This Creative Product is prepared custom for your workspace via production request. Use the button below to commission your customized version.'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {resolveProductPurchaseTerms(selectedProduct).purchasable && (
                        <button
                          type="button"
                          onClick={() => {
                            const prod = selectedProduct;
                            setSelectedProduct(null);
                            setCheckoutTarget({ mode: 'one_time_product', product: prod });
                          }}
                          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white font-mono tabular-nums"
                        >
                          <CreditCard size={13} />
                          <span>
                            Purchase Once ({formatSubscriptionMoney(
                              resolveProductPurchaseTerms(selectedProduct).amount,
                              resolveProductPurchaseTerms(selectedProduct).currency,
                            )})
                          </span>
                        </button>
                      )}
                      {selectedProduct.accessType === 'IncludedInPackage' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProduct(null);
                            onNavigateSection('billing');
                          }}
                          className="inline-flex items-center gap-1.5 border border-[#2E2E2E] bg-[#181818] hover:border-white px-3.5 py-2 text-xs font-semibold text-white"
                        >
                          <Sparkles size={13} className="text-amber-300" />
                          <span>Unlock via Membership</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Instant Studio Pack Format & Variation Selector */}
                    {selectedProduct.instantStudioPackEligible && (
                      <div className="border border-emerald-900/50 bg-[#0B120E] p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                              Instant Studio Export Ready
                            </p>
                            <p className="text-xs text-neutral-300">
                              Select variation palette &amp; export format (bundled PDF guides, editable SVG vectors, PNG artwork, or complete ZIP).
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {variations.map(variant => (
                            <button
                              key={variant.id}
                              type="button"
                              onClick={() => setSelectedVariationId(variant.id)}
                              className={`text-left border p-2.5 transition-colors ${
                                activeVariation?.id === variant.id
                                  ? 'border-[#FF1E1E] bg-[#1A0A0A] text-white'
                                  : 'border-[#262626] bg-[#111] text-neutral-400 hover:text-white'
                              }`}
                            >
                              <p className="font-semibold text-[11px]">{variant.label}</p>
                              <p className="text-[10px] font-mono text-neutral-500 mt-0.5">
                                {variant.paletteMode || variant.format}
                              </p>
                            </button>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <div className="flex flex-wrap gap-1.5">
                            {(['ZIP', 'PDF', 'SVG', 'PNG'] as const).map(fmt => (
                              <button
                                key={fmt}
                                type="button"
                                onClick={() => setSelectedExportFormat(fmt)}
                                className={`border px-3 py-1.5 text-[11px] font-mono ${
                                  selectedExportFormat === fmt
                                    ? 'border-white bg-white text-black font-bold'
                                    : 'border-[#2E2E2E] bg-[#141414] text-neutral-300 hover:border-white'
                                }`}
                              >
                                {fmt}
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            disabled={studioExportBusy}
                            onClick={() =>
                              void handleStudioPackDownload(
                                selectedProduct,
                                selectedExportFormat,
                                activeVariation,
                              )
                            }
                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            <Download size={13} />
                            <span>
                              {studioExportBusy
                                ? 'Generating Export…'
                                : `Download ${selectedExportFormat} Pack`}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Uploaded Approved Storage Files */}
                    {approvedFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                          Studio Storage Deliverables ({approvedFiles.length})
                        </p>
                        {approvedFiles.map(file => (
                          <div
                            key={file.id}
                            className="border border-[#222222] bg-[#111111] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate">{file.label || file.fileName}</p>
                              <p className="text-[11px] font-mono text-neutral-500 tabular-nums">
                                {file.fileFormat}
                                {file.dimensions ? ` · ${file.dimensions}` : ''}
                                {` · ${formatBytesCompact(file.fileSizeBytes)} · ${file.version}`}
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled={downloadingFileId === file.id}
                              onClick={() => void handleDownloadFile(selectedProduct, file)}
                              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              <Download size={12} />
                              <span>{downloadingFileId === file.id ? 'Downloading…' : 'Download'}</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#1E1E1E] pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="border border-[#333] bg-[#141414] px-4 py-2 text-xs text-neutral-300 hover:text-white"
                >
                  Close
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  {exportReady && onOpenInStudio && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedProduct;
                        setSelectedProduct(null);
                        launchProductInStudio(target);
                      }}
                      className="inline-flex items-center gap-1.5 border border-[#FF1E1E]/60 bg-[#1B0C0C] hover:bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white transition-colors"
                    >
                      <Wand2 size={13} />
                      <span>Customize in Studio</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const prefill = buildProductRequestPrefill({
                        product: selectedProduct,
                        workspaceName: workspace.name,
                      });
                      setSelectedProduct(null);
                      onRequestProduction(prefill);
                    }}
                    className="inline-flex items-center gap-1.5 bg-[#FF1E1E] hover:bg-red-600 px-4 py-2 text-xs font-semibold text-white"
                  >
                    <Send size={13} />
                    <span>Request Custom Version for {workspace.name}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      <CheckoutModal
        isOpen={Boolean(checkoutTarget)}
        target={checkoutTarget}
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        onClose={() => setCheckoutTarget(null)}
        onVerifiedSuccess={result => {
          setCheckoutTarget(null);
          setDownloadNotice(result.message || 'Purchase verified and unlocked in your workspace.');
        }}
      />
    </div>
  );
};

export default ClientCreativeHub;

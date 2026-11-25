import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  getDocFromServer,
  onSnapshot,
} from 'firebase/firestore';
import {
  Archive,
  BarChart3,
  Calendar,
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  FileArchive,
  FileCheck2,
  FolderPlus,
  Image as ImageIcon,
  Lock,
  Package,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { isAdminRecordActive } from '../../lib/firebaseAuth';
import { useApp } from '../../context/AppContext';
import type {
  CreativeDropAccessLevel,
  CreativeDropStatus,
  CreativeProduct,
  CreativeProductAccessType,
  CreativeProductAudience,
  CreativeProductDeliverableFile,
  CreativeProductSpecItem,
  CreativeProductStatus,
  CreativeResourceDrop,
  CreativeResourceType,
  ResourceAnalyticsEvent,
  ResourceAnalyticsSummary,
} from '../../types/creativeProduct';
import type { ServicePackage, Workspace } from '../../types';
import type { CanvasDesign } from '../../types/designStudio';
import {
  ALL_PRODUCT_CATEGORIES,
  ALL_PRODUCT_FAMILIES,
  ARTIST_PRODUCT_CATEGORIES,
  BRAND_BUSINESS_PRODUCT_CATEGORIES,
  getApprovedDownloadableFiles,
  resolveProductFamily,
  slugifyProductTitle,
  STREAMING_PLATFORM_DIMENSIONS,
} from '../../lib/creativeProductAccess';
import {
  deleteCreativeDropRecord,
  deleteCreativeProductRecord,
  deleteProductDeliverableStorageFile,
  downloadProductStorageFile,
  saveCreativeDrop,
  saveCreativeProduct,
  saveProductInternalSpec,
  updateCreativeDropStatus,
  updateCreativeProductStatus,
  uploadProductDeliverableFile,
  uploadProductPreviewBlob,
  uploadProductPreviewImage,
  validateProductForPublish,
} from '../../lib/creativeProducts';
import {
  generateEditableProductSvgBlob,
  generateStructuredDocumentPdfBlob,
  packageProductDeliverablesZip,
  renderCanvasDesignToRasterBlob,
  renderCanvasDesignToSvgBlob,
} from '../../lib/productPackager';
import {
  CREATIVE_PREVIEW_IMAGES,
  DEFAULT_VARIATION_OPTIONS,
} from '../../lib/creativeResourcePreviews';
import { CREATIVE_CATALOG_SEEDS, STARTER_CREATIVE_DROPS } from '../../data/creativeCatalogSeeds';
import { TEMPLATE_FAMILIES } from '../../data/templateFamiliesData';
import { MASTER_CREATIVE_TEMPLATES } from '../../data/creativeTemplatesData';
import { buildHonestDesignForTemplate } from '../../utils/templateDesignBuilder';
import { UNIFIED_PRODUCTION_CATEGORIES } from '../../lib/productionCategories';
import {
  classifyCreativeProductSegment,
  type CreativeProductsSegment,
} from '../../lib/adminHQNavigation';
import { DesignCanvasEditor } from '../studio/DesignCanvasEditor';
import artistShowcasePortrait from '../../assets/images/artist_showcase_portrait_1792791744296.jpg';

const AUDIENCES: CreativeProductAudience[] = ['Artist', 'Brand', 'Business', 'Brand & Business', 'Shared'];
const ACCESS_TYPES: { id: CreativeProductAccessType; label: string; hint: string }[] = [
  { id: 'Free', label: 'Free Studio Resource', hint: 'Available immediately for download by matching audience' },
  { id: 'IncludedInPackage', label: 'Included in Package', hint: 'Unlocked strictly for workspaces with an active linked service package (or explicit workspace assignment)' },
  { id: 'AdminAssigned', label: 'Admin Assigned Only', hint: 'Visible & downloadable only by explicitly selected client workspaces' },
  { id: 'RequestRequired', label: 'Request Required (Custom Studio)', hint: 'Clients browse specs & request customization into production pipeline' },
];
const FORMAT_OPTIONS = ['PNG', 'JPG', 'PDF', 'PSD', 'SVG', 'ZIP', 'MP4'] as const;
const RESOURCE_TYPES: CreativeResourceType[] = [
  'Template',
  'Document Suite',
  'Social Pack',
  'Press & EPK',
  'Brand Kit',
  'Mockup & Print',
  'Motion & Canvas',
  'Shared Utility',
];
type AdminProductWorkspaceTab = 'catalog' | 'drops' | 'analytics';

export interface AdminCreativeProductsProps {
  initialCanvasDraft?: CanvasDesign | null;
  onConsumeInitialCanvasDraft?: () => void;
  initialSegment?: CreativeProductsSegment;
  onSegmentChange?: (segment: CreativeProductsSegment) => void;
}

function buildBlankCanvasForProduct(product: CreativeProduct): CanvasDesign {
  const now = new Date().toISOString();
  const isVertical = product.dimensionSpecs.some(s => s.aspectRatio.includes('9:16'));
  const isWide = product.dimensionSpecs.some(s => s.aspectRatio.includes('16:9'));
  const aspectRatio = isVertical ? '9:16 Vertical Story' : isWide ? '16:9 Landscape' : '1:1 Square';
  const width = isVertical ? 1080 : isWide ? 1920 : 1200;
  const height = isVertical ? 1920 : isWide ? 1080 : 1200;

  return {
    id: `product-canvas-${product.id}-${Date.now()}`,
    workspaceId: product.assignedWorkspaceIds[0] || 'keedohub-studio',
    name: product.title || 'Creative Product Graphic',
    aspectRatio,
    width,
    height,
    backgroundColor: '#0A0A0A',
    backgroundTheme: 'charcoal',
    templateFamily: product.audience === 'Artist' ? 'Artist Branding' : 'Clean Commercial',
    category: product.category,
    textureOverlay: 'vignette',
    textureOpacity: 0.35,
    createdAt: now,
    updatedAt: now,
    elements: [
      {
        id: 'el-frame',
        type: 'shape',
        name: 'Outer Accent Frame',
        x: 50,
        y: 50,
        width: 90,
        height: 90,
        rotation: 0,
        opacity: 0.55,
        zIndex: 1,
        visible: true,
        shapeType: 'frame',
        borderColor: '#FF1E1E',
        borderWidth: 2,
      },
      {
        id: 'el-kicker',
        type: 'text',
        name: 'Product Category Label',
        x: 50,
        y: 20,
        rotation: 0,
        opacity: 0.9,
        zIndex: 2,
        visible: true,
        text: `${product.audience.toUpperCase()} · ${product.category.toUpperCase()}`,
        fontFamily: 'mono',
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 3,
        color: '#FF1E1E',
        textTransform: 'uppercase',
      },
      {
        id: 'el-headline',
        type: 'text',
        name: 'Main Title',
        x: 50,
        y: 48,
        rotation: 0,
        opacity: 1,
        zIndex: 3,
        visible: true,
        text: (product.title || 'KEEDOHUB STUDIO').toUpperCase(),
        fontFamily: product.audience === 'Artist' ? 'serif' : 'sans',
        fontSize: 44,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: 1,
        color: '#FFFFFF',
        textTransform: 'uppercase',
      },
      {
        id: 'el-sub',
        type: 'text',
        name: 'Subheadline',
        x: 50,
        y: 76,
        rotation: 0,
        opacity: 0.8,
        zIndex: 4,
        visible: true,
        text: product.subcategory || 'KEEDOHUB CREATIVE PRODUCT',
        fontFamily: 'mono',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 2,
        color: '#D4D4D4',
      },
    ],
  };
}

export const AdminCreativeProducts: React.FC<AdminCreativeProductsProps> = ({
  initialCanvasDraft,
  onConsumeInitialCanvasDraft,
  initialSegment = 'all',
  onSegmentChange,
}) => {
  const { firebaseUser, canAccessAdminCenter } = useApp();
  const [adminVerified, setAdminVerified] = useState<'checking' | 'ok' | 'denied'>(() =>
    firebaseUser && canAccessAdminCenter ? 'checking' : 'denied'
  );

  const [workspaceTab, setWorkspaceTab] = useState<AdminProductWorkspaceTab>('catalog');
  const [products, setProducts] = useState<CreativeProduct[]>([]);
  const [drops, setDrops] = useState<CreativeResourceDrop[]>([]);
  const [analyticsSummaries, setAnalyticsSummaries] = useState<ResourceAnalyticsSummary[]>([]);
  const [analyticsEvents, setAnalyticsEvents] = useState<ResourceAnalyticsEvent[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([]);
  const [savedDesigns, setSavedDesigns] = useState<CanvasDesign[]>([]);
  const [loading, setLoading] = useState(true);

  const [segmentFilter, setSegmentFilter] = useState<CreativeProductsSegment>(initialSegment);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | CreativeProductStatus>('All');
  const [audienceFilter, setAudienceFilter] = useState<'All' | CreativeProductAudience>('All');
  const [familyFilter, setFamilyFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    setSegmentFilter(initialSegment);
  }, [initialSegment]);

  const handleSelectSegment = (next: CreativeProductsSegment) => {
    setSegmentFilter(next);
    setAudienceFilter('All');
    onSegmentChange?.(next);
  };

  const [editingProduct, setEditingProduct] = useState<CreativeProduct | null>(null);
  const [isNewDraft, setIsNewDraft] = useState(false);
  const [internalNotes, setInternalNotes] = useState('');
  const [internalSourceFiles, setInternalSourceFiles] = useState<CreativeProductDeliverableFile[]>([]);
  const [deliverablesText, setDeliverablesText] = useState('');
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [newGalleryCaption, setNewGalleryCaption] = useState('');
  const [newSpec, setNewSpec] = useState<CreativeProductSpecItem>({
    platform: '',
    dimensions: '',
    aspectRatio: '',
    notes: '',
  });
  const [newDeliverableLabel, setNewDeliverableLabel] = useState('');
  const [newDeliverableDimensions, setNewDeliverableDimensions] = useState('');
  const [newDeliverableApproved, setNewDeliverableApproved] = useState(true);
  const [workspaceSearch, setWorkspaceSearch] = useState('');

  // Drops Editor state
  const [editingDrop, setEditingDrop] = useState<CreativeResourceDrop | null>(null);
  const [dropTagsText, setDropTagsText] = useState('');
  const [confirmDeleteDropId, setConfirmDeleteDropId] = useState<string | null>(null);
  const [hydrationProgress, setHydrationProgress] = useState('');

  const [previewProduct, setPreviewProduct] = useState<CreativeProduct | null>(null);
  const [activeCanvasSession, setActiveCanvasSession] = useState<{
    product: CreativeProduct;
    design: CanvasDesign;
  } | null>(null);

  const [showTemplatePackager, setShowTemplatePackager] = useState(false);
  const [packagerSourceTab, setPackagerSourceTab] = useState<'families' | 'master' | 'saved'>('families');
  const [packagerFilter, setPackagerFilter] = useState('All');
  const [selectedDesignIds, setSelectedDesignIds] = useState<string[]>([]);
  const [setFirstRenderAsPreview, setSetFirstRenderAsPreview] = useState(true);

  const [busy, setBusy] = useState(false);
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!firebaseUser || !canAccessAdminCenter) {
      setAdminVerified('denied');
      return;
    }
    getDocFromServer(doc(db, 'admins', firebaseUser.uid))
      .then(snap => {
        if (!active) return;
        setAdminVerified(isAdminRecordActive(snap) ? 'ok' : 'denied');
      })
      .catch(() => {
        if (active) setAdminVerified('denied');
      });
    return () => {
      active = false;
    };
  }, [firebaseUser, canAccessAdminCenter]);

  useEffect(() => {
    if (adminVerified !== 'ok') return;
    setLoading(true);
    const unsubProducts = onSnapshot(
      collection(db, 'creativeProducts'),
      snap => {
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as CreativeProduct))
          .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
        setProducts(list);
        setLoading(false);
      },
      err => {
        setError(err.message);
        setLoading(false);
      }
    );
    const unsubDrops = onSnapshot(
      collection(db, 'creativeDrops'),
      snap => {
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as CreativeResourceDrop))
          .sort((a, b) => (b.monthKey || '').localeCompare(a.monthKey || ''));
        setDrops(list);
      },
      err => console.warn('Drops listener warning:', err.message),
    );
    const unsubSummaries = onSnapshot(
      collection(db, 'resourceAnalyticsSummaries'),
      snap => {
        setAnalyticsSummaries(snap.docs.map(d => d.data() as ResourceAnalyticsSummary));
      },
      err => console.warn('Analytics summary listener warning:', err.message),
    );
    const unsubEvents = onSnapshot(
      collection(db, 'resourceAnalyticsEvents'),
      snap => {
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as ResourceAnalyticsEvent))
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setAnalyticsEvents(list);
      },
      err => console.warn('Analytics events listener warning:', err.message),
    );
    const unsubWorkspaces = onSnapshot(collection(db, 'workspaces'), snap => {
      setWorkspaces(snap.docs.map(d => ({ id: d.id, ...d.data() } as Workspace)));
    });
    const unsubServices = onSnapshot(collection(db, 'services'), snap => {
      setServicePackages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ServicePackage)));
    });
    const unsubDesigns = onSnapshot(collection(db, 'campaignDesigns'), snap => {
      setSavedDesigns(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() } as CanvasDesign))
          .filter(d => Array.isArray(d.elements) && d.elements.length > 0),
      );
    });
    return () => {
      unsubProducts();
      unsubDrops();
      unsubSummaries();
      unsubEvents();
      unsubWorkspaces();
      unsubServices();
      unsubDesigns();
    };
  }, [adminVerified]);

  const startNewProduct = (canvasOverride?: CanvasDesign) => {
    const uid = firebaseUser?.uid || '';
    const now = new Date().toISOString();
    const id = doc(collection(db, 'creativeProducts')).id;
    const defaultAudience: CreativeProductAudience = canvasOverride
      ? canvasOverride.templateFamily === 'Artist Branding'
        ? 'Artist'
        : 'Brand & Business'
      : segmentFilter === 'artist'
        ? 'Artist'
        : segmentFilter === 'shared'
          ? 'Shared'
          : 'Brand & Business';
    const base: CreativeProduct = {
      id,
      title: canvasOverride?.name || '',
      slug: slugifyProductTitle(canvasOverride?.name || id),
      audience: defaultAudience,
      productFamily:
        defaultAudience === 'Artist'
          ? 'Artist Branding & Press'
          : defaultAudience === 'Shared'
            ? 'Print & Merchandise'
            : 'Brand Identity',
      category:
        defaultAudience === 'Artist'
          ? ARTIST_PRODUCT_CATEGORIES[0]
          : BRAND_BUSINESS_PRODUCT_CATEGORIES[0],
      subcategory: canvasOverride?.category || 'Custom Studio Pack',
      summary: '',
      description: '',
      status: 'Draft',
      accessType: 'RequestRequired',
      assignedWorkspaceIds: [],
      includedPackageIds: [],
      linkedServiceCategory: UNIFIED_PRODUCTION_CATEGORIES[0],
      version: 'v1.0',
      supportedFormats: ['PNG', 'JPG', 'PDF'],
      deliverablesSummary: [],
      dimensionSpecs: canvasOverride
        ? [
            {
              platform: canvasOverride.aspectRatio,
              dimensions: `${canvasOverride.width} × ${canvasOverride.height} px`,
              aspectRatio: canvasOverride.aspectRatio,
            },
          ]
        : [],
      previewImageUrl: artistShowcasePortrait,
      previewAlt: 'Studio product preview',
      files: [],
      linkedCanvasDesignId: canvasOverride?.id || '',
      createdAt: now,
      updatedAt: now,
      createdBy: uid,
      updatedBy: uid,
    };
    setEditingProduct(base);
    setIsNewDraft(true);
    setDeliverablesText('');
    setInternalNotes('');
    setInternalSourceFiles([]);
    if (canvasOverride) {
      setActiveCanvasSession({ product: base, design: canvasOverride });
    }
  };

  useEffect(() => {
    if (adminVerified === 'ok' && initialCanvasDraft) {
      startNewProduct(initialCanvasDraft);
      onConsumeInitialCanvasDraft?.();
    }
  }, [adminVerified, initialCanvasDraft]);

  const openEditor = async (product: CreativeProduct) => {
    setError('');
    setNotice('');
    setConfirmDeleteProductId(null);
    setEditingProduct({
      ...product,
      assignedWorkspaceIds: product.assignedWorkspaceIds || [],
      includedPackageIds: product.includedPackageIds || [],
      supportedFormats: product.supportedFormats || ['PNG', 'PDF'],
      deliverablesSummary: product.deliverablesSummary || [],
      dimensionSpecs: product.dimensionSpecs || [],
      files: product.files || [],
    });
    setIsNewDraft(false);
    setDeliverablesText((product.deliverablesSummary || []).join('\n'));
    setInternalNotes('');
    setInternalSourceFiles([]);
    try {
      const specSnap = await getDocFromServer(doc(db, 'creativeProducts', product.id, 'internalSpecs', 'master'));
      if (specSnap.exists()) {
        const data = specSnap.data();
        setInternalNotes(data.productionNotes || '');
        setInternalSourceFiles(Array.isArray(data.sourceFiles) ? data.sourceFiles : []);
      }
    } catch {
      // ignore if not created yet
    }
  };

  const seedStarterCatalog = async () => {
    if (!firebaseUser) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const existingIds = new Set(products.map(p => p.id));
      let added = 0;
      for (const seed of CREATIVE_CATALOG_SEEDS) {
        if (existingIds.has(seed.id)) continue;
        await saveCreativeProduct({
          ...seed,
          createdBy: firebaseUser.uid,
          updatedBy: firebaseUser.uid,
        });
        added += 1;
      }
      setNotice(
        added > 0
          ? `Seeded ${added} starter Creative Product(s) for Artist, Brand & Business Creative Hubs.`
          : 'All starter Creative Products are already present in the catalog.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const hydrateAllSeedStudioPacks = async () => {
    if (!firebaseUser) return;
    const targets = products.filter(
      p => p.instantStudioPackEligible === true && getApprovedDownloadableFiles(p.files).length === 0,
    );
    if (targets.length === 0) {
      setNotice('All eligible Studio Pack products already have approved Storage deliverable bundles.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    let hydrated = 0;
    try {
      for (let i = 0; i < targets.length; i++) {
        const product = targets[i];
        setHydrationProgress(`Hydrating ${i + 1}/${targets.length}: ${product.title}`);
        const slug = slugifyProductTitle(product.title);
        const resolvedDesign = resolveLinkedTemplateDesign(product.linkedTemplateId);
        const linkedDesigns = resolvedDesign ? [resolvedDesign] : [];

        const pdfBlob = generateStructuredDocumentPdfBlob(product, 'KeedoHub Studio');
        const svgBlob = generateEditableProductSvgBlob(product);
        const zipBlob = await packageProductDeliverablesZip({
          product,
          designs: linkedDesigns,
          includeDocumentPdf: true,
        });

        const [pdfRec, svgRec, zipRec] = await Promise.all([
          uploadProductDeliverableFile({
            productId: product.id,
            file: pdfBlob,
            fileName: `${slug}-studio-pack.pdf`,
            label: `${product.title} — Master Guide PDF`,
            dimensions: product.dimensionSpecs[0]?.dimensions || 'A4 / Digital PDF',
            version: product.version || 'v1.0',
            isApprovedForClient: true,
            isInternalSource: false,
            uploadedBy: firebaseUser.uid,
          }),
          uploadProductDeliverableFile({
            productId: product.id,
            file: svgBlob,
            fileName: `${slug}-editable-master.svg`,
            label: `${product.title} — Editable Vector (SVG)`,
            dimensions: product.dimensionSpecs[0]?.dimensions || 'Scalable Vector',
            version: product.version || 'v1.0',
            isApprovedForClient: true,
            isInternalSource: false,
            uploadedBy: firebaseUser.uid,
          }),
          uploadProductDeliverableFile({
            productId: product.id,
            file: zipBlob,
            fileName: `${slug}-complete-bundle.zip`,
            label: `${product.title} — Complete Studio Bundle (ZIP)`,
            dimensions: 'PDF + SVG + Spec Sheet',
            version: product.version || 'v1.0',
            isApprovedForClient: true,
            isInternalSource: false,
            uploadedBy: firebaseUser.uid,
          }),
        ]);

        await saveCreativeProduct({
          ...product,
          files: [zipRec, pdfRec, svgRec, ...(product.files || [])],
          supportedFormats: Array.from(new Set([...(product.supportedFormats || []), 'PDF', 'SVG', 'ZIP'])),
          updatedBy: firebaseUser.uid,
        });
        hydrated += 1;
      }
      setNotice(`Hydrated real PDF, SVG & ZIP deliverables into Storage for ${hydrated} Creative Product(s).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setHydrationProgress('');
      setBusy(false);
    }
  };

  const seedStarterDrops = async () => {
    if (!firebaseUser) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const existingIds = new Set(drops.map(d => d.id));
      let added = 0;
      for (const dropSeed of STARTER_CREATIVE_DROPS) {
        if (existingIds.has(dropSeed.id)) continue;
        await saveCreativeDrop({
          ...dropSeed,
          createdByUid: firebaseUser.uid,
        });
        added += 1;
      }
      setNotice(
        added > 0
          ? `Seeded ${added} starter Monthly Creative Drop(s).`
          : 'All starter Monthly Creative Drops are already present.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const startNewDrop = () => {
    const id = doc(collection(db, 'creativeDrops')).id;
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const draft: CreativeResourceDrop = {
      id,
      title: '',
      slug: id,
      monthKey,
      headline: '',
      description: '',
      audience: 'Artist',
      accessLevel: 'Free',
      status: 'Draft',
      heroImageUrl: CREATIVE_PREVIEW_IMAGES.monthlyDropHeroImg,
      productIds: [],
      highlightTags: [],
      publishDate: now.toISOString(),
      createdByUid: firebaseUser?.uid || '',
    };
    setEditingDrop(draft);
    setDropTagsText('');
    setConfirmDeleteDropId(null);
  };

  const handleSaveDrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDrop || !firebaseUser) return;
    if (!editingDrop.title.trim()) {
      setError('Drop title is required.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const saved = await saveCreativeDrop({
        ...editingDrop,
        title: editingDrop.title.trim(),
        slug: slugifyProductTitle(editingDrop.slug || editingDrop.title),
        highlightTags: dropTagsText
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        createdByUid: editingDrop.createdByUid || firebaseUser.uid,
      });
      setEditingDrop(null);
      setNotice(`Saved Monthly Drop "${saved.title}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveProduct = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!editingProduct || !firebaseUser) return;
    if (!editingProduct.title.trim()) {
      setError('Enter a product title before saving.');
      return;
    }
    if (
      editingProduct.accessType === 'IncludedInPackage' &&
      editingProduct.status === 'Published' &&
      (editingProduct.includedPackageIds || []).length === 0 &&
      editingProduct.assignedWorkspaceIds.length === 0
    ) {
      setError(
        'Select at least one Linked Service Package (or assign a workspace) before publishing an Included in Package product. For open audience access, choose Free Studio Resource.',
      );
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const saved = await saveCreativeProduct({
        ...editingProduct,
        title: editingProduct.title.trim(),
        slug: slugifyProductTitle(editingProduct.slug || editingProduct.title),
        deliverablesSummary: deliverablesText
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean)
          .slice(0, 30),
        updatedBy: firebaseUser.uid,
        createdBy: editingProduct.createdBy || firebaseUser.uid,
      });
      await saveProductInternalSpec({
        productId: saved.id,
        productionNotes: internalNotes,
        sourceFiles: internalSourceFiles,
        updatedBy: firebaseUser.uid,
      });
      setEditingProduct(saved);
      setIsNewDraft(false);
      setNotice(`Saved Creative Product "${saved.title}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handlePreviewUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !editingProduct) return;
    setBusy(true);
    setError('');
    try {
      const uploaded = await uploadProductPreviewImage({ productId: editingProduct.id, file });
      const next = {
        ...editingProduct,
        previewImageUrl: uploaded.previewImageUrl,
        previewStoragePath: uploaded.previewStoragePath,
      };
      setEditingProduct(next);
      if (!isNewDraft) {
        await saveCreativeProduct({
          ...next,
          deliverablesSummary: deliverablesText.split('\n').map(s => s.trim()).filter(Boolean),
          updatedBy: firebaseUser?.uid || '',
        });
      }
      setNotice('Uploaded product preview image.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDeliverableUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    internalOnly: boolean,
  ) => {
    const fileList = Array.from(event.target.files || []);
    event.target.value = '';
    if (fileList.length === 0 || !editingProduct || !firebaseUser) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const uploadedRecords: CreativeProductDeliverableFile[] = [];
      for (const file of fileList) {
        const rec = await uploadProductDeliverableFile({
          productId: editingProduct.id,
          file,
          fileName: file.name,
          label: fileList.length === 1 && newDeliverableLabel.trim() ? newDeliverableLabel.trim() : file.name,
          dimensions: newDeliverableDimensions,
          version: editingProduct.version || 'v1.0',
          isApprovedForClient: internalOnly ? false : newDeliverableApproved,
          isInternalSource: internalOnly,
          uploadedBy: firebaseUser.uid,
        });
        uploadedRecords.push(rec);
      }

      if (internalOnly) {
        const nextSources = [...uploadedRecords, ...internalSourceFiles];
        setInternalSourceFiles(nextSources);
        await saveProductInternalSpec({
          productId: editingProduct.id,
          productionNotes: internalNotes,
          sourceFiles: nextSources,
          updatedBy: firebaseUser.uid,
        });
        setNotice(`Uploaded ${uploadedRecords.length} internal source file(s) (admin-only).`);
      } else {
        const nextFiles = [...uploadedRecords, ...editingProduct.files];
        const formats = new Set(editingProduct.supportedFormats);
        uploadedRecords.forEach(item => formats.add(item.fileFormat));
        const nextProduct: CreativeProduct = {
          ...editingProduct,
          files: nextFiles,
          supportedFormats: Array.from(formats),
        };
        setEditingProduct(nextProduct);
        if (nextProduct.title.trim()) {
          const saved = await saveCreativeProduct({
            ...nextProduct,
            deliverablesSummary: deliverablesText.split('\n').map(s => s.trim()).filter(Boolean),
            updatedBy: firebaseUser.uid,
          });
          setEditingProduct(saved);
          setIsNewDraft(false);
        }
        setNewDeliverableLabel('');
        setNotice(`Uploaded ${uploadedRecords.length} deliverable file(s) to product storage.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleFileApproval = async (fileId: string) => {
    if (!editingProduct || !firebaseUser) return;
    const nextFiles = editingProduct.files.map(file =>
      file.id === fileId ? { ...file, isApprovedForClient: !file.isApprovedForClient } : file
    );
    const next = { ...editingProduct, files: nextFiles };
    setEditingProduct(next);
    if (!isNewDraft) {
      await saveCreativeProduct({
        ...next,
        deliverablesSummary: deliverablesText.split('\n').map(s => s.trim()).filter(Boolean),
        updatedBy: firebaseUser.uid,
      });
    }
  };

  const removeProductFile = async (file: CreativeProductDeliverableFile, internalOnly: boolean) => {
    if (!editingProduct || !firebaseUser) return;
    setBusy(true);
    try {
      await deleteProductDeliverableStorageFile(file.storagePath);
      if (internalOnly) {
        const nextSources = internalSourceFiles.filter(f => f.id !== file.id);
        setInternalSourceFiles(nextSources);
        await saveProductInternalSpec({
          productId: editingProduct.id,
          productionNotes: internalNotes,
          sourceFiles: nextSources,
          updatedBy: firebaseUser.uid,
        });
      } else {
        const next = {
          ...editingProduct,
          files: editingProduct.files.filter(f => f.id !== file.id),
        };
        setEditingProduct(next);
        if (!isNewDraft) {
          await saveCreativeProduct({
            ...next,
            deliverablesSummary: deliverablesText.split('\n').map(s => s.trim()).filter(Boolean),
            updatedBy: firebaseUser.uid,
          });
        }
      }
      setNotice(`Removed file "${file.fileName}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const resolveLinkedTemplateDesign = (linkedId?: string): CanvasDesign | null => {
    if (!linkedId) return null;
    const tpl = MASTER_CREATIVE_TEMPLATES.find(t => t.id === linkedId);
    if (tpl) return buildHonestDesignForTemplate(tpl);
    const fam = TEMPLATE_FAMILIES.find(f => f.id === linkedId);
    if (fam) return fam.design;
    return null;
  };

  const handleToggleProductStatus = async (product: CreativeProduct) => {
    if (!firebaseUser) return;
    const nextStatus: CreativeProductStatus = product.status === 'Published' ? 'Draft' : 'Published';
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await updateCreativeProductStatus(product.id, nextStatus, firebaseUser.uid);
      setNotice(`"${product.title}" marked ${nextStatus}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const openCanvasForProduct = async (product: CreativeProduct) => {
    setError('');
    let initialDesign = buildBlankCanvasForProduct(product);
    try {
      const specSnap = await getDocFromServer(doc(db, 'creativeProducts', product.id, 'internalSpecs', 'master'));
      if (specSnap.exists() && specSnap.data()?.internalCanvasDesignJson) {
        const parsed = JSON.parse(specSnap.data().internalCanvasDesignJson);
        if (parsed && parsed.elements) initialDesign = parsed;
      } else {
        const resolved = resolveLinkedTemplateDesign(product.linkedTemplateId);
        if (resolved) initialDesign = resolved;
      }
    } catch {
      const resolved = resolveLinkedTemplateDesign(product.linkedTemplateId);
      if (resolved) initialDesign = resolved;
    }
    setActiveCanvasSession({ product, design: initialDesign });
  };

  const handleGenerateStudioDocumentPack = async (product: CreativeProduct) => {
    if (!firebaseUser) return;
    if (!product.title.trim()) {
      setError('Enter a product title before generating deliverables.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const slug = slugifyProductTitle(product.title);
      const resolvedDesign = resolveLinkedTemplateDesign(product.linkedTemplateId);
      const linkedDesigns = resolvedDesign ? [resolvedDesign] : [];

      const pdfBlob = generateStructuredDocumentPdfBlob(product, 'KeedoHub Studio');
      const svgBlob = generateEditableProductSvgBlob(product);
      const zipBlob = await packageProductDeliverablesZip({
        product,
        designs: linkedDesigns,
        includeDocumentPdf: true,
      });

      const pdfRec = await uploadProductDeliverableFile({
        productId: product.id,
        file: pdfBlob,
        fileName: `${slug}-studio-pack.pdf`,
        label: `${product.title} — Master Guide & Print PDF`,
        dimensions: product.dimensionSpecs[0]?.dimensions || 'A4 / 16:9 PDF',
        version: product.version || 'v1.0',
        isApprovedForClient: newDeliverableApproved,
        isInternalSource: false,
        uploadedBy: firebaseUser.uid,
      });

      const svgRec = await uploadProductDeliverableFile({
        productId: product.id,
        file: svgBlob,
        fileName: `${slug}-editable-master.svg`,
        label: `${product.title} — Editable Vector Artboard (SVG)`,
        dimensions: product.dimensionSpecs[0]?.dimensions || 'Scalable Vector',
        version: product.version || 'v1.0',
        isApprovedForClient: newDeliverableApproved,
        isInternalSource: false,
        uploadedBy: firebaseUser.uid,
      });

      const zipRec = await uploadProductDeliverableFile({
        productId: product.id,
        file: zipBlob,
        fileName: `${slug}-complete-bundle.zip`,
        label: `${product.title} — Complete Studio Bundle (ZIP)`,
        dimensions: 'PDF + Editable SVG + Spec Sheet',
        version: product.version || 'v1.0',
        isApprovedForClient: newDeliverableApproved,
        isInternalSource: false,
        uploadedBy: firebaseUser.uid,
      });

      const nextFormats = Array.from(new Set([...(product.supportedFormats || []), 'PDF', 'SVG', 'ZIP']));
      const nextProduct: CreativeProduct = {
        ...product,
        files: [zipRec, pdfRec, svgRec, ...(product.files || [])],
        supportedFormats: nextFormats,
      };
      const saved = await saveCreativeProduct({
        ...nextProduct,
        deliverablesSummary: deliverablesText
          ? deliverablesText.split('\n').map(s => s.trim()).filter(Boolean)
          : product.deliverablesSummary,
        updatedBy: firebaseUser.uid,
      });
      setEditingProduct(saved);
      setIsNewDraft(false);
      setNotice(
        `Generated & attached real Studio Pack deliverables (PDF, Editable SVG & ZIP) to "${saved.title}".`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const packagerDesignsList = useMemo(() => {
    const q = packagerFilter.trim().toLowerCase();
    if (packagerSourceTab === 'families') {
      return TEMPLATE_FAMILIES.filter(item =>
        !q || q === 'all' || item.familyName.toLowerCase().includes(q) || item.title.toLowerCase().includes(q),
      ).map(item => ({
        id: item.id,
        title: item.title,
        subtitle: `${item.familyName} · ${item.aspectRatio}`,
        design: item.design,
      }));
    }
    if (packagerSourceTab === 'master') {
      return MASTER_CREATIVE_TEMPLATES.filter(item =>
        !q || q === 'all' || item.category.toLowerCase().includes(q) || item.title.toLowerCase().includes(q),
      ).map(item => ({
        id: item.id,
        title: item.title,
        subtitle: `${item.category} · ${item.aspectRatio}`,
        design: buildHonestDesignForTemplate(item),
      }));
    }
    return savedDesigns
      .filter(d => !q || q === 'all' || (d.name || '').toLowerCase().includes(q) || (d.category || '').toLowerCase().includes(q))
      .map(d => ({
        id: d.id,
        title: d.name || 'Saved Canvas Composition',
        subtitle: `${d.category || 'Workspace Design'} · ${d.aspectRatio}`,
        design: d,
      }));
  }, [packagerSourceTab, packagerFilter, savedDesigns]);

  const handleAttachSelectedTemplates = async (mode: 'individual' | 'zip') => {
    if (!editingProduct || !firebaseUser) return;
    if (!editingProduct.title.trim()) {
      setError('Enter a product title before packaging template deliverables.');
      return;
    }
    const chosen = packagerDesignsList.filter(entry => selectedDesignIds.includes(entry.id));
    if (chosen.length === 0) {
      setError('Select at least one template design first.');
      return;
    }

    setBusy(true);
    setError('');
    setNotice('');
    try {
      const uploadedFiles: CreativeProductDeliverableFile[] = [];
      let updatedPreviewUrl = editingProduct.previewImageUrl;
      let updatedPreviewPath = editingProduct.previewStoragePath;

      if (mode === 'zip') {
        const designs = chosen.map(c => c.design);
        const zipBlob = await packageProductDeliverablesZip({
          product: editingProduct,
          designs,
          includeDocumentPdf: true,
        });
        const zipSlug = slugifyProductTitle(editingProduct.title);
        const zipRec = await uploadProductDeliverableFile({
          productId: editingProduct.id,
          file: zipBlob,
          fileName: `${zipSlug}-template-pack.zip`,
          label: `${editingProduct.title} — ${chosen.length}-Template Bundle (PNG + SVG + PDF)`,
          dimensions: `${chosen.length} Layouts Bundled`,
          version: editingProduct.version || 'v1.0',
          isApprovedForClient: newDeliverableApproved,
          isInternalSource: false,
          uploadedBy: firebaseUser.uid,
        });
        uploadedFiles.push(zipRec);

        if (setFirstRenderAsPreview) {
          const thumbBlob = await renderCanvasDesignToRasterBlob(chosen[0].design, 'png');
          const thumb = await uploadProductPreviewBlob({
            productId: editingProduct.id,
            blob: thumbBlob,
            fileName: `${zipSlug}-preview.png`,
          });
          updatedPreviewUrl = thumb.previewImageUrl;
          updatedPreviewPath = thumb.previewStoragePath;
        }
      } else {
        for (let i = 0; i < chosen.length; i++) {
          const item = chosen[i];
          const slug = slugifyProductTitle(item.title);
          const pngBlob = await renderCanvasDesignToRasterBlob(item.design, 'png');
          const svgBlob = renderCanvasDesignToSvgBlob(item.design);

          if (i === 0 && setFirstRenderAsPreview) {
            const thumb = await uploadProductPreviewBlob({
              productId: editingProduct.id,
              blob: pngBlob,
              fileName: `${slug}-preview.png`,
            });
            updatedPreviewUrl = thumb.previewImageUrl;
            updatedPreviewPath = thumb.previewStoragePath;
          }

          const pngRec = await uploadProductDeliverableFile({
            productId: editingProduct.id,
            file: pngBlob,
            fileName: `${slug}-${item.design.width}x${item.design.height}.png`,
            label: `${item.title} (High-Res PNG)`,
            dimensions: `${item.design.width} × ${item.design.height} px`,
            version: editingProduct.version || 'v1.0',
            isApprovedForClient: newDeliverableApproved,
            isInternalSource: false,
            uploadedBy: firebaseUser.uid,
          });
          const svgRec = await uploadProductDeliverableFile({
            productId: editingProduct.id,
            file: svgBlob,
            fileName: `${slug}-vector.svg`,
            label: `${item.title} (Editable Vector SVG)`,
            dimensions: `${item.design.width} × ${item.design.height} px`,
            version: editingProduct.version || 'v1.0',
            isApprovedForClient: newDeliverableApproved,
            isInternalSource: false,
            uploadedBy: firebaseUser.uid,
          });
          uploadedFiles.push(pngRec, svgRec);
        }
      }

      const nextFormats = Array.from(
        new Set([...(editingProduct.supportedFormats || []), 'PNG', 'SVG', ...(mode === 'zip' ? ['ZIP', 'PDF'] : [])]),
      );
      const saved = await saveCreativeProduct({
        ...editingProduct,
        previewImageUrl: updatedPreviewUrl,
        ...(updatedPreviewPath ? { previewStoragePath: updatedPreviewPath } : {}),
        files: [...uploadedFiles, ...(editingProduct.files || [])],
        supportedFormats: nextFormats,
        linkedTemplateId: chosen[0].id,
        deliverablesSummary: deliverablesText
          ? deliverablesText.split('\n').map(s => s.trim()).filter(Boolean)
          : editingProduct.deliverablesSummary,
        updatedBy: firebaseUser.uid,
      });
      setEditingProduct(saved);
      setIsNewDraft(false);
      setShowTemplatePackager(false);
      setSelectedDesignIds([]);
      setNotice(
        `Rendered & attached ${uploadedFiles.length} real deliverable file(s) from ${chosen.length} studio template(s) to "${saved.title}".`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const segmentCounts = useMemo(() => {
    let artist = 0;
    let brand = 0;
    let shared = 0;
    for (const p of products) {
      const seg = classifyCreativeProductSegment(p.audience);
      if (seg === 'artist') artist += 1;
      else if (seg === 'shared') shared += 1;
      else brand += 1;
    }
    return { all: products.length, artist, brand, shared };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter(p => {
      if (segmentFilter !== 'all' && classifyCreativeProductSegment(p.audience) !== segmentFilter) {
        return false;
      }
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;
      if (audienceFilter !== 'All' && p.audience !== audienceFilter) return false;
      if (familyFilter !== 'All' && resolveProductFamily(p) !== familyFilter) return false;
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
      if (q) {
        const hay = `${p.title} ${resolveProductFamily(p)} ${p.category} ${p.subcategory} ${p.summary}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, segmentFilter, statusFilter, audienceFilter, familyFilter, categoryFilter, searchQuery]);

  const filteredWorkspaces = useMemo(() => {
    const q = workspaceSearch.trim().toLowerCase();
    return workspaces.filter(ws =>
      !q || `${ws.name} ${ws.type} ${ws.contactEmail || ''}`.toLowerCase().includes(q)
    );
  }, [workspaces, workspaceSearch]);

  if (adminVerified === 'checking') {
    return (
      <div className="border border-[#1E1E1E] bg-[#0C0C0C] p-6 text-xs font-mono text-neutral-400">
        Verifying Admin Studio Permissions…
      </div>
    );
  }

  if (adminVerified !== 'ok') {
    return (
      <div className="border border-red-900/60 bg-[#0C0C0C] p-6 space-y-2">
        <div className="flex items-center gap-2 text-[#FF1E1E]">
          <ShieldAlert size={18} />
          <h2 className="text-sm font-bold text-white">Creative Products Management Restricted</h2>
        </div>
        <p className="text-xs text-neutral-400">Only active Platform Admins can create or manage Creative Products.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="border border-red-900/60 bg-red-950/30 px-4 py-3 text-xs text-red-200 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="underline">Dismiss</button>
        </div>
      )}
      {notice && (
        <div role="status" className="border border-emerald-900/60 bg-emerald-950/25 px-4 py-3 text-xs text-emerald-200 flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400" />
            {notice}
          </span>
          <button type="button" onClick={() => setNotice('')} className="underline">Dismiss</button>
        </div>
      )}

      {/* Top Operations Bar & Sub-Section Tabs (Inside Admin HQ Pillar 5) */}
      <section className="border border-[#1E1E1E] bg-[#0C0C0C] p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">
              <span>Creative Products · Monthly Drops · Resource Analytics</span>
            </div>
            <h3 className="text-lg font-bold text-white">Creative Ecosystem Management Studio</h3>
            <p className="text-xs text-neutral-400 max-w-2xl">
              Manage 50+ Artist, Brand &amp; Shared resources, hydrate Studio ZIP/PDF/SVG bundles, curate scheduled Monthly Drops, and monitor usage analytics.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={busy}
              onClick={() => void seedStarterCatalog()}
              className="inline-flex items-center gap-1.5 border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-xs font-medium text-neutral-200 hover:text-white hover:border-[#FF1E1E] disabled:opacity-50"
            >
              <FolderPlus size={14} className="text-[#FF1E1E]" />
              <span>Seed Full Catalog ({CREATIVE_CATALOG_SEEDS.length})</span>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void hydrateAllSeedStudioPacks()}
              className="inline-flex items-center gap-1.5 border border-emerald-700/50 bg-emerald-950/25 px-3 py-2 text-xs font-medium text-emerald-200 hover:text-white hover:border-emerald-400 disabled:opacity-50"
            >
              <FileCheck2 size={14} />
              <span>{hydrationProgress || 'Hydrate Seed Storage Packs'}</span>
            </button>
            <button
              type="button"
              onClick={() => startNewProduct()}
              className="inline-flex items-center gap-1.5 bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-colors"
            >
              <Plus size={14} />
              <span>New Creative Product</span>
            </button>
          </div>
        </div>

        {/* Workspace Sub-Tabs inside Pillar 5 */}
        <div className="flex flex-wrap items-center gap-2 border-t border-[#181818] pt-3">
          {(
            [
              { id: 'catalog', label: `Catalog & Studio (${products.length})`, icon: Package },
              { id: 'drops', label: `Monthly Drops (${drops.length})`, icon: Calendar },
              { id: 'analytics', label: `Resource Analytics (${analyticsSummaries.length})`, icon: BarChart3 },
            ] as const
          ).map(tab => {
            const Icon = tab.icon;
            const active = workspaceTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setWorkspaceTab(tab.id)}
                className={`inline-flex items-center gap-2 border px-3.5 py-1.5 text-xs font-mono transition-colors ${
                  active
                    ? 'border-[#FF1E1E] bg-[#FF1E1E] text-white font-semibold'
                    : 'border-[#242424] bg-[#111111] text-neutral-300 hover:text-white hover:border-[#3A3A3A]'
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {workspaceTab === 'drops' && (
        <section className="space-y-4">
          <div className="border border-[#1E1E1E] bg-[#0B0B0B] p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-white">Monthly Creative Resource Drops</h4>
              <p className="text-xs text-neutral-400">
                Bundle curated resources into scheduled or live monthly drops for Artist, Brand &amp; Shared audiences.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void seedStarterDrops()}
                className="border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-neutral-200 hover:border-[#FF1E1E] hover:text-white"
              >
                Seed Starter Drops ({STARTER_CREATIVE_DROPS.length})
              </button>
              <button
                type="button"
                onClick={startNewDrop}
                className="inline-flex items-center gap-1.5 bg-[#FF1E1E] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
              >
                <Plus size={13} />
                <span>New Monthly Drop</span>
              </button>
            </div>
          </div>

          {drops.length === 0 ? (
            <div className="border border-dashed border-[#2A2A2A] bg-[#0B0B0B] p-10 text-center space-y-3">
              <Calendar size={26} className="mx-auto text-neutral-600" />
              <p className="text-sm font-semibold text-neutral-200">No Monthly Creative Drops Created Yet</p>
              <button
                type="button"
                onClick={() => void seedStarterDrops()}
                className="border border-[#333] bg-[#141414] px-4 py-2 text-xs text-white hover:border-[#FF1E1E]"
              >
                Seed 3 Starter Monthly Drops
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {drops.map(drop => (
                <div key={drop.id} className="border border-[#202020] bg-[#0C0C0C] p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-mono uppercase text-[#FF1E1E]">
                        {drop.monthKey} · {drop.audience} · {drop.accessLevel}
                      </p>
                      <h5 className="text-sm font-bold text-white mt-0.5">{drop.title}</h5>
                      <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{drop.description}</p>
                    </div>
                    <span className={`border px-2 py-0.5 text-[10px] font-mono ${
                      drop.status === 'Published'
                        ? 'border-emerald-600/50 bg-emerald-950/40 text-emerald-300'
                        : 'border-neutral-700 bg-neutral-900 text-neutral-300'
                    }`}>
                      {drop.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 border-t border-[#181818] pt-2.5">
                    <span>{drop.productIds.length} bundled resource(s)</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDrop(drop);
                          setDropTagsText((drop.highlightTags || []).join(', '));
                          setConfirmDeleteDropId(null);
                        }}
                        className="border border-[#2E2E2E] bg-[#141414] px-2.5 py-1 text-neutral-200 hover:border-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void updateCreativeDropStatus(
                            drop.id,
                            drop.status === 'Published' ? 'Archived' : 'Published',
                          )
                        }
                        className="border border-[#2E2E2E] bg-[#141414] px-2.5 py-1 text-neutral-200 hover:border-[#FF1E1E]"
                      >
                        {drop.status === 'Published' ? 'Archive' : 'Publish'}
                      </button>
                      {confirmDeleteDropId === drop.id ? (
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteCreativeDropRecord(drop.id);
                            setConfirmDeleteDropId(null);
                            setNotice(`Deleted drop "${drop.title}".`);
                          }}
                          className="bg-[#FF1E1E] px-2.5 py-1 text-white font-semibold"
                        >
                          Confirm
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteDropId(drop.id)}
                          className="border border-[#2E2E2E] p-1 text-neutral-400 hover:text-red-400"
                          aria-label={`Delete drop ${drop.title}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {workspaceTab === 'analytics' && (() => {
        const totals = analyticsSummaries.reduce(
          (acc, s) => ({
            views: acc.views + (s.viewCount || 0),
            previews: acc.previews + (s.previewCount || 0),
            downloads: acc.downloads + (s.downloadCount || 0),
            denied: acc.denied + (s.deniedCount || 0),
            favourites: acc.favourites + (s.favouriteCount || 0),
            collections: acc.collections + (s.collectionAddCount || 0),
          }),
          { views: 0, previews: 0, downloads: 0, denied: 0, favourites: 0, collections: 0 },
        );
        const topSummaries = [...analyticsSummaries]
          .sort((a, b) => (b.downloadCount + b.viewCount) - (a.downloadCount + a.viewCount))
          .slice(0, 20);

        return (
          <section className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                ['Total Views', totals.views, 'text-white'],
                ['Slide Previews', totals.previews, 'text-neutral-200'],
                ['Downloads', totals.downloads, 'text-emerald-400'],
                ['Denied Gates', totals.denied, 'text-amber-300'],
                ['Favourites', totals.favourites, 'text-[#FF1E1E]'],
                ['Collection Saves', totals.collections, 'text-blue-300'],
              ].map(([label, val, color]) => (
                <div key={String(label)} className="border border-[#1E1E1E] bg-[#0B0B0B] p-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">{label}</p>
                  <p className={`mt-1.5 text-2xl font-black font-mono tabular-nums ${color}`}>{val}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-4">
              <div className="border border-[#1E1E1E] bg-[#0B0B0B] p-4 space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-widest text-white">
                  Top Creative Resources by Engagement
                </h4>
                {topSummaries.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-6 text-center">
                    No client resource engagement events recorded yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto border border-[#1A1A1A]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#1A1A1A] bg-[#121212] text-[10px] font-mono uppercase text-neutral-400">
                          <th className="px-3 py-2">Resource</th>
                          <th className="px-3 py-2">Audience</th>
                          <th className="px-3 py-2 text-right">Views</th>
                          <th className="px-3 py-2 text-right">Downloads</th>
                          <th className="px-3 py-2 text-right">Faves</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#181818]">
                        {topSummaries.map(row => (
                          <tr key={row.productId} className="bg-[#0B0B0B]">
                            <td className="px-3 py-2 font-medium text-white truncate max-w-[220px]">
                              {row.title || row.productId}
                            </td>
                            <td className="px-3 py-2 font-mono text-neutral-400">{row.audience || '—'}</td>
                            <td className="px-3 py-2 text-right font-mono tabular-nums text-neutral-300">{row.viewCount || 0}</td>
                            <td className="px-3 py-2 text-right font-mono tabular-nums text-emerald-400">{row.downloadCount || 0}</td>
                            <td className="px-3 py-2 text-right font-mono tabular-nums text-[#FF1E1E]">{row.favouriteCount || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="border border-[#1E1E1E] bg-[#0B0B0B] p-4 space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-widest text-white">
                  Recent Resource Telemetry ({analyticsEvents.length})
                </h4>
                {analyticsEvents.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-6 text-center">No recent telemetry events.</p>
                ) : (
                  <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                    {analyticsEvents.slice(0, 25).map(ev => (
                      <div key={ev.id} className="border border-[#1A1A1A] bg-[#101010] px-3 py-2 text-[11px] flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-mono font-bold text-[#FF1E1E]">{ev.action}</span>
                          <span className="text-neutral-300 ml-2 truncate">{ev.productId || ev.dropId}</span>
                        </div>
                        <span className="font-mono text-[10px] text-neutral-500 shrink-0 tabular-nums">
                          {ev.createdAt?.slice(0, 16).replace('T', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })()}

      {workspaceTab === 'catalog' && (<>

      {/* 4-Layer Architecture Clarity Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">
        <div className="border border-[#1E1E1E] bg-[#0A0A0A] p-3.5 space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-widest text-amber-300">01 · Internal Master Templates</p>
          <p className="font-semibold text-white">Design Canvas &amp; Family Sources</p>
          <p className="text-[11px] text-neutral-400">Admin-only 36 Template Families + 60+ Master Templates &amp; internal sources.</p>
        </div>
        <div className="border border-[#1E1E1E] bg-[#0A0A0A] p-3.5 space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF1E1E]">02 · Product Previews</p>
          <p className="font-semibold text-white">Client Catalog Visual Covers</p>
          <p className="text-[11px] text-neutral-400">Safe showcase thumbnails rendered from Canvas or uploaded per product.</p>
        </div>
        <div className="border border-[#1E1E1E] bg-[#0A0A0A] p-3.5 space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">03 · Approved Client Files</p>
          <p className="text-[11px] text-neutral-400">Verified PNG, SVG, PDF &amp; ZIP deliverables approved for eligible downloads.</p>
        </div>
        <div className="border border-[#1E1E1E] bg-[#0A0A0A] p-3.5 space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-300">04 · Workspace Delivery</p>
          <p className="font-semibold text-white">Assignments &amp; Bespoke Work</p>
          <p className="text-[11px] text-neutral-400">Assign products per workspace or receive client custom requests into HQ.</p>
        </div>
      </section>

      {/* Department & Audience Partition Tabs */}
      <div
        role="tablist"
        aria-label="Creative Products catalog segments"
        className="flex flex-wrap items-center gap-2 border-b border-[#1A1A1A] pb-3"
      >
        {(
          [
            ['all', 'All Catalog Packs', segmentCounts.all],
            ['artist', 'Artist Packs', segmentCounts.artist],
            ['brand', 'Brand Packs', segmentCounts.brand],
            ['shared', 'Shared Utilities', segmentCounts.shared],
          ] as const
        ).map(([segId, label, count]) => {
          const active = segmentFilter === segId;
          return (
            <button
              key={segId}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => handleSelectSegment(segId)}
              className={`px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors border ${
                active
                  ? 'border-[#FF1E1E] bg-[#FF1E1E] text-white font-semibold'
                  : 'border-[#242424] bg-[#101010] text-neutral-300 hover:text-white hover:border-[#3A3A3A]'
              }`}
            >
              <span>{label}</span>
              <span className="ml-2 font-mono text-[11px] tabular-nums opacity-85">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Artist Packs', value: segmentCounts.artist, accent: 'text-amber-300' },
          { label: 'Brand Packs', value: segmentCounts.brand, accent: 'text-blue-300' },
          { label: 'Shared Utilities', value: segmentCounts.shared, accent: 'text-white' },
          {
            label: 'Published / Files Live',
            value: `${products.filter(p => p.status === 'Published').length} / ${products.reduce((sum, p) => sum + getApprovedDownloadableFiles(p.files).length, 0)}`,
            accent: 'text-emerald-400',
          },
        ].map(stat => (
          <div key={stat.label} className="border border-[#1D1D1D] bg-[#0B0B0B] p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">{stat.label}</p>
            <p className={`mt-1.5 text-2xl font-black font-mono tabular-nums ${stat.accent}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <section className="border border-[#1D1D1D] bg-[#0B0B0B] p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-3 text-neutral-500" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search products, formats, specs…"
            className="w-full border border-[#2A2A2A] bg-[#131313] pl-9 pr-3 py-2 text-xs text-white focus:border-[#FF1E1E] outline-none"
          />
        </div>
        <select
          value={audienceFilter}
          onChange={e => setAudienceFilter(e.target.value as 'All' | CreativeProductAudience)}
          className="border border-[#2A2A2A] bg-[#131313] px-3 py-2 text-xs text-white"
        >
          <option value="All">All Audiences</option>
          {AUDIENCES.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select
          value={familyFilter}
          onChange={e => setFamilyFilter(e.target.value)}
          className="border border-[#2A2A2A] bg-[#131313] px-3 py-2 text-xs text-white"
        >
          <option value="All">All Product Families</option>
          {ALL_PRODUCT_FAMILIES.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="border border-[#2A2A2A] bg-[#131313] px-3 py-2 text-xs text-white"
        >
          <option value="All">All Categories</option>
          {ALL_PRODUCT_CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as 'All' | CreativeProductStatus)}
          className="border border-[#2A2A2A] bg-[#131313] px-3 py-2 text-xs text-white"
        >
          <option value="All">All Statuses</option>
          <option value="Published">Published</option>
          <option value="Draft">Draft</option>
          <option value="Archived">Archived</option>
        </select>
      </section>

      {/* Catalog Grid */}
      {loading ? (
        <div className="border border-[#1E1E1E] bg-[#0C0C0C] p-12 text-center text-xs text-neutral-400">
          Loading Creative Products catalog…
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="border border-dashed border-[#2C2C2C] bg-[#0B0B0B] p-10 text-center space-y-3">
          <Package size={28} className="mx-auto text-neutral-500" />
          <h4 className="text-sm font-bold text-white">No Creative Products Match Filter</h4>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Seed the starter Artist &amp; Brand/Business catalog or create a custom Creative Product with downloadable deliverables and Canvas assets.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => void seedStarterCatalog()}
              className="border border-[#2E2E2E] bg-[#141414] px-4 py-2 text-xs font-medium text-white hover:border-[#FF1E1E]"
            >
              Seed Starter Catalog
            </button>
            <button
              type="button"
              onClick={() => startNewProduct()}
              className="bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white hover:bg-red-600"
            >
              Create Product
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProducts.map(product => {
            const approvedCount = getApprovedDownloadableFiles(product.files).length;
            const totalFilesCount = product.files?.length || 0;
            return (
              <article
                key={product.id}
                className="border border-[#202020] bg-[#0C0C0C] flex flex-col overflow-hidden hover:border-[#3A3A3A] transition-colors"
              >
                <div className="relative h-44 bg-[#121212] overflow-hidden border-b border-[#1A1A1A]">
                  <img
                    src={product.previewImageUrl || artistShowcasePortrait}
                    alt={product.previewAlt || product.title}
                    className="h-full w-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 text-[10px] font-mono uppercase">
                    <span className="bg-black/80 border border-white/15 px-2 py-0.5 text-white">
                      {product.audience}
                    </span>
                    <span
                      className={`px-2 py-0.5 border ${
                        product.status === 'Published'
                          ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
                          : product.status === 'Archived'
                            ? 'bg-neutral-900/90 border-neutral-700 text-neutral-400'
                            : 'bg-amber-950/90 border-amber-500/40 text-amber-200'
                      }`}
                    >
                      {product.status}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-neutral-300">
                    <span className="truncate">{resolveProductFamily(product)}</span>
                    <span className="shrink-0 tabular-nums">{product.version}</span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col space-y-3">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 truncate">
                      {product.category}{product.subcategory ? ` · ${product.subcategory}` : ''}
                    </p>
                    <h4 className="mt-0.5 text-sm font-bold text-white leading-snug">{product.title}</h4>
                    <p className="mt-1 text-xs text-neutral-400 line-clamp-2">{product.summary}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-y border-[#1A1A1A] py-2.5 text-[11px] font-mono">
                    <div>
                      <span className="text-neutral-500 block text-[9px] uppercase">Access Rule</span>
                      <span className="text-white truncate block">{product.accessType}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[9px] uppercase">Files (Approved)</span>
                      <span className="text-white tabular-nums">{approvedCount} / {totalFilesCount} files</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[9px] uppercase">Workspaces</span>
                      <span className="text-white tabular-nums">{product.assignedWorkspaceIds?.length || 0} assigned</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[9px] uppercase">Formats</span>
                      <span className="text-neutral-300 truncate block">
                        {(product.supportedFormats || []).join(', ') || 'Custom'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => void openEditor(product)}
                      className="inline-flex items-center gap-1 border border-[#2E2E2E] bg-[#141414] px-2.5 py-1.5 text-xs font-medium text-white hover:border-[#FF1E1E]"
                    >
                      <Edit3 size={12} />
                      <span>Edit &amp; Files</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void openCanvasForProduct(product)}
                      className="inline-flex items-center gap-1 border border-[#2E2E2E] bg-[#141414] px-2.5 py-1.5 text-xs font-medium text-neutral-200 hover:border-white"
                    >
                      <Sparkles size={12} className="text-[#FF1E1E]" />
                      <span>Canvas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewProduct(product)}
                      className="inline-flex items-center gap-1 border border-[#2E2E2E] bg-[#141414] px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white"
                      title="Preview Client View"
                    >
                      <Eye size={12} />
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleToggleProductStatus(product)}
                      className="ml-auto border border-[#2E2E2E] bg-[#141414] px-2.5 py-1.5 text-[11px] font-mono text-neutral-300 hover:text-white hover:border-[#FF1E1E] disabled:opacity-50"
                    >
                      {product.status === 'Published' ? 'Unpublish' : 'Publish'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      </>)}

      {/* ========================================================
          PRODUCT EDITOR & DELIVERABLE FILES DRAWER / MODAL
         ======================================================== */}
      {editingProduct && (
        <div className="fixed inset-0 z-40 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto border border-[#2A2A2A] bg-[#0B0B0B] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#1E1E1E] bg-[#0E0E0E] px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">
                  {isNewDraft ? 'Create New Product' : `Edit Product · ${editingProduct.id}`}
                </p>
                <h3 className="text-base font-bold text-white truncate">
                  {editingProduct.title || 'Untitled Creative Product'}
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => void openCanvasForProduct(editingProduct)}
                  className="inline-flex items-center gap-1.5 border border-[#333] bg-[#151515] px-3 py-1.5 text-xs font-medium text-white hover:border-[#FF1E1E]"
                >
                  <Sparkles size={13} className="text-[#FF1E1E]" />
                  <span>Create Asset in Canvas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="p-1.5 text-neutral-400 hover:text-white"
                  aria-label="Close product editor"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="md:col-span-2 block">
                  <span className="mb-1 block text-[10px] font-mono uppercase tracking-widest text-neutral-500">Product Title *</span>
                  <input
                    required
                    value={editingProduct.title}
                    onChange={e => setEditingProduct({ ...editingProduct, title: e.target.value })}
                    className="w-full border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-sm text-white"
                    placeholder="e.g. Spotify Canvas, Cover & Artist Banner Pack"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[10px] font-mono uppercase tracking-widest text-neutral-500">Audience Target</span>
                  <select
                    value={editingProduct.audience}
                    onChange={e => setEditingProduct({ ...editingProduct, audience: e.target.value as CreativeProductAudience })}
                    className="w-full border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-sm text-white"
                  >
                    {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-[10px] font-mono uppercase tracking-widest text-neutral-500">Product Family</span>
                  <select
                    value={resolveProductFamily(editingProduct)}
                    onChange={e => setEditingProduct({ ...editingProduct, productFamily: e.target.value })}
                    className="w-full border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-sm text-white"
                  >
                    {ALL_PRODUCT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-[10px] font-mono uppercase tracking-widest text-neutral-500">Hub Category</span>
                  <select
                    value={editingProduct.category}
                    onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-sm text-white"
                  >
                    {ALL_PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-[10px] font-mono uppercase tracking-widest text-neutral-500">Subcategory / Focus</span>
                  <input
                    value={editingProduct.subcategory}
                    onChange={e => setEditingProduct({ ...editingProduct, subcategory: e.target.value })}
                    className="w-full border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-sm text-white"
                    placeholder="Spotify, Apple Music, Invoices, Logos…"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[10px] font-mono uppercase tracking-widest text-neutral-500">Linked Request Service Category</span>
                  <select
                    value={editingProduct.linkedServiceCategory}
                    onChange={e => setEditingProduct({ ...editingProduct, linkedServiceCategory: e.target.value })}
                    className="w-full border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-sm text-white"
                  >
                    {UNIFIED_PRODUCTION_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-[10px] font-mono uppercase tracking-widest text-neutral-500">Access Policy</span>
                  <select
                    value={editingProduct.accessType}
                    onChange={e => setEditingProduct({ ...editingProduct, accessType: e.target.value as CreativeProductAccessType })}
                    className="w-full border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-sm text-white"
                  >
                    {ACCESS_TYPES.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-mono uppercase tracking-widest text-neutral-500">Status</span>
                    <select
                      value={editingProduct.status}
                      onChange={e => setEditingProduct({ ...editingProduct, status: e.target.value as CreativeProductStatus })}
                      className="w-full border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-sm text-white"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-mono uppercase tracking-widest text-neutral-500">Version</span>
                    <input
                      value={editingProduct.version}
                      onChange={e => setEditingProduct({ ...editingProduct, version: e.target.value })}
                      className="w-full border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-sm text-white font-mono"
                    />
                  </label>
                </div>

                {/* Phase 4 Resource Type, Industry Tag, Pricing & Instant Pack Eligibility */}
                <label className="block">
                  <span className="mb-1 block text-[10px] font-mono uppercase tracking-widest text-neutral-500">Resource Classification Type</span>
                  <select
                    value={editingProduct.resourceType || 'Template'}
                    onChange={e => setEditingProduct({ ...editingProduct, resourceType: e.target.value as CreativeResourceType })}
                    className="w-full border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-sm text-white"
                  >
                    {RESOURCE_TYPES.map(rt => <option key={rt} value={rt}>{rt}</option>)}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-mono uppercase tracking-widest text-neutral-500">Industry Tag (Optional)</span>
                    <input
                      value={editingProduct.industryTag || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, industryTag: e.target.value })}
                      placeholder="Hospitality, Retail, Startup…"
                      className="w-full border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-sm text-white"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-mono uppercase tracking-widest text-neutral-500">Standalone Value ($ USD)</span>
                    <input
                      type="number"
                      min={0}
                      value={editingProduct.priceUsd ?? ''}
                      onChange={e =>
                        setEditingProduct({
                          ...editingProduct,
                          priceUsd: e.target.value === '' ? undefined : Number(e.target.value),
                        })
                      }
                      placeholder="Optional"
                      className="w-full border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-sm text-white font-mono"
                    />
                  </label>
                </div>

                <div className="md:col-span-2 grid sm:grid-cols-2 gap-3 border border-[#1E1E1E] bg-[#0F0F0F] p-3">
                  <label className="flex items-center gap-2 text-xs text-neutral-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.instantStudioPackEligible)}
                      onChange={e =>
                        setEditingProduct({
                          ...editingProduct,
                          instantStudioPackEligible: e.target.checked,
                          variationOptions:
                            editingProduct.variationOptions && editingProduct.variationOptions.length > 0
                              ? editingProduct.variationOptions
                              : DEFAULT_VARIATION_OPTIONS,
                        })
                      }
                      className="accent-[#FF1E1E]"
                    />
                    <span>Enable Verified Instant Studio Pack Export (PDF/SVG/ZIP)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-neutral-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.unlockedByDefault)}
                      onChange={e =>
                        setEditingProduct({ ...editingProduct, unlockedByDefault: e.target.checked })
                      }
                      className="accent-[#FF1E1E]"
                    />
                    <span>Unlocked by Default for Matching Audience</span>
                  </label>
                </div>

                {/* Live Publish Readiness Gate Checklist */}
                {(() => {
                  const readiness = validateProductForPublish({
                    ...editingProduct,
                    deliverablesSummary: deliverablesText.split('\n').map(s => s.trim()).filter(Boolean),
                  });
                  return (
                    <div
                      className={`md:col-span-2 border p-3 text-xs ${
                        readiness.valid
                          ? 'border-emerald-900/60 bg-emerald-950/20 text-emerald-200'
                          : 'border-amber-900/60 bg-amber-950/20 text-amber-200'
                      }`}
                    >
                      <p className="font-mono text-[10px] uppercase tracking-wider font-bold">
                        {readiness.valid
                          ? 'Publish Readiness: All Quality & Deliverable Gates Passed'
                          : `Publish Readiness Checklist (${readiness.missingRequirements.length} remaining)`}
                      </p>
                      {!readiness.valid && (
                        <ul className="mt-1.5 space-y-0.5 text-[11px] text-amber-100/90">
                          {readiness.missingRequirements.map(req => (
                            <li key={req}>· {req}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })()}

                <label className="md:col-span-2 block">
                  <span className="mb-1 block text-[10px] font-mono uppercase tracking-widest text-neutral-500">Short Summary</span>
                  <input
                    value={editingProduct.summary}
                    onChange={e => setEditingProduct({ ...editingProduct, summary: e.target.value })}
                    maxLength={600}
                    className="w-full border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-sm text-white"
                    placeholder="Concise one-sentence summary shown in client catalog cards"
                  />
                </label>

                <label className="md:col-span-2 block">
                  <span className="mb-1 block text-[10px] font-mono uppercase tracking-widest text-neutral-500">Full Creative Description</span>
                  <textarea
                    rows={3}
                    value={editingProduct.description}
                    onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-sm text-white"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[10px] font-mono uppercase tracking-widest text-neutral-500">Included Deliverables (one per line)</span>
                  <textarea
                    rows={4}
                    value={deliverablesText}
                    onChange={e => setDeliverablesText(e.target.value)}
                    className="w-full border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-xs text-white font-mono"
                    placeholder={'3000×3000 Release Artwork\nSpotify Canvas 9:16'}
                  />
                </label>

                <div className="space-y-3">
                  <span className="block text-[10px] font-mono uppercase tracking-widest text-neutral-500">Supported Formats</span>
                  <div className="flex flex-wrap gap-2">
                    {FORMAT_OPTIONS.map(fmt => {
                      const active = editingProduct.supportedFormats.includes(fmt);
                      return (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() =>
                            setEditingProduct({
                              ...editingProduct,
                              supportedFormats: active
                                ? editingProduct.supportedFormats.filter(f => f !== fmt)
                                : [...editingProduct.supportedFormats, fmt],
                            })
                          }
                          className={`border px-2.5 py-1 text-xs font-mono ${
                            active
                              ? 'border-[#FF1E1E] bg-[#FF1E1E]/15 text-white font-semibold'
                              : 'border-[#2E2E2E] bg-[#141414] text-neutral-400'
                          }`}
                        >
                          {fmt}
                        </button>
                      );
                    })}
                  </div>

                  {/* Preview Image Upload */}
                  <div className="border border-[#222] bg-[#111] p-3 flex items-center gap-3">
                    <img
                      src={editingProduct.previewImageUrl || artistShowcasePortrait}
                      alt="Preview"
                      className="h-14 w-14 object-cover border border-[#333] shrink-0"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-[11px] font-semibold text-white">Product Thumbnail &amp; Multi-Slide Gallery</p>
                      <label className="inline-flex items-center gap-1.5 border border-[#333] bg-[#181818] px-2.5 py-1 text-[11px] text-neutral-200 hover:text-white cursor-pointer">
                        <ImageIcon size={12} />
                        <span>Upload Preview Image</span>
                        <input type="file" accept="image/png,image/jpeg,image/webp,image/avif" className="hidden" onChange={handlePreviewUpload} />
                      </label>
                    </div>
                  </div>

                  {/* Additional Multi-Slide Preview URLs */}
                  <div className="border border-[#1E1E1E] bg-[#0F0F0F] p-2.5 space-y-2">
                    <p className="text-[10px] font-mono uppercase text-neutral-400">
                      Additional Preview Slides ({editingProduct.previewGallery?.length || 0})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-1.5">
                      <input
                        value={newGalleryUrl}
                        onChange={e => setNewGalleryUrl(e.target.value)}
                        placeholder="Extra preview image URL…"
                        className="border border-[#2A2A2A] bg-[#141414] px-2 py-1 text-[11px] text-white"
                      />
                      <input
                        value={newGalleryCaption}
                        onChange={e => setNewGalleryCaption(e.target.value)}
                        placeholder="Caption"
                        className="border border-[#2A2A2A] bg-[#141414] px-2 py-1 text-[11px] text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newGalleryUrl.trim()) return;
                          setEditingProduct({
                            ...editingProduct,
                            previewGallery: [
                              ...(editingProduct.previewGallery || []),
                              {
                                url: newGalleryUrl.trim(),
                                alt: `${editingProduct.title} showcase`,
                                caption: newGalleryCaption.trim() || 'Additional Angle Preview',
                              },
                            ],
                          });
                          setNewGalleryUrl('');
                          setNewGalleryCaption('');
                        }}
                        className="border border-[#333] bg-[#181818] px-2.5 py-1 text-[11px] text-white hover:border-[#FF1E1E]"
                      >
                        + Slide
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dimension Specs Builder */}
              <div className="border border-[#1E1E1E] bg-[#0E0E0E] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-mono uppercase tracking-widest text-white">Platform Dimension Specifications</h4>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingProduct({
                        ...editingProduct,
                        dimensionSpecs: [...STREAMING_PLATFORM_DIMENSIONS],
                      })
                    }
                    className="text-[11px] font-mono text-amber-300 hover:text-white underline"
                  >
                    Load Standard Streaming Dimensions
                  </button>
                </div>
                {editingProduct.dimensionSpecs.length > 0 && (
                  <div className="space-y-1.5">
                    {editingProduct.dimensionSpecs.map((spec, idx) => (
                      <div key={`${spec.platform}-${idx}`} className="flex items-center justify-between gap-2 border border-[#222] bg-[#131313] px-3 py-1.5 text-xs">
                        <span className="text-white font-medium">{spec.platform}</span>
                        <span className="font-mono text-neutral-400">{spec.dimensions} · {spec.aspectRatio}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingProduct({
                              ...editingProduct,
                              dimensionSpecs: editingProduct.dimensionSpecs.filter((_, i) => i !== idx),
                            })
                          }
                          className="text-neutral-500 hover:text-red-400"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid gap-2 sm:grid-cols-4">
                  <input
                    value={newSpec.platform}
                    onChange={e => setNewSpec({ ...newSpec, platform: e.target.value })}
                    placeholder="Platform (e.g. Spotify Canvas)"
                    className="border border-[#2A2A2A] bg-[#141414] px-2.5 py-1.5 text-xs text-white"
                  />
                  <input
                    value={newSpec.dimensions}
                    onChange={e => setNewSpec({ ...newSpec, dimensions: e.target.value })}
                    placeholder="1080 × 1920 px"
                    className="border border-[#2A2A2A] bg-[#141414] px-2.5 py-1.5 text-xs text-white"
                  />
                  <input
                    value={newSpec.aspectRatio}
                    onChange={e => setNewSpec({ ...newSpec, aspectRatio: e.target.value })}
                    placeholder="9:16 Vertical"
                    className="border border-[#2A2A2A] bg-[#141414] px-2.5 py-1.5 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newSpec.platform.trim() || !newSpec.dimensions.trim()) return;
                      setEditingProduct({
                        ...editingProduct,
                        dimensionSpecs: [...editingProduct.dimensionSpecs, { ...newSpec }],
                      });
                      setNewSpec({ platform: '', dimensions: '', aspectRatio: '', notes: '' });
                    }}
                    className="border border-[#333] bg-[#161616] px-3 py-1.5 text-xs text-white hover:border-[#FF1E1E]"
                  >
                    + Add Spec
                  </button>
                </div>
              </div>

              {/* Client Workspace & Package Assignments */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border border-[#1E1E1E] bg-[#0E0E0E] p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-white">
                      Assigned Client Workspaces ({editingProduct.assignedWorkspaceIds.length})
                    </h4>
                    <input
                      value={workspaceSearch}
                      onChange={e => setWorkspaceSearch(e.target.value)}
                      placeholder="Filter workspaces…"
                      className="border border-[#2A2A2A] bg-[#141414] px-2 py-1 text-[11px] text-white w-40"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                    {filteredWorkspaces.map(ws => {
                      const checked = editingProduct.assignedWorkspaceIds.includes(ws.id);
                      return (
                        <label key={ws.id} className="flex items-center justify-between gap-2 border border-[#1E1E1E] bg-[#121212] px-2.5 py-1.5 text-xs cursor-pointer hover:border-[#333]">
                          <span className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setEditingProduct({
                                  ...editingProduct,
                                  assignedWorkspaceIds: checked
                                    ? editingProduct.assignedWorkspaceIds.filter(id => id !== ws.id)
                                    : [...editingProduct.assignedWorkspaceIds, ws.id],
                                })
                              }
                              className="accent-[#FF1E1E]"
                            />
                            <span className="text-white truncate">{ws.name}</span>
                          </span>
                          <span className="font-mono text-[10px] text-neutral-500 shrink-0">{ws.type}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="border border-[#1E1E1E] bg-[#0E0E0E] p-4 space-y-2.5">
                  <h4 className="text-xs font-mono uppercase tracking-widest text-white">
                    Linked Service Packages ({editingProduct.includedPackageIds?.length || 0})
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                    {servicePackages.length === 0 ? (
                      <p className="text-xs text-neutral-500">No service packages found in catalog.</p>
                    ) : (
                      servicePackages.map(pkg => {
                        const checked = editingProduct.includedPackageIds?.includes(pkg.id) || false;
                        return (
                          <label key={pkg.id} className="flex items-center justify-between gap-2 border border-[#1E1E1E] bg-[#121212] px-2.5 py-1.5 text-xs cursor-pointer">
                            <span className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  const curr = editingProduct.includedPackageIds || [];
                                  setEditingProduct({
                                    ...editingProduct,
                                    includedPackageIds: checked
                                      ? curr.filter(id => id !== pkg.id)
                                      : [...curr, pkg.id],
                                  });
                                }}
                                className="accent-[#FF1E1E]"
                              />
                              <span className="text-white truncate">{pkg.name}</span>
                            </span>
                            <span className="font-mono text-[10px] text-neutral-500 shrink-0">{pkg.targetAudience}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Deliverable Files Upload & Production Packager */}
              <div className="border border-[#1E1E1E] bg-[#0E0E0E] p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E1E1E] pb-3">
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-widest text-white">
                      Client Deliverable Files (PNG, JPG, PDF, PSD, SVG, ZIP, MP4)
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      Generate real Studio PDF + Editable SVG + ZIP packs, render from Template Families, or upload custom files. Only Approved files are visible to eligible clients.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleGenerateStudioDocumentPack(editingProduct)}
                      className="inline-flex items-center gap-1.5 border border-emerald-600/50 bg-emerald-950/30 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:text-white hover:border-emerald-400 disabled:opacity-50"
                    >
                      <FileCheck2 size={13} />
                      <span>Generate &amp; Attach Studio Pack (PDF + SVG + ZIP)</span>
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setSelectedDesignIds([]);
                        setPackagerFilter('All');
                        setShowTemplatePackager(true);
                      }}
                      className="inline-flex items-center gap-1.5 border border-[#3A3A3A] bg-[#161616] px-3 py-1.5 text-xs font-medium text-white hover:border-[#FF1E1E] disabled:opacity-50"
                    >
                      <FileArchive size={13} className="text-[#FF1E1E]" />
                      <span>Render from Template Families</span>
                    </button>
                    <label className="inline-flex items-center gap-1.5 bg-[#FF1E1E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 cursor-pointer">
                      <Upload size={13} />
                      <span>Upload File(s)</span>
                      <input
                        type="file"
                        multiple
                        accept=".png,.jpg,.jpeg,.webp,.svg,.pdf,.psd,.zip,.mp4"
                        className="hidden"
                        onChange={e => void handleDeliverableUpload(e, false)}
                      />
                    </label>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <input
                    value={newDeliverableLabel}
                    onChange={e => setNewDeliverableLabel(e.target.value)}
                    placeholder="Display label (optional for single upload)"
                    className="border border-[#2A2A2A] bg-[#141414] px-2.5 py-1.5 text-xs text-white"
                  />
                  <input
                    value={newDeliverableDimensions}
                    onChange={e => setNewDeliverableDimensions(e.target.value)}
                    placeholder="Dimensions (e.g. 3000 × 3000 px)"
                    className="border border-[#2A2A2A] bg-[#141414] px-2.5 py-1.5 text-xs text-white"
                  />
                  <label className="flex items-center gap-2 border border-[#2A2A2A] bg-[#141414] px-3 py-1.5 text-xs text-neutral-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newDeliverableApproved}
                      onChange={e => setNewDeliverableApproved(e.target.checked)}
                      className="accent-[#FF1E1E]"
                    />
                    <span>Approve immediately for client</span>
                  </label>
                </div>

                {editingProduct.files.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-3">
                    No client deliverable files uploaded yet. Upload files above or render directly from the Design Canvas.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {editingProduct.files.map(file => (
                      <div key={file.id} className="flex flex-wrap items-center justify-between gap-2 border border-[#222] bg-[#131313] px-3 py-2 text-xs">
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">
                            {file.label} <span className="font-mono text-[10px] text-neutral-400">({file.fileFormat} · {file.fileSizeLabel})</span>
                          </p>
                          <p className="text-[10px] font-mono text-neutral-500">
                            {file.dimensions ? `${file.dimensions} · ` : ''}{file.fileName} · {file.version}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => void toggleFileApproval(file.id)}
                            className={`border px-2 py-1 text-[10px] font-mono ${
                              file.isApprovedForClient
                                ? 'border-emerald-600/50 bg-emerald-950/30 text-emerald-300'
                                : 'border-amber-600/40 bg-amber-950/30 text-amber-200'
                            }`}
                          >
                            {file.isApprovedForClient ? 'Client Approved' : 'Internal Staging'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void downloadProductStorageFile(file, { allowUnapproved: true })}
                            className="border border-[#333] p-1.5 text-neutral-300 hover:text-white"
                            title="Download"
                          >
                            <Download size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void removeProductFile(file, false)}
                            className="border border-[#333] p-1.5 text-neutral-400 hover:text-red-400"
                            title="Delete file"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Admin-Only Internal Source Files & Production Notes */}
                <div className="border-t border-[#1E1E1E] pt-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-amber-300">
                      <Lock size={12} />
                      <span>Admin-Only Internal Sources &amp; Notes (Hidden from Clients)</span>
                    </div>
                    <label className="inline-flex items-center gap-1.5 border border-amber-500/40 bg-amber-950/20 px-2.5 py-1 text-[11px] text-amber-200 hover:text-white cursor-pointer">
                      <Upload size={11} />
                      <span>Upload Internal Source</span>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={e => void handleDeliverableUpload(e, true)}
                      />
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    value={internalNotes}
                    onChange={e => setInternalNotes(e.target.value)}
                    placeholder="Internal production notes, font licenses, or layer instructions (never visible to clients)…"
                    className="w-full border border-[#2A2A2A] bg-[#141414] px-3 py-2 text-xs text-white"
                  />
                  {internalSourceFiles.length > 0 && (
                    <div className="space-y-1.5">
                      {internalSourceFiles.map(src => (
                        <div key={src.id} className="flex items-center justify-between gap-2 border border-amber-900/40 bg-amber-950/10 px-3 py-1.5 text-xs">
                          <span className="truncate text-amber-100">{src.fileName} ({src.fileSizeLabel})</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                void downloadProductStorageFile(src, {
                                  allowInternal: adminVerified === 'ok',
                                  allowUnapproved: adminVerified === 'ok',
                                })
                              }
                              className="p-1 text-amber-200 hover:text-white"
                            >
                              <Download size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeProductFile(src, true)}
                              className="p-1 text-neutral-400 hover:text-red-400"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1E1E1E] pt-4">
                {!isNewDraft ? (
                  confirmDeleteProductId === editingProduct.id ? (
                    <div className="flex flex-wrap items-center gap-2 border border-red-900/70 bg-red-950/30 px-3 py-1.5">
                      <span className="text-xs text-red-200">
                        Delete &ldquo;{editingProduct.title}&rdquo; &amp; stored files?
                      </span>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          setError('');
                          try {
                            const storageCleanupPaths = [
                              ...(editingProduct.files || []).map(f => f.storagePath),
                              ...internalSourceFiles.map(f => f.storagePath),
                              ...(editingProduct.previewStoragePath ? [editingProduct.previewStoragePath] : []),
                            ];
                            await Promise.all(
                              storageCleanupPaths.map(p => deleteProductDeliverableStorageFile(p)),
                            );
                            await deleteCreativeProductRecord(editingProduct.id);
                            setNotice(`Deleted product "${editingProduct.title}".`);
                            setConfirmDeleteProductId(null);
                            setEditingProduct(null);
                          } catch (err) {
                            setError(err instanceof Error ? err.message : String(err));
                          } finally {
                            setBusy(false);
                          }
                        }}
                        className="bg-[#FF1E1E] px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                      >
                        Confirm Delete
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirmDeleteProductId(null)}
                        className="border border-[#333] bg-[#141414] px-2.5 py-1 text-xs text-neutral-300 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirmDeleteProductId(editingProduct.id)}
                      className="inline-flex items-center gap-1.5 border border-red-900/60 bg-red-950/20 px-3 py-2 text-xs text-red-300 hover:text-white"
                    >
                      <Trash2 size={13} />
                      <span>Delete Product</span>
                    </button>
                  )
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="border border-[#333] bg-[#141414] px-4 py-2 text-xs text-neutral-200 hover:text-white"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="bg-[#FF1E1E] px-5 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    {busy ? 'Saving…' : 'Save Creative Product'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client View Preview Modal */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl border border-[#2B2B2B] bg-[#0B0B0B] p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-[#1E1E1E] pb-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">
                  Client Preview ({previewProduct.audience})
                </p>
                <h3 className="text-lg font-bold text-white">{previewProduct.title}</h3>
              </div>
              <button type="button" onClick={() => setPreviewProduct(null)} className="text-neutral-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-neutral-300">{previewProduct.description || previewProduct.summary}</p>
            <div className="border border-[#1E1E1E] bg-[#111] p-3 text-xs space-y-1">
              <p className="font-mono text-[10px] uppercase text-neutral-500">Client-Visible Approved Downloads</p>
              {getApprovedDownloadableFiles(previewProduct.files).length === 0 ? (
                <p className="text-neutral-400">
                  {previewProduct.accessType === 'RequestRequired'
                    ? 'Clients inspect specifications and submit a custom studio request.'
                    : 'No approved files published yet.'}
                </p>
              ) : (
                getApprovedDownloadableFiles(previewProduct.files).map(f => (
                  <div key={f.id} className="flex items-center justify-between text-neutral-200">
                    <span>{f.label}</span>
                    <span className="font-mono text-[10px] text-emerald-400">{f.fileFormat} · {f.fileSizeLabel}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Template Family & Multi-Design Packager Modal */}
      {showTemplatePackager && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="w-full max-w-5xl max-h-[90vh] flex flex-col border border-[#2B2B2B] bg-[#0B0B0B] shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E1E1E] bg-[#101010] px-5 py-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">
                  Admin Template-to-Product Packager
                </p>
                <h3 className="text-base font-bold text-white">
                  Select Master Layouts for &ldquo;{editingProduct.title || 'Creative Product'}&rdquo;
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplatePackager(false)}
                className="p-1.5 text-neutral-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="border-b border-[#1C1C1C] bg-[#0E0E0E] px-5 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'families', label: `Template Families (${TEMPLATE_FAMILIES.length})` },
                  { id: 'master', label: `Master Templates (${MASTER_CREATIVE_TEMPLATES.length})` },
                  { id: 'saved', label: `Saved Cloud Designs (${savedDesigns.length})` },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setPackagerSourceTab(tab.id as 'families' | 'master' | 'saved');
                      setPackagerFilter('All');
                    }}
                    className={`border px-3 py-1.5 text-xs font-medium ${
                      packagerSourceTab === tab.id
                        ? 'border-[#FF1E1E] bg-[#FF1E1E]/15 text-white'
                        : 'border-[#2A2A2A] bg-[#141414] text-neutral-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <input
                value={packagerFilter === 'All' ? '' : packagerFilter}
                onChange={e => setPackagerFilter(e.target.value || 'All')}
                placeholder="Filter layouts by family or title…"
                className="border border-[#2A2A2A] bg-[#141414] px-3 py-1.5 text-xs text-white w-60"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {packagerDesignsList.map(item => {
                const selected = selectedDesignIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`border p-3.5 flex flex-col justify-between gap-3 transition-colors ${
                      selected
                        ? 'border-[#FF1E1E] bg-[#FF1E1E]/10'
                        : 'border-[#222222] bg-[#111111] hover:border-[#3A3A3A]'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-mono uppercase text-neutral-400 truncate">{item.subtitle}</p>
                          <h4 className="text-xs font-bold text-white leading-snug mt-0.5">{item.title}</h4>
                        </div>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            setSelectedDesignIds(prev =>
                              selected ? prev.filter(id => id !== item.id) : [...prev, item.id],
                            )
                          }
                          className="accent-[#FF1E1E] mt-1 shrink-0"
                        />
                      </div>
                      <div
                        className="border border-[#262626] px-3 py-4 text-center space-y-1"
                        style={{ backgroundColor: item.design.backgroundColor || '#0A0A0A' }}
                      >
                        <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                          {item.design.width} × {item.design.height} px
                        </p>
                        <p className="text-xs font-bold text-white truncate">
                          {item.design.elements.find(el => el.type === 'text')?.text || item.title}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#1E1E1E]">
                      <span className="text-[10px] font-mono text-neutral-500">
                        {item.design.elements.length} layers
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowTemplatePackager(false);
                          setActiveCanvasSession({ product: editingProduct, design: item.design });
                        }}
                        className="inline-flex items-center gap-1 border border-[#333] bg-[#151515] px-2.5 py-1 text-[11px] text-white hover:border-[#FF1E1E]"
                      >
                        <Sparkles size={11} className="text-[#FF1E1E]" />
                        <span>Edit in Canvas</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-[#1E1E1E] bg-[#0F0F0F] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={setFirstRenderAsPreview}
                  onChange={e => setSetFirstRenderAsPreview(e.target.checked)}
                  className="accent-[#FF1E1E]"
                />
                <span>Use first rendered design as Product Preview Thumbnail</span>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono text-neutral-400 mr-2">
                  {selectedDesignIds.length} selected
                </span>
                <button
                  type="button"
                  disabled={busy || selectedDesignIds.length === 0}
                  onClick={() => void handleAttachSelectedTemplates('individual')}
                  className="border border-[#3A3A3A] bg-[#161616] px-3.5 py-2 text-xs font-semibold text-white hover:border-[#FF1E1E] disabled:opacity-40"
                >
                  Render &amp; Attach PNG + SVG Files
                </button>
                <button
                  type="button"
                  disabled={busy || selectedDesignIds.length === 0}
                  onClick={() => void handleAttachSelectedTemplates('zip')}
                  className="inline-flex items-center gap-1.5 bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-40"
                >
                  <FileArchive size={13} />
                  <span>Package Selected + PDF as ZIP</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Admin Design Canvas Session Bound to Product */}
      {activeCanvasSession && (
        <div className="fixed inset-0 z-50 bg-black/95 p-3 sm:p-5 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border border-[#242424] bg-[#0D0D0D] px-4 py-2 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles size={13} className="text-[#FF1E1E]" />
              <span className="font-mono uppercase tracking-wider text-white font-semibold">
                Product Canvas Authoring: {activeCanvasSession.product.title || 'New Product'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveCanvasSession(null)}
              className="border border-[#333] bg-[#141414] px-3 py-1 text-xs text-neutral-300 hover:text-white"
            >
              Return to Product Manager
            </button>
          </div>
          <DesignCanvasEditor
            initialDesign={activeCanvasSession.design}
            targetProjectTitle={activeCanvasSession.product.title || 'Creative Product'}
            saveAssetLabel="Save Internal Working Render"
            onClose={() => setActiveCanvasSession(null)}
            onSaveDesign={async savedDesign => {
              if (!firebaseUser) return;
              await saveProductInternalSpec({
                productId: activeCanvasSession.product.id,
                productionNotes: internalNotes,
                internalCanvasDesignJson: JSON.stringify(savedDesign),
                sourceFiles: internalSourceFiles,
                updatedBy: firebaseUser.uid,
              });
              setNotice(`Saved internal Canvas layout JSON for "${activeCanvasSession.product.title || 'product'}".`);
            }}
            onSaveAsWorkingAsset={async (blob, renderedDesign) => {
              if (!firebaseUser) return;
              const rec = await uploadProductDeliverableFile({
                productId: activeCanvasSession.product.id,
                file: blob,
                fileName: `${renderedDesign.name || 'canvas-source'}.png`,
                label: `${renderedDesign.name} (Internal Render)`,
                dimensions: `${renderedDesign.width} × ${renderedDesign.height} px`,
                version: activeCanvasSession.product.version || 'v1.0',
                isApprovedForClient: false,
                isInternalSource: true,
                uploadedBy: firebaseUser.uid,
              });
              const nextSources = [rec, ...internalSourceFiles];
              setInternalSourceFiles(nextSources);
              await saveProductInternalSpec({
                productId: activeCanvasSession.product.id,
                productionNotes: internalNotes,
                internalCanvasDesignJson: JSON.stringify(renderedDesign),
                sourceFiles: nextSources,
                updatedBy: firebaseUser.uid,
              });
              setNotice(`Saved internal render "${rec.fileName}" to admin-only product sources.`);
            }}
            onSaveAsDeliverable={async (blob, renderedDesign, format) => {
              if (!firebaseUser) return;
              try {
                const ext = format === 'jpeg' ? 'jpg' : 'png';
                const slugName = slugifyProductTitle(renderedDesign.name || 'product-deliverable');
                const rasterRec = await uploadProductDeliverableFile({
                  productId: activeCanvasSession.product.id,
                  file: blob,
                  fileName: `${slugName}.${ext}`,
                  label: `${renderedDesign.name || 'Studio Deliverable'} (${ext.toUpperCase()})`,
                  dimensions: `${renderedDesign.width} × ${renderedDesign.height} px`,
                  version: activeCanvasSession.product.version || 'v1.0',
                  isApprovedForClient: true,
                  isInternalSource: false,
                  uploadedBy: firebaseUser.uid,
                });

                const svgBlob = renderCanvasDesignToSvgBlob(renderedDesign);
                const svgRec = await uploadProductDeliverableFile({
                  productId: activeCanvasSession.product.id,
                  file: svgBlob,
                  fileName: `${slugName}.svg`,
                  label: `${renderedDesign.name || 'Studio Deliverable'} (Editable Vector SVG)`,
                  dimensions: `${renderedDesign.width} × ${renderedDesign.height} px`,
                  version: activeCanvasSession.product.version || 'v1.0',
                  isApprovedForClient: true,
                  isInternalSource: false,
                  uploadedBy: firebaseUser.uid,
                });

                const targetProduct = editingProduct?.id === activeCanvasSession.product.id
                  ? editingProduct
                  : activeCanvasSession.product;
                const nextProduct: CreativeProduct = {
                  ...targetProduct,
                  title: targetProduct.title || renderedDesign.name || 'Creative Product',
                  files: [rasterRec, svgRec, ...(targetProduct.files || [])],
                  supportedFormats: Array.from(
                    new Set([...(targetProduct.supportedFormats || []), ext.toUpperCase(), 'SVG']),
                  ),
                  linkedCanvasDesignId: renderedDesign.id,
                };
                const saved = await saveCreativeProduct({
                  ...nextProduct,
                  deliverablesSummary: deliverablesText
                    ? deliverablesText.split('\n').map(s => s.trim()).filter(Boolean)
                    : targetProduct.deliverablesSummary,
                  updatedBy: firebaseUser.uid,
                });
                setEditingProduct(saved);
                setIsNewDraft(false);
                setNotice(
                  `Attached ${ext.toUpperCase()} + editable SVG deliverables ("${rasterRec.fileName}" & "${svgRec.fileName}") to "${saved.title}".`,
                );
              } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
              }
            }}
          />
        </div>
      )}

      {/* Monthly Drop Create / Edit Modal */}
      {editingDrop && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={e => void handleSaveDrop(e)}
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-[#2B2B2B] bg-[#0B0B0B] p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#1E1E1E] pb-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">
                  Monthly Creative Drop Curation
                </p>
                <h3 className="text-lg font-bold text-white">{editingDrop.title || 'New Monthly Drop'}</h3>
              </div>
              <button type="button" onClick={() => setEditingDrop(null)} className="text-neutral-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Drop Title *</span>
                <input
                  required
                  value={editingDrop.title}
                  onChange={e => setEditingDrop({ ...editingDrop, title: e.target.value })}
                  className="w-full border border-[#2A2A2A] bg-[#141414] px-3 py-2 text-white"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Month Key (YYYY-MM)</span>
                <input
                  required
                  value={editingDrop.monthKey}
                  onChange={e => setEditingDrop({ ...editingDrop, monthKey: e.target.value })}
                  placeholder="2026-11"
                  className="w-full border border-[#2A2A2A] bg-[#141414] px-3 py-2 text-white font-mono"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Audience</span>
                <select
                  value={editingDrop.audience}
                  onChange={e => setEditingDrop({ ...editingDrop, audience: e.target.value as CreativeProductAudience })}
                  className="w-full border border-[#2A2A2A] bg-[#141414] px-3 py-2 text-white"
                >
                  {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Access Level</span>
                <select
                  value={editingDrop.accessLevel}
                  onChange={e => setEditingDrop({ ...editingDrop, accessLevel: e.target.value as CreativeDropAccessLevel })}
                  className="w-full border border-[#2A2A2A] bg-[#141414] px-3 py-2 text-white"
                >
                  <option value="Free">Free / Open to Matching Workspaces</option>
                  <option value="Restricted">Restricted (Follows Product Package Locks)</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Status</span>
                <select
                  value={editingDrop.status}
                  onChange={e => setEditingDrop({ ...editingDrop, status: e.target.value as CreativeDropStatus })}
                  className="w-full border border-[#2A2A2A] bg-[#141414] px-3 py-2 text-white"
                >
                  <option value="Draft">Draft</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Published">Published</option>
                  <option value="Archived">Archived</option>
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Headline</span>
                <input
                  value={editingDrop.headline}
                  onChange={e => setEditingDrop({ ...editingDrop, headline: e.target.value })}
                  className="w-full border border-[#2A2A2A] bg-[#141414] px-3 py-2 text-white"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Description</span>
                <textarea
                  rows={2}
                  value={editingDrop.description}
                  onChange={e => setEditingDrop({ ...editingDrop, description: e.target.value })}
                  className="w-full border border-[#2A2A2A] bg-[#141414] px-3 py-2 text-white"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Highlight Tags (comma separated)</span>
                <input
                  value={dropTagsText}
                  onChange={e => setDropTagsText(e.target.value)}
                  placeholder="Spotify Canvas, Rollout Countdown, Instant Export"
                  className="w-full border border-[#2A2A2A] bg-[#141414] px-3 py-2 text-white"
                />
              </label>
              <div className="sm:col-span-2 space-y-2 border border-[#1E1E1E] bg-[#0F0F0F] p-3">
                <p className="text-[10px] font-mono uppercase text-neutral-400">
                  Included Creative Resources ({editingDrop.productIds.length} selected)
                </p>
                <div className="max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 pr-1">
                  {products.map(prod => {
                    const checked = editingDrop.productIds.includes(prod.id);
                    return (
                      <label key={prod.id} className="flex items-center gap-2 border border-[#1D1D1D] bg-[#131313] px-2.5 py-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setEditingDrop({
                              ...editingDrop,
                              productIds: checked
                                ? editingDrop.productIds.filter(id => id !== prod.id)
                                : [...editingDrop.productIds, prod.id],
                            })
                          }
                          className="accent-[#FF1E1E]"
                        />
                        <span className="truncate text-white">{prod.title}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#1E1E1E] pt-3">
              <button
                type="button"
                onClick={() => setEditingDrop(null)}
                className="border border-[#333] bg-[#141414] px-4 py-2 text-xs text-neutral-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="bg-[#FF1E1E] px-5 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {busy ? 'Saving…' : 'Save Monthly Drop'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminCreativeProducts;

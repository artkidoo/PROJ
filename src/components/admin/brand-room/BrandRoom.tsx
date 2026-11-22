import React, { useEffect, useState } from 'react';
import {
  Archive,
  BarChart3,
  Briefcase,
  Calendar,
  Film,
  FolderKanban,
  Globe,
  Layers,
  LayoutDashboard,
  Megaphone,
  Music,
  Palette,
  Printer,
  Send,
  Share2,
  ShieldAlert,
  Target,
} from 'lucide-react';
import {
  collection,
  doc,
  getDocFromServer,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { isAdminRecordActive } from '../../../lib/firebaseAuth';
import { useApp } from '../../../context/AppContext';
import type { ClientProject } from '../../../types';
import type { CreativeProduct } from '../../../types/creativeProduct';
import type {
  BrandRoomSection,
  ContentPillar,
  ContentSeries,
  KeedoBrandIdentity,
  MarketingAsset,
  MarketingFormatSpec,
} from '../../../types/brandRoom';
import type { CanvasDesign } from '../../../types/designStudio';
import {
  DEFAULT_BRAND_IDENTITY,
  DEFAULT_CONTENT_PILLARS,
  DEFAULT_CONTENT_SERIES,
} from '../../../lib/brandRoomStudio';
import {
  ensureDefaultBrandIdentity,
  exportAndSaveCanvasToBrandRoom,
  saveMarketingAsset,
  seedDefaultPillarsAndSeries,
} from '../../../lib/brandRoomService';
import { DesignCanvasEditor } from '../../studio/DesignCanvasEditor';
import { BrandIdentityPanel } from './BrandIdentityPanel';
import { ContentCalendarPublishingPanel } from './ContentCalendarPublishingPanel';
import { ContentStrategyPanel } from './ContentStrategyPanel';
import { MarketingAnalyticsPanel } from './MarketingAnalyticsPanel';
import { MarketingAssetLibraryPanel, StudioLaunchPreset } from './MarketingAssetLibraryPanel';
import { MarketingOverviewPanel } from './MarketingOverviewPanel';
import { MarketingStudioPanel } from './MarketingStudioPanel';
import { PortfolioShowcasesPanel } from './PortfolioShowcasesPanel';
import keedohubBrandLogo from '../../../assets/images/keedohub_brand_logo_1795340542093.jpg';

interface BrandRoomNavEntry {
  id: BrandRoomSection;
  label: string;
  group: 'Command' | 'Identity & Studio' | 'Channels & Verticals' | 'Strategy & Telemetry';
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const BRAND_ROOM_SECTIONS: BrandRoomNavEntry[] = [
  { id: 'marketing-overview', label: '1. Overview', group: 'Command', icon: LayoutDashboard },
  { id: 'brand-identity', label: '2. Brand Identity', group: 'Identity & Studio', icon: Palette },
  { id: 'marketing-design-studio', label: '3. Design Studio', group: 'Identity & Studio', icon: Layers },
  { id: 'social-media-library', label: '4. Social Media', group: 'Channels & Verticals', icon: Share2 },
  { id: 'advertising-promotions', label: '5. Advertising & Promos', group: 'Channels & Verticals', icon: Megaphone },
  { id: 'portfolio-showcases', label: '6. Portfolio Showcases', group: 'Channels & Verticals', icon: FolderKanban },
  { id: 'artist-marketing', label: '7. Artist Marketing', group: 'Channels & Verticals', icon: Music },
  { id: 'brand-business-marketing', label: '8. Brand & Business', group: 'Channels & Verticals', icon: Briefcase },
  { id: 'motion-video-marketing', label: '9. Motion & Video', group: 'Channels & Verticals', icon: Film },
  { id: 'website-digital-marketing', label: '10. Website & Digital', group: 'Channels & Verticals', icon: Globe },
  { id: 'print-offline-marketing', label: '11. Print & Offline', group: 'Channels & Verticals', icon: Printer },
  { id: 'content-strategy', label: '12. Strategy & Pillars', group: 'Strategy & Telemetry', icon: Target },
  { id: 'content-calendar', label: '13. Content Calendar', group: 'Strategy & Telemetry', icon: Calendar },
  { id: 'publishing-management', label: '14. Publishing Queue', group: 'Strategy & Telemetry', icon: Send },
  { id: 'marketing-archive', label: '15. Marketing Archive', group: 'Strategy & Telemetry', icon: Archive },
  { id: 'marketing-analytics', label: '16. Analytics', group: 'Strategy & Telemetry', icon: BarChart3 },
];

interface ActiveCanvasSession {
  design: CanvasDesign;
  format: MarketingFormatSpec;
  existingAsset?: MarketingAsset | null;
  draftMetadata: Omit<
    MarketingAsset,
    'id' | 'createdAt' | 'updatedAt' | 'exportedFiles' | 'version' | 'versionHistory' | 'reuseCount'
  >;
}

function defaultIdentitySnapshot(uid: string): KeedoBrandIdentity {
  return {
    ...DEFAULT_BRAND_IDENTITY,
    id: 'keedohub',
    updatedAt: new Date().toISOString(),
    updatedBy: uid,
  };
}

function fallbackDefaultPillars(uid: string): ContentPillar[] {
  const now = new Date().toISOString();
  return DEFAULT_CONTENT_PILLARS.map(p => ({
    ...p,
    createdAt: now,
    updatedAt: now,
    createdBy: uid,
  }));
}

function fallbackDefaultSeries(uid: string): ContentSeries[] {
  const now = new Date().toISOString();
  return DEFAULT_CONTENT_SERIES.map(s => ({
    ...s,
    createdAt: now,
    updatedAt: now,
    createdBy: uid,
  }));
}

export const BrandRoom: React.FC = () => {
  const { firebaseUser, clientProfile, canAccessAdminCenter } = useApp();

  const [authStatus, setAuthStatus] = useState<'checking' | 'authorized' | 'denied'>(() =>
    firebaseUser && canAccessAdminCenter ? 'checking' : 'denied',
  );
  const [activeSection, setActiveSection] = useState<BrandRoomSection>('marketing-overview');

  // Firestore collections state
  const [identity, setIdentity] = useState<KeedoBrandIdentity>(() =>
    defaultIdentitySnapshot(firebaseUser?.uid || 'system'),
  );
  const [pillars, setPillars] = useState<ContentPillar[]>(() =>
    fallbackDefaultPillars(firebaseUser?.uid || 'system'),
  );
  const [series, setSeries] = useState<ContentSeries[]>(() =>
    fallbackDefaultSeries(firebaseUser?.uid || 'system'),
  );
  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [products, setProducts] = useState<CreativeProduct[]>([]);

  const [studioPreset, setStudioPreset] = useState<StudioLaunchPreset | null>(null);
  const [canvasSession, setCanvasSession] = useState<ActiveCanvasSession | null>(null);
  const [canvasNotice, setCanvasNotice] = useState('');
  const [canvasError, setCanvasError] = useState('');

  // Strict server-verified Admin check (fail-closed)
  useEffect(() => {
    let active = true;
    if (!firebaseUser || !canAccessAdminCenter) {
      setAuthStatus('denied');
      return;
    }
    setAuthStatus('checking');
    getDocFromServer(doc(db, 'admins', firebaseUser.uid))
      .then(snap => {
        if (!active) return;
        setAuthStatus(isAdminRecordActive(snap) ? 'authorized' : 'denied');
      })
      .catch(() => {
        if (!active) return;
        setAuthStatus('denied');
      });
    return () => {
      active = false;
    };
  }, [firebaseUser, canAccessAdminCenter]);

  // Real-time Brand Room subscriptions (only after verified Admin check passes)
  useEffect(() => {
    if (authStatus !== 'authorized' || !firebaseUser) return;

    void ensureDefaultBrandIdentity(firebaseUser.uid).catch(() => {});
    void seedDefaultPillarsAndSeries(firebaseUser.uid).catch(() => {});

    const unsubIdentity = onSnapshot(
      doc(db, 'brandRoomIdentity', 'keedohub'),
      snap => {
        if (snap.exists()) {
          setIdentity(snap.data() as KeedoBrandIdentity);
        }
      },
      () => {},
    );

    const unsubPillars = onSnapshot(
      collection(db, 'brandRoomPillars'),
      snap => {
        const list = snap.docs.map(d => d.data() as ContentPillar);
        if (list.length > 0) {
          setPillars(list.sort((a, b) => a.name.localeCompare(b.name)));
        }
      },
      () => {},
    );

    const unsubSeries = onSnapshot(
      collection(db, 'brandRoomSeries'),
      snap => {
        const list = snap.docs.map(d => d.data() as ContentSeries);
        if (list.length > 0) {
          setSeries(list.sort((a, b) => a.name.localeCompare(b.name)));
        }
      },
      () => {},
    );

    const unsubAssets = onSnapshot(
      query(collection(db, 'brandRoomAssets'), orderBy('updatedAt', 'desc')),
      snap => {
        setAssets(snap.docs.map(d => d.data() as MarketingAsset));
      },
      () => {},
    );

    const unsubProjects = onSnapshot(
      collection(db, 'clientProjects'),
      snap => {
        setProjects(snap.docs.map(d => ({ ...(d.data() as ClientProject), id: d.id })));
      },
      () => {},
    );

    const unsubProducts = onSnapshot(
      collection(db, 'creativeProducts'),
      snap => {
        setProducts(snap.docs.map(d => ({ ...(d.data() as CreativeProduct), id: d.id })));
      },
      () => {},
    );

    return () => {
      unsubIdentity();
      unsubPillars();
      unsubSeries();
      unsubAssets();
      unsubProjects();
      unsubProducts();
    };
  }, [authStatus, firebaseUser]);

  if (authStatus === 'checking') {
    return (
      <div className="border border-[#1E1E1E] bg-[#0B0B0B] p-8 text-xs font-mono text-neutral-400">
        Verifying Admin HQ authorization for Brand Room...
      </div>
    );
  }

  if (authStatus !== 'authorized' || !firebaseUser) {
    return (
      <div className="border border-red-900 bg-red-950/20 p-6 flex items-start gap-3">
        <ShieldAlert size={18} className="text-[#FF1E1E] shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <p className="font-bold text-white uppercase tracking-wider">
            Admin-Only Access Required
          </p>
          <p className="text-neutral-400">
            KeedoHub Brand Room is an internal executive marketing suite restricted to verified platform administrators. Client workspaces cannot access this module.
          </p>
        </div>
      </div>
    );
  }

  const adminName = clientProfile?.displayName || firebaseUser.email || 'KeedoHub Admin';

  const launchStudioWithPreset = (preset: StudioLaunchPreset) => {
    setStudioPreset(preset);
    setActiveSection('marketing-design-studio');
  };

  return (
    <div className="space-y-6">
      {/* 16-Section Sub-Navigation Grid */}
      <nav
        aria-label="KeedoHub Brand Room sections"
        className="border border-[#1E1E1E] bg-[#0B0B0B] p-3 space-y-2.5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2.5">
            <img
              src={keedohubBrandLogo}
              alt="KeedoHub Logo"
              referrerPolicy="no-referrer"
              className="h-7 w-7 object-cover border border-[#262626] shrink-0"
            />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF1E1E]">
              KeedoHub Brand Room · 16 Marketing Modules
            </span>
          </div>
          <span className="text-[10px] font-mono text-neutral-500">
            {assets.length} Stored Assets · {identity.assets?.length || 0} Identity Marks · {pillars.length} Pillars
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
          {BRAND_ROOM_SECTIONS.map(entry => {
            const Icon = entry.icon;
            const isActive = activeSection === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setActiveSection(entry.id)}
                className={`flex items-center gap-1.5 px-2.5 py-2 text-[11px] font-medium text-left border transition-colors ${
                  isActive
                    ? 'border-[#FF1E1E] bg-[#FF1E1E] text-white font-bold'
                    : 'border-[#1E1E1E] bg-[#111111] text-neutral-400 hover:text-white hover:border-[#333333]'
                }`}
              >
                <Icon
                  size={12}
                  className={isActive ? 'text-white shrink-0' : 'text-[#FF1E1E] shrink-0'}
                />
                <span className="truncate">{entry.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {canvasNotice && (
        <div className="border border-emerald-900 bg-emerald-950/30 px-4 py-2.5 text-xs text-emerald-300 flex items-center justify-between">
          <span>{canvasNotice}</span>
          <button
            type="button"
            onClick={() => setCanvasNotice('')}
            className="text-emerald-400 hover:text-white font-mono text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}
      {canvasError && (
        <div className="border border-red-900 bg-red-950/30 px-4 py-2.5 text-xs text-red-300 flex items-center justify-between">
          <span>{canvasError}</span>
          <button
            type="button"
            onClick={() => setCanvasError('')}
            className="text-red-400 hover:text-white font-mono text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active Section View */}
      {activeSection === 'marketing-overview' && (
        <MarketingOverviewPanel
          identity={identity}
          assets={assets}
          pillars={pillars}
          series={series}
          onNavigateSection={setActiveSection}
          onQuickCreate={aud =>
            launchStudioWithPreset({
              audience: aud || 'All Audiences',
              categoryArea:
                aud === 'Artists'
                  ? 'Artist Marketing'
                  : aud === 'Brands & Businesses'
                    ? 'Brand & Business Marketing'
                    : 'Advertising & Promotions',
            })
          }
        />
      )}

      {activeSection === 'brand-identity' && (
        <BrandIdentityPanel identity={identity} adminUid={firebaseUser.uid} />
      )}

      {activeSection === 'marketing-design-studio' && (
        <MarketingStudioPanel
          assets={assets}
          pillars={pillars}
          series={series}
          adminUid={firebaseUser.uid}
          initialPreset={studioPreset}
          onConsumeInitialPreset={() => setStudioPreset(null)}
          onOpenCanvasEditor={session => {
            setCanvasError('');
            setCanvasNotice('');
            setCanvasSession(session);
          }}
        />
      )}

      {(activeSection === 'social-media-library' ||
        activeSection === 'advertising-promotions' ||
        activeSection === 'artist-marketing' ||
        activeSection === 'brand-business-marketing' ||
        activeSection === 'motion-video-marketing' ||
        activeSection === 'website-digital-marketing' ||
        activeSection === 'print-offline-marketing' ||
        activeSection === 'marketing-archive') && (
        <MarketingAssetLibraryPanel
          section={activeSection}
          assets={assets}
          pillars={pillars}
          series={series}
          adminUid={firebaseUser.uid}
          onLaunchStudio={launchStudioWithPreset}
          onOpenAssetInCanvas={(asset, design, format) => {
            setCanvasSession({
              design,
              format,
              existingAsset: asset,
              draftMetadata: {
                title: asset.title,
                categoryArea: asset.categoryArea,
                topic: asset.topic,
                contentPillarId: asset.contentPillarId,
                contentPillarName: asset.contentPillarName,
                ...(asset.seriesId ? { seriesId: asset.seriesId, seriesName: asset.seriesName } : {}),
                contentType: asset.contentType,
                targetAudience: asset.targetAudience,
                platform: format.platform,
                formatId: format.id,
                formatLabel: format.label,
                dimensions: `${format.width}×${format.height}px`,
                description: asset.description,
                caption: asset.caption,
                callToAction: asset.callToAction,
                hashtags: asset.hashtags,
                tags: asset.tags,
                status: asset.status,
                createdBy: asset.createdBy,
                updatedBy: firebaseUser.uid,
              },
            });
          }}
        />
      )}

      {activeSection === 'portfolio-showcases' && (
        <PortfolioShowcasesPanel
          projects={projects}
          products={products}
          onCreateShowcaseFromItem={preset => launchStudioWithPreset(preset)}
        />
      )}

      {activeSection === 'content-strategy' && (
        <ContentStrategyPanel
          pillars={pillars}
          series={series}
          adminUid={firebaseUser.uid}
          onStartDesignFromStrategy={params =>
            launchStudioWithPreset({
              title: params.title,
              pillarId: params.pillarId,
              pillarName: params.pillarName,
              seriesId: params.seriesId,
              seriesName: params.seriesName,
              audience: params.audience,
            })
          }
        />
      )}

      {activeSection === 'content-calendar' && (
        <ContentCalendarPublishingPanel
          mode="calendar"
          assets={assets}
          pillars={pillars}
          adminUid={firebaseUser.uid}
          adminName={adminName}
        />
      )}

      {activeSection === 'publishing-management' && (
        <ContentCalendarPublishingPanel
          mode="publishing"
          assets={assets}
          pillars={pillars}
          adminUid={firebaseUser.uid}
          adminName={adminName}
        />
      )}

      {activeSection === 'marketing-analytics' && (
        <MarketingAnalyticsPanel assets={assets} />
      )}

      {/* Fullscreen Internal Admin Design Canvas Editor Overlay */}
      {canvasSession && (
        <div className="fixed inset-0 z-50 bg-[#050505] flex flex-col">
          {canvasError && (
            <div
              role="alert"
              className="border-b border-red-900 bg-red-950/60 px-4 py-2.5 text-xs text-red-200 flex items-center justify-between gap-3 shrink-0"
            >
              <span>Export / Save Error: {canvasError}</span>
              <button
                type="button"
                onClick={() => setCanvasError('')}
                className="text-red-300 hover:text-white font-mono text-[11px] shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}
          <DesignCanvasEditor
            initialDesign={canvasSession.design}
            targetProjectTitle={`Brand Room · ${canvasSession.draftMetadata.title}`}
            saveAssetLabel="Export & Save to Brand Room"
            onClose={() => {
              setCanvasError('');
              setCanvasSession(null);
            }}
            onSaveDesign={async updatedDesign => {
              setCanvasError('');
              try {
                const saved = await saveMarketingAsset({
                  ...(canvasSession.existingAsset || {}),
                  ...canvasSession.draftMetadata,
                  id: canvasSession.existingAsset?.id,
                  canvasDesignJson: JSON.stringify(updatedDesign),
                  exportedFiles: canvasSession.existingAsset?.exportedFiles || [],
                  version: (canvasSession.existingAsset?.version || 0) + 1,
                  versionHistory: [
                    {
                      version: (canvasSession.existingAsset?.version || 0) + 1,
                      note: 'Saved editable Canvas master layout',
                      updatedAt: new Date().toISOString(),
                      updatedBy: firebaseUser.uid,
                    },
                    ...(canvasSession.existingAsset?.versionHistory || []),
                  ].slice(0, 50),
                  reuseCount: canvasSession.existingAsset?.reuseCount || 0,
                  updatedBy: firebaseUser.uid,
                });
                setCanvasSession(prev =>
                  prev
                    ? {
                        ...prev,
                        design: updatedDesign,
                        existingAsset: saved,
                      }
                    : null,
                );
                setCanvasNotice(`Saved editable Canvas draft for "${saved.title}".`);
              } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                setCanvasError(msg);
                throw err;
              }
            }}
            onSaveAsWorkingAsset={async (_blob, exportedDesign) => {
              setCanvasError('');
              const includePdf =
                canvasSession.format.platform === 'Print & Offline' ||
                canvasSession.format.recommendedFormats.includes('PDF');
              try {
                const saved = await exportAndSaveCanvasToBrandRoom({
                  existingAsset: canvasSession.existingAsset,
                  draftMetadata: canvasSession.draftMetadata,
                  design: exportedDesign,
                  format: canvasSession.format,
                  includePdf,
                  actorUid: firebaseUser.uid,
                });
                setCanvasSession(null);
                setCanvasNotice(
                  `Rendered & uploaded PNG, Editable SVG, Source JSON${
                    includePdf ? ', and PDF' : ''
                  } for "${saved.title}" into Brand Room library.`,
                );
              } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                setCanvasError(msg);
                throw err;
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default BrandRoom;

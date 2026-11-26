import React, { useMemo } from 'react';
import {
  ArrowRight,
  Calendar,
  FileCheck2,
  Layers,
  Megaphone,
  Palette,
  Sparkles,
  Upload,
} from 'lucide-react';
import type {
  BrandRoomSection,
  ContentPillar,
  ContentSeries,
  KeedoBrandIdentity,
  MarketingAsset,
} from '../../../types/brandRoom';
import { computeBrandRoomAnalytics } from '../../../lib/brandRoomService';
import { BrandRoomCanvasPreview } from './BrandRoomCanvasPreview';
import keedohubMarkTransparent from '../../../assets/images/keedohub_mark_transparent.png';

interface MarketingOverviewPanelProps {
  identity: KeedoBrandIdentity;
  assets: MarketingAsset[];
  pillars: ContentPillar[];
  series: ContentSeries[];
  onNavigateSection: (section: BrandRoomSection) => void;
  onQuickCreate: (audiencePreset?: 'Artists' | 'Brands & Businesses' | 'All Audiences') => void;
}

export const MarketingOverviewPanel: React.FC<MarketingOverviewPanelProps> = ({
  identity,
  assets,
  pillars,
  series,
  onNavigateSection,
  onQuickCreate,
}) => {
  const analytics = useMemo(() => computeBrandRoomAnalytics(assets), [assets]);
  const identityAssetCount = identity.assets?.length || 0;
  const recentAssets = useMemo(
    () =>
      [...assets]
        .filter(a => a.status !== 'Archived')
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 8),
    [assets],
  );

  const upcomingScheduled = useMemo(
    () =>
      assets
        .filter(a => a.status === 'Scheduled' || (a.publicationDate && a.status !== 'Published' && a.status !== 'Archived'))
        .sort((a, b) => (a.publicationDate || '9999').localeCompare(b.publicationDate || '9999'))
        .slice(0, 6),
    [assets],
  );

  return (
    <div className="space-y-6">
      {/* Editorial Brand Room Command Header */}
      <section className="border border-[#1E1E1E] bg-[#0B0B0B] p-5 sm:p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <div className="flex items-start gap-4 max-w-3xl">
          <img
            src={keedohubMarkTransparent}
            alt="KeedoHub Official Logo"
            referrerPolicy="no-referrer"
            className="h-14 w-14 object-contain bg-transparent shrink-0"
          />
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#FF1E1E]">
              KeedoHub Internal Creative Operations &amp; Marketing Kit
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
              {identity.companyName || 'KEEDOHUB'} <span className="text-[#FF1E1E]">Brand Room</span>
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              {identity.positioningStatement}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateSection('marketing-design-studio')}
            className="inline-flex items-center justify-center gap-1.5 bg-[#FF1E1E] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#e01919]"
          >
            <Sparkles size={13} />
            <span>Open Studio</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateSection('brand-identity')}
            className="inline-flex items-center justify-center gap-1.5 border border-[#2A2A2A] bg-[#141414] px-4 py-2.5 text-xs font-semibold text-white hover:border-[#FF1E1E]"
          >
            <Upload size={13} className="text-[#FF1E1E]" />
            <span>Brand Logos ({identityAssetCount})</span>
          </button>
          <button
            type="button"
            onClick={() => onQuickCreate('Artists')}
            className="inline-flex items-center justify-center gap-1.5 border border-[#2A2A2A] bg-[#121212] px-4 py-2.5 text-xs font-semibold text-neutral-200 hover:border-[#FF1E1E]"
          >
            <span>+ Artist Promo</span>
          </button>
          <button
            type="button"
            onClick={() => onQuickCreate('Brands & Businesses')}
            className="inline-flex items-center justify-center gap-1.5 border border-[#2A2A2A] bg-[#121212] px-4 py-2.5 text-xs font-semibold text-neutral-200 hover:border-[#FF1E1E]"
          >
            <span>+ Brand/B2B Ad</span>
          </button>
        </div>
      </section>

      {/* Live Operations KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: 'Total Marketing Assets',
            value: analytics.totalAssets,
            sub: `${analytics.totalExportFiles} stored exports`,
            target: 'social-media-library' as BrandRoomSection,
          },
          {
            label: 'Official Identity Files',
            value: identityAssetCount,
            sub: identityAssetCount === 0 ? 'Upload official logos' : 'Logos & textures live',
            target: 'brand-identity' as BrandRoomSection,
          },
          {
            label: 'Draft & Planned',
            value: analytics.draftCount + analytics.plannedCount,
            sub: 'In creative production',
            target: 'marketing-design-studio' as BrandRoomSection,
          },
          {
            label: 'Approved / Scheduled',
            value: analytics.approvedCount + analytics.scheduledCount,
            sub: 'Ready for publishing',
            target: 'content-calendar' as BrandRoomSection,
          },
          {
            label: 'Published Entries',
            value: analytics.publishedCount,
            sub: 'Human-verified live',
            target: 'publishing-management' as BrandRoomSection,
          },
          {
            label: 'Strategy Pillars & Series',
            value: `${pillars.length} / ${series.length}`,
            sub: '15 Pillars · 10 Series',
            target: 'content-strategy' as BrandRoomSection,
          },
        ].map(card => (
          <button
            key={card.label}
            type="button"
            onClick={() => onNavigateSection(card.target)}
            className="border border-[#1E1E1E] bg-[#0B0B0B] p-4 text-left hover:border-[#FF1E1E] transition-colors flex flex-col justify-between gap-2"
          >
            <div className="text-[11px] font-mono text-neutral-400 leading-tight">{card.label}</div>
            <div className="text-2xl font-black text-white font-mono tabular-nums">
              {card.value}
            </div>
            <div className="text-[10px] font-mono text-neutral-500">{card.sub}</div>
          </button>
        ))}
      </section>

      {/* Brand Identity Storage Slot Guidance when Vault has 0 additional uploads */}
      {identityAssetCount === 0 && (
        <section className="border border-[#2A2A2A] bg-[#0E0E0E] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Palette size={18} className="text-[#FF1E1E] shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-300 space-y-0.5">
              <p className="font-bold text-white">
                Master Red-K KH Logo Active · Upload Additional Vault Variants (SVG / Transparent / Print)
              </p>
              <p className="text-neutral-400">
                The official Red-K KH master logo is active across headers and Brand Room templates. Upload vector SVGs, alpha-channel PNGs, light/dark variants, textures, and patterns into your private Storage vault when needed.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateSection('brand-identity')}
            className="shrink-0 inline-flex items-center gap-1.5 bg-[#FF1E1E] px-4 py-2 text-xs font-bold text-white"
          >
            <span>Open Identity Vault</span>
            <ArrowRight size={13} />
          </button>
        </section>
      )}

      {/* Channel & Vertical Shortcuts Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
            Brand Room Production Channels
          </h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            {
              section: 'brand-identity' as BrandRoomSection,
              title: 'Brand Identity System',
              desc: 'Official logos, Red & Black palette, typography, voice, guidelines',
              icon: Palette,
            },
            {
              section: 'marketing-design-studio' as BrandRoomSection,
              title: 'Marketing Design Studio',
              desc: 'Canvas editor, multi-platform safe-area resize, templates & exports',
              icon: Layers,
            },
            {
              section: 'artist-marketing' as BrandRoomSection,
              title: 'Artist-Focused Marketing',
              desc: 'Cover art, streaming packs, EPKs, lyric videos, artist career promos',
              icon: Sparkles,
            },
            {
              section: 'brand-business-marketing' as BrandRoomSection,
              title: 'Brand & Business Marketing',
              desc: 'Brand identity, profiles, proposals, invoices, collateral promos',
              icon: Megaphone,
            },
            {
              section: 'advertising-promotions' as BrandRoomSection,
              title: 'Advertising & Promotions',
              desc: 'Service offers, launches, seasonal campaigns, retargeting',
              icon: Megaphone,
            },
            {
              section: 'motion-video-marketing' as BrandRoomSection,
              title: 'Motion & Video Marketing',
              desc: 'Reels, TikTok, YouTube Shorts, visualisers, motion posters',
              icon: FileCheck2,
            },
            {
              section: 'website-digital-marketing' as BrandRoomSection,
              title: 'Website & Digital Marketing',
              desc: 'Homepage heroes, service strips, email headers & display graphics',
              icon: Layers,
            },
            {
              section: 'print-offline-marketing' as BrandRoomSection,
              title: 'Print & Offline Marketing',
              desc: '300-DPI flyers, posters, brochures, banners & PDF proofing',
              icon: Calendar,
            },
          ].map(shortcut => {
            const Icon = shortcut.icon;
            return (
              <button
                key={shortcut.section}
                type="button"
                onClick={() => onNavigateSection(shortcut.section)}
                className="border border-[#1E1E1E] bg-[#0B0B0B] p-4 text-left hover:border-[#FF1E1E] transition-colors flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{shortcut.title}</span>
                  <Icon size={14} className="text-[#FF1E1E] shrink-0" />
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">{shortcut.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recent Production Assets & Upcoming Calendar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
              Recent Active Marketing Assets ({recentAssets.length})
            </h4>
            <button
              type="button"
              onClick={() => onNavigateSection('social-media-library')}
              className="text-xs font-mono text-[#FF1E1E] hover:underline"
            >
              Open Full Library →
            </button>
          </div>
          {recentAssets.length === 0 ? (
            <div className="border border-[#1E1E1E] bg-[#0B0B0B] p-6 text-xs text-neutral-400">
              No marketing assets created yet. Open the Marketing Design Studio to customize a KeedoHub master template or upload campaign artwork.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {recentAssets.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigateSection('social-media-library')}
                  className="border border-[#1E1E1E] bg-[#0B0B0B] text-left hover:border-[#FF1E1E] transition-colors overflow-hidden flex flex-col"
                >
                  <div className="aspect-[4/3] bg-[#060606] border-b border-[#191919] p-1.5 flex items-center justify-center">
                    <BrandRoomCanvasPreview
                      canvasDesignJson={item.canvasDesignJson}
                      previewUrl={item.previewUrl}
                      title={item.title}
                      maxHeightPx={130}
                    />
                  </div>
                  <div className="p-2.5 space-y-0.5">
                    <div className="text-[9px] font-mono uppercase text-[#FF1E1E] truncate">
                      {item.platform} · {item.status}
                    </div>
                    <div className="text-xs font-bold text-white truncate">{item.title}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
              Upcoming Schedule ({upcomingScheduled.length})
            </h4>
            <button
              type="button"
              onClick={() => onNavigateSection('content-calendar')}
              className="text-xs font-mono text-[#FF1E1E] hover:underline"
            >
              Calendar →
            </button>
          </div>
          <div className="border border-[#1E1E1E] bg-[#0B0B0B] divide-y divide-[#181818]">
            {upcomingScheduled.length === 0 ? (
              <div className="p-5 text-xs text-neutral-400">
                No scheduled dates assigned yet.
              </div>
            ) : (
              upcomingScheduled.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigateSection('content-calendar')}
                  className="w-full p-3.5 text-left hover:bg-[#111111] space-y-0.5"
                >
                  <div className="text-[10px] font-mono text-[#FF1E1E] tabular-nums">
                    {item.publicationDate || 'Pending Date'} · {item.platform} · {item.status}
                  </div>
                  <div className="text-xs font-bold text-white truncate">{item.title}</div>
                  <div className="text-[10px] text-neutral-500 truncate">
                    {item.contentPillarName || item.categoryArea}
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

import React from 'react';
import { ArrowUpRight, FolderKanban, Package, Sparkles } from 'lucide-react';
import type { ClientProject } from '../../../types';
import type { CreativeProduct } from '../../../types/creativeProduct';
import type {
  MarketingCategoryArea,
  MarketingPlatform,
  MarketingTargetAudience,
} from '../../../types/brandRoom';
import { PORTFOLIO_ITEMS } from '../../../data/publicContent';

interface PortfolioShowcasesPanelProps {
  projects: ClientProject[];
  products: CreativeProduct[];
  onCreateShowcaseFromItem: (preset: {
    title: string;
    categoryArea: MarketingCategoryArea;
    topic: string;
    audience: MarketingTargetAudience;
    platform: MarketingPlatform;
    formatId: string;
    templateId: string;
  }) => void;
}

export const PortfolioShowcasesPanel: React.FC<PortfolioShowcasesPanelProps> = ({
  projects,
  products,
  onCreateShowcaseFromItem,
}) => {
  const completedProjects = projects.filter(
    p => p.status === 'Completed' || p.stage === 'Delivered' || p.progress >= 80,
  );
  const publishedProducts = products.filter(p => p.status === 'Published');

  return (
    <div className="space-y-8">
      <div className="border border-[#1E1E1E] bg-[#0B0B0B] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF1E1E]">
            Authentic Work &amp; Studio Proof
          </p>
          <h3 className="mt-1 text-base font-bold text-white">
            Portfolio &amp; Project Showcases
          </h3>
          <p className="mt-1 text-xs text-neutral-400">
            Turn live completed client projects, published Creative Hub packs, and studio visual studies into KeedoHub showcase graphics—with zero fabricated testimonials or invented outcomes.
          </p>
        </div>
        <span className="text-xs font-mono text-neutral-400 tabular-nums shrink-0">
          {completedProjects.length} Completed Projects · {publishedProducts.length} Published Packs
        </span>
      </div>

      {/* Live Completed Production Projects */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <FolderKanban size={15} className="text-[#FF1E1E]" />
            <span>Live Client Production Projects Ready for Showcase</span>
          </h4>
        </div>

        {completedProjects.length === 0 ? (
          <div className="border border-[#1E1E1E] bg-[#0B0B0B] p-6 text-xs text-neutral-400">
            No completed or near-delivery `clientProjects` records were found yet. Live completed projects will automatically appear here as Admin HQ marks them Delivered or Completed.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {completedProjects.map(proj => (
              <article
                key={proj.id}
                className="border border-[#1E1E1E] bg-[#0B0B0B] p-4 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono text-neutral-400 tabular-nums truncate">
                    {proj.category} · {proj.stage || proj.status} · {proj.progress}%
                  </div>
                  <h5 className="text-sm font-bold text-white line-clamp-2">
                    {proj.title}
                  </h5>
                  <p className="text-xs text-neutral-400 line-clamp-3">
                    {proj.description || 'Production scope managed in KeedoHub Admin HQ.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onCreateShowcaseFromItem({
                      title: `Case Study: ${proj.title}`,
                      categoryArea: 'Portfolio & Showcases',
                      topic: 'Completed design projects',
                      audience: 'All Audiences',
                      platform: 'Instagram',
                      formatId: 'ig-feed-portrait',
                      templateId: 'mkt-tpl-portfolio-showcase',
                    })
                  }
                  className="w-full inline-flex items-center justify-center gap-1.5 border border-[#282828] bg-[#141414] px-3 py-1.5 text-[11px] font-semibold text-white hover:border-[#FF1E1E]"
                >
                  <Sparkles size={12} className="text-[#FF1E1E]" />
                  <span>Build Showcase Post</span>
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Published Creative Hub Products */}
      <section className="space-y-3">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Package size={15} className="text-[#FF1E1E]" />
          <span>Published Creative Hub Products ({publishedProducts.length})</span>
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {publishedProducts.slice(0, 8).map(product => (
            <article
              key={product.id}
              className="border border-[#1E1E1E] bg-[#0B0B0B] p-3 flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                {product.previewImageUrl ? (
                  <div className="h-32 w-full bg-[#060606] border border-[#1B1B1B] overflow-hidden">
                    <img
                      src={product.previewImageUrl}
                      alt={product.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}
                <div className="text-[11px] font-mono text-neutral-400 truncate">
                  {product.audience} · {product.category}
                </div>
                <h5 className="text-xs font-bold text-white line-clamp-2">
                  {product.title}
                </h5>
                <p className="text-xs text-neutral-400 line-clamp-2">
                  {product.summary}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onCreateShowcaseFromItem({
                    title: `Product Spotlight: ${product.title}`,
                    categoryArea: 'Portfolio & Showcases',
                    topic: 'Creative case studies',
                    audience:
                      product.audience === 'Artist'
                        ? 'Artists'
                        : product.audience === 'Shared'
                          ? 'All Audiences'
                          : 'Brands & Businesses',
                    platform: 'Instagram',
                    formatId: 'ig-square',
                    templateId:
                      product.audience === 'Artist'
                        ? 'mkt-tpl-artist-release-support'
                        : 'mkt-tpl-brand-identity-ad',
                  })
                }
                className="w-full inline-flex items-center justify-center gap-1.5 border border-[#282828] bg-[#141414] px-3 py-1.5 text-[11px] font-semibold text-white hover:border-[#FF1E1E]"
              >
                <ArrowUpRight size={12} className="text-[#FF1E1E]" />
                <span>Promote Pack</span>
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Verified KeedoHub Studio Reference Studies (Explicitly Labeled Concepts) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white">
            KeedoHub Studio Reference Works (Sample Concepts)
          </h4>
          <span className="text-[11px] font-mono text-neutral-500">
            Clearly marked as studio concepts — no invented client results
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PORTFOLIO_ITEMS.map(item => (
            <article
              key={item.id}
              className="border border-[#1E1E1E] bg-[#0B0B0B] p-3 flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                <div className="h-44 w-full bg-[#060606] border border-[#1B1B1B] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="text-[11px] font-mono text-neutral-400 truncate">
                  {item.discipline} · {item.year}
                </div>
                <h5 className="text-sm font-bold text-white">{item.title}</h5>
                <p className="text-xs text-neutral-400 line-clamp-2">
                  {item.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onCreateShowcaseFromItem({
                    title: `Showcase: ${item.title}`,
                    categoryArea: 'Portfolio & Showcases',
                    topic: 'Project highlights',
                    audience: item.category === 'music' ? 'Artists' : 'Brands & Businesses',
                    platform: 'Instagram',
                    formatId: 'ig-feed-portrait',
                    templateId: 'mkt-tpl-portfolio-showcase',
                  })
                }
                className="w-full inline-flex items-center justify-center gap-1.5 border border-[#282828] bg-[#141414] px-3 py-1.5 text-[11px] font-semibold text-white hover:border-[#FF1E1E]"
              >
                <Sparkles size={12} className="text-[#FF1E1E]" />
                <span>Adapt to Marketing Post</span>
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

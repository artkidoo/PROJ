import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, MoveUpRight } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { PRICING_PACKAGES } from '../../data/publicContent';
import { db } from '../../lib/firebase';

interface Props {
  navigate: (r: PublicRoute, p?: string) => void;
}

export const PricingPage: React.FC<Props> = ({ navigate }) => {
  const [livePackages, setLivePackages] = useState<Array<{
    id: string;
    name: string;
    audience: string;
    tier: string;
    priceLabel: string;
    summary: string;
    deliverables: string[];
    revisions: string;
    turnaround: string;
  }>>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [audienceFilter, setAudienceFilter] = useState<'All' | 'Artist' | 'Brand' | 'Company'>('All');

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'services'), where('isActive', '==', true)),
      snapshot => {
        setLivePackages(
          snapshot.docs.map(item => {
            const service = item.data();
            return {
              id: item.id,
              name: typeof service.name === 'string' && service.name.trim() ? service.name : item.id,
              audience: typeof service.targetAudience === 'string' && service.targetAudience.trim() ? service.targetAudience : 'Artist & Brand',
              tier: typeof service.tier === 'string' && service.tier.trim() ? service.tier : 'Custom',
              priceLabel: `${
                typeof service.priceUsd === 'number' ? `$${service.priceUsd.toLocaleString()}` : 'Custom quote'
              } · ${typeof service.billingType === 'string' ? service.billingType : 'Scoped on brief'}`,
              summary: typeof service.description === 'string' ? service.description : '',
              deliverables: Array.isArray(service.deliverables)
                ? service.deliverables.filter((value): value is string => typeof value === 'string')
                : [],
              revisions:
                typeof service.revisionLimit === 'number' && service.revisionLimit < 0
                  ? 'Unlimited rounds'
                  : typeof service.revisionLimit === 'number'
                    ? `${service.revisionLimit} rounds`
                    : 'Confirmed per brief',
              turnaround:
                typeof service.turnaroundDays === 'number' && service.turnaroundDays > 0
                  ? `${service.turnaroundDays} business days`
                  : 'Confirmed per brief',
            };
          }),
        );
        setCatalogLoaded(true);
      },
      () => {
        setCatalogLoaded(true);
      },
    );
    return unsubscribe;
  }, []);

  const usingLivePackages = livePackages.length > 0;
  const visiblePackages = (usingLivePackages ? livePackages : PRICING_PACKAGES).filter(
    pkg =>
      audienceFilter === 'All' ||
      pkg.audience.toLowerCase().includes(audienceFilter.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased selection:bg-[#FF1E1E] selection:text-white">
      <PublicHeader current="pricing" navigate={navigate} />

      <main className="flex-1">
        <section className="px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="max-w-[1440px] mx-auto space-y-12">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#1E1E1E] pb-10">
              <div className="max-w-3xl space-y-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#FF1E1E]">
                  Packages &amp; Engagements
                </p>
                <h1 className="text-4xl sm:text-6xl font-black tracking-[-0.045em] text-white uppercase leading-[0.94]">
                  Structured Scope for Artists, Brands &amp; Companies.
                </h1>
                <p className="text-sm sm:text-base text-neutral-400 leading-7 max-w-2xl">
                  {usingLivePackages
                    ? 'Active studio packages published by KeedoHub.'
                    : 'Indicative creative frameworks outlining standard deliverables, revision rounds, and studio turnarounds. Final pricing is confirmed directly against your brief.'}
                </p>
              </div>

              <div
                className="flex flex-wrap gap-1 border border-[#242424] bg-[#101010] p-1 self-start lg:self-auto"
                role="group"
                aria-label="Filter packages by client type"
              >
                {(['All', 'Artist', 'Brand', 'Company'] as const).map(aud => (
                  <button
                    key={aud}
                    type="button"
                    aria-pressed={audienceFilter === aud}
                    onClick={() => setAudienceFilter(aud)}
                    className={`px-3.5 py-2 text-xs font-semibold transition-colors ${
                      audienceFilter === aud
                        ? 'bg-white text-black'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {aud}
                  </button>
                ))}
              </div>
            </div>

            {!catalogLoaded && (
              <p role="status" className="font-mono text-[11px] text-neutral-500">
                Checking active package schedule…
              </p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-7">
              {visiblePackages.map(pkg => (
                <article
                  key={pkg.id}
                  className="border border-[#222222] bg-[#0D0D0D] p-7 sm:p-8 flex flex-col justify-between gap-6 hover:border-[#3A3A3A] transition-colors"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#FF1E1E]">
                        {pkg.audience} · {pkg.tier}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                        {pkg.turnaround}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold text-white tracking-tight">{pkg.name}</h2>
                    <p className="font-mono text-xs text-neutral-300">{pkg.priceLabel}</p>
                    {pkg.summary && <p className="text-sm text-neutral-400 leading-6">{pkg.summary}</p>}

                    {pkg.deliverables.length > 0 && (
                      <ul className="space-y-2.5 border-t border-[#1D1D1D] pt-4">
                        {pkg.deliverables.map(item => (
                          <li key={item} className="flex items-start gap-2.5 text-sm text-neutral-300">
                            <Check size={14} className="mt-1 shrink-0 text-[#FF1E1E]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="space-y-4 border-t border-[#1D1D1D] pt-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-neutral-400">
                      <span>Revisions: <strong className="text-white">{pkg.revisions}</strong></span>
                      <span>Estimated turnaround: <strong className="text-white">{pkg.turnaround}</strong></span>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate('contact', encodeURIComponent(pkg.name))}
                      className="w-full inline-flex items-center justify-center gap-2 bg-[#FF1E1E] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-white hover:text-black transition-colors"
                    >
                      <span>Request Quote for {pkg.name}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="border border-[#202020] bg-[#0B0B0B] p-7 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#FF1E1E]">
                  Custom Multi-Discipline Retainers &amp; Releases
                </p>
                <p className="text-sm text-neutral-300">
                  Need ongoing studio support or bespoke creative direction outside an indicative package?
                </p>
              </div>
              <div className="flex flex-wrap gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate('contact', encodeURIComponent('Custom Studio Brief'))}
                  className="inline-flex items-center gap-2 border border-[#333] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:border-white transition-colors"
                >
                  <span>Discuss Custom Scope</span>
                  <MoveUpRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter navigate={navigate} />
    </div>
  );
};

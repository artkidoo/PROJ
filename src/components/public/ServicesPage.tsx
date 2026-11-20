import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, MoveUpRight } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { PUBLIC_SERVICES, type PublicService } from '../../data/publicContent';
import { db } from '../../lib/firebase';

interface Props {
  navigate: (r: PublicRoute, p?: string) => void;
}

type DisciplineFilter = 'All' | PublicService['category'];

const DISCIPLINE_FILTERS: { id: DisciplineFilter; label: string }[] = [
  { id: 'All', label: 'All Capabilities' },
  { id: 'Direction', label: 'Creative Direction' },
  { id: 'Brand', label: 'Brand & Collateral' },
  { id: 'Music', label: 'Music & Artists' },
  { id: 'Design', label: 'Graphic & Promo' },
  { id: 'Motion', label: 'Motion' },
  { id: 'Production', label: 'Production' },
];

export const ServicesPage: React.FC<Props> = ({ navigate }) => {
  const [liveServices, setLiveServices] = useState<Array<{
    id: string;
    title: string;
    category: string;
    description: string;
    deliverables: string[];
    turnaround: string;
    audience: string;
  }>>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [discipline, setDiscipline] = useState<DisciplineFilter>('All');

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'services'), where('isActive', '==', true)),
      snapshot => {
        setLiveServices(
          snapshot.docs.map(serviceDoc => {
            const data = serviceDoc.data();
            return {
              id: serviceDoc.id,
              title: typeof data.name === 'string' && data.name.trim() ? data.name : serviceDoc.id,
              category: typeof data.category === 'string' && data.category.trim() ? data.category : 'Creative Production',
              description: typeof data.description === 'string' ? data.description : '',
              deliverables: Array.isArray(data.deliverables)
                ? data.deliverables.filter((item): item is string => typeof item === 'string')
                : [],
              turnaround:
                typeof data.turnaroundDays === 'number' && data.turnaroundDays > 0
                  ? `${data.turnaroundDays} business days`
                  : 'Scoped per brief',
              audience:
                typeof data.targetAudience === 'string' && data.targetAudience.trim()
                  ? data.targetAudience
                  : 'Artists & Brands',
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

  const usingLiveCatalog = liveServices.length > 0;
  const filteredStatic = PUBLIC_SERVICES.filter(
    service => discipline === 'All' || service.category === discipline,
  );

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased selection:bg-[#FF1E1E] selection:text-white">
      <PublicHeader current="services" navigate={navigate} />

      <main className="flex-1">
        <section className="border-b border-[#1E1E1E] px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="max-w-[1440px] mx-auto space-y-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="max-w-3xl space-y-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#FF1E1E]">
                  Creative Services &amp; Capabilities
                </p>
                <h1 className="text-4xl sm:text-6xl font-black tracking-[-0.045em] text-white uppercase leading-[0.94]">
                  Nine Disciplines. One Studio Standard.
                </h1>
                <p className="text-sm sm:text-base text-neutral-400 leading-7 max-w-2xl">
                  From creative direction and brand identity systems to music artwork, motion animation, promotional key art, and corporate collateral—every service connects directly into our production workflow.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('contact')}
                className="inline-flex shrink-0 items-center gap-2 bg-[#FF1E1E] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-white hover:text-black transition-colors self-start lg:self-auto"
              >
                <span>Request Custom Scope</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {!usingLiveCatalog && (
              <div
                className="flex flex-wrap gap-1.5 border-t border-[#1E1E1E] pt-6"
                role="group"
                aria-label="Filter creative service disciplines"
              >
                {DISCIPLINE_FILTERS.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={discipline === item.id}
                    onClick={() => setDiscipline(item.id)}
                    className={`px-3.5 py-2 text-xs font-semibold border transition-colors ${
                      discipline === item.id
                        ? 'bg-white border-white text-black'
                        : 'border-[#242424] bg-[#0D0D0D] text-neutral-400 hover:text-white hover:border-[#444]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            {!catalogLoaded && (
              <p role="status" className="font-mono text-[11px] text-neutral-500">
                Checking studio catalog availability…
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(usingLiveCatalog ? liveServices : filteredStatic).map((service, idx) => (
                <article
                  key={service.id}
                  className="border border-[#202020] bg-[#0D0D0D] p-7 flex flex-col justify-between gap-6 hover:border-[#3A3A3A] transition-colors"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.18em]">
                      <span className="text-[#FF1E1E] tabular-nums">
                        {String(idx + 1).padStart(2, '0')} · {service.category}
                      </span>
                      <span className="text-neutral-500">{service.audience}</span>
                    </div>

                    <h2 className="text-xl font-bold text-white tracking-tight">{service.title}</h2>
                    <p className="text-sm text-neutral-400 leading-6">{service.description}</p>

                    {service.deliverables.length > 0 && (
                      <ul className="space-y-2 border-t border-[#1D1D1D] pt-4">
                        {service.deliverables.map(deliverable => (
                          <li key={deliverable} className="flex items-start gap-2 text-xs text-neutral-300">
                            <Check size={13} className="mt-0.5 shrink-0 text-[#FF1E1E]" />
                            <span>{deliverable}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-[#1D1D1D] pt-4">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                      {service.turnaround}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate('contact', encodeURIComponent(service.title))}
                      className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white hover:text-[#FF1E1E] transition-colors"
                    >
                      <span>Start Enquiry</span>
                      <MoveUpRight size={13} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#0B0B0B] px-4 py-16 sm:px-8 sm:py-20 lg:px-12">
          <div className="max-w-[1440px] mx-auto grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#FF1E1E]">
                Private Workspace Delivery
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-tight">
                Manage briefs, proofs, and revisions in one place.
              </h2>
              <p className="text-sm text-neutral-400 max-w-2xl">
                Review indicative packages or create your Artist, Brand, or Company account to submit requests directly inside KeedoHub Creative OS.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('pricing')}
                className="border border-[#333] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:border-white transition-colors"
              >
                Review Packages
              </button>
              <button
                type="button"
                onClick={() => navigate('register')}
                className="bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-black hover:bg-[#FF1E1E] hover:text-white transition-colors"
              >
                Create Account
              </button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter navigate={navigate} />
    </div>
  );
};

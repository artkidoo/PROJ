import React, { useEffect, useState } from 'react';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { PRICING_PACKAGES } from '../../data/publicContent';
import { ArrowRight } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface Props { navigate: (r: PublicRoute, p?: string) => void; }

export const PricingPage: React.FC<Props> = ({ navigate }) => {
  const [packages, setPackages] = useState<Array<{
    id: string;
    name: string;
    audience: string;
    tier: string;
    priceLabel: string;
    deliverables: string[];
    revisions: string;
    turnaround: string;
  }>>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [catalogError, setCatalogError] = useState('');

  useEffect(() => onSnapshot(
    query(collection(db, 'services'), where('isActive', '==', true)),
    snapshot => {
      setPackages(snapshot.docs.map(item => {
        const service = item.data();
        return {
          id: item.id,
          name: typeof service.name === 'string' ? service.name : item.id,
          audience: typeof service.targetAudience === 'string' ? service.targetAudience : 'Artist & Brand',
          tier: typeof service.tier === 'string' ? service.tier : 'Custom',
          priceLabel: `${typeof service.priceUsd === 'number' ? `$${service.priceUsd.toLocaleString()}` : 'Custom quote'} · ${typeof service.billingType === 'string' ? service.billingType : 'Pricing on request'}`,
          deliverables: Array.isArray(service.deliverables) ? service.deliverables.filter((value): value is string => typeof value === 'string') : [],
          revisions: typeof service.revisionLimit === 'number' && service.revisionLimit < 0 ? 'Unlimited' : String(service.revisionLimit ?? 'To be confirmed'),
          turnaround: typeof service.turnaroundDays === 'number' ? `${service.turnaroundDays} days` : 'To be confirmed',
        };
      }));
      setCatalogLoaded(true);
      setCatalogError('');
    },
    error => {
      setCatalogLoaded(true);
      setCatalogError(error.message);
    },
  ), []);

  const visiblePackages = packages.length > 0
    ? packages
    : catalogError
      ? PRICING_PACKAGES.map(item => ({
          id: item.id,
          name: item.name,
          audience: item.audience,
          tier: item.tier,
          priceLabel: item.priceLabel,
          deliverables: item.deliverables,
          revisions: item.revisions,
          turnaround: item.turnaround,
        }))
      : [];

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased">
      <PublicHeader current="pricing" navigate={navigate} />
      <main className="flex-1">
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
          <div>
            <p className="text-xs font-mono tracking-widest text-[#FF1E1E] uppercase">Pricing</p>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white uppercase mt-2">Packages for artists and brands.</h1>
            <p className="text-sm text-neutral-500 mt-2">{packages.length > 0 ? 'Current packages managed by the KeedoHub team.' : 'Pricing is confirmed to fit each creative brief.'}</p>
          </div>
          {!catalogLoaded && <p role="status" className="text-xs text-neutral-500">Loading current packages…</p>}
          {catalogError && <p role="alert" className="rounded border border-amber-900/50 bg-amber-950/20 p-3 text-xs text-amber-200">Could not load current pricing. The sample packages below are illustrative only. {catalogError}</p>}
          {catalogLoaded && !catalogError && packages.length === 0 && <p className="text-sm text-neutral-400">No fixed packages are published right now. <button onClick={() => navigate('contact')} className="text-red-300 underline">Send us your brief for a quote.</button></p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visiblePackages.map(pkg => (
              <div key={pkg.id} className="border border-[#1F1F1F] bg-[#0E0E0E] p-6 rounded flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">{pkg.name}</h3>
                  <span className="text-[10px] font-mono text-[#FF1E1E] uppercase">{pkg.audience} · {pkg.tier}</span>
                </div>
                <p className="text-sm text-neutral-400">{pkg.priceLabel}</p>
                <ul className="text-sm text-neutral-400 space-y-1">
                  {pkg.deliverables.map(item => <li key={item} className="flex items-center gap-2"><span className="w-1 h-1 bg-[#FF1E1E] rounded-full" />{item}</li>)}
                </ul>
                <div className="text-xs text-neutral-500 font-mono">Revisions: {pkg.revisions} · Turnaround: {pkg.turnaround}</div>
                <button onClick={() => navigate('contact', encodeURIComponent(pkg.name))} className="mt-2 text-xs text-white inline-flex items-center gap-1.5 hover:text-[#FF1E1E]">
                  Enquire <ArrowRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
      <PublicFooter navigate={navigate} />
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { PUBLIC_SERVICES } from '../../data/publicContent';
import { ArrowRight } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface Props { navigate: (r: PublicRoute, p?: string) => void; }

export const ServicesPage: React.FC<Props> = ({ navigate }) => {
  const [services, setServices] = useState<Array<{ id: string; title: string; category: string; description: string }>>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [catalogError, setCatalogError] = useState('');

  useEffect(() => onSnapshot(
    query(collection(db, 'services'), where('isActive', '==', true)),
    snapshot => {
      setServices(snapshot.docs.map(serviceDoc => {
        const data = serviceDoc.data();
        return {
          id: serviceDoc.id,
          title: typeof data.name === 'string' ? data.name : serviceDoc.id,
          category: typeof data.category === 'string' ? data.category : 'Creative Production',
          description: typeof data.description === 'string' ? data.description : '',
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

  const visibleServices = services.length ? services : PUBLIC_SERVICES;

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased">
      <PublicHeader current="services" navigate={navigate} />
      <main className="flex-1">
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
          <div>
            <p className="text-xs font-mono tracking-widest text-[#FF1E1E] uppercase">Services</p>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white uppercase mt-2">Creative services across brand, music and production.</h1>
          </div>
          {!catalogLoaded && <p role="status" className="text-xs text-neutral-500">Loading current service offerings…</p>}
          {catalogError && <p role="alert" className="rounded border border-amber-900/50 bg-amber-950/20 p-3 text-xs text-amber-200">Could not load the current service catalog. Showing general service information. {catalogError}</p>}
          {catalogLoaded && !catalogError && services.length === 0 && <p className="text-xs text-neutral-500">Our service catalog is being updated. Explore our general creative services below or contact us with your brief.</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleServices.map(service => (
              <div key={service.id} className="border border-[#1F1F1F] bg-[#0E0E0E] p-6 rounded flex flex-col gap-3">
                <span className="text-[10px] font-mono tracking-widest text-[#FF1E1E] uppercase">{service.category}</span>
                <h3 className="text-white font-semibold">{service.title}</h3>
                <p className="text-sm text-neutral-400 flex-1">{service.description}</p>
                <button onClick={() => navigate('contact', encodeURIComponent(service.title))} className="text-xs text-white inline-flex items-center gap-1.5 hover:text-[#FF1E1E] transition-colors">
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

import React from 'react';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { PUBLIC_SERVICES } from '../../data/publicContent';
import { ArrowRight } from 'lucide-react';

interface Props { navigate: (r: PublicRoute, p?: string) => void; }

export const ServicesPage: React.FC<Props> = ({ navigate }) => (
  <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased">
    <PublicHeader current="services" navigate={navigate} />
    <main className="flex-1">
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div>
          <p className="text-xs font-mono tracking-widest text-[#FF1E1E] uppercase">Services</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white uppercase mt-2">Creative services across brand, music and production.</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PUBLIC_SERVICES.map(s => (
            <div key={s.id} className="border border-[#1F1F1F] bg-[#0E0E0E] p-6 rounded flex flex-col gap-3">
              <span className="text-[10px] font-mono tracking-widest text-[#FF1E1E] uppercase">{s.category}</span>
              <h3 className="text-white font-semibold">{s.title}</h3>
              <p className="text-sm text-neutral-400 flex-1">{s.description}</p>
              <button onClick={() => navigate('contact')} className="text-xs text-white inline-flex items-center gap-1.5 hover:text-[#FF1E1E] transition-colors">
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

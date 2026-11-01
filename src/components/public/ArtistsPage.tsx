import React from 'react';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { ARTISTS, RELEASES } from '../../data/publicContent';
import { ArrowRight } from 'lucide-react';

interface Props { navigate: (r: PublicRoute, p?: string) => void; }

export const ArtistsPage: React.FC<Props> = ({ navigate }) => (
  <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased">
    <PublicHeader current="artists" navigate={navigate} />
    <main className="flex-1">
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
        <div>
          <p className="text-xs font-mono tracking-widest text-[#FF1E1E] uppercase">Artists</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white uppercase mt-2">Artist roster and releases.</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ARTISTS.map(a => (
            <div key={a.id} className="border border-[#1F1F1F] bg-[#0E0E0E] rounded overflow-hidden flex flex-col sm:flex-row">
              <img src={a.image} alt={a.name} className="w-full sm:w-40 aspect-square object-cover" />
              <div className="p-5 space-y-2">
                <h3 className="text-white font-semibold">{a.name}</h3>
                <p className="text-xs text-[#FF1E1E] font-mono uppercase">{a.genre}</p>
                <p className="text-sm text-neutral-400">{a.bio}</p>
              </div>
            </div>
          ))}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Releases</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {RELEASES.map(r => (
              <div key={r.id} className="border border-[#1F1F1F] bg-[#0E0E0E] rounded overflow-hidden">
                <img src={r.cover} alt={r.title} className="w-full aspect-square object-cover" />
                <div className="p-5 space-y-2">
                  <p className="text-xs text-neutral-500 font-mono">{r.date} · {r.category}</p>
                  <h3 className="text-white font-semibold">{r.title}</h3>
                  <p className="text-xs text-neutral-400">{r.artist}</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {r.links.map(l => (
                      <a key={l.label} href={l.url} className="text-xs px-2 py-1 border border-[#242424] rounded hover:border-[#FF1E1E] hover:text-[#FF1E1E] transition-colors">{l.label}</a>
                    ))}
                    <button onClick={() => navigate('journal')} className="text-xs px-2 py-1 border border-[#242424] rounded hover:border-[#FF1E1E] hover:text-[#FF1E1E] transition-colors">Article</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
    <PublicFooter navigate={navigate} />
  </div>
);

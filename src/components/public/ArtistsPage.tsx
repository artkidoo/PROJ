import React, { useEffect, useState } from 'react';
import { ArrowRight, MoveUpRight, X } from 'lucide-react';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { StudioImage } from './PublicMedia';
import { ARTISTS, RELEASES, type ArtistProfile } from '../../data/publicContent';

interface Props {
  navigate: (r: PublicRoute, p?: string) => void;
}

export const ArtistsPage: React.FC<Props> = ({ navigate }) => {
  const [selectedArtist, setSelectedArtist] = useState<ArtistProfile | null>(null);

  useEffect(() => {
    if (!selectedArtist) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedArtist(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedArtist]);

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased selection:bg-[#FF1E1E] selection:text-white">
      <PublicHeader current="artists" navigate={navigate} />

      <main className="flex-1">
        <section className="border-b border-[#1E1E1E] px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="max-w-[1440px] mx-auto space-y-12">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#1E1E1E] pb-10">
              <div className="max-w-3xl space-y-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#FF1E1E]">
                  Artists &amp; Visual Worlds
                </p>
                <h1 className="text-4xl sm:text-6xl font-black tracking-[-0.045em] text-white uppercase leading-[0.94]">
                  Visual Direction Built Around the Sound.
                </h1>
                <p className="text-sm sm:text-base text-neutral-400 leading-7 max-w-2xl">
                  From album artwork and press portraiture to stage lighting direction, KeedoHub develops distinctive artist visual identities. Studio concept profiles below demonstrate our direction approach without exposing private client records.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('register')}
                className="inline-flex shrink-0 items-center gap-2 bg-[#FF1E1E] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-white hover:text-black transition-colors self-start lg:self-auto"
              >
                <span>Launch Artist OS</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
              {ARTISTS.map(artist => (
                <article
                  key={artist.id}
                  className="group border border-[#222222] bg-[#0D0D0D] grid grid-cols-1 sm:grid-cols-[240px_1fr] overflow-hidden hover:border-[#3A3A3A] transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedArtist(artist)}
                    className="relative aspect-[3/4] sm:aspect-auto sm:h-full overflow-hidden bg-[#121212] text-left focus:outline-none"
                  >
                    <StudioImage
                      src={artist.image}
                      alt={artist.name}
                      className="h-full w-full object-cover grayscale-[20%] transition-transform duration-700 group-hover:scale-[1.03] group-hover:grayscale-0"
                    />
                    <span className="absolute left-3 top-3 border border-white/25 bg-black/80 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white">
                      {artist.sample ? 'Studio Concept' : 'Featured'}
                    </span>
                  </button>

                  <div className="p-6 sm:p-7 flex flex-col justify-between gap-6">
                    <div className="space-y-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#FF1E1E]">
                        {artist.genre} · {artist.origin}
                      </p>
                      <h2 className="text-2xl font-bold text-white tracking-tight">{artist.name}</h2>
                      <p className="text-sm text-neutral-400 leading-6">{artist.bio}</p>
                      <div className="border-t border-[#1D1D1D] pt-3">
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                          Visual Focus
                        </p>
                        <p className="mt-1 text-xs leading-6 text-neutral-300">{artist.visualFocus}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1D1D1D] pt-4">
                      <button
                        type="button"
                        onClick={() => setSelectedArtist(artist)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white hover:text-[#FF1E1E] transition-colors"
                      >
                        <span>Inspect Direction</span>
                        <MoveUpRight size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('contact', encodeURIComponent(`Artist Visual Identity — ${artist.name}`))}
                        className="text-xs font-medium text-neutral-400 hover:text-white transition-colors"
                      >
                        Commission Visual Identity
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#0B0B0B] px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="max-w-[1440px] mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#FF1E1E]">
                  Release Studies
                </p>
                <h2 className="mt-2 text-2xl sm:text-4xl font-bold text-white uppercase tracking-tight">
                  Artwork, Packaging &amp; Stage Loops
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('journal')}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:text-white"
              >
                <span>Read Studio Journal</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {RELEASES.map(release => (
                <article key={release.id} className="border border-[#202020] bg-[#0D0D0D] overflow-hidden">
                  <div className="aspect-[16/9] overflow-hidden bg-[#121212]">
                    <StudioImage
                      src={release.cover}
                      alt={release.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-6 space-y-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                      {release.date} · {release.category} · {release.format}
                    </p>
                    <h3 className="text-xl font-bold text-white">{release.title}</h3>
                    <p className="text-xs font-medium text-[#FF1E1E]">{release.artist}</p>
                    <p className="text-sm text-neutral-400 leading-6">{release.notes}</p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => navigate('contact', encodeURIComponent('Music Artwork & Release Direction'))}
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white hover:text-[#FF1E1E] transition-colors"
                      >
                        <span>Commission Release Artwork</span>
                        <MoveUpRight size={13} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      {selectedArtist && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="artist-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setSelectedArtist(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-[#2A2A2A] bg-[#0B0B0B]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1E1E1E] px-6 py-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#FF1E1E]">
                Artist Visual Direction · Studio Concept
              </span>
              <button
                type="button"
                onClick={() => setSelectedArtist(null)}
                aria-label="Close artist details"
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid sm:grid-cols-[240px_1fr]">
              <div className="aspect-[3/4] sm:aspect-auto bg-[#121212] border-b sm:border-b-0 sm:border-r border-[#1E1E1E]">
                <StudioImage
                  src={selectedArtist.image}
                  alt={selectedArtist.name}
                  loading="eager"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    {selectedArtist.genre} · {selectedArtist.origin}
                  </p>
                  <h2 id="artist-modal-title" className="mt-1.5 text-2xl font-bold text-white">
                    {selectedArtist.name}
                  </h2>
                </div>
                <p className="text-sm leading-6 text-neutral-300">{selectedArtist.bio}</p>
                <div className="border-t border-[#1E1E1E] pt-3 space-y-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    Creative Direction Focus
                  </p>
                  <p className="text-xs leading-6 text-neutral-300">{selectedArtist.visualFocus}</p>
                </div>
                <div className="border-t border-[#1E1E1E] pt-3 space-y-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    Featured Concept Release
                  </p>
                  <p className="text-xs font-semibold text-white">{selectedArtist.featuredRelease}</p>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const title = selectedArtist.name;
                      setSelectedArtist(null);
                      navigate('contact', encodeURIComponent(`Artist Visual Identity — ${title}`));
                    }}
                    className="inline-flex items-center gap-2 bg-[#FF1E1E] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white hover:text-black transition-colors"
                  >
                    <span>Book Similar Direction</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedArtist(null);
                      navigate('register');
                    }}
                    className="border border-[#333] px-4 py-2.5 text-xs font-semibold text-white hover:border-white"
                  >
                    Open Artist OS
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <PublicFooter navigate={navigate} />
    </div>
  );
};

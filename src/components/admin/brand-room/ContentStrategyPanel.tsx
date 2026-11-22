import React, { useState } from 'react';
import { Layers, Plus, Sparkles, Trash2 } from 'lucide-react';
import type {
  ContentPillar,
  ContentSeries,
  MarketingTargetAudience,
} from '../../../types/brandRoom';
import {
  deleteContentPillar,
  deleteContentSeries,
  saveContentPillar,
  saveContentSeries,
  seedDefaultPillarsAndSeries,
} from '../../../lib/brandRoomService';

interface ContentStrategyPanelProps {
  pillars: ContentPillar[];
  series: ContentSeries[];
  adminUid: string;
  onStartDesignFromStrategy: (params: {
    title: string;
    pillarId: string;
    pillarName: string;
    seriesId?: string;
    seriesName?: string;
    audience: MarketingTargetAudience;
  }) => void;
}

const AUDIENCES: MarketingTargetAudience[] = [
  'All Audiences',
  'Artists',
  'Brands',
  'Businesses',
  'Brands & Businesses',
];

export const ContentStrategyPanel: React.FC<ContentStrategyPanelProps> = ({
  pillars,
  series,
  adminUid,
  onStartDesignFromStrategy,
}) => {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // New Pillar Form
  const [pillarName, setPillarName] = useState('');
  const [pillarDesc, setPillarDesc] = useState('');
  const [pillarAudience, setPillarAudience] = useState<MarketingTargetAudience>('All Audiences');
  const [pillarObjectives, setPillarObjectives] = useState('');

  // New Series Form
  const [seriesName, setSeriesName] = useState('');
  const [seriesPillarId, setSeriesPillarId] = useState(pillars[0]?.id || '');
  const [seriesCadence, setSeriesCadence] = useState('Weekly');
  const [seriesDesc, setSeriesDesc] = useState('');
  const [seriesFormats, setSeriesFormats] = useState('Instagram Carousel Slide (4:5), LinkedIn Square Post (1:1)');

  const handleSeedDefaults = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await seedDefaultPillarsAndSeries(adminUid);
      setNotice(
        `Synchronized ${res.pillarsAdded} new content pillar(s) and ${res.seriesAdded} recurring series into Firestore.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleCreatePillar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pillarName.trim()) return;
    setBusy(true);
    setError('');
    try {
      await saveContentPillar({
        name: pillarName.trim(),
        description: pillarDesc.trim() || 'Custom KeedoHub content strategy pillar.',
        audience: pillarAudience,
        coreObjectives: pillarObjectives
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        isSystemDefault: false,
        createdBy: adminUid,
      });
      setPillarName('');
      setPillarDesc('');
      setPillarObjectives('');
      setNotice(`Added content pillar "${pillarName.trim()}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleCreateSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesName.trim()) return;
    const parentPillar = pillars.find(p => p.id === (seriesPillarId || pillars[0]?.id));
    setBusy(true);
    setError('');
    try {
      await saveContentSeries({
        name: seriesName.trim(),
        pillarId: parentPillar?.id || 'pillar-brand-awareness',
        pillarName: parentPillar?.name || 'Brand Awareness',
        cadence: seriesCadence.trim() || 'Weekly',
        description: seriesDesc.trim() || 'Recurring KeedoHub editorial marketing series.',
        recommendedFormats: seriesFormats
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        isSystemDefault: false,
        createdBy: adminUid,
      });
      setSeriesName('');
      setSeriesDesc('');
      setNotice(`Created recurring series "${seriesName.trim()}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      {(notice || error) && (
        <div
          className={`border px-4 py-3 text-xs flex items-center justify-between gap-3 ${
            error
              ? 'border-red-900 bg-red-950/30 text-red-200'
              : 'border-emerald-900/70 bg-emerald-950/20 text-emerald-200'
          }`}
        >
          <span>{error || notice}</span>
          <button
            type="button"
            onClick={() => {
              setError('');
              setNotice('');
            }}
            className="text-[11px] font-mono uppercase text-neutral-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Strategy Header & Seeding Action */}
      <div className="border border-[#1E1E1E] bg-[#0B0B0B] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF1E1E]">
            Permanent Content Engine
          </p>
          <h3 className="mt-1 text-base font-bold text-white">
            15 Strategic Pillars &amp; Reusable Editorial Series
          </h3>
          <p className="mt-1 text-xs text-neutral-400">
            Organize consistent content production across Artists, Brands, and Businesses. Launch a new studio design straight from any pillar or recurring series.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleSeedDefaults()}
          disabled={busy}
          className="inline-flex items-center gap-2 border border-[#2C2C2C] bg-[#141414] px-4 py-2 text-xs font-semibold text-white hover:border-[#FF1E1E] shrink-0"
        >
          <Layers size={14} className="text-[#FF1E1E]" />
          <span>Sync Default Pillars &amp; Series to Firestore</span>
        </button>
      </div>

      {/* Content Pillars Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white">
            Content Pillars ({pillars.length})
          </h4>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {pillars.map((pillar, idx) => (
            <article
              key={pillar.id}
              className="border border-[#1E1E1E] bg-[#0B0B0B] p-4 flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-neutral-500 tabular-nums">
                  <span>{String(idx + 1).padStart(2, '0')} · {pillar.audience}</span>
                  {!pillar.isSystemDefault && (
                    <button
                      type="button"
                      onClick={() => void deleteContentPillar(pillar.id)}
                      className="text-neutral-500 hover:text-red-400"
                      title="Delete custom pillar"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <h5 className="text-sm font-bold text-white leading-snug">
                  {pillar.name}
                </h5>
                <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3">
                  {pillar.description}
                </p>
                {pillar.coreObjectives.length > 0 && (
                  <p className="text-[11px] font-mono text-neutral-500">
                    {pillar.coreObjectives.join(' · ')}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  onStartDesignFromStrategy({
                    title: `${pillar.name} Feature`,
                    pillarId: pillar.id,
                    pillarName: pillar.name,
                    audience: pillar.audience,
                  })
                }
                className="w-full inline-flex items-center justify-center gap-1.5 border border-[#282828] bg-[#131313] px-3 py-1.5 text-[11px] font-semibold text-white hover:border-[#FF1E1E]"
              >
                <Sparkles size={12} className="text-[#FF1E1E]" />
                <span>Create Design in Pillar</span>
              </button>
            </article>
          ))}
        </div>

        {/* Add Custom Pillar */}
        <form
          onSubmit={handleCreatePillar}
          className="border border-[#1E1E1E] bg-[#0A0A0A] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
        >
          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">
              New Pillar Name
            </label>
            <input
              type="text"
              value={pillarName}
              onChange={e => setPillarName(e.target.value)}
              placeholder="e.g. Studio Toolkits & Workflows"
              className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">
              Target Audience
            </label>
            <select
              value={pillarAudience}
              onChange={e => setPillarAudience(e.target.value as MarketingTargetAudience)}
              className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
            >
              {AUDIENCES.map(a => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">
              Description
            </label>
            <input
              type="text"
              value={pillarDesc}
              onChange={e => setPillarDesc(e.target.value)}
              placeholder="Core strategic angle..."
              className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">
              Objectives (comma-separated)
            </label>
            <input
              type="text"
              value={pillarObjectives}
              onChange={e => setPillarObjectives(e.target.value)}
              placeholder="Education, Inbound enquiries"
              className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={busy || !pillarName.trim()}
            className="inline-flex items-center justify-center gap-1.5 bg-[#FF1E1E] px-4 py-2 text-xs font-bold uppercase text-white hover:bg-red-600 disabled:opacity-40"
          >
            <Plus size={14} />
            <span>Add Pillar</span>
          </button>
        </form>
      </section>

      {/* Recurring Content Series Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white">
            Reusable Content Series ({series.length})
          </h4>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {series.map(item => (
            <article
              key={item.id}
              className="border border-[#1E1E1E] bg-[#0B0B0B] p-4 flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-neutral-500">
                  <span className="truncate">{item.cadence} · {item.pillarName}</span>
                  {!item.isSystemDefault && (
                    <button
                      type="button"
                      onClick={() => void deleteContentSeries(item.id)}
                      className="text-neutral-500 hover:text-red-400 shrink-0"
                      title="Delete custom series"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <h5 className="text-sm font-bold text-white">{item.name}</h5>
                <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3">
                  {item.description}
                </p>
                {item.recommendedFormats.length > 0 && (
                  <p className="text-[11px] font-mono text-neutral-500 truncate">
                    {item.recommendedFormats.join(' / ')}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  onStartDesignFromStrategy({
                    title: `${item.name} Episode`,
                    pillarId: item.pillarId,
                    pillarName: item.pillarName,
                    seriesId: item.id,
                    seriesName: item.name,
                    audience: 'All Audiences',
                  })
                }
                className="w-full inline-flex items-center justify-center gap-1.5 border border-[#282828] bg-[#131313] px-3 py-1.5 text-[11px] font-semibold text-white hover:border-[#FF1E1E]"
              >
                <Plus size={12} className="text-[#FF1E1E]" />
                <span>Produce Episode Asset</span>
              </button>
            </article>
          ))}
        </div>

        {/* Add Custom Series */}
        <form
          onSubmit={handleCreateSeries}
          className="border border-[#1E1E1E] bg-[#0A0A0A] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
        >
          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">
              New Series Name
            </label>
            <input
              type="text"
              value={seriesName}
              onChange={e => setSeriesName(e.target.value)}
              placeholder="e.g. Release Artwork Tear-Down"
              className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">
              Linked Pillar
            </label>
            <select
              value={seriesPillarId || pillars[0]?.id || ''}
              onChange={e => setSeriesPillarId(e.target.value)}
              className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
            >
              {pillars.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">
              Cadence
            </label>
            <input
              type="text"
              value={seriesCadence}
              onChange={e => setSeriesCadence(e.target.value)}
              placeholder="Weekly / Bi-weekly"
              className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">
              Recommended Formats
            </label>
            <input
              type="text"
              value={seriesFormats}
              onChange={e => setSeriesFormats(e.target.value)}
              className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={busy || !seriesName.trim()}
            className="inline-flex items-center justify-center gap-1.5 bg-[#FF1E1E] px-4 py-2 text-xs font-bold uppercase text-white hover:bg-red-600 disabled:opacity-40"
          >
            <Plus size={14} />
            <span>Add Series</span>
          </button>
        </form>
      </section>
    </div>
  );
};

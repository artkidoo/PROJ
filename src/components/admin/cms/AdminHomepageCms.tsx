/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Website CMS Homepage Configuration Console
 */
import React, { useState } from 'react';
import { Check, Loader2, Save, Sparkles, X } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { useWebsiteCms } from '../../../context/WebsiteCmsContext';
import { saveHomepageCms, DEFAULT_HOMEPAGE_CMS } from '../../../lib/websiteCms';
import type { HomepageCmsConfig, HomepageSectionId } from '../../../types/cms';
import { AdminMediaLibrary } from './AdminMediaLibrary';

const SECTION_LABELS: Record<HomepageSectionId, string> = {
  ecosystem: '01. Creative Ecosystem (4 Cards)',
  services: '02. What We Create (9 Disciplines)',
  showcase: '03. Selected Creative Work (Portfolio)',
  process: '04. Studio Production Process (4 Steps)',
  studio: '05. Artist OS & Brand OS Capabilities',
  community: '06. Artists, Brands & Businesses Showcase',
  testimonials: '07. Client Trust & Testimonials',
  journal: '08. Studio Journal & Insights',
  packages: '09. Structured Packages & Scope',
  cta: '10. Closing Call to Action',
};

export const AdminHomepageCms: React.FC = () => {
  const { firebaseUser } = useApp();
  const { homepageCms } = useWebsiteCms();

  const [form, setForm] = useState<HomepageCmsConfig>(homepageCms || DEFAULT_HOMEPAGE_CMS);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Media picker modal state
  const [mediaModalField, setMediaModalField] = useState<keyof HomepageCmsConfig | null>(null);

  const handleChange = (field: keyof HomepageCmsConfig, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleSection = (sectionId: HomepageSectionId) => {
    setForm(prev => {
      const current = prev.sectionVisibility?.[sectionId] !== false;
      return {
        ...prev,
        sectionVisibility: {
          ...prev.sectionVisibility,
          [sectionId]: !current,
        },
      };
    });
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const order = [...(form.sectionOrder || Object.keys(SECTION_LABELS) as HomepageSectionId[])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= order.length) return;
    const temp = order[index];
    order[index] = order[targetIndex];
    order[targetIndex] = temp;
    setForm(prev => ({ ...prev, sectionOrder: order }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await saveHomepageCms(form, firebaseUser?.uid || 'admin');
      setSaving(false);
      setSuccessMsg('Homepage CMS configuration saved and published successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save homepage CMS.');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {successMsg && (
        <div className="border border-emerald-900/60 bg-emerald-950/25 p-3.5 text-xs text-emerald-300">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="border border-red-900/60 bg-red-950/25 p-3.5 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Hero Section Configuration */}
      <div className="border border-[#1E1E1E] bg-[#0E0E0E] p-6 space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-[#1E1E1E] pb-3">
          Hero Section &amp; Brand Introduction
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-mono uppercase text-neutral-400">Hero Kicker</label>
            <input
              type="text"
              value={form.heroKicker || ''}
              onChange={e => handleChange('heroKicker', e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-mono uppercase text-neutral-400">Hero Headline</label>
            <input
              type="text"
              value={form.heroHeadline || ''}
              onChange={e => handleChange('heroHeadline', e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3.5 py-2 text-xs text-white focus:outline-none font-bold"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-mono uppercase text-neutral-400">Hero Subheadline / Bio</label>
            <textarea
              rows={3}
              value={form.heroSubheadline || ''}
              onChange={e => handleChange('heroSubheadline', e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] p-3 text-xs text-white focus:outline-none leading-relaxed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase text-neutral-400">Primary CTA Label</label>
            <input
              type="text"
              value={form.heroPrimaryCtaLabel || ''}
              onChange={e => handleChange('heroPrimaryCtaLabel', e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase text-neutral-400">Secondary CTA Label</label>
            <input
              type="text"
              value={form.heroSecondaryCtaLabel || ''}
              onChange={e => handleChange('heroSecondaryCtaLabel', e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-mono uppercase text-neutral-400">Hero Background Image URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={form.heroBackgroundImageUrl || ''}
                onChange={e => handleChange('heroBackgroundImageUrl', e.target.value)}
                className="flex-1 bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3.5 py-2 text-xs text-white focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setMediaModalField('heroBackgroundImageUrl')}
                className="border border-[#333] hover:border-white bg-[#181818] px-3 py-2 text-xs text-white"
              >
                Media Library
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Visual Study Cards Configuration */}
      <div className="border border-[#1E1E1E] bg-[#0E0E0E] p-6 space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-[#1E1E1E] pb-3">
          Hero Dual Visual Study Cards
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 (Left) */}
          <div className="border border-[#222] bg-[#121212] p-4 space-y-3">
            <p className="font-mono text-[10px] uppercase text-[#FF1E1E] font-bold">Visual Card 01 (Left)</p>
            <div className="space-y-1">
              <label className="block text-[11px] font-mono text-neutral-400">Kicker Label</label>
              <input
                type="text"
                value={form.heroVisualLeftLabel || ''}
                onChange={e => handleChange('heroVisualLeftLabel', e.target.value)}
                className="w-full bg-[#181818] border border-[#262626] px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-mono text-neutral-400">Card Title</label>
              <input
                type="text"
                value={form.heroVisualLeftTitle || ''}
                onChange={e => handleChange('heroVisualLeftTitle', e.target.value)}
                className="w-full bg-[#181818] border border-[#262626] px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-mono text-neutral-400">Image URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={form.heroVisualLeftImageUrl || ''}
                  onChange={e => handleChange('heroVisualLeftImageUrl', e.target.value)}
                  className="flex-1 bg-[#181818] border border-[#262626] px-3 py-1.5 text-xs text-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => setMediaModalField('heroVisualLeftImageUrl')}
                  className="border border-[#333] hover:border-white bg-[#1a1a1a] px-2.5 py-1.5 text-xs text-white"
                >
                  Browse
                </button>
              </div>
            </div>
          </div>

          {/* Card 2 (Right) */}
          <div className="border border-[#222] bg-[#121212] p-4 space-y-3">
            <p className="font-mono text-[10px] uppercase text-[#FF1E1E] font-bold">Visual Card 02 (Right)</p>
            <div className="space-y-1">
              <label className="block text-[11px] font-mono text-neutral-400">Kicker Label</label>
              <input
                type="text"
                value={form.heroVisualRightLabel || ''}
                onChange={e => handleChange('heroVisualRightLabel', e.target.value)}
                className="w-full bg-[#181818] border border-[#262626] px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-mono text-neutral-400">Card Title</label>
              <input
                type="text"
                value={form.heroVisualRightTitle || ''}
                onChange={e => handleChange('heroVisualRightTitle', e.target.value)}
                className="w-full bg-[#181818] border border-[#262626] px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-mono text-neutral-400">Image URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={form.heroVisualRightImageUrl || ''}
                  onChange={e => handleChange('heroVisualRightImageUrl', e.target.value)}
                  className="flex-1 bg-[#181818] border border-[#262626] px-3 py-1.5 text-xs text-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => setMediaModalField('heroVisualRightImageUrl')}
                  className="border border-[#333] hover:border-white bg-[#1a1a1a] px-2.5 py-1.5 text-xs text-white"
                >
                  Browse
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Order & Visibility */}
      <div className="border border-[#1E1E1E] bg-[#0E0E0E] p-6 space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-[#1E1E1E] pb-3">
          Homepage Section Visibility &amp; Ordering
        </h3>

        <div className="space-y-2">
          {(form.sectionOrder || Object.keys(SECTION_LABELS)).map((secId, index) => {
            const isVisible = form.sectionVisibility?.[secId as HomepageSectionId] !== false;
            return (
              <div
                key={secId}
                className="flex items-center justify-between border border-[#222] bg-[#121212] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[#FF1E1E] font-bold">#{index + 1}</span>
                  <span className="text-xs font-semibold text-white">
                    {SECTION_LABELS[secId as HomepageSectionId] || secId}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveSection(index, 'up')}
                      className="border border-[#333] px-2 py-1 text-[10px] font-mono text-neutral-300 hover:text-white disabled:opacity-30"
                    >
                      ▲ Move Up
                    </button>
                    <button
                      type="button"
                      disabled={index === (form.sectionOrder?.length || 0) - 1}
                      onClick={() => handleMoveSection(index, 'down')}
                      className="border border-[#333] px-2 py-1 text-[10px] font-mono text-neutral-300 hover:text-white disabled:opacity-30"
                    >
                      ▼ Move Down
                    </button>
                  </div>

                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => handleToggleSection(secId as HomepageSectionId)}
                      className="rounded border-neutral-700 bg-neutral-900 text-[#FF1E1E] focus:ring-0"
                    />
                    <span className="font-mono text-[11px] text-neutral-300 uppercase">
                      {isVisible ? 'Visible' : 'Hidden'}
                    </span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[#FF1E1E] hover:bg-white hover:text-black text-white px-8 py-3 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          <Save size={14} />
          <span>{saving ? 'Saving Homepage CMS…' : 'Save & Publish Homepage'}</span>
        </button>
      </div>

      {/* Media Picker Modal */}
      {mediaModalField && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm overflow-y-auto"
          onClick={() => setMediaModalField(null)}
        >
          <div
            className="my-8 w-full max-w-4xl border border-[#2A2A2A] bg-[#0C0C0C] p-6 space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1E1E1E] pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Select Media Asset for Homepage
              </h3>
              <button
                type="button"
                onClick={() => setMediaModalField(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <AdminMediaLibrary
              selectionMode={true}
              onSelectAsset={url => {
                handleChange(mediaModalField, url);
                setMediaModalField(null);
              }}
            />
          </div>
        </div>
      )}
    </form>
  );
};

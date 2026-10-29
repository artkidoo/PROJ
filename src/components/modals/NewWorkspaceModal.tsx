/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Create New Client Workspace Modal
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ClientCategory, WorkspaceType } from '../../types';
import { X, Plus, Sparkles, Building2, Music, Check, Disc3, Briefcase } from 'lucide-react';

interface NewWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  { name: 'Warm Soul Gold', hex: '#D97706', for: 'artist' },
  { name: 'Electric Cobalt', hex: '#2563EB', for: 'brand' },
  { name: 'Emerald Studio', hex: '#10B981', for: 'business' },
  { name: 'KeedoHub Red', hex: '#FF1E1E', for: 'label' },
  { name: 'Deep Violet', hex: '#8B5CF6', for: 'artist' },
  { name: 'Monochrome Slate', hex: '#FFFFFF', for: 'all' }
];

export const NewWorkspaceModal: React.FC<NewWorkspaceModalProps> = ({
  isOpen,
  onClose
}) => {
  const { createWorkspace, currentUser } = useApp();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ClientCategory>('artist');
  const [tagline, setTagline] = useState('');
  const [accentColor, setAccentColor] = useState('#D97706');
  const [created, setCreated] = useState(false);

  if (!isOpen) return null;

  const handleCategoryChange = (cat: ClientCategory) => {
    setCategory(cat);
    if (cat === 'artist') {
      setAccentColor('#D97706');
    } else if (cat === 'brand') {
      setAccentColor('#2563EB');
    } else if (cat === 'business') {
      setAccentColor('#10B981');
    } else {
      setAccentColor('#FF1E1E');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const workspaceType: WorkspaceType = 
      category === 'artist' ? 'Artist' : 
      category === 'brand' ? 'Brand' : 
      category === 'business' ? 'Enterprise' : 'Label';

    createWorkspace({
      name: name.trim(),
      type: workspaceType,
      clientCategory: category,
      ownerId: currentUser.id,
      description: tagline.trim() || `${name} ${workspaceType} Workspace`,
      brand: {
        name: name.trim(),
        primaryColor: accentColor,
        secondaryColor: '#0A0A0A',
        accentColor,
        tagline: tagline.trim(),
        typography: {
          displayFont: 'Plus Jakarta Sans',
          bodyFont: 'Plus Jakarta Sans'
        }
      }
    });

    setCreated(true);
    setTimeout(() => {
      setCreated(false);
      setName('');
      setTagline('');
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-[#0F0F0F] border border-[#222222] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{ borderColor: `${accentColor}50` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E1E1E] bg-[#121212]">
          <div className="flex items-center gap-2">
            <Plus size={16} style={{ color: accentColor }} />
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                New Workspace Provisioning
              </h3>
              <p className="text-[10px] font-mono text-neutral-400">
                Create dedicated isolated portal with custom branding and tools
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#1C1C1C] rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Workspace Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-2">
              Workspace Category &amp; Operating Model
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleCategoryChange('artist')}
                className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  category === 'artist' 
                    ? 'bg-[#18150F] border-[#D97706] text-white ring-1 ring-[#D97706]' 
                    : 'bg-[#141414] border-[#222222] text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Music size={14} className={category === 'artist' ? 'text-[#D97706]' : 'text-neutral-500'} />
                  <span className="text-xs font-bold">Artist Client</span>
                </div>
                <p className="text-[10px] text-neutral-500 leading-tight">
                  Music releases, cover art, video deliverables, audio masters
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange('brand')}
                className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  category === 'brand' 
                    ? 'bg-[#0F1420] border-[#2563EB] text-white ring-1 ring-[#2563EB]' 
                    : 'bg-[#141414] border-[#222222] text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 size={14} className={category === 'brand' ? 'text-[#2563EB]' : 'text-neutral-500'} />
                  <span className="text-xs font-bold">Brand Client</span>
                </div>
                <p className="text-[10px] text-neutral-500 leading-tight">
                  Design systems, marketing kits, brand guidelines, stationery
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange('business')}
                className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  category === 'business' 
                    ? 'bg-[#0B1A14] border-[#10B981] text-white ring-1 ring-[#10B981]' 
                    : 'bg-[#141414] border-[#222222] text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Briefcase size={14} className={category === 'business' ? 'text-[#10B981]' : 'text-neutral-500'} />
                  <span className="text-xs font-bold">Business / Enterprise</span>
                </div>
                <p className="text-[10px] text-neutral-500 leading-tight">
                  Corporate contracts, retainer invoices, staff ID credentials
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange('label')}
                className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  category === 'label' 
                    ? 'bg-[#1A0D0D] border-[#FF1E1E] text-white ring-1 ring-[#FF1E1E]' 
                    : 'bg-[#141414] border-[#222222] text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Disc3 size={14} className={category === 'label' ? 'text-[#FF1E1E]' : 'text-neutral-500'} />
                  <span className="text-xs font-bold">Record Label</span>
                </div>
                <p className="text-[10px] text-neutral-500 leading-tight">
                  Artist roster, catalog management, media outreach, full suite
                </p>
              </button>
            </div>
          </div>

          {/* Client Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Workspace / Client Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                category === 'artist' ? 'e.g. SARIYAH or NOVA SOUND' :
                category === 'brand' ? 'e.g. KINETIC APPAREL or AURA LABS' :
                category === 'business' ? 'e.g. NEXUS CAPITAL or HORIZON STRATEGY' :
                'e.g. ELEVATE RECORDS or VELOCITY SOUND'
              }
              className="w-full bg-[#151515] border border-[#262626] text-xs text-white rounded-lg px-3.5 py-2.5 outline-none focus:border-white transition-colors"
            />
          </div>

          {/* Tagline */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Specialty / Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder={
                category === 'artist' ? 'e.g. Neo-Soul / Alternative R&B' :
                category === 'brand' ? 'e.g. Sustainable Performance Apparel' :
                category === 'business' ? 'e.g. Institutional Asset & Advisory Partner' :
                'e.g. Independent Contemporary Electronic Label'
              }
              className="w-full bg-[#151515] border border-[#262626] text-xs text-white rounded-lg px-3.5 py-2.5 outline-none focus:border-white transition-colors"
            />
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-2">
              Primary Brand Accent
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_COLORS.map(preset => {
                const isSelected = accentColor.toUpperCase() === preset.hex.toUpperCase();
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setAccentColor(preset.hex)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                      isSelected 
                        ? 'bg-[#1C1C1C] text-white border-white' 
                        : 'bg-[#141414] text-neutral-400 border-[#222222] hover:border-neutral-600'
                    }`}
                  >
                    <div 
                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/20"
                      style={{ backgroundColor: preset.hex }}
                    />
                    <span className="text-[11px] font-medium truncate leading-tight">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#1E1E1E]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white bg-[#151515] rounded-lg transition-colors border border-[#222222]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all shadow-md active:scale-95"
              style={{ backgroundColor: accentColor }}
            >
              {created ? <Check size={14} /> : <Plus size={14} />}
              <span>{created ? 'Workspace Ready' : 'Create Workspace'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

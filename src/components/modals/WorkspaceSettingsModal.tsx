/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Workspace Personalization & Brand Settings Modal
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Check, Sliders, Palette, Type, Building2, User } from 'lucide-react';

interface WorkspaceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  { name: 'KeedoHub Red', hex: '#FF1E1E' },
  { name: 'Warm Amber Gold', hex: '#D97706' },
  { name: 'Electric Cobalt', hex: '#2563EB' },
  { name: 'Emerald Studio', hex: '#10B981' },
  { name: 'Deep Violet', hex: '#8B5CF6' },
  { name: 'Monochrome Slate', hex: '#FFFFFF' }
];

export const WorkspaceSettingsModal: React.FC<WorkspaceSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { activeWorkspace, updateWorkspaceBrand } = useApp();

  const [name, setName] = useState(activeWorkspace.brand?.name || activeWorkspace.name);
  const [accentColor, setAccentColor] = useState(
    activeWorkspace.brand?.accentColor || activeWorkspace.brand?.primaryColor || '#FF1E1E'
  );
  const [tagline, setTagline] = useState(activeWorkspace.brand?.tagline || '');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateWorkspaceBrand(activeWorkspace.id, {
      name: name.trim() || activeWorkspace.name,
      accentColor,
      primaryColor: accentColor,
      tagline: tagline.trim()
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-[#0F0F0F] border border-[#222222] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{ borderColor: `${accentColor}50` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E1E1E] bg-[#121212]">
          <div className="flex items-center gap-2">
            <Sliders size={16} style={{ color: accentColor }} />
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Workspace Brand Settings
              </h3>
              <p className="text-[10px] font-mono text-neutral-400">
                Personalize {activeWorkspace.name} identity
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
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Workspace Display Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Brand / Workspace Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#151515] border border-[#262626] text-xs text-white rounded-lg px-3.5 py-2.5 outline-none focus:border-white transition-colors"
            />
          </div>

          {/* Tagline / Subtitle */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Brand Tagline / Genre / Specialty
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Neo-Soul Production or Spatial Design Systems"
              className="w-full bg-[#151515] border border-[#262626] text-xs text-white rounded-lg px-3.5 py-2.5 outline-none focus:border-white transition-colors"
            />
          </div>

          {/* Accent Color Palette Selector */}
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

          {/* Custom Hex Color Input */}
          <div className="flex items-center gap-2.5 pt-1">
            <div 
              className="w-8 h-8 rounded-lg shrink-0 border border-[#333]" 
              style={{ backgroundColor: accentColor }}
            />
            <input
              type="text"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              placeholder="#FF1E1E"
              className="flex-1 bg-[#151515] border border-[#262626] font-mono text-xs text-white rounded-lg px-3 py-2 outline-none focus:border-white"
            />
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
              {saved ? <Check size={14} /> : null}
              <span>{saved ? 'Saved' : 'Save Brand Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Client Creative Request Modal
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OperationTask } from '../../types';
import { X, Send, Sparkles, AlertCircle, Calendar, Tag, CheckCircle2 } from 'lucide-react';

interface ClientRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: OperationTask['category'];
}

export const ClientRequestModal: React.FC<ClientRequestModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'Creative'
}) => {
  const { activeWorkspace, submitClientRequest } = useApp();

  const isArtist = activeWorkspace.clientCategory === 'artist' || activeWorkspace.type === 'Artist' || activeWorkspace.type === 'Personal';
  const isBrand = activeWorkspace.clientCategory === 'brand' || activeWorkspace.type === 'Brand' || activeWorkspace.type === 'Agency';
  const isBusiness = activeWorkspace.clientCategory === 'business' || activeWorkspace.type === 'Business' || activeWorkspace.type === 'Enterprise';
  const brandAccent = activeWorkspace.brand?.accentColor || (isArtist ? '#D97706' : isBrand ? '#2563EB' : isBusiness ? '#10B981' : '#FF1E1E');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<OperationTask['category']>(defaultCategory);
  const [priority, setPriority] = useState<OperationTask['priority']>('High');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [deliverableSpecs, setDeliverableSpecs] = useState(
    isArtist 
      ? '3000x3000px 300DPI TIFF / 9:16 Vertical Video (1080x1920) / Lossless WAV' 
      : isBusiness 
      ? 'Official Corporate PDF / Vector Scalable SVG / High-DPI Stationery Package' 
      : 'Vector Scalable SVG / 16:9 Landscape 4K Presentation / Brand Assets'
  );
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const fullNotes = [
      notes.trim(),
      `--- DELIVERABLE SPECS ---`,
      deliverableSpecs.trim()
    ].filter(Boolean).join('\n\n');

    submitClientRequest({
      title: title.trim(),
      category,
      dueDate,
      priority,
      notes: fullNotes
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setTitle('');
      setNotes('');
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-[#0F0F0F] border border-[#222222] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ borderColor: `${brandAccent}40` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E1E1E] bg-[#121212]">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: brandAccent }}
            />
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Submit Creative Request
              </h3>
              <p className="text-[11px] font-mono text-neutral-400">
                {activeWorkspace.name} · {isArtist ? 'Artist Production' : isBrand ? 'Brand Production' : 'Studio'}
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

        {/* Content */}
        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div 
              className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            >
              <CheckCircle2 size={24} />
            </div>
            <h4 className="text-base font-bold text-white">Creative Brief Submitted</h4>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              Your request has been routed to the production team. Active status and revision checkpoints will appear on your workspace overview.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            {/* Request Title */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Deliverable / Project Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isArtist ? 'e.g., Midnight Architecture Spotify Canvas Loop' : 'e.g., Q4 Investor Presentation Deck Redesign'}
                className="w-full bg-[#151515] border border-[#262626] focus:border-white text-xs text-white rounded-lg px-3.5 py-2.5 outline-none transition-colors"
              />
            </div>

            {/* Category and Priority Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as OperationTask['category'])}
                  className="w-full bg-[#151515] border border-[#262626] text-xs text-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-white cursor-pointer"
                >
                  <option value="Creative">Creative Direction & Design</option>
                  <option value="Marketing">Marketing & Social Collateral</option>
                  <option value="Distribution">Distribution & Delivery</option>
                  <option value="Legal">Legal & Documents</option>
                  <option value="Executive">Executive & Strategic</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as OperationTask['priority'])}
                  className="w-full bg-[#151515] border border-[#262626] text-xs text-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-white cursor-pointer"
                >
                  <option value="Normal">Normal Pace</option>
                  <option value="High">High Priority</option>
                  <option value="Urgent">Urgent / Release Critical</option>
                </select>
              </div>
            </div>

            {/* Due Date & Format Specs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Target Deadline
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-[#151515] border border-[#262626] text-xs text-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Format Specifications
                </label>
                <input
                  type="text"
                  value={deliverableSpecs}
                  onChange={(e) => setDeliverableSpecs(e.target.value)}
                  placeholder="e.g. 1080x1920 MP4, 3000x3000px TIFF"
                  className="w-full bg-[#151515] border border-[#262626] text-xs text-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-white"
                />
              </div>
            </div>

            {/* Creative Brief / Notes */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Creative Direction, Brief & Revision Notes
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe desired mood, visual references, copy requirements, or specific revisions needed..."
                className="w-full bg-[#151515] border border-[#262626] text-xs text-neutral-200 rounded-lg p-3 outline-none focus:border-white transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white bg-[#151515] hover:bg-[#1E1E1E] rounded-lg transition-colors border border-[#222222]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all shadow-md active:scale-95"
                style={{ backgroundColor: brandAccent }}
              >
                <Send size={13} />
                <span>Submit to Production</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

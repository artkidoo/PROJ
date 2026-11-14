/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Client Creative Request Modal
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OperationTask, RequestAttachment } from '../../types';
import { X, Send, AlertCircle, CheckCircle2, Paperclip, Trash2 } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { deleteObject, ref, uploadBytes } from 'firebase/storage';
import { functions, storage } from '../../lib/firebase';
import { UNIFIED_PRODUCTION_CATEGORIES, defaultCategoryForAudience } from '../../lib/productionCategories';

const ALLOWED_ATTACHMENT_MIME = /^(image\/(jpeg|png|svg\+xml|webp|gif|avif)|audio\/(mpeg|wav|x-wav|aac|flac|mp4|m4a|ogg)|video\/(mp4|webm|quicktime)|application\/(pdf|json|xml|zip|x-zip-compressed|font-woff)|font\/(ttf|otf|woff|woff2)|text\/(plain|xml))$/;

interface ClientRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string;
  defaultCategory?: string;
}

export const ClientRequestModal: React.FC<ClientRequestModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  defaultCategory,
}) => {
  const { activeWorkspace, firebaseUser } = useApp();
  const resolvedWorkspaceId = (workspaceId !== undefined ? workspaceId : activeWorkspace?.id || '').trim();

  const isArtist = activeWorkspace?.clientCategory === 'artist' || activeWorkspace?.type === 'Artist' || activeWorkspace?.type === 'Personal';
  const isBrand = activeWorkspace?.clientCategory === 'brand' || activeWorkspace?.type === 'Brand' || activeWorkspace?.type === 'Agency';
  const isBusiness = activeWorkspace?.clientCategory === 'business' || activeWorkspace?.type === 'Business' || activeWorkspace?.type === 'Enterprise';
  const brandAccent = activeWorkspace?.brand?.accentColor || (isArtist ? '#D97706' : isBrand ? '#2563EB' : isBusiness ? '#10B981' : '#FF1E1E');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(
    defaultCategory || defaultCategoryForAudience(isArtist)
  );
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
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submittedSummary, setSubmittedSummary] = useState<{ title: string; category: string; filesCount: number; dueDate: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, submitting]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const combined = [...attachedFiles, ...selected];
    if (combined.length > 5) {
      setError('You can attach a maximum of 5 files total.');
      e.target.value = '';
      return;
    }

    const invalidType = selected.find(file => !ALLOWED_ATTACHMENT_MIME.test(file.type));
    if (invalidType) {
      setError(`File type not supported: ${invalidType.name}. Supported formats: Images, Audio, Video, PDF, ZIP, Fonts, Text.`);
      e.target.value = '';
      return;
    }

    const tooLarge = selected.find(file => file.size <= 0 || file.size >= 50 * 1024 * 1024);
    if (tooLarge) {
      setError(`File exceeds the 50 MB limit: ${tooLarge.name}`);
      e.target.value = '';
      return;
    }

    const totalSize = combined.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > 100 * 1024 * 1024) {
      setError('Total attachment size exceeds the 100 MB limit.');
      e.target.value = '';
      return;
    }

    setError('');
    setAttachedFiles(combined);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles(files => files.filter((_, i) => i !== index));
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setSubmittedSummary(null);
    setTitle('');
    setNotes('');
    setAttachedFiles([]);
    setError('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedWorkspaceId) {
      setError('An active workspace is required before submitting a creative request. Select or create a workspace first.');
      return;
    }
    if (!firebaseUser?.uid) {
      setError('You must be signed in to submit a request.');
      return;
    }
    if (!title.trim()) {
      setError('Enter a deliverable or project title before submitting.');
      return;
    }

    const fullNotes = [
      notes.trim(),
      `--- DELIVERABLE SPECS ---`,
      deliverableSpecs.trim()
    ].filter(Boolean).join('\n\n');

    setSubmitting(true);
    setError('');
    const requestId = crypto.randomUUID();
    const uploadedPaths: string[] = [];
    const attachments: RequestAttachment[] = [];

    try {
      for (const file of attachedFiles) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100) || 'attachment';
        const storagePath = `workspaces/${resolvedWorkspaceId}/requests/${firebaseUser.uid}/${requestId}/${safeName}`;
        await uploadBytes(ref(storage, storagePath), file, { contentType: file.type });
        uploadedPaths.push(storagePath);
        attachments.push({
          fileName: file.name.slice(0, 120),
          storagePath,
          fileType: file.type,
          fileSize: file.size,
        });
      }

      const submitRequest = httpsCallable(functions, 'submitProductionRequest');
      await submitRequest({
        workspaceId: resolvedWorkspaceId,
        title: title.trim(),
        category,
        dueDate,
        priority,
        description: fullNotes,
        attachments,
      });

      setSubmittedSummary({
        title: title.trim(),
        category,
        filesCount: attachments.length,
        dueDate,
      });
      setSubmitted(true);
    } catch (requestError) {
      if (uploadedPaths.length > 0) {
        await Promise.allSettled(uploadedPaths.map(path => deleteObject(ref(storage, path))));
      }
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="Submit Creative Request"
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
                {activeWorkspace?.name || 'Workspace'} · {isArtist ? 'Artist Production' : isBrand ? 'Brand Production' : 'Studio'}
              </p>
            </div>
          </div>
          <button
            onClick={submitted ? handleResetAndClose : onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#1C1C1C] rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div 
              className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            >
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Creative Brief Submitted</h4>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto mt-1">
                Your request has been routed to the KeedoHub production team.
              </p>
            </div>

            {submittedSummary && (
              <div className="rounded border border-[#222] bg-[#141414] p-3 text-left text-xs space-y-1.5 text-neutral-300">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Project:</span>
                  <span className="font-semibold text-white">{submittedSummary.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Category:</span>
                  <span>{submittedSummary.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Target deadline:</span>
                  <span>{submittedSummary.dueDate || 'Flexible'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Attachments:</span>
                  <span>{submittedSummary.filesCount} file(s) uploaded</span>
                </div>
              </div>
            )}

            <p className="text-[11px] text-neutral-500">
              Active status, brief review, and deliverable checkpoints will appear under My projects in your workspace.
            </p>

            <button
              type="button"
              onClick={handleResetAndClose}
              className="w-full rounded bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-colors"
            >
              Back to Workspace
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            {!resolvedWorkspaceId && !error && (
              <div role="alert" className="flex items-center gap-2 rounded border border-amber-500/30 bg-amber-950/30 p-3 text-xs text-amber-200">
                <AlertCircle size={14} />
                <span>No active workspace selected. Choose an active workspace before submitting a request.</span>
              </div>
            )}
            {error && <div role="alert" className="flex items-center gap-2 rounded border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300"><AlertCircle size={14} />{error}</div>}
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
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#151515] border border-[#262626] text-xs text-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-white cursor-pointer"
                >
                  {!UNIFIED_PRODUCTION_CATEGORIES.includes(category as (typeof UNIFIED_PRODUCTION_CATEGORIES)[number]) && (
                    <option value={category}>{category}</option>
                  )}
                  {UNIFIED_PRODUCTION_CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
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

            {/* Reference File Attachments */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Reference Files & Assets (Up to 5 files · 100 MB total)
              </label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer rounded border border-[#333] bg-[#161616] px-3 py-2 text-xs text-neutral-300 hover:text-white hover:border-[#555] transition-colors">
                  <Paperclip size={13} />
                  <span>Choose files…</span>
                  <input
                    type="file"
                    multiple
                    disabled={submitting || attachedFiles.length >= 5}
                    accept="image/jpeg,image/png,image/svg+xml,image/webp,image/gif,image/avif,audio/mpeg,audio/wav,audio/x-wav,audio/aac,audio/flac,audio/mp4,audio/m4a,audio/ogg,video/mp4,video/webm,video/quicktime,application/pdf,application/json,application/xml,application/zip,application/x-zip-compressed,font/ttf,font/otf,font/woff,font/woff2,text/plain,text/xml"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
                <span className="text-[11px] text-neutral-500">
                  {attachedFiles.length} of 5 files selected
                </span>
              </div>

              {attachedFiles.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {attachedFiles.map((file, idx) => (
                    <li
                      key={`${file.name}-${idx}`}
                      className="flex items-center justify-between rounded border border-[#262626] bg-[#121212] px-2.5 py-1.5 text-xs text-neutral-300"
                    >
                      <span className="truncate max-w-[280px]">
                        {file.name} · {(file.size / (1024 * 1024)).toFixed(1)} MB
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        disabled={submitting}
                        className="text-neutral-500 hover:text-red-400 p-0.5"
                        title="Remove attachment"
                      >
                        <Trash2 size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white bg-[#151515] hover:bg-[#1E1E1E] rounded-lg transition-colors border border-[#222222]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: brandAccent }}
              >
                <Send size={13} />
                <span>{submitting ? 'Submitting & Uploading…' : 'Submit to Production'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import type { ClientProject, CreativeProduct, InvoiceRecord, ProposalRecord } from '../../types';
import { buildWorkspaceSearchResults, type ClientTab } from '../../lib/clientOS';
import type { StudioAsset, StudioContentItem, StudioDocument, StudioRelease } from './ClientStudio';

export interface WorkspaceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  isArtist: boolean;
  projects: ClientProject[];
  releases: StudioRelease[];
  contentItems: StudioContentItem[];
  assets: StudioAsset[];
  documents: StudioDocument[];
  invoices: InvoiceRecord[];
  proposals: ProposalRecord[];
  products: CreativeProduct[];
  onSelectResult: (targetTab: ClientTab) => void;
}

export const WorkspaceSearchModal: React.FC<WorkspaceSearchModalProps> = ({
  isOpen,
  onClose,
  isArtist,
  projects,
  releases,
  contentItems,
  assets,
  documents,
  invoices,
  proposals,
  products,
  onSelectResult,
}) => {
  const [queryText, setQueryText] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setQueryText('');
    const t = window.setTimeout(() => inputRef.current?.focus(), 20);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  const results = useMemo(
    () =>
      buildWorkspaceSearchResults({
        queryText,
        isArtist,
        projects,
        releases,
        contentItems,
        assets,
        documents,
        invoices,
        proposals,
        products,
        limit: 24,
      }),
    [queryText, isArtist, projects, releases, contentItems, assets, documents, invoices, proposals, products],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 pt-16 sm:pt-24 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Workspace search"
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-[#2C2C2C] bg-[#0C0C0C] shadow-2xl">
        <div className="flex items-center gap-3 border-b border-[#1E1E1E] px-4 py-3">
          <Search size={16} className="text-neutral-500 shrink-0" />
          <input
            ref={inputRef}
            value={queryText}
            onChange={event => setQueryText(event.target.value)}
            placeholder={`Search projects, ${isArtist ? 'releases, ' : ''}content, assets, documents, invoices, or Creative Hub…`}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-500"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="rounded border border-[#282828] p-1 text-neutral-400 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3">
          {!queryText.trim() ? (
            <div className="space-y-3 p-3">
              <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                Quick Jump Destinations
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(
                  [
                    { tab: 'creative-hub', label: 'Creative Hub' },
                    { tab: 'studio', label: isArtist ? 'Artist Studio' : 'Brand Studio' },
                    { tab: 'projects', label: `Projects (${projects.length})` },
                    ...(isArtist
                      ? [{ tab: 'releases' as ClientTab, label: `Releases (${releases.length})` }]
                      : [{ tab: 'brand' as ClientTab, label: 'Brand Identity' }]),
                    { tab: 'content', label: `Content (${contentItems.length})` },
                    { tab: 'assets', label: `Assets (${assets.length})` },
                    { tab: 'documents', label: `Documents (${documents.length})` },
                    { tab: 'invoices', label: `Invoices (${invoices.length})` },
                    { tab: 'proposals', label: `Proposals (${proposals.length})` },
                  ] as Array<{ tab: ClientTab; label: string }>
                ).map(item => (
                  <button
                    key={item.tab}
                    type="button"
                    onClick={() => {
                      onSelectResult(item.tab);
                      onClose();
                    }}
                    className="flex items-center justify-between rounded border border-[#222] bg-[#121212] px-3 py-2 text-xs text-neutral-200 hover:border-[#FF1E1E] hover:text-white"
                  >
                    <span className="truncate">{item.label}</span>
                    <ArrowRight size={12} className="shrink-0 text-neutral-500" />
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <p className="py-10 text-center text-sm text-neutral-500">
              No matching records found for “{queryText.trim()}”.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {results.map(item => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectResult(item.targetTab);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between gap-3 rounded border border-transparent bg-[#111] px-3.5 py-2.5 text-left hover:border-[#FF1E1E] transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                      <p className="text-xs text-neutral-400 truncate">{item.subtitle}</p>
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 shrink-0">
                      {item.kind}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

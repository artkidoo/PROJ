import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  List,
  Send,
  X,
} from 'lucide-react';
import type {
  ContentPillar,
  MarketingAsset,
  MarketingContentStatus,
  MarketingPlatform,
} from '../../../types/brandRoom';
import {
  MARKETING_PLATFORMS,
  MARKETING_STATUS_OPTIONS,
} from '../../../lib/brandRoomStudio';
import {
  downloadBrandRoomFile,
  saveMarketingAsset,
  updateMarketingAssetStatus,
} from '../../../lib/brandRoomService';
import { BrandRoomCanvasPreview } from './BrandRoomCanvasPreview';

interface ContentCalendarPublishingPanelProps {
  mode: 'calendar' | 'publishing';
  assets: MarketingAsset[];
  pillars: ContentPillar[];
  adminUid: string;
  adminName: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ContentCalendarPublishingPanel: React.FC<ContentCalendarPublishingPanelProps> = ({
  mode,
  assets,
  pillars,
  adminUid,
  adminName,
}) => {
  const today = new Date();
  const [cursorYear, setCursorYear] = useState(today.getFullYear());
  const [cursorMonth, setCursorMonth] = useState(today.getMonth()); // 0-indexed
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [platformFilter, setPlatformFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState('');

  // Schedule / Edit modal
  const [scheduleTarget, setScheduleTarget] = useState<MarketingAsset | null>(null);
  const [schedDate, setSchedDate] = useState('');
  const [schedStatus, setSchedStatus] = useState<MarketingContentStatus>('Scheduled');
  const [schedAssignee, setSchedAssignee] = useState('');
  const [schedCaption, setSchedCaption] = useState('');
  const [schedHashtags, setSchedHashtags] = useState('');

  // Manual Publish confirmation state
  const [publishTarget, setPublishTarget] = useState<MarketingAsset | null>(null);
  const [publishedUrlInput, setPublishedUrlInput] = useState('');

  const activeAssets = useMemo(
    () =>
      assets
        .filter(a => a.status !== 'Archived')
        .filter(a => platformFilter === 'ALL' || a.platform === platformFilter)
        .filter(a => statusFilter === 'ALL' || a.status === statusFilter),
    [assets, platformFilter, statusFilter],
  );

  const monthLabel = useMemo(() => {
    const d = new Date(cursorYear, cursorMonth, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [cursorYear, cursorMonth]);

  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(cursorYear, cursorMonth, 1).getDay();
    const daysInMonth = new Date(cursorYear, cursorMonth + 1, 0).getDate();
    const cells: { day: number | null; isoDate: string | null }[] = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push({ day: null, isoDate: null });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const mm = String(cursorMonth + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      cells.push({ day, isoDate: `${cursorYear}-${mm}-${dd}` });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: null, isoDate: null });
    }
    return cells;
  }, [cursorYear, cursorMonth]);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, MarketingAsset[]>();
    for (const item of activeAssets) {
      if (!item.publicationDate) continue;
      const list = map.get(item.publicationDate) || [];
      list.push(item);
      map.set(item.publicationDate, list);
    }
    return map;
  }, [activeAssets]);

  const unscheduledAssets = useMemo(
    () => activeAssets.filter(a => !a.publicationDate),
    [activeAssets],
  );

  const publishingQueue = useMemo(
    () =>
      assets
        .filter(a => a.status === 'Approved' || a.status === 'Scheduled')
        .sort((a, b) =>
          (a.publicationDate || '9999-12-31').localeCompare(b.publicationDate || '9999-12-31'),
        ),
    [assets],
  );

  const publishedLog = useMemo(
    () =>
      assets
        .filter(a => a.status === 'Published')
        .sort((a, b) => (b.publishedAt || b.updatedAt).localeCompare(a.publishedAt || a.updatedAt)),
    [assets],
  );

  const shiftMonth = (delta: number) => {
    const d = new Date(cursorYear, cursorMonth + delta, 1);
    setCursorYear(d.getFullYear());
    setCursorMonth(d.getMonth());
  };

  const openScheduleModal = (asset: MarketingAsset, presetDate?: string) => {
    setScheduleTarget(asset);
    setSchedDate(
      presetDate ||
        asset.publicationDate ||
        new Date().toISOString().slice(0, 10),
    );
    setSchedStatus(
      asset.status === 'Draft' || asset.status === 'Planned' ? 'Scheduled' : asset.status,
    );
    setSchedAssignee(asset.assignedTeamMemberName || adminName);
    setSchedCaption(asset.caption || '');
    setSchedHashtags((asset.hashtags || []).join(' '));
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTarget) return;
    setBusy(true);
    setError('');
    try {
      await saveMarketingAsset({
        ...scheduleTarget,
        publicationDate: schedDate || undefined,
        status: schedStatus,
        assignedTeamMemberUid: adminUid,
        assignedTeamMemberName: schedAssignee.trim() || adminName,
        caption: schedCaption.trim(),
        hashtags: schedHashtags
          .split(/[\s,]+/)
          .map(h => h.trim())
          .filter(Boolean),
        updatedBy: adminUid,
      });
      setNotice(`Saved calendar schedule for "${scheduleTarget.title}" (${schedDate || 'Unscheduled'}).`);
      setScheduleTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleMarkPublished = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishTarget) return;
    setBusy(true);
    setError('');
    try {
      await updateMarketingAssetStatus({
        assetId: publishTarget.id,
        status: 'Published',
        updatedBy: adminUid,
        publishedUrl: publishedUrlInput.trim() || undefined,
      });
      setNotice(`Recorded manual publication of "${publishTarget.title}".`);
      setPublishTarget(null);
      setPublishedUrlInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleCopyCaption = async (asset: MarketingAsset) => {
    const fullText = [
      asset.caption,
      asset.callToAction,
      (asset.hashtags || []).join(' '),
    ]
      .filter(Boolean)
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedId(asset.id);
      setTimeout(() => setCopiedId(''), 1800);
    } catch {
      setError('Clipboard permission unavailable in this browser context.');
    }
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div className="border border-emerald-900 bg-emerald-950/30 px-4 py-2.5 text-xs text-emerald-300 flex items-center justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} className="text-emerald-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}
      {error && (
        <div className="border border-red-900 bg-red-950/30 px-4 py-2.5 text-xs text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="text-red-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {mode === 'calendar' ? (
        <>
          {/* Calendar Header & Controls */}
          <div className="border border-[#1E1E1E] bg-[#0B0B0B] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="border border-[#262626] bg-[#121212] p-2 text-neutral-300 hover:text-white hover:border-[#FF1E1E]"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="min-w-[160px] text-center">
                <h3 className="text-base font-bold text-white">{monthLabel}</h3>
                <p className="text-[10px] font-mono uppercase text-neutral-500">
                  KeedoHub Editorial Schedule
                </p>
              </div>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="border border-[#262626] bg-[#121212] p-2 text-neutral-300 hover:text-white hover:border-[#FF1E1E]"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setCursorYear(today.getFullYear());
                  setCursorMonth(today.getMonth());
                }}
                className="border border-[#262626] bg-[#121212] px-3 py-1.5 text-xs font-mono text-neutral-300 hover:text-white"
              >
                Today
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={platformFilter}
                onChange={e => setPlatformFilter(e.target.value)}
                className="border border-[#262626] bg-[#121212] px-3 py-1.5 text-xs text-white"
              >
                <option value="ALL">All Platforms</option>
                {MARKETING_PLATFORMS.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="border border-[#262626] bg-[#121212] px-3 py-1.5 text-xs text-white"
              >
                <option value="ALL">All Active Statuses</option>
                {MARKETING_STATUS_OPTIONS.filter(s => s !== 'Archived').map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <div className="flex border border-[#262626] bg-[#101010]">
                <button
                  type="button"
                  onClick={() => setViewLayout('grid')}
                  className={`px-3 py-1.5 text-xs inline-flex items-center gap-1 ${
                    viewLayout === 'grid' ? 'bg-[#FF1E1E] text-white font-semibold' : 'text-neutral-400'
                  }`}
                >
                  <Calendar size={12} />
                  <span>Month</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayout('list')}
                  className={`px-3 py-1.5 text-xs inline-flex items-center gap-1 ${
                    viewLayout === 'list' ? 'bg-[#FF1E1E] text-white font-semibold' : 'text-neutral-400'
                  }`}
                >
                  <List size={12} />
                  <span>List</span>
                </button>
              </div>
            </div>
          </div>

          {viewLayout === 'grid' ? (
            <div className="border border-[#1E1E1E] bg-[#0B0B0B] overflow-x-auto">
              <div className="min-w-[720px]">
                <div className="grid grid-cols-7 border-b border-[#1E1E1E] bg-[#111111]">
                  {WEEKDAYS.map(wd => (
                    <div
                      key={wd}
                      className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-neutral-400 border-r last:border-r-0 border-[#1A1A1A]"
                    >
                      {wd}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {calendarCells.map((cell, idx) => {
                    const dayItems = cell.isoDate ? itemsByDate.get(cell.isoDate) || [] : [];
                    const isToday =
                      cell.isoDate === today.toISOString().slice(0, 10);

                    return (
                      <div
                        key={idx}
                        className={`min-h-[115px] p-2 border-r border-b border-[#191919] ${
                          cell.day ? 'bg-[#0B0B0B]' : 'bg-[#070707]'
                        } ${isToday ? 'ring-1 ring-inset ring-[#FF1E1E]' : ''}`}
                      >
                        {cell.day && (
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className={`text-xs font-mono tabular-nums ${
                                isToday ? 'text-[#FF1E1E] font-bold' : 'text-neutral-400'
                              }`}
                            >
                              {cell.day}
                            </span>
                            {dayItems.length > 0 && (
                              <span className="text-[9px] font-mono text-neutral-500">
                                {dayItems.length}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="space-y-1">
                          {dayItems.map(item => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => openScheduleModal(item)}
                              className="w-full text-left border border-[#242424] bg-[#131313] hover:border-[#FF1E1E] px-2 py-1 text-[10px] space-y-0.5"
                            >
                              <div className="font-mono uppercase text-[9px] text-[#FF1E1E] truncate">
                                {item.platform} · {item.status}
                              </div>
                              <div className="text-white font-semibold truncate">{item.title}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-[#1E1E1E] bg-[#0B0B0B] divide-y divide-[#181818]">
              {activeAssets.filter(a => a.publicationDate).length === 0 ? (
                <div className="p-6 text-xs text-neutral-400">
                  No scheduled dates match your active filters. Assign dates from the unscheduled queue below.
                </div>
              ) : (
                activeAssets
                  .filter(a => a.publicationDate)
                  .sort((a, b) => (a.publicationDate || '').localeCompare(b.publicationDate || ''))
                  .map(item => (
                    <div
                      key={item.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="text-[11px] font-mono text-[#FF1E1E] tabular-nums">
                          {item.publicationDate} · {item.platform} · {item.status}
                        </div>
                        <div className="text-sm font-bold text-white truncate">{item.title}</div>
                        <div className="text-xs text-neutral-400 truncate">
                          {item.contentPillarName || 'Unassigned'} · Assigned to{' '}
                          {item.assignedTeamMemberName || 'Unassigned'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openScheduleModal(item)}
                        className="shrink-0 border border-[#2A2A2A] bg-[#141414] px-3 py-1.5 text-xs text-white hover:border-[#FF1E1E]"
                      >
                        Update Schedule
                      </button>
                    </div>
                  ))
              )}
            </div>
          )}

          {/* Unscheduled Queue */}
          <section className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
              Unscheduled Marketing Backlog ({unscheduledAssets.length})
            </h4>
            {unscheduledAssets.length === 0 ? (
              <div className="border border-[#1E1E1E] bg-[#0B0B0B] p-5 text-xs text-neutral-400">
                All active Brand Room items currently have publication dates assigned.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {unscheduledAssets.slice(0, 12).map(asset => (
                  <div
                    key={asset.id}
                    className="border border-[#1E1E1E] bg-[#0B0B0B] p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono uppercase text-neutral-500 truncate">
                        {asset.platform} · {asset.status}
                      </div>
                      <div className="text-xs font-bold text-white truncate">{asset.title}</div>
                      <div className="text-[10px] text-neutral-400 truncate">
                        {pillars.find(p => p.id === asset.contentPillarId)?.name || asset.contentPillarName}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openScheduleModal(asset)}
                      className="shrink-0 border border-[#282828] bg-[#151515] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:border-[#FF1E1E]"
                    >
                      Assign Date
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        /* PUBLISHING MANAGEMENT MODE */
        <>
          <div className="border border-amber-900/60 bg-amber-950/20 p-4 flex items-start gap-3">
            <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-300 space-y-1">
              <p className="font-semibold text-white">
                Human-Verified Publishing Workflow (No Direct Social OAuth Auto-Post Connected)
              </p>
              <p className="text-neutral-400">
                Download verified platform deliverables directly from Firebase Storage, copy finalized captions and hashtags, publish natively on your target channel, and record the live post URL here so KeedoHub maintains an accurate audit log.
              </p>
            </div>
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-bold text-white">
              Ready-to-Publish Queue ({publishingQueue.length})
            </h3>
            {publishingQueue.length === 0 ? (
              <div className="border border-[#1E1E1E] bg-[#0B0B0B] p-6 text-xs text-neutral-400">
                No items are currently in Approved or Scheduled status. Approve drafts in the Content Calendar or Library first.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {publishingQueue.map(asset => {
                  const downloadTarget =
                    asset.exportedFiles.find(f => !f.isEditableSource) || asset.exportedFiles[0];

                  return (
                    <article
                      key={asset.id}
                      className="border border-[#1E1E1E] bg-[#0B0B0B] p-4 flex flex-col sm:flex-row gap-4"
                    >
                      <div className="w-full sm:w-36 h-36 bg-[#070707] border border-[#191919] flex items-center justify-center p-2 shrink-0">
                        <BrandRoomCanvasPreview
                          canvasDesignJson={asset.canvasDesignJson}
                          previewUrl={asset.previewUrl}
                          title={asset.title}
                          maxHeightPx={128}
                        />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                            <span className="text-[#FF1E1E] uppercase">
                              {asset.platform} · {asset.status}
                            </span>
                            <span className="text-neutral-500 tabular-nums">
                              {asset.publicationDate ? `Target ${asset.publicationDate}` : 'Unscheduled'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white truncate">{asset.title}</h4>
                          <p className="text-xs text-neutral-400 line-clamp-2">
                            {asset.caption || asset.topic}
                          </p>
                          <div className="text-[10px] font-mono text-neutral-500">
                            {asset.exportedFiles.length > 0
                              ? `${asset.exportedFiles.length} verified deliverable file(s) ready`
                              : 'No export files uploaded yet — generate PNG/SVG in Studio first'}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void handleCopyCaption(asset)}
                            className="inline-flex items-center gap-1 border border-[#282828] bg-[#141414] px-2.5 py-1.5 text-[11px] text-white hover:border-[#FF1E1E]"
                          >
                            {copiedId === asset.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            <span>{copiedId === asset.id ? 'Copied' : 'Copy Copy'}</span>
                          </button>

                          <button
                            type="button"
                            disabled={!downloadTarget}
                            onClick={() =>
                              downloadTarget &&
                              void downloadBrandRoomFile(
                                downloadTarget.storagePath,
                                downloadTarget.fileName,
                                downloadTarget.downloadUrl,
                              )
                            }
                            className="inline-flex items-center gap-1 border border-[#282828] bg-[#141414] px-2.5 py-1.5 text-[11px] text-white hover:border-[#FF1E1E] disabled:opacity-40"
                          >
                            <Download size={12} />
                            <span>Download File</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setPublishTarget(asset);
                              setPublishedUrlInput(asset.publishedUrl || '');
                            }}
                            className="inline-flex items-center gap-1 bg-[#FF1E1E] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#e01919]"
                          >
                            <Send size={11} />
                            <span>Record Publication</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-400" />
              <span>Published Log ({publishedLog.length})</span>
            </h3>
            {publishedLog.length === 0 ? (
              <div className="border border-[#1E1E1E] bg-[#0B0B0B] p-6 text-xs text-neutral-400">
                No published entries logged yet.
              </div>
            ) : (
              <div className="border border-[#1E1E1E] bg-[#0B0B0B] divide-y divide-[#181818]">
                {publishedLog.map(item => (
                  <div
                    key={item.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{item.title}</div>
                      <div className="text-[11px] font-mono text-neutral-400">
                        {item.platform} · Published{' '}
                        {item.publishedAt
                          ? new Date(item.publishedAt).toLocaleString()
                          : item.publicationDate || 'Recorded'}
                      </div>
                    </div>
                    {item.publishedUrl && (
                      <a
                        href={item.publishedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-[#FF1E1E] hover:underline shrink-0"
                      >
                        <span>View Live Post</span>
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* SCHEDULE MODAL */}
      {scheduleTarget && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveSchedule}
            className="border border-[#2A2A2A] bg-[#0C0C0C] max-w-lg w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
              <h4 className="text-sm font-bold text-white truncate">
                Schedule: {scheduleTarget.title}
              </h4>
              <button
                type="button"
                onClick={() => setScheduleTarget(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="block space-y-1">
                <span className="text-neutral-400">Publication Date</span>
                <input
                  type="date"
                  value={schedDate}
                  onChange={e => setSchedDate(e.target.value)}
                  className="w-full border border-[#262626] bg-[#121212] px-3 py-2 text-white"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-neutral-400">Workflow Status</span>
                <select
                  value={schedStatus}
                  onChange={e => setSchedStatus(e.target.value as MarketingContentStatus)}
                  className="w-full border border-[#262626] bg-[#121212] px-3 py-2 text-white"
                >
                  {MARKETING_STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1 sm:col-span-2">
                <span className="text-neutral-400">Assigned Team Member</span>
                <input
                  type="text"
                  value={schedAssignee}
                  onChange={e => setSchedAssignee(e.target.value)}
                  className="w-full border border-[#262626] bg-[#121212] px-3 py-2 text-white"
                />
              </label>

              <label className="block space-y-1 sm:col-span-2">
                <span className="text-neutral-400">Final Caption</span>
                <textarea
                  rows={3}
                  value={schedCaption}
                  onChange={e => setSchedCaption(e.target.value)}
                  className="w-full border border-[#262626] bg-[#121212] px-3 py-2 text-white"
                />
              </label>

              <label className="block space-y-1 sm:col-span-2">
                <span className="text-neutral-400">Hashtags</span>
                <input
                  type="text"
                  value={schedHashtags}
                  onChange={e => setSchedHashtags(e.target.value)}
                  className="w-full border border-[#262626] bg-[#121212] px-3 py-2 text-white font-mono"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setScheduleTarget(null)}
                className="border border-[#2A2A2A] px-4 py-2 text-xs text-neutral-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="bg-[#FF1E1E] px-4 py-2 text-xs font-bold text-white"
              >
                {busy ? 'Saving...' : 'Save Schedule'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RECORD MANUAL PUBLICATION MODAL */}
      {publishTarget && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <form
            onSubmit={handleMarkPublished}
            className="border border-[#2A2A2A] bg-[#0C0C0C] max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
              <h4 className="text-sm font-bold text-white">
                Confirm Native Publication
              </h4>
              <button
                type="button"
                onClick={() => setPublishTarget(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-neutral-400">
              Recording <strong className="text-white">{publishTarget.title}</strong> as Published on{' '}
              <strong className="text-white">{publishTarget.platform}</strong>.
            </p>
            <label className="block space-y-1 text-xs">
              <span className="text-neutral-400">Published Post URL (Optional)</span>
              <input
                type="url"
                value={publishedUrlInput}
                onChange={e => setPublishedUrlInput(e.target.value)}
                placeholder="https://instagram.com/p/..."
                className="w-full border border-[#262626] bg-[#121212] px-3 py-2 text-white"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPublishTarget(null)}
                className="border border-[#2A2A2A] px-4 py-2 text-xs text-neutral-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="bg-[#FF1E1E] px-4 py-2 text-xs font-bold text-white"
              >
                {busy ? 'Updating...' : 'Mark Published'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

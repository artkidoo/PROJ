/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Website CMS Journal & Blog Management
 */
import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  Edit3,
  Eye,
  FileText,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import {
  deleteJournalArticle,
  saveJournalArticle,
  seedDefaultJournalArticles,
  slugifyTitle,
} from '../../../lib/websiteCms';
import { DEFAULT_JOURNAL_ARTICLES } from '../../../lib/websiteCms';
import type { JournalArticle, JournalArticleStatus } from '../../../types/cms';
import { AdminMediaLibrary } from './AdminMediaLibrary';

export const AdminJournalCms: React.FC = () => {
  const { firebaseUser } = useApp();
  const [articles, setArticles] = useState<JournalArticle[]>(DEFAULT_JOURNAL_ARTICLES);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | JournalArticleStatus>('All');

  // Editor Modal State
  const [editingArticle, setEditingArticle] = useState<Partial<JournalArticle> | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<JournalArticle | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Media picker drawer for cover image / inline image
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'cover' | 'inline'>('cover');

  useEffect(() => {
    // Load from localStorage or default
    try {
      const stored = localStorage.getItem('keedohub_admin_journal_articles');
      if (stored) {
        setArticles(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const persistArticles = (updated: JournalArticle[]) => {
    setArticles(updated);
    try {
      localStorage.setItem('keedohub_admin_journal_articles', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const filteredArticles = articles.filter(a => {
    if (statusFilter !== 'All' && a.status !== statusFilter) return false;
    const q = search.trim().toLowerCase();
    if (q) {
      const matchTitle = a.title?.toLowerCase().includes(q);
      const matchAuthor = a.authorName?.toLowerCase().includes(q);
      const matchCategory = a.category?.toLowerCase().includes(q);
      if (!matchTitle && !matchAuthor && !matchCategory) return false;
    }
    return true;
  });

  const handleOpenNew = () => {
    setEditingArticle({
      id: `article-${Date.now()}`,
      title: '',
      slug: '',
      previousSlugs: [],
      excerpt: '',
      content: '',
      coverImageUrl: '',
      coverImageAlt: '',
      inlineImages: [],
      authorName: 'KeedoHub Direction Desk',
      authorRole: 'Studio Author',
      category: 'Creative Direction',
      tags: ['creative-direction', 'studio'],
      status: 'Draft',
      featured: false,
      publishedAt: new Date().toISOString().slice(0, 10),
    });
    setErrorMsg(null);
  };

  const handleOpenEdit = (article: JournalArticle) => {
    setEditingArticle({ ...article });
    setErrorMsg(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle || !editingArticle.title?.trim()) {
      setErrorMsg('Article title is required.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const saved = await saveJournalArticle(
        editingArticle as Partial<JournalArticle> & { title: string },
        firebaseUser?.uid || 'admin',
        articles,
      );

      const exists = articles.findIndex(a => a.id === saved.id);
      let updated: JournalArticle[];
      if (exists >= 0) {
        updated = [...articles];
        updated[exists] = saved;
      } else {
        updated = [saved, ...articles];
      }

      persistArticles(updated);
      setSaving(false);
      setEditingArticle(null);
      setSuccessMsg('Journal article saved successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save article.');
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteJournalArticle(deleteTarget.id);
      const updated = articles.filter(a => a.id !== deleteTarget.id);
      persistArticles(updated);
      setDeleteTarget(null);
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  const handleSeedDefaults = async () => {
    try {
      await seedDefaultJournalArticles('admin');
      setSuccessMsg('Default journal articles seeded successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to seed defaults.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="border border-[#1E1E1E] bg-[#0E0E0E] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search articles by title or author..."
              className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] pl-8 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'All' | JournalArticleStatus)}
            className="bg-[#141414] border border-[#262626] text-xs text-neutral-300 px-3 py-2 focus:outline-none focus:border-[#FF1E1E]"
            aria-label="Filter status"
          >
            <option value="All">All Statuses</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Archived">Archived</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSeedDefaults}
            className="inline-flex items-center gap-1.5 border border-[#333] hover:border-white bg-[#121212] px-3 py-2 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
          >
            <Sparkles size={13} className="text-[#FF1E1E]" />
            <span>Seed Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNew}
            className="inline-flex items-center gap-1.5 bg-[#FF1E1E] hover:bg-white hover:text-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <Plus size={14} />
            <span>New Article</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="border border-emerald-900/60 bg-emerald-950/25 p-3 text-xs text-emerald-300">
          {successMsg}
        </div>
      )}

      {/* Articles Table */}
      <div className="border border-[#1E1E1E] bg-[#0A0A0A] overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[#1E1E1E] bg-[#0E0E0E] font-mono uppercase text-[10px] text-neutral-400">
            <tr>
              <th className="p-3.5">Title &amp; Category</th>
              <th className="p-3.5">Author</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Date</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#181818] text-neutral-300">
            {filteredArticles.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-neutral-500 font-mono">
                  No journal articles found.
                </td>
              </tr>
            ) : (
              filteredArticles.map(art => (
                <tr key={art.id} className="hover:bg-[#111111] transition-colors">
                  <td className="p-3.5 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{art.title}</span>
                      {art.featured && (
                        <span className="bg-[#FF1E1E]/20 text-[#FF1E1E] font-mono text-[9px] uppercase px-1.5 py-0.5">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[10px] text-neutral-500 uppercase">
                      {art.category} · {art.readingTimeMinutes || 5} min read · /article/{art.slug}
                    </p>
                  </td>
                  <td className="p-3.5">
                    <p className="font-semibold text-white">{art.authorName}</p>
                    <p className="text-[11px] text-neutral-500">{art.authorRole}</p>
                  </td>
                  <td className="p-3.5 font-mono text-[11px]">
                    <span
                      className={`px-2 py-0.5 uppercase ${
                        art.status === 'Published'
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50'
                          : art.status === 'Draft'
                          ? 'bg-amber-950/40 text-amber-400 border border-amber-900/50'
                          : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                      }`}
                    >
                      {art.status}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-neutral-400">
                    {art.publishedAt}
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(art)}
                      className="inline-flex items-center gap-1 border border-[#333] hover:border-white bg-[#141414] px-2.5 py-1 text-xs text-white"
                    >
                      <Edit3 size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(art)}
                      className="inline-flex items-center gap-1 border border-red-900/50 hover:border-red-600 bg-red-950/20 px-2.5 py-1 text-xs text-red-400 hover:text-white"
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Editor Modal / Drawer */}
      {editingArticle && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm overflow-y-auto"
          onClick={() => setEditingArticle(null)}
        >
          <div
            className="my-8 w-full max-w-4xl border border-[#2A2A2A] bg-[#0E0E0E] p-6 sm:p-8 space-y-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1E1E1E] pb-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#FF1E1E]">
                  Studio Journal Editor
                </p>
                <h3 className="text-lg font-bold text-white">
                  {editingArticle.title ? `Edit: ${editingArticle.title}` : 'Create New Article'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingArticle(null)}
                className="text-neutral-400 hover:text-white"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div className="border border-red-900/60 bg-red-950/25 p-3 text-xs text-red-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-mono uppercase text-neutral-400">Article Title *</label>
                  <input
                    type="text"
                    required
                    value={editingArticle.title || ''}
                    onChange={e => {
                      const title = e.target.value;
                      setEditingArticle(prev => ({
                        ...prev,
                        title,
                        slug: prev?.slug ? prev.slug : slugifyTitle(title),
                      }));
                    }}
                    className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3.5 py-2 text-xs text-white focus:outline-none"
                    placeholder="e.g. Designing A Release Identity That Travels Beyond The Cover"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase text-neutral-400">URL Slug</label>
                  <input
                    type="text"
                    value={editingArticle.slug || ''}
                    onChange={e => setEditingArticle(prev => ({ ...prev, slug: e.target.value }))}
                    className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3.5 py-2 text-xs text-white focus:outline-none font-mono"
                    placeholder="custom-url-slug"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase text-neutral-400">Category</label>
                  <select
                    value={editingArticle.category || 'Creative Direction'}
                    onChange={e => setEditingArticle(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3.5 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Creative Direction">Creative Direction</option>
                    <option value="Brand Systems">Brand Systems</option>
                    <option value="Music & Visuals">Music & Visuals</option>
                    <option value="Motion & Production">Motion & Production</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase text-neutral-400">Author Name</label>
                  <input
                    type="text"
                    value={editingArticle.authorName || ''}
                    onChange={e => setEditingArticle(prev => ({ ...prev, authorName: e.target.value }))}
                    className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3.5 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase text-neutral-400">Author Role</label>
                  <input
                    type="text"
                    value={editingArticle.authorRole || ''}
                    onChange={e => setEditingArticle(prev => ({ ...prev, authorRole: e.target.value }))}
                    className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3.5 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase text-neutral-400">Publication Status</label>
                  <select
                    value={editingArticle.status || 'Draft'}
                    onChange={e => setEditingArticle(prev => ({ ...prev, status: e.target.value as JournalArticleStatus }))}
                    className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3.5 py-2 text-xs text-white focus:outline-none font-mono"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase text-neutral-400">Publication Date</label>
                  <input
                    type="date"
                    value={editingArticle.publishedAt || ''}
                    onChange={e => setEditingArticle(prev => ({ ...prev, publishedAt: e.target.value }))}
                    className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3.5 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-mono uppercase text-neutral-400">Cover Image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={editingArticle.coverImageUrl || ''}
                      onChange={e => setEditingArticle(prev => ({ ...prev, coverImageUrl: e.target.value }))}
                      className="flex-1 bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3.5 py-2 text-xs text-white focus:outline-none font-mono"
                      placeholder="https://... or choose from media library"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setMediaPickerTarget('cover');
                        setMediaPickerOpen(true);
                      }}
                      className="border border-[#333] hover:border-white bg-[#181818] px-3.5 py-2 text-xs font-semibold text-white whitespace-nowrap"
                    >
                      Media Library
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-mono uppercase text-neutral-400">Excerpt / Lead Summary</label>
                  <textarea
                    rows={2}
                    value={editingArticle.excerpt || ''}
                    onChange={e => setEditingArticle(prev => ({ ...prev, excerpt: e.target.value }))}
                    className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3.5 py-2 text-xs text-white focus:outline-none"
                    placeholder="Short summary for card previews..."
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-mono uppercase text-neutral-400">
                      Article Content (Markdown: ## Headings, &gt; Quotes, - Lists, ![Alt](Url))
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaPickerTarget('inline');
                        setMediaPickerOpen(true);
                      }}
                      className="font-mono text-[10px] text-[#FF1E1E] hover:underline uppercase"
                    >
                      + Insert Media Figure
                    </button>
                  </div>
                  <textarea
                    rows={10}
                    value={editingArticle.content || ''}
                    onChange={e => setEditingArticle(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] p-3.5 text-xs text-white font-mono leading-relaxed focus:outline-none"
                    placeholder="Write article body in Markdown..."
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-mono uppercase text-neutral-400">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={Array.isArray(editingArticle.tags) ? editingArticle.tags.join(', ') : ''}
                    onChange={e =>
                      setEditingArticle(prev => ({
                        ...prev,
                        tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean),
                      }))
                    }
                    className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3.5 py-2 text-xs text-white focus:outline-none font-mono"
                    placeholder="creative-direction, brand-identity, vinyl, motion"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-3 pt-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingArticle.featured)}
                      onChange={e => setEditingArticle(prev => ({ ...prev, featured: e.target.checked }))}
                      className="rounded border-neutral-700 bg-neutral-900 text-[#FF1E1E] focus:ring-0"
                    />
                    <span className="text-xs font-bold text-white uppercase">Feature as Lead Story</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E1E1E]">
                <button
                  type="button"
                  onClick={() => setEditingArticle(null)}
                  className="px-4 py-2.5 border border-[#333] hover:border-white text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-[#FF1E1E] hover:bg-white hover:text-black text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  <span>{saving ? 'Saving Article…' : 'Save & Publish'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      {mediaPickerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm overflow-y-auto"
          onClick={() => setMediaPickerOpen(false)}
        >
          <div
            className="my-8 w-full max-w-4xl border border-[#2A2A2A] bg-[#0C0C0C] p-6 space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1E1E1E] pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Select Media Asset from Library
              </h3>
              <button
                type="button"
                onClick={() => setMediaPickerOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <AdminMediaLibrary
              selectionMode={true}
              onSelectAsset={(url, alt) => {
                if (mediaPickerTarget === 'cover') {
                  setEditingArticle(prev => ({
                    ...prev,
                    coverImageUrl: url,
                    coverImageAlt: alt || prev?.title || '',
                  }));
                } else {
                  const markdownFigure = `\n\n![${alt}](${url})\n\n`;
                  setEditingArticle(prev => ({
                    ...prev,
                    content: (prev?.content || '') + markdownFigure,
                  }));
                }
                setMediaPickerOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-md border border-[#2E2E2E] bg-[#0E0E0E] p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 text-amber-400">
              <AlertTriangle size={20} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Confirm Article Deletion</h3>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-white font-mono">{deleteTarget.title}</span>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1C1C1C]">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-2 border border-[#333] hover:border-white text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 bg-[#FF1E1E] hover:bg-red-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {deleting && <Loader2 size={13} className="animate-spin" />}
                <span>{deleting ? 'Deleting…' : 'Delete Article'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

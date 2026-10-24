/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LYRICAL ENT — Artist Management & Simple Roster
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Artist } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { 
  Users, 
  Plus, 
  Disc3, 
  Edit3, 
  Trash2, 
  Archive, 
  Mail, 
  ExternalLink,
  CheckCircle2,
  X
} from 'lucide-react';

export const ArtistManagement: React.FC = () => {
  const { 
    artists, 
    releases, 
    addArtist, 
    updateArtist, 
    deleteArtist, 
    searchQuery,
    setActiveModule 
  } = useApp();

  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(artists[0]?.id || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);

  // Simple Form State
  const [name, setName] = useState('');
  const [genre, setGenre] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Artist['status']>('Active');
  const [avatarUrl, setAvatarUrl] = useState('');

  const selectedArtist = artists.find(a => a.id === selectedArtistId) || artists[0];

  const filteredArtists = artists.filter(artist => {
    const matchesSearch = searchQuery === '' || 
      artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artist.genre.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const openAddModal = () => {
    setEditingArtist(null);
    setName('');
    setGenre('Neo-Soul / Alternative R&B');
    setBio('');
    setEmail('management@lyricalent.com');
    setStatus('Active');
    setAvatarUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (artist: Artist) => {
    setEditingArtist(artist);
    setName(artist.name);
    setGenre(artist.genre);
    setBio(artist.bio);
    setEmail(artist.email || '');
    setStatus(artist.status);
    setAvatarUrl(artist.avatarUrl || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingArtist) {
      updateArtist(editingArtist.id, {
        name,
        genre,
        bio,
        email,
        status,
        avatarUrl
      });
    } else {
      const created = addArtist({
        name,
        moniker: name.toUpperCase(),
        genre,
        bio: bio || 'Artist roster profile managed under LYRICAL ENT development program.',
        email,
        status,
        avatarUrl: avatarUrl || '/src/assets/images/artist_showcase_portrait_1792791744296.jpg',
        careerGoals: 'Produce and release projects under LYRICAL ENT',
        developmentNotes: 'Active label roster artist',
        projectHistory: [],
        releaseIds: [],
        isConfidential: false
      });
      setSelectedArtistId(created.id);
    }

    setIsModalOpen(false);
  };

  const handleToggleArchive = (artist: Artist) => {
    const newStatus: Artist['status'] = artist.status === 'Active' ? 'Development' : 'Active';
    updateArtist(artist.id, { status: newStatus });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove ${name} from label roster?`)) {
      deleteArtist(id);
      if (selectedArtistId === id) {
        setSelectedArtistId(artists.filter(a => a.id !== id)[0]?.id || null);
      }
    }
  };

  // Associated releases for selected artist
  const artistReleases = selectedArtist 
    ? releases.filter(r => r.artistId === selectedArtist.id || r.artistName.toLowerCase() === selectedArtist.name.toLowerCase()) 
    : [];

  return (
    <div className="w-full max-w-full overflow-hidden space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C1C1C] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400">
              SIMPLIFIED ARTIST ROSTER · ESSENTIAL ATTRIBUTES
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono uppercase break-words">
            ARTIST ROSTER &amp; TALENT DIRECTORY
          </h1>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Clean, practical artist roster connected directly to music releases. Fast profiles without complicated management tabs.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors self-start sm:self-auto font-mono shadow-sm"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>Add Artist</span>
        </button>
      </div>

      {artists.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Artists on Roster"
          description="Add your first recording artist or development talent to the roster."
          actionLabel="Add First Artist"
          onAction={openAddModal}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start w-full min-w-0">
          
          {/* Left Column: Artist List (4 Cols) */}
          <div className="lg:col-span-5 space-y-3 min-w-0">
            <div className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider">
              LABEL ROSTER ({filteredArtists.length})
            </div>

            <div className="space-y-2.5">
              {filteredArtists.map(artist => {
                const isSelected = artist.id === selectedArtist?.id;
                const relCount = releases.filter(r => r.artistId === artist.id || r.artistName.toLowerCase() === artist.name.toLowerCase()).length;

                return (
                  <div
                    key={artist.id}
                    onClick={() => setSelectedArtistId(artist.id)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected 
                        ? 'bg-[#181818] border-white text-white shadow-sm' 
                        : 'bg-[#0E0E0E] border-[#1E1E1E] text-neutral-300 hover:border-[#383838]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {artist.avatarUrl ? (
                        <img 
                          src={artist.avatarUrl} 
                          alt={artist.name} 
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded object-cover grayscale border border-[#2B2B2B] shrink-0" 
                        />
                      ) : (
                        <div className="w-11 h-11 rounded bg-[#1C1C1C] flex items-center justify-center font-mono font-bold text-sm text-white border border-[#2B2B2B] shrink-0">
                          {artist.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white truncate">{artist.name}</h4>
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                            artist.status === 'Active' ? 'bg-white/10 text-white' : 'bg-neutral-800 text-neutral-400'
                          }`}>
                            {artist.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 font-mono truncate mt-0.5">
                          {artist.genre || 'Recording Artist'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-neutral-400">
                        {relCount} {relCount === 1 ? 'Release' : 'Releases'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Artist Detail Profile (7 Cols) */}
          {selectedArtist && (
            <div className="lg:col-span-7 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg p-5 sm:p-6 space-y-6 min-w-0 shadow-sm">
              
              {/* Header profile */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1C1C1C] pb-4">
                <div className="flex items-center gap-4 min-w-0">
                  {selectedArtist.avatarUrl ? (
                    <img 
                      src={selectedArtist.avatarUrl} 
                      alt={selectedArtist.name} 
                      className="w-16 h-16 rounded object-cover grayscale border border-white/20 shrink-0" 
                    />
                  ) : (
                    <div className="w-16 h-16 rounded bg-[#181818] flex items-center justify-center font-mono font-bold text-xl text-white border border-white/20 shrink-0">
                      {selectedArtist.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-bold text-white uppercase tracking-tight truncate">
                        {selectedArtist.name}
                      </h2>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-white/10 text-white rounded">
                        {selectedArtist.status}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-neutral-400 mt-0.5">
                      {selectedArtist.genre}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 font-mono text-xs">
                  <button
                    onClick={() => openEditModal(selectedArtist)}
                    className="p-2 bg-[#161616] border border-[#2B2B2B] text-neutral-300 hover:text-white rounded"
                    title="Edit Artist"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => handleToggleArchive(selectedArtist)}
                    className="p-2 bg-[#161616] border border-[#2B2B2B] text-neutral-300 hover:text-white rounded"
                    title="Toggle Status"
                  >
                    <Archive size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(selectedArtist.id, selectedArtist.name)}
                    className="p-2 bg-[#201010] border border-red-500/30 text-red-300 hover:text-red-100 rounded"
                    title="Delete Artist"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Biography / Description */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider">
                  Artist Biography
                </div>
                <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                  {selectedArtist.bio || 'No biography written yet.'}
                </p>
              </div>

              {/* Management & Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#121212] border border-[#202020] rounded-lg font-mono text-xs">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block">Management / Contact</span>
                  <span className="text-white truncate block">{selectedArtist.email || 'management@lyricalent.com'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block">Roster Contract</span>
                  <span className="text-neutral-300">LYRICAL ENT Worldwide (Standard)</span>
                </div>
              </div>

              {/* Associated Music Releases */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider">
                    Associated Releases ({artistReleases.length})
                  </div>
                  <button
                    onClick={() => setActiveModule('releases')}
                    className="text-[10px] font-mono text-white hover:underline flex items-center gap-1"
                  >
                    <span>Manage Releases →</span>
                  </button>
                </div>

                {artistReleases.length === 0 ? (
                  <div className="p-4 bg-[#121212] border border-dashed border-[#242424] rounded text-center text-xs font-mono text-neutral-500">
                    No releases associated with this artist yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {artistReleases.map(rel => (
                      <div 
                        key={rel.id}
                        className="p-3 bg-[#121212] border border-[#222222] rounded flex items-center justify-between font-mono text-xs"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Disc3 size={15} className="text-neutral-400 shrink-0" />
                          <div className="truncate">
                            <span className="text-white font-bold">{rel.title}</span>
                            <span className="text-neutral-400 text-[10px] ml-2">({rel.type} · {rel.plannedReleaseDate})</span>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 bg-black text-neutral-300 border border-white/20 rounded uppercase shrink-0">
                          {rel.distributionStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

      {/* ================= ADD / EDIT MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0D0D0D] border border-[#282828] max-w-lg w-full rounded-xl p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <h3 className="text-sm font-bold text-white uppercase font-mono">
                {editingArtist ? 'Edit Artist Profile' : 'Onboard New Artist'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[10px] text-neutral-400 mb-1">ARTIST STAGE NAME *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Sariyah Cole"
                  className="w-full bg-[#141414] border border-[#262626] rounded px-3 py-2 text-white focus:outline-none focus:border-white font-sans text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-neutral-400 mb-1">GENRE / ROLE</label>
                  <input
                    type="text"
                    value={genre}
                    onChange={e => setGenre(e.target.value)}
                    placeholder="Neo-Soul / Alternative R&B"
                    className="w-full bg-[#141414] border border-[#262626] rounded px-3 py-2 text-white focus:outline-none focus:border-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-neutral-400 mb-1">STATUS</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full bg-[#141414] border border-[#262626] rounded px-3 py-2 text-white focus:outline-none focus:border-white text-xs"
                  >
                    <option value="Active">Active</option>
                    <option value="Development">Development</option>
                    <option value="Signed">Signed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 mb-1">CONTACT / MANAGEMENT EMAIL</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="mgmt@artistname.com"
                  className="w-full bg-[#141414] border border-[#262626] rounded px-3 py-2 text-white focus:outline-none focus:border-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 mb-1">SHORT DESCRIPTION / BIOGRAPHY</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Vocalist and composer fusing organic acoustic instrumentation with modern rhythm..."
                  className="w-full bg-[#141414] border border-[#262626] rounded p-2.5 text-white focus:outline-none focus:border-white font-sans text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#222222] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 bg-[#161616] text-neutral-300 hover:text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-white text-black font-bold uppercase rounded hover:bg-neutral-200 transition-colors"
                >
                  Save Artist Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

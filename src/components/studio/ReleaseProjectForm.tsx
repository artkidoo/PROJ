/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LYRICAL ENT — Release Project Setup Form
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ReleaseType, ReleaseProject } from '../../types/campaign';
import { generateCampaignDesigns } from '../../utils/campaignGenerator';

interface ReleaseProjectFormProps {
  onComplete: (project: ReleaseProject) => void;
  onCancel: () => void;
  initialData?: Partial<ReleaseProject>;
}

export const ReleaseProjectForm: React.FC<ReleaseProjectFormProps> = ({ onComplete, onCancel, initialData }) => {
  const { addReleaseProject, addCampaignDesign, logActivity } = useApp();
  const [formData, setFormData] = useState<Partial<ReleaseProject>>({
    artistName: '',
    songTitle: '',
    releaseType: 'Single',
    releaseDate: new Date().toISOString().split('T')[0],
    genre: '',
    primaryColor: '#FFFFFF',
    secondaryColor: '#A3A3A3',
    selectedPlatforms: ['Spotify', 'Apple Music', 'YouTube'],
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.artistName) newErrors.artistName = 'Artist name is required';
    if (!formData.songTitle) newErrors.songTitle = 'Song title is required';
    if (!formData.releaseDate) newErrors.releaseDate = 'Release date is required';
    if (!formData.genre) newErrors.genre = 'Genre is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsGenerating(true);
    
    // Simulate generation time for UX
    setTimeout(() => {
      const project = addReleaseProject(formData as Omit<ReleaseProject, 'id' | 'createdAt' | 'updatedAt'>);
      
      // Generate campaign designs
      const designs = generateCampaignDesigns(project);
      designs.forEach(design => {
        addCampaignDesign(design);
      });

      logActivity('Campaign Generated', 'campaigns', `Generated 22 coordinated designs for ${project.songTitle}`);
      setIsGenerating(false);
      onComplete(project);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-4xl mx-auto shadow-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight">Setup Release Project</h2>
        <p className="text-neutral-400 text-sm mt-1">Initialize your campaign metadata to generate coordinated designs.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Metadata Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Artist Name</label>
              <input
                type="text"
                name="artistName"
                value={formData.artistName}
                onChange={handleChange}
                placeholder="e.g. SARIYAH COLE"
                className={`w-full bg-black border ${errors.artistName ? 'border-red-500' : 'border-neutral-800'} rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white transition-colors`}
              />
              {errors.artistName && <p className="text-red-500 text-xs mt-1">{errors.artistName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Song / Release Title</label>
              <input
                type="text"
                name="songTitle"
                value={formData.songTitle}
                onChange={handleChange}
                placeholder="e.g. MIDNIGHT ARCHITECTURE"
                className={`w-full bg-black border ${errors.songTitle ? 'border-red-500' : 'border-neutral-800'} rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white transition-colors`}
              />
              {errors.songTitle && <p className="text-red-500 text-xs mt-1">{errors.songTitle}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Type</label>
                <select
                  name="releaseType"
                  value={formData.releaseType}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white transition-colors"
                >
                  <option value="Single">Single</option>
                  <option value="EP">EP</option>
                  <option value="Album">Album</option>
                  <option value="Mixtape">Mixtape</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Genre</label>
                <input
                  type="text"
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  placeholder="e.g. Neo-Soul"
                  className={`w-full bg-black border ${errors.genre ? 'border-red-500' : 'border-neutral-800'} rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white transition-colors`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Release Date</label>
                <input
                  type="date"
                  name="releaseDate"
                  value={formData.releaseDate}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Release Time</label>
                <input
                  type="time"
                  name="releaseTime"
                  value={formData.releaseTime}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Visuals & Links Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Promotional Message / Lyric</label>
              <textarea
                name="promoMessage"
                value={formData.promoMessage}
                onChange={handleChange}
                placeholder="A powerful lyric or short description..."
                rows={3}
                className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Primary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={handleChange}
                    className="h-10 w-12 bg-black border border-neutral-800 rounded p-1 cursor-pointer"
                  />
                  <input
                    type="text"
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={handleChange}
                    className="flex-1 bg-black border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white uppercase"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Secondary</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    name="secondaryColor"
                    value={formData.secondaryColor}
                    onChange={handleChange}
                    className="h-10 w-12 bg-black border border-neutral-800 rounded p-1 cursor-pointer"
                  />
                  <input
                    type="text"
                    name="secondaryColor"
                    value={formData.secondaryColor}
                    onChange={handleChange}
                    className="flex-1 bg-black border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white uppercase"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Streaming Link (Linktree / Spotify)</label>
              <input
                type="url"
                name="streamingLink"
                value={formData.streamingLink}
                onChange={handleChange}
                placeholder="https://open.spotify.com/..."
                className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-neutral-400 hover:text-white font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isGenerating}
            className={`px-8 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 ${
              isGenerating 
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
                : 'bg-white text-black hover:bg-neutral-200'
            }`}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-4 w-4 text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Studio...
              </>
            ) : (
              'Create Release Campaign'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

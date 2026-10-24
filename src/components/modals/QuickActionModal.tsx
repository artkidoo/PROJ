import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { ReleaseType, DocumentType } from '../../types';
import { Disc3, Users, FileText, Megaphone, CheckSquare, Sparkles } from 'lucide-react';
import { ReleaseProjectForm } from '../studio/ReleaseProjectForm';

export const QuickActionModal: React.FC = () => {
  const {
    isQuickActionOpen,
    setIsQuickActionOpen,
    quickActionTarget,
    artists,
    releases,
    addRelease,
    addArtist,
    addDocument,
    addCampaign,
    addTask,
    currentRole
  } = useApp();

  const [activeTab, setActiveTab] = useState<'release' | 'artist' | 'document' | 'campaign' | 'task' | 'releaseProject'>('release');

  useEffect(() => {
    if (quickActionTarget) {
      setActiveTab(quickActionTarget);
    }
  }, [quickActionTarget]);

  // Form states
  // 1. Release
  const [releaseTitle, setReleaseTitle] = useState('');
  const [releaseType, setReleaseType] = useState<ReleaseType>('Single');
  const [releaseArtistId, setReleaseArtistId] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [producer, setProducer] = useState('');
  const [songwriters, setSongwriters] = useState('');
  const [isrc, setIsrc] = useState('');

  // 2. Artist
  const [artistName, setArtistName] = useState('');
  const [moniker, setMoniker] = useState('');
  const [genre, setGenre] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [careerGoals, setCareerGoals] = useState('');

  // 3. Document
  const [docType, setDocType] = useState<DocumentType>('official_letter');
  const [docTitle, setDocTitle] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientOrg, setRecipientOrg] = useState('');
  const [docBody, setDocBody] = useState('');

  // 4. Campaign
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignArtistId, setCampaignArtistId] = useState('');
  const [campaignBudget, setCampaignBudget] = useState(5000);
  const [campaignLaunchDate, setCampaignLaunchDate] = useState('');
  const [campaignNotes, setCampaignNotes] = useState('');

  // 5. Task
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState<'A&R' | 'Creative' | 'Legal' | 'Distribution' | 'Marketing'>('A&R');
  const [taskPriority, setTaskPriority] = useState<'Urgent' | 'High' | 'Normal' | 'Low'>('High');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignee, setTaskAssignee] = useState<string>(currentRole);

  const resetForms = () => {
    setReleaseTitle('');
    setReleaseArtistId('');
    setReleaseDate('');
    setProducer('');
    setSongwriters('');
    setIsrc('');
    setArtistName('');
    setMoniker('');
    setGenre('');
    setBio('');
    setEmail('');
    setCareerGoals('');
    setDocTitle('');
    setRecipientName('');
    setRecipientOrg('');
    setDocBody('');
    setCampaignTitle('');
    setCampaignArtistId('');
    setCampaignNotes('');
    setTaskTitle('');
    setTaskDueDate('');
  };

  const handleClose = () => {
    setIsQuickActionOpen(false);
  };

  const handleSubmitRelease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!releaseTitle || !releaseArtistId || !releaseDate) return;
    const selectedArtist = artists.find(a => a.id === releaseArtistId);

    addRelease({
      title: releaseTitle,
      type: releaseType,
      artistId: releaseArtistId,
      artistName: selectedArtist?.name || 'Unknown Artist',
      producer: producer || 'LYRICAL ENT Production Lab',
      songwriters: songwriters || selectedArtist?.name || 'LYRICAL ENT',
      credits: `Produced by ${producer || 'LYRICAL ENT'}. Executive Producer: LYRICAL ENT LLC.`,
      plannedReleaseDate: releaseDate,
      distributionStatus: 'Planning',
      isrc: isrc || `US-LYR-${new Date().getFullYear().toString().slice(-2)}-${Math.floor(10000 + Math.random() * 90000)}`,
      rightsInfo: `(P) & (C) ${new Date().getFullYear()} LYRICAL ENT LLC. All rights reserved.`,
      releaseNotes: 'Created via Quick Action studio intake.',
      marketingAssetsCount: 0,
      checklist: {
        audioMastered: false,
        artworkApproved: false,
        splitSheetSigned: false,
        metadataVerified: false,
        distributionSubmitted: false,
        pressKitReady: false,
        marketingAssetsReady: false
      }
    });
    resetForms();
    handleClose();
  };

  const handleSubmitArtist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistName || !genre) return;

    addArtist({
      name: artistName,
      moniker: moniker || artistName.toUpperCase(),
      genre,
      bio: bio || 'Artist roster profile managed under LYRICAL ENT development program.',
      email: email || 'management@lyricalent.com',
      status: 'Development',
      careerGoals: careerGoals || 'Build core audience and produce debut project.',
      developmentNotes: 'Initial onboarding assessment recorded.',
      projectHistory: [],
      releaseIds: [],
      isConfidential: false
    });
    resetForms();
    handleClose();
  };

  const handleSubmitDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle || !recipientName) return;

    addDocument({
      type: docType,
      title: docTitle,
      referenceNo: `LYR-${docType.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      recipientName,
      recipientOrg,
      authorName: 'Ojo Abdulkareem',
      authorRole: currentRole,
      status: 'Draft',
      bodyContent: docBody || 'Official corporate record drafted in LYRICAL ENT Studio.',
      items: docType === 'invoice' || docType === 'quotation' ? [
        { description: 'Master Recording & Production Services', quantity: 1, unitPrice: 2500, total: 2500 }
      ] : undefined
    });
    resetForms();
    handleClose();
  };

  const handleSubmitCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignTitle || !campaignArtistId || !campaignLaunchDate) return;
    const selectedArtist = artists.find(a => a.id === campaignArtistId);

    addCampaign({
      title: campaignTitle,
      artistId: campaignArtistId,
      artistName: selectedArtist?.name || 'Roster Artist',
      type: 'Single Launch',
      budget: Number(campaignBudget) || 5000,
      status: 'Planning',
      launchDate: campaignLaunchDate,
      notes: campaignNotes || 'Campaign brief generated in LYRICAL Studio.',
      deliverables: [
        {
          id: `del-${Date.now()}-1`,
          name: 'Official 3000x3000px Cover Artwork',
          format: '1:1 Square',
          status: 'Pending',
          dueDate: campaignLaunchDate
        },
        {
          id: `del-${Date.now()}-2`,
          name: 'Official Announcement Poster',
          format: 'Print / Poster',
          status: 'Pending',
          dueDate: campaignLaunchDate
        }
      ]
    });
    resetForms();
    handleClose();
  };

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskDueDate) return;

    addTask({
      title: taskTitle,
      category: taskCategory,
      priority: taskPriority,
      dueDate: taskDueDate,
      assignee: taskAssignee,
      status: 'Todo'
    });
    resetForms();
    handleClose();
  };

  return (
    <Modal
      isOpen={isQuickActionOpen}
      onClose={handleClose}
      title="Create Workspace Record"
      subtitle="LYRICAL ENT studio intake and record generation"
      maxWidth="2xl"
    >
      {/* Tab Switcher (Functional buttons, anti-pill segmented control) */}
      <div className="flex items-center gap-1 p-1 bg-[#141414] border border-[#242424] rounded-md mb-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('release')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
            activeTab === 'release' ? 'bg-[#262626] text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Disc3 size={13} />
          <span>Music Release</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('artist')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
            activeTab === 'artist' ? 'bg-[#262626] text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Users size={13} />
          <span>Artist Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('document')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
            activeTab === 'document' ? 'bg-[#262626] text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <FileText size={13} />
          <span>Corporate Doc</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('campaign')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
            activeTab === 'campaign' ? 'bg-[#262626] text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Megaphone size={13} />
          <span>Campaign Brief</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('releaseProject')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
            activeTab === 'releaseProject' ? 'bg-[#262626] text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Sparkles size={13} />
          <span>Release Studio</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('task')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
            activeTab === 'task' ? 'bg-[#262626] text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <CheckSquare size={13} />
          <span>Operation Task</span>
        </button>
      </div>

      {/* 1. Release Tab Form */}
      {activeTab === 'release' && (
        <form onSubmit={handleSubmitRelease} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">PROJECT TITLE *</label>
              <input
                type="text"
                required
                value={releaseTitle}
                onChange={e => setReleaseTitle(e.target.value)}
                placeholder="e.g. Nocturnal Echoes"
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">RELEASE TYPE *</label>
              <select
                value={releaseType}
                onChange={e => setReleaseType(e.target.value as ReleaseType)}
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 cursor-pointer"
              >
                <option value="Single">Single</option>
                <option value="EP">EP</option>
                <option value="Album">Album</option>
                <option value="Music Video">Music Video</option>
                <option value="Collaboration">Collaboration</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">MAIN ARTIST *</label>
              <select
                required
                value={releaseArtistId}
                onChange={e => setReleaseArtistId(e.target.value)}
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 cursor-pointer"
              >
                <option value="">Select roster artist...</option>
                {artists.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.genre})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">PLANNED RELEASE DATE *</label>
              <input
                type="date"
                required
                value={releaseDate}
                onChange={e => setReleaseDate(e.target.value)}
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">PRIMARY PRODUCER</label>
              <input
                type="text"
                value={producer}
                onChange={e => setProducer(e.target.value)}
                placeholder="Producer credits"
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">SONGWRITERS</label>
              <input
                type="text"
                value={songwriters}
                onChange={e => setSongwriters(e.target.value)}
                placeholder="Songwriter credits"
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-400"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#1C1C1C] flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors"
            >
              Save Release Record
            </button>
          </div>
        </form>
      )}

      {/* 2. Artist Tab Form */}
      {activeTab === 'artist' && (
        <form onSubmit={handleSubmitArtist} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">ARTIST NAME *</label>
              <input
                type="text"
                required
                value={artistName}
                onChange={e => setArtistName(e.target.value)}
                placeholder="e.g. Maya Lin"
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">ARTIST MONIKER</label>
              <input
                type="text"
                value={moniker}
                onChange={e => setMoniker(e.target.value)}
                placeholder="e.g. MAYA"
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">PRIMARY GENRE *</label>
              <input
                type="text"
                required
                value={genre}
                onChange={e => setGenre(e.target.value)}
                placeholder="e.g. Alternative Soul, Ambient Electronic"
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">CONTACT / MANAGEMENT EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="artist@management.com"
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1">ARTIST BIOGRAPHY</label>
            <textarea
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Background, musical signature, and sound aesthetic..."
              className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-400"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1">CAREER MILESTONES & GOALS</label>
            <input
              type="text"
              value={careerGoals}
              onChange={e => setCareerGoals(e.target.value)}
              placeholder="e.g. Release 4-track EP in Q3, secure festival appearances"
              className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-400"
            />
          </div>

          <div className="pt-3 border-t border-[#1C1C1C] flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors"
            >
              Onboard Artist Profile
            </button>
          </div>
        </form>
      )}

      {/* 3. Document Tab Form */}
      {activeTab === 'document' && (
        <form onSubmit={handleSubmitDoc} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">DOCUMENT TYPE *</label>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value as DocumentType)}
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 cursor-pointer"
              >
                <option value="official_letter">Official Letterhead Document</option>
                <option value="invoice">Commercial Invoice</option>
                <option value="quotation">Project Quotation</option>
                <option value="receipt">Payment Receipt</option>
                <option value="partnership_proposal">Partnership Proposal</option>
                <option value="internal_memo">Internal Executive Memo</option>
                <option value="meeting_minutes">Meeting Minutes</option>
                <option value="asset_handover">Asset Handover Form</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">DOCUMENT TITLE / SUBJECT *</label>
              <input
                type="text"
                required
                value={docTitle}
                onChange={e => setDocTitle(e.target.value)}
                placeholder="e.g. Master Delivery Notice"
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">RECIPIENT NAME *</label>
              <input
                type="text"
                required
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
                placeholder="e.g. David Vance"
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">RECIPIENT ORGANIZATION</label>
              <input
                type="text"
                value={recipientOrg}
                onChange={e => setRecipientOrg(e.target.value)}
                placeholder="e.g. Sony Music Publishing"
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1">EXECUTIVE SUMMARY / BODY CONTENT</label>
            <textarea
              rows={4}
              value={docBody}
              onChange={e => setDocBody(e.target.value)}
              placeholder="Formal text to include in document..."
              className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-400"
            />
          </div>

          <div className="pt-3 border-t border-[#1C1C1C] flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors"
            >
              Generate Document
            </button>
          </div>
        </form>
      )}

      {/* 4. Campaign Tab Form */}
      {activeTab === 'campaign' && (
        <form onSubmit={handleSubmitCampaign} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">CAMPAIGN TITLE *</label>
              <input
                type="text"
                required
                value={campaignTitle}
                onChange={e => setCampaignTitle(e.target.value)}
                placeholder="e.g. Autumn Single Global Rollout"
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">ATTACHED ARTIST *</label>
              <select
                required
                value={campaignArtistId}
                onChange={e => setCampaignArtistId(e.target.value)}
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 cursor-pointer"
              >
                <option value="">Select artist...</option>
                {artists.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">BUDGET ALLOCATED (USD)</label>
              <input
                type="number"
                value={campaignBudget}
                onChange={e => setCampaignBudget(Number(e.target.value))}
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">TARGET LAUNCH DATE *</label>
              <input
                type="date"
                required
                value={campaignLaunchDate}
                onChange={e => setCampaignLaunchDate(e.target.value)}
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1">CREATIVE STRATEGY NOTES</label>
            <textarea
              rows={3}
              value={campaignNotes}
              onChange={e => setCampaignNotes(e.target.value)}
              placeholder="Teaser timeline, visual direction, target publications..."
              className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-400"
            />
          </div>

          <div className="pt-3 border-t border-[#1C1C1C] flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors"
            >
              Initiate Campaign Brief
            </button>
          </div>
        </form>
      )}

      {/* 5. Task Tab Form */}
      {activeTab === 'task' && (
        <form onSubmit={handleSubmitTask} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1">TASK DIRECTIVE *</label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
              placeholder="e.g. Master tape alignment and metadata sign-off"
              className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">CATEGORY *</label>
              <select
                value={taskCategory}
                onChange={e => setTaskCategory(e.target.value as any)}
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 cursor-pointer"
              >
                <option value="A&R">A&R</option>
                <option value="Creative">Creative</option>
                <option value="Legal">Legal</option>
                <option value="Distribution">Distribution</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">PRIORITY</label>
              <select
                value={taskPriority}
                onChange={e => setTaskPriority(e.target.value as any)}
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 cursor-pointer"
              >
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Normal">Normal</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">DUE DATE *</label>
              <input
                type="date"
                required
                value={taskDueDate}
                onChange={e => setTaskDueDate(e.target.value)}
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1">ASSIGNEE</label>
            <input
              type="text"
              value={taskAssignee}
              onChange={e => setTaskAssignee(e.target.value)}
              placeholder="Assignee name or role"
              className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-400"
            />
          </div>

          <div className="pt-3 border-t border-[#1C1C1C] flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors"
            >
              Create Operation Task
            </button>
          </div>
        </form>
      )}
      {/* 6. Release Project Studio Tab */}
      {activeTab === 'releaseProject' && (
        <div className="animate-in fade-in zoom-in-95 duration-200">
          <ReleaseProjectForm 
            onComplete={() => handleClose()}
            onCancel={() => handleClose()}
          />
        </div>
      )}
    </Modal>
  );
};

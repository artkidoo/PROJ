import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ProductionProject, 
  ProductionStage, 
  ProductionPriority, 
  ProductionProjectType,
  DeliverableVersion,
  ProductionNote,
  ProductionQualityCheck,
  ClientCategory
} from '../../types';
import { 
  Briefcase, 
  Plus, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  Send, 
  FileText, 
  ShieldCheck, 
  Lock, 
  Layers, 
  Calendar, 
  User, 
  Upload, 
  Share2, 
  Trash2, 
  Download, 
  Search, 
  CheckSquare, 
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Tag
} from 'lucide-react';

const STAGES: { id: ProductionStage; label: string; color: string; border: string; bg: string }[] = [
  { id: 'New Request', label: 'New Request', color: '#60A5FA', border: '#1E3A8A', bg: '#0F172A' },
  { id: 'Brief Approved', label: 'Brief Approved', color: '#818CF8', border: '#312E81', bg: '#1E1B4B' },
  { id: 'In Production', label: 'In Production', color: '#FBBF24', border: '#78350F', bg: '#291804' },
  { id: 'Internal QA', label: 'Internal QA', color: '#C084FC', border: '#581C87', bg: '#20093B' },
  { id: 'Client Review', label: 'Client Review', color: '#38BDF8', border: '#0369A1', bg: '#082F49' },
  { id: 'Revision Required', label: 'Revision Required', color: '#F87171', border: '#991B1B', bg: '#450A0A' },
  { id: 'Ready for Delivery', label: 'Ready for Delivery', color: '#34D399', border: '#065F46', bg: '#064E3B' },
  { id: 'Delivered', label: 'Delivered', color: '#9CA3AF', border: '#374151', bg: '#1F2937' }
];

export const ProductionCenter: React.FC = () => {
  const { 
    productionProjects, 
    workspaces, 
    canAccessProductionCenter, 
    setActiveModule,
    currentRole,
    addProductionProject,
    updateProductionProject,
    deleteProductionProject,
    updateProductionStage,
    publishDeliverableVersion,
    addDeliverableVersion,
    addProductionNote,
    toggleQualityCheck
  } = useApp();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStage, setSelectedStage] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Selected project modal / workspace drawer
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'brief' | 'versions' | 'source' | 'qa' | 'notes'>('brief');

  // Modals
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isAddVersionModalOpen, setIsAddVersionModalOpen] = useState(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);

  // New Project Form State
  const [newTitle, setNewTitle] = useState('');
  const [newWorkspaceId, setNewWorkspaceId] = useState(workspaces[0]?.id || 'ws-lyrical-ent');
  const [newProjectType, setNewProjectType] = useState<ProductionProjectType>('Music Release Package');
  const [newPriority, setNewPriority] = useState<ProductionPriority>('High');
  const [newLeadProducer, setNewLeadProducer] = useState('KeedoHub Operator');
  const [newDueDate, setNewDueDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  const [newBriefDesc, setNewBriefDesc] = useState('');
  const [newBriefSpecs, setNewBriefSpecs] = useState('');

  // New Version Form State
  const [newVerNumber, setNewVerNumber] = useState('v1.0');
  const [newVerTitle, setNewVerTitle] = useState('');
  const [newVerFileType, setNewVerFileType] = useState('image/png');
  const [newVerUrl, setNewVerUrl] = useState('');
  const [newVerPublish, setNewVerPublish] = useState(false);

  // New Note Form State
  const [newNoteContent, setNewNoteContent] = useState('');

  // Active selected project
  const activeProject = useMemo(() => {
    return productionProjects.find(p => p.id === activeProjectId) || null;
  }, [productionProjects, activeProjectId]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return productionProjects.filter(p => {
      // Search
      const matchesSearch = searchQuery === '' || 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brief.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Client filter
      const matchesClient = selectedClient === 'All' || p.workspaceId === selectedClient;

      // Type filter
      const matchesType = selectedType === 'All' || p.projectType === selectedType;

      // Stage filter
      const matchesStage = selectedStage === 'All' || p.stage === selectedStage;

      // Priority filter
      const matchesPriority = selectedPriority === 'All' || p.priority === selectedPriority;

      return matchesSearch && matchesClient && matchesType && matchesStage && matchesPriority;
    });
  }, [productionProjects, searchQuery, selectedClient, selectedType, selectedStage, selectedPriority]);

  // Operational metrics
  const activeCount = productionProjects.filter(p => p.stage !== 'Delivered').length;
  const newRequestsCount = productionProjects.filter(p => p.stage === 'New Request').length;
  const inProductionCount = productionProjects.filter(p => p.stage === 'In Production' || p.stage === 'Internal QA').length;
  const clientReviewCount = productionProjects.filter(p => p.stage === 'Client Review').length;
  const revisionCount = productionProjects.filter(p => p.stage === 'Revision Required').length;
  const deliveredCount = productionProjects.filter(p => p.stage === 'Delivered').length;

  // Access check
  if (!canAccessProductionCenter) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-[#0E0E0E] border border-red-900/40 rounded-xl text-center space-y-4">
        <div className="w-12 h-12 bg-red-950/80 border border-red-700/50 rounded-full flex items-center justify-center mx-auto text-red-400">
          <Lock size={22} />
        </div>
        <h2 className="text-xl font-bold font-mono tracking-tight text-white uppercase">
          Access Restricted — Private Operator Center
        </h2>
        <p className="text-sm text-neutral-400 leading-relaxed max-w-lg mx-auto">
          The Production Center is strictly reserved for authorized KeedoHub studio operators, label executives, and lead producers. External client workspaces and guest accounts do not have access to internal production pipelines.
        </p>
        <div className="pt-2">
          <button
            onClick={() => setActiveModule('dashboard')}
            className="px-4 py-2 bg-white text-black font-semibold text-xs rounded hover:bg-neutral-200 transition-colors"
          >
            Return to Client Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const targetWs = workspaces.find(w => w.id === newWorkspaceId);
    const clientName = targetWs?.name || 'Client';
    const clientCategory = (targetWs?.clientCategory || targetWs?.type?.toLowerCase() || 'brand') as ClientCategory;

    addProductionProject({
      title: newTitle,
      workspaceId: newWorkspaceId,
      clientName,
      clientCategory,
      projectType: newProjectType,
      stage: 'New Request',
      priority: newPriority,
      leadProducer: newLeadProducer,
      dueDate: newDueDate,
      brief: {
        description: newBriefDesc || 'Custom creative brief pending detailed scoping.',
        deliverableSpecs: newBriefSpecs || 'Format specifications to be finalized during brief review.'
      },
      sourceMaterials: [],
      versions: [],
      internalNotes: [
        {
          id: `not-${Date.now()}`,
          author: 'Ojo Abdulkareem',
          role: currentRole,
          content: `Project initiated by operator for client ${clientName}.`,
          timestamp: new Date().toISOString(),
          isInternalOnly: true
        }
      ],
      qualityChecks: [
        { id: `qc-${Date.now()}-1`, label: 'Client brief requirements confirmed', passed: false },
        { id: `qc-${Date.now()}-2`, label: 'Export resolution & format verified', passed: false },
        { id: `qc-${Date.now()}-3`, label: 'Color space / audio bitrate standards met', passed: false }
      ]
    });

    setNewTitle('');
    setNewBriefDesc('');
    setNewBriefSpecs('');
    setIsNewProjectModalOpen(false);
  };

  const handleAddVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectId || !newVerTitle.trim()) return;

    addDeliverableVersion(activeProjectId, {
      versionNumber: newVerNumber,
      title: newVerTitle,
      fileUrl: newVerUrl || '/src/assets/images/vinyl_press_mockup_1792791744149.jpg',
      previewUrl: newVerUrl || '/src/assets/images/vinyl_press_mockup_1792791744149.jpg',
      fileType: newVerFileType,
      fileSize: '12.4 MB',
      uploadedBy: currentRole,
      isClientPublished: newVerPublish,
      clientReviewStatus: newVerPublish ? 'Pending' : undefined
    });

    setNewVerTitle('');
    setNewVerUrl('');
    setIsAddVersionModalOpen(false);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectId || !newNoteContent.trim()) return;

    addProductionNote(activeProjectId, {
      author: 'Ojo Abdulkareem',
      role: currentRole,
      content: newNoteContent,
      isInternalOnly: true
    });

    setNewNoteContent('');
    setIsAddNoteModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1C1C1C] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800 font-bold uppercase tracking-wider">
              OPERATOR CONTROL ROOM
            </span>
            <span className="text-xs text-neutral-500 font-mono">CONFIDENTIAL & PRIVATE</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white font-mono uppercase">
            PRODUCTION CENTER & PIPELINE
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            End-to-end creative management: client intake, brief review, production stages, internal QA & delivery gates
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex rounded border border-[#262626] bg-[#121212] p-0.5 text-xs font-mono">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded transition-colors ${viewMode === 'kanban' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'}`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded transition-colors ${viewMode === 'table' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'}`}
            >
              List View
            </button>
          </div>

          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#FF1E1E] hover:bg-[#D91818] text-white rounded transition-colors shadow-md"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>New Production Project</span>
          </button>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-lg bg-[#0E0E0E] border border-[#1E1E1E]">
          <div className="text-[10px] font-mono text-neutral-400 mb-1 flex items-center justify-between">
            <span>ACTIVE PROJECTS</span>
            <Briefcase size={13} className="text-neutral-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">{activeCount}</div>
          <div className="text-[10px] text-neutral-500 mt-1 font-mono">IN FLIGHT</div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#0E0E0E] border border-[#1E1E1E]">
          <div className="text-[10px] font-mono text-blue-400 mb-1 flex items-center justify-between">
            <span>NEW REQUESTS</span>
            <AlertCircle size={13} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-300 tabular-nums">{newRequestsCount}</div>
          <div className="text-[10px] text-neutral-500 mt-1 font-mono">AWAITING BRIEF</div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#0E0E0E] border border-[#1E1E1E]">
          <div className="text-[10px] font-mono text-amber-400 mb-1 flex items-center justify-between">
            <span>IN PRODUCTION</span>
            <Sparkles size={13} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 tabular-nums">{inProductionCount}</div>
          <div className="text-[10px] text-neutral-500 mt-1 font-mono">STUDIO CREATIVE</div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#0E0E0E] border border-[#1E1E1E]">
          <div className="text-[10px] font-mono text-cyan-400 mb-1 flex items-center justify-between">
            <span>CLIENT REVIEWS</span>
            <Eye size={13} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300 tabular-nums">{clientReviewCount}</div>
          <div className="text-[10px] text-neutral-500 mt-1 font-mono">PENDING SIGN-OFF</div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#0E0E0E] border border-[#1E1E1E]">
          <div className="text-[10px] font-mono text-rose-400 mb-1 flex items-center justify-between">
            <span>REVISIONS REQ.</span>
            <AlertCircle size={13} className="text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-300 tabular-nums">{revisionCount}</div>
          <div className="text-[10px] text-neutral-500 mt-1 font-mono">CLIENT FEEDBACK</div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#0E0E0E] border border-[#1E1E1E]">
          <div className="text-[10px] font-mono text-emerald-400 mb-1 flex items-center justify-between">
            <span>DELIVERED</span>
            <CheckCircle2 size={13} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300 tabular-nums">{deliveredCount}</div>
          <div className="text-[10px] text-neutral-500 mt-1 font-mono">COMPLETED VAULT</div>
        </div>
      </div>

      {/* Practical Filters Strip */}
      <div className="p-3.5 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search projects or briefs..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#141414] border border-[#262626] rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400"
            />
          </div>

          {/* Client Filter */}
          <div>
            <select
              value={selectedClient}
              onChange={e => setSelectedClient(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#141414] border border-[#262626] rounded text-xs text-neutral-200 focus:outline-none focus:border-neutral-400"
            >
              <option value="All">All Clients (Workspaces)</option>
              {workspaces.map(ws => (
                <option key={ws.id} value={ws.id}>{ws.name} ({ws.clientCategory || ws.type})</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#141414] border border-[#262626] rounded text-xs text-neutral-200 focus:outline-none focus:border-neutral-400"
            >
              <option value="All">All Project Types</option>
              <option value="Music Release Package">Music Release Package</option>
              <option value="Cover Artwork Design">Cover Artwork Design</option>
              <option value="Motion Teaser & 9:16 Canvas">Motion Teaser & 9:16 Canvas</option>
              <option value="Brand Identity System">Brand Identity System</option>
              <option value="Marketing Campaign Kit">Marketing Campaign Kit</option>
              <option value="Corporate Contract & Stationery">Corporate Contract & Stationery</option>
              <option value="Website & Press Kit">Website & Press Kit</option>
            </select>
          </div>

          {/* Stage Filter */}
          <div>
            <select
              value={selectedStage}
              onChange={e => setSelectedStage(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#141414] border border-[#262626] rounded text-xs text-neutral-200 focus:outline-none focus:border-neutral-400"
            >
              <option value="All">All Stages</option>
              {STAGES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#141414] border border-[#262626] rounded text-xs text-neutral-200 focus:outline-none focus:border-neutral-400"
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Filter results count & clear */}
        {(searchQuery || selectedClient !== 'All' || selectedType !== 'All' || selectedStage !== 'All' || selectedPriority !== 'All') && (
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400 pt-1 border-t border-[#1C1C1C]">
            <span>Showing {filteredProjects.length} of {productionProjects.length} projects</span>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedClient('All');
                setSelectedType('All');
                setSelectedStage('All');
                setSelectedPriority('All');
              }}
              className="text-neutral-400 hover:text-white underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* VIEW: KANBAN PIPELINE */}
      {viewMode === 'kanban' ? (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3.5 min-w-[1700px] items-start">
            {STAGES.map(stage => {
              const stageProjects = filteredProjects.filter(p => p.stage === stage.id);
              return (
                <div 
                  key={stage.id}
                  className="w-[240px] shrink-0 bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg p-3 space-y-3"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#181818]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className="text-xs font-bold font-mono tracking-tight text-white uppercase">
                        {stage.label}
                      </span>
                    </div>
                    <span 
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold"
                      style={{ color: stage.color, backgroundColor: `${stage.color}15`, border: `1px solid ${stage.border}` }}
                    >
                      {stageProjects.length}
                    </span>
                  </div>

                  {/* Project Cards */}
                  <div className="space-y-2.5 min-h-[120px]">
                    {stageProjects.length === 0 ? (
                      <div className="h-20 border border-dashed border-[#1C1C1C] rounded flex items-center justify-center text-[10px] font-mono text-neutral-600">
                        EMPTY STAGE
                      </div>
                    ) : (
                      stageProjects.map(proj => {
                        const passedQc = proj.qualityChecks.filter(q => q.passed).length;
                        const isOverdue = proj.stage !== 'Delivered' && new Date(proj.dueDate).getTime() < Date.now();
                        const publishedVer = proj.versions.find(v => v.isClientPublished);

                        return (
                          <div 
                            key={proj.id}
                            onClick={() => setActiveProjectId(proj.id)}
                            className="p-3 bg-[#111111] border border-[#202020] hover:border-[#333333] rounded-md transition-all cursor-pointer group shadow-sm hover:shadow"
                          >
                            {/* Client & Priority Header */}
                            <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                              <span className="font-semibold text-neutral-300 truncate max-w-[120px]">
                                {proj.clientName}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                                proj.priority === 'Urgent' 
                                  ? 'bg-rose-950/80 text-rose-400 border border-rose-800' 
                                  : proj.priority === 'High' 
                                  ? 'bg-amber-950/80 text-amber-400 border border-amber-800' 
                                  : 'bg-neutral-800 text-neutral-300'
                              }`}>
                                {proj.priority}
                              </span>
                            </div>

                            {/* Title */}
                            <div className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                              {proj.title}
                            </div>

                            {/* Project Type */}
                            <div className="text-[10px] text-neutral-400 font-mono mt-1 truncate">
                              {proj.projectType}
                            </div>

                            {/* Status tags strip */}
                            <div className="mt-2.5 pt-2 border-t border-[#1C1C1C] flex items-center justify-between text-[10px] font-mono">
                              <div className="flex items-center gap-1">
                                {publishedVer ? (
                                  <span className="text-emerald-400 flex items-center gap-0.5" title="Published in client workspace">
                                    <Eye size={10} /> {publishedVer.versionNumber}
                                  </span>
                                ) : (
                                  <span className="text-neutral-500 flex items-center gap-0.5" title="Private to operator">
                                    <EyeOff size={10} /> Private
                                  </span>
                                )}
                              </div>

                              <span className={isOverdue ? 'text-rose-400 font-bold' : 'text-neutral-400'}>
                                {proj.dueDate}
                              </span>
                            </div>

                            {/* QA indicator */}
                            <div className="mt-1 flex items-center justify-between text-[9px] font-mono text-neutral-500">
                              <span>QA: {passedQc}/{proj.qualityChecks.length}</span>
                              <span>{proj.versions.length} ver</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VIEW: TABLE LIST */
        <div className="border border-[#1E1E1E] rounded-lg bg-[#0E0E0E] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1C1C1C] text-neutral-400 font-mono text-[11px] bg-[#0A0A0A]">
                  <th className="py-3 px-4 font-normal">PROJECT</th>
                  <th className="py-3 px-4 font-normal">CLIENT</th>
                  <th className="py-3 px-4 font-normal">TYPE</th>
                  <th className="py-3 px-4 font-normal">STAGE</th>
                  <th className="py-3 px-4 font-normal">PRIORITY</th>
                  <th className="py-3 px-4 font-normal">DUE DATE</th>
                  <th className="py-3 px-4 font-normal">DELIVERABLES</th>
                  <th className="py-3 px-4 font-normal">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161616]">
                {filteredProjects.map(proj => {
                  const stageObj = STAGES.find(s => s.id === proj.stage);
                  const isOverdue = proj.stage !== 'Delivered' && new Date(proj.dueDate).getTime() < Date.now();
                  return (
                    <tr 
                      key={proj.id} 
                      className="hover:bg-[#121212] transition-colors cursor-pointer"
                      onClick={() => setActiveProjectId(proj.id)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{proj.title}</div>
                        <div className="text-[10px] text-neutral-500 font-mono">Lead: {proj.leadProducer}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-300">
                        {proj.clientName}
                      </td>
                      <td className="py-3 px-4 text-neutral-400 font-mono">
                        {proj.projectType}
                      </td>
                      <td className="py-3 px-4">
                        <span 
                          className="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
                          style={{ color: stageObj?.color, backgroundColor: `${stageObj?.color}15`, border: `1px solid ${stageObj?.border}` }}
                        >
                          {proj.stage}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className={`text-[10px] font-bold ${
                          proj.priority === 'Urgent' ? 'text-rose-400' : proj.priority === 'High' ? 'text-amber-400' : 'text-neutral-400'
                        }`}>
                          {proj.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className={isOverdue ? 'text-rose-400 font-bold' : 'text-neutral-400'}>
                          {proj.dueDate}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-400">
                        {proj.versions.length} versions ({proj.versions.filter(v => v.isClientPublished).length} published)
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveProjectId(proj.id);
                          }}
                          className="px-2.5 py-1 text-[11px] font-medium bg-[#1C1C1C] hover:bg-[#252525] text-white border border-[#2B2B2B] rounded"
                        >
                          Workspace
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PROJECT WORKSPACE DETAIL MODAL / DRAWER */}
      {activeProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-5xl max-h-[92vh] bg-[#0E0E0E] border border-[#262626] rounded-xl flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-[#1E1E1E] bg-[#111111] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800 font-semibold uppercase">
                    CLIENT: {activeProject.clientName}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1C1C1C] text-neutral-400 border border-[#2B2B2B]">
                    {activeProject.projectType}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1C1C1C] text-neutral-400 border border-[#2B2B2B]">
                    DUE: {activeProject.dueDate}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight font-mono">
                  {activeProject.title}
                </h2>
              </div>

              {/* Stage Transition Selector & Close */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-[9px] font-mono text-neutral-500 uppercase">PROJECT STAGE</span>
                  <select
                    value={activeProject.stage}
                    onChange={(e) => updateProductionStage(activeProject.id, e.target.value as ProductionStage)}
                    className="px-2.5 py-1.5 bg-[#171717] border border-[#2B2B2B] rounded text-xs font-mono font-semibold text-white focus:outline-none focus:border-white"
                  >
                    {STAGES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setActiveProjectId(null)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-[#1C1C1C] transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Workspace Navigation Tabs */}
            <div className="flex items-center gap-1 px-4 sm:px-6 border-b border-[#1A1A1A] bg-[#0A0A0A] overflow-x-auto text-xs font-mono">
              <button
                onClick={() => setActiveTab('brief')}
                className={`py-3 px-3.5 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'brief' ? 'border-white text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                1. Creative Brief & References
              </button>
              <button
                onClick={() => setActiveTab('versions')}
                className={`py-3 px-3.5 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'versions' ? 'border-white text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                2. Deliverables & Client Gate ({activeProject.versions.length})
              </button>
              <button
                onClick={() => setActiveTab('source')}
                className={`py-3 px-3.5 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'source' ? 'border-white text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                3. Source Materials ({activeProject.sourceMaterials.length})
              </button>
              <button
                onClick={() => setActiveTab('qa')}
                className={`py-3 px-3.5 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'qa' ? 'border-white text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                4. Quality Assurance ({activeProject.qualityChecks.filter(q => q.passed).length}/{activeProject.qualityChecks.length})
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`py-3 px-3.5 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'notes' ? 'border-white text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                5. Private Operator Notes ({activeProject.internalNotes.length})
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* TAB 1: BRIEF */}
              {activeTab === 'brief' && (
                <div className="space-y-5">
                  <div className="p-4 bg-[#121212] border border-[#1E1E1E] rounded-lg">
                    <h3 className="text-xs font-mono uppercase text-neutral-400 mb-1.5">Creative Objective & Description</h3>
                    <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-line">
                      {activeProject.brief.description}
                    </p>
                  </div>

                  <div className="p-4 bg-[#121212] border border-[#1E1E1E] rounded-lg">
                    <h3 className="text-xs font-mono uppercase text-neutral-400 mb-1.5">Deliverable Specifications & Formats</h3>
                    <p className="text-xs font-mono text-neutral-300 leading-relaxed">
                      {activeProject.brief.deliverableSpecs}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-[#121212] border border-[#1E1E1E] rounded-lg">
                      <h3 className="text-xs font-mono uppercase text-neutral-400 mb-1">Target Audience & Distribution Channel</h3>
                      <p className="text-xs text-neutral-300 mt-1">
                        {activeProject.brief.targetAudience || 'General commercial distribution'}
                      </p>
                    </div>

                    <div className="p-4 bg-[#121212] border border-[#1E1E1E] rounded-lg">
                      <h3 className="text-xs font-mono uppercase text-neutral-400 mb-1">Inspiration & Visual Direction</h3>
                      <p className="text-xs text-neutral-300 mt-1">
                        {activeProject.brief.inspirationNotes || 'Architectural typography, pure contrast, premium finish.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#14120A] border border-amber-900/30 rounded text-xs text-amber-200/90 font-mono flex items-center justify-between">
                    <span>Target Workspace ID: <strong className="text-white">{activeProject.workspaceId}</strong></span>
                    <span>Lead Producer: <strong className="text-white">{activeProject.leadProducer}</strong></span>
                  </div>
                </div>
              )}

              {/* TAB 2: VERSIONS & CLIENT REVIEW GATE */}
              {activeTab === 'versions' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white font-mono uppercase">
                        Deliverable Versions & Client Gate
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Publish explicitly selected versions to the client portal for review and approval.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAddVersionModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors"
                    >
                      <Plus size={13} strokeWidth={2.5} />
                      <span>Upload New Version</span>
                    </button>
                  </div>

                  {activeProject.versions.length === 0 ? (
                    <div className="p-8 border border-dashed border-[#222222] rounded-lg text-center space-y-2">
                      <p className="text-xs font-mono text-neutral-500">No deliverable versions uploaded for this project yet.</p>
                      <button
                        onClick={() => setIsAddVersionModalOpen(true)}
                        className="px-3 py-1.5 text-xs font-medium bg-[#1C1C1C] hover:bg-[#252525] text-white rounded border border-[#2B2B2B]"
                      >
                        Register First Version
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeProject.versions.map(ver => (
                        <div 
                          key={ver.id}
                          className="p-4 bg-[#121212] border border-[#1E1E1E] rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3.5">
                            {ver.previewUrl ? (
                              <img 
                                src={ver.previewUrl} 
                                alt={ver.title} 
                                className="w-16 h-16 rounded object-cover border border-[#2B2B2B] shrink-0" 
                              />
                            ) : (
                              <div className="w-16 h-16 rounded bg-[#1C1C1C] flex items-center justify-center font-mono text-xs text-neutral-400 border border-[#2B2B2B] shrink-0">
                                {ver.versionNumber}
                              </div>
                            )}

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-white text-black">
                                  {ver.versionNumber}
                                </span>
                                <span className="text-sm font-semibold text-white">{ver.title}</span>
                              </div>

                              <div className="text-xs text-neutral-400 mt-1 font-mono">
                                Format: {ver.fileType} · Size: {ver.fileSize || 'N/A'} · Uploaded by {ver.uploadedBy}
                              </div>

                              {/* Client Review Status */}
                              <div className="mt-2 flex items-center gap-2">
                                {ver.isClientPublished ? (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                                    <Eye size={11} /> PUBLISHED TO CLIENT PORTAL
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1C1C1C] text-neutral-400 border border-[#2B2B2B] flex items-center gap-1">
                                    <EyeOff size={11} /> INTERNAL ONLY (HIDDEN FROM CLIENT)
                                  </span>
                                )}

                                {ver.clientReviewStatus === 'Approved' && (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-green-950/80 text-green-300 border border-green-800 flex items-center gap-1">
                                    <CheckCircle2 size={11} /> CLIENT APPROVED
                                  </span>
                                )}

                                {ver.clientReviewStatus === 'Revision Requested' && (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 flex items-center gap-1">
                                    <AlertCircle size={11} /> REVISION REQUESTED
                                  </span>
                                )}
                              </div>

                              {ver.clientFeedback && (
                                <div className="mt-2 p-2 bg-[#1C1212] border border-rose-900/40 rounded text-xs text-rose-200 font-mono">
                                  Client Feedback: "{ver.clientFeedback}"
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Publishing Gate Controls */}
                          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                            <button
                              onClick={() => publishDeliverableVersion(activeProject.id, ver.id, !ver.isClientPublished)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                                ver.isClientPublished
                                  ? 'bg-[#1C1C1C] hover:bg-[#282828] text-neutral-300 border border-[#333333]'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              }`}
                            >
                              {ver.isClientPublished ? <EyeOff size={13} /> : <Eye size={13} />}
                              <span>{ver.isClientPublished ? 'Unpublish' : 'Publish to Client'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SOURCE MATERIALS */}
              {activeTab === 'source' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white font-mono uppercase">
                        Source Materials & Master Assets
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Raw project stems, camera contact sheets, and vector files. Strictly private.
                      </p>
                    </div>
                  </div>

                  {activeProject.sourceMaterials.length === 0 ? (
                    <div className="p-8 border border-dashed border-[#222222] rounded-lg text-center space-y-1">
                      <p className="text-xs font-mono text-neutral-500">No source files attached.</p>
                      <p className="text-[11px] text-neutral-600">Assets linked from the Asset Library will appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeProject.sourceMaterials.map(sm => (
                        <div key={sm.id} className="p-3 bg-[#121212] border border-[#1E1E1E] rounded flex items-center justify-between">
                          <div>
                            <div className="text-xs font-semibold text-white">{sm.name}</div>
                            <div className="text-[10px] text-neutral-400 font-mono">Format: {sm.fileType} · Uploaded: {sm.uploadedAt.slice(0, 10)}</div>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1C1C1C] text-neutral-400">
                            INTERNAL ASSET
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: QUALITY CHECKS */}
              {activeTab === 'qa' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white font-mono uppercase">
                        Internal Quality Assurance Checklist
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Verify technical standards before publishing deliverables to clients.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {activeProject.qualityChecks.map(qc => (
                      <div 
                        key={qc.id}
                        onClick={() => toggleQualityCheck(activeProject.id, qc.id)}
                        className={`p-3.5 rounded border transition-colors cursor-pointer flex items-center justify-between ${
                          qc.passed 
                            ? 'bg-green-950/20 border-green-800/60 text-green-300' 
                            : 'bg-[#121212] border-[#202020] text-neutral-300 hover:border-[#333333]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                            qc.passed ? 'bg-green-600 border-green-500 text-white' : 'border-[#444444] bg-[#1A1A1A]'
                          }`}>
                            {qc.passed && <CheckCircle2 size={13} />}
                          </div>
                          <div>
                            <span className="text-xs font-medium">{qc.label}</span>
                            {qc.verifiedBy && (
                              <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                                Verified by {qc.verifiedBy} at {qc.verifiedAt?.slice(0, 16).replace('T', ' ')}
                              </div>
                            )}
                          </div>
                        </div>

                        <span className="text-[10px] font-mono uppercase font-bold">
                          {qc.passed ? 'PASSED' : 'PENDING'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: PRIVATE OPERATOR NOTES */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-red-400">
                        <Lock size={13} />
                        <h3 className="text-sm font-semibold font-mono uppercase">
                          Private Operator Notes & Audit Trail
                        </h3>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Internal technician commentary and production history. Strictly hidden from client portals.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsAddNoteModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded"
                    >
                      <Plus size={13} />
                      <span>Add Operator Note</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {activeProject.internalNotes.map(n => (
                      <div key={n.id} className="p-3.5 bg-[#121212] border border-[#1E1E1E] rounded-md space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                          <span className="text-white font-semibold">{n.author} ({n.role})</span>
                          <span>{new Date(n.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-neutral-300 leading-relaxed">
                          {n.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#1E1E1E] bg-[#0A0A0A] flex items-center justify-between">
              <button
                onClick={() => {
                  if (confirm(`Archive and remove project "${activeProject.title}"?`)) {
                    deleteProductionProject(activeProject.id);
                    setActiveProjectId(null);
                  }
                }}
                className="text-xs text-neutral-500 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <Trash2 size={13} />
                <span>Delete Project</span>
              </button>

              <button
                onClick={() => setActiveProjectId(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white rounded transition-colors"
              >
                Close Project Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NEW PRODUCTION PROJECT */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0E0E0E] border border-[#2B2B2B] rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E1E1E] pb-3">
              <h2 className="text-sm font-bold font-mono tracking-tight text-white uppercase">
                Initiate Production Project
              </h2>
              <button onClick={() => setIsNewProjectModalOpen(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">PROJECT TITLE</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Velvet Reverie — 9:16 Canvas & Promo Pack"
                  className="w-full px-3 py-2 bg-[#141414] border border-[#2B2B2B] rounded text-white focus:outline-none focus:border-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">CLIENT WORKSPACE</label>
                  <select
                    value={newWorkspaceId}
                    onChange={e => setNewWorkspaceId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#141414] border border-[#2B2B2B] rounded text-white focus:outline-none focus:border-white"
                  >
                    {workspaces.map(ws => (
                      <option key={ws.id} value={ws.id}>{ws.name} ({ws.clientCategory || ws.type})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">PROJECT TYPE</label>
                  <select
                    value={newProjectType}
                    onChange={e => setNewProjectType(e.target.value as ProductionProjectType)}
                    className="w-full px-3 py-2 bg-[#141414] border border-[#2B2B2B] rounded text-white focus:outline-none focus:border-white"
                  >
                    <option value="Music Release Package">Music Release Package</option>
                    <option value="Cover Artwork Design">Cover Artwork Design</option>
                    <option value="Motion Teaser & 9:16 Canvas">Motion Teaser & 9:16 Canvas</option>
                    <option value="Brand Identity System">Brand Identity System</option>
                    <option value="Marketing Campaign Kit">Marketing Campaign Kit</option>
                    <option value="Corporate Contract & Stationery">Corporate Contract & Stationery</option>
                    <option value="Website & Press Kit">Website & Press Kit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">PRIORITY</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as ProductionPriority)}
                    className="w-full px-3 py-2 bg-[#141414] border border-[#2B2B2B] rounded text-white focus:outline-none focus:border-white"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">TARGET DEADLINE</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#141414] border border-[#2B2B2B] rounded text-white focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">CREATIVE BRIEF & GOALS</label>
                <textarea
                  rows={3}
                  value={newBriefDesc}
                  onChange={e => setNewBriefDesc(e.target.value)}
                  placeholder="Summarize the core creative scope and requirements..."
                  className="w-full px-3 py-2 bg-[#141414] border border-[#2B2B2B] rounded text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">DELIVERABLE SPECIFICATIONS</label>
                <input
                  type="text"
                  value={newBriefSpecs}
                  onChange={e => setNewBriefSpecs(e.target.value)}
                  placeholder="e.g. 3000x3000px TIFF 300DPI + 24-bit 48kHz Master WAV"
                  className="w-full px-3 py-2 bg-[#141414] border border-[#2B2B2B] rounded text-white focus:outline-none focus:border-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1E1E1E]">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-[#FF1E1E] hover:bg-[#D91818] text-white rounded transition-colors"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER NEW DELIVERABLE VERSION */}
      {isAddVersionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0E0E0E] border border-[#2B2B2B] rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E1E1E] pb-3">
              <h2 className="text-sm font-bold font-mono tracking-tight text-white uppercase">
                Register Deliverable Version
              </h2>
              <button onClick={() => setIsAddVersionModalOpen(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddVersion} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">VERSION</label>
                  <input
                    type="text"
                    required
                    value={newVerNumber}
                    onChange={e => setNewVerNumber(e.target.value)}
                    placeholder="v1.1"
                    className="w-full px-3 py-2 bg-[#141414] border border-[#2B2B2B] rounded text-white font-mono focus:outline-none focus:border-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">VERSION TITLE</label>
                  <input
                    type="text"
                    required
                    value={newVerTitle}
                    onChange={e => setNewVerTitle(e.target.value)}
                    placeholder="e.g. Master Cover Proof - Warm Color Grade"
                    className="w-full px-3 py-2 bg-[#141414] border border-[#2B2B2B] rounded text-white focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">FILE TYPE / MIME</label>
                <select
                  value={newVerFileType}
                  onChange={e => setNewVerFileType(e.target.value)}
                  className="w-full px-3 py-2 bg-[#141414] border border-[#2B2B2B] rounded text-white focus:outline-none focus:border-white"
                >
                  <option value="image/png">image/png (Lossless 3000x3000px)</option>
                  <option value="image/jpeg">image/jpeg (Master RGB)</option>
                  <option value="video/mp4">video/mp4 (9:16 Canvas Loop)</option>
                  <option value="audio/wav">audio/wav (24-bit 48kHz)</option>
                  <option value="application/pdf">application/pdf (Brand Manual / Document)</option>
                  <option value="image/svg+xml">image/svg+xml (Vector System)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">FILE / PREVIEW ASSET URL</label>
                <input
                  type="text"
                  value={newVerUrl}
                  onChange={e => setNewVerUrl(e.target.value)}
                  placeholder="/src/assets/images/... or Cloud Storage URL"
                  className="w-full px-3 py-2 bg-[#141414] border border-[#2B2B2B] rounded text-white font-mono focus:outline-none focus:border-white"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newVerPublish}
                    onChange={e => setNewVerPublish(e.target.checked)}
                    className="rounded bg-[#141414] border-[#2B2B2B] text-emerald-500 focus:ring-0"
                  />
                  <span className="text-xs font-mono text-neutral-200">
                    Publish immediately to client workspace review gate
                  </span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1E1E1E]">
                <button
                  type="button"
                  onClick={() => setIsAddVersionModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded"
                >
                  Add Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD OPERATOR NOTE */}
      {isAddNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0E0E0E] border border-[#2B2B2B] rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E1E1E] pb-3">
              <h2 className="text-sm font-bold font-mono tracking-tight text-white uppercase">
                Add Private Operator Note
              </h2>
              <button onClick={() => setIsAddNoteModalOpen(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddNote} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">INTERNAL COMMENTARY</label>
                <textarea
                  rows={4}
                  required
                  value={newNoteContent}
                  onChange={e => setNewNoteContent(e.target.value)}
                  placeholder="Record internal technical feedback, color correction notes, or client communication log..."
                  className="w-full px-3 py-2 bg-[#141414] border border-[#2B2B2B] rounded text-white focus:outline-none focus:border-white"
                />
              </div>

              <div className="p-2.5 bg-[#141414] rounded border border-[#222222] text-[10px] font-mono text-neutral-400 flex items-center gap-1.5">
                <Lock size={12} className="text-red-400 shrink-0" />
                <span>Note will be recorded with author <strong>{currentRole}</strong> and hidden from client.</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1E1E1E]">
                <button
                  type="button"
                  onClick={() => setIsAddNoteModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

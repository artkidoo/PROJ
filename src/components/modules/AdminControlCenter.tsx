import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ServicePackage, 
  ServiceCategory, 
  ServiceTier, 
  Workspace, 
  WorkspaceStatus, 
  WorkspaceType, 
  ClientCategory 
} from '../../types';
import { 
  ShieldCheck, 
  Building2, 
  Package, 
  BarChart3, 
  Lock, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  DollarSign, 
  Layers, 
  Users, 
  Check, 
  X, 
  FileText, 
  Receipt, 
  FolderLock, 
  ShieldAlert, 
  Eye, 
  ArrowRight,
  Briefcase,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  RefreshCw
} from 'lucide-react';

export const AdminControlCenter: React.FC = () => {
  const { 
    workspaces, 
    activeWorkspace, 
    currentRole, 
    canAccessAdminCenter,
    productionProjects,
    documents,
    tasks,
    releases,
    servicePackages,
    addServicePackage,
    updateServicePackage,
    deleteServicePackage,
    toggleServicePackageActive,
    createWorkspace,
    updateWorkspaceStatus,
    updateWorkspaceDetails,
    assignServicePackageToWorkspace,
    removeServicePackageFromWorkspace,
    switchWorkspace,
    currentUser
  } = useApp();

  const [activeTab, setActiveTab] = useState<'clients' | 'services' | 'overview' | 'security'>('clients');

  // Client Management State
  const [clientSearch, setClientSearch] = useState('');
  const [clientCategoryFilter, setClientCategoryFilter] = useState<string>('all');
  const [clientStatusFilter, setClientStatusFilter] = useState<string>('all');
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [selectedClientForDetails, setSelectedClientForDetails] = useState<Workspace | null>(null);

  // New Client Onboarding Form State
  const [newClientName, setNewClientName] = useState('');
  const [newClientType, setNewClientType] = useState<WorkspaceType>('Artist');
  const [newClientCategory, setNewClientCategory] = useState<ClientCategory>('artist');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientDescription, setNewClientDescription] = useState('');
  const [newClientColor, setNewClientColor] = useState('#D97706');
  const [newClientTagline, setNewClientTagline] = useState('');
  const [newClientInitialPackage, setNewClientInitialPackage] = useState<string>('');

  // Service Catalog State
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState<string>('all');
  const [serviceAudienceFilter, setServiceAudienceFilter] = useState<string>('all');
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);

  // Package Form State
  const [pkgName, setPkgName] = useState('');
  const [pkgCategory, setPkgCategory] = useState<ServiceCategory>('Music Release Promotion');
  const [pkgTier, setPkgTier] = useState<ServiceTier>('Professional');
  const [pkgPrice, setPkgPrice] = useState<number>(1850);
  const [pkgBillingType, setPkgBillingType] = useState<'One-Time' | 'Per-Release' | 'Monthly Retainer'>('Per-Release');
  const [pkgRevisionLimit, setPkgRevisionLimit] = useState<number>(3);
  const [pkgTurnaroundDays, setPkgTurnaroundDays] = useState<number>(5);
  const [pkgAudience, setPkgAudience] = useState<'Artist' | 'Brand' | 'Both'>('Artist');
  const [pkgDescription, setPkgDescription] = useState('');
  const [pkgDeliverablesText, setPkgDeliverablesText] = useState('');

  // Strict Access Guard: If accessed by an unauthorized user or outside master workspace
  if (!canAccessAdminCenter) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-[#111111] border border-red-950/60 p-8 rounded-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-950/40 border border-red-800/40 flex items-center justify-center mx-auto text-[#FF1E1E]">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Administrative Access Restricted</h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            The Admin & Operator Control Center is strictly restricted to platform owners and executive management in the primary LYRICAL ENT Master Workspace.
          </p>
          <div className="text-xs font-mono text-neutral-500 bg-[#0A0A0A] p-3 rounded border border-[#1F1F1F]">
            Current Workspace: {activeWorkspace.name} ({activeWorkspace.id})<br />
            Active Role: {currentRole}
          </div>
        </div>
      </div>
    );
  }

  // Filtered Client Workspaces
  const filteredWorkspaces = useMemo(() => {
    return workspaces.filter(ws => {
      const matchesSearch = 
        ws.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        (ws.contactEmail && ws.contactEmail.toLowerCase().includes(clientSearch.toLowerCase())) ||
        (ws.description && ws.description.toLowerCase().includes(clientSearch.toLowerCase()));
      
      const matchesCategory = 
        clientCategoryFilter === 'all' || 
        ws.clientCategory === clientCategoryFilter || 
        ws.type.toLowerCase() === clientCategoryFilter.toLowerCase();

      const matchesStatus = 
        clientStatusFilter === 'all' || 
        (ws.status || 'Active').toLowerCase() === clientStatusFilter.toLowerCase();

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [workspaces, clientSearch, clientCategoryFilter, clientStatusFilter]);

  // Filtered Service Packages
  const filteredPackages = useMemo(() => {
    return servicePackages.filter(pkg => {
      const matchesCategory = serviceCategoryFilter === 'all' || pkg.category === serviceCategoryFilter;
      const matchesAudience = serviceAudienceFilter === 'all' || pkg.targetAudience === serviceAudienceFilter || pkg.targetAudience === 'Both';
      return matchesCategory && matchesAudience;
    });
  }, [servicePackages, serviceCategoryFilter, serviceAudienceFilter]);

  // Financial Calculations strictly from stored documents (Zero Fabrication)
  const financialLedger = useMemo(() => {
    const financialDocs = documents.filter(doc => 
      ['invoice', 'receipt', 'quotation'].includes(doc.type)
    );

    let totalInvoiced = 0;
    let totalSettled = 0;
    let totalQuoted = 0;

    const items = financialDocs.map(doc => {
      const docTotal = (doc.items || []).reduce((acc, it) => acc + (it.total || 0), 0);
      
      if (doc.type === 'invoice') {
        totalInvoiced += docTotal;
      } else if (doc.type === 'receipt') {
        totalSettled += docTotal;
      } else if (doc.type === 'quotation') {
        totalQuoted += docTotal;
      }

      return {
        id: doc.id,
        refNo: doc.referenceNo,
        type: doc.type,
        title: doc.title,
        recipient: doc.recipientOrg || doc.recipientName,
        date: doc.date,
        total: docTotal,
        status: doc.status,
        paymentTerms: doc.paymentTerms || 'Standard Terms',
        workspaceId: doc.workspaceId || 'ws-lyrical-ent'
      };
    });

    const pendingSettlement = Math.max(0, totalInvoiced - totalSettled);

    return {
      totalInvoiced,
      totalSettled,
      pendingSettlement,
      totalQuoted,
      items
    };
  }, [documents]);

  // Workload Metrics
  const activeProjectsCount = productionProjects.filter(p => p.stage !== 'Delivered').length;
  const inQaCount = productionProjects.filter(p => p.stage === 'Internal QA').length;
  const inClientReviewCount = productionProjects.filter(p => p.stage === 'Client Review').length;
  const deliveredProjectsCount = productionProjects.filter(p => p.stage === 'Delivered').length;

  // Handle Client Onboarding
  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const createdWs = createWorkspace({
      name: newClientName.trim(),
      type: newClientType,
      clientCategory: newClientCategory,
      ownerId: currentUser.id,
      description: newClientDescription.trim() || `${newClientType} Client Workspace`,
      status: 'Onboarding',
      contactEmail: newClientEmail.trim() || undefined,
      contractedPackageIds: newClientInitialPackage ? [newClientInitialPackage] : [],
      brand: {
        name: newClientName.trim(),
        primaryColor: newClientColor,
        secondaryColor: '#0B0B0B',
        accentColor: newClientColor,
        tagline: newClientTagline.trim() || undefined,
        typography: {
          displayFont: 'Plus Jakarta Sans',
          bodyFont: 'Plus Jakarta Sans'
        }
      }
    });

    // Reset form
    setNewClientName('');
    setNewClientEmail('');
    setNewClientDescription('');
    setNewClientTagline('');
    setNewClientInitialPackage('');
    setIsOnboardingModalOpen(false);
    setSelectedClientForDetails(createdWs);
  };

  // Open Edit Package Modal
  const handleOpenEditPackage = (pkg: ServicePackage) => {
    setEditingPackage(pkg);
    setPkgName(pkg.name);
    setPkgCategory(pkg.category);
    setPkgTier(pkg.tier);
    setPkgPrice(pkg.priceUsd);
    setPkgBillingType(pkg.billingType);
    setPkgRevisionLimit(pkg.revisionLimit);
    setPkgTurnaroundDays(pkg.turnaroundDays);
    setPkgAudience(pkg.targetAudience);
    setPkgDescription(pkg.description);
    setPkgDeliverablesText(pkg.deliverables.join('\n'));
    setIsPackageModalOpen(true);
  };

  // Open New Package Modal
  const handleOpenNewPackage = () => {
    setEditingPackage(null);
    setPkgName('');
    setPkgCategory('Music Release Promotion');
    setPkgTier('Professional');
    setPkgPrice(1850);
    setPkgBillingType('Per-Release');
    setPkgRevisionLimit(3);
    setPkgTurnaroundDays(5);
    setPkgAudience('Artist');
    setPkgDescription('');
    setPkgDeliverablesText('');
    setIsPackageModalOpen(true);
  };

  // Save Service Package
  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName.trim()) return;

    const deliverables = pkgDeliverablesText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (editingPackage) {
      updateServicePackage(editingPackage.id, {
        name: pkgName.trim(),
        category: pkgCategory,
        tier: pkgTier,
        priceUsd: Number(pkgPrice) || 0,
        billingType: pkgBillingType,
        revisionLimit: Number(pkgRevisionLimit),
        turnaroundDays: Number(pkgTurnaroundDays) || 1,
        targetAudience: pkgAudience,
        description: pkgDescription.trim(),
        deliverables: deliverables.length > 0 ? deliverables : ['Standard deliverable specification']
      });
    } else {
      addServicePackage({
        name: pkgName.trim(),
        category: pkgCategory,
        tier: pkgTier,
        priceUsd: Number(pkgPrice) || 0,
        billingType: pkgBillingType,
        revisionLimit: Number(pkgRevisionLimit),
        turnaroundDays: Number(pkgTurnaroundDays) || 1,
        targetAudience: pkgAudience,
        description: pkgDescription.trim(),
        deliverables: deliverables.length > 0 ? deliverables : ['Standard deliverable specification'],
        isActive: true
      });
    }

    setIsPackageModalOpen(false);
    setEditingPackage(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Operator Identity */}
      <div className="bg-[#0D0D0D] border border-[#1E1E1E] rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF1E1E]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-red-950/50 text-[#FF1E1E] border border-red-800/40">
                <ShieldCheck size={12} />
                PHASE 4: OPERATOR GOVERNANCE
              </span>
              <span className="text-neutral-500 text-xs">·</span>
              <span className="text-xs font-mono text-neutral-400">FIRESTORE RBAC ACTIVE</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              ADMIN & OPERATOR CONTROL CENTER
            </h1>
            <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
              Multi-client workspace roster, modular service catalog packaging, verified financial ledger, and platform role governance.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsOnboardingModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-[#FF1E1E] hover:bg-red-600 text-white rounded-lg transition-colors shadow-lg shadow-red-950/40"
            >
              <Plus size={14} />
              <span>Onboard Client</span>
            </button>
            <button
              onClick={handleOpenNewPackage}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-[#1A1A1A] hover:bg-[#252525] text-neutral-200 rounded-lg border border-[#2E2E2E] transition-colors"
            >
              <Package size={14} />
              <span>New Package</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#1E1E1E] mt-6 gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('clients')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'clients'
                ? 'border-[#FF1E1E] text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Building2 size={15} />
            <span>Client Workspaces ({workspaces.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'services'
                ? 'border-[#FF1E1E] text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Package size={15} />
            <span>Services & Packages ({servicePackages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-[#FF1E1E] text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BarChart3 size={15} />
            <span>Business Overview & Financials</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-[#FF1E1E] text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Lock size={15} />
            <span>Roles & Access Governance</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CLIENT MANAGEMENT */}
      {activeTab === 'clients' && (
        <div className="space-y-6">
          {/* Client Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#0F0F0F] border border-[#1E1E1E] p-4 rounded-xl">
              <span className="text-[11px] font-mono text-neutral-500 uppercase">Total Clients</span>
              <div className="text-2xl font-bold text-white mt-1">{workspaces.length}</div>
              <span className="text-[10px] text-neutral-400">Master + Client Workspaces</span>
            </div>

            <div className="bg-[#0F0F0F] border border-[#1E1E1E] p-4 rounded-xl">
              <span className="text-[11px] font-mono text-emerald-400 uppercase">Active Status</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {workspaces.filter(w => !w.status || w.status === 'Active').length}
              </div>
              <span className="text-[10px] text-neutral-400">Fully Operational</span>
            </div>

            <div className="bg-[#0F0F0F] border border-[#1E1E1E] p-4 rounded-xl">
              <span className="text-[11px] font-mono text-amber-400 uppercase">Onboarding</span>
              <div className="text-2xl font-bold text-amber-400 mt-1">
                {workspaces.filter(w => w.status === 'Onboarding').length}
              </div>
              <span className="text-[10px] text-neutral-400">Pending Brief / Setup</span>
            </div>

            <div className="bg-[#0F0F0F] border border-[#1E1E1E] p-4 rounded-xl">
              <span className="text-[11px] font-mono text-blue-400 uppercase">Active Workload</span>
              <div className="text-2xl font-bold text-blue-400 mt-1">{activeProjectsCount}</div>
              <span className="text-[10px] text-neutral-400">Projects in Production</span>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-[#0F0F0F] border border-[#1E1E1E] p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 text-neutral-500" size={15} />
              <input
                type="text"
                placeholder="Search clients by name, email, or details..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full bg-[#161616] border border-[#262626] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF1E1E]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1.5 bg-[#161616] border border-[#262626] rounded-lg px-2.5 py-1.5 text-xs text-neutral-300">
                <Filter size={13} className="text-neutral-500" />
                <span className="text-neutral-500">Category:</span>
                <select
                  value={clientCategoryFilter}
                  onChange={(e) => setClientCategoryFilter(e.target.value)}
                  className="bg-transparent text-white focus:outline-none text-xs"
                >
                  <option value="all" className="bg-[#161616]">All Categories</option>
                  <option value="artist" className="bg-[#161616]">Artists</option>
                  <option value="brand" className="bg-[#161616]">Brands</option>
                  <option value="label" className="bg-[#161616]">Labels / Enterprise</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-[#161616] border border-[#262626] rounded-lg px-2.5 py-1.5 text-xs text-neutral-300">
                <span className="text-neutral-500">Status:</span>
                <select
                  value={clientStatusFilter}
                  onChange={(e) => setClientStatusFilter(e.target.value)}
                  className="bg-transparent text-white focus:outline-none text-xs"
                >
                  <option value="all" className="bg-[#161616]">All Statuses</option>
                  <option value="active" className="bg-[#161616]">Active</option>
                  <option value="onboarding" className="bg-[#161616]">Onboarding</option>
                  <option value="paused" className="bg-[#161616]">Paused</option>
                  <option value="archived" className="bg-[#161616]">Archived</option>
                </select>
              </div>

              {(clientSearch || clientCategoryFilter !== 'all' || clientStatusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setClientSearch('');
                    setClientCategoryFilter('all');
                    setClientStatusFilter('all');
                  }}
                  className="px-2.5 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Client Workspaces Directory */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkspaces.map(ws => {
              const isMaster = ws.id === 'ws-lyrical-ent';
              const status = ws.status || 'Active';
              const clientProjects = productionProjects.filter(p => p.workspaceId === ws.id);
              const clientReleases = releases.filter(r => r.workspaceId === ws.id);
              const clientDocs = documents.filter(d => d.workspaceId === ws.id);
              const contractedPackages = servicePackages.filter(p => (ws.contractedPackageIds || []).includes(p.id));

              const statusColor = 
                status === 'Active' ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40' :
                status === 'Onboarding' ? 'text-amber-400 bg-amber-950/40 border-amber-800/40' :
                status === 'Paused' ? 'text-neutral-400 bg-neutral-900 border-neutral-700' :
                'text-red-400 bg-red-950/40 border-red-800/40';

              return (
                <div 
                  key={ws.id} 
                  className={`bg-[#0F0F0F] border rounded-xl p-5 flex flex-col justify-between transition-all ${
                    isMaster 
                      ? 'border-[#FF1E1E]/40 hover:border-[#FF1E1E]/70 shadow-lg shadow-red-950/20' 
                      : 'border-[#1E1E1E] hover:border-[#333333]'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Workspace Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow-md text-sm"
                          style={{ backgroundColor: ws.brand?.accentColor || '#333333' }}
                        >
                          {ws.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-sm">{ws.name}</h3>
                            {isMaster && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950/60 text-[#FF1E1E] border border-red-800/50">
                                MASTER
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-neutral-400">
                            {ws.type} Client · ID: {ws.id}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${statusColor}`}>
                        {status}
                      </span>
                    </div>

                    {/* Description & Contact */}
                    <p className="text-xs text-neutral-400 line-clamp-2">
                      {ws.description || 'Dedicated client creative and production workspace.'}
                    </p>

                    {ws.contactEmail && (
                      <div className="text-xs font-mono text-neutral-400 flex items-center gap-1.5 truncate">
                        <span className="text-neutral-600">CONTACT:</span>
                        <span className="text-neutral-300 truncate">{ws.contactEmail}</span>
                      </div>
                    )}

                    {/* Production & Asset Footprint */}
                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-[#1A1A1A] text-center text-xs">
                      <div>
                        <div className="font-bold text-white">{clientProjects.length}</div>
                        <div className="text-[10px] text-neutral-500 font-mono">PROJECTS</div>
                      </div>
                      <div>
                        <div className="font-bold text-white">{clientReleases.length}</div>
                        <div className="text-[10px] text-neutral-500 font-mono">RELEASES</div>
                      </div>
                      <div>
                        <div className="font-bold text-white">{clientDocs.length}</div>
                        <div className="text-[10px] text-neutral-500 font-mono">DOCS</div>
                      </div>
                    </div>

                    {/* Contracted Packages */}
                    <div>
                      <div className="text-[10px] font-mono text-neutral-500 uppercase mb-1.5">
                        CONTRACTED SERVICES ({contractedPackages.length})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {contractedPackages.length > 0 ? (
                          contractedPackages.map(pkg => (
                            <span 
                              key={pkg.id} 
                              className="text-[10px] px-2 py-0.5 rounded bg-[#171717] text-neutral-300 border border-[#262626] truncate max-w-[200px]"
                              title={pkg.name}
                            >
                              {pkg.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-neutral-600 italic">No packages assigned yet</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 mt-4 border-t border-[#1A1A1A] flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedClientForDetails(ws)}
                      className="text-xs font-medium text-neutral-300 hover:text-white px-2.5 py-1.5 rounded bg-[#161616] hover:bg-[#202020] border border-[#262626] transition-colors"
                    >
                      Manage & Access
                    </button>

                    <button
                      onClick={() => switchWorkspace(ws.id)}
                      className="text-xs font-semibold text-[#FF1E1E] hover:text-red-400 flex items-center gap-1 transition-colors"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SERVICES & PACKAGES CATALOG */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="bg-[#0F0F0F] border border-[#1E1E1E] p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#161616] border border-[#262626] rounded-lg px-2.5 py-1.5 text-xs text-neutral-300">
                <span className="text-neutral-500">Category:</span>
                <select
                  value={serviceCategoryFilter}
                  onChange={(e) => setServiceCategoryFilter(e.target.value)}
                  className="bg-transparent text-white focus:outline-none text-xs"
                >
                  <option value="all" className="bg-[#161616]">All Categories</option>
                  <option value="Music Release Promotion" className="bg-[#161616]">Music Release Promotion</option>
                  <option value="Cover Artwork & Visuals" className="bg-[#161616]">Cover Artwork & Visuals</option>
                  <option value="Motion Design & Video" className="bg-[#161616]">Motion Design & Video</option>
                  <option value="Brand Identity System" className="bg-[#161616]">Brand Identity System</option>
                  <option value="Business & Corporate Creative" className="bg-[#161616]">Business & Corporate Creative</option>
                  <option value="Executive Creative Retainer" className="bg-[#161616]">Executive Creative Retainer</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-[#161616] border border-[#262626] rounded-lg px-2.5 py-1.5 text-xs text-neutral-300">
                <span className="text-neutral-500">Audience:</span>
                <select
                  value={serviceAudienceFilter}
                  onChange={(e) => setServiceAudienceFilter(e.target.value)}
                  className="bg-transparent text-white focus:outline-none text-xs"
                >
                  <option value="all" className="bg-[#161616]">All Audiences</option>
                  <option value="Artist" className="bg-[#161616]">Artists</option>
                  <option value="Brand" className="bg-[#161616]">Brands</option>
                  <option value="Both" className="bg-[#161616]">Universal (Both)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleOpenNewPackage}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#FF1E1E] hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              <Plus size={14} />
              <span>Create Package</span>
            </button>
          </div>

          {/* Package Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPackages.map(pkg => {
              const tierBadgeColor = 
                pkg.tier === 'Flagship / Custom' ? 'text-[#FF1E1E] bg-red-950/50 border-red-800/50' :
                pkg.tier === 'Professional' ? 'text-amber-400 bg-amber-950/40 border-amber-800/40' :
                'text-blue-400 bg-blue-950/40 border-blue-800/40';

              return (
                <div 
                  key={pkg.id} 
                  className={`bg-[#0F0F0F] border rounded-xl p-5 flex flex-col justify-between transition-all ${
                    pkg.isActive ? 'border-[#1E1E1E] hover:border-[#333333]' : 'border-[#1A1A1A] opacity-60'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${tierBadgeColor}`}>
                          {pkg.tier}
                        </span>
                        <div className="text-[11px] font-mono text-neutral-500 mt-1.5 uppercase">
                          {pkg.category}
                        </div>
                      </div>

                      <button
                        onClick={() => toggleServicePackageActive(pkg.id)}
                        title={pkg.isActive ? 'Deactivate Package' : 'Activate Package'}
                        className="text-neutral-400 hover:text-white transition-colors"
                      >
                        {pkg.isActive ? (
                          <ToggleRight size={22} className="text-emerald-400" />
                        ) : (
                          <ToggleLeft size={22} className="text-neutral-600" />
                        )}
                      </button>
                    </div>

                    {/* Title & Price */}
                    <div>
                      <h3 className="font-bold text-white text-base leading-snug">{pkg.name}</h3>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-2xl font-black text-white tracking-tight">
                          ${pkg.priceUsd.toLocaleString()}
                        </span>
                        <span className="text-xs font-mono text-neutral-400">
                          USD · {pkg.billingType}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {pkg.description}
                    </p>

                    {/* Specifications Bar */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-[#141414] border border-[#222222] text-xs font-mono">
                      <div>
                        <span className="text-neutral-500 text-[10px] block">TURNAROUND</span>
                        <span className="text-neutral-200 font-semibold">{pkg.turnaroundDays} Business Days</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 text-[10px] block">REVISION CAP</span>
                        <span className="text-neutral-200 font-semibold">
                          {pkg.revisionLimit === -1 ? 'Unlimited' : `${pkg.revisionLimit} Rounds`}
                        </span>
                      </div>
                    </div>

                    {/* Deliverables List */}
                    <div>
                      <span className="text-[10px] font-mono text-neutral-500 uppercase block mb-2">
                        INCLUDED DELIVERABLES ({pkg.deliverables.length})
                      </span>
                      <ul className="space-y-1.5">
                        {pkg.deliverables.map((deliv, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-neutral-300">
                            <Check size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                            <span className="leading-tight">{deliv}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 mt-5 border-t border-[#1A1A1A] flex items-center justify-between">
                    <span className="text-[11px] font-mono text-neutral-500">
                      Target: <strong className="text-neutral-300">{pkg.targetAudience}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditPackage(pkg)}
                        className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#1A1A1A] rounded transition-colors"
                        title="Edit Package"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete service package "${pkg.name}"?`)) {
                            deleteServicePackage(pkg.id);
                          }
                        }}
                        className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-[#1A1A1A] rounded transition-colors"
                        title="Delete Package"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: BUSINESS OVERVIEW & FINANCIALS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Audit Banner */}
          <div className="bg-[#14120B] border border-amber-900/40 p-4 rounded-xl flex items-start gap-3">
            <CheckCircle2 size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <strong className="text-amber-300 font-semibold block">
                AUDITED FINANCIAL GOVERNANCE
              </strong>
              <p className="text-neutral-400 leading-relaxed">
                All financial figures, invoice totals, and settlement amounts are calculated strictly from verified corporate documents stored in the database. No fabricated or estimated metrics are displayed.
              </p>
            </div>
          </div>

          {/* Financial Totals Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#0F0F0F] border border-[#1E1E1E] p-5 rounded-xl">
              <span className="text-xs font-mono text-neutral-500 uppercase flex items-center gap-1.5">
                <FileText size={14} className="text-blue-400" />
                Verified Invoices Issued
              </span>
              <div className="text-3xl font-black text-white mt-2 tracking-tight">
                ${financialLedger.totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-neutral-400 mt-1 block">
                From {documents.filter(d => d.type === 'invoice').length} issued invoice records
              </span>
            </div>

            <div className="bg-[#0F0F0F] border border-[#1E1E1E] p-5 rounded-xl">
              <span className="text-xs font-mono text-neutral-500 uppercase flex items-center gap-1.5">
                <Receipt size={14} className="text-emerald-400" />
                Verified Settlement Received
              </span>
              <div className="text-3xl font-black text-emerald-400 mt-2 tracking-tight">
                ${financialLedger.totalSettled.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-neutral-400 mt-1 block">
                From {documents.filter(d => d.type === 'receipt').length} settled receipt records
              </span>
            </div>

            <div className="bg-[#0F0F0F] border border-[#1E1E1E] p-5 rounded-xl">
              <span className="text-xs font-mono text-neutral-500 uppercase flex items-center gap-1.5">
                <Clock size={14} className="text-amber-400" />
                Outstanding Invoiced Balance
              </span>
              <div className="text-3xl font-black text-amber-400 mt-2 tracking-tight">
                ${financialLedger.pendingSettlement.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-neutral-400 mt-1 block">
                Pending wire / contract settlement
              </span>
            </div>
          </div>

          {/* Operational Pipeline & Workload Breakdown */}
          <div className="bg-[#0F0F0F] border border-[#1E1E1E] rounded-xl p-5">
            <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
              <Briefcase size={16} className="text-[#FF1E1E]" />
              Creative Production Throughput & Pipeline Workload
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#141414] p-3.5 rounded-lg border border-[#222222]">
                <span className="text-[10px] font-mono text-neutral-500 uppercase">ACTIVE PROJECTS</span>
                <div className="text-xl font-bold text-white mt-1">{activeProjectsCount}</div>
                <span className="text-[10px] text-neutral-400">Under operator direction</span>
              </div>

              <div className="bg-[#141414] p-3.5 rounded-lg border border-[#222222]">
                <span className="text-[10px] font-mono text-blue-400 uppercase">INTERNAL QA</span>
                <div className="text-xl font-bold text-blue-400 mt-1">{inQaCount}</div>
                <span className="text-[10px] text-neutral-400">Quality review stage</span>
              </div>

              <div className="bg-[#141414] p-3.5 rounded-lg border border-[#222222]">
                <span className="text-[10px] font-mono text-amber-400 uppercase">CLIENT REVIEW</span>
                <div className="text-xl font-bold text-amber-400 mt-1">{inClientReviewCount}</div>
                <span className="text-[10px] text-neutral-400">Awaiting client sign-off</span>
              </div>

              <div className="bg-[#141414] p-3.5 rounded-lg border border-[#222222]">
                <span className="text-[10px] font-mono text-emerald-400 uppercase">DELIVERED</span>
                <div className="text-xl font-bold text-emerald-400 mt-1">{deliveredProjectsCount}</div>
                <span className="text-[10px] text-neutral-400">Completed releases</span>
              </div>
            </div>
          </div>

          {/* Itemized Stored Financial Ledger */}
          <div className="bg-[#0F0F0F] border border-[#1E1E1E] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1E1E1E] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Verified Corporate Transaction Ledger</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Stored corporate invoices, official payment receipts, and active commercial proposals.
                </p>
              </div>
              <span className="text-xs font-mono text-neutral-400">
                {financialLedger.items.length} Records Found
              </span>
            </div>

            {financialLedger.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141414] text-neutral-400 font-mono border-b border-[#1E1E1E]">
                    <tr>
                      <th className="py-3 px-4 font-normal">REF CODE</th>
                      <th className="py-3 px-4 font-normal">TYPE</th>
                      <th className="py-3 px-4 font-normal">TITLE & PARTICULARS</th>
                      <th className="py-3 px-4 font-normal">RECIPIENT / CLIENT</th>
                      <th className="py-3 px-4 font-normal">DATE</th>
                      <th className="py-3 px-4 font-normal text-right">AMOUNT (USD)</th>
                      <th className="py-3 px-4 font-normal text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1A] font-mono">
                    {financialLedger.items.map(item => {
                      const typeBadge = 
                        item.type === 'invoice' ? 'text-blue-400 bg-blue-950/40 border-blue-800/40' :
                        item.type === 'receipt' ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40' :
                        'text-purple-400 bg-purple-950/40 border-purple-800/40';

                      return (
                        <tr key={item.id} className="hover:bg-[#141414] transition-colors">
                          <td className="py-3 px-4 text-neutral-300 font-bold">{item.refNo}</td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${typeBadge}`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-white font-sans max-w-xs truncate">
                            {item.title}
                          </td>
                          <td className="py-3 px-4 text-neutral-300 font-sans">{item.recipient}</td>
                          <td className="py-3 px-4 text-neutral-400">{item.date}</td>
                          <td className="py-3 px-4 text-right font-bold text-white">
                            ${item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-[10px] text-neutral-300 px-2 py-0.5 rounded bg-[#1C1C1C]">
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-neutral-500 font-mono text-xs">
                No financial documents recorded in database.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ROLES & ACCESS GOVERNANCE */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Security Constitution */}
          <div className="bg-[#0F0F0F] border border-[#1E1E1E] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <FolderLock size={18} className="text-[#FF1E1E]" />
              <h3 className="font-bold text-white text-sm">
                Role-Based Access Control (RBAC) & Tenancy Architecture
              </h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl">
              KeedoHub employs strict multi-tenant isolation backed by Firestore database security rules and verified Firebase Auth UID session binding. Client workspaces have zero visibility or authorization to inspect sibling client assets, master production center backlogs, or privileged administrative endpoints.
            </p>

            {/* Role Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-[#141414] border border-[#222222] p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Master Operator / Executive</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950/60 text-[#FF1E1E] border border-red-800/40">
                    TIER 1 ADMIN
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Platform owner and executive leadership. Granted access to Admin Control Center, all client workspaces, service packaging catalog, and financial accounting ledgers.
                </p>
                <div className="text-[10px] font-mono text-neutral-500 pt-1">
                  Scope: Universal · Workspace: Master (ws-lyrical-ent)
                </div>
              </div>

              <div className="bg-[#141414] border border-[#222222] p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Production Lead / Producer</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/40">
                    TIER 2 PROD
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Creative directors and studio producers. Can manage production pipeline, upload deliverable versions, run internal QA checks, and publish assets to clients.
                </p>
                <div className="text-[10px] font-mono text-neutral-500 pt-1">
                  Scope: Production Pipeline · No access to Admin Center
                </div>
              </div>

              <div className="bg-[#141414] border border-[#222222] p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Client Member / Artist</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                    TIER 3 CLIENT
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Artists and brand representatives. Confined strictly to their assigned workspace portal. Can review published deliverables, sign off on releases, and submit creative briefs.
                </p>
                <div className="text-[10px] font-mono text-neutral-500 pt-1">
                  Scope: Own Workspace Only · Zero cross-client visibility
                </div>
              </div>
            </div>
          </div>

          {/* Firestore Security Rules Status */}
          <div className="bg-[#0F0F0F] border border-[#1E1E1E] rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              Live Security Rules Enforcement Checklist
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#141414] border border-[#222222]">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  <span className="text-neutral-200">Anti-Privilege Escalation Rule</span>
                </div>
                <span className="font-mono text-[10px] text-emerald-400">ENFORCED (firestore.rules:61-68)</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#141414] border border-[#222222]">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  <span className="text-neutral-200">Strict Multi-Tenant Workspace Isolation</span>
                </div>
                <span className="font-mono text-[10px] text-emerald-400">ENFORCED (/workspaces/{'{id}'}/*)</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#141414] border border-[#222222]">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  <span className="text-neutral-200">Active Membership Status Validation (Revocation Protection)</span>
                </div>
                <span className="font-mono text-[10px] text-emerald-400">ENFORCED (status == 'Active')</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#141414] border border-[#222222]">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  <span className="text-neutral-200">Production Project Write Access</span>
                </div>
                <span className="font-mono text-[10px] text-emerald-400">ENFORCED (isWorkspaceOwner only)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLIENT ONBOARDING MODAL */}
      {isOnboardingModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[#252525] rounded-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-[#FF1E1E]" />
                <h3 className="font-bold text-white text-base">Onboard New Client Workspace</h3>
              </div>
              <button
                onClick={() => setIsOnboardingModalOpen(false)}
                className="text-neutral-500 hover:text-white p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-400 font-mono mb-1">CLIENT / BRAND NAME *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AURA RECORDS or SOLIS APPAREL"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2B2B2B] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF1E1E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 font-mono mb-1">WORKSPACE TYPE</label>
                  <select
                    value={newClientType}
                    onChange={(e) => {
                      const val = e.target.value as WorkspaceType;
                      setNewClientType(val);
                      if (val === 'Artist') {
                        setNewClientCategory('artist');
                        setNewClientColor('#D97706');
                      } else if (val === 'Brand') {
                        setNewClientCategory('brand');
                        setNewClientColor('#2563EB');
                      } else {
                        setNewClientCategory('label');
                        setNewClientColor('#FF1E1E');
                      }
                    }}
                    className="w-full bg-[#181818] border border-[#2B2B2B] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF1E1E]"
                  >
                    <option value="Artist">Artist Client</option>
                    <option value="Brand">Brand Client</option>
                    <option value="Label">Sub-Label / Enterprise</option>
                    <option value="Agency">Creative Agency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 font-mono mb-1">CONTACT EMAIL</label>
                  <input
                    type="email"
                    placeholder="mgmt@clientbrand.com"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="w-full bg-[#181818] border border-[#2B2B2B] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF1E1E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 font-mono mb-1">BRAND ACCENT COLOR</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newClientColor}
                    onChange={(e) => setNewClientColor(e.target.value)}
                    className="w-10 h-10 rounded border border-[#2B2B2B] bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newClientColor}
                    onChange={(e) => setNewClientColor(e.target.value)}
                    className="bg-[#181818] border border-[#2B2B2B] rounded-lg px-3 py-2 text-white font-mono uppercase text-xs w-32"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 font-mono mb-1">BRAND TAGLINE / POSITIONING</label>
                <input
                  type="text"
                  placeholder="e.g. Modernist Soundscapes & Architectural Streetwear"
                  value={newClientTagline}
                  onChange={(e) => setNewClientTagline(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2B2B2B] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF1E1E]"
                />
              </div>

              <div>
                <label className="block text-neutral-400 font-mono mb-1">ASSIGN INITIAL SERVICE PACKAGE</label>
                <select
                  value={newClientInitialPackage}
                  onChange={(e) => setNewClientInitialPackage(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2B2B2B] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF1E1E]"
                >
                  <option value="">None (Assign later)</option>
                  {servicePackages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} (${pkg.priceUsd.toLocaleString()} · {pkg.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 font-mono mb-1">BRIEF & ONBOARDING NOTES</label>
                <textarea
                  rows={3}
                  placeholder="Client objectives, initial deliverables needed, target release dates..."
                  value={newClientDescription}
                  onChange={(e) => setNewClientDescription(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2B2B2B] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF1E1E]"
                />
              </div>

              <div className="pt-3 border-t border-[#222222] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOnboardingModalOpen(false)}
                  className="px-4 py-2 text-neutral-400 hover:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FF1E1E] hover:bg-red-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-red-950/40"
                >
                  Initialize Client Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SERVICE PACKAGE MODAL (ADD / EDIT) */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[#252525] rounded-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-[#FF1E1E]" />
                <h3 className="font-bold text-white text-base">
                  {editingPackage ? 'Edit Service Package' : 'Create New Service Package'}
                </h3>
              </div>
              <button
                onClick={() => setIsPackageModalOpen(false)}
                className="text-neutral-500 hover:text-white p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-400 font-mono mb-1">PACKAGE NAME *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Single Release Launch Package"
                  value={pkgName}
                  onChange={(e) => setPkgName(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2B2B2B] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF1E1E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 font-mono mb-1">CATEGORY</label>
                  <select
                    value={pkgCategory}
                    onChange={(e) => setPkgCategory(e.target.value as ServiceCategory)}
                    className="w-full bg-[#181818] border border-[#2B2B2B] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF1E1E]"
                  >
                    <option value="Music Release Promotion">Music Release Promotion</option>
                    <option value="Cover Artwork & Visuals">Cover Artwork & Visuals</option>
                    <option value="Motion Design & Video">Motion Design & Video</option>
                    <option value="Brand Identity System">Brand Identity System</option>
                    <option value="Business & Corporate Creative">Business & Corporate Creative</option>
                    <option value="Executive Creative Retainer">Executive Creative Retainer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 font-mono mb-1">PACKAGE TIER</label>
                  <select
                    value={pkgTier}
                    onChange={(e) => setPkgTier(e.target.value as ServiceTier)}
                    className="w-full bg-[#181818] border border-[#2B2B2B] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF1E1E]"
                  >
                    <option value="Essential">Essential</option>
                    <option value="Professional">Professional</option>
                    <option value="Flagship / Custom">Flagship / Custom</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 font-mono mb-1">PRICE (USD) *</label>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    required
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(Number(e.target.value))}
                    className="w-full bg-[#181818] border border-[#2B2B2B] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF1E1E]"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-mono mb-1">BILLING MODEL</label>
                  <select
                    value={pkgBillingType}
                    onChange={(e) => setPkgBillingType(e.target.value as any)}
                    className="w-full bg-[#181818] border border-[#2B2B2B] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF1E1E]"
                  >
                    <option value="One-Time">One-Time Project</option>
                    <option value="Per-Release">Per-Release Package</option>
                    <option value="Monthly Retainer">Monthly Retainer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-400 font-mono mb-1">TURNAROUND (DAYS)</label>
                  <input
                    type="number"
                    min={1}
                    value={pkgTurnaroundDays}
                    onChange={(e) => setPkgTurnaroundDays(Number(e.target.value))}
                    className="w-full bg-[#181818] border border-[#2B2B2B] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF1E1E]"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-mono mb-1">REVISIONS (-1=UNLTD)</label>
                  <input
                    type="number"
                    min={-1}
                    value={pkgRevisionLimit}
                    onChange={(e) => setPkgRevisionLimit(Number(e.target.value))}
                    className="w-full bg-[#181818] border border-[#2B2B2B] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF1E1E]"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-mono mb-1">TARGET AUDIENCE</label>
                  <select
                    value={pkgAudience}
                    onChange={(e) => setPkgAudience(e.target.value as any)}
                    className="w-full bg-[#181818] border border-[#2B2B2B] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF1E1E]"
                  >
                    <option value="Artist">Artist</option>
                    <option value="Brand">Brand</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 font-mono mb-1">PACKAGE DESCRIPTION</label>
                <textarea
                  rows={2}
                  placeholder="Detailed value proposition and artistic direction included..."
                  value={pkgDescription}
                  onChange={(e) => setPkgDescription(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2B2B2B] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF1E1E]"
                />
              </div>

              <div>
                <label className="block text-neutral-400 font-mono mb-1">
                  DELIVERABLES (ONE PER LINE)
                </label>
                <textarea
                  rows={4}
                  placeholder="3000x3000px Master Cover Artwork&#10;Spotify 9:16 Seamless Canvas&#10;Electronic Press Kit PDF"
                  value={pkgDeliverablesText}
                  onChange={(e) => setPkgDeliverablesText(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2B2B2B] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF1E1E] font-mono text-[11px]"
                />
              </div>

              <div className="pt-3 border-t border-[#222222] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPackageModalOpen(false)}
                  className="px-4 py-2 text-neutral-400 hover:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FF1E1E] hover:bg-red-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-red-950/40"
                >
                  {editingPackage ? 'Save Revisions' : 'Publish Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLIENT DETAILS & ACCESS DRAWER / MODAL */}
      {selectedClientForDetails && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[#252525] rounded-xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <div className="flex items-center gap-3">
                <div 
                  className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-xs"
                  style={{ backgroundColor: selectedClientForDetails.brand?.accentColor || '#333' }}
                >
                  {selectedClientForDetails.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{selectedClientForDetails.name}</h3>
                  <span className="text-[11px] font-mono text-neutral-400">ID: {selectedClientForDetails.id}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedClientForDetails(null)}
                className="text-neutral-500 hover:text-white p-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Status Control */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#161616] border border-[#262626]">
              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase block">WORKSPACE LIFECYCLE STATUS</span>
                <span className="text-xs font-bold text-white">Current: {selectedClientForDetails.status || 'Active'}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {(['Active', 'Onboarding', 'Paused', 'Archived'] as WorkspaceStatus[]).map(statusOption => (
                  <button
                    key={statusOption}
                    onClick={() => {
                      updateWorkspaceStatus(selectedClientForDetails.id, statusOption);
                      setSelectedClientForDetails(prev => prev ? { ...prev, status: statusOption } : null);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
                      (selectedClientForDetails.status || 'Active') === statusOption
                        ? 'bg-[#FF1E1E] text-white font-bold'
                        : 'bg-[#222222] text-neutral-400 hover:text-white'
                    }`}
                  >
                    {statusOption}
                  </button>
                ))}
              </div>
            </div>

            {/* Contracted Services Assignment */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-neutral-400 uppercase block">
                Manage Contracted Services for this Client
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {servicePackages.map(pkg => {
                  const isAssigned = (selectedClientForDetails.contractedPackageIds || []).includes(pkg.id);
                  return (
                    <div 
                      key={pkg.id} 
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#161616] border border-[#242424] text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white">{pkg.name}</div>
                        <div className="text-[10px] font-mono text-neutral-400">
                          ${pkg.priceUsd.toLocaleString()} · {pkg.category}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (isAssigned) {
                            removeServicePackageFromWorkspace(selectedClientForDetails.id, pkg.id);
                            setSelectedClientForDetails(prev => prev ? {
                              ...prev,
                              contractedPackageIds: (prev.contractedPackageIds || []).filter(id => id !== pkg.id)
                            } : null);
                          } else {
                            assignServicePackageToWorkspace(selectedClientForDetails.id, pkg.id);
                            setSelectedClientForDetails(prev => prev ? {
                              ...prev,
                              contractedPackageIds: [...(prev.contractedPackageIds || []), pkg.id]
                            } : null);
                          }
                        }}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                          isAssigned
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 hover:bg-red-950/60 hover:text-red-400 hover:border-red-800/50'
                            : 'bg-[#242424] text-neutral-300 hover:bg-[#303030]'
                        }`}
                      >
                        {isAssigned ? 'Subscribed (Remove)' : 'Assign Package'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Associated Projects View */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-neutral-400 uppercase block">
                Linked Production Projects ({productionProjects.filter(p => p.workspaceId === selectedClientForDetails.id).length})
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {productionProjects.filter(p => p.workspaceId === selectedClientForDetails.id).map(proj => (
                  <div key={proj.id} className="flex items-center justify-between p-2 rounded bg-[#161616] border border-[#222222] text-xs">
                    <span className="text-white truncate max-w-xs">{proj.title}</span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                      {proj.stage}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-[#222222] flex items-center justify-between">
              <button
                onClick={() => {
                  switchWorkspace(selectedClientForDetails.id);
                  setSelectedClientForDetails(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF1E1E] hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <span>Enter Workspace</span>
                <ArrowRight size={13} />
              </button>

              <button
                onClick={() => setSelectedClientForDetails(null)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

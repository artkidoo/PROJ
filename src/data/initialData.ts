import { 
  Artist, 
  MusicRelease, 
  CreativeCampaign, 
  CorporateDocument, 
  BrandAsset, 
  OperationTask, 
  ActivityLog,
  PressRelease,
  MediaContact,
  BloggerThemeSettings,
  BrandGuidelinesData,
  PlatformUser,
  Workspace,
  WorkspaceMembership,
  ProductionProject,
  ServicePackage,
  MotionProjectSpec
} from '../types';

export const INITIAL_PLATFORM_USER: PlatformUser = {
  id: 'user-01',
  name: 'Ojo Abdulkareem',
  email: 'ojoabdulkareem53@gmail.com',
  status: 'Active',
  avatarUrl: '/src/assets/images/user_avatar_placeholder.jpg',
  createdAt: '2024-01-01T00:00:00Z'
};

export const INITIAL_WORKSPACES: Workspace[] = [
  {
    id: 'ws-lyrical-ent',
    name: 'LYRICAL ENT',
    type: 'Label',
    clientCategory: 'label',
    ownerId: 'user-01',
    status: 'Active',
    contactEmail: 'contact@lyricalent.com',
    description: 'Master Creative Label & Portfolio Showcase',
    contractedPackageIds: ['pkg-exec-retainer', 'pkg-motion-suite'],
    createdAt: '2024-01-01T00:00:00Z',
    brand: {
      name: 'LYRICAL ENT',
      primaryColor: '#FFFFFF',
      secondaryColor: '#000000',
      accentColor: '#FF1E1E',
      tagline: 'Auteur Soundscapes & Monolith Design',
      typography: {
        displayFont: 'Plus Jakarta Sans',
        bodyFont: 'Plus Jakarta Sans'
      }
    }
  },
  {
    id: 'ws-sariyah-artist',
    name: 'SARIYAH',
    type: 'Artist',
    clientCategory: 'artist',
    ownerId: 'user-01',
    status: 'Active',
    contactEmail: 'mgmt@sariyahmusic.com',
    description: 'Artist Client Workspace — Neo-Soul & Alternative R&B',
    contractedPackageIds: ['pkg-music-promo-deluxe', 'pkg-artwork-flagship'],
    createdAt: '2025-01-10T00:00:00Z',
    brand: {
      name: 'SARIYAH',
      primaryColor: '#D97706',
      secondaryColor: '#17130E',
      accentColor: '#F59E0B',
      tagline: 'Midnight Architecture & Acoustic Soul',
      typography: {
        displayFont: 'Plus Jakarta Sans',
        bodyFont: 'Plus Jakarta Sans'
      }
    }
  },
  {
    id: 'ws-apex-brand',
    name: 'APEX DYNAMICS',
    type: 'Brand',
    clientCategory: 'brand',
    ownerId: 'user-01',
    status: 'Active',
    contactEmail: 'partnerships@apexdynamics.io',
    description: 'Brand Client Workspace — Motion & Digital Identity Systems',
    contractedPackageIds: ['pkg-brand-monolith', 'pkg-biz-corporate'],
    createdAt: '2025-02-01T00:00:00Z',
    brand: {
      name: 'APEX DYNAMICS',
      primaryColor: '#2563EB',
      secondaryColor: '#0B1120',
      accentColor: '#60A5FA',
      tagline: 'Autonomous Performance Systems & Spatial Motion',
      typography: {
        displayFont: 'Plus Jakarta Sans',
        bodyFont: 'Plus Jakarta Sans'
      }
    }
  }
];

export const INITIAL_MEMBERSHIPS: WorkspaceMembership[] = [
  {
    id: 'mem-01',
    userId: 'user-01',
    workspaceId: 'ws-lyrical-ent',
    role: 'Owner',
    status: 'Active',
    joinedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'mem-02',
    userId: 'user-01',
    workspaceId: 'ws-sariyah-artist',
    role: 'Owner',
    status: 'Active',
    joinedAt: '2025-01-10T00:00:00Z'
  },
  {
    id: 'mem-03',
    userId: 'user-01',
    workspaceId: 'ws-apex-brand',
    role: 'Owner',
    status: 'Active',
    joinedAt: '2025-02-01T00:00:00Z'
  }
];

export const INITIAL_ARTISTS: Artist[] = [
  {
    id: 'art-01',
    workspaceId: 'ws-sariyah-artist',
    name: 'Sariyah Cole',
    moniker: 'SARIYAH',
    legalName: 'Sariyah Nicole Cole',
    genre: 'Neo-Soul / Alternative R&B',
    bio: 'Vocalist and composer fusing organic acoustic instrumentation, layered vocal arrangements, and understated contemporary rhythm. Signed to LYRICAL ENT for full recording and worldwide publishing rights.',
    email: 'mgmt@sariyahmusic.com',
    phone: '+1 (310) 555-0194',
    location: 'London / Los Angeles',
    instagram: '@sariyahcole',
    spotify: 'spotify:artist:sariyahcole',
    appleMusic: 'music.apple.com/artist/sariyah',
    youtube: 'youtube.com/@sariyahcole',
    status: 'Active',
    careerGoals: 'Establish European headline tour; secure sync licensing in premium feature cinema; release debut 10-track LP Q4.',
    developmentNotes: 'Vocal arrangement workshops completed. Second single in final mastering. Stage production rehearsals scheduled for July.',
    projectHistory: [
      'Single: "Midnight Architecture" (2025)',
      'EP: "Quiet Foundations" (2025)',
      'Single: "Monochrome State" (Upcoming)'
    ],
    releaseIds: ['rel-01', 'rel-02'],
    avatarUrl: '/src/assets/images/artist_showcase_portrait_1792791744296.jpg',
    isConfidential: false,
    createdAt: '2025-08-15T10:00:00Z',
    updatedAt: '2026-03-01T14:30:00Z'
  },
  {
    id: 'art-02',
    workspaceId: 'ws-lyrical-ent',
    name: 'Marcus Thorne',
    moniker: 'THORNE',
    legalName: 'Marcus Alexander Thorne',
    genre: 'Cinematic Hip-Hop / Electronic',
    bio: 'Producer and lyricist known for spatial drum synthesis, minimalist piano motives, and sharp narrative lyricism.',
    email: 'contact@marcusthornemusic.com',
    location: 'Toronto, CA',
    instagram: '@marcusthorne',
    spotify: 'spotify:artist:marcusthorne',
    status: 'Active',
    careerGoals: 'Co-produce soundtrack for international arthouse film; release 5-track collaborative EP.',
    developmentNotes: 'Working with orchestrator on string quartet stems for album climax.',
    projectHistory: ['Single: "Black Slate" (2025)'],
    releaseIds: ['rel-03'],
    isConfidential: false,
    createdAt: '2025-10-10T12:00:00Z',
    updatedAt: '2026-02-18T09:15:00Z'
  },
  {
    id: 'art-03',
    workspaceId: 'ws-lyrical-ent',
    name: 'Elena Vance',
    moniker: 'VANCE',
    legalName: 'Elena Sofia Vance',
    genre: 'Modern Ambient / Experimental Classical',
    bio: 'Pianist and sound designer exploring modular synthesizer tape loops and prepared piano textures.',
    email: 'legal@vancearchive.org',
    location: 'Berlin, DE',
    status: 'Development',
    careerGoals: 'Audiovisual installation in Tokyo; release limited vinyl edition of debut concept album.',
    developmentNotes: 'Mix approval pending label review. Dolby Atmos spatial mix stems underway.',
    projectHistory: ['Demo reel submitted 2026-01'],
    releaseIds: [],
    isConfidential: true,
    createdAt: '2026-01-20T16:00:00Z',
    updatedAt: '2026-03-05T11:00:00Z'
  }
];

export const INITIAL_RELEASES: MusicRelease[] = [
  {
    id: 'rel-01',
    workspaceId: 'ws-sariyah-artist',
    title: 'Monochrome State',
    type: 'Single',
    artistId: 'art-01',
    artistName: 'Sariyah Cole',
    featuredArtists: '',
    producer: 'Kaelen Vance & Sariyah Cole',
    songwriters: 'Sariyah Cole, Kaelen Vance, David Okoye',
    credits: 'Mastered at Abbey Road Studios by Christian Wright. Mixed by Alex Tumay. Executive Producer: LYRICAL ENT.',
    plannedReleaseDate: '2026-11-14',
    artworkUrl: '/src/assets/images/vinyl_press_mockup_1792791744149.jpg',
    audioLocation: 'LYRICAL Cloud Vault // Master_24bit_96kHz_WAV.zip',
    distributionStatus: 'Metadata Verification',
    isrc: 'US-LYR-26-00104',
    upc: '198273948201',
    rightsInfo: '(P) 2026 LYRICAL ENT LLC under exclusive license. (C) 2026 LYRICAL Publishing Group (BMI).',
    releaseNotes: 'Lead single for upcoming autumn campaign. Accompanying 4K music video filmed in black & white 35mm.',
    marketingAssetsCount: 8,
    publicUrl: 'https://lyricalent.com/releases/monochrome-state',
    checklist: {
      audioMastered: true,
      artworkApproved: true,
      splitSheetSigned: true,
      metadataVerified: true,
      distributionSubmitted: false,
      pressKitReady: true,
      marketingAssetsReady: false
    },
    budgetAllocated: 12500,
    budgetSpent: 8400,
    packageId: 'pkg-music-promo-deluxe',
    campaignStage: 'Pre-Release',
    audioMetadata: {
      fileName: 'Monochrome_State_Master_24bit_96k.wav',
      format: 'Lossless PCM WAV',
      durationSeconds: 218,
      sampleRate: '96.0 kHz',
      bitDepth: '24-bit',
      fileSize: '78.4 MB',
      uploadedAt: '2026-10-12T14:30:00Z'
    },
    artworkMetadata: {
      fileName: 'Sariyah_MonochromeState_FrontCover_Master.png',
      dimensions: '4000x4000',
      colorSpace: 'sRGB',
      resolutionDpi: 300,
      fileSize: '14.2 MB',
      uploadedAt: '2026-10-14T09:15:00Z'
    },
    deliverables: [
      {
        id: 'deliv-01',
        name: 'Master DSP Cover Artwork (3000x3000px)',
        category: 'Artwork',
        format: '1:1 Square (3000x3000px)',
        stage: 'Delivered',
        previewUrl: '/src/assets/images/vinyl_press_mockup_1792791744149.jpg',
        fileSpecs: 'PNG · 3000x3000px · 300DPI · 8.2 MB',
        revisionCount: 1,
        maxRevisions: 3,
        isClientPublished: true,
        clientApproved: true,
        approvedAt: '2026-10-16T11:00:00Z'
      },
      {
        id: 'deliv-02',
        name: 'Spotify 9:16 Canvas Loop (8s)',
        category: 'Motion Video',
        format: '9:16 Vertical (1080x1920px)',
        stage: 'Client Review',
        previewUrl: '/src/assets/images/vinyl_press_mockup_1792791744149.jpg',
        fileSpecs: 'MP4 ProRes · 1080x1920 · 60FPS · 16.4 MB',
        revisionCount: 2,
        maxRevisions: 3,
        isClientPublished: true,
        clientApproved: false,
        publishedAt: '2026-10-24T15:00:00Z'
      },
      {
        id: 'deliv-03',
        name: '3x Instagram Story & Reel Countdown Teasers',
        category: 'Social Asset',
        format: '9:16 Vertical (1080x1920px)',
        stage: 'In Production',
        fileSpecs: 'MP4 60FPS · 3 variants',
        revisionCount: 0,
        maxRevisions: 3,
        isClientPublished: false
      },
      {
        id: 'deliv-04',
        name: 'Electronic Press Kit (EPK) One-Sheet PDF',
        category: 'EPK & Press',
        format: 'PDF Document',
        stage: 'Internal QA',
        fileSpecs: 'Interactive PDF · 300DPI Print Ready · 3.8 MB',
        revisionCount: 1,
        maxRevisions: 3,
        isClientPublished: false
      }
    ],
    clientApprovalStatus: 'Approved',
    clientApprovalDate: '2026-10-16T11:00:00Z',
    finalDeliveryUrl: '/releases/monochrome-state/package_v1.zip',
    createdAt: '2026-02-01T10:00:00Z'
  },
  {
    id: 'rel-02',
    workspaceId: 'ws-sariyah-artist',
    title: 'Quiet Foundations',
    type: 'EP',
    artistId: 'art-01',
    artistName: 'Sariyah Cole',
    producer: 'Kaelen Vance',
    songwriters: 'Sariyah Cole',
    credits: 'Recorded at LYRICAL Sound Lab A, London. Mastered by Sterling Sound.',
    plannedReleaseDate: '2025-11-20',
    artworkUrl: '/src/assets/images/lyrical_ent_studio_hero_1792791743831.jpg',
    distributionStatus: 'Live',
    isrc: 'US-LYR-25-00088',
    upc: '198273947119',
    rightsInfo: '(P) & (C) 2025 LYRICAL ENT LLC. All rights reserved.',
    releaseNotes: 'Catalog EP. Catalog streaming performance stable across European markets.',
    marketingAssetsCount: 14,
    publicUrl: 'https://lyricalent.com/releases/quiet-foundations',
    checklist: {
      audioMastered: true,
      artworkApproved: true,
      splitSheetSigned: true,
      metadataVerified: true,
      distributionSubmitted: true,
      pressKitReady: true,
      marketingAssetsReady: true
    },
    budgetAllocated: 18000,
    budgetSpent: 17650,
    createdAt: '2025-09-01T10:00:00Z'
  },
  {
    id: 'rel-03',
    workspaceId: 'ws-lyrical-ent',
    title: 'Black Slate (Visual EP)',
    type: 'Music Video',
    artistId: 'art-02',
    artistName: 'Marcus Thorne',
    producer: 'Marcus Thorne & Noah Sterling',
    songwriters: 'Marcus Thorne',
    credits: 'Directed by Jordan K. Produced by LYRICAL ENT Visuals. Director of Photography: Michael Chen.',
    plannedReleaseDate: '2026-12-05',
    distributionStatus: 'In Production',
    isrc: 'US-LYR-26-00109',
    upc: '198273948332',
    rightsInfo: '(P) 2026 LYRICAL ENT LLC. Master recording and audiovisual rights reserved.',
    releaseNotes: 'Short-film music video project. Final color grading underway.',
    marketingAssetsCount: 4,
    checklist: {
      audioMastered: true,
      artworkApproved: false,
      splitSheetSigned: true,
      metadataVerified: false,
      distributionSubmitted: false,
      pressKitReady: false,
      marketingAssetsReady: false
    },
    budgetAllocated: 24000,
    budgetSpent: 15200,
    createdAt: '2026-02-15T11:00:00Z'
  }
];

export const INITIAL_CAMPAIGNS: CreativeCampaign[] = [
  {
    id: 'camp-01',
    title: 'Monochrome State Global Rollout',
    releaseId: 'rel-01',
    releaseTitle: 'Monochrome State',
    artistId: 'art-01',
    artistName: 'Sariyah Cole',
    type: 'Single Launch',
    budget: 9500,
    status: 'In Production',
    launchDate: '2026-11-07',
    notes: 'Multi-phase teaser campaign focusing on minimal black & white typographic posters, street billboard placement, and YouTube premiere countdown.',
    deliverables: [
      {
        id: 'del-01',
        name: 'Cover Artwork (3000x3000px Master)',
        format: '1:1 Square',
        status: 'Approved',
        assignedTo: 'Creative Direction',
        dueDate: '2026-10-15',
        assetUrl: '/src/assets/images/vinyl_press_mockup_1792791744149.jpg'
      },
      {
        id: 'del-02',
        name: 'Official Announcement Poster',
        format: 'Print / Poster',
        status: 'In Review',
        assignedTo: 'Studio Design Lead',
        dueDate: '2026-10-28'
      },
      {
        id: 'del-03',
        name: '7-Day Countdown Stories Series',
        format: '9:16 Vertical Story',
        status: 'In Progress',
        assignedTo: 'Digital Media Specialist',
        dueDate: '2026-11-01'
      },
      {
        id: 'del-04',
        name: 'Out-Now Motion Graphic & Spotify Canvas',
        format: '9:16 Vertical Story',
        status: 'Pending',
        assignedTo: 'Motion Animator',
        dueDate: '2026-11-05'
      },
      {
        id: 'del-05',
        name: 'YouTube Premiere Thumbnail & 4K Title Card',
        format: '16:9 Landscape',
        status: 'In Review',
        assignedTo: 'Studio Design Lead',
        dueDate: '2026-11-04'
      }
    ],
    createdAt: '2026-02-10T09:00:00Z'
  }
];

export const INITIAL_DOCUMENTS: CorporateDocument[] = [
  {
    id: 'doc-01',
    type: 'letterhead',
    title: 'Official Label Notice — Worldwide Distribution Partnership',
    referenceNo: 'LYR-LTR-2026-004',
    date: '2026-10-20',
    recipientName: 'Global Digital Music Distribution Ltd.',
    recipientOrg: 'Acquisitions & Platform Operations',
    recipientAddress: '445 Park Avenue, 18th Floor, New York, NY 10022',
    recipientEmail: 'deliveries@digitaldistro.com',
    authorName: 'Ojo Abdulkareem',
    authorRole: 'Managing Director & Head of Label',
    status: 'Approved',
    subject: 'Official Notice of Release Schedule and Exclusive Master Delivery for Q4 2026',
    bodyContent: 'This letter confirms that LYRICAL ENT LLC is the sole and exclusive worldwide proprietor of the master sound recordings and audiovisual materials specified in Exhibit A. All delivery packages comply with strict 24-bit/96kHz WAV uncompressed specifications and verified ISRC metadata standards. Please find attached the formal schedule for worldwide ingestion.',
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-21T15:00:00Z'
  },
  {
    id: 'doc-02',
    type: 'invoice',
    title: 'Production Master Invoice #INV-2026-089',
    referenceNo: 'INV-LYR-2026-089',
    date: '2026-10-18',
    recipientName: 'Aura Media Group LLC',
    recipientOrg: 'Commercial Sync Licensing Dept',
    recipientAddress: '720 Sunset Boulevard, Suite 400, Los Angeles, CA 90028',
    recipientEmail: 'accounts@auramedia.com',
    authorName: 'Ojo Abdulkareem',
    authorRole: 'Managing Director & Head of Label',
    status: 'Issued',
    paymentTerms: 'Net 30 Days. Wire transfer payable to LYRICAL ENT LLC Operating Account.',
    notes: 'Includes synchronization license rights for North American territory theatrical broadcast.',
    items: [
      {
        description: 'Worldwide Master Synchronization License: "Midnight Architecture" by Sariyah Cole',
        quantity: 1,
        unitPrice: 7500,
        total: 7500
      },
      {
        description: 'Dolby Atmos Master Stem Extraction & Archival Delivery',
        quantity: 1,
        unitPrice: 1200,
        total: 1200
      }
    ],
    bodyContent: 'Thank you for licensing with LYRICAL ENT. Please process payment in accordance with the executed Master Synchronization Agreement.',
    createdAt: '2026-10-18T11:00:00Z',
    updatedAt: '2026-10-18T11:30:00Z'
  },
  {
    id: 'doc-03',
    type: 'split_sheet',
    title: 'Songwriter & Producer Split Sheet — "Monochrome State"',
    referenceNo: 'SPLIT-2026-MS-01',
    date: '2026-09-14',
    recipientName: 'The Recording Authors & Publishers',
    authorName: 'Elena Rostova',
    authorRole: 'Head of Legal & Business Affairs',
    status: 'Approved',
    subject: 'Binding Musical Composition Ownership Agreement',
    bodyContent: 'This Split Sheet confirms the agreed ownership shares of the underlying musical composition entitled "Monochrome State" recorded by Sariyah Cole under LYRICAL ENT catalog US-LYR-26-00104. Total shares equal exactly 100.00%.',
    notes: 'Sariyah Cole: 50.00% (Lyrics & Melody) / Kaelen Vance: 35.00% (Music & Production) / David Okoye: 15.00% (Arrangement & Additional Composition).',
    createdAt: '2026-09-14T09:00:00Z',
    updatedAt: '2026-09-15T10:00:00Z'
  },
  {
    id: 'doc-04',
    type: 'receipt',
    title: 'Official Payment Receipt #REC-2026-042',
    referenceNo: 'REC-LYR-2026-042',
    date: '2026-10-19',
    recipientName: 'Aura Media Group LLC',
    recipientOrg: 'Commercial Accounts Payable',
    recipientAddress: '720 Sunset Boulevard, Suite 400, Los Angeles, CA 90028',
    recipientEmail: 'accounts@auramedia.com',
    authorName: 'Ojo Abdulkareem',
    authorRole: 'Managing Director & Head of Label',
    status: 'Issued',
    paymentTerms: 'Payment received in full via Wire Transfer. Ref: WT-8839210-LYR.',
    notes: 'Official receipt acknowledges settlement of Invoice #INV-LYR-2026-089 for master synchronization rights.',
    items: [
      {
        description: 'Payment Received — Master Sync License ("Midnight Architecture")',
        quantity: 1,
        unitPrice: 8700,
        total: 8700
      }
    ],
    bodyContent: 'LYRICAL ENT LLC acknowledges receipt of full payment in the amount of $8,700.00 USD from Aura Media Group LLC. All corresponding theatrical broadcast synchronization rights are hereby formally activated.',
    createdAt: '2026-10-19T14:00:00Z',
    updatedAt: '2026-10-19T14:15:00Z'
  },
  {
    id: 'doc-05',
    type: 'quotation',
    title: 'Executive Production Quotation — Q1 Commercial Campaign',
    referenceNo: 'QUO-LYR-2026-018',
    date: '2026-10-21',
    recipientName: 'Verve Luxury Apparel Group',
    recipientOrg: 'Brand Marketing & Content Direction',
    recipientAddress: '15 Conduit Street, Mayfair, London W1S 2XJ',
    recipientEmail: 'partnerships@verveapparel.co.uk',
    authorName: 'Julian Mercer',
    authorRole: 'Creative Director',
    status: 'Under Review',
    paymentTerms: '50% upon contract execution, 50% upon final master deliverable signoff.',
    notes: 'Quotation valid for 30 calendar days from issue date. Includes 2 studio revision rounds.',
    items: [
      {
        description: 'Custom Brand Runway Sonic Score (3-minute original composition)',
        quantity: 1,
        unitPrice: 12500,
        total: 12500
      },
      {
        description: 'Sound Lab A Spatial Dolby Atmos Audio Engineering & Mastering',
        quantity: 2,
        unitPrice: 1800,
        total: 3600
      },
      {
        description: 'Global Digital Media Commercial Synchronization Clearance',
        quantity: 1,
        unitPrice: 9000,
        total: 9000
      }
    ],
    bodyContent: 'LYRICAL ENT is pleased to submit this formal production quotation for Verve Luxury Apparel Group. Our London Sound Lab will engineer an exclusive, bespoke sonic landscape for your forthcoming international fashion show and broadcast campaign.',
    createdAt: '2026-10-21T09:30:00Z',
    updatedAt: '2026-10-21T11:00:00Z'
  },
  {
    id: 'doc-06',
    type: 'partnership_proposal',
    title: 'Strategic Brand Partnership Proposal — High-Fidelity Audio Co-Lab',
    referenceNo: 'PROP-PART-2026-003',
    date: '2026-10-15',
    recipientName: 'Kallisto Acoustics Worldwide',
    recipientOrg: 'Global Strategic Alliances',
    recipientAddress: 'Stadelhoferstrasse 22, 8001 Zürich, Switzerland',
    recipientEmail: 'alliances@kallistoaudio.ch',
    authorName: 'Ojo Abdulkareem',
    authorRole: 'Managing Director & Head of Label',
    status: 'Approved',
    subject: 'Strategic Co-Branded Studio Monitoring System & Vinyl Hardware Collaboration',
    bodyContent: 'LYRICAL ENT proposes an exclusive strategic alliance with Kallisto Acoustics to engineer a co-branded reference studio monitor and limited-run vinyl listening system. By combining LYRICAL ENT\'s prestigious monochrome aesthetic and mastering pedigree with Kallisto\'s Swiss precision transducers, the partnership captures high-value audiophile and creative professional markets.',
    notes: 'Projected revenue share: 60/40 hardware manufacturing and licensing allocation. Global launch projected for Q3 2027.',
    createdAt: '2026-10-15T10:00:00Z',
    updatedAt: '2026-10-16T12:00:00Z'
  },
  {
    id: 'doc-07',
    type: 'company_profile',
    title: 'LYRICAL ENT — Official Company Profile & Master Dossier',
    referenceNo: 'DOSSIER-LYR-2026-01',
    date: '2026-10-01',
    recipientName: 'Industry Partners, Media, & Global Distributors',
    recipientOrg: 'Worldwide Music & Entertainment Ecosystem',
    recipientAddress: 'London Sound Labs · Los Angeles Operations',
    recipientEmail: 'executive@lyricalent.com',
    authorName: 'Ojo Abdulkareem',
    authorRole: 'Managing Director & Head of Label',
    status: 'Approved',
    subject: 'Comprehensive Corporate Overview, Sound Lab Infrastructure, and Artist Roster',
    bodyContent: 'LYRICAL ENT LLC is an independent record label, creative production house, and artist development studio headquartered in London and Los Angeles. Built upon architectural minimalism and uncompromising audio fidelity, the company operates dedicated recording sound labs, an in-house visual design studio, and global master rights administration.\n\nOur roster encompasses defining contemporary vocalists and visionary producers, supported by 24-bit/96kHz high-resolution sound engineering and worldwide physical vinyl distribution.',
    notes: 'Official executive dossier. Certified by LYRICAL ENT LLC Directorate.',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-02T09:00:00Z'
  },
  {
    id: 'doc-08',
    type: 'asset_handover',
    title: 'Master Audio Tape & Hard Drive Custody Transfer Form',
    referenceNo: 'HO-LYR-2026-024',
    date: '2026-10-22',
    recipientName: 'Abbey Pressing Plant Ltd.',
    recipientOrg: 'Physical Vinyl Lacquer Department',
    recipientAddress: 'Unit 4, Olympic Industrial Park, London E15 2LZ',
    recipientEmail: 'lacquers@abbeypressing.co.uk',
    authorName: 'Marcus Thorne',
    authorRole: 'Head of Sound Engineering',
    status: 'Approved',
    subject: 'Transfer of Custody: Lacquer Masters for "Monochrome State" 12-inch Vinyl',
    bodyContent: 'This document formally certifies the physical and digital transfer of custody for 1/2-inch ATR master tapes (30 IPS, CCIR) and encrypted Lacquer cutting files for the release "Monochrome State" (Catalog No. LYR-VINYL-001). The recipient confirms receipt in pristine physical condition and undertakes not to duplicate or distribute copies outside pressing requirements.',
    notes: 'Condition verified: Inspection passed with zero mechanical defects. Delivery escorted by authorized courier.',
    createdAt: '2026-10-22T16:00:00Z',
    updatedAt: '2026-10-22T16:30:00Z'
  },
  {
    id: 'doc-09',
    type: 'meeting_minutes',
    title: 'Executive Board & A&R Strategy Minutes — Q4 Release Summit',
    referenceNo: 'MIN-EXEC-2026-10',
    date: '2026-10-20',
    recipientName: 'Executive Directorate & Department Heads',
    recipientOrg: 'LYRICAL ENT LLC Boardroom',
    authorName: 'Elena Rostova',
    authorRole: 'Head of Legal & Business Affairs',
    status: 'Approved',
    subject: 'Minutes of Q4 Release Review, Vinyl Supply Chain, and 2027 Roster Signings',
    bodyContent: 'PRESENT: Ojo Abdulkareem (Chair), Elena Rostova, Julian Mercer, Marcus Thorne.\n\nAGENDA ITEMS:\n1. Sariyah Cole debut rollout timeline locked for November 7, 2026.\n2. Master synchronization revenues up 34% following theatrical placement.\n3. Approved capital expenditure of £45,000 for Sound Lab B Dolby Atmos acoustic treatment upgrade.\n\nACTION ITEMS:\n- Julian Mercer to finalize 7-day countdown motion assets by Oct 28.\n- Elena Rostova to execute worldwide DSP distribution agreement with distributor.\n- Next Executive Summit scheduled for November 15, 2026.',
    notes: 'Official board record preserved in corporate archive.',
    createdAt: '2026-10-20T17:00:00Z',
    updatedAt: '2026-10-21T09:00:00Z'
  },
  {
    id: 'doc-apex-01',
    workspaceId: 'ws-apex-brand',
    type: 'partnership_proposal',
    title: 'Master Creative Production Agreement & Statement of Work',
    referenceNo: 'APX-SOW-2026-001',
    date: '2026-10-15',
    recipientName: 'Apex Dynamics Inc.',
    recipientOrg: 'Product & Design Operations',
    recipientAddress: '100 Silicon Way, San Francisco, CA 94107',
    recipientEmail: 'brand@apexdynamics.io',
    authorName: 'Ojo Abdulkareem',
    authorRole: 'Head of Creative Production',
    status: 'Approved',
    subject: 'Complete Brand System & Motion Design Architecture Deliverables',
    bodyContent: 'Formal agreement and scope of work for APEX DYNAMICS digital brand system, vector assets, and multi-format marketing collateral.',
    createdAt: '2026-10-15T09:00:00Z',
    updatedAt: '2026-10-16T10:00:00Z'
  },
  {
    id: 'doc-apex-02',
    workspaceId: 'ws-apex-brand',
    type: 'company_profile',
    title: 'Digital Brand Identity Guidelines & Design Tokens v2.4',
    referenceNo: 'APX-GUIDE-2026-02',
    date: '2026-10-22',
    recipientName: 'Internal Engineering & Design Teams',
    recipientOrg: 'Apex Dynamics Worldwide',
    authorName: 'Creative Director',
    authorRole: 'Lead Brand Architect',
    status: 'Approved',
    subject: 'Official Visual Standards & Component Rules',
    bodyContent: 'Guidelines for Apex Dynamics electric cobalt (#2563EB) accents, obsidian dark mode UI tokens, and typography hierarchy.',
    createdAt: '2026-10-22T10:00:00Z',
    updatedAt: '2026-10-22T11:00:00Z'
  },
  {
    id: 'doc-apex-03',
    workspaceId: 'ws-apex-brand',
    type: 'invoice',
    title: 'Creative Sprint Milestone Invoice #INV-APX-2026-104',
    referenceNo: 'INV-APX-2026-104',
    date: '2026-10-24',
    recipientName: 'Apex Dynamics Accounts Payable',
    recipientOrg: 'Finance Directorate',
    recipientAddress: '100 Silicon Way, San Francisco, CA 94107',
    recipientEmail: 'ap@apexdynamics.io',
    authorName: 'Ojo Abdulkareem',
    authorRole: 'Managing Director',
    status: 'Issued',
    paymentTerms: 'Net 30. Wire transfer.',
    items: [
      {
        description: 'Brand Identity Design Sprint & Vector Suite',
        quantity: 1,
        unitPrice: 9500,
        total: 9500
      },
      {
        description: 'Motion Design 4K Ident & Social Launch Kit',
        quantity: 1,
        unitPrice: 4200,
        total: 4200
      }
    ],
    bodyContent: 'Invoice for Phase 1 Brand Identity & Motion Design Sprint delivery.',
    createdAt: '2026-10-24T14:00:00Z',
    updatedAt: '2026-10-24T14:00:00Z'
  }
];

export const INITIAL_BRAND_ASSETS: BrandAsset[] = [
  {
    id: 'brand-01',
    name: 'LYRICAL ENT Primary Wordmark (Monochrome Black & White)',
    category: 'Primary Logo',
    fileType: 'SVG',
    dimensions: 'Vector / Scalable',
    fileSize: '14.2 KB',
    version: 'v2.4 Final',
    status: 'Approved',
    description: 'High-contrast bold architectural typography with razor-sharp geometric kerning and balanced letter spacing.',
    usageRules: 'Maintain minimum 40px clear space on all sides. Must only be rendered in solid 100% Black (#000000) on light backgrounds or solid 100% White (#FFFFFF) on dark surfaces. Never apply drop shadows, gradient fills, or slant angles.',
    isVector: true,
    uploadedAt: '2026-01-10T12:00:00Z'
  },
  {
    id: 'brand-02',
    name: 'LYRICAL Monogram Seal "LE"',
    category: 'Monogram',
    fileType: 'SVG',
    dimensions: '1024x1024px Vector',
    fileSize: '8.4 KB',
    version: 'v2.1',
    status: 'Approved',
    description: 'Interlocking geometric L and E emblem designed for vinyl run-out matrix etching, apparel tags, and circular social avatars.',
    usageRules: 'Center-weighted alignment. Minimum print reproduction size is 12mm diameter. Never distort the aspect ratio.',
    isVector: true,
    uploadedAt: '2026-01-12T14:30:00Z'
  },
  {
    id: 'brand-03',
    name: 'LYRICAL Secondary Compact Lockup',
    category: 'Secondary Logo',
    fileType: 'SVG',
    dimensions: 'Vector / Scalable',
    fileSize: '11.8 KB',
    version: 'v1.9',
    status: 'Approved',
    description: 'Horizontal compact mark combining the LE monogram with LYRICAL ENT text for tight header bars and audio visualizers.',
    usageRules: 'For horizontal viewports under 600px or when vertical height is constrained below 48px.',
    isVector: true,
    uploadedAt: '2026-01-15T09:20:00Z'
  },
  {
    id: 'brand-04',
    name: 'Production Studio Favicon Suite',
    category: 'Favicon',
    fileType: 'SVG',
    dimensions: '32x32, 64x64, 512x512',
    fileSize: '6.1 KB',
    version: 'v2.0',
    status: 'Approved',
    description: 'Solid high-contrast black and white square icon formatted for modern browser tabs and home-screen bookmarks.',
    usageRules: 'Strictly 1:1 square canvas.',
    isVector: true,
    uploadedAt: '2026-01-20T11:00:00Z'
  },
  {
    id: 'brand-05',
    name: 'Editorial Monochrome Brand Guidelines PDF',
    category: 'Guideline',
    fileType: 'PDF',
    dimensions: '28 Pages A4 Landscape',
    fileSize: '4.8 MB',
    version: 'v2026.1',
    status: 'Approved',
    description: 'Complete brand manual detailing typography scale, photography art direction, vinyl packaging specifications, and legal notice standards.',
    usageRules: 'Mandatory reading for all creative directors, graphic contractors, and external agencies.',
    isVector: false,
    uploadedAt: '2026-02-01T10:00:00Z'
  },
  {
    id: 'brand-apx-01',
    workspaceId: 'ws-apex-brand',
    name: 'APEX Primary Kinetic Vector Wordmark',
    category: 'Primary Logo',
    fileType: 'SVG',
    dimensions: 'Vector / Scalable',
    fileSize: '12.4 KB',
    version: 'v2.4 Final',
    status: 'Approved',
    description: 'Electric cobalt typography with high-precision aerodynamic glyph cuts.',
    usageRules: 'Must only be rendered in electric blue (#2563EB) or white on dark backgrounds.',
    isVector: true,
    uploadedAt: '2026-02-01T12:00:00Z'
  },
  {
    id: 'brand-apx-02',
    workspaceId: 'ws-apex-brand',
    name: 'APEX Hexagonal Monogram & App Glyph',
    category: 'Monogram',
    fileType: 'SVG',
    dimensions: '512x512px Vector',
    fileSize: '7.8 KB',
    version: 'v2.1',
    status: 'Approved',
    description: 'Interlocking polygon prism representing speed and motion algorithms.',
    usageRules: 'Used for favicons, software application icons, and badge embroidery.',
    isVector: true,
    uploadedAt: '2026-02-05T14:00:00Z'
  },
  {
    id: 'brand-apx-03',
    workspaceId: 'ws-apex-brand',
    name: 'APEX Obsidian & Electric Blue Token System',
    category: 'Palette',
    fileType: 'JSON',
    dimensions: 'Design Tokens',
    fileSize: '4.2 KB',
    version: 'v1.0',
    status: 'Approved',
    description: 'Full CSS and Tailwind variables for primary #2563EB, background #0B1120, and accents.',
    usageRules: 'Apply across web apps, marketing decks, and physical signage.',
    isVector: false,
    uploadedAt: '2026-02-10T10:00:00Z'
  },
  {
    id: 'brand-sar-01',
    workspaceId: 'ws-sariyah-artist',
    name: 'SARIYAH Signature Script Monogram',
    category: 'Monogram',
    fileType: 'SVG',
    dimensions: 'Vector / Scalable',
    fileSize: '9.6 KB',
    version: 'v1.4',
    status: 'Approved',
    description: 'Organic handwritten monogram in warm soul gold (#D97706).',
    usageRules: 'For vinyl center labels, promotional apparel, and tour posters.',
    isVector: true,
    uploadedAt: '2026-01-22T10:00:00Z'
  },
  {
    id: 'brand-sar-02',
    workspaceId: 'ws-sariyah-artist',
    name: 'Midnight Architecture 3000x3000px Master Cover Art',
    category: 'Primary Logo',
    fileType: 'PNG',
    dimensions: '3000x3000px',
    fileSize: '8.4 MB',
    version: 'Final Master',
    status: 'Approved',
    description: 'Ultra high-resolution artwork master for single DSP streaming delivery.',
    usageRules: 'Direct delivery to Apple Music, Spotify, and Tidal.',
    isVector: false,
    uploadedAt: '2026-02-14T11:00:00Z'
  }
];

export const INITIAL_TASKS: OperationTask[] = [
  {
    id: 'tsk-01',
    workspaceId: 'ws-lyrical-ent',
    title: 'Review final master stems for "Monochrome State"',
    category: 'A&R',
    priority: 'Urgent',
    dueDate: '2026-10-26',
    assignee: 'A&R Director',
    status: 'In Progress',
    relatedEntityId: 'rel-01',
    relatedEntityName: 'Monochrome State',
    notes: 'Verify 24-bit headroom and vocal sibilance on high-end monitors.',
    createdAt: '2026-10-21T09:00:00Z'
  },
  {
    id: 'tsk-sar-01',
    workspaceId: 'ws-sariyah-artist',
    title: 'Review Spotify Canvas 9:16 Video Loop',
    category: 'Creative',
    priority: 'Urgent',
    dueDate: '2026-10-29',
    assignee: 'Sariyah Cole / Management',
    status: 'In Review',
    relatedEntityId: 'rel-01',
    relatedEntityName: 'Monochrome State',
    notes: 'Review loop transition at 0:07s mark. Color grading approved.',
    createdAt: '2026-10-22T11:00:00Z'
  },
  {
    id: 'tsk-sar-02',
    workspaceId: 'ws-sariyah-artist',
    title: 'Approve Vinyl Gatefold Packaging Mockup',
    category: 'Creative',
    priority: 'High',
    dueDate: '2026-11-02',
    assignee: 'Creative Team',
    status: 'In Review',
    relatedEntityId: 'rel-01',
    relatedEntityName: 'Monochrome State',
    notes: 'Check inner sleeve lyrics and font hierarchy on physical proof.',
    createdAt: '2026-10-23T14:00:00Z'
  },
  {
    id: 'tsk-apx-01',
    workspaceId: 'ws-apex-brand',
    title: 'Sign-off on Executive Pitch Deck v3.2',
    category: 'Executive',
    priority: 'Urgent',
    dueDate: '2026-10-28',
    assignee: 'Apex Leadership',
    status: 'In Review',
    notes: 'Review slides 8-12 financial unit economics and typography balance.',
    createdAt: '2026-10-24T09:00:00Z'
  },
  {
    id: 'tsk-apx-02',
    workspaceId: 'ws-apex-brand',
    title: 'Motion Ident 4K Render Final Delivery',
    category: 'Creative',
    priority: 'High',
    dueDate: '2026-10-30',
    assignee: 'Motion Studio Lead',
    status: 'Done',
    notes: 'Delivered in ProRes 4444 with alpha channel and H.264 web preview.',
    createdAt: '2026-10-20T10:00:00Z'
  },
  {
    id: 'tsk-02',
    title: 'Finalize press release for Sariyah Cole single launch',
    category: 'Marketing',
    priority: 'High',
    dueDate: '2026-10-28',
    assignee: 'Communications Lead',
    status: 'Todo',
    relatedEntityId: 'camp-01',
    relatedEntityName: 'Monochrome State Global Rollout',
    notes: 'Distribute under strict 48-hour embargo to designated music publications.',
    createdAt: '2026-10-22T10:30:00Z'
  },
  {
    id: 'tsk-03',
    title: 'Audit ISRC and UPC registration on DSP direct portal',
    category: 'Distribution',
    priority: 'High',
    dueDate: '2026-10-29',
    assignee: 'Label Manager',
    status: 'Todo',
    relatedEntityId: 'rel-01',
    relatedEntityName: 'Monochrome State',
    notes: 'Ensure Apple Music and Spotify credits accurately attribute songwriters.',
    createdAt: '2026-10-22T14:00:00Z'
  },
  {
    id: 'tsk-04',
    title: 'Review synchronisation agreement for French film placement',
    category: 'Legal',
    priority: 'Normal',
    dueDate: '2026-11-04',
    assignee: 'Legal Counsel',
    status: 'In Review',
    notes: 'Confirm master synchronization indemnity clauses.',
    createdAt: '2026-10-20T16:00:00Z'
  }
];

export const INITIAL_ACTIVITY: ActivityLog[] = [
  {
    id: 'act-01',
    timestamp: '2026-10-23T12:30:00Z',
    actor: 'Ojo Abdulkareem',
    role: 'Managing Director',
    action: 'Approved Asset',
    module: 'brand',
    details: 'Validated and locked LYRICAL Monogram Seal "LE" v2.1 for global packaging.'
  },
  {
    id: 'act-02',
    timestamp: '2026-10-23T10:15:00Z',
    actor: 'Elena Rostova',
    role: 'Legal & Business Affairs',
    action: 'Executed Document',
    module: 'documents',
    details: 'Issued formal split sheet documentation for single "Monochrome State".'
  },
  {
    id: 'act-03',
    timestamp: '2026-10-22T16:45:00Z',
    actor: 'Marcus Thorne',
    role: 'A&R / Producer',
    action: 'Updated Deliverable',
    module: 'campaigns',
    details: 'Submitted YouTube Premiere 4K title card for creative review.'
  },
  {
    id: 'act-04',
    timestamp: '2026-10-22T11:00:00Z',
    actor: 'Studio Operations',
    role: 'Operations Lead',
    action: 'Created Release Schedule',
    module: 'releases',
    details: 'Initialized metadata lock checklist for upcoming single releases.'
  }
];

export const INITIAL_PRESS_RELEASES: PressRelease[] = [
  {
    id: 'pr-01',
    title: 'LYRICAL ENT ANNOUNCES WORLDWIDE RELEASE OF "MONOCHROME STATE" BY SARIYAH COLE',
    subtitle: 'The critically acclaimed vocalist returns with an architectural sonic exploration ahead of her anticipated 2026 European tour.',
    date: '2026-10-28',
    embargoDate: '2026-10-30T00:01:00Z',
    status: 'Draft',
    leadParagraph: 'LONDON & LOS ANGELES — Independent music house LYRICAL ENT today announced the forthcoming global release of "Monochrome State", the commanding new single from British singer-songwriter Sariyah Cole.',
    body: 'Recorded between LYRICAL ENT\'s London production facility and Sound Lab A in Los Angeles, the track demonstrates a focused evolution in contemporary alternative R&B. Built on sparse acoustic basslines, analog synthesizer polyphony, and Cole\'s unmistakable multi-octave vocal arrangements, "Monochrome State" explores themes of emotional restraint and clarity.\n\nThe single is paired with a monochromatic 35mm film directed by Jordan K., photographed on location in brutalist architectural spaces throughout Berlin and Paris.',
    quoteSpeaker: 'Ojo Abdulkareem',
    quoteTitle: 'Managing Director, LYRICAL ENT',
    quoteBody: '"Sariyah represents the core ethos of LYRICAL ENT: uncompromising artistic autonomy paired with world-class sonic engineering. \'Monochrome State\' is a definitive cultural milestone for our roster."',
    mediaContact: 'press@lyricalent.com | LYRICAL ENT Press Office'
  }
];

export const INITIAL_MEDIA_CONTACTS: MediaContact[] = [
  {
    id: 'med-01',
    outlet: 'Pitchfork / Condé Nast',
    contactName: 'Julian Sterling',
    role: 'Senior Music Editor',
    email: 'j_sterling@pitchfork.com',
    beat: 'Alternative R&B, Electronic, Editorial Features',
    tier: 'Tier 1',
    notes: 'Prefers early streaming links 3 weeks prior to release date.'
  },
  {
    id: 'med-02',
    outlet: 'The FADER',
    contactName: 'Amara Vance',
    role: 'Culture & Features Writer',
    email: 'avance@thefader.com',
    beat: 'New Artist Profiles, Visual Premieres',
    tier: 'Tier 1',
    notes: 'Covered Sariyah Cole\'s 2025 EP.'
  },
  {
    id: 'med-03',
    outlet: 'Clash Magazine',
    contactName: 'Liam Doherty',
    role: 'Reviews Editor',
    email: 'liam@clashmusic.com',
    beat: 'UK & International Soul, Physical Vinyl Reviews',
    tier: 'Tier 2',
    notes: 'Requested physical vinyl press copy.'
  }
];

export const INITIAL_BLOGGER_SETTINGS: BloggerThemeSettings = {
  siteTitle: 'LYRICAL ENT',
  tagline: 'Independent Record Label & Creative Production Studio',
  heroHeadline: 'SONIC ARCHITECTURE. INDEPENDENT ARTISTRY.',
  heroSubheadline: 'Home to boundary-pushing contemporary musicians, composers, and multidisciplinary sound artists.',
  heroButtonText: 'Explore Catalog',
  heroButtonUrl: '#releases',
  musicCardColumns: 3,
  showArtistRoster: true,
  showLatestReleases: true,
  showNewsSection: true,
  showAboutSection: true,
  showNewsletterSubscribe: true,
  showDemoSubmissionLink: true,
  primaryColor: '#FFFFFF',
  backgroundColor: '#0A0A0A',
  textColor: '#E5E5E5',
  footerCopyright: '© 2026 LYRICAL ENT LLC. All rights reserved. Registered trademark. London · Los Angeles.',
  aboutLabelText: 'Operating between London and Los Angeles, LYRICAL ENT is an independent record label and multidisciplinary audio house dedicated to uncompromising artistic integrity, analog warmth, and architectural sonic clarity.',
  missionText: 'To champion singular artistic vision by providing world-class acoustic engineering, uncompromising creative autonomy, and sustainable ownership models for visionary contemporary musicians.',
  visionText: 'A global cultural benchmark for high-fidelity independent sound—where physical vinyl craft, cinematic visual storytelling, and cutting-edge digital distribution converge without corporate dilution.',
  contactEmail: 'contact@lyricalent.com',
  demoSubmissionEmail: 'a-and-r@lyricalent.com',
  featuredReleaseId: 'rel-01',
  featuredArtistId: 'art-01',
  instagramUrl: 'https://instagram.com/lyricalent',
  spotifyUrl: 'https://open.spotify.com/label/lyricalent',
  youtubeUrl: 'https://youtube.com/@lyricalent',
  xUrl: 'https://x.com/lyricalent',
  featuredVideoTitle: 'Monochrome State — Official 35mm Motion Picture',
  featuredVideoEmbedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
};

export const INITIAL_BRAND_GUIDELINES: BrandGuidelinesData = {
  brandVoice: 'Authoritative, minimal, uncompromising, and editorial. We speak with quiet confidence rooted in artistic rigor, sonic mastery, and cultural foresight. No hyperbolic slang, no corporate jargon, and no artificial hype.',
  photographyDirection: 'Documentary high-contrast monochrome (35mm or medium-format aesthetic). Authentic studio captures, architectural spaces, deep velvety blacks, and razor-sharp highlights. Natural window light and focused studio spots. No airbrushed plastic skin, oversaturated colors, or staged stock imagery.',
  graphicDesignPrinciples: 'Architectural grid alignment, generous whitespace, strict typographic hierarchy, and extreme contrast restraint. Form follows sonic structure. Hairline borders (1px solid #242424), zero decorative pills or gradient fills.',
  clearSpaceRules: 'The minimum clear space around any LYRICAL ENT mark is equal to 50% of the LE monogram width (X/2). No other text, graphics, or borders may intrude into this exclusion zone.',
  minLogoSizePrint: 'Primary Logo: 28mm wide; LE Monogram: 10mm diameter; Favicon/Badge: 8mm.',
  minLogoSizeDigital: 'Primary Logo: 140px wide; Horizontal Lockup: 32px height; LE Monogram: 24px; Favicon: 16px.',
  backgroundRules: 'Only use 100% Black (#000000), Studio Obsidian (#0A0A0A), Charcoal (#171717), or Pure White (#FFFFFF). When placed over documentary photography, ensure at least 4.5:1 contrast or use an approved monochrome scrim.',
  incorrectUsageRules: [
    'Never alter the aspect ratio, slant, skew, or distort the LE monogram or wordmark.',
    'Never apply drop shadows, 3D extrusions, glow filters, or gradient overlays.',
    'Never render the logo in colors outside Pure Black (#000000) or Pure White (#FFFFFF).',
    'Never enclose the logo inside an unauthorized circle, pill, or shield.',
    'Never recreate the wordmark using an unapproved display typeface.',
    'Never place the white logo on low-contrast mid-tone grey surfaces without proper scrim.'
  ]
};


export const INITIAL_PRODUCTION_PROJECTS: ProductionProject[] = [
  {
    id: 'prod-01',
    title: 'Midnight Solitude — Vinyl Packaging & Master Delivery',
    workspaceId: 'ws-sariyah-artist',
    clientName: 'SARIYAH',
    clientCategory: 'artist',
    projectType: 'Music Release Package',
    stage: 'Ready for Delivery',
    priority: 'High',
    leadProducer: 'KeedoHub Lead Producer',
    dueDate: '2026-11-15',
    brief: {
      description: '6-track neo-soul EP master audio delivery, gatefold 12-inch vinyl proofing, and Apple Digital Masters compliant metadata.',
      deliverableSpecs: '3000x3000px 300DPI CMYK sleeve + 24-bit/48kHz Master WAV uncompressed files',
      targetAudience: 'Neo-Soul & Alternative R&B enthusiasts, audiophiles, physical vinyl collectors',
      inspirationNotes: 'Monochrome contrast, warm film grain, deep architectural typography',
      referenceLinks: ['https://spotify.com/album/midnight-solitude']
    },
    sourceMaterials: [
      { id: 'src-01', name: 'Raw 35mm Studio Contact Sheet', fileType: 'TIFF', url: '/src/assets/images/artist_sariyah_press.jpg', uploadedAt: '2026-10-01T12:00:00Z' },
      { id: 'src-02', name: 'Master Track Multi-Stems (Lossless)', fileType: 'ZIP', url: '/assets/stems/midnight_solitude.zip', uploadedAt: '2026-10-05T14:30:00Z' }
    ],
    versions: [
      {
        id: 'ver-01-1',
        versionNumber: 'v1.0',
        title: 'Initial Gatefold Sleeve Draft',
        fileUrl: '/src/assets/images/vinyl_press_mockup_1792791744149.jpg',
        previewUrl: '/src/assets/images/vinyl_press_mockup_1792791744149.jpg',
        fileType: 'image/jpeg',
        fileSize: '4.2 MB',
        uploadedAt: '2026-10-10T10:00:00Z',
        uploadedBy: 'Creative Director',
        isClientPublished: false,
        clientReviewStatus: 'Approved'
      },
      {
        id: 'ver-01-2',
        versionNumber: 'v1.1',
        title: 'Final Vinyl Gatefold & High-Res Master Sleeve',
        fileUrl: '/src/assets/images/vinyl_press_mockup_1792791744149.jpg',
        previewUrl: '/src/assets/images/vinyl_press_mockup_1792791744149.jpg',
        fileType: 'image/jpeg',
        fileSize: '18.4 MB',
        uploadedAt: '2026-10-20T16:00:00Z',
        uploadedBy: 'Lead Designer',
        isClientPublished: true,
        publishedAt: '2026-10-21T09:00:00Z',
        clientReviewStatus: 'Approved',
        clientFeedback: 'Approved by artist team. Stunning layout.'
      }
    ],
    internalNotes: [
      { id: 'not-01', author: 'Ojo Abdulkareem', role: 'Executive', content: 'Master audio passed acoustic QC. Zero digital clipping detected.', timestamp: '2026-10-12T11:00:00Z', isInternalOnly: true },
      { id: 'not-02', author: 'Creative Director', role: 'Creative Director', content: 'Client signed off on final sleeve proofs. Ready for press run.', timestamp: '2026-10-22T14:00:00Z', isInternalOnly: true }
    ],
    qualityChecks: [
      { id: 'qc-01', label: '24-bit 48kHz WAV audio files verified', passed: true, verifiedBy: 'A&R Director', verifiedAt: '2026-10-12T11:30:00Z' },
      { id: 'qc-02', label: '3000x3000px RGB & CMYK sleeve color profile checked', passed: true, verifiedBy: 'Lead Designer', verifiedAt: '2026-10-20T17:00:00Z' },
      { id: 'qc-03', label: 'Barcode and ISRC registration tags embedded', passed: true, verifiedBy: 'Label Manager', verifiedAt: '2026-10-21T10:00:00Z' },
      { id: 'qc-04', label: 'Split sheet agreements countersigned by all parties', passed: true, verifiedBy: 'Legal Affairs', verifiedAt: '2026-10-22T09:00:00Z' }
    ],
    relatedReleaseId: 'rel-01',
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-22T14:00:00Z'
  },
  {
    id: 'prod-02',
    title: 'Velvet Reverie — Single Artwork & 9:16 Canvas',
    workspaceId: 'ws-sariyah-artist',
    clientName: 'SARIYAH',
    clientCategory: 'artist',
    projectType: 'Cover Artwork Design',
    stage: 'Client Review',
    priority: 'Urgent',
    leadProducer: 'Creative Director',
    dueDate: '2026-12-05',
    brief: {
      description: 'Single cover artwork package and dynamic vertical motion canvas loop for Spotify Canvas and Apple Motion.',
      deliverableSpecs: '3000x3000px TIFF cover art + 1080x1920 9:16 MP4 video loop (8 seconds seamless)',
      targetAudience: 'Streaming platforms and playlist curators',
      inspirationNotes: 'Velvety shadows, minimal typography, warm golden accents'
    },
    sourceMaterials: [
      { id: 'src-03', name: 'Studio Film Scans Roll 4', fileType: 'PNG', url: '/src/assets/images/artist_sariyah_press.jpg', uploadedAt: '2026-10-18T09:00:00Z' }
    ],
    versions: [
      {
        id: 'ver-02-1',
        versionNumber: 'v1.0',
        title: 'Single Cover Art Proof (Variant B - Warm Accent)',
        fileUrl: '/src/assets/images/artist_sariyah_press.jpg',
        previewUrl: '/src/assets/images/artist_sariyah_press.jpg',
        fileType: 'image/jpeg',
        fileSize: '6.8 MB',
        uploadedAt: '2026-10-24T15:30:00Z',
        uploadedBy: 'Creative Director',
        isClientPublished: true,
        publishedAt: '2026-10-24T16:00:00Z',
        clientReviewStatus: 'Pending'
      }
    ],
    internalNotes: [
      { id: 'not-03', author: 'Creative Director', role: 'Creative Director', content: 'Sent proof to Sariyah team for final sign-off. Awaiting approval.', timestamp: '2026-10-24T16:30:00Z', isInternalOnly: true }
    ],
    qualityChecks: [
      { id: 'qc-05', label: '3000x3000px exact dimensions verified', passed: true, verifiedBy: 'Creative Director', verifiedAt: '2026-10-24T15:45:00Z' },
      { id: 'qc-06', label: 'Motion loop seamless zero-jump transition', passed: false },
      { id: 'qc-07', label: 'DSP metadata compliance verified', passed: true, verifiedBy: 'Label Manager', verifiedAt: '2026-10-24T16:00:00Z' }
    ],
    relatedReleaseId: 'rel-02',
    createdAt: '2026-10-18T09:00:00Z',
    updatedAt: '2026-10-24T16:30:00Z'
  },
  {
    id: 'prod-03',
    title: 'Apex Dynamics — Master Brand Identity System V2.4',
    workspaceId: 'ws-apex-brand',
    clientName: 'APEX DYNAMICS',
    clientCategory: 'brand',
    projectType: 'Brand Identity System',
    stage: 'In Production',
    priority: 'High',
    leadProducer: 'Senior Brand Architect',
    dueDate: '2026-11-30',
    brief: {
      description: 'Comprehensive brand identity manual, vector monogram design tokens, corporate stationery kit, and dark-mode guidelines.',
      deliverableSpecs: 'Vector SVG marks, Figma design tokens, 48-page PDF Brand Manual, print stationery templates',
      targetAudience: 'Global enterprise stakeholders and digital product engineers',
      inspirationNotes: 'Electric cobalt #2563EB accent, geometric Swiss grid, razor-sharp typography'
    },
    sourceMaterials: [
      { id: 'src-04', name: 'Legacy Monogram Assets & Brand Deck', fileType: 'PDF', url: '/src/assets/images/lyrical_ent_brand_stationery_1792793391733.jpg', uploadedAt: '2026-10-15T11:00:00Z' }
    ],
    versions: [
      {
        id: 'ver-03-1',
        versionNumber: 'v1.0',
        title: 'Core Monogram Geometry & Grid Construction',
        fileUrl: '/src/assets/images/lyrical_ent_brand_stationery_1792793391733.jpg',
        previewUrl: '/src/assets/images/lyrical_ent_brand_stationery_1792793391733.jpg',
        fileType: 'image/jpeg',
        fileSize: '8.1 MB',
        uploadedAt: '2026-10-19T14:00:00Z',
        uploadedBy: 'Senior Brand Architect',
        isClientPublished: true,
        publishedAt: '2026-10-20T10:00:00Z',
        clientReviewStatus: 'Approved',
        clientFeedback: 'Approved the geometric grid. Proceed with full guidelines manual.'
      }
    ],
    internalNotes: [
      { id: 'not-04', author: 'Senior Brand Architect', role: 'Creative Director', content: 'Completed color token contrast tests. 7:1 ratio on obsidian background.', timestamp: '2026-10-21T09:00:00Z', isInternalOnly: true }
    ],
    qualityChecks: [
      { id: 'qc-08', label: 'Vector Bézier curves and nodes optimized', passed: true, verifiedBy: 'Senior Brand Architect', verifiedAt: '2026-10-20T09:30:00Z' },
      { id: 'qc-09', label: 'WCAG 2.1 AA and AAA color contrast passed', passed: true, verifiedBy: 'Senior Brand Architect', verifiedAt: '2026-10-21T08:50:00Z' },
      { id: 'qc-10', label: 'Multi-scale icon rendering (16px to 512px)', passed: true, verifiedBy: 'Senior Brand Architect', verifiedAt: '2026-10-21T09:15:00Z' }
    ],
    relatedDocumentId: 'doc-apex-01',
    createdAt: '2026-10-15T11:00:00Z',
    updatedAt: '2026-10-21T09:00:00Z'
  },
  {
    id: 'prod-04',
    title: 'Apex Dynamics — Kinetic Motion Graphics Suite',
    workspaceId: 'ws-apex-brand',
    clientName: 'APEX DYNAMICS',
    clientCategory: 'brand',
    projectType: 'Motion Teaser & 9:16 Canvas',
    stage: 'Revision Required',
    priority: 'Urgent',
    leadProducer: 'Motion Lead',
    dueDate: '2026-11-20',
    brief: {
      description: '3D kinetic logo sting and 3 social video bumpers for upcoming product announcement.',
      deliverableSpecs: 'ProRes 4444 with alpha + 16:9 4K 60fps MP4 + 9:16 vertical 1080x1920 MP4',
      targetAudience: 'Tech media, social followers, and keynote presentation viewers'
    },
    sourceMaterials: [
      { id: 'src-05', name: '3D Monogram Mesh (OBJ / GLTF)', fileType: 'GLTF', url: '/assets/models/apex_logo.gltf', uploadedAt: '2026-10-18T10:00:00Z' }
    ],
    versions: [
      {
        id: 'ver-04-1',
        versionNumber: 'v1.0',
        title: 'Kinetic 3D Sting Draft (Render 01)',
        fileUrl: '/src/assets/images/lyrical_ent_studio_hero_1792791743831.jpg',
        previewUrl: '/src/assets/images/lyrical_ent_studio_hero_1792791743831.jpg',
        fileType: 'image/jpeg',
        fileSize: '24.5 MB',
        uploadedAt: '2026-10-23T11:00:00Z',
        uploadedBy: 'Motion Lead',
        isClientPublished: true,
        publishedAt: '2026-10-23T12:00:00Z',
        clientReviewStatus: 'Revision Requested',
        clientFeedback: 'Motion is great, but deceleration at end frame is too abrupt. Extend easing by 0.4 seconds.'
      }
    ],
    internalNotes: [
      { id: 'not-05', author: 'Motion Lead', role: 'Creative Director', content: 'Adjusting cubic Bézier easing curve in After Effects. Re-rendering passes now.', timestamp: '2026-10-25T14:15:00Z', isInternalOnly: true }
    ],
    qualityChecks: [
      { id: 'qc-11', label: '60fps zero drop-frame rendering', passed: true, verifiedBy: 'Motion Lead', verifiedAt: '2026-10-23T10:30:00Z' },
      { id: 'qc-12', label: 'Alpha channel transparency tested against black/white', passed: true, verifiedBy: 'Motion Lead', verifiedAt: '2026-10-23T10:45:00Z' },
      { id: 'qc-13', label: 'Client revision adjustments implemented', passed: false }
    ],
    relatedTaskId: 'tsk-apx-01',
    createdAt: '2026-10-18T10:00:00Z',
    updatedAt: '2026-10-25T14:15:00Z'
  },
  {
    id: 'prod-05',
    title: 'Apex Dynamics — Corporate Master Retainer Agreement',
    workspaceId: 'ws-apex-brand',
    clientName: 'APEX DYNAMICS',
    clientCategory: 'brand',
    projectType: 'Corporate Contract & Stationery',
    stage: 'Delivered',
    priority: 'Medium',
    leadProducer: 'Legal & Business Affairs',
    dueDate: '2026-10-15',
    deliveredAt: '2026-10-15T18:00:00Z',
    brief: {
      description: 'Annual design retainer contract, IP assignment schedule, SLA requirements, and monthly billing terms.',
      deliverableSpecs: 'Countersigned PDF + Plain-text legally verified archive'
    },
    sourceMaterials: [],
    versions: [
      {
        id: 'ver-05-1',
        versionNumber: 'v1.0',
        title: 'Master Retainer Agreement (Signed & Executed)',
        fileUrl: '/documents/apex_retainer_executed.pdf',
        previewUrl: '/src/assets/images/lyrical_ent_brand_stationery_1792793391733.jpg',
        fileType: 'application/pdf',
        fileSize: '1.2 MB',
        uploadedAt: '2026-10-14T10:00:00Z',
        uploadedBy: 'Legal Affairs',
        isClientPublished: true,
        publishedAt: '2026-10-15T09:00:00Z',
        clientReviewStatus: 'Approved',
        clientFeedback: 'Countersigned by Managing Director on 2026-10-15.'
      }
    ],
    internalNotes: [
      { id: 'not-06', author: 'Legal Affairs', role: 'Legal & Business Affairs', content: 'Contract fully executed and archived in secure corporate vault.', timestamp: '2026-10-15T18:00:00Z', isInternalOnly: true }
    ],
    qualityChecks: [
      { id: 'qc-14', label: 'Legal jurisdiction clauses confirmed', passed: true, verifiedBy: 'Legal Affairs', verifiedAt: '2026-10-14T11:00:00Z' },
      { id: 'qc-15', label: 'All party signatures and corporate seals applied', passed: true, verifiedBy: 'Legal Affairs', verifiedAt: '2026-10-15T17:30:00Z' }
    ],
    relatedDocumentId: 'doc-apex-02',
    createdAt: '2026-10-10T09:00:00Z',
    updatedAt: '2026-10-15T18:00:00Z'
  },
  {
    id: 'prod-06',
    title: 'Lyrical Ent — Showcase Catalog & Press Kit',
    workspaceId: 'ws-lyrical-ent',
    clientName: 'LYRICAL ENT',
    clientCategory: 'label',
    projectType: 'Website & Press Kit',
    stage: 'Brief Approved',
    priority: 'Medium',
    leadProducer: 'Ojo Abdulkareem',
    dueDate: '2026-12-10',
    brief: {
      description: 'Flagship label promotional EPK, catalog discography breakdown, and press release distribution suite for upcoming Q4 showcase.',
      deliverableSpecs: 'Digital interactive press kit + 300DPI print one-sheets'
    },
    sourceMaterials: [],
    versions: [],
    internalNotes: [
      { id: 'not-07', author: 'Ojo Abdulkareem', role: 'Executive', content: 'Approved scope of work. Preparing artist interview transcripts.', timestamp: '2026-10-24T10:00:00Z', isInternalOnly: true }
    ],
    qualityChecks: [
      { id: 'qc-16', label: 'Catalog discography metadata validated', passed: true, verifiedBy: 'Label Manager', verifiedAt: '2026-10-24T12:00:00Z' }
    ],
    createdAt: '2026-10-22T08:00:00Z',
    updatedAt: '2026-10-24T10:00:00Z'
  }
];

export const INITIAL_SERVICE_PACKAGES: ServicePackage[] = [
  {
    id: 'pkg-music-promo-deluxe',
    category: 'Music Release Promotion',
    name: 'Single Release Launch Package',
    tier: 'Professional',
    description: 'Comprehensive release campaign package including DSP cover artwork, Spotify 9:16 Canvas, social countdown assets, and targeted press distribution.',
    deliverables: [
      '3000x3000px Master Cover Artwork (RGB 300DPI)',
      '9:16 Spotify Canvas (8s seamless loop)',
      '3x Instagram Story & Reel Promo Teasers',
      'Electronic Press Kit (EPK) One-Sheet PDF',
      'Distribution Metadata Verification Sheet'
    ],
    priceUsd: 1850,
    billingType: 'Per-Release',
    revisionLimit: 3,
    turnaroundDays: 5,
    isActive: true,
    targetAudience: 'Artist',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z'
  },
  {
    id: 'pkg-album-rollout',
    category: 'Music Release Promotion',
    name: 'Full Album / EP Omnichannel Rollout',
    tier: 'Flagship / Custom',
    description: 'A multi-phase release campaign architecture encompassing lead singles, pre-save activations, physical gatefold packaging, and tour announcement collateral.',
    deliverables: [
      'Master Album Cover + 3 Single Cover Variants',
      'Physical Vinyl / CD Gatefold Packaging Print Files',
      'Full Motion Asset Suite (16:9 Landscape, 9:16 Vertical, 1:1 Square)',
      'Pre-save Campaign Landing Page Design',
      'Tier 1 Press Release & Media Pitch Kit'
    ],
    priceUsd: 4800,
    billingType: 'Per-Release',
    revisionLimit: 5,
    turnaroundDays: 14,
    isActive: true,
    targetAudience: 'Artist',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2025-01-20T00:00:00Z'
  },
  {
    id: 'pkg-artwork-flagship',
    category: 'Cover Artwork & Visuals',
    name: 'Auteur Cover Artwork Design',
    tier: 'Professional',
    description: 'Bespoke typographic and photographic cover art engineered for digital streaming platforms, vinyl prints, and billboard scale.',
    deliverables: [
      'High-Resolution Master Cover Artwork (4000x4000px)',
      'Digital Streaming Platform (DSP) Compliant Web Exports',
      'Typography & Color Palette Guidelines Sheet',
      'Layered Source Assets (PSD / Vector PDF)'
    ],
    priceUsd: 950,
    billingType: 'Per-Release',
    revisionLimit: 2,
    turnaroundDays: 3,
    isActive: true,
    targetAudience: 'Artist',
    createdAt: '2024-02-15T00:00:00Z',
    updatedAt: '2025-01-10T00:00:00Z'
  },
  {
    id: 'pkg-motion-suite',
    category: 'Motion Design & Video',
    name: 'Spatial 3D Motion & Visualizer Suite',
    tier: 'Flagship / Custom',
    description: 'Cinematic 3D kinetic typography, animated release visualizers, and spatial title loops formatted for TikTok, Reels, YouTube Shorts, and venue screens.',
    deliverables: [
      '3x 9:16 Kinetic Motion Teasers (1080x1920 60FPS)',
      '1x 16:9 4K YouTube Visualizer Loop (3840x2160)',
      'Animated Monogram & Transparent Alpha Logo Bug',
      'Broadcast Master ProRes 422 QuickTime Deliverables'
    ],
    priceUsd: 2600,
    billingType: 'One-Time',
    revisionLimit: 3,
    turnaroundDays: 7,
    isActive: true,
    targetAudience: 'Both',
    createdAt: '2024-04-01T00:00:00Z',
    updatedAt: '2025-02-01T00:00:00Z'
  },
  {
    id: 'pkg-brand-monolith',
    category: 'Brand Identity System',
    name: 'Monolith Brand Identity Operating System',
    tier: 'Flagship / Custom',
    description: 'Complete strategic brand design system including logomark architectures, custom typographic hierarchy, color science, iconography, and multi-channel style manual.',
    deliverables: [
      'Primary, Secondary, Monogram & Icon Vectors (SVG, EPS, PDF)',
      '40-Page Comprehensive Brand Guidelines Book (Print & Interactive Web PDF)',
      'Color Space Specification (Pantone, CMYK, RGB, HEX)',
      'Digital Stationery & Signature Suite',
      'Social Media Master Component Kit'
    ],
    priceUsd: 5500,
    billingType: 'One-Time',
    revisionLimit: 4,
    turnaroundDays: 14,
    isActive: true,
    targetAudience: 'Brand',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2025-02-05T00:00:00Z'
  },
  {
    id: 'pkg-biz-corporate',
    category: 'Business & Corporate Creative',
    name: 'Corporate Identity & Pitch Collateral Suite',
    tier: 'Professional',
    description: 'High-stakes corporate presentation decks, official executive letterheads, legal contract styling, and premium NFC business card assets.',
    deliverables: [
      'Executive Investor & Client Pitch Deck (Figma & PDF)',
      'Official Letterhead, Invoice & Receipt System Templates',
      'NFC Business Card Print Ready Vectors (Spot UV / Foil specs)',
      'Digital Presentation Layout Kit'
    ],
    priceUsd: 2200,
    billingType: 'One-Time',
    revisionLimit: 3,
    turnaroundDays: 6,
    isActive: true,
    targetAudience: 'Brand',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2025-01-18T00:00:00Z'
  },
  {
    id: 'pkg-exec-retainer',
    category: 'Executive Creative Retainer',
    name: 'Dedicated Studio Production Retainer',
    tier: 'Flagship / Custom',
    description: 'Monthly priority creative direction and production pipeline allocation. Includes dedicated lead producer, accelerated 48h turnarounds, and direct Slack/channel collaboration.',
    deliverables: [
      'Up to 40 Hours of Dedicated Studio Creative Direction & Execution',
      'Priority 48-Hour Rapid Delivery on Single Creatives',
      'Unlimited Minor Iterations & Revisions',
      'Weekly Production Pipeline Review & Asset Staging',
      'Full Access to KeedoHub Private Production Vault'
    ],
    priceUsd: 4500,
    billingType: 'Monthly Retainer',
    revisionLimit: -1, // Unlimited
    turnaroundDays: 2,
    isActive: true,
    targetAudience: 'Both',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2025-02-10T00:00:00Z'
  }
];

export const INITIAL_MOTION_PROJECTS: MotionProjectSpec[] = [
  {
    id: 'mot-proj-01',
    workspaceId: 'ws-sariyah-artist',
    releaseId: 'rel-01',
    title: 'Monochrome State — 9:16 Kinetic Video Teaser & Canvas',
    aspectRatio: '9:16 Vertical Story',
    deliverableType: 'Spotify Canvas Loop',
    audioFileName: 'Monochrome_State_Hook_Preview.wav',
    audioDurationSeconds: 15,
    intendedVideoDurationSeconds: 15,
    visualDirection: 'Minimalist high-contrast monochrome with rhythmic typography transient sync at 120 BPM',
    referenceLinks: ['https://instagram.com/sariyahcole'],
    storyboardNotes: 'Frame 1-3: Glitch character intro -> Frame 4-8: Title expansion with optical push-in -> Frame 9-15: Out Now release dates and audio wave pulse',
    stage: 'Client Review',
    isClientPublished: true,
    clientFeedback: 'Approved the initial cut, please ensure the artist moniker appears clearly in upper third safe zone.',
    internalProductionNotes: 'Ensure 1080x1920 60FPS render with H.264 profile high and stereo AAC 320kbps audio stems.',
    currentVersion: 'v1.2',
    previewKeyframeUrl: '/src/assets/images/vinyl_press_mockup_1792791744149.jpg',
    exportSpecs: {
      fps: 60,
      resolution: '1080x1920',
      codec: 'ProRes 422 / H.264',
      aspectRatio: '9:16'
    },
    createdAt: '2026-10-15T10:00:00Z',
    updatedAt: '2026-10-24T16:00:00Z'
  },
  {
    id: 'mot-proj-02',
    workspaceId: 'ws-lyrical-ent',
    releaseId: 'rel-03',
    title: 'Black Slate (Visual EP) — Spatial Monolith Title Sequence',
    aspectRatio: '16:9 Landscape',
    deliverableType: 'Music Visualizer',
    audioFileName: 'Black_Slate_Soundtrack_Excerpt.wav',
    audioDurationSeconds: 30,
    intendedVideoDurationSeconds: 30,
    visualDirection: '3D spatial letterforms drifting over textured slate rock with anamorphic lens flares',
    storyboardNotes: 'Intro sequence for YouTube premiere and broadcast promotion',
    stage: 'In Production',
    isClientPublished: false,
    internalProductionNotes: 'Awaiting 4K color grade pass from Jordan K.',
    currentVersion: 'v1.0',
    exportSpecs: {
      fps: 60,
      resolution: '3840x2160',
      codec: 'ProRes 4444',
      aspectRatio: '16:9'
    },
    createdAt: '2026-10-20T11:00:00Z',
    updatedAt: '2026-10-23T14:00:00Z'
  }
];



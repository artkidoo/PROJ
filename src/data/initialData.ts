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
  BrandGuidelinesData 
} from '../types';

export const INITIAL_ARTISTS: Artist[] = [
  {
    id: 'art-01',
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
    createdAt: '2026-02-01T10:00:00Z'
  },
  {
    id: 'rel-02',
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
  }
];

export const INITIAL_TASKS: OperationTask[] = [
  {
    id: 'tsk-01',
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

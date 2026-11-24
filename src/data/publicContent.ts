/**
 * KEEDOHUB — Public Creative Agency Content
 * All creative showcases and indicative packages are grounded as studio concepts/samples
 * unless explicitly backed by published live Firestore data.
 */
import vinylPressMockup from '../assets/images/vinyl_press_mockup_1792791744149.jpg';
import lyricalBrandStationery from '../assets/images/lyrical_ent_brand_stationery_1792793391733.jpg';
import artistShowcasePortrait from '../assets/images/artist_showcase_portrait_1792791744296.jpg';
import lyricalStudioHero from '../assets/images/lyrical_ent_studio_hero_1792791743831.jpg';
import motionVisualizerStage from '../assets/images/motion_visualizer_stage_1795183779858.jpg';
import brandIdentitySystem from '../assets/images/brand_identity_system_1795183778885.jpg';
import creativeDirectorStudio from '../assets/images/creative_director_studio_1795183778524.jpg';
import artistEditorialPortraitTwo from '../assets/images/artist_editorial_portrait_two_1795183778275.jpg';

export const STUDIO_MEDIA = {
  vinylPressMockup,
  lyricalBrandStationery,
  artistShowcasePortrait,
  lyricalStudioHero,
  motionVisualizerStage,
  brandIdentitySystem,
  creativeDirectorStudio,
  artistEditorialPortraitTwo,
};

export interface PublicService {
  id: string;
  title: string;
  description: string;
  category: 'Direction' | 'Brand' | 'Design' | 'Music' | 'Motion' | 'Production';
  audience: 'Artists' | 'Brands & Companies' | 'Artists & Brands';
  deliverables: string[];
  turnaround: string;
}

export const PUBLIC_SERVICES: PublicService[] = [
  {
    id: 'creative-direction',
    title: 'Creative Direction',
    description: 'Concept architecture, visual worldbuilding, art direction, and cohesive creative supervision across releases and brand launches.',
    category: 'Direction',
    audience: 'Artists & Brands',
    deliverables: ['Visual manifesto & moodboards', 'Art direction decks', 'On-set photography & video supervision'],
    turnaround: 'Custom scope',
  },
  {
    id: 'brand-identity',
    title: 'Brand Identity',
    description: 'Distinctive logo architecture, typographic hierarchies, colour systems, and scalable visual identity manuals.',
    category: 'Brand',
    audience: 'Brands & Companies',
    deliverables: ['Primary & secondary mark suite', 'Typography & colour specifications', 'Comprehensive brand guidelines'],
    turnaround: '7–14 business days',
  },
  {
    id: 'graphic-design',
    title: 'Graphic Design',
    description: 'Editorial print layouts, exhibition posters, key art compositions, and precision multi-format visual communication.',
    category: 'Design',
    audience: 'Artists & Brands',
    deliverables: ['Editorial posters & key visuals', 'Print-ready & digital artwork', 'Custom icon & grid systems'],
    turnaround: '5–10 business days',
  },
  {
    id: 'music-artwork',
    title: 'Music Artwork',
    description: 'Single, EP, and album cover systems paired with physical vinyl sleeves, tracklist layouts, and streaming visuals.',
    category: 'Music',
    audience: 'Artists',
    deliverables: ['Cover art master files', 'Vinyl & physical gatefold packaging', 'DSP & streaming canvas graphics'],
    turnaround: '5–10 business days',
  },
  {
    id: 'artist-visual-identity',
    title: 'Artist Visual Identity',
    description: 'Cohesive aesthetic positioning, press portraiture direction, custom wordmarks, and era-defining creative language for musicians.',
    category: 'Music',
    audience: 'Artists',
    deliverables: ['Artist monogram & wordmark', 'Press kit & visual lookbook', 'Era colour & photography language'],
    turnaround: '7–14 business days',
  },
  {
    id: 'creative-content-production',
    title: 'Creative Content Production',
    description: 'Studio photography direction, visual storytelling series, lookbook imagery, and tactile production assets built for modern channels.',
    category: 'Production',
    audience: 'Artists & Brands',
    deliverables: ['Studio shoot direction notes', 'Retouched editorial stills', 'Multi-aspect social visual library'],
    turnaround: '7–12 business days',
  },
  {
    id: 'motion-graphics-animation',
    title: 'Motion Graphics and Animation',
    description: 'Kinetic typography, bespoke audio-reactive visualizers, stage screen installations, and animated identity reveals.',
    category: 'Motion',
    audience: 'Artists & Brands',
    deliverables: ['Animated logo stings', 'Looping stage & canvas visuals', 'Kinetic typographic teasers'],
    turnaround: '7–14 business days',
  },
  {
    id: 'promotional-creative-materials',
    title: 'Promotional Creative Materials',
    description: 'Announcement artwork, tour and exhibition graphics, press banners, and coordinated launch visual toolkits.',
    category: 'Design',
    audience: 'Artists & Brands',
    deliverables: ['Launch & tour key visuals', 'Press & venue display templates', 'Multi-channel promo assets'],
    turnaround: '5–7 business days',
  },
  {
    id: 'business-documents-collateral',
    title: 'Business Documents and Branded Collateral',
    description: 'Executive pitch decks, proposals, contracts, media kits, letterheads, and cohesive corporate stationery suites.',
    category: 'Brand',
    audience: 'Brands & Companies',
    deliverables: ['Letterheads & executive stationery', 'Structured proposal & contract layouts', 'Company profile & pitch decks'],
    turnaround: '5–10 business days',
  },
];

export interface PortfolioItem {
  id: string;
  title: string;
  client: string;
  category: 'music' | 'brand' | 'motion' | 'web';
  discipline: string;
  year: string;
  description: string;
  directionNotes: string;
  deliverables: string[];
  image: string;
  sample: boolean;
}

export const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: 'p1',
    title: 'Monolith Vinyl Master & Release Suite',
    client: 'LYRICAL ENT (Sample Concept)',
    category: 'music',
    discipline: 'Music Artwork & Packaging',
    year: '2026',
    description: 'Tactile 33⅓ RPM vinyl gatefold master, single cover typography, and streaming visual suite.',
    directionNotes: 'Minimalist Swiss typographic pressure paired with heavyweight matte stock and crimson focal index markings to establish permanence across physical and digital shelves.',
    deliverables: ['Vinyl Gatefold Jacket & Center Label', 'Single Cover Architecture', 'Looping Streaming Canvas'],
    image: vinylPressMockup,
    sample: true,
  },
  {
    id: 'p2',
    title: 'Obsidian Identity & Swatch System',
    client: 'Studio Identity Architecture (Sample Concept)',
    category: 'brand',
    discipline: 'Brand Identity & Graphic Design',
    year: '2026',
    description: 'End-to-end tactile brand identity kit with embossed packaging, Pantone colour swatches, and Swiss grid monograph.',
    directionNotes: 'Constructed on a strict monochrome charcoal hierarchy punctuated by a calibrated vermilion accent card for unmistakable brand recognition in physical print.',
    deliverables: ['Embossed Packaging Architecture', 'Brand Guidelines Monograph', 'Custom Swatch & Type System'],
    image: brandIdentitySystem,
    sample: true,
  },
  {
    id: 'p3',
    title: 'Stage Kinetic Grid & Motion Light Study',
    client: 'KeedoHub Sound Labs (Sample Concept)',
    category: 'motion',
    discipline: 'Motion Graphics & Stage Visuals',
    year: '2026',
    description: 'Spatial lighting frames, audio-reactive truss geometry, and dark-room motion loops for live performance environments.',
    directionNotes: 'Built around stark geometric light planes and volumetric crimson haze to give live sets an architectural visual signature without cluttering the stage.',
    deliverables: ['Live Stage Frame Loops', 'Volumetric Title Sequences', 'Audio-Reactive Motion Kit'],
    image: motionVisualizerStage,
    sample: true,
  },
  {
    id: 'p4',
    title: 'Atelier Corporate Collateral & Stationery',
    client: 'Lyrical Entertainment Group (Sample Concept)',
    category: 'brand',
    discipline: 'Business Documents & Collateral',
    year: '2026',
    description: 'Executive letterhead suite, structured talent agreement layout, and tactile NFC studio credentials.',
    directionNotes: 'Designed so every operational document—from licensing contracts to agency briefs—carries the exact precision of the front-of-house identity.',
    deliverables: ['Executive Letterhead Suite', 'Legal & Licensing Templates', 'NFC Access Credentials'],
    image: lyricalBrandStationery,
    sample: true,
  },
  {
    id: 'p5',
    title: 'Noir Chiaroscuro Artist Visual Study',
    client: 'K-Flow Concept Study (Sample Concept)',
    category: 'music',
    discipline: 'Artist Visual Identity & Direction',
    year: '2026',
    description: 'High-contrast studio portraiture, press kit direction, and typographic promo key art built for release rollout.',
    directionNotes: 'Sculpted monochrome key light isolates posture and presence while maintaining immediate visual continuity from editorial press features to stage backdrops.',
    deliverables: ['Editorial Portraiture Direction', 'Press Media Kit Layout', 'Release Key Visual Suite'],
    image: artistShowcasePortrait,
    sample: true,
  },
  {
    id: 'p6',
    title: 'Studio Craft & Analog Print Proofing',
    client: 'KeedoHub Creative Desk (Sample Concept)',
    category: 'web',
    discipline: 'Creative Direction & Production',
    year: '2026',
    description: 'Calibration workflow bridging large-format editorial posters, matte sleeve proofs, and digital publishing layouts.',
    directionNotes: 'Demonstrates the agency’s unified visual standard across screen-calibrated compositions and physical ink-on-paper production proofs.',
    deliverables: ['Art Direction Moodboards', 'Print Color Proofing', 'Digital Editorial Layouts'],
    image: creativeDirectorStudio,
    sample: true,
  },
];

export interface ArtistProfile {
  id: string;
  name: string;
  genre: string;
  origin: string;
  bio: string;
  visualFocus: string;
  featuredRelease: string;
  image: string;
  sample: boolean;
}

export const ARTISTS: ArtistProfile[] = [
  {
    id: 'kflow',
    name: 'KAYODE OLUWASEUN (K-FLOW)',
    genre: 'Afrobeats / Alternative Hip-Hop',
    origin: 'Lagos / London',
    bio: 'Studio concept artist profile showcasing monochrome chiaroscuro portraiture, custom monogram typography, and vinyl-ready release direction.',
    visualFocus: 'High-contrast film portraiture, stark Swiss sleeve typography, and minimal crimson accent framing.',
    featuredRelease: 'Monolith (Single Concept)',
    image: artistShowcasePortrait,
    sample: true,
  },
  {
    id: 'amara-vance',
    name: 'AMARA VANCE',
    genre: 'Alt-R&B / Electronic Soul',
    origin: 'London',
    bio: 'Studio concept vocalist profile engineered around architectural stage lighting, subtle warm rim portraiture, and cohesive visual worldbuilding.',
    visualFocus: 'Sculpted tungsten edge light, kinetic stage loops, and stripped-back editorial lookbooks.',
    featuredRelease: 'Quiet Static (EP Concept)',
    image: artistEditorialPortraitTwo,
    sample: true,
  },
];

export interface ReleaseItem {
  id: string;
  artist: string;
  title: string;
  format: string;
  date: string;
  category: string;
  cover: string;
  notes: string;
  links: { label: string; url: string }[];
}

export const RELEASES: ReleaseItem[] = [
  {
    id: 'r1',
    artist: 'KAYODE OLUWASEUN (K-FLOW)',
    title: 'Monolith (Concept Release)',
    format: 'Single · Vinyl & Digital Concept',
    date: '2026-03-14',
    category: 'Afrobeats',
    cover: vinylPressMockup,
    notes: 'Sample cover master paired with streaming canvas and press kit layout.',
    links: [],
  },
  {
    id: 'r2',
    artist: 'AMARA VANCE',
    title: 'Nocturne Spatial Loops',
    format: 'Visual EP Concept',
    date: '2026-04-02',
    category: 'Electronic Soul',
    cover: motionVisualizerStage,
    notes: 'Stage lighting installation and audio-reactive visualizer package.',
    links: [],
  },
];

export interface BlogPost {
  id: string;
  title: string;
  artist: string;
  category: 'Creative Direction' | 'Brand Systems' | 'Music & Visuals' | 'Motion & Production';
  date: string;
  readTime: string;
  excerpt: string;
  image: string;
  content: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'b1',
    title: 'Designing a Release Identity That Travels Beyond the Cover',
    artist: 'KeedoHub Direction Desk',
    category: 'Music & Visuals',
    date: '2026-01-10',
    readTime: '4 min read',
    excerpt: 'How a coherent visual grammar carries a musical project from a 3000px square cover to stage screens and print sleeves.',
    image: vinylPressMockup,
    content: 'A release identity needs to work far beyond the square cover frame. Begin with a clear visual premise rooted in the sound itself, then establish the typographic scale, photographic treatment, and colour restraint that allow that premise to stretch across mediums.\n\nThe goal is never to stamp an identical image onto every surface. Rather, it is to build a recognizable visual world where an announcement poster, a vinyl inner sleeve, a 15-second streaming loop, and a stage lighting cue all unmistakably belong to the same artistic chapter.\n\nWhen artists and creative directors plan these variations before production locks, every deliverable reinforces the work instead of competing for attention.',
  },
  {
    id: 'b2',
    title: 'From Concept to Print: Why Branded Collateral Defines Authority',
    artist: 'KeedoHub Brand Desk',
    category: 'Brand Systems',
    date: '2026-01-22',
    readTime: '5 min read',
    excerpt: 'Executive proposals, licensing contracts, and stationery suites are often where serious partners judge your craft first.',
    image: brandIdentitySystem,
    content: 'Corporate and studio collateral lives in high-stakes moments: a partnership pitch deck, a label recording agreement, or an executive summary sitting on a decision-maker’s desk. Yet too many brands stop caring about design once the logo file is exported.\n\nBuilding executive-grade documents starts with information architecture: clear typographic hierarchy, disciplined margins, tactile paper weights for physical suites, and deliberate restraint in colour usage.\n\nWhen operational documents share the exact grid logic and visual poise of your public identity, credibility becomes effortless.',
  },
  {
    id: 'b3',
    title: 'Architectural Restraint in Motion Graphics and Live Stage Design',
    artist: 'KeedoHub Motion Desk',
    category: 'Motion & Production',
    date: '2026-02-08',
    readTime: '4 min read',
    excerpt: 'Using spatial rhythm, darkness, and calibrated light planes instead of visual noise in performance visuals.',
    image: motionVisualizerStage,
    content: 'Motion design is strongest when it leaves room to breathe. Across live stage backdrops and digital canvas loops, relentless animation quickly fatigues the viewer and buries the artist or product beneath visual clutter.\n\nAt KeedoHub, we approach motion like architecture in time: disciplined camera velocity, monochrome shadows punctuated by a single focal accent colour, and typographic pacing calibrated to tempo rather than arbitrary transitions.',
  },
  {
    id: 'b4',
    title: 'Bridging Studio Craft With an Organized Production System',
    artist: 'KeedoHub Operations Desk',
    category: 'Creative Direction',
    date: '2026-02-19',
    readTime: '4 min read',
    excerpt: 'Why great creative work breaks down in scattered threads—and how a shared production room preserves creative clarity.',
    image: creativeDirectorStudio,
    content: 'Creative ambition rarely stalls because of a lack of ideas; it stalls in fragmented feedback, misplaced file versions, and unclear approval states.\n\nPairing our agency practice with the KeedoHub Creative OS keeps briefs, internal studio reviews, client deliverables, revision notes, and final master files anchored in one structured space. Clients spend less time chasing files and more time shaping the work.',
  },
];

export interface PricingPackage {
  id: string;
  name: string;
  audience: 'Artist' | 'Brand';
  tier: string;
  priceLabel: string;
  deliverables: string[];
  revisions: string;
  turnaround: string;
  summary: string;
}

export const PRICING_PACKAGES: PricingPackage[] = [
  {
    id: 'artist-essential',
    name: 'Artist Essential',
    audience: 'Artist',
    tier: 'Essential',
    priceLabel: 'Indicative scope — custom quote on enquiry',
    summary: 'Focused release identity and cover system for singles and visual introductions.',
    deliverables: ['Single cover artwork master', 'Promotional announcement visuals', 'Streaming canvas graphics'],
    revisions: '2 rounds',
    turnaround: '5 business days',
  },
  {
    id: 'artist-professional',
    name: 'Artist Professional',
    audience: 'Artist',
    tier: 'Professional',
    priceLabel: 'Indicative scope — custom quote on enquiry',
    summary: 'Complete era identity, EP/album packaging, press visual direction, and motion suite.',
    deliverables: ['Album or EP cover & vinyl system', 'Artist visual identity & wordmark kit', 'Motion visualizer & teaser kit', 'Full promo graphic suite'],
    revisions: '3 rounds',
    turnaround: '10–14 business days',
  },
  {
    id: 'brand-essential',
    name: 'Brand Essential',
    audience: 'Brand',
    tier: 'Essential',
    priceLabel: 'Indicative scope — custom quote on enquiry',
    summary: 'Targeted identity refinement and core visual rules for emerging brands.',
    deliverables: ['Primary & secondary logo refinement', 'Typography & colour guidelines', 'Core stationery card layout'],
    revisions: '2 rounds',
    turnaround: '7 business days',
  },
  {
    id: 'brand-professional',
    name: 'Brand & Business System',
    audience: 'Brand',
    tier: 'Professional',
    priceLabel: 'Indicative scope — custom quote on enquiry',
    summary: 'Comprehensive visual identity architecture paired with business collateral and pitch templates.',
    deliverables: ['Full brand identity manual', 'Executive document & proposal suite', 'Print stationery & NFC/ID layouts', 'Source vector & production files'],
    revisions: '3 rounds',
    turnaround: '14 business days',
  },
];

export const FAQS: { q: string; a: string; category: string }[] = [
  {
    category: 'Agency & Process',
    q: 'How does KeedoHub approach a creative engagement?',
    a: 'Every project starts with brief intake and creative direction alignment. Once scope is approved, our team produces deliverables through internal quality checks, publishes review proofs inside your private workspace, processes structured revision rounds, and delivers final master files.',
  },
  {
    category: 'Services',
    q: 'What core creative services do you deliver?',
    a: 'We deliver Creative Direction, Brand Identity, Graphic Design, Music Artwork, Artist Visual Identity, Creative Content Production, Motion Graphics & Animation, Promotional Creative Materials, and Business Documents & Branded Collateral.',
  },
  {
    category: 'Workspaces',
    q: 'What is the difference between Artist OS and Brand OS workspaces?',
    a: 'Every client account receives one private unified workspace tailored to its client type: Artist accounts unlock Music & Releases and Content Engine workflows; Brand accounts unify Brand Identity Systems, Business Documents, commercial collateral, and Asset Libraries alongside Active Projects and Creative Requests.',
  },
  {
    category: 'Workspaces',
    q: 'How do clients get access to a private workspace?',
    a: 'You can create an account directly using Email/Password or Google Sign-In and select Artist or Brand. You can also send a public project brief on our Contact page before creating an account.',
  },
  {
    category: 'Projects & Revisions',
    q: 'How do revision rounds work inside a project?',
    a: 'Indicative packages include 2 to 3 structured revision rounds depending on scope. Inside your workspace, you review published deliverables, approve finished work, or submit timestamped feedback directly tied to that version.',
  },
  {
    category: 'Deliverables',
    q: 'What file formats are included in final handover?',
    a: 'Final handovers provide production-ready print and digital masters (CMYK print-ready PDFs, vector SVGs, high-resolution PNG/TIFF artwork, vertical and 16:9 motion renders, and organized editable templates or source files as scoped).',
  },
  {
    category: 'Pricing',
    q: 'How are pricing and quotes confirmed?',
    a: 'Because creative deliverables vary between a single cover system and a full multi-format corporate collateral suite, quotes are confirmed against your brief prior to production.',
  },
  {
    category: 'Services',
    q: 'Can you expand or modernize an existing brand identity?',
    a: 'Yes. We frequently audit existing marks and guidelines, elevate typography and print production consistency, and build complete executive document and promotional systems around your core identity.',
  },
];

export const STUDIO_PILLARS = [
  {
    number: '01',
    title: 'Direction Before Decoration',
    detail: 'Every colour choice, typeface, and photographic frame serves an articulated creative premise rather than passing visual trends.',
  },
  {
    number: '02',
    title: 'Craft Across Mediums',
    detail: 'An identity only holds up when it works equally well on matte gatefold vinyl, an executive legal agreement, and a 60fps stage LED wall.',
  },
  {
    number: '03',
    title: 'Production Discipline',
    detail: 'Our private Creative OS keeps briefs, internal QA, client proofs, revision feedback, and final master handovers clean and accountable.',
  },
];

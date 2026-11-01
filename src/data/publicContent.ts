/**
 * KEEDOHUB â€” Public Website Content (Phase 1)
 */
import vinylPressMockup from '../assets/images/vinyl_press_mockup_1792791744149.jpg';
import lyricalBrandStationery from '../assets/images/lyrical_ent_brand_stationery_1792793391733.jpg';
import artistShowcasePortrait from '../assets/images/artist_showcase_portrait_1792791744296.jpg';
import lyricalStudioHero from '../assets/images/lyrical_ent_studio_hero_1792791743831.jpg';

export interface PublicService { id: string; title: string; description: string; category: string; }
export const PUBLIC_SERVICES: PublicService[] = [
  { id: 'brand-identity', title: 'Brand Identity and Logo Systems', description: 'Vector logo architectures, brand guidelines, colour systems and identity toolkits.', category: 'Brand' },
  { id: 'corporate', title: 'Corporate Documents and Collateral', description: 'Executive letterheads, contracts, proposals, pitch decks and stationery suites.', category: 'Brand' },
  { id: 'music-artwork', title: 'Music Artwork and Artist Branding', description: 'Album and single cover systems, artist identity and visual language.', category: 'Music' },
  { id: 'release-campaigns', title: 'Music Release Campaigns', description: 'End-to-end release planning, asset production and promotional rollout.', category: 'Music' },
  { id: 'social-marketing', title: 'Social Media and Marketing Design', description: 'Campaign graphics, ad creatives and social content systems.', category: 'Marketing' },
  { id: 'motion', title: 'Motion Graphics and Animation', description: 'Soundwave visualizers, stage graphics and animated brand elements.', category: 'Motion' },
  { id: 'streaming', title: 'Streaming Platform Graphics', description: 'Canvas, profile and platform-specific assets for DSPs.', category: 'Music' },
  { id: 'web-blog', title: 'Websites and Blog Publishing', description: 'Editorial sites and blog publishing workflows.', category: 'Web' },
  { id: 'visual-production', title: 'Creative Design and Visual Production', description: 'Photography direction, print and digital production.', category: 'Production' },
];

export interface PortfolioItem { id: string; title: string; client: string; category: 'music'|'brand'|'motion'|'web'; description: string; image: string; sample: boolean; }
export const PORTFOLIO_ITEMS: PortfolioItem[] = [
  { id: 'p1', title: 'Monolith Vinyl Master & Release Suite', client: 'LYRICAL ENT (sample)', category: 'music', description: 'Vinyl press artwork, streaming canvas and single cover architecture.', image: vinylPressMockup, sample: true },
  { id: 'p2', title: 'Atelier Brand Stationery & Corporate Suite', client: 'Lyrical Entertainment Group (sample)', category: 'brand', description: 'Executive letterhead, legal contract layout and NFC identity cards.', image: lyricalBrandStationery, sample: true },
  { id: 'p3', title: 'Noir Cinematic Artist Roster Campaign', client: 'KAYODE OLUWASEUN (K-FLOW) (sample)', category: 'music', description: 'High-contrast photography, billboard campaign and press media kit.', image: artistShowcasePortrait, sample: true },
  { id: 'p4', title: 'Sound Labs Audio Acoustic Identity', client: 'KeedoHub Sound Labs (sample)', category: 'motion', description: 'Soundwave animation, stage visualizers and motion graphics loop.', image: lyricalStudioHero, sample: true },
];

export interface ArtistProfile { id: string; name: string; genre: string; bio: string; image: string; }
export const ARTISTS: ArtistProfile[] = [
  { id: 'kflow', name: 'KAYODE OLUWASEUN (K-FLOW)', genre: 'Afrobeats / Hip-Hop', bio: 'Sample artist profile showcasing visual identity and release rollout.', image: artistShowcasePortrait },
];

export interface ReleaseItem { id: string; artist: string; title: string; date: string; category: string; cover: string; links: { label: string; url: string }[]; }
export const RELEASES: ReleaseItem[] = [
  { id: 'r1', artist: 'KAYODE OLUWASEUN (K-FLOW)', title: 'Monolith (Single)', date: '2026-03-14', category: 'Afrobeats', cover: vinylPressMockup, links: [{ label: 'Spotify', url: '#' }, { label: 'Apple Music', url: '#' }] },
];


export interface BlogPost { id: string; title: string; artist: string; category: string; date: string; excerpt: string; image: string; content: string; }
export const BLOG_POSTS: BlogPost[] = [
  { id: 'b1', title: 'Designing a Release Identity That Travels', artist: 'KeedoHub Studio', category: 'Design', date: '2026-01-10', excerpt: 'How a coherent visual system carries a release from cover art to stage.', image: lyricalStudioHero, content: 'Sample article content. Replace with real editorial copy when connected to Blogger.' },
  { id: 'b2', title: 'From Concept to Print: Corporate Collateral', artist: 'KeedoHub Studio', category: 'Brand', date: '2026-01-22', excerpt: 'Building executive-grade documents that feel considered and on-brand.', image: lyricalBrandStationery, content: 'Sample article content. Replace with real editorial copy when connected to Blogger.' },
];

export interface PricingPackage { id: string; name: string; audience: 'Artist'|'Brand'|'Both'; tier: string; priceLabel: string; deliverables: string[]; revisions: string; turnaround: string; }
export const PRICING_PACKAGES: PricingPackage[] = [
  { id: 'artist-essential', name: 'Artist Essential', audience: 'Artist', tier: 'Essential', priceLabel: 'Sample pricing â€” contact for quote', deliverables: ['Single cover artwork', 'Social media kit', 'Streaming canvas'], revisions: '2 rounds', turnaround: '5 business days' },
  { id: 'artist-professional', name: 'Artist Professional', audience: 'Artist', tier: 'Professional', priceLabel: 'Sample pricing â€” contact for quote', deliverables: ['Album/EP cover system', 'Artist branding kit', 'Motion visualizer', 'Release campaign assets'], revisions: '3 rounds', turnaround: '10 business days' },
  { id: 'brand-essential', name: 'Brand Essential', audience: 'Brand', tier: 'Essential', priceLabel: 'Sample pricing â€” contact for quote', deliverables: ['Logo refinement', 'Basic brand guidelines', 'Business card'], revisions: '2 rounds', turnaround: '7 business days' },
  { id: 'brand-professional', name: 'Brand Professional', audience: 'Brand', tier: 'Professional', priceLabel: 'Sample pricing â€” contact for quote', deliverables: ['Full brand identity system', 'Corporate document suite', 'Stationery', 'Brand guidelines PDF'], revisions: '3 rounds', turnaround: '14 business days' },
];

export const FAQS: { q: string; a: string; category: string }[] = [
  { category: 'General', q: 'How does KeedoHub work?', a: 'We discover your needs, plan creative direction, produce deliverables, review with you, then deliver final assets.' },
  { category: 'General', q: 'What services are available?', a: 'Brand identity, corporate collateral, music artwork, release campaigns, social marketing, motion, streaming graphics, websites and visual production.' },
  { category: 'Account', q: 'How do clients register?', a: 'Clients sign in with Google and are granted access to a private workspace after verification.' },
  { category: 'Projects', q: 'What are typical timelines?', a: 'Timelines depend on scope; sample packages list indicative turnaround windows.' },
  { category: 'Projects', q: 'How many revisions are included?', a: 'Each package specifies a revision limit; additional rounds can be scoped.' },
  { category: 'Deliverables', q: 'What file formats are delivered?', a: 'Print-ready and digital formats appropriate to each deliverable, plus source files where applicable.' },
  { category: 'Payments', q: 'How are payments handled?', a: 'Payment processing is configured per engagement; contact us to discuss terms.' },
  { category: 'Artists', q: 'Do you handle full release campaigns?', a: 'Yes, from artwork through promotional assets and rollout planning.' },
  { category: 'Brand', q: 'Can you work with existing brand guidelines?', a: 'Yes, we align to and extend existing systems.' },
  { category: 'Web', q: 'Do you build and publish blogs?', a: 'Yes, websites and blog publishing are part of our services.' },
];

export const TESTIMONIALS: { quote: string; name: string; role: string; sample: boolean }[] = [
  { quote: 'Sample testimonial placeholder â€” replace with verified client feedback.', name: 'Sample Client', role: 'Artist', sample: true },
];

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LYRICAL ENT — Creative Template Library Data
 * 60+ Production-Ready Design Templates across 15 Brand Categories
 */

export interface CreativeTemplate {
  id: string;
  title: string;
  category: 
    | 'Brand Launch'
    | 'Pre-Launch Campaigns'
    | 'Launch Day Designs'
    | 'Post-Launch Campaigns'
    | 'Music Promotion'
    | 'Artist Branding'
    | 'Social Media Content'
    | 'Holiday and Celebration Designs'
    | 'Company Announcements'
    | 'Business Promotion'
    | 'Press and Media'
    | 'Event Promotion'
    | 'Motion Graphics'
    | 'Quotes and Motivational Designs'
    | 'Custom Design Packs';
  aspectRatio: '1:1 Square' | '9:16 Vertical Story' | '16:9 Landscape' | '4:5 Portrait' | 'Print / Poster';
  style: 
    | 'Editorial' 
    | 'Cinematic' 
    | 'Minimalist' 
    | 'Underground' 
    | 'Urban Street' 
    | 'High Fashion' 
    | 'Typographic' 
    | 'Documentary'
    | 'Grainy Film'
    | 'Spotlight'
    | 'Collage'
    | 'Concert Poster'
    | 'Brutalist'
    | 'Experimental';
  headline: string;
  subtext: string;
  artistName: string;
  tagline: string;
  badgeText?: string;
  bgTheme?: 'black' | 'charcoal' | 'pitch' | 'cream' | 'crimson' | 'silver';
  fontFamily?: 'serif' | 'sans' | 'mono' | 'display';
  accentColor?: string;
  imageUrl?: string;
  isFavorite?: boolean;
}

export const MASTER_CREATIVE_TEMPLATES: CreativeTemplate[] = [
  // ================= 1. BRAND LAUNCH (4 templates) =================
  {
    id: 'tpl-bl-01',
    title: 'Monolith Label Inception Poster',
    category: 'Brand Launch',
    aspectRatio: 'Print / Poster',
    style: 'Underground',
    headline: 'LYRICAL ENT SOUND LABS',
    subtext: 'ANALOG FIDELITY · DIGITAL DISRUPTION · EST. 2024',
    artistName: 'FOUNDING ROSTER',
    tagline: 'LONDON · NEW YORK · LAGOS',
    badgeText: 'OFFICIAL CHARTER',
    bgTheme: 'black',
    fontFamily: 'mono',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-bl-02',
    title: 'Minimalist Label Manifesto',
    category: 'Brand Launch',
    aspectRatio: '1:1 Square',
    style: 'Minimalist',
    headline: 'ARCHITECTURE OF SOUND',
    subtext: 'COMMITTED TO PURE UNCOMPROMISING SONIC ARTISTRY',
    artistName: 'LYRICAL ENT EXECUTIVE',
    tagline: 'GLOBAL MUSIC ALLIANCE',
    badgeText: 'MANIFESTO 01',
    bgTheme: 'pitch',
    fontFamily: 'serif',
    accentColor: '#D4D4D4'
  },
  {
    id: 'tpl-bl-03',
    title: 'Cinematic Grand Opening Billboard',
    category: 'Brand Launch',
    aspectRatio: '16:9 Landscape',
    style: 'Cinematic',
    headline: 'THE NEXT DISPENSATION IN SOUND',
    subtext: 'GLOBAL HEADQUARTERS & ATELIER OPENING WORLDWIDE',
    artistName: 'EXECUTIVE SUITE',
    tagline: 'STREAM THE FUTURE',
    badgeText: 'NOW LIVE',
    bgTheme: 'charcoal',
    fontFamily: 'sans',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-bl-04',
    title: 'Editorial Noir Brand Story Cover',
    category: 'Brand Launch',
    aspectRatio: '9:16 Vertical Story',
    style: 'Editorial',
    headline: 'THE NEW MONOCHROME ORDER',
    subtext: 'WHY LYRICAL ENT IS REDEFINING INDEPENDENT RECORD LABELS',
    artistName: 'LYRICAL ENT ARCHIVE',
    tagline: 'SWIPE UP TO EXPLORE',
    badgeText: 'SPECIAL REPORT',
    bgTheme: 'black',
    fontFamily: 'serif',
    accentColor: '#A3A3A3'
  },

  // ================= 2. PRE-LAUNCH CAMPAIGNS (5 templates) =================
  {
    id: 'tpl-pre-01',
    title: 'Cinematic Pre-Save Countdown',
    category: 'Pre-Launch Campaigns',
    aspectRatio: '9:16 Vertical Story',
    style: 'Cinematic',
    headline: '7 DAYS UNTIL MIDNIGHT',
    subtext: 'PRE-SAVE ON SPOTIFY & APPLE MUSIC FOR EXCLUSIVE B-SIDES',
    artistName: 'SARIYAH COLE',
    tagline: 'DROP DATE: FRIDAY OCT 31',
    badgeText: 'PRE-SAVE NOW',
    bgTheme: 'pitch',
    fontFamily: 'sans',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-pre-02',
    title: 'Underground Studio Stems Teaser',
    category: 'Pre-Launch Campaigns',
    aspectRatio: '1:1 Square',
    style: 'Grainy Film',
    headline: 'STUDIO REEL 04 / STEMS',
    subtext: 'ANALOG MASTER TAPE TRANSFERS AT ABBEY ROAD',
    artistName: 'SARIYAH COLE',
    tagline: 'ALBUM PREVIEW INCOMING',
    badgeText: 'BEHIND THE SCENES',
    bgTheme: 'charcoal',
    fontFamily: 'mono',
    accentColor: '#E5E5E5'
  },
  {
    id: 'tpl-pre-03',
    title: 'Bold Anticipation Billboard Graphic',
    category: 'Pre-Launch Campaigns',
    aspectRatio: '16:9 Landscape',
    style: 'Typographic',
    headline: 'SOMETHING MONUMENTAL IS COMING',
    subtext: 'THE SOPHOMORE RECORD FROM THE ACCLAIMED VOCALIST',
    artistName: 'SARIYAH COLE',
    tagline: 'WORLDWIDE RELEASE IMMINENT',
    badgeText: 'ANTICIPATION',
    bgTheme: 'black',
    fontFamily: 'display',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-pre-04',
    title: 'High-Fashion Teaser Portrait',
    category: 'Pre-Launch Campaigns',
    aspectRatio: '4:5 Portrait',
    style: 'High Fashion',
    headline: 'SILENCE IS THE ANTHEM',
    subtext: 'OFFICIAL ARTWORK REVEAL · THIS THURSDAY 6PM GMT',
    artistName: 'SARIYAH COLE',
    tagline: 'STAY CONNECTED',
    badgeText: 'TEASER 02',
    bgTheme: 'black',
    fontFamily: 'serif',
    accentColor: '#CCCCCC'
  },
  {
    id: 'tpl-pre-05',
    title: 'WhatsApp Pre-Order Audio Flyer',
    category: 'Pre-Launch Campaigns',
    aspectRatio: '1:1 Square',
    style: 'Urban Street',
    headline: 'PRE-ORDER VINYL & MERCH',
    subtext: 'LIMITED 500-PRESSING 180G AUDIOPHILE MONOCHROME VINYL',
    artistName: 'SARIYAH COLE',
    tagline: 'DIRECT EXCLUSIVE LINK',
    badgeText: 'LIMITED EDITION',
    bgTheme: 'pitch',
    fontFamily: 'mono',
    accentColor: '#FFFFFF'
  },

  // ================= 3. LAUNCH DAY DESIGNS (5 templates) =================
  {
    id: 'tpl-ld-01',
    title: 'Official "OUT NOW" Worldwide Poster',
    category: 'Launch Day Designs',
    aspectRatio: '1:1 Square',
    style: 'Editorial',
    headline: 'MONOCHROME STATE',
    subtext: 'THE DEBUT 10-TRACK STUDIO ALBUM · 24-BIT MASTER',
    artistName: 'SARIYAH COLE',
    tagline: 'AVAILABLE EVERYWHERE TODAY',
    badgeText: 'OUT NOW',
    bgTheme: 'black',
    fontFamily: 'serif',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-ld-02',
    title: 'High-Fashion Music Video Premiere',
    category: 'Launch Day Designs',
    aspectRatio: '16:9 Landscape',
    style: 'High Fashion',
    headline: 'OFFICIAL 4K MUSIC VIDEO',
    subtext: 'DIRECTED BY OJO ABDULKAREEM · SHOT ON 35MM NOIR',
    artistName: 'SARIYAH COLE',
    tagline: 'WATCH ON YOUTUBE',
    badgeText: 'PREMIERE',
    bgTheme: 'pitch',
    fontFamily: 'sans',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-ld-03',
    title: 'Vertical Story "Out Everywhere" Release',
    category: 'Launch Day Designs',
    aspectRatio: '9:16 Vertical Story',
    style: 'Cinematic',
    headline: 'THE ALBUM IS YOURS',
    subtext: 'STREAM ON APPLE MUSIC · SPOTIFY · AUDIOMACK · TIDAL',
    artistName: 'SARIYAH COLE',
    tagline: 'LINK IN BIO TO LISTEN',
    badgeText: 'RELEASE DAY',
    bgTheme: 'charcoal',
    fontFamily: 'display',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-ld-04',
    title: 'Urban Street Listening Station Graphic',
    category: 'Launch Day Designs',
    aspectRatio: 'Print / Poster',
    style: 'Urban Street',
    headline: 'STREET BROADCAST 01',
    subtext: 'POP-UP AUDIO EXPERIENCE IN SOHO & IKEJA TODAY',
    artistName: 'SARIYAH COLE',
    tagline: 'HOSTED BY LYRICAL ENT',
    badgeText: 'LIVE TODAY',
    bgTheme: 'black',
    fontFamily: 'mono',
    accentColor: '#E5E5E5'
  },
  {
    id: 'tpl-ld-05',
    title: 'Producer & Credits Master Card',
    category: 'Launch Day Designs',
    aspectRatio: '1:1 Square',
    style: 'Typographic',
    headline: 'ENGINEERED FOR HEAVENLY MONITORS',
    subtext: 'MIXED & MASTERED IN ANALOG TAPE DOMAIN',
    artistName: 'SARIYAH COLE & GUEST PRODUCERS',
    tagline: 'CREDITS & LINER NOTES',
    badgeText: 'CREDITS',
    bgTheme: 'pitch',
    fontFamily: 'mono',
    accentColor: '#D4D4D4'
  },

  // ================= 4. POST-LAUNCH CAMPAIGNS (4 templates) =================
  {
    id: 'tpl-pl-01',
    title: 'Week One Milestone & Streaming Record',
    category: 'Post-Launch Campaigns',
    aspectRatio: '1:1 Square',
    style: 'Editorial',
    headline: '1,000,000 STREAMS WORLDWIDE',
    subtext: 'FIRST WEEK MILESTONE ON ALL DIGITAL STREAMING PLATFORMS',
    artistName: 'SARIYAH COLE',
    tagline: 'THANK YOU TO ALL LISTENERS',
    badgeText: 'MILESTONE',
    bgTheme: 'black',
    fontFamily: 'serif',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-pl-02',
    title: 'Fan Appreciation Quote Story',
    category: 'Post-Launch Campaigns',
    aspectRatio: '9:16 Vertical Story',
    style: 'Cinematic',
    headline: '"WE FELT EVERY FREQUENCY."',
    subtext: 'THANK YOU FOR EMBRACING THIS SONIC JOURNEY',
    artistName: 'SARIYAH COLE',
    tagline: 'CONTINUE STREAMING TODAY',
    badgeText: 'FAN APPRECIATION',
    bgTheme: 'pitch',
    fontFamily: 'sans',
    accentColor: '#CCCCCC'
  },
  {
    id: 'tpl-pl-03',
    title: 'Official Editorial Review Spotlight',
    category: 'Post-Launch Campaigns',
    aspectRatio: '16:9 Landscape',
    style: 'Minimalist',
    headline: '"A TIMELESS MASTERPIECE IN MONOCHROME"',
    subtext: 'CRITICAL ACCLAIM FROM GLOBAL MUSIC CRITICS',
    artistName: 'GLOBAL PRESS REVIEW',
    tagline: 'READ ON PITCHFORK & ROLLING STONE',
    badgeText: 'CRITIC REVIEW',
    bgTheme: 'charcoal',
    fontFamily: 'serif',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-pl-04',
    title: 'Album Anniversary Commemorative Card',
    category: 'Post-Launch Campaigns',
    aspectRatio: '1:1 Square',
    style: 'Documentary',
    headline: '365 DAYS OF MONOCHROME STATE',
    subtext: 'CELEBRATING ONE FULL YEAR OF CULTURAL IMPACT',
    artistName: 'SARIYAH COLE',
    tagline: 'COLLECTORS RE-ISSUE SOON',
    badgeText: 'ANNIVERSARY',
    bgTheme: 'black',
    fontFamily: 'mono',
    accentColor: '#A3A3A3'
  },

  // ================= 5. MUSIC PROMOTION (5 templates) =================
  {
    id: 'tpl-mp-01',
    title: 'Audiophile Vinyl Packaging Mockup Graphic',
    category: 'Music Promotion',
    aspectRatio: '1:1 Square',
    style: 'Underground',
    headline: 'LIMITED 180G VINYL PRESSING',
    subtext: 'HEAVYWEIGHT MONOCHROME GATEFOLD SLEEVE WITH LYRIC BOOKLET',
    artistName: 'SARIYAH COLE',
    tagline: 'ORDER AT SHOP.LYRICALENT.COM',
    badgeText: 'VINYL EDITION',
    bgTheme: 'pitch',
    fontFamily: 'mono',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-mp-02',
    title: 'Editorial Single Showcase Card',
    category: 'Music Promotion',
    aspectRatio: '4:5 Portrait',
    style: 'Editorial',
    headline: 'MIDNIGHT ARCHITECTURE',
    subtext: 'THE LEAD SINGLE · ACOUSTIC GUITAR & ANALOG DRUMS',
    artistName: 'SARIYAH COLE',
    tagline: 'STREAM ON REPEAT',
    badgeText: 'LEAD SINGLE',
    bgTheme: 'black',
    fontFamily: 'serif',
    accentColor: '#E5E5E5'
  },
  {
    id: 'tpl-mp-03',
    title: 'Spotify & Apple Music Audio Banner',
    category: 'Music Promotion',
    aspectRatio: '16:9 Landscape',
    style: 'Cinematic',
    headline: 'STREAM THE OFFICIAL TRACKLIST',
    subtext: 'FEATURED ON NEW MUSIC FRIDAY & R&B REWIND PLAYLISTS',
    artistName: 'SARIYAH COLE',
    tagline: 'ADD TO YOUR FAVORITES',
    badgeText: 'PLAYLIST PICK',
    bgTheme: 'charcoal',
    fontFamily: 'sans',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-mp-04',
    title: 'Vertical Lyric Highlight Reel Card',
    category: 'Music Promotion',
    aspectRatio: '9:16 Vertical Story',
    style: 'Typographic',
    headline: '"WE PAINTED NIGHTS IN NOIR"',
    subtext: 'TRACK 03 · VELVET SKYLINE · PRODUCED BY LYRICAL ENT',
    artistName: 'SARIYAH COLE',
    tagline: 'HEAR THE FULL TRACK',
    badgeText: 'LYRICS',
    bgTheme: 'black',
    fontFamily: 'display',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-mp-05',
    title: 'Remix & Spatial Audio Drop Card',
    category: 'Music Promotion',
    aspectRatio: '1:1 Square',
    style: 'Experimental',
    headline: 'DOLBY ATMOS SPATIAL MIX',
    subtext: 'EXPERIENCE 3D IMMERSIVE SOUND ON APPLE MUSIC',
    artistName: 'SARIYAH COLE & AUDIO LAB',
    tagline: 'HEADPHONES RECOMMENDED',
    badgeText: 'SPATIAL AUDIO',
    bgTheme: 'pitch',
    fontFamily: 'mono',
    accentColor: '#CCCCCC'
  },

  // ================= 6. ARTIST BRANDING (4 templates) =================
  {
    id: 'tpl-ab-01',
    title: 'Official Roster Signature Profile',
    category: 'Artist Branding',
    aspectRatio: '4:5 Portrait',
    style: 'High Fashion',
    headline: 'SARIYAH COLE',
    subtext: 'COMPOSER · VOCALIST · LYRICAL ENT EXCLUSIVE ARTIST',
    artistName: 'ARTIST ROSTER',
    tagline: 'LONDON · LOS ANGELES',
    badgeText: 'SIGNED ARTIST',
    bgTheme: 'black',
    fontFamily: 'serif',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-ab-02',
    title: 'Documentary Studio Session Frame',
    category: 'Artist Branding',
    aspectRatio: '16:9 Landscape',
    style: 'Documentary',
    headline: 'THE CREATIVE PROCESS',
    subtext: 'ANALOG TAPE TRACKING SESSIONS AT OLYMPIC STUDIOS',
    artistName: 'SARIYAH COLE IN SESSION',
    tagline: 'ARCHIVAL PHOTOGRAPHY',
    badgeText: 'SESSION ARCHIVE',
    bgTheme: 'charcoal',
    fontFamily: 'mono',
    accentColor: '#E5E5E5'
  },
  {
    id: 'tpl-ab-03',
    title: 'Minimalist Electronic Press Kit (EPK) Banner',
    category: 'Artist Branding',
    aspectRatio: '1:1 Square',
    style: 'Minimalist',
    headline: 'OFFICIAL 2026 EPK',
    subtext: 'BIOGRAPHY · HIGH-RES PRESS SHOTS · DISCOGRAPHY · RIDERS',
    artistName: 'MANAGEMENT DISPATCH',
    tagline: 'PRESS@LYRICALENT.COM',
    badgeText: 'PRESS ASSETS',
    bgTheme: 'pitch',
    fontFamily: 'sans',
    accentColor: '#D4D4D4'
  },
  {
    id: 'tpl-ab-04',
    title: 'Social Identity Vertical Header',
    category: 'Artist Branding',
    aspectRatio: '9:16 Vertical Story',
    style: 'Cinematic',
    headline: 'VOICE OF THE NEW ERA',
    subtext: 'EXPLORE RELEASES, TOUR DATES, AND EXCLUSIVE CONTENT',
    artistName: 'SARIYAH COLE',
    tagline: 'FOLLOW ON ALL SOCIALS',
    badgeText: 'OFFICIAL PROFILE',
    bgTheme: 'black',
    fontFamily: 'display',
    accentColor: '#FFFFFF'
  },

  // ================= 7. SOCIAL MEDIA CONTENT (5 templates) =================
  {
    id: 'tpl-sm-01',
    title: 'Instagram Carousel Title Slide',
    category: 'Social Media Content',
    aspectRatio: '1:1 Square',
    style: 'Editorial',
    headline: '5 REASONS ANALOG STILL RULES',
    subtext: 'HOW LYRICAL ENT PRESERVES TAPE WARMTH IN DIGITAL RELEASES',
    artistName: 'LABEL ESSAYS',
    tagline: 'SWIPE FOR DETAILS →',
    badgeText: 'CAROUSEL 01/05',
    bgTheme: 'black',
    fontFamily: 'serif',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-sm-02',
    title: 'TikTok & Reels Cover Card',
    category: 'Social Media Content',
    aspectRatio: '9:16 Vertical Story',
    style: 'Urban Street',
    headline: 'VOCAL STEM BREAKDOWN',
    subtext: 'HOW WE CREATED THE 12-PART HARMONY ON "MONOCHROME"',
    artistName: 'STUDIO TUTORIAL',
    tagline: 'USE THIS SOUND ON TIKTOK',
    badgeText: 'SOUND LAB',
    bgTheme: 'pitch',
    fontFamily: 'mono',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-sm-03',
    title: 'YouTube Community Announcement Card',
    category: 'Social Media Content',
    aspectRatio: '16:9 Landscape',
    style: 'Cinematic',
    headline: 'NEW LIVE PERFORMANCE THIS SUNDAY',
    subtext: 'ACOUSTIC SESSION LIVE STREAM ON YOUTUBE · 8PM GMT',
    artistName: 'SARIYAH COLE TRIO',
    tagline: 'SET YOUR REMINDERS',
    badgeText: 'LIVESTREAM',
    bgTheme: 'charcoal',
    fontFamily: 'sans',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-sm-04',
    title: 'Fan Q&A Session Dispatch',
    category: 'Social Media Content',
    aspectRatio: '1:1 Square',
    style: 'Typographic',
    headline: 'ASK SARIYAH ANYTHING',
    subtext: 'DROP YOUR QUESTIONS IN THE REPLIES FOR OUR DISCORD AMA',
    artistName: 'FAN ENGAGEMENT',
    tagline: 'LIVE THIS THURSDAY',
    badgeText: 'AMA SESSION',
    bgTheme: 'black',
    fontFamily: 'display',
    accentColor: '#CCCCCC'
  },
  {
    id: 'tpl-sm-05',
    title: 'Weekly Release Radar Story',
    category: 'Social Media Content',
    aspectRatio: '9:16 Vertical Story',
    style: 'High Fashion',
    headline: 'LABEL RADAR: WEEK 42',
    subtext: 'CURATED CURRENTS FROM THE LYRICAL ENT ROSTER',
    artistName: 'CURATED BY LE',
    tagline: 'LISTEN TO THE PLAYLIST',
    badgeText: 'WEEKLY RADAR',
    bgTheme: 'pitch',
    fontFamily: 'sans',
    accentColor: '#E5E5E5'
  },

  // ================= 8. HOLIDAY AND CELEBRATION (5 templates) =================
  {
    id: 'tpl-hc-01',
    title: 'Happy New Year Global Editorial',
    category: 'Holiday and Celebration Designs',
    aspectRatio: '1:1 Square',
    style: 'Editorial',
    headline: 'HAPPY NEW YEAR 2026',
    subtext: 'MAY THE COMING YEAR BE FILLED WITH HARMONY & NEW CREATION',
    artistName: 'FROM THE LYRICAL ENT FAMILY',
    tagline: 'NEW FREQUENCIES AWAIT',
    badgeText: 'SEASON GREETINGS',
    bgTheme: 'black',
    fontFamily: 'serif',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-hc-02',
    title: 'Nigerian Independence Day Commemoration',
    category: 'Holiday and Celebration Designs',
    aspectRatio: 'Print / Poster',
    style: 'Typographic',
    headline: 'NIGERIA AT 66 · OCT 01',
    subtext: 'CELEBRATING RESILIENCE, AFRO-BEATS GENIUS & UNSTOPPABLE CULTURE',
    artistName: 'LYRICAL ENT AFRICA',
    tagline: 'PEACE, UNITY & FREEDOM',
    badgeText: 'OCTOBER 01',
    bgTheme: 'pitch',
    fontFamily: 'display',
    accentColor: '#D4D4D4'
  },
  {
    id: 'tpl-hc-03',
    title: 'World Music Day Celebration Poster',
    category: 'Holiday and Celebration Designs',
    aspectRatio: '16:9 Landscape',
    style: 'Underground',
    headline: 'WORLD MUSIC DAY',
    subtext: 'WHEREVER WORDS FAIL, SOUND CONQUERS BORDERS',
    artistName: 'GLOBAL CREATORS DAY',
    tagline: 'JUNE 21 · CELEBRATE SOUND',
    badgeText: 'JUNE 21',
    bgTheme: 'charcoal',
    fontFamily: 'mono',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-hc-04',
    title: 'International Women\'s Day Tribute',
    category: 'Holiday and Celebration Designs',
    aspectRatio: '9:16 Vertical Story',
    style: 'Cinematic',
    headline: 'WOMEN SHAPING THE SOUND',
    subtext: 'HONOURING THE PRODUCERS, WRITERS, AND ARTISTS WHO LEAD',
    artistName: 'LYRICAL ENT DIVERSITY',
    tagline: 'MARCH 08 · EMPOWER ART',
    badgeText: 'MARCH 08',
    bgTheme: 'black',
    fontFamily: 'serif',
    accentColor: '#E5E5E5'
  },
  {
    id: 'tpl-hc-05',
    title: 'Holiday Season Festive Noir Card',
    category: 'Holiday and Celebration Designs',
    aspectRatio: '1:1 Square',
    style: 'Minimalist',
    headline: 'WARM HOLIDAY WISHES',
    subtext: 'GRATITUDE TO OUR ARTISTS, PARTNERS, AND LISTENERS EVERYWHERE',
    artistName: 'EXECUTIVE COMMITTEE',
    tagline: 'PEACE & GOODWILL',
    badgeText: 'DECEMBER GREETINGS',
    bgTheme: 'pitch',
    fontFamily: 'serif',
    accentColor: '#FFFFFF'
  },

  // ================= 9. COMPANY ANNOUNCEMENTS (4 templates) =================
  {
    id: 'tpl-ca-01',
    title: 'Executive Corporate Dispatch',
    category: 'Company Announcements',
    aspectRatio: '16:9 Landscape',
    style: 'Minimalist',
    headline: 'STRATEGIC EXPANSION IN LAGOS',
    subtext: 'ESTABLISHING RECORDING ATELIERS & DISTRIBUTION HUB',
    artistName: 'CORPORATE AFFAIRS',
    tagline: 'READ OFFICIAL PRESS BRIEF',
    badgeText: 'LABEL UPDATE',
    bgTheme: 'black',
    fontFamily: 'mono',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-ca-02',
    title: 'New Executive Appointment Bulletin',
    category: 'Company Announcements',
    aspectRatio: '1:1 Square',
    style: 'Editorial',
    headline: 'A&R LEADERSHIP UPDATE',
    subtext: 'STRENGTHENING GLOBAL TALENT DISCOVERY & RECORDING STANDARDS',
    artistName: 'EXECUTIVE COMMITTEE',
    tagline: 'LYRICAL ENT LEADERSHIP',
    badgeText: 'APPOINTMENT',
    bgTheme: 'pitch',
    fontFamily: 'serif',
    accentColor: '#D4D4D4'
  },
  {
    id: 'tpl-ca-03',
    title: 'Studio Expansion Announcement Card',
    category: 'Company Announcements',
    aspectRatio: '4:5 Portrait',
    style: 'Documentary',
    headline: 'STUDIO A CONSOLE COMMISSIONED',
    subtext: 'VINTAGE NEVE 8068 CONSOLE RESTORATION COMPLETE',
    artistName: 'SOUND LABS DIVISION',
    tagline: 'ANALOG MASTERING LIVE',
    badgeText: 'FACILITIES',
    bgTheme: 'charcoal',
    fontFamily: 'mono',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-ca-04',
    title: 'Quarterly Shareholder & Label Brief',
    category: 'Company Announcements',
    aspectRatio: '9:16 Vertical Story',
    style: 'Typographic',
    headline: 'Q3 LABEL PERFORMANCE OVERVIEW',
    subtext: 'RECORD-BREAKING CATALOGUE STREAMS AND REVENUE GROWTH',
    artistName: 'INVESTOR RELATIONS',
    tagline: 'FULL REPORT AVAILABLE',
    badgeText: 'Q3 REPORT',
    bgTheme: 'black',
    fontFamily: 'display',
    accentColor: '#CCCCCC'
  },

  // ================= 10. BUSINESS PROMOTION (4 templates) =================
  {
    id: 'tpl-bp-01',
    title: 'Publishing & Sync Licensing Deck Graphic',
    category: 'Business Promotion',
    aspectRatio: '16:9 Landscape',
    style: 'Cinematic',
    headline: 'SYNC LICENSING FOR CINEMA & TV',
    subtext: 'WORLD-CLASS CATALOGUE READY FOR COMMERCIAL LICENSING',
    artistName: 'LYRICAL SYNC DIVISION',
    tagline: 'SYNC@LYRICALENT.COM',
    badgeText: 'SYNC CATALOGUE',
    bgTheme: 'pitch',
    fontFamily: 'sans',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-bp-02',
    title: 'Recording Studio Booking Banner',
    category: 'Business Promotion',
    aspectRatio: '1:1 Square',
    style: 'Underground',
    headline: 'BOOK STUDIO A & B SESSIONS',
    subtext: 'STATE-OF-THE-ART RECORDING WITH IN-HOUSE GRAMMY-LEVEL ENGINEERS',
    artistName: 'STUDIO BOOKINGS',
    tagline: 'RESERVE SESSIONS ONLINE',
    badgeText: 'FACILITIES',
    bgTheme: 'black',
    fontFamily: 'mono',
    accentColor: '#E5E5E5'
  },
  {
    id: 'tpl-bp-03',
    title: 'Distribution Services Promotion Card',
    category: 'Business Promotion',
    aspectRatio: '4:5 Portrait',
    style: 'Minimalist',
    headline: 'DIRECT-TO-PLATFORM DISTRIBUTION',
    subtext: 'ZERO LOSS COMPRESSION · FAST ROYALTIES · GLOBAL REACH',
    artistName: 'DISTRIBUTION HUB',
    tagline: 'INDEPENDENT ACCESS',
    badgeText: 'SERVICES',
    bgTheme: 'charcoal',
    fontFamily: 'serif',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-bp-04',
    title: 'Merchandise Collaboration Promo Card',
    category: 'Business Promotion',
    aspectRatio: '9:16 Vertical Story',
    style: 'High Fashion',
    headline: 'LYRICAL ATELIER CAPSULE 01',
    subtext: 'HEAVYWEIGHT OVERSIZED TEES & HOODIES IN JET BLACK',
    artistName: 'ATELIER MERCH',
    tagline: 'LIMITED PRODUCTION RUN',
    badgeText: 'MERCH DROP',
    bgTheme: 'pitch',
    fontFamily: 'sans',
    accentColor: '#CCCCCC'
  },

  // ================= 11. PRESS AND MEDIA (4 templates) =================
  {
    id: 'tpl-pm-01',
    title: 'Official Press Release Master Banner',
    category: 'Press and Media',
    aspectRatio: '16:9 Landscape',
    style: 'Editorial',
    headline: 'FOR IMMEDIATE RELEASE: ALBUM ANNOUNCEMENT',
    subtext: 'LYRICAL ENT CONFIRMS INTERNATIONAL TOUR DATES & DEBUT RECORD',
    artistName: 'PRESS DESK',
    tagline: 'MEDIA ASSETS ATTACHED',
    badgeText: 'PRESS RELEASE',
    bgTheme: 'black',
    fontFamily: 'serif',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-pm-02',
    title: 'Media Feature & Cover Story Card',
    category: 'Press and Media',
    aspectRatio: '1:1 Square',
    style: 'Documentary',
    headline: '"THE SOUNDTRACK TO MIDNIGHT"',
    subtext: 'IN-DEPTH PROFILE IN DAZED & CONFUSED MAGAZINE',
    artistName: 'SARIYAH COLE',
    tagline: 'ISSUE 142 COVER',
    badgeText: 'COVER STORY',
    bgTheme: 'charcoal',
    fontFamily: 'serif',
    accentColor: '#D4D4D4'
  },
  {
    id: 'tpl-pm-03',
    title: 'Broadcast Interview Quote Banner',
    category: 'Press and Media',
    aspectRatio: '9:16 Vertical Story',
    style: 'Cinematic',
    headline: '"WE MADE THIS FOR PURE ACOUSTIC TRUTH."',
    subtext: 'LIVE RADIO 1 INTERVIEW WITH GILLES PETERSON',
    artistName: 'BROADCAST TRANSCRIPT',
    tagline: 'LISTEN TO THE ARCHIVE',
    badgeText: 'BBC INTERVIEW',
    bgTheme: 'pitch',
    fontFamily: 'sans',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-pm-04',
    title: 'Press Accreditation & Access Pass',
    category: 'Press and Media',
    aspectRatio: 'Print / Poster',
    style: 'Typographic',
    headline: 'MEDIA CREDENTIALS · TOUR 2026',
    subtext: 'OFFICIAL PHOTO PIT & BACKSTAGE PRESS CLEARANCE',
    artistName: 'ACCREDITED JOURNALISTS ONLY',
    tagline: 'PRESS@LYRICALENT.COM',
    badgeText: 'PRESS PASS',
    bgTheme: 'black',
    fontFamily: 'mono',
    accentColor: '#E5E5E5'
  },

  // ================= 12. EVENT PROMOTION (4 templates) =================
  {
    id: 'tpl-ep-01',
    title: 'VIP Private Listening Session Invitation',
    category: 'Event Promotion',
    aspectRatio: '1:1 Square',
    style: 'Minimalist',
    headline: 'PRIVATE LISTENING SESSION',
    subtext: 'OLYMPIC STUDIOS · ADMISSION BY INVITATION ONLY',
    artistName: 'SARIYAH COLE & SPECIAL GUESTS',
    tagline: 'OCTOBER 24 · 7PM - 11PM',
    badgeText: 'STRICTLY RSVP',
    bgTheme: 'pitch',
    fontFamily: 'serif',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-ep-02',
    title: 'Headline Tour Concert Poster',
    category: 'Event Promotion',
    aspectRatio: 'Print / Poster',
    style: 'Concert Poster',
    headline: 'THE MONOCHROME WORLD TOUR',
    subtext: 'LONDON · PARIS · BERLIN · NEW YORK · TORONTO · LAGOS',
    artistName: 'SARIYAH COLE LIVE',
    tagline: 'TICKETS ON SALE FRIDAY 10AM',
    badgeText: 'WORLD TOUR 2026',
    bgTheme: 'black',
    fontFamily: 'display',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-ep-03',
    title: 'Festival Showcase Stage Graphic',
    category: 'Event Promotion',
    aspectRatio: '16:9 Landscape',
    style: 'Cinematic',
    headline: 'HEADLINING THE MIDNIGHT STAGE',
    subtext: 'LIVE AT MONTREUX JAZZ FESTIVAL 2026',
    artistName: 'LYRICAL ENT SHOWCASE',
    tagline: 'SATURDAY JULY 18',
    badgeText: 'FESTIVAL',
    bgTheme: 'charcoal',
    fontFamily: 'sans',
    accentColor: '#E5E5E5'
  },
  {
    id: 'tpl-ep-04',
    title: 'Pop-Up Store & Vinyl Signing Story',
    category: 'Event Promotion',
    aspectRatio: '9:16 Vertical Story',
    style: 'Urban Street',
    headline: 'POP-UP VINYL SIGNING',
    subtext: 'MEET SARIYAH COLE & COLLECT AN AUTOGRAPHED TEST PRESSING',
    artistName: 'SHOREDITCH HIGH ST',
    tagline: 'FIRST 100 ATTENDEES ONLY',
    badgeText: 'EXCLUSIVE EVENT',
    bgTheme: 'pitch',
    fontFamily: 'mono',
    accentColor: '#FFFFFF'
  },

  // ================= 13. MOTION GRAPHICS (4 templates) =================
  {
    id: 'tpl-mg-01',
    title: 'Cinematic Title Card Motion Sequence',
    category: 'Motion Graphics',
    aspectRatio: '16:9 Landscape',
    style: 'Cinematic',
    headline: 'A LYRICAL ENT MOTION PICTURE',
    subtext: 'CINEMATIC OPENING TITLE CARD FOR MUSIC RELEASES & VISUALS',
    artistName: 'DIRECTED BY STUDIO CREATIVE',
    tagline: 'MOTION PRESET: SLOW ZOOM',
    badgeText: 'MOTION TITLE',
    bgTheme: 'pitch',
    fontFamily: 'serif',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-mg-02',
    title: 'Glitch Beat Lyric Visualizer Card',
    category: 'Motion Graphics',
    aspectRatio: '9:16 Vertical Story',
    style: 'Experimental',
    headline: 'DYNAMIC BEAT TYPOGRAPHY',
    subtext: 'TEMPO-SYNCED GLITCH REVEALS FOR TIKTOK & INSTAGRAM REELS',
    artistName: 'BEAT SYNC PRESET',
    tagline: '120 BPM TIME CODE',
    badgeText: 'REELS MOTION',
    bgTheme: 'black',
    fontFamily: 'mono',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-mg-03',
    title: 'Countdown Clock Motion Overlay',
    category: 'Motion Graphics',
    aspectRatio: '1:1 Square',
    style: 'Typographic',
    headline: 'COUNTDOWN: 00:24:00',
    subtext: 'ANIMATED TICKING DIGITAL CHRONOMETER FOR PREMIERE COUNTDOWN',
    artistName: 'DROP WATCHER',
    tagline: 'PREMIERE IMMINENT',
    badgeText: 'CHRONO MOTION',
    bgTheme: 'charcoal',
    fontFamily: 'mono',
    accentColor: '#CCCCCC'
  },
  {
    id: 'tpl-mg-04',
    title: 'Parallax Monogram Signature Reveal',
    category: 'Motion Graphics',
    aspectRatio: '1:1 Square',
    style: 'Minimalist',
    headline: 'LYRICAL ENT MONOGRAM DYNAMICS',
    subtext: 'SMOOTH EASING ROTATION & LAYERED DEPTH ACCENT STAMP',
    artistName: 'OFFICIAL ANIMATION',
    tagline: 'BRAND LOGO MOTION',
    badgeText: 'LOGO MOTION',
    bgTheme: 'pitch',
    fontFamily: 'sans',
    accentColor: '#FFFFFF'
  },

  // ================= 14. QUOTES AND MOTIVATIONAL DESIGNS (4 templates) =================
  {
    id: 'tpl-qm-01',
    title: 'Sound Constitution Architectural Quote',
    category: 'Quotes and Motivational Designs',
    aspectRatio: '1:1 Square',
    style: 'Editorial',
    headline: '"FORM ALWAYS FOLLOWS SONIC STRUCTURE."',
    subtext: 'NEVER SACRIFICE RAW EMOTION FOR POLISHED CONFORMITY',
    artistName: 'OJO ABDULKAREEM',
    tagline: 'LYRICAL ENT PHILOSOPHY',
    badgeText: 'LABEL MOTTO',
    bgTheme: 'black',
    fontFamily: 'serif',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-qm-02',
    title: 'Minimalist Producer Studio Wisdom',
    category: 'Quotes and Motivational Designs',
    aspectRatio: '4:5 Portrait',
    style: 'Minimalist',
    headline: '"THE GREATEST INSTRUMENT IS WHAT YOU LEAVE OUT."',
    subtext: 'ON MINIMALISM, DYNAMICS, AND REST IN CONTEMPORARY MUSIC',
    artistName: 'STUDIO A ARCHIVES',
    tagline: 'PRODUCTION NOTE 07',
    badgeText: 'STUDIO AXIOM',
    bgTheme: 'pitch',
    fontFamily: 'serif',
    accentColor: '#D4D4D4'
  },
  {
    id: 'tpl-qm-03',
    title: 'Bold Street Typographic Statement',
    category: 'Quotes and Motivational Designs',
    aspectRatio: 'Print / Poster',
    style: 'Typographic',
    headline: 'SOUND CANNOT BE COMPROMISED.',
    subtext: 'LYRICAL ENT · INDEPENDENT RECORD LABEL · FOREVER DEVOTED',
    artistName: 'CREATIVE DIRECTOR',
    tagline: 'MANIFESTO SERIES',
    badgeText: 'STATEMENT',
    bgTheme: 'black',
    fontFamily: 'display',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-qm-04',
    title: 'Cinematic Midnight Reflection Quote',
    category: 'Quotes and Motivational Designs',
    aspectRatio: '9:16 Vertical Story',
    style: 'Cinematic',
    headline: '"MUSIC IS ARCHITECTURE IN TIME."',
    subtext: 'EXPLORING SPACE BETWEEN THE CHORDS AND BREATHS',
    artistName: 'SARIYAH COLE',
    tagline: 'FROM THE DIARY NOTES',
    badgeText: 'ARTIST REFLECTION',
    bgTheme: 'charcoal',
    fontFamily: 'sans',
    accentColor: '#CCCCCC'
  },

  // ================= 15. CUSTOM DESIGN PACKS (4 templates) =================
  {
    id: 'tpl-cd-01',
    title: 'Deluxe Album Rollout Master Pack',
    category: 'Custom Design Packs',
    aspectRatio: '1:1 Square',
    style: 'Editorial',
    headline: 'DELUXE 360 ROLLOUT PACK',
    subtext: 'INCLUDES COVER, POSTERS, STORIES, MERCH TAGS & TRACKLISTS',
    artistName: 'COMPLETE CAMPAIGN BUNDLE',
    tagline: '18 MATCHED ASSETS',
    badgeText: 'MASTER BUNDLE',
    bgTheme: 'black',
    fontFamily: 'serif',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-cd-02',
    title: 'Artist Launch Identity Suite',
    category: 'Custom Design Packs',
    aspectRatio: '4:5 Portrait',
    style: 'High Fashion',
    headline: 'ARTIST DEBUT SUITE',
    subtext: 'COMPREHENSIVE VISUAL SYSTEM FOR SIGNED TALENT ANNOUNCEMENTS',
    artistName: 'A&R TALENT PACK',
    tagline: 'COHESIVE AESTHETIC',
    badgeText: 'IDENTITY PACK',
    bgTheme: 'pitch',
    fontFamily: 'sans',
    accentColor: '#E5E5E5'
  },
  {
    id: 'tpl-cd-03',
    title: 'Tour & Festival Promotional Bundle',
    category: 'Custom Design Packs',
    aspectRatio: 'Print / Poster',
    style: 'Concert Poster',
    headline: 'LIVE TOUR MASTER KIT',
    subtext: 'VENUE POSTERS, TICKET BADGES, LED STAGE BACKGROUNDS & FLYERS',
    artistName: 'TOURING DIVISION',
    tagline: 'READY FOR STAGE PRINT',
    badgeText: 'TOUR PACK',
    bgTheme: 'charcoal',
    fontFamily: 'display',
    accentColor: '#FFFFFF'
  },
  {
    id: 'tpl-cd-04',
    title: 'Press & Media Electronic EPK Kit',
    category: 'Custom Design Packs',
    aspectRatio: '16:9 Landscape',
    style: 'Documentary',
    headline: 'ELECTRONIC PRESS MASTER KIT',
    subtext: 'ONE-SHEET, STATS BREAKDOWN, QUOTE CARDS & MEDIA LOGOS',
    artistName: 'PUBLIC RELATIONS PACK',
    tagline: 'ZIP ARCHIVE READY',
    badgeText: 'MEDIA KIT',
    bgTheme: 'black',
    fontFamily: 'mono',
    accentColor: '#D4D4D4'
  }
];

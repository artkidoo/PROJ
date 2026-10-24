/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LYRICAL ENT — Music Release Campaign Generator
 * Creates coordinated design sets based on release metadata
 */

import { ReleaseProject, CampaignDesign, CampaignCategory } from '../types/campaign';
import { CreativeTemplate } from '../data/creativeTemplatesData';
import { buildHonestDesignForTemplate } from './templateDesignBuilder';

interface DesignSeed {
  name: string;
  category: CampaignCategory;
  style: CreativeTemplate['style'];
  aspectRatio: CreativeTemplate['aspectRatio'];
  headlineType: 'title' | 'artist' | 'date' | 'countdown' | 'quote' | 'outnow' | 'custom';
  customHeadline?: string;
  taglineType: 'label' | 'artist' | 'genre' | 'link' | 'custom';
  customTagline?: string;
  badgeType: 'anticipation' | 'releaseday' | 'milestone' | 'custom';
  customBadge?: string;
}

const CAMPAIGN_SEEDS: DesignSeed[] = [
  // --- ANTICIPATION (8) ---
  {
    name: 'Minimal Editorial Announcement',
    category: 'Anticipation',
    style: 'Editorial',
    aspectRatio: '1:1 Square',
    headlineType: 'title',
    taglineType: 'artist',
    badgeType: 'anticipation'
  },
  {
    name: 'Cinematic Artist Portrait',
    category: 'Anticipation',
    style: 'Cinematic',
    aspectRatio: '4:5 Portrait',
    headlineType: 'artist',
    taglineType: 'genre',
    badgeType: 'anticipation'
  },
  {
    name: 'Bold Typographic Announcement',
    category: 'Anticipation',
    style: 'Typographic',
    aspectRatio: '16:9 Landscape',
    headlineType: 'title',
    taglineType: 'label',
    badgeType: 'anticipation'
  },
  {
    name: 'Urban Music Campaign',
    category: 'Anticipation',
    style: 'Urban Street',
    aspectRatio: '1:1 Square',
    headlineType: 'artist',
    taglineType: 'genre',
    badgeType: 'anticipation'
  },
  {
    name: 'Luxury Monochrome Story',
    category: 'Anticipation',
    style: 'High Fashion',
    aspectRatio: '9:16 Vertical Story',
    headlineType: 'title',
    taglineType: 'artist',
    badgeType: 'anticipation'
  },
  {
    name: 'Brutalist Teaser',
    category: 'Anticipation',
    style: 'Brutalist',
    aspectRatio: '1:1 Square',
    headlineType: 'countdown',
    taglineType: 'artist',
    badgeType: 'anticipation'
  },
  {
    name: 'Experimental Reveal',
    category: 'Anticipation',
    style: 'Experimental',
    aspectRatio: '1:1 Square',
    headlineType: 'title',
    taglineType: 'label',
    badgeType: 'anticipation'
  },
  {
    name: 'Release Information Poster',
    category: 'Anticipation',
    style: 'Documentary',
    aspectRatio: 'Print / Poster',
    headlineType: 'title',
    taglineType: 'artist',
    badgeType: 'anticipation'
  },

  // --- RELEASE DAY (7) ---
  {
    name: 'OUT NOW Editorial',
    category: 'Release Day',
    style: 'Editorial',
    aspectRatio: '1:1 Square',
    headlineType: 'outnow',
    taglineType: 'artist',
    badgeType: 'releaseday'
  },
  {
    name: 'Official Cover Reveal',
    category: 'Release Day',
    style: 'Cinematic',
    aspectRatio: '1:1 Square',
    headlineType: 'title',
    taglineType: 'artist',
    badgeType: 'releaseday'
  },
  {
    name: 'Streaming Link Banner',
    category: 'Release Day',
    style: 'Minimalist',
    aspectRatio: '16:9 Landscape',
    headlineType: 'outnow',
    taglineType: 'link',
    badgeType: 'releaseday'
  },
  {
    name: 'Music Video Premier',
    category: 'Release Day',
    style: 'High Fashion',
    aspectRatio: '16:9 Landscape',
    headlineType: 'custom',
    customHeadline: 'OFFICIAL MUSIC VIDEO',
    taglineType: 'link',
    badgeType: 'releaseday'
  },
  {
    name: 'Vertical Story Out Now',
    category: 'Release Day',
    style: 'Cinematic',
    aspectRatio: '9:16 Vertical Story',
    headlineType: 'outnow',
    taglineType: 'artist',
    badgeType: 'releaseday'
  },
  {
    name: 'Brutalist Release Day',
    category: 'Release Day',
    style: 'Brutalist',
    aspectRatio: '1:1 Square',
    headlineType: 'title',
    taglineType: 'artist',
    badgeType: 'releaseday'
  },
  {
    name: 'Editorial Release Poster',
    category: 'Release Day',
    style: 'Editorial',
    aspectRatio: 'Print / Poster',
    headlineType: 'title',
    taglineType: 'artist',
    badgeType: 'releaseday'
  },

  // --- POST-RELEASE (7) ---
  {
    name: 'Lyric Highlight',
    category: 'Post-Release',
    style: 'Typographic',
    aspectRatio: '1:1 Square',
    headlineType: 'quote',
    taglineType: 'artist',
    badgeType: 'milestone'
  },
  {
    name: 'Favorite Line Story',
    category: 'Post-Release',
    style: 'High Fashion',
    aspectRatio: '9:16 Vertical Story',
    headlineType: 'quote',
    taglineType: 'artist',
    badgeType: 'milestone'
  },
  {
    name: 'Streaming Reminder',
    category: 'Post-Release',
    style: 'Cinematic',
    aspectRatio: '4:5 Portrait',
    headlineType: 'custom',
    customHeadline: 'STILL STREAMING',
    taglineType: 'artist',
    badgeType: 'milestone'
  },
  {
    name: 'Milestone Announcement',
    category: 'Post-Release',
    style: 'Editorial',
    aspectRatio: '1:1 Square',
    headlineType: 'custom',
    customHeadline: '1M STREAMS',
    taglineType: 'artist',
    badgeType: 'milestone'
  },
  {
    name: 'Behind The Scenes',
    category: 'Post-Release',
    style: 'Documentary',
    aspectRatio: '16:9 Landscape',
    headlineType: 'custom',
    customHeadline: 'STUDIO ARCHIVE',
    taglineType: 'artist',
    badgeType: 'milestone'
  },
  {
    name: 'Thank You Graphic',
    category: 'Post-Release',
    style: 'Minimalist',
    aspectRatio: '1:1 Square',
    headlineType: 'custom',
    customHeadline: 'THANK YOU',
    taglineType: 'artist',
    badgeType: 'milestone'
  },
  {
    name: 'Live Session Reveal',
    category: 'Post-Release',
    style: 'Spotlight',
    aspectRatio: '16:9 Landscape',
    headlineType: 'custom',
    customHeadline: 'LIVE SESSION',
    taglineType: 'artist',
    badgeType: 'milestone'
  }
];

export function generateCampaignDesigns(project: ReleaseProject): Omit<CampaignDesign, 'id' | 'createdAt' | 'updatedAt'>[] {
  return CAMPAIGN_SEEDS.map((seed, index) => {
    // Build headline based on type
    let headline = '';
    switch (seed.headlineType) {
      case 'title': headline = project.songTitle.toUpperCase(); break;
      case 'artist': headline = project.artistName.toUpperCase(); break;
      case 'date': headline = project.releaseDate; break;
      case 'countdown': headline = 'COMING SOON'; break;
      case 'quote': headline = project.promoMessage || 'A NEW SOUND'; break;
      case 'outnow': headline = 'OUT NOW'; break;
      case 'custom': headline = seed.customHeadline || ''; break;
    }

    // Build subtext based on type
    let subtext = '';
    switch (seed.taglineType) {
      case 'label': subtext = 'LYRICAL ENT RECORDINGS'; break;
      case 'artist': subtext = project.artistName.toUpperCase(); break;
      case 'genre': subtext = project.genre.toUpperCase(); break;
      case 'link': subtext = project.streamingLink || 'LISTEN EVERYWHERE'; break;
      case 'custom': subtext = seed.customTagline || ''; break;
    }

    // Build badge based on type
    let badge = '';
    switch (seed.badgeType) {
      case 'anticipation': badge = 'COMING SOON'; break;
      case 'releaseday': badge = 'NEW RELEASE'; break;
      case 'milestone': badge = 'MILESTONE'; break;
      case 'custom': badge = seed.customBadge || ''; break;
    }

    // Create virtual template for builder
    const virtualTemplate: CreativeTemplate = {
      id: `vtpl-${seed.category.replace(' ', '-')}-${index}`,
      title: seed.name,
      category: 'Custom Design Packs', // Internal categorization
      aspectRatio: seed.aspectRatio,
      style: seed.style,
      headline,
      subtext,
      artistName: project.artistName,
      tagline: project.releaseType.toUpperCase(),
      badgeText: badge,
      bgTheme: 'black',
      accentColor: project.primaryColor,
      imageUrl: project.artistPhoto || project.coverArtwork
    };

    const canvasDesign = buildHonestDesignForTemplate(virtualTemplate);

    return {
      projectId: project.id,
      name: seed.name,
      templateId: virtualTemplate.id,
      canvasDesign,
      category: seed.category,
      exportPreset: seed.aspectRatio
    };
  });
}

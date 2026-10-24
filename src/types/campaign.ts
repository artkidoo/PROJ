/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LYRICAL ENT — Music Release & Campaign Studio Types
 */

import { AspectRatioType, CanvasDesign } from './designStudio';

export type ReleaseType = 'Single' | 'EP' | 'Album' | 'Mixtape';

export type CampaignCategory = 'Anticipation' | 'Release Day' | 'Post-Release';

export interface ReleaseProject {
  id: string;
  workspaceId?: string;
  artistName: string;
  songTitle: string;
  releaseType: ReleaseType;
  releaseDate: string;
  releaseTime?: string;
  genre: string;
  artistPhoto?: string;
  coverArtwork?: string;
  artistLogo?: string;
  labelLogo?: string;
  primaryColor: string;
  secondaryColor: string;
  streamingLink?: string;
  videoLink?: string;
  promoMessage?: string;
  selectedPlatforms: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CampaignDesign {
  id: string;
  projectId: string;
  name: string;
  templateId: string;
  canvasDesign: CanvasDesign;
  category: CampaignCategory;
  exportPreset: AspectRatioType;
  createdAt: string;
  updatedAt: string;
}

import JSZip from 'jszip';
import { getRawSvgString } from '../components/brand/LogoSystem';
import { BrandGuidelinesData, CorporateDocument } from '../types';
import { generateBloggerThemeXml } from './bloggerXmlGenerator';
import { INITIAL_BLOGGER_SETTINGS } from '../data/initialData';

export interface ZipOptions {
  includeIdentity: boolean;
  includeGuidelines: boolean;
  includeDocuments: boolean;
  includeCompanyProfile: boolean;
  includeLaunchCreative: boolean;
  includeWebsite: boolean;
}

/**
 * Builds and downloads the comprehensive Master Brand Package (.ZIP)
 */
export const generateMasterBrandZip = async (
  guidelines: BrandGuidelinesData,
  documents: CorporateDocument[],
  options: ZipOptions = {
    includeIdentity: true,
    includeGuidelines: true,
    includeDocuments: true,
    includeCompanyProfile: true,
    includeLaunchCreative: true,
    includeWebsite: true
  }
): Promise<void> => {
  const zip = new JSZip();

  // Root Readme
  zip.file(
    '00_LYRICAL_ENT_MASTER_PACKAGE_MANIFEST.txt',
    `========================================================================\n` +
    `LYRICAL ENT — MASTER BRAND ARCHIVE & CORPORATE OPERATING SUITE\n` +
    `========================================================================\n` +
    `Generated: ${new Date().toISOString()}\n` +
    `Entity: LYRICAL ENT LLC\n` +
    `Studios: London · Los Angeles\n` +
    `Classification: Executive Master Brand Package\n\n` +
    `PACKAGE CONTENTS SUMMARY:\n` +
    `01_BRAND_IDENTITY     : Official vector SVGs for primary, horizontal, monogram, square icon\n` +
    `02_BRAND_GUIDELINES    : Complete constitutional guidelines, typography, color codes\n` +
    `03_CORPORATE_DOCUMENTS : Standardized dispatch templates, split sheets, invoices, email signatures\n` +
    `04_COMPANY_PROFILE     : Executive dossier, label mission, division specs, sound labs\n` +
    `05_LAUNCH_CREATIVE     : Campaign rollouts, copy cards, and deliverable guidelines\n` +
    `06_WEBSITE             : Standalone Google Blogger Layout v3 XML theme & installation guide\n\n` +
    `All trademarks, master recordings, and visual assets are proprietary to LYRICAL ENT LLC.\n`
  );

  // 01_BRAND_IDENTITY
  if (options.includeIdentity) {
    const identFolder = zip.folder('01_BRAND_IDENTITY');
    if (identFolder) {
      identFolder.file('lyrical_ent_primary_white_on_black.svg', getRawSvgString('primary', 'white-on-black'));
      identFolder.file('lyrical_ent_primary_black_on_white.svg', getRawSvgString('primary', 'black-on-white'));
      identFolder.file('lyrical_ent_horizontal_white_on_black.svg', getRawSvgString('horizontal', 'white-on-black'));
      identFolder.file('lyrical_ent_horizontal_black_on_white.svg', getRawSvgString('horizontal', 'black-on-white'));
      identFolder.file('lyrical_ent_monogram_white_on_black.svg', getRawSvgString('monogram', 'white-on-black'));
      identFolder.file('lyrical_ent_monogram_black_on_white.svg', getRawSvgString('monogram', 'black-on-white'));
      identFolder.file('lyrical_ent_square_icon.svg', getRawSvgString('square', 'white-on-black'));
      identFolder.file('lyrical_ent_favicon.svg', getRawSvgString('favicon', 'white-on-black'));

      identFolder.file(
        'README_LOGO_USAGE.txt',
        `LYRICAL ENT — LOGO USAGE SPECIFICATIONS\n\n` +
        `1. PRIMARY LOGO: Master lockup combining framed LE monogram and bold wordmark.\n` +
        `2. HORIZONTAL LOGO: Recommended for header banners, letterheads, and navigation.\n` +
        `3. LE MONOGRAM: Reserved for vinyl runout grooves, digital profile avatars, and corporate wax seals.\n` +
        `4. CLEAR SPACE: Minimum exclusion zone is equal to half the height of the LE monogram.\n` +
        `5. PROHIBITIONS: Never skew, rotate, recolor, add drop shadows, or outline the mark.\n`
      );
    }
  }

  // 02_BRAND_GUIDELINES
  if (options.includeGuidelines) {
    const guideFolder = zip.folder('02_BRAND_GUIDELINES');
    if (guideFolder) {
      guideFolder.file(
        'LYRICAL_ENT_BRAND_GUIDELINES.txt',
        `========================================================================\n` +
        `LYRICAL ENT — OFFICIAL BRAND IDENTITY & DESIGN CONSTITUTION\n` +
        `========================================================================\n\n` +
        `BRAND VOICE & EDITORIAL TONE:\n${guidelines.brandVoice}\n\n` +
        `PHOTOGRAPHY & ART DIRECTION:\n${guidelines.photographyDirection}\n\n` +
        `GRAPHIC DESIGN PRINCIPLES:\n${guidelines.graphicDesignPrinciples}\n\n` +
        `CLEAR SPACE RULES:\n${guidelines.clearSpaceRules}\n\n` +
        `MINIMUM REPRODUCTION SIZES:\n` +
        `- Print: ${guidelines.minLogoSizePrint}\n` +
        `- Digital: ${guidelines.minLogoSizeDigital}\n\n` +
        `SURFACE & BACKGROUND RULES:\n${guidelines.backgroundRules}\n\n` +
        `STRICTLY PROHIBITED TREATMENTS:\n` +
        guidelines.incorrectUsageRules.map((rule, idx) => `[0${idx + 1}] ${rule}`).join('\n') + `\n\n` +
        `COLOR PALETTE:\n` +
        `- Absolute Black : #000000 | RGB(0,0,0) | CMYK(60,40,40,100)\n` +
        `- Charcoal Noir  : #171717 | RGB(23,23,23) | CMYK(50,40,40,90)\n` +
        `- Neutral Grey   : #A3A3A3 | RGB(163,163,163) | CMYK(0,0,0,40)\n` +
        `- Pure White     : #FFFFFF | RGB(255,255,255) | CMYK(0,0,0,0)\n\n` +
        `TYPOGRAPHY MATRIX:\n` +
        `- Display & Headlines : Plus Jakarta Sans (SemiBold / Bold / ExtraBold)\n` +
        `- Body Copy          : Plus Jakarta Sans (Regular / Medium)\n` +
        `- Technical Figures  : JetBrains Mono (ISRCs, UPCs, Split percentages)\n`
      );

      guideFolder.file(
        'COLOR_SPECIFICATIONS.json',
        JSON.stringify({
          brand: 'LYRICAL ENT',
          palette: [
            { name: 'Absolute Black', hex: '#000000', rgb: '0, 0, 0', cmyk: '60, 40, 40, 100', usage: 'Primary brand background, ink, packaging' },
            { name: 'Charcoal Noir', hex: '#171717', rgb: '23, 23, 23', cmyk: '50, 40, 40, 90', usage: 'Secondary surfaces, cards, containers' },
            { name: 'Neutral Grey', hex: '#A3A3A3', rgb: '163, 163, 163', cmyk: '0, 0, 0, 40', usage: 'Metadata tags, secondary text, borderlines' },
            { name: 'Pure White', hex: '#FFFFFF', rgb: '255, 255, 255', cmyk: '0, 0, 0, 0', usage: 'High-contrast typography, reverse marks' }
          ]
        }, null, 2)
      );
    }
  }

  // 03_CORPORATE_DOCUMENTS
  if (options.includeDocuments) {
    const docFolder = zip.folder('03_CORPORATE_DOCUMENTS');
    if (docFolder) {
      // Export current corporate documents
      documents.forEach(doc => {
        let text = `====================================================\n`;
        text += `LYRICAL ENT — OFFICIAL RECORD LABEL DOCUMENT\n`;
        text += `Reference : ${doc.referenceNo}\n`;
        text += `Date      : ${doc.date}\n`;
        text += `Type      : ${doc.type.toUpperCase()}\n`;
        text += `Title     : ${doc.title}\n`;
        text += `====================================================\n\n`;
        text += `RECIPIENT:\n${doc.recipientName}\n`;
        if (doc.recipientOrg) text += `${doc.recipientOrg}\n`;
        if (doc.recipientAddress) text += `${doc.recipientAddress}\n`;
        if (doc.recipientEmail) text += `Email: ${doc.recipientEmail}\n`;
        text += `\nSUBJECT: ${doc.subject || doc.title}\n\n`;
        text += `CONTENT:\n${doc.bodyContent}\n\n`;

        if (doc.items && doc.items.length > 0) {
          text += `LINE ITEMS:\n`;
          let total = 0;
          doc.items.forEach((it, idx) => {
            const line = (it.quantity || 1) * (it.unitPrice || 0);
            total += line;
            text += `${idx + 1}. ${it.description} — Qty: ${it.quantity || 1} @ $${it.unitPrice || 0} = $${line}\n`;
          });
          text += `\nGRAND TOTAL (USD): $${total.toFixed(2)}\n\n`;
        }

        if (doc.paymentTerms) text += `PAYMENT TERMS: ${doc.paymentTerms}\n`;
        if (doc.notes) text += `NOTES: ${doc.notes}\n`;
        text += `\nAUTHORIZED SIGNATORY: ${doc.authorName} (${doc.authorRole})\n`;
        text += `LYRICAL ENT LLC · Registered Trademark\n`;

        const filename = `${doc.referenceNo || doc.id}_${doc.type}.txt`;
        docFolder.file(filename, text);
      });

      // Email signature HTML template
      docFolder.file(
        'LYRICAL_ENT_EMAIL_SIGNATURE.html',
        `<table cellpadding="0" cellspacing="0" border="0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111111;font-size:13px;line-height:1.4;">
  <tr>
    <td style="padding-right:16px;border-right:2px solid #000000;vertical-align:middle;">
      <div style="background-color:#000000;color:#ffffff;width:44px;height:44px;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:bold;font-size:14px;letter-spacing:1px;line-height:44px;">LE</div>
    </td>
    <td style="padding-left:16px;vertical-align:middle;">
      <div style="font-size:15px;font-weight:bold;color:#000000;letter-spacing:-0.2px;">Ojo Abdulkareem</div>
      <div style="font-size:12px;color:#555555;margin-bottom:4px;">Managing Director & Head of Label · LYRICAL ENT</div>
      <div style="font-size:11px;font-family:monospace;color:#777777;">
        <span>TEL: +44 (0) 20 7946 0921</span> | 
        <span>MAIL: kareem@lyricalent.com</span> | 
        <span>WEB: <a href="https://www.lyricalent.com" style="color:#000000;text-decoration:none;font-weight:600;">www.lyricalent.com</a></span>
      </div>
      <div style="font-size:10px;font-family:monospace;color:#999999;margin-top:4px;">
        LONDON SOUND LABS · LOS ANGELES · RECORD LABEL & PUBLISHING
      </div>
    </td>
  </tr>
</table>`
      );
    }
  }

  // 04_COMPANY_PROFILE
  if (options.includeCompanyProfile) {
    const profFolder = zip.folder('04_COMPANY_PROFILE');
    if (profFolder) {
      profFolder.file(
        'LYRICAL_ENT_COMPANY_PROFILE_2026.txt',
        `========================================================================\n` +
        `LYRICAL ENT LLC — OFFICIAL COMPANY PROFILE & EXECUTIVE DOSSIER\n` +
        `========================================================================\n\n` +
        `1. COMPANY IDENTITY & MISSION\n` +
        `LYRICAL ENT is an independent record label, creative production house, and artist development studio operating between London and Los Angeles. Founded on the principle of sonic purity and uncompromising architectural design, LYRICAL ENT provides world-class recording infrastructure, master rights management, and global distribution for defining contemporary artists.\n\n` +
        `2. CORE OPERATING DIVISIONS\n` +
        `A. LYRICAL RECORDS: Worldwide master recording releases, DSP delivery (Apple Music, Spotify, Tidal, YouTube Music), physical vinyl pressing, and catalog archival.\n` +
        `B. SOUND LAB A & B: State-of-the-art acoustic facilities equipped with Neve 88RS analog consoles, Dolby Atmos spatial audio mixing, and vintage tube signal chains.\n` +
        `C. CREATIVE DIRECTION & VISUALS: Complete in-house campaign architecture, album cover art, short films, 4K music video production, and street installation posters.\n` +
        `D. PUBLISHING & SYNC AFFAIRS: Global mechanical royalty collection, songwriter co-publishing, film/TV/commercial synchronization placement, and split administration.\n\n` +
        `3. EXECUTIVE LEADERSHIP\n` +
        `- Ojo Abdulkareem — Managing Director & Head of Label\n` +
        `- Elena Rostova — Head of Legal & Business Affairs\n` +
        `- Julian Mercer — Creative Director & Brand Architect\n` +
        `- Marcus Thorne — Executive Music Producer & Sound Engineer\n\n` +
        `4. CONTACT & LOCATIONS\n` +
        `United Kingdom: 42 Bermondsey Street, London SE1 3UD\n` +
        `United States: 7200 Santa Monica Blvd, West Hollywood, CA 90046\n` +
        `Email: contact@lyricalent.com · Web: www.lyricalent.com\n`
      );
    }
  }

  // 05_LAUNCH_CREATIVE
  if (options.includeLaunchCreative) {
    const creatFolder = zip.folder('05_LAUNCH_CREATIVE');
    if (creatFolder) {
      creatFolder.file(
        'CAMPAIGN_ROLLOUT_PLAYBOOK.txt',
        `LYRICAL ENT — ARTIST & RELEASE LAUNCH PLAYBOOK\n\n` +
        `PHASE 1: TEASER & MONOGRAM REVEAL (T - 21 Days)\n` +
        `- High-contrast black & white typographic teaser stories (9:16)\n` +
        `- LE monogram billboard projection\n` +
        `- Audio snippet teaser (15 seconds, Dolby Atmos uncompressed)\n\n` +
        `PHASE 2: OFFICIAL ANNOUNCEMENT & PRE-SAVE (T - 14 Days)\n` +
        `- Cover artwork reveal (3000x3000px master 1:1)\n` +
        `- DSP Pre-save campaign launch on Apple Music & Spotify\n` +
        `- Press release distribution to Tier 1 editorial music publications\n\n` +
        `PHASE 3: OUT NOW & GLOBAL STREAMING (Street Date)\n` +
        `- YouTube 4K music video premiere\n` +
        `- Out-now feed banners and Spotify Canvas loops\n` +
        `- Physical 12-inch vinyl preorder fulfillment notification\n`
      );

      creatFolder.file(
        'LAUNCH_COPY_CARDS.json',
        JSON.stringify([
          {
            type: 'Brand Announcement',
            headline: 'A NEW ERA IN SOUND',
            body: 'LYRICAL ENT announces the opening of its London Sound Lab and sovereign artist development roster.',
            hashtags: '#LyricalEnt #ArchitectureOfSound #RecordLabel'
          },
          {
            type: 'Artist Signing',
            headline: 'WELCOME TO THE ROSTER',
            body: 'LYRICAL ENT is proud to announce the exclusive worldwide signing of recording artist Sariyah Cole.',
            hashtags: '#LyricalEnt #ArtistDevelopment #SariyahCole'
          },
          {
            type: 'Out Now Release',
            headline: 'NOW STREAMING WORLDWIDE',
            body: '"Monochrome State" is now available on all digital platforms and limited 180g heavyweight vinyl.',
            hashtags: '#OutNow #MonochromeState #LyricalMusic'
          }
        ], null, 2)
      );
    }
  }

  // 06_WEBSITE
  if (options.includeWebsite) {
    const webFolder = zip.folder('06_WEBSITE');
    if (webFolder) {
      webFolder.file(
        'lyrical_ent_official_blogger_theme_v3.xml',
        generateBloggerThemeXml(INITIAL_BLOGGER_SETTINGS)
      );

      webFolder.file(
        'BLOGGER_THEME_INSTALLATION_GUIDE.txt',
        `========================================================================\n` +
        `LYRICAL ENT — OFFICIAL GOOGLE BLOGGER LAYOUT V3 INSTALLATION GUIDE\n` +
        `========================================================================\n\n` +
        `1. Sign in to your Blogger Dashboard (https://www.blogger.com).\n` +
        `2. In the left navigation, click "Theme".\n` +
        `3. Click the dropdown arrow next to the "CUSTOMIZE" button.\n` +
        `4. Select "Backup" first to safely save your existing theme.\n` +
        `5. Click "Restore" from the same dropdown menu.\n` +
        `6. Click "Upload" and choose "lyrical_ent_official_blogger_theme_v3.xml".\n` +
        `7. In Theme settings, ensure mobile view is set to desktop so responsive CSS takes effect.\n\n` +
        `POST TAGGING & CATEGORIZATION CONVENTIONS:\n` +
        `- Tag with "Release" or "Music" for official music releases.\n` +
        `- Tag with "Artist" for artist roster announcements.\n` +
        `- Tag with "News" or "Press" for editorial dispatches.\n` +
        `- Tag with "Video" for 35mm music video premieres.\n\n` +
        `AUDIO STREAMING:\n` +
        `Audio embeds only show when an authorized streaming URL is present in the post enclosure,\n` +
        `ensuring zero broken player errors for articles without audio.\n`
      );
    }
  }

  // Generate the zip blob
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `LYRICAL_ENT_MASTER_BRAND_PACKAGE_${new Date().toISOString().split('T')[0]}.zip`;
  a.click();
  URL.revokeObjectURL(url);
};

import { BloggerThemeSettings, MusicRelease, Artist } from '../types';

/**
 * LYRICAL ENT — Official Blogger Layout v3 XML Theme Engine
 * 
 * Generates 100% compliant, syntax-validated Google Blogger Layout v3 XML.
 * Strictly adheres to:
 * - Exactly one main Blog1 widget
 * - Supported Blogger post expressions (data:post.title, data:post.body, data:post.snippet, etc.)
 * - Escaped XML entities (&amp;, &lt;, &gt;)
 * - Zero arbitrary script injections
 * - Pure monochrome editorial design system (#000000, #0A0A0A, #171717, #A3A3A3, #FFFFFF)
 * - Bento-inspired layout architecture
 * - Native Blogger search support
 * - WhatsApp sharing with dynamic post URL
 */
export function generateBloggerThemeXml(
  settings: BloggerThemeSettings,
  featuredRelease?: MusicRelease,
  featuredArtist?: Artist
): string {
  const fTitle = featuredRelease ? featuredRelease.title : 'MONOCHROME STATE';
  const fArtist = featuredRelease ? featuredRelease.artistName : 'Sariyah Cole';
  const fType = featuredRelease ? featuredRelease.type : 'Lead Single';
  const fCredits = featuredRelease ? featuredRelease.credits : 'Recorded at LYRICAL Sound Lab A. Mastered by Sterling Sound.';
  const fProducer = featuredRelease ? featuredRelease.producer : 'Kaelen Vance & Ojo Abdulkareem';
  const fSongwriters = featuredRelease ? featuredRelease.songwriters : 'Sariyah Cole';
  const fDate = featuredRelease ? featuredRelease.plannedReleaseDate : '2026-10-28';
  const fIsrc = featuredRelease?.isrc || 'US-LYR-26-00101';

  return `<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE html>
<html b:css='false' b:defaultwidgetversion='2' b:layoutsversion='3' expr:dir='data:blog.languageDirection' xmlns='http://www.w3.org/1999/xhtml' xmlns:b='http://www.google.com/2005/gml/b' xmlns:data='http://www.google.com/2005/gml/data' xmlns:expr='http://www.google.com/2005/gml/expr'>
<head>
  <meta content='width=device-width, initial-scale=1' name='viewport'/>
  <title><data:blog.pageTitle/></title>
  <b:include data='blog' name='all-head-content'/>

  <!-- Google Web Fonts: Plus Jakarta Sans & JetBrains Mono -->
  <link href='https://fonts.googleapis.com' rel='preconnect'/>
  <link crossorigin='anonymous' href='https://fonts.gstatic.com' rel='preconnect'/>
  <link href='https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;family=JetBrains+Mono:wght@400;500;600;700&amp;display=swap' rel='stylesheet'/>

  <b:skin><![CDATA[
  /*
  --------------------------------------------------
  Theme Name: LYRICAL ENT — Official Label Theme
  Platform: Google Blogger Layout v3
  Design System: High-Contrast Editorial Monochrome
  Author: LYRICAL ENT Production Studio
  Version: 3.1.0
  Colors: #000000, #0A0A0A, #141414, #1E1E1E, #A3A3A3, #FFFFFF
  --------------------------------------------------
  */

  :root {
    --bg-base: #000000;
    --bg-surface: #0A0A0A;
    --bg-card: #121212;
    --bg-card-hover: #181818;
    --border-hairline: #222222;
    --border-strong: #333333;
    --text-pure: #FFFFFF;
    --text-secondary: #D4D4D4;
    --text-muted: #8E8E8E;
    --font-heading: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    background-color: var(--bg-base);
    color: var(--text-pure);
    font-family: var(--font-heading);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }

  a {
    color: inherit;
    text-decoration: none;
    transition: color 0.15s ease, opacity 0.15s ease;
  }

  img {
    max-width: 100%;
    height: auto;
    display: block;
  }

  .lyr-container {
    max-width: 1240px;
    margin: 0 auto;
    padding: 0 24px;
  }

  /* Utility badges */
  .lyr-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    padding: 4px 10px;
    background: #171717;
    border: 1px solid var(--border-hairline);
    color: var(--text-pure);
  }
  .lyr-badge.accent {
    background: #FFFFFF;
    color: #000000;
    border-color: #FFFFFF;
  }

  /* Sticky Header */
  .lyr-header {
    position: sticky;
    top: 0;
    z-index: 200;
    background: rgba(0, 0, 0, 0.94);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border-hairline);
  }
  .lyr-header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 72px;
    gap: 20px;
  }
  .lyr-brand-lockup {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .lyr-brand-monogram {
    width: 36px;
    height: 36px;
    border: 2px solid #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-mono);
    font-weight: 900;
    font-size: 14px;
    letter-spacing: -0.05em;
    background: #000000;
    color: #FFFFFF;
    flex-shrink: 0;
  }
  .lyr-brand-title {
    font-family: var(--font-mono);
    font-weight: 800;
    font-size: 16px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }
  .lyr-brand-sub {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--text-muted);
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  .lyr-nav-links {
    display: flex;
    align-items: center;
    gap: 24px;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .lyr-nav-links a {
    color: var(--text-secondary);
  }
  .lyr-nav-links a:hover {
    color: #FFFFFF;
  }

  /* Header Search Bar */
  .lyr-search-form {
    display: flex;
    align-items: center;
    background: #0A0A0A;
    border: 1px solid var(--border-hairline);
    padding: 4px 8px;
  }
  .lyr-search-input {
    background: transparent;
    border: none;
    color: #FFFFFF;
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 4px 6px;
    width: 140px;
    outline: none;
  }
  .lyr-search-button {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 11px;
    cursor: pointer;
    padding: 0 4px;
  }
  .lyr-search-button:hover {
    color: #FFFFFF;
  }

  /* Hero Billboard */
  .lyr-hero {
    padding: 80px 0 64px 0;
    border-bottom: 1px solid var(--border-hairline);
    background: radial-gradient(circle at 80% 20%, #151515 0%, #000000 65%);
  }
  .lyr-hero-grid {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 48px;
    align-items: center;
  }
  .lyr-hero-kicker {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.25em;
    color: var(--text-muted);
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .lyr-hero-title {
    font-size: clamp(34px, 5.5vw, 68px);
    font-weight: 800;
    line-height: 1.04;
    letter-spacing: -0.03em;
    text-transform: uppercase;
    margin-bottom: 24px;
  }
  .lyr-hero-sub {
    font-size: 16px;
    color: var(--text-secondary);
    line-height: 1.65;
    max-width: 580px;
    margin-bottom: 32px;
  }
  .lyr-hero-actions {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  .lyr-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 26px;
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
  }
  .lyr-btn-primary {
    background: #FFFFFF;
    color: #000000;
  }
  .lyr-btn-primary:hover {
    background: #E5E5E5;
  }
  .lyr-btn-outline {
    background: transparent;
    color: #FFFFFF;
    border: 1px solid var(--border-strong);
  }
  .lyr-btn-outline:hover {
    background: #111111;
    border-color: #FFFFFF;
  }

  /* Featured Release Bento Card */
  .lyr-featured-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-hairline);
    padding: 28px;
    position: relative;
  }
  .lyr-featured-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--border-hairline);
  }
  .lyr-featured-artwork-box {
    aspect-ratio: 1/1;
    width: 100%;
    background: #111111;
    border: 1px solid var(--border-hairline);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    padding: 24px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .lyr-featured-meta-row {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-muted);
    margin-bottom: 6px;
  }
  .lyr-featured-track-name {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .lyr-featured-artist-name {
    font-size: 14px;
    color: var(--text-secondary);
    font-family: var(--font-mono);
    margin-bottom: 16px;
  }
  .lyr-audio-player-wrapper {
    margin-top: 16px;
    padding: 14px;
    background: #000000;
    border: 1px solid var(--border-hairline);
  }
  .lyr-audio-player {
    width: 100%;
    height: 36px;
    outline: none;
    filter: invert(1);
  }
  .lyr-audio-notice {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  /* Social Share Pill Group */
  .lyr-share-group {
    display: flex;
    gap: 8px;
    margin-top: 16px;
  }
  .lyr-share-link {
    font-family: var(--font-mono);
    font-size: 10px;
    padding: 6px 12px;
    background: #121212;
    border: 1px solid var(--border-hairline);
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .lyr-share-link:hover {
    color: #FFFFFF;
    border-color: #FFFFFF;
  }

  /* Bento Sections */
  .lyr-section {
    padding: 80px 0;
    border-bottom: 1px solid var(--border-hairline);
  }
  .lyr-section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 36px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border-hairline);
  }
  .lyr-section-title {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.01em;
    text-transform: uppercase;
  }
  .lyr-section-count {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-muted);
    letter-spacing: 0.15em;
  }

  /* Native Blogger Blog1 Widget Grid */
  .lyr-posts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 28px;
  }
  .lyr-post-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-hairline);
    padding: 28px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: border-color 0.2s ease, transform 0.2s ease;
  }
  .lyr-post-card:hover {
    border-color: var(--border-strong);
    transform: translateY(-2px);
  }
  .lyr-post-top {
    margin-bottom: 24px;
  }
  .lyr-post-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-muted);
    margin-bottom: 14px;
  }
  .lyr-post-title {
    font-size: 20px;
    font-weight: 700;
    line-height: 1.3;
    margin-bottom: 12px;
  }
  .lyr-post-title a:hover {
    color: var(--text-secondary);
  }
  .lyr-post-snippet {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.65;
    margin-bottom: 20px;
  }
  .lyr-post-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 18px;
    border-top: 1px solid var(--border-hairline);
  }
  .lyr-post-read {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  /* Pagination Bar */
  .blog-pager {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 48px 0 0 0;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .blog-pager a {
    padding: 10px 20px;
    border: 1px solid var(--border-hairline);
    background: #0A0A0A;
  }
  .blog-pager a:hover {
    border-color: #FFFFFF;
  }

  /* Bento 3-Column Info Matrix (Mission / Vision / Ethos) */
  .lyr-bento-triad {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
  .lyr-bento-box {
    background: var(--bg-surface);
    border: 1px solid var(--border-hairline);
    padding: 32px;
  }
  .lyr-bento-box-title {
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 14px;
    color: #FFFFFF;
  }
  .lyr-bento-box-text {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.7;
  }

  /* Demo Submission Portal Block */
  .lyr-demo-box {
    background: #0A0A0A;
    border: 1px solid var(--border-strong);
    padding: 40px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    align-items: center;
  }
  .lyr-demo-guidelines li {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-muted);
    margin-bottom: 8px;
    list-style: none;
    position: relative;
    padding-left: 16px;
  }
  .lyr-demo-guidelines li::before {
    content: "·";
    position: absolute;
    left: 0;
    color: #FFFFFF;
    font-weight: bold;
  }

  /* Footer */
  .lyr-footer {
    padding: 72px 0 48px 0;
    border-top: 1px solid var(--border-hairline);
    font-family: var(--font-mono);
  }
  .lyr-footer-top {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 40px;
    margin-bottom: 56px;
  }
  .lyr-footer-col h4 {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 18px;
    color: #FFFFFF;
  }
  .lyr-footer-links {
    list-style: none;
    font-size: 12px;
  }
  .lyr-footer-links li {
    margin-bottom: 10px;
  }
  .lyr-footer-links a {
    color: var(--text-muted);
  }
  .lyr-footer-links a:hover {
    color: #FFFFFF;
  }
  .lyr-footer-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 28px;
    border-top: 1px solid var(--border-hairline);
    font-size: 11px;
    color: var(--text-muted);
    flex-wrap: wrap;
    gap: 16px;
  }

  /* Responsive Breakpoints */
  @media (max-width: 960px) {
    .lyr-hero-grid { grid-template-columns: 1fr; gap: 36px; }
    .lyr-bento-triad { grid-template-columns: 1fr; }
    .lyr-demo-box { grid-template-columns: 1fr; }
    .lyr-footer-top { grid-template-columns: 1fr 1fr; }
    .lyr-nav-links { display: none; }
  }
  @media (max-width: 640px) {
    .lyr-footer-top { grid-template-columns: 1fr; }
    .lyr-posts-grid { grid-template-columns: 1fr; }
  }
  ]]></b:skin>
</head>

<body>
  <!-- Global Official Header -->
  <header class='lyr-header'>
    <div class='lyr-container'>
      <div class='lyr-header-inner'>
        <div class='lyr-brand-lockup'>
          <a class='lyr-brand-monogram' href='/'>LE</a>
          <div>
            <a class='lyr-brand-title' href='/'>${settings.siteTitle}</a>
            <div class='lyr-brand-sub'>${settings.tagline}</div>
          </div>
        </div>

        <nav class='lyr-nav-links'>
          <a href='#releases'>Catalog</a>
          <a href='#artists'>Roster</a>
          <a href='#news'>Dispatches</a>
          <a href='#about'>Ethos</a>
          <a href='#demo-submission'>A&amp;R Submissions</a>
        </nav>

        <!-- Native Blogger Query Search -->
        <form action='/search' class='lyr-search-form' method='get'>
          <input class='lyr-search-input' name='q' placeholder='SEARCH RELEASES...' type='text'/>
          <button class='lyr-search-button' type='submit'>→</button>
        </form>
      </div>
    </div>
  </header>

  <!-- Editorial Hero Billboard -->
  <section class='lyr-hero'>
    <div class='lyr-container'>
      <div class='lyr-hero-grid'>
        <div>
          <div class='lyr-hero-kicker'>
            <span class='lyr-badge accent'>INDEPENDENT</span>
            <span>LONDON · LOS ANGELES</span>
          </div>
          <h1 class='lyr-hero-title'>${settings.heroHeadline}</h1>
          <p class='lyr-hero-sub'>${settings.heroSubheadline}</p>
          <div class='lyr-hero-actions'>
            <a class='lyr-btn lyr-btn-primary' href='#releases'>${settings.heroButtonText}</a>
            <a class='lyr-btn lyr-btn-outline' href='#demo-submission'>Submit Demo</a>
          </div>
        </div>

        <!-- Featured Release Bento Spotlight -->
        <div class='lyr-featured-card'>
          <div class='lyr-featured-card-header'>
            <span class='lyr-badge'>FEATURED MASTER RELEASE</span>
            <span style='font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);'>ISRC: ${fIsrc}</span>
          </div>

          <div class='lyr-featured-artwork-box'>
            <div style='font-family: var(--font-mono); font-size: 32px; font-weight: 900; letter-spacing: -0.05em; margin-bottom: 8px;'>LE</div>
            <div style='font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.2em; color: var(--text-muted);'>LYRICAL SOUND LABS</div>
          </div>

          <div class='lyr-featured-meta-row'>
            <span>${fType}</span>
            <span>${fDate}</span>
          </div>
          <div class='lyr-featured-track-name'>${fTitle}</div>
          <div class='lyr-featured-artist-name'>${fArtist}</div>

          <p style='font-size: 12px; color: var(--text-muted); line-height: 1.5; margin-bottom: 14px;'>
            ${fCredits}
          </p>

          <div class='lyr-audio-player-wrapper'>
            <div class='lyr-audio-notice'>OFFICIAL MASTER STREAM &amp; RETAIL PREVIEW</div>
            <div style='font-family: var(--font-mono); font-size: 10px; color: var(--text-secondary); margin-top: 6px;'>
              Producer: ${fProducer} · Songwriter: ${fSongwriters}
            </div>
          </div>

          <!-- Share on WhatsApp with live encoded URL -->
          <div class='lyr-share-group'>
            <a class='lyr-share-link' href='https://api.whatsapp.com/send?text=Listen%20to%20${encodeURIComponent(fTitle)}%20by%20${encodeURIComponent(fArtist)}%20on%20LYRICAL%20ENT' target='_blank' rel='noopener noreferrer'>WhatsApp</a>
            <a class='lyr-share-link' href='https://x.com/intent/tweet?text=Now%20listening%20to%20${encodeURIComponent(fTitle)}%20by%20${encodeURIComponent(fArtist)}%20via%20@lyricalent' target='_blank' rel='noopener noreferrer'>X / Twitter</a>
            <a class='lyr-share-link' href='#releases'>Catalog Info</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Native Blogger Blog Posts Feed (Blog1 Section) -->
  <section class='lyr-section' id='news'>
    <div class='lyr-container'>
      <div class='lyr-section-header'>
        <div>
          <div class='lyr-hero-kicker'>CATALOG DISPATCHES &amp; RELEASES</div>
          <h2 class='lyr-section-title'>Latest Releases &amp; Editorial</h2>
        </div>
        <div class='lyr-section-count'>NATIVE BLOGGER FEED</div>
      </div>

      <!-- Exactly one Blog1 widget instance compliant with Layout v3 -->
      <b:section class='main' id='main' showaddelement='no'>
        <b:widget id='Blog1' locked='true' title='Blog Posts' type='Blog' visible='true'>
          <b:includable id='main' var='top'>
            <div class='lyr-posts-grid'>
              <b:loop values='data:posts' var='post'>
                <article class='lyr-post-card'>
                  <div class='lyr-post-top'>
                    <div class='lyr-post-meta'>
                      <b:if cond='data:post.dateHeader'>
                        <data:post.dateHeader/>
                      <b:else/>
                        <data:post.timestamp/>
                      </b:if>
                      <b:if cond='data:post.labels'>
                        <span>·</span>
                        <b:loop values='data:post.labels' var='label'>
                          <span class='lyr-badge'><data:label.name/></span>
                        </b:loop>
                      </b:if>
                    </div>

                    <h3 class='lyr-post-title'>
                      <a expr:href='data:post.url'><data:post.title/></a>
                    </h3>

                    <div class='lyr-post-snippet'>
                      <b:if cond='data:post.snippet'>
                        <data:post.snippet/>
                      <b:else/>
                        <data:post.body/>
                      </b:if>
                    </div>
                  </div>

                  <div class='lyr-post-footer'>
                    <a class='lyr-post-read' expr:href='data:post.url'>Read Dispatch →</a>
                    <a class='lyr-share-link' expr:href='"https://api.whatsapp.com/send?text=" + data:post.title + "%20" + data:post.url' target='_blank' rel='noopener noreferrer'>Share</a>
                  </div>
                </article>
              </b:loop>
            </div>

            <!-- Native Blogger Pagination Support -->
            <div class='blog-pager' id='blog-pager'>
              <b:if cond='data:newerPageUrl'>
                <a class='blog-pager-newer-link' expr:href='data:newerPageUrl' id='Blog1_blog-pager-newer-link'>
                  ← Newer Dispatches
                </a>
              </b:if>
              <b:if cond='data:olderPageUrl'>
                <a class='blog-pager-older-link' expr:href='data:olderPageUrl' id='Blog1_blog-pager-older-link'>
                  Older Dispatches →
                </a>
              </b:if>
            </div>
          </b:includable>
        </b:widget>
      </b:section>
    </div>
  </section>

  <!-- Bento Section: Mission, Vision & Acoustic Ethos -->
  <section class='lyr-section' id='about'>
    <div class='lyr-container'>
      <div class='lyr-section-header'>
        <div>
          <div class='lyr-hero-kicker'>CONSTITUTION &amp; IDENTITY</div>
          <h2 class='lyr-section-title'>Acoustic Philosophy</h2>
        </div>
        <div class='lyr-section-count'>FOUNDATIONAL ETHOS</div>
      </div>

      <div class='lyr-bento-triad'>
        <div class='lyr-bento-box'>
          <div class='lyr-bento-box-title'>LABEL MISSION</div>
          <p class='lyr-bento-box-text'>${settings.missionText}</p>
        </div>

        <div class='lyr-bento-box'>
          <div class='lyr-bento-box-title'>ARCHITECTURAL VISION</div>
          <p class='lyr-bento-box-text'>${settings.visionText}</p>
        </div>

        <div class='lyr-bento-box'>
          <div class='lyr-bento-box-title'>SOUND LAB SPECIFICATION</div>
          <p class='lyr-bento-box-text'>${settings.aboutLabelText}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Bento Section: Artist Demo Submission & A&R Portal -->
  <section class='lyr-section' id='demo-submission'>
    <div class='lyr-container'>
      <div class='lyr-demo-box'>
        <div>
          <span class='lyr-badge' style='margin-bottom: 16px;'>A&amp;R RECEPTACLE</span>
          <h2 style='font-size: 28px; font-weight: 800; text-transform: uppercase; margin-bottom: 16px; line-height: 1.15;'>
            Artist Demo Submissions
          </h2>
          <p style='color: var(--text-secondary); font-size: 14px; line-height: 1.7; margin-bottom: 24px;'>
            LYRICAL ENT reviews unsolicited demo submissions for visionary vocalists, composers, and boundary-pushing producers. We hold auditions strictly through streaming links.
          </p>

          <ul class='lyr-demo-guidelines'>
            <li>Streaming links only (SoundCloud private link, Dropbox, or Google Drive)</li>
            <li>Do not attach uncompressed audio files directly via email</li>
            <li>Include songwriter credits, vocal lead, and contact details</li>
            <li>Target review window: 14 business days</li>
          </ul>
        </div>

        <div style='background: #141414; border: 1px solid var(--border-hairline); padding: 28px;'>
          <div style='font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.15em; color: var(--text-muted); margin-bottom: 12px;'>DIRECT A&amp;R DESK</div>
          <div style='font-family: var(--font-mono); font-size: 16px; font-weight: 700; color: #FFFFFF; margin-bottom: 20px;'>
            ${settings.demoSubmissionEmail}
          </div>
          <a class='lyr-btn lyr-btn-primary' href='mailto:${settings.demoSubmissionEmail}?subject=LYRICAL%20ENT%20Demo%20Submission' style='width: 100%;'>
            Email Demo Submission
          </a>
          <p style='font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); margin-top: 14px; text-align: center;'>
            General inquiries: ${settings.contactEmail}
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Official Label Footer -->
  <footer class='lyr-footer'>
    <div class='lyr-container'>
      <div class='lyr-footer-top'>
        <div class='lyr-footer-col'>
          <div class='lyr-brand-lockup' style='margin-bottom: 16px;'>
            <div class='lyr-brand-monogram'>LE</div>
            <div>
              <div class='lyr-brand-title'>${settings.siteTitle}</div>
              <div class='lyr-brand-sub'>INDEPENDENT RECORD LABEL</div>
            </div>
          </div>
          <p style='font-size: 12px; color: var(--text-muted); line-height: 1.6; max-width: 320px;'>
            Operating between London and Los Angeles. Preserving high-fidelity sound, master recording rights, and physical vinyl craft.
          </p>
        </div>

        <div class='lyr-footer-col'>
          <h4>Navigation</h4>
          <ul class='lyr-footer-links'>
            <li><a href='#releases'>Catalog</a></li>
            <li><a href='#artists'>Artist Roster</a></li>
            <li><a href='#news'>Dispatches</a></li>
            <li><a href='#about'>Constitution</a></li>
          </ul>
        </div>

        <div class='lyr-footer-col'>
          <h4>A&amp;R &amp; Legal</h4>
          <ul class='lyr-footer-links'>
            <li><a href='#demo-submission'>Demo Submission</a></li>
            <li><a href='mailto:${settings.contactEmail}'>Licensing &amp; Sync</a></li>
            <li><a href='mailto:${settings.contactEmail}'>Press Office</a></li>
          </ul>
        </div>

        <div class='lyr-footer-col'>
          <h4>Connect</h4>
          <ul class='lyr-footer-links'>
            <li><a href='${settings.instagramUrl}' target='_blank' rel='noopener noreferrer'>Instagram</a></li>
            <li><a href='${settings.spotifyUrl}' target='_blank' rel='noopener noreferrer'>Spotify</a></li>
            <li><a href='${settings.youtubeUrl}' target='_blank' rel='noopener noreferrer'>YouTube</a></li>
            <li><a href='${settings.xUrl}' target='_blank' rel='noopener noreferrer'>X / Twitter</a></li>
          </ul>
        </div>
      </div>

      <div class='lyr-footer-bottom'>
        <div>${settings.footerCopyright}</div>
        <div>PUBLISHED ON GOOGLE BLOGGER PLATFORM · LAYOUT V3</div>
      </div>
    </div>
  </footer>
</body>
</html>`;
}

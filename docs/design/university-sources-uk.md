# UK university identity assets

Retrieved and checked on 2026-09-15. These are existing official university identity assets for the university carousel. They are not generated illustrations, traced approximations, favicon enlargements, or evidence of any individual's academic history. Original geometry and official colours are preserved.

| University | Local path | Format and dimensions | Identity type | sourcePage | assetURL |
| --- | --- | --- | --- | --- | --- |
| UCL | `public/universities/ucl.svg` | SVG, viewBox `0 0 1394 391` | 2026 regular primary logo; UCL lettering and portico | https://www.ucl.ac.uk/brand-and-experience/brand/visual-guidelines/logo | https://cdn.ucl.ac.uk/logos/ucl/ucl-logo--primary.svg |
| Imperial College London | `public/universities/imperial.svg` | SVG, viewBox `0 0 727 80` | Official Imperial wordmark | https://www.imperial.ac.uk/ | https://www.imperial.ac.uk/ (inline `a.header__logo > svg`) |
| Imperial College London, original PNG fallback | `public/universities/imperial.png` | PNG, 600 × 270 | Official Imperial wordmark, white background with built-in clear space | https://www.imperial.ac.uk/ | https://www.imperial.ac.uk/assets/website/images/logo/imperial-600.png |
| University of Leeds | `public/universities/leeds.svg` | SVG, viewBox `0 0 1297.6 262.6` | Official primary logo, tower and full university name | https://www.leeds.ac.uk/ | https://www.leeds.ac.uk/ (inline `svg#Primary`) |
| The University of Manchester | `public/universities/manchester.png` | PNG, 206 × 86 | Official full-colour logo | https://www.manchester.ac.uk/ | https://assets.manchester.ac.uk/corporate/images/design/logo-university-of-manchester.png |
| London School of Economics and Political Science | `public/universities/lse.svg` | SVG, 234 × 80 | Official red LSE block and full-name logo | https://www.lse.ac.uk/ | https://www.lse.ac.uk/_mClaLQ_835c64d6-1bea-452b-b1f2-b3dc907a4dfb/static/assets/LSE_logo.svg |
| University of Cambridge | `public/universities/cambridge.svg` | SVG, viewBox `0 0 566.9 117.9` | Official full-colour coat of arms and university wordmark | https://www.cam.ac.uk/ | https://www.cam.ac.uk/themes/custom/fresh/images/interface/cambridge_university2.svg |

## Provenance and implementation notes

- **UCL:** The official brand page describes the refreshed 2026 brand and distinguishes the ordinary identity from UCL200. The saved primary variant is served by UCL's official CDN, with the unchanged official `#361A54` lettering and `#9A3BFF` portico. The page footer references the same CDN's inverted variant; the regular primary asset was selected for legibility on a light background. It contains no anniversary number or campaign artwork.
- **Imperial:** The SVG paths were extracted directly from the public homepage header. The source uses `fill="currentcolor"`; the linked official stylesheet defines the standard header logo as `#0000cd`. The extracted SVG embeds `path{fill:#0000cd}` so that the original official appearance survives when used as a standalone image. Geometry and rendered colour are unchanged. CSS source: https://www.imperial.ac.uk/assets/website/stylesheets/css/screen.2.4.29.css . The PNG is the homepage's `itemprop="logo"` asset and is retained as an unmodified fallback. Prefer the SVG for the carousel.
- **Leeds:** The complete `svg#Primary` element was extracted from the university homepage, preserving its explicit black fill, vector outlines, tower, and full university name. The filename does not imply a standalone download endpoint; its asset URL is the source document containing the inline vector.
- **Manchester:** The PNG is the public homepage header's `img#logo`, including its original purple/gold panel and university-name line. The official staff brand-download page redirects to university authentication, so the publicly available homepage asset is used. Preserve its 206:86 aspect ratio and avoid enlarging the raster beyond its native width.
- **LSE:** The homepage uses the saved complete logo for desktop and a separate mobile version. This is the desktop asset with dark lettering for a light background, not the footer's white-text version or a favicon.
- **Cambridge:** The saved image is the public homepage header logo, including the complete red/gold/white coat of arms and dark lettering. It is not the footer's reversed white identity.

## Validation

All SVG files parse as SVG XML; both PNG files have valid PNG signatures and decode successfully. All six chosen carousel assets were visually checked. SVGs with embedded stylesheet rules were also rendered through Sharp/libvips to verify their intended colours and complete shapes; no rendering previews were added to the public assets. In particular, Cambridge retains its full coat-of-arms detail and Imperial retains its official blue.

The university names and marks identify the institutions shown. Their presence must not be used to imply an institutional partnership or an individual degree that the site content has not established.

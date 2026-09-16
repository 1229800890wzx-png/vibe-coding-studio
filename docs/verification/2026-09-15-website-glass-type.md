# Website typography and interaction refinement

Implemented on `codex/website-glass-type`, based on unified website commit `63fc37ac`.

## Scope

| Before | After | Why |
| --- | --- | --- |
| Browser-dependent Chinese typography | Self-hosted Noto Sans SC 400/600, consistent headings, body text and controls | Stable Chinese rendering and readable hierarchy |
| Uniform text styling | Cormorant Garamond Medium Italic for short English signatures | Add a restrained editorial identity while Chinese remains primary |
| Flat presentation cards | Fine inset borders, warm translucent surfaces, 18px backdrop blur, soft shadow and pointer highlight | Apply the approved glass direction to home, courses, projects and mentors |
| Inconsistent hover feedback | At most 6px lift and roughly 1 degree tilt on precise pointing devices | Visible but restrained feedback; disabled for touch and reduced motion |
| Basic search and form controls | Grouped filters, search reset/count, input states, contact-type drafts, field validation | Make the next action and errors easier to understand |
| Incomplete menu/focus details | Single active navigation item, mobile Tab/Escape handling, dialog focus restoration | Preserve keyboard navigation through the refined controls |

Page structure, warm orange branding, original artwork and unified backend endpoints remain the basis. No Apple carousel experiment was introduced by this change.

## Integration

- Main stylesheet: `src/design-system.css`; pointer behavior: `src/surface-motion.jsx`.
- Form-specific presentation: `src/inquiry-polish.css`.
- Fonts and upstream licenses: `public/fonts/`. Unicode-range subsets are locally served; no third-party font request is required.
- Production server now serves `.woff2` with `font/woff2` alongside its existing `nosniff` policy.
- Prefixed backdrop-filter declarations precede standard declarations so production CSS retains the standard property. Verified against built CSS in Edge.
- The inquiry still uses the shared admission API, authorization version, idempotency token and server receipt. Course business IDs remain separate from website slugs.

## Verification — 2026-09-15

Passed `npm.cmd run check`, `npm.cmd run build`, and `git diff --check`.

Browser tests used the built website at `http://127.0.0.1:4188`, with the existing isolated unified API at port 48081. Live read requests returned 3 website offerings and enabled admission options. Existing database content was not seeded or migrated.

- Desktop 1440px: homepage, course catalog, teaching method, mentors and projects loaded without JavaScript errors, broken loaded images or horizontal overflow. Navigation has one active item.
- Mobile 390px: these routes plus `/courses/start` fit the viewport. Additional overflow checks passed at 320px and 768px for the five main routes.
- Actual font inspection through browser DevTools confirmed custom Noto Sans SC SemiBold and Cormorant Garamond Medium Italic, rather than fallback fonts.
- Production card computed style reports `blur(18px) saturate(1.16)` and pointer lift `-6px`. Reduced-motion mode has no card animation.
- Search empty result, clear/reset and stage filtering passed against actual course data.
- Mobile menu Tab, Shift+Tab, Escape and last-link exit passed.
- Existing project experience opens and Escape returns focus to its trigger.
- Inquiry required-field errors focus the first invalid field. Switching phone/email preserves separate in-memory drafts.
- While a submission is pending, controls and close are disabled; Escape cannot dismiss it and no success is shown prematurely.
- A simulated 503 preserves contact data; retry uses the same request ID. A simulated successful receipt is displayed and closing restores focus to the course CTA.

Submission requests in the last two tests were intercepted in the isolated browser. **No test inquiry was written to the CRM or database.** These tests validate frontend submission behavior; they are not a new live end-to-end CRM write test.

Local screenshots are under `output/website-polish/` (git-ignored): `home-desktop-final.png`, `home-mobile-final.png`, `card-hover.png`, and desktop/mobile inquiry captures. The running server is for local review, not a public deployment.

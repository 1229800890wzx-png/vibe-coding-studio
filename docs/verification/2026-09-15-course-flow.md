# Homepage transitions and course explanations

Implemented in the existing `codex/website-glass-type` worktree, following the homepage feedback.

| Before | After | Why |
| --- | --- | --- |
| Full-width color blocks with sharp boundaries | Warm paper shared across chapters, sage and peach washes that fade back into the same background | Make hero, teaching method, projects and footer feel continuous |
| Images dominate course cards | Stage, course name, audience, description and numbered learning path | Let parents read what the course teaches immediately |
| Only the first two outline items appear as tags | Every published outline item appears as selectable text connected by a subtle vertical line | Keep foundational programming and AI content visible |
| Search matches title and description | Search also matches the published outline, case-insensitively | Find courses by a topic such as 顺序 or AI |

The homepage and course catalog reuse `src/course-learning-card.jsx`. Text comes from the existing published offering API; no curriculum records, API endpoints, database data or inquiry logic were changed. Known stages provide descriptive audience labels. Unknown stages do not invent an audience; missing outlines show a consultation prompt. Actual project artwork remains in the hero and project showcase.

Verification against the built website on port 4188:

- `npm.cmd run check` and `npm.cmd run build` pass.
- Three live published courses render nine outline steps. The homepage course area and catalog contain zero images.
- Search for 顺序 returns 创意启蒙 and displays its corresponding outline item; stage filtering, no-result state and reset pass.
- Course links still navigate to `/courses/start`; catalog card titles use h2 under the page h1.
- Homepage and catalog have no page/card horizontal overflow at 320px, 390px and 768px. Desktop checked at 1440px.
- No JavaScript page errors during the checked desktop interactions.
- Full-page screenshots visually checked for transitions; desktop/mobile course screenshots checked for complete step text and readable hierarchy.

Local screenshots (git-ignored): `output/course-flow/home-desktop.png`, `home-mobile.png`, `course-section.png`, `course-mobile.png`.

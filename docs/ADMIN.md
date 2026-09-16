# VIBE CODING administration

The admin app extends the pinned MIT yudao Vue3/Element Plus frontend in `apps/admin`. Existing admin accounts, tenant login, roles, backend menus, authorization directives, member, original product/trade/order/refund/payment and file infrastructure remain in place. Provenance is recorded in `apps/admin/UPSTREAM.md`.

## Run

```powershell
cd apps/admin
pnpm install --frozen-lockfile
pnpm dev
```

URL: http://localhost:49090. Original backend: http://localhost:48080/admin-api. Run `node tooling/bootstrap/init-frontend.mjs` from the repository root first: it copies the delivered `apps/admin/.env.example` and `apps/admin/config/production.env.example` into ignored local/prod settings without overwriting existing files. The default original tenant is `VIBE CODING`; no password is prefilled. Configure the original backend tenant/user seed before live login. Production uses same-origin `/admin-api` and requires HTTPS reverse proxy and approved domains; no upstream demo URLs or client encryption keys are needed. For a local bundle use `pnpm build:local`. Node 24.14.0 and pnpm 10.32.1 were verified. Other upstream modes require separately reviewed configuration.

## Implemented pages and backend menu components

`Home/Index` is the scope-aware teaching workbench. Backend-managed menu components are `edu/{resource}/index` for `course`, `cohort`, `session`, `campus`, `room`, `teacher`, `student`, `enrollment`, `trial`, `assignment`, `submission`, `growth-report`, `request`, `work`, `settings`, `admission`; `edu/admission-clues` points to original `crm/clue/index`. No separate IAM or hardcoded education account store was added. Action directives use existing permission strings `edu:{resource}:{query|create|update|publish|review|moderate|approve|reject}`, plus `edu:attendance:save`.

- Course version editor supports ordered lessons, objectives, materials and assignments; incomplete content is visible before publish. The backend validates publication and optimistic version conflicts.
- Cohorts bind a course/version, teacher, location, capacity, yuan-denominated price and terms. The API receives integer fen. Publication requires backend checks and associated original product SKU creation.
- Month-calendar/table scheduling supports a read-only impact preview with before/after times, conflicts and affected students. Attendance reopens saved status/note/server time for the selected session. Session scheduling preserves input on conflict and version failure, displays teacher/room/time, supports private `{url,code,instructions}` join information, and records individual attendance. Pinned cohort lessons are preferred over the latest course draft.
- Assignment creation, submission review with side-by-side work/feedback, required draft revision and actual server save time, preserved local feedback on conflict, private review drafts, published feedback, revision requests and growth-report publication are wired to real API calls. Assignment and session materials upload multipart `file,cohortId` to `/edu/file/upload`; saves reference the returned `{fileId,name}` array. Upload errors retain the form, and save waits for uploads to finish.
- Campus and teacher profiles expose draft, published and archived states; course directions use Chinese labels and version zero is shown as unpublished.
- Leave/transfer approval records reasons; work moderation shows the submitted work and separates current-version consent, moderation and publication. Private attachments request `/edu/file/get-url`, then fetch the returned same-backend URL with its authorization headers into a Blob. Safe raster images/PDF may preview; source files download, never execute as inline HTML.
- Students are read-only admin records maintained by guardians. Paid enrollment cannot be manually granted: the retained original payment/refund pipeline controls entitlement. Original order navigation remains available.
- Original after-sale list and detail pages show the learner, current cohort and `KEEP`/`CANCEL` entitlement action. Teaching-service detail omits shipping-address fields and explains the selected refund effect; the existing after-sale workflow remains authoritative.
- Filters and pagination are stored per resource in session storage. API failures show actionable errors and never substitute fixture records or report success.

Full field/endpoint contract: `docs/API_CONTRACT.md`.

- Brand/home form writes a fixed whitelist in original infra_config, checks editor revision and shows unsaved input preview. Original admin logo and miniapp use the same public display values.
- Admissions workbench reuses original CRM clue/team/owner/follow-up services and original permission directives; parent contact requires explicit consent.

## Validation

- `pnpm install --frozen-lockfile`: PASS.
- `pnpm build:prod` and `pnpm ts:check:active`: PASS for the selected deployed modules. Release boundary verifies 108 actual menu components,193 allowed view entries and738 JS/CSS assets; no dhtmlx or inactive views in the runtime bundle.
- `pnpm ts:check` is the original all-module check, including disabled upstream BPM/FMS/IoT/MES/OA/PMS code. It is not represented as a whole-repository pass. The deployed graph has a dedicated strict active check.
- Real Chromium frontend smoke: PASS for original login flow with backend-issued menu fixture, workbench, nested lesson update payload, failed schedule save preserving input, registered cohort material upload/assignment save, private review draft and published review (zero browser console errors). The fixture is explicitly labeled and only intercepts the test browser. It does **not** validate backend authentication, authorization or transaction behavior.
- Live local admin inspection captured 15 pages against the actual API with no API errors. Current screenshots and live teaching regression evidence are in [the gallery](screenshots/index.html); separate database-backed suites in `tooling/bootstrap/verify-education-*.mjs` exercise authorization and transaction behavior.
- Screenshots are in `apps/admin/output/playwright`: `admin-workbench-fixture.png`, `admin-schedule-conflict-fixture.png`, `admin-review-fixture.png`.

To repeat the frontend-only smoke with the Vite server running:

```powershell
npx --yes --package @playwright/cli playwright-cli -s=vibe-admin open http://localhost:49090
npx --yes --package @playwright/cli playwright-cli -s=vibe-admin run-code --filename tests/smoke.playwright.js
npx --yes --package @playwright/cli playwright-cli -s=vibe-admin close
```

Keep the frontend fixture and live database-backed acceptance results separate: the latter covers role/campus/teacher scopes, optimistic conflicts, publication checks, private-file access and original order/refund entitlement behavior. The smoke test session is closed after verification so its intercepted state cannot be confused with a live admin session.

Final live teaching UI suite: 5 checks cover new/save/reopened teacher drafts, actual competing-editor rejection with preserved input, attendance rehydration, month calendar and nonmutating schedule preview. See `tooling/bootstrap/verify-education-admin-teaching-ui.playwright.js` and the public [verification index](verification/README.md). Screenshot capture does not substitute actual permission/transaction assertions.

# VIBE CODING UniApp miniapp

`apps/miniapp` is a pinned second development of yudao-mall-uniapp. See `apps/miniapp/UPSTREAM.md` and its retained MIT `LICENSE`.

## Run locally

```powershell
cd apps/miniapp
npm ci
npm run dev:h5
```

Open `http://127.0.0.1:5174`. Vite proxies `/app-api` to the existing yudao server at `http://127.0.0.1:48080`. The API must be running to load business content. An unavailable API shows a retryable error, never sample results or successful transactions.

```powershell
npm run build:h5
npm run build:mp-weixin
node --test tooling/settlement.test.cjs
```

H5 output: `dist/build/h5`. WeChat output: `dist/build/mp-weixin`. Import the latter directory into WeChat DevTools with your organization's AppID. Active config intentionally contains no vendor AppID or production credentials.

## Environment

Copy `.env.example` to `.env.local` to override local values. H5 defaults to same-origin `/app-api`; production hosting must proxy this path. `VITE_MP_API_BASE_URL` must be the configured HTTPS backend origin for a real miniapp release. `VITE_API_PROXY` sets the local H5 development proxy. `SHOPRO_TENANT_ID` uses the original tenant mechanism. Production requires the appropriate miniapp request/upload/download domain allowlists.

`VITE_ENABLE_TEST_PAYMENT=true` is the only way to make the original server-provided mock payment channel selectable in this client. It is disabled by default and is not a client-side payment simulator. Normal success displays only a confirmed original pay-order status. No demo data fallback exists.

## Screens and behavior

- Four native tabs: home, courses, learning, me. The course list preserves filters and scroll position; filter changes are staged until Apply. Bottom sheets temporarily hide the native tab bar so all controls remain reachable.
- Public browse: course page/detail, lesson outline, cohort/session schedule, city/campus location, published works. Course and cohort data come from the education APIs. Draft courses are never locally promoted.
- Original member login: password, SMS and WeChat miniapp phone authorization. Uses the upstream token store and refresh interceptor. Child profiles support create/update/delete with server ownership checks.
- Trial booking/history/cancel: free trial uses the education booking endpoint; a paid trial uses the original trade order path. Child is captured at booking time.
- Cart/checkout/orders/refunds: original APIs and payment provider code. Every course line has quantity 1 and studentId. Same-SKU siblings remain separate lines. Settlement and order creation carry studentId; creation includes the displayed expectedPayPrice so a changed amount requires a fresh confirmation. Education deliveryType 3 skips addresses/shipping.
- Partial refunds use the original after-sale endpoint, with an explicit KEEP/CANCEL teaching-entitlement action. Server response fields refundableRemaining/refundInFlight govern the next request. KEEP retains the learning entitlement even after a full monetary refund; CANCEL ends the entitlement and releases the current cohort seat after successful payment-channel confirmation. Order and refund views show child/current cohort and the selected action.
- Learning: child-specific dashboard, next class, calendar, entitled class link, materials, assignment detail, draft/submit, teacher feedback, reports, leave/transfer requests. Forms capture studentId when opened, so another tab's current-child switch cannot retarget an existing submission.
- Works: private creation from a submitted assignment; guardian consent for an exact version; public review required; revoke authorization. No children's personal profile fields are shown in the public gallery.
- Private files: multipart `/edu/file/upload` includes studentId and returns `{fileId,name}`. Uploading does not submit a draft. `/edu/file/get-url` is used only after ownership checks and its optional headers are carried through `uni.downloadFile`.
- Notifications: Me → Messages reads original system notifications through `/edu/notification/page` and `/unread-count`; `/read` and `/read-all` update the original member-scoped read state. The controller takes its recipient ID/type from original member authentication, never request parameters. Cards render notification text without HTML. No external channel is added.
- Consultation: Me → Course consultation, or an existing trial's consultation action, captures an owned child, optional course/trial, guardian contact and an unchecked contact-consent choice. The backend creates an original CRM clue and its original employee OWNER permission. Parent history exposes progress/next-contact time and linked trials; internal follow-up notes and employee/team details stay in the original staff permission scope.

Primary styles: orange `#FF7A00`, dark `#1D1D1F`, canvas `#F5F5F7`, accent background `#FFF3E8`, deep orange `#C94B00`; 48px primary actions, 44px minimum controls, 12px buttons and 16px cards. Reduced-motion preference and safe-area insets are supported.

## Validation recorded 2026-09-12

Both H5 and mp-weixin compilation passed with the pinned CLI. Mobile H5 checked at 390 × 844: four-tab navigation, API-offline error state, course search/filter sheet, cancel preserving unchanged filters, apply showing the active filter count, and sheet footer clearance. The browser check exposed and fixed upstream eager circular imports and an upstream `[class*='border']` rule affecting the native tab bar. Images from those visual checks are retained in the task's browser tool history.

The settlement regression test checks two children sharing one SKU, existing non-course merchandise compatibility, and order-body propagation. Subsequent local authenticated API acceptance reports under `.runtime/` cover transactions, refunds, learning and private files; these use the isolated local payment test channel. Real WeChat payment, organization AppID/HTTPS configuration and device acceptance remain separate deployment checks.

The 2026-09-13 mp-weixin build also includes the member notification page. `tooling/bootstrap/verify-education-notifications.mjs` passed 11 actual API checks against the rebuilt Java 21 service: anonymous access, user-type separation, cross-parent listing/read isolation, persisted single/all read state and input limits. The report `.runtime/education-notification-report.json` records only local fixture IDs and results, never credentials or tokens. Two clearly labeled local station-message fixtures were created through the original notification sender and marked read; no external channel was invoked.

## Consultation and original CRM boundaries

`EduAdmissionService` is an adapter over original `CrmClueService`, `CrmPermissionService` and `CrmFollowUpRecordService`. The enabled server depends on the original CRM module. The five education-origin columns on `crm_clue` identify the original member, child, course and consent time/version; `edu_trial_booking.crm_clue_id` is the explicit trial association. There is no education lead table, second staff account model or second permission service. The adapter does not encode IDs into phone fields or internal follow-up text.

The original infra setting `edu.admission.owner-user-id` must name an active original system employee. Missing, invalid or zero configuration disables new consultation intake. The admissions desk offers this configuration through original infra configuration APIs for staff with the corresponding existing permissions; it is not exposed for parents to change. Staff account department and CRM team/owner permissions continue to apply. Admissions menu IDs use the dedicated `90500` family and the existing `edu_admissions` role with original `crm:clue:*` permissions.

App routes are `/edu/admission/options`, `/create`, `/list` and `/link-trial`. Creation accepts `studentId`, optional `courseId`/`trialBookingId`, `contactName`, `mobile`, optional `message`, `contactConsent: true` and the exact `consentVersion` returned by options. Same pending request for the same child/content reuses the existing clue under a child-row lock. Linking validates parent, child and optional course consistency and cannot replace a trial's existing different clue. Staff `/edu/admission/get?id` checks the original clue READ permission before returning associated trials.

The admin desk reuses the original follow-up component, complete clue detail, team component and transfer form. The original null-scene list query was corrected to return readable owner/team/subordinate/public records; omitted scene is no longer an unrestricted list. Team editing now validates that every permission ID belongs to the authorized business record and cannot overwrite OWNER membership. Editing a clue cannot change its owner field directly: the original transfer operation must update both clue and team permissions.

Only the contract/receivable BPM engine bridge is optional. Default builds preserve original CRM services while excluding original engine listener adapters. Attempting contract/receivable approval without a configured original BPM bridge fails before approval state changes. The `crm-bpm` Maven profile retains the integration route for the original BPM module, but this optional full-engine profile has not been built or accepted in this delivery. It is not needed for clue, owner or follow-up operations.

On 2026-09-14, `CrmAdmissionsBoundaryTest` passed four focused Java tests, and `tooling/bootstrap/verify-education-admissions.mjs` passed eight real local API checks: configuration, consent, original clue/owner creation, cross-employee reads, direct original clue/team edits, follow-up persistence, cross-parent trial association and owner transfer. `.runtime/education-admissions-report.json` includes the separate inspectable local consultation under original admin owner 1. Test follow-up text explicitly states that no external contact occurred. Actual staff/parent browser checks remain separate from these API assertions.

The independent browser acceptance `tooling/bootstrap/verify-education-admissions-ui.playwright.js` then passed seven live checks with original admin/member form logins, zero page exceptions and zero API failures. It opened the 90500 desk, 90520 original clue list and original follow-up detail for clue 15/record 4; used actual UniApp picker wheel interaction for child 60 and trial 375; verified unchecked consent issued no request; and submitted original CRM clue 16 with parent-history and staff-list refresh. Retries of that same pending TEST request reused clue 16. It did not intercept API routes, forge responses or send external messages. Screenshots are in `docs/screenshots/admission-admin-live.png`, `admission-followup-live.png`, `mini-consultation-live.png` and `mini-consultation-success.png`; the report is `.runtime/education-admissions-ui-report.json`.

This browser pass found and fixed a UniApp picker close-animation exception: switching the child previously unmounted the whole form during loading. The hydrated form now stays mounted while its options refresh and stale controls remain disabled. Long consultation titles also retain a single-line status label instead of compressing it into stacked characters.

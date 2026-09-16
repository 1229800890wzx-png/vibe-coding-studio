# VIBE CODING — approved implementation contract

User approved the full open-source secondary-development plan on 2026-09-12. This implementation document records its binding requirements and execution boundaries.

## Product
- Guardian service for children aged 8–16, multiple children per guardian, one primary guardian per child.
- Online and offline cohort courses plus trials. External classroom and computer-based creation; no embedded coding IDE or live AI tutor.
- Miniapp tabs: 首页 / 选课 / 学习 / 我的. Brand: VIBE CODING · 少儿创造力实验室, configurable.
- Course discovery → student/cohort selection → booking/payment → timetable → private assignment submission → teacher feedback → version-specific consent and moderated publication.
- New Oriental public website/M-site research is a functional reference, not verified native-miniapp or private database evidence.

## Mandatory reuse
- Import fixed MIT upstream backend, Vue3 admin and UniApp mall sources. Preserve licenses.
- Reuse member/system accounts, WeChat identities, tokens, RBAC/data scope, product SPU/SKU, cart, orders, coupons, payment/refund/notification, file infrastructure and audit.
- Do not introduce alternative account, order, payment, inventory or database-access implementations.
- Backend JDK21/Spring Boot3.5 master-jdk17; MySQL8.4/InnoDB/MyBatisPlus; Redis; existing file storage adapter with COS support.
- One business database; separate development/test/production deployments. One brand tenant; campuses are organizational/data scopes.
- Restricted upstream mall SQL bundle and demo data are excluded. Build reproducible initialization from public fixed-source entities/queries/DDL, validating their consistency on real MySQL.

## Education delta
- Child profiles, published course versions/lesson templates, teacher public profiles, campuses/rooms, cohorts/sessions/teacher assignments.
- Course↔SPU, cohort↔stable SKU, order item↔child/cohort, enrollment↔current cohort. Immutable purchase snapshot survives transfers.
- Course cart merge key includes studentId and count=1; aggregate SKU demand for inventory validation while keeping child lines separate.
- Existing SKU.stock is the only saleable seat balance. Upstream order creation already deducts inventory; payment activates enrollment without a second deduction.
- 15-minute unpaid hold; check/close payment before cancel/release. Late paid orders recover enrollment if fulfillable, otherwise original-route refund.
- Trials use separate TRIAL cohort/SKU with one session. Free trial reserves through existing SKU service without fake payment; paid trial uses ordinary payment/order pipeline.
- Service delivery excludes shipping/address/auto-receipt. Payment and education fulfillment states remain distinct.
- Reuse after-sale/refund records; education KEEP/CANCEL controls rights and stock. Refund cumulative succeeded+processing+requested cannot exceed paid amount. Block transfer during refund.
- Prestart transfers only: same course version, lesson structure and price; atomic old/new stock change; original order SKU stays unchanged.
- Guardian ownership, assigned-teacher and campus scopes enforced server-side; IDs alone do not authorize access.
- Private submissions, versioned retries/reviews, attendance, leave requests, growth reports, moderated works with version-bound revocable consent.
- All prices integer fen. Never publish incomplete teachers/prices/schedules/terms as actual courses; seeds distinguish draft curriculum and test fixtures.

## Design
- Orange #FF7A00 with #1D1D1F text; background #F5F5F7; white cards; pale orange #FFF3E8; links #C94B00; secondary #6E6E73.
- 48px primary buttons, minimum44px hit targets, card16px/button12px/sheet24px radius, page/card padding16, gaps12/24. Body16 and secondary14 at375px reference width.
- Purposeful short motion, visible pressed/loading/error/empty/success states, reduced-motion option. Platform auth/payment/navigation remain native.
- Applied filters/scroll restored onback; temporary filters require apply; stale request responses rejected.
- Student-specific form/submission drafts. Uploaded is not submitted. Payment result unknown stays pending until server confirmation.
- Safe areas, keyboard,320–430px and large-font verification; screenshots of normal and failure states, real-device validation separate from H5.

## Delivery and validation
M0 fixed source, reproducible database, original account/product/order/payment-test/refund/restart flow.
M1 design contracts and linked prototypes. M2 catalog/children/campuses/trials. M3 course trade integration. M4 teaching/works. M5 device, weak network, ownership, recovery and pilot.
Use upstream test frameworks; use actual MySQL for transactional/concurrency cases. No production mock payment or authorization bypass. Actual merchant/miniapp credentials and device testing are release dependencies, not simulated successes.
Deliver source/provenance/licenses, reuse matrix, migrations/data dictionary, APIs, deployment/runbooks, six original eight-lesson draft courses plus trial template, test results and UI evidence.

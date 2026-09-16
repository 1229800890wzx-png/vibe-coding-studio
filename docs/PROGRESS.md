# Implementation ledger — docs/IMPLEMENTATION_PLAN.md

## State
- Active branch: codex/vibe-edu; isolated worktree C:/Users/12298/.codex/worktrees/vibe-edu.
- Original website baseline: `npm run check` and `npm run build` passed before changes.
- 2026-09-14: local foundation and application implementation verified. Original accounts/commerce/payments/CRM, education workflows, production migration package and browser evidence are delivered; final report index is [verification/README.md](verification/README.md).
- M5 external acceptance remains open: real WeChat identities/merchant channels/COS, iPhone and Android devices, institution-approved commercial content and pilot operation. No production deployment or real merchant transaction performed.

## Ownership
| Workstream | Owner | Boundaries |
|---|---|---|
| Foundation | runtime_database | apps/server upstream import, runtime config, public-source base database, infra/bootstrap |
| Miniapp | miniapp_implementation | apps/miniapp, docs/MINIAPP.md |
| Admin | admin_implementation | apps/admin, docs/ADMIN.md |
| Integration/education | root | docs/contracts, education backend module, course trade adaptation, integration/review |

## Dependency review
| Producer / consumer | Shared contract | Decision |
|---|---|---|
| Foundation / education | Backend parent POM and original DB models | Foundation enables original modules; root adds edu after import/config handoff. |
| Education / miniapp / admin | Existing API envelopes and edu routes | Publish central API contract, preserve upstream auth and transaction interfaces. |
| Trade / education | Inventory and enrollment | Existing SKU.stock only; education handlers never deduct twice. |
| Trade / miniapp | studentId cart/order identity | Carry through all DTO/BO conversions and aggregate stock per SKU. |
| Refund / transfer | Current enrollment and sale snapshot | KEEP/CANCEL explicit; release current SKU once; historical order unchanged. |
| Curriculum / publication | Draft vs real services | Draft content only until valid commercial details; test fixtures marked. |

## Rulings
- Fixed source baseline from public archives, vendored into apps/* without nested git; permits review and delivery of all modifications in one repository.
- Original website stays unchanged. Isolated worktree avoids editing master.
- Use local-only services and portable toolchains; no paid SQL package, new external accounts, production secrets or public deployment.
- Missing runtime tools are implementation work, not a reason to ask the user to repeat authorization.

## Verification log
- 2026-09-12: root website baseline typecheck/build PASS.

## Initial implementation history (2026-09-12; superseded by current reports)
- Fixed upstream archives imported with MIT notices retained; upstream.lock.json records exact revisions.
- Original admin production build and miniapp H5 / WeChat builds passed first round. Browser fixture smoke and guest/error-state checks recorded by client workers; live education testing pending.
- Independent Ubuntu WSL Docker Engine runs MySQL 8.4.11 and Redis on local loopback ports. Docker Desktop socket remains untouched after automatic approval rejection.
- Empty MySQL initialization passed: 171 tables initially, 95 source-derived business tables with 1597 fields before education trade-column extensions. Original admin/member login, RBAC, settlement, order, test payment and asynchronous refund final state verified.
- Root education model uses original TenantBaseDO/BaseMapperX; course/cohort/student/trial/scheduling/submissions/reviews/reports/consent/controllers implemented. Integration and concurrency testing remain in progress.
- Original 6×8 curriculum drafts and 60-minute trial template generated; no real courses auto-published.
- Education-owned file grants call original infra storage; public download endpoints reject reserved paths, private streaming rechecks original session and business scope.

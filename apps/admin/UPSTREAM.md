# Upstream provenance

This application is an in-place extension of yudaocode/yudao-ui-admin-vue3, not a parallel administration or authentication system.

- Source: https://github.com/yudaocode/yudao-ui-admin-vue3
- Commit: `aab14fb0e74720dd09e964ae066f8bbde9f9012e`
- Imported GitHub source archive SHA-256: `4a8792498adb8c88458ee20d95bef762956b3404932dd1fffa4fca0f728ed0c3`
- Upstream license: MIT; preserved at `LICENSE`.
- No nested Git repository. Original source files, login/auth, dynamic RBAC, member, trade, payment, refund, product, file and infrastructure modules are retained.
- VIBE changes: education views/API, workbench, branded login/theme, focused route import graph. AI/BPM/ERP/CRM/FMS/HRM/IM/IoT/MES/MP/OA/PMS/report/WMS routes are disabled for this deployment; original sources remain for provenance.
- Original lockfile retained. Tested Node 24.14.0 / pnpm 10.32.1. `packageManager` pins pnpm 10.32.1.

The browser smoke fixture in `tests/smoke.playwright.js` intercepts requests only in an explicitly started test browser. The application contains no mock-data fallback or authentication bypass.

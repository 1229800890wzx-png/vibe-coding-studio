# Upstream provenance

This is a source-level second development of [yudaocode/yudao-mall-uniapp](https://github.com/yudaocode/yudao-mall-uniapp), pinned to commit `3c4bf3864415054a88fe616a414e098972329412` (2026-08 source).

- Imported via GitHub commit archive; no nested Git repository.
- Archive SHA-256: `ba4c5874f8a23d09edeaa1182a87d0134b95fe138746dc4b8aff6c54a7c3b768`.
- Original MIT notice is retained in `LICENSE` (Copyright 2022 lidongtony).
- Original pages/components/API modules remain in the source tree. The education routes are registered in `pages.json`; unrelated retail screens are intentionally not registered in this app.
- Reused execution paths: original `sheep/request` token refresh/envelope/tenant headers, original member auth and user Pinia store, original cart/order/aftersale/pay APIs, original platform payment providers, original public richtext/webview and component library.
- Education changes: `edu/`, `components/edu/`, `pages/tab/`, `pages/edu/`, adapted payment screens, child-aware settlement serialization, dynamic environment config, standalone CLI setup, lazy imports fixing the upstream dev-mode circular initialization, and a native H5 tab-bar CSS compatibility override.
- Original bundled demo app IDs, hosted production API defaults and vendor app metadata have been removed from active config. No runtime demo fallback is implemented.

Standalone CLI versions were pinned from the [official DCloud Vite preset](https://github.com/dcloudio/uni-preset-vue/tree/vite): `@dcloudio/* 3.0.0-5020420260813003`, Vue `3.4.21`, Vite `5.2.8`, Rollup `4.14.3`. See `package-lock.json` for the exact resolved dependency graph.

Artwork under `static/edu` is copied from this workspace's existing original VIBE CODING showcase assets; it is separate from the upstream MIT source attribution.

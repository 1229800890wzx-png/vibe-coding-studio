import { loadEnv } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
import path from 'node:path';
import fs from 'node:fs';
export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const pages = JSON.parse(fs.readFileSync(path.resolve('pages.json'), 'utf8'));
  const routes = [
    ...pages.pages.map((p) => ({ ...p, path: '/' + p.path })),
    ...(pages.subPackages || []).flatMap((g) =>
      g.pages.map((p) => ({ ...p, path: '/' + g.root + '/' + p.path })),
    ),
  ];
  return {
    envPrefix: ['VITE_', 'SHOPRO_'],
    plugins: [uni()],
    define: {
      ROUTES: routes,
      ROUTES_MAP: Object.fromEntries(routes.map((p) => [p.path, p])),
      TABBAR: pages.tabBar.list.map((p) => '/' + p.pagePath),
    },
    server: {
      host: '127.0.0.1',
      port: 5174,
      proxy: {
        '/app-api': { target: env.VITE_API_PROXY || 'http://127.0.0.1:48080', changeOrigin: true },
      },
    },
  };
};

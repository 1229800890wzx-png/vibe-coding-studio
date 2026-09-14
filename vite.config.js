import { defineConfig } from 'vite';
import { websiteApiProxy } from './scripts/website-proxy.mjs';

export default defineConfig({
  plugins: [{
    name: 'shared-education-api',
    configureServer(server) { server.middlewares.use(websiteApiProxy); },
    configurePreviewServer(server) { server.middlewares.use(websiteApiProxy); },
  }],
});

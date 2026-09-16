import './patch-uni-h5.mjs';
process.env.UNI_INPUT_DIR = process.cwd();
await import('@dcloudio/vite-plugin-uni/bin/uni.js');

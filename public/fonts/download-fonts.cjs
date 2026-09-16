const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const dir = __dirname;
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
async function get(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try { const response = await fetch(url, {signal:AbortSignal.timeout(30000)}); if(!response.ok) throw Error(`${response.status} ${url}`); return Buffer.from(await response.arrayBuffer()); }
    catch(error) { if(attempt===2) throw error; }
  }
}
(async () => {
  const css = fs.readFileSync(path.join(dir, 'google-fonts-original.css'), 'utf8');
  const request = JSON.parse(fs.readFileSync(path.join(dir, 'google-fonts-request.json'), 'utf8'));
  const urls = [...new Set([...css.matchAll(/url\(([^)]+)\)/g)].map(match => match[1]))];
  if (urls.some(url => new URL(url).hostname !== 'fonts.gstatic.com' || !url.endsWith('.woff2'))) throw Error('Unexpected font asset source');
  const assets = [];
  for(let start = 0; start < urls.length; start += 8) {
    await Promise.all(urls.slice(start,start+8).map(async url => {
      const bytes = await get(url);
      if(bytes.toString('ascii',0,4) !== 'wOF2') throw Error('Downloaded asset is not WOFF2');
      const sha256 = digest(bytes);
      const family = url.includes('/cormorantgaramond/') ? 'Cormorant Garamond' : 'Noto Sans SC';
      const file = `${family === 'Noto Sans SC' ? 'noto-sans-sc' : 'cormorant-garamond'}-${sha256.slice(0,12)}.woff2`;
      fs.writeFileSync(path.join(dir,file),bytes);
      assets.push({family,file,url,bytes:bytes.length,sha256});
    }));
  }
  const licenses = [];
  for(const family of [{directory:'notosanssc',family:'Noto Sans SC',file:'LICENSE-Noto-Sans-SC.txt'},{directory:'cormorantgaramond',family:'Cormorant Garamond',file:'LICENSE-Cormorant-Garamond.txt'}]){
    const url=`https://raw.githubusercontent.com/google/fonts/main/ofl/${family.directory}/OFL.txt`;
    const bytes=await get(url);
    if(!bytes.toString('utf8').includes('SIL OPEN FONT LICENSE')) throw Error('Expected official OFL license');
    fs.writeFileSync(path.join(dir,family.file),bytes);
    const metadataUrl=`https://raw.githubusercontent.com/google/fonts/main/ofl/${family.directory}/METADATA.pb`;
    const metadata=await get(metadataUrl);
    fs.writeFileSync(path.join(dir,`${family.directory}-METADATA.pb`),metadata);
    licenses.push({family:family.family,file:family.file,url,sha256:digest(bytes),metadataUrl,metadataSha256:digest(metadata)});
  }
  const urlMap = new Map(assets.map(asset => [asset.url,asset.file]));
  const localCss = css.replace(/url\(([^)]+)\)/g,(_,url) => `url('./${urlMap.get(url)}')`);
  if(localCss.includes('https://fonts.gstatic.com')) throw Error('External CSS URL remained');
  fs.writeFileSync(path.join(dir,'font-faces.css'),`/* Locally hosted, unmodified official Google Fonts WOFF2 assets.\n   Noto Sans SC: normal 400 / 600. Cormorant Garamond: italic 500.\n   Unicode ranges preserved; no text= phrase-specific subset. See sources.json and LICENSE files. */\n${localCss}`);
  assets.sort((a,b)=>a.file.localeCompare(b.file));
  const manifest={downloadedAt:new Date().toISOString(),request,assetCount:assets.length,totalFontBytes:assets.reduce((sum,a)=>sum+a.bytes,0),cssRules:(css.match(/@font-face/g)||[]).length,note:'All Unicode-range shards returned by the official Google Fonts request are retained. Identical URLs shared by 400 and 600 face rules download once. Binary font data is not modified.',licenses,assets};
  fs.writeFileSync(path.join(dir,'sources.json'),JSON.stringify(manifest,null,2));
  console.log(JSON.stringify({assets:assets.length,totalFontBytes:manifest.totalFontBytes,totalMiB:(manifest.totalFontBytes/1024/1024).toFixed(2),families:[...new Set(assets.map(a=>a.family))],cssRules:manifest.cssRules},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});

import {spawn} from 'node:child_process';
import crypto from 'node:crypto';
import {cp,mkdir,readdir,readFile,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const stamp=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date()).replace(/[-: ]/g,'');
const release=path.join(root,'output',`unified-release-${stamp}`),bundle=path.join(release,'vibe-unified'),zip=path.join(release,'vibe-unified.zip');
const entries=[
 ['dist','website/dist'],['scripts/serve.mjs','website/scripts/serve.mjs'],['scripts/website-proxy.mjs','website/scripts/website-proxy.mjs'],
 ['apps/admin/dist-prod','admin/dist-prod'],['apps/server/yudao-server/target/yudao-server.jar','server/yudao-server.jar'],
 ['apps/miniapp/dist/build/h5','miniapp/h5'],['apps/miniapp/dist/build/mp-weixin','miniapp/mp-weixin'],
 ['infra/migration','infra/migration'],['infra/templates','infra/templates'],
 ['infra/website-content.json','infra/website-content.json'],['tooling/bootstrap/import-website-content.mjs','tooling/bootstrap/import-website-content.mjs'],
 ['tooling/bootstrap/run-production-migrations.mjs','tooling/bootstrap/run-production-migrations.mjs'],['tooling/bootstrap/prepare-tools.ps1','tooling/bootstrap/prepare-tools.ps1'],['tooling/bootstrap/maven-settings.xml','tooling/bootstrap/maven-settings.xml'],
 ['apps/admin/LICENSE','licenses/apps-admin-LICENSE'],['apps/admin/UPSTREAM.md','licenses/apps-admin-UPSTREAM.md'],
 ['apps/server/LICENSE','licenses/apps-server-LICENSE'],['apps/server/UPSTREAM.json','licenses/apps-server-UPSTREAM.json'],
 ['apps/miniapp/LICENSE','licenses/apps-miniapp-LICENSE'],['apps/miniapp/UPSTREAM.md','licenses/apps-miniapp-UPSTREAM.md'],
 ['public/licenses','licenses/website'],['docs/UNIFIED_BACKEND.md','docs/UNIFIED_BACKEND.md'],['docs/OPERATIONS.md','docs/OPERATIONS.md'],
 ['docs/ADMIN.md','docs/ADMIN.md'],['docs/MINIAPP.md','docs/MINIAPP.md'],
 ['docs/verification/2026-09-14-unified-backend.md','docs/verification/2026-09-14-unified-backend.md']
];
const forbidden=/(^|\/)(?:\.runtime|\.tools|node_modules|backups?)(?:\/|$)|(?:^|\/)(?:private\.env|\.env(?:\..*)?|(?:secrets?|credentials?|passwords?)\.(?:env|json|ya?ml|txt))(?:$|\/)/i;
const literal=value=>`'${value.replaceAll("'","''")}'`;
async function walk(directory,prefix='') {const files=[];for(const item of await readdir(directory,{withFileTypes:true})){const relative=prefix?`${prefix}/${item.name}`:item.name,absolute=path.join(directory,item.name);if(item.isDirectory())files.push(...await walk(absolute,relative));else if(item.isFile())files.push({relative,absolute});else throw Error(`Unsupported release entry: ${relative}`);}return files;}
async function compress(source,destination){const command=["$ErrorActionPreference='Stop'","$ProgressPreference='SilentlyContinue'",`if(Test-Path -LiteralPath ${literal(destination)}){throw 'Archive already exists'}`,`Compress-Archive -LiteralPath ${literal(source)} -DestinationPath ${literal(destination)} -CompressionLevel Optimal -ErrorAction Stop`].join('\n');await new Promise((resolve,reject)=>{const child=spawn('powershell.exe',['-NoLogo','-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(command,'utf16le').toString('base64')],{cwd:root,windowsHide:true,stdio:['ignore','ignore','pipe']});let error='';child.stderr.on('data',data=>error=(error+data).slice(-4000));child.on('error',reject);child.on('close',code=>code===0?resolve():reject(Error(`ZIP compression failed (${code}): ${error}`)));});}
async function inspectArchive(archive){const command=["$ErrorActionPreference='Stop'","Add-Type -AssemblyName System.IO.Compression.FileSystem",`$zip=[IO.Compression.ZipFile]::OpenRead(${literal(archive)})`,"try { foreach($entry in $zip.Entries) { $name=$entry.FullName.Replace('\\','/'); if($name -match '(^|/)(\.runtime|\.tools|node_modules|backups?)(/|$)' -or $name -match '(^|/)(private\.env|\.env(\..*)?|(secrets?|credentials?|passwords?)\.(env|json|ya?ml|txt))($|/)') { throw \"Forbidden ZIP path: $name\" } } } finally { $zip.Dispose() }"].join('\n');await new Promise((resolve,reject)=>{const child=spawn('powershell.exe',['-NoLogo','-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(command,'utf16le').toString('base64')],{cwd:root,windowsHide:true,stdio:['ignore','ignore','pipe']});let error='';child.stderr.on('data',data=>error=(error+data).slice(-4000));child.on('error',reject);child.on('close',code=>code===0?resolve():reject(Error(`ZIP inspection failed (${code}): ${error}`)));});}

if(process.platform!=='win32')throw Error('Packaging requires Windows PowerShell Compress-Archive');
if(await stat(release).catch(()=>null))throw Error(`Release directory already exists: ${release}`);
for(const [source]of entries)if(!await stat(path.join(root,source)).catch(()=>null))throw Error(`Required allowlisted artifact missing: ${source}`);
await mkdir(bundle,{recursive:true});
for(const [source,destination]of entries){const target=path.join(bundle,destination);await mkdir(path.dirname(target),{recursive:true});await cp(path.join(root,source),target,{recursive:true,errorOnExist:true,force:false});}
let files=await walk(bundle);for(const file of files)if(forbidden.test(file.relative))throw Error(`Forbidden release path: ${file.relative}`);
const manifest={schemaVersion:1,createdAt:new Date().toISOString(),package:'vibe-unified',files:{}};
for(const file of files.sort((a,b)=>a.relative.localeCompare(b.relative))){const content=await readFile(file.absolute);manifest.files[file.relative]={bytes:content.length,sha256:crypto.createHash('sha256').update(content).digest('hex')};}
await writeFile(path.join(bundle,'SHA256-MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
await compress(bundle,zip);
await inspectArchive(zip);
files=await walk(bundle);for(const file of files)if(forbidden.test(file.relative))throw Error(`Forbidden release path after packaging: ${file.relative}`);
const zipInfo=await stat(zip);
process.stdout.write(JSON.stringify({release,bundle,zip,zipBytes:zipInfo.size,manifestFiles:Object.keys(manifest.files).length,bundleContentBytes:Object.values(manifest.files).reduce((sum,file)=>sum+file.bytes,0),forbiddenPaths:0},null,2)+'\n');

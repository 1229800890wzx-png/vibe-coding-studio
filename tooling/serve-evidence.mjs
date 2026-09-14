/** Read-only local documentation preview; serves only docs/, never runtime credentials or source. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../docs');
const types={'.html':'text/html; charset=utf-8','.png':'image/png','.webm':'video/webm','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8','.svg':'image/svg+xml'};
http.createServer((request,response)=>{
  if(request.method!=='GET'&&request.method!=='HEAD'){response.writeHead(405);response.end();return;}
  try{
    const url=new URL(request.url,'http://localhost');
    const name=decodeURIComponent(url.pathname==='/'?'/screenshots/index.html':url.pathname);
    const target=path.resolve(root,'.'+name);
    if(!target.startsWith(root+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){response.writeHead(404);response.end('Not found');return;}
    const stat=fs.statSync(target);
    response.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Content-Length':stat.size,'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});
    if(request.method==='HEAD')response.end();else fs.createReadStream(target).pipe(response);
  }catch{response.writeHead(400);response.end('Invalid request');}
}).listen(49100,'127.0.0.1',()=>console.log('Evidence gallery: http://127.0.0.1:49100/screenshots/index.html'));

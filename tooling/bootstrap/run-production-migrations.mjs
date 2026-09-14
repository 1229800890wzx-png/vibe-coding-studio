/** Guarded launcher for the original Liquibase OSS engine. This is not a migration
 * ledger or SQL executor: Liquibase validates, previews, locks and applies changes. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const [action,configPath,...flags]=process.argv.slice(2);
const goals={validate:'validate',status:'status',preview:'update-sql',migrate:'update'};
assert(goals[action]&&configPath,'Usage: node tooling/bootstrap/run-production-migrations.mjs validate|status|preview|migrate <private-config.json> [--local-test]');
assert(flags.every(flag=>flag==='--local-test'),'Unsupported migration flag');
const c=JSON.parse(fs.readFileSync(path.resolve(configPath),'utf8'));
const local=flags.includes('--local-test');
assert(/^[a-zA-Z0-9_.-]+$/.test(c.host||''),'Invalid database host');
assert(Number.isInteger(c.port)&&c.port>0&&c.port<65536,'Invalid database port');
assert(/^[a-z][a-z0-9_]{2,63}$/.test(c.database||''),'Invalid database name');
assert(c.confirmDatabase===c.database,'Private configuration must name the exact confirmed target database');
assert(typeof c.username==='string'&&c.username&&typeof c.password==='string'&&c.password,'Database credentials are required');
if(local)assert(['127.0.0.1','localhost'].includes(c.host)&&/^vibe_edu_migration_test_\d+$/.test(c.database),'Local proof is restricted to an independently named migration-test database');
else assert(!['vibe_edu','mysql','sys','performance_schema','information_schema'].includes(c.database),'Do not point the production launcher at the development or system database');
assert(/^[A-Za-z0-9_-]{3,30}$/.test(c.adminUsername||''),'Bootstrap admin username must be 3–30 safe characters');
assert(/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(c.adminPasswordHash||''),'Supply an original-compatible BCrypt password hash; there is no default password');
assert(/^[a-fA-F0-9]{64,128}$/.test(c.oauthSecret||''),'Supply an independent random 32-byte or longer hexadecimal OAuth secret');
assert(Array.isArray(c.adminRedirectUris)&&c.adminRedirectUris.length>0,'At least one approved admin redirect URI is required');
for(const uri of c.adminRedirectUris){assert(typeof uri==='string'&&!/[\u0000-\u0020'\\]/.test(uri),'Unsafe redirect URI');const u=new URL(uri);assert(u.protocol==='https:'||(local&&u.protocol==='http:'&&['127.0.0.1','localhost'].includes(u.hostname)),'Production redirect URIs require HTTPS');assert(!u.username&&!u.password,'Redirect URI cannot contain credentials');}
const redirects=JSON.stringify(c.adminRedirectUris);assert(redirects.length<=255,'Original OAuth redirect_uris column allows 255 characters');
const base=path.join(root,'infra/migration'),manifest=JSON.parse(fs.readFileSync(path.join(base,'source-manifest.json'),'utf8'));
for(const [file,expected]of Object.entries(manifest.files)){assert(!file.includes('..'),'Invalid manifest path');assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(base,file))).digest('hex'),expected,`Migration asset checksum changed: ${file}`);}
const directory=path.join(root,'.runtime/production-migration',c.database);fs.mkdirSync(directory,{recursive:true});
const preview=path.join(directory,'preview.sql'),log=path.join(directory,`${action}.log`);
const env={...process.env,JAVA_HOME:path.join(root,'.tools/jdk-21'),VIBE_MAVEN_CMD:path.join(root,'.tools/apache-maven-3.9.9/bin/mvn.cmd'),VIBE_MAVEN_SETTINGS:path.join(root,'tooling/bootstrap/maven-settings.xml'),VIBE_MIGRATION_POM:path.join(base,'pom.xml'),VIBE_MIGRATION_GOAL:'exec:java',VIBE_LIQUIBASE_COMMAND:goals[action],
 VIBE_MIGRATION_JDBC_URL:`jdbc:mysql://${c.host}:${c.port}/${c.database}?useUnicode=true&characterEncoding=utf8&connectionTimeZone=Asia/Shanghai&sslMode=${local?'DISABLED':'VERIFY_IDENTITY'}${local?'&allowPublicKeyRetrieval=true':''}`,
 VIBE_MIGRATION_USER:c.username,VIBE_MIGRATION_PASSWORD:c.password,VIBE_MIGRATION_PREVIEW:preview,
 VIBE_BOOTSTRAP_ADMIN_USERNAME:c.adminUsername,VIBE_BOOTSTRAP_ADMIN_PASSWORD_HASH:c.adminPasswordHash,VIBE_BOOTSTRAP_OAUTH_SECRET:c.oauthSecret,VIBE_BOOTSTRAP_ADMIN_REDIRECT_URIS:redirects};
env.VIBE_LIQUIBASE_DEFAULTS=path.join(directory,'liquibase.properties');
const properties={changeLogFile:'db.changelog.xml',searchPath:base.replaceAll('\\','/'),url:env.VIBE_MIGRATION_JDBC_URL,username:c.username,password:c.password,driver:'com.mysql.cj.jdbc.Driver','parameter.bootstrapAdminUsername':c.adminUsername,'parameter.bootstrapAdminPasswordHash':c.adminPasswordHash,'parameter.bootstrapOAuthSecret':c.oauthSecret,'parameter.adminRedirectUris':redirects};
if(action==='preview')properties.outputFile=preview.replaceAll('\\','/');
// java.util.Properties escaping, including Unicode, avoids platform charset and
// control-character ambiguity while keeping secrets out of command-line arguments.
const escapeProperty=value=>String(value).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/\r/g,'\\r').replace(/[^\x20-\x7E]/g,ch=>'\\u'+ch.charCodeAt(0).toString(16).padStart(4,'0')).replace(/^ +/,spaces=>spaces.replaceAll(' ','\\ '));
fs.writeFileSync(env.VIBE_LIQUIBASE_DEFAULTS,Object.entries(properties).map(([key,value])=>key+'='+escapeProperty(value)).join('\n')+'\n',{mode:0o600});
assert(fs.existsSync(path.join(env.JAVA_HOME,'bin/java.exe')),'Prepare portable Java21 before running migrations');
// Static PowerShell command: credentials stay in the child environment, never argv.
const child=spawn('powershell.exe',['-NoProfile','-NonInteractive','-Command','& $env:VIBE_MAVEN_CMD -B -ntp -s $env:VIBE_MAVEN_SETTINGS -f $env:VIBE_MIGRATION_POM $env:VIBE_MIGRATION_GOAL; exit $LASTEXITCODE'],{cwd:base,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
let output='';child.stdout.on('data',chunk=>output+=chunk);child.stderr.on('data',chunk=>output+=chunk);
const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve);});
// Error SQL can include substituted bootstrap values; redact logs even though
// generated previews and configuration already live in the ignored runtime folder.
for(const secret of[c.password,c.adminPasswordHash,c.oauthSecret])output=output.replaceAll(secret,'[REDACTED]');
fs.writeFileSync(log,output);
if(code!==0){console.error(output.split(/\r?\n/).filter(line=>/ERROR|failed|Failed/.test(line)).slice(-8).join('\n'));throw Error(`Liquibase ${action} failed; redacted log: ${log}`);}
console.log(`PASS: Liquibase ${action}; database ${c.database}; ${action==='preview'?'private SQL preview: '+preview:'redacted log: '+log}`);

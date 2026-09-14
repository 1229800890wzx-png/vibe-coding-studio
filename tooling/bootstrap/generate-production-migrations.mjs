/** Build the first unreleased production baseline from reviewed public sources.
 * Does not connect to a database. After release, append new Liquibase changesets;
 * never refresh a baseline that has been deployed to a real environment. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const destination=path.join(root,'infra/migration');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const paths={system:'apps/server/sql/mysql/ruoyi-vue-pro.sql',business:'infra/database/20-public-business-models.sql',education:'infra/sql/education.sql',quartz:'apps/server/sql/mysql/quartz.sql',menus:'infra/sql/education-menus.sql',reconcile:'infra/database/21-public-model-reconciliations.sql',overrides:'infra/database/model-overrides.json',sourceManifest:'infra/database/source-manifest.json'};
const sources=Object.fromEntries(Object.entries(paths).map(([key,p])=>[key,{path:p,sha256:hash(read(p))}]));
function ddl(sql){return[...sql.matchAll(/^CREATE TABLE\s[\s\S]*?^\)[^\n;]*;/gm)].map(m=>m[0].replace(/\bAUTO_INCREMENT\s*=\s*\d+\s*/g,'').replace(/CREATE TABLE IF NOT EXISTS/g,'CREATE TABLE'));}
function table(statement){return statement.match(/^CREATE TABLE\s+`?([\w]+)`?/)[1];}
const system=ddl(read(paths.system)),business=ddl(read(paths.business)),education=ddl(read(paths.education)),quartz=ddl(read(paths.quartz));
assert.equal(business.length,95);assert.equal(education.length,28);assert.equal(quartz.length,11);assert(system.length>40);
// Preserve original Quartz FK constraints while creating dependencies first.
const orderedQuartz=[],remaining=[...quartz],created=new Set();
while(remaining.length){const index=remaining.findIndex(sql=>[...sql.matchAll(/REFERENCES\s+`?([\w]+)`?/g)].every(m=>created.has(m[1])));assert(index>=0,'Unexpected cyclic Quartz DDL');const [sql]=remaining.splice(index,1);created.add(table(sql));orderedQuartz.push(sql);}
const seedTables=new Set(['system_dict_type','system_dict_data','system_menu']);
const seeds=read(paths.system).split(/\r?\n/).filter(line=>{const m=line.match(/^INSERT INTO `([^`]+)`/);return m&&seedTables.has(m[1]);});
assert(seeds.length>100);
const baselineSqls={
 '001-original-system-infra.sql':system.join('\n\n'),
 '002-original-business.sql':business.join('\n\n'),
 '003-education.sql':education.join('\n\n'),
 '004-original-quartz.sql':orderedQuartz.join('\n\n'),
 '005-original-navigation-dictionaries.sql':seeds.join('\n'),
 '006-production-bootstrap.sql':`-- Original identity/configuration models only. Values are supplied from private environment variables.
INSERT INTO system_tenant(id,name,contact_user_id,contact_name,contact_mobile,status,websites,package_id,expire_time,account_count) VALUES(1,'VIBE CODING',1,'机构负责人',NULL,0,'[]',0,'2099-12-31 23:59:59',1000);
INSERT INTO system_dept(id,name,parent_id,sort,status,tenant_id) VALUES(1,'VIBE CODING',0,0,0,1);
INSERT INTO system_users(id,username,password,nickname,dept_id,post_ids,status,tenant_id) VALUES(1,'\${bootstrapAdminUsername}','\${bootstrapAdminPasswordHash}','机构管理员',1,'[]',0,1);
INSERT INTO system_role(id,name,code,sort,data_scope,data_scope_dept_ids,status,type,tenant_id) VALUES(1,'机构超级管理员','super_admin',0,1,'[]',0,1,1);
INSERT INTO system_user_role(user_id,role_id,tenant_id) VALUES(1,1,1);
INSERT INTO system_oauth2_client(id,client_id,secret,name,logo,status,access_token_validity_seconds,refresh_token_validity_seconds,redirect_uris,authorized_grant_types,scopes,auto_approve_scopes) VALUES(1,'default','\${bootstrapOAuthSecret}','VIBE CODING','',0,1800,2592000,'\${adminRedirectUris}','["password","refresh_token","authorization_code"]','[]','[]');
INSERT INTO member_config(id,point_trade_deduct_enable,point_trade_deduct_unit_price,point_trade_deduct_max_price,point_trade_give_point,tenant_id) VALUES(1,b'0',1,0,0,1);
INSERT INTO trade_config(id,after_sale_refund_reasons,after_sale_return_reasons,delivery_express_free_enabled,delivery_express_free_price,delivery_pick_up_enabled,brokerage_enabled,brokerage_enabled_condition,brokerage_bind_mode,brokerage_poster_urls,brokerage_first_percent,brokerage_second_percent,brokerage_withdraw_min_price,brokerage_withdraw_fee_percent,brokerage_frozen_days,brokerage_withdraw_types,tenant_id) VALUES(1,'["课程服务退款"]','[]',b'0',0,b'0',b'0',1,1,'[]',0,0,0,0,0,'[]',1);
-- Keep retained upstream source/navigation records hidden outside the deployed domains.
UPDATE system_menu SET visible=b'0',status=1 WHERE parent_id=0 AND path NOT IN('/system','/infra','/member','/pay','/mall','/product','/trade','/promotion','/statistics','/edu');
UPDATE system_menu SET visible=b'0',status=1 WHERE component IN('infra/testDemo/index','pay/demo/index');
INSERT INTO system_dict_data(sort,label,value,dict_type,status,color_type,css_class,remark) SELECT 3,'教学服务','3','trade_delivery_type',0,'primary','','原订单教学权益交付' WHERE NOT EXISTS(SELECT 1 FROM system_dict_data WHERE dict_type='trade_delivery_type' AND value='3' AND deleted=b'0');`,
 '007-education-navigation-notification.sql':read(paths.menus)+`\nINSERT INTO system_role_menu(role_id,menu_id,tenant_id) SELECT 1,id,1 FROM system_menu WHERE status=0 AND deleted=b'0';`,
 '008-original-model-reconciliations.sql':read(paths.reconcile)
};
for(const [name,sql]of Object.entries(baselineSqls)){
  assert(!/^\s*(DROP|TRUNCATE|DELETE|USE|CREATE DATABASE)\b/im.test(sql),`${name} cannot contain destructive/reset/database-switch SQL`);
  assert(!/^INSERT INTO\s+`?(member_user|pay_channel|pay_app|trade_order|trade_order_item|product_spu|product_sku|edu_course|edu_student|edu_cohort|infra_job|infra_file_config)`?\s/im.test(sql),`${name} cannot import development fixtures`);
}
const xml=`<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog xmlns="http://www.liquibase.org/xml/ns/dbchangelog" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog https://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.33.xsd" logicalFilePath="vibe/production/db.changelog.xml">
  <preConditions onFail="HALT"><dbms type="mysql"/><sqlCheck expectedResult="1">SELECT IF(VERSION() LIKE '8.4.%',1,0)</sqlCheck></preConditions>
${Object.keys(baselineSqls).map((file,i)=>`  <changeSet id="${String(i+1).padStart(3,'0')}" author="vibe" runInTransaction="false">${i===0?`\n    <preConditions onFail="HALT"><sqlCheck expectedResult="0">SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND UPPER(table_name) NOT IN('DATABASECHANGELOG','DATABASECHANGELOGLOCK')</sqlCheck></preConditions>`:''}
    <sqlFile path="sql/${file}" relativeToChangelogFile="true" encoding="UTF-8" splitStatements="true" stripComments="false"/>
  </changeSet>`).join('\n')}
</databaseChangeLog>\n`;
const baselineFiles={...Object.fromEntries(Object.entries(baselineSqls).map(([name,sql])=>['sql/'+name,'-- Production baseline; generated from reviewed public sources. No development fixtures.\n'+sql+'\n'])),'pom.xml':read('infra/migration/pom.xml')};
const additions=[
 {id:'009',file:'sql/009-website-admission.sql',purpose:'website admission receipt technical table',tables:1},
 {id:'010',file:'sql/010-website-management.sql',purpose:'website offering content table and permissions',tables:1}
];
const check=process.argv.includes('--check'),refresh=process.argv.includes('--refresh-unreleased');
const hasAdditions=additions.some(({file})=>fs.existsSync(path.join(destination,file)));
if(!check&&hasAdditions)throw Error('Refusing to regenerate or refresh an extended migration bundle; append migrations without rebuilding changesets 001-008');
if(check){
  for(const [file,content]of Object.entries(baselineFiles))assert.equal(fs.readFileSync(path.join(destination,file),'utf8'),content,`Frozen production baseline drift: ${file}`);
  const actualManifest=JSON.parse(fs.readFileSync(path.join(destination,'source-manifest.json'),'utf8'));
  const changelog=fs.readFileSync(path.join(destination,'db.changelog.xml'),'utf8');
  const expectedFiles={...Object.fromEntries(Object.entries(baselineFiles).map(([name,content])=>[name,hash(content)]))};
  const expectedChangesets=[...Object.keys(baselineSqls).map((file,index)=>({id:String(index+1).padStart(3,'0'),file:'sql/'+file})),...additions];
  const referencedChangesets=[...changelog.matchAll(/<changeSet\s+id="([^"]+)"[\s\S]*?<sqlFile\s+path="([^"]+)"[\s\S]*?<\/changeSet>/g)].map(match=>({id:match[1],file:match[2]}));
  assert.deepEqual(referencedChangesets,expectedChangesets.map(({id,file})=>({id,file})),'Changelog must reference changesets 001-010 exactly once and in order');
  for(const addition of additions){
    const content=fs.readFileSync(path.join(destination,addition.file),'utf8');
    expectedFiles[addition.file]=hash(content);
  }
  expectedFiles['db.changelog.xml']=hash(changelog);
  const expectedManifest={schemaVersion:1,baseline:'initial-production-baseline-unreleased',bundle:'baseline-001-008-with-additive-migrations',upstreamCommit:'8e43004cf68a405cd3485f98f8a539b97ca6544a',migrationEngine:{name:'Liquibase OSS',version:'4.33.0',license:'Apache-2.0',licenseSource:'https://github.com/liquibase/liquibase/blob/v4.33.0/LICENSE.txt'},sources,tableCounts:{systemInfra:system.length,business:business.length,education:education.length,quartz:quartz.length,additiveEducation:2},additiveMigrations:additions,seedPolicy:'Only public dictionaries/menu definitions, original bootstrap admin/tenant/config, and education roles/menu/notification template; no members, courses, orders, mock channels, files or scheduler fixtures.',files:expectedFiles};
  assert.deepEqual(actualManifest,expectedManifest,'Migration manifest metadata, inventory, or checksums drifted');
  console.log(`Verified production Liquibase bundle: ${Object.values(actualManifest.tableCounts).reduce((a,b)=>a+b,0)} application tables across 10 changesets; frozen baseline 001-008 plus additions 009-010.`);
  process.exit(0);
}
const files={...baselineFiles,'db.changelog.xml':xml};
const manifest={schemaVersion:1,baseline:'initial-production-baseline-unreleased',upstreamCommit:'8e43004cf68a405cd3485f98f8a539b97ca6544a',migrationEngine:{name:'Liquibase OSS',version:'4.33.0',license:'Apache-2.0',licenseSource:'https://github.com/liquibase/liquibase/blob/v4.33.0/LICENSE.txt'},sources,tableCounts:{systemInfra:system.length,business:business.length,education:education.length,quartz:quartz.length},seedPolicy:'Only public dictionaries/menu definitions, original bootstrap admin/tenant/config, and education roles/menu/notification template; no members, courses, orders, mock channels, files or scheduler fixtures.',files:Object.fromEntries(Object.entries(files).map(([name,sql])=>[name,hash(sql)]))};
files['source-manifest.json']=JSON.stringify(manifest,null,2)+'\n';
for(const [file,content]of Object.entries(files)){
  const p=path.join(destination,file);
  if(fs.existsSync(p)&&fs.readFileSync(p,'utf8')!==content&&!refresh)throw Error(`Refusing to overwrite ${file}; review then use --refresh-unreleased only before release`);
  fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,content);
}
console.log(`Generated production Liquibase baseline: ${Object.values(manifest.tableCounts).reduce((a,b)=>a+b,0)} original/education tables; no development fixtures.`);

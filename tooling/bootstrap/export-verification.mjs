/** Publish only task-generated reports, never runtime config, raw logs, browser state or database dumps. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const runtime=path.join(root,'.runtime'), output=path.join(root,'docs/verification');
fs.mkdirSync(output,{recursive:true});
const env=Object.fromEntries(fs.readFileSync(path.join(runtime,'foundation.env'),'utf8').split(/\r?\n/).filter(Boolean).map(line=>{const i=line.indexOf('=');return[line.slice(0,i),line.slice(i+1)]}));
const secrets=Object.entries(env).filter(([key,value])=>/PASSWORD|SECRET|TOKEN/.test(key)&&value.length>=8).map(([,value])=>value);
const entries=[
 ['upstream-flow-report.json','原身份、商品、交易与支付退款'],
 ['education-flow-report.json','教育服务完整链路'],
 ['education-permissions-report.json','家长、教师、校区权限'],
 ['education-trade-report.json','多孩子、库存、部分退款和转班'],
 ['education-scheduling-report.json','实际 MySQL 排课并发'],
 ['education-recovery-report.json','原任务与退款恢复'],
 ['education-late-payment-report.json','迟到付款履约与原路退款'],
 ['education-coupon-report.json','原优惠券分摊及生命周期'],
 ['education-work-publication-report.json','作品版本、授权和私有文件'],
 ['education-notification-report.json','原家长站内通知'],
 ['education-review-report.json','点评并发版本与考勤隔离'],
 ['education-discovery-report.json','发布快照、筛选与排课预览'],
 ['education-brand-report.json','原配置服务与品牌编辑并发'],
 ['education-admissions-report.json','原 CRM 招生、负责人和团队权限'],
 ['education-admin-teaching-ui-report.json','真实后台教学操作'],
 ['admin-permission-debug-report.json','品牌公开读取与原账号类型隔离'],
 ['education-learning-ui-report.json','真实家长学习页面'],
 ['education-coupon-ui-report.json','真实结算页与优惠券交互'],
 ['education-discovery-ui-report.json','筛选、过期响应和失败重试'],
 ['education-admissions-ui-report.json','真实招生咨询页面'],
 ['education-upload-ui-report.json','单附件失败、重试及本地草稿'],
 ['education-video-report.json','结算与作业草稿操作录屏'],
 ['education-admin-video-report.json','批改与排课预览操作录屏'],
 ['education-payment-video-report.json','原报名付款及退款状态录屏'],
 ['education-screenshots-report.json','逐页浏览器截图采集'],
 ['education-privacy-ui-report.json','关闭默认外部统计'],
 ['production-migration-report.json','独立生产迁移包验收'],
 ['backup-restore-report.json','独立 MySQL 快照恢复'],
 ['runtime-persistence-report.json','原 Quartz 重启与持久化'],
 ['schema-verification-report.json','公开模型与 MySQL 字段对照'],
 ['backend-build-report.json','Java 源码与运行包一致'],
 ['java-tests-report.json','最终 Java 测试日志与 Surefire 对照'],
 ['artifact-dependencies-report.json','实际后端包依赖与许可证声明'],
 ['admin-release-boundary-report.json','后台构建与活动菜单边界'],
 ['frontend-build-report.json','H5 与微信小程序构建'],
 ['course-image-ui-report.json','课程原创封面与真实页面显示'],
 ['course-image-package-report.json','课程图片完整性与小程序包体'],
 ['one-to-one-api-report.json','一对一预约真实 MySQL 与原 CRM'],
 ['one-to-one-ui-report.json','一对一选老师与申请恢复交互'],
 ['one-to-one-build-report.json','一对一专项 Java 与前后端构建'],
 ['benchmark-ux-report.json','官方页面对照后的选课与登录交互'],
 ['benchmark-ux-build-report.json','选课体验优化的 H5 与小程序构建'],
 ['frontend-template-report.json','无本机配置时的前端环境初始化'],
 ['delivery-integrity-report.json','源代码交付完整性']
];
function sanitize(value) {
  if(Array.isArray(value))return value.map(sanitize);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([key])=>!/^(accessToken|refreshToken|password|secret|authorization|connectionConfig)$/i.test(key)).map(([key,v])=>[key,sanitize(v)]));
  return value;
}
const rows=[];
for(const [file,label] of entries){
  const source=path.join(runtime,file);
  if(!fs.existsSync(source)){rows.push(`| ${label} | 尚无公开报告 | — |`);continue;}
  const report=sanitize(JSON.parse(fs.readFileSync(source,'utf8')));
  const text=JSON.stringify(report,null,2)+'\n';
  if(secrets.some(secret=>text.includes(secret)))throw Error(`Refusing to publish credential-bearing report ${file}`);
  fs.writeFileSync(path.join(output,file),text);
  const status=report.status||report.result||'详见原始断言记录';
  const checks=Array.isArray(report.checks)?`${report.checks.length} 项记录`:'详见报告';
  rows.push(`| ${label} | ${String(status)} · ${checks} | [报告](${file}) |`);
}
const date=new Date().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false});
fs.writeFileSync(path.join(output,'README.md'),`# 本地验证报告\n\n导出时间：${date}（Asia/Shanghai）。本目录是经过凭据检查的专项报告副本；原始运行数据留在被忽略的 .runtime。可重跑 \`node tooling/bootstrap/export-verification.mjs\`。\n\n数据来自独立本地 MySQL 8.4 / Redis / Java 21 与实际原账号和接口。测试名字带 TEST/本地/验收的资料是合成记录。mock 支付仅用于 foundation；未调用真实商户、未进行微信真机或生产部署。不同报告会复用或重复覆盖场景，不能把记录数量相加当作独立测试总数。每个报告有自己的执行时间，未修改的专项不会为凑总数反复运行。\n\n| 验证范围 | 结果 | 证据 |\n| --- | --- | --- |\n${rows.join('\n')}\n\n本次一对一改动通过完整 Java 打包及 13 项相关测试，见一对一专项构建报告；先前 22 项相关测试保留在 Java 测试报告中，各报告按执行时间对应改动范围。原支付隔离/原商城等此前专项记录见 FOUNDATION.md。后台活动范围使用 ts:check:active，不能推广为原上游所有未启用模块类型检查通过。截图与录屏的来源和具体覆盖页面见 [设计证据](../DESIGN_AND_EVIDENCE.md)。性能目标尚无真实设备实测报告。\n`);
console.log(`Published ${entries.length} report slots with credential exclusion; see docs/verification/README.md.`);

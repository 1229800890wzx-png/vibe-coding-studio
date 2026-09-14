// Documentation only: reads authoritative DDL/model definitions, never executes or rewrites them.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ddl=fs.readFileSync(path.join(root,'infra/sql/education.sql'),'utf8');
const model=fs.readFileSync(path.join(root,'scripts/generate-edu-models.mjs'),'utf8');
const snake=s=>s.replace(/[A-Z]/g,x=>'_'+x.toLowerCase()).replace(/^_/,'');
const definitions=[...model.match(/const definitions = \{([\s\S]*?)\n\};/)[1].matchAll(/^\s+(\w+): '([^']+)'/gm)].map(m=>({name:m[1],table:'edu_'+snake(m[1]),fields:m[2].split(',').map(f=>snake(f.split(':')[0]))}));
const titles={student:'学员档案',course:'课程可编辑主档',course_version:'课程发布快照',lesson_template:'发布版本课纲',campus:'校区',room:'教室',teacher_profile:'教师公开档案',cohort:'可销售班期',session:'实际课次',session_teacher:'课次多员工关联（预留）',order_item_ext:'原订单项教育快照',enrollment:'学习资格',trial_booking:'体验预约',seat_hold:'待付款占位与补偿状态',leave_request:'请假申请',transfer_request:'转班申请',transfer_event:'转班事实记录',attendance:'课次出勤',assignment:'教学作业',submission:'学员作业版本',review:'教师点评',growth_report:'成长报告',after_sale_ext:'原售后项教学资格策略',work:'作品主档',work_version:'作品内容版本',publish_consent:'监护人版本授权',publication:'作品审核与公开状态',file_access:'原文件的教育访问归属'};
const descriptions={
 one_to_one_enabled:'是否允许家长提交一对一预约申请，默认 false；还须教师已发布、简介非空且原员工启用。不代表有已锁定时段或价格',
 guardian_member_id:'原 member_user.id；监护人身份，不新建教育账号',name:'名称；业务接口可施加比数据库更小的长度限制',birth_month:'出生年月，业务格式 YYYY-MM；不保存完整生日',grade:'年级描述',experience:'学习经历或编程经验说明',version:'业务版本计数；不是统一的 MyBatis @Version 自动乐观锁',
 spu_id:'原 product_spu.id；一门课程关联一个原商品',code:'机构内课程代码',description:'说明内容',cover_url:'公开封面地址；不能使用私有作业附件地址',age_min:'适龄下界，单位岁',age_max:'适龄上界，单位岁',direction:'课程方向代码',level:'课程难度代码',revision:'编辑修订号；用于业务层检查陈旧编辑',objectives:'学习目标',outcomes:'预期学习成果',lessons_json:'可编辑课纲 JSON 数组；发布时生成 lesson_template 行',
 course_id:'edu_course.id',content_json:'JSON 文本快照；结构见本文件的 JSON 约定',published_at:'本版本公开发布时间',course_version_id:'edu_course_version.id；固定发布版本',title:'标题',sort:'版本内课纲顺序',duration_minutes:'预计课时分钟数',materials:'课纲准备材料说明文本',assignment:'课纲作业说明文本',
 dept_id:'原 system_dept.id；校区数据权限依据',city:'城市名称',address:'校区地址',latitude:'纬度文本；DDL 不是数值地理类型',longitude:'经度文本；DDL 不是数值地理类型',campus_id:'edu_campus.id',capacity:'教室容纳人数或班额；实际可售名额由原 SKU.stock 管理',user_id:'原 system_users.id；后台员工身份',bio:'教师简介',avatar_url:'教师公开头像地址',
 sku_id:'原 product_sku.id；班期价格、可售库存以原 SKU 为准',kind:'REGULAR 正式课 / TRIAL 体验课',mode:'ONLINE 线上 / OFFLINE 线下',room_id:'edu_room.id；线上课通常为空',teacher_id:'edu_teacher_profile.id；排课教师档案',start_date:'班期开始时间；由实际课表维护',end_date:'班期结束时间；由实际课表维护',terms:'班期服务条款；下单时进入购买快照',refund_policy:'退改规则文本；下单时进入购买快照',cohort_id:'edu_cohort.id',lesson_template_id:'edu_lesson_template.id；发布时校验归属固定课程版本及顺序',start_time:'课次开始时间',end_time:'课次结束时间',join_info:'私有课堂信息，可为 JSON 或说明文本；公开目录响应移除',materials_json:'班期资料引用 JSON 数组；保存 fileId/name，不保存凭据',session_id:'edu_session.id',
 order_item_id:'原 trade_order_item.id',student_id:'edu_student.id',purchased_cohort_id:'购买时 edu_cohort.id，转班后保留原值',snapshot_json:'下单时课程、学员、班期、价格、条款、课表快照',current_cohort_id:'当前 edu_cohort.id；转班成功只更新此指针与版本',trial_booking_id:'edu_trial_booking.id；enrollment 中仅用于 FREE_TRIAL 来源',source:'ORDER 原订单 / FREE_TRIAL 免费预约；受互斥 CHECK 约束',enrollment_id:'edu_enrollment.id',expires_at:'创建时记录的占位到期时间；不能仅凭此字段伪造原支付过期',reason:'家长申请理由或事实说明',decision_reason:'教务审批说明',decided_by:'原 system_users.id；审批员工',from_cohort_id:'转出 edu_cohort.id',target_cohort_id:'转入 edu_cohort.id',request_id:'edu_transfer_request.id；唯一，避免同申请重复记事实',actor_id:'原 system_users.id；执行转班的员工',note:'出勤补充说明',due_time:'作业截止时间',assignment_id:'edu_assignment.id',content:'提交正文或成长报告摘要',attachments_json:'私有附件引用 JSON 数组；保存 fileId/name',submitted_at:'本作业版本提交时间；私人草稿为空',submission_id:'edu_submission.id；固定作业版本',feedback:'教师反馈正文',score:'业务校验 0—100 分；DDL 为普通 int',require_revision:'是否要求学员提交新的作业版本',dimensions_json:'报告维度 JSON；当前服务写入 strengths / nextSteps',after_sale_id:'原 trade_after_sale.id',entitlement_action:'KEEP 保留学习资格 / CANCEL 取消资格',enrollment_version:'申请退款时资格版本；CANCEL 确认时检查并发变更',stock_released:'本次 CANCEL 是否已经释放当前班期原 SKU 库存',work_id:'edu_work.id',granted_at:'当前版本授权时间',revoked_at:'当前版本撤回时间',moderator_id:'原 system_users.id；内容审核员工',moderation_note:'审核意见',file_id:'原 infra_file.id；字节和底层存储配置仍在原 infra',owner_member_id:'原 member_user.id；作业附件的上传家长，班期资料为空',purpose:'SUBMISSION 作业附件 / MATERIAL 班期资料',sha256:'服务计算的内容 SHA256 十六进制摘要；不是存储去重键',
 active_key:"数据库派生列：未删除且状态为 PENDING_PAYMENT/ACTIVE/COMPLETED 时为 1，其他情况为 NULL；参与同孩子同班期活动资格唯一约束"
};
const statuses={student:'无独立状态列',course:'DRAFT / PUBLISHED / ARCHIVED（状态字符串由业务维护）',campus:'DRAFT / PUBLISHED / ARCHIVED',teacher_profile:'DRAFT / PUBLISHED / ARCHIVED',cohort:'当前服务创建 DRAFT、发布 OPEN；查询亦识别其他关闭/完成状态，DDL 未枚举限定',session:'当前排课写入 SCHEDULED；冲突检查排除 CANCELLED',enrollment:'PENDING_PAYMENT / ACTIVE / EXPIRED / CANCELLED；读取同时识别 COMPLETED',trial_booking:'CONFIRMED / CANCELLED',seat_hold:'ACTIVE / CONSUMED / RELEASED / REFUND_PENDING / REFUND_FAILED / REFUNDED',leave_request:'PENDING / APPROVED / REJECTED',transfer_request:'PENDING / APPROVED / REJECTED',attendance:'PRESENT / ABSENT / EXCUSED',assignment:'DRAFT / PUBLISHED / ARCHIVED',submission:'DRAFT / SUBMITTED / REVIEWED / REVISION_REQUIRED',review:'DRAFT / PUBLISHED',growth_report:'DRAFT / PUBLISHED',work:'PRIVATE / PENDING / REJECTED / PUBLISHED',publish_consent:'GRANTED / REVOKED',publication:'PENDING / APPROVED / REJECTED / PUBLISHED / REVOKED',file_access:'当前上传写入 READY；授权读取要求 READY'};
const overrides={
 'course.version':'当前已发布版本号；编辑草稿另用 revision',
 'course_version.version':'课程内发布版本号，与 course_id 唯一',
 'enrollment.version':'教学资格并发版本；转班、取消、支付状态改变时递增',
 'submission.version':'不可覆盖的作业历史版本号；私人草稿编辑另用 revision',
 'review.teacher_id':'原 system_users.id；写入 access.actor()，不是 edu_teacher_profile.id',
 'work.version':'作品内容版本；当前创建为 1，授权/审核均绑定该值',
 'work_version.version':'作品内内容版本号；当前创建流程保存版本 1',
 'publish_consent.version':'授权绑定的作品版本号',
 'publication.version':'审核/公开绑定的作品版本号',
 'trial_booking.order_item_id':'收费体验课关联原 trade_order_item.id；免费体验为空',
 'trial_booking.crm_clue_id':'原 crm_clue.id；可选关联家长授权的招生咨询线索，未关联时为空',
 'review.revision':'点评草稿修订号；首次保存期望 0，每次保存递增；客户端必须提交当前修订号，发布后不可覆盖',
 'file_access.cohort_id':'班期资料所属 edu_cohort.id；作业附件为空',
 'file_access.student_id':'作业附件所属 edu_student.id；班期资料为空',
 'session_teacher.user_id':'预留关联原 system_users.id；当前服务未读取此表判定授课权限'
};
const notes={
 session_teacher:'预留表：当前只有 DO/Mapper，未发现服务层调用；当前授课关系使用 cohort.teacher_id 与 session.teacher_id。不能据此宣称已经支持助教/多教师排课。',
 enrollment:'ORDER 来源以 order_item_id 关联原交易项，trial_booking_id 必须为空；FREE_TRIAL 来源相反。收费体验预约通过 trial_booking.order_item_id 回联原交易项。COMPLETED 被权限及唯一约束识别，但当前未实现自动结课写入任务。',
 seat_hold:'这是原订单占位的状态记录，不是第二份库存账。创建时 expires_at 设置为当前时间加 15 分钟；定时释放仍先检查原支付单是否实际关闭，并调用原订单取消。',
 after_sale_ext:'不保存金额账本。退款金额、审核状态、支付退款确认均采用原 trade_after_sale / pay_refund。CANCEL 按 enrollment.current_cohort_id 恢复库存，保留购买快照。',
 work_version:'当前服务在新作品创建时保存版本 1；表结构支持版本唯一性，不代表已有任意作品编辑/发布版本管理接口。',
 file_access:'仅保存业务访问归属。字节、URL、content type、storage config 在原 infra_file/infra_file_content/infra_file_config。SUBMISSION 和 MATERIAL 的字段组合由服务校验，当前 DDL 没有对应互斥 CHECK。'
};
const shared=new Set(['id','tenant_id','creator','updater','create_time','update_time','deleted']);
const tables=[...ddl.matchAll(/CREATE TABLE IF NOT EXISTS (edu_\w+) \(\n([\s\S]*?)\n\) ENGINE=[^;]+;/g)].map(m=>{
 const lines=m[2].split('\n').map(l=>l.trim().replace(/,$/,''));
 const columns=lines.filter(l=>/^[a-z0-9_]+ (?:bigint|int|varchar|longtext|datetime|bit|tinyint)/.test(l)).map(l=>{const match=l.match(/^([a-z0-9_]+) ([a-z]+(?:\([^)]*\))?)(.*)$/);return {name:match[1],type:match[2],rest:match[3],raw:l};});
 const constraints=lines.filter(l=>/^(?:UNIQUE KEY|KEY |CHECK\()/.test(l));
 return {name:m[1],short:m[1].slice(4),columns,constraints};
});
assert.equal(tables.length,28);assert.equal(definitions.length,28);
for(const definition of definitions){const table=tables.find(t=>t.name===definition.table);assert(table,definition.table);assert.deepEqual(table.columns.filter(c=>!shared.has(c.name)&&c.name!=='active_key').map(c=>c.name),definition.fields,`Model/DDL fields disagree for ${definition.table}`);}
const cell=s=>String(s).replaceAll('|','\\|');
let out=`# 教育数据字典\n\n本文件由 [generate-education-dictionary.mjs](../scripts/generate-education-dictionary.mjs) 只读生成，DDL 来源为 [education.sql](../infra/sql/education.sql)，字段声明来源为 [generate-edu-models.mjs](../scripts/generate-edu-models.mjs)。运行 \`node scripts/generate-education-dictionary.mjs\` 可更新本文件，不会生成 Java、执行 SQL 或修改运行环境。\n\nDDL SHA256：\`${crypto.createHash('sha256').update(ddl).digest('hex')}\`。共 28 张教育表；原账号、商品、订单、支付、文件字段见 [基础来源说明](FOUNDATION.md)，关系与状态说明见 [架构文档](ARCHITECTURE.md)，原交易的两个字段扩展见 [TRADE_EDUCATION.md](TRADE_EDUCATION.md)。\n\n## 共通字段与约束边界\n\n所有表为 MySQL 8.4 InnoDB / utf8mb4。下表七个字段在每张表中存在，下文仅列各表专有字段。\n\n| 字段 | 实际 SQL 定义 | 含义 |\n| --- | --- | --- |\n| id | bigint NOT NULL AUTO_INCREMENT PRIMARY KEY | 本表主键；每张表都有 PRIMARY KEY(id) |\n| tenant_id | bigint NOT NULL DEFAULT 1 | 继承原 TenantBaseDO/租户拦截器；本地单品牌仅启用租户 1 |\n| creator | varchar(64) NULL DEFAULT '' | 原审计创建人；异步支付回调可为空 |\n| updater | varchar(64) NULL DEFAULT '' | 原审计修改人；不是新的员工账号 |\n| create_time | datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) | 数据库创建时间 |\n| update_time | datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) | 数据库更新时间 |\n| deleted | bit(1) NOT NULL DEFAULT b'0' | 原逻辑删除标记 |\n\nSQL 可空性不等于接口允许省略；名称、状态、文件归属、年龄、排课等还受业务校验。review.revision 声明 DEFAULT 0，teacher_profile.one_to_one_enabled 默认 false；其他普通专有列未声明数据库默认值，active_key 是派生列。各表未定义物理 FOREIGN KEY；关系由原/教育服务校验，ERD 表示逻辑关联。普通 UNIQUE KEY 不因逻辑删除自动释放；只有 enrollment 的 active_key 使用可空派生列区分有效/失效资格。status 为 varchar，而非数据库 ENUM；下文状态来自当前服务读写，不把计划状态视为已实现流程。\n\n## 表目录\n\n| 表 | 责任 | 专有列数 | 非主键索引数 |\n| --- | --- | --- | --- |\n`;
for(const t of tables)out+=`| [${t.name}](#${t.name}) | ${titles[t.short]} | ${t.columns.filter(c=>!shared.has(c.name)).length} | ${t.constraints.filter(c=>/^(UNIQUE KEY|KEY )/.test(c)).length} |\n`;
for(const t of tables){
 out+=`\n## ${t.name}\n\n${titles[t.short]}。${notes[t.short]||''}\n\n| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |\n| --- | --- | --- | --- |\n`;
 for(const c of t.columns.filter(c=>!shared.has(c.name))){const description=overrides[`${t.short}.${c.name}`]||(c.name==='status'?statuses[t.short]:descriptions[c.name]);assert(description,`Missing field meaning: ${t.name}.${c.name}`);const nullable=c.rest.includes('GENERATED ALWAYS')?'派生可空':c.rest.includes('NOT NULL')?'否':'是';out+=`| ${c.name} | ${c.type} | ${nullable} | ${cell(description)} |\n`;}
 out+='\n附加索引/检查约束（主键见共通字段）：\n\n';
 const generated=t.columns.filter(c=>c.rest.includes('GENERATED ALWAYS')).map(c=>c.raw);
 if(t.constraints.length||generated.length)out+='```sql\n'+[...generated,...t.constraints].join(';\n')+';\n```\n';else out+='当前 DDL 未声明额外二级索引或 CHECK。\n';
 const def=definitions.find(d=>d.table===t.name);out+=`\n模型：[Edu${def.name}DO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/Edu${def.name}DO.java)。\n`;
}
out+=`\n## JSON 文本与身份字段\n\nJSON 内容目前存于 longtext，DDL 不做 JSON_VALID 检查；写入由服务序列化。课程 lessons_json 是编辑草稿；course_version.content_json 保存发布时课程字段；order_item_ext.snapshot_json 保存购买时 courseId/courseName/courseVersionId/cohortId/cohortName/studentName/mode/terms/refundPolicy/price/paidPrice/skuId/termsVersion/sessions，金额单位分。课次 materials_json、作业 materials_json 和 submission.attachments_json 保存 fileId/name 引用，下载凭据不会持久化在这些数组。work_version.content_json 保存标题/说明/封面、来源提交正文及带摘要的附件快照；公开列表返回展示元数据，公开详情返回审核版本正文和附件 index/name，字节由版本授权代理下载，不暴露原 fileId/私有 URL。\n\ncohort.teacher_id 与 session.teacher_id 指向 edu_teacher_profile.id；review.teacher_id、session_teacher.user_id、decided_by、actor_id、moderator_id 指向原 system_users.id。不要只根据字段名称将两种教师编号混用。guardian_member_id/owner_member_id 是原 member_user.id；孩子始终由 edu_student 关联原家长。\n\n接口时间及分页约定见 [API_CONTRACT.md](API_CONTRACT.md)，文件授权实现及生产限制见 [ARCHITECTURE.md](ARCHITECTURE.md) 与 [OPERATIONS.md](OPERATIONS.md)。数据库字典不替代接口校验、业务迁移评审或真实环境验收。\n`;
fs.writeFileSync(path.join(root,'docs/DATA_DICTIONARY.md'),out);
console.log(`Generated education dictionary: ${tables.length} tables, ${tables.reduce((n,t)=>n+t.columns.length,0)} columns including shared fields, ${tables.reduce((n,t)=>n+t.constraints.filter(c=>/^(UNIQUE KEY|KEY )/.test(c)).length,0)} secondary indexes.`);

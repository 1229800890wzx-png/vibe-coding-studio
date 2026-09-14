# 教育数据字典

本文件由 [generate-education-dictionary.mjs](../scripts/generate-education-dictionary.mjs) 只读生成，DDL 来源为 [education.sql](../infra/sql/education.sql)，字段声明来源为 [generate-edu-models.mjs](../scripts/generate-edu-models.mjs)。运行 `node scripts/generate-education-dictionary.mjs` 可更新本文件，不会生成 Java、执行 SQL 或修改运行环境。

DDL SHA256：`762f7233fe533e7a1c42492ad64d9137ba4c713b1b803b5aa87d7d5ae0de9931`。共 28 张教育表；原账号、商品、订单、支付、文件字段见 [基础来源说明](FOUNDATION.md)，关系与状态说明见 [架构文档](ARCHITECTURE.md)，原交易的两个字段扩展见 [TRADE_EDUCATION.md](TRADE_EDUCATION.md)。

## 共通字段与约束边界

所有表为 MySQL 8.4 InnoDB / utf8mb4。下表七个字段在每张表中存在，下文仅列各表专有字段。

| 字段 | 实际 SQL 定义 | 含义 |
| --- | --- | --- |
| id | bigint NOT NULL AUTO_INCREMENT PRIMARY KEY | 本表主键；每张表都有 PRIMARY KEY(id) |
| tenant_id | bigint NOT NULL DEFAULT 1 | 继承原 TenantBaseDO/租户拦截器；本地单品牌仅启用租户 1 |
| creator | varchar(64) NULL DEFAULT '' | 原审计创建人；异步支付回调可为空 |
| updater | varchar(64) NULL DEFAULT '' | 原审计修改人；不是新的员工账号 |
| create_time | datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) | 数据库创建时间 |
| update_time | datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) | 数据库更新时间 |
| deleted | bit(1) NOT NULL DEFAULT b'0' | 原逻辑删除标记 |

SQL 可空性不等于接口允许省略；名称、状态、文件归属、年龄、排课等还受业务校验。review.revision 声明 DEFAULT 0，teacher_profile.one_to_one_enabled 默认 false；其他普通专有列未声明数据库默认值，active_key 是派生列。各表未定义物理 FOREIGN KEY；关系由原/教育服务校验，ERD 表示逻辑关联。普通 UNIQUE KEY 不因逻辑删除自动释放；只有 enrollment 的 active_key 使用可空派生列区分有效/失效资格。status 为 varchar，而非数据库 ENUM；下文状态来自当前服务读写，不把计划状态视为已实现流程。

## 表目录

| 表 | 责任 | 专有列数 | 非主键索引数 |
| --- | --- | --- | --- |
| [edu_student](#edu_student) | 学员档案 | 6 | 1 |
| [edu_course](#edu_course) | 课程可编辑主档 | 15 | 3 |
| [edu_course_version](#edu_course_version) | 课程发布快照 | 5 | 1 |
| [edu_lesson_template](#edu_lesson_template) | 发布版本课纲 | 7 | 1 |
| [edu_campus](#edu_campus) | 校区 | 8 | 1 |
| [edu_room](#edu_room) | 教室 | 3 | 1 |
| [edu_teacher_profile](#edu_teacher_profile) | 教师公开档案 | 6 | 2 |
| [edu_cohort](#edu_cohort) | 可销售班期 | 16 | 3 |
| [edu_session](#edu_session) | 实际课次 | 11 | 3 |
| [edu_session_teacher](#edu_session_teacher) | 课次多员工关联（预留） | 2 | 1 |
| [edu_order_item_ext](#edu_order_item_ext) | 原订单项教育快照 | 4 | 1 |
| [edu_enrollment](#edu_enrollment) | 学习资格 | 8 | 3 |
| [edu_trial_booking](#edu_trial_booking) | 体验预约 | 5 | 2 |
| [edu_seat_hold](#edu_seat_hold) | 待付款占位与补偿状态 | 5 | 2 |
| [edu_leave_request](#edu_leave_request) | 请假申请 | 7 | 1 |
| [edu_transfer_request](#edu_transfer_request) | 转班申请 | 8 | 1 |
| [edu_transfer_event](#edu_transfer_event) | 转班事实记录 | 6 | 1 |
| [edu_attendance](#edu_attendance) | 课次出勤 | 4 | 1 |
| [edu_assignment](#edu_assignment) | 教学作业 | 7 | 1 |
| [edu_submission](#edu_submission) | 学员作业版本 | 9 | 2 |
| [edu_review](#edu_review) | 教师点评 | 8 | 1 |
| [edu_growth_report](#edu_growth_report) | 成长报告 | 8 | 0 |
| [edu_after_sale_ext](#edu_after_sale_ext) | 原售后项教学资格策略 | 5 | 1 |
| [edu_work](#edu_work) | 作品主档 | 7 | 0 |
| [edu_work_version](#edu_work_version) | 作品内容版本 | 4 | 1 |
| [edu_publish_consent](#edu_publish_consent) | 监护人版本授权 | 6 | 1 |
| [edu_publication](#edu_publication) | 作品审核与公开状态 | 6 | 2 |
| [edu_file_access](#edu_file_access) | 原文件的教育访问归属 | 8 | 2 |

## edu_student

学员档案。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| guardian_member_id | bigint | 否 | 原 member_user.id；监护人身份，不新建教育账号 |
| name | varchar(255) | 否 | 名称；业务接口可施加比数据库更小的长度限制 |
| birth_month | varchar(255) | 否 | 出生年月，业务格式 YYYY-MM；不保存完整生日 |
| grade | varchar(255) | 是 | 年级描述 |
| experience | longtext | 是 | 学习经历或编程经验说明 |
| version | int | 是 | 业务版本计数；不是统一的 MyBatis @Version 自动乐观锁 |

附加索引/检查约束（主键见共通字段）：

```sql
KEY ix_guardian (tenant_id,guardian_member_id,deleted);
```

模型：[EduStudentDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduStudentDO.java)。

## edu_course

课程可编辑主档。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| spu_id | bigint | 是 | 原 product_spu.id；一门课程关联一个原商品 |
| name | varchar(255) | 否 | 名称；业务接口可施加比数据库更小的长度限制 |
| code | varchar(255) | 否 | 机构内课程代码 |
| description | longtext | 是 | 说明内容 |
| cover_url | longtext | 是 | 公开封面地址；不能使用私有作业附件地址 |
| age_min | int | 是 | 适龄下界，单位岁 |
| age_max | int | 是 | 适龄上界，单位岁 |
| direction | varchar(255) | 是 | 课程方向代码 |
| level | varchar(255) | 是 | 课程难度代码 |
| status | varchar(255) | 否 | DRAFT / PUBLISHED / ARCHIVED（状态字符串由业务维护） |
| version | int | 是 | 当前已发布版本号；编辑草稿另用 revision |
| revision | int | 是 | 编辑修订号；用于业务层检查陈旧编辑 |
| objectives | longtext | 是 | 学习目标 |
| outcomes | longtext | 是 | 预期学习成果 |
| lessons_json | longtext | 是 | 可编辑课纲 JSON 数组；发布时生成 lesson_template 行 |

附加索引/检查约束（主键见共通字段）：

```sql
UNIQUE KEY uk_code (tenant_id,code);
UNIQUE KEY uk_spu (tenant_id,spu_id);
CHECK(age_min >= 0 AND age_max >= age_min);
KEY ix_public (tenant_id,status,direction);
```

模型：[EduCourseDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduCourseDO.java)。

## edu_course_version

课程发布快照。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| course_id | bigint | 否 | edu_course.id |
| version | int | 否 | 课程内发布版本号，与 course_id 唯一 |
| name | varchar(255) | 否 | 名称；业务接口可施加比数据库更小的长度限制 |
| content_json | longtext | 否 | JSON 文本快照；结构见本文件的 JSON 约定 |
| published_at | datetime(3) | 是 | 本版本公开发布时间 |

附加索引/检查约束（主键见共通字段）：

```sql
UNIQUE KEY uk_version (tenant_id,course_id,version);
```

模型：[EduCourseVersionDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduCourseVersionDO.java)。

## edu_lesson_template

发布版本课纲。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| course_version_id | bigint | 否 | edu_course_version.id；固定发布版本 |
| title | varchar(255) | 否 | 标题 |
| sort | int | 否 | 版本内课纲顺序 |
| duration_minutes | int | 是 | 预计课时分钟数 |
| objectives | longtext | 是 | 学习目标 |
| materials | longtext | 是 | 课纲准备材料说明文本 |
| assignment | longtext | 是 | 课纲作业说明文本 |

附加索引/检查约束（主键见共通字段）：

```sql
UNIQUE KEY uk_lesson (tenant_id,course_version_id,sort);
```

模型：[EduLessonTemplateDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduLessonTemplateDO.java)。

## edu_campus

校区。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| dept_id | bigint | 否 | 原 system_dept.id；校区数据权限依据 |
| name | varchar(255) | 否 | 名称；业务接口可施加比数据库更小的长度限制 |
| city | varchar(255) | 是 | 城市名称 |
| address | longtext | 是 | 校区地址 |
| latitude | varchar(255) | 是 | 纬度文本；DDL 不是数值地理类型 |
| longitude | varchar(255) | 是 | 经度文本；DDL 不是数值地理类型 |
| description | longtext | 是 | 说明内容 |
| status | varchar(255) | 否 | DRAFT / PUBLISHED / ARCHIVED |

附加索引/检查约束（主键见共通字段）：

```sql
KEY ix_dept (tenant_id,dept_id);
```

模型：[EduCampusDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduCampusDO.java)。

## edu_room

教室。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| campus_id | bigint | 否 | edu_campus.id |
| name | varchar(255) | 否 | 名称；业务接口可施加比数据库更小的长度限制 |
| capacity | int | 否 | 教室容纳人数或班额；实际可售名额由原 SKU.stock 管理 |

附加索引/检查约束（主键见共通字段）：

```sql
KEY ix_campus (tenant_id,campus_id);
```

模型：[EduRoomDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduRoomDO.java)。

## edu_teacher_profile

教师公开档案。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| user_id | bigint | 否 | 原 system_users.id；后台员工身份 |
| name | varchar(255) | 否 | 名称；业务接口可施加比数据库更小的长度限制 |
| bio | longtext | 是 | 教师简介 |
| avatar_url | longtext | 是 | 教师公开头像地址 |
| status | varchar(255) | 否 | DRAFT / PUBLISHED / ARCHIVED |
| one_to_one_enabled | bit(1) | 否 | 是否允许家长提交一对一预约申请，默认 false；还须教师已发布、简介非空且原员工启用。不代表有已锁定时段或价格 |

附加索引/检查约束（主键见共通字段）：

```sql
UNIQUE KEY uk_teacher (tenant_id,user_id);
KEY ix_one_to_one_public (tenant_id,status,one_to_one_enabled);
```

模型：[EduTeacherProfileDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduTeacherProfileDO.java)。

## edu_cohort

可销售班期。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| course_id | bigint | 否 | edu_course.id |
| course_version_id | bigint | 是 | edu_course_version.id；固定发布版本 |
| sku_id | bigint | 是 | 原 product_sku.id；班期价格、可售库存以原 SKU 为准 |
| name | varchar(255) | 否 | 名称；业务接口可施加比数据库更小的长度限制 |
| kind | varchar(255) | 否 | REGULAR 正式课 / TRIAL 体验课 |
| mode | varchar(255) | 否 | ONLINE 线上 / OFFLINE 线下 |
| campus_id | bigint | 是 | edu_campus.id |
| room_id | bigint | 是 | edu_room.id；线上课通常为空 |
| teacher_id | bigint | 是 | edu_teacher_profile.id；排课教师档案 |
| capacity | int | 否 | 教室容纳人数或班额；实际可售名额由原 SKU.stock 管理 |
| status | varchar(255) | 否 | 当前服务创建 DRAFT、发布 OPEN；查询亦识别其他关闭/完成状态，DDL 未枚举限定 |
| start_date | datetime(3) | 是 | 班期开始时间；由实际课表维护 |
| end_date | datetime(3) | 是 | 班期结束时间；由实际课表维护 |
| terms | longtext | 是 | 班期服务条款；下单时进入购买快照 |
| refund_policy | longtext | 是 | 退改规则文本；下单时进入购买快照 |
| version | int | 是 | 业务版本计数；不是统一的 MyBatis @Version 自动乐观锁 |

附加索引/检查约束（主键见共通字段）：

```sql
UNIQUE KEY uk_sku (tenant_id,sku_id);
KEY ix_course (tenant_id,course_id,status);
KEY ix_campus (tenant_id,campus_id,status);
CHECK(capacity >= 0);
```

模型：[EduCohortDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduCohortDO.java)。

## edu_session

实际课次。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| cohort_id | bigint | 否 | edu_cohort.id |
| lesson_template_id | bigint | 是 | edu_lesson_template.id；发布时校验归属固定课程版本及顺序 |
| title | varchar(255) | 否 | 标题 |
| start_time | datetime(3) | 否 | 课次开始时间 |
| end_time | datetime(3) | 否 | 课次结束时间 |
| teacher_id | bigint | 否 | edu_teacher_profile.id；排课教师档案 |
| room_id | bigint | 是 | edu_room.id；线上课通常为空 |
| join_info | longtext | 是 | 私有课堂信息，可为 JSON 或说明文本；公开目录响应移除 |
| materials_json | longtext | 是 | 班期资料引用 JSON 数组；保存 fileId/name，不保存凭据 |
| status | varchar(255) | 否 | 当前排课写入 SCHEDULED；冲突检查排除 CANCELLED |
| version | int | 是 | 业务版本计数；不是统一的 MyBatis @Version 自动乐观锁 |

附加索引/检查约束（主键见共通字段）：

```sql
KEY ix_cohort_time (tenant_id,cohort_id,start_time);
KEY ix_teacher_time (tenant_id,teacher_id,start_time,end_time);
KEY ix_room_time (tenant_id,room_id,start_time,end_time);
CHECK(end_time > start_time);
```

模型：[EduSessionDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduSessionDO.java)。

## edu_session_teacher

课次多员工关联（预留）。预留表：当前只有 DO/Mapper，未发现服务层调用；当前授课关系使用 cohort.teacher_id 与 session.teacher_id。不能据此宣称已经支持助教/多教师排课。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| session_id | bigint | 否 | edu_session.id |
| user_id | bigint | 否 | 预留关联原 system_users.id；当前服务未读取此表判定授课权限 |

附加索引/检查约束（主键见共通字段）：

```sql
UNIQUE KEY uk_session_teacher (tenant_id,session_id,user_id);
```

模型：[EduSessionTeacherDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduSessionTeacherDO.java)。

## edu_order_item_ext

原订单项教育快照。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| order_item_id | bigint | 否 | 原 trade_order_item.id |
| student_id | bigint | 否 | edu_student.id |
| purchased_cohort_id | bigint | 否 | 购买时 edu_cohort.id，转班后保留原值 |
| snapshot_json | longtext | 否 | 下单时课程、学员、班期、价格、条款、课表快照 |

附加索引/检查约束（主键见共通字段）：

```sql
UNIQUE KEY uk_order_item (tenant_id,order_item_id);
```

模型：[EduOrderItemExtDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduOrderItemExtDO.java)。

## edu_enrollment

学习资格。ORDER 来源以 order_item_id 关联原交易项，trial_booking_id 必须为空；FREE_TRIAL 来源相反。收费体验预约通过 trial_booking.order_item_id 回联原交易项。COMPLETED 被权限及唯一约束识别，但当前未实现自动结课写入任务。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| student_id | bigint | 否 | edu_student.id |
| current_cohort_id | bigint | 否 | 当前 edu_cohort.id；转班成功只更新此指针与版本 |
| order_item_id | bigint | 是 | 原 trade_order_item.id |
| trial_booking_id | bigint | 是 | edu_trial_booking.id；enrollment 中仅用于 FREE_TRIAL 来源 |
| source | varchar(255) | 否 | ORDER 原订单 / FREE_TRIAL 免费预约；受互斥 CHECK 约束 |
| status | varchar(255) | 否 | PENDING_PAYMENT / ACTIVE / EXPIRED / CANCELLED；读取同时识别 COMPLETED |
| version | int | 是 | 教学资格并发版本；转班、取消、支付状态改变时递增 |
| active_key | tinyint | 派生可空 | 数据库派生列：未删除且状态为 PENDING_PAYMENT/ACTIVE/COMPLETED 时为 1，其他情况为 NULL；参与同孩子同班期活动资格唯一约束 |

附加索引/检查约束（主键见共通字段）：

```sql
active_key tinyint GENERATED ALWAYS AS (CASE WHEN deleted=0 AND status IN ('PENDING_PAYMENT','ACTIVE','COMPLETED') THEN 1 ELSE NULL END) STORED;
UNIQUE KEY uk_active_student (tenant_id,student_id,current_cohort_id,active_key);
UNIQUE KEY uk_order_item (tenant_id,order_item_id);
UNIQUE KEY uk_trial (tenant_id,trial_booking_id);
CHECK((source='ORDER' AND order_item_id IS NOT NULL AND trial_booking_id IS NULL) OR (source='FREE_TRIAL' AND trial_booking_id IS NOT NULL AND order_item_id IS NULL));
```

模型：[EduEnrollmentDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduEnrollmentDO.java)。

## edu_trial_booking

体验预约。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| student_id | bigint | 否 | edu_student.id |
| cohort_id | bigint | 否 | edu_cohort.id |
| status | varchar(255) | 否 | CONFIRMED / CANCELLED |
| order_item_id | bigint | 是 | 收费体验课关联原 trade_order_item.id；免费体验为空 |
| crm_clue_id | bigint | 是 | 原 crm_clue.id；可选关联家长授权的招生咨询线索，未关联时为空 |

附加索引/检查约束（主键见共通字段）：

```sql
KEY ix_student (tenant_id,student_id,status);
KEY ix_crm_clue (tenant_id,crm_clue_id);
```

模型：[EduTrialBookingDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduTrialBookingDO.java)。

## edu_seat_hold

待付款占位与补偿状态。这是原订单占位的状态记录，不是第二份库存账。创建时 expires_at 设置为当前时间加 15 分钟；定时释放仍先检查原支付单是否实际关闭，并调用原订单取消。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| order_item_id | bigint | 否 | 原 trade_order_item.id |
| enrollment_id | bigint | 否 | edu_enrollment.id |
| cohort_id | bigint | 否 | edu_cohort.id |
| expires_at | datetime(3) | 否 | 创建时记录的占位到期时间；不能仅凭此字段伪造原支付过期 |
| status | varchar(255) | 否 | ACTIVE / CONSUMED / RELEASED / REFUND_PENDING / REFUND_FAILED / REFUNDED |

附加索引/检查约束（主键见共通字段）：

```sql
UNIQUE KEY uk_order_item (tenant_id,order_item_id);
KEY ix_expiry (tenant_id,status,expires_at);
```

模型：[EduSeatHoldDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduSeatHoldDO.java)。

## edu_leave_request

请假申请。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| student_id | bigint | 否 | edu_student.id |
| enrollment_id | bigint | 否 | edu_enrollment.id |
| session_id | bigint | 否 | edu_session.id |
| reason | longtext | 否 | 家长申请理由或事实说明 |
| status | varchar(255) | 否 | PENDING / APPROVED / REJECTED |
| decision_reason | longtext | 是 | 教务审批说明 |
| decided_by | bigint | 是 | 原 system_users.id；审批员工 |

附加索引/检查约束（主键见共通字段）：

```sql
KEY ix_enrollment (tenant_id,enrollment_id,status);
```

模型：[EduLeaveRequestDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduLeaveRequestDO.java)。

## edu_transfer_request

转班申请。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| student_id | bigint | 否 | edu_student.id |
| enrollment_id | bigint | 否 | edu_enrollment.id |
| from_cohort_id | bigint | 否 | 转出 edu_cohort.id |
| target_cohort_id | bigint | 否 | 转入 edu_cohort.id |
| reason | longtext | 否 | 家长申请理由或事实说明 |
| status | varchar(255) | 否 | PENDING / APPROVED / REJECTED |
| decision_reason | longtext | 是 | 教务审批说明 |
| decided_by | bigint | 是 | 原 system_users.id；审批员工 |

附加索引/检查约束（主键见共通字段）：

```sql
KEY ix_enrollment (tenant_id,enrollment_id,status);
```

模型：[EduTransferRequestDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduTransferRequestDO.java)。

## edu_transfer_event

转班事实记录。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| enrollment_id | bigint | 否 | edu_enrollment.id |
| from_cohort_id | bigint | 否 | 转出 edu_cohort.id |
| target_cohort_id | bigint | 否 | 转入 edu_cohort.id |
| request_id | bigint | 否 | edu_transfer_request.id；唯一，避免同申请重复记事实 |
| actor_id | bigint | 否 | 原 system_users.id；执行转班的员工 |
| reason | longtext | 是 | 家长申请理由或事实说明 |

附加索引/检查约束（主键见共通字段）：

```sql
UNIQUE KEY uk_request (tenant_id,request_id);
```

模型：[EduTransferEventDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduTransferEventDO.java)。

## edu_attendance

课次出勤。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| enrollment_id | bigint | 否 | edu_enrollment.id |
| session_id | bigint | 否 | edu_session.id |
| status | varchar(255) | 否 | PRESENT / ABSENT / EXCUSED |
| note | longtext | 是 | 出勤补充说明 |

附加索引/检查约束（主键见共通字段）：

```sql
UNIQUE KEY uk_attendance (tenant_id,enrollment_id,session_id);
```

模型：[EduAttendanceDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduAttendanceDO.java)。

## edu_assignment

教学作业。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| cohort_id | bigint | 否 | edu_cohort.id |
| session_id | bigint | 是 | edu_session.id |
| title | varchar(255) | 否 | 标题 |
| description | longtext | 是 | 说明内容 |
| due_time | datetime(3) | 是 | 作业截止时间 |
| materials_json | longtext | 是 | 班期资料引用 JSON 数组；保存 fileId/name，不保存凭据 |
| status | varchar(255) | 否 | DRAFT / PUBLISHED / ARCHIVED |

附加索引/检查约束（主键见共通字段）：

```sql
KEY ix_cohort_due (tenant_id,cohort_id,due_time);
```

模型：[EduAssignmentDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduAssignmentDO.java)。

## edu_submission

学员作业版本。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| assignment_id | bigint | 否 | edu_assignment.id |
| student_id | bigint | 否 | edu_student.id |
| enrollment_id | bigint | 否 | edu_enrollment.id |
| version | int | 否 | 不可覆盖的作业历史版本号；私人草稿编辑另用 revision |
| content | longtext | 是 | 提交正文或成长报告摘要 |
| attachments_json | longtext | 是 | 私有附件引用 JSON 数组；保存 fileId/name |
| status | varchar(255) | 否 | DRAFT / SUBMITTED / REVIEWED / REVISION_REQUIRED |
| submitted_at | datetime(3) | 是 | 本作业版本提交时间；私人草稿为空 |
| revision | int | 是 | 编辑修订号；用于业务层检查陈旧编辑 |

附加索引/检查约束（主键见共通字段）：

```sql
UNIQUE KEY uk_submission (tenant_id,assignment_id,enrollment_id,version);
KEY ix_workqueue (tenant_id,status,submitted_at);
```

模型：[EduSubmissionDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduSubmissionDO.java)。

## edu_review

教师点评。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| submission_id | bigint | 否 | edu_submission.id；固定作业版本 |
| teacher_id | bigint | 否 | 原 system_users.id；写入 access.actor()，不是 edu_teacher_profile.id |
| feedback | longtext | 是 | 教师反馈正文 |
| score | int | 是 | 业务校验 0—100 分；DDL 为普通 int |
| status | varchar(255) | 否 | DRAFT / PUBLISHED |
| require_revision | bit(1) | 是 | 是否要求学员提交新的作业版本 |
| published_at | datetime(3) | 是 | 本版本公开发布时间 |
| revision | int | 否 | 点评草稿修订号；首次保存期望 0，每次保存递增；客户端必须提交当前修订号，发布后不可覆盖 |

附加索引/检查约束（主键见共通字段）：

```sql
UNIQUE KEY uk_submission_review (tenant_id,submission_id);
```

模型：[EduReviewDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduReviewDO.java)。

## edu_growth_report

成长报告。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| student_id | bigint | 否 | edu_student.id |
| enrollment_id | bigint | 否 | edu_enrollment.id |
| title | varchar(255) | 否 | 标题 |
| content | longtext | 是 | 提交正文或成长报告摘要 |
| dimensions_json | longtext | 是 | 报告维度 JSON；当前服务写入 strengths / nextSteps |
| status | varchar(255) | 否 | DRAFT / PUBLISHED |
| version | int | 是 | 业务版本计数；不是统一的 MyBatis @Version 自动乐观锁 |
| published_at | datetime(3) | 是 | 本版本公开发布时间 |

附加索引/检查约束（主键见共通字段）：

当前 DDL 未声明额外二级索引或 CHECK。

模型：[EduGrowthReportDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduGrowthReportDO.java)。

## edu_after_sale_ext

原售后项教学资格策略。不保存金额账本。退款金额、审核状态、支付退款确认均采用原 trade_after_sale / pay_refund。CANCEL 按 enrollment.current_cohort_id 恢复库存，保留购买快照。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| after_sale_id | bigint | 否 | 原 trade_after_sale.id |
| enrollment_id | bigint | 否 | edu_enrollment.id |
| entitlement_action | varchar(255) | 否 | KEEP 保留学习资格 / CANCEL 取消资格 |
| enrollment_version | int | 否 | 申请退款时资格版本；CANCEL 确认时检查并发变更 |
| stock_released | bit(1) | 是 | 本次 CANCEL 是否已经释放当前班期原 SKU 库存 |

附加索引/检查约束（主键见共通字段）：

```sql
UNIQUE KEY uk_aftersale (tenant_id,after_sale_id);
```

模型：[EduAfterSaleExtDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduAfterSaleExtDO.java)。

## edu_work

作品主档。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| student_id | bigint | 否 | edu_student.id |
| submission_id | bigint | 否 | edu_submission.id；固定作业版本 |
| title | varchar(255) | 否 | 标题 |
| description | longtext | 是 | 说明内容 |
| version | int | 否 | 作品内容版本；当前创建为 1，授权/审核均绑定该值 |
| status | varchar(255) | 否 | PRIVATE / PENDING / REJECTED / PUBLISHED |
| cover_url | longtext | 是 | 公开封面地址；不能使用私有作业附件地址 |

附加索引/检查约束（主键见共通字段）：

当前 DDL 未声明额外二级索引或 CHECK。

模型：[EduWorkDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduWorkDO.java)。

## edu_work_version

作品内容版本。当前服务在新作品创建时保存版本 1；表结构支持版本唯一性，不代表已有任意作品编辑/发布版本管理接口。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| work_id | bigint | 否 | edu_work.id |
| version | int | 否 | 作品内内容版本号；当前创建流程保存版本 1 |
| submission_id | bigint | 否 | edu_submission.id；固定作业版本 |
| content_json | longtext | 否 | JSON 文本快照；结构见本文件的 JSON 约定 |

附加索引/检查约束（主键见共通字段）：

```sql
UNIQUE KEY uk_version (tenant_id,work_id,version);
```

模型：[EduWorkVersionDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduWorkVersionDO.java)。

## edu_publish_consent

监护人版本授权。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| work_id | bigint | 否 | edu_work.id |
| version | int | 否 | 授权绑定的作品版本号 |
| guardian_member_id | bigint | 否 | 原 member_user.id；监护人身份，不新建教育账号 |
| status | varchar(255) | 否 | GRANTED / REVOKED |
| granted_at | datetime(3) | 是 | 当前版本授权时间 |
| revoked_at | datetime(3) | 是 | 当前版本撤回时间 |

附加索引/检查约束（主键见共通字段）：

```sql
UNIQUE KEY uk_consent (tenant_id,work_id,version);
```

模型：[EduPublishConsentDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduPublishConsentDO.java)。

## edu_publication

作品审核与公开状态。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| work_id | bigint | 否 | edu_work.id |
| version | int | 否 | 审核/公开绑定的作品版本号 |
| status | varchar(255) | 否 | PENDING / APPROVED / REJECTED / PUBLISHED / REVOKED |
| moderator_id | bigint | 是 | 原 system_users.id；内容审核员工 |
| moderation_note | longtext | 是 | 审核意见 |
| published_at | datetime(3) | 是 | 本版本公开发布时间 |

附加索引/检查约束（主键见共通字段）：

```sql
UNIQUE KEY uk_publication (tenant_id,work_id,version);
KEY ix_public (tenant_id,status,published_at);
```

模型：[EduPublicationDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduPublicationDO.java)。

## edu_file_access

原文件的教育访问归属。仅保存业务访问归属。字节、URL、content type、storage config 在原 infra_file/infra_file_content/infra_file_config。SUBMISSION 和 MATERIAL 的字段组合由服务校验，当前 DDL 没有对应互斥 CHECK。

| 字段 | SQL 类型 | 可空 | 含义/逻辑关联 |
| --- | --- | --- | --- |
| file_id | bigint | 否 | 原 infra_file.id；字节和底层存储配置仍在原 infra |
| student_id | bigint | 是 | 作业附件所属 edu_student.id；班期资料为空 |
| cohort_id | bigint | 是 | 班期资料所属 edu_cohort.id；作业附件为空 |
| owner_member_id | bigint | 是 | 原 member_user.id；作业附件的上传家长，班期资料为空 |
| name | varchar(255) | 否 | 名称；业务接口可施加比数据库更小的长度限制 |
| purpose | varchar(255) | 否 | SUBMISSION 作业附件 / MATERIAL 班期资料 |
| sha256 | varchar(255) | 是 | 服务计算的内容 SHA256 十六进制摘要；不是存储去重键 |
| status | varchar(255) | 否 | 当前上传写入 READY；授权读取要求 READY |

附加索引/检查约束（主键见共通字段）：

```sql
UNIQUE KEY uk_file (tenant_id,file_id);
KEY ix_owner (tenant_id,owner_member_id,student_id);
```

模型：[EduFileAccessDO.java](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/dal/dataobject/EduFileAccessDO.java)。

## JSON 文本与身份字段

JSON 内容目前存于 longtext，DDL 不做 JSON_VALID 检查；写入由服务序列化。课程 lessons_json 是编辑草稿；course_version.content_json 保存发布时课程字段；order_item_ext.snapshot_json 保存购买时 courseId/courseName/courseVersionId/cohortId/cohortName/studentName/mode/terms/refundPolicy/price/paidPrice/skuId/termsVersion/sessions，金额单位分。课次 materials_json、作业 materials_json 和 submission.attachments_json 保存 fileId/name 引用，下载凭据不会持久化在这些数组。work_version.content_json 保存标题/说明/封面、来源提交正文及带摘要的附件快照；公开列表返回展示元数据，公开详情返回审核版本正文和附件 index/name，字节由版本授权代理下载，不暴露原 fileId/私有 URL。

cohort.teacher_id 与 session.teacher_id 指向 edu_teacher_profile.id；review.teacher_id、session_teacher.user_id、decided_by、actor_id、moderator_id 指向原 system_users.id。不要只根据字段名称将两种教师编号混用。guardian_member_id/owner_member_id 是原 member_user.id；孩子始终由 edu_student 关联原家长。

接口时间及分页约定见 [API_CONTRACT.md](API_CONTRACT.md)，文件授权实现及生产限制见 [ARCHITECTURE.md](ARCHITECTURE.md) 与 [OPERATIONS.md](OPERATIONS.md)。数据库字典不替代接口校验、业务迁移评审或真实环境验收。

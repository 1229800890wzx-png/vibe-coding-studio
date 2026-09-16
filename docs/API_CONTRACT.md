# Education API contract (v1)

Base: existing `/app-api` and `/admin-api`. Original CommonResult `{code:0,data:...,msg:""}` and original member/admin bearer tokens. No new auth. IDs numeric; prices integer fen; session timestamps milliseconds (upstream LocalDateTime JSON convention); birthMonth `YYYY-MM`. POST creates/actions; PUT updates (POST update alias accepted). Page `{list:[],total:n}` with pageNo/pageSize; list returns array. Failures nonzero code with actionable msg.

## Shared response fields
- Student: id,name,nickname(alias of name),birthMonth,grade,experience,guardianMemberId (admin only).
- Course: id,spuId,name,code,description,coverUrl,ageMin,ageMax,direction,level,status(DRAFT/PUBLISHED/ARCHIVED),version(published sequence),revision(draft edit counter),objectives,outcomes,lessons[{id,title,sort,durationMinutes,objectives,materials,assignment}],price(min open cohort or null),cohortCount.
- Cohort: id,courseId,courseVersionId,skuId,name,kind(REGULAR/TRIAL),mode(ONLINE/OFFLINE),campusId,campusName,roomId,teacherId,teacherName,capacity,stock,price,status(DRAFT/OPEN/CLOSED/CANCELLED/COMPLETED),startDate,endDate,sessions[],terms,refundPolicy. skuId is stable. Public response NEVER includes private classroom URL.
- Session: id,cohortId,title,startTime,endTime,teacherId,roomId,campusName,mode,status,lessonTemplateId. joinInfo only in authenticated entitled session/get.
- Enrollment: id,studentId,studentName,cohortId,currentCohortId,cohortName,courseId,courseName,orderItemId,status(PENDING_PAYMENT/ACTIVE/COMPLETED/CANCELLED/EXPIRED).
- Assignment: id,cohortId,sessionId,title,description,dueTime,materials,status,submission (latest student's version if entitled).
- Submission: id,assignmentId,studentId,enrollmentId,version,revision,content,attachments[{fileId,name}],status(DRAFT/SUBMITTED/REVIEWED/REVISION_REQUIRED),submittedAt,feedback,score. Attachments contain no storage URL. Each review belongs to one submission version.
- Work: id,studentId,title,description,version,submissionId,status(PRIVATE/PENDING/PUBLISHED/REJECTED),coverUrl,consentStatus,moderationNote.
- Campus: id,deptId,name,city,address,latitude,longitude,description,status. Room: id,campusId,name,capacity. Teacher: id,userId,name,bio,avatarUrl.

## App routes
GET `/edu/config/get`: brandName,tagline,logoUrl,supportPhone,supportHours,privacyUrl,termsUrl,heroTitle,heroDescription,heroAction,reducedMotionDefault. Fixed public display whitelist from original infra_config; no arbitrary config-key lookup.
GET `/edu/course/page`: keyword,direction,age,level,kind,mode,campusId,startFrom,startTo,pageNo,pageSize. Public filtering uses the published course snapshot. `level` is BEGINNER/INTERMEDIATE/ADVANCED; `direction` is STORY/GAME/WEB/TOOL/AI/PRODUCT. Dates filter cohort opening time, ISO datetime or YYYY-MM-DD; a YYYY-MM-DD end date is inclusive. Combined kind/mode/campus/time must match the same open future cohort; price/count are scoped to matches. Age is the selected age, not an inferred school grade. GET `/edu/course/get?id` (published only).
GET `/edu/cohort/list?courseId&kind&mode&campusId`; GET `/edu/cohort/get?id` (OPEN/public valid states only).
GET `/edu/campus/list`; GET `/edu/teacher/list` (published profiles).
GET `/edu/student/list`; POST `/edu/student/create`; PUT `/edu/student/update`; DELETE `/edu/student/delete?id` (only if no education history).
GET `/edu/trial/list?studentId`; POST `/edu/trial/create` {studentId,cohortId}; POST `/edu/trial/cancel` {id}. Free TRIAL only; paid trial must use upstream cart/order.
GET `/edu/learning/dashboard?studentId`: {student,nextSession,pendingAssignments,courses,enrollments,stats:{courses,completedSessions,pendingAssignments,works}}.
GET `/edu/session/list?studentId&cohortId`; GET `/edu/session/get?id&studentId` includes joinInfo only if eligible.
GET `/edu/material/list?studentId&sessionId?` aggregates entitled session materials when sessionId is omitted; GET `/edu/assignment/list?studentId&cohortId`; GET `/edu/assignment/get?id&studentId`.
POST `/edu/submission/save` {assignmentId,studentId,content,attachments,id?,version?,revision?}: save private draft, returns submission. POST `/edu/submission/submit` same payload; same id/payload retry idempotent; a new submission version after published review preserves history. Revision mismatch rejects stale draft writes rather than overwriting the newer draft.
GET `/edu/review/list?studentId&assignmentId`; GET `/edu/report/list?studentId`; GET `/edu/report/get?id&studentId` published reports only.
POST `/edu/leave/create` {studentId,sessionId,reason}; POST `/edu/transfer/create` {enrollmentId,targetCohortId,reason}; GET `/edu/request/list?studentId`.
GET `/edu/work/list?studentId`; POST `/edu/work/create` {studentId,submissionId,title,description}; POST `/edu/work/consent` {id,version}; POST `/edu/work/revoke` {id}; GET `/edu/work/public-page`; GET `/edu/work/public-get?id`.
POST `/edu/file/upload`: multipart `file` and `studentId`, maximum30MB, returns `{fileId,name,size}`. Calls original infra FileService; no alternate storage implementation.
GET `/edu/file/get-url?fileId&studentId`: after ownership/entitlement checks returns an authenticated `/app-api/edu/file/content` proxy URL and required original-session headers. No token is placed in the URL. The proxy rechecks authorization on every download; material downloads require the selected studentId. This implementation uses an authenticated proxy, not a COS signed-link claim. Original public infra routes reject `edu-private` paths.

### Works: immutable preview and public bytes
GET `/edu/work/preview?id&version` requires the parent who owns the work's child. GET `/edu/work/public-get?id&version?` is anonymous but requires the currently published version and live guardian consent. Detail `{id,version,title,description,coverUrl,status,publishedAt?,content,attachments:[{index,name}]}` never includes child, submission or private file IDs.
GET `/edu/work/preview-file?id&version&attachment` requires the owning parent; GET `/edu/work/public-file?id&version&attachment` rechecks current publication/consent anonymously. `attachment` is a zero-based ordinal in the immutable stored work version. Both resolve the original FileService bytes, force download, and set no-store/nosniff/sandbox headers. Denied bytes return HTTP404. Revocation blocks new requests; previously downloaded copies cannot be recalled. Public-page remains a metadata list.

### Original member notifications
GET `/edu/notification/page?pageNo&pageSize&readStatus?`, GET `/edu/notification/unread-count`, PUT `/edu/notification/read` `{ids:[...]}` (at most100), PUT `/edu/notification/read-all`. Delegate to original NotifyMessageService with server-derived login ID and MEMBER user type. No new notification table or sender endpoint. Recipient IDs cannot be supplied by clients.

## Admin routes
GET `/edu/dashboard/get` with scope-filtered counts.
GET `/edu/{resource}/page|get`, POST create, PUT update for resource `course,cohort,session,campus,room,teacher,assignment,growth-report`; routes only support appropriate operations. course/get includes lessons; create/update course accepts nested lessons and existing spuId optional.
POST `/edu/course/publish` {id,version?}; POST `/edu/cohort/publish` {id}; complete lessons/schedules/price/teacher/terms validation.
GET `/edu/student/page|get`; GET `/edu/enrollment/page?cohortId&sessionId?`; when sessionId is supplied, scope and matching cohort are checked, and rows include attendanceStatus,attendanceNote,attendanceUpdateTime for only that session; POST `/edu/enrollment/create` ONLY confirmed free-trial booking (cannot manually grant a paid order).
GET `/edu/trial/page`; POST `/edu/trial/update` {id,status} cancellation only.
GET `/edu/submission/page|get`; POST `/edu/submission/review` {id,revision,feedback,score,status:DRAFT|PUBLISHED,requireRevision:false}. `revision` is required (0 before first draft). Returns saved review with revision,updateTime,status,feedback,score,requireRevision; submission/get.review includes the same server fields. Stale revision rejects without overwriting; published reviews remain immutable.
POST `/edu/growth-report/publish` {id}; GET `/edu/request/page`; POST `/edu/request/approve|reject` {id,type:LEAVE|TRANSFER,reason?}.
GET `/edu/work/page`; POST `/edu/work/moderate` {id,status:APPROVED|REJECTED,note}; POST `/edu/work/publish` {id} requires current-version consent+approval.
POST `/edu/attendance/save` {enrollmentId,sessionId,status:PRESENT|ABSENT|EXCUSED,note}.
POST `/edu/file/upload` multipart `file,cohortId` stores scoped class materials using original infra; GET `/edu/file/get-url?fileId` and `/edu/file/content` enforce staff permission and cohort scope. Draft submission bytes remain private even from headquarters staff; a staff-readable file must be referenced by a submitted version.
All admin routes use upstream edu permissions and assigned-teacher/campus data scope, checked server-side.

## Original trade extension
Existing cart/settlement/order item adds studentId (course items quantity1). Carry through all conversions. No second checkout/payment API. StudentId absent on non-course merchandise unchanged. Aggregate SKU quantities for stock checks without merging student lines. Course deliveryType=3 (new EDUCATION service delivery); no address/shipping cost; original payment UI/API. Course order items include education enrollment info from extension when available.

Education order creation requires `expectedPayPrice` equal to the latest original server settlement total. Original after-sale creation accepts `entitlementAction:KEEP|CANCEL` and refundPrice in fen. Order responses add studentName/currentCohortName, remaining refundable amount and in-flight refund information. Existing after-sale IDs and pay-refund records remain authoritative. See [trade adaptation](TRADE_EDUCATION.md) for repeated partial refunds, stock ownership, late-payment recovery and durable refund intent states.

## Draft data
Six original course drafts (8 lessons each) and one trial template seeded. Test-only fixture may have test price/cohorts/teacher/member; not automatically published in production. Never substitute demo data when a live API fails.

## Brand operations and schedule preview
GET `/admin-api/edu/settings/get` returns `{values,revision}`; POST `/edu/settings/save` accepts that revision and a fixed values map. Original `edu:settings:query/update` permissions and original tenant/config services apply. Same-revision competing edits allow only one success. Optional empty URLs clear the stored override; HTTPS required outside localhost. UI preview does not write until saved.

POST `/admin-api/edu/session/preview` accepts the same candidate fields as session create/update. Returns `{canSave,conflicts,affectedStudents,affectedCount,checkedAt,before,proposed}`; conflict types TEACHER/ROOM/COHORT/STUDENT. It performs no schedule mutation. Final create/update independently repeats original authoritative locks/checks and sends original notifications to affected ACTIVE enrollments.

## Admissions: original CRM
App original-member routes `/edu/admission/options`, `/list?studentId?`, POST `/create` `{studentId,courseId?,contactName,mobile,message?,contactConsent,consentVersion,trialBookingId?}`, POST `/link-trial` `{clueId,trialBookingId}`. Options include enabled/consentText/consentVersion; disabled until an original active employee owner is configured at infra_config `edu.admission.owner-user-id`. Explicit true contactConsent and current consentVersion are required. Child/course/trial ownership and consistency are server-checked. Parent history exposes accepted intent/status and own linked trials; internal staff follow-up content is excluded.

Admin workbench queries original `/crm/clue/page` with educationOnly=true. `/edu/admission/get?id` resolves scoped linked trials; original `/crm/clue`, `/crm/follow-up-record` and `/crm/permission` services own follow-up/transfer/team behavior. Missing scene means only original readable records, never all employees’ clues. Team record IDs must belong to the requested business object. No edu_lead or new owner permission store.

package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.module.edu.dal.dataobject.*;
import cn.iocoder.yudao.module.edu.dal.mysql.*;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;
import static cn.iocoder.yudao.module.edu.service.EduRules.*;
import static cn.iocoder.yudao.module.edu.service.EduViews.*;

@Service
public class EduLearningService {
    @Resource private EduAccessService access;
    @Resource private EduCatalogService catalog;
    @Resource private EduEnrollmentService registration;
    @Resource private EduFileService files;
    @Resource private EduEnrollmentMapper enrollments;
    @Resource private EduAssignmentMapper assignments;
    @Resource private EduSubmissionMapper submissions;
    @Resource private EduReviewMapper reviews;
    @Resource private EduGrowthReportMapper reports;
    @Resource private EduSessionMapper sessions;
    @Resource private EduAttendanceMapper attendance;
    @Resource private EduWorkMapper works;
    @Resource private EduStudentMapper students;
    @Resource private EduCohortMapper cohorts;
    @Resource private EduNotifyService notices;

    public List<EduEnrollmentDO> ownEnrollments(Long studentId) {
        access.ownStudent(studentId);return enrollments.selectList(new LambdaQueryWrapper<EduEnrollmentDO>().eq(EduEnrollmentDO::getStudentId,studentId)
            .in(EduEnrollmentDO::getStatus,List.of("ACTIVE","COMPLETED")));
    }
    public List<Map<String,Object>> sessionList(Long studentId,Long cohortId) {
        List<Map<String,Object>> rows=new ArrayList<>();for(EduEnrollmentDO e:ownEnrollments(studentId)) {
            if(cohortId!=null&&!Objects.equals(cohortId,e.getCurrentCohortId()))continue;
            for(EduSessionDO s:catalog.sessionRows(e.getCurrentCohortId())){Map<String,Object> v=catalog.sessionView(s,false);v.put("studentId",studentId);v.put("enrollmentId",e.getId());rows.add(v);}
        }
        rows.sort(Comparator.comparingLong(v->((Number)v.get("startTime")).longValue()));return rows;
    }
    public Map<String,Object> session(Long id,Long studentId) {EduSessionDO s=found(sessions.selectById(id),"课次不存在");access.entitled(studentId,s.getCohortId(),false);return catalog.sessionView(s,true);}
    public List<Map<String,Object>> materials(Long studentId,Long sessionId) {if(sessionId==null){List<Map<String,Object>> result=new ArrayList<>();for(EduEnrollmentDO e:ownEnrollments(studentId))for(EduSessionDO s:catalog.sessionRows(e.getCurrentCohortId()))for(Map<String,Object> file:objects(s.getMaterialsJson())){file.put("sessionId",s.getId());file.put("sessionTitle",s.getTitle());result.add(file);}return result;}EduSessionDO s=found(sessions.selectById(sessionId),"课次不存在");access.entitled(studentId,s.getCohortId(),false);return objects(s.getMaterialsJson());}
    public Map<String,Object> assignmentView(EduAssignmentDO a,Long studentId) {
        Map<String,Object> v=map(a);v.put("materials",objects(a.getMaterialsJson()));v.remove("materialsJson");
        if(studentId!=null){EduSubmissionDO latest=submissions.selectOne(new LambdaQueryWrapper<EduSubmissionDO>().eq(EduSubmissionDO::getAssignmentId,a.getId()).eq(EduSubmissionDO::getStudentId,studentId).orderByDesc(EduSubmissionDO::getVersion).last("LIMIT 1"));v.put("submission",latest==null?null:submissionView(latest,false));}
        return v;
    }
    public List<Map<String,Object>> assignmentList(Long studentId,Long cohortId) {
        List<Long> ids=ownEnrollments(studentId).stream().map(EduEnrollmentDO::getCurrentCohortId).filter(id->cohortId==null||Objects.equals(cohortId,id)).toList();
        if(ids.isEmpty())return List.of();return assignments.selectList(new LambdaQueryWrapper<EduAssignmentDO>().in(EduAssignmentDO::getCohortId,ids).eq(EduAssignmentDO::getStatus,"PUBLISHED").orderByDesc(EduAssignmentDO::getId)).stream().map(a->assignmentView(a,studentId)).toList();
    }
    public Map<String,Object> assignment(Long id,Long studentId) {EduAssignmentDO a=found(assignments.selectById(id),"作业不存在");require("PUBLISHED".equals(a.getStatus()),"作业尚未发布");access.entitled(studentId,a.getCohortId(),false);return assignmentView(a,studentId);}
    public Map<String,Object> submissionView(EduSubmissionDO s,boolean admin) {
        Map<String,Object> v=map(s);v.put("attachments",objects(s.getAttachmentsJson()));v.remove("attachmentsJson");
        EduAssignmentDO a=assignments.selectById(s.getAssignmentId());if(a!=null){v.put("assignmentTitle",a.getTitle());v.put("cohortId",a.getCohortId());}
        EduStudentDO child=students.selectById(s.getStudentId());v.put("studentName",child==null?"":child.getName());
        EduReviewDO r=reviews.selectOne(EduReviewDO::getSubmissionId,s.getId());
        if(r!=null&&(admin||"PUBLISHED".equals(r.getStatus()))){v.put("review",map(r));v.put("feedback",r.getFeedback());v.put("score",r.getScore());}
        return v;
    }
    @Transactional(rollbackFor=Exception.class)
    public Map<String,Object> saveSubmission(Map<String,Object> b,boolean submit) {
        Long studentId=id(b,"studentId"),assignmentId=id(b,"assignmentId");
        EduAssignmentDO a=found(assignments.selectById(assignmentId),"作业不存在");require("PUBLISHED".equals(a.getStatus()),"作业尚未发布");
        EduEnrollmentDO e=access.entitled(studentId,a.getCohortId(),true);e=found(enrollments.selectOneForUpdate(EduEnrollmentDO::getId,e.getId()),"报名不存在");
        require("ACTIVE".equals(e.getStatus())&&Objects.equals(e.getStudentId(),studentId)&&Objects.equals(e.getCurrentCohortId(),a.getCohortId()),"报名资格已变化，请刷新后查看当前可用课程");
        String content=text(b,"content");require(content.length()<=20000,"文字内容不能超过20000字");
        String attachments=json(files.validateAttachments(b.get("attachments"),studentId));
        EduSubmissionDO previous=submissions.selectOne(new LambdaQueryWrapper<EduSubmissionDO>().eq(EduSubmissionDO::getAssignmentId,assignmentId).eq(EduSubmissionDO::getStudentId,studentId).orderByDesc(EduSubmissionDO::getVersion).last("LIMIT 1"));
        if(id(b,"id")!=null){require(previous!=null&&Objects.equals(previous.getId(),id(b,"id")),"已有更新版本，请刷新后保留草稿并重新提交");}
        if(previous!=null&&submit&&!"DRAFT".equals(previous.getStatus())&&Objects.equals(content,previous.getContent())&&Objects.equals(attachments,previous.getAttachmentsJson()))return submissionView(previous,false);
        boolean editing=previous!=null&&"DRAFT".equals(previous.getStatus());
        if(editing&&b.containsKey("revision"))require(Objects.equals(previous.getRevision(),integer(b,"revision",0)),"草稿已在另一设备更新，请刷新后合并");
        EduSubmissionDO s=editing?previous:new EduSubmissionDO().setAssignmentId(assignmentId).setStudentId(studentId).setEnrollmentId(e.getId()).setVersion(previous==null?1:previous.getVersion()+1).setRevision(0);
        if(submit)require(!content.isBlank()||!"[]".equals(attachments),"请填写作品说明或添加附件");
        s.setContent(content);s.setAttachmentsJson(attachments);s.setRevision(s.getRevision()+1);s.setStatus(submit?"SUBMITTED":"DRAFT");s.setSubmittedAt(submit?LocalDateTime.now():null);
        if(editing)submissions.updateById(s);else submissions.insert(s);return submissionView(s,false);
    }
    public Map<String,Object> adminSubmission(Long id) {access.permission("submission","query");EduSubmissionDO s=found(submissions.selectById(id),"提交记录不存在");access.adminCohort(found(assignments.selectById(s.getAssignmentId()),"作业不存在").getCohortId());require(!"DRAFT".equals(s.getStatus()),"家长私人草稿尚未提交");return submissionView(s,true);}
    @Transactional(rollbackFor=Exception.class)
    public Map<String,Object> review(Map<String,Object> b) {
        access.permission("submission","review");Long id=id(b,"id");adminSubmission(id);EduSubmissionDO s=found(submissions.selectOneForUpdate(EduSubmissionDO::getId,id),"提交不存在");
        String state=text(b,"status");require(Set.of("DRAFT","PUBLISHED").contains(state),"点评状态无效");String feedback=requiredText(b,"feedback",10000);int score=integer(b,"score",0);require(score>=0&&score<=100,"评价分值应在0—100之间");
        int expectedRevision=integer(b,"revision",-1);require(expectedRevision>=0,"请提供当前点评草稿修订号");
        // The submission lock serializes the first draft too. Use a current read after
        // waiting: adminSubmission may already have established a repeatable-read snapshot.
        EduReviewDO r=reviews.selectOneForUpdate(EduReviewDO::getSubmissionId,id);boolean fresh=r==null;
        if(fresh)r=new EduReviewDO().setSubmissionId(id);else require(!"PUBLISHED".equals(r.getStatus()),"已发布点评不可覆盖，请让学员重交后点评新版本");
        int currentRevision=Objects.requireNonNullElse(r.getRevision(),0);
        require(expectedRevision==currentRevision,"点评草稿已由其他教师或设备更新，请保留当前输入并刷新后合并");
        r.setRevision(currentRevision+1);
        r.setTeacherId(access.actor());r.setFeedback(feedback);r.setScore(score);r.setStatus(state);r.setRequireRevision(Boolean.TRUE.equals(b.get("requireRevision")));r.setPublishedAt("PUBLISHED".equals(state)?LocalDateTime.now():null);
        if(fresh)reviews.insert(r);else {r.clean();reviews.updateById(r);}
        if("PUBLISHED".equals(state)){s.setStatus(r.getRequireRevision()?"REVISION_REQUIRED":"REVIEWED");submissions.updateById(s);notices.guardian(s.getStudentId(),"作业点评已发布",r.getRequireRevision()?"老师提供了修改建议，请查看对应作业版本。":"老师已完成点评，请查看学习反馈。");}
        // Read the persisted audit timestamp rather than reporting a client clock or
        // the pre-update object's timestamp as the successful save time.
        return map(reviews.selectOneForUpdate(EduReviewDO::getId,r.getId()));
    }
    public List<Map<String,Object>> reviewList(Long studentId,Long assignmentId) {
        access.ownStudent(studentId);List<Map<String,Object>> result=new ArrayList<>();
        for(EduSubmissionDO s:submissions.selectList(new LambdaQueryWrapper<EduSubmissionDO>().eq(EduSubmissionDO::getStudentId,studentId).eq(assignmentId!=null,EduSubmissionDO::getAssignmentId,assignmentId).ne(EduSubmissionDO::getStatus,"DRAFT").orderByDesc(EduSubmissionDO::getId)))result.add(submissionView(s,false));return result;
    }
    public Map<String,Object> reportView(EduGrowthReportDO r) {Map<String,Object> v=map(r);Map<String,Object> detail=r.getDimensionsJson()==null||r.getDimensionsJson().isBlank()?Map.of():cn.iocoder.yudao.framework.common.util.json.JsonUtils.parseObject(r.getDimensionsJson(),Map.class);v.putAll(detail);v.put("summary",r.getContent());v.remove("dimensionsJson");EduEnrollmentDO e=enrollments.selectById(r.getEnrollmentId());if(e!=null)v.put("cohortId",e.getCurrentCohortId());return v;}
    public List<Map<String,Object>> reportList(Long studentId){access.ownStudent(studentId);return reports.selectList(new LambdaQueryWrapper<EduGrowthReportDO>().eq(EduGrowthReportDO::getStudentId,studentId).eq(EduGrowthReportDO::getStatus,"PUBLISHED").orderByDesc(EduGrowthReportDO::getId)).stream().map(this::reportView).toList();}
    public Map<String,Object> report(Long id,Long studentId){EduGrowthReportDO r=found(reports.selectById(id),"报告不存在");access.ownStudent(r.getStudentId());require(studentId==null||Objects.equals(studentId,r.getStudentId()),"报告不属于当前孩子");require("PUBLISHED".equals(r.getStatus()),"报告尚未发布");return reportView(r);}
    public List<Map<String,Object>> attendanceEnrollments(Long sessionId,Long requestedCohortId) {
        EduSessionDO session=found(sessions.selectById(sessionId),"课次不存在");access.adminCohort(session.getCohortId());
        require(requestedCohortId==null||Objects.equals(requestedCohortId,session.getCohortId()),"课次不属于所选班期");
        List<Map<String,Object>> result=new ArrayList<>();
        for(EduEnrollmentDO e:enrollments.selectList(EduEnrollmentDO::getCurrentCohortId,session.getCohortId())) {
            Map<String,Object> row=registration.enrollmentView(e);
            EduAttendanceDO saved=attendance.selectOne(EduAttendanceDO::getEnrollmentId,e.getId(),EduAttendanceDO::getSessionId,sessionId);
            row.put("attendanceStatus",saved==null?null:saved.getStatus());row.put("attendanceNote",saved==null?"":Objects.requireNonNullElse(saved.getNote(),""));
            row.put("attendanceUpdateTime",saved==null?null:map(saved).get("updateTime"));result.add(row);
        }
        return result;
    }
    @Transactional(rollbackFor=Exception.class)
    public void attendance(Map<String,Object> b) {access.permission("attendance","save");EduEnrollmentDO e=found(enrollments.selectById(id(b,"enrollmentId")),"报名不存在");EduSessionDO s=found(sessions.selectById(id(b,"sessionId")),"课次不存在");access.adminCohort(s.getCohortId());require(Objects.equals(s.getCohortId(),e.getCurrentCohortId())&&Set.of("ACTIVE","COMPLETED").contains(e.getStatus()),"报名与本课次不匹配");e=found(enrollments.selectOneForUpdate(EduEnrollmentDO::getId,e.getId()),"报名不存在");require(Objects.equals(s.getCohortId(),e.getCurrentCohortId())&&Set.of("ACTIVE","COMPLETED").contains(e.getStatus()),"报名资格已变化，请刷新");String status=text(b,"status");require(Set.of("PRESENT","ABSENT","EXCUSED").contains(status),"出勤状态无效");EduAttendanceDO a=attendance.selectOne(EduAttendanceDO::getEnrollmentId,e.getId(),EduAttendanceDO::getSessionId,s.getId());boolean fresh=a==null;if(fresh)a=new EduAttendanceDO().setEnrollmentId(e.getId()).setSessionId(s.getId());a.setStatus(status);a.setNote(text(b,"note"));if(fresh)attendance.insert(a);else attendance.updateById(a);}
    public Map<String,Object> dashboard(Long studentId) {
        Map<String,Object> v=new LinkedHashMap<>();EduStudentDO s=access.ownStudent(studentId);v.put("student",registration.studentView(s,false));List<EduEnrollmentDO> es=ownEnrollments(studentId);
        v.put("enrollments",es.stream().map(registration::enrollmentView).toList());v.put("courses",es.stream().map(e->catalog.cohortView(cohorts.selectById(e.getCurrentCohortId()),false)).toList());
        List<Map<String,Object>> timeline=sessionList(studentId,null);long now=System.currentTimeMillis();v.put("nextSession",timeline.stream().filter(x->((Number)x.get("endTime")).longValue()>now).findFirst().orElse(null));
        List<Map<String,Object>> pending=assignmentList(studentId,null).stream().filter(x->{Object sub=x.get("submission");return sub==null||Set.of("DRAFT","REVISION_REQUIRED").contains(((Map<?,?>)sub).get("status"));}).toList();v.put("pendingAssignments",pending);
        v.put("stats",Map.of("courses",es.size(),"completedSessions",timeline.stream().filter(x->((Number)x.get("endTime")).longValue()<now).count(),"pendingAssignments",pending.size(),"works",works.selectCount(EduWorkDO::getStudentId,studentId)));return v;
    }
}

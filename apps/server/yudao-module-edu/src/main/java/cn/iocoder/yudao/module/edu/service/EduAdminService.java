package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.module.edu.dal.dataobject.*;
import cn.iocoder.yudao.module.edu.dal.mysql.*;
import cn.iocoder.yudao.module.system.api.dept.DeptApi;
import cn.iocoder.yudao.module.system.api.user.AdminUserApi;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;
import static cn.iocoder.yudao.module.edu.service.EduRules.*;
import static cn.iocoder.yudao.module.edu.service.EduViews.*;

/** Explicit resource allowlist; upstream authorization and mappers remain authoritative. */
@Service
public class EduAdminService {
    @Resource private EduAccessService access;
    @Resource private EduCatalogService catalog;
    @Resource private EduEnrollmentService registration;
    @Resource private EduLearningService learning;
    @Resource private EduWorkService workService;
    @Resource private DeptApi departments;
    @Resource private AdminUserApi users;
    @Resource private EduCampusMapper campuses;
    @Resource private EduRoomMapper rooms;
    @Resource private EduTeacherProfileMapper teachers;
    @Resource private EduCohortMapper cohorts;
    @Resource private EduSessionMapper sessions;
    @Resource private EduStudentMapper students;
    @Resource private EduEnrollmentMapper enrollments;
    @Resource private EduTrialBookingMapper trials;
    @Resource private EduAssignmentMapper assignments;
    @Resource private EduSubmissionMapper submissions;
    @Resource private EduGrowthReportMapper reports;
    @Resource private EduWorkMapper works;
    @Resource private EduFileService files;
    @Resource private EduNotifyService notices;

    public List<Map<String,Object>> publicCampuses(){return campuses.selectList(EduCampusDO::getStatus,"PUBLISHED").stream().map(c->{Map<String,Object> v=map(c);v.remove("deptId");return v;}).toList();}
    public List<Map<String,Object>> publicTeachers(){return teachers.selectList(EduTeacherProfileDO::getStatus,"PUBLISHED").stream().map(t->{Map<String,Object> v=map(t);v.remove("userId");return v;}).toList();}
    public Map<String,Object> pageResource(String resource,Map<String,Object> p) {
        access.permission(resource,"query");if("course".equals(resource))return catalog.coursePage(p,true);
        List<Map<String,Object>> list=new ArrayList<>();
        switch(resource) {
            case "campus" -> campuses.selectList().stream().filter(c->access.campusAllowed(c.getId())).map(EduViews::map).forEach(list::add);
            case "room" -> rooms.selectList().stream().filter(r->access.campusAllowed(r.getCampusId())).map(EduViews::map).forEach(list::add);
            case "teacher" -> teachers.selectList().stream().filter(t->access.allData()||Objects.equals(t.getUserId(),access.actor())||cohorts.selectList(EduCohortDO::getTeacherId,t.getId()).stream().anyMatch(access::cohortAllowed)).map(EduViews::map).forEach(list::add);
            case "cohort" -> cohorts.selectList().stream().filter(access::cohortAllowed).map(c->catalog.cohortView(c,true)).forEach(list::add);
            case "session" -> sessions.selectList().stream().filter(s->allowed(s.getCohortId())).map(s->catalog.sessionView(s,true)).forEach(list::add);
            case "student" -> students.selectList().stream().filter(s->studentAllowed(s.getId())).map(s->registration.studentView(s,true)).forEach(list::add);
            case "enrollment" -> {if(id(p,"sessionId")!=null)list.addAll(learning.attendanceEnrollments(id(p,"sessionId"),id(p,"cohortId")));else enrollments.selectList().stream().filter(e->allowed(e.getCurrentCohortId())).map(registration::enrollmentView).forEach(list::add);}
            case "trial" -> trials.selectList().stream().filter(t->allowed(t.getCohortId())).map(registration::trialView).forEach(list::add);
            case "assignment" -> assignments.selectList().stream().filter(a->allowed(a.getCohortId())).map(a->learning.assignmentView(a,null)).forEach(list::add);
            case "submission" -> submissions.selectList().stream().filter(s->!"DRAFT".equals(s.getStatus())&&assignmentAllowed(s.getAssignmentId())).map(s->learning.submissionView(s,true)).forEach(list::add);
            case "growth-report" -> reports.selectList().stream().filter(r->enrollmentAllowed(r.getEnrollmentId())).map(learning::reportView).forEach(list::add);
            case "request" -> list.addAll(registration.requests(null,true));
            case "work" -> works.selectList().stream().filter(w->{EduSubmissionDO s=submissions.selectById(w.getSubmissionId());return s!=null&&assignmentAllowed(s.getAssignmentId());}).map(w->workService.view(w,false)).forEach(list::add);
            default -> require(false,"不支持的教育资源");
        }
        String keyword=text(p,"keyword");if(keyword.isBlank())keyword=text(p,"name");String search=keyword;
        list.removeIf(v->!search.isBlank()&&!String.valueOf(v.getOrDefault("name",v.getOrDefault("title",v.getOrDefault("studentName","")))).contains(search));
        for(String filter:List.of("status","cohortId","studentId","campusId","kind","type","assignmentId","teacherId"))if(p.containsKey(filter)&&!text(p,filter).isBlank())list.removeIf(v->!String.valueOf(v.get(filter)).equals(text(p,filter)));
        list.sort(Comparator.comparingLong((Map<String,Object> v)->((Number)v.get("id")).longValue()).reversed());return page(list,integer(p,"pageNo",1),integer(p,"pageSize",20));
    }
    private boolean allowed(Long id){return access.cohortAllowed(cohorts.selectById(id));}
    private boolean studentAllowed(Long id){if(access.allData())return true;return enrollments.selectList(EduEnrollmentDO::getStudentId,id).stream().anyMatch(e->allowed(e.getCurrentCohortId()));}
    private boolean enrollmentAllowed(Long id){EduEnrollmentDO e=enrollments.selectById(id);return e!=null&&allowed(e.getCurrentCohortId());}
    private boolean assignmentAllowed(Long id){EduAssignmentDO a=assignments.selectById(id);return a!=null&&allowed(a.getCohortId());}
    public Map<String,Object> get(String resource,Long id) {
        access.permission(resource,"query");
        return switch(resource) {
            case "course" -> catalog.course(id,true);
            case "cohort" -> catalog.cohort(id,true);
            case "session" -> {EduSessionDO s=found(sessions.selectById(id),"课次不存在");access.adminCohort(s.getCohortId());yield catalog.sessionView(s,true);}
            case "student" -> {access.adminStudent(id);yield registration.studentView(found(students.selectById(id),"孩子不存在"),true);}
            case "campus" -> {access.adminCampus(id);yield map(found(campuses.selectById(id),"校区不存在"));}
            case "room" -> {EduRoomDO r=found(rooms.selectById(id),"教室不存在");access.adminCampus(r.getCampusId());yield map(r);}
            case "teacher" -> {EduTeacherProfileDO t=found(teachers.selectById(id),"教师不存在");require(access.allData()||Objects.equals(t.getUserId(),access.actor())||cohorts.selectList(EduCohortDO::getTeacherId,id).stream().anyMatch(access::cohortAllowed),"无权查看该教师档案");yield map(t);}
            case "assignment" -> {EduAssignmentDO a=found(assignments.selectById(id),"作业不存在");access.adminCohort(a.getCohortId());yield learning.assignmentView(a,null);}
            case "submission" -> learning.adminSubmission(id);
            case "growth-report" -> {EduGrowthReportDO r=found(reports.selectById(id),"报告不存在");require(enrollmentAllowed(r.getEnrollmentId()),"无权查看报告");yield learning.reportView(r);}
            case "work" -> workService.view(workService.adminWork(id),true);
            default -> throw new cn.iocoder.yudao.framework.common.exception.ServiceException(1_090_000_001,"该资源不支持详情操作");
        };
    }
    @Transactional(rollbackFor=Exception.class)
    public Long save(String resource,Map<String,Object> b) {
        Long id=id(b,"id");access.permission(resource,id==null?"create":"update");
        switch(resource){
            case "course": return catalog.saveCourse(b);
            case "cohort": return catalog.saveCohort(b);
            case "session": return catalog.saveSession(b);
            case "campus": {
                if(id!=null)access.adminCampus(id);Long deptId=id(b,"deptId");departments.validateDeptList(List.of(found(deptId,"请选择原系统部门")));
                require(access.allData()||(id!=null&&Objects.equals(campuses.selectById(id).getDeptId(),deptId)),"校区部门映射须由总部配置");
                EduCampusDO c=id==null?new EduCampusDO():found(campuses.selectOneForUpdate(EduCampusDO::getId,id),"校区不存在");c.setDeptId(deptId);c.setName(requiredText(b,"name",120));c.setCity(text(b,"city"));c.setAddress(text(b,"address"));c.setLatitude(text(b,"latitude"));c.setLongitude(text(b,"longitude"));c.setDescription(text(b,"description"));c.setStatus(publicationState(b));if(id==null)campuses.insert(c);else campuses.updateById(c);return c.getId();
            }
            case "room": {
                if(id!=null)access.adminCampus(found(rooms.selectById(id),"教室不存在").getCampusId());Long campusId=id(b,"campusId");access.adminCampus(campusId);
                EduRoomDO r=id==null?new EduRoomDO():found(rooms.selectOneForUpdate(EduRoomDO::getId,id),"教室不存在");r.setCampusId(campusId);r.setName(requiredText(b,"name",120));r.setCapacity(integer(b,"capacity",12));require(r.getCapacity()>0,"教室容量必须为正数");if(id==null)rooms.insert(r);else rooms.updateById(r);return r.getId();
            }
            case "teacher": {
                require(access.allData(),"师资与员工身份映射须由总部配置");Long userId=found(id(b,"userId"),"请选择原员工账号");users.validateUser(userId);
                EduTeacherProfileDO t=id==null?new EduTeacherProfileDO():found(teachers.selectOneForUpdate(EduTeacherProfileDO::getId,id),"师资不存在");if(id!=null)require(Objects.equals(t.getUserId(),userId),"已有师资档案不能改绑员工身份");t.setUserId(userId);t.setName(requiredText(b,"name",80));t.setBio(text(b,"bio"));t.setAvatarUrl(text(b,"avatarUrl"));t.setStatus(publicationState(b));
                if(b.containsKey("oneToOneEnabled")){require(b.get("oneToOneEnabled") instanceof Boolean,"一对一预约开关格式无效");t.setOneToOneEnabled((Boolean)b.get("oneToOneEnabled"));}
                else if(id==null)t.setOneToOneEnabled(false);
                if(Boolean.TRUE.equals(t.getOneToOneEnabled()))require("PUBLISHED".equals(t.getStatus())&&!t.getBio().isBlank(),"开放一对一预约前请完善简介并发布教师资料");
                if(id==null)teachers.insert(t);else teachers.updateById(t);return t.getId();
            }
            case "assignment": {
                Long cohortId=id(b,"cohortId");access.adminCohort(cohortId);EduAssignmentDO a=id==null?new EduAssignmentDO():found(assignments.selectOneForUpdate(EduAssignmentDO::getId,id),"作业不存在");if(id!=null)require(Objects.equals(a.getCohortId(),cohortId),"已建作业不能移动到其他班期");
                a.setCohortId(cohortId);a.setSessionId(id(b,"sessionId"));if(a.getSessionId()!=null)require(Objects.equals(found(sessions.selectById(a.getSessionId()),"课次不存在").getCohortId(),cohortId),"课次不属于当前班期");a.setTitle(requiredText(b,"title",160));a.setDescription(requiredText(b,"description",15000));a.setDueTime(time(b.get("dueTime")));a.setMaterialsJson(json(files.validateMaterials(b.get("materials"),cohortId)));a.setStatus(publicationState(b));if(id==null)assignments.insert(a);else assignments.updateById(a);return a.getId();
            }
            case "growth-report": {
                EduEnrollmentDO e=id(b,"enrollmentId")!=null?enrollments.selectById(id(b,"enrollmentId")):enrollments.selectOne(new LambdaQueryWrapper<EduEnrollmentDO>().eq(EduEnrollmentDO::getStudentId,id(b,"studentId")).eq(EduEnrollmentDO::getCurrentCohortId,id(b,"cohortId")).in(EduEnrollmentDO::getStatus,List.of("ACTIVE","COMPLETED")));
                found(e,"请选择有效报名的孩子及班期");access.adminCohort(e.getCurrentCohortId());EduGrowthReportDO r=id==null?new EduGrowthReportDO():found(reports.selectOneForUpdate(EduGrowthReportDO::getId,id),"报告不存在");
                if(id!=null){require(Objects.equals(r.getEnrollmentId(),e.getId()),"报告不能改绑孩子或报名");require(!"PUBLISHED".equals(r.getStatus()),"已发布报告不可覆盖，请新建下一阶段报告");if(b.containsKey("version"))require(Objects.equals(r.getVersion(),integer(b,"version",0)),"报告草稿已更新，请刷新");}
                r.setStudentId(e.getStudentId());r.setEnrollmentId(e.getId());r.setTitle(requiredText(b,"title",160));r.setContent(requiredText(b,"summary",10000));r.setDimensionsJson(json(Map.of("strengths",text(b,"strengths"),"nextSteps",text(b,"nextSteps"))));r.setStatus("DRAFT");r.setVersion(Objects.requireNonNullElse(r.getVersion(),0)+1);if(id==null)reports.insert(r);else reports.updateById(r);return r.getId();
            }
            default: require(false,"此资源不能通过通用表单写入");return null;
        }
    }
    private String publicationState(Map<String,Object> b){String s=text(b,"status");if(s.isBlank())s="DRAFT";require(Set.of("DRAFT","PUBLISHED","ARCHIVED").contains(s),"发布状态无效");return s;}
    @Transactional(rollbackFor=Exception.class)
    public void publishReport(Long id){access.permission("growth-report","publish");EduGrowthReportDO r=found(reports.selectOneForUpdate(EduGrowthReportDO::getId,id),"报告不存在");require(enrollmentAllowed(r.getEnrollmentId()),"无权发布报告");require(r.getContent()!=null&&!r.getContent().isBlank(),"请完善报告内容");r.setStatus("PUBLISHED");r.setPublishedAt(LocalDateTime.now());reports.updateById(r);notices.guardian(r.getStudentId(),"成长报告已发布",r.getTitle());}
    public Map<String,Object> dashboard(){access.permission("dashboard","query");List<EduCohortDO> visible=cohorts.selectList().stream().filter(access::cohortAllowed).toList();Set<Long> ids=new HashSet<>();visible.forEach(c->ids.add(c.getId()));LocalDate today=LocalDate.now();List<EduSessionDO> next=sessions.selectList().stream().filter(s->ids.contains(s.getCohortId())&&s.getEndTime().isAfter(LocalDateTime.now())).sorted(Comparator.comparing(EduSessionDO::getStartTime)).toList();Map<String,Object> v=new LinkedHashMap<>();v.put("todaySessions",next.stream().filter(s->s.getStartTime().toLocalDate().equals(today)).count());v.put("upcomingSessions",next.stream().limit(8).map(s->catalog.sessionView(s,true)).toList());v.put("openCohorts",visible.stream().filter(c->"OPEN".equals(c.getStatus())).count());v.put("activeStudents",enrollments.selectList().stream().filter(e->ids.contains(e.getCurrentCohortId())&&"ACTIVE".equals(e.getStatus())).map(EduEnrollmentDO::getStudentId).distinct().count());v.put("pendingReviews",submissions.selectList().stream().filter(s->"SUBMITTED".equals(s.getStatus())&&assignmentAllowed(s.getAssignmentId())).count());return v;}
}

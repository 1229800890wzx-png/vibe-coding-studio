package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.module.crm.controller.admin.clue.vo.CrmClueSaveReqVO;
import cn.iocoder.yudao.module.crm.dal.dataobject.clue.CrmClueDO;
import cn.iocoder.yudao.module.crm.dal.mysql.clue.CrmClueMapper;
import cn.iocoder.yudao.module.crm.service.clue.CrmClueService;
import cn.iocoder.yudao.module.edu.dal.dataobject.*;
import cn.iocoder.yudao.module.edu.dal.mysql.*;
import cn.iocoder.yudao.module.infra.api.config.ConfigApi;
import cn.iocoder.yudao.module.system.api.user.AdminUserApi;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;
import static cn.iocoder.yudao.module.edu.service.EduRules.*;

/** Education origin adapter over original CRM lead/owner/data permissions; no parallel lead store. */
@Service
public class EduAdmissionService {
    public static final String CONSENT_VERSION = "education-consultation-2026-09";
    public static final String OWNER_CONFIG_KEY = "edu.admission.owner-user-id";
    @Resource private EduAccessService access;
    @Resource private EduStudentMapper students;
    @Resource private EduCourseMapper courses;
    @Resource private EduCohortMapper cohorts;
    @Resource private EduTrialBookingMapper trials;
    @Resource private CrmClueService clues;
    @Resource private CrmClueMapper clueMapper;
    @Resource private ConfigApi config;
    @Resource private AdminUserApi users;
    @Resource private EduTeacherService teacherDirectory;

    public Map<String,Object> options() {
        String configured = config.getConfigValueByKey(OWNER_CONFIG_KEY);
        boolean enabled = false;
        if (configured != null && configured.matches("[1-9][0-9]*")) {
            var owner = users.getUser(Long.valueOf(configured)); enabled = owner != null && Objects.equals(owner.getStatus(), 0);
        }
        return Map.of("enabled", enabled, "consentVersion", CONSENT_VERSION,
                "consentText", "我同意机构使用本次提交的联系信息、孩子及学习意向，安排课程咨询、试听或一对一预约申请跟进。");
    }

    @Transactional(rollbackFor = Exception.class)
    public Map<String,Object> create(Long studentId, Long courseId, String contactName, String mobile,
                                      String message, Boolean consent, String consentVersion, Long trialBookingId,
                                      String serviceType, Long teacherId, String preferredStartTime, String preferredEndTime) {
        require(Boolean.TRUE.equals(consent) && CONSENT_VERSION.equals(consentVersion), "请阅读并同意本次咨询联系授权");
        String type = serviceType == null ? "COURSE" : serviceType;
        require(Set.of("COURSE", "ONE_TO_ONE").contains(type), "课程服务类型无效");
        boolean oneToOne = "ONE_TO_ONE".equals(type);
        LocalDateTime start = null, end = null;
        EduTeacherProfileDO teacher = null;
        if (oneToOne) {
            require(trialBookingId == null, "一对一预约申请不能关联班课试听预约");
            require(message != null && !message.isBlank() && message.trim().length() <= 1000, "请填写孩子的学习目标，最多 1000 字");
            start = time(preferredStartTime); end = time(preferredEndTime);
            validatePreferredTime(start, end, LocalDateTime.now(ZoneId.of("Asia/Shanghai")));
        } else require(teacherId == null && preferredStartTime == null && preferredEndTime == null, "选老师和期望时段请通过一对一预约申请提交");
        access.ownStudent(studentId);
        var student = found(students.selectOneForUpdate(EduStudentDO::getId, studentId), "孩子档案不存在");
        require(Objects.equals(student.getGuardianMemberId(), access.actor()), "无权访问该孩子资料");
        if (oneToOne) teacher = teacherDirectory.requireOneToOne(teacherId);
        if (courseId != null) require("PUBLISHED".equals(found(courses.selectById(courseId), "课程不存在").getStatus()), "课程尚未发布");
        String configured = config.getConfigValueByKey(OWNER_CONFIG_KEY);
        require(configured != null && configured.matches("[1-9][0-9]*"), "咨询受理尚未配置，请通过已公布的服务电话联系");
        Long ownerId = Long.valueOf(configured);
        var owner = found(users.getUser(ownerId), "咨询受理尚未配置");
        require(Objects.equals(owner.getStatus(), 0), "咨询受理暂不可用");
        String title = contactName.trim() + " · " + student.getName() + (oneToOne ? "一对一高级课程预约" : "课程咨询");
        String remark = message == null ? "" : message.trim();
        var duplicateQuery = new LambdaQueryWrapper<CrmClueDO>()
                .eq(CrmClueDO::getEducationMemberId, access.actor()).eq(CrmClueDO::getEducationStudentId, studentId)
                .eq(courseId != null, CrmClueDO::getEducationCourseId, courseId).isNull(courseId == null, CrmClueDO::getEducationCourseId)
                .eq(CrmClueDO::getName, title).eq(CrmClueDO::getMobile, mobile).eq(CrmClueDO::getRemark, remark);
        if (oneToOne) duplicateQuery.eq(CrmClueDO::getEducationServiceType, type)
                .eq(CrmClueDO::getEducationTeacherId, teacherId)
                .eq(CrmClueDO::getEducationPreferredStartTime, start).eq(CrmClueDO::getEducationPreferredEndTime, end)
                .eq(CrmClueDO::getEducationAppointmentStatus, "REQUESTED");
        else duplicateQuery.and(q -> q.eq(CrmClueDO::getEducationServiceType, "COURSE").or().isNull(CrmClueDO::getEducationServiceType))
                .eq(CrmClueDO::getFollowUpStatus, false).eq(CrmClueDO::getTransformStatus, false);
        // ownStudent may establish an earlier REPEATABLE READ snapshot before waiting on the
        // student lock. Read current committed requests here so queued submits see the winner.
        var pending = clueMapper.selectList(duplicateQuery.orderByDesc(CrmClueDO::getId).last("LIMIT 1 FOR UPDATE"));
        Long id;
        if (!pending.isEmpty()) id = pending.get(0).getId();
        else {
            var request = new CrmClueSaveReqVO().setName(title).setMobile(mobile).setOwnerUserId(ownerId).setSource(90).setRemark(remark);
            id = clues.createClue(request); // Original owner validation, permission creation and operation audit.
            clueMapper.updateById(CrmClueDO.builder().id(id).educationMemberId(access.actor()).educationStudentId(studentId)
                    .educationCourseId(courseId).educationConsentTime(LocalDateTime.now()).educationConsentVersion(CONSENT_VERSION).build());
            // Protected origin fields use explicit updates; ordinary CRM editing cannot overwrite them.
            clueMapper.update(null, new LambdaUpdateWrapper<CrmClueDO>().eq(CrmClueDO::getId, id)
                    .set(CrmClueDO::getEducationOrigin, "MINIAPP").set(CrmClueDO::getEducationServiceType, type).set(CrmClueDO::getEducationTeacherId, teacherId)
                    .set(CrmClueDO::getEducationTeacherName, teacher == null ? null : teacher.getName())
                    .set(CrmClueDO::getEducationPreferredStartTime, start).set(CrmClueDO::getEducationPreferredEndTime, end)
                    .set(CrmClueDO::getEducationAppointmentStatus, oneToOne ? "REQUESTED" : null));
        }
        var current = found(clueMapper.selectOneForUpdate(CrmClueDO::getId, id), "咨询不存在");
        if (trialBookingId != null) linkTrial(current, trialBookingId);
        return parentView(current);
    }

    static void validatePreferredTime(LocalDateTime start, LocalDateTime end, LocalDateTime now) {
        require(start != null && end != null && start.isAfter(now), "请选择未来的期望上课时间");
        Duration duration = Duration.between(start, end);
        require(duration.compareTo(Duration.ofMinutes(30)) >= 0 && duration.compareTo(Duration.ofMinutes(180)) <= 0,
                "期望时段应为 30—180 分钟");
        require(start.getSecond() == 0 && end.getSecond() == 0 && start.getNano() == 0 && end.getNano() == 0,
                "期望上课时间请精确到分钟");
    }

    @Transactional(rollbackFor = Exception.class)
    public Map<String,Object> cancel(Long id) {
        var before = found(clueMapper.selectById(id), "预约申请不存在");
        require(Objects.equals(before.getEducationMemberId(), access.actor()), "无权撤回此预约申请");
        // Same lock order as create: student then clue. Repeated withdrawal is idempotent.
        access.ownStudent(before.getEducationStudentId());
        students.selectOneForUpdate(EduStudentDO::getId, before.getEducationStudentId());
        var clue = found(clueMapper.selectOneForUpdate(CrmClueDO::getId, id), "预约申请不存在");
        require(Objects.equals(clue.getEducationMemberId(), access.actor()) && "ONE_TO_ONE".equals(clue.getEducationServiceType()), "仅可撤回本人的一对一预约申请");
        if (!"CANCELLED".equals(clue.getEducationAppointmentStatus())) {
            require("REQUESTED".equals(clue.getEducationAppointmentStatus()), "此预约申请当前不可撤回");
            clueMapper.update(null, new LambdaUpdateWrapper<CrmClueDO>().eq(CrmClueDO::getId, id)
                    .set(CrmClueDO::getEducationAppointmentStatus, "CANCELLED"));
            clue.setEducationAppointmentStatus("CANCELLED");
        }
        return parentView(clue);
    }

    public List<Map<String,Object>> list(Long studentId) {
        if (studentId != null) access.ownStudent(studentId);
        return clueMapper.selectList(new LambdaQueryWrapper<CrmClueDO>().eq(CrmClueDO::getEducationMemberId, access.actor())
                .eq(studentId != null, CrmClueDO::getEducationStudentId, studentId).orderByDesc(CrmClueDO::getId).last("LIMIT 100"))
                .stream().map(this::parentView).toList();
    }

    @Transactional(rollbackFor = Exception.class)
    public void linkTrial(Long clueId, Long trialId) {
        var clue = found(clueMapper.selectById(clueId), "咨询不存在");
        linkTrial(clue, trialId);
    }
    private void linkTrial(CrmClueDO clue, Long trialId) {
        Long clueId = clue.getId();
        require(Objects.equals(clue.getEducationMemberId(), access.actor()), "无权关联此咨询");
        require(!"ONE_TO_ONE".equals(clue.getEducationServiceType()), "一对一预约申请不能关联班课试听预约");
        access.ownStudent(clue.getEducationStudentId());
        students.selectOneForUpdate(EduStudentDO::getId, clue.getEducationStudentId());
        var trial = found(trials.selectOneForUpdate(EduTrialBookingDO::getId, trialId), "试听预约不存在");
        require(Objects.equals(trial.getStudentId(), clue.getEducationStudentId()), "试听与咨询必须属于同一孩子");
        var cohort = found(cohorts.selectById(trial.getCohortId()), "班期不存在");
        require(clue.getEducationCourseId() == null || Objects.equals(clue.getEducationCourseId(), cohort.getCourseId()), "试听与咨询课程不一致");
        require(trial.getCrmClueId() == null || Objects.equals(trial.getCrmClueId(), clueId), "此试听已经关联其他咨询");
        trial.setCrmClueId(clueId); trials.updateById(trial);
    }

    public Map<String,Object> staffDetail(Long id) {
        CrmClueDO clue = found(clues.getClue(id), "线索不存在"); // Original @CrmPermission READ enforcement.
        require(Set.of("WEBSITE", "MINIAPP").contains(Objects.requireNonNullElse(clue.getEducationOrigin(), "")) || (clue.getEducationOrigin() == null && clue.getEducationMemberId() != null), "此线索不是教育咨询");
        Map<String,Object> view = new LinkedHashMap<>(); view.put("clue", clue);
        view.put("trials", linkedTrials(clue)); return view;
    }
    private List<Map<String,Object>> linkedTrials(CrmClueDO clue) {
        if (clue.getEducationStudentId() == null) return List.of();
        return trials.selectList(new LambdaQueryWrapper<EduTrialBookingDO>().eq(EduTrialBookingDO::getCrmClueId, clue.getId())
                .eq(EduTrialBookingDO::getStudentId, clue.getEducationStudentId()).orderByDesc(EduTrialBookingDO::getId))
                .stream().map(t -> { Map<String,Object> v = new LinkedHashMap<>(); var c = cohorts.selectById(t.getCohortId());
                    v.put("id", t.getId()); v.put("cohortId", t.getCohortId()); v.put("cohortName", c == null ? "班期已归档" : c.getName());
                    v.put("status", t.getStatus()); v.put("orderItemId", t.getOrderItemId()); return v; }).toList();
    }
    private Map<String,Object> parentView(CrmClueDO clue) {
        Map<String,Object> v = new LinkedHashMap<>(); v.put("id", clue.getId()); v.put("studentId", clue.getEducationStudentId());
        v.put("courseId", clue.getEducationCourseId()); v.put("name", clue.getName()); v.put("createTime", clue.getCreateTime());
        v.put("serviceType", Objects.requireNonNullElse(clue.getEducationServiceType(), "COURSE"));
        v.put("teacherId", clue.getEducationTeacherId()); v.put("teacherName", clue.getEducationTeacherName());
        v.put("preferredStartTime", clue.getEducationPreferredStartTime()); v.put("preferredEndTime", clue.getEducationPreferredEndTime());
        v.put("appointmentStatus", clue.getEducationAppointmentStatus());
        v.put("followUpStatus", Boolean.TRUE.equals(clue.getFollowUpStatus())); v.put("contactNextTime", clue.getContactNextTime());
        v.put("consentVersion", clue.getEducationConsentVersion()); v.put("trials", linkedTrials(clue)); return v;
    }
}

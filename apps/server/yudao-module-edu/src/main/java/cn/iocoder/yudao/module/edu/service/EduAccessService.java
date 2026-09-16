package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.framework.common.biz.system.permission.dto.DeptDataPermissionRespDTO;
import cn.iocoder.yudao.module.edu.dal.dataobject.*;
import cn.iocoder.yudao.module.edu.dal.mysql.*;
import cn.iocoder.yudao.module.system.api.permission.PermissionApi;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import java.util.*;
import static cn.iocoder.yudao.framework.security.core.util.SecurityFrameworkUtils.getLoginUserId;
import static cn.iocoder.yudao.module.edu.service.EduRules.*;

@Service
public class EduAccessService {
    @Resource private PermissionApi permissionApi;
    @Resource private EduStudentMapper students;
    @Resource private EduCohortMapper cohorts;
    @Resource private EduCampusMapper campuses;
    @Resource private EduTeacherProfileMapper teachers;
    @Resource private EduSessionMapper sessions;
    @Resource private EduEnrollmentMapper enrollments;

    public Long actor() { return found(getLoginUserId(),"请先登录"); }
    public void permission(String resource,String action) { require(permissionApi.hasAnyPermissions(actor(),"edu:"+resource+":"+action),"没有此操作权限"); }
    public void anyPermission(String... permissions) {require(permissionApi.hasAnyPermissions(actor(),permissions),"没有此操作权限");}
    public EduStudentDO ownStudent(Long id) {
        EduStudentDO s=found(students.selectById(id),"孩子档案不存在");
        require(Objects.equals(s.getGuardianMemberId(),actor()),"无权访问该孩子资料"); return s;
    }
    public boolean allData() { return Boolean.TRUE.equals(permissionApi.getDeptDataPermission(actor()).getAll()); }
    public boolean campusAllowed(Long id) {
        DeptDataPermissionRespDTO p=permissionApi.getDeptDataPermission(actor());
        if(Boolean.TRUE.equals(p.getAll())) return true;
        if(id==null) return false;
        EduCampusDO c=campuses.selectById(id); return c!=null&&p.getDeptIds().contains(c.getDeptId());
    }
    public boolean teacherIsActor(Long profileId) {
        if(profileId==null) return false; EduTeacherProfileDO p=teachers.selectById(profileId); return p!=null&&Objects.equals(p.getUserId(),actor());
    }
    public boolean cohortAllowed(EduCohortDO c) {
        if(c==null) return false;
        if(allData()||campusAllowed(c.getCampusId())||teacherIsActor(c.getTeacherId())) return true;
        return sessions.selectList(new LambdaQueryWrapper<EduSessionDO>().eq(EduSessionDO::getCohortId,c.getId()))
            .stream().anyMatch(s->teacherIsActor(s.getTeacherId()));
    }
    public EduCohortDO adminCohort(Long id) { EduCohortDO c=found(cohorts.selectById(id),"班期不存在");require(cohortAllowed(c),"无权访问此班期");return c; }
    public void adminCampus(Long id) { require(campusAllowed(id),"无权管理该校区"); }
    public EduEnrollmentDO entitled(Long studentId,Long cohortId,boolean write) {
        ownStudent(studentId);
        EduEnrollmentDO e=enrollments.selectOne(new LambdaQueryWrapper<EduEnrollmentDO>()
            .eq(EduEnrollmentDO::getStudentId,studentId).eq(EduEnrollmentDO::getCurrentCohortId,cohortId)
            .in(EduEnrollmentDO::getStatus,write?List.of("ACTIVE"):List.of("ACTIVE","COMPLETED")));
        return found(e,"该孩子尚无本班期的有效学习资格");
    }
    public void adminStudent(Long studentId) {
        if(allData()) return;
        boolean allowed=enrollments.selectList(EduEnrollmentDO::getStudentId,studentId).stream()
            .anyMatch(e->cohortAllowed(cohorts.selectById(e.getCurrentCohortId())));
        require(allowed,"无权访问该孩子资料");
    }
}

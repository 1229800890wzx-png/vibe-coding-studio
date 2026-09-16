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
public class EduEnrollmentService {
    @Resource private EduAccessService access;
    @Resource private EduCatalogService catalog;
    @Resource private EduProductService products;
    @Resource private EduStudentMapper students;
    @Resource private EduCohortMapper cohorts;
    @Resource private EduCourseMapper courses;
    @Resource private EduCourseVersionMapper courseVersions;
    @Resource private EduEnrollmentMapper enrollments;
    @Resource private EduTrialBookingMapper trials;
    @Resource private EduSessionMapper sessions;
    @Resource private EduLeaveRequestMapper leaves;
    @Resource private EduTransferRequestMapper transfers;
    @Resource private EduTransferEventMapper transferEvents;
    @Resource private EduAfterSaleExtMapper afterSales;
    @Resource private cn.iocoder.yudao.module.trade.dal.mysql.aftersale.AfterSaleMapper originalAfterSales;

    public Map<String,Object> studentView(EduStudentDO s,boolean admin) {Map<String,Object> v=map(s);v.put("nickname",s.getName());if(!admin)v.remove("guardianMemberId");return v;}
    public List<Map<String,Object>> ownStudents(){return students.selectList(EduStudentDO::getGuardianMemberId,access.actor()).stream().map(s->studentView(s,false)).toList();}
    @Transactional(rollbackFor=Exception.class)
    public Long saveStudent(Map<String,Object> b) {
        Long id=id(b,"id");EduStudentDO s=id==null?new EduStudentDO():access.ownStudent(id);
        if(id!=null) {s=found(students.selectOneForUpdate(EduStudentDO::getId,id),"孩子档案不存在");if(b.containsKey("version"))require(Objects.equals(s.getVersion(),integer(b,"version",0)),"档案已更新，请刷新后再保存");}
        String name=text(b,"name");if(name.isBlank())name=text(b,"nickname");require(!name.isBlank()&&name.length()<=40,"请填写不超过40字的孩子称呼");
        String birth=requiredText(b,"birthMonth",7);int age=age(birth,LocalDate.now());require(age>=0&&age<=25,"出生年月不在支持范围内");
        s.setName(name);s.setBirthMonth(birth);s.setGrade(text(b,"grade"));s.setExperience(text(b,"experience"));s.setGuardianMemberId(access.actor());
        s.setVersion(Objects.requireNonNullElse(s.getVersion(),0)+1);if(id==null)students.insert(s);else students.updateById(s);return s.getId();
    }
    @Transactional(rollbackFor=Exception.class)
    public void deleteStudent(Long id){access.ownStudent(id);students.selectOneForUpdate(EduStudentDO::getId,id);require(enrollments.selectCount(EduEnrollmentDO::getStudentId,id)==0&&trials.selectCount(EduTrialBookingDO::getStudentId,id)==0,"已有学习或预约记录的孩子档案不能直接删除");students.deleteById(id);}
    public void validateEntry(EduStudentDO student,EduCohortDO cohort) {
        require("OPEN".equals(cohort.getStatus()),"该班期当前不能报名");require(cohort.getStartDate()!=null&&cohort.getStartDate().isAfter(LocalDateTime.now()),"该班期已经开课");
        EduCourseDO course=found(courses.selectById(cohort.getCourseId()),"课程不存在");int age=age(student.getBirthMonth(),cohort.getStartDate().toLocalDate());
        EduCourseVersionDO pinned=found(courseVersions.selectById(cohort.getCourseVersionId()),"班期课程版本尚未发布");Map<String,Object> content=cn.iocoder.yudao.framework.common.util.json.JsonUtils.parseObject(pinned.getContentJson(),Map.class);
        require(age>=integer(content,"ageMin",course.getAgeMin())&&age<=integer(content,"ageMax",course.getAgeMax()),"孩子年龄不在本课程适合范围内");
        require(enrollments.selectList(new LambdaQueryWrapper<EduEnrollmentDO>().eq(EduEnrollmentDO::getStudentId,student.getId()).eq(EduEnrollmentDO::getCurrentCohortId,cohort.getId())
            .in(EduEnrollmentDO::getStatus,List.of("PENDING_PAYMENT","ACTIVE","COMPLETED")).last("FOR UPDATE")).isEmpty(),"该孩子已报名或有本班期待付款订单");
        catalog.checkStudentSchedule(student.getId(),catalog.sessionRowsForUpdate(cohort.getId()),null);
    }
    @Transactional(rollbackFor=Exception.class)
    public Map<String,Object> createTrial(Long studentId,Long cohortId) {
        access.ownStudent(studentId);EduStudentDO s=found(students.selectOneForUpdate(EduStudentDO::getId,studentId),"孩子档案不存在");
        EduCohortDO c=found(cohorts.selectOneForUpdate(EduCohortDO::getId,cohortId),"体验场次不存在");
        EduTrialBookingDO existing=trials.selectOne(new LambdaQueryWrapper<EduTrialBookingDO>().eq(EduTrialBookingDO::getStudentId,studentId).eq(EduTrialBookingDO::getCohortId,cohortId).eq(EduTrialBookingDO::getStatus,"CONFIRMED"));
        if(existing!=null)return trialView(existing);
        require("TRIAL".equals(c.getKind()),"请选择体验课场次");var sku=found(products.sku(c.getSkuId()),"体验场次尚未配置");
        require(sku.getPrice()==0,"收费体验课请通过订单付款报名");require(catalog.sessionRows(c.getId()).size()==1,"体验班期必须有且仅有一个课次");validateEntry(s,c);
        products.stock(c.getSkuId(),-1);
        EduTrialBookingDO t=new EduTrialBookingDO().setStudentId(studentId).setCohortId(cohortId).setStatus("CONFIRMED");trials.insert(t);
        EduEnrollmentDO e=new EduEnrollmentDO().setStudentId(studentId).setCurrentCohortId(cohortId).setTrialBookingId(t.getId()).setSource("FREE_TRIAL").setStatus("ACTIVE").setVersion(1);enrollments.insert(e);
        return trialView(t);
    }
    @Transactional(rollbackFor=Exception.class)
    public void cancelTrial(Long id,boolean admin) {
        EduTrialBookingDO t=found(trials.selectOneForUpdate(EduTrialBookingDO::getId,id),"预约不存在");
        if(admin){access.permission("trial","update");access.adminCohort(t.getCohortId());}else access.ownStudent(t.getStudentId());
        if("CANCELLED".equals(t.getStatus()))return;
        require(t.getOrderItemId()==null,"收费体验课请通过原订单申请退款");
        students.selectOneForUpdate(EduStudentDO::getId,t.getStudentId());
        EduEnrollmentDO e=found(enrollments.selectOneForUpdate(EduEnrollmentDO::getTrialBookingId,id),"预约报名记录不存在");
        EduCohortDO c=found(cohorts.selectOneForUpdate(EduCohortDO::getId,e.getCurrentCohortId()),"班期不存在");
        require(c.getStartDate()!=null&&c.getStartDate().isAfter(LocalDateTime.now()),"已开始的体验课请联系教务处理");
        if("ACTIVE".equals(e.getStatus())){products.stock(c.getSkuId(),1);e.setStatus("CANCELLED");e.setVersion(e.getVersion()+1);enrollments.updateById(e);}
        t.setStatus("CANCELLED");trials.updateById(t);
    }
    public Map<String,Object> enrollmentView(EduEnrollmentDO e) {
        Map<String,Object> v=map(e);v.put("cohortId",e.getCurrentCohortId());
        EduStudentDO s=students.selectById(e.getStudentId());v.put("studentName",s==null?"":s.getName());
        EduCohortDO c=cohorts.selectById(e.getCurrentCohortId());if(c!=null){v.put("cohortName",c.getName());v.put("courseId",c.getCourseId());EduCourseDO course=courses.selectById(c.getCourseId());v.put("courseName",course==null?"":course.getName());v.put("mode",c.getMode());}
        return v;
    }
    public Map<String,Object> trialView(EduTrialBookingDO t){Map<String,Object> v=map(t);EduStudentDO s=students.selectById(t.getStudentId());v.put("studentName",s==null?"":s.getName());EduCohortDO c=cohorts.selectById(t.getCohortId());if(c!=null){v.put("courseId",c.getCourseId());v.put("cohortName",c.getName());v.put("startTime",c.getStartDate());v.put("mode",c.getMode());}return v;}
    public List<Map<String,Object>> trialList(Long studentId){if(studentId!=null)access.ownStudent(studentId);Set<Long> ids=new HashSet<>();for(var s:students.selectList(EduStudentDO::getGuardianMemberId,access.actor()))ids.add(s.getId());if(studentId!=null)ids.retainAll(Set.of(studentId));if(ids.isEmpty())return List.of();return trials.selectList(new LambdaQueryWrapper<EduTrialBookingDO>().in(EduTrialBookingDO::getStudentId,ids).orderByDesc(EduTrialBookingDO::getId)).stream().map(this::trialView).toList();}
    @Transactional(rollbackFor=Exception.class)
    public Long leave(Map<String,Object> b) {
        Long studentId=id(b,"studentId");EduSessionDO s=found(sessions.selectById(id(b,"sessionId")),"课次不存在");EduEnrollmentDO e=access.entitled(studentId,s.getCohortId(),true);
        require(s.getStartTime().isAfter(LocalDateTime.now()),"已经开始的课次请联系教务");
        EduLeaveRequestDO r=new EduLeaveRequestDO().setStudentId(studentId).setEnrollmentId(e.getId()).setSessionId(s.getId()).setReason(requiredText(b,"reason",1000)).setStatus("PENDING");leaves.insert(r);return r.getId();
    }
    @Transactional(rollbackFor=Exception.class)
    public Long transfer(Map<String,Object> b) {
        EduEnrollmentDO initial=found(enrollments.selectById(id(b,"enrollmentId")),"报名记录不存在");access.ownStudent(initial.getStudentId());students.selectOneForUpdate(EduStudentDO::getId,initial.getStudentId());
        EduEnrollmentDO e=found(enrollments.selectOneForUpdate(EduEnrollmentDO::getId,initial.getId()),"报名记录不存在");
        require("ACTIVE".equals(e.getStatus()),"仅有效报名可申请转班");EduCohortDO from=found(cohorts.selectById(e.getCurrentCohortId()),"原班期不存在");EduCohortDO to=found(cohorts.selectById(id(b,"targetCohortId")),"目标班期不存在");
        checkTransfer(e,from,to);require(transfers.selectCount(new LambdaQueryWrapper<EduTransferRequestDO>().eq(EduTransferRequestDO::getEnrollmentId,e.getId()).eq(EduTransferRequestDO::getStatus,"PENDING"))==0,"已有待处理的转班申请");
        EduTransferRequestDO r=new EduTransferRequestDO().setStudentId(e.getStudentId()).setEnrollmentId(e.getId()).setFromCohortId(from.getId()).setTargetCohortId(to.getId()).setReason(requiredText(b,"reason",1000)).setStatus("PENDING");transfers.insert(r);return r.getId();
    }
    private void checkTransfer(EduEnrollmentDO e,EduCohortDO from,EduCohortDO to) {
        require(!Objects.equals(from.getId(),to.getId())&&"OPEN".equals(to.getStatus()),"请选择不同且开放的目标班期");
        require(Objects.equals(from.getCourseId(),to.getCourseId())&&Objects.equals(from.getKind(),to.getKind()),"只能转入相同课程和类型的班期");
        validateTransfer(String.valueOf(from.getCourseVersionId()),String.valueOf(to.getCourseVersionId()),products.sku(from.getSkuId()).getPrice(),products.sku(to.getSkuId()).getPrice(),from.getStartDate(),LocalDateTime.now());
        require(to.getStartDate()!=null&&to.getStartDate().isAfter(LocalDateTime.now()),"目标班期已开课");
        require(catalog.sessionRows(from.getId()).size()==catalog.sessionRows(to.getId()).size(),"目标课次结构不一致");
        require(catalog.sessionRows(from.getId()).stream().map(EduSessionDO::getLessonTemplateId).toList().equals(catalog.sessionRows(to.getId()).stream().map(EduSessionDO::getLessonTemplateId).toList()),"目标班期课次顺序或结构不一致");
        // Reuse the original explicit in-flight statuses, including payment processing.
        if(e.getOrderItemId()!=null) require(originalAfterSales.selectList(new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<cn.iocoder.yudao.module.trade.dal.dataobject.aftersale.AfterSaleDO>().eq("order_item_id",e.getOrderItemId()).last("FOR UPDATE")).stream().noneMatch(a->cn.iocoder.yudao.module.trade.enums.aftersale.AfterSaleStatusEnum.APPLYING_STATUSES.contains(a.getStatus())),"退款或售后处理中，暂不能转班");
        catalog.checkStudentSchedule(e.getStudentId(),catalog.sessionRows(to.getId()),from.getId());
    }
    @Transactional(rollbackFor=Exception.class)
    public void decideRequest(Long id,String type,boolean approve,String reason) {
        access.permission("request",approve?"approve":"reject");
        if("LEAVE".equals(type)) {EduLeaveRequestDO r=found(leaves.selectOneForUpdate(EduLeaveRequestDO::getId,id),"请假申请不存在");EduEnrollmentDO e=found(enrollments.selectById(r.getEnrollmentId()),"报名不存在");access.adminCohort(e.getCurrentCohortId());require("PENDING".equals(r.getStatus()),"申请已处理");r.setStatus(approve?"APPROVED":"REJECTED");r.setDecisionReason(reason);r.setDecidedBy(access.actor());leaves.updateById(r);return;}
        require("TRANSFER".equals(type),"申请类型无效");EduTransferRequestDO r=found(transfers.selectOneForUpdate(EduTransferRequestDO::getId,id),"转班申请不存在");
        require("PENDING".equals(r.getStatus()),"申请已处理");students.selectOneForUpdate(EduStudentDO::getId,r.getStudentId());EduEnrollmentDO e=found(enrollments.selectOneForUpdate(EduEnrollmentDO::getId,r.getEnrollmentId()),"报名不存在");
        access.adminCohort(e.getCurrentCohortId());access.adminCohort(r.getTargetCohortId());
        if(approve) {
            require("ACTIVE".equals(e.getStatus())&&Objects.equals(e.getCurrentCohortId(),r.getFromCohortId()),"报名状态已改变，请重新申请");
            List<Long> locked=new ArrayList<>(List.of(e.getCurrentCohortId(),r.getTargetCohortId()));locked.sort(Long::compareTo);for(Long c:locked)cohorts.selectOneForUpdate(EduCohortDO::getId,c);
            EduCohortDO from=cohorts.selectOneForUpdate(EduCohortDO::getId,e.getCurrentCohortId()),to=cohorts.selectOneForUpdate(EduCohortDO::getId,r.getTargetCohortId());checkTransfer(e,from,to);
            require(enrollments.selectCount(new LambdaQueryWrapper<EduEnrollmentDO>().eq(EduEnrollmentDO::getStudentId,e.getStudentId()).eq(EduEnrollmentDO::getCurrentCohortId,to.getId()).in(EduEnrollmentDO::getStatus,List.of("PENDING_PAYMENT","ACTIVE","COMPLETED")))==0,"孩子已报名目标班期");
            products.stock(to.getSkuId(),-1);products.stock(from.getSkuId(),1);e.setCurrentCohortId(to.getId());e.setVersion(e.getVersion()+1);enrollments.updateById(e);
            transferEvents.insert(new EduTransferEventDO().setEnrollmentId(e.getId()).setFromCohortId(from.getId()).setTargetCohortId(to.getId()).setRequestId(r.getId()).setActorId(access.actor()).setReason(r.getReason()));
        }
        r.setStatus(approve?"APPROVED":"REJECTED");r.setDecisionReason(reason);r.setDecidedBy(access.actor());transfers.updateById(r);
    }
    public List<Map<String,Object>> requests(Long studentId,boolean admin) {
        if(admin)access.permission("request","query");else access.ownStudent(studentId);
        List<Map<String,Object>> result=new ArrayList<>();
        for(EduLeaveRequestDO r:leaves.selectList(new LambdaQueryWrapper<EduLeaveRequestDO>().eq(!admin,EduLeaveRequestDO::getStudentId,studentId))){EduSessionDO s=sessions.selectById(r.getSessionId());if(admin&&(s==null||!access.cohortAllowed(cohorts.selectById(s.getCohortId()))))continue;Map<String,Object> v=map(r);v.put("type","LEAVE");v.put("studentName",students.selectById(r.getStudentId()).getName());result.add(v);}
        for(EduTransferRequestDO r:transfers.selectList(new LambdaQueryWrapper<EduTransferRequestDO>().eq(!admin,EduTransferRequestDO::getStudentId,studentId))){if(admin&&!access.cohortAllowed(cohorts.selectById(r.getFromCohortId())))continue;Map<String,Object> v=map(r);v.put("type","TRANSFER");v.put("studentName",students.selectById(r.getStudentId()).getName());v.put("currentCohortName",cohorts.selectById(r.getFromCohortId()).getName());v.put("targetCohortName",cohorts.selectById(r.getTargetCohortId()).getName());result.add(v);}
        return result;
    }
}

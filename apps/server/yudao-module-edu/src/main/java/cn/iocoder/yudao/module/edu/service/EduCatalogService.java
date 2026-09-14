package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.module.edu.dal.dataobject.*;
import cn.iocoder.yudao.module.edu.dal.mysql.*;
import cn.iocoder.yudao.module.product.api.sku.dto.ProductSkuRespDTO;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;
import static cn.iocoder.yudao.module.edu.service.EduRules.*;
import static cn.iocoder.yudao.module.edu.service.EduViews.*;

@Service
public class EduCatalogService {
    @Resource private EduAccessService access;
    @Resource private EduProductService products;
    @Resource private EduCourseMapper courses;
    @Resource private EduCourseVersionMapper versions;
    @Resource private EduLessonTemplateMapper lessons;
    @Resource private EduCohortMapper cohorts;
    @Resource private EduSessionMapper sessions;
    @Resource private EduCampusMapper campuses;
    @Resource private EduRoomMapper rooms;
    @Resource private EduTeacherProfileMapper teachers;
    @Resource private EduEnrollmentMapper enrollments;
    @Resource private EduStudentMapper students;
    @Resource private EduFileService files;
    @Resource private EduNotifyService notices;

    public Map<String,Object> course(Long id,boolean admin) {
        EduCourseDO c=found(courses.selectById(id),"课程不存在");
        if(!admin) require("PUBLISHED".equals(c.getStatus()),"课程尚未发布");
        return courseView(c,admin);
    }
    public Map<String,Object> courseView(EduCourseDO c,boolean admin) {
        Map<String,Object> v=map(c);
        if(!admin&&c.getVersion()!=null&&c.getVersion()>0) {
            EduCourseVersionDO published=versions.selectOne(EduCourseVersionDO::getCourseId,c.getId(),EduCourseVersionDO::getVersion,c.getVersion());
            if(published!=null) v.putAll(cn.iocoder.yudao.framework.common.util.json.JsonUtils.parseObject(published.getContentJson(),Map.class));
        }
        v.put("spuId",c.getSpuId());v.put("revision",c.getRevision());
        v.put("lessons",objects(String.valueOf(v.getOrDefault("lessonsJson","[]"))));v.remove("lessonsJson");
        List<EduCohortDO> open=cohorts.selectList(new LambdaQueryWrapper<EduCohortDO>().eq(EduCohortDO::getCourseId,c.getId()).eq(EduCohortDO::getStatus,"OPEN").gt(EduCohortDO::getStartDate,LocalDateTime.now()));
        List<Integer> prices=open.stream().map(x->products.sku(x.getSkuId())).filter(Objects::nonNull).map(ProductSkuRespDTO::getPrice).toList();
        v.put("price",prices.stream().min(Integer::compareTo).orElse(null));v.put("cohortCount",open.size());return v;
    }
    public Map<String,Object> coursePage(Map<String,Object> p,boolean admin) {
        if(admin) access.permission("course","query");
        String keyword=text(p,"keyword");if(keyword.isBlank())keyword=text(p,"name");
        var query=new LambdaQueryWrapper<EduCourseDO>().eq(!admin,EduCourseDO::getStatus,"PUBLISHED")
            .eq(admin&&!text(p,"status").isBlank(),EduCourseDO::getStatus,text(p,"status"))
            .orderByDesc(EduCourseDO::getId);
        int age=integer(p,"age",0);
        LocalDateTime from=text(p,"startFrom").isBlank()?null:time(p.get("startFrom"));
        LocalDateTime until=text(p,"startTo").isBlank()?null:time(p.get("startTo"));
        if(until!=null&&text(p,"startTo").length()==10)until=until.plusDays(1);
        require(from==null||until==null||from.isBefore(until),"开课日期范围无效");
        List<Map<String,Object>> result=new ArrayList<>();
        for(EduCourseDO c:courses.selectList(query)) {
            // Discovery must use the same published snapshot shown in detail, never an unpublished draft edit.
            Map<String,Object> view=courseView(c,admin);
            if(!keyword.isBlank()&&!(text(view,"name")+" "+text(view,"description")).toLowerCase(Locale.ROOT).contains(keyword.toLowerCase(Locale.ROOT)))continue;
            if(!text(p,"direction").isBlank()&&!Objects.equals(text(p,"direction"),text(view,"direction")))continue;
            if(!text(p,"level").isBlank()&&!Objects.equals(text(p,"level"),text(view,"level")))continue;
            if(age>0&&(age<integer(view,"ageMin",8)||age>integer(view,"ageMax",16)))continue;
            if(!text(p,"kind").isBlank()||!text(p,"mode").isBlank()||id(p,"campusId")!=null||from!=null||until!=null) {
                List<Map<String,Object>> matching=new ArrayList<>();
                for(Map<String,Object> cohort:cohortList(c.getId(),text(p,"kind"),text(p,"mode"),id(p,"campusId"))){
                    LocalDateTime start=time(cohort.get("startDate"));
                    if(from!=null&&start.isBefore(from)||until!=null&&!start.isBefore(until))continue;
                    matching.add(cohort);
                }
                if(matching.isEmpty())continue;
                view.put("cohortCount",matching.size());
                view.put("price",matching.stream().map(v->integer(v,"price",0)).min(Integer::compareTo).orElse(null));
            }
            result.add(view);
        }
        return page(result,integer(p,"pageNo",1),integer(p,"pageSize",20));
    }
    @Transactional(rollbackFor=Exception.class)
    public Long saveCourse(Map<String,Object> b) {
        Long id=id(b,"id");access.permission("course",id==null?"create":"update");
        EduCourseDO c=id==null?new EduCourseDO():found(courses.selectOneForUpdate(EduCourseDO::getId,id),"课程不存在");
        if(id!=null&&b.containsKey("revision"))require(Objects.equals(c.getRevision(),integer(b,"revision",0)),"课程已被更新，请刷新后合并修改");
        c.setName(requiredText(b,"name",120));c.setCode(requiredText(b,"code",64));
        c.setDescription(text(b,"description"));c.setCoverUrl(text(b,"coverUrl"));
        c.setAgeMin(integer(b,"ageMin",8));c.setAgeMax(integer(b,"ageMax",16));
        require(c.getAgeMin()>=8&&c.getAgeMax()<=16&&c.getAgeMax()>=c.getAgeMin(),"课程年龄范围应在 8—16 岁之间");
        c.setDirection(text(b,"direction"));c.setLevel(text(b,"level"));c.setObjectives(text(b,"objectives"));c.setOutcomes(text(b,"outcomes"));
        if(b.containsKey("lessons"))c.setLessonsJson(json(b.get("lessons")));
        c.setRevision(Objects.requireNonNullElse(c.getRevision(),0)+1);
        if(id==null) {c.setStatus("DRAFT");c.setVersion(0);c.setSpuId(id(b,"spuId"));courses.insert(c);} else courses.updateById(c);
        return c.getId();
    }
    @Transactional(rollbackFor=Exception.class)
    public void publishCourse(Map<String,Object> b) {
        access.permission("course","publish");EduCourseDO c=found(courses.selectOneForUpdate(EduCourseDO::getId,id(b,"id")),"课程不存在");
        if(b.containsKey("version"))require(Objects.equals(c.getVersion(),integer(b,"version",0)),"课程版本已变化，请刷新");
        List<Map<String,Object>> source=objects(c.getLessonsJson());
        require(!source.isEmpty()&&!c.getDescription().isBlank()&&!c.getCoverUrl().isBlank(),"发布前请完善封面、介绍和课程大纲");
        int number=Objects.requireNonNullElse(c.getVersion(),0)+1;
        c.setVersion(number);c.setStatus("PUBLISHED");
        EduCourseVersionDO version=new EduCourseVersionDO().setCourseId(c.getId()).setVersion(number).setName(c.getName()).setContentJson(json(map(c))).setPublishedAt(LocalDateTime.now());
        versions.insert(version);
        int order=0;for(Map<String,Object> lesson:source) {
            EduLessonTemplateDO l=new EduLessonTemplateDO().setCourseVersionId(version.getId()).setTitle(requiredText(lesson,"title",180))
                .setSort(++order).setDurationMinutes(integer(lesson,"durationMinutes",90)).setObjectives(text(lesson,"objectives"))
                .setMaterials(text(lesson,"materials")).setAssignment(text(lesson,"assignment"));
            require(l.getDurationMinutes()>0&&!l.getObjectives().isBlank(),"每节课必须有学习目标及有效时长");lessons.insert(l);
        }
        courses.updateById(c);
    }
    public Map<String,Object> cohortView(EduCohortDO c,boolean privateDetail) {
        Map<String,Object> v=map(c);ProductSkuRespDTO sku=products.sku(c.getSkuId());
        v.put("stock",sku==null?0:sku.getStock());v.put("price",sku==null?null:sku.getPrice());
        EduCourseDO course=courses.selectById(c.getCourseId());if(course!=null){
            Map<String,Object> courseInfo=map(course);
            if(!privateDetail&&c.getCourseVersionId()!=null){EduCourseVersionDO pinned=versions.selectById(c.getCourseVersionId());if(pinned!=null)courseInfo=cn.iocoder.yudao.framework.common.util.json.JsonUtils.parseObject(pinned.getContentJson(),Map.class);}
            v.put("courseName",courseInfo.get("name"));v.put("ageMin",courseInfo.get("ageMin"));v.put("ageMax",courseInfo.get("ageMax"));v.put("coverUrl",courseInfo.get("coverUrl"));
        }
        EduCampusDO campus=c.getCampusId()==null?null:campuses.selectById(c.getCampusId());v.put("campusName",campus==null?"全国线上":campus.getName());
        EduTeacherProfileDO teacher=c.getTeacherId()==null?null:teachers.selectById(c.getTeacherId());v.put("teacherName",teacher==null?"待安排":teacher.getName());
        if(c.getCourseVersionId()!=null)v.put("lessons",lessons.selectList(new LambdaQueryWrapper<EduLessonTemplateDO>().eq(EduLessonTemplateDO::getCourseVersionId,c.getCourseVersionId()).orderByAsc(EduLessonTemplateDO::getSort)).stream().map(EduViews::map).toList());
        v.put("sessions",sessions.selectList(new LambdaQueryWrapper<EduSessionDO>().eq(EduSessionDO::getCohortId,c.getId()).orderByAsc(EduSessionDO::getStartTime))
            .stream().map(s->sessionView(s,privateDetail)).toList());return v;
    }
    public Map<String,Object> sessionView(EduSessionDO s,boolean privateDetail) {
        Map<String,Object> v=map(s);EduCohortDO c=cohorts.selectById(s.getCohortId());
        if(c!=null){v.put("cohortName",c.getName());v.put("mode",c.getMode());EduCampusDO campus=c.getCampusId()==null?null:campuses.selectById(c.getCampusId());v.put("campusName",campus==null?"全国线上":campus.getName());}
        v.remove("materialsJson");if(!privateDetail)v.remove("joinInfo");
        else {v.put("materials",objects(s.getMaterialsJson()));String join=s.getJoinInfo();v.put("joinInfo",join==null||join.isBlank()?Map.of():join.trim().startsWith("{")?cn.iocoder.yudao.framework.common.util.json.JsonUtils.parseObject(join,Map.class):Map.of("instructions",join));}
        return v;
    }
    public List<Map<String,Object>> cohortList(Long courseId,String kind,String mode,Long campusId) {
        return cohorts.selectList(new LambdaQueryWrapper<EduCohortDO>().eq(EduCohortDO::getStatus,"OPEN")
            .gt(EduCohortDO::getStartDate,LocalDateTime.now())
            .eq(courseId!=null,EduCohortDO::getCourseId,courseId).eq(kind!=null&&!kind.isBlank(),EduCohortDO::getKind,kind)
            .eq(mode!=null&&!mode.isBlank(),EduCohortDO::getMode,mode).eq(campusId!=null,EduCohortDO::getCampusId,campusId)
            .orderByAsc(EduCohortDO::getStartDate)).stream().filter(c->{EduCourseDO course=courses.selectById(c.getCourseId());return course!=null&&"PUBLISHED".equals(course.getStatus());}).map(c->cohortView(c,false)).toList();
    }
    public Map<String,Object> cohort(Long id,boolean admin) {
        EduCohortDO c=admin?access.adminCohort(id):found(cohorts.selectById(id),"班期不存在");
        if(!admin)require("OPEN".equals(c.getStatus()),"该班期尚未开放报名");return cohortView(c,admin);
    }
    @Transactional(rollbackFor=Exception.class)
    public Long saveCohort(Map<String,Object> b) {
        Long id=id(b,"id");access.permission("cohort",id==null?"create":"update");
        EduCohortDO c=id==null?new EduCohortDO():access.adminCohort(id);
        if(id!=null)c=found(cohorts.selectOneForUpdate(EduCohortDO::getId,id),"班期不存在");
        if(id!=null&&b.containsKey("version"))require(Objects.equals(c.getVersion(),integer(b,"version",0)),"班期已被更新，请刷新后重试");
        Long courseId=id(b,"courseId");EduCourseDO course=found(courses.selectOneForUpdate(EduCourseDO::getId,courseId),"请先创建课程");
        int oldCapacity=Objects.requireNonNullElse(c.getCapacity(),0);
        if(id!=null)require(Objects.equals(c.getCourseId(),courseId),"已创建班期不能更换所属课程");
        c.setCourseId(courseId);c.setName(requiredText(b,"name",120));
        c.setKind(text(b,"kind").isBlank()?"REGULAR":text(b,"kind"));require(Set.of("REGULAR","TRIAL").contains(c.getKind()),"班期类型无效");
        c.setMode(text(b,"mode").isBlank()?"ONLINE":text(b,"mode"));require(Set.of("ONLINE","OFFLINE").contains(c.getMode()),"授课形式无效");
        c.setCampusId(id(b,"campusId"));c.setRoomId(id(b,"roomId"));c.setTeacherId(id(b,"teacherId"));
        if(!access.allData())access.adminCampus(c.getCampusId());
        c.setCapacity(integer(b,"capacity",12));require(c.getCapacity()>0&&c.getCapacity()<=1000,"班额必须为1—1000人");
        c.setStartDate(time(b.get("startDate")));c.setEndDate(time(b.get("endDate")));c.setTerms(text(b,"terms"));c.setRefundPolicy(text(b,"refundPolicy"));
        if(id==null){c.setStatus("DRAFT");c.setVersion(0);c.setSkuId(id(b,"skuId"));if("PUBLISHED".equals(course.getStatus())){EduCourseVersionDO published=versions.selectOne(EduCourseVersionDO::getCourseId,courseId,EduCourseVersionDO::getVersion,course.getVersion());if(published!=null)c.setCourseVersionId(published.getId());}cohorts.insert(c);}
        boolean sold=enrollments.selectCount(new LambdaQueryWrapper<EduEnrollmentDO>().eq(EduEnrollmentDO::getCurrentCohortId,c.getId()).in(EduEnrollmentDO::getStatus,List.of("PENDING_PAYMENT","ACTIVE","COMPLETED")))>0;
        Integer price=b.containsKey("price")?integer(b,"price",0):null;
        if(c.getSkuId()==null){require(price!=null,"请填写班期费用，单位为分");c.setSkuId(products.bindSku(course,c,price));}
        else if(id==null) {var linked=found(products.sku(c.getSkuId()),"关联规格不存在");require(Objects.equals(linked.getSpuId(),course.getSpuId()),"班期规格必须属于当前课程商品");require(linked.getStock()==c.getCapacity(),"首次绑定规格库存必须等于班额");}
        else if(id!=null) {
            var sku=products.sku(c.getSkuId());if(sold&&price!=null)require(Objects.equals(sku.getPrice(),price),"已有报名的班期不能修改原销售价格");
            products.updateDraftSku(c.getSkuId(),price,c.getCapacity()-oldCapacity);
        }
        c.setVersion(c.getVersion()+1);cohorts.updateById(c);return c.getId();
    }
    @Transactional(rollbackFor=Exception.class)
    public Long saveSession(Map<String,Object> b) {
        Long id=id(b,"id"),cohortId=id(b,"cohortId");access.permission("session",id==null?"create":"update");access.adminCohort(cohortId);
        EduCohortDO c=found(cohorts.selectOneForUpdate(EduCohortDO::getId,cohortId),"班期不存在");
        EduSessionDO s=id==null?new EduSessionDO():found(sessions.selectOneForUpdate(EduSessionDO::getId,id),"课次不存在");
        if(id!=null){require(Objects.equals(s.getCohortId(),cohortId),"不能移动已创建课次到其他班期");if(b.containsKey("version"))require(Objects.equals(s.getVersion(),integer(b,"version",0)),"课次已被更新，请刷新");}
        s.setCohortId(cohortId);s.setTitle(requiredText(b,"title",160));s.setStartTime(time(b.get("startTime")));s.setEndTime(time(b.get("endTime")));
        require(s.getStartTime()!=null&&s.getEndTime()!=null&&s.getEndTime().isAfter(s.getStartTime()),"请填写有效上课时间");
        s.setTeacherId(id(b,"teacherId")==null?c.getTeacherId():id(b,"teacherId"));s.setRoomId(id(b,"roomId"));s.setLessonTemplateId(id(b,"lessonTemplateId"));
        if(s.getLessonTemplateId()!=null){EduLessonTemplateDO template=found(lessons.selectById(s.getLessonTemplateId()),"课次模板不存在");require(Objects.equals(template.getCourseVersionId(),c.getCourseVersionId()),"课次模板不属于班期固定的课程版本");}
        s.setJoinInfo(b.get("joinInfo") instanceof Map<?,?>?json(b.get("joinInfo")):text(b,"joinInfo"));s.setMaterialsJson(json(files.validateMaterials(b.get("materials"),cohortId)));s.setStatus("SCHEDULED");
        lockAndCheckResources(s);checkClassOverlap(s);
        for(EduEnrollmentDO e:enrollments.selectList(new LambdaQueryWrapper<EduEnrollmentDO>().eq(EduEnrollmentDO::getCurrentCohortId,cohortId).in(EduEnrollmentDO::getStatus,List.of("PENDING_PAYMENT","ACTIVE")).last("FOR UPDATE")))
            checkStudentSchedule(e.getStudentId(),List.of(s),cohortId);
        s.setVersion(Objects.requireNonNullElse(s.getVersion(),0)+1);if(id==null)sessions.insert(s);else sessions.updateById(s);
        List<EduSessionDO> timeline=sessionRows(cohortId);c.setStartDate(timeline.get(0).getStartTime());c.setEndDate(timeline.get(timeline.size()-1).getEndTime());cohorts.updateById(c);
        if(id!=null)for(EduEnrollmentDO e:enrollments.selectList(EduEnrollmentDO::getCurrentCohortId,cohortId))if("ACTIVE".equals(e.getStatus()))notices.guardian(e.getStudentId(),"课表已调整",c.getName()+"："+s.getTitle()+"，请查看最新课次时间和地点。");
        return s.getId();
    }
    public List<EduSessionDO> sessionRows(Long cohortId) {return sessions.selectList(new LambdaQueryWrapper<EduSessionDO>().eq(EduSessionDO::getCohortId,cohortId).ne(EduSessionDO::getStatus,"CANCELLED").orderByAsc(EduSessionDO::getStartTime));}
    public List<EduSessionDO> sessionRowsForUpdate(Long cohortId) {return sessions.selectList(new LambdaQueryWrapper<EduSessionDO>().eq(EduSessionDO::getCohortId,cohortId).ne(EduSessionDO::getStatus,"CANCELLED").orderByAsc(EduSessionDO::getStartTime).last("FOR UPDATE"));}
    /** Read-only planning aid. The save transaction independently repeats all authoritative checks. */
    @Transactional(readOnly=true)
    public Map<String,Object> previewSession(Map<String,Object> b) {
        Long sessionId=id(b,"id"),cohortId=id(b,"cohortId");
        access.permission("session",sessionId==null?"create":"update");EduCohortDO cohort=access.adminCohort(cohortId);
        EduSessionDO before=sessionId==null?null:found(sessions.selectById(sessionId),"课次不存在");
        require(before==null||Objects.equals(before.getCohortId(),cohortId),"课次不属于当前班期");
        LocalDateTime start=time(b.get("startTime")),end=time(b.get("endTime"));
        require(start!=null&&end!=null&&start.isBefore(end),"请填写有效上课时间");
        Long teacherId=id(b,"teacherId")==null?cohort.getTeacherId():id(b,"teacherId"),roomId=id(b,"roomId");
        found(teachers.selectById(teacherId),"请选择有效教师");
        if(roomId!=null){EduRoomDO room=found(rooms.selectById(roomId),"教室不存在");require(Objects.equals(room.getCampusId(),cohort.getCampusId()),"教室不属于当前校区");require(room.getCapacity()>=cohort.getCapacity(),"教室容量小于班期人数");}
        List<EduSessionDO> overlapping=sessions.selectList(new LambdaQueryWrapper<EduSessionDO>()
            .ne(sessionId!=null,EduSessionDO::getId,sessionId).ne(EduSessionDO::getStatus,"CANCELLED")
            .lt(EduSessionDO::getStartTime,end).gt(EduSessionDO::getEndTime,start));
        List<Map<String,Object>> conflicts=new ArrayList<>(),affected=new ArrayList<>();Set<String> kinds=new HashSet<>();
        for(EduSessionDO other:overlapping){
            if(Objects.equals(other.getTeacherId(),teacherId))kinds.add("TEACHER");
            if(roomId!=null&&Objects.equals(other.getRoomId(),roomId))kinds.add("ROOM");
            if(Objects.equals(other.getCohortId(),cohortId))kinds.add("COHORT");
        }
        Map<String,String> labels=Map.of("TEACHER","授课教师在此时段已有课程","ROOM","所选教室在此时段已被占用","COHORT","本班期在此时段已有其他课次");
        for(String kind:kinds)conflicts.add(Map.of("type",kind,"message",labels.get(kind)));
        for(EduEnrollmentDO enrollment:enrollments.selectList(new LambdaQueryWrapper<EduEnrollmentDO>().eq(EduEnrollmentDO::getCurrentCohortId,cohortId).in(EduEnrollmentDO::getStatus,List.of("ACTIVE","PENDING_PAYMENT")))){
            EduStudentDO student=students.selectById(enrollment.getStudentId());if(student==null)continue;
            affected.add(Map.of("studentId",student.getId(),"name",student.getName(),"status",enrollment.getStatus(),"willNotify",before!=null&&"ACTIVE".equals(enrollment.getStatus())));
            Set<Long> otherCohorts=new HashSet<>();
            for(EduEnrollmentDO other:enrollments.selectList(new LambdaQueryWrapper<EduEnrollmentDO>().eq(EduEnrollmentDO::getStudentId,student.getId()).ne(EduEnrollmentDO::getCurrentCohortId,cohortId).in(EduEnrollmentDO::getStatus,List.of("ACTIVE","PENDING_PAYMENT"))))otherCohorts.add(other.getCurrentCohortId());
            if(overlapping.stream().anyMatch(s->otherCohorts.contains(s.getCohortId())))conflicts.add(Map.of("type","STUDENT","studentId",student.getId(),"message",student.getName()+"在此时段已有报名课程"));
        }
        Map<String,Object> result=new LinkedHashMap<>();result.put("conflicts",conflicts);result.put("affectedStudents",affected);result.put("affectedCount",affected.size());result.put("canSave",conflicts.isEmpty());result.put("checkedAt",LocalDateTime.now());
        result.put("before",before==null?null:sessionView(before,false));
        result.put("proposed",Map.of("startTime",start,"endTime",end,"teacherId",teacherId,"roomId",roomId==null?0L:roomId));return result;
    }
    private void checkClassOverlap(EduSessionDO s) {
        var conflicts=sessions.selectList(new LambdaQueryWrapper<EduSessionDO>().eq(EduSessionDO::getCohortId,s.getCohortId()).ne(s.getId()!=null,EduSessionDO::getId,s.getId())
            .ne(EduSessionDO::getStatus,"CANCELLED").lt(EduSessionDO::getStartTime,s.getEndTime()).gt(EduSessionDO::getEndTime,s.getStartTime()).last("FOR UPDATE"));
        require(conflicts.isEmpty(),"该班期已有重叠课次");
    }
    private void lockAndCheckResources(EduSessionDO s) {
        EduTeacherProfileDO teacher=found(teachers.selectOneForUpdate(EduTeacherProfileDO::getId,s.getTeacherId()),"请选择有效教师");
        require(!"ARCHIVED".equals(teacher.getStatus()),"该教师当前不可排课");
        if(s.getRoomId()!=null){EduRoomDO room=found(rooms.selectOneForUpdate(EduRoomDO::getId,s.getRoomId()),"教室不存在");EduCohortDO cohort=found(cohorts.selectById(s.getCohortId()),"班期不存在");require(Objects.equals(room.getCampusId(),cohort.getCampusId()),"教室不属于班期校区");require(room.getCapacity()>=cohort.getCapacity(),"教室容量小于班期人数");}
        var query=new LambdaQueryWrapper<EduSessionDO>().ne(s.getId()!=null,EduSessionDO::getId,s.getId()).ne(EduSessionDO::getStatus,"CANCELLED")
            .lt(EduSessionDO::getStartTime,s.getEndTime()).gt(EduSessionDO::getEndTime,s.getStartTime());
        query.and(q->{q.eq(EduSessionDO::getTeacherId,s.getTeacherId());if(s.getRoomId()!=null)q.or().eq(EduSessionDO::getRoomId,s.getRoomId());});
        require(sessions.selectList(query.last("FOR UPDATE")).isEmpty(),"教师或教室在这个时段已有课程，请调整时间或资源");
    }
    public void checkStudentSchedule(Long studentId,List<EduSessionDO> proposed,Long excludedCohort) {
        found(students.selectOneForUpdate(EduStudentDO::getId,studentId),"孩子档案不存在");
        for(EduEnrollmentDO enrollment:enrollments.selectList(new LambdaQueryWrapper<EduEnrollmentDO>().eq(EduEnrollmentDO::getStudentId,studentId)
            .ne(excludedCohort!=null,EduEnrollmentDO::getCurrentCohortId,excludedCohort).in(EduEnrollmentDO::getStatus,List.of("PENDING_PAYMENT","ACTIVE")).last("FOR UPDATE"))) {
            for(EduSessionDO existing:sessions.selectList(new LambdaQueryWrapper<EduSessionDO>().eq(EduSessionDO::getCohortId,enrollment.getCurrentCohortId()).ne(EduSessionDO::getStatus,"CANCELLED").last("FOR UPDATE")))for(EduSessionDO next:proposed)
                require(!overlaps(existing.getStartTime(),existing.getEndTime(),next.getStartTime(),next.getEndTime()),"孩子的上课时间与已报名课程冲突");
        }
    }
    @Transactional(rollbackFor=Exception.class)
    public void publishCohort(Long id) {
        access.permission("cohort","publish");access.adminCohort(id);EduCohortDO c=found(cohorts.selectOneForUpdate(EduCohortDO::getId,id),"班期不存在");
        EduCourseDO course=found(courses.selectById(c.getCourseId()),"课程不存在");require("PUBLISHED".equals(course.getStatus()),"请先发布课程内容");
        EduCourseVersionDO version=found(versions.selectOne(EduCourseVersionDO::getCourseId,course.getId(),EduCourseVersionDO::getVersion,course.getVersion()),"课程发布版本缺失");
        if(c.getCourseVersionId()!=null)version=found(versions.selectById(c.getCourseVersionId()),"固定的课程版本不存在");
        List<EduSessionDO> timeline=sessionRows(id);int expected="TRIAL".equals(c.getKind())?1:lessons.selectList(EduLessonTemplateDO::getCourseVersionId,version.getId()).size();
        require(timeline.size()==expected&&expected>0,"课表数量必须与课程大纲一致；体验班必须有一节课");
        List<EduLessonTemplateDO> templates=lessons.selectList(new LambdaQueryWrapper<EduLessonTemplateDO>().eq(EduLessonTemplateDO::getCourseVersionId,version.getId()).orderByAsc(EduLessonTemplateDO::getSort));Set<Long> validTemplates=new HashSet<>();templates.forEach(t->validTemplates.add(t.getId()));Set<Long> usedTemplates=new HashSet<>();
        for(int i=0;i<timeline.size();i++){EduSessionDO session=timeline.get(i);if(session.getLessonTemplateId()==null){session.setLessonTemplateId(templates.get(i).getId());sessions.updateById(session);}require(validTemplates.contains(session.getLessonTemplateId())&&usedTemplates.add(session.getLessonTemplateId()),"课表包含重复或不属于当前课程版本的课次模板");}
        require(timeline.get(0).getStartTime().isAfter(LocalDateTime.now()),"开课时间必须在未来");
        require(c.getTerms()!=null&&!c.getTerms().isBlank()&&c.getRefundPolicy()!=null&&!c.getRefundPolicy().isBlank(),"请完善服务与退改规则");
        var sku=found(products.sku(c.getSkuId()),"关联商品规格不存在");require(sku.getPrice()>=0&&("TRIAL".equals(c.getKind())||sku.getPrice()>0),"正式课程必须设置实际价格");
        if("OFFLINE".equals(c.getMode())) {EduCampusDO campus=found(campuses.selectById(c.getCampusId()),"请选择校区");require(campus.getAddress()!=null&&!campus.getAddress().isBlank(),"请完善校区地址");}
        for(EduSessionDO s:timeline){lockAndCheckResources(s);EduTeacherProfileDO t=teachers.selectById(s.getTeacherId());require("PUBLISHED".equals(t.getStatus())&&t.getBio()!=null&&!t.getBio().isBlank(),"请完善并发布实际授课教师资料");if("OFFLINE".equals(c.getMode()))require(s.getRoomId()!=null,"线下课次必须配置教室");else require(s.getJoinInfo()!=null&&!s.getJoinInfo().isBlank()&&!"{}".equals(s.getJoinInfo()),"请配置线上课堂信息（仅报名后可见）");}
        c.setCourseVersionId(version.getId());c.setStatus("OPEN");c.setStartDate(timeline.get(0).getStartTime());c.setEndDate(timeline.get(timeline.size()-1).getEndTime());
        cohorts.updateById(c);products.publishProduct(course.getSpuId());
    }
}

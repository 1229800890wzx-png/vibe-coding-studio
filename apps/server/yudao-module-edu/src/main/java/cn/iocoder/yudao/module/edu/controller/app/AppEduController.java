package cn.iocoder.yudao.module.edu.controller.app;

import cn.iocoder.yudao.framework.common.pojo.CommonResult;
import cn.iocoder.yudao.module.edu.service.*;
import cn.iocoder.yudao.module.infra.api.config.ConfigApi;
import jakarta.annotation.Resource;
import jakarta.annotation.security.PermitAll;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import static cn.iocoder.yudao.framework.common.pojo.CommonResult.success;
import static cn.iocoder.yudao.module.edu.service.EduRules.*;

@RestController
@RequestMapping("/edu")
public class AppEduController {
    @Resource private EduCatalogService catalog;
    @Resource private EduEnrollmentService enrollment;
    @Resource private EduLearningService learning;
    @Resource private EduWorkService works;
    @Resource private EduAdminService admin;
    @Resource private EduBrandService brand;
    @Resource private EduTeacherService teacherDirectory;

    @GetMapping("/config/get") @PermitAll
    public CommonResult<?> config(){return success(brand.publicView());}
    @GetMapping("/course/page") @PermitAll public CommonResult<?> courses(@RequestParam Map<String,Object> p){return success(catalog.coursePage(p,false));}
    @GetMapping("/course/get") @PermitAll public CommonResult<?> course(@RequestParam Long id){return success(catalog.course(id,false));}
    @GetMapping("/cohort/list") @PermitAll public CommonResult<?> cohorts(@RequestParam(required=false)Long courseId,@RequestParam(required=false)String kind,@RequestParam(required=false)String mode,@RequestParam(required=false)Long campusId){return success(catalog.cohortList(courseId,kind,mode,campusId));}
    @GetMapping("/cohort/get") @PermitAll public CommonResult<?> cohort(@RequestParam Long id){return success(catalog.cohort(id,false));}
    @GetMapping("/campus/list") @PermitAll public CommonResult<?> campuses(){return success(admin.publicCampuses());}
    @GetMapping("/teacher/list") @PermitAll public CommonResult<?> teachers(@RequestParam(defaultValue="false") boolean oneToOne){return success(teacherDirectory.publicList(oneToOne));}
    @GetMapping("/student/list") public CommonResult<?> students(){return success(enrollment.ownStudents());}
    @PostMapping("/student/create") public CommonResult<?> createStudent(@RequestBody Map<String,Object>b){require(id(b,"id")==null,"新增孩子不能指定已有编号");return success(enrollment.saveStudent(b));}
    @RequestMapping(value="/student/update",method={RequestMethod.PUT,RequestMethod.POST}) public CommonResult<?> updateStudent(@RequestBody Map<String,Object>b){found(id(b,"id"),"请选择孩子");return success(enrollment.saveStudent(b));}
    @DeleteMapping("/student/delete") public CommonResult<?> deleteStudent(@RequestParam Long id){enrollment.deleteStudent(id);return success(true);}
    @GetMapping("/trial/list") public CommonResult<?> trials(@RequestParam(required=false)Long studentId){return success(enrollment.trialList(studentId));}
    @PostMapping("/trial/create") public CommonResult<?> trial(@RequestBody Map<String,Object>b){return success(enrollment.createTrial(id(b,"studentId"),id(b,"cohortId")));}
    @PostMapping("/trial/cancel") public CommonResult<?> cancelTrial(@RequestBody Map<String,Object>b){enrollment.cancelTrial(id(b,"id"),false);return success(true);}
    @GetMapping("/learning/dashboard") public CommonResult<?> dashboard(@RequestParam Long studentId){return success(learning.dashboard(studentId));}
    @GetMapping("/session/list") public CommonResult<?> sessions(@RequestParam Long studentId,@RequestParam(required=false)Long cohortId){return success(learning.sessionList(studentId,cohortId));}
    @GetMapping("/session/get") public CommonResult<?> session(@RequestParam Long id,@RequestParam Long studentId){return success(learning.session(id,studentId));}
    @GetMapping("/material/list") public CommonResult<?> materials(@RequestParam Long studentId,@RequestParam(required=false)Long sessionId){return success(learning.materials(studentId,sessionId));}
    @GetMapping("/assignment/list") public CommonResult<?> assignments(@RequestParam Long studentId,@RequestParam(required=false)Long cohortId){return success(learning.assignmentList(studentId,cohortId));}
    @GetMapping("/assignment/get") public CommonResult<?> assignment(@RequestParam Long id,@RequestParam Long studentId){return success(learning.assignment(id,studentId));}
    @PostMapping("/submission/save") public CommonResult<?> save(@RequestBody Map<String,Object>b){return success(learning.saveSubmission(b,false));}
    @PostMapping("/submission/submit") public CommonResult<?> submit(@RequestBody Map<String,Object>b){return success(learning.saveSubmission(b,true));}
    @GetMapping("/review/list") public CommonResult<?> reviews(@RequestParam Long studentId,@RequestParam(required=false)Long assignmentId){return success(learning.reviewList(studentId,assignmentId));}
    @GetMapping("/report/list") public CommonResult<?> reports(@RequestParam Long studentId){return success(learning.reportList(studentId));}
    @GetMapping("/report/get") public CommonResult<?> report(@RequestParam Long id,@RequestParam(required=false)Long studentId){return success(learning.report(id,studentId));}
    @PostMapping("/leave/create") public CommonResult<?> leave(@RequestBody Map<String,Object>b){return success(enrollment.leave(b));}
    @PostMapping("/transfer/create") public CommonResult<?> transfer(@RequestBody Map<String,Object>b){return success(enrollment.transfer(b));}
    @GetMapping("/request/list") public CommonResult<?> requests(@RequestParam Long studentId){return success(enrollment.requests(studentId,false));}
    @GetMapping("/work/list") public CommonResult<?> workList(@RequestParam Long studentId){return success(works.ownList(studentId));}
    @GetMapping("/work/preview") public CommonResult<?> previewWork(@RequestParam Long id,@RequestParam Integer version,jakarta.servlet.http.HttpServletResponse response){response.setHeader("Cache-Control","private, no-store");return success(works.preview(id,version));}
    @PostMapping("/work/create") public CommonResult<?> createWork(@RequestBody Map<String,Object>b){return success(works.create(b));}
    @PostMapping("/work/consent") public CommonResult<?> consent(@RequestBody Map<String,Object>b){works.consent(id(b,"id"),integer(b,"version",0),true);return success(true);}
    @PostMapping("/work/revoke") public CommonResult<?> revoke(@RequestBody Map<String,Object>b){works.consent(id(b,"id"),null,false);return success(true);}
    @GetMapping("/work/public-page") @PermitAll public CommonResult<?> publicWorks(@RequestParam Map<String,Object>b,jakarta.servlet.http.HttpServletResponse response){response.setHeader("Cache-Control","private, no-store");return success(works.publicPage(b));}
    @GetMapping("/work/public-get") @PermitAll public CommonResult<?> publicWork(@RequestParam Long id,@RequestParam(required=false)Integer version,jakarta.servlet.http.HttpServletResponse response){response.setHeader("Cache-Control","private, no-store");return success(works.publicWork(id,version));}
}

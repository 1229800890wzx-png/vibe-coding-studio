package cn.iocoder.yudao.module.edu.controller.admin;

import cn.iocoder.yudao.framework.common.pojo.CommonResult;
import cn.iocoder.yudao.module.edu.service.*;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import static cn.iocoder.yudao.framework.common.pojo.CommonResult.success;
import static cn.iocoder.yudao.module.edu.service.EduRules.*;

@RestController
@RequestMapping("/edu")
public class AdminEduController {
    @Resource private EduAdminService admin;
    @Resource private EduCatalogService catalog;
    @Resource private EduEnrollmentService enrollment;
    @Resource private EduLearningService learning;
    @Resource private EduWorkService works;
    @GetMapping("/dashboard/get") public CommonResult<?> dashboard(){return success(admin.dashboard());}
    @GetMapping("/{resource}/page") public CommonResult<?> page(@PathVariable String resource,@RequestParam Map<String,Object> p){return success(admin.pageResource(resource,p));}
    @GetMapping("/{resource}/get") public CommonResult<?> get(@PathVariable String resource,@RequestParam Long id){return success(admin.get(resource,id));}
    @PostMapping("/{resource}/create") public CommonResult<?> create(@PathVariable String resource,@RequestBody Map<String,Object>b){require(id(b,"id")==null,"新增数据不能指定已有编号");return success(admin.save(resource,b));}
    @RequestMapping(value="/{resource}/update",method={RequestMethod.PUT,RequestMethod.POST}) public CommonResult<?> update(@PathVariable String resource,@RequestBody Map<String,Object>b){found(id(b,"id"),"请指定待更新记录");if("trial".equals(resource)){require("CANCELLED".equals(text(b,"status")),"体验预约只能取消");enrollment.cancelTrial(id(b,"id"),true);return success(true);}return success(admin.save(resource,b));}
    @PostMapping("/course/publish") public CommonResult<?> publishCourse(@RequestBody Map<String,Object>b){catalog.publishCourse(b);return success(true);}
    @PostMapping("/cohort/publish") public CommonResult<?> publishCohort(@RequestBody Map<String,Object>b){catalog.publishCohort(id(b,"id"));return success(true);}
    @PostMapping("/session/preview") public CommonResult<?> previewSession(@RequestBody Map<String,Object>b){return success(catalog.previewSession(b));}
    @PostMapping("/submission/review") public CommonResult<?> review(@RequestBody Map<String,Object>b){return success(learning.review(b));}
    @PostMapping("/growth-report/publish") public CommonResult<?> publishReport(@RequestBody Map<String,Object>b){admin.publishReport(id(b,"id"));return success(true);}
    @PostMapping("/request/approve") public CommonResult<?> approve(@RequestBody Map<String,Object>b){enrollment.decideRequest(id(b,"id"),text(b,"type"),true,text(b,"reason"));return success(true);}
    @PostMapping("/request/reject") public CommonResult<?> reject(@RequestBody Map<String,Object>b){enrollment.decideRequest(id(b,"id"),text(b,"type"),false,text(b,"reason"));return success(true);}
    @PostMapping("/work/moderate") public CommonResult<?> moderate(@RequestBody Map<String,Object>b){works.moderate(b,false);return success(true);}
    @PostMapping("/work/publish") public CommonResult<?> publishWork(@RequestBody Map<String,Object>b){works.moderate(b,true);return success(true);}
    @PostMapping("/attendance/save") public CommonResult<?> attendance(@RequestBody Map<String,Object>b){learning.attendance(b);return success(true);}
}

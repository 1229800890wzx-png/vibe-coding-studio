package cn.iocoder.yudao.module.infra.controller.admin.education;
import cn.iocoder.yudao.module.infra.service.education.EducationService;
import cn.iocoder.yudao.framework.common.pojo.CommonResult;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import static cn.iocoder.yudao.framework.common.pojo.CommonResult.success;
@RestController @RequestMapping("/education")
@PreAuthorize("@ss.hasPermission('education:manage')")
public class AdminEducationController {
 private final EducationService service;
 public AdminEducationController(EducationService service){this.service=service;}
 @GetMapping("/courses") public CommonResult<List<Map<String,Object>>> courses(){return success(service.courses(true));}
 @PutMapping("/courses") public CommonResult<Boolean> save(@Valid @RequestBody EducationService.Course body){service.save(body);return success(true);}
 @GetMapping("/inquiries") public CommonResult<List<Map<String,Object>>> inquiries(){return success(service.inquiries());}
 @PutMapping("/inquiries/{id}") public CommonResult<Boolean> follow(@PathVariable String id,@Valid @RequestBody EducationService.FollowUp body){service.follow(id,body);return success(true);}
}

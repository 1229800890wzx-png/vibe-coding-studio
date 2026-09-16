package cn.iocoder.yudao.module.edu.controller.admin;

import cn.iocoder.yudao.framework.common.pojo.CommonResult;
import cn.iocoder.yudao.module.edu.service.EduAdmissionService;
import jakarta.annotation.Resource;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import static cn.iocoder.yudao.framework.common.pojo.CommonResult.success;

@RestController @RequestMapping("/edu/admission")
public class EduAdmissionController {
    @Resource private EduAdmissionService admissions;
    @GetMapping("/get") @PreAuthorize("@ss.hasPermission('crm:clue:query')")
    public CommonResult<Map<String,Object>> get(@RequestParam Long id) { return success(admissions.staffDetail(id)); }
}

package cn.iocoder.yudao.module.edu.controller.app;

import cn.iocoder.yudao.framework.apilog.core.annotation.ApiAccessLog;
import cn.iocoder.yudao.framework.common.pojo.CommonResult;
import cn.iocoder.yudao.module.edu.controller.app.vo.EduWebsiteAdmissionCreateReqVO;
import cn.iocoder.yudao.module.edu.service.EduWebsiteAdmissionService;
import jakarta.annotation.Resource;
import jakarta.annotation.security.PermitAll;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import static cn.iocoder.yudao.framework.common.pojo.CommonResult.success;

@RestController
@RequestMapping("/edu/website-admission")
public class AppEduWebsiteAdmissionController {
    @Resource private EduWebsiteAdmissionService service;
    @ApiAccessLog(requestEnable = false, responseEnable = false)
    @GetMapping("/options") @PermitAll
    public CommonResult<Map<String,Object>> options(HttpServletRequest request) { return success(service.options(request)); }
    @ApiAccessLog(requestEnable = false, responseEnable = false)
    @PostMapping("/create") @PermitAll
    public CommonResult<Map<String,Object>> create(@RequestBody EduWebsiteAdmissionCreateReqVO body, HttpServletRequest request) {
        return success(service.create(body, request));
    }
}

package cn.iocoder.yudao.module.edu.controller.admin;

import cn.iocoder.yudao.framework.apilog.core.annotation.ApiAccessLog;
import cn.iocoder.yudao.framework.common.pojo.*;
import cn.iocoder.yudao.module.edu.service.EduWebsiteAdmissionService;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import static cn.iocoder.yudao.framework.common.pojo.CommonResult.success;

@RestController
@RequestMapping("/edu/website-admission")
public class EduWebsiteAdmissionController {
    @Resource private EduWebsiteAdmissionService service;
    @ApiAccessLog(requestEnable = false, responseEnable = false)
    @GetMapping("/page") @PreAuthorize("@ss.hasPermission('crm:clue:query')")
    public CommonResult<PageResult<Map<String,Object>>> page(@Valid PageParam page) { return success(service.page(page)); }
    @ApiAccessLog(requestEnable = false, responseEnable = false)
    @GetMapping("/get") @PreAuthorize("@ss.hasPermission('crm:clue:query')")
    public CommonResult<Map<String,Object>> get(@RequestParam Long id) { return success(service.get(id)); }
    @ApiAccessLog(requestEnable = false, responseEnable = false)
    @PutMapping("/update") @PreAuthorize("@ss.hasPermission('crm:clue:update')")
    public CommonResult<Boolean> update(@Valid @RequestBody Update body) {
        service.update(body.id(), body.status(), body.note()); return success(true);
    }
    public record Update(@NotNull @Positive Long id, @NotNull @Pattern(regexp="NEW|CONTACTED|CLOSED") String status,
                         @NotNull @Size(max=2000) String note) {}
}

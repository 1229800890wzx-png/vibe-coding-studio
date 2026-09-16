package cn.iocoder.yudao.module.edu.controller.app;

import cn.iocoder.yudao.framework.common.pojo.CommonResult;
import cn.iocoder.yudao.module.edu.controller.vo.EduWebsiteOfferingRespVO;
import cn.iocoder.yudao.module.edu.service.EduWebsiteOfferingService;
import jakarta.annotation.Resource;
import jakarta.annotation.security.PermitAll;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static cn.iocoder.yudao.framework.common.pojo.CommonResult.success;

@RestController
@RequestMapping("/edu/website-offering")
public class AppEduWebsiteOfferingController {
    @Resource private EduWebsiteOfferingService service;

    @GetMapping("/list")
    @PermitAll
    public CommonResult<List<EduWebsiteOfferingRespVO>> list() {
        return success(service.publicList());
    }
}

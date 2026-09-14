package cn.iocoder.yudao.module.edu.controller.admin;

import cn.iocoder.yudao.framework.common.pojo.CommonResult;
import cn.iocoder.yudao.module.edu.controller.vo.*;
import cn.iocoder.yudao.module.edu.service.EduWebsiteOfferingService;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static cn.iocoder.yudao.framework.common.pojo.CommonResult.success;

@RestController
@RequestMapping("/edu/website-offering")
public class AdminEduWebsiteOfferingController {
    @Resource private EduWebsiteOfferingService service;

    @GetMapping("/list")
    public CommonResult<List<EduWebsiteOfferingRespVO>> list() {
        return success(service.adminList());
    }

    @PostMapping("/create")
    public CommonResult<EduWebsiteOfferingRespVO> create(@Valid @RequestBody EduWebsiteOfferingCreateReqVO request) {
        return success(service.create(request));
    }

    @PutMapping("/update")
    public CommonResult<EduWebsiteOfferingRespVO> update(@Valid @RequestBody EduWebsiteOfferingUpdateReqVO request) {
        return success(service.update(request));
    }

    @PostMapping("/publish")
    public CommonResult<EduWebsiteOfferingRespVO> publish(@Valid @RequestBody EduWebsiteOfferingPublishReqVO request) {
        return success(service.publish(request));
    }
}

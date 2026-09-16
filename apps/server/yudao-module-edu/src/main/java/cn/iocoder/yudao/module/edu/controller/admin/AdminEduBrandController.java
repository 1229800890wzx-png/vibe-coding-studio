package cn.iocoder.yudao.module.edu.controller.admin;

import cn.iocoder.yudao.framework.common.pojo.CommonResult;
import cn.iocoder.yudao.module.edu.service.EduBrandService;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import static cn.iocoder.yudao.framework.common.pojo.CommonResult.success;

@RestController
@RequestMapping("/edu/settings")
public class AdminEduBrandController {
    @Resource private EduBrandService brand;
    @GetMapping("/get") public CommonResult<?> get(){return success(brand.adminView());}
    @PostMapping("/save") public CommonResult<?> save(@RequestBody Map<String,Object> body){return success(brand.save(body));}
}

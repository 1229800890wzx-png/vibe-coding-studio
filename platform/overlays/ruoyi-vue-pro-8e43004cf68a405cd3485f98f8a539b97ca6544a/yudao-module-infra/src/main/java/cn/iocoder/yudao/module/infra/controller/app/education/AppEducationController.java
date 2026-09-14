package cn.iocoder.yudao.module.infra.controller.app.education;
import cn.iocoder.yudao.module.infra.service.education.EducationService;
import cn.iocoder.yudao.framework.common.pojo.CommonResult;
import cn.iocoder.yudao.framework.ratelimiter.core.annotation.RateLimiter;
import cn.iocoder.yudao.framework.ratelimiter.core.keyresolver.impl.ClientIpRateLimiterKeyResolver;
import jakarta.annotation.security.PermitAll;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import static cn.iocoder.yudao.framework.common.pojo.CommonResult.success;
@RestController @RequestMapping("/education")
public class AppEducationController {
 private final EducationService service;
 public AppEducationController(EducationService service){this.service=service;}
 @GetMapping("/courses") @PermitAll
 public CommonResult<List<Map<String,Object>>> courses(){return success(service.courses(false));}
 @PostMapping("/inquiries") @PermitAll
 @RateLimiter(time=60,count=5,keyResolver=ClientIpRateLimiterKeyResolver.class)
 public CommonResult<Map<String,String>> submit(@Valid @RequestBody EducationService.Inquiry body){return success(service.submit(body));}
}

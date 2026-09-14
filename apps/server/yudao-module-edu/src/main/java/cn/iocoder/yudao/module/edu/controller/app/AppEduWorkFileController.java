package cn.iocoder.yudao.module.edu.controller.app;

import cn.iocoder.yudao.framework.common.exception.ServiceException;
import cn.iocoder.yudao.framework.common.pojo.CommonResult;
import cn.iocoder.yudao.module.edu.service.EduWorkService;
import jakarta.annotation.Resource;
import jakarta.annotation.security.PermitAll;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/** Version-scoped proxies; original private storage URLs and child identifiers never become public. */
@RestController
@RequestMapping("/edu/work")
public class AppEduWorkFileController {
    @Resource private EduWorkService works;
    @GetMapping("/preview-file")
    public void preview(@RequestParam Long id,@RequestParam Integer version,@RequestParam Integer attachment,HttpServletResponse response)throws Exception {
        write(response,works.attachment(id,version,attachment,false));
    }
    @GetMapping("/public-file") @PermitAll
    public void published(@RequestParam Long id,@RequestParam Integer version,@RequestParam Integer attachment,HttpServletResponse response)throws Exception {
        write(response,works.attachment(id,version,attachment,true));
    }
    private void write(HttpServletResponse response,EduWorkService.WorkFile file)throws Exception {
        response.setHeader("Cache-Control","private, no-store");response.setHeader("X-Content-Type-Options","nosniff");response.setHeader("Content-Security-Policy","sandbox; default-src 'none'");
        response.setContentType("application/octet-stream");
        response.setHeader("Content-Disposition","attachment; filename=\"work-attachment\"; filename*=UTF-8''"+URLEncoder.encode(file.name(),StandardCharsets.UTF_8).replace("+","%20"));
        response.setContentLengthLong(file.content().length);response.getOutputStream().write(file.content());
    }
    @ExceptionHandler(ServiceException.class) @ResponseStatus(HttpStatus.NOT_FOUND)
    public CommonResult<?> unavailable(ServiceException error,HttpServletResponse response){response.setHeader("Cache-Control","private, no-store");return CommonResult.error(error.getCode(),error.getMessage());}
}

package cn.iocoder.yudao.module.edu.controller.app;

import cn.iocoder.yudao.framework.common.pojo.CommonResult;
import cn.iocoder.yudao.module.edu.service.EduFileService;
import cn.iocoder.yudao.module.infra.dal.dataobject.file.FileDO;
import jakarta.annotation.Resource;
import jakarta.servlet.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;
import static cn.iocoder.yudao.framework.common.pojo.CommonResult.success;
import static cn.iocoder.yudao.module.infra.framework.file.core.utils.FileTypeUtils.writeAttachment;

@RestController @RequestMapping("/edu/file")
public class AppEduFileController {
    @Resource private EduFileService files;
    @PostMapping("/upload") public CommonResult<?> upload(@RequestParam Long studentId,@RequestParam MultipartFile file)throws Exception{return success(files.upload(studentId,file));}
    @GetMapping("/get-url") public CommonResult<?> url(@RequestParam Long fileId,@RequestParam(required=false)Long studentId,HttpServletRequest request){files.authorized(fileId,studentId,false);return success(download(request,fileId));}
    @GetMapping("/content") public void content(@RequestParam Long fileId,@RequestParam(required=false)Long studentId,HttpServletResponse response)throws Exception{FileDO file=files.authorized(fileId,studentId,false);response.setHeader("Cache-Control","private, no-store");response.setHeader("X-Content-Type-Options","nosniff");writeAttachment(response,file.getName(),files.content(file));}
    public static Map<String,Object> download(HttpServletRequest request,Long fileId){
        String path=request.getRequestURI().replace("/get-url","/content");var builder=org.springframework.web.servlet.support.ServletUriComponentsBuilder.fromCurrentContextPath().path(path).queryParam("fileId",fileId);if(request.getParameter("studentId")!=null)builder.queryParam("studentId",request.getParameter("studentId"));String url=builder.toUriString();
        Map<String,String> headers=new LinkedHashMap<>();String auth=request.getHeader("Authorization");if(auth!=null)headers.put("Authorization",auth);headers.put("tenant-id",String.valueOf(cn.iocoder.yudao.framework.tenant.core.context.TenantContextHolder.getRequiredTenantId()));
        // Revalidate the original bearer session and business permission on every request. Tokens never enter URLs.
        return Map.of("url",url,"headers",headers,"expiresIn",0);
    }
}

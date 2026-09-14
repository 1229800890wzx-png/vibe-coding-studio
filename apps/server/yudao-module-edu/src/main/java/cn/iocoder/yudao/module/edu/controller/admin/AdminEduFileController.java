package cn.iocoder.yudao.module.edu.controller.admin;

import cn.iocoder.yudao.framework.common.pojo.CommonResult;
import cn.iocoder.yudao.module.edu.service.EduFileService;
import cn.iocoder.yudao.module.edu.controller.app.AppEduFileController;
import cn.iocoder.yudao.module.infra.dal.dataobject.file.FileDO;
import jakarta.annotation.Resource;
import jakarta.servlet.http.*;
import org.springframework.web.bind.annotation.*;
import static cn.iocoder.yudao.framework.common.pojo.CommonResult.success;
import static cn.iocoder.yudao.module.infra.framework.file.core.utils.FileTypeUtils.writeAttachment;

@RestController @RequestMapping("/edu/file")
public class AdminEduFileController {
    @Resource private EduFileService files;
    @PostMapping("/upload") public CommonResult<?> upload(@RequestParam Long cohortId,@RequestParam org.springframework.web.multipart.MultipartFile file)throws Exception{return success(files.uploadMaterial(cohortId,file));}
    @GetMapping("/get-url") public CommonResult<?> url(@RequestParam Long fileId,HttpServletRequest request){files.authorized(fileId,null,true);return success(AppEduFileController.download(request,fileId));}
    @GetMapping("/content") public void content(@RequestParam Long fileId,HttpServletResponse response)throws Exception{FileDO file=files.authorized(fileId,null,true);response.setHeader("Cache-Control","private, no-store");response.setHeader("X-Content-Type-Options","nosniff");writeAttachment(response,file.getName(),files.content(file));}
}

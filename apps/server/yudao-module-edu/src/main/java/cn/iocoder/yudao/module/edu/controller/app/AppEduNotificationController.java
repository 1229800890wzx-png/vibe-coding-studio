package cn.iocoder.yudao.module.edu.controller.app;

import cn.iocoder.yudao.framework.common.enums.UserTypeEnum;
import cn.iocoder.yudao.framework.common.pojo.CommonResult;
import cn.iocoder.yudao.framework.common.pojo.PageResult;
import cn.iocoder.yudao.module.system.controller.admin.notify.vo.message.NotifyMessageMyPageReqVO;
import cn.iocoder.yudao.module.system.dal.dataobject.notify.NotifyMessageDO;
import cn.iocoder.yudao.module.system.service.notify.NotifyMessageService;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import static cn.iocoder.yudao.framework.common.pojo.CommonResult.success;
import static cn.iocoder.yudao.framework.security.core.util.SecurityFrameworkUtils.getLoginUserId;

/** Member read surface for original system notifications. Recipient identity never comes from the client. */
@RestController
@RequestMapping("/edu/notification")
@Validated
public class AppEduNotificationController {
    @Resource private NotifyMessageService messages;

    @GetMapping("/page")
    public CommonResult<PageResult<Map<String,Object>>> page(@Valid NotifyMessageMyPageReqVO request) {
        var page=messages.getMyMyNotifyMessagePage(request,getLoginUserId(),UserTypeEnum.MEMBER.getValue());
        return success(new PageResult<>(page.getList().stream().map(AppEduNotificationController::view).toList(),page.getTotal()));
    }
    @GetMapping("/unread-count")
    public CommonResult<Long> unreadCount(){return success(messages.getUnreadNotifyMessageCount(getLoginUserId(),UserTypeEnum.MEMBER.getValue()));}

    public record ReadRequest(@NotEmpty @Size(max=100) List<@NotNull Long> ids) {}
    @PutMapping("/read")
    public CommonResult<Integer> read(@Valid @RequestBody ReadRequest request){return success(messages.updateNotifyMessageRead(request.ids(),getLoginUserId(),UserTypeEnum.MEMBER.getValue()));}
    @PutMapping("/read-all")
    public CommonResult<Integer> readAll(){return success(messages.updateAllNotifyMessageRead(getLoginUserId(),UserTypeEnum.MEMBER.getValue()));}

    private static Map<String,Object> view(NotifyMessageDO message){
        Map<String,Object> result=new LinkedHashMap<>();var params=message.getTemplateParams();
        result.put("id",message.getId());result.put("title",params!=null&&params.get("title")!=null?String.valueOf(params.get("title")):"服务通知");
        result.put("content",params!=null&&params.get("content")!=null?String.valueOf(params.get("content")):message.getTemplateContent());
        result.put("readStatus",message.getReadStatus());result.put("readTime",message.getReadTime());result.put("createTime",message.getCreateTime());return result;
    }
}

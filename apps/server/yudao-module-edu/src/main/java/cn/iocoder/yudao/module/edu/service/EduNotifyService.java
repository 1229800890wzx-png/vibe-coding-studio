package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.module.edu.dal.dataobject.EduStudentDO;
import cn.iocoder.yudao.module.edu.dal.mysql.EduStudentMapper;
import cn.iocoder.yudao.module.system.api.notify.NotifyMessageSendApi;
import cn.iocoder.yudao.module.system.api.notify.dto.NotifySendSingleToUserReqDTO;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import java.util.Map;

/** Durable in-app notices use the upstream template, message and read-state tables in the business transaction. */
@Service
public class EduNotifyService {
    @Resource private NotifyMessageSendApi messages;
    @Resource private EduStudentMapper students;
    public void guardian(Long studentId,String title,String content){EduStudentDO student=EduRules.found(students.selectById(studentId),"孩子档案不存在");messages.sendSingleMessageToMember(new NotifySendSingleToUserReqDTO().setUserId(student.getGuardianMemberId()).setTemplateCode("edu_service_update").setTemplateParams(Map.of("title",title,"content",content)));}
}

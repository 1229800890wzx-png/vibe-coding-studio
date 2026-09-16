package cn.iocoder.yudao.module.crm.integration.bpm;

import cn.iocoder.yudao.module.bpm.api.task.BpmProcessInstanceApi;
import cn.iocoder.yudao.module.bpm.api.task.dto.BpmProcessInstanceCreateReqDTO;
import cn.iocoder.yudao.module.crm.service.approval.CrmApprovalBridge;
import cn.iocoder.yudao.module.crm.util.CrmAuditStatusUtils;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Component;

/** Compiled only with the crm-bpm Maven profile; delegates to the unchanged original BPM APIs/listeners. */
@Component
public class CrmOriginalBpmBridge implements CrmApprovalBridge {
    @Resource private BpmProcessInstanceApi processes;
    @Override public String createProcessInstance(Long userId, String definitionKey, String businessKey) {
        return processes.createProcessInstance(userId, new BpmProcessInstanceCreateReqDTO()
                .setProcessDefinitionKey(definitionKey).setBusinessKey(businessKey));
    }
    @Override public Integer toAuditStatus(Integer processResult) {
        return CrmAuditStatusUtils.convertBpmResultToAuditStatus(processResult);
    }
}

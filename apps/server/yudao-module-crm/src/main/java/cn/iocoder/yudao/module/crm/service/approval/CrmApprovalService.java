package cn.iocoder.yudao.module.crm.service.approval;

import cn.iocoder.yudao.framework.common.exception.ServiceException;
import jakarta.annotation.Resource;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

/** Fails before business state changes when contract/receivable approval is not installed. */
@Service
public class CrmApprovalService {
    @Resource private ObjectProvider<CrmApprovalBridge> bridges;
    private CrmApprovalBridge required() {
        CrmApprovalBridge bridge = bridges.getIfAvailable();
        if (bridge == null) throw new ServiceException(400, "合同与回款审批未启用，请先配置原 BPM 集成");
        return bridge;
    }
    public String createProcessInstance(Long userId, String definitionKey, String businessKey) {
        return required().createProcessInstance(userId, definitionKey, businessKey);
    }
    public Integer toAuditStatus(Integer processResult) { return required().toAuditStatus(processResult); }
}

package cn.iocoder.yudao.module.crm.service.approval;

/** Optional original BPM integration. CRM identity, permissions and business services do not depend on an engine. */
public interface CrmApprovalBridge {
    String createProcessInstance(Long userId, String definitionKey, String businessKey);
    Integer toAuditStatus(Integer processResult);
}

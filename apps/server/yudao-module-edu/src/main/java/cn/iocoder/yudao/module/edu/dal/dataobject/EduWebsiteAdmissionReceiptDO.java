package cn.iocoder.yudao.module.edu.dal.dataobject;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.*;
import lombok.*;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("edu_website_admission_receipt")
public class EduWebsiteAdmissionReceiptDO extends TenantBaseDO {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String channel;
    private String requestId;
    private String payloadDigest;
    private Long crmClueId;
    private String receipt;
    private String traceId;
}

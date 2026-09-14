package cn.iocoder.yudao.module.edu.dal.dataobject;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.*;
import lombok.*;
import java.time.LocalDateTime;

/** Education extension; persistence/audit/tenant behavior inherited from the upstream platform. */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("edu_publish_consent")
public class EduPublishConsentDO extends TenantBaseDO {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long workId;
    private Integer version;
    private Long guardianMemberId;
    private String status;
    private LocalDateTime grantedAt;
    private LocalDateTime revokedAt;
}

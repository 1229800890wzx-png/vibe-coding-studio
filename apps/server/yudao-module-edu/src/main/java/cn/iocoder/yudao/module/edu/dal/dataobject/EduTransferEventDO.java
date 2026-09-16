package cn.iocoder.yudao.module.edu.dal.dataobject;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.*;
import lombok.*;
import java.time.LocalDateTime;

/** Education extension; persistence/audit/tenant behavior inherited from the upstream platform. */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("edu_transfer_event")
public class EduTransferEventDO extends TenantBaseDO {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long enrollmentId;
    private Long fromCohortId;
    private Long targetCohortId;
    private Long requestId;
    private Long actorId;
    private String reason;
}

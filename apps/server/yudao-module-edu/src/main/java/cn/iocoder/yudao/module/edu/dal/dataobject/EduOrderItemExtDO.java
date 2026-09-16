package cn.iocoder.yudao.module.edu.dal.dataobject;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.*;
import lombok.*;
import java.time.LocalDateTime;

/** Education extension; persistence/audit/tenant behavior inherited from the upstream platform. */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("edu_order_item_ext")
public class EduOrderItemExtDO extends TenantBaseDO {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long orderItemId;
    private Long studentId;
    private Long purchasedCohortId;
    private String snapshotJson;
}

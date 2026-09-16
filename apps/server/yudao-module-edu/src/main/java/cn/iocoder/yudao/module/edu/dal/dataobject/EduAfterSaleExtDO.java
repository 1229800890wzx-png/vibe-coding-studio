package cn.iocoder.yudao.module.edu.dal.dataobject;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.*;
import lombok.*;
import java.time.LocalDateTime;

/** Education extension; persistence/audit/tenant behavior inherited from the upstream platform. */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("edu_after_sale_ext")
public class EduAfterSaleExtDO extends TenantBaseDO {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long afterSaleId;
    private Long enrollmentId;
    private String entitlementAction;
    private Integer enrollmentVersion;
    private Boolean stockReleased;
}

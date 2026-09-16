package cn.iocoder.yudao.module.edu.dal.dataobject;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.*;
import lombok.*;
import java.time.LocalDateTime;

/** Education extension; persistence/audit/tenant behavior inherited from the upstream platform. */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("edu_cohort")
public class EduCohortDO extends TenantBaseDO {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long courseId;
    private Long courseVersionId;
    private Long skuId;
    private String name;
    private String kind;
    private String mode;
    private Long campusId;
    private Long roomId;
    private Long teacherId;
    private Integer capacity;
    private String status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String terms;
    private String refundPolicy;
    private Integer version;
}

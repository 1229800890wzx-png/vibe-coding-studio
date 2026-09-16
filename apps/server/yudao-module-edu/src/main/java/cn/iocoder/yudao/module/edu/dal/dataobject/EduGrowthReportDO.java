package cn.iocoder.yudao.module.edu.dal.dataobject;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.*;
import lombok.*;
import java.time.LocalDateTime;

/** Education extension; persistence/audit/tenant behavior inherited from the upstream platform. */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("edu_growth_report")
public class EduGrowthReportDO extends TenantBaseDO {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long studentId;
    private Long enrollmentId;
    private String title;
    private String content;
    private String dimensionsJson;
    private String status;
    private Integer version;
    private LocalDateTime publishedAt;
}

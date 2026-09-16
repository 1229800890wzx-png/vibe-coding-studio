package cn.iocoder.yudao.module.edu.dal.dataobject;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.*;
import lombok.*;
import java.time.LocalDateTime;

/** Education extension; persistence/audit/tenant behavior inherited from the upstream platform. */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("edu_assignment")
public class EduAssignmentDO extends TenantBaseDO {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long cohortId;
    private Long sessionId;
    private String title;
    private String description;
    private LocalDateTime dueTime;
    private String materialsJson;
    private String status;
}

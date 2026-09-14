package cn.iocoder.yudao.module.edu.dal.dataobject;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.*;
import lombok.*;
import java.time.LocalDateTime;

/** Education extension; persistence/audit/tenant behavior inherited from the upstream platform. */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("edu_session")
public class EduSessionDO extends TenantBaseDO {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long cohortId;
    private Long lessonTemplateId;
    private String title;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Long teacherId;
    private Long roomId;
    private String joinInfo;
    private String materialsJson;
    private String status;
    private Integer version;
}

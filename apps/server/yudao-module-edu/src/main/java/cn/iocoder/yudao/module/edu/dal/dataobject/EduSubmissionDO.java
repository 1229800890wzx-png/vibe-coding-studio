package cn.iocoder.yudao.module.edu.dal.dataobject;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.*;
import lombok.*;
import java.time.LocalDateTime;

/** Education extension; persistence/audit/tenant behavior inherited from the upstream platform. */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("edu_submission")
public class EduSubmissionDO extends TenantBaseDO {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long assignmentId;
    private Long studentId;
    private Long enrollmentId;
    private Integer version;
    private String content;
    private String attachmentsJson;
    private String status;
    private LocalDateTime submittedAt;
    private Integer revision;
}

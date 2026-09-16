package cn.iocoder.yudao.module.edu.dal.dataobject;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.*;
import lombok.*;
import java.time.LocalDateTime;

/** Education extension; persistence/audit/tenant behavior inherited from the upstream platform. */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("edu_review")
public class EduReviewDO extends TenantBaseDO {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long submissionId;
    private Long teacherId;
    private String feedback;
    private Integer score;
    private String status;
    private Boolean requireRevision;
    private LocalDateTime publishedAt;
    private Integer revision;
}

package cn.iocoder.yudao.module.edu.dal.dataobject;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.*;
import lombok.*;
import java.time.LocalDateTime;

/** Education extension; persistence/audit/tenant behavior inherited from the upstream platform. */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("edu_file_access")
public class EduFileAccessDO extends TenantBaseDO {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long fileId;
    private Long studentId;
    private Long cohortId;
    private Long ownerMemberId;
    private String name;
    private String purpose;
    private String sha256;
    private String status;
}

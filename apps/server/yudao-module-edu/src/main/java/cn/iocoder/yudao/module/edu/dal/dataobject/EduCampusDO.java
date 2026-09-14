package cn.iocoder.yudao.module.edu.dal.dataobject;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.*;
import lombok.*;
import java.time.LocalDateTime;

/** Education extension; persistence/audit/tenant behavior inherited from the upstream platform. */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("edu_campus")
public class EduCampusDO extends TenantBaseDO {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long deptId;
    private String name;
    private String city;
    private String address;
    private String latitude;
    private String longitude;
    private String description;
    private String status;
}

package cn.iocoder.yudao.module.edu.dal.dataobject;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.*;
import lombok.*;
import java.time.LocalDateTime;

/** Education extension; persistence/audit/tenant behavior inherited from the upstream platform. */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("edu_course")
public class EduCourseDO extends TenantBaseDO {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long spuId;
    private String name;
    private String code;
    private String description;
    private String coverUrl;
    private Integer ageMin;
    private Integer ageMax;
    private String direction;
    private String level;
    private String status;
    private Integer version;
    private Integer revision;
    private String objectives;
    private String outcomes;
    private String lessonsJson;
}

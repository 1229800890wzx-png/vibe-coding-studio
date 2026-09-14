package cn.iocoder.yudao.module.edu.dal.dataobject;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("edu_website_offering")
public class EduWebsiteOfferingDO extends TenantBaseDO {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String slug;
    private String title;
    private String description;
    private String outline;
    private Integer stage;
    private String image;
    private Integer sortOrder;
    private Boolean published;
    private Long courseId;
    private Integer revision;
}

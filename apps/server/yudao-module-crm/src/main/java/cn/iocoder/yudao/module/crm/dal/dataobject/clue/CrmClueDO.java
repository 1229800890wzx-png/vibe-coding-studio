package cn.iocoder.yudao.module.crm.dal.dataobject.clue;

import cn.iocoder.yudao.framework.mybatis.core.dataobject.BaseDO;
import cn.iocoder.yudao.module.crm.dal.dataobject.customer.CrmCustomerDO;
import cn.iocoder.yudao.module.crm.enums.DictTypeConstants;
import com.baomidou.mybatisplus.annotation.KeySequence;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.FieldStrategy;
import lombok.*;

import java.time.LocalDateTime;

/**
 * CRM 线索 DO
 *
 * @author Wanwan
 */
@TableName("crm_clue")
@KeySequence("crm_clue_seq") // 用于 Oracle、PostgreSQL、Kingbase、DB2、H2 数据库的主键自增。如果是 MySQL 等数据库，可不写。
@Data
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrmClueDO extends BaseDO {

    /**
     * 编号，主键自增
     */
    @TableId
    private Long id;
    /** Education origin references only; CRM owner and permission records remain authoritative. */
    private Long educationMemberId;
    private Long educationStudentId;
    private Long educationCourseId;
    private LocalDateTime educationConsentTime;
    private String educationConsentVersion;
    /** Request facts are written only by the education adapter, never generic CRM updateById. */
    @TableField(updateStrategy = FieldStrategy.NEVER)
    private String educationServiceType;
    @TableField(updateStrategy = FieldStrategy.NEVER)
    private Long educationTeacherId;
    @TableField(updateStrategy = FieldStrategy.NEVER)
    private String educationTeacherName;
    @TableField(updateStrategy = FieldStrategy.NEVER)
    private LocalDateTime educationPreferredStartTime;
    @TableField(updateStrategy = FieldStrategy.NEVER)
    private LocalDateTime educationPreferredEndTime;
    @TableField(updateStrategy = FieldStrategy.NEVER)
    private String educationAppointmentStatus;
    /**
     * 线索名称
     */
    private String name;

    /**
     * 跟进状态
     */
    private Boolean followUpStatus;
    /**
     * 最后跟进时间
     */
    private LocalDateTime contactLastTime;
    /**
     * 最后跟进内容
     */
    private String contactLastContent;
    /**
     * 下次联系时间
     */
    private LocalDateTime contactNextTime;

    /**
     * 负责人的用户编号
     *
     * 关联 AdminUserDO 的 id 字段
     */
    private Long ownerUserId;

    /**
     * 转化状态
     *
     * true 表示已转换，会更新 {@link #customerId} 字段
     */
    private Boolean transformStatus;
    /**
     * 客户编号
     *
     * 关联 {@link CrmCustomerDO#getId()}
     */
    private Long customerId;

    /**
     * 手机号
     */
    private String mobile;
    /**
     * 电话
     */
    private String telephone;
    /**
     * QQ
     */
    private String qq;
    /**
     * wechat
     */
    private String wechat;
    /**
     * email
     */
    private String email;
    /**
     * 所在地
     *
     * 关联 {@link cn.iocoder.yudao.framework.ip.core.Area#getId()} 字段
     */
    private Integer areaId;
    /**
     * 详细地址
     */
    private String detailAddress;
    /**
     * 所属行业
     *
     * 对应字典 {@link DictTypeConstants#CRM_CUSTOMER_INDUSTRY}
     */
    private Integer industryId;
    /**
     * 客户等级
     *
     * 对应字典 {@link DictTypeConstants#CRM_CUSTOMER_LEVEL}
     */
    private Integer level;
    /**
     * 客户来源
     *
     * 对应字典 {@link DictTypeConstants#CRM_CUSTOMER_SOURCE}
     */
    private Integer source;
    /**
     * 备注
     */
    private String remark;

}

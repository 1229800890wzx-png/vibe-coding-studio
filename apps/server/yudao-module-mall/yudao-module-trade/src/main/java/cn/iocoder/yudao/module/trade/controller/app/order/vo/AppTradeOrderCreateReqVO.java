package cn.iocoder.yudao.module.trade.controller.app.order.vo;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;

@Schema(description = "用户 App - 交易订单创建 Request VO")
@Data
public class AppTradeOrderCreateReqVO extends AppTradeOrderSettlementReqVO {

    @Schema(description = "用户确认的结算实付金额（分）；教育订单必填，价格变化需重新确认", example = "24000")
    @Min(value = 0, message = "确认金额不能为负数")
    private Integer expectedPayPrice;

    @Schema(description = "备注", example = "这个是我的订单哟")
    private String remark;

    @AssertTrue(message = "配送方式不能为空")
    @JsonIgnore
    public boolean isDeliveryTypeNotNull() {
        return getDeliveryType() != null;
    }

}

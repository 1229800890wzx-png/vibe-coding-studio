package cn.iocoder.yudao.module.trade.service.education;

import cn.iocoder.yudao.framework.common.exception.ErrorCode;
import cn.iocoder.yudao.module.trade.enums.delivery.DeliveryTypeEnum;
import cn.iocoder.yudao.module.trade.service.price.bo.TradePriceCalculateReqBO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

import static cn.iocoder.yudao.framework.common.exception.util.ServiceExceptionUtil.exception;

/** Shared checks used by original cart and original quote/order price calculation. */
@Component
@RequiredArgsConstructor
public class TradeEducationValidator {
    private final ObjectProvider<TradeEducationPolicy> policies;

    public boolean validateItem(Long memberId, Long skuId, Long studentId, Integer count) {
        TradeEducationPolicy policy = policies.orderedStream()
                .filter(candidate -> candidate.isEducationSku(skuId)).findFirst().orElse(null);
        if (policy == null) {
            if (studentId != null) throw invalid("该商品不是可报名课程，请重新选择班级");
            return false;
        }
        if (studentId == null) throw invalid("请选择报名学员");
        if (!Integer.valueOf(1).equals(count)) throw invalid("每位学员每个班级只能报名一份，请分别选择学员");
        policy.validatePurchase(memberId, skuId, studentId, count);
        return true;
    }

    public void validateOrder(TradePriceCalculateReqBO request) {
        boolean hasEducation = false, hasMerchandise = false;
        Set<String> learners = new HashSet<>();
        for (TradePriceCalculateReqBO.Item item : request.getItems()) {
            if (!Boolean.TRUE.equals(item.getSelected())) continue;
            boolean education = validateItem(request.getUserId(), item.getSkuId(), item.getStudentId(), item.getCount());
            if (education) {
                hasEducation = true;
                if (!learners.add(item.getSkuId() + ":" + item.getStudentId()))
                    throw invalid("同一学员不能重复报名同一班级，请检查订单明细");
            } else hasMerchandise = true;
        }
        if (hasEducation && hasMerchandise) throw invalid("课程与实物商品请分别结算");
        if (hasEducation && request.getDeliveryType() != null
                && !Objects.equals(request.getDeliveryType(), DeliveryTypeEnum.EDUCATION.getType()))
            throw invalid("课程报名请选择教学服务交付，无需填写收货地址");
        if (!hasEducation && Objects.equals(request.getDeliveryType(), DeliveryTypeEnum.EDUCATION.getType()))
            throw invalid("教学服务交付仅适用于课程报名");
        if (hasEducation) { request.setAddressId(null); request.setPickUpStoreId(null); }
    }

    /** Must run after server recalculation and before order persistence or inventory handlers. */
    public static void validateExpectedPrice(Integer deliveryType, Integer expectedPayPrice, Integer actualPayPrice) {
        if (Objects.equals(deliveryType, DeliveryTypeEnum.EDUCATION.getType()) && expectedPayPrice == null)
            throw invalid("请刷新结算信息，确认课程金额后重新提交订单");
        if (expectedPayPrice != null && !Objects.equals(expectedPayPrice, actualPayPrice))
            throw invalid("结算价格已发生变化，请刷新结算信息并重新确认金额");
    }

    private static RuntimeException invalid(String message) {
        return exception(new ErrorCode(1_011_060_000, message));
    }
}

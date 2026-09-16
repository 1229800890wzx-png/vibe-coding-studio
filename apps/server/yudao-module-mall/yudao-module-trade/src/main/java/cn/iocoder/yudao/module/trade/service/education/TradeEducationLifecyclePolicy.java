package cn.iocoder.yudao.module.trade.service.education;

import cn.iocoder.yudao.module.trade.controller.app.aftersale.vo.AppAfterSaleCreateReqVO;
import cn.iocoder.yudao.module.trade.dal.dataobject.aftersale.AfterSaleDO;
import cn.iocoder.yudao.module.trade.dal.dataobject.order.TradeOrderDO;
import cn.iocoder.yudao.module.trade.dal.dataobject.order.TradeOrderItemDO;
import java.util.List;
import java.util.Map;

/** Optional education SPI. Commerce never imports the education module. */
public interface TradeEducationLifecyclePolicy {
    boolean isEducationItem(Long orderItemId);
    default Map<String,Object> itemDetails(Long orderItemId) { return Map.of(); }
    default Map<String,Object> afterSaleDetails(Long afterSaleId) { return Map.of(); }
    void beforeAfterSaleCreate(Long memberId, TradeOrderItemDO item, AppAfterSaleCreateReqVO request);
    void afterAfterSaleCreate(AfterSaleDO afterSale, String entitlementAction);
    /** Called under original order/item locks before original item cancellation handlers. */
    boolean afterRefundSuccess(AfterSaleDO afterSale);
    /** True when the last successful education refund preserves teaching entitlement. */
    boolean keepsEntitlement(Long afterSaleId);
    default boolean shouldRunItemCancellationHooks(Long afterSaleId) { return !keepsEntitlement(afterSaleId); }
    /** Called only after the original pay service verifies a successful late payment. */
    boolean tryFulfillLatePayment(TradeOrderDO order, List<TradeOrderItemDO> items);
    void markLateRefundPending(TradeOrderDO order, List<TradeOrderItemDO> items);
    void afterLateRefundConfirmed(TradeOrderDO order);
}

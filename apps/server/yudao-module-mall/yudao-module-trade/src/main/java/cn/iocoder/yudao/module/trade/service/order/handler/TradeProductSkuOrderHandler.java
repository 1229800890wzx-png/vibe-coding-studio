package cn.iocoder.yudao.module.trade.service.order.handler;

import cn.hutool.core.collection.CollUtil;
import cn.iocoder.yudao.module.product.api.sku.ProductSkuApi;
import cn.iocoder.yudao.module.trade.convert.order.TradeOrderConvert;
import cn.iocoder.yudao.module.trade.dal.dataobject.order.TradeOrderDO;
import cn.iocoder.yudao.module.trade.dal.dataobject.order.TradeOrderItemDO;
import org.springframework.stereotype.Component;

import jakarta.annotation.Resource;
import org.springframework.beans.factory.ObjectProvider;
import cn.iocoder.yudao.module.trade.service.education.TradeEducationLifecyclePolicy;
import java.util.List;

import static java.util.Collections.singletonList;

/**
 * 商品 SKU 库存的 {@link TradeOrderHandler} 实现类
 *
 * @author 芋道源码
 */
@Component
public class TradeProductSkuOrderHandler implements TradeOrderHandler {

    @Resource
    private ProductSkuApi productSkuApi;
    @Resource private ObjectProvider<TradeEducationLifecyclePolicy> educationPolicies;

    @Override
    public void beforeOrderCreate(TradeOrderDO order, List<TradeOrderItemDO> orderItems) {
        productSkuApi.updateSkuStock(TradeOrderConvert.INSTANCE.convertNegative(orderItems));
    }

    @Override
    public void afterCancelOrder(TradeOrderDO order, List<TradeOrderItemDO> orderItems) {
        // 售后的订单项，已经在 afterCancelOrderItem 回滚库存，所以这里不需要重复回滚
        orderItems = filterOrderItemListByNoneAfterSale(orderItems);
        if (Boolean.TRUE.equals(order.getPayStatus())) orderItems = orderItems.stream().filter(i -> educationPolicies.orderedStream().noneMatch(p -> p.isEducationItem(i.getId()))).toList();
        if (CollUtil.isEmpty(orderItems)) {
            return;
        }
        productSkuApi.updateSkuStock(TradeOrderConvert.INSTANCE.convert(orderItems));
    }

    @Override
    public void afterCancelOrderItem(TradeOrderDO order, TradeOrderItemDO orderItem) {
        // Education refund policy releases the current (possibly transferred) cohort exactly once.
        if (educationPolicies.orderedStream().anyMatch(p -> p.isEducationItem(orderItem.getId()))) return;
        productSkuApi.updateSkuStock(TradeOrderConvert.INSTANCE.convert(singletonList(orderItem)));
    }

}

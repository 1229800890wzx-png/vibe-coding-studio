package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.module.trade.dal.dataobject.order.*;
import cn.iocoder.yudao.module.trade.service.order.handler.TradeOrderHandler;
import jakarta.annotation.Resource;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import java.util.List;

/** Runs validation before the original inventory handler; never deducts purchase stock twice. */
@Component
@Order(-100)
public class EduTradeOrderHandler implements TradeOrderHandler {
    @Resource private EduTradeLifecycleService lifecycle;
    @Override public void beforeOrderCreate(TradeOrderDO o,List<TradeOrderItemDO> i){lifecycle.beforeCreate(o,i);}
    @Override public void afterOrderCreate(TradeOrderDO o,List<TradeOrderItemDO> i){lifecycle.afterCreate(o,i);}
    @Override public void afterPayOrder(TradeOrderDO o,List<TradeOrderItemDO> i){lifecycle.afterPaid(o,i);}
    @Override public void afterCancelOrder(TradeOrderDO o,List<TradeOrderItemDO> i){lifecycle.afterCancelled(o,i);}
}

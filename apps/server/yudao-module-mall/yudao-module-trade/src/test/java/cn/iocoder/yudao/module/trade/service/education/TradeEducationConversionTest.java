package cn.iocoder.yudao.module.trade.service.education;

import cn.iocoder.yudao.module.trade.controller.app.order.vo.AppTradeOrderSettlementReqVO;
import cn.iocoder.yudao.module.trade.convert.order.TradeOrderConvert;
import cn.iocoder.yudao.module.trade.dal.dataobject.cart.CartDO;
import cn.iocoder.yudao.module.trade.dal.dataobject.order.TradeOrderDO;
import cn.iocoder.yudao.module.trade.dal.dataobject.order.TradeOrderItemDO;
import cn.iocoder.yudao.module.trade.service.price.bo.TradePriceCalculateRespBO;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class TradeEducationConversionTest {
    @Test void cartCheckoutUsesPersistedChildRatherThanSubmittedOverride() {
        var request=new AppTradeOrderSettlementReqVO().setItems(List.of(new AppTradeOrderSettlementReqVO.Item().setCartId(30L).setStudentId(999L)));
        var cart=new CartDO().setId(30L).setSkuId(10L).setStudentId(21L).setCount(1);
        var result=TradeOrderConvert.INSTANCE.convert(1L,request,List.of(cart));
        assertEquals(21L,result.getItems().get(0).getStudentId());
    }
    @Test void directCheckoutRetainsEachChildAndOrderItemMapping() {
        var request=new AppTradeOrderSettlementReqVO().setItems(List.of(
                new AppTradeOrderSettlementReqVO.Item().setSkuId(10L).setStudentId(21L).setCount(1),
                new AppTradeOrderSettlementReqVO.Item().setSkuId(10L).setStudentId(22L).setCount(1)));
        var result=TradeOrderConvert.INSTANCE.convert(1L,request,List.of());
        assertEquals(List.of(21L,22L),result.getItems().stream().map(item->item.getStudentId()).toList());
        var priced=new TradePriceCalculateRespBO().setItems(List.of(new TradePriceCalculateRespBO.OrderItem().setSkuId(10L).setStudentId(21L).setCount(1)));
        var persisted=TradeOrderConvert.INSTANCE.convertList(new TradeOrderDO().setId(50L).setUserId(1L),priced);
        assertEquals(21L,persisted.get(0).getStudentId());
        assertEquals(21L,TradeOrderConvert.INSTANCE.convert03(persisted.get(0)).getStudentId());
    }
    @Test void stockDeltaAggregatesSkuWithoutMergingOrderChildren() {
        var items=List.of(new TradeOrderItemDO().setSkuId(10L).setStudentId(21L).setCount(1),new TradeOrderItemDO().setSkuId(10L).setStudentId(22L).setCount(1));
        var reserve=TradeOrderConvert.INSTANCE.convertNegative(items);
        assertEquals(1,reserve.getItems().size());assertEquals(-2,reserve.getItems().get(0).getIncrCount());
        var restore=TradeOrderConvert.INSTANCE.convert(items);assertEquals(2,restore.getItems().get(0).getIncrCount());
        assertEquals(2,items.size());
    }
}

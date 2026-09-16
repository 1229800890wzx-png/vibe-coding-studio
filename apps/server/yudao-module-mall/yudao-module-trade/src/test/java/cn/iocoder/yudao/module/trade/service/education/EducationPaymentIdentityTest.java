package cn.iocoder.yudao.module.trade.service.education;

import cn.iocoder.yudao.framework.common.exception.ServiceException;
import cn.iocoder.yudao.module.trade.dal.dataobject.order.TradeOrderDO;
import cn.iocoder.yudao.module.trade.dal.mysql.order.TradeOrderMapper;
import cn.iocoder.yudao.module.trade.service.order.TradeOrderUpdateServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class EducationPaymentIdentityTest {
    @Test void cancelledOrderCannotUseAnotherPaymentIdEvenBeforeFulfilmentCheck(){
        var service=new TradeOrderUpdateServiceImpl();var orders=mock(TradeOrderMapper.class);ReflectionTestUtils.setField(service,"tradeOrderMapper",orders);
        when(orders.selectOneForUpdate(any(),eq(1L))).thenReturn(new TradeOrderDO().setId(1L).setDeliveryType(3).setStatus(40).setPayStatus(false).setPayOrderId(100L));
        assertThrows(ServiceException.class,()->service.updateOrderPaid(1L,999L));verify(orders,never()).updateById(any(TradeOrderDO.class));
    }
}

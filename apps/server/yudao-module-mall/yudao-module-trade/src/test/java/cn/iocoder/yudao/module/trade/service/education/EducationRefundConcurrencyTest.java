package cn.iocoder.yudao.module.trade.service.education;

import cn.iocoder.yudao.framework.common.exception.ServiceException;
import cn.iocoder.yudao.module.trade.controller.app.aftersale.vo.AppAfterSaleCreateReqVO;
import cn.iocoder.yudao.module.trade.dal.dataobject.aftersale.AfterSaleDO;
import cn.iocoder.yudao.module.trade.dal.dataobject.order.*;
import cn.iocoder.yudao.module.trade.dal.mysql.aftersale.AfterSaleMapper;
import cn.iocoder.yudao.module.trade.dal.mysql.order.*;
import cn.iocoder.yudao.module.trade.service.aftersale.AfterSaleServiceImpl;
import cn.iocoder.yudao.module.trade.service.order.TradeOrderQueryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.List;
import java.util.stream.Stream;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class EducationRefundConcurrencyTest {
    private final AfterSaleServiceImpl service=new AfterSaleServiceImpl();
    private final TradeOrderItemMapper items=mock(TradeOrderItemMapper.class);
    private final AfterSaleMapper refunds=mock(AfterSaleMapper.class);
    private final TradeOrderQueryService query=mock(TradeOrderQueryService.class);
    @BeforeEach void setup(){
        var policy=mock(TradeEducationLifecyclePolicy.class);when(policy.isEducationItem(2L)).thenReturn(true);
        ObjectProvider<TradeEducationLifecyclePolicy> provider=mock(ObjectProvider.class);when(provider.orderedStream()).thenAnswer(x->Stream.of(policy));
        ReflectionTestUtils.setField(service,"educationPolicies",provider);ReflectionTestUtils.setField(service,"educationItemMapper",items);ReflectionTestUtils.setField(service,"educationOrderMapper",mock(TradeOrderMapper.class));ReflectionTestUtils.setField(service,"tradeOrderQueryService",query);ReflectionTestUtils.setField(service,"tradeAfterSaleMapper",refunds);
        // This is the old ownership snapshot a simultaneous request can have observed before waiting for the lock.
        when(query.getOrderItem(1L,2L)).thenReturn(new TradeOrderItemDO().setId(2L).setOrderId(3L).setAfterSaleStatus(0));
    }
    @Test void currentLockedApplyRejectsSecondRequestEvenWhenOwnershipSnapshotWasNone(){
        when(items.selectOneForUpdate(any(),eq(2L))).thenReturn(new TradeOrderItemDO().setId(2L).setOrderId(3L).setAfterSaleStatus(10).setPayPrice(1000));
        assertThrows(ServiceException.class,()->service.createAfterSale(1L,new AppAfterSaleCreateReqVO().setOrderItemId(2L).setRefundPrice(500).setEntitlementAction("KEEP")));
        verify(refunds,never()).insert(any(AfterSaleDO.class));
    }
    @Test void priorCompletedRefundCapsTheNextPartialAmount(){
        when(items.selectOneForUpdate(any(),eq(2L))).thenReturn(new TradeOrderItemDO().setId(2L).setOrderId(3L).setAfterSaleStatus(0).setPayPrice(1000));
        when(refunds.selectList(any(com.baomidou.mybatisplus.core.conditions.Wrapper.class))).thenReturn(List.of(new AfterSaleDO().setStatus(50).setRefundPrice(700)));
        assertThrows(ServiceException.class,()->service.createAfterSale(1L,new AppAfterSaleCreateReqVO().setOrderItemId(2L).setRefundPrice(400).setEntitlementAction("KEEP")));
        verify(refunds,never()).insert(any(AfterSaleDO.class));
    }
}

package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.module.edu.dal.dataobject.*;
import cn.iocoder.yudao.module.edu.dal.mysql.*;
import cn.iocoder.yudao.module.trade.dal.dataobject.aftersale.AfterSaleDO;
import cn.iocoder.yudao.module.trade.dal.dataobject.order.*;
import cn.iocoder.yudao.module.product.api.sku.dto.ProductSkuRespDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import java.time.LocalDateTime;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class EduTradeLifecycleServiceTest {
    private final EduTradeLifecycleService service=new EduTradeLifecycleService();
    private final EduEnrollmentMapper enrollments=mock(EduEnrollmentMapper.class);
    private final EduAfterSaleExtMapper afterSales=mock(EduAfterSaleExtMapper.class);
    private final EduCohortMapper cohorts=mock(EduCohortMapper.class);
    private final EduStudentMapper students=mock(EduStudentMapper.class);
    private final EduSeatHoldMapper holds=mock(EduSeatHoldMapper.class);
    private final EduTrialBookingMapper trials=mock(EduTrialBookingMapper.class);
    private final EduSessionMapper sessions=mock(EduSessionMapper.class);
    private final EduEnrollmentService registration=mock(EduEnrollmentService.class);
    private final EduProductService products=mock(EduProductService.class);
    private final EduNotifyService notices=mock(EduNotifyService.class);
    @BeforeEach void setup(){
        ReflectionTestUtils.setField(service,"enrollments",enrollments);ReflectionTestUtils.setField(service,"afterSales",afterSales);ReflectionTestUtils.setField(service,"cohorts",cohorts);ReflectionTestUtils.setField(service,"students",students);ReflectionTestUtils.setField(service,"holds",holds);ReflectionTestUtils.setField(service,"trials",trials);ReflectionTestUtils.setField(service,"sessions",sessions);ReflectionTestUtils.setField(service,"registration",registration);ReflectionTestUtils.setField(service,"products",products);ReflectionTestUtils.setField(service,"notices",notices);
    }
    @Test void transferredCancellationReleasesCurrentSkuExactlyOnce(){
        var ext=new EduAfterSaleExtDO().setId(71L).setAfterSaleId(7L).setEnrollmentId(3L).setEntitlementAction("CANCEL").setEnrollmentVersion(2).setStockReleased(false);
        var enrollment=new EduEnrollmentDO().setId(3L).setOrderItemId(4L).setStudentId(1L).setCurrentCohortId(20L).setStatus("ACTIVE").setVersion(2);
        when(afterSales.selectOne(any(com.baomidou.mybatisplus.core.toolkit.support.SFunction.class),eq(7L))).thenReturn(ext);when(enrollments.selectOneForUpdate(any(),eq(3L))).thenReturn(enrollment);when(cohorts.selectOneForUpdate(any(),eq(20L))).thenReturn(new EduCohortDO().setId(20L).setSkuId(200L));
        assertFalse(service.afterRefundSuccess(new AfterSaleDO().setId(7L)));
        assertFalse(service.afterRefundSuccess(new AfterSaleDO().setId(7L)));
        verify(products,times(1)).stock(200L,1);verify(products,never()).stock(100L,1);assertEquals("CANCELLED",enrollment.getStatus());assertEquals(3,enrollment.getVersion());
    }
    @Test void fullRefundKeepDoesNotReleaseTeachingSeat(){
        var ext=new EduAfterSaleExtDO().setAfterSaleId(7L).setEnrollmentId(3L).setEntitlementAction("KEEP");var enrollment=new EduEnrollmentDO().setId(3L).setStudentId(1L).setCurrentCohortId(20L).setStatus("ACTIVE").setVersion(2);
        when(afterSales.selectOne(any(com.baomidou.mybatisplus.core.toolkit.support.SFunction.class),eq(7L))).thenReturn(ext);when(enrollments.selectOneForUpdate(any(),eq(3L))).thenReturn(enrollment);
        assertTrue(service.afterRefundSuccess(new AfterSaleDO().setId(7L).setRefundPrice(10000)));assertEquals("ACTIVE",enrollment.getStatus());verifyNoInteractions(products);verify(enrollments,never()).updateById(any(EduEnrollmentDO.class));
    }
    @Test void duplicatePaymentDoesNotActivateOrNotifyTwice(){
        var enrollment=new EduEnrollmentDO().setId(3L).setStudentId(1L).setOrderItemId(4L).setCurrentCohortId(20L).setStatus("PENDING_PAYMENT").setVersion(1);
        when(enrollments.selectOneForUpdate(any(),eq(4L))).thenReturn(enrollment);when(cohorts.selectById(20L)).thenReturn(new EduCohortDO().setId(20L).setKind("REGULAR"));
        var source=List.of(new TradeOrderItemDO().setId(4L));service.afterPaid(new TradeOrderDO(),source);service.afterPaid(new TradeOrderDO(),source);
        assertEquals("ACTIVE",enrollment.getStatus());verify(enrollments,times(1)).updateById(enrollment);verify(notices,times(1)).guardian(eq(1L),anyString(),anyString());verifyNoInteractions(products);
    }
    @Test void latePaymentRechecksIntraBasketScheduleBeforeReacquiringSeats(){
        var a=new EduCohortDO().setId(10L).setSkuId(100L);var b=new EduCohortDO().setId(20L).setSkuId(200L);
        when(cohorts.selectOne(any(com.baomidou.mybatisplus.core.toolkit.support.SFunction.class),eq(100L))).thenReturn(a);when(cohorts.selectOne(any(com.baomidou.mybatisplus.core.toolkit.support.SFunction.class),eq(200L))).thenReturn(b);
        when(enrollments.selectOneForUpdate(any(),eq(4L))).thenReturn(new EduEnrollmentDO().setStudentId(1L).setCurrentCohortId(10L).setStatus("EXPIRED"));when(enrollments.selectOneForUpdate(any(),eq(5L))).thenReturn(new EduEnrollmentDO().setStudentId(1L).setCurrentCohortId(20L).setStatus("EXPIRED"));
        var start=LocalDateTime.now().plusDays(1);when(sessions.selectList(any(com.baomidou.mybatisplus.core.conditions.Wrapper.class))).thenReturn(List.of(new EduSessionDO().setStartTime(start).setEndTime(start.plusHours(1))),List.of(new EduSessionDO().setStartTime(start.plusMinutes(30)).setEndTime(start.plusHours(2))));
        assertFalse(service.tryFulfillLatePayment(new TradeOrderDO(),List.of(new TradeOrderItemDO().setId(4L).setStudentId(1L).setSkuId(100L),new TradeOrderItemDO().setId(5L).setStudentId(1L).setSkuId(200L))));verifyNoInteractions(products);
    }
    @Test void paidTrialUsesOrderSourceWithoutFreeTrialForeignKey(){
        var e=new EduEnrollmentDO().setId(3L).setStudentId(1L).setOrderItemId(4L).setSource("ORDER").setCurrentCohortId(20L).setStatus("PENDING_PAYMENT").setVersion(1);
        when(enrollments.selectOneForUpdate(any(),eq(4L))).thenReturn(e);when(cohorts.selectById(20L)).thenReturn(new EduCohortDO().setId(20L).setKind("TRIAL"));
        when(trials.selectOne(any(com.baomidou.mybatisplus.core.toolkit.support.SFunction.class),eq(4L))).thenReturn(null,new EduTrialBookingDO().setId(8L).setOrderItemId(4L));
        var source=List.of(new TradeOrderItemDO().setId(4L));service.afterPaid(new TradeOrderDO(),source);service.afterPaid(new TradeOrderDO(),source);
        var booking=org.mockito.ArgumentCaptor.forClass(EduTrialBookingDO.class);verify(trials,times(1)).insert(booking.capture());assertEquals(4L,booking.getValue().getOrderItemId());assertEquals("CONFIRMED",booking.getValue().getStatus());
        assertEquals("ORDER",e.getSource());assertNull(e.getTrialBookingId());assertEquals("ACTIVE",e.getStatus());verify(enrollments,times(1)).updateById(e);
    }
    @Test void eligibleLatePaymentReacquiresOriginalStockAndReactivates(){
        var c=new EduCohortDO().setId(10L).setSkuId(100L).setKind("REGULAR");var e=new EduEnrollmentDO().setId(3L).setOrderItemId(4L).setStudentId(1L).setCurrentCohortId(10L).setStatus("EXPIRED").setVersion(2);
        when(students.selectOneForUpdate(any(),eq(1L))).thenReturn(new EduStudentDO().setId(1L));when(cohorts.selectOneForUpdate(any(),eq(10L))).thenReturn(c);
        when(cohorts.selectOne(any(com.baomidou.mybatisplus.core.toolkit.support.SFunction.class),eq(100L))).thenReturn(c);when(cohorts.selectById(10L)).thenReturn(c);when(enrollments.selectOneForUpdate(any(),eq(4L))).thenReturn(e);when(products.sku(100L)).thenReturn(new ProductSkuRespDTO().setStock(1));
        assertTrue(service.tryFulfillLatePayment(new TradeOrderDO(),List.of(new TradeOrderItemDO().setId(4L).setStudentId(1L).setSkuId(100L))));verify(products).stock(100L,-1);assertEquals("ACTIVE",e.getStatus());assertEquals(3,e.getVersion());
    }
    @Test void secondPartialCancelSkipsAllCancellationBenefits(){
        var current=new EduAfterSaleExtDO().setId(72L).setAfterSaleId(8L).setEnrollmentId(3L).setEntitlementAction("CANCEL").setStockReleased(true);var prior=new EduAfterSaleExtDO().setId(71L).setEnrollmentId(3L).setStockReleased(true);
        when(afterSales.selectOne(any(com.baomidou.mybatisplus.core.toolkit.support.SFunction.class),eq(8L))).thenReturn(current);when(afterSales.selectList(any(com.baomidou.mybatisplus.core.toolkit.support.SFunction.class),eq(3L))).thenReturn(List.of(prior,current));assertFalse(service.shouldRunItemCancellationHooks(8L));
    }
}

package cn.iocoder.yudao.module.trade.service.education;

import cn.iocoder.yudao.framework.common.exception.ServiceException;
import cn.iocoder.yudao.module.trade.service.price.bo.TradePriceCalculateReqBO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.support.DefaultListableBeanFactory;

import java.util.Arrays;
import static org.junit.jupiter.api.Assertions.*;

class TradeEducationValidatorTest {
    private TradeEducationValidator validator;
    @BeforeEach
    void setUp() {
        DefaultListableBeanFactory factory = new DefaultListableBeanFactory();
        factory.registerSingleton("policy", new TradeEducationPolicy() {
            public boolean isEducationSku(Long skuId) { return Long.valueOf(10).equals(skuId); }
            public void validatePurchase(Long memberId, Long skuId, Long studentId, Integer count) {
                assertEquals(1L, memberId); // The authenticated original member is propagated.
            }
        });
        validator = new TradeEducationValidator(factory.getBeanProvider(TradeEducationPolicy.class));
    }
    private TradePriceCalculateReqBO.Item item(long sku, Long student) {
        return new TradePriceCalculateReqBO.Item().setSkuId(sku).setStudentId(student).setCount(1).setSelected(true);
    }
    private TradePriceCalculateReqBO order(int delivery, TradePriceCalculateReqBO.Item... items) {
        return new TradePriceCalculateReqBO().setUserId(1L).setDeliveryType(delivery).setItems(Arrays.asList(items));
    }
    @Test void twoChildrenKeepDistinctLinesAndNoAddress() {
        TradePriceCalculateReqBO request = order(3, item(10, 21L), item(10, 22L)).setAddressId(100L).setPickUpStoreId(200L);
        assertDoesNotThrow(() -> validator.validateOrder(request));
        assertEquals(2, request.getItems().size());
        assertNull(request.getAddressId()); assertNull(request.getPickUpStoreId());
    }
    @Test void duplicateChildRejected() { assertThrows(ServiceException.class, () -> validator.validateOrder(order(3, item(10, 21L), item(10, 21L)))); }
    @Test void missingChildRejected() { assertThrows(ServiceException.class, () -> validator.validateItem(1L, 10L, null, 1)); }
    @Test void courseQuantityMustBeOne() { assertThrows(ServiceException.class, () -> validator.validateItem(1L, 10L, 21L, 2)); }
    @Test void physicalAndEducationCannotMix() { assertThrows(ServiceException.class, () -> validator.validateOrder(order(3, item(10, 21L), item(99, null)))); }
    @Test void physicalCannotUseServiceDelivery() { assertThrows(ServiceException.class, () -> validator.validateOrder(order(3, item(99, null)))); }
    @Test void courseCannotUseShipping() { assertThrows(ServiceException.class, () -> validator.validateOrder(order(1, item(10, 21L)))); }
    @Test void originalMerchandiseKeepsShippingAddress() {
        TradePriceCalculateReqBO request = order(1, item(99, null)).setAddressId(100L);
        assertDoesNotThrow(() -> validator.validateOrder(request)); assertEquals(100L, request.getAddressId());
    }
    @Test void missingEducationPluginFailsClosedForChild() {
        TradeEducationValidator ordinary = new TradeEducationValidator(new DefaultListableBeanFactory().getBeanProvider(TradeEducationPolicy.class));
        assertThrows(ServiceException.class, () -> ordinary.validateItem(1L, 10L, 21L, 1));
        assertFalse(ordinary.validateItem(1L, 99L, null, 1));
    }
    @Test void educationRequiresConfirmedQuotePrice() { assertThrows(ServiceException.class, () -> TradeEducationValidator.validateExpectedPrice(3,null,24000)); }
    @Test void changedPriceNeedsFreshConfirmation() { assertThrows(ServiceException.class, () -> TradeEducationValidator.validateExpectedPrice(3,24000,25000)); }
    @Test void confirmedCurrentPriceAllowed() { assertDoesNotThrow(() -> TradeEducationValidator.validateExpectedPrice(3,24000,24000)); }
    @Test void originalMerchandiseCanOmitPriceAcknowledgement() { assertDoesNotThrow(() -> TradeEducationValidator.validateExpectedPrice(1,null,1000)); }
}

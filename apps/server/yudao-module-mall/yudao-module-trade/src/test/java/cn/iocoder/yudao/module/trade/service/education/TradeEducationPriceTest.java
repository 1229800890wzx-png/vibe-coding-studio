package cn.iocoder.yudao.module.trade.service.education;

import cn.iocoder.yudao.framework.test.core.ut.BaseMockitoUnitTest;
import cn.iocoder.yudao.module.product.api.sku.ProductSkuApi;
import cn.iocoder.yudao.module.product.api.sku.dto.ProductSkuRespDTO;
import cn.iocoder.yudao.module.product.api.spu.ProductSpuApi;
import cn.iocoder.yudao.module.product.api.spu.dto.ProductSpuRespDTO;
import cn.iocoder.yudao.module.trade.service.price.TradePriceServiceImpl;
import cn.iocoder.yudao.module.trade.service.price.bo.TradePriceCalculateReqBO;
import cn.iocoder.yudao.module.trade.service.price.bo.TradePriceCalculateRespBO;
import cn.iocoder.yudao.module.trade.service.price.calculator.TradeDeliveryPriceCalculator;
import cn.iocoder.yudao.module.trade.service.price.calculator.TradePriceCalculator;
import cn.iocoder.yudao.module.trade.service.price.calculator.TradePriceCalculatorHelper;
import cn.iocoder.yudao.module.trade.service.price.calculator.TradeCouponPriceCalculator;
import cn.iocoder.yudao.module.promotion.api.coupon.CouponApi;
import cn.iocoder.yudao.module.promotion.api.coupon.dto.CouponRespDTO;
import cn.iocoder.yudao.module.promotion.enums.common.PromotionDiscountTypeEnum;
import cn.iocoder.yudao.module.promotion.enums.common.PromotionProductScopeEnum;
import org.springframework.test.util.ReflectionTestUtils;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import java.util.List;
import java.util.ArrayList;
import java.time.LocalDateTime;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static cn.iocoder.yudao.framework.test.core.util.AssertUtils.assertServiceException;
import static cn.iocoder.yudao.module.product.enums.ErrorCodeConstants.SKU_STOCK_NOT_ENOUGH;

class TradeEducationPriceTest extends BaseMockitoUnitTest {
    @InjectMocks private TradePriceServiceImpl service;
    @Mock private ProductSkuApi skuApi;
    @Mock private ProductSpuApi spuApi;
    @Mock private TradeEducationValidator validator;
    @Mock private List<TradePriceCalculator> calculators;
    @Mock private CouponApi couponApi;
    private TradePriceCalculateReqBO twoChildren() {
        return new TradePriceCalculateReqBO().setUserId(1L).setDeliveryType(3).setItems(List.of(
                new TradePriceCalculateReqBO.Item().setSkuId(10L).setStudentId(21L).setCount(1).setSelected(true),
                new TradePriceCalculateReqBO.Item().setSkuId(10L).setStudentId(22L).setCount(1).setSelected(true)));
    }
    @Test void quoteRejectsTwoChildrenWhenOnlyOneSeatRemains() {
        when(skuApi.getSkuList(anyCollection())).thenReturn(List.of(new ProductSkuRespDTO().setId(10L).setStock(1)));
        assertServiceException(()->service.calculateOrderPrice(twoChildren()),SKU_STOCK_NOT_ENOUGH);
        verifyNoInteractions(spuApi);
    }
    @Test void quoteRetainsChildrenAndChargesBothSeats() {
        when(skuApi.getSkuList(anyCollection())).thenReturn(List.of(new ProductSkuRespDTO().setId(10L).setSpuId(100L).setStock(2).setPrice(12000)));
        when(spuApi.validateSpuList(anyCollection())).thenReturn(List.of(new ProductSpuRespDTO().setId(100L).setName("Course").setDeliveryTypes(List.of(3))));
        var result=service.calculateOrderPrice(twoChildren());
        assertEquals(24000,result.getPrice().getPayPrice());
        assertEquals(List.of(21L,22L),result.getItems().stream().map(TradePriceCalculateRespBO.OrderItem::getStudentId).toList());
    }
    @Test void educationDeliveryNeedsNoAddressOrShippingCollaborators() {
        var request=twoChildren().setAddressId(null);
        var result=new TradePriceCalculateRespBO().setItems(List.of(new TradePriceCalculateRespBO.OrderItem().setDeliveryTypes(List.of(3)).setDeliveryPrice(0)));
        // A fresh calculator has no address/template/store collaborators: any access fails the test.
        assertDoesNotThrow(()->new TradeDeliveryPriceCalculator().calculate(request,result));
        assertEquals(0,result.getItems().get(0).getDeliveryPrice());
    }
    @Test void realCouponCalculatorAllocatesAcrossBothChildrenWithoutCollapsingSku() {
        var request=twoChildren().setCouponId(90L);
        var result=TradePriceCalculatorHelper.buildCalculateResp(request,
                List.of(new ProductSpuRespDTO().setId(100L).setName("Course").setDeliveryTypes(List.of(3))),
                List.of(new ProductSkuRespDTO().setId(10L).setSpuId(100L).setPrice(12000)));
        var coupon=new CouponRespDTO().setId(90L).setName("Two learner coupon").setUsePrice(0)
                .setProductScope(PromotionProductScopeEnum.SPU.getScope()).setProductScopeValues(List.of(100L))
                .setDiscountType(PromotionDiscountTypeEnum.PRICE.getType()).setDiscountPrice(1001)
                .setValidStartTime(LocalDateTime.now().minusDays(1)).setValidEndTime(LocalDateTime.now().plusDays(1));
        when(couponApi.getCouponListByUserId(eq(1L),anyInt())).thenReturn(new ArrayList<>(List.of(coupon)));
        var calculator=new TradeCouponPriceCalculator();ReflectionTestUtils.setField(calculator,"couponApi",couponApi);
        calculator.calculate(request,result);
        assertEquals(List.of(21L,22L),result.getItems().stream().map(TradePriceCalculateRespBO.OrderItem::getStudentId).toList());
        assertEquals(1001,result.getItems().stream().mapToInt(TradePriceCalculateRespBO.OrderItem::getCouponPrice).sum());
        assertEquals(22999,result.getPrice().getPayPrice());
    }
}

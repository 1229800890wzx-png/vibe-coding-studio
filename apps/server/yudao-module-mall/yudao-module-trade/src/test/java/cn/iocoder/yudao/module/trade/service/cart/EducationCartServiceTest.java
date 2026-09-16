package cn.iocoder.yudao.module.trade.service.cart;

import cn.iocoder.yudao.framework.test.core.ut.BaseMockitoUnitTest;
import cn.iocoder.yudao.module.product.api.sku.ProductSkuApi;
import cn.iocoder.yudao.module.product.api.sku.dto.ProductSkuRespDTO;
import cn.iocoder.yudao.module.product.api.spu.ProductSpuApi;
import cn.iocoder.yudao.module.product.api.spu.dto.ProductSpuRespDTO;
import cn.iocoder.yudao.module.product.enums.spu.ProductSpuStatusEnum;
import cn.iocoder.yudao.framework.common.exception.ServiceException;
import cn.iocoder.yudao.module.trade.controller.app.cart.vo.AppCartAddReqVO;
import cn.iocoder.yudao.module.trade.dal.dataobject.cart.CartDO;
import cn.iocoder.yudao.module.trade.dal.mysql.cart.CartMapper;
import cn.iocoder.yudao.module.trade.service.education.TradeEducationValidator;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static cn.iocoder.yudao.framework.test.core.util.AssertUtils.assertServiceException;
import static cn.iocoder.yudao.module.product.enums.ErrorCodeConstants.SKU_STOCK_NOT_ENOUGH;

class EducationCartServiceTest extends BaseMockitoUnitTest {
    @InjectMocks private CartServiceImpl service;
    @Mock private CartMapper mapper;
    @Mock private ProductSkuApi skuApi;
    @Mock private ProductSpuApi spuApi;
    @Mock private TradeEducationValidator validator;
    private AppCartAddReqVO add(long student) { return new AppCartAddReqVO().setSkuId(10L).setStudentId(student).setCount(1); }

    @Test void separateChildrenNeverMerge() {
        when(validator.validateItem(eq(1L),eq(10L),anyLong(),eq(1))).thenReturn(true);
        when(skuApi.getSku(10L)).thenReturn(new ProductSkuRespDTO().setId(10L).setSpuId(100L).setStock(8));
        when(mapper.selectListByUserId(1L)).thenReturn(List.of());
        doAnswer(call -> { CartDO row=call.getArgument(0); row.setId(row.getStudentId()+100); return 1; }).when(mapper).insert(any(CartDO.class));
        assertEquals(121L,service.addCart(1L,add(21L))); assertEquals(122L,service.addCart(1L,add(22L)));
        verify(mapper).selectByUserIdAndSkuIdAndStudentId(1L,10L,21L);
        verify(mapper).selectByUserIdAndSkuIdAndStudentId(1L,10L,22L);
        ArgumentCaptor<CartDO> rows=ArgumentCaptor.forClass(CartDO.class); verify(mapper,times(2)).insert(rows.capture());
        assertEquals(List.of(21L,22L),rows.getAllValues().stream().map(CartDO::getStudentId).toList());
    }
    @Test void repeatedSameChildAddKeepsQuantityOne() {
        CartDO existing=new CartDO().setId(30L).setUserId(1L).setSkuId(10L).setStudentId(21L).setCount(1);
        when(validator.validateItem(1L,10L,21L,1)).thenReturn(true);
        when(mapper.selectByUserIdAndSkuIdAndStudentId(1L,10L,21L)).thenReturn(existing);
        when(mapper.selectListByUserId(1L)).thenReturn(List.of(existing));
        when(skuApi.getSku(10L)).thenReturn(new ProductSkuRespDTO().setId(10L).setStock(8));
        assertEquals(30L,service.addCart(1L,add(21L)));
        ArgumentCaptor<CartDO> update=ArgumentCaptor.forClass(CartDO.class);verify(mapper).updateById(update.capture());
        assertEquals(1,update.getValue().getCount());verify(mapper,never()).insert(any(CartDO.class));
    }
    @Test void twoChildrenAggregateStock() {
        when(validator.validateItem(1L,10L,22L,1)).thenReturn(true);
        when(mapper.selectListByUserId(1L)).thenReturn(List.of(new CartDO().setId(30L).setSkuId(10L).setStudentId(21L).setCount(1)));
        when(skuApi.getSku(10L)).thenReturn(new ProductSkuRespDTO().setId(10L).setStock(1));
        assertServiceException(()->service.addCart(1L,add(22L)),SKU_STOCK_NOT_ENOUGH);
        verify(mapper,never()).insert(any(CartDO.class));
    }
    @Test void unavailableCourseMovesOneRowToOriginalInvalidList() {
        var first=new CartDO().setId(30L).setSpuId(100L).setSkuId(10L).setStudentId(21L).setCount(1);
        var second=new CartDO().setId(31L).setSpuId(100L).setSkuId(10L).setStudentId(22L).setCount(1);
        when(mapper.selectListByUserId(1L)).thenReturn(new java.util.ArrayList<>(List.of(first,second)));
        when(spuApi.getSpuList(anyCollection())).thenReturn(List.of(new ProductSpuRespDTO().setId(100L).setStock(8).setStatus(ProductSpuStatusEnum.ENABLE.getStatus())));
        when(skuApi.getSkuList(anyCollection())).thenReturn(List.of(new ProductSkuRespDTO().setId(10L)));
        when(validator.validateItem(eq(1L),eq(10L),anyLong(),eq(1))).thenAnswer(call -> {
            if (Long.valueOf(21L).equals(call.getArgument(2))) throw new ServiceException(1011060000,"该学员已报名");
            return true;
        });
        var result=service.getCartList(1L);
        assertEquals(1,result.getValidList().size());assertEquals(22L,result.getValidList().get(0).getStudentId());
        assertEquals(1,result.getInvalidList().size());assertEquals("该学员已报名",result.getInvalidList().get(0).getInvalidReason());
    }
}

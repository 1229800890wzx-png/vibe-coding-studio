package cn.iocoder.yudao.module.trade.service.education;

import cn.hutool.core.bean.BeanUtil;
import jakarta.annotation.Resource;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

/** Adds optional education response fields after the original controller has checked ownership. */
@Component
public class TradeEducationResponseEnricher {
    @Resource private ObjectProvider<TradeEducationLifecyclePolicy> policies;
    public <T> T item(Long id,T response){if(response!=null)policies.orderedStream().forEach(p->BeanUtil.fillBeanWithMap(p.itemDetails(id),response,false));return response;}
    public <T> T afterSale(Long id,T response){if(response!=null)policies.orderedStream().forEach(p->BeanUtil.fillBeanWithMap(p.afterSaleDetails(id),response,false));return response;}
}

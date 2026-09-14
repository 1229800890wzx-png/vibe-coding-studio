package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.framework.quartz.core.handler.JobHandler;
import cn.iocoder.yudao.framework.tenant.core.job.TenantJob;
import cn.iocoder.yudao.module.edu.dal.dataobject.EduSeatHoldDO;
import cn.iocoder.yudao.module.edu.dal.mysql.EduSeatHoldMapper;
import cn.iocoder.yudao.module.pay.api.order.PayOrderApi;
import cn.iocoder.yudao.module.pay.enums.order.PayOrderStatusEnum;
import cn.iocoder.yudao.module.pay.service.order.PayOrderService;
import cn.iocoder.yudao.module.trade.dal.mysql.order.TradeOrderItemMapper;
import cn.iocoder.yudao.module.trade.dal.mysql.order.TradeOrderMapper;
import cn.iocoder.yudao.module.trade.enums.order.TradeOrderStatusEnum;
import cn.iocoder.yudao.module.trade.service.order.TradeOrderUpdateServiceImpl;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/** Register in the existing infra Quartz jobs; no parallel scheduler or payment service. */
@Component("eduTradeMaintenanceJob")
@Slf4j
public class EduTradeMaintenanceJob implements JobHandler {
    @Resource private EduSeatHoldMapper holds;
    @Resource private TradeOrderItemMapper items;
    @Resource private TradeOrderMapper orders;
    @Resource private PayOrderApi payOrders;
    @Resource private PayOrderService payService;
    @Resource private ObjectProvider<TradeOrderUpdateServiceImpl> orderService;
    @Resource private EduTradeLifecycleService lifecycle;

    @Override @TenantJob
    public String execute(String param) {
        // Original pay service checks channel state and closes expired original pay orders first.
        payService.expireOrder();
        int expired=0,retried=0;Set<Long> visited=new HashSet<>();
        var rows=holds.selectList(new LambdaQueryWrapper<EduSeatHoldDO>().in(EduSeatHoldDO::getStatus,"ACTIVE","REFUND_PENDING"));
        for(var hold:rows){
            var item=items.selectById(hold.getOrderItemId());if(item==null||!visited.add(item.getOrderId()))continue;
            try{
                var order=orders.selectById(item.getOrderId());if(order==null)continue;
                if("REFUND_PENDING".equals(hold.getStatus())){lifecycle.dispatchLateRefund(order.getId());retried++;continue;}
                if(hold.getExpiresAt()==null||hold.getExpiresAt().isAfter(LocalDateTime.now())||!TradeOrderStatusEnum.isUnpaid(order.getStatus()))continue;
                var pay=order.getPayOrderId()==null?null:payOrders.getOrder(order.getPayOrderId());
                if(pay!=null&&PayOrderStatusEnum.isSuccess(pay.getStatus())){orderService.getObject().updateOrderPaid(order.getId(),pay.getId());continue;}
                if(pay!=null&&!PayOrderStatusEnum.isClosed(pay.getStatus()))continue;
                orderService.getObject().cancelOrderBySystem(order);expired++;
            }catch(Exception e){log.error("Education trade maintenance failed for original order {}",item.getOrderId(),e);}
        }
        return "Expired education orders: "+expired+", retried late-payment refunds: "+retried;
    }
}

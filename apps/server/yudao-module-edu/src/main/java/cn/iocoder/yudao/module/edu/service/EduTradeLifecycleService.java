package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.framework.common.util.json.JsonUtils;
import cn.iocoder.yudao.module.edu.dal.dataobject.*;
import cn.iocoder.yudao.module.edu.dal.mysql.*;
import cn.iocoder.yudao.module.pay.api.refund.PayRefundApi;
import cn.iocoder.yudao.module.pay.api.refund.dto.PayRefundCreateReqDTO;
import cn.iocoder.yudao.module.pay.dal.dataobject.refund.PayRefundDO;
import cn.iocoder.yudao.module.pay.dal.mysql.refund.PayRefundMapper;
import cn.iocoder.yudao.module.pay.dal.mysql.order.PayOrderMapper;
import cn.iocoder.yudao.module.pay.enums.refund.PayRefundStatusEnum;
import cn.iocoder.yudao.module.trade.controller.app.aftersale.vo.AppAfterSaleCreateReqVO;
import cn.iocoder.yudao.module.trade.dal.dataobject.aftersale.AfterSaleDO;
import cn.iocoder.yudao.module.trade.dal.dataobject.order.*;
import cn.iocoder.yudao.module.trade.dal.mysql.order.*;
import cn.iocoder.yudao.module.trade.framework.order.config.TradeOrderProperties;
import cn.iocoder.yudao.module.trade.service.education.TradeEducationLifecyclePolicy;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.time.LocalDateTime;
import java.util.*;
import static cn.iocoder.yudao.module.edu.service.EduRules.*;

/** Education state transitions, called within the existing original trade transaction. */
@Service
@Slf4j
public class EduTradeLifecycleService implements TradeEducationLifecyclePolicy {
    @Resource private EduStudentMapper students;
    @Resource private EduCohortMapper cohorts;
    @Resource private EduCourseMapper courses;
    @Resource private EduEnrollmentMapper enrollments;
    @Resource private EduOrderItemExtMapper extensions;
    @Resource private EduSeatHoldMapper holds;
    @Resource private EduAfterSaleExtMapper afterSales;
    @Resource private EduEnrollmentService registration;
    @Resource private EduProductService products;
    @Resource private TradeOrderMapper orders;
    @Resource private TradeOrderItemMapper items;
    @Resource private PayRefundApi refunds;
    @Resource private PayRefundMapper refundMapper;
    @Resource private PayOrderMapper payOrderMapper;
    @Resource private EduTrialBookingMapper trials;
    @Resource private EduNotifyService notices;
    @Resource private cn.iocoder.yudao.module.trade.dal.mysql.aftersale.AfterSaleMapper originalAfterSales;
    @Resource private TradeOrderProperties properties;
    @Resource private ObjectProvider<EduTradeLifecycleService> self;

    private EduCohortDO bySku(Long skuId){return cohorts.selectOne(EduCohortDO::getSkuId,skuId);}
    public boolean isEducationItem(Long orderItemId){return extensions.selectOne(EduOrderItemExtDO::getOrderItemId,orderItemId)!=null;}
    @Override public Map<String,Object> itemDetails(Long orderItemId){
        var e=enrollments.selectOne(EduEnrollmentDO::getOrderItemId,orderItemId);if(e==null)return Map.of();
        var item=items.selectById(orderItemId);if(item==null)return Map.of();
        var history=originalAfterSales.selectList(AfterSaleDO::getOrderItemId,orderItemId);
        long completed=history.stream().filter(a->Objects.equals(a.getStatus(),50)).mapToLong(AfterSaleDO::getRefundPrice).sum();
        Map<String,Object> v=new LinkedHashMap<>();v.put("refundableRemaining",Math.max(0L,(long)item.getPayPrice()-completed));v.put("refundInFlight",history.stream().anyMatch(a->cn.iocoder.yudao.module.trade.enums.aftersale.AfterSaleStatusEnum.APPLYING_STATUSES.contains(a.getStatus())));v.put("enrollmentStatus",e.getStatus());
        var s=students.selectById(e.getStudentId());var c=cohorts.selectById(e.getCurrentCohortId());v.put("studentName",s==null?"":s.getName());v.put("currentCohortName",c==null?"":c.getName());
        var action=item.getAfterSaleId()==null?null:afterSales.selectOne(EduAfterSaleExtDO::getAfterSaleId,item.getAfterSaleId());v.put("entitlementAction",action==null?null:action.getEntitlementAction());return v;
    }
    @Override public Map<String,Object> afterSaleDetails(Long afterSaleId){var ext=afterSales.selectOne(EduAfterSaleExtDO::getAfterSaleId,afterSaleId);if(ext==null)return Map.of();var e=enrollments.selectById(ext.getEnrollmentId());if(e==null)return Map.of();var v=new LinkedHashMap<>(itemDetails(e.getOrderItemId()));v.put("entitlementAction",ext.getEntitlementAction());return v;}
    private List<TradeOrderItemDO> educational(List<TradeOrderItemDO> source){return source.stream().filter(i->bySku(i.getSkuId())!=null).toList();}
    public void beforeCreate(TradeOrderDO order,List<TradeOrderItemDO> source) {
        List<TradeOrderItemDO> list=educational(source);if(list.isEmpty())return;
        require(list.size()==source.size()&&Objects.equals(order.getDeliveryType(),3),"课程与实物商品需要分别下单");
        require(list.stream().allMatch(i->i.getStudentId()!=null&&Objects.equals(i.getCount(),1)),"每个课程名额必须指定一位孩子且数量为1");
        Map<Long,EduStudentDO> lockedStudents=new HashMap<>();for(Long id:list.stream().map(TradeOrderItemDO::getStudentId).distinct().sorted().toList())lockedStudents.put(id,found(students.selectOneForUpdate(EduStudentDO::getId,id),"孩子不存在"));
        Map<Long,EduCohortDO> lockedCohorts=new HashMap<>();for(Long id:list.stream().map(i->bySku(i.getSkuId()).getId()).distinct().sorted().toList()){var c=found(cohorts.selectOneForUpdate(EduCohortDO::getId,id),"班期不存在");lockedCohorts.put(c.getSkuId(),c);}
        Set<String> unique=new HashSet<>();
        for(TradeOrderItemDO i:list){EduStudentDO s=lockedStudents.get(i.getStudentId());require(Objects.equals(s.getGuardianMemberId(),order.getUserId()),"无权为该孩子报名");EduCohortDO c=found(lockedCohorts.get(i.getSkuId()),"班期已变更，请刷新报价");require(unique.add(s.getId()+":"+c.getId()),"同一孩子不能重复选择同一班期");registration.validateEntry(s,c);}
        // Two different courses in this same basket must also not overlap for one child.
        for(int a=0;a<list.size();a++)for(int b=a+1;b<list.size();b++)if(Objects.equals(list.get(a).getStudentId(),list.get(b).getStudentId())) {
            var ca=lockedCohorts.get(list.get(a).getSkuId());var cb=lockedCohorts.get(list.get(b).getSkuId());
            // The precise cross-basket session overlap is checked by the catalog below.
            require(!sameStudentCohortsOverlap(ca.getId(),cb.getId()),"同一孩子在选课袋中的班期时间冲突");
        }
    }
    @Resource private EduSessionMapper sessions;
    private boolean sameStudentCohortsOverlap(Long a,Long b){for(var x:currentSessions(a))for(var y:currentSessions(b))if(overlaps(x.getStartTime(),x.getEndTime(),y.getStartTime(),y.getEndTime()))return true;return false;}
    private List<EduSessionDO> currentSessions(Long cohortId){return sessions.selectList(new LambdaQueryWrapper<EduSessionDO>().eq(EduSessionDO::getCohortId,cohortId).last("FOR UPDATE"));}
    public void afterCreate(TradeOrderDO order,List<TradeOrderItemDO> source) {
        for(TradeOrderItemDO item:educational(source)) {
            if(isEducationItem(item.getId()))continue;
            EduCohortDO c=found(cohorts.selectOneForUpdate(EduCohortDO::getId,bySku(item.getSkuId()).getId()),"班期不存在");EduCourseDO course=found(courses.selectById(c.getCourseId()),"课程不存在");
            Map<String,Object> snapshot=new LinkedHashMap<>();snapshot.put("courseId",course.getId());snapshot.put("courseName",course.getName());snapshot.put("courseVersionId",c.getCourseVersionId());snapshot.put("cohortId",c.getId());snapshot.put("cohortName",c.getName());snapshot.put("mode",c.getMode());snapshot.put("terms",c.getTerms());snapshot.put("refundPolicy",c.getRefundPolicy());snapshot.put("price",item.getPrice());snapshot.put("paidPrice",item.getPayPrice());snapshot.put("skuId",item.getSkuId());
            snapshot.put("studentName",found(students.selectOneForUpdate(EduStudentDO::getId,item.getStudentId()),"孩子不存在").getName());
            snapshot.put("termsVersion",c.getCourseVersionId());
            snapshot.put("sessions",currentSessions(c.getId()).stream().map(s->{Map<String,Object> v=new LinkedHashMap<>();v.put("id",s.getId());v.put("title",s.getTitle());v.put("startTime",s.getStartTime());v.put("endTime",s.getEndTime());v.put("version",s.getVersion());return v;}).toList());
            extensions.insert(new EduOrderItemExtDO().setOrderItemId(item.getId()).setStudentId(item.getStudentId()).setPurchasedCohortId(c.getId()).setSnapshotJson(JsonUtils.toJsonString(snapshot)));
            EduEnrollmentDO enrollment=new EduEnrollmentDO().setStudentId(item.getStudentId()).setCurrentCohortId(c.getId()).setOrderItemId(item.getId()).setSource("ORDER").setStatus("PENDING_PAYMENT").setVersion(1);enrollments.insert(enrollment);
            holds.insert(new EduSeatHoldDO().setOrderItemId(item.getId()).setEnrollmentId(enrollment.getId()).setCohortId(c.getId()).setStatus("ACTIVE").setExpiresAt(LocalDateTime.now().plusMinutes(15)));
        }
    }
    public void afterPaid(TradeOrderDO order,List<TradeOrderItemDO> source) {
        for(TradeOrderItemDO i:source){EduEnrollmentDO e=enrollments.selectOneForUpdate(EduEnrollmentDO::getOrderItemId,i.getId());if(e==null)continue;confirmPaidTrial(e);if("ACTIVE".equals(e.getStatus()))continue;require("PENDING_PAYMENT".equals(e.getStatus()),"报名状态已变更，付款需要补偿处理");e.setStatus("ACTIVE").setVersion(e.getVersion()+1);enrollments.updateById(e);setHold(i.getId(),"CONSUMED");notices.guardian(e.getStudentId(),"课程报名成功","付款已确认，课程日历与学习资料可在学习页查看。");}
    }
    private void confirmPaidTrial(EduEnrollmentDO e){var c=cohorts.selectById(e.getCurrentCohortId());if(c!=null&&"TRIAL".equals(c.getKind())&&trials.selectOne(EduTrialBookingDO::getOrderItemId,e.getOrderItemId())==null){var t=new EduTrialBookingDO().setStudentId(e.getStudentId()).setCohortId(c.getId()).setOrderItemId(e.getOrderItemId()).setStatus("CONFIRMED");trials.insert(t);/* ORDER keeps orderItemId as its sole source key; trialBookingId belongs exclusively to FREE_TRIAL. */}}
    public void afterCancelled(TradeOrderDO order,List<TradeOrderItemDO> source) {
        // Refund actions govern paid education entitlements, including full monetary refund with KEEP.
        if(Boolean.TRUE.equals(order.getPayStatus()))return;
        for(TradeOrderItemDO i:source){EduEnrollmentDO e=enrollments.selectOneForUpdate(EduEnrollmentDO::getOrderItemId,i.getId());if(e==null||!"PENDING_PAYMENT".equals(e.getStatus()))continue;e.setStatus("EXPIRED").setVersion(e.getVersion()+1);enrollments.updateById(e);setHold(i.getId(),"RELEASED");notices.guardian(e.getStudentId(),"待付款报名已取消","课程名额已释放。如仍需报名，请重新选择开放的班期。");}
    }
    private void setHold(Long itemId,String state){EduSeatHoldDO h=holds.selectOneForUpdate(EduSeatHoldDO::getOrderItemId,itemId);if(h!=null){h.setStatus(state);holds.updateById(h);}}
    @Override public void beforeAfterSaleCreate(Long memberId,TradeOrderItemDO item,AppAfterSaleCreateReqVO request) {
        if(!isEducationItem(item.getId()))return;
        EduEnrollmentDO e=found(enrollments.selectOneForUpdate(EduEnrollmentDO::getOrderItemId,item.getId()),"报名记录不存在");
        EduStudentDO s=found(students.selectById(e.getStudentId()),"孩子不存在");require(Objects.equals(s.getGuardianMemberId(),memberId),"无权操作该报名退款");
        require(Set.of("ACTIVE","COMPLETED","CANCELLED").contains(e.getStatus()),"当前报名资格不能再申请退款");
        require(!"CANCELLED".equals(e.getStatus()) || "CANCEL".equals(request.getEntitlementAction()),"已取消的学习资格不能改为保留");
        require(Objects.equals(request.getWay(),10),"课程服务仅支持退款");
        require(Set.of("KEEP","CANCEL").contains(request.getEntitlementAction()),"请选择保留或取消学习资格");
    }
    @Override public void afterAfterSaleCreate(AfterSaleDO afterSale,String action) {
        EduEnrollmentDO e=enrollments.selectOneForUpdate(EduEnrollmentDO::getOrderItemId,afterSale.getOrderItemId());if(e==null)return;
        afterSales.insert(new EduAfterSaleExtDO().setAfterSaleId(afterSale.getId()).setEnrollmentId(e.getId()).setEntitlementAction(action).setEnrollmentVersion(e.getVersion()).setStockReleased(false));
    }
    @Override public boolean afterRefundSuccess(AfterSaleDO a) {
        EduAfterSaleExtDO ext=afterSales.selectOne(EduAfterSaleExtDO::getAfterSaleId,a.getId());if(ext==null)return false;
        EduEnrollmentDO e=found(enrollments.selectOneForUpdate(EduEnrollmentDO::getId,ext.getEnrollmentId()),"报名记录不存在");
        if("KEEP".equals(ext.getEntitlementAction())){notices.guardian(e.getStudentId(),"课程退款已完成","本次退款保留学习资格，原课程安排继续有效。");return true;}
        if(!Boolean.TRUE.equals(ext.getStockReleased())){
            require(Objects.equals(ext.getEnrollmentVersion(),e.getVersion()),"退款期间报名状态已变更，请人工核验");
            EduCohortDO c=found(cohorts.selectOneForUpdate(EduCohortDO::getId,e.getCurrentCohortId()),"当前班期不存在");
            if(Set.of("ACTIVE","COMPLETED").contains(e.getStatus())){products.stock(c.getSkuId(),1);e.setStatus("CANCELLED").setVersion(e.getVersion()+1);enrollments.updateById(e);}
            ext.setStockReleased(true);afterSales.updateById(ext);
            var trial=trials.selectOne(EduTrialBookingDO::getOrderItemId,e.getOrderItemId());if(trial!=null){trial.setStatus("CANCELLED");trials.updateById(trial);}
            notices.guardian(e.getStudentId(),"课程退款已完成","本次退款取消学习资格，当前班期名额已释放。");
        }
        return false;
    }
    @Override public boolean keepsEntitlement(Long afterSaleId){if(afterSaleId==null)return false;EduAfterSaleExtDO ext=afterSales.selectOne(EduAfterSaleExtDO::getAfterSaleId,afterSaleId);return ext!=null&&"KEEP".equals(ext.getEntitlementAction());}
    @Override public boolean shouldRunItemCancellationHooks(Long afterSaleId) {
        if(afterSaleId==null)return true;var ext=afterSales.selectOne(EduAfterSaleExtDO::getAfterSaleId,afterSaleId);if(ext==null)return true;
        if("KEEP".equals(ext.getEntitlementAction()))return false;
        return afterSales.selectList(EduAfterSaleExtDO::getEnrollmentId,ext.getEnrollmentId()).stream().noneMatch(prior->!Objects.equals(prior.getId(),ext.getId())&&Boolean.TRUE.equals(prior.getStockReleased()));
    }
    @Override public boolean tryFulfillLatePayment(TradeOrderDO order,List<TradeOrderItemDO> source) {
        // Cancellation already returned consumed coupons/points; those orders cannot be safely reactivated as-is.
        if((order.getCouponId()!=null&&order.getCouponId()>0)||(order.getUsePoint()!=null&&order.getUsePoint()>0)||(order.getType()!=null&&order.getType()!=0))return false;
        List<TradeOrderItemDO> list=educational(source);if(list.isEmpty())return false;
        Map<Long,EduStudentDO> lockedStudents=new HashMap<>();for(Long id:list.stream().map(TradeOrderItemDO::getStudentId).distinct().sorted().toList())lockedStudents.put(id,students.selectOneForUpdate(EduStudentDO::getId,id));
        List<EduEnrollmentDO> records=new ArrayList<>();for(var i:list){var e=enrollments.selectOneForUpdate(EduEnrollmentDO::getOrderItemId,i.getId());if(e==null||!"EXPIRED".equals(e.getStatus()))return false;records.add(e);}
        Map<Long,EduCohortDO> lockedCohorts=new HashMap<>();for(Long id:records.stream().map(EduEnrollmentDO::getCurrentCohortId).distinct().sorted().toList())lockedCohorts.put(id,cohorts.selectOneForUpdate(EduCohortDO::getId,id));
        for(int a=0;a<records.size();a++)for(int b=a+1;b<records.size();b++)if(Objects.equals(records.get(a).getStudentId(),records.get(b).getStudentId())&&sameStudentCohortsOverlap(records.get(a).getCurrentCohortId(),records.get(b).getCurrentCohortId()))return false;
        Map<Long,Integer> quantities=new HashMap<>();
        try{for(var e:records){var c=found(lockedCohorts.get(e.getCurrentCohortId()),"班期不存在");registration.validateEntry(found(lockedStudents.get(e.getStudentId()),"孩子不存在"),c);quantities.merge(c.getSkuId(),1,Integer::sum);}}catch(cn.iocoder.yudao.framework.common.exception.ServiceException unavailable){return false;}
        for(var q:quantities.entrySet()){var sku=products.sku(q.getKey());if(sku==null||sku.getStock()<q.getValue())return false;}
        for(var q:quantities.entrySet())products.stock(q.getKey(),-q.getValue());
        for(var e:records){e.setStatus("ACTIVE").setVersion(e.getVersion()+1);enrollments.updateById(e);setHold(e.getOrderItemId(),"CONSUMED");confirmPaidTrial(e);notices.guardian(e.getStudentId(),"课程报名已恢复","延迟到账的付款已确认，班期名额已恢复，请查看课程日历。");}
        return true;
    }
    @Override public void markLateRefundPending(TradeOrderDO order,List<TradeOrderItemDO> source) {
        for(var i:source)if(isEducationItem(i.getId()))setHold(i.getId(),"REFUND_PENDING");
        // Durable intent is committed before external refund dispatch; the maintenance job retries it.
        if(TransactionSynchronizationManager.isSynchronizationActive())TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization(){@Override public void afterCommit(){try{self.getObject().dispatchLateRefund(order.getId());}catch(Exception ex){log.error("Late-payment refund pending for original order {}",order.getId(),ex);}}});
    }
    @Transactional(propagation=Propagation.REQUIRES_NEW,rollbackFor=Exception.class)
    public void dispatchLateRefund(Long orderId){
        TradeOrderDO order=found(orders.selectOneForUpdate(TradeOrderDO::getId,orderId),"订单不存在");
        List<TradeOrderItemDO> source=items.selectListByOrderId(orderId);if(source.stream().noneMatch(i->{var h=holds.selectOne(EduSeatHoldDO::getOrderItemId,i.getId());return h!=null&&"REFUND_PENDING".equals(h.getStatus());}))return;
        var originalPay=found(payOrderMapper.selectById(order.getPayOrderId()),"原支付单不存在");
        PayRefundDO existing=refundMapper.selectByAppIdAndMerchantRefundId(originalPay.getAppId(),"order-"+orderId);
        if(existing==null)refunds.createRefund(new PayRefundCreateReqDTO().setAppKey(properties.getPayAppKey()).setUserIp("127.0.0.1").setUserId(order.getUserId()).setUserType(1).setMerchantOrderId(String.valueOf(orderId)).setMerchantRefundId("order-"+orderId).setReason("课程名额已释放，无法恢复报名，退回迟到付款").setPrice(order.getPayPrice()));
        else if(PayRefundStatusEnum.isFailure(existing.getStatus())){for(var i:source){var h=holds.selectOne(EduSeatHoldDO::getOrderItemId,i.getId());if(h!=null&&"REFUND_PENDING".equals(h.getStatus())){setHold(i.getId(),"REFUND_FAILED");notices.guardian(i.getStudentId(),"课程退款需要人工处理","迟到付款退款被支付渠道拒绝，机构将根据原订单核实处理。订单号："+order.getNo());}}log.error("Original late-payment refund {} definitively failed; manual channel resolution required for order {}",existing.getId(),orderId);}
        // Keep REFUND_PENDING until the original refund callback confirms success.
    }
    @Override public void afterLateRefundConfirmed(TradeOrderDO order){for(var i:items.selectListByOrderId(order.getId()))if(isEducationItem(i.getId())){var h=holds.selectOne(EduSeatHoldDO::getOrderItemId,i.getId());if(h!=null&&!"REFUNDED".equals(h.getStatus())){setHold(i.getId(),"REFUNDED");notices.guardian(i.getStudentId(),"迟到付款已退回","班期名额无法恢复，本次付款已按原支付渠道退款。");}}}
}

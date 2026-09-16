package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.module.edu.dal.dataobject.*;
import cn.iocoder.yudao.module.edu.dal.mysql.*;
import cn.iocoder.yudao.module.trade.service.education.TradeEducationPolicy;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.Objects;
import static cn.iocoder.yudao.module.edu.service.EduRules.*;

/** Business validation plugged into the original cart/quotation pipeline. */
@Component
public class EduPurchasePolicy implements TradeEducationPolicy {
    @Resource private EduCohortMapper cohorts;
    @Resource private EduStudentMapper students;
    @Resource private EduEnrollmentService enrollment;
    @Override public boolean isEducationSku(Long skuId){return cohorts.selectCount(EduCohortDO::getSkuId,skuId)>0;}
    @Override @Transactional(rollbackFor=Exception.class)
    public void validatePurchase(Long memberId,Long skuId,Long studentId,Integer count){
        require(Objects.equals(count,1),"每个孩子每个班期只能购买一个名额");require(studentId!=null,"请选择本课程的孩子");
        EduStudentDO s=found(students.selectOneForUpdate(EduStudentDO::getId,studentId),"孩子档案不存在");require(Objects.equals(s.getGuardianMemberId(),memberId),"无权为该孩子报名");
        EduCohortDO c=found(cohorts.selectOneForUpdate(EduCohortDO::getSkuId,skuId),"课程班期不存在");enrollment.validateEntry(s,c);
    }
}

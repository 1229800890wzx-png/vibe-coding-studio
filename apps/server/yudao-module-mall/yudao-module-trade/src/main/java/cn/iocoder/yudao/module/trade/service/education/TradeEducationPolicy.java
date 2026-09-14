package cn.iocoder.yudao.module.trade.service.education;

/** Optional domain policy implemented by education; the trade module never depends on education. */
public interface TradeEducationPolicy {
    boolean isEducationSku(Long skuId);

    /** Check guardian ownership, published/open cohort, learner eligibility and duplicate enrollment. */
    void validatePurchase(Long memberId, Long skuId, Long studentId, Integer count);
}

-- Production baseline; generated from reviewed public sources. No development fixtures.
-- Public-service evidence: TradeOrderUpdateServiceImpl.refundOrderItem adds refund_point.
-- Safe local upgrade from an earlier generated schema; fresh schemas already have this default.
UPDATE trade_order SET refund_point = 0 WHERE refund_point IS NULL;
ALTER TABLE trade_order MODIFY COLUMN refund_point int NOT NULL DEFAULT 0;

-- Public-service evidence: CouponTemplateMapper.updateTakeCount compares and increments take_count.
-- CouponTemplateServiceImpl.createCouponTemplate omits both original template counters.
-- Actual first admin grant against a NULL initial take_count failed with 1013004002.
-- Preserve existing counters; recover only NULLs from original coupon records within each tenant.
UPDATE promotion_coupon_template t
LEFT JOIN (
  SELECT template_id, tenant_id, COUNT(*) AS actual_take_count,
         SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) AS actual_use_count
  FROM promotion_coupon
  WHERE deleted = b'0'
  GROUP BY template_id, tenant_id
) c ON c.template_id = t.id AND c.tenant_id = t.tenant_id
SET t.take_count = COALESCE(t.take_count, c.actual_take_count, 0),
    t.use_count = COALESCE(t.use_count, c.actual_use_count, 0)
WHERE t.take_count IS NULL OR t.use_count IS NULL;
ALTER TABLE promotion_coupon_template
  MODIFY COLUMN take_count int NOT NULL DEFAULT 0,
  MODIFY COLUMN use_count int NOT NULL DEFAULT 0;

-- Original CrmClueService creates without boolean fields, then queries false/unboxes transformStatus.
UPDATE crm_clue SET follow_up_status = b'0' WHERE follow_up_status IS NULL;
UPDATE crm_clue SET transform_status = b'0' WHERE transform_status IS NULL;
ALTER TABLE crm_clue
  MODIFY COLUMN follow_up_status bit NOT NULL DEFAULT b'0',
  MODIFY COLUMN transform_status bit NOT NULL DEFAULT b'0';


-- Extend original upstream trade tables. No replacement cart/order/payment tables.
-- Apply once after the upstream MySQL schema, before starting education-aware trade code.
ALTER TABLE trade_cart ADD COLUMN student_id BIGINT NULL COMMENT '教育课程报名学员编号；普通商品为空' AFTER sku_id;
ALTER TABLE trade_order_item ADD COLUMN student_id BIGINT NULL COMMENT '教育课程报名学员编号；普通商品为空' AFTER sku_id;
CREATE INDEX idx_trade_cart_learner ON trade_cart(user_id, sku_id, student_id, deleted);
CREATE INDEX idx_trade_order_item_learner ON trade_order_item(student_id, sku_id, order_id);

INSERT INTO system_dict_data(sort, label, value, dict_type, status, color_type, css_class, remark, creator, updater)
SELECT 3, '教学服务', '3', 'trade_delivery_type', 0, 'primary', '', '课程按教学权益交付，无物流', 'vibe-migration', 'vibe-migration'
WHERE NOT EXISTS (SELECT 1 FROM system_dict_data WHERE dict_type='trade_delivery_type' AND value='3' AND deleted=0);

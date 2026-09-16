-- Local single-brand deployment. Preserve original menu/tenant records and RBAC models.
-- Disabled modules remain in source, but their navigation is hidden from this runtime.
UPDATE system_menu SET visible=b'0', updater='vibe-local-baseline'
WHERE parent_id=0 AND deleted=b'0'
  AND path NOT IN ('/system','/infra','/member','/pay','/mall','/product','/trade','/promotion','/statistics','/edu');
UPDATE system_tenant SET status=1, updater='vibe-local-baseline'
WHERE id<>1 AND deleted=b'0';
UPDATE system_tenant SET name='VIBE CODING',status=0,expire_time='2099-12-31 23:59:59',updater='vibe-local-baseline'
WHERE id=1 AND deleted=b'0';

-- Original delivery dictionary extended by the education service delivery type.
-- These public baseline demo entries have no source component in the pinned admin repository.
UPDATE system_menu SET visible=b'0', status=1, updater='vibe-local-baseline'
WHERE id IN (83,349) AND component IN ('infra/testDemo/index','pay/demo/index');

INSERT INTO system_dict_data(sort,label,value,dict_type,status,color_type,css_class,remark,creator,updater)
SELECT 3,'教学服务','3','trade_delivery_type',0,'primary','','课程按教学权益交付，无物流','vibe-migration','vibe-migration'
WHERE NOT EXISTS (SELECT 1 FROM system_dict_data WHERE dict_type='trade_delivery_type' AND value='3' AND deleted=b'0');

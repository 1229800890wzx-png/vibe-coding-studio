-- Production baseline; generated from reviewed public sources. No development fixtures.
-- Original identity/configuration models only. Values are supplied from private environment variables.
INSERT INTO system_tenant(id,name,contact_user_id,contact_name,contact_mobile,status,websites,package_id,expire_time,account_count) VALUES(1,'VIBE CODING',1,'机构负责人',NULL,0,'[]',0,'2099-12-31 23:59:59',1000);
INSERT INTO system_dept(id,name,parent_id,sort,status,tenant_id) VALUES(1,'VIBE CODING',0,0,0,1);
INSERT INTO system_users(id,username,password,nickname,dept_id,post_ids,status,tenant_id) VALUES(1,'${bootstrapAdminUsername}','${bootstrapAdminPasswordHash}','机构管理员',1,'[]',0,1);
INSERT INTO system_role(id,name,code,sort,data_scope,data_scope_dept_ids,status,type,tenant_id) VALUES(1,'机构超级管理员','super_admin',0,1,'[]',0,1,1);
INSERT INTO system_user_role(user_id,role_id,tenant_id) VALUES(1,1,1);
INSERT INTO system_oauth2_client(id,client_id,secret,name,logo,status,access_token_validity_seconds,refresh_token_validity_seconds,redirect_uris,authorized_grant_types,scopes,auto_approve_scopes) VALUES(1,'default','${bootstrapOAuthSecret}','VIBE CODING','',0,1800,2592000,'${adminRedirectUris}','["password","refresh_token","authorization_code"]','[]','[]');
INSERT INTO member_config(id,point_trade_deduct_enable,point_trade_deduct_unit_price,point_trade_deduct_max_price,point_trade_give_point,tenant_id) VALUES(1,b'0',1,0,0,1);
INSERT INTO trade_config(id,after_sale_refund_reasons,after_sale_return_reasons,delivery_express_free_enabled,delivery_express_free_price,delivery_pick_up_enabled,brokerage_enabled,brokerage_enabled_condition,brokerage_bind_mode,brokerage_poster_urls,brokerage_first_percent,brokerage_second_percent,brokerage_withdraw_min_price,brokerage_withdraw_fee_percent,brokerage_frozen_days,brokerage_withdraw_types,tenant_id) VALUES(1,'["课程服务退款"]','[]',b'0',0,b'0',b'0',1,1,'[]',0,0,0,0,0,'[]',1);
-- Keep retained upstream source/navigation records hidden outside the deployed domains.
UPDATE system_menu SET visible=b'0',status=1 WHERE parent_id=0 AND path NOT IN('/system','/infra','/member','/pay','/mall','/product','/trade','/promotion','/statistics','/edu');
UPDATE system_menu SET visible=b'0',status=1 WHERE component IN('infra/testDemo/index','pay/demo/index');
INSERT INTO system_dict_data(sort,label,value,dict_type,status,color_type,css_class,remark) SELECT 3,'教学服务','3','trade_delivery_type',0,'primary','','原订单教学权益交付' WHERE NOT EXISTS(SELECT 1 FROM system_dict_data WHERE dict_type='trade_delivery_type' AND value='3' AND deleted=b'0');

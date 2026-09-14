-- Website functions join existing employee identities and role scopes.
INSERT INTO system_menu (id,name,permission,type,sort,parent_id,path,icon,component,component_name,status,visible,keep_alive,always_show) VALUES
 (90700,'官网管理','edu:website:query',2,20,90000,'website','ep:monitor','edu/website/index','EduWebsite',0,b'1',b'1',b'1'),
 (90701,'官网内容新增','edu:website:create',3,1,90700,'','','','',0,b'1',b'0',b'0'),
 (90702,'官网内容编辑','edu:website:update',3,2,90700,'','','','',0,b'1',b'0',b'0'),
 (90703,'官网内容发布','edu:website:publish',3,3,90700,'','','','',0,b'1',b'0',b'0')
 ON DUPLICATE KEY UPDATE name=VALUES(name),permission=VALUES(permission),component=VALUES(component),component_name=VALUES(component_name);
INSERT INTO system_role_menu(role_id,menu_id,tenant_id)
 SELECT r.id,m.id,1 FROM system_role r JOIN system_menu m ON m.id BETWEEN 90700 AND 90703
 WHERE r.id=91001 AND r.tenant_id=1 AND r.deleted=b'0'
 AND NOT EXISTS(SELECT 1 FROM system_role_menu rm WHERE rm.role_id=r.id AND rm.menu_id=m.id AND rm.tenant_id=1 AND rm.deleted=b'0');
INSERT INTO system_role_menu(role_id,menu_id,tenant_id)
 SELECT r.id,90700,1 FROM system_role r WHERE r.id=91004 AND r.tenant_id=1 AND r.deleted=b'0'
 AND NOT EXISTS(SELECT 1 FROM system_role_menu rm WHERE rm.role_id=r.id AND rm.menu_id=90700 AND rm.tenant_id=1 AND rm.deleted=b'0');

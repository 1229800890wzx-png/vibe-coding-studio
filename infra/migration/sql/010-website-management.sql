CREATE TABLE IF NOT EXISTS edu_website_offering (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 slug VARCHAR(80) NOT NULL,
 title VARCHAR(80) NOT NULL,
 description VARCHAR(600) NOT NULL,
 outline VARCHAR(2000) NOT NULL,
 stage INT NOT NULL,
 image VARCHAR(32) NOT NULL,
 sort_order INT NOT NULL DEFAULT 0,
 published BIT(1) NOT NULL DEFAULT b'0',
 course_id BIGINT NULL,
 revision INT NOT NULL DEFAULT 1,
 tenant_id BIGINT NOT NULL DEFAULT 1,
 creator VARCHAR(64) NULL DEFAULT '', updater VARCHAR(64) NULL DEFAULT '',
 create_time DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 update_time DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
 deleted BIT(1) NOT NULL DEFAULT b'0',
 UNIQUE KEY uk_website_offering_slug (tenant_id, slug),
 KEY ix_website_offering_public (tenant_id, published, sort_order, slug),
 KEY ix_website_offering_course (tenant_id, course_id),
 CHECK (stage BETWEEN 1 AND 3), CHECK (sort_order BETWEEN 0 AND 999),
 CHECK (image IN ('minecraft','museum','notes')), CHECK (revision >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
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

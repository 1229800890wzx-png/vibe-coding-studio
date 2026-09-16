/** Admissions navigation reuses original CRM permissions, owners and follow-up records. */
export function appendAdmissionMenus(sql) {
  const entries = [
    [90500, '招生咨询', 'crm:clue:query', 2, 20, 90000, 'admission', 'edu/admission/index', 'EduAdmission'],
    [90520, 'CRM 线索', 'crm:clue:query', 2, 21, 90000, 'admission-clues', 'crm/clue/index', 'CrmClue'],
    [90521, '线索新增', 'crm:clue:create', 3, 1, 90520, '', '', ''],
    [90522, '线索修改与转交', 'crm:clue:update', 3, 2, 90520, '', '', ''],
    [90523, '线索删除', 'crm:clue:delete', 3, 3, 90520, '', '', ''],
    [90524, '线索导出', 'crm:clue:export', 3, 4, 90520, '', '', '']
  ];
  for (const [id, name, permission, type, sort, parent, path, component, componentName] of entries) {
    sql.push(`INSERT INTO system_menu(id,name,permission,type,sort,parent_id,path,icon,component,component_name,status,visible,keep_alive,always_show) VALUES (${id},'${name}','${permission}',${type},${sort},${parent},'${path}','ep:chat-dot-round','${component}','${componentName}',0,b'${type === 2 ? 1 : 0}',b'1',b'1') ON DUPLICATE KEY UPDATE name=VALUES(name),permission=VALUES(permission),component=VALUES(component),component_name=VALUES(component_name);`);
    sql.push(`INSERT INTO system_role_menu(role_id,menu_id,tenant_id) SELECT 91004,${id},1 WHERE NOT EXISTS(SELECT 1 FROM system_role_menu WHERE role_id=91004 AND menu_id=${id} AND tenant_id=1 AND deleted=b'0');`);
  }
  sql.push("INSERT INTO system_dict_data(dict_type,label,value,sort,status,color_type,css_class,remark) SELECT 'crm_customer_source','课程咨询','90',90,0,'','','家长明确同意联系后，通过原 CRM 线索受理' WHERE NOT EXISTS(SELECT 1 FROM system_dict_data WHERE dict_type='crm_customer_source' AND value='90' AND deleted=b'0');");
}

import fs from 'node:fs';
import path from 'node:path';

/** Additive local upgrade; production uses appended Liquibase changesets 009/010. */
export async function applyWebsiteSchema(db, root) {
  for (const [column, definition] of [
    ['education_origin', 'VARCHAR(16) NULL'], ['education_website_status', 'VARCHAR(16) NULL'],
    ['education_operator_note', 'VARCHAR(2000) NULL'], ['education_experience', 'VARCHAR(200) NULL'],
    ['education_interest', 'VARCHAR(200) NULL'], ['education_message', 'VARCHAR(2000) NULL'],
  ]) {
    const [[{ count }]] = await db.execute('SELECT COUNT(*) count FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=? AND column_name=?', ['crm_clue', column]);
    if (!count) await db.query(`ALTER TABLE crm_clue ADD COLUMN \`${column}\` ${definition}`);
  }
  const [[{ count }]] = await db.query("SELECT COUNT(*) count FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='crm_clue' AND index_name='ix_crm_education_origin'");
  if (!count) await db.query('ALTER TABLE crm_clue ADD INDEX ix_crm_education_origin (tenant_id,education_origin,id)');
  await db.query("UPDATE crm_clue SET education_origin='MINIAPP' WHERE education_origin IS NULL AND education_member_id IS NOT NULL");
  for (const filename of ['website-admission.sql', 'website-offering.sql', 'website-menus.sql']) {
    await db.query(fs.readFileSync(path.join(root, 'infra/sql', filename), 'utf8'));
  }
}

/** Preserve the approved site configuration; never overwrite an operator's existing content. */
export async function seedWebsiteContent(db, root, tenantId = 1) {
  if (!Number.isSafeInteger(tenantId) || tenantId < 1) throw new Error('Invalid website tenant');
  const rows = JSON.parse(fs.readFileSync(path.join(root, 'infra/website-content.json'), 'utf8'));
  for (const row of rows) {
    await db.execute(`INSERT INTO edu_website_offering
      (tenant_id,slug,title,description,outline,stage,image,sort_order,published,revision)
      SELECT ?,?,?,?,?,?,?,?,?,1 WHERE NOT EXISTS (SELECT 1 FROM edu_website_offering WHERE tenant_id=? AND slug=?)`,
      [tenantId,row.slug,row.title,row.description,row.outline,row.stage,row.image,row.sortOrder,row.published,tenantId,row.slug]);
  }
}

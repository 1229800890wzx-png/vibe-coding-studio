// Keep a parent's published class selection consistent across list and detail.
export function normalizeCohortContext(raw = {}) {
  const context = {};
  if (['TRIAL', 'REGULAR'].includes(raw.kind)) context.kind = raw.kind;
  if (['ONLINE', 'OFFLINE'].includes(raw.mode)) context.mode = raw.mode;
  if (context.mode !== 'ONLINE' && /^[1-9]\d*$/.test(String(raw.campusId || '')))
    context.campusId = String(raw.campusId);
  for (const key of ['startFrom', 'startTo']) {
    const value = String(raw[key] || '');
    if (
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(Date.parse(value + 'T00:00:00Z')) &&
      new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value
    )
      context[key] = value;
  }
  return context;
}

export function filterCohorts(rows, raw = {}) {
  const c = normalizeCohortContext(raw);
  const from = c.startFrom ? Date.parse(c.startFrom + 'T00:00:00+08:00') : null;
  const until = c.startTo ? Date.parse(c.startTo + 'T00:00:00+08:00') + 86400000 : null;
  return rows
    .filter((row) => {
      const start = typeof row.startDate === 'number' ? row.startDate : Date.parse(row.startDate);
      return (
        (!c.kind || row.kind === c.kind) &&
        (!c.mode || row.mode === c.mode) &&
        (!c.campusId || String(row.campusId) === c.campusId) &&
        (from === null || start >= from) &&
        (until === null || start < until)
      );
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

export function cohortContextLabels(raw, campuses = []) {
  const c = normalizeCohortContext(raw),
    labels = [];
  if (c.kind) labels.push(c.kind === 'TRIAL' ? '体验课' : '正式班');
  if (c.mode) labels.push(c.mode === 'ONLINE' ? '全国线上' : '线下校区');
  if (c.campusId)
    labels.push(campuses.find((x) => String(x.id) === c.campusId)?.name || '所选校区');
  if (c.startFrom || c.startTo)
    labels.push(`${c.startFrom || '不限开始'} 至 ${c.startTo || '不限结束'}`);
  return labels;
}

export function courseRouteParams(id, raw = {}) {
  return { id, ...normalizeCohortContext(raw) };
}

export function beijingDateText(value, includeYear = false) {
  if (!value) return '时间待公布';
  const date = new Date(new Date(value).getTime() + 8 * 3600000);
  if (!Number.isFinite(date.getTime())) return '时间待公布';
  const week = ['日', '一', '二', '三', '四', '五', '六'][date.getUTCDay()];
  return `${includeYear ? date.getUTCFullYear() + '/' : ''}${date.getUTCMonth() + 1}/${date.getUTCDate()} 周${week} ${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
}

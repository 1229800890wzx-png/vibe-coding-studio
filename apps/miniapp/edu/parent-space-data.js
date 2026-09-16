// Presentation derived from authorized learning responses; never infer paid credits.
export function timestamp(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const normalized =
    /^\d{4}-\d\d-\d\d[T ]\d\d:\d\d/.test(value) && !/(Z|[+-]\d\d:?\d\d)$/.test(value)
      ? value.replace(' ', 'T') + '+08:00'
      : value;
  const result = new Date(normalized).getTime();
  return Number.isFinite(result) ? result : null;
}
export function dateParts(value) {
  const time = timestamp(value);
  if (time === null)
    return { month: '—', day: '—', week: '待排期', time: '时间待确认', date: '时间待确认' };
  const d = new Date(time + 8 * 3600000);
  return {
    month: d.getUTCMonth() + 1,
    day: String(d.getUTCDate()).padStart(2, '0'),
    week: '周' + '日一二三四五六'[d.getUTCDay()],
    time:
      String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'),
    date: `${d.getUTCMonth() + 1} 月 ${d.getUTCDate()} 日`,
  };
}
export function count(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}
export function publishedFeedback(rows = []) {
  return rows
    .filter((row) => row.review?.status === 'PUBLISHED')
    .map((row) => ({
      ...row,
      feedback: row.review.feedback || row.feedback || '',
      publishedAt: row.review.publishedAt,
    }))
    .filter((row) => row.feedback.trim())
    .sort((a, b) => (timestamp(b.publishedAt) || 0) - (timestamp(a.publishedAt) || 0));
}
export function courseProgress(dashboard, now = Date.now()) {
  return (dashboard?.enrollments || []).map((enrollment) => {
    const cohortId = enrollment.currentCohortId || enrollment.cohortId;
    const cohort = dashboard.courses?.find((item) => String(item.id) === String(cohortId));
    const sessions = Array.isArray(cohort?.sessions)
      ? cohort.sessions.filter((s) => !['CANCELLED', 'DRAFT'].includes(s.status))
      : null;
    const ended =
      sessions?.filter((s) => timestamp(s.endTime) !== null && timestamp(s.endTime) <= now)
        .length ?? null;
    const upcoming =
      sessions?.filter((s) => timestamp(s.endTime) !== null && timestamp(s.endTime) > now).length ??
      null;
    const undated = sessions?.filter((s) => timestamp(s.endTime) === null).length ?? null;
    const total = sessions?.length ?? null;
    return {
      ...enrollment,
      cohortId,
      courseName: enrollment.courseName || cohort?.courseName || '我的课程',
      cohortName: enrollment.cohortName || cohort?.name || '班期信息待完善',
      teacherName: cohort?.teacherName || '',
      mode: cohort?.mode,
      ended,
      upcoming,
      undated,
      total,
      percent: total ? Math.round((ended / total) * 100) : null,
      // Past schedule time is not proof of attendance or consumed financial entitlement.
      progressLabel: total
        ? `课表已结束 ${ended} / 已安排 ${total} 节`
        : total === 0
        ? '课表还在安排中'
        : '课表进度暂未提供',
    };
  });
}
export function remainingScheduled(courses) {
  if (!courses.length) return 0;
  if (courses.some((c) => c.upcoming === null)) return null;
  return courses.reduce((sum, c) => sum + c.upcoming, 0);
}

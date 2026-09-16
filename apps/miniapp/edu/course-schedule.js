// Editorial plans, not bookable cohort / teacher / SKU IDs. All times are Beijing time.
// User-confirmed package terms; payment requires real published backend SKUs.
export const groupOffer = {
  lessons: 12,
  trialLessons: 4,
  planPrice: 1980,
  activityPrice: 1500,
  trialPrice: 300,
  trialCredit: 300,
};
export const groupSavings = groupOffer.planPrice - groupOffer.activityPrice;
export const upgradeBalance = groupOffer.activityPrice - groupOffer.trialCredit;
export const remainingLessons = groupOffer.lessons - groupOffer.trialLessons;
export const scheduleFamilies = [
  { key: 'weekday', name: '周中晚班', cadence: '每周 2 次', weeks: groupOffer.lessons / 2 },
  { key: 'weekend', name: '周末班', cadence: '每周 1 次', weeks: groupOffer.lessons },
];

export const courseSchedules = [
  {
    key: 'weekday-evening',
    family: 'weekday',
    name: '周中双晚班',
    days: '周三 + 周五',
    time: '19:00–20:30',
    weeks: groupOffer.lessons / 2,
    description: '每周两次，把理解与实践连起来。',
    sessions: [
      { day: '周三', time: '19:00–20:30', mentor: '乔明君', note: '拟定主讲' },
      { day: '周五', time: '19:00–20:30', mentor: '薛煌', note: '拟定主讲' },
    ],
  },
  {
    key: 'weekend-morning',
    family: 'weekend',
    name: '周末上午班',
    days: '每周六',
    time: '09:30–11:00',
    weeks: groupOffer.lessons,
    description: '用一个上午，专注探索一个新问题。',
    sessions: [{ day: '周六', time: '09:30–11:00', mentor: '导师 A', note: '姓名与背景待补充' }],
  },
  {
    key: 'weekend-evening',
    family: 'weekend',
    name: '周末晚间班',
    days: '每周六',
    time: '19:00–20:30',
    weeks: groupOffer.lessons,
    description: '留一段晚间时光，沉浸完成自己的创作。',
    sessions: [{ day: '周六', time: '19:00–20:30', mentor: '导师 B', note: '姓名与背景待补充' }],
  },
];

export const groupFormats = [
  { key: 'ONLINE', name: '线上小班', location: '在线互动课堂' },
  {
    key: 'OFFLINE',
    name: '线下小班',
    location: '固定教学点 · 城市与场地待定',
  },
];

export function scheduleIntent(scheduleKey, modeKey, offerKey = 'full') {
  const schedule = courseSchedules.find((item) => item.key === scheduleKey);
  const format = groupFormats.find((item) => item.key === modeKey);
  if (!schedule || !format || !['full', 'trial'].includes(offerKey)) return null;
  const isTrial = offerKey === 'trial';
  const lessons = isTrial ? groupOffer.trialLessons : groupOffer.lessons;
  const price = isTrial ? groupOffer.trialPrice : groupOffer.activityPrice;
  const weeks = lessons / (schedule.family === 'weekday' ? 2 : 1);
  const label = isTrial ? '先体验前 4 节' : '完整 12 节小班课';
  const upgradeText = `体验费 ¥${groupOffer.trialCredit} 全额抵扣，补 ¥${upgradeBalance} 继续剩余 ${remainingLessons} 节，累计 ¥${groupOffer.activityPrice} 学完 ${groupOffer.lessons} 节。`;
  const text = `课程意向：${label}，${price} 元/人；${schedule.name}；${schedule.days} ${schedule.time}（北京时间）；${format.name}；本次 ${lessons} 节 × 90 分钟，${weeks} 个教学周。整期 ${groupOffer.lessons} 节，方案定价 ${groupOffer.planPrice} 元，活动价 ${groupOffer.activityPrice} 元。${upgradeText}开课日期、导师、场地及可报名状态待确认。`;
  return { schedule, format, offerKey, lessons, price, weeks, label, upgradeText, text };
}

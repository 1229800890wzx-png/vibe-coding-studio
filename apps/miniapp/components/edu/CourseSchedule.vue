<template>
  <view class="schedule-explorer">
    <view class="schedule-topline"
      ><text class="schedule-kicker">A TIME TO CREATE</text
      ><text class="draft-badge">首期排课方案 · 拟定</text></view
    >
    <view class="schedule-heading">先体验，再决定。</view>
    <view class="schedule-lead"
      >跟着导师，从 AI 基础走到作品实战。<br />{{
        groupOffer.lessons
      }}
      节精品小班，让孩子亲手试一试。</view
    >

    <view class="offer-picker" role="group" aria-label="选择课程套餐">
      <button
        class="offer-option full-offer"
        :class="{ selected: offerKey === 'full' }"
        :aria-pressed="offerKey === 'full'"
        @tap="offerKey = 'full'"
      >
        <view class="offer-label"
          ><text>整期活动价</text
          ><text class="offer-radio">{{ offerKey === 'full' ? '✓' : '' }}</text></view
        >
        <view class="offer-price"
          ><text>¥</text>{{ groupOffer.activityPrice.toLocaleString() }}<text> / 人</text></view
        >
        <view class="offer-name">完整 {{ groupOffer.lessons }} 节课</view>
        <view class="offer-original"
          >方案定价 <text>¥{{ groupOffer.planPrice.toLocaleString() }}</text></view
        >
        <view class="offer-saving"
          >省 ¥{{ groupSavings }} · 平均 ¥{{
            groupOffer.activityPrice / groupOffer.lessons
          }}/节</view
        >
      </button>
      <button
        class="offer-option trial-offer"
        :class="{ selected: offerKey === 'trial' }"
        :aria-pressed="offerKey === 'trial'"
        @tap="offerKey = 'trial'"
      >
        <view class="offer-label"
          ><text>先体验一下</text
          ><text class="offer-radio">{{ offerKey === 'trial' ? '✓' : '' }}</text></view
        >
        <view class="offer-price"><text>¥</text>{{ groupOffer.trialPrice }}<text> / 人</text></view>
        <view class="offer-name">体验前 {{ groupOffer.trialLessons }} 节</view>
        <view class="offer-original">先认识老师与课堂</view>
        <view class="offer-saving">体验费可全额抵扣</view>
      </button>
    </view>
    <view class="upgrade-note"
      ><text class="upgrade-mark">✓</text
      ><view
        ><view>先付 ¥{{ groupOffer.trialPrice }}，喜欢再继续。</view
        ><text
          >再补 ¥{{ upgradeBalance.toLocaleString() }} 学剩余 {{ remainingLessons }} 节，合计 ¥{{
            groupOffer.activityPrice.toLocaleString()
          }}
          / {{ groupOffer.lessons }} 节。</text
        ></view
      ></view
    >
    <view class="schedule-divider"><text>接下来，选一个合适的时间</text><text>↓</text></view>

    <view class="family-switch" role="group" aria-label="选择班期类型">
      <button
        v-for="item in scheduleFamilies"
        :key="item.key"
        class="family-choice"
        :class="{ active: family === item.key }"
        :aria-pressed="family === item.key"
        @tap="chooseFamily(item.key)"
      >
        <text class="family-name">{{ item.name }}</text
        ><text class="family-cadence">{{ item.cadence }} · {{ item.weeks }} 周</text>
      </button>
    </view>
    <view v-if="family === 'weekend'" class="weekend-switch" role="group" aria-label="选择周末时段">
      <button
        v-for="item in weekendSchedules"
        :key="item.key"
        :class="{ active: selectedKey === item.key }"
        :aria-pressed="selectedKey === item.key"
        @tap="selectedKey = item.key"
        >{{ item.name }}<text>{{ item.time }}</text></button
      >
    </view>

    <view class="schedule-card">
      <view class="schedule-card-top"
        ><view
          ><text class="schedule-kicker">{{
            family === 'weekday' ? 'WEEKDAY EVENINGS' : 'WEEKEND STUDIO'
          }}</text
          ><view class="plan-name">{{ selected.name }}</view></view
        ><text class="plan-number">{{ family === 'weekday' ? '01' : '02' }}</text></view
      >
      <view class="plan-description">{{ selected.description }}</view>
      <view class="session-list">
        <view v-for="session in selected.sessions" :key="session.day" class="session-row">
          <view class="day-stamp"
            ><text>{{ session.day }}</text
            ><text>{{
              family === 'weekday' ? '晚间' : selectedKey === 'weekend-morning' ? '上午' : '晚间'
            }}</text></view
          >
          <view class="session-copy"
            ><view class="session-time">{{ session.time }}</view
            ><view class="session-mentor"
              >{{ session.mentor }}<text> · {{ session.note }}</text></view
            ></view
          >
        </view>
      </view>
      <view class="plan-facts"
        ><view
          ><text>{{ groupOffer.lessons }}<text class="unit"> 节</text></text
          ><text>一期完整课程</text></view
        ><view
          ><text>90<text class="unit"> 分钟</text></text
          ><text>含 10 分钟休息</text></view
        ><view
          ><text>4–6<text class="unit"> 人</text></text
          ><text>按年龄与基础分班</text></view
        ></view
      >
      <view class="format-row"
        ><text>上课方式</text
        ><view class="format-switch" role="group" aria-label="选择上课方式"
          ><button
            v-for="item in groupFormats"
            :key="item.key"
            :class="{ active: mode === item.key }"
            :aria-pressed="mode === item.key"
            @tap="mode = item.key"
            >{{ item.name }}</button
          ></view
        ></view
      >
      <view class="location-note">{{ format.location }} · 时间均为北京时间</view>
      <view class="price-row"
        ><view
          ><text class="price-label">{{
            offerKey === 'trial' ? '已选：前 4 节体验' : '已选：整期活动套餐'
          }}</text
          ><view class="plan-price"
            ><text>¥</text>{{ selectedOfferPrice.toLocaleString()
            }}<text> / {{ selectedOfferLessons }} 节</text></view
          ></view
        ><view class="price-average"
          >{{ offerKey === 'trial' ? '体验费全额抵扣' : `较方案定价省 ¥${groupSavings}`
          }}<text>线上 / 线下小班同享</text></view
        ></view
      >
      <button class="schedule-cta" @tap="consult"
        >{{ offerKey === 'trial' ? '咨询 ¥300 / 前 4 节体验' : '咨询 ¥1,500 / 完整 12 节' }}
        <text>↗</text></button
      >
      <view class="schedule-notice"
        >{{
          family === 'weekday'
            ? '周三、周五为同一班连续课程，每周两次。'
            : '上午班与晚间班独立招生，任选其一。'
        }}体验为整期课程的前 4 节，抵扣后共计 12 节。开课日期、导师排班和场地确认后开放报名。</view
      >
    </view>

    <view class="learning-ribbon"
      ><view class="ribbon-title">同一条学习路径，两种学习节奏。</view
      ><view class="ribbon-steps"
        ><text>基础认知</text><text>→</text><text>工具协作</text><text>→</text
        ><text>项目实战</text></view
      ><button @tap="openStudio('courses')">看看每个阶段学什么 <text>↗</text></button></view
    >
    <view class="younger-note"
      >7–9 岁可咨询 4 人低龄班，每节 75 分钟，按孩子的基础单独确认适合的时段。</view
    >

    <view class="private-plan">
      <view class="private-heading"
        ><view
          ><text class="schedule-kicker">PERSONAL MENTORING</text
          ><view class="plan-name">也可以，一对一。</view></view
        ><text class="private-mark">1:1</text></view
      >
      <view class="private-prices"
        ><view
          ><text class="private-type">线上指导</text><text class="private-spec">4 节 × 60 分钟</text
          ><text class="private-price">¥1,880<text> / 人</text></text></view
        ><view
          ><text class="private-type">线下指导</text><text class="private-spec">4 节 × 90 分钟</text
          ><text class="private-price">¥2,880<text> / 人</text></text></view
        ></view
      >
      <view class="private-note">以上为建议价。按目标与可用时间约课，线下地点另行确认。</view>
      <button class="private-action" @tap="go('one-to-one')"
        >了解导师与一对一安排 <text>↗</text></button
      >
    </view>
    <button class="team-link" @tap="openStudio('mentors')"
      ><view><text>本期拟定导师</text><view>乔明君 · 薛煌 · 导师 A · 导师 B</view></view
      ><text>↗</text></button
    >
  </view>
</template>
<script setup>
  import { computed, ref } from 'vue';
  import {
    scheduleFamilies,
    courseSchedules,
    groupFormats,
    groupOffer,
    groupSavings,
    upgradeBalance,
    remainingLessons,
  } from '@/edu/course-schedule';
  import { go } from '@/edu/state';
  import { openStudio } from '@/edu/studio';
  const family = ref('weekday'),
    selectedKey = ref('weekday-evening'),
    mode = ref('ONLINE'),
    offerKey = ref('full');
  const selectedOfferPrice = computed(() =>
    offerKey.value === 'trial' ? groupOffer.trialPrice : groupOffer.activityPrice,
  );
  const selectedOfferLessons = computed(() =>
    offerKey.value === 'trial' ? groupOffer.trialLessons : groupOffer.lessons,
  );
  const weekendSchedules = courseSchedules.filter((item) => item.family === 'weekend');
  const selected = computed(() => courseSchedules.find((item) => item.key === selectedKey.value));
  const format = computed(() => groupFormats.find((item) => item.key === mode.value));
  function chooseFamily(key) {
    family.value = key;
    selectedKey.value = key === 'weekday' ? 'weekday-evening' : 'weekend-morning';
  }
  function consult() {
    go('consultation', {
      schedule: selectedKey.value,
      studyMode: mode.value,
      offer: offerKey.value,
    });
  }
</script>
<style scoped>
  .offer-picker {
    display: flex;
    gap: 11px;
    margin-top: 22px;
  }
  .offer-option {
    flex: 1;
    min-width: 0;
    text-align: left;
    margin: 0;
    padding: 17px 14px 14px;
    border: 1px solid #d9cdbb;
    border-radius: 18px;
    background: linear-gradient(135deg, #fffefa, #f9f3e9);
    box-shadow: inset 0 0 0 2px #fffb;
    color: #383c30;
    line-height: 1.6;
  }
  .offer-option.selected {
    border-color: #b36c48;
    box-shadow: inset 0 0 0 2px #fff9, 0 6px 16px -12px #9c542b80;
  }
  .offer-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 5px;
    color: #856b51;
    font-size: 11px;
  }
  .offer-radio {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 17px;
    height: 17px;
    border: 1px solid #d5c0a6;
    border-radius: 50%;
    font-size: 10px;
    line-height: 1;
  }
  .selected .offer-radio {
    background: #b6512d;
    color: #fff;
    border-color: #b6512d;
  }
  .offer-price {
    margin: 10px 0 2px;
    font-size: 31px;
    font-weight: 600;
    letter-spacing: -1px;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    color: #a64d2b;
    line-height: 1.3;
  }
  .offer-price > text:first-child {
    font-size: 16px;
    margin-right: 3px;
  }
  .offer-price > text:last-child {
    font-size: 10px;
    font-weight: 400;
    letter-spacing: 0;
    color: #89755d;
  }
  .offer-name {
    font-size: 14px;
    font-weight: 550;
  }
  .offer-original {
    font-size: 10px;
    color: #95836b;
    margin-top: 9px;
  }
  .offer-original > text {
    text-decoration: line-through;
  }
  .offer-saving {
    font-size: 10px;
    color: #a15330;
    border-top: 1px solid #e3d7c7;
    margin-top: 10px;
    padding-top: 10px;
  }
  .upgrade-note {
    display: flex;
    gap: 10px;
    padding: 15px 5px;
    color: #6e695a;
  }
  .upgrade-mark {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 19px;
    height: 19px;
    color: #81744f;
    border: 1px solid #d0c5af;
    border-radius: 50%;
    font-size: 11px;
    margin-top: 1px;
  }
  .upgrade-note > view > view {
    font-size: 12px;
    font-weight: 500;
  }
  .upgrade-note > view > text {
    display: block;
    font-size: 10px;
    color: #90816b;
    margin-top: 4px;
    line-height: 1.8;
  }
  .schedule-divider {
    display: flex;
    justify-content: space-between;
    margin-top: 14px;
    padding-top: 19px;
    border-top: 1px solid #dacebc;
    color: #867157;
    font-size: 12px;
  }
  @media (min-width: 700px) {
    .offer-option {
      padding: 22px 25px;
    }
    .offer-price {
      font-size: 40px;
    }
    .offer-label,
    .offer-saving {
      font-size: 13px;
    }
    .offer-original {
      font-size: 12px;
    }
  }
  .schedule-explorer {
    margin: 8px 0 32px;
  }
  .schedule-topline,
  .schedule-card-top,
  .format-row,
  .price-row,
  .private-heading,
  .team-link {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .schedule-kicker {
    color: #a95634;
    font-size: 10px;
    letter-spacing: 1.7px;
  }
  .draft-badge {
    font-size: 10px;
    color: #82745e;
    border: 1px solid #e2d7c8;
    border-radius: 6px;
    padding: 4px 7px;
    white-space: nowrap;
  }
  .schedule-heading {
    font-size: 28px;
    font-weight: 650;
    letter-spacing: -0.7px;
    margin: 14px 0 10px;
    line-height: 1.4;
  }
  .schedule-lead {
    color: #727368;
    line-height: 1.85;
    font-size: 14px;
  }
  .family-switch {
    display: flex;
    gap: 5px;
    padding: 5px;
    background: #eee9df;
    border: 1px solid #ded5c7;
    border-radius: 17px;
    margin: 22px 0 16px;
  }
  .family-choice {
    flex: 1;
    margin: 0;
    border: 1px solid transparent;
    border-radius: 12px;
    background: transparent;
    padding: 13px 8px;
    color: #787667;
    line-height: 1.5;
  }
  .family-name {
    display: block;
    font-size: 16px;
    font-weight: 600;
  }
  .family-cadence {
    display: block;
    font-size: 11px;
    margin-top: 3px;
  }
  .family-choice.active {
    color: #a44b2c;
    background: #fffdf8;
    border-color: #d6c2ac;
    box-shadow: inset 0 0 0 2px #fff, 0 3px 8px #6441180c;
  }
  .weekend-switch {
    display: flex;
    gap: 10px;
    margin-bottom: 14px;
  }
  .weekend-switch button {
    flex: 1;
    margin: 0;
    padding: 12px 8px;
    border-radius: 12px;
    border: 1px solid #e0d6c8;
    color: #747466;
    background: #f9f6ef;
    font-size: 13px;
    line-height: 1.6;
  }
  .weekend-switch button text {
    display: block;
    font-size: 12px;
  }
  .weekend-switch button.active {
    border-color: #b97751;
    color: #a14d2e;
    background: #fbf1e6;
    box-shadow: inset 0 0 0 2px #fff8;
  }
  .schedule-card {
    padding: 24px 21px 19px;
    border: 1px solid #d2bd9f;
    border-radius: 24px;
    background: linear-gradient(125deg, #fffefa, #fcf8f0);
    box-shadow: inset 0 0 0 3px #fffc, 0 3px 4px #50341105, 0 14px 27px -22px #68462965;
  }
  .plan-name {
    font-size: 23px;
    font-weight: 650;
    margin-top: 7px;
    letter-spacing: -0.4px;
  }
  .plan-number {
    font-family: 'Studio Art', Georgia, serif;
    font-style: italic;
    font-size: 46px;
    line-height: 1;
    color: #ae8762;
  }
  .plan-description {
    font-size: 12px;
    color: #777569;
    margin: 9px 0 20px;
    line-height: 1.8;
  }
  .session-list {
    border-top: 1px solid #e1d4c2;
    border-bottom: 1px solid #e1d4c2;
  }
  .session-row {
    display: flex;
    align-items: center;
    gap: 17px;
    padding: 17px 0;
  }
  .session-row + .session-row {
    border-top: 1px dashed #ddd3c5;
  }
  .day-stamp {
    flex: none;
    width: 49px;
    border: 1px solid #deceb9;
    background: #f5eee3;
    border-radius: 10px;
    text-align: center;
    padding: 8px 3px;
    box-shadow: inset 0 0 0 2px #fff8;
  }
  .day-stamp text {
    display: block;
    font-size: 13px;
    color: #8e5a36;
  }
  .day-stamp text + text {
    font-size: 10px;
    color: #9b8970;
    margin-top: 2px;
  }
  .session-copy {
    min-width: 0;
  }
  .session-time {
    font-size: 23px;
    font-variant-numeric: tabular-nums;
    font-weight: 550;
    letter-spacing: -0.5px;
  }
  .session-mentor {
    font-size: 12px;
    margin-top: 5px;
    color: #5f6356;
  }
  .session-mentor text {
    color: #8b8577;
    font-size: 10px;
  }
  .plan-facts {
    display: flex;
    padding: 22px 0;
  }
  .plan-facts > view {
    flex: 1;
    text-align: center;
    border-right: 1px solid #e4dacd;
  }
  .plan-facts > view:first-child {
    text-align: left;
  }
  .plan-facts > view:last-child {
    border: 0;
    text-align: right;
  }
  .plan-facts > view > text {
    display: block;
    font-size: 22px;
    line-height: 1.4;
    font-weight: 500;
  }
  .plan-facts .unit {
    font-size: 10px;
    font-weight: 400;
  }
  .plan-facts > view > text + text {
    color: #8b8576;
    font-size: 10px;
    font-weight: 400;
    margin-top: 6px;
  }
  .format-row {
    border-top: 1px solid #e8ded1;
    padding-top: 18px;
    font-size: 12px;
    color: #787568;
  }
  .format-switch {
    display: flex;
    gap: 6px;
  }
  .format-switch button {
    margin: 0;
    padding: 11px 10px;
    font-size: 12px;
    line-height: 1.5;
    color: #79776c;
    background: #f7f2e9;
    border: 1px solid #e2d8c8;
    border-radius: 9px;
  }
  .format-switch button.active {
    color: #a44829;
    border-color: #ba795b;
    background: #fffaf3;
    box-shadow: inset 0 0 0 2px #fff;
  }
  .location-note {
    text-align: right;
    font-size: 10px;
    color: #938774;
    margin-top: 9px;
  }
  .price-row {
    margin: 23px 0 18px;
    align-items: flex-end;
  }
  .price-label {
    color: #837662;
    font-size: 10px;
  }
  .plan-price {
    color: #a44d2d;
    font-size: 32px;
    font-weight: 550;
    margin-top: 3px;
    letter-spacing: -1px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .plan-price > text:first-child {
    font-size: 17px;
    margin-right: 4px;
  }
  .plan-price > text:last-child {
    font-size: 11px;
    font-weight: 400;
    color: #8c8170;
    letter-spacing: 0;
  }
  .price-average {
    text-align: right;
    color: #6b6b5e;
    font-size: 12px;
    padding-bottom: 5px;
  }
  .price-average text {
    display: block;
    font-size: 9px;
    color: #9a8b76;
    margin-top: 4px;
  }
  .schedule-cta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin: 0;
    padding: 15px 18px;
    border: 1px solid #a34827;
    background: #ba4b27;
    color: #fffaf3;
    border-radius: 12px;
    font-size: 14px;
    line-height: 1.5;
    box-shadow: inset 0 1px #ffffff45, 0 3px 5px #632d1410;
  }
  .schedule-cta > text {
    font-size: 19px;
  }
  .schedule-notice {
    font-size: 10px;
    color: #92846f;
    line-height: 1.85;
    margin-top: 13px;
  }
  .learning-ribbon {
    padding: 25px 8px 17px;
    text-align: center;
  }
  .ribbon-title {
    font-size: 14px;
    font-weight: 500;
  }
  .ribbon-steps {
    display: flex;
    justify-content: center;
    gap: 13px;
    color: #8c7154;
    font-size: 12px;
    margin-top: 13px;
  }
  .learning-ribbon button {
    background: transparent;
    font-size: 12px;
    color: #a95330;
    padding: 12px;
    min-height: 44px;
    line-height: 1.5;
  }
  .learning-ribbon button text {
    margin-left: 9px;
  }
  .younger-note {
    font-size: 11px;
    line-height: 1.85;
    color: #8b7f6c;
    padding: 14px 16px;
    border-left: 2px solid #d6b593;
    background: #f2ece2;
    border-radius: 0 10px 10px 0;
  }
  .private-plan {
    margin-top: 24px;
    padding: 22px 21px 6px;
    border: 1px solid #d8cbb7;
    border-radius: 20px;
    background: linear-gradient(120deg, #faf7f0, #efe7d9);
    box-shadow: inset 0 0 0 2px #ffffffaa;
  }
  .private-mark {
    font-family: 'Studio Art', Georgia, serif;
    font-style: italic;
    font-size: 43px;
    color: #aa8560;
  }
  .private-prices {
    display: flex;
    margin: 20px 0 12px;
  }
  .private-prices > view {
    flex: 1;
  }
  .private-prices > view + view {
    border-left: 1px solid #d9cbb5;
    padding-left: 23px;
  }
  .private-prices > view > text {
    display: block;
  }
  .private-type {
    font-size: 13px;
    color: #666953;
  }
  .private-spec {
    font-size: 11px;
    color: #92856e;
    margin: 5px 0 10px;
  }
  .private-price {
    font-size: 23px;
    color: #805337;
    font-weight: 500;
  }
  .private-price text {
    font-size: 10px;
    font-weight: 400;
    color: #91826b;
  }
  .private-note {
    color: #91826f;
    font-size: 10px;
    line-height: 1.8;
  }
  .private-action {
    display: flex;
    justify-content: space-between;
    width: 100%;
    margin: 14px 0 0;
    padding: 15px 0;
    border-radius: 0;
    border-top: 1px solid #daceba;
    background: transparent;
    font-size: 13px;
    color: #a4512e;
    line-height: 1.5;
  }
  .team-link {
    width: 100%;
    padding: 18px 2px;
    margin: 0;
    background: transparent;
    text-align: left;
    line-height: 1.8;
  }
  .team-link > view > text {
    font-size: 10px;
    color: #998771;
  }
  .team-link > view > view {
    font-size: 12px;
    color: #6d654f;
  }
  .team-link > text {
    color: #a65d32;
    font-size: 20px;
  }
  button {
    transition: background 160ms ease, border-color 160ms ease;
  }
  button::after {
    border: 0;
  }
  button:focus-visible {
    outline: 2px solid #a65b38;
    outline-offset: 3px;
  }
  @media (min-width: 700px) {
    .schedule-heading {
      font-size: 36px;
    }
    .schedule-card {
      padding: 30px 34px 24px;
    }
    .session-list {
      display: flex;
    }
    .session-row {
      flex: 1;
    }
    .session-row + .session-row {
      border-top: 0;
      border-left: 1px solid #e1d4c2;
      padding-left: 26px;
    }
    .plan-facts > view:first-child,
    .plan-facts > view:last-child {
      text-align: center;
    }
    .format-row {
      justify-content: flex-end;
    }
    .price-row {
      margin-top: 12px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    button {
      transition: none;
    }
  }
</style>

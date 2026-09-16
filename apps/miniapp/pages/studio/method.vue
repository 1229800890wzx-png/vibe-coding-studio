<template>
  <EduHeader title="教学方法" />
  <view class="studio-page">
    <view class="studio-intro"
      ><text class="studio-kicker">LEARN BY CREATING / 走进课堂</text
      ><view class="studio-h1">让知识，<br />在一个作品里发生。</view
      ><view class="studio-body"
        >导师带领的小班课。从“我想做什么”开始，理解每一步，也学会解释自己的选择。</view
      ><text class="studio-script">Learning, by making.</text></view
    >
    <view class="method-path studio-glass"
      ><button
        v-for="(step, index) in methodSteps"
        :key="step.title"
        class="method-step"
        :class="{ selected: active === index }"
        @tap="active = index"
        :aria-expanded="active === index"
        ><text class="step-index studio-script">0{{ index + 1 }}</text
        ><view class="step-copy"
          ><view class="studio-h3">{{ step.title }}</view
          ><view class="studio-body">{{ step.text }}</view
          ><view v-if="active === index" class="step-question">{{ step.question }}</view></view
        ><text class="step-toggle">{{ active === index ? '−' : '+' }}</text></button
      ></view
    >
    <view class="studio-section"
      ><text class="studio-kicker">A MOMENT IN CLASS / 试试一条规则</text
      ><view class="studio-h2">点一点，<br />看看程序怎样做决定。</view
      ><view class="studio-body"
        >给冒险世界设计一扇门：<br />收集至少 3 颗星星，大门就会打开。</view
      >
      <view class="rule-demo studio-glass"
        ><view class="rule-label">你现在有几颗星星？</view
        ><view class="star-choices"
          ><button
            v-for="value in [0, 2, 3, 5]"
            :key="value"
            :class="{ chosen: stars === value }"
            @tap="stars = value"
            >{{ value }} 颗</button
          ></view
        ><view class="rule-flow"
          ><view
            ><text class="rule-small">输入</text
            ><text class="rule-symbol">☆ {{ stars }}</text></view
          ><text class="flow-arrow">→</text
          ><view><text class="rule-small">判断</text><text class="condition">星星 ≥ 3</text></view
          ><text class="flow-arrow">→</text
          ><view :class="{ success: stars >= 3 }"
            ><text class="rule-small">结果</text
            ><text class="condition">{{ stars >= 3 ? '门打开' : '门关闭' }}</text></view
          ></view
        ><view class="rule-answer" aria-live="polite">{{
          stars >= 3 ? '条件成立，程序执行「打开大门」。' : '还没有达到 3 颗星星，门保持关闭。'
        }}</view
        ><view class="try-question"
          >想一想：如果把“至少 3 颗”换成“超过 3 颗”，哪一次测试的结果会改变？</view
        ><button class="link" @tap="answer = !answer">{{
          answer ? '收起提示 −' : '看看导师的提示 +'
        }}</button
        ><view v-if="answer" class="studio-body answer"
          >试试恰好 3 颗。“至少”包含 3，“超过”不包含
          3。换一组输入验证规则，就是编程中的边界测试。</view
        ></view
      >
    </view>
    <view class="studio-section"
      ><text class="studio-kicker">UNDERSTAND. BUILD. REFLECT.</text
      ><view class="studio-h2">用得明白，才走得更远。</view
      ><view class="studio-body"
        >学习编程规则与 AI
        基础知识，练习表达需求、检查输出、保存版本。工具可以协助创作，关键的思考与判断留给孩子。</view
      ><button class="link" @tap="openStudio('courses', { stage: 'create' })"
        >了解 AI 工具与项目课程 ↗</button
      ></view
    >
    <StudioFooter />
  </view>
</template>
<script setup>
  import { useStudioShare } from '@/edu/studio-share';
  import { ref } from 'vue';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import StudioFooter from '@/components/edu/StudioFooter.vue';
  import { methodSteps, openStudio } from '@/edu/studio';
  const active = ref(0),
    stars = ref(2),
    answer = ref(false);
  useStudioShare('VIBE CODING · 教学方法', '/pages/studio/method');
</script>
<style scoped>
  .method-path {
    padding: 5px 20px;
  }
  .method-step {
    display: flex;
    gap: 14px;
    padding: 22px 0;
    width: 100%;
    background: transparent;
    text-align: left;
    margin: 0;
  }
  .method-step + .method-step {
    border-top: 1px solid #e3d9ca;
  }
  .step-index {
    font-size: 28px;
    min-width: 27px;
  }
  .step-copy {
    flex: 1;
  }
  .step-copy .studio-body {
    font-size: 13px;
    margin-top: 5px;
  }
  .step-toggle {
    color: #9e7550;
    font-size: 21px;
  }
  .step-question {
    font-size: 12px;
    line-height: 1.8;
    padding: 11px;
    background: #f3eadc;
    color: #915333;
    border-radius: 7px;
    margin-top: 14px;
  }
  .method-step.selected .studio-h3 {
    color: #a24a2b;
  }
  .studio-section > .studio-body {
    margin-top: 13px;
  }
  .rule-demo {
    margin-top: 22px;
    padding: 21px 16px 10px;
  }
  .rule-label {
    font-size: 14px;
    font-weight: 600;
  }
  .star-choices {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin: 16px 0 24px;
  }
  .star-choices button {
    width: 100%;
    min-height: 44px;
    margin: 0;
    padding: 10px 5px;
    border-radius: 9px;
    border: 1px solid #dcd0c0;
    background: #fffcf6;
    font-size: 13px;
    color: #6d6252;
  }
  .star-choices .chosen {
    border-color: #ab6746;
    color: #a44c2b;
    background: #f4e5d7;
    box-shadow: inset 0 0 0 2px #fffaf4;
  }
  .rule-flow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
  }
  .rule-flow > view {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 84px;
    border: 1px solid #e1d6c5;
    border-radius: 11px;
    background: #f9f4eb;
  }
  .rule-small {
    font-size: 10px;
    color: #7a776a;
    margin-bottom: 8px;
  }
  .rule-symbol {
    color: #ac5832;
    font-size: 23px;
  }
  .condition {
    font-size: 12px;
    white-space: nowrap;
    font-weight: 600;
  }
  .flow-arrow {
    color: #ad7952;
    font-size: 18px;
  }
  .rule-flow > .success {
    background: #edf0e4;
    border-color: #afb898;
    color: #586b3a;
  }
  .rule-answer {
    font-size: 12px;
    line-height: 1.8;
    margin: 16px 0;
    color: #7a694e;
  }
  .try-question {
    border-top: 1px solid #e1d6c6;
    padding-top: 17px;
    font-size: 13px;
    line-height: 1.9;
  }
  .answer {
    margin-bottom: 14px;
    font-size: 13px;
  }
</style>

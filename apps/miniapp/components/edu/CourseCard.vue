<template>
  <view class="course-card" @tap="go('course', courseRouteParams(course.id, context))"
    ><view class="course-visual" :class="tone"
      ><image
        v-if="!coverFailed"
        :src="coverSource"
        mode="aspectFill"
        class="cover"
        @error="handleCoverError"
      /><view v-else class="course-symbol"
        ><text>{{ symbol }}</text
        ><view class="visual-line" /></view
      ><text class="course-kind">{{ directionLabel(course.direction) }}</text>
      <text v-if="!coverFailed && isCourseIllustration(coverSource)" class="cover-caption"
        >创作示意</text
      ></view
    ><view class="course-content"
      ><view class="row between"
        ><text class="muted small"
          >{{ course.ageMin || 8 }}–{{ course.ageMax || 16 }} 岁 ·
          {{ course.lessons?.length ? course.lessons.length + ' 次课' : '课次待公布' }}</text
        ><text class="pill">{{ levelLabel(course.level) }}</text></view
      ><view class="course-title">{{ course.name }}</view
      ><view class="muted course-desc">{{ course.description }}</view
      ><view class="course-availability"
        ><text>{{
          context.kind === 'TRIAL' ? '体验课' : context.kind === 'REGULAR' ? '正式班' : '课程班期'
        }}</text
        ><text>{{
          course.cohortCount > 0 ? course.cohortCount + ' 个班期可查看' : '新班期准备中'
        }}</text></view
      ><view class="row between course-bottom"
        ><view
          ><text class="price">{{
            typeof course.price === 'number' ? '¥' + money(course.price) : '待开班'
          }}</text
          ><text v-if="typeof course.price === 'number'" class="small muted"> 起</text
          ><view class="small muted">{{
            context.kind === 'TRIAL'
              ? '体验班期起价'
              : context.kind === 'REGULAR'
              ? '正式班期起价'
              : '以所选班期为准'
          }}</view></view
        ><text class="circle-arrow">↗</text></view
      ></view
    ></view
  >
</template>
<script setup>
  import { computed, ref, watch } from 'vue';
  import { go, money } from '@/edu/state';
  import { directionLabel, levelLabel } from '@/edu/labels';
  import { courseCover, isCourseIllustration } from '@/edu/course-cover';
  import { courseRouteParams } from '@/edu/cohort-context';
  const props = defineProps({
    course: { type: Object, required: true },
    context: { type: Object, default: () => ({}) },
  });
  const coverFailed = ref(false);
  const useFallback = ref(false);
  const coverSource = computed(() => courseCover(props.course, useFallback.value));
  watch(
    () => [props.course.coverUrl, props.course.direction],
    () => {
      coverFailed.value = false;
      useFallback.value = false;
    },
  );
  function handleCoverError() {
    if (coverSource.value !== courseCover(props.course, true)) useFallback.value = true;
    else coverFailed.value = true;
  }
  const tone = computed(
    () => ['mint', 'peach', 'blue', 'yellow', 'lilac', 'gray'][Number(props.course.id) % 6],
  );
  const symbol = computed(() => ['{ }', '↗', '✳', '◈', 'Aa', '>_'][Number(props.course.id) % 6]);
</script>
<style scoped>
  .course-card {
    overflow: hidden;
    border-radius: 20px;
    background: #fffcf7;
    margin-bottom: 16px;
    border: 1px solid #dfd3c3;
    box-shadow: 0 8px 20px -16px #75532e45;
    transition: transform 0.18s;
  }
  .course-card:active {
    transform: scale(0.985);
  }
  .course-visual {
    position: relative;
    height: 0;
    padding-top: 56.25%;
    background: #ffe0c5;
    overflow: hidden;
  }
  .cover {
    position: absolute;
    inset: 0;
    height: 100%;
    width: 100%;
  }
  .mint {
    background: #ddebe1;
  }
  .blue {
    background: #d9e4f4;
  }
  .yellow {
    background: #f0ebd0;
  }
  .lilac {
    background: #e5deee;
  }
  .gray {
    background: #dfe1e3;
  }
  .course-symbol {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 78px;
    font-weight: 750;
    letter-spacing: -8px;
    color: #1d1d1f;
  }
  .visual-line {
    position: absolute;
    width: 180px;
    height: 180px;
    border: 1px solid #1d1d1f22;
    border-radius: 50%;
    transform: rotate(-35deg) scaleX(1.7);
  }
  .course-kind {
    position: absolute;
    left: 16px;
    top: 14px;
    font-size: 14px;
    background: #fffffff0;
    padding: 4px 8px;
    border-radius: 6px;
    letter-spacing: 1px;
  }
  .cover-caption {
    position: absolute;
    bottom: 10px;
    right: 12px;
    padding: 2px 7px;
    border-radius: 5px;
    background: #fffffff0;
    color: #515157;
    font-size: 14px;
  }
  .course-content {
    padding: 16px;
  }
  .course-title {
    font-size: 18px;
    line-height: 1.35;
    font-weight: 750;
    margin: 12px 0 8px;
    letter-spacing: -0.5px;
  }
  .course-desc {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 44px;
  }
  .course-bottom {
    margin-top: 18px;
  }
  .course-availability {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    color: #6e6e73;
    font-size: 14px;
    margin-top: 14px;
  }
  .course-availability > text:first-child {
    color: #c94b00;
  }
  .circle-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #fff3e8;
    color: #c94b00;
    font-size: 21px;
  }
</style>

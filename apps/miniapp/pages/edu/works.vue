<template>
  <EduHeader
    :title="publicMode ? '作品展厅' : '孩子的作品集'"
    :child="!publicMode"
    @change="refresh"
  />
  <view class="edu-page">
    <text class="eyebrow">MADE WITH CURIOSITY</text>
    <view class="title">想法，有了自己的样子。</view>
    <view class="subtitle">{{
      publicMode ? '经监护人授权与审核发布的创作。' : '先看清这次分享的内容，再决定是否公开。'
    }}</view>
    <EduState
      :loading="loading"
      :error="error"
      :empty="!items.length"
      title="第一件作品，值得期待"
      :description="
        publicMode ? '公开作品发布后，会出现在这里。' : '在作业页面将已提交的创作收进作品集。'
      "
      @retry="refresh"
    />
    <view class="course-grid">
      <view v-for="item in items" :key="item.id" class="card work">
        <image v-if="item.coverUrl" class="work-cover" :src="item.coverUrl" mode="aspectFill" />
        <view class="row between"
          ><view class="section-title">{{ item.title }}</view
          ><text class="pill">{{
            statuses[item.status] || (publicMode ? '已公开' : item.status)
          }}</text></view
        >
        <view class="muted work-description">{{ item.description }}</view>
        <view class="small muted version"
          >第 {{ item.version }} 版{{
            !publicMode
              ? item.consentStatus === 'GRANTED'
                ? ' · 已授权本版本公开'
                : ' · 尚未授权公开'
              : ''
          }}</view
        >
        <view v-if="!publicMode && item.moderationNote" class="note version">{{
          item.moderationNote
        }}</view>
        <button
          class="btn secondary version"
          :disabled="previewLoading === item.id"
          @tap="openPreview(item)"
          >{{
            previewLoading === item.id
              ? '正在读取版本…'
              : publicMode
              ? '查看作品内容与附件'
              : `预览第 ${item.version} 版内容与附件`
          }}</button
        >
        <view v-if="preview?.id === item.id" class="work-preview">
          <view class="section-title"
            >{{ publicMode ? '公开作品' : '本次授权预览' }} · 第 {{ preview.version }} 版</view
          >
          <view class="small muted version">{{
            publicMode
              ? '此处展示的是通过审核的作品版本。'
              : '公开展示将包含以下作品内容、标题、说明和全部附件。'
          }}</view>
          <text class="work-content" selectable>{{
            preview.content || '这个版本的创作内容保存在附件中。'
          }}</text>
          <view v-if="preview.attachments?.length" class="attachment-list">
            <view class="small muted">作品附件 · {{ preview.attachments.length }} 个</view>
            <button
              v-for="attachment in preview.attachments"
              :key="attachment.index"
              class="attachment-button"
              :disabled="fileBusy !== ''"
              @tap="download(preview, attachment)"
              >{{
                fileBusy === `${preview.id}:${attachment.index}`
                  ? '正在下载…'
                  : `下载 · ${attachment.name}`
              }}</button
            >
          </view>
          <view v-if="!publicMode" class="note version"
            >请逐一查看附件，确认文字、图片、录音和文件名中没有姓名、学校、联系方式或其他不愿公开的信息。网页与源码以文件下载，不在展厅执行。</view
          >
          <button
            v-if="!publicMode && item.consentStatus !== 'GRANTED'"
            class="btn version"
            :disabled="busy === item.id || fileBusy !== ''"
            @tap="consent(item)"
            >已查看第 {{ preview.version }} 版，授权审核后公开</button
          >
        </view>
        <button
          v-if="!publicMode && item.consentStatus === 'GRANTED'"
          class="btn quiet version"
          :disabled="busy === item.id"
          @tap="revoke(item)"
          >撤回公开授权</button
        >
      </view>
    </view>
    <view v-if="actionError" class="error" role="alert">{{ actionError }}</view>
    <view v-if="!publicMode" class="note"
      >授权只对预览的作品版本生效。机构审核后才会公开。撤回后停止新的公开访问；他人已经下载的副本无法收回。</view
    >
  </view>
</template>
<script setup>
  import { ref, computed } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import EduState from '@/components/edu/EduState.vue';
  import { edu, listOf } from '@/edu/api';
  import { useResource } from '@/edu/resource';
  import { family, loadStudents, requireLogin, confirm, toast } from '@/edu/state';
  defineOptions({ inheritAttrs: false });
  const publicMode = ref(false),
    busy = ref(0),
    actionError = ref(''),
    preview = ref(null),
    previewLoading = ref(0),
    fileBusy = ref('');
  let previewRequest = 0;
  const statuses = { PRIVATE: '私密', PENDING: '审核中', PUBLISHED: '已公开', REJECTED: '待完善' };
  const {
    data,
    loading,
    error,
    refresh: load,
  } = useResource(async () => {
    if (publicMode.value) return edu.publicWorks();
    await loadStudents();
    return family.currentId ? edu.works(family.currentId) : [];
  }, []);
  const items = computed(() => listOf(data.value));
  async function refresh() {
    previewRequest++;
    preview.value = null;
    previewLoading.value = 0;
    actionError.value = '';
    await load();
  }
  async function openPreview(item) {
    const current = ++previewRequest;
    preview.value = null;
    previewLoading.value = item.id;
    actionError.value = '';
    try {
      const value = await (publicMode.value
        ? edu.publicWork(item.id, item.version)
        : edu.workPreview(item.id, item.version));
      if (current === previewRequest) preview.value = value;
    } catch (e) {
      if (current === previewRequest) actionError.value = e.message;
    } finally {
      if (current === previewRequest) previewLoading.value = 0;
    }
  }
  async function download(work, attachment) {
    fileBusy.value = `${work.id}:${attachment.index}`;
    actionError.value = '';
    try {
      const file = edu.workFile(work.id, work.version, attachment.index, publicMode.value);
      const downloaded = await uni.downloadFile({ url: file.url, header: file.headers });
      if (downloaded.statusCode !== 200) throw new Error('作品附件已不可访问，请重新打开作品。');
      // #ifdef H5
      const link = document.createElement('a');
      link.href = downloaded.tempFilePath;
      link.download = attachment.name;
      link.click();
      // #endif
      // #ifndef H5
      if (/\.(png|jpe?g|webp)$/i.test(attachment.name))
        uni.previewImage({ urls: [downloaded.tempFilePath] });
      else if (/\.pdf$/i.test(attachment.name))
        uni.openDocument({ filePath: downloaded.tempFilePath, showMenu: true });
      else {
        const saved = await uni.saveFile({ tempFilePath: downloaded.tempFilePath });
        if (typeof uni.shareFileMessage === 'function')
          await uni.shareFileMessage({ filePath: saved.savedFilePath, fileName: attachment.name });
        else toast('文件已保存，可在电脑端查看源码或压缩包');
      }
      // #endif
    } catch (e) {
      actionError.value = e.message || '文件未能下载，请重试';
      if (publicMode.value) preview.value = null;
    } finally {
      fileBusy.value = '';
    }
  }
  async function consent(item) {
    if (preview.value?.id !== item.id || preview.value.version !== item.version) return;
    const version = preview.value.version;
    if (
      !(await confirm(
        `授权公开第 ${version} 版`,
        `你作为监护人，同意公开刚才预览的第 ${version} 版标题、说明、作品文字与全部 ${preview.value.attachments.length} 个附件。机构审核后才会发布。请确认已检查其中的个人信息。`,
      ))
    )
      return;
    busy.value = item.id;
    actionError.value = '';
    try {
      await edu.consent({ id: item.id, version });
      toast('已提交本版本授权');
      await refresh();
    } catch (e) {
      actionError.value = e.message;
    } finally {
      busy.value = 0;
    }
  }
  async function revoke(item) {
    if (
      !(await confirm(
        '撤回公开授权',
        '撤回后停止公开作品和附件的新访问，私密学习记录仍保留。已经下载的副本无法收回。',
      ))
    )
      return;
    busy.value = item.id;
    actionError.value = '';
    try {
      await edu.revoke({ id: item.id });
      toast('公开授权已撤回');
      await refresh();
    } catch (e) {
      actionError.value = e.message;
    } finally {
      busy.value = 0;
    }
  }
  onLoad((options) => (publicMode.value = options.public === '1'));
  onShow(() => {
    if (publicMode.value || requireLogin()) refresh();
  });
</script>
<style scoped>
  .work {
    margin-top: 20px;
  }
  .work-cover {
    height: 190px;
    width: 100%;
    border-radius: 12px;
    margin-bottom: 16px;
  }
  .work-description {
    margin-top: 12px;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .version {
    margin-top: 14px;
  }
  .work-preview {
    margin-top: 20px;
    border-top: 1px solid #e4e4e7;
    padding-top: 20px;
  }
  .work-content {
    display: block;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    line-height: 1.8;
    margin: 18px 0;
  }
  .attachment-list {
    display: grid;
    gap: 8px;
  }
  .attachment-button {
    text-align: left;
    width: 100%;
    color: #1d1d1f;
    background: #f5f5f7;
    border-radius: 10px;
    padding: 12px;
    font-size: 14px;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
</style>

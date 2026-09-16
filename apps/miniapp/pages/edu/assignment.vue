<template
  ><EduHeader title="作业与作品提交" /><view class="edu-page with-dock"
    ><EduState :loading="loading" :error="error" @retry="refresh" /><template
      v-if="assignment && !loading && !error"
      ><text class="pill">{{ studentName }}的作业</text
      ><view class="title">{{ assignment.title }}</view
      ><view class="muted">{{
        assignment.dueTime ? '截止 ' + dateText(assignment.dueTime) : '按自己的节奏完成'
      }}</view
      ><view class="card" style="margin-top: 20px"
        ><view class="section-title">这次的创作任务</view
        ><view class="prose">{{ assignment.description }}</view
        ><view v-if="assignment.materials" class="muted prose"
          ><button
            v-for="file in assignment.materials"
            :key="file.fileId"
            class="link"
            @tap="download(file)"
            >↘ {{ file.name }}</button
          ></view
        ></view
      ><view v-if="submission?.feedback" class="card stack"
        ><text class="pill">老师反馈</text><view class="prose">{{ submission.feedback }}</view
        ><view v-if="submission.score != null" class="muted"
          >评分 {{ submission.score }}</view
        ></view
      ><view class="section-head"
        ><text class="section-title">记录你的创作</text
        ><text class="pill">{{ statusLabel }}</text></view
      ><view v-if="conflict" class="note stack" role="alert"
        ><text class="strong">服务器草稿已有更新</text
        ><text>已保留本机修改，保存前请选择要使用的内容。</text
        ><button class="btn secondary" @tap="resolveConflict(false)">保留本机修改</button
        ><button class="link" @tap="resolveConflict(true)">使用服务器草稿</button></view
      ><view class="card"
        ><view class="field"
          ><text class="field-label">我的思路与作品说明</text
          ><textarea
            class="input textarea"
            v-model="content"
            maxlength="6000"
            placeholder="我想做什么？我试了哪些方法？我发现了什么？"
            :disabled="busy"
          /></view
        ><view class="field"
          ><text class="field-label">作品附件</text
          ><view v-for="(file, i) in attachments" :key="file.localId" class="stack list-line"
            ><text class="strong file-name">{{ file.name }}</text
            ><view v-if="file.state === 'UPLOADING'"
              ><progress :percent="file.progress" stroke-width="4" activeColor="#C94B00" /><text
                class="small"
                >正在上传 {{ file.progress }}%</text
              ></view
            ><text v-else-if="file.fileId" class="small">上传成功 · 尚需正式提交</text
            ><view v-else class="stack"
              ><text class="error small">{{ file.error || '等待上传' }}</text
              ><view class="row"
                ><button class="link" :disabled="uploading" @tap="uploadOne(file)">重试此项</button
                ><button class="link" :disabled="uploading" @tap="choose(file.kind || 'file', file)"
                  >重新选择此项</button
                ></view
              ></view
            ><button
              class="link"
              :disabled="busy || file.state === 'UPLOADING'"
              @tap="attachments.splice(i, 1)"
              >移除</button
            ></view
          ><button class="btn secondary" :disabled="uploading || busy" @tap="choose('image')">{{
            uploading ? '附件上传中…' : '＋ 上传作品图片'
          }}</button
          ><button class="btn quiet" :disabled="uploading || busy" @tap="choose('file')"
            >选择项目、文档或视频</button
          ><view class="small muted" style="margin-top: 8px"
            >每项不超过30MB。上传完成后仍是草稿，正式提交后老师才会收到作业。</view
          ></view
        ><view v-if="actionError" class="error">{{ actionError }}</view
        ><view v-if="savedAt" class="note" aria-live="polite">{{ savedAt }}</view
        ><view v-if="localSavedAt" class="small muted" style="margin-top: 12px"
          >本机草稿 {{ localSavedAt }}；文字和附件会在返回后恢复。</view
        ></view
      ><view
        v-if="submission?.id && ['REVIEWED', 'SUBMITTED'].includes(submission.status)"
        class="card stack"
        ><view class="strong">把这次创作收进作品集</view
        ><input
          class="input"
          v-model="workTitle"
          maxlength="80"
          placeholder="为作品取一个名字"
        /><button class="btn secondary" :disabled="busy || !workTitle.trim()" @tap="createWork"
          >保存为私密作品</button
        ></view
      ></template
    ></view
  ><view v-if="assignment && !loading && !error" class="dock"
    ><view class="dock-inner"
      ><button class="btn quiet" :disabled="busy || uploading || conflict" @tap="save(false)"
        >保存草稿</button
      ><button
        class="btn"
        :disabled="
          busy || uploading || conflict || hasFailed || (!content.trim() && !attachments.length)
        "
        @tap="save(true)"
        >{{ busy ? '正在保存…' : '正式提交' }}</button
      ></view
    ></view
  ></template
>
<script setup>
  defineOptions({ inheritAttrs: false });
  import { ref, computed, watch, onBeforeUnmount } from 'vue';
  import { onLoad, onHide, onUnload } from '@dcloudio/uni-app';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import EduState from '@/components/edu/EduState.vue';
  import { uploadEducationFile, openMaterial } from '@/edu/files';
  import store from '@/sheep/store';
  import { edu, unwrap } from '@/edu/api';
  import { useResource } from '@/edu/resource';
  import { family, loadStudents, requireLogin, dateText, confirm, toast } from '@/edu/state';
  const id = ref(0),
    studentId = ref(0),
    content = ref(''),
    attachments = ref([]),
    submission = ref(null),
    busy = ref(false),
    uploading = computed(() => attachments.value.some((f) => f.state === 'UPLOADING')),
    actionError = ref(''),
    savedAt = ref(''),
    workTitle = ref(''),
    localSavedAt = ref(''),
    conflict = ref(false);
  let draftKey = '',
    ready = false,
    draftTimer;
  const hasFailed = computed(() => attachments.value.some((f) => !f.fileId));
  const partialUploadMessage = '已保留成功上传项，请重试失败附件。';
  const normalizeFiles = (files = []) =>
    files.map((f) => ({
      ...f,
      localId: f.localId || Date.now().toString(36) + Math.random().toString(36).slice(2),
      state: f.fileId ? 'READY' : 'FAILED',
      progress: f.fileId ? 100 : 0,
    }));
  function persist() {
    if (!ready || !draftKey) return;
    try {
      const now = Date.now();
      uni.setStorageSync(draftKey, {
        content: content.value,
        attachments: attachments.value.map((f) => ({ ...f, state: f.fileId ? 'READY' : 'FAILED' })),
        conflict: conflict.value,
        baseId: submission.value?.id,
        baseRevision: submission.value?.revision,
        updatedAt: now,
      });
      localSavedAt.value = new Date(now).toLocaleTimeString('zh-CN', { hour12: false });
    } catch {
      actionError.value = '本机空间不足，请联网保存草稿。';
    }
  }
  watch(
    [content, attachments],
    () => {
      if (!ready) return;
      clearTimeout(draftTimer);
      draftTimer = setTimeout(persist, 300);
    },
    { deep: true },
  );
  const studentName = computed(
    () => family.students.find((s) => s.id === studentId.value)?.name || '报名孩子',
  );
  const statusLabel = computed(
    () =>
      ({
        DRAFT: '草稿',
        SUBMITTED: '已提交，待点评',
        REVIEWED: '已点评',
        REVISION_REQUIRED: '请继续修改',
      }[submission.value?.status] || '未提交'),
  );
  const {
    data: assignment,
    loading,
    error,
    refresh,
  } = useResource(async () => {
    ready = false;
    await loadStudents();
    if (!store('user').userInfo.id) await store('user').getInfo();
    if (!store('user').userInfo.id) throw new Error('请重新登录后恢复草稿');
    draftKey = `edu-draft:${store('user').userInfo.id}:${studentId.value}:${id.value}`;
    const a = await edu.assignment(id.value, studentId.value);
    submission.value = a.submission || null;
    content.value = a.submission?.content || '';
    attachments.value = normalizeFiles(a.submission?.attachments);
    const cached = uni.getStorageSync(draftKey);
    if (
      cached &&
      (cached.content !== content.value ||
        JSON.stringify((cached.attachments || []).map((f) => f.fileId || f.localId)) !==
          JSON.stringify(attachments.value.map((f) => f.fileId)))
    ) {
      content.value = cached.content || '';
      attachments.value = normalizeFiles(cached.attachments);
      conflict.value =
        cached.conflict ||
        (cached.baseId || null) !== (submission.value?.id || null) ||
        (cached.baseRevision || 0) !== (submission.value?.revision || 0);
      savedAt.value = '已恢复本机尚未提交的修改。';
      localSavedAt.value = new Date(cached.updatedAt).toLocaleTimeString('zh-CN', {
        hour12: false,
      });
    }
    ready = true;
    return a;
  });
  async function uploadOne(file) {
    if (file.fileId || file.state === 'UPLOADING') return;
    if (!file.localPath) {
      file.error = '临时文件已失效，请仅重新选择这一项';
      return;
    }
    file.state = 'UPLOADING';
    file.error = '';
    file.progress = 0;
    try {
      const result = await uploadEducationFile(
        file.localPath,
        studentId.value,
        (p) => (file.progress = p),
      );
      file.fileId = result.fileId;
      file.name = result.name || file.name;
      file.state = 'READY';
      file.progress = 100;
      file.localPath = '';
      if (!hasFailed.value && !uploading.value && savedAt.value === partialUploadMessage) {
        savedAt.value = '附件已上传，正式提交后老师才会收到作业。';
      }
    } catch (e) {
      file.state = 'FAILED';
      file.error = e.message || '上传失败，请重试此项';
    } finally {
      persist();
    }
  }
  async function choose(kind = 'image', replacing = null) {
    if (!replacing && attachments.value.length >= 10) return toast('最多上传10个附件');
    try {
      let selected;
      const count = replacing ? 1 : 10 - attachments.value.length;
      if (kind === 'image') {
        const result = await uni.chooseImage({
          count,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera'],
        });
        selected = result.tempFilePaths.map((path, i) => ({
          path,
          name: result.tempFiles?.[i]?.name || `作品图片-${i + 1}.jpg`,
          size: result.tempFiles?.[i]?.size,
        }));
      } else {
        // #ifdef MP-WEIXIN
        const result = await uni.chooseMessageFile({ count, type: 'all' });
        selected = result.tempFiles;
        // #endif
        // #ifdef H5
        const result = await uni.chooseFile({ count, type: 'all' });
        selected = result.tempFiles;
        // #endif
        if (!selected) throw new Error('请在微信小程序选择项目文件，或上传作品图片');
      }
      for (const picked of selected) {
        const file = normalizeFiles([
          { name: picked.name || '项目附件', localPath: picked.path || picked.tempFilePath, kind },
        ])[0];
        if (picked.size > 30 * 1024 * 1024) {
          file.localPath = '';
          file.error = '超过30MB，请仅重新选择此项';
        }
        if (replacing)
          attachments.value.splice(
            attachments.value.findIndex((f) => f.localId === replacing.localId),
            1,
            file,
          );
        else attachments.value.push(file);
        persist();
        if (file.localPath)
          await uploadOne(attachments.value.find((f) => f.localId === file.localId));
      }
      savedAt.value = hasFailed.value
        ? partialUploadMessage
        : '附件已上传，正式提交后老师才会收到作业。';
    } catch (e) {
      if (!String(e.errMsg || e.message || '').includes('cancel'))
        actionError.value = e.message || '文件选择失败';
    }
  }
  async function resolveConflict(remote) {
    if (
      !(await confirm(
        remote ? '使用服务器草稿' : '保留本机修改',
        remote
          ? '确认用服务器的内容替换本页文字和附件？'
          : '请先核对服务器版本。确认将本机修改保存为当前草稿？',
      ))
    )
      return;
    if (remote) {
      content.value = submission.value?.content || '';
      attachments.value = normalizeFiles(submission.value?.attachments);
    }
    conflict.value = false;
    persist();
  }
  async function download(file) {
    try {
      await openMaterial(file.fileId, studentId.value, file.name);
    } catch (e) {
      actionError.value = e.message;
    }
  }
  async function save(submit) {
    if (busy.value || uploading.value || conflict.value || (submit && hasFailed.value)) return;
    if (
      submit &&
      !(await confirm(
        '正式提交作业',
        `确认提交${studentName.value}的这次作业？老师将看到本次版本。`,
      ))
    )
      return;
    busy.value = true;
    actionError.value = '';
    try {
      const payload = {
        assignmentId: id.value,
        studentId: studentId.value,
        content: content.value,
        attachments: attachments.value
          .filter((f) => f.fileId)
          .map((f) => ({ fileId: f.fileId, name: f.name })),
        id: submission.value?.id,
        version: submission.value?.version,
        revision: submission.value?.revision,
      };
      submission.value = await (submit ? edu.submit(payload) : edu.saveSubmission(payload));
      savedAt.value = submit
        ? '作业已正式提交，等待老师点评。'
        : '服务器草稿已保存' +
          (submission.value.updateTime ? ' · ' + dateText(submission.value.updateTime) : '');
      if (hasFailed.value) savedAt.value += ' 未上传项保留在本机。';
      persist();
      toast(submit ? '提交成功' : '草稿已保存');
    } catch (e) {
      actionError.value = e.message;
    } finally {
      busy.value = false;
    }
  }
  async function createWork() {
    busy.value = true;
    try {
      await edu.createWork({
        studentId: studentId.value,
        submissionId: submission.value.id,
        title: workTitle.value.trim(),
        description: submission.value.content,
      });
      toast('已收进私密作品集');
    } catch (e) {
      actionError.value = e.message;
    } finally {
      busy.value = false;
    }
  }
  onHide(persist);
  onUnload(persist);
  onBeforeUnmount(() => {
    clearTimeout(draftTimer);
    persist();
  });
  onLoad((o) => {
    id.value = Number(o.id);
    studentId.value = Number(o.studentId);
    if (requireLogin()) refresh();
  });
</script>
<style scoped>
  .file-name {
    overflow-wrap: anywhere;
  }
  .list-line {
    padding: 12px 0;
  }
  .prose {
    white-space: pre-line;
    line-height: 1.9;
    margin-top: 12px;
  }
  .textarea {
    height: 220px;
  }
</style>

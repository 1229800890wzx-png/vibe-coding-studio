<template>
  <EduHeader title="家长登录" /><view class="edu-page login"
    ><view class="login-intro"
      ><text class="eyebrow">FAMILY LEARNING SPACE</text
      ><view class="title">一个家长账号，<br />陪伴每一步成长。</view
      ><view class="subtitle">管理孩子、报名课程、查看作品与老师反馈。</view
      ><view class="login-benefits"
        ><text>多孩子分别管理</text><text>学习记录随时可看</text></view
      ></view
    ><view v-if="returnTo" class="continuation-note"
      ><text class="continuation-icon">↗</text
      ><view
        ><view class="strong">登录后继续{{ continuationLabel(returnTo) }}</view
        ><view class="small muted">已选课程会保留，无需重新寻找。</view></view
      ></view
    ><view class="card login-form"
      ><view class="chips"
        ><button
          class="chip"
          :class="{ active: mode === 'sms' }"
          :disabled="busy"
          @tap="changeMode('sms')"
          >验证码登录</button
        ><button
          class="chip"
          :class="{ active: mode === 'password' }"
          :disabled="busy"
          @tap="changeMode('password')"
          >密码登录</button
        ></view
      ><view class="field"
        ><text class="field-label">手机号</text
        ><input
          class="input"
          v-model="mobile"
          type="number"
          maxlength="11"
          placeholder="请输入家长手机号" /></view
      ><view v-if="mode === 'sms'" class="field"
        ><text class="field-label">短信验证码</text
        ><view class="row"
          ><input
            class="input"
            v-model="code"
            type="number"
            maxlength="6"
            placeholder="6 位验证码"
          /><button class="btn secondary sms" :disabled="sending || countdown > 0" @tap="send">{{
            countdown > 0 ? countdown + ' 秒' : '获取验证码'
          }}</button></view
        ></view
      ><view v-else class="field"
        ><text class="field-label">密码</text
        ><view class="password-row"
          ><input
            class="input"
            v-model="password"
            :password="!showPassword"
            placeholder="请输入密码"
          /><button class="password-toggle" @tap="showPassword = !showPassword">{{
            showPassword ? '隐藏' : '显示'
          }}</button></view
        ></view
      ><view v-if="error" class="error">{{ error }}</view
      ><label class="checkrow" @tap="agreed = !agreed"
        ><checkbox :checked="agreed" color="#C94B00" /><view
          >我已阅读并同意<button class="inline-link" @tap.stop="policy('terms')">用户协议</button
          >与<button class="inline-link" @tap.stop="policy('privacy')">隐私政策</button
          >，并作为孩子的监护人使用服务。</view
        ></label
      ><button class="btn" :disabled="busy" @tap="login">{{
        busy ? '正在登录…' : returnTo ? '登录并继续' : '登录 / 注册'
      }}</button
      ><!-- #ifdef MP-WEIXIN --><button
        class="btn secondary"
        style="margin-top: 12px"
        :disabled="!agreed || busy"
        open-type="getPhoneNumber"
        @getphonenumber="wechat"
        >微信手机号快捷登录</button
      ><!-- #endif --></view
    ><view class="login-footnote">浏览课程无需登录；报名和学习服务使用家长账号。</view
    ><button class="link guest-link" :disabled="busy" @tap="browse">先逛一逛</button></view
  >
</template>
<script setup>
  defineOptions({ inheritAttrs: false });
  import { ref, onUnmounted } from 'vue';
  import { onLoad } from '@dcloudio/uni-app';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import Auth from '@/sheep/api/member/auth';
  import { edu, unwrap } from '@/edu/api';
  import { tab, toast } from '@/edu/state';
  import { safeContinuation, continuationLabel, continueTo } from '@/edu/navigation';
  const returnTo = ref(''),
    showPassword = ref(false);
  onLoad((options) => {
    returnTo.value = safeContinuation(options.returnTo);
  });
  const mobile = ref(''),
    code = ref(''),
    password = ref(''),
    mode = ref('sms'),
    agreed = ref(false),
    busy = ref(false),
    sending = ref(false),
    error = ref(''),
    countdown = ref(0);
  let timer;
  onUnmounted(() => clearInterval(timer));
  function changeMode(value) {
    mode.value = value;
    error.value = '';
  }
  function browse() {
    const path = returnTo.value.split('?')[0];
    if (['/pages/edu/course', '/pages/edu/cohort', '/pages/edu/one-to-one'].includes(path))
      continueTo(returnTo.value);
    else tab('courses');
  }
  function valid() {
    if (!/^1\d{10}$/.test(mobile.value)) {
      error.value = '请输入有效的 11 位手机号';
      return false;
    }
    return true;
  }
  async function send() {
    if (sending.value || countdown.value > 0 || busy.value) return;
    if (!valid()) return;
    if (!agreed.value) {
      error.value = '请先阅读并同意服务协议与隐私政策';
      return;
    }
    sending.value = true;
    error.value = '';
    try {
      await unwrap(Auth.sendSmsCode(mobile.value, 1));
      countdown.value = 60;
      timer = setInterval(() => {
        countdown.value--;
        if (!countdown.value) clearInterval(timer);
      }, 1000);
    } catch (e) {
      error.value = e.message;
    } finally {
      sending.value = false;
    }
  }
  async function finish(authenticate) {
    if (busy.value) return;
    busy.value = true;
    error.value = '';
    try {
      await unwrap(authenticate());
      // Authentication has completed. Child-list failures belong to the destination page.
      if (returnTo.value) continueTo(returnTo.value);
      else if (getCurrentPages().length > 1) uni.navigateBack({ fail: () => tab('me') });
      else tab('me');
    } catch (e) {
      error.value = e.message;
    } finally {
      busy.value = false;
    }
  }
  function login() {
    if (busy.value) return;
    if (!valid()) return;
    if (!agreed.value) {
      error.value = '请先阅读并同意服务协议与隐私政策';
      return;
    }
    if (mode.value === 'sms' && !/^\d{4,6}$/.test(code.value)) {
      error.value = '请输入短信验证码';
      return;
    }
    if (mode.value === 'password' && !password.value) {
      error.value = '请输入密码';
      return;
    }
    finish(() =>
      mode.value === 'sms'
        ? Auth.smsLogin({ mobile: mobile.value, code: code.value })
        : Auth.login({ mobile: mobile.value, password: password.value }),
    );
  }
  async function wechat(e) {
    if (!agreed.value || busy.value) return;
    if (!e.detail.code) {
      error.value = '未获取手机号授权，可重试或使用其他登录方式';
      return;
    }
    finish(async () => {
      const wx = await uni.login({ provider: 'weixin' });
      return Auth.weixinMiniAppLogin(e.detail.code, wx.code, 'default');
    });
  }
  async function policy(type) {
    try {
      const c = await edu.config();
      const url = type === 'terms' ? c.termsUrl : c.privacyUrl;
      if (!url) {
        toast('协议尚未发布，请联系机构');
        return;
      }
      uni.navigateTo({ url: '/pages/public/webview?url=' + encodeURIComponent(url) });
    } catch (e) {
      error.value = e.message;
    }
  }
</script>
<style scoped>
  .login {
    max-width: 520px;
  }
  .login-form {
    margin-top: 20px;
    padding: 24px;
  }
  .login-intro {
    padding: 16px 0 8px;
  }
  .login-intro .title {
    font-size: 30px;
    line-height: 1.3;
    margin: 14px 0;
  }
  .login-benefits {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    margin-top: 20px;
    color: #6e6e73;
    font-size: 14px;
  }
  .login-benefits text::before {
    content: '✓';
    color: #c94b00;
    margin-right: 5px;
  }
  .continuation-note {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 16px;
    margin-top: 12px;
    border-radius: 14px;
    background: #fff3e8;
  }
  .continuation-icon {
    font-size: 24px;
    color: #c94b00;
  }
  .password-row {
    display: flex;
    align-items: center;
    background: #f5f5f7;
    border-radius: 12px;
  }
  .password-row .input {
    flex: 1;
    min-width: 0;
  }
  .password-toggle {
    flex: none;
    padding: 12px;
    min-width: 56px;
    min-height: 44px;
    margin: 0;
    font-size: 14px;
    color: #c94b00;
    background: none;
  }
  .login-footnote {
    text-align: center;
    color: #6e6e73;
    font-size: 14px;
    margin: 20px 12px 4px;
  }
  .guest-link {
    display: block;
    margin: auto;
    min-height: 44px;
  }
  .login-form .chips {
    padding: 4px;
    border-radius: 12px;
    background: #f5f5f7;
    margin-bottom: 20px;
  }
  .login-form .chip {
    flex: 1;
    margin: 0;
    background: transparent;
    border-color: transparent;
  }
  .login-form .chip.active {
    background: #fff;
    color: #c94b00;
    box-shadow: 0 1px 4px #0000000a;
  }
  @media (max-width: 360px) {
    .login-form {
      padding: 16px;
    }
    .login-intro .title {
      font-size: 26px;
    }
    .sms {
      min-width: 96px;
    }
  }
  .sms {
    flex: none;
    font-size: 13px;
    min-width: 112px;
    padding: 12px;
  }
  .inline-link {
    display: inline;
    background: none;
    padding: 0;
    color: #c94b00;
    font-size: 14px;
    margin: 0;
    line-height: 1.5;
  }
</style>

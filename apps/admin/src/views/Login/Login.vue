<script setup lang="ts">
import {
  LoginForm,
  MobileForm,
  QrCodeForm,
  RegisterForm,
  SSOLoginVue,
  ForgetPasswordForm
} from './components'
defineOptions({ name: 'Login' })
</script>
<template>
  <main class="vibe-login"
    ><section class="vibe-login-story"
      ><div class="vibe-login-brand"
        ><img src="@/assets/svgs/vibe-logo.svg" alt="VIBE CODING" /><span
          >VIBE CODING<small>教学与成长工作台</small></span
        ></div
      ><div class="vibe-login-statement"
        ><p>FOR THE NEXT GENERATION OF CREATORS</p><h1>好奇心，<br />值得一堂好课。</h1
        ><span>把每一次尝试，变成孩子自己的创造。</span></div
      ><div class="vibe-login-footer"
        ><span>课程 · 教学 · 作品 · 成长</span><span>LET CURIOSITY BUILD.</span></div
      ></section
    ><section class="vibe-login-form"
      ><div class="vibe-login-mobile"
        ><img src="@/assets/svgs/vibe-logo.svg" alt="" />VIBE CODING 教务</div
      ><div class="vibe-login-card"
        ><p class="edu-eyebrow">WELCOME BACK / 欢迎回来</p
        ><LoginForm /><MobileForm /><QrCodeForm /><RegisterForm /><SSOLoginVue /><ForgetPasswordForm /><p
          class="edu-inline-note"
          style="text-align: center; margin-top: 22px"
          >使用机构分配的账号登录。<br />账号与教学范围由组织管理员统一管理。</p
        ></div
      ></section
    ></main
  >
</template>
<style scoped>
.vibe-login {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.08fr 1fr;
  background: #f5f5f7;
  color: #1d1d1f;
}
.vibe-login-story {
  background: #1d1d1f;
  color: #fff;
  padding: 48px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  box-sizing: border-box;
}
.vibe-login-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 20px;
  font-weight: 750;
  letter-spacing: -0.02em;
}
.vibe-login-brand img {
  width: 48px;
  height: 48px;
}
.vibe-login-brand small {
  display: block;
  font-size: 11px;
  color: #c0c0c7;
  font-weight: 400;
  letter-spacing: 0.12em;
  margin-top: 5px;
}
.vibe-login-statement {
  margin: auto 0;
  padding: 64px 0;
}
.vibe-login-statement p {
  font-size: 10px;
  letter-spacing: 0.17em;
  color: #ffae64;
}
.vibe-login-statement h1 {
  font-size: clamp(44px, 5vw, 78px);
  font-weight: 750;
  line-height: 1.16;
  letter-spacing: -0.05em;
  margin: 30px 0;
}
.vibe-login-statement > span {
  font-size: 16px;
  color: #b9b9c1;
}
.vibe-login-footer {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  font-size: 10px;
  letter-spacing: 0.09em;
  color: #99999f;
}
.vibe-login-form {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 36px;
}
.vibe-login-card {
  width: 100%;
  max-width: 390px;
}
.vibe-login-mobile {
  display: none;
}
@media (max-width: 900px) {
  .vibe-login {
    grid-template-columns: 1fr;
  }
  .vibe-login-story {
    display: none;
  }
  .vibe-login-form {
    flex-direction: column;
    gap: 50px;
    padding: 30px 22px;
  }
  .vibe-login-mobile {
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 700;
  }
  .vibe-login-mobile img {
    width: 36px;
    height: 36px;
  }
}
</style>

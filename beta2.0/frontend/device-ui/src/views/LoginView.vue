<template>
  <div class="login-page">
    <el-form class="login-panel" :model="form" @submit.prevent>
      <div class="login-brand">
        <span class="brand-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="14" rx="2" />
            <path d="M7 14v-3M12 14V8M17 14v-5" />
            <path d="M8 21h8" />
          </svg>
        </span>
        <h1>设备管理系统</h1>
        <p>Equipment Management System</p>
      </div>

      <el-form-item>
        <el-input v-model="form.username" placeholder="账号" size="large" :prefix-icon="User" autocomplete="username" />
      </el-form-item>

      <el-form-item>
        <el-input
          v-model="form.password"
          placeholder="密码"
          size="large"
          show-password
          :prefix-icon="Lock"
          autocomplete="current-password"
          @keyup.enter="submit"
        />
      </el-form-item>

      <el-button type="primary" size="large" :loading="loading" @click="submit">登 录</el-button>
    </el-form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { login } from '../api/auth'

const emit = defineEmits(['success'])
const loading = ref(false)
const form = reactive({
  username: '',
  password: ''
})

const submit = async () => {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }

  loading.value = true
  try {
    const user = await login(form)
    localStorage.setItem('auth_user', JSON.stringify(user))
    emit('success', user)
  } catch (e) {
    console.error('登录失败', e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: var(--page-bg);
  padding: 24px;
  box-sizing: border-box;
}

.login-panel {
  width: 380px;
  max-width: 100%;
  padding: 36px 32px 32px;
  background: #fff;
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
  box-sizing: border-box;
}

.login-brand {
  text-align: center;
  margin-bottom: 28px;
}

.brand-mark {
  width: 52px;
  height: 52px;
  display: inline-grid;
  place-items: center;
  border-radius: 14px;
  color: #fff;
  background: var(--el-color-primary);
  margin-bottom: 14px;
}

.brand-mark svg {
  width: 28px;
  height: 28px;
}

.login-brand h1 {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 600;
}

.login-brand p {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 0.6px;
}

.login-panel .el-button {
  width: 100%;
  letter-spacing: 4px;
}
</style>

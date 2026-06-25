<template>
  <div class="login-page">
    <el-form class="login-panel" :model="form" @submit.prevent>
      <h1>设备管理系统</h1>
      <p>请使用账号登录</p>

      <el-form-item>
        <el-input v-model="form.username" placeholder="账号" size="large" />
      </el-form-item>

      <el-form-item>
        <el-input v-model="form.password" placeholder="密码" size="large" show-password />
      </el-form-item>

      <el-button type="primary" size="large" :loading="loading" @click="submit">登录</el-button>
    </el-form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
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
  background: #f5f7fb;
  padding: 24px;
  box-sizing: border-box;
}

.login-panel {
  width: 360px;
  max-width: 100%;
  padding: 28px;
  background: #fff;
  border: 1px solid #e6e8ef;
  border-radius: 8px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
  box-sizing: border-box;
}

.login-panel h1 {
  margin: 0 0 8px;
  font-size: 26px;
  color: #1f2937;
}

.login-panel p {
  margin: 0 0 24px;
  color: #6b7280;
}

.login-panel .el-button {
  width: 100%;
}
</style>

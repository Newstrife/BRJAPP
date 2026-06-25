<template>
  <LoginView v-if="!user" @success="handleLogin" />
  <div v-else class="app-shell">
    <header class="app-header">
      <h1>设备管理系统</h1>
      <div class="user-actions">
        <span>{{ user.nickname || user.username }}</span>
        <el-button @click="passwordVisible = true">修改密码</el-button>
        <el-button @click="logout">退出</el-button>
      </div>
    </header>

    <el-tabs v-model="activeTab" class="app-tabs">
      <el-tab-pane label="设备列表" name="instruments">
        <InstrumentList />
      </el-tab-pane>
      <el-tab-pane label="企业微信" name="wecom">
        <WecomSettings />
      </el-tab-pane>
      <el-tab-pane v-if="user.username === 'admin'" label="账号管理" name="accounts">
        <AccountManager />
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="passwordVisible" title="修改密码" width="420px">
      <el-form :model="passwordForm" label-width="90px">
        <el-form-item label="原密码">
          <el-input v-model="passwordForm.oldPassword" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="passwordForm.newPassword" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPassword">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import LoginView from './views/LoginView.vue'
import InstrumentList from './views/InstrumentList.vue'
import AccountManager from './views/AccountManager.vue'
import WecomSettings from './views/WecomSettings.vue'
import { changePassword } from './api/user'

const savedUser = localStorage.getItem('auth_user')
const user = ref(savedUser ? JSON.parse(savedUser) : null)
const activeTab = ref('instruments')
const passwordVisible = ref(false)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: ''
})

const handleLogin = data => {
  user.value = data
  activeTab.value = 'instruments'
}

const logout = () => {
  localStorage.removeItem('auth_user')
  user.value = null
}

const submitPassword = async () => {
  if (!passwordForm.oldPassword || !passwordForm.newPassword) {
    ElMessage.warning('请输入原密码和新密码')
    return
  }

  await changePassword({ ...passwordForm })
  ElMessage.success('密码已修改，请重新登录')
  passwordVisible.value = false
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  logout()
}
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: #f5f7fb;
}

.app-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #e6e8ef;
  box-sizing: border-box;
}

.app-header h1 {
  margin: 0;
  font-size: 22px;
  color: #1f2937;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #4b5563;
}

.app-tabs {
  padding: 0 24px 24px;
}

:deep(.el-tabs__header) {
  margin: 0;
  background: #fff;
}
</style>

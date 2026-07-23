<template>
  <LoginView v-if="!user" @success="handleLogin" />
  <MobileShell v-else-if="isMobile" :user="user" @logout="logout" />
  <div v-else class="app-shell">
    <header class="app-header">
      <div class="brand">
        <span class="brand-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="14" rx="2" />
            <path d="M7 14v-3M12 14V8M17 14v-5" />
            <path d="M8 21h8" />
          </svg>
        </span>
        <div class="brand-text">
          <h1>设备管理系统</h1>
          <span class="brand-sub">Equipment Management</span>
        </div>
      </div>

      <el-dropdown trigger="click" @command="onUserCommand">
        <button class="user-chip" type="button">
          <span class="avatar">{{ userInitial }}</span>
          <span class="user-name">{{ user.nickname || user.username }}</span>
          <el-icon class="caret"><ArrowDown /></el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="password">
              <el-icon><Lock /></el-icon>修改密码
            </el-dropdown-item>
            <el-dropdown-item command="logout" divided>
              <el-icon><SwitchButton /></el-icon>退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </header>

    <main class="app-main">
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
        <el-tab-pane v-if="['admin', 'auditor'].includes(user.role)" label="审计日志" name="audit">
          <AuditLogs />
        </el-tab-pane>
      </el-tabs>
    </main>

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
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown, Lock, SwitchButton } from '@element-plus/icons-vue'
import LoginView from './views/LoginView.vue'
import InstrumentList from './views/InstrumentList.vue'
import AccountManager from './views/AccountManager.vue'
import WecomSettings from './views/WecomSettings.vue'
import AuditLogs from './views/AuditLogs.vue'
import MobileShell from './mobile/MobileShell.vue'
import { useIsMobile } from './utils/useIsMobile'
import { changePassword } from './api/user'

const savedUser = localStorage.getItem('auth_user')
const user = ref(savedUser ? JSON.parse(savedUser) : null)
const isMobile = useIsMobile()
const activeTab = ref('instruments')
const passwordVisible = ref(false)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: ''
})

const userInitial = computed(() =>
  (user.value?.nickname || user.value?.username || '?').slice(0, 1).toUpperCase()
)

const handleLogin = data => {
  user.value = data
  activeTab.value = 'instruments'
}

const logout = () => {
  localStorage.removeItem('auth_user')
  user.value = null
}

const onUserCommand = command => {
  if (command === 'password') passwordVisible.value = true
  if (command === 'logout') logout()
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
  background: var(--page-bg);
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid var(--panel-border);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.brand-mark {
  width: 36px;
  height: 36px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 9px;
  color: #fff;
  background: var(--el-color-primary);
}

.brand-mark svg {
  width: 20px;
  height: 20px;
}

.brand-text h1 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}

.brand-sub {
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 0.4px;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px 5px 5px;
  border: 1px solid var(--panel-border);
  border-radius: 999px;
  background: #fff;
  color: var(--text-strong);
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.user-chip:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
}

.avatar {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
}

.caret {
  color: var(--text-muted);
  font-size: 12px;
}

.app-main {
  padding-top: 4px;
}

.app-tabs {
  padding: 0 24px;
}

:deep(.el-tabs__header) {
  margin: 0;
}

:deep(.el-tabs__item) {
  font-size: 14px;
  height: 46px;
  line-height: 46px;
}

@media (max-width: 768px) {
  .app-header {
    padding: 0 12px;
  }

  .brand-sub {
    display: none;
  }

  .brand-text h1 {
    font-size: 15px;
  }

  .user-name {
    display: none;
  }

  .app-tabs {
    padding: 0 12px;
  }

  :deep(.el-tabs__item) {
    padding: 0 12px;
  }
}
</style>

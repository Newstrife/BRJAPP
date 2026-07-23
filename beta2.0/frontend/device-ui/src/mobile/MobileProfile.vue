<template>
  <div class="m-profile">
    <div class="m-user-card">
      <span class="m-avatar">{{ initial }}</span>
      <div class="m-user-info">
        <div class="m-user-name">{{ user.nickname || user.username }}</div>
        <div class="m-user-sub">
          {{ user.username }} ·
          <el-tag size="small" effect="plain">{{ roleLabel(user.role) }}</el-tag>
        </div>
      </div>
    </div>

    <div class="m-menu">
      <button class="m-menu-item" type="button" @click="passwordVisible = true">
        <el-icon><Lock /></el-icon>修改密码
        <el-icon class="m-menu-arrow"><ArrowRight /></el-icon>
      </button>
      <button class="m-menu-item m-menu-danger" type="button" @click="confirmLogout">
        <el-icon><SwitchButton /></el-icon>退出登录
        <el-icon class="m-menu-arrow"><ArrowRight /></el-icon>
      </button>
    </div>

    <div class="m-version">设备管理系统 · 移动端</div>

    <el-dialog v-model="passwordVisible" title="修改密码" width="92vw">
      <el-form label-position="top">
        <el-form-item label="原密码">
          <el-input v-model="passwordForm.oldPassword" show-password autocomplete="current-password" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="passwordForm.newPassword" show-password autocomplete="new-password" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitPassword">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Lock, SwitchButton, ArrowRight } from '@element-plus/icons-vue'
import { changePassword } from '../api/user'
import { roleLabel } from '../utils/format'
import { useBackToClose } from '../utils/useBackToClose'

const props = defineProps({
  user: { type: Object, required: true }
})

const emit = defineEmits(['logout'])

const passwordVisible = ref(false)
const saving = ref(false)

useBackToClose(passwordVisible)

const passwordForm = reactive({
  oldPassword: '',
  newPassword: ''
})

const initial = computed(() =>
  (props.user.nickname || props.user.username || '?').slice(0, 1).toUpperCase()
)

const submitPassword = async () => {
  if (!passwordForm.oldPassword || !passwordForm.newPassword) {
    ElMessage.warning('请输入原密码和新密码')
    return
  }

  saving.value = true
  try {
    await changePassword({ ...passwordForm })
    ElMessage.success('密码已修改，请重新登录')
    passwordVisible.value = false
    emit('logout')
  } finally {
    saving.value = false
  }
}

const confirmLogout = async () => {
  try {
    await ElMessageBox.confirm('确定退出登录吗？', '退出确认', {
      type: 'warning',
      confirmButtonText: '退出',
      cancelButtonText: '取消'
    })
    emit('logout')
  } catch (e) {
    // 用户取消
  }
}
</script>

<style scoped>
.m-profile {
  padding: 12px;
}

.m-user-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  padding: 18px 16px;
  margin-bottom: 12px;
}

.m-avatar {
  width: 52px;
  height: 52px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: #fff;
  font-size: 22px;
  font-weight: 600;
}

.m-user-name {
  font-size: 18px;
  font-weight: 600;
}

.m-user-sub {
  margin-top: 4px;
  font-size: 13px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}

.m-menu {
  background: #fff;
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  overflow: hidden;
}

.m-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 15px 16px;
  border: none;
  border-bottom: 1px solid #f1f3f8;
  background: #fff;
  font-size: 15px;
  color: var(--text-strong);
  cursor: pointer;
  text-align: left;
}

.m-menu-item:last-child {
  border-bottom: none;
}

.m-menu-item:active {
  background: #f8fafc;
}

.m-menu-arrow {
  margin-left: auto;
  color: var(--text-muted);
}

.m-menu-danger {
  color: var(--el-color-danger);
}

.m-version {
  margin-top: 24px;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}
</style>

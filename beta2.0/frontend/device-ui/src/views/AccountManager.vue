<template>
  <div class="page-panel">
    <div class="panel-title">
      <h2>账号管理</h2>
    </div>

    <el-form class="account-form" :model="form" inline>
      <el-form-item label="账号">
        <el-input v-model="form.username" placeholder="登录账号" />
      </el-form-item>
      <el-form-item label="用户昵称">
        <el-input v-model="form.nickname" placeholder="显示名称" />
      </el-form-item>
      <el-form-item label="密码">
        <el-input v-model="form.password" placeholder="登录密码" show-password />
      </el-form-item>
      <el-form-item label="角色">
        <el-select v-model="form.role" style="width: 120px">
          <el-option label="普通用户" value="user" />
          <el-option label="审计员" value="auditor" />
          <el-option label="管理员" value="admin" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Plus" @click="submit">新增账号</el-button>
        <el-button :icon="Edit" :disabled="!selectedUser" @click="openEdit()">编辑选中账号</el-button>
      </el-form-item>
    </el-form>

    <el-table
      v-loading="loading"
      :data="users"
      border
      highlight-current-row
      @current-change="selectedUser = $event"
    >
      <el-table-column prop="username" label="账号" min-width="120" show-overflow-tooltip />
      <el-table-column prop="nickname" label="用户昵称" min-width="120" show-overflow-tooltip />
      <el-table-column prop="role" label="角色" width="110" align="center">
        <template #default="scope">
          <el-tag :type="roleTag(scope.row.role)" effect="plain">{{ roleLabel(scope.row.role) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="scope">{{ formatTime(scope.row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="scope">
          <el-button size="small" :icon="Edit" @click="openEdit(scope.row)">编辑</el-button>
          <el-button
            size="small"
            type="danger"
            :icon="Delete"
            :disabled="scope.row.username === 'admin'"
            @click="removeUser(scope.row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="editVisible" title="编辑账号" width="480px">
      <el-form :model="editForm" label-width="90px">
        <el-form-item label="账号">
          <el-input v-model="editForm.username" disabled />
        </el-form-item>
        <el-form-item label="用户昵称">
          <el-input v-model="editForm.nickname" placeholder="显示名称" />
        </el-form-item>
        <el-form-item label="重置密码">
          <el-input v-model="editForm.password" placeholder="不填写则不修改密码" show-password />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="editForm.role" style="width: 160px">
            <el-option label="普通用户" value="user" />
            <el-option label="审计员" value="auditor" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { getUsers, createUser, updateUser, deleteUser } from '../api/user'

const users = ref([])
const loading = ref(false)
const selectedUser = ref(null)
const editVisible = ref(false)
const form = reactive({
  username: '',
  nickname: '',
  password: '',
  role: 'user'
})
const editForm = reactive({
  id: null,
  username: '',
  nickname: '',
  password: '',
  role: 'user'
})

const roleLabel = role => ({
  admin: '管理员',
  auditor: '审计员',
  user: '普通用户'
}[role] || role)

const roleTag = role => ({
  admin: 'danger',
  auditor: 'warning',
  user: 'info'
}[role] || 'info')

const formatTime = value => (value ? new Date(value).toLocaleString() : '-')

const loadUsers = async () => {
  loading.value = true
  try {
    users.value = await getUsers()
  } finally {
    loading.value = false
  }
}

const submit = async () => {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }

  await createUser({ ...form })
  ElMessage.success('账号已新增')
  form.username = ''
  form.nickname = ''
  form.password = ''
  form.role = 'user'
  await loadUsers()
}

const openEdit = (row = selectedUser.value) => {
  if (!row) return

  editForm.id = row.id
  editForm.username = row.username
  editForm.nickname = row.nickname || row.username
  editForm.password = ''
  editForm.role = row.role
  editVisible.value = true
}

const saveEdit = async () => {
  await updateUser(editForm.id, {
    nickname: editForm.nickname,
    password: editForm.password,
    role: editForm.role
  })

  ElMessage.success('账号已更新')
  editVisible.value = false
  await loadUsers()
}

const removeUser = async row => {
  try {
    await ElMessageBox.confirm(
      `确定删除账号「${row.username}」吗？`,
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      }
    )

    await deleteUser(row.id)
    ElMessage.success('账号已删除')
    await loadUsers()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('删除账号失败', e)
    }
  }
}

onMounted(loadUsers)
</script>

<style scoped>
.account-form {
  margin-bottom: 4px;
}

.account-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.account-form :deep(.el-input) {
  width: 180px;
}

@media (max-width: 768px) {
  .account-form :deep(.el-input) {
    width: 100%;
  }
}
</style>

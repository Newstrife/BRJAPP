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
          <el-option label="管理员" value="admin" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submit">新增账号</el-button>
        <el-button :disabled="!selectedUser" @click="openEdit">编辑选中账号</el-button>
      </el-form-item>
    </el-form>

    <el-table
      :data="users"
      border
      highlight-current-row
      @current-change="selectedUser = $event"
    >
      <el-table-column prop="username" label="账号" />
      <el-table-column prop="nickname" label="用户昵称" />
      <el-table-column prop="role" label="角色">
        <template #default="scope">
          {{ scope.row.role === 'admin' ? '管理员' : '普通用户' }}
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" />
      <el-table-column label="操作" width="100">
        <template #default="scope">
          <el-button size="small" @click="openEdit(scope.row)">编辑</el-button>
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
import { ElMessage } from 'element-plus'
import { getUsers, createUser, updateUser } from '../api/user'

const users = ref([])
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

const loadUsers = async () => {
  users.value = await getUsers()
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

onMounted(loadUsers)
</script>

<style scoped>
.page-panel {
  margin: 24px;
  padding: 20px;
  background: #fff;
  border: 1px solid #e6e8ef;
  border-radius: 8px;
}

.panel-title h2 {
  margin: 0 0 16px;
  font-size: 20px;
}

.account-form {
  margin-bottom: 12px;
}
</style>

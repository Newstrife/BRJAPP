<template>
  <div class="page-panel">
    <div class="panel-title">
      <h2>企业微信机器人</h2>
    </div>

    <el-form :model="form" label-width="120px">
      <el-form-item label="Webhook">
        <el-input
          v-model="form.webhook"
          placeholder="粘贴完整 Webhook 地址，或只填写 key"
          clearable
        />
      </el-form-item>
      <el-form-item label="测试内容">
        <el-input v-model="form.message" placeholder="企业微信机器人测试消息" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
        <el-button :loading="testing" @click="test">测试发送</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getWecomSetting, saveWecomSetting, testWecom } from '../api/wecom'

const saving = ref(false)
const testing = ref(false)
const form = reactive({
  webhook: '',
  message: '企业微信机器人测试消息'
})

const loadSetting = async () => {
  const data = await getWecomSetting()
  form.webhook = data.webhook || ''
}

const save = async () => {
  saving.value = true
  try {
    await saveWecomSetting({ webhook: form.webhook })
    ElMessage.success('已保存')
  } finally {
    saving.value = false
  }
}

const test = async () => {
  testing.value = true
  try {
    await testWecom({
      webhook: form.webhook,
      message: form.message
    })
    ElMessage.success('测试消息已发送')
  } finally {
    testing.value = false
  }
}

onMounted(loadSetting)
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
</style>

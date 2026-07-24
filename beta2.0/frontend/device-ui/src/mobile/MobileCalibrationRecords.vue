<template>
  <div class="m-records">
    <header class="m-records-header">
      <el-button class="m-back" :icon="ArrowLeft" text @click="$emit('close')">返回</el-button>
      <span class="m-records-title">计量记录</span>
      <el-button v-if="isAdmin" text type="primary" :icon="Plus" @click="openCreate">新增</el-button>
      <span v-else class="m-header-spacer" />
    </header>

    <div v-loading="loading" class="m-records-body">
      <div class="m-records-device">{{ instrumentLabel }}</div>

      <div v-for="item in records" :key="item.id" class="m-record-card">
        <div class="m-record-head">
          <el-tag size="small" :type="item.result === '不合格' ? 'danger' : 'success'" effect="light">
            {{ item.result || '未填写' }}
          </el-tag>
          <span class="m-record-date">{{ item.calibration_date || '-' }}</span>
        </div>
        <div class="m-record-info">{{ item.calibration_info }}</div>
        <div class="m-record-meta">
          <span>下次计量：{{ item.next_calibration_date || '-' }}</span>
          <span>录入：{{ item.created_by || '-' }}</span>
        </div>
        <a
          v-if="item.certificate_file"
          class="m-record-file"
          :href="fileUrl(item.certificate_file)"
          target="_blank"
        >
          <el-icon><Paperclip /></el-icon>{{ item.certificate_name || '查看证书附件' }}
        </a>
      </div>

      <el-empty v-if="!loading && records.length === 0" description="暂无计量记录" />
    </div>

    <el-drawer v-model="formVisible" :title="form.id ? '编辑计量记录' : '新增计量记录'" direction="btt" size="88%">
      <el-form label-position="top">
        <el-form-item label="计量结果" required>
          <el-radio-group v-model="form.result" style="width: 100%">
            <el-radio-button label="合格" style="width: 50%" />
            <el-radio-button label="不合格" style="width: 50%" />
          </el-radio-group>
        </el-form-item>
        <el-form-item label="计量信息" required>
          <el-input v-model="form.calibration_info" type="textarea" :rows="4" placeholder="请输入本次计量的详细信息" />
        </el-form-item>
        <el-form-item label="计量时间" required>
          <el-date-picker v-model="form.calibration_date" type="date" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="下次计量时间" required>
          <el-date-picker v-model="form.next_calibration_date" type="date" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="证书附件">
          <input type="file" @change="onFileChange" />
        </el-form-item>
      </el-form>
      <div class="m-drawer-actions">
        <el-button size="large" @click="formVisible = false">取消</el-button>
        <el-button size="large" type="primary" :loading="saving" @click="saveRecord">保存</el-button>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Plus, Paperclip } from '@element-plus/icons-vue'
import {
  getCalibrationRecords,
  createCalibrationRecord,
  updateCalibrationRecord
} from '../api/calibrationRecord'
import { formatDate } from '../utils/format'
import { useBackToClose } from '../utils/useBackToClose'

const props = defineProps({
  instrument: { type: Object, required: true }
})

const emit = defineEmits(['close', 'changed'])

const records = ref([])
const loading = ref(false)
const formVisible = ref(false)
const saving = ref(false)
const selectedFile = ref(null)

useBackToClose(formVisible)

const form = reactive({
  id: null,
  result: '合格',
  calibration_info: '',
  calibration_date: '',
  next_calibration_date: ''
})

const isAdmin = computed(() => {
  const savedUser = localStorage.getItem('auth_user')
  return savedUser ? JSON.parse(savedUser)?.role === 'admin' : false
})

const instrumentLabel = computed(() =>
  `${props.instrument.code || ''} ${props.instrument.name || ''}`.trim()
)

const fileUrl = file => {
  const relative = String(file).replaceAll('\\', '/').replace(/^\/+/, '').replace(/^uploads\//, '')
  const token = JSON.parse(localStorage.getItem('auth_user') || '{}').token || ''

  return `/api/files/${relative}?token=${encodeURIComponent(token)}`
}

const loadRecords = async () => {
  loading.value = true
  try {
    records.value = await getCalibrationRecords({ instrument_id: props.instrument.id })
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  form.id = null
  form.result = '合格'
  form.calibration_info = ''
  form.calibration_date = ''
  form.next_calibration_date = ''
  selectedFile.value = null
  formVisible.value = true
}

const onFileChange = event => {
  selectedFile.value = event.target.files?.[0] || null
}

const saveRecord = async () => {
  if (!form.calibration_info || !form.calibration_date || !form.next_calibration_date) {
    ElMessage.warning('请填写计量信息、计量时间和下次计量时间')
    return
  }

  saving.value = true
  try {
    const data = new FormData()
    data.append('instrument_id', props.instrument.id)
    data.append('result', form.result)
    data.append('calibration_info', form.calibration_info)
    data.append('calibration_date', formatDate(form.calibration_date))
    data.append('next_calibration_date', formatDate(form.next_calibration_date))
    if (selectedFile.value) data.append('certificate', selectedFile.value)

    if (form.id) {
      await updateCalibrationRecord(form.id, data)
    } else {
      await createCalibrationRecord(data)
    }

    ElMessage.success('计量记录已保存')
    formVisible.value = false
    await loadRecords()
    emit('changed')
  } finally {
    saving.value = false
  }
}

onMounted(loadRecords)
</script>

<style scoped>
.m-records {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  flex-direction: column;
  background: var(--page-bg);
}

.m-records-header {
  flex: none;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  background: #fff;
  border-bottom: 1px solid var(--panel-border);
}

.m-records-title {
  font-size: 16px;
  font-weight: 600;
}

.m-header-spacer {
  width: 56px;
}

.m-records-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.m-records-device {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.m-record-card {
  background: #fff;
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
}

.m-record-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.m-record-date {
  font-size: 13px;
  color: var(--text-muted);
}

.m-record-info {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 8px;
  white-space: pre-wrap;
}

.m-record-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-muted);
}

.m-record-file {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 13px;
  color: var(--el-color-primary);
  text-decoration: none;
}

.m-drawer-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.m-drawer-actions .el-button {
  flex: 1;
  margin: 0;
}
</style>

<template>
  <el-dialog v-model="visible" :title="title" width="960px" @open="loadRecords">
    <div class="records-header">
      <el-form class="record-query" :model="query" inline>
        <el-form-item label="验证结果">
          <el-select v-model="query.result" placeholder="全部" clearable style="width: 120px">
            <el-option label="合格" value="合格" />
            <el-option label="不合格" value="不合格" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadRecords">查询</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-button v-if="isAdmin" type="primary" :icon="Plus" @click="openCreate">新增验证记录</el-button>
    </div>

    <el-table :data="records" border>
      <el-table-column prop="result" label="验证结果" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.result === '不合格' ? 'danger' : 'success'" effect="light">
            {{ scope.row.result || '未填写' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="verification_info" label="验证信息" min-width="220" show-overflow-tooltip />
      <el-table-column prop="verification_date" label="验证时间" width="120" />
      <el-table-column prop="next_verification_date" label="下次验证时间" width="130" />
      <el-table-column prop="certificate_name" label="证书附件" min-width="160">
        <template #default="scope">
          <a v-if="scope.row.certificate_file" :href="fileUrl(scope.row.certificate_file)" target="_blank">
            {{ scope.row.certificate_name || '查看附件' }}
          </a>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="created_by" label="录入人" width="100" />
      <el-table-column v-if="isAdmin" label="操作" width="150">
        <template #default="scope">
          <el-button size="small" @click="openEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="removeRecord(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="formVisible"
      :title="form.id ? '编辑验证记录' : '新增验证记录'"
      width="620px"
      append-to-body
    >
      <el-form :model="form" :label-position="isMobile ? 'top' : 'left'" label-width="120px">
        <el-form-item label="设备">
          <el-input :model-value="instrumentLabel" disabled />
        </el-form-item>
        <el-form-item label="验证结果">
          <el-radio-group v-model="form.result">
            <el-radio-button label="合格" />
            <el-radio-button label="不合格" />
          </el-radio-group>
        </el-form-item>
        <el-form-item label="验证信息" required>
          <el-input
            v-model="form.verification_info"
            type="textarea"
            :rows="4"
            placeholder="请输入本次验证的详细信息"
          />
        </el-form-item>
        <el-form-item label="验证时间">
          <el-date-picker v-model="form.verification_date" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="下次验证时间">
          <el-date-picker v-model="form.next_verification_date" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="证书附件">
          <input type="file" @change="onFileChange" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveRecord">保存</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import {
  getVerificationRecords,
  createVerificationRecord,
  updateVerificationRecord,
  deleteVerificationRecord
} from '../api/verificationRecord'
import { useIsMobile } from '../utils/useIsMobile'
import { formatDate } from '../utils/format'

const props = defineProps({
  show: Boolean,
  instrument: {
    type: Object,
    default: null
  }
})
const emit = defineEmits(['update:show', 'changed'])

const visible = ref(props.show)
const isMobile = useIsMobile()
const records = ref([])
const formVisible = ref(false)
const saving = ref(false)
const selectedFile = ref(null)
const query = reactive({ result: '' })
const form = reactive({
  id: null,
  result: '合格',
  verification_info: '',
  verification_date: '',
  next_verification_date: ''
})

watch(() => props.show, val => {
  visible.value = val
})
watch(visible, val => {
  emit('update:show', val)
})

const currentUser = () => {
  const savedUser = localStorage.getItem('auth_user')
  return savedUser ? JSON.parse(savedUser) : null
}
const isAdmin = computed(() => currentUser()?.role === 'admin')
const instrumentLabel = computed(() => {
  if (!props.instrument) return ''
  return `${props.instrument.code || ''} ${props.instrument.name || ''}`.trim()
})
const title = computed(() => `验证记录 - ${instrumentLabel.value || '未选择设备'}`)

const fileUrl = file => {
  const relative = String(file).replaceAll('\\', '/').replace(/^\/+/, '').replace(/^uploads\//, '')
  const token = JSON.parse(localStorage.getItem('auth_user') || '{}').token || ''

  return `/api/files/${relative}?token=${encodeURIComponent(token)}`
}

const loadRecords = async () => {
  if (!props.instrument?.id) {
    records.value = []
    return
  }

  records.value = await getVerificationRecords({
    instrument_id: props.instrument.id,
    result: query.result
  })
}

const resetQuery = async () => {
  query.result = ''
  await loadRecords()
}

const openCreate = () => {
  form.id = null
  form.result = '合格'
  form.verification_info = ''
  form.verification_date = ''
  form.next_verification_date = ''
  selectedFile.value = null
  formVisible.value = true
}

const openEdit = row => {
  form.id = row.id
  form.result = row.result || '合格'
  form.verification_info = row.verification_info || ''
  form.verification_date = row.verification_date || ''
  form.next_verification_date = row.next_verification_date || ''
  selectedFile.value = null
  formVisible.value = true
}

const onFileChange = event => {
  selectedFile.value = event.target.files?.[0] || null
}

const toFormData = () => {
  const data = new FormData()
  data.append('instrument_id', props.instrument.id)
  data.append('result', form.result)
  data.append('verification_info', form.verification_info)
  data.append('verification_date', formatDate(form.verification_date))
  data.append('next_verification_date', formatDate(form.next_verification_date))
  if (selectedFile.value) data.append('certificate', selectedFile.value)
  return data
}

const saveRecord = async () => {
  if (!props.instrument?.id || !form.verification_date || !form.next_verification_date || !form.verification_info) {
    ElMessage.warning('请填写验证信息、验证时间和下次验证时间')
    return
  }

  saving.value = true
  try {
    if (form.id) {
      await updateVerificationRecord(form.id, toFormData())
      ElMessage.success('验证记录已更新')
    } else {
      await createVerificationRecord(toFormData())
      ElMessage.success('验证记录已新增')
    }

    formVisible.value = false
    await loadRecords()
    emit('changed')
  } finally {
    saving.value = false
  }
}

const removeRecord = async row => {
  try {
    await ElMessageBox.confirm('确定删除这条验证记录吗？', '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    await deleteVerificationRecord(row.id)
    ElMessage.success('验证记录已删除')
    await loadRecords()
    emit('changed')
  } catch (e) {
    if (e !== 'cancel') console.error('删除验证记录失败', e)
  }
}
</script>

<style scoped>
.records-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.record-query {
  margin-bottom: 0;
}
</style>

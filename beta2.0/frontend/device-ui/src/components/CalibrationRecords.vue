<template>
  <el-dialog v-model="visible" :title="title" width="960px" @open="loadRecords">
    <div class="records-header">
      <el-form class="record-query" :model="query" inline>
        <el-form-item label="计量结果">
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

      <el-button v-if="isAdmin" type="primary" :icon="Plus" @click="openCreate">新增计量记录</el-button>
    </div>

    <el-table :data="records" border>
      <el-table-column prop="result" label="计量结果" width="100" />
      <el-table-column prop="calibration_info" label="计量信息" min-width="220" show-overflow-tooltip />
      <el-table-column prop="calibration_date" label="计量时间" width="120" />
      <el-table-column prop="next_calibration_date" label="下次计量时间" width="130" />
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
      :title="form.id ? '编辑计量记录' : '新增计量记录'"
      width="620px"
      append-to-body
    >
      <el-form :model="form" :label-position="isMobile ? 'top' : 'left'" label-width="120px">
        <el-form-item label="设备">
          <el-input :model-value="instrumentLabel" disabled />
        </el-form-item>
        <el-form-item label="计量结果">
          <el-radio-group v-model="form.result">
            <el-radio-button label="合格" />
            <el-radio-button label="不合格" />
          </el-radio-group>
        </el-form-item>
        <el-form-item label="计量信息" required>
          <el-input
            v-model="form.calibration_info"
            type="textarea"
            :rows="4"
            placeholder="请输入本次计量的详细信息"
          />
        </el-form-item>
        <el-form-item label="计量时间">
          <el-date-picker v-model="form.calibration_date" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="下次计量时间">
          <el-date-picker v-model="form.next_calibration_date" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="证书附件">
          <input type="file" @change="onFileChange" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRecord">保存</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import {
  getCalibrationRecords,
  createCalibrationRecord,
  updateCalibrationRecord,
  deleteCalibrationRecord
} from '../api/calibrationRecord'
import { useIsMobile } from '../utils/useIsMobile'

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
const selectedFile = ref(null)
const query = reactive({ result: '' })
const form = reactive({
  id: null,
  result: '合格',
  calibration_info: '',
  calibration_date: '',
  next_calibration_date: ''
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
const isAdmin = computed(() => currentUser()?.username === 'admin')
const instrumentLabel = computed(() => {
  if (!props.instrument) return ''
  return `${props.instrument.code || ''} ${props.instrument.name || ''}`.trim()
})
const title = computed(() => `计量记录 - ${instrumentLabel.value || '未选择设备'}`)

const formatDate = value => {
  if (!value) return ''
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const fileUrl = file => {
  const normalized = String(file).replaceAll('\\', '/')
  return `/${normalized.replace(/^\/+/, '')}`
}

const loadRecords = async () => {
  if (!props.instrument?.id) {
    records.value = []
    return
  }

  records.value = await getCalibrationRecords({
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
  form.calibration_info = ''
  form.calibration_date = ''
  form.next_calibration_date = ''
  selectedFile.value = null
  formVisible.value = true
}

const openEdit = row => {
  form.id = row.id
  form.result = row.result || '合格'
  form.calibration_info = row.calibration_info || ''
  form.calibration_date = row.calibration_date || ''
  form.next_calibration_date = row.next_calibration_date || ''
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
  data.append('calibration_info', form.calibration_info)
  data.append('calibration_date', formatDate(form.calibration_date))
  data.append('next_calibration_date', formatDate(form.next_calibration_date))
  if (selectedFile.value) data.append('certificate', selectedFile.value)
  return data
}

const saveRecord = async () => {
  if (!props.instrument?.id || !form.calibration_date || !form.next_calibration_date || !form.calibration_info) {
    ElMessage.warning('请填写计量信息、计量时间和下次计量时间')
    return
  }

  if (form.id) {
    await updateCalibrationRecord(form.id, toFormData())
    ElMessage.success('计量记录已更新')
  } else {
    await createCalibrationRecord(toFormData())
    ElMessage.success('计量记录已新增')
  }

  formVisible.value = false
  await loadRecords()
  emit('changed')
}

const removeRecord = async row => {
  try {
    await ElMessageBox.confirm('确定删除这条计量记录吗？', '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    await deleteCalibrationRecord(row.id)
    ElMessage.success('计量记录已删除')
    await loadRecords()
    emit('changed')
  } catch (e) {
    if (e !== 'cancel') console.error('删除计量记录失败', e)
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

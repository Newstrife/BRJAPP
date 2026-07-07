<template>
  <div class="records-panel">
    <div class="records-header">
      <h2>计量记录</h2>
      <el-button v-if="isAdmin" type="primary" @click="openCreate">新增计量记录</el-button>
    </div>

    <el-form class="record-query" :model="query" inline>
      <el-form-item label="设备编号">
        <el-input v-model="query.instrument_code" placeholder="设备编号" clearable />
      </el-form-item>
      <el-form-item label="设备名称">
        <el-input v-model="query.instrument_name" placeholder="设备名称" clearable />
      </el-form-item>
      <el-form-item label="计量结果">
        <el-select v-model="query.result" placeholder="全部" clearable style="width: 120px">
          <el-option label="合格" value="合格" />
          <el-option label="不合格" value="不合格" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="loadRecords">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="records" border>
      <el-table-column prop="instrument_code" label="设备编号" />
      <el-table-column prop="instrument_name" label="设备名称" />
      <el-table-column prop="result" label="计量结果" width="110" />
      <el-table-column prop="calibration_date" label="计量时间" width="130" />
      <el-table-column prop="next_calibration_date" label="下次计量时间" width="140" />
      <el-table-column prop="certificate_name" label="证书附件">
        <template #default="scope">
          <a v-if="scope.row.certificate_file" :href="fileUrl(scope.row.certificate_file)" target="_blank">
            {{ scope.row.certificate_name || '查看附件' }}
          </a>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="created_by" label="录入人" width="120" />
      <el-table-column v-if="isAdmin" label="操作" width="150">
        <template #default="scope">
          <el-button size="small" @click="openEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="removeRecord(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑计量记录' : '新增计量记录'" width="620px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="设备">
          <el-select
            v-model="form.instrument_id"
            filterable
            placeholder="选择设备"
            style="width: 100%"
          >
            <el-option
              v-for="item in instruments"
              :key="item.id"
              :label="`${item.code || ''} ${item.name || ''}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="计量结果">
          <el-radio-group v-model="form.result">
            <el-radio-button label="合格" />
            <el-radio-button label="不合格" />
          </el-radio-group>
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
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRecord">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getList } from '../api/instrument'
import {
  getCalibrationRecords,
  createCalibrationRecord,
  updateCalibrationRecord,
  deleteCalibrationRecord
} from '../api/calibrationRecord'

const records = ref([])
const instruments = ref([])
const dialogVisible = ref(false)
const selectedFile = ref(null)
const query = reactive({
  instrument_code: '',
  instrument_name: '',
  result: ''
})
const form = reactive({
  id: null,
  instrument_id: null,
  result: '合格',
  calibration_date: '',
  next_calibration_date: ''
})

const currentUser = () => {
  const savedUser = localStorage.getItem('auth_user')
  return savedUser ? JSON.parse(savedUser) : null
}
const isAdmin = computed(() => currentUser()?.username === 'admin')

const formatDate = value => {
  if (!value) return ''
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const fileUrl = file => {
  const normalized = String(file).replaceAll('\\', '/')
  return `${window.location.protocol}//${window.location.hostname}:3000/${normalized}`
}

const loadRecords = async () => {
  records.value = await getCalibrationRecords(query)
}

const loadInstruments = async () => {
  instruments.value = await getList({})
}

const resetQuery = async () => {
  query.instrument_code = ''
  query.instrument_name = ''
  query.result = ''
  await loadRecords()
}

const openCreate = () => {
  form.id = null
  form.instrument_id = null
  form.result = '合格'
  form.calibration_date = ''
  form.next_calibration_date = ''
  selectedFile.value = null
  dialogVisible.value = true
}

const openEdit = row => {
  form.id = row.id
  form.instrument_id = row.instrument_id
  form.result = row.result || '合格'
  form.calibration_date = row.calibration_date || ''
  form.next_calibration_date = row.next_calibration_date || ''
  selectedFile.value = null
  dialogVisible.value = true
}

const onFileChange = event => {
  selectedFile.value = event.target.files?.[0] || null
}

const toFormData = () => {
  const data = new FormData()
  data.append('instrument_id', form.instrument_id)
  data.append('result', form.result)
  data.append('calibration_date', formatDate(form.calibration_date))
  data.append('next_calibration_date', formatDate(form.next_calibration_date))
  if (selectedFile.value) data.append('certificate', selectedFile.value)
  return data
}

const saveRecord = async () => {
  if (!form.instrument_id || !form.calibration_date || !form.next_calibration_date) {
    ElMessage.warning('请选择设备、计量时间和下次计量时间')
    return
  }

  if (form.id) {
    await updateCalibrationRecord(form.id, toFormData())
    ElMessage.success('计量记录已更新')
  } else {
    await createCalibrationRecord(toFormData())
    ElMessage.success('计量记录已新增')
  }

  dialogVisible.value = false
  await loadRecords()
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
  } catch (e) {
    if (e !== 'cancel') console.error('删除计量记录失败', e)
  }
}

onMounted(async () => {
  await Promise.all([loadRecords(), loadInstruments()])
})
</script>

<style scoped>
.records-panel {
  margin: 24px;
  padding: 20px;
  background: #fff;
  border: 1px solid #e6e8ef;
  border-radius: 8px;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.records-header h2 {
  margin: 0;
  font-size: 20px;
}

.record-query {
  margin-bottom: 12px;
}
</style>

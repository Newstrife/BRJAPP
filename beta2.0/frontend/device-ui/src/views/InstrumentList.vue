<template>
  <div class="page-panel instrument-list">
    <div class="panel-title">
      <h2>设备列表</h2>
      <div v-if="isAdmin" class="panel-actions">
        <el-button type="primary" :icon="Plus" @click="showAdd = true">新增设备</el-button>
        <el-upload
          class="upload-btn"
          :show-file-list="false"
          :http-request="uploadExcel"
          accept=".xlsx,.xls"
        >
          <el-button :icon="Upload">导入 Excel</el-button>
        </el-upload>
        <el-button :icon="Document" @click="downloadTemplate">下载模板</el-button>
        <el-button :icon="Download" @click="exportExcelFile">导出</el-button>
      </div>
    </div>

    <div class="filter-card">
      <el-form class="toolbar" :model="query" inline>
      <el-form-item label="设备编号">
        <el-input v-model="query.code" placeholder="设备编号" clearable />
      </el-form-item>
      <el-form-item label="设备名称">
        <el-input v-model="query.name" placeholder="设备名称" clearable />
      </el-form-item>
      <el-form-item label="注意事项">
        <el-input v-model="query.usage_notes" placeholder="仪器使用注意事项" clearable />
      </el-form-item>
      <el-form-item label="位置">
        <el-input v-model="query.location" placeholder="存放位置" clearable />
      </el-form-item>
      <el-form-item label="部门">
        <el-input v-model="query.department" placeholder="所属部门" clearable />
      </el-form-item>
      <el-form-item label="设备状态">
        <el-select v-model="query.status" placeholder="全部" clearable>
          <el-option label="正常" value="normal" />
          <el-option label="维修" value="repair" />
          <el-option label="暂停" value="paused" />
          <el-option label="报废" value="scrapped" />
        </el-select>
      </el-form-item>
      <el-form-item label="计量/验证状态">
        <el-select v-model="query.calibration_status" placeholder="全部" clearable>
          <el-option label="未计量" value="uncalibrated" />
          <el-option label="正常" value="normal" />
          <el-option label="已计量未验证" value="calibrated_unverified" />
          <el-option label="即将到期" value="due_soon" />
          <el-option label="已过期" value="expired" />
          <el-option label="不合格" value="failed" />
        </el-select>
      </el-form-item>
      <el-form-item class="filter-actions">
        <el-button type="primary" :icon="Search" @click="search">搜索</el-button>
        <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
      </el-form>
    </div>

    <el-table v-loading="loading" :data="list" border stripe @row-dblclick="openDetail">
      <el-table-column prop="code" label="设备编号" min-width="110" show-overflow-tooltip />
      <el-table-column prop="name" label="设备名称" min-width="130" show-overflow-tooltip />
      <el-table-column prop="model" label="型号规格" min-width="120" show-overflow-tooltip />
      <el-table-column prop="location" label="存放位置" min-width="100" show-overflow-tooltip />
      <el-table-column prop="department" label="所属部门" min-width="100" show-overflow-tooltip />
      <el-table-column prop="owner" label="责任人" min-width="80" show-overflow-tooltip />
      <el-table-column prop="next_calibration_date" label="下次计量时间" width="115" />
      <el-table-column label="设备状态" width="90" align="center">
        <template #default="scope">
          <el-tag :type="deviceStatusTag(scope.row.status)" effect="plain">
            {{ deviceStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="计量/验证状态" width="120" align="center">
        <template #default="scope">
          <el-tag :type="calibrationTag(scope.row.calibration_status)" effect="light">
            {{ calibrationText(scope.row.calibration_status, scope.row.calibration_mode, scope.row.lock_reason) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" :width="isAdmin ? 310 : 200">
        <template #default="scope">
          <el-button size="small" @click.stop="openCalibrationRecords(scope.row)">计量记录</el-button>
          <el-button
            v-if="scope.row.calibration_mode === 'calibration_verification'"
            size="small"
            type="warning"
            @click.stop="openVerificationRecords(scope.row)"
          >
            验证记录
          </el-button>
          <el-button v-if="isAdmin" size="small" type="primary" @click.stop="openEdit(scope.row)">编辑</el-button>
          <el-button v-if="isAdmin" size="small" type="danger" @click.stop="removeDevice(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        background
        @current-change="loadData"
      />
    </div>

    <InstrumentForm v-model:show="showAdd" @success="handleFormSuccess" />

    <el-dialog v-model="detailVisible" title="设备详情" width="820px">
      <el-descriptions v-if="detail" :column="isMobile ? 1 : 2" border>
        <el-descriptions-item label="设备编号">{{ detail.code }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ detail.name }}</el-descriptions-item>
        <el-descriptions-item label="型号规格">{{ detail.model }}</el-descriptions-item>
        <el-descriptions-item label="厂家">{{ detail.manufacturer }}</el-descriptions-item>
        <el-descriptions-item label="入库日期">{{ detail.purchase_date }}</el-descriptions-item>
        <el-descriptions-item label="存放位置（房间号）">{{ detail.location }}</el-descriptions-item>
        <el-descriptions-item label="所属部门">{{ detail.department }}</el-descriptions-item>
        <el-descriptions-item label="责任人">{{ detail.owner }}</el-descriptions-item>
        <el-descriptions-item label="固定资产编号">{{ detail.asset_code }}</el-descriptions-item>
        <el-descriptions-item label="设备状态">{{ deviceStatusText(detail.status) }}</el-descriptions-item>
        <el-descriptions-item label="计量/验证状态">{{ calibrationText(detail.calibration_status, detail.calibration_mode, detail.lock_reason) }}</el-descriptions-item>
        <el-descriptions-item label="校准方式">{{ calibrationModeText(detail.calibration_mode) }}</el-descriptions-item>
        <el-descriptions-item label="验证情况">{{ verificationResultText(detail.verification_result) }}</el-descriptions-item>
        <el-descriptions-item label="下次验证日期">{{ detail.next_verification_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="计量结果">{{ detail.calibration_result || '-' }}</el-descriptions-item>
        <el-descriptions-item label="本次计量时间">{{ detail.last_calibration_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="下次计量时间">{{ detail.next_calibration_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="仪器使用注意事项" :span="2">{{ detail.usage_notes || '-' }}</el-descriptions-item>
        <el-descriptions-item label="计量说明" :span="2">{{ detail.calibration_note || '-' }}</el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editVisible" title="编辑设备资料" width="820px">
      <el-form
        :model="editForm"
        :rules="editRules"
        ref="editFormRef"
        :label-width="isMobile ? 'auto' : '150px'"
        :label-position="isMobile ? 'top' : 'left'"
      >
        <el-form-item label="设备编号" prop="code"><el-input v-model="editForm.code" /></el-form-item>
        <el-form-item label="设备名称" prop="name"><el-input v-model="editForm.name" /></el-form-item>
        <el-form-item label="型号规格" prop="model"><el-input v-model="editForm.model" /></el-form-item>
        <el-form-item label="厂家" prop="manufacturer"><el-input v-model="editForm.manufacturer" /></el-form-item>
        <el-form-item label="入库日期" prop="purchase_date"><el-date-picker v-model="editForm.purchase_date" type="date" /></el-form-item>
        <el-form-item label="存放位置（房间号）" prop="location"><el-input v-model="editForm.location" /></el-form-item>
        <el-form-item label="所属部门" prop="department"><el-input v-model="editForm.department" /></el-form-item>
        <el-form-item label="责任人" prop="owner"><el-input v-model="editForm.owner" /></el-form-item>
        <el-form-item label="固定资产编号" prop="asset_code"><el-input v-model="editForm.asset_code" /></el-form-item>
        <el-form-item label="仪器使用注意事项" prop="usage_notes">
          <el-input v-model="editForm.usage_notes" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="设备状态">
          <el-select v-model="editForm.status">
            <el-option label="正常" value="normal" />
            <el-option label="维修" value="repair" />
            <el-option label="暂停" value="paused" />
            <el-option label="报废" value="scrapped" />
          </el-select>
        </el-form-item>
        <el-form-item label="计量/验证状态">
          <el-select v-model="editForm.calibration_status">
            <el-option label="未计量" value="uncalibrated" />
            <el-option label="正常" value="normal" />
            <el-option label="已计量未验证" value="calibrated_unverified" />
            <el-option label="即将到期" value="due_soon" />
            <el-option label="已过期" value="expired" />
            <el-option label="不合格" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item label="校准方式">
          <el-select v-model="editForm.calibration_mode">
            <el-option label="计量" value="calibration" />
            <el-option label="计量+验证" value="calibration_verification" />
          </el-select>
        </el-form-item>
        <el-form-item label="验证情况">
          <el-select v-model="editForm.verification_result">
            <el-option label="未验证" value="unverified" />
            <el-option label="合格" value="passed" />
            <el-option label="不合格" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item label="下次验证日期" prop="next_verification_date">
          <el-date-picker v-model="editForm.next_verification_date" type="date" />
        </el-form-item>
        <el-form-item label="计量结果" prop="calibration_result"><el-input v-model="editForm.calibration_result" /></el-form-item>
        <el-form-item label="本次计量时间" prop="last_calibration_date"><el-date-picker v-model="editForm.last_calibration_date" type="date" /></el-form-item>
        <el-form-item label="下次计量时间" prop="next_calibration_date"><el-date-picker v-model="editForm.next_calibration_date" type="date" /></el-form-item>
        <el-form-item label="计量说明" prop="calibration_note">
          <el-input v-model="editForm.calibration_note" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="锁定设备">
          <el-switch v-model="editForm.locked" />
        </el-form-item>
        <el-form-item label="锁定原因"><el-input v-model="editForm.lock_reason" /></el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>

    <CalibrationRecords
      v-model:show="calibrationRecordsVisible"
      :instrument="calibrationInstrument"
      @changed="loadData"
    />

    <VerificationRecords
      v-model:show="verificationRecordsVisible"
      :instrument="verificationInstrument"
      @changed="loadData"
    />
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Upload, Download, Document } from '@element-plus/icons-vue'
import {
  getList,
  deleteInstrument,
  exportExcel,
  importExcel,
  updateCalibration,
  updateInstrument
} from '../api/instrument'
import InstrumentForm from '../components/InstrumentForm.vue'
import CalibrationRecords from '../components/CalibrationRecords.vue'
import VerificationRecords from '../components/VerificationRecords.vue'
import { useIsMobile } from '../utils/useIsMobile'
import { loadFieldConfig, buildRules } from '../utils/fieldConfig'
import { pendingInstrumentFilter } from '../utils/dashboardFilter'
import { calibrationModeText, verificationResultText, deviceStatusText, deviceStatusTag, calibrationText, calibrationTag } from '../utils/format'

const list = ref([])
const loading = ref(false)
const isMobile = useIsMobile()
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const query = reactive({
  code: '',
  name: '',
  usage_notes: '',
  location: '',
  department: '',
  status: '',
  calibration_status: '',
  calibration_mode: '', // 仅由门户卡片跳转带入，不参与界面筛选
  verification_result: '' // 仅由门户卡片跳转带入，不参与界面筛选
})
const showAdd = ref(false)
const detailVisible = ref(false)
const editVisible = ref(false)
const editFormRef = ref(null)
const editRules = computed(() => buildRules())
const detail = ref(null)
const calibrationRecordsVisible = ref(false)
const calibrationInstrument = ref(null)
const verificationRecordsVisible = ref(false)
const verificationInstrument = ref(null)
const calibrationForm = reactive({
  calibration_result: '合格',
  last_calibration_date: '',
  next_calibration_date: '',
  calibration_note: ''
})
const editForm = reactive({
  id: null,
  code: '',
  name: '',
  model: '',
  manufacturer: '',
  purchase_date: '',
  location: '',
  department: '',
  owner: '',
  asset_code: '',
  status: 'normal',
  usage_notes: '',
  calibration_status: 'uncalibrated',
  calibration_mode: 'calibration',
  verification_result: 'unverified',
  next_verification_date: '',
  calibration_result: '',
  calibration_note: '',
  last_calibration_date: '',
  next_calibration_date: '',
  locked: false,
  lock_reason: ''
})

const getCurrentUser = () => {
  const savedUser = localStorage.getItem('auth_user')
  return savedUser ? JSON.parse(savedUser) : null
}

const isAdmin = computed(() => getCurrentUser()?.username === 'admin')

const formatDate = value => {
  if (!value) return null
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const toPayload = form => ({
  ...form,
  purchase_date: formatDate(form.purchase_date),
  last_calibration_date: formatDate(form.last_calibration_date),
  next_calibration_date: formatDate(form.next_calibration_date),
  next_verification_date: formatDate(form.next_verification_date)
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await getList({ ...query, page: page.value, pageSize: pageSize.value })
    list.value = res.list || []
    total.value = res.total || 0
  } catch (e) {
    console.error('加载失败', e)
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const search = () => {
  query.calibration_mode = '' // 手动查询时清除门户带入的校准方式筛选
  query.verification_result = '' // 手动查询时清除门户带入的验证情况筛选
  page.value = 1
  loadData()
}

const resetQuery = async () => {
  query.code = ''
  query.name = ''
  query.usage_notes = ''
  query.location = ''
  query.department = ''
  query.status = ''
  query.calibration_status = ''
  query.calibration_mode = ''
  query.verification_result = ''
  page.value = 1
  await loadData()
}

// 设备门户卡片跳转：清空其他条件，应用门户选择的筛选
const applyExternalFilter = () => {
  query.code = ''
  query.name = ''
  query.usage_notes = ''
  query.location = ''
  query.department = ''
  query.status = pendingInstrumentFilter.status || ''
  query.calibration_status = pendingInstrumentFilter.calibration_status
  query.calibration_mode = pendingInstrumentFilter.calibration_mode || ''
  query.verification_result = pendingInstrumentFilter.verification_result || ''
  page.value = 1
  loadData()
}

watch(() => pendingInstrumentFilter.ts, applyExternalFilter)

const handleFormSuccess = async () => {
  showAdd.value = false
  await loadData()
}

const openDetail = row => {
  detail.value = row
  calibrationForm.calibration_result = row.calibration_result || '合格'
  calibrationForm.last_calibration_date = row.last_calibration_date || ''
  calibrationForm.next_calibration_date = row.next_calibration_date || ''
  calibrationForm.calibration_note = row.calibration_note || ''
  detailVisible.value = true
}

const openCalibrationRecords = row => {
  calibrationInstrument.value = row
  calibrationRecordsVisible.value = true
}

const openVerificationRecords = row => {
  verificationInstrument.value = row
  verificationRecordsVisible.value = true
}

const openEdit = row => {
  Object.assign(editForm, {
    id: row.id,
    code: row.code || '',
    name: row.name || '',
    model: row.model || '',
    manufacturer: row.manufacturer || '',
    purchase_date: row.purchase_date || '',
    location: row.location || '',
    department: row.department || '',
    owner: row.owner || '',
    asset_code: row.asset_code || '',
    status: row.status || 'normal',
    usage_notes: row.usage_notes || '',
    calibration_status: row.calibration_status || 'uncalibrated',
    calibration_mode: row.calibration_mode || 'calibration',
    verification_result: row.verification_result || 'unverified',
    next_verification_date: row.next_verification_date || '',
    calibration_result: row.calibration_result || '',
    calibration_note: row.calibration_note || '',
    last_calibration_date: row.last_calibration_date || '',
    next_calibration_date: row.next_calibration_date || '',
    locked: Boolean(row.locked),
    lock_reason: row.lock_reason || ''
  })
  editVisible.value = true
  loadFieldConfig()
}

const saveEdit = async () => {
  const valid = await editFormRef.value.validate().catch(() => false)
  if (!valid) return

  await updateInstrument(editForm.id, toPayload(editForm))
  ElMessage.success('设备资料已保存')
  editVisible.value = false
  await loadData()
}

const saveCalibration = async () => {
  if (!detail.value) return

  const updated = await updateCalibration(detail.value.id, {
    calibration_result: calibrationForm.calibration_result,
    calibration_note: calibrationForm.calibration_note,
    last_calibration_date: formatDate(calibrationForm.last_calibration_date),
    next_calibration_date: formatDate(calibrationForm.next_calibration_date)
  })
  detail.value = updated
  ElMessage.success('计量结果已保存')
  await loadData()
}

const removeDevice = async row => {
  try {
    await ElMessageBox.confirm(
      `确定删除设备「${row.name || row.code}」吗？删除后不可恢复。`,
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      }
    )

    await deleteInstrument(row.id)
    ElMessage.success('设备已删除')
    await loadData()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('删除失败', e)
    }
  }
}

const uploadExcel = async ({ file }) => {
  try {
    const data = new FormData()
    data.append('file', file)
    const res = await importExcel(data)

    ElMessage.success(
      `导入成功 ${res.imported} 条` + (res.skipped ? `，跳过重复编号 ${res.skipped} 条` : '')
    )
    await loadData()
  } catch (e) {
    console.error('导入失败', e)
  }
}

const exportExcelFile = async () => {
  try {
    const res = await exportExcel(query)
    const url = URL.createObjectURL(new Blob([res]))
    const link = document.createElement('a')
    link.href = url
    link.download = 'devices.xlsx'
    link.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('导出失败', e)
  }
}

const downloadTemplate = () => {
  const link = document.createElement('a')
  link.href = '/templates/device-import-template.xlsx'
  link.download = '设备导入模板.xlsx'
  link.click()
}

onMounted(() => {
  if (pendingInstrumentFilter.ts) {
    applyExternalFilter()
  } else {
    loadData()
  }
})
</script>

<style scoped>
.panel-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-actions .upload-btn {
  display: inline-flex;
}

.filter-card {
  margin-bottom: 14px;
  padding: 14px 14px 0;
  background: #f8fafc;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
}

.filter-card :deep(.el-form-item) {
  margin-bottom: 14px;
}

.filter-card :deep(.el-input),
.filter-card :deep(.el-select) {
  width: 170px;
}

.filter-actions :deep(.el-form-item__content) {
  margin-left: 4px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

@media (max-width: 768px) {
  .panel-actions {
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .filter-card :deep(.el-input),
  .filter-card :deep(.el-select) {
    width: 100%;
  }
}
</style>

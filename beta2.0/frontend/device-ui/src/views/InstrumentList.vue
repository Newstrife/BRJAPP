<template>
  <div class="instrument-list">
    <el-form class="toolbar" :model="query" inline>
      <el-form-item label="设备编号">
        <el-input v-model="query.code" placeholder="设备编号" clearable />
      </el-form-item>
      <el-form-item label="设备名称">
        <el-input v-model="query.name" placeholder="设备名称" clearable />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
          <el-option label="空闲" value="idle" />
          <el-option label="使用中" value="in_use" />
          <el-option label="维修中" value="repair" />
          <el-option label="报废" value="scrapped" />
        </el-select>
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
      <el-form-item>
        <el-button @click="loadData">搜索</el-button>
        <el-button @click="resetQuery">重置</el-button>
        <el-button v-if="isAdmin" type="primary" @click="showAdd = true">新增</el-button>
        <el-upload v-if="isAdmin" :show-file-list="false" :http-request="uploadExcel" accept=".xlsx,.xls">
          <el-button>导入 Excel</el-button>
        </el-upload>
        <el-button v-if="isAdmin" @click="exportExcelFile">导出</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="list" border @row-dblclick="openDetail">
      <el-table-column prop="code" label="设备编号" />
      <el-table-column prop="name" label="设备名称" />
      <el-table-column prop="model" label="型号规格" />
      <el-table-column prop="location" label="存放位置" />
      <el-table-column prop="department" label="所属部门" />
      <el-table-column prop="owner" label="责任人" />
      <el-table-column prop="borrower" label="当前领用人" width="120">
        <template #default="scope">{{ scope.row.borrower || '-' }}</template>
      </el-table-column>
      <el-table-column prop="next_calibration_date" label="下次计量时间" width="140" />
      <el-table-column label="计量状态" width="120">
        <template #default="scope">
          <el-tag :type="calibrationTag(scope.row.calibration_status)">
            {{ calibrationText(scope.row.calibration_status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="使用状态" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 'idle'" type="success">空闲</el-tag>
          <el-tag v-else-if="scope.row.status === 'in_use'" type="warning">使用中</el-tag>
          <el-tag v-else-if="scope.row.status === 'repair'" type="danger">维修中</el-tag>
          <el-tag v-else>已报废</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" :width="isAdmin ? 300 : 180">
        <template #default="scope">
          <el-button size="small" :disabled="scope.row.status !== 'idle'" @click.stop="use(scope.row)">领用</el-button>
          <el-button size="small" :disabled="!canReturn(scope.row)" @click.stop="ret(scope.row)">归还</el-button>
          <el-button v-if="isAdmin" size="small" type="primary" @click.stop="openEdit(scope.row)">编辑</el-button>
          <el-button v-if="isAdmin" size="small" type="danger" @click.stop="removeDevice(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <InstrumentForm v-model:show="showAdd" @success="handleFormSuccess" />

    <el-dialog v-model="detailVisible" title="设备详情" width="820px">
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="设备编号">{{ detail.code }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ detail.name }}</el-descriptions-item>
        <el-descriptions-item label="型号规格">{{ detail.model }}</el-descriptions-item>
        <el-descriptions-item label="厂家">{{ detail.manufacturer }}</el-descriptions-item>
        <el-descriptions-item label="入库日期">{{ detail.purchase_date }}</el-descriptions-item>
        <el-descriptions-item label="存放位置（房间号）">{{ detail.location }}</el-descriptions-item>
        <el-descriptions-item label="所属部门">{{ detail.department }}</el-descriptions-item>
        <el-descriptions-item label="责任人">{{ detail.owner }}</el-descriptions-item>
        <el-descriptions-item label="使用状态">{{ statusText(detail.status) }}</el-descriptions-item>
        <el-descriptions-item label="固定资产编号">{{ detail.asset_code }}</el-descriptions-item>
        <el-descriptions-item label="当前领用人">{{ detail.borrower || '-' }}</el-descriptions-item>
        <el-descriptions-item label="计量状态">{{ calibrationText(detail.calibration_status) }}</el-descriptions-item>
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
      <el-form :model="editForm" label-width="150px" label-position="left">
        <el-form-item label="设备编号"><el-input v-model="editForm.code" /></el-form-item>
        <el-form-item label="设备名称"><el-input v-model="editForm.name" /></el-form-item>
        <el-form-item label="型号规格"><el-input v-model="editForm.model" /></el-form-item>
        <el-form-item label="厂家"><el-input v-model="editForm.manufacturer" /></el-form-item>
        <el-form-item label="入库日期"><el-date-picker v-model="editForm.purchase_date" type="date" /></el-form-item>
        <el-form-item label="存放位置（房间号）"><el-input v-model="editForm.location" /></el-form-item>
        <el-form-item label="所属部门"><el-input v-model="editForm.department" /></el-form-item>
        <el-form-item label="责任人"><el-input v-model="editForm.owner" /></el-form-item>
        <el-form-item label="当前领用人"><el-input v-model="editForm.borrower" /></el-form-item>
        <el-form-item label="固定资产编号"><el-input v-model="editForm.asset_code" /></el-form-item>
        <el-form-item label="仪器使用注意事项">
          <el-input v-model="editForm.usage_notes" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="使用状态">
          <el-select v-model="editForm.status">
            <el-option label="空闲" value="idle" />
            <el-option label="使用中" value="in_use" />
            <el-option label="维修中" value="repair" />
            <el-option label="报废" value="scrapped" />
          </el-select>
        </el-form-item>
        <el-form-item label="计量状态">
          <el-select v-model="editForm.calibration_status">
            <el-option label="未校准" value="uncalibrated" />
            <el-option label="正常" value="normal" />
            <el-option label="即将到期" value="due_soon" />
            <el-option label="已过期" value="expired" />
            <el-option label="校准不合格" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item label="计量结果"><el-input v-model="editForm.calibration_result" /></el-form-item>
        <el-form-item label="本次计量时间"><el-date-picker v-model="editForm.last_calibration_date" type="date" /></el-form-item>
        <el-form-item label="下次计量时间"><el-date-picker v-model="editForm.next_calibration_date" type="date" /></el-form-item>
        <el-form-item label="计量说明">
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

    <CalibrationRecords />
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getList,
  useDevice,
  returnDevice,
  deleteInstrument,
  exportExcel,
  importExcel,
  updateCalibration,
  updateInstrument
} from '../api/instrument'
import InstrumentForm from '../components/InstrumentForm.vue'
import CalibrationRecords from '../components/CalibrationRecords.vue'

const list = ref([])
const query = reactive({
  code: '',
  name: '',
  status: '',
  usage_notes: '',
  location: '',
  department: ''
})
const showAdd = ref(false)
const detailVisible = ref(false)
const editVisible = ref(false)
const detail = ref(null)
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
  borrower: '',
  asset_code: '',
  status: 'idle',
  usage_notes: '',
  calibration_status: 'uncalibrated',
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

const canReturn = row => {
  if (row.status !== 'in_use') return false

  const user = getCurrentUser()
  if (user?.username === 'admin') return true

  return [user?.nickname, user?.username].filter(Boolean).includes(row.borrower)
}

const formatDate = value => {
  if (!value) return null
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const statusText = status => ({
  idle: '空闲',
  in_use: '使用中',
  repair: '维修中',
  scrapped: '已报废'
}[status] || status)

const calibrationText = status => ({
  uncalibrated: '未校准',
  normal: '正常',
  due_soon: '即将到期',
  expired: '已过期',
  failed: '校准不合格'
}[status] || status)

const calibrationTag = status => ({
  uncalibrated: 'info',
  normal: 'success',
  due_soon: 'warning',
  expired: 'danger',
  failed: 'danger'
}[status] || 'info')

const toPayload = form => ({
  ...form,
  purchase_date: formatDate(form.purchase_date),
  last_calibration_date: formatDate(form.last_calibration_date),
  next_calibration_date: formatDate(form.next_calibration_date)
})

const loadData = async () => {
  try {
    const res = await getList(query)
    list.value = Array.isArray(res) ? res : []
  } catch (e) {
    console.error('加载失败', e)
    list.value = []
  }
}

const resetQuery = async () => {
  query.code = ''
  query.name = ''
  query.status = ''
  query.usage_notes = ''
  query.location = ''
  query.department = ''
  await loadData()
}

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
    borrower: row.borrower || '',
    asset_code: row.asset_code || '',
    status: row.status || 'idle',
    usage_notes: row.usage_notes || '',
    calibration_status: row.calibration_status || 'uncalibrated',
    calibration_result: row.calibration_result || '',
    calibration_note: row.calibration_note || '',
    last_calibration_date: row.last_calibration_date || '',
    next_calibration_date: row.next_calibration_date || '',
    locked: Boolean(row.locked),
    lock_reason: row.lock_reason || ''
  })
  editVisible.value = true
}

const saveEdit = async () => {
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

const use = async row => {
  try {
    const user = getCurrentUser()
    const borrower = user?.nickname || user?.username || '未知用户'

    await useDevice(row.id, { borrower })
    ElMessage.success(`领用成功，当前领用人：${borrower}`)
    await loadData()
  } catch (e) {
    console.error('领用失败', e)
  }
}

const ret = async row => {
  try {
    await returnDevice(row.id)
    ElMessage.success('归还成功')
    await loadData()
  } catch (e) {
    console.error('归还失败', e)
  }
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

    ElMessage.success(`导入成功，共 ${res.imported} 条`)
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

onMounted(loadData)
</script>

<style scoped>
.instrument-list {
  padding: 24px;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
</style>

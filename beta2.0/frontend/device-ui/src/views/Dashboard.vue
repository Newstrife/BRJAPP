<template>
  <div v-loading="loading" class="page-panel dashboard">
    <div class="panel-title">
      <h2>设备门户</h2>
      <el-button text :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
    </div>

    <div class="stat-grid">
      <button
        v-for="card in cards"
        :key="card.key"
        class="stat-card"
        type="button"
        @click="goList(card)"
      >
        <span class="stat-icon" :style="{ background: card.color }">
          <el-icon :size="18"><component :is="card.icon" /></el-icon>
        </span>
        <div class="stat-body">
          <div class="stat-value" :style="{ color: card.color }">{{ card.value }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </div>
      </button>
    </div>

    <div class="dashboard-body">
      <aside class="side-col">
        <div class="section-head">
          <h3 class="section-title">设备状态</h3>
          <el-button text type="primary" @click="goList({})">查看全部</el-button>
        </div>
        <div class="device-grid">
          <button
            v-for="card in deviceCards"
            :key="card.key"
            class="device-card"
            type="button"
            @click="goList(card)"
          >
            <span class="stat-icon" :style="{ background: card.color }">
              <el-icon :size="18"><component :is="card.icon" /></el-icon>
            </span>
            <div class="stat-value" :style="{ color: card.color }">{{ card.value }}</div>
            <div class="stat-label">{{ card.label }}</div>
          </button>
        </div>
      </aside>

      <section class="main-col">
        <div class="section-head">
          <h3 class="section-title">计量预警</h3>
          <el-button text type="primary" @click="goList({})">查看全部</el-button>
        </div>
        <el-table
          :data="attention"
          border
          stripe
          max-height="480"
          @row-click="row => goList({ calibrationStatus: row.calibration_status })"
        >
          <el-table-column prop="code" label="设备编号" min-width="110" show-overflow-tooltip />
          <el-table-column prop="name" label="设备名称" min-width="140" show-overflow-tooltip />
          <el-table-column prop="location" label="存放位置" min-width="100" show-overflow-tooltip />
          <el-table-column prop="next_calibration_date" label="下次计量时间" width="125" />
          <el-table-column label="计量状态" width="110" align="center">
            <template #default="scope">
              <el-tag :type="calibrationTag(scope.row.calibration_status)" effect="light">
                {{ calibrationText(scope.row.calibration_status, scope.row.calibration_mode, scope.row.lock_reason) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="剩余天数" width="100" align="center">
            <template #default="scope">
              <el-tag size="small" :type="daysTagType(scope.row)" effect="plain" round>
                {{ daysLeftText(scope.row) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!loading && attention.length === 0" description="暂无预警设备" />
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import {
  Refresh,
  Box,
  CircleCheck,
  QuestionFilled,
  AlarmClock,
  WarningFilled,
  CircleCloseFilled,
  RemoveFilled,
  Tools,
  VideoPause,
  DeleteFilled
} from '@element-plus/icons-vue'
import { getStats } from '../api/instrument'
import { calibrationText, calibrationTag } from '../utils/format'
import { pendingInstrumentFilter } from '../utils/dashboardFilter'

const props = defineProps({
  active: Boolean
})

const emit = defineEmits(['go-instruments'])

const loading = ref(false)
const total = ref(0)
const byStatus = ref({})
const byDeviceStatus = ref({})
const uncalibratedVerification = ref(0)
const attention = ref([])

const cards = computed(() => [
  { key: 'total', label: '设备总数', value: total.value, color: '#305496', icon: Box, calibrationStatus: '' },
  { key: 'normal', label: '计量正常', value: byStatus.value.normal || 0, color: '#2e9e5b', icon: CircleCheck, calibrationStatus: 'normal' },
  { key: 'calibrated_unverified', label: '已计量未验证', value: byStatus.value.calibrated_unverified || 0, color: '#c55a11', icon: QuestionFilled, calibrationStatus: 'calibrated_unverified' },
  { key: 'due_soon', label: '即将到期', value: byStatus.value.due_soon || 0, color: '#d9852b', icon: AlarmClock, calibrationStatus: 'due_soon' },
  { key: 'expired', label: '已过期', value: byStatus.value.expired || 0, color: '#d0453e', icon: WarningFilled, calibrationStatus: 'expired' },
  { key: 'failed', label: '验证不合格', value: byStatus.value.failed || 0, color: '#8e44ad', icon: CircleCloseFilled, calibrationStatus: 'failed' },
  { key: 'uncalibrated', label: '未验证', value: uncalibratedVerification.value, color: '#6b7280', icon: RemoveFilled, calibrationStatus: 'uncalibrated', calibrationMode: 'calibration_verification' }
])

const deviceCards = computed(() => [
  { key: 'normal', label: '正常', value: byDeviceStatus.value.normal || 0, color: '#2e9e5b', icon: CircleCheck, status: 'normal' },
  { key: 'repair', label: '维修', value: byDeviceStatus.value.repair || 0, color: '#d9852b', icon: Tools, status: 'repair' },
  { key: 'paused', label: '暂停', value: byDeviceStatus.value.paused || 0, color: '#6b7280', icon: VideoPause, status: 'paused' },
  { key: 'scrapped', label: '报废', value: byDeviceStatus.value.scrapped || 0, color: '#d0453e', icon: DeleteFilled, status: 'scrapped' }
])

const daysLeft = row => {
  if (!row.next_calibration_date) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(row.next_calibration_date)

  return Math.ceil((target - today) / 86400000)
}

const daysLeftText = row => {
  const days = daysLeft(row)

  if (days === null) return '-'
  if (days < 0) return `超期 ${-days} 天`
  if (days === 0) return '今天到期'

  return `${days} 天`
}

const daysTagType = row => {
  const days = daysLeft(row)

  if (days === null) return 'info'
  if (days < 0) return 'danger'
  if (days <= 3) return 'warning'

  return 'success'
}

const load = async () => {
  loading.value = true
  try {
    const res = await getStats()
    total.value = res.total || 0
    byStatus.value = res.byStatus || {}
    byDeviceStatus.value = res.byDeviceStatus || {}
    uncalibratedVerification.value = res.uncalibrated_verification || 0
    attention.value = res.attention || []
  } finally {
    loading.value = false
  }
}

const goList = card => {
  pendingInstrumentFilter.calibration_status = card.calibrationStatus || ''
  pendingInstrumentFilter.calibration_mode = card.calibrationMode || ''
  pendingInstrumentFilter.status = card.status || ''
  pendingInstrumentFilter.ts = Date.now()
  emit('go-instruments')
}

watch(() => props.active, value => {
  if (value) load()
})

onMounted(load)
</script>

<style scoped>
/* 门户页：面板透明化，由内部卡片构成版面 */
.dashboard.page-panel {
  padding: 0;
  background: transparent;
  border: none;
  box-shadow: none;
}

.panel-title {
  margin-bottom: 14px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 14px;
  background: #fff;
  border: 1px solid var(--panel-border);
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: box-shadow 0.15s, transform 0.15s;
}

.stat-card:hover {
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.1);
  transform: translateY(-1px);
}

.stat-icon {
  flex: none;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  color: #fff;
}

.stat-body {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-muted);
}

.dashboard-body {
  display: flex;
  gap: 16px;
  align-items: stretch;
}

.side-col,
.main-col {
  background: #fff;
  border: 1px solid var(--panel-border);
  border-radius: 10px;
  padding: 16px;
}

.side-col {
  flex: 0 0 300px;
  min-width: 0;
}

.main-col {
  flex: 1;
  min-width: 0;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.device-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.device-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 10px 12px;
  background: #f8fafc;
  border: 1px solid var(--panel-border);
  border-radius: 10px;
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.15s;
}

.device-card:hover {
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.1);
  transform: translateY(-1px);
}

.device-card .stat-icon {
  margin-bottom: 4px;
}

.el-table :deep(tbody tr) {
  cursor: pointer;
}

@media (max-width: 1100px) {
  .dashboard-body {
    flex-direction: column;
  }

  .side-col {
    flex: none;
  }
}
</style>

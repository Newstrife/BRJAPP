<template>
  <div class="page-panel dashboard">
    <div class="panel-title">
      <h2>设备看板</h2>
      <el-button text :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
    </div>

    <div v-loading="loading" class="stat-grid">
      <button
        v-for="card in cards"
        :key="card.key"
        class="stat-card"
        type="button"
        @click="goList(card)"
      >
        <span class="stat-bar" :style="{ background: card.color }" />
        <div class="stat-body">
          <div class="stat-value" :style="{ color: card.color }">{{ card.value }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </div>
        <el-icon class="stat-arrow"><ArrowRight /></el-icon>
      </button>
    </div>

    <h3 class="section-title">设备状态</h3>
    <div class="stat-grid">
      <button
        v-for="card in deviceCards"
        :key="card.key"
        class="stat-card"
        type="button"
        @click="goList(card)"
      >
        <span class="stat-bar" :style="{ background: card.color }" />
        <div class="stat-body">
          <div class="stat-value" :style="{ color: card.color }">{{ card.value }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </div>
        <el-icon class="stat-arrow"><ArrowRight /></el-icon>
      </button>
    </div>

    <h3 class="section-title">计量预警</h3>
    <el-table :data="attention" border @row-click="row => goList(row.calibration_status)">
      <el-table-column prop="code" label="设备编号" min-width="120" show-overflow-tooltip />
      <el-table-column prop="name" label="设备名称" min-width="150" show-overflow-tooltip />
      <el-table-column prop="location" label="存放位置" min-width="110" show-overflow-tooltip />
      <el-table-column prop="next_calibration_date" label="下次计量时间" width="130" />
      <el-table-column label="计量状态" width="110" align="center">
        <template #default="scope">
          <el-tag :type="calibrationTag(scope.row.calibration_status)" effect="light">
            {{ calibrationText(scope.row.calibration_status, scope.row.calibration_mode, scope.row.lock_reason) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="剩余天数" width="110" align="center">
        <template #default="scope">
          <span :class="{ overdue: daysLeft(scope.row) < 0 }">
            {{ daysLeftText(scope.row) }}
          </span>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!loading && attention.length === 0" description="暂无预警设备" />
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { Refresh, ArrowRight } from '@element-plus/icons-vue'
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
const attention = ref([])

const cards = computed(() => [
  { key: 'total', label: '设备总数', value: total.value, color: '#305496', calibrationStatus: '' },
  { key: 'normal', label: '计量正常', value: byStatus.value.normal || 0, color: '#2e9e5b', calibrationStatus: 'normal' },
  { key: 'calibrated_unverified', label: '已计量未验证', value: byStatus.value.calibrated_unverified || 0, color: '#c55a11', calibrationStatus: 'calibrated_unverified' },
  { key: 'due_soon', label: '即将到期', value: byStatus.value.due_soon || 0, color: '#d9852b', calibrationStatus: 'due_soon' },
  { key: 'expired', label: '已过期', value: byStatus.value.expired || 0, color: '#d0453e', calibrationStatus: 'expired' },
  { key: 'failed', label: '校准不合格', value: byStatus.value.failed || 0, color: '#8e44ad', calibrationStatus: 'failed' },
  { key: 'uncalibrated', label: '未校准', value: byStatus.value.uncalibrated || 0, color: '#6b7280', calibrationStatus: 'uncalibrated' }
])

const deviceCards = computed(() => [
  { key: 'normal', label: '正常', value: byDeviceStatus.value.normal || 0, color: '#2e9e5b', status: 'normal' },
  { key: 'repair', label: '维修', value: byDeviceStatus.value.repair || 0, color: '#d9852b', status: 'repair' },
  { key: 'paused', label: '暂停', value: byDeviceStatus.value.paused || 0, color: '#6b7280', status: 'paused' },
  { key: 'scrapped', label: '报废', value: byDeviceStatus.value.scrapped || 0, color: '#d0453e', status: 'scrapped' }
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

const load = async () => {
  loading.value = true
  try {
    const res = await getStats()
    total.value = res.total || 0
    byStatus.value = res.byStatus || {}
    byDeviceStatus.value = res.byDeviceStatus || {}
    attention.value = res.attention || []
  } finally {
    loading.value = false
  }
}

const goList = card => {
  pendingInstrumentFilter.calibration_status = card.calibrationStatus || ''
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
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  padding: 16px 14px 16px 20px;
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

.stat-bar {
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 4px;
  border-radius: 2px;
}

.stat-body {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  margin-top: 2px;
  font-size: 13px;
  color: var(--text-muted);
}

.stat-arrow {
  color: #c3cad6;
}

.section-title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
}

.overdue {
  color: var(--el-color-danger);
  font-weight: 600;
}

.el-table :deep(tbody tr) {
  cursor: pointer;
}

@media (max-width: 768px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

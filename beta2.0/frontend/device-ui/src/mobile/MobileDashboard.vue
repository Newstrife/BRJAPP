<template>
  <div class="m-dash">
    <div class="m-dash-refresh">
      <el-button text :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
    </div>

    <div v-loading="loading" class="m-stat-grid">
      <button
        v-for="card in cards"
        :key="card.key"
        class="m-stat-card"
        type="button"
        @click="$emit('filter', card)"
      >
        <span class="m-stat-bar" :style="{ background: card.color }" />
        <div class="m-stat-value" :style="{ color: card.color }">{{ card.value }}</div>
        <div class="m-stat-label">{{ card.label }}</div>
      </button>
    </div>

    <h3 class="m-section-title">设备状态</h3>
    <div class="m-stat-grid">
      <button
        v-for="card in deviceCards"
        :key="card.key"
        class="m-stat-card"
        type="button"
        @click="$emit('filter', card)"
      >
        <span class="m-stat-bar" :style="{ background: card.color }" />
        <div class="m-stat-value" :style="{ color: card.color }">{{ card.value }}</div>
        <div class="m-stat-label">{{ card.label }}</div>
      </button>
    </div>

    <h3 class="m-section-title">计量预警</h3>

    <div class="m-attention">
      <div
        v-for="item in attention"
        :key="item.id"
        class="m-att-card"
        @click="$emit('open', item)"
      >
        <div class="m-att-head">
          <span class="m-att-name">{{ item.name || '未命名设备' }}</span>
          <el-tag size="small" :type="calibrationTag(item.calibration_status)" effect="light">
            {{ calibrationText(item.calibration_status, item.calibration_mode, item.lock_reason) }}
          </el-tag>
        </div>
        <div class="m-att-row">
          <span class="m-att-label">编号</span>{{ item.code || '-' }}
        </div>
        <div class="m-att-row">
          <span class="m-att-label">计量</span>{{ item.next_calibration_date || '-' }}
          <span class="m-att-days" :class="{ overdue: daysLeft(item) !== null && daysLeft(item) < 0 }">
            {{ daysLeftText(item) }}
          </span>
        </div>
      </div>

      <el-empty v-if="!loading && attention.length === 0" description="暂无预警设备" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { getStats } from '../api/instrument'
import { calibrationText, calibrationTag } from '../utils/format'

defineEmits(['filter', 'open'])

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
  { key: 'failed', label: '验证不合格', value: byStatus.value.failed || 0, color: '#8e44ad', calibrationStatus: 'failed' },
  { key: 'uncalibrated', label: '未验证', value: byStatus.value.uncalibrated || 0, color: '#6b7280', calibrationStatus: 'uncalibrated' }
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

  return `剩余 ${days} 天`
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

onMounted(load)
</script>

<style scoped>
.m-dash {
  padding: 12px;
}

.m-dash-refresh {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 4px;
}

.m-stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  min-height: 120px;
}

.m-stat-card {
  position: relative;
  padding: 14px 12px 12px 18px;
  background: #fff;
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  text-align: left;
  cursor: pointer;
}

.m-stat-card:active {
  background: #f8fafc;
}

.m-stat-bar {
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 4px;
  border-radius: 2px;
}

.m-stat-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.m-stat-label {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-muted);
}

.m-section-title {
  margin: 18px 0 10px;
  font-size: 15px;
  font-weight: 600;
}

.m-att-card {
  background: #fff;
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 10px;
}

.m-att-card:active {
  background: #f8fafc;
}

.m-att-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.m-att-name {
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-att-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  line-height: 1.9;
}

.m-att-label {
  flex: none;
  width: 32px;
  color: var(--text-muted);
}

.m-att-days {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-color-warning);
}

.m-att-days.overdue {
  color: var(--el-color-danger);
  font-weight: 600;
}
</style>

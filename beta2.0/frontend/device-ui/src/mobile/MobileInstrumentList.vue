<template>
  <div class="m-list">
    <div class="m-searchbar">
      <el-input
        v-model="keyword"
        class="m-search-input"
        placeholder="搜索编号 / 名称 / 位置"
        clearable
        :prefix-icon="Search"
      />
      <el-button class="m-icon-btn" :icon="Filter" @click="filterVisible = true" />
      <el-button class="m-icon-btn" :icon="Refresh" :loading="loading" @click="$emit('refresh')" />
    </div>

    <div v-loading="loading" class="m-cards">
      <div v-for="item in visibleList" :key="item.id" class="m-card" @click="$emit('open', item)">
        <div class="m-card-head">
          <span class="m-card-name">{{ item.name || '未命名设备' }}</span>
          <el-tag size="small" :type="calibrationTag(item.calibration_status)" effect="light">
            {{ calibrationText(item.calibration_status) }}
          </el-tag>
        </div>
        <div class="m-card-row">
          <span class="m-label">编号</span>{{ item.code || '-' }}
        </div>
        <div class="m-card-row">
          <span class="m-label">位置</span>{{ item.location || '-' }}<template v-if="item.department"> · {{ item.department }}</template>
        </div>
        <div class="m-card-row">
          <span class="m-label">状态</span>
          <el-tag size="small" :type="deviceStatusTag(item.status)" effect="plain">
            {{ deviceStatusText(item.status) }}
          </el-tag>
          <span v-if="item.locked" class="m-lock">已锁定{{ item.lock_reason ? `：${item.lock_reason}` : '' }}</span>
          <span v-else-if="item.borrower" class="m-borrower">{{ item.borrower }}</span>
        </div>
      </div>

      <el-empty v-if="!loading && filteredList.length === 0" description="没有符合条件的设备" />
    </div>

    <div v-if="visibleList.length < filteredList.length" class="m-more">
      <el-button text type="primary" @click="limit += pageSize">
        加载更多（{{ visibleList.length }} / {{ filteredList.length }}）
      </el-button>
    </div>

    <el-drawer v-model="filterVisible" title="筛选条件" direction="btt" size="75%">
      <el-form label-position="top">
        <el-form-item label="存放位置">
          <el-input v-model="filters.location" placeholder="存放位置" clearable />
        </el-form-item>
        <el-form-item label="所属部门">
          <el-input v-model="filters.department" placeholder="所属部门" clearable />
        </el-form-item>
        <el-form-item label="计量状态">
          <el-select v-model="filters.calibration_status" placeholder="全部" clearable style="width: 100%">
            <el-option label="未校准" value="uncalibrated" />
            <el-option label="正常" value="normal" />
            <el-option label="即将到期" value="due_soon" />
            <el-option label="已过期" value="expired" />
            <el-option label="校准不合格" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item label="使用状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 100%">
            <el-option label="空闲" value="idle" />
            <el-option label="使用中" value="in_use" />
            <el-option label="维修中" value="repair" />
            <el-option label="报废" value="scrapped" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="m-drawer-actions">
        <el-button size="large" @click="resetFilters">重置</el-button>
        <el-button size="large" type="primary" @click="filterVisible = false">确定</el-button>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Search, Filter, Refresh } from '@element-plus/icons-vue'
import { useBackToClose } from '../utils/useBackToClose'
import {
  calibrationText,
  calibrationTag,
  deviceStatusText,
  deviceStatusTag
} from '../utils/format'

const props = defineProps({
  list: { type: Array, default: () => [] },
  loading: Boolean
})

defineEmits(['open', 'refresh'])

const keyword = ref('')
const filterVisible = ref(false)
const pageSize = 20
const limit = ref(pageSize)

useBackToClose(filterVisible)

const filters = reactive({
  location: '',
  department: '',
  calibration_status: '',
  status: ''
})

const filteredList = computed(() => {
  const kw = keyword.value.trim().toLowerCase()

  return props.list.filter(item => {
    if (kw) {
      const haystack = `${item.code || ''} ${item.name || ''} ${item.location || ''}`.toLowerCase()
      if (!haystack.includes(kw)) return false
    }

    if (filters.location && !(item.location || '').includes(filters.location)) return false
    if (filters.department && !(item.department || '').includes(filters.department)) return false
    if (filters.calibration_status && item.calibration_status !== filters.calibration_status) return false
    if (filters.status && item.status !== filters.status) return false

    return true
  })
})

const visibleList = computed(() => filteredList.value.slice(0, limit.value))

watch([keyword, filters], () => {
  limit.value = pageSize
}, { deep: true })

const resetFilters = () => {
  filters.location = ''
  filters.department = ''
  filters.calibration_status = ''
  filters.status = ''
  filterVisible.value = false
}
</script>

<style scoped>
.m-searchbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  background: var(--page-bg);
}

.m-search-input {
  flex: 1;
}

.m-icon-btn {
  flex: none;
  width: 40px;
  height: 40px;
  margin: 0;
}

.m-searchbar :deep(.el-input__wrapper) {
  height: 40px;
  border-radius: 10px;
}

.m-cards {
  padding: 0 12px 12px;
  min-height: 40vh;
}

.m-card {
  background: #fff;
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: var(--shadow-panel);
}

.m-card:active {
  background: #f8fafc;
}

.m-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.m-card-name {
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-card-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-strong);
  line-height: 1.9;
}

.m-label {
  flex: none;
  width: 32px;
  color: var(--text-muted);
}

.m-lock {
  color: var(--el-color-danger);
  font-size: 12px;
}

.m-borrower {
  color: var(--text-muted);
  font-size: 12px;
}

.m-more {
  text-align: center;
  padding: 4px 0 16px;
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

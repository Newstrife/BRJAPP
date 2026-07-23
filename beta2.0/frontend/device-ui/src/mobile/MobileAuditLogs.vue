<template>
  <div class="m-logs">
    <div class="m-searchbar">
      <el-input
        v-model="query.keyword"
        class="m-search-input"
        placeholder="搜索操作对象"
        clearable
        :prefix-icon="Search"
        @keyup.enter="load"
        @clear="load"
      />
      <el-button class="m-icon-btn" :icon="Filter" @click="filterVisible = true" />
      <el-button class="m-icon-btn" :icon="Refresh" :loading="loading" @click="load" />
    </div>

    <div v-loading="loading" class="m-log-cards">
      <div v-for="item in logs" :key="item.id" class="m-log-card" @click="showDetail(item)">
        <div class="m-log-head">
          <el-tag size="small" :type="auditActionTagType(item.action)" effect="light">
            {{ auditActionLabels[item.action] || item.action }}
          </el-tag>
          <span class="m-log-module">{{ auditModuleLabels[item.module] || item.module }}</span>
          <span class="m-log-time">{{ formatTime(item.createdAt) }}</span>
        </div>
        <div class="m-log-target">{{ item.target_label || '-' }}</div>
        <div class="m-log-actor">{{ item.actor_nickname || item.actor_username }}</div>
      </div>

      <el-empty v-if="!loading && logs.length === 0" description="暂无日志" />
    </div>

    <el-drawer v-model="filterVisible" title="筛选条件" direction="btt" size="72%">
      <el-form label-position="top">
        <el-form-item label="模块">
          <el-select v-model="query.module" placeholder="全部" clearable style="width: 100%">
            <el-option v-for="(label, key) in auditModuleLabels" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作">
          <el-select v-model="query.action" placeholder="全部" clearable style="width: 100%">
            <el-option v-for="(label, key) in auditActionLabels" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="query.actor" placeholder="账号或昵称" clearable />
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker v-model="query.start" type="date" value-format="YYYY-MM-DD" placeholder="开始日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker v-model="query.end" type="date" value-format="YYYY-MM-DD" placeholder="结束日期" style="width: 100%" />
        </el-form-item>
      </el-form>
      <div class="m-drawer-actions">
        <el-button size="large" @click="reset">重置</el-button>
        <el-button size="large" type="primary" @click="applyFilter">查询</el-button>
      </div>
    </el-drawer>

    <el-drawer v-model="detailVisible" title="日志详情" direction="btt" size="85%">
      <template v-if="current">
        <div class="m-detail-rows">
          <div class="m-row"><span class="m-key">时间</span>{{ formatTime(current.createdAt) }}</div>
          <div class="m-row"><span class="m-key">操作人</span>{{ current.actor_nickname || current.actor_username }}（{{ current.actor_username }}）</div>
          <div class="m-row"><span class="m-key">模块</span>{{ auditModuleLabels[current.module] || current.module }}</div>
          <div class="m-row"><span class="m-key">操作</span>{{ auditActionLabels[current.action] || current.action }}</div>
          <div class="m-row"><span class="m-key">操作对象</span>{{ current.target_label || '-' }}</div>
          <div class="m-row"><span class="m-key">IP</span>{{ current.ip || '-' }}</div>
        </div>
        <div class="m-detail-subtitle">详细内容</div>
        <pre class="m-detail-json">{{ prettyDetail }}</pre>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { Search, Filter, Refresh } from '@element-plus/icons-vue'
import { getAuditLogs, getAuditLogDetail } from '../api/auditLog'
import { useBackToClose } from '../utils/useBackToClose'
import {
  auditModuleLabels,
  auditActionLabels,
  auditActionTagType,
  formatTime
} from '../utils/format'

const logs = ref([])
const loading = ref(false)
const filterVisible = ref(false)
const detailVisible = ref(false)
const current = ref(null)

useBackToClose(filterVisible)
useBackToClose(detailVisible)

const query = reactive({
  keyword: '',
  module: '',
  action: '',
  actor: '',
  start: '',
  end: ''
})

const prettyDetail = computed(() => {
  if (!current.value?.detail) return '无'

  try {
    return JSON.stringify(JSON.parse(current.value.detail), null, 2)
  } catch (e) {
    return current.value.detail
  }
})

const load = async () => {
  loading.value = true
  try {
    logs.value = await getAuditLogs({ ...query })
  } finally {
    loading.value = false
  }
}

const applyFilter = () => {
  filterVisible.value = false
  load()
}

const reset = () => {
  query.keyword = ''
  query.module = ''
  query.action = ''
  query.actor = ''
  query.start = ''
  query.end = ''
  filterVisible.value = false
  load()
}

const showDetail = async row => {
  current.value = await getAuditLogDetail(row.id)
  detailVisible.value = true
}

onMounted(load)
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

.m-log-cards {
  padding: 0 12px 12px;
  min-height: 40vh;
}

.m-log-card {
  background: #fff;
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 10px;
}

.m-log-card:active {
  background: #f8fafc;
}

.m-log-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.m-log-module {
  font-size: 12px;
  color: var(--text-muted);
}

.m-log-time {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-muted);
}

.m-log-target {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-log-actor {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
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

.m-detail-rows .m-row {
  display: flex;
  gap: 12px;
  padding: 9px 0;
  font-size: 14px;
  border-bottom: 1px solid #f1f3f8;
}

.m-detail-rows .m-key {
  flex: none;
  width: 64px;
  color: var(--text-muted);
}

.m-detail-subtitle {
  margin: 14px 0 8px;
  font-size: 13px;
  font-weight: 600;
}

.m-detail-json {
  margin: 0;
  padding: 12px;
  background: #f5f7fb;
  border-radius: 8px;
  max-height: 40vh;
  overflow: auto;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>

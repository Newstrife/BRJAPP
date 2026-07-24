<template>
  <div class="page-panel">
    <div class="panel-title">
      <h2>审计日志</h2>
    </div>

    <el-form class="log-filters" inline @submit.prevent>
      <el-form-item label="模块">
        <el-select v-model="query.module" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="(label, key) in moduleLabels" :key="key" :label="label" :value="key" />
        </el-select>
      </el-form-item>
      <el-form-item label="操作">
        <el-select v-model="query.action" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="(label, key) in actionLabels" :key="key" :label="label" :value="key" />
        </el-select>
      </el-form-item>
      <el-form-item label="操作人">
        <el-input v-model="query.actor" placeholder="账号或昵称" clearable style="width: 160px" />
      </el-form-item>
      <el-form-item label="操作对象">
        <el-input v-model="query.keyword" placeholder="关键字" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="日期">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 260px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" :loading="loading" @click="search">查询</el-button>
        <el-button :icon="Refresh" @click="reset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table
      v-loading="loading"
      :data="logs"
      border
      :row-class-name="() => 'log-row'"
      @row-click="showDetail"
    >
      <el-table-column label="时间" width="180">
        <template #default="scope">{{ formatTime(scope.row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作人" width="160">
        <template #default="scope">
          {{ scope.row.actor_nickname || scope.row.actor_username }}
          <span class="actor-username">({{ scope.row.actor_username }})</span>
        </template>
      </el-table-column>
      <el-table-column label="模块" width="110">
        <template #default="scope">{{ moduleLabels[scope.row.module] || scope.row.module }}</template>
      </el-table-column>
      <el-table-column label="操作" width="110">
        <template #default="scope">
          <el-tag :type="actionTagType(scope.row.action)" effect="plain">
            {{ actionLabels[scope.row.action] || scope.row.action }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="target_label" label="操作对象" min-width="200" show-overflow-tooltip />
      <el-table-column prop="ip" label="IP" width="140" show-overflow-tooltip />
    </el-table>

    <div class="pager">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        background
        @current-change="load"
      />
    </div>

    <el-empty v-if="!loading && logs.length === 0" description="暂无日志" />

    <el-dialog v-model="detailVisible" title="日志详情" width="680px">
      <template v-if="current">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="时间">{{ formatTime(current.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="操作人">
            {{ current.actor_nickname || current.actor_username }}（{{ current.actor_username }}）
          </el-descriptions-item>
          <el-descriptions-item label="模块">{{ moduleLabels[current.module] || current.module }}</el-descriptions-item>
          <el-descriptions-item label="操作">{{ actionLabels[current.action] || current.action }}</el-descriptions-item>
          <el-descriptions-item label="操作对象">{{ current.target_label || '-' }}</el-descriptions-item>
          <el-descriptions-item label="IP">{{ current.ip || '-' }}</el-descriptions-item>
        </el-descriptions>

        <h3 class="detail-title">详细内容</h3>
        <pre class="detail-json">{{ prettyDetail }}</pre>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { getAuditLogs, getAuditLogDetail } from '../api/auditLog'

const moduleLabels = {
  instrument: '设备',
  calibration: '计量记录',
  user: '账号',
  wecom: '企业微信'
}

const actionLabels = {
  create: '新增',
  update: '修改',
  remove: '删除',
  import: '导入',
  use: '领用',
  return: '归还',
  calibration: '校准',
  password: '修改密码',
  setting: '保存设置',
  lock: '自动锁定'
}

const actionTagType = action => ({
  create: 'success',
  import: 'success',
  update: 'warning',
  calibration: 'warning',
  setting: 'warning',
  password: 'warning',
  remove: 'danger',
  lock: 'danger',
  use: 'primary',
  return: 'info'
}[action] || 'info')

const logs = ref([])
const loading = ref(false)
const detailVisible = ref(false)
const current = ref(null)
const dateRange = ref(null)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const search = () => {
  page.value = 1
  load()
}

const query = reactive({
  module: '',
  action: '',
  actor: '',
  keyword: ''
})

const formatTime = value => (value ? new Date(value).toLocaleString() : '-')

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
    const params = { ...query, page: page.value, pageSize: pageSize.value }

    if (dateRange.value?.[0]) params.start = dateRange.value[0]
    if (dateRange.value?.[1]) params.end = dateRange.value[1]

    const res = await getAuditLogs(params)
    logs.value = res.list || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

const reset = () => {
  query.module = ''
  query.action = ''
  query.actor = ''
  query.keyword = ''
  dateRange.value = null
  page.value = 1
  load()
}

const showDetail = async row => {
  current.value = await getAuditLogDetail(row.id)
  detailVisible.value = true
}

onMounted(load)
</script>

<style scoped>
.log-filters {
  margin-bottom: 4px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.actor-username {
  color: #9ca3af;
  font-size: 12px;
}

.detail-title {
  margin: 16px 0 8px;
  font-size: 14px;
}

.detail-json {
  margin: 0;
  padding: 12px;
  background: #f5f7fb;
  border-radius: 6px;
  max-height: 320px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

:deep(.log-row) {
  cursor: pointer;
}
</style>

<template>
  <div class="m-shell">
    <header class="m-header">
      <span class="m-header-title">{{ title }}</span>
    </header>

    <main class="m-body">
      <MobileInstrumentList
        v-if="tab === 'instruments'"
        :list="instruments"
        :loading="loading"
        @open="openDetail"
        @refresh="loadInstruments"
      />
      <MobileAuditLogs v-else-if="tab === 'audit'" />
      <MobileProfile v-else :user="user" @logout="$emit('logout')" />
    </main>

    <nav class="m-tabbar">
      <button
        class="m-tab"
        :class="{ active: tab === 'instruments' }"
        type="button"
        @click="tab = 'instruments'"
      >
        <el-icon><Monitor /></el-icon>
        <span>设备</span>
      </button>
      <button
        v-if="canAudit"
        class="m-tab"
        :class="{ active: tab === 'audit' }"
        type="button"
        @click="tab = 'audit'"
      >
        <el-icon><Document /></el-icon>
        <span>审计日志</span>
      </button>
      <button
        class="m-tab"
        :class="{ active: tab === 'mine' }"
        type="button"
        @click="tab = 'mine'"
      >
        <el-icon><User /></el-icon>
        <span>我的</span>
      </button>
    </nav>

    <MobileInstrumentDetail
      v-if="selectedInstrument"
      :instrument="selectedInstrument"
      @back="goBack"
      @changed="loadInstruments"
      @records="openRecords"
    />

    <MobileCalibrationRecords
      v-if="recordsInstrument"
      :instrument="recordsInstrument"
      @close="goBack"
      @changed="loadInstruments"
    />
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { Monitor, Document, User } from '@element-plus/icons-vue'
import { getList } from '../api/instrument'
import { pushLayer, back } from '../utils/backStack'
import MobileInstrumentList from './MobileInstrumentList.vue'
import MobileInstrumentDetail from './MobileInstrumentDetail.vue'
import MobileCalibrationRecords from './MobileCalibrationRecords.vue'
import MobileAuditLogs from './MobileAuditLogs.vue'
import MobileProfile from './MobileProfile.vue'

const props = defineProps({
  user: { type: Object, required: true }
})

defineEmits(['logout'])

const tab = ref('instruments')
const instruments = ref([])
const loading = ref(false)
const selectedId = ref(null)
const recordsInstrument = ref(null)

const canAudit = computed(() => ['admin', 'auditor'].includes(props.user.role))

const title = computed(() => ({
  instruments: '设备列表',
  audit: '审计日志',
  mine: '我的'
}[tab.value]))

const selectedInstrument = computed(() =>
  instruments.value.find(item => item.id === selectedId.value) || null
)

// 应用内页面接入统一返回栈：系统返回手势/返回键只关闭最上层
const openDetail = item => {
  selectedId.value = item.id
  pushLayer(() => {
    selectedId.value = null
  })
}

const openRecords = instrument => {
  recordsInstrument.value = instrument
  pushLayer(() => {
    recordsInstrument.value = null
  })
}

const goBack = () => {
  back()
}

const loadInstruments = async () => {
  loading.value = true
  try {
    const res = await getList()
    instruments.value = Array.isArray(res) ? res : []
  } catch (e) {
    console.error('加载设备失败', e)
    instruments.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadInstruments)
</script>

<style scoped>
.m-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--page-bg);
}

.m-header {
  position: sticky;
  top: 0;
  z-index: 100;
  flex: none;
  height: 48px;
  display: grid;
  place-items: center;
  background: #fff;
  border-bottom: 1px solid var(--panel-border);
}

.m-header-title {
  font-size: 16px;
  font-weight: 600;
}

.m-body {
  flex: 1;
  padding-bottom: 64px;
}

.m-tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  display: flex;
  background: #fff;
  border-top: 1px solid var(--panel-border);
  padding-bottom: env(safe-area-inset-bottom);
}

.m-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 0 6px;
  border: none;
  background: none;
  font-size: 11px;
  color: var(--text-muted);
  cursor: pointer;
}

.m-tab .el-icon {
  font-size: 21px;
}

.m-tab.active {
  color: var(--el-color-primary);
  font-weight: 600;
}
</style>

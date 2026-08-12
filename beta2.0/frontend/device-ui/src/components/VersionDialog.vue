<template>
  <el-dialog
    :model-value="modelValue"
    title="版本信息"
    :width="isMobile ? '92vw' : '520px'"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="version-head">
      <span class="version-label">当前版本</span>
      <el-tag type="primary" effect="dark">{{ APP_VERSION }}</el-tag>
    </div>

    <el-timeline class="version-timeline">
      <el-timeline-item
        v-for="(item, index) in CHANGELOG"
        :key="item.version"
        :type="index === 0 ? 'primary' : ''"
        :hollow="index !== 0"
        :timestamp="item.date"
        placement="top"
      >
        <div class="version-name">
          {{ item.version }}
          <el-tag v-if="index === 0" size="small" type="success" effect="plain">最新</el-tag>
        </div>
        <ul class="change-list">
          <li v-for="(change, i) in item.changes" :key="i">{{ change }}</li>
        </ul>
      </el-timeline-item>
    </el-timeline>
  </el-dialog>
</template>

<script setup>
import { APP_VERSION, CHANGELOG } from '../data/changelog'
import { useIsMobile } from '../utils/useIsMobile'

defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue'])
const isMobile = useIsMobile()
</script>

<style scoped>
.version-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.version-label {
  font-size: 14px;
  color: var(--text-muted);
}

.version-timeline {
  padding-left: 4px;
  max-height: 55vh;
  overflow-y: auto;
}

.version-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 6px;
}

.change-list {
  margin: 0;
  padding-left: 18px;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.9;
}
</style>

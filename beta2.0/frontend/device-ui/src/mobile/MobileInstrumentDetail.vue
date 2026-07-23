<template>
  <div class="m-detail">
    <header class="m-detail-header">
      <el-button class="m-back" :icon="ArrowLeft" text @click="$emit('back')">返回</el-button>
      <span class="m-detail-title">设备详情</span>
      <span class="m-header-spacer" />
    </header>

    <div class="m-detail-body">
      <div class="m-detail-hero">
        <div class="m-hero-name">{{ instrument.name || '未命名设备' }}</div>
        <div class="m-hero-code">{{ instrument.code || '-' }}</div>
        <div class="m-hero-tags">
          <el-tag :type="calibrationTag(instrument.calibration_status)" effect="light">
            {{ calibrationText(instrument.calibration_status) }}
          </el-tag>
          <el-tag :type="deviceStatusTag(instrument.status)" effect="plain">
            {{ deviceStatusText(instrument.status) }}
          </el-tag>
        </div>
      </div>

      <div v-if="instrument.locked" class="m-lock-banner">
        设备已锁定{{ instrument.lock_reason ? `：${instrument.lock_reason}` : '' }}
      </div>

      <div class="m-section">
        <div class="m-row"><span class="m-key">型号规格</span>{{ instrument.model || '-' }}</div>
        <div class="m-row"><span class="m-key">厂家</span>{{ instrument.manufacturer || '-' }}</div>
        <div class="m-row"><span class="m-key">存放位置</span>{{ instrument.location || '-' }}</div>
        <div class="m-row"><span class="m-key">所属部门</span>{{ instrument.department || '-' }}</div>
        <div class="m-row"><span class="m-key">责任人</span>{{ instrument.owner || '-' }}</div>
        <div class="m-row"><span class="m-key">固定资产编号</span>{{ instrument.asset_code || '-' }}</div>
        <div class="m-row"><span class="m-key">当前使用人</span>{{ instrument.borrower || '-' }}</div>
      </div>

      <div class="m-section">
        <div class="m-row"><span class="m-key">计量结果</span>{{ instrument.calibration_result || '-' }}</div>
        <div class="m-row"><span class="m-key">本次计量时间</span>{{ instrument.last_calibration_date || '-' }}</div>
        <div class="m-row"><span class="m-key">下次计量时间</span>{{ instrument.next_calibration_date || '-' }}</div>
        <div class="m-row m-row-column">
          <span class="m-key">使用注意事项</span>{{ instrument.usage_notes || '-' }}
        </div>
      </div>
    </div>

    <footer class="m-detail-footer">
      <el-button size="large" type="primary" class="m-action" :icon="Document" @click="$emit('records', instrument)">
        计量记录
      </el-button>
    </footer>
  </div>
</template>

<script setup>
import { ArrowLeft, Document } from '@element-plus/icons-vue'
import { calibrationText, calibrationTag, deviceStatusText, deviceStatusTag } from '../utils/format'

const props = defineProps({
  instrument: { type: Object, required: true }
})

defineEmits(['back', 'records'])
</script>

<style scoped>
.m-detail {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  background: var(--page-bg);
}

.m-detail-header {
  flex: none;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  background: #fff;
  border-bottom: 1px solid var(--panel-border);
}

.m-detail-title {
  font-size: 16px;
  font-weight: 600;
}

.m-header-spacer {
  width: 56px;
}

.m-detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.m-detail-hero {
  background: #fff;
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  padding: 18px 16px;
  margin-bottom: 10px;
}

.m-hero-name {
  font-size: 19px;
  font-weight: 600;
}

.m-hero-code {
  color: var(--text-muted);
  font-size: 13px;
  margin: 4px 0 10px;
}

.m-hero-tags {
  display: flex;
  gap: 8px;
}

.m-lock-banner {
  background: #fef2f2;
  color: var(--el-color-danger);
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 10px;
}

.m-section {
  background: #fff;
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  padding: 4px 16px;
  margin-bottom: 10px;
}

.m-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 11px 0;
  font-size: 14px;
  border-bottom: 1px solid #f1f3f8;
}

.m-row:last-child {
  border-bottom: none;
}

.m-row-column {
  flex-direction: column;
  gap: 4px;
}

.m-key {
  flex: none;
  width: 84px;
  color: var(--text-muted);
}

.m-row-column .m-key {
  width: auto;
}

.m-detail-footer {
  flex: none;
  display: flex;
  gap: 10px;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1px solid var(--panel-border);
}

.m-action {
  flex: 1;
  margin: 0;
  height: 46px;
  font-size: 16px;
}
</style>

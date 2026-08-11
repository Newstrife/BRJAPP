<template>
  <div class="page-panel">
    <div class="panel-title">
      <h2>设备表单必填设置</h2>
    </div>

    <p class="tip">
      控制“新增设备 / 编辑设备”表单中各字段是否必填，保存后立即生效。带
      <el-tag size="small" type="info">固定</el-tag>
      的字段为系统强制必填，不可关闭。
    </p>

    <el-table :data="fields" v-loading="loading" border max-width="720px" style="max-width: 720px">
      <el-table-column prop="label" label="字段名称" min-width="140" />
      <el-table-column prop="key" label="字段标识" min-width="160" />
      <el-table-column label="必填" width="100" align="center">
        <template #default="{ row }">
          <el-switch v-model="row.required" :disabled="row.fixed" />
        </template>
      </el-table-column>
      <el-table-column label="备注" width="100" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.fixed" size="small" type="info">固定</el-tag>
        </template>
      </el-table-column>
    </el-table>

    <div class="actions">
      <el-button type="primary" :icon="Check" :loading="saving" @click="save">保存</el-button>
      <el-button :icon="Refresh" @click="load">重置</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Refresh } from '@element-plus/icons-vue'
import { saveFieldConfig } from '../api/fieldConfig'
import { loadFieldConfig } from '../utils/fieldConfig'

const fields = ref([])
const loading = ref(false)
const saving = ref(false)

const load = async () => {
  loading.value = true
  try {
    const data = await loadFieldConfig(true)
    fields.value = data.map(f => ({ ...f }))
  } finally {
    loading.value = false
  }
}

const save = async () => {
  saving.value = true
  try {
    const required = fields.value.filter(f => f.required).map(f => f.key)
    const data = await saveFieldConfig(required)
    fields.value = (data || []).map(f => ({ ...f }))
    await loadFieldConfig(true) // 刷新全局缓存，表单立即应用新规则
    ElMessage.success('已保存')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.tip {
  margin: 0 0 16px;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.8;
}

.actions {
  margin-top: 16px;
}
</style>

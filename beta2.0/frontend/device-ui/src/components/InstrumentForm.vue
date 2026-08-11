<template>
  <el-dialog v-model="visible" title="新增设备" width="720px" :before-close="handleClose">
    <el-form
      :model="form"
      :rules="rules"
      ref="formRef"
      :label-width="isMobile ? 'auto' : '140px'"
      :label-position="isMobile ? 'top' : 'left'"
    >
      <el-form-item label="设备编号" prop="code">
        <el-input v-model="form.code" :placeholder="ph('code')" />
      </el-form-item>
      <el-form-item label="设备名称" prop="name">
        <el-input v-model="form.name" :placeholder="ph('name')" />
      </el-form-item>
      <el-form-item label="型号规格" prop="model">
        <el-input v-model="form.model" :placeholder="ph('model')" />
      </el-form-item>
      <el-form-item label="厂家" prop="manufacturer">
        <el-input v-model="form.manufacturer" :placeholder="ph('manufacturer')" />
      </el-form-item>
      <el-form-item label="入库日期" prop="purchase_date">
        <el-date-picker v-model="form.purchase_date" type="date" placeholder="选择日期" />
      </el-form-item>
      <el-form-item label="存放位置（房间号）" prop="location">
        <el-input v-model="form.location" :placeholder="ph('location')" />
      </el-form-item>
      <el-form-item label="所属部门" prop="department">
        <el-input v-model="form.department" :placeholder="ph('department')" />
      </el-form-item>
      <el-form-item label="责任人" prop="owner">
        <el-input v-model="form.owner" :placeholder="ph('owner')" />
      </el-form-item>
      <el-form-item label="固定资产编号" prop="asset_code">
        <el-input v-model="form.asset_code" :placeholder="ph('asset_code')" />
      </el-form-item>
      <el-form-item label="仪器使用注意事项" prop="usage_notes">
        <el-input v-model="form.usage_notes" type="textarea" :rows="3" placeholder="填写使用注意事项" />
      </el-form-item>
      <el-form-item label="设备状态" prop="status">
        <el-select v-model="form.status" placeholder="选择状态">
          <el-option label="正常" value="normal" />
          <el-option label="维修" value="repair" />
          <el-option label="暂停" value="paused" />
          <el-option label="报废" value="scrapped" />
        </el-select>
      </el-form-item>
      <el-form-item label="计量/验证状态" prop="calibration_status">
        <el-select v-model="form.calibration_status" placeholder="选择状态">
          <el-option label="未计量" value="uncalibrated" />
          <el-option label="正常" value="normal" />
          <el-option label="已计量未验证" value="calibrated_unverified" />
          <el-option label="即将到期" value="due_soon" />
          <el-option label="已过期" value="expired" />
          <el-option label="不合格" value="failed" />
        </el-select>
      </el-form-item>
      <el-form-item label="校准方式" prop="calibration_mode">
        <el-select v-model="form.calibration_mode" placeholder="选择校准方式">
          <el-option label="计量" value="calibration" />
          <el-option label="计量+验证" value="calibration_verification" />
        </el-select>
      </el-form-item>
      <el-form-item label="验证情况" prop="verification_result">
        <el-select v-model="form.verification_result" placeholder="选择验证情况">
          <el-option label="未验证" value="unverified" />
          <el-option label="合格" value="passed" />
          <el-option label="不合格" value="failed" />
        </el-select>
      </el-form-item>
      <el-form-item label="下次验证日期" prop="next_verification_date">
        <el-date-picker v-model="form.next_verification_date" type="date" placeholder="选择日期" />
      </el-form-item>
      <el-form-item label="计量结果" prop="calibration_result">
        <el-input v-model="form.calibration_result" placeholder="例如：合格 / 不合格" />
      </el-form-item>
      <el-form-item label="本次计量时间" prop="last_calibration_date">
        <el-date-picker v-model="form.last_calibration_date" type="date" placeholder="选择日期" />
      </el-form-item>
      <el-form-item label="下次计量时间" prop="next_calibration_date">
        <el-date-picker v-model="form.next_calibration_date" type="date" placeholder="选择日期" />
      </el-form-item>
      <el-form-item label="计量说明" prop="calibration_note">
        <el-input v-model="form.calibration_note" type="textarea" :rows="3" placeholder="填写计量文字说明" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="submitForm">提交</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { createInstrument } from '../api/instrument'
import { useIsMobile } from '../utils/useIsMobile'
import { loadFieldConfig, isFieldRequired, buildRules } from '../utils/fieldConfig'

const props = defineProps({ show: Boolean })
const emit = defineEmits(['update:show', 'success'])
const visible = ref(props.show)
const formRef = ref(null)
const isMobile = useIsMobile()

watch(() => props.show, val => {
  visible.value = val
  if (val) loadFieldConfig()
})
watch(visible, val => { emit('update:show', val) })

const form = reactive({
  code: '',
  name: '',
  model: '',
  manufacturer: '',
  purchase_date: '',
  location: '',
  department: '',
  owner: '',
  status: 'normal',
  usage_notes: '',
  asset_code: '',
  calibration_status: 'uncalibrated',
  calibration_mode: 'calibration',
  verification_result: 'unverified',
  next_verification_date: '',
  calibration_result: '',
  calibration_note: '',
  last_calibration_date: '',
  next_calibration_date: ''
})

const rules = computed(() => buildRules())

const ph = key => (isFieldRequired(key) ? '必填' : '选填')

const handleClose = () => { visible.value = false }
const formatDate = value => {
  if (!value) return null
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const submitForm = () => {
  formRef.value.validate(async valid => {
    if (!valid) return

    await createInstrument({
      ...form,
      purchase_date: formatDate(form.purchase_date),
      last_calibration_date: formatDate(form.last_calibration_date),
      next_calibration_date: formatDate(form.next_calibration_date),
      next_verification_date: formatDate(form.next_verification_date)
    })
    ElMessage.success('新增成功')
    emit('success')
    visible.value = false
  })
}
</script>

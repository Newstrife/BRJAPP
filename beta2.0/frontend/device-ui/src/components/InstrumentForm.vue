<template>
  <el-dialog v-model="visible" title="新增设备" width="720px" :before-close="handleClose">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="140px" label-position="left">
      <el-form-item label="设备编号" prop="code">
        <el-input v-model="form.code" placeholder="必填" />
      </el-form-item>
      <el-form-item label="设备名称" prop="name">
        <el-input v-model="form.name" placeholder="必填" />
      </el-form-item>
      <el-form-item label="型号规格" prop="model">
        <el-input v-model="form.model" placeholder="必填" />
      </el-form-item>
      <el-form-item label="厂家" prop="manufacturer">
        <el-input v-model="form.manufacturer" placeholder="必填" />
      </el-form-item>
      <el-form-item label="入库日期" prop="purchase_date">
        <el-date-picker v-model="form.purchase_date" type="date" placeholder="选择日期" />
      </el-form-item>
      <el-form-item label="存放位置（房间号）" prop="location">
        <el-input v-model="form.location" placeholder="必填" />
      </el-form-item>
      <el-form-item label="所属部门" prop="department">
        <el-input v-model="form.department" placeholder="必填" />
      </el-form-item>
      <el-form-item label="责任人" prop="owner">
        <el-input v-model="form.owner" placeholder="必填" />
      </el-form-item>
      <el-form-item label="固定资产编号" prop="asset_code">
        <el-input v-model="form.asset_code" placeholder="必填" />
      </el-form-item>
      <el-form-item label="仪器使用注意事项" prop="usage_notes">
        <el-input v-model="form.usage_notes" type="textarea" :rows="3" placeholder="填写使用注意事项" />
      </el-form-item>
      <el-form-item label="使用状态" prop="status">
        <el-select v-model="form.status" placeholder="选择状态">
          <el-option label="空闲" value="idle" />
          <el-option label="使用中" value="in_use" />
          <el-option label="维修中" value="repair" />
          <el-option label="报废" value="scrapped" />
        </el-select>
      </el-form-item>
      <el-form-item label="计量状态" prop="calibration_status">
        <el-select v-model="form.calibration_status" placeholder="选择状态">
          <el-option label="未校准" value="uncalibrated" />
          <el-option label="正常" value="normal" />
          <el-option label="即将到期" value="due_soon" />
          <el-option label="已过期" value="expired" />
          <el-option label="校准不合格" value="failed" />
        </el-select>
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
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createInstrument } from '../api/instrument'

const props = defineProps({ show: Boolean })
const emit = defineEmits(['update:show', 'success'])
const visible = ref(props.show)
const formRef = ref(null)

watch(() => props.show, val => { visible.value = val })
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
  status: 'idle',
  usage_notes: '',
  asset_code: '',
  calibration_status: 'uncalibrated',
  calibration_result: '',
  calibration_note: '',
  last_calibration_date: '',
  next_calibration_date: ''
})

const required = message => [{ required: true, message, trigger: 'blur' }]
const rules = {
  code: required('请输入设备编号'),
  name: required('请输入设备名称'),
  model: required('请输入型号规格'),
  manufacturer: required('请输入厂家'),
  purchase_date: required('请选择入库日期'),
  location: required('请输入存放位置'),
  department: required('请输入所属部门'),
  owner: required('请输入责任人'),
  asset_code: required('请输入固定资产编号')
}

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
      next_calibration_date: formatDate(form.next_calibration_date)
    })
    ElMessage.success('新增成功')
    emit('success')
    visible.value = false
  })
}
</script>

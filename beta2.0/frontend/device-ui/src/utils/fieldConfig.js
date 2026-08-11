import { reactive } from 'vue'
import { getFieldConfig } from '../api/fieldConfig'

// 接口不可用时的兜底必填字段（与原硬编码规则一致）
const FALLBACK_REQUIRED = [
  'code',
  'name',
  'model',
  'manufacturer',
  'purchase_date',
  'location',
  'department',
  'owner',
  'asset_code'
]

// 全局共享的设备表单必填配置缓存，各表单与设置页共用
const state = reactive({
  loaded: false,
  loading: null,
  fields: [] // [{ key, label, required, fixed }]
})

export const loadFieldConfig = async (force = false) => {
  if (state.loaded && !force) return state.fields

  if (!state.loading) {
    state.loading = getFieldConfig()
      .then(data => {
        state.fields = Array.isArray(data) ? data : []
        state.loaded = true
      })
      .catch(() => {})
      .finally(() => {
        state.loading = null
      })
  }

  await state.loading
  return state.fields
}

export const isFieldRequired = key => {
  const field = state.fields.find(f => f.key === key)
  return field ? field.required : FALLBACK_REQUIRED.includes(key)
}

// 按当前配置生成单个字段的校验规则（非必填时返回空数组，不显示红星）
export const fieldRule = (key, message, trigger = 'blur') =>
  isFieldRequired(key) ? [{ required: true, message, trigger }] : []

// [字段, 提示语, 触发方式]，新增/编辑设备表单共用
export const RULE_DEFS = [
  ['code', '请输入设备编号'],
  ['name', '请输入设备名称'],
  ['model', '请输入型号规格'],
  ['manufacturer', '请输入厂家'],
  ['purchase_date', '请选择入库日期', 'change'],
  ['location', '请输入存放位置'],
  ['department', '请输入所属部门'],
  ['owner', '请输入责任人'],
  ['asset_code', '请输入固定资产编号'],
  ['usage_notes', '请填写使用注意事项'],
  ['calibration_result', '请输入计量结果'],
  ['last_calibration_date', '请选择本次计量时间', 'change'],
  ['next_calibration_date', '请选择下次计量时间', 'change'],
  ['next_verification_date', '请选择下次验证日期', 'change'],
  ['calibration_note', '请填写计量说明']
]

// 按当前配置生成整表校验规则（仅包含必填字段）
export const buildRules = () => {
  const result = {}
  RULE_DEFS.forEach(([key, message, trigger]) => {
    const rule = fieldRule(key, message, trigger)
    if (rule.length) result[key] = rule
  })
  return result
}

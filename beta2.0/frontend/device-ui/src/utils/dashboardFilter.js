import { reactive } from 'vue'

// 看板卡片点击后，设备列表据此应用筛选
export const pendingInstrumentFilter = reactive({
  calibration_status: '',
  status: '',
  ts: 0
})

// 移动端看板卡片点击后，移动设备列表据此应用筛选
export const pendingMobileFilter = reactive({
  calibration_status: '',
  status: '',
  ts: 0
})

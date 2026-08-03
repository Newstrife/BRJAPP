import { reactive } from 'vue'

// 看板卡片点击后，设备列表据此应用筛选
export const pendingInstrumentFilter = reactive({
  calibration_status: '',
  ts: 0
})

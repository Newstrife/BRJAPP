import { watch, onBeforeUnmount } from 'vue'
import { pushLayer, closeLayer } from './backStack'

// 把一个 boolean ref（抽屉/弹窗的 v-model）接入返回栈：
// 打开时压入历史，系统返回时自动关闭，界面按钮关闭时同步弹出历史
export const useBackToClose = visible => {
  let entry = null

  const stop = watch(visible, value => {
    if (value) {
      entry = pushLayer(() => {
        visible.value = false
      })
    } else if (entry) {
      const current = entry
      entry = null
      closeLayer(current)
    }
  })

  onBeforeUnmount(() => {
    stop()

    if (entry) {
      const current = entry
      entry = null
      closeLayer(current)
    }
  })
}

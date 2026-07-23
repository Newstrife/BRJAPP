// 应用内"返回栈"：把详情页、抽屉、弹窗等覆盖层统一登记到浏览器历史，
// 系统返回手势/返回键只关闭最上层，而不是退出应用。
const stack = []
let listening = false
let suppressNext = false

const onPopState = () => {
  if (suppressNext) {
    suppressNext = false
    return
  }

  const top = stack.pop()
  if (top) top.onBack()
}

const ensureListener = () => {
  if (listening) return
  window.addEventListener('popstate', onPopState)
  listening = true
}

// 打开覆盖层时调用，onBack 为系统返回时的关闭动作
export const pushLayer = onBack => {
  ensureListener()
  history.pushState({ mLayer: stack.length }, '')
  const entry = { onBack }
  stack.push(entry)
  return entry
}

// 覆盖层通过界面按钮关闭时调用：同步弹出对应历史记录
export const closeLayer = entry => {
  const index = stack.indexOf(entry)
  if (index === -1) return

  stack.splice(index, 1)
  suppressNext = true
  history.back()
}

// 模拟一次系统返回：关闭当前最上层（供应用内"返回"按钮使用）
export const back = () => {
  const top = stack[stack.length - 1]

  if (!top) {
    history.back()
    return
  }

  top.onBack()
}

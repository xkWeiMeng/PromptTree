import { ref, readonly } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastAction {
  label: string
  handler: () => void
}

export interface Toast {
  id: number
  type: ToastType
  message: string
  duration: number
  action?: ToastAction
}

// 全局 toast 列表
const toasts = ref<Toast[]>([])
let nextId = 1

/**
 * Toast 通知组合式函数
 */
export function useToast() {
  /**
   * 显示 toast 通知
   */
  function show(message: string, type: ToastType = 'info', duration = 3000) {
    const id = nextId++
    const toast: Toast = { id, type, message, duration }
    
    toasts.value.push(toast)
    
    // 自动移除
    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }
    
    return id
  }

  /**
   * 成功提示
   */
  function success(message: string, duration = 3000) {
    return show(message, 'success', duration)
  }

  /**
   * 错误提示
   */
  function error(message: string, duration = 4000) {
    return show(message, 'error', duration)
  }

  /**
   * 警告提示
   */
  function warning(message: string, duration = 3500) {
    return show(message, 'warning', duration)
  }

  /**
   * 信息提示
   */
  function info(message: string, duration = 3000) {
    return show(message, 'info', duration)
  }

  /**
   * 带操作按钮的提示
   */
  function showWithAction(
    message: string,
    type: ToastType,
    actionLabel: string,
    actionHandler: () => void,
    duration = 0
  ) {
    const id = nextId++
    const toast: Toast = {
      id,
      type,
      message,
      duration,
      action: { label: actionLabel, handler: actionHandler }
    }

    toasts.value.push(toast)

    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }

    return id
  }

  /**
   * 移除指定 toast
   */
  function remove(id: number) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  /**
   * 清除所有 toast
   */
  function clear() {
    toasts.value = []
  }

  return {
    toasts: readonly(toasts),
    show,
    success,
    error,
    warning,
    info,
    showWithAction,
    remove,
    clear
  }
}

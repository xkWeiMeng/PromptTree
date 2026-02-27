import { ref } from 'vue'

export interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  actionText?: string
  onAction?: () => void
}

const toasts = ref<ToastItem[]>([])
let nextId = 0

function show(message: string, type: ToastItem['type'] = 'info', duration = 3000) {
  const id = nextId++
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, duration)
}

function showWithAction(
  message: string,
  actionText: string,
  onAction: () => void,
  type: ToastItem['type'] = 'info',
  duration = 5000
) {
  const id = nextId++
  toasts.value.push({ id, message, type, actionText, onAction })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, duration)
}

function dismiss(id: number) {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

export function useToast() {
  return {
    toasts,
    success: (msg: string) => show(msg, 'success'),
    error: (msg: string) => show(msg, 'error'),
    info: (msg: string) => show(msg, 'info'),
    warning: (msg: string) => show(msg, 'warning'),
    show,
    showWithAction,
    dismiss,
  }
}

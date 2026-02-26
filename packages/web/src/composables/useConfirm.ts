import { ref, readonly } from 'vue'
import { i18n } from '@/i18n'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'info' | 'warning' | 'danger'
}

interface ConfirmState {
  visible: boolean
  options: ConfirmOptions
  resolve: ((value: boolean) => void) | null
}

// 全局确认弹窗状态
const state = ref<ConfirmState>({
  visible: false,
  options: { message: '' },
  resolve: null
})

/**
 * 确认弹窗组合式函数
 */
export function useConfirm() {
  /**
   * 显示确认弹窗
   */
  function confirm(options: ConfirmOptions | string): Promise<boolean> {
    const opts: ConfirmOptions = typeof options === 'string' 
      ? { message: options } 
      : options

    return new Promise((resolve) => {
      state.value = {
        visible: true,
        options: {
          title: opts.title || i18n.global.t('confirm.defaultTitle'),
          message: opts.message,
          confirmText: opts.confirmText || i18n.global.t('confirm.ok'),
          cancelText: opts.cancelText || i18n.global.t('common.cancel'),
          type: opts.type || 'info'
        },
        resolve
      }
    })
  }

  /**
   * 危险操作确认（删除等）
   */
  function confirmDanger(message: string, title = i18n.global.t('confirm.deleteTitle')): Promise<boolean> {
    return confirm({
      title,
      message,
      confirmText: i18n.global.t('common.delete'),
      type: 'danger'
    })
  }

  /**
   * 处理确认
   */
  function handleConfirm() {
    if (state.value.resolve) {
      state.value.resolve(true)
    }
    close()
  }

  /**
   * 处理取消
   */
  function handleCancel() {
    if (state.value.resolve) {
      state.value.resolve(false)
    }
    close()
  }

  /**
   * 关闭弹窗
   */
  function close() {
    state.value.visible = false
    state.value.resolve = null
  }

  return {
    state: readonly(state),
    confirm,
    confirmDanger,
    handleConfirm,
    handleCancel,
    close
  }
}

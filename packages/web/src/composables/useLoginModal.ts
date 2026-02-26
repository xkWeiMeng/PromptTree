import { ref, readonly } from 'vue'

// 全局登录弹窗状态
const visible = ref(false)

/**
 * 登录弹窗组合式函数
 * 全局单例模式，与 useConfirm / useToast 一致
 */
export function useLoginModal() {
  /**
   * 打开登录弹窗
   */
  function open() {
    visible.value = true
  }

  /**
   * 关闭登录弹窗
   */
  function close() {
    visible.value = false
  }

  return {
    visible: readonly(visible),
    open,
    close
  }
}

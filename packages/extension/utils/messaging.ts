/**
 * 消息通信封装
 * Popup ↔ Background ↔ Content Script
 */

// ========================================
// 消息类型定义
// ========================================

export type MessageType =
  | 'INJECT_PROMPT'
  | 'GET_SITE_INFO'
  | 'SYNC_NOW'
  | 'SYNC_COMPLETE'
  | 'AUTH_STATUS_CHANGED'
  | 'TOGGLE_QUICK_INSERT'
  | 'GET_SYNC_STATUS'

export interface ExtensionMessage {
  type: MessageType
  [key: string]: unknown
}

export interface InjectPromptMessage extends ExtensionMessage {
  type: 'INJECT_PROMPT'
  text: string
}

export interface GetSiteInfoMessage extends ExtensionMessage {
  type: 'GET_SITE_INFO'
}

export interface SyncNowMessage extends ExtensionMessage {
  type: 'SYNC_NOW'
}

export interface SyncCompleteMessage extends ExtensionMessage {
  type: 'SYNC_COMPLETE'
  success: boolean
  error?: string
}

export interface AuthStatusChangedMessage extends ExtensionMessage {
  type: 'AUTH_STATUS_CHANGED'
  isLoggedIn: boolean
}

// ========================================
// 消息响应
// ========================================

export interface MessageResponse {
  success: boolean
  error?: string
  data?: unknown
}

export interface SiteInfoResponse extends MessageResponse {
  data?: {
    siteName: string
    isReady: boolean
  }
}

// ========================================
// 发送消息
// ========================================

/** 发送消息到当前活动标签页的 Content Script */
export async function sendToCurrentTab(message: ExtensionMessage): Promise<MessageResponse> {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) {
      return { success: false, error: 'NO_ACTIVE_TAB' }
    }
    const response = await browser.tabs.sendMessage(tab.id, message)
    return response ?? { success: false, error: 'NO_RESPONSE' }
  } catch {
    return { success: false, error: 'SEND_FAILED' }
  }
}

/** 发送消息到指定标签页的 Content Script */
export async function sendToContentScript(
  tabId: number,
  message: ExtensionMessage
): Promise<MessageResponse> {
  try {
    const response = await browser.tabs.sendMessage(tabId, message)
    return response ?? { success: false, error: 'NO_RESPONSE' }
  } catch {
    return { success: false, error: 'SEND_FAILED' }
  }
}

/** 发送消息到 Background Service Worker */
export async function sendToBackground(message: ExtensionMessage): Promise<MessageResponse> {
  try {
    const response = await browser.runtime.sendMessage(message)
    return response ?? { success: false, error: 'NO_RESPONSE' }
  } catch {
    return { success: false, error: 'SEND_FAILED' }
  }
}

// ========================================
// 监听消息
// ========================================

type MessageHandler = (
  message: ExtensionMessage,
  sender: browser.Runtime.MessageSender
) => Promise<MessageResponse | void> | MessageResponse | void

/** 注册消息监听 */
export function onMessage(handler: MessageHandler): void {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const result = handler(message as ExtensionMessage, sender)

    if (result instanceof Promise) {
      result.then(res => sendResponse(res)).catch(() => sendResponse({ success: false }))
      return true // 异步响应
    }

    if (result) {
      sendResponse(result)
    }
    return true
  })
}

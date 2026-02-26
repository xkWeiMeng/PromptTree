---
title: 浏览器插件
description: 在 ChatGPT、Claude 等 AI 对话页面直接使用你的 Prompt。
order: 7
---

## 插件简介

PromptTree 浏览器插件让你在 AI 对话页面（ChatGPT、Claude、Gemini、Poe）直接选取和使用存储的 Prompt，无需在标签页之间来回切换。

## 支持平台

- **ChatGPT** (chat.openai.com)
- **Claude** (claude.ai)
- **Google Gemini** (gemini.google.com)
- **Poe** (poe.com)

## 安装

1. 从 Chrome Web Store 安装 PromptTree 浏览器插件
2. 点击插件图标，登录你的 PromptTree 账号
3. 自动同步你的 Prompt 库

## 使用方式

### 弹出窗口模式

1. 在 AI 对话页面点击 PromptTree 插件图标
2. 浏览你的树形 Prompt 目录
3. 点击想使用的 Prompt
4. 如有变量，填入变量值
5. 点击「填入」按钮，Prompt 自动填入对话输入框

### 快速搜索

在插件弹窗中使用搜索功能快速定位 Prompt，支持模糊匹配。

## 数据同步

插件使用 `chrome.storage` API 存储数据，并通过 HTTP 增量同步与云端保持一致。登录同一账号后，Web 端的修改会自动同步到插件。

## 权限说明

插件仅请求以下必要权限：

- **activeTab**：检测当前页面是否为支持的 AI 平台
- **storage**：本地存储你的 Prompt 数据
- **网络请求**：同步数据到 PromptTree 云端

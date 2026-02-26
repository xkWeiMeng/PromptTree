---
title: 移动端 App
description: 在 iOS 和 Android 上使用 PromptTree 管理你的 Prompt。
order: 8
---

## 移动端特点

PromptTree 移动端采用原生应用开发（React Native + Expo），针对小屏幕做了专门优化。

## 导航方式

移动端不使用复杂的树形展示，而是采用 **下钻式导航**：

1. 首页显示根级文件夹和 Prompt
2. 点击文件夹进入下一级列表
3. 顶部面包屑导航显示当前路径
4. 点击面包屑可快速返回上级

## 手势操作

- **左滑**：显示删除按钮
- **右滑**：快速复制 Prompt
- **长按**：唤起操作菜单（编辑、移动、删除）

## 搜索

顶部搜索栏支持全局搜索，快速找到任意层级的 Prompt。

## 变量填充

移动端同样支持变量填充功能。复制含变量的 Prompt 时，会弹出全屏的变量填充表单。

## 数据同步

移动端使用 SQLite 本地数据库，通过 HTTP 增量同步与云端数据保持一致。同步机制与 Web 端相同。

## 下载

- **iOS**：App Store 搜索 "PromptTree"（即将上线）
- **Android**：Google Play 搜索 "PromptTree"（即将上线）

---
title: FAQ
description: Frequently asked questions about PromptTree.
order: 9
---

## General

### What is PromptTree?

PromptTree is a Prompt management tool that organizes your AI Prompts in a tree structure with folders. It supports variable filling, offline usage, and multi-device cloud sync.

### Is it free to use?

Yes! The core features are completely free, including:
- Creating and managing Prompts
- Folder tree structure
- Variable filling
- Search and filtering
- Offline usage

### Which platforms are supported?

- **Web App**: Any modern browser (Chrome, Firefox, Safari, Edge)
- **Browser Extension**: Chrome, Edge, Brave, and other Chromium browsers
- **iOS**: iPhone and iPad
- **Android**: Phones and tablets

## Account & Sync

### Do I have to sign in?

No. PromptTree fully supports offline mode — you can use all features without signing in. Your data is stored locally in the browser. Sign in only when you want multi-device sync.

### How do I sync data across devices?

1. Sign in with the same account on each device
2. Data syncs automatically
3. Supports Web, mobile, and browser extension multi-device sync

### What happens when there's a sync conflict?

PromptTree uses a "Last Write Wins" strategy — the most recent modification takes precedence. If you edit the same Prompt on multiple devices, the latest change will overwrite earlier ones.

### Is my data safe?

- Data is transmitted over encrypted HTTPS
- Authentication uses JWT Tokens
- Works offline — core data doesn't depend on the network
- You have full control over your data

### What if the service is temporarily unavailable?

PromptTree is built by an early-stage startup team, and in rare cases cloud services may experience short instability, sync delays, or temporary disconnections. We continuously monitor and fix issues, and we do our best to restore service quickly.

We make best efforts to protect data privacy and security, and to minimize data-loss risk. For critical content, we still recommend keeping an additional local backup copy.

If you notice abnormal behavior or data-related issues, please email **hi@prompttree.app** and we will follow up as soon as possible.

## Usage

### How do I use variables?

Use the `{{variableName}}` syntax in your Prompt content. When copying, a dialog will prompt you to fill in each variable. See the [Variables Guide](/docs/variables) for details.

### How do I organize my Prompts?

- Use **folders** to group by category
- Supports **unlimited nesting** of folders
- Use **drag and drop** to rearrange
- Use **favorites** to quickly access frequently used Prompts

### Does it support import/export?

Import and export features are under development. Currently, you can copy & paste Prompt content manually.

### Can I use it on a slow network?

Absolutely. PromptTree is designed offline-first — all data is stored locally. The network is only used for syncing. Even with poor connectivity, your data is always available locally.

## Technical

### How is data stored?

| Platform | Storage |
|----------|---------|
| Web App | IndexedDB (browser) |
| Mobile App | SQLite (local) |
| Browser Extension | chrome.storage |
| Server | SQLite |

### Does it support PWA?

Yes! The Web App supports PWA. You can install it to your desktop from the browser and use it like a native application.

### How can I report bugs?

Please submit an Issue on [GitHub](https://github.com/xiekang/prompttree/issues), and we'll respond promptly.

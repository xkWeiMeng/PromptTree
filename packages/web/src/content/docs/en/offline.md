---
title: Offline Usage
description: Learn how to use PromptTree without an internet connection.
order: 5
---

## Offline-First Design

PromptTree follows an **offline-first** philosophy — all core features work without a network connection:

- Create and edit Prompts
- Manage folder structure
- Fill variables and copy content
- Search and filter
- Browse mind maps and outlines

## How It Works

### Local Storage

- **Web App**: Data is stored in the browser's IndexedDB
- **Mobile App**: Data is stored in a local SQLite database
- **Browser Extension**: Data is stored in chrome.storage

### Modifications While Offline

When you're offline, all changes are saved locally and marked as "pending sync". Once you're back online, the system automatically syncs your changes with the server.

### PWA Support

The Web App is a Progressive Web App (PWA), allowing you to:

1. **Install to Desktop**: Install PromptTree as a desktop application from your browser
2. **Cache Resources**: Core resources are cached locally, enabling offline access
3. **Auto Update**: When online, the app automatically checks for and applies updates

## Usage Scenarios

- ✅ Use on airplanes — offline editing
- ✅ Unstable network — no data loss
- ✅ Guest mode — use without signing in
- ✅ Fully local — no worry about data privacy

## Limitations

While offline, the following features are unavailable:

- Cross-device sync
- Sign-in and registration
- Cloud backup

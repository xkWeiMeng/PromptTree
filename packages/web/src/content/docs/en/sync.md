---
title: Sync & Multi-Device
description: Learn about PromptTree's cloud sync mechanism and multi-device usage.
order: 4
---

## Sync Mechanism

PromptTree uses an **offline-first + incremental sync** architecture:

1. All write operations are first saved to the local database
2. Modified data is marked as "pending sync"
3. After a 2-second debounce, changes are automatically uploaded to the cloud
4. The server responds with incremental updates

## Sign In to Sync

To enable cloud sync, you need to sign in. Three sign-in methods are supported:

- **Google One-Tap**: Quick sign-in with your Google account
- **GitHub OAuth**: Sign in with your GitHub account
- **Email Magic Link**: Enter your email, click the link you receive to sign in

## Offline Mode

You can use offline mode without signing in:

- All data is stored locally in the browser (IndexedDB)
- Full functionality is available — create, edit, delete, search
- Data only exists in the current browser
- Sign in later to sync your local data to the cloud

## Multi-Device Sync

After signing in with the same account, data syncs automatically across all devices:

| Platform | Storage | Sync Method |
|----------|---------|-------------|
| Web App | IndexedDB | HTTP incremental sync |
| iOS / Android | SQLite | HTTP incremental sync |
| Browser Extension | chrome.storage | HTTP incremental sync |

## Conflict Resolution

When the same Prompt is edited on multiple devices simultaneously, a **Last Write Wins** strategy is used — the most recent modification takes precedence (compared by `updatedAt` timestamp).

## Data Security

- Transport is encrypted with HTTPS
- Authentication uses JWT Tokens
- Server data is stored in a SQLite database
- Offline mode is supported — core data doesn't depend on the network

# PromptTree - Comprehensive Feature Inventory

## 📊 Project Structure
- **packages/shared**: Shared utilities and types (tree operations, variables, sync)
- **packages/web**: Web application (Vue 3 + Pinia)
- **packages/extension**: Browser extension (WXT framework)
- **packages/backend**: Backend API (not explored)
- **packages/mobile**: Mobile app (not explored)

---

## 1. CORE TREE OPERATIONS (packages/shared/src/)

### 1.1 Tree Utilities (tree-utils.ts)
**Function exports:**
- `buildTree()` - Converts flat node array to hierarchical tree structure
- `findNode()` - Searches for a node by ID in flat array
- `getDescendantIds()` - Retrieves all descendant IDs of a given parent
- `isAncestor()` - Checks if nodeId is ancestor of targetId
- `getBreadcrumb()` - Generates navigation path from node to root
- `createDefaultNode()` - Creates new node with default values

**Key logic:**
- Flat storage model (not nested) for database optimization
- Recursive tree building with automatic sorting
- Soft delete support (deletedAt field)
- Ancestor validation for safe node movement

### 1.2 Variable Management (variable.ts)
**Function exports:**
- `extractVariables()` - Extracts {{variable}} patterns from prompt content
- `hasVariables()` - Boolean check for variable presence
- `fillVariables()` - Replaces {{variable}} with values, preserves unknown vars
- `validateVariables()` - Returns list of missing/empty variable values

**Pattern support:**
- Regex: `/\{\{(\w+)\}\}/g` - Supports {{name}} syntax
- De-duplication of extracted variables
- Partial filling with fallback to original syntax

### 1.3 Sync Logic (sync-logic.ts)
**Function exports:**
- `computeLocalChanges()` - Identifies nodes updated since last sync
- `mergeServerChanges()` - Merges server updates using "Last Write Wins"
- `createSyncRequest()` - Wraps local changes for API
- `processSyncResponse()` - Applies server changes to local state

**Sync strategy:**
- Time-based conflict resolution (updatedAt comparison)
- Support for upsert and delete actions
- Soft delete implementation (sets deletedAt timestamp)
- Version tracking with optimistic locking

### 1.4 Core Data Types (types.ts)

**Node Model:**
```typescript
TreeNode {
  id: string
  parentId: string | null
  type: 'folder' | 'prompt'
  title: string
  content: string
  isFavorite: boolean
  sortOrder: number
  collapsed: boolean
  createdAt: number
  updatedAt: number
  deletedAt: number | null
  version: number
}
```

**User Model:**
```typescript
User {
  id: string
  email: string
  displayName: string | null
  avatarUrl: string | null
  createdAt: number
  lastSyncAt: number
}
```

**Sync Models:**
- `SyncAction`: 'upsert' | 'delete'
- `SyncChange`: { id, action, data }
- `SyncRequest`: { lastSyncTime, changes[] }
- `SyncResponse`: { serverTime, changes[], conflicts[] }
- `SyncConflict`: { nodeId, localVersion, serverVersion }

---

## 2. WEB APP COMPONENTS (packages/web/src/components/)

### 2.1 Editor Components
**PromptEditor.vue** - Main prompt editing interface
- Rich text editing for prompt content
- Line numbers and syntax highlighting
- Undo/redo support (Vue integration)

**VariableFillModal.vue** - Variable substitution dialog
- Interactive form for filling {{variable}} placeholders
- Real-time preview of filled content
- Validation of required variables

### 2.2 Overview / Navigation Components
**OutlineView.vue** - Hierarchical list view
- Collapsible folder structure
- Node creation/deletion from outline
- Breadcrumb navigation support

**OutlineNodeItem.vue** - Single outline node renderer
- Edit/delete actions inline
- Folder vs prompt type indicators
- Drag-and-drop support

**MindMapView.vue** - Mindmap/graph visualization
- Visual tree representation
- Interactive node positioning
- Root selection for subtree view

**ViewSwitcher.vue** - View mode toggle
- Switches between: welcome, editor, outline, mindmap
- View persistence state

### 2.3 Layout Components
**MainLayout.vue** - Main application shell
- Top navigation bar
- Sidebar with tree view
- Content area with editor/outline/mindmap
- Responsive design

### 2.4 Tree Components
**TreeView.vue** - Full tree renderer
- Virtualized rendering for performance
- Expand/collapse state management
- Selection highlighting

**TreeNode.vue** - Single tree node
- Folder and prompt type rendering
- Context menu (edit, delete, create child, favorite)
- Drag-drop source/target
- Inline rename capability

**TreeToolbar.vue** - Tree actions toolbar
- Expand/collapse all buttons
- Search/filter prompts
- Create new folder/prompt
- View mode switcher

### 2.5 Common Components
**LoginModal.vue** - Authentication dialog
- Email input for magic link
- Token verification flow
- Offline mode option

**UserProfilePanel.vue** - User account menu
- Display user info
- Edit display name / avatar
- Logout button
- Profile settings access

**ShareModal.vue** - Sharing dialog
- Generate shareable links
- Export/import prompts
- Share permissions

**SyncStatus.vue** - Sync indicator
- Displays sync state (idle/syncing/success/error)
- Pending changes count
- Manual sync trigger button

**ThemeToggle.vue** - Dark/light mode switcher

**LanguageSwitcher.vue** - i18n language selection

**Toast.vue** - Notification system
- Success/error/info/warning messages
- Auto-dismiss

**ConfirmDialog.vue** - Generic confirmation modal

**BrandLogo.vue** - App logo/branding

### 2.6 Site Components
**SiteHeader.vue** - Landing page header
**SiteLayout.vue** - Marketing site shell
**SiteFooter.vue** - Footer with links
**FeatureIllustration.vue** - Feature showcase images
**FeatureDetailIllustration.vue** - Detailed feature visuals
**MarkdownRenderer.vue** - Markdown to HTML converter

---

## 3. WEB APP STATE MANAGEMENT (packages/web/src/stores/)

### 3.1 Tree Store (tree.ts)
**State:**
- `nodes`: LocalNode[] - All nodes from database
- `selectedNodeId`: string | null
- `expandedIds`: Set<string> - Expanded folder IDs
- `viewMode`: 'welcome' | 'editor' | 'outline' | 'mindmap'
- `mindmapRootId`: string | null - Root for mindmap view
- `editingNodeId`: string | null - Node being renamed
- `isLoading`: boolean

**Computed Properties:**
- `rootNodes` - Tree structure (filtered non-deleted)
- `selectedNode` - Current selection
- `favoriteNodes` - Filtered favorite nodes

**Actions:**
- `loadFromDB()` - Initialize from IndexedDB
- `createNode()` - Create folder or prompt
- `updateNode()` - Edit node properties
- `deleteNode()` - Soft delete node and children
- `moveNode()` - Reparent and reorder
- `toggleFavorite()` - Star/unstar node
- `toggleExpanded()` - Expand/collapse folder
- `selectNode()` - Change selection
- `setViewMode()` - Switch view type
- `setMindmapRoot()` - Set mindmap focus
- `startEditing() / stopEditing()` - Rename mode
- `expandAll() / collapseAll()` - Bulk actions
- `setNodes()` - Sync from server
- `clearNodes()` - Reset tree
- `closeEditor()` - Return to welcome view

### 3.2 Sync Store (sync.ts)
**State:**
- `status`: 'idle' | 'syncing' | 'success' | 'error'
- `lastSyncTime`: number
- `lastError`: string | null
- `pendingCount`: number

**Computed Properties:**
- `isSyncing` - Currently syncing
- `hasPendingChanges` - Changes waiting to sync

**Actions:**
- `init()` - Load sync state from DB
- `triggerSync()` - Debounced sync (2s)
- `sync()` - Incremental sync with server
- `fullSync()` - Complete resync from server
- `updatePendingCount()` - Refresh pending list
- `reset()` - Clear sync state

**Sync Flow:**
1. Get dirty (modified) nodes since last sync
2. Build SyncChange list (upsert/delete)
3. Mark as pendingSync
4. POST to `/api/sync` with lastSyncTime
5. Merge server changes using Last Write Wins
6. Update lastSyncTime
7. Clear dirty flags
8. Notify UI of completion

### 3.3 Auth Store (auth.ts)
**State:**
- `user`: User | null
- `accessToken`: string | null
- `isLoading`: boolean
- `isOfflineMode`: boolean

**Computed Properties:**
- `isLoggedIn` - Has token and user
- `canAccessApp` - Logged in OR offline mode

**Actions:**
- `init()` - Restore from local storage
- `setAuth()` - Store token and user
- `logout()` - Clear all data
- `handleToken()` - Verify token via API
- `handleTokenFromUrl()` - Parse OAuth callback
- `checkAuth()` - Validate token freshness
- `updateProfile()` - Edit display name/avatar
- `enterOfflineMode()` - Browse without sync
- `exitOfflineMode()` - Resume online sync

---

## 4. BROWSER EXTENSION FEATURES (packages/extension/)

### 4.1 Extension Architecture

**Entry Points:**
1. **background.ts** - Service worker
2. **content.ts** - Content script (injected into AI sites)
3. **popup/App.vue** - Extension popup UI

### 4.2 Content Script (content.ts)

**Supported Sites:**
- ChatGPT (chat.openai.com, chatgpt.com)
- Claude (claude.ai)
- Gemini (gemini.google.com)
- Poe (poe.com)

**Messages handled:**
- `INJECT_PROMPT` - Insert prompt into input box
- `GET_SITE_INFO` - Return current site details

**Capabilities:**
- Auto-detect current AI platform
- Wait for input element to load (max 3s)
- Insert text and trigger input events
- Handle multiple textarea/contenteditable variants

### 4.3 Background Script (background.ts)

**Features:**
- **Periodic Sync**: Every 5 minutes (chrome.alarms)
- **Quick Insert**: Keyboard shortcut to open popup
- **Message Routing**: Hub for popup ↔ content-script communication

**Sync Implementation:**
- Runs in background even when popup closed
- Gets dirty nodes, constructs SyncChange list
- POSTs to API with Bearer token
- Merges changes using Last Write Wins
- Broadcasts completion to popup windows

**Message Types:**
- `SYNC_NOW` - Trigger immediate sync
- `GET_SYNC_STATUS` - Query pending count
- `SYNC_COMPLETE` - Broadcast to popups

### 4.4 Extension Popup (popup/)

**Components:**
- `App.vue` - Main popup shell
- `OutlineView.vue` - Tree list navigation
- `TreeView.vue` - Collapsed/expanded tree
- `TreeNode.vue` - Clickable node with actions
- `MindMapView.vue` - Graphical tree view
- `VariableFillModal.vue` - Fill {{variable}} prompts
- `NodeEditor.vue` - Quick edit node title/content
- `ContextMenu.vue` - Right-click menu
- `SearchBar.vue` - Quick search/filter
- `SyncStatus.vue` - Sync status indicator
- `Toast.vue` - Notifications
- `ConfirmDialog.vue` - Confirm dialogs
- `ViewSwitcher.vue` - View mode toggle

**Views:**
- `LoginView.vue` - Authenticate user
- `MainView.vue` - Main UI (tree + editor)
- `SettingsView.vue` - Extension preferences

**Features:**
- Click prompt → Inject into ChatGPT/Claude/etc.
- Fill {{variable}} interactively
- View/edit full prompt content
- Organize by folders
- Mark favorites
- Search/filter prompts
- Manual sync button
- Login/logout
- Settings panel

### 4.5 Extension Utils

**Storage (utils/storage.ts):**
- Browser local storage for nodes, tokens, settings
- LocalNode type extends TreeNode with _dirty, _pendingSync flags

**Sites (utils/sites.ts):**
- SiteAdapter interface for platform support
- Adapters for ChatGPT, Claude, Gemini, Poe
- Input detection and text insertion helpers

**Messaging (utils/messaging.ts):**
- Message passing between popup and background

---

## 5. DATA PERSISTENCE LAYER

### 5.1 Web App Database (packages/web/src/db/)

**Storage Operations (operations.ts):**
- `getActiveNodes()` - Fetch non-deleted nodes
- `getDirtyNodes()` - Get modified nodes
- `upsertNode()` - Create/update single node
- `updateNode()` - Update node properties
- `deleteNode()` - Mark as deleted
- `clearAllNodes()` - Wipe database
- `markPendingSync()` - Flag nodes as syncing
- `clearDirty()` - Remove dirty flags
- `getLastSyncTime()` - Retrieve last sync timestamp
- `setLastSyncTime()` - Update sync timestamp

**Implementation:**
- IndexedDB for web app
- Meta table for sync state, auth tokens
- LocalNode includes _dirty and _pendingSync flags

---

## 6. API CLIENT (packages/shared/src/api-client.ts)

**Configuration:**
```typescript
interface ApiClientConfig {
  baseUrl: string
  getToken: () => string | null
  onUnauthorized?: () => void
}
```

**Endpoints:**
- `POST /api/auth/magic-link` - Send magic link email
- `GET /api/auth/verify?token=` - Verify magic link
- `POST /api/sync` - Incremental sync
- `GET /api/sync/full` - Full resync
- `POST /api/auth/me` - Get current user
- `PATCH /api/auth/profile` - Update user info

**Response Format:**
```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
```

---

## 7. FEATURE SUMMARY BY USE CASE

### 7.1 Prompt Management
✅ Create/edit/delete prompts and folders
✅ Hierarchical organization with drag-drop
✅ Favorite/star prompts
✅ Search and filter
✅ Full-text search (via filter)

### 7.2 Variable System
✅ Define variables with {{name}} syntax
✅ Extract variables from prompts
✅ Fill variables interactively before use
✅ Validate all required variables filled
✅ Preserve unfilled variables

### 7.3 Synchronization
✅ Bidirectional sync with backend
✅ Conflict resolution (Last Write Wins)
✅ Offline-first with soft deletes
✅ Debounced auto-sync (2s on web)
✅ Periodic sync (5min on extension)
✅ Full resync fallback
✅ Pending change tracking

### 7.4 Authentication
✅ Passwordless magic link login
✅ OAuth token handling
✅ Offline mode (no sync)
✅ Profile editing (name, avatar)
✅ Logout with data clear

### 7.5 Multi-View UI
✅ Welcome view (onboarding)
✅ Editor view (full prompt editing)
✅ Outline view (hierarchical list)
✅ Mind map view (visual tree)
✅ Switchable views with state persistence

### 7.6 Browser Integration
✅ Content script for ChatGPT, Claude, Gemini, Poe
✅ One-click prompt injection into chat
✅ Keyboard shortcut to open popup
✅ Auto-detect AI platform
✅ Background sync (no UI interaction)
✅ Per-site text insertion adapters

### 7.7 UX Features
✅ Dark/light theme toggle
✅ Multi-language support (i18n)
✅ Toast notifications
✅ Confirmation dialogs
✅ Sync status indicator
✅ Inline node renaming
✅ Breadcrumb navigation
✅ Context menus

---

## 8. KEY ARCHITECTURAL PATTERNS

### 8.1 State Management
- **Pinia stores** for centralized state (web + extension)
- Flat node storage with tree building on demand
- LocalNode extends TreeNode with metadata flags (_dirty, _pendingSync)

### 8.2 Sync Strategy
- **Flat storage + Last Write Wins** (not CRDT)
- Time-based conflict: server version wins if updatedAt > local
- Soft delete with deletedAt timestamp
- Version field for optimistic locking

### 8.3 Offline-First
- IndexedDB/browser storage for local data
- Auto-save all changes to local DB
- Background sync (web: debounced, extension: periodic)
- Offline mode for viewing without sync

### 8.4 Site Adapters
- Pluggable SiteAdapter interface
- Selector-based element detection
- Handles TextArea and contenteditable variants
- Waits for input with timeout

---

## 9. MISSING PIECES / TODO

Not explored in detail:
- **Backend API** (packages/backend/) - Sync server implementation
- **Mobile App** (packages/mobile/) - Mobile client
- **Database schema** - Backend persistence structure
- **Auth backend** - Magic link verification logic
- **Search implementation** - Full-text search engine
- **Export/import** - Data portability features
- **Sharing** - Shared prompts or collections

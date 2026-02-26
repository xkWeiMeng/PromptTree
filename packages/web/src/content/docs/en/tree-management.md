---
title: Tree Structure Management
description: Learn how to use folders and hierarchy to organize your Prompt library.
order: 2
---

## Tree Structure Overview

The core of PromptTree is tree structure management. Just like using macOS Finder or VS Code, you can organize your Prompts with nested folders.

## Node Types

There are two types of nodes in the tree:

- **Folder**: For categorization and organization — can contain sub-folders and Prompts
- **Prompt**: Stores actual prompt content

Folders and Prompts can coexist at the same level.

## Basic Operations

### Create

- Click the **folder icon** in the toolbar to create a folder
- Click the **file icon** in the toolbar to create a Prompt
- New nodes are created under the currently selected folder, or at the root level

### Rename

Double-click a node title to enter edit mode. Press Enter to confirm or Esc to cancel.

### Delete

Right-click a node and select "Delete", or press the Delete key while selected. Deletion uses a soft-delete mechanism — data isn't immediately removed.

### Drag & Drop

Hold and drag a node to:

- Rearrange the order of sibling nodes
- Move a node into another folder
- Adjust folder nesting levels

## Unlimited Nesting

The system supports unlimited nesting levels, though we recommend keeping it within 3–4 levels for the best experience.

Recommended organization:

```
📁 Work
  📁 Translation
    📄 General Chinese-to-English
    📄 Technical Documentation
  📁 Writing
    📄 Blog Post Framework
    📄 Product Copy Polish
📁 Programming
  📁 Code Review
  📁 Architecture Design
📁 Learning
  📄 Concept Explanation Template
```

## Collapse & Expand

Click the arrow to the left of a folder to expand or collapse it. The collapse state is remembered — even after refreshing the page or switching devices, your last expand state is preserved.

## Favorites

Star frequently used Prompts to mark them as favorites — quickly access them from the "Favorites" section at the top of the tree panel.

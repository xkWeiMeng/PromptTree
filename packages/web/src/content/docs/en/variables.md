---
title: Variable Filling
description: Create reusable Prompt templates using {{variable}} syntax.
order: 3
---

## What is Variable Filling?

Variable filling is a core feature of PromptTree. By using `{{variableName}}` syntax in your Prompts, you can create reusable templates.

## Basic Usage

Wrap variable names in double curly braces within your Prompt content:

```
You are a {{role}}, please help me {{task description}}.

Requirements:
- Tone: {{tone style}}
- Length: {{word count}}
```

## Auto-Fill on Copy

When you click the copy button, PromptTree automatically detects variables in the Prompt:

1. Variables are detected and a filling dialog appears
2. Each variable is shown as an input field
3. Fill in the values and click "Copy"
4. Variables are replaced with actual values, and the final Prompt is copied to your clipboard

## Variable Naming Rules

- Use meaningful names (any language is supported)
- Variable names cannot contain `{{` or `}}` characters
- The same variable name can appear multiple times in a Prompt — you only need to fill it in once

## Examples

### Translation Template

```
Please translate the following content from {{source language}} to {{target language}}.

Requirements:
- Preserve the tone and style of the original
- Use standard translations for {{field}} terminology

Original text:
{{content to translate}}
```

### Code Review Template

```
Please review the following {{programming language}} code:

```{{programming language}}
{{code content}}
```

Please focus on:
1. Code quality and readability
2. Potential bugs and security issues
3. Performance optimization suggestions
```

## Tips

- Use consistent variable names across frequently used templates
- Add commonly used templates to favorites for quick access
- Use with the browser extension to fill variables directly on AI chat pages

/**
 * 变量解析模块
 * 支持 {{variable}} 语法
 */

const VARIABLE_REGEX = /\{\{(\w+)\}\}/g

/**
 * 提取 Prompt 中的所有变量名
 * @example extractVariables("Hello {{name}}, welcome to {{place}}") => ["name", "place"]
 */
export function extractVariables(content: string): string[] {
  const matches = content.matchAll(VARIABLE_REGEX)
  const variables = [...matches].map(m => m[1])
  // 去重
  return [...new Set(variables)]
}

/**
 * 检查 Prompt 是否包含变量
 */
export function hasVariables(content: string): boolean {
  return VARIABLE_REGEX.test(content)
}

/**
 * 填充变量值
 * @example fillVariables("Hello {{name}}", { name: "World" }) => "Hello World"
 */
export function fillVariables(content: string, values: Record<string, string>): string {
  return content.replace(VARIABLE_REGEX, (match, name) => {
    return values[name] ?? match // 未提供值则保留原样
  })
}

/**
 * 验证所有变量是否已填充
 */
export function validateVariables(content: string, values: Record<string, string>): string[] {
  const required = extractVariables(content)
  return required.filter(name => !values[name] || values[name].trim() === '')
}

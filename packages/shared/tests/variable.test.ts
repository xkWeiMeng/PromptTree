import { describe, it, expect } from 'vitest'
import { extractVariables, hasVariables, fillVariables, validateVariables } from '../src/variable'

describe('variable', () => {
  describe('extractVariables', () => {
    it('应该提取单个变量', () => {
      expect(extractVariables('Hello {{name}}')).toEqual(['name'])
    })

    it('应该提取多个变量', () => {
      expect(extractVariables('Hello {{name}}, welcome to {{place}}'))
        .toEqual(['name', 'place'])
    })

    it('应该去重重复的变量', () => {
      expect(extractVariables('{{name}} and {{name}} again'))
        .toEqual(['name'])
    })

    it('没有变量时返回空数组', () => {
      expect(extractVariables('Hello World')).toEqual([])
    })

    it('应该忽略不完整的变量语法', () => {
      expect(extractVariables('Hello {name} and {{}')).toEqual([])
    })
  })

  describe('hasVariables', () => {
    it('有变量时返回 true', () => {
      expect(hasVariables('Hello {{name}}')).toBe(true)
    })

    it('没有变量时返回 false', () => {
      expect(hasVariables('Hello World')).toBe(false)
    })
  })

  describe('fillVariables', () => {
    it('应该替换单个变量', () => {
      expect(fillVariables('Hello {{name}}', { name: 'World' }))
        .toBe('Hello World')
    })

    it('应该替换多个变量', () => {
      expect(fillVariables('{{greeting}} {{name}}!', { greeting: 'Hello', name: 'World' }))
        .toBe('Hello World!')
    })

    it('未提供值时保留原变量', () => {
      expect(fillVariables('Hello {{name}}', {}))
        .toBe('Hello {{name}}')
    })

    it('应该处理空字符串值', () => {
      expect(fillVariables('Hello {{name}}', { name: '' }))
        .toBe('Hello ')
    })
  })

  describe('validateVariables', () => {
    it('所有变量都已填充时返回空数组', () => {
      expect(validateVariables('Hello {{name}}', { name: 'World' }))
        .toEqual([])
    })

    it('应该返回未填充的变量名', () => {
      expect(validateVariables('{{a}} {{b}} {{c}}', { a: 'x' }))
        .toEqual(['b', 'c'])
    })

    it('空值应被视为未填充', () => {
      expect(validateVariables('Hello {{name}}', { name: '' }))
        .toEqual(['name'])
    })

    it('仅空格应被视为未填充', () => {
      expect(validateVariables('Hello {{name}}', { name: '   ' }))
        .toEqual(['name'])
    })
  })
})

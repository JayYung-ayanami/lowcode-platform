import { describe, it, expect } from 'vitest'
import { generatePageCode } from '../codegen'
import type { PageSchema } from '../../types/schema'

describe('codegen', () => {
  it('should generate basic page structure with title', () => {
    const mockPage: PageSchema = {
      title: 'Test Page',
      root: {
        id: 'root',
        type: 'Page',
        name: 'Root',
        props: {},
        children: []
      }
    }

    const code = generatePageCode(mockPage)
    expect(code).toContain('import React from "react"')
    expect(code).toContain('export default function GeneratedPage()')
    expect(code).toContain('<h1>Test Page</h1>')
    // Page 类型按注册表出码为原生 div
    expect(code).toContain('className="page-container"')
  })

  it('should generate component with props', () => {
    const mockPage: PageSchema = {
      title: 'Props Test',
      root: {
        id: 'root',
        type: 'Container',
        name: 'Root',
        props: {},
        children: [
          {
            id: 'btn1',
            type: 'Button',
            name: 'Button',
            props: {
              type: 'primary',
              danger: true,
              size: 'large',
              count: 123
            },
            children: []
          }
        ]
      }
    }

    const code = generatePageCode(mockPage)
    expect(code).toContain('type="primary"')
    expect(code).toContain('danger={true}')
    expect(code).toContain('size="large"')
    expect(code).toContain('count={123}')
  })

  it('should generate component with style', () => {
    const mockPage: PageSchema = {
      title: 'Style Test',
      root: {
        id: 'root',
        type: 'Container',
        name: 'Root',
        props: {},
        children: [
          {
            id: 'div1',
            type: 'Container',
            name: 'Container',
            props: {},
            style: {
              color: 'red',
              fontSize: '16px'
            },
            children: []
          }
        ]
      }
    }

    const code = generatePageCode(mockPage)
    expect(code).toContain('style={{')
    expect(code).toContain('color: "red"')
    expect(code).toContain('fontSize: "16px"')
  })

  it('should handle children text', () => {
    const mockPage: PageSchema = {
      title: 'Text Test',
      root: {
        id: 'root',
        type: 'Container',
        name: 'Root',
        props: {},
        children: [
          {
            id: 'btn1',
            type: 'Button',
            name: 'Button',
            props: {
                children: 'Click Me'
            },
            children: []
          }
        ]
      }
    }
    const code = generatePageCode(mockPage)
    expect(code).toContain('>Click Me</Button>')
  })

  it('should only import the antd components actually used', () => {
    const mockPage: PageSchema = {
      title: 'Imports',
      root: {
        id: 'root', type: 'Container', name: 'Root', props: {},
        children: [
          { id: 'b', type: 'Button', name: 'b', props: { children: 'OK' } },
          { id: 'c', type: 'Card', name: 'c', props: { title: 'T' }, children: [] },
        ],
      },
    }
    const code = generatePageCode(mockPage)
    expect(code).toMatch(/import \{ [^}]*Button[^}]* \} from "antd"/)
    expect(code).toContain('Card')
    // 未使用的组件不应被导入
    expect(code).not.toContain('Modal')
    expect(code).not.toContain('Divider')
  })

  it('should inject helper definition for FormItem and import its antd dep Form', () => {
    const mockPage: PageSchema = {
      title: 'Helper',
      root: {
        id: 'root', type: 'Form', name: 'form', props: { layout: 'vertical' },
        children: [
          { id: 'fi', type: 'FormItem', name: 'item', props: { label: '姓名', name: 'name' }, children: [] },
        ],
      },
    }
    const code = generatePageCode(mockPage)
    expect(code).toContain('const FormItem = Form.Item;')
    expect(code).toMatch(/import \{ [^}]*Form[^}]* \} from "antd"/)
  })

  it('should generate helper for custom non-antd components (Progress)', () => {
    const mockPage: PageSchema = {
      title: 'Custom',
      root: {
        id: 'root', type: 'Container', name: 'Root', props: {},
        children: [
          { id: 'p', type: 'Progress', name: 'p', props: { percent: 50 } },
        ],
      },
    }
    const code = generatePageCode(mockPage)
    expect(code).toContain('const Progress =')
    expect(code).toContain('<Progress')
  })

  it('should render Text as helper with text rendered to children', () => {
    const mockPage: PageSchema = {
      title: 'TextHelper',
      root: {
        id: 'root', type: 'Container', name: 'Root', props: {},
        children: [
          { id: 't', type: 'Text', name: 't', props: { text: '你好', fontSize: '16px' } },
        ],
      },
    }
    const code = generatePageCode(mockPage)
    expect(code).toContain('const Text =')
    expect(code).toContain('<Text')
  })

  it('should deduplicate repeated helper definitions', () => {
    const mockPage: PageSchema = {
      title: 'Dedup',
      root: {
        id: 'root', type: 'Container', name: 'Root', props: {},
        children: [
          { id: 't1', type: 'Text', name: 't1', props: { text: 'a' } },
          { id: 't2', type: 'Text', name: 't2', props: { text: 'b' } },
        ],
      },
    }
    const code = generatePageCode(mockPage)
    const occurrences = code.split('const Text =').length - 1
    expect(occurrences).toBe(1)
  })
})


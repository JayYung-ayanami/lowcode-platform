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
    expect(code).toContain('<Page')
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
})


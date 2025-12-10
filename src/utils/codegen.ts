import type { PageSchema, ComponentSchema } from '../types/schema'

// 辅助函数：将props对象转换为字符串
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateProps = (props: Record<string, any>): string => {
  return Object.keys(props)
    // 过滤掉children，因为它应该放在标签中间，而不是作为属性
    .filter(key => key !== 'children')
    .map((key) => {
      const value = props[key]
      if (typeof value === 'string') {
        return `${key}="${value}"`
      }
      return `${key}={${JSON.stringify(value)}}`
    })
    .join(' ')
}

// 递归生成组件代码
const generateComponentCode = (node: ComponentSchema, indent: number = 0): string => {
    // 生成指定数量的空格字符串，用来做代码缩进
    const spaces = ' '.repeat(indent) 
    const propsStr = generateProps(node.props)

    // 如果style存在且不为空，才生成style属性
    const styleStr = (node.style && Object.keys(node.style).length > 0)
      ? `style={${JSON.stringify(node.style)}}`
      : ''

    // 组合属性字符串（去掉多余空格）
    const attributes = [styleStr, propsStr].filter(Boolean).join(' ')

    // 获取子节点内容（可能是组件数组，也可能是props.children里的字符串）
    let childrenCode = ''

    if (node.children && node.children.length > 0) {
      // 情况A：有嵌套的子组件（ComponentNode[]）
      childrenCode = '\n' + node.children
        .map(child => generateComponentCode(child, indent + 2))
        .join('\n') + '\n' + spaces
    } else if (typeof node.props.children === 'string') {
      // 情况B：没有子组件，但props.children是文本
      childrenCode = node.props.children
    }

    // 如果没有任何内容，使用自闭和标签
    if (!childrenCode) {
      return `${spaces}<${node.type} ${attributes}>`
    }

    // 生成完整标签
    return `${spaces}<${node.type} ${attributes}>${childrenCode}</${node.type}>`
}

export const generatePageCode = (page: PageSchema): string => {
    const imports = `import React from 'react';\nimport { Button, Input } from 'antd';`
    const rootComponentCode = generateComponentCode(page.root, 4) // 初始缩进4个空格

    return `${imports}

export default function GeneratedPage() {
    return (
      <div className="page-container">
        <h1>${page.title}</h1>
${rootComponentCode}
      </div>  
    )
}`
}
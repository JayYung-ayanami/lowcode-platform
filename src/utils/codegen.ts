import type { PageSchema, ComponentSchema } from '../types/schema'
import * as t from '@babel/types'
import generate from '@babel/generator'
import { materialMap } from '../materials/registry'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createJSXAttribute = (key: string, value: any): t.JSXAttribute => {
  let propValue: t.StringLiteral | t.JSXExpressionContainer | null = null

  if (typeof value === 'string') {
    propValue = t.stringLiteral(value)
  } else if (typeof value === 'number') {
    propValue = t.jsxExpressionContainer(t.numericLiteral(value))
  } else if (typeof value === 'boolean') {
    propValue = t.jsxExpressionContainer(t.booleanLiteral(value))
  } else if (value === null || value === undefined) {
    propValue = null
  } else {
    // 对象 / 数组：序列化为 JS 表达式（通过模板字面量承载，再由 generator 还原）
    try {
      propValue = t.jsxExpressionContainer(t.identifier(JSON.stringify(value)))
    } catch {
      console.warn(`无法处理的属性值类型: ${key}`, value)
    }
  }

  return t.jsxAttribute(t.jsxIdentifier(key), propValue)
}

const createJSXElement = (node: ComponentSchema): t.JSXElement => {
  const meta = materialMap[node.type]
  const tag = meta?.codegen.tag || node.type
  const textProp = meta?.codegen.textProp

  const attributes: t.JSXAttribute[] = []

  if (node.props) {
    Object.entries(node.props).forEach(([key, value]) => {
      // children 与「文本属性」交由 children 处理，不作为属性输出
      if (key === 'children') return
      if (textProp && key === textProp) return
      attributes.push(createJSXAttribute(key, value))
    })
  }

  if (node.style && Object.keys(node.style).length > 0) {
    const styleProperties = Object.entries(node.style).map(([k, v]) =>
      t.objectProperty(t.identifier(k), t.stringLiteral(String(v))),
    )
    attributes.push(
      t.jsxAttribute(t.jsxIdentifier('style'), t.jsxExpressionContainer(t.objectExpression(styleProperties))),
    )
  }

  let childrenNodes: (t.JSXElement | t.JSXText)[] = []
  if (node.children && node.children.length > 0) {
    childrenNodes = node.children.map((child) => createJSXElement(child))
  } else if (textProp && node.props?.[textProp] !== undefined) {
    childrenNodes = [t.jsxText(String(node.props[textProp]))]
  } else if (typeof node.props?.children === 'string') {
    childrenNodes = [t.jsxText(node.props.children)]
  }

  const selfClosing = childrenNodes.length === 0
  const openingElement = t.jsxOpeningElement(t.jsxIdentifier(tag), attributes, selfClosing)
  const closingElement = selfClosing ? null : t.jsxClosingElement(t.jsxIdentifier(tag))

  return t.jsxElement(openingElement, closingElement, childrenNodes, selfClosing)
}

// 递归收集所有使用到的组件类型
const collectTypes = (node: ComponentSchema, types: Set<string>) => {
  types.add(node.type)
  if (node.children) {
    node.children.forEach((child) => collectTypes(child, types))
  }
}

/**
 * 将页面 Schema 编译为 React + Antd 源代码。
 *
 * 流程：依赖收集 → 按物料注册表区分 antd 导入 / helper 定义 → AST 生成主组件 → 拼装源码。
 * 导入清单、helper 定义、标签名、文本子节点策略全部由注册表（materialMap）驱动。
 */
export const generatePageCode = (page: PageSchema): string => {
  // 1. 依赖收集
  const usedTypes = new Set<string>()
  collectTypes(page.root, usedTypes)

  // 2. 按注册表区分 antd 导入与 helper 定义
  const antdImports = new Set<string>()
  const helperCodes: string[] = []
  const seenHelper = new Set<string>()

  usedTypes.forEach((type) => {
    const meta = materialMap[type]
    if (!meta) return
    const cg = meta.codegen
    if (cg.source === 'antd') {
      antdImports.add(cg.tag || type)
    } else if (cg.source === 'helper') {
      cg.helperAntdDeps?.forEach((dep) => antdImports.add(dep))
      if (cg.helperCode && !seenHelper.has(type)) {
        seenHelper.add(type)
        helperCodes.push(cg.helperCode)
      }
    }
  })

  // 3. 生成主组件 AST
  const mainFn = t.exportDefaultDeclaration(
    t.functionDeclaration(
      t.identifier('GeneratedPage'),
      [],
      t.blockStatement([
        t.returnStatement(
          t.jsxElement(
            t.jsxOpeningElement(t.jsxIdentifier('div'), [
              t.jsxAttribute(t.jsxIdentifier('className'), t.stringLiteral('page-container')),
            ]),
            t.jsxClosingElement(t.jsxIdentifier('div')),
            [
              t.jsxElement(
                t.jsxOpeningElement(t.jsxIdentifier('h1'), []),
                t.jsxClosingElement(t.jsxIdentifier('h1')),
                [t.jsxText(page.title)],
              ),
              createJSXElement(page.root),
            ],
          ),
        ),
      ]),
    ),
  )

  const mainCode = generate(t.file(t.program([mainFn])), {
    jsescOption: { minimal: true },
    retainLines: false,
    compact: false,
  }).code

  // 4. 拼装：import → helper 定义 → 主组件
  const importLines = ['import React from "react";']
  if (antdImports.size > 0) {
    importLines.push(`import { ${Array.from(antdImports).sort().join(', ')} } from "antd";`)
  }

  return [importLines.join('\n'), helperCodes.join('\n\n'), mainCode]
    .filter(Boolean)
    .join('\n\n')
}

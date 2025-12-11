import type { PageSchema, ComponentSchema } from '../types/schema'
import * as t from '@babel/types'
import generate from '@babel/generator'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createJSXAttribute = (key: string, value: any): t.JSXAttribute => {
  let propValue: t.StringLiteral | t.JSXExpressionContainer | null = null

  if (typeof value === 'string') {
    propValue = t.stringLiteral(value)
  } else if (typeof value === 'number') {
    propValue = t.jsxExpressionContainer(
      t.numericLiteral(value)
    )
  } else if (typeof value === 'boolean') {
    propValue = t.jsxExpressionContainer(
      t.booleanLiteral(value)
    )
  } else if (value === null || value === undefined) {
    propValue = null
  } else {
    // 兜底方案：尝试将值序列化后作为JS表达式
    try {
      propValue = t.jsxExpressionContainer(
        t.identifier(JSON.stringify(value))
      )
    } catch {
      console.warn(`无法处理的属性值类型: ${key}`, value)
    }
  }

  return t.jsxAttribute(t.jsxIdentifier(key), propValue)
}

const createJSXElement = (node: ComponentSchema): t.JSXElement => {
  const attributes: t.JSXAttribute[] = []
  
  if (node.props) {
    Object.entries(node.props).forEach(([key, value]) => {
      if (key !== 'children') {
        attributes.push(createJSXAttribute(key, value))
      }
    })
  }

  if (node.style && Object.keys(node.style).length > 0) {
    const styleProperties = Object.entries(node.style).map(([k, v]) =>
      t.objectProperty(t.identifier(k), t.stringLiteral(String(v)))
    )
    attributes.push(
      t.jsxAttribute(
        t.jsxIdentifier('style'),
        t.jsxExpressionContainer(t.objectExpression(styleProperties))
      )
    )
  }

  let childrenNodes: (t.JSXElement | t.JSXText | t.JSXExpressionContainer)[] = []
  if (node.children && node.children.length > 0) {
    // 情况 A: 有子组件
    childrenNodes = node.children.map(child => createJSXElement(child))
  } else if (typeof node.props?.children === 'string') {
    // 情况 B: props.children 是纯文本
    childrenNodes = [t.jsxText(node.props.children)]
  }

  const openingElement = t.jsxOpeningElement(
    t.jsxIdentifier(node.type), 
    attributes,
    childrenNodes.length === 0
  )
  
  const closingElement = childrenNodes.length === 0 
    ? null 
    : t.jsxClosingElement(t.jsxIdentifier(node.type))

  return t.jsxElement(openingElement, closingElement, childrenNodes, childrenNodes.length === 0)
}

export const generatePageCode = (page: PageSchema): string => {
  const ast = t.file(
    t.program([
      t.importDeclaration(
        [t.importDefaultSpecifier(t.identifier('React'))],
        t.stringLiteral('react')
      ),
      t.importDeclaration(
        [
          t.importSpecifier(t.identifier('Button'), t.identifier('Button')),
          t.importSpecifier(t.identifier('Input'), t.identifier('Input')),
          t.importSpecifier(t.identifier('Card'), t.identifier('Card')),
        ],
        t.stringLiteral('antd')
      ),
      // 3. export default function GeneratedPage() { ... }
      t.exportDefaultDeclaration(
        t.functionDeclaration(
          t.identifier('GeneratedPage'),
          [],
          t.blockStatement([
            t.returnStatement(
              t.jsxElement(
                t.jsxOpeningElement(
                  t.jsxIdentifier('div'),
                  [t.jsxAttribute(t.jsxIdentifier('className'), t.stringLiteral('page-container'))]
                ),
                t.jsxClosingElement(t.jsxIdentifier('div')),
                [
                  // 标题 H1
                  t.jsxElement(
                    t.jsxOpeningElement(t.jsxIdentifier('h1'), []),
                    t.jsxClosingElement(t.jsxIdentifier('h1')),
                    [t.jsxText(page.title)]
                  ),
                  // 递归生成的组件树
                  createJSXElement(page.root)
                ]
              )
            )
          ])
        )
      )
    ])
  )

  const output = generate(ast, { 
    jsescOption: { minimal: true },
    retainLines: false,
    compact: false,
  })

  return output.code
}
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

// 递归收集所有使用到的组件类型
const collectImports = (node: ComponentSchema, imports: Set<string>) => {
  imports.add(node.type);
  if (node.children) {
    node.children.forEach(child => collectImports(child, imports));
  }
}

// 生成辅助组件定义 AST
const generateHelperComponents = (usedTypes: Set<string>): t.Statement[] => {
  const helpers: t.Statement[] = []

  // const Container = ({children, style, ...props}) => <div style={style} {...props}>{children}</div>
  if (usedTypes.has('Container')) {
    // 简化版：const Container = (props) => <div {...props} />
    // 为了兼容 style 和 children，直接透传 props 即可，react 会处理 children
    const containerAst = t.variableDeclaration('const', [
      t.variableDeclarator(
        t.identifier('Container'),
        t.arrowFunctionExpression(
            [t.identifier('props')],
            t.jsxElement(
                t.jsxOpeningElement(
                    t.jsxIdentifier('div'), 
                    [t.jsxSpreadAttribute(t.identifier('props'))],
                    false
                ),
                t.jsxClosingElement(t.jsxIdentifier('div')),
                [t.jsxExpressionContainer(t.memberExpression(t.identifier('props'), t.identifier('children')))]
            )
        )
      )
    ])
    helpers.push(containerAst)
  }

  // const Text = ({text, style, ...props}) => <span style={style} {...props}>{text}</span>
  if (usedTypes.has('Text')) {
    const textAst = t.variableDeclaration('const', [
        t.variableDeclarator(
          t.identifier('Text'),
          t.arrowFunctionExpression(
              [
                t.objectPattern([
                  t.objectProperty(t.identifier('text'), t.identifier('text'), false, true),
                  t.restElement(t.identifier('props'))
                ])
              ],
              t.jsxElement(
                  t.jsxOpeningElement(
                      t.jsxIdentifier('span'), 
                      [t.jsxSpreadAttribute(t.identifier('props'))],
                      false
                  ),
                  t.jsxClosingElement(t.jsxIdentifier('span')),
                  [t.jsxExpressionContainer(t.identifier('text'))]
              )
          )
        )
      ])
      helpers.push(textAst)
  }

  // const FormItem = Form.Item;
  if (usedTypes.has('FormItem')) {
    const formItemAst = t.variableDeclaration('const', [
        t.variableDeclarator(
            t.identifier('FormItem'),
            t.memberExpression(t.identifier('Form'), t.identifier('Item'))
        )
    ])
    helpers.push(formItemAst)
  }

  return helpers
}

export const generatePageCode = (page: PageSchema): string => {
  // 1. 依赖收集
  const usedTypes = new Set<string>()
  collectImports(page.root, usedTypes)

  // 2. 过滤 Antd 组件
  const ANTD_COMPONENTS = ['Button', 'Input', 'Table', 'Card', 'Select', 'Form', 'Modal', 'Divider', 'Space', 'Tag']
  const antdImports = Array.from(usedTypes).filter(type => ANTD_COMPONENTS.includes(type))
  
  // 特殊处理：如果用了 FormItem，必须导入 Form
  if (usedTypes.has('FormItem') && !antdImports.includes('Form')) {
    antdImports.push('Form')
  }

  // 3. 构建 AST
  const programBody: t.Statement[] = [
      t.importDeclaration(
        [t.importDefaultSpecifier(t.identifier('React'))],
        t.stringLiteral('react')
      )
  ]

  // 添加 Antd Imports
  if (antdImports.length > 0) {
      programBody.push(
        t.importDeclaration(
            antdImports.map(name => t.importSpecifier(t.identifier(name), t.identifier(name))),
            t.stringLiteral('antd')
        )
      )
  }

  // 添加 Helper Components 定义
  const helperComponents = generateHelperComponents(usedTypes)
  programBody.push(...helperComponents)

  // 添加主组件
  programBody.push(
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
  )

  const ast = t.file(t.program(programBody))

  const output = generate(ast, { 
    jsescOption: { minimal: true },
    retainLines: false,
    compact: false,
  })

  return output.code
}

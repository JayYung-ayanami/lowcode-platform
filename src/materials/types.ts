import type { CSSProperties, FC } from 'react'
import type { ComponentType } from '../types/schema'

/**
 * Setter（属性配置器）类型。属性面板根据 setter 协议动态渲染表单控件，
 * 取代过去在 SettingPanel 中针对每个组件硬编码的 if/else 分支。
 */
export type SetterType =
    | 'string'
    | 'number'
    | 'boolean'
    | 'color'
    | 'textarea'
    | 'select'
    | 'json'

export interface SetterConfig {
    /** 对应 props / style 中的字段名 */
    key: string
    label: string
    setter: SetterType
    /** select 类型可选项 */
    options?: { label: string; value: string | number }[]
    /** 取值来源：组件属性 props（默认）或样式 style */
    group?: 'props' | 'style'
    placeholder?: string
    tooltip?: string
}

/**
 * 出码策略：描述一个组件类型如何被翻译成源代码。
 * - antd：从 'antd' 具名导入，使用真实标签
 * - html：直接生成原生 HTML 标签
 * - helper：在文件头部生成一个 helper 组件定义
 */
export interface CodegenMeta {
    source: 'antd' | 'html' | 'helper'
    /** 实际渲染标签（默认与组件类型同名） */
    tag?: string
    /** 该 prop 的值应作为元素的文本子节点输出（如 Text 的 text、Button 的 children） */
    textProp?: string
    /** helper 类型组件在生成文件中的定义源码（由 codegen 注入文件顶部，自动去重） */
    helperCode?: string
    /** helper 定义所依赖的 antd 具名导入（如 FormItem 依赖 Form） */
    helperAntdDeps?: string[]
}

/**
 * 物料元数据：低代码引擎的"唯一事实源"。
 * 渲染、物料面板、属性面板、拖拽默认值、出码全部由它派生。
 */
export interface MaterialMeta {
    type: ComponentType
    name: string
    category: 'basic' | 'form' | 'layout' | 'advanced'
    /** 是否为容器（可嵌套子组件） */
    isContainer: boolean
    /** 拖入画布时的默认 props */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultProps: Record<string, any>
    /** 拖入画布时的默认 style */
    defaultStyle?: CSSProperties
    /** 属性面板配置器协议 */
    setters: SetterConfig[]
    /** 运行时渲染组件 */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render: FC<any>
    /** 出码策略 */
    codegen: CodegenMeta
}

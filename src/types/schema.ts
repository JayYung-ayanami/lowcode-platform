import type { CSSProperties } from "react"

/**
 * 协议版本号。遵循语义化版本，导入旧 Schema 时可据此做兼容迁移。
 */
export const SCHEMA_VERSION = '1.0.0'

export type ComponentType =
    | 'Page'
    | 'Container'
    | 'Button'
    | 'Text'
    | 'Input'
    | 'Table'
    | 'Card'
    | 'Select'
    | 'Form'
    | 'FormItem'
    | 'Modal'
    | 'Divider'
    | 'Space'
    | 'Tag'
    // 自定义渲染组件（非 Antd 二次封装）
    | 'Image'
    | 'Link'
    | 'Progress'
    | 'Heading'

export type EventActionType =
    | 'openModal'
    | 'link'
    | 'script'
    | 'updateState'
    | 'setValue'
    | 'requestApi'

export interface EventHandler {
    type: EventActionType
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config: Record<string, any>
}

export interface ComponentSchema {
    id: string
    type: ComponentType
    name: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: Record<string, any>
    style?: CSSProperties
    children?: ComponentSchema[]
    /** 事件配置：key为事件名(如onClick)，value为动作数组(支持多动作编排) */
    events?: Record<string, EventHandler[]>
}

/**
 * 远程数据源配置。页面加载或事件触发时拉取接口，结果写入全局变量，供组件通过 {{state.xxx}} 绑定。
 */
export interface DataSourceConfig {
    id: string
    name: string
    /** 写入到全局变量的 key，组件可用 {{state.<key>}} 引用 */
    variableKey: string
    url: string
    method: 'GET' | 'POST'
    /** 是否在页面初始化时自动加载 */
    autoLoad: boolean
    /** 离线 / 接口不可用时的兜底数据 */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mock?: any
    /** 简单的响应取值路径，如 "data.list"，为空则取整个响应体 */
    dataPath?: string
}

export interface PageSchema {
    /** 协议版本，便于跨版本迁移 */
    version?: string
    title: string
    root: ComponentSchema
    /** 页面级远程数据源 */
    dataSources?: DataSourceConfig[]
}

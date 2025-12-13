import type { CSSProperties } from "react"

export type ComponentType = 'Page' | 'Container' | 'Button' | 'Text' | 'Input'

export interface EventHandler {
    type: 'openModal' | 'link' | 'script' | 'updateState' | 'setValue'
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

export interface PageSchema {
    title: string
    root: ComponentSchema
}

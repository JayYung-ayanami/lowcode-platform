import type { CSSProperties } from "react"

// 组件类型的枚举
export type ComponentType = 'Page' | 'Container' | 'Button' | 'Text' | 'Input'

// 组件的基础属性接口
export interface ComponentSchema {
    // 唯一标识符（UUID），用于在拖拽和更新时找到这个组件
    id: string
    // 组件的类型（决定了渲染哪个React组件）
    type: ComponentType
    // 组件的展示名称（在左侧图层面板显示的名字）
    name: string
    // 组件的属性
    // 比如Button的props有type、size、children
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: Record<string, any>
    // 组件的样式
    style?: CSSProperties
    // 子组件列表
    // 容器组件会有children，普通组件（如Input）这个字段可能为空
    children?: ComponentSchema[]
}

export interface PageSchema {
    title: string
    // 根节点，通常是一个类型为'Page'的容器
    root: ComponentSchema
}

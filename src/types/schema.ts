// 引入React的CSSProperties类型，用于提供标准的样式属性提示
import type { CSSProperties } from "react"

/**
 * 组件类型定义
 * 定义了支持的所有组件类型
 */
export type ComponentType = 'Page' | 'Container' | 'Button' | 'Text' | 'Input'

/**
 * 组件的基础属性接口
 * 这是低代码平台最核心的数据结构，描述了组件树中的单个节点
 */
export interface ComponentSchema {
    /** 组件的唯一标识符（UUID），用于在拖拽、选中和更新时精准定位 */
    id: string

    /** 组件的类型，决定了渲染器应该使用哪个React组件来渲染它 */
    type: ComponentType

    /** 组件的展示名称，通常显示在左侧大纲树或图层面板中 */
    name: string
    
    /**
     * 组件的业务属性配置
     * 例如Button的size、type，Input的placeholder等
     * 使用Record<string, any>是为了保持灵活性，适应不同组件的异构属性
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: Record<string, any>
    
    /** 组件的通用样式配置（对应React的style属性） */
    style?: CSSProperties

    /**
     * 子组件列表
     * 通过递归嵌套此结构，形成了完整的组件树（Page -> Container -> Button/Text/Input）
     */
    children?: ComponentSchema[]
}

/**
 * 页面级配置的数据结构
 * 包含了页面的元数据和根节点信息
 */
export interface PageSchema {
    /** 页面标题。可用于浏览器标签页标题或导航栏显示 */
    title: string
    
    /** 页面的根节点，通常是一个类型为'Page'的容器组件，作为整棵树的入口 */
    root: ComponentSchema
}

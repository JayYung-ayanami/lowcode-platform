import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableItemProps {
    id: string
    children: React.ReactNode
}

/**
 * 可排序列表项封装组件
 * 
 * 这是一个“高阶”容器组件，负责赋予其子元素“可拖拽排序”的能力
 * 它使用了dnd-kit的useSortable钩子，自动处理拖拽手柄、位置变换和动画过渡
 */
export const SortableItem: React.FC<SortableItemProps> = ({ id, children }) => {
    // 核心 Hook：传入唯一ID，获取拖拽所需的所有属性
    const { 
        attributes, // 无障碍属性（ARIA）
        listeners, // 事件监听器（onMouseDown, etc.）
        setNodeRef, // 必须绑定到DOM元素上的Ref  
        transition, // CSS过渡属性（用于平滑归位）
        transform, // CSS变换属性（用于跟随鼠标或避让动画）
        isDragging  // 当前项是否正在被拖拽
    } = useSortable({ id })
    
    // 构建动态样式
    const style = {
        transform: CSS.Transform.toString(transform), // 将transform对象转换为CSS字符串
        transition, // 应用过度效果，让位置交换看起来更平滑
        opacity: isDragging ? 0.5 : 1, // 如果正在被拖拽，降低透明度，提供视觉反馈
        touchAction: 'none' // 关键：禁用浏览器默认的触摸滚动行为，防止拖拽时触发页面滚动
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    )
}
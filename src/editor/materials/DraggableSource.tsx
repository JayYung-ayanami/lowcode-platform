import { useDraggable } from '@dnd-kit/core'
import React from 'react'

interface DraggableSourceProps {
    type: string
    children: React.ReactNode
}

/**
 * 可拖拽源组件（用于左侧物料面板）
 * 
 * 这是一个封装组件，它利用dnd-kit中的useDraggable钩子
 * 让任何子元素（通常是图标或按钮）变得“可被抓取”
 */
export const DraggableSource: React.FC<DraggableSourceProps> = ({ type, children }) => {
    // 生成一个临时的唯一ID
    // 每次组件挂载时生成一个新的ID，确保在dnd-kit系统中唯一
    const id = React.useId()
    
    // id：用于dnd-kit内部追踪谁在移动
    // data：当松手（onDragEnd）时，整个应用只能拿到这个data对象
    // 所以我们必须把type：'Button'塞进去，这样App.tsx才知道要添加什么组件
    const {attributes, listeners, setNodeRef, transform} = useDraggable({
        id: `new-${type}-${id}`,
        data: {type}
    })

    // 动态样式：如果正在拖拽，就让元素跟着鼠标飞
    const style = transform ? {
        // transform包含了位移信息
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        cursor: 'move',
        zIndex: 1000
    } : undefined

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            {children}
        </div>
    )
}

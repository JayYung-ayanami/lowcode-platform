import { useDraggable } from '@dnd-kit/core'
import React from 'react'

interface DraggableSourceProps {
    // 拖拽的数据类型（比如'Button'）
    type: string
    children: React.ReactNode
}

export const DraggableSource: React.FC<DraggableSourceProps> = ({ type, children }) => {
    const id = React.useId()
    // attributes: 一些无障碍属性
    // listeners：事件监听器，用于检测鼠标按下和键盘操作
    // setNodeRef：一个函数，用来把DOM元素注册给dnd-kit
    // transform：包含了当前拖拽产生的位移坐标(x,y)。如果没有在拖拽，它是null
    const {attributes, listeners, setNodeRef, transform} = useDraggable({
        id: `new-${type}-${id}`,
        data: {type}
    })

    const style = transform ? {
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

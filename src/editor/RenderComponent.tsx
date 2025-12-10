import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useAppDispatch, useAppSelector } from '../store/hook';
import { setSelectedId } from '../store/projectSlice';
import type { ComponentSchema } from '../types/schema';
import { SortableItem } from './materials/SortableItem';
import { ComponentMap } from './componentMap';

/**
 * 递归渲染组件
 * 这是代码编辑器的核心渲染引擎
 * 它负责将ComponentSchema数据递归地渲染为真实的React组件，并处理拖拽、排序和点击交互
 * 
 * @param schema 当前要渲染的组件数据节点
 * @param isSortable 是否启用排序功能（只有在容器内的组件才需要设为true）
 * @param overId 当前拖拽悬停的目标ID（由dnd-kit提供，用于实时计算高亮样式）
 * @param activeId 当前正在被拖拽的源组件ID（用于设置被拖拽时的半透明效果）
 */
export const RenderComponent: React.FC<{ 
    schema: ComponentSchema; 
    isSortable?: boolean;
    overId?: string | null;
    activeId?: string | null
}> = ({ schema, isSortable, overId, activeId }) => {
  // 使用我们自定义的Hook来获取dispatch方法
  const dispatch = useAppDispatch();
  // 从Redux Store中获取当前选中的组件ID
  // 这里的path是 state.project.present.selectedId，因为我们使用了redux-undo，所以多了一层present
  const selectedId = useAppSelector(state => state.project.present.selectedId);
  
  // 判断当前组件是不是容器类型
  // 只有容器才能接收子组件
  const isContainer = schema.type === 'Container';
  // 判断当前组件是否有子组件
  // 这个标志位决定了我们要渲染成“空容器占位符”还是“实际的子组件列表”
  const hasChildren = schema.children && schema.children.length > 0;
  
  // 1.容器本身的droppable区域
  // 作用：当组件被拖拽到容器的任何位置（且没有命中其他特定区域）时，视为“放入容器中”
  const { setNodeRef } = useDroppable({
    id: `${schema.id}-drop`, 
    disabled: !isContainer, // 只有容器组件才启用
    // 携带的数据：这将再onDragEnd事件中被读取，用来判断“拖到哪了”
    data: { isContainer: true, containerId: schema.id, type: schema.type }
  })
  
  // 2.容器底部的特定放置区
  // 作用：当容器里已经有子组件了，想把新组建插到“最后面”，就拖到容器的最下方
  const { setNodeRef: setEndZoneRef } = useDroppable({
    id: `${schema.id}-end`,
    disabled: !isContainer || !hasChildren, // 只有非空容器才需要底部插入点
    data: { isContainerEnd: true, containerId: schema.id }
  })
  
  // 3.空容器的占位放置区
  // 作用：当容器是空的，为了让用户更容器拖进去，我们会渲染一个很大的虚线框
  // 这个虚线框就是这个droppable区域
  const { setNodeRef: setEmptyDropRef } = useDroppable({
    id: `${schema.id}-empty`,
    disabled: !isContainer || hasChildren, // 只有空容器才启用
    data: { isEmptyContainer: true, containerId: schema.id }
  })
  
  // 查字典：根据组件类型找到对应的React组件
  const Component = ComponentMap[schema.type];
  // 如果找不到对用组件，就显示一个错误提示
  if (!Component) {
    return <div>未知组件类型：{schema.type}</div>;
  }

  // 递归生成子元素
  const childrenContent = schema.children?.map((child) => (
    <RenderComponent key={child.id} schema={child} isSortable={true} overId={overId} activeId={activeId} />
  ))

  // 构建排序环境
  // 如果有子元素，就需要把它们包裹在SortableContext里，以便支持拖拽排序
  const children = (schema.children && schema.children.length > 0) ? (
    <>
      <SortableContext items={schema.children.map(c => c.id)} strategy={verticalListSortingStrategy}>
        {childrenContent}
      </SortableContext>
      {/* 容器底部插入区域 
          当用户把组件拖到容器的最下方时，这个区域会高亮，松手后追加到列表末尾
      */}
      <div 
        // 绑定Ref，使其成为一个可被感应的放置区
        ref={setEndZoneRef}
        style={{
          minHeight: '20px',
          marginTop: '4px',
          borderRadius: '2px',
          border: overId === `${schema.id}-end` ? '2px dashed #1890ff' : '2px dashed transparent',
          backgroundColor: overId === `${schema.id}-end` ? '#e6f7ff' : 'transparent',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: '#999'
        }}
      >
        {/* 如果用户正悬停在底部插入区，显示提示文字 */}
        {overId === `${schema.id}-end` && '松手追加到此处'}
      </div>
    </>
  ) : null

  // 点击处理：设置选中 ID
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡；如果不加，点按钮会同时触发按钮和容器的点击事件，导致选中状态乱跳
    dispatch(setSelectedId(schema.id));
  };

  // 判断当前组件是否是拖拽目标
  // 可能是直接拖到组件上，也可能是拖到了它的drop区域上
  const isOverTarget = overId === schema.id || overId === `${schema.id}-drop`;

  // 判断当前组件是否正是被拖拽的那个
  const isDragging = activeId === schema.id;

  // 选中高亮样式
  const isSelected = selectedId === schema.id;
  const outlineStyle = isSelected 
    ? { outline: '2px solid #1890ff', position: 'relative' as const, zIndex: 1, cursor: 'pointer' } 
    : { cursor: 'pointer' };

  // 拖拽目标高亮样式
  // 只有当别人拖到我头上，且我不是正在被拖的那个人时，才显示高亮
  const dragOverStyle = isOverTarget && !isDragging ? {
    boxShadow: schema.type === 'Container' 
      ? 'inset 0 0 0 2px #52c41a' // 容器用内阴影，表示"放入内部"
      : '0 -2px 0 0 #1890ff', // 普通组件用上边框，表示"插入到上方"
    position: 'relative' as const
  } : {};

  // 最终渲染的组件内容
  const content = (
    <div
      onClick={handleClick}
      style={{
        ...outlineStyle, 
        ...dragOverStyle,
        opacity: isDragging ? 0.5 : 1, // 如果正在被拖拽，变半透明
        transition: 'all 0.2s',
      }}
    >
      {/* 分支渲染逻辑：空容器、非空容器、普通组件 */}

      {/* 1.空容器 */}
      {isContainer && !hasChildren ? (
        <Component style={schema.style} {...schema.props}>
          {/* 渲染一个大的虚线框占位符 */}
          <div 
            ref={setEmptyDropRef}
            style={{ 
              // 占位符样式
              minHeight: '80px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: overId === `${schema.id}-empty` ? '#1890ff' : '#ccc',
              fontSize: '14px',
              backgroundColor: overId === `${schema.id}-empty` ? '#e6f7ff' : 'transparent',
              border: overId === `${schema.id}-empty` ? '2px dashed #1890ff' : 'none',
              borderRadius: '4px',
              transition: 'all 0.2s',
              pointerEvents: 'auto' // 确保可以接收拖拽事件
            }}
          >
            {overId === `${schema.id}-empty` ? '松手放入此容器' : '拖拽组件到此处'}
          </div>
        </Component>
      ) : hasChildren && isContainer ? (
        // 2.非空容器
        <div
          ref={setNodeRef}
          style={{
            width: '100%',
            position: 'relative'
          }}
        >
          <Component style={schema.style} {...schema.props}>
            {children}
          </Component>
        </div>
      ) : (
        // 3.普通组件
        <Component style={schema.style} {...schema.props}>
          {children}
        </Component>
      )}
    </div>
  )

  // 如果启用了排序功能，用SortableItem包裹
  // SortableItem负责处理拖拽手柄、变换动画等
  if (isSortable) {
    return <SortableItem id={schema.id}>{content}</SortableItem>
  }

  return content
};

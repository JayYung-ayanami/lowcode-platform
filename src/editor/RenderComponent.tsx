import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useAppDispatch, useAppSelector } from '../store/hook';
import { setSelectedId } from '../store/projectSlice';
import type { ComponentSchema } from '../types/schema';
import { SortableItem } from './materials/SortableItem';
import { ComponentMap } from './componentMap';

export const RenderComponent: React.FC<{ 
    schema: ComponentSchema; 
    isSortable?: boolean; 
    overId?: string | null; 
    activeId?: string | null 
}> = ({ schema, isSortable, overId, activeId }) => {
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector(state => state.project.present.selectedId);
  
  const isContainer = schema.type === 'Container';
  const hasChildren = schema.children && schema.children.length > 0;
  
  const { setNodeRef } = useDroppable({
    id: `${schema.id}-drop`,
    disabled: !isContainer,
    data: { isContainer: true, containerId: schema.id, type: schema.type }
  })
  
  // 容器底部插入点（用于追加到末尾）
  const { setNodeRef: setEndZoneRef } = useDroppable({
    id: `${schema.id}-end`,
    disabled: !isContainer || !hasChildren, // 只有非空容器才需要底部插入点
    data: { isContainerEnd: true, containerId: schema.id }
  })
  
  // 空容器的独立 droppable（不被 sortable 干扰）
  const { setNodeRef: setEmptyDropRef } = useDroppable({
    id: `${schema.id}-empty`,
    disabled: !isContainer || hasChildren, // 只有空容器才启用
    data: { isEmptyContainer: true, containerId: schema.id }
  })
  
  // 查字典：找组件
  const Component = ComponentMap[schema.type];
  if (!Component) {
    return <div>未知组件类型：{schema.type}</div>;
  }

  const childrenContent = schema.children?.map((child) => (
    <RenderComponent key={child.id} schema={child} isSortable={true} overId={overId} activeId={activeId} />
  ))

  const children = (schema.children && schema.children.length > 0) ? (
    <>
      <SortableContext items={schema.children.map(c => c.id)} strategy={verticalListSortingStrategy}>
        {childrenContent}
      </SortableContext>
      {/* 容器底部插入区域 */}
      <div 
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
        {overId === `${schema.id}-end` && '松手追加到此处'}
      </div>
    </>
  ) : null

  // 点击处理：设置选中 ID
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 关键：阻止冒泡，防止点按钮同时也点中容器
    dispatch(setSelectedId(schema.id));
  };

  // 判断当前是否是拖拽目标
  const isOverTarget = overId === schema.id || overId === `${schema.id}-drop`;
  const isDragging = activeId === schema.id;

  // 选中高亮样式
  const isSelected = selectedId === schema.id;
  const outlineStyle = isSelected 
    ? { outline: '2px solid #1890ff', position: 'relative' as const, zIndex: 1, cursor: 'pointer' } 
    : { cursor: 'pointer' };

  // 拖拽目标高亮样式
  const dragOverStyle = isOverTarget && !isDragging ? {
    boxShadow: schema.type === 'Container' 
      ? 'inset 0 0 0 2px #52c41a' // 容器用内阴影，表示"放入内部"
      : '0 -2px 0 0 #1890ff', // 普通组件用上边框，表示"插入到上方"
    position: 'relative' as const
  } : {};

  const content = (
    <div
      onClick={handleClick}
      style={{
        ...outlineStyle, 
        ...dragOverStyle,
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.2s',
      }}
    >
      {/* 空容器单独处理：添加独立的 droppable 区域 */}
      {isContainer && !hasChildren ? (
        <Component style={schema.style} {...schema.props}>
          <div 
            ref={setEmptyDropRef}
            style={{ 
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
        <Component style={schema.style} {...schema.props}>
          {children}
        </Component>
      )}
    </div>
  )

  if (isSortable) {
    return <SortableItem id={schema.id}>{content}</SortableItem>
  }

  return content
};

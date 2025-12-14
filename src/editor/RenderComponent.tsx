import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useAppDispatch, useAppSelector } from '../store/hook';
import { setSelectedId, setVariable, updateComponentProps } from '../store/projectSlice';
import type { ComponentSchema } from '../types/schema';
import { executeScript } from '../utils/sandbox';
import { SortableItem } from './materials/SortableItem';
import { ComponentMap } from './componentMap';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseExpression = (str: any, variables: Record<string, any>) => {
  if (typeof str === 'string' && str.startsWith('{{') && str.endsWith('}}')) {
    const key = str.slice(2, -2).trim()
    if (key.startsWith('state.')) {
      const varName = key.split('.')[1]
      return variables[varName]
    }
  }
  return str
}

// InnerRenderComponent 的 Props 定义增加 involvedIds
const InnerRenderComponent: React.FC<{ 
    schema: ComponentSchema; 
    isSortable?: boolean;
    overId?: string | null;
    activeId?: string | null;
    involvedIds?: Set<string>;
}> = ({ schema, isSortable, overId, activeId, involvedIds }) => {
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector(state => state.project.present.selectedId);
  const variables = useAppSelector(state => state.project.present.variables);
  const isContainer = ['Container', 'Card', 'Form', 'FormItem', 'Space', 'Modal'].includes(schema.type);
  const hasChildren = schema.children && schema.children.length > 0;
  
  // Dnd-kit 拖拽相关逻辑
  const { setNodeRef } = useDroppable({
    id: `${schema.id}-drop`, 
    disabled: !isContainer,
    data: { isContainer: true, containerId: schema.id, type: schema.type }
  })
  const { setNodeRef: setEndZoneRef } = useDroppable({
    id: `${schema.id}-end`,
    disabled: !isContainer || !hasChildren,
    data: { isContainerEnd: true, containerId: schema.id }
  })
  const { setNodeRef: setEmptyDropRef } = useDroppable({
    id: `${schema.id}-empty`,
    disabled: !isContainer || hasChildren,
    data: { isEmptyContainer: true, containerId: schema.id }
  })
  
  const Component = ComponentMap[schema.type];

  const resolvedProps = React.useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newProps: Record<string, any> = {}
    for (const key in schema.props) {
      const value = schema.props[key]
      newProps[key] = parseExpression(value, variables)
    }
    return newProps
  }, [schema.props, variables])

  const eventHandlers = React.useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlers: Record<string, (e: any) => void> = {}

    if (schema.events) {
      for (const eventName in schema.events) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handlers[eventName] = (e: any) => {
          schema.events?.[eventName].forEach(action => {
            switch (action.type) {
              case 'openModal':
                alert(`模拟弹窗：${action.config.title}`)
                break
              case 'link':
                window.open(action.config.url, action.config.target || '_blank')
                break
              case 'updateState': {
                let val = action.config.value
                if (val === undefined && e && e.target) {
                  val = e.target.value
                }
                if (action.config.key) {
                  dispatch(setVariable({ key: action.config.key, value: val }))
                }
                break
              }
              case 'setValue': {
                // 实现简单的组件联动：修改目标组件的 value 属性
                if (action.config.targetId) {
                  dispatch(updateComponentProps({
                    id: action.config.targetId,
                    props: { value: action.config.value }
                  }))
                }
                break
              }
              case 'script':
                executeScript(action.config.code, { 
                  e, 
                  dispatch, 
                  setVariable, 
                  variables 
                })
                break
              default:
                console.warn('未知的动作类型：', action.type)
            }
          })
        }
      }
    }
    return handlers
  }, [schema.events, dispatch, variables])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalProps: any = {
    ...resolvedProps,
    ...eventHandlers,
    style: schema.style
  }

  if (!Component) {
    return <div>未知组件类型：{schema.type}</div>;
  }

  const childrenContent = schema.children?.map((child) => (
    <RenderComponent 
      key={child.id} 
      schema={child} 
      isSortable={true} 
      overId={overId} 
      activeId={activeId} 
      involvedIds={involvedIds} 
    />
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
        {overId === `${schema.id}-end` && '松手追加到此处'}
      </div>
    </>
  ) : null

  // 点击处理：设置选中 ID
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡；如果不加，点按钮会同时触发按钮和容器的点击事件，导致选中状态乱跳
    dispatch(setSelectedId(schema.id));

    if (finalProps.onClick) {
      finalProps.onClick(e)
    }
  };

  // 判断当前组件是否是拖拽目标
  // 可能是直接拖到组件上，也可能是拖到了它的drop区域上
  const isOverTarget = overId === schema.id || overId === `${schema.id}-drop`;

  // 判断当前组件是否正是被拖拽的那个
  const isDragging = activeId === schema.id;

  const isSelected = selectedId === schema.id;
  const outlineStyle = isSelected 
    ? { outline: '2px solid #1890ff', position: 'relative' as const, zIndex: 1, cursor: 'pointer' } 
    : { cursor: 'pointer' };

  // 拖拽目标高亮样式
  // 只有当别人拖到我头上，且我不是正在被拖的那个人时，才显示高亮
  const dragOverStyle: React.CSSProperties = !isDragging ? (
    // 情况A: 鼠标悬停在容器的内部感应区 -> 显示"放入内部"样式 (全框+背景)
    (overId === `${schema.id}-drop`) 
      ? {
          boxShadow: 'inset 0 0 0 2px #1890ff, 0 0 10px rgba(24, 144, 255, 0.3)', 
          backgroundColor: 'rgba(24, 144, 255, 0.05)',
          borderRadius: '4px',
          position: 'relative',
          zIndex: 10
        }
      // 情况B: 鼠标悬停在组件本身(包括容器的边缘) -> 显示"插入前方"样式 (上边框线)
      : (isOverTarget)
        ? {
            boxShadow: '0 -4px 0 0 #1890ff', 
            position: 'relative',
            zIndex: 10
          }
        : {}
  ) : {};

  // 最终渲染的组件内容
  const content = (
    <div
      onClick={handleClick}
      style={{
        ...outlineStyle, 
        ...dragOverStyle,
        opacity: isDragging ? 0.5 : 1, // 如果正在被拖拽，变半透明
        transition: 'all 0.2s',
        // 使用透明边框代替 margin，扩大感应热区
        borderBottom: '8px solid transparent',
        borderTop: '8px solid transparent', // 【新增】顶部也加透明边框，用于触发"插入前方"
        // 必须设置 position，否则 z-index 不生效
        position: 'relative',
        boxSizing: 'border-box'
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
          {children || finalProps.children}
        </Component>
      )}
    </div>
  )

  if (isSortable) {
    return <SortableItem id={schema.id}>{content}</SortableItem>
  }

  return content
};

export const RenderComponent = React.memo(InnerRenderComponent, (prevProps, nextProps) => {
  // 1. 如果 Schema 本身变了（比如属性修改），必须重渲染
  if (prevProps.schema !== nextProps.schema) return false

  // 2. 如果拖拽状态（activeId/overId）变了，简单起见，我们允许重渲染
  // 之前的深度比较逻辑虽然性能好，但容易导致高亮状态更新滞后或遗漏
  // 尤其是在拖拽快速移动时，或者涉及 transform 位移时
  if (prevProps.overId !== nextProps.overId) return false
  if (prevProps.activeId !== nextProps.activeId) return false
  if (prevProps.involvedIds !== nextProps.involvedIds) return false

  return true
})

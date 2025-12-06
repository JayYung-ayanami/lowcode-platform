import { Button, Input } from 'antd';
import React from 'react';
import { useAppSelector, useAppDispatch } from './store/hook';
import type { ComponentSchema, ComponentType } from './types/schema';
import { setSelectedId, updateComponentProps, addComponent, deleteComponent, reorderComponents, moveComponentToNewParent } from './store/projectSlice';
import { DraggableSource } from './editor/materials/DraggableSource';
import { DndContext, useDroppable, type DragEndEvent, useSensor, useSensors, PointerSensor, DragOverlay, type DragStartEvent, type DragOverEvent, pointerWithin } from '@dnd-kit/core';
import { v4 as uuid } from 'uuid';
import { Modal } from 'antd';
import { useState } from 'react';
import { generatePageCode } from './utils/codegen';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './editor/materials/SortableItem';
import { ActionCreators } from 'redux-undo';
import './App.css'


// 组件映射表
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ComponentMap: Record<string, React.FC<any>> = {
  Page: ({ children, style }) => <div style={style}>{children}</div>,
  Container: ({ children, style }) => <div style={style}>{children}</div>,
  Button: ({ children, style, ...props }) => <Button style={style} {...props}>{children}</Button>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Input: ({ style, children, ...props }) => <Input style={style} {...props} />,
  Text: ({ text, fontSize, color }) => <span style={{ fontSize, color }}>{text}</span>
};


// 递归渲染器
const RenderComponent: React.FC<{ schema: ComponentSchema; isSortable?: boolean; overId?: string | null; activeId?: string | null }> = ({ schema, isSortable, overId, activeId }) => {
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

// 画布区域组件
const CanvasArea: React.FC<{ children: React.ReactNode; items: string[] }> = ({ children, items }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: 'canvas-root',
    data: { isCanvas: true }
  })

  const style = {
    minHeight: '100%',
    border: isOver ? '2px dashed #1890ff' : '1px solid transparent',
    transition: 'all 0.2s',
    padding: '20px'
  }

  return (
    <div ref={setNodeRef} style={style} className='canvas-paper'>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </div>
  )
} 

// 主应用
function App() {
  const dispatch = useAppDispatch();
  // 从 Redux 读取数据
  const page = useAppSelector((state) => state.project.present.page);
  const selectedId = useAppSelector((state) => state.project.present.selectedId);
  const [isModalOpen, setIsModalOpen] = useState(false) // 是否打开代码生成弹窗
  const [code, setCode] = useState('') // 暂存生成的源代码
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null); // 跟踪当前悬停的目标

  // 辅助函数：根据 ID 在树中查找组件对象 (为了在右侧回显属性)
  const findNode = (node: ComponentSchema, id: string): ComponentSchema | null => {
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNode(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  // 查找节点所在的父节点ID和在父节点children中的索引
  const findParentAndIndex = (node: ComponentSchema, targetId: string): { parentId: string; index: number } | null => {
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        if (node.children[i].id === targetId) {
          return { parentId: node.id, index: i }
        }
        const result = findParentAndIndex(node.children[i], targetId)
        if (result) return result
      }
    }
    return null
  }

  const selectedComponent = selectedId ? findNode(page.root, selectedId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setOverId(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over ? over.id as string : null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null);
    setOverId(null);
    
    if (!over) return

    console.log('DragEnd - over.id:', over.id, 'over.data:', over.data.current);

    // 场景1：从左侧物料区拖入新组件
    if (active.data.current?.type) {
        const type = active.data.current.type as ComponentType
        const newComponent: ComponentSchema = {
            id: uuid(),
            type,
            name: type,
            props: {},
            children: []
        }
        
        if (type === 'Button') {
             newComponent.props = { children: '新按钮' }
        } else if (type === 'Text') {
             newComponent.props = { text: '默认文本', fontSize: '14px', color: '#000' }
        } else if (type === 'Input') {
             newComponent.props = { placeholder: '请输入...' }
        } else if (type === 'Container') {
             newComponent.props = {}
             newComponent.style = { 
                border: '1px solid #d9d9d9', 
                padding: '20px', 
                minHeight: '100px',
                borderRadius: '4px',
                backgroundColor: '#fff'
             }
        }

        // 确定插入位置
        let parentId = 'root'
        let insertIndex: number | undefined

        // 如果拖到了空容器（独立 droppable）
        if (over.data.current?.isEmptyContainer && over.data.current?.containerId) {
            parentId = over.data.current.containerId as string
            insertIndex = 0
        }
        // 如果拖到了容器末尾插入点
        else if (over.data.current?.isContainerEnd && over.data.current?.containerId) {
            const containerId = over.data.current.containerId as string
            const container = findNode(page.root, containerId)
            parentId = containerId
            insertIndex = container?.children?.length || 0
        }
        // 如果拖到了容器上（通过 ${containerId}-drop 识别）
        else if (over.data.current?.isContainer && over.data.current?.containerId) {
            const containerId = over.data.current.containerId as string
            const container = findNode(page.root, containerId)
            parentId = containerId
            // 追加到容器末尾
            insertIndex = container?.children?.length || 0
        } 
        // 如果拖到了画布根区域
        else if (over.data.current?.isCanvas) {
            parentId = 'root'
            insertIndex = page.root.children?.length || 0
        } 
        // 如果拖到了某个具体组件上（插在它前面）
        else {
            const info = findParentAndIndex(page.root, over.id as string)
            if (info) {
                parentId = info.parentId
                insertIndex = info.index
            }
        }

        dispatch(addComponent({
            component: newComponent,
            parentId,
            insertAtIndex: insertIndex
        }))
        return
    } 

    // 场景2：画布内组件排序
    if (active.id === over.id) return

    const activeInfo = findParentAndIndex(page.root, active.id as string)
    const overInfo = findParentAndIndex(page.root, over.id as string)

    if (!activeInfo) return

    // 情况A：拖到空容器（独立 droppable）
    if (over.data.current?.isEmptyContainer && over.data.current?.containerId) {
        dispatch(moveComponentToNewParent({
            componentId: active.id as string,
            newParentId: over.data.current.containerId as string,
            newIndex: 0
        }))
        return
    }

    // 情况B：拖到容器末尾插入点
    if (over.data.current?.isContainerEnd && over.data.current?.containerId) {
        const container = findNode(page.root, over.data.current.containerId as string)
        if (container) {
            const insertIndex = container.children?.length || 0
            dispatch(moveComponentToNewParent({
                componentId: active.id as string,
                newParentId: over.data.current.containerId as string,
                newIndex: insertIndex
            }))
            return
        }
    }
    
    // 情况C：拖到容器上
    if (over.data.current?.isContainer && over.data.current?.containerId) {
        const container = findNode(page.root, over.data.current.containerId as string)
        if (container) {
            // 追加到容器末尾
            const insertIndex = container.children?.length || 0
            dispatch(moveComponentToNewParent({
                componentId: active.id as string,
                newParentId: over.data.current.containerId as string,
                newIndex: insertIndex
            }))
            return
        }
    }

    // 情况D：同一个父节点内排序
    if (overInfo && activeInfo.parentId === overInfo.parentId) {
        dispatch(reorderComponents({
            parentId: activeInfo.parentId,
            oldIndex: activeInfo.index,
            newIndex: overInfo.index
        }))
        return
    }

    // 情况E：跨父节点移动（拖到其他组件上，插入到该组件前面）
    if (overInfo) {
        dispatch(moveComponentToNewParent({
            componentId: active.id as string,
            newParentId: overInfo.parentId,
            newIndex: overInfo.index
        }))
    }
  }

  const handleSave = () => {
    const sourceCode = generatePageCode(page)
    setCode(sourceCode)
    setIsModalOpen(true)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  return (
    <div className="app">
      {/* 顶部导航 */}
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
        <div>LowCode Engine</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button onClick={() => dispatch(ActionCreators.undo())}>
            撤销
          </Button>
          <Button onClick={() => dispatch(ActionCreators.redo())}>
            重做
          </Button>
          <Button type="primary" onClick={handleSave}>生成代码</Button>
        </div>
      </div>

      {/* 主体三栏布局 */}
      <DndContext onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} sensors={sensors} collisionDetection={pointerWithin}>
      <div className="editor-container">
        
        {/* 左侧：物料面板 */}
        <div className="material-panel">
          <h3>组件库</h3>
          <p>这里将展示可拖拽组件</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <DraggableSource type="Button">
              <Button block>按钮</Button>
            </DraggableSource>
            <DraggableSource type="Text">
              <Button block>文本</Button>
            </DraggableSource>
            <DraggableSource type="Input">
              <Button block>输入框</Button>
            </DraggableSource>
            <DraggableSource type="Container">
              <Button block style={{ border: '1px dashed #666' }}>容器(Container)</Button>
            </DraggableSource>
          </div>
        </div>

        {/* 中间：画布 */}
        <div className="canvas-area">
          <CanvasArea items={page.root.children?.map(c => c.id) || []}>
            {page.root.children?.map(child => (
              <RenderComponent key={child.id} schema={child} isSortable={true} overId={overId} activeId={activeId} />
            ))}
          </CanvasArea>
        </div>

        {/* 右侧：属性面板 */}
        <div className="setting-panel">
          <h3>属性配置</h3>
          {selectedComponent ? (
            <div>
              <div style={{ marginBottom: 10 }}>
                <strong>ID:</strong> {selectedComponent.id}
              </div>
              <div style={{ marginBottom: 10 }}>
                <strong>Type:</strong> {selectedComponent.type}
              </div>
              
              {/* 根据组件类型展示不同的配置表单 */}
              {selectedComponent.type === 'Button' && (
                <div style={{ marginBottom: 10 }}>
                  <label>按钮文字:</label>
                  <Input
                    value={selectedComponent.props.children}
                    onChange={(e) => {
                      dispatch(updateComponentProps({
                        id: selectedComponent.id,
                        props: {
                          children: e.target.value
                        }
                      }))
                    }}
                  />
                </div>
              )}

              {selectedComponent.type === 'Text' && (
                <>
                  <div style={{ marginBottom: 10 }}>
                    <label>文本内容：</label>
                    <Input 
                      value={selectedComponent.props.text}
                      onChange={(e) => {
                        dispatch(updateComponentProps({
                          id: selectedComponent.id,
                          props: {
                            text: e.target.value
                          }
                        }))
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                      <label>颜色：</label>
                      <Input 
                        type="color"
                        value={selectedComponent.props.color} 
                        onChange={(e) => {
                          dispatch(updateComponentProps({
                            id: selectedComponent.id,
                            props: { color: e.target.value }
                          }))
                        }}
                      />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                      <label>字体大小：</label>
                      <Input 
                        value={selectedComponent.props.fontSize} 
                        onChange={(e) => {
                          dispatch(updateComponentProps({
                            id: selectedComponent.id,
                            props: { fontSize: e.target.value }
                          }))
                        }}
                      />
                  </div>
                </>
              )}

              {selectedComponent.type === 'Input' && (
                <div style={{ marginBottom: 10 }}>
                  <label>占位符：</label>
                  <Input 
                    value={selectedComponent.props.placeholder}
                    onChange={(e) => {
                      dispatch(updateComponentProps({
                        id: selectedComponent.id,
                        props: {
                          placeholder: e.target.value
                        }
                      }))
                    }}
                  />
                </div>
              )}

              <div style={{ marginTop: 20, borderTop: '1px solid #eee', paddingTop: 10 }}>
                <strong>调试信息 (Props)</strong>
                <pre style={{ fontSize: 12, color: '#999' }}>
                  {JSON.stringify(selectedComponent.props, null, 2)}
                </pre>
              </div>

              <div style={{ marginTop: 20 }}>
                <Button
                  danger
                  block
                  onClick={() => {
                    dispatch(deleteComponent(selectedComponent.id))
                  }}
                >
                  删除组件
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ color: '#999', marginTop: 50, textAlign: 'center' }}>
              请在画布中点击选择一个组件
            </div>
          )}
        </div>

      </div>
      <DragOverlay>
        {activeId && !activeId.startsWith('new-') ? (
            <div style={{ padding: '8px 16px', border: '2px solid #1890ff', background: '#fff', borderRadius: '4px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>
                拖拽中...
            </div>
        ) : null}
      </DragOverlay>
      </DndContext>
      <Modal
        title="生成的源代码"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={800}
      >
        <pre style={{ maxHeight: '600px', overflow: 'auto', background: '#f5f5f5', padding: '20px', borderRadius: '4px' }}>
          {code}
        </pre>
      </Modal>
    </div>
  );
}

export default App;
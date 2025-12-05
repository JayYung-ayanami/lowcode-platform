import { Button, Input } from 'antd';
import React from 'react';
import { useAppSelector, useAppDispatch } from './store/hook';
import type { ComponentSchema, ComponentType } from './types/schema';
import { setSelectedId, updateComponentProps, addComponent, deleteComponent } from './store/projectSlice';
import { DraggableSource } from './editor/materials/DraggableSource';
import { DndContext, useDroppable, type DragEndEvent } from '@dnd-kit/core';
import { v4 as uuid } from 'uuid'
import { Modal } from 'antd'
import { useState } from 'react'
import { generatePageCode } from './utils/codegen'
import './App.css';


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


// 归渲染器
const RenderComponent: React.FC<{ schema: ComponentSchema }> = ({ schema }) => {
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector(state => state.project.selectedId);

  // 查字典：找组件
  const Component = ComponentMap[schema.type];
  if (!Component) {
    return <div>未知组件类型：{schema.type}</div>;
  }

  // 递归渲染子节点
  const children = schema.children?.map((child) => (
    <RenderComponent key={child.id} schema={child} />
  ));

  // 点击处理：设置选中 ID
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 关键：阻止冒泡，防止点按钮同时也点中容器
    dispatch(setSelectedId(schema.id));
  };

  // 选中高亮样式
  const isSelected = selectedId === schema.id;
  const outlineStyle = isSelected 
    ? { outline: '2px solid #1890ff', position: 'relative' as const, zIndex: 1, cursor: 'pointer' } 
    : { cursor: 'pointer' };

  return (
    <div onClick={handleClick} style={outlineStyle}>
      <Component style={schema.style} {...schema.props}>
        {children}
      </Component>
    </div>
  );
};

// 画布区域组件
const CanvasArea: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: 'canvas-root'
  })

  const style = {
    minHeight: '100%',
    border: isOver ? '2px dashed #1890ff' : '1px solid transparent',
    transition: 'all 0.2s'
  }

  return (
    <div ref={setNodeRef} style={style} className='canvas-paper'>
      {children}
    </div>
  )
} 

// 主应用
function App() {
  const dispatch = useAppDispatch();
  // 从 Redux 读取数据
  const page = useAppSelector((state) => state.project.page);
  const selectedId = useAppSelector((state) => state.project.selectedId);
  const [isModalOpen, setIsModalOpen] = useState(false) // 是否打开代码生成弹窗
  const [code, setCode] = useState('') // 暂存生成的源代码

  // 辅助函数：根据 ID 在树中查找组件对象 (为了在右侧回显属性)
  // 实际项目中建议把这个逻辑移到 Redux Selector 中
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

  const selectedComponent = selectedId ? findNode(page.root, selectedId) : null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    // 如果此时鼠标停留在ID为'canvas-root'的区域（即CanvasArea）
    if (over && over.id === 'canvas-root') {
      // 获取拖拽元素携带的数据（在DraggableSource里存的data:{ type }）
      const type = active.data.current?.type as ComponentType

      if (type) {
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
        }

        dispatch(addComponent(newComponent))
      }
    }
  }

  const handleSave = () => {
    const sourceCode = generatePageCode(page)
    setCode(sourceCode)
    setIsModalOpen(true)
  }
  
  return (
    <div className="app">
      {/* 顶部导航 */}
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
        <div>LowCode Engine</div>
        <Button type="primary" onClick={handleSave}>生成代码</Button>
      </div>

      {/* 主体三栏布局 */}
      <DndContext onDragEnd={handleDragEnd}>
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
          </div>
        </div>

        {/* 中间：画布 */}
        <div className="canvas-area">
          <CanvasArea>
            <RenderComponent schema={page.root} />
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
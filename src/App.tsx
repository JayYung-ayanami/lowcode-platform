import { Button, Modal } from 'antd';
import { useState } from 'react';
import { useAppSelector, useAppDispatch } from './store/hook';
import type { ComponentSchema, ComponentType } from './types/schema';
import { addComponent, reorderComponents, moveComponentToNewParent } from './store/projectSlice';
import { DndContext, type DragEndEvent, useSensor, useSensors, PointerSensor, DragOverlay, type DragStartEvent, type DragOverEvent, pointerWithin } from '@dnd-kit/core';
import { v4 as uuid } from 'uuid';
import { generatePageCode } from './utils/codegen';
import { ActionCreators } from 'redux-undo';
import './App.css'

// Panels
import { MaterialPanel } from './editor/panels/MaterialPanel';
import { CanvasPanel } from './editor/panels/CanvasPanel';
import { SettingPanel } from './editor/panels/SettingPanel';

// Utils
import { findNode, findParentAndIndex } from './utils/treeUtils';

// 主应用
function App() {
  const dispatch = useAppDispatch();
  const page = useAppSelector((state) => state.project.present.page);
  const [isModalOpen, setIsModalOpen] = useState(false) 
  const [code, setCode] = useState('') 
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null); 

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
  };

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
        <MaterialPanel />

        {/* 中间：画布 */}
        <CanvasPanel overId={overId} activeId={activeId} />

        {/* 右侧：属性面板 */}
        <SettingPanel />

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

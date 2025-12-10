import { Button, Modal, Popconfirm } from 'antd';
import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { ActionCreators } from 'redux-undo';
import './App.css'
// Dnd Kit Imports
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
  pointerWithin,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent
} from '@dnd-kit/core'
// Store & Types
import { useAppSelector, useAppDispatch } from './store/hook';
import type { ComponentSchema, ComponentType } from './types/schema';
import { addComponent, reorderComponents, moveComponentToNewParent, resetProject } from './store/projectSlice';
// Panels
import { MaterialPanel } from './editor/panels/MaterialPanel';
import { CanvasPanel } from './editor/panels/CanvasPanel';
import { SettingPanel } from './editor/panels/SettingPanel';
// Utils
import { findNode, findParentAndIndex } from './utils/treeUtils';
import { generatePageCode } from './utils/codegen';

// 主应用
function App() {
  // Redux: 获取 dispatch 用于触发 action
  const dispatch = useAppDispatch();
  // Redux: 获取当前页面数据（present 表示当前状态，支持撤销重做）
  const page = useAppSelector((state) => state.project.present.page);

  // State: 控制"查看代码"弹窗的开关
  const [isModalOpen, setIsModalOpen] = useState(false) 
  // State: 存储生成的源代码
  const [code, setCode] = useState('') 

  // Dnd: 当前正在拖拽的组件 ID (active)
  const [activeId, setActiveId] = useState<string | null>(null);
  // Dnd: 当前拖拽经过的组件 ID (over)
  const [overId, setOverId] = useState<string | null>(null); 

  // 拖拽开始：记录当前被拖拽的组件 ID
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setOverId(null);
  };

  // 拖拽移动中：实时记录鼠标下方的组件 ID（用于高亮提示）
  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over ? over.id as string : null);
  };

  // 拖拽结束：处理组件的创建、移动和排序的核心逻辑
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null);
    setOverId(null);
    
    // 如果松手时没有在任何有效区域上，直接返回
    if (!over) return

    // 场景1：从左侧物料区拖入新组件 (Add New Component)
    if (active.data.current?.type) {
        const type = active.data.current.type as ComponentType
        
        // 1.1 初始化新组件数据结构
        const newComponent: ComponentSchema = {
            id: uuid(),
            type,
            name: type,
            props: {},
            children: []
        }
        
        // 根据不同类型设置默认 Props 和 Style
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

        // 1.2 确定插入位置
        let parentId = 'root'
        let insertIndex: number | undefined

        // Case A: 拖到了空容器内部 (专门的 Droppable 区域)
        if (over.data.current?.isEmptyContainer && over.data.current?.containerId) {
            parentId = over.data.current.containerId as string
            insertIndex = 0
        }
        // Case B: 拖到了容器的"末尾热区" (Insert after last child)
        else if (over.data.current?.isContainerEnd && over.data.current?.containerId) {
            const containerId = over.data.current.containerId as string
            const container = findNode(page.root, containerId)
            parentId = containerId
            insertIndex = container?.children?.length || 0
        }
        // Case C: 直接拖到了容器本身 (作为最后一个子元素)
        else if (over.data.current?.isContainer && over.data.current?.containerId) {
            const containerId = over.data.current.containerId as string
            const container = findNode(page.root, containerId)
            parentId = containerId
            insertIndex = container?.children?.length || 0
        } 
        // Case D: 拖到了画布空白处 (添加到根节点末尾)
        else if (over.data.current?.isCanvas) {
            parentId = 'root'
            insertIndex = page.root.children?.length || 0
        } 
        // Case E: 拖到了某个具体组件上 (插入到该组件的前面/后面，这里默认前面)
        else {
            const info = findParentAndIndex(page.root, over.id as string)
            if (info) {
                parentId = info.parentId
                insertIndex = info.index
            }
        }

        // 1.3 提交 Action：添加新组件
        dispatch(addComponent({
            component: newComponent,
            parentId,
            insertAtIndex: insertIndex
        }))
        return
    } 

    // 场景2：画布内已有组件的移动/排序 (Move & Reorder)
    // 如果拖拽的和放置的是同一个位置，不做处理
    if (active.id === over.id) return

    const activeInfo = findParentAndIndex(page.root, active.id as string)
    const overInfo = findParentAndIndex(page.root, over.id as string)

    // 如果找不到组件信息（异常情况），直接返回
    if (!activeInfo) return

    // Case A: 移动到空容器
    if (over.data.current?.isEmptyContainer && over.data.current?.containerId) {
        dispatch(moveComponentToNewParent({
            componentId: active.id as string,
            newParentId: over.data.current.containerId as string,
            newIndex: 0
        }))
        return
    }

    // Case B: 移动到容器末尾热区
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
    
    // Case C: 移动到容器本身
    if (over.data.current?.isContainer && over.data.current?.containerId) {
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

    // Case D: 同级排序 (Same Parent Reorder)
    if (overInfo && activeInfo.parentId === overInfo.parentId) {
        dispatch(reorderComponents({
            parentId: activeInfo.parentId,
            oldIndex: activeInfo.index,
            newIndex: overInfo.index
        }))
        return
    }

    // Case E: 跨级移动 (Cross Parent Move) -> 移动到另一个组件的位置（通常是前面）
    if (overInfo) {
        dispatch(moveComponentToNewParent({
            componentId: active.id as string,
            newParentId: overInfo.parentId,
            newIndex: overInfo.index
        }))
    }
  };

  // 点击"生成代码"按钮的处理函数
  const handleSave = () => {
    // 调用 codegen 工具，将当前的页面 JSON 树转换为 React 源代码字符串
    const sourceCode = generatePageCode(page)
    setCode(sourceCode)
    setIsModalOpen(true)
  }

  // 配置 dnd-kit 的传感器
  // PointerSensor 是最通用的传感器，同时支持鼠标和触摸
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // 激活约束：只有当鼠标移动超过 8px 时才被视为"拖拽"开始
        // 这样可以避免用户点击组件时（会有微小的移动）误触发拖拽，导致无法触发 click 事件
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
          <Popconfirm
            title="确认清空画布？"
            description="此操作将删除所有组件，且不可恢复（除非使用撤销）。"
            onConfirm={() => dispatch(resetProject())}
            okText="确定"
            cancelText="取消"
          >
            <Button danger>清空画布</Button>
          </Popconfirm>
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

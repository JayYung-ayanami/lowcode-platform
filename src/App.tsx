import { Button, Input } from 'antd';
import React from 'react';
import { useAppSelector, useAppDispatch } from './store/hook';
import type { ComponentSchema } from './types/schema';
import { setSelectedId, updateComponentProps } from './store/projectSlice';
import './App.css';


// 1.组件映射表
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ComponentMap: Record<string, React.FC<any>> = {
  Page: ({ children, style }) => <div style={style}>{children}</div>,
  Container: ({ children, style }) => <div style={style}>{children}</div>,
  Button: ({ children, style, ...props }) => <Button style={style} {...props}>{children}</Button>,
  Input: ({ style, ...props }) => <Input style={style} {...props} />,
  Text: ({ text, fontSize, color }) => <span style={{ fontSize, color }}>{text}</span>
};


// 2. 递归渲染器
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

// 3. 主应用
function App() {
  const dispatch = useAppDispatch();
  // 从 Redux 读取数据
  const page = useAppSelector((state) => state.project.page);
  const selectedId = useAppSelector((state) => state.project.selectedId);

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

  return (
    <div className="app">
      {/* 顶部导航 */}
      <div className="header">
        LowCode Engine
      </div>

      {/* 主体三栏布局 */}
      <div className="editor-container">
        
        {/* 左侧：物料面板 */}
        <div className="material-panel">
          <h3>组件库</h3>
          <p>这里将展示可拖拽组件</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Button block>按钮</Button>
            <Button block>文本</Button>
            <Button block>输入框</Button>
          </div>
        </div>

        {/* 中间：画布 */}
        <div className="canvas-area">
          <div className="canvas-paper">
            <RenderComponent schema={page.root} />
          </div>
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
              
              <strong>Props (JSON编辑):</strong>
              <textarea
                style={{ 
                  width: '100%', 
                  height: '300px', 
                  marginTop: '10px',
                  padding: '8px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontFamily: 'monospace'
                }}
                // 这里用了 key 技巧：当选中组件切换时，强制重新渲染 textarea
                // 否则 value 不会变（非受控组件模式下）
                key={selectedComponent.id}
                defaultValue={JSON.stringify(selectedComponent.props, null, 2)}
                onChange={(e) => {
                  try {
                    const newProps = JSON.parse(e.target.value);
                    dispatch(updateComponentProps({ 
                      id: selectedComponent.id, 
                      props: newProps 
                    }));
                  } catch{
                    // JSON 格式错误暂时忽略
                  }
                }}
              />
              <p style={{ fontSize: 12, color: '#999', marginTop: 5 }}>
                提示：直接修改上面的 JSON 来更新组件属性
              </p>
            </div>
          ) : (
            <div style={{ color: '#999', marginTop: 50, textAlign: 'center' }}>
              请在画布中点击选择一个组件
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;
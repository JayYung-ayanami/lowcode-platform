import React from 'react';
import { Button, Input } from 'antd';
import { useAppDispatch, useAppSelector } from '../../store/hook';
import { updateComponentProps, deleteComponent } from '../../store/projectSlice';
import { findNode } from '../../utils/treeUtils';

export const SettingPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const page = useAppSelector((state) => state.project.present.page);
  const selectedId = useAppSelector((state) => state.project.present.selectedId);
  
  const selectedComponent = selectedId ? findNode(page.root, selectedId) : null;

  return (
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
  );
};

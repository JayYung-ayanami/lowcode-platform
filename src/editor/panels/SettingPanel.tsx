import React, { useState } from 'react';
import { Button, Input, Tabs, Select, Collapse, Space, Empty, Tag } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store/hook';
import { updateComponentProps, updateComponentEvents, deleteComponent } from '../../store/projectSlice';
import { findNode } from '../../utils/treeUtils';
import type { EventHandler } from '../../types/schema';

const { Panel } = Collapse;
const { Option } = Select;

const EVENT_TYPES = [
  { label: '点击事件 (onClick)', value: 'onClick' },
  { label: '值改变 (onChange)', value: 'onChange' },
  { label: '鼠标移入 (onMouseEnter)', value: 'onMouseEnter' },
  { label: '鼠标移出 (onMouseLeave)', value: 'onMouseLeave' },
];

const ACTION_TYPES = [
  { label: '弹窗提示', value: 'openModal' },
  { label: '跳转链接', value: 'link' },
  { label: '更新变量', value: 'updateState' },
  { label: '执行脚本', value: 'script' },
];

export const SettingPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const page = useAppSelector((state) => state.project.present.page);
  const selectedId = useAppSelector((state) => state.project.present.selectedId);
  const selectedComponent = selectedId ? findNode(page.root, selectedId) : null;
  
  // 本地状态用于管理正在添加的事件
  const [addingEventName, setAddingEventName] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePropsChange = (key: string, value: any) => {
    if (!selectedComponent) return;
    dispatch(updateComponentProps({
      id: selectedComponent.id,
      props: { [key]: value }
    }));
  };

  const handleAddEvent = () => {
    if (!selectedComponent || !addingEventName) return;
    const currentEvents = selectedComponent.events || {};
    if (currentEvents[addingEventName]) {
      alert('该事件已存在');
      return;
    }
    
    dispatch(updateComponentEvents({
      id: selectedComponent.id,
      events: {
        ...currentEvents,
        [addingEventName]: []
      }
    }));
    setAddingEventName(null);
  };

  const handleAddAction = (eventName: string, type: EventHandler['type']) => {
    if (!selectedComponent) return;
    const currentEvents = selectedComponent.events || {};
    const actions = currentEvents[eventName] || [];
    
    const newAction: EventHandler = {
        type,
        config: {}
    };

    // 设置默认 config
    if (type === 'openModal') newAction.config = { title: '这是一个弹窗' };
    if (type === 'link') newAction.config = { url: 'https://www.qq.com' };
    if (type === 'updateState') newAction.config = { key: 'username', value: 'New Value' };
    if (type === 'script') newAction.config = { code: 'console.log("Hello", e);' };

    dispatch(updateComponentEvents({
      id: selectedComponent.id,
      events: {
        ...currentEvents,
        [eventName]: [...actions, newAction]
      }
    }));
  };

  const handleRemoveAction = (eventName: string, index: number) => {
    if (!selectedComponent) return;
    const currentEvents = selectedComponent.events || {};
    const actions = [...(currentEvents[eventName] || [])];
    actions.splice(index, 1);
    
    dispatch(updateComponentEvents({
      id: selectedComponent.id,
      events: {
        ...currentEvents,
        [eventName]: actions
      }
    }));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdateActionConfig = (eventName: string, index: number, configKey: string, value: any) => {
    if (!selectedComponent) return;
    const currentEvents = selectedComponent.events || {};
    const actions = [...(currentEvents[eventName] || [])];
    
    actions[index] = {
        ...actions[index],
        config: {
            ...actions[index].config,
            [configKey]: value
        }
    };

    dispatch(updateComponentEvents({
      id: selectedComponent.id,
      events: {
        ...currentEvents,
        [eventName]: actions
      }
    }));
  };

  const renderActionForm = (eventName: string, action: EventHandler, index: number) => {
      return (
          <div key={index} style={{ background: '#f5f5f5', padding: 10, marginBottom: 10, borderRadius: 4, border: '1px solid #d9d9d9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Tag color="blue">{ACTION_TYPES.find(t => t.value === action.type)?.label}</Tag>
                  <DeleteOutlined 
                    onClick={() => handleRemoveAction(eventName, index)} 
                    style={{ cursor: 'pointer', color: '#ff4d4f' }}
                  />
              </div>
              
              {action.type === 'openModal' && (
                  <div>
                      <label style={{ fontSize: 12 }}>弹窗标题:</label>
                      <Input 
                        size="small" 
                        value={action.config.title} 
                        onChange={(e) => handleUpdateActionConfig(eventName, index, 'title', e.target.value)}
                      />
                  </div>
              )}

              {action.type === 'link' && (
                  <div>
                      <div style={{ marginBottom: 5 }}>
                        <label style={{ fontSize: 12 }}>链接地址:</label>
                        <Input 
                            size="small" 
                            value={action.config.url} 
                            onChange={(e) => handleUpdateActionConfig(eventName, index, 'url', e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12 }}>打开方式:</label>
                        <Select 
                            size="small" 
                            style={{ width: '100%' }}
                            value={action.config.target || '_blank'}
                            onChange={(val) => handleUpdateActionConfig(eventName, index, 'target', val)}
                        >
                            <Option value="_blank">新窗口 (_blank)</Option>
                            <Option value="_self">当前窗口 (_self)</Option>
                        </Select>
                      </div>
                  </div>
              )}

            {action.type === 'updateState' && (
                  <div>
                      <div style={{ marginBottom: 5 }}>
                        <label style={{ fontSize: 12 }}>变量名 (key):</label>
                        <Input 
                            size="small" 
                            value={action.config.key} 
                            onChange={(e) => handleUpdateActionConfig(eventName, index, 'key', e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12 }}>新值 (value):</label>
                        <Input 
                            size="small" 
                            value={action.config.value} 
                            placeholder="如果不填，则取事件对象的 value"
                            onChange={(e) => handleUpdateActionConfig(eventName, index, 'value', e.target.value)}
                        />
                      </div>
                  </div>
              )}

              {action.type === 'script' && (
                  <div>
                      <label style={{ fontSize: 12 }}>JS 代码:</label>
                      <Input.TextArea 
                        rows={3}
                        size="small" 
                        value={action.config.code} 
                        style={{ fontFamily: 'monospace' }}
                        onChange={(e) => handleUpdateActionConfig(eventName, index, 'code', e.target.value)}
                      />
                      <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>
                          可用变量: e, dispatch, setVariable, variables
                      </div>
                  </div>
              )}
          </div>
      )
  }

  if (!selectedComponent) {
    return (
        <div className="setting-panel">
            <Empty description="请在画布中选择组件" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
    );
  }

  return (
    <div className="setting-panel">
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tab="属性 (Props)" key="1">
          <div style={{ marginBottom: 10 }}>
            <Tag color="geekblue">ID: {selectedComponent.id}</Tag>
            <Tag color="green">{selectedComponent.type}</Tag>
          </div>
          
          {selectedComponent.type === 'Button' && (
            <div style={{ marginBottom: 10 }}>
              <label>按钮文字:</label>
              <Input
                value={selectedComponent.props.children}
                onChange={(e) => handlePropsChange('children', e.target.value)}
              />
            </div>
          )}

          {selectedComponent.type === 'Text' && (
            <>
              <div style={{ marginBottom: 10 }}>
                <label>文本内容：</label>
                <Input 
                  value={selectedComponent.props.text}
                  onChange={(e) => handlePropsChange('text', e.target.value)}
                />
              </div>
              <div style={{ marginBottom: 10 }}>
                  <label>颜色：</label>
                  <Input 
                    type="color"
                    value={selectedComponent.props.color} 
                    onChange={(e) => handlePropsChange('color', e.target.value)}
                  />
              </div>
              <div style={{ marginBottom: 10 }}>
                  <label>字体大小：</label>
                  <Input 
                    value={selectedComponent.props.fontSize} 
                    onChange={(e) => handlePropsChange('fontSize', e.target.value)}
                  />
              </div>
            </>
          )}

          {selectedComponent.type === 'Input' && (
            <div style={{ marginBottom: 10 }}>
              <label>占位符：</label>
              <Input 
                value={selectedComponent.props.placeholder}
                onChange={(e) => handlePropsChange('placeholder', e.target.value)}
              />
            </div>
          )}

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
        </Tabs.TabPane>

        <Tabs.TabPane tab="事件 (Events)" key="2">
            <div style={{ marginBottom: 15 }}>
                <Space>
                    <Select 
                        style={{ width: 160 }} 
                        placeholder="选择事件类型"
                        value={addingEventName}
                        onChange={setAddingEventName}
                    >
                        {EVENT_TYPES.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
                    </Select>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddEvent}>添加</Button>
                </Space>
            </div>

            <Collapse activeKey={Object.keys(selectedComponent.events || {})}>
                {Object.entries(selectedComponent.events || {}).map(([eventName, actions]) => (
                    <Panel header={eventName} key={eventName} extra={
                        <DeleteOutlined onClick={(e) => {
                            e.stopPropagation();
                            const newEvents = { ...selectedComponent.events };
                            delete newEvents[eventName];
                            dispatch(updateComponentEvents({ id: selectedComponent.id, events: newEvents }));
                        }} />
                    }>
                        <div style={{ marginBottom: 10 }}>
                             <Select 
                                placeholder="添加动作" 
                                style={{ width: '100%' }}
                                onChange={(val) => handleAddAction(eventName, val as unknown as EventHandler['type'])}
                                value={null}
                             >
                                 {ACTION_TYPES.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
                             </Select>
                        </div>
                        {actions.map((action, idx) => renderActionForm(eventName, action, idx))}
                        {actions.length === 0 && <div style={{ color: '#999', fontSize: 12 }}>暂无动作，请添加</div>}
                    </Panel>
                ))}
            </Collapse>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};


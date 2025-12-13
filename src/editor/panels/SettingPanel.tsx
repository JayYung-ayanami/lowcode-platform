import React, { useState, useEffect } from 'react';
import { Button, Input, Tabs, Select, Collapse, Space, Empty, Tag, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store/hook';
import { updateComponentProps, updateComponentEvents, deleteComponent } from '../../store/projectSlice';
import { findNode } from '../../utils/treeUtils';
import type { EventHandler } from '../../types/schema';

const { Panel } = Collapse;
const { Option } = Select;
const { Text } = Typography;

// --- 类型定义 ---

// 动作类型选项
const ACTION_TYPES: { label: string; value: EventHandler['type'] }[] = [
  { label: '弹窗提示', value: 'openModal' },
  { label: '跳转链接', value: 'link' },
  { label: '更新变量', value: 'updateState' },
  { label: '执行脚本', value: 'script' },
  { label: '设置属性', value: 'setValue' }, // 之前漏掉了这个
];

const EVENT_TYPES = [
  { label: '点击事件 (onClick)', value: 'onClick' },
  { label: '值改变 (onChange)', value: 'onChange' },
  { label: '鼠标移入 (onMouseEnter)', value: 'onMouseEnter' },
  { label: '鼠标移出 (onMouseLeave)', value: 'onMouseLeave' },
];

// --- 辅助组件 ---

// JSON 编辑辅助组件
const JsonPropEditor: React.FC<{ 
    label: string; 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any; 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange: (val: any) => void 
}> = ({ label, value, onChange }) => {
    const [str, setStr] = useState('');
    const [error, setError] = useState(false);

    // 仅当 value 外部变更且与当前编辑内容不一致时（或初始化时）同步
    useEffect(() => {
        // 简单处理：只有当 value 存在时才初始化
        if (value !== undefined) {
             const newStr = JSON.stringify(value, null, 2);
             if (newStr !== str) {
                setStr(newStr);
             }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const txt = e.target.value;
        setStr(txt);
        try {
            JSON.parse(txt);
            setError(false);
        } catch {
            setError(true);
        }
    };

    const handleBlur = () => {
         try {
            const parsed = JSON.parse(str);
            onChange(parsed);
            // 格式化代码
            setStr(JSON.stringify(parsed, null, 2)); 
            setError(false);
        } catch {
            // 解析失败保持原样，显示错误状态
            setError(true);
        }
    }

    return (
        <div style={{ marginBottom: 10 }}>
            <div style={{ marginBottom: 4 }}>
                <Text type={error ? 'danger' : undefined} style={{ fontSize: 12 }}>
                    {label} {error && '(JSON 格式错误)'}
                </Text>
            </div>
            <Input.TextArea
                rows={6}
                style={{ fontFamily: 'monospace', fontSize: 12, borderColor: error ? '#ff4d4f' : undefined }}
                value={str}
                onChange={handleChange}
                onBlur={handleBlur}
            />
        </div>
    )
}

// --- 主组件 ---

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
      // 实际项目中建议使用 message.warning
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
    switch (type) {
        case 'openModal':
            newAction.config = { title: '这是一个弹窗' };
            break;
        case 'link':
            newAction.config = { url: 'https://www.qq.com', target: '_blank' };
            break;
        case 'updateState':
            newAction.config = { key: 'username', value: 'New Value' };
            break;
        case 'script':
            newAction.config = { code: 'console.log("Hello", e);' };
            break;
        case 'setValue':
            newAction.config = { targetId: '', value: '' };
            break;
    }

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
    
    // 确保深度复制，避免修改只读对象
    const targetAction = { ...actions[index] };
    targetAction.config = { ...targetAction.config, [configKey]: value };
    actions[index] = targetAction;

    dispatch(updateComponentEvents({
      id: selectedComponent.id,
      events: {
        ...currentEvents,
        [eventName]: actions
      }
    }));
  };

  const renderActionForm = (eventName: string, action: EventHandler, index: number) => {
      const typeLabel = ACTION_TYPES.find(t => t.value === action.type)?.label || action.type;

      return (
          <div key={index} style={{ background: '#f5f5f5', padding: 10, marginBottom: 10, borderRadius: 4, border: '1px solid #d9d9d9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Tag color="blue">{typeLabel}</Tag>
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

              {action.type === 'setValue' && (
                  <div>
                      <div style={{ marginBottom: 5 }}>
                        <label style={{ fontSize: 12 }}>目标组件 ID:</label>
                        <Input 
                            size="small" 
                            value={action.config.targetId} 
                            placeholder="例如 input_1"
                            onChange={(e) => handleUpdateActionConfig(eventName, index, 'targetId', e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12 }}>设置值 (Value):</label>
                        <Input 
                            size="small" 
                            value={action.config.value} 
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
      <Tabs defaultActiveKey="1" items={[
        {
            key: '1',
            label: '属性 (Props)',
            children: (
                <div>
                    <div style={{ marginBottom: 10 }}>
                        <Space>
                            <Tag color="geekblue">ID: {selectedComponent.id}</Tag>
                            <Tag color="green">{selectedComponent.type}</Tag>
                        </Space>
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

                    {selectedComponent.type === 'Table' && (
                        <>
                        <JsonPropEditor 
                            key={`${selectedComponent.id}-columns`}
                            label="列配置 (Columns)" 
                            value={selectedComponent.props.columns} 
                            onChange={(val) => handlePropsChange('columns', val)} 
                        />
                        <JsonPropEditor 
                            key={`${selectedComponent.id}-dataSource`}
                            label="数据源 (DataSource)" 
                            value={selectedComponent.props.dataSource} 
                            onChange={(val) => handlePropsChange('dataSource', val)} 
                        />
                        </>
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
                </div>
            )
        },
        {
            key: '2',
            label: '事件 (Events)',
            children: (
                <div>
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
                </div>
            )
        }
      ]} />
    </div>
  );
};

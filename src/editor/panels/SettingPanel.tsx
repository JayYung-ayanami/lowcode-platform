import React, { useState, useEffect } from 'react';
import { Button, Input, InputNumber, Switch, Tabs, Select, Collapse, Space, Empty, Tag, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store/hook';
import { updateComponentProps, updateComponentStyle, updateComponentEvents, deleteComponent } from '../../store/projectSlice';
import { findNode } from '../../utils/treeUtils';
import type { ComponentSchema, EventHandler } from '../../types/schema';
import { materialMap } from '../../materials/registry';
import type { SetterConfig } from '../../materials/types';

const { Option } = Select;
const { Text } = Typography;

// 动作类型选项
const ACTION_TYPES: { label: string; value: EventHandler['type'] }[] = [
  { label: '弹窗提示', value: 'openModal' },
  { label: '跳转链接', value: 'link' },
  { label: '更新变量', value: 'updateState' },
  { label: '设置属性', value: 'setValue' },
  { label: '请求接口', value: 'requestApi' },
  { label: '执行脚本', value: 'script' },
];

const EVENT_TYPES = [
  { label: '点击事件 (onClick)', value: 'onClick' },
  { label: '值改变 (onChange)', value: 'onChange' },
  { label: '鼠标移入 (onMouseEnter)', value: 'onMouseEnter' },
  { label: '鼠标移出 (onMouseLeave)', value: 'onMouseLeave' },
];

// --- JSON 编辑辅助组件 ---
const JsonPropEditor: React.FC<{
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (val: any) => void;
}> = ({ label, value, onChange }) => {
  const [str, setStr] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (value !== undefined) {
      const newStr = JSON.stringify(value, null, 2);
      if (newStr !== str) setStr(newStr);
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
      setStr(JSON.stringify(parsed, null, 2));
      setError(false);
    } catch {
      setError(true);
    }
  };

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
  );
};

// --- 主组件 ---
export const SettingPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const page = useAppSelector((state) => state.project.present.page);
  const selectedId = useAppSelector((state) => state.project.present.selectedId);
  const selectedComponent = selectedId ? findNode(page.root, selectedId) : null;
  const dataSources = page.dataSources || [];

  const [addingEventName, setAddingEventName] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePropsChange = (key: string, value: any) => {
    if (!selectedComponent) return;
    dispatch(updateComponentProps({ id: selectedComponent.id, props: { [key]: value } }));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleStyleChange = (key: string, value: any) => {
    if (!selectedComponent) return;
    dispatch(updateComponentStyle({ id: selectedComponent.id, style: { [key]: value } }));
  };

  // 根据 Setter 协议动态渲染属性控件（取代过去针对每个组件硬编码的表单）
  const renderSetter = (setter: SetterConfig, component: ComponentSchema) => {
    const group = setter.group || 'props';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = group === 'style' ? (component.style as any)?.[setter.key] : component.props[setter.key];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commit = (val: any) => (group === 'style' ? handleStyleChange(setter.key, val) : handlePropsChange(setter.key, val));

    let control: React.ReactNode;
    switch (setter.setter) {
      case 'number':
        control = (
          <InputNumber style={{ width: '100%' }} value={value} onChange={(v) => commit(v)} placeholder={setter.placeholder} />
        );
        break;
      case 'boolean':
        control = <Switch checked={!!value} onChange={(v) => commit(v)} />;
        break;
      case 'color':
        control = (
          <Input type="color" value={value || '#000000'} onChange={(e) => commit(e.target.value)} style={{ width: 60, padding: 2 }} />
        );
        break;
      case 'textarea':
        control = <Input.TextArea rows={3} value={value} onChange={(e) => commit(e.target.value)} placeholder={setter.placeholder} />;
        break;
      case 'select':
        control = (
          <Select style={{ width: '100%' }} value={value} onChange={(v) => commit(v)} placeholder={setter.placeholder}>
            {setter.options?.map((opt) => (
              <Option key={String(opt.value)} value={opt.value}>{opt.label}</Option>
            ))}
          </Select>
        );
        break;
      case 'json':
        return <JsonPropEditor key={`${component.id}-${setter.key}`} label={setter.label} value={value} onChange={commit} />;
      case 'string':
      default:
        control = <Input value={value} onChange={(e) => commit(e.target.value)} placeholder={setter.placeholder} />;
        break;
    }

    return (
      <div key={`${component.id}-${setter.key}`} style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>{setter.label}：</label>
        {control}
      </div>
    );
  };

  const handleAddEvent = () => {
    if (!selectedComponent || !addingEventName) return;
    const currentEvents = selectedComponent.events || {};
    if (currentEvents[addingEventName]) {
      alert('该事件已存在');
      return;
    }
    dispatch(updateComponentEvents({ id: selectedComponent.id, events: { ...currentEvents, [addingEventName]: [] } }));
    setAddingEventName(null);
  };

  const handleAddAction = (eventName: string, type: EventHandler['type']) => {
    if (!selectedComponent) return;
    const currentEvents = selectedComponent.events || {};
    const actions = currentEvents[eventName] || [];
    const newAction: EventHandler = { type, config: {} };

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
      case 'requestApi':
        newAction.config = { dataSourceId: dataSources[0]?.id || '' };
        break;
    }

    dispatch(updateComponentEvents({ id: selectedComponent.id, events: { ...currentEvents, [eventName]: [...actions, newAction] } }));
  };

  const handleRemoveAction = (eventName: string, index: number) => {
    if (!selectedComponent) return;
    const currentEvents = selectedComponent.events || {};
    const actions = [...(currentEvents[eventName] || [])];
    actions.splice(index, 1);
    dispatch(updateComponentEvents({ id: selectedComponent.id, events: { ...currentEvents, [eventName]: actions } }));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdateActionConfig = (eventName: string, index: number, configKey: string, value: any) => {
    if (!selectedComponent) return;
    const currentEvents = selectedComponent.events || {};
    const actions = [...(currentEvents[eventName] || [])];
    const targetAction = { ...actions[index] };
    targetAction.config = { ...targetAction.config, [configKey]: value };
    actions[index] = targetAction;
    dispatch(updateComponentEvents({ id: selectedComponent.id, events: { ...currentEvents, [eventName]: actions } }));
  };

  const renderActionForm = (eventName: string, action: EventHandler, index: number) => {
    const typeLabel = ACTION_TYPES.find((t) => t.value === action.type)?.label || action.type;

    return (
      <div key={index} style={{ background: '#f5f5f5', padding: 10, marginBottom: 10, borderRadius: 4, border: '1px solid #d9d9d9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <Tag color="blue">{typeLabel}</Tag>
          <DeleteOutlined onClick={() => handleRemoveAction(eventName, index)} style={{ cursor: 'pointer', color: '#ff4d4f' }} />
        </div>

        {action.type === 'openModal' && (
          <div>
            <label style={{ fontSize: 12 }}>弹窗标题:</label>
            <Input size="small" value={action.config.title} onChange={(e) => handleUpdateActionConfig(eventName, index, 'title', e.target.value)} />
          </div>
        )}

        {action.type === 'link' && (
          <div>
            <div style={{ marginBottom: 5 }}>
              <label style={{ fontSize: 12 }}>链接地址:</label>
              <Input size="small" value={action.config.url} onChange={(e) => handleUpdateActionConfig(eventName, index, 'url', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12 }}>打开方式:</label>
              <Select size="small" style={{ width: '100%' }} value={action.config.target || '_blank'} onChange={(val) => handleUpdateActionConfig(eventName, index, 'target', val)}>
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
              <Input size="small" value={action.config.key} onChange={(e) => handleUpdateActionConfig(eventName, index, 'key', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12 }}>新值 (value):</label>
              <Input size="small" value={action.config.value} placeholder="不填则取事件对象的 value" onChange={(e) => handleUpdateActionConfig(eventName, index, 'value', e.target.value)} />
            </div>
          </div>
        )}

        {action.type === 'setValue' && (
          <div>
            <div style={{ marginBottom: 5 }}>
              <label style={{ fontSize: 12 }}>目标组件 ID:</label>
              <Input size="small" value={action.config.targetId} placeholder="例如 input_1" onChange={(e) => handleUpdateActionConfig(eventName, index, 'targetId', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12 }}>设置值 (Value):</label>
              <Input size="small" value={action.config.value} onChange={(e) => handleUpdateActionConfig(eventName, index, 'value', e.target.value)} />
            </div>
          </div>
        )}

        {action.type === 'requestApi' && (
          <div>
            <label style={{ fontSize: 12 }}>选择数据源:</label>
            <Select
              size="small"
              style={{ width: '100%' }}
              value={action.config.dataSourceId}
              placeholder={dataSources.length ? '选择数据源' : '请先在顶部配置数据源'}
              onChange={(val) => handleUpdateActionConfig(eventName, index, 'dataSourceId', val)}
            >
              {dataSources.map((ds) => (
                <Option key={ds.id} value={ds.id}>{ds.name} → {`{{state.${ds.variableKey}}}`}</Option>
              ))}
            </Select>
          </div>
        )}

        {action.type === 'script' && (
          <div>
            <label style={{ fontSize: 12 }}>JS 代码:</label>
            <Input.TextArea rows={3} size="small" value={action.config.code} style={{ fontFamily: 'monospace' }} onChange={(e) => handleUpdateActionConfig(eventName, index, 'code', e.target.value)} />
            <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>可用变量: e, dispatch, setVariable, variables</div>
          </div>
        )}
      </div>
    );
  };

  if (!selectedComponent) {
    return (
      <div className="setting-panel">
        <Empty description="请在画布中选择组件" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  const meta = materialMap[selectedComponent.type];

  return (
    <div className="setting-panel">
      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: '1',
            label: '属性 (Props)',
            children: (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <Space>
                    <Tag color="geekblue">ID: {selectedComponent.id}</Tag>
                    <Tag color="green">{meta?.name || selectedComponent.type}</Tag>
                  </Space>
                </div>

                {meta && meta.setters.length > 0 ? (
                  meta.setters.map((setter) => renderSetter(setter, selectedComponent))
                ) : (
                  <Text type="secondary" style={{ fontSize: 12 }}>该组件暂无可配置属性</Text>
                )}

                <div style={{ marginTop: 20 }}>
                  <Button danger block onClick={() => dispatch(deleteComponent(selectedComponent.id))}>
                    删除组件
                  </Button>
                </div>
              </div>
            ),
          },
          {
            key: '2',
            label: '事件 (Events)',
            children: (
              <div>
                <div style={{ marginBottom: 15 }}>
                  <Space>
                    <Select style={{ width: 160 }} placeholder="选择事件类型" value={addingEventName} onChange={setAddingEventName}>
                      {EVENT_TYPES.map((t) => (
                        <Option key={t.value} value={t.value}>{t.label}</Option>
                      ))}
                    </Select>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddEvent}>添加</Button>
                  </Space>
                </div>

                <Collapse
                  activeKey={Object.keys(selectedComponent.events || {})}
                  items={Object.entries(selectedComponent.events || {}).map(([eventName, actions]) => ({
                    key: eventName,
                    label: eventName,
                    extra: (
                      <DeleteOutlined
                        onClick={(e) => {
                          e.stopPropagation();
                          const newEvents = { ...selectedComponent.events };
                          delete newEvents[eventName];
                          dispatch(updateComponentEvents({ id: selectedComponent.id, events: newEvents }));
                        }}
                      />
                    ),
                    children: (
                      <>
                        <div style={{ marginBottom: 10 }}>
                          <Select placeholder="添加动作" style={{ width: '100%' }} onChange={(val) => handleAddAction(eventName, val as unknown as EventHandler['type'])} value={null}>
                            {ACTION_TYPES.map((t) => (
                              <Option key={t.value} value={t.value}>{t.label}</Option>
                            ))}
                          </Select>
                        </div>
                        {actions.map((action, idx) => renderActionForm(eventName, action, idx))}
                        {actions.length === 0 && <div style={{ color: '#999', fontSize: 12 }}>暂无动作，请添加</div>}
                      </>
                    ),
                  }))}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

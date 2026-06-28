import React from 'react';
import { Modal, Button, Input, Select, Switch, Space, Card, Empty, message, Tag } from 'antd';
import { DeleteOutlined, PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { v4 as uuid } from 'uuid';
import { useAppDispatch, useAppSelector } from '../../store/hook';
import { setDataSources, setVariable } from '../../store/projectSlice';
import { fetchDataSource } from '../../utils/dataSource';
import type { DataSourceConfig } from '../../types/schema';

const { Option } = Select;

interface Props {
    open: boolean;
    onClose: () => void;
}

/**
 * 数据源管理：配置远程接口，结果写入全局变量供组件 {{state.xxx}} 绑定。
 * 支持 mock 兜底，离线也可演示"接口请求 → 渲染"链路。
 */
export const DataSourceModal: React.FC<Props> = ({ open, onClose }) => {
    const dispatch = useAppDispatch();
    const dataSources = useAppSelector((state) => state.project.present.page.dataSources) || [];

    const update = (next: DataSourceConfig[]) => dispatch(setDataSources(next));

    const handleAdd = () => {
        const ds: DataSourceConfig = {
            id: uuid(),
            name: '新数据源',
            variableKey: `data${dataSources.length + 1}`,
            url: 'https://jsonplaceholder.typicode.com/users',
            method: 'GET',
            autoLoad: true,
            dataPath: '',
            mock: [{ id: 1, name: 'Mock 用户', email: 'mock@example.com' }],
        };
        update([...dataSources, ds]);
    };

    const handleChange = <K extends keyof DataSourceConfig>(id: string, key: K, value: DataSourceConfig[K]) => {
        update(dataSources.map((ds) => (ds.id === id ? { ...ds, [key]: value } : ds)));
    };

    const handleMockChange = (id: string, text: string) => {
        try {
            const parsed = JSON.parse(text);
            update(dataSources.map((ds) => (ds.id === id ? { ...ds, mock: parsed } : ds)));
        } catch {
            // 输入未完成时忽略解析错误，等待合法 JSON
        }
    };

    const handleDelete = (id: string) => {
        update(dataSources.filter((ds) => ds.id !== id));
    };

    const handleTest = async (ds: DataSourceConfig) => {
        const data = await fetchDataSource(ds);
        dispatch(setVariable({ key: ds.variableKey, value: data }));
        message.success(`已请求「${ds.name}」并写入变量 ${ds.variableKey}`);
    };

    return (
        <Modal
            title="数据源管理"
            open={open}
            onCancel={onClose}
            width={760}
            footer={[
                <Button key="add" type="dashed" icon={<PlusOutlined />} onClick={handleAdd}>新增数据源</Button>,
                <Button key="close" type="primary" onClick={onClose}>完成</Button>,
            ]}
        >
            {dataSources.length === 0 ? (
                <Empty description="暂无数据源，点击下方“新增数据源”创建">
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增数据源</Button>
                </Empty>
            ) : (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    {dataSources.map((ds) => (
                        <Card
                            key={ds.id}
                            size="small"
                            title={
                                <Space>
                                    <span>{ds.name}</span>
                                    <Tag color="blue">{`{{state.${ds.variableKey}}}`}</Tag>
                                </Space>
                            }
                            extra={
                                <Space>
                                    <Button size="small" icon={<ThunderboltOutlined />} onClick={() => handleTest(ds)}>立即请求</Button>
                                    <DeleteOutlined style={{ color: '#ff4d4f' }} onClick={() => handleDelete(ds.id)} />
                                </Space>
                            }
                        >
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <Labeled label="名称">
                                    <Input size="small" value={ds.name} onChange={(e) => handleChange(ds.id, 'name', e.target.value)} />
                                </Labeled>
                                <Labeled label="变量名 (variableKey)">
                                    <Input size="small" value={ds.variableKey} onChange={(e) => handleChange(ds.id, 'variableKey', e.target.value)} />
                                </Labeled>
                                <Labeled label="接口地址 (URL)">
                                    <Input size="small" value={ds.url} onChange={(e) => handleChange(ds.id, 'url', e.target.value)} />
                                </Labeled>
                                <Labeled label="请求方法">
                                    <Select size="small" style={{ width: '100%' }} value={ds.method} onChange={(v) => handleChange(ds.id, 'method', v)}>
                                        <Option value="GET">GET</Option>
                                        <Option value="POST">POST</Option>
                                    </Select>
                                </Labeled>
                                <Labeled label="取值路径 (dataPath)">
                                    <Input size="small" placeholder="如 data.list，留空取整体" value={ds.dataPath} onChange={(e) => handleChange(ds.id, 'dataPath', e.target.value)} />
                                </Labeled>
                                <Labeled label="页面加载自动请求">
                                    <Switch checked={ds.autoLoad} onChange={(v) => handleChange(ds.id, 'autoLoad', v)} />
                                </Labeled>
                            </div>
                            <Labeled label="Mock 兜底数据 (JSON，请求失败时使用)">
                                <Input.TextArea
                                    rows={3}
                                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                                    defaultValue={JSON.stringify(ds.mock ?? null, null, 2)}
                                    onChange={(e) => handleMockChange(ds.id, e.target.value)}
                                />
                            </Labeled>
                        </Card>
                    ))}
                </Space>
            )}
        </Modal>
    );
};

const Labeled: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{label}</div>
        {children}
    </div>
);

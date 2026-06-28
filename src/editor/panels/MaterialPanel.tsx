import React from 'react';
import { DraggableSource } from '../materials/DraggableSource';
import { Button, Typography, Collapse } from 'antd';
import {
  AppstoreOutlined,
  FormOutlined,
  LayoutOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import { materialsByCategory } from '../../materials/registry';
import type { MaterialMeta } from '../../materials/types';

const { Title, Text } = Typography;

// 分类元信息（顺序 + 图标 + 标题），物料项本身由注册表派生
const CATEGORY_META: { key: MaterialMeta['category']; label: string; icon: React.ReactNode }[] = [
  { key: 'basic', label: '基础组件', icon: <AppstoreOutlined /> },
  { key: 'form', label: '表单组件', icon: <FormOutlined /> },
  { key: 'layout', label: '布局组件', icon: <LayoutOutlined /> },
  { key: 'advanced', label: '高级组件', icon: <ExperimentOutlined /> },
];

export const MaterialPanel: React.FC = () => {
  const items = CATEGORY_META.filter((c) => (materialsByCategory[c.key]?.length ?? 0) > 0).map((cat) => ({
    key: cat.key,
    label: (
      <span>
        {cat.icon} {cat.label}
      </span>
    ),
    children: (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {materialsByCategory[cat.key].map((m) => (
          <DraggableSource key={m.type} type={m.type}>
            <div className="material-item">
              <Button block size="small">
                {m.name}
              </Button>
            </div>
          </DraggableSource>
        ))}
      </div>
    ),
  }));

  return (
    <div className="material-panel">
      <Title level={4} className="panel-title">组件库</Title>
      <Text type="secondary" className="panel-description">
        拖拽组件到画布中
      </Text>

      <div className="material-scroll-area">
        <Collapse defaultActiveKey={CATEGORY_META.map((c) => c.key)} ghost items={items} />
      </div>
    </div>
  );
};

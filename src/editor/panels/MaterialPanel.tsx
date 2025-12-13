import React from 'react';
import { DraggableSource } from '../materials/DraggableSource';
import { Button, Card, Typography } from 'antd';

const { Title, Text } = Typography;

export const MaterialPanel: React.FC = () => {
  return (
    <div className="material-panel">
      <Title level={4} className="panel-title">组件库</Title>
      <Text type="secondary" className="panel-description">
        拖拽组件到画布中
      </Text>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <DraggableSource type="Button">
          <div className="material-item">
            <Button block>按钮</Button>
          </div>
        </DraggableSource>
        <DraggableSource type="Text">
          <div className="material-item">
            <Button block>文本</Button>
          </div>
        </DraggableSource>
        <DraggableSource type="Input">
            <div className="material-item">
                <Button block>输入框</Button>
            </div>
        </DraggableSource>
        <DraggableSource type="Container">
            <div className="material-item">
                <Button block style={{ borderStyle: 'dashed' }}>容器</Button>
            </div>
        </DraggableSource>
      </div>
    </div>
  );
};

import React from 'react';
import { Button } from 'antd';
import { DraggableSource } from '../materials/DraggableSource';

export const MaterialPanel: React.FC = () => {
  return (
    <div className="material-panel">
      <h3>组件库</h3>
      <p>这里将展示可拖拽组件</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <DraggableSource type="Button">
          <Button block>按钮</Button>
        </DraggableSource>
        <DraggableSource type="Text">
          <Button block>文本</Button>
        </DraggableSource>
        <DraggableSource type="Input">
          <Button block>输入框</Button>
        </DraggableSource>
        <DraggableSource type="Container">
          <Button block style={{ border: '1px dashed #666' }}>容器(Container)</Button>
        </DraggableSource>
      </div>
    </div>
  );
};

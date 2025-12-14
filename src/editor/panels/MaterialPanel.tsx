import React from 'react';
import { DraggableSource } from '../materials/DraggableSource';
import { Button, Typography, Collapse } from 'antd';
import { 
  AppstoreOutlined, 
  FormOutlined, 
  LayoutOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Panel } = Collapse;

export const MaterialPanel: React.FC = () => {
  return (
    <div className="material-panel">
      <Title level={4} className="panel-title">组件库</Title>
      <Text type="secondary" className="panel-description">
        拖拽组件到画布中
      </Text>
      
      <Collapse 
        defaultActiveKey={['basic', 'form', 'layout']} 
        ghost
        style={{ marginTop: '16px' }}
      >
        <Panel 
          header={<span><AppstoreOutlined /> 基础组件</span>} 
          key="basic"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <DraggableSource type="Button">
              <div className="material-item">
                <Button block size="small">按钮</Button>
              </div>
            </DraggableSource>
            <DraggableSource type="Text">
              <div className="material-item">
                <Button block size="small">文本</Button>
              </div>
            </DraggableSource>
            <DraggableSource type="Tag">
              <div className="material-item">
                <Button block size="small">标签</Button>
              </div>
            </DraggableSource>
            <DraggableSource type="Divider">
              <div className="material-item">
                <Button block size="small">分割线</Button>
              </div>
            </DraggableSource>
          </div>
        </Panel>

        <Panel 
          header={<span><FormOutlined /> 表单组件</span>} 
          key="form"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <DraggableSource type="Input">
              <div className="material-item">
                <Button block size="small">输入框</Button>
              </div>
            </DraggableSource>
            <DraggableSource type="Select">
              <div className="material-item">
                <Button block size="small">下拉框</Button>
              </div>
            </DraggableSource>
            <DraggableSource type="Form">
              <div className="material-item">
                <Button block size="small">表单</Button>
              </div>
            </DraggableSource>
            <DraggableSource type="FormItem">
              <div className="material-item">
                <Button block size="small">表单项</Button>
              </div>
            </DraggableSource>
          </div>
        </Panel>

        <Panel 
          header={<span><LayoutOutlined /> 布局组件</span>} 
          key="layout"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <DraggableSource type="Container">
              <div className="material-item">
                <Button block size="small" style={{ borderStyle: 'dashed' }}>容器</Button>
              </div>
            </DraggableSource>
            <DraggableSource type="Card">
              <div className="material-item">
                <Button block size="small">卡片</Button>
              </div>
            </DraggableSource>
            <DraggableSource type="Space">
              <div className="material-item">
                <Button block size="small">间距</Button>
              </div>
            </DraggableSource>
            <DraggableSource type="Table">
              <div className="material-item">
                <Button block size="small">表格</Button>
              </div>
            </DraggableSource>
            <DraggableSource type="Modal">
              <div className="material-item">
                <Button block size="small">弹窗</Button>
              </div>
            </DraggableSource>
          </div>
        </Panel>
      </Collapse>
    </div>
  );
};

import { Button, Input, Table, Card, Select, Form, Modal, Divider, Space, Tag } from 'antd';
import React from 'react';

const { Option } = Select;
const { Item: FormItem } = Form;

// 组件映射表
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ComponentMap: Record<string, React.FC<any>> = {
  Page: ({ children, style, ...props }) => <div style={style} {...props}>{children}</div>,
  Container: ({ children, style, ...props }) => <div style={style} {...props}>{children}</div>,
  Button: ({ children, style, ...props }) => <Button style={style} {...props}>{children}</Button>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Input: ({ style, children, ...props }) => <Input style={style} {...props} />,
  Text: ({ text, fontSize, color, ...props }) => <span style={{ fontSize, color }} {...props}>{text}</span>,
  Table: ({ style, ...props }) => (
    <div style={style}>
      <Table 
        pagination={false} 
        size="small" 
        columns={props.columns || []} 
        dataSource={props.dataSource || []} 
        rowKey="id"
      />
    </div>
  ),
  Card: ({ children, style, title, ...props }) => (
    <Card title={title} style={style} {...props}>
      {children}
    </Card>
  ),
  Select: ({ style, options = [], placeholder, ...props }) => (
    <Select style={style} placeholder={placeholder} {...props}>
      {options.map((opt: { label: string; value: string | number }, idx: number) => (
        <Option key={idx} value={opt.value}>{opt.label}</Option>
      ))}
    </Select>
  ),
  Form: ({ children, style, layout = 'vertical', ...props }) => (
    <Form layout={layout} style={style} {...props}>
      {children}
    </Form>
  ),
  FormItem: ({ children, label, name, ...props }) => (
    <FormItem label={label} name={name} {...props}>
      {children}
    </FormItem>
  ),
  Modal: ({ children, title = '弹窗', visible = false, ...props }) => (
    <Modal title={title} open={visible} {...props}>
      {children}
    </Modal>
  ),
  Divider: ({ text, orientation = 'center', ...props }) => (
    <Divider orientation={orientation} {...props}>{text}</Divider>
  ),
  Space: ({ children, direction = 'horizontal', size = 'small', ...props }) => (
    <Space direction={direction} size={size} {...props}>
      {children}
    </Space>
  ),
  Tag: ({ text, color = 'default', ...props }) => (
    <Tag color={color} {...props}>{text}</Tag>
  )
};

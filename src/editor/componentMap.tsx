import { Button, Input } from 'antd';
import React from 'react';

// 组件映射表
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ComponentMap: Record<string, React.FC<any>> = {
  Page: ({ children, style, ...props }) => <div style={style} {...props}>{children}</div>,
  Container: ({ children, style, ...props }) => <div style={style} {...props}>{children}</div>,
  Button: ({ children, style, ...props }) => <Button style={style} {...props}>{children}</Button>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Input: ({ style, children, ...props }) => <Input style={style} {...props} />,
  Text: ({ text, fontSize, color, ...props }) => <span style={{ fontSize, color }} {...props}>{text}</span>
};

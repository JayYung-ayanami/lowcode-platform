import React, { useState, useEffect, useMemo } from 'react';
import { Card, Statistic, Row, Col, Badge } from 'antd';
import { 
  ThunderboltOutlined, 
  DatabaseOutlined, 
  AppstoreOutlined 
} from '@ant-design/icons';
import { useAppSelector } from '../store/hook';

export const PerformanceMonitor: React.FC<{ visible?: boolean }> = ({ visible = false }) => {
  const page = useAppSelector((state) => state.project.present.page);
  const [renderTime, setRenderTime] = useState<number>(0);

  // 使用 useMemo 计算组件数量，避免在 effect 中 setState
  const componentCount = useMemo(() => {
    const countComponents = (node: typeof page.root): number => {
      let count = 1;
      if (node.children) {
        node.children.forEach(child => {
          count += countComponents(child);
        });
      }
      return count;
    };
    return countComponents(page.root);
  }, [page]);

  // 监听 page 变化，更新渲染时间
  useEffect(() => {
    const startTime = performance.now();
    
    // 使用 setTimeout 异步更新渲染时间
    const timer = setTimeout(() => {
      const endTime = performance.now();
      setRenderTime(Number((endTime - startTime).toFixed(2)));
    }, 0);

    return () => clearTimeout(timer);
  }, [page]);

  if (!visible) return null;

  return (
    <Card 
      size="small" 
      style={{ 
        position: 'fixed', 
        bottom: 20, 
        right: 20, 
        width: 320,
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}
      title={
        <span>
          <ThunderboltOutlined /> 性能监控
        </span>
      }
    >
      <Row gutter={16}>
        <Col span={12}>
          <Statistic
            title="组件数量"
            value={componentCount}
            prefix={<AppstoreOutlined />}
            suffix={
              componentCount > 50 ? 
                <Badge status="warning" /> : 
                <Badge status="success" />
            }
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="渲染时间"
            value={renderTime}
            suffix="ms"
            prefix={<DatabaseOutlined />}
            valueStyle={{ 
              color: renderTime > 100 ? '#cf1322' : '#3f8600' 
            }}
          />
        </Col>
      </Row>
      <div style={{ marginTop: 16, fontSize: 12, color: '#999' }}>
        {componentCount > 100 && (
          <div style={{ color: '#faad14' }}>
            ⚠️ 组件数量较多，建议优化
          </div>
        )}
        {renderTime > 100 && (
          <div style={{ color: '#cf1322' }}>
            ⚠️ 渲染时间较长，可能影响性能
          </div>
        )}
        {componentCount <= 100 && renderTime <= 100 && (
          <div style={{ color: '#52c41a' }}>
            ✓ 性能状态良好
          </div>
        )}
      </div>
    </Card>
  );
};


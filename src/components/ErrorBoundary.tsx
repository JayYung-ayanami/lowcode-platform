import React, { Component, type ReactNode } from 'react';
import { Alert, Button } from 'antd';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      errorInfo
    });

    // 这里可以添加错误上报逻辑（如 Sentry）
    // Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
          <Alert
            message="组件渲染出错"
            description={
              <div>
                <p><strong>错误信息：</strong></p>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '10px', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  {this.state.error?.toString()}
                </pre>
                
                {import.meta.env.DEV && this.state.errorInfo && (
                  <>
                    <p style={{ marginTop: '16px' }}><strong>组件堆栈：</strong></p>
                    <pre style={{ 
                      background: '#f5f5f5', 
                      padding: '10px', 
                      borderRadius: '4px',
                      overflow: 'auto',
                      maxHeight: '300px',
                      fontSize: '12px'
                    }}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </>
                )}

                <Button 
                  type="primary" 
                  onClick={this.handleReset}
                  style={{ marginTop: '16px' }}
                >
                  重新尝试
                </Button>
              </div>
            }
            type="error"
            showIcon
          />
        </div>
      );
    }

    return this.props.children;
  }
}


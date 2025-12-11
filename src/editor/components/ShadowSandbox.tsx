import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface ShadowSandboxProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ShadowSandbox: React.FC<ShadowSandboxProps> = ({ 
  children, 
  className,
  style 
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // 1. 创建 Shadow DOM
    // 检查是否已经存在 shadowRoot (React StrictMode 可能触发两次)
    let root = host.shadowRoot;
    if (!root) {
        root = host.attachShadow({ mode: 'open' });
    }
    setShadowRoot(root);

    // 2. 同步外部样式
    // 这一步非常重要，否则 Antd 和 Tailwind 的样式在 Shadow DOM 内部不生效
    const syncStyles = () => {
        // 清空旧样式 (防止重复)
        // 注意：不要清空 children (React Portal 管理的部分)，只清空我们手动插入的 style
        // 这里简单策略：只追加，实际生产可能需要更精细的 Diff
        const headStyles = document.querySelectorAll('style, link[rel="stylesheet"]');
        headStyles.forEach((node) => {
            // 克隆节点
            root!.appendChild(node.cloneNode(true));
        });
    };

    if (root) {
        syncStyles();
    }

    // 监听外部样式变化（可选，视需求而定）
    // const observer = new MutationObserver(syncStyles);
    // observer.observe(document.head, { childList: true, subtree: true });
    // return () => observer.disconnect();

  }, []);

  return (
    <div
      ref={hostRef}
      className={className}
      style={{ width: '100%', height: '100%', ...style }}
    >
      {shadowRoot && createPortal(
        // 为了防止 body { display: none } 等全局样式影响，
        // 我们在 Shadow DOM 内部再包一层 div 作为"虚拟 body"
        <div className="sandbox-body" style={{ height: '100%', overflow: 'auto' }}>
            {children}
        </div>, 
        shadowRoot as unknown as Element
      )}
    </div>
  );
};


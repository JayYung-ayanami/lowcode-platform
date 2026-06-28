import React from 'react'

/**
 * 自定义渲染组件集合（完全手写，非 Antd 二次封装）。
 * 用于证明引擎可以接入任意第三方 / 自研组件，而不局限于某个 UI 库。
 */

interface ImageProps {
    src?: string
    alt?: string
    width?: number | string
    height?: number | string
    radius?: number
    style?: React.CSSProperties
}

export const LcImage: React.FC<ImageProps> = ({
    src = 'https://picsum.photos/300/180',
    alt = '图片',
    width = 300,
    height = 180,
    radius = 4,
    style,
}) => (
    <img
        src={src}
        alt={alt}
        style={{ width, height, borderRadius: radius, objectFit: 'cover', display: 'block', ...style }}
    />
)

interface LinkProps {
    text?: string
    href?: string
    target?: string
    color?: string
    style?: React.CSSProperties
}

export const LcLink: React.FC<LinkProps> = ({
    text = '链接文字',
    href = 'https://example.com',
    target = '_blank',
    color = '#1677ff',
    style,
}) => (
    <a href={href} target={target} rel="noopener noreferrer" style={{ color, ...style }}>
        {text}
    </a>
)

interface ProgressProps {
    percent?: number
    color?: string
    trackColor?: string
    height?: number
    showInfo?: boolean
    style?: React.CSSProperties
}

/**
 * 纯手写进度条，演示自定义渲染逻辑（含数值钳制、过渡动画）。
 */
export const LcProgress: React.FC<ProgressProps> = ({
    percent = 40,
    color = '#1677ff',
    trackColor = '#f0f0f0',
    height = 10,
    showInfo = true,
    style,
}) => {
    const safePercent = Math.max(0, Math.min(100, Number(percent) || 0))
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', ...style }}>
            <div
                style={{
                    flex: 1,
                    background: trackColor,
                    borderRadius: height,
                    overflow: 'hidden',
                    height,
                }}
            >
                <div
                    style={{
                        width: `${safePercent}%`,
                        height: '100%',
                        background: color,
                        borderRadius: height,
                        transition: 'width 0.3s ease',
                    }}
                />
            </div>
            {showInfo && <span style={{ fontSize: 12, color: '#666', minWidth: 36 }}>{safePercent}%</span>}
        </div>
    )
}

interface HeadingProps {
    text?: string
    level?: 1 | 2 | 3 | 4 | 5
    color?: string
    align?: React.CSSProperties['textAlign']
    style?: React.CSSProperties
}

export const LcHeading: React.FC<HeadingProps> = ({
    text = '标题',
    level = 2,
    color = '#262626',
    align = 'left',
    style,
}) => {
    const Tag = `h${level}` as keyof React.JSX.IntrinsicElements
    return (
        <Tag style={{ color, textAlign: align, margin: 0, ...style }}>{text}</Tag>
    )
}

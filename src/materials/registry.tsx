/* eslint-disable react-refresh/only-export-components -- 这是物料数据注册表，非组件模块 */
import React from 'react'
import { Button, Input, Table, Card, Select, Form, Modal, Divider, Space, Tag } from 'antd'
import type { ComponentType } from '../types/schema'
import type { MaterialMeta } from './types'
import { LcImage, LcLink, LcProgress, LcHeading } from './customComponents'

const { Option } = Select
const { Item: FormItem } = Form

/**
 * 物料注册表：低代码引擎的唯一事实源。
 *
 * 渲染（ComponentMap）、左侧物料面板、右侧属性面板（Setter 协议）、
 * 拖拽默认值、AST 出码，全部从这里派生，新增一个组件只需在此追加一项。
 */
export const materials: MaterialMeta[] = [
    // ============ 容器/根 ============
    {
        type: 'Page',
        name: '页面',
        category: 'layout',
        isContainer: true,
        defaultProps: {},
        setters: [],
        render: ({ children, style, ...props }) => <div style={style} {...props}>{children}</div>,
        codegen: { source: 'html', tag: 'div' },
    },
    // ============ 基础组件 ============
    {
        type: 'Button',
        name: '按钮',
        category: 'basic',
        isContainer: false,
        defaultProps: { children: '新按钮', type: 'default' },
        setters: [
            { key: 'children', label: '按钮文字', setter: 'string' },
            {
                key: 'type', label: '按钮类型', setter: 'select', options: [
                    { label: '默认', value: 'default' },
                    { label: '主要', value: 'primary' },
                    { label: '虚线', value: 'dashed' },
                    { label: '文本', value: 'text' },
                    { label: '链接', value: 'link' },
                ],
            },
            { key: 'danger', label: '危险按钮', setter: 'boolean' },
            { key: 'disabled', label: '禁用', setter: 'boolean' },
        ],
        render: ({ children, style, ...props }) => <Button style={style} {...props}>{children}</Button>,
        codegen: { source: 'antd', textProp: 'children' },
    },
    {
        type: 'Text',
        name: '文本',
        category: 'basic',
        isContainer: false,
        defaultProps: { text: '默认文本', fontSize: '14px', color: '#000000' },
        setters: [
            { key: 'text', label: '文本内容', setter: 'string' },
            { key: 'fontSize', label: '字号', setter: 'string' },
            { key: 'color', label: '颜色', setter: 'color' },
        ],
        render: ({ text, fontSize, color, style, ...props }) => (
            <span style={{ fontSize, color, ...style }} {...props}>{text}</span>
        ),
        codegen: {
            source: 'helper',
            tag: 'Text',
            helperCode:
                'const Text = ({ text, fontSize, color, style }) => (\n' +
                '  <span style={{ fontSize, color, ...style }}>{text}</span>\n' +
                ');',
        },
    },
    {
        type: 'Tag',
        name: '标签',
        category: 'basic',
        isContainer: false,
        defaultProps: { text: '标签', color: 'blue' },
        setters: [
            { key: 'text', label: '标签文字', setter: 'string' },
            {
                key: 'color', label: '颜色', setter: 'select', options: [
                    { label: '蓝色', value: 'blue' },
                    { label: '绿色', value: 'green' },
                    { label: '红色', value: 'red' },
                    { label: '橙色', value: 'orange' },
                    { label: '默认', value: 'default' },
                ],
            },
        ],
        render: ({ text, color = 'default', style, ...props }) => (
            <Tag color={color} style={style} {...props}>{text}</Tag>
        ),
        codegen: { source: 'antd', textProp: 'text' },
    },
    {
        type: 'Divider',
        name: '分割线',
        category: 'basic',
        isContainer: false,
        defaultProps: { text: '分割线', orientation: 'center' },
        setters: [
            { key: 'text', label: '文字', setter: 'string' },
            {
                key: 'orientation', label: '位置', setter: 'select', options: [
                    { label: '左', value: 'left' },
                    { label: '中', value: 'center' },
                    { label: '右', value: 'right' },
                ],
            },
        ],
        render: ({ text, orientation = 'center', style, ...props }) => (
            <Divider orientation={orientation} style={style} {...props}>{text}</Divider>
        ),
        codegen: { source: 'antd', textProp: 'text' },
    },
    // ============ 表单组件 ============
    {
        type: 'Input',
        name: '输入框',
        category: 'form',
        isContainer: false,
        defaultProps: { placeholder: '请输入...' },
        setters: [
            { key: 'placeholder', label: '占位符', setter: 'string' },
            { key: 'disabled', label: '禁用', setter: 'boolean' },
            { key: 'value', label: '默认值', setter: 'string' },
        ],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        render: ({ style, children, ...props }) => <Input style={style} {...props} />,
        codegen: { source: 'antd' },
    },
    {
        type: 'Select',
        name: '下拉框',
        category: 'form',
        isContainer: false,
        defaultProps: {
            placeholder: '请选择',
            options: [
                { label: '选项1', value: '1' },
                { label: '选项2', value: '2' },
                { label: '选项3', value: '3' },
            ],
        },
        defaultStyle: { width: '200px' },
        setters: [
            { key: 'placeholder', label: '占位符', setter: 'string' },
            { key: 'options', label: '选项配置', setter: 'json' },
        ],
        render: ({ style, options = [], placeholder, ...props }) => (
            <Select style={style} placeholder={placeholder} {...props}>
                {options.map((opt: { label: string; value: string | number }, idx: number) => (
                    <Option key={idx} value={opt.value}>{opt.label}</Option>
                ))}
            </Select>
        ),
        codegen: { source: 'antd' },
    },
    {
        type: 'Form',
        name: '表单',
        category: 'form',
        isContainer: true,
        defaultProps: { layout: 'vertical' },
        setters: [
            {
                key: 'layout', label: '布局', setter: 'select', options: [
                    { label: '垂直', value: 'vertical' },
                    { label: '水平', value: 'horizontal' },
                    { label: '行内', value: 'inline' },
                ],
            },
        ],
        render: ({ children, style, layout = 'vertical', ...props }) => (
            <Form layout={layout} style={style} {...props}>{children}</Form>
        ),
        codegen: { source: 'antd' },
    },
    {
        type: 'FormItem',
        name: '表单项',
        category: 'form',
        isContainer: true,
        defaultProps: { label: '表单项', name: 'field' },
        setters: [
            { key: 'label', label: '标签', setter: 'string' },
            { key: 'name', label: '字段名', setter: 'string' },
        ],
        render: ({ children, label, name, style, ...props }) => (
            <FormItem label={label} name={name} style={style} {...props}>{children}</FormItem>
        ),
        codegen: { source: 'helper', tag: 'FormItem', helperCode: 'const FormItem = Form.Item;', helperAntdDeps: ['Form'] },
    },
    // ============ 布局组件 ============
    {
        type: 'Container',
        name: '容器',
        category: 'layout',
        isContainer: true,
        defaultProps: {},
        defaultStyle: {
            border: '1px solid #d9d9d9',
            padding: '20px',
            minHeight: '100px',
            borderRadius: '4px',
            backgroundColor: '#fff',
        },
        setters: [
            { key: 'backgroundColor', label: '背景色', setter: 'color', group: 'style' },
            { key: 'padding', label: '内边距', setter: 'string', group: 'style' },
        ],
        render: ({ children, style, ...props }) => <div style={style} {...props}>{children}</div>,
        codegen: { source: 'html', tag: 'div' },
    },
    {
        type: 'Card',
        name: '卡片',
        category: 'layout',
        isContainer: true,
        defaultProps: { title: '卡片标题' },
        defaultStyle: { width: '100%', marginBottom: '16px' },
        setters: [
            { key: 'title', label: '标题', setter: 'string' },
        ],
        render: ({ children, style, title, ...props }) => (
            <Card title={title} style={style} {...props}>{children}</Card>
        ),
        codegen: { source: 'antd' },
    },
    {
        type: 'Space',
        name: '间距',
        category: 'layout',
        isContainer: true,
        defaultProps: { direction: 'horizontal', size: 'small' },
        setters: [
            {
                key: 'direction', label: '方向', setter: 'select', options: [
                    { label: '水平', value: 'horizontal' },
                    { label: '垂直', value: 'vertical' },
                ],
            },
        ],
        render: ({ children, direction = 'horizontal', size = 'small', style, ...props }) => (
            <Space direction={direction} size={size} style={style} {...props}>{children}</Space>
        ),
        codegen: { source: 'antd' },
    },
    {
        type: 'Table',
        name: '表格',
        category: 'layout',
        isContainer: false,
        defaultProps: {
            columns: [
                { title: '姓名', dataIndex: 'name', key: 'name' },
                { title: '年龄', dataIndex: 'age', key: 'age' },
                { title: '职位', dataIndex: 'job', key: 'job' },
            ],
            dataSource: [
                { id: '1', name: '张三', age: 32, job: '前端开发' },
                { id: '2', name: '李四', age: 28, job: '产品经理' },
            ],
        },
        setters: [
            { key: 'columns', label: '列配置 (Columns)', setter: 'json' },
            { key: 'dataSource', label: '数据源 (DataSource)', setter: 'json' },
        ],
        render: ({ style, ...props }) => (
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
        codegen: { source: 'antd' },
    },
    {
        type: 'Modal',
        name: '弹窗',
        category: 'layout',
        isContainer: true,
        defaultProps: { title: '弹窗标题', visible: false },
        setters: [
            { key: 'title', label: '标题', setter: 'string' },
            { key: 'visible', label: '是否可见', setter: 'boolean' },
        ],
        render: ({ children, title = '弹窗', visible = false, ...props }) => (
            <Modal title={title} open={visible} {...props}>{children}</Modal>
        ),
        codegen: { source: 'antd' },
    },
    // ============ 自定义渲染组件（非 Antd） ============
    {
        type: 'Image',
        name: '图片',
        category: 'advanced',
        isContainer: false,
        defaultProps: { src: 'https://picsum.photos/300/180', alt: '图片', width: 300, height: 180, radius: 4 },
        setters: [
            { key: 'src', label: '图片地址', setter: 'string' },
            { key: 'alt', label: '替代文本', setter: 'string' },
            { key: 'width', label: '宽度', setter: 'number' },
            { key: 'height', label: '高度', setter: 'number' },
            { key: 'radius', label: '圆角', setter: 'number' },
        ],
        render: LcImage,
        codegen: {
            source: 'helper',
            tag: 'Image',
            helperCode:
                'const Image = ({ src, alt, width = 300, height = 180, radius = 4, style }) => (\n' +
                '  <img src={src} alt={alt} style={{ width, height, borderRadius: radius, objectFit: "cover", display: "block", ...style }} />\n' +
                ');',
        },
    },
    {
        type: 'Link',
        name: '超链接',
        category: 'advanced',
        isContainer: false,
        defaultProps: { text: '链接文字', href: 'https://example.com', target: '_blank', color: '#1677ff' },
        setters: [
            { key: 'text', label: '文字', setter: 'string' },
            { key: 'href', label: '地址', setter: 'string' },
            {
                key: 'target', label: '打开方式', setter: 'select', options: [
                    { label: '新窗口', value: '_blank' },
                    { label: '当前窗口', value: '_self' },
                ],
            },
            { key: 'color', label: '颜色', setter: 'color' },
        ],
        render: LcLink,
        codegen: {
            source: 'helper',
            tag: 'Link',
            helperCode:
                'const Link = ({ text, href, target = "_blank", color = "#1677ff", style }) => (\n' +
                '  <a href={href} target={target} rel="noopener noreferrer" style={{ color, ...style }}>{text}</a>\n' +
                ');',
        },
    },
    {
        type: 'Progress',
        name: '进度条',
        category: 'advanced',
        isContainer: false,
        defaultProps: { percent: 40, color: '#1677ff', trackColor: '#f0f0f0', height: 10, showInfo: true },
        setters: [
            { key: 'percent', label: '百分比', setter: 'number' },
            { key: 'color', label: '进度色', setter: 'color' },
            { key: 'trackColor', label: '轨道色', setter: 'color' },
            { key: 'height', label: '高度', setter: 'number' },
            { key: 'showInfo', label: '显示数值', setter: 'boolean' },
        ],
        render: LcProgress,
        codegen: {
            source: 'helper',
            tag: 'Progress',
            helperCode:
                'const Progress = ({ percent = 0, color = "#1677ff", trackColor = "#f0f0f0", height = 10, showInfo = true }) => {\n' +
                '  const p = Math.max(0, Math.min(100, Number(percent) || 0));\n' +
                '  return (\n' +
                '    <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>\n' +
                '      <div style={{ flex: 1, background: trackColor, borderRadius: height, overflow: "hidden", height }}>\n' +
                '        <div style={{ width: p + "%", height: "100%", background: color, borderRadius: height, transition: "width 0.3s ease" }} />\n' +
                '      </div>\n' +
                '      {showInfo && <span style={{ fontSize: 12, color: "#666", minWidth: 36 }}>{p}%</span>}\n' +
                '    </div>\n' +
                '  );\n' +
                '};',
        },
    },
    {
        type: 'Heading',
        name: '标题',
        category: 'advanced',
        isContainer: false,
        defaultProps: { text: '标题', level: 2, color: '#262626', align: 'left' },
        setters: [
            { key: 'text', label: '标题文字', setter: 'string' },
            {
                key: 'level', label: '级别', setter: 'select', options: [
                    { label: 'H1', value: 1 },
                    { label: 'H2', value: 2 },
                    { label: 'H3', value: 3 },
                    { label: 'H4', value: 4 },
                    { label: 'H5', value: 5 },
                ],
            },
            { key: 'color', label: '颜色', setter: 'color' },
            {
                key: 'align', label: '对齐', setter: 'select', options: [
                    { label: '左', value: 'left' },
                    { label: '中', value: 'center' },
                    { label: '右', value: 'right' },
                ],
            },
        ],
        render: LcHeading,
        codegen: {
            source: 'helper',
            tag: 'Heading',
            helperCode:
                'const Heading = ({ text, level = 2, color = "#262626", align = "left", style }) => {\n' +
                '  const Tag = ("h" + level);\n' +
                '  return <Tag style={{ color, textAlign: align, margin: 0, ...style }}>{text}</Tag>;\n' +
                '};',
        },
    },
]

/** 按 type 索引的物料表 */
export const materialMap: Record<string, MaterialMeta> = materials.reduce(
    (acc, m) => {
        acc[m.type] = m
        return acc
    },
    {} as Record<string, MaterialMeta>,
)

/** 运行时渲染映射（兼容原 ComponentMap 用法） */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ComponentMap: Record<string, React.FC<any>> = materials.reduce(
    (acc, m) => {
        acc[m.type] = m.render
        return acc
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {} as Record<string, React.FC<any>>,
)

/** 容器类型集合 */
export const CONTAINER_TYPES: ComponentType[] = materials
    .filter((m) => m.isContainer && m.type !== 'Page')
    .map((m) => m.type)

/** 取某物料的拖拽默认 schema 片段（props + style） */
export const getDefaultComponentData = (type: ComponentType) => {
    const meta = materialMap[type]
    if (!meta) return { props: {}, style: undefined }
    return {
        props: { ...meta.defaultProps },
        style: meta.defaultStyle ? { ...meta.defaultStyle } : undefined,
    }
}

/** 按分类分组的物料（供物料面板使用） */
export const materialsByCategory = materials
    .filter((m) => m.type !== 'Page')
    .reduce(
        (acc, m) => {
            ; (acc[m.category] ||= []).push(m)
            return acc
        },
        {} as Record<MaterialMeta['category'], MaterialMeta[]>,
    )

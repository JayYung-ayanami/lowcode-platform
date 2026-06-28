# LowCode Schema 协议规范 (v1.0.0)

本文件定义本低代码引擎的页面描述协议（Schema）与物料协议（Material），是引擎的"唯一事实源"。
设计上对齐业界主流低代码协议（如阿里 lowcode-engine 的「协议驱动」思想）：**用一份可序列化的 JSON 描述整棵 UI 树，渲染、出码、物料、属性面板均从协议派生**。

## 1. 设计原则

1. **协议驱动**：UI = f(Schema)。任何视图（画布渲染、源码、属性表单）都是 Schema 的纯函数投影。
2. **可序列化**：整个页面可 `JSON.stringify` 导出，跨环境迁移、版本管理、持久化。
3. **可扩展**：新增一个组件 = 在物料注册表追加一项元数据，无需改动渲染器 / 属性面板 / 出码引擎。
4. **版本化**：`PageSchema.version` 标记协议版本，便于跨版本兼容迁移。

## 2. 页面协议 PageSchema

```ts
interface PageSchema {
  version?: string              // 协议版本，如 "1.0.0"
  title: string                 // 页面标题
  root: ComponentSchema         // 组件树根节点（type 通常为 'Page'）
  dataSources?: DataSourceConfig[] // 页面级远程数据源
}
```

## 3. 组件协议 ComponentSchema

```ts
interface ComponentSchema {
  id: string                    // 全局唯一 ID
  type: ComponentType           // 组件类型，对应物料注册表的 key
  name: string                  // 显示名称
  props: Record<string, any>    // 组件属性（支持 {{表达式}}）
  style?: CSSProperties         // 内联样式
  children?: ComponentSchema[]  // 子节点（容器组件）
  events?: Record<string, EventHandler[]> // 事件 → 动作编排
}
```

> 与阿里协议的映射关系：`type` ≈ `componentName`，`props` / `children` / `id` 语义一致。

## 4. 表达式协议

属性值支持 `{{ ... }}` 表达式，运行时由表达式引擎求值，作用域仅暴露 `state`（全局变量）：

| 写法 | 说明 | 结果 |
| --- | --- | --- |
| `{{ state.count }}` | 整值表达式，保留原始类型 | number |
| `{{ state.count + 1 }}` | 支持运算 | number |
| `{{ state.user.name }}` | 成员访问 | string |
| `共 {{ state.list.length }} 项` | 内联字符串插值 | string |

## 5. 事件与动作协议

```ts
interface EventHandler {
  type: 'openModal' | 'link' | 'updateState' | 'setValue' | 'requestApi' | 'script'
  config: Record<string, any>
}
```

| 动作 | config 字段 | 说明 |
| --- | --- | --- |
| `setValue` | `targetId`, `value` | 修改目标组件属性（组件联动） |
| `updateState` | `key`, `value` | 更新全局变量 |
| `openModal` | `title` | 弹窗提示 |
| `link` | `url`, `target` | 跳转链接 |
| `requestApi` | `dataSourceId` | 触发数据源请求并写入变量 |
| `script` | `code` | 在安全沙箱中执行自定义 JS |

## 6. 数据源协议 DataSourceConfig

```ts
interface DataSourceConfig {
  id: string
  name: string
  variableKey: string  // 结果写入的全局变量名，组件通过 {{state.<variableKey>}} 绑定
  url: string
  method: 'GET' | 'POST'
  autoLoad: boolean    // 页面加载时是否自动请求
  mock?: any           // 请求失败 / 离线时的兜底数据
  dataPath?: string    // 响应取值路径，如 "data.list"
}
```

## 7. 物料协议 MaterialMeta（引擎内部）

每个组件在 `src/materials/registry.tsx` 注册一份元数据，引擎据此派生一切：

```ts
interface MaterialMeta {
  type: ComponentType
  name: string
  category: 'basic' | 'form' | 'layout' | 'advanced'
  isContainer: boolean
  defaultProps: Record<string, any>   // 拖入画布默认 props
  defaultStyle?: CSSProperties
  setters: SetterConfig[]             // 属性面板配置器协议（驱动右侧表单）
  render: FC<any>                     // 运行时渲染组件
  codegen: CodegenMeta               // 出码策略（antd / html / helper + textProp）
}
```

### Setter 协议（属性面板）

属性面板不再为每个组件硬编码表单，而是读取 `setters` 动态渲染：

```ts
interface SetterConfig {
  key: string
  label: string
  setter: 'string' | 'number' | 'boolean' | 'color' | 'textarea' | 'select' | 'json'
  options?: { label: string; value: string | number }[]
  group?: 'props' | 'style'  // 作用于 props 还是 style
}
```

### Codegen 协议（出码）

```ts
interface CodegenMeta {
  source: 'antd' | 'html' | 'helper' // 出码来源
  tag?: string                       // 实际标签名
  textProp?: string                  // 该 prop 作为文本子节点输出（如 Button.children）
  helperCode?: string                // helper 组件的定义源码（自动去重注入）
  helperAntdDeps?: string[]          // helper 依赖的 antd 导入（如 FormItem 依赖 Form）
}
```

## 8. 如何新增一个组件

只需一步——在 `src/materials/registry.tsx` 的 `materials` 数组追加一项：

```tsx
{
  type: 'Rate',
  name: '评分',
  category: 'advanced',
  isContainer: false,
  defaultProps: { value: 3 },
  setters: [{ key: 'value', label: '分值', setter: 'number' }],
  render: ({ value }) => <Rate value={value} />,
  codegen: { source: 'antd' },
}
```

物料面板、属性面板、拖拽默认值、出码会自动支持，无需改动其它任何文件。

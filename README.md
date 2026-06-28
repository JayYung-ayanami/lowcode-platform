# React LowCode Engine

一个基于 React + TypeScript 实现的企业级低代码编辑器。
核心功能包括：**协议驱动的物料体系**、可视化组件编排、无限嵌套布局、**安全表达式引擎**、**远程数据源绑定**、组件联动、样式隔离、事件交互配置、AST 源码生成、性能监控以及 Schema 导入/导出。

> 协议规范见 [PROTOCOL.md](./PROTOCOL.md)。整个引擎遵循「协议驱动」设计：渲染、出码、物料面板、属性面板均由一份物料注册表（Material Registry）派生，新增组件只需追加一份元数据。

![React](https://img.shields.io/badge/React-19.x-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Babel](https://img.shields.io/badge/Babel-Generator-yellow)
![Dnd-Kit](https://img.shields.io/badge/Dnd--Kit-Core-green)
![Vitest](https://img.shields.io/badge/Vitest-Testing-green)

## 核心特性

0.  **协议驱动架构 (Protocol-Driven)** ⭐:
    *   **唯一事实源**: 所有组件在 `materials/registry` 注册一份元数据（默认值、Setter 协议、渲染器、出码策略）。
    *   **全链路派生**: 物料面板、属性面板、拖拽默认值、AST 出码全部由注册表自动派生，新增组件 0 改动其它文件。
    *   **Setter 协议**: 右侧属性面板不再为每个组件硬编码 if/else 表单，而是读取 `setters` 协议动态渲染控件。

1.  **所见即所得 (WYSIWYG)**: 
    *   左侧物料区提供 **17+ 组件**，含 **4 个完全手写的自定义组件**（Image / Link / Progress / Heading，非 Antd 二次封装），证明引擎可接入任意自研物料。
    *   支持**无限层级嵌套**，Container/Card/Form 等布局组件内可继续放置子组件。
    *   支持画布内组件的自由拖拽排序与跨层级移动。

2.  **安全表达式引擎 + 远程数据源 (Expression & DataSource)** ⭐:
    *   **表达式引擎**: 属性支持 `{{ state.count + 1 }}`、`{{ state.user.name }}`、内联插值等，受控作用域求值。
    *   **远程数据源**: 可配置接口（URL/method/取值路径），页面加载自动请求或由事件触发，结果写入全局变量供组件 `{{state.xxx}}` 绑定渲染；内置 **mock 兜底**，离线也能演示"接口请求 → 渲染"链路。

3.  **组件联动与事件系统 (Event Bus)**:
    *   **动作编排**: 支持 `setValue` (修改属性)、`updateState` (更新变量)、`requestApi` (请求接口)、`openModal` (弹窗)、`link` (跳转)、`script` (脚本) 等原子动作。
    *   **实时联动**: 实现了组件间的通信机制，例如：点击按钮 -> 自动填充表单数据。
    *   **JS 脚本增强**: 支持编写自定义 JavaScript 脚本，通过**双重防护沙箱**安全执行。

3.  **样式隔离 (Style Isolation)**:
    *   内置 **Shadow DOM** 容器，确保画布内的组件样式互不干扰，完美模拟真实运行环境。
    *   解决了 Shadow DOM 内样式丢失与 React Portal 事件冒泡的兼容性难题。

4.  **AST 级源码生成 (Codegen)**:
    *   **深度定制**: 不仅仅是字符串拼接，而是基于 `@babel/types` 构建 AST (抽象语法树)。
    *   **代码预览**: 实时生成标准的 React + Antd 源代码，支持一键复制，生成的代码可直接在标准工程中运行。

5.  **时间旅行 (Time Travel)**:
    *   基于 `redux-undo` 实现完整的撤销/重做机制。
    *   **快捷键支持**: 支持 `Ctrl+Z` / `Cmd+Z` 撤销，`Ctrl+Shift+Z` 重做，提供类原生应用的编辑体验。
    *   **智能分组**: 自动合并连续的滑块拖动或文本输入，防止历史记录爆炸，提供丝滑的编辑体验。

6.  **性能监控 (Performance Monitor)** : 
    *   实时显示组件数量和渲染时间
    *   自动检测性能瓶颈并提供优化建议
    *   可视化性能指标面板，支持一键开关

7.  **Schema 导入/导出** :
    *   支持将项目导出为 JSON Schema 文件
    *   支持从 JSON 文件导入现有项目
    *   便于项目备份、版本管理和跨环境迁移

8.  **错误边界 (Error Boundary)** :
    *   全局错误捕获机制，防止组件崩溃导致整个应用白屏
    *   友好的错误提示界面
    *   开发环境下显示详细错误堆栈，快速定位问题

## 组件库

### 基础组件（4个）
- **Button**（按钮）
- **Text**（文本）
- **Tag**（标签）
- **Divider**（分割线）

### 表单组件（4个）
- **Input**（输入框）
- **Select**（下拉框）
- **Form**（表单）
- **FormItem**（表单项）

### 布局组件（5个）
- **Container**（容器）
- **Card**（卡片）
- **Space**（间距）
- **Table**（表格）
- **Modal**（弹窗）

### 高级组件（4个，**完全手写，非 Antd 封装**）
- **Image**（图片）
- **Link**（超链接）
- **Progress**（进度条，含数值钳制与过渡动画）
- **Heading**（多级标题 H1–H5）

## 技术栈

*   **React 19 + TypeScript**: 核心开发框架，确保类型安全。
*   **Redux Toolkit + Redux-Undo**: 全局状态管理，支持高阶的时间旅行能力。
*   **@dnd-kit**: 新一代 Headless 拖拽库，解决了复杂嵌套场景下的事件冲突问题。
*   **Shadow DOM**: 用于实现编辑器画布的样式隔离。
*   **Babel (@babel/types / generator / parser)**: 出码引擎将 Schema 编译为 JSX；parser 用于沙箱脚本的静态安全分析。
*   **Ant Design 6.x**: 编辑器 UI 组件库。
*   **Vitest + Testing Library**: 单元测试与组件测试框架。
*   **IndexedDB (idb)**: 本地持久化存储，支持自动保存。

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 运行测试
npm run test

# 4. 构建生产版本
npm run build

# 5. 预览构建结果
npm run preview
```

## 测试覆盖

项目包含 **68 个单元/集成测试（8 个测试文件，全部通过）**：

- Redux Store 测试（projectSlice.test.ts）
- 代码生成测试（codegen.test.ts）—— 按需导入、helper 去重、文本子节点、自定义组件出码
- 组件渲染测试（RenderComponent.test.tsx）—— 含自定义组件、表达式运算
- 沙箱安全性测试（sandbox.test.ts）—— 含 constructor/__proto__/this/Function 等逃逸拦截
- 表达式引擎测试（expression.test.ts）
- 数据源测试（dataSource.test.ts）—— 含成功、mock 兜底、取值路径
- 物料注册表测试（registry.test.ts）
- 树工具测试（treeUtils.test.ts）

```bash
# 运行所有测试
npm run test

# 运行测试并显示覆盖率
npm run test -- --coverage
```

## 实现细节与难点

### 1. 复杂嵌套拖拽系统
项目最大的难点在于处理**无限嵌套容器**的拖拽交互。
*   **架构**: 放弃了传统的 `react-dnd`，选用 `@dnd-kit` 的 `SortableContext`。
*   **策略**: 采用了"光标探测"策略。在 `handleDragOver` 阶段，通过判断 `over.data.current` 的元数据（`isContainer`, `isEmptyContainer`, `isContainerEnd`），精准识别用户是想"排序"、"插入空容器"还是"追加到容器底部"，完美解决了嵌套热区冲突的问题。
*   **性能优化**: 使用 `useMemo` 和 `React.memo` 减少不必要的重渲染，采用 `involvedIds` 精准控制受拖拽影响的组件范围。

### 2. 组件联动机制 + 表达式引擎 + 数据源
为了实现类似"点击A修改B"以及"接口数据驱动渲染"的交互：
*   **Schema 设计**: 在 `ComponentSchema` 中设计了 `events` 字段，采用 `{ type, config }` 的结构存储动作，支持多动作编排。
*   **运行时**: `RenderComponent` 将事件委托给可单测的 `actionRunner`，通过 Redux Action 动态分发，实现低耦合通信。
*   **表达式引擎** (`utils/expression`): 支持 `{{ state.x + 1 }}`、成员访问、内联插值，作用域仅暴露 `state`，避免污染。
*   **远程数据源** (`utils/dataSource` + `useDataSources`): 配置接口后自动/手动请求，结果写入全局变量，组件通过 `{{state.xxx}}` 绑定；失败回退 mock，离线可用。

### 3. 双重防护安全沙箱
脚本动作在「静态 AST 分析 + 运行时 Proxy 白名单」双重防护下执行：
*   **静态分析（主防线）**: 用 `@babel/parser` 解析脚本，遍历 AST 拒绝危险标识符（`Function`/`eval`/`window`…）、对 `constructor`/`__proto__`/`prototype` 的成员访问，以及 `this`，从根上挡住 `({}).constructor.constructor('return window')()` 这类经典逃逸。
*   **运行时 Proxy（纵深防御）**: 配合 `with` 接管全部变量查找，拦截裸危险标识符，仅放行白名单全局对象。
*   **诚实边界**: 浏览器内绝对安全需 iframe(sandbox)/Web Worker/ShadowRealm 隔离；本方案是不引入额外运行时隔离层前提下的强约束工程实现。

### 4. 协议驱动的 AST 出码引擎
区别于简单的正则替换，本项目实现了一个微型编译器，且**出码策略由物料注册表驱动**：
*   **Input**: 组件树 JSON Schema。
*   **Process**: 深度优先遍历 Schema，按注册表 `codegen` 元信息区分 antd 具名导入 / helper 定义 / 原生标签，使用 `@babel/types` 动态构建 AST。
*   **Output**: 使用 `@babel/generator` 生成源码——**按需导入**（只 import 用到的组件）、**helper 自动去重**、`text` 属性正确渲染为子节点，生成的代码可直接在标准工程运行。

### 4. 持久化与自动保存
*   使用 IndexedDB 替代 localStorage，支持存储大型项目（> 5MB）。
*   自定义 Hook `useAutoSave` 实现 1 秒防抖的自动保存机制。
*   页面刷新后自动恢复上次编辑状态。

## 项目亮点

**架构设计**：协议驱动（Material Registry / Setter / Codegen 协议）、Redux 时间旅行、错误边界、性能监控  
**技术深度**：协议驱动 AST 出码、Shadow DOM 隔离、AST 静态分析 + Proxy 双重沙箱、表达式引擎、远程数据源  
**工程化**：TypeScript 全覆盖、Vitest 68 测试全绿、ESLint 0 警告、可一键构建  
**用户体验**：拖拽动画、自动保存、快捷键支持、自定义物料  

## 目录结构（核心）

```
src/
├─ materials/            # ⭐ 物料协议层（唯一事实源）
│  ├─ registry.tsx       #   组件注册表：元数据 + 渲染 + Setter + 出码策略
│  ├─ types.ts           #   MaterialMeta / SetterConfig / CodegenMeta 协议
│  └─ customComponents.tsx #  手写自定义组件（Image/Link/Progress/Heading）
├─ utils/
│  ├─ codegen.ts         # 协议驱动的 AST 出码引擎
│  ├─ expression.ts      # 安全表达式引擎
│  ├─ sandbox.ts         # AST 静态分析 + Proxy 双重防护沙箱
│  ├─ dataSource.ts      # 远程数据源（含 mock 兜底）
│  └─ actionRunner.ts    # 事件动作编排执行器
├─ editor/               # 编辑器（画布、面板、拖拽）
├─ hooks/                # useAutoSave / useDataSources
└─ store/                # Redux Toolkit + redux-undo
```


*Created by [JayYung-ayanami]*  

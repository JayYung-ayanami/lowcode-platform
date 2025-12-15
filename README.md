# React LowCode Engine

一个基于 React + TypeScript 实现的企业级低代码编辑器。
核心功能包括：可视化组件编排、无限嵌套布局、组件联动、样式隔离、事件交互配置、AST 源码生成、性能监控以及 Schema 导入/导出。

![React](https://img.shields.io/badge/React-19.x-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Babel](https://img.shields.io/badge/Babel-Generator-yellow)
![Dnd-Kit](https://img.shields.io/badge/Dnd--Kit-Core-green)
![Vitest](https://img.shields.io/badge/Vitest-Testing-green)

## 核心特性

1.  **所见即所得 (WYSIWYG)**: 
    *   左侧物料区提供 **13+ 组件**（Button, Input, Text, Container, Table, Card, Form, Select, Modal 等）可无缝拖入画布。
    *   支持**无限层级嵌套**，Container/Card/Form 等布局组件内可继续放置子组件。
    *   支持画布内组件的自由拖拽排序与跨层级移动。

2.  **组件联动与事件系统 (Event Bus)**:
    *   **动作编排**: 支持 `setValue` (修改属性)、`updateState` (更新变量)、`openModal` (弹窗) 等原子动作。
    *   **实时联动**: 实现了组件间的通信机制，例如：点击按钮 -> 自动填充表单数据。
    *   **JS 脚本增强**: 支持编写自定义 JavaScript 脚本，通过沙箱环境安全执行。

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

## 技术栈

*   **React 19 + TypeScript**: 核心开发框架，确保类型安全。
*   **Redux Toolkit + Redux-Undo**: 全局状态管理，支持高阶的时间旅行能力。
*   **@dnd-kit**: 新一代 Headless 拖拽库，解决了复杂嵌套场景下的事件冲突问题。
*   **Shadow DOM**: 用于实现编辑器画布的样式隔离。
*   **Babel (@babel/generator)**: 用于将 JSON Schema 转换为高质量的 JSX 代码。
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

项目包含完善的单元测试和集成测试：

- Redux Store 测试（projectSlice.test.ts）
- 代码生成测试（codegen.test.ts）
- 组件渲染测试（RenderComponent.test.tsx）
- 沙箱安全性测试（sandbox.test.ts）

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

### 2. 组件联动机制
为了实现类似"点击A修改B"的交互：
*   **Schema 设计**: 在 `ComponentSchema` 中设计了 `events` 字段，采用 `{ type: 'setValue', targetId: 'xxx', value: '...' }` 的结构存储动作。
*   **运行时**: 在 `RenderComponent` 中实现了事件拦截器，通过 Redux 的 `updateComponentProps` Action 动态分发状态更新，实现了低耦合的组件通信。
*   **沙箱隔离**: 使用 Proxy + with 语句构建安全沙箱，防止恶意脚本访问 window/document/localStorage 等危险对象。

### 3. 基于 AST 的出码引擎
区别于简单的正则替换，本项目实现了一个微型编译器：
*   **Input**: 组件树 JSON Schema。
*   **Process**: 深度优先遍历 Schema，使用 `@babel/types` 动态构建 AST 节点（JSXElement, JSXAttribute）。
*   **Output**: 使用 `@babel/generator` 生成格式化良好、符合 ESLint 规范的 React 源代码。

### 4. 持久化与自动保存
*   使用 IndexedDB 替代 localStorage，支持存储大型项目（> 5MB）。
*   自定义 Hook `useAutoSave` 实现 1 秒防抖的自动保存机制。
*   页面刷新后自动恢复上次编辑状态。

## 项目亮点

**技术深度**：AST 代码生成、Shadow DOM 隔离、JS 沙箱  
**架构设计**：Redux 时间旅行、错误边界、性能监控  
**工程化**：TypeScript 全覆盖、Vitest 测试、ESLint 规范  
**用户体验**：拖拽动画、自动保存、快捷键支持


*Created by [JayYung-ayanami]*  

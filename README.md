# React LowCode Engine

一个基于 React + TypeScript 实现的企业级低代码编辑器。
核心功能包括：可视化组件编排、无限嵌套布局、组件联动、样式隔离、事件交互配置以及 AST 源码生成。

![React](https://img.shields.io/badge/React-18.x-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Babel](https://img.shields.io/badge/Babel-Generator-yellow)
![Dnd-Kit](https://img.shields.io/badge/Dnd--Kit-Core-green)

## 核心特性

1.  **所见即所得 (WYSIWYG)**: 
    *   左侧物料区的组件（Button, Input, Text, Container, **Table**）可无缝拖入画布。
    *   支持**无限层级嵌套**，Container 组件内可继续放置子组件。
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

## 技术栈

*   **React 18 + TypeScript**: 核心开发框架，确保类型安全。
*   **Redux Toolkit + Redux-Undo**: 全局状态管理，支持高阶的时间旅行能力。
*   **@dnd-kit**: 新一代 Headless 拖拽库，解决了复杂嵌套场景下的事件冲突问题。
*   **Shadow DOM**: 用于实现编辑器画布的样式隔离。
*   **Babel (@babel/generator)**: 用于将 JSON Schema 转换为高质量的 JSX 代码。
*   **Ant Design**: 编辑器 UI 组件库。

## 运行项目

```bash
# 1. 安装依赖
npm install

# 2. 启动本地服务
npm run dev

# 3. 构建产物
npm run build
```

## 实现细节与难点

### 1. 复杂嵌套拖拽系统
项目最大的难点在于处理**无限嵌套容器**的拖拽交互。
*   **架构**: 放弃了传统的 `react-dnd`，选用 `@dnd-kit` 的 `SortableContext`。
*   **策略**: 采用了“光标探测”策略。在 `handleDragOver` 阶段，通过判断 `over.data.current` 的元数据（`isContainer`, `isEmptyContainer`, `isContainerEnd`），精准识别用户是想“排序”、“插入空容器”还是“追加到容器底部”，完美解决了嵌套热区冲突的问题。

### 2. 组件联动机制
为了实现类似“点击A修改B”的交互：
*   **Schema 设计**: 在 `ComponentSchema` 中设计了 `events` 字段，采用 `{ type: 'setValue', targetId: 'xxx', value: '...' }` 的结构存储动作。
*   **运行时**: 在 `RenderComponent` 中实现了事件拦截器，通过 Redux 的 `updateComponentProps` Action 动态分发状态更新，实现了低耦合的组件通信。

### 3. 基于 AST 的出码引擎
区别于简单的正则替换，本项目实现了一个微型编译器：
*   **Input**: 组件树 JSON Schema。
*   **Process**: 深度优先遍历 Schema，使用 `@babel/types` 动态构建 AST 节点（JSXElement, JSXAttribute）。
*   **Output**: 使用 `@babel/generator` 生成格式化良好、符合 ESLint 规范的 React 源代码。

---
*Created by [JayYung-ayanami]*

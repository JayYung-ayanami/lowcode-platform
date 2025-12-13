# React LowCode Engine

一个基于 React + TypeScript 实现的企业级低代码编辑器。
核心功能包括：可视化组件编排、嵌套布局、事件交互配置、安全沙箱运行以及 AST 源码生成。

![React](https://img.shields.io/badge/React-18.x-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Babel](https://img.shields.io/badge/Babel-Generator-yellow)
![Dnd-Kit](https://img.shields.io/badge/Dnd--Kit-Core-green)

## 核心特性

1.  **所见即所得 (WYSIWYG)**: 
    *   左侧物料区的组件（Button, Input, Text, Container）可无缝拖入画布。
    *   支持**无限层级嵌套**，Container 组件内可继续放置子组件。
    *   支持画布内组件的自由拖拽排序与跨层级移动。

2.  **可视化事件编排 (Event System)**:
    *   支持为组件绑定 `onClick`, `onChange` 等生命周期事件。
    *   **低代码动作**: 内置“弹窗提示”、“页面跳转”、“更新变量”等原子动作。
    *   **JS 脚本增强**: 支持编写自定义 JavaScript 脚本，通过沙箱环境安全执行。

3.  **AST 级源码生成 (Codegen)**:
    *   **深度定制**: 不仅仅是字符串拼接，而是基于 `@babel/types` 构建 AST (抽象语法树)。
    *   **代码预览**: 实时生成标准的 React + Antd 源代码，支持一键复制，生成的代码可直接在标准工程中运行。

4.  **安全沙箱 (Sandbox)**:
    *   内置 JavaScript 沙箱环境 (`Proxy` + `with`)。
    *   支持黑名单机制（拦截 `window`, `document` 等访问），防止用户脚本污染全局环境或导致编辑器崩溃。

5.  **时间旅行 (Time Travel)**:
    *   基于 `redux-undo` 实现完整的撤销/重做机制。
    *   支持历史记录的分组（Group）与过滤（Filter），提供工业级的编辑体验。

## 技术栈

*   **React 18 + TypeScript**: 核心开发框架，确保类型安全。
*   **Redux Toolkit**: 全局状态管理（Slice 模式），配合 `nodeMap` 索引优化查找性能。
*   **@dnd-kit**: 新一代 Headless 拖拽库，解决了复杂嵌套场景下的事件冲突问题。
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

### 2. 安全沙箱机制
为了支持用户编写自定义脚本，同时保证编辑器的安全性：
*   **实现**: 创建了一个 `executeScript` 执行器。
*   **原理**: 利用 ES6 `Proxy` 拦截变量访问，配合 `with` 语法构建闭包作用域。
*   **防护**: 显式拦截了对 `window`, `localStorage` 等敏感全局对象的访问，仅暴露 `console`, `Math` 以及当前上下文变量（`state`, `dispatch`）。

### 3. 基于 AST 的出码引擎
区别于简单的正则替换，本项目实现了一个微型编译器：
*   **Input**: 组件树 JSON Schema。
*   **Process**: 深度优先遍历 Schema，使用 `@babel/types` 动态构建 AST 节点（JSXElement, JSXAttribute）。
*   **Output**: 使用 `@babel/generator` 生成格式化良好、符合 ESLint 规范的 React 源代码。

---
*Created by [JayYung-ayanami]*

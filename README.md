# React LowCode Engine

一个基于 React + TypeScript 实现的低代码编辑器 Demo。
核心功能包括：组件拖拽、嵌套布局、属性配置、撤销重做以及出码能力。

![React](https://img.shields.io/badge/React-18.x-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

## 功能演示

1.  **组件拖拽**: 左侧物料区的组件可以拖入中间画布。
2.  **嵌套布局**: 支持 `Container` 组件，可以将按钮、输入框等拖入容器内部（基于树形递归渲染）。
3.  **画布排序**: 画布内的组件支持自由上下拖拽排序。
4.  **撤销/重做**: 误操作可以随时回退（基于 Redux 历史记录栈）。
5.  **一键出码**: 能够将当前的画布内容生成标准的 React + Antd 源代码。

## 技术栈

*   **React 18 + TypeScript**: 核心开发框架。
*   **Redux Toolkit**: 全局状态管理（使用 Slice 模式）。
*   **@dnd-kit**: 负责拖拽交互（Core + Sortable），相比 React-DnD 性能更好，API 更现代。
*   **redux-undo**: 处理撤销重做逻辑。
*   **Ant Design**: 用于构建编辑器本身的 UI。

## 运行项目

```bash
# 安装依赖
npm install

# 启动本地服务
npm run dev
```

## 实现细节与难点

### 1. 嵌套拖拽的实现
项目最大的难点在于如何让 Container 组件既能被排序，又能接收其他组件。
*   **方案**: 采用了递归渲染组件树的方式。每个 `Container` 组件内部都维护了一个独立的 `SortableContext`。
*   **交互**: 在 `handleDragEnd` 中，通过判断 `over.data.current.isContainer` 属性，来区分是“排序”还是“放入容器”，从而解决了多层级拖拽的事件冲突问题。

### 2. 状态管理设计
没有采用扁平化数据结构，而是直接设计了树形 Schema (`Page -> Root -> Children[]`)。
*   **优势**: 虽然更新逻辑稍微复杂（需要递归查找），但对组件的渲染和出码逻辑更自然，符合 React 的组件树直觉。
*   **优化**: 为了实现 Undo/Redo，使用了 `redux-undo` 高阶 Reducer，并在 store 配置中过滤掉了 `setSelectedId` 等无关动作，保证了用户体验的流畅性。

### 3. 代码生成器 (Compiler)
编写了一个轻量级的遍历器 (`src/utils/codegen.ts`)。
*   它会深度优先遍历当前的 JSON Schema。
*   根据组件类型映射为对应的 JSX 标签，并自动处理 Props 的类型转换（如将 JSON 对象转为 `style={{...}}` 字符串）。

---
*Created by [JayYung-ayanami]*

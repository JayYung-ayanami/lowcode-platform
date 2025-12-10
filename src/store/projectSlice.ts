import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { PageSchema, ComponentSchema } from '../types/schema'
import { initialPage } from '../mock'

/** 项目的全局状态定义 */
interface ProjectState {
    /** 当前页面的完整结构数据 */
    page: PageSchema
    /** 当前选中的组件ID，用于属性面板显示对应配置和画布高亮 */
    selectedId: string | null
}

const initialState: ProjectState = {
    page: initialPage,
    selectedId: null
}

/**
 * 辅助函数：在组件树中递归查找指定ID的节点及其父节点
 * 
 * @param currentNode 当前正在搜索的节点（通常从树根page.root开始）
 * @param targetId 要查找的目标组件ID
 * @param parent 当前节点的父节点（仅用于递归传递，外部调用时无需传入）
 * @returns 包含目标节点和其父节点的对象，如果未找到则返回null（如果找到的是根节点，parent为null）
 */
function findNodeWithParent(
    currentNode: ComponentSchema,
    targetId: string,
    parent: ComponentSchema | null = null // 当前节点的父节点（初始调用时根节点没有父节点，所以是null）
): { node: ComponentSchema; parent: ComponentSchema | null } | null { // 返回值：要么找到对象，要么null

    // 递归终止条件1：如果当前节点就是目标节点，直接返回包含当前节点和其父节点的对象
    if (currentNode.id === targetId) {
        return { node: currentNode, parent }
    }

    // 递归过程：遍历当前节点的所有子节点，递归调用findNodeWithParent，直到找到目标节点或遍历完所有子节点
    if (currentNode.children) {
        // 遍历当前节点的所有子节点
        for (const child of currentNode.children) {
            // 把当前节点（currentNode）作为父节点传给下一次查找
            const result = findNodeWithParent(child, targetId, currentNode)
            // 遍历终止条件2：如果在子树里找到了结果，就直接逐层向上返回这个结果
            if (result) return result
        }
    }

    // 递归终止条件3： 如果遍历完所有子节点，仍然没有找到目标节点，返回null表示未找到
    return null
}

export const projectSlice = createSlice({
    /**
     * Slice名称
     * 用于生成Action Type的前缀，例如'project/setPageTitle'
     * 在Redux DevTools中可以清晰地区分不同模块的Action
     */
    name: 'project',

    /**
     * 初始状态
     * 应用启动时Store中的默认数据
     */
    initialState,

    /**
     * Reducers定义
     * 包含所有修改State的逻辑
     * 这里的每个方法都会自动生成一个同名的Action Creator
     * 内部使用Immer库，允许直接修改state对象（如state.page.title = '新标题'）
     */
    reducers: {
        setPageTitle: (state, action: PayloadAction<string>) => {
            state.page.title = action.payload
        },

        setSelectedId: (state, action: PayloadAction<string | null>) => {
            state.selectedId = action.payload
        },

        /**
         * 添加组件到页面树中
         * @param component 要添加的组件对象
         * @param parentId 父组件ID，可选，默认为根节点
         * @param insertAtIndex 插入位置索引，可选，默认为末尾
         */
        addComponent: (state, action: PayloadAction<{ component: ComponentSchema; parentId?: string; insertAtIndex?: number }>) => {
            const { component, parentId, insertAtIndex } = action.payload

            // 定义递归查找并插入的内部函数
            const addRecursive = (node: ComponentSchema): boolean => {
                // 找到了目标父节点
                if (node.id === (parentId || 'root')) {
                    // 确保children数组存在
                    node.children = node.children || []
                    // 根据insertAtIndex决定插入位置
                    if (insertAtIndex !== undefined && insertAtIndex >= 0) {
                        // 在指定索引处插入
                        node.children.splice(insertAtIndex, 0, component)
                    } else {
                        // 默认追加到末尾
                        node.children.push(component)
                    }
                    // 插入成功，停止递归
                    return true 
                }
                // 没找到，继续在子节点中递归查找
                if (node.children) {
                    for (const child of node.children) {
                        // 如果在子树中插入成功，直接逐层返回true
                        if (addRecursive(child)) return true
                    }
                }
                // 当前分支未找到目标父节点
                return false
            }

            // 从根节点开始执行递归
            addRecursive(state.page.root)
        },

        /**
         * 更新指定组件的属性
         * @param id 要更新的组件ID
         * @param props 要更新的属性对象
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateComponentProps: (state, action: PayloadAction<{ id: string; props: any }>) => {
            const { id, props } = action.payload
            
            // 定义递归更新函数
            const updateRecursive = (node: ComponentSchema) => {
                // 找到了目标组件
                if (node.id === id) {
                    // 合并新旧属性
                    node.props = { ...node.props, ...props }
                    // 更新成功，停止递归
                    return true
                }
                // 没找到，继续在子节点中递归查找
                if (node.children) {
                    for (const child of node.children) {
                        // 如果在子树中找到并更新成功，直接返回true
                        if (updateRecursive(child)) return true
                    }
                }
                // 当前分支没找到
                return false
            }
            // 从根节点开始执行递归
            updateRecursive(state.page.root)
        },

        /**
         * 删除指定组件
         * @param id 要删除的组件ID
         */
        deleteComponent: (state, action: PayloadAction<string>) => {
            const id = action.payload

            // 定义递归删除函数
            // 这里需要传入parent，因为删除一个节点必须操作它的父节点
            const deleteRecursive = (node: ComponentSchema, parent: ComponentSchema | null) => {
                // 找到了要删除的目标组件
                if (node.id === id) {
                    // 确保父节点存在且有children数组
                    if (parent && parent.children) {
                        // 核心删除逻辑：使用filter创建一个不包含该ID的新数组
                        parent.children = parent.children.filter(child => child.id !== id)
                        // 删除成功，停止递归
                        return true
                    }
                }

                // 没找到，继续在子节点中递归查找
                if (node.children) {
                    for (const child of node.children) {
                        // 递归查找，这里把自己作为parent传下去
                        if (deleteRecursive(child, node)) return true
                    }
                }
                // 当前分支没找到
                return false
            }

            // 从根节点开始执行递归，根节点的parent是null
            deleteRecursive(state.page.root, null)

            // 善后处理：如果被删除的组件当前正被选中，则取消选中状态
            // 防止右侧属性面板显示一个不存在组件的信息
            if (state.selectedId === id) {
                state.selectedId = null
            }
        },

        /**
         * 调整同一容器内子组件的顺序（拖拽排序）
         * @param parentId 父组件ID（排序发生在这个容器内部）
         * @param oldIndex 组件原本的位置索引
         * @param newIndex 组件拖拽后的新位置索引
         */
        reorderComponents: (state, action: PayloadAction<{ parentId: string; oldIndex: number; newIndex: number }>) => {
            const { parentId, oldIndex, newIndex } = action.payload

            const reorderRecursive = (node: ComponentSchema): boolean => {
                // 找到了发生排序的父容器
                if (node.id === parentId) {
                    // 防御性检查：确保children存在，且索引没有越界
                    if (!node.children || oldIndex < 0 || newIndex < 0 || oldIndex >= node.children.length || newIndex >= node.children.length) {
                        // 索引越界，停止递归，不做任何排序操作
                        return true
                    }

                    // 核心排序逻辑：移动数组元素
                    // 把元素从旧位置拿出来（splice返回被删除元素的数组）
                    const [removed] = node.children.splice(oldIndex, 1)
                    // 把拿出来的元素插到新位置
                    node.children.splice(newIndex, 0, removed)
                    // 排序成功，停止递归
                    return true
                }

                // 没找到，继续在子节点中递归查找
                if (node.children) {
                    for (const child of node.children) {
                        // 在子树中找到并排序成功，停止递归
                        if (reorderRecursive(child)) return true
                    }
                }

                // 当前分支没找到
                return false
            }

            // 从根节点开始执行递归
            reorderRecursive(state.page.root)
        },

        /**
         * 将组件移动到另一个父容器中（跨容器拖拽）
         * 涉及三个原子操作：查找、删除、插入
         * @param componentId 被移动的组件ID
         * @param newParentId 新父容器ID
         * @param newIndex 在新容器中的插入位置索引
         */
        moveComponentToNewParent: (state, action: PayloadAction<{ componentId: string; newParentId: string; newIndex: number }>) => {
            const { componentId, newParentId, newIndex } = action.payload

            // 找到要移动的组件和它的旧父节点
            const activeResult = findNodeWithParent(state.page.root, componentId)
            // 如果没找到组件或者组件没有父节点（比如它是根节点），则无法移动，直接退出
            if (!activeResult || !activeResult.parent) return

            // 解构出组件节点和它的旧父节点
            const { node: activeNode, parent: oldParent } = activeResult

            // 从旧父节点中删除该组件
            if (oldParent.children) {
                // 使用filter过滤掉该组件，创建一个不包含该组件的新数组
                oldParent.children = oldParent.children.filter(c => c.id !== componentId)
            }

            // 找到新父节点并将该组件插入进去
            const insertRecursive = (node: ComponentSchema): boolean => {
                // 找到了目标新父节点
                if (node.id === newParentId) {
                    // 确保children数组存在
                    node.children = node.children || []
                    // 将刚才“暂存”的activeNode插入到指定位置
                    node.children.splice(newIndex, 0, activeNode)
                    // 移动完成，停止递归
                    return true
                }

                // 没找到，继续在子节点中递归查找
                if (node.children) {
                    for (const child of node.children) {
                        // 在子树中找到并插入成功，停止递归
                        if (insertRecursive(child)) return true
                    }
                }

                // 当前分支没找到
                return false
            }

            // 从根节点开始执行递归
            insertRecursive(state.page.root)
        },

        /**
         * 重置项目（清空画布）
         * 将 page 状态恢复到初始值
         */
        resetProject: (state) => {
            state.page = initialPage
            state.selectedId = null
        }
    }
})

export const { 
    setPageTitle, 
    setSelectedId, 
    updateComponentProps, 
    addComponent, 
    deleteComponent, 
    reorderComponents,
    moveComponentToNewParent,
    resetProject
} = projectSlice.actions
export default projectSlice.reducer
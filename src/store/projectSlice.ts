import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { type PageSchema, type ComponentSchema } from '../types/schema'
import { initialPage } from '../mock'

interface ProjectState {
    page: PageSchema
    selectedId: string | null
}

const initialState: ProjectState = {
    page: initialPage,
    selectedId: null
}

// 辅助函数：在树中查找节点及其父节点
function findNodeWithParent(
    root: ComponentSchema,
    targetId: string,
    parent: ComponentSchema | null = null
): { node: ComponentSchema; parent: ComponentSchema | null } | null {
    if (root.id === targetId) {
        return { node: root, parent }
    }
    if (root.children) {
        for (const child of root.children) {
            const result = findNodeWithParent(child, targetId, root)
            if (result) return result
        }
    }
    return null
}

export const projectSlice = createSlice({
    name: 'project',
    initialState,
    reducers: {
        setPageTitle: (state, action: PayloadAction<string>) => {
            state.page.title = action.payload
        },
        setSelectedId: (state, action: PayloadAction<string | null>) => {
            state.selectedId = action.payload
        },
        addComponent: (state, action: PayloadAction<{ component: ComponentSchema; parentId?: string; insertAtIndex?: number }>) => {
            const { component, parentId, insertAtIndex } = action.payload

            const addRecursive = (node: ComponentSchema): boolean => {
                if (node.id === (parentId || 'root')) {
                    node.children = node.children || []
                    if (insertAtIndex !== undefined && insertAtIndex >= 0) {
                        node.children.splice(insertAtIndex, 0, component)
                    } else {
                        node.children.push(component)
                    }
                    return true
                }
                if (node.children) {
                    for (const child of node.children) {
                        if (addRecursive(child)) return true
                    }
                }
                return false
            }

            addRecursive(state.page.root)
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateComponentProps: (state, action: PayloadAction<{ id: string; props: any }>) => {
            const { id, props } = action.payload
            
            const updateRecursive = (node: ComponentSchema) => {
                if (node.id === id) {
                    node.props = { ...node.props, ...props }
                    return true
                }
                if (node.children) {
                    for (const child of node.children) {
                        if (updateRecursive(child)) return true
                    }
                }
                return false
            }
            updateRecursive(state.page.root)
        },
        deleteComponent: (state, action: PayloadAction<string>) => {
            const id = action.payload
            const deleteRecursive = (node: ComponentSchema, parent: ComponentSchema | null) => {
                if (node.id === id) {
                    if (parent && parent.children) {
                        parent.children = parent.children.filter(child => child.id !== id)
                        return true
                    }
                }
                if (node.children) {
                    for (const child of node.children) {
                        if (deleteRecursive(child, node)) return true
                    }
                }
                return false
            }
            deleteRecursive(state.page.root, null)
            if (state.selectedId === id) {
                state.selectedId = null
            }
        },
        reorderComponents: (state, action: PayloadAction<{ parentId: string; oldIndex: number; newIndex: number }>) => {
            const { parentId, oldIndex, newIndex } = action.payload

            const reorderRecursive = (node: ComponentSchema): boolean => {
                if (node.id === parentId) {
                    if (!node.children || oldIndex < 0 || newIndex < 0 || oldIndex >= node.children.length || newIndex >= node.children.length) {
                        return true
                    }
                    const [removed] = node.children.splice(oldIndex, 1)
                    node.children.splice(newIndex, 0, removed)
                    return true
                }
                if (node.children) {
                    for (const child of node.children) {
                        if (reorderRecursive(child)) return true
                    }
                }
                return false
            }

            reorderRecursive(state.page.root)
        },
        moveComponentToNewParent: (state, action: PayloadAction<{ componentId: string; newParentId: string; newIndex: number }>) => {
            const { componentId, newParentId, newIndex } = action.payload

            // 1. 找到要移动的组件和它的父节点
            const activeResult = findNodeWithParent(state.page.root, componentId)
            if (!activeResult || !activeResult.parent) return

            const { node: activeNode, parent: oldParent } = activeResult

            // 2. 从旧父节点中删除
            if (oldParent.children) {
                oldParent.children = oldParent.children.filter(c => c.id !== componentId)
            }

            // 3. 找到新父节点并插入
            const insertRecursive = (node: ComponentSchema): boolean => {
                if (node.id === newParentId) {
                    node.children = node.children || []
                    node.children.splice(newIndex, 0, activeNode)
                    return true
                }
                if (node.children) {
                    for (const child of node.children) {
                        if (insertRecursive(child)) return true
                    }
                }
                return false
            }

            insertRecursive(state.page.root)
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
    moveComponentToNewParent
} = projectSlice.actions

export default projectSlice.reducer
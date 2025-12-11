import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { PageSchema, ComponentSchema } from '../types/schema'
import { initialPage } from '../mock'
import { findNode } from '../utils/treeUtils'

interface NodeRecord {
    parentId: string | null;
}

interface ProjectState {
    page: PageSchema
    selectedId: string | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    variables: Record<string, any>
    nodeMap: Record<string, NodeRecord>
}

const buildNodeMap = (root: ComponentSchema): Record<string, NodeRecord> => {
    const map: Record<string, NodeRecord> = {}
    const traverse = (node: ComponentSchema, parentId: string | null) => {
        map[node.id] = { parentId }
        if (node.children) {
            node.children.forEach(child => traverse(child, node.id))
        }
    }
    traverse(root, null)
    return map
}

const initialState: ProjectState = {
    page: initialPage,
    selectedId: null,
    variables: {
        username: 'Guest',
        email: 'guest@example.com',
        counter: 0
    },
    nodeMap: buildNodeMap(initialPage.root)
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
            const targetParentId = parentId || 'root'

            const parentNode = findNode(state.page.root, targetParentId)
            
            if (parentNode) {
                parentNode.children = parentNode.children || []
                
                if (insertAtIndex !== undefined && insertAtIndex >= 0) {
                    parentNode.children.splice(insertAtIndex, 0, component)
                } else {
                    parentNode.children.push(component)
                }

                // 更新 Map (仅用于索引 parentId)
                const registerToMap = (node: ComponentSchema, pid: string) => {
                    state.nodeMap[node.id] = { parentId: pid }
                    if (node.children) {
                        node.children.forEach(child => registerToMap(child, node.id))
                    }
                }
                registerToMap(component, targetParentId)
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateComponentProps: (state, action: PayloadAction<{ id: string; props: any }>) => {
            const { id, props } = action.payload
            
            const node = findNode(state.page.root, id)
            if (node) {
                node.props = { ...node.props, ...props }
            }
        },
        deleteComponent: (state, action: PayloadAction<string>) => {
            const id = action.payload
            
            const record = state.nodeMap[id]
            if (record && record.parentId) {
                const parentNode = findNode(state.page.root, record.parentId)
                if (parentNode && parentNode.children) {
                    parentNode.children = parentNode.children.filter(child => child.id !== id)
                }
                
                const unregisterFromMap = (nodeId: string) => {
                    const target = state.nodeMap[nodeId]
                    if (target) {
                        delete state.nodeMap[nodeId]
                    }
                }
                unregisterFromMap(id)
            }
            
            if (state.selectedId === id) {
                state.selectedId = null
            }
        },
        reorderComponents: (state, action: PayloadAction<{ parentId: string; oldIndex: number; newIndex: number }>) => {
            const { parentId, oldIndex, newIndex } = action.payload
            
            const parentNode = findNode(state.page.root, parentId)
            
            if (parentNode && parentNode.children) {
                const children = parentNode.children
                if (oldIndex >= 0 && newIndex >= 0 && oldIndex < children.length && newIndex < children.length) {
                    const [removed] = children.splice(oldIndex, 1)
                    children.splice(newIndex, 0, removed)
                }
            }
        },
        moveComponentToNewParent: (state, action: PayloadAction<{ componentId: string; newParentId: string; newIndex: number }>) => {
            const { componentId, newParentId, newIndex } = action.payload
            
            const activeRecord = state.nodeMap[componentId]
            
            if (activeRecord && activeRecord.parentId) {
                const oldParentNode = findNode(state.page.root, activeRecord.parentId)
                const newParentNode = findNode(state.page.root, newParentId)
                
                if (oldParentNode && newParentNode && oldParentNode.children) {
                    const componentToMove = oldParentNode.children.find(c => c.id === componentId)
                    
                    if (componentToMove) {
                        oldParentNode.children = oldParentNode.children.filter(c => c.id !== componentId)
                        
                        newParentNode.children = newParentNode.children || []
                        newParentNode.children.splice(newIndex, 0, componentToMove)
                        
                        state.nodeMap[componentId].parentId = newParentId
                    }
                }
            }
        },
        resetProject: (state) => {
            state.page = initialPage
            state.selectedId = null
            state.variables = initialState.variables
            state.nodeMap = buildNodeMap(initialPage.root)
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setVariable: (state, action: PayloadAction<{ key: string; value: any }>) => {
            const { key, value } = action.payload
            state.variables[key] = value
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
    resetProject,
    setVariable
} = projectSlice.actions
export default projectSlice.reducer
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
        addComponent: (state, action: PayloadAction<{ component: ComponentSchema; parentId?: string }>) => {
            const { component, parentId } = action.payload

            // 如果没有指定parentId，默认加到root下
            if (!parentId) {
                state.page.root.children = state.page.root.children || []
                state.page.root.children.push(component)
                return
            }

            // 如果制定了parentId，通过递归找到那个父组件
            const addRecursive = (node: ComponentSchema) => {
                if (node.id === parentId) {
                    node.children = node.children || []
                    node.children.push(component)
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
        moveComponent: (state, action: PayloadAction<{ componentId: string; activeId: string; overId: string }>) => {
            const { activeId, overId } = action.payload
            if (activeId === overId) return
            
            const rootChildren = state.page.root.children
            if (!rootChildren) return

            const oldIndex = rootChildren.findIndex(c => c.id === activeId)
            const newIndex = rootChildren.findIndex(c => c.id === overId)

            if (oldIndex !== -1 && newIndex !== -1) {
                const [movedItem] = rootChildren.splice(oldIndex, 1)
                rootChildren.splice(newIndex, 0, movedItem)
            }
        }
    }
})

export const { setPageTitle, setSelectedId, updateComponentProps, addComponent, deleteComponent, moveComponent } = projectSlice.actions
export default projectSlice.reducer
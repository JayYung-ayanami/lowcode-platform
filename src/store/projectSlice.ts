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
        addComponent: (state, action: PayloadAction<ComponentSchema>) => {
            if (!state.page.root.children) {
                state.page.root.children = []
            }
            state.page.root.children.push(action.payload)
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateComponentProps: (state, action: PayloadAction<{ id: string; props: any }>) => {
            const { id, props } = action.payload

            // 这是一个递归查找函数，要在树里找到那个组件并修改它
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

            // 递归查找并删除
            const deleteRecursive = (node: ComponentSchema, parent: ComponentSchema | null) => {
                if (node.id === id) {
                    if (parent && parent.children) {
                        // 从父节点的children中移除自己
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

            // 从根节点开始找
            deleteRecursive(state.page.root, null)

            // 删除后，如果当前选中的就是被删除的组件，则取消选中
            if (state.selectedId === id) {
                state.selectedId = null
            }
        }
    }
})

export const { setPageTitle, setSelectedId, updateComponentProps, addComponent, deleteComponent } = projectSlice.actions
export default projectSlice.reducer
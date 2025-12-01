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
    // 切片的命名，后面在useSelector中会用到
    name: 'project',
    // 初始状态
    initialState,
    // 定义了“怎么修改数据”的方法
    reducers: {
        setPageTitle: (state, action: PayloadAction<string>) => {
            state.page.title = action.payload
        },
        setSelectedId: (state, action: PayloadAction<string | null>) => {
            state.selectedId = action.payload
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
        }
    }
})

export const { setPageTitle, setSelectedId, updateComponentProps } = projectSlice.actions
export default projectSlice.reducer
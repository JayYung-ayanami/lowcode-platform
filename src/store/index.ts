import { configureStore } from '@reduxjs/toolkit'
import projectReducer from './projectSlice'
import undoable, { excludeAction, groupByActionTypes } from 'redux-undo'

export const store = configureStore({
    reducer: {
        // 使用undoable包裹reducer以启用历史记录（撤销/重做）
        // 访问数据时需要变为state.project.present.xxx
        project: undoable(projectReducer, {
            // 限制历史记录栈的长度，防止内存溢出
            limit: 20,
            // 排除掉一些不希望被记录的操作
            filter: excludeAction([
                'project/setSelectedId'
            ]),
            // 决定哪些操作可以被合并到同一个历史记录中
            groupBy: groupByActionTypes([
                'project/updateComponentProps',
                'project/reorderComponents',
                'project/setVariable'
            ])
        })
    }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
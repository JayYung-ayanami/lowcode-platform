import { configureStore } from '@reduxjs/toolkit'
import projectReducer from './projectSlice'
// 引入redux-undo库，用于给reducer增加撤销/重做功能
import undoable, { excludeAction, groupByActionTypes } from 'redux-undo'

export const store = configureStore({
    reducer: {
        /**
         * project模块
         * 使用undoable高阶reducer包裹，自动获得历史记录功能
         * 访问数据时需要变为state.project.present.xxx
         */
        project: undoable(projectReducer, {
            // 限制历史记录栈的长度，防止内存移出
            limit: 20,
            /**
             * 过滤配置：决定哪些操作需要被”记录“到历史栈中
             * excludeAction意味着：列表里的这些动作发生时，不会产生新的历史记录（不会导致撤销栈增加）
             */
            filter: excludeAction([
                'project/setSelectedId'
            ]),
            /**
             * 分组配置：决定哪些操作可以被合并到同一个历史记录中
             * groupByActionTypes意味着：列表里的这些动作发生时，会被合并到同一个历史记录中
             */
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
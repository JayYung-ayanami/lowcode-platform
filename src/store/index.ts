import { configureStore } from '@reduxjs/toolkit'
import projectReducer from './projectSlice'
// 引入redux-undo库，用于给reducer增加撤销/重做功能
import undoable, { excludeAction } from 'redux-undo'

export const store = configureStore({
    reducer: {
        /**
         * project模块
         * 使用undoable高阶reducer包裹，自动获得历史记录功能
         * 访问数据时需要变为state.project.present.xxx
         */
        project: undoable(projectReducer, {
            /**
             * 过滤配置：决定哪些操作需要被”记录“到历史栈中
             * excludeAction意味着：列表里的这些动作发生时，不会产生新的历史记录（不会导致撤销栈增加）
             */
            filter: excludeAction([
                /**
                 * 以下两个action不参与历史记录
                 * setSelectedId：选中组件只是单纯的UI交互，不属于“文档修改”，所以不应该被撤销
                 * setPageTitle：修改页面标题如果不希望被撤销，这里也排除（看具体需求）
                 */
                'project/setSelectedId',
                'project/setPageTitle'
            ])
        })
    }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
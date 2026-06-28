import { configureStore } from '@reduxjs/toolkit'
import undoable from 'redux-undo'
import projectReducer from './projectSlice'

/**
 * 测试专用 store 工厂：与生产 store 结构一致（经 undoable 包裹，
 * 因此组件读取的 state.project.present.* 才能正常工作）。
 */
export const createTestStore = () =>
    configureStore({
        reducer: {
            project: undoable(projectReducer),
        },
    })

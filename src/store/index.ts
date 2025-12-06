import { configureStore } from '@reduxjs/toolkit'
import projectReducer from './projectSlice'
import undoable, { excludeAction } from 'redux-undo'

export const store = configureStore({
    reducer: {
        project: undoable(projectReducer, {
            // 忽略某些action，不让它们进入历史栈
            filter: excludeAction([
                'project/setSelectedId',
                'project/setPageTitle'
            ])
        })
    }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
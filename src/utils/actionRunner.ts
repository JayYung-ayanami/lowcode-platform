import type { EventHandler, DataSourceConfig } from '../types/schema'
import type { AppDispatch } from '../store'
import { setVariable, updateComponentProps } from '../store/projectSlice'
import { executeScript } from './sandbox'
import { fetchDataSource } from './dataSource'

export interface ActionContext {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    e?: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    variables: Record<string, any>
    dispatch: AppDispatch
    dataSources?: DataSourceConfig[]
}

const runAction = (action: EventHandler, ctx: ActionContext) => {
    const { e, variables, dispatch, dataSources } = ctx

    switch (action.type) {
        case 'openModal':
            alert(`模拟弹窗：${action.config.title}`)
            break

        case 'link':
            window.open(action.config.url, action.config.target || '_blank')
            break

        case 'updateState': {
            let val = action.config.value
            if (val === undefined && e && e.target) {
                val = e.target.value
            }
            if (action.config.key) {
                dispatch(setVariable({ key: action.config.key, value: val }))
            }
            break
        }

        case 'setValue': {
            if (action.config.targetId) {
                dispatch(
                    updateComponentProps({
                        id: action.config.targetId,
                        props: { value: action.config.value },
                    }),
                )
            }
            break
        }

        case 'requestApi': {
            const ds = (dataSources || []).find((d) => d.id === action.config.dataSourceId)
            if (!ds) {
                console.warn('[Action] 未找到数据源:', action.config.dataSourceId)
                break
            }
            fetchDataSource(ds).then((data) => {
                dispatch(setVariable({ key: ds.variableKey, value: data }))
            })
            break
        }

        case 'script':
            executeScript(action.config.code, { e, dispatch, setVariable, variables })
            break

        default:
            console.warn('未知的动作类型：', (action as EventHandler).type)
    }
}

/**
 * 顺序执行一组动作（动作编排）。
 */
export const runActions = (actions: EventHandler[] | undefined, ctx: ActionContext) => {
    if (!actions) return
    actions.forEach((action) => runAction(action, ctx))
}

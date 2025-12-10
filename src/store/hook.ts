import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './index'

/**
 * 自定义的useDispatch Hook
 * 
 * 不直接用useDispatch的原因：
 * 1.默认的useDispatch返回的dispatch函数不懂你的异步操作
 * 2.使用这个useAppDispatch。TS会知道dispatch可以接收异步函数
 */
export const useAppDispatch = () => useDispatch<AppDispatch>()
/**
 * 自定义的useSelector Hook
 * 
 * 不直接用useSelector的原因：
 * 1.默认的useSelector不知道你的state长什么样，state参数类型是unknown
 * 2.使用这个useAppSelector,你在组件里输入state.的时候，IDE会自动补全project.present.xxx
 * 3.省去了每次再组件里都要手动写(state: RootState) => ...的麻烦
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
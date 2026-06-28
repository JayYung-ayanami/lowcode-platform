import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hook';
import { setVariable } from '../store/projectSlice';
import { fetchDataSource } from '../utils/dataSource';

/**
 * 页面初始化时自动拉取所有标记了 autoLoad 的远程数据源，
 * 结果写入全局变量，供组件通过 {{state.<variableKey>}} 绑定渲染。
 */
export const useDataSources = () => {
    const dispatch = useAppDispatch();
    const dataSources = useAppSelector((state) => state.project.present.page.dataSources);
    const loadedRef = useRef(false);

    useEffect(() => {
        if (loadedRef.current) return;
        if (!dataSources || dataSources.length === 0) return;
        loadedRef.current = true;

        dataSources
            .filter((ds) => ds.autoLoad)
            .forEach((ds) => {
                fetchDataSource(ds)
                    .then((data) => dispatch(setVariable({ key: ds.variableKey, value: data })))
                    .catch((err) => console.error('[DataSource] 自动加载失败:', ds.name, err));
            });
    }, [dataSources, dispatch]);
};

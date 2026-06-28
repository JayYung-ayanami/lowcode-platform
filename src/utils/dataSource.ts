import type { DataSourceConfig } from '../types/schema'

/**
 * 按路径取值，如 pickPath(res, 'data.list')。path 为空时返回整个对象。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const pickPath = (obj: any, path?: string): any => {
    if (!path) return obj
    return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj)
}

/**
 * 拉取远程数据源。请求失败（断网 / 接口不可用）时回退到 mock 兜底数据，
 * 保证演示与离线环境下编辑器依然可用。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchDataSource = async (ds: DataSourceConfig): Promise<any> => {
    try {
        const res = await fetch(ds.url, { method: ds.method })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        return pickPath(json, ds.dataPath)
    } catch (err) {
        console.warn(`[DataSource] "${ds.name}" 请求失败，使用 mock 兜底:`, err)
        if (ds.mock !== undefined) return pickPath(ds.mock, ds.dataPath)
        throw err
    }
}

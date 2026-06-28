import { describe, it, expect, vi, afterEach } from 'vitest'
import { pickPath, fetchDataSource } from '../dataSource'
import type { DataSourceConfig } from '../../types/schema'

describe('pickPath', () => {
    const obj = { data: { list: [1, 2, 3], total: 3 } }

    it('returns whole object when path empty', () => {
        expect(pickPath(obj)).toBe(obj)
    })

    it('picks nested path', () => {
        expect(pickPath(obj, 'data.total')).toBe(3)
        expect(pickPath(obj, 'data.list')).toEqual([1, 2, 3])
    })

    it('returns undefined safely for invalid path', () => {
        expect(pickPath(obj, 'a.b.c')).toBeUndefined()
    })
})

describe('fetchDataSource', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    const baseDs: DataSourceConfig = {
        id: 'd1',
        name: 'test',
        variableKey: 'd',
        url: 'https://api.example.com/list',
        method: 'GET',
        autoLoad: false,
    }

    it('returns parsed data on success and applies dataPath', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ data: { total: 9 } }),
            }),
        )

        const result = await fetchDataSource({ ...baseDs, dataPath: 'data.total' })
        expect(result).toBe(9)
    })

    it('falls back to mock when request fails', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

        const result = await fetchDataSource({ ...baseDs, mock: [{ id: 1 }] })
        expect(result).toEqual([{ id: 1 }])
    })

    it('applies dataPath to mock fallback as well', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

        const result = await fetchDataSource({
            ...baseDs,
            dataPath: 'list',
            mock: { list: [1, 2] },
        })
        expect(result).toEqual([1, 2])
    })

    it('throws when failing and no mock provided', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))

        await expect(fetchDataSource(baseDs)).rejects.toThrow()
    })
})

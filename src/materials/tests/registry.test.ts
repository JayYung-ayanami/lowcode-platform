import { describe, it, expect } from 'vitest'
import {
    materials,
    materialMap,
    ComponentMap,
    CONTAINER_TYPES,
    getDefaultComponentData,
    materialsByCategory,
} from '../registry'

describe('material registry', () => {
    it('every material has a unique type', () => {
        const types = materials.map((m) => m.type)
        expect(new Set(types).size).toBe(types.length)
    })

    it('every material exposes a render component', () => {
        materials.forEach((m) => {
            expect(typeof ComponentMap[m.type]).toBe('function')
        })
    })

    it('materialMap is indexed by type', () => {
        materials.forEach((m) => {
            expect(materialMap[m.type]).toBe(m)
        })
    })

    it('CONTAINER_TYPES excludes Page and only contains containers', () => {
        expect(CONTAINER_TYPES).not.toContain('Page')
        CONTAINER_TYPES.forEach((t) => {
            expect(materialMap[t].isContainer).toBe(true)
        })
    })

    it('getDefaultComponentData returns a fresh copy of defaults', () => {
        const a = getDefaultComponentData('Button')
        const b = getDefaultComponentData('Button')
        expect(a.props).toEqual(b.props)
        expect(a.props).not.toBe(b.props)
    })

    it('includes custom non-antd advanced components', () => {
        const advancedTypes = (materialsByCategory.advanced || []).map((m) => m.type)
        expect(advancedTypes).toEqual(expect.arrayContaining(['Image', 'Link', 'Progress', 'Heading']))
    })

    it('Page is not offered as a draggable material', () => {
        const allOffered = Object.values(materialsByCategory).flat().map((m) => m.type)
        expect(allOffered).not.toContain('Page')
    })
})

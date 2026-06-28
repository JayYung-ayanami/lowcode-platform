import { describe, it, expect } from 'vitest'
import { findNode, findParentAndIndex } from '../treeUtils'
import type { ComponentSchema } from '../../types/schema'

const tree: ComponentSchema = {
    id: 'root',
    type: 'Page',
    name: 'root',
    props: {},
    children: [
        {
            id: 'a',
            type: 'Container',
            name: 'a',
            props: {},
            children: [
                { id: 'a1', type: 'Button', name: 'a1', props: {} },
                { id: 'a2', type: 'Button', name: 'a2', props: {} },
            ],
        },
        { id: 'b', type: 'Text', name: 'b', props: {} },
    ],
}

describe('treeUtils', () => {
    it('findNode finds the root', () => {
        expect(findNode(tree, 'root')?.id).toBe('root')
    })

    it('findNode finds a deeply nested node', () => {
        expect(findNode(tree, 'a2')?.name).toBe('a2')
    })

    it('findNode returns null for missing id', () => {
        expect(findNode(tree, 'missing')).toBeNull()
    })

    it('findParentAndIndex returns correct parent and index', () => {
        expect(findParentAndIndex(tree, 'a2')).toEqual({ parentId: 'a', index: 1 })
        expect(findParentAndIndex(tree, 'b')).toEqual({ parentId: 'root', index: 1 })
    })

    it('findParentAndIndex returns null for root (no parent)', () => {
        expect(findParentAndIndex(tree, 'root')).toBeNull()
    })
})

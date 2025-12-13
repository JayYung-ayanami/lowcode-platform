import { describe, it, expect, beforeEach } from 'vitest'
import projectReducer, {
    setPageTitle,
    addComponent,
    deleteComponent,
    updateComponentProps,
    reorderComponents,
    moveComponentToNewParent
} from '../projectSlice'
import type { ComponentSchema } from '../../types/schema'

const createInitialState = () => {
    return projectReducer(undefined, { type: '@@INIT' })
}

describe('projectSlice', () => {
    let initialState: ReturnType<typeof createInitialState>

    beforeEach(() => {
        initialState = createInitialState()
    })

    it('should have correct initial state', () => {
        expect(initialState.page.title).toBeDefined()
        expect(initialState.nodeMap).toBeDefined()
        expect(initialState.nodeMap['root']).toBeDefined()
    })

    it('should handle setPageTitle', () => {
        const newState = projectReducer(initialState, setPageTitle('New Title'))
        expect(newState.page.title).toBe('New Title')
    })

    it('should handle addComponent', () => {
        const newComponent: ComponentSchema = {
            id: 'new-btn',
            type: 'Button',
            name: 'New Button',
            props: {},
            children: []
        }
        
        const state1 = projectReducer(initialState, addComponent({
            component: newComponent,
            parentId: 'root'
        }))
        
        const rootChildren = state1.page.root.children || []
        expect(rootChildren.some(c => c.id === 'new-btn')).toBe(true)
        
        expect(state1.nodeMap['new-btn']).toBeDefined()
        expect(state1.nodeMap['new-btn'].parentId).toBe('root')
    })

    it('should handle deleteComponent', () => {
        const component: ComponentSchema = { id: 'temp-id', type: 'Button', name: 'Btn', props: {} }
        let state = projectReducer(initialState, addComponent({ component, parentId: 'root' }))
        
        expect(state.nodeMap['temp-id']).toBeDefined()
        
        state = projectReducer(state, deleteComponent('temp-id'))
        
        const rootChildren = state.page.root.children || []
        expect(rootChildren.find(c => c.id === 'temp-id')).toBeUndefined()
        expect(state.nodeMap['temp-id']).toBeUndefined()
    })

    it('should handle updateComponentProps', () => {
        const state = projectReducer(initialState, updateComponentProps({
            id: 'root',
            props: { className: 'new-class', disabled: true }
        }))
        
        expect(state.page.root.props.className).toBe('new-class')
        expect(state.page.root.props.disabled).toBe(true)
    })

    it('should handle reorderComponents', () => {
        const c1: ComponentSchema = { id: 'c1', type: 'Button', name: 'C1', props: {} }
        const c2: ComponentSchema = { id: 'c2', type: 'Button', name: 'C2', props: {} }
        
        let state = projectReducer(initialState, addComponent({ component: c1, parentId: 'root' }))
        state = projectReducer(state, addComponent({ component: c2, parentId: 'root' }))
        
        const children = state.page.root.children!
        const idx1 = children.findIndex(c => c.id === 'c1')
        const idx2 = children.findIndex(c => c.id === 'c2')
        
        state = projectReducer(state, reorderComponents({
            parentId: 'root',
            oldIndex: idx1,
            newIndex: idx2
        }))
        
        const newChildren = state.page.root.children!
        expect(newChildren[idx2].id).toBe('c1')
    })

    it('should handle moveComponentToNewParent', () => {
        const container1: ComponentSchema = { id: 'cont1', type: 'Container', name: 'C1', props: {}, children: [] }
        const container2: ComponentSchema = { id: 'cont2', type: 'Container', name: 'C2', props: {}, children: [] }
        const button: ComponentSchema = { id: 'btn-move', type: 'Button', name: 'Btn', props: {} }
        
        let state = projectReducer(initialState, addComponent({ component: container1, parentId: 'root' }))
        state = projectReducer(state, addComponent({ component: container2, parentId: 'root' }))
        state = projectReducer(state, addComponent({ component: button, parentId: 'cont1' }))
        
        expect(state.nodeMap['btn-move'].parentId).toBe('cont1')
        
        state = projectReducer(state, moveComponentToNewParent({
            componentId: 'btn-move',
            newParentId: 'cont2',
            newIndex: 0
        }))
            
        expect(state.nodeMap['btn-move'].parentId).toBe('cont2')
        
        const c1Node = state.page.root.children!.find(c => c.id === 'cont1')!
        const c2Node = state.page.root.children!.find(c => c.id === 'cont2')!
        
        expect(c1Node.children!.find(c => c.id === 'btn-move')).toBeUndefined()
        expect(c2Node.children!.find(c => c.id === 'btn-move')).toBeDefined()
    })
})


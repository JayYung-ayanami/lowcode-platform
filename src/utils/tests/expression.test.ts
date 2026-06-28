import { describe, it, expect } from 'vitest'
import { evaluateExpression, resolveProps } from '../expression'

describe('expression engine', () => {
    const scope = { state: { count: 5, user: { name: '张三' }, list: [1, 2, 3] } }

    it('returns non-string input as-is', () => {
        expect(evaluateExpression(42, scope)).toBe(42)
        expect(evaluateExpression(true, scope)).toBe(true)
    })

    it('returns plain string without expression unchanged', () => {
        expect(evaluateExpression('hello', scope)).toBe('hello')
    })

    it('evaluates full expression preserving type (number)', () => {
        expect(evaluateExpression('{{ state.count + 1 }}', scope)).toBe(6)
    })

    it('evaluates member access', () => {
        expect(evaluateExpression('{{ state.user.name }}', scope)).toBe('张三')
    })

    it('evaluates array length', () => {
        expect(evaluateExpression('{{ state.list.length }}', scope)).toBe(3)
    })

    it('does inline string interpolation', () => {
        expect(evaluateExpression('你好 {{ state.user.name }}，共 {{ state.count }} 项', scope)).toBe(
            '你好 张三，共 5 项',
        )
    })

    it('returns undefined for invalid expression (no throw)', () => {
        expect(evaluateExpression('{{ state.nope.deep.fail }}', scope)).toBeUndefined()
    })

    it('resolveProps maps all values', () => {
        const out = resolveProps({ a: '{{ state.count }}', b: 'static', c: 7 }, scope.state)
        expect(out).toEqual({ a: 5, b: 'static', c: 7 })
    })
})

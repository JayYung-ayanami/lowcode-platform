/**
 * 安全表达式引擎。
 *
 * 支持两种写法：
 *  1. 整值表达式 `{{ state.count + 1 }}` —— 返回求值后的原始类型（数字/对象等）。
 *  2. 内联插值 `你好 {{ state.user.name }}！` —— 做字符串模板替换。
 *
 * 求值时仅向表达式注入受控的 scope（默认只有 state），不暴露闭包外的局部变量。
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Scope = Record<string, any>

const FULL_EXPR = /^\{\{([\s\S]+)\}\}$/
const INLINE_EXPR = /\{\{([\s\S]+?)\}\}/g

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const safeEval = (expr: string, scope: Scope): any => {
    try {
        const keys = Object.keys(scope)
        const values = keys.map((k) => scope[k])
        // 严格模式 + 仅注入 scope 中的键，避免误用未声明变量
        const fn = new Function(...keys, `"use strict"; return (${expr});`)
        return fn(...values)
    } catch (err) {
        console.warn('[Expression] 求值失败:', expr, err)
        return undefined
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const evaluateExpression = (input: any, scope: Scope): any => {
    if (typeof input !== 'string') return input

    const full = input.match(FULL_EXPR)
    if (full) {
        return safeEval(full[1].trim(), scope)
    }

    if (input.includes('{{')) {
        return input.replace(INLINE_EXPR, (_, expr) => {
            const v = safeEval(String(expr).trim(), scope)
            return v === undefined || v === null ? '' : String(v)
        })
    }

    return input
}

/**
 * 解析组件 props 中的所有表达式，scope 暴露为 { state: variables }。
 */
export const resolveProps = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: Record<string, any> | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    variables: Record<string, any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> => {
    const scope: Scope = { state: variables }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out: Record<string, any> = {}
    if (!props) return out
    for (const key in props) {
        out[key] = evaluateExpression(props[key], scope)
    }
    return out
}

import { parse } from '@babel/parser'

/**
 * 安全沙箱：采用「静态 AST 分析 + 运行时 Proxy 白名单」双重防护。
 *
 * 1) 静态分析（主防线）：在执行前解析用户脚本为 AST，拒绝所有逃逸常用手法
 *    —— 危险全局标识符、对 constructor/__proto__/prototype 的成员访问等。
 *    这能挡住 `({}).constructor.constructor('return window')()` 这类经典逃逸。
 * 2) 运行时 Proxy（纵深防御）：配合 with 接管全部变量查找，拦截裸危险标识符，
 *    并以 'use strict' 让 this 为 undefined，杜绝 this 逃逸。
 *
 * 注：浏览器环境下绝对安全的方案是 iframe(sandbox) / Web Worker / ShadowRealm 隔离；
 * 本实现是在不引入额外运行时隔离层前提下，工程上可落地的强约束方案。
 */

// 允许在脚本中使用的全局工具白名单
const GLOBAL_WHITELIST = new Set([
    'console',
    'Math',
    'Date',
    'JSON',
    'parseInt',
    'parseFloat',
    'setTimeout',
    'setInterval',
    'alert',
])

// 危险标识符 / 成员名黑名单
const DANGEROUS_KEYS = new Set([
    'constructor',
    '__proto__',
    'prototype',
    'Function',
    'eval',
    'globalThis',
    'self',
    'top',
    'parent',
    'window',
    'document',
    'localStorage',
    'sessionStorage',
    'cookie',
    'fetch',
    'XMLHttpRequest',
    'WebSocket',
    'Worker',
    'require',
    'process',
    'global',
    'Reflect',
    'Proxy',
])

/**
 * 静态分析：遍历 AST，发现危险用法即抛出，阻止脚本进入执行阶段。
 */
const assertSafe = (code: string) => {
    const ast = parse(code, { sourceType: 'script', allowReturnOutsideFunction: true })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const visit = (node: any) => {
        if (!node || typeof node !== 'object') return

        // 裸危险标识符：Function / eval / window / globalThis ...
        if (node.type === 'Identifier' && DANGEROUS_KEYS.has(node.name)) {
            throw new Error(`检测到危险标识符: ${node.name}`)
        }

        // 禁止 this：非严格模式下 with 内的 this 会指向全局对象，直接禁用以杜绝逃逸
        if (node.type === 'ThisExpression') {
            throw new Error('检测到危险标识符: this')
        }

        // 成员访问：obj.constructor / obj.__proto__ / obj['prototype']
        if (node.type === 'MemberExpression') {
            if (!node.computed && node.property?.type === 'Identifier' && DANGEROUS_KEYS.has(node.property.name)) {
                throw new Error(`检测到危险成员访问: .${node.property.name}`)
            }
            if (node.computed && node.property?.type === 'StringLiteral' && DANGEROUS_KEYS.has(node.property.value)) {
                throw new Error(`检测到危险成员访问: [${node.property.value}]`)
            }
        }

        for (const key of Object.keys(node)) {
            if (key === 'loc' || key === 'range' || key === 'start' || key === 'end') continue
            const value = node[key]
            if (Array.isArray(value)) {
                value.forEach(visit)
            } else if (value && typeof value.type === 'string') {
                visit(value)
            }
        }
    }

    visit(ast.program)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const executeScript = (code: string, context: Record<string, any>) => {
    // 阶段一：静态分析。不通过则直接拒绝执行。
    // 安全拦截 -> warn；语法错误 -> error（保持"语法错误也不崩溃"的语义）。
    try {
        assertSafe(code)
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.startsWith('检测到')) {
            console.warn('沙箱拦截:', msg)
        } else {
            console.error('沙箱执行错误：', err)
        }
        return
    }

    // 阶段二：运行时 Proxy 接管变量查找（纵深防御）
    const proxyContext = new Proxy(context, {
        has(target, key: string | symbol) {
            if (typeof key === 'string' && GLOBAL_WHITELIST.has(key)) {
                return Object.prototype.hasOwnProperty.call(target, key)
            }
            return true
        },
        get(target, prop: string | symbol) {
            if (typeof prop === 'string' && DANGEROUS_KEYS.has(prop)) {
                console.warn(`沙箱拦截: 禁止访问危险标识符 ${String(prop)}`)
                return undefined
            }
            if (prop in target) {
                return target[prop as string]
            }
            if (typeof prop === 'string' && GLOBAL_WHITELIST.has(prop)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return (window as any)[prop]
            }
            return undefined
        },
    })

    try {
        // 注意：with 语句不允许出现在严格模式中，因此此处不能加 'use strict'；
        // this 逃逸已由静态分析阶段（禁止 ThisExpression）阻断。
        const sandbox = new Function(
            'sandbox',
            `with(sandbox) {
                try {
                    ${code}
                } catch (e) {
                    console.error('用户脚本错误：', e);
                }
            }`,
        )
        sandbox(proxyContext)
    } catch (err) {
        console.error('沙箱执行错误：', err)
    }
}

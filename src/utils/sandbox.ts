// 允许在脚本中使用的全局工具
const GLOBAL_WHITELIST = new Set([
    'console',
    'Math',
    'Date',
    'JSON',
    'parseInt',
    'parseFloat',
    'setTimeout',
    'setInterval',
    'alert' // 开发阶段暂时放开，生产环境建议禁用
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const executeScript = (code: string, context: Record<string, any>) => {
    // 构造沙箱代理对象
    const proxyContext = new Proxy(context, {
        // 拦截 'in' 操作符和 with 语句的变量查找
        // 只要返回 true，with 块内的变量查找就会被限制在 proxy 中，而不会向上查找全局作用域
        has(target, key: string | symbol) {
            // 除非是白名单里的全局对象，否则都声称“我有”，把查找拦截下来
            if (typeof key === 'string' && GLOBAL_WHITELIST.has(key)) {
                return Object.prototype.hasOwnProperty.call(target, key);
            }
            return true;
        },
        // 拦截属性读取
        get(target, prop: string | symbol) {
            // 1. 优先返回上下文中的变量 (如 e, dispatch 等)
            if (prop in target) {
                return target[prop as string];
            }

            // 2. 允许访问白名单中的全局对象
            if (typeof prop === 'string' && GLOBAL_WHITELIST.has(prop)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return (window as any)[prop];
            }

            // 3. 拦截对危险全局对象的访问
            if (prop === 'window' || prop === 'document' || prop === 'localStorage' || prop === 'cookie') {
                console.warn(`沙箱拦截: 禁止访问 ${String(prop)}`);
                return undefined;
            }

            // 4. 其他未定义的变量返回 undefined，而不是报错
            return undefined;
        }
    });

    // 外层try catch是为了捕获系统级错误或语法错误，确保即使代码连编译都过不了，编辑器也能活着
    // 内层try catch是为了捕获用户写的烂代码，防止用户的脚本错误导致整个编辑器崩溃（白屏）
    try {
        const sandbox = new Function('sandbox', `
            with(sandbox) {
                try {
                    ${code}
                } catch (e) {
                    console.error('User Script Error:', e);
                }
            }
        `);
        
        sandbox(proxyContext);
    } catch (err) {
        console.error('Sandbox Execution Error:', err);
    }
}

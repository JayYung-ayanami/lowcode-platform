import { describe, it, expect, vi } from 'vitest';
import { executeScript } from '../sandbox';

describe('Sandbox Security', () => {
  it('should execute simple console.log', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    const context = { testVar: 'hello' };
    
    executeScript('console.log(testVar)', context);
    
    expect(consoleSpy).toHaveBeenCalledWith('hello');
    consoleSpy.mockRestore();
  });

  it('should block access to window object', () => {
    const consoleSpy = vi.spyOn(console, 'warn');
    const context = {};
    
    executeScript('window.location.href = "http://evil.com"', context);
    
    // 应该触发警告
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should block access to document object', () => {
    const consoleSpy = vi.spyOn(console, 'warn');
    const context = {};
    
    executeScript('document.cookie', context);
    
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should allow Math operations', () => {
    const context = { result: 0 };
    
    executeScript('result = Math.max(10, 20)', context);
    
    // Math 是白名单，应该正常工作
    expect(context.result).toBe(20);
  });

  it('should handle syntax errors gracefully', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error');
    const context = {};
    
    executeScript('this is invalid javascript!!!', context);
    
    // 应该捕获错误而不是崩溃
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should handle runtime errors gracefully', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error');
    const context = {};
    
    executeScript('throw new Error("test error")', context);
    
    // 应该捕获用户代码的运行时错误
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should access context variables', () => {
    const context = { 
      e: { target: { value: 'test' } },
      variables: { count: 5 }
    };
    
    let capturedValue: string | undefined;
    context.variables = new Proxy(context.variables, {
      get(target, prop) {
        if (prop === 'count') {
          capturedValue = String(target[prop as keyof typeof target]);
        }
        return target[prop as keyof typeof target];
      }
    });
    
    executeScript('const val = variables.count', context);
    
    expect(capturedValue).toBe('5');
  });

  it('should allow JSON operations', () => {
    const context = { result: '' };
    
    executeScript('result = JSON.stringify({ a: 1 })', context);
    
    expect(context.result).toBe('{"a":1}');
  });

  it('should not access localStorage', () => {
    const consoleSpy = vi.spyOn(console, 'warn');
    const context = {};
    
    executeScript('localStorage.setItem("key", "value")', context);
    
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});


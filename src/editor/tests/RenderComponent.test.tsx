import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { RenderComponent } from '../RenderComponent';
import { createTestStore } from '../../store/testStore';
import type { ComponentSchema } from '../../types/schema';

describe('RenderComponent', () => {
  it('should render Button component', () => {
    const schema: ComponentSchema = {
      id: 'btn-1',
      type: 'Button',
      name: 'TestButton',
      props: {
        children: 'Click Me'
      }
    };

    const store = createTestStore();

    render(
      <Provider store={store}>
        <RenderComponent schema={schema} />
      </Provider>
    );

    expect(screen.getByText('Click Me')).toBeDefined();
  });

  it('should render Text component with custom style', () => {
    const schema: ComponentSchema = {
      id: 'text-1',
      type: 'Text',
      name: 'TestText',
      props: {
        text: 'Hello World',
        fontSize: '16px',
        color: '#ff0000'
      }
    };

    const store = createTestStore();

    render(
      <Provider store={store}>
        <RenderComponent schema={schema} />
      </Provider>
    );

    const textElement = screen.getByText('Hello World');
    expect(textElement).toBeDefined();
  });

  it('should render Container with children', () => {
    const schema: ComponentSchema = {
      id: 'container-1',
      type: 'Container',
      name: 'TestContainer',
      props: {},
      children: [
        {
          id: 'btn-child',
          type: 'Button',
          name: 'ChildButton',
          props: {
            children: 'Child Button'
          }
        }
      ]
    };

    const store = createTestStore();

    render(
      <Provider store={store}>
        <RenderComponent schema={schema} />
      </Provider>
    );

    expect(screen.getByText('Child Button')).toBeDefined();
  });

  it('should render empty Container with placeholder', () => {
    const schema: ComponentSchema = {
      id: 'container-empty',
      type: 'Container',
      name: 'EmptyContainer',
      props: {},
      children: []
    };

    const store = createTestStore();

    render(
      <Provider store={store}>
        <RenderComponent schema={schema} />
      </Provider>
    );

    expect(screen.getByText('拖拽组件到此处')).toBeDefined();
  });

  it('should handle variable expression', () => {
    const schema: ComponentSchema = {
      id: 'text-var',
      type: 'Text',
      name: 'VarText',
      props: {
        text: '{{state.username}}'
      }
    };

    const store = createTestStore();

    render(
      <Provider store={store}>
        <RenderComponent schema={schema} />
      </Provider>
    );

    // 默认变量 username 是 'Guest'
    expect(screen.getByText('Guest')).toBeDefined();
  });

  it('should render Input component', () => {
    const schema: ComponentSchema = {
      id: 'input-1',
      type: 'Input',
      name: 'TestInput',
      props: {
        placeholder: '请输入内容'
      }
    };

    const store = createTestStore();

    const { container } = render(
      <Provider store={store}>
        <RenderComponent schema={schema} />
      </Provider>
    );

    const input = container.querySelector('input');
    expect(input).toBeDefined();
    expect(input?.placeholder).toBe('请输入内容');
  });

  it('should render Card component', () => {
    const schema: ComponentSchema = {
      id: 'card-1',
      type: 'Card',
      name: 'TestCard',
      props: {
        title: 'Card Title'
      },
      children: []
    };

    const store = createTestStore();

    render(
      <Provider store={store}>
        <RenderComponent schema={schema} />
      </Provider>
    );

    expect(screen.getByText('Card Title')).toBeDefined();
  });

  it('should render custom Progress component (non-antd)', () => {
    const schema: ComponentSchema = {
      id: 'prog-1',
      type: 'Progress',
      name: 'TestProgress',
      props: { percent: 73, showInfo: true },
    };

    const store = createTestStore();
    render(
      <Provider store={store}>
        <RenderComponent schema={schema} />
      </Provider>
    );

    expect(screen.getByText('73%')).toBeDefined();
  });

  it('should clamp Progress percent over 100', () => {
    const schema: ComponentSchema = {
      id: 'prog-2',
      type: 'Progress',
      name: 'TestProgress',
      props: { percent: 250, showInfo: true },
    };

    const store = createTestStore();
    render(
      <Provider store={store}>
        <RenderComponent schema={schema} />
      </Provider>
    );

    expect(screen.getByText('100%')).toBeDefined();
  });

  it('should render custom Heading with level', () => {
    const schema: ComponentSchema = {
      id: 'h-1',
      type: 'Heading',
      name: 'TestHeading',
      props: { text: '大标题', level: 1 },
    };

    const store = createTestStore();
    const { container } = render(
      <Provider store={store}>
        <RenderComponent schema={schema} />
      </Provider>
    );

    expect(container.querySelector('h1')?.textContent).toBe('大标题');
  });

  it('should evaluate arithmetic expression with state', () => {
    const schema: ComponentSchema = {
      id: 'text-calc',
      type: 'Text',
      name: 'CalcText',
      props: { text: '计数 {{ state.counter + 10 }}' },
    };

    const store = createTestStore();
    render(
      <Provider store={store}>
        <RenderComponent schema={schema} />
      </Provider>
    );

    // 默认 counter = 0，应渲染为 "计数 10"
    expect(screen.getByText('计数 10')).toBeDefined();
  });
});


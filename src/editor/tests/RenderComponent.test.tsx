import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { RenderComponent } from '../RenderComponent';
import projectReducer from '../../store/projectSlice';
import type { ComponentSchema } from '../../types/schema';

// 创建测试用 store
const createTestStore = () => {
  return configureStore({
    reducer: {
      project: projectReducer
    }
  });
};

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
});


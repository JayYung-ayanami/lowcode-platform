import type { PageSchema } from './types/schema'
import { SCHEMA_VERSION } from './types/schema'

export const initialPage: PageSchema = {
    version: SCHEMA_VERSION,
    title: '我的第一个低代码页面',
    dataSources: [
        {
            id: 'ds_users',
            name: '用户列表接口',
            variableKey: 'userCount',
            url: 'https://jsonplaceholder.typicode.com/users',
            method: 'GET',
            autoLoad: true,
            dataPath: 'length',
            mock: [
                { id: 1, name: 'Leanne Graham' },
                { id: 2, name: 'Ervin Howell' },
                { id: 3, name: 'Clementine Bauch' },
            ],
        },
    ],
    root: {
        id: 'root',
        type: 'Page',
        name: '根页面',
        props: {},
        style: { padding: '20px', backgroundColor: '#f0f2f5', minHeight: '100vh' },
        children: [
            {
                id: '1',
                type: 'Container',
                name: '白色卡片',
                props: {},
                style: {
                    padding: '20px',
                    backgroundColor: '#fff',
                    minHeight: '300px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                },
                children: [
                    {
                        id: '2',
                        type: 'Text',
                        name: '标题文本',
                        props: {
                            text: 'Hello User!',
                            fontSize: '24px',
                            color: '#1890ff',
                        },
                    },
                    {
                        id: 'ds_text',
                        type: 'Text',
                        name: '数据源绑定文本',
                        props: {
                            // 演示表达式引擎 + 远程数据源联动：远程返回用户数后渲染
                            text: '远程加载到 {{ state.userCount }} 位用户',
                            fontSize: '14px',
                            color: '#52c41a',
                        },
                        style: { marginTop: '12px', display: 'block' },
                    },
                    {
                        id: 'progress_1',
                        type: 'Progress',
                        name: '进度条',
                        props: { percent: 66, color: '#1677ff' },
                        style: { marginTop: '16px' },
                    },
                    {
                        id: 'input_name',
                        type: 'Input',
                        name: '姓名输入框',
                        props: {
                            placeholder: '等待填充数据...',
                        },
                        style: { marginTop: '20px', display: 'block', width: '300px' },
                    },
                    {
                        id: '3',
                        type: 'Button',
                        name: '提交按钮',
                        props: {
                            type: 'primary',
                            children: '点击填充数据',
                        },
                        style: { marginTop: '20px' },
                        events: {
                            onClick: [
                                {
                                    type: 'setValue',
                                    config: {
                                        targetId: 'input_name',
                                        value: 'User 2025',
                                    },
                                },
                            ],
                        },
                    },
                ],
            },
        ],
    },
}

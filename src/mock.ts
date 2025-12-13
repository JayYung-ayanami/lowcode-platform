import type { PageSchema } from './types/schema'

export const initialPage: PageSchema = {
    title: '我的第一个低代码页面',
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
                    borderRadius: '4px'
                },
                children: [
                    {
                        id: '2',
                        type: 'Text',
                        name: '标题文本',
                        props: {
                            text: 'Hello User!',
                            fontSize: '24px',
                            color: '#1890ff'
                        }
                    },
                    {
                        id: 'input_name',
                        type: 'Input',
                        name: '姓名输入框',
                        props: {
                            placeholder: '等待填充数据...'
                        },
                        style: { marginTop: '20px', display: 'block', width: '300px' }
                    },
                    {
                        id: '3',
                        type: 'Button',
                        name: '提交按钮',
                        props: {
                            type: 'primary',
                            children: '点击填充数据'
                        },
                        style: { marginTop: '20px' },
                        events: {
                            onClick: [
                                {
                                    type: 'setValue',
                                    config: {
                                        targetId: 'input_name',
                                        value: 'User 2025'
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        ]
    }
}
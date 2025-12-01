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
                style: { padding: '20px', backgroundColor: '#', minHeight: '300px' },
                children: [
                    {
                        id: '2',
                        type: 'Text',
                        name: '标题文本',
                        props: {
                            text: 'Hello Tencent!',
                            fontSize: '24px',
                            color: '#1890ff'
                        }
                    },
                    {
                        id: '3',
                        type: 'Button',
                        name: '提交按钮',
                        props: {
                            type: 'primary',
                            children: '点击我'
                        },
                        style: { marginTop: '20px' }
                    }
                ]
            }
        ]
    }
}
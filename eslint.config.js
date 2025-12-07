import js from '@eslint/js' // JavaScript的基础规则
import globals from 'globals' // 定义全局变量（比如浏览器里的window、document）
import reactHooks from 'eslint-plugin-react-hooks' // 检查React Hooks是否用对了（比如依赖项有没有漏写）
import reactRefresh from 'eslint-plugin-react-refresh' // 检查代码是否符合热更新的要求
import tseslint from 'typescript-eslint' // 专门用来检查TypeScript代码的规则
import { defineConfig, globalIgnores } from 'eslint/config' // defineConfig：类型提示辅助函数；globalIgnores：配置全局忽略文件的函数

export default defineConfig([
  globalIgnores(['dist']), // dist文件夹里的东西（打包后的产物）不用检查
  {
    files: ['**/*.{ts,tsx}'], // 检查所有以ts、tsx结尾的文件
    extends: [ // 继承现成的规则集
      js.configs.recommended, // js的推荐规则
      tseslint.configs.recommended, // ts的推荐规则
      reactHooks.configs.flat.recommended, // React Hooks必须遵守的规则
      reactRefresh.configs.vite, // Vite项目特有的规则
    ],
    languageOptions: {
      ecmaVersion: 2020, // 支持ES2020标准的语法
      globals: globals.browser, // 告诉ESlint代码是在浏览器里跑的（这样就不会误报全局变量了）
    },
  },
])

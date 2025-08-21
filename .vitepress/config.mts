import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  cleanUrls: true, // 清理URL中的.html后缀
  srcDir: 'docs',
  outDir: 'dist',
  head: [['link', { rel: 'icon', href: '/notebook.png' }]],
  title: '编程笔记-title',
  description: '编程笔记-description',
  themeConfig: {
    logo: '/notebook.png',
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' },
      {
        text: '前端',
        items: [
          { text: 'Test1', link: '/test' },
          { text: 'vue', link: '/frontend/vue' },
          { text: 'typescript', link: '/frontend/typescript/' },
        ],
      },
    ],

    sidebar: {
      test: [
        {
          text: 'Examples',
          items: [
            { text: 'Markdown Examples', link: '/markdown-examples' },
            { text: 'Runtime API Examples', link: '/api-examples' },
            { text: 'Test', link: '/test' },
          ],
        },
      ],
      '/frontend/vue': [
        {
          text: 'Vu1111e',
          // collapsed: false,
          items: [{ text: 'Vue3', link: '/frontend/vue' }],
        },
      ],
      '/frontend/typescript': [
        {
          text: 'Typescript',
          items: [
            { text: 'Typescript', link: '/frontend/typescript/' },
            { text: 'variance', link: '/frontend/typescript/variance' },
          ],
        },
      ],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/vuejs/vitepress' }],
    editLink: {
      pattern: 'https://github.com/alterman007/note-book/tree/main/docs/:path',
    },
    // footer: {
    //   copyright: 'Copyright © 2025-present bab',
    // },
  },
  vite: {
    resolve: {
      alias: {
        '@': process.cwd(),
      },
    },
    server: {
      host: true,
    },
  },
});

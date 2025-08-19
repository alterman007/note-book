import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  head: [
    ['link', { rel: 'icon', href: '/notebook.png' }],
  ],
  title: "编程笔记-title",
  description: "编程笔记-description",
  themeConfig: {
    logo: '/notebook.png',
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' },
      {
        text: 'Test',
        items: [
          { text: 'Test1', link: '/test' },
          { text: 'Test2', link: '/frontend/vue' },
        ]
      },
    ],

    sidebar: {
      'abcdefg': [
        {
          text: 'Examples',
          items: [
            { text: 'Markdown Examples', link: '/markdown-examples' },
            { text: 'Runtime API Examples', link: '/api-examples' },
            { text: 'Test', link: '/test' },
          ]
        }
      ],
      'frontend': [
        {
          text: 'Vue',
          items: [
            { text: 'Vue3', link: '/frontend/vue' },
          ]
        }
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ],
    footer: {
      copyright: 'Copyright © 2025-present bab',
    },
  },
})

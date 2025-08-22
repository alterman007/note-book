import { fileURLToPath, URL } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vitepress';

import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

const rootDir = fileURLToPath(new URL('..', import.meta.url));

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
      {
        text: '前端',
        items: [
          { text: 'vue', link: '/frontend/vue/' },
          { text: 'typescript', link: '/frontend/typescript/' },
        ],
      },
    ],

    sidebar: {
      '/frontend/vue': [
        {
          text: '源码分析',
          // collapsed: false,
          items: [{ text: '响应式', link: '/frontend/vue/reactive' }],
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
    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' },
    ],
    editLink: {
      pattern: 'https://github.com/alterman007/note-book/tree/main/docs/:path',
    },
    // footer: {
    //   copyright: 'Copyright © 2025-present bab',
    // },
  },
  vite: {
    plugins: [
      AutoImport({
        // imports: ['vue', 'vue-router'],
        // vueTemplate: true,
        include: [/\.([tj]sx?|vue)$/, /\.vue\?vue/, /\.md$/],
        resolvers: [ElementPlusResolver()],
        dts: path.resolve(rootDir, '.vitepress/auto-imports.d.ts'),
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
        dts: path.resolve(rootDir, '.vitepress/components.d.ts'),
      }),
    ],
    resolve: {
      alias: {
        '@': rootDir,
      },
    },
    // Ensure Element Plus runs under VitePress SSR
    ssr: {
      noExternal: ['element-plus'],
    },
    server: {
      host: true,
    },
  },
});

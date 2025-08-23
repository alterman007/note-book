---
sideNavTitle: '运行时'
---

# 编译过程

## 模版编译

```js
import { compile, createApp } from 'vue';
const template = `
  <div class="test">hello template</div>
`;
// 编译
const renderFn = compile(template);
// 运行
const app = createApp({
  render: renderFn,
});
app.mount('#app');
```

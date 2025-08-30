---
sideNavTitle: '运行时'
---

# 编译原理

在 [Vue Templatoe Explorer](https://template-explorer.vuejs.org) 网站上，可以在线分析 Vue 模板编译后的结果。

```html
<div>
  <h2>hello {{ name }}</h2>
  <span>static</span>
  <p :class="color">i need some drinks</p>
</div>
```

最终会被编译为（开启hoistStatic）

```js
// prettier-ignore
const _Vue = Vue

return function render(_ctx, _cache, $props, $setup, $data, $options) {
  with (_ctx) {
    const {
      toDisplayString: _toDisplayString,
      createElementVNode: _createElementVNode,
      normalizeClass: _normalizeClass,
      openBlock: _openBlock,
      createElementBlock: _createElementBlock,
    } = _Vue;

    return (
      _openBlock(),
      _createElementBlock('div', null, [
        _createElementVNode(
          'h2',
          null,
          'hello ' + _toDisplayString(name),
          1 /* TEXT */,
        ),
        _cache[0] ||
          (_cache[0] = _createElementVNode(
            'span',
            null,
            'static',
            -1 /* CACHED */,
          )),
        _createElementVNode(
          'p',
          {
            class: _normalizeClass(color),
          },
          'i need some drinks',
          2 /* CLASS */,
        ),
      ])
    );
  }
};

// Check the console for the AST
```

## 靶向更新

可以看到模版编译后生成的 render 函数与自己手写jsx 或者 h函数有略有不同，Vue3 模板编译器生成 VNode 时的会添加优化标记，明确vnode更新时，这个节点**哪些部分需要追踪更新**，减少不必要的 diff，提高渲染性能。

1. `createElementBlock` 在创建 VNode 时，第四个参数 `patchFlag`，即 vue compiler 用来告诉运行时**这个节点哪些部分需要追踪更新**,常见值包括`1(TEXT)`、`2(CLASS)`、`4(STYLE)`、`8(PROPS)`等

2. `openBlock` 的作用就是建立一个收集上下文，将之后生成的动态子节点会被 **拍平** 收集进去，后续 更新子节点时，只需要线性处理收集的动态节点，不需要再深度的遍历diff

3. `catch` 变量更进一步，会将 **静态提升** ，更新时直接复用（即甚至不会创建新的 VNode），更不会参与到 diff过程。

4. `createStaticVNode` 在大量静态节点时使用，参考 Static 类型 VNode解释

5. 函数缓存：缓存事件，避免每次创建虚拟节点时，都要创建新函数

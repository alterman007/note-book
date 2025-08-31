---
sideNavTitle: '运行时'
---

<script setup>
// import CodeVar from '@/components/CodeVar.vue';
import vnodeSrc from './imgs/vnode.jpg'
</script>

# 运行时原理分析

vue 的运行时的核心过程是

1. 创建虚拟节点（VNode） 节点
2. 通过挂载/更新（patch） VNode 节点，创建/更新真实的DOM节点

这个过程最关键的一步就是 [Diff 算法](#diff-算法)，其目标是根据新旧虚拟节点（VNode）的差异，以最小代价更新真实 DOM。

## 创建VNode

VNode 就是一个普通的 javascript 对象，真实 DOM 节点的一种轻量级描述，其中核心字段：

- `type`：节点类型（HTML 标签名、组件、内置类型如 Text、Fragment）。
- `shapeFlag`：渲染类型标识符，决定 VNode 在后面 render 过程的采取的 渲染方式。
- `props`：属性/事件监听器。
- `children`：子节点，可以是字符串（文本）、数组（多个子 VNode）、单个 VNode。
- `key`：唯一标识，用于 Diff 优化。
- `el`：渲染后对应的真实 DOM 元素。
- `component`：如果是组件 VNode，会挂载组件实例。

::: info 项目中操作VNode
在实践过程中，在需要复杂的动态渲染，自定义渲染逻辑，难以避免直接操作（创建/修改 VNode）的场景，使用时务必要注意避免滥用：

1. 可维护性：相比于声明式代码（模版或者jsx），VNode的使用会降低代码可读性和可维护性，在框架/通用组件代码中使用时应尽量将对 VNode 的操作封装在组件或者模块内部，对外隐藏内部实现逻辑，而在业务代码中甚至应该禁止操作VNode。
2. 易出现bug：VNode 的结构非常灵活，操作时应注意是否能够覆盖多种情况，此外还要避免修改已有 VNode，应在使用 `h()` `cloneVNode()`等操作后再手动操作 VNode。
3. 降低性能：vue 在编译模版时，会给生成 VNode 上添加静态标记，提升后续更新时的性能，而手写 VNode 往往缺乏这些优化

:::

<ElImage :src="vnodeSrc" :previewSrcList="[vnodeSrc]" />

## 渲染过程

渲染过程代码量巨大，本文主要记录源码中 render 过程的在处理 VNode 处理流程：
render 函数所有对vnode对处理是都是`patch`函数，具体回根据 VNode 的不同分为以下几类：

1. 静态渲染类型：
   - Text：渲染文本节点
   - Comment：渲染注释节点
   - Static：处理静态类型（一般是模版编译优化时，存在大量的静态节点时由编译器使用），静态类型是模版编译过程为优化而创建的简单VNode类型，其挂载（通过 document.createElement('fragment')管理渲染内容）和更新只需要处理dom创建移动操作。由于直接通过 templateContainer.innerHTML 创建dom，因此手动使用createStaticVNode 创建时，需要注意字符串内容是否可信。
2. Fragment：
   - 处理 Fragment 类型，这个类型的存在，允许vue3 中组件返回多个根节点。内部主要处理通过 `patchChildren` 处理子元素
3. ShapFlags.Element
   - 处理普通的dom元素 例如 `<div />` `<input />` 等
4. ShapeFlags.COMPONENT 处理函数组件和有状态组件的渲染
   - 创建组件实例`instance`，并挂载到 vnode.componet 上，`instance`也会通过 vnode 指向 虚拟节点，两者互相引用
   - 设置组件实例，会对 setup ，options API 处理，包括调用 beforeCreate Created 生命周期函数，设置其他生命周期函数钩子，使用 reactive 包裹data option返回等对象 等
   - 创建 ReactiveEffect 实例，包裹 组件渲染/更新 函数 `componentUpdateFn`，实现组件等响应式更新
   - `componentUpdateFn`内部会调用render 函数返回 subTree VNode，并递归 `patch`，处理生命周期钩子函数

5. 其他组件 `Teleport` `KeepAlive` `BaseTransition`
   - 这些组件的处理比较特殊，他们

6. `Suspense` 暂未学习

## Diff 算法

diff 算法渲染过程中最著名的算法，在源码中对应的 `patchKeyedChildren` 函数的实现，算法的整个过程包含5个步骤：

1. 从前向后对比
2. 从后向前对比
3. 处理新增的情况
4. 处理卸载的情况
5. 乱序对比
   - 5.1 遍历新节点，构建 `keyToNewIndexMap` ，记录 vnode.key 到新vnode 索引的映射
   - 5.2 遍历旧节点，构建 `newIndexToOldIndexMap` ，记录 新节点在旧 数组中位置，并卸载旧节点，以及记录是否存在需要移动的vnode
   - 5.3 使用 `newIndexToOldIndexMap` 计算 不需要最长递增子序列 `increasingNewIndexSequence`，移动的vnode， 遍历新节点，挂载 `newIndexToOldIndexMap` 中未记录的节点，移动不在 `newIndexToOldIndexMap` 中记录的节点

在真实项目中，对数组的操作很多都是：

1. 修改数组某一项或者某几项的数据
2. 在数组队首或者队尾新增一条或多条数据
3. 在数组队首或者队尾删除一条或多条数据

diff算法的前四个简单步骤，已经可以很好的应上面对数组的常见操作。难点在于第5步 乱序对比 的处理：

为了尽可能的减少dom操作，diff算法 通过计算出 最长公共子序列，确定不会变动的 vnode，然后以这些vnode为锚点，对其余的 vnode 进行挂载（增加）、卸载（删除）、移动操作。

对 vnode 的最长的公共子序列的计算是通过计算新的 vnode 在老 vnode数组中的索引位置，转化为对索引数组求最长递增子序列（diff算法的核心算法）。在源码中对应 `getSequence` 函数。

```js
function getSequence(source) {
  const record = Array.from(source).fill(0);
  const result = [0];

  for (let i = 0; i < source.length; i++) {
    const arrI = source[i];
    const lastIndex = result[result.length - 1];
    if (source[lastIndex] < arrI) {
      record[i] = lastIndex;
      result.push(i);
      continue;
    }

    let left = 0;
    let right = result.length - 1;
    while (left < right) {
      const mid = (left + right) >> 1;
      if (source[result[mid]] < arrI) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    if (source[result[left]] > arrI) {
      record[i] = result[left - 1];
      result[left] = i;
    }
  }
  let i = result.length;
  let last = result[i - 1];
  while (i-- > 0) {
    result[i] = last;
    last = record[last];
  }
  return result;
}
```

这里对算法做几个必要的说明：

1. 这里的算法返回的是 最长递增子序列的索引位置，而不是最长递增子序列本身；
2. 这里的代码于vue 源码中略有不同，源码中对于数据 0 不做处理，对应于 vue 源码中 在计算 索引位置时做了[+ 1 处理](https://github.com/vuejs/core/blob/v3.2.37/packages/runtime-core/src/renderer.ts#L1939)，因此 0值 在vue diff 中没有意义。
3. 对算法的理解有困难的话，可以从网上找视频进一步理解

::: tip 为什么对索引 +1
算法中 `newIndexToOldIndexMap` 数组被初始化为0，如果直接保存 新 vnode 在 旧vnode数组中的位置，这里的 0 会有歧义，一是新vnode 未在新数组中找到，二是新 vnode 在 旧vnode数组 的索引位置0上。对索引位置 + 1之后，可以保证 如果 `newIndexToOldIndexMap` 的某一项为0，说明 对应的 vnode 是新增节点。此外由于 getSequence 返回的是在 新vnode数组 不需要移动的 vnode 的索引位置，因此 这里实际上 +1， +2 无关紧要。
:::

## provider, inject

provider, inject 的实现比较简单，组件内部调用 provide 保存的 属性 被放在组件实例的 `provides` 属性对象上，该对象[通过原型链指向](https://github.com/vuejs/core/blob/v3.2.37/packages/runtime-core/src/apiInject.ts#L55)父组件实例的 provides。

最总在inject 注入过程中，访问 provides[key]时， 可以利用 javascript 访问属性自动向原型链查找的特性最终获取到最近祖先节点注入的属性数据。

## createApp

这里主要介绍 createApp 返回的变量中 app 非常重要的一个属性 [`_context`](https://github.com/vuejs/core/blob/v3.2.37/packages/runtime-core/src/apiCreateApp.ts#L201)，

context 本身是一个普通对象，但是源码中可以看到，通过 app.component、app.directive、app.mixin 方法调用注册的全局组件、指令、mixins 都可以属性的方式存储在context中，并以 `app._context` 对外暴露。

如果我们在代码中通过 `resolve*`系列函数（例如 `resolveComponent`） 查找组件、指令、mixin时，内部会分别从 组件实例对象、组件本身、组件实例等appContext属性上查找，组件实例的appContext属性源自于父组件实例，并最终会为 app._context。

因此在我们手动操作 VNode 时，如果需要全局注册的组件、指令等信息，可以通过 `vnode.appContext = app._context` 的方式实现
::: tip 提示
`resolveComponent` 函数通常在模版编译生成的代码中调用：
```html
<Header v-events.sync="hello" />
```
会被编译为
```js
import { resolveComponent as _resolveComponent, resolveDirective as _resolveDirective, withDirectives as _withDirectives, openBlock as _openBlock, createBlock as _createBlock } from "vue"

export function render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_Header = _resolveComponent("Header")
  const _directive_events = _resolveDirective("events")

  return _withDirectives((_openBlock(), _createBlock(_component_Header, null, null, 512 /* NEED_PATCH */)), [
    [
      _directive_events,
      _ctx.hello,
      void 0,
      { sync: true }
    ]
  ])
}
```
:::
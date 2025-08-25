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

## Diff 算法

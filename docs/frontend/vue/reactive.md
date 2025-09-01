---
sideNavTitle: 响应式模块实现
outline: [2, 3]
---
<script setup>
import CodeVar from '@/components/CodeVar.vue';
import reactiveSrc from './imgs/reactive.jpg'
import refSrc from './imgs/ref.jpg'
import computedSrc from './imgs/computed.jpg'
import watchSrc from './imgs/watch.jpg'
</script>
# 响应式原理分析

## 浏览器api功能对比

- [Object.defineProperty](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) 的 [缺陷](https://v2.cn.vuejs.org/v2/guide/reactivity.html#%E6%A3%80%E6%B5%8B%E5%8F%98%E5%8C%96%E7%9A%84%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9)，由于Object.defineProperty() 方法是在一个对象上定义一个新属性或修改其现有属性。因此 vue2中需要遍历对象的每一个属性，设置属性描述符，从而实现其响应式系统。而Object.defineProperty 不能检测新增对象属性、修改数组长度等操作。
  导致vue2不能保证这些操作的响应性。

```js
const obj = {
  price: 4,
  _weight: 3, // 使用前缀_表示对象内部属性
};

Object.defineProperty(obj, 'weight', {
  get() {
    return obj._weight;
  },
  set(v) {
    obj._weight = v;
    effect();
  },
});

let total = obj.price * obj.weight;
function effect() {
  total = obj.price * obj.weight;
}

console.log(total);
obj.weight = 5;
console.log(total);
```

- [proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy) 通过创建一个代理对象，实现对属性查找、赋值、枚举、函数调用等基本操作的拦截和自定义。对比Object.DefineProperty，proxy拦截的是操作，而不是特定的属性，因此vue3中 可以拦截 对象新增属性，修改数组长度等操作

```js
const obj = {
  price: 4,
  weight: 3,
};

const proxyObj = new Proxy(obj, {
  // target：被代理对象obj，key：属性，value：值，receiver：代理对象proxyObj
  set(target, key, value, receiver) {
    const res = Reflect.set(target, key, value, receiver);
    effect();
    return res;
  },
  get(target, key, receiver) {
    return Reflect.get(target, key, receiver);
  },
});

let total = proxyObj.price * proxyObj.weight;
function effect() {
  total = proxyObj.price * proxyObj.weight;
}
console.log(total);
// 这里必须使用代理对象
proxyObj.weight = 5;
console.log(total);
```

## reactive、effect 的实现

reactive 的实现比较简单，配合 effect 函数内部创建副作用对象，在代理对象的get、set操作中，在get中收集副作用对象，在后面的set中触发副作用对象即可。

::: tip 副作用对象解释
本文所说的副作用对象 指源码中的 `ReactiveEffect` 实例对象，所说的收集、触发副作用，指的是 `ReativeEffive` 实例的收集和触发，其内部保存了依赖变化时，需要重新运行的函数，例如computed的`getter函数`，effect函数的`第一个参数`等
:::

这里副作用对象的收集和触发依赖全局变量 `activeEffect`（这里的全局变量的含义不是说 activeEeffect 在全局作用域内，
而是说，activeEffect 在整个代码的运行过程中，有且只有一份，并且可以通过import语句导入自由获取）。

这里要说明，vue响应式的设计 只能支持函数同步执行过程中的依赖收集，原因是依赖收集是发生在 getter 函数的执行过程中，并且收集的副作用对象由activeEffect 变量保持，而 getter 函数是同步的，这俩者决定了vue 所有的依赖收集只能同步。

::: info javascript的限制
这个问题的本质是 javascript 语言本身的限制，javacript 的执行是单线程的，其并发执行依赖于事件循环，事件循环配合 生成器/async 语法糖 本质是[协程](/program/operator/coroutine)（一种用户级线程，尽管js的所有权威文档都没有协程的概念，包括 [mdn](https://developer.mozilla.org/zh-CN)，[ecma spec](https://tc39.es/ecma262/)，[google](https://web.dev/?hl=zh-cn)，[nodejs](https://nodejs.org/zh-cn) ），js 用户对执行上下文的切换控制有限，也没有提供协程上下文变量的概念。这些设计大幅简化了程序员在并发编程下的心智负担，但也限制了 vue的响应性设计中 对异步代码的执行过程中的依赖收集。
:::

具体源码如下

<ElImage :src="reactiveSrc" :previewSrcList="[reactiveSrc]" />

```html
<h1 id="app"></h1>
<script type="module">
  import { reactive, effect } from '../dist/vue.esm.js';
  const proxyObj = reactive({
    name: 'world',
    age: 18,
  });
  effect(() => {
    document.getElementById('app').innerHTML = proxyObj.name;
  });
  setTimeout(() => {
    proxyObj.name = 'alterman';
  }, 1000);
</script>
```

## ref 的实现

::: info 为什么需要ref
reactive 的实现是基于proxy的，而proxy的第一个参数只能是对象，以及其拦截的是操作对象的行为（属性查找、赋值、枚举、函数调用），对于变量的修改是无法进行拦截的，以此如果想要实现数据的整体替换，尤其是字符串、数值、布尔值的修改，必须添加额外的一层包裹
:::

::: info [为什么推荐使用 ref 而不是reactive ?](https://cn.vuejs.org/guide/reusability/composables#return-values)
网上传言，官方推荐使用ref，而不是reactive，个人认为，这个描述并不准确，

1. 官方推荐的是 在 开发 组合式API的情况下使用ref ，优势是可以保证解构之后的响应性，
2. 确实，在基本类型（string，number，boolean、Map，Set）下，以及获取组件实实例或者dom元素的情况下必须使用ref/shallowRef `<h1 ref="domRef" />`

但并不说明，我们就应该更多的使用ref，事实上，`ref(value)` 与 `reactive({ value })` 两者并无本质区别，在了解响应性原理，避免可以预见的bug情况下，选择更合适的api才是程序员该做出的选择。
:::
ref实现的关键是，使用RefImpl 对数据进行包裹，通过对`value`访问器属性 的get，set操作，实现副作用的依赖收集和触发操作

具体过程如下

<!-- 1. 创建RefImpl对象
2. 记录数据时，如果数据时对象，使用reactive包裹，保证内部数据的响应性
3. getter 过程收集依赖
4. setter 过程判断值变化手触发依赖 -->

<ElImage :src="refSrc" :previewSrcList="[refSrc]" />

```html
<h1 id="app1"></h1>
<h1 id="app2"></h1>
<script type="module">
  import { ref, effect } from '../dist/vue.esm.js';
  const name = ref('world');
  const obj = ref({
    name: 'world',
    age: 18,
  });
  effect(() => {
    document.getElementById('app1').innerHTML = name.value;
  });
  effect(() => {
    document.getElementById('app2').innerHTML = obj.value.name;
  });

  setTimeout(() => {
    name.value = 'alterman';
    obj.value.name = 'alterman';
  }, 1000);
</script>
```

## computed 的实现

要实现computed，我们给 `ReactiveEffect` 添加了第二参数 scheduler (调度器)。

but why？

1. 在依赖收集阶段。对比reactive、ref ，属性修改即触发副作用。但是computed 不是，computed的 value 访问器get函数，只有当计算属性的结果被使用的时候，才会执行，与此同时才会收集依赖。并且在自身 `effect.run` 的过程中进一步触发内部响应属性依赖的收集
2. computed的 setter 本身不是用来触发 副作用执行的，只是普通的函数调用。
3. 如果 getter 内部依赖的响应数据发生改变时，computed 并不是直接触发getter 的执行，而是仅仅是标记 `_dirty` 为true，并进一步触发 value 访问器 get 函数执行过程中收集的副作用，当这些副作用通过computed.value 获取数据时，才会真正重新执行getter
4. 因此实现computed，我们给 `ReactiveEffect` 添加调度器，调度器只触发副作用，至于getter函数是否执行，则取决于副作用的执行过程中，是否用到了 computed.value
5. 作为对比，`ReactiveEffect`实例对象的第一个函数参数始终用于依赖收集，当没有 `scheduler`的时候，依赖触发会导致第一个函数参数的执行，有`scheduler`的时候，执行调度器，给用户自定义副作用的行为方式

为便于理解，以下先 给出官方源码 computed 收集完依赖后，但是副作用的执行，并不会导致getter触发的调用示例

```html
<h1 id="app"></h1>
<script type="module">
  import {
    computed,
    reactive,
    effect,
  } from 'https://cdn.bootcdn.net/ajax/libs/vue/3.2.37/vue.esm-browser.js';

  const person = reactive({
    name: 'world',
    age: 18,
  });
  const greet = computed(function greetGetter() {
    // computed 内部 person 的依赖收集
    console.log('执行 computed getter');
    return `hello ${person.name}`;
  });
  let count = 0;
  effect(function print() {
    console.log('print 函数执行');
    if (count === 0) {
      // 这里会触发 computed 的依赖收集
      document.getElementById('app').innerHTML = greet.value;
      count++;
      return;
    }
    //
  });
  setTimeout(() => {
    // 这里的修改，会触发 上面 print 函数的执行。
    // 过程是，set person.name 触发 computed 调度器的执行，
    // 调度器内部会触发 print 的依赖收集，
    // 但是print函数内部由于没有执行 greet.value, 因此不会导致 greetGetter 的执行
    person.name = 'alterman';
  }, 1000);
</script>
```

```txt
最终的打印结果是：
1. print 函数执行
2. 执行 computed getter
3. print 函数执行
4. 执行 computed getter ❌ 这一行不会打印
```

::: danger 注意版本
本示例代码基于3.2.37，如果切换到到最新版本3.5.18，发现执行顺序为

1. print 函数执行
2. 执行 computed getter
3. 执行 computed getter
4. print 函数执行

debug 源码发现，新版本中的 副作用执行策略有变，会固定的先调用 getter 重新计算值，在调用相应的副作用函数，但是这并不影响对vue的响应性原理的整体理解
:::
<ElImage :src="computedSrc" :previewSrcList="[computedSrc]" />

```html
<h1 id="app"></h1>
<script type="module">
  import { computed, reactive, effect } from '../dist/vue.esm.js';
  const person = reactive({
    name: 'world',
  });
  const greet = computed(function greetGetter() {
    console.log('执行 computed getter');
    return `hello ${person.name}`;
  });
  effect(function print() {
    document.getElementById('app').innerHTML = greet.value;
    document.getElementById('app').innerHTML = greet.value;
  });
  setTimeout(function resetProps() {
    person.name = 'alterman';
  }, 1000);
</script>
```

### computed 执行流程分析

computed的源码虽然简短，但是其执行流程相比reactive 的副作用收集、触发过程复杂很多，因此有必要围绕 `ReactiveEffect` 实例的创建、收集、触发 描述下其执行流程：

1. `const person = reactive({ name: 'world' });` 只是创建一个代理对象
2. `const greet = computed(function greetGetter() {...}` 创建 `ComputedRefImpl`实例，标记为 `computedRef`，内部创建了第一个 `ReactiveEffect` 实例标记为 <CodeVar>computedEffect</CodeVar>
3. `effect(function print() {...})` 开始变得复杂
   - effect 内部创建第二个 `ReactiveEffect` 实例，标记为 <CodeVar>baseEffect</CodeVar>，其内部的 run 函数 将 activeEffect 设置为 <CodeVar>baseEffect</CodeVar>，然后开始执行 print 函数
   - print函数内部取得 greet.value ，触发 `ComputedRefImpl` value 的getter 函数执行，开始 **第一次** 副作用 收集，收集的对象是 <CodeVar>baseEffect</CodeVar>，存放于 `computedRef`的dep属性中。
   - 之后 `this.effect.run()` 的执行 修改 `activeEffect` 为 <CodeVar>computedEffect</CodeVar>，内部导致 `greetGetter` 函数的执行，`greetGetter`函数触发`person.name`的 **第二次** 依赖收集，收集的对象是<CodeVar>computedEffect</CodeVar>，存放于 `targetMap[personTarget]['name']`中
   - print 内部执行第二条 `greet.value` 语句，再次触发 `ComputedRefImpl` value 的getter 函数内部的依赖收集，此时 `activeEffect` 为 <CodeVar>computedEffect</CodeVar>，存放于 `computedRef`的dep属性中。
   - 依赖收集结束，最终 `computedRef` 内保存 两个 副作用对象，分别是<CodeVar>baseEffect</CodeVar>、 <CodeVar>computedEffect</CodeVar>， `targetMap[personTarget]['name']` 中收集 一个副作用对象 <CodeVar>computedEffect</CodeVar>
4. 1s后，`resetProps` 函数执行，开发触发副作用对象的执行顺序
   - `person.name` 的setter 触发 `targetMap[personTarget]['name']` 内的副作用对象<CodeVar>computedEffect</CodeVar>的执行，对应 <CodeVar>computedEffect</CodeVar>内的调度器器开始执行。
   - <CodeVar>computedEffect</CodeVar>的调度器开始触发 `computedRef` 内保存的两个副作用对象执行，这里要注意副作用对象的执行顺序，先执行计算属性的副作用对象<CodeVar>computedEffect</CodeVar>（第二次执行），在执行代理对象的副作用对象<CodeVar>baseEffect</CodeVar>，从而触发 `print` 函数的执行，并进一步触发 `greetGetter` 的重新执行

::: warning 副作用的执行顺序
这里 `computedRef` 内调度器触发的依赖执行顺序很重要，必须先执行计算属性副作用<CodeVar>computedEffect</CodeVar>，在执行代理对象副作用 <CodeVar>baseEffect</CodeVar>。

因为<CodeVar>baseEffect</CodeVar>会触发`computedRef`的 `value getter`的执行，<CodeVar>computedEffect</CodeVar> 会触发调度器的执行， `value getter` 将 \_dirty 属性先修改为false，调度器将 \_dirty 属性先修改为true，最终导致死循环
:::

## watch 的实现

watch 函数的响应性是基于`reactive`, `ref`, `computed`, `ReactiveEffect` 前面的 api 实现的，watch的职责 是调度，核心是控制第二个参数 `callback` 的执行时机.

要实现 watch，对比 `ReactiveEffect` 的调度器是用于自定义触发副作用的处理函数, runtime-core 包中 scheduler.ts 文件的功能，这里的调度用于异步执行回调函数，通过 `Promise.reslove().then(cb)` 将回调任务放到微队列中执行。

watch 函数内部的 getter 包装source，实现副作用的收集，scheduler 变量 包装cb， 用于控制cb的执行时机。
<ElImage :src="watchSrc" :previewSrcList="[watchSrc]" />

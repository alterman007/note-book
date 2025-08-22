---
sideNavTitle: 响应式模块实现
---

# vue的响应式设计

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

reactive 的实现关键是在代理对象的get、set操作中，在get中收集副作用对象，在后面的set中触发副作用对象。
这里的副作用对象，记录了effect函数传入的函数

具体过程如下

<ElImage :src="reactiveSrc" :previewSrcList="[reactiveSrc]" />

<script setup>
import reactiveSrc from './reactive.jpg'
import refSrc from './ref.jpg'

</script>

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

但并不说明，我们就应该更多的使用ref，事实上，`ref(value)` 与 `reactive({ value })` 两者并无本质区别，在了解响应性原理下，避免可以预见的bug情况下，选择更合适的api才是程序员该做出的选择。
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

要实现computed，我们给 ReactiveEffect 添加了第二参数 scheduler (调度器)。

but why？

1. 在依赖收集阶段。对比reactive、ref ，属性修改即触发副作用。但是computed 不是，computed的 value 访问器get函数，只有当计算属性的结果被使用的时候，才会执行，与此同时才会收集依赖。并且在自身 `effect.run` 的过程中进一步触发内部响应属性依赖的收集
2. computed的 setter 本身不是用来触发 副作用执行的，只是普通的函数调用。
3. 如果 getter 内部依赖的响应数据发生改变时，computed 并不是直接触发getter 的执行，而是仅仅是标记 `_dirty` 为true，并进一步触发 value 访问器 get 函数执行过程中收集的副作用，当这些副作用通过computed.value 获取数据时，才会真正重新执行getter
4. 因此实现computed，我们给 ReactiveEffect 添加调度器，调度器只触发副作用，至于getter函数是否执行，则取决于副作用的执行过程中，是否用到了 computed.value

为便于理解，以下先 给出computed 收集完依赖后，但是副作用的执行，并不会导致getter触发的调用示例

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
print 函数执行
执行 computed getter
print 函数执行
执行 computed getter ❌ 这一行不会打印
```

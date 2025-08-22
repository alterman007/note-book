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

<ElImage src="./reactive.jpg" previewSrcList="srcList" />

<script setup>
import { ElImage } from 'element-plus';
</script>

```html
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

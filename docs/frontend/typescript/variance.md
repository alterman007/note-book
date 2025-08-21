---
siderNavTitle: 如何理解Covariance & Contravariance
---

# 协变、逆变、双向协变

协变（Covariance）、逆变（contravariance）、双向协变（bivariance）

## 子类型

子类型是多态性的一种形式，其中子类型通过某种形式的可替代性与基类型相关联。

可替代性意味着基类型的变量也可以接受子类型的值

例如，让我们定义一个基类 User 和一个扩展 User 类的类 Admin：

```js
class User {
  username: string;

  constructor(username: string) {
    this.username = username;
  }
}

class Admin extends User {
  isSuperAdmin: boolean;

  constructor(username: string, isSuperAdmin: boolean) {
    super(username);
    this.isSuperAdmin = isSuperAdmin;
  }
}
```

由于 Admin 继承了 User（Admin extends User），因此可以说 Admin 是基类型 User 的子类型。

![继承](./imgs/extends.svg 'Magic Gardens'){ style="display: block; margin: auto;background: #fff" }

Admin（子类型）和 User（基类型）的可替代性包括，例如，将 Admin 类型的实例分配给 User 类型的变量的能力：

```js
const user1: User = new User('user1');         // ✅
const user2: User = new Admin('admin1', true); // ✅
```

### 辅助标记

现在我们使用符号 `A <: B` 意思是“A 是 B 的子类型”。

因为 Admin 是 User 的子类型，所以现在可以简写为：`Admin <: User`

我们还定义一个辅助类型 IsSubtypeOf<S, P>，如果 S 是 P 的子类型，则计算结果为 true，否则为 false：

```ts
type IsSubtypeOf<S, P> = S extends P ? true : false;
```

IsSubtypeOf<Admin, User> 计算结果为 true，因为 Admin 是 User 的子类型：

```ts
// 在 typescript 中可以看到 type TTrue = true
type TTrue = IsSubtypeOf<Admin, User>; // true
```

许多其他类型都可以进行子类型化，包括 javascript 字面量和内置 JavaScript 类型。

例如，字符串“Hello”是字符串的子类型，数字 42 是数字的子类型，Map<K,V>是对象的子类型。

```ts
type T12 = IsSubtypeOf<'hello', string>; // true
type T13 = IsSubtypeOf<42, number>; // true
type T14 = IsSubtypeOf<Map<string, string>, Object>; // true
```

## 协变（Covariance）

让我们思考一下获取 User 和 Admin 实例的异步代码。使用异步代码需要处理 User 和 Admin 的 promise：`Promise<User> <: Promise<Admin>`。

这里有一个有趣的问题：有 `Admin <: User`，是否意味着 `Promise<Admin> <: Promise<User>` 也成立？

```ts
type T21 = IsSubtypeOf<Promise<Admin>, Promise<User>>; // true
```

如果 `Admin <: User`，则 `Promise<Admin> <: Promise<User>` 确实成立。这表明 Promise 类型是协变的。

![协变](./imgs/covariance.svg 'Magic Gardens'){ style="display: block; margin: auto;background: #fff" }

::: tip 协变定义
**对于类型 T， 如果 `S <: P`，有 `T<S> <: T<P>` 则为协变**
:::

类型的协变性是直观的。如果 Admin 是 User 的子类型，那么你可以认为 `Promise<Admin>` 也是 `Promise<User>` 的子类型。

协变适用于 TypeScript 中的许多类型。

- `Promise<V>`

- `Record<K,V>`:

```ts
type RecordOfAdmin = Record<string, Admin>;
type RecordOfUser = Record<string, User>;
type TRecord = IsSubtypeOf<RecordOfAdmin, RecordOfUser>; // true
```

- `Map<K,V>`:

```ts
type MapOfAdmin = Map<string, Admin>;
type MapOfUser = Map<string, User>;
type TMap = IsSubtypeOf<MapOfAdmin, MapOfUser>; // true
```

## 逆变（Contravariance）

考虑以下泛型类型：

```ts
type Func<Param> = (param: Param) => void;
```

`Func<Param>`创建具有一个类型参数的函数类型Param。

有`Admin <: User`，下列哪个表达式为真：
`Func<Admin> <: Func<User>`，或者 `Func<User> <: Func<Admin>`？

让我们尝试一下：

```ts
type T31 = IsSubtypeOf<Func<Admin>, Func<User>>; // false
type T32 = IsSubtypeOf<Func<User>, Func<Admin>>; // true
```

`Func<User> <: Func<Admin>`成立，这意味着`Func<User>`是`Func<Admin>`的子类型。与原始类型相比，子类型的方向相比原始类型`Admin <: User`已经翻转。

Func类型的这种行为使其为 逆变 的。一般来说，函数类型就其参数类型而言是 逆变 的。
![逆变](./imgs/contravariance.svg 'Magic Gardens'){ style="display: block; margin: auto;background: #fff" }

::: tip 逆变定义
**对于类型 T， 如果 `S <: P`，有 `T<P> <: T<S>` 则为逆变**
:::

函数类型的子类型化方向与参数类型的子类型化方向相反。

```ts
type FuncUser = (p: User) => void;
type FuncAdmin = (p: Admin) => void;

type T31 = IsSubtypeOf<Admin, User>; // true
type T32 = IsSubtypeOf<FuncUser, FuncAdmin>; // true
```

## 函数子类型

函数子类型的有趣之处在于它结合了协变和逆变。

::: info
**如果函数类型的参数类型与基类型的参数类型逆变，并且返回类型与基类型的返回类型协变，则该函数类型是基类型的子类型。**
:::

也就是说 函数的子类型要求参数类型是逆变的，而返回类型是协变的。

![逆变](./imgs/function-types.svg 'Magic Gardens'){ style="display: block; margin: auto;background: #fff" }

例如

```ts
type SubtypeFunc = (p: User) => '1' | '2';
type BaseFunc = (p: Admin) => string;

type T41 = IsSubtypeOf<SubtypeFunc, BaseFunc>; // true
```

`SubtypeFunc <: BaseFunc` 的原因：

- 参数类型是逆变的（子类型转换方向相反，`User :> Admin`）
- 返回类型是协变的（子类型转换方向相同，`'1' | '2' <: string`）。

了解子类型有助于理解函数类型的可替换性。 例如，假设有一个 Admin 实例列表：

```ts
const admins: Admin[] = [
  new Admin('john.smith', false), // br
  new Admin('jane.doe', true),
  new Admin('joker', false),
];
```

admins.filter(...) 接受哪些类型的回调？ 显然，它接受一个带有 Admin 类型参数的回调：

```ts
const superAdmins = admins.filter((admin: Admin): boolean => {
  return admin.isSuperAdmin;
});

console.log(superAdmins); // [ Admin('jane.doe', true) ]
```

但是 admins.filter(...) 会接受参数类型为 User 的回调吗？

```ts
const jokers = admins.filter((user: User): boolean => {
  return user.username.startsWith('joker');
});

console.log(jokers); // [ Admin('joker', false) ]
```

admins.filter() 接受 (admin: Admin) => boolean 基类型，也接受其子类型，如 (user: User) => boolean。

如果高阶函数接受特定类型的回调，例如 (admin: Admin) => boolean，那么您还可以提供特定类型的子类型的回调，例如 (user: User) => boolean。

## 结论

如果类型 T 具有两个类型 `S <: P`，则类型 `T<S> <: T<P>`（子类型方向保持不变），则类型 T 是协变的。协变类型的一个例子是 `Promise<T>`。

但是，如果 `T<P> <: T<S>`（子类型方向相反），则类型 T 是逆变的。

函数类型根据参数类型逆变，但根据返回类型协变。

## 参考

- [typescript中逆变与协变](https://dmitripavlutin.com/typescript-covariance-contravariance/)

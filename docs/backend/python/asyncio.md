# asyncio 使用

asyncio 适用于I/O密集型任务，例如文件读写，socket通信。特点是可以并发的执行多个任务，这些任务不需要占用过多的CPU的资源。要上手asyncio，需要理解几个概念

[[toc]]

## [事件循环](https://docs.python.org/3/library/asyncio-eventloop.html)

事件循环是一种调度机制，实现在单个线程中并发处理和管理多个任务（注意：不是说只能在单线程中使用）。

事件循环的工作流程：

1. 注册任务：事件循环流程的第一步是注册需要执行的任务或函数。这些任务在 Python 中也称为协程。事件循环内部会维护这些任务的队列。
2. 事件检测：事件循环持续检查新事件。事件可以是任何触发函数或任务的事件，例如用户操作、系统事件（I/O读写事件）或特定时间间隔。
3. 任务执行：检测到事件时，事件循环会查看队列并开始执行与该事件关联的任务。在单线程中，事件循环一次只能执行一个任务。但是，任务可以主动或者被动的让出CPU，切换到其他任务，从而实现并发，。
4. 回调执行：如果任务关联了回调函数，事件循环会在任务完成后执行该回调。

事件循环内部需要维护几个关键的数据结构：

1. 用于存放已准备好运行的任务的就绪队列
2. 用于存放已安排回调的回调队列
3. 一个用于监控 I/O 事件的文件描述符列表
4. 基于时间的事件列表

```python
while True:
  events = selector.select(timeout=next_scheduled_event)
  process_events(events)
  process_callbacks()
  process_scheduled_tasks()
```

## coroutine

通过使用 `async def` 定义的函数，即为协程函数。

调用协换函数的返回结果称为协程对象，但是函数内部代码不会被执行，协程函数的执行需要使用 await 关键字修饰。

await 关键字只能在 async 函数中使用

```python:line-numbers {18,19}
import asyncio

# 定义coroutine function 模拟网络请求
async def fetch_data(delay):
  print("fetch dataing")
  await asyncio.sleep(delay)
  print("data fetched")
  return { "data": "some data" }

async def main():
  print("start of main coroutine")
  # 调用coroutine function 返回coroutine object
  co1 = fetch_data(1)
  co2 = fetch_data(2)
  # 此时 coroutime 不会执行
  print("run before fetch data")
  # 必须通过 await 才能执行协程
  result = await co1
  result = await co2
  print("run until fetch data return", result)

# 启动 事件循环，内部会 await coroutine对象
asyncio.run(main())
```

上面的代码，即使我们同步执行了两次fetch_data，但是由于我们没有 `await`，导致两次fetch_data不能并发的执行。

## tasks

想要同步多个协程同步执行，我们需要创建 task，

```python:line-numbers {10-12}
import asyncio

async def fetch_data(id, sleep_time):
  print (f"coroutine {id} starting to fetch data.")
  await asyncio.sleep(sleep_time)
  return {"id": id, "data": f"sample data from coroutine {id}"}

async def main():
  # Create tasks for running coroutines concurrently
  task1 = asyncio.create_task(fetch_data (1, 2))
  task2 = asyncio.create_task(fetch_data(2, 3))
  task3 = asyncio.create_task(fetch_data(3, 1))
  print("three task created")
  result1 = await task1
  result2 = await task2
  result3 = await task3
  print(result1, result2, result3)

asyncio.run(main())
```

或者使用 asyncio.gather 包裹

```python:line-numbers {8}
import asyncio

async def fetch_data(id, sleep_time) :
  print (f"coroutine {id} starting to fetch data.")
  await asyncio.sleep(sleep_time)
  return {"'id": id, "data": f"sample data from coroutine {id}"}

async def main():
  # Run coroutines concurrently and gather their return values
  results = await asyncio.gather(fetch_data(1, 2), fetch_data(2, 1), fetch_data(3, 3))
  # Process the results
  for result in results:
    print(f"Received result: {result}")

asyncio.run(main())
```

## 参考

- [Understanding Python’s asyncio: A Deep Dive into the Event Loop](https://medium.com/delivus/understanding-pythons-asyncio-a-deep-dive-into-the-event-loop-89a6c5acbc84)
- [Understanding the Event Loop in Python](https://thinhdanggroup.github.io/event-loop-python/)

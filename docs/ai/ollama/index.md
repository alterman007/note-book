# ollama快速上手

## ollama 命令

- **serve**: 启动 Ollama 服务。
- **create**: 使用 Modelfile 创建新模型。
- **show**: 显示特定模型的详细信息。
- **run**: 执行模型。
- **stop**: 停止正在运行的模型。
- **pull**: 下载模型。
- **push**: 将模型上传到注册表。
- **list**: 列出所有可用模型。
- **ps**: 显示当前正在运行的模型。
- **cp**: 将模型复制到新位置。
- **rm**: 删除模型。
- **help**: 显示命令帮助信息。

### ollama create

基于已有模型创建新模型：
[modelfile](https://github.com/ollama/ollama/blob/main/docs/modelfile.md) 是 ollama 的模型配置文件，可以参考该文件创建新模型。

```txt
FROM deepseek-r1:1.5b
PARAMETER temperature 0.5
PARAMETER num_ctx 1024
SYSTEM You are Sheldon Cooper from the Big Bang Theory. Answer like him only.
```

```bash
ollama create llama-own-model:1.0 -f ./modelfile.txt
```

## model 命令

执行以下命令后运行对应模型

```bash
ollama run llama-own-model:1.0
```

在repl中输入 /bye 退出 repl 环境。
除了 /bye 可以输入 /? 查询所有命令

- **/set**: 设置会话变量
- **/show**: 显示模型信息
- **/load &lt;model&gt;**: 加载会话或模型
- **/save &lt;model&gt;**: 保存当前会话
- **/clear**: 清除会话上下文
- **/bye**: 退出
- **/?, /help**: 命令帮助
- **/?**: 快捷键帮助

### /show 命令

| 命令               | 说明                                                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/show modelfile`  | 显示当前模型的 Modelfile 文件，在信息中看到原始模型文件以及我们在 `modelfile.txt` 输入的自定义信息包括 `SYSTEM` 和 `PARAMETER` 信息 |
| `/show parameters` | 显示当前模型的参数信息                                                                                                              |
| `/show system`     | 显示当前模型的系统信息                                                                                                              |
| `/show template`   | 显示当前模型的模板信息                                                                                                              |
| `/show license`    | 显示当前模型的许可证信息                                                                                                            |
| `/show info`       | 显示当前模型的信息                                                                                                                  |

### /set 命令

| 命令              | 描述                       |
| ----------------- | -------------------------- |
| `/set verbose`    | 设置当前模型的详细信息输出 |
| `/set quiet`      | 设置当前模型的安静模式输出 |
| `/set system`     | 设置当前模型的系统信息     |
| `/set parameters` | 设置当前模型的参数信息     |

### /save 命令

| 命令            | 描述                           |
| --------------- | ------------------------------ |
| `/save <model>` | 以当前会话的配置创建一个新模型 |

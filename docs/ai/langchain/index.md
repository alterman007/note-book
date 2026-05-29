# LangChain

## LangSmith

自托管平台 langfuse

## prompt template

| message type                   | Role              | 描述                                                                                       |
| ------------------------------ | ----------------- | ------------------------------------------------------------------------------------------ |
| SystemMessage                  | system            | 设置聊天模型的行为和提供额外的上下文。并非所有聊天模型提供商都支持。                       |
| HumanMessage                   | user              | 表示与模型交互的用户输入，通常以文本或其他交互输入的形式。                                 |
| AIMessage                      | assistant         | 模型返回的响应，可以包括文本或调用工具的请求。                                             |
| ToolMessage / ToolMessageChunk | tool              | 检索到外部数据或处理后将工具调用的结果传递回模型的消息。与支持工具调用的聊天模型一起使用。 |
| FunctionMessage                | function (legacy) | 对应于OpenAI的遗留函数调用API。应该使用tool角色代替。                                      |

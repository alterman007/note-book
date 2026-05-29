---
sideNavTitle: RAG
outline: [2, 3]
---

<script setup>
import architectureSrc from './imgs/rag-architecture.png'
</script>

# RAG (Retrieval-Augmented Generation)

RAG (Retrieval-Augmented Generation) is a powerful technique that enhances AI language models by combining their generation capabilities with external knowledge retrieval.

### What is RAG?

RAG is like giving an AI assistant access to a library while it's answering questions. Instead of relying solely on what it learned during training, the AI can now look up specific, current, or specialized information from external sources before generating its response.
Think of it this way: Traditional language models are like students taking a closed-book exam - they can only use what they memorized. RAG-enabled models are like students in an open-book exam - they can reference materials to provide more accurate, detailed, and up-to-date answers.

<ElImage class="mt-20px" :src="architectureSrc" :previewSrcList="[architectureSrc]" />

### rag 流程介绍

1. 用户输入问题
2. 问题通过embedding模型转换为向量
3. 向量通过faiss索引查询到最相关的文档
4. 文档通过llm模型生成回答

### rag vs prompt engineering vs fine-tuning

- rag: 通过retrieval 获取相关文档，然后通过llm模型生成回答
- prompt engineering: 通过prompt 工程化，让llm模型生成回答
- fine-tuning: 通过finetuning 让llm模型生成回答

### prompt engineering

1. [介绍 如何编写 prompt](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview)
2. [提示词案例](https://github.com/asgeirtj/system_prompts_leaks)

### document ingestion and preprocessing

1. [Lost in the Middle](https://arxiv.org/)

### query processing and retrieval

## Benefits of Combining BM25 + Semantic Search

| Benefit                                | Explanation                                                                                                                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Boosts Recall                       | BM25 may catch exact keyword matches that dense retrieval misses; dense captures meaning even if keywords differ. Together, you minimize the risk of missing relevant documents. |
| 2. Handles Synonyms and Rephrasing     | Semantic search can match "create app" with "build LLM system", even if there are no shared words. BM25 will catch exact "LLM" , "app"                                           |
| 3. Improves Retrieval Robustness       | Covers both users who search by specific terms (e.g., "LangChain agent" ) and those who use natural phrasing (e.g., "how do I use Langchain to talk to tools").                  |
| 4. Supports Lexical Importance         | BM25 scores rare keywords higher - this is crucial in technical/legal/medical contexts where a rare term (like "osteoporosis" ) should weigh heavily.                            |
| 5. Bridges Document Diversity          | In large corpora (e.g., web pages, PDFs, blogs), you often have a mix of well-structured anc loosely written text. Hybrid retrieval adapts to both.                              |
| 6. Easy to Tune via Weights            | You can easily adjust the influence of each method: e.g., score = 0.7 _ dense + 0.3 _ sparse.                                                                                    |
| 7. Helps with Misspellings or Variants | Dense models are more tolerant to typos and misspelled words (e.g., "11m aplication" ). BM25 may fail here. Together, you catch more cases.                                      |

When to Use BM25 + Semantic Search Together?
| Use Case | Why Hybrid Retrieval Helps |
| --- | --- |
| RAG Pipelines | Prevents retrieval hallucination by ensuring bath exact and fuzzy matches are considered. |
| Technical Documentation Search | Developers may search "how to use API" while the doc says "API usage" - BM25 and semantic together improve hit rate. |
| Legal/Medical QA | Some queries require precise term matching (BM25), while others need general understanding (dense). |  
| E-commerce/Product Search | "cheap noise-canceling headphones" could match "affordable ANC earbuds" - dense helps; BM25 confirms "ANC". |
| Multilingual or Cross-lingual Retrieval | Semantic models can bridge language differences; BM25 ensures matching if terms are in the same language. |
| Customer Support | Real users may type vague or keyword-heavy queries — hybrid improves retrieval reliability in chatbots/FAQs. |
| Transcripts/Unstructured Data | Speech data or emails may contain inconsistent phrasing — dense retrieval picks meaning, sparse supports clarity. |

# 如何嵌入 Generated 问卷

ReasonLab **只使用 AI 生成题（generated）**。没有 Real / 真题 分类。

---

## 插入位置

```text
data/questionnaires.ts
```

在 `questionnaires` 数组末尾追加对象 → 保存 → 刷新 `/questionnaires`。

---

## JSON 模板

```ts
{
  id: "phys1-gen-energy-01",
  title: "Physics 1 — Energy Generated Set",
  subject: "AP Physics 1",
  kind: "generated",
  description: "短描述",
  generationNote: "Claude 2026-07-21; fed kinematics samples as style reference",
  estimatedMinutes: 20,
  tags: ["energy", "generated"],
  // difficultyTier: 2,  // optional, UI later
  items: [
    {
      id: "phys1-gen-e1",
      format: "frq_half",
      conceptId: "kinematics-basics",
      conceptIntro: "Key concept: …",
      prompt: "题目……",
      visibleSteps: ["步骤1", "步骤2"],
      blankSteps: ["填空 ______"],
      hints: ["L1: …", "L2: …"],
    },
  ],
},
```

---

## format 类型

| format | 用途 |
|--------|------|
| `mcq` | 选择题（不给正确选项字母） |
| `frq_half` | 半程 FRQ |
| `fill_blank` | 填空 |
| `concept_check` | 概念简答 |
| `open` | 开放反思题 |

---

## 从 Claude / ChatGPT 粘贴时要注意

1. 改所有 `id` 为唯一英文短横线  
2. 设 `kind: "generated"`  
3. 写清 `generationNote`（哪天、哪个 AI、什么知识点）  
4. 删除 AI 可能输出的 **final answer / answer key**  
5. 保留 `hints` 和 `blankSteps`

---

## 按科目筛选

`subject` 字符串必须与列表一致，例如：

- `AP Physics 1`
- `AP Calculus AB`
- `Study Skills / AI for AP`

---

## 相关文档

- `docs/ai-workflow.md` — 完整 AI 生成与上线流程  
- `app/guide/page.tsx` — 网站内 AI Guide 页面  

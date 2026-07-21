# AI 工作流：生成题 → 嵌入网站

ReasonLab **只使用 Generated（AI 生成）题目**。  
流程：把你熟悉的题型/知识点喂给 Claude 或 ChatGPT → 得到**全新原创题** → 粘贴进网站。

---

## 一、你需要“训练 AI”吗？

**不需要（MVP 阶段）。**

| 方式 | 是什么 | 你要不要做 |
|------|--------|------------|
| **Prompt（提示词）** | 告诉 AI 科目、知识点、输出格式 | ✅ 必做 |
| **粘贴嵌入** | 把 AI 输出放进 `data/questionnaires.ts` | ✅ 必做 |
| **运行时 API** | Hint Coach 调用 Gemini 给提示 | ✅ 可选 |
| **Fine-tune 微调** | 用自己的数据训练模型 | ❌ 现在不用 |
| **RAG 知识库** | 上传 PDF 做检索 | ❌ 以后再说 |

---

## 二、安装 AI API（网站在线提示用）

### 1. 免费 Gemini Key

1. 打开 https://aistudio.google.com/apikey  
2. 创建 API Key  
3. 在项目根目录：

```bash
cp .env.example .env.local
```

4. 编辑 `.env.local`：

```
GEMINI_API_KEY=你的key
```

5. 重启：

```bash
npm run dev
```

6. 测试 `/hints` 页面

> 生成问卷题目**不需要** API —— 在 Claude/ChatGPT 网页里生成，再粘贴即可。

---

## 三、用 Claude / ChatGPT 生成题目（核心流程）

### Step 1 — 准备输入（你可以喂“你知道的题”）

不要要求 AI **照抄**原题。而是：

- 科目：AP Physics 1  
- 知识点：Kinematics, constant acceleration  
- 附 2–3 道你熟悉的题（仅作**风格参考**）  
- 要求：**全新情境、新数字、新表述**

### Step 2 — 复制这个 Prompt（英文效果通常更好）

```text
You are an AP Physics 1 question writer.

I will give you TOPIC and SAMPLE PROBLEMS for style reference only.
Create 5 ORIGINAL practice questions. Do NOT copy wording from samples or any real AP exam.

Requirements:
- formats mix: frq_half, mcq, concept_check
- each item: prompt, conceptIntro, visibleSteps (if frq_half), blankSteps, hints (no final answers)
- no answer keys, no final numeric solutions
- output valid JSON array only

TOPIC: Kinematics, 1D motion with constant acceleration

SAMPLE PROBLEMS (reference only):
1) [paste problem A]
2) [paste problem B]
```

### Step 3 — 检查 AI 输出

- 是否换了情境和数字？  
- 是否没有完整最终答案？  
- 是否有 `hints`？  

### Step 4 — 嵌入网站

打开 `data/questionnaires.ts`，追加一个对象（见 `docs/how-to-insert-questionnaires.md`）。

关键字段：

```ts
kind: "generated",
generationNote: "Claude 2026-07-21, kinematics batch",
```

保存 → 刷新 `/questionnaires`。

---

## 四、三层难度（以后做，现在可先打标签）

类型里已有可选字段 `difficultyTier: 1 | 2 | 3`（尚未在 UI 展示）。

现在可以先用 `tags`：

- `intro` / `standard` / `challenge`

或在生成 Prompt 里写：

```text
Create 3 tier-1 (intro), 3 tier-2 (standard), 2 tier-3 (challenge) questions...
```

---

## 五、上传 / 发布网站

### 本地

```bash
cd ap-reasonlab
npm install
npm run dev
```

### 上线（Vercel 免费）

1. GitHub 推送项目  
2. https://vercel.com 导入仓库  
3. 环境变量添加 `GEMINI_API_KEY`（若用 Hint Coach）  
4. Deploy  

每次改 `data/questionnaires.ts` 后 push，Vercel 自动重新部署。

---

## 六、工作流程图

```text
你知道的题 / 知识点
        ↓
Claude 或 ChatGPT（Prompt 生成全新题）
        ↓
检查：无最终答案、原创表述
        ↓
粘贴 → data/questionnaires.ts
        ↓
npm run dev 本地预览
        ↓
push GitHub → Vercel 上线
```

---

## 七、和 Hint Coach 的关系

| 功能 | 数据从哪来 |
|------|------------|
| Generated Sets 页面 | 静态文件 `data/questionnaires.ts` |
| Hint Coach 实时提示 | 运行时调用 `/api/hints` + Gemini |

两套可以并存：题库是静态嵌入；Hint Coach 是动态 API。

---

## 八、原则（再次强调）

- ✅ 用 AI **生成新题**  
- ✅ 用你知道的题当**参考**，不当复制源  
- ❌ 不要把 College Board 真题原文贴进网站  
- ❌ 不要把完整答案键公开在页面上  

---

完整 JSON 模板见：`docs/how-to-insert-questionnaires.md`

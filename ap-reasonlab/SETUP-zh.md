# AP ReasonLab 启动指南（中文）

## 一、项目已经建好了什么？

我已经在 `ap-reasonlab/` 目录里创建了网站基础框架：

| 页面 | 路径 | 功能 |
|------|------|------|
| 首页 | `/` | 产品介绍 |
| 概念库 | `/concepts` | AP 知识点列表 |
| 概念详情 | `/concepts/[id]` | 单个知识点 |
| 半程练习 | `/practice` | 填空式推理练习 |
| 提示教练 | `/hints` | 只给提示，不给答案 |
| 生成题集 | `/questionnaires` | 按科目 · **仅 AI 生成题** |
| 关键概念指南 | `/key-concepts` | 概念介绍 + AI 用法 + 概念题 |
| AI 指南 | `/guide` | 如何生成题、嵌入网站、接 API |
| 关于 | `/about` | 产品原则与伦理说明 |

AI 接口在 `app/api/hints/route.ts`：
- **没有 API Key** → 使用 mock 提示（照样能演示）
- **有 Gemini Key** → 调用免费 Gemini API

---

## 二、你现在怎么看到网站？

### 方法 A：立刻预览（不用装 Node）

双击或用浏览器打开：

```
ap-reasonlab/preview.html
```

这是静态预览页，只能看框架说明。

### 方法 B：运行完整网站（推荐）

#### 第 1 步：安装 Node.js

1. 打开 https://nodejs.org
2. 下载 **LTS 版本**（20 或 22）
3. 安装完成后，打开终端，输入：

```bash
node -v
npm -v
```

能看到版本号就成功了。

#### 第 2 步：进入项目并安装依赖

```bash
cd "/Users/jason/未命名/ap-reasonlab"
npm install
```

#### 第 3 步：启动开发服务器

```bash
npm run dev
```

#### 第 4 步：打开浏览器

访问：**http://localhost:3000**

你应该能看到完整网站，包括导航、概念库、练习页、Hint Coach。

---

## 三、（可选）接入免费 Gemini AI

1. 打开 https://aistudio.google.com/apikey
2. 创建 API Key
3. 在项目里复制环境变量文件：

```bash
cp .env.example .env.local
```

4. 编辑 `.env.local`，填入：

```
GEMINI_API_KEY=你的key
```

5. 重新运行 `npm run dev`
6. 打开 `/hints` 页面测试

---

## 四、你接下来应该做什么？（按顺序）

### 第 1 周：改内容，不改代码结构

编辑文件：`data/content.ts`

- 添加更多 AP 概念
- 添加更多练习题
- 先专注 **一门科目**（Physics 1 或 Calc AB）

### 第 2 周：接 AI + 测试

- 配置 Gemini API Key
- 在 `/hints` 测试提示质量
- 调整系统提示词（在 `app/api/hints/route.ts`）

### 第 3 周：上线

1. 把项目推到 GitHub
2. 用 Vercel 免费部署
3. 分享给 10–20 个同学试用

---

## 五、常用命令

```bash
npm run dev      # 本地开发（改代码自动刷新）
npm run build    # 构建生产版本
npm run start    # 运行构建后的版本
```

---

## 六、目录说明（你要改的文件）

| 文件 | 作用 |
|------|------|
| `data/content.ts` | 概念库与半程练习 |
| `data/questionnaires.ts` | **生成题集** — 只放 AI 生成题（`kind: "generated"`） |
| `docs/ai-workflow.md` | 用 Claude/ChatGPT 生成题 + 嵌入网站（中文） |
| `app/page.tsx` | 首页文案 |
| `app/hints/page.tsx` | Hint Coach 界面 |
| `app/api/hints/route.ts` | AI 提示逻辑 |
| `components/Nav.tsx` | 顶部导航 |

---

## 七、遇到问题？

| 问题 | 解决 |
|------|------|
| `node: command not found` | 先安装 Node.js |
| `npm install` 很慢 | 多等一会，或换网络 |
| Hint Coach 报错 | 没 Key 时会用 mock，正常 |
| 端口 3000 被占用 | 用 `npm run dev -- -p 3001` |

---

## 八、一句话总结

> **框架已经搭好。你现在只需要：装 Node → `npm install` → `npm run dev` → 浏览器打开 localhost:3000 → 开始改 `data/content.ts` 里的内容。**

有问题随时问我，下一步我可以帮你：
- 接入 Gemini 并测试
- 添加更多 AP Physics 1 概念
- 部署到 Vercel

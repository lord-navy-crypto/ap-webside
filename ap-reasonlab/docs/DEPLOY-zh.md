# 把 AP ReasonLab 从 localhost 变成真正的网站

## 先搞清两件事

| | localhost（你现在） | 真正的网站（上线后） |
|---|---|---|
| 谁能打开 | **只有你这台电脑** | **全世界任何人** |
| 地址长什么样 | `http://localhost:3000` | `https://xxx.vercel.app` |
| 关掉电脑后 | 别人打不开 | 仍然能打开 |

**localhost = 本地预览。**  
**要让别人看到，必须：代码放到 GitHub → 用 Vercel 免费部署。**

```text
你的电脑 (localhost)
        ↓
   GitHub（保存代码，免费）
        ↓
   Vercel（把代码变成网址，免费）
        ↓
   https://你的项目名.vercel.app  ← 真正的网站
```

---

## 总流程（按顺序做）

1. 确认本地能跑（你已经会了）
2. 把代码推到 GitHub
3. 用 Vercel 一键部署
4.（可选）加 Gemini API Key，让 Hint Coach 在线可用

---

## 第 0 步：本地确认（你已完成大部分）

打开终端：

```bash
cd "/Users/jason/未命名/ap-reasonlab"
npm install
npm run dev
```

浏览器打开：http://localhost:3000

能看到首页就说明代码没问题。

生产构建检查（上线前建议跑一次）：

```bash
npm run build
```

看到成功、没有红色报错，就可以上线。

---

## 第 1 步：准备 GitHub 账号

1. 打开 https://github.com 注册/登录
2. 右上角 **+** → **New repository**
3. Repository name：例如 `ap-reasonlab`
4. 选 **Public**（免费部署更简单）
5. **不要**勾选 “Add a README”（我们本地已有代码）
6. 点 **Create repository**
7. 页面会显示仓库地址，类似：

```text
https://github.com/你的用户名/ap-reasonlab.git
```

把这个地址复制下来。

---

## 第 2 步：把本地代码推到 GitHub（拿到“云端代码”）

在终端执行（把 `你的用户名` 换成你的 GitHub 用户名）：

```bash
cd "/Users/jason/未命名"

# 如果还没有提交过
git add ap-reasonlab
git status

git commit -m "$(cat <<'EOF'
Add AP ReasonLab website MVP.

EOF
)"

# 连接你刚创建的 GitHub 仓库（只做一次）
git remote add origin https://github.com/你的用户名/ap-reasonlab.git

# 推送代码
git branch -M main
git push -u origin main
```

如果提示登录：
- 用 GitHub 用户名 + **Personal Access Token**（不是密码）
- 或在电脑上安装 GitHub Desktop，用图形界面上传 `ap-reasonlab` 文件夹

推送成功后，在 GitHub 网页上应能看到所有文件（`app/`、`data/`、`package.json` 等）。

**这就是“拿到代码 / 保存代码”：代码在 GitHub 上，不会只存在你电脑里。**

---

## 第 3 步：用 Vercel 让网站真正出现（最重要）

1. 打开 https://vercel.com  
2. 用 **GitHub 账号登录**（Continue with GitHub）  
3. 点 **Add New… → Project**  
4. 找到刚推送的 `ap-reasonlab` 仓库 → **Import**  
5. 设置：
   - Framework Preset：应自动识别为 **Next.js**
   - Root Directory：如果仓库里只有网站内容，保持默认；  
     如果整个仓库是 `未命名` 且网站在子文件夹，把 Root Directory 设为 `ap-reasonlab`
6. 点 **Deploy**
7. 等 1–2 分钟，出现 **Congratulations**
8. 点 Visit → 得到类似：

```text
https://ap-reasonlab-xxxx.vercel.app
```

**这个链接就是真正的网站。**  
发给同学、写进申请材料都可以用。

---

## 第 4 步：（可选）让线上 Hint Coach 也能用 AI

1. 打开 https://aistudio.google.com/apikey 创建免费 Key  
2. Vercel 项目 → **Settings → Environment Variables**  
3. 添加：

| Name | Value |
|------|--------|
| `GEMINI_API_KEY` | 你的 key |

4. **Redeploy** 一次（Deployments → 最新一次 → Redeploy）

不配 Key 也可以上线：Hint Coach 会用 mock 提示，其它页面正常。

---

## 第 5 步：以后改网站怎么更新？

每次改完代码：

```bash
cd "/Users/jason/未命名"
git add ap-reasonlab
git commit -m "Update content"
git push
```

Vercel 会**自动重新部署**。一两分钟后刷新线上网址即可。

例如：你在 `data/questionnaires.ts` 加了新题 → `git push` → 线上自动更新。

---

## Root Directory 怎么选？（容易踩坑）

### 情况 A（推荐）：单独一个仓库只放网站

把 `ap-reasonlab` 文件夹单独当成一个 GitHub 仓库内容。  
Vercel Root Directory = 留空 / `.`

### 情况 B：现在这样，父文件夹是 git 根目录

仓库里是：

```text
未命名/
  ap-reasonlab/   ← 真正的 Next.js 项目
```

则 Vercel 导入时必须填：

```text
Root Directory = ap-reasonlab
```

否则会构建失败。

---

## 你现在电脑上的“代码在哪”？

| 位置 | 说明 |
|------|------|
| `/Users/jason/未命名/ap-reasonlab` | 本地完整网站代码 |
| `app/` | 各个页面 |
| `data/` | 概念、生成题 |
| `docs/` | 说明文档 |
| `package.json` | 依赖与启动命令 |

本地常用命令：

```bash
cd "/Users/jason/未命名/ap-reasonlab"
npm run dev      # 本地预览 http://localhost:3000
npm run build    # 检查能否上线
npm run start    # 本地运行生产版
```

---

## 费用

| 服务 | 费用 |
|------|------|
| GitHub（公开仓库） | 免费 |
| Vercel Hobby | 免费（个人项目够用） |
| Gemini API 免费额度 | 通常够 MVP |

---

## 检查清单

- [ ] `npm run build` 本地成功  
- [ ] GitHub 上能看到代码文件  
- [ ] Vercel Deploy 成功  
- [ ] 用手机流量（非家里 Wi‑Fi）打开 `.vercel.app` 链接能访问  
- [ ]（可选）配置了 `GEMINI_API_KEY`

---

## 一句话总结

> **localhost 只有你能看；把代码推到 GitHub，再用 Vercel Deploy，就会得到一个 `https://….vercel.app` 的真正网站。以后改代码只要 `git push`，网站自动更新。**

---

## 需要我帮你代做时

如果你愿意，可以告诉我：

1. 你的 GitHub 用户名（或是否已建好空仓库）  
2. 是否同意我帮你在本机执行 `git add / commit`（推送到远程仍需你登录 GitHub）

我可以继续帮你：检查构建、准备第一次 commit、核对 Vercel Root Directory 设置。

# CloudBase 配置清单（Remember Me）

环境 ID：`remember-me-d1gmd5iiu9d88c58a`（上海）

登录：**用户名 + 密码**  
数据：**SQL 型数据库（PostgreSQL）**

## 1. 安全域名（本地多半不用动）

官方文档里，环境一般**已经默认带了** `localhost`（本地调试用）。  
所以你在控制台找不到「环境配置 → 安全配置」时，**先跳过这一步**，直接去做登录和本地试用。

如果以后打开网页时报「跨域 / CORS / 非法来源 / safe domain」之类错误，再去找：

- 云开发平台 → **环境配置 → 安全来源**（有的界面叫「安全域名」）
- 需要时再加：`localhost`、`localhost:5173`、`127.0.0.1`（Vite 默认端口是 5173）

说明：PostgreSQL（PostgREST）并不等于「完全不用安全域名」。网页用的还是 CloudBase JS SDK，域名白名单仍可能生效；只是本地 `localhost` 通常已默认放行。

## 2. 打开用户名密码登录

身份认证 → 登录方式 → 打开 **用户名密码登录**。  
匿名 / 微信 / 短信都不用开。

家人账号：在 **用户管理** 里手动添加。网页上只有登录，没有注册——腾讯云不允许前端直接「用户名+密码」自助开号。

## 3. 建三张表（就在你现在这个 SQL 编辑器）

1. 打开 **SQL 型数据库 → 数据管理 → SQL 编辑器**（就是你截图的页面）
2. 打开项目里的文件：`cloudbase/schema.sql`
3. **整份复制**进编辑器  
   - 如果编辑器提示「SQL 里避免带注释」，我们这份本身几乎没有说明注释；若仍报错，就一段一段执行（先建表，再策略）
4. 点右下角 **执行**（或 `⌘ + Enter`）
5. 再到左侧 **数据库管理 → 表**，应能看到：
   - `households`
   - `members`
   - `items`

如果某句报错「policy / role authenticated 不存在」，把报错原文发给我，我帮你改一版更贴你环境的权限语句。

## 4. 本地打开

```bash
npm run dev
```

登录 → 创建家庭或输入邀请码 → 记东西。

## 5. 上线给家人用（Vercel）

1. 把代码推到 GitHub（当前仓库即可）
2. 打开 [vercel.com](https://vercel.com) → Import 这个仓库 → Framework 选 Vite
3. 环境变量填上（和本地 `.env` 一样）：
   - `VITE_CLOUDBASE_ENV` = 你的环境 ID
   - `VITE_CLOUDBASE_REGION` = `ap-shanghai`
4. Deploy 完成后，复制线上域名（例如 `xxx.vercel.app`）
5. 回到 CloudBase → **环境配置 → 安全来源**，把这个域名加进去（不要带 `https://`）
6. 给每位家人在「用户管理」建好账号，把链接和账号发给他们

手机浏览器打开后，可「添加到主屏幕」，像 App 一样用（PWA）。

若国内访问 Vercel 很慢，可改用 CloudBase **静态网站托管**：把 `npm run build` 生成的 `dist/` 上传上去，同样要把托管域名加进安全来源。

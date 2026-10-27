# CloudBase 配置清单（Remember Me）

环境 ID：`remember-me-d1gmd5iiu9d88c58a`（上海）

登录：**用户名 + 密码**  
数据：**SQL 型数据库（PostgreSQL）**  
前端上线：**CloudBase 静态网站托管**（国内更稳；不依赖 Vercel）

## 1. 安全域名 / 安全来源

本地 `localhost` 一般已默认放行。

CloudBase **静态托管的默认域名**（例如 `remember-me-d1gmd5iiu9d88c58a.tcloudbaseapp.com`）通常也已在白名单里，所以换到静态托管后，多数情况**不用再买「跨域域名」套餐**。 若登录仍报 `Failed to fetch` / `Load failed`，再打开：

[https://tcb.cloud.tencent.com/dev?envId=remember-me-d1gmd5iiu9d88c58a#/env/safety-source](https://tcb.cloud.tencent.com/dev?envId=remember-me-d1gmd5iiu9d88c58a#/env/safety-source)

把当前网页域名加上（不要带 `https://`）。

> 以前用的 Vercel（`rememberme-chi.vercel.app`）在国内不稳定，且加白名单可能要付费套餐，所以前端改走 CloudBase 托管。

## 2. 打开用户名密码登录

身份认证 → 登录方式 → 打开 **用户名密码登录**。  
匿名 / 微信 / 短信都不用开。

家人账号：在 **用户管理** 里手动添加。网页上只有登录，没有注册——腾讯云不允许前端直接「用户名+密码」自助开号。

## 3. 建三张表

1. 打开 **SQL 型数据库 → 数据管理 → SQL 编辑器**
2. 打开项目里的 `cloudbase/schema.sql`，整份复制执行
3. 左侧 **表** 里应能看到 `households` / `members` / `items`



## 4. 本地打开

```bash
npm run dev
```

登录 → 创建家庭或输入邀请码 → 记东西。

## 5. 上线给家人用（CloudBase 静态托管）——推荐



### 5.1 本机构建

项目根目录（确保本地有 `.env`，里面是环境 ID）：

```bash
npm run build
```

成功后会有 `dist/` 文件夹。也可再执行：

```bash
npm run pack:hosting
```

会生成 `remember-me-hosting.zip`，方便在控制台上传。

### 5.2 控制台上传（最省事）

1. 打开云开发平台 → 你的环境 → **静态网站托管**
2. 若尚未开通，按提示开通
3. 用下面任一方式部署：
  - **文件管理 / 上传文件**：把 `dist/` 里的内容上传到根目录（注意是 `dist` 里面的文件，不要多一层 `dist` 文件夹）
  - 或 **新建部署 → 上传代码包**：上传 `remember-me-hosting.zip`；若让平台构建，框架选 Vite，产物目录 `dist`，并配置环境变量（见下）
4. **SPA / 单页应用**：把「错误文档」或「404 页面」设为 `index.html`（刷新才不会空白）
5. 打开控制台给出的默认访问地址（一般是
  `https://remember-me-remember-me-d1gmd5iiu9d88c58a.webapps.tcloudbase.com/`  
   或以控制台显示为准）

### 5.2.1 打开默认域名却「下载 index.html」或出现风险页？

**不是压缩包传错了。** 腾讯云对「默认域名」（`*.webapps.tcloudbase.com`、`*.tcloudbaseapp.com` 等）有安全策略：

- 浏览器正常访问时，可能先出现 **「风险提醒」中间页**，点「确定访问」后才进网站
- 部分打开方式（或非页面导航请求）会带上响应头 `Content-Disposition: attachment`，浏览器就会 **下载** `index.html`，而不是展示网页

处理办法：

1. 用手机/电脑的 **Safari / Chrome**，在地址栏直接打开默认域名；若出现风险页，点确定
2. 不要用会改请求方式的内置浏览器（部分 App 内打开）硬试
3. 发给家人长期用：需要绑 **已备案的自定义域名**（自定义域名不受这套默认域名限制）。家庭小范围试用可先过中间页

官方说明：https://docs.cloudbase.net/service/alias

### 5.3 若选择「上传源码让云端构建」

环境变量填：

- `VITE_CLOUDBASE_ENV` = `remember-me-d1gmd5iiu9d88c58a`
- `VITE_CLOUDBASE_REGION` = `ap-shanghai`

构建命令：`npm run build`  
产物目录：`dist`

### 5.4 本机 CLI 部署（可选）

```bash
npm i -g @cloudbase/cli
tcb login
npm run build
tcb hosting deploy dist -e remember-me-d1gmd5iiu9d88c58a
```



### 5.5 发给家人

1. 用手机打开静态托管域名，登录试一下
2. 给家人在「用户管理」建好账号
3. 把链接 + 账号密码 + 家庭邀请码发给他们
4. 手机浏览器可「添加到主屏幕」当 App 用



## 6. 以前的 Vercel（可选备份）

仓库里仍有 `vercel.json`，需要时还能部署。家人请优先用 CloudBase 托管链接。
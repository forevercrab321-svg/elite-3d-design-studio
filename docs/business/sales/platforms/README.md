# 平台发行总表 — GROW EVERYTHING

> 调研日期：2026-09-24 · 平台发行 BD · 目标：7 天内上架网页游戏平台，总用户 1000
>
> 取证说明：本环境的网络出口屏蔽了所有平台的官网，**所有条款来自官方域名页面的搜索引擎摘要**（每份档案逐条附 URL）；Newgrounds 官方帮助页几乎没被搜索引擎收录，只能引用社区维基并标为「非官方」。**提交前请在浏览器里打开对应官方页面核对一次**。查不到的一律写「未查到」，没有编数字。

## 总表

| 平台 | 上线方式 / 审核时长（官方） | 分成（官方） | 技术改动量 | 平台整体流量（官方公开） | 推荐优先级 |
| --- | --- | --- | --- | --- | --- |
| [itch.io](itch-io.md) | **自助，发布即上线**；新卖家首个项目进审核队列，通常几个工作日内，期间可能不进搜索 | 开放分成，默认 10%，可设 0–100% | 小：A + B | 无公开数据 | **P0（第 1 天）** |
| [Newgrounds](newgrounds.md) | **自助发布**，进入社区评审 Under Judgment（非官方维基）；时长未查到 | 未查到官方（维基：广告分成，满 $100 付） | 小：A + B | 无公开数据 | **P0（第 1 天）** |
| [CrazyGames](crazygames.md) | 门户提交 → QA（时长未查到）→ Basic Launch（≥7 天且 ≥500 次，或 21 天）→ Full Launch | 现行比例官方文档未公开；Basic Launch 无广告无收入；月付，满 €100 | 小：A（必须）；多人专区另需用户名 + 房间状态 | 5000 万+ 月活 | **P0（第 1 天提交）** |
| [Y8](y8.md) | 门户送审，批准后发布；时长未查到，有送审冷却期 | 广告 50% | 小–中：A + B + 门户列出的 SDK 要求（未知）| 约 3000 万月活；热门新作最高 2.5 万次/天 | P1（第 2–3 天提交） |
| [Poki](poki.md) | 表单 → Playtest → Web Fit（约 7 天）→ 审核 1–2 周 → 排期 1–2 周 → 软发布 2–3 周 | 独占：Poki 来的流量 50/50，直达流量 100%；**7 年网页独占**；已在其他网页平台上线只能拿一次性授权费 | 中：A + CSP 白名单 + 外链走 SDK + 昵称脏词过滤 | 1 亿月活 | **需用户拍板**（7 天内不可能上线；与多平台冲突） |
| [GameDistribution](gamedistribution.md) | 最长 3 周（初评 ≤1 周） | 开发者得净收入 33% | 中：A + 新 SDK 适配器 + 强制 pre-roll | 3.5 亿+ 月触达、3000+ 发行站 | P2（冲刺后） |
| [GamePix](gamepix.md) | 时长未查到 | 未查到 | 中：A + 不含第三方 SDK 的构建 + 640×480 适配 | 无具体公开数据 | P2（冲刺后） |
| [Armor Games](armor-games.md) | 邮件投递，时长未查到 | 未查到（冠名、限时独占等方式） | 最小：可 iframe 嵌入我们的网址 | 无公开数据 | P3 |
| [国内（TapTap/4399/7k7k/抖音/微信）](china.md) | 需软著、ICP 备案、版号或小游戏备案；微信官方估算 13–37 个工作日 | 抖音广告 90% / 内购 ≥60%；其他未查到 | 大：小游戏无 DOM，UI 要重做 | 无公开数据 | 冲刺内不做 |

## 7 天内能上线的平台（排序与理由）

1. **itch.io — 第 1 天**。唯一有官方文档明确说明「发布即可访问」的平台；限制宽松（1000 文件 / 500 MB）；只要相对路径构建。审核队列优先处理有站外流量的页面，所以要和社群推广同一天做。
2. **Newgrounds — 第 1 天**。自助发布，进入社区评审；我们的大眼珠、打嗝、喇叭风格适合这个社区。官方条款查不到，上传时以页面上显示的限制为准。
3. **CrazyGames — 第 1 天提交**。流量最大的非独占平台（官方 5000 万+ 月活），SDK 已集成，技术上只差相对路径构建。QA 时长未查到，所以**越早提交越好**；Basic Launch 期间没有广告收入，但它的 500 次游玩门槛正好和我们 1000 用户目标同向。
4. **Y8 — 第 2–3 天提交**。有官方流量数据（3000 万月活），可不带广告发布；注册后才能看到 SDK 要求，审核时长未知，有冷却期，所以自测完整再送审。
5. 以下 **7 天内上不了**：Poki（官方流程合计数周）、GameDistribution（最长 3 周 + 新 SDK）、GamePix、Armor Games（邮件策展）、国内所有平台（资质）。

> 1000 用户的现实路径：自有网站 + itch + Newgrounds + CrazyGames Basic Launch + 短视频/社群引流。**没有任何一个平台公开承诺新游戏的流量**，所以不能靠「上架」本身凑够 1000，要配合达人和社群岗位。

## 需要用户拍板

- **Poki 独占 vs 多平台**：Poki Web Exclusive 要 7 年网页独占（含 Discord、YouTube Playables），已在其他网页平台上线的游戏只能拿一次性授权费。本冲刺建议选 **多平台**（详见 `poki.md` 第 5 节）。
- **CrazyGames 分成比例**：`platform-strategy.md` 写的「约 60% / 70%」在现行官方文档里查不到，只有非官方文章提到 Jam 条款。签约时以门户条款为准，建议之后更正 `platform-strategy.md`（本岗位按要求不改该文件）。

## 技术改动清单（交给工程；本岗位不改代码）

| 编号 | 改动 | 涉及平台 | 依据 |
| --- | --- | --- | --- |
| **A** | **平台 zip 构建**：`vite.web.config.mjs` 当前 `base: '/'`，产物引用 `/assets/...` 绝对路径，且游戏入口在 `game/` 子目录（`hdri/`、`legal/` 在根目录，靠 `import.meta.env.BASE_URL` 拼路径）。需新增一个 `base: './'` 的构建，让游戏 `index.html` 位于 zip 根目录，`assets/`、`hdri/`、`legal/`、`icons/` 与它同级；不打入 0.7 MB 的 `og.png` | 所有上传 zip 的平台 | CrazyGames 官方：只能用相对路径，绝对路径会加载失败 |
| **B** | **邀请链接基址**：`fallbackInviteUrl()` 用 `location.origin + location.pathname`，在 itch/Newgrounds/Y8 的 iframe 里会生成平台 CDN 子域的链接。需要可配置的邀请基址（如构建时 `VITE_INVITE_BASE`，指向该平台游戏页或 https://grow-everything.vercel.app/game/ ） | itch.io、Newgrounds、Y8 | 代码现状（`game/src/platform/Platform.ts`） |
| **C** | **平台版分享面板与外链**：`game/src/arena/share.ts` 会直接打开 wa.me、twitter.com、xiaohongshu.com 等；设置页直接链接法律页。Poki 须改走 SDK 外链方法；CrazyGames 建议只留复制邀请链接 + 系统分享；4399 要求不得私加外链 | Poki、CrazyGames、4399 | Poki：外链须经 SDK；CrazyGames：禁止交叉推广；4399 招募令 |
| **D** | **Supabase 配置写进平台构建**：`VITE_SUPABASE_URL/ANON_KEY` 是构建时变量，平台 zip 构建也要带上，否则没有联机房间和埋点；Poki 另需在后台申请 CSP 放行 Supabase 域名并提供在线隐私政策 | 全部；Poki | Poki External Resources |
| **E** | **CrazyGames 多人专区**：读取并显示 CrazyGames 用户名；用 SDK 上报房间状态（是否可加入） | CrazyGames（可选，不影响 Basic Launch） | CrazyGames Multiplayer 要求 |
| **F** | **昵称脏词过滤** | Poki | Poki：多人游戏有用户名输入须严格过滤 |
| **G** | **GameDistribution 适配器**：新 `GameDistributionPlatform.ts`，含强制 pre-roll、mid-roll | GameDistribution | GD 开发者指南 |
| **H** | **不含第三方 SDK 的构建**（去掉 CrazyGames/Poki 适配代码），并在 640×480 iframe 下测 HUD | GamePix | GamePix 提交指南 |

## 第 1 天行动清单（用户，按顺序）

1. 让工程先做 **A + B + D**（相对路径 zip + 邀请基址 + 带 Supabase 变量），拿到 `grow-everything-portal.zip`，本地用静态服务器在子路径下打开验证。
2. itch.io：按 `itch-io.md` 第 7 节发布 → 记下页面 URL。
3. Newgrounds：按 `newgrounds.md` 第 7 节发布。
4. CrazyGames：注册开发者账号 → 按 `crazygames.md` 第 7 节提交。
5. 所有平台链接带 `?utm_source=<平台>`（`sessions.utm` 已支持）交给达人/社群岗位同步推广。
6. 回答「Poki 独占 vs 多平台」。

## 档案索引

`crazygames.md` · `poki.md` · `itch-io.md` · `newgrounds.md` · `gamedistribution.md` · `y8.md` · `armor-games.md` · `gamepix.md` · `china.md`

# Poki — 平台档案

> 调研日期：2026-09-24 · 负责人：平台发行 BD · 状态：**未申请** · ⚠️ **需要用户拍板（见第 5 节「独占冲突」）**
>
> 取证方式：本环境屏蔽了 `developers.poki.com` / `sdk.poki.com`，内容来自**官方域名页面的搜索引擎摘要**，均注明 URL。

## 1. 提交入口、流程、审核时长

| 项 | 内容 | 来源 |
| --- | --- | --- |
| 提交入口 | https://developers.poki.com/share （游戏提交表单 / Poki for Developers 门户） | [S1][S2] |
| 流程 | 提交 → 在 P4D 门户上传 → **Playtest**（每次返回 10 段真实玩家录屏，可无限次）→ 看完至少 5 段录屏 + 通过 **Player Fit Test** → 加缩略图后解锁 **Web Fit Test**（对比同类游戏的点击率、页面停留、开始游戏转化）→ **Final Poki Review** → 排期软发布 → 全球发布 | [S3][S4][S5] |
| 各阶段官方时长 | Web Fit Test **约 7 天**（忙时更久，可重复）；提交后的审核 **1–2 周**；通过后排软发布档期 **1–2 周**；软发布期 **约 2–3 周** 后进入全球发布 | [S2][S3][S6] |
| 结论 | **官方流程加起来明显超过 7 天**，本次 7 天冲刺内不可能在 Poki 正式上线 | 按上列官方时长推算 |

## 2. 技术要求对照

| 要求（官方） | 来源 | 我们的现状 | 结论 |
| --- | --- | --- | --- |
| 初始下载目标 **≤ 5 MB，总计 ≤ 8 MB**；加载超过 10 秒玩家会流失 | [S7] | JS 1.3 MB + HDR 1.5 MB ≈ 2.8 MB（og.png 不进包） | ✅ 已满足 |
| 正确实现 SDK 事件（Web Fit Test 和所有发布都要求） | [S7] | `PokiPlatform.ts` 已接 SDK v2：gameLoadingFinished、gameplayStart/Stop、commercialBreak、rewardedBreak、shareableURL | ✅ 基本满足；⚠️ 当时没打开官方文档，提交前用 **Poki Inspector** 逐项跑 QA 模块 [S8] |
| **默认屏蔽所有外部请求**，字体/资源/库都要打进包 | [S9] | 除 Poki SDK 外无 CDN 依赖；但多人和埋点连 **Supabase**（外部域名） | ❌ 需要改：在游戏 Settings 页的 **Custom Content Security Policy** 申请放行 Supabase 域名；**必须提供在线的隐私政策页** [S9] |
| 外链按钮（Discord、YouTube 等）必须通过 SDK 打开，不能直接跳转 | [S10] | 分享面板直接打开 wa.me、twitter.com、xiaohongshu.com 等；设置页直接链接隐私政策 | ❌ 需要改：Poki 上改为走 SDK 的外链方法，或隐藏分享面板只保留 `shareableURL` 复制 |
| 多人游戏若有用户名输入，必须做严格脏词过滤（Poki 提供词表） | [S2] | 有玩家昵称（邀请时会显示名字），无脏词过滤 | ❌ 需要改 |
| 多人：Poki 提供 Netlib 联网库；也可用自有服务器，需经批准 | [S2][S9] | 自有 Supabase | ⚠️ 需走 CSP 审批 |
| 相对路径 / 包结构 | 未查到 Poki 的具体条款 | `base: '/'` 绝对路径 | ⚠️ 不确定——与其他平台一起改为相对路径构建即可 |
| 手机 | 未查到具体条款 | 已支持横屏触控 | ✅ |

## 3. 收入分成与付款

| 项 | 内容 | 来源 |
| --- | --- | --- |
| Web Exclusive（网页独占） | 通过 Poki.com 或 Poki 营销来的玩家：广告收入 **50/50**；玩家直接通过书签、搜索、社媒、你自己的社群来：**100% 归开发者** | [S11][S12] |
| 独占范围 | **7 年**，覆盖开放网页平台（**包括 Discord 和 YouTube Playables**）；Steam、应用商店、主机不受限 | [S12] |
| Non-Exclusive | 一次性授权费，无分成、无额外营销 | [S12] |
| **已在其他网页平台上线的游戏** | 官方写明此类游戏 Poki 可以给一次性授权费（无分成）——即**先上 CrazyGames/itch 等，就拿不到 Web Exclusive 分成方案** | [S13] |
| 付款周期 / 门槛 | **未查到**（官方称以合同为准） | [S12] |

## 4. 预计流量

- 平台整体：官方称 **1 亿月活玩家**、每月 **10 亿+ 次游玩**；表现好的单款游戏每月可超 **500 万玩家**。[S14]
- 新游戏测试期能拿多少：**无公开数据**（Playtest 每次 10 段录屏是固定数，不是流量承诺）。

## 5. MEDDIC

| 维度 | 本交易 |
| --- | --- |
| **Metrics** | 平台看：Web Fit Test 的点击率、页面停留、开始游戏转化（对比同类均值）[S4]；软发布期的留存与时长 |
| **Economic buyer** | Poki 发行团队（Final Poki Review 决定是否签约）。具体联系人 **待确认** |
| **Decision criteria** | 核心循环和手感是否好玩、在同类中是否够独特、玩家会不会喜欢 [S2][S15]；SDK 与技术 QA 合格 |
| **Decision process** | 表单申请 → Playtest → Player Fit → Web Fit（约 7 天）→ Final Review（1–2 周）→ 软发布排期（1–2 周）→ 软发布（2–3 周）→ 全球 |
| **Identify pain** | 手工精选平台需要高留存、适合全年龄的新品；多人品类要有「朋友一起玩」的传播力 |
| **Champion** | 暂无。Playtest 阶段可以向对接人要反馈，争取成为内部推荐 |

**独占冲突（需要用户决定）**：Poki Web Exclusive 要求 7 年网页独占；本冲刺计划同时上 CrazyGames、itch.io、Newgrounds 等网页平台，按官方说法会使我们只能拿一次性授权费方案 [S13]。两条路：
- **A. 冲 7 天 1000 用户（推荐）**：放弃 Poki 独占，先上多平台；Poki 以后按非独占谈或不做。
- **B. 押 Poki 长期分成**：本周只在自有网站 + Poki 走 Playtest，**不上其他网页平台**；但 7 天内无法在 Poki 上线，1000 用户目标只能靠自有网站和短视频。
- 另外「自有网站是否算违反网页独占」**未查到**，签约前要问清。

## 6. 提交文案（可直接复制）

**标题**：GROW EVERYTHING

**短描述（≤150 字符）**
- EN：`Eat anything smaller than you, grow, and swallow a whole city. 4-player online rooms with friends, AI fills empty seats.`
- 中：`吃掉比你小的一切，越吃越大，最后吞掉整座城市！最多 4 人联机，好友没到齐就由 AI 补位。`

**长描述**
- EN：GROW EVERYTHING is a 3D arena "eat the city" game. Drive a small googly-eyed machine through Shanghai, New York or Paris and swallow everything smaller than you — trash cans, cars, buses, buildings — until you can bring down the Oriental Pearl Tower, the Empire State Building or the Eiffel Tower. Up to 4 players share the same city: bigger machines eat smaller ones, so every chase can flip in a second. Invite friends with one link; AI rivals fill empty seats so a round starts right away. Rounds last up to 5 minutes with 3 lives each. Choose from four machines and unlock paint jobs, hats and horns — cosmetics never make you stronger.
- 中：《GROW EVERYTHING》是一款 3D「吞掉整座城市」竞技游戏。驾驶大眼珠小机器穿行在上海、纽约或巴黎，吃掉一切比你小的东西——垃圾桶、汽车、公交车、楼房——直到吞下东方明珠、帝国大厦或埃菲尔铁塔。最多 4 人同城：大的吃小的，追逐随时反转。一个链接邀请好友，空位 AI 补上，随时开局。每局最长 5 分钟，每人 3 条命。四种机器任选，用金币解锁涂装、帽子和喇叭——外观不会让你变强。

**玩法说明**
- EN：Eat anything smaller than you to grow. Smaller rivals can be eaten too — bigger ones can eat you. Dashing into something too big stuns you and costs mass. Grow big enough to topple the landmark.
- 中：吃比你小的东西长大；小对手也能吃，大对手也能吃你。冲刺撞上吃不动的东西会眩晕掉质量。长到够大就能推倒地标。

**操作说明**
- EN：WASD move · mouse look · SPACE dash · 1–6 emotes · H horn · M mute. Mobile (landscape): drag left side to move, DASH bottom-right.
- 中：WASD 移动 · 鼠标转视角 · 空格冲刺 · 1–6 表情 · H 喇叭 · M 静音。手机横屏：左侧拖动移动，右下角冲刺。

**标签**：EN `io, multiplayer, 3d, eating, growing, city, destruction, casual, driving` · 中 `io、多人、3D、吞噬、成长、城市、破坏、休闲、驾驶`

## 7. 下一步（用户操作）

1. **先回答第 5 节的 A/B 选择**。选 A 则本平台暂停，只在 README 标记「以后再谈」。
2. 若选 B：打开 https://developers.poki.com/share → 填写表单（团队信息、游戏试玩链接 https://grow-everything.vercel.app/game/?platform=poki ）→ 提交。
3. 获得 P4D 权限后：上传平台构建 zip → 点 **Request playtest** → 看完至少 5 段录屏 → 做 **Player Fit Test** → 上传缩略图 → 启动 **Web Fit Test**。
4. 在游戏 **Settings → Custom Content Security Policy** 填 Supabase 项目域名，并附上隐私政策网址（先完成 `public/legal/` 占位信息，见 `launch-checklist.md` 第 3 项）。

## 来源

- [S1] https://developers.poki.com/share
- [S2] https://developers.poki.com/guide/working-with-poki ； https://sdk.poki.com/index.html
- [S3] https://sdk.poki.com/web-fit-test.html
- [S4] https://developers.poki.com/guide/player-fit-test ； https://developers.poki.com/guide/how-testing-works ； https://sdk.poki.com/playtesting
- [S5] https://sdk.poki.com/final-review.html
- [S6] https://sdk.poki.com/releaseprocess
- [S7] https://developers.poki.com/guide/requirements-quality ； https://sdk.poki.com/new-requirements.html
- [S8] https://developers.poki.com/guide/inspector ； https://sdk.poki.com/poki-inspector
- [S9] https://sdk.poki.com/external-resources
- [S10] https://developers.poki.com/guide/requirements-quality （外链须经 SDK）
- [S11] https://sdk.poki.com/index.html （50/50 与 100% 规则）
- [S12] https://developers.poki.com/guide/revenue-deal-types ； https://sdk.poki.com/deals
- [S13] https://developers.poki.com/guide/revenue-deal-types （已在其他网页平台上线 → 一次性授权费）
- [S14] https://developers.poki.com/ ； https://poki.com/blog/state-of-web-gaming-report-2026
- [S15] https://sdk.poki.com/poki-quality-guidelines

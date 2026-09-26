# GamePix — 平台档案

> 调研日期：2026-09-24 · 负责人：平台发行 BD · 状态：**未提交**
>
> 性质：GamePix 同时有自己的游戏站 gamepix.com 和面向第三方网站的**分发网络**。
> 取证方式：本环境屏蔽了该域名，内容来自**官方页面（partners.gamepix.com、company.gamepix.com）的搜索引擎摘要**。

## 1. 提交入口、流程、审核时长

| 项 | 内容 | 来源 |
| --- | --- | --- |
| 提交入口 | https://partners.gamepix.com/developers （注册 GamePix Dashboard） | [S1] |
| 流程 | 注册 Dashboard → 集成 GamePix SDK（或完全不带 SDK）→ 提交游戏；上传时勾选 **Allow Distribution** 则同时分发到第三方网站，不勾则只在 gamepix.com 独家发布 | [S1][S2] |
| 审核时长 | **未查到** | — |

## 2. 技术要求对照

| 要求（官方） | 来源 | 我们的现状 | 结论 |
| --- | --- | --- | --- |
| **不能包含第三方 SDK**：要么用 GamePix SDK，要么完全不带 SDK | [S2] | 构建里包含 CrazyGames / Poki 适配代码；只在检测到对应域名时才动态加载它们的 SDK 脚本 | ⚠️ 不确定是否算违规 → 稳妥：出一个不含 CrazyGames/Poki 适配的 GamePix 构建（README 技术改动 H）|
| 游戏要能自适应 iframe，至少在 **640×480** 的 iframe 里测过 | [S2] | 画布自适应；但 HUD/面板在 640×480 下未测 | ⚠️ 需要测（可能要改布局）|
| 首次加载要有加载画面 | [S2] | 有加载流程（平台 `loadingFinished`），需确认 GamePix 构建里可见 | ✅ 基本满足 |
| 广告播放时暂停音乐和音效，结束后恢复 | [S2] | 适配层已有 `onPause/onResume` 静音逻辑 | ✅ 已满足（接 GamePix SDK 时复用）|
| 激励广告要清楚说明需要做什么、奖励是什么，玩家可跳过/关闭 | [S2] | 复活按钮写明「保留 75% 质量」、金币翻倍写明 2 倍；可不看 | ✅ 已满足 |
| 文件大小 / 多人 / 外链 | **未查到** | — | ⚠️ 不确定 |
| 相对路径 | 未查到 | 绝对路径 | ❌ 需要改（README 技术改动 A） |

## 3. 收入分成与付款

- 分成比例：**未查到**（官方只说「开发者获得收入分成」）。[S1]
- 付款条件：**未查到**。

## 4. 预计流量

- 官方只说「数百个认证合作网站」「数以千计的联盟伙伴」「数百万玩家」，**无具体公开数据**。[S1][S3]

## 5. MEDDIC

| 维度 | 本交易 |
| --- | --- |
| **Metrics** | 未公开；我们看 `utm_source=gamepix` 的会话 |
| **Economic buyer** | GamePix 游戏审核/QA 团队（官方称负责优化和 QA）[S1] |
| **Decision criteria** | 满足提交指南：iframe 自适应、加载画面、广告时静音、激励广告说明清楚、无第三方 SDK [S2] |
| **Decision process** | Dashboard 提交 → QA → 上线（时长未查到）|
| **Identify pain** | 分发网络需要能在小 iframe 里正常跑的轻量 HTML5 游戏 |
| **Champion** | 暂无 |

**注意**：勾选 Allow Distribution 属于网页二次分发，与 Poki Web Exclusive 冲突。

## 6. 提交文案（可直接复制）

**标题**：GROW EVERYTHING

**短描述（≤150 字符）**
- EN：`Eat anything smaller than you, grow, and swallow a whole city. 4-player online rooms with friends, AI fills empty seats.`
- 中：`吃掉比你小的一切，越吃越大，最后吞掉整座城市！最多 4 人联机，好友没到齐就由 AI 补位。`

**长描述**
- EN：GROW EVERYTHING is a 3D "eat the city" arena. Drive a small googly-eyed machine through Shanghai, New York or Paris and swallow everything smaller than you — trash cans, cars, buses, buildings — until you can bring down the Oriental Pearl Tower, the Empire State Building or the Eiffel Tower. Up to 4 players share one city; bigger machines eat smaller ones. AI rivals fill empty seats so a round always starts right away. Rounds last up to 5 minutes with 3 lives each.
- 中：《GROW EVERYTHING》是一款 3D「吞掉整座城市」竞技游戏。驾驶大眼珠小机器在上海、纽约或巴黎吃掉比你小的一切——垃圾桶、汽车、公交车、楼房——直到吞下东方明珠、帝国大厦或埃菲尔铁塔。最多 4 人同城，大吃小；空位 AI 补上，随时开局。每局最长 5 分钟，每人 3 条命。

**玩法说明**
- EN：Eat anything smaller than you to grow. Smaller rivals are food too — bigger ones will eat you. Dashing into something too big stuns you and costs mass. Grow big enough to topple the landmark.
- 中：吃比你小的东西长大；小对手也能吃，大对手会吃你。冲刺撞上吃不动的东西会眩晕掉质量。长到够大就能推倒地标。

**操作说明**
- EN：WASD move · mouse look · SPACE dash · 1–6 emotes · H horn · M mute. Mobile (landscape): drag left side to move, DASH bottom-right.
- 中：WASD 移动 · 鼠标转视角 · 空格冲刺 · 1–6 表情 · H 喇叭 · M 静音。手机横屏：左侧拖动移动，右下角冲刺。

**标签**：EN `io, multiplayer, 3d, eating, city, destruction, casual` · 中 `io、多人、3D、吞噬、城市、破坏、休闲`

## 7. 下一步（用户操作）

1. 7 天冲刺内**不推进**；先决定 Poki 独占问题。
2. 若做：打开 https://partners.gamepix.com/developers → **Sign up** 注册 Dashboard → 读 https://partners.gamepix.com/guidelines/submission 与 https://partners.gamepix.com/sdk/doc，把 SDK 要求发给工程。
3. 拿到 GamePix 专用构建后 → Dashboard **Add game** → 上传 → 决定是否勾选 **Allow Distribution** → 提交。

## 来源

- [S1] https://partners.gamepix.com/developers
- [S2] https://partners.gamepix.com/guidelines/submission ； https://partners.gamepix.com/sdk/doc
- [S3] https://partners.gamepix.com/

# GameDistribution — 平台档案

> 调研日期：2026-09-24 · 负责人：平台发行 BD · 状态：**未提交**
>
> 性质：GameDistribution（Azerion 旗下）不是单一游戏站，而是**分发网络**：把 HTML5 游戏分发到数千个第三方网站，按广告收入分成。
> 取证方式：本环境屏蔽了该域名，内容来自**官方页面（gamedistribution.com、faq.gamedistribution.com、static.gamedistribution.com）的搜索引擎摘要**。

## 1. 提交入口、流程、审核时长

| 项 | 内容 | 来源 |
| --- | --- | --- |
| 提交入口 | https://gamedistribution.com/developers/ （注册开发者账号后在后台上传） | [S1] |
| 流程 | 注册 → 集成 GameDistribution SDK → 上传 → 初步评估 → QA → 激活或返回修改意见 | [S2][S3] |
| 审核时长 | 官方：**最长 3 周**；其中初步评估**通常最多 1 周**。时长取决于游戏质量、QA 结果、SDK 和广告位是否正确 | [S2][S3] |

## 2. 技术要求对照

| 要求（官方） | 来源 | 我们的现状 | 结论 |
| --- | --- | --- | --- |
| **所有游戏必须集成 GD SDK**（投放广告、统计游玩和展示） | [S3] | 未集成（只有 CrazyGames / Poki / Web 三个适配器） | ❌ **需要改**：新增 `GameDistributionPlatform.ts` 适配器（README 技术改动 G） |
| 广告位要求：**开始游玩前的 pre-roll** + 游戏过程中的 mid-roll | [S3] | 我们没有 pre-roll；局间广告只在 CrazyGames/Poki 上 | ❌ 需要改 |
| UI 不遮挡、按钮易懂、目标直观或有简单教程 | [S4] | 首局有一句操作提示；按钮带图标和文字 | ✅ 基本满足 |
| 文件大小上限 | **未查到** | 约 2.9 MB | ⚠️ 不确定（大概率没问题） |
| 相对路径 | 未查到 | 绝对路径 | ❌ 需要改（README 技术改动 A） |
| 多人 / 外部服务器 | **未查到** | Supabase | ⚠️ 不确定——游戏会被嵌入数千个第三方站点，Supabase 实时连接费用和并发会随之上升，需要评估 |
| 手机 | 未查到具体条款 | 已支持 | ✅ |

## 3. 收入分成与付款

| 项 | 内容 | 来源 |
| --- | --- | --- |
| 分成 | 开发者许可协议：开发者获得分发所产生 **净收入的 33%** | [S5] |
| 付款周期 / 门槛 | **未查到** | — |

## 4. 预计流量

- 官方称：每月触达 **3.5 亿+ 玩家**，连接 **3000+ 发行网站**。[S6]
- 单款新游戏能被多少站点采用：**无公开数据**（取决于发行网站是否选用）。

## 5. MEDDIC

| 维度 | 本交易 |
| --- | --- |
| **Metrics** | GD 看：QA 通过、广告展示、游玩数；发行站看：留存和广告收入。我们看：各站点带来的 `lobby_view`（需要在 GD 构建里加 `utm_source=gamedistribution`） |
| **Economic buyer** | GD 的游戏审核团队（激活）+ 各发行网站（是否采用）|
| **Decision criteria** | 游戏质量、QA、SDK 与广告位（pre-roll + mid-roll）是否正确 [S2][S3] |
| **Decision process** | 上传 → 初评（≤1 周）→ QA → 激活（总计 ≤3 周）→ 进入目录供发行站挑选 |
| **Identify pain** | 发行站需要能带来广告收入、加载快的游戏 |
| **Champion** | 暂无 |

**注意**：GD 是二次分发网络，与 Poki Web Exclusive 冲突（见 `poki.md`）；且 33% 分成低于直接平台。**不建议放进 7 天冲刺**。

## 6. 提交文案（可直接复制）

**标题**：GROW EVERYTHING

**短描述（≤150 字符）**
- EN：`Eat anything smaller than you, grow, and swallow a whole city. 4-player online rooms with friends, AI fills empty seats.`
- 中：`吃掉比你小的一切，越吃越大，最后吞掉整座城市！最多 4 人联机，好友没到齐就由 AI 补位。`

**长描述**
- EN：GROW EVERYTHING is a 3D "eat the city" arena. Drive a small googly-eyed machine through Shanghai, New York or Paris and swallow everything smaller than you — trash cans, cars, buses, buildings — until you can bring down the Oriental Pearl Tower, the Empire State Building or the Eiffel Tower. Up to 4 players share one city; bigger machines eat smaller ones. AI rivals fill empty seats so a round always starts right away. Rounds last up to 5 minutes with 3 lives each. Four machines to choose from, plus paint jobs, hats and horns.
- 中：《GROW EVERYTHING》是一款 3D「吞掉整座城市」竞技游戏。驾驶大眼珠小机器在上海、纽约或巴黎吃掉比你小的一切——垃圾桶、汽车、公交车、楼房——直到吞下东方明珠、帝国大厦或埃菲尔铁塔。最多 4 人同城，大吃小；空位 AI 补上，随时开局。每局最长 5 分钟，每人 3 条命。四种机器可选，还有涂装、帽子和喇叭。

**玩法说明**
- EN：Eat anything smaller than you to grow. Smaller rivals are food too — bigger ones will eat you. Dashing into something too big stuns you and costs mass. Grow big enough to topple the landmark.
- 中：吃比你小的东西长大；小对手也能吃，大对手会吃你。冲刺撞上吃不动的东西会眩晕掉质量。长到够大就能推倒地标。

**操作说明**
- EN：WASD move · mouse look · SPACE dash · 1–6 emotes · H horn · M mute. Mobile (landscape): drag left side to move, DASH bottom-right.
- 中：WASD 移动 · 鼠标转视角 · 空格冲刺 · 1–6 表情 · H 喇叭 · M 静音。手机横屏：左侧拖动移动，右下角冲刺。

**标签**：EN `io, multiplayer, 3d, eating, city, destruction, casual, driving` · 中 `io、多人、3D、吞噬、城市、破坏、休闲、驾驶`

## 7. 下一步（用户操作）

1. **先决定是否要 Poki 独占**（`poki.md` 第 5 节）。若要，则不做 GD。
2. 若做：打开 https://gamedistribution.com/developers/ → **Sign up** 注册开发者账号 → 在后台 **Add game** 拿到 Game ID。
3. 把 Game ID 交给工程，接入 GD SDK（pre-roll + mid-roll + 激励）→ 拿到 GD 专用构建 zip。
4. 后台上传 zip，粘贴第 6 节文案、缩略图 → **Submit**，预计最长 3 周。

## 来源

- [S1] https://gamedistribution.com/developers/
- [S2] https://faq.gamedistribution.com/hc/en-us/articles/360019771179-Submitting-your-game
- [S3] https://static.gamedistribution.com/developer/developers-guidelines.html
- [S4] https://static.gamedistribution.com/developer/developers-guidelines.html （UI/教程要求）
- [S5] https://static.gamedistribution.com/terms/developer.html
- [S6] https://gamedistribution.com/developers/partnership/ ； https://www.gamedistribution.com/publishers/

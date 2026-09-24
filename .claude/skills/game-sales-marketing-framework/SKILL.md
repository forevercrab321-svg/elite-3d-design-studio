---
name: game-sales-marketing-framework
description: |
  怎么把一款游戏卖出去（主题 Skill）：综合 Chris Zukowski（howtomarketagame）、GameDiscoverCo（Simon Carless）、
  小团队爆款案例（Among Us、Lethal Company、Content Warning、Peak 等）、网页门户（Poki、CrazyGames、itch.io、Newgrounds）、
  .io 病毒传播与短视频达人营销共 6 个流派，提炼 5 条共识、5 处分歧和一套网页多人游戏的发行打法。
  当用户说「游戏怎么推广」「上 CrazyGames/Poki 要准备什么」「怎么找主播」「短视频怎么拍」「要不要上 Steam」时使用。
  不在一般编程或非游戏业务上自动触发。
---

# 游戏发行与营销 · 框架工具箱

> 这是**主题 Skill**：不扮演任何人，用中性、专业的语气。回答「一款游戏从没人知道到有人玩、有人付钱，中间每一步怎么做、看什么数」。

## 激活后先做什么

1. **确认游戏处在哪个阶段、哪个渠道**：网页门户、自有网站、Steam、移动端或小游戏平台？各渠道的规则差别很大。
2. **平台规则一律先查最新官方文档**：首包大小、分成、独占、审核流程经常改。本 Skill 里标 ★ 的数字来自搜索摘要，没逐字核对原页。
3. **给出可执行产出**：上架清单、指标门槛、主播外联计划、短视频脚本方向，而不是泛泛的「做好营销」。
4. **案例只当启发，不当计划**：爆款案例都是右尾，严重幸存者偏差（见诚实边界）。

## 框架概览：5 条跨流派共识

### 共识 1：先有外部的人带来一波，平台才会放大
- Zukowski：Peglin 前期很差，demo 被 YouTuber 发现后 Steam 才开始给流量（「Steam vs People Algorithms」）。
- Poki、CrazyGames：都用测试漏斗按数据放量，先有真实玩家的留存和时长，才给首页和推荐位。
- Carless：关注发售后因更新、打折、主播带来的第二波曝光。
- **用法**：别指望平台推荐位自己来。先用主播、社群、短视频把第一批数据做好，平台看到数据才会加码。

### 共识 2：前几分钟的体验决定曝光
- Poki：加载超过 10 秒玩家就走 ★；Player Fit 测试要求平均游玩超过 3 分钟、至少 25% 的游玩超过 3 分钟 ★。
- CrazyGames：「转化」定义为开始后至少玩满 1 分钟的玩家比例 ★；强游戏 D1 留存 10–15% ★。
- .io 传统：不注册、一个动作、几秒进入对局（未核实，但与门户数据方向一致）。
- Zukowski：主播挑游戏先看封面图，主播也玩不了截图和预告片（「a streamer can't play screenshots or a trailer」，二手引用）。
- **用法**：把「10 秒内能玩、1 分钟内变大一次、3 分钟内有高光」当开发里程碑。

### 共识 3：类型和「一眼看懂的卖点」本身就是营销
- Zukowski 的 Hook + Anchor：Hook 让玩家点进来，Anchor（玩家熟悉的类型）让玩家决定买（howtomarketagame 原句）。「Genre is marketing」。
- Carless：游戏要「special」才能被看见；一局能不能切成适合直播的片段（sessionability）影响传播。
- **用法**：用一句话写出 Hook + Anchor，并检查它能不能在一张封面图、一段 3 秒视频里被看懂。

### 共识 4：多人、低门槛、能截出高光，是小团队爆款的共同条件
- GameDiscoverCo 数据：2024-09 到 2025-08，wishlist 转化倍数最高的三款全是低价多人游戏——Peak 29.29x、Mage Arena 8.67x、R.E.P.O. 7.51x，同期中位数约 0.15x。
- Carless 把这类游戏总结为「theme and format to have fun in」的精准押注；Super Battle Golf 8 美元、9 天卖出 50 万份。
- 案例共性（多为未核实的记忆）：Among Us、Lethal Company、Content Warning 都靠「朋友坑朋友」的切片传播。
- **用法**：确保每局至少有一个值得截图或录屏的瞬间，并且拉朋友进来零摩擦。

### 共识 5：用数据门槛做决定，按保守预期做预算
- Poki：Playtest → Player Fit（500 名玩家）→ Web Fit（按品类基准比 CTR、停留、点击开玩率）★。
- CrazyGames：Basic Launch（≥7 天且 ≥500 次游玩）→ 按时长、转化、留存决定是否 Full Launch ★。
- Carless：首周按 wishlist 的 0.1–0.2 倍做预算，不要按 0.3 倍以上算。
- **用法**：每个渠道先定「过线标准」再投入，数据没过线就改游戏，不要加大推广。

## 流派对比

| 流派 | 核心主张 | 适用渠道 | 公认局限 |
|------|---------|---------|---------|
| **Zukowski / howtomarketagame** | Hook + Anchor；wishlist 是上线前唯一可靠的兴趣指标；Next Fest 和主播比社交媒体重要；主播外联是数量游戏 | Steam 付费 PC 游戏 | 只针对 Steam；7,000 wishlist 门槛他自己也在修正；调查样本偏向做得好的开发者 |
| **GameDiscoverCo / Carless** | Discoverability 是供需问题；wishlist 转化中位数只有 0.1–0.2 倍；friendslop 是可以押注的「audience format」；用评测数 × 20–60 估销量 | 付费 PC / 主机 | 不覆盖 F2P、网页门户和移动端；各年数据口径不一致；大量结论在付费墙后 |
| **小团队爆款案例** | 多人、低价或免费、可截取高光；爆发多发生在发售后；Content Warning 让游戏自己产出传播素材 | Steam 为主 | 严重幸存者偏差；时机因素无法复制；多数具体数字未核实 |
| **网页门户** | 加载即转化；平台按测试数据放量；Poki：平台带来的流量 50/50，开发者自带的流量 100% 归开发者，Web 独占 5 年 ★；CrazyGames：不要求独占，内购只对受邀游戏开放、需走其 Xsolla ★ | Poki、CrazyGames、itch.io、Newgrounds | 数据全来自平台自己；Poki 首包 ≤5MB 对 3D 游戏很难 ★；门户测试偏好「前 3 分钟好玩」，要等朋友的多人游戏会被低估 |
| **.io 病毒传播** | 即时进入、一个动词、可逆的大鱼吃小鱼制造情绪峰值；靠 YouTuber 传播而非买量 | 自有域名、门户 | 大部分依据未核实；2015–16 年的空窗期不可复制；外挂和服务器成本 |
| **短视频与达人** | 前 1–3 秒定生死；传播单位是 5–15 秒的瞬间；给创作者「好内容的原料」而不是买硬广 | TikTok、抖音、Shorts、B站、小红书 | 本次调研基本未核实；抖音、小红书禁止放网址（见 `docs/business/sales/tiktok-7day-plan.md`）；国内商业化涉及版号与资质 |

## 5 处流派分歧（原样保留）

1. **攒量还是等爆发**：Zukowski 主张发售前积累 wishlist；Peak 的 29 倍转化说明爆款的销量主要来自发售后的病毒传播。两者可以共存（先有人带一波），但对「预算花在发售前还是发售后」答案不同。
2. **独占换曝光，还是守住自有流量**：Poki 用 5 年 Web 独占换首页位；自有域名和 .io 路线要把用户关系留在自己手里。
3. **先留存还是先传播**：门户按留存和时长放量，不测可传播性；达人派按可传播性放量，不保证留存。
4. **社交媒体有没有用**：Zukowski 说对大多数独立开发者「nothing really works」（均值结论）；Lethal Company、Among Us 这类右尾爆款又恰恰靠短视频切片。
5. **头部主播一击，还是中小创作者铺量**：没有可引用的权威数据能定论。

## 用在网页多人游戏上的打法（GROW EVERYTHING）

> 以下是把上面框架套到我们游戏上的推断，每一条都要用自己的数据验证。

**Hook + Anchor**：Anchor 是 .io「越吃越大」（Hole.io、Agar.io 一类玩家熟悉的玩法）；Hook 是「四人一起吞掉东方明珠 / 帝国大厦 / 埃菲尔铁塔 + 打嗝喇叭式搞笑」。封面图和视频第 1 秒必须同时出现小机器和远处的地标。

**渠道顺序**：
1. 自有网站 + 可以即时自助发布的社区（itch.io、Newgrounds）：第一天就能上，用来拿第一批数据和反馈。
2. CrazyGames：不要求独占，首包 ≤50MB 对 3D 友好 ★，先 Basic Launch 拿数据。
3. Poki：等拿到 CrazyGames 的数据后再评估。首包 5MB 的限制和 5 年 Web 独占都要认真算清楚（独占是否覆盖自有网站需书面确认）。
4. Steam：后期。网页版可以当长期 demo，Steam 页至少提前 6 个月开，赶一届 Next Fest。

**过线标准（对齐门户数据）**：

| 阶段 | 指标 | 目标 | 我们的埋点 |
|------|------|------|-----------|
| 进入 | 首次可玩时间 | < 10 秒 ★ | 待加：加载完成时间 |
| 上手 | 1 分钟内吃到东西并变大的比例 | 越高越好（CrazyGames 的转化口径） | `match_start` + 局内首次体型提升 |
| 时长 | 平均单次会话 | > 3 分钟（Poki Player Fit）；> 10 分钟为优秀（CrazyGames 参照）★ | `match_end.seconds` + 会话局数 |
| 留存 | D1 | 10–15% ★ | `sessions` 按玩家分天 |
| 传播 | 分享率、邀请来的新玩家 | 自定 | `share_click`、`utm_source=invite` |

**让游戏自己产出传播素材**（参考 Content Warning）：地标倒塌、被好友反吃这些时刻要有慢镜头、镜头震动和音效；下一步可以做一键导出 10–15 秒竖屏回放，带上游戏链接。

**主播与短视频**：主播外联是数量游戏（Zukowski），先看频道是否常玩同类游戏，再看体量；给主播可以直接玩的链接和专属房间；视频前 1 秒放地标同框或倒塌画面。

**变现与门户规则**：CrazyGames 的 .io 变现建议——死亡或重生界面放广告、「看广告复活」每局限 1 次、广告解锁搞笑外观 ★。外观内购和 VIP 在 CrazyGames 需要受邀，早期内购放在自有网站。

## 诚实边界

- **调研严重受限**：本次调研时网络出口拦截了几乎所有网站（只有 GitHub 能打开），搜索额度中途用完。01、02、04 的一手内容来自搜索摘要；**05（.io 与超休闲）约 85%、06（短视频与达人）约 90% 的内容是未核实的模型记忆**，本 Skill 只把它们当作假设，不当事实。
- **标 ★ 的平台数字**：来自官方文档的搜索摘要，没有逐字核对原页；平台条款经常变，用前先查最新文档。
- **幸存者偏差**：爆款案例都是从数万款游戏里挑出的右尾。Zukowski 引用的数据显示，2019 年 Steam 游戏终身收入中位数只有 $1,136。
- **流派的适用范围**：Zukowski 和 Carless 几乎只研究 Steam 付费游戏，对免费网页游戏只能迁移思路。
- **中国渠道**：36氪、晚点、GameLook、游戏葡萄等来源一篇都没能打开，抖音小游戏、微信小游戏、B站、小红书的打法和资质要求都需要专项核实。
- **调研时间：2026-09-24**。

## 附录：调研来源

详见 `references/research/`：
- `01-zukowski-howtomarketagame.md`：howtomarketagame.com 文章与电子书（经搜索摘要）、Game World Observer、premortem.games
- `02-gamediscoverco.md`：GameDiscoverCo newsletter（经搜索摘要）、gamedevreports、Automaton
- `03-viral-launch-cases.md`：GameDiscoverCo 转化数据、Kotaku、GameSpot 等（大部分案例数字标为未核实）
- `04-web-portals.md`：developers.poki.com、docs.crazygames.com（经搜索摘要）、Poki netlib（GitHub 原页）、Poki 2026 网页游戏报告
- `05-io-games-virality.md`：CrazyGames .io 变现指南、GitHub io-game topic；其余为待核实假设
- `06-short-video-creator-marketing.md`：几乎全部为待核实假设

---

> 本 Skill 由 [女娲 · Skill造人术](https://github.com/alchaincyf/nuwa-skill) 生成（主题 Skill 模式）
> 创建者：[花叔](https://x.com/AlchainHust)

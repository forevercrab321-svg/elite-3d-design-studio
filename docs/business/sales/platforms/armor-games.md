# Armor Games — 平台档案

> 调研日期：2026-09-24 · 负责人：平台发行 BD · 状态：**未联系**
>
> 取证方式：本环境屏蔽了 armorgames.com，内容来自**官方页面（developers.armorgames.com、armorgames.com 社区官方回复、armorgamesstudios.com）的搜索引擎摘要**。Armor Games 公开的开发者条款很少，大部分关键数字**未查到**。

## 1. 提交入口、流程、审核时长

| 项 | 内容 | 来源 |
| --- | --- | --- |
| 提交入口 | **邮件**：mygame@armorgames.com（附游戏链接和补充信息）；开发者文档 https://developers.armorgames.com/ | [S1][S2] |
| 流程 | 邮件投递 → 策展团队评估 → 双方谈合作方式（冠名、限时独占等）→ 上线 | [S1][S3] |
| 注意 | 社区里管理员曾表示站内「submit games」入口很少有人看，建议直接发邮件（管理员个人邮箱见社区帖，此处不引用个人邮箱） | [S3] |
| 审核时长 | **未查到** | — |

## 2. 技术要求对照

| 要求（官方） | 来源 | 我们的现状 | 结论 |
| --- | --- | --- | --- |
| 只接受 HTML5；**多人 / MMO 等特殊情况可用 iframe 托管** | [S2] | HTML5 + 多人 | ✅ 可以直接用 iframe 指向 https://grow-everything.vercel.app/game/ （不需要改路径）|
| JS API（AGI）：内购、存储、用户服务 | [S2] | 未接 | ⚠️ 不确定是否强制（文档未写强制） |
| 文件大小 / 广告 / 外链 | **未查到** | — | ⚠️ 不确定 |
| iframe 托管时的邀请链接 | — | iframe 内是我们自己的域名，邀请链接会指向 Vercel 站 | ⚠️ 可用，但玩家会被带离 Armor Games（需与对方确认是否接受） |

## 3. 收入分成与付款

- 具体比例：**未查到**。
- 官方提到的合作方式：**冠名/品牌植入**、**限时站点独占**（官方称为报酬最高的选项之一）；API 支持游戏内购。[S1][S3]
- 限时独占与 CrazyGames、Poki 等其他网页平台可能冲突，签约前需问清范围。

## 4. 预计流量

- **无公开数据**。

## 5. MEDDIC

| 维度 | 本交易 |
| --- | --- |
| **Metrics** | 待对方说明（未公开）|
| **Economic buyer** | Armor Games 策展/商务团队（通过 mygame@armorgames.com）|
| **Decision criteria** | 质量优先的策展站（官方：为玩家提供最高质量的网页游戏体验）[S2] |
| **Decision process** | 邮件 → 评估 → 谈合作方式 → 上线；时长未知 |
| **Identify pain** | 需要高质量原创网页游戏，尤其是能长期留住玩家的 |
| **Champion** | 暂无 |

## 6. 提交文案（邮件，可直接复制；**发送前给用户确认**）

**Subject:** GROW EVERYTHING — 4-player "eat the city" arena, HTML5 / three.js, playable now

Hi Armor Games team,

I'm [Your name], developer of **GROW EVERYTHING**. You drive a small googly-eyed machine through Shanghai, New York or Paris and eat everything smaller than you — trash cans, cars, buses, buildings — until you can swallow the Oriental Pearl Tower, the Empire State Building or the Eiffel Tower. Up to 4 players per city, AI fills empty seats, rounds up to 5 minutes.

- Tech: three.js, ~2.9 MB download, desktop + mobile landscape. Multiplayer runs on our own backend, so an iframe embed would be simplest.
- Monetisation: cosmetics only (no pay-to-win) + optional rewarded ads.
- Play: https://grow-everything.vercel.app/game/?utm_source=armorgames

Would it be a fit for Armor Games? Happy to discuss sponsorship or other arrangements.

Thanks,
[Name] · [email]

**中文版（内部存档）**：主题「GROW EVERYTHING——四人联机『吞掉整座城市』，HTML5/three.js，可直接试玩」；正文同上：介绍玩法、技术（three.js、约 2.9 MB、手机横屏、自有联机后端建议 iframe 嵌入）、变现（只卖外观 + 可选激励广告）、试玩链接，询问是否合适及冠名等合作方式。

**短描述（≤150 字符）**
- EN：`Eat anything smaller than you, grow, and swallow a whole city. 4-player online rooms with friends, AI fills empty seats.`
- 中：`吃掉比你小的一切，越吃越大，最后吞掉整座城市！最多 4 人联机，好友没到齐就由 AI 补位。`

**长描述 / 玩法 / 操作**：与 `crazygames.md` 第 6 节完全相同，直接复制。

**标签**：EN `io, multiplayer, 3d, eating, city, destruction, driving` · 中 `io、多人、3D、吞噬、城市、破坏、驾驶`

## 7. 下一步（用户操作）

1. 优先级低，**7 天冲刺内不主动推进**；有空时：确认上面英文邮件内容 → 用工作邮箱发到 mygame@armorgames.com。
2. 收到回复后，把对方提出的条款（分成、独占范围、期限）记到本档案第 3 节。

## 来源

- [S1] https://armorgames.com/community/thread/11499673/answered-how-to-submit-game （官方社区的已答复帖）
- [S2] https://developers.armorgames.com/docs/introduction/overview/ ； https://developers.armorgames.com/
- [S3] https://armorgames.com/community/thread/12294515/answered-will-armor-games-ever-accept-html5 ； https://armorgamesstudios.com/publishing

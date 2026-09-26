# ToB 作战计划：把 GROW EVERYTHING 卖给游戏平台

> 2026-09-24 起生效 · 负责团队：`grow-platform-bd`（平台发行团队） · 上层战略：`../strategy.md`
> 用户指令：**先做 ToB，ToC 暂停。** 先把游戏卖给各大游戏平台。
> 原来的「7 天 1000 用户」冲刺（`../sprint-1000-users.md`）里的 TikTok、达人、社群动作全部暂停；平台上线后，如果需要帮平台冲 Basic Launch 的数据门槛，再由用户决定是否恢复。

## 1. 目标（两周）

| 指标 | 目标 | 怎么算 |
| --- | --- | --- |
| 提交审核的平台数 | **≥ 5** | 门户里显示「已提交 / 审核中」 |
| 已上线的平台数（含试运行） | **≥ 3** | 平台上能公开玩到 |
| 进入谈判的授权/分发合作 | **≥ 2** | 对方有书面回复，写进 `pipeline.md` |
| 一次通过率 | **≥ 80%** | 没有因为技术问题被退回 |

> 这些是我们能控制的指标。平台给多少流量、给不给推荐位，决定权在平台，这里不做承诺。

## 2. 路线：多平台（2026-09-24 用户已拍板选路线 A）

Poki 的网页独占条款和「先在其他网页平台上线」互相冲突（详见 `../platforms/poki.md` 第 5 节，条款来自官方页面摘要）：

| | **路线 A：多平台（团队推荐）** | **路线 B：Poki 独占优先** |
| --- | --- | --- |
| 做法 | 第 1 天起提交 CrazyGames、itch.io、Newgrounds，随后 Y8、GameDistribution、GamePix、Armor Games | 先只申请 Poki，走完 Playtest → Web Fit Test，期间**不在任何其他网页平台上线** |
| 多快能上线 | CrazyGames：看 QA 排期（未查到时长）；itch/Newgrounds：自助发布，当天可上线 | Poki 官方流程合计**数周**（测试约 7 天 + 审核 1–2 周 + 排期 1–2 周 + 软发布 2–3 周） |
| 收入结构 | 多个平台的广告分成叠加；GameDistribution 能把游戏分发到它的发行网络 | Poki 来的流量 50/50，自带流量 100%；网页独占 7 年（另一份调研写 5 年，以合同为准） |
| 风险 | 以后只能拿 Poki 的一次性授权费 | 如果 Poki 在测试阶段拒绝，几周时间白等；独占期内不能再卖给其他网页平台 |
| 对「先卖出去」的贡献 | **最大**：两周内能拿到多个上线和分发合作 | 小：两周内大概率还在测试阶段 |

**推荐 A 的理由**：
1. 用户的目标是尽快卖出去，A 两周内就能拿到结果；B 要等几周，而且结果不确定。
2. 我们是自带服务器的 3D 多人游戏，Poki 最看重留存，而我们现在还没有任何线上留存数据可以拿给它看。
3. 多平台上线后，用真实数据（时长、留存）再去谈 Poki 的授权或其他大平台，筹码更足。

**选 B 的前提**：你认为 Poki 一家的流量就值得放弃其他平台，并且愿意等 3–6 周。

## 3. 第 1–14 天（路线 A）

| 天 | 平台 BD 经理 | 提交与合规工程师 | 商务资料 | 用户要做的 |
| --- | --- | --- | --- | --- |
| **D1** | 按 `sales-kit.md` 准备 CrazyGames、itch.io、Newgrounds 的提交内容；每个平台在 `pipeline.md` 建一条记录 | 用你的 `.env.local` 打 `dist-portal.zip`，在子路径下跑一遍冒烟测试 | 素材包（封面、截图、预告片）放进 `marketing/press-kit/` | ① 选路线 ② 填好法律页占位信息 ③ 注册 CrazyGames、itch.io、Newgrounds ④ 提交（我在旁边一步步指导） |
| **D2** | Y8 注册 → 建 Studio → 记下门户列出的 SDK 要求 | 按 Y8 的 SDK 要求评估改动量 | Y8 用的缩略图尺寸 | 注册 Y8，把 SDK 要求截图发给我 |
| **D3** | GameDistribution 注册，拿到 Game ID | 用 Game ID 打 `dist-portal-gamedistribution.zip`；按官方要求在 GD 后台的 iframe 里完整看完一次测试广告，激活 SDK | GD 用的描述和缩略图 | 注册 GD、上传、激活 SDK、点「申请发布」 |
| **D4** | GamePix 注册；Armor Games 发邮件（`sales-kit.md` 第 4 节，发送前给你看） | `dist-portal-nosdk.zip` 在 640×480 的 iframe 里测一遍 HUD | — | 注册 GamePix；确认并发送 Armor Games 邮件 |
| **D5** | 跟进 CrazyGames QA；整理平台问答 | 修复 QA 反馈（如有） | — | 转发平台的邮件或门户消息 |
| **D6–D7** | **第一次 pipeline 周会**（`weekly-YYYY-MM-DD.md`）：每个平台的阶段、卡点、下一步 | 做 CrazyGames 多人专区的房间状态上报（需要你在门户里打开官方文档，把接口名给我） | — | 周会上拍板要改的事 |
| **D8–D14** | 第二批线索调研（第 5 节）；已上线平台开始看数据 | 按平台反馈迭代；准备带数据的版本说明 | 用真实数据更新一页纸 | 注册第二批平台（如果决定做） |

## 4. 现在就能交付的东西

| 交付物 | 位置 | 状态 |
| --- | --- | --- |
| 通用平台包（CrazyGames、Poki、itch.io、Newgrounds、Y8） | `npm run build:portal` → `dist-portal.zip`（1.6 MB，20 个文件） | ✅ 已构建；**要带上你的 Supabase 配置再打一次**，否则只有单人加 AI |
| GameDistribution 包 | `node tools/build-portal.mjs gamedistribution` → `dist-portal-gamedistribution.zip` | ✅ 已构建，模拟 SDK 测试通过；需要真实的 Game ID |
| GamePix 包（不含任何第三方 SDK） | `node tools/build-portal.mjs nosdk` → `dist-portal-nosdk.zip` | ✅ 已构建，已验证不请求任何平台 SDK |
| 各平台的提交文案（中英） | `../platforms/<平台>.md` 第 6 节 | ✅ |
| 技术合规逐项自检 | `readiness.md` | ✅ |
| 合作方式与谈判底线 | `deal-menu.md` | ✅ |
| 一页纸、事实表、邮件模板 | `sales-kit.md` | ✅ |
| 素材包 | `marketing/press-kit/` | 截图与封面见素材包说明 |

## 5. 第二批线索（未调研，不能直接用）

以下只是 BD 知道存在的网页游戏平台/分发商名字，**条款、流量、是否接受多人游戏都没查过**，进 pipeline 前要按 SKILL.md 的「新平台进 pipeline」流程建档：
Yandex Games、Playgama、GameMonetize、Famobi、Lagged、CoolMathGames（对内容要求严格）、Kongregate、MSN Games、Addicting Games。

## 6. 需要你拍板（按顺序）

1. ~~路线 A 还是 B~~ → **已定：路线 A 多平台**（2026-09-24）。对外邮件一律**写成 Gmail 草稿，由用户自己发送**。
2. **法律页信息**：`public/legal/*.html` 里的运营者名称、地址、联系邮箱、数据存储地区。平台提交都要隐私政策网址，这是提交的硬前提。
3. **用哪个邮箱和名字对外**（开发者账号、收款、平台联系人都要用）。
4. **收款方式**：PayPal 还是银行电汇（CrazyGames 满 €100 打款；GameDistribution 官方 wiki FAQ 写满 €50 月结，以后台条款为准）。
5. 首批注册哪些平台（路线 A 的 D1–D4 全部，还是先做 CrazyGames + itch.io + Newgrounds）。

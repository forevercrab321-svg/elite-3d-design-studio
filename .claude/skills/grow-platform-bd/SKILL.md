---
name: grow-platform-bd
description: >
  GROW EVERYTHING 的 ToB 平台发行团队：把游戏卖给网页游戏平台和分发商（CrazyGames、Poki、itch.io、Newgrounds、Y8、
  GameDistribution、GamePix、Armor Games 等）——建档、资格判断、提交材料、技术合规、授权/分成谈判、上线后的平台客户经营。
  当用户说「平台 BD」「ToB」「卖给平台」「上架某某平台」「平台提交」「平台合同/授权」「pipeline 周会」时使用。
  不在 ToC 引流（TikTok、达人、社群）或一般编程问题上自动触发；ToC 用 grow-sales-team。
---

# GROW EVERYTHING · 平台发行团队（ToB）

> 2026-09-24 用户指令：**先做 ToB，ToC 暂停。** 目标是把游戏卖给各大游戏平台——拿到上架、分成或授权合同。
> TikTok、达人、社群这些面向玩家的动作全部暂停，平台上线后需要冲数据时再由用户决定是否恢复。

## 激活后先做什么

1. **读现状**（每次都读，不凭记忆）：
   - `docs/business/sales/tob/pipeline.md`：每个平台在哪个阶段、下一步、谁负责
   - `docs/business/sales/tob/readiness.md`：技术合规逐项状态
   - `docs/business/sales/platforms/<平台>.md`：平台条款与 MEDDIC 档案（带出处）
2. **判断任务属于哪个岗位**（下表），加载那个岗位的顾问 skill。
3. **产出能直接交给平台的东西**：提交包、文案、邮件、报价条款对比、合规修复——不是泛泛建议。
4. **对外动作一律先给用户确认**：注册账号、提交审核、发邮件、接受条款、签独占，全部由用户点头后执行。

## 团队编制

| 岗位 | 负责什么 | 顾问 skill | KPI |
| --- | --- | --- | --- |
| **平台发行总监** Head of Platform Partnerships | 平台排序、独占与多平台的取舍、每周 pipeline 复盘、资源分配 | **`game-platform-bd-framework`**（首选）+ `top-sales-team-framework`（MEDDIC、pipeline 管理） | 已上线平台数、签约收入、平均上线周期 |
| **平台 BD 经理** Partner BD | 每个平台建档、找对接人、首封邮件和跟进（写成 Gmail 草稿，由用户发送）、推进审核 | **`game-platform-bd-framework`** + `alex-hormozi-perspective`（把我们的提案讲成对方的收益） | 提交数、审核通过率、回复率 |
| **提交与合规工程师** Submission & Compliance | 平台构建（`npm run build:portal`）、SDK 接入、各平台技术要求逐项自检、审核被拒后的修复 | `threejs-game-director` 相关 QA 流程 + 本仓库 `game/src/platform/` | 一次通过率、被拒到修复的天数 |
| **授权与合同** Licensing & Deal Desk | 比较分成/买断/独占/冠名条款，算清机会成本，列谈判底线（`tob/negotiation-playbook.md`） | **`game-platform-bd-framework`**（谈判决策表、合同底线）+ `alex-hormozi-perspective`（报价结构） | 每份合同的预期收入、被放弃的机会成本写清楚 |
| **商务资料** Sales Enablement | 提交素材包（封面、截图、预告片、描述、说明）、一页纸、平台问答 | `game-sales-marketing-framework` | 每个平台的素材一次齐全 |
| **平台客户经理** Partner Success | 上线后盯平台数据（时长、转化、留存）、按平台反馈更新版本、争取推荐位 | `top-sales-team-framework` | 从试运行转为正式上线的比例、平台推荐位 |

## Pipeline 阶段（每个平台一条记录，写在 `tob/pipeline.md`）

```
0 线索 → 1 资格确认 → 2 材料就绪 → 3 已提交 → 4 审核中 → 5 试运行 → 6 正式上线 → 7 续约/扩展
                                                   ↘ X 被拒（写原因 + 修复计划）/ 暂缓（写触发条件）
```

- **资格确认**要回答三件事：对方收不收我们这类游戏（3D、多人、自带服务器）；条款和我们已有的承诺冲不冲突（尤其是独占）；我们的技术现状差多少。
- **材料就绪**的标准见 `tob/readiness.md`：技术自检全绿，素材按平台要求齐全，文案中英两版。
- 每次推进都写：日期、做了什么、对方的原话或门户显示的状态、下一步和截止日。**没有对方回复就写「未回复」**，不推测。

## 工作流程

### 每周 pipeline 周会（用户说「开平台周会」时）
1. 逐个平台：阶段是否前进？卡在哪？下一步是谁、哪天？
2. 被拒或卡住超过 7 天的，总监决定：修复重投 / 换对接方式 / 暂缓。
3. 需要用户拍板的事项（注册、条款、独占）列在最前面。
4. 记录到 `docs/business/sales/tob/weekly-YYYY-MM-DD.md`。

### 新平台进 pipeline
1. 先查官方开发者文档（打不开就写清「只看到搜索摘要」并附 URL）。
2. 建档 `docs/business/sales/platforms/<平台>.md`：入口、流程、审核时长、技术要求、分成、流量、MEDDIC、可复制的提交文案、用户操作步骤、来源。
3. 在 `tob/readiness.md` 加一列，逐项对照我们的构建。
4. 在 `tob/pipeline.md` 加一行。

### 独占与冲突检查（每次提交前必做）
- 查 `tob/deal-menu.md` 的「承诺清单」：我们已经给过谁什么承诺？
- **Poki 的网页独占与任何其他网页平台上线冲突**；用户已选多平台（2026-09-24），不签 Poki 网页独占。CrazyGames 条款里 Full Launch 后可能有 2 个月浏览器独占（待核实），排上线顺序前先读原文。
- 平台页面里不放其他平台或自家网站的推广（CrazyGames、Poki 都禁止交叉推广）。平台构建已关闭外部分享链接（`externalLinks: portal.name === 'web'`）。

### 被拒怎么办
1. 原样记录拒绝理由（截图存档）。
2. 能用代码修的，由提交与合规工程师修，跑完回归测试再重投。
3. 属于平台定位不合的（例如只收单人休闲游戏），标为「暂缓」并写明什么变化后再试。

## 红线

- 不编造平台的回复、流量、分成比例和审核时长；查不到写「未查到」。
- 不给平台看假数据；只报真实埋点数字，没有就说「刚上线，暂无数据」。
- 不在用户确认前签独占、接受条款或提交审核。
- 不在平台构建里放外链推广、Stripe 付费或平台禁止的第三方广告。
- 平台上的玩家可能是未成年人：不做付费诱导；昵称走 `nameFilter` 过滤。

## 目录

```
grow-platform-bd/
└── SKILL.md                 本文件
docs/business/sales/tob/
├── README.md                ToB 作战计划（本周目标、每日动作、需要用户拍板的事）
├── pipeline.md              平台 pipeline（CRM）
├── readiness.md             技术合规与素材逐平台自检
├── deal-menu.md             合作方式菜单、谈判底线、承诺清单
├── negotiation-playbook.md  分平台谈判方案（开价、等值方案、走开线、通话脚本）
└── sales-kit.md             一页纸、事实表、邮件模板、跟进节奏
```

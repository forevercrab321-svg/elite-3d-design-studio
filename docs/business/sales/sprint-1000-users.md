# 7 天冲刺：1000 名用户（销售总监作战计划）

> **⏸ 2026-09-24 暂停。** 用户指令：先做 ToB（把游戏卖给平台），ToC 暂停。现行计划见 `tob/README.md`（团队 skill：`grow-platform-bd`）。
> 本文的平台上架部分已并入 ToB 计划；TikTok、达人、社群部分保留备用，恢复时由用户决定。

> 目标：7 天内累计 **1000 名不重复玩家**（以 Supabase `players` 表的新增行计）。
> 第一优先：上架网页游戏平台。第二优先：TikTok 类短视频平台引流。
> 建议开跑日：**D1 = 2026-09-28（周一）**，由你确认。
> 本计划由销售团队 skill（`grow-sales-team`）各岗位的产出汇总而成。所有对外发布、注册账号、私信、付费，都由你操作或确认后执行。

## 0. 开跑前必须完成（D0）

| # | 事项 | 谁 | 状态 |
|---|------|----|------|
| 1 | 把分支 `claude/gifted-goldberg-mz9n2p` 合进 `main`，让线上网站带上最新修复（中途加入、房主交接、分享面板、来源追踪） | 你（或浏览器里的 Claude） | 待办 |
| 2 | 用两部手机实测：一人开房，一人点邀请链接，中途加入、锁屏再回来 | 你 | 待办 |
| 3 | 确认 Supabase 线上接通：`players`、`events` 表有新行（没接通则分享礼物、来源追踪、数据看板全部失效） | 你 | 待办（上次验收未完成） |
| 4 | 生成平台 zip：本地 `.env.local` 填好 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`（公开的 anon key，不是 service_role），然后 `npm run build:portal` 得到 `dist-portal.zip` | 你或 Claude | 构建脚本已就绪 |
| 5 | 拍板：**Poki 独占 vs 多平台**（BD 建议多平台，理由见 `platforms/poki.md`） | 你 | 待决定 |

## 1. 用户从哪来（假设，不是承诺）

没有任何平台公开承诺新游戏的流量，下面是用来分配精力的假设，每天用数据修正。

| 渠道 | 负责岗位 | 7 天假设区间 | 依据 |
|------|---------|-------------|------|
| 熟人和已有社交圈（暖外联） | 社群与裂变 | 50–150 | Hormozi 的 Core Four：先做暖外联 |
| 好友邀请带来的新玩家 | 社群与裂变 | 上面所有渠道 × 0.2–0.5 | 四人联机天然拉人；以 `utm_source=invite` 实测 |
| Reddit（r/WebGames 等）、Show HN、V2EX | 社群与裂变 | 100–400 | `community-launch.md`；效果无公开数据 |
| itch.io、Newgrounds | 平台 BD | 50–200 | 自助上线；无公开流量数据 |
| CrazyGames Basic Launch | 平台 BD | 未知（取决于审核速度） | 官方月活 5000 万+，但新游戏流量不公开 |
| TikTok 新账号 | 达人合作 | 0–300 | 新账号冷启动不可控；抖音、小红书禁止放链接，7 天内只算 TikTok 主页链接 |

**判断标准**：到 D3 结束时累计 < 250，就把精力从效果最差的渠道挪到效果最好的渠道（Hormozi 的 More → Better → New：先把有效的做更多）。

## 2. 每日计划

| 天 | 平台 BD | 社群与裂变 | 达人 / 短视频 | 数据运营 |
|----|--------|-----------|--------------|---------|
| **D1** | itch.io、Newgrounds 发布；CrazyGames 提交（`platforms/*.md` 第 7 节有按钮级步骤） | Show HN 发帖（`community-launch.md` 已写好）；熟人群发邀请 | 注册 TikTok 企业号，发 V01、V02（`tiktok-7day-plan.md`） | 建好看板查询（第 4 节），记下基线 |
| **D2** | Y8 提交 | r/WebGames 发帖；V2EX「分享创造」 | 发 V03、V04；按 `creator-outreach-plan.md` 找 20 个候选达人（只列标准，不编名单） | 看来源分布 |
| **D3** | 跟进 CrazyGames QA | r/iogames 或 r/playmygame（按版规）；启动首周四人好友局挑战（`referral-week1.md`） | 发 V05、V06；给 10 位达人发个性化私信（发送前给你确认） | **中期复盘**：< 250 就调渠道 |
| **D4** | 若 CrazyGames 进入 Basic Launch，把平台链接交给社群和达人岗 | itch.io 社区、Discord（按规则） | 发 V07、V08；跟进私信（最多 2 次） | 看分享率、邀请带来的新玩家 |
| **D5** | 整理 Poki / GameDistribution 冲刺后的申请材料 | 小红书、B站动态（不放链接，引导搜索） | 发 V09、V10 | 看 D1 留存 |
| **D6** | — | 回复所有评论，收集 bug 与反馈 | 发 V11、V12；表现最好的两条做变体 | 周末高峰前检查线上稳定性 |
| **D7** | 冲刺复盘 | 挑战结果公布（真实数据，不做虚假排行） | 发 V13、V14 | **周会**：按 `grow-sales-team/templates/weekly-report.md` 出周报 |

## 3. 素材（已就绪 / 进行中）

- 平台提交文案（中英）：`platforms/*.md`
- 社区帖子（可直接复制）：`community-launch.md`
- 14 条短视频脚本：`tiktok-7day-plan.md`；录屏清单：`video-capture-shotlist.md`
- 游戏内录屏工具：`node tools/capture-clip.mjs`（画面干净模式 `?clip=1`），样片输出在 `renders/marketing/`
- 邀请链接自动带 `utm_source=invite&utm_medium=<渠道>`；平台和帖子链接请手动加 `?utm_source=<平台>&utm_campaign=sprint1`

## 4. 数据看板（在 Supabase SQL Editor 里运行）

```sql
-- 1) 进度：冲刺开始以来的新玩家数（目标 1000）
select count(*) as new_players
from public.players
where created_at >= '2026-09-28';

-- 2) 每天新增
select date_trunc('day', created_at)::date as day, count(*) as new_players
from public.players
where created_at >= '2026-09-28'
group by 1 order by 1;

-- 3) 来源：每个玩家第一次会话的 utm_source / utm_medium
with first_session as (
  select distinct on (player_id) player_id, utm, referrer, platform
  from public.sessions
  where started_at >= '2026-09-28'
  order by player_id, started_at
)
select coalesce(utm->>'utm_source', 'direct') as source,
       coalesce(utm->>'utm_medium', '-') as medium,
       count(*) as players
from first_session
group by 1, 2 order by 3 desc;

-- 4) 漏斗：进大厅 → 开局 → 打完一局 → 分享
select name, count(distinct player_id) as players
from public.events
where ts >= '2026-09-28' and name in ('lobby_view', 'match_start', 'match_end', 'share_click', 'gift_unlock')
group by 1 order by 2 desc;

-- 5) D1 留存：第一天来过、第二天又来的玩家比例
with days as (
  select player_id, date_trunc('day', started_at)::date as d
  from public.sessions where started_at >= '2026-09-28' group by 1, 2
), first_day as (
  select player_id, min(d) as d0 from days group by 1
)
select f.d0, count(*) as cohort,
       round(100.0 * count(*) filter (where exists (select 1 from days x where x.player_id = f.player_id and x.d = f.d0 + 1)) / count(*), 1) as d1_pct
from first_day f group by 1 order by 1;
```

> 数据没有接通时，周报里写「未接通」，不估算。

## 5. 红线（来自销售团队 skill）

- 不编数据、不编达人或平台的回复；不做虚假人数、虚假倒计时。
- 每个社区先看版规再发，同一天不在多个社区刷屏。
- 私信个性化，最多跟进 2 次，对方拒绝就停。
- 玩家里可能有未成年人：不做付费诱导。

## 6. 需要你拍板的事

1. 开跑日期（建议 9/28）。
2. Poki 独占还是多平台（建议多平台）。
3. 注册哪些账号：TikTok 企业号、itch.io、Newgrounds、CrazyGames 开发者、Y8、Reddit、Hacker News、V2EX。
4. 是否有付费预算（本计划默认 0 元，全部自然流量）。
5. 挑战活动的承诺能否兑现（例如「票数最高的城市优先做」），不能兑现就从脚本里删掉。

# 7 天冲刺：1000 名用户（第 2 轮，2026-10-26 → 11-01）

> 2026-10-25 用户指令：全力推广，一周内在各平台拿到 1000 名用户。第 1 轮（9/28 起）因转做 ToB 暂停，本文按现状重写。
> 目标：7 天内累计 **1000 名不重复玩家**，以 Supabase `players` 表的新增行计（自有网站、itch.io、CrazyGames 包都写这张表）。Playgama 沙盒是纯 AI 版、不连 Supabase，单独以 Playgama 后台的游玩次数计。
> 团队：`grow-sales-team`（7 个岗位）。分工如下：
> - 用户：发帖、确认对外发送、平台账号操作；
> - side agent：浏览器里的点按操作；
> - Claude 团队：素材、构建、数据、草稿。

## 0. 现状（10/25）

| 渠道 | 状态 | 本周角色 |
| --- | --- | --- |
| 自有网站 grow-everything.vercel.app | 上线，含 10/25 手感和画面修复 | 所有引流的落地页（链接带 utm） |
| Playgama 沙盒 | 上线，要 100 次游玩、平均 5 分钟才能进审核 | D1–D2 先把这 100 次凑够（真实玩家） |
| itch.io | Public（rev 8） | D1 换 rev 13，勾 AI 声明，发 devlog |
| CrazyGames | 10/2 被拒，rev 13 已就绪 | 等后台截图，再决定上传还是发邮件 |
| YouTube / TikTok / 小红书 | 第 2 版 Shorts 被否，第 3 版（埃菲尔）在拍 | D2 起每天 1 条 |
| Reddit / HN / V2EX 等社区 | 帖子已写好（`promo-posts-week1.md`、`community-launch.md`） | D1–D4 每天一个社区 |
| 达人和收录站 | 名单在调研（`creators-and-directories-2026-10.md`） | D2 起外联（用户确认后发） |
| Y8 / GamePix / Kongregate | 允许 AI（需声明） | D2–D3 提交 |
| Armor Games / Newgrounds | 拒绝或排斥 AI 素材 | 不投 |

## 1. 用户从哪来（假设，每天用数据修正）

| 渠道 | 7 天假设 | 怎么量 |
| --- | --- | --- |
| 熟人、朋友圈、微信群 | 50–150 | `utm_source=wechat` |
| 好友邀请（4 人联机） | 以上所有渠道 × 0.2–0.5 | `utm_source=invite` |
| Reddit、Show HN、V2EX | 100–400 | `utm_source=reddit` / `hn` / `v2ex` |
| Shorts（YouTube、TikTok、小红书） | 0–300 | `utm_source=youtube` / `tiktok` / `xhs` |
| 达人和收录站 | 0–300 | 每位达人一个 `utm_campaign` |
| itch.io、Y8、GamePix、Kongregate | 50–200 | 平台后台 + `utm_source=<平台>` |

规则：D3 结束时累计少于 250，就把精力挪到前三天效果最好的两个渠道（先把有效的做更多）。

## 2. 每日计划

| 天 | 平台 BD | 社群 | 短视频 | 达人和收录站 | 数据 |
| --- | --- | --- | --- | --- | --- |
| **D1 10/26 周一** | itch.io 换 rev 13 + AI 声明 + devlog；CrazyGames 后台截图 | 朋友圈和微信群；r/WebGames（Playgama 链接） | 埃菲尔样片出片、用户审 | 名单出炉 | 跑看板查询，记基线 |
| **D2 10/27** | 提交 Y8、GamePix | r/playmygame | 发 Shorts #1（YouTube + TikTok + 小红书） | 发前 10 封外联（用户确认） | 看来源分布 |
| **D3 10/28** | 提交 Kongregate；CrazyGames 跟进 | Show HN | 拍脚本 2（越大越能吃） | 收录站提交 5 个 | **中期复盘：少于 250 就调渠道** |
| **D4 10/29** | Playgama 进审核后补材料 | V2EX「分享创造」 | 发 Shorts #2 | 再发 10 封外联 | 看邀请带来的新玩家 |
| **D5 10/30** | — | r/IndieGaming（按版规） | 拍脚本 3（吃掉对手） | 跟进第 1 批（最多 2 次） | 看 D1 留存 |
| **D6 10/31** | — | 回复所有评论，收集 bug | 发 Shorts #3；最好那条做变体 | — | 周末前检查线上稳定性 |
| **D7 11/1** | 冲刺复盘 | 公布真实结果 | — | — | **周报**（`grow-sales-team/templates/weekly-report.md`） |

## 4. 数据看板（在 Supabase SQL Editor 里运行）

```sql
-- 1) 进度：冲刺开始以来的新玩家数（目标 1000）
select count(*) as new_players
from public.players
where created_at >= '2026-10-26';

-- 2) 每天新增
select date_trunc('day', created_at)::date as day, count(*) as new_players
from public.players
where created_at >= '2026-10-26'
group by 1 order by 1;

-- 3) 来源：每个玩家第一次会话的 utm_source / utm_medium
with first_session as (
  select distinct on (player_id) player_id, utm, referrer, platform
  from public.sessions
  where started_at >= '2026-10-26'
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
where ts >= '2026-10-26' and name in ('lobby_view', 'match_start', 'match_end', 'share_click', 'gift_unlock')
group by 1 order by 2 desc;

-- 5) D1 留存：第一天来过、第二天又来的玩家比例
with days as (
  select player_id, date_trunc('day', started_at)::date as d
  from public.sessions where started_at >= '2026-10-26' group by 1, 2
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

1. 开跑日期：10/26 周一。
2. 账号：YouTube 频道、TikTok、Reddit（有历史的号最好）、Hacker News、V2EX、Y8、GamePix、Kongregate。
3. 付费预算：默认 0 元。如果愿意花一点钱，最快的是 Reddit 或 TikTok 小额投放，另做计划。
4. 每天跑一次第 4 节的 SQL（Supabase SQL Editor），把结果贴给我；没有数据就无法调渠道。

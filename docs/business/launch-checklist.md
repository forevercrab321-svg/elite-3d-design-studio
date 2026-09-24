# GROW EVERYTHING — 上线清单

状态：✅ 已完成（仓库内） · 🟡 需要你操作（账号、付费或法律） · ⏳ 之后再做

## 游戏本体
- ✅ 四人在线对战、AI 补位，上海、纽约、巴黎三张城市地图，四种车型
- ✅ 中英双语：按浏览器语言自动切换，也可以在 ⚙ 设置里改，或者用链接参数 `?lang=en|zh`
- ✅ 手机横屏：虚拟摇杆、冲刺按钮、全屏和横屏锁定
- ✅ 商店：金币买涂装、帽子、喇叭；邀请好友送限定礼物（见 `paid-catalog.md`）
- ✅ 设置：音乐和音效音量、语言、操作说明，以及隐私政策、用户协议、致谢页的链接
- ✅ 新手提示：第一次开局时出现一句操作说明
- ✅ 平台 SDK 层（`game/src/platform/`）：CrazyGames 和 Poki 的加载完成事件、游戏开始/暂停事件、激励广告（复活保留 75% 质量，每局 1 次；结算金币翻倍）、局间广告（间隔至少 90 秒）。广告播放时静音，单人模式同时暂停
- ✅ 上线素材：图标、1200×630 分享图、PWA manifest、robots.txt、社交分享 meta 标签
- ✅ 网页构建：`npm run build:web` 输出到 `dist-web/`，可以直接放到任何静态托管
- ✅ 数据库和埋点：`supabase/migrations`、`submit-match` 函数、`telemetry.ts`

## 你需要做的
1. 🟡 **Supabase**：新建项目，执行两个 migration，部署 `submit-match` 函数，然后把 URL 和 anon key 填进 Vercel 的环境变量 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`。不配置也能玩，但公共联机房间和数据统计要靠它。
2. 🟡 **域名**：买好域名后，把 `game/index.html` 里的 `og:image` 改成绝对地址 `https://你的域名/og.png`，并加上 `og:url`。
3. 🟡 **法律页面**：把 `public/legal/*.html` 里橙色标出的占位信息（公司名、地址、邮箱、管辖地）填好，删掉页面顶部的「Owner note」提示框，最好请律师看一遍。
4. 🟡 **CrazyGames**：注册开发者账号，按官方文档核对 SDK 调用（本环境访问不到官方文档，是按搜索摘要和 npm 类型定义写的），再用 `?platform=crazygames` 在本地跑一遍测试广告，然后提交。
5. 🟡 **Poki**：申请开发者，审核通过后同样核对 SDK。
6. 🟡 **Stripe**（网页内购）：开通账号后，我再接 Checkout 和 webhook。商品 SKU 已写在 `0002_products_seed.sql`。
7. 🟡 **Suno Pro/Premier**：付费期间生成的 BGM 才能商用；导出的 mp3 放到 `public/music/<城市>.mp3` 就会自动替换程序音乐。
8. 🟡 **部署确认**：你确认之后，我把 `dist-web` 部署到你的 Vercel（先出预览链接，再上正式域名）。

## 之后再做
- ⏳ 把金币和礼物记录从浏览器存储迁到服务器，防止改本地数据作弊
- ⏳ 付费第 1 批：创始者礼包、金币包、城市主题包
- ⏳ 尾迹和吞噬特效、赛季通行证
- ⏳ Steam 桌面版

# YouTube Playables

Status: **interest form submitted** (2026-10-05 21:08 local, "Public Playables Interest Form", Google account cityhunters2025@gmail.com). Google only replies if the game is a fit ("we will reach out"); no email otherwise. The response can be edited via the form's "Edit your response" link. Developer access is early access; the SDK, test suite and publishing tools open only after Google approves.

Sources: https://developers.google.com/youtube/gaming/playables · https://developers.google.com/youtube/gaming/playables/support/contact · https://developers.google.com/youtube/gaming/playables/certification/requirements

## Fit

- Engine: three.js / WebGL is on the supported list.
- Cost: free to apply.
- **No external network calls** (certification): no Supabase, so no online rooms, no share/invite links, no telemetry, no off-platform ads or payments. The Playables build is **solo vs AI only**, which already works offline (Quick play vs AI, all cities including Halloween Town).
- Initial load (before the `gameReady` signal) must be under 30 MB; our web package is ~8 MB. ZIP up to 200 MB.
- Villain names: portal build (neutral names), same as Steam and the web portals.

## Build work after approval (estimate: 1–2 days)

1. New portal target `youtube` in `tools/build-portal.mjs`: no Supabase client, no lobby/room browser, no share sheet, no external links (legal pages bundled or linked through the SDK only if allowed).
2. Playables SDK (`ytgame`): `firstFrameReady` and `gameReady` signals, pause/resume and audio on/off from YouTube, save cosmetics and coins through the SDK's save data instead of localStorage, language from the SDK.
3. Run the Playables test suite, then submit for certification.

## Form answers (reference)

Developer: Zhuleli · Contact: cityhunters2025@gmail.com · Game: GROW EVERYTHING · Tech: three.js (WebGL), TypeScript, Vite · Genre: casual / arcade · Playable links: https://grow-everything.vercel.app , https://forevercrab321-svg.itch.io/grow-everything · Languages: English, Simplified Chinese · Size: ~8 MB.

## 2026-10-23 · 没有回复时的做法（用户：YouTube 必须做）

Playables 官方申请没有回复，不干等，三条线同时做：
1. **通过发行商进 Playables**：Playgama Bridge 的平台列表里有 YouTube，问 Playgama 能否代我们把游戏发到 YouTube Playables；Mediacube 是 Playables 变现试点的发行商之一（https://mediacube.io/en/blog/youtube-playables-monetization ），可以联系代发。
2. **自己的 YouTube 频道发 Shorts**：用游戏实录剪 15–30 秒的竖版短视频（越吃越大、吃掉地标、互吃反转），简介放游戏链接。第一条直接用 `release/crazygames/preview-portrait.mp4`。
3. **YouTube 博主**：主攻 Roblox 版（博主最多的赛道），名单由 side agent 搜集，用户确认后再联系；分成用 Roblox 群组的定期分成。

# 01 — The buyers: web game portals & distributors (how they evaluate and pay)

- Research date: **2026-09-24**
- Scope: ToB sale of an HTML5 game (GROW EVERYTHING: 3D 4-player .io "eat the city", three.js, 1.6 MB zip, own Supabase multiplayer backend, cosmetics + rewarded ads, CrazyGames v3 / Poki v2 / GameDistribution SDKs integrated).
- Method: ~47 WebSearch queries. **Every WebFetch attempt was refused by the egress proxy** (developers.poki.com, sdk.poki.com, docs.crazygames.com, static.gamedistribution.com, playgama.com, app.cinevva.com, gamedeveloper.com, abratabia.com). So every claim below comes from **search-engine excerpts** of the cited pages, not from reading the full pages myself. Before signing anything, check the exact wording on the live page or in the contract.
- Search budget: the session-wide cap (200 calls, shared with sibling agents) ran out partway through. The planned searches for featuring and promotion mechanics, Miniclip/MSN money terms and Reddit postmortems were never run. They are listed under Gaps.
- Blacklist respected: no zhihu / WeChat / Baidu Baike sources.

Credibility tags:
- **[official]**: the platform's own docs, terms or press release.
- **[first-hand dev report]**: a developer describing their own results.
- **[third-party]**: a guide, aggregator, news article or competitor blog. Note that Playgama is a competitor portal writing about its rivals, and Cinevva, abratabia and Impulse Media Hub are SEO-style guides.
- **[inferred]**: my own reasoning.

---

## 0. One-screen comparison (money terms as published)

| Platform | Entry route | Dev share (as published) | Payout threshold / timing | Exclusivity | Tag |
|---|---|---|---|---|---|
| **Poki** | Curated. Submit at developers.poki.com, then a staged test funnel | Web-exclusive: Poki traffic split **50/50**, and the dev keeps **100%** of traffic they bring themselves. Non-exclusive: **one-time flat licence fee**, no rev share (amount not published) | not found | Default **5 years**, web-only (Steam, app stores and consoles excluded). **Discord and YouTube Playables count as "web"** and would conflict | [official] via search excerpts: sdk.poki.com/deals, developers.poki.com/guide/revenue-deal-types |
| **CrazyGames** | Self-serve upload at developer.crazygames.com. **Basic Launch**, then invitation to **Full Launch** | Not in the main docs. Jam terms (2026 GameMaker jam): **60% ads / 70% IAP** | €100 (one source) vs €10 invoicing threshold (another); NET 60 contractual, ~10th of the following month in practice; Tipalti | None required. Optional 2-month exclusivity gives **+50% rev share** (third-party claim) | mixed (see §2) |
| **GameDistribution** (Azerion) | Self-serve upload | **33% of net revenue** | €100 minimum; paid within 60 days after the monthly report | Non-exclusive licence to GD and its publisher network | [third-party] for 33%; [official] for threshold and licence wording (terms page via search) |
| **GamePix** | Self-serve dashboard + SDK | **45%** | not found | Choose "Allow Distribution" (network) or GamePix.com only | [official] partners.gamepix.com via search |
| **Yandex Games** | Self-serve console, moderation in 3–5 working days, SDK mandatory | Licence fee **50% of Revenue** (net of taxes, acquiring and store fees) | 3,000 RUB or US$150; depends on legal status and country | not found | [official] yandex.com/legal/yandexgames |
| **Playgama** | Self-serve + Bridge SDK (mandatory) | Partner-network ladder **70% to $1k, 80% to $3k, 90% above**; **50%** on playgama.com itself | US$100; PayPal / Wise / crypto / bank | not stated | [official] self-published, via search |
| **GameMonetize** | Self-serve | "more than 45%" (45% + 45% = 90% if you are also the site owner) | US$30 PayPal, Net30 | not found | [official] gamemonetize FAQ via search |
| **Famobi** | Submission form | "lifetime revenue share", % not published | not found | not found | [official] famobi.com/developers via search |
| **CoolmathGames** | Submission form; also cold outreach to itch.io devs | Buys a **non-exclusive licence** (flat fee; amount not published) | n/a | Non-exclusive | [official] developers.coolmathgames.com; itch.io posts |
| **Armor Games** | Email mygame@armorgames.com or dev portal | Sponsorship / licence. "Timed site exclusivity" is among the highest-paying options | n/a | Optional timed site-exclusive | [official] support.armorgames.com |
| **Kongregate** (sold to Monumental, 2024) | Self-serve dev portal | Ads **25–50%**; stacked programmes **up to 70%** | not found | not found | [official] Kongregate support pages via search |
| **Newgrounds** | Self-serve upload | Historic ad rev share (2007/2009 system, $50 PayPal threshold). Current status unclear; site aims to be ad-free via Supporter | $50 (historic) | none | [third-party] fan wikis. **Possibly outdated** |
| **itch.io** | Self-serve | Open revenue sharing: dev sets the itch cut 0–100%, **default 10%** (sales, not ads) | per itch payout docs | none | [official] itch.io docs / 2015 post (old but still the policy) |
| **Y8 / id.net** | Self-serve upload; contact support to enable rev share | **50%** of in-game AdSense (AFP or manual channel) | via AdSense | "does not require exclusivity" | [third-party] dev.to post by a Y8-affiliated author; [official] y8.com/revshare exists |
| **Lagged** | Self-serve lagged.dev | AdSense rev share paid by Google, % not found | Google AdSense | not found | [official] Construct addon doc / Google case study |
| **MSN Games / Microsoft Casual Games** | Email webgames@microsoft.com, subject "Casual Game Submission" | Ad-Share Program exists (announced **2007**); current % not found | not found | "promotional placements for new or exclusive content" | [official] Xbox support + 2007 Microsoft press release (**old**) |
| **Addicting Games** (Enthusiast Gaming) | Developer Center upload | "pay top dollar for exclusive, creative games"; licensing, sponsorship and dev deals | not found | exclusive preferred | [official] addictinggames.com/about/upload via search |
| **Miniclip** | miniclip.com/publishing ("we want to hear from you") | not found | not found | not found | [official] thin |

---

## 1. Poki

### Platform says [official]
Source for all points below: search excerpts from https://sdk.poki.com/deals and https://developers.poki.com/guide/revenue-deal-types.

**Deal types**
- **Web Exclusive** is the preferred deal. "On the open web, your game will be published only on Poki."
- The **default term is 5 years**, and "Poki invests additional time and resources into your game" in return.
- Scope: Steam, mobile app stores and consoles are *not* covered by the exclusivity. **Discord and YouTube Playables are treated as web platforms**, so releasing there conflicts with the exclusivity.
- Revenue split: "If a user comes to your game through Poki.com, or through a marketing effort from Poki, then Poki splits the revenue 50/50 with you. If a user comes … directly through bookmarks, search, social media, or through your own community, you get 100%." (excerpt of sdk.poki.com / developers.poki.com; also quoted by Cinevva)
- **Non-exclusive**: "For games already live on other web platforms, or with a more niche or short-term fit," Poki offers a **one-time flat licence fee, no revenue share**. The amount is not published.
- Poki flags the term, split and investment as **indicative**: "the real terms depend on the game and are set out in your agreement."
- **Bonus Level** is a developer programme page (https://sdk.poki.com/bonus). Its exact content was not retrievable.

**Test funnel**
Sources: https://developers.poki.com/guide/how-testing-works, https://developers.poki.com/guide/player-fit-test, https://sdk.poki.com/web-fit-test.html.
- The levels run: Level 2 Feedback & Playtesting, then Level 3 **Player Fit Test**, then **Web Fit Test**.
- Player Fit Test:
  - about 500 plays and about 5 hours.
  - The pass bar is **average playtime > 3 min AND ≥ 25% of plays > 3 min**.
  - Poki's own framing: "3 minutes is the bar to advance, not the target … stronger games average 5+ minutes."
  - Reference points: "the average game on Poki reaches around **70% conversion and 6+ minutes** of playtime."
- Web Fit Test:
  - runs for **5–7 days** with a larger player pool.
  - Measures **click-through rate (thumbnail CTR), time on page, and conversion to play**, each against **category averages**.
  - Poki's advice for conversion: short loading, small files, snappy onboarding.

**Requirements**
Sources: https://developers.poki.com/guide/requirements-quality, https://sdk.poki.com/external-resources.
- Target an **initial download under ~8 MB**.
- Must work on desktop, mobile and tablet.
- **All external requests are blocked by default.** Multiplayer games with external servers "can be approved". The approval is requested through the game's Settings, under "Custom Content Security Policy".
- Poki offers its own **Netlib** (networking) and **AUDS** (user data store).
- Multiplayer games with username input must apply profanity filtering using Poki's bad-words list.

**Scale** [official, press release March 2026]
Sources: https://www.accessnewswire.com/newsroom/en/computers-technology-and-internet/poki-announces-milestone-of-625-million-players-without-raising-e-1148808, https://app.dealroom.co/news/feed/poki-hits-1b-monthly-plays-as-developer-first-model-boosts-top-studio-revenues-tenfold-1.
- 625 M players in 2025, 1 B gameplays in one month and about 100 M MAU.
- A 65-person team that has never raised outside money.
- "Top studio revenues tenfold … up to $1 million annually compared to $50,000 previously."

### Others say
- **IAP.** "Poki does not allow in-app purchases — Poki's ad system is the only form of monetization." Cinevva, https://app.cinevva.com/guides/web-game-monetization [third-party]. An X post from "autonomous games" lists "no in app purchases", "web exclusive (no steam, mobile etc)" and "no login walls" as requirements: https://x.com/autonom_games/status/2069642887164510699 [third-party].
  - **Contradiction:** that post says web exclusive excludes Steam and mobile. Poki's own docs say Steam and app stores are *outside* the exclusivity. Both are kept here.
- **Poki does not publish percentages; terms are negotiated per title.** Playgama, https://playgama.com/blog/business-faqs/poki-vs-crazygames-vs-gamedistribution-revenue-share/ [third-party, competitor].
  - **Contradiction:** the 50/50 plus 100%-own-traffic wording *is* on Poki's docs. Playgama's summary says Poki "publishes deal types rather than percentages". Both are kept.
- Licence fee benchmarks: "$300 to $800 non-exclusive and $5,000 or more exclusive." abratabia, https://www.abratabia.com/web-game-monetization/licensing-to-portals.php [third-party]. This is an industry-wide figure, **not** Poki's price.
- Pieter Kooyman (Half Moon Studios CEO, 13 years at Miniclip SA): with the right game on Poki, "expect 5-figure monthlies and 6-figure annual revenues, with a smash hit reaching 7-figures". Poki promotion rewards engagement and monetization. https://pieterkooyman.substack.com/p/in-praise-of-pokicom [first-hand industry operator opinion, not his own P&L].
- Artem Lanin: a solo developer with 5 games and **67 M gameplays on Poki in 2025**. He went from hobby to full-time; no revenue figure was disclosed. https://medium.com/@playrea/from-hobby-to-67-million-gameplays-on-poki-in-2025-df2c147cfb27 [first-hand dev report].
- Other first-hand stories exist but were only seen as titles: https://medium.com/poki/i-quit-my-job-to-make-a-dress-up-web-game-and-it-blew-up-8bbfefca4a1d and https://kuyimobile.substack.com/p/my-game-production-process-and-how [first-hand dev report].

### I infer
- **Poki is the only portal with a real exclusivity price tag.** In exchange you give up every other web channel for a default of 5 years, and that includes Discord Activities and YouTube Playables. That is a big cost for a multiplayer .io game, whose liquidity benefits from being on many portals. [inferred]
- **Our Supabase backend needs explicit CSP approval** from Poki. This must be raised on the first call, not at QA. [inferred]
- **Cosmetics IAP would likely have to be switched off in the Poki build**, if Cinevva's "no IAP" claim holds. [inferred]
- **The own-traffic 100% clause is a negotiation lever.** If we can bring TikTok or creator traffic, Poki's effective take drops. [inferred]

---

## 2. CrazyGames

### Platform says [official]
Sources: search excerpts from https://docs.crazygames.com/faq/, /requirements/intro/, /requirements/technical/, /requirements/multiplayer/, /resources/basic-launch-metrics/, /payouts/.

**Launch path**
- **Basic Launch:**
  - The SDK is optional and there is **no monetization**.
  - It runs for about 2 weeks with a limited audience.
  - It ends once the game has been live **≥ 7 days AND has ≥ 500 plays**.
- QA monitors **average playtime, conversion to gameplay and retention**, benchmarked against other games on the platform.
- Games that perform are invited to **Full Launch**, where the SDK is required and monetization unlocks.

**Metric benchmarks** (basic-launch-metrics page, via search)
- "Successful titles often see **10+ min average playtime**."
- Top titles "convert **80%+**, load in **< 10 s**, build **< 20 MB**".
- Conversion is defined as the percentage of players playing at least 1 minute after starting.

**Technical requirements**
- Initial download ≤ **50 MB** and ≤ **1,500 files**.
- Initial download ≤ **20 MB** to be eligible for the **mobile homepage**.
- Content must meet **PEGI 12**.

**Multiplayer requirements**
- **Instant Multiplayer**: the first player in a party lands in a new private room.
- A join-room listener with no page reload.
- Spectate or a "room unavailable" popup when a round is running.
- A friends API is available.
- Chat must be moderated (at minimum a profanity filter), and must be disabled if there are complaints.
- QA decides whether a multiplayer game goes through Basic Launch.

**Payouts**
- Paid monthly through Tipalti (wire, ACH, eCheck, PayPal).
- NET 60 is the contractual term, but "aim to process … by the 10th of the following month".
- **Threshold contradiction:** some excerpts say a **€100 minimum**, the payouts-page excerpt says a **€10 invoicing threshold**. Both are kept.

**Other official points**
- IAP runs through **Xsolla**, on the CrazyGames Xsolla account, and is available only for invited games (https://docs.crazygames.com/sdk/in-game-purchases/).
- A 2026 CrazyGames × GameMaker web jam published a **60% ads / 70% IAP** developer share (https://crazygames.indiehero.io/cggmwj-jg/, via Cinevva and Playgama).
- The CrazyGames developer-portal launch press release ("revenue share options"): https://start-it-x.prezly.com/crazygames-launches-new-developer-portal-with-revenue-share-options (date not captured).

### Others say
- **No fee to publish and no exclusivity requirement.** Cinevva, https://app.cinevva.com/guides/publish-game-crazygames [third-party].
- **Exclusivity bonus.** "Implementing the SDK incl. ads, allowing CrazyGames to distribute your game to other portals, and agreeing to **exclusivity for 2 months** when launching increases your revenue share by **50%**." Excerpt surfaced from the CrazyGames FAQ / abratabia [third-party via search; possibly official FAQ text — **unverified**, and possibly an old policy].
- **The main docs do not publish a split.** The jam figure is "the closest official datapoint". Cinevva, Playgama [third-party].
- **Scale:** ">300 M gameplays/month, >50 M monthly players" (Impulse Media Hub, 2026) vs "35 M MAU" in an older figure (gamedeveloper.com). Both are kept. https://www.impulsemediahub.com/blog/web-native-games-rising/ [third-party].

### I infer
- **CrazyGames is the natural first buyer for us.** Self-serve, non-exclusive and IAP-capable fits cosmetics, and there are explicit multiplayer rules. [inferred]
- **Our 1.6 MB build clears the 20 MB mobile-homepage bar easily.** [inferred]
- **The real risk is the Basic Launch KPIs.** A 4-player .io game needs enough concurrency during a 500-play test, or players meet empty rooms. Bots or backfill are effectively a requirement. [inferred]
- **The 2-month-exclusive +50% option is a cheap, short lever** worth asking about explicitly. [inferred]

---

## 3. GameDistribution (Azerion)

- **Platform says [official]**
  - Terms page (https://static.gamedistribution.com/terms/developer.html, via search):
    - Paid "within 60 days after the report for the preceding calendar month becoming available … if the Developer Revenue Share is at least **EUR 100**". Balances below that accumulate.
    - GD takes a "worldwide, royalty-free, **non-exclusive** license to distribute … through the Distribution Platform, Publisher Properties and other platforms."
    - "No guarantee that Developer will receive a guaranteed level of Developer Revenue Share."
  - Network size: "over **2,000** web publishers, 300 M users/month" (https://gamedistribution.com/developers/partnership/) vs "**5K** Azerion-owned and third-party portals" (pocketgamer.biz profile). Contradiction kept.
- **Others say:** "**33% of net revenue**, €100 threshold." Playgama [third-party, competitor]. I could not see the percentage in the official terms excerpt.
- **I infer:** GD is a **reach / long-tail syndication** play, not a negotiation target. Our SDK is already integrated, so the marginal cost is low. Watch for conflict with a Poki web-exclusive, since GD syndicates onto the open web. [inferred]

## 4. GamePix
- **Platform says [official]** (https://partners.gamepix.com/developers, /guidelines/submission):
  - **45%** revenue share with the GamePix SDK.
  - "Allow Distribution" sends the game to hundreds of partner sites; leaving it unchecked means **exclusive to gamepix.com**.
  - Only complete games are accepted; templates must be licensed.
- **Gap:** payout threshold not found.

## 5. Yandex Games
- **Platform says [official]**
  - Terms (https://yandex.com/legal/yandexgames/en/):
    - "Yandex pays developers a license fee of **50% of Revenue**."
    - Revenue is net of taxes, acquiring fees, app-store fees and fraud.
  - Docs (https://yandex.com/dev/games/doc/en/concepts/requirements, /services/about-monetization):
    - The SDK is mandatory for moderation, which takes 3–5 working days.
    - Monetization is through ads (fullscreen, rewarded, sticky) or IAP.
    - The payout threshold is **3,000 RUB or US$150**. Terms depend on legal status and country.
  - Yandex also publishes EU-targeting terms: https://yandex.com/legal/gamesforeurope/index.html.
- **Others say:** Yandex Games published 24,000 games and removed 29,000 in 2025. Interview with Nikita Bokarev, https://wnhub.io/news/other/item-49945 [third-party]. This signals heavy volume and churn.
- **I infer:**
  - The audience is mainly CIS. Payment rails for a China-based studio need checking (sanctions and banking). [inferred]
  - Multiplayer-specific rules were not found. [gap]

## 6. Playgama
- **Platform says [official, self-published]** (https://playgama.com/developers, https://wiki.playgama.com/playgama/faq/payments-and-statistics, via search):
  - Partner-site revenue ladder: **70% up to $1,000; then $700 + 80% above $1k; then $2,300 + 90% above $3k**.
  - **50%** on plays on playgama.com itself.
  - Payout threshold **$100**, via PayPal, Wise, crypto or bank.
  - The Bridge SDK is mandatory (LGPL-3.0, https://github.com/playgama/bridge).
  - Interstitials are required for rev share.
  - Playgama also routes games to YouTube Playables and MSN (https://playgama.com/publish-your-game-on-youtube-playables/, https://playgama.com/how-to-publish-game-on-msn/).
- **Others say:** "developer revenue retention up to 80%" (search summary) [third-party].
- **I infer:**
  - Playgama is an **aggregator**, so its value is in reaching MSN and YouTube Playables without doing each BD deal ourselves. [inferred]
  - Using Playgama to reach YouTube Playables would breach a Poki web-exclusive. [inferred from Poki's scope wording]

## 7. GameMonetize
- **Platform says [official]** (https://gamemonetize.com/faq, via search):
  - "more than **45%**" to developers; 45% + 45% = 90% if you are also the publisher (site owner).
  - Minimum payout **US$30** via PayPal, **Net30**, with balances carried forward.

## 8. Famobi
- **Platform says [official]** (https://famobi.com/developers/?locale=en, https://accounts.famobi.com/developer-license-agreement.html):
  - Publishes HTML5 games "on thousands of portals" with a **lifetime revenue share**.
  - The % is not published in the excerpts.
- **Others say:** an html5gamedevs thread asks "is it worth publishing with Famobi" (https://www.html5gamedevs.com/topic/35106-is-worthy-publishing-a-game-with-famobi/) [first-hand dev discussion; content not retrieved; **old**, around 2018].

## 9. CoolmathGames
- **Platform says [official]** (https://developers.coolmathgames.com/, https://www.coolmathgames.com/submit-a-game):
  - HTML5 only, and the game must be a "**thinking**" game (logic, strategy or problem solving).
  - "We will happily purchase a **non-exclusive license**." The developer keeps the IP.
- **Others say:**
  - Coolmath staff cold-message itch.io developers asking whether a game "is available for licensing and the cost", e.g. https://itch.io/post/5787894 [first-hand, observed outreach].
  - A dev blog titled "I made $2,000 in 8 hours as a game developer" / "$2,200 for 2 hours of work" is about portal licensing (https://medium.com/@anulagarwal12/i-made-2000-in-8-hours-as-a-game-developer-dd4083660f10, https://gameplaydev.substack.com/p/i-made-2200-for-2-hours-of-work) [first-hand dev report; the buyer was not confirmed from the excerpt].
- **I infer:** an "eat the city" .io brawler likely **does not fit** Coolmath's "thinking game" and kid-safe filter. Low priority. [inferred]

## 10. Armor Games
- **Platform says [official]** (https://support.armorgames.com/hc/en-us/articles/221224447-Sponsoring-and-licensing):
  - Accepts HTML5 only.
  - Submit by email to **mygame@armorgames.com** or through the developer portal (https://developers.armorgames.com/docs/introduction/overview/).
  - Compensation options include branding, and "**timed site exclusivity** … one of the highest paying options".
  - The API supports IAP.

## 11. Kongregate
- **Platform says [official]** (support pages via search: https://kongregatesupport.zendesk.com/hc/en-us/articles/26759090590221, https://blog.kongregate.com/hc/en-us/articles/44216859526797):
  - Shares **25–50% of ad revenue**.
  - Stacked "Revenue Share Programs" go **up to 70%**.
  - Upload is self-serve.
- **Context:** Kongregate was sold to Monumental in 2024 (Wikipedia) [third-party].
  - An old Gamasutra piece reported "devs making money, revs rising 30% each month" (https://www.gamedeveloper.com/game-platforms/kongregate-devs-making-money-revs-rising-30-each-month) [third-party, **around 2008, very old**].

## 12. Newgrounds
- **Others say [third-party, fan wikis]** (https://newgrounds.fandom.com/wiki/Revenue_Sharing):
  - An ad revenue share has existed since 2007, with the current system announced in 2009 and a $50 PayPal payout.
  - A **Supporter price increase** was announced on 2 March 2026, effective 6 April 2026: from $3/mo and $25/yr to $5/mo and $36/yr (https://newgrounds.wiki.gg/wiki/Supporter_Status).
  - The goal is "100% ad-free", with any surplus going into rev share.
- **Gap:** I could not confirm whether game rev share is currently paid out. Treat Newgrounds as **community / visibility**, not revenue. [inferred]

## 13. itch.io
- **Platform says [official]** (https://itch.io/updates/introducing-open-revenue-sharing, https://itch.io/docs/creators/payments):
  - "Open revenue sharing" since March 2015: the seller sets itch's cut from 0–100%, **default 10%**.
  - This applies to sales, since itch has no ad rev share for browser games.
- **I infer:**
  - For a free multiplayer web game, itch is a **showcase and scouting surface**. Coolmath and other buyers scout itch, as observed above. [inferred]
  - It is not a revenue buyer. [inferred]

## 14. Y8 / id.net
- **Others say [third-party; author appears Y8-affiliated]** (https://dev.to/mohamed_gani_y8/how-to-submit-your-game-to-y8com-and-integrate-the-y8-sdk-39bn):
  - Upload at y8.com/upload, then **contact support to enable rev share**.
  - Two rev-share modes, each **50%**: AdSense for Platforms (your own AdSense account) or a manual Y8 AdSense channel.
  - "Does not require exclusivity."
- The official rev-share page exists: https://www.y8.com/revshare.

## 15. Lagged
- **Platform says [official]** (https://lagged.dev/, https://www.construct.net/en/make-games/addons/957/lagged-com-adsense-revenue/documentation):
  - An official Google AdSense platform partner; **Google pays developers directly**.
  - "Over a hundred developers earning"; the catalogue grew from 4,000 to 6,000 games (date not captured).
- **Gap:** the % was not found.

## 16. MSN Games / Microsoft Casual Games
- **Platform says [official]**
  - Submit by email to **webgames@microsoft.com** with the subject "Casual Game Submission" (https://support.xbox.com/en-IN/game/microsoft-casual-games/msn-games/support/information-for-developers).
  - The **Ad-Share Program** for web titles was announced on **7 Feb 2007** (https://news.microsoft.com/source/2007/02/07/...) [**very old**].
  - Microsoft offers "promotional placements for new or exclusive content".
- **Others say:** Playgama markets a route to MSN / Microsoft Start (https://playgama.com/how-to-publish-game-on-msn/) [third-party]. Double Coconut describes itself as an MSN web-platform dev partner (https://doublecoconut.com/microsoft/) [third-party].
- **I infer:** MSN is primarily a **casual, older audience**. A 4-player .io game is a weaker fit, and the aggregator route is cheaper than direct BD. [inferred]

## 17. Addicting Games (Enthusiast Gaming)
- **Platform says [official]** (https://www.addictinggames.com/about/upload, https://company.addictinggames.com/):
  - "We pay top dollar for **exclusive**, creative games."
  - Deal types: licensing, sponsorship and development deals.
  - The FAQ asks "exclusive or non-exclusive?" but the answer was not visible in the excerpt.
  - Partnered with ByteBrew for developer analytics.

## 18. Miniclip
- **Platform says [official]** (https://www.miniclip.com/publishing): "If you have a game you think is suitable … we want to hear from you."
  - The publishing arm is now mobile-first (PocketGamer.biz feature: https://www.pocketgamer.biz/feature/74439/miniclip-publishing-what-it-offers/).
- **I infer:** Miniclip is not a realistic HTML5 buyer for us today. [inferred; thin evidence]

---

## 19. Cross-platform benchmarks (others say)

| Claim | Source | Tag |
|---|---|---|
| Flat licence fees run from "a few hundred dollars … to $5,000+ for polished titles" | abratabia, https://www.abratabia.com/web-game-monetization/licensing-to-portals.php | [third-party] |
| Licences run "$300–$800 non-exclusive, $5,000+ exclusive" | abratabia (quoted in the Poki search summary) | [third-party] |
| Developer rev share typically runs **50–80%** depending on portal, exclusivity and traffic | abratabia; Game Developer "huge, hidden web game market" | [third-party] |
| A "well-performing casual game on a major portal" earns **$200–$2,000/month** | abratabia / Cinevva | [third-party] |
| A first web game can realistically earn "$500–$3,000/month" | IndieGameBusiness, https://indiegamebusiness.com/web-gaming-for-indie-developers/ | [third-party] |
| Rewarded video eCPM: US **$15–28**, EU $8–15, tier-3 $1–3 (from a Playgama 2026 breakdown) | Cinevva | [third-party] |
| Web display CPM is $0.50–2; AppLixir rewarded is $4+ | Cinevva / AppLixir blog | [third-party, vendor] |
| Ad revenue per 1k DAU per month is $10–40 | search summary (Cinevva / abratabia) | [third-party] |
| "Poki and CrazyGames both offer preferential terms for exclusive titles, sometimes including featured placement" | abratabia | [third-party] |
| Rev-share % is usually in the developer agreement, not on the marketing page | Playgama | [third-party, competitor] |
| "Poki crossed 1 B monthly plays in 2026 with 600+ independent studios"; CrazyGames ">300 M gameplays, >50 M players" | Impulse Media Hub | [third-party] |

## 20. What portals say makes them feature or promote a game

These come from test and metric criteria, since direct featuring-policy searches were not completed.
- **Poki**, in order of the funnel:
  - Player Fit: average playtime > 3 min, with 5+ min as the stronger target.
  - Web Fit: CTR on the thumbnail, time on page and conversion to play, each vs the category average.
  - Poki's average is about 70% conversion and 6+ min.
  - Kooyman says promotion then rewards engagement **and monetization** [first-hand operator opinion].
- **CrazyGames**:
  - Basic Launch uses playtime, conversion (≥ 1 min) and retention vs platform benchmarks.
  - Mobile-homepage eligibility requires a build ≤ 20 MB.
  - Benchmarks for top titles: 10+ min playtime, 80%+ conversion, < 10 s load.
- **Microsoft**: "promotional placements for new or exclusive content" [official, old].
- **Armor / Addicting Games**: exclusivity gets higher pay and featuring [official].

---

## 21. Ten most decision-relevant facts for a small studio negotiating with these portals

1. **Poki web-exclusive defaults to 5 years and counts Discord and YouTube Playables as "web".** Steam, app stores and consoles stay free. The terms are "indicative" and negotiable per title. [official]
2. **Poki's split is 50/50 on Poki-sourced traffic and 100% to the developer on self-sourced traffic.** Bringing our own traffic (creators, TikTok) directly improves Poki economics and is a negotiation chip. [official]
3. **Poki non-exclusive means a one-time flat fee with no rev share.** The public benchmark for non-exclusive licences is roughly $300–$800; exclusive licences run $5k+. [official + third-party]
4. **Poki blocks external requests by default.** Our Supabase backend needs CSP approval, or we use Poki Netlib instead. Raise this early. Poki's reported no-IAP stance means the cosmetics store probably can't ship there. [official + third-party]
5. **CrazyGames is self-serve and non-exclusive.** Basic Launch runs ≥ 7 days and ≥ 500 plays, with no ads during it. Full Launch depends on playtime, conversion and retention vs benchmarks (top titles reach 10+ min and 80%+ conversion). [official]
6. **CrazyGames has explicit multiplayer rules**: instant multiplayer and private rooms, join without reload, and spectate or "unavailable" handling. Its money terms: 60% ads / 70% IAP (jam terms), IAP through Xsolla, and a reported +50% share for a 2-month exclusive. [official + unverified]
7. **The funnel gates are playtime and conversion.** Poki's floor is 3 min average with 25% of plays over 3 min; the Poki average is 70% conversion and 6+ min. For a 4-player .io game, **empty-room risk during a 500-play test is the #1 commercial risk**, so bots or backfill are needed. [official + inferred]
8. **Published shares vary widely.** GameDistribution about 33% of net (third-party), GamePix 45%, GameMonetize 45%+, Yandex 50% of net, Y8 50%, Kongregate 25–50% (up to 70%), Playgama 70→90% on its network and 50% on its own site. [mixed]
9. **Payout thresholds are small (€/$10–150), but cash arrives slowly.** GameDistribution pays up to 60 days after the monthly report; CrazyGames is NET 60 on paper and about the 10th of the next month in practice; GameMonetize is Net30. Plan cash flow for a 1–2 month lag. [official]
10. **Exclusivity is the main currency every buyer pays for.** Poki pays with investment and promotion; Armor Games with its highest sponsorship tier; Addicting Games with "top dollar"; CrazyGames with +50% share; Microsoft with promo placements. Because syndicators (GameDistribution, GamePix, Playgama) push builds onto the open web, **decide Poki-exclusive vs a multi-portal strategy before enabling any syndication**. [official + inferred]

## 22. Gaps (not verified or not found)

- Full-page verification of every official claim. **WebFetch was blocked on all portal domains**; everything above comes from search excerpts.
- Poki: the actual non-exclusive licence-fee amount; what "investment" in a web-exclusive deal concretely means (MG? advance?); Bonus Level details; payout threshold and timing; whether IAP is truly banned (only third-party sources); how multiplayer .io games are tested when concurrency is low.
- CrazyGames: the official current ads split outside jam terms; whether the "+50% for 2-month exclusivity" is current; the €100 vs €10 threshold contradiction; the exact retention benchmark.
- GameDistribution: the 33% figure is not seen in the official terms excerpt; the network-size contradiction (2,000 vs 5,000 sites).
- GamePix, Famobi, Lagged and Addicting Games payout thresholds and %.
- Yandex: rules for multiplayer games and eligibility and payment rails for non-CIS (e.g. China-based) developers.
- Newgrounds: whether game ad rev share still pays out in 2026.
- MSN / Microsoft Casual Games: current ad-share % (the only source is a 2007 press release).
- Miniclip: whether it licenses third-party HTML5 games at all in 2026.
- Real developer postmortems with **portal-by-portal revenue numbers** (Reddit r/gamedev, Game Developer). Searches did not surface any concrete numbers; the search budget ran out before more targeted queries.
- Featuring and homepage promotion mechanics beyond test metrics, for Poki and CrazyGames. The planned searches were never run because the budget ran out.
- Public generic BD contact routes. Found: Armor Games **mygame@armorgames.com** and Microsoft **webgames@microsoft.com**. Everything else is a submission form or portal. No personal emails were collected.

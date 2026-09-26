# 02 — Licensing & Sponsorship Playbook for Web Games (Flash era → HTML5 2026)

Research dimension for the `game-platform-bd-framework` topic skill.
Compiled 2026-09-24. Researcher: sub-agent 02.

## Method and source-quality warning

- 33 WebSearch queries were run before the session-wide search budget was exhausted. Every WebFetch attempt was **blocked by the egress proxy** (northwaygames.com, gamedev.net, photonstorm.com, gamedeveloper.com, escapistmagazine.com, emanueleferonato.com, famobi.com, developers.poki.com, docs.crazygames.com, html5gamedevs.com, wikipedia.org, playgama.com). **So every claim below is "search excerpt only"**: it is the search engine's summary of the page, not text I read in full. Treat numbers as leads and check them against the original page before quoting them to a partner.
- Credibility tags: **[official]** = the platform or company itself; **[first-hand dev report]** = a developer describing their own deal; **[third-party]** = journalist, forum, aggregator or vendor blog; **[inferred]** = my own reasoning, with no source.
- Vendor blogs (Playgama, Genieee, Guul, MarketJS, DoonDook, Cinevva) sell licensing services or are SEO content. They are tagged [third-party] and should be read as marketing, even when they describe their own prices.
- Blacklisted sources (zhihu, WeChat, Baidu Baike) were not used. Quora and Fandom results showed up in searches but no claim relies on them alone.

---

## 1. Flash era (≈2006–2016): how the B2B market worked

### 1.1 Who paid, and why

| Claim | Source | Tag | Year |
|---|---|---|---|
| **Sponsorship** means a portal pays the developer to "tag" the game with the portal's branding (usually with a "more games" link). In effect the portal pays for the traffic the game sends back as it spreads across the internet. | https://www.gamedeveloper.com/game-platforms/the-flash-game-sponsorship-game ; https://www.dice.com/career-advice/flash-games | [third-party] | ~2009–2012 |
| **Licensing** means a portal pays a one-off fee to host the game on its own site **without** the sponsor logo, in-game ads or developer links. | https://www.dice.com/career-advice/flash-games ; Nitrome wiki summary https://nitrome.wiki.gg/wiki/Distributable_games | [third-party] | ~2010 |
| Mochi Media's 2009 survey (1,104 devs/publishers, run with Adobe, Newgrounds, FGL and JayIsGames): 58% used around-game ads, 43% used sponsorship, and 20% earned more than $1,000/month. | https://www.globenewswire.com/de/news-release/2009/12/08/1203448/0/en/Mochi-Media-Releases-First-Flash-Games-Market-Survey.html | [official] (Mochi press release) | 2009 |
| Game file constraint: a single SWF, ideally under 5 MB. Larger files cut down how many portals picked the game up. | https://www.dice.com/career-advice/flash-games | [third-party] | ~2010 |

**The sponsor's logic.** The sponsor paid in advance for a stream of backlinks and branded plays that went viral. That is why bids followed expected spread and replay ("traffic"), not artistic merit. [inferred from the definitions above]

### 1.2 Licence taxonomy (the FGL vocabulary)

| Licence | What the buyer gets | What the developer keeps | Source / tag / year |
|---|---|---|---|
| **Exclusive sponsorship** | Its branding on the only worldwide version. No other sponsor branding, and typically no site-locks sold to others. | The ad revenue it negotiates (often none) | Northway Rebuild post (Two Towers switched its bid from primary to exclusive, so Sarah Northway "couldn't sell sitelock versions") https://northwaygames.com/rebuild-selling-a-flash-game-on-flashgamelicense/ [first-hand dev report] ~2011 |
| **Primary sponsorship** (created by FGL) | Its branding on the worldwide viral release | The right to sell **site-locked non-exclusive licences** and to keep in-game ads. FGL described it as "an exclusive license without the drawbacks". | Feronato quoting FGL https://emanueleferonato.com/2008/02/16/find-a-sponsor-for-your-flash-game-with-flash-game-license/ [third-party quoting official] 2008 ; FGL founders' description https://gamedev.net/tutorials/industry/interviews/flashgamelicensecom-interview-r2683 [official, interview] |
| **Site-lock (non-exclusive) licence** | A copy locked to one domain, with ads and the primary sponsor's logos removed and the buyer's high-score API added | Everything else | https://emanueleferonato.com/2008/03/04/experiment-monetizing-a-flash-game-part-8/ [first-hand dev report] 2008 |
| **Ad-removal leverage** | Developers kept in-game ads, then offered to strip them for a portal that paid for a site-lock | — | Feronato/FGL summary (same URL as above) [third-party] 2008 |

### 1.3 Marketplace mechanics: FlashGameLicense (FGL)

- FGL was founded by Chris Hughes and Adam Schroeder as a broker marketplace where sponsors browse games and bid. [official interview] http://freelanceflashgames.com/news/2008/05/02/flash-game-license-interview-with-adam-schroeder/ (2008)
- By 2011 FGL had brokered **nearly 6,000 deals** and paid **$8.6M** to developers. [third-party, attributed to FGL] via search summary of https://www.escapistmagazine.com/Designing-Flash-Games-for-Fun-and-Profit/ (2011)
- Average time to sale was **19 days** from "visible to sponsors" to accepted bid (dataset of 799 deals). [third-party, FGL stats] https://www.slideshare.net/slideshow/flash-game-development/8836350 (Colm Larkin talk, ~2011)
- At its peak the marketplace generated **over $400,000 in licences per month**. [third-party, Feronato quoting FGL] https://emanueleferonato.com/2016/11/01/fgl-closes-the-popular-flash-marketplace-and-focuses-on-mobile-monetization-paying-you-50-for-each-game-you-enhance/ (2016)
- **Bidding dynamics, first-hand.** In Sarah Northway's Rebuild sale, early bids were primary licences. As bids rose, sponsors added **extra work requirements**. The winning bid came 20 days in, when Two Towers Games converted its offer to **exclusive**. The price was not disclosed, but it was high enough to put the game on FGL's top-sellers list. [first-hand dev report] https://northwaygames.com/rebuild-selling-a-flash-game-on-flashgamelicense/ (~2011)
- Another first-hand example: bids started at **$300 and rose to $5,000** over a couple of weeks on FGL. [first-hand dev report, forum] https://community.clickteam.com/forum/thread/87935-battle-pixels-fgl-sponsorship-bids/ (year not confirmed in excerpt, likely 2013–2014)
- Richard Davey (Photon Storm) put Kyobi on FGL and saw immediate interest. He **also emailed sponsors directly, and 2 of them replied and bought licences**, so outbound selling ran alongside the marketplace. [first-hand dev report] https://photonstorm.com/tags/sponsorship (~2009–2010)

### 1.4 Price levels over time (Flash)

| Metric | Value | Source | Tag | Year |
|---|---|---|---|---|
| Average price per game sold on FGL | "closer to two or three thousand dollars" | FGL founders interview https://www.escapistmagazine.com/Designing-Flash-Games-for-Fun-and-Profit/ | [official, quoted by third-party] | ~2011 |
| Top ~1% of games | **$20,000–$30,000**, "one or two games a month"; a similar number at about half that | same | [official, quoted] | ~2011 |
| Average **exclusive** sale | **$1,960.75** | FGL stats in Larkin talk https://www.slideshare.net/slideshow/flash-game-development/8836350 | [third-party citing FGL] | ~2010–2011 |
| Average **primary** sale | **$939.30** | same | same | same |
| Average winning primary bid | "under $1000", mostly dress-up or seasonal games whose value sponsors "can easily judge" | Escapist / Northway (search excerpt) | [third-party] | ~2011 |
| Site-lock licence | "$5–10k range" appeared in one aggregated search summary with no attributable page. **Treat as unverified; it contradicts every other data point.** | search summary only | [third-party, unverified] | ? |
| Average per-game licence price for a site owner buying games | $1,428.57 | https://www.dice.com/career-advice/flash-games | [third-party] | ~2010 |
| Collapse of "AAA" sponsorships | Only **2 games** got more than $10k (primary/exclusive) in the last 6 months, against **16** in the previous 6 (−87%). Mid-range deals were **rising**. **$150k–$250k/month** was still spent on sponsorships, part of it on mobile. | FGL via https://emanueleferonato.com/2014/06/24/the-present-and-future-of-flash-game-development-according-to-fgl/ | [third-party quoting official] | 2014 |
| Market end | Mochi Media closed on 31 Mar 2014: "no meaningful position beyond Flash". FGL closed its Flash marketplace in Nov 2016 and pivoted to mobile ($50 per enhanced app). | https://techcrunch.com/2014/03/16/with-no-meaningful-position-beyond-flash-gaming-platform-mochi-media-will-close-march-31/ ; https://emanueleferonato.com/2016/11/01/... | [third-party] | 2014, 2016 |

**Contradiction:** "average ≈ $2–3k" (FGL founders) against "average primary $939 / exclusive $1,961" (FGL stats slide). These are probably different periods or different definitions (all deals vs by licence type). Both are kept.

### 1.5 Postmortems with revenue mix

| Game / dev | What was reported | Source | Tag | Year |
|---|---|---|---|---|
| **SteamBirds** (Andy Moore) | About **$34k in the first month**. Moore's own share was ~$15k after FGL and team splits. ~$45k lifetime. **Ads were barely 10%** of revenue (Kongregate rev-share paid 4–5x CPMStar + Mochi combined). **$11k came from site-locks and licences.** The sequel, Survival, added $10k in microtransactions. | https://www.gamedeveloper.com/game-platforms/in-depth-behind-flash-game-i-steambirds-i-revenue-deals ; https://www.gamedeveloper.com/business/steambirds-survival---by-the-numbers | [first-hand dev report] | 2010 |
| Unnamed case in "Where's the Cash for Flash?" | Ads about $5.5k, **licensing about $22k**, ~$40k total for 7 months of work. The article's thesis is that you need multiple revenue streams. | https://www.gamedeveloper.com/business/where-s-the-cash-for-flash- | [third-party, reporting a dev] | ~2009–2010 |
| **Emanuele Feronato** | Several small sponsored games. One Kongregate sponsorship amount was **not disclosed**. After games stopped earning he sold AS2 **source code**: 754 purchases in 10 months, with sales decaying fast after month 1. | https://emanueleferonato.com/2008/05/03/experiment-monetizing-a-flash-game-part-9/ ; https://www.emanueleferonato.com/2012/08/06/selling-source-code-of-flash-games-10-months-later/ | [first-hand dev report] | 2008, 2012 |
| **Fancy Pants Adventures** (Brad Borne) | Sponsored by Armor Games. **Amount not found.** | https://en.wikipedia.org/wiki/Fancy_Pants_(video_game_series) (search excerpt) | [third-party] | ~2006–2008 |
| **Rebuild 1/2** (Northway) | Rebuild 1 went exclusive with Two Towers (amount undisclosed). Rebuild 2 was sponsored by Armor Games (Daniel McNeely). | https://northwaygames.com/rebuild-2-sponsor-get/ | [first-hand dev report] | ~2011–2012 |
| **Nitrome** | Early on relied "solely" on sponsorships and licensing. Several titles were sponsored by Miniclip. Later shifted to its own site traffic and ads as loyal visitors grew. | https://en.wikipedia.org/wiki/Nitrome ; https://nitrome.fandom.com/wiki/Nitrome | [third-party] | 2005–2012 |
| **Ninja Kiwi / Bloons** | Its own portal (Game Elephant, 2007–08) **failed to gain traffic**, so the company relied on distribution. It has been profitable since Bloons (2007). Acquired by MTG in 2021. **Contradiction on price:** $141.8M upfront (Game Developer) vs "$203M" reported elsewhere, probably upfront + earn-out. | https://www.gamedeveloper.com/game-platforms/mtg-acquires-i-bloons-i-dev-ninja-kiwi-for-141-8-million ; https://en.wikipedia.org/wiki/Ninja_Kiwi | [third-party] | 2007, 2021 |
| Mochi Media | Acquired by Shanda Games for **$80M** (2010) and shut down in 2014. | https://techcrunch.com/2010/01/11/mochi-media-acquired-by-shanda-games/amp/ | [third-party] | 2010 |

### 1.6 What made a game command a high bid (Flash)

- **Practitioners and brokers said:**
  - Genres that were familiar and easy to value (dress-up, seasonal) got **low, safe bids**. [third-party, Escapist excerpt, ~2011]
  - Top-1% deals ($20–30k) went to a handful of polished games each month. [official, FGL, ~2011]
  - Sponsors attached **extra work** (feature requests, API integration, branding) as bids rose. [first-hand, Northway]
  - Marketplace listing plus direct outreach produced more buyers. [first-hand, Davey]
- **My inference [inferred]:**
  - Sponsors paid for expected viral spread × session length × brand exposure.
  - The drivers were a sequel-able IP, a strong first-minute hook, polish visible in screenshots, and replayability (upgrades, levels). The Fancy Pants, Bloons, Rebuild and SteamBirds sequel pattern suggests sponsors paid more for **series**, because the sequel's audience was pre-built.

---

## 2. HTML5 transition (≈2012–2016)

- Davey (2012): portals applied **fixed-price non-exclusive licences** to HTML5 games, the same as Flash "site-lock sales". "There is no market at the moment for exclusive HTML5 games" and **no bidding wars** like Flash had. [first-hand dev report] https://photonstorm.com/game-development/business/insert-coin-to-continue-the-html5-game-sponsorship-market (2012)
- 2014 article: Spil Games bought **exclusive HTML5 licences at $2,000–$5,000** depending on quality, genre and publisher. A **non-exclusive** licence on FGL-type marketplaces was about **$500**. Revenue share (give the game free, take a % of ads) was the third route. "No automatic distribution channels" meant manual BD work. [third-party] https://bdaily.co.uk/articles/2014/09/04/a-new-life-for-your-game-or-how-to-sell-something-that-has-already-been-sold (2014)
- FGL's HTML5 push (2014): **up to $200 paid in advance** for implementing the FGL HTML5 API, then **70% of net** to the developer. The programme was later characterised as having failed. [third-party] https://emanueleferonato.com/2014/02/28/fgl-will-pay-in-advance-up-to-200-for-your-html5-games/ ; https://juegosenhtml5.blogspot.com/2015/02/como-ganar-dinero-con-fgl.html (2014–2015)
- Contract pain: negotiating licence and rev-share terms is "hard, exhausting, and annoying". The author recommends writing your own **"document of standards"** (your default positions) to speed up deals. [first-hand dev report] https://www.gamedeveloper.com/game-platforms/signing-an-agreement-to-license-your-html5-games---could-it-become-easier- (~2013)

---

## 3. HTML5 today (2020–2026): who buys, and how

### 3.1 Portal deals: official terms

| Platform | Terms (as surfaced) | Source | Tag | Year |
|---|---|---|---|---|
| **Poki** | **Web Exclusive** (default) runs 7 years across open-web browser platforms, including Discord and YouTube Playables. Revenue split is 100% of revenue from direct traffic and 50/50 on Poki-referred traffic, plus marketing, brand deals and premium ads. **Non-Exclusive** is a **one-time flat licence fee, no rev-share**, offered for games already live elsewhere or with a niche or short-term fit. Terms are negotiated per title. | https://sdk.poki.com/deals ; https://developers.poki.com/guide/revenue-deal-types | [official] (search excerpt) | 2025–2026 |
| **CrazyGames** | No exclusivity required, with preferential terms or featuring sometimes offered for exclusives. Basic Launch (about 2 weeks of measured engagement) comes before Full Launch. **CrazyGames hosts only the game files; multiplayer servers are the developer's responsibility (e.g. Photon).** | https://docs.crazygames.com/faq/ | [official] (search excerpt) | 2025–2026 |
| CrazyGames rev-share numbers | "60% of ad revenue, 70% of IAP, €100 minimum payout via Tipalti". These figures come from a **third-party guide**, not the official docs excerpt. | https://app.cinevva.com/guides/publish-game-crazygames | [third-party] | 2026 |
| **GamePix** | Ads revenue: **45% developer / 45% publisher site / 10% GamePix**. GamePix ads must be kept in the game. | https://partners.gamepix.com/developers ; https://company.gamepix.com/vg5-terms-of-service/ | [official] (search excerpt) | current |
| **GameMonetize** | Rev-share network. One excerpt says "45% revenue share, NET 30". Some of its publishers are exclusive to it. | https://gamemonetize.com/faq | [official] (excerpt; which side gets 45% is unclear) | current |
| **Famobi** | Developers get a **lifetime revenue share**. Exclusive or non-exclusive is set per game. The developer licence grants Famobi an **irrevocable, perpetual, worldwide, sub-licensable** licence. Percentages sit in Annex A (**not found** publicly). The buy side sells **monthly subscriptions** to ad-free game catalogs for public transport, digital signage, in-flight entertainment, telcos/VAS and TV. Its affiliate programme needs 50k+ visits/month. | https://accounts.famobi.com/developer-license-agreement.html ; https://famobi.com/license-html5-games/?locale=en ; https://famobi.com/license-html5-games/value-added-service/?locale=en | [official] (search excerpt) | current |
| **Playgama** | Bridge SDK advertises an 80% rev-share. Plays on playgama.com and its iframe network pay a fixed 50%. Its blog cites non-exclusive licences at **~$300–800 per platform** and exclusives **from ~$5k to >$25k** for polished titles. | https://playgama.com/developers ; https://playgama.com/blog/business-faqs/poki-vs-crazygames-vs-gamedistribution-revenue-share/ | [official] for its own terms; [third-party/marketing] for market prices | 2026 |

**Contract gotcha to note (Famobi).** "Irrevocable, perpetual, sub-licensable" means that once you sign, you cannot take the game back from that channel. Read Annex A before signing. [inferred from the official wording]

### 3.2 Current licence price bands (all third-party; no official market data found)

| Band | Source | Tag | Year |
|---|---|---|---|
| Non-exclusive $400–600, exclusive up to $2,000 (developer asks) | html5gamedevs forum via search summary https://www.html5gamedevs.com/topic/43480-how-do-you-guys-determine-the-price-of-your-html5-game/ | [first-hand dev report, forum] | ~2019 |
| Non-exclusive $200–600 average per game | html5gamedevs threads (search summary) | [first-hand, forum] | ~2015–2019 |
| Non-exclusive $200–2,000; exclusive $3,000–15,000+ | https://guul.games/blog/html-5-game-licensing-for-brands-a-core-guide ; https://genieee.com/the-state-of-html5-game-licensing-in-2025-trends-rates-and-marketplaces-2/ | [third-party, vendor] | 2025 |
| MarketJS catalogue games $699–2,999; up to 80% off in bulk. Brand work includes MTN's subscription portal, Warner Bros/DC and Hyundai/Fox Sports. | https://www.marketjs.com/ ; https://www.marketjs.com/license-web-games/ | [official, vendor price list] | current |
| Non-exclusive $300–800 per platform; exclusive $5k–25k+ | Playgama blog (above) | [third-party, vendor] | 2026 |

**Trend inference [inferred].** Flash-era primary/exclusive averages were ~$1–3k. HTML5 non-exclusive fees have stayed at a few hundred dollars for a decade. Exclusivity is now bought mainly with **rev-share plus marketing** (Poki, CrazyGames) rather than with cash. Large cash deals appear only for brand/B2B white-label work or acquisitions.

### 3.3 White-label / reskin / B2B catalogs

- A white-label licence ranges from a visual reskin (logo, colours) up to fully branded onboarding, reward integration and localisation. Scope drives cost and timeline. [third-party, vendor] https://guul.games/blog/html-5-game-licensing-for-brands-a-core-guide (2025)
- Buyers are telcos/VAS, transit, in-flight entertainment, digital signage, TV and super-apps. Famobi names Vodafone, Xiaomi, Glance, YouTube and Amazon as partners. [official, Famobi] https://famobi.com/license-html5-games/?locale=en
- **Multiplayer fit [inferred].** Catalog buyers (airlines, signage, telco VAS) generally want **offline-capable, self-contained, ad-free** single-player games. A 4-player game that depends on a server is a poor fit for catalog resale unless you offer a bots-only or offline mode, or charge a hosted-service fee.

---

## 4. Multiplayer / .io economics in B2B

| Claim | Source | Tag | Year |
|---|---|---|---|
| CrazyGames does not host multiplayer servers, so the developer pays for its own backend. | https://docs.crazygames.com/faq/ | [official] | 2025–26 |
| **Agar.io** (Matheus Valadares) was bought by **Miniclip in July 2015**, price **undisclosed**. Around the same time Tencent took a majority stake in Miniclip. | https://agario.fandom.com/wiki/Miniclip ; https://dinogame.gg/blog/history-of-miniclip/ | [third-party] | 2015 |
| **Slither.io** (Steve Howse, Lowtech Studios) earned **>$100k/day in ad revenue** at its 2016 peak. It had no IAP except a $3.99 ad-removal. One excerpt says Lowtech was acquired by Goodgame Studios in 2017. **Not verified; treat as unconfirmed.** "Over $100M lifetime ad revenue" comes only from a low-credibility blog. | https://www.digitaltrends.com/gaming/viral-app-slither-pulls-100k-per-day/ ; https://www.loopinsight.com/2016/06/20/slither-io-game-goes-viral-brings-developer-100k-a-day/ ; https://dinogame.gg/blog/how-slither-io-was-made/ | [third-party] | 2016–2017 |
| Krunker.io was acquired by FRVR (reported 2021). | **Not verified this session** (search budget exhausted); from background knowledge only | [inferred / unverified] | ~2021 |
| Shell Shockers (Blue Wizard Digital), diep.io, surviv.io distribution or acquisition terms | **not found** | — | — |
| Price of an .io game's non-exclusive portal licence | **not found** | — | — |

**Inference on who pays for servers [inferred].**
- On today's rev-share portals the developer carries server cost and is paid a share of ads/IAP. Server cost scales with concurrent users, while revenue scales with ad impressions. That makes rev-share without a server subsidy risky for a multiplayer game on a big portal.
- The .io games that "won" B2B mostly did it through **acquisition of the whole game** (Agar → Miniclip, Krunker → FRVR, if confirmed), not through licence fees. The buyer takes on infrastructure and live-ops.
- A non-exclusive flat fee (Poki) with **no rev-share** is the worst case for a server-backed game: traffic, and so cost, grows while the income is fixed. Negotiate a server-cost clause, a traffic cap, or rev-share instead.

---

## 5. Pricing & negotiation playbook

**What practitioners said:**
- Put the game in a marketplace **and** email sponsors directly. [first-hand, Davey]
- An open auction took ~19–20 days to peak (FGL average; Rebuild's 20 days). Bids climb and buyers change the licence type (primary → exclusive) to win. [official stats; first-hand Northway]
- Keep ads in the game as leverage: ad removal becomes the thing a site-lock buyer pays for. [third-party quoting FGL]
- Several revenue streams beat any single one. SteamBirds: licences ≫ ads. "Where's the Cash": licensing is 55% of the total. [first-hand; third-party]
- Write a personal "standards" document of default contract positions. [first-hand, HTML5 licensing article]

**What others say (brokers/vendors):**
- Exclusive ≈ 4–10x non-exclusive (FGL: $1,961 vs $939 primary; HTML5: $500 vs $2–5k). [computed from sources above]
- Easy-to-value genres get low but reliable bids. [Escapist]

**Inference [inferred]:**
- **Anchoring:** open with a data-backed exclusive price (retention, session length, CCU from a soft launch). Offer a non-exclusive option as the fallback, not the opener.
- **Multiple bidders plus a time box:** run a 2–3 week window with a published close date. That reproduces the FGL dynamic, where bids rose until the last days.
- **The exclusivity premium must price in the opportunity cost** of every other portal for the whole term (Poki: 7 years), not just the cash.

### Contract gotchas checklist
From sources where cited; the rest is [inferred] practice.

1. **Term:** Poki Web Exclusive is 7 years [official]. Famobi's grant is perpetual and irrevocable [official]. Push for a fixed term with an exit if revenue falls below X.
2. **Territory and scope of "web":** Poki's exclusivity covers Discord and YouTube Playables [official]. Define precisely which channels are covered: web, apps, PWAs, Steam, mobile wrappers.
3. **Site-lock vs viral copy:** who may host copies, and are embeds and iframes allowed? [Flash-era practice]
4. **Source code:** licences normally cover builds, not source. Selling source is a separate product, as Feronato's post-mortem sales show [first-hand].
5. **Updates and support obligations:** sponsors added work as bids rose [first-hand, Northway]. Cap revision rounds and price live-ops.
6. **IP ownership:** keep IP and license rights out. Watch "sub-licensable" clauses (Famobi) [official].
7. **Branding and splash:** logo placement, "more games" links, splash length. This is the core of what sponsorship buys [third-party].
8. **Ad inventory control:** GamePix requires its own ads to stay in [official]. Portal SDKs replace your ad stack. Agree whose rewarded ads run and who sells cosmetics or IAP.
9. **Servers (multiplayer-specific):** who pays hosting, uptime SLA, CCU caps, cross-portal shared lobbies vs separate player pools. **No source found**; negotiate this explicitly. [inferred]
10. **Payment terms:** minimum payout thresholds and net-30 schedules (GameMonetize NET30; CrazyGames €100 threshold [third-party]).

---

## 6. Ten most transferable lessons for selling a 2026 HTML5 multiplayer game

1. **The cash-bidding era is over.** In HTML5, exclusivity is paid for in **rev-share plus marketing** (Poki's 7-year Web Exclusive), not upfront cash. Expect flat fees only for non-exclusive licences, and small ones: ~$200–800 in third-party reports.
2. **Price exclusivity against the whole term.** A 7-year exclusive closes every other web channel, so compare it with a modelled multi-portal non-exclusive income before saying yes.
3. **Never take a flat fee for a server-backed game** without a traffic/CCU cap or a hosting contribution. Portals like CrazyGames do not host servers.
4. **Run a time-boxed, multi-buyer process.** FGL's ~19–20 day auctions and Davey's parallel direct emails show that competition, not a single pitch, moves price.
5. **Lead with data, not the trailer.** Brokers said easily judged games got low, safe bids. A novel 3D .io game has to supply its own evidence (soft-launch retention, session length, CCU) to escape the "can't value it" discount.
6. **Keep a tradable lever.** Flash devs kept ads so they could sell their removal. The 2026 equivalents are your rewarded-ad and cosmetics stack, your own server region, and a branded lobby or splash.
7. **Stack revenue streams.** Every postmortem (SteamBirds, "Where's the Cash") shows licences, ads and IAP together beating any one alone.
8. **Build a sequel or series story.** Sponsors repeatedly returned to Fancy Pants, Rebuild, Bloons and SteamBirds. Pitch the roadmap, not a one-off.
9. **The biggest .io outcomes were acquisitions** (Agar.io → Miniclip 2015; Krunker → FRVR, unverified). Keep IP clean and metrics auditable so the game is acquisition-ready. Avoid perpetual sub-licensable grants that complicate a later sale.
10. **Split B2B catalogs from portals.** Telco, airline and signage catalogs (Famobi, MarketJS) want offline, ad-free builds. Offer a bots-only or offline SKU if you want that channel, and keep multiplayer for the portals.

---

## 7. Gaps (not found / not verified)

- Primary pages were not read in full because WebFetch was blocked on every domain. **All figures need verification against the original pages.**
- Poki non-exclusive flat-fee amounts: **not found**. CrazyGames' official rev-share % (only a third-party figure was found): **not found**. Famobi Annex A %: **not found**.
- Fancy Pants, Rebuild 1 and Feronato's Kongregate sponsorship amounts: **undisclosed / not found**.
- Nitrome's per-game licence prices: **not found**.
- Agar.io acquisition price: **undisclosed**. Slither.io acquirer and price: unverified. Krunker/FRVR deal terms: not verified. Shell Shockers, diep.io and surviv.io deals: **not found**.
- Any .io game's portal licence fee, or any server-cost-sharing clause in a portal contract: **not found**.
- GameDistribution, Y8, Armor Games and Kongregate's current (2026) HTML5 buy-side prices: **not searched** (budget exhausted).
- The "$5–10k site-lock" figure: unattributed, likely wrong. Kept only as a flagged contradiction.
- Ninja Kiwi acquisition price: $141.8M vs $203M. Unresolved (likely upfront vs incl. earn-out).

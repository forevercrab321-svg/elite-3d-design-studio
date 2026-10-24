--!strict
-- GROW EVERYTHING (Roblox): Roblox-only settings. Gameplay balance is the web game's own
-- (Shared.WebConfig, exported from game/src/config by tools/roblox-config.mjs); positions and sizes
-- stay in metres there and are converted with STUDS_PER_METER here.

local WebConfig = require(script.Parent:WaitForChild("WebConfig"))

local Config = {}

-- 1 m = 10 studs: the 0.35 m starting machine is 3.5 studs, a 192 m city 1,920 studs and the
-- tallest scenery mesh tile stays under Roblox's 2,048-stud part limit.
Config.STUDS_PER_METER = 10

-- Campaign order of the web arena (world/cities/index.ts).
Config.CITIES = { "shanghai", "newyork", "paris" }

-- Rounds: the web arena's numbers plus a lobby wait between rounds.
Config.INTERMISSION_SECONDS = 15
Config.ROUND_SECONDS = WebConfig.arena.roundSeconds
Config.COUNTDOWN_SECONDS = WebConfig.arena.countdownSeconds
Config.RESULTS_SECONDS = 8
Config.MIN_PLAYERS_TO_START = 1

-- Player machines: the web game's four vehicles, one per player in join order.
Config.MACHINE_LOOKS = { "collector", "dozer", "racer", "magnet" }
-- Slot colours (config/vehicles.ts SLOT_COLORS).
Config.SLOT_COLORS = {
	Color3.fromHex("ffb347"), Color3.fromHex("5ec8ff"), Color3.fromHex("ff6b8a"),
	Color3.fromHex("8be07a"), Color3.fromHex("c89bff"), Color3.fromHex("f5f07a"),
}

-- The server's distance slack when checking a client's claim (positions arrive a little late).
-- (Starter rings, gold and power crates are part of the exported arena layout.)
Config.CLAIM_SLACK = 1.6

-- Monetization (create in the Creator Hub, then paste the ids). 0 = not set up yet.
-- Cosmetics only: nothing you can buy makes you bigger or faster.
Config.GAMEPASS_VIP_TRAIL = 0

-- Remote names (created by the server in ReplicatedStorage.Remotes).
Config.REMOTES = { "Claim", "Input", "Absorbed", "RoundState", "Notice" }

return Config

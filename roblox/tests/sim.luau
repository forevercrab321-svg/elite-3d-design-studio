--!nocheck
-- Headless arena round in Lune: 4 AI rivals in a real exported city for 300 s, with the real
-- World (pull-in, collapse), Bot, Movement and the server's gain rules (combo × catch-up / drag,
-- golden crates, landmark lock and bonus, PvP). Prints the growth curve to compare with the web
-- game's balance audit (game/src/config/arena.ts: other cities ~150 / ~1,900 / 2,700–9,400 kg at
-- 30 / 90 / 120 s for the median leader, first car at 104–120 s).
--   lune run roblox/tests/sim.luau [city]
local process = require("@lune/process")
local harness = require("./harness")
local load = harness.load
harness.stubs["server/Models"] = { preload = function() end, clone = function() return nil end, load = function() return nil end }
local WebConfig = load("shared/WebConfig")
local Growth = load("shared/Growth")
local Collision = load("shared/Collision")
local Movement = load("shared/Movement")
local World = load("server/World")
local Bot = load("server/Bot")
local A, G, CC = WebConfig.arena, WebConfig.growth, WebConfig.collection

local cityId = process.args[1] or "shanghai"
local city = World.build(cityId)
local climaxTotal, climaxEaten = 0, 0
for _, o in World.objects do
	if o.def.climax then climaxTotal += 1 end
end

local clock = 0
World.clock = function() return clock end
local actors = {}
for slot = 1, 4 do
	local sp = city.spawns[slot]
	local look = ({ "collector", "dozer", "racer", "magnet" })[slot]
	table.insert(actors, { id = "bot" .. slot, kind = "bot", slot = slot, vehicle = WebConfig.vehicles[look], mass = G.startMass, diameter = G.startDiameter, cls = 0, alive = true, lives = A.lives, body = Movement.new(sp.x, sp.z, sp.heading), bot = Bot.new(slot * 7919), combo = 0, comboAt = -10, invulnerableUntil = 0, shieldUntil = 0, objects = 0, kills = 0, firstCar = nil })
end
local landmarkOpen = false
local function canEat(a, b)
	if a == b or not a.alive or not b.alive or clock < b.invulnerableUntil or clock < a.invulnerableUntil then return false end
	return a.diameter >= b.diameter * A.eatRatio * a.vehicle.eatRatio
end
local function eligible(o, power) return World.eligible(o, power, landmarkOpen) end
local function solidsNear(x, z, r, power, ignore)
	local out = {}
	for _, o in World.near(x, z, r) do
		if o ~= ignore and World.solid(o, power, landmarkOpen) then
			table.insert(out, { x = o.x, z = o.z, radius = o.radius, box = World.box(o) })
		end
	end
	return out
end
local game = { time = 0, matchTime = 0, skill = 1, actors = actors, objects = World.objects, canEat = canEat,
	spares = function() return false end, eligible = eligible, reward = function(o) return o.def.rewardMass end,
	isBlocked = function(x, z, r, power, ignore) return Movement.blocked(x, z, r, World.colliders, city.bounds, solidsNear(x, z, r, power, ignore)) end }
local function catchUp(a)
	local lead = 0
	for _, b in actors do if b.alive and b ~= a then lead = math.max(lead, b.mass) end end
	if lead <= 0 then return 1 end
	if lead > a.mass then return 1 + A.catchUpMax * math.min(1, math.log(lead / a.mass) / math.log(A.catchUpFullRatio)) end
	local ahead = a.mass / (lead * A.leaderDragFrom)
	return if ahead <= 1 then 1 else math.max(A.leaderDragMin, (1 / ahead) ^ A.leaderDragExp)
end
local function setMass(a, m)
	a.mass = math.max(G.startMass, m)
	a.diameter = Growth.diameterForMass(a.mass)
	a.cls = Growth.classForPower(a.diameter)
	if a.cls >= 5 and not a.firstCar then a.firstCar = clock end
end

local dt = 1 / 30
local report = { 30, 60, 90, 120, 180, 240, 300 }
local nextReport = 1
local stuckFrames = 0
local lastPos = {}
while clock < 300 do
	clock += dt
	game.time, game.matchTime = clock, clock
	if not landmarkOpen and clock >= A.landmarkOpenSeconds then landmarkOpen = true end
	World.stepFalling(dt)
	for _, o in World.objects do
		if o.state == "pulled" then
			local a = o.owner
			if World.stepPull(o, dt, a.body.x, a.body.z, World.ground(a.body.x, a.body.z), a.body.heading, a.diameter, a.vehicle.pull) then
				a.combo = if clock - a.comboAt <= A.comboWindow then a.combo + 1 else 1
				a.comboAt = clock
				local mult = math.min(A.comboMax, 1 + A.comboStep * (a.combo - 1))
				local gain = (if o.def.bonus then math.max(o.def.rewardMass, a.mass * A.goldCrateShare) else o.def.rewardMass) * mult * catchUp(a)
				World.remove(o)
				if o.def.climax then
					climaxEaten += 1
					if climaxEaten >= climaxTotal then gain += a.mass * A.landmarkBonus end
				end
				a.objects += 1
				setMass(a, a.mass + gain)
			end
		end
	end
	for _, a in actors do
		if a.alive then
			local dx, dz, dash = a.bot:intents(game, a)
			Movement.step(a.body, dt, clock, dx, dz, dash, false, a.mass, a.diameter, a.vehicle, false, World.colliders, city.bounds, solidsNear(a.body.x, a.body.z, a.diameter + 1, a.diameter, nil))
			local reach = (a.diameter / 2 + a.diameter * CC.reachFactor + CC.reachFlat) * a.vehicle.reach
			for _, o in World.near(a.body.x, a.body.z, reach * CC.vacuumReachMultiplier) do
				if eligible(o, a.diameter) then
					local rr = if o.radius * 2 < a.diameter * CC.vacuumSizeRatio then reach * CC.vacuumReachMultiplier else reach
					if Collision.circleVsObb(a.body.x, a.body.z, rr, World.box(o)) then World.startPull(o, a) end
				end
			end
			local lp = lastPos[a]
			if lp and math.abs(lp[1] - a.body.x) + math.abs(lp[2] - a.body.z) < 1e-4 then stuckFrames += 1 end
			lastPos[a] = { a.body.x, a.body.z }
		end
	end
	for _, a in actors do
		for _, b in actors do
			if canEat(a, b) and math.sqrt((a.body.x - b.body.x) ^ 2 + (a.body.z - b.body.z) ^ 2) <= (a.diameter / 2) * A.eatReach + b.diameter * 0.2 then
				a.kills += 1
				setMass(a, a.mass + b.mass * A.eatGain)
				b.lives -= 1
				local keep = math.max(G.startMass, b.mass * A.respawnMassKeep)
				local sp = city.spawns[b.slot]
				b.body = Movement.new(sp.x, sp.z, sp.heading)
				setMass(b, keep)
				b.invulnerableUntil = clock + A.respawnDelay + A.invulnerableSeconds
				if b.lives <= 0 then b.alive = false end
			end
		end
	end
	refillClock = (refillClock or 0) + dt
	if refillClock >= A.refillCheckSeconds then
		refillClock = 0
		local ms = {}
		for _, a in actors do if a.alive then table.insert(ms, { a.body.x, a.body.z, a.diameter }) end end
		refilled = (refilled or 0) + World.refill(ms)
	end
	if nextReport <= #report and clock >= report[nextReport] then
		local masses = {}
		for _, a in actors do table.insert(masses, a.mass) end
		table.sort(masses)
		local parts = {}
		for _, a in actors do
			local v, u = Growth.massText(a.mass)
			table.insert(parts, string.format("%s %s %s (c%d)", a.id, v, u, a.cls))
		end
		print(string.format("t=%3ds  leader %.0f kg  median %.0f kg  landmark %d/%d  |  %s", report[nextReport], masses[4], (masses[2] + masses[3]) / 2, climaxEaten, climaxTotal, table.concat(parts, "  ")))
		nextReport += 1
	end
end
local firstCar = math.huge
for _, a in actors do if a.firstCar then firstCar = math.min(firstCar, a.firstCar) end end
print("refilled objects:", refilled)
print(string.format("first car (class 5) at %s s; kills %d; idle frames %.1f%%", if firstCar < math.huge then string.format("%.0f", firstCar) else "never", (function() local k = 0 for _, a in actors do k += a.kills end return k end)(), stuckFrames / (300 * 30 * 4) * 100))

--!nocheck
-- Offline checks for the Roblox port, run with Lune (https://lune-org.github.io):
--   lune run roblox/tests/run.luau
-- Loads the real src/ modules with a small shim for game/script/require and checks them against
-- the web game: collision and growth maths against golden values computed by the web code
-- (tools/roblox-golden.mjs), the exported city data, and the server World (pull-in timing,
-- landmark collapse) with models stubbed out.

local fs = require("@lune/fs")
local luau = require("@lune/luau")
local roblox = require("@lune/roblox")
local Instance = roblox.Instance

local harness = require("./harness")
local ROOT = "roblox/src/"
local load = harness.load
local stubs = harness.stubs
local failures, passes = 0, 0
local function check(ok: boolean, msg: string)
	if ok then
		passes += 1
	else
		failures += 1
		print("  FAIL " .. msg)
	end
end
local function near(a: number, b: number, tol: number?): boolean
	return math.abs(a - b) <= (tol or 1e-6) * math.max(1, math.abs(b))
end

-- Golden values from the web code ----------------------------------------------------------------
print("Collision + growth vs the web code")
local golden = luau.load(fs.readFile("roblox/tests/golden.luau"))()
local Collision = load("shared/Collision")
for i, c in golden.collision do
	local nx, nz, depth = Collision.circleVsObb(c[1], c[2], c[3], { c[4], c[5], c[6], c[7], c[8] })
	local hit = if nx then 1 else 0
	check(hit == c[9], "collision case " .. i .. " hit")
	if hit == 1 and c[9] == 1 then
		check(near(nx, c[10]) and near(nz, c[11]) and near(depth, c[12]), "collision case " .. i .. " normal/depth")
	end
end
local Growth = load("shared/Growth")
for _, g in golden.growth do
	local m = g[1]
	local d = Growth.diameterForMass(m)
	local cls = Growth.classForPower(d)
	local nextCls, nextMass, frac = Growth.progress(m)
	check(near(d, g[2]), "diameter for " .. m .. " kg")
	check(cls == g[3], "class for " .. m .. " kg")
	check(Growth.tierForClass(cls) == g[4], "tier for " .. m .. " kg")
	check((nextCls or -1) == g[5] and near(nextMass or -1, g[6], 1e-6) and near(frac, g[7], 1e-6), "progress for " .. m .. " kg")
end

-- City data ---------------------------------------------------------------------------------------
print("Cities")
local Config = load("shared/Config")
local AssetIds = load("shared/AssetIds")
local ModelInfo = load("shared/ModelInfo")
local WebConfig = load("shared/WebConfig")
for _, id in Config.CITIES do
	local city = load("shared/Cities/" .. id)
	check(AssetIds[city.scenery] ~= nil and ModelInfo[city.scenery] ~= nil, id .. ": scenery uploaded")
	local missing = {}
	for i, row in city.objects do
		if not AssetIds[row[1]] or not ModelInfo[row[1]] then
			missing[row[1]] = true
		end
		if row[7] then
			for _, s in row[7] do
				check(city.objects[s] ~= nil and s ~= i, id .. ": support " .. s .. " of object " .. i .. " exists")
			end
		end
		check(WebConfig.objects[row[1]] ~= nil, id .. ": type " .. row[1] .. " in WebConfig")
	end
	check(next(missing) == nil, id .. ": every object type uploaded" .. (if next(missing) then " (missing " .. next(missing) .. ")" else ""))
	local ground = Collision.groundLookup(city.ground)
	for i, sp in city.spawns do
		local x, z = Collision.resolveStatic(sp.x, sp.z, 0.35 * 0.47, city.colliders, city.bounds)
		check(near(x, sp.x) and near(z, sp.z), id .. ": spawn " .. i .. " is free")
		check(ground(sp.x, sp.z) >= 0 and ground(sp.x, sp.z) < 1, id .. ": spawn " .. i .. " ground height")
	end
	local climax = 0
	for _, row in city.objects do
		if WebConfig.objects[row[1]].climax then
			climax += 1
		end
	end
	check(climax > 0, id .. ": has landmark parts (" .. climax .. ")")
end

-- Server World with models stubbed out -------------------------------------------------------------
print("World: pull-in and collapse")
stubs["server/Models"] = { preload = function() end, clone = function()
	return nil
end, load = function()
	return nil
end }
local World = load("server/World")
local city = World.build("shanghai")
check(#World.objects == #city.objects, "every layout object is in the world")
do
	local arena = harness.workspace:FindFirstChild("Arena")
	local fb = arena and arena:FindFirstChild("FallbackScenery")
	local n = if fb then #fb:GetChildren() else 0
	check(n > 50 and n < 3000, "fallback street scenery built without the scenery model (" .. n .. " parts)")
end
-- Pull: a can 1 m from a starting machine reaches the intake within the web's time limit.
local CC = WebConfig.collection
local can
for _, o in World.objects do
	if o.type == "CAN" then
		can = o
		break
	end
end
local d = WebConfig.growth.startDiameter
local ox, oz = can.x + 1, can.z
check(World.eligible(can, d, false), "a can is edible at spawn size")
World.startPull(can, { UserId = 1 })
local t, done = 0, false
while t < 3 and not done do
	t += 1 / 60
	done = World.stepPull(can, 1 / 60, ox, oz, 0, 0, d, 1.1)
end
check(done and t <= CC.maxPullSeconds / 1.1 + 0.02, string.format("can absorbed in %.2f s (limit %.2f)", t, CC.maxPullSeconds / 1.1))
-- Refill: an eaten can comes back home once due and no machine is near; landmark parts never do.
World.remove(can)
check(can.refillAt ~= nil, "eaten can is queued for refill")
can.refillAt = 0
World.refill({ { can.home[1], can.home[3], 0.35 } })
check(can.state == "gone", "no refill while a machine is right there")
World.refill({})
check(can.state == "idle" and can.x == can.home[1] and can.z == can.home[3], "can refilled at home")

-- Collapse: eating the Pearl Tower's three legs drops the lower sphere, which lands on the ground.
local legs, sphere = {}, nil
for _, o in World.objects do
	if o.type == "PEARL_LEG" then
		table.insert(legs, o)
	elseif o.type == "PEARL_SPHERE_LOW" then
		sphere = o
	end
end
check(#legs == 3 and sphere ~= nil and sphere.anchored, "Pearl Tower: 3 legs hold the anchored lower sphere")
check(not World.eligible(sphere, 100, true), "anchored sphere cannot be eaten while held up")
-- Web rule: a "collapse" part falls as soon as any one support goes, and everything above it follows.
World.remove(legs[1])
check(sphere.state == "falling", "sphere falls when one leg is eaten")
check(legs[1].refillAt == nil, "landmark parts are never refilled")
local fallingCount = 0
for _, o in World.objects do
	if o.state == "falling" then
		fallingCount += 1
	end
end
check(fallingCount == 4, "the whole tower above comes down (" .. fallingCount .. " falling: sphere, shaft, upper sphere, top)")
for _ = 1, 600 do
	World.stepFalling(1 / 60)
end
check(sphere.state == "idle" and near(sphere.y, World.ground(sphere.x, sphere.z), 1e-3), "sphere lands on the ground")
local landedFar = 0
for _, o in World.objects do
	if o.type == "PEARL_TOP" then
		landedFar = math.sqrt(o.x * o.x + o.z * o.z)
	end
end
check(landedFar > 3 and landedFar <= 23, string.format("top topples sideways %.1f m (web: up to 22 m)", landedFar))
check(World.eligible(sphere, 12, true) and not World.eligible(sphere, 12, false), "fallen sphere is edible once the landmark opens")

-- Script structure ------------------------------------------------------------------------------
print("Main startup order")
do
	local main = fs.readFile(ROOT .. "server/Main.server.luau")
	local connect = string.find(main, "Players.PlayerAdded:Connect", 1, true)
	local firstBuild = string.find(main, "World.build(", 1, true)
	check(connect ~= nil and firstBuild ~= nil and connect < firstBuild, "PlayerAdded is connected before the first World.build")
	check(string.find(main, "task.spawn(onPlayerAdded, player)", 1, true) ~= nil, "players who joined earlier are handled")
end

-- The server names machine models by actor id; clients must look their own machine up the same way.
do
	for _, f in { "client/Play.client.luau", "client/Hud.client.luau" } do
		local src = fs.readFile(ROOT .. f)
		check(not string.find(src, "FindFirstChild(player.Name)", 1, true), f .. " finds the local machine by ActorId, not player.Name")
	end
	local main = fs.readFile(ROOT .. "server/Main.server.luau")
	check(string.find(main, "m.Name = a.id", 1, true) ~= nil and string.find(main, 'player:SetAttribute("ActorId", a.id)', 1, true) ~= nil, "server names machines by actor id and tells the player")
end

print(string.format("%d checks passed, %d failed", passes, failures))
print(if failures == 0 then "ALL CHECKS PASSED" else "CHECKS FAILED")
if failures > 0 then
	error("tests failed", 0)
end

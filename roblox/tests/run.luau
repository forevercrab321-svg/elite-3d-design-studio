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

local ROOT = "roblox/src/"
local game = Instance.new("DataModel")
local workspace = game:GetService("Workspace")
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

-- Module loader ------------------------------------------------------------------------------
local stubs = {}
local cache = {}
local env
local function node(path: string)
	return setmetatable({ __file = path }, {
		__index = function(self, k)
			if k == "WaitForChild" or k == "FindFirstChild" then
				return function(_, name)
					return node(path .. "/" .. name)
				end
			end
			return nil
		end,
	})
end
local function load(path: string)
	if stubs[path] then
		return stubs[path]
	end
	if cache[path] ~= nil then
		return cache[path]
	end
	local src = fs.readFile(ROOT .. path .. ".luau")
	local dir = string.match(path, "^(.*)/") or ""
	-- Lune replaces the environment's metatable, so every global is copied in flat.
	local e = { script = { Parent = node(dir) }, require = env.require, game = env.game, workspace = workspace, warn = function() end, task = env.task }
	for k, v in roblox do
		e[k] = v
	end
	local fn = luau.load(src, { debugName = path, environment = e, injectGlobals = true })
	cache[path] = fn()
	return cache[path]
end
local replicated = {
	WaitForChild = function(_, name)
		if name == "Shared" then
			return node("shared")
		end
		return Instance.new("Folder")
	end,
}
env = {
	game = { GetService = function(_, n)
		if n == "ReplicatedStorage" then
			return replicated
		end
		if n == "InsertService" then
			return { LoadAsset = function()
				error("no network in tests")
			end }
		end
		return game:GetService(n)
	end },
	require = function(m)
		return load(m.__file)
	end,
	task = { wait = function() end, spawn = function(f, ...)
		f(...)
	end, delay = function() end },
}

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

print(string.format("%d checks passed, %d failed", passes, failures))
print(if failures == 0 then "ALL CHECKS PASSED" else "CHECKS FAILED")
if failures > 0 then
	error("tests failed", 0)
end

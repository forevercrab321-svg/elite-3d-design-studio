--!nocheck
-- Offline checks for the Roblox port, run with Lune (https://lune-org.github.io):
--   lune run roblox/tests/run.luau
-- Loads the real src/ modules with a tiny shim for game/script/require, builds the city with no
-- uploaded assets (the primitive fallback path) and checks the catalogue, layout and balance.

local fs = require("@lune/fs")
local luau = require("@lune/luau")
local roblox = require("@lune/roblox")
local Instance = roblox.Instance
local Vector3 = roblox.Vector3

local ROOT = "roblox/src/"

-- Roblox globals Lune does not have.
local RandomShim = { new = function()
	return {
		NextInteger = function(_, a, b)
			return math.random(a, b)
		end,
		NextNumber = function(_, a, b)
			a = a or 0
			b = b or 1
			return a + math.random() * (b - a)
		end,
	}
end }
local taskShim = { wait = function() end, spawn = function(f, ...)
	f(...)
end, delay = function() end, defer = function() end }
local game = Instance.new("DataModel")
local workspace = game:GetService("Workspace")
local failures = 0
local function check(ok: boolean, msg: string)
	if ok then
		print("  ok   " .. msg)
	else
		failures += 1
		print("  FAIL " .. msg)
	end
end

-- Module loader: each file gets a fake `script` whose Parent resolves siblings by name.
local cache = {}
local env
local function folder(dir: string)
	return setmetatable({ __dir = dir }, {
		__index = function(self, k)
			if k == "WaitForChild" or k == "FindFirstChild" then
				return function(_, name)
					return { __file = dir .. name }
				end
			end
			return nil
		end,
	})
end
local function load(path: string)
	if cache[path] ~= nil then
		return cache[path]
	end
	local src = fs.readFile(ROOT .. path .. ".luau")
	local dir = string.match(path, "^(.*/)") or ""
	-- Lune replaces the environment's metatable, so every global is copied in flat.
	local e = { script = { Parent = folder(dir) }, require = env.require, game = env.game, workspace = workspace, warn = print }
	for k, v in roblox do
		e[k] = v
	end
	e.Random = RandomShim
	e.task = taskShim
	local fn = luau.load(src, { debugName = path, environment = e, injectGlobals = true })
	cache[path] = fn()
	return cache[path]
end
local shared = folder("shared/")
local replicated = {
	WaitForChild = function(_, name)
		if name == "Shared" then
			return shared
		end
		return Instance.new("Folder")
	end,
}
local services = {
	ReplicatedStorage = replicated,
	ServerStorage = game:GetService("ServerStorage"),
	InsertService = { LoadAsset = function()
		error("no network in tests")
	end },
}
env = setmetatable({
	game = { GetService = function(_, n)
		return services[n] or game:GetService(n)
	end },
	workspace = workspace,
	require = function(m)
		return load(m.__file)
	end,
	warn = print,
}, { __index = function(_, k)
	return roblox[k] or _G[k] or getfenv(0)[k]
end })

print("Config / ModelInfo")
local Config = load("shared/Config")
local ModelInfo = load("shared/ModelInfo")
local needed = fs.readFile("roblox/assets/needed.txt")
for name in string.gmatch(needed, "[^\n]+") do
	check(ModelInfo[name] ~= nil and fs.isFile("roblox/assets/glb/" .. name .. ".glb"), "model exported: " .. name)
end
for _, k in Config.PROPS do
	local biggest = math.max(k.dims.X, k.dims.Y, k.dims.Z)
	check(math.abs(biggest - k.size) < 0.01, string.format("%s dims %.1f×%.1f×%.1f match size %g", k.name, k.dims.X, k.dims.Y, k.dims.Z, k.size))
	if k.where == "block" then
		-- A building sits in a quadrant slot BLOCK/2 wide; leave a 4-stud gap to its neighbour.
		local foot = math.max(k.dims.X, k.dims.Z)
		check(foot <= Config.BLOCK / 2 - 4, string.format("%s footprint %.1f fits a %g-stud quadrant", k.name, foot, Config.BLOCK / 2))
	end
	if k.where == "road" then
		check(math.min(k.dims.X, k.dims.Z) <= Config.ROAD / 2 - 1, string.format("%s width %.1f fits a lane", k.name, math.min(k.dims.X, k.dims.Z)))
	end
end

print("City.build (no assets → primitives)")
local City = load("server/City")
local edibles = City.build()
local counts, total = {}, 0
for _, m in edibles:GetChildren() do
	local kind = m:GetAttribute("Kind")
	counts[kind] = (counts[kind] or 0) + 1
	total += 1
end
for _, k in Config.PROPS do
	local want = if k.where == "block" then nil else k.count
	if want then
		check(counts[k.name] == want, string.format("%s spawned %d/%d", k.name, counts[k.name] or 0, want))
	end
end
local blocks, slots = 0, (Config.GRID * Config.GRID - #Config.LANDMARKS) * 4
for _, k in Config.PROPS do
	if k.where == "block" then
		blocks += k.count
		check((counts[k.name] or 0) == k.count, string.format("%s placed %d/%d", k.name, counts[k.name] or 0, k.count))
	end
end
check(blocks <= slots, string.format("buildings %d ≤ slots %d", blocks, slots))
for _, l in Config.LANDMARKS do
	check(counts[l.name] == 1, "landmark present: " .. l.name)
end
print(string.format("  %d edibles in total", total))

-- `lune run roblox/tests/run.luau <out.json>` also writes the layout for tools/preview-city.mjs.
local outPath = require("@lune/process").args[1]
if outPath then
	local items = {}
	for _, m in edibles:GetChildren() do
		local kind = m:GetAttribute("Kind")
		local k = City.kind(kind)
		local cf = m.PrimaryPart.CFrame
		local _, yaw = cf:ToEulerAnglesYXZ()
		local landmark = m:GetAttribute("Landmark") == true
		local model, bottom = nil, cf.Position
		if k then
			model = k.model
			bottom -= Vector3.new(0, k.dims.Y / 2, 0)
		else
			for _, l in Config.LANDMARKS do
				if l.name == kind then
					model = l.model
				end
			end
		end
		table.insert(items, { kind = kind, model = model, size = m:GetAttribute("Size"), x = bottom.X, y = if landmark then 0.4 else bottom.Y, z = bottom.Z, yaw = if landmark then 0 else yaw })
	end
	fs.writeFile(outPath, require("@lune/serde").encode("json", { grid = Config.GRID, block = Config.BLOCK, road = Config.ROAD, items = items }))
	print("  layout written to " .. outPath)
end

print("Balance (who can eat what)")
local function scaleFor(m)
	return math.clamp((m / Config.START_MASS) ^ (1 / 3), 1, Config.MAX_SCALE)
end
local reach = function(s)
	return Config.EAT_REACH * Config.CHARACTER_HEIGHT * s
end
check(reach(1) >= Config.PROPS[1].size, "the smallest prop is edible at spawn")
check(reach(Config.MAX_SCALE) >= 150, "the biggest landmark is edible at max scale")
-- A player who always eats the biggest thing in reach (landmarks included). Pacing targets:
-- car size within 10 bites; every landmark reachable after eating at most 40% of the city's mass
-- (rounds are shared and five minutes long).
local pool, total = {}, 0
for _, k in Config.PROPS do
	for _ = 1, k.count do
		table.insert(pool, k.size)
		total += City.reward(k.size)
	end
end
for _, l in Config.LANDMARKS do
	table.insert(pool, l.size)
	total += City.reward(l.size)
end
table.sort(pool)
local mass, bites, eaten = Config.START_MASS, 0, 0
local milestones = { { 11, "Car" }, { 26, "Bus" }, { 100, "Times Square Tower" } }
for _, l in Config.LANDMARKS do
	table.insert(milestones, { l.size, l.name })
end
table.sort(milestones, function(x, y)
	return x[1] < y[1]
end)
local reached = {}
while #pool > 0 do
	local r = reach(scaleFor(mass))
	local pickIndex = nil
	for idx = #pool, 1, -1 do
		if pool[idx] <= r then
			pickIndex = idx
			break
		end
	end
	if not pickIndex then
		break
	end
	local size = table.remove(pool, pickIndex)
	mass += City.reward(size)
	eaten += City.reward(size)
	bites += 1
	for _, ms in milestones do
		if not reached[ms[2]] and reach(scaleFor(mass)) >= ms[1] then
			reached[ms[2]] = { bites = bites, share = eaten / total }
			print(string.format("  can eat %s after %d bites, %.0f%% of the city's mass", ms[2], bites, eaten / total * 100))
		end
	end
end
check(reached.Car ~= nil and reached.Car.bites <= 10, "car size within 10 bites")
for _, l in Config.LANDMARKS do
	local r = reached[l.name]
	check(r ~= nil and r.share <= 0.4, string.format("%s reachable with ≤40%% of the city", l.name))
end

print(if failures == 0 then "ALL CHECKS PASSED" else string.format("%d CHECK(S) FAILED", failures))
if failures > 0 then
	error("tests failed", 0)
end

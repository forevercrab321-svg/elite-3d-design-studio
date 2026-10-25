--!nocheck
-- Lune harness: loads roblox/src modules with a small shim for game / script / require / task.
local fs = require("@lune/fs")
local luau = require("@lune/luau")
local roblox = require("@lune/roblox")
local Instance = roblox.Instance

local ROOT = "roblox/src/"


local game = Instance.new("DataModel")
local workspace = game:GetService("Workspace")

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
-- Roblox's Random (seeded LCG, enough for tests).
local RandomShim = { new = function(seed: number?)
	local state = math.floor((seed or 1) * 9301 + 49297) % 233280
	local function nxt(): number
		state = (state * 9301 + 49297) % 233280
		return state / 233280
	end
	return {
		NextNumber = function(_, a: number?, b: number?)
			a = a or 0
			b = b or 1
			return a + nxt() * (b - a)
		end,
		NextInteger = function(_, a: number, b: number)
			return a + math.floor(nxt() * (b - a + 1))
		end,
	}
end }

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
	e.Random = RandomShim
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
local market = nil
env = {
	game = { BindToClose = function() end, GetService = function(_, n)
		if n == "ReplicatedStorage" then
			return replicated
		end
		if n == "DataStoreService" then
			return { GetDataStore = function()
				error("no DataStore in tests")
			end }
		end
		if n == "MarketplaceService" then
			market = market or {}
			return market
		end
		if n == "HttpService" then
			return { JSONEncode = function(_, v)
				return require("@lune/serde").encode("json", v)
			end }
		end
		if n == "Players" then
			return { GetPlayerByUserId = function() return nil end }
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


return { load = load, stubs = stubs, workspace = workspace, market = function()
	return market
end }

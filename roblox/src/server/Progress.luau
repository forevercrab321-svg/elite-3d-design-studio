--!strict
-- Player progress and the cosmetics shop, after the web game (arena/progress.ts, config/cosmetics.ts):
-- coins earned per round (rank + kills), owned and equipped skins / hats / horns, friend gifts.
-- Saved in a DataStore per user; without DataStore access (Studio with API services off) it
-- keeps working in memory. Coin packs for Robux are developer products (Config.COIN_PACKS).
-- Cosmetics change looks and sounds only, never stats.

local DataStoreService = game:GetService("DataStoreService")
local MarketplaceService = game:GetService("MarketplaceService")
local HttpService = game:GetService("HttpService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local WebConfig = require(Shared:WaitForChild("WebConfig"))

local Progress = {}

export type Data = {
	receipts: { string }?,
	coins: number,
	rounds: number,
	wins: number,
	owned: { [string]: { [string]: boolean } },
	equip: { [string]: string },
}

local CATALOG: { [string]: { any } } = { skin = WebConfig.skins, hat = WebConfig.hats, horn = WebConfig.horns }

local store: DataStore? = nil
pcall(function()
	store = DataStoreService:GetDataStore("GrowProgress_v1")
end)
local data: { [Player]: Data } = {}

local function fresh(): Data
	return {
		coins = 0,
		rounds = 0,
		wins = 0,
		owned = { skin = { stock = true }, hat = { none = true }, horn = { clown = true } },
		equip = { skin = "stock", hat = "none", horn = "clown" },
	}
end

local function item(kind: string, id: string): any
	local list: { any } = CATALOG[kind] or {}
	for _, it in list do
		if it.id == id then
			return it
		end
	end
	return nil
end

-- Mirror to attributes the client reads: Coins, Owned (JSON), Skin / Hat / Horn.
local function publish(player: Player)
	local d = data[player]
	if not d then
		return
	end
	player:SetAttribute("Coins", d.coins)
	player:SetAttribute("Owned", HttpService:JSONEncode(d.owned))
	player:SetAttribute("Skin", d.equip.skin)
	player:SetAttribute("Hat", d.equip.hat)
	player:SetAttribute("Horn", d.equip.horn)
end

function Progress.load(player: Player)
	local d = fresh()
	if store then
		local ok, saved = pcall(function()
			return (store :: DataStore):GetAsync("u" .. player.UserId)
		end)
		if ok and typeof(saved) == "table" then
			d.coins = tonumber(saved.coins) or 0
			d.receipts = typeof(saved.receipts) == "table" and saved.receipts or {}
			d.rounds = tonumber(saved.rounds) or 0
			d.wins = tonumber(saved.wins) or 0
			for kind, set in (saved.owned or {}) :: any do
				if d.owned[kind] then
					for id, v in set do
						if v and item(kind, id) then
							d.owned[kind][id] = true
						end
					end
				end
			end
			for kind, id in (saved.equip or {}) :: any do
				if d.owned[kind] and d.owned[kind][id] then
					d.equip[kind] = id
				end
			end
		end
	end
	data[player] = d
	publish(player)
end

-- Save now (returns success). Writes go through UpdateAsync so concurrent servers do not
-- clobber receipts; callers that only changed cosmetics use Progress.saveSoon instead.
function Progress.save(player: Player): boolean
	local d = data[player]
	if not d or not store then
		return d ~= nil
	end
	local ok = pcall(function()
		(store :: DataStore):UpdateAsync("u" .. player.UserId, function(old: any)
			local merged = table.clone(d) :: any
			-- Keep every processed purchase id, from this server and any earlier one.
			local seen: { [string]: boolean } = {}
			local list: { string } = {}
			for _, src in { (old and old.receipts) or {}, d.receipts or {} } do
				for _, id in src do
					if not seen[id] then
						seen[id] = true
						table.insert(list, id)
					end
				end
			end
			while #list > 200 do
				table.remove(list, 1)
			end
			merged.receipts = list
			return merged
		end)
	end)
	return ok
end

-- Debounced save (the DataStore allows one write per key every 6 s).
local saveAt: { [Player]: number } = {}
function Progress.saveSoon(player: Player)
	if saveAt[player] then
		return
	end
	saveAt[player] = os.clock() + 7
	task.delay(7, function()
		saveAt[player] = nil
		if data[player] then
			Progress.save(player)
		end
	end)
end

function Progress.unload(player: Player)
	Progress.save(player)
	data[player] = nil
end

function Progress.get(player: Player): Data?
	return data[player]
end

function Progress.addCoins(player: Player, n: number)
	local d = data[player]
	if d then
		d.coins += math.floor(n)
		publish(player)
	end
end

-- Round reward (web progress.ts): coins by rank + per kill; rounds counted (AI skill ramp).
function Progress.roundEnd(player: Player, rank: number, kills: number, won: boolean): number
	local d = data[player]
	if not d then
		return 0
	end
	local coins = (WebConfig.arena.coinsByRank[rank] or 0) + WebConfig.arena.coinsPerKill * kills
	d.coins += coins
	d.rounds += 1
	if won then
		d.wins += 1
	end
	publish(player)
	Progress.saveSoon(player)
	return coins
end

-- Friend gifts (web GIFT rules): a friend in the match → Best Buddies skin; three → Squad Crown;
-- an invite sent → Party Hat. Returns the item ids newly granted.
function Progress.gift(player: Player, rule: string): { string }
	local d = data[player]
	local granted = {}
	if not d then
		return granted
	end
	for kind, list in CATALOG do
		for _, it in list do
			if it.gift == rule and not d.owned[kind][it.id] then
				d.owned[kind][it.id] = true
				table.insert(granted, it.name)
			end
		end
	end
	if #granted > 0 then
		publish(player)
		Progress.saveSoon(player)
	end
	return granted
end

-- Buy with coins, or equip something owned. Returns ok and a message.
function Progress.shop(player: Player, action: string, kind: string, id: string): (boolean, string)
	local d = data[player]
	local it = item(kind, id)
	if not d or not it then
		return false, "Unknown item"
	end
	if action == "buy" then
		if d.owned[kind][id] then
			return false, "Already owned"
		end
		if it.gift then
			return false, "Gift item — unlocked by playing with friends"
		end
		if d.coins < it.price then
			return false, "Not enough coins"
		end
		d.coins -= it.price
		d.owned[kind][id] = true
		d.equip[kind] = id
	elseif action == "equip" then
		if not d.owned[kind][id] then
			return false, "Not owned"
		end
		d.equip[kind] = id
	else
		return false, "Unknown action"
	end
	publish(player)
	Progress.saveSoon(player)
	return true, "OK"
end

-- Robux coin packs (developer products).
MarketplaceService.ProcessReceipt = function(receipt)
	local player = game:GetService("Players"):GetPlayerByUserId(receipt.PlayerId)
	for _, pack in Config.COIN_PACKS do
		if pack.id ~= 0 and pack.id == receipt.ProductId then
			local d = player and data[player]
			if not player or not d then
				return Enum.ProductPurchaseDecision.NotProcessedYet
			end
			d.receipts = d.receipts or {}
			local receipts = d.receipts :: { string }
			if table.find(receipts, receipt.PurchaseId) then
				return Enum.ProductPurchaseDecision.PurchaseGranted -- already granted earlier
			end
			Progress.addCoins(player, pack.coins)
			table.insert(receipts, receipt.PurchaseId)
			-- Only report success once it is saved; otherwise Roblox retries later.
			if Progress.save(player) then
				return Enum.ProductPurchaseDecision.PurchaseGranted
			end
			table.remove(receipts, table.find(receipts, receipt.PurchaseId) :: number)
			Progress.addCoins(player, -pack.coins)
			return Enum.ProductPurchaseDecision.NotProcessedYet
		end
	end
	return Enum.ProductPurchaseDecision.NotProcessedYet
end

-- Server shutting down: save everyone before it goes.
game:BindToClose(function()
	for player in data do
		task.spawn(Progress.save, player)
	end
	task.wait(3)
end)

return Progress

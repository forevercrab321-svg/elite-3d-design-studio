--!strict
-- The web game's own models in Roblox. Each one was exported to GLB (tools/model-export), uploaded
-- as an asset (roblox/upload-assets.sh) and listed in Shared.AssetIds. Loading flattens the asset
-- into one Model, repaints every MeshPart from Shared.ModelInfo (the importer's colours are not
-- trusted), scales it to real size (metres × STUDS_PER_METER, whatever unit the importer used)
-- and puts the pivot on the web model's own origin, so a web position/yaw places it exactly.

local InsertService = game:GetService("InsertService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local AssetIds = require(Shared:WaitForChild("AssetIds"))
local ModelInfo = require(Shared:WaitForChild("ModelInfo"))
local Config = require(Shared:WaitForChild("Config"))

local K = Config.STUDS_PER_METER

local Models = {}

-- Material names used by Shared.ModelInfo (see tools/roblox-modelinfo.mjs).
local MATERIALS: { [string]: Enum.Material } = {}
for _, name in { "Neon", "Glass", "Metal", "CorrodedMetal", "Plastic", "SmoothPlastic", "Brick", "Concrete", "Limestone", "Pavement", "Asphalt", "Pebble", "Rubber", "WoodPlanks", "Wood", "Fabric", "Cardboard" } do
	MATERIALS[name] = (Enum.Material :: any)[name]
end

-- Machine and hat templates live in ReplicatedStorage (clients draw machines locally, Play.client);
-- everything else stays on the server (the city scenery alone is hundreds of meshes).
local store = Instance.new("Folder")
store.Name = "ModelTemplates"
store.Parent = ReplicatedStorage
local serverStore = Instance.new("Folder")
serverStore.Name = "ModelTemplates"
serverStore.Parent = game:GetService("ServerStorage")

local templates: { [string]: Model } = {}
local loading: { [string]: boolean } = {}
local failed: { [string]: boolean } = {}

local function prepare(name: string, asset: Instance): Model?
	local info = ModelInfo[name]
	local model = Instance.new("Model")
	model.Name = name
	model.WorldPivot = CFrame.new()
	local count = 0
	for _, d in asset:GetDescendants() do
		if d:IsA("BasePart") then
			local mesh = info and info.meshes[d.Name]
			if mesh then
				d.Color = Color3.fromHex(mesh.c)
				d.Material = MATERIALS[mesh.m] or Enum.Material.SmoothPlastic
				d.Transparency = mesh.t
				if mesh.tint then
					d:SetAttribute("Tint", true)
				end
			end
			d.Anchored = true
			d.CanCollide = false
			d.CanTouch = false
			d.CanQuery = false
			d.Parent = model
			count += 1
		end
	end
	asset:Destroy()
	if count == 0 or not info then
		model:Destroy()
		return nil
	end
	-- Scale to real size, then put the pivot where the web model's origin is: the box's low
	-- corner sits at info.min (metres) from the origin.
	local _, size = model:GetBoundingBox()
	local metres = info.size
	local biggest = math.max(metres.X, metres.Y, metres.Z)
	local actual = if biggest == metres.X then size.X elseif biggest == metres.Y then size.Y else size.Z
	model:ScaleTo(biggest * K / actual)
	local box, scaled = model:GetBoundingBox()
	local low = box.Position - scaled / 2
	model.WorldPivot = CFrame.new(low - info.min * K)
	model.Parent = if string.sub(name, 1, 8) == "Machine_" or string.sub(name, 1, 4) == "Hat_" then store else serverStore
	return model
end

-- Load (once) and return the template, or nil when the model has no asset id or failed to load.
-- Yields while LoadAsset runs; concurrent callers for the same name wait for the first one.
function Models.load(name: string): Model?
	while loading[name] do
		task.wait()
	end
	if templates[name] then
		return templates[name]
	end
	local id = AssetIds[name]
	if not id or failed[name] then
		return nil
	end
	loading[name] = true
	local ok, result = pcall(InsertService.LoadAsset, InsertService, id)
	-- Preparing can fail on an asset the importer shaped unexpectedly: never take the round down.
	local model: Model? = nil
	local reason = tostring(result)
	if ok then
		local prepared, out = pcall(prepare, name, result :: Instance)
		if prepared then
			model = out
			reason = "no parts"
		else
			reason = "prepare failed: " .. tostring(out)
		end
	end
	if model then
		templates[name] = model
	else
		failed[name] = true
		warn(string.format("Models: %s (%d) did not load: %s", name, id, reason))
	end
	loading[name] = nil
	return model
end

-- Real size in studs a model should have (for the self-check).
function Models.expectedSize(name: string): Vector3?
	local info = ModelInfo[name]
	return if info then info.size * K else nil
end

-- Load many models in parallel and wait for all of them.
function Models.preload(names: { string })
	local pending = 0
	for _, name in names do
		if AssetIds[name] and not templates[name] and not failed[name] then
			pending += 1
			task.spawn(function()
				Models.load(name)
				pending -= 1
			end)
		end
	end
	while pending > 0 do
		task.wait()
	end
end

-- A fresh copy at real size (× extra scale), pivot on the web origin (not parented).
-- tint recolours the meshes the web game paints per instance (TINTED roles): the exported
-- colour is the type's first colour × its texture tone, so the instance colour keeps that tone.
function Models.clone(name: string, scale: number?, tint: Color3?, baseTint: Color3?): Model?
	local template = Models.load(name)
	if not template then
		return nil
	end
	local m = template:Clone()
	if scale and scale ~= 1 then
		-- ScaleTo is absolute (relative to the original import), and the template is already scaled.
		m:ScaleTo(m:GetScale() * scale)
	end
	if tint and baseTint then
		for _, p in m:GetDescendants() do
			if p:IsA("BasePart") and p:GetAttribute("Tint") then
				local c = p.Color
				local function ch(v: number, from: number, to: number): number
					return if from > 0.001 then math.clamp(v * to / from, 0, 1) else to
				end
				p.Color = Color3.new(ch(c.R, baseTint.R, tint.R), ch(c.G, baseTint.G, tint.G), ch(c.B, baseTint.B, tint.B))
			end
		end
	end
	return m
end

return Models

--!strict
-- The web game's own models in Roblox. Each one was exported to GLB (tools/model-export), uploaded
-- as an asset (roblox/upload-assets.sh) and listed in Shared.AssetIds. Loading flattens the asset
-- into one Model, repaints every MeshPart from Shared.ModelInfo (the importer's colours are not
-- trusted) and puts the pivot at the bottom centre. Clones come out scaled so their largest
-- dimension is the requested size in studs. Callers fall back to primitives when this returns nil.

local InsertService = game:GetService("InsertService")
local ServerStorage = game:GetService("ServerStorage")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local AssetIds = require(Shared:WaitForChild("AssetIds"))
local ModelInfo = require(Shared:WaitForChild("ModelInfo"))

local Models = {}

local MATERIALS: { [string]: Enum.Material } = {
	Neon = Enum.Material.Neon,
	Glass = Enum.Material.Glass,
	Metal = Enum.Material.Metal,
	Plastic = Enum.Material.Plastic,
	SmoothPlastic = Enum.Material.SmoothPlastic,
}

local store = Instance.new("Folder")
store.Name = "ModelTemplates"
store.Parent = ServerStorage

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
			end
			d.Anchored = true
			d.CanTouch = false
			d.Parent = model
			count += 1
		end
	end
	asset:Destroy()
	if count == 0 then
		model:Destroy()
		return nil
	end
	local box, size = model:GetBoundingBox()
	model.WorldPivot = CFrame.new(box.X, box.Y - size.Y / 2, box.Z)
	model:SetAttribute("Box", size)
	model.Parent = store
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
	local model = if ok then prepare(name, result :: Instance) else nil
	if model then
		templates[name] = model
	else
		failed[name] = true
		warn(string.format("Models: %s (%d) did not load: %s", name, id, if ok then "no parts" else tostring(result)))
	end
	loading[name] = nil
	return model
end

-- Load many models in parallel and wait for all of them.
function Models.preload(names: { string })
	local pending = 0
	for _, name in names do
		if AssetIds[name] and not templates[name] then
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

-- A fresh copy whose largest dimension is `size` studs, pivot at its bottom centre (not parented).
function Models.clone(name: string, size: number): Model?
	local template = Models.load(name)
	if not template then
		return nil
	end
	local box = template:GetAttribute("Box") :: Vector3
	local m = template:Clone()
	m:ScaleTo(size / math.max(box.X, box.Y, box.Z))
	return m
end

return Models

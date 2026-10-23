--!strict
-- Procedural city: a GRID × GRID block layout with roads, sidewalk props, traffic, buildings in
-- the block quadrants and the landmark in the central block. Every edible is a Model in the
-- Edibles folder carrying Size (largest dimension, studs), Mass (reward) and Kind attributes.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))

local City = {}

local GRID = Config.GRID
local BLOCK = Config.BLOCK
local ROAD = Config.ROAD
local TOTAL = GRID * BLOCK + (GRID + 1) * ROAD
local HALF = TOTAL / 2
local CENTER = math.floor(GRID / 2)
local SIDEWALK_TOP = 0.4

local rng = Random.new()
local freeSlots: { Vector3 } = {}

local function blockCenter(i: number, j: number): Vector3
	local x = -HALF + ROAD + i * (BLOCK + ROAD) + BLOCK / 2
	local z = -HALF + ROAD + j * (BLOCK + ROAD) + BLOCK / 2
	return Vector3.new(x, 0, z)
end

local function part(parent: Instance, name: string, size: Vector3, cf: CFrame, color: Color3, material: Enum.Material): Part
	local p = Instance.new("Part")
	p.Name = name
	p.Size = size
	p.CFrame = cf
	p.Color = color
	p.Material = material
	p.Anchored = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Parent = parent
	return p
end

function City.reward(size: number): number
	return Config.REWARD_FACTOR * size ^ Config.REWARD_EXP
end

-- Static ground: asphalt everywhere, raised concrete sidewalks on the blocks.
local function buildGround(folder: Folder)
	part(folder, "Asphalt", Vector3.new(TOTAL, 2, TOTAL), CFrame.new(0, -1, 0), Color3.fromRGB(55, 58, 64), Enum.Material.Asphalt)
	for i = 0, GRID - 1 do
		for j = 0, GRID - 1 do
			local c = blockCenter(i, j)
			part(folder, "Block", Vector3.new(BLOCK, SIDEWALK_TOP, BLOCK), CFrame.new(c.X, SIDEWALK_TOP / 2, c.Z), Color3.fromRGB(175, 175, 168), Enum.Material.Concrete)
		end
	end
	-- Edge walls keep players inside the city.
	local wallH = 400
	for _, d in { Vector3.new(1, 0, 0), Vector3.new(-1, 0, 0), Vector3.new(0, 0, 1), Vector3.new(0, 0, -1) } do
		local size = if d.X ~= 0 then Vector3.new(4, wallH, TOTAL) else Vector3.new(TOTAL, wallH, 4)
		local w = part(folder, "Wall", size, CFrame.new(d * (HALF + 2) + Vector3.new(0, wallH / 2, 0)), Color3.new(1, 1, 1), Enum.Material.ForceField)
		w.Transparency = 1
	end
end

-- Positions where a prop of this kind may stand (y is the surface height).
local function sidewalkSpot(): (Vector3, number)
	local c = blockCenter(rng:NextInteger(0, GRID - 1), rng:NextInteger(0, GRID - 1))
	local edge = BLOCK / 2 - 2.5
	local along = rng:NextNumber(-edge, edge)
	local side = rng:NextInteger(1, 4)
	local off = if side == 1 then Vector3.new(edge, 0, along) elseif side == 2 then Vector3.new(-edge, 0, along) elseif side == 3 then Vector3.new(along, 0, edge) else Vector3.new(along, 0, -edge)
	return c + off, SIDEWALK_TOP
end

local function roadSpot(): (Vector3, number, number)
	local k = rng:NextInteger(0, GRID)
	local line = -HALF + ROAD / 2 + k * (BLOCK + ROAD)
	local along = rng:NextNumber(-HALF + ROAD, HALF - ROAD)
	local lane = (if rng:NextNumber() < 0.5 then -1 else 1) * ROAD / 4
	if rng:NextNumber() < 0.5 then
		return Vector3.new(line + lane, 0, along), 0, 0 -- driving along Z
	end
	return Vector3.new(along, 0, line + lane), 0, math.pi / 2 -- driving along X
end

local function makeProp(kind: Config.PropKind, edibles: Folder, position: Vector3, yaw: number): Model
	local m = Instance.new("Model")
	m.Name = kind.name
	local dims = kind.dims
	local base = CFrame.new(position + Vector3.new(0, dims.Y / 2, 0)) * CFrame.Angles(0, yaw, 0)
	local body = part(m, "Body", dims, base, kind.color, kind.material)
	-- A little shape language so things read at a glance (roofs on buildings, cabins on vehicles).
	if kind.where == "block" then
		part(m, "Roof", Vector3.new(dims.X + 1, 1.2, dims.Z + 1), base * CFrame.new(0, dims.Y / 2 + 0.6, 0), kind.color:Lerp(Color3.new(0, 0, 0), 0.35), Enum.Material.Slate)
	elseif kind.where == "road" and dims.Z > dims.X * 1.5 then
		part(m, "Cabin", Vector3.new(dims.X * 0.9, dims.Y * 0.45, dims.Z * 0.45), base * CFrame.new(0, dims.Y * 0.5, -dims.Z * 0.1), Color3.fromRGB(160, 200, 230), Enum.Material.Glass)
	end
	local size = math.max(dims.X, dims.Y, dims.Z)
	for _, p in m:GetChildren() do
		local bp = p :: BasePart
		-- Small things never block anyone (they get eaten on contact); buildings and vehicles do.
		bp.CanCollide = size >= 4
	end
	m.PrimaryPart = body
	m:SetAttribute("Size", size)
	m:SetAttribute("Mass", City.reward(size))
	m:SetAttribute("Kind", kind.name)
	m:SetAttribute("Respawn", kind.respawn)
	m.Parent = edibles
	return m
end

function City.spawn(kind: Config.PropKind, edibles: Folder): Model?
	if kind.where == "sidewalk" then
		local pos, top = sidewalkSpot()
		return makeProp(kind, edibles, Vector3.new(pos.X, top, pos.Z), rng:NextNumber(0, math.pi * 2))
	elseif kind.where == "road" then
		local pos, top, yaw = roadSpot()
		return makeProp(kind, edibles, Vector3.new(pos.X, top, pos.Z), yaw)
	end
	if #freeSlots == 0 then
		return nil
	end
	local slot = table.remove(freeSlots, rng:NextInteger(1, #freeSlots)) :: Vector3
	return makeProp(kind, edibles, slot, 0)
end

local function buildLandmark(edibles: Folder)
	local m = Instance.new("Model")
	m.Name = "Landmark"
	local c = blockCenter(CENTER, CENTER)
	local h = Config.LANDMARK_SIZE
	local gold = Color3.fromRGB(230, 180, 60)
	local base = part(m, "Base", Vector3.new(40, 10, 40), CFrame.new(c.X, SIDEWALK_TOP + 5, c.Z), Color3.fromRGB(140, 140, 150), Enum.Material.Concrete)
	part(m, "Shaft", Vector3.new(14, h * 0.7, 14), CFrame.new(c.X, SIDEWALK_TOP + 10 + h * 0.35, c.Z), Color3.fromRGB(200, 70, 90), Enum.Material.SmoothPlastic)
	local ball = part(m, "Ball", Vector3.new(30, 30, 30), CFrame.new(c.X, SIDEWALK_TOP + 10 + h * 0.62, c.Z), gold, Enum.Material.Neon)
	ball.Shape = Enum.PartType.Ball
	part(m, "Spire", Vector3.new(3, h * 0.25, 3), CFrame.new(c.X, SIDEWALK_TOP + 10 + h * 0.82, c.Z), gold, Enum.Material.Metal)
	m.PrimaryPart = base
	m:SetAttribute("Size", h)
	m:SetAttribute("Mass", City.reward(h))
	m:SetAttribute("Kind", "Landmark")
	m:SetAttribute("Respawn", false)
	m.Parent = edibles
end

-- (Re)build the whole city; returns the Edibles folder.
function City.build(): Folder
	local old = workspace:FindFirstChild("City")
	if old then
		old:Destroy()
	end
	local city = Instance.new("Folder")
	city.Name = "City"
	local ground = Instance.new("Folder")
	ground.Name = "Ground"
	ground.Parent = city
	local edibles = Instance.new("Folder")
	edibles.Name = "Edibles"
	edibles.Parent = city
	buildGround(ground)

	freeSlots = {}
	local q = BLOCK / 4
	for i = 0, GRID - 1 do
		for j = 0, GRID - 1 do
			if not (i == CENTER and j == CENTER) then
				local c = blockCenter(i, j)
				for _, o in { Vector3.new(q, 0, q), Vector3.new(-q, 0, q), Vector3.new(q, 0, -q), Vector3.new(-q, 0, -q) } do
					table.insert(freeSlots, Vector3.new(c.X + o.X, SIDEWALK_TOP, c.Z + o.Z))
				end
			end
		end
	end

	for _, kind in Config.PROPS do
		for _ = 1, kind.count do
			City.spawn(kind, edibles)
		end
	end
	buildLandmark(edibles)
	city.Parent = workspace
	return edibles
end

-- A random spot on a road, high enough to drop in safely.
function City.spawnPoint(): Vector3
	local pos = roadSpot()
	return pos + Vector3.new(0, 6, 0)
end

function City.kind(name: string): Config.PropKind?
	for _, k in Config.PROPS do
		if k.name == name then
			return k
		end
	end
	return nil
end

return City

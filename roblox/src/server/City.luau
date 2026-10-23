--!strict
-- Procedural city: a GRID × GRID block layout with roads and lane markings, lawns and sidewalks,
-- street props, traffic, colourful buildings with window bands in the block quadrants, and three
-- landmarks (Oriental Pearl Tower, Empire State Building, Eiffel Tower) on their own blocks.
-- Every edible is a Model in the Edibles folder carrying Size (largest dimension, studs), Mass
-- (reward), Kind and Respawn attributes.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))

local City = {}

local GRID = Config.GRID
local BLOCK = Config.BLOCK
local ROAD = Config.ROAD
local TOTAL = GRID * BLOCK + (GRID + 1) * ROAD
local HALF = TOTAL / 2
local SIDEWALK_TOP = 0.4

local rng = Random.new()
local freeSlots: { Vector3 } = {}

local function blockCenter(i: number, j: number): Vector3
	local x = -HALF + ROAD + i * (BLOCK + ROAD) + BLOCK / 2
	local z = -HALF + ROAD + j * (BLOCK + ROAD) + BLOCK / 2
	return Vector3.new(x, 0, z)
end

local function isLandmarkBlock(i: number, j: number): boolean
	for _, l in Config.LANDMARKS do
		if l.block[1] == i and l.block[2] == j then
			return true
		end
	end
	return false
end

local function pick<T>(list: { T }): T
	return list[rng:NextInteger(1, #list)]
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

local function ball(parent: Instance, name: string, d: number, cf: CFrame, color: Color3, material: Enum.Material): Part
	local p = part(parent, name, Vector3.new(d, d, d), cf, color, material)
	p.Shape = Enum.PartType.Ball
	return p
end

function City.reward(size: number): number
	return Config.REWARD_FACTOR * size ^ Config.REWARD_EXP
end

-- Static ground: asphalt with lane markings, sidewalks with lawns on the blocks, edge walls.
local function buildGround(folder: Folder)
	part(folder, "Asphalt", Vector3.new(TOTAL, 2, TOTAL), CFrame.new(0, -1, 0), Color3.fromRGB(52, 55, 62), Enum.Material.Asphalt)
	-- Dashed centre lines on every road.
	local white = Color3.fromRGB(235, 235, 220)
	for k = 0, GRID do
		local line = -HALF + ROAD / 2 + k * (BLOCK + ROAD)
		for d = -HALF + 10, HALF - 10, 16 do
			part(folder, "Lane", Vector3.new(0.6, 0.05, 7), CFrame.new(line, 0.03, d), white, Enum.Material.SmoothPlastic)
			part(folder, "Lane", Vector3.new(7, 0.05, 0.6), CFrame.new(d, 0.03, line), white, Enum.Material.SmoothPlastic)
		end
	end
	for i = 0, GRID - 1 do
		for j = 0, GRID - 1 do
			local c = blockCenter(i, j)
			part(folder, "Sidewalk", Vector3.new(BLOCK, SIDEWALK_TOP, BLOCK), CFrame.new(c.X, SIDEWALK_TOP / 2, c.Z), Color3.fromRGB(190, 188, 180), Enum.Material.Concrete)
			local lawnColor = if isLandmarkBlock(i, j) then Color3.fromRGB(200, 190, 160) else Color3.fromRGB(110, 170, 90)
			local lawnMat = if isLandmarkBlock(i, j) then Enum.Material.Pavement else Enum.Material.Grass
			part(folder, "Lawn", Vector3.new(BLOCK - 12, 0.1, BLOCK - 12), CFrame.new(c.X, SIDEWALK_TOP + 0.05, c.Z), lawnColor, lawnMat)
		end
	end
	local wallH = 600
	for _, d in { Vector3.new(1, 0, 0), Vector3.new(-1, 0, 0), Vector3.new(0, 0, 1), Vector3.new(0, 0, -1) } do
		local size = if d.X ~= 0 then Vector3.new(4, wallH, TOTAL) else Vector3.new(TOTAL, wallH, 4)
		local w = part(folder, "Wall", size, CFrame.new(d * (HALF + 2) + Vector3.new(0, wallH / 2, 0)), Color3.new(1, 1, 1), Enum.Material.SmoothPlastic)
		w.Transparency = 1
	end
end

local function sidewalkSpot(): Vector3
	local i, j = rng:NextInteger(0, GRID - 1), rng:NextInteger(0, GRID - 1)
	local c = blockCenter(i, j)
	local edge = BLOCK / 2 - 3
	local along = rng:NextNumber(-edge, edge)
	local side = rng:NextInteger(1, 4)
	local off = if side == 1 then Vector3.new(edge, 0, along) elseif side == 2 then Vector3.new(-edge, 0, along) elseif side == 3 then Vector3.new(along, 0, edge) else Vector3.new(along, 0, -edge)
	return Vector3.new(c.X + off.X, SIDEWALK_TOP, c.Z + off.Z)
end

local function roadSpot(): (Vector3, number)
	local k = rng:NextInteger(0, GRID)
	local line = -HALF + ROAD / 2 + k * (BLOCK + ROAD)
	local along = rng:NextNumber(-HALF + ROAD, HALF - ROAD)
	local lane = (if rng:NextNumber() < 0.5 then -1 else 1) * ROAD / 4
	if rng:NextNumber() < 0.5 then
		return Vector3.new(line + lane, 0, along), 0 -- driving along Z
	end
	return Vector3.new(along, 0, line + lane), math.pi / 2 -- driving along X
end

-- Visual detail per kind: the body is always the first part; extras only add shape language.
local function decorate(m: Model, kind: Config.PropKind, base: CFrame, color: Color3)
	local dims = kind.dims
	if kind.where == "block" then
		local dark = color:Lerp(Color3.new(0, 0, 0), 0.35)
		part(m, "Roof", Vector3.new(dims.X + 1, 1.2, dims.Z + 1), base * CFrame.new(0, dims.Y / 2 + 0.6, 0), dark, Enum.Material.Slate)
		-- One glass band per floor wraps all four faces.
		local floors = math.clamp(math.floor(dims.Y / 6), 2, 16)
		local glass = Color3.fromRGB(170, 210, 235)
		for f = 1, floors - 1 do
			local y = -dims.Y / 2 + f * (dims.Y / floors)
			part(m, "Windows", Vector3.new(dims.X + 0.3, 1.4, dims.Z + 0.3), base * CFrame.new(0, y, 0), glass, Enum.Material.Glass).Transparency = 0.15
		end
		part(m, "Door", Vector3.new(4, 6, 0.4), base * CFrame.new(0, -dims.Y / 2 + 3, -dims.Z / 2 - 0.2), dark, Enum.Material.Wood)
	elseif kind.name == "Tree" then
		-- The body is the trunk; the canopy sits on top.
		ball(m, "Canopy", dims.X * 1.3, base * CFrame.new(0, dims.Y / 2, 0), color, Enum.Material.Grass)
	elseif kind.where == "road" and dims.Z > dims.X * 1.5 then
		part(m, "Cabin", Vector3.new(dims.X * 0.9, dims.Y * 0.4, dims.Z * 0.45), base * CFrame.new(0, dims.Y * 0.45, -dims.Z * 0.08), Color3.fromRGB(160, 205, 235), Enum.Material.Glass)
		local r = math.min(dims.Y * 0.45, 2.4)
		for _, sx in { -1, 1 } do
			for _, sz in { -1, 1 } do
				local w = part(m, "Wheel", Vector3.new(0.8, r, r), base * CFrame.new(sx * dims.X / 2, -dims.Y / 2 + r / 2 - 0.3, sz * dims.Z * 0.32), Color3.fromRGB(25, 25, 28), Enum.Material.SmoothPlastic)
				w.Shape = Enum.PartType.Cylinder
			end
		end
	end
end

local function finish(m: Model, body: BasePart, size: number, kind: string, respawn: boolean, edibles: Folder)
	for _, p in m:GetDescendants() do
		if p:IsA("BasePart") then
			-- Small things never block anyone (they get eaten on contact); big ones do.
			p.CanCollide = size >= 4
		end
	end
	m.PrimaryPart = body
	m:SetAttribute("Size", size)
	m:SetAttribute("Mass", City.reward(size))
	m:SetAttribute("Kind", kind)
	m:SetAttribute("Respawn", respawn)
	m.Parent = edibles
end

local function makeProp(kind: Config.PropKind, edibles: Folder, position: Vector3, yaw: number): Model
	local m = Instance.new("Model")
	m.Name = kind.name
	local dims = kind.dims
	local color = kind.color
	if kind.where == "block" then
		color = pick(Config.BUILDING_COLORS)
	elseif kind.where == "road" and dims.Z > dims.X * 1.5 and kind.name ~= "Bus" then
		color = pick(Config.VEHICLE_COLORS)
	end
	local base = CFrame.new(position + Vector3.new(0, dims.Y / 2, 0)) * CFrame.Angles(0, yaw, 0)
	local body: Part
	if kind.name == "Tree" then
		body = part(m, "Trunk", Vector3.new(dims.X * 0.25, dims.Y, dims.X * 0.25), base, Color3.fromRGB(110, 80, 50), Enum.Material.Wood)
	else
		body = part(m, "Body", dims, base, color, kind.material)
	end
	decorate(m, kind, base, color)
	finish(m, body, math.max(dims.X, dims.Y, dims.Z), kind.name, kind.respawn, edibles)
	return m
end

function City.spawn(kind: Config.PropKind, edibles: Folder): Model?
	if kind.where == "sidewalk" then
		return makeProp(kind, edibles, sidewalkSpot(), rng:NextNumber(0, math.pi * 2))
	elseif kind.where == "road" then
		local pos, yaw = roadSpot()
		return makeProp(kind, edibles, pos, yaw)
	end
	if #freeSlots == 0 then
		return nil
	end
	local slot = table.remove(freeSlots, rng:NextInteger(1, #freeSlots)) :: Vector3
	return makeProp(kind, edibles, slot, rng:NextInteger(0, 3) * math.pi / 2)
end

-- Landmarks ----------------------------------------------------------------------------------

local function pearl(m: Model, c: Vector3, h: number): BasePart
	local pink = Color3.fromRGB(230, 90, 150)
	local steel = Color3.fromRGB(200, 205, 215)
	local base = part(m, "Base", Vector3.new(44, 6, 44), CFrame.new(c.X, SIDEWALK_TOP + 3, c.Z), Color3.fromRGB(150, 150, 160), Enum.Material.Concrete)
	local y0 = SIDEWALK_TOP + 6
	-- Three slanted legs up to the lower sphere.
	for a = 0, 2 do
		local ang = a * math.pi * 2 / 3
		local foot = Vector3.new(c.X + math.cos(ang) * 16, y0, c.Z + math.sin(ang) * 16)
		local top = Vector3.new(c.X, y0 + h * 0.28, c.Z)
		local mid = (foot + top) / 2
		part(m, "Leg", Vector3.new(4, 4, (top - foot).Magnitude), CFrame.lookAt(mid, top), steel, Enum.Material.Metal)
	end
	part(m, "Column", Vector3.new(7, h * 0.78, 7), CFrame.new(c.X, y0 + h * 0.39, c.Z), steel, Enum.Material.Metal)
	ball(m, "LowerSphere", h * 0.2, CFrame.new(c.X, y0 + h * 0.28, c.Z), pink, Enum.Material.Glass)
	ball(m, "UpperSphere", h * 0.13, CFrame.new(c.X, y0 + h * 0.66, c.Z), pink, Enum.Material.Glass)
	ball(m, "TopSphere", h * 0.05, CFrame.new(c.X, y0 + h * 0.8, c.Z), pink, Enum.Material.Glass)
	part(m, "Spire", Vector3.new(1.5, h * 0.18, 1.5), CFrame.new(c.X, y0 + h * 0.89, c.Z), steel, Enum.Material.Metal)
	return base
end

local function empire(m: Model, c: Vector3, h: number): BasePart
	local stone = Color3.fromRGB(205, 195, 175)
	local glass = Color3.fromRGB(150, 185, 210)
	local y = SIDEWALK_TOP
	local base: BasePart? = nil
	-- Setbacks: each tier narrower and the top tiers taller.
	local tiers = { { 50, 0.18 }, { 40, 0.22 }, { 30, 0.3 }, { 20, 0.1 } }
	for idx, t in tiers do
		local w, frac = t[1], t[2]
		local th = h * frac
		local p = part(m, "Tier" .. idx, Vector3.new(w, th, w), CFrame.new(c.X, y + th / 2, c.Z), stone, Enum.Material.Limestone)
		for f = 1, math.floor(th / 6) do
			part(m, "Windows", Vector3.new(w + 0.3, 1.2, w + 0.3), CFrame.new(c.X, y + f * 6 - 2, c.Z), glass, Enum.Material.Glass)
		end
		base = base or p
		y += th
	end
	part(m, "Mast", Vector3.new(4, h * 0.1, 4), CFrame.new(c.X, y + h * 0.05, c.Z), stone, Enum.Material.Metal)
	part(m, "Antenna", Vector3.new(1, h * 0.1, 1), CFrame.new(c.X, y + h * 0.15, c.Z), Color3.fromRGB(230, 60, 60), Enum.Material.Neon)
	return base :: BasePart
end

local function eiffel(m: Model, c: Vector3, h: number): BasePart
	local iron = Color3.fromRGB(140, 105, 70)
	local y0 = SIDEWALK_TOP
	local base = part(m, "Plaza", Vector3.new(60, 1, 60), CFrame.new(c.X, y0 + 0.5, c.Z), Color3.fromRGB(205, 195, 170), Enum.Material.Pavement)
	-- Four legs that lean in to the first platform, then a tapering mast.
	local spread, p1 = 24, h * 0.25
	for _, s in { Vector3.new(1, 0, 1), Vector3.new(-1, 0, 1), Vector3.new(1, 0, -1), Vector3.new(-1, 0, -1) } do
		local foot = Vector3.new(c.X + s.X * spread, y0 + 1, c.Z + s.Z * spread)
		local top = Vector3.new(c.X + s.X * 8, y0 + p1, c.Z + s.Z * 8)
		part(m, "Leg", Vector3.new(5, 5, (top - foot).Magnitude), CFrame.lookAt((foot + top) / 2, top), iron, Enum.Material.Metal)
	end
	part(m, "Platform1", Vector3.new(26, 3, 26), CFrame.new(c.X, y0 + p1, c.Z), iron, Enum.Material.Metal)
	part(m, "Section2", Vector3.new(14, h * 0.3, 14), CFrame.new(c.X, y0 + p1 + h * 0.15, c.Z), iron, Enum.Material.Metal)
	part(m, "Platform2", Vector3.new(18, 2, 18), CFrame.new(c.X, y0 + p1 + h * 0.3, c.Z), iron, Enum.Material.Metal)
	part(m, "Section3", Vector3.new(7, h * 0.35, 7), CFrame.new(c.X, y0 + p1 + h * 0.3 + h * 0.175, c.Z), iron, Enum.Material.Metal)
	part(m, "Tip", Vector3.new(2, h * 0.1, 2), CFrame.new(c.X, y0 + p1 + h * 0.65 + h * 0.05, c.Z), Color3.fromRGB(240, 210, 120), Enum.Material.Neon)
	return base
end

local BUILDERS: { [string]: (Model, Vector3, number) -> BasePart } = { pearl = pearl, empire = empire, eiffel = eiffel }

local function buildLandmarks(edibles: Folder)
	for _, l in Config.LANDMARKS do
		local m = Instance.new("Model")
		m.Name = l.name
		local c = blockCenter(l.block[1], l.block[2])
		local build = BUILDERS[l.style]
		if build then
			local body = build(m, c, l.size)
			finish(m, body, l.size, l.name, false, edibles)
			m:SetAttribute("Landmark", true)
		end
	end
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
			if not isLandmarkBlock(i, j) then
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
	buildLandmarks(edibles)
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

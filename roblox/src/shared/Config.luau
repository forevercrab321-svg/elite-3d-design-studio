--!strict
-- GROW EVERYTHING (Roblox) — every balance value lives here.
-- Units are studs (a default character is about 5 studs tall at scale 1).

local Config = {}

-- Rounds
Config.ROUND_SECONDS = 300
Config.INTERMISSION_SECONDS = 15
Config.MIN_PLAYERS_TO_START = 1

-- Growth: the character's scale is (mass / START_MASS) ^ (1/3), so mass grows like volume.
Config.START_MASS = 10
Config.MAX_SCALE = 40
-- You can eat an object whose size (largest dimension, studs) is at most this × your height.
Config.EAT_REACH = 0.8
Config.CHARACTER_HEIGHT = 5
-- Mass gained from an object of size x: REWARD_FACTOR × x^REWARD_EXP. The exponent is below 3
-- (mass grows like volume), so each bite is worth less relative to you as you grow: early growth
-- is fast, late growth needs buildings.
-- v0.2: 0.5 → 0.3 (the first playtest reached car size in about a minute; target is 1.5–3 min).
Config.REWARD_FACTOR = 0.3
Config.REWARD_EXP = 2.5
-- Eating radius around the root part, in character heights.
Config.EAT_RADIUS = 0.55
Config.EAT_TICK = 0.1

-- PvP: a player this many times bigger eats a smaller one and takes this share of its mass.
Config.PVP_RATIO = 1.25
Config.PVP_STEAL = 0.5

-- Movement: speed grows slowly with size, the camera pulls back a lot.
Config.BASE_WALKSPEED = 18
Config.WALKSPEED_PER_SCALE = 1.5
Config.MAX_WALKSPEED = 60
Config.CAMERA_ZOOM_PER_SCALE = 14

-- City layout (procedural): GRID × GRID blocks separated by roads.
Config.GRID = 7
Config.BLOCK = 90
Config.ROAD = 26
-- Landmarks (one per listed block, never respawn). Edible from scale size / (EAT_REACH × height):
-- the Empire State at about 32, the Pearl Tower at about 37.
export type Landmark = { name: string, style: string, size: number, block: { number } }
Config.LANDMARKS = {
	{ name = "Oriental Pearl Tower", style = "pearl", size = 150, block = { 3, 3 } },
	{ name = "Empire State Building", style = "empire", size = 130, block = { 1, 5 } },
	{ name = "Eiffel Tower", style = "eiffel", size = 140, block = { 5, 1 } },
} :: { Landmark }

-- Colour palettes: buildings and vehicles pick a random one so the city reads as a city.
Config.BUILDING_COLORS = {
	Color3.fromRGB(226, 196, 160), Color3.fromRGB(196, 92, 72), Color3.fromRGB(96, 160, 168),
	Color3.fromRGB(240, 228, 200), Color3.fromRGB(110, 130, 170), Color3.fromRGB(150, 196, 150),
	Color3.fromRGB(232, 168, 96), Color3.fromRGB(170, 120, 160),
}
Config.VEHICLE_COLORS = {
	Color3.fromRGB(220, 60, 60), Color3.fromRGB(60, 110, 220), Color3.fromRGB(245, 245, 245),
	Color3.fromRGB(250, 200, 40), Color3.fromRGB(40, 40, 46), Color3.fromRGB(70, 170, 110),
}
-- Player machines: one bright body colour each.
Config.MACHINE_COLORS = {
	Color3.fromRGB(255, 140, 40), Color3.fromRGB(60, 170, 255), Color3.fromRGB(120, 220, 90),
	Color3.fromRGB(255, 90, 160), Color3.fromRGB(170, 110, 255), Color3.fromRGB(255, 215, 60),
}

-- Edible catalog. size = largest dimension in studs; count = how many per city; respawn = refill.
export type PropKind = {
	name: string,
	dims: Vector3,
	color: Color3,
	material: Enum.Material,
	count: number,
	respawn: boolean,
	where: string, -- "sidewalk" | "road" | "block"
}

Config.PROPS = {
	{ name = "Can", dims = Vector3.new(0.5, 0.8, 0.5), color = Color3.fromRGB(200, 60, 50), material = Enum.Material.Metal, count = 260, respawn = true, where = "sidewalk" },
	{ name = "Bottle", dims = Vector3.new(0.4, 1.1, 0.4), color = Color3.fromRGB(70, 160, 90), material = Enum.Material.Glass, count = 200, respawn = true, where = "sidewalk" },
	{ name = "Box", dims = Vector3.new(1.4, 1.2, 1.4), color = Color3.fromRGB(180, 140, 90), material = Enum.Material.Cardboard, count = 160, respawn = true, where = "sidewalk" },
	{ name = "Cone", dims = Vector3.new(1.0, 1.8, 1.0), color = Color3.fromRGB(240, 120, 30), material = Enum.Material.Plastic, count = 110, respawn = true, where = "road" },
	{ name = "TrashCan", dims = Vector3.new(2.0, 3.0, 2.0), color = Color3.fromRGB(60, 90, 70), material = Enum.Material.Metal, count = 90, respawn = true, where = "sidewalk" },
	{ name = "Tree", dims = Vector3.new(5, 9, 5), color = Color3.fromRGB(80, 160, 80), material = Enum.Material.Grass, count = 90, respawn = true, where = "sidewalk" },
	{ name = "Bench", dims = Vector3.new(4.5, 2.2, 1.6), color = Color3.fromRGB(120, 80, 50), material = Enum.Material.Wood, count = 60, respawn = true, where = "sidewalk" },
	{ name = "Car", dims = Vector3.new(4.5, 4.0, 9.5), color = Color3.fromRGB(60, 110, 200), material = Enum.Material.SmoothPlastic, count = 70, respawn = true, where = "road" },
	{ name = "Van", dims = Vector3.new(5.5, 6.5, 12), color = Color3.fromRGB(235, 235, 235), material = Enum.Material.SmoothPlastic, count = 30, respawn = true, where = "road" },
	{ name = "Bus", dims = Vector3.new(6.5, 8, 24), color = Color3.fromRGB(230, 180, 40), material = Enum.Material.SmoothPlastic, count = 16, respawn = true, where = "road" },
	{ name = "House", dims = Vector3.new(26, 22, 26), color = Color3.fromRGB(200, 170, 140), material = Enum.Material.Brick, count = 40, respawn = false, where = "block" },
	{ name = "Office", dims = Vector3.new(30, 60, 30), color = Color3.fromRGB(150, 170, 190), material = Enum.Material.Concrete, count = 22, respawn = false, where = "block" },
	{ name = "Tower", dims = Vector3.new(34, 110, 34), color = Color3.fromRGB(110, 130, 160), material = Enum.Material.Glass, count = 8, respawn = false, where = "block" },
} :: { PropKind }

-- Monetization (create these in the Creator Hub, then paste the ids). 0 = not set up yet.
-- Cosmetics only: nothing you can buy makes you bigger or faster.
Config.GAMEPASS_VIP_TRAIL = 0

-- Remote names (created by the server in ReplicatedStorage.Remotes).
Config.REMOTES = { "Ate", "Eaten", "RoundState" }

-- Respawning props come back this long after being eaten, somewhere else in the city.
Config.RESPAWN_SECONDS = 20

return Config

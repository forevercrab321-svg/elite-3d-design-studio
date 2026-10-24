--!strict
-- The web game's growth maths (game/src/systems/growth.ts), on WebConfig numbers.
-- Power = the machine's diameter in metres; mass in kg.

local WebConfig = require(script.Parent:WaitForChild("WebConfig"))

local G = WebConfig.growth
local CLASSES = WebConfig.classes

local Growth = {}

function Growth.diameterForMass(mass: number): number
	return G.startDiameter * (mass / G.startMass) ^ G.sizeExponent
end

function Growth.massForDiameter(diameter: number): number
	return G.startMass * (diameter / G.startDiameter) ^ (1 / G.sizeExponent)
end

function Growth.classForPower(power: number): number
	local id = 0
	for _, c in CLASSES do
		if power >= c.requiredPower then
			id = c.id
		end
	end
	return id
end

function Growth.tierForClass(cls: number): number
	local tier = 1
	for _, t in G.tiers do
		if cls >= t.unlockClass then
			tier = t.tier
		end
	end
	return tier
end

function Growth.tierName(tier: number): string
	return G.tiers[tier].name
end

function Growth.classLabel(cls: number): string
	return CLASSES[cls + 1].label
end

-- Progress toward the next class unlock: next class id (or nil at the top), its mass, 0..1.
function Growth.progress(mass: number): (number?, number?, number)
	local cls = Growth.classForPower(Growth.diameterForMass(mass))
	local nextClass = CLASSES[cls + 2]
	if not nextClass then
		return nil, nil, 1
	end
	local from = Growth.massForDiameter(math.max(CLASSES[cls + 1].requiredPower, G.startDiameter))
	local to = Growth.massForDiameter(nextClass.requiredPower)
	return nextClass.id, to, math.clamp((mass - from) / (to - from), 0, 1)
end

-- Required power (diameter, m) to absorb an object type.
function Growth.requiredPower(typeId: string): number
	local def = WebConfig.objects[typeId]
	return def.requiredPower or CLASSES[def.objectClass + 1].requiredPower
end

-- "12.3 kg" under 100, "1,234 kg" under 10 t, then "12.3 t" / "123 t" (arena/ArenaUi.ts massText).
local function commas(n: number): string
	local s = tostring(math.floor(n + 0.5))
	local out = s:reverse():gsub("(%d%d%d)", "%1,"):reverse()
	return (out:gsub("^,", ""))
end
function Growth.massText(kg: number): (string, string)
	if kg < 100 then
		return string.format("%.1f", kg), "kg"
	elseif kg < 10000 then
		return commas(kg), "kg"
	elseif kg < 100000 then
		return string.format("%.1f", kg / 1000), "t"
	end
	return commas(kg / 1000), "t"
end

return Growth

--!strict
-- The web pull-in (ArenaGame.updatePulls), shared: the server runs it to decide when an object is
-- absorbed, every client runs it to animate its own copy smoothly (the server never moves the
-- pulled model, so nothing streams at 60 Hz). Metres and seconds.

local WebConfig = require(script.Parent:WaitForChild("WebConfig"))
local CC = WebConfig.collection

local Pull = {}

export type State = { x: number, y: number, z: number, yaw: number, tilt: number, vx: number, vy: number, vz: number, pullTime: number, phase: number }

-- Destruction beat before a big object flies: longer the bigger the class.
function Pull.phase(def: any): number
	local cls = def.objectClass
	return if cls >= 4 then 0.25 * (1 + math.max(0, cls - 5) * CC.heavyPhasePerClass) else 0
end

-- One step toward the owner's intake (0.3·d ahead at 0.32·d height). Returns true on arrival.
function Pull.step(s: State, def: any, radius: number, dt: number, ownerX: number, ownerZ: number, ownerY: number, heading: number, diameter: number, pull: number): boolean
	s.pullTime += dt
	if s.pullTime < s.phase then
		-- Rip objects tilt up during the beat (crush/collapse just shake via effects).
		if def.destructionType == "rip" then
			s.tilt = -0.5 * s.pullTime / math.max(0.001, s.phase)
		end
		return false
	end
	local tx = ownerX - math.sin(heading) * diameter * 0.3
	local tz = ownerZ - math.cos(heading) * diameter * 0.3
	local ty = ownerY + diameter * 0.32
	local dx, dy, dz = tx - s.x, ty - (s.y + def.size[2] * 0.5), tz - s.z
	local dist = math.sqrt(dx * dx + dy * dy + dz * dz)
	if dist < diameter * CC.absorbDistanceFactor + radius * 0.25 or s.pullTime > CC.maxPullSeconds / pull + s.phase then
		return true
	end
	local accel = CC.pullAcceleration * (0.4 + diameter) * pull
	local damp = math.exp(-5 * dt)
	local inv = 1 / math.max(dist, 1e-3)
	s.vx = s.vx * damp + dx * inv * accel * dt
	s.vy = s.vy * damp + dy * inv * accel * dt + 2.5 * diameter * dt
	s.vz = s.vz * damp + dz * inv * accel * dt
	s.x += s.vx * dt
	s.y += s.vy * dt
	s.z += s.vz * dt
	s.yaw += (6 + 10 * (s.pullTime - s.phase)) * dt
	return false
end

-- Visual scale while flying in: shrinks to 30%.
function Pull.scale(s: State): number
	return math.max(0.3, 1 - 0.8 * math.max(0, s.pullTime - s.phase))
end

return Pull

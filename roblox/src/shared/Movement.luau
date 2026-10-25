--!strict
-- The web arena's machine movement (arena/ArenaGame.ts moveActor + collideObjects), shared by the
-- local player's client and the server's AI rivals. Metres and seconds.

local WebConfig = require(script.Parent:WaitForChild("WebConfig"))
local Collision = require(script.Parent:WaitForChild("Collision"))

local MC = WebConfig.movement
local A = WebConfig.arena
local G = WebConfig.growth

local Movement = {}

export type Body = {
	x: number,
	z: number,
	heading: number,
	speed: number,
	dashTime: number,
	dashCooldown: number,
	stunUntil: number,
}

export type Solid = { x: number, z: number, radius: number, box: Collision.Box }

function Movement.new(x: number, z: number, heading: number): Body
	return { x = x, z = z, heading = heading, speed = 0, dashTime = 0, dashCooldown = 0, stunUntil = 0 }
end

function Movement.topSpeed(vehicle: any, diameter: number, boosted: boolean): number
	return MC.baseTopSpeed * vehicle.speed * (if boosted then A.speedMul else 1) * (diameter / G.startDiameter) ^ MC.topSpeedExponent
end

-- One step. (wx, wz) is the wanted world direction (length ≤ 1); solids are the nearby objects too
-- big to eat. Returns the top speed and whether the machine crashed while dashing (stunned).
function Movement.step(b: Body, dt: number, now: number, wx: number, wz: number, dashPressed: boolean, frozen: boolean, mass: number, diameter: number, vehicle: any, boosted: boolean, colliders: { Collision.Box }?, bounds: any?, solids: { Solid }?): (number, boolean)
	local massLog = math.log(mass / G.startMass)
	local top = Movement.topSpeed(vehicle, diameter, boosted)
	local accel = (top / (MC.accelSeconds * (1 + MC.accelMassDrag * massLog))) * vehicle.accel
	local turnRate = (MC.baseTurnRate / (1 + MC.turnMassDrag * massLog)) * vehicle.turn
	local stunned = frozen or now < b.stunUntil
	local mag = if stunned then 0 else math.min(1, math.sqrt(wx * wx + wz * wz))
	b.dashCooldown = math.max(0, b.dashCooldown - dt)
	b.dashTime = math.max(0, b.dashTime - dt)
	if dashPressed and not stunned and b.dashCooldown <= 0 then
		b.dashTime = MC.dash.duration
		b.dashCooldown = MC.dash.cooldown * vehicle.dashCooldown
	end
	local targetSpeed = 0
	if mag > 0.05 then
		wx /= mag
		wz /= mag
		local want = math.atan2(-wx, -wz)
		local diff = math.atan2(math.sin(want - b.heading), math.cos(want - b.heading))
		b.heading += math.clamp(diff, -turnRate * dt, turnRate * dt)
		targetSpeed = mag * top * math.clamp(math.cos(diff), 0.25, 1)
	else
		mag = 0
	end
	if b.dashTime > 0 and not stunned then
		targetSpeed = math.max(targetSpeed, top) * MC.dash.speedMultiplier
	end
	local dv = targetSpeed - b.speed
	local rate = accel * (if dv < 0 and mag < 0.05 then 1.6 else 1) * dt
	b.speed += math.sign(dv) * math.min(math.abs(dv), rate)
	local r = diameter * 0.47
	local nx, nz = b.x - math.sin(b.heading) * b.speed * dt, b.z - math.cos(b.heading) * b.speed * dt
	if colliders and bounds then
		nx, nz = Collision.resolveStatic(nx, nz, r, colliders, bounds)
	end
	b.x, b.z = nx, nz
	local crashed = false
	if solids then
		for _, o in solids do
			if math.abs(o.x - b.x) <= o.radius + r and math.abs(o.z - b.z) <= o.radius + r then
				local cx, cz, depth = Collision.circleVsObb(b.x, b.z, r, o.box)
				if cx then
					b.x += cx * (depth :: number)
					b.z += (cz :: number) * (depth :: number)
					-- Slamming something too big at dash speed stuns (and costs mass, server side).
					if b.dashTime > 0 and b.speed > top * 1.2 and now > b.stunUntil then
						b.stunUntil = now + A.crashStunSeconds
						b.speed *= -0.3
						crashed = true
					elseif b.speed > top * 0.45 then
						b.speed *= 0.4
					end
				end
			end
		end
	end
	return top, crashed
end

-- Is a circle at (x, z) blocked by static boxes or solids? (ArenaGame.isBlocked, for the AI.)
function Movement.blocked(x: number, z: number, r: number, colliders: { Collision.Box }, bounds: any, solids: { Solid }): boolean
	if x < bounds.minX + r or x > bounds.maxX - r or z < bounds.minZ + r or z > bounds.maxZ - r then
		return true
	end
	for _, b in colliders do
		if Collision.circleVsObb(x, z, r, b) then
			return true
		end
	end
	for _, o in solids do
		if Collision.circleVsObb(x, z, r, o.box) then
			return true
		end
	end
	return false
end

return Movement

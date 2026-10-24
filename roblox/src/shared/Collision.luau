--!strict
-- The web game's 2D collision (core/collision.ts circleVsObb, World.resolveStatic) and the city
-- ground height grid, in metres. Box = { cx, cz, hx, hz, yaw }.

local Collision = {}

export type Box = { number }

-- Circle (px, pz, r) against an oriented box. Returns the push-out normal and depth, or nil.
function Collision.circleVsObb(px: number, pz: number, r: number, b: Box): (number?, number?, number?)
	local c, s = math.cos(b[5]), math.sin(b[5])
	local dx, dz = px - b[1], pz - b[2]
	local lx = dx * c - dz * s
	local lz = dx * s + dz * c
	local qx = math.clamp(lx, -b[3], b[3])
	local qz = math.clamp(lz, -b[4], b[4])
	local ex, ez = lx - qx, lz - qz
	local d2 = ex * ex + ez * ez
	if d2 >= r * r then
		return nil
	end
	local depth
	if d2 > 1e-10 then
		local d = math.sqrt(d2)
		ex /= d
		ez /= d
		depth = r - d
	else
		-- Centre inside the box: leave through the nearest face.
		local px2 = b[3] - math.abs(lx)
		local pz2 = b[4] - math.abs(lz)
		if px2 < pz2 then
			ex, ez = if lx < 0 then -1 else 1, 0
			depth = px2 + r
		else
			ex, ez = 0, if lz < 0 then -1 else 1
			depth = pz2 + r
		end
	end
	return ex * c + ez * s, -ex * s + ez * c, depth
end

-- Push a circle out of the static boxes (two passes) and keep it inside the bounds.
function Collision.resolveStatic(x: number, z: number, r: number, boxes: { Box }, bounds: { [string]: number }): (number, number, boolean)
	local hit = false
	for _ = 1, 2 do
		for _, b in boxes do
			local nx, nz, depth = Collision.circleVsObb(x, z, r, b)
			if nx then
				x += nx * (depth :: number)
				z += (nz :: number) * (depth :: number)
				hit = true
			end
		end
	end
	x = math.clamp(x, bounds.minX + r, bounds.maxX - r)
	z = math.clamp(z, bounds.minZ + r, bounds.maxZ - r)
	return x, z, hit
end

-- Decode the run-length ground grid ({ x0, z0, rows = { "h*n,h*n" } }) into a height lookup.
function Collision.groundLookup(ground: any): (number, number) -> number
	local rows: { { number } } = {}
	for i, row in ground.rows do
		local cells: { number } = {}
		for h, n in string.gmatch(row, "([%-%d%.]+)%*(%d+)") do
			local v = tonumber(h) :: number
			for _ = 1, tonumber(n) :: number do
				table.insert(cells, v)
			end
		end
		rows[i] = cells
	end
	local x0, z0 = ground.x0, ground.z0
	return function(x: number, z: number): number
		local row = rows[math.floor(z - z0) + 1]
		return row and row[math.floor(x - x0) + 1] or 0
	end
end

return Collision

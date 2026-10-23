# German Tanks

The game is split into a small page shell and focused files so future changes are easier to find.

## Files

- `germantanks.html` contains the menu and HUD markup, then loads the files in dependency order.
- `styles.css` contains the menu, HUD, and gunner-sight presentation.
- `game.js` contains tank setup, controls, movement, aiming, combat, camera behavior, and the game loop.
- `lod.js` is the shared distance-detail helper used by all four maps (ground chunks plus near/far versions of trees, rocks and props). It never touches tanks. `game.js` calls each map's `updateLOD(camera.position)` once per frame.
- `forest-map.js` builds the forest terrain, trenches, trees, sandbags, battlefield debris, climbable cliff plateaus, and wind-swaying foliage (see below).
- `desert-map.js` builds the desert terrain, ridgelines, basins, climbable mesas, rock clusters, scrub and battlefield debris (see below).
- `town-map.js` builds the large town-and-plains map: rolling farmland with fields, hedgerows, tree-lined roads and farms around a street grid of realistic buildings (church on a hill, town hall, plaza, works yard). Many buildings are damaged or destroyed with smoke and fire. Shells burst on walls and roofs (`solidAt`).
- `airport-map.js` builds the huge 9.6 km airport map for the coming flying maps: two airfields (each team spawns lined up on its own runway, shown on the minimap), giant lakes, rivers, farmland with villages, forests, steppe, a desert corner and a snow-capped mountain range, linked by a highway. Tanks can wade rivers but not deep lake water. Uses `lod.js`.
- At game start, the game randomly selects the forest, desert, town or airport map with equal odds. Add `?map=forest`, `?map=desert`, `?map=town` or `?map=airport` to the URL to force one. The normal chase view shows a crosshair at the projected gun aim point.

Three.js is loaded from its CDN in `germantanks.html` before the other JavaScript files (`lod.js` loads before the maps).

## Distance detail (LOD)

- **Ground**: split into 20x20-cell chunks (forest, desert and town use 20; airport uses 40). Full detail close up, half resolution further out, quarter resolution beyond that (forest 130 / 300 m, desert 150 / 320 m, town 200 m half only, airport 260 / 560 m). Thin skirts under each chunk edge hide cracks between detail levels. Off-screen chunks are not drawn.
- **Trees and rocks**: grouped into square cells. Cells past the near distance (forest 130 m, desert 160 m, town 150 m, airport 480 m) swap to a cheaper shape in the same place: pines become plain cones, broadleaf crowns and rocks lose one subdivision level, town trees lose a trunk side and some crown blobs.
- **Small props** (forest rubble, logs, sandbags) are only drawn within 170 m.
- To tune, change the `levels` and `nearDist` numbers in each map file.
- The forest map's trees, props and ground resolution scale up to match its larger `groundSize`; `nearDist` there is 150 m for trees and 190 m for props.

## Atmosphere, motion blur and camera shake

All in `game.js`.

- **Haze** (near the top, after `scene.fog`): three's fog shader chunks are replaced so fog starts gently and rolls into full haze, valleys are hazier than ridge tops (low-lying haze layer), and the sun side of the sky gets a warm tint. The sky dome has a matching bright horizon band so far terrain dissolves into it. Tune the near distance in the `new THREE.Fog(...)` line, the height falloff (`0.028`) and the strength of the sun tint (`0.38`) in the `fog_fragment` chunk.
- **Motion blur** (`post`, right after the resize handler): the scene renders into an anti-aliased offscreen target and a full-screen pass blurs it along the camera's own motion (turning streaks it, driving fast stretches the edges outward). The screen centre stays sharp, and the effect is cut by ~70% in the gunner sight. `EXPOSURE` sets the strength. Add `?blur=0` to the URL to switch the pass off.
- **Camera shake** (`camTrauma` in `updateCamera`): nearby explosions, penetrating hits, other tanks' guns and your own gun add trauma (0-1). Shake size follows trauma squared, fades in a fraction of a second, is reduced in the gunner sight, and only changes the final camera pose, never aiming. `fxShake(pos, strength)` is the call to use for new effects.
- **Combat readability** (`fx*` functions): star-flash sprite on muzzle blasts and every hit, a tall light dust column plus a ground dust ring and dirt chips on ground hits, dense sparks on armour hits, a long bright spark streak on ricochets, bigger fireball on penetrations. Flashes grow slightly with distance, and additive sprites ignore fog and tone mapping so they stay bright at range.

## Match layer (War Thunder-style feedback)

All of it lives in `game.js` (`Match layer` section) with styling at the bottom of `styles.css`.

- Scoreboard with alive counts and timer, kill feed, score ticks, and TARGET DESTROYED banner.
- Hit-confirm sounds, red/grey incoming-hit direction arrow, and a slow-motion kill cam.
- Module damage: engine/transmission hits slow the tank, dead crew slow the reload, a dead driver halves speed.
- Engine fires burn until extinguished (`F`, two extinguishers); bots use theirs after a short delay.
- Module panel, reload bar, north-up minimap with view cone, victory/defeat/destroyed results screen.
- Moving tanks kick up track dust.

## M-V-Yoh (USA heavy tank, id `amx50`)

The old AMX-50 model, reworked as the H.L. Yoh M-V-Y concept as if it had been built in the mid-1950s (the internal id stays `amx50`). Figures are in the `amx50` entry of `TANK_CONFIGS`.

- **Stats**: ~55 t, 810 hp (about 14.7 hp/t), 37 km/h forward / 12 km/h reverse, 15 s full turret rotation, 9 s hand-loaded reload, +15 / -8 degrees gun elevation. 4 crew: driver and loader in the hull, commander and gunner in the narrow oscillating turret.
- **Shells** (keys 1-3, 120 mm): APBC-T 240 mm (205 mm far), HEAT 330 mm (ignores angle), HE 40 mm.
- **Armour** (cast, M103 / T43 class): hull glacis 102 mm laid well back, lower nose and sides 76 mm, rear 51 mm, roof 38 mm, floor 25 mm. Turret cast nose and mantlet 150 mm, sides 90 mm, rear 60 mm, roof 38 mm, floor 25 mm; the cast neck under the turret is 76 mm and is the weak spot.
- Ammunition is stowed low in the hull (plus a few ready rounds in the neck). Losing the loader slows the reload.

## T54E1 (oscillating turret)

- Hull is the M48 Patton casting: a lofted shell with a narrow belly, overhanging upper hull, sloped glacis and boat-shaped nose, 6 rubber-tyred road wheels, 5 return rollers, rear sprocket and front idler. It uses the same sprung-hull suspension as the IS-7 and FV4005 (`wheelPositions`).
- The turret is two pieces. The lower collar only traverses. The upper half (compartment, gun, autoloader bustle, cupola) is parented to `barrelPitchPivot`, which sits on the trunnion axis, so elevating or depressing the gun tilts the whole upper turret.
- Only the gun (`gunSlide`) recoils, not the turret. `updateGunRecoil` moves `tank.gunSlide` when it exists.
- Pitch limits are stored as `rotation.x`, which is negative when the gun points up: `minPitch` is the elevation stop and `maxPitch` is the depression stop.

## Leopard 1A5 (German medium tank, tier 4)

Menu: Germany -> Leopard 1A5. Tank id `leopard1a5` (config in `TANK_CONFIGS`, model in `buildTank`).

- **Stats**: 4 crew (driver in the hull; commander, gunner, loader in the turret), ~40 t, ~830 hp (20 hp/t), 72 km/h top speed, 25 km/h reverse, 105 mm L7A1, 15 s for a full turret rotation, 8 s reload, +20 / -9 degrees gun elevation.
- **Shells** (keys 1-4, pen at 0 degrees): APDS 350 mm, HEAT-FS 400 mm, HESH 127 mm (explosive, ignores angle), APFSDS 420 mm. APFSDS is flagged `defeatsComposite` for when composite armour is added to the game.
- **Armour**: hull glacis 70 mm laid back ~60 degrees from vertical (~140 mm line of sight), sides 35 mm, rear and floor 25 mm; cast turret front 65 mm, sides 45 mm, rear 52 mm. The lower nose plate is not in the brief and is set to 50 mm.
- **Add-on armour (1A5)**: six destructible modules on the turret front arc (a cheek, a shoulder and a roof module per side, `tank.addOnPanels`). HEAT, HESH or HE hitting a module blows that module off the tank (tumbling debris, scorch mark left behind) and the round is wasted; kinetic rounds pass straight through. A second shot at the same spot hits the bare steel. Logic: `addOnPanelHit` / `knockOffPanel` in `game.js`.
- **Gun stabilizer** (`config.stabilizer`): each frame the hull motion since last frame (bumps, pitch, roll, steering) is cancelled on the turret ring and trunnions, so the gun stays laid on target. A laser-rangefinder readout (LRF range in metres + STAB status) sits beside the crosshair.
- **Accuracy** (`config.accuracyFalloff`): perfect up to 40 km/h, then dispersion grows linearly to its maximum at 72 km/h (`shotSpread`).
- **Running gear**: 7 paired road wheels per side on torsion-bar trailing arms (the arms swing with each sprung wheel), 4 return rollers, rear drive sprocket, front idler, five hinged side skirts per side. It uses the same spring-damper hull suspension as the other tanks (`wheelPositions`).

## M1 Abrams (USA main battle tank, 1980, id `m1abrams`)

Menu: United States -> M1 Abrams. Config in `TANK_CONFIGS`, model in `buildTank` (`isM1`), 3.66 m wide / 7.93 m hull, drawn from real-metre helpers (`mX`, `mYh`, `mZ`).

- **Stats**: 4 crew (driver on the hull centreline; commander, gunner, loader in the turret), ~54.4 t, AGT1500 gas turbine 1,500 hp (~27.5 hp/t), 72 km/h governed top speed, 32 km/h reverse, 105 mm M68A1, 9 s for a full turret rotation, 6 s hand-loaded reload, +20 / -10 degrees gun elevation. Stabilized gun with laser rangefinder, accurate on the move (`accuracyFalloff`).
- **Shells** (keys 1-4, pen at 0 degrees): APFSDS-T M735 405 mm (`defeatsComposite`), HEAT-T M456A2 400 mm, HEP-T M393A2 127 mm (HESH-type), APDS-T M728 330 mm.
- **Composite armour** (estimates; the real figures are classified). A composite plate carries `ke` (RHA-equivalent vs kinetic rounds at its design angle `ref`) and `ce` (vs HEAT / HEP). Built with `comp(ke, ce, refDeg, zone)`; `effectiveThickness()` in `game.js` applies it. Kinetic rounds scale `ke` by the angle relative to `ref`; blunter non-long-rod rounds see +20%.
  - Turret front (31 degree cheeks and cap): 400 mm KE / 700 mm CE. Gun shield: 350 / 600.
  - Hull glacis (82 degrees from vertical): 350 mm KE / 750 mm CE. Lower front plate (40 degrees): 300 / 700.
  - Steel: turret sides 55 mm, bustle rear 45, roofs 30 / 25, hull sides 38, rear and floor 25.
  - The very shallow glacis ricochets most AP rounds that hit it head-on; shoot the turret, the lower plate or the sides.
- **Ammunition**: 44 rounds in the turret bustle and 8 in a hull compartment, both with blow-off panels (`blowOff` on the module). Most hits there vent upward, the three bustle roof panels fly off, the rack burns and the crew survives; a minority still detonate.
- **Running gear**: 7 dual road wheels per side on torsion bars (wider gap behind the front pair), 2 return rollers, rear sprocket, front idler, six hinged skirt panels per side (the two forward ones thicker). Same spring-damper suspension as the other tanks (`wheelPositions`).
- **Shape** (second pass): the hull is about 15% lower above the belly (`M1_HSQ` in `buildTank`, the hull is not lifted) and 7% longer (`M1_ZK`, which also stretches the track run, road wheel stations, skirts and hull modules). The turret is about 8% lower (`TYS`) with a bustle that reaches 3.3 m behind the ring. The old hexagonal gun shield is gone: the turret body ends in a flat front wall and two separate wedge-shaped composite cheek blocks (`cheekBlock`) stick out of it, proud of the sides and front and raked back about 47 degrees, with a small gun-shield slab recessed in the 0.84 m slot between them. Cheek faces keep the 400 / 700 mm composite values; the slab is 350 / 600.

## Forest map (bigger, cliffs, wind)

The forest map (`forest-map.js`) got a second pass: it's bigger, has climbable cliff plateaus, and its foliage sways in the wind.

- **Bigger map**: `groundSize` for the forest (set in `game.js`) went from 460 m to 640 m. All of the original hand-placed trenches, hills, roads and mud patches are stretched out by `layoutScale`, computed from `groundSize` itself (`(groundSize/2 - 40) / 164`), so the whole composition grows to fill the bigger map instead of leaving empty border. A new cross-trench spur and two extra mud patches use some of the added room; tree, debris and log counts are roughly doubled to match.
- **Climbable cliffs** (`cliffDefs` / `cliffAt` in `forest-map.js`): four rocky plateaus, each a flat-ish hilltop (up to 26 m) with a steep, near-cliff rim on most sides (height drops roughly 15 m over about 3 m of run right at the edge) but one gentle ramp corridor carved in (`rampWidth`/`rampLen`) that a tank can actually drive up. Every cliff's ramp automatically faces back toward the map centre (`dirX`/`dirZ`, computed from the cliff's own position), so the sheer face is toward the boundary wall and the drivable side faces the fight. `terrainHeightAt` just folds `cliffAt(x,z).h` into the normal height field — there's no separate collision system, so this is "climbable" in the same sense as the existing ridges: wheels simply follow the terrain height, including up the ramp. The ground mesh colours cliff faces with a dedicated rock palette (`cliffRock`/`cliffRockDark`/`cliffMoss`) driven by the same `cliffAt().rock` factor, and trees/debris/logs/bushes avoid spawning on the bare rock.
- **Wind-swaying trees** (`windMaterial` in `forest-map.js`): tree trunks, pine tiers, broadleaf crowns and the new bushes use a small `onBeforeCompile` shader patch (the same technique as the tank dirt shader in `game.js`) that bends each instance sideways over time, in local space, scaled by how high up a given vertex sits — so crowns and tiers sway noticeably while trunks stay almost rigid, and each instance gets its own phase (derived from its own instance-matrix position) so a stand of trees doesn't wave in unison. `game.js`'s `animate()` now passes elapsed seconds as a second argument to `mapUpdateLOD`, which the forest map uses to drive the shared `uTime` uniform; the desert and town maps simply ignore the extra argument.
- **More detail**: low underbrush/fern clumps (`bushPositions`, swaying like the trees, no collision so they don't block movement), scattered cut stumps, and a new field of weathered boulders (`boulderPositions`) including loose talus at the foot of the cliffs, added as proper colliders alongside the tree trunks.

## Desert map (bigger, varied rock clusters, more detail)

The desert map (`desert-map.js`) also got a second pass: it's bigger and the old repetitive rock field is gone.

- **Bigger map**: `groundSize` for the desert (set in `game.js`) went from 900 m to 1300 m. The desert's layout was already written in a `scale = groundSize/280` coordinate system, so every hill, basin, road and wash grows with the map automatically. Four new hills, two new basins, a road spur and a third wash branch were added so the extra room reads as new terrain rather than empty sand between the original features.
- **Rocks replaced**: the old field was 520 copies of one Dodecahedron shape at different sizes. It's gone, replaced by `boulderItems`/`slabItems` built from loose clusters (`clusterCount = 115`, 2-4 members each, jittered position/scale/rotation, an occasional bigger "anchor" rock per cluster) alternating between a rounded boulder shape and a flatter, wind-scoured slab shape. Both still only generate near/far LOD pairs, same as before.
- **Climbable mesas** (`mesas` / `mesaAt` in `desert-map.js`): three broad, gently-domed plateaus (10-15 m) folded into `terrainHeightAt` the same way the forest map's cliffs are, but with a shallower profile and no single ramp corridor - climbable from any direction, meant as hull-down high ground rather than a dramatic cliff face. Ground colouring picks up a dedicated `mesaRock` tint near their tops via the same `mesaAt().rock` factor, and scrub/debris avoid the steepest part of the slope.
- **More detail**: scrub clumps, sparse dead shrubs, and roadside debris (crates and oil drums, scattered within reach of the roads rather than spread uniformly) - all visual only, no colliders, same convention as the forest map's underbrush. The ground shading also got a finer high-frequency ripple pass for close-up dune texture, plus dark scorched-earth patches and lighter gravel/desert-pavement patches for variety.
- Only the boulder/slab clusters are colliders (`treeColliders`, same interface as before); scrub, dead shrubs and debris are decorative only.

## Airport map (huge, two airfields, lakes, rivers, biomes)

`airport-map.js` is a 9600 m map made for the flying maps that are coming later, so detail is light and it is
meant to look good from above as well as from a tank.

- **Airfields** (`airbases`): one per team, centred at x = -/+390, z = -/+3375 (6.75 km apart) and facing each other along z.
  Each has a 1200 x 50 m runway with markings and numbers, a parallel taxiway, an apron with a team roundel,
  five vaulted hangars, a tower, a terminal, barracks, a fuel farm and a radar dome. The ground is graded dead
  flat (`padWeight`) and the markings are painted on a decal. Each team spawns lined up on its own runway
  facing the enemy field (`spawnSlots(team)`; `randomTeamSpawn` in `game.js` uses it when a map provides it).
- **Water**: four lakes (the main one is about 3.5 km across) and seven rivers. Lakes shape the land first; rivers
  are carved on top and follow the land downhill, ending exactly at the lake surface. Tanks can wade rivers
  (about 1.3 m deep) but `blockedAt` stops them driving into deep lake water.
- **Biomes**: patchwork farmland (Voronoi fields), forests (conifers up the slopes, broadleaf in the lowlands, a
  clear central corridor), open steppe, a desert corner, and a snow-capped mountain range plus two massifs.
- **Towns and roads**: villages with a church in the farmland, linked to a highway between the two airfields.
- **Performance**: heights are baked into a 960 x 960 grid (10 m cells); the ground uses `lod.js` chunks; trees, rocks and
  scrub are instanced with near/far shapes. `game.js` keeps collider circles in a spatial hash (`colliderHit`).
- **Minimap**: the map renders its own north-up image (`minimapImage`: relief, water, roads, runways, team rings).
  Every other map gets a minimap picture too: `game.js` (`buildMapOverview`) renders shaded relief tinted for the map, the
  `minimapLines` each map file exports (forest roads and trenches, desert roads and washes, town streets) and tree or
  rock dots. The town's building footprints are still drawn on top.

## T-72B (USSR main battle tank, id `t72b`)

The 1985 T-72B with Kontakt-1 reactive armour. Everything is modelled in real metres (group scale 1.3, `u72/b72/c72` helpers in `buildTank`). Figures are in the `t72b` entry of `TANK_CONFIGS`.

- **Stats**: ~46 t, V-84 840 hp (~18 hp/t), 55 km/h forward / 4.8 km/h reverse, 15 s full turret rotation, 7 s autoloader cycle, +14 / -6 degrees gun elevation. 3 crew (driver, commander, gunner), no loader.
- **Hull**: 6.95 m long, 3.37 m over the tracks (3.57 m over the skirts), belly 0.47 m off the ground, glacis laid back 68 degrees from the vertical to a nose edge 0.735 m high, short steep lower plate, dozer blade folded on the lower glacis, left-rear exhaust, unditching beam, external fuel barrels on the right fender.
- **Running gear**: 580 mm tracks, six 750 mm dual road wheels per side with wider gaps between wheels 3-4-5, three return rollers, rear sprocket, front idler, five rubber side-screen panels.
- **Turret**: rounded cast "flying saucer" dome (superellipse plan, ~2.6 m wide, bulging full cheeks, 0.66 m crown), commander's cupola with NSVT (right), gunner's hatch and TPD-K1 sight (left), smoke launchers, snorkel and stowage bin on the rear, and the large round L-4A infrared searchlight on the right side of the mantlet (it elevates with the gun). 125 mm 2A46M-1 with thermal sleeve and bore evacuator; recoils with `gunSlide`.
- **Shells** (keys 1-3): 3BM42 APFSDS 457 mm at the muzzle / 406 mm far (1700 m/s), 3BK18M HEAT-FS 550 mm (ignores angle), 3OF26 HE-Frag.
- **Armour** (estimates, RHA-equivalent): glacis 500 kinetic / 560 shaped-charge at 68 degrees, lower plate and sides 80 mm, roof 25 mm, floor 20 mm; turret front and cheeks 520 / 600, sides 115 mm, rear 45 mm, mantlet 300 / 350.
- **Kontakt-1**: 24 destructible bricks on the glacis, 8 horizontal wedge packs on the turret, 4 per side on the front arc (horizontal triangular prisms: equilateral triangle in side view, base on the turret, apex outward), in a V around the gun with the strip beside the mantlet left clear for the coax and optics. HEAT, HESH and HE rounds detonate on a brick and blow it off; kinetic rounds pass through it.
- **Weak points**: the 22-round carousel autoloader sits on the hull floor under the turret, so a penetration there tends to cook it off. There are no blow-off panels.

## Challenger 1 (Mk 3) remodel

Hull, turret, skirts, fittings and gun details were rebuilt in real metres (helpers `c1x/c1y/c1z`, `b1`, `cy1`, `basket1` in `buildTank`). Running gear and stats are unchanged.

- **Hull**: 8.3 m overall, 0.50 m ground clearance, 3.52 m over the skirts. Narrow belly, overhanging upper hull, raised rear engine deck (1.50 m) stepping down to the 1.42 m fighting-compartment roof, shallow 17 degree glacis (nose edge 0.80 m up) with the recessed driver's hatch and periscope block, Mk 3 bolted frontal armour pack, short lower plate sloping back under the hull, rear plate leaning inward. Mk 3 extras: five thick up-armoured side skirt panels per side, external fuel drums on the rear corners, rubber mud flaps, headlamps, tow shackles, tools.
- **Turret**: welded Chobham-style box with vertical sides, flat 1.05 m roof (2.47 m above ground), angled front cheeks closing to a narrow nose and a front plate laid back about 62 degrees. Commander's cupola right rear with the large sight head (2.95 m) and the L37A2 pintle MG, loader's hatch left rear, gunner's TLS head right front, TOGS barbette on the right front cheek, two banks of five smoke dischargers, wire-mesh stowage baskets (both sides and rear), rear corner bins, NBC pack and antenna bases.
- **Gun**: 120 mm L11A5 with GRP thermal sleeve, fume extractor about two thirds out, muzzle reference sensor, shield recessed into the sloping front plate with rubber boot, coax MG to the left of the gun. Muzzle is 11.55 m from the rear of the hull (real overall length 11.56 m). Fixed a missing muzzle offset so shells now leave the real muzzle.

## Challenger 1 (Mk 3) turret rebuild (sloped front)

- The turret is now an arrowhead in plan (straight sides, front cheeks sweeping in at 24 then 28 degrees to a narrow nose) and, in profile, a flat roof that breaks into one long 38-degree front slope falling to a low chin; the L11A5 emerges from the middle of that slope. Sides lean in about 3 degrees, roof edges are chamfered. The earlier "elephant ear" pods were removed.
- Bugs fixed: the generic Panther-style rule was scaling the Challenger's whole turret and gun up 15 % (`turretPivot.scale.setScalar(1.15)`); a generic hull block drew a driver visor, bow-MG ball, deck slabs and two cylinders sized for another hull (the floating ball/cube and the grey drums); the lofted hull and turret had no texture coordinates, which smeared the camouflage into streaks (now box-projected UVs).
- Gun: trunnion moved back to suit the slope (barrel lengthened so the muzzle is still 11.55 m from the hull rear), barrel radius slimmed, shield and boot re-angled to the slope.
- Added the engine power entry (`challenger1: 1200`) so the slope-climb limit applies.

# Real Spring-Damper Suspension Implementation

## Changes Made

### 1. Replaced Fake Suspension with Real Physics-Based Suspension

**File:** `game.js`

**Function Replaced:** `applyFakeSuspension()` → `applyRealSuspension()`

### Key Features of New System:

#### Independent Wheel Physics
- Each wheel independently samples terrain height at its world position
- Each wheel has its own state: `positionY`, `velocity`, `compression`
- Wheels are initialized at terrain height on first call

#### Spring-Damper Physics
- **Spring constant (k):** 150 (stiff suspension)
- **Damping coefficient (c):** 25 (damped response)
- **Force calculation:** `F = -k * compression - c * velocity`
- Uses Euler integration for velocity and position updates

#### Hull Position Calculation
- Hull Y position = average of all wheel positions + rest height
- Rest height stored from `tank.trackY` property
- Tracks stay on ground, hull naturally sits above

#### Hull Rotation from Wheel Heights
- **Pitch:** Calculated from front wheels vs rear wheels height difference
- **Roll:** Calculated from left wheels vs right wheels height difference
- Wheels separated using midpoint of Z positions (front/rear) and X positions (left/right)
- Angles clamped to ±0.42 radians (±24°) for stability

### 2. Updated Function Calls

**Player Tank (line ~2870):**
```javascript
// Before:
alignTankToTerrain(player,dt);
applyFakeSuspension(player, speed, dt);

// After:
applyRealSuspension(player, speed, dt);
```

**Bot Tanks (line ~2758):**
```javascript
// Before:
alignTankToTerrain(bot,dt);
applyFakeSuspension(bot, bot.driveSpeed, dt);

// After:
applyRealSuspension(bot, bot.driveSpeed, dt);
```

### 3. Simplified alignTankToTerrain()

- Now only used for initial positioning
- Removed lerp/smoothing logic (real suspension handles dynamics)
- Direct assignment when dt=0 or first call

### 4. Removed All Fake Wobble Code

Removed from old system:
- `pitchWobble` and `pitchWobbleVelocity`
- `rollWobble` and `rollWobbleVelocity`
- `lastSpeed` and acceleration calculation
- `lastHullTurn` and turn acceleration
- Manual momentum-based wobble physics
- Speed-dependent influence factors

## How It Works

### Physics Loop (each frame):
1. For each wheel:
   - Transform local wheel position to world space
   - Sample terrain height at wheel position
   - Calculate compression = terrain height - wheel position
   - Apply spring force proportional to compression
   - Apply damping force proportional to velocity
   - Update wheel velocity and position

2. Calculate hull position:
   - Average all wheel Y positions
   - Add suspension rest height

3. Calculate hull rotation:
   - Separate wheels into front/rear and left/right groups
   - Calculate average height for each group
   - Compute pitch angle from wheelbase and height difference
   - Compute roll angle from track width and height difference
   - Clamp to maximum tilt limits

### Natural Behaviors:
- **Acceleration/Braking:** Front wheels compress/extend first, hull pitches naturally
- **Turning:** Outside wheels load up, inside wheels extend, hull rolls naturally
- **Bumps:** Individual wheels compress over bumps, hull follows smoothly
- **Terrain Following:** Tracks stay on ground, hull angles match terrain slope

## Benefits of Real Suspension

1. **Physically Accurate:** Uses real spring-damper equations
2. **Independent Wheels:** Each wheel responds to local terrain
3. **Natural Motion:** No manual wobble tuning needed
4. **Works with Terrain:** Automatically adapts to bumps and slopes
5. **Predictable:** Behavior follows from physics constants
6. **Cleaner Code:** Removed complex fake wobble logic

## Testing Notes

- Spring stiffness (k=150) provides firm but responsive suspension
- Damping (c=25) prevents excessive oscillation
- Rest height properly positions hull above wheels
- Pitch/roll angles naturally limited by wheel positions
- Works with all tank types (Tiger, Panther, Sturer Emil, IS-7)

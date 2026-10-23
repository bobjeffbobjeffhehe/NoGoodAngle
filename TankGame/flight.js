// Su-30SM flight dynamics, v2. Plain numbers only (no THREE, no allocation per step) so it is cheap, deterministic and
// can be tested headless. game.js feeds it the pilot's inputs and copies the resulting pose onto the aircraft mesh.
//
// Units: world-units (WU) and seconds. 1 WU/s = 7.5 km/h = 2.083 m/s, so the numbers are real-world numbers.
// Axes of the aircraft (same as the mesh): nose = +Z, up = +Y, pilot's LEFT = +X.
//
// What is modelled (and why it feels like a heavy jet and not a toy):
//   MASS & MOMENTUM   Mass = airframe + fuel + ordnance, and fuel burns off with engine power. Mass changes thrust/weight,
//                     the stall speed (heavier = faster), induced drag, the g limit and the moments of inertia (ordnance on
//                     the wings makes it roll slower). Linear AND angular velocity are states: nothing snaps to the stick.
//   AIR & MACH        Density falls with altitude (lift, drag, thrust and control power all drop: thin air = mushy
//                     controls, higher true stall speed). Speed of sound falls too: transonic drag rise and a nose-down
//                     "Mach tuck", and elevators/ailerons lose bite near Mach 1.
//   CONTROL LOCKUP    Control power grows with dynamic pressure at low speed (sloppy, slow) but saturates, while the
//                     airframe's own stability keeps growing, so at high speed the stick "stiffens": the g you can
//                     actually pull collapses (see nAvail) and roll rate falls. A steep dive from altitude is hard to
//                     pull out of, and past the speed limit the airframe breaks up.
//   STALL & SPIN      Lift peaks at alphaStall then collapses, drag soars, ailerons lose effect, roll damping REVERSES
//                     (autorotation) and the nose-yaw stability flips. Hold the stick back at low speed with any yaw/roll
//                     and the jet departs into a spin. Recovery: stick forward, rudder against the spin, ailerons
//                     neutral, wait for airspeed.
//   FLY-BY-WIRE LITE  Like the real jet there is a computer that auto-trims (centred stick = hold the flight path, banked
//                     or not) and clamps the commanded g. It does NOT protect against stall: the stick commands angle of
//                     attack, and enough of it at low speed stalls the airplane.
//   Fixed internal sub-steps => behaviour does not depend on the frame rate.
window.createFlightModel = function(opts){
  const C = Object.assign({
    gravity: 9.81/(7.5/3.6),   // WU/s^2
    mPerWU: 7.5/3.6,
    // ---- mass (kg) ----
    emptyKg: 18400, fuelCapKg: 9400, fuelFrac: 0.8, ordnanceKg: 1500, refKg: 26000,
    // ---- engines ----
    thrustMaxKgf: 24000,       // two AL-31FP at full afterburner
    thrustIdle: 0.04, thrustMil: 0.58, abThrottle: 0.7,   // thrust fractions; afterburner above this throttle
    spoolUp: 1.0, spoolDown: 0.6,
    // ---- reference aerodynamics (sea level, refKg) ----
    vMax: 172,                 // sea-level top speed at full afterburner (~1290 km/h). Altitude speed is NOT set here: it comes out of density, thrust lapse, ram and wave drag
    vStall: 30,                // 1 g stall speed at max lift (~225 km/h)
    vRotate: 33,               // elevators fully effective (~250 km/h)
    vCtl: 75,                  // dynamic-pressure reference for control power (~560 km/h)
    cdi: 5e-4, cdGear: 1.6e-4, cdBeta: 6e-4, cdPlate: 1.6e-3, cyBeta: 1.0,
    waveDrag: 1.0, waveDragSS: 0.35,   // transonic drag peak / supersonic plateau, as multiples of subsonic zero-lift drag
    ram: 0.9, thrustAlt: 0.7,         // engine ram gain per Mach, and how thrust lapses with density (rho^thrustAlt)
    machLimit: 2.35,                   // (no longer enforced: overspeed does not break the jet any more)
    // thrust vectoring (Su-30SM nozzles): +-15 deg, 28 deg/s, acting 6.5 m behind the centre of gravity
    tvcMax: 0.26, tvcRate: 0.5, tvcArm: 6.5, tvcK2: 7.4,
    // instructor (mouse-aim autopilot)
    insK: 0.9, insKphi: 2.2, insRollMax: 1.35,             // transonic drag multiplier added around Mach 1
    alphaStall: 0.45,          // alpha of max lift (rad, ~26 deg)
    // ---- flight computer (FBW-lite) ----
    stickAlpha: 0.55, stickAlphaNeg: 0.40,   // rad of alpha per unit stick on top of the auto-trim
    alphaTau: 0.30,
    nMax: 9, nMaxMassKg: 220000, nNeg: 3,    // g limit = min(nMax, nMaxMassKg/mass)
    // ---- moments (rad/s^2 at qc=1, mass=ref) ----
    pitchBreak: 2.2, pitchAe: 1.8, aSlew: 0.7, pitchKa: 3.0, pitchKq: 2.0, pitchDamp: 2.5, maxPitchRate: 0.8, qCapCobra: 1.3, qCapP: 3.0,
    rollA: 3.0, rollDamp: 2.2, rollBeta: 0.6, rollC3: 0.45, qCapR: 1.6,
    yawA: 1.4, yawN: 3.0, yawDamp: 2.0, yawPR: 0.5,
    tuck: 0.3, gammaK: 4.0,
    // ---- limits ----
    vNe: 187,                  // (no longer enforced; kept as a reference speed, ~1400 km/h sea-level equivalent)
    // ---- ground ----
    groundPitchMax: 0.21, steerLow: 0.5, steerHigh: 0.14, rotateRate: 0.5, groundSettle: 0.04,
    rollingFriction: 0.12, brakeDecel: 2.2, tireGrip: 10,
    gearDropUp: 1.0, gearDropDown: 2.32, noseGearZ: 7.4, mainGearZ: 0.1,
    crashSink: 9,
    halfExtent: Infinity, maxStep: 1/120,
    terrainHeightAt: (x,z)=>0
  }, opts||{});

  const G = C.gravity;
  const clamp = (v,a,b)=>v<a?a:v>b?b:v;
  const sstep = (x,a,b)=>{ const t=clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); };
  const lerp = (a,b,t)=>a+(b-a)*t;
  const aS = C.alphaStall;
  const aOfCl = c => Math.asin(clamp(c,-1,1))*2*aS/Math.PI;
  // Lift coefficient (1 = max): sine rise to the stall, then a collapse to ~half, then flat-plate fall-off towards 90 deg.
  function CL(a){
    const x=Math.abs(a), s=a<0?-1:1;
    if(x<=aS) return s*Math.sin(x*Math.PI/(2*aS));
    return s*(1-0.65*sstep(x,aS,aS+0.25))*clamp(1-(x-1.0)/0.57,0,1);
  }
  const thrustFrac = t => t<=C.abThrottle ? C.thrustIdle+(C.thrustMil-C.thrustIdle)*(t/C.abThrottle)
                                          : C.thrustMil+(1-C.thrustMil)*((t-C.abThrottle)/(1-C.abThrottle));
  const aSoundWU = hm => 20.05*Math.sqrt(Math.max(216.65,288.15-0.0065*hm))/C.mPerWU;
  const riseOf = M => 1+C.waveDrag*sstep(M,0.88,1.12)-(C.waveDrag-C.waveDragSS)*sstep(M,1.25,1.9);
  const tAccRef = C.thrustMaxKgf/C.refKg*G;
  const cd0 = tAccRef*(1+C.ram*C.vMax/aSoundWU(0))/(C.vMax*C.vMax*riseOf(C.vMax/aSoundWU(0)));  // calibrated so that vMax is the sea-level top speed

  const s = {
    x:0,y:0,z:0, qx:0,qy:0,qz:0,qw:1, vx:0,vy:0,vz:0,
    p:0, q:0, r:0,                                   // roll (right +), pitch (nose up +), yaw (nose left +) rates, rad/s
    engine:0, fuel:0, mass:0,
    gRef:0, gHold:false, aCmd:0, aI:0, alpha:0, beta:0, nz:1, qfe:1, thrustG:0, tvcP:0, tvcY:0, speed:0, agl:0, mach:0, rho:1, nAvail:9, stall:0, qdyn:0,
    onGround:true, crashed:false, failReason:'', gYaw:0, gPitch:0, gRoll:0
  };
  const fuelFlow = e => 0.8+11*Math.pow(e,1.6);       // kg/s

  function qFromEuler(ex,ey,ez){
    const c1=Math.cos(ex/2),c2=Math.cos(ey/2),c3=Math.cos(ez/2),s1=Math.sin(ex/2),s2=Math.sin(ey/2),s3=Math.sin(ez/2);
    s.qx=s1*c2*c3+c1*s2*s3; s.qy=c1*s2*c3-s1*c2*s3; s.qz=c1*c2*s3-s1*s2*c3; s.qw=c1*c2*c3+s1*s2*s3;
  }
  function eulerFromQ(){
    const x=s.qx,y=s.qy,z=s.qz,w=s.qw, m23=2*(y*z-x*w);
    s.gPitch=-Math.asin(clamp(-m23,-1,1));
    if(Math.abs(m23)<0.9999){ s.gYaw=Math.atan2(2*(x*z+y*w),1-2*(x*x+y*y)); s.gRoll=Math.atan2(2*(x*y+z*w),1-2*(x*x+z*z)); }
    else { s.gYaw=Math.atan2(-2*(x*z-y*w),1-2*(y*y+z*z)); s.gRoll=0; }
  }
  const ax={lx:0,ly:0,lz:0,ux:0,uy:0,uz:0,nx:0,ny:0,nz:0};
  function axes(){
    const x=s.qx,y=s.qy,z=s.qz,w=s.qw;
    ax.lx=1-2*(y*y+z*z); ax.ly=2*(x*y+z*w);   ax.lz=2*(x*z-y*w);
    ax.ux=2*(x*y-z*w);   ax.uy=1-2*(x*x+z*z); ax.uz=2*(y*z+x*w);
    ax.nx=2*(x*z+y*w);   ax.ny=2*(y*z-x*w);   ax.nz=1-2*(x*x+y*y);
  }
  function rotateBody(wx,wy,wz,h){
    const m=Math.sqrt(wx*wx+wy*wy+wz*wz), a=m*h; if(a<1e-9) return;
    const sn=Math.sin(a/2)/m, bx=wx*sn, by=wy*sn, bz=wz*sn, bw=Math.cos(a/2);
    const px=s.qx,py=s.qy,pz=s.qz,pw=s.qw;
    s.qx=px*bw+pw*bx+py*bz-pz*by; s.qy=py*bw+pw*by+pz*bx-px*bz;
    s.qz=pz*bw+pw*bz+px*by-py*bx; s.qw=pw*bw-px*bx-py*by-pz*bz;
    const l=1/Math.sqrt(s.qx*s.qx+s.qy*s.qy+s.qz*s.qz+s.qw*s.qw); s.qx*=l;s.qy*=l;s.qz*=l;s.qw*=l;
  }
  const drop = gear => lerp(C.gearDropUp,C.gearDropDown,gear);
  const groundY = (x,z,gear,upY) => C.terrainHeightAt(x,z)+drop(gear)*Math.max(upY,0.4);

  function reset(x,z,yaw,gear){
    s.x=x; s.z=z; s.vx=s.vy=s.vz=0; s.p=s.q=s.r=0; s.engine=0; s.alpha=s.beta=0; s.nz=1; s.stall=0;
    s.fuel=C.fuelFrac*C.fuelCapKg; s.mass=C.emptyKg+C.ordnanceKg+s.fuel;
    s.crashed=false; s.failReason=''; s.gHold=false; s.aCmd=0; s.aI=0; s.onGround=true; s.gYaw=yaw||0; s.gPitch=0; s.gRoll=0;
    qFromEuler(0,s.gYaw,0);
    s.y=groundY(x,z,gear===undefined?1:gear,1);
  }

  // inp: {sx,sy (-1..1, already shaped), rudder (-1..1, +1 = nose left), throttle 0..1, gear 0..1, brake bool,
  //       cobra bool (post-stall manual law: no alpha/g limiter, auto-trim off, sy is a raw pitch-rate command)}
  function sub(h,inp){
    const V=Math.sqrt(s.vx*s.vx+s.vy*s.vy+s.vz*s.vz), Vh=Math.max(V,1);
    axes();
    const vN=s.vx*ax.nx+s.vy*ax.ny+s.vz*ax.nz, vU=s.vx*ax.ux+s.vy*ax.uy+s.vz*ax.uz, vL=s.vx*ax.lx+s.vy*ax.ly+s.vz*ax.lz;
    const alpha = V>2 ? clamp(Math.atan2(-vU,vN),-1.5,1.5) : 0;
    const beta  = V>2 ? clamp(Math.atan2(vL,vN),-1.2,1.2) : 0;
    const gear=inp.gear;

    // ---- atmosphere & mass ----
    const hm=Math.max(0,s.y*C.mPerWU), rho=Math.exp(-hm/8500), M=V/aSoundWU(hm);
    s.mass=C.emptyKg+C.ordnanceKg+s.fuel;
    const K=C.refKg/s.mass, mr=s.mass/C.refKg;
    const qf=rho*(V/C.vStall)*(V/C.vStall), qfe=Math.max(qf*K,0.02), qc=rho*(V/C.vCtl)*(V/C.vCtl), vD=(V/C.vCtl)*rho;
    const ss=sstep(Math.abs(alpha),aS,aS+0.12), cl=CL(alpha);
    s.qfe=qfe; s.alpha=alpha; s.beta=beta; s.rho=rho; s.mach=M; s.stall=ss; s.qdyn=rho*V*V; s.speed=V;

    // ---- engines & fuel ----
    const eTarget=s.fuel>0?thrustFrac(inp.throttle):0;
    s.engine += (eTarget-s.engine)*(1-Math.exp(-h/(eTarget>s.engine?C.spoolUp:C.spoolDown)));
    s.fuel=Math.max(0,s.fuel-fuelFlow(s.engine)*h*(s.fuel>0?1:0));
    const thrust=s.engine*(C.thrustMaxKgf/s.mass)*G*Math.pow(rho,C.thrustAlt)*(1+C.ram*M)*(1-0.85*sstep(M,1.7,2.3));   // ram gain, then the inlet/engine temperature limit above ~Mach 2   // ram effect: more thrust at speed
    s.thrustG=thrust/G;

    // ---- aerodynamic accelerations ----
    // No structural failure any more (over-G / overspeed no longer destroy the jet). Instead lift simply saturates at
    // 1.5x the airframe's g rating, which also keeps a full-stick pull at high speed from producing absurd accelerations.
    const nCap=1.5*Math.min(C.nMax,C.nMaxMassKg/s.mass);
    const lift=clamp(G*K*qf*cl,-nCap*G,nCap*G);
    const sa=Math.sin(alpha);
    const cd=cd0*riseOf(M)+C.cdi*cl*cl+C.cdGear*gear+C.cdBeta*beta*beta+C.cdPlate*sa*sa;
    const drag=Math.min(rho*cd*V*V*K, V/h*0.5);
    const side=-beta*G*K*qf*C.cyBeta;
    const accx=lift*ax.ux+thrust*ax.nx+side*ax.lx-drag*s.vx/Vh;
    let   accy=lift*ax.uy+thrust*ax.ny+side*ax.ly-drag*s.vy/Vh-G;
    const accz=lift*ax.uz+thrust*ax.nz+side*ax.lz-drag*s.vz/Vh;
    s.nz=lift/G;

    // ---- load limits ----
    const nStruct=Math.min(C.nMax,C.nMaxMassKg/s.mass);
    // control lockup: past ~700 km/h-equivalent the stick stiffens and the g you can pull collapses; worse near Mach 1
    const nAvail=nStruct*(1-0.7*sstep(qc,1.7,4.5))*(1-0.35*sstep(M,0.9,1.2));
    s.nAvail=nAvail;
    // (over-G / overspeed structural failures removed: the jet can no longer break apart in flight)

    let tvcFP=0, tvcFY=0;
    if(!s.onGround){
      // ---- control power: grows with dynamic pressure, saturates, and fades near Mach 1 / when stalled ----
      const machCtl=1-0.45*sstep(M,0.9,1.15);
      // (small floor: a falling, stalled jet still has some flow over its surfaces, so a spin is recoverable)
      const cpP=Math.min(Math.max(qc,0.35),C.qCapP)*machCtl*(1-0.6*ss), cpR=Math.min(Math.max(qc,0.3),C.qCapR)*machCtl, cpY=Math.min(Math.max(qc,0.3),2.5);
      const kIp=0.65+0.35*mr+C.ordnanceKg*0.0001, kIq=0.7+0.3*mr;

      // ---- flight computer: auto-trim (hold flight path, bank-compensated) + stick = angle of attack, g-clamped ----
      // Cobra mode (inp.cobra) skips all of this: no auto-trim, no alpha target, no g-limiter. sy (E/Q, fed in by
      // the caller) becomes a raw pitch-RATE command straight to the elevator, the same way inp.rudder already
      // drives yaw rate below - which is what lets the nose be hauled past alphaStall and held there on command
      // (Pugachev's Cobra, kulbit) instead of the computer refusing to go there.
      const sy=inp.sy;
      let qCmd=0, ffMoment=0, de=0, tuck=0, brk=0;
      if(inp.cobra){
        s.gHold=false; s.aI=0; s.aCmd=alpha;        // so the normal law re-syncs cleanly the moment cobra is released
        qCmd=clamp(sy,-1,1)*C.qCapCobra;
        ffMoment=C.pitchKa*qc*(alpha-0.05)*(1-0.6*ss);
        if(cpP>0.02) de=clamp(ffMoment/(C.pitchAe*cpP)+C.pitchKq*(clamp(qCmd,-C.qCapCobra,C.qCapCobra)-s.q),-1,1);
        tuck=-C.tuck*sstep(M,0.95,1.1)*(1-sstep(M,1.3,1.6))*qc;
        brk=C.pitchBreak*ss*(0.4+qc)*(alpha>=0?1:-1);
      } else {
        const cosG=V>1?Math.hypot(s.vx,s.vz)/V:1;
        const w=Math.hypot(ax.uy,ax.ly), cosPhi=w>0.01?ax.uy/w:1;
        const comp=Math.min(1/Math.max(cosPhi,1e-4),2.2)*sstep(cosPhi,-0.1,0.3)*sstep(w,0.12,0.4);
        // flight-path hold: lift needed = weight component, minus what the engine's own vertical thrust already provides,
        // plus a slow correction towards the path angle the pilot last left it at (so it does not drift while you fly hands-off)
        const gamma=V>1?Math.asin(clamp(s.vy/V,-1,1)):0;
        if(Math.abs(sy)>0.04 || !s.gHold){ s.gRef=gamma; s.gHold=true; }
        const upright=sstep(cosPhi,0,0.5);
        const nHold=cosG*comp-(thrust/G)*Math.sin(alpha)+upright*clamp(C.gammaK*(s.gRef-gamma),-0.6,0.6);
        const aHold=clamp(aOfCl(nHold/qfe),-0.5*aS,0.9*aS);
        let aTgt;
        if(inp.nDem===inp.nDem && inp.nDem!==undefined){
          // instructor asks for a total load factor: choose the alpha that makes it. With protection on it never asks for more
          // than ~95% of max lift; without, it keeps hauling past the limit (so you CAN stall it)
          const cr=inp.nDem/qfe;
          aTgt=cr>=0?aOfCl(Math.min(cr,0.97)):-aOfCl(Math.min(-cr,0.97));
          if(!inp.protect && cr>0.97) aTgt+=clamp(cr-0.97,0,1)*0.35;
        } else aTgt=aHold+(sy>=0?sy*C.stickAlpha:sy*C.stickAlphaNeg);
        // g-limiter: only bites where the airframe COULD exceed the limit (fast). Slow, where lift runs out first, the
        // computer does not stop you, so that is where you can pull the jet into a stall.
        const gW=sstep(qfe,0.5*nAvail,nAvail);
        aTgt=Math.min(aTgt,lerp(aS+0.35,aOfCl(Math.min(0.97,nAvail/qfe)),gW));
        aTgt=Math.max(aTgt,-lerp(0.35,aOfCl(Math.min(0.97,C.nNeg/qfe)),sstep(qfe,0.5*C.nNeg,C.nNeg)));
        // the computer eases the commanded alpha in (a rate limit), so a yank on the stick loads the airframe progressively
        s.aCmd+=clamp(aTgt-s.aCmd,-C.aSlew*h*1.6,C.aSlew*h);
        if(s.onGround) s.aCmd=alpha;
        aTgt=s.aCmd;
        const qv=(accx*ax.ux+accy*ax.uy+accz*ax.uz)/Math.max(V,12);
        // small integral term: at high dynamic pressure a fraction of a degree of alpha is half a g, so the loop must null it
        if(ss<0.2) s.aI=clamp(s.aI+(aTgt-alpha)*0.8*h,-0.08,0.08); else s.aI*=1-2*h;
        qCmd=clamp((aTgt+s.aI-alpha)/C.alphaTau,-1,1)+qv;
        ffMoment=C.pitchKa*qc*(alpha-0.05)*(1-0.6*ss);          // feed-forward against the airframe's own stability
        if(cpP>0.02) de=clamp(ffMoment/(C.pitchAe*cpP)+C.pitchKq*(clamp(qCmd,-C.maxPitchRate,C.maxPitchRate)-s.q),-1,1);
        tuck=-C.tuck*sstep(M,0.95,1.1)*(1-sstep(M,1.3,1.6))*qc;     // transonic nose-down trim change
        brk=C.pitchBreak*ss*(0.4+qc)*(alpha>=0?1:-1);                   // stall pitch-break: the nose falls through
      }
      // thrust vectoring: the nozzles supply whatever pitch moment the elevators cannot (slow, thin air, stalled),
      // as a real force (reduces/adds lift) and a real moment about the CG
      const qCap=inp.cobra?C.qCapCobra:C.maxPitchRate;
      const errQ=clamp(qCmd,-qCap,qCap)-s.q, thrSI=thrust*C.mPerWU, capT=thrSI*C.tvcArm/C.tvcK2;
      let tvcPT=0, tvcYT=0;
      if(inp.tvc!==false && capT>0.05){
        let resid=C.pitchKq*C.pitchAe*errQ-(C.pitchAe*cpP*de-ffMoment);
        if(resid*errQ<0) resid=0;
        tvcPT=clamp(Math.asin(clamp(resid/capT,-1,1)),-C.tvcMax,C.tvcMax);
        let ym=C.yawA*inp.rudder-C.yawA*cpY*(1-0.5*ss)*inp.rudder-1.5*s.r*ss;
        tvcYT=clamp(Math.asin(clamp(ym/capT,-1,1)),-C.tvcMax,C.tvcMax);
      }
      s.tvcP+=clamp(tvcPT-s.tvcP,-C.tvcRate*h,C.tvcRate*h);
      s.tvcY+=clamp(tvcYT-s.tvcY,-C.tvcRate*h,C.tvcRate*h);
      const tvcMq=capT*Math.sin(s.tvcP), tvcMr=capT*Math.sin(s.tvcY);
      const qdot=(C.pitchAe*cpP*de-ffMoment-brk-C.pitchDamp*vD*s.q-0.4*s.q+tuck+tvcMq)/kIq;
      s.q+=qdot*h;
      tvcFP=thrust*Math.sin(s.tvcP); tvcFY=thrust*Math.sin(s.tvcY);

      // ---- roll: aileron moment vs damping; damping REVERSES in a stall (autorotation) ----
      const pdot=(C.rollA*cpR*(1-0.8*ss)*inp.sx - C.rollDamp*vD*s.p*(1-2.4*ss) - 0.3*s.p
                  - C.rollC3*ss*s.p*Math.abs(s.p) + C.rollBeta*qc*beta*(1-1.5*ss))/kIp;
      s.p+=pdot*h;
      // ---- yaw: rudder, weathervane stability (which flips in a stall), and roll/yaw coupling ----
      const rdot=(C.yawA*cpY*inp.rudder*(1-0.5*ss) + C.yawN*qc*beta*(1-1.8*ss) - C.yawDamp*vD*s.r - 0.4*s.r + C.yawPR*ss*s.p + tvcMr)/kIq;
      s.r+=rdot*h;
      s.p=clamp(s.p,-6,6); s.q=clamp(s.q,-3,3); s.r=clamp(s.r,-3,3);
      rotateBody(-s.q,s.r,s.p,h);
    }

    if(s.onGround){ s.tvcP=0; s.tvcY=0; }
    // thrust-vectoring force: nose-up demand pushes the tail DOWN (force along -up), nose-left pushes it right (-left)
    s.vx+=(accx-tvcFP*ax.ux-tvcFY*ax.lx)*h; s.vy+=(accy-tvcFP*ax.uy-tvcFY*ax.ly)*h; s.vz+=(accz-tvcFP*ax.uz-tvcFY*ax.lz)*h;

    if(s.onGround){
      const fx=Math.sin(s.gYaw), fz=Math.cos(s.gYaw);
      let vA=s.vx*fx+s.vz*fz, vS=s.vx*fz-s.vz*fx;
      const onTyres=s.y-groundY(s.x,s.z,gear,ax.uy)<0.05;
      if(onTyres){
        vS*=Math.exp(-C.tireGrip*h);
        const dec=(gear>0.5?C.rollingFriction:1.0)+(inp.brake?C.brakeDecel:0);
        vA=Math.max(0,vA-dec*h);
      }
      s.vx=vA*fx+vS*fz; s.vz=vA*fz-vS*fx;
      const steer=inp.rudder*lerp(C.steerLow,C.steerHigh,clamp(V/40,0,1))*clamp(V/4,0,1);
      s.gYaw+=steer*h;
      const nxp=s.x+fx*C.noseGearZ, nzp=s.z+fz*C.noseGearZ, mxp=s.x+fx*C.mainGearZ, mzp=s.z+fz*C.mainGearZ;
      const thetaT=Math.atan2(C.terrainHeightAt(nxp,nzp)-C.terrainHeightAt(mxp,mzp),C.noseGearZ-C.mainGearZ);
      // Elevator bites with speed squared (rotation speed rises with weight) and the attitude HOLDS when released.
      const vRot=C.vRotate/Math.sqrt(K), eff=clamp((V/vRot)*(V/vRot),0,1.4);
      if(inp.sy>0.03)       s.gPitch+=inp.sy*C.rotateRate*eff*h;
      else if(inp.sy<-0.03) s.gPitch+=inp.sy*0.35*h;
      s.gPitch-=(V<0.5*vRot?0.3:C.groundSettle)*h;
      s.gPitch=clamp(s.gPitch,thetaT,thetaT+C.groundPitchMax);
      s.gRoll+=clamp(-s.gRoll,-1.5*h,1.5*h);
      qFromEuler(-s.gPitch,s.gYaw,s.gRoll);
      s.p=0; s.q=0; s.r=steer;
    }

    s.x+=s.vx*h; s.y+=s.vy*h; s.z+=s.vz*h;
    if(Math.abs(s.x)>C.halfExtent){ s.x=Math.sign(s.x)*C.halfExtent; s.vx=0; }
    if(Math.abs(s.z)>C.halfExtent){ s.z=Math.sign(s.z)*C.halfExtent; s.vz=0; }

    // ---- ground contact ----
    axes();
    const gy=groundY(s.x,s.z,gear,ax.uy), clear=s.y-gy;
    if(clear<=0 || (s.onGround && clear<0.35 && s.vy<=0.05)){
      if(!s.onGround){
        const e=2, dhx=(C.terrainHeightAt(s.x+e,s.z)-C.terrainHeightAt(s.x-e,s.z))/(2*e), dhz=(C.terrainHeightAt(s.x,s.z+e)-C.terrainHeightAt(s.x,s.z-e))/(2*e);
        const nl=Math.hypot(dhx,1,dhz), into=-(s.vx*-dhx+s.vy+s.vz*-dhz)/nl;
        eulerFromQ();
        const limit=(gear<0.9||Math.abs(s.gRoll)>0.5||Math.abs(s.gPitch)>0.45)?C.crashSink*0.55:C.crashSink;
        if(into>limit && !s.crashed){ s.crashed=true; s.failReason='CRASHED'; }
        s.onGround=true; s.p=s.q=s.r=0;
      }
      s.y=gy; if(s.vy<0) s.vy=0;
    } else if(s.onGround && clear>=0.35){
      s.onGround=false; s.p=s.q=s.r=0;
    }
    s.agl=Math.max(0,clear);
  }

  // ---------------- instructor: mouse-aim autopilot ----------------
  // Steers the flight path towards the aim direction by (1) rolling the lift vector round to where it is needed and
  // (2) pulling just the load factor that gives the required turn. So it always BANKS into a turn (never skids round),
  // pulls harder the bigger the error, gives way to what the airframe can do, and holds the flight path when the
  // cursor is straight ahead. Stall recovery (if protection is on): unload, stop rolling, rudder against the yaw.
  const ins={sx:0,nDem:NaN,sy:0,rudder:0,protect:true,recovering:false,pushing:false,rollSide:0};
  function instruct(aimYaw,aimPitch,protect){
    axes();
    const V=s.speed, cp=Math.cos(aimPitch);
    const Dx=cp*Math.sin(aimYaw), Dy=Math.sin(aimPitch), Dz=cp*Math.cos(aimYaw);
    ins.protect=protect; ins.nDem=NaN; ins.sy=0; ins.sx=0; ins.rudder=0;
    const pitchNow=Math.asin(clamp(ax.ny,-1,1));
    if(s.onGround){
      // taxi / takeoff: only the rudder pedals (A/D, fed in separately by the caller) steer on the ground -
      // the mouse no longer turns the nose wheel. Raising the cursor above the horizon at rotation speed
      // still lifts the nose for takeoff.
      const vRot=C.vRotate/Math.sqrt(C.refKg/s.mass);
      if(V>0.92*vRot) ins.sy=clamp((aimPitch-pitchNow)*3,-1,1);
      ins.recovering=false; ins.pushing=false;
      return ins;
    }
    // stall recovery
    if(protect){
      if(s.stall>0.3) ins.recovering=true;
      else if(ins.recovering && s.stall<0.05 && V>1.1*C.vStall*Math.sqrt(s.mass/C.refKg)) ins.recovering=false;
      if(ins.recovering){ ins.nDem=0; ins.sx=0; ins.rudder=clamp(-1.5*s.r,-1,1); return ins; }
    } else ins.recovering=false;
    let ux,uy,uz;
    if(V>8){ ux=s.vx/V; uy=s.vy/V; uz=s.vz/V; } else { ux=ax.nx; uy=ax.ny; uz=ax.nz; }
    const dot=clamp(Dx*ux+Dy*uy+Dz*uz,-1,1), eps=Math.acos(dot);
    let px=Dx-dot*ux, py=Dy-dot*uy, pz=Dz-dot*uz, pl=Math.sqrt(px*px+py*py+pz*pz);
    if(pl<1e-4){ px=ax.ux; py=ax.uy; pz=ax.uz; pl=1; }
    px/=pl; py/=pl; pz/=pl;
    const nLim=(protect?Math.min(s.nAvail*0.95,s.qfe*0.97):s.nAvail*0.95)*0.9;
    const Vq=Math.max(V,15), wCap=G*Math.sqrt(Math.max(nLim*nLim-1,0.1))/Vq;
    const wc=Math.min(C.insK*eps,wCap);
    // lift vector needed: turn component + cancel the part of gravity normal to the path
    const gpx=-uy*ux, gpy=1-uy*uy, gpz=-uy*uz;
    let lx=wc*Vq*px+G*gpx, ly=wc*Vq*py+G*gpy, lz=wc*Vq*pz+G*gpz;
    let bl=lx*ax.lx+ly*ax.ly+lz*ax.lz, bu=lx*ax.ux+ly*ax.uy+lz*ax.uz;
    // A "go down" request that is mostly in the vertical plane is flown by PUSHING (limited negative g).
    // Only when the needed lift vector points AWAY from the jet's up axis (bu<0): with bu>0 the jet is already facing the
    // way it needs to pull (e.g. 90 deg banked in a hard turn with the target a little below the path), and treating a
    // slightly-negative ly there as "push" flipped the roll command by ~170 deg and dropped 6 g to ~1 g mid-turn.
    // A latch (looser thresholds to stay in push, tighter to enter) stops it chattering at the boundary.
    const lm0=Math.hypot(bl,bu);
    const push = eps<1.3 && ly<(ins.pushing?0.1*G:0) && bu<(ins.pushing?0.1*lm0:-0.05*lm0) && Math.abs(bl)<(ins.pushing?0.55:0.4)*lm0;
    // push and pull negate bl/bu below (opposite bank-direction conventions for the same physical roll), so a
    // rollSide latched under one no longer means anything under the other. Without this, flipping push state at a
    // moment phiErr is already near +-180 deg could force the stale side - i.e. the roll direction from the WRONG
    // convention - rolling the jet the long way around instead of the short way into the turn it was already in.
    if(push!==ins.pushing) ins.rollSide=0;
    ins.pushing=push;
    if(push){
      // Same cap the pull above uses, but against the airframe's (much lower) negative-g limit, so the push
      // actually scales with how hard the stick is asking for down instead of flattening out around -0.5g.
      const nLimNeg=(protect?Math.min(C.nNeg*0.95,s.qfe*0.97):C.nNeg*0.95)*0.9;
      const wCapNeg=G*Math.sqrt(Math.max(nLimNeg*nLimNeg-1,0.1))/Vq;
      const wp=Math.min(wc,wCapNeg);
      lx=wp*Vq*px+G*gpx; ly=wp*Vq*py+G*gpy; lz=wp*Vq*pz+G*gpz;
    } else {
      // Otherwise the lift vector keeps a floor on its vertical part (never turn by diving flat-out into the ground):
      // half the weight normally, more when close to the ground or when the path points at it (ground-collision guard).
      const tHit=s.agl/Math.max(-s.vy,0.5);
      const gc=sstep(6-tHit,0,3), low=1-sstep(s.agl,60,400);
      const yFloor=G*Math.min(1.5,0.5+0.8*gc+0.3*low);
      if(ly<yFloor){ ly=yFloor; if(gc>0.05){ lx*=1-gc; lz*=1-gc; } }
    }
    const lmag=Math.sqrt(lx*lx+ly*ly+lz*lz);
    bl=lx*ax.lx+ly*ax.ly+lz*ax.lz; bu=lx*ax.ux+ly*ax.uy+lz*ax.uz;
    if(push){ bl=-bl; bu=-bu; }
    let phiErr=Math.atan2(bl,bu);                           // + : the needed force lies to the left of the up axis
    // When the needed force is nearly opposite the up axis (|phiErr| near 180 deg) the sign of a tiny number picks the
    // roll direction and it can dither frame to frame. Remember which way we were rolling and stick with it there.
    if(Math.abs(phiErr)<2.0) ins.rollSide=phiErr<0?-1:1;
    else if(Math.abs(phiErr)>2.5 && ins.rollSide && Math.sign(phiErr)!==ins.rollSide) phiErr=ins.rollSide*Math.abs(phiErr);
    const pc=-clamp(C.insKphi*phiErr,-C.insRollMax,C.insRollMax);
    ins.sx=clamp(1.5*(pc-0.7*s.p),-1,1);
    const align=sstep(Math.cos(phiErr),0.15,0.85), gmag=Math.sqrt(gpx*gpx+gpy*gpy+gpz*gpz);
    let nWant=(push?-1:1)*align*(lmag/G)+(1-align)*gmag;   // roll first, then pull (or push)
    nWant-=s.thrustG*Math.sin(s.alpha);                    // the engine's own vertical thrust component is lift we need not make
    ins.nDem=nWant;
    return ins;
  }

  function step(dt,inp){
    if(dt<=0) return s;
    dt=Math.min(dt,0.1);
    const n=Math.ceil(dt/C.maxStep), h=dt/n;
    for(let i=0;i<n;i++) sub(h,inp);
    return s;
  }
  return {state:s,step,reset,instruct,config:C};
};

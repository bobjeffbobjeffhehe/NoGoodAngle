// Airport map (v2): a huge 6.4 km battlefield built to read well from the air as well as from a tank.
//   * two full airfields, one per team: runway, parallel taxiway, apron, hangars, tower, terminal, fuel farm.
//     Teams spawn on their own runway and face the enemy field (see `spawnSlots`).
//   * giant lakes and meandering rivers, rolling plains, patchwork farmland with villages, big forests,
//     open steppe, a desert corner and a mountain range with snow caps.
//   * a highway between the two airfields and dirt roads to the villages.
// Detail is deliberately light: terrain colours, merged building geometry and instanced trees. The ground
// and the trees use the shared LOD helpers (lod.js) so the whole thing stays cheap.
window.createAirportMap = function(scene, groundSize){
  const THREE = window.THREE;
  const G = groundSize, HALF = G/2, K = G/6400;      // everything below is authored for a 6400 m map and scaled by K
  // Detail budget: the terrain grid, tree grid and minimap would grow with the AREA (K squared) if left alone, which is what makes a
  // very large map slow to build and heavy on memory. Past the 9.6 km size they grow with the SIDE length instead (cells get a bit coarser,
  // tree spacing widens while the tree density is kept), and mountains get taller so they still read as mountains from the air.
  const BIG = Math.sqrt(Math.max(1, G/9600));
  let seed = 551377;
  const rnd = () => { seed = (seed*1664525 + 1013904223) >>> 0; return seed/4294967296; };
  const rr = (a,b) => a + rnd()*(b-a);
  const ri = (a,b) => Math.floor(rr(a,b+1));
  const pick = a => a[Math.floor(rnd()*a.length)];
  const clamp = (v,a,b) => v<a?a:v>b?b:v;
  const lerp = (a,b,t) => a+(b-a)*t;
  const sstep = (x,a,b) => { const t = clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); };
  const ih = (x,z) => { let h = Math.imul(x|0,374761393) ^ Math.imul(z|0,668265263); h = Math.imul(h ^ (h>>>13),1274126177); return ((h ^ (h>>>16))>>>0)/4294967296; };
  function vnoise(x,z){
    const xi=Math.floor(x), zi=Math.floor(z), fx=x-xi, fz=z-zi, u=fx*fx*(3-2*fx), v=fz*fz*(3-2*fz);
    const a=ih(xi,zi), b=ih(xi+1,zi), c=ih(xi,zi+1), d=ih(xi+1,zi+1);
    return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;
  }
  function fbm(x,z,o){ o=o||4; let s=0,a=0.5,n=0,f=1; for(let i=0;i<o;i++){ s+=a*vnoise(x*f+i*17.3,z*f-i*9.1); n+=a; a*=0.5; f*=2.03; } return s/n; }
  function ridged(x,z,o){ o=o||4; let s=0,a=0.5,n=0,f=1; for(let i=0;i<o;i++){ const v=1-Math.abs(2*vnoise(x*f+i*7.7,z*f+i*3.1)-1); s+=a*v*v; n+=a; a*=0.5; f*=2.1; } return s/n; }
  function distPoly(pts,x,z){
    let best=1e18;
    for(let i=0;i<pts.length-1;i++){
      const ax=pts[i][0], az=pts[i][1], dx=pts[i+1][0]-ax, dz=pts[i+1][1]-az;
      const t=clamp(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz),0,1), ex=x-(ax+dx*t), ez=z-(az+dz*t), d2=ex*ex+ez*ez;
      if(d2<best) best=d2;
    }
    return Math.sqrt(best);
  }
  const HEX = h => [(h>>16&255)/255,(h>>8&255)/255,(h&255)/255];
  const mix3 = (a,b,t) => [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];

  // ===================================================================================
  //  LAYOUT
  // ===================================================================================
  // Airbase frame: `a` runs along the runway towards the enemy, `b` is sideways (the apron side).
  const RWY_LEN=1200, RWY_W=50, TWY_B=95, TWY_W=22;
  const PAD={a0:-740,a1:740,b0:-130,b1:345};
  const bases=[
    {team:'blue', x:-260*K, z:-2250*K, s: 1, yaw:0},
    {team:'red',  x: 260*K, z: 2250*K, s:-1, yaw:Math.PI}
  ];
  const bW = (bs,a,b) => ({x:bs.x+bs.s*b, z:bs.z+bs.s*a});                 // base-local -> world
  const bL = (bs,x,z) => ({a:(z-bs.z)*bs.s, b:(x-bs.x)*bs.s});             // world -> base-local
  function padWeight(x,z){
    let w=0;
    for(const bs of bases){
      const p=bL(bs,x,z), da=Math.max(PAD.a0-p.a,0,p.a-PAD.a1), db=Math.max(PAD.b0-p.b,0,p.b-PAD.b1);
      const f=1-sstep(Math.hypot(da,db),0,150); if(f>w) w=f;
    }
    return w;
  }

  // ---------- hills, mountains ----------
  const hills=[];
  for(let i=0,t=0;i<Math.round(30*K*K) && t<1500;t++){
    const x=rr(-HALF+350,HALF-350), z=rr(-HALF+350,HALF-350);
    if(bases.some(b=>Math.hypot(x-b.x,z-b.z)<1100*K)) continue;
    hills.push({x,z,rx:rr(280,720)*K,rz:rr(280,720)*K,h:rr(7,32)}); i++;
  }
  const ridgeLine=[[-3000,-2900],[-2850,-1500],[-3000,-200],[-2800,1300],[-3000,2900]].map(p=>[p[0]*K,p[1]*K]);
  const massifs=[{x:2700*K,z:-2700*K,r:850*K,h:1.0},{x:2750*K,z:2500*K,r:760*K,h:0.78},{x:-300*K,z:-3000*K,r:700*K,h:0.5}];
  function mountainAmt(x,z){
    let keep=1-Math.exp(-Math.pow(distPoly(ridgeLine,x,z)/(620*K),2));
    for(const m of massifs){ const r=Math.hypot(x-m.x,z-m.z)/m.r; keep*=1-m.h*Math.exp(-r*r*1.4); }
    return 1-keep;
  }
  function rawBase(x,z){
    let y=26+9*(fbm(x/1500,z/1500,3)-0.5)*2+3*(fbm(x/300+9,z/300,3)-0.5)*2+1.0*(fbm(x/60,z/60,2)-0.5)*2;
    for(const h of hills){ const dx=(x-h.x)/h.rx, dz=(z-h.z)/h.rz, e=dx*dx+dz*dz; if(e<9) y+=h.h*Math.exp(-1.6*e); }
    const m=mountainAmt(x,z);
    if(m>0.002) y+=m*(30+200*ridged(x/760,z/760,4))*BIG+m*16*(fbm(x/90,z/90,2)-0.5);
    return y;
  }

  // ---------- lakes ----------
  const lakes=[
    {x:1100,z:150,rx:1150,rz:780,rot:0.35,level:11,depth:13},
    {x:-1350,z:-950,rx:640,rz:450,rot:-0.4,level:15,depth:9},
    {x:-700,z:1750,rx:430,rz:300,rot:0.2,level:13,depth:7},
    {x:2100,z:-1700,rx:260,rz:200,rot:0.8,level:22,depth:5}
  ].map((l,i)=>({x:l.x*K,z:l.z*K,rx:l.rx*K,rz:l.rz*K,level:l.level,depth:l.depth,cs:Math.cos(l.rot),sn:Math.sin(l.rot),ph:[i*1.7+0.3,i*2.3+1.1,i*0.9+2.0]}));
  const LAKE_BANK=0.35;
  function lakeWarp(lk,th){ return 1+0.12*Math.sin(2*th+lk.ph[0])+0.09*Math.sin(3*th+lk.ph[1])+0.06*Math.sin(5*th+lk.ph[2]); }
  function lakeRd(lk,x,z){
    const dx=x-lk.x, dz=z-lk.z, lx=(dx*lk.cs+dz*lk.sn)/lk.rx, lz=(-dx*lk.sn+dz*lk.cs)/lk.rz;
    return Math.sqrt(lx*lx+lz*lz)/lakeWarp(lk,Math.atan2(lz,lx));
  }

  // ---------- rivers ----------
  const riverDefs=[
    {pts:[[-2150,-1950],[-2050,-1550],[-1900,-1280],[-1780,-1110]],w:[28,44]},
    {pts:[[-950,-880],[-500,-760],[0,-560],[450,-330],[700,-120]],w:[60,92]},
    {pts:[[-450,1600],[0,1450],[450,1200],[800,900],[950,620]],w:[44,62]},
    {pts:[[1900,100],[2300,420],[2650,380],[3050,700],[3300,900]],w:[80,112]},
    {pts:[[1900,-2550],[2000,-2250],[2130,-1950],[2170,-1770]],w:[24,36]},
    {pts:[[2000,-1560],[1750,-1100],[1520,-700],[1450,-380]],w:[40,56]},
    {pts:[[2700,2300],[2300,1900],[1900,1500],[1720,1000],[1600,600]],w:[34,52]}
  ];
  function catmull(p0,p1,p2,p3,t){
    const t2=t*t, t3=t2*t;
    return [0.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
            0.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)];
  }
  function splinePath(wp,step){
    const out=[];
    for(let i=0;i<wp.length-1;i++){
      const p0=wp[Math.max(0,i-1)], p1=wp[i], p2=wp[i+1], p3=wp[Math.min(wp.length-1,i+2)];
      const n=Math.max(2,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/step));
      for(let k=0;k<n;k++) out.push(catmull(p0,p1,p2,p3,k/n));
    }
    out.push(wp[wp.length-1].slice());
    return out;
  }
  const rivers=[];
  riverDefs.forEach((rd,ri_)=>{
    let pts=splinePath(rd.pts.map(p=>[p[0]*K,p[1]*K]),24);
    // meander: a slow sideways wobble, fading out at both ends so rivers still meet their lake
    const n=pts.length, ph=rr(0,6.28), ph2=rr(0,6.28), amp=rr(45,90)*K;
    const q=pts.map((p,i)=>{
      const a=pts[Math.max(0,i-1)], b=pts[Math.min(n-1,i+1)], tx=b[0]-a[0], tz=b[1]-a[1], l=Math.hypot(tx,tz)||1;
      const f=Math.min(1,i/(n*0.12),(n-1-i)/(n*0.12)), o=f*amp*(Math.sin(i*0.09+ph)+0.5*Math.sin(i*0.23+ph2));
      return [p[0]-tz/l*o,p[1]+tx/l*o];
    });
    // drop the parts inside lakes (the lake surface covers them)
    const inLake=p=>lakes.find(lk=>lakeRd(lk,p[0],p[1])<1.04);
    let i0=0, i1=q.length-1;
    while(i0<i1 && inLake(q[i0])) i0++;
    while(i1>i0 && inLake(q[i1])) i1--;
    const c=q.slice(Math.max(0,i0-1),Math.min(q.length,i1+2)).filter(p=>Math.abs(p[0])<HALF+60&&Math.abs(p[1])<HALF+60);
    const startLake=inLake(q[0]), endLake=inLake(q[q.length-1]);
    const m=c.length, hw=c.map((_,i)=>lerp(rd.w[0],rd.w[1],i/(m-1))*0.5*K**0.5);
    rivers.push({pts:c,hw,startLake,endLake,wl:null});
  });

  // Lakes shape the land first (basin + gentle shore), rivers are carved on top of that.
  let LK_WL=-1e9, LK_IN=false;
  function lakeAdjust(h,x,z){
    LK_WL=-1e9; LK_IN=false;
    for(let i=0;i<lakes.length;i++){
      const lk=lakes[i], rd=lakeRd(lk,x,z);
      if(rd<1+LAKE_BANK){
        if(rd<1){ h=lk.level-0.25-lk.depth*Math.pow(1-rd*rd,0.7); LK_WL=lk.level; LK_IN=true; }
        else { const t=sstep(rd,1,1+LAKE_BANK); h=lerp(lk.level-0.25,Math.max(h,lk.level+0.45),t); if(h<lk.level) LK_WL=lk.level; }
      }
    }
    return h;
  }
  const landHeight=(x,z)=>lakeAdjust(rawBase(x,z),x,z);

  // ---- base elevation of each airfield (the pad is graded perfectly flat at this height) ----
  bases.forEach(bs=>{
    let s=0,n=0; for(let a=-600;a<=600;a+=300) for(let b=-100;b<=300;b+=200){ const p=bW(bs,a,b); s+=rawBase(p.x,p.z); n++; }
    bs.H=clamp(s/n,24,38);
  });

  // ---- river water levels: follow the land downhill, never climb, end exactly at the lake surface ----
  rivers.forEach(r=>{
    const m=r.pts.length, raw=new Float32Array(m), wl=new Float32Array(m);
    for(let i=0;i<m;i++){
      const p=r.pts[i], a=r.pts[Math.max(0,i-1)], b=r.pts[Math.min(m-1,i+1)], tx=b[0]-a[0], tz=b[1]-a[1], l=Math.hypot(tx,tz)||1, nx=-tz/l, nz=tx/l, w=r.hw[i];
      raw[i]=Math.min(landHeight(p[0],p[1]),landHeight(p[0]+nx*w,p[1]+nz*w),landHeight(p[0]-nx*w,p[1]-nz*w))-0.9;
    }
    for(let i=0;i<m;i++){ let s=0,c=0; for(let k=-7;k<=7;k++){ const j=clamp(i+k,0,m-1); s+=raw[j]; c++; } wl[i]=s/c; }
    if(r.startLake) wl[0]=r.startLake.level;
    for(let i=1;i<m;i++) wl[i]=Math.min(wl[i],wl[i-1]-0.002);
    if(r.endLake){ const L=r.endLake.level; for(let i=0;i<m;i++) wl[i]=Math.max(wl[i],L); wl[m-1]=L; for(let i=m-2;i>=0;i--) wl[i]=Math.max(wl[i],wl[i+1]+0.002); }
    r.wl=wl;
    // streams begin where the land has come down out of the mountains (no near-vertical water flumes)
    if(!r.startLake){ let s=0; while(s<m-10 && wl[s]>62) s++; if(s>0){ r.pts=r.pts.slice(s); r.hw=r.hw.slice(s); r.wl=wl.slice(s); } }
  });
  // segment table + coarse hash so the terrain function only looks at nearby river pieces
  const RC=320, SEG={ax:[],az:[],bx:[],bz:[],hw0:[],hw1:[],wl0:[],wl1:[]}, rhash=new Map();
  const rkey=(i,j)=>(i+60)*1000+(j+60);
  rivers.forEach(r=>{
    for(let i=0;i<r.pts.length-1;i++){
      const idx=SEG.ax.length, a=r.pts[i], b=r.pts[i+1];
      SEG.ax.push(a[0]); SEG.az.push(a[1]); SEG.bx.push(b[0]); SEG.bz.push(b[1]);
      SEG.hw0.push(r.hw[i]); SEG.hw1.push(r.hw[i+1]); SEG.wl0.push(r.wl[i]); SEG.wl1.push(r.wl[i+1]);
      const x0=Math.min(a[0],b[0])-RC, x1=Math.max(a[0],b[0])+RC, z0=Math.min(a[1],b[1])-RC, z1=Math.max(a[1],b[1])+RC;
      for(let gx=Math.floor(x0/RC);gx<=Math.floor(x1/RC);gx++) for(let gz=Math.floor(z0/RC);gz<=Math.floor(z1/RC);gz++){
        const k=rkey(gx,gz); let arr=rhash.get(k); if(!arr){ arr=[]; rhash.set(k,arr); } arr.push(idx);
      }
    }
  });

  // ===================================================================================
  //  FINAL HEIGHT FUNCTION (+ the water level at that spot, for colouring and wading checks)
  // ===================================================================================
  let WLtmp=-1e9;
  function terrainExact(x,z){
    let h=lakeAdjust(rawBase(x,z),x,z), wlc=LK_WL;
    const arr=LK_IN?null:rhash.get(rkey(Math.floor(x/RC),Math.floor(z/RC)));
    if(arr){
      let bd=1e18, bi=-1, bt=0;
      for(let q=0;q<arr.length;q++){
        const i=arr[q], ax=SEG.ax[i], az=SEG.az[i], dx=SEG.bx[i]-ax, dz=SEG.bz[i]-az;
        const t=clamp(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz),0,1), ex=x-(ax+dx*t), ez=z-(az+dz*t), d2=ex*ex+ez*ez;
        if(d2<bd){ bd=d2; bi=i; bt=t; }
      }
      if(bi>=0){
        const d=Math.sqrt(bd), hw=lerp(SEG.hw0[bi],SEG.hw1[bi],bt), wl=lerp(SEG.wl0[bi],SEG.wl1[bi],bt);
        const bw=clamp(40+0.9*Math.max(0,h-wl),40,240), core=hw*0.8;
        if(d<core){ const q=d/core; h=wl-1.3*(1-q*q); wlc=wl; }
        else if(d<hw+bw){ const u=sstep(d,core,hw+bw); h=wl+(Math.max(h,wl+0.3)-wl)*u; }
      }
    }
    for(const bs of bases){
      const p=bL(bs,x,z), da=Math.max(PAD.a0-p.a,0,p.a-PAD.a1), db=Math.max(PAD.b0-p.b,0,p.b-PAD.b1);
      if(da>150||db>150) continue;
      const f=1-sstep(Math.hypot(da,db),0,150);
      if(f>0){ h=lerp(h,bs.H,f); if(f>0.4) wlc=-1e9; }
    }
    WLtmp=wlc;
    return h;
  }

  // Heights are baked once into a grid; the game's many per-frame height lookups are then a cheap bilinear sample.
  const DIV=Math.max(40,Math.round(G/(10*BIG)/40)*40), ROW=DIV+1, STEP=G/DIV;      // ~10 m cells (up to 9.6 km maps; ~14 m at 19.2 km), in whole 40-cell chunks
  const HM=new Float32Array(ROW*ROW), WLG=new Float32Array(ROW*ROW);
  for(let iz=0;iz<=DIV;iz++) for(let ix=0;ix<=DIV;ix++){
    const i=iz*ROW+ix; HM[i]=terrainExact(-HALF+ix*STEP,-HALF+iz*STEP); WLG[i]=WLtmp;
  }
  function terrainHeightAt(x,z){
    const fx=clamp((x+HALF)/STEP,0,DIV-1e-4), fz=clamp((z+HALF)/STEP,0,DIV-1e-4), ix=fx|0, iz=fz|0, tx=fx-ix, tz=fz-iz, i=iz*ROW+ix;
    return (HM[i]*(1-tx)+HM[i+1]*tx)*(1-tz)+(HM[i+ROW]*(1-tx)+HM[i+ROW+1]*tx)*tz;
  }
  function waterLevelAt(x,z){   // nearest-cell water surface height, or -1e9 on dry land
    const ix=clamp(Math.round((x+HALF)/STEP),0,DIV), iz=clamp(Math.round((z+HALF)/STEP),0,DIV);
    return WLG[iz*ROW+ix];
  }
  const slopeAt=(x,z)=>Math.hypot(terrainHeightAt(x+STEP,z)-terrainHeightAt(x-STEP,z),terrainHeightAt(x,z+STEP)-terrainHeightAt(x,z-STEP))/(2*STEP);
  // Tanks can wade shallow water (rivers are about 1.3 m deep) but not drive into a lake's deep water.
  function blockedAt(x,z){ const w=waterLevelAt(x,z); return w>-1e8 && w-terrainHeightAt(x,z)>1.6; }

  // ===================================================================================
  //  BIOMES: forest, farmland, steppe, desert, mountains (as smooth 0..1 masks)
  // ===================================================================================
  const aridMask=(x,z)=>1-sstep(Math.hypot(x+1550*K,z-2450*K)/(1300*K)+(fbm(x/700,z/700,3)-0.5)*0.5,0.55,1.0);
  function forestMask(x,z,h,m){
    const nx=x/K, nz=z/K;
    let v=sstep(fbm(x/1300+13.1,z/1300-7.7,3),0.50,0.60);
    v=Math.max(v,sstep(nx,500,1500)*sstep(-nz,300,1200)*sstep(fbm(x/500,z/500,3),0.28,0.42));   // big north-east forest
    v=Math.max(v,m*0.85*sstep(fbm(x/260+3,z/260,3),0.3,0.5));                                   // foothill woods
    v*=1-0.7*Math.exp(-Math.pow(nx/900,2));                                                     // keep a mostly open central corridor
    return v*(1-sstep(h,95,140));
  }
  const farmRaw=(x,z)=>sstep(fbm(x/2100-4,z/2100+11,3),0.42,0.52);
  let VID=0, VEDGE=0;
  function voro(x,z,s){
    const gx=Math.floor(x/s), gz=Math.floor(z/s); let d1=1e9, d2=1e9;
    for(let j=-1;j<=1;j++) for(let i=-1;i<=1;i++){
      const cx=gx+i, cz=gz+j, px=(cx+0.15+0.7*ih(cx,cz*7+3))*s, pz=(cz+0.15+0.7*ih(cz+11,cx*5+1))*s, d=Math.hypot(x-px,z-pz);
      if(d<d1){ d2=d1; d1=d; VID=ih(cx*3+1,cz*5+2); } else if(d<d2) d2=d;
    }
    VEDGE=d2-d1;
  }

  // ===================================================================================
  //  GROUND COLOURS (one colour per grid vertex) + the LOD terrain mesh
  // ===================================================================================
  const PAL={
    steppeA:HEX(0x8f9a54), steppeB:HEX(0x7e8c4a), meadow:HEX(0x6c8a42),
    fields:[0xb9a24c,0x6f8f3c,0x82a548,0x6b5238,0xa89a58,0xc2b23e,0x4f7a37,0x8c8a4a,0x769a45,0x9a7f45].map(HEX),
    hedge:HEX(0x3d5a2e), conif:HEX(0x2c4a2a), broad:HEX(0x3f5f2c), sandA:HEX(0xc9b07a), sandB:HEX(0xb89a62),
    rockA:HEX(0x7b7467), rockB:HEX(0x8d8577), tundra:HEX(0x7d8264), snow:HEX(0xeef1f3),
    shore:HEX(0xc9b88c), marsh:HEX(0x55663a), wetA:HEX(0x3f7886), wetB:HEX(0x1d4153), clearing:HEX(0x8a8566)
  };
  const COL=new Float32Array(ROW*ROW*3), POS=new Float32Array(ROW*ROW*3);
  for(let iz=0;iz<=DIV;iz++) for(let ix=0;ix<=DIV;ix++){
    const i=iz*ROW+ix, x=-HALF+ix*STEP, z=-HALF+iz*STEP, h=HM[i], wl=WLG[i];
    POS[i*3]=x; POS[i*3+1]=h; POS[i*3+2]=z;
    const hx=(HM[iz*ROW+Math.min(DIV,ix+1)]-HM[iz*ROW+Math.max(0,ix-1)])/(2*STEP), hz=(HM[Math.min(DIV,iz+1)*ROW+ix]-HM[Math.max(0,iz-1)*ROW+ix])/(2*STEP), sl=Math.hypot(hx,hz);
    const m=mountainAmt(x,z), ar=aridMask(x,z), fo=forestMask(x,z,h,m);
    const farmM=farmRaw(x,z)*(1-fo)*(1-ar)*(1-sstep(h,50,75));
    let c=mix3(PAL.steppeA,PAL.steppeB,fbm(x/70,z/70,2));
    c=mix3(c,PAL.meadow,sstep(fbm(x/500+5,z/500,2),0.55,0.7)*0.5);
    if(farmM>0.01){
      voro(x,z,150); let fc=PAL.fields[Math.floor(VID*10)%10]; const br=0.9+0.2*ih(Math.floor(VID*997),3);
      fc=[fc[0]*br,fc[1]*br,fc[2]*br]; if(VEDGE<9) fc=mix3(fc,PAL.hedge,(1-VEDGE/9)*0.7);
      c=mix3(c,fc,farmM);
    }
    if(fo>0.02){ const conifer=h>46||fbm(x/400,z/400,2)>0.58; c=mix3(c,conifer?PAL.conif:PAL.broad,fo*0.92); }
    if(ar>0.01) c=mix3(c,mix3(PAL.sandA,PAL.sandB,sstep(Math.sin(x*0.021+Math.sin(z*0.007)*3.0)*0.5+0.5,0.3,0.7)),ar*0.95);
    const rockAmt=Math.max(clamp((sl-0.33)*2.4,0,1),m*0.5*sstep(h,70,120));
    c=mix3(c,PAL.tundra,sstep(h,110,165)*0.7*(1-ar));
    if(rockAmt>0.01) c=mix3(c,mix3(PAL.rockA,PAL.rockB,fbm(x/30,z/30,2)),rockAmt);
    const sn=sstep(h+16*(fbm(x/120,z/120,3)-0.5)*2,175,205)*(1-clamp((sl-0.9)*1.2,0,1)*0.5);
    if(sn>0.01) c=mix3(c,PAL.snow,sn);
    if(wl>-1e8 && wl-h>0.05) c=mix3(PAL.wetA,PAL.wetB,clamp((wl-h)/8,0,1));
    else {
      // shoreline sand: dry ground that touches water within a couple of cells
      let near=false;
      for(let k=1;k<=2&&!near;k++){
        const xi0=Math.max(0,ix-k), xi1=Math.min(DIV,ix+k), zi0=Math.max(0,iz-k), zi1=Math.min(DIV,iz+k);
        near=WLG[iz*ROW+xi0]>-1e8||WLG[iz*ROW+xi1]>-1e8||WLG[zi0*ROW+ix]>-1e8||WLG[zi1*ROW+ix]>-1e8||wl>-1e8;
      }
      if(near) c=mix3(c,PAL.shore,0.8);
    }
    const pw=padWeight(x,z); if(pw>0) c=mix3(c,PAL.clearing,pw*0.9);
    const v=0.93+0.1*fbm(x/20,z/20,2);
    COL[i*3]=c[0]*v; COL[i*3+1]=c[1]*v; COL[i*3+2]=c[2]*v;
  }
  // Fine world-space grain over the vertex colours so close-up ground isn't a flat smear.
  const detailCanvas=document.createElement('canvas'); detailCanvas.width=detailCanvas.height=256;
  { const g=detailCanvas.getContext('2d'); g.fillStyle='#cccccc'; g.fillRect(0,0,256,256);
    for(let i=0;i<46;i++){ const x=Math.random()*256, y=Math.random()*256, r=18+Math.random()*52, gr=g.createRadialGradient(x,y,0,x,y,r), d=Math.random()<0.5?'rgba(120,120,120,0.35)':'rgba(255,255,255,0.3)';
      gr.addColorStop(0,d); gr.addColorStop(1,'rgba(0,0,0,0)');
      for(const ox of [-256,0,256]) for(const oy of [-256,0,256]){ g.save(); g.translate(ox,oy); g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); g.restore(); } }
    for(let i=0;i<3500;i++){ g.fillStyle=Math.random()<0.5?'rgba(0,0,0,'+(0.05+Math.random()*0.15).toFixed(2)+')':'rgba(255,255,255,'+(0.05+Math.random()*0.15).toFixed(2)+')'; g.fillRect(Math.random()*256,Math.random()*256,1+Math.random()*1.4,1+Math.random()*1.4); } }
  const detailTex=new THREE.CanvasTexture(detailCanvas); detailTex.wrapS=detailTex.wrapT=THREE.RepeatWrapping; detailTex.anisotropy=16;
  const groundMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0});
  groundMat.onBeforeCompile=sh=>{
    sh.uniforms.uDetail={value:detailTex};
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vWXZ;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWXZ=(modelMatrix*vec4(transformed,1.0)).xz;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vWXZ;\nuniform sampler2D uDetail;')
      .replace('#include <color_fragment>','#include <color_fragment>\n{vec3 d1=texture2D(uDetail,vWXZ*0.23).rgb; vec3 d2=texture2D(uDetail,vWXZ*0.031+0.37).rgb; diffuseColor.rgb*=d1*d2*1.55;}');
  };
  const terrainLOD=window.createLODTerrain(scene,{
    div:DIV,size:G,pos:POS,col:COL,chunk:40,material:groundMat,
    levels:[{dist:1600,step:1},{dist:3200,step:2},{dist:Infinity,step:4}]
  });

  // ===================================================================================
  //  SMALL GEOMETRY KIT (everything man-made is merged into a handful of meshes)
  // ===================================================================================
  const treeColliders=[], solids=[], solidHash=new Map(), SH=64;
  const BLK=new Uint8Array(ROW*ROW);       // 1 = keep trees / rocks off this ground cell (roads, towns, airfields)
  function stamp(x,z,r){
    const x0=Math.max(0,Math.floor((x-r+HALF)/STEP)), x1=Math.min(DIV,Math.ceil((x+r+HALF)/STEP)), z0=Math.max(0,Math.floor((z-r+HALF)/STEP)), z1=Math.min(DIV,Math.ceil((z+r+HALF)/STEP));
    for(let iz=z0;iz<=z1;iz++) for(let ix=x0;ix<=x1;ix++){ const dx=-HALF+ix*STEP-x, dz=-HALF+iz*STEP-z; if(dx*dx+dz*dz<=r*r) BLK[iz*ROW+ix]=1; }
  }
  const blockedCell=(x,z)=>BLK[clamp(Math.round((z+HALF)/STEP),0,DIV)*ROW+clamp(Math.round((x+HALF)/STEP),0,DIV)]===1;
  const newB=()=>({pos:[],nor:[],uv:[],col:[]});
  function quad(B,p0,p1,p2,p3,uv,col,hint){
    const ux=p1[0]-p0[0],uy=p1[1]-p0[1],uz=p1[2]-p0[2];
    let vx=p3[0]-p0[0],vy=p3[1]-p0[1],vz=p3[2]-p0[2];
    let nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx, l=Math.hypot(nx,ny,nz);
    if(l<1e-9){ vx=p2[0]-p0[0]; vy=p2[1]-p0[1]; vz=p2[2]-p0[2]; nx=uy*vz-uz*vy; ny=uz*vx-ux*vz; nz=ux*vy-uy*vx; l=Math.hypot(nx,ny,nz); if(l<1e-9) return; }
    nx/=l; ny/=l; nz/=l;
    let flip=false;
    if(hint && nx*hint[0]+ny*hint[1]+nz*hint[2]<0){ flip=true; nx=-nx; ny=-ny; nz=-nz; }
    const P=[p0,p1,p2,p3], idx=flip?[0,2,1,0,3,2]:[0,1,2,0,2,3], c=col||[1,1,1];
    for(const k of idx){ B.pos.push(P[k][0],P[k][1],P[k][2]); B.nor.push(nx,ny,nz); B.uv.push(uv[k][0],uv[k][1]); B.col.push(c[0],c[1],c[2]); }
  }
  // yaw-rotated frame: local x -> (cos,0,-sin), local z -> (sin,0,cos)
  const frame=(cx,cz,yaw)=>{ const c=Math.cos(yaw), s=Math.sin(yaw); return {W:(lx,y,lz)=>[cx+lx*c+lz*s,y,cz-lx*s+lz*c], N:(nx,ny,nz)=>[nx*c+nz*s,ny,-nx*s+nz*c], c,s}; };
  function boxY(B,cx,y0,cz,w,h,d,yaw,col,tw,th,noTop){
    const F=frame(cx,cz,yaw), hw=w/2, hd=d/2, y1=y0+h;
    const sides=[[[-hw,-hd],[hw,-hd],[0,-1],w],[[hw,-hd],[hw,hd],[1,0],d],[[hw,hd],[-hw,hd],[0,1],w],[[-hw,hd],[-hw,-hd],[-1,0],d]];
    for(const [a,b,n,len] of sides) quad(B,F.W(a[0],y0,a[1]),F.W(b[0],y0,b[1]),F.W(b[0],y1,b[1]),F.W(a[0],y1,a[1]),[[0,0],[len/tw,0],[len/tw,h/th],[0,h/th]],col,F.N(n[0],0,n[1]));
    if(!noTop) quad(B,F.W(-hw,y1,-hd),F.W(hw,y1,-hd),F.W(hw,y1,hd),F.W(-hw,y1,hd),[[0,0],[w/tw,0],[w/tw,d/tw],[0,d/tw]],col,[0,1,0]);
  }
  // gabled roof over a w x d footprint at eave height y0 (ridge along local z)
  function gable(Br,Bw,cx,y0,cz,w,d,rise,yaw,roofCol,wallCol){
    const F=frame(cx,cz,yaw), hw=w/2+0.35, hd=d/2+0.35, ry=y0+rise;
    quad(Br,F.W(-hw,y0,-hd),F.W(-hw,y0,hd),F.W(0,ry,hd),F.W(0,ry,-hd),[[0,0],[d/3,0],[d/3,w/6],[0,w/6]],roofCol,F.N(-rise,w/2,0));
    quad(Br,F.W(hw,y0,hd),F.W(hw,y0,-hd),F.W(0,ry,-hd),F.W(0,ry,hd),[[0,0],[d/3,0],[d/3,w/6],[0,w/6]],roofCol,F.N(rise,w/2,0));
    quad(Bw,F.W(-w/2,y0,-d/2),F.W(w/2,y0,-d/2),F.W(0,ry,-d/2),F.W(0,ry,-d/2),[[0,0],[w/4,0],[w/8,rise/3.2],[w/8,rise/3.2]],wallCol,F.N(0,0,-1));
    quad(Bw,F.W(w/2,y0,d/2),F.W(-w/2,y0,d/2),F.W(0,ry,d/2),F.W(0,ry,d/2),[[0,0],[w/4,0],[w/8,rise/3.2],[w/8,rise/3.2]],wallCol,F.N(0,0,1));
  }
  // barrel-vault hangar: arched section across local x, extruded along local z
  function vault(B,cx,y0,cz,span,len,wallH,archH,yaw,col){
    const F=frame(cx,cz,yaw), prof=[[-span/2,0],[-span/2,wallH]];
    for(let k=1;k<12;k++){ const t=Math.PI-k/12*Math.PI; prof.push([Math.cos(t)*span/2,wallH+Math.sin(t)*archH]); }
    prof.push([span/2,wallH],[span/2,0]);
    const hd=len/2; let acc=0;
    for(let i=0;i<prof.length-1;i++){
      const a=prof[i], b=prof[i+1], sl=Math.hypot(b[0]-a[0],b[1]-a[1]), mx=(a[0]+b[0])/2, my=(a[1]+b[1])/2-wallH*0.5;
      quad(B,F.W(a[0],y0+a[1],-hd),F.W(b[0],y0+b[1],-hd),F.W(b[0],y0+b[1],hd),F.W(a[0],y0+a[1],hd),[[acc/6,0],[(acc+sl)/6,0],[(acc+sl)/6,len/6],[acc/6,len/6]],col,F.N(mx,my,0));
      acc+=sl;
    }
    for(const sz of [-1,1]){
      const c0=F.W(0,y0+wallH*0.5,sz*hd);
      for(let i=0;i<prof.length-1;i++){ const a=prof[i], b=prof[i+1];
        quad(B,c0,F.W(a[0],y0+a[1],sz*hd),F.W(b[0],y0+b[1],sz*hd),F.W(b[0],y0+b[1],sz*hd),[[0.5,0.5],[a[0]/6+0.5,a[1]/6],[b[0]/6+0.5,b[1]/6],[b[0]/6+0.5,b[1]/6]],col,F.N(0,0,sz)); }
    }
  }
  function cylY(B,cx,y0,cz,r,h,col,seg,tw){
    seg=seg||14;
    for(let i=0;i<seg;i++){
      const a0=i/seg*Math.PI*2, a1=(i+1)/seg*Math.PI*2, x0=cx+Math.cos(a0)*r, z0=cz+Math.sin(a0)*r, x1=cx+Math.cos(a1)*r, z1=cz+Math.sin(a1)*r;
      quad(B,[x0,y0,z0],[x1,y0,z1],[x1,y0+h,z1],[x0,y0+h,z0],[[i/seg*6.28*r/tw,0],[(i+1)/seg*6.28*r/tw,0],[(i+1)/seg*6.28*r/tw,h/tw],[i/seg*6.28*r/tw,h/tw]],col,[Math.cos((a0+a1)/2),0,Math.sin((a0+a1)/2)]);
      quad(B,[cx,y0+h,cz],[x0,y0+h,z0],[x1,y0+h,z1],[x1,y0+h,z1],[[0,0],[1,0],[1,1],[1,1]],col,[0,1,0]);
    }
  }
  function domeY(B,cx,y0,cz,r,col){
    const N=10,M=6;
    for(let j=0;j<M;j++) for(let i=0;i<N;i++){
      const t0=j/M*Math.PI/2, t1=(j+1)/M*Math.PI/2, a0=i/N*Math.PI*2, a1=(i+1)/N*Math.PI*2;
      const p=(t,a)=>[cx+Math.cos(a)*Math.cos(t)*r,y0+Math.sin(t)*r,cz+Math.sin(a)*Math.cos(t)*r];
      quad(B,p(t0,a0),p(t0,a1),p(t1,a1),p(t1,a0),[[0,0],[1,0],[1,1],[0,1]],col,[Math.cos((a0+a1)/2),Math.sin((t0+t1)/2),Math.sin((a0+a1)/2)]);
    }
  }
  function addSolid(cx,cz,w,d,yaw,y0,y1){
    const o={x:cx,z:cz,c:Math.cos(yaw),s:Math.sin(yaw),hx:w/2,hz:d/2,y0,y1}, r=Math.hypot(w,d)/2;
    for(let gx=Math.floor((cx-r)/SH);gx<=Math.floor((cx+r)/SH);gx++) for(let gz=Math.floor((cz-r)/SH);gz<=Math.floor((cz+r)/SH);gz++){
      const k=gx*100003+gz; let a=solidHash.get(k); if(!a){ a=[]; solidHash.set(k,a); } a.push(o);
    }
  }
  function addColliders(cx,cz,w,d,yaw){            // a row of circles along the long axis, like tree trunks
    const long=Math.max(w,d), r=Math.min(w,d)/2+0.4, F=frame(cx,cz,yaw), alongX=w>=d, n=Math.max(1,Math.ceil((long-2*r)/(r*1.2))+1);
    for(let k=0;k<n;k++){ const t=n===1?0:-(long/2-r)+(long-2*r)*k/(n-1), p=F.W(alongX?t:0,0,alongX?0:t); treeColliders.push({x:p[0],z:p[2],radius:r}); }
  }
  function solidAt(x,y,z){
    const a=solidHash.get(Math.floor(x/SH)*100003+Math.floor(z/SH)); if(!a) return false;
    for(const o of a){
      const dx=x-o.x, dz=z-o.z, lx=dx*o.c-dz*o.s, lz=dx*o.s+dz*o.c;
      if(Math.abs(lx)<o.hx && Math.abs(lz)<o.hz && y>o.y0-0.5 && y<o.y1) return true;
    }
    return false;
  }
  // a building footprint: stand it on the lowest corner and let the wall reach up to the highest one
  function groundFor(cx,cz,w,d,yaw){
    const F=frame(cx,cz,yaw); let lo=1e9, hi=-1e9;
    for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1],[0,0]]){ const p=F.W(a*w/2,0,b*d/2), h=terrainHeightAt(p[0],p[2]); lo=Math.min(lo,h); hi=Math.max(hi,h); }
    return {lo,hi};
  }

  // ---------- small canvas textures ----------
  function canvasTex(S,draw){
    const c=document.createElement('canvas'); c.width=c.height=S; draw(c.getContext('2d'),S);
    const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=16; t.encoding=THREE.sRGBEncoding; return t;
  }
  const speckle=(g,S,n,a)=>{ for(let i=0;i<n;i++){ g.fillStyle=Math.random()<0.5?'rgba(0,0,0,'+(Math.random()*a).toFixed(3)+')':'rgba(255,255,255,'+(Math.random()*a*0.8).toFixed(3)+')'; g.fillRect(Math.random()*S,Math.random()*S,1+Math.random()*2,1+Math.random()*2); } };
  const TEX={
    wall:canvasTex(128,(g,S)=>{ g.fillStyle='#e4ded0'; g.fillRect(0,0,S,S); speckle(g,S,900,0.1);
      g.fillStyle='rgba(0,0,0,0.3)'; g.fillRect(40,22,48,64); g.fillStyle='#2d3841'; g.fillRect(43,25,42,58); g.fillStyle='rgba(170,190,205,0.25)'; g.fillRect(43,25,42,18);
      g.fillStyle='#d6d0c2'; g.fillRect(36,86,56,6); g.fillStyle='#bdb7a8'; g.fillRect(0,S-10,S,10); }),
    metal:canvasTex(64,(g,S)=>{ for(let x=0;x<S;x++){ const v=0.5+0.5*Math.sin(x/8*6.283), c=150+v*60; g.fillStyle='rgb('+(c|0)+','+(c|0)+','+((c-6)|0)+')'; g.fillRect(x,0,1,S); } speckle(g,S,200,0.12); }),
    conc:canvasTex(64,(g,S)=>{ g.fillStyle='#9a978f'; g.fillRect(0,0,S,S); speckle(g,S,500,0.16); }),
    roof:canvasTex(64,(g,S)=>{ g.fillStyle='#b9b2a8'; g.fillRect(0,0,S,S); for(let r=0;r<8;r++){ g.fillStyle='rgba(0,0,0,0.28)'; g.fillRect(0,r*8+6,S,2); } speckle(g,S,400,0.14); })
  };
  const MATS={};
  const mat=n=>MATS[n]||(MATS[n]=new THREE.MeshStandardMaterial({map:TEX[n],vertexColors:true,roughness:0.9,metalness:n==='metal'?0.25:0}));
  const BK={wall:newB(),metal:newB(),conc:newB(),roof:newB()};
  const WALLS=[0xe9e1cf,0xdccfb0,0xcfd2c4,0xe3c9a6,0xd9b9a1,0xd8d4c8].map(HEX), ROOFS=[0xa4553b,0x8c4a38,0x6f6a66,0x5e4a3e,0x9a5a40].map(HEX);
  const tint=(c,k)=>[c[0]*k,c[1]*k,c[2]*k];
  function house(cx,cz,w,d,h,yaw,wallCol,roofCol){
    const g=groundFor(cx,cz,w,d,yaw), y0=g.lo-0.3, hh=h+(g.hi-g.lo)+0.3;
    boxY(BK.wall,cx,y0,cz,w,hh,d,yaw,wallCol,4.5,3.4,true);
    gable(BK.roof,BK.wall,cx,y0+hh,cz,w,d,Math.min(w,d)*0.32,yaw,roofCol,wallCol);
    addColliders(cx,cz,w,d,yaw); addSolid(cx,cz,w,d,yaw,y0,y0+hh+Math.min(w,d)*0.32);
  }

  // ===================================================================================
  //  ROADS (ribbons draped on the terrain: a highway between the airfields + dirt tracks)
  // ===================================================================================
  const roadGeo={asphalt:newB(),dirt:newB()}, roadLines=[];
  function buildRoad(wp,width,kind,tag){
    const pts=splinePath(wp.map(p=>[p[0]*(tag==='raw'?1:K),p[1]*(tag==='raw'?1:K)]),9), n=pts.length, hh=new Float32Array(n);
    for(let i=0;i<n;i++){ const p=pts[i]; let h=terrainHeightAt(p[0],p[1]); const w=waterLevelAt(p[0],p[1]); if(w>-1e8) h=Math.max(h,w+1.3); hh[i]=h; }
    for(let pass=0;pass<4;pass++) for(let i=1;i<n-1;i++){ hh[i]=(hh[i-1]+hh[i]*2+hh[i+1])*0.25; }
    for(let i=0;i<n;i++){ const w=waterLevelAt(pts[i][0],pts[i][1]); if(w>-1e8) hh[i]=Math.max(hh[i],w+1.1); }
    const B=roadGeo[kind]; let along=0, prev=null;
    const left=[], right=[];
    for(let i=0;i<n;i++){
      const a=pts[Math.max(0,i-1)], b=pts[Math.min(n-1,i+1)], tx=b[0]-a[0], tz=b[1]-a[1], l=Math.hypot(tx,tz)||1, nx=-tz/l*width/2, nz=tx/l*width/2;
      left.push([pts[i][0]+nx,hh[i]+0.22,pts[i][1]+nz]); right.push([pts[i][0]-nx,hh[i]+0.22,pts[i][1]-nz]);
      stamp(pts[i][0],pts[i][1],width/2+9);
    }
    for(let i=0;i<n-1;i++){
      const seg=Math.hypot(pts[i+1][0]-pts[i][0],pts[i+1][1]-pts[i][1]), v0=along/16, v1=(along+seg)/16; along+=seg;
      quad(B,left[i],right[i],right[i+1],left[i+1],[[0,v0],[1,v0],[1,v1],[0,v1]],null,[0,1,0]);
    }
    roadLines.push({pts,width,kind});
    return pts;
  }
  const highwayWP=[[70,-2250],[200,-1900],[60,-1400],[-100,-900],[-120,-500],[-60,0],[50,500],[0,1000],[-60,1500],[0,1900],[-70,2250]];
  const hwPts=highwayWP.map(p=>[p[0]*K,p[1]*K]), apronEnd=bs=>{ const w=bW(bs,0,330); return [w.x,w.z]; };
  hwPts[0]=apronEnd(bases[0]); hwPts[hwPts.length-1]=apronEnd(bases[1]);
  const highway=buildRoad(hwPts,11,'asphalt','raw');
  // apron access roads from each highway end to the runway-side taxiway
  bases.forEach(bs=>{ const p0=bW(bs,0,330), p1=bW(bs,0,PAD.b1+60); buildRoad([[p0.x,p0.z],[p1.x,p1.z]],9,'asphalt','raw'); });

  // ===================================================================================
  //  VILLAGES (farmland only, away from water) with a church, linked to the highway by dirt tracks
  // ===================================================================================
  const villages=[];
  const nearHighway=(x,z)=>{ let b=1e18,bp=null; for(const p of highway){ const d=(p[0]-x)**2+(p[1]-z)**2; if(d<b){ b=d; bp=p; } } return {d:Math.sqrt(b),p:bp}; };
  const wetBetween=(x0,z0,x1,z1)=>{ for(let t=0;t<=1;t+=0.05){ if(waterLevelAt(lerp(x0,x1,t),lerp(z0,z1,t))>-1e8) return true; } return false; };
  for(let t=0;t<7000 && villages.length<Math.round(9*K*K);t++){
    const x=rr(-2700,2700)*K, z=rr(-2500,2500)*K, h=terrainHeightAt(x,z), m=mountainAmt(x,z);
    if(farmRaw(x,z)<0.55 || forestMask(x,z,h,m)>0.2 || aridMask(x,z)>0.1 || h>55 || m>0.08 || slopeAt(x,z)>0.09) continue;
    if(padWeight(x,z)>0 || bases.some(b=>Math.hypot(x-b.x,z-b.z)<900*K) || villages.some(v=>Math.hypot(v.x-x,v.z-z)<650*K)) continue;
    let wet=false; for(let a=0;a<6.28&&!wet;a+=0.7) if(waterLevelAt(x+Math.cos(a)*170,z+Math.sin(a)*170)>-1e8) wet=true;
    if(wet || waterLevelAt(x,z)>-1e8) continue;
    const nh=nearHighway(x,z); if(nh.d>2300*K || wetBetween(x,z,nh.p[0],nh.p[1])) continue;
    villages.push({x,z,hw:nh.p});
  }
  villages.forEach(v=>{
    const th=Math.atan2(v.hw[0]-v.x,v.hw[1]-v.z);         // street runs towards the highway
    const sx=Math.sin(th), sz=Math.cos(th);               // street direction; (sz,-sx) is the sideways direction
    for(let s=-1;s<=1;s+=2) for(let t=-70;t<=70;t+=rr(17,25)){
      if(rnd()<0.15) continue;
      const row=rnd()<0.28?rr(33,40):rr(13,16), px=v.x+sx*t+sz*s*row, pz=v.z+sz*t-sx*s*row;
      if(blockedCell(px,pz)&&row<20) continue;
      const w=rr(8,12), d=rr(8,11);
      house(px,pz,w,d,rr(4.4,6.2),th+(rnd()<0.25?Math.PI/2:0),tint(pick(WALLS),rr(0.95,1.04)),pick(ROOFS));
    }
    // church at the far end of the street
    const cx=v.x-sx*85, cz=v.z-sz*85, g=groundFor(cx,cz,10,22,th), y0=g.lo-0.3, hh=8+(g.hi-g.lo)+0.3;
    boxY(BK.wall,cx,y0,cz,10,hh,22,th,tint(WALLS[0],1),4.5,3.4,true); gable(BK.roof,BK.wall,cx,y0+hh,cz,10,22,4.5,th,ROOFS[2],WALLS[0]);
    const tw=frame(cx,cz,th).W(0,0,12.5);
    boxY(BK.wall,tw[0],y0,tw[2],6.5,hh+12,6.5,th,tint(WALLS[0],1),4.5,3.4,false);
    boxY(BK.roof,tw[0],y0+hh+12,tw[2],5.4,5,5.4,th,ROOFS[2],4,3,false);
    addColliders(cx,cz,10,22,th); addColliders(tw[0],tw[2],6.5,6.5,th); addSolid(cx,cz,10,22,th,y0,y0+hh+4); addSolid(tw[0],tw[2],6.5,6.5,th,y0,y0+hh+17);
    stamp(v.x,v.z,115*K**0.5);
    buildRoad([[v.x,v.z],[(v.x+v.hw[0])/2+rr(-25,25),(v.z+v.hw[1])/2+rr(-25,25)],[v.hw[0],v.hw[1]]],6.5,'dirt','raw');
  });

  // ===================================================================================
  //  THE TWO AIRFIELDS: painted pad (runway, taxiway, apron, markings) + hangars, tower, terminal, fuel, radar
  // ===================================================================================
  const padMesh={B:newB()}, padMats=[];
  bases.forEach((bs,bi)=>{
    const num=bi===0?['36','18']:['18','36'], teamCol=bi===0?'#3f6fae':'#a83b32';
    const W=3072, kx=W/(PAD.a1-PAD.a0), Hh=Math.round((PAD.b1-PAD.b0)*kx);
    const cv=document.createElement('canvas'); cv.width=W; cv.height=Hh; const g=cv.getContext('2d');
    const X=a=>(a-PAD.a0)*kx, Y=b=>(b-PAD.b0)*kx, R=(a0,a1,b0,b1,f)=>{ g.fillStyle=f; g.fillRect(X(a0),Y(b0),(a1-a0)*kx,(b1-b0)*kx); };
    g.fillStyle='#868260'; g.fillRect(0,0,W,Hh);
    for(let i=0;i<240;i++){ const x=Math.random()*W, y=Math.random()*Hh, r=20+Math.random()*80, gr=g.createRadialGradient(x,y,0,x,y,r), c=Math.random()<0.5?'104,122,70':'140,132,96';
      gr.addColorStop(0,'rgba('+c+',0.35)'); gr.addColorStop(1,'rgba('+c+',0)'); g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); }
    // taxiway, connectors, apron, hangar apron
    R(-640,640,TWY_B-TWY_W/2,TWY_B+TWY_W/2,'#58585a');
    [-560,-300,0,300,560].forEach(a=>R(a-TWY_W/2,a+TWY_W/2,RWY_W/2,TWY_B-TWY_W/2,'#58585a'));
    R(-110,420,TWY_B+TWY_W/2,140,'#8d8b85'); R(-300,420,140,262,'#8d8b85'); R(-250,250,262,340,'#8d8b85');
    g.strokeStyle='rgba(60,58,52,0.35)'; g.lineWidth=1; g.beginPath();
    for(let a=-300;a<=420;a+=15){ g.moveTo(X(a),Y(140)); g.lineTo(X(a),Y(340)); } for(let b=140;b<=340;b+=15){ g.moveTo(X(-300),Y(b)); g.lineTo(X(420),Y(b)); } g.stroke();
    g.fillStyle='#d8c348'; g.fillRect(X(-640),Y(TWY_B)-0.2*kx,1280*kx,0.4*kx);
    [-560,-300,0,300,560].forEach(a=>g.fillRect(X(a)-0.2*kx,Y(RWY_W/2),0.4*kx,(TWY_B-TWY_W/2-RWY_W/2)*kx));
    g.strokeStyle='rgba(216,195,72,0.8)'; g.lineWidth=0.3*kx; for(let a=-270;a<=390;a+=60){ g.beginPath(); g.moveTo(X(a),Y(165)); g.lineTo(X(a),Y(245)); g.stroke(); }
    R(-520,-300,150,240,'#8a8466');                                       // barracks yard
    // runway
    R(-RWY_LEN/2,RWY_LEN/2,-RWY_W/2,RWY_W/2,'#47484a');
    for(let i=0;i<9000;i++){ g.fillStyle=Math.random()<0.5?'rgba(0,0,0,0.12)':'rgba(255,255,255,0.05)'; g.fillRect(X(-600)+Math.random()*1200*kx,Y(-25)+Math.random()*50*kx,1+Math.random()*2.5,1+Math.random()*2.5); }
    for(let i=0;i<70;i++){ const a=-420+Math.random()*340, gr=g.createRadialGradient(X(a),Y(Math.random()*30-15),0,X(a),Y(0),20*kx); gr.addColorStop(0,'rgba(10,10,10,0.25)'); gr.addColorStop(1,'rgba(10,10,10,0)'); g.fillStyle=gr; g.fillRect(X(a)-20*kx,Y(-25),40*kx,50*kx); }
    const mark='#dcdccb';
    R(-RWY_LEN/2,RWY_LEN/2,-RWY_W/2+0.7,-RWY_W/2+1.3,mark); R(-RWY_LEN/2,RWY_LEN/2,RWY_W/2-1.3,RWY_W/2-0.7,mark);
    for(let a=-540;a<540;a+=50) R(a,a+30,-0.45,0.45,mark);
    [-1,1].forEach(dir=>{ const e=dir*RWY_LEN/2; for(let k=0;k<10;k++){ const b=-RWY_W/2+3+k*(RWY_W-6)/9; R(Math.min(e-dir*6,e-dir*36),Math.max(e-dir*6,e-dir*36),b-0.9,b+0.9,mark); }
      for(let a=150;a<=450;a+=75) for(const sb of [-1,1]) R(Math.min(e-dir*a,e-dir*(a+22)),Math.max(e-dir*a,e-dir*(a+22)),sb*9-1.1,sb*9+1.1,mark); });
    g.fillStyle=mark; g.font='bold '+Math.round(20*kx)+'px Arial'; g.textAlign='center'; g.textBaseline='middle';
    g.save(); g.translate(X(-RWY_LEN/2+75),Y(0)); g.rotate(-Math.PI/2); g.fillText(num[0],0,0); g.restore();
    g.save(); g.translate(X(RWY_LEN/2-75),Y(0)); g.rotate(Math.PI/2); g.fillText(num[1],0,0); g.restore();
    // team roundel on the apron
    g.fillStyle=teamCol; g.beginPath(); g.arc(X(330),Y(205),30*kx,0,6.283); g.fill(); g.strokeStyle='#e9e3c8'; g.lineWidth=3*kx; g.beginPath(); g.arc(X(330),Y(205),24*kx,0,6.283); g.stroke();
    const tex=new THREE.CanvasTexture(cv); tex.encoding=THREE.sRGBEncoding; tex.anisotropy=16;
    const pm=new THREE.MeshStandardMaterial({map:tex,roughness:0.95,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
    const pB=newB(), y=bs.H+0.07, P=(a,b)=>{ const w=bW(bs,a,b); return [w.x,y,w.z]; };
    quad(pB,P(PAD.a0,PAD.b0),P(PAD.a1,PAD.b0),P(PAD.a1,PAD.b1),P(PAD.a0,PAD.b1),[[0,1],[1,1],[1,0],[0,0]],null,[0,1,0]);
    padMesh[bi]={B:pB,mat:pm};
    // keep trees off the whole airfield
    for(let iz=0;iz<=DIV;iz++) for(let ix=0;ix<=DIV;ix++){ if(padWeight(-HALF+ix*STEP,-HALF+iz*STEP)>0.02) BLK[iz*ROW+ix]=1; }

    // ---- buildings (a = along runway, b = apron side) ----
    const H=bs.H+0.05, pos=(a,b)=>bW(bs,a,b), hy=bs.yaw+Math.PI/2;
    const hangarCols=[0x7d8274,0x6f776a,0x84877a,0x727a70,0x808376].map(HEX);
    [-180,-90,0,90,180].forEach((a,k)=>{ const p=pos(a,300); vault(BK.metal,p.x,H,p.z,64,54,9,7,hy,hangarCols[k]); addColliders(p.x,p.z,64,54,hy); addSolid(p.x,p.z,64,54,hy,H,H+16); });
    { const p=pos(-60,122); boxY(BK.wall,p.x,H,p.z,22,11,90,bs.yaw,tint(WALLS[5],1),4.5,3.4,false); addColliders(p.x,p.z,22,90,bs.yaw); addSolid(p.x,p.z,22,90,bs.yaw,H,H+11); }
    { const p=pos(110,122); boxY(BK.wall,p.x,H,p.z,10,24,10,bs.yaw,tint(WALLS[5],1),4.5,3.4,false);
      boxY(BK.conc,p.x,H+24,p.z,15,5,15,bs.yaw,[0.28,0.4,0.46],4,4,false); boxY(BK.conc,p.x,H+29,p.z,17,0.8,17,bs.yaw,[0.6,0.6,0.58],4,4,false);
      addColliders(p.x,p.z,10,10,bs.yaw); addSolid(p.x,p.z,10,10,bs.yaw,H,H+30); }
    for(let r=0;r<2;r++) for(let k=0;k<3;k++){ const p=pos(-470+k*55,172+r*38); house(p.x,p.z,13,40,6.5,bs.yaw+Math.PI/2,tint(WALLS[k%3],1),ROOFS[2]); }
    for(let r=0;r<2;r++) for(let k=0;k<3;k++){ const p=pos(-420+k*28,296+r*28); cylY(BK.metal,p.x,H,p.z,9,11,[0.78,0.8,0.78],16,6); treeColliders.push({x:p.x,z:p.z,radius:9.4}); addSolid(p.x,p.z,17,17,0,H,H+11); }
    { const p=pos(470,215); boxY(BK.conc,p.x,H,p.z,9,6,9,bs.yaw,[0.8,0.8,0.78],4,4,false); domeY(BK.conc,p.x,H+6,p.z,6.5,[0.92,0.92,0.9]); addColliders(p.x,p.z,9,9,bs.yaw); addSolid(p.x,p.z,9,9,bs.yaw,H,H+12); }
  });

  // ===================================================================================
  //  WATER SURFACES (lakes as polygons at lake level, rivers as ribbons following their own water level)
  // ===================================================================================
  const WB=newB(), UP=[0,1,0], WUV=[[0,0],[1,0],[1,1],[0,1]];
  lakes.forEach(lk=>{
    const ring=[]; for(let i=0;i<=96;i++){ const th=i/96*Math.PI*2, r=1.22*lakeWarp(lk,th), lx=Math.cos(th)*r, lz=Math.sin(th)*r;
      ring.push([lk.x+lx*lk.rx*lk.cs-lz*lk.rz*lk.sn, lk.level, lk.z+lx*lk.rx*lk.sn+lz*lk.rz*lk.cs]); }
    for(let i=0;i<96;i++) quad(WB,[lk.x,lk.level,lk.z],ring[i],ring[i+1],ring[i+1],[[0,0],[1,0],[1,1],[1,1]],null,UP);
  });
  rivers.forEach(r=>{
    const m=r.pts.length;
    for(let i=0;i<m-1;i++){
      const side=k=>{ const p=r.pts[k], a=r.pts[Math.max(0,k-1)], b=r.pts[Math.min(m-1,k+1)], tx=b[0]-a[0], tz=b[1]-a[1], l=Math.hypot(tx,tz)||1, w=r.hw[k]*0.92, y=r.wl[k]+0.05;
        return [[p[0]-tz/l*w,y,p[1]+tx/l*w],[p[0]+tz/l*w,y,p[1]-tx/l*w]]; };
      const A=side(i), Bq=side(i+1);
      quad(WB,A[0],A[1],Bq[1],Bq[0],WUV,null,UP);
    }
  });
  const waterMat=new THREE.MeshStandardMaterial({color:0x2f6a80,transparent:true,opacity:0.86,roughness:0.15,metalness:0.1,vertexColors:true});

  // ===================================================================================
  //  FLUSH THE MERGED MESHES
  // ===================================================================================
  function flush(B,material,shadow){
    if(!B.pos.length) return;
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(B.pos,3)); geo.setAttribute('normal',new THREE.Float32BufferAttribute(B.nor,3));
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(B.uv,2)); geo.setAttribute('color',new THREE.Float32BufferAttribute(B.col,3));
    const m=new THREE.Mesh(geo,material); m.castShadow=!!shadow; m.receiveShadow=true; scene.add(m);
  }
  for(const n in BK) flush(BK[n],mat(n),true);
  padMesh[0]&&flush(padMesh[0].B,padMesh[0].mat); padMesh[1]&&flush(padMesh[1].B,padMesh[1].mat);
  flush(WB,waterMat,false);
  const roadMat=(kind)=>new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,map:canvasTex(64,(g,S)=>{
    if(kind==='asphalt'){ g.fillStyle='#4b4b4d'; g.fillRect(0,0,S,S); speckle(g,S,500,0.2); g.fillStyle='#d8d4c2'; g.fillRect(4,0,2,S); g.fillRect(S-6,0,2,S); g.fillStyle='#d8c348'; g.fillRect(S/2-1,0,2,S/2); }
    else { g.fillStyle='#8a7650'; g.fillRect(0,0,S,S); speckle(g,S,500,0.2); g.fillStyle='rgba(70,55,35,0.45)'; g.fillRect(18,0,6,S); g.fillRect(40,0,6,S); } }),
    polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3});
  flush(roadGeo.asphalt,roadMat('asphalt'),false); flush(roadGeo.dirt,roadMat('dirt'),false);

  // ===================================================================================
  //  TREES, ROCKS, SCRUB (instanced with near/far levels of detail)
  // ===================================================================================
  function geoFrom(parts){
    const pos=[], col=[];
    for(const p of parts) for(let i=0;i<p.v.length;i+=3){ pos.push(p.v[i],p.v[i+1],p.v[i+2]); const s=1+(Math.random()-0.5)*0.16; col.push(p.c[0]*s,p.c[1]*s,p.c[2]*s); }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3)); geo.computeVertexNormals();
    return geo;
  }
  function coneV(r,y0,h,seg,r1){          // cone (or frustum when r1>0), side faces only
    const v=[]; r1=r1||0;
    for(let i=0;i<seg;i++){
      const a0=i/seg*6.2832, a1=(i+1)/seg*6.2832, x0=Math.cos(a0), z0=Math.sin(a0), x1=Math.cos(a1), z1=Math.sin(a1);
      v.push(x0*r,y0,z0*r, x1*r,y0,z1*r, x0*r1,y0+h,z0*r1);
      if(r1>0) v.push(x1*r,y0,z1*r, x1*r1,y0+h,z1*r1, x0*r1,y0+h,z0*r1);
    }
    return v;
  }
  const ICO=(()=>{ const t=(1+Math.sqrt(5))/2, V=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(p=>{const l=Math.hypot(...p);return p.map(c=>c/l);});
    return {V,F:[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]]}; })();
  function blobV(cx,cy,cz,rx,ry,rz,jit){
    const v=[], J=ICO.V.map((p,i)=>1+(ih(i,7)-0.5)*jit);
    for(const f of ICO.F) for(const k of f){ const p=ICO.V[k], j=J[k]; v.push(cx+p[0]*rx*j,cy+p[1]*ry*j,cz+p[2]*rz*j); }
    return v;
  }
  const C_TRUNK=[0.3,0.22,0.15], C_CON=[0.16,0.29,0.17], C_CON2=[0.2,0.34,0.2], C_BRD=[0.28,0.41,0.18], C_BRD2=[0.33,0.46,0.2];
  const conNear=geoFrom([{v:coneV(0.4,0,3,6,0.3),c:C_TRUNK},{v:coneV(3.4,1.8,5.2,7),c:C_CON},{v:coneV(2.7,4.6,4.8,7),c:C_CON2},{v:coneV(1.8,7.6,4.6,7),c:C_CON}]);
  const conFar=geoFrom([{v:coneV(2.8,1.5,11,5),c:C_CON}]);
  const brdNear=geoFrom([{v:coneV(0.45,0,4,6,0.32),c:C_TRUNK},{v:blobV(0,6.2,0,4.3,3.4,4.3,0.4),c:C_BRD},{v:blobV(1.8,5.0,0.8,2.8,2.4,2.8,0.4),c:C_BRD2},{v:blobV(-1.6,5.4,-1,2.9,2.5,2.9,0.4),c:C_BRD}]);
  const brdFar=geoFrom([{v:blobV(0,5.8,0,4.2,3.6,4.2,0.2),c:C_BRD}]);
  const rockNear=geoFrom([{v:blobV(0,0.5,0,1,0.8,1,0.5),c:[0.5,0.48,0.44]}]);
  const scrubNear=geoFrom([{v:blobV(0,0.45,0,1,0.55,1,0.5),c:[0.5,0.52,0.3]}]);

  const conifers=[], broads=[], rocks=[], scrubs=[];
  const CS=16*BIG, DENS=BIG*BIG;   // DENS keeps trees per square km the same when the grid spacing widens
  for(let gz=-HALF+CS;gz<HALF-CS;gz+=CS) for(let gx=-HALF+CS;gx<HALF-CS;gx+=CS){
    const x=gx+rr(-6,6)*BIG, z=gz+rr(-6,6)*BIG;
    if(blockedCell(x,z)) continue;
    const h=terrainHeightAt(x,z), wl=waterLevelAt(x,z);
    if(wl>-1e8 && h<wl+1.8) continue;
    const m=mountainAmt(x,z), fo=forestMask(x,z,h,m);
    if(fo>0.05 && rnd()<fo*0.5*DENS){
      if(slopeAt(x,z)>0.55) continue;
      const con=h>46||fbm(x/400,z/400,2)>0.58, s=rr(0.8,1.5);
      (con?conifers:broads).push({x,y:h-0.15,z,ry:rnd()*6.28,s,sy:rr(0.9,1.2),k:rnd()});
      treeColliders.push({x,z,radius:0.7*s});
    } else if(fo<0.08 && rnd()<0.003*DENS*(1-aridMask(x,z))){      // lone trees out in the fields
      if(slopeAt(x,z)>0.4) continue;
      const s=rr(0.9,1.4); broads.push({x,y:h-0.15,z,ry:rnd()*6.28,s,sy:1,k:rnd()}); treeColliders.push({x,z,radius:0.7*s});
    } else if(fo<0.2 && scrubs.length<9000*K*K && rnd()<0.045*DENS*(0.4+aridMask(x,z)*0.9+(1-farmRaw(x,z))*0.5)){
      scrubs.push({x,y:h,z,ry:rnd()*6.28,s:rr(0.6,1.4),k:rnd()});
    }
  }
  for(let gz=-HALF+40;gz<HALF-40;gz+=48) for(let gx=-HALF+40;gx<HALF-40;gx+=48){
    const x=gx+rr(-20,20), z=gz+rr(-20,20);
    if(blockedCell(x,z) || waterLevelAt(x,z)>-1e8) continue;
    const h=terrainHeightAt(x,z), m=mountainAmt(x,z), sl=slopeAt(x,z), p=0.05+m*0.5+clamp(sl-0.2,0,0.5)*0.9+aridMask(x,z)*0.12;
    if(rnd()<p){ const s=rr(1.4,3.2)*(1+m*1.6); rocks.push({x,y:h,z,ry:rnd()*6.28,s,sy:rr(0.6,1.1),k:rnd()}); if(s>2.4) treeColliders.push({x,z,radius:s*0.8}); }
  }
  const mkLayer=(items,near,far,col,sc)=>({items,near,far,cast:false,
    mat:new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}),
    place:(d,t)=>{ d.position.set(t.x,t.y,t.z); d.rotation.set(0,t.ry,0); d.scale.set(t.s*(sc||1),t.s*(sc||1)*t.sy,t.s*(sc||1)); },
    color:t=>new THREE.Color(0.85+t.k*0.3,0.85+t.k*0.25,0.85+t.k*0.2)});
  const treeLOD=window.createLODInstances(scene,{cell:400,nearDist:1300,cullDist:4800,sphereY:30,sphereR:40,
    layers:[mkLayer(conifers,conNear,conFar),mkLayer(broads,brdNear,brdFar)]});
  const rockLOD=window.createLODInstances(scene,{cell:400,nearDist:1800,cullDist:3200,sphereY:10,sphereR:20,
    layers:[mkLayer(rocks,rockNear,null)]});
  const scrubLOD=window.createLODInstances(scene,{cell:400,nearDist:600,cullDist:600,sphereY:2,sphereR:10,
    layers:[mkLayer(scrubs,scrubNear,null)]});

  // ===================================================================================
  //  MINIMAP IMAGE (north-up like the game's minimap, shaded relief + water + roads + runways)
  // ===================================================================================
  const MN=G>12000?768:512, miniCanvas=document.createElement('canvas'); miniCanvas.width=miniCanvas.height=MN;
  { const mg=miniCanvas.getContext('2d'), img=mg.createImageData(MN,MN), kk=G/MN;
    const cell=(x,z)=>clamp(Math.round((z+HALF)/STEP),0,DIV)*ROW+clamp(Math.round((x+HALF)/STEP),0,DIV);
    for(let j=0;j<MN;j++) for(let i=0;i<MN;i++){
      const x=(MN/2-i-0.5)*kk, z=(MN/2-j-0.5)*kk, c=cell(x,z), ix=c%ROW, iz=(c-ix)/ROW;
      const hx=(HM[iz*ROW+Math.min(DIV,ix+2)]-HM[iz*ROW+Math.max(0,ix-2)])/(4*STEP), hz=(HM[Math.min(DIV,iz+2)*ROW+ix]-HM[Math.max(0,iz-2)*ROW+ix])/(4*STEP);
      const sh=clamp(1+(hx-hz)*2.6,0.62,1.35); let r=COL[c*3], g=COL[c*3+1], b=COL[c*3+2];
      if(WLG[c]>-1e8 && WLG[c]-HM[c]>0.3){ const d=clamp((WLG[c]-HM[c])/9,0,1); r=0.2-0.08*d; g=0.45-0.14*d; b=0.58-0.12*d; }
      const o=(j*MN+i)*4; img.data[o]=clamp(r*sh*255*1.05,0,255); img.data[o+1]=clamp(g*sh*255*1.05,0,255); img.data[o+2]=clamp(b*sh*255*1.05,0,255); img.data[o+3]=255;
    }
    mg.putImageData(img,0,0);
    const MX=x=>MN/2-x/kk, MZ=z=>MN/2-z/kk;
    mg.lineCap='round'; mg.lineJoin='round';
    for(const rl of roadLines){ mg.strokeStyle=rl.kind==='asphalt'?'rgba(230,224,196,0.95)':'rgba(176,152,108,0.9)'; mg.lineWidth=rl.kind==='asphalt'?2.4:1.3; mg.beginPath(); rl.pts.forEach((p,i)=>i?mg.lineTo(MX(p[0]),MZ(p[1])):mg.moveTo(MX(p[0]),MZ(p[1]))); mg.stroke(); }
    bases.forEach((bs,bi)=>{
      const p0=bW(bs,-RWY_LEN/2,0), p1=bW(bs,RWY_LEN/2,0), ap=bW(bs,150,215), tc=bi===0?'#59b0ff':'#ff6a52';
      mg.strokeStyle='#1c1c1c'; mg.lineWidth=7; mg.beginPath(); mg.moveTo(MX(p0.x),MZ(p0.z)); mg.lineTo(MX(p1.x),MZ(p1.z)); mg.stroke();
      mg.strokeStyle='#f4f1e3'; mg.lineWidth=4; mg.beginPath(); mg.moveTo(MX(p0.x),MZ(p0.z)); mg.lineTo(MX(p1.x),MZ(p1.z)); mg.stroke();
      mg.fillStyle='rgba(150,148,140,0.95)'; const aw=bW(bs,-300,140), ae=bW(bs,420,262); mg.fillRect(Math.min(MX(aw.x),MX(ae.x)),Math.min(MZ(aw.z),MZ(ae.z)),Math.abs(MX(aw.x)-MX(ae.x)),Math.abs(MZ(aw.z)-MZ(ae.z)));
      mg.strokeStyle=tc; mg.lineWidth=2.5; mg.beginPath(); mg.arc(MX(bs.x+bs.s*60),MZ(bs.z),30,0,6.283); mg.stroke();
    });
  }

  // ===================================================================================
  //  SPAWNS: each team starts lined up on its own runway, facing the enemy airfield
  // ===================================================================================
  const slotOrder=[[0,-560],[-14,-560],[14,-560],[0,-536],[-14,-536],[14,-536],[0,-512],[-14,-512],[14,-512]];
  function spawnSlots(team){
    const bs=team==='red'?bases[1]:bases[0];
    return slotOrder.map(([b,a])=>{ const p=bW(bs,a,b); return {x:p.x,z:p.z,yaw:bs.yaw}; });
  }
  const updateLOD=cam=>{ terrainLOD.update(cam); treeLOD.update(cam); rockLOD.update(cam); scrubLOD.update(cam); };
  return {terrainHeightAt,treeColliders,updateLOD,solidAt,blockedAt,spawnSlots,minimapImage:miniCanvas,
    airbases:bases.map(bs=>({team:bs.team,x:bs.x,z:bs.z,yaw:bs.yaw,length:RWY_LEN,width:RWY_W,elevation:bs.H})),
    minimapFeatures:[]};
};

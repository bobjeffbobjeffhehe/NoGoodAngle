// Town & plains map: rolling farmland with fields, hedgerows and tree lines around a large
// European-style town (church on a hill, town hall, plaza, industrial yard). Many buildings are
// damaged or destroyed and smoke. Everything is procedural: no external assets.
window.createTownMap = function(scene, groundSize){
  const THREE = window.THREE;
  const G = groundSize, HALF = G/2;
  let seed = 740219;
  const rnd = () => { seed = (seed*1664525 + 1013904223) >>> 0; return seed/4294967296; };
  const rr = (a,b) => a + rnd()*(b-a);
  const ri = (a,b) => Math.floor(rr(a,b+1));
  const pick = arr => arr[Math.floor(rnd()*arr.length)];
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const lerp = (a,b,t) => a+(b-a)*t;
  const sstep = (x,a,b) => { const t = clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); };
  const vhash = (a,b) => { const n = Math.sin(a*127.1+b*311.7)*43758.5453; return n-Math.floor(n); };
  function vnoise(x,z){
    const xi=Math.floor(x), zi=Math.floor(z), fx=x-xi, fz=z-zi, u=fx*fx*(3-2*fx), v=fz*fz*(3-2*fz);
    return vhash(xi,zi)*(1-u)*(1-v)+vhash(xi+1,zi)*u*(1-v)+vhash(xi,zi+1)*(1-u)*v+vhash(xi+1,zi+1)*u*v;
  }
  const fbm = (x,z) => vnoise(x,z)*0.6 + vnoise(x*2.13+5.2,z*2.13+1.7)*0.4;

  // =====================================================================================
  //  TERRAIN BASE: rolling plains, a flattened town plateau, a church hill, a raised rim
  // =====================================================================================
  const TOWN = {hx:205, hz:200};
  const townD = (x,z) => Math.hypot(Math.max(0,Math.abs(x)-TOWN.hx), Math.max(0,Math.abs(z)-TOWN.hz));
  const townW = (x,z) => 1 - sstep(townD(x,z),0,75);
  const hills = [];
  for(let i=0;i<24;i++){
    let x=0,z=0,t=0;
    do{ x=rr(-HALF+30,HALF-30); z=rr(-HALF+30,HALF-30); t++; }while(townD(x,z)<25 && t<60);
    hills.push({x,z,rx:rr(45,115),rz:rr(45,115),h:rr(5,19)});
  }
  hills.push({x:-300,z:-390,rx:170,rz:38,h:13},{x:330,z:350,rx:150,rz:42,h:12},{x:-360,z:300,rx:60,rz:120,h:14});
  function plainsH(x,z){
    let y = 2.4*Math.sin(x*0.0105+0.8*Math.sin(z*0.0068)) + 1.7*Math.cos(z*0.0128-x*0.0049) + 0.9*Math.sin((x+z)*0.0245+1.3);
    for(const h of hills){
      const dx=(x-h.x)/h.rx, dz=(z-h.z)/h.rz, e=dx*dx+dz*dz;
      if(e<9) y += h.h*Math.exp(-1.6*e);
    }
    y += (vnoise(x*0.085,z*0.085)-0.5)*1.5 + (vnoise(x*0.27+11,z*0.27-7)-0.5)*0.5 + (vnoise(x*0.6,z*0.6)-0.5)*0.18;
    const ed = HALF - Math.max(Math.abs(x),Math.abs(z));
    y += 9*sstep(60-ed,0,60);
    return y;
  }
  const CH = {x:-95, z:-88}; // church hill
  function townBase(x,z){
    return 3.2 + 0.0075*x - 0.005*z + (vnoise(x*0.04,z*0.04)-0.5)*0.5 +
      6.5*Math.exp(-((x-CH.x)*(x-CH.x)+(z-CH.z)*(z-CH.z))/(2*46*46));
  }
  function baseHeight(x,z){
    const w = townW(x,z), p = plainsH(x,z);
    return w<=0 ? p : lerp(p,townBase(x,z),w);
  }

  // =====================================================================================
  //  BUILDING PLAN (positions and damage are decided first so terrain can follow them)
  // =====================================================================================
  const GRID = 32, gkey = (ix,iz) => (ix+100)*1000+(iz+100);
  const grid = new Map();
  const buildings = [];
  function gridAdd(b){
    const r = b.rad + 12;
    for(let ix=Math.floor((b.x-r)/GRID); ix<=Math.floor((b.x+r)/GRID); ix++)
      for(let iz=Math.floor((b.z-r)/GRID); iz<=Math.floor((b.z+r)/GRID); iz++){
        const k=gkey(ix,iz); let a=grid.get(k); if(!a){a=[];grid.set(k,a);} a.push(b);
      }
  }
  function localOf(b,x,z){ const dx=x-b.x, dz=z-b.z; return [dx*b.cos-dz*b.sin, dx*b.sin+dz*b.cos]; }
  function insideAny(x,z,margin){
    const cell = grid.get(gkey(Math.floor(x/GRID),Math.floor(z/GRID)));
    if(!cell) return false;
    for(const b of cell){
      const [lx,lz] = localOf(b,x,z);
      if(Math.abs(lx)<b.w/2+margin && Math.abs(lz)<b.d/2+margin) return true;
    }
    return false;
  }
  function overlapsAny(x,z,hx,hz,margin){
    for(const b of buildings){
      const bx = Math.abs(b.sin)>0.5 ? b.d/2 : b.w/2, bz = Math.abs(b.sin)>0.5 ? b.w/2 : b.d/2;
      if(Math.abs(x-b.x)<hx+bx+margin && Math.abs(z-b.z)<hz+bz+margin) return true;
    }
    return false;
  }
  const PLASTER=[[0.93,0.89,0.78],[0.9,0.8,0.6],[0.76,0.8,0.74],[0.88,0.86,0.82],[0.92,0.72,0.6],[0.8,0.76,0.64],[0.72,0.74,0.8],[0.85,0.83,0.7]];
  const ROOFCOL={tile:[[0.86,0.5,0.36],[0.78,0.42,0.3],[0.66,0.38,0.3],[0.55,0.34,0.28]],slate:[[0.3,0.32,0.36],[0.26,0.28,0.31]],metal:[[0.8,0.76,0.7],[0.7,0.62,0.55]],tar:[[0.5,0.5,0.52]]};
  const FWD = (b,lx,lz) => [b.x+lx*b.cos+lz*b.sin, b.z-lx*b.sin+lz*b.cos];

  function newB(o){
    const b = Object.assign({yaw:0,level:0,floors:3,fh:3.4,bw:3.4,style:'plaster',roof:'gable',roofMat:'tile',pitch:0.62,
      mounds:[],holes:[],chimneys:true,shop:false,quoins:false,burnt:false,smoke:false,dormers:false,name:''},o);
    b.cos=Math.cos(b.yaw); b.sin=Math.sin(b.yaw);
    b.seed = rnd()*100;
    b.rad = Math.hypot(b.w/2,b.d/2);
    let sum=0,n=0;
    for(const fx of [-1,0,1]) for(const fz of [-1,0,1]){ const p=FWD(b,fx*b.w/2,fz*b.d/2); sum+=baseHeight(p[0],p[1]); n++; }
    b.P = sum/n;
    b.hEave = b.floors*b.fh;
    b.parapet = b.roof==='flat' ? 0.9 : 0;
    b.hTop = b.hEave + b.parapet;
    b.ridgeX = b.w>=b.d;
    if(b.roof==='hip'||b.roof==='pyramid') b.level = 0;
    if(!b.tint){
      b.tint = b.style==='brick' ? [rr(0.9,1),rr(0.88,0.98),rr(0.85,0.96)] :
               (b.style==='plaster' ? pick(PLASTER).map(v=>clamp(v*rr(0.93,1.04),0,1)) : [rr(0.85,0.95),rr(0.82,0.92),rr(0.76,0.86)]);
    }
    if(!b.roofCol){ b.roofCol = pick(ROOFCOL[b.roofMat]||ROOFCOL.tile).map(v=>clamp(v*rr(0.9,1.08),0,1)); }
    b.burnt = b.level>0 && rnd()<0.7;
    b.variant = ri(0,2);
    // blast holes: where walls are knocked down
    if(b.level>0){
      const hw=b.w/2, hd=b.d/2, nh = b.level===2 ? (rnd()<0.55?2:1) : 1;
      for(let k=0;k<nh;k++){
        const sx=rnd()<0.5?-1:1, sz=rnd()<0.5?-1:1;
        const hx=sx*hw*rr(0.2,0.95), hz=sz*hd*rr(0.2,1.0);
        let r0,r1,low;
        if(b.level===2){ r0=Math.min(hw,hd)*rr(0.45,0.85); r1=r0+rr(4,7); low=rr(0.5,1.5); }
        else { r0=rr(1.8,3.4); r1=r0+rr(3,5); low=b.hEave*rr(0.35,0.7); }
        b.holes.push({x:hx,z:hz,r0,r1,low});
        const wp=FWD(b,hx,hz);
        b.mounds.push({x:wp[0],z:wp[1],r:Math.max(4,r1*0.7),h:rr(0.7,1.3)*(b.level===2?1:0.45)});
      }
    }
    buildings.push(b); gridAdd(b);
    return b;
  }
  function dmgH(b,lx,lz){
    let h=b.hTop;
    for(const o of b.holes){
      const d=Math.hypot(lx-o.x,lz-o.z); if(d>=o.r1) continue;
      const t=sstep(d,o.r0,o.r1);
      let hh=lerp(o.low,b.hTop,t) + (vnoise(lx*0.55+b.seed,lz*0.55-b.seed)-0.5)*3.2*Math.sin(Math.PI*t);
      hh=clamp(hh,o.low*0.6,b.hTop);
      if(hh<h) h=hh;
    }
    return h;
  }

  // ---- street grid ----
  const NSX=[-140,-50,40,130], EWZ=[-130,-45,40,125];
  const xe=[-205,-140,-50,40,130,205], ze=[-200,-130,-45,40,125,200];
  const OUT=8.7; // street centre line to the building line (half carriageway + pavement)
  const blockKind=(i,j)=>{
    if(i===2&&j===2) return 'plaza'; if(i===1&&j===1) return 'church'; if(i===4&&j===4) return 'industrial';
    if(i===1&&j===3) return 'ruins'; if(i===3&&j===1) return 'park';
    return (i===0||i===4||j===0||j===4) ? 'sparse' : 'dense';
  };
  const DMG = {dense:[0.55,0.25,0.2], ruins:[0.1,0.35,0.55], sparse:[0.68,0.2,0.12], industrial:[0.5,0.25,0.25]};
  const pickLevel = kind => { const p=DMG[kind]||DMG.dense, r=rnd(); return r<p[0]?0:(r<p[0]+p[1]?1:2); };

  function houseSpec(kind,i,j,side){
    const central = Math.abs(i-2)+Math.abs(j-2)<=2;
    let floors,w,d,roof,style;
    if(kind==='sparse'){ floors=ri(1,2); w=rr(9,13); d=rr(8,10.5); roof='gable'; style=rnd()<0.8?'plaster':'brick'; }
    else {
      floors = central ? ri(3,5) : ri(2,4); d=rr(10.5,13.5);
      w = floors>=4 ? rr(14,22) : rr(9,17);
      roof = (floors>=4 || rnd()<0.18) ? 'flat' : 'gable'; style = rnd()<0.62?'plaster':'brick';
    }
    const level = pickLevel(kind);
    const nearCenter = Math.abs(i-2)<=1 && Math.abs(j-2)<=1;
    const roofMat = roof==='flat'?'tar':(rnd()<0.82?'tile':'slate');
    return {w,d,floors,roof,style,level,roofMat,shop:nearCenter&&rnd()<0.7,quoins:style==='plaster'&&rnd()<0.4,
            dormers:roof==='gable'&&floors>=2&&rnd()<0.6,fh:floors>=4?3.3:3.4};
  }
  function fillRow(side,x0,z0,x1,z1,kind,i,j,inset){
    const horiz = side==='N'||side==='S';
    const sparse = kind==='sparse';
    const start = horiz ? x0 : z0+inset, end = horiz ? x1 : z1-inset;
    let cur = start;
    while(cur < end-6){
      const spec = houseSpec(kind,i,j,side);
      let ww = Math.min(spec.w, end-cur);
      if(ww < spec.w*0.7){ break; }
      spec.w = ww;
      const mid = cur+ww/2, d = spec.d;
      const gap = sparse ? rr(4,13) : (rnd()<0.2 ? rr(1.5,4) : 0.7);
      if(rnd() >= (sparse?0.42:0.04)){
        let x,z,yaw;
        if(side==='N'){ x=mid; z=z0+d/2; yaw=Math.PI; }
        else if(side==='S'){ x=mid; z=z1-d/2; yaw=0; }
        else if(side==='W'){ x=x0+d/2; z=mid; yaw=-Math.PI/2; }
        else { x=x1-d/2; z=mid; yaw=Math.PI/2; }
        const hx = horiz? ww/2 : d/2, hz = horiz? d/2 : ww/2;
        if(!overlapsAny(x,z,hx,hz,0.3)){
          const b = newB(Object.assign(spec,{x,z,yaw}));
          b.facingSide = side;
        }
      }
      cur += ww+gap;
    }
  }
  // ---- fill the blocks ----
  for(let i=0;i<5;i++) for(let j=0;j<5;j++){
    const x0=xe[i]+(i>0?OUT:5), x1=xe[i+1]-(i<4?OUT:5), z0=ze[j]+(j>0?OUT:5), z1=ze[j+1]-(j<4?OUT:5);
    const kind=blockKind(i,j), cx=(x0+x1)/2, cz=(z0+z1)/2;
    if(kind==='plaza' || kind==='park') continue;
    if(kind==='church'){
      // nave runs north-south on the hill, tower at the street end, bell spire above
      const nave=newB({x:cx,z:cz-4,yaw:0,w:12,d:30,floors:1,fh:9.5,bw:5,style:'church',roof:'gable',roofMat:'slate',pitch:0.95,
        level:1,tint:[0.8,0.76,0.68],chimneys:false,name:'nave'});
      nave.holes=[{x:-1.5,z:-8,r0:5,r1:10.5,low:3.2}];
      nave.mounds=[{x:cx-1.5,z:cz-12,r:9,h:1.1}];
      newB({x:cx,z:cz+14.5,yaw:0,w:7,d:7,floors:3,fh:5.5,bw:7,style:'tower',roof:'pyramid',roofMat:'slate',pitch:2.4,
        tint:[0.8,0.76,0.68],chimneys:false,name:'tower'});
      fillRow('W',x0,z0,x1,z1,'sparse',i,j,4); fillRow('E',x0,z0,x1,z1,'sparse',i,j,4);
      continue;
    }
    if(kind==='industrial'){
      newB({x:cx-4,z:cz-20,yaw:0,w:40,d:20,floors:1,fh:8.5,bw:5.5,style:'hall',roof:'gable',roofMat:'metal',pitch:0.3,
        level:2,tint:[0.82,0.78,0.72],chimneys:false,name:'hall',force:true});
      newB({x:cx+2,z:cz+18,yaw:0,w:36,d:18,floors:1,fh:8,bw:5.5,style:'hall',roof:'gable',roofMat:'metal',pitch:0.3,
        level:1,tint:[0.8,0.76,0.7],chimneys:false,name:'hall',force:true});
      newB({x:cx+24,z:cz-5,yaw:Math.PI/2,w:18,d:11,floors:2,fh:4,bw:4,style:'brick',roof:'flat',roofMat:'tar',level:0,chimneys:false});
      continue;
    }
    if(kind==='dense' && i===2 && j===1){
      // town hall facing the plaza
      newB({x:cx,z:z1-9,yaw:0,w:36,d:17,floors:3,fh:4.2,bw:4.5,style:'plaster',roof:'hip',roofMat:'slate',pitch:0.55,level:0,
        tint:[0.9,0.86,0.74],shop:false,quoins:true,chimneys:false,name:'hall'});
      fillRow('N',x0,z0,x1,z1,kind,i,j,0); fillRow('W',x0,z0,x1,z1,kind,i,j,14.5); fillRow('E',x0,z0,x1,z1,kind,i,j,14.5);
      continue;
    }
    const inset=14.5;
    fillRow('N',x0,z0,x1,z1,kind,i,j,0); fillRow('S',x0,z0,x1,z1,kind,i,j,0);
    fillRow('W',x0,z0,x1,z1,kind,i,j,inset); fillRow('E',x0,z0,x1,z1,kind,i,j,inset);
    // back-yard buildings
    const nInner = kind==='sparse'?ri(0,2):ri(1,3);
    for(let k=0;k<nInner;k++){
      for(let a=0;a<14;a++){
        const small = rnd()<0.55 || kind==='sparse';
        const w=small?rr(4,7):rr(13,19), d=small?rr(3.5,5):rr(10,12);
        const x=rr(x0+inset+w/2,x1-inset-w/2), z=rr(z0+inset+d/2,z1-inset-d/2);
        if(x1-x0<2*inset+w || overlapsAny(x,z,w/2,d/2,small?2.5:5)) continue;
        newB(small ? {x,z,yaw:pick([0,Math.PI/2]),w,d,floors:1,fh:2.8,style:'brick',roof:'gable',roofMat:rnd()<0.5?'metal':'tar',pitch:0.3,
                      level:pickLevel(kind)===2?1:0,chimneys:false}
                   : Object.assign(houseSpec(kind,i,j,'N'),{x,z,yaw:pick([0,Math.PI/2]),w,d}));
        break;
      }
    }
  }
  // ---- farms on the plains ----
  const farms=[];
  for(let k=0,tries=0;k<5 && tries<400;tries++){
    const fx=rr(-HALF+130,HALF-130), fz=rr(-HALF+130,HALF-130);
    if(townD(fx,fz)<120) continue;
    if(farms.some(f=>Math.hypot(f.x-fx,f.z-fz)<260)) continue;
    const sl=Math.abs(plainsH(fx+12,fz)-plainsH(fx-12,fz))+Math.abs(plainsH(fx,fz+12)-plainsH(fx,fz-12));
    if(sl>3.2) continue;
    const psi=rr(0,Math.PI*2), cs=Math.cos(psi), sn=Math.sin(psi);
    const put=(lx,lz,o)=>{ const x=fx+lx*cs+lz*sn, z=fz-lx*sn+lz*cs; return newB(Object.assign({x,z,yaw:psi},o)); };
    const bigFire = k===0;
    put(-15,-5,{w:12,d:9,floors:2,fh:3.1,style:'plaster',roof:'gable',roofMat:'tile',dormers:false,level:rnd()<0.35?1:0,shop:false});
    put(14,-3,{w:24,d:12,floors:1,fh:6,bw:4,style:'barn',roof:'gable',roofMat:'metal',pitch:0.5,level:bigFire?2:(rnd()<0.3?1:0),chimneys:false,tint:[0.92,0.88,0.82]});
    put(-2,17,{w:11,d:6,floors:1,fh:3,bw:3.6,style:'barn',roof:'gable',roofMat:'tar',pitch:0.4,level:0,chimneys:false,tint:[0.85,0.8,0.74]});
    farms.push({x:fx,z:fz}); k++;
  }

  // =====================================================================================
  //  ROADS, CRATERS, FINAL TERRAIN HEIGHT FUNCTION
  // =====================================================================================
  const roads = [];
  for(const x of NSX) roads.push({pts:[[x,-TOWN.hz-6],[x,TOWN.hz+6]],w:11,type:'asphalt'});
  for(const z of EWZ) roads.push({pts:[[-TOWN.hx-6,z],[TOWN.hx+6,z]],w:11,type:'asphalt'});
  function wander(x0,z0,x1,z1,amp){
    const pts=[], n=12, ph=rr(0,6.28), nx=-(z1-z0), nz=(x1-x0), l=Math.hypot(nx,nz);
    for(let i=0;i<=n;i++){ const t=i/n, off=amp*Math.sin(t*Math.PI*1.4+ph)*Math.min(1,t*3); pts.push([lerp(x0,x1,t)+nx/l*off, lerp(z0,z1,t)+nz/l*off]); }
    return pts;
  }
  for(const x of NSX){
    roads.push({pts:wander(x,-TOWN.hz-6,x+rr(-50,50),-HALF,rr(15,45)),w:6.5,type:'dirt',country:true});
    roads.push({pts:wander(x,TOWN.hz+6,x+rr(-50,50),HALF,rr(15,45)),w:6.5,type:'dirt',country:true});
  }
  for(const z of EWZ){
    roads.push({pts:wander(-TOWN.hx-6,z,-HALF,z+rr(-50,50),rr(15,45)),w:6.5,type:'dirt',country:true});
    roads.push({pts:wander(TOWN.hx+6,z,HALF,z+rr(-50,50),rr(15,45)),w:6.5,type:'dirt',country:true});
  }
  let roadSegs = [];
  function rebuildSegs(){
    roadSegs=[];
    for(const r of roads) for(let i=0;i<r.pts.length-1;i++){
      const a=r.pts[i], b=r.pts[i+1];
      roadSegs.push({ax:a[0],az:a[1],bx:b[0],bz:b[1],hw:r.w/2+(r.type==='asphalt'?3:0.8)});
    }
  }
  rebuildSegs();
  function roadClear(x,z){
    let m=1e9;
    for(const s of roadSegs){
      const dx=s.bx-s.ax, dz=s.bz-s.az, t=clamp(((x-s.ax)*dx+(z-s.az)*dz)/(dx*dx+dz*dz),0,1);
      const d=Math.hypot(x-(s.ax+dx*t),z-(s.az+dz*t))-s.hw; if(d<m) m=d;
    }
    return m;
  }
  function nearestRoadPoint(x,z){
    let best=null,bd=1e9;
    for(const s of roadSegs){
      const dx=s.bx-s.ax, dz=s.bz-s.az, t=clamp(((x-s.ax)*dx+(z-s.az)*dz)/(dx*dx+dz*dz),0,1);
      const px=s.ax+dx*t, pz=s.az+dz*t, d=Math.hypot(x-px,z-pz); if(d<bd){bd=d;best=[px,pz];}
    }
    return best;
  }
  for(const f of farms){ const p=nearestRoadPoint(f.x,f.z); if(p) roads.push({pts:[[f.x,f.z],[(f.x+p[0])/2+rr(-10,10),(f.z+p[1])/2+rr(-10,10)],p],w:4.5,type:'dirt',track:true}); }
  rebuildSegs();

  const craters = [];
  function addCrater(x,z,r,d){ if(insideAny(x,z,r+2.5)) return false; craters.push({x,z,r,d}); return true; }
  for(let n=0,t=0;n<46 && t<400;t++){
    const x=rr(-HALF+30,HALF-30), z=rr(-HALF+30,HALF-30);
    if(townD(x,z)<30) continue;
    if(addCrater(x,z,rr(2.8,6.5),rr(0.7,1.8))) n++;
  }
  for(let n=0,t=0;n<26 && t<300;t++){
    const r=roads[ri(0,7)], horiz=r.pts[0][1]===r.pts[1][1];
    const along=rr(-190,190), off=rr(-4.5,4.5);
    const x=horiz?along:r.pts[0][0]+off, z=horiz?r.pts[0][1]+off:along;
    if(addCrater(x,z,rr(2,4.2),rr(0.5,1.2))) n++;
  }
  function terrainExact(x,z){
    let y=baseHeight(x,z);
    const cell=grid.get(gkey(Math.floor(x/GRID),Math.floor(z/GRID)));
    if(cell) for(const b of cell){
      const dx=x-b.x, dz=z-b.z;
      const lx=dx*b.cos-dz*b.sin, lz=dx*b.sin+dz*b.cos;
      const ax=Math.abs(lx)-b.w/2, az=Math.abs(lz)-b.d/2;
      const dist=Math.hypot(Math.max(ax,0),Math.max(az,0));
      if(dist<4.5) y=lerp(y,b.P,1-sstep(dist,0.2,4.5));
      for(const m of b.mounds){
        const d2=((x-m.x)*(x-m.x)+(z-m.z)*(z-m.z))/(m.r*m.r);
        if(d2<4) y+=m.h*Math.exp(-d2*1.6);
      }
    }
    for(const c of craters){
      const dx=x-c.x, dz=z-c.z, R=c.r*1.5;
      if(dx>R||dx<-R||dz>R||dz<-R) continue;
      const q=Math.sqrt(dx*dx+dz*dz)/c.r;
      if(q<1) y-=c.d*(1-q*q); else if(q<1.5) y+=c.d*0.22*Math.sin(Math.PI*(q-1)/0.5);
    }
    return y;
  }

  // Heights are baked once into a grid (same grid as the ground mesh), so the many per-frame lookups the game
  // makes (suspension, camera, shells, bots) are a cheap bilinear sample instead of re-running all the maths.
  const HDIV=440, HSTEP=G/HDIV, HROW=HDIV+1, HM=new Float32Array(HROW*HROW);
  for(let iz=0;iz<=HDIV;iz++) for(let ix=0;ix<=HDIV;ix++) HM[iz*HROW+ix]=terrainExact(-HALF+ix*HSTEP,-HALF+iz*HSTEP);
  function terrainHeightAt(x,z){
    const fx=clamp((x+HALF)/HSTEP,0,HDIV-1e-4), fz=clamp((z+HALF)/HSTEP,0,HDIV-1e-4), ix=fx|0, iz=fz|0, tx=fx-ix, tz=fz-iz, i=iz*HROW+ix;
    return (HM[i]*(1-tx)+HM[i+1]*tx)*(1-tz)+(HM[i+HROW]*(1-tx)+HM[i+HROW+1]*tx)*tz;
  }

  // ---- collision circles (the game treats these like tree trunks) ----
  const treeColliders = [];
  for(const b of buildings){
    const long=Math.max(b.w,b.d), short=Math.min(b.w,b.d), r=short/2+0.35, alongX=b.w>=b.d;
    const n=Math.max(1,Math.ceil((long-2*r)/(r*0.8))+1);
    for(let k=0;k<n;k++){
      const t = n===1 ? 0 : -(long/2-r)+(long-2*r)*k/(n-1);
      const lx=alongX?t:0, lz=alongX?0:t;
      if(b.level>0 && dmgH(b,lx,lz)<2.0) continue;
      const p=FWD(b,lx,lz); treeColliders.push({x:p[0],z:p[1],radius:r});
    }
  }

  // ---- projectile test: shells burst on walls and roofs ----
  function roofRise(b,lx,lz){
    if(b.roof==='flat') return 0;
    if(b.roof==='gable'){ const Lc=b.ridgeX?b.d:b.w, c=b.ridgeX?lz:lx; return Math.max(0,(Lc/2)*b.pitch*(1-Math.abs(c)/(Lc/2))); }
    const k=Math.max(Math.abs(lx)/(b.w/2),Math.abs(lz)/(b.d/2)), Hr=Math.min(b.w,b.d)/2*b.pitch;
    return Math.max(0,Hr*(1-k));
  }
  function solidAt(x,y,z){
    const cell=grid.get(gkey(Math.floor(x/GRID),Math.floor(z/GRID)));
    if(!cell) return false;
    for(const b of cell){
      const [lx,lz]=localOf(b,x,z);
      if(Math.abs(lx)>b.w/2||Math.abs(lz)>b.d/2) continue;
      const h=dmgH(b,lx,lz);
      const top = h>=b.hEave-0.3 ? h+roofRise(b,lx,lz) : h;
      if(y<b.P+top && y>b.P-0.5) return true;
    }
    return false;
  }

  // =====================================================================================
  //  FIELDS AND VEGETATION PLAN
  // =====================================================================================
  const FIELD_KINDS = [
    {name:'wheat',   col:'#b39a50', alt:'#a58b45', stripe:'rgba(110,86,30,0.16)', sp:1.3},
    {name:'plough',  col:'#5a4630', alt:'#4a3825', stripe:'rgba(30,20,10,0.34)',  sp:1.0},
    {name:'pasture', col:'#657a3c', alt:'#5a6e35', stripe:'rgba(40,60,20,0.08)',  sp:2.2},
    {name:'stubble', col:'#a08c58', alt:'#92804c', stripe:'rgba(90,70,30,0.2)',   sp:0.8},
    {name:'green',   col:'#7b8e3f', alt:'#6d8038', stripe:'rgba(30,60,15,0.18)',  sp:1.2},
    {name:'rape',    col:'#b9b236', alt:'#a8a22f', stripe:'rgba(90,100,20,0.12)', sp:1.5},
    {name:'fallow',  col:'#7e7448', alt:'#6f673f', stripe:'rgba(50,40,20,0.1)',   sp:2.4}
  ];
  const fields=[];
  { const CS=112;
    for(let gx=-5;gx<=5;gx++) for(let gz=-5;gz<=5;gz++){
      const cx=(gx+0.5)*CS+rr(-14,14), cz=(gz+0.5)*CS+rr(-14,14);
      if(townD(cx,cz)<95 || Math.abs(cx)>HALF-20 || Math.abs(cz)>HALF-20) continue;
      if(rnd()<0.1) continue;
      fields.push({cx,cz,w:CS*rr(0.68,0.92),h:CS*rr(0.68,0.92),rot:rr(-0.16,0.16),kind:pick(FIELD_KINDS),hedge:rnd()<0.5});
    } }

  const trees=[], bushes=[];
  const spotOK=(x,z,m,rc)=>Math.abs(x)<HALF-8&&Math.abs(z)<HALF-8&&roadClear(x,z)>rc&&!insideAny(x,z,m);
  function addTree(x,z,kind){
    const h = kind==='poplar'?rr(14,21):rr(7.5,12.5);
    trees.push({x,z,kind,h,cr:kind==='poplar'?rr(1.6,2.2):h*rr(0.3,0.4)});
  }
  // tree-lined country roads
  for(const r of roads){
    if(!r.country || rnd()<0.45) continue;
    let carry=0;
    for(let i=0;i<r.pts.length-1;i++){
      const a=r.pts[i], b=r.pts[i+1], len=Math.hypot(b[0]-a[0],b[1]-a[1]), nx=-(b[1]-a[1])/len, nz=(b[0]-a[0])/len;
      let s=carry;
      while(s<len){
        const t=s/len, px=lerp(a[0],b[0],t), pz=lerp(a[1],b[1],t);
        if(townD(px,pz)>=30) for(const side of [-1,1]){
          const x=px+nx*side*(r.w/2+4.2), z=pz+nz*side*(r.w/2+4.2);
          if(spotOK(x,z,1,0.6) && rnd()<0.92) addTree(x,z,'poplar');
        }
        s+=rr(8,10.5);
      }
      carry=s-len;
    }
  }
  // copses
  for(let c=0,t=0;c<26 && t<200;t++){
    const cx=rr(-HALF+40,HALF-40), cz=rr(-HALF+40,HALF-40);
    if(townD(cx,cz)<55 || roadClear(cx,cz)<10) continue;
    const R=rr(13,28), n=Math.floor(R*R*rr(0.035,0.06));
    for(let k=0;k<n;k++){
      const a=rr(0,6.283), d=Math.sqrt(rnd())*R, x=cx+Math.cos(a)*d, z=cz+Math.sin(a)*d;
      if(spotOK(x,z,1,2)) addTree(x,z,rnd()<0.12?'poplar':'broad');
    }
    c++;
  }
  // lone trees
  for(let n=0,t=0;n<110 && t<500;t++){
    const x=rr(-HALF+20,HALF-20), z=rr(-HALF+20,HALF-20);
    if(townD(x,z)<35 || !spotOK(x,z,1,3)) continue;
    addTree(x,z,'broad'); n++;
  }
  // hedgerows along some field edges
  for(const f of fields){
    if(!f.hedge) continue;
    const c=Math.cos(f.rot), s=Math.sin(f.rot);
    const P=(lx,lz)=>[f.cx+lx*c+lz*s, f.cz-lx*s+lz*c];
    const corners=[[-f.w/2,-f.h/2],[f.w/2,-f.h/2],[f.w/2,f.h/2],[-f.w/2,f.h/2]];
    for(let e=0;e<4;e++){
      const A=corners[e], B=corners[(e+1)%4], len=Math.hypot(B[0]-A[0],B[1]-A[1]);
      if(rnd()<0.3) continue;
      for(let d=0;d<len;d+=rr(4.5,6.5)){
        const t=d/len, p=P(lerp(A[0],B[0],t),lerp(A[1],B[1],t));
        if(!spotOK(p[0],p[1],0.5,3.2)) continue;
        if(rnd()<0.1) addTree(p[0],p[1],'broad'); else bushes.push({x:p[0],z:p[1],r:rr(1.5,2.4)});
      }
    }
  }
  // farm yards
  for(const f of farms) for(let k=0;k<9;k++){
    const a=rr(0,6.28), d=rr(22,40), x=f.x+Math.cos(a)*d, z=f.z+Math.sin(a)*d;
    if(spotOK(x,z,3,3)) addTree(x,z,'broad');
  }
  // town: avenue trees, park, plaza lawns, courtyards, churchyard
  for(const r of roads){
    if(r.type!=='asphalt') continue;
    const horiz=r.pts[0][1]===r.pts[1][1], cross=horiz?NSX:EWZ;
    for(let s=-196;s<196;s+=rr(12,17)) for(const side of [-1,1]){
      if(rnd()<0.4) continue;
      if(cross.some(c=>Math.abs(s-c)<13)) continue;
      const x=horiz?s:r.pts[0][0]+side*7.2, z=horiz?r.pts[0][1]+side*7.2:s;
      if(spotOK(x,z,0.8,1.0)) addTree(x,z,'broad');
    }
  }
  for(let i=0;i<5;i++) for(let j=0;j<5;j++){
    const kind=blockKind(i,j);
    const x0=xe[i]+(i>0?OUT:5)+3, x1=xe[i+1]-(i<4?OUT:5)-3, z0=ze[j]+(j>0?OUT:5)+3, z1=ze[j+1]-(j<4?OUT:5)-3;
    const n = kind==='park'?46 : kind==='plaza'?0 : kind==='church'?12 : kind==='industrial'?3 : ri(5,9);
    for(let k=0,t=0;k<n && t<n*10;t++){
      const x=rr(x0,x1), z=rr(z0,z1);
      if(spotOK(x,z,2.4,1.5)){ addTree(x,z,rnd()<0.1?'poplar':'broad'); k++; }
    }
  }
  { const pcx=(xe[2]+xe[3])/2, pcz=(ze[2]+ze[3])/2;
    for(const [ox,oz] of [[-24,-20],[24,-20],[-24,22],[24,22],[-12,-28],[12,-28],[-12,30],[12,30],[-30,0],[30,0]])
      addTree(pcx+ox+rr(-1.5,1.5),pcz+oz+rr(-1.5,1.5),'broad'); }

  // tank-sized collision for trunks
  const treeCol = trees.map(t=>({x:t.x,z:t.z,radius:t.kind==='poplar'?0.55:0.7}));
  treeCol.forEach(c=>treeColliders.push(c));
  // hedgehog anti-tank obstacles on the approaches to town + a central monument
  const hedgehogs=[];
  { const spots=[]; for(const x of NSX){ spots.push([x+rr(-3,3),-TOWN.hz-14],[x+rr(-3,3),TOWN.hz+14]); }
    for(const z of EWZ){ spots.push([-TOWN.hx-14,z+rr(-3,3)],[TOWN.hx+14,z+rr(-3,3)]); }
    for(const [x,z] of spots){ if(rnd()<0.7){ hedgehogs.push({x,z,yaw:rr(0,3)}); treeColliders.push({x,z,radius:1.4}); } }
    for(let k=0;k<8;k++){ const x=pick(NSX)+rr(-4,4), z=rr(-170,170); if(!insideAny(x,z,2)){ hedgehogs.push({x,z,yaw:rr(0,3)}); treeColliders.push({x,z,radius:1.4}); } }
  }
  const PLAZA={x:(xe[2]+xe[3])/2, z:(ze[2]+ze[3])/2};
  treeColliders.push({x:PLAZA.x,z:PLAZA.z,radius:3.4});
  const stack={x:(xe[4]+OUT+xe[5]-5)/2-18,z:(ze[4]+OUT+ze[5]-5)/2+1};   // tall brick chimney of the works
  treeColliders.push({x:stack.x,z:stack.z,radius:2.4});

  // =====================================================================================
  //  TEXTURES (all drawn on canvases, so the map works from a local file)
  // =====================================================================================
  const Rn = (a,b) => a+Math.random()*(b-a);
  const rgba = (r,g,b,a) => 'rgba('+(r|0)+','+(g|0)+','+(b|0)+','+a.toFixed(3)+')';
  function mkTex(S,draw,linear,rep){
    const c=document.createElement('canvas'); c.width=c.height=S;
    draw(c.getContext('2d'),S);
    const t=new THREE.CanvasTexture(c);
    t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=16; if(!linear) t.encoding=THREE.sRGBEncoding;
    return t;
  }
  function speck(g,S,n,amax,smax){
    for(let i=0;i<n;i++){ const a=Rn(0.02,amax), s=Rn(0.6,smax);
      g.fillStyle=Math.random()<0.5?rgba(0,0,0,a):rgba(255,255,255,a*0.8); g.fillRect(Rn(0,S),Rn(0,S),s,s); }
  }
  function blot(g,S,n,r0,r1,a,rgb){
    for(let i=0;i<n;i++){ const x=Rn(0,S),y=Rn(0,S),r=Rn(r0,r1), gr=g.createRadialGradient(x,y,0,x,y,r);
      gr.addColorStop(0,rgba(rgb[0],rgb[1],rgb[2],a)); gr.addColorStop(1,rgba(rgb[0],rgb[1],rgb[2],0));
      g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); }
  }
  function streaks(g,S,n,rgb,amax){
    for(let i=0;i<n;i++){ const x=Rn(0,S), y=Rn(0,S*0.7), len=Rn(40,130), w=Rn(2,8), gr=g.createLinearGradient(0,y,0,y+len);
      gr.addColorStop(0,rgba(rgb[0],rgb[1],rgb[2],Rn(0.03,amax))); gr.addColorStop(1,rgba(rgb[0],rgb[1],rgb[2],0));
      g.fillStyle=gr; g.fillRect(x,y,w,len); }
  }
  function pits(g,n,S){
    for(let i=0;i<n;i++){ const x=Rn(0,S), y=Rn(0,S), r=Rn(0.9,2.6);
      g.fillStyle='rgba(235,228,210,0.28)'; g.beginPath(); g.arc(x,y,r*1.8,0,6.283); g.fill();
      g.fillStyle='rgba(28,22,18,0.6)'; g.beginPath(); g.arc(x,y,r,0,6.283); g.fill(); }
  }
  function cracks(g,S,n,a){
    g.strokeStyle='rgba(45,38,30,'+a+')'; g.lineWidth=1;
    for(let i=0;i<n;i++){ let x=Rn(0,S),y=Rn(0,S*0.6); g.beginPath(); g.moveTo(x,y);
      for(let k=0;k<7;k++){ x+=Rn(-10,10); y+=Rn(6,20); g.lineTo(x,y); } g.stroke(); }
  }
  function brickFill(g,S,muted){
    g.fillStyle='#a49a8c'; g.fillRect(0,0,S,S);
    const bh=8, bl=16;
    for(let row=0;row<S/bh;row++){ const off=(row%2)*bl/2;
      for(let x=-off;x<S;x+=bl){ const k=Rn(-1,1);
        const r=(muted?132:146)+k*26+Rn(-8,8), gg=(muted?78:70)+k*14, b=(muted?62:54)+k*10;
        g.fillStyle='rgb('+(r|0)+','+(gg|0)+','+(b|0)+')'; g.fillRect(x+0.7,row*bh+0.7,bl-1.4,bh-1.4);
        if(Math.random()<0.08){ g.fillStyle='rgba(20,12,8,0.25)'; g.fillRect(x+0.7,row*bh+0.7,bl-1.4,bh-1.4); } } }
    blot(g,S,10,30,90,0.10,[40,30,24]); blot(g,S,6,25,70,0.08,[230,225,210]); speck(g,S,1600,0.07,1.6);
  }
  function plasterFill(g,S){
    g.fillStyle='#ddd8cb'; g.fillRect(0,0,S,S);
    blot(g,S,16,25,80,0.10,[70,60,45]); blot(g,S,10,20,60,0.08,[255,250,235]);
    speck(g,S,3200,0.09,2.2); cracks(g,S,4,0.28);
  }
  function spall(g,x,y,w,h){
    g.save(); g.beginPath();
    const n=10; for(let i=0;i<n;i++){ const a=i/n*6.283, r=1+Rn(-0.3,0.3), px=x+Math.cos(a)*w*r, py=y+Math.sin(a)*h*r; i?g.lineTo(px,py):g.moveTo(px,py); }
    g.closePath(); g.clip(); brickFill(g,256,true); g.restore();
    g.strokeStyle='rgba(60,50,40,0.5)'; g.lineWidth=1.5; g.beginPath();
    for(let i=0;i<=n;i++){ const a=i/n*6.283, r=1+Rn(-0.3,0.3); const px=x+Math.cos(a)*w*r, py=y+Math.sin(a)*h*r; i?g.lineTo(px,py):g.moveTo(px,py); } g.stroke();
  }
  const WIN={x:90,y:58,w:76,h:130};
  function drawWindow(g,o){
    const {x,y,w,h}=WIN, brick=o.mat==='brick';
    g.fillStyle=o.burnt?'rgba(8,6,4,0.92)':'rgba(0,0,0,0.32)'; g.fillRect(x-4,y-4,w+8,h+8);
    // lintel
    if(brick){ const n=9, ww=(w+14)/n; for(let i=0;i<n;i++){ g.fillStyle=rgba(120+Rn(-12,12),74+Rn(-8,8),58,1); g.fillRect(x-7+i*ww,y-15,ww-1.6,13); } }
    else { g.fillStyle='#cdc7b8'; g.fillRect(x-9,y-12,w+18,10); g.fillStyle='rgba(0,0,0,0.18)'; g.fillRect(x-9,y-3,w+18,2); }
    // sill
    g.fillStyle='#c1bcaf'; g.fillRect(x-8,y+h,w+16,9); g.fillStyle='rgba(255,255,255,0.4)'; g.fillRect(x-8,y+h,w+16,2);
    const sh=g.createLinearGradient(0,y+h+9,0,y+h+34); sh.addColorStop(0,'rgba(0,0,0,0.3)'); sh.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=sh; g.fillRect(x-8,y+h+9,w+16,25);
    if(o.burnt){
      g.fillStyle='#060606'; g.fillRect(x,y,w,h);
      g.strokeStyle='#2b1f15'; g.lineWidth=4; g.beginPath(); g.moveTo(x+3,y+h-4); g.lineTo(x+3,y+h*0.45); g.moveTo(x+w-3,y+h-4); g.lineTo(x+w-3,y+h*0.6); g.moveTo(x,y+h*0.62); g.lineTo(x+w*0.5,y+h*0.58); g.stroke();
      g.fillStyle='rgba(30,36,40,0.5)'; g.beginPath(); g.moveTo(x+w*0.1,y+h); g.lineTo(x+w*0.3,y+h*0.8); g.lineTo(x+w*0.5,y+h); g.fill();
      // soot plume above the opening
      const sg=g.createLinearGradient(0,y-4,0,y-95); sg.addColorStop(0,'rgba(14,11,9,0.78)'); sg.addColorStop(1,'rgba(14,11,9,0)');
      g.fillStyle=sg; g.beginPath(); g.moveTo(x-10,y-4); g.lineTo(x+w+10,y-4); g.lineTo(x+w+34,y-95); g.lineTo(x-26,y-95); g.closePath(); g.fill();
    } else {
      const gl=g.createLinearGradient(x,y,x+w,y+h); gl.addColorStop(0,'#3d4a56'); gl.addColorStop(0.5,'#212b34'); gl.addColorStop(1,'#12181e');
      g.fillStyle=gl; g.fillRect(x,y,w,h);
      g.fillStyle='rgba(175,195,215,0.15)'; g.beginPath(); g.moveTo(x,y+h*0.55); g.lineTo(x+w,y+h*0.1); g.lineTo(x+w,y+h*0.33); g.lineTo(x,y+h*0.85); g.fill();
      if(o.variant===2){ g.fillStyle='rgba(228,218,194,0.55)'; g.fillRect(x,y,w*0.3,h*0.78); g.fillRect(x+w*0.7,y,w*0.3,h*0.78); }
      if(Math.random()<0.25){ g.strokeStyle='rgba(220,230,240,0.5)'; g.lineWidth=1; g.beginPath(); const cx=x+Rn(w*0.2,w*0.8), cy=y+Rn(h*0.2,h*0.6); for(let k=0;k<5;k++){ g.moveTo(cx,cy); g.lineTo(cx+Rn(-18,18),cy+Rn(-22,22)); } g.stroke(); }
      g.strokeStyle=brick?'#d9d3c4':'#ebe6d9'; g.lineWidth=5; g.strokeRect(x+2,y+2,w-4,h-4);
      g.lineWidth=4; g.beginPath(); g.moveTo(x+w/2,y); g.lineTo(x+w/2,y+h); g.moveTo(x,y+h*0.3); g.lineTo(x+w,y+h*0.3); g.stroke();
    }
    if(o.variant===1 && !o.burnt){
      const col=pick(['#56704a','#6b5a44','#5d6a78','#7b4a3a']);
      for(const sd of [-1,1]){ const sx=sd<0?x-w*0.52-4:x+w+4; g.fillStyle=col; g.fillRect(sx,y-4,w*0.52,h+8);
        g.strokeStyle='rgba(0,0,0,0.3)'; g.lineWidth=1; for(let ly=y;ly<y+h+4;ly+=7){ g.beginPath(); g.moveTo(sx,ly); g.lineTo(sx+w*0.52,ly); g.stroke(); }
        g.fillStyle='rgba(0,0,0,0.25)'; g.fillRect(sd<0?sx+w*0.5:sx,y-4,2,h+8); }
    }
  }
  function drawDoor(g,o){
    const x=76,w=104,y=72,h=170;
    g.fillStyle='rgba(0,0,0,0.3)'; g.fillRect(x-8,y-24,w+16,h+24);
    g.fillStyle='#cbc5b6'; g.fillRect(x-10,y-26,w+20,12); g.fillRect(x-10,y-26,10,h+26); g.fillRect(x+w,y-26,10,h+26);
    const col=o.burnt?'#1c140e':pick(['#4b3a2a','#3d4d3a','#5a2f28','#38424e']);
    g.fillStyle=col; g.fillRect(x,y,w,h);
    g.strokeStyle='rgba(0,0,0,0.4)'; g.lineWidth=2; g.strokeRect(x+10,y+12,w/2-14,h*0.38); g.strokeRect(x+w/2+4,y+12,w/2-14,h*0.38);
    g.strokeRect(x+10,y+h*0.5,w/2-14,h*0.42); g.strokeRect(x+w/2+4,y+h*0.5,w/2-14,h*0.42);
    g.strokeStyle='rgba(0,0,0,0.5)'; g.beginPath(); g.moveTo(x+w/2,y); g.lineTo(x+w/2,y+h); g.stroke();
    g.fillStyle='#b6a25a'; g.fillRect(x+w/2-9,y+h*0.52,5,12); g.fillRect(x+w/2+4,y+h*0.52,5,12);
    g.fillStyle='#bdb8aa'; g.fillRect(x-16,y+h-2,w+32,10); g.fillStyle='#a5a094'; g.fillRect(x-24,y+h+8,w+48,12);
  }
  function drawShop(g,o){
    g.fillStyle=o.burnt?'#2a2622':pick(['#5a2b24','#2d4a3b','#38424d','#6a5a30','#4a3a50']); g.fillRect(6,30,244,46);
    g.fillStyle='rgba(255,255,255,0.12)'; g.fillRect(6,30,244,3); g.fillStyle='rgba(0,0,0,0.3)'; g.fillRect(6,73,244,3);
    if(!o.burnt){ g.fillStyle='rgba(230,215,170,0.5)'; for(let i=0;i<6;i++){ g.fillRect(34+i*34+Rn(-2,2),44,Rn(10,24),12); } }
    g.fillStyle='rgba(0,0,0,0.35)'; g.fillRect(14,84,228,148);
    const gl=g.createLinearGradient(0,96,0,222); gl.addColorStop(0,o.burnt?'#050505':'#3d3b35'); gl.addColorStop(1,o.burnt?'#030303':'#1c1b18');
    g.fillStyle=gl; g.fillRect(20,94,216,128);
    if(!o.burnt){ g.fillStyle='rgba(175,195,215,0.12)'; g.beginPath(); g.moveTo(20,170); g.lineTo(236,110); g.lineTo(236,150); g.lineTo(20,212); g.fill(); }
    g.strokeStyle=o.burnt?'#2a2018':'#2b2825'; g.lineWidth=6; g.strokeRect(20,94,216,128);
    for(let i=1;i<4;i++){ g.beginPath(); g.moveTo(20+i*54,94); g.lineTo(20+i*54,222); g.stroke(); }
    g.fillStyle='#38352f'; g.fillRect(14,222,228,26);
    g.fillStyle='rgba(255,255,255,0.1)'; g.fillRect(14,222,228,2);
  }
  function plinth(g,S){
    g.fillStyle='#837f75'; g.fillRect(0,S-24,S,24);
    for(let i=0;i<150;i++){ g.fillStyle=Math.random()<0.5?'rgba(0,0,0,0.12)':'rgba(255,255,255,0.1)'; g.fillRect(Rn(0,S),S-24+Rn(0,24),Rn(2,7),Rn(1,3)); }
    g.fillStyle='rgba(0,0,0,0.35)'; g.fillRect(0,S-25,S,2);
    const gr=g.createLinearGradient(0,S-90,0,S-24); gr.addColorStop(0,'rgba(60,50,35,0)'); gr.addColorStop(1,'rgba(60,50,35,0.22)'); g.fillStyle=gr; g.fillRect(0,S-90,S,66);
  }
  function facadeTile(o){
    return mkTex(256,(g,S)=>{
      if(o.mat==='brick') brickFill(g,S,false); else plasterFill(g,S);
      if(o.mat==='plaster'){
        const n=o.burnt?3:(Math.random()<0.55?1:0);
        for(let i=0;i<n;i++) spall(g,Rn(10,246),Rn(20,236),Rn(14,36),Rn(10,28));
      }
      if(o.kind==='up'||o.kind==='win') drawWindow(g,o);
      else if(o.kind==='door') drawDoor(g,o);
      else drawShop(g,o);
      if(o.kind!=='up') plinth(g,S);
      streaks(g,S,o.burnt?18:11,o.burnt?[10,8,6]:[50,40,30],o.burnt?0.16:0.1);
      if(o.burnt){ g.fillStyle='rgba(18,14,10,0.34)'; g.fillRect(0,0,S,S); blot(g,S,8,30,90,0.28,[5,4,3]); }
      pits(g,o.burnt?70:(Math.random()<0.5?24:6),S);
    });
  }
  function ashlar(g,S,base){
    g.fillStyle=base; g.fillRect(0,0,S,S);
    for(let y=0;y<S;y+=16){ const off=((y/16)%2)*24;
      for(let x=-off;x<S;x+=48){ g.fillStyle=Math.random()<0.5?rgba(0,0,0,Rn(0.02,0.1)):rgba(255,255,255,Rn(0.02,0.1)); g.fillRect(x+1,y+1,46,14); } }
    g.strokeStyle='rgba(50,44,36,0.4)'; g.lineWidth=1; for(let y=0;y<S;y+=16){ g.beginPath(); g.moveTo(0,y+0.5); g.lineTo(S,y+0.5); g.stroke(); }
    blot(g,S,12,30,90,0.12,[50,44,34]); speck(g,S,1800,0.07,1.8); streaks(g,S,12,[40,34,26],0.12);
  }
  function arch(g,x0,x1,yTop,yBot,spring){
    g.beginPath(); g.moveTo(x0,yBot); g.lineTo(x0,spring); g.bezierCurveTo(x0,spring-26,(x0+x1)/2-12,yTop+14,(x0+x1)/2,yTop);
    g.bezierCurveTo((x0+x1)/2+12,yTop+14,x1,spring-26,x1,spring); g.lineTo(x1,yBot); g.closePath();
  }
  function planks(g,S,base){
    g.fillStyle=base; g.fillRect(0,0,S,S);
    for(let x=0;x<S;x+=16){ g.fillStyle=rgba(0,0,0,Rn(0,0.18)); g.fillRect(x,0,15,S);
      g.fillStyle='rgba(0,0,0,0.5)'; g.fillRect(x+15,0,1,S);
      g.strokeStyle='rgba(20,14,8,0.18)'; g.lineWidth=1; for(let k=0;k<5;k++){ const gx=x+Rn(2,13); g.beginPath(); g.moveTo(gx,Rn(0,S)); g.lineTo(gx+Rn(-1,1),Rn(0,S)); g.stroke(); } }
    blot(g,S,10,30,90,0.14,[30,24,16]); speck(g,S,1500,0.08,1.6); streaks(g,S,10,[20,16,10],0.15);
  }
  const make = {
    plUp0:()=>facadeTile({mat:'plaster',kind:'up',variant:0}), plUp1:()=>facadeTile({mat:'plaster',kind:'up',variant:1}),
    plUp2:()=>facadeTile({mat:'plaster',kind:'up',variant:2}), plUpB:()=>facadeTile({mat:'plaster',kind:'up',burnt:true}),
    plGrWin:()=>facadeTile({mat:'plaster',kind:'win',variant:0}), plGrDoor:()=>facadeTile({mat:'plaster',kind:'door'}),
    plGrShop:()=>facadeTile({mat:'plaster',kind:'shop'}),
    brUp0:()=>facadeTile({mat:'brick',kind:'up',variant:0}), brUp1:()=>facadeTile({mat:'brick',kind:'up',variant:2}),
    brUpB:()=>facadeTile({mat:'brick',kind:'up',burnt:true}), brGrWin:()=>facadeTile({mat:'brick',kind:'win',variant:0}),
    brGrDoor:()=>facadeTile({mat:'brick',kind:'door'}), brGrShop:()=>facadeTile({mat:'brick',kind:'shop'}),
    chNave:()=>mkTex(256,(g,S)=>{
      ashlar(g,S,'#d2cab8'); g.fillStyle='rgba(0,0,0,0.16)'; g.fillRect(0,0,14,S); g.fillRect(S-14,0,14,S);
      arch(g,88,168,36,214,104); g.fillStyle='rgba(0,0,0,0.4)'; g.save(); g.translate(5,5); arch(g,88,168,36,214,104); g.fill(); g.restore();
      arch(g,88,168,36,214,104); const gl=g.createLinearGradient(0,36,0,214); gl.addColorStop(0,'#26384c'); gl.addColorStop(1,'#0e151d'); g.fillStyle=gl; g.fill();
      g.strokeStyle='#0a0f14'; g.lineWidth=2.5; for(const x of [108,128,148]){ g.beginPath(); g.moveTo(x,60); g.lineTo(x,214); g.stroke(); }
      for(const y of [100,140,176]){ g.beginPath(); g.moveTo(88,y); g.lineTo(168,y); g.stroke(); }
      arch(g,88,168,36,214,104); g.strokeStyle='#e8e1d0'; g.lineWidth=8; g.stroke();
      g.fillStyle='#bdb7a8'; g.fillRect(80,212,96,9); plinth(g,S); pits(g,40,S);
    }),
    twGrF:()=>mkTex(256,(g,S)=>{
      ashlar(g,S,'#d2cab8'); arch(g,80,176,70,256,126); g.fillStyle='#1b1410'; g.fill();
      g.strokeStyle='#e6dfcf'; g.lineWidth=10; arch(g,80,176,70,256,126); g.stroke();
      g.fillStyle='#4a3524'; arch(g,92,164,90,256,130); g.fill();
      g.strokeStyle='#14100b'; g.lineWidth=3; g.beginPath(); g.moveTo(128,96); g.lineTo(128,256); for(const y of [140,190,230]){ g.moveTo(92,y); g.lineTo(164,y); } g.stroke();
      plinth(g,S); pits(g,30,S);
    }),
    twGrS:()=>mkTex(256,(g,S)=>{ ashlar(g,S,'#d2cab8'); g.fillStyle='#0e0e10'; g.fillRect(120,60,16,100); g.strokeStyle='#e0d9c8'; g.lineWidth=5; g.strokeRect(118,58,20,104); plinth(g,S); pits(g,30,S); }),
    twUp:()=>mkTex(256,(g,S)=>{
      ashlar(g,S,'#d2cab8'); arch(g,88,168,44,206,100); g.fillStyle='#121519'; g.fill();
      g.strokeStyle='rgba(120,128,134,0.55)'; g.lineWidth=3; for(let y=70;y<206;y+=11){ g.beginPath(); g.moveTo(88,y); g.lineTo(168,y+6); g.stroke(); }
      arch(g,88,168,44,206,100); g.strokeStyle='#e6dfcf'; g.lineWidth=8; g.stroke();
      g.fillStyle='rgba(0,0,0,0.3)'; g.fillRect(0,250,S,6); pits(g,24,S);
    }),
    hall:()=>mkTex(256,(g,S)=>{
      brickFill(g,S,true); g.fillStyle='#8c8a84'; g.fillRect(0,0,S,14); g.fillRect(0,0,14,S); g.fillRect(S-14,0,14,S);
      for(const y0 of [40,128]){ g.fillStyle='rgba(0,0,0,0.4)'; g.fillRect(26,y0-4,204,76);
        for(let i=0;i<4;i++){ const x=30+i*50; const gl=g.createLinearGradient(x,y0,x+46,y0+66); gl.addColorStop(0,'#44525e'); gl.addColorStop(1,'#11171c'); g.fillStyle=Math.random()<0.18?'#050607':gl; g.fillRect(x,y0,46,66); }
        g.strokeStyle='#2c2f31'; g.lineWidth=3; for(let i=0;i<=4;i++){ g.beginPath(); g.moveTo(30+i*50-2,y0); g.lineTo(30+i*50-2,y0+66); g.stroke(); }
        for(let k=1;k<3;k++){ g.beginPath(); g.moveTo(28,y0+k*22); g.lineTo(228,y0+k*22); g.stroke(); }
        g.fillStyle='#9a978f'; g.fillRect(24,y0+66,208,6); }
      plinth(g,S); streaks(g,S,16,[20,16,12],0.18); pits(g,60,S);
    }),
    barnF:()=>mkTex(256,(g,S)=>{
      planks(g,S,'#6b5238'); g.fillStyle='rgba(0,0,0,0.5)'; g.fillRect(44,92,168,164);
      g.fillStyle='#4e3a26'; g.fillRect(50,98,76,158); g.fillRect(130,98,76,158);
      g.strokeStyle='#2a1d10'; g.lineWidth=5; for(const x0 of [50,130]){ g.strokeRect(x0,98,76,158); g.beginPath(); g.moveTo(x0,98); g.lineTo(x0+76,256); g.moveTo(x0+76,98); g.lineTo(x0,256); g.stroke(); }
      g.fillStyle='#2e2114'; g.fillRect(100,28,56,52); g.strokeStyle='#8b7352'; g.lineWidth=3; g.strokeRect(100,28,56,52);
    }),
    barnS:()=>mkTex(256,(g,S)=>{ planks(g,S,'#6f573c'); g.fillStyle='#1b140c'; g.fillRect(108,60,40,48); g.strokeStyle='#8a7352'; g.lineWidth=3; g.strokeRect(108,60,40,48); g.fillStyle='rgba(60,50,35,0.4)'; g.fillRect(0,S-20,S,20); }),
    tile:()=>mkTex(256,(g,S)=>{
      g.fillStyle='#b0b0ae'; g.fillRect(0,0,S,S);
      for(let r=0;r<16;r++) for(let c=-1;c<8;c++){ const x=c*32+(r%2)*16, y=r*16, v=Rn(-26,26);
        g.fillStyle='rgb('+(205+v|0)+','+(205+v|0)+','+(203+v|0)+')'; g.fillRect(x+1,y,31,15);
        g.fillStyle='rgba(0,0,0,0.38)'; g.fillRect(x,y+12,32,4); g.fillStyle='rgba(255,255,255,0.14)'; g.fillRect(x+1,y,31,2);
        g.fillStyle='rgba(0,0,0,0.25)'; g.fillRect(x,y,1,15); }
      blot(g,S,10,16,50,0.16,[60,86,40]); blot(g,S,10,20,60,0.14,[30,24,18]); speck(g,S,1500,0.08,2);
    }),
    slate:()=>mkTex(256,(g,S)=>{
      g.fillStyle='#8a8d92'; g.fillRect(0,0,S,S);
      for(let r=0;r<16;r++) for(let c=-1;c<8;c++){ const x=c*32+(r%2)*16, y=r*16, v=Rn(-20,20);
        g.fillStyle='rgb('+(150+v|0)+','+(154+v|0)+','+(160+v|0)+')'; g.fillRect(x+1,y+1,30,14); g.fillStyle='rgba(0,0,0,0.3)'; g.fillRect(x,y+13,32,3); }
      blot(g,S,10,20,60,0.12,[20,20,20]); speck(g,S,1500,0.08,1.8);
    }),
    metal:()=>mkTex(256,(g,S)=>{
      for(let x=0;x<S;x++){ const v=0.5+0.5*Math.sin(x/16*6.283); const c=150+v*70; g.fillStyle='rgb('+(c|0)+','+((c-4)|0)+','+((c-10)|0)+')'; g.fillRect(x,0,1,S); }
      blot(g,S,16,16,60,0.3,[150,84,44]); blot(g,S,10,20,60,0.12,[30,24,20]); streaks(g,S,22,[90,50,26],0.28);
      g.strokeStyle='rgba(0,0,0,0.25)'; g.lineWidth=2; g.beginPath(); g.moveTo(0,128); g.lineTo(S,128); g.stroke(); speck(g,S,900,0.08,1.6);
    }),
    tar:()=>mkTex(256,(g,S)=>{
      g.fillStyle='#8a8a8c'; g.fillRect(0,0,S,S); speck(g,S,5200,0.16,2.2); blot(g,S,16,20,70,0.14,[20,20,20]);
      g.strokeStyle='rgba(0,0,0,0.28)'; g.lineWidth=2; for(let x=0;x<S;x+=64){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,S); g.stroke(); }
    }),
    plain:()=>mkTex(256,(g,S)=>{ plasterFill(g,S); streaks(g,S,10,[50,40,30],0.1); }),
    concrete:()=>mkTex(256,(g,S)=>{
      g.fillStyle='#928f89'; g.fillRect(0,0,S,S); blot(g,S,18,20,70,0.14,[40,40,40]); blot(g,S,10,20,60,0.1,[255,255,255]);
      speck(g,S,3200,0.14,2.4); cracks(g,S,5,0.35);
    }),
    brickRaw:()=>mkTex(256,(g,S)=>{ brickFill(g,S,true); streaks(g,S,12,[20,16,12],0.18); }),
    wood:()=>mkTex(128,(g,S)=>{ g.fillStyle='#5a4630'; g.fillRect(0,0,S,S); for(let i=0;i<40;i++){ g.strokeStyle=rgba(20,12,6,Rn(0.1,0.35)); g.lineWidth=Rn(1,2); const y=Rn(0,S); g.beginPath(); g.moveTo(0,y); g.lineTo(S,y+Rn(-4,4)); g.stroke(); } speck(g,S,400,0.12,1.5); }),
    rubble:()=>mkTex(256,(g,S)=>{
      g.fillStyle='#837d72'; g.fillRect(0,0,S,S);
      const cols=['#8d4c3b','#9b9890','#d3ccba','#2b2825','#a8a396','#7a4333','#6d6a64'];
      for(let i=0;i<220;i++){ g.save(); g.translate(Rn(0,S),Rn(0,S)); g.rotate(Rn(0,6.28)); g.fillStyle=cols[(Math.random()*cols.length)|0]; g.fillRect(0,0,Rn(6,28),Rn(4,16)); g.restore(); }
      blot(g,S,14,20,60,0.2,[20,18,16]); speck(g,S,2500,0.12,2);
    })
  };
  const TEX = {}, MATS = {};
  const tex = n => TEX[n] || (TEX[n]=make[n]());
  const ROOFS = {tile:1,slate:1,metal:1,tar:1};
  function getMat(name){
    if(MATS[name]) return MATS[name];
    let m;
    if(name==='glass') m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.25,metalness:0.35});
    else if(name==='steel') m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.55,metalness:0.7});
    else m=new THREE.MeshStandardMaterial({map:tex(name),vertexColors:true,roughness:name==='metal'?0.6:0.95,metalness:name==='metal'?0.25:0,
      side:(ROOFS[name]||name==='rubble')?THREE.DoubleSide:THREE.FrontSide});
    return MATS[name]=m;
  }

  // =====================================================================================
  //  GEOMETRY BUCKETS: everything is merged per material so the whole town is ~20 draw calls
  // =====================================================================================
  const buckets = {};
  const bk = (n,p) => { const k=n+'|'+Math.floor(p[0]/160)+"|"+Math.floor(p[2]/160); return buckets[k] || (buckets[k]={pos:[],nor:[],uv:[],col:[]}); };
  function quad(name,p0,p1,p2,p3,uv,col,hint){
    const B=bk(name,p0);
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
  const tri = (name,a,b,c,uv,col,hint) => quad(name,a,b,c,c,[uv[0],uv[1],uv[2],uv[2]],col,hint);
  function obox(name,c,half,ax,col,uvs){
    const us=uvs||1.5;
    for(const [a,sg] of [[0,1],[0,-1],[1,1],[1,-1],[2,1],[2,-1]]){
      const u=(a+1)%3, v=(a+2)%3, n=ax[a], U=ax[u], V=ax[v], hn=half[a], hu=half[u], hv=half[v];
      const C=[c[0]+n[0]*hn*sg,c[1]+n[1]*hn*sg,c[2]+n[2]*hn*sg];
      const pt=(su,sv)=>[C[0]+U[0]*hu*su+V[0]*hv*sv, C[1]+U[1]*hu*su+V[1]*hv*sv, C[2]+U[2]*hu*su+V[2]*hv*sv];
      const uu=hu*2/us, vv=hv*2/us;
      quad(name,pt(-1,-1),pt(1,-1),pt(1,1),pt(-1,1),[[0,0],[uu,0],[uu,vv],[0,vv]],col,[n[0]*sg,n[1]*sg,n[2]*sg]);
    }
  }
  function axesYPR(yaw,pitch,roll){
    const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),cr=Math.cos(roll),sr=Math.sin(roll);
    const rot=v=>{ const x=v[0]; const y1=v[1]*cp-v[2]*sp, z1=v[1]*sp+v[2]*cp; return [x*cy+z1*sy, y1, -x*sy+z1*cy]; };
    return [rot([cr,sr,0]),rot([-sr,cr,0]),rot([0,0,1])];
  }
  const STY = {
    plaster:{win:'plGrWin',door:'plGrDoor',shop:'plGrShop',up:['plUp0','plUp1','plUp2'],upB:'plUpB'},
    brick:{win:'brGrWin',door:'brGrDoor',shop:'brGrShop',up:['brUp0','brUp1'],upB:'brUpB'},
    church:{win:'chNave',door:'chNave',shop:'chNave',up:['chNave'],upB:'chNave'},
    tower:{win:'twGrS',door:'twGrF',shop:'twGrF',up:['twUp'],upB:'twUp'},
    hall:{win:'hall',door:'hall',shop:'hall',up:['hall'],upB:'hall'},
    barn:{win:'barnS',door:'barnF',shop:'barnS',up:['barnS'],upB:'barnS'}
  };

  // =====================================================================================
  //  ONE BUILDING
  // =====================================================================================
  function buildBuilding(b){
    const c=b.cos, s=b.sin, lvl=b.level;
    const T=(lx,ly,lz)=>[b.x+lx*c+lz*s, b.P+ly, b.z-lx*s+lz*c];
    const V=(lx,lz)=>[lx*c+lz*s,0,-lx*s+lz*c];
    const AX=[[c,0,-s],[0,1,0],[s,0,c]];
    const lbox=(name,lx,ly,lz,sx,sy,sz,col,uvs)=>obox(name,T(lx,ly,lz),[sx/2,sy/2,sz/2],AX,col,uvs);
    const hw=b.w/2, hd=b.d/2, fh=b.fh, bw=b.bw, tint=b.tint, st=STY[b.style];
    const tintG=tint.map(v=>v*0.95), INT=[0.5,0.47,0.42].map(v=>v*(b.burnt?0.6:1));
    const upName = (lvl>0&&b.burnt) ? st.upB : st.up[b.variant%st.up.length];
    const ledgeCol = tint.map(v=>Math.min(1,v*1.06));
    const dressed = (b.style==='plaster'||b.style==='brick') && lvl===0;

    function wall(A,B,out,front){
      const L=Math.hypot(B[0]-A[0],B[1]-A[1]);
      const nb=Math.max(1,Math.round(L/bw)), cpb=lvl>0?2:1, nc=nb*cpb, doorBay=Math.floor(nb/2), th=0.4;
      const hn=V(out[0],out[1]);
      for(let i=0;i<nc;i++){
        const t0=i/nc, t1=(i+1)/nc, bay=Math.floor(i/cpb), u0=(i%cpb)/cpb, u1=u0+1/cpb;
        const x0=A[0]+(B[0]-A[0])*t0, z0=A[1]+(B[1]-A[1])*t0, x1=A[0]+(B[0]-A[0])*t1, z1=A[1]+(B[1]-A[1])*t1;
        let hL=b.hTop, hR=b.hTop;
        if(lvl>0){ hL=dmgH(b,x0-out[0]*0.3,z0-out[1]*0.3); hR=dmgH(b,x1-out[0]*0.3,z1-out[1]*0.3); }
        if(hL<0.15 && hR<0.15) continue;
        const gL=Math.min(hL,fh), gR=Math.min(hR,fh);
        const gname = (front&&bay===doorBay) ? st.door : (front&&b.shop ? st.shop : st.win);
        quad(gname,T(x0,0,z0),T(x1,0,z1),T(x1,gR,z1),T(x0,gL,z0),[[u0,0],[u1,0],[u1,gR/fh],[u0,gL/fh]],tintG,hn);
        if(Math.max(hL,hR)>fh+0.01){
          const yL=Math.max(hL,fh), yR=Math.max(hR,fh);
          quad(upName,T(x0,fh,z0),T(x1,fh,z1),T(x1,yR,z1),T(x0,yL,z0),[[u0,0],[u1,0],[u1,(yR-fh)/fh],[u0,(yL-fh)/fh]],tint,hn);
        }
        const ix0=x0-out[0]*th, iz0=z0-out[1]*th, ix1=x1-out[0]*th, iz1=z1-out[1]*th;
        if(lvl>0){
          quad('plain',T(ix0,0,iz0),T(ix1,0,iz1),T(ix1,hR,iz1),T(ix0,hL,iz0),[[x0/3,0],[x1/3,0],[x1/3,hR/3],[x0/3,hL/3]],INT,[-hn[0],0,-hn[2]]);
          if(hL<b.hTop-0.01 || hR<b.hTop-0.01 || b.roof==='flat')
            quad('concrete',T(x0,hL,z0),T(x1,hR,z1),T(ix1,hR,iz1),T(ix0,hL,iz0),[[0,0],[1,0],[1,0.2],[0,0.2]],[0.8,0.78,0.76],[0,1,0]);
        } else if(b.roof==='flat'){
          quad('plain',T(ix0,b.hEave,iz0),T(ix1,b.hEave,iz1),T(ix1,b.hTop,iz1),T(ix0,b.hTop,iz0),[[0,0],[1,0],[1,0.3],[0,0.3]],tint,[-hn[0],0,-hn[2]]);
          quad('concrete',T(x0,b.hTop,z0),T(x1,b.hTop,z1),T(ix1,b.hTop,iz1),T(ix0,b.hTop,iz0),[[0,0],[1,0],[1,0.2],[0,0.2]],[0.85,0.83,0.8],[0,1,0]);
        }
      }
      if(dressed){
        const mid=[(A[0]+B[0])/2,(A[1]+B[1])/2], alongX=Math.abs(B[0]-A[0])>Math.abs(B[1]-A[1]), len=L+0.5;
        const ledge=(y,h,off,depth)=>{
          const cx=mid[0]+out[0]*(off+depth/2), cz=mid[1]+out[1]*(off+depth/2);
          if(alongX) lbox('plain',cx,y,cz,len,h,depth,ledgeCol,1.5); else lbox('plain',cx,y,cz,depth,h,len,ledgeCol,1.5);
        };
        ledge(b.hEave-0.2,0.34,0,0.36);
        if(b.floors>1) ledge(fh,0.16,0,0.1);
        if(b.floors>2) ledge(fh*2,0.1,0,0.06);
      }
    }
    wall([-hw,hd],[hw,hd],[0,1],true);
    wall([hw,-hd],[-hw,-hd],[0,-1],false);
    wall([hw,hd],[hw,-hd],[1,0],false);
    wall([-hw,-hd],[-hw,hd],[-1,0],false);
    if(b.quoins && lvl===0) for(const sx of [-1,1]) for(const sz of [-1,1]) lbox('plain',sx*hw,b.hEave/2,sz*hd,0.5,b.hEave,0.5,ledgeCol,1.5);

    // interior floors that survived
    if(lvl>0 && b.floors>1){
      for(let k=1;k<b.floors;k++){
        const nx=Math.ceil(b.w/3.4), nz=Math.ceil(b.d/3.4);
        for(let ix=0;ix<nx;ix++) for(let iz=0;iz<nz;iz++){
          const x0=-hw+0.4+(b.w-0.8)*ix/nx, x1=-hw+0.4+(b.w-0.8)*(ix+1)/nx, z0=-hd+0.4+(b.d-0.8)*iz/nz, z1=-hd+0.4+(b.d-0.8)*(iz+1)/nz;
          if(dmgH(b,(x0+x1)/2,(z0+z1)/2)<k*fh+0.5) continue;
          const y=k*fh, col=[0.5,0.48,0.46];
          quad('concrete',T(x0,y,z0),T(x1,y,z0),T(x1,y,z1),T(x0,y,z1),[[0,0],[1,0],[1,1],[0,1]],col,[0,1,0]);
          quad('concrete',T(x0,y-0.25,z0),T(x1,y-0.25,z0),T(x1,y-0.25,z1),T(x0,y-0.25,z1),[[0,0],[1,0],[1,1],[0,1]],col,[0,-1,0]);
        }
      }
    }

    // ---------------- roofs ----------------
    const rm=b.roofMat, rcol=b.roofCol;
    if(b.roof==='gable'){
      const rx=b.ridgeX, La=rx?b.w:b.d, Lc=rx?b.d:b.w, oh=0.5, rk=0.3;
      const Hr=(Lc/2)*b.pitch, eY=b.hEave-0.15, rY=b.hEave+Hr;
      const L2=(a,cc)=>rx?[a,cc]:[cc,a];
      const PT=(a,cc,y)=>{ const q=L2(a,cc); return T(q[0],y,q[1]); };
      const np=lvl>0?Math.max(1,Math.round(La/2.4)):1, sl=Math.hypot(Lc/2+oh,rY-eY);
      for(let i=0;i<np;i++){
        const a0=-La/2+La*i/np, a1=-La/2+La*(i+1)/np, am=(a0+a1)/2;
        for(const sd of [1,-1]){
          if(lvl>0){ const q=L2(am,sd*Lc*0.25); if(dmgH(b,q[0],q[1])<b.hEave-0.4) continue; }
          const e0=i===0?a0-rk:a0, e1=i===np-1?a1+rk:a1, q2=L2(0,sd), hn=V(q2[0],q2[1]); hn[1]=1;
          quad(rm,PT(e0,sd*(Lc/2+oh),eY),PT(e1,sd*(Lc/2+oh),eY),PT(e1,0,rY),PT(e0,0,rY),
               [[e0/2.2,0],[e1/2.2,0],[e1/2.2,sl/2.2],[e0/2.2,sl/2.2]],rcol,hn);
        }
      }
      for(const e of [-1,1]){
        if(lvl>0){ const q=L2(e*La*0.45,0); if(dmgH(b,q[0],q[1])<b.hEave-0.4) continue; }
        const q=L2(e,0), hv=V(q[0],q[1]);
        tri(b.style==='brick'?'brickRaw':'plain',PT(e*La/2,-Lc/2,b.hEave),PT(e*La/2,Lc/2,b.hEave),PT(e*La/2,0,rY),[[0,0],[Lc/2.5,0],[Lc/5,Hr/2.5]],tint,hv);
      }
      if(lvl===0){ const q=L2(0,0); if(rx) lbox(rm,q[0],rY+0.04,q[1],La+0.6,0.2,0.42,rcol.map(v=>v*0.85),1.5); else lbox(rm,q[0],rY+0.04,q[1],0.42,0.2,La+0.6,rcol.map(v=>v*0.85),1.5); }
      if(b.chimneys){
        const n=rnd()<0.5?1:2;
        for(let k=0;k<n;k++){
          const a=rr(-La*0.32,La*0.32), q=L2(a,rr(-0.4,0.4));
          if(lvl>0 && dmgH(b,q[0],q[1])<b.hEave-0.4) continue;
          const top=rY+1.5, h=top-b.hEave;
          lbox('brickRaw',q[0],b.hEave+h/2,q[1],0.95,h,0.95,[1,1,1],1.5);
          lbox('concrete',q[0],top+0.08,q[1],1.2,0.18,1.2,[0.85,0.85,0.85],1.5);
        }
      }
      if(b.dormers && lvl===0 && rx){
        const nd=ri(1,2), c0=Lc/2*0.55, yS=rY-(rY-eY)*(c0/(Lc/2+oh))-0.15;
        for(let k=0;k<nd;k++){
          const a=nd===1?rr(-La*0.15,La*0.15):(k?1:-1)*La*0.24;
          lbox('plain',a,yS+0.9,c0-0.45,1.9,1.8,1.7,tint,1.5);
          const gq=[T(a-0.55,yS+0.4,c0+0.41),T(a+0.55,yS+0.4,c0+0.41),T(a+0.55,yS+1.45,c0+0.41),T(a-0.55,yS+1.45,c0+0.41)];
          quad('glass',gq[0],gq[1],gq[2],gq[3],[[0,0],[1,0],[1,1],[0,1]],[0.1,0.13,0.16],V(0,1));
          lbox(rm,a,yS+1.88,c0-0.45,2.3,0.14,2.1,rcol,1.5);
        }
      }
    } else if(b.roof==='flat'){
      const y=b.hEave+0.02;
      if(lvl===0) quad('tar',T(-hw,y,-hd),T(hw,y,-hd),T(hw,y,hd),T(-hw,y,hd),[[0,0],[b.w/3,0],[b.w/3,b.d/3],[0,b.d/3]],[0.62,0.62,0.64],[0,1,0]);
      else{
        const nx=Math.ceil(b.w/3.4), nz=Math.ceil(b.d/3.4);
        for(let ix=0;ix<nx;ix++) for(let iz=0;iz<nz;iz++){
          const x0=-hw+b.w*ix/nx, x1=-hw+b.w*(ix+1)/nx, z0=-hd+b.d*iz/nz, z1=-hd+b.d*(iz+1)/nz;
          if(dmgH(b,(x0+x1)/2,(z0+z1)/2)<b.hEave-0.3) continue;
          quad('tar',T(x0,y,z0),T(x1,y,z0),T(x1,y,z1),T(x0,y,z1),[[0,0],[1,0],[1,1],[0,1]],[0.6,0.6,0.62],[0,1,0]);
        }
      }
      for(let k=0,n=ri(1,3);k<n;k++){
        const lx=rr(-hw*0.6,hw*0.6), lz=rr(-hd*0.5,hd*0.5);
        if(lvl>0 && dmgH(b,lx,lz)<b.hEave-0.4) continue;
        const sx=rr(1.2,3), sz=rr(1.2,2.6), sy=rr(0.8,2.2);
        lbox('concrete',lx,b.hEave+sy/2,lz,sx,sy,sz,[0.85,0.83,0.8],2);
      }
    } else { // hip / pyramid (intact only)
      const oh=0.55, Hr=Math.min(b.w,b.d)/2*b.pitch, eY=b.hEave-0.2, rY=b.hEave+Hr, rl=Math.abs(b.w-b.d), alongX=b.w>=b.d;
      const R0=alongX?[-rl/2,0]:[0,-rl/2], R1=alongX?[rl/2,0]:[0,rl/2];
      const E0=[-hw-oh,-hd-oh], E1=[hw+oh,-hd-oh], E2=[hw+oh,hd+oh], E3=[-hw-oh,hd+oh];
      const faces = alongX ? [[E3,E2,R1,R0],[E1,E0,R0,R1],[E0,E3,R0,R0],[E2,E1,R1,R1]]
                           : [[E0,E3,R1,R0],[E2,E1,R0,R1],[E3,E2,R1,R1],[E1,E0,R0,R0]];
      for(const f of faces){
        const eMid=[(f[0][0]+f[1][0])/2,(f[0][1]+f[1][1])/2], hv=V(eMid[0],eMid[1]); hv[1]=1;
        const len=Math.hypot(f[1][0]-f[0][0],f[1][1]-f[0][1]), sl=Math.hypot(Math.min(hw,hd)+oh,Hr+0.2);
        quad(rm,T(f[0][0],eY,f[0][1]),T(f[1][0],eY,f[1][1]),T(f[2][0],rY,f[2][1]),T(f[3][0],rY,f[3][1]),
             [[0,0],[len/2.2,0],[len*0.8/2.2,sl/2.2],[len*0.2/2.2,sl/2.2]],rcol,hv);
      }
    }
  }

  // ---------------- rubble, beams, roof pieces around damaged buildings ----------------
  function debris(b){
    if(!b.level) return;
    const total=b.level===2?95:36, perHole=Math.ceil(total/b.holes.length), cols=[[0.78,0.75,0.7],[0.95,0.9,0.85],[0.6,0.58,0.55],[1,0.95,0.9]];
    for(const h of b.holes) for(let k=0;k<perHole;k++){
      const a=rr(0,6.283), d=Math.sqrt(rnd())*(h.r1+2.5), lx=h.x+Math.cos(a)*d, lz=h.z+Math.sin(a)*d;
      const p=FWD(b,lx,lz), inFoot=Math.abs(lx)<b.w/2&&Math.abs(lz)<b.d/2;
      if(inFoot && dmgH(b,lx,lz)>1.8) continue;
      const y=terrainHeightAt(p[0],p[1]), r=rnd();
      if(r<0.5){ const s=rr(0.3,1.15); obox('rubble',[p[0],y+s*0.25,p[1]],[s*rr(0.6,1.2),s*rr(0.35,0.8),s*rr(0.6,1.2)],axesYPR(rr(0,6.28),rr(-0.5,0.5),rr(-0.5,0.5)),pick(cols),1.4); }
      else if(r<0.7){ const s=rr(0.25,0.6); obox('brickRaw',[p[0],y+s*0.3,p[1]],[s*1.4,s*0.6,s*0.9],axesYPR(rr(0,6.28),rr(-0.4,0.4),rr(-0.4,0.4)),[1,0.95,0.9],1.2); }
      else if(r<0.82){ obox('concrete',[p[0],y+rr(0.3,0.8),p[1]],[rr(0.8,1.7),0.1,rr(0.6,1.3)],axesYPR(rr(0,6.28),rr(-0.5,0.5),rr(0.3,0.8)),[0.8,0.78,0.76],2); }
      else if(r<0.93){ obox('wood',[p[0],y+rr(0.2,1.2),p[1]],[0.07,0.07,rr(1,2.4)],axesYPR(rr(0,6.28),rr(-0.7,0.7),0),[0.45,0.4,0.36],1.5); }
      else if(b.roofMat!=='tar'){ obox(b.roofMat,[p[0],y+0.35,p[1]],[rr(0.9,1.3),0.04,rr(0.7,1.1)],axesYPR(rr(0,6.28),rr(0.2,0.55),rr(-0.3,0.3)),b.roofCol,1.5); }
    }
  }

  // ---------------- build everything ----------------
  buildings.forEach(b=>{ buildBuilding(b); debris(b); });
  // monument in the plaza
  { const y=terrainHeightAt(PLAZA.x,PLAZA.z), ax=[[1,0,0],[0,1,0],[0,0,1]], g=[0.88,0.86,0.82];
    obox('concrete',[PLAZA.x,y+0.2,PLAZA.z],[3.6,0.2,3.6],ax,g,2); obox('concrete',[PLAZA.x,y+0.6,PLAZA.z],[2.6,0.2,2.6],ax,g,2);
    obox('concrete',[PLAZA.x,y+1.0,PLAZA.z],[1.8,0.2,1.8],ax,g,2); obox('concrete',[PLAZA.x,y+2.0,PLAZA.z],[1.1,0.8,1.1],ax,g,2);
    obox('concrete',[PLAZA.x,y+6.2,PLAZA.z],[0.55,3.4,0.55],ax,g,2); obox('concrete',[PLAZA.x,y+9.8,PLAZA.z],[0.3,0.3,0.3],ax,[0.8,0.78,0.72],2); }
  // works chimney stack
  { const y=terrainHeightAt(stack.x,stack.z), ax=[[1,0,0],[0,1,0],[0,0,1]];
    obox('brickRaw',[stack.x,y+16,stack.z],[1.5,16,1.5],ax,[1,0.95,0.9],2); obox('brickRaw',[stack.x,y+31.5,stack.z],[1.2,1.5,1.2],ax,[0.8,0.78,0.75],2);
    obox('concrete',[stack.x,y+0.6,stack.z],[2.4,0.6,2.4],ax,[0.7,0.7,0.7],2); }
  // steel hedgehogs
  for(const h of hedgehogs){
    const y=terrainHeightAt(h.x,h.z);
    for(let k=0;k<3;k++) obox('steel',[h.x,y+0.85,h.z],[1.25,0.07,0.07],axesYPR(h.yaw+k*1.05,0.78*(k===1?-1:1),k*0.9+0.4),[0.42,0.34,0.3],1);
  }
  // roadside telegraph poles
  for(const r of roads){
    if(!r.country) continue;
    let carry=rr(0,20);
    for(let i=0;i<r.pts.length-1;i++){
      const a=r.pts[i], bb=r.pts[i+1], len=Math.hypot(bb[0]-a[0],bb[1]-a[1]), nx=-(bb[1]-a[1])/len, nz=(bb[0]-a[0])/len;
      let s=carry;
      for(;s<len;s+=38){
        const t=s/len, x=lerp(a[0],bb[0],t)+nx*6.2, z=lerp(a[1],bb[1],t)+nz*6.2;
        if(townD(x,z)<25 || !spotOK(x,z,1,2.5)) continue;
        const y=terrainHeightAt(x,z), ang=Math.atan2(nx,nz), ax=axesYPR(ang,0,0);
        obox('wood',[x,y+4,z],[0.14,4,0.14],[[1,0,0],[0,1,0],[0,0,1]],[0.6,0.56,0.5],1.5);
        obox('wood',[x,y+7.2,z],[1.1,0.07,0.07],ax,[0.6,0.56,0.5],1.5);
      }
      carry=s-len;
    }
  }
  // flush buckets into meshes
  for(const key in buckets){
    const name=key.split('|')[0], B=buckets[key]; if(!B.pos.length) continue;
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(B.pos,3));
    geo.setAttribute('normal',new THREE.Float32BufferAttribute(B.nor,3));
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(B.uv,2));
    geo.setAttribute('color',new THREE.Float32BufferAttribute(B.col,3));
    const m=new THREE.Mesh(geo,getMat(name)); m.castShadow=true; m.receiveShadow=true; scene.add(m);
  }

  // =====================================================================================
  //  GROUND: one big painted map texture (fields, roads, town paving, craters) + tiled detail
  // =====================================================================================
  const MS = 4096, K = MS/G, PX = x => (x+HALF)*K, PZ = z => (z+HALF)*K;
  const mapCanvas = document.createElement('canvas'); mapCanvas.width = mapCanvas.height = MS;
  { const g = mapCanvas.getContext('2d');
    g.fillStyle = '#6c7a3c'; g.fillRect(0,0,MS,MS);
    // large soft colour drift over the plains
    const drift = [[104,122,60],[126,126,66],[96,108,52],[140,128,76]];
    for(let i=0;i<420;i++){ const x=Rn(0,MS), y=Rn(0,MS), r=Rn(80,320), c=drift[i%4], gr=g.createRadialGradient(x,y,0,x,y,r);
      gr.addColorStop(0,rgba(c[0],c[1],c[2],0.34)); gr.addColorStop(1,rgba(c[0],c[1],c[2],0)); g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); }
    // fields
    for(const f of fields){
      g.save(); g.translate(PX(f.cx),PZ(f.cz)); g.rotate(-f.rot);
      const W=f.w*K, H=f.h*K; g.fillStyle=f.kind.col; g.fillRect(-W/2,-H/2,W,H);
      for(let i=0;i<9;i++){ const x=Rn(-W/2,W/2), y=Rn(-H/2,H/2), r=Rn(30,110), gr=g.createRadialGradient(x,y,0,x,y,r);
        gr.addColorStop(0,f.kind.alt); gr.addColorStop(1,'rgba(0,0,0,0)'); g.globalAlpha=0.55; g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); g.globalAlpha=1; }
      g.strokeStyle=f.kind.stripe; g.lineWidth=Math.max(1,f.kind.sp*K*0.38);
      const step=f.kind.sp*K; g.beginPath(); for(let y=-H/2+2;y<H/2;y+=step){ g.moveTo(-W/2,y); g.lineTo(W/2,y); } g.stroke();
      if(f.kind.name==='plough'){ g.strokeStyle='rgba(150,125,95,0.16)'; g.beginPath(); for(let y=-H/2+step*0.5;y<H/2;y+=step){ g.moveTo(-W/2,y); g.lineTo(W/2,y); } g.stroke(); }
      if(f.kind.name==='wheat'||f.kind.name==='green'||f.kind.name==='rape'){ g.strokeStyle='rgba(40,30,15,0.28)'; g.lineWidth=2.6;
        g.beginPath(); for(let x=-W/2+W*0.18;x<W/2;x+=W*0.32){ g.moveTo(x,-H/2); g.lineTo(x,H/2); } g.stroke(); } // tramlines
      g.strokeStyle='rgba(60,70,30,0.7)'; g.lineWidth=7; g.strokeRect(-W/2,-H/2,W,H);
      g.restore();
    }
    // dirt roads
    const strokePath=(pts,w,col,alpha,dash)=>{ g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(PX(p[0]),PZ(p[1])):g.moveTo(PX(p[0]),PZ(p[1])));
      g.lineWidth=w*K; g.strokeStyle=col; g.globalAlpha=alpha; g.lineJoin='round'; g.lineCap='round'; g.setLineDash(dash||[]); g.stroke(); g.setLineDash([]); g.globalAlpha=1; };
    for(const r of roads) if(r.type==='dirt'){
      strokePath(r.pts,r.w+3.2,'#6f6a3a',0.4); strokePath(r.pts,r.w,'#8b7650',1); strokePath(r.pts,r.w*0.72,'#9a8660',0.55);
      strokePath(r.pts,0.9,'#5f4d33',0.5,[40,9]); // ruts (broken)
    }
    // town floor: pavement everywhere, yards inside blocks
    g.fillStyle='#86827a'; g.fillRect(PX(-TOWN.hx-6),PZ(-TOWN.hz-6),(2*TOWN.hx+12)*K,(2*TOWN.hz+12)*K);
    for(let i=0;i<5;i++) for(let j=0;j<5;j++){
      const x0=xe[i]+(i>0?OUT:5), x1=xe[i+1]-(i<4?OUT:5), z0=ze[j]+(j>0?OUT:5), z1=ze[j+1]-(j<4?OUT:5), kind=blockKind(i,j);
      const rx=PX(x0),rz=PZ(z0),rw=(x1-x0)*K,rh=(z1-z0)*K;
      g.fillStyle = kind==='park'||kind==='church' ? '#5f7a3a' : kind==='plaza' ? '#8d8574' : kind==='industrial' ? '#7b7a73' : kind==='ruins' ? '#6e644c' : '#6e704a';
      g.fillRect(rx,rz,rw,rh);
      if(kind==='dense'||kind==='sparse'||kind==='ruins'){
        for(let k=0;k<26;k++){ const x=rx+Rn(0,rw), y=rz+Rn(0,rh), r=Rn(20,70), c=Math.random()<0.5?[96,112,56]:[112,100,70], gr=g.createRadialGradient(x,y,0,x,y,r);
          gr.addColorStop(0,rgba(c[0],c[1],c[2],0.5)); gr.addColorStop(1,rgba(c[0],c[1],c[2],0)); g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); }
        g.fillStyle='rgba(100,96,86,0.5)'; for(let k=0;k<5;k++) g.fillRect(rx+Rn(0,rw*0.9),rz+Rn(0,rh*0.9),Rn(30,80),Rn(30,80)); // paved patches
      }
      if(kind==='plaza'){
        for(let k=0;k<2600;k++){ g.fillStyle=rgba(90+Rn(-14,14),84+Rn(-12,12),72+Rn(-10,10),0.55); g.fillRect(rx+Rn(0,rw),rz+Rn(0,rh),Rn(3,6),Rn(3,6)); }
        g.strokeStyle='rgba(60,54,46,0.5)'; g.lineWidth=2; g.beginPath(); g.moveTo(rx,rz); g.lineTo(rx+rw,rz+rh); g.moveTo(rx+rw,rz); g.lineTo(rx,rz+rh); g.stroke();
        g.fillStyle='#5f7a3a'; for(const [ox,oz] of [[-24,-20],[24,-20],[-24,22],[24,22]]) g.fillRect(PX(PLAZA.x+ox)-16*K,PZ(PLAZA.z+oz)-12*K,32*K,24*K);
      }
      if(kind==='park'){ g.strokeStyle='#a3977a'; g.lineWidth=3.4*K; g.beginPath(); g.moveTo(rx,rz+rh/2); g.bezierCurveTo(rx+rw*0.3,rz+rh*0.2,rx+rw*0.6,rz+rh*0.8,rx+rw,rz+rh/2);
        g.moveTo(rx+rw/2,rz); g.lineTo(rx+rw/2,rz+rh); g.stroke(); }
      if(kind==='industrial'){ blot(g,MS,0,0,0,0,[0,0,0]); for(let k=0;k<14;k++){ const x=rx+Rn(0,rw), y=rz+Rn(0,rh), r=Rn(25,70), gr=g.createRadialGradient(x,y,0,x,y,r);
        gr.addColorStop(0,'rgba(20,18,16,0.5)'); gr.addColorStop(1,'rgba(20,18,16,0)'); g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); } }
    }
    // asphalt
    for(const r of roads) if(r.type==='asphalt'){
      strokePath(r.pts,r.w+0.8,'#6e6b64',1); strokePath(r.pts,r.w,'#4a4a4c',1);
      strokePath(r.pts,0.22,'#cfc8aa',0.8,[3.4*K,5.4*K]);
      strokePath(r.pts,r.w-1.2,'#3f3f41',0.18);
    }
    // crosswalks at junctions
    g.fillStyle='rgba(215,210,190,0.55)';
    for(const x of NSX) for(const z of EWZ){ for(let k=-4;k<=4;k++){
      g.fillRect(PX(x+k*1.15)-0.35*K,PZ(z-9.4)-1.6*K,0.7*K,3.2*K); g.fillRect(PX(x+k*1.15)-0.35*K,PZ(z+9.4)-1.6*K,0.7*K,3.2*K);
      g.fillRect(PX(x-9.4)-1.6*K,PZ(z+k*1.15)-0.35*K,3.2*K,0.7*K); g.fillRect(PX(x+9.4)-1.6*K,PZ(z+k*1.15)-0.35*K,3.2*K,0.7*K); } }
    // road wear: oil, patches, tyre scuffs near junctions
    for(let i=0;i<260;i++){ const r=roads[ri(0,7)], horiz=r.pts[0][1]===r.pts[1][1], a=rr(-200,200), o=rr(-4.5,4.5);
      const x=horiz?a:r.pts[0][0]+o, z=horiz?r.pts[0][1]+o:a, rad=rr(0.8,3)*K, gr=g.createRadialGradient(PX(x),PZ(z),0,PX(x),PZ(z),rad);
      gr.addColorStop(0,'rgba(20,20,22,0.35)'); gr.addColorStop(1,'rgba(20,20,22,0)'); g.fillStyle=gr; g.fillRect(PX(x)-rad,PZ(z)-rad,rad*2,rad*2); }
    // scorched ground around destroyed buildings (ash and soot), then craters on top
    for(const b of buildings) for(const h of b.holes){
      const p=FWD(b,h.x,h.z), r=(h.r1+6)*K, gr=g.createRadialGradient(PX(p[0]),PZ(p[1]),0,PX(p[0]),PZ(p[1]),r);
      gr.addColorStop(0,'rgba(28,24,20,0.55)'); gr.addColorStop(0.6,'rgba(36,30,24,0.28)'); gr.addColorStop(1,'rgba(36,30,24,0)');
      g.fillStyle=gr; g.fillRect(PX(p[0])-r,PZ(p[1])-r,r*2,r*2);
    }
    for(const c of craters){
      const r=c.r*1.9*K, x=PX(c.x), z=PZ(c.z), gr=g.createRadialGradient(x,z,r*0.1,x,z,r);
      gr.addColorStop(0,'rgba(34,27,20,0.9)'); gr.addColorStop(0.45,'rgba(46,37,27,0.75)'); gr.addColorStop(0.7,'rgba(60,48,34,0.4)'); gr.addColorStop(1,'rgba(60,48,34,0)');
      g.fillStyle=gr; g.fillRect(x-r,z-r,r*2,r*2);
      for(let k=0;k<5;k++){ const a=Rn(0,6.28), l=Rn(0.5,1)*r; g.strokeStyle='rgba(28,22,16,0.35)'; g.lineWidth=2; g.beginPath(); g.moveTo(x+Math.cos(a)*r*0.4,z+Math.sin(a)*r*0.4); g.lineTo(x+Math.cos(a)*l,z+Math.sin(a)*l); g.stroke(); }
    }
    // fine grain across everything
    for(let i=0;i<90000;i++){ g.fillStyle=Math.random()<0.5?'rgba(0,0,0,'+Rn(0.03,0.1).toFixed(3)+')':'rgba(255,255,230,'+Rn(0.03,0.08).toFixed(3)+')'; g.fillRect(Rn(0,MS),Rn(0,MS),Rn(1,3.2),Rn(1,3.2)); }
  }
  const mapTex = new THREE.CanvasTexture(mapCanvas);
  mapTex.encoding = THREE.sRGBEncoding; mapTex.anisotropy=16; mapTex.wrapS = mapTex.wrapT = THREE.ClampToEdgeWrapping;
  const detailTex = mkTex(256,(g,S)=>{
    g.fillStyle='#cccccc'; g.fillRect(0,0,S,S);
    for(let i=0;i<46;i++){ const x=Rn(0,S),y=Rn(0,S),r=Rn(18,70),gr=g.createRadialGradient(x,y,0,x,y,r), d=Math.random()<0.5?'rgba(120,120,120,0.35)':'rgba(255,255,255,0.3)';
      gr.addColorStop(0,d); gr.addColorStop(1,'rgba(0,0,0,0)'); for(const ox of [-S,0,S]) for(const oy of [-S,0,S]){ g.save(); g.translate(ox,oy); g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); g.restore(); } }
    for(let i=0;i<3500;i++){ g.fillStyle=Math.random()<0.5?'rgba(0,0,0,'+Rn(0.05,0.2).toFixed(2)+')':'rgba(255,255,255,'+Rn(0.05,0.2).toFixed(2)+')'; g.fillRect(Rn(0,S),Rn(0,S),Rn(1,2.4),Rn(1,2.4)); }
  },true);

  // The ground is drawn in 20x20-cell chunks. Each chunk is only drawn when on screen, and chunks far from the
  // camera switch to half resolution (see lod.js). Normals come from the whole height grid, so chunk borders show no seams.
  const gmat = new THREE.MeshStandardMaterial({vertexColors:true,map:mapTex,roughness:1,metalness:0});
  gmat.onBeforeCompile = sh=>{
    sh.uniforms.uDetail={value:detailTex};
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vWXZ;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvWXZ=(modelMatrix*vec4(transformed,1.0)).xz;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vWXZ;\nuniform sampler2D uDetail;')
      .replace('#include <map_fragment>','#include <map_fragment>\n{vec3 d1=texture2D(uDetail,vWXZ*0.31).rgb; vec3 d2=texture2D(uDetail,vWXZ*0.047+0.37).rgb; diffuseColor.rgb*=d1*d2*1.55;}');
  };
  const gPos=new Float32Array(HROW*HROW*3), gCol=new Float32Array(HROW*HROW*3), gUv=new Float32Array(HROW*HROW*2);
  for(let iz=0;iz<=HDIV;iz++) for(let ix=0;ix<=HDIV;ix++){
    const i=iz*HROW+ix, x=-HALF+ix*HSTEP, z=-HALF+iz*HSTEP, n=fbm(x*0.02,z*0.02), v=0.9+0.18*n;
    gPos[i*3]=x; gPos[i*3+1]=HM[i]; gPos[i*3+2]=z;
    gCol[i*3]=v; gCol[i*3+1]=v; gCol[i*3+2]=v*0.97;
    gUv[i*2]=(x+HALF)/G; gUv[i*2+1]=1-(z+HALF)/G;
  }
  // Buildings sit on flattened pads, so the ground only drops to half resolution (5 m cells) and only past 200 m.
  const terrainLOD=window.createLODTerrain(scene,{div:HDIV,size:G,pos:gPos,col:gCol,uv:gUv,chunk:20,material:gmat,
    levels:[{dist:Infinity,step:1}]});

  // =====================================================================================
  //  VEGETATION (instanced, merged crown geometry)
  // =====================================================================================
  function mergeParts(parts){
    const pos=[],col=[],nor=[];
    for(const p of parts){
      const gg=p.geo.index?p.geo.toNonIndexed():p.geo.clone(); gg.applyMatrix4(p.m); gg.computeVertexNormals();
      const a=gg.attributes.position.array, nn=gg.attributes.normal.array;
      for(let i=0;i<a.length;i+=3){ pos.push(a[i],a[i+1],a[i+2]); nor.push(nn[i],nn[i+1],nn[i+2]); const sh=1+(Math.random()-0.5)*0.22; col.push(p.c[0]*sh,p.c[1]*sh,p.c[2]*sh); }
    }
    const o=new THREE.BufferGeometry();
    o.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); o.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3)); o.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
    return o;
  }
  function lumpy(radius,detail,amp){ detail=0;
    const ge=new THREE.IcosahedronGeometry(radius,detail), pa=ge.attributes.position, map=new Map();
    for(let i=0;i<pa.count;i++){ const k=pa.getX(i).toFixed(3)+','+pa.getY(i).toFixed(3)+','+pa.getZ(i).toFixed(3);
      if(!map.has(k)) map.set(k,1+(Math.random()-0.5)*amp); const f=map.get(k); pa.setXYZ(i,pa.getX(i)*f,pa.getY(i)*f,pa.getZ(i)*f); }
    return ge;
  }
  const mm=(x,y,z,sx,sy,sz,ry)=>{ const m=new THREE.Matrix4(); m.compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),ry||0),new THREE.Vector3(sx,sy,sz)); return m; };
  const trunkG=new THREE.CylinderGeometry(0.2,0.34,1,7);
  const broadGeo=mergeParts([
    {geo:trunkG,m:mm(0,1.6,0,1,3.2,1),c:[0.27,0.21,0.15]},
    {geo:lumpy(1,1,0.35),m:mm(0,4.1,0,1.5,1.25,1.5),c:[0.2,0.33,0.13]},
    {geo:lumpy(1,1,0.35),m:mm(0.95,3.6,0.3,1.05,0.9,1.05),c:[0.23,0.37,0.14]},
    {geo:lumpy(1,1,0.35),m:mm(-0.8,3.7,-0.55,1.1,0.95,1.1),c:[0.18,0.3,0.12]},
    {geo:lumpy(1,1,0.35),m:mm(0.1,5.2,0.2,0.95,0.85,0.95),c:[0.25,0.4,0.15]}
  ]);
  const poplarGeo=mergeParts([
    {geo:trunkG,m:mm(0,1.2,0,0.8,2.4,0.8),c:[0.3,0.26,0.2]},
    {geo:lumpy(1,1,0.3),m:mm(0,5.0,0,0.95,3.6,0.95),c:[0.19,0.32,0.13]},
    {geo:lumpy(1,1,0.3),m:mm(0,7.4,0,0.7,2.2,0.7),c:[0.23,0.36,0.14]}
  ]);
  const bushGeo=mergeParts([{geo:lumpy(1,1,0.4),m:mm(0,0.55,0,1,0.7,1,0),c:[0.22,0.33,0.14]},{geo:lumpy(1,1,0.4),m:mm(0.7,0.4,0.2,0.7,0.55,0.7,0),c:[0.26,0.37,0.15]}]);
  const vegMat=()=>new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true});
  // Cheaper copies of each shape for distance: fewer trunk sides and fewer crown blobs.
  const trunkFarG=new THREE.CylinderGeometry(0.2,0.34,1,4);
  const broadFar=mergeParts([
    {geo:trunkFarG,m:mm(0,1.6,0,1,3.2,1),c:[0.27,0.21,0.15]},
    {geo:lumpy(1,1,0.35),m:mm(0,4.1,0,1.55,1.3,1.55),c:[0.2,0.33,0.13]},
    {geo:lumpy(1,1,0.35),m:mm(0.1,5.2,0.2,1.0,0.9,1.0),c:[0.25,0.4,0.15]}
  ]);
  const poplarFar=mergeParts([
    {geo:trunkFarG,m:mm(0,1.2,0,0.8,2.4,0.8),c:[0.3,0.26,0.2]},
    {geo:lumpy(1,1,0.3),m:mm(0,5.8,0,0.95,4.0,0.95),c:[0.21,0.34,0.135]}
  ]);
  const bushFar=mergeParts([{geo:lumpy(1,1,0.4),m:mm(0.2,0.5,0.05,1.15,0.75,1.1,0),c:[0.24,0.35,0.145]}]);
  // Instances are grouped into 120 m cells; each cell is its own mesh so the renderer can skip the ones out of view.
  // Cells further than 150 m use the cheaper shapes above.
  const vegColor=()=>{ const s=0.82+Math.random()*0.3, tint=Math.random(); return new THREE.Color(s*(1+tint*0.15),s,s*(1-tint*0.1)); };
  const vegLOD=window.createLODInstances(scene,{cell:120,nearDist:520,sphereY:12,sphereR:30,layers:[
    {items:trees.filter(t=>t.kind==='broad'),near:broadGeo,far:broadFar,mat:vegMat(),cast:true,receive:true,color:vegColor,
     place:(d,t)=>{ const s=t.h/6.4; d.position.set(t.x,terrainHeightAt(t.x,t.z)-0.1,t.z); d.rotation.set(0,Math.random()*6.28,0); d.scale.set(s,s*(0.9+Math.random()*0.2),s); }},
    {items:trees.filter(t=>t.kind==='poplar'),near:poplarGeo,far:poplarFar,mat:vegMat(),cast:true,receive:true,color:vegColor,
     place:(d,t)=>{ const s=t.h/9; d.position.set(t.x,terrainHeightAt(t.x,t.z)-0.1,t.z); d.rotation.set(0,Math.random()*6.28,0); d.scale.set(s*rr(0.85,1.15),s,s*rr(0.85,1.15)); }},
    {items:bushes,near:bushGeo,far:bushFar,mat:vegMat(),cast:true,receive:true,color:vegColor,
     place:(d,b)=>{ d.position.set(b.x,terrainHeightAt(b.x,b.z)-0.05,b.z); d.rotation.set(0,Math.random()*6.28,0); d.scale.set(b.r,b.r*rr(0.8,1.2),b.r*rr(1,1.5)); }}
  ]});

  // soft contact shadows under trees and buildings' rubble piles
  { const ac=document.createElement('canvas'); ac.width=ac.height=64; const g=ac.getContext('2d'), gr=g.createRadialGradient(32,32,2,32,32,32);
    gr.addColorStop(0,'rgba(0,0,0,0.8)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(0,0,64,64);
    const geoAO=new THREE.PlaneGeometry(1,1); geoAO.rotateX(-Math.PI/2);
    const list=trees.filter(t=>t.kind!=='poplar').map(t=>({x:t.x,z:t.z,s:t.cr*2.6}));
    const im=new THREE.InstancedMesh(geoAO,new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(ac),transparent:true,opacity:0.45,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),list.length), d=new THREE.Object3D();
    list.forEach((t,i)=>{ d.position.set(t.x,terrainHeightAt(t.x,t.z)+0.08,t.z); d.scale.set(t.s,1,t.s); d.updateMatrix(); im.setMatrixAt(i,d.matrix); });
    im.frustumCulled=false; im.renderOrder=1; scene.add(im); }

  // =====================================================================================
  //  SMOKE COLUMNS AND FIRES over the destroyed buildings (self-animated, one draw call each)
  // =====================================================================================
  const sources=[];
  for(const b of buildings){
    if(!b.level) continue;
    const burning = b.level===2 || b.burnt;
    if(!burning) continue;
    for(const h of b.holes){ if(b.level===1 && rnd()<0.55) continue; const p=FWD(b,h.x*0.6,h.z*0.6); sources.push({x:p[0],y:b.P+Math.max(1.2,h.low*0.7),z:p[1],str:b.level===2?1:0.55,fire:rnd()<(b.level===2?0.7:0.35)}); }
  }
  for(const f of farms) { const b=buildings.find(q=>q.style==='barn'&&q.level===2&&Math.hypot(q.x-f.x,q.z-f.z)<40); if(b) sources.push({x:b.x,y:b.P+2,z:b.z,str:1.1,fire:true}); }
  for(let k=0;k<6;k++){ const c=craters[ri(0,craters.length-1)]; sources.push({x:c.x,y:terrainHeightAt(c.x,c.z)+0.4,z:c.z,str:0.3,fire:false}); } // smouldering shell holes
  const smokeUni={time:{value:0},wind:{value:new THREE.Vector2(1,0.35)}};
  function makeBillboards(n,attrs,vs,fs,additive){
    const ig=new THREE.InstancedBufferGeometry();
    ig.setAttribute('position',new THREE.Float32BufferAttribute([-0.5,-0.5,0, 0.5,-0.5,0, 0.5,0.5,0, -0.5,0.5,0],3)); ig.setIndex([0,1,2,0,2,3]);
    for(const k in attrs) ig.setAttribute(k,new THREE.InstancedBufferAttribute(attrs[k].data,attrs[k].n));
    ig.instanceCount=n;
    const m=new THREE.ShaderMaterial({uniforms:smokeUni,vertexShader:vs,fragmentShader:fs,transparent:true,depthWrite:false,fog:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending});
    const mesh=new THREE.Mesh(ig,m); mesh.frustumCulled=false; mesh.renderOrder=additive?4:3; scene.add(mesh); return mesh;
  }
  if(sources.length){
    const PER=12, n=sources.length*PER, c=new Float32Array(n*3), p=new Float32Array(n*4);
    sources.forEach((s,i)=>{ for(let k=0;k<PER;k++){ const j=i*PER+k; c[j*3]=s.x; c[j*3+1]=s.y; c[j*3+2]=s.z; p[j*4]=k/PER+rnd()*0.02; p[j*4+1]=rnd(); p[j*4+2]=s.str; p[j*4+3]=rr(0.8,1.25); } });
    makeBillboards(n,{aC:{data:c,n:3},aP:{data:p,n:4}},`
      attribute vec3 aC; attribute vec4 aP; uniform float time; uniform vec2 wind;
      varying vec2 vUv; varying float vA; varying float vAge; varying float vSeed;
      void main(){
        float age=fract(time*(0.055+aP.y*0.012)+aP.x);
        float rise=age*(26.0+aP.z*34.0);
        vec3 p=aC+vec3(wind.x*age*age*46.0+sin(aP.y*40.0+age*3.0)*age*3.2, rise, wind.y*age*age*46.0+cos(aP.y*30.0+age*2.6)*age*3.2);
        float size=(2.6+age*(9.0+aP.z*7.0))*aP.w*(0.65+aP.z*0.5);
        float ang=aP.y*6.28+age*0.9; float cs=cos(ang), sn=sin(ang);
        vec2 q=vec2(position.x*cs-position.y*sn, position.x*sn+position.y*cs);
        vec4 mv=viewMatrix*vec4(p,1.0); mv.xy+=q*size;
        gl_Position=projectionMatrix*mv;
        vUv=position.xy*2.0; vAge=age; vSeed=aP.y;
        vA=smoothstep(0.0,0.06,age)*(1.0-smoothstep(0.5,1.0,age))*(0.5+aP.z*0.18);
      }`,`
      varying vec2 vUv; varying float vA; varying float vAge; varying float vSeed;
      const float smokeUnlit=${(window.TOD?window.TOD.unlit:1).toFixed(3)};
      void main(){
        float d=length(vUv); if(d>1.0) discard;
        float n=0.75+0.25*sin(vUv.x*7.0+vSeed*50.0)*sin(vUv.y*6.0+vSeed*31.0);
        float a=vA*smoothstep(1.0,0.15,d)*n;
        vec3 col=mix(vec3(0.05,0.045,0.042),vec3(0.46,0.45,0.44),smoothstep(0.0,0.9,vAge));
        col=mix(col,vec3(0.9,0.38,0.1),(1.0-smoothstep(0.0,0.1,vAge))*0.5);
        col*=0.82+0.3*smoothstep(0.1,-0.8,vUv.y);
        gl_FragColor=vec4(col*smokeUnlit,a);
      }`,false);
    const fires=sources.filter(s=>s.fire), FP=5, fn=fires.length*FP;
    if(fn){
      const fc=new Float32Array(fn*3), fp=new Float32Array(fn*4);
      fires.forEach((s,i)=>{ for(let k=0;k<FP;k++){ const j=i*FP+k; fc[j*3]=s.x+rr(-1.6,1.6); fc[j*3+1]=s.y+rr(-0.3,0.6); fc[j*3+2]=s.z+rr(-1.6,1.6); fp[j*4]=rnd(); fp[j*4+1]=rnd(); fp[j*4+2]=s.str; fp[j*4+3]=rr(0.7,1.3); } });
      makeBillboards(fn,{aC:{data:fc,n:3},aP:{data:fp,n:4}},`
        attribute vec3 aC; attribute vec4 aP; uniform float time; varying vec2 vUv; varying float vF;
        void main(){
          float f=0.65+0.35*sin(time*(7.0+aP.x*6.0)+aP.y*40.0)*sin(time*(3.0+aP.y*4.0)+aP.x*20.0);
          float s=(1.5+aP.z*1.8)*aP.w*f;
          vec4 mv=viewMatrix*vec4(aC+vec3(0.0,s*0.35,0.0),1.0); mv.xy+=position.xy*vec2(s*0.9,s*1.5);
          gl_Position=projectionMatrix*mv; vUv=position.xy*2.0; vF=f;
        }`,`
        varying vec2 vUv; varying float vF;
        void main(){
          float d=length(vUv*vec2(1.0,0.7)); if(d>1.0) discard;
          float a=smoothstep(1.0,0.0,d); vec3 col=mix(vec3(1.0,0.28,0.04),vec3(1.0,0.82,0.35),smoothstep(0.55,0.0,d));
          gl_FragColor=vec4(col*vF,a*0.9);
        }`,true);
    }
    const t0=performance.now();
    (function tick(){ smokeUni.time.value=(performance.now()-t0)/1000; requestAnimationFrame(tick); })();
  }

  const footprints=buildings.map(b=>({x:b.x,z:b.z,w:b.w,d:b.d,s:b.sin,c:b.cos,level:b.level}));
  const updateLOD=cam=>{ terrainLOD.update(cam); vegLOD.update(cam); };
  const minimapLines=roads.map(r=>({pts:r.pts,w:r.w,color:r.type==='asphalt'?'#d6d0b4':'#a8946b'}));
  return {terrainHeightAt, treeColliders, solidAt, footprints, updateLOD, minimapLines};
};

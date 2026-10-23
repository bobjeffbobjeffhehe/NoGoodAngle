window.createForestMap = function(scene, groundSize){
  const THREE = window.THREE;
  const MU = THREE.MathUtils;

  // Original layout was authored for a ~460 m map. layoutScale stretches every hand-placed feature
  // out to fill whatever groundSize this map is actually built at (leaving a 40 m margin to the wall),
  // so the composition keeps its shape and just gets bigger.
  const layoutScale = (groundSize/2 - 40) / 164;

  const trenchPaths = [
    [[-148,-102],[-108,-96],[-70,-101],[-30,-94],[10,-99],[50,-91],[92,-96],[140,-88]],
    [[-145,-20],[-105,-27],[-68,-20],[-28,-25],[12,-20],[50,-27],[93,-21],[145,-30]],
    [[-145,78],[-105,72],[-62,80],[-20,72],[20,78],[60,70],[105,78],[148,68]],
    [[-118,-145],[-110,-110],[-118,-70],[-110,-35]],
    [[112,25],[120,60],[112,102],[125,145]],
    // Extra connecting spur so the bigger map still has cross-routes between the three main trench lines.
    [[-28,-25],[-34,8],[-20,45],[-20,72]]
  ];
  const hills=[
    {x:-92,z:-112,rx:58,rz:26,height:8.6},
    {x:96,z:-105,rx:54,rz:31,height:7.4},
    {x:102,z:82,rx:64,rz:29,height:9.2},
    {x:-98,z:94,rx:60,rz:34,height:7.8},
    {x:-145,z:-12,rx:28,rz:67,height:5.8},
    {x:146,z:12,rx:30,rz:70,height:6.3},
    {x:0,z:-158,rx:92,rz:18,height:4.8},
    {x:0,z:158,rx:94,rz:20,height:5.2},
    {x:-62,z:28,rx:26,rz:38,height:4.2},
    {x:68,z:-34,rx:30,rz:42,height:4.6},
    // Long, climbable flanking ridges with broad shoulders and a few higher
    // crests create hull-down firing positions without closing the centre lane.
    {x:-96,z:-12,rx:38,rz:76,height:16},
    {x:96,z:14,rx:42,rz:78,height:17},
    {x:-38,z:82,rx:28,rz:38,height:9.5},
    {x:42,z:-84,rx:30,rz:40,height:10.5}
  ];
  const roadPaths=[
    [[-164,-48],[-126,-54],[-88,-43],[-48,-45],[-12,-17],[24,-9],[66,-13],[110,-1],[164,7]],
    [[-156,132],[-110,120],[-64,128],[-15,110],[30,119],[78,106],[128,114],[164,96]]
  ];
  const mudPatches=[
    {x:-63,z:-58,rx:25,rz:18},{x:72,z:39,rx:28,rz:20},{x:-80,z:58,rx:20,rz:24},{x:54,z:-120,rx:24,rz:16},
    {x:130,z:-40,rx:18,rz:22},{x:-130,z:70,rx:20,rz:16}
  ];
  // Low, rounded test bumps across the central approach lanes. Their smooth
  // profiles exercise wheel travel without creating sharp, tank-stopping steps.
  const suspensionBumps=[
    {x:-24,z:-48,r:8.5,h:0.75},{x:22,z:-20,r:7.5,h:0.58},
    {x:-11,z:14,r:10,h:0.82},{x:35,z:38,r:8.5,h:0.68},
    {x:-39,z:50,r:9.5,h:0.72},{x:10,z:68,r:7.5,h:0.56},
    {x:51,z:-56,r:10,h:-0.34},{x:-55,z:4,r:8,h:-0.28}
  ];
  // Spread the existing battlefield layout across the larger play space so
  // the extra area has terrain and routes rather than becoming empty border.
  trenchPaths.forEach(path=>path.forEach(p=>{p[0]*=layoutScale;p[1]*=layoutScale;}));
  roadPaths.forEach(path=>path.forEach(p=>{p[0]*=layoutScale;p[1]*=layoutScale;}));
  hills.forEach(h=>{h.x*=layoutScale;h.z*=layoutScale;h.rx*=layoutScale;h.rz*=layoutScale;});
  mudPatches.forEach(m=>{m.x*=layoutScale;m.z*=layoutScale;m.rx*=layoutScale;m.rz*=layoutScale;});

  // ---------- Climbable cliffs ----------
  // Each cliff is a steep-sided plateau (near-vertical rock on most sides) with one gentle ramp corridor
  // carved into it, so a tank can drive up from the battlefield side onto a hull-down firing plateau while
  // the far side (toward the boundary wall) stays an unclimbable rock face. dirX/dirZ point from the
  // cliff's own centre out toward the map centre, i.e. the direction the ramp climbs away from.
  const cliffDefs=[
    {cx:groundSize*0.33, cz:groundSize*0.29, rx:40, rz:34, h:26, rampWidth:11, rampLen:52},
    {cx:-groundSize*0.36,cz:-groundSize*0.15,rx:34, rz:42, h:21, rampWidth:10, rampLen:46},
    {cx:groundSize*0.07, cz:-groundSize*0.40,rx:30, rz:28, h:18, rampWidth:9,  rampLen:38},
    {cx:-groundSize*0.12,cz:groundSize*0.39, rx:26, rz:24, h:15, rampWidth:9,  rampLen:34}
  ];
  const cliffs = cliffDefs.map(c=>{
    const toCenter=Math.hypot(c.cx,c.cz)||1;
    return {...c, dirX:-c.cx/toCenter, dirZ:-c.cz/toCenter};
  });
  // Returns {h: terrain height contribution, rock: 0..1 bare-rock factor for colouring/placement avoidance}.
  function cliffAt(x,z){
    let bestH=0, bestRock=0;
    for(const c of cliffs){
      const dx=(x-c.cx)/c.rx, dz=(z-c.cz)/c.rz, d2=dx*dx+dz*dz;
      if(d2>1.05*1.05) continue;
      const t=Math.max(0,1-d2);
      let h=c.h*Math.pow(t,0.2);
      const edgeFade=1-MU.smoothstep(Math.sqrt(d2),0.9,1.0);
      h*=edgeFade;
      // Ramp corridor: blend toward a gentle, driveable incline instead of the sheer radial wall.
      const rx0=x-c.cx, rz0=z-c.cz;
      const ax=rx0*c.dirX+rz0*c.dirZ, lat=rx0*(-c.dirZ)+rz0*c.dirX;
      if(ax>-8 && ax<c.rampLen+8){
        const u=MU.smoothstep(MU.clamp(1-ax/c.rampLen,0,1),0,1);
        const rampH=c.h*u;
        const corridor=1-MU.smoothstep(Math.abs(lat),c.rampWidth*0.5,c.rampWidth);
        h=h*(1-corridor)+rampH*corridor;
      }
      if(h>bestH){ bestH=h; bestRock=edgeFade*MU.smoothstep(t,0.05,0.5); }
    }
    return {h:bestH, rock:bestRock};
  }

  function distanceToSegment(x,z,a,b){
    const dx=b[0]-a[0], dz=b[1]-a[1];
    const t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));
    const ex=x-(a[0]+dx*t), ez=z-(a[1]+dz*t);
    return Math.sqrt(ex*ex+ez*ez);   // same value as Math.hypot, without its slow generic path (this runs hundreds of times a frame)
  }
  function trenchDistance(x,z){
    let d=Infinity;
    for(const path of trenchPaths) for(let i=0;i<path.length-1;i++) d=Math.min(d,distanceToSegment(x,z,path[i],path[i+1]));
    return d;   // plain loops: no closure allocated per call
  }
  function pathsDistance(x,z,paths){
    let d=Infinity;
    for(const path of paths) for(let i=0;i<path.length-1;i++) d=Math.min(d,distanceToSegment(x,z,path[i],path[i+1]));
    return d;
  }
  function terrainHeightFromDistance(d){
    if(d<1.2) return -0.5*(1-(d/1.2)*(d/1.2));
    if(d<1.95) return 0.2*Math.sin(Math.PI*(d-1.2)/0.75);
    return 0;
  }
  function elevationAt(x,z){
    // Keep a broad, mostly flat north-south shooting lane through the middle;
    // terrain rises into long ridges and firing positions along both flanks.
    const flankRelief=MU.smoothstep(Math.abs(x),18,42);
    let y=(Math.sin(x*0.025+z*0.014)*0.16+Math.cos(z*0.022-x*0.018)*0.12)*flankRelief;
    for(const hill of hills){
      const dx=(x-hill.x)/hill.rx,dz=(z-hill.z)/hill.rz;
      const laneRelief=hill.x===0?1:flankRelief;
      y+=hill.height*Math.exp(-1.55*(dx*dx+dz*dz))*laneRelief;
    }
    for(const bump of suspensionBumps){
      const bx=x-bump.x, bz=z-bump.z, d=Math.sqrt(bx*bx+bz*bz)/bump.r;
      if(d<1)y+=bump.h*0.5*(1+Math.cos(Math.PI*d));
    }
    y+=cliffAt(x,z).h;
    return y;
  }
  function terrainHeightAt(x,z){ return elevationAt(x,z)+terrainHeightFromDistance(trenchDistance(x,z)); }

  // ---------- Wind-swaying foliage materials ----------
  // Bends the top of instanced tree geometry sideways over time, entirely in the vertex shader: the local
  // (pre-instance-transform) vertex height drives how much a vertex moves, so trunks barely stir while
  // crowns sway, and each instance gets its own phase from its own instance-matrix position so a whole
  // stand of trees doesn't wave in lockstep. updateLOD's second argument (elapsed seconds) drives uTime.
  const windMats=[];
  function windMaterial(params, swayStrength){
    const mat=new THREE.MeshStandardMaterial(params);
    const uTime={value:0};
    mat.onBeforeCompile=shader=>{
      shader.uniforms.uTime=uTime;
      shader.vertexShader='uniform float uTime;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        #ifdef USE_INSTANCING
          float windPhase=instanceMatrix[3].x*0.63+instanceMatrix[3].z*0.41;
        #else
          float windPhase=0.0;
        #endif
        float windH=max(transformed.y,0.0);
        float sway=(sin(uTime*1.15+windPhase)+0.5*sin(uTime*2.35+windPhase*1.7+1.3))*${swayStrength.toFixed(4)};
        transformed.x+=sway*windH;
        transformed.z+=sway*0.6*windH;`);
    };
    mat.customProgramCacheKey=()=>'forestwind'+swayStrength;
    mat.needsUpdate=true;
    mat.userData.uTime=uTime;
    windMats.push(mat);
    return mat;
  }

  // ---------- Ground mesh ----------
  const groundDivisions=Math.max(180,Math.round(groundSize)), groundRow=groundDivisions+1, groundStep=groundSize/groundDivisions;
  const groundPositions=new Float32Array(groundRow*groundRow*3);
  const groundColors=new Float32Array(groundRow*groundRow*3);
  const grassColor=new THREE.Color(0x647448), wornGrass=new THREE.Color(0x777352), rockyGrass=new THREE.Color(0x625e4c), trenchSoil=new THREE.Color(0x514637);
  const dirtRoad=new THREE.Color(0x756648), mudColor=new THREE.Color(0x403b32);
  const cliffRock=new THREE.Color(0x6e6a5e), cliffRockDark=new THREE.Color(0x4d4a42), cliffMoss=new THREE.Color(0x5b6442);
  for(let iz=0;iz<=groundDivisions;iz++) for(let ix=0;ix<=groundDivisions;ix++){
    const x=-groundSize/2+ix*groundStep, z=-groundSize/2+iz*groundStep, index=iz*groundRow+ix;
    const d=trenchDistance(x,z), roadD=pathsDistance(x,z,roadPaths), y=elevationAt(x,z)+terrainHeightFromDistance(d);
    groundPositions[index*3]=x; groundPositions[index*3+1]=y; groundPositions[index*3+2]=z;
    const patch=(Math.sin(x*0.31+z*0.13)*Math.cos(z*0.27-x*0.11)+1)*0.5;
    const color=grassColor.clone().lerp(wornGrass,patch*0.18);
    color.lerp(rockyGrass,MU.smoothstep(y,6,15)*0.42);
    if(roadD<3.1)color.lerp(dirtRoad,0.9);
    else if(roadD<5.2)color.lerp(dirtRoad,Math.max(0,1-(roadD-3.1)/2.1)*0.42);
    for(const mud of mudPatches){
      const md=Math.sqrt(((x-mud.x)/mud.rx)**2+((z-mud.z)/mud.rz)**2);
      if(md<1.0)color.lerp(mudColor,0.72*(1-md*0.22));
    }
    if(d<1.2) color.lerp(trenchSoil,0.9);
    else if(d<2.15) color.lerp(trenchSoil,Math.max(0,1-(d-1.2)/0.95));
    const cliff=cliffAt(x,z);
    if(cliff.rock>0.001){
      color.lerp(cliffRock,Math.min(0.94,cliff.rock*1.15));
      color.lerp(cliffRockDark,cliff.rock*0.3*patch);
      // A thin band of moss clings to the base of each cliff where it meets the grass.
      color.lerp(cliffMoss,Math.max(0,cliff.rock-0.3)*0.0+Math.max(0,0.35-Math.abs(cliff.rock-0.22))*0.5);
    }
    const noise=0.94+0.06*((Math.sin(x*2.1+z*1.7)+1)*0.5);
    groundColors[index*3]=color.r*noise; groundColors[index*3+1]=color.g*noise; groundColors[index*3+2]=color.b*noise;
  }
  // The ground is drawn in chunks that drop to half / quarter resolution with distance (see lod.js).
  // Trenches are only 2.4 m wide, so full detail is kept out further than before to also keep the cliffs crisp.
  const groundLOD=window.createLODTerrain(scene,{
    div:groundDivisions,size:groundSize,pos:groundPositions,col:groundColors,chunk:20,
    material:window.addGroundDetail(new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:false}),{strength:1.0,scale:1.0}),
    levels:[{dist:520,step:1},{dist:1100,step:2},{dist:Infinity,step:4}]
  });

  // Scattered woodland blocks frame long firing lanes and leave room to flank. Nothing is placed on bare
  // cliff rock (cliffAt().rock above the threshold below).
  const treeColliders=[];
  let mapSeed=18473;
  const mapRandom=()=>{mapSeed=(mapSeed*1664525+1013904223)>>>0;return mapSeed/4294967296;};
  const onCliffRock=(x,z)=>cliffAt(x,z).rock>0.22;
  const treeCount=460, treePositions=[];
  while(treePositions.length<treeCount){
    const x=(mapRandom()-0.5)*groundSize*0.92,z=(mapRandom()-0.5)*groundSize*0.92;
    if(Math.abs(x)<27 || Math.hypot(x,z)<25 || trenchDistance(x,z)<4.5 || onCliffRock(x,z)) continue;
    if(treePositions.some(p=>Math.hypot(p.x-x,p.z-z)<6.2)) continue;
    treePositions.push({x,z,height:6+mapRandom()*2.8,width:0.9+mapRandom()*0.45,deciduous:mapRandom()<0.25});
  }
  const pinePositions=treePositions.filter(p=>!p.deciduous),leafPositions=treePositions.filter(p=>p.deciduous);
  // Uneven, stepped spruce bough tiers read as branches instead of three
  // perfect cones. A wider skirt gives each pine a fuller, less spike-like form.
  function makeBoughTier(radius,height,seed){
    const sides=11, rings=4, positions=[];
    for(let ring=0;ring<rings-1;ring++){
      const t=ring/(rings-1), y=height*(0.08+t*0.92)-height*0.5;
      const r=radius*(1-t)*(ring===0?0.72:1);
      for(let side=0;side<sides;side++){
        const a=side/sides*Math.PI*2+seed;
        const jitter=1+0.1*Math.sin(side*7+seed*11+ring*2);
        positions.push([Math.cos(a)*r*jitter,y,Math.sin(a)*r*jitter]);
      }
    }
    positions.push([0,height*0.5,0]);
    const verts=[];
    for(let ring=0;ring<rings-2;ring++)for(let side=0;side<sides;side++){
      const a=ring*sides+side,b=ring*sides+(side+1)%sides,c=(ring+1)*sides+side,d=(ring+1)*sides+(side+1)%sides;
      verts.push(...positions[a],...positions[c],...positions[b],...positions[b],...positions[c],...positions[d]);
    }
    const top=(rings-1)*sides;
    for(let side=0;side<sides;side++)verts.push(...positions[top-sides+side],...positions[top],...positions[top-sides+(side+1)%sides]);
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geometry.computeVertexNormals();return geometry;
  }
  // Distant version of a bough tier: a 6-sided cone with the same footprint and height (12 triangles instead of 55).
  function makeFarTier(radius,height){
    const g=new THREE.ConeGeometry(radius*0.8,height*0.92,6,1);
    g.translate(0,height*0.04,0);
    return g;
  }
  const dummy=new THREE.Object3D();
  // All random numbers are rolled here in exactly the order the old code drew them, so the layout of the
  // debris, logs and so on further down stays the same as before.
  const crownDefs=[[0,0.73,0,1.25,0.38,1.05],[-0.43,0.65,0.1,0.82,0.3,0.78],[0.36,0.68,-0.18,0.88,0.32,0.82]];
  treePositions.forEach(p=>{
    p.y=terrainHeightAt(p.x,p.z);
    p.trunkRot=mapRandom()*Math.PI*2;
    treeColliders.push({x:p.x,z:p.z,radius:0.95*p.width});
  });
  const crownItems=[];
  treePositions.forEach(p=>{
    if(p.deciduous){
      // Three overlapping crowns make broadleaf trees feel leafy and irregular.
      for(const [ox,oy,oz,sx,sy,sz] of crownDefs){
        const rx=mapRandom()*0.25,ry=mapRandom()*Math.PI*2,rz=mapRandom()*0.25,shade=0.82+mapRandom()*0.32;
        crownItems.push({x:p.x,z:p.z,p,ox,oy,oz,sx,sy,sz,rx,ry,rz,shade});
      }
    } else {
      p.tiers=[0,1,2].map(()=>({ry:mapRandom()*Math.PI*2,shade:0.82+mapRandom()*0.32}));
    }
  });
  const tierDefs=[[0.35,3.7,1,1.9,0x34472c],[0.59,3.5,0.82,1.48,0x3c5032],[0.81,3.2,0.63,1.08,0x4b603a]];
  const tierSeeds=[0.2,0.7,1.1];
  const tierLayers=tierDefs.map(([hPos,gh,ws,radius,color],tier)=>({
    items:pinePositions,
    near:makeBoughTier(radius,gh,tierSeeds[tier]),far:makeFarTier(radius,gh),
    mat:windMaterial({color,roughness:1,flatShading:true},0.055),
    place:(d,p)=>{d.position.set(p.x,p.y+p.height*hPos,p.z);d.rotation.set(0,p.tiers[tier].ry,0);d.scale.set(p.width*ws,p.height/gh,p.width*ws);},
    color:p=>{const sh=p.tiers[tier].shade;return new THREE.Color(sh,sh,sh);}
  }));
  // Trees go near/far by distance: past ~150 m pines become plain cones and broadleaf crowns lose their
  // extra subdivision. Trunks are the only tree part that casts shadows, as before; they stay rigid in the
  // wind (near-zero sway) while the tiers and crowns above them bend.
  const treeLOD=window.createLODInstances(scene,{
    cell:130,nearDist:520,
    layers:[
      {items:treePositions,near:new THREE.CylinderGeometry(0.15,0.29,4.4,9),far:new THREE.CylinderGeometry(0.15,0.29,4.4,5),
       mat:windMaterial({color:0x51402c,roughness:1},0.006),cast:true,
       place:(d,p)=>{d.position.set(p.x,p.y+p.height*0.34,p.z);d.rotation.set(0,p.trunkRot,0);d.scale.set(p.width,p.height/6.4,p.width);}},
      ...tierLayers,
      {items:crownItems,near:new THREE.DodecahedronGeometry(1,1),far:new THREE.DodecahedronGeometry(1,0),
       mat:windMaterial({color:0x455c39,roughness:1,flatShading:true},0.05),
       place:(d,c)=>{const p=c.p,w=p.width,h=p.height;d.position.set(p.x+c.ox*w,p.y+h*c.oy,p.z+c.oz*w);d.rotation.set(c.rx,c.ry,c.rz);d.scale.set(w*2.1*c.sx,h*c.sy,w*1.75*c.sz);},
       color:c=>new THREE.Color(c.shade,c.shade,c.shade)}
    ]
  });

  // Scattered broken timber and stones add battlefield debris without cluttering the spawn lane.
  const debrisPositions=[];
  while(debrisPositions.length<420){
    const x=(mapRandom()-0.5)*groundSize*0.9,z=(mapRandom()-0.5)*groundSize*0.9;
    if(Math.abs(x)<15 || Math.hypot(x,z)<13 || trenchDistance(x,z)<2.3 || onCliffRock(x,z)) continue;
    debrisPositions.push({x,z,size:0.22+mapRandom()*0.48});
  }
  debrisPositions.forEach(p=>{p.rx=mapRandom()*0.8;p.ry=mapRandom()*Math.PI*2;p.rz=mapRandom()*0.8;});
  const logPositions=[];
  while(logPositions.length<130){
    const x=(mapRandom()-0.5)*groundSize*0.88,z=(mapRandom()-0.5)*groundSize*0.88;
    if(Math.abs(x)<15 || Math.hypot(x,z)<14 || trenchDistance(x,z)<2.3 || onCliffRock(x,z)) continue;
    logPositions.push({x,z,angle:mapRandom()*Math.PI*2});
  }
  const sandbagPositions=[];
  trenchPaths.forEach(path=>path.slice(0,-1).forEach((a,i)=>{
    const b=path[i+1], dx=b[0]-a[0], dz=b[1]-a[1], length=Math.hypot(dx,dz), steps=Math.floor(length/2.6);
    for(let n=0;n<steps;n++){
      const t=(n+0.5)/steps, side=n%2===0?1:-1;
      const x=a[0]+dx*t+side*(-dz/length)*1.35;
      const z=a[1]+dz*t+side*(dx/length)*1.35;
      sandbagPositions.push({x,z,angle:Math.atan2(dx,dz)});
    }
  }));
  // Low underbrush and ferns give the forest floor some clutter close up without blocking movement
  // (no colliders) - clumps of two or three overlapping blobs rather than one clean shape each.
  const bushPositions=[];
  while(bushPositions.length<260){
    const x=(mapRandom()-0.5)*groundSize*0.9,z=(mapRandom()-0.5)*groundSize*0.9;
    if(Math.abs(x)<18 || Math.hypot(x,z)<16 || trenchDistance(x,z)<3.2 || onCliffRock(x,z)) continue;
    bushPositions.push({x,z,size:0.55+mapRandom()*0.6,squash:0.55+mapRandom()*0.3,ry:mapRandom()*Math.PI*2,shade:0.8+mapRandom()*0.4});
  }
  // Old cut stumps dotted through the woods, independent of where the standing trees ended up.
  const stumpPositions=[];
  while(stumpPositions.length<70){
    const x=(mapRandom()-0.5)*groundSize*0.88,z=(mapRandom()-0.5)*groundSize*0.88;
    if(Math.abs(x)<15 || Math.hypot(x,z)<14 || trenchDistance(x,z)<3 || onCliffRock(x,z)) continue;
    if(treePositions.some(p=>Math.hypot(p.x-x,p.z-z)<4)) continue;
    stumpPositions.push({x,z,r:0.22+mapRandom()*0.14,h:0.3+mapRandom()*0.22,ry:mapRandom()*Math.PI*2});
  }
  // Weathered boulders and small talus clusters, including loose rock spilled at the foot of the cliffs.
  const boulderPositions=[], boulderColliders=[];
  while(boulderPositions.length<110){
    const x=(mapRandom()-0.5)*groundSize*0.96,z=(mapRandom()-0.5)*groundSize*0.96;
    if(Math.abs(x)<20 && Math.abs(z)<20) continue;
    if(trenchDistance(x,z)<3.5) continue;
    const rock=cliffAt(x,z).rock;
    if(rock>0.75) continue; // not embedded in the sheer face itself
    const scale=(1.1+Math.pow(mapRandom(),1.6)*3.4)*(1+rock*0.6);
    const y=terrainHeightAt(x,z)+scale*0.32;
    const sx=scale*(0.8+mapRandom()*0.8),sy=scale*(0.55+mapRandom()*0.55),sz=scale*(0.75+mapRandom()*0.7);
    boulderPositions.push({x,y,z,sx,sy,sz,rx:mapRandom()*0.4,ry:mapRandom()*Math.PI*2,rz:mapRandom()*0.4,shade:0.78+mapRandom()*0.4});
    boulderColliders.push({x,z,radius:Math.max(sx,sz)*0.6});
  }
  treeColliders.push(...boulderColliders);

  // Small props (forest rubble, logs, sandbags, stumps, boulders) are only drawn within ~190 m; bushes
  // are small enough that this is well past where anyone would notice the switch to nothing.
  const up=new THREE.Vector3(0,1,0),logDir=new THREE.Vector3();
  const propLOD=window.createLODInstances(scene,{
    cell:130,nearDist:520,
    layers:[
      {items:debrisPositions,near:new THREE.IcosahedronGeometry(1,0),far:null,
       mat:new THREE.MeshStandardMaterial({color:0x625b4a,roughness:1,flatShading:true}),
       place:(d,p)=>{const s=p.size;d.position.set(p.x,terrainHeightAt(p.x,p.z)+s*0.38,p.z);d.rotation.set(p.rx,p.ry,p.rz);d.scale.set(s,s*0.65,s*1.25);}},
      {items:logPositions,near:new THREE.CylinderGeometry(0.13,0.18,1.9,7),far:null,
       mat:new THREE.MeshStandardMaterial({color:0x59422b,roughness:1}),
       place:(d,p)=>{d.position.set(p.x,terrainHeightAt(p.x,p.z)+0.13,p.z);d.quaternion.setFromUnitVectors(up,logDir.set(Math.cos(p.angle),0,Math.sin(p.angle)));d.scale.set(1,1,1);}},
      {items:sandbagPositions,near:new THREE.BoxGeometry(0.72,0.22,0.42),far:null,
       mat:new THREE.MeshStandardMaterial({color:0x8a8060,roughness:1}),
       place:(d,p)=>{d.position.set(p.x,terrainHeightAt(p.x,p.z)+0.12,p.z);d.rotation.set(0,p.angle,0);d.scale.set(1,0.8,1);}},
      {items:stumpPositions,near:new THREE.CylinderGeometry(1,1.08,1,10),far:null,
       mat:new THREE.MeshStandardMaterial({color:0x4a3625,roughness:1}),
       place:(d,p)=>{d.position.set(p.x,terrainHeightAt(p.x,p.z)+p.h*0.5,p.z);d.rotation.set(0,p.ry,0);d.scale.set(p.r,p.h,p.r);}},
      {items:bushPositions,near:new THREE.IcosahedronGeometry(1,1),far:null,
       mat:windMaterial({color:0x4f5a35,roughness:1,flatShading:true},0.03),
       place:(d,p)=>{d.position.set(p.x,terrainHeightAt(p.x,p.z)+p.size*p.squash*0.5,p.z);d.rotation.set(0,p.ry,0);d.scale.set(p.size,p.size*p.squash,p.size*0.9);},
       color:p=>new THREE.Color(p.shade*0.55,p.shade*0.62,p.shade*0.4)},
      {items:boulderPositions,near:new THREE.DodecahedronGeometry(1,1),far:new THREE.DodecahedronGeometry(1,0),
       mat:new THREE.MeshStandardMaterial({color:0x7a7566,roughness:1,flatShading:true}),
       place:(d,r)=>{d.position.set(r.x,r.y,r.z);d.scale.set(r.sx,r.sy,r.sz);d.rotation.set(r.rx,r.ry,r.rz);},
       color:r=>new THREE.Color(r.shade,r.shade*0.98,r.shade*0.92)}
    ]
  });

  function updateLOD(camPos,t){
    groundLOD.update(camPos); treeLOD.update(camPos); propLOD.update(camPos);
    if(t!==undefined) for(const m of windMats) m.userData.uTime.value=t;
  }

  // Drawn on the minimap by game.js: {pts:[[x,z],...], w:width in metres, color}
  const minimapLines=[
    ...roadPaths.map(pts=>({pts,w:7,color:'#a39064'})),
    ...trenchPaths.map(pts=>({pts,w:3.4,color:'#3a2f22'}))
  ];
  return {terrainHeightAt, treeColliders, updateLOD, minimapLines};
};

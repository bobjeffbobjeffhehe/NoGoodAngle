window.createDesertMap = function(scene, groundSize){
  const THREE = window.THREE;
  const MU = THREE.MathUtils;
  const scale=groundSize/280;
  let seed=927461;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};

  // Broad ridges and bowls make elevated positions useful while leaving
  // several traversable passes between them. Everything below is authored in a fixed raw-coordinate
  // space and multiplied by `scale` (tied to groundSize), so the whole composition grows or shrinks
  // together if groundSize ever changes.
  const hills=[
    {x:-82,z:-70,rx:48,rz:38,h:17},{x:26,z:-91,rx:52,rz:36,h:20},
    {x:91,z:-21,rx:39,rz:54,h:16},{x:68,z:76,rx:51,rz:39,h:19},
    {x:-35,z:80,rx:56,rz:43,h:15},{x:-104,z:31,rx:36,rz:47,h:13},
    {x:-3,z:-7,rx:31,rz:26,h:7},{x:8,z:47,rx:38,rz:25,h:5},
    // Added for the bigger map: fill out the far corners so the extra room reads as new terrain,
    // not just empty sand between the original ridgelines.
    {x:-58,z:112,rx:34,rz:44,h:11},{x:122,z:-128,rx:30,rz:40,h:9},
    {x:-130,z:-102,rx:27,rz:31,h:8},{x:132,z:96,rx:33,rz:29,h:10}
  ].map(h=>({...h,x:h.x*scale,z:h.z*scale,rx:h.rx*scale,rz:h.rz*scale}));
  const basins=[
    {x:-46,z:-40,rx:25,rz:19,h:3},{x:46,z:24,rx:28,rz:20,h:4},{x:-5,z:102,rx:24,rz:19,h:3},
    {x:88,z:-92,rx:22,rz:26,h:4},{x:-110,z:60,rx:20,rz:24,h:3}
  ].map(b=>({...b,x:b.x*scale,z:b.z*scale,rx:b.rx*scale,rz:b.rz*scale}));
  const scaledPaths=paths=>paths.map(path=>path.map(([x,z])=>[x*scale,z*scale]));
  const roadPaths=scaledPaths([
    [[-128,-108],[-82,-75],[-36,-31],[5,12],[48,48],[94,82],[132,118]],
    [[-132,108],[-84,74],[-35,38],[8,5],[54,-32],[99,-70],[134,-112]],
    // A short connecting spur ties the two diagonal roads together, giving an extra route option.
    [[-35,38],[-6,2],[26,-8]]
  ]);
  const washPaths=scaledPaths([
    [[-136,-4],[-92,8],[-48,1],[-8,18],[37,7],[84,21],[136,12]],
    [[-92,-136],[-78,-92],[-90,-48],[-76,-8]],
    [[20,30],[36,70],[28,108],[40,140]]
  ]);
  // Broad, gently domed mesas: climbable from every side (no special ramp, just a shallower rise than
  // the cliffs in the forest map), tall enough to be worth fighting for as hull-down high ground.
  const mesas=[
    {x:-20,z:-130,rx:30,rz:26,h:15},{x:118,z:18,rx:26,rz:30,h:12},{x:-112,z:92,rx:24,rz:22,h:10}
  ].map(m=>({...m,x:m.x*scale,z:m.z*scale,rx:m.rx*scale,rz:m.rz*scale}));
  // Dark scorched-earth rings and lighter desert-pavement gravel patches add battlefield variety
  // to the sand without needing extra geometry.
  const scorchPatches=[
    {x:40,z:-50,r:9},{x:-70,z:20,r:7},{x:100,z:60,r:8},{x:-30,z:-110,r:6},{x:60,z:120,r:7}
  ].map(s=>({...s,x:s.x*scale,z:s.z*scale,r:s.r*scale}));
  const gravelPatches=[
    {x:-100,z:-30,rx:34,rz:26},{x:60,z:-20,rx:30,rz:24},{x:10,z:95,rx:28,rz:22},{x:-50,z:115,rx:26,rz:20}
  ].map(g=>({...g,x:g.x*scale,z:g.z*scale,rx:g.rx*scale,rz:g.rz*scale}));

  function distanceToPaths(x,z,paths){
    let closest=Infinity;   // squared distance; one sqrt at the end instead of Math.hypot per segment (hot: runs hundreds of times a frame)
    for(const path of paths)for(let i=0;i<path.length-1;i++){
      const a=path[i],b=path[i+1],dx=b[0]-a[0],dz=b[1]-a[1];
      const t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));
      const ex=x-(a[0]+dx*t), ez=z-(a[1]+dz*t), d2=ex*ex+ez*ez;
      if(d2<closest) closest=d2;
    }
    return Math.sqrt(closest);
  }
  function washHeight(d){
    if(d<8*scale)return -1.8*(1-(d/(8*scale))**2);
    if(d<14*scale)return 0.42*Math.sin(Math.PI*(d-8*scale)/(6*scale));
    return 0;
  }
  // Returns {h, rock}: height contribution and a 0..1 "is this bare mesa rock" factor for colouring
  // and for keeping scrub/debris off the steepest part of the slope.
  function mesaAt(x,z){
    let bestH=0,bestRock=0;
    for(const m of mesas){
      const dx=(x-m.x)/m.rx,dz=(z-m.z)/m.rz,d2=dx*dx+dz*dz;
      if(d2>1.1*1.1) continue;
      const t=Math.max(0,1-d2);
      const h=m.h*Math.pow(t,0.45);
      if(h>bestH){ bestH=h; bestRock=MU.smoothstep(t,0.1,0.55); }
    }
    return {h:bestH,rock:bestRock};
  }
  function terrainHeightAt(x,z){
    const sx=x/scale,sz=z/scale;
    const flankRelief=THREE.MathUtils.smoothstep(Math.abs(sx),16,40);
    let y=(0.65*Math.sin(sx*0.025+sz*0.017)+0.45*Math.cos(sz*0.031-sx*0.014)
      +1.0*Math.sin(sx*0.075+sz*0.026)*Math.cos(sz*0.061-sx*0.018))*flankRelief;
    for(const h of hills){const dx=(x-h.x)/h.rx,dz=(z-h.z)/h.rz;y+=h.h*Math.exp(-1.55*(dx*dx+dz*dz))*flankRelief;}
    for(const b of basins){const dx=(x-b.x)/b.rx,dz=(z-b.z)/b.rz;y-=b.h*Math.exp(-1.8*(dx*dx+dz*dz));}
    y+=mesaAt(x,z).h;
    return y+washHeight(distanceToPaths(x,z,washPaths));
  }

  const divisions=Math.max(240,Math.round(groundSize*0.9/20)*20),row=divisions+1,step=groundSize/divisions;
  const positions=new Float32Array(row*row*3),colors=new Float32Array(row*row*3);
  const sand=new THREE.Color(0xb69a67),lightSand=new THREE.Color(0xcbb17e),rocky=new THREE.Color(0x8d7957);
  const packedRoad=new THREE.Color(0x90754f),washColor=new THREE.Color(0x928267),darkWash=new THREE.Color(0x74654c);
  const scorch=new THREE.Color(0x3c352c),gravel=new THREE.Color(0x9c8f78),mesaRock=new THREE.Color(0x7c6e58);
  for(let iz=0;iz<=divisions;iz++)for(let ix=0;ix<=divisions;ix++){
    const x=-groundSize/2+ix*step,z=-groundSize/2+iz*step,i=iz*row+ix,y=terrainHeightAt(x,z);
    positions[i*3]=x;positions[i*3+1]=y;positions[i*3+2]=z;
    const sx=x/scale,sz=z/scale;
    const patch=(Math.sin(sx*.11+sz*.04)*Math.cos(sz*.095-sx*.06)+1)*.5;
    // A finer, higher-frequency ripple on top of the broad patchwork reads as wind-blown dune texture
    // when the camera is close to the ground.
    const ripple=(Math.sin(sx*.9+sz*.35)*Math.cos(sz*.8-sx*.5)+1)*.5;
    const roadD=distanceToPaths(x,z,roadPaths),washD=distanceToPaths(x,z,washPaths);
    const color=sand.clone().lerp(lightSand,patch*.48).lerp(rocky,Math.min(.48,Math.max(0,(y-9)/38)));
    color.lerp(lightSand,ripple*0.08);
    if(washD<8*scale)color.lerp(darkWash,0.72);
    else if(washD<14*scale)color.lerp(washColor,Math.max(0,1-(washD-8*scale)/(6*scale))*0.55);
    if(roadD<3.8*scale)color.lerp(packedRoad,0.76);
    else if(roadD<6.5*scale)color.lerp(packedRoad,Math.max(0,1-(roadD-3.8*scale)/(2.7*scale))*0.36);
    for(const s of scorchPatches){
      const sd=Math.hypot(x-s.x,z-s.z)/s.r;
      if(sd<1) color.lerp(scorch,0.6*(1-sd*sd));
    }
    for(const g of gravelPatches){
      const gd=Math.sqrt(((x-g.x)/g.rx)**2+((z-g.z)/g.rz)**2);
      if(gd<1) color.lerp(gravel,0.35*(1-gd)*(0.8+0.2*ripple));
    }
    const mesa=mesaAt(x,z);
    if(mesa.rock>0.001) color.lerp(mesaRock,Math.min(0.85,mesa.rock*1.1));
    const variation=.92+.08*((Math.sin(sx*1.8+sz*2.4)+1)*.5);
    colors[i*3]=color.r*variation;colors[i*3+1]=color.g*variation;colors[i*3+2]=color.b*variation;
  }
  // Ground is drawn in chunks that drop to half / quarter resolution with distance (see lod.js).
  const terrainLOD=window.createLODTerrain(scene,{
    div:divisions,size:groundSize,pos:positions,col:colors,chunk:20,
    material:window.addGroundDetail(new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:false}),{strength:0.9,scale:1.1}),
    levels:[{dist:520,step:1},{dist:1100,step:2},{dist:Infinity,step:4}]
  });

  const onMesaRock=(x,z)=>mesaAt(x,z).rock>0.3;

  // ---------- Rock clusters (replaces the old single repeated rock shape) ----------
  // Two distinct rock silhouettes - a rounded boulder and a flatter wind-scoured slab - placed in loose
  // clusters of 2-4 with independently jittered position, scale and rotation, plus an occasional bigger
  // "anchor" rock in the cluster. Mixing shape and grouping like this reads as natural scatter instead of
  // the same pebble copy-pasted across the desert.
  const boulderItems=[], slabItems=[], rockColliders=[];
  const clusterCount=115;
  for(let c=0;c<clusterCount;c++){
    let cx,cz,attempt=0;
    do{cx=(random()-.5)*(groundSize-24);cz=(random()-.5)*(groundSize-24);attempt++;}
    while((Math.hypot(cx,cz)<28*scale || (Math.abs(cx)<22*scale && Math.abs(cz)<groundSize*.43) || onMesaRock(cx,cz))&&attempt<60);
    if(attempt>=60) continue;
    const members=2+Math.floor(random()*3);
    const anchor=random()<0.3 ? Math.floor(random()*members) : -1;
    for(let m=0;m<members;m++){
      const jx=cx+(random()-0.5)*6*scale, jz=cz+(random()-0.5)*6*scale;
      let rockScale=(2.2+Math.pow(random(),1.5)*4.6)*(0.9+0.2*scale);
      if(m===anchor) rockScale*=1.4+random()*0.4;
      const y=terrainHeightAt(jx,jz)+rockScale*.35;
      const sx=rockScale*(.8+random()*.8), sy=rockScale*(.4+random()*.55), sz=rockScale*(.75+random()*.75);
      const rx=random()*.4, ry=random()*Math.PI*2, rz=random()*.4;
      rockColliders.push({x:jx,z:jz,radius:Math.max(sx,sz)*.62});
      const shade=.72+random()*.44;
      const item={x:jx,z:jz,y,sx,sy,sz,rx,ry,rz,shade};
      if(random()<0.62) boulderItems.push(item); else slabItems.push(item);
    }
  }
  const rockLOD=window.createLODInstances(scene,{
    cell:150,nearDist:600,sphereY:8,sphereR:20,
    layers:[
      {items:boulderItems,
       near:new THREE.DodecahedronGeometry(1,1),far:new THREE.DodecahedronGeometry(1,0),
       mat:new THREE.MeshStandardMaterial({color:0x82745e,roughness:1,flatShading:true}),
       place:(d,r)=>{d.position.set(r.x,r.y,r.z);d.scale.set(r.sx,r.sy,r.sz);d.rotation.set(r.rx,r.ry,r.rz);},
       color:r=>new THREE.Color(r.shade,r.shade*.98,r.shade*.91)},
      {items:slabItems,
       near:new THREE.IcosahedronGeometry(1,1),far:new THREE.IcosahedronGeometry(1,0),
       mat:new THREE.MeshStandardMaterial({color:0x8f7f63,roughness:1,flatShading:true}),
       place:(d,r)=>{d.position.set(r.x,r.y*0.6,r.z);d.scale.set(r.sx*1.3,r.sy*0.5,r.sz*1.3);d.rotation.set(r.rx*0.3,r.ry,r.rz*0.3);},
       color:r=>new THREE.Color(r.shade*0.96,r.shade*.9,r.shade*.8)}
    ]
  });

  // ---------- Scrub, dead shrubs and battlefield debris ----------
  // Sparse low vegetation and war debris so the open sand isn't just dunes and rocks. None of these
  // are colliders - a tank simply drives through them, same as the forest's underbrush.
  const scrubPositions=[];
  while(scrubPositions.length<230){
    const x=(random()-.5)*groundSize*0.94,z=(random()-.5)*groundSize*0.94;
    if(Math.hypot(x,z)<24*scale || distanceToPaths(x,z,washPaths)<3 || onMesaRock(x,z)) continue;
    scrubPositions.push({x,z,size:0.4+random()*0.55,squash:0.4+random()*0.3,ry:random()*Math.PI*2,shade:0.75+random()*0.4});
  }
  const deadShrubPositions=[];
  while(deadShrubPositions.length<40){
    const x=(random()-.5)*groundSize*0.92,z=(random()-.5)*groundSize*0.92;
    if(Math.hypot(x,z)<30*scale || onMesaRock(x,z)) continue;
    deadShrubPositions.push({x,z,h:0.6+random()*0.5,ry:random()*Math.PI*2});
  }
  const debrisPositions=[];
  while(debrisPositions.length<100){
    const x=(random()-.5)*groundSize*0.88,z=(random()-.5)*groundSize*0.88;
    if(distanceToPaths(x,z,roadPaths)>26*scale || onMesaRock(x,z)) continue; // scattered along the roads, not uniformly everywhere
    debrisPositions.push({x,z,kind:random()<0.4?'drum':'crate',ry:random()*Math.PI*2,size:0.42+random()*0.22});
  }
  const up=new THREE.Vector3(0,1,0), shrubDir=new THREE.Vector3();
  const propLOD=window.createLODInstances(scene,{
    cell:150,nearDist:600,
    layers:[
      {items:scrubPositions,near:new THREE.IcosahedronGeometry(1,1),far:null,
       mat:new THREE.MeshStandardMaterial({color:0x8a7a4e,roughness:1,flatShading:true}),
       place:(d,p)=>{d.position.set(p.x,terrainHeightAt(p.x,p.z)+p.size*p.squash*0.5,p.z);d.rotation.set(0,p.ry,0);d.scale.set(p.size,p.size*p.squash,p.size*0.9);},
       color:p=>new THREE.Color(p.shade,p.shade*0.92,p.shade*0.6)},
      {items:deadShrubPositions,near:new THREE.CylinderGeometry(0.01,0.05,1,5),far:null,
       mat:new THREE.MeshStandardMaterial({color:0x4a3f2c,roughness:1}),
       place:(d,p)=>{d.position.set(p.x,terrainHeightAt(p.x,p.z)+p.h*0.5,p.z);d.rotation.set(0,p.ry,0.18);d.scale.set(1,p.h,1);}},
      {items:debrisPositions.filter(p=>p.kind==='crate'),near:new THREE.BoxGeometry(1,1,1),far:null,
       mat:new THREE.MeshStandardMaterial({color:0x5c4a30,roughness:1}),
       place:(d,p)=>{const s=p.size;d.position.set(p.x,terrainHeightAt(p.x,p.z)+s*0.5,p.z);d.rotation.set(0,p.ry,0);d.scale.set(s,s*0.85,s);}},
      {items:debrisPositions.filter(p=>p.kind==='drum'),near:new THREE.CylinderGeometry(0.3,0.3,0.9,10),far:null,
       mat:new THREE.MeshStandardMaterial({color:0x6b3a2a,roughness:0.8,metalness:0.2}),
       place:(d,p)=>{d.position.set(p.x,terrainHeightAt(p.x,p.z)+0.45,p.z);d.rotation.set(0,p.ry,0);d.scale.set(p.size*1.6,p.size*1.6,p.size*1.6);}}
    ]
  });

  const updateLOD=cam=>{terrainLOD.update(cam);rockLOD.update(cam);propLOD.update(cam);};
  const minimapLines=[
    ...washPaths.map(pts=>({pts,w:15*scale,color:'#8f7d5f'})),
    ...roadPaths.map(pts=>({pts,w:7.6*scale,color:'#a98b5c'}))
  ];
  return {terrainHeightAt,treeColliders:rockColliders,updateLOD,minimapLines};
};

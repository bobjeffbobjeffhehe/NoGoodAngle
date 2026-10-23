// Shared level-of-detail helpers for the map files. Tanks are NOT touched by anything in here.
//
// createLODTerrain: splits a big height grid into chunks. Each chunk swaps between full, half and quarter
//   resolution index buffers by distance (the vertex data is shared, only the triangles drawn change). A thin
//   skirt hangs below every chunk edge so neighbouring chunks at different detail never show cracks.
//   Each chunk is its own mesh, so chunks off screen are not drawn at all.
// createLODInstances: groups instanced objects (trees, rocks, debris) into square cells. Each cell has a detailed
//   InstancedMesh and a cheaper one; the cell shows one or the other by distance. Cells also get a proper bounding
//   sphere, so objects behind the camera are skipped (InstancedMesh culling in three r128 otherwise only looks
//   at the geometry's own sphere).

window.createLODTerrain = function(scene, o){
  const THREE = window.THREE;
  const div = o.div, row = div+1, step = o.size/div, half = o.size/2;
  let C = o.chunk || 20;
  while(C > 4 && (div % C || C % 4)) C--;
  const pos = o.pos, col = o.col, uvs = o.uv || null, skirt = o.skirt === undefined ? 3 : o.skirt;
  const levels = o.levels || [{dist:Infinity, step:1}];

  // Normals come from the whole grid, so chunk borders shade seamlessly.
  let nor = o.nor;
  if(!nor){
    nor = new Float32Array(row*row*3);
    const H = (ix,iz) => pos[(Math.min(div,Math.max(0,iz))*row + Math.min(div,Math.max(0,ix)))*3+1];
    for(let iz=0; iz<=div; iz++) for(let ix=0; ix<=div; ix++){
      const i = iz*row+ix;
      const nx = -(H(ix+1,iz)-H(ix-1,iz))/(2*step), nz = -(H(ix,iz+1)-H(ix,iz-1))/(2*step), l = Math.hypot(nx,1,nz);
      nor[i*3] = nx/l; nor[i*3+1] = 1/l; nor[i*3+2] = nz/l;
    }
  }

  const side = C+1, skBase = side*side, nv = side*side + 4*side;
  // Border vertex of a chunk: edge k (0 north, 1 south, 2 west, 3 east), position i along it.
  const borderIdx = (k,i) => k===0 ? i : k===1 ? C*side+i : k===2 ? i*side : i*side+C;
  function makeIndex(s){
    const idx = [];
    for(let lz=0; lz<C; lz+=s) for(let lx=0; lx<C; lx+=s){
      const a = lz*side+lx, b = a+s, c = a+s*side, d = c+s;
      idx.push(a,c,b,b,c,d);
    }
    // Skirt quads face outward only (a crack is always seen from the neighbouring chunk's side), so each
    // edge gets 2 triangles per segment. North and east edges wind one way, south and west the other.
    for(let k=0; k<4; k++) for(let i=0; i<C; i+=s){
      const b0 = borderIdx(k,i), b1 = borderIdx(k,i+s), s0 = skBase+k*side+i, s1 = skBase+k*side+i+s;
      if(k===0 || k===3) idx.push(b0,b1,s1, b0,s1,s0);
      else idx.push(b0,s1,b1, b0,s0,s1);
    }
    return new THREE.BufferAttribute(new Uint16Array(idx),1);
  }
  const indexSets = levels.map(l => makeIndex(C % l.step === 0 ? l.step : 1));

  const chunks = [], nC = div / C, radius = C*step*0.5;
  for(let cz=0; cz<nC; cz++) for(let cx=0; cx<nC; cx++){
    const p = new Float32Array(nv*3), n = new Float32Array(nv*3), c = new Float32Array(nv*3), uv = uvs ? new Float32Array(nv*2) : null;
    const copy = (li,gi,drop) => {
      p[li*3] = pos[gi*3]; p[li*3+1] = pos[gi*3+1]-drop; p[li*3+2] = pos[gi*3+2];
      n[li*3] = nor[gi*3]; n[li*3+1] = nor[gi*3+1]; n[li*3+2] = nor[gi*3+2];
      c[li*3] = col[gi*3]; c[li*3+1] = col[gi*3+1]; c[li*3+2] = col[gi*3+2];
      if(uv){ uv[li*2] = uvs[gi*2]; uv[li*2+1] = uvs[gi*2+1]; }
    };
    const gIdx = (lx,lz) => (cz*C+lz)*row + (cx*C+lx);
    for(let lz=0; lz<=C; lz++) for(let lx=0; lx<=C; lx++) copy(lz*side+lx, gIdx(lx,lz), 0);
    for(let k=0; k<4; k++) for(let i=0; i<=C; i++){
      const bi = borderIdx(k,i), lx = bi % side, lz = (bi-lx)/side;
      copy(skBase+k*side+i, gIdx(lx,lz), skirt);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(p,3));
    geo.setAttribute('normal', new THREE.BufferAttribute(n,3));
    geo.setAttribute('color', new THREE.BufferAttribute(c,3));
    if(uv) geo.setAttribute('uv', new THREE.BufferAttribute(uv,2));
    const last = levels.length-1;
    geo.setIndex(indexSets[last]);
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, o.material);
    mesh.receiveShadow = true;
    scene.add(mesh);
    chunks.push({geo, x:-half+(cx*C+C/2)*step, z:-half+(cz*C+C/2)*step, lvl:last});
  }

  function update(cam){
    for(const ch of chunks){
      const d = Math.hypot(cam.x-ch.x, cam.z-ch.z) - radius;
      let t = 0;
      while(t < levels.length-1 && d >= levels[t].dist) t++;
      // Hysteresis: only move to a finer level once clearly inside its range, so chunks don't flicker at the edge.
      if(t < ch.lvl && d > levels[t].dist*0.92) t = ch.lvl;
      if(t !== ch.lvl){ ch.lvl = t; ch.geo.setIndex(indexSets[t]); }
    }
  }
  return {update};
};

// spec: {cell, nearDist, cullDist?, sphereY?, sphereR?, layers:[{items, near, far, mat, cast, receive, place(dummy,item,k), color(item,k)}]}
//  - items: anything with x,z (world position). place() writes the item's world transform onto a THREE.Object3D.
//  - far may be null: the layer then disappears beyond nearDist.
window.createLODInstances = function(scene, spec){
  const THREE = window.THREE;
  const cellSize = spec.cell || 64, nearDist = spec.nearDist || 120, cullDist = spec.cullDist || Infinity;
  const sphere = new THREE.Sphere(new THREE.Vector3(0, spec.sphereY === undefined ? 10 : spec.sphereY, 0), cellSize*0.75 + (spec.sphereR === undefined ? 30 : spec.sphereR));
  const cells = new Map(), dummy = new THREE.Object3D();
  for(const layer of spec.layers){
    if(!layer.items.length) continue;
    layer.near.boundingSphere = sphere;
    if(layer.far) layer.far.boundingSphere = sphere;
    const byCell = new Map();
    layer.items.forEach((it,k) => {
      const key = Math.floor(it.x/cellSize)+','+Math.floor(it.z/cellSize);
      let a = byCell.get(key); if(!a){ a = []; byCell.set(key,a); }
      a.push([it,k]);
    });
    byCell.forEach((arr,key) => {
      const [ci,cj] = key.split(',').map(Number), ox = (ci+0.5)*cellSize, oz = (cj+0.5)*cellSize;
      let cell = cells.get(key); if(!cell){ cell = {x:ox, z:oz, near:[], far:[]}; cells.set(key,cell); }
      // Transforms and colours are decided once and shared by the near and far meshes, so they always line up.
      const mats = new Float32Array(arr.length*16), colors = [];
      arr.forEach(([it,k],i) => {
        layer.place(dummy,it,k);
        dummy.position.x -= ox; dummy.position.z -= oz; dummy.updateMatrix();
        dummy.matrix.toArray(mats, i*16);
        colors.push(layer.color ? layer.color(it,k) : null);
      });
      const build = geo => {
        const im = new THREE.InstancedMesh(geo, layer.mat, arr.length);
        im.instanceMatrix.array.set(mats);
        colors.forEach((c,i) => { if(c) im.setColorAt(i,c); });
        im.position.set(ox,0,oz);
        im.castShadow = !!layer.cast; im.receiveShadow = !!layer.receive;
        scene.add(im);
        return im;
      };
      cell.near.push(build(layer.near));
      if(layer.far) cell.far.push(build(layer.far));
    });
  }
  function update(cam){
    for(const cell of cells.values()){
      const d = Math.hypot(cam.x-cell.x, cam.z-cell.z) - cellSize*0.35;
      const showNear = d < nearDist, showAny = d < cullDist;
      for(const m of cell.near) m.visible = showAny && showNear;
      for(const m of cell.far) m.visible = showAny && !showNear;
    }
  }
  return {update};
};

// addGroundDetail: gives a plain vertex-coloured ground material world-space texture without any image files.
//   (1) multi-octave value noise multiplies the colour, so big flat areas get mottled patches, fine grain and
//   gravel-like speckle instead of one smooth gradient, and (2) the same noise perturbs the shading normal, so
//   low sun rakes across tiny bumps. Fine octaves fade out with distance to avoid shimmer far away.
window.addGroundDetail = function(material, o){
  o = o || {};
  const strength = o.strength === undefined ? 1 : o.strength, scale = o.scale || 1, bump = o.bump === undefined ? 0.22 : o.bump;
  material.extensions = Object.assign(material.extensions || {}, {derivatives:true});
  material.onBeforeCompile = shader => {
    shader.uniforms.uGDStrength = {value:strength};
    shader.uniforms.uGDScale = {value:scale};
    shader.uniforms.uGDBump = {value:bump};
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vGDXZ;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGDXZ=(modelMatrix*vec4(position,1.0)).xz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec2 vGDXZ; uniform float uGDStrength, uGDScale, uGDBump;
        float gdHash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
        float gdNoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
          return mix(mix(gdHash(i),gdHash(i+vec2(1.0,0.0)),f.x),mix(gdHash(i+vec2(0.0,1.0)),gdHash(i+vec2(1.0,1.0)),f.x),f.y); }
        float gdHeight(vec2 p, float f1, float f2){
          float w3=0.2*f1, w4=0.1*f2;
          float h=gdNoise(p*0.35)*0.4+gdNoise(p*1.3)*0.3+gdNoise(p*4.7)*w3+gdNoise(p*15.0)*w4;
          return h/(0.7+w3+w4);   // stays centred on 0.5 as the fine octaves fade, so far ground does not darken
        }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float gdDist = length(vViewPosition);
        float gdF1 = 1.0-smoothstep(25.0,120.0,gdDist), gdF2 = 1.0-smoothstep(10.0,55.0,gdDist);
        float gdH = gdHeight(vGDXZ*uGDScale, gdF1, gdF2);
        diffuseColor.rgb *= 1.0+(gdH-0.5)*0.95*uGDStrength;`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        {
          vec2 gdd = vec2(dFdx(gdH),dFdy(gdH))*uGDBump*uGDStrength;
          vec3 gsX = dFdx(-vViewPosition), gsY = dFdy(-vViewPosition);
          vec3 gR1 = cross(gsY,normal), gR2 = cross(normal,gsX);
          float gDet = dot(gsX,gR1);
          vec3 gGrad = sign(gDet)*(gdd.x*gR1+gdd.y*gR2);
          normal = normalize(abs(gDet)*normal-gGrad);
        }`);
  };
  material.customProgramCacheKey = () => 'grounddetail';
  material.needsUpdate = true;
  return material;
};

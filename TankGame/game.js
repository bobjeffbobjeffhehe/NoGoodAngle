// ========== MENU SYSTEM ==========
  let selectedTank = null;
  
  let deploying=false;
  function startGame(){
    if(!selectedTank || deploying) return;
    deploying=true;
    saveMenuPrefs();
    const tankName=TANK_NAMES[selectedTank], mapName=MAP_CHOICES.find(c=>c.id===selectedMap).label, timeName=TIME_CHOICES.find(c=>c.id===selectedTime).label;
    // Building the map is a heavy synchronous job, so show a deploy card first and let the browser paint it before starting.
    const ld=document.createElement('div'); ld.id='loadingOverlay';
    ld.innerHTML='<div class="ld-card"><div class="ld-spin"></div><div class="ld-title">DEPLOYING</div><div class="ld-sub">'+tankName+' <i>·</i> '+mapName+' MAP <i>·</i> '+timeName+'</div></div>';
    document.body.appendChild(ld);
    document.getElementById('menuOverlay').classList.add('hidden');
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      try{
        const calibers = {tiger: '88 MM', panther: '75 MM', sturer: '128 MM', is7: '130 MM', fv4005: '183 MM', amx50: '120 MM', t54e1: '105 MM', leopard1a5: '105 MM', m1abrams: '105 MM', t72b: '125 MM', challenger1: '120 MM', k1: '105 MM', su30sm: '30 MM'};
        document.getElementById('scopeCaliber').textContent = 'OPTICAL • ' + calibers[selectedTank];
        initGame(selectedTank);
      } finally {
        ld.classList.add('out'); setTimeout(()=>ld.remove(),450); deploying=false;
      }
    }));
  }
  
  // Nation trees are presented as a visual rank progression; every current vehicle stays selectable.
  const TANK_TREE={
    usa:{name:'United States',flag:'🇺🇸',tanks:[
      {id:'t54e1',rank:2,type:'Medium Tank',speed:43,caliber:105,crew:4,weight:54},
      {id:'amx50',rank:3,type:'Heavy Tank',speed:37,caliber:120,crew:4,weight:55},
      {id:'m1abrams',rank:5,type:'Main Battle Tank',speed:72,caliber:105,crew:4,weight:54}]},
    germany:{name:'Germany',flag:'🇩🇪',tanks:[
      {id:'tiger',rank:2,type:'Heavy Tank',speed:38,caliber:88,crew:5,weight:57},
      {id:'sturer',rank:2,type:'Tank Destroyer',speed:25,caliber:128,crew:5,weight:35},
      {id:'panther',rank:3,type:'Medium Tank',speed:46,caliber:75,crew:5,weight:45},
      {id:'leopard1a5',rank:5,type:'Medium Tank',speed:72,caliber:105,crew:4,weight:40}]},
    britain:{name:'Great Britain',flag:'🇬🇧',tanks:[{id:'fv4005',rank:3,type:'Tank Destroyer',speed:32,caliber:183,crew:5,weight:50},
      {id:'challenger1',rank:5,type:'Main Battle Tank',speed:56,caliber:120,crew:4,weight:62}]},
    ussr:{name:'USSR',flag:'🇷🇺',tanks:[{id:'is7',rank:3,type:'Heavy Tank',speed:60,caliber:130,crew:5,weight:68},
      {id:'t72b',rank:5,type:'Main Battle Tank',speed:55,caliber:125,crew:3,weight:46},
      {id:'su30sm',rank:5,type:'Fighter Jet',speed:900,caliber:30,crew:2,weight:34}]},
    // Placeholder nation tab for the K1 - see germantanks.html for the matching nation button.
    // TODO(user): confirm whether you want a standalone Korea tab (as wired up here) or the K1
    // folded into an existing tree; rank 4 is a provisional placement, adjust freely.
    korea:{name:'South Korea',flag:'🇰🇷',tanks:[
      {id:'k1',rank:4,type:'Main Battle Tank',speed:65,caliber:105,crew:4,weight:51}]}
  };
  const TANK_NAMES={tiger:'Tiger 131',panther:'Panther',sturer:'Sturer Emil',is7:'IS-7',fv4005:'FV4005',amx50:'M-V-Yoh',t54e1:'T54E1',leopard1a5:'Leopard 1A5',m1abrams:'M1 Abrams',t72b:'T-72B',challenger1:'Challenger 1',k1:'K1',su30sm:'Su-30SM'};
  const TANK_RELOAD={tiger:10,panther:4,sturer:18,is7:12,fv4005:25,amx50:9,t54e1:5,leopard1a5:8,m1abrams:6,t72b:7,challenger1:10,k1:8,su30sm:0};
  let activeNation='germany';

  function showNationSelect(){ showTankSelection(activeNation); }
  function showTankSelection(nation){
    const tree=TANK_TREE[nation]; if(!tree) return;
    if(activeNation!==nation) selectedTank=null;
    activeNation=nation;
    const overlay=document.getElementById('menuOverlay'); overlay.dataset.nation=nation;
    document.querySelectorAll('.nation-btn').forEach(btn=>{
      const active=btn.dataset.nation===nation;
      btn.classList.toggle('active',active); btn.setAttribute('aria-pressed',String(active));
    });
    document.getElementById('nationLabel').textContent=tree.name;
    document.getElementById('treeCount').textContent=tree.tanks.length+' VEHICLE'+(tree.tanks.length===1?'':'S');
    const grid=document.getElementById('tankGrid'); grid.innerHTML='';
    for(let rank=1;rank<=5;rank++){
      const lane=document.createElement('div'); lane.className='rank-lane';
      tree.tanks.filter(t=>t.rank===rank).forEach(t=>{
        const card=document.createElement('button');
        card.className='tank-card'+(selectedTank===t.id?' selected':''); card.type='button';
        card.setAttribute('aria-label','Select '+TANK_NAMES[t.id]);
        card.innerHTML='<span class="node-state">AVAILABLE</span><span class="vehicle-thumb" aria-hidden="true"><i class="track"></i><i class="hull"></i><i class="turret"></i><i class="barrel"></i></span>'+ 
          '<span class="tank-name">'+TANK_NAMES[t.id]+'</span><span class="tank-type">'+t.type+'</span><span class="tank-stats">'+t.caliber+' MM <i>·</i> '+t.speed+' KM/H</span>';
        card.addEventListener('click',()=>selectTank(t.id,card)); lane.appendChild(card);
      });
      grid.appendChild(lane);
    }
    const chosen=tree.tanks.some(t=>t.id===selectedTank);
    document.getElementById('startGameBtn').disabled=!chosen;
    if(chosen) updateTankDetails(selectedTank); else showEmptyTankDetails();
    saveMenuPrefs();
  }
  function showEmptyTankDetails(){
    document.querySelector('.detail-empty').hidden=false;
    document.getElementById('detailData').hidden=true;
    document.getElementById('startGameBtn').disabled=true;
  }
  const bar=f=>'<i class="bar"><u style="width:'+Math.round(Math.max(0.06,Math.min(1,f))*100)+'%"></u></i>'; // relative stat bar under a spec cell (reload: shorter = fuller)
  function updateTankDetails(id){
    const tank=TANK_TREE[activeNation].tanks.find(t=>t.id===id); if(!tank) return;
    const data=document.getElementById('detailData');
    document.querySelector('.detail-empty').hidden=true; data.hidden=false;
    const special=id==='t72b'?'AUTOLOADER · KONTAKT-1 ERA · COMPOSITE ARMOR':id==='m1abrams'?'STABILIZER · COMPOSITE ARMOR':id==='is7'?'6-ROUND AUTOLOADER':id==='t54e1'?'9-ROUND AUTOLOADER':id==='leopard1a5'?'STABILIZER · LASER RANGEFINDER':id==='amx50'?'OSCILLATING TURRET':id==='challenger1'?'STABILIZER · CHOBHAM ARMOR · LASER RANGEFINDER':id==='k1'?'HYBRID SUSPENSION · LASER RANGEFINDER':id==='su30sm'?'CANARDS · THRUST VECTORING · TANDEM COCKPIT':'STANDARD CONFIGURATION';
    data.innerHTML='<div class="detail-kicker">RANK '+tank.rank+' · '+tank.type.toUpperCase()+'</div><div class="detail-vehicle-art" aria-hidden="true"><i class="track"></i><i class="hull"></i><i class="turret"></i><i class="barrel"></i></div>'+ 
      '<h2>'+TANK_NAMES[id]+'</h2><div class="detail-nation">'+TANK_TREE[activeNation].flag+' '+TANK_TREE[activeNation].name+'</div><div class="detail-special">'+special+'</div>'+ 
      '<div class="spec-grid"><div><span>MAX SPEED</span><b>'+tank.speed+' <small>KM/H</small></b>'+bar(tank.speed/80)+'</div><div><span>MAIN GUN</span><b>'+tank.caliber+' <small>MM</small></b>'+bar(tank.caliber/183)+'</div>'+ 
      '<div><span>RELOAD</span><b>'+TANK_RELOAD[id]+' <small>SEC</small></b>'+bar(1-(TANK_RELOAD[id]-3)/24)+'</div><div><span>CREW / MASS</span><b>'+tank.crew+' <small>· '+tank.weight+' T</small></b>'+bar(tank.weight/70)+'</div></div>'+ 
      '<div class="vehicle-status"><i></i> VEHICLE AVAILABLE</div>';
    document.getElementById('startGameBtn').disabled=false;
  }
  function selectTank(id,card){
    selectedTank=id;
    document.querySelectorAll('.tank-card').forEach(node=>node.classList.toggle('selected',node===card));
    updateTankDetails(id); saveMenuPrefs();
  }
  // ---------- Battle settings: map and time of day (RANDOM keeps the old behaviour), remembered between visits ----------
  const ICON=p=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';
  const MAP_CHOICES=[
    {id:'random',label:'RANDOM',note:'A different battlefield every match.',icon:ICON('<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2" fill="currentColor"/><circle cx="15" cy="9" r="1.2" fill="currentColor"/><circle cx="9" cy="15" r="1.2" fill="currentColor"/><circle cx="15" cy="15" r="1.2" fill="currentColor"/>')},
    {id:'forest',label:'FOREST',note:'Dense woodland, cliffs and tight sight-lines.',icon:ICON('<path d="M3.5 16 7 9l3.5 7z"/><path d="M7 16v3"/><path d="M12.5 15 17 6l4.5 9z"/><path d="M17 15v4"/>')},
    {id:'desert',label:'DESERT',note:'Open dunes, mesas and long sight-lines.',icon:ICON('<path d="M2 17c4-6 8-6 10-1s6 3 10-3"/><path d="M3 21h18"/>')},
    {id:'town',label:'TOWN',note:'Plains and a ruined town: buildings, rubble and smoke.',icon:ICON('<path d="M4 20V10h6v10"/><path d="M10 20V5h6v15"/><path d="M16 20v-8h4v8"/><path d="M3 20h18"/><path d="M12.5 8h1M12.5 12h1M12.5 16h1"/>')},
    {id:'airport',label:'AIRPORT',note:'Enormous (19 km across), built for aircraft: two airfields (you spawn on your runway), lakes, rivers, farmland, forests and tall mountains.',icon:ICON('<path d="M2 16l20-4-2-2.2L2 12.5z"/><path d="M11 13V4l2 .6V13"/><circle cx="18" cy="19" r="2"/>')}
  ];
  const TIME_CHOICES=[
    {id:'random',label:'RANDOM',note:'Day, sunset or night, rolled each match.',icon:MAP_CHOICES[0].icon},
    {id:'day',label:'DAY',note:'Clear daylight and the longest view.',icon:ICON('<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>')},
    {id:'sunset',label:'SUNSET',note:'Low orange sun, long shadows and warm haze.',icon:ICON('<path d="M5 17a7 7 0 0 1 14 0"/><path d="M2 20h20"/><path d="M12 6v3M5 9.5l1.8 1.8M19 9.5l-1.8 1.8"/>')},
    {id:'night',label:'NIGHT',note:'Moonlit and dark, with shorter visibility.',icon:ICON('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/><path d="M17 4v3M15.5 5.5h3"/>')}
  ];
  let selectedMap='random', selectedTime='random';
  const MENU_KEY='tankBattleMenu';
  function loadMenuPrefs(){ try{ return JSON.parse(localStorage.getItem(MENU_KEY)||'{}')||{}; }catch(e){ return {}; } }
  function saveMenuPrefs(){ try{ localStorage.setItem(MENU_KEY,JSON.stringify({nation:activeNation,tank:selectedTank,map:selectedMap,time:selectedTime})); }catch(e){} }
  function renderChoices(rowId,noteId,labelId,choices,sel,pick){
    const row=document.getElementById(rowId); if(!row) return; row.innerHTML='';
    choices.forEach(c=>{
      const b=document.createElement('button'); b.type='button'; b.className='opt'+(c.id===sel?' on':''); b.dataset.id=c.id;
      b.setAttribute('role','radio'); b.setAttribute('aria-checked',String(c.id===sel)); b.title=c.note;
      b.innerHTML='<span class="opt-art">'+c.icon+'</span><span class="opt-name">'+c.label+'</span>';
      b.addEventListener('click',()=>pick(c.id)); row.appendChild(b);
    });
    const cur=choices.find(c=>c.id===sel);
    document.getElementById(labelId).textContent=cur.label; document.getElementById(noteId).textContent=cur.note;
  }
  function renderBattleSettings(){
    renderChoices('mapOptions','mapNote','mapLabel',MAP_CHOICES,selectedMap,id=>{ selectedMap=id; saveMenuPrefs(); renderBattleSettings(); });
    renderChoices('timeOptions','timeNote','timeLabel',TIME_CHOICES,selectedTime,id=>{ selectedTime=id; saveMenuPrefs(); renderBattleSettings(); });
  }
  const cycleChoice=(choices,cur,dir)=>choices[(choices.findIndex(c=>c.id===cur)+dir+choices.length)%choices.length].id;
  // Menu keys: Enter deploys, M / T cycle map / time of day (Shift reverses), 1-5 switch nation.
  document.addEventListener('keydown',e=>{
    if(document.getElementById('menuOverlay').classList.contains('hidden') || e.ctrlKey || e.metaKey || e.altKey) return;
    const k=e.key.toLowerCase(), dir=e.shiftKey?-1:1;
    if(k==='enter'){
      if(document.activeElement && document.activeElement.tagName==='BUTTON' && document.activeElement.id!=='startGameBtn') return; // a focused button handles its own Enter
      if(selectedTank){ e.preventDefault(); startGame(); }
    }
    else if(k==='m'){ selectedMap=cycleChoice(MAP_CHOICES,selectedMap,dir); saveMenuPrefs(); renderBattleSettings(); }
    else if(k==='t'){ selectedTime=cycleChoice(TIME_CHOICES,selectedTime,dir); saveMenuPrefs(); renderBattleSettings(); }
    else if(k>='1' && k<='5'){ showTankSelection(['usa','germany','britain','ussr','korea'][Number(k)-1]); }
  });
  { const prefs=loadMenuPrefs();
    if(TANK_TREE[prefs.nation]) activeNation=prefs.nation;
    if(MAP_CHOICES.some(c=>c.id===prefs.map)) selectedMap=prefs.map;
    if(TIME_CHOICES.some(c=>c.id===prefs.time)) selectedTime=prefs.time;
    if(prefs.tank && TANK_TREE[activeNation].tanks.some(t=>t.id===prefs.tank)) selectedTank=prefs.tank;
  }
  renderBattleSettings();
  showTankSelection(activeNation);

  // Tank configurations
  const TANK_CONFIGS = {
    tiger: {
      name: 'Tiger 131',
      bodyColor: 0xa08a52,
      turretColor: 0x9a8650,
      maxSpeed: 45/7.5,        // 45 km/h
      maxRevSpeed: -45/7.5 * 0.35,
      accel: 2.0,              // Slow acceleration (57 tons)
      turnSpeed: 0.3,          // Slightly quicker hull traverse while keeping the Tiger heavy
      turretSpeed: 2*Math.PI/30, // 30 sec for full 360° = 0.209 rad/sec
      turretPitchSpeed: 0.15,  // Slow elevation
      shellSpeed: 400,         // m/s
      damage: 250,
      shell: {caliber:88, penNear:120, penFar:92, normalization:4, fuse:2.4, blast:1.5},
      reloadTime: 10,
      accuracy: 0.95,          // Heavy tank = less accurate at range
      armor: 'heavy',
      spotClass: 'heavy',
      weight: 57
    },
    panther: {
      name: 'Panther',
      bodyColor: 0x988752,
      turretColor: 0x907f4e,
      maxSpeed: 80/7.5,        // 80 km/h actual top speed; HUD intentionally hides the extra speed
      maxRevSpeed: -60/7.5 * 0.4,
      accel: 2.8,              // Reduced acceleration for a heavier, slower pull to top speed
      turnSpeed: 0.9,          // Faster hull turn (high agility)
      turretSpeed: 2*Math.PI/14, // 14 sec for full 360° = 0.449 rad/sec
      turretPitchSpeed: 0.35,  // Faster elevation (2x tiger)
      shellSpeed: 600,         // m/s
      damage: 120,
      shell: {caliber:75, penNear:128, penFar:102, normalization:4, fuse:2.0, blast:1.2},
      reloadTime: 4,
      accuracy: 0.99,          // Medium tank = better accuracy at range
      armor: 'medium',
      spotClass: 'medium',
      weight: 45
    },
    sturer: {
      name: 'Sturer Emil',
      bodyColor: 0x454b4f,
      turretColor: 0x50565a,
      maxSpeed: 25/7.5,        // 25 km/h
      maxRevSpeed: -5/7.5,     // 5 km/h reverse
      accel: 2.5,              // Medium acceleration (35 tons)
      turnSpeed: 0.4,          // Moderate hull turn
      turretSpeed: 0,          // No turret rotation (casemate)
      turretPitchSpeed: 0.25,  // Moderate elevation speed
      shellSpeed: 700,         // m/s (128mm gun)
      damage: 350,
      shell: {caliber:128, penNear:238, penFar:215, normalization:5, fuse:3.0, blast:2.0},
      reloadTime: 18,
      accuracy: 0.99,          // Tank destroyer = excellent accuracy
      armor: 'light',
      spotClass: 'tankDestroyer',
      weight: 35,
      isCasemate: true,        // Fixed superstructure, no rotating turret
      maxTraverse: 0.174,      // ±10° gun traverse (0.174 radians)
      minPitch: -0.262,        // -15° depression
      maxPitch: 0.174          // +10° elevation
    },
    is7: {
      name: 'IS-7',
      bodyColor: 0x25291d,     // Deep olive-brown, close to the dark wartime finish
      turretColor: 0x2c2b20,
      maxSpeed: 60/7.5,        // 60 km/h
      maxRevSpeed: -60/7.5 * 0.3,
      accel: 3.5,              // Good acceleration (68 tons)
      turnSpeed: 0.45,         // Moderate turn (heavy tank, large tracks)
      turretSpeed: 2*Math.PI/20, // 20 sec for full 360° = 0.314 rad/sec
      turretPitchSpeed: 0.18,  // Gun elevation speed (0.18 rad/s)
      shellSpeed: 900,         // m/s
      damage: 400,
      shell: {caliber:130, penNear:300, penFar:250, normalization:5, fuse:3.2, blast:2.2},
      reloadTime: 12,          // Time between shots in magazine
      magazineReloadTime: 40,  // Time to reload empty magazine
      magazineSize: 6,         // 6 rounds in magazine
      accuracy: 0.97,          // Heavy tank accuracy
      armor: 'heavy',
      spotClass: 'heavy',
      weight: 68,
      isPikeNose: true,        // Pike nose hull design
      minPitch: -0.052,        // -3° depression
      maxPitch: 0.314,         // +18° elevation
      turnPenalty: 0.65        // Speed reduced to 65% while turning (35% loss)
    },
    fv4005: {
      name: 'FV4005',
      bodyColor: 0x5a6248,     // British olive drab
      turretColor: 0x656d58,   // Slightly lighter green-grey
      maxSpeed: 40/7.5,        // 32 km/h (capped at 40 in code)
      maxRevSpeed: -40/7.5 * 0.3,
      accel: 2.2,              // Sluggish acceleration (50 tons)
      turnSpeed: 0.35,         // Slow hull turning
      turretSpeed: 8 * Math.PI/180, // 8 deg/sec = 0.14 rad/sec
      turretPitchSpeed: 0.2,   // Moderate elevation speed
      shellSpeed: 760,         // m/s
      damage: 550,             // Massive damage
      shell: {caliber:183, penNear:230, penFar:230, normalization:0, fuse:3.5, blast:3.8, isHESH:true}, // HESH: huge blast radius for interior spalling
      reloadTime: 25,          // 25 second reload
      accuracy: 0.99,          // Stationary accuracy
      accuracyMoving: 0.95,    // Moving accuracy
      armor: 'light',
      spotClass: 'tankDestroyer',
      weight: 50,
      isTurretDestroyer: true, // Limited turret traverse
      maxTraverse: Math.PI/4,  // ±45° turret traverse (π/4 radians)
      minPitch: -0.122,        // -7° depression
      maxPitch: 0.262          // +15° elevation
    },
    amx50: {
      name: 'M-V-Yoh',
      bodyColor: 0x4f5337,     // US olive drab
      turretColor: 0x565a3c,   // Slightly lighter olive-drab turret
      // Realistic figures for a mid-1950s US heavy tank had the H.L. Yoh M-V-Y been built (same era and layout class
      // as the M103 / T43): ~55 t, one 810 hp air-cooled V12 (Continental AV-1790 class) = ~14.7 hp/t, which gives
      // a top speed of about 37 km/h on the road and a slow 12 km/h reverse. Four crew: driver and loader in the
      // hull, commander and gunner in the narrow oscillating turret.
      maxSpeed: 37/7.5,        // 37 km/h
      maxRevSpeed: -12/7.5,    // 12 km/h reverse
      accel: 2.3,              // 14.7 hp/t: sluggish pull-away, like other 1950s heavies
      turnSpeed: 0.4,          // regenerative steering, heavy hull
      turretSpeed: 2*Math.PI/15, // 15 s for a full 360 deg (hydraulic traverse of a small, light turret)
      turretPitchSpeed: 0.2,   // hydraulic elevation
      shellSpeed: 1000,        // m/s (overwritten by the selected shell)
      damage: 400,
      shells: [
        // 120 mm M58-class gun. Pen is at 0 deg. APBC-T is a kinetic round that normalises a little; HEAT ignores plate angle.
        {name: 'APBC-T', caliber:120, penNear:240, penFar:205, normalization:5, fuse:2.8, blast:1.8, damage:400, shellSpeed:1000},
        {name: 'HEAT',   caliber:120, penNear:330, penFar:330, normalization:0, fuse:1.5, blast:2.4, damage:420, shellSpeed:1100, isHEAT:true},
        {name: 'HE',     caliber:120, penNear:40,  penFar:40,  normalization:0, fuse:0.1, blast:3.2, damage:280, shellSpeed:850,  isHE:true}
      ],
      shell: null, // Will be set to shells[0]
      reloadTime: 9,           // 9 s: separate-loading 120 mm rounds passed up the neck and hand-loaded
      accuracy: 0.97,          // heavy tank, no stabilizer
      armor: 'heavy',
      spotClass: 'heavy',
      weight: 55,
      hasOscillatingTurret: true, // Distinctive oscillating turret
      hasAutoloader: false,    // Hand-loaded: a dead loader slows the reload
      turnPenalty: 0.8,        // Loses noticeable speed while turning
      // The game stores gun pitch as rotation.x, which is NEGATIVE when the gun points UP: "min" is the
      // elevation stop and "max" the depression stop (same convention as the T54E1). The oscillating
      // turret's bustle dips into the deck as the gun rises, so elevation is limited to +15 deg.
      minPitch: -0.262,        // +15° elevation
      maxPitch: 0.14           // -8° depression
    },
    t54e1: {
      name: 'T54E1',
      bodyColor: 0x5a5e48,     // US olive drab
      turretColor: 0x62654f,   // Slightly lighter turret
      maxSpeed: 43/7.5,        // 43 km/h
      maxRevSpeed: -8/7.5,     // 8 km/h reverse
      accel: 3.2,              // Moderate acceleration (810hp, 54 tons = 15 hp/ton)
      turnSpeed: 0.65,         // Smooth, weighty hull turning
      turretSpeed: 2*Math.PI/15, // 15 sec for full 360° = 0.419 rad/sec (moderate traverse)
      turretPitchSpeed: 0.25,  // Moderate elevation speed
      shellSpeed: 870,         // m/s (base APBC velocity)
      damage: 320,
      shells: [
        {name: 'APBC', caliber:105, penNear:266, penFar:266, normalization:5, fuse:2.5, blast:1.6, damage:320, shellSpeed:870},
        {name: 'APDS', caliber:105, penNear:318, penFar:318, normalization:2, fuse:2.0, blast:1.2, damage:280, shellSpeed:1050}, // High velocity, less damage
        {name: 'HEAT-FS', caliber:105, penNear:380, penFar:380, normalization:0, fuse:1.5, blast:2.2, damage:340, shellSpeed:1128, isHEAT:true} // Ignores angle like HESH
      ],
      shell: null, // Will be set to shells[0]
      reloadTime: 5,           // 5 second autoloader between shots
      magazineReloadTime: 35,  // 35 seconds to reload empty drum
      magazineSize: 9,         // 9-round drum
      accuracy: 0.99,          // Excellent accuracy
      armor: 'medium',
      spotClass: 'medium',
      weight: 54,
      hasOscillatingTurret: true, // Oscillating turret like AMX-50
      hasAutoloader: true,     // Drum autoloader
      turnPenalty: 0.88,       // Some speed loss while turning (medium tank)
      // NOTE: the game stores gun pitch as the pivot's rotation.x, which is NEGATIVE when the gun points UP.
      // So the "min" limit is the elevation stop and the "max" limit is the depression stop.
      minPitch: -0.227,        // +13° elevation
      maxPitch: 0.140          // -8° depression
    },
    leopard1a5: {
      name: 'Leopard 1A5',
      bodyColor: 0x58593f,     // Bundeswehr NATO olive-green
      turretColor: 0x5d5e43,
      maxSpeed: 72/7.5,        // 72 km/h
      maxRevSpeed: -25/7.5,    // 25 km/h reverse (the Leopard's reversing gearbox is as quick backwards as forwards)
      accel: 4.4,              // ~830 hp / 40 t = ~20 hp/t
      turnSpeed: 0.82,         // Agile hull steering
      turretSpeed: 2*Math.PI/15, // 15 s for a full 360 deg turret rotation
      turretPitchSpeed: 0.3,
      shellSpeed: 1250,        // overwritten by the selected shell
      damage: 280,
      shells: [
        // Penetration values are quoted at 0 degrees. APDS/APFSDS are kinetic; HEAT-FS and HESH ignore plate angle.
        {name: 'APDS',    caliber:105, penNear:350, penFar:350, normalization:2, fuse:2.0, blast:1.2, damage:280, shellSpeed:1250},
        {name: 'HEAT-FS', caliber:105, penNear:400, penFar:400, normalization:0, fuse:1.5, blast:2.2, damage:340, shellSpeed:1130, isHEAT:true},
        {name: 'HESH',    caliber:105, penNear:127, penFar:127, normalization:0, fuse:0.6, blast:3.0, damage:300, shellSpeed:730,  isHESH:true},
        {name: 'APFSDS',  caliber:105, penNear:420, penFar:420, normalization:5, fuse:2.2, blast:1.1, damage:300, shellSpeed:1480, defeatsComposite:true}
      ],
      shell: null,             // Will be set to shells[0]
      reloadTime: 8,           // 8 s hand-loaded round
      accuracy: 1.0,           // perfect while driving slowly...
      accuracyFalloff: {perfectKmh:40, topKmh:72, maxSpread:0.035}, // ...and degrading towards top speed
      stabilizer: {rate: 2.6}, // two-axis gun stabilizer (rad/s it can cancel hull motion at), tied to the laser rangefinder
      laserRangefinder: true,
      armor: 'medium',
      spotClass: 'medium',
      weight: 40,
      turnPenalty: 0.9,
      minPitch: -0.349,        // +20° elevation (rotation.x is negative when the gun points up)
      maxPitch: 0.157          // -9° depression
    },
    m1abrams: {
      name: 'M1 Abrams',
      bodyColor: 0xb8a070,     // desert sand
      turretColor: 0xbca574,
      maxSpeed: 72/7.5,        // 72 km/h governed road speed
      maxRevSpeed: -32/7.5,    // 32 km/h reverse
      accel: 5.3,              // AGT1500 turbine, 1,500 hp / ~54.4 t = ~27.5 hp/t
      turnSpeed: 0.8,          // regenerative steering, neutral turn
      turretSpeed: 2*Math.PI/9, // 9 s for a full 360 deg turret rotation (electro-hydraulic)
      turretPitchSpeed: 0.35,
      shellSpeed: 1500,
      damage: 300,
      shells: [
        // 105 mm M68A1 rounds of the early 1980s. KE pen quoted at 0 deg; HEAT and HEP ignore plate angle.
        {name: 'APFSDS-T M735', caliber:105, penNear:405, penFar:390, normalization:5, fuse:2.2, blast:1.1, damage:300, shellSpeed:1501, defeatsComposite:true},
        {name: 'HEAT-T M456A2', caliber:105, penNear:400, penFar:400, normalization:0, fuse:1.5, blast:2.3, damage:340, shellSpeed:1173, isHEAT:true},
        {name: 'HEP-T M393A2',  caliber:105, penNear:127, penFar:127, normalization:0, fuse:0.6, blast:3.0, damage:300, shellSpeed:732,  isHESH:true},
        {name: 'APDS-T M728',   caliber:105, penNear:330, penFar:330, normalization:2, fuse:2.0, blast:1.2, damage:280, shellSpeed:1426}
      ],
      shell: null,
      reloadTime: 6,           // hand-loaded from the bustle racks behind blow-off doors
      accuracy: 1.0,
      accuracyFalloff: {perfectKmh:45, topKmh:72, maxSpread:0.022}, // stabilized gun: fires accurately on the move
      stabilizer: {rate: 3.2}, // two-axis stabilizer with laser rangefinder in the gunner's primary sight
      laserRangefinder: true,
      armor: 'heavy',
      spotClass: 'medium',
      weight: 54,
      turnPenalty: 0.9,
      minPitch: -0.349,        // +20° elevation
      maxPitch: 0.175          // -10° depression
    },
    t72b: {
      name: 'T-72B',
      bodyColor: 0x39422a,     // darker Soviet 4BO green
      turretColor: 0x3c452c,
      maxSpeed: 55/7.5,        // 55 km/h top speed
      maxRevSpeed: -4.8/7.5,   // 4.8 km/h: the T-72's reverse gear is famously slow
      accel: 4.4,              // 920 hp / ~46 t = 20 hp/t (same pull-away as the other 20 hp/t tank, the Leopard 1A5)
      turnSpeed: 0.55,         // heavy, slow-steering hull
      turretSpeed: 2*Math.PI/15, // ~24 deg/s: 15 s for a full 360 deg turret rotation (2E42-2 drive)
      turretPitchSpeed: 0.24,  // ~14 deg/s gun elevation
      shellSpeed: 1700,        // overwritten by the selected shell
      damage: 300,
      shells: [
        // 125 mm 2A46M-1 smoothbore, two-piece ammunition fed by the AZ-184 carousel autoloader. Pen is quoted at 0 deg.
        // 3BM42 "Mango" APFSDS: ~457 mm at the muzzle falling to ~406 mm at 2 km, 1700 m/s. 3BK18M HEAT-FS: 550 mm, 905 m/s,
        // ignores plate angle. 3OF26 HE-Frag: 42 mm, 850 m/s.
        {name: '3BM42 APFSDS', caliber:125, penNear:457, penFar:406, normalization:5, fuse:2.2, blast:1.1, damage:300, shellSpeed:1700, defeatsComposite:true},
        {name: '3BK18M HEAT-FS', caliber:125, penNear:550, penFar:550, normalization:0, fuse:1.5, blast:2.4, damage:360, shellSpeed:905, isHEAT:true},
        {name: '3OF26 HE-FRAG', caliber:125, penNear:42, penFar:42, normalization:0, fuse:0.1, blast:3.4, damage:280, shellSpeed:850, isHE:true}
      ],
      shell: null,
      reloadTime: 7,           // AZ-184 autoloader cycle, about 7 s per round
      accuracy: 1.0,
      accuracyFalloff: {perfectKmh:25, topKmh:75, maxSpread:0.03}, // two-plane 2E42-2 stabilizer, but less steady than a Western system
      stabilizer: {rate: 2.0},
      laserRangefinder: true,  // TPD-K1 laser rangefinder sight
      armor: 'heavy',
      spotClass: 'medium',
      weight: 46,
      turnPenalty: 0.8,
      minPitch: -0.244,        // +14 deg elevation (rotation.x is negative when the gun points up)
      maxPitch: 0.105          // -6 deg depression: the T-72 is notorious for poor gun depression
    },
    challenger1: {
      name: 'Challenger 1',
      bodyColor: 0x5c6048,     // British NATO olive-green
      turretColor: 0x61654a,
      maxSpeed: 56/7.5,        // 56 km/h governed road speed
      maxRevSpeed: -15/7.5,    // modest reverse (hydrokinetic transmission)
      accel: 4.0,              // Condor CV12, 1,200 hp / 62 t = ~19.3 hp/t
      turnSpeed: 0.55,         // heavy hull, slow on-the-spot turning
      turretSpeed: 2*Math.PI/16, // 16 s for a full 360 deg turret rotation (hydraulic traverse)
      turretPitchSpeed: 0.28,
      shellSpeed: 1547,        // overwritten by the selected shell
      damage: 310,
      shells: [
        // 120 mm L11A5 rifled gun, separate-loading two-part ammunition (projectile + bagged charge). Pen
        // quoted at 0 deg. L23A1 APFSDS is kinetic; L31A7 HESH ignores plate angle (spalls off the interior).
        {name: 'L23A1 APFSDS', caliber:120, penNear:400, penFar:355, normalization:5, fuse:2.2, blast:1.1, damage:310, shellSpeed:1547, defeatsComposite:true},
        {name: 'L15A5 APDS',   caliber:120, penNear:350, penFar:300, normalization:2, fuse:2.0, blast:1.2, damage:290, shellSpeed:1370},
        {name: 'L31A7 HESH',   caliber:120, penNear:127, penFar:127, normalization:0, fuse:0.6, blast:3.0, damage:300, shellSpeed:732,  isHESH:true}
      ],
      shell: null,             // Will be set to shells[0]
      reloadTime: 10,          // 10 s: hand-loaded, two-part separate ammunition
      accuracy: 1.0,
      accuracyFalloff: {perfectKmh:35, topKmh:56, maxSpread:0.028}, // IFCS two-axis stabilizer with laser rangefinder
      stabilizer: {rate: 2.3},
      laserRangefinder: true,  // Tank Laser Sight (TLS)
      armor: 'heavy',
      spotClass: 'medium',
      weight: 62,
      turnPenalty: 0.85,
      minPitch: -0.349,        // +20° elevation (rotation.x is negative when the gun points up)
      maxPitch: 0.175          // -10° depression
    },
    k1: {
      name: 'K1',
      bodyColor: 0x4e5438,     // ROK woodland-ish olive/khaki base coat
      turretColor: 0x535943,
      maxSpeed: 65/7.5,        // 65 km/h road speed (GlobalSecurity/Wikipedia)
      maxRevSpeed: -25/7.5,    // reverse speed not published - estimated in line with other MBTs of this class
      accel: 5.0,              // MTU MB871 Ka-501, 1,200 hp / 51.1 t = ~23.5 hp/t
      turnSpeed: 0.8,
      turretSpeed: 2*Math.PI/10, // turret traverse rate not published - estimated similar to contemporary hydraulic turrets
      turretPitchSpeed: 0.33,
      shellSpeed: 1455,
      damage: 300,
      shells: [
        // 105 mm KM68A1 (licensed M68A1/L7 derivative). Western 105mm L7-family rounds of the
        // K1's service era - exact Korean-produced ammunition designations/performance are not
        // publicly published in detail, so these are placeholder figures carried over from the
        // closest-generation M68A1/L7 rounds (M1 Abrams, Leopard 1A5) pending better data.
        {name: 'APFSDS-T (KM68A1)', caliber:105, penNear:400, penFar:385, normalization:5, fuse:2.2, blast:1.1, damage:300, shellSpeed:1455, defeatsComposite:true},
        {name: 'HEAT-T',            caliber:105, penNear:400, penFar:400, normalization:0, fuse:1.5, blast:2.3, damage:340, shellSpeed:1173, isHEAT:true},
        {name: 'HESH',              caliber:105, penNear:127, penFar:127, normalization:0, fuse:0.6, blast:3.0, damage:300, shellSpeed:730,  isHESH:true}
      ],
      shell: null,
      reloadTime: 8,           // hand-loaded; not published - placeholder in line with other hand-loaded 105 mm guns
      accuracy: 1.0,
      accuracyFalloff: {perfectKmh:35, topKmh:65, maxSpread:0.03},
      stabilizer: {rate: 2.4},
      laserRangefinder: true,
      armor: 'medium',
      spotClass: 'medium',
      weight: 51,
      turnPenalty: 0.88,
      minPitch: -0.349,        // +20° elevation (GlobalSecurity/military-history.fandom give the K1 +20/-9.7 deg)
      maxPitch: 0.169          // -9.7° depression
    },
    // ---------- Aircraft ----------
    // Su-30SM: twin-engine, twin-seat 4++ generation Flanker-family multirole fighter (Sukhoi, in VKS service
    // since 2012). Real figures: ~21.9 m long, 14.7 m span, 6.36 m tall, ~18.4 t empty / ~34.5 t MTOW, two
    // AL-31FP turbofans (each with a 3D thrust-vectoring nozzle) totalling ~25,000 kgf with afterburner,
    // Mach ~2 (~2120 km/h) at altitude. isAircraft routes it through updatePlaneFlight()/updatePlaneCamera()
    // instead of the tank drive/turret/fire code; the gun/turret-only fields below are unused placeholders
    // kept only so generic code that reads `config.*` on any vehicle doesn't have to special-case this one.
    su30sm: {
      name: 'Su-30SM',
      isAircraft: true,
      bodyColor: 0x9ab7d2, turretColor: 0x9ab7d2,
      armor: 'light', spotClass: 'medium', accuracy: 0.9,
      weight: 34.5,             // MTOW, tonnes
      shell: {caliber:30, penNear:40, penFar:25, normalization:0, fuse:0.1, blast:0.5}, // GSh-30-1 cannon - modelled but not wired up to fire in this pass
      damage: 60, reloadTime: 0.15, shellSpeed: 860,
      maxSpeed: 1, maxRevSpeed: 0, accel: 1, turnSpeed: 1, turretSpeed: 0, turretPitchSpeed: 0, // unused by the flight code; kept as safe fallbacks for generic code
      // ---- Flight model: see flight.js (real units: 1 WU/s = 7.5 km/h). Everything below is a tunable feel parameter;
      // the physics itself (lift, drag, thrust, g-limiter, takeoff roll, ground contact) lives in createFlightModel(). ----
      throttleRate: 0.45,       // 0..1 throttle change per second (afterburners light above 70%)
      gearAnimTime: 1.6,        // seconds for gear to cycle up/down
      flight: {                 // overrides for createFlightModel(); defaults and all other tunables are listed in flight.js
        fuelFrac: 0.8,          // starting fuel (fraction of 9400 kg). Fuel burns with engine power; more fuel = heavier = longer
                                // takeoff roll, higher stall/rotation speed, lower g limit, lazier roll
        ordnanceKg: 1500,       // carried ordnance. Try 6000: a much heavier jet with a much slower roll rate
        vMax: 172,              // sea-level top speed at full afterburner (~1290 km/h); altitude speed emerges from the physics (about M1.9 at 11 km)
        vStall: 30,             // 1 g stall speed at the reference weight (~225 km/h)
        nMax: 9                 // structural g limit (reduced automatically when heavy)
      }
    }
  };
  // Multi-shell tanks (AMX-50, T54E1) only got config.shell when the PLAYER picked them, so bot copies had a
  // null shell and would crash the penetration model on their first hit. Give every config its default round.
  Object.values(TANK_CONFIGS).forEach(c=>{ if(c.shells && !c.shell) c.shell=c.shells[0]; });
  // Engine output (hp). Together with `weight` (tonnes) this gives each tank's power/weight ratio, which
  // decides how fast it can climb a slope (see slopeSpeedLimit). Matches the hp/t figures in the accel comments.
  const TANK_HP={tiger:700,panther:700,sturer:520,is7:1050,fv4005:650,amx50:810,t54e1:810,leopard1a5:830,m1abrams:1500,t72b:920,challenger1:1200,k1:1200,su30sm:280};
  Object.entries(TANK_HP).forEach(([id,hp])=>{ if(TANK_CONFIGS[id]) TANK_CONFIGS[id].hp=hp; });
  
  // ========== GAME INITIALIZATION ==========
  function initGame(tankId){
    const config = TANK_CONFIGS[tankId];
    // Show the aircraft-specific controls when deploying the Su-30; tank controls stay unchanged.
    const instructionEl = document.getElementById('instructions');
    if(instructionEl && config.isAircraft){
      instructionEl.textContent = 'W/S throttle · A/D rudder · Mouse aim · C cockpit/chase view · Hold RMB to look around in cockpit · Wheel changes cockpit FOV · G landing gear · I flight protection · T thrust vectoring · X cobra mode · 0 free camera';
    }
    
    // ---------- Setup ----------
  const scene = new THREE.Scene();
  // Map choice: picked in the menu (RANDOM = forest, desert, town or airport at random). ?map=forest|desert|town|airport in the page URL overrides it.
  const MAP_TYPES = ['forest','desert','town','airport'];
  const mapParam = new URLSearchParams(location.search).get('map');
  const mapType = config.isAircraft ? 'airport' : MAP_TYPES.includes(mapParam) ? mapParam : MAP_TYPES.includes(selectedMap) ? selectedMap : MAP_TYPES[Math.floor(Math.random()*MAP_TYPES.length)]; // menu choice, else random (aircraft always fly from the airport map)
  const desert = mapType === 'desert';
  const town = mapType === 'town';
  const airport = mapType === 'airport';
  const AIRPORT_SIZE = Math.min(38400, Math.max(6400, +new URLSearchParams(location.search).get('airportsize') || 19200));   // metres per side; ?airportsize=N to try other sizes
  const groundSize = town ? 1100 : desert ? 1300 : airport ? AIRPORT_SIZE : 640;
  // ---------- Time of day: rolled fresh every spawn (force one with ?time=day|sunset|night) ----------
  const TOD_PRESETS = {
    day:{
      label:'DAY', sunDir:[54,46,26], sunLen:75, sunColor:0xffe2b4, sunI:1.7, exposure:0.66,
      top:0x0c3586, mid:0x2a62b8, horizon:0x6a90c4, ground:0x2c3a22,
      hemiSky:0x6f98d8, hemiGround:0x25301f, hemiI:0.3, ambient:0x8aa8e0, ambientI:0.03,
      fogWarm:[0.97,0.86,0.70], fogWarmAmt:0.38, fogMul:1.0,
      cloudLit:[0.95,0.92,0.88], cloudDark:[0.16,0.21,0.34], stars:0, sunDisc:1, moon:0, unlit:1,
      grade:{tint:[1.0,1.0,1.0], sat:1.06, contrast:1.04, vig:0.16}, headlights:0, shadowNormalBias:0.03
    },
    sunset:{
      // Toned down from an earlier, over-saturated pass. First round cut fogWarmAmt (how hard the aerial-perspective
      // haze pushes every mid/far surface toward fogWarm) and grade.sat (the post-pass saturation boost). Still too
      // yellow after that because the sky dome has its own additive sun-glow terms (see the skyMat fragment shader)
      // that are scaled by sunDisc and sunColor - and one of them (the wide low-sun horizon glow) is gated to only
      // ever run when the sun is this low, so it's active ONLY at sunset among the three presets and wasn't touched
      // by the terrain-side fixes at all. sunDisc is cut hard here and sunColor is a little less saturated, which
      // reins in that sky-wide glow/halo directly. Still a warm, orange-sun sunset - just not a yellow wash over
      // everything including the sky itself.
      label:'SUNSET', sunDir:[-60,11,44], sunLen:130, sunColor:0xff9a5c, sunI:2.0, exposure:0.72,
      top:0x1d2a6b, mid:0x7a4a7c, horizon:0xdb7a52, ground:0x3a2a2a,
      hemiSky:0xb87668, hemiGround:0x2e2230, hemiI:0.32, ambient:0xa8697a, ambientI:0.05,
      fogWarm:[0.95,0.55,0.34], fogWarmAmt:0.42, fogMul:0.8,
      cloudLit:[0.98,0.64,0.42], cloudDark:[0.28,0.17,0.30], stars:0.08, sunDisc:0.85, moon:0, unlit:0.62,
      grade:{tint:[1.03,0.98,0.95], sat:1.02, contrast:1.06, vig:0.24}, headlights:0, shadowNormalBias:0.07
    },
    night:{
      label:'NIGHT', sunDir:[-35,48,-30], sunLen:90, sunColor:0x8aa4e8, sunI:0.26, exposure:0.5,
      top:0x010208, mid:0x050a1a, horizon:0x0b1428, ground:0x03050a,
      hemiSky:0x24385f, hemiGround:0x06080d, hemiI:0.16, ambient:0x3a4e86, ambientI:0.025,
      fogWarm:[0.1,0.14,0.28], fogWarmAmt:0.15, fogMul:0.55,
      cloudLit:[0.34,0.42,0.62], cloudDark:[0.03,0.05,0.12], stars:1, sunDisc:0, moon:1, unlit:0.2,
      grade:{tint:[0.85,0.97,1.12], sat:0.88, contrast:1.12, vig:0.42}, headlights:0, shadowNormalBias:0.04
    }
  };
  const todParam = new URLSearchParams(location.search).get('time');
  const todKey = TOD_PRESETS[todParam] ? todParam : TOD_PRESETS[selectedTime] ? selectedTime : ['day','sunset','night'][Math.floor(Math.random()*3)]; // menu choice, else random
  const TOD = TOD_PRESETS[todKey];
  window.TOD = TOD; // town-map.js reads TOD.unlit to dim its unlit smoke
  const atmosphere = TOD.horizon; // distance haze; matches the sky's horizon colour
  scene.background = new THREE.Color(atmosphere);
  const fogNear = (town ? 180 : desert ? 200 : airport ? 320 : 110), fogFar = (town ? 1500 : desert ? 1380 : airport ? 5600 : 520)*TOD.fogMul;
  scene.fog = new THREE.Fog(atmosphere, fogNear, fogFar);
  // Aerial perspective. Replaces three's linear fog with (a) a curve that starts gently and rolls into full
  // haze, so mid-distance terrain keeps its colour while the far field melts into the sky, (b) a low-lying
  // haze layer (valleys are hazier than ridge tops, so distant hills separate from the ground in front of
  // them) and (c) a tint on the sun side. The colours match the sky dome's horizon band below.
  {
    const fs=new THREE.Vector3(...TOD.sunDir).normalize(); // same direction as SUN_OFFSET
    const fw=TOD.fogWarm;
    const C=THREE.ShaderChunk;
    C.fog_pars_vertex='#ifdef USE_FOG\n varying float vFogDepth;\n varying vec3 vFogOffset;\n#endif';
    C.fog_vertex='#ifdef USE_FOG\n vFogDepth = -mvPosition.z;\n vFogOffset = vec3(dot(viewMatrix[0].xyz,mvPosition.xyz),dot(viewMatrix[1].xyz,mvPosition.xyz),dot(viewMatrix[2].xyz,mvPosition.xyz));\n#endif';
    C.fog_pars_fragment='#ifdef USE_FOG\n uniform vec3 fogColor;\n varying float vFogDepth;\n varying vec3 vFogOffset;\n uniform float fogNear;\n uniform float fogFar;\n const vec3 FOG_SUN = vec3('+fs.x.toFixed(4)+','+fs.y.toFixed(4)+','+fs.z.toFixed(4)+');\n#endif';
    C.fog_fragment='#ifdef USE_FOG\n'+
      ' float fogT = clamp((vFogDepth - fogNear) / (fogFar - fogNear), 0.0, 1.0);\n'+
      ' float fogAmt = (1.0 - exp(-pow(fogT * 2.2, 1.7))) / 0.978;\n'+
      ' float fogLow = exp(-max(cameraPosition.y + vFogOffset.y, 0.0) * 0.028);\n'+
      ' fogAmt = clamp(fogAmt * (0.62 + 0.55 * fogLow), 0.0, 1.0);\n'+
      ' float fogSun = pow(max(dot(normalize(vFogOffset), FOG_SUN), 0.0), 5.0);\n'+
      ' vec3 fogCol = mix(fogColor, vec3('+fw.map(v=>v.toFixed(3)).join(',')+'), fogSun * '+TOD.fogWarmAmt.toFixed(3)+');\n'+
      ' gl_FragColor.rgb = mix(gl_FragColor.rgb, fogCol, fogAmt);\n#endif';
  }

  const camera = new THREE.PerspectiveCamera(40, window.innerWidth/window.innerHeight, 0.1, town ? 1900 : airport ? 7000 : 1000);
  // The post pass below draws the scene into its own multisampled target, so a multisampled canvas on top of that is
  // pure waste (an extra full-screen MSAA buffer plus a resolve every frame). Keep canvas MSAA only when the post pass
  // can't be used (?blur=0, or no WebGL2), so edges look exactly as before in every case.
  const wantPost = new URLSearchParams(location.search).get('blur')!=='0';
  const hasGL2 = !!window.WebGL2RenderingContext && (()=>{ try{
    const c=document.createElement('canvas').getContext('webgl2'); if(!c) return false;
    const x=c.getExtension('WEBGL_lose_context'); if(x) x.loseContext(); return true; }catch(e){ return false; } })();
  const renderer = new THREE.WebGLRenderer({antialias:!(wantPost && hasGL2)});
  // Cap rendering at display resolution. Supersampling on high-DPI screens
  // adds a large per-frame pixel cost without improving gameplay readability.
  // Supersample a little over the display's own resolution (capped by total pixel count so huge or high-DPI
  // screens don't run out of video memory). The multisampled offscreen target then resolves into a cleaner
  // image: thin barrels, track links, tree edges and distant terrain shimmer less.
  // Pulled back from a 1.5x/cap-3 target: on a high-DPI display (devicePixelRatio 2+, common on laptops and
  // phones) that worked out to rendering up to 9x the screen's actual pixel count every frame - by far the
  // single biggest GPU cost in the game, independent of anything on screen. 1.15x/cap-1.75 still softens
  // aliasing without that blowout.
  const RENDER_SCALE = (()=>{
    const want = Math.max(window.devicePixelRatio||1,1)*1.15, maxPixels = 14e6, area = Math.max(1,window.innerWidth*window.innerHeight);
    return Math.max(1, Math.min(want, 1.75, Math.sqrt(maxPixels/area)));
  })();
  renderer.setPixelRatio(RENDER_SCALE);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = TOD.exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if(post) post.resize();
  });

  // ---------- Post pass: camera motion blur + light vignette ----------
  // The scene is drawn into an anti-aliased offscreen target, then one full-screen pass smears it along the camera's
  // own motion: turning the view streaks it sideways/up-down, driving fast stretches the screen edges outward.
  // The centre of the screen (where you aim) stays sharp, and the effect is cut back in the gunner sight.
  // Add ?blur=0 to the URL to turn it off (the scene then renders straight to the screen).
  const post = (()=>{
    const P = {enabled:new URLSearchParams(location.search).get('blur')!=='0'};
    const size = new THREE.Vector2();
    let rt=null, quadScene=null, quadCam=null, quadMat=null, ready=false;
    // Cinematic look (toggle with V): bloom, letterbox bars, film curve + split-tone grade. ?cine=0 starts with it off, ?bloom=0 drops just the bloom.
    const qs=new URLSearchParams(location.search);
    const bloomOn=qs.get('bloom')!=='0', BLOOM_STRENGTH=0.75, LETTERBOX_ASPECT=2.45;
    let cineTarget=qs.get('cine')==='0'?0:1, cineAmt=cineTarget, bloomActive=bloomOn&&cineTarget>0;
    let bA=null,bB=null,bC=null,bD=null,brightMat=null,blurMat=null,bloomScene=null,bloomQuad=null;
    const prevPos=new THREE.Vector3(), prevQuat=new THREE.Quaternion(), qInv=new THREE.Quaternion(), qRel=new THREE.Quaternion(), vLoc=new THREE.Vector3();
    let cx=0, cy=0, cz=0;
    const EXPOSURE=0.014, REF_DEPTH=14;
    try{
      renderer.getDrawingBufferSize(size);
      const opts={minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat};
      rt = (renderer.capabilities.isWebGL2 && THREE.WebGLMultisampleRenderTarget)
        ? new THREE.WebGLMultisampleRenderTarget(size.x,size.y,opts) : new THREE.WebGLRenderTarget(size.x,size.y,opts);
      rt.texture.encoding = THREE.sRGBEncoding;   // the scene writes display-ready colour; the blur pass copies it as is
      quadMat = new THREE.ShaderMaterial({
        depthTest:false, depthWrite:false,
        uniforms:{tScene:{value:rt.texture},uShift:{value:new THREE.Vector2()},uZoom:{value:0},uAspect:{value:1},uClear:{value:0.16},uVig:{value:TOD.grade.vig},uTint:{value:new THREE.Vector3(...TOD.grade.tint)},uSat:{value:TOD.grade.sat},uContrast:{value:TOD.grade.contrast},uPx:{value:size.y},tBloomA:{value:null},tBloomB:{value:null},uBloom:{value:0},uCine:{value:cineAmt},uBar:{value:0}},
        vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
        fragmentShader:`
          uniform sampler2D tScene; uniform vec2 uShift; uniform float uZoom, uAspect, uClear, uVig, uSat, uContrast, uPx; uniform vec3 uTint; uniform sampler2D tBloomA, tBloomB; uniform float uBloom, uCine, uBar;
          varying vec2 vUv;
          void main(){
            vec2 c = vUv-0.5;
            float r = length(c*vec2(uAspect,1.0));
            // blur fades in away from the screen centre, so the aim point stays crisp
            float edge = mix(0.15,1.0,smoothstep(uClear,uClear+0.45,r));
            vec2 stepv = (uShift + c*uZoom)*edge;
            vec3 col;
            // The smear length in pixels decides how many taps are worth taking: a short smear needs only a few, so
            // fast turns no longer cost 11 texture reads on every pixel (same look, far fewer reads on average).
            float lenPx = length(stepv*vec2(uAspect,1.0))*uPx;
            if(lenPx < 0.5){ col = texture2D(tScene,vUv).rgb; }
            else{
              int n = int(clamp(lenPx/6.0,3.0,11.0));
              float inv = 1.0/float(n-1);
              vec3 acc = vec3(0.0); float wsum = 0.0;
              for(int i=0;i<11;i++){
                if(i>=n) break;
                float t = float(i)*inv-0.5;
                float w = 1.0-abs(t)*0.9;
                acc += texture2D(tScene,vUv+stepv*t).rgb*w; wsum += w;
              }
              col = acc/wsum;
            }
            // bloom: two blurred copies of the bright parts (1/4 and 1/8 res) added back on top
            if(uBloom>0.001) col += (texture2D(tBloomA,vUv).rgb*0.6 + texture2D(tBloomB,vUv).rgb*0.9)*uBloom;
            // colour grade: per-time-of-day tint, saturation and a gentle S-curve contrast
            float luma = dot(col,vec3(0.299,0.587,0.114));
            col = mix(vec3(luma),col,uSat)*uTint;
            col = clamp((col-0.5)*uContrast+0.5+(uContrast-1.0)*0.02,0.0,1.0);
            if(uCine>0.001){
              // cinematic grade on top of the ACES tone map: a film S-curve (deeper toe, softer shoulder),
              // teal-leaning shadows / warm highlights, and a touch more saturation
              vec3 g = mix(col, col*col*(3.0-2.0*col), 0.55);
              float gl = dot(g,vec3(0.299,0.587,0.114));
              g *= mix(vec3(0.93,1.0,1.06), vec3(1.07,1.02,0.94), smoothstep(0.12,0.85,gl));
              g = mix(vec3(dot(g,vec3(0.299,0.587,0.114))), g, 1.10);
              col = mix(col, clamp(g,0.0,1.0), uCine);
            }
            float v = smoothstep(0.35,0.95,r*1.15);
            col *= 1.0-uVig*v*v;
            // letterbox bars (uBar = height of each bar as a fraction of the screen), edge softened by about a pixel
            if(uBar>0.0005) col *= smoothstep(uBar-0.0015,uBar+0.0015,vUv.y)*smoothstep(uBar-0.0015,uBar+0.0015,1.0-vUv.y);
            gl_FragColor = vec4(col,1.0);
          }`
      });
      const quad = new THREE.Mesh(new THREE.PlaneGeometry(2,2), quadMat);
      quad.frustumCulled = false;
      quadScene = new THREE.Scene(); quadScene.add(quad);
      quadCam = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
      // Bloom: bright-pass into a 1/4-res target, blur it (level 1), then blur a 1/8-res copy wider (level 2). Five tiny passes.
      const bOpts={minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,depthBuffer:false,stencilBuffer:false};
      // bloom blur is measured in texels, so its targets scale with the supersampling to keep the glow the same size on screen
      const mk=div=>new THREE.WebGLRenderTarget(Math.max(1,Math.round(size.x/(div*renderer.getPixelRatio()))),Math.max(1,Math.round(size.y/(div*renderer.getPixelRatio()))),bOpts);
      bA=mk(4); bB=mk(4); bC=mk(8); bD=mk(8);
      const bVert='varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }';
      brightMat=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,vertexShader:bVert,
        uniforms:{tSrc:{value:rt.texture},uTexel:{value:new THREE.Vector2(1/size.x,1/size.y)},uThresh:{value:0.84},uKnee:{value:0.14}},
        fragmentShader:`
          uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThresh, uKnee; varying vec2 vUv;
          vec3 br(vec2 uv){ vec3 c=texture2D(tSrc,uv).rgb; float m=mix(dot(c,vec3(0.2126,0.7152,0.0722)),max(max(c.r,c.g),c.b),0.5); return c*smoothstep(uThresh,uThresh+uKnee,m); }   // blend of luminance and peak: sunlit sand stays below it, flashes / sun / fire go over
          void main(){
            vec3 s=(br(vUv+uTexel*vec2(-1.0,-1.0))+br(vUv+uTexel*vec2(1.0,-1.0))+br(vUv+uTexel*vec2(-1.0,1.0))+br(vUv+uTexel*vec2(1.0,1.0)))*0.25;
            gl_FragColor=vec4(s,1.0);
          }`});
      blurMat=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,vertexShader:bVert,
        uniforms:{tSrc:{value:null},uDir:{value:new THREE.Vector2()}},
        fragmentShader:`
          uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv;
          void main(){
            vec3 c=texture2D(tSrc,vUv).rgb*0.2270270270;
            c+=texture2D(tSrc,vUv+uDir*1.3846153846).rgb*0.3162162162; c+=texture2D(tSrc,vUv-uDir*1.3846153846).rgb*0.3162162162;
            c+=texture2D(tSrc,vUv+uDir*3.2307692308).rgb*0.0702702703; c+=texture2D(tSrc,vUv-uDir*3.2307692308).rgb*0.0702702703;
            gl_FragColor=vec4(c,1.0);
          }`});
      bloomQuad=new THREE.Mesh(quad.geometry,brightMat); bloomQuad.frustumCulled=false;
      bloomScene=new THREE.Scene(); bloomScene.add(bloomQuad);
      quadMat.uniforms.tBloomA.value=bA.texture; quadMat.uniforms.tBloomB.value=bD.texture;
    }catch(err){ console.warn('Post pass unavailable, rendering directly:',err); P.enabled=false; rt=null; }

    P.resize = ()=>{
      if(!rt) return; renderer.getDrawingBufferSize(size); rt.setSize(size.x,size.y); quadMat.uniforms.uPx.value=size.y;
      if(bA){
        [[bA,4],[bB,4],[bC,8],[bD,8]].forEach(([t,d])=>t.setSize(Math.max(1,Math.round(size.x/(d*renderer.getPixelRatio()))),Math.max(1,Math.round(size.y/(d*renderer.getPixelRatio())))));
        brightMat.uniforms.uTexel.value.set(1/size.x,1/size.y);
      }
    };
    // V toggles the whole cinematic look (bloom + bars + grade). Bound once, so a restart can't double-toggle.
    // The same switch also strips the HUD down to speed + shell type (CSS: body.cine).
    const applyCineClass = ()=>document.body.classList.toggle('cine', cineTarget>0);
    P.toggleCine = ()=>{ cineTarget = cineTarget ? 0 : 1; applyCineClass(); };
    applyCineClass();
    window.__cineToggle = P.toggleCine;
    if(!window.__cineKeyBound){
      window.__cineKeyBound = true;
      window.addEventListener('keydown',e=>{ if(e.code==='KeyV' && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey && window.__cineToggle) window.__cineToggle(); });
    }
    // Work out how fast the view is moving this frame (from the pose before shake) and set the blur to match.
    P.update = dt=>{
      if(!P.enabled||!rt||!(dt>0)) return;
      cineAmt += (cineTarget-cineAmt)*Math.min(1,dt*5);
      if(Math.abs(cineTarget-cineAmt)<0.002) cineAmt=cineTarget;
      const cu=quadMat.uniforms;
      cu.uCine.value=cineAmt;
      cu.uBloom.value=(bloomOn&&bA&&cineAmt>0.01) ? BLOOM_STRENGTH*cineAmt : 0;
      cu.uBar.value=Math.max(0,(1-camera.aspect/LETTERBOX_ASPECT)*0.5)*cineAmt*(1-sightBlend);   // bars slide away in the gunner sight
      bloomActive=cu.uBloom.value>0.001;
      if(!ready){ prevPos.copy(blurPos); prevQuat.copy(blurQuat); ready=true; return; }
      qInv.copy(blurQuat).invert();
      vLoc.copy(blurPos).sub(prevPos).applyQuaternion(qInv).divideScalar(dt);          // camera-space velocity
      qRel.copy(prevQuat).invert().multiply(blurQuat);
      const s=(qRel.w<0?-2:2)/dt, wx=qRel.x*s, wy=qRel.y*s;                              // camera-space angular velocity
      prevPos.copy(blurPos); prevQuat.copy(blurQuat);
      let tx=0, ty=0, tz=0;
      const acft=!!(typeof player!=='undefined' && player && player.isAircraft);
      if(vLoc.length()<(acft?420:120) && Math.hypot(wx,wy)<7){   // the jet is much faster than a tank: only teleports (respawn) count as cuts                                     // bigger jumps are cuts (respawn, kill cam), not motion
        const tanV=Math.tan(THREE.MathUtils.degToRad(camera.fov)*0.5), tanH=tanV*camera.aspect;
        const k=EXPOSURE*(1-0.72*sightBlend);
        const lat=acft?0.1:1;   // sideways/vertical camera travel is parallax at tank distances; for a jet it just smears the whole frame in every turn
        tx=0.5*(wy-lat*vLoc.x/REF_DEPTH)/tanH*k;
        ty=0.5*(-wx-lat*vLoc.y/REF_DEPTH)/tanV*k;
        tz=THREE.MathUtils.clamp(-vLoc.z/REF_DEPTH*k,-0.06,0.06);
        const m=Math.hypot(tx,ty); if(m>0.045){ tx*=0.045/m; ty*=0.045/m; }
      }
      cx+=(tx-cx)*0.4; cy+=(ty-cy)*0.4; cz+=(tz-cz)*0.4;                                // smooth, so it never flickers
      const u=quadMat.uniforms;
      u.uShift.value.set(cx,cy); u.uZoom.value=cz; u.uAspect.value=camera.aspect;
      u.uVig.value=TOD.grade.vig*(1-0.5*sightBlend)*(1+0.3*cineAmt);
    };
    P.render = ()=>{
      if(!P.enabled||!rt){ renderer.render(scene,camera); return; }
      renderer.setRenderTarget(rt); renderer.render(scene,camera);
      if(bloomActive&&bA){
        const pass=(mat,target)=>{ bloomQuad.material=mat; renderer.setRenderTarget(target); renderer.render(bloomScene,quadCam); };
        const blur=(src,dst,dx,dy)=>{ blurMat.uniforms.tSrc.value=src.texture; blurMat.uniforms.uDir.value.set(dx/dst.width,dy/dst.height); pass(blurMat,dst); };
        pass(brightMat,bA);                  // keep only the bright pixels, 1/4 res
        blur(bA,bB,1,0); blur(bB,bA,0,1);    // level 1: tight glow
        blur(bA,bC,1.8,0); blur(bC,bD,0,1.8);// level 2: 1/8 res, wider halo
      }
      renderer.setRenderTarget(null); renderer.render(quadScene,quadCam);
    };
    return P;
  })();

  // ---------- Sky, lights, reflections ----------
  // Procedural sky dome: deep blue zenith fading to a hazy horizon, with slowly drifting clouds.
  // No textures, so it works from a local file. It follows the camera so it never gets closer.
  const SUN_OFFSET = new THREE.Vector3(...TOD.sunDir).normalize().multiplyScalar(TOD.sunLen); // direction + distance of the sun (or moon) from the player
  const sunDir = SUN_OFFSET.clone().normalize();
  const lin = hex => { const c=new THREE.Color(hex); c.convertSRGBToLinear(); return c; };
  const skyMat = new THREE.ShaderMaterial({
    side:THREE.BackSide, depthWrite:false, depthTest:true, fog:false, toneMapped:false,
    uniforms:{
      topColor:{value:lin(TOD.top)},
      midColor:{value:lin(TOD.mid)},
      horizonColor:{value:lin(TOD.horizon)},
      groundColor:{value:lin(todKey==='day'?(town?0x4a5230:desert?0x7a6234:0x2c3a22):TOD.ground)},
      sunDir:{value:sunDir.clone()}, sunColor:{value:lin(TOD.sunColor).multiplyScalar(1.0)},
      cloudLit:{value:new THREE.Vector3(...TOD.cloudLit)}, cloudDark:{value:new THREE.Vector3(...TOD.cloudDark)},
      fogWarm:{value:new THREE.Vector3(...TOD.fogWarm)}, fogWarmAmt:{value:TOD.fogWarmAmt},
      starAmt:{value:TOD.stars}, sunDisc:{value:TOD.sunDisc}, moonAmt:{value:TOD.moon},
      time:{value:0}
    },
    vertexShader:`
      varying vec3 vDir;
      void main(){
        vDir = position;
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        gl_Position = vec4(p.xy, p.w*0.999999, p.w);   // pinned to the far plane: drawn last, only where nothing else is
      }`,
    fragmentShader:`
      uniform vec3 topColor, midColor, horizonColor, groundColor, sunDir, sunColor, cloudLit, cloudDark, fogWarm;
      uniform float time, fogWarmAmt, starAmt, sunDisc, moonAmt;
      varying vec3 vDir;
      float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
      float noise(vec2 p){
        vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y);
      }
      float fbm(vec2 p){
        float v=0.0, a=0.5;
        for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.03+vec2(17.1,9.2); a*=0.5; }
        return v;
      }
      void main(){
        vec3 d = normalize(vDir);
        float h = max(d.y,0.0);
        vec3 col = mix(horizonColor, midColor, smoothstep(0.0,0.26,pow(h,1.3)));
        col = mix(col, topColor, smoothstep(0.18,0.85,h));
        if(d.y<0.0) col = mix(horizonColor, groundColor, smoothstep(0.0,0.4,-d.y)*0.75);
        // Bright, slightly warm haze band hugging the horizon (same tint the terrain fog uses on the sun side),
        // so far terrain dissolves into it instead of meeting a hard line.
        float skySun = pow(max(dot(d,sunDir),0.0),5.0);
        vec3 hazeCol = mix(horizonColor, fogWarm, skySun*fogWarmAmt);
        col = mix(col, hazeCol, exp(-h*10.0)*0.9);
        // sun glow + disc
        float sd = max(dot(d,sunDir),0.0);
        col += sunColor*sunDisc*(pow(sd,900.0)*4.0 + pow(sd,40.0)*0.22 + pow(sd,6.0)*0.06);
        // low sun: wide warm glow along the horizon
        col += sunColor*sunDisc*pow(sd,3.0)*0.18*exp(-h*4.0)*step(sunDir.y,0.4);
        // moon: soft-edged disc with a pale halo, plus a scatter of stars that fade near the horizon
        if(moonAmt>0.0){
          float md = acos(clamp(dot(d,sunDir),-1.0,1.0));
          float disc = 1.0-smoothstep(0.034,0.040,md);
          vec2 mp = (d - sunDir*dot(d,sunDir)).xz*28.0;
          float crater = 0.85+0.15*noise(mp*3.0);
          col += vec3(0.88,0.92,1.0)*disc*crater*1.7*moonAmt + vec3(0.35,0.45,0.75)*pow(max(dot(d,sunDir),0.0),60.0)*0.5*moonAmt;
        }
        if(starAmt>0.0 && d.y>0.0){
          vec2 sp = d.xz/(d.y+0.4)*90.0;
          vec2 cell = floor(sp); float rnd = hash(cell);
          float tw = 0.75+0.25*sin(time*(1.5+rnd*3.0)+rnd*40.0);
          float star = step(0.985,rnd)*smoothstep(0.35,0.0,length(fract(sp)-0.5))*tw;
          col += vec3(0.85,0.9,1.0)*star*starAmt*smoothstep(0.02,0.3,d.y)*(1.2+rnd);
        }
        // drifting clouds projected onto a flat layer overhead
        if(d.y>0.03){   // below this the cloud fade is exactly 0, so skip the 10 noise lookups
        vec2 uv = d.xz/(d.y+0.16)*0.85 + vec2(time*0.006, time*0.002);
        float c  = fbm(uv*1.25);
        float cover = smoothstep(0.50,0.76,c);
        float fade  = smoothstep(0.03,0.30,d.y);
        float towardSun = fbm(uv*1.25 + sunDir.xz*0.22);
        float shade = clamp(0.55 + (c-towardSun)*3.2, 0.18, 1.0);
        vec3 cloudCol = mix(cloudDark, cloudLit, shade);
        cloudCol = mix(cloudCol, horizonColor, 0.25*(1.0-smoothstep(0.0,0.5,d.y)));
        col = mix(col, cloudCol, cover*fade*0.97);
        }
        gl_FragColor = vec4(col,1.0);
        #include <encodings_fragment>
      }`
  });
  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(500,96,48), skyMat);
  skyDome.renderOrder = 10000; skyDome.frustumCulled = false;   // last of the opaque pass; the depth test then rejects every pixel the ground already covers
  scene.add(skyDome);

  // Bake the sky into an environment map so the metal armour reflects it (sky above, ground below).
  let tankEnvMap = null;
  try{
    const envScene = new THREE.Scene();
    const envDome = new THREE.Mesh(new THREE.SphereGeometry(50,32,16), skyMat);
    envDome.frustumCulled = false; envScene.add(envDome);
    skyMat.uniforms.time.value = 40;
    const pmrem = new THREE.PMREMGenerator(renderer);
    tankEnvMap = pmrem.fromScene(envScene).texture;
    pmrem.dispose();
  }catch(err){ console.warn('Environment map unavailable, tanks stay matte:',err); }

  // Sky/ground ambient and the key light (sun by day, low orange sun at sunset, cool moon at night).
  scene.add(new THREE.HemisphereLight(todKey==='day'?(desert?0x7aa2e0:TOD.hemiSky):TOD.hemiSky,
    todKey==='day'?(town?0x4a5030:desert?0x5e4a2c:TOD.hemiGround):TOD.hemiGround,
    todKey==='day'&&town?0.36:TOD.hemiI));
  scene.add(new THREE.AmbientLight(TOD.ambient, TOD.ambientI));
  const sun = new THREE.DirectionalLight(TOD.sunColor, TOD.sunI);
  sun.position.copy(SUN_OFFSET);
  sun.castShadow = true;
  // Pulled back from 4096 to 2048: a PCFSoftShadowMap does several samples per shadowed pixel, so the map
  // itself (and the depth pass that fills it every frame) is the single most expensive thing in this scene,
  // independent of anything else on screen - 4096 is 4x the texels (and roughly 4x the sampling cost) of 2048.
  const SHADOW_SIZE = Math.min(2048, renderer.capabilities.maxTextureSize||2048), SHADOW_EXTENT = 72;
  sun.shadow.mapSize.set(SHADOW_SIZE,SHADOW_SIZE);
  sun.shadow.bias = -0.0002;
  sun.shadow.normalBias = TOD.shadowNormalBias;
  sun.shadow.camera.left=-SHADOW_EXTENT; sun.shadow.camera.right=SHADOW_EXTENT;
  sun.shadow.camera.top=SHADOW_EXTENT; sun.shadow.camera.bottom=-SHADOW_EXTENT;
  sun.shadow.camera.near=1; sun.shadow.camera.far=TOD.sunLen+230;
  sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun,sun.target);
  // Keep the shadow map centred on the player, snapped to whole shadow texels so the edges don't shimmer.
  const _sR=new THREE.Vector3(), _sU=new THREE.Vector3(), _sC=new THREE.Vector3();
  function updateSunShadow(center){
    const texel=(SHADOW_EXTENT*2)/SHADOW_SIZE;
    _sR.crossVectors(new THREE.Vector3(0,1,0),sunDir).normalize();
    _sU.crossVectors(sunDir,_sR).normalize();
    const a=center.dot(_sR), b=center.dot(_sU);
    _sC.copy(center).addScaledVector(_sR,Math.round(a/texel)*texel-a).addScaledVector(_sU,Math.round(b/texel)*texel-b);
    sun.target.position.copy(_sC);
    sun.position.copy(_sC).add(SUN_OFFSET);
    sun.target.updateMatrixWorld();
  }


  // Soft dark blob used as fake ambient occlusion / contact shadow under tanks, trees and rocks.
  const aoCanvas=document.createElement('canvas'); aoCanvas.width=aoCanvas.height=128;
  { const g=aoCanvas.getContext('2d'), gr=g.createRadialGradient(64,64,4,64,64,64);
    gr.addColorStop(0,'rgba(0,0,0,0.95)'); gr.addColorStop(0.45,'rgba(0,0,0,0.55)'); gr.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=gr; g.fillRect(0,0,128,128); }
  const aoTexture=new THREE.CanvasTexture(aoCanvas);
  function makeContactShadow(w,l,opacity){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,l),new THREE.MeshBasicMaterial({map:aoTexture,transparent:true,opacity,depthWrite:false,
      polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}));
    m.rotation.x=-Math.PI/2; m.renderOrder=1; m.castShadow=false; m.receiveShadow=false; return m;
  }
  // Mud splashed up from the ground, dust settled on upward-facing plates and grime streaks, blended into
  // the existing material so lighting, shadows and reflections still apply. Height is measured from the
  // tank's ground level (the uniform object is shared per tank and refreshed every frame).
  function addTankDirt(m,baseUniform,amount){
    m.onBeforeCompile=shader=>{
      shader.uniforms.uDirtBase=baseUniform;
      shader.uniforms.uDirtAmt={value:amount};
      shader.uniforms.uMud={value:new THREE.Color(town?0x4a3b2a:desert?0x6b5232:0x3a2e20)};
      shader.uniforms.uDust={value:new THREE.Color(town?0x9a8c70:desert?0xb8996a:0x7a6f55)};
      shader.vertexShader=shader.vertexShader
        .replace('#include <common>','#include <common>\nvarying vec3 vDirtLocal;\nvarying float vDirtWorldY;')
        .replace('#include <begin_vertex>','#include <begin_vertex>\nvDirtLocal=position;\nvDirtWorldY=(modelMatrix*vec4(position,1.0)).y;');
      shader.fragmentShader=shader.fragmentShader
        .replace('#include <common>',`#include <common>
          varying vec3 vDirtLocal; varying float vDirtWorldY;
          uniform float uDirtBase, uDirtAmt; uniform vec3 uMud, uDust;
          float dHash(vec3 p){ p=fract(p*0.3183099+vec3(0.1,0.2,0.3)); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
          float dNoise(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
            return mix(mix(mix(dHash(i),dHash(i+vec3(1,0,0)),f.x),mix(dHash(i+vec3(0,1,0)),dHash(i+vec3(1,1,0)),f.x),f.y),
                       mix(mix(dHash(i+vec3(0,0,1)),dHash(i+vec3(1,0,1)),f.x),mix(dHash(i+vec3(0,1,1)),dHash(i+vec3(1,1,1)),f.x),f.y),f.z); }`)
        .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
          {
            float n1=dNoise(vDirtLocal*5.0), n2=dNoise(vDirtLocal*19.0);
            float h=vDirtWorldY-uDirtBase;
            float mud=(1.0-smoothstep(0.1,0.9+0.6*n1,h))*(0.5+0.5*n2);
            float up=dot(normal,normalize((viewMatrix*vec4(0.0,1.0,0.0,0.0)).xyz));
            float dust=smoothstep(0.35,0.95,up)*(0.25+0.6*n1);
            float streak=smoothstep(0.58,0.9,dNoise(vec3(vDirtLocal.x*13.0,vDirtLocal.y*1.4,vDirtLocal.z*13.0)));
            diffuseColor.rgb=mix(diffuseColor.rgb,uMud,clamp(mud*0.8*uDirtAmt,0.0,0.9));
            diffuseColor.rgb=mix(diffuseColor.rgb,uDust,clamp(dust*0.4*uDirtAmt,0.0,0.5));
            diffuseColor.rgb*=1.0-streak*0.4*uDirtAmt;
          }`);
    };
    m.customProgramCacheKey=()=>'tankdirt';
    m.needsUpdate=true;
  }

  // ---------- Ground ----------
  const {terrainHeightAt, treeColliders, solidAt:mapSolidAt, footprints:mapFootprints, minimapFeatures:mapFeatures, updateLOD:mapUpdateLOD, blockedAt:mapBlockedAt, spawnSlots:mapSpawnSlots, minimapImage:mapMiniImage, minimapLines:mapLines} = town
    ? window.createTownMap(scene, groundSize)
    : desert
    ? window.createDesertMap(scene, groundSize)
    : airport
    ? window.createAirportMap(scene, groundSize)
    : window.createForestMap(scene, groundSize);

  // ---------- Minimap picture ----------
  // The airport map draws its own overview. Every other map gets one built here: shaded relief tinted for the
  // map, the roads / trenches / washes the map file exports (`minimapLines`), and tree or rock dots.
  function buildMapOverview(){
    const N=384, kk=groundSize/N, cv=document.createElement('canvas'); cv.width=cv.height=N; const g=cv.getContext('2d');
    const W=N+2, H=new Float32Array(W*W);
    for(let j=-1;j<=N;j++) for(let i=-1;i<=N;i++) H[(j+1)*W+i+1]=terrainHeightAt((N/2-i-0.5)*kk,(N/2-j-0.5)*kk);
    let lo=1e9, hi=-1e9; for(let i=0;i<H.length;i++){ if(H[i]<lo) lo=H[i]; if(H[i]>hi) hi=H[i]; }
    const pal = town ? {a:[0.40,0.47,0.26],b:[0.56,0.55,0.38],sh:3.0,dot:null}
              : desert ? {a:[0.80,0.67,0.44],b:[0.55,0.46,0.33],sh:3.2,dot:'rgba(92,80,62,0.85)'}
              : {a:[0.27,0.35,0.19],b:[0.52,0.50,0.36],sh:2.2,dot:'rgba(28,46,24,0.8)'};
    const img=g.createImageData(N,N);
    for(let j=0;j<N;j++) for(let i=0;i<N;i++){
      const c=(j+1)*W+i+1, h=H[c], hx=(H[c-1]-H[c+1])/(2*kk), hz=(H[c-W]-H[c+W])/(2*kk);
      const sh=Math.max(0.6,Math.min(1.35,1+(hx-hz)*pal.sh)), t=Math.pow(Math.max(0,Math.min(1,(h-lo)/(hi-lo+1e-6))),0.8);
      const n=0.94+0.12*(Math.abs(Math.sin((i>>1)*12.9898+(j>>1)*78.233)*43758.5453)%1), o=(j*N+i)*4;
      for(let q=0;q<3;q++) img.data[o+q]=Math.max(0,Math.min(255,(pal.a[q]+(pal.b[q]-pal.a[q])*t)*sh*n*255));
      img.data[o+3]=255;
    }
    g.putImageData(img,0,0);
    const MX=x=>N/2-x/kk, MZ=z=>N/2-z/kk;
    g.lineCap='round'; g.lineJoin='round';
    for(const l of (mapLines||[])){
      g.strokeStyle=l.color; g.lineWidth=Math.max(1,l.w/kk); g.beginPath();
      l.pts.forEach((p,i)=>i?g.lineTo(MX(p[0]),MZ(p[1])):g.moveTo(MX(p[0]),MZ(p[1]))); g.stroke();
    }
    if(pal.dot){ g.fillStyle=pal.dot; for(const c of treeColliders){ const r=Math.max(0.9,c.radius/kk); g.beginPath(); g.arc(MX(c.x),MZ(c.z),r,0,6.2832); g.fill(); } }
    return cv;
  }
  const overviewImage = mapMiniImage || buildMapOverview();
  // Arena boundary walls
  const wallMat = new THREE.MeshStandardMaterial({color:town?0x5c6040:airport?0x6e6a54:0x6b5a3f});
  const wallH = 2, wallT = 1;
  [[0,groundSize/2,groundSize,wallT],[0,-groundSize/2,groundSize,wallT],
   [groundSize/2,0,wallT,groundSize],[-groundSize/2,0,wallT,groundSize]].forEach(([x,z,w,d])=>{
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w,wallH,d), wallMat);
    wall.position.set(x, wallH/2, z);
    wall.castShadow = true; wall.receiveShadow = true;
    scene.add(wall);
  });

  function alignTankToTerrain(tank,dt=0){
    // Simple initial terrain alignment (used only for initialization)
    // Real suspension handles dynamic alignment during gameplay
    const x=tank.group.position.x,z=tank.group.position.z,yaw=tank.group.rotation.y,step=0.8;
    const slopeX=(terrainHeightAt(x+step,z)-terrainHeightAt(x-step,z))/(2*step);
    const slopeZ=(terrainHeightAt(x,z+step)-terrainHeightAt(x,z-step))/(2*step);
    const forwardSlope=slopeX*Math.sin(yaw)+slopeZ*Math.cos(yaw);
    const rightSlope=slopeX*Math.cos(yaw)-slopeZ*Math.sin(yaw);
    const maxTilt=0.42;
    const targetTiltX=THREE.MathUtils.clamp(-Math.atan(forwardSlope),-maxTilt,maxTilt);
    const targetTiltZ=THREE.MathUtils.clamp(Math.atan(rightSlope),-maxTilt,maxTilt);
    
    // For initialization, set directly without lerp
    if(dt === 0 || tank.terrainTiltX === undefined){
      tank.group.rotation.x = targetTiltX;
      tank.group.rotation.z = targetTiltZ;
    }
    
    tank.terrainTiltX = tank.group.rotation.x;
    tank.terrainTiltZ = tank.group.rotation.z;
  }

  // ========== SPRUNG-HULL SUSPENSION (Panther) ==========
  // The wheels stay glued to the ground; the HULL is the sprung body. It has three
  // degrees of freedom (heave, pitch, roll) driven by one spring-damper per road
  // wheel. The damper acts on the speed of the wheel RELATIVE TO THE HULL, so a
  // steady climb has no lag and the hull cannot sink under the terrain.
  const SUSPENSION={
    bounceFreq:5.5,      // rad/s, natural frequency of heave/pitch/roll
    dampingRatio:0.55,   // 1 = no overshoot, lower = bouncier
    maxBump:0.22,        // how far a wheel may rise into the hull before the bump stop
    extraDroop:0.05,     // extra wheel hang beyond the spring's relaxed length
    accelPitchGain:0.02,  // radians of nose lift / dive per u/s^2 of acceleration
    maxAccelPitch:0.08,   // cap on that pitch (rad) - weight transfer can never tip the tank
    leanRollGain:0.012,   // radians of body lean per u/s^2 of cornering acceleration
    maxLeanRoll:0.05,     // cap on that lean (rad)
    maxPitch:0.8,         // hard limits (rad): the hull follows slopes up to ~45 deg
    maxRoll:0.65,         // but can never be tipped over, even after a jump
    angularDrag:2.5,      // 1/s, calms any spin (in the air nothing else would)
    maxSubstep:1/120
  };
  // Axle height that makes the wheel/track sit on the terrain. Three samples along
  // the wheel's circle so a crest or ledge ahead/behind lifts the wheel too.
  // Works for any tank with road-wheel stations (wheelPositions), including scaled
  // hulls such as the IS-7: every local size is multiplied by the group's scale.
  const UNIT_SCALE={x:1,y:1,z:1};
  function wheelGroundAxleY(tank,w,sinY,cosY){
    const sc=tank.group.scale||UNIT_SCALE,lx=w.x*sc.x,lz=w.z*sc.z;
    const cx=tank.group.position.x+lx*cosY+lz*sinY;   // Three.js yaw: x'=x*cos+z*sin
    const cz=tank.group.position.z-lx*sinY+lz*cosY;   //               z'=-x*sin+z*cos
    const R=w.radius*sc.y,reach=0.7*R,drop=R-Math.sqrt(R*R-reach*reach);
    return tank.trackY*sc.y+Math.max(
      terrainHeightAt(cx,cz),
      terrainHeightAt(cx+sinY*reach,cz+cosY*reach)-drop,
      terrainHeightAt(cx-sinY*reach,cz-cosY*reach)-drop);
  }
  function initSuspension(tank){
    const ws=tank.wheelPositions,n=ws.length,yaw=tank.group.rotation.y,sinY=Math.sin(yaw),cosY=Math.cos(yaw);
    const cfg=SUSPENSION,gravity=9.81/METERS_PER_WORLD_UNIT;
    const sc=tank.group.scale||UNIT_SCALE,xs=ws.map(w=>w.x*sc.x),zs=ws.map(w=>w.z*sc.z);   // hull-space sizes
    const cx=xs.reduce((a,v)=>a+v,0)/n,cz=zs.reduce((a,v)=>a+v,0)/n;   // wheel centroid = pivot
    const dx2=xs.reduce((a,v)=>a+(v-cx)**2,0)/n,dz2=zs.reduce((a,v)=>a+(v-cz)**2,0)/n;
    const ground=ws.map(w=>wheelGroundAxleY(tank,w,sinY,cosY));
    // Start on the least-squares plane through the wheels so there is no spawn bounce.
    const mg=ground.reduce((a,v)=>a+v,0)/n;
    let sx=0,sz=0;ws.forEach((w,i)=>{sx+=(xs[i]-cx)*(ground[i]-mg);sz+=(zs[i]-cz)*(ground[i]-mg);});
    const roll=Math.atan(sx/Math.max(1e-4,n*dx2)),pitch=-Math.atan(sz/Math.max(1e-4,n*dz2));
    const k=cfg.bounceFreq*cfg.bounceFreq/n;                 // per-wheel spring (hull mass = 1)
    return tank.suspension={
      cx,cz,xs,zs,trackYw:tank.trackY*sc.y,sy:sc.y,k,c:2*cfg.dampingRatio*cfg.bounceFreq/n,kStop:k*30,
      sag:gravity/(n*k),gravity,
      Ip:Math.max(0.5,1.35*dz2),Ir:Math.max(0.3,1.35*dx2),kPitch:k*n*dz2,kRoll:k*n*dx2,
      y:mg-tank.trackY*sc.y,vy:0,pitch,vpitch:0,roll,vroll:0,
      ground,e:new Array(n).fill(0),
      prevSpeed:0,prevYaw:tank.group.rotation.y,accel:0,yawRate:0,
      lastX:tank.group.position.x,lastZ:tank.group.position.z
    };
  }
  function applyRealSuspension(tank,currentSpeed,dt){
    if(!(dt>0)||!tank.wheelPositions?.length)return;   // only tanks with road-wheel stations
    const g=tank.group,ws=tank.wheelPositions,n=ws.length,cfg=SUSPENSION;
    let s=tank.suspension;
    if(!s||Math.hypot(g.position.x-s.lastX,g.position.z-s.lastZ)>4){s=initSuspension(tank);s.prevSpeed=currentSpeed;}
    dt=Math.min(dt,0.05);
    const yaw=g.rotation.y,sinY=Math.sin(yaw),cosY=Math.cos(yaw);
    // Ground under every wheel this frame (interpolated between frames inside the substeps).
    const prev=s.ground,cur=ws.map(w=>wheelGroundAxleY(tank,w,sinY,cosY));
    // Weight transfer: braking dives the nose, accelerating lifts it, turning leans the hull out.
    const lp=Math.min(1,dt*8),dYaw=Math.atan2(Math.sin(yaw-s.prevYaw),Math.cos(yaw-s.prevYaw));
    s.accel+=((currentSpeed-s.prevSpeed)/dt-s.accel)*lp;
    s.yawRate+=(dYaw/dt-s.yawRate)*lp;
    s.prevSpeed=currentSpeed;s.prevYaw=yaw;
    // Bounded: the pull is "aim for a small tilt", never a raw torque, so it cannot flip the hull.
    const clampTo=(v,m)=>Math.max(-m,Math.min(m,v));
    const pitchPush=clampTo(-s.accel*cfg.accelPitchGain,cfg.maxAccelPitch)*s.kPitch;   // + = nose down
    const rollPush=clampTo(currentSpeed*s.yawRate*cfg.leanRollGain,cfg.maxLeanRoll)*s.kRoll; // + = +x side up
    const steps=Math.ceil(dt/cfg.maxSubstep),h=dt/steps,trackY=s.trackYw,droop=s.sag+cfg.extraDroop;
    for(let step=1;step<=steps;step++){
      const t=step/steps,sr=Math.sin(s.roll),cr=Math.cos(s.roll),sp=Math.sin(s.pitch),cp=Math.cos(s.pitch);
      let force=0,torqueP=0,torqueR=0;
      for(let i=0;i<n;i++){
        const dx=s.xs[i]-s.cx,dz=s.zs[i]-s.cz;
        const groundY=prev[i]+(cur[i]-prev[i])*t,groundV=(cur[i]-prev[i])/dt;
        const attachY=s.y+(dx*sr+trackY*cr)*cp-dz*sp;     // where the hull's wheel mount is
        const attachV=s.vy+dx*s.vroll-dz*s.vpitch;
        const e=groundY-attachY;                          // + = wheel pushed up into the hull
        s.e[i]=e;
        if(e<-droop)continue;                             // wheel hanging in the air
        let f=s.k*(e+s.sag)+s.c*(groundV-attachV);        // damper uses RELATIVE speed
        if(e>cfg.maxBump)f+=s.kStop*(e-cfg.maxBump);      // bump stop: hull can't hit the ground
        if(f<0)f=0;
        force+=f;torqueP-=f*dz;torqueR+=f*dx;
      }
      s.vy+=(force-s.gravity)*h;
      s.vpitch+=((torqueP+pitchPush)/s.Ip)*h;
      s.vroll+=((torqueR+rollPush)/s.Ir)*h;
      s.y+=s.vy*h;s.pitch+=s.vpitch*h;s.roll+=s.vroll*h;
      const drag=Math.exp(-cfg.angularDrag*h);s.vpitch*=drag;s.vroll*=drag;
      if(s.pitch>cfg.maxPitch){s.pitch=cfg.maxPitch;if(s.vpitch>0)s.vpitch=0;}
      else if(s.pitch<-cfg.maxPitch){s.pitch=-cfg.maxPitch;if(s.vpitch<0)s.vpitch=0;}
      if(s.roll>cfg.maxRoll){s.roll=cfg.maxRoll;if(s.vroll>0)s.vroll=0;}
      else if(s.roll<-cfg.maxRoll){s.roll=-cfg.maxRoll;if(s.vroll<0)s.vroll=0;}
    }
    s.ground=cur;
    if(!Number.isFinite(s.y+s.pitch+s.roll)){
      initSuspension(tank);s=tank.suspension;s.prevSpeed=currentSpeed;   // numerical blow-up safety net
    }
    // Write the result to the model: rotate about the wheel centroid, then place the origin.
    const sr=Math.sin(s.roll),cr=Math.cos(s.roll),sp=Math.sin(s.pitch),cp=Math.cos(s.pitch);
    g.rotation.x=s.pitch;g.rotation.z=s.roll;
    g.position.y=s.y-((s.cx*sr)*cp-s.cz*sp);
    // Each road wheel rides on the ground: its position inside the hull is the spring travel.
    for(let i=0;i<n;i++)ws[i].group.position.y=tank.trackY+Math.max(-droop,Math.min(cfg.maxBump,s.e[i]))/s.sy;   // back to hull-local units
    s.lastX=g.position.x;s.lastZ=g.position.z;
  }

  // ---------- Tank ----------
  function buildTank(bodyColor, turretColor, tankId){
    if(tankId==='su30sm') return buildSu30SM(bodyColor, turretColor); // aircraft: entirely separate builder, see below
    const tank = new THREE.Group();
    tank.rotation.order = 'YXZ'; // Keep yaw stable while pitching and rolling with the ground.
    const isTiger = tankId === 'tiger';
    const isSturer = tankId === 'sturer';
    const isIS7 = tankId === 'is7';
    const isFV4005 = tankId === 'fv4005';
    const isAMX50 = tankId === 'amx50';
    const isT54E1 = tankId === 't54e1';
    const isLeo = tankId === 'leopard1a5';
    const isM1 = tankId === 'm1abrams';
    const isT72 = tankId === 't72b';
    const isChallenger1 = tankId === 'challenger1';
    const isK1 = tankId === 'k1';
    // K1 (base/Type 88, NOT K1A1/K1A2): authored entirely in real metres via ku(), uniform group
    // scale, same style as the T-72B helpers below. Confirmed dimensions (Wikipedia/GlobalSecurity/
    // army-guide.com, all agree): hull length 7.48 m, overall length gun-forward 9.67 m, width
    // 3.60 m, height 2.25 m, weight 51.1 t, 105 mm KM68A1 (M68A1/L7 derivative - NOT the 120 mm
    // K1A1/A2 gun), hybrid torsion-bar + hydropneumatic suspension, 6 dual rubber-tyred road wheels
    // per side, rear drive sprocket, front idler, M1 Abrams-derived hull/turret family.
    // UNCERTAIN/ESTIMATED (no published figures found - flagged for correction once you can compare
    // screenshots to references): exact glacis angle, turret external length/width, road wheel
    // spacing and diameter, track width and gauge, gun's barrel-forward-of-mantlet length. These are
    // currently derived by scaling the M1 Abrams hull/turret station tables in this file by the K1's
    // known length/width ratios (K1_LEN_RATIO, K1_WID_RATIO, K1_HGT_RATIO below) rather than invented
    // from scratch - adjust the ratios first if the silhouette is close but not quite right.
    const K1_LEN_RATIO=7.48/7.93, K1_WID_RATIO=3.60/3.66, K1_HGT_RATIO=0.93, K1_TURRET_LEN_RATIO=0.90, K1_TURRET_HGT_RATIO=0.72;
    // 2nd pass (after first screenshots): turret read as a tall, boxy/pyramidal block in every angle sent back -
    // was compressing turret LENGTH hard (0.78) while barely touching its HEIGHT (was inheriting the hull's 0.93),
    // which stubbed it out instead of making it low and long like a real MBT turret. Length ratio raised,
    // and turret height now has its own, much-flatter ratio instead of reusing the hull's.
    const ku=m=>m/1.30;
    // Real-metre helpers for the M1 (group scale 1.30 / 1.30 / 1.40; the hull heights are squashed by 1/1.12 about y=0.28)
    const M1_ZK=1.07; // hull, running gear and turret are stretched 7% lengthwise (longer, lower Abrams)
    const M1_HSQ=1.18; // hull heights above the belly are squashed by this factor (the hull is not lifted, see hullLift): ~15% lower hull
    const mX=m=>m/1.3, mZ=m=>m*M1_ZK/1.4, mY=m=>m/1.3, mYh=m=>0.28+((m/1.3)-0.28)/M1_HSQ; // mY: real metres -> local units; mYh: the same for hull parts, squashed
    // Composite plate: ke = RHA-equivalent vs kinetic at the plate's design angle, ce = vs shaped charge
    const comp=(ke,ce,refDeg,zone)=>({t:ke,ke,ce,ref:refDeg*Math.PI/180,comp:true,zone});
    const blowOffPanels = []; // M1 bustle roof blow-out panels
    const addOnPanels = []; // destructible spaced-armour modules bolted to the Leopard 1A5 turret front

    // ---- T-72B helpers: everything is authored in real metres and divided by the 1.3 group scale. ----

    // ---- Challenger 1 helpers: authored in real metres; the group scale is (1.30, 1.30, 1.38). ----
    const c1x=m=>m/1.3, c1y=m=>m/1.3, c1z=m=>m/1.38;
    const b1=(par,mat,x,y,z,w,h,d,rx=0,ry=0,rz=0)=>box(par,mat,c1x(x),c1y(y),c1z(z),c1x(w),c1y(h),c1z(d),rx,ry,rz);
    const cy1=(par,mat,rt,rb,len,x,y,z,rx=0,ry=0,rz=0,seg=14)=>addMesh(new THREE.CylinderGeometry(c1x(rt),c1x(rb),(Math.abs(rx-Math.PI/2)<0.01?c1z(len):c1y(len)),seg),mat,par,c1x(x),c1y(y),c1z(z),rx,ry,rz);
    // Box-projected texture coordinates for a non-indexed triangle mesh: without them the camouflage smears into streaks across big flat faces.
    const withUV=(g,k=0.45)=>{
      const p=g.attributes.position, n=p.count, uv=new Float32Array(n*2);
      for(let i=0;i<n;i+=3){
        const ax=p.getX(i),ay=p.getY(i),az=p.getZ(i), bx=p.getX(i+1)-ax,by=p.getY(i+1)-ay,bz=p.getZ(i+1)-az, cx=p.getX(i+2)-ax,cy=p.getY(i+2)-ay,cz=p.getZ(i+2)-az;
        const nx=Math.abs(by*cz-bz*cy), ny=Math.abs(bz*cx-bx*cz), nz=Math.abs(bx*cy-by*cx);
        for(let j=0;j<3;j++){
          const x=p.getX(i+j), y=p.getY(i+j), z=p.getZ(i+j);
          const u=ny>=nx&&ny>=nz?x:nx>=nz?z:x, v=ny>=nx&&ny>=nz?z:nx>=nz?y:y;
          uv[(i+j)*2]=u*k; uv[(i+j)*2+1]=v*k;
        }
      }
      g.setAttribute('uv',new THREE.BufferAttribute(uv,2)); return g;
    };
    let basketMat=null;
    // Wire-mesh stowage basket (the Challenger's bustle racks): a bar frame with a translucent mesh fill and some rolled kit inside.
    const basket1=(par,x,y,z,w,h,d,kit)=>{
      if(!basketMat) basketMat=new THREE.MeshStandardMaterial({color:0x1b1d18,roughness:1,transparent:true,opacity:0.45,depthWrite:false});
      const t=0.03, bm=darkMat;
      [-1,1].forEach(sy=>[-1,1].forEach(sz=>b1(par,bm,x,y+sy*h/2,z+sz*d/2,w,t,t)));
      [-1,1].forEach(sx=>[-1,1].forEach(sz=>b1(par,bm,x+sx*w/2,y,z+sz*d/2,t,h,t)));
      [-1,1].forEach(sx=>[-1,1].forEach(sy=>b1(par,bm,x+sx*w/2,y+sy*h/2,z,t,t,d)));
      for(let k=1;k<4;k++) b1(par,bm,x-w/2+w*k/4,y,z+d/2,t*0.6,h,t*0.6);
      const m=new THREE.Mesh(new THREE.BoxGeometry(c1x(w*0.98),c1y(h*0.98),c1z(d*0.98)),basketMat);
      m.position.set(c1x(x),c1y(y),c1z(z)); par.add(m);
      if(kit) cy1(par,detailMat,h*0.26,h*0.26,w*0.8,x,y-h*0.18,z,0,0,Math.PI/2,10);   // rolled camouflage net / bedding roll
    };
    const u72=m=>m/1.3;
    const b72=(par,mat,x,y,z,w,h,d,rx=0,ry=0,rz=0)=>box(par,mat,u72(x),u72(y),u72(z),u72(w),u72(h),u72(d),rx,ry,rz);
    const c72=(par,mat,rt,rb,len,x,y,z,rx=0,ry=0,rz=0,seg=14)=>addMesh(new THREE.CylinderGeometry(u72(rt),u72(rb),u72(len),seg),mat,par,u72(x),u72(y),u72(z),rx,ry,rz);
    // Kontakt-1 explosive reactive armour brick: a destructible add-on module. HEAT / HESH / HE rounds detonate on it and
    // blow it off the tank (the existing add-on panel logic); kinetic rounds pass straight through it, as in real life.
    let eraMat=null;
    function placeEra(parent,p,n,upHint,w,h,d,id){ // metres; p = point on the surface, n = outward normal
      if(!eraMat){ eraMat=hullMat.clone(); eraMat.color=hullMat.color.clone().multiplyScalar(0.84); }
      const nz=new THREE.Vector3(n[0],n[1],n[2]).normalize(), up=new THREE.Vector3(upHint[0],upHint[1],upHint[2]);
      const ya=up.clone().sub(nz.clone().multiplyScalar(up.dot(nz))).normalize(), xa=new THREE.Vector3().crossVectors(ya,nz).normalize();
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(u72(w),u72(h),u72(d)),eraMat);
      mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xa,ya,nz));
      mesh.position.set(u72(p[0]+nz.x*d/2),u72(p[1]+nz.y*d/2),u72(p[2]+nz.z*d/2));
      mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh);
      const cover=new THREE.Mesh(new THREE.BoxGeometry(u72(w*0.78),u72(h*0.78),u72(0.012)),darkMat);   // bolted cover plate
      cover.position.z=u72(d/2+0.004); mesh.add(cover);
      mesh.userData.addOnPanel=true; mesh.userData.armorPlate=true; mesh.userData.armorThicknessMM=60; mesh.userData.armorZone='era';
      const rec={id,mesh,scar:null,destroyed:false}; mesh.userData.panelRef=rec; addOnPanels.push(rec); armorMeshes.push(mesh);
      return mesh;
    }
    // Steep wedge-shaped Kontakt-1 cover box (as on the real turret): vertical rear face, a steep slope falling toward `fwd`.
    // Metres; the base sits on the surface at p, hgt is measured along the outward normal n. Blown off by HEAT/HESH/HE like a brick.
    function placeWedge(parent,p,n,fwd,w,len,hgt,id,tri){
      if(!eraMat){ eraMat=hullMat.clone(); eraMat.color=hullMat.color.clone().multiplyScalar(0.84); }
      const ny=new THREE.Vector3(n[0],n[1],n[2]).normalize(), f=new THREE.Vector3(fwd[0],fwd[1],fwd[2]);
      const nz=f.clone().sub(ny.clone().multiplyScalar(f.dot(ny))).normalize(), nx=new THREE.Vector3().crossVectors(ny,nz).normalize();
      const hw=w/2, hl=len/2, pos=[], uv=[];
      let A=[-hw,0,-hl],B=[hw,0,-hl],C=[hw,0,hl],D=[-hw,0,hl],E=[-hw,hgt,-hl],F=[hw,hgt,-hl], faces, ctr;
      if(tri){
        // Triangular prism: an isosceles/equilateral triangle in the (outward, fwd) plane, base (length `len`) on the surface, apex `hgt` out.
        E=[-hw,hgt,0]; F=[hw,hgt,0];
        faces=[[A,B,C],[A,C,D],[A,B,F],[A,F,E],[D,C,F],[D,F,E],[A,E,D],[B,C,F]]; ctr=[0,hgt/3,0];
      } else {
        faces=[[A,B,C],[A,C,D],[A,E,F],[A,F,B],[E,D,C],[E,C,F],[A,D,E],[B,F,C]]; ctr=[0,hgt/3,-hl/3];
      }
      faces.forEach(([p0,q0,r0])=>{
        let q=q0, r=r0;
        const e1=[q[0]-p0[0],q[1]-p0[1],q[2]-p0[2]], e2=[r[0]-p0[0],r[1]-p0[1],r[2]-p0[2]];
        const nn=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];
        const cx=(p0[0]+q[0]+r[0])/3-ctr[0], cy=(p0[1]+q[1]+r[1])/3-ctr[1], cz=(p0[2]+q[2]+r[2])/3-ctr[2];
        if(nn[0]*cx+nn[1]*cy+nn[2]*cz<0){ const t=q; q=r; r=t; }   // keep every face winding outward (shell hit tests read it)
        [p0,q,r].forEach(v=>{ pos.push(u72(v[0]),u72(v[1]),u72(v[2])); uv.push(v[0]/w+0.5,v[2]/len+0.5); });
      });
      const g=new THREE.BufferGeometry();
      g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.computeVertexNormals();
      const mesh=new THREE.Mesh(g,eraMat);
      mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(nx,ny,nz));
      mesh.position.set(u72(p[0]-ny.x*0.01),u72(p[1]-ny.y*0.01),u72(p[2]-ny.z*0.01));
      mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh);
      // Visible armour design: a welded centre seam along the apex ridge and a bolted mounting flange down both
      // long edges of the base, so each pack reads as a riveted steel ERA container rather than a bare wedge.
      if(tri){
        addMesh(new THREE.BoxGeometry(u72(w*0.92),u72(0.022),u72(0.05)),darkMat,mesh,0,u72(hgt),0);
        [-1,1].forEach(xs=>[-0.68,-0.22,0.22,0.68].forEach(zf=>
          addMesh(new THREE.CylinderGeometry(u72(0.016),u72(0.016),u72(0.014),8),steelMat,mesh,u72(xs*hw*0.95),u72(0.012),u72(zf*hl))
        ));
      }
      mesh.userData.addOnPanel=true; mesh.userData.armorPlate=true; mesh.userData.armorThicknessMM=60; mesh.userData.armorZone='era';
      const rec={id,mesh,scar:null,destroyed:false}; mesh.userData.panelRef=rec; addOnPanels.push(rec); armorMeshes.push(mesh);
      return mesh;
    }
    if(isSturer) tank.scale.set(1.35,1.35,1.45); // Keep the larger body and stretch its long Panzer IV hull further.
    if(isIS7) tank.scale.set(1.28,1.28,1.38); // Large Soviet heavy tank
    if(isFV4005) tank.scale.set(1.30,1.30,1.40); // Centurion-sized running gear with an oversized Stage II turret.
    if(isAMX50) tank.scale.set(1.3,1.3,1.35); // Low, long French heavy: 3.1 m wide, 7.3 m hull
    if(isT54E1) tank.scale.set(1.28,1.28,1.35); // M48-based medium tank
    if(isM1) tank.scale.set(1.30,1.30,1.40); // 3.66 m wide, 7.93 m hull
    if(isT72) tank.scale.set(1.30,1.30,1.30); // uniform: 1 world unit = 1 m of real tank (3.37 m over the tracks, 6.95 m hull)
    if(isLeo) tank.scale.set(1.26,1.26,1.35); // Leopard 1: low, long 3.25 m wide hull
    if(isChallenger1) tank.scale.set(1.30,1.30,1.38); // Challenger 1: 3.52 m wide, ~8.3 m hull, Horstmann-sprung Chieftain-family chassis
    if(isK1) tank.scale.set(1.30,1.30,1.30); // uniform, 1 world unit = 1 m (see ku() above): 3.60 m wide, 7.48 m hull
    // Hull armor + hull-mounted details live in their own group so the hull can be
    // stretched a bit taller (anchored at the belly, so it stays seated on the tracks).
    const hullGroup = new THREE.Group();
    tank.add(hullGroup);
    const hullBaseY = isTiger ? 0.14 : 0.28; // matches each hull's belly/bottom y
    const hullLift = (isM1||isT72||isK1) ? 1.0 : 1.12; // slightly taller hull for the other tanks; the M1/K1 stay as authored (heights already set directly in real metres)
    hullGroup.scale.y = hullLift;
    // K1: the hull and turret ride lower on the track run (equivalent to raising the tracks up into the hull, but the wheels stay on the ground).
    const K1_DROP_M = 0.25, K1_BODY_DROP = isK1 ? ku(K1_DROP_M) : 0;
    hullGroup.position.y = hullBaseY * (1 - hullLift) - K1_BODY_DROP;
    // Fine, low-contrast paint wear gives the simple geometry some material
    // character without adding external assets or changing armor behavior.
    const PS=512;
    const paintCanvas=document.createElement('canvas'); paintCanvas.width=paintCanvas.height=PS;
    const paintCtx=paintCanvas.getContext('2d');
    paintCtx.fillStyle='#ffffff'; paintCtx.fillRect(0,0,PS,PS);
    const R=(a,b)=>a+Math.random()*(b-a);
    // Broad grime / faded paint patches.
    for(let i=0;i<90;i++){
      const x=R(0,PS),y=R(0,PS),r=R(14,60);
      const st=paintCtx.createRadialGradient(x,y,1,x,y,r);
      const dark=Math.random()<0.75;
      st.addColorStop(0,dark?'rgba(58,46,30,'+R(0.12,0.26)+')':'rgba(255,248,230,0.14)'); st.addColorStop(1,'rgba(0,0,0,0)');
      paintCtx.fillStyle=st; paintCtx.fillRect(x-r,y-r,r*2,r*2);
    }
    // Fine speckle: dirt grains and paint flecks.
    for(let i=0;i<2600;i++){
      const x=R(0,PS),y=R(0,PS),r=R(0.4,2.4);
      paintCtx.fillStyle=Math.random()<0.65?'rgba(34,27,18,'+R(0.1,0.28)+')':'rgba(255,255,255,0.1)';
      paintCtx.beginPath(); paintCtx.ellipse(x,y,r,r*R(0.3,0.9),R(0,3.14),0,6.28); paintCtx.fill();
    }
    // Rain streaks running down the plates.
    for(let i=0;i<110;i++){
      const x=R(0,PS),y=R(0,PS),len=R(18,90);
      const sg=paintCtx.createLinearGradient(x,y,x,y+len);
      sg.addColorStop(0,'rgba(40,30,20,0)'); sg.addColorStop(0.2,'rgba(40,30,20,'+R(0.12,0.26)+')'); sg.addColorStop(1,'rgba(40,30,20,0)');
      paintCtx.fillStyle=sg; paintCtx.fillRect(x,y,R(1,3.5),len);
    }
    // Chipped paint showing bare steel and rust at the edges.
    for(let i=0;i<150;i++){
      const x=R(0,PS),y=R(0,PS),len=R(3,16);
      paintCtx.strokeStyle=Math.random()<0.6?'rgba(88,82,76,0.5)':'rgba(120,62,28,0.42)'; paintCtx.lineWidth=R(0.6,1.8);
      paintCtx.beginPath(); paintCtx.moveTo(x,y); paintCtx.lineTo(x+R(-1,1)*len,y+R(-0.4,0.6)*len); paintCtx.stroke();
    }
    // Oil / rust stains.
    for(let i=0;i<26;i++){
      const x=R(0,PS),y=R(0,PS),r=R(5,16),st=paintCtx.createRadialGradient(x,y,0,x,y,r);
      st.addColorStop(0,Math.random()<0.5?'rgba(20,16,12,0.34)':'rgba(110,56,24,0.3)'); st.addColorStop(1,'rgba(0,0,0,0)');
      paintCtx.fillStyle=st; paintCtx.fillRect(x-r,y-r,r*2,r*2);
    }
    const paintTexture=new THREE.CanvasTexture(paintCanvas); paintTexture.encoding=THREE.sRGBEncoding;
    paintTexture.wrapS=paintTexture.wrapT=THREE.RepeatWrapping; paintTexture.anisotropy=16;
    let paintBump=null;
    if(isIS7){
      const bumpCanvas=document.createElement('canvas');bumpCanvas.width=bumpCanvas.height=256;
      const bumpCtx=bumpCanvas.getContext('2d'),image=bumpCtx.createImageData(256,256);
      for(let i=0;i<image.data.length;i+=4){const value=116+Math.random()*24;image.data[i]=image.data[i+1]=image.data[i+2]=value;image.data[i+3]=255;}
      bumpCtx.putImageData(image,0,0);
      paintBump=new THREE.CanvasTexture(bumpCanvas);paintBump.wrapS=paintBump.wrapT=THREE.RepeatWrapping;
    }
    const hullMat = new THREE.MeshStandardMaterial({color:bodyColor,map:paintTexture,bumpMap:paintBump,bumpScale:isIS7?0.028:0,roughness:isIS7?0.86:0.96,metalness:isIS7?0.12:0.08,side:THREE.DoubleSide,flatShading:!isSturer});
    const turretMat = new THREE.MeshStandardMaterial({color:turretColor,map:paintTexture,bumpMap:paintBump,bumpScale:isIS7?0.028:0,roughness:isIS7?0.82:0.94,metalness:isIS7?0.14:0.07,side:THREE.DoubleSide,flatShading:!(isSturer||isIS7)});
    const darkMat = new THREE.MeshStandardMaterial({color:0x25282b, roughness:0.96});
    const steelMat = new THREE.MeshStandardMaterial({color:0x53575a, metalness:0.35, roughness:0.72});
    const detailMat = new THREE.MeshStandardMaterial({color:0x3c4144, roughness:0.9});
    const armorMeshes = [];
    function addMesh(geometry, material, parent, x, y, z, rx=0, ry=0, rz=0){
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x,y,z); mesh.rotation.set(rx,ry,rz);
      mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
      return mesh;
    }
    function box(parent, material, x,y,z,w,h,d,rx=0,ry=0,rz=0){
      return addMesh(new THREE.BoxGeometry(w,h,d),material,parent,x,y,z,rx,ry,rz);
    }
    function beamBetween(parent, material, a, b, radius=0.025, radialSegments=8){
      const start=new THREE.Vector3(...a), end=new THREE.Vector3(...b);
      const delta=end.clone().sub(start);
      const mesh=addMesh(new THREE.CylinderGeometry(radius,radius,delta.length(),radialSegments),material,parent,
        (start.x+end.x)/2,(start.y+end.y)/2,(start.z+end.z)/2);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
      return mesh;
    }
    function armorPlate(parent, vertices, material, thicknessMM, zone){
      // Every armor face is its own flat mesh so future shell raycasts can read
      // the hit normal, armor zone and nominal thickness from the intersected plate.
      const positions = vertices.flat();
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
      // Armor plates are custom polygons, so give them planar UVs for the paint wear.
      const edgeA=new THREE.Vector3(...vertices[1]).sub(new THREE.Vector3(...vertices[0]));
      const edgeB=new THREE.Vector3(...vertices[2]).sub(new THREE.Vector3(...vertices[0]));
      const normal=edgeA.cross(edgeB).normalize();
      const abs=[Math.abs(normal.x),Math.abs(normal.y),Math.abs(normal.z)];
      const axes=abs[1]>=abs[0]&&abs[1]>=abs[2]?[0,2]:abs[0]>=abs[2]?[1,2]:[0,1];
      const minU=Math.min(...vertices.map(v=>v[axes[0]])),maxU=Math.max(...vertices.map(v=>v[axes[0]]));
      const minV=Math.min(...vertices.map(v=>v[axes[1]])),maxV=Math.max(...vertices.map(v=>v[axes[1]]));
      const uv=[];
      vertices.forEach(v=>uv.push((v[axes[0]]-minU)/Math.max(0.001,maxU-minU),(v[axes[1]]-minV)/Math.max(0.001,maxV-minV)));
      geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
      const indices=[];
      for(let i=1;i<vertices.length-1;i++) indices.push(0,i,i+1);
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      const mesh = addMesh(geometry,material,parent,0,0,0);
      if(isSturer) mesh.receiveShadow = false; // Avoid diagonal self-shadow artifacts across the large flat armor plates.
      mesh.userData.armorPlate = true;
      mesh.userData.armorThicknessMM = thicknessMM;
      mesh.userData.armorZone = zone;
      armorMeshes.push(mesh);
      return mesh;
    }
    function armorBox(parent, material, x,y,z,w,h,d, thicknessMM, zone, rx=0,ry=0,rz=0){
      const mesh = box(parent,material,x,y,z,w,h,d,rx,ry,rz);
      mesh.userData.armorPlate = true;
      mesh.userData.armorThicknessMM = thicknessMM;
      mesh.userData.armorZone = zone;
      armorMeshes.push(mesh);
      return mesh;
    }
    function markArmor(mesh, byNormal){ mesh.userData.armorPlate=true; mesh.userData.armorByNormal=byNormal; armorMeshes.push(mesh); return mesh; }
    function turretByNormal(th){
      return n=>{
        if(n.y>0.8) return {t:th.roof,zone:'turret-roof'};
        if(n.y<-0.8) return {t:th.belly,zone:'turret-belly'};
        if(n.z>0.5) return {t:th.front,zone:'turret-front'};
        if(n.z<-0.5) return {t:th.rear,zone:'turret-rear'};
        return {t:th.side,zone:'turret-side'};
      };
    }
    function pantherHullByNormal(n){
      if(n.y>0.9) return {t:16,zone:'hull-roof'};
      if(n.y<-0.9) return {t:16,zone:'hull-belly'};
      if(n.z>0.4) return n.y>0 ? {t:80,zone:'hull-glacis'} : {t:60,zone:'hull-nose'};
      if(n.z<-0.4) return {t:40,zone:'hull-rear'};
      return {t:45,zone:'hull-side'};
    }
    function buildFacetedTurret(parent, spec, material, thickness){
      const shell=new THREE.MeshStandardMaterial({color:material.color.getHex(),roughness:0.86});
      const shellMesh = !spec.noShell ? addMesh(new THREE.CylinderGeometry(spec.topHalf,spec.bottomHalf,spec.topY-spec.bottomY,36),shell,parent,
        0,(spec.topY+spec.bottomY)/2,(spec.rearBottom+spec.frontBottom)/2) : null;
      if(shellMesh) markArmor(shellMesh,turretByNormal(thickness));
      material=new THREE.MeshBasicMaterial({visible:false,side:THREE.DoubleSide});
      // frontTopHalf lets the front plate's top edge pull in tighter than the rear/sides,
      // for turrets (like the Panther) whose mantlet tapers inward more than the rest.
      const frontTopHalf = spec.frontTopHalf !== undefined ? spec.frontTopHalf : spec.topHalf;
      const bL=[-spec.bottomHalf,spec.bottomY,spec.rearBottom];
      const bR=[ spec.bottomHalf,spec.bottomY,spec.rearBottom];
      const bRF=[ spec.bottomHalf,spec.bottomY,spec.frontBottom];
      const bLF=[-spec.bottomHalf,spec.bottomY,spec.frontBottom];
      const tL=[-spec.topHalf,spec.topY,spec.rearTop];
      const tR=[ spec.topHalf,spec.topY,spec.rearTop];
      const tRF=[ frontTopHalf,spec.topY,spec.frontTop];
      const tLF=[-frontTopHalf,spec.topY,spec.frontTop];
      armorPlate(parent,[bLF,bRF,tRF,tLF],material,thickness.front,'turret-front');
      armorPlate(parent,[bR,bL,tL,tR],material,thickness.rear,'turret-rear');
      armorPlate(parent,[bL,bLF,tLF,tL],material,thickness.side,'turret-side');
      armorPlate(parent,[bRF,bR,tR,tRF],material,thickness.side,'turret-side');
      armorPlate(parent,[tL,tLF,tRF,tR],material,thickness.roof,'turret-roof');
      armorPlate(parent,[bL,bR,bRF,bLF],material,thickness.belly,'turret-belly');
    }
    // Six separately raycastable hull plates. The Panther has a steep glacis;
    // Tiger 131 keeps a much squarer nose and wider side armor.
    function makeHull(){
      const tank = hullGroup; // shadow: hull plates get stretched with hullGroup, not the outer rigid tank
      if(isIS7){
        // Pike-nose hull: a narrow tub between the tracks, a wide upper hull whose vertical
        // side plates cover the tops of the road wheels, a V-shaped pike glacis (~65 deg)
        // and a long flat deck. Each ring is a pentagon: rear corners, shoulders, nose point.
        const yH=1.05;
        const ring=(y,w,zr,zs,zn)=>[[-w,y,zr],[w,y,zr],[w,y,zs],[0,y,zn],[-w,y,zs]];
        const rings=[
          ring(0.24,0.95,-2.7,1.9,2.15),
          ring(0.66,0.95,-2.8,2.0,2.45),
          ring(0.66,1.72,-3.0,1.55,2.62),
          ring(0.92,1.72,-2.95,1.24,2.27),
          ring(yH,1.5,-2.84,0.86,1.78)
        ];
        const pos=[], tri=(u,v,w)=>pos.push(...u,...v,...w);
        for(let k=0;k<rings.length-1;k++){
          const A=rings[k], B=rings[k+1];
          for(let e=0;e<A.length;e++){const f=(e+1)%A.length; tri(A[e],A[f],B[f]); tri(A[e],B[f],B[e]);}
        }
        [rings[0],rings[rings.length-1]].forEach(R=>{
          const c=[0,R[0][1],R.reduce((m,v)=>m+v[2],0)/R.length];
          for(let e=0;e<R.length;e++) tri(c,R[e],R[(e+1)%R.length]);
        });
        const hg=new THREE.BufferGeometry();
        hg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); hg.computeVertexNormals();
        markArmor(addMesh(hg,hullMat,tank,0,0,0),n=>{
          if(n.y>0.9) return {t:30,zone:'hull-roof'};
          if(n.y<-0.9) return {t:20,zone:'hull-belly'};
          if(n.z>0.35) return n.y>0.25?{t:150,zone:'hull-pike'}:{t:120,zone:'hull-lower-glacis'};
          if(n.z<-0.5) return {t:60,zone:'hull-rear'};
          return n.y>-0.05?{t:150,zone:'hull-side'}:{t:100,zone:'hull-side'};
        });
        [-1,1].forEach(sd=>{
          // Plate seams on the sloped shoulders, a grab rail and a ledge line along the side.
          [-2.4,-1.4,-0.4,0.6,1.2].forEach(z=>box(tank,detailMat,sd*1.725,0.79,z,0.025,0.26,0.04));
          beamBetween(tank,steelMat,[sd*1.58,0.99,-2.6],[sd*1.58,0.99,0.5],0.022,6);
          box(tank,detailMat,sd*1.735,0.665,0,0.04,0.05,5.6);
          // External fuel drums on the rear deck shoulders, strapped on.
          addMesh(new THREE.CylinderGeometry(0.15,0.15,1.15,14),darkMat,tank,sd*1.18,1.1,-2.0,Math.PI/2,0,0);
          [-2.35,-1.65].forEach(z=>box(tank,steelMat,sd*1.18,1.1,z,0.34,0.04,0.045));
          // Tow eyes and guarded headlamps on the nose.
          addMesh(new THREE.TorusGeometry(0.12,0.032,6,12),steelMat,tank,sd*0.8,0.5,2.04,Math.PI/2,0,0);
          addMesh(new THREE.CylinderGeometry(0.1,0.115,0.1,12),darkMat,tank,sd*1.05,0.99,1.2,Math.PI/2,0,0);
          box(tank,detailMat,sd*1.05,1.06,1.18,0.26,0.04,0.14);
        });
        // Driver's hatch and periscopes on the glacis, left of the pike seam.
        box(tank,detailMat,-0.5,0.99,1.62,0.44,0.06,0.5,0.43);
        box(tank,steelMat,-0.5,1.03,1.62,0.28,0.025,0.3,0.43);
        [-0.78,-0.22].forEach(x=>box(tank,darkMat,x,0.97,1.42,0.12,0.07,0.1,0.43));
        // Engine deck louvres, access hatches and lifting eyes on the long rear deck.
        for(let i=0;i<6;i++){
          box(tank,darkMat,0,yH+0.02,-2.62+i*0.23,1.45,0.04,0.12);
          box(tank,steelMat,0,yH+0.05,-2.62+i*0.23,1.35,0.018,0.025);
        }
        [-0.62,0.62].forEach(x=>{
          box(tank,detailMat,x,yH+0.04,-1.0,0.5,0.04,0.55);
        });

        // ---- Added hull detail ----
        // Spare track links stacked on the pike glacis (right of the seam), lying on the slope.
        [0.4,0.62,0.84].forEach(x=>{
          for(let r=0;r<2;r++) box(tank,detailMat,x,1.0,1.46+r*0.17,0.18,0.07,0.13,0.255,0,0);
          box(tank,steelMat,x,1.047,1.55,0.15,0.02,0.34,0.255,0,0);
        });
        [-1,1].forEach(sd=>{
          // Rear tow lugs bolted to the rear plate.
          box(tank,steelMat,sd*0.95,0.8,-3.0,0.16,0.16,0.12);
          addMesh(new THREE.CylinderGeometry(0.045,0.045,0.18,8),darkMat,tank,sd*0.95,0.8,-3.07,Math.PI/2,0,0);
        });
        // Tool box and shovel on the right side, tow cable clamps on the left.
        box(tank,detailMat,1.79,0.78,-1.0,0.12,0.2,0.7);
        box(tank,steelMat,1.86,0.78,-1.0,0.02,0.05,0.5);
        box(tank,steelMat,-1.77,0.79,0.2,0.05,0.06,0.5);
        beamBetween(tank,steelMat,[-1.75,0.79,-0.35],[-1.75,0.79,0.85],0.014,6);
        box(tank,steelMat,-1.77,0.79,0.9,0.05,0.16,0.12);
        [-0.9,-0.4,0.1,0.55].forEach(z=>box(tank,darkMat,-1.78,0.79,z,0.04,0.045,0.12));
        // Rear fenders-top ribs and a mud-guard lip along the glacis shoulders.
        [-1,1].forEach(sd=>box(tank,detailMat,sd*1.0,1.065,-2.95,0.5,0.03,0.06));
        // Horn and front lights guards.
        box(tank,darkMat,0.55,1.07,0.95,0.08,0.06,0.18);
        return;
      }
      if(isSturer){
        // Sturer Emil hull: Panzer IV/Panther-style lower hull + tall fixed superstructure
        // Lower hull (similar to Panther but slightly narrower for 35-ton vehicle)
        const yB=0.28, yH=1.18; // belly y, hull top y
        const hW=1.25, hF=3.05, hR=-2.8; // long Panzer IV-derived hull
        // Panther-style steep glacis lower hull
        const bfl=[-hW,yB,hF], bfr=[hW,yB,hF];
        const brl=[-hW,yB,hR], brr=[hW,yB,hR];
        const tfl=[-hW,yH,hF*0.82], tfr=[hW,yH,hF*0.82];
        const trl=[-hW,yH,hR], trr=[hW,yH,hR];
        // Lower hull plates (50mm armor)
        armorPlate(tank,[bfl,bfr,tfr,tfl],hullMat,50,'hull-glacis');   // front glacis
        armorPlate(tank,[brr,brl,trl,trr],hullMat,50,'hull-rear');      // rear
        armorPlate(tank,[brl,bfl,tfl,trl],hullMat,50,'hull-side');      // left side
        armorPlate(tank,[bfr,brr,trr,tfr],hullMat,50,'hull-side');      // right side
        armorPlate(tank,[trl,tfl,tfr,trr],hullMat,16,'hull-roof');      // hull roof/deck
        armorPlate(tank,[brl,brr,bfr,bfl],hullMat,16,'hull-belly');     // belly
        // Fixed, open fighting compartment. Its tall armor plates lean inward
        // toward the open roof instead of forming a closed box.
        const csY0=yH, csY1=2.36, csYRear=1.96;
        const csW=1.18, csTopW=0.98, csF=1.55, csTopF=1.28, csR=-2.25, csTopR=-1.96;
        const openingHalfW=0.34, openingLow=1.58, openingHigh=1.95;
        const frontZ=y=>csF+(csTopF-csF)*(y-csY0)/(csY1-csY0);
        const rearZ=y=>csR+(csTopR-csR)*(y-csY0)/(csYRear-csY0);
        const topYAtZ=z=>csY1+(csYRear-csY1)*(csTopF-z)/(csTopF-csTopR);
        const sideAtY=(y,topY=csY1)=>csW+(csTopW-csW)*(y-csY0)/(topY-csY0);
        const sidePlateMat=new THREE.MeshStandardMaterial({color:0x555c60,roughness:0.9,side:THREE.DoubleSide,flatShading:false});
        // Four 50 mm sections leave a real aperture for the gun and mantlet.
        armorPlate(tank,[[-csW,csY0,frontZ(csY0)],[-openingHalfW,openingLow,frontZ(openingLow)],[-openingHalfW,openingHigh,frontZ(openingHigh)],[-csTopW,csY1,frontZ(csY1)]],hullMat,50,'casemate-front');
        armorPlate(tank,[[openingHalfW,openingLow,frontZ(openingLow)],[csW,csY0,frontZ(csY0)],[csTopW,csY1,frontZ(csY1)],[openingHalfW,openingHigh,frontZ(openingHigh)]],hullMat,50,'casemate-front');
        armorPlate(tank,[[-openingHalfW,csY0,frontZ(csY0)],[openingHalfW,csY0,frontZ(csY0)],[openingHalfW,openingLow,frontZ(openingLow)],[-openingHalfW,openingLow,frontZ(openingLow)]],hullMat,50,'casemate-front');
        armorPlate(tank,[[-openingHalfW,openingHigh,frontZ(openingHigh)],[openingHalfW,openingHigh,frontZ(openingHigh)],[csTopW,csY1,frontZ(csY1)],[-csTopW,csY1,frontZ(csY1)]],hullMat,50,'casemate-front');
        // Raised cheek plates frame the gun opening and give the mantlet a solid seat.
        [-1,1].forEach(sd=>{
          armorPlate(tank,[[sd*0.39,1.48,frontZ(1.48)+0.025],[sd*0.82,1.43,frontZ(1.43)+0.025],
            [sd*0.82,2.08,frontZ(2.08)+0.025],[sd*0.39,2.03,frontZ(2.03)+0.025]],sidePlateMat,60,'casemate-front-cheek');
        });
        // Rear wall and the two broad, inward-sloping side armor planes.
        armorPlate(tank,[[-csW,csY0,csR],[csW,csY0,csR],[csTopW,csYRear,csTopR],[-csTopW,csYRear,csTopR]],hullMat,50,'casemate-rear');
        // The roofline slopes down toward the rear, like the fixed Emil casemate.
        armorPlate(tank,[[-csW,csY0,csF],[-csW,csY0,csR],[-csTopW,csYRear,csTopR],[-csTopW,csY1,csTopF]],hullMat,50,'casemate-side');
        armorPlate(tank,[[csW,csY0,csR],[csW,csY0,csF],[csTopW,csY1,csTopF],[csTopW,csYRear,csTopR]],hullMat,50,'casemate-side');
        // Raised side armor panels follow the sloped roofline and break up the long wall.
        const panelLow=1.27, panelBounds=[-1.72,-0.77,0.18,1.08];
        [-1,1].forEach(sd=>{
          for(let i=0;i<panelBounds.length-1;i++){
            const z0=panelBounds[i],z1=panelBounds[i+1], y0=topYAtZ(z0)-0.13,y1=topYAtZ(z1)-0.13;
            armorPlate(tank,[[sd*(sideAtY(panelLow)+0.025),panelLow,z0],[sd*(sideAtY(panelLow)+0.025),panelLow,z1],
              [sd*(sideAtY(y1,topYAtZ(z1))+0.025),y1,z1],[sd*(sideAtY(y0,topYAtZ(z0))+0.025),y0,z0]],
              i%2? hullMat:sidePlateMat,50,'casemate-side-panel');
          }
        });
        // Dark fighting-compartment floor and low inner ledges make the open roof readable.
        const interiorMat=new THREE.MeshStandardMaterial({color:0x303638,roughness:1,side:THREE.DoubleSide});
        box(tank,interiorMat,0,csY0+0.035,(csF+csR)/2,1.92,0.035,3.55);
        box(tank,detailMat,-0.94,csY0+0.16,-0.18,0.12,0.22,2.0);
        box(tank,detailMat, 0.94,csY0+0.16,-0.18,0.12,0.22,2.0);
        // Narrow top rails and small vision ports break up the flat armor sides.
        [-1,1].forEach(sd=>{
          const roofSlope=-Math.atan2(csY1-csYRear,csTopF-csTopR);
          box(tank,steelMat,sd*0.97,(csY1+csYRear)/2-0.025,(csTopF+csTopR)/2,0.055,0.055,3.05,roofSlope);
          [-1.55,-0.75,0.1,0.8,1.12].forEach(z=>{
            const portY=topYAtZ(z)-0.38;
            addMesh(new THREE.CylinderGeometry(0.075,0.075,0.045,12),detailMat,tank,sd*1.04,portY,z,0,0,Math.PI/2);
            addMesh(new THREE.CylinderGeometry(0.035,0.035,0.05,10),darkMat,tank,sd*1.07,portY,z,0,0,Math.PI/2);
          });
        });
        // Ready ammunition stowed low along both inner walls of the open compartment.
        [-1,1].forEach(sd=>[-1.45,-0.91,-0.37].forEach(z=>{
          addMesh(new THREE.CylinderGeometry(0.105,0.105,0.56,12),steelMat,tank,sd*0.64,csY0+0.31,z,Math.PI/2,0,0);
          addMesh(new THREE.CylinderGeometry(0.112,0.112,0.055,12),detailMat,tank,sd*0.64,csY0+0.31,z+0.22,Math.PI/2,0,0);
        }));
        return;
      }
      if(isTiger){
        // Two boxes: a wide, low lower box that covers the tracks, and a smaller,
        // slightly tapered box on top of it. The turret sits on the small box.
        const L=1.2,W=1.8,F=1.3,y0=0.14,y1=0.78,y2=1.0,y3=1.5;
        const A=1.4,B=1.24,zr=-2.62,zrt=-2.62,zf=2.0,zft=1.85;
        [-1,1].forEach(sd=>{
          armorPlate(tank,[[sd*L,y0,-2.45],[sd*L,y0,2.28],[sd*L,y1,2.52],[sd*L,y1,-2.45]],hullMat,60,'hull-side');
          armorPlate(tank,[[sd*W,y1,-2.62],[sd*W,y1,2.2],[sd*W,y2,2.2],[sd*W,y2,-2.62]],hullMat,80,'hull-side');
          armorPlate(tank,[[sd*W,y1,2.2],[sd*F,y1,2.62],[sd*F,y2,2.62],[sd*W,y2,2.2]],hullMat,100,'front-cheek');
          armorPlate(tank,[[sd*A,y2,zr],[sd*A,y2,zf],[sd*B,y3,zft],[sd*B,y3,zrt]],hullMat,80,'hull-side');
          box(tank,detailMat,sd*(W+0.01),y2,0,0.04,0.05,5.2);
        });
        armorPlate(tank,[[-L,y0,2.28],[L,y0,2.28],[L,y1,2.52],[-L,y1,2.52]],hullMat,100,'hull-glacis');
        armorPlate(tank,[[L,y0,-2.45],[-L,y0,-2.45],[-L,y1,-2.45],[L,y1,-2.45]],hullMat,60,'hull-rear');
        armorPlate(tank,[[-L,y0,-2.45],[L,y0,-2.45],[L,y0,2.28],[-L,y0,2.28]],hullMat,25,'hull-belly');
        armorPlate(tank,[[-F,y1,2.62],[F,y1,2.62],[F,y2,2.62],[-F,y2,2.62]],hullMat,100,'hull-glacis');
        armorPlate(tank,[[W,y1,-2.62],[-W,y1,-2.62],[-W,y2,-2.62],[W,y2,-2.62]],hullMat,80,'hull-rear');
        const shelf=[[-W,y2,-2.62],[-W,y2,2.2],[-F,y2,2.62],[F,y2,2.62],[W,y2,2.2],[W,y2,-2.62]];
        armorPlate(tank,shelf,hullMat,25,'hull-roof');
        armorPlate(tank,shelf.map(v=>[v[0],y1,v[2]]),hullMat,25,'hull-belly');
        armorPlate(tank,[[-A,y2,zf],[A,y2,zf],[B,y3,zft],[-B,y3,zft]],hullMat,100,'hull-glacis');
        armorPlate(tank,[[A,y2,zr],[-A,y2,zr],[-B,y3,zrt],[B,y3,zrt]],hullMat,80,'hull-rear');
        armorPlate(tank,[[-B,y3,zrt],[-B,y3,zft],[B,y3,zft],[B,y3,zrt]],hullMat,25,'hull-roof');
        return;
      }
      if(isFV4005){
        // FV4005 Stage II: Centurion Mk 3 hull. A narrow tub sits between the tracks, a wider
        // superstructure overhangs them, the 76 mm glacis is steeply raked (~60 deg) over a short
        // lower nose plate (~40 deg), and the deck runs flat to the rear.
        const yB=0.30, yS=0.95, yH=1.28, yJ=0.78, hT=0.75, hU=1.26;
        const zNose=2.46, zJ=2.86, zGl=1.90, zUnder=2.53, zRb=-2.70, zRt=-2.62, zRu=-2.72;
        armorPlate(tank,[[-hU,yJ,zJ],[hU,yJ,zJ],[hU,yH,zGl],[-hU,yH,zGl]],hullMat,76,'hull-glacis');
        armorPlate(tank,[[-hT,yB,zNose],[hT,yB,zNose],[hT,yJ,zJ],[-hT,yJ,zJ]],hullMat,76,'hull-glacis');
        armorPlate(tank,[[-hT,yB,zRb],[hT,yB,zRb],[hT,yB,zNose],[-hT,yB,zNose]],hullMat,25,'hull-belly');
        armorPlate(tank,[[-hT,yB,zRb],[hT,yB,zRb],[hT,yS,zRu],[-hT,yS,zRu]],hullMat,38,'hull-rear');
        armorPlate(tank,[[-hU,yS,zRu],[hU,yS,zRu],[hU,yH,zRt],[-hU,yH,zRt]],hullMat,38,'hull-rear');
        [-1,1].forEach(s=>{
          armorPlate(tank,[[s*hT,yB,zRb],[s*hT,yB,zNose],[s*hT,yS,zUnder],[s*hT,yS,zRu]],hullMat,51,'hull-side');
          armorPlate(tank,[[s*hU,yS,zRu],[s*hU,yS,zUnder],[s*hU,yH,zGl],[s*hU,yH,zRt]],hullMat,51,'hull-side');
          armorPlate(tank,[[s*hT,yS,zRu],[s*hU,yS,zRu],[s*hU,yS,zUnder],[s*hT,yS,zUnder]],hullMat,25,'hull-belly');
        });
        armorPlate(tank,[[-hU,yH,zGl],[hU,yH,zGl],[hU,yH,zRt],[-hU,yH,zRt]],hullMat,20,'hull-roof');
        return;
      }
      if(isAMX50){
        // AMX 50 Surbaissé ("lowered"): a low one-piece CAST hull. Flat vertical sides on a narrow belly, a
        // flat roof, a flat near-vertical rear and a very long, steeply raked glacis that rounds into a short,
        // blunt chin. Like the Panther, the hull overhangs the track tops. Lofted from cross-section rings so
        // it reads as a single casting. Armour per War Thunder data: ~60 front / 40 side / 30 rear / 20 roof.
        // M-V-Yoh hull: one smooth, fully rounded tub. A bulging cross-section, a long curved glacis that flows
        // straight into a rounded beak, and a rounded tail. Built as a shared-vertex (indexed) mesh with smooth
        // shading so there are no visible facets. Stations are spline-interpolated for a continuous curve.
        const CTRL=[ // z, upper half-width, belly half-width, bottom y, crown y
          [-2.86,0.52,0.38,0.54,0.80],[-2.72,0.88,0.58,0.42,0.97],[-2.40,1.05,0.68,0.32,1.06],
          [-1.20,1.10,0.70,0.30,1.09],[ 0.40,1.10,0.70,0.30,1.09],[ 1.45,1.08,0.70,0.30,1.06],
          [ 1.95,1.02,0.67,0.32,0.94],[ 2.42,0.88,0.60,0.36,0.76],[ 2.76,0.64,0.48,0.42,0.60],[ 2.97,0.26,0.26,0.48,0.54]
        ];
        const cr=(p0,p1,p2,p3,t)=>0.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t);
        const sample=z=>{
          let i=0; while(i<CTRL.length-2 && z>CTRL[i+1][0]) i++;
          const a=CTRL[Math.max(0,i-1)], b=CTRL[i], c=CTRL[i+1], d=CTRL[Math.min(CTRL.length-1,i+2)];
          const t=THREE.MathUtils.clamp((z-b[0])/(c[0]-b[0]),0,1);
          return [z,...[1,2,3,4].map(k=>cr(a[k],b[k],c[k],d[k],t))];
        };
        const NS=34, stations=[];
        for(let k=0;k<NS;k++){ const u=k/(NS-1); stations.push(sample(CTRL[0][0]+(CTRL[CTRL.length-1][0]-CTRL[0][0])*u)); }
        const ring=([z,wu,wl,yb,yt])=>{
          const ym=yb+(yt-yb)*0.50, pts=[], N=8;
          for(let k=0;k<=N;k++){ const a=k/N*Math.PI/2; pts.push([wl+(wu-wl)*Math.sin(a), ym-(ym-yb)*Math.cos(a)]); }
          for(let k=1;k<=N;k++){ const a=k/N*Math.PI/2, c=Math.cos(a), sn=Math.sin(a); pts.push([wu*Math.pow(c,2/3.0), ym+(yt-ym)*Math.pow(sn,2/3.0)]); }
          const right=pts, left=pts.slice(0,-1).reverse().map(([x,y])=>[-x,y]);
          return [...right,...left.slice(0,-1)].map(([x,y])=>[x,y,z]);
        };
        const rings=stations.map(ring), M=rings[0].length, vpos=[], idx=[];
        rings.forEach(R=>R.forEach(v=>vpos.push(v[0],v[1],v[2])));
        for(let k=0;k<rings.length-1;k++) for(let e=0;e<M;e++){
          const f=(e+1)%M, a=k*M+e, b=k*M+f, c=(k+1)*M+e, d=(k+1)*M+f;
          idx.push(a,b,d,a,d,c);
        }
        [[0,false],[rings.length-1,true]].forEach(([ri,front])=>{
          const R=rings[ri], ci=vpos.length/3;
          vpos.push(0,R.reduce((m,v)=>m+v[1],0)/R.length,R[0][2]);
          for(let e=0;e<M;e++){ const f=(e+1)%M, a=ri*M+e, b=ri*M+f; front?idx.push(ci,a,b):idx.push(ci,b,a); }
        });
        const hg=new THREE.BufferGeometry();
        hg.setAttribute('position',new THREE.Float32BufferAttribute(vpos,3)); hg.setIndex(idx); hg.computeVertexNormals();
        const smoothHull=hullMat.clone(); smoothHull.flatShading=false; smoothHull.needsUpdate=true;
        markArmor(addMesh(hg,smoothHull,tank,0,0,0),n=>{
          // Cast hull: 102 mm glacis laid well back (~250 mm line of sight), 76 mm lower nose and sides,
          // 51 mm rear, 38 mm roof, 25 mm floor.
          if(n.y<-0.9) return {t:25,zone:'hull-belly'};
          if(n.z>0.25) return n.y>0?{t:102,zone:'hull-glacis-upper'}:{t:76,zone:'hull-glacis-lower'};
          if(n.y>0.85) return {t:38,zone:'hull-roof'};
          if(n.z<-0.5) return {t:51,zone:'hull-rear'};
          return {t:76,zone:'hull-side'};
        });
        return;
      }
      if(isT72){
        // T-72B hull, in real metres: a narrow tub between the tracks (belly 0.47 m off the ground), an upper hull that overhangs the
        // track run, a low rear engine deck, a flat fighting-compartment roof and a long laminate glacis laid back 68 deg from the
        // vertical (22 deg from horizontal) that meets a short, steep lower plate at a nose edge 0.735 m above the ground.
        const GLA=Math.tan(22*Math.PI/180), gy=z=>1.32-(z-2.05)*GLA;
        const stations=[ // z, belly half-width, bottom y, upper half-width, shelf y, deck y, top inset
          [-3.45,0.92,0.66,1.30,0.90,1.10,0.86],[-3.36,1.04,0.52,1.50,0.93,1.17,0.88],[-3.10,1.08,0.47,1.54,0.93,1.20,0.88],
          [-1.34,1.08,0.47,1.54,0.93,1.20,0.88],[-1.26,1.08,0.47,1.54,0.93,1.30,0.88],
          [ 2.05,1.08,0.47,1.54,0.93,1.32,0.88],
          [ 3.10,1.05,0.47,1.46,gy(3.10),gy(3.10),0.90],
          // Lower front plate: nose stays at z=3.50 but is raised (crease ~0.92 m). The plate climbs from the flat belly at z=3.10
          // (0.47 m) to the nose over 0.40 m of run: ~43 deg from horizontal, less steep than before, with a sharp crease at the glacis.
          [ 3.50,0.95,0.90,1.34,0.91,0.92,0.92]
        ];
        const ring=([zm,wB,yB,wU,yS,yT,ins])=>{
          const yShelf=Math.max(yB,Math.min(yT,yS)), yLow=Math.max(yB,yShelf-0.06), ySide=Math.min(yT,Math.max(yShelf,yT-0.14));
          const Rt=[[wB,yB],[wB,yLow],[wU,yShelf],[wU,ySide],[wU*ins,yT]].map(([x,y])=>[u72(x),u72(y),u72(zm)]);
          const Lt=Rt.map(([x,y,z])=>[-x,y,z]).reverse();
          return [[-Rt[0][0],Rt[0][1],Rt[0][2]],...Rt,...Lt.slice(0,-1)];
        };
        const rings=stations.map(ring), pos=[], tri=(a,b,c)=>pos.push(...a,...b,...c);
        for(let k=0;k<rings.length-1;k++){
          const A=rings[k], B=rings[k+1];
          for(let e=0;e<A.length;e++){const f=(e+1)%A.length; tri(A[e],A[f],B[f]); tri(A[e],B[f],B[e]);}
        }
        const capRing=(Rg,front)=>{
          const c=[0,Rg.reduce((m,v)=>m+v[1],0)/Rg.length,Rg[0][2]];
          for(let e=0;e<Rg.length;e++){const f=(e+1)%Rg.length; front?tri(c,Rg[e],Rg[f]):tri(c,Rg[f],Rg[e]);}
        };
        capRing(rings[0],false); capRing(rings[rings.length-1],true);
        const hg=new THREE.BufferGeometry();
        hg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); hg.computeVertexNormals();
        // Estimated protection (RHA-equivalent): laminate glacis (80 steel + 105 textolite + 20 steel, plus the +20 mm T-72B plate)
        // ~525 mm vs kinetic / ~540 mm vs shaped charge at its 68 deg design angle; lower plate 250 mm; sides 80 mm; roof 25; rear 45; floor 20.
        markArmor(addMesh(hg,hullMat,tank,0,0,0),n=>{
          if(n.y<-0.9) return {t:20,zone:'hull-belly'};
          if(n.z>0.3 && n.y<0.2) return {t:250,zone:'hull-lower-front'};
          if(n.y>0.5 && n.z>0.25) return comp(525,540,68,'hull-glacis');   // base glacis + 20 mm appliqué plate: ~500-550 KE (mid 525), ~540 CE; ERA bricks are CE-only
          if(n.y>0.85) return {t:25,zone:'hull-roof'};
          if(n.z<-0.5) return {t:45,zone:'hull-rear'};
          return {t:80,zone:'hull-side'};
        });
        return;
      }
      if(isM1){
        // M1 Abrams hull: narrow tub between the tracks, wide sponson deck over them, very shallow ~82 deg glacis,
        // short 40 deg lower plate, high rear engine deck and a lower driver's deck. Units: real metres via mX/mYh/mZ.
        const stations=[ // z, belly half-width, bottom y, upper half-width, shelf y, deck y, top inset
          [-3.96,0.95,0.62,1.62,1.02,1.50,0.84],[-3.20,0.98,0.52,1.72,1.02,1.50,0.84],[-1.50,1.00,0.48,1.76,1.02,1.50,0.84],
          [-1.42,1.00,0.48,1.76,1.02,1.40,0.84],[ 1.70,1.00,0.48,1.76,1.02,1.40,0.84],[ 2.00,1.00,0.48,1.74,1.02,1.285,0.84],
          [ 3.59,0.95,0.48,1.50,0.95,1.005,0.84],[ 3.97,1.30,0.66,1.20,0.935,0.938,0.90]
        ]; // deck rises in ONE straight wedge from the nose (~10 deg, the nose deck height continues the same line, so there is no kink down at the front); the nose now has a tall lower front face (0.66 -> 0.94 m) to the turret-ring deck; nose and corners taper in plan
        const ring=([zm,wB,yB,wU,yS,yT,ins])=>{
          const yShelf=Math.max(yB,Math.min(yS,yT-0.03)), ySide=Math.max(yShelf,yT-0.16), yLow=Math.max(yB,yShelf-0.1);
          const Rt=[[wB,yB],[wB,yLow],[wU,yShelf],[wU,ySide],[wU*ins,yT]].map(([x,y])=>[mX(x),mYh(y),mZ(zm)]);
          const Lt=Rt.map(([x,y,z])=>[-x,y,z]).reverse();
          return [[-Rt[0][0],Rt[0][1],Rt[0][2]],...Rt,...Lt.slice(0,-1)];
        };
        const rings=stations.map(ring), pos=[], tri=(a,b,c)=>pos.push(...a,...b,...c);
        for(let k=0;k<rings.length-1;k++){
          const A=rings[k], B=rings[k+1];
          for(let e=0;e<A.length;e++){const f=(e+1)%A.length; tri(A[e],A[f],B[f]); tri(A[e],B[f],B[e]);}
        }
        const capRing=(Rg,front)=>{
          const c=[0,Rg.reduce((m,v)=>m+v[1],0)/Rg.length,Rg[0][2]];
          for(let e=0;e<Rg.length;e++){const f=(e+1)%Rg.length; front?tri(c,Rg[e],Rg[f]):tri(c,Rg[f],Rg[e]);}
        };
        capRing(rings[0],false); capRing(rings[rings.length-1],true);
        const hg=new THREE.BufferGeometry();
        hg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); hg.computeVertexNormals();
        // Estimated protection of the 1980 M1 (Chobham-type "special armour"), RHA-equivalent frontal arc:
        // glacis 350 KE / 750 CE at ~80 deg, lower plate 300 / 700 at 40 deg. Steel: sides 38, rear/roof/floor 25 mm.
        markArmor(addMesh(hg,hullMat,tank,0,0,0),n=>{
          if(n.y<-0.9) return {t:25,zone:'hull-belly'};
          if(n.z>0.3 && n.y<0.3) return comp(300,700,40,'hull-lower-front');
          if(n.y>0.9 && n.z>0.06 && n.z<0.25) return comp(350,750,80,'hull-glacis');
          if(n.z>0.25 && n.y>=0.8) return comp(350,750,25,'hull-front');  // steeper ramp up to the turret-ring deck
          if(n.y>0.8) return {t:25,zone:'hull-roof'};
          if(n.z>0.5) return {t:38,zone:'hull-bulkhead'};
          if(n.z<-0.5) return {t:25,zone:'hull-rear'};
          return {t:38,zone:'hull-side'};
        });
        return;
      }
      if(isK1){
        // K1 hull: same lofted-ring construction as the M1 above (narrow belly tub, overhanging
        // sponson deck, shallow glacis, short lower plate, raised rear deck) but derived from the
        // M1's own station table by the K1's known length/width ratios - see the comment by
        // K1_LEN_RATIO near the top of buildTank for what's confirmed vs estimated here.
        // Nose profile, 4th pass (from the user's side-view sketch): ONE long, nearly flat top plate (it keeps the deck's
        // gentle ~4.4 deg fall all the way to the nose), then a short, steep nose face (~72 deg, its bottom edge the
        // front-most point of the hull), then a lower plate that runs back and DOWN (~21 deg) to meet the belly. The old
        // version flared the belly wider than the upper hull at the tip, which is what made the nose look like it was
        // pushing outwards; the belly is now narrower than the upper hull all the way to the tip. z of the final station
        // stays at the original 3.97 (the confirmed 7.48 m hull length is measured against it).
        // 5th pass: the whole nose section is moved back so the front-most edge of the hull (z = 2.78 m) now stops just
        // behind the front tip of the tracks (~2.9 m) instead of poking out past them. The shape is unchanged (top plate
        // falls ~4.4 deg, steep ~72 deg nose face, lower plate back and down at ~21 deg to the belly); because the top
        // plate keeps its slope, the nose now sits a little higher. Side-view numbers (m, after the length/height ratios):
        // top plate 1.302 (z=1.604) -> 1.220 at z=2.675; nose face down to y=0.890 at z=2.78 (the front-most point); lower
        // plate back and down to the belly (y=0.446) at z=1.625. The plan view is nearly straight across the front.
        const m1Stations=[
          [-3.96,0.95,0.62,1.62,1.02,1.50,0.84],[-3.20,0.98,0.52,1.72,1.02,1.50,0.84],[-1.50,1.00,0.48,1.76,1.02,1.50,0.84],
          [-1.42,1.00,0.48,1.76,1.02,1.40,0.84],
          [ 1.723,1.00,0.48,1.76,1.02,1.398,0.84],           // lower plate starts here (belly meets it)
          [ 2.836,0.95,0.913,1.55,0.90,1.311,0.88],          // top of the nose face / part-way up the lower plate
          [ 2.947,0.90,0.9565,1.45,0.86,0.978,0.92]          // front-most edge: bottom of the nose face / front of the lower plate
        ];
        const stations=m1Stations.map(([z,wb,yb,wu,ys,yt,ins])=>
          [z*K1_LEN_RATIO,wb*K1_WID_RATIO,yb*K1_HGT_RATIO,wu*K1_WID_RATIO*0.92,ys*K1_HGT_RATIO,yt*K1_HGT_RATIO,ins]); // side wall now drops to ~0.74 m (was a shelf at ~0.95 m, i.e. right on top of the tracks) so the hull sides cover the upper track run and the tracks read as part of the tank // 0.92: upper hull narrowed (~1.59 m half-width at the rear, ~1.40 m at the nose, was 1.73/1.52) so it no longer swallows the front fenders; skirts and fenders sit just outside it
        const ring=([zm,wB,yB,wU,yS,yT,ins])=>{
          const yShelf=Math.max(yB,Math.min(yS,yT-0.03)), ySide=Math.max(yShelf,yT-0.16), yLow=Math.max(yB,yShelf-0.1);
          const Rt=[[wB,yB],[wB,yLow],[wU,yShelf],[wU,ySide],[wU*ins,yT]].map(([x,y])=>[ku(x),ku(y),ku(zm)]);
          const Lt=Rt.map(([x,y,z])=>[-x,y,z]).reverse();
          return [[-Rt[0][0],Rt[0][1],Rt[0][2]],...Rt,...Lt.slice(0,-1)];
        };
        const rings=stations.map(ring), pos=[], tri=(a,b,c)=>pos.push(...a,...b,...c);
        for(let k=0;k<rings.length-1;k++){
          const A=rings[k], B=rings[k+1];
          for(let e=0;e<A.length;e++){const f=(e+1)%A.length; tri(A[e],A[f],B[f]); tri(A[e],B[f],B[e]);}
        }
        const capRing=(Rg,front)=>{
          const c=[0,Rg.reduce((m,v)=>m+v[1],0)/Rg.length,Rg[0][2]];
          for(let e=0;e<Rg.length;e++){const f=(e+1)%Rg.length; front?tri(c,Rg[e],Rg[f]):tri(c,Rg[f],Rg[e]);}
        };
        capRing(rings[0],false); capRing(rings[rings.length-1],true);
        const hg=new THREE.BufferGeometry();
        hg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); hg.computeVertexNormals();
        // Protection figures are not published for the K1 - placeholder RHA-equivalents carried over
        // from the M1's values at the same zones, pending real data.
        markArmor(addMesh(hg,hullMat,tank,0,0,0),n=>{
          if(n.y<-0.9) return {t:25,zone:'hull-belly'};
          if(n.z>0.3 && n.y<0.3) return comp(300,700,40,'hull-lower-front');
          if(n.z>0.5 && n.y>=0.3 && n.y<0.8) return comp(350,750,25,'hull-front');   // the steep nose face between the top plate and the lower plate
          if(n.y>0.9 && n.z>0.06 && n.z<0.25) return comp(350,750,80,'hull-glacis');
          if(n.z>0.25 && n.y>=0.8) return comp(350,750,25,'hull-front');
          if(n.y>0.8) return {t:25,zone:'hull-roof'};
          if(n.z>0.5) return {t:38,zone:'hull-bulkhead'};
          if(n.z<-0.5) return {t:25,zone:'hull-rear'};
          return {t:38,zone:'hull-side'};
        });
        return;
      }
      if(isLeo){
        // Leopard 1 hull: a low welded/cast tub. A narrow belly between the tracks, an upper hull that overhangs the
        // track tops, a RAISED rear engine deck that steps down to the fighting-compartment roof, and a long upper
        // glacis laid back ~60 deg from the vertical (70 mm -> ~140 mm line-of-sight) ending in a short, steep nose.
        const stations=[ // z, upper half-width, belly half-width, bottom y, deck y
          [-2.78,1.00,0.64,0.52,1.00],[-2.66,1.14,0.74,0.36,1.10],[-2.45,1.18,0.74,0.30,1.16],
          [-1.10,1.18,0.74,0.30,1.16],[-1.04,1.18,0.74,0.30,1.06],[ 1.90,1.18,0.74,0.30,1.06],
          // Wedge front (side profile only, the plan view stays dead straight at full width): one long straight glacis
          // (~23 deg) falling from the crest to a nose edge about half way up the front, then a short, steep, clearly visible lower plate (~50 deg) leaning back down to the belly.
          [ 2.20,1.18,0.74,0.30,0.93],[ 2.50,1.18,0.74,0.30,0.80],[ 2.56,1.18,0.74,0.30,0.78],[ 2.84,1.18,0.74,0.64,0.66]
        ];
        const ring=([z,wu,wl,yb,yt])=>{
          const ySh=Math.min(yt-0.004,Math.max(yb+0.08,Math.min(1.0,yt-0.16))), yLg=Math.min(ySh-0.004,Math.max(yb+0.04,Math.min(0.98,ySh-0.04)));
          const Rt=[[wl,yb],[wl,yLg],[wu,yLg+0.03],[wu,ySh],[wu*0.86,yt]];
          const Lt=Rt.map(([x,y])=>[-x,y]).reverse();
          return [[-wl,yb],...Rt,...Lt.slice(0,-1)].map(([x,y])=>[x,y,z]);
        };
        const rings=stations.map(ring), pos=[], tri=(a,b,c)=>pos.push(...a,...b,...c);
        for(let k=0;k<rings.length-1;k++){
          const A=rings[k], B=rings[k+1];
          for(let e=0;e<A.length;e++){const f=(e+1)%A.length; tri(A[e],A[f],B[f]); tri(A[e],B[f],B[e]);}
        }
        const capRing=(Rg,front)=>{
          const c=[0,Rg.reduce((m,v)=>m+v[1],0)/Rg.length,Rg[0][2]];
          for(let e=0;e<Rg.length;e++){const f=(e+1)%Rg.length; front?tri(c,Rg[e],Rg[f]):tri(c,Rg[f],Rg[e]);}
        };
        capRing(rings[0],false); capRing(rings[rings.length-1],true);
        const hg=new THREE.BufferGeometry();
        hg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); hg.computeVertexNormals();
        // 70 mm upper glacis / 35 mm sides / 25 mm rear, roof and floor. (The lower nose plate is not in the
        // brief; it is given 50 mm.)
        markArmor(addMesh(hg,hullMat,tank,0,0,0),n=>{
          if(n.y<-0.9) return {t:25,zone:'hull-belly'};
          if(n.z>0.3) return n.y>0.2?{t:70,zone:'hull-glacis-upper'}:{t:50,zone:'hull-glacis-lower'};
          if(n.y>0.9) return {t:25,zone:'hull-roof'};
          if(n.z<-0.5) return {t:25,zone:'hull-rear'};
          return {t:35,zone:'hull-side'};
        });
        return;
      }
      if(isChallenger1){
        // Challenger 1 hull (Chieftain-family chassis, Mk 3), in real metres: 8.3 m long overall, ground clearance 0.50 m, 3.42 m over the
        // tracks. A narrow belly between the tracks, an upper hull that overhangs the track run, a slightly raised rear engine deck (1.50 m)
        // that steps down to the fighting-compartment roof (1.42 m), a long shallow glacis (about 17 deg from horizontal) ending at a nose edge
        // 0.80 m up, a short lower plate that slopes back under the hull, and a rear plate that leans sharply inward toward the bottom.
        const SL=0.3024, gy=z=>1.42-(z-1.75)*SL;
        const stations=[ // z, belly half-width, bottom y, upper half-width, shelf y, top y, top inset
          [-4.10,0.88,0.86,1.08,0.92,1.36,0.90],[-4.00,0.96,0.70,1.30,0.95,1.44,0.90],[-3.62,1.03,0.50,1.50,1.00,1.50,0.88],
          [-1.45,1.03,0.50,1.52,1.00,1.50,0.88],[-1.38,1.03,0.50,1.52,1.00,1.42,0.88],
          [ 1.75,1.03,0.50,1.52,1.00,1.42,0.88],
          [ 3.30,1.01,0.50,1.46,gy(3.30),gy(3.30),0.92],
          [ 3.45,0.99,0.50,1.43,gy(3.45),gy(3.45),0.93],
          [ 3.80,0.92,0.72,1.38,0.79,0.80,0.94]
        ];
        const ring=([zm,wB,yB,wU,yS,yT,ins])=>{
          const yShelf=Math.max(yB,Math.min(yT,yS)), yLow=Math.max(yB,yShelf-0.06), ySide=Math.min(yT,Math.max(yShelf,yT-0.16));
          const Rt=[[wB,yB],[wB,yLow],[wU,yShelf],[wU,ySide],[wU*ins,yT]].map(([x,y])=>[c1x(x),c1y(y),c1z(zm)]);
          const Lt=Rt.map(([x,y,z])=>[-x,y,z]).reverse();
          return [[-Rt[0][0],Rt[0][1],Rt[0][2]],...Rt,...Lt.slice(0,-1)];
        };
        const rings=stations.map(ring), pos=[], tri=(a,b,c)=>pos.push(...a,...b,...c);
        for(let k=0;k<rings.length-1;k++){
          const A=rings[k], B=rings[k+1];
          for(let e=0;e<A.length;e++){const f=(e+1)%A.length; tri(A[e],A[f],B[f]); tri(A[e],B[f],B[e]);}
        }
        const capRing=(Rg,front)=>{
          const c=[0,Rg.reduce((m,v)=>m+v[1],0)/Rg.length,Rg[0][2]];
          for(let e=0;e<Rg.length;e++){const f=(e+1)%Rg.length; front?tri(c,Rg[e],Rg[f]):tri(c,Rg[f],Rg[e]);}
        };
        capRing(rings[0],false); capRing(rings[rings.length-1],true);
        const hg=new THREE.BufferGeometry();
        hg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); hg.computeVertexNormals(); withUV(hg);
        // Chobham composite glacis (~300 mm KE / 580 mm CE per published estimates - the real figure is classified). Steel elsewhere:
        // 80 mm lower plate, 60 mm sides, 40 mm rear, 25 mm roof and belly.
        markArmor(addMesh(hg,hullMat,tank,0,0,0),n=>{
          if(n.y<-0.9) return {t:25,zone:'hull-belly'};
          if(n.z>0.2 && n.y>0.5) return comp(300,580,66,'hull-glacis-upper');
          if(n.z>0.2) return {t:80,zone:'hull-glacis-lower'};
          if(n.y>0.9) return {t:25,zone:'hull-roof'};
          if(n.z<-0.5) return {t:40,zone:'hull-rear'};
          return {t:60,zone:'hull-side'};
        });
        return;
      }
      if(isT54E1){
        // T54E1 rides on the M48 Patton hull: one big cast shell with a narrow belly between the tracks, an
        // upper hull that overhangs the track tops (the M48's "pregnant" bulge), a long sloped glacis that
        // rounds into a boat-shaped lower nose, and a near-vertical rear plate. It is lofted from cross-section
        // rings so it reads as a single casting instead of a box. Armour per War Thunder data: 110 front /
        // 76 side / 35 rear.
        const stations=[ // z, upper half-width, belly half-width, bottom y, deck y
          [-2.70,1.00,0.66,0.52,1.14],[-2.56,1.14,0.78,0.36,1.22],[-2.20,1.16,0.78,0.30,1.24],
          [ 1.40,1.16,0.78,0.30,1.24],[ 1.95,1.12,0.78,0.30,1.20],[ 2.30,0.96,0.75,0.34,1.00],
          [ 2.60,0.76,0.63,0.42,0.80],[ 2.82,0.50,0.46,0.52,0.64]
        ];
        const ring=([z,wu,wl,yb,yt])=>{
          // ySh = top of the vertical hull side, yLg = underside of the overhang ("ledge") above the track
          const ySh=Math.max(yb+0.08,Math.min(1.0,yt-0.16)), yLg=Math.max(yb+0.04,Math.min(0.98,ySh-0.04));
          const Rt=[[wl,yb],[wl,yLg],[wu,yLg+0.03],[wu,ySh],[wu*0.82,yt]];
          const Lt=Rt.map(([x,y])=>[-x,y]).reverse();
          // bottom-left, bottom-right, up the right side, across the deck, down the left side
          return [[-wl,yb],...Rt,...Lt.slice(0,-1)].map(([x,y])=>[x,y,z]);
        };
        const rings=stations.map(ring), pos=[], tri=(a,b,c)=>pos.push(...a,...b,...c);
        for(let k=0;k<rings.length-1;k++){
          const A=rings[k], B=rings[k+1];
          for(let e=0;e<A.length;e++){const f=(e+1)%A.length; tri(A[e],A[f],B[f]); tri(A[e],B[f],B[e]);}
        }
        const capRing=(Rg,front)=>{
          const c=[0,Rg.reduce((m,v)=>m+v[1],0)/Rg.length,Rg[0][2]];
          for(let e=0;e<Rg.length;e++){const f=(e+1)%Rg.length; front?tri(c,Rg[e],Rg[f]):tri(c,Rg[f],Rg[e]);}
        };
        capRing(rings[0],false); capRing(rings[rings.length-1],true);
        const hg=new THREE.BufferGeometry();
        hg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); hg.computeVertexNormals();
        markArmor(addMesh(hg,hullMat,tank,0,0,0),n=>{
          if(n.y>0.9) return {t:25,zone:'hull-roof'};
          if(n.y<-0.9) return {t:25,zone:'hull-belly'};
          if(n.z>0.35) return n.y>0.2?{t:110,zone:'hull-glacis-upper'}:{t:102,zone:'hull-glacis-lower'};
          if(n.z<-0.5) return {t:35,zone:'hull-rear'};
          return {t:76,zone:'hull-side'};
        });
        return;
      }
      const topFront = isTiger ? 2.34 : 1.92;
      const bottomFront = isTiger ? 2.7 : 2.78;
      const topRear = isTiger ? -2.58 : -2.58;
      const bottomRear = isTiger ? -2.62 : -2.78;
      const topHalf = isTiger ? 1.36 : 1.08;
      const bottomHalf = isTiger ? 1.38 : 1.32;
      const yBottom = 0.28, yTop = isTiger ? 1.2 : 1.24;
      const bl=[-bottomHalf,yBottom,bottomRear], br=[bottomHalf,yBottom,bottomRear];
      const bfr=[bottomHalf,yBottom,bottomFront], bfl=[-bottomHalf,yBottom,bottomFront];
      const tl=[-topHalf,yTop,topRear], tr=[topHalf,yTop,topRear];
      const tfr=[topHalf,yTop,topFront], tfl=[-topHalf,yTop,topFront];
      const pm = isTiger ? hullMat : new THREE.MeshBasicMaterial({visible:false,side:THREE.DoubleSide});
      const armor = isTiger
        ? {front:100,side:80,rear:80,roof:25,belly:25}
        : {front:80,side:50,rear:40,roof:25,belly:16};
      armorPlate(tank,[bfl,bfr,tfr,tfl],pm,armor.front,'hull-glacis');
      armorPlate(tank,[br,bl,tl,tr],pm,armor.rear,'hull-rear');
      armorPlate(tank,[bl,bfl,tfl,tl],pm,armor.side,'hull-side');
      armorPlate(tank,[bfr,br,tr,tfr],pm,armor.side,'hull-side');
      armorPlate(tank,[tl,tfl,tfr,tr],pm,armor.roof,'hull-roof');
      armorPlate(tank,[bl,br,bfr,bfl],pm,armor.belly,'hull-belly');
      // Rear-view profile: a flat deck, sloping shoulders, then vertical side plates that
      // cover the top third of the tracks. A narrow tub sits between the tracks below.
      const H=1.6, D=1.25, Tw=0.88;
      const zr=y=>-2.25-(y-0.1)/1.2*0.35;
      const zf=y=>y<=0.72 ? 2.3+(y-0.1)/0.62*0.75 : 3.05-(y-0.72)/0.58*0.65;
      const ring=(y,w)=>[[-w,y,zr(y)],[w,y,zr(y)],[w,y,zf(y)],[-w,y,zf(y)]];
      const loft=rs=>{
        const pos=[], quad=(u,v,w,x)=>pos.push(...u,...v,...w,...u,...w,...x);
        for(let k=0;k<rs.length-1;k++) for(let e=0;e<4;e++){const f=(e+1)%4; quad(rs[k][e],rs[k][f],rs[k+1][f],rs[k+1][e]);}
        quad(...rs[0]); quad(...rs[rs.length-1]);
        const g=new THREE.BufferGeometry();
        g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
        g.computeVertexNormals(); markArmor(addMesh(g,hullMat,tank,0,0,0),pantherHullByNormal);
      };
      loft([ring(0.1,Tw),ring(0.67,Tw)]);
      loft([ring(0.67,H),ring(0.72,H),ring(0.88,H),ring(1.3,D)]);
    }
    makeHull();

    if(isFV4005){
      const tank=hullGroup;
      const yH=1.28;
      // Driver's hatch (front right, as on every Centurion) with a periscope block on its rim.
      const dx=-0.52, dz=1.62;
      addMesh(new THREE.CylinderGeometry(0.24,0.26,0.09,18),hullMat,tank,dx,yH+0.045,dz);
      addMesh(new THREE.CylinderGeometry(0.21,0.21,0.04,18),hullMat,tank,dx,yH+0.11,dz);
      box(tank,steelMat,dx,yH+0.145,dz,0.12,0.03,0.05);
      box(tank,detailMat,dx,yH+0.15,dz+0.2,0.18,0.08,0.1);
      box(tank,darkMat,dx,yH+0.155,dz+0.255,0.12,0.04,0.02);
      // Headlamps with guards on the front mudguards, beside the glacis.
      [-1,1].forEach(sd=>{
        addMesh(new THREE.CylinderGeometry(0.075,0.08,0.1,12),darkMat,tank,sd*0.95,1.06,2.2,Math.PI/2,0,0);
        box(tank,steelMat,sd*0.95,1.14,2.2,0.2,0.03,0.12);
        // Front tow shackles on the lower nose plate.
        box(tank,steelMat,sd*0.5,0.52,2.62,0.16,0.18,0.12,0.4);
        addMesh(new THREE.TorusGeometry(0.085,0.024,6,12),steelMat,tank,sd*0.5,0.5,2.7,0.6,0,0);
        // Rear tow lugs.
        box(tank,steelMat,sd*0.55,0.55,-2.78,0.14,0.18,0.1);
        addMesh(new THREE.TorusGeometry(0.08,0.022,6,12),steelMat,tank,sd*0.55,0.55,-2.86,0,0,0);
      });
      // Rear towing pintle plate.
      box(tank,steelMat,0,0.55,-2.77,0.4,0.2,0.1);
      addMesh(new THREE.CylinderGeometry(0.06,0.06,0.26,10),steelMat,tank,0,0.58,-2.86);
      // Engine deck grilles, just aft of the turret bustle.
      box(tank,hullMat,0,yH+0.02,-2.28,1.7,0.04,0.78);
      for(let i=0;i<6;i++) box(tank,darkMat,0,yH+0.05,-1.98-i*0.105,1.5,0.025,0.06);
      [-1,1].forEach(sd=>box(tank,steelMat,sd*0.85,yH+0.05,-2.28,0.04,0.04,0.78));
    }

    if(isAMX50){
      const tank=hullGroup, yH=1.06;
      // Fender shelves over the tracks, each carrying three chunky stowage boxes with strap detail.
      [-1,1].forEach(sd=>{
        box(tank,hullMat,sd*1.2,0.97,-0.2,0.46,0.05,4.5);
        [[-1.35,0.8],[-0.2,0.8],[0.95,0.7]].forEach(([z,len])=>{
          box(tank,hullMat,sd*1.22,1.12,z,0.34,0.26,len);
          box(tank,detailMat,sd*1.22,1.255,z,0.30,0.02,len*0.86);
          [-0.28,0.28].forEach(o=>box(tank,steelMat,sd*1.22,1.12,z+len*o,0.37,0.27,0.03));
        });
      });
      const glY=z=>1.0-0.4*(z-1.7);               // height of the glacis surface between its crest (z 1.7) and z 2.15
      // Driver's hatch front-left on the deck behind the glacis crest, with three periscopes ahead of it.
      addMesh(new THREE.CylinderGeometry(0.26,0.29,0.09,22),hullMat,tank,-0.42,yH+0.045,1.3);
      addMesh(new THREE.CylinderGeometry(0.225,0.225,0.04,22),steelMat,tank,-0.42,yH+0.11,1.3);
      box(tank,detailMat,-0.42,yH+0.145,1.3,0.3,0.03,0.04);
      [-0.22,0,0.22].forEach(dx=>{
        box(tank,detailMat,-0.42+dx,yH+0.03,1.64,0.16,0.08,0.11,0.3);
        box(tank,darkMat,-0.42+dx,yH+0.02,1.7,0.1,0.04,0.02,0.3);
      });
      [-1,1].forEach(sd=>{
        // Headlamps with guards on the glacis corners, tow shackles on the chin, rear tow lugs.
        addMesh(new THREE.CylinderGeometry(0.085,0.09,0.1,14),darkMat,tank,sd*0.86,glY(2.0)+0.07,2.0,Math.PI/2-0.38,0,0);
        box(tank,steelMat,sd*0.86,glY(2.0)+0.15,2.0,0.2,0.03,0.12,0.38);
        box(tank,steelMat,sd*0.36,0.58,2.9,0.14,0.16,0.1);
        addMesh(new THREE.TorusGeometry(0.075,0.022,6,12),steelMat,tank,sd*0.36,0.54,2.98,0.5,0,0);
        box(tank,steelMat,sd*0.6,0.78,-2.76,0.16,0.18,0.1);
        addMesh(new THREE.TorusGeometry(0.075,0.022,6,12),steelMat,tank,sd*0.6,0.74,-2.84,0,0,0);
        // Grab rail along each hull shoulder and a hull-side tool box.
        beamBetween(tank,steelMat,[sd*1.0,yH+0.08,-0.9],[sd*1.0,yH+0.08,0.9],0.018,6);
        [-0.9,0.9].forEach(z=>box(tank,steelMat,sd*1.0,yH+0.03,z,0.03,0.08,0.03));
        box(tank,detailMat,sd*1.08,0.99,-1.7,0.26,0.24,0.9);
        box(tank,steelMat,sd*1.08,1.12,-1.7,0.28,0.02,0.92);
      });
      // Spare track links strapped on the glacis (two rows of four, lying on the ~22 deg slope).
      for(let rr=0;rr<2;rr++)for(let i=0;i<4;i++){
        const z=1.96+rr*0.2, x=-0.48+i*0.32;
        box(tank,i%2?steelMat:detailMat,x,glY(z)+0.045,z,0.24,0.07,0.12,0.38);
        box(tank,darkMat,x,glY(z)+0.08,z,0.12,0.03,0.04,0.38);
      }
      // Rear plate: towing pintle, then the louvred engine deck and two round access covers.
      addMesh(new THREE.CylinderGeometry(0.06,0.06,0.26,10),steelMat,tank,0,0.72,-2.84,Math.PI/2,0,0);
      box(tank,steelMat,0,0.72,-2.78,0.4,0.18,0.08);
      for(let i=0;i<7;i++){
        box(tank,darkMat,0,yH+0.032,-2.58+i*0.14,1.3,0.03,0.1);
        box(tank,steelMat,0,yH+0.05,-2.58+i*0.14,1.34,0.014,0.022);
      }
      [-0.8,0.8].forEach(x=>{
        addMesh(new THREE.CylinderGeometry(0.17,0.17,0.04,16),detailMat,tank,x,yH+0.03,-2.1);
        addMesh(new THREE.CylinderGeometry(0.05,0.05,0.05,8),steelMat,tank,x,yH+0.06,-2.1);
      });
    }

    if(isLeo){
      const tank=hullGroup, yH=1.06;
      // Driver's hatch front-left (the Leopard driver sits left of centre) with three periscopes ahead of it.
      addMesh(new THREE.CylinderGeometry(0.25,0.28,0.08,22),hullMat,tank,-0.45,yH+0.04,1.12);
      addMesh(new THREE.CylinderGeometry(0.215,0.215,0.04,22),steelMat,tank,-0.45,yH+0.10,1.12);
      box(tank,detailMat,-0.45,yH+0.13,1.12,0.3,0.03,0.04);
      [-0.2,0,0.2].forEach(dx=>{
        box(tank,detailMat,-0.45+dx,yH+0.035,1.44,0.15,0.08,0.1);
        box(tank,darkMat,-0.45+dx,yH+0.03,1.5,0.1,0.04,0.02);
      });
      // Raised rear engine deck: louvred grilles, two intake covers and a shallow riser to the roof.
      for(let i=0;i<7;i++){
        box(tank,darkMat,0,1.185,-2.35+i*0.15,1.3,0.03,0.1);
        box(tank,steelMat,0,1.2,-2.35+i*0.15,1.34,0.014,0.022);
      }
      [-1,1].forEach(sd=>{
        box(tank,detailMat,sd*0.86,1.19,-1.5,0.3,0.04,0.5);
        beamBetween(tank,steelMat,[sd*1.1,yH+0.05,-0.85],[sd*1.1,yH+0.05,1.0],0.016,6);
        [-0.85,1.0].forEach(z=>box(tank,steelMat,sd*1.1,yH+0.02,z,0.03,0.07,0.03));
        // Front lights on the mudguards, tow shackles on the nose, rear tow lugs and rear lamps.
        addMesh(new THREE.CylinderGeometry(0.075,0.08,0.08,12),darkMat,tank,sd*1.07,0.99,2.0,Math.PI/2,0,0);
        box(tank,steelMat,sd*1.07,1.055,2.0,0.18,0.025,0.1);
        box(tank,steelMat,sd*0.58,0.8,-2.76,0.16,0.18,0.1);
        addMesh(new THREE.TorusGeometry(0.075,0.022,6,12),steelMat,tank,sd*0.58,0.76,-2.84,0,0,0);
        box(tank,darkMat,sd*0.9,0.98,-2.8,0.12,0.07,0.04);
      });
      addMesh(new THREE.CylinderGeometry(0.06,0.06,0.26,10),steelMat,tank,0,0.74,-2.84,Math.PI/2,0,0); // towing pintle
      box(tank,steelMat,0,0.74,-2.78,0.4,0.18,0.08);
    }

    if(isChallenger1){
      const tank=hullGroup, SA=Math.atan(0.3024), CA=Math.cos(SA), SN=Math.sin(SA);
      const onG=(sd,x,off=0)=>[x,1.42-sd*SN+off*CA,1.75+sd*CA+off*SN]; // sd = metres down the glacis from the crest, off = along the plate normal
      // Driver's hatch recessed in the centre of the glacis: a darker well, a raised frame, the lifting hatch and the periscope block ahead of it
      { const w=onG(0.62,0,0.0);
        b1(tank,darkMat,w[0],w[1],w[2],0.9,0.03,1.0,SA);
        [[0,-0.47,0.9,0.05,0.06],[0,0.47,0.9,0.05,0.06]].forEach(([x,dz,ww,hh,dd])=>{const p=onG(0.62+dz,x,0.03); b1(tank,hullMat,p[0],p[1],p[2],ww,hh,dd,SA);});
        [-0.45,0.45].forEach(x=>{const p=onG(0.62,x,0.03); b1(tank,hullMat,p[0],p[1],p[2],0.05,0.05,1.0,SA);});
        const h=onG(0.64,0,0.07); b1(tank,hullMat,h[0],h[1],h[2],0.74,0.05,0.82,SA); b1(tank,steelMat,h[0],h[1]+0.03,h[2],0.5,0.02,0.5,SA);
        [-0.24,0,0.24].forEach(x=>{const p=onG(0.98,x,0.1); b1(tank,detailMat,p[0],p[1],p[2],0.18,0.07,0.1,SA); b1(tank,darkMat,p[0],p[1]+0.015,p[2]+0.05,0.13,0.04,0.02,SA);});
      }
      // Mk 3 frontal armour pack: a bolted appliqué plate across the upper glacis, with a bolt row along its edges
      { const p=onG(1.7,0,0.035); b1(tank,hullMat,p[0],p[1],p[2],2.4,0.06,0.7,SA);
        for(let k=0;k<9;k++){ const x=-1.0+k*0.25; [1.4,2.0].forEach(sd=>{const q=onG(sd,x,0.075); cy1(tank,steelMat,0.025,0.025,0.02,q[0],q[1],q[2],SA,0,0,6);}); }
      }
      // Headlamps (white/IR pair) on the nose corners with guards, front tow shackles on the lower plate
      [-1,1].forEach(sd=>{
        cy1(tank,steelMat,0.1,0.1,0.12,sd*1.22,1.0,3.6,Math.PI/2,0,0,14); b1(tank,darkMat,sd*1.22,1.0,3.67,0.2,0.2,0.02);
        b1(tank,hullMat,sd*1.22,0.9,3.56,0.24,0.12,0.2);
        b1(tank,steelMat,sd*0.85,0.62,3.72,0.14,0.12,0.14);
        addMesh(new THREE.TorusGeometry(c1x(0.07),c1x(0.02),6,12),steelMat,tank,c1x(sd*0.85),c1y(0.62),c1z(3.82),0,0,0);
      });
      // Engine deck: raised, with central radiator grille and louvre ribs, hot-air outlets either side, and a fold-down rear lip
      b1(tank,darkMat,0,1.515,-2.75,1.7,0.025,1.9);
      for(let k=0;k<11;k++) b1(tank,steelMat,0,1.535,-3.65+k*0.18,1.7,0.02,0.035);
      [-1,1].forEach(sd=>{ b1(tank,detailMat,sd*1.08,1.515,-2.75,0.34,0.04,1.5); b1(tank,hullMat,sd*0.88,1.52,-2.1,0.08,0.05,0.5); });
      b1(tank,hullMat,0,1.50,-3.98,1.5,0.1,0.14,-0.12);
      // Step between the engine deck and the fighting-compartment roof, and the roof grab-rails
      b1(tank,hullMat,0,1.46,-1.41,2.5,0.1,0.1);
      [-1,1].forEach(sd=>b1(tank,steelMat,sd*1.35,1.46,-0.9,0.03,0.06,1.0));
      // Mk 3 external fuel drums on the rear corners, with their brackets and straps; tow cable coiled on the rear plate
      [-1,1].forEach(sd=>{
        cy1(tank,hullMat,0.19,0.19,0.82,sd*1.12,1.05,-4.3,0,0,0,18);
        [-0.28,0,0.28].forEach(dy=>cy1(tank,darkMat,0.195,0.195,0.035,sd*1.12,1.05+dy,-4.3,0,0,0,18));
        cy1(tank,steelMat,0.06,0.06,0.04,sd*1.12,1.47,-4.3,0,0,0,10);
        b1(tank,detailMat,sd*1.0,0.95,-4.15,0.5,0.06,0.18);
      });
      cy1(tank,darkMat,0.2,0.2,0.1,0,0.98,-4.2,Math.PI/2,0,0,14); cy1(tank,detailMat,0.13,0.13,0.11,0,0.98,-4.2,Math.PI/2,0,0,12);
      // Pioneer tools, fire extinguisher and spare track links on the fenders
      b1(tank,steelMat,-1.45,1.1,0.5,0.03,0.04,1.1); b1(tank,detailMat,-1.45,1.1,-0.05,0.1,0.06,0.18);
      b1(tank,steelMat,1.45,1.1,0.9,0.03,0.04,1.0); b1(tank,detailMat,1.45,1.1,0.4,0.1,0.06,0.18);
      cy1(tank,hullMat,0.07,0.07,0.34,1.5,1.22,2.3,0,0,0,10);
    }

    if(isT72){
      const tank=hullGroup, C22=Math.cos(22*Math.PI/180), S22=Math.sin(22*Math.PI/180), A22=22*Math.PI/180;
      const onGlacis=(s,x,off=0)=>[x,1.32-s*S22+off*C22,2.05+s*C22+off*S22]; // s = metres down the slope from the crest, off = along the plate normal
      const gn=[0,C22,S22];
      // Driver's hatch on the centreline with the periscope block just ahead of it
      c72(tank,hullMat,0.27,0.30,0.06,0,1.35,1.74,0,0,0,24);
      c72(tank,steelMat,0.21,0.21,0.03,0,1.395,1.74,0,0,0,22);
      [-0.22,0,0.22].forEach(dx=>{ b72(tank,detailMat,dx,1.36,1.99,0.17,0.07,0.1); b72(tank,darkMat,dx,1.37,2.045,0.12,0.04,0.02); });
      // BTU-type dozer blade folded flat on the lower glacis, with its lift arms and stiffening ribs
      { const c=onGlacis(1.37,0,0.05);
        b72(tank,hullMat,c[0],c[1],c[2],2.9,0.045,0.36,A22);
        [-1.2,-0.6,0,0.6,1.2].forEach(x=>{ const r=onGlacis(1.37,x,0.085); b72(tank,steelMat,r[0],r[1],r[2],0.05,0.05,0.34,A22); });
        [-1,1].forEach(sd=>{ const a=onGlacis(0.95,sd*1.18,0.09); b72(tank,detailMat,a[0],a[1],a[2],0.07,0.07,0.95,A22); });
      }
      // Kontakt-1 ERA on the glacis: 2 fields of 4 x 3 bricks leave the centre strip clear (24 bricks)
      [-1,1].forEach(sd=>[0.36,0.62,0.88,1.14].forEach((x,i)=>[0.34,0.68,1.02].forEach((s,j)=>
        placeEra(tank,onGlacis(s,sd*x),gn,[0,0,1],0.26,0.30,0.065,'glacis'+(sd>0?'R':'L')+i+j))));
      // Front tow shackles on the lower plate, headlamps on the front fenders
      [-1,1].forEach(sd=>{
        b72(tank,steelMat,sd*1.0,0.74,3.44,0.13,0.12,0.16);
        addMesh(new THREE.TorusGeometry(u72(0.07),u72(0.02),6,12),steelMat,tank,u72(sd*1.0),u72(0.70),u72(3.54),0,0,0);
      });
      c72(tank,steelMat,0.1,0.1,0.14,-1.58,1.15,3.0,Math.PI/2,0,0,14); b72(tank,darkMat,-1.58,1.15,3.08,0.24,0.24,0.02);  // left headlamp + guard
      c72(tank,detailMat,0.07,0.07,0.12,1.58,1.12,3.0,Math.PI/2,0,0,12);                                                  // right IR lamp
      // Engine deck: central grille with louvre ribs, hot-air outlets either side
      b72(tank,darkMat,0,1.215,-2.2,1.5,0.025,1.7);
      for(let k=0;k<9;k++) b72(tank,steelMat,0,1.235,-3.0+k*0.2,1.5,0.02,0.04);
      [-1,1].forEach(sd=>b72(tank,detailMat,sd*1.05,1.215,-2.2,0.4,0.025,1.5));
      // Single exhaust outlet at the left rear of the deck, with its smoke point
      c72(tank,steelMat,0.14,0.15,0.5,-1.08,1.27,-3.2,Math.PI/2,0,0,16);
      b72(tank,detailMat,-1.08,1.22,-2.95,0.3,0.12,0.35);
      // Unditching beam across the rear plate, tow cables and rear lamps
      c72(tank,darkMat,0.16,0.16,2.3,0,0.93,-3.64,0,0,Math.PI/2,14);
      [-1,0,1].forEach(k=>b72(tank,steelMat,k*0.9,0.93,-3.55,0.06,0.28,0.12));
      [-1,1].forEach(sd=>{ c72(tank,steelMat,0.04,0.04,0.3,sd*1.25,0.84,-3.52,Math.PI/2,0,0,8); b72(tank,darkMat,sd*1.3,1.02,-3.5,0.1,0.07,0.04); });
      // External fuel barrels on the right fender, stowage box on the left
      [-1.55,-2.55].forEach(z=>{ c72(tank,steelMat,0.2,0.2,0.9,1.5,1.27,z,Math.PI/2,0,0,16); [-0.28,0.28].forEach(dz=>b72(tank,detailMat,1.5,1.27,z+dz,0.04,0.44,0.05)); });
      b72(tank,hullMat,-1.5,1.17,-2.2,0.36,0.24,1.1); b72(tank,darkMat,-1.5,1.21,-2.2,0.38,0.03,1.12);
    }

    if(isM1){
      const tank=hullGroup;
      const yDrv=mYh(1.127), zD=mZ(2.9);
      // Driver's hatch on the centreline with three periscopes ahead of it
      addMesh(new THREE.CylinderGeometry(0.27,0.3,0.06,22),hullMat,tank,0,yDrv+0.03,zD);
      addMesh(new THREE.CylinderGeometry(0.21,0.21,0.035,22),steelMat,tank,0,yDrv+0.075,zD);
      [-0.2,0,0.2].forEach(dx=>{ box(tank,detailMat,dx,yDrv-0.01,zD+0.4,0.15,0.07,0.1); box(tank,darkMat,dx,yDrv+0.0,zD+0.45,0.11,0.04,0.02); });
      // Headlight clusters on the front fenders, tow shackles on the lower plate
      [-1,1].forEach(sd=>{
        box(tank,steelMat,sd*mX(1.55),mYh(1.0)+0.03,mZ(3.45),0.2,0.07,0.12); box(tank,darkMat,sd*mX(1.55),mYh(1.0)+0.075,mZ(3.45),0.14,0.03,0.08);
        box(tank,steelMat,sd*mX(0.55),mYh(0.74),mZ(4.0),0.12,0.14,0.08);
        box(tank,steelMat,sd*mX(0.9),mYh(0.8),mZ(-4.0),0.14,0.14,0.1);   // rear tow hooks
      });
      addMesh(new THREE.CylinderGeometry(0.05,0.05,0.14,10),steelMat,tank,0,mYh(0.78),mZ(-4.03),Math.PI/2,0,0); // pintle
      // Rear plate louvres (engine air outlet) and engine-deck grilles
      for(let i=0;i<6;i++) box(tank,darkMat,0,mYh(1.08+i*0.07),mZ(-3.965),mX(2.7),0.025,0.02);
      [-1,1].forEach(sd=>{
        box(tank,detailMat,sd*mX(0.98),mYh(1.505),mZ(-2.75),mX(1.05),0.02,mZ(2.0));
        for(let k=0;k<10;k++) box(tank,darkMat,sd*mX(0.98),mYh(1.515),mZ(-3.6+k*0.2),mX(0.95),0.02,0.05);
      });
      box(tank,detailMat,0,mYh(1.52),mZ(-3.1),mX(0.8),0.025,mZ(1.6));
      for(let k=0;k<7;k++) box(tank,darkMat,0,mYh(1.535),mZ(-3.75+k*0.22),mX(0.7),0.015,0.04);
    }
    if(isT54E1){
      const tank=hullGroup, yH=1.24;
      // Driver's hatch on the centreline of the glacis (the M48 driver sits in the middle) with a periscope trio.
      addMesh(new THREE.CylinderGeometry(0.27,0.30,0.09,22),hullMat,tank,0,1.268,1.62);
      addMesh(new THREE.CylinderGeometry(0.235,0.235,0.04,22),steelMat,tank,0,1.332,1.62);
      box(tank,detailMat,0,1.37,1.62,0.3,0.03,0.04);
      [-0.22,0,0.22].forEach(x=>{
        box(tank,detailMat,x,1.255,1.9,0.16,0.08,0.11,0.45);
        box(tank,darkMat,x,1.25,1.96,0.1,0.04,0.02,0.45);
      });
      // Headlamps with guards on the front mudguards, tow shackles on the lower nose, rear tow lugs and pintle.
      [-1,1].forEach(sd=>{
        addMesh(new THREE.CylinderGeometry(0.09,0.095,0.1,14),darkMat,tank,sd*1.2,1.1,2.05,Math.PI/2,0,0);
        box(tank,steelMat,sd*1.2,1.18,2.05,0.22,0.03,0.13);
        box(tank,steelMat,sd*0.36,0.6,2.8,0.14,0.16,0.1);
        addMesh(new THREE.TorusGeometry(0.075,0.022,6,12),steelMat,tank,sd*0.36,0.56,2.88,0.5,0,0);
        box(tank,steelMat,sd*0.6,0.78,-2.72,0.16,0.18,0.1);
        addMesh(new THREE.TorusGeometry(0.075,0.022,6,12),steelMat,tank,sd*0.6,0.74,-2.8,0,0,0);
        // Fender stowage boxes with hasp and strap (the long box carries the track tools).
        box(tank,detailMat,sd*1.34,1.2,-1.55,0.34,0.3,1.05);
        box(tank,steelMat,sd*1.34,1.37,-1.55,0.36,0.02,1.07);
        box(tank,steelMat,sd*1.52,1.2,-1.55,0.02,0.07,0.16);
        // A grab rail running along each hull shoulder.
        beamBetween(tank,steelMat,[sd*1.2,1.2,-0.7],[sd*1.2,1.2,1.0],0.018,6);
        [-0.7,1.0].forEach(z=>box(tank,steelMat,sd*1.2,1.16,z,0.03,0.08,0.03));
      });
      addMesh(new THREE.CylinderGeometry(0.06,0.06,0.26,10),steelMat,tank,0,0.72,-2.8,Math.PI/2,0,0);
      box(tank,steelMat,0,0.72,-2.74,0.4,0.18,0.08);
      // Louvred engine deck behind the turret bustle, with two round access covers.
      for(let i=0;i<7;i++){
        box(tank,darkMat,0,yH+0.042,-2.4+i*0.14,1.3,0.03,0.1);
        box(tank,steelMat,0,yH+0.06,-2.4+i*0.14,1.34,0.014,0.022);
      }
      [-0.78,0.78].forEach(x=>{
        addMesh(new THREE.CylinderGeometry(0.17,0.17,0.04,16),detailMat,tank,x,yH+0.03,-2.0);
        addMesh(new THREE.CylinderGeometry(0.05,0.05,0.05,8),steelMat,tank,x,yH+0.06,-2.0);
      });
      // Spare track links strapped to the glacis, lying on the slope (rx matches the ~30° plate).
      for(let r=0;r<2;r++)for(let i=0;i<4;i++){
        const x=-0.48+i*0.32;
        box(tank,i%2?steelMat:detailMat,x,1.14-r*0.075,2.05+r*0.14,0.24,0.07,0.12,0.52);
        box(tank,darkMat,x,1.172-r*0.075,2.05+r*0.14,0.12,0.03,0.04,0.52);
      }
    }

    if(isSturer){
      const tank=hullGroup;
      // Borrow the practical track-link stowage and tool fittings seen on German
      // vehicles, keeping the casemate sides clean and visibly sloped.
      [-1,1].forEach(sd=>{
        // Track shoes mounted high on the casemate sides, like the reference vehicle.
        [-1.55,-1.08,-0.61,-0.14,0.33,0.8].forEach((z,i)=>{
          box(tank,i%2?steelMat:detailMat,sd*1.22,1.48,z,0.11,0.3,0.34,0,sd*0.04,0);
          box(tank,darkMat,sd*1.285,1.48,z,0.035,0.08,0.19);
        });
        // Long fenders over the wider tracks and a rear side tool box.
        box(tank,hullMat,sd*1.32,1.03,-0.02,0.78,0.08,5.5);
        box(tank,detailMat,sd*1.22,0.72,-2.4,0.18,0.34,0.78);
        box(tank,steelMat,sd*1.32,0.72,-2.4,0.035,0.08,0.61);
        // Visible side-plate seams and rivets, kept clear of the track belt.
        [-2.1,-1.62,-1.14,-0.66,-0.18,0.3,0.78,1.25].forEach(z=>{
          addMesh(new THREE.CylinderGeometry(0.035,0.035,0.04,8),steelMat,tank,sd*1.15,1.32,z,0,0,Math.PI/2);
        });
        // Front tow eye and a small fender above each track.
        box(tank,hullMat,sd*1.32,0.49,2.75,0.42,0.1,0.76,0.12);
        addMesh(new THREE.TorusGeometry(0.14,0.03,6,12),steelMat,tank,sd*0.82,0.45,2.96,Math.PI/2,0,0);
      });
      // A row of spare track shoes strapped across the sloped glacis.
      for(let i=0;i<7;i++){
        const x=-0.78+i*0.26;
        box(tank,i%2?steelMat:detailMat,x,0.67,2.82,0.23,0.19,0.09,-0.43);
        box(tank,darkMat,x,0.67,2.88,0.1,0.07,0.035,-0.43);
      }
      // Hinged access hatches on the rear deck, echoing the Panther engine deck.
      [-0.48,0.48].forEach(x=>{
        box(tank,detailMat,x,1.25,-2.16,0.52,0.035,0.62);
        addMesh(new THREE.CylinderGeometry(0.055,0.055,0.06,10),steelMat,tank,x,1.29,-2.16,0,0,0);
      });
    }

    if(isTiger){
      const tank = hullGroup; // shadow: these are hull-mounted details, stretch with the hull
      // Flat driver vision slit and the Tiger's hull machine-gun port.
      box(tank,detailMat,-0.45,1.25,1.96,0.46,0.09,0.03,-0.29);
      armorBox(tank,steelMat,0.5,1.2,1.97,0.25,0.24,0.1,100,'hull-mg-port',-0.29);
      box(tank,darkMat,0.5,1.2,2.03,0.13,0.12,0.025,-0.29);
      // A square access plate on the rear deck reinforces the Tiger's slab-sided layout.
      box(tank,detailMat,0,1.53,-2.27,1.9,0.06,0.42);
      // Detail pass: raised driver visor, tow shackles, spare track links, Notek lamp
      box(tank,hullMat,-0.45,1.25,1.99,0.6,0.26,0.1,-0.29);
      [-1,1].forEach(sd=>{
        box(tank,steelMat,sd*0.82,0.36,2.4,0.12,0.12,0.1);
        addMesh(new THREE.TorusGeometry(0.1,0.025,6,12),steelMat,tank,sd*0.82,0.36,2.48);
        // Rear tow hooks, big cylindrical mufflers and fender stowage boxes
        box(tank,steelMat,sd*0.9,0.55,-2.7,0.12,0.18,0.12);
        addMesh(new THREE.CylinderGeometry(0.17,0.17,0.85,12),darkMat,tank,sd*1.6,1.18,-2.15,Math.PI/2,0,0);
        box(tank,detailMat,sd*1.6,1.1,-1.0,0.36,0.2,0.9);
        // Pistol-port style rivet discs on the hull sides
        addMesh(new THREE.CylinderGeometry(0.05,0.05,0.03,8),darkMat,tank,sd*1.805,0.8,1.6,0,0,Math.PI/2);
      });
      for(let i=0;i<7;i++) box(tank,steelMat,-0.45+i*0.15,0.45,2.44,0.13,0.1,0.05,0.4);
      box(tank,detailMat,-1.5,1.07,2.0,0.16,0.14,0.2);
      addMesh(new THREE.CylinderGeometry(0.07,0.07,0.1,10),steelMat,tank,-1.5,1.09,2.12,Math.PI/2,0,0);
      // Engine deck louvres, turret ring collar, jack, shovel and tow cable
      addMesh(new THREE.CylinderGeometry(1.0,1.05,0.07,24),detailMat,tank,0,1.52,0);
      for(let i=0;i<6;i++) box(tank,darkMat,0,1.51,-1.95-i*0.1,1.3,0.03,0.05);
      box(tank,detailMat,1.6,1.05,0.6,0.16,0.1,0.8);
      box(tank,steelMat,-1.58,1.02,0.5,0.2,0.03,0.7);
      const cc=document.createElement('canvas'); cc.width=cc.height=96;
      const cx=cc.getContext('2d');
      cx.fillStyle='#1d1d1d'; cx.fillRect(32,4,32,88); cx.fillRect(4,32,88,32);
      cx.fillStyle='#e8e6de'; cx.fillRect(40,12,16,72); cx.fillRect(12,40,72,16);
      const crossMat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cc),transparent:true,side:THREE.DoubleSide});
      [-1,1].forEach(sd=>{
        box(tank,darkMat,sd*1.825,0.97,0,0.04,0.05,4.3);   // tow cable along the side plate
        box(tank,darkMat,sd*1.825,0.8,0,0.04,0.04,3.4);
        const cr=new THREE.Mesh(new THREE.PlaneGeometry(0.2,0.2),crossMat);
        cr.position.set(sd*1.85,0.88,0); cr.rotation.y=sd*Math.PI/2; tank.add(cr);
      });
    }

    if(!isTiger && !isFV4005 && !isLeo && !isM1 && !isT72 && !isChallenger1 && !isK1){
      const tank = hullGroup; // shadow: these are hull-mounted details, stretch with the hull
      box(tank,hullMat,-0.45,1.07,2.72,0.55,0.2,0.1,0.84);                         // driver visor
      addMesh(new THREE.SphereGeometry(0.1,10,8),steelMat,tank,0.45,0.97,2.86);   // bow MG ball
      addMesh(new THREE.SphereGeometry(0.04,8,6),darkMat,tank,0.45,0.93,2.95);
      for(let i=0;i<6;i++) box(tank,darkMat,0,1.35,-1.35-i*0.15,1.3,0.03,0.07);
      [-1,1].forEach(sd=>addMesh(new THREE.CylinderGeometry(0.15,0.15,0.6,12),darkMat,tank,sd*0.95,0.85,-2.7,Math.PI/2,0,0));
    }
    if(isSturer){
      const tank = hullGroup;
      // Driver visor slit on left casemate front
      box(tank,detailMat,-0.35,1.52,1.12,0.28,0.1,0.06);
      // Front-facing bolted ring seats the gun in the sloped casemate plate.
      const mountY=1.765,mountZ=1.44,mountTilt=0.25;
      addMesh(new THREE.TorusGeometry(0.37,0.055,8,24),steelMat,tank,0,mountY,mountZ,mountTilt,0,0);
      for(let i=0;i<10;i++){
        const a=i/10*Math.PI*2, r=0.405, dy=Math.sin(a)*r;
        addMesh(new THREE.CylinderGeometry(0.027,0.027,0.04,8),detailMat,tank,
          Math.cos(a)*r,mountY+dy*Math.cos(mountTilt),mountZ+dy*Math.sin(mountTilt),Math.PI/2-mountTilt,0,0);
      }
      // Spare track links laid across the sloped glacis.
      for(let i=0;i<7;i++){
        const x=-0.78+i*0.26;
        box(tank,i%2?steelMat:detailMat,x,0.67,2.62,0.23,0.19,0.09,-0.43);
        box(tank,darkMat,x,0.67,2.68,0.1,0.07,0.035,-0.43);
      }
      // Rear stowage bin
      box(tank,detailMat,0,1.65,-1.92,0.9,0.28,0.35);
      // Tow cable on left hull side
      box(tank,darkMat,-1.22,0.88,0,0.05,0.05,3.6);
      [-1,1].forEach(sd=>{
        // Tow hooks on rear hull corners
        box(tank,steelMat,sd*0.72,0.52,-2.55,0.14,0.2,0.12);
        addMesh(new THREE.TorusGeometry(0.09,0.025,6,10),steelMat,tank,sd*0.72,0.52,-2.67);
        // Headlamps
        addMesh(new THREE.CylinderGeometry(0.1,0.1,0.1,12),steelMat,tank,sd*0.78,1.05,2.74,Math.PI/2,0,0);
      });
    }
    // Tracks: a looped belt of instanced links wrapped round the sprocket, idler and
    // interleaved road wheels. The belt and wheels animate from the distance each side travels.
    const T = isTiger
      ? {x:1.6, tw:0.66, Rb:0.39, zs:2.45, zi:-2.4,  Rw:0.31, Rs:0.34, Ri:0.31, z0:-2.0,  z1:2.0}
      : isSturer
      ? {x:1.32,tw:0.68, Rb:0.5, zs:2.82, zi:-2.65, Rw:0.43, Rs:0.46, Ri:0.43, z0:-2.3, z1:2.4}
      : isIS7
      ? {x:1.34,tw:0.76, Rb:0.4, zs:2.5, zi:-2.6, Rw:0.36, Rs:0.42, Ri:0.38, z0:-2.05, z1:2.0}
      : isFV4005
      ? {x:1.02,tw:0.5, Rb:0.43, zs:2.62, zi:-2.52, Rw:0.29, Rs:0.36, Ri:0.34, z0:-1.7, z1:1.7} // Centurion: 3.4 m over skirts, 6 road wheels in 3 Horstmann pairs
      : isT54E1
      ? {x:1.12,tw:0.58, Rb:0.4, zs:2.4, zi:-2.32, Rw:0.34, Rs:0.36, Ri:0.34, z0:-1.7, z1:1.7} // M48: 6 single road wheels, rear drive sprocket, front idler, 5 return rollers
      : isT72
      ? {x:1.073,tw:0.446, Rb:0.3635, zs:2.292, zi:-2.254, Rw:0.2885, Rs:0.26, Ri:0.2885, z0:-1.6, z1:1.5} // T-72: 580 mm track on a 2.79 m gauge, 750 mm road wheels, 6 per side, 3 return rollers, rear sprocket, front idler
      : isM1
      ? {x:1.02,tw:0.5, Rb:0.37, zs:2.3, zi:-2.42, Rw:0.235, Rs:0.34, Ri:0.31, z0:-2.0, z1:1.46} // M1: 7 dual road wheels, rear sprocket, front idler, 2 return rollers
      : isLeo
      ? {x:1.0, tw:0.5,  Rb:0.38, zs:2.45, zi:-2.4, Rw:0.275, Rs:0.34, Ri:0.3, z0:-1.85, z1:1.85} // Leopard 1: 7 paired road wheels per side on torsion bars, rear drive sprocket, front idler, 4 return rollers
      : isAMX50
      ? {x:0.98,tw:0.52, Rb:0.42, zs:2.5, zi:-2.45, Rw:0.38, Rs:0.36, Ri:0.34, z0:-2.0, z1:1.95} // AMX 50: 8 big INTERLEAVED road wheels per side, rear drive sprocket, front idler
      : isChallenger1
      ? {x:1.05,tw:0.54, Rb:0.42, zs:2.48, zi:-2.42, Rw:0.3, Rs:0.34, Ri:0.33, z0:-1.64, z1:1.68} // Challenger 1: 6 double road wheels in 3 Horstmann bogie pairs (Chieftain-family chassis), rear drive sprocket, front idler
      : isK1
      ? {x:ku(1.23),tw:ku(0.60), Rb:ku(0.37), zs:ku(2.50), zi:ku(-2.50), Rw:ku(0.33), Rs:ku(0.36), Ri:ku(0.33)} // K1: 6 dual rubber-tyred road wheels, rear drive sprocket, front idler - gauge/track width/wheel size not published, estimated from the M1-derived chassis family
      : {x:1.2, tw:0.6,  Rb:0.5,  zs:2.75, zi:-2.35, Rw:0.4,  Rs:0.43, Ri:0.4,  z0:-1.95, z1:2.05};
    // Scale up the track loop radius and the road/sprocket/idler wheels so the
    // tracks stand taller — mainly bumped for the Tiger 131, Panther left close to stock.
    // Pull the sprocket/idler centers (zs/zi) inward by the same amount the radius grew,
    // so the taller loop's front/rear arcs still end where the old, shorter loop did —
    // otherwise the bigger arc pokes out past the glacis/rear plate.
    // T-72's track loop is scaled up past stock, but kept lower (1.3) so the run reads as a low, flat track rather than a tall one.
    const TRACK_SCALE = isTiger ? 1.5 : isT72 ? 1.0 : isK1 ? 1.25 : isSturer ? 1.12 : isIS7 ? 1.2 : isFV4005 ? 1.15 : isT54E1 ? 1.08 : isAMX50 ? 1.08 : isLeo ? 1.08 : isChallenger1 ? 1.15 : 1.05;
    const radiusGrowth = T.Rb * (TRACK_SCALE - 1);
    T.Rb *= TRACK_SCALE; T.Rw *= TRACK_SCALE; T.Rs *= TRACK_SCALE; T.Ri *= TRACK_SCALE;
    T.zs -= radiusGrowth; T.zi += radiusGrowth;
    if(isM1){ T.zs*=M1_ZK; T.zi*=M1_ZK; } // longer track run under the longer hull
    // Rp is the track belt's own radius around the wheels — it must grow by the same
    // TRACK_SCALE factor as everything else (not just inherit a fixed 0.05 offset),
    // otherwise the belt loop ends up proportionally bigger than the road wheels at
    // high scale and leaves a gap that shows the hull side through the track.
    const trackY = T.Rb, Rp = T.Rb - 0.05*TRACK_SCALE;
    const dummy = new THREE.Object3D(), trackSides = [];
    const wheelPositions = []; // Panther road-wheel groups are also used by suspension.
    const isPanther=tankId==='panther'||isIS7||isFV4005||isT54E1||isAMX50||isLeo||isM1||isT72||isChallenger1||isK1;
    const rearDrive=isIS7||isFV4005||isT54E1||isAMX50||isLeo||isM1||isT72||isChallenger1||isK1; // rear sprocket, front idler // tanks whose road wheels move with the suspension (and whose track belt follows them)
    [-1,1].forEach(side=>{
      const x=side*T.x, Lb=T.zs-T.zi, La=Math.PI*Rp, Lt=2*Lb+2*La, N=Math.round(Lt/0.13);
      const sideWheelPositions=[];
      const links=new THREE.InstancedMesh(new THREE.BoxGeometry(T.tw,0.065,0.11),darkMat,N);
      const grousers=new THREE.InstancedMesh(new THREE.BoxGeometry(T.tw*0.9,0.05,0.04),steelMat,N);
      const guideTeeth=isSturer?new THREE.InstancedMesh(new THREE.BoxGeometry(0.14,0.11,0.075),steelMat,N):null;
      [links,grousers,guideTeeth].filter(Boolean).forEach(m=>{m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;tank.add(m);});
      let trackSupports=[];
      const lowerTrackY=z=>{
        if(!isPanther||!sideWheelPositions.length)return trackY-Rp;
        for(let i=0;i<trackSupports.length-1;i++)if(z<=trackSupports[i+1].z){
          const a=trackSupports[i],b=trackSupports[i+1],t=THREE.MathUtils.clamp((z-a.z)/(b.z-a.z),0,1);
          return THREE.MathUtils.lerp(a.y,b.y,t);
        }
        return trackY-Rp;
      };
      const place=dist=>{
        if(isPanther)trackSupports=[{z:T.zi,y:trackY-Rp},...sideWheelPositions.map(w=>({z:w.z,y:w.group.position.y-Rp})),{z:T.zs,y:trackY-Rp}];
        for(let i=0;i<N;i++){
          const u=(((i*Lt/N-dist)%Lt)+Lt)%Lt; let z,y,al;
          if(u<Lb){
            z=T.zi+u;y=lowerTrackY(z);al=0;
            if(isPanther){const before=lowerTrackY(z-0.07),after=lowerTrackY(z+0.07);al=Math.atan2(after-before,0.14);}
          }
          else if(u<Lb+La){const f=(u-Lb)/Rp-Math.PI/2;z=T.zs+Rp*Math.cos(f);y=trackY+Rp*Math.sin(f);al=Math.atan2(Math.cos(f),-Math.sin(f));}
          else if(u<2*Lb+La){z=T.zs-(u-Lb-La);y=trackY+Rp;al=Math.PI;}
          else{const f=(u-2*Lb-La)/Rp+Math.PI/2;z=T.zi+Rp*Math.cos(f);y=trackY+Rp*Math.sin(f);al=Math.atan2(Math.cos(f),-Math.sin(f));}
          dummy.position.set(x,y,z); dummy.rotation.set(-al,0,0); dummy.updateMatrix(); links.setMatrixAt(i,dummy.matrix);
          dummy.translateY(-0.04); dummy.updateMatrix(); grousers.setMatrixAt(i,dummy.matrix);
          if(guideTeeth){dummy.position.set(x-side*T.tw*0.24,y+0.025,z);dummy.rotation.set(-al,0,0);dummy.updateMatrix();guideTeeth.setMatrixAt(i,dummy.matrix);}
        }
        links.instanceMatrix.needsUpdate=true; grousers.instanceMatrix.needsUpdate=true;
        if(guideTeeth)guideTeeth.instanceMatrix.needsUpdate=true;
      };
      place(0);
      const spinners=[]; const armUpdaters=[];
      const spin=(wx,wz,r,build)=>{const g=new THREE.Group(); g.position.set(wx,trackY,wz); tank.add(g); build(g); spinners.push([g,r]); return g;};
      const n=(isFV4005||isT54E1||isT72||isChallenger1||isK1)?6:(isIS7||isLeo||isM1)?7:8;
      const FV_STATIONS=[-1.64,-0.96,-0.32,0.36,1.0,1.68]; // Horstmann bogie pairs
      const T72_STATIONS=[1.95,1.17,0.39,-0.47,-1.33,-2.11].map(z=>z/1.3); // wider gaps between wheels 3-4-5 (a T-72 spotting feature)
      const M1_STATIONS=[-2.01,-1.46,-0.91,-0.36,0.19,0.74,1.46].map(z=>z*M1_ZK); // 7 road wheels, wider gap behind the front pair
      const K1_STATIONS=[2.15,1.29,0.43,-0.43,-1.29,-2.15].map(z=>ku(z)); // 6 road wheels - exact spacing not published, evenly spaced pending a side-view reference check
      for(let i=0;i<n;i++){
        const z=(isFV4005||isChallenger1)?FV_STATIONS[i]:isT72?T72_STATIONS[i]:isM1?M1_STATIONS[i]:isK1?K1_STATIONS[i]:T.z0+i*(T.z1-T.z0)/(n-1), wx=x+side*((isFV4005||isT54E1||isLeo||isM1||isT72||isChallenger1||isK1)?0:(i%2?-1:1)*T.tw*0.17);
        const wheelGroup=spin(wx,z,T.Rw,g=>{
          if(isSturer){
            // Paired, slightly interleaved Emil road wheels with separate rims and hubs.
            [-1,1].forEach(pair=>{
              const px=pair*0.09, wheelR=T.Rw-0.055;
              addMesh(new THREE.CylinderGeometry(wheelR,wheelR,0.12,24),steelMat,g,px,0,0,0,0,Math.PI/2);
              addMesh(new THREE.TorusGeometry(wheelR-0.018,0.026,8,24),darkMat,g,px+side*0.065,0,0,0,Math.PI/2,0);
              addMesh(new THREE.CylinderGeometry(0.13,0.13,0.145,16),detailMat,g,px+side*0.067,0,0,0,0,Math.PI/2);
              addMesh(new THREE.CylinderGeometry(0.075,0.075,0.16,12),steelMat,g,px+side*0.074,0,0,0,0,Math.PI/2);
            });
            for(let k=0;k<8;k++){const t=k/8*Math.PI*2; addMesh(new THREE.CylinderGeometry(0.022,0.022,0.045,6),steelMat,g,side*0.17,Math.sin(t)*0.2,Math.cos(t)*0.2,0,0,Math.PI/2);}
          } else if(isT72){
            // T-72 road wheel: two rubber-tyred cast discs (750 mm over the tyres) either side of the track guide horns, with a ring of
            // lightening holes and a shared hub cap.
            const R=T.Rw-0.005;
            [-1,1].forEach(pair=>{
              const px=pair*0.12;
              addMesh(new THREE.CylinderGeometry(R,R,0.09,30),darkMat,g,px,0,0,0,0,Math.PI/2);                          // rubber tyre
              addMesh(new THREE.CylinderGeometry(R*0.8,R*0.8,0.105,28),steelMat,g,px+side*0.004,0,0,0,0,Math.PI/2);    // steel rim disc
              for(let k=0;k<6;k++){const t=k/6*Math.PI*2+0.26; addMesh(new THREE.CylinderGeometry(0.03,0.03,0.02,8),darkMat,g,px+side*0.056,Math.sin(t)*R*0.52,Math.cos(t)*R*0.52,0,0,Math.PI/2);}
            });
            addMesh(new THREE.CylinderGeometry(R*0.36,R*0.36,0.29,18),detailMat,g,0,0,0,0,0,Math.PI/2);
            addMesh(new THREE.CylinderGeometry(0.075,0.075,0.34,12),steelMat,g,0,0,0,0,0,Math.PI/2);
          } else if(isIS7||isFV4005||isChallenger1){
            // IS-7: seven double road wheels. FV4005/Challenger 1: six Centurion/Chieftain-family double road wheels: two dished steel
            // discs per station, each with a rubber-lined rim band, a raised dish and a hub cap.
            const faceR=T.Rw-0.03;
            [-1,1].forEach(pair=>{
              const px=pair*0.1;
              addMesh(new THREE.CylinderGeometry(faceR,faceR,0.1,28),steelMat,g,px,0,0,0,0,Math.PI/2);
              addMesh(new THREE.TorusGeometry(faceR-0.01,0.03,8,28),darkMat,g,px+side*0.045,0,0,0,Math.PI/2,0);
              addMesh(new THREE.CylinderGeometry(faceR*0.62,faceR*0.62,0.115,24),detailMat,g,px+side*0.012,0,0,0,0,Math.PI/2);
              addMesh(new THREE.CylinderGeometry(0.1,0.1,0.14,14),steelMat,g,px+side*0.04,0,0,0,0,Math.PI/2);
            });
          } else if(isLeo||isM1||isK1){
            // Leopard 1 / M1 / K1 road wheel station: two rubber-tyred wheels on dished steel discs either side of
            // the track guide horns, bolted to a common hub. (K1 sources describe "dual rubber-tyred roadwheels",
            // matching this style; exact dish/hub shape not published.)
            const R=T.Rw-0.02;
            [-1,1].forEach(pair=>{
              const px=pair*0.115;
              addMesh(new THREE.CylinderGeometry(R,R,0.1,26),darkMat,g,px,0,0,0,0,Math.PI/2);                          // rubber tyre
              addMesh(new THREE.CylinderGeometry(R*0.74,R*0.74,0.112,24),steelMat,g,px+side*0.006,0,0,0,0,Math.PI/2);  // steel disc
              addMesh(new THREE.CylinderGeometry(R*0.4,R*0.4,0.13,16),detailMat,g,px+side*0.02,0,0,0,0,Math.PI/2);     // dished centre
              for(let k=0;k<8;k++){const t=k/8*Math.PI*2; addMesh(new THREE.CylinderGeometry(0.014,0.014,0.03,6),steelMat,g,px+side*0.07,Math.sin(t)*R*0.56,Math.cos(t)*R*0.56,0,0,Math.PI/2);}
            });
            addMesh(new THREE.CylinderGeometry(0.07,0.07,0.34,12),steelMat,g,0,0,0,0,0,Math.PI/2);                       // hub
          } else if(isAMX50){
            // AMX 50 road wheel: a big dished steel disc with a rubber band on each rim face, a lightened
            // centre, bolt ring and hub cap. Neighbouring wheels sit alternately inboard/outboard so they overlap.
            const R=T.Rw-0.02;
            addMesh(new THREE.CylinderGeometry(R,R,0.08,32),steelMat,g,0,0,0,0,0,Math.PI/2);
            [-1,1].forEach(pr=>addMesh(new THREE.TorusGeometry(R-0.03,0.036,8,32),darkMat,g,pr*0.046,0,0,0,Math.PI/2,0));
            addMesh(new THREE.CylinderGeometry(R*0.64,R*0.64,0.105,26),detailMat,g,side*0.012,0,0,0,0,Math.PI/2);
            addMesh(new THREE.CylinderGeometry(R*0.3,R*0.3,0.13,18),steelMat,g,side*0.03,0,0,0,0,Math.PI/2);
            for(let k=0;k<8;k++){const t=k/8*Math.PI*2; addMesh(new THREE.CylinderGeometry(0.024,0.024,0.03,6),darkMat,g,side*0.052,Math.sin(t)*R*0.46,Math.cos(t)*R*0.46,0,0,Math.PI/2);}
            for(let k=0;k<6;k++){const t=k/6*Math.PI*2+0.26; addMesh(new THREE.CylinderGeometry(0.045,0.045,0.09,10),darkMat,g,0,Math.sin(t)*R*0.78,Math.cos(t)*R*0.78,0,0,Math.PI/2);} // lightening holes
          } else if(isT54E1){
            // M48 road wheel: two rubber tyres on a shared dished steel centre, lightening holes round the
            // outer face and a bolted hub cap.
            const R=T.Rw-0.02;
            [-1,1].forEach(pr=>{
              const px=pr*0.12;
              addMesh(new THREE.CylinderGeometry(R,R,0.11,28),darkMat,g,px,0,0,0,0,Math.PI/2);
              addMesh(new THREE.CylinderGeometry(R*0.74,R*0.74,0.125,24),steelMat,g,px+side*0.006,0,0,0,0,Math.PI/2);
            });
            addMesh(new THREE.CylinderGeometry(R*0.5,R*0.5,0.17,18),detailMat,g,0,0,0,0,0,Math.PI/2);
            addMesh(new THREE.CylinderGeometry(0.12,0.12,0.06,16),steelMat,g,side*0.2,0,0,0,0,Math.PI/2);
            for(let k=0;k<8;k++){const t=k/8*Math.PI*2; addMesh(new THREE.CylinderGeometry(0.032,0.032,0.03,8),darkMat,g,side*0.205,Math.sin(t)*R*0.54,Math.cos(t)*R*0.54,0,0,Math.PI/2);}
          } else {
            addMesh(new THREE.CylinderGeometry(T.Rw-0.05,T.Rw-0.05,0.16,20),steelMat,g,0,0,0,0,0,Math.PI/2);
            addMesh(new THREE.TorusGeometry(T.Rw-0.035,0.05,8,24),darkMat,g,0,0,0,0,Math.PI/2,0);
            addMesh(new THREE.CylinderGeometry(0.11,0.11,0.2,12),detailMat,g,0,0,0,0,0,Math.PI/2);
            for(let k=0;k<6;k++){const t=k/6*Math.PI*2; addMesh(new THREE.CylinderGeometry(0.022,0.022,0.05,6),steelMat,g,side*0.1,Math.sin(t)*0.07,Math.cos(t)*0.07,0,0,Math.PI/2);}
          }
        });
        if(isPanther){const wheelPos={x:wx,z,radius:T.Rw,group:wheelGroup,side};wheelPositions.push(wheelPos);sideWheelPositions.push(wheelPos);}
        if(isLeo||isM1||isT72||isK1){
          // Torsion-bar trailing arm: it pivots on the hull wall AHEAD of the wheel and carries the hub, so as the
          // sprung wheel rides up and down over bumps the arm visibly swings with it.
          const arm=box(tank,detailMat,0,0,0,0.075,0.085,1);
          const pivot=new THREE.Vector3(side*0.79,trackY-0.05,z+0.34), hub=new THREE.Vector3(side*0.82,0,z);
          const mid=new THREE.Vector3(), d=new THREE.Vector3(), zAxis=new THREE.Vector3(0,0,1);
          armUpdaters.push(()=>{
            hub.y=wheelGroup.position.y; d.subVectors(hub,pivot); const len=Math.max(0.05,d.length());
            mid.addVectors(hub,pivot).multiplyScalar(0.5); arm.position.copy(mid); arm.scale.z=len;
            arm.quaternion.setFromUnitVectors(zAxis,d.multiplyScalar(1/len));
          });
          // Bump stop on the hull above each station.
          box(tank,steelMat,side*0.78,trackY+0.17,z,0.06,0.06,0.1);
        }
        if(isSturer){
          // Bogie swing arms and dampers sit between the Emil's larger road wheels.
          const armZ=z+(i%2?0.12:-0.12);
          box(tank,detailMat,side*(T.x+0.12),trackY+0.18,armZ,0.1,0.1,0.46,side*(i%2?-0.34:0.34));
          box(tank,steelMat,side*(T.x+0.13),trackY+0.3,armZ+(i%2?0.12:-0.12),0.07,0.07,0.28,side*(i%2?0.55:-0.55));
        }
      }
      [[T.zs,T.Rs,!rearDrive],[T.zi,T.Ri,rearDrive]].forEach(([wz,wr,drive])=>spin(x,wz,wr,g=>{
        addMesh(new THREE.CylinderGeometry(wr,wr,0.16,24),darkMat,g,0,0,0,0,0,Math.PI/2);
        addMesh(new THREE.CylinderGeometry(0.14,0.14,0.24,12),detailMat,g,0,0,0,0,0,Math.PI/2);
        for(let k=0;k<8;k++){const t=k/8*Math.PI*2; addMesh(new THREE.CylinderGeometry(0.022,0.022,0.05,6),steelMat,g,side*0.1,Math.sin(t)*0.2,Math.cos(t)*0.2,0,0,Math.PI/2);}
        if(drive) for(let k=0;k<16;k++){const t=k/16*Math.PI*2; box(g,steelMat,0,Math.sin(t)*(wr+0.02),Math.cos(t)*(wr+0.02),T.tw*0.4,0.1,0.09,t);}
      }));
      (isT72?[1.56/1.3,-0.04/1.3,-1.72/1.3]:isM1?[-0.75*M1_ZK,0.95*M1_ZK]:isK1?[ku(1.4),ku(-1.4)]:isT54E1?[-1.7,-0.85,0,0.85,1.7]:(isAMX50||isLeo)?[-1.55,-0.52,0.52,1.55]:[-1.3,0,1.3]).forEach(rz=>{
        addMesh(new THREE.CylinderGeometry(0.09,0.09,0.14,12),steelMat,tank,x,trackY+Rp-0.125,rz,0,0,Math.PI/2);
        if(isT54E1||isAMX50||isLeo||isM1||isK1) box(tank,detailMat,x-side*(T.tw/2+0.06),trackY+Rp-0.09,rz,0.08,0.16,0.1); // roller bracket on the hull side
      });
      let dist=0;
      trackSides.push({side,step:d=>{ if(d)dist+=d; if(d||isPanther)place(dist); spinners.forEach(([g,r])=>{g.rotation.x=dist/r;}); armUpdaters.forEach(f=>f()); }});
      if(isTiger){
        // Mudguards ride just above the track's top — anchored to the track's own
        // height (trackY+Rp) instead of a fixed y, so they still clear it now that
        // the track loop is taller and don't get poked through by it.
        const guardY = trackY + Rp + 0.09;
        armorBox(tank,hullMat,side*1.98,guardY,2.5,0.36,0.04,0.8,16,'fender',0.35); // front mudguard
        box(tank,hullMat,side*1.98,guardY+0.02,-2.5,0.36,0.04,0.5,-0.3);            // rear flap
      } else if(isFV4005){
        // Centurion side skirts: five thin hinged panels that hide the top of the wheels and
        // the upper track run, a nose-up front mudguard and a short rear mudguard.
        const skirtZ0=-2.0, skirtPitch=0.824, skirtLen=0.774;
        for(let i=0;i<5;i++){
          const zc=skirtZ0+i*skirtPitch+skirtLen/2;
          armorBox(hullGroup,hullMat,side*1.31,0.89,zc,0.04,0.54,skirtLen,6,'fender');
          box(hullGroup,hullMat,side*1.33,1.17,zc,0.07,0.03,skirtLen);                       // rolled top lip
          [-1,1].forEach(e=>box(hullGroup,steelMat,side*1.34,0.89,zc+e*(skirtLen/2-0.02),0.02,0.54,0.04)); // edge stiffeners
          box(hullGroup,steelMat,side*1.34,0.86,zc,0.02,0.07,0.16);                           // latch
        }
        box(hullGroup,hullMat,side*1.02,1.00,2.60,0.62,0.04,0.95,-0.16);
        box(hullGroup,hullMat,side*1.02,0.98,-2.55,0.62,0.04,0.6,0.08);
      } else if(isChallenger1){
        // Mk 3 up-armoured side skirts: five big slab panels (0.07 m thick, 0.60 m tall) hung from the track guard over the top of the road
        // wheels, with rolled top lips, end stiffeners, hinge pins and lifting handles. Overall width over the skirts is 3.52 m. Sloped
        // front mudguards (with rubber flaps) and rear fenders finish the track covers.
        for(let i=0;i<5;i++){
          const zc=-2.55+i*1.15, len=1.1;
          const pz=c1z(zc), px=side*c1x(1.73);
          armorBox(tank,hullMat,px,c1y(0.86),pz,c1x(0.07),c1y(0.6),c1z(len),25,'fender');
          b1(tank,hullMat,side*1.72,1.18,zc,0.12,0.04,len);
          [-1,1].forEach(e=>b1(tank,steelMat,side*1.77,0.86,zc+e*(len/2-0.03),0.03,0.6,0.05));
          b1(tank,steelMat,side*1.77,0.62,zc,0.03,0.06,0.2);
          [-0.3,0.3].forEach(dz=>b1(tank,darkMat,side*1.775,0.98,zc+dz,0.015,0.05,0.12));
          cy1(tank,steelMat,0.015,0.015,0.55,side*1.77,0.86,zc-len/2+0.02,0,0,0,6);
        }
        b1(tank,hullMat,side*1.63,1.04,-0.45,0.28,0.04,5.2);                             // track guard over the upper run
        b1(tank,hullMat,side*1.60,1.07,3.3,0.4,0.04,0.9,0.14);                           // front mudguard, tipped down at the nose
        b1(tank,darkMat,side*1.60,0.86,3.78,0.4,0.36,0.03,0.12);                         // front rubber mud flap
        b1(tank,hullMat,side*1.58,1.03,-3.55,0.38,0.04,0.7,-0.1);                        // rear fender
        b1(tank,darkMat,side*1.58,0.82,-3.92,0.38,0.38,0.03,-0.08);                      // rear mud flap
      } else if(isT54E1){
        // M48 fenders: flat plates over the track run with a rolled outer lip, a sloped front mudguard and a
        // short rear flap. They sit above the sprung track, so the suspension never pushes through them.
        armorBox(tank,hullMat,side*1.15,1.03,-0.45,0.64,0.04,4.3,6,'fender');
        box(tank,hullMat,side*1.46,1.05,-0.45,0.05,0.07,4.3);
        box(tank,hullMat,side*1.15,0.98,2.1,0.64,0.04,0.95,0.2);
        box(tank,hullMat,side*1.46,1.0,2.1,0.05,0.07,0.95,0.2);
        box(tank,hullMat,side*1.15,0.92,-2.78,0.64,0.04,0.42,-0.35);
      } else if(isLeo){
        // Leopard 1 side skirts: five hinged rectangular panels hiding the top half of the wheels and the upper
        // track run. They are visual only (thin sheet), so shells meet the 35 mm hull side behind them. Sloped
        // front mudguards and a short rear flap complete the fenders.
        const sk0=-2.0, pitch=0.8, len=0.76;
        for(let i=0;i<5;i++){
          const zc=sk0+i*pitch+len/2;
          box(tank,hullMat,side*1.31,0.74,zc,0.035,0.5,len);
          box(tank,hullMat,side*1.335,0.995,zc,0.07,0.03,len);
          [-1,1].forEach(e=>box(tank,steelMat,side*1.335,0.74,zc+e*(len/2-0.02),0.02,0.5,0.035));
          box(tank,steelMat,side*1.335,0.62,zc,0.02,0.07,0.16);
        }
        // Front mudguard: flat over the skirt run, then a quarter-ellipse sweep that curves forward and down to
        // about half the track height, wrapping the front of the track like the real Leopard 1.
        {
          const yTop=0.995, yEnd=0.42, zStart=1.85, zCurve=2.1, zEnd=2.88, th=0.04, xIn=0.78, xOut=1.35;
          const Rz=zEnd-zCurve, Ry=yTop-yEnd, N=10, shp=new THREE.Shape();
          shp.moveTo(zStart,yTop); shp.lineTo(zCurve,yTop);
          for(let k=1;k<=N;k++){const t=k/N*Math.PI/2; shp.lineTo(zCurve+Rz*Math.sin(t),yEnd+Ry*Math.cos(t));}
          shp.lineTo(zEnd-th,yEnd);
          for(let k=N-1;k>=0;k--){const t=k/N*Math.PI/2; shp.lineTo(zCurve+(Rz-th)*Math.sin(t),yEnd+(Ry-th)*Math.cos(t));}
          shp.lineTo(zStart,yTop-th);
          const fg=new THREE.ExtrudeGeometry(shp,{depth:xOut-xIn,bevelEnabled:false});
          fg.rotateY(-Math.PI/2); // shape x -> world z, extrusion -> world -x
          fg.translate(side>0?xOut:-xIn,0,0);
          const fender=new THREE.Mesh(fg,hullMat); fender.castShadow=true; fender.receiveShadow=true; tank.add(fender);
        }
        box(tank,hullMat,side*1.1,0.9,-2.75,0.64,0.04,0.42,-0.35);
      } else if(isT72){
        // Rubber-fabric side screens hung from the track guards: five hinged panels over the top of the road wheels (visual only,
        // shells meet the 80 mm hull side behind them), with rolled lips, hinges and Kontakt-1 bricks on the front panel. Front and rear
        // fenders carry rubber mud flaps.
        [[-2.5,1.2],[-1.3,1.2],[-0.1,1.2],[1.1,1.2],[2.3,1.2]].forEach(([zc,len],i)=>{
          b72(tank,hullMat,side*1.77,0.87,zc,0.05,0.5,len-0.04);
          b72(tank,hullMat,side*1.79,1.13,zc,0.09,0.03,len-0.04);
          b72(tank,darkMat,side*1.80,0.80,zc,0.012,0.04,len*0.8);
          [-1,1].forEach(e=>b72(tank,steelMat,side*1.795,0.87,zc+e*(len/2-0.04),0.02,0.5,0.04));
          b72(tank,steelMat,side*1.795,0.68,zc,0.02,0.06,0.14);
        });
        // Kontakt-1 bricks on the front two skirt panels (the real T-72B's side-skirt ERA array runs further back than just the nose panel).
        [1.9,2.3,2.7,0.7,1.1,1.5].forEach(zc=>[-1,1].forEach(dy=>b72(tank,hullMat,side*1.81,0.87+dy*0.13,zc,0.07,0.2,0.34)));
        b72(tank,hullMat,side*1.63,1.04,-0.5,0.3,0.035,5.2);                        // track guard over the upper run
        b72(tank,hullMat,side*1.62,1.06,3.1,0.36,0.035,0.8,0.16);                   // front fender, tipped down at the nose
        b72(tank,darkMat,side*1.62,0.84,3.5,0.36,0.34,0.03,0.12);                   // front rubber mud flap
        b72(tank,hullMat,side*1.62,1.02,-3.1,0.36,0.035,0.5,-0.2);                  // rear fender
        b72(tank,darkMat,side*1.62,0.78,-3.38,0.36,0.4,0.03,-0.1);                  // rear mud flap
      } else if(isM1){
        // Six hinged skirt panels per side (the two forward ones are thicker special-armour panels), front fenders and rear sand shields.
        [-2.95,-1.98,-1.01,-0.04,0.93,1.9].forEach((zm,i)=>{
          const zc=mZ(zm), len=0.93*M1_ZK/1.4, hgt=0.52/1.3, yc=mYh(1.0)-hgt/2, xs=side*mX(1.80), th=i>=4?0.1:0.045;
          box(tank,hullMat,xs,yc,zc,th,hgt,len);
          box(tank,hullMat,xs+side*0.02,yc+hgt/2,zc,th+0.04,0.03,len);
          box(tank,darkMat,xs+side*(th/2+0.004),yc,zc,0.01,hgt*0.8,0.03);
          box(tank,steelMat,xs+side*(th/2+0.01),yc+hgt*0.3,zc+len*0.38,0.02,0.05,0.05);
        });
        box(tank,hullMat,side*mX(1.55),mYh(0.98),mZ(3.55),mX(0.5),0.03,mZ(0.8),0.12);
        box(tank,hullMat,side*mX(1.62),mYh(0.78),mZ(-3.85),0.05,0.3,0.34);
      } else if(isK1){
        // 2nd pass: the old single 4.3 m panel only spanned the 6-wheel cluster (the wheel stations'
        // own ±2.15 m range), but the hull nose/tail extend to +/-3.7 m - leaving ~1.6 m of bare,
        // unskirted track at each end with nothing visually tying it to the glacis or rear plate. That
        // gap is exactly what made the nose look disconnected/"extending outward" on its own. This
        // version is a run of ~0.5 m panels following the hull's own deck line (k1Roof), covering the
        // track nearly end to end, handing off to the dedicated nose fender/rear-plate fittings only at
        // the very tips.
        const K1_HS=[[-3.96,1.50],[-3.20,1.50],[-1.50,1.50],[-1.42,1.40],[1.70,1.40],[2.90,1.32],[3.45,0.95],[3.97,0.80]].map(([z,y])=>[z*K1_LEN_RATIO,y*K1_HGT_RATIO]);
        const k1Roof=z=>{
          if(z<=K1_HS[0][0]) return K1_HS[0][1];
          for(let i=0;i<K1_HS.length-1;i++){ const a=K1_HS[i], b=K1_HS[i+1]; if(z<=b[0]) return a[1]+(b[1]-a[1])*(z-a[0])/(b[0]-a[0]); }
          return K1_HS[K1_HS.length-1][1];
        };
        // Shorter skirts: they end at z=1.60 where the angular front fender begins (instead of running to the nose) and stop
        // near the rear sprocket (z=-3.0) instead of the tail plate, so the taller tracks show at both ends.
        const panelLen=0.50, zFront=1.60, zRear=-3.0;
        const nPanels=Math.ceil((zFront-zRear)/panelLen), xs=side*ku(1.66);
        // Road wheels (trackY=T.Rb=0.37, Rw=0.33, both real metres pre-ku) span y=0.04 to 0.70. The
        // panel's TOP follows the deck line (hangs from just under the hull at whatever height that is
        // at this z - naturally shorter near the nose as the deck drops, same as real skirt panels), but
        // the BOTTOM is held at a near-constant height so it actually overlaps the wheels instead of
        // hovering entirely above them like the previous version did.
        const yBottom=0.80-K1_DROP_M;   // was 0.48: panels now hang only over the upper part of the (taller) track run, ~0.5 m deep instead of ~0.8 m
        for(let k=0;k<nPanels;k++){
          const z0=zRear+k*panelLen, z1=Math.min(zFront,z0+panelLen), zc=(z0+z1)/2, len=z1-z0;
          const yTop=k1Roof(zc)-0.05-K1_DROP_M, hgt=Math.max(0.22,yTop-yBottom), yc=yTop-hgt/2;
          box(tank,hullMat,xs,ku(yc),ku(zc),ku(0.05),ku(hgt),ku(len));
          box(tank,hullMat,xs+side*0.02,ku(yc+hgt/2),ku(zc),ku(0.09),0.03,ku(len));
          box(tank,darkMat,xs+side*ku(0.035),ku(yc),ku(z0+0.01),ku(0.02),ku(hgt*0.96),ku(0.025));   // hinge seam at the panel's rear edge
          box(tank,detailMat,xs+side*ku(0.045),ku(yc+hgt*0.2),ku(zc),ku(0.03),ku(0.05),ku(0.12));    // lifting handle
        }
      } else if(isAMX50){
        // Short sloped front mudguards over the track and a stub rear flap; the long overhanging hull covers the rest.
        box(tank,hullMat,side*1.04,0.9,2.3,0.56,0.04,0.8,0.22);
        box(tank,hullMat,side*1.31,0.92,2.3,0.04,0.07,0.8,0.22);
        box(tank,hullMat,side*1.04,0.88,-2.78,0.56,0.04,0.4,-0.35);
      } else if(!isSturer){
        // armour plate seams, shoulder rail and tow cable dress the hull side
        [-1.7,-0.6,0.5,1.6].forEach(z=>box(tank,detailMat,side*1.61,0.77,z,0.02,0.2,0.04));
        box(tank,detailMat,side*1.33,1.22,0,0.03,0.05,4.6);
        box(tank,darkMat,side*1.45,1.08,0,0.05,0.05,3.8);
      }
    });
    // vL/vR: linear speed of the left (+x) and right (-x) track in units/sec
    const updateTracks=(vL,vR,dt)=>trackSides.forEach(t=>t.step((t.side>0?vL:vR)*dt));

    // Rear engine deck, access covers, exhausts, and front fittings.
    const exhaustPoints = []; // world-tracked mouths of the exhaust stacks, for smoke spawning
    {
      const tank = hullGroup; // shadow: these sit on the hull roof/glacis, stretch with the hull
      if(!isSturer && !isIS7 && !isFV4005 && !isT54E1 && !isAMX50 && !isLeo && !isM1 && !isT72 && !isChallenger1 && !isK1) armorBox(tank,hullMat,0,isTiger?1.56:1.36,-1.72,1.7,0.12,1.15,isTiger?25:16,'engine-deck');
      if(isSturer) armorBox(tank,hullMat,0,1.24,-1.96,1.55,0.12,0.95,16,'engine-deck');
      if(!isIS7 && !isFV4005 && !isT54E1 && !isAMX50 && !isLeo && !isM1 && !isT72 && !isChallenger1 && !isK1) [-0.48,0.48].forEach(x=>{
        addMesh(new THREE.CylinderGeometry(0.16,0.16,0.38,10),steelMat,tank,x,0.58,-2.52);
        box(tank,detailMat,x,isTiger?1.54:1.37,isTiger?-2.2:-1.55,0.38,0.07,0.48);
      });
      if(!isIS7 && !isFV4005 && !isT54E1 && !isAMX50 && !isLeo && !isM1 && !isT72 && !isChallenger1 && !isK1) box(tank,steelMat,0,0.48,2.79,1.12,0.16,0.16);
      // Headlamps sit high on the front corners.
      if(!isSturer && !isIS7 && !isFV4005 && !isT54E1 && !isAMX50 && !isLeo && !isM1 && !isT72 && !isChallenger1 && !isK1) [-0.88,0.88].forEach(x=>{
        addMesh(new THREE.CylinderGeometry(0.11,0.11,0.1,12),steelMat,tank,x,isTiger?1.07:1.38,isTiger?2.35:2.2,isTiger?0:Math.PI/2,0,0);
      });
      // Twin exhaust stacks: bigger open half-cylinders mounted flush against the
      // rear hull plate (not lying on the engine deck), rising up it. Flat cut
      // faces forward into the plate; rounded face bulges out the back. Smoke
      // spawns from the marker object at each mouth, driven from the main game loop.
      if(isM1){ const mouth=new THREE.Object3D(); mouth.position.set(0,mYh(1.5)+0.09,-2.8*M1_ZK); tank.add(mouth); exhaustPoints.push(mouth); }
      if(isT72){ const mouth=new THREE.Object3D(); mouth.position.set(u72(-1.08),u72(1.27),u72(-3.5)); tank.add(mouth); exhaustPoints.push(mouth); } // T-72 single exhaust, left rear
      if(isK1){ const mouth=new THREE.Object3D(); mouth.position.set(ku(-1.1),ku(1.3*K1_HGT_RATIO),ku(-3.5*K1_LEN_RATIO)); tank.add(mouth); exhaustPoints.push(mouth); } // placeholder single exhaust point - the Leopard 2-style grille fittings mentioned in sources are a later pass
      if(isK1){
        // ================= K1 HULL FITTINGS (stage 2) =================
        // Driver front-LEFT with a one-piece hatch and a block of three periscopes; the front corner lamp clusters; tow lugs and
        // two tow cables on the nose; an MTU radiator grille (left) and exhaust grille (right) on the raised rear deck; rear tow
        // lugs, pintle and tail lamps; a whip antenna on the left rear corner. In game space +x = the tank's left.
        const hb=(mat,x,y,z,w,h,d,rx=0,ry=0,rz=0)=>box(tank,mat,ku(x),ku(y),ku(z),ku(w),ku(h),ku(d),rx,ry,rz);
        const hc=(mat,rt,rb,len,x,y,z,rx=0,ry=0,rz=0,seg=16)=>addMesh(new THREE.CylinderGeometry(ku(rt),ku(rb),ku(len),seg),mat,tank,ku(x),ku(y),ku(z),rx,ry,rz);
        const HS=[[-3.96,1.50],[-3.20,1.50],[-1.50,1.50],[-1.42,1.40],[1.723,1.398],[2.836,1.311],[2.947,0.978]].map(([z,y])=>[z*K1_LEN_RATIO,y*K1_HGT_RATIO]); // the hull's own deck line
        const hroof=z=>{
          if(z<=HS[0][0]) return HS[0][1];
          for(let i=0;i<HS.length-1;i++){ const a=HS[i], b=HS[i+1]; if(z<=b[0]) return a[1]+(b[1]-a[1])*(z-a[0])/(b[0]-a[0]); }
          return HS[HS.length-1][1];
        };
        const redMat=new THREE.MeshStandardMaterial({color:0x7a2a22,roughness:0.8});
        // Driver's hatch
        { const dx=0.62, dz=2.42, y=hroof(dz);
          hc(hullMat,0.31,0.33,0.07,dx,y+0.035,dz,0,0,0,24);
          hc(hullMat,0.28,0.28,0.04,dx,y+0.09,dz,0,0,0,24);
          hb(steelMat,dx,y+0.125,dz-0.05,0.12,0.03,0.03);
          hb(detailMat,dx,y+0.085,dz-0.31,0.20,0.05,0.05);
          hb(hullMat,dx,y+0.14,dz+0.22,0.56,0.09,0.12);
          for(let i=-1;i<=1;i++) hb(darkMat,dx+i*0.17,y+0.145,dz+0.285,0.12,0.05,0.02);
        }
        // Front corner lamp clusters with guards
        const k1FenderY=z=>1.06+K1_DROP_M-0.052*(z-1.60);   // underside height of the front fender plate at z (it tilts ~3 deg down toward the nose, above the taller track)
        [-1,1].forEach(s=>{
          const lx=s*1.58, lz=2.64, fy=k1FenderY(lz)+0.05;   // lamp cluster now sits on top of the fender plate
          hb(detailMat,lx,fy+0.07,lz,0.18,0.14,0.14);
          hb(darkMat,lx,fy+0.07,lz+0.08,0.13,0.09,0.02);
          hb(steelMat,lx,fy+0.15,lz,0.20,0.02,0.16);
        });
        // Nose tow lugs, shackles and the two tow cables laid up the glacis
        [-1,1].forEach(s=>{
          hb(steelMat,s*0.75,0.93,2.74,0.16,0.14,0.10);
          addMesh(new THREE.TorusGeometry(ku(0.065),ku(0.018),6,12),steelMat,tank,ku(s*0.75),ku(0.86),ku(2.81),0,Math.PI/2,0);
          const cab=[[s*0.75,0.97,2.77],[s*0.75,1.26,2.68],[s*0.75,1.29,2.25]];
          for(let k=0;k<2;k++) beamBetween(tank,darkMat,cab[k].map(ku),cab[k+1].map(ku),ku(0.028),6);
        });
        // Rear deck: radiator-fan grille (left) and exhaust louvres (right), kept flush so the turret bustle clears them
        { const y=hroof(-2.5);
          hb(detailMat,0.62,y+0.012,-2.55,1.05,0.024,1.15);
          for(let k=0;k<8;k++) hb(darkMat,0.62,y+0.027,-3.05+k*0.143,0.95,0.008,0.06);
          hb(detailMat,-0.62,y+0.012,-3.05,1.00,0.024,0.95);
          for(let k=0;k<6;k++) hb(darkMat,-0.62,y+0.027,-3.42+k*0.15,0.90,0.008,0.07);
          hb(darkMat,0,y+0.006,-1.75,2.4,0.008,0.015); hb(darkMat,0,y+0.006,-2.05,2.4,0.008,0.015);   // deck panel seams
          // Left rear whip antenna
          hc(steelMat,0.08,0.10,0.10,1.30,y+0.05,-3.20);
          hc(darkMat,0.012,0.008,2.3,1.30,y+0.10+1.15,-3.20,0,0,0,6);
        }
        // Rear plate: tow lugs, pintle hook, tail lamp clusters
        [-1,1].forEach(s=>{
          hb(steelMat,s*0.95,0.86,-3.79,0.16,0.15,0.10);
          addMesh(new THREE.TorusGeometry(ku(0.065),ku(0.018),6,12),steelMat,tank,ku(s*0.95),ku(0.79),ku(-3.86),0,Math.PI/2,0);
          hb(detailMat,s*1.22,1.22,-3.77,0.18,0.14,0.07); hb(redMat,s*1.22,1.22,-3.815,0.12,0.09,0.02);
        });
        hb(steelMat,0,0.80,-3.82,0.22,0.16,0.12); hb(darkMat,0,0.80,-3.89,0.08,0.10,0.06);
        // Front fender plates (outside the skirt line, sloping down toward the nose)
        // Angular front fenders (replace the old flat slab): a plate with a chamfered front-outer corner and a stepped inner edge that
        // stays outside the hull nose (nothing pokes ahead of the glacis), tilted down toward the nose, with a folded flange under
        // the chamfer and the outer edge so the corner reads as bent sheet metal like the real K1's.
        [-1,1].forEach(s=>{
          const pts=[[1.20,1.60],[1.80,1.60],[1.80,2.45],[1.58,2.92],[1.44,2.92],[1.44,2.78],[1.20,2.78]];
          const shape=new THREE.Shape();
          pts.forEach(([x,z],i)=>{ if(i) shape.lineTo(s*x,-z); else shape.moveTo(s*x,-z); });
          const fg=new THREE.ExtrudeGeometry(shape,{depth:0.05,bevelEnabled:false});
          fg.rotateX(-Math.PI/2);                                  // shape (x,-z) -> world (x,z); extrusion becomes thickness (up)
          const p=fg.attributes.position;
          for(let i=0;i<p.count;i++) p.setY(i,p.getY(i)+k1FenderY(p.getZ(i)));
          p.needsUpdate=true; fg.computeVertexNormals(); fg.scale(ku(1),ku(1),ku(1));
          addMesh(fg,hullMat,tank,0,0,0);
          const cz=(2.45+2.92)/2, cx=(1.80+1.58)/2, len=Math.hypot(0.22,0.47);
          hb(hullMat,s*cx,k1FenderY(cz)-0.025,cz,0.03,0.15,len,0,Math.atan2(-0.22*s,0.47),0);   // chamfer flange
          hb(hullMat,s*1.80,k1FenderY(2.025)-0.025,2.025,0.03,0.15,0.85,0.052,0,0);               // outer-edge flange, tilted with the plate
        });
      }
      if(!isSturer && !isM1 && !isT72 && !isK1){
        const exhaustOuterMat = new THREE.MeshStandardMaterial({color:0x4a463c, roughness:0.92, side:THREE.DoubleSide});
        const exhaustRustMat = new THREE.MeshStandardMaterial({color:0x8a4a22, roughness:0.85, side:THREE.DoubleSide});
        const pipeR = isTiger ? 0.42 : isIS7 ? 0.2 : isFV4005 ? 0.17 : isT54E1 ? 0.15 : isAMX50 ? 0.16 : isLeo ? 0.14 : isChallenger1 ? 0.16 : 0.21;
        const pipeH = isTiger ? 0.85 : isIS7 ? 0.36 : isFV4005 ? 0.5 : isT54E1 ? 0.42 : isAMX50 ? 0.4 : isLeo ? 0.4 : isChallenger1 ? 0.44 : 0.6;
        const pipeBaseY = isTiger ? 0.62 : isIS7 ? 0.68 : isFV4005 ? 0.6 : isT54E1 ? 0.62 : isAMX50 ? 0.6 : isLeo ? 0.62 : isChallenger1 ? 0.6 : 0.68;   // starts partway up the rear plate, not on the roof
        // The pipe's open (flat) edge sits exactly on the hull's rear wall plane, so the
        // rounded belly extends straight back from there with nothing poking through it.
        const wallZ = isTiger ? -2.62 : isIS7 ? -2.97 : isFV4005 ? -2.71 : isT54E1 ? -2.7 : isAMX50 ? -2.7 : isLeo ? -2.72 : isChallenger1 ? -2.92 : -2.68;
        const pipeX = isTiger ? 0.6 : isIS7 ? 0.55 : isFV4005 ? 0.5 : isT54E1 ? 0.5 : isAMX50 ? 0.48 : isLeo ? 0.62 : isChallenger1 ? 0.56 : 0.36;
        [-pipeX,pipeX].forEach(x=>{
          const pipe = new THREE.Mesh(
            new THREE.CylinderGeometry(pipeR,pipeR,pipeH,18,1,true,0,Math.PI),
            exhaustOuterMat
          );
          pipe.position.set(x,pipeBaseY+pipeH/2,wallZ);
          pipe.rotation.y = Math.PI; // opening flush against the wall, rounded face bulges straight out the back
          pipe.castShadow = true; pipe.receiveShadow = true;
          tank.add(pipe);
          const rim = new THREE.Mesh(
            new THREE.CylinderGeometry(pipeR*0.86,pipeR*0.86,pipeH*0.2,18,1,true,0,Math.PI),
            exhaustRustMat
          );
          rim.position.set(x,pipeBaseY+pipeH-pipeH*0.1,wallZ);
          rim.rotation.y = Math.PI;
          tank.add(rim);
          const mouth = new THREE.Object3D();
          mouth.position.set(x,pipeBaseY+pipeH,wallZ-pipeR*0.4);
          tank.add(mouth);
          exhaustPoints.push(mouth);
        });
      }
      if(isSturer){
        // Sturer Emil: twin vertical exhausts on rear hull sides
        const exMat = new THREE.MeshStandardMaterial({color:0x4a463c,roughness:0.92});
        [-0.55,0.55].forEach(x=>{
          addMesh(new THREE.CylinderGeometry(0.12,0.12,0.65,10),exMat,tank,x,0.92,-2.48,0,0,0);
          addMesh(new THREE.CylinderGeometry(0.14,0.12,0.08,10),exMat,tank,x,1.24,-2.48,0,0,0);
          const mouth = new THREE.Object3D();
          mouth.position.set(x,1.3,-2.48);
          tank.add(mouth);
          exhaustPoints.push(mouth);
        });
      }
    }

    const turretPivot = new THREE.Group();
    let gunTraversePivot = null; // casemate traverse pivot (Sturer only)
    // T54E1 oscillating turret: t54Upper is the pitching upper half, gunSlide the recoiling gun inside it.
    // The trunnion axis (= gun axis) is at (0,T54_PY,T54_PZ) in turret space.
    let t54Upper=null, gunSlide=null; const T54_PY=isAMX50?0.78:0.37, T54_PZ=isAMX50?0.5:0.3; // trunnion axis of the oscillating turrets (T54E1 and AMX 50) - raised AMX barrel
    const turretMountY = isT72 ? u72(1.32) : isM1 ? mYh(1.40) : isK1 ? ku(1.40*K1_HGT_RATIO) : isTiger ? 1.38 : isSturer ? 1.18 : isIS7 ? 1.03 : isFV4005 ? 1.30 : isT54E1 ? 1.24 : isAMX50 ? 1.06 : isLeo ? 1.06 : isChallenger1 ? c1y(1.42) : 1.21;
    turretPivot.position.y = hullBaseY + (turretMountY - hullBaseY) * hullLift - K1_BODY_DROP;
    if(!isTiger && !isSturer && !isIS7 && !isFV4005 && !isT54E1 && !isAMX50 && !isLeo && !isM1 && !isT72 && !isChallenger1 && !isK1){ turretPivot.position.z = 0.75; turretPivot.scale.setScalar(1.15); }
    if(isSturer){ turretPivot.position.z = -0.22; } // casemate sits slightly rearward
    if(isIS7){ turretPivot.position.z = 0.15; } // IS-7 turret slightly forward
    if(isFV4005){ turretPivot.position.z = 0.1; } // Stage II turret is centered over the fighting compartment.
    if(isT54E1){ turretPivot.position.z = 0.18; } // T54E1 turret slightly forward
    if(isM1){ turretPivot.position.z = 0.2*M1_ZK; } // M1 turret ring just ahead of amidships
    if(isK1){ turretPivot.position.z = ku(0.2*K1_LEN_RATIO); } // mirrors the M1's ring position, scaled
    if(isT72){ turretPivot.position.z = u72(0.2); } // T-72 turret ring centre 0.2 m ahead of the hull middle
    if(isLeo){ turretPivot.position.z = 0.25; } // Leopard 1 turret ring sits just ahead of amidships
    if(isAMX50){ turretPivot.position.z = 0.5; } // the AMX 50's turret sits well ahead of amidships
    if(isChallenger1){ turretPivot.position.z = c1z(0.5); } // Challenger 1 turret ring centred over the fighting compartment
    tank.add(turretPivot);

    if(isSturer){
      // The turretPivot IS the fixed superstructure (already built as hull plates in makeHull).
      // We add a gunTraversePivot for the ±10° gun traverse.
      gunTraversePivot = new THREE.Group();
      gunTraversePivot.position.set(0, 0.65, 1.1); // Raised trunnions keep the breech above the floor at full depression.
      turretPivot.add(gunTraversePivot);
      // Gun mantlet: large bolted collar housing the 128mm gun
      markArmor(addMesh(new THREE.CylinderGeometry(0.42,0.42,0.62,20),turretMat,gunTraversePivot,0,0,0.08,0,0,Math.PI/2),()=>({t:50,zone:'mantlet'}));
      // Mantlet side shields
      box(gunTraversePivot,hullMat,-0.32,0,0.06,0.06,0.52,0.42);
      box(gunTraversePivot,hullMat, 0.32,0,0.06,0.06,0.52,0.42);
    } else if(isIS7){
      // Turret body lives in its own group so the whole casting can be scaled as one piece.
      const tb=new THREE.Group(); tb.scale.setScalar(0.88); turretPivot.add(tb);
      // The IS-7 casting is an elongated rounded rectangle in plan, not a circle.
      // Build a capsule footprint: straight side runs with fully rounded front/rear ends.
      const capsuleShape=(radius,halfStraight)=>{
        const shape=new THREE.Shape();
        shape.moveTo(-radius,-halfStraight);
        shape.lineTo(-radius,halfStraight);
        shape.absarc(0,halfStraight,radius,Math.PI,0,true);
        shape.lineTo(radius,-halfStraight);
        shape.absarc(0,-halfStraight,radius,0,-Math.PI,true);
        shape.closePath();
        return shape;
      };
      const turretRadius=1.24,turretHalfStraight=0.78,turretZ=-0.08;
      // Loft matching capsule rings into a low cast dome so the top view stays
      // oblong while the side profile slopes smoothly instead of reading as a box.
      const capsulePerimeter=(radius,halfStraight)=>{
        const points=[];
        for(let i=0;i<=8;i++)points.push(new THREE.Vector2(-radius,-halfStraight+2*halfStraight*i/8));
        for(let i=1;i<=24;i++){const a=Math.PI-Math.PI*i/24;points.push(new THREE.Vector2(radius*Math.cos(a),halfStraight+radius*Math.sin(a)));}
        for(let i=1;i<=8;i++)points.push(new THREE.Vector2(radius,halfStraight-2*halfStraight*i/8));
        for(let i=1;i<24;i++){const a=-Math.PI*i/24;points.push(new THREE.Vector2(radius*Math.cos(a),-halfStraight+radius*Math.sin(a)));}
        return points;
      };
      const domeProfile=[
        {y:0.20,r:1.20,h:0.76},{y:0.34,r:1.29,h:0.79},
        {y:0.50,r:1.27,h:0.77},{y:0.68,r:1.17,h:0.69},
        {y:0.84,r:1.00,h:0.57},{y:0.94,r:0.86,h:0.49}
      ];
      const perimeterCount=64,vertices=[],indices=[];
      domeProfile.forEach(ring=>capsulePerimeter(ring.r,ring.h).forEach(p=>vertices.push(p.x,ring.y,p.y+turretZ)));
      for(let ring=0;ring<domeProfile.length-1;ring++)for(let i=0;i<perimeterCount;i++){
        const next=(i+1)%perimeterCount,a=ring*perimeterCount+i,b=ring*perimeterCount+next,c=(ring+1)*perimeterCount+i,d=(ring+1)*perimeterCount+next;
        indices.push(a,b,c,b,d,c);
      }
      const turretGeom=new THREE.BufferGeometry();
      turretGeom.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
      turretGeom.setIndex(indices);turretGeom.computeVertexNormals();
      const turretMesh=new THREE.Mesh(turretGeom,turretMat);
      turretMesh.castShadow=true;turretMesh.receiveShadow=true;tb.add(turretMesh);
      markArmor(turretMesh, n => {
        if(n.y > 0.85) return {t:30, zone:'turret-roof'};
        if(n.z > 0.4) return {t:250, zone:'turret-front'};
        if(n.z < -0.4) return {t:100, zone:'turret-rear'};
        return {t:230, zone:'turret-side'};
      });
      
      // Straight-sided capsule skirt carries the same rounded-rectangle outline.
      const skirtGeom=new THREE.ExtrudeGeometry(capsuleShape(turretRadius,turretHalfStraight),{depth:0.18,bevelEnabled:false,steps:1});
      skirtGeom.rotateX(Math.PI/2);
      const skirt=new THREE.Mesh(skirtGeom,detailMat);
      skirt.position.set(0,0.26,turretZ);skirt.castShadow=true;skirt.receiveShadow=true;tb.add(skirt);
      markArmor(skirt, n => {
        if(n.z > 0.4) return {t:250, zone:'turret-front'};
        if(n.z < -0.4) return {t:100, zone:'turret-rear'};
        return {t:230, zone:'turret-side'};
      });
      // Turret race and lip follow the capsule footprint instead of forming an oval ring.
      const raceGeom=new THREE.ExtrudeGeometry(capsuleShape(1.27,0.77),{depth:0.09,bevelEnabled:false,steps:1});
      raceGeom.rotateX(Math.PI/2);
      const turretRace=new THREE.Mesh(raceGeom,turretMat);turretRace.position.set(0,0.17,turretZ);tb.add(turretRace);
      const lipGeom=new THREE.ExtrudeGeometry(capsuleShape(1.25,0.76),{depth:0.035,bevelEnabled:false,steps:1});
      lipGeom.rotateX(Math.PI/2);
      const castLip=new THREE.Mesh(lipGeom,detailMat);castLip.position.set(0,0.205,turretZ);tb.add(castLip);
      const roofGeom=new THREE.ShapeGeometry(capsuleShape(0.86,0.49),12);
      roofGeom.rotateX(Math.PI/2);
      const roofMesh=new THREE.Mesh(roofGeom,turretMat);roofMesh.position.y=0.94;roofMesh.castShadow=true;roofMesh.receiveShadow=true;tb.add(roofMesh);
      markArmor(roofMesh,()=>({t:30,zone:'turret-roof'}));
      
      // Forward-projecting IS-7 gun mount: a cast mantlet bulb with the distinctive
      // circular trunnion collar visibly wrapped around the barrel at the turret face.
      const mantletMesh=addMesh(new THREE.SphereGeometry(0.48,28,20),turretMat,turretPivot,0,0.40,1.17);
      mantletMesh.scale.set(1.32,1.1,0.82);
      markArmor(mantletMesh,()=>({t:250,zone:'turret-mantlet'}));
      const mantletOuter=addMesh(new THREE.TorusGeometry(0.40,0.095,12,40),detailMat,turretPivot,0,0.40,1.48);
      markArmor(mantletOuter,()=>({t:250,zone:'turret-mantlet'}));
      const mantletInner=addMesh(new THREE.TorusGeometry(0.21,0.06,12,40),turretMat,turretPivot,0,0.40,1.56);
      markArmor(mantletInner,()=>({t:250,zone:'turret-mantlet'}));
      
      // Commander's cupola (rounded)
      addMesh(new THREE.SphereGeometry(0.25,18,12,0,Math.PI*2,0,Math.PI*0.55),detailMat,tb,0.53,0.98,-0.55).scale.set(1.25,0.72,1.35);
      for(let k=0; k<8; k++){
        const a = k/8 * Math.PI * 2;
        box(tb,darkMat,0.53+Math.sin(a)*0.29,1.09,-0.55+Math.cos(a)*0.31,0.12,0.045,0.04,0,a,0);
      }
      
      // Rangefinder housings on turret front
      [-0.38, 0.38].forEach(x => {
        box(tb, detailMat, x, 0.55, 1.52, 0.17, 0.14, 0.2);
      });
      
      // Turret stowage boxes on rear
      [-1,1].forEach(sd=>{
        // Cast cheek seams, lifting lugs and cheek-mounted fittings.
        box(tb,detailMat,sd*1.37,0.25,0.42,0.045,0.2,0.58,0,sd*0.18,0);
      });
      // Two low roof hatches and periscopes break up the smooth casting.
      const hatchA=addMesh(new THREE.CylinderGeometry(0.24,0.26,0.07,20),detailMat,tb,-0.48,0.99,-0.3);
      hatchA.scale.z=1.18;
      addMesh(new THREE.CylinderGeometry(0.16,0.18,0.055,18),steelMat,tb,-0.48,1.035,-0.3);
      const hatchB=addMesh(new THREE.CylinderGeometry(0.2,0.22,0.065,18),detailMat,tb,0.53,0.93,-1.02);
      hatchB.scale.z=1.15;
      [-0.82,-0.15,0.78].forEach(x=>{
        box(tb,detailMat,x,0.98,-0.12,0.16,0.08,0.12);
        box(tb,steelMat,x,1.03,-0.12,0.09,0.025,0.06);
      });
      
      // Roof-mounted DShK: ring, pedestal, receiver, barrel, sights and grips.
      const mgRing=addMesh(new THREE.TorusGeometry(0.24,0.035,8,24),steelMat,tb,-0.46,1.02,0.32);
      mgRing.rotation.x=Math.PI/2;
      addMesh(new THREE.CylinderGeometry(0.055,0.07,0.28,12),darkMat,tb,-0.46,1.03,0.32);
      box(tb,darkMat,-0.46,1.19,0.34,0.16,0.14,0.32);
      addMesh(new THREE.CylinderGeometry(0.028,0.035,0.68,10),steelMat,tb,-0.46,1.19,0.82,Math.PI/2,0,0);
      addMesh(new THREE.CylinderGeometry(0.05,0.05,0.18,10),darkMat,tb,-0.46,1.19,1.19,Math.PI/2,0,0);
      [-1,1].forEach(sd=>box(tb,darkMat,-0.46+sd*0.14,1.12,0.26,0.035,0.12,0.18));
      addMesh(new THREE.CylinderGeometry(0.012,0.012,0.24,8),steelMat,tb,-0.46,1.38,0.32);

      // ---- Added turret detail (all of it sits on or against the casting) ----
      // Rear bustle rack, flush to the back of the skirt, with a rolled tarp on top.
      box(tb,detailMat,0,0.30,-1.80,0.92,0.2,0.2);
      box(tb,steelMat,0,0.30,-1.905,0.96,0.045,0.03);
      [-0.38,0.38].forEach(x=>box(tb,steelMat,x,0.30,-1.905,0.04,0.22,0.035));
      addMesh(new THREE.CylinderGeometry(0.075,0.075,0.82,12),darkMat,tb,0,0.475,-1.82,0,0,Math.PI/2);
      [-0.28,0.28].forEach(x=>addMesh(new THREE.CylinderGeometry(0.082,0.082,0.03,12),steelMat,tb,x,0.475,-1.82,0,0,Math.PI/2));
      // Grab handles and lifting lugs set into the skirt (positions follow the oval skirt).
      [-1,1].forEach(sd=>{
        [62,92,124].forEach(deg=>{
          const th=deg*Math.PI/180, px=sd*turretRadius*Math.sin(th), pz=turretZ+(turretHalfStraight+turretRadius)*Math.cos(th);
          box(tb,steelMat,px,0.34,pz,0.07,0.05,0.2,0,sd*(Math.PI/2-th*0.8),0);
        });
        // Two vertical lifting lugs on each cheek, welded to the skirt face.
        [-0.55,0.35].forEach(z=>{
          const ex=turretRadius;
          box(tb,steelMat,sd*(ex+0.03),0.3,z,0.08,0.13,0.1);
        });
        // Smoke grenade launchers on the front cheeks: three tubes, angled slightly outward.
        for(let k=0;k<3;k++){
          const z=0.78+k*0.11, ex=turretRadius;
          addMesh(new THREE.CylinderGeometry(0.04,0.04,0.2,8),darkMat,tb,sd*(ex-0.02),0.46,z,0,0,-sd*0.6);
        }
      });
      // Searchlight on the roof, front right, with its own pedestal.
      addMesh(new THREE.CylinderGeometry(0.07,0.09,0.14,12),darkMat,tb,0.92,0.82,0.52);
      addMesh(new THREE.CylinderGeometry(0.1,0.12,0.2,14),detailMat,tb,0.92,0.96,0.56,Math.PI/2.4,0,0);
      addMesh(new THREE.CylinderGeometry(0.075,0.075,0.02,12),new THREE.MeshStandardMaterial({color:0xd9d2a0,emissive:0x2a2810,roughness:0.4}),tb,0.92,0.955,0.665,Math.PI/2.4,0,0);
      // Ventilator dome with a protective cap behind the cupola, seated on the roof.
      addMesh(new THREE.CylinderGeometry(0.11,0.13,0.1,14),detailMat,tb,-0.55,0.83,-0.88);
      addMesh(new THREE.CylinderGeometry(0.15,0.15,0.03,14),steelMat,tb,-0.55,0.9,-0.88);
      // Gun mantlet: bolted collar ring and dust cover base.
      const mantRing=addMesh(new THREE.TorusGeometry(0.2,0.03,8,20),darkMat,tb,0,0.45,1.80);
      // Rangefinder windows
      [-0.38,0.38].forEach(x=>box(tb,darkMat,x,0.55,1.63,0.1,0.08,0.02));
    } else if(isFV4005){
      // FV4005 Stage II (Vickers turret, 14 mm all round): a narrow, mantletless sloped face with angled
      // cheeks and a flat roof. Behind the cheeks the side walls keep going vertically, then the rear
      // bustle's walls flare out at a slant, getting wider towards the big rear door, and its roof steps up.
      const Fx=0.52, Wm=0.8, Wr=0.96, y0=-0.05, hf=1.12, hr=1.24;
      const zFb=1.18, zFt=1.04, zc=0.52, zS=-0.1, zR=-1.2, gy=0.62;
      const wAt=z=>Wm+(Wr-Wm)*(zS-z)/(zS-zR);              // half-width of the flared rear section at z
      const flareAng=Math.atan((Wr-Wm)/(zS-zR));
      const turretBox=new THREE.Group();
      turretPivot.add(turretBox);
      const plate=(pts,mm,zone)=>armorPlate(turretBox,pts,turretMat,mm,zone);
      plate([[-Fx,y0,zFb],[Fx,y0,zFb],[Fx,hf,zFt],[-Fx,hf,zFt]],14,'turret-front');
      plate([[Fx,y0,zFb],[Wm,y0,zc],[Wm,hf,zc],[Fx,hf,zFt]],14,'turret-front');
      plate([[-Wm,y0,zc],[-Fx,y0,zFb],[-Fx,hf,zFt],[-Wm,hf,zc]],14,'turret-front');
      [-1,1].forEach(s=>{
        plate([[s*Wm,y0,zc],[s*Wm,y0,zS],[s*Wm,hf,zS],[s*Wm,hf,zc]],14,'turret-side');
        plate([[s*Wm,y0,zS],[s*Wr,y0,zR],[s*Wr,hr,zR],[s*Wm,hr,zS]],14,'turret-side');   // slanted flare
      });
      plate([[-Fx,hf,zFt],[Fx,hf,zFt],[Wm,hf,zc],[Wm,hf,zS],[-Wm,hf,zS],[-Wm,hf,zc]],14,'turret-roof');
      plate([[-Wm,hf,zS],[Wm,hf,zS],[Wm,hr,zS],[-Wm,hr,zS]],14,'turret-front');
      plate([[-Wm,hr,zS],[Wm,hr,zS],[Wr,hr,zR],[-Wr,hr,zR]],14,'turret-roof');
      plate([[-Wr,y0,zR],[Wr,y0,zR],[Wr,hr,zR],[-Wr,hr,zR]],14,'turret-rear');
      plate([[-Wm,y0,zS],[Wm,y0,zS],[Wr,y0,zR],[-Wr,y0,zR]],14,'turret-belly');

      // Gun shield and sleeve in the face, coax MG box on the cheek, gunner's sight on the other side.
      armorBox(turretBox,turretMat,0,gy,1.17,0.86,0.78,0.16,14,'turret-mantlet');
      [-1,1].forEach(sx=>[-1,1].forEach(sy=>box(turretBox,steelMat,sx*0.36,gy+sy*0.33,1.26,0.07,0.07,0.03)));
      addMesh(new THREE.CylinderGeometry(0.27,0.28,0.34,20),turretMat,turretBox,0,gy,1.36,Math.PI/2,0,0);
      addMesh(new THREE.TorusGeometry(0.27,0.03,8,20),darkMat,turretBox,0,gy,1.52);
      box(turretBox,turretMat,0.56,0.5,1.12,0.2,0.2,0.16);
      addMesh(new THREE.CylinderGeometry(0.03,0.03,0.3,8),darkMat,turretBox,0.56,0.5,1.32,Math.PI/2,0,0);
      box(turretBox,detailMat,-0.4,0.98,1.1,0.22,0.16,0.1);
      box(turretBox,darkMat,-0.4,0.98,1.16,0.14,0.08,0.02);

      // Two roof periscopes ahead of the step, two two-piece hatches on the raised rear roof.
      [-0.4,0.4].forEach(x=>{
        box(turretBox,detailMat,x,hf+0.04,0.12,0.18,0.08,0.14);
        box(turretBox,darkMat,x,hf+0.05,0.2,0.12,0.04,0.02);
        addMesh(new THREE.CylinderGeometry(0.29,0.31,0.09,20),turretMat,turretBox,x,hr+0.045,-0.6);
        addMesh(new THREE.CylinderGeometry(0.25,0.25,0.04,18,1,false,0,Math.PI),turretMat,turretBox,x,hr+0.11,-0.6);
        addMesh(new THREE.CylinderGeometry(0.25,0.25,0.04,18,1,false,Math.PI,Math.PI),turretMat,turretBox,x,hr+0.11,-0.6);
        box(turretBox,steelMat,x,hr+0.14,-0.6,0.46,0.02,0.04);
      });
      // Extractor fan dome, lifting eyes and a rolled tarpaulin on the roof.
      addMesh(new THREE.CylinderGeometry(0.14,0.16,0.05,14),turretMat,turretBox,0,hr+0.025,-0.98);
      addMesh(new THREE.SphereGeometry(0.12,12,6,0,Math.PI*2,0,Math.PI/2),turretMat,turretBox,0,hr+0.05,-0.98).scale.y=0.6;
      [-1,1].forEach(sx=>{
        box(turretBox,steelMat,sx*(Wm-0.1),hr+0.04,zS-0.12,0.14,0.07,0.1);
        box(turretBox,steelMat,sx*(Wr-0.1),hr+0.04,zR+0.12,0.14,0.07,0.1);
        box(turretBox,steelMat,sx*(Wm-0.1),hf+0.04,0.3,0.14,0.07,0.1);
      });
      // External structural ribs and a belt rail follow the slanted rear side walls.
      [-1,1].forEach(s=>{
        [-0.35,-0.65,-0.95].forEach(z=>box(turretBox,turretMat,s*(wAt(z)+0.03),(hr+y0)/2,z,0.06,hr-y0,0.1,0,-s*flareAng,0));
        box(turretBox,turretMat,s*(wAt(-0.65)+0.02),0.8,-0.65,0.04,0.06,1.0,0,-s*flareAng,0);
      });
      // The big rear door: recessed frame, slab, hinges, latch bar, loading rails and winch housing.
      const dw=Wr-0.1;
      box(turretBox,darkMat,0,0.64,zR-0.01,2*dw,0.9,0.03);
      box(turretBox,turretMat,0,0.64,zR-0.04,2*dw-0.1,0.8,0.04);
      [0.3,0.62,0.94].forEach(y=>box(turretBox,steelMat,-dw+0.12,y,zR-0.07,0.06,0.16,0.06));
      box(turretBox,steelMat,dw-0.2,0.64,zR-0.085,0.09,0.5,0.05);
      box(turretBox,steelMat,dw-0.32,0.64,zR-0.1,0.28,0.06,0.05);
      [-0.26,0.26].forEach(x=>box(turretBox,steelMat,x,0.64,zR-0.085,0.06,0.7,0.05));
      box(turretBox,detailMat,0,1.12,zR-0.1,0.56,0.1,0.12);
      [-Wr+0.02,Wr-0.02].forEach(x=>box(turretBox,turretMat,x,(hr+y0)/2,zR-0.04,0.08,hr-y0,0.07));
    } else if(isT54E1){
      // ================= T54E1 OSCILLATING TURRET =================
      // A two-piece turret like the AMX-50's and the T57/T69's:
      //   LOWER half = a squat cast collar on the turret ring. It only ever traverses (yaws).
      //   UPPER half = the whole fighting compartment, the 105 mm T140E2, the 9-round drum autoloader and the
      //                commander's cupola, cast as one block and hung on two trunnions on the collar.
      // The gun is fixed rigidly inside the upper half, so elevating the gun tilts the entire upper turret
      // about the trunnion axis while the collar stays level: the rear bustle dips as the muzzle rises and the
      // gap over the collar opens at the other end. That is why `t54Upper` is parented to barrelPitchPivot
      // (set up in the gun section below) - the existing aim code then oscillates the turret for free.
      // Lower collar (76 mm) with its ring race and the dust seal the upper half slides over.
      markArmor(addMesh(new THREE.CylinderGeometry(0.9,0.97,0.28,44),turretMat,turretPivot,0,0.14,0),
        turretByNormal({front:76,side:76,rear:76,roof:25,belly:25}));
      addMesh(new THREE.CylinderGeometry(0.99,1.0,0.05,44),detailMat,turretPivot,0,0.025,0);
      addMesh(new THREE.TorusGeometry(0.93,0.028,8,44),darkMat,turretPivot,0,0.28,0,Math.PI/2,0,0);
      // Upper half: one cast shell lofted from faceted cross-sections, so it has crisp casting edges instead of the
      // old balloon-like blob. Each station is [z, belly half-width, side half-width (widest point), roof-edge
      // half-width, crown half-width, belly y, side y, roof-edge y, crown y].
      // Plan view: a long wedge that tapers to a snub nose with a broad, rounded bustle behind it.
      // Side view: the roof climbs towards the rear over the autoloader drum and the belly is raised aft, so the
      // bustle still clears the collar when the gun elevates and the whole upper half rocks on its trunnions.
      t54Upper=new THREE.Group();
      const U=t54Upper, PY=T54_PY, PZ=T54_PZ;
      const ST=[
        [-1.55,0.52,0.60,0.52,0.30,0.46,0.58,0.68,0.72],
        [-1.42,0.80,0.92,0.80,0.40,0.43,0.57,0.69,0.74],
        [-1.10,1.00,1.14,0.98,0.46,0.34,0.52,0.70,0.77],
        [-0.55,1.08,1.25,1.05,0.46,0.24,0.48,0.68,0.76],
        [ 0.10,1.06,1.24,1.00,0.44,0.18,0.44,0.64,0.71],
        [ 0.65,0.88,1.02,0.82,0.38,0.16,0.42,0.60,0.66],
        [ 1.05,0.62,0.68,0.54,0.26,0.17,0.41,0.57,0.62],
        [ 1.36,0.36,0.40,0.32,0.18,0.20,0.40,0.54,0.58]
      ];
      const stAt=z=>{
        z=Math.max(ST[0][0],Math.min(ST[ST.length-1][0],z));
        let i=0; while(i<ST.length-2 && z>ST[i+1][0]) i++;
        const a=ST[i], b=ST[i+1], t=(z-a[0])/(b[0]-a[0]);
        const l=k=>a[k]+(b[k]-a[k])*t;
        return {wb:l(1),ws:l(2),wt:l(3),wc:l(4),yb:l(5),ym:l(6),ye:l(7),yr:l(8)};
      };
      const roofAt=(x,z)=>{
        const p=stAt(z), ax=Math.abs(x);
        if(ax<=p.wc) return p.yr;
        if(ax>=p.wt) return p.ye;
        return p.yr+(p.ye-p.yr)*(ax-p.wc)/(p.wt-p.wc);
      };
      // Hull-down side face: x of the sloped side at height y (between the widest point and the roof edge).
      const sideX=(z,y)=>{ const p=stAt(z); return p.ws+(p.wt-p.ws)*Math.max(0,Math.min(1,(y-p.ym)/(p.ye-p.ym))); };
      const t54Ring=([z,wb,ws,wt,wc,yb,ym,ye,yr])=>{
        const shX=(ws+wt)/2+0.025, shY=(ym+ye)/2+0.03; // rounded shoulder between the side and the roof edge
        const R=[[wb,yb],[ws,ym],[shX,shY],[wt,ye],[wc,yr]];
        return [[0,yb],...R,[0,yr+0.025],...R.slice().reverse().map(([x,y])=>[-x,y]).slice(0)].map(([x,y])=>[x,y,z]);
      };
      const rings=ST.map(t54Ring), tris=[];
      for(let k=0;k<rings.length-1;k++) for(let e=0;e<rings[k].length;e++){
        const f=(e+1)%rings[k].length, A=rings[k], B=rings[k+1];
        tris.push([A[e],A[f],B[f]],[A[e],B[f],B[e]]);
      }
      const capRing=(Rg,front)=>{
        const c=[0,Rg.reduce((m,v)=>m+v[1],0)/Rg.length,Rg[0][2]];
        for(let e=0;e<Rg.length;e++){ const f=(e+1)%Rg.length; tris.push(front?[c,Rg[e],Rg[f]]:[c,Rg[f],Rg[e]]); }
      };
      capRing(rings[0],false); capRing(rings[rings.length-1],true);
      // Face every triangle outwards and give it planar UVs on its dominant axis, so the paint wear and grime
      // texture reads on the casting (the old loft had no UVs, so it looked flat and plasticky).
      const tPos=[], tUv=[], ctr=[0,0.4,-0.1];
      tris.forEach(([p,q,r])=>{
        let n=[(q[1]-p[1])*(r[2]-p[2])-(q[2]-p[2])*(r[1]-p[1]),(q[2]-p[2])*(r[0]-p[0])-(q[0]-p[0])*(r[2]-p[2]),(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0])];
        const cx=(p[0]+q[0]+r[0])/3-ctr[0], cy=(p[1]+q[1]+r[1])/3-ctr[1], cz=(p[2]+q[2]+r[2])/3-ctr[2];
        if(n[0]*cx+n[1]*cy+n[2]*cz<0){ const s=q; q=r; r=s; n=n.map(v=>-v); }
        const ay=Math.abs(n[1]), ax=Math.abs(n[0]), az=Math.abs(n[2]);
        const u=ay>=ax&&ay>=az?[0,2]:ax>=az?[1,2]:[0,1];
        [p,q,r].forEach(v=>{ tPos.push(v[0],v[1],v[2]); tUv.push(v[u[0]]*0.35,v[u[1]]*0.35); });
      });
      const ug=new THREE.BufferGeometry();
      ug.setAttribute('position',new THREE.Float32BufferAttribute(tPos,3));
      ug.setAttribute('uv',new THREE.Float32BufferAttribute(tUv,2));
      ug.computeVertexNormals();
      markArmor(addMesh(ug,turretMat,U,0,0,0),turretByNormal({front:127,side:64,rear:51,roof:25,belly:25}));
      // Cast parting seam running along each flank at the widest point, plus a lighter weld line on the roof edge.
      [-1,1].forEach(sd=>{
        const seam=(w,y,r)=>addMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ST.map(s=>new THREE.Vector3(sd*(w(s)+0.006),y(s),s[0])),false,'centripetal'),28,r,5,false),detailMat,U,0,0,0);
        seam(s=>s[2],s=>s[6],0.013);
        seam(s=>s[3],s=>s[7],0.008);
      });
      // Trunnion bearing caps with bolt rings on both cheeks: the pivots the whole upper half swings on.
      [-1,1].forEach(sd=>{
        const tx=sideX(PZ,PY)+0.01;
        addMesh(new THREE.CylinderGeometry(0.2,0.2,0.07,22),steelMat,U,sd*tx,PY,PZ,0,0,Math.PI/2);
        addMesh(new THREE.CylinderGeometry(0.12,0.12,0.09,16),detailMat,U,sd*(tx+0.025),PY,PZ,0,0,Math.PI/2);
        for(let k=0;k<8;k++){const t=k/8*Math.PI*2; addMesh(new THREE.CylinderGeometry(0.018,0.018,0.03,6),darkMat,U,sd*(tx+0.04),PY+Math.sin(t)*0.16,PZ+Math.cos(t)*0.16,0,0,Math.PI/2);}
      });
      // Rounded cast mantlet bulging out of the nose, a thick trunnion collar round the gun, the canvas boot and
      // the coaxial MG on the right.
      const FZ=ST[ST.length-1][0];
      const mant=addMesh(new THREE.SphereGeometry(0.3,24,14),turretMat,U,0,PY+0.01,FZ-0.04);
      mant.scale.set(1.15,0.64,0.95);
      markArmor(mant,()=>({t:127,zone:'turret-mantlet'}));
      addMesh(new THREE.CylinderGeometry(0.22,0.24,0.12,20),turretMat,U,0,PY,FZ+0.2,Math.PI/2,0,0);
      addMesh(new THREE.TorusGeometry(0.225,0.016,6,20),detailMat,U,0,PY,FZ+0.27);
      addMesh(new THREE.CylinderGeometry(0.1,0.19,0.32,16),darkMat,U,0,PY,FZ+0.46,Math.PI/2,0,0);
      [1,2,3].forEach(k=>addMesh(new THREE.TorusGeometry(0.19-k*0.02,0.01,5,16),detailMat,U,0,PY,FZ+0.28+k*0.07));
      box(U,turretMat,0.3,PY-0.05,FZ+0.2,0.14,0.12,0.16);
      addMesh(new THREE.CylinderGeometry(0.026,0.026,0.3,8),darkMat,U,0.3,PY-0.05,FZ+0.38,Math.PI/2,0,0);
      // Gunner's sight hood on the right-front roof, with a dark window and a sloped cover.
      { const gx=0.36, gz=0.82, gy=roofAt(gx,gz);
        box(U,detailMat,gx,gy+0.04,gz,0.24,0.12,0.28);
        box(U,turretMat,gx,gy+0.1,gz-0.02,0.26,0.03,0.3,-0.12,0,0);
        box(U,darkMat,gx,gy+0.05,gz+0.145,0.17,0.06,0.02);
        box(U,steelMat,gx+0.16,gy+0.03,gz-0.08,0.05,0.07,0.1); }
      // Commander's cupola (right rear): vision-block drum, roof ring, hatch and a pintle-mounted .50 cal.
      { const cx=0.55, cz=-0.45, y0=roofAt(cx,cz)-0.05;
        addMesh(new THREE.CylinderGeometry(0.31,0.34,0.08,22),turretMat,U,cx,y0+0.04,cz);
        addMesh(new THREE.CylinderGeometry(0.26,0.28,0.2,22),turretMat,U,cx,y0+0.18,cz);
        for(let k=0;k<8;k++){const a=k/8*Math.PI*2; box(U,darkMat,cx+Math.sin(a)*0.27,y0+0.2,cz+Math.cos(a)*0.27,0.1,0.07,0.04,0,a,0);}
        addMesh(new THREE.CylinderGeometry(0.3,0.27,0.05,22),detailMat,U,cx,y0+0.305,cz);
        addMesh(new THREE.CylinderGeometry(0.2,0.2,0.04,20),steelMat,U,cx,y0+0.34,cz+0.02);
        box(U,steelMat,cx,y0+0.37,cz+0.02,0.16,0.02,0.04);
        box(U,detailMat,cx,y0+0.33,cz+0.3,0.06,0.1,0.06);
        box(U,steelMat,cx,y0+0.38,cz+0.38,0.09,0.11,0.46);
        addMesh(new THREE.CylinderGeometry(0.03,0.03,0.32,8),steelMat,U,cx,y0+0.38,cz+0.78,Math.PI/2,0,0);
        addMesh(new THREE.CylinderGeometry(0.016,0.016,0.4,8),darkMat,U,cx,y0+0.38,cz+1.1,Math.PI/2,0,0);
        box(U,darkMat,cx+0.2,y0+0.34,cz+0.2,0.13,0.11,0.2); }
      // Loader's hatch (left rear) with two periscopes ahead of it.
      { const lx=-0.5, lz=-0.38, ly=roofAt(lx,lz);
        addMesh(new THREE.CylinderGeometry(0.27,0.29,0.08,20),turretMat,U,lx,ly,lz);
        addMesh(new THREE.CylinderGeometry(0.22,0.22,0.04,20),steelMat,U,lx,ly+0.05,lz);
        box(U,detailMat,lx,ly+0.08,lz,0.2,0.02,0.04);
        [-0.38,-0.62].forEach(x=>{ const py=roofAt(x,0.02); box(U,detailMat,x,py,0.02,0.14,0.08,0.12); box(U,darkMat,x,py,0.085,0.1,0.04,0.02); }); }
      // Extractor fan dome on the bustle roof.
      { const ey=roofAt(0,-0.95);
        addMesh(new THREE.CylinderGeometry(0.14,0.16,0.05,14),turretMat,U,0,ey,-0.95);
        addMesh(new THREE.SphereGeometry(0.12,12,6,0,Math.PI*2,0,Math.PI/2),turretMat,U,0,ey+0.02,-0.95).scale.y=0.6; }
      // Four lifting eyes on the roof and an antenna mount on the left shoulder of the bustle.
      [[-0.8,-0.95],[0.8,-0.95],[-0.74,0.55],[0.74,0.55]].forEach(([x,z])=>{
        const y=roofAt(x,z); box(U,steelMat,x,y,z,0.1,0.05,0.12);
        addMesh(new THREE.TorusGeometry(0.045,0.014,6,12),steelMat,U,x,y+0.045,z,0,Math.PI/2,0);
      });
      { const ax=-0.82, az=-1.22, ay=roofAt(ax,az);
        addMesh(new THREE.CylinderGeometry(0.07,0.09,0.07,12),detailMat,U,ax,ay,az);
        addMesh(new THREE.CylinderGeometry(0.035,0.045,0.14,10),darkMat,U,ax,ay+0.09,az); }
      // Grab handles on both flanks of the bustle and the cheeks.
      [-1,1].forEach(sd=>[-1.1,-0.35,0.5].forEach(z=>{
        const p=stAt(z), y=p.ym+0.13, x=sd*(sideX(z,y)+0.03);
        beamBetween(U,steelMat,[x,y,z-0.12],[x,y,z+0.12],0.014,6);
        [-0.12,0.12].forEach(o=>box(U,steelMat,sd*(sideX(z+o,y)+0.015),y,z+o,0.04,0.03,0.03));
      }));
      // Bustle rear: autoloader loading hatch, spent-case ejection port and a wire stowage basket.
      box(U,steelMat,0,0.58,-1.565,0.56,0.2,0.04);
      for(let k=0;k<4;k++) box(U,darkMat,-0.22+k*0.147,0.58,-1.59,0.03,0.03,0.02);
      box(U,darkMat,-0.4,0.52,-1.56,0.24,0.1,0.02);
      for(let i=0;i<6;i++) box(U,steelMat,-0.5+i*0.2,0.6,-1.8,0.02,0.22,0.02);
      [0.5,0.7].forEach(y=>box(U,steelMat,0,y,-1.8,1.04,0.02,0.02));
      [-0.51,0.51].forEach(x=>[0.5,0.7].forEach(y=>box(U,steelMat,x,y,-1.68,0.02,0.02,0.26)));
    } else if(isAMX50){
      // ================= AMX 50 SURBAISSÉ: TOURELLE D OSCILLATING TURRET =================
      // Same two-piece principle as the T54E1 (see that branch): a squat LOWER collar that only traverses, and a
      // tall, UPPER half holding the fixed 120 mm gun, the autoloader and all three crew.
      // The upper half hangs off the gun's trunnion axis (parented to barrelPitchPivot below), so
      // elevating the gun tilts the whole upper turret: the long bustle dips as the muzzle rises.
      // The Tourelle D has a distinctive angular/wedge-shaped design with sharp front slopes.
      // LOWER BASKET: Wide armored collar sitting on the turret ring, only rotates (yaw)
      // Reduced height to 0.28 so upper section dominates the silhouette
      markArmor(addMesh(new THREE.CylinderGeometry(0.56,0.62,0.28,44),turretMat,turretPivot,0,0.14,0),
        turretByNormal({front:90,side:90,rear:60,roof:38,belly:25}));
      // Base ring detail at bottom of basket
      addMesh(new THREE.CylinderGeometry(0.62,0.64,0.04,44),detailMat,turretPivot,0,0.0,0);
      // Dust seal torus at top of basket
      addMesh(new THREE.TorusGeometry(0.55,0.03,8,44),darkMat,turretPivot,0,0.28,0,Math.PI/2,0,0);
      // Connecting ring between basket and upper section
      addMesh(new THREE.CylinderGeometry(0.56,0.56,0.04,44),detailMat,turretPivot,0,0.30,0);
      t54Upper=new THREE.Group();
      const U=t54Upper, PY=T54_PY, PZ=T54_PZ;
      
      // M-V-Yoh oscillating turret (H.L. Yoh, 1953): a VERY NARROW, LONG, low and rounded pod that carries only the
      // commander and gunner (the loader stays in the hull and feeds rounds up a narrow neck). Seen from the front it is
      // a small slit of a profile; from the side it is long and streamlined, with a tapered nose around the gun, a
      // swept-back roof and a rounded tail. Rounded, sloping sides are meant to glance shells off. One cupola on top.
      const SP=[ // z, half-width, bottom y, top y: low narrow nose at the gun, roof rising in ONE steady ramp (~10 deg) to the rear, then a rounded tail; the belly also sweeps UP toward the rear
        [ 1.60,0.20,0.62,0.92],
        [ 1.40,0.28,0.50,1.00],
        [ 1.00,0.38,0.38,1.055],
        [ 0.40,0.48,0.32,1.138],
        [-0.30,0.52,0.40,1.234],
        [-0.95,0.50,0.56,1.324],
        [-1.50,0.42,0.78,1.400],
        [-1.82,0.30,0.92,1.380],
        [-1.98,0.16,1.02,1.240]
      ];
      const profAt=z=>{
        z=THREE.MathUtils.clamp(z,SP[SP.length-1][0],SP[0][0]);
        let i=0; while(i<SP.length-2 && z<SP[i+1][0]) i++;
        const a=SP[i], b=SP[i+1], t=(z-a[0])/(b[0]-a[0]);
        return {w:a[1]+(b[1]-a[1])*t, yb:a[2]+(b[2]-a[2])*t, yt:a[3]+(b[3]-a[3])*t};
      };
      const SIDES=16, EXP=2.6, rings=SP.map(([z,w,yb,yt])=>{
        const ym=(yb+yt)/2, hh=(yt-yb)/2, r=[];
        for(let k=0;k<SIDES;k++){
          const a=k/SIDES*Math.PI*2, c=Math.cos(a), sn=Math.sin(a);
          r.push([w*Math.sign(c)*Math.pow(Math.abs(c),2/EXP), ym+hh*Math.sign(sn)*Math.pow(Math.abs(sn),2/EXP), z]);
        }
        return r;
      });
      const tris=[];
      for(let k=0;k<rings.length-1;k++) for(let q=0;q<SIDES;q++){
        const f=(q+1)%SIDES, A=rings[k], B=rings[k+1];
        tris.push([A[q],A[f],B[f]],[A[q],B[f],B[q]]);
      }
      const capRing=(Rg,front)=>{
        const c=[0,Rg.reduce((m,v)=>m+v[1],0)/Rg.length,Rg[0][2]];
        for(let q=0;q<SIDES;q++){ const f=(q+1)%SIDES; tris.push(front?[c,Rg[q],Rg[f]]:[c,Rg[f],Rg[q]]); }
      };
      capRing(rings[0],true); capRing(rings[rings.length-1],false);
      const tPos=[], tUv=[], ctr=[0,0.85,-0.2];
      tris.forEach(([p,q,r])=>{
        let n=[(q[1]-p[1])*(r[2]-p[2])-(q[2]-p[2])*(r[1]-p[1]),(q[2]-p[2])*(r[0]-p[0])-(q[0]-p[0])*(r[2]-p[2]),(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0])];
        const cx=(p[0]+q[0]+r[0])/3-ctr[0], cy=(p[1]+q[1]+r[1])/3-ctr[1], cz=(p[2]+q[2]+r[2])/3-ctr[2];
        if(n[0]*cx+n[1]*cy+n[2]*cz<0){ const sw=q; q=r; r=sw; }
        [p,q,r].forEach(v=>{ tPos.push(v[0],v[1],v[2]); tUv.push(v[2]*0.3,v[1]*0.3+v[0]*0.3); });
      });
      const tg=new THREE.BufferGeometry();
      tg.setAttribute('position',new THREE.Float32BufferAttribute(tPos,3));
      tg.setAttribute('uv',new THREE.Float32BufferAttribute(tUv,2));
      tg.computeVertexNormals();
      markArmor(addMesh(tg,turretMat,U,0,0,0),turretByNormal({front:150,side:90,rear:60,roof:38,belly:25})); // thick cast nose and mantlet area, thinner flanks and roof

      // Turret-to-hull connection (rotates with the turret): a flared rubber/steel neck shroud that spreads from the
      // narrow turret base out over the hull deck, plus a pair of sloped buttress plates on each flank and a
      // clamp ring, so the narrow turret is visibly mounted on the hull instead of floating above it.
      addMesh(new THREE.CylinderGeometry(0.60,1.02,0.34,32),hullMat,turretPivot,0,0.12,0);
      addMesh(new THREE.TorusGeometry(0.62,0.035,8,32),darkMat,turretPivot,0,0.29,0,Math.PI/2,0,0);
      addMesh(new THREE.TorusGeometry(0.98,0.03,8,32),steelMat,turretPivot,0,-0.04,0,Math.PI/2,0,0);
      [-1,1].forEach(sd=>[-0.55,0.45].forEach(zc=>{
        box(turretPivot,hullMat,sd*0.78,0.2,zc,0.62,0.04,0.7,0,0,-sd*Math.PI/4);
        box(turretPivot,steelMat,sd*0.78,0.2,zc+0.37,0.64,0.05,0.03,0,0,-sd*Math.PI/4);
        box(turretPivot,steelMat,sd*0.78,0.2,zc-0.37,0.64,0.05,0.03,0,0,-sd*Math.PI/4);
      }));
      // ---- NECK: a faired shroud that joins the narrow turret to the hull roof. It is fixed to the ring, so the
      // turret rocks above it. A flared base spreads onto the deck and angled ribs brace each flank. ----
      {
        const NK=[ // z, half-width at the deck, deck y, top y: a triangular pylon whose peak tucks INTO the turret belly
          [ 1.25,0.26,-0.02,0.10],[ 0.90,0.46,-0.02,0.28],[ 0.40,0.58,-0.02,0.40],
          [-0.30,0.62,-0.02,0.50],[-0.95,0.58,-0.02,0.64],[-1.35,0.42,-0.02,0.52],[-1.55,0.22,-0.02,0.32]
        ];
        const nr=NK.map(([z,w,yb,yt])=>{
          const ym=(yb+yt)/2, hh=(yt-yb)/2, r=[];
          for(let k=0;k<14;k++){
            const a=k/14*Math.PI*2,c=Math.cos(a),sn=Math.sin(a), y=ym+hh*Math.sign(sn)*Math.pow(Math.abs(sn),0.7);
            const taper=1-0.5*THREE.MathUtils.clamp((y-yb)/Math.max(0.01,yt-yb),0,1); // sloped flanks: wide on the deck, narrow where it meets the turret
            r.push([w*taper*Math.sign(c)*Math.pow(Math.abs(c),0.62), y, z]);
          }
          return r;
        });
        const np=[],ni=[]; nr.forEach(R=>R.forEach(v=>np.push(...v)));
        for(let k=0;k<nr.length-1;k++) for(let q=0;q<14;q++){ const f=(q+1)%14,a=k*14+q,b=k*14+f,c=(k+1)*14+q,d=(k+1)*14+f; ni.push(a,b,d,a,d,c); }
        [[0,true],[nr.length-1,false]].forEach(([ri,fr])=>{ const ci=np.length/3; np.push(0,(NK[ri][2]+NK[ri][3])/2,NK[ri][0]); for(let q=0;q<14;q++){ const f=(q+1)%14; fr?ni.push(ci,ri*14+q,ri*14+f):ni.push(ci,ri*14+f,ri*14+q); } });
        const ng=new THREE.BufferGeometry(); ng.setAttribute('position',new THREE.Float32BufferAttribute(np,3)); ng.setIndex(ni); ng.computeVertexNormals();
        const neckMat=turretMat.clone(); neckMat.flatShading=false; neckMat.needsUpdate=true;
        markArmor(addMesh(ng,neckMat,turretPivot,0,0,0),()=>({t:76,zone:'turret-neck'})); // cast pylon: the design's known weak spot
      }
      // Small rounded cast mantlet boss where the gun leaves the nose, with a dark gun-port ring.
      markArmor(addMesh(new THREE.CylinderGeometry(0.21,0.26,0.26,20),turretMat,U,0,PY,1.50,Math.PI/2,0,0),()=>({t:150,zone:'turret-mantlet'}));
      addMesh(new THREE.TorusGeometry(0.2,0.03,8,20),darkMat,U,0,PY,1.64);
      // Gunner's sight hood on the front of the roof.
      const sightZ=0.7, sightY=profAt(sightZ).yt;
      box(U,detailMat,0.14,sightY+0.07,sightZ,0.2,0.14,0.26);
      box(U,darkMat,0.14,sightY+0.09,sightZ+0.14,0.14,0.07,0.02);
      // Commander's cupola: the single hatch on the roof, with a ring of vision blocks and a hatch cover.
      const cupZ=-0.8, cupY=profAt(cupZ).yt, cupX=0;
      addMesh(new THREE.CylinderGeometry(0.24,0.27,0.16,18),turretMat,U,cupX,cupY+0.07,cupZ);
      addMesh(new THREE.CylinderGeometry(0.2,0.2,0.04,18),steelMat,U,cupX,cupY+0.17,cupZ);
      for(let k=0;k<8;k++){ const a=k/8*Math.PI*2; box(U,darkMat,cupX+Math.sin(a)*0.255,cupY+0.12,cupZ+Math.cos(a)*0.255,0.1,0.05,0.035,0,a,0); }
      // Roof MG on the cupola and a stowage bin on the rounded tail.
      addMesh(new THREE.CylinderGeometry(0.016,0.016,0.5,8),darkMat,U,cupX+0.1,cupY+0.24,cupZ+0.3,Math.PI/2,0,0);
      box(U,detailMat,0,profAt(-1.7).yb+0.28,-1.88,0.42,0.22,0.12);
    } else if(isLeo){
      // LEOPARD 1A5 turret: a low, wide CAST turret with a pointed front, flat roof and a deep rear bustle. The
      // big rounded cast mantlet is built with the gun below (it elevates with the barrel). Armour: 65 mm cast
      // front, 45 mm sides, 52 mm rear. Six destructible add-on armour modules (spaced armour) sit on the
      // front arc of the turret: HEAT / HESH / HE rounds detonate on a module and blow it off, leaving the
      // bare cast steel for the next shot. Kinetic rounds simply punch through the thin modules.
      const clampv=THREE.MathUtils.clamp;
      const ST=[ // z, belly half-width, widest half-width, roof-edge half-width, crown half-width, belly y, side y, roof-edge y, crown y
        [-1.66,0.50,0.58,0.50,0.26, 0.10,0.30,0.50,0.56],
        [-1.54,0.78,0.90,0.78,0.40, 0.06,0.28,0.52,0.60],
        [-1.20,0.94,1.06,0.92,0.46, 0.04,0.28,0.54,0.62],
        [-0.50,1.00,1.12,0.98,0.48, 0.03,0.28,0.56,0.64],
        [ 0.20,0.98,1.10,0.96,0.46, 0.03,0.27,0.55,0.63],
        [ 0.72,0.84,0.94,0.80,0.40, 0.03,0.26,0.52,0.60],
        [ 1.08,0.62,0.66,0.56,0.30, 0.04,0.26,0.48,0.54],
        [ 1.34,0.44,0.46,0.38,0.22, 0.10,0.26,0.44,0.48]
      ];
      const stAt=z=>{
        z=clampv(z,ST[0][0],ST[ST.length-1][0]);
        let i=0; while(i<ST.length-2 && z>ST[i+1][0]) i++;
        const a=ST[i], b=ST[i+1], t=(z-a[0])/(b[0]-a[0]);
        const l=k=>a[k]+(b[k]-a[k])*t;
        return {wb:l(1),ws:l(2),wt:l(3),wc:l(4),yb:l(5),ym:l(6),ye:l(7),yr:l(8)};
      };
      // x of the turret side surface at (z,y)
      const sideX=(z,y)=>{
        const p=stAt(z);
        if(y<p.ym) return p.wb+(p.ws-p.wb)*clampv((y-p.yb)/(p.ym-p.yb),0,1);
        return p.ws+(p.wt-p.ws)*clampv((y-p.ym)/(p.ye-p.ym),0,1);
      };
      const ringL=([z,wb,ws,wt,wc,yb,ym,ye,yr])=>{
        const shX=(ws+wt)/2+0.025, shY=(ym+ye)/2+0.03;
        const R=[[wb,yb],[ws,ym],[shX,shY],[wt,ye],[wc,yr]];
        return [[0,yb],...R,[0,yr+0.025],...R.slice().reverse().map(([x,y])=>[-x,y])].map(([x,y])=>[x,y,z]);
      };
      const rings=ST.map(ringL), tris=[];
      for(let k=0;k<rings.length-1;k++) for(let e=0;e<rings[k].length;e++){
        const f=(e+1)%rings[k].length, A=rings[k], B=rings[k+1];
        tris.push([A[e],A[f],B[f]],[A[e],B[f],B[e]]);
      }
      const capRingL=(Rg,front)=>{
        const c=[0,Rg.reduce((m,v)=>m+v[1],0)/Rg.length,Rg[0][2]];
        for(let e=0;e<Rg.length;e++){ const f=(e+1)%Rg.length; tris.push(front?[c,Rg[e],Rg[f]]:[c,Rg[f],Rg[e]]); }
      };
      capRingL(rings[0],false); capRingL(rings[rings.length-1],true);
      const tPos=[], tUv=[], ctr=[0,0.3,-0.1];
      tris.forEach(([p,q,r])=>{
        let n=[(q[1]-p[1])*(r[2]-p[2])-(q[2]-p[2])*(r[1]-p[1]),(q[2]-p[2])*(r[0]-p[0])-(q[0]-p[0])*(r[2]-p[2]),(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0])];
        const cx=(p[0]+q[0]+r[0])/3-ctr[0], cy=(p[1]+q[1]+r[1])/3-ctr[1], cz=(p[2]+q[2]+r[2])/3-ctr[2];
        if(n[0]*cx+n[1]*cy+n[2]*cz<0){ const s=q; q=r; r=s; n=n.map(v=>-v); }
        const ay=Math.abs(n[1]), ax=Math.abs(n[0]), az=Math.abs(n[2]);
        const u=ay>=ax&&ay>=az?[0,2]:ax>=az?[1,2]:[0,1];
        [p,q,r].forEach(v=>{ tPos.push(v[0],v[1],v[2]); tUv.push(v[u[0]]*0.35,v[u[1]]*0.35); });
      });
      const ug=new THREE.BufferGeometry();
      ug.setAttribute('position',new THREE.Float32BufferAttribute(tPos,3));
      ug.setAttribute('uv',new THREE.Float32BufferAttribute(tUv,2));
      ug.computeVertexNormals();
      markArmor(addMesh(ug,turretMat,turretPivot,0,0,0),turretByNormal({front:65,side:45,rear:52,roof:30,belly:25}));
      addMesh(new THREE.CylinderGeometry(0.88,0.88,0.05,36),darkMat,turretPivot,0,0.025,0);              // turret ring seal
      addMesh(new THREE.TorusGeometry(0.88,0.02,8,36),steelMat,turretPivot,0,0.052,0,Math.PI/2,0,0);

      // ---- destructible add-on armour modules ----
      const addOnMat=turretMat.clone(); addOnMat.color=turretMat.color.clone().multiplyScalar(0.8);
      const scarMat=new THREE.MeshBasicMaterial({color:0x14110d,transparent:true,opacity:0.6,depthWrite:false,side:THREE.DoubleSide});
      const finishPanel=(id,mesh,scar)=>{
        mesh.userData.addOnPanel=true; mesh.userData.armorPlate=true;
        mesh.userData.armorThicknessMM=60; mesh.userData.armorZone='turret-addon';
        const rec={id,mesh,scar,destroyed:false};
        mesh.userData.panelRef=rec; addOnPanels.push(rec); armorMeshes.push(mesh);
        if(scar){ scar.visible=false; turretPivot.add(scar); }
        return rec;
      };
      const panelOnSide=(sd,id,zc,yc,len,hgt,thick)=>{
        const dz=0.1, tx=sd*(sideX(zc+dz,yc)-sideX(zc-dz,yc)), tz=2*dz, tl=Math.hypot(tx,tz);
        let nx=tz/tl, nz=-tx/tl, os=1; if(nx*sd<0){ nx=-nx; nz=-nz; os=-1; }
        const ry=Math.atan2(tx,tz), px=sd*sideX(zc,yc);
        const mesh=box(turretPivot,addOnMat,px+nx*(thick/2+0.012),yc,zc+nz*(thick/2+0.012),thick,hgt,len,0,ry,0);
        box(mesh,darkMat,os*(thick/2+0.003),0,0,0.012,hgt*0.62,len*0.74);          // recessed inset plate
        [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>addMesh(new THREE.CylinderGeometry(0.018,0.018,0.02,6),steelMat,mesh,os*(thick/2+0.008),a*hgt*0.36,b*len*0.38,0,0,Math.PI/2));
        const scar=new THREE.Mesh(new THREE.PlaneGeometry(len*0.9,hgt*0.9),scarMat);
        scar.position.set(px+nx*0.004,yc,zc+nz*0.004); scar.rotation.y=Math.atan2(nx,nz);
        return finishPanel(id,mesh,scar);
      };
      const panelOnRoof=(sd,id)=>{
        const y=stAt(0.98).yr+0.06;
        const mesh=box(turretPivot,addOnMat,sd*0.27,y,0.98,0.44,0.09,0.5);
        box(mesh,darkMat,0,0.048,0,0.32,0.012,0.36);
        [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>addMesh(new THREE.CylinderGeometry(0.018,0.018,0.02,6),steelMat,mesh,a*0.17,0.055,b*0.2));
        const scar=new THREE.Mesh(new THREE.PlaneGeometry(0.39,0.45),scarMat);
        scar.position.set(sd*0.27,stAt(0.98).yr+0.004,0.98); scar.rotation.x=-Math.PI/2;
        return finishPanel(id,mesh,scar);
      };
      [-1,1].forEach(sd=>{
        const s=sd<0?'L':'R';
        panelOnSide(sd,'cheek-'+s,1.12,0.30,0.50,0.34,0.15);
        panelOnSide(sd,'shoulder-'+s,0.55,0.32,0.62,0.36,0.13);
        panelOnRoof(sd,'roof-'+s);
        // Four smoke-grenade tubes on each side of the turret front, just behind the add-on modules.
        for(let k=0;k<4;k++) addMesh(new THREE.CylinderGeometry(0.04,0.04,0.2,8),darkMat,turretPivot,sd*(sideX(-0.05+k*0.1,0.46)+0.035),0.46,-0.05+k*0.1,0,0,-sd*1.0);
      });

      // ---- roof fittings: A5 sight hood with the thermal / laser windows, commander's cupola, loader's hatch ----
      const roofY=z=>stAt(z).yr;
      // EMES 18 / thermal sight hood (right front of the roof)
      box(turretPivot,hullMat,0.34,roofY(0.2)+0.1,0.2,0.52,0.2,0.52);
      box(turretPivot,steelMat,0.34,roofY(0.2)+0.21,0.2,0.54,0.02,0.54);
      [0.22,0.46].forEach(x=>{
        addMesh(new THREE.CylinderGeometry(0.06,0.06,0.03,14),darkMat,turretPivot,x,roofY(0.2)+0.11,0.2+0.27,Math.PI/2,0,0);
        addMesh(new THREE.CylinderGeometry(0.035,0.035,0.035,12),detailMat,turretPivot,x,roofY(0.2)+0.11,0.2+0.285,Math.PI/2,0,0);
      });
      box(turretPivot,darkMat,0.34,roofY(0.2)+0.17,0.2+0.27,0.2,0.04,0.03);          // laser rangefinder aperture
      // commander's cupola (right rear) with a ring of periscopes and a pintle-mounted MG3
      const ccx=0.46, ccz=-0.62, cy=roofY(-0.62);
      addMesh(new THREE.CylinderGeometry(0.25,0.27,0.13,20),turretMat,turretPivot,ccx,cy+0.06,ccz);
      addMesh(new THREE.CylinderGeometry(0.2,0.2,0.04,20),steelMat,turretPivot,ccx,cy+0.14,ccz);
      for(let k=0;k<8;k++){ const a=k/8*Math.PI*2; box(turretPivot,darkMat,ccx+Math.sin(a)*0.255,cy+0.12,ccz+Math.cos(a)*0.255,0.1,0.05,0.035,0,a,0); }
      box(turretPivot,detailMat,ccx-0.12,cy+0.2,ccz+0.05,0.06,0.07,0.16);
      addMesh(new THREE.CylinderGeometry(0.018,0.018,0.5,8),darkMat,turretPivot,ccx-0.12,cy+0.21,ccz+0.27,Math.PI/2,0,0);
      // loader's hatch (left rear) with its own MG3 ring mount
      const lcx=-0.44, lcz=-0.55, ly=roofY(-0.55);
      addMesh(new THREE.CylinderGeometry(0.22,0.24,0.07,20),turretMat,turretPivot,lcx,ly+0.03,lcz);
      addMesh(new THREE.CylinderGeometry(0.18,0.18,0.035,20),steelMat,turretPivot,lcx,ly+0.08,lcz);
      addMesh(new THREE.TorusGeometry(0.22,0.012,6,22),steelMat,turretPivot,lcx,ly+0.075,lcz,Math.PI/2,0,0);
      addMesh(new THREE.CylinderGeometry(0.016,0.016,0.46,8),darkMat,turretPivot,lcx,ly+0.15,lcz+0.25,Math.PI/2,0,0);
      // rear bustle: stowage bin with tie-down bars, antenna base
      box(turretPivot,hullMat,0,0.32,-1.78,0.95,0.26,0.16);
      [-0.3,0,0.3].forEach(x=>box(turretPivot,steelMat,x,0.32,-1.87,0.03,0.28,0.02));
      addMesh(new THREE.CylinderGeometry(0.05,0.06,0.08,12),detailMat,turretPivot,-0.72,roofY(-1.1)+0.04,-1.1);
    } else if(isT72){
      // ================= T-72B TURRET (cast, with the 1985 composite "Super Dolly Parton" front) =================
      // Authored in metres relative to the turret ring centre (y = 0 is the hull roof at the ring). Rounded dome that bulges into
      // wide, angled front cheeks (the composite array), a rounded rear and a flat crown. 0.66 m tall, ~2.5 m wide at the cheeks.
      // Rounded cast "flying saucer": the plan is a superellipse (about 2.6 m wide, 3.2 m long) that bulges into full, rounded front cheeks
      // and a round rear, with a flat front only ~1 m wide for the mantlet. Cross-section: a short bulging skirt, widest at y = 0.30 m,
      // then an elliptical dome up to a 0.66 m crown.
      const ZC=-0.15, ZA=1.62, BW=1.30, PE=2.4;
      const plan=z=>{ const u=Math.max(-1,Math.min(1,(z-ZC)/ZA)), k=Math.pow(Math.max(0,1-Math.pow(Math.abs(u),PE)),1/PE);
        return {hw:Math.max(0.22,BW*k), yb:0.02, ym:0.30-0.05*u*u, yr:0.66-0.14*Math.pow(Math.abs(u),2.2)}; };
      const ringM=z=>{
        const p=plan(z), R=[[0.80*p.hw,p.yb],[0.93*p.hw,(p.yb+p.ym)/2],[p.hw,p.ym]];
        [20,40,60,80].forEach(d=>{ const a=d*Math.PI/180; R.push([p.hw*Math.cos(a),p.ym+(p.yr-p.ym)*Math.sin(a)]); });
        return [[0,p.yb],...R,[0,p.yr],...R.slice().reverse().map(([x,y])=>[-x,y])].map(([x,y])=>[u72(x),u72(y),u72(z)]);
      };
      const ST=[-1.76,-1.66,-1.50,-1.25,-0.95,-0.6,-0.2,0.2,0.6,0.95,1.2,1.32,1.40];
      const rings=ST.map(ringM), tris=[];
      for(let k=0;k<rings.length-1;k++) for(let e=0;e<rings[k].length;e++){
        const f=(e+1)%rings[k].length, A=rings[k], B=rings[k+1];
        tris.push([A[e],A[f],B[f]],[A[e],B[f],B[e]]);
      }
      const capM=(Rg,front)=>{
        const c=[0,Rg.reduce((m,v)=>m+v[1],0)/Rg.length,Rg.reduce((m,v)=>m+v[2],0)/Rg.length];
        for(let e=0;e<Rg.length;e++){ const f=(e+1)%Rg.length; tris.push(front?[c,Rg[e],Rg[f]]:[c,Rg[f],Rg[e]]); }
      };
      capM(rings[0],false); capM(rings[rings.length-1],true);
      const solidGeo=(tl,ctr)=>{
        const tPos=[], tUv=[];
        tl.forEach(([p,q,r])=>{
          let n=[(q[1]-p[1])*(r[2]-p[2])-(q[2]-p[2])*(r[1]-p[1]),(q[2]-p[2])*(r[0]-p[0])-(q[0]-p[0])*(r[2]-p[2]),(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0])];
          const cx=(p[0]+q[0]+r[0])/3-ctr[0], cy=(p[1]+q[1]+r[1])/3-ctr[1], cz=(p[2]+q[2]+r[2])/3-ctr[2];
          if(n[0]*cx+n[1]*cy+n[2]*cz<0){ const sw=q; q=r; r=sw; n=n.map(v=>-v); }
          const ay=Math.abs(n[1]), ax=Math.abs(n[0]), az=Math.abs(n[2]);
          const u=ay>=ax&&ay>=az?[0,2]:ax>=az?[1,2]:[0,1];
          [p,q,r].forEach(v=>{ tPos.push(v[0],v[1],v[2]); tUv.push(v[u[0]]*0.35,v[u[1]]*0.35); });
        });
        const g=new THREE.BufferGeometry();
        g.setAttribute('position',new THREE.Float32BufferAttribute(tPos,3));
        g.setAttribute('uv',new THREE.Float32BufferAttribute(tUv,2));
        g.computeVertexNormals();
        return g;
      };
      // Estimated protection: composite front/cheeks ~530 mm vs kinetic, ~720 mm vs shaped charge (without ERA); cast sides 115 mm, rear 45, roof 40, floor 20.
      markArmor(addMesh(solidGeo(tris,[0,u72(0.3),u72(-0.1)]),turretMat,turretPivot,0,0,0),n=>{
        if(n.y>0.8) return {t:40,zone:'turret-roof'};
        if(n.y<-0.8) return {t:20,zone:'turret-belly'};
        if(n.z>0.35) return comp(530,720,0,'turret-front');   // cast shell with cavities filled with alternating steel / rubber reflective plates (BDD-style NERA), ERA not included
        if(n.z<-0.5) return {t:45,zone:'turret-rear'};
        return {t:115,zone:'turret-side'};
      });
      addMesh(new THREE.CylinderGeometry(u72(1.1),u72(1.1),0.05,36),darkMat,turretPivot,0,0.025,0);   // turret ring seal
      addMesh(new THREE.TorusGeometry(u72(1.1),0.02,8,36),steelMat,turretPivot,0,0.052,0,Math.PI/2,0,0);
      const surfY=(x,z)=>{ const p=plan(z), r=Math.min(1,Math.abs(x)/p.hw); return p.ym+(p.yr-p.ym)*Math.sqrt(1-r*r); };
      const roofAt=(z,x=0)=>surfY(x,z);
      const sideXm=(z,y)=>{ const p=plan(z);
        if(y<p.ym){ const t=Math.max(0,Math.min(1,(y-p.yb)/(p.ym-p.yb))); return p.hw*(t<0.5?0.80+0.13*(t/0.5):0.93+0.07*((t-0.5)/0.5)); }
        const r=Math.min(1,(y-p.ym)/(p.yr-p.ym)); return p.hw*Math.sqrt(Math.max(0,1-r*r)); };
      const domeNormal=(x,z)=>{ const d=0.04, cl=v=>Math.max(-2.5,Math.min(2.5,v));
        return [-cl((surfY(x+d,z)-surfY(x-d,z))/(2*d)),1,-cl((surfY(x,z+d)-surfY(x,z-d))/(2*d))]; };
      const sidePt=(sd,z,y)=>[sd*sideXm(z,y),y,z];
      const sideNormal=(sd,z,y)=>{ const d=0.05, a=sidePt(sd,z+d,y), b=sidePt(sd,z-d,y), c=sidePt(sd,z,y+d), e=sidePt(sd,z,y-d);
        const tz=[a[0]-b[0],a[1]-b[1],a[2]-b[2]], ty=[c[0]-e[0],c[1]-e[1],c[2]-e[2]];
        let n=[ty[1]*tz[2]-ty[2]*tz[1],ty[2]*tz[0]-ty[0]*tz[2],ty[0]*tz[1]-ty[1]*tz[0]]; if(n[0]*sd<0) n=n.map(v=>-v); return n; };
      // Kontakt-1 as a V-shaped array of steep wedge packs mounted on the turret front arc, facing sideways: each pack's thick base-to-face
      // direction points outward from the cheek (horizontal, not up), and its slope falls toward the front. 4 per side, following the curve of
      // the cheek so the two rows form a V around the gun. The strip beside the mantlet is left clear for the coaxial MG slot and optics.
      [-1,1].forEach(sd=>[[1.37,0.56],[1.13,0.38],[0.86,0.38],[0.58,0.38],[0.30,0.38],[0.03,0.38]].forEach(([z,pw],i)=>{ // foremost pack is wider and sits on the front corner so the array reaches right up to the mantlet cover
        // horizontal prisms: the long edges run horizontally along the cheek (0.36 m wide). Seen from the side each pack is an equilateral
        // triangle: 0.46 m base against the turret, apex 0.398 m (= 0.46 x sin 60 deg) straight out.
        const y=0.25, P=sidePt(sd,z,y), n0=sideNormal(sd,z,y);
        const N=[n0[0],0,n0[2]];                                   // outward and horizontal
        placeWedge(turretPivot,[P[0]-N[0]*0.03,P[1],P[2]-N[2]*0.03],N,[0,1,0],pw,0.46,0.398,'turretV'+(sd>0?'R':'L')+i,true);
      }));
      // Kontakt-1 bottom row: on the real T-72B a row of flat ERA bricks runs horizontally along the lower edge of the turret
      // cheeks, beneath the V-shaped wedge packs above, following the turret's cast curve around toward the sides.
      [-1,1].forEach(sd=>[1.45,1.15,0.85,0.55,0.25,-0.05,-0.35,-0.65].forEach(z=>{
        const y=0.085, P=sidePt(sd,z,y), n0=sideNormal(sd,z,y);
        const N=[n0[0],0,n0[2]];
        placeEra(turretPivot,[P[0]-N[0]*0.01,P[1],P[2]-N[2]*0.01],N,[0,1,0],0.30,0.16,0.05,'turretRow'+(sd>0?'R':'L')+z);
      }));
      // Commander's cupola (right): TKN-3B periscope ring, hatch and the NSVT 12.7 mm anti-aircraft machine gun on its ring mount
      { const cx=0.52, cz=-0.32, ry=roofAt(cz,cx);
        c72(turretPivot,turretMat,0.29,0.31,0.16,cx,ry+0.07,cz,0,0,0,22);
        for(let k=0;k<7;k++){ const a=k/7*Math.PI*2+0.4; b72(turretPivot,darkMat,cx+Math.sin(a)*0.3,ry+0.1,cz+Math.cos(a)*0.3,0.11,0.07,0.04,0,a,0); }
        c72(turretPivot,steelMat,0.22,0.22,0.035,cx-0.02,ry+0.17,cz-0.02,0,0,0.2,20);
        b72(turretPivot,detailMat,cx-0.02,ry+0.27,cz+0.12,0.1,0.18,0.1);                      // MG pedestal
        b72(turretPivot,detailMat,cx-0.02,ry+0.37,cz+0.14,0.12,0.12,0.4);                     // NSVT receiver
        c72(turretPivot,darkMat,0.022,0.022,0.95,cx-0.02,ry+0.37,cz+0.7,Math.PI/2,0,0,8);     // NSVT barrel
        b72(turretPivot,detailMat,cx+0.34,ry+0.07,cz+0.1,0.16,0.1,0.22);                      // TKN-3B night/day periscope block
      }
      // Gunner's hatch (left, round) and the TPD-K1 sight head / laser-rangefinder housing on the left of the gun
      c72(turretPivot,turretMat,0.28,0.3,0.06,-0.55,roofAt(0.05,-0.55)+0.03,0.05,0,0,0,22);
      c72(turretPivot,steelMat,0.22,0.22,0.03,-0.56,roofAt(0.05,-0.55)+0.075,0.05,0,0,-0.18,20);
      b72(turretPivot,hullMat,-0.5,roofAt(0.46,-0.5)+0.07,0.46,0.42,0.14,0.5); b72(turretPivot,steelMat,-0.5,roofAt(0.46,-0.5)+0.145,0.44,0.36,0.03,0.4);
      b72(turretPivot,darkMat,-0.5,roofAt(0.46,-0.5)+0.06,0.72,0.3,0.07,0.02);
      // Smoke grenade launchers: two banks of four 81 mm tubes on the left side of the turret behind the cheek (902B "Tucha")
      for(let r=0;r<2;r++) for(let k=0;k<4;k++)
        c72(turretPivot,darkMat,0.04,0.04,0.2,-(sideXm(-0.18-k*0.17,0.38+r*0.1)+0.06),0.38+r*0.1,-0.18-k*0.17,0,0,0.7,8);
      // Rear stowage bin, snorkel tube and tie-downs, antenna base and wind sensor
      b72(turretPivot,hullMat,0,0.3,-2.0,1.25,0.4,0.3);
      [-0.45,0,0.45].forEach(x=>b72(turretPivot,steelMat,x,0.3,-2.17,0.03,0.42,0.03));
      c72(turretPivot,darkMat,0.1,0.1,1.9,0,0.54,-1.97,0,0,Math.PI/2,12);
      c72(turretPivot,detailMat,0.06,0.07,0.1,-0.82,roofAt(-1.1,-0.82)+0.05,-1.1,0,0,0,10);
      c72(turretPivot,darkMat,0.012,0.012,0.5,0.45,roofAt(-0.9,0.45)+0.25,-0.9,0,0,0,6);
      // Kontakt-1 roof field: flat bricks tiling the open crown between the hatches, cupola, sight housing, smoke
      // launchers and rear stowage (which stay bare, as on the real tank), so the turret top reads as armoured too.
      const roofClear=[[0.55,-0.25,0.75],[-0.55,0.35,0.55],[-1.05,-0.4,0.5],[0,-1.85,0.55],[-0.82,-1.1,0.3],[0.45,-0.9,0.25]];
      const roofFree=(x,z)=>roofClear.every(([cx,cz,r])=>Math.hypot(x-cx,z-cz)>r);
      for(let z=1.2;z>=-1.5;z-=0.3){
        const p=plan(z);
        for(let x=-1.0;x<=1.0;x+=0.3){
          if(Math.abs(x)>p.hw*0.8) continue;           // leave the curved rim to the side rows below
          if(!roofFree(x,z)) continue;
          const y=roofAt(z,x), n=domeNormal(x,z);
          placeEra(turretPivot,[x,y,z],n,[0,0,1],0.26,0.26,0.045,'turretRoof'+Math.round(x*100)+'_'+Math.round(z*100));
        }
      }
      // Kontakt-1 mid-side band: a second row above the bottom row, carrying ERA further back along the flanks
      // toward the rear (the front of the cheek is left to the taller 5-pack wedge array now covering it; the
      // left side also steps around the smoke-launcher bank, the right side runs clear back).
      [-1,1].forEach(sd=>(sd>0?[-0.3,-0.65,-1.0,-1.35]:[-1.0,-1.35]).forEach(z=>{
        const y=0.40, P=sidePt(sd,z,y), n=sideNormal(sd,z,y);
        placeEra(turretPivot,[P[0]-n[0]*0.01,P[1]-n[1]*0.01,P[2]-n[2]*0.01],n,[0,1,0],0.28,0.22,0.05,'turretMid'+(sd>0?'R':'L')+Math.round(z*100));
      }));
    } else if(isM1){
      // ================= M1 ABRAMS TURRET (original 105 mm "short" turret) =================
      // A long, low turret with a long rear bustle. The body ends in a flat front wall, and two separate wedge-shaped
      // composite cheek blocks stick out of it (proud of the sides and the front wall), raked back about 45 degrees.
      // The gun shield sits recessed in the slot between them.
      const TYS=0.92; // turret is 8% lower than before
      const Xt=m=>m/1.3, Yt=m=>m*TYS/1.3, Zt=m=>m/1.4;
      // z (m from ring centre), belly hw, side hw, roof-edge hw, crown hw, belly y, widest y, roof-edge y, roof y (m above ring deck), front lean
      const ST=[
        [-3.30,0.94,1.02,0.86,0.78, 0.11,0.30,0.74,0.78, 0],
        [-2.85,1.10,1.20,1.00,0.90, 0.11,0.31,0.80,0.84, 0],
        [-2.00,1.30,1.42,1.18,1.06, 0.09,0.32,0.84,0.89, 0],
        [-1.20,1.46,1.60,1.30,1.18, 0.05,0.34,0.88,0.93, 0],
        [-0.40,1.48,1.62,1.32,1.20, 0.02,0.34,0.90,0.95, 0],
        [ 0.60,1.48,1.62,1.32,1.20, 0.02,0.34,0.90,0.96, 0],
        [ 1.20,1.46,1.60,1.30,1.18, 0.02,0.34,0.88,0.94, 0.08]
      ]; // long boxy bustle (3.3 m behind the ring), sloped sides, flat front wall that the cheek blocks bolt onto
      const ringM=([z,wb,ws,wt,wc,yb,ym,ye,yr,lean])=>{
        const R=[[wb,yb],[ws,ym],[wt,ye],[wc,yr]];
        return [[0,yb],...R,[0,yr],...R.slice().reverse().map(([x,y])=>[-x,y])].map(([x,y])=>[Xt(x),Yt(y),Zt(z-lean*(y-yb)/(yr-yb))]);
      };
      const rings=ST.map(ringM), tris=[];
      for(let k=0;k<rings.length-1;k++) for(let e=0;e<rings[k].length;e++){
        const f=(e+1)%rings[k].length, A=rings[k], B=rings[k+1];
        tris.push([A[e],A[f],B[f]],[A[e],B[f],B[e]]);
      }
      const capM=(Rg,front)=>{
        const c=[0,Rg.reduce((m,v)=>m+v[1],0)/Rg.length,Rg.reduce((m,v)=>m+v[2],0)/Rg.length];
        for(let e=0;e<Rg.length;e++){ const f=(e+1)%Rg.length; tris.push(front?[c,Rg[e],Rg[f]]:[c,Rg[f],Rg[e]]); }
      };
      capM(rings[0],false); capM(rings[rings.length-1],true);
      // Turns loose triangles of a closed solid into a mesh with outward-facing windings and planar paint UVs.
      const solidGeo=(tl,ctr)=>{
        const tPos=[], tUv=[];
        tl.forEach(([p,q,r])=>{
          let n=[(q[1]-p[1])*(r[2]-p[2])-(q[2]-p[2])*(r[1]-p[1]),(q[2]-p[2])*(r[0]-p[0])-(q[0]-p[0])*(r[2]-p[2]),(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0])];
          const cx=(p[0]+q[0]+r[0])/3-ctr[0], cy=(p[1]+q[1]+r[1])/3-ctr[1], cz=(p[2]+q[2]+r[2])/3-ctr[2];
          if(n[0]*cx+n[1]*cy+n[2]*cz<0){ const sw=q; q=r; r=sw; n=n.map(v=>-v); }
          const ay=Math.abs(n[1]), ax=Math.abs(n[0]), az=Math.abs(n[2]);
          const u=ay>=ax&&ay>=az?[0,2]:ax>=az?[1,2]:[0,1];
          [p,q,r].forEach(v=>{ tPos.push(v[0],v[1],v[2]); tUv.push(v[u[0]]*0.35,v[u[1]]*0.35); });
        });
        const g=new THREE.BufferGeometry();
        g.setAttribute('position',new THREE.Float32BufferAttribute(tPos,3));
        g.setAttribute('uv',new THREE.Float32BufferAttribute(tUv,2));
        g.computeVertexNormals();
        return g;
      };
      // Turret body: composite behind the front wall, sides 55 mm, bustle rear 45 mm, roof 30 mm, floor 25 mm.
      markArmor(addMesh(solidGeo(tris,[0,Yt(0.45),Zt(-1.05)]),turretMat,turretPivot,0,0,0),n=>{
        if(n.y>0.8) return {t:30,zone:'turret-roof'};
        if(n.y<-0.8) return {t:25,zone:'turret-belly'};
        if(n.z>0.5) return comp(400,700,31,'turret-front');
        if(n.z<-0.5) return {t:45,zone:'turret-rear'};
        return {t:55,zone:'turret-side'};
      });
      // The two protruding cheek armour blocks (special armour, ~400 mm KE / 700 mm CE). Each is a wedge: it sticks out past the
      // turret side and front wall, its front face is raked back 45 degrees, and the two blocks leave a 0.84 m slot for the gun.
      const cheekBlock=sd=>{
        const yb=Yt(0.05), yt=Yt(0.90);
        const Bm=[[1.76,0.70],[1.42,1.62],[0.42,2.12],[0.42,0.70]].map(([x,z])=>[sd*Xt(x),yb,Zt(z)]);
        const Tm=[[1.50,0.70],[1.42,0.77],[0.42,1.27],[0.42,0.70]].map(([x,z])=>[sd*Xt(x),yt,Zt(z)]);
        const quad=(a,b,c,d)=>[[a,b,c],[a,c,d]];
        const tl=[...quad(Bm[0],Bm[1],Bm[2],Bm[3]),...quad(Tm[0],Tm[1],Tm[2],Tm[3])];
        for(let i=0;i<4;i++){ const j=(i+1)%4; tl.push(...quad(Bm[i],Bm[j],Tm[j],Tm[i])); }
        const all=[...Bm,...Tm], ctr=[0,1,2].map(k=>all.reduce((m,v)=>m+v[k],0)/all.length);
        return markArmor(addMesh(solidGeo(tl,ctr),turretMat,turretPivot,0,0,0),n=>{
          if(n.y>0.8) return {t:30,zone:'turret-roof'};
          if(n.y<-0.8) return {t:25,zone:'turret-belly'};
          if(n.z>0.15) return comp(400,700,31,'turret-front');
          return {t:55,zone:'turret-side'};
        });
      };
      [-1,1].forEach(cheekBlock);
      addMesh(new THREE.CylinderGeometry(Xt(1.12),Xt(1.12),0.05,36),darkMat,turretPivot,0,0.025,0); // turret ring seal
      addMesh(new THREE.TorusGeometry(Xt(1.12),0.02,8,36),steelMat,turretPivot,0,0.052,0,Math.PI/2,0,0);
      const roofM=Yt(0.95);
      // Commander's weapon station (right rear): vision-block ring, hatch and M2HB on a pedestal
      {
        const cx=Xt(0.62), cz=Zt(-0.62);
        addMesh(new THREE.CylinderGeometry(0.26,0.28,0.1,20),turretMat,turretPivot,cx,roofM+0.04,cz);
        for(let k=0;k<6;k++){ const a=k/6*Math.PI*2; box(turretPivot,darkMat,cx+Math.sin(a)*0.27,roofM+0.1,cz+Math.cos(a)*0.27,0.1,0.05,0.035,0,a,0); }
        addMesh(new THREE.CylinderGeometry(0.19,0.19,0.03,18),steelMat,turretPivot,cx,roofM+0.115,cz);
        box(turretPivot,detailMat,cx,roofM+0.12,cz+0.33,0.05,0.12,0.05);
        box(turretPivot,detailMat,cx,roofM+0.21,cz+0.35,0.1,0.1,0.28);
        addMesh(new THREE.CylinderGeometry(0.014,0.014,0.6,8),darkMat,turretPivot,cx,roofM+0.21,cz+0.8,Math.PI/2,0,0);
      }
      // Loader's hatch (left) with M240 on a pintle
      {
        const lx=-Xt(0.62), lz=Zt(-0.2);
        addMesh(new THREE.CylinderGeometry(0.23,0.25,0.06,18),turretMat,turretPivot,lx,roofM+0.03,lz);
        addMesh(new THREE.CylinderGeometry(0.19,0.19,0.03,18),steelMat,turretPivot,lx-0.02,roofM+0.08,lz-0.02,0,0,0.25);
        box(turretPivot,detailMat,lx+0.2,roofM+0.12,lz+0.1,0.04,0.2,0.04);
        box(turretPivot,detailMat,lx+0.2,roofM+0.22,lz+0.2,0.07,0.07,0.2);
        addMesh(new THREE.CylinderGeometry(0.011,0.011,0.4,8),darkMat,turretPivot,lx+0.2,roofM+0.22,lz+0.5,Math.PI/2,0,0);
      }
      // Gunner's primary sight head (right front, set back so it sits on the body roof, behind the cheek blocks) with armoured hood and window
      box(turretPivot,hullMat,Xt(0.55),roofM+0.1,Zt(0.85),0.4,0.2,0.46);
      box(turretPivot,steelMat,Xt(0.55),roofM+0.215,Zt(0.8),0.34,0.03,0.36);
      box(turretPivot,darkMat,Xt(0.55),roofM+0.12,Zt(0.85)+0.24,0.26,0.1,0.02);
      // Blow-off panels on the bustle roof (ammunition compartment) - they fly off if the ready racks cook off
      [[-1.70,2.0,0.905],[-2.30,1.7,0.872],[-2.90,1.4,0.833]].forEach(([zm,wm,ym],i)=>{
        const p=box(turretPivot,hullMat,0,Yt(ym)+0.02,Zt(zm),Xt(wm),0.03,Zt(0.34));
        blowOffPanels.push({id:'blowoff'+i,mesh:p,destroyed:false});
        box(turretPivot,darkMat,0,Yt(ym)+0.035,Zt(zm),Xt(wm-0.3),0.012,Zt(0.26));
      });
      // Sponson stowage boxes and the rear basket (the basket now closes off the much longer bustle)
      [-1,1].forEach(sd=>{
        box(turretPivot,hullMat,sd*Xt(1.40),Yt(0.5),Zt(-2.3),Xt(0.32),Yt(0.5),Zt(0.95));
        box(turretPivot,darkMat,sd*Xt(1.565),Yt(0.5),Zt(-2.3),0.01,Yt(0.4),Zt(0.8));
        // 6 smoke grenade launchers per side on the forward cheek-side
        for(let r=0;r<2;r++) for(let k=0;k<3;k++)
          addMesh(new THREE.CylinderGeometry(0.035,0.035,0.2,8),darkMat,turretPivot,sd*Xt(1.55),Yt(0.5+r*0.14),Zt(0.1+k*0.2),0,0,-sd*0.9);
      });
      box(turretPivot,darkMat,0,Yt(0.45),Zt(-3.45),Xt(1.7),Yt(0.64),Zt(0.3));
      [-1,0,1].forEach(k=>box(turretPivot,steelMat,k*Xt(0.82),Yt(0.45),Zt(-3.62),0.03,Yt(0.66),0.03));
      box(turretPivot,steelMat,0,Yt(0.77),Zt(-3.62),Xt(1.7),0.03,0.03); box(turretPivot,steelMat,0,Yt(0.13),Zt(-3.62),Xt(1.7),0.03,0.03);
      // Wind sensor and antenna bases
      addMesh(new THREE.CylinderGeometry(0.012,0.012,0.5,6),darkMat,turretPivot,0,Yt(0.88)+0.25,Zt(-2.4));
      [-1,1].forEach(sd=>{ addMesh(new THREE.CylinderGeometry(0.05,0.06,0.08,10),detailMat,turretPivot,sd*Xt(0.7),Yt(0.88)+0.04,Zt(-2.6)); });
    } else if(isK1){
      // ================= K1 TURRET (stage 1: silhouette only) =================
      // ASSUMPTION flagged for screenshot review: the K1 turret is M1-Abrams-derived (per
      // Wikipedia/general references), so this reuses the M1's flat-front-wall + protruding
      // wedge cheek-block shape above, scaled down by K1_WID_RATIO and K1_TURRET_LEN_RATIO
      // (the K1's bustle is shorter than the M1's - it doesn't carry the M1's bustle ammo
      // racks - hence the extra length ratio beyond the hull's own K1_LEN_RATIO). Hatches,
      // sights, stowage and smoke dischargers are deliberately left for a later fittings pass.
      const m1ST=[
        [-3.30,0.94,1.02,0.86,0.78, 0.11,0.30,0.74,0.78, 0],
        [-2.85,1.10,1.20,1.00,0.90, 0.11,0.31,0.80,0.84, 0],
        [-2.00,1.30,1.42,1.18,1.06, 0.09,0.32,0.84,0.89, 0],
        [-1.20,1.46,1.60,1.30,1.18, 0.05,0.34,0.88,0.93, 0],
        [-0.40,1.48,1.62,1.32,1.20, 0.02,0.34,0.90,0.95, 0],
        [ 0.60,1.48,1.62,1.32,1.20, 0.02,0.34,0.90,0.96, 0],
        [ 1.20,1.46,1.60,1.30,1.18, 0.02,0.34,0.88,0.94, 0.08]
      ];
      const ST=m1ST.map(([z,wb,ws,wt,wc,yb,ym,ye,yr,lean])=>
        [z*K1_TURRET_LEN_RATIO,wb*K1_WID_RATIO,ws*K1_WID_RATIO,wt*K1_WID_RATIO,wc*K1_WID_RATIO,
         yb*K1_TURRET_HGT_RATIO,ym*K1_TURRET_HGT_RATIO,ye*K1_TURRET_HGT_RATIO,yr*K1_TURRET_HGT_RATIO,lean*K1_TURRET_LEN_RATIO]);
      const ringM=([z,wb,ws,wt,wc,yb,ym,ye,yr,lean])=>{
        const R=[[wb,yb],[ws,ym],[wt,ye],[wc,yr]];
        return [[0,yb],...R,[0,yr],...R.slice().reverse().map(([x,y])=>[-x,y])].map(([x,y])=>[ku(x),ku(y),ku(z-lean*(y-yb)/(yr-yb))]);
      };
      const rings=ST.map(ringM), tris=[];
      for(let k=0;k<rings.length-1;k++) for(let e=0;e<rings[k].length;e++){
        const f=(e+1)%rings[k].length, A=rings[k], B=rings[k+1];
        tris.push([A[e],A[f],B[f]],[A[e],B[f],B[e]]);
      }
      const capM=(Rg,front)=>{
        const c=[0,Rg.reduce((m,v)=>m+v[1],0)/Rg.length,Rg.reduce((m,v)=>m+v[2],0)/Rg.length];
        for(let e=0;e<Rg.length;e++){ const f=(e+1)%Rg.length; tris.push(front?[c,Rg[e],Rg[f]]:[c,Rg[f],Rg[e]]); }
      };
      capM(rings[0],false); capM(rings[rings.length-1],true);
      const solidGeo=(tl,ctr)=>{
        const tPos=[], tUv=[];
        tl.forEach(([p,q,r])=>{
          let n=[(q[1]-p[1])*(r[2]-p[2])-(q[2]-p[2])*(r[1]-p[1]),(q[2]-p[2])*(r[0]-p[0])-(q[0]-p[0])*(r[2]-p[2]),(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0])];
          const cx=(p[0]+q[0]+r[0])/3-ctr[0], cy=(p[1]+q[1]+r[1])/3-ctr[1], cz=(p[2]+q[2]+r[2])/3-ctr[2];
          if(n[0]*cx+n[1]*cy+n[2]*cz<0){ const sw=q; q=r; r=sw; n=n.map(v=>-v); }
          const ay=Math.abs(n[1]), ax=Math.abs(n[0]), az=Math.abs(n[2]);
          const u=ay>=ax&&ay>=az?[0,2]:ax>=az?[1,2]:[0,1];
          [p,q,r].forEach(v=>{ tPos.push(v[0],v[1],v[2]); tUv.push(v[u[0]]*0.35,v[u[1]]*0.35); });
        });
        const g=new THREE.BufferGeometry();
        g.setAttribute('position',new THREE.Float32BufferAttribute(tPos,3));
        g.setAttribute('uv',new THREE.Float32BufferAttribute(tUv,2));
        g.computeVertexNormals();
        return g;
      };
      markArmor(addMesh(solidGeo(tris,[0,ku(0.45*K1_TURRET_HGT_RATIO),ku(-1.05*K1_TURRET_LEN_RATIO)]),turretMat,turretPivot,0,0,0),n=>{
        if(n.y>0.8) return {t:25,zone:'turret-roof'};
        if(n.y<-0.8) return {t:20,zone:'turret-belly'};
        if(n.z>0.5) return comp(380,650,31,'turret-front');
        if(n.z<-0.5) return {t:40,zone:'turret-rear'};
        return {t:50,zone:'turret-side'};
      });
      const cheekBlock=sd=>{
        const yb=ku(0.05*K1_TURRET_HGT_RATIO), yt=ku(0.90*K1_TURRET_HGT_RATIO);
        // K1 front-view profile (from the user's sketch): each cheek is a five-sided shape seen from the front. The top is
        // nearly level, the OUTER edge leans in toward the top, the INNER edge (facing the gun) is vertical for all but the
        // bottom quarter and then a shallow chamfer runs down and away from the gun to the lowest corner, and the underside slopes up
        // toward the outer side. The sides stay flat; only that lower inner corner is cut.
        // Points are [x, v] (x = raw distance from the gun axis, v = 0..1 height fraction of the block); z follows the
        // block's existing sloped front (plan z at v=0 -> z at v=1), so the wedge-shaped front is unchanged.
        const yv=v=>yb+(yt-yb)*v;
        const P=(x,z,v)=>[sd*ku(x*K1_WID_RATIO),yv(v),ku(z*K1_TURRET_LEN_RATIO)];
        const zf=(zb,zt,v)=>zb+(zt-zb)*v;
        const B0=P(1.76,0.70,0.20), B1=P(1.42,zf(1.62,0.77,0.127),0.127), B2=P(0.83,2.12,0), B3=P(0.83,0.70,0);
        const M2=P(0.42,zf(2.12,1.27,0.25),0.25), M3=P(0.42,0.70,0.25);
        const T0=P(1.46,0.70,1), T1=P(1.42,0.77,1), T2=P(0.42,1.27,0.96), T3=P(0.42,0.70,0.96);
        const poly=pts=>{ const t=[]; for(let k=1;k<pts.length-1;k++) t.push([pts[0],pts[k],pts[k+1]]); return t; };
        const tl=[...poly([B0,B1,B2,B3]),...poly([T0,T1,T2,T3]),...poly([B0,B1,T1,T0]),...poly([B1,B2,M2,T2,T1]),
                  ...poly([M2,M3,T3,T2]),...poly([B2,B3,M3,M2]),...poly([B3,B0,T0,T3,M3])];
        const all=[B0,B1,B2,B3,M2,M3,T0,T1,T2,T3], ctr=[0,1,2].map(k=>all.reduce((m,v)=>m+v[k],0)/all.length);
        const mesh=markArmor(addMesh(solidGeo(tl,ctr),turretMat,turretPivot,0,0,0),n=>{
          if(n.y>0.8) return {t:25,zone:'turret-roof'};
          if(n.y<-0.8) return {t:20,zone:'turret-belly'};
          if(n.z>0.15) return comp(380,650,31,'turret-front');
          return {t:50,zone:'turret-side'};
        });
        // Legibility fix (screenshots showed the cheek block blending into the main turret body under
        // flat lighting, even though it's geometrically proud of it): a dark seam strip along the inner
        // vertical edge where the block meets the body, so the step reads at any angle/lighting.
        addMesh(new THREE.BoxGeometry(0.025,yt-yb+0.02,0.035),darkMat,turretPivot,sd*ku(0.42*K1_WID_RATIO),(yb+yt)/2,ku(0.70*K1_TURRET_LEN_RATIO));
        return mesh;
      };
      [-1,1].forEach(cheekBlock);
      // ================= K1 TURRET FITTINGS (stage 2) =================
      // Layout from K1 references (Jane's / GlobalSecurity / War Thunder dev references / the reference photo): commander on the
      // RIGHT (low vision cupola, 12.7 mm K6 on a pintle, SFIM VS-580 panoramic sight head ahead of him), gunner's thermal sight
      // box on the right-front roof, loader on the LEFT (hatch, rotating periscope, 7.62 mm M60D on a pintle), six smoke
      // dischargers on each front cheek, wire-mesh stowage baskets round the bustle, roof lifting eyes and two whip antennas.
      // Authored in metres relative to the turret ring (y=0 = hull roof at the ring, +z forward) the natural way, with +x = the
      // real tank's RIGHT; tb/tc mirror that into game space (+x = tank's left).
      {
        const tb=(mat,x,y,z,w,h,d,rx=0,ry=0,rz=0)=>box(turretPivot,mat,ku(-x),ku(y),ku(z),ku(w),ku(h),ku(d),rx,-ry,-rz);
        const tc=(mat,rt,rb,len,x,y,z,rx=0,ry=0,rz=0,seg=16)=>addMesh(new THREE.CylinderGeometry(ku(rt),ku(rb),ku(len),seg),mat,turretPivot,ku(-x),ku(y),ku(z),rx,-ry,-rz);
        const RS=ST.map(r=>[r[0],r[8]]);   // roof height by z, from the turret's own station table
        const roof=z=>{
          if(z<=RS[0][0]) return RS[0][1];
          for(let i=0;i<RS.length-1;i++){ const a=RS[i], b=RS[i+1]; if(z<=b[0]) return a[1]+(b[1]-a[1])*(z-a[0])/(b[0]-a[0]); }
          return RS[RS.length-1][1];
        };
        const redMat=new THREE.MeshStandardMaterial({color:0x7a2a22,roughness:0.8});

        // --- Commander's cupola (right, behind centre): low drum, ring of vision blocks, round hatch ---
        { const cx=0.55, cz=-0.95, y=roof(cz);
          tc(turretMat,0.42,0.44,0.14,cx,y+0.07,cz,0,0,0,28);
          tc(turretMat,0.385,0.385,0.13,cx,y+0.205,cz,0,0,0,28);
          for(let k=0;k<10;k++){ const a=k/10*Math.PI*2+0.15; tb(darkMat,cx+Math.sin(a)*0.392,y+0.205,cz+Math.cos(a)*0.392,0.14,0.085,0.035,0,a,0); }
          tc(steelMat,0.36,0.36,0.03,cx,y+0.285,cz,0,0,0,28);                       // vision-block roof ring
          tc(turretMat,0.32,0.33,0.05,cx,y+0.325,cz,0,0,0,28);                      // hatch cover
          tb(steelMat,cx+0.10,y+0.365,cz-0.06,0.15,0.03,0.03);                       // hatch handle
          tb(detailMat,cx,y+0.345,cz-0.33,0.22,0.05,0.06);                           // hatch hinge
          tb(detailMat,cx-0.20,y+0.35,cz+0.12,0.12,0.04,0.12);                       // periscope in the hatch
        }
        // --- 12.7 mm K6 heavy machine gun on a pintle ahead-right of the cupola, barrel forward ---
        { const mx=1.04, y=roof(-0.8);
          tc(steelMat,0.10,0.11,0.12,mx,y+0.06,-0.82);
          tc(detailMat,0.035,0.04,0.34,mx,y+0.29,-0.82);
          tb(detailMat,mx,y+0.49,-0.82,0.14,0.10,0.20);                              // cradle
          tb(darkMat,mx,y+0.54,-0.66,0.12,0.15,0.62);                                // receiver
          tc(darkMat,0.036,0.036,0.52,mx,y+0.55,-0.09,Math.PI/2,0,0,12);             // perforated barrel jacket
          tc(darkMat,0.02,0.02,1.14,mx,y+0.55,0.22,Math.PI/2,0,0,10);                // barrel
          tc(darkMat,0.034,0.026,0.14,mx,y+0.55,0.86,Math.PI/2,0,0,10);              // flash hider
          tb(detailMat,mx-0.14,y+0.43,-0.66,0.16,0.22,0.30);                         // ammunition box
          tb(steelMat,mx,y+0.56,-0.99,0.22,0.04,0.04); tb(darkMat,mx-0.09,y+0.52,-0.99,0.03,0.09,0.03); tb(darkMat,mx+0.09,y+0.52,-0.99,0.03,0.09,0.03); // spade grips
        }
        // --- SFIM VS-580 commander's panoramic sight head (right, ahead of the cupola) ---
        { const sx=0.40, sz=-0.22, y=roof(sz);
          tc(steelMat,0.20,0.22,0.05,sx,y+0.025,sz,0,0,0,20);
          tb(turretMat,sx,y+0.17,sz,0.32,0.30,0.36);
          tb(darkMat,sx,y+0.20,sz+0.185,0.22,0.15,0.02);                             // sight window
          tb(steelMat,sx,y+0.33,sz,0.34,0.03,0.38);                                  // top cover
          tb(darkMat,sx-0.165,y+0.18,sz+0.05,0.015,0.10,0.14);                       // side window
        }
        // --- Gunner's thermal sight (GPTTS) box: right-front roof, hinged armoured cover, window and laser aperture ---
        { const gx=0.70, gz=0.38, y=roof(gz);
          tb(turretMat,gx,y+0.14,gz,0.56,0.28,0.56);
          tb(steelMat,gx,y+0.295,gz,0.58,0.03,0.58);
          tb(darkMat,gx,y+0.30,gz,0.012,0.012,0.58);                                 // cover seam
          tb(darkMat,gx-0.12,y+0.15,gz+0.285,0.22,0.12,0.02);                        // thermal / day window
          tb(darkMat,gx+0.14,y+0.15,gz+0.285,0.10,0.10,0.02);                        // laser rangefinder aperture
          tb(detailMat,gx-0.18,y+0.30,gz-0.27,0.08,0.04,0.05); tb(detailMat,gx+0.18,y+0.30,gz-0.27,0.08,0.04,0.05); // hinges
        }
        // --- Loader's hatch (left, behind centre), rotating periscope ahead of it ---
        { const lx=-0.60, lz=-0.90, y=roof(lz);
          tc(turretMat,0.36,0.38,0.10,lx,y+0.05,lz,0,0,0,26);
          tc(steelMat,0.31,0.31,0.03,lx,y+0.115,lz,0,0,0,26);
          tc(turretMat,0.30,0.31,0.04,lx,y+0.145,lz,0,0,0,26);                       // hatch cover
          tb(steelMat,lx-0.08,y+0.185,lz-0.04,0.14,0.03,0.03);                        // handle
          tb(detailMat,lx,y+0.16,lz-0.33,0.20,0.04,0.06);                             // hinge
          tb(detailMat,lx,y+0.12,-0.52,0.20,0.10,0.14); tb(darkMat,lx,y+0.125,-0.445,0.14,0.06,0.02);  // rotating periscope
        }
        // --- 7.62 mm M60D on a pintle by the loader's hatch ---
        { const mx=-1.00, y=roof(-0.55);
          tc(steelMat,0.09,0.10,0.10,mx,y+0.05,-0.55);
          tc(detailMat,0.03,0.035,0.38,mx,y+0.29,-0.55);
          tb(detailMat,mx,y+0.50,-0.55,0.10,0.08,0.20);                              // cradle
          tb(darkMat,mx,y+0.55,-0.50,0.09,0.12,0.50);                                // receiver
          tc(darkMat,0.016,0.016,0.56,mx,y+0.56,0.03,Math.PI/2,0,0,8);               // barrel
          tc(darkMat,0.010,0.010,0.40,mx,y+0.51,-0.02,Math.PI/2,0,0,6);              // gas tube
          tc(darkMat,0.024,0.018,0.08,mx,y+0.56,0.35,Math.PI/2,0,0,8);               // flash hider
          tb(detailMat,mx+0.12,y+0.46,-0.50,0.13,0.17,0.22);                         // ammunition box
          tb(darkMat,mx,y+0.55,-0.85,0.06,0.10,0.18);                                // butt
        }
        // --- Roof lifting eyes ---
        [[1.0,-1.95],[-1.0,-1.95],[-1.05,0.85],[0.15,0.95]].forEach(([x,z])=>{
          const y=roof(z);
          tb(detailMat,x,y+0.015,z,0.10,0.03,0.10);
          addMesh(new THREE.TorusGeometry(ku(0.05),ku(0.013),6,12),steelMat,turretPivot,ku(-x),ku(y+0.065),ku(z),0,Math.PI/2,0);
        });
        // --- Rear roof: blower / air-intake grille, two whip antennas ---
        { const gz=-2.25, y=roof(gz);
          tb(detailMat,0,y+0.012,gz,1.10,0.024,0.70);
          for(let k=0;k<6;k++) tb(darkMat,0,y+0.026,gz-0.27+k*0.108,1.0,0.008,0.04);
          [[0.88,-2.55],[-0.88,-2.45]].forEach(([x,z],i)=>{
            const ay=roof(z), mastH=i?2.4:2.9;
            tc(steelMat,0.07,0.09,0.10,x,ay+0.05,z);
            tc(darkMat,0.012,0.008,mastH,x,ay+0.10+mastH/2,z,0,0,0,6);
          });
        }
        // --- Wire-mesh stowage baskets: one across the rear of the bustle, one on each side of it (game-space x, not mirrored) ---
        const wireMat=new THREE.MeshStandardMaterial({color:0x1b1d18,roughness:1,transparent:true,opacity:0.42,depthWrite:false});
        const basket=(xg,y,z,w,h,d,yaw,kit)=>{
          const g=new THREE.Group(); g.position.set(ku(xg),ku(y),ku(z)); g.rotation.y=yaw; turretPivot.add(g);
          const gb=(mat,x,yy,zz,bw,bh,bd)=>box(g,mat,ku(x),ku(yy),ku(zz),ku(bw),ku(bh),ku(bd));
          const t=0.03;
          [-1,1].forEach(sy=>[-1,1].forEach(sz=>gb(darkMat,0,sy*h/2,sz*d/2,w,t,t)));                  // top and bottom frame, along x
          [-1,1].forEach(sx=>[-1,1].forEach(sz=>gb(darkMat,sx*w/2,0,sz*d/2,t,h,t)));                  // corner posts
          [-1,1].forEach(sx=>[-1,1].forEach(sy=>gb(darkMat,sx*w/2,sy*h/2,0,t,t,d)));                  // top and bottom frame, along z
          for(let k=1;k<5;k++) gb(darkMat,-w/2+w*k/5,0,d/2,t*0.5,h,t*0.5);                            // mesh bars on the outer face
          gb(darkMat,0,0,d/2,w,t*0.5,t*0.5);
          gb(wireMat,0,0,0,w*0.98,h*0.98,d*0.98);                                                     // translucent mesh fill
          gb(turretMat,0,-h/2+0.012,0,w*0.98,0.024,d*0.98);                                           // solid floor
          if(kit) addMesh(new THREE.CylinderGeometry(ku(h*0.26),ku(h*0.26),ku(Math.max(w,d)*0.7),10),detailMat,g,0,ku(-h*0.18),0,d>w?Math.PI/2:0,0,d>w?0:Math.PI/2); // rolled tarpaulin / bedding roll
        };
        basket(0,0.30,-3.25,1.90,0.46,0.46,0,true);                                 // rear
        [-1,1].forEach(s=>basket(s*1.62,0.34,-1.85,0.36,0.44,1.30,0.29*s,true));  // sides, angled to follow the tapering bustle
        // --- Smoke grenade dischargers: a bank of 3x2 tubes on the sloped front face of each cheek block, near its outer corner ---
        const smokeBank=sd=>{
          const HR=K1_TURRET_HGT_RATIO, WR=K1_WID_RATIO, LR=K1_TURRET_LEN_RATIO, yb0=0.05*HR, yt0=0.90*HR, zf=(a,b,v)=>a+(b-a)*v;
          const fp=(u,v)=>{ const ox=1.42, oz=zf(1.62,0.77,v), ix=0.42, iz=zf(2.12,1.27,v); return new THREE.Vector3(sd*(ox+(ix-ox)*u)*WR, yb0+(yt0-yb0)*v, (oz+(iz-oz)*u)*LR); };
          const c=fp(0.24,0.5), tu=fp(1,0.5).sub(fp(0,0.5)).normalize(), tv=fp(0.24,1).sub(fp(0.24,0)).normalize();
          const nrm=new THREE.Vector3().crossVectors(tu,tv).normalize(); if(nrm.z<0) nrm.negate();
          let xa=tu.clone().sub(nrm.clone().multiplyScalar(tu.dot(nrm))).normalize(), ya=new THREE.Vector3().crossVectors(nrm,xa).normalize();
          if(ya.y<0){ xa.negate(); ya.negate(); }
          const g=new THREE.Group(); g.position.set(ku(c.x),ku(c.y),ku(c.z));
          g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xa,ya,nrm)); turretPivot.add(g);
          box(g,detailMat,0,0,ku(0.02),ku(0.40),ku(0.32),ku(0.04));                                    // mounting plate
          [-1,1].forEach(s=>box(g,darkMat,0,s*ku(0.16),ku(0.05),ku(0.42),ku(0.02),ku(0.03)));         // rails
          for(let i=-1;i<=1;i++) for(let j=0;j<2;j++){
            const tx=ku(i*0.12), ty=ku(j?0.075:-0.075);
            addMesh(new THREE.CylinderGeometry(ku(0.038),ku(0.038),ku(0.26),10),darkMat,g,tx,ty,ku(0.17),Math.PI/2,0,0);       // 66 mm tube
            addMesh(new THREE.CylinderGeometry(ku(0.041),ku(0.041),ku(0.03),10),steelMat,g,tx,ty,ku(0.295),Math.PI/2,0,0);    // muzzle ring
          }
        };
        [-1,1].forEach(smokeBank);
      }
      addMesh(new THREE.CylinderGeometry(ku(1.12*K1_WID_RATIO),ku(1.12*K1_WID_RATIO),0.05,36),darkMat,turretPivot,0,0.025,0); // turret ring seal
      addMesh(new THREE.TorusGeometry(ku(1.12*K1_WID_RATIO),0.02,8,36),steelMat,turretPivot,0,0.052,0,Math.PI/2,0,0);
    } else if(isChallenger1){
      // ================= CHALLENGER 1 (Mk 3) TURRET =================
      // Welded Chobham-armoured turret, metres relative to the turret ring centre (y = 0 is the hull roof at the ring). In plan it is an
      // arrowhead: straight sides, then front cheeks that sweep in (24 deg, then 28 deg) to a narrow nose. In profile the roof is flat back
      // to the cupola, then the front is one long sloping plate (38 deg from horizontal) that falls from the roof edge to a low chin, so the
      // gun comes out of the middle of a slope, not out of a wall. The sides lean in about 3 deg and the roof edges are chamfered.
      const RY=1.07;
      const TS=[[-2.65,0.95,0.88],[-2.55,1.12,0.98],[-2.35,1.23,1.05],[-2.20,1.25,RY],[0.20,1.25,RY],[0.40,1.17,1.05],[1.00,0.95,0.58],[1.62,0.62,0.10]]; // z, half-width, roof y
      const YB=-0.05;
      const tRing=([z,w,yt])=>{
        const h=yt-YB, ya=YB+Math.min(0.12,h*0.3), yc=yt-Math.min(0.18,h*0.4);
        return [[-0.95*w,YB],[0.95*w,YB],[w,ya],[0.945*w,yc],[0.86*w,yt],[-0.86*w,yt],[-0.945*w,yc],[-w,ya]].map(([x,y])=>[c1x(x),c1y(y),c1z(z)]);
      };
      const tRings=TS.map(tRing), tTris=[];
      for(let k=0;k<tRings.length-1;k++){
        const A=tRings[k], B=tRings[k+1];
        for(let e=0;e<8;e++){ const f=(e+1)%8; tTris.push([A[e],A[f],B[f]],[A[e],B[f],B[e]]); }
      }
      const tCap=(Rg,front)=>{
        const c=[0,(Rg[0][1]+Rg[4][1])/2,Rg[0][2]];
        for(let e=0;e<8;e++){ const f=(e+1)%8; tTris.push(front?[c,Rg[e],Rg[f]]:[c,Rg[f],Rg[e]]); }
      };
      tCap(tRings[0],false); tCap(tRings[tRings.length-1],true);
      // Orient every triangle outward from the (convex) body's centre, so hit-testing and lighting see the right face.
      const ctr=[0,c1y(0.45),c1z(-0.5)], tp=[];
      tTris.forEach(([p,q,r])=>{
        const n=[(q[1]-p[1])*(r[2]-p[2])-(q[2]-p[2])*(r[1]-p[1]),(q[2]-p[2])*(r[0]-p[0])-(q[0]-p[0])*(r[2]-p[2]),(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0])];
        const cx=(p[0]+q[0]+r[0])/3-ctr[0], cy=(p[1]+q[1]+r[1])/3-ctr[1], cz=(p[2]+q[2]+r[2])/3-ctr[2];
        if(n[0]*cx+n[1]*cy+n[2]*cz<0) tp.push(...p,...r,...q); else tp.push(...p,...q,...r);
      });
      const tg=new THREE.BufferGeometry();
      tg.setAttribute('position',new THREE.Float32BufferAttribute(tp,3)); tg.computeVertexNormals(); withUV(tg);
      // Approximate RHA-equivalent values for gameplay (the real figures are classified).
      markArmor(addMesh(tg,turretMat,turretPivot,0,0,0),n=>{
        if(n.y>0.85) return {t:50,zone:'turret-roof'};
        if(n.y<-0.85) return {t:30,zone:'turret-belly'};
        if(n.z>0.3) return comp(480,580,0,'turret-front');
        if(n.z<-0.6) return {t:60,zone:'turret-rear'};
        return comp(250,350,55,'turret-side');
      });
      const roofAt=z=>{ let i=0; while(i<TS.length-2&&z>TS[i+1][0]) i++; const a=TS[i], b=TS[i+1], t=Math.max(0,Math.min(1,(z-a[0])/(b[0]-a[0]))); return a[2]+(b[2]-a[2])*t; };
      // In this game forward is +z, so +x is the tank's LEFT. The details below are authored the natural way (+x = the real tank's right:
      // commander and TOGS right, loader left) and mirrored into game space by mb/mcy.
      const mb=(par,mat,x,y,z,w,h,d,rx=0,ry=0,rz=0)=>b1(par,mat,-x,y,z,w,h,d,rx,-ry,-rz);
      const mcy=(par,mat,rt,rb,len,x,y,z,rx=0,ry=0,rz=0,seg=14)=>cy1(par,mat,rt,rb,len,-x,y,z,rx,-ry,-rz,seg);
      // Turret ring seal
      addMesh(new THREE.CylinderGeometry(c1x(1.1),c1x(1.1),0.05,36),darkMat,turretPivot,0,-0.06,0);
      // Raised weld seams where the sloping front plate meets the roof and the cheeks, roof panel line and lifting eyes
      b1(turretPivot,detailMat,0,roofAt(0.4)+0.012,0.4,2.1,0.03,0.05);
      [-1,1].forEach(sd=>{ b1(turretPivot,detailMat,sd*1.1,0.5,0.7,0.04,0.78,0.05,0,sd*0.37,0); });
      b1(turretPivot,detailMat,0,RY+0.005,-1.2,2.2,0.012,0.03);
      [[-1.05,-2.0],[1.05,-2.0],[-0.95,0.0],[0.95,0.0]].forEach(([x,z])=>{ mcy(turretPivot,steelMat,0.05,0.05,0.07,x,RY+0.04,z,0,0,0,8); });
      // Commander's cupola (right of centre, behind the gunner): periscope ring, hatch, the large commander's sight head (top at 2.95 m) and the
      // L37A2 7.62 mm MG on its pintle
      { const cx=0.62, cz=-0.62;
        mcy(turretPivot,turretMat,0.36,0.38,0.22,cx,RY+0.11,cz,0,0,0,24);
        for(let k=0;k<9;k++){ const a=k/9*Math.PI*2+0.2; mb(turretPivot,darkMat,cx+Math.sin(a)*0.37,RY+0.2,cz+Math.cos(a)*0.37,0.13,0.07,0.04,0,a,0); }
        mcy(turretPivot,turretMat,0.3,0.31,0.1,cx,RY+0.27,cz,0,0,0,22);
        mcy(turretPivot,steelMat,0.26,0.26,0.03,cx-0.02,RY+0.34,cz-0.03,0,0,0.12,22);
        mb(turretPivot,turretMat,cx+0.02,RY+0.30,cz+0.36,0.3,0.3,0.34); mb(turretPivot,darkMat,cx+0.02,RY+0.33,cz+0.54,0.22,0.14,0.02);   // sight head
        mb(turretPivot,steelMat,cx+0.02,RY+0.46,cz+0.36,0.34,0.03,0.38);
        mcy(turretPivot,detailMat,0.03,0.03,0.3,cx-0.26,RY+0.36,cz+0.1,0,0,0,8);                                                          // pintle post
        mb(turretPivot,detailMat,cx-0.26,RY+0.5,cz+0.2,0.1,0.12,0.36); mcy(turretPivot,darkMat,0.018,0.018,0.65,cx-0.26,RY+0.52,cz+0.65,Math.PI/2,0,0,8);
        mb(turretPivot,hullMat,cx-0.42,RY+0.4,cz+0.1,0.1,0.14,0.2);                                                                         // ammunition box
      }
      // Loader's hatch (left rear), turning ring and cover
      mcy(turretPivot,turretMat,0.33,0.35,0.08,-0.62,RY+0.04,-0.5,0,0,0,22); mcy(turretPivot,steelMat,0.27,0.27,0.03,-0.62,RY+0.1,-0.5,0,0,-0.14,22);
      mb(turretPivot,detailMat,-0.62,RY+0.12,-0.1,0.26,0.1,0.18);                                                                            // loader's periscope
      // Gunner's TLS sight head (right, forward of the cupola) and its laser window on the sloping front plate
      mb(turretPivot,turretMat,0.5,RY+0.1,0.1,0.34,0.2,0.34); mb(turretPivot,darkMat,0.5,RY+0.1,0.28,0.24,0.12,0.02);
      mb(turretPivot,darkMat,0.56,0.82,0.7,0.24,0.14,0.02,-0.91,0,0);
      // TOGS thermal-sight barbette: a box built out of the right front cheek (set flush with it), with its window and roof plate
      mb(turretPivot,turretMat,1.16,0.60,0.62,0.50,0.55,0.86,0,-0.40,0); mb(turretPivot,darkMat,1.05,0.62,1.02,0.34,0.3,0.03,0,-0.40,0);
      mb(turretPivot,steelMat,1.16,0.89,0.62,0.54,0.03,0.9,0,-0.40,0);
      // Wire-mesh stowage baskets along both sides of the bustle, rear corner bins and the rear basket
      basket1(turretPivot,1.47,0.30,-1.35,0.36,0.46,1.5,true);
      basket1(turretPivot,-1.47,0.30,-1.35,0.36,0.46,1.5,true);
      [-1,1].forEach(sd=>{ b1(turretPivot,turretMat,sd*0.95,0.33,-2.95,0.56,0.56,0.55); b1(turretPivot,detailMat,sd*0.95,0.62,-2.95,0.58,0.04,0.57); });
      basket1(turretPivot,0,0.34,-2.95,0.9,0.5,0.5,true);
      // NBC pack on the rear roof, antenna bases with masts
      b1(turretPivot,turretMat,0,RY+0.18,-2.0,1.0,0.36,0.52); b1(turretPivot,detailMat,0,RY+0.37,-2.0,0.9,0.03,0.46);
      [-1,1].forEach(sd=>{ cy1(turretPivot,detailMat,0.07,0.09,0.12,sd*0.98,RY+0.06,-2.25,0,0,0,10); cy1(turretPivot,darkMat,0.012,0.012,1.3,sd*0.98,RY+0.74,-2.25,0,0,0,6); });
      // Smoke grenade dischargers: two banks of five 66 mm tubes on the sides of the front of the turret
      [-1,1].forEach(sd=>{
        b1(turretPivot,detailMat,sd*1.29,0.52,-0.2,0.06,0.26,0.7);
        for(let k=0;k<5;k++) mcy(turretPivot,darkMat,0.035,0.035,0.28,sd*1.34,0.56,-0.45+k*0.12,0,0,-sd*0.7,8);
      });
    } else if(isTiger){
      // Tiger 131: broad, nearly vertical turret plates and a wide flat mantlet.
      buildFacetedTurret(turretPivot,{
        bottomHalf:1.08,topHalf:1.0,bottomY:0.08,topY:0.88,
        rearBottom:-1.02,rearTop:-0.92,frontBottom:0.96,frontTop:0.84
      },turretMat,{front:100,side:80,rear:80,roof:25,belly:25});
      armorBox(turretPivot,turretMat,0,0.46,0.96,1.68,0.58,0.32,100,'turret-mantlet');
      // Rear turret bustle and angular side vision blocks.
      box(turretPivot,detailMat,0,0.36,-1.02,1.22,0.36,0.24);
      [-1,1].forEach(side=>{
        box(turretPivot,detailMat,side*1.075,0.57,0.39,0.035,0.12,0.22);
      });
      box(turretPivot,detailMat,0,0.95,-0.43,0.52,0.1,0.46);
      box(turretPivot,detailMat,-0.49,0.69,-0.47,0.12,0.18,0.16);
    } else {
      // Panther: a narrower faceted turret, steep front plate and angular chin.
      // frontTopHalf is pulled in a bit tighter than topHalf so the mantlet face
      // tapers inward more than the turret's sides/rear.
      buildFacetedTurret(turretPivot,{
        bottomHalf:0.9,topHalf:0.68,frontTopHalf:0.54,bottomY:0.08,topY:0.78,noShell:true,
        rearBottom:-1.0,rearTop:-0.78,frontBottom:0.8,frontTop:0.58
      },turretMat,{front:100,side:45,rear:45,roof:16,belly:16});
      const ghost=new THREE.MeshBasicMaterial({visible:false,side:THREE.DoubleSide});
      armorBox(turretPivot,ghost,0,0.39,0.85,0.6,0.5,0.5,100,'turret-mantlet');
      armorBox(turretPivot,ghost,0,0.12,0.68,0.84,0.18,0.3,100,'mantlet-chin');
    }

    if(!isSturer && !isFV4005 && !isT54E1 && !isAMX50 && !isLeo && !isM1 && !isT72 && !isChallenger1 && !isK1){
      // Cupola, hatch and periscope blocks (Tiger + Panther + IS-7 only)
      const cupolaX = isTiger ? -0.48 : 0.38;
      box(turretPivot,detailMat,cupolaX,0.88,-0.38,isTiger?0.5:0.42,0.2,isTiger?0.48:0.42);
      box(turretPivot,steelMat,cupolaX,1.01,-0.38,isTiger?0.34:0.29,0.08,isTiger?0.33:0.29);
      box(turretPivot,detailMat,isTiger?0.48:-0.4,0.84,-0.27,0.42,0.08,0.4);

      // Tiger 131's famous tactical number on both turret sides.
      if(isTiger){
        const markCanvas = document.createElement('canvas');
        markCanvas.width=256; markCanvas.height=96;
        const ctx=markCanvas.getContext('2d');
        ctx.font='bold 72px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.lineWidth=6; ctx.strokeStyle='#28292b'; ctx.strokeText('131',128,50);
        ctx.fillStyle='#a6342b'; ctx.fillText('131',128,50);
        const markMat = new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(markCanvas),transparent:true,side:THREE.DoubleSide,depthWrite:false});
        [-1,1].forEach(side=>{
          const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.78,0.29),markMat);
          mark.position.set(side*1.065,0.39,0.12); mark.rotation.y=side*Math.PI/2;
          mark.renderOrder=2; turretPivot.add(mark);
        });
      }

      if(isTiger){
        addMesh(new THREE.CylinderGeometry(0.28,0.3,0.2,16),turretMat,turretPivot,cupolaX,1.07,-0.38);
        for(let k=0;k<6;k++){
          const a=k/6*Math.PI*2;
          box(turretPivot,darkMat,cupolaX+Math.sin(a)*0.29,1.08,-0.38+Math.cos(a)*0.29,0.12,0.045,0.03,0,a,0);
        }
        addMesh(new THREE.CylinderGeometry(0.22,0.22,0.04,16),detailMat,turretPivot,cupolaX,1.2,-0.38);
        addMesh(new THREE.CylinderGeometry(0.2,0.2,0.05,16),detailMat,turretPivot,0.48,0.92,-0.3);
        box(turretPivot,steelMat,0.48,0.96,-0.3,0.18,0.03,0.04);
        [-1,1].forEach(sd=>{
          for(let k=0;k<3;k++) addMesh(new THREE.CylinderGeometry(0.045,0.045,0.2,8),darkMat,turretPivot,sd*1.08,0.64,0.55+k*0.1,0,0,-sd*1.0);
          addMesh(new THREE.CylinderGeometry(0.05,0.05,0.03,8),darkMat,turretPivot,sd*1.085,0.55,-0.4,0,0,Math.PI/2);
        });
        addMesh(new THREE.CylinderGeometry(0.26,0.26,1.3,16),turretMat,turretPivot,0,0.46,1.12,0,0,Math.PI/2);
        box(turretPivot,darkMat,0.36,0.46,1.35,0.1,0.1,0.06);
        box(turretPivot,darkMat,-0.36,0.5,1.35,0.14,0.1,0.06);
        addMesh(new THREE.CylinderGeometry(0.17,0.17,0.04,14),detailMat,turretPivot,0,0.4,-1.16,Math.PI/2,0,0);
      }
    }
    if(!isTiger && !isSturer && !isFV4005 && !isT54E1 && !isAMX50 && !isLeo && !isM1 && !isT72 && !isChallenger1 && !isK1){
      // Panther turret: flat front plate, sloped sides and a curved half-cylinder rear.
      const tm=turretMat.clone(); tm.side=THREE.DoubleSide;
      const Hb=0.9,Ht=0.68,zc=-0.1,zfB=0.8,zfT=0.58,y0=0.08,y1=0.78,n=24;
      const ring=(h,zf,y)=>{const q=[[-h,y,zf]];for(let i=0;i<=n;i++){const t=Math.PI-i/n*Math.PI;q.push([h*Math.cos(t),y,zc-h*Math.sin(t)]);}q.push([h,y,zf]);return q;};
      const B=ring(Hb,zfB,y0), T=ring(Ht,zfT,y1), pos=[];
      const tri=(u,v,w)=>pos.push(...u,...v,...w);
      const mid=q=>[0,q[0][1],q.reduce((m,v)=>m+v[2],0)/q.length];
      const cB=mid(B), cT=mid(T);
      for(let i=0;i<B.length;i++){
        const j=(i+1)%B.length;
        tri(B[i],B[j],T[j]); tri(B[i],T[j],T[i]);
        tri(cT,T[i],T[j]); tri(cB,B[j],B[i]);
      }
      const tg=new THREE.BufferGeometry();
      tg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
      tg.computeVertexNormals();
      markArmor(addMesh(tg,tm,turretPivot,0,0,0),turretByNormal({front:100,side:45,rear:45,roof:16,belly:16}));
      // Conical Saukopf mantlet around the gun
      markArmor(addMesh(new THREE.CylinderGeometry(0.22,0.22,1.0,24),turretMat,turretPivot,0,0.39,0.76,0,0,Math.PI/2),()=>({t:100,zone:'turret-mantlet'}));
      addMesh(new THREE.CylinderGeometry(0.05,0.05,0.03,10),darkMat,turretPivot,0.2,0.34,0.97,Math.PI/2,0,0);
      box(turretPivot,darkMat,-0.55,0.58,0.66,0.16,0.1,0.04);
      // Smoke dischargers on the front corners, as in the front view
      [-1,1].forEach(sd=>{for(let k=0;k<3;k++) addMesh(new THREE.CylinderGeometry(0.04,0.04,0.2,8),darkMat,turretPivot,sd*0.76,0.6,0.2+k*0.09,0,0,-sd*0.9);});
      // Drum cupola, hatch and rear stowage bin
      const cupolaX = 0.38;
      addMesh(new THREE.CylinderGeometry(0.2,0.22,0.16,16),turretMat,turretPivot,cupolaX,1.04,-0.38);
      for(let k=0;k<6;k++){const t=k/6*Math.PI*2; box(turretPivot,darkMat,cupolaX+Math.sin(t)*0.21,1.05,-0.38+Math.cos(t)*0.21,0.1,0.04,0.03,0,t,0);}
      addMesh(new THREE.CylinderGeometry(0.17,0.17,0.04,14),detailMat,turretPivot,cupolaX,1.14,-0.38);
    }
    // Long main gun; Panther's 75 mm barrel is especially long, Tiger's 88 mm
    // has a thicker tube and a recognizable two-stage muzzle brake.
    // Sturer Emil's 128mm is the longest and thickest of the three.
    // IS-7's 130mm gun is long and powerful.
    // FV4005's 183mm gun is absolutely massive - the largest tank gun ever fielded.
    const barrelLength = isTiger ? 3.05 : isSturer ? 4.15 : isIS7 ? 4.25 : isFV4005 ? 4.8 : isT54E1 ? 4.6 : isAMX50 ? 4.9 : isLeo ? 3.45 : isM1 ? 2.9 : isT72 ? 3.72 : isChallenger1 ? 4.59 : isK1 ? 3.0 : 3.35; // K1: same 105mm L7-family (KM68A1) as Leo/M1 - visible length not published, estimated between the two
    const barrelRadius = isTiger ? 0.105 : isSturer ? 0.135 : isIS7 ? 0.12 : isFV4005 ? 0.15 : isT54E1 ? 0.088 : isAMX50 ? 0.1 : isLeo ? 0.08 : isM1 ? 0.07 : isT72 ? 0.075 : isChallenger1 ? 0.078 : isK1 ? 0.075 : 0.075;
    const barrelPitchPivot = new THREE.Group();
    // For casemate: barrelPitchPivot goes inside gunTraversePivot, not turretPivot
    const barrelPivotParent = isSturer ? gunTraversePivot : turretPivot;
    barrelPitchPivot.position.set(0, isT72 ? u72(0.34) : isM1 ? 0.35 : isK1 ? ku(0.35*K1_TURRET_HGT_RATIO) : isSturer ? 0 : isIS7 ? 0.40 : isFV4005 ? 0.62 : (isT54E1||isAMX50) ? T54_PY : isChallenger1 ? c1y(0.5) : isLeo ? 0.30 : 0.38, isT72 ? u72(1.05) : isM1 ? 1.157 : isK1 ? ku(1.157*K1_TURRET_LEN_RATIO) : isSturer ? 0 : isIS7 ? 0.90 : isFV4005 ? 1.52 : (isT54E1||isAMX50) ? T54_PZ : isChallenger1 ? c1z(0.62) : isLeo ? 1.16 : 0.76);
    barrelPivotParent.add(barrelPitchPivot);
    if(isLeo||isM1||isT72||isK1){ gunSlide=new THREE.Group(); barrelPitchPivot.add(gunSlide); } // only the gun recoils; the mantlet stays put
    if(isT54E1||isAMX50){
      // The upper turret hangs off the pitch pivot (pivot = trunnion axis), so it tilts WITH the gun. The gun
      // itself sits in a child slide group: recoil moves only that, not the whole turret.
      t54Upper.position.set(0,-T54_PY,-T54_PZ); barrelPitchPivot.add(t54Upper);
      gunSlide=new THREE.Group(); barrelPitchPivot.add(gunSlide);
    }
    const gunBody=gunSlide||barrelPitchPivot;
    const barrel = addMesh(new THREE.CylinderGeometry(barrelRadius*0.88,barrelRadius,barrelLength,12),turretMat,
      gunBody,0,0,barrelLength/2,Math.PI/2,0,0);
    if(isTiger){
      addMesh(new THREE.CylinderGeometry(0.14,0.14,0.34,12),turretMat,barrelPitchPivot,0,0,barrelLength+0.08,Math.PI/2,0,0);
      box(barrelPitchPivot,darkMat,0,0,barrelLength+0.255,0.1,0.1,0.02);
      addMesh(new THREE.CylinderGeometry(0.17,0.17,0.3,14),turretMat,barrelPitchPivot,0,0,0.5,Math.PI/2,0,0);
      [barrelLength-0.08,barrelLength+0.24].forEach(z=>addMesh(new THREE.CylinderGeometry(0.17,0.17,0.05,14),turretMat,barrelPitchPivot,0,0,z,Math.PI/2,0,0));
      [-1,1].forEach(sd=>box(barrelPitchPivot,darkMat,sd*0.145,0,barrelLength+0.08,0.02,0.1,0.14));
      addMesh(new THREE.CylinderGeometry(0.06,0.06,0.03,10),darkMat,barrelPitchPivot,0,0,barrelLength+0.27,Math.PI/2,0,0);
    } else if(!isSturer && !isT54E1 && !isAMX50 && !isLeo && !isM1 && !isT72 && !isK1){
      addMesh(new THREE.CylinderGeometry(0.105,0.105,0.22,10),turretMat,barrelPitchPivot,0,0,barrelLength+0.04,Math.PI/2,0,0);
      addMesh(new THREE.CylinderGeometry(0.13,0.13,0.3,12),turretMat,barrelPitchPivot,0,0,0.5,Math.PI/2,0,0);
      [barrelLength-0.06,barrelLength+0.12].forEach(z=>addMesh(new THREE.CylinderGeometry(0.14,0.14,0.07,12),turretMat,barrelPitchPivot,0,0,z,Math.PI/2,0,0));
      [-1,1].forEach(sd=>box(barrelPitchPivot,darkMat,sd*0.11,0,barrelLength+0.04,0.02,0.07,0.1));
      addMesh(new THREE.CylinderGeometry(0.045,0.045,0.03,10),darkMat,barrelPitchPivot,0,0,barrelLength+0.16,Math.PI/2,0,0);
    }
    if(isSturer){
      // 128mm barrel reinforcement ring and large muzzle brake
      // The oversized breech and recoil cylinders sit inside the open fighting
      // compartment and move with the barrel as it recoils after firing.
      // The long breech extends well behind the trunnions, remaining visible
      // over the open compartment even when the barrel is fully depressed.
      box(barrelPitchPivot,steelMat,0,0,-0.94,0.82,0.66,1.72);
      box(barrelPitchPivot,detailMat,0,0.04,-0.27,0.62,0.68,0.46);
      box(barrelPitchPivot,steelMat,0,0,-1.98,0.76,0.58,0.48);
      // Breech block seams, recoil guides and recuperator cylinders.
      [-1,1].forEach(sd=>{
        box(barrelPitchPivot,detailMat,sd*0.34,0,-0.96,0.055,0.76,1.56);
        addMesh(new THREE.CylinderGeometry(0.075,0.075,1.56,10),steelMat,barrelPitchPivot,sd*0.42,0.13,-0.82,Math.PI/2,0,0);
        addMesh(new THREE.CylinderGeometry(0.11,0.11,0.18,10),detailMat,barrelPitchPivot,sd*0.42,0.13,-1.52,Math.PI/2,0,0);
      });
      [-1,1].forEach(sd=>{
        addMesh(new THREE.CylinderGeometry(0.065,0.065,0.92,10),steelMat,barrelPitchPivot,sd*0.34,0,-0.02,Math.PI/2,0,0);
        addMesh(new THREE.CylinderGeometry(0.095,0.095,0.18,10),detailMat,barrelPitchPivot,sd*0.34,0,0.34,Math.PI/2,0,0);
      });
      addMesh(new THREE.CylinderGeometry(0.165,0.165,0.38,12),turretMat,barrelPitchPivot,0,0,0.7,Math.PI/2,0,0);
      // Two-chamber muzzle brake
      addMesh(new THREE.CylinderGeometry(0.19,0.19,0.42,14),turretMat,barrelPitchPivot,0,0,barrelLength+0.12,Math.PI/2,0,0);
      addMesh(new THREE.CylinderGeometry(0.22,0.22,0.18,14),turretMat,barrelPitchPivot,0,0,barrelLength+0.06,Math.PI/2,0,0);
      addMesh(new THREE.CylinderGeometry(0.22,0.22,0.18,14),turretMat,barrelPitchPivot,0,0,barrelLength+0.3,Math.PI/2,0,0);
      [-1,1].forEach(sd=>{
        box(barrelPitchPivot,darkMat,sd*0.195,0,barrelLength+0.12,0.02,0.14,0.48);
        box(barrelPitchPivot,darkMat,sd*0.195,0,barrelLength+0.065,0.02,0.12,0.22);
        box(barrelPitchPivot,darkMat,sd*0.195,0,barrelLength+0.305,0.02,0.12,0.22);
      });
      addMesh(new THREE.CylinderGeometry(0.14,0.14,0.08,12),darkMat,barrelPitchPivot,0,0,barrelLength+0.44,Math.PI/2,0,0);
    }
    if(isIS7){
      // IS-7 130mm gun details: reinforcement rings and large muzzle brake
      addMesh(new THREE.CylinderGeometry(0.17,0.17,0.36,16),turretMat,barrelPitchPivot,0,0,0.7,Math.PI/2,0,0);
      addMesh(new THREE.CylinderGeometry(0.145,0.145,0.28,12),turretMat,barrelPitchPivot,0,0,barrelLength-0.42,Math.PI/2,0,0);
      // Two-chamber Soviet muzzle brake
      addMesh(new THREE.CylinderGeometry(0.205,0.22,0.52,16),turretMat,barrelPitchPivot,0,0,barrelLength+0.09,Math.PI/2,0,0);
      addMesh(new THREE.CylinderGeometry(0.25,0.22,0.16,16),turretMat,barrelPitchPivot,0,0,barrelLength+0.39,Math.PI/2,0,0);
      addMesh(new THREE.CylinderGeometry(0.22,0.25,0.15,16),turretMat,barrelPitchPivot,0,0,barrelLength+0.545,Math.PI/2,0,0);
      [-1,1].forEach(sd=>{
        [-0.08,0.12,0.32].forEach(offset=>box(barrelPitchPivot,darkMat,sd*0.205,0,barrelLength+offset,0.026,0.15,0.105));
      });
      addMesh(new THREE.CylinderGeometry(0.145,0.145,0.065,14),darkMat,barrelPitchPivot,0,0,barrelLength+0.62,Math.PI/2,0,0);
    }
    if(isFV4005){
      // 183 mm L4: a long, plain, tapering tube with a thick jacket where it leaves the sleeve and a
      // modest muzzle collar (no muzzle brake). Breech and recoil gear stay inside the turret shell.
      addMesh(new THREE.CylinderGeometry(0.2,0.225,0.9,20),turretMat,barrelPitchPivot,0,0,0.55,Math.PI/2,0,0);
      addMesh(new THREE.CylinderGeometry(0.19,0.19,0.07,20),detailMat,barrelPitchPivot,0,0,1.02,Math.PI/2,0,0);
      addMesh(new THREE.CylinderGeometry(0.15,0.15,0.22,18),turretMat,barrelPitchPivot,0,0,barrelLength-0.12,Math.PI/2,0,0);
      addMesh(new THREE.CylinderGeometry(0.17,0.17,0.12,18),turretMat,barrelPitchPivot,0,0,barrelLength+0.02,Math.PI/2,0,0);
      addMesh(new THREE.CylinderGeometry(0.12,0.12,0.04,18),darkMat,barrelPitchPivot,0,0,barrelLength+0.08,Math.PI/2,0,0);
      box(barrelPitchPivot,steelMat,0,0,-1.1,0.62,0.6,1.0);
      box(barrelPitchPivot,detailMat,0,0.04,-1.75,0.7,0.7,0.3);
      [-1,1].forEach(sd=>{
        addMesh(new THREE.CylinderGeometry(0.07,0.07,0.7,12),steelMat,barrelPitchPivot,sd*0.42,0.16,-0.95,Math.PI/2,0,0);
        addMesh(new THREE.CylinderGeometry(0.1,0.1,0.18,12),detailMat,barrelPitchPivot,sd*0.42,0.16,-1.35,Math.PI/2,0,0);
      });
    }
    if(isT54E1){
      // 105 mm T140E2 (L/67): long slender tube, a bore-evacuator canister about 60% of the way out and a
      // double-baffle muzzle brake. The breech and recoil cylinders live inside the turret and slide with the gun.
      box(gunBody,steelMat,0,0,-0.55,0.4,0.34,1.0);
      box(gunBody,detailMat,0,0.02,-1.15,0.46,0.4,0.3);
      [-1,1].forEach(sd=>addMesh(new THREE.CylinderGeometry(0.05,0.05,0.9,10),steelMat,gunBody,sd*0.24,0.14,-0.2,Math.PI/2,0,0));
      addMesh(new THREE.CylinderGeometry(0.13,0.145,0.8,18),turretMat,gunBody,0,0,1.0,Math.PI/2,0,0); // sleeve through the shield
      const ez=barrelLength*0.6;
      addMesh(new THREE.CylinderGeometry(0.135,0.135,0.5,18),turretMat,gunBody,0,0,ez,Math.PI/2,0,0);
      addMesh(new THREE.CylinderGeometry(0.1,0.135,0.12,18),turretMat,gunBody,0,0,ez+0.31,Math.PI/2,0,0);
      addMesh(new THREE.CylinderGeometry(0.135,0.1,0.12,18),turretMat,gunBody,0,0,ez-0.31,Math.PI/2,0,0);
      [-0.15,0.15].forEach(o=>addMesh(new THREE.CylinderGeometry(0.145,0.145,0.025,18),detailMat,gunBody,0,0,ez+o,Math.PI/2,0,0));
      const mz=barrelLength-0.02;
      addMesh(new THREE.CylinderGeometry(0.125,0.125,0.4,16),turretMat,gunBody,0,0,mz+0.1,Math.PI/2,0,0);
      [mz-0.08,mz+0.1,mz+0.28].forEach(z=>addMesh(new THREE.CylinderGeometry(0.15,0.15,0.035,16),turretMat,gunBody,0,0,z,Math.PI/2,0,0));
      [-1,1].forEach(sd=>[0,1].forEach(j=>box(gunBody,darkMat,sd*0.13,0,mz+0.02+j*0.16,0.02,0.1,0.07)));
      addMesh(new THREE.CylinderGeometry(0.09,0.09,0.03,14),darkMat,gunBody,0,0,mz+0.31,Math.PI/2,0,0);
    }
    if(isAMX50){
      // 120 mm gun (1,000 m/s): long tube with a thick jacket where it leaves the front port, and a big
      // double-baffle muzzle brake. The breech, cradle and recoil cylinders live inside the turret and slide
      // with the gun; they are what the autoloader feeds.
      box(gunBody,steelMat,0,0,-0.7,0.48,0.42,1.3);
      box(gunBody,detailMat,0,0.02,-1.5,0.54,0.48,0.34);
      [-1,1].forEach(sd=>addMesh(new THREE.CylinderGeometry(0.055,0.055,1.0,10),steelMat,gunBody,sd*0.28,0.17,-0.35,Math.PI/2,0,0));
      addMesh(new THREE.CylinderGeometry(0.15,0.17,1.2,18),turretMat,gunBody,0,0,0.85,Math.PI/2,0,0);     // jacket through the front port
      addMesh(new THREE.CylinderGeometry(0.115,0.15,0.9,16),turretMat,gunBody,0,0,1.9,Math.PI/2,0,0);     // taper down to the bare tube
      const amz=barrelLength-0.04;
      addMesh(new THREE.CylinderGeometry(0.15,0.15,0.62,18),turretMat,gunBody,0,0,amz+0.14,Math.PI/2,0,0);
      [amz-0.12,amz+0.1,amz+0.32].forEach(z=>addMesh(new THREE.CylinderGeometry(0.185,0.185,0.04,18),turretMat,gunBody,0,0,z,Math.PI/2,0,0));
      [-1,1].forEach(sd=>[0,1,2].forEach(j=>box(gunBody,darkMat,sd*0.155,0,amz-0.02+j*0.17,0.02,0.11,0.09)));
      [-1,1].forEach(sd=>[0,1,2].forEach(j=>box(gunBody,darkMat,0,sd*0.155,amz-0.02+j*0.17,0.11,0.02,0.09)));
      addMesh(new THREE.CylinderGeometry(0.1,0.1,0.03,14),darkMat,gunBody,0,0,amz+0.46,Math.PI/2,0,0);
    }
    const muzzleFlash=new THREE.Group(); muzzleFlash.scale.setScalar(1.8);
    const flashOuter=new THREE.MeshBasicMaterial({color:0xff8127,transparent:true,opacity:0.9,depthWrite:false,side:THREE.DoubleSide});
    const flashCore=new THREE.MeshBasicMaterial({color:0xffef9a,transparent:true,opacity:0.98,depthWrite:false,side:THREE.DoubleSide});
    const flashCone=new THREE.ConeGeometry(0.25,1.0,7);
    const core=new THREE.Mesh(new THREE.SphereGeometry(0.15,8,6),flashCore);
    core.scale.set(1,1,2.0); muzzleFlash.add(core);
    [-0.12,0.12].forEach((x,i)=>{
      const ray=new THREE.Mesh(flashCone,i===0?flashOuter:flashCore);
      ray.position.set(x,0,0.46); ray.rotation.x=Math.PI/2; ray.scale.set(i===0?1:0.65,1,0.72); muzzleFlash.add(ray);
    });
    if(isLeo){
      // Cast mantlet: a big rounded shield that elevates with the gun (65 mm), rubber gun boot, coax MG3 and
      // the gunner's sight window.
      // The Leopard 1A5 mantlet is a gently tapering wedge in plan view: wide where it meets the turret front and narrowing only
      // slightly towards the gun, with a flat, slightly sloping top and well-rounded edges (not a round drum or a prism).
      {
        const MS=[ // z (relative to the trunnions), half-width, top y, bottom y, corner chamfer
          [-0.04,0.50,0.31,-0.27,0.13],[0.16,0.49,0.28,-0.24,0.13],[0.36,0.44,0.22,-0.18,0.11],[0.54,0.38,0.16,-0.12,0.09]
        ];
        const mRing=([z,w,yt,yb,c])=>[[-w+c,yb],[w-c,yb],[w,yb+c],[w,yt-c],[w-c,yt],[-w+c,yt],[-w,yt-c],[-w,yb+c]].map(([x,y])=>[x,y,z]);
        const mRings=MS.map(mRing), mp=[], mt=(u,v,w)=>mp.push(...u,...v,...w);
        for(let k=0;k<mRings.length-1;k++){
          const A=mRings[k], B=mRings[k+1];
          for(let e=0;e<A.length;e++){const f=(e+1)%A.length; mt(A[e],A[f],B[f]); mt(A[e],B[f],B[e]);}
        }
        const mCap=(Rg,front)=>{
          const c=[0,Rg.reduce((m,v)=>m+v[1],0)/Rg.length,Rg[0][2]];
          for(let e=0;e<Rg.length;e++){const f=(e+1)%Rg.length; front?mt(c,Rg[e],Rg[f]):mt(c,Rg[f],Rg[e]);}
        };
        mCap(mRings[0],false); mCap(mRings[mRings.length-1],true);
        const mg=new THREE.BufferGeometry();
        mg.setAttribute('position',new THREE.Float32BufferAttribute(mp,3)); mg.computeVertexNormals();
        const mant=addMesh(mg,turretMat,barrelPitchPivot,0,0,0);
        markArmor(mant,()=>({t:65,zone:'turret-mantlet'}));
      }
      addMesh(new THREE.CylinderGeometry(0.15,0.12,0.22,16),darkMat,barrelPitchPivot,0,0,0.58,Math.PI/2,0,0); // rubber gun boot
      box(barrelPitchPivot,detailMat,-0.24,-0.02,0.56,0.1,0.1,0.14);                                          // coax MG3 housing
      addMesh(new THREE.CylinderGeometry(0.02,0.02,0.4,8),darkMat,barrelPitchPivot,-0.24,-0.02,0.78,Math.PI/2,0,0);
      box(barrelPitchPivot,darkMat,0.16,0.25,0.36,0.1,0.06,0.1);                                              // gunner's sight window on the sloping top
      // 105 mm L7A1: thermal sleeve with clamp bands, bore evacuator and the muzzle reference collimator box.
      const sS=0.62, sE=barrelLength-0.72, sL=sE-sS;
      addMesh(new THREE.CylinderGeometry(barrelRadius*1.28,barrelRadius*1.28,sL,16),turretMat,gunBody,0,0,sS+sL/2,Math.PI/2,0,0);
      for(let k=0;k<=4;k++) addMesh(new THREE.CylinderGeometry(barrelRadius*1.4,barrelRadius*1.4,0.035,16),darkMat,gunBody,0,0,sS+sL*k/4,Math.PI/2,0,0);
      addMesh(new THREE.CylinderGeometry(barrelRadius*1.6,barrelRadius*1.6,0.3,16),turretMat,gunBody,0,0,barrelLength*0.64,Math.PI/2,0,0);
      box(gunBody,detailMat,0,barrelRadius*1.3,barrelLength-0.08,0.1,0.07,0.16);
      addMesh(new THREE.CylinderGeometry(barrelRadius*1.12,barrelRadius*1.12,0.06,14),darkMat,gunBody,0,0,barrelLength-0.02,Math.PI/2,0,0);
    }
    if(isT72){
      // Cast mantlet (elevates with the gun): a rounded oval block, ~0.80 x 0.52 m, with the rubber gun boot, the coaxial PKT and the
      // gunner's sight aperture. Then the 2A46M-1 125 mm smoothbore: perforated-ribbed thermal sleeve, bore evacuator about two thirds out.
      const mant=addMesh(new THREE.CylinderGeometry(1,1,u72(0.5),22),turretMat,barrelPitchPivot,0,0,u72(0.25),Math.PI/2,0,0);
      mant.scale.set(u72(0.29),1,u72(0.18));
      markArmor(mant,()=>comp(300,350,0,'turret-mantlet'));
      c72(barrelPitchPivot,darkMat,0.12,0.14,0.18,0,0,0.58,Math.PI/2,0,0,16);       // rubber gun boot
      // Canvas mantlet cover: the cast oval mantlet above stays underneath as the armour, but what you SEE is the tarpaulin-style fabric
      // bag the T-72 wears over it: a squarish bag that hugs the mantlet, then drawn in toward the gun boot and cinched with a strap,
      // with soft vertical creases and some bunching/pleats where it gathers. Visual only (shells hit the mantlet beneath).
      { // ---- woven canvas texture: warp/weave threads with slub noise, stitched seams, a hemmed front edge (u = around, v = rear -> front) ----
        const TW=512, cv=document.createElement('canvas'); cv.width=cv.height=TW; const cx=cv.getContext('2d');
        cx.fillStyle='#625e40'; cx.fillRect(0,0,TW,TW);
        for(let y=0;y<TW;y+=2){ const t=(Math.sin(y*1.7)+Math.sin(y*0.37)*1.4)*7; cx.fillStyle='rgba('+(t>0?'255,250,210':'0,0,0')+','+(Math.abs(t)/90).toFixed(3)+')'; cx.fillRect(0,y,TW,1); }
        for(let x=0;x<TW;x+=2){ const t=(Math.sin(x*1.3)+Math.sin(x*0.29)*1.4)*7; cx.fillStyle='rgba('+(t>0?'255,250,210':'0,0,0')+','+(Math.abs(t)/90).toFixed(3)+')'; cx.fillRect(x,0,1,TW); }
        for(let k=0;k<2600;k++){ cx.fillStyle='rgba(40,34,18,'+(Math.random()*0.16).toFixed(3)+')'; cx.fillRect(Math.random()*TW,Math.random()*TW,1+Math.random()*5,1); } // slubs / dirt
        for(let k=0;k<26;k++){ const g=cx.createRadialGradient(Math.random()*TW,Math.random()*TW,0,Math.random()*TW,Math.random()*TW,40+Math.random()*60); cx.fillStyle='rgba(50,42,22,0.05)'; cx.beginPath(); cx.arc(Math.random()*TW,Math.random()*TW,30+Math.random()*60,0,7); cx.fill(); } // faded / stained patches
        cx.strokeStyle='rgba(30,26,14,0.55)'; cx.lineWidth=1.5; cx.setLineDash([6,4]);               // stitched seams (panel joins) running front to back
        [TW*0.18,TW*0.5,TW*0.82].forEach(x=>{ cx.beginPath(); cx.moveTo(x-3,0); cx.lineTo(x-3,TW); cx.moveTo(x+3,0); cx.lineTo(x+3,TW); cx.stroke(); });
        cx.setLineDash([]); cx.fillStyle='rgba(30,26,14,0.28)'; cx.fillRect(0,TW*0.93,TW,TW*0.07);   // hem at the gathered neck
        const tex=new THREE.CanvasTexture(cv); tex.wrapS=THREE.RepeatWrapping; tex.wrapT=THREE.ClampToEdgeWrapping; tex.anisotropy=16;
        const fabMat=new THREE.MeshStandardMaterial({map:tex,bumpMap:tex,bumpScale:1.4,roughness:1,metalness:0,side:THREE.DoubleSide});
        const NZ=34, NA=64, zr=0.0, zf=0.68, ss=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
        // Cloth cross-section at distance z along the gun axis, angle a. A squarish bag that hugs the mantlet, then is drawn in to the boot.
        // Layered folds: big uneven drapes, a ring of gather-folds that radiate into the neck and get deeper there, and fine crumples.
        const prof=(z,a,k=1)=>{
          const tp=ss(0.46,0.68,z), w=0.33-0.20*tp, h=0.235-0.105*tp, c=Math.cos(a), sn=Math.sin(a), e=2/3.4;
          const rx=Math.sign(c)*Math.pow(Math.abs(c),e), ry=Math.sign(sn)*Math.pow(Math.abs(sn),e);
          const drape=1+0.05*Math.sin(a*3+1.1+z*2.2)+0.03*Math.sin(a*5-z*3.1);
          const amp=0.075+0.07*tp, ph=a*11+0.9*Math.sin(z*7+a*3), tri=Math.asin(Math.sin(ph))*2/Math.PI; // wedge-like creased folds run the whole length of the cover
          const fold=1+amp*(0.55*Math.sin(ph)+0.45*tri)+0.35*amp*Math.sin(a*23+z*11+Math.sin(a*4)*2)+0.012*Math.sin(z*41+a*9);
          const sag=ry<0?1.10:1, slump=-0.035*(1-tp)*Math.abs(c)*(0.6+0.4*Math.sin(z*5));
          return [u72(rx*w*drape*fold*k), u72(ry*h*drape*fold*sag*k+slump), u72(z)];
        };
        const pos=[], uv=[], idx=[], row=NA+1;
        for(let i=0;i<=NZ;i++){ const z=zr+(zf-zr)*i/NZ; for(let j=0;j<=NA;j++){ pos.push(...prof(z,(j%NA)/NA*Math.PI*2)); uv.push(j/NA,1-i/NZ); } }
        for(let i=0;i<NZ;i++)for(let j=0;j<NA;j++){ const a=i*row+j, b=a+1, c2=a+row, d=c2+1; idx.push(a,c2,b,b,c2,d); }
        const cg=new THREE.BufferGeometry(); cg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); cg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); cg.setIndex(idx); cg.computeVertexNormals();
        addMesh(cg,fabMat,barrelPitchPivot,0,0,0);
        // Tie-down straps: flat dark webbing bands that follow the cloth, one over the body and one at the neck, plus the cinch cord.
        const band=(z0,wd,k)=>{ const bp=[], bi=[]; for(let i=0;i<=1;i++)for(let j=0;j<=NA;j++) bp.push(...prof(z0+wd*i,(j%NA)/NA*Math.PI*2,k));
          for(let j=0;j<NA;j++){ const a=j, b=j+1, c2=j+row, d=c2+1; bi.push(a,c2,b,b,c2,d); }
          const bg=new THREE.BufferGeometry(); bg.setAttribute('position',new THREE.Float32BufferAttribute(bp,3)); bg.setIndex(bi); bg.computeVertexNormals();
          addMesh(bg,darkMat,barrelPitchPivot,0,0,0); };
        band(0.20,0.06,1.035); band(0.40,0.05,1.04); band(0.60,0.045,1.06);
        c72(barrelPitchPivot,darkMat,0.16,0.16,0.04,0,0,0.66,Math.PI/2,0,0,22);               // cinch cord round the gathered neck
        [-1,1].forEach(sd=>c72(barrelPitchPivot,darkMat,0.012,0.012,0.16,sd*0.09,-0.16,0.64,0.5,0,sd*0.3,6)); // loose cord tails hanging from the cinch
      }
      // L-4A infrared searchlight: a large round housing bolted to the right side of the mantlet (it elevates with the gun), with a bezel,
      // a dark-red IR filter glass, a wire guard and its mounting bracket.
      { const lx=0.58, ly=-0.02, lz=0.36, R=0.2;
        b72(barrelPitchPivot,detailMat,0.42,ly-0.02,0.22,0.2,0.14,0.3);                                  // bracket to the mantlet
        c72(barrelPitchPivot,hullMat,R,R,0.34,lx,ly,lz,Math.PI/2,0,0,28);                                   // housing
        c72(barrelPitchPivot,steelMat,R*1.08,R*1.08,0.04,lx,ly,lz+0.18,Math.PI/2,0,0,28);                  // front bezel ring
        c72(barrelPitchPivot,darkMat,R*0.86,R*0.86,0.02,lx,ly,lz+0.2,Math.PI/2,0,0,28);                    // IR filter glass
        addMesh(new THREE.CircleGeometry(u72(R*0.5),20),new THREE.MeshStandardMaterial({color:0x5a1a1a,roughness:0.35,metalness:0.2}),barrelPitchPivot,u72(lx),u72(ly),u72(lz+0.212),0,0,0);
        [0,Math.PI/2].forEach(a=>b72(barrelPitchPivot,steelMat,lx,ly,lz+0.225,0.012,R*2.0,0.012,0,0,a));  // guard bars
        c72(barrelPitchPivot,detailMat,0.05,0.05,0.12,lx,ly+R+0.03,lz-0.04,0,0,0,10);                      // lamp cable gland
      }
      const L=barrelLength, sS=u72(0.55), sE=L*0.64, sL=sE-sS;
      addMesh(new THREE.CylinderGeometry(barrelRadius*1.22,barrelRadius*1.22,sL,18),turretMat,gunBody,0,0,sS+sL/2,Math.PI/2,0,0);   // thermal sleeve
      for(let k=0;k<=6;k++) addMesh(new THREE.CylinderGeometry(barrelRadius*1.3,barrelRadius*1.3,0.03,18),darkMat,gunBody,0,0,sS+sL*k/6,Math.PI/2,0,0);
      addMesh(new THREE.CylinderGeometry(barrelRadius*1.5,barrelRadius*1.5,0.34,16),turretMat,gunBody,0,0,L*0.7,Math.PI/2,0,0);       // bore evacuator
      [-0.17,0.17].forEach(dz=>addMesh(new THREE.CylinderGeometry(barrelRadius*1.62,barrelRadius*1.62,0.03,16),turretMat,gunBody,0,0,L*0.7+dz,Math.PI/2,0,0));
      box(gunBody,detailMat,0,barrelRadius*1.3,L-0.08,0.07,0.05,0.12);              // muzzle reference collimator
      addMesh(new THREE.CylinderGeometry(barrelRadius*0.9,barrelRadius*0.9,0.05,14),darkMat,gunBody,0,0,L+0.02,Math.PI/2,0,0);
    }
    if(isM1){
      // Gun shield: just a small, low composite slab (special armour, ~350 mm KE / 600 mm CE) recessed in the slot between the two
      // protruding cheek blocks - the big hexagonal block is gone. It rides on the gun, so it elevates with it. 0.80 x 0.50 x 0.65 m.
      markArmor(addMesh(new THREE.BoxGeometry(0.615,0.385,0.464),turretMat,barrelPitchPivot,0,0,0.04),()=>comp(350,600,0,'turret-mantlet'));
      addMesh(new THREE.CylinderGeometry(0.115,0.13,0.1,14),darkMat,barrelPitchPivot,0,0,0.31,Math.PI/2,0,0); // gun boot
      box(barrelPitchPivot,detailMat,0.22,-0.05,0.28,0.1,0.1,0.14);                                              // coax M240 housing (right of the gun)
      addMesh(new THREE.CylinderGeometry(0.014,0.014,0.3,8),darkMat,barrelPitchPivot,0.22,-0.05,0.47,Math.PI/2,0,0);
      box(barrelPitchPivot,darkMat,0.22,0.12,0.275,0.12,0.07,0.02);                                                // gunner's auxiliary sight window
      // 105 mm M68A1: bore evacuator two-thirds along, muzzle reference sensor on the muzzle
      addMesh(new THREE.CylinderGeometry(barrelRadius*1.6,barrelRadius*1.6,0.42,14),turretMat,gunBody,0,0,barrelLength*0.64,Math.PI/2,0,0);
      [-0.21,0.21].forEach(dz=>addMesh(new THREE.CylinderGeometry(barrelRadius*1.75,barrelRadius*1.75,0.03,14),turretMat,gunBody,0,0,barrelLength*0.64+dz,Math.PI/2,0,0));
      box(gunBody,detailMat,0,barrelRadius*1.3,barrelLength-0.07,0.07,0.05,0.12);
      addMesh(new THREE.CylinderGeometry(barrelRadius*0.95,barrelRadius*0.95,0.05,12),darkMat,gunBody,0,0,barrelLength+0.02,Math.PI/2,0,0);
    }
    if(isK1){
      // Gun mantlet: a pentagon in side profile - flat vertical back face bolted to the turret, flat top
      // and bottom runs that do NOT taper, then both angle forward to meet at a single horizontal ridge
      // (not a point) where the barrel passes through. Built as that pentagon outline extruded sideways
      // across the mantlet's full width. Sized to fill most of the vertical gap between the cheek blocks
      // (previous version was too small for that slot).
      const mH=ku(0.50*K1_TURRET_HGT_RATIO);     // half-height - constant from back to where it angles in (no vertical taper)
      const mW=ku(0.78*K1_WID_RATIO);            // full width (extrusion length)
      // Fix: the mantlet used to start 0.80 (raw) ahead of the trunnion pivot, i.e. ~0.7 m in front of the turret's
      // front wall, so it floated free of the turret. Its back face is now sunk just behind the front wall (so it
      // stays buried through the full elevation/depression range) and the flat top/bottom runs are lengthened to
      // compensate. The ridge and gun boot were then pulled back to about the cheek-block fronts so the mantlet isn't overly long.
      const L=K1_TURRET_LEN_RATIO;
      const wallZ=1.20*L, pivotZ=1.157*L, embed=0.13*L;      // raw turret-frame metres: front wall, trunnion, burial depth
      const backLocal=wallZ-embed-pivotZ;                    // back face, relative to the pitch pivot (slightly negative)
      const ridgeLocal=0.80*L;                               // front ridge: pulled back to roughly the front of the cheek blocks (they end at 2.12L, pivot is at 1.157L)
      const noseLen=0.28*L;                                  // angled nose length - unchanged from before
      const mPoint=ku(ridgeLocal-backLocal);                 // total depth, back face to ridge
      const mRun=ku(ridgeLocal-backLocal-noseLen);           // flat top/bottom run before the nose angles in
      const mShape=new THREE.Shape();
      mShape.moveTo(0,-mH); mShape.lineTo(0,mH); mShape.lineTo(mRun,mH); mShape.lineTo(mPoint,0); mShape.lineTo(mRun,-mH); mShape.lineTo(0,-mH);
      const mantletGeo=new THREE.ExtrudeGeometry(mShape,{depth:mW,bevelEnabled:false});
      mantletGeo.translate(0,0,-mW/2);   // center the width extrusion
      mantletGeo.rotateY(-Math.PI/2);    // shape-depth -> world +Z (forward), extrusion -> world X (width)
      const mantlet=addMesh(mantletGeo,turretMat,barrelPitchPivot,0,0,ku(backLocal));
      markArmor(mantlet,()=>comp(320,560,0,'turret-mantlet'));
      addMesh(new THREE.CylinderGeometry(0.11,0.12,0.09,14),darkMat,barrelPitchPivot,0,0,ku(ridgeLocal-0.02*L),Math.PI/2,0,0); // gun boot - sits at the mantlet's narrow front face, where the barrel actually exits
      // Coaxial 7.62 mm M60E2 on the right of the gun (tank's right = -x), with its muzzle just proud of the mantlet ridge.
      addMesh(new THREE.CylinderGeometry(ku(0.024),ku(0.024),ku(0.34),10),darkMat,barrelPitchPivot,-ku(0.20),-ku(0.05),ku(ridgeLocal-0.12),Math.PI/2,0,0);
      addMesh(new THREE.CylinderGeometry(ku(0.032),ku(0.032),ku(0.04),10),steelMat,barrelPitchPivot,-ku(0.20),-ku(0.05),ku(ridgeLocal+0.04),Math.PI/2,0,0);
      // 105 mm KM68A1: bore evacuator roughly two-thirds along, muzzle reference sensor at the muzzle (same convention as the M1's M68A1)
      addMesh(new THREE.CylinderGeometry(barrelRadius*1.6,barrelRadius*1.6,0.42,14),turretMat,gunBody,0,0,barrelLength*0.64,Math.PI/2,0,0);
      [-0.21,0.21].forEach(dz=>addMesh(new THREE.CylinderGeometry(barrelRadius*1.75,barrelRadius*1.75,0.03,14),turretMat,gunBody,0,0,barrelLength*0.64+dz,Math.PI/2,0,0));
      box(gunBody,detailMat,0,barrelRadius*1.3,barrelLength-0.07,0.07,0.05,0.12);
      addMesh(new THREE.CylinderGeometry(barrelRadius*0.95,barrelRadius*0.95,0.05,12),darkMat,gunBody,0,0,barrelLength+0.02,Math.PI/2,0,0);
    }
    if(isChallenger1){
      // Gun shield and mantlet: the L11A5 sits in a shallow cast shield let into the sloping Chobham front plate (the box leans back 30 deg to
      // follow it); it rides on the gun, so it elevates with it. Rubber gun boot, coaxial L8A2 MG to the LEFT of the gun, gunner's sight window.
      const shield=addMesh(new THREE.BoxGeometry(c1x(0.7),c1y(0.5),c1z(0.34)),turretMat,barrelPitchPivot,0,0,c1z(0.46),-0.91,0,0);
      markArmor(shield,()=>comp(480,580,0,'turret-mantlet'));
      b1(barrelPitchPivot,turretMat,0,0.17,0.24,0.66,0.05,0.22,-0.91,0,0);                                      // shield brow
      cy1(barrelPitchPivot,darkMat,0.17,0.2,0.2,0,0,0.66,Math.PI/2,0,0,18);                                    // rubber gun boot
      b1(barrelPitchPivot,detailMat,0.3,-0.06,0.6,0.12,0.12,0.2); cy1(barrelPitchPivot,darkMat,0.016,0.016,0.3,0.3,-0.06,0.78,Math.PI/2,0,0,8);
      b1(barrelPitchPivot,darkMat,-0.28,0.12,0.62,0.14,0.08,0.02,-0.91,0,0);
      // 120 mm L11A5 rifled gun: GRP thermal sleeve with clamp bands from the shield to the fume extractor, the extractor itself (about two
      // thirds out), then the bare muzzle with its reference sensor.
      const L=barrelLength, sS=c1z(0.8), sE=L*0.66, sL=sE-sS;
      addMesh(new THREE.CylinderGeometry(barrelRadius*1.26,barrelRadius*1.26,sL,18),turretMat,gunBody,0,0,sS+sL/2,Math.PI/2,0,0);
      for(let k=0;k<=6;k++) addMesh(new THREE.CylinderGeometry(barrelRadius*1.36,barrelRadius*1.36,0.035,18),darkMat,gunBody,0,0,sS+sL*k/6,Math.PI/2,0,0);
      addMesh(new THREE.CylinderGeometry(barrelRadius*1.12,barrelRadius*1.62,0.2,18),turretMat,gunBody,0,0,L*0.68,Math.PI/2,0,0);        // fume extractor (tapered rear end)
      addMesh(new THREE.CylinderGeometry(barrelRadius*1.62,barrelRadius*1.62,0.34,18),turretMat,gunBody,0,0,L*0.68+0.27,Math.PI/2,0,0);
      addMesh(new THREE.CylinderGeometry(barrelRadius*1.12,barrelRadius*1.62,0.2,18),turretMat,gunBody,0,0,L*0.68+0.54,-Math.PI/2,0,0);
      [0.06,0.27,0.48].forEach(d=>addMesh(new THREE.CylinderGeometry(barrelRadius*1.7,barrelRadius*1.7,0.025,18),darkMat,gunBody,0,0,L*0.68+d,Math.PI/2,0,0));
      box(gunBody,detailMat,0,barrelRadius*1.3,L-0.09,0.1,0.07,0.16);
      addMesh(new THREE.CylinderGeometry(barrelRadius*1.08,barrelRadius*1.08,0.06,16),darkMat,gunBody,0,0,L-0.01,Math.PI/2,0,0);
    }
    muzzleFlash.position.set(0,0,barrelLength+(isTiger?0.31:isSturer?0.38:isIS7?0.65:isFV4005?0.35:isT54E1?0.34:isAMX50?0.5:isK1?0.05:0.2));
    muzzleFlash.visible=false; gunBody.add(muzzleFlash);
    const muzzleLight={intensity:0}; // data only; the real light comes from the shared pool (see muzzlePool)
    // Only visible shapes count as armour; the old invisible plates are dropped.
    armorMeshes.splice(0,armorMeshes.length,...armorMeshes.filter(m=>m.material.visible!==false));
    // Internal modules for the penetration model (hull or turret local space).
    const modules=[];
    const M=(name,type,parent,x,y,z,r)=>modules.push({name,type,parent,x,y,z,r,dead:false});
    if(isIS7){
      M('Driver','crew',tank,-0.5,0.95,1.5,0.42); M('Bow gunner','crew',tank,0.5,0.95,1.5,0.42);
      M('Transmission','trans',tank,0,0.75,-2.35,0.75);
      M('Ammo rack','ammo',tank,1.15,0.88,0.35,0.52); M('Ammo rack','ammo',tank,-1.15,0.88,0.35,0.52);
      M('Ammo rack','ammo',tank,0,0.92,-0.85,0.48); // Autoloader magazine
      M('Engine','engine',tank,0,1.05,-1.75,0.95);
      M('Fuel tank','fuel',tank,1.18,0.85,-1.62,0.52); M('Fuel tank','fuel',tank,-1.18,0.85,-1.62,0.52);
      M('Commander','crew',turretPivot,0.45,0.55,-0.35,0.38); M('Gunner','crew',turretPivot,-0.35,0.52,0.25,0.38); M('Loader','crew',turretPivot,0.38,0.48,0.18,0.38);
    } else if(isTiger){
      M('Driver','crew',tank,-0.45,1.2,1.5,0.4); M('Bow gunner','crew',tank,0.5,1.2,1.5,0.4);
      M('Transmission','trans',tank,0,0.8,1.9,0.7);
      M('Ammo rack','ammo',tank,1.05,0.85,0.5,0.5); M('Ammo rack','ammo',tank,-1.05,0.85,0.5,0.5);
      M('Engine','engine',tank,0,1.15,-1.75,0.9);
      M('Fuel tank','fuel',tank,1.05,0.85,-1.5,0.5); M('Fuel tank','fuel',tank,-1.05,0.85,-1.5,0.5);
      M('Commander','crew',turretPivot,-0.48,0.5,-0.38,0.35); M('Gunner','crew',turretPivot,0.4,0.45,0.15,0.35); M('Loader','crew',turretPivot,0.48,0.45,-0.45,0.35);
    } else if(isAMX50){
      // 4 crew: driver (front-left) and loader (front-right, handing rounds up the neck) in the hull; commander and
      // gunner in the narrow oscillating turret. Most 120 mm rounds are racked low in the hull; a few ready rounds
      // wait in the neck. Nothing is stowed in the turret itself, so a turret hit mostly kills the two crew.
      M('Driver','crew',tank,-0.42,0.9,1.5,0.4);
      M('Loader','crew',tank,0.45,0.9,1.0,0.4);
      M('Transmission','trans',tank,0,0.75,-2.2,0.7);
      M('Ammo rack','ammo',tank,0.9,0.7,0.3,0.45); M('Ammo rack','ammo',tank,-0.9,0.7,0.3,0.45); M('Ammo rack','ammo',tank,0.0,0.6,1.5,0.4);
      M('Ready rounds','ammo',turretPivot,0,0.15,-0.2,0.3);
      M('Engine','engine',tank,0,0.95,-1.55,0.95);
      M('Fuel tank','fuel',tank,0.9,0.78,-1.0,0.5); M('Fuel tank','fuel',tank,-0.9,0.78,-1.0,0.5);
      M('Commander','crew',turretPivot,-0.05,1.1,-0.7,0.3); M('Gunner','crew',turretPivot,0.1,0.8,0.35,0.3);
    } else if(isT54E1){
      // 4 crew: a centre-seated driver in the hull; commander, gunner and loader in the upper turret. No hull
      // gunner. The 9-round drum autoloader sits in the bustle; the other 27 rounds are racked in the hull.
      M('Driver','crew',tank,0,0.95,1.75,0.4);
      M('Transmission','trans',tank,0,0.75,-2.15,0.7);
      M('Ammo rack','ammo',tank,0.95,0.78,1.1,0.45); M('Ammo rack','ammo',tank,-0.95,0.78,1.1,0.45);
      M('Ammo drum','ammo',turretPivot,0,0.5,-0.85,0.5);
      M('Engine','engine',tank,0,1.0,-1.5,0.95);
      M('Fuel tank','fuel',tank,0.95,0.8,-0.4,0.5); M('Fuel tank','fuel',tank,-0.95,0.8,-0.4,0.5);
      M('Commander','crew',turretPivot,0.55,0.5,-0.45,0.35); M('Gunner','crew',turretPivot,0.45,0.42,0.5,0.35); M('Loader','crew',turretPivot,-0.5,0.45,-0.25,0.35);
    } else if(isLeo){
      // 4 crew: driver front-left in the hull; commander (right rear), gunner (right front) and loader (left) in
      // the turret. After the A5 upgrade most rounds are racked in the turret bustle; the rest sit beside the driver.
      M('Driver','crew',tank,-0.45,0.9,1.4,0.4);
      M('Transmission','trans',tank,0,0.75,-2.15,0.7);
      M('Ammo rack','ammo',tank,0.8,0.78,1.2,0.45);
      M('Ammo rack','ammo',turretPivot,0,0.36,-1.2,0.5);
      M('Engine','engine',tank,0,0.95,-1.5,0.95);
      M('Fuel tank','fuel',tank,0.9,0.78,-0.2,0.5); M('Fuel tank','fuel',tank,-0.9,0.78,-0.2,0.5);
      M('Commander','crew',turretPivot,0.46,0.38,-0.55,0.35); M('Gunner','crew',turretPivot,0.4,0.34,0.25,0.35); M('Loader','crew',turretPivot,-0.45,0.34,-0.4,0.35);
    } else if(isT72){
      // 3 crew: driver on the hull centreline; commander (right) and gunner (left) in the turret. The AZ-184 carousel autoloader
      // holds 22 rounds in a ring on the hull floor under the turret, so a penetration through the fighting compartment can
      // detonate it. Fuel is carried in front tanks beside the driver and in external barrels on the right fender.
      M('Driver','crew',tank,0,0.78,u72(1.9),0.34);
      M('Transmission','trans',tank,0,0.58,u72(-2.85),0.6);
      M('Engine','engine',tank,0,0.75,u72(-1.85),0.8);
      M('Autoloader carousel','ammo',tank,0,0.6,u72(0.2),0.6);
      M('Hull ammo','ammo',tank,u72(0.95),0.66,u72(1.3),0.3);
      M('Fuel tank','fuel',tank,u72(0.85),0.7,u72(1.95),0.34); M('Fuel tank','fuel',tank,u72(-0.85),0.7,u72(1.95),0.34);
      M('Fuel tank','fuel',tank,u72(1.5),0.98,u72(-2.05),0.36);
      M('Commander','crew',turretPivot,u72(0.52),u72(0.32),u72(-0.3),0.28);
      M('Gunner','crew',turretPivot,u72(-0.55),u72(0.3),u72(0.1),0.28);
    } else if(isM1){
      // Driver sits on the hull centreline; commander (right rear), gunner (right front), loader (left) in the turret.
      M('Driver','crew',tank,0,0.66,1.95*M1_ZK,0.4);
      M('Transmission','trans',tank,0,0.5,-2.25*M1_ZK,0.7);
      M('Engine','engine',tank,0,0.85,-1.75*M1_ZK,0.95);
      [[1.1,1.5],[-1.1,1.5],[1.0,-1.5],[-1.0,-1.5]].forEach(([x,z])=>M('Fuel tank','fuel',tank,x,0.65,z*M1_ZK,z>0?0.5:0.45)); // front sponson cells + rear cells
      M('Hull ammo','ammo',tank,0.7,0.62,-0.8*M1_ZK,0.4);        // 8 rounds, armoured compartment with blow-off panel
      M('Bustle ammo','ammo',turretPivot,0,0.36,-1.5,0.72); // 44 rounds behind blast doors (long bustle)
      M('Commander','crew',turretPivot,0.48,0.42,-0.45,0.35);
      M('Gunner','crew',turretPivot,0.38,0.34,0.4,0.35);
      M('Loader','crew',turretPivot,-0.48,0.38,-0.12,0.35);
      modules.forEach(m=>{ if(m.name==='Hull ammo'||m.name==='Bustle ammo') m.blowOff=true; });
    } else if(isK1){
      // Crew/module layout not published - placed proportionally to the hull/turret station tables above,
      // following the same conventional-layout logic as the M1 (driver front-centre; commander, gunner,
      // loader in the turret; engine/transmission rear).
      M('Driver','crew',tank,0,ku(0.66*K1_HGT_RATIO),ku(1.95*K1_LEN_RATIO),0.38);
      M('Transmission','trans',tank,0,ku(0.5*K1_HGT_RATIO),ku(-2.25*K1_LEN_RATIO),0.65);
      M('Engine','engine',tank,0,ku(0.85*K1_HGT_RATIO),ku(-1.75*K1_LEN_RATIO),0.9);
      [[1.0,1.4],[-1.0,1.4],[0.9,-1.4],[-0.9,-1.4]].forEach(([x,z])=>M('Fuel tank','fuel',tank,ku(x*K1_WID_RATIO),ku(0.65*K1_HGT_RATIO),ku(z*K1_LEN_RATIO),z>0?0.46:0.42));
      M('Hull ammo','ammo',tank,ku(0.65*K1_WID_RATIO),ku(0.62*K1_HGT_RATIO),ku(-0.8*K1_LEN_RATIO),0.38);
      M('Commander','crew',turretPivot,ku(0.48*K1_WID_RATIO),ku(0.42*K1_HGT_RATIO),ku(-0.45*K1_TURRET_LEN_RATIO),0.33);
      M('Gunner','crew',turretPivot,ku(0.38*K1_WID_RATIO),ku(0.34*K1_HGT_RATIO),ku(0.4*K1_TURRET_LEN_RATIO),0.33);
      M('Loader','crew',turretPivot,ku(-0.48*K1_WID_RATIO),ku(0.38*K1_HGT_RATIO),ku(-0.12*K1_TURRET_LEN_RATIO),0.33);
      M('Bustle stowage','ammo',turretPivot,0,ku(0.36*K1_HGT_RATIO),ku(-1.2*K1_TURRET_LEN_RATIO),0.6); // radios, not ammo, per Wikipedia - kept as a module stub for now
      modules.forEach(m=>{ if(m.name==='Hull ammo') m.blowOff=true; });
    } else if(isChallenger1){
      // Driver sits on the hull centreline under the glacis; commander (right rear, under the cupola),
      // gunner (right front) and loader (left) in the turret. Engine and transmission are both rear-mounted.
      // Most of the 52-round stowage is low in the hull either side of the driver, with a few ready rounds
      // racked in the turret bustle behind the loader.
      M('Driver','crew',tank,0,0.68,1.7,0.4);
      M('Transmission','trans',tank,0,0.55,-2.6,0.65);
      M('Engine','engine',tank,0,0.9,-2.0,0.9);
      M('Fuel tank','fuel',tank,0.9,0.72,-0.7,0.48); M('Fuel tank','fuel',tank,-0.9,0.72,-0.7,0.48);
      M('Hull ammo','ammo',tank,0.65,0.6,0.1,0.42); M('Hull ammo','ammo',tank,-0.65,0.6,0.1,0.42);
      M('Bustle ammo','ammo',turretPivot,0,0.1,-1.2,0.4);
      M('Commander','crew',turretPivot,-0.5,0.55,-0.5,0.35);
      M('Gunner','crew',turretPivot,-0.35,0.3,0.35,0.35);
      M('Loader','crew',turretPivot,0.5,0.4,-0.3,0.35);
    } else if(!isSturer){
      M('Driver','crew',tank,-0.55,1.0,1.7,0.4); M('Bow gunner','crew',tank,0.55,1.0,1.7,0.4);
      M('Transmission','trans',tank,0,0.7,2.1,0.7);
      M('Ammo rack','ammo',tank,1.1,0.9,0.4,0.5); M('Ammo rack','ammo',tank,-1.1,0.9,0.4,0.5);
      M('Engine','engine',tank,0,1.0,-1.6,0.9);
      M('Fuel tank','fuel',tank,1.1,0.85,-1.5,0.5); M('Fuel tank','fuel',tank,-1.1,0.85,-1.5,0.5);
      M('Commander','crew',turretPivot,0.38,0.5,-0.38,0.35); M('Gunner','crew',turretPivot,0.35,0.45,0.2,0.35); M('Loader','crew',turretPivot,-0.4,0.45,-0.3,0.35);
    } else {
      // Sturer Emil: driver up front, small crew in the casemate, large ammo load for 128mm
      M('Driver','crew',tank,-0.45,1.1,1.6,0.38);
      M('Transmission','trans',tank,0,0.75,1.85,0.65);
      M('Ammo rack','ammo',tank,0.72,1.55,-0.5,0.48); M('Ammo rack','ammo',tank,-0.72,1.55,-0.5,0.48);
      M('Engine','engine',tank,0,1.1,-1.55,0.85);
      M('Fuel tank','fuel',tank,0.88,0.8,-1.35,0.45); M('Fuel tank','fuel',tank,-0.88,0.8,-1.35,0.45);
      M('Commander','crew',turretPivot,0,0.65,0.1,0.35); M('Gunner','crew',turretPivot,0,0.65,0.55,0.35); M('Loader','crew',turretPivot,0.5,0.65,-0.4,0.35);
    }
    if(isFV4005){
      // FV4005: 5 crew in turret (massive turret has everyone inside it), Centurion hull
      M('Driver','crew',tank,-0.45,1.0,2.0,0.4); M('Hull gunner','crew',tank,0.52,1.0,1.85,0.38);
      M('Transmission','trans',tank,0,0.75,2.2,0.7);
      M('Ammo rack','ammo',turretPivot,0.75,0.55,-0.85,0.42); M('Ammo rack','ammo',turretPivot,-0.75,0.55,-0.85,0.42); // 12 rounds, racked 6 per side in the bustle
      M('Engine','engine',tank,0,1.05,-1.85,0.9);
      M('Fuel tank','fuel',tank,1.15,0.88,-1.65,0.52); M('Fuel tank','fuel',tank,-1.15,0.88,-1.65,0.52);
      M('Commander','crew',turretPivot,0.4,0.6,-0.1,0.36); M('Gunner','crew',turretPivot,-0.4,0.6,0.4,0.36); M('Loader','crew',turretPivot,0.1,0.55,-0.6,0.36);
    }
    // Armour is metal, but weathered: a faint sky sheen on paint, slightly glossier bare steel, all of it
    // dusted with mud and grime that follows the tank's ground level.
    const dirtBase={value:0};
    {
      const seen=new Set();
      tank.traverse(o=>{
        if(!o.isMesh) return;
        [].concat(o.material).forEach(m=>{
          if(!m||seen.has(m)||!m.isMeshStandardMaterial||m.transparent) return;
          seen.add(m);
          const paint=m.roughness>=0.85;
          if(tankEnvMap){
            m.envMap=tankEnvMap;
            m.metalness=Math.max(m.metalness, paint?0.16:0.4);
            m.roughness=Math.max(paint?0.8:0.55, m.roughness*(paint?0.9:1));
            m.envMapIntensity=paint?0.3:0.5;
          }
          addTankDirt(m,dirtBase,paint?1.0:0.75);
        });
      });
    }
    // Fake ambient occlusion: a soft dark halo on the ground around the tracks, and a dark ring on the
    // hull roof where the turret overhangs it (found by ray-casting down onto the hull).
    {
      const cs=makeContactShadow(T.x*2+3.4,7.6,0.6); cs.position.set(0,0.14,0); tank.add(cs);
      tank.updateMatrixWorld(true);
      const hullMeshes=[]; tank.traverse(o=>{ if(o.isMesh && o!==cs){ let p=o,inTurret=false; while(p){ if(p===turretPivot){inTurret=true;break;} p=p.parent; } if(!inTurret) hullMeshes.push(o); } });
      const ray=new THREE.Raycaster(), tw=new THREE.Vector3(turretPivot.position.x,0,turretPivot.position.z);
      tank.localToWorld(tw); ray.set(new THREE.Vector3(tw.x,tw.y+12,tw.z),new THREE.Vector3(0,-1,0));
      const hit=ray.intersectObjects(hullMeshes,false)[0];
      const roofY=hit?tank.worldToLocal(hit.point.clone()).y:turretPivot.position.y;
      const ring=makeContactShadow(isFV4005?3.6:isT54E1?3.4:isAMX50?3.8:isLeo?3.5:isM1?3.7:isT72?3.6:isChallenger1?3.8:isK1?3.4:4.2,isFV4005?4.4:isT54E1?3.7:isAMX50?4.5:isLeo?3.9:isM1?4.9:isT72?4.6:isChallenger1?4.6:isK1?4.1:4.8,0.7);
      ring.position.set(turretPivot.position.x,roofY+0.03,turretPivot.position.z); tank.add(ring);
    }
    tank.userData.dirtBase=dirtBase;
    return {kind:tankId,dirtBase,modules,group:tank,turretPivot,gunTraversePivot,barrel,barrelPitchPivot,gunSlide,baseBarrelZ:barrelPitchPivot.position.z,recoil:0,recoilVelocity:0,muzzleFlash,muzzleLight,flashRemaining:0,armorMeshes,updateTracks,trackGauge:T.x,exhaustPoints,wheelPositions,trackY,config:null,hullTurnVelocity:0,addOnPanels,blowOffPanels};
  }

  // ========================================================================
  // SU-30SM BUILDER — a self-contained aircraft builder, entirely separate
  // from buildTank(). Returns the same object shape buildTank() does, so the
  // rest of the game (spotting, shot reports, HUD glyphs, etc.) that reads
  // player.group / player.turretPivot / player.armorMeshes etc. for ANY
  // vehicle keeps working without special-casing, even though this vehicle
  // has no turret or gun in this pass. Real figures (Sukhoi/public sources):
  // length 21.935 m, span 14.7 m, height 6.36 m, fuselage diameter 1.5 m,
  // MTOW ~34.5 t, twin AL-31FP turbofans with 3-D thrust-vectoring nozzles,
  // canard foreplanes (the feature that visually separates the SM from a
  // plain Su-27/Su-35), twin canted fins, tandem two-seat cockpit.
  // Local axes match the tank convention: +Z = nose/forward, +Y = up,
  // group origin sits on the fuselage centreline (not the wheels - see
  // GEAR_DOWN_DROP below for the belly-to-wheel offset used by the flight code).
  function buildSu30SM(bodyColor, turretColor){
    // Rebuilt from scratch for the trailer. Everything is lofted / hinged geometry (no stacked primitives):
    //  - nose-to-tail fuselage loft with the drooped Flanker radome, wide blended centre body and tail sting
    //  - two rectangular D-intakes under the LERX feeding round engine nacelles that end in canted TVC nozzles
    //  - LERX + swept wing with leading-edge slats and two flaperon panels per side (all hinged and animated)
    //  - all-moving canards, all-moving stabilators, two canted fins with hinged rudders and ECM tip pods
    //  - one long tandem canopy with bow frames, pilots, IRST ball, pitot boom, IFR probe
    //  - procedural three-tone Flanker camouflage (Light Blue base, Medium Blue and Light Gray patches) with panel lines, light-blue undersides, red stars, wing pylons + missiles
    // Axes: +Z nose, +Y up, +X pilot's LEFT (so the red port light is on +X). Overall size matches the real jet
    // (21.9 long incl. pitot, 14.7 span). The gear mounts, wheel positions and the return object are unchanged
    // so flight.js / updatePlaneFlight() keep working; new animated parts are exposed as `surf`.
    const plane = new THREE.Group();
    plane.rotation.order = 'YXZ';
    const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
    const sgnPow=(v,e)=>Math.sign(v)*Math.pow(Math.abs(v),e);

    // ======================= PAINT (procedural camouflage texture) =======================
    let _seed=20261015; const rnd=()=>{ _seed=(_seed*1664525+1013904223)>>>0; return _seed/4294967296; };
    function paintTexture(underBand){
      const W=1024,H=1024, cv=document.createElement('canvas'); cv.width=W; cv.height=H;
      const g=cv.getContext('2d');
      g.fillStyle='#9ab7d2'; g.fillRect(0,0,W,H);          // Flanker 'Light Blue' base coat
      const blobs=(col,count,rMin,rMax)=>{
        g.fillStyle=col;
        for(let i=0;i<count;i++){
          const cx=rnd()*W, cy=rnd()*H, r=rMin+rnd()*(rMax-rMin), n=10+Math.floor(rnd()*4), pts=[];
          for(let k=0;k<n;k++){ const a=k/n*Math.PI*2, rr=r*(0.5+rnd()*0.75); pts.push([Math.cos(a)*rr*(1.3+rnd()*0.5),Math.sin(a)*rr]); }
          for(const ox of [-W,0,W]) for(const oy of [-H,0,H]){      // wrapped copies so the texture tiles seamlessly
            g.beginPath();
            const m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
            let s=m(pts[n-1],pts[0]); g.moveTo(cx+ox+s[0],cy+oy+s[1]);
            for(let k=0;k<n;k++){ const c=pts[k], e=m(pts[k],pts[(k+1)%n]); g.quadraticCurveTo(cx+ox+c[0],cy+oy+c[1],cx+ox+e[0],cy+oy+e[1]); }
            g.fill();
          }
        }
      };
      blobs('#6a8cb0',46,70,150);       // Flanker 'Medium Blue'
      blobs('#c3cbd1',20,55,120);       // Flanker 'Light Gray'
      blobs('#a6bdd0',14,40,90);        // a few light-blue touch-ups to break the edges
      if(underBand){                    // pale-blue belly: columns around the loft's underside (u 0.3 .. 0.7)
        const gr=g.createLinearGradient(0,0,W,0);
        gr.addColorStop(0,'rgba(168,190,208,0)'); gr.addColorStop(0.24,'rgba(168,190,208,0)');
        gr.addColorStop(0.36,'rgba(168,190,208,1)'); gr.addColorStop(0.64,'rgba(168,190,208,1)');
        gr.addColorStop(0.76,'rgba(168,190,208,0)'); gr.addColorStop(1,'rgba(168,190,208,0)');
        g.fillStyle=gr; g.fillRect(0,0,W,H);
      }
      g.strokeStyle='rgba(20,28,34,0.26)'; g.lineWidth=1.3;     // panel lines
      for(let x=0;x<W;x+=W/9){ const xx=x+(rnd()-0.5)*22; g.beginPath(); g.moveTo(xx,0); g.lineTo(xx+(rnd()-0.5)*8,H); g.stroke(); }
      for(let y=0;y<H;y+=H/13){ const yy=y+(rnd()-0.5)*22; g.beginPath(); g.moveTo(0,yy); g.lineTo(W,yy+(rnd()-0.5)*8); g.stroke(); }
      g.fillStyle='rgba(15,20,25,0.35)';                         // rivet rows along the panel lines
      for(let x=0;x<W;x+=W/9) for(let y=0;y<H;y+=11) g.fillRect(x+(rnd()-0.5)*3,y,1.5,1.5);
      for(let i=0;i<5000;i++){ g.fillStyle=rnd()<0.5?'rgba(255,255,255,0.045)':'rgba(0,0,0,0.05)'; g.fillRect(rnd()*W,rnd()*H,2+rnd()*3,2+rnd()*3); }  // grain / weathering
      const t=new THREE.CanvasTexture(cv); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8; t.encoding=THREE.sRGBEncoding;
      return t;
    }
    const loftTex=paintTexture(true), wingTex=paintTexture(false); wingTex.repeat.set(0.2,0.2);

    const DS=THREE.DoubleSide;
    const skinLoft = new THREE.MeshStandardMaterial({map:loftTex, roughness:0.5, metalness:0.22, side:DS});
    const skinTop  = new THREE.MeshStandardMaterial({map:wingTex, roughness:0.52, metalness:0.2, side:DS});
    const skinBot  = new THREE.MeshStandardMaterial({color:0xa8bed0, roughness:0.5, metalness:0.25, side:DS});
    const edgeMat  = new THREE.MeshStandardMaterial({color:0x7d93a6, roughness:0.6, metalness:0.3, side:DS});
    const darkMat  = new THREE.MeshStandardMaterial({color:0x16181a, roughness:0.8, metalness:0.2, side:DS});
    const radomeMat= new THREE.MeshStandardMaterial({color:0xe9ecec, roughness:0.45, metalness:0.1, side:DS});
    const steelMat = new THREE.MeshStandardMaterial({color:0xaab1b8, roughness:0.35, metalness:0.85, side:DS});
    const burntMat = new THREE.MeshStandardMaterial({color:0x6b6560, roughness:0.45, metalness:0.85, flatShading:true, side:DS});
    const petalMat = new THREE.MeshStandardMaterial({color:0x8b8d8f, roughness:0.4, metalness:0.8, flatShading:true, side:DS});
    const glassMat = new THREE.MeshStandardMaterial({color:0x4e6a7c, roughness:0.08, metalness:0.55, transparent:true, opacity:0.5, depthWrite:false, side:DS});
    const frameMat = new THREE.MeshStandardMaterial({color:0x25282a, roughness:0.6, metalness:0.4});
    const tireMat  = new THREE.MeshStandardMaterial({color:0x121314, roughness:0.9});
    const hubMat   = new THREE.MeshStandardMaterial({color:0x8f979d, roughness:0.4, metalness:0.7});
    const oleoMat  = new THREE.MeshStandardMaterial({color:0xdadfe2, roughness:0.1, metalness:0.95});   // bare polished shock-strut piston (chromed steel)
    const cockMat  = new THREE.MeshStandardMaterial({color:0x2a2d2b, roughness:0.85});
    const seatMat  = new THREE.MeshStandardMaterial({color:0x3b4034, roughness:0.8});
    const suitMat  = new THREE.MeshStandardMaterial({color:0x6b7a56, roughness:0.9});
    const helmMat  = new THREE.MeshStandardMaterial({color:0xe3e6e8, roughness:0.35, metalness:0.1});
    const visorMat = new THREE.MeshStandardMaterial({color:0x181c20, roughness:0.1, metalness:0.7});
    const missileBody=new THREE.MeshStandardMaterial({color:0xcfd4d8, roughness:0.4, metalness:0.3});
    const missileNose=new THREE.MeshStandardMaterial({color:0x2a2c2e, roughness:0.5, metalness:0.2});
    const missileFin =new THREE.MeshStandardMaterial({color:0x8d949a, roughness:0.5, metalness:0.4, side:DS});
    const redStar  = new THREE.MeshStandardMaterial({color:0xc2161d, roughness:0.6, side:DS, polygonOffset:true, polygonOffsetFactor:-3, polygonOffsetUnits:-3});
    const blueStar = new THREE.MeshStandardMaterial({color:0x1d3f8f, roughness:0.6, side:DS, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2});
    const redLightMat = new THREE.MeshStandardMaterial({color:0x7a0f0f, emissive:0xff1a1a, emissiveIntensity:1.6, roughness:0.5});
    const grnLightMat = new THREE.MeshStandardMaterial({color:0x0f6a1a, emissive:0x24ff3a, emissiveIntensity:1.6, roughness:0.5});
    const whtLightMat = new THREE.MeshStandardMaterial({color:0xdddddd, emissive:0xffffff, emissiveIntensity:1.4, roughness:0.5});
    const hudMat = new THREE.MeshStandardMaterial({color:0x0a1a14, emissive:0x1aff6a, emissiveIntensity:0.35, transparent:true, opacity:0.55, side:DS});

    const armorMeshes=[], modules=[];
    function mesh(geo,mat,parent,x,y,z,rx=0,ry=0,rz=0){
      const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.rotation.set(rx,ry,rz);
      m.castShadow=true; m.receiveShadow=true; (parent||plane).add(m); return m;
    }
    const box=(parent,mat,x,y,z,w,h,d,rx=0,ry=0,rz=0)=>mesh(new THREE.BoxGeometry(w,h,d),mat,parent,x,y,z,rx,ry,rz);
    function markArmor(m,t,zone){ m.userData.armorPlate=true; m.userData.armorThicknessMM=t; m.userData.armorZone=zone; armorMeshes.push(m); return m; }
    function markGroup(g,t,zone){ g.children.forEach(c=>{ if(c.isMesh) markArmor(c,t,zone); }); return g; }
    function M(name,kind,parent,x,y,z,r){ modules.push({name,kind,parent,x,y,z,r,health:1,dead:false}); }

    // ======================= LOFT: smooth rounded-rectangle sections along Z =======================
    // section = {z, cx, cy, rx, ry, n}  (n = superellipse exponent: 2 ellipse, 4+ boxy). Catmull-Rom smoothed.
    function smoothSecs(secs,sub){
      const out=[], keys=['cx','cy','rx','ry','n'];
      const P=i=>secs[Math.max(0,Math.min(secs.length-1,i))];
      for(let i=0;i<secs.length-1;i++) for(let k=0;k<sub;k++){
        const t=k/sub, t2=t*t, t3=t2*t, o={z:P(i).z+(P(i+1).z-P(i).z)*t};
        keys.forEach(key=>{
          const p0=P(i-1)[key],p1=P(i)[key],p2=P(i+1)[key],p3=P(i+2)[key];
          o[key]=0.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t2+(-p0+3*p1-3*p2+p3)*t3);
        });
        o.n=Math.max(1.8,o.n); out.push(o);
      }
      out.push(Object.assign({},secs[secs.length-1])); return out;
    }
    function sectionAtZ(S,z){          // S runs nose->tail (z decreasing)
      for(let i=0;i<S.length-1;i++) if(z<=S[i].z && z>=S[i+1].z){
        const t=(S[i].z-z)/Math.max(1e-6,S[i].z-S[i+1].z), r={z};
        ['cx','cy','rx','ry','n'].forEach(k=>{ r[k]=S[i][k]+(S[i+1][k]-S[i][k])*t; }); return r;
      }
      return Object.assign({},S[z>S[0].z?0:S.length-1]);
    }
    function loft(secs,mat,o={}){
      const S=smoothSecs(secs.map(s=>Object.assign({cx:0,n:2},s)),o.sub||4), N=o.seg||28, cols=N+1, vs=o.vScale||0.22;
      const pos=[],uv=[],idx=[];
      const ring=s=>{ const r=[]; for(let k=0;k<=N;k++){ const f=k/N*Math.PI*2, e=2/s.n;
        r.push([s.cx+s.rx*sgnPow(Math.sin(f),e), s.cy+s.ry*sgnPow(Math.cos(f),e), s.z, k/N, s.z*vs]); } return r; };
      S.forEach(s=>ring(s).forEach(v=>{ pos.push(v[0],v[1],v[2]); uv.push(v[3],v[4]); }));
      for(let r=0;r<S.length-1;r++) for(let c=0;c<N;c++){ const a=r*cols+c,b=a+1,cc=a+cols,d=cc+1; idx.push(a,cc,b, b,cc,d); }
      const cap=(row,start)=>{
        const s=S[row], rg=ring(s), base=pos.length/3; let cx=0,cy=0; rg.forEach(v=>{cx+=v[0];cy+=v[1];}); cx/=rg.length; cy/=rg.length;
        pos.push(cx,cy,s.z); uv.push(0.5,s.z*vs); rg.forEach(v=>{ pos.push(v[0],v[1],v[2]); uv.push(v[3],v[4]); });
        for(let c=0;c<N;c++){ if(start) idx.push(base,base+2+c,base+1+c); else idx.push(base,base+1+c,base+2+c); }
      };
      if(o.capStart) cap(0,true);
      if(o.capEnd) cap(S.length-1,false);
      const g=new THREE.BufferGeometry();
      g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
      g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
      g.setIndex(idx); g.computeVertexNormals();
      const m=new THREE.Mesh(g,mat); m.castShadow=true; m.receiveShadow=true; m.userData.S=S; (o.parent||plane).add(m); return m;
    }

    // ======================= THIN PLATES (wings, fins, panels) =======================
    // pts: 2D polygon. axis 'y': [x,z] in a horizontal plate, axis 'x': [z,y] in a vertical plate.
    function plateGeo(pts,axis,off,sign){
      const tris=THREE.ShapeUtils.triangulateShape(pts.map(p=>new THREE.Vector2(p[0],p[1])),[]);
      const P=p=>axis==='y'?[p[0],off,p[1]]:[off,p[1],p[0]];
      const n=axis==='y'?[0,sign,0]:[sign,0,0], pos=[],nor=[],uv=[];
      for(const t of tris){
        let a=P(pts[t[0]]),b=P(pts[t[1]]),c=P(pts[t[2]]), ua=pts[t[0]],ub=pts[t[1]],uc=pts[t[2]];
        const e1=[b[0]-a[0],b[1]-a[1],b[2]-a[2]], e2=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
        const cr=[e1[1]*e2[2]-e1[2]*e2[1], e1[2]*e2[0]-e1[0]*e2[2], e1[0]*e2[1]-e1[1]*e2[0]];
        if(cr[0]*n[0]+cr[1]*n[1]+cr[2]*n[2]<0){ let q=b;b=c;c=q; q=ub;ub=uc;uc=q; }
        [[a,ua],[b,ub],[c,uc]].forEach(([q,u])=>{ pos.push(q[0],q[1],q[2]); nor.push(n[0],n[1],n[2]); uv.push(u[0],u[1]); });
      }
      const g=new THREE.BufferGeometry();
      g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
      g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
      g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
      return g;
    }
    function edgeGeo(pts,axis,t){
      let area=0; const L=pts.length, h=t/2, pos=[],nor=[];
      for(let i=0;i<L;i++){ const p=pts[i],q=pts[(i+1)%L]; area+=p[0]*q[1]-q[0]*p[1]; }
      const P=(p,o)=>axis==='y'?[p[0],o,p[1]]:[o,p[1],p[0]];
      for(let i=0;i<L;i++){
        const p=pts[i],q=pts[(i+1)%L], da=q[0]-p[0], db=q[1]-p[1], ln=Math.hypot(da,db)||1;
        let na=db/ln, nb=-da/ln; if(area<0){ na=-na; nb=-nb; }
        const n=axis==='y'?[na,0,nb]:[0,nb,na], v=[P(p,h),P(q,h),P(q,-h),P(p,-h)];
        const tri=(a,b,c)=>{
          const e1=[b[0]-a[0],b[1]-a[1],b[2]-a[2]], e2=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
          const cr=[e1[1]*e2[2]-e1[2]*e2[1], e1[2]*e2[0]-e1[0]*e2[2], e1[0]*e2[1]-e1[1]*e2[0]];
          if(cr[0]*n[0]+cr[1]*n[1]+cr[2]*n[2]<0){ const q2=b;b=c;c=q2; }
          [a,b,c].forEach(q=>{ pos.push(q[0],q[1],q[2]); nor.push(n[0],n[1],n[2]); });
        };
        tri(v[0],v[1],v[2]); tri(v[0],v[2],v[3]);
      }
      const g=new THREE.BufferGeometry();
      g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
      g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
      return g;
    }
    function slab(pts,axis,t,matPos,matNeg,matEdge){
      const g=new THREE.Group(), h=t/2;
      [[plateGeo(pts,axis,h,1),matPos],[plateGeo(pts,axis,-h,-1),matNeg],[edgeGeo(pts,axis,t),matEdge||edgeMat]].forEach(([geo,mat])=>{
        const m=new THREE.Mesh(geo,mat); m.castShadow=true; m.receiveShadow=true; g.add(m);
      });
      return g;
    }
    // Hinged horizontal panel. A,B = hinge ends [x,z] with A.x<B.x; poly absolute [x,z]. set(a): + = trailing edge UP
    // (for a leading-edge slat, whose chord points forward, + = leading edge DOWN).
    function hpanel(parent,A,B,poly,y,t,matTop,matBot){
      if(A[0]>B[0]){ const q=A;A=B;B=q; }
      const dx=B[0]-A[0], dz=B[1]-A[1], L=Math.hypot(dx,dz), ax=dx/L, az=dz/L;
      // Keep the hinge alignment fixed on a mount, then rotate a child around that
      // mount's local X axis. Combining hinge yaw and deflection on one Euler
      // rotation can tilt the effective axis and make mirrored slats peel away
      // from the wing unevenly.
      const mount=new THREE.Group();
      mount.position.set(A[0],y,A[1]);
      mount.rotation.y=-Math.atan2(az,ax);
      const hinge=new THREE.Group();
      mount.add(hinge);
      const loc=poly.map(([x,z])=>{ const px=x-A[0],pz=z-A[1]; return [px*ax+pz*az, -px*az+pz*ax]; });
      const panel=slab(loc,'y',t,matTop,matBot);
      hinge.add(panel); markGroup(panel,3,'control'); parent.add(mount);
      return {grp:hinge,cur:0,set(a){ hinge.rotation.x=a; }};
    }
    // Hinged vertical panel (rudder). A,B = hinge ends [z,y] (B above A); poly [z,y]; set(a) swings the trailing edge sideways.
    function vpanel(parent,A,B,poly,t,mat){
      const tau=Math.atan2(B[0]-A[0],B[1]-A[1]);
      const outer=new THREE.Group(); outer.position.set(0,A[1],A[0]); outer.rotation.x=tau;
      const inner=new THREE.Group(); outer.add(inner);
      const loc=poly.map(([z,y])=>{ const dz=z-A[0], dy=y-A[1]; return [-dy*Math.sin(tau)+dz*Math.cos(tau), dy*Math.cos(tau)+dz*Math.sin(tau)]; });
      inner.add(slab(loc,'x',t,mat,mat)); markGroup(inner.children[0],3,'control'); parent.add(outer);
      return {grp:inner,cur:0,set(a){ inner.rotation.y=a; }};
    }
    const starPts=R=>{ const p=[]; for(let i=0;i<10;i++){ const a=Math.PI/2+i*Math.PI/5, r=i%2?R*0.382:R; p.push([Math.cos(a)*r,Math.sin(a)*r]); } return p; };
    function star(parent,axis,pos,R,sign){      // flat red star with a blue edge
      const g=new THREE.Group(); g.position.set(pos[0],pos[1],pos[2]);
      [[starPts(R*1.14),blueStar,0],[starPts(R),redStar,0.004]].forEach(([pts,mat,lift])=>{
        const m=new THREE.Mesh(plateGeo(pts,axis,sign*lift,sign),mat); m.receiveShadow=true; g.add(m);
      });
      parent.add(g); return g;
    }

    // ======================= FUSELAGE =======================
    // Radome (dark) with the signature downward droop: tip is ~0.4 below the fuselage datum (about 5 degrees).
    // SIDE-VIEW FIT: the radome and forebody were measured against a real Su-30 side profile (same nose-to-tail scale). The real radome is
    // about 1.3 m across at the joint (the old one was 1.1) and the joint is at z=8.45; the underside line was already right, so only the
    // top got fuller.
    const radome=loft([
      {z:11.00,cy:-0.42,rx:0.03,ry:0.03},{z:10.70,cy:-0.37,rx:0.17,ry:0.18},{z:10.20,cy:-0.29,rx:0.33,ry:0.36},
      {z:9.50,cy:-0.185,rx:0.505,ry:0.545},{z:8.90,cy:-0.115,rx:0.585,ry:0.635},{z:8.45,cy:-0.0475,rx:0.62,ry:0.6875,n:2.1}
    ],radomeMat,{capStart:true,sub:5});
    markArmor(radome,6,'fuselage');
    // fuselage sections (the body itself is built later, merged with the cockpit - see CANOPY + FUSELAGE below)
    const FUSE_SECS=[
      // Nose deck: underside unchanged. The top line is raised from z=7.2 back to z=2.5 so the forward fuselage keeps curving
      // upward out of the radome and carries on into the cockpit, instead of staying flat behind the radome and then kinking up.
      {z:8.45,cy:-0.0475,rx:0.62,ry:0.6875,n:2.1},{z:7.20,cy:-0.063,rx:0.64,ry:0.578,n:2.2},{z:6.40,cy:0.093,rx:0.74,ry:0.693,n:2.4},
      {z:5.40,cy:0.133,rx:0.92,ry:0.703,n:2.8},{z:4.20,cy:0.120,rx:1.30,ry:0.680,n:3.4},{z:2.50,cy:0.075,rx:1.60,ry:0.605,n:3.8},
      {z:0.50,cy:0.03,rx:1.62,ry:0.54,n:3.8},{z:-1.50,cy:0.02,rx:1.50,ry:0.48,n:3.6},{z:-3.50,cy:0.00,rx:1.25,ry:0.40,n:3.2},
      {z:-5.50,cy:-0.07,rx:0.85,ry:0.33,n:2.8},{z:-7.50,cy:-0.18,rx:0.60,ry:0.30,n:2.5},{z:-8.60,cy:-0.30,rx:0.50,ry:0.34,n:2.4}
    ];
    const FS=smoothSecs(FUSE_SECS.map(s=>Object.assign({cx:0,n:2},s)),40);
    loft([  // tail sting between the nozzles (brake-chute housing / rear warning radar)
      {z:-8.30,cy:-0.32,rx:0.46,ry:0.36,n:2.3},{z:-9.20,cy:-0.38,rx:0.36,ry:0.38},{z:-10.20,cy:-0.34,rx:0.22,ry:0.30},{z:-10.90,cy:-0.28,rx:0.03,ry:0.03}
    ],skinLoft,{capEnd:true});

    // ======================= INTAKES, NACELLES, TVC NOZZLES =======================
    const nacellePivots=[], surf={canard:[],stab:[],flapIn:[],flapOut:[],slat:[],rudder:[]};
    [-1,1].forEach(sd=>{
      const nx=sd*1.15;
      // Su-27/30 family intake: a rectangular 2-D ramp inlet with a RAKED mouth. The ramp / upper lip (tucked under the LERX) leads and the
      // cowl lip at the bottom sits further aft - the steeply raked "diagonal cut" - with the last few cm of the front edge vertical.
      // Built as a scoop that runs from the nacelle section at z=0.60 forward to the raked plane, then a bright lip rim and a dark throat.
      const nac=loft([
        {z:0.60,cx:nx,cy:-0.84,rx:0.62,ry:0.60,n:2.9},
        {z:-0.50,cx:nx,cy:-0.84,rx:0.62,ry:0.60,n:2.6},{z:-3.00,cx:nx,cy:-0.80,rx:0.60,ry:0.58,n:2.3},{z:-5.00,cx:nx,cy:-0.78,rx:0.56,ry:0.55,n:2.1},
        {z:-6.40,cx:nx,cy:-0.76,rx:0.53,ry:0.52,n:2.0}
      ],skinLoft,{capStart:false,sub:5});
      markArmor(nac,8,'engine');
      {
        const IN={zAft:0.60,zLow:1.00,rake:1.48,vert:0.12,N:44,M:8};
        const A={cx:nx,cy:-0.84,rx:0.62,ry:0.60,n:2.9}, L={cx:nx*0.87,cy:-0.85,rx:0.47,ry:0.50,n:6.0}, Lin={cx:nx*0.87,cy:-0.85,rx:0.418,ry:0.445,n:6.0};
        const yBot=L.cy-L.ry, zFace=y=>IN.zLow+IN.rake*Math.max(0,y-(yBot+IN.vert));
        const pt=(s,f)=>{ const e=2/s.n; return [s.cx+s.rx*sgnPow(Math.sin(f),e), s.cy+s.ry*sgnPow(Math.cos(f),e)]; };
        const cols=IN.N+1, pos=[], uv=[], idx=[];
        for(let r=0;r<=IN.M;r++){ const t=r/IN.M;
          for(let k=0;k<=IN.N;k++){ const f=k/IN.N*Math.PI*2, a=pt(A,f), l=pt(L,f), x=a[0]+(l[0]-a[0])*t, y=a[1]+(l[1]-a[1])*t, z=IN.zAft+(zFace(l[1])-IN.zAft)*t;
            pos.push(x,y,z); uv.push(k/IN.N,z*0.22); } }
        for(let r=0;r<IN.M;r++) for(let k=0;k<IN.N;k++){ const a=r*cols+k, b=a+1, c=a+cols, d=c+1; idx.push(a,c,b, b,c,d); }
        const body=new THREE.BufferGeometry(); body.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); body.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); body.setIndex(idx); body.computeVertexNormals();
        const scoop=new THREE.Mesh(body,skinLoft); scoop.castShadow=true; scoop.receiveShadow=true; plane.add(scoop); markArmor(scoop,8,'engine');
        // lip rim (bright) and dark throat funnel on the raked plane
        const rp=[], ri=[]; for(let k=0;k<=IN.N;k++){ const f=k/IN.N*Math.PI*2, o=pt(L,f), i=pt(Lin,f); rp.push(o[0],o[1],zFace(o[1])+0.004, i[0],i[1],zFace(i[1])+0.004); }
        for(let k=0;k<IN.N;k++){ const a=k*2, b=a+1, c=a+2, d=a+3; ri.push(a,b,c, c,b,d); }
        const rim=new THREE.BufferGeometry(); rim.setAttribute('position',new THREE.Float32BufferAttribute(rp,3)); rim.setIndex(ri); rim.computeVertexNormals(); plane.add(new THREE.Mesh(rim,steelMat));
        const tp=[], ti=[]; for(let k=0;k<=IN.N;k++){ const f=k/IN.N*Math.PI*2, i=pt(Lin,f); tp.push(i[0],i[1],zFace(i[1])); }
        tp.push(Lin.cx,Lin.cy,zFace(Lin.cy)-0.75); for(let k=0;k<IN.N;k++) ti.push(k,k+1,IN.N+1);
        const thr=new THREE.BufferGeometry(); thr.setAttribute('position',new THREE.Float32BufferAttribute(tp,3)); thr.setIndex(ti); thr.computeVertexNormals(); plane.add(new THREE.Mesh(thr,darkMat));
      }
      // intake louvers on the underside behind the mouth (dark slatted panel, as seen from below in the photo)
      box(plane,darkMat,nx,-1.445,0.00,0.56,0.02,1.15);
      for(let k=0;k<7;k++) box(plane,steelMat,nx,-1.455,0.50-k*0.17,0.56,0.012,0.05).castShadow=false;
      // AL-31FP nozzle on a pivot: the deflection plane is canted ~32 degrees, so the pivot's Z-rotation is the cant.
      const piv=new THREE.Object3D(); piv.position.set(nx,-0.76,-6.40); piv.rotation.order='ZXY'; piv.rotation.z=sd*0.56; plane.add(piv);
      mesh(new THREE.CylinderGeometry(0.47,0.42,0.80,24,1,true),burntMat,piv,0,0,-0.40,Math.PI/2,0,0);        // convergent section
      mesh(new THREE.CylinderGeometry(0.42,0.54,1.30,20,1,true),petalMat,piv,0,0,-1.45,Math.PI/2,0,0);        // divergent petals (faceted)
      mesh(new THREE.CylinderGeometry(0.545,0.545,0.07,24,1,true),steelMat,piv,0,0,-2.2,Math.PI/2,0,0);        // trailing ring
      mesh(new THREE.CircleGeometry(0.40,20),new THREE.MeshStandardMaterial({color:0x1a1210,roughness:0.9,side:DS}),piv,0,0,-0.50,0,0,0);   // hot core
      nacellePivots.push(piv);
      M(sd>0?'Engine (L)':'Engine (R)','engine',plane,nx,-0.80,-3.5,0.6);
    });

    // ======================= WING + LERX (airfoil solids, slats and two flaperon panels per side) =======================
    // The wing used to be a flat 16 cm plate with a notch between LERX and wing, stuck to the side of the fuselage. It is now a
    // real tapered airfoil solid: NACA-style thickness (rounded nose, sharp trailing edge), thick at the root and thin at the tip,
    // a smooth concave LERX-to-wing leading edge (42 deg sweep outboard), the clipped square tip, and a gaussian root fillet that
    // blends it into the fuselage. The slat and flap panels are cut from the same height field, so at rest they are flush with it.
    // LERX root point (1.1, 4.6) sits flush with the actual fuselage radius at that station (see fuseHalfW below) and the ~55 deg
    // LERX sweep from there was chosen so the leading edge stays just outside the fuselage contour the whole way to the wing glove
    // break at x=2.3..3.3 - previously the root sat at (0.8, 6.6), far forward of where the fuselage is that narrow, which drew the
    // LERX out into a long thin spike disconnected from the hull instead of a blade that reads as part of the fuselage's own line.
    const smooth01=t=>{ t=Math.max(0,Math.min(1,t)); return t*t*(3-2*t); };
    // WING PLANFORM - fitted to an underside photo of the real jet (scale from nose-to-tail and wingspan, left/right averaged):
    //   leading edge  z = 2.44 - 0.927|x|   (42.8 deg sweep), trailing edge  z = -4.235 - 0.274|x|  (swept FORWARD about 15 deg, so the tip
    //   trailing edge sits further aft than the root), tip at |x| = 7.35. Root chord is about 4.8 m and tip chord 1.9 m: a clipped trapezoid,
    //   not the old long-chord delta. The LERX is only a short blade off the fuselage side: it leaves the hull at about (1.4, 3.9), reaches
    //   its outer edge at |x| = 1.9 (z = 3.2) and that edge runs straight aft to the wing leading edge at about z = 0.55 (the notch you see
    //   between canard and wing in the photo).
    const zTE=x=>-4.235-0.274*x, zLEwing=x=>2.44-0.927*x, zLERX=x=>4.40-1.47*(x-1.1);
    const zLE=x=>{ const w=smooth01((x-1.9)/0.15); return zLERX(x)*(1-w)+zLEwing(x)*w; }, zS=x=>zLE(x)-0.5;
    const hInA=[1.9,zTE(1.9)+1.05], hInB=[4.8,zTE(4.8)+0.90], hOutA=[4.8,zTE(4.8)+0.75], hOutB=[7.35,zTE(7.35)+0.55];
    const lerpZ=(A,B,x)=>A[1]+(B[1]-A[1])*(x-A[0])/(B[0]-A[0]), hInZ=x=>lerpZ(hInA,hInB,x), hOutZ=x=>lerpZ(hOutA,hOutB,x);
    const naca=xi=>{ xi=Math.max(0,Math.min(1,xi)); return (0.2969*Math.sqrt(xi)-0.1260*xi-0.3516*xi*xi+0.2843*xi*xi*xi-0.1036*xi*xi*xi*xi)/0.1001; };   // 0..1, peak at 30% chord
    const wingChord=x=>zLE(x)-zTE(x), wingT=x=>Math.max(0.08,Math.min(0.30,0.055*wingChord(x)));
    const fuseHalfW=z=>{ const s=sectionAtZ(FS,Math.max(-8.6,Math.min(8.0,z))); return s.rx*Math.pow(Math.max(0,1-Math.pow(Math.abs(s.cy)/s.ry,s.n)),1/s.n); };
    function wingSurf(x,z){            // x >= 0 -> [y top, y bottom]
      const h=0.5*wingT(x)*naca((zLE(x)-z)/wingChord(x)), d=x-fuseHalfW(z), fil=Math.exp(-(d*d)/0.09), y0=0.16*smooth01((z-2.0)/3.5);   // LERX rises up the neck
      return [y0+h+0.14*fil, y0-h-0.08*fil];
    }
    function mkGrid(P,nx,nz){ const g=[]; for(let i=0;i<=nx;i++){ g.push([]); for(let j=0;j<=nz;j++){ const [X,z]=P(i/nx,(1-Math.cos(Math.PI*j/nz))/2), s=wingSurf(Math.abs(X),z); g[i].push({X,z,yt:s[0],yb:s[1]}); } } return g; }
    // closed solid from a grid (i along the span, j along the chord, leading edge first); xf maps world -> output coordinates
    function solidGrid(grid,nx,nz,xf){
      const G=new THREE.Group();
      const surfGeo=top=>{ const pos=[],uv=[],idx=[];
        for(let i=0;i<=nx;i++) for(let j=0;j<=nz;j++){ const v=grid[i][j], o=xf(v.X,top?v.yt:v.yb,v.z); pos.push(o[0],o[1],o[2]); uv.push(Math.abs(v.X),v.z); }
        for(let i=0;i<nx;i++) for(let j=0;j<nz;j++){ const a=i*(nz+1)+j,b=a+nz+1,c=a+1,d=b+1; idx.push(a,b,c, b,d,c); }
        const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals(); return g; };
      const capGeo=()=>{ const pos=[],idx=[]; let base=0;
        const P=(i,j,top)=>{ const v=grid[i][j]; return xf(v.X,top?v.yt:v.yb,v.z); };
        const quad=(p0,p1,p2,p3)=>{ pos.push(...p0,...p1,...p2,...p3); idx.push(base,base+1,base+2, base,base+2,base+3); base+=4; };
        for(let i=0;i<nx;i++){ quad(P(i,0,1),P(i+1,0,1),P(i+1,0,0),P(i,0,0)); quad(P(i,nz,1),P(i+1,nz,1),P(i+1,nz,0),P(i,nz,0)); }
        for(let j=0;j<nz;j++){ quad(P(0,j,1),P(0,j+1,1),P(0,j+1,0),P(0,j,0)); quad(P(nx,j,1),P(nx,j+1,1),P(nx,j+1,0),P(nx,j,0)); }
        const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals(); return g; };
      [[surfGeo(true),skinTop],[surfGeo(false),skinBot],[capGeo(),edgeMat]].forEach(([geo,mat])=>{ const m=new THREE.Mesh(geo,mat); m.castShadow=true; m.receiveShadow=true; G.add(m); });
      return G;
    }
    // hinged panel cut from the wing surface. quad = [hinge inner, hinge outer, far outer, far inner] as [X,z]; set(a): + = trailing edge UP (slat: leading edge DOWN)
    function hpanelSolid(parent,A,B,quad,nx,nz){
      if(A[0]>B[0]){ const q=A;A=B;B=q; quad=[quad[1],quad[0],quad[3],quad[2]]; }
      const dx=B[0]-A[0], dz=B[1]-A[1], L=Math.hypot(dx,dz), ax=dx/L, az=dz/L;
      const mount=new THREE.Group(); mount.position.set(A[0],0,A[1]); mount.rotation.y=-Math.atan2(az,ax);
      const hinge=new THREE.Group(); mount.add(hinge);
      const lerp2=(p,q,t)=>[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t];
      const grid=mkGrid((s,t)=>lerp2(lerp2(quad[0],quad[3],t),lerp2(quad[1],quad[2],t),s),nx,nz);
      const panel=solidGrid(grid,nx,nz,(X,y,z)=>{ const px=X-A[0], pz=z-A[1]; return [px*ax+pz*az, y, -px*az+pz*ax]; });
      hinge.add(panel); markGroup(panel,3,'control'); parent.add(mount);
      return {grp:hinge,cur:0,set(a){ hinge.rotation.x=a; }};
    }
    function missile(len,r){
      const g=new THREE.Group(), bl=len*0.78;
      mesh(new THREE.CylinderGeometry(r,r,bl,14),missileBody,g,0,0,-len/2+bl/2,Math.PI/2,0,0);
      mesh(new THREE.ConeGeometry(r,len-bl,14),missileNose,g,0,0,-len/2+bl+(len-bl)/2,Math.PI/2,0,0);
      for(let k=0;k<4;k++){
        const a=k*Math.PI/2, f=box(g,missileFin,0,0,-len/2+len*0.07,0.018,r*3.4,len*0.13); f.rotation.z=a; f.position.set(-Math.sin(a)*r*1.3,Math.cos(a)*r*1.3,-len/2+len*0.07);
        const c=box(g,missileFin,0,0,len*0.12,0.014,r*2.5,len*0.06); c.rotation.z=a+Math.PI/4; c.position.set(-Math.sin(a+Math.PI/4)*r*1.0,Math.cos(a+Math.PI/4)*r*1.0,len*0.12);
      }
      g.traverse(o=>{ if(o.isMesh) o.castShadow=false; });  // 6 of these per jet (10 meshes each) - too thin/small to read in a shadow, not worth the extra shadow-pass draw calls
      return g;
    }
    [-1,1].forEach(sd=>{
      const m=([x,z])=>[sd*x,z];
      const patch=(xa,xb,LEf,REf,nx,nz)=>{ const grid=mkGrid((s,t)=>{ const x=xa+(xb-xa)*s, a=LEf(x), b=REf(x); return [sd*x,a+(b-a)*t]; },nx,nz);
        const g=solidGrid(grid,nx,nz,(X,y,z)=>[X,y,z]); markGroup(g,4,'wing'); plane.add(g); };
      patch(1.1,1.9,zLE,zTE,10,22); patch(1.9,3.3,zLE,hInZ,10,22); patch(3.3,4.8,zS,hInZ,8,16); patch(4.8,7.35,zS,hOutZ,10,16);
      surf.flapIn.push({sd,...hpanelSolid(plane,m(hInA),m(hInB),[m(hInA),m(hInB),m([4.8,zTE(4.8)]),m([1.9,zTE(1.9)])],8,5)});
      surf.flapOut.push({sd,...hpanelSolid(plane,m(hOutA),m(hOutB),[m(hOutA),m(hOutB),m([7.35,zTE(7.35)]),m([4.8,zTE(4.8)])],8,5)});
      surf.slat.push({sd,...hpanelSolid(plane,m([3.3,zS(3.3)]),m([7.35,zS(7.35)]),[m([3.3,zS(3.3)]),m([7.35,zS(7.35)]),m([7.35,zLE(7.35)]),m([3.3,zLE(3.3)])],10,5)});
      // wing stars (top and bottom), floated just off the curved surface
      const ws=wingSurf(5.4,-4.2); star(plane,'y',[sd*5.4,ws[0]+0.012,-4.2],0.5,1); star(plane,'y',[sd*5.4,ws[1]-0.012,-4.2],0.5,-1);
      // nav lights: red = port = pilot's LEFT = +X, green = starboard
      mesh(new THREE.SphereGeometry(0.06,10,8),sd>0?redLightMat:grnLightMat,plane,sd*7.6,0.02,-2.2).castShadow=false;
      // wingtip R-73 on a rail
      const tip=missile(2.9,0.085); tip.position.set(sd*7.45,0.0,-3.2); plane.add(tip);
      box(plane,steelMat,sd*7.4,0.0,-3.9,0.12,0.06,1.2);
      // under-wing pylons: R-73 outboard, R-77 inboard
      [[3.5,zLE(3.5)-0.33*wingChord(3.5),3.6,0.1],[5.6,zLE(5.6)-0.33*wingChord(5.6),2.9,0.085]].forEach(([px,pz,len,r])=>{
        box(plane,skinBot,sd*px,-0.27,pz,0.12,0.42,1.3);
        const ms=missile(len,r); ms.position.set(sd*px,-0.5,pz-0.2); plane.add(ms);
      });
    });

    // ======================= CANARDS (all-moving), STABILATORS (all-moving) =======================
    [-1,1].forEach(sd=>{
      const m=([x,z])=>[sd*x,z];
      const canard=[[1.00,4.61],[3.30,1.11],[3.30,0.89],[1.00,1.70]];   // photo: LE swept ~57 deg, TE swept forward ~19 deg, root chord ~1.9 m, tip chord ~0.2 m
      surf.canard.push({sd,...hpanel(plane,m([1.00,3.15]),m([3.30,1.00]),canard.map(m),0.32,0.07,skinTop,skinBot)});
      mesh(new THREE.CylinderGeometry(0.1,0.1,0.34,12),steelMat,plane,sd*1.2,0.30,2.96,0,0,Math.PI/2).castShadow=false;   // canard root shaft fairing
      const stab=[[1.35,-5.8],[4.9,-8.6],[4.9,-9.5],[1.35,-8.5]];
      surf.stab.push({sd,...hpanel(plane,m([1.35,-7.0]),m([4.9,-9.0]),stab.map(m),-0.72,0.1,skinTop,skinBot)});
    });

    // ======================= TWIN FINS (canted ~5 deg) + RUDDERS + ECM POD TIPS =======================
    [-1,1].forEach(sd=>{
      const finG=new THREE.Group(); finG.position.set(sd*1.32,0.22,0); finG.rotation.z=-sd*0.09; plane.add(finG);
      const fin=slab([[-3.82,-0.25],[-6.55,3.58],[-6.65,3.58],[-6.50,-0.25]],'x',0.12,skinTop,skinTop); finG.add(fin); markGroup(fin,3,'fin');   // fixed fin: LE root z=-4.0, tip LE z=-6.55, 3.6 m tall (reference side view)
      surf.rudder.push({sd,...vpanel(finG,[-6.50,0],[-6.65,3.4],[[-6.50,-0.25],[-6.65,3.58],[-7.10,3.52],[-7.50,3.20],[-7.70,2.85],[-7.70,-0.25]],0.1,skinTop)});
      star(finG,'x',[0.064*sd,1.3,-5.9],0.36,sd);
      mesh(new THREE.CylinderGeometry(0.085,0.085,0.9,12),steelMat,finG,0,3.50,-6.75,Math.PI/2,0,0).castShadow=false;       // ECM tip pod
      mesh(new THREE.ConeGeometry(0.085,0.35,12),darkMat,finG,0,3.50,-6.12,Math.PI/2,0,0).castShadow=false;
      box(finG,darkMat,0,0.15,-4.9,0.05,0.2,0.5).castShadow=false;                                                          // fin-root flare dispenser panel
    });

    // ======================= CANOPY + FUSELAGE: ONE CONTINUOUS SKIN =======================
    // Earlier the cockpit was a separate hump lofted on top of the fuselage, so the two surfaces met in a hard crease
    // with different shading and a different camouflage mapping: a visible seam. Now the fuselage rings and the cockpit
    // hump are merged into ONE surface at every station: the outline follows the hump up and over, drops to the fuselage
    // top through a smooth concave fillet (a quadratic Bezier tangent to both), and carries on round the fuselage.
    // The camouflage is mapped by distance round that single outline, so it flows across the join.
    //   roof T(z) and half-width W(z) are natural cubic splines -> one rise, one peak, one fall, no wobble.
    //   Under the glass the top of the outline is left open and a glass strip covers the opening.
    function cubicSpline(pts){            // natural cubic spline through [x,y] knots (x ascending)
      const n=pts.length, x=pts.map(p=>p[0]), y=pts.map(p=>p[1]), h=[], al=[0], l=[1], mu=[0], zz=[0], c=new Array(n).fill(0), b=[], d=[];
      for(let i=0;i<n-1;i++) h[i]=x[i+1]-x[i];
      for(let i=1;i<n-1;i++) al[i]=3/h[i]*(y[i+1]-y[i])-3/h[i-1]*(y[i]-y[i-1]);
      for(let i=1;i<n-1;i++){ l[i]=2*(x[i+1]-x[i-1])-h[i-1]*mu[i-1]; mu[i]=h[i]/l[i]; zz[i]=(al[i]-h[i-1]*zz[i-1])/l[i]; }
      for(let j=n-2;j>=0;j--){ c[j]=zz[j]-mu[j]*c[j+1]; b[j]=(y[j+1]-y[j])/h[j]-h[j]*(c[j+1]+2*c[j])/3; d[j]=(c[j+1]-c[j])/(3*h[j]); }
      return t=>{ let i=0; while(i<n-2 && t>x[i+1]) i++; const dx=Math.max(x[0],Math.min(x[n-1],t))-x[i]; return y[i]+b[i]*dx+c[i]*dx*dx+d[i]*dx*dx*dx; };
    }
    // [z, value] knots, listed tail -> nose
    // Roof line (side profile) - modelled on the reference side view: a long raked windscreen that is a little convex (about 30 deg
    // at the glass tip easing to about 20 deg), a tall flat crest that runs all the way back over both seats to the rear canopy frame,
    // and then the spine, which carries on from the canopy top and falls away in one straight line (about 11 deg).
    // (Pilot head clearance sets how steep the windscreen has to be; the cockpit eye at z=5.9 is unchanged.)
    const roofT=cubicSpline([[-3.40,0.405],[-2.60,0.500],[-1.60,0.680],[-0.60,0.880],[0.20,1.060],[1.00,1.250],[1.80,1.430],[2.50,1.600],
      [3.10,1.760],[3.70,1.880],[4.30,1.935],[5.00,1.900],[5.60,1.820],[6.20,1.620],[6.80,1.340],[7.40,1.070],[7.90,0.880],[8.10,0.760],[8.30,0.640]]);
    const halfW=cubicSpline([[-3.40,0.03],[-2.20,0.30],[-0.60,0.47],[1.40,0.60],[3.20,0.665],[4.70,0.66],[6.00,0.62],[6.90,0.50],[7.85,0.22],[8.30,0.015]]);
    const GLASS_FRONT=8.12, GLASS_REAR=2.90, GLASS_LIFT=0.010, HUMP_BOT=0.05, HUMP_N=2.4, HUMP_E=2/HUMP_N, HUMP_END=-3.40;
    // Glass edge (sill) = the glass "floor" line: ONE straight line (about 7.3 deg) from the windscreen tip right behind the radome up
    // to the rear canopy frame, like the straight black line in the reference. It never dips or kinks because the body shoulder under
    // the glass (FUSE_SECS) is kept below this line. The glass is tall all the way back and ends square at a rear frame.
    const sillY=z=>0.470+0.128*(7.70-z);
    function humpAt(z){ const T=roofT(z), W=Math.max(0.012,halfW(z)); return {z, cx:0, cy:(T+HUMP_BOT)/2, rx:W, ry:(T-HUMP_BOT)/2, n:HUMP_N, T}; }
    const topY=(s,x)=>s.cy+s.ry*Math.pow(Math.max(0,1-Math.pow(Math.min(1,Math.abs(x)/s.rx),HUMP_N)),1/HUMP_N);   // hump surface height at lateral offset x
    // ---- the fuselage sections (same shape as the old loft, sampled finely) and small polyline helpers
    const SKIN_NU=34, SKIN_NL=14, GLASS_N=22, FILLET_R=0.30, OUT_M=240;
    const sgn=v=>v<0?-1:1;
    const outline=(s,e,M)=>{ const o=[]; for(let k=0;k<=M;k++){ const f=k/M*Math.PI*2; o.push([s.cx+s.rx*sgnPow(Math.sin(f),e), s.cy+s.ry*sgnPow(Math.cos(f),e)]); } return o; };   // from the top, +x first
    const insideSE=(s,x,y)=>Math.pow(Math.abs((x-s.cx)/s.rx),s.n)+Math.pow(Math.abs((y-s.cy)/s.ry),s.n)<=1;
    const cumLen=pts=>{ const c=[0]; for(let i=1;i<pts.length;i++) c.push(c[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1])); return c; };
    function atArc(pts,c,s){ s=Math.max(0,Math.min(c[c.length-1],s)); let lo=0,hi=pts.length-1; while(hi-lo>1){ const m=(lo+hi)>>1; if(c[m]<=s) lo=m; else hi=m; }
      const t=(s-c[lo])/Math.max(1e-9,c[hi]-c[lo]); return [pts[lo][0]+(pts[hi][0]-pts[lo][0])*t, pts[lo][1]+(pts[hi][1]-pts[lo][1])*t]; }
    const polyPart=(pts,c,s0,s1,n)=>{ const o=[]; for(let i=0;i<=n;i++) o.push(atArc(pts,c,s0+(s1-s0)*i/n)); return o; };
    function resample(poly,n){ const c=cumLen(poly); return polyPart(poly,c,0,c[c.length-1],n); }
    const mirror=p=>[-p[0],p[1]];
    function humpNormal(h,x,y){ const nx=sgn(x)*Math.pow(Math.abs(x/h.rx),h.n-1)/h.rx, ny=sgn(y-h.cy)*Math.pow(Math.abs((y-h.cy)/h.ry),h.n-1)/h.ry, l=Math.hypot(nx,ny)||1; return [nx/l,ny/l]; }
    // Everything the mesh needs at one z: the skin outline (one fixed vertex count), its u coordinate, the glass line and the floor line.
    function station(z){
      const b=sectionAtZ(FS,z), Bp=outline(b,2/b.n,OUT_M), Bc=cumLen(Bp), bTop=b.cy+b.ry, sEq=Bc[OUT_M/4], sBot=Bc[OUT_M/2];
      const h=humpAt(z), Hp=outline(h,HUMP_E,OUT_M), Hc=cumLen(Hp);
      let hump=(z>=HUMP_END && h.T>bTop+0.004), J=null, sJ=0;
      if(hump){
        let i=1; while(i<=OUT_M/2 && !insideSE(b,Hp[i][0],Hp[i][1])) i++;
        if(i>OUT_M/2) hump=false;
        else{ let lo=Hp[i-1], hi=Hp[i]; for(let it=0;it<28;it++){ const m=[(lo[0]+hi[0])/2,(lo[1]+hi[1])/2]; if(insideSE(b,m[0],m[1])) hi=m; else lo=m; }
          J=[(lo[0]+hi[0])/2,(lo[1]+hi[1])/2]; sJ=Hc[i-1]+Math.hypot(J[0]-Hp[i-1][0],J[1]-Hp[i-1][1]); }
      }
      let sS=0, win=false;
      if(hump && z<GLASS_FRONT-1e-6 && z>GLASS_REAR+1e-6){
        const sy=sillY(z);
        if(sy<h.T-0.004){ let k=0; while(k<OUT_M/2-1 && Hp[k+1][1]>sy) k++;
          const t=(Hp[k][1]-sy)/Math.max(1e-9,Hp[k][1]-Hp[k+1][1]); sS=Hc[k]+(Hc[k+1]-Hc[k])*t;
          if(sS>sJ-0.04) sS=Math.max(0,sJ-0.04); win=sS>0.003; }
      }
      const s0=win?sS:0; let U, eqS=sEq, sBJ=0;
      if(hump){
        const fx=sgn(J[0]-b.cx)*Math.pow(Math.abs((J[0]-b.cx)/b.rx),b.n/2), fy=sgn(J[1]-b.cy)*Math.pow(Math.abs((J[1]-b.cy)/b.ry),b.n/2);
        let fJ=Math.atan2(fx,fy); if(fJ<0) fJ+=Math.PI*2;
        const bi=fJ/(Math.PI*2)*OUT_M, i0=Math.min(OUT_M-1,Math.floor(bi)); sBJ=Bc[i0]+(Bc[i0+1]-Bc[i0])*(bi-i0);
        const a=Math.max(0.005,Math.min(FILLET_R,0.75*(sJ-s0))), bm=Math.max(0.005,Math.min(FILLET_R*1.2,0.8*Math.max(0,sEq-sBJ)));
        const A=atArc(Hp,Hc,sJ-a), Bq=atArc(Bp,Bc,sBJ+bm);
        const part1=polyPart(Hp,Hc,s0,sJ-a,Math.max(2,Math.round((sJ-a-s0)/0.04))), fil=[];
        for(let k=1;k<=10;k++){ const t=k/10; fil.push([(1-t)*(1-t)*A[0]+2*t*(1-t)*J[0]+t*t*Bq[0], (1-t)*(1-t)*A[1]+2*t*(1-t)*J[1]+t*t*Bq[1]]); }
        eqS=Math.max(sEq,sBJ+bm+0.02);
        const part3=polyPart(Bp,Bc,sBJ+bm,eqS,Math.max(2,Math.round((eqS-sBJ-bm)/0.04)));
        U=part1.concat(fil,part3.slice(1));
      } else U=polyPart(Bp,Bc,0,sEq,Math.round(sEq/0.04));
      const Ur=resample(U,SKIN_NU), Lr=resample(polyPart(Bp,Bc,eqS,sBot,120),SKIN_NL), R=Ur.concat(Lr.slice(1));
      const p=[0]; for(let i=1;i<R.length;i++) p.push(p[i-1]+Math.hypot(R[i][0]-R[i-1][0],R[i][1]-R[i-1][1]));
      const Lh=s0+p[p.length-1], skin=R.slice(), u=[], nR=R.length;
      for(let i=0;i<nR;i++) u.push((s0+p[i])/(2*Lh));
      for(let i=nR-2;i>=0;i--){ skin.push(mirror(R[i])); u.push(1-(s0+p[i])/(2*Lh)); }
      return {z,h,b,hump,win,sS,Hp,Hc,Bp,Bc,sBJ,skin,u};
    }
    // glass line across the roof between the two sills, lifted off the skin (degenerate point at the tips)
    function glassLine(st,lift,N){
      const o=[]; for(let i=0;i<=N;i++){ const s=-st.sS+2*st.sS*i/N, q=s<0?mirror(atArc(st.Hp,st.Hc,-s)):atArc(st.Hp,st.Hc,s); const nm=humpNormal(st.h,q[0],q[1]); o.push([q[0]+nm[0]*lift,q[1]+nm[1]*lift]); }
      return o;
    }
    // ---- build the single body mesh (radome base -> tail), the glass strip, floor, frames, sill bead and airbrake outline
    const stZ=[8.45,8.30,8.20]; for(let i=0;8.1-0.1*i>=-3.5-1e-9;i++) stZ.push(+(8.1-0.1*i).toFixed(4));
    for(let z=-3.75;z>-8.6+1e-9;z-=0.25) stZ.push(+z.toFixed(4)); stZ.push(-8.6);
    const ST=stZ.map(station), RING=ST[0].skin.length;
    const fuselage=(()=>{
      const pos=[],uv=[],idx=[];
      ST.forEach(st=>{ for(let k=0;k<RING;k++){ pos.push(st.skin[k][0],st.skin[k][1],st.z); uv.push(st.u[k],st.z*0.125); } });
      for(let r=0;r<ST.length-1;r++) for(let c=0;c<RING-1;c++){ const a=r*RING+c,b=a+1,cc=a+RING,d=cc+1; idx.push(a,cc,b, b,cc,d); }
      const g=new THREE.BufferGeometry();
      g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
      g.setIndex(idx); g.computeVertexNormals();
      const nr=g.attributes.normal.array;
      ST.forEach((st,r)=>{ if(st.win) return; const i0=r*RING*3, i1=(r*RING+RING-1)*3;        // closed ring: share the seam normal
        const x=nr[i0]+nr[i1], y=nr[i0+1]+nr[i1+1], zz=nr[i0+2]+nr[i1+2], l=Math.hypot(x,y,zz)||1; nr[i0]=nr[i1]=x/l; nr[i0+1]=nr[i1+1]=y/l; nr[i0+2]=nr[i1+2]=zz/l; });
      const m=new THREE.Mesh(g,skinLoft); m.castShadow=true; m.receiveShadow=true; m.userData.S=FS; plane.add(m); return m;
    })();
    markArmor(fuselage,6,'fuselage');
    // glass: same hump surface, a hair proud of it, closing to a point at the windscreen tip and at the rear tip
    const glassSt=ST.filter(st=>st.z<=GLASS_FRONT+1e-6 && st.z>=GLASS_REAR-1e-6);
    const canopy=(()=>{
      const pos=[],idx=[],cols=GLASS_N+1;
      glassSt.forEach(st=>{ const L=st.win?glassLine(st,GLASS_LIFT,GLASS_N):Array.from({length:cols},()=>[0,st.h.T+GLASS_LIFT]); L.forEach(q=>pos.push(q[0],q[1],st.z)); });
      for(let r=0;r<glassSt.length-1;r++) for(let c=0;c<GLASS_N;c++){ const a=r*cols+c,b=a+1,cc=a+cols,d=cc+1; idx.push(a,cc,b, b,cc,d); }
      const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals();
      const m=new THREE.Mesh(g,glassMat); m.castShadow=false; m.renderOrder=2; plane.add(m);
      m.userData.S=glassSt.map(st=>({z:st.z,cx:0,cy:st.h.cy,rx:st.h.rx+GLASS_LIFT,ry:st.h.ry+GLASS_LIFT,n:HUMP_N}));   // su30-cockpit.js reads this through canopyAt()
      return m;
    })();
    // cockpit floor under the glass: a flat plane just under the glass edge, tilted along the same straight line, so you never look down into a hollow fuselage
    { const fl=glassSt.filter(st=>st.win), pos=[],idx=[],cols=14, flMat=new THREE.MeshStandardMaterial({color:0x5b656d,roughness:0.85,metalness:0.1,side:DS});
      fl.forEach(st=>{ const h=st.h, yF=sillY(st.z)-0.02, xw=h.rx*Math.pow(Math.max(0,1-Math.pow(Math.abs((yF-h.cy)/h.ry),h.n)),1/h.n)*0.985; for(let i=0;i<=cols;i++) pos.push(-xw+2*xw*i/cols,yF,st.z); });   // flat floor on the same straight, inclined line as the glass edge
      for(let r=0;r<fl.length-1;r++) for(let c=0;c<cols;c++){ const a=r*(cols+1)+c,b=a+1,cc=a+cols+1,d=cc+1; idx.push(a,cc,b, b,cc,d); }
      const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals();
      const m=new THREE.Mesh(g,flMat); m.castShadow=false; plane.add(m); }
    // flat frame bands across the glass (no round hoops): windscreen bow, the two seat dividers, rear arch
    function frameBand(zc,w,lift){
      const K=26, pos=[], idx=[];
      [zc-w/2,zc+w/2].forEach(zq=>{ const st=station(zq); glassLine(st,GLASS_LIFT+lift,K).forEach(q=>pos.push(q[0],q[1],zq)); });
      for(let k=0;k<K;k++){ const a=k,b=k+1,cc=k+K+1,d=cc+1; idx.push(a,cc,b, b,cc,d); }
      const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals();
      const m=new THREE.Mesh(g,frameMat); m.castShadow=false; plane.add(m); return m;
    }
    frameBand(6.95,0.10,0.004); frameBand(5.12,0.06,0.004); frameBand(4.82,0.05,0.004); frameBand(2.97,0.08,0.004);
    // sill bead: one closed outline round the glass, down the left edge and back up the right
    { const L=[],R=[]; for(let z=GLASS_FRONT-0.06;z>=GLASS_REAR+0.06-1e-6;z-=0.05){ const st=station(z); if(st.sS<0.01) continue;
        const q=atArc(st.Hp,st.Hc,st.sS), nm=humpNormal(st.h,q[0],q[1]), o=GLASS_LIFT*0.5; L.push(V3(q[0]+nm[0]*o,q[1]+nm[1]*o,z)); R.push(V3(-q[0]-nm[0]*o,q[1]+nm[1]*o,z)); }
      const pts=L.concat(R.reverse());
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),pts.length*2,0.018,6,false),frameMat,plane,0,0,0).castShadow=false; }
    // dorsal airbrake panel behind the canopy: its outline (panel gaps) laid on the spine surface
    { const zA=1.55, zB=-0.35, hwA=0.34, hwB=0.28, line=pts=>mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),pts.length*3,0.007,5,false),darkMat,plane,0,0,0).castShadow=false;
      const edge=sd=>{ const o=[]; for(let k=0;k<=12;k++){ const z=zA+(zB-zA)*k/12, s=humpAt(z), x=sd*(hwA+(hwB-hwA)*k/12); o.push(V3(x,topY(s,x)+0.004,z)); } return o; };
      const cross=z=>{ const s=humpAt(z), hw=z===zA?hwA:hwB, o=[]; for(let k=0;k<=6;k++){ const x=-hw+2*hw*k/6; o.push(V3(x,topY(s,x)+0.004,z)); } return o; };
      line(edge(-1)); line(edge(1)); line(cross(zA)); line(cross(zB)); }
    const cockpitGroup=new THREE.Group(); plane.add(cockpitGroup);
    const crewMeshes=[];
    [[6.05,0.0],[4.55,0.12]].forEach(([cz,up],i)=>{
      crewMeshes.push(box(cockpitGroup,seatMat,0,0.62+up,cz-0.1,0.46,0.12,0.5));          // seat pan
      crewMeshes.push(box(cockpitGroup,seatMat,0,0.92+up,cz-0.34,0.44,0.72,0.1,-0.12));   // seat back
      crewMeshes.push(box(cockpitGroup,seatMat,0,1.20+up,cz-0.36,0.3,0.14,0.1));          // head box
      crewMeshes.push(box(cockpitGroup,suitMat,0,0.92+up,cz-0.12,0.34,0.44,0.2));         // torso
      crewMeshes.push(mesh(new THREE.SphereGeometry(0.125,14,10),helmMat,cockpitGroup,0,1.17+up,cz-0.06));
      crewMeshes.push(mesh(new THREE.SphereGeometry(0.105,12,8,0,Math.PI*2,0,Math.PI*0.55),visorMat,cockpitGroup,0,1.16+up,cz+0.02,0.25,0,0));
    });
    crewMeshes.forEach(m=>{ m.castShadow=false; });   // seated behind tinted glass and only ever small on screen - not worth a shadow-pass draw call each
    box(cockpitGroup,cockMat,0,0.68,6.85,0.52,0.2,0.16);      // front instrument coaming
    box(cockpitGroup,cockMat,0,0.74,5.40,0.46,0.16,0.12);     // rear instrument coaming
    mesh(new THREE.PlaneGeometry(0.32,0.2),hudMat,cockpitGroup,0,0.79,6.98,-0.5,0,0).castShadow=false;   // HUD combiner glass
    M('Pilot','crew',cockpitGroup,0,0.9,6.05,0.32);
    M('WSO','crew',cockpitGroup,0,1.0,4.55,0.32);
    M('Fuel','fuel',plane,0,-0.1,0,0.9);

    // All of these are small greebles that read fine shaded but add nothing to a shadow silhouette at this size,
    // so they're excluded from the shadow pass below - every one of them was previously an extra shadow draw call.
    mesh(new THREE.SphereGeometry(0.17,14,10),new THREE.MeshStandardMaterial({color:0x1b232a,roughness:0.12,metalness:0.8}),plane,0,0.66,8.26).castShadow=false;   // IRST (OLS) ball
    mesh(new THREE.CylinderGeometry(0.028,0.028,1.5,8),steelMat,plane,0,-0.42,11.74,Math.PI/2,0,0).castShadow=false;                    // pitot / air-data boom on the radome tip
    mesh(new THREE.ConeGeometry(0.028,0.14,8),steelMat,plane,0,-0.42,12.55,Math.PI/2,0,0).castShadow=false;
    mesh(new THREE.CylinderGeometry(0.032,0.032,1.5,8),steelMat,plane,0.52,0.62,8.2,Math.PI/2-0.05,0,0).castShadow=false;               // in-flight refuelling probe (port side)
    box(plane,skinBot,0.55,0.55,7.45,0.12,0.12,0.5).castShadow=false;
    box(plane,darkMat,0,roofT(-0.95)+0.10,-0.95,0.03,0.24,0.4).castShadow=false; box(plane,darkMat,0,roofT(-2.6)+0.08,-2.6,0.03,0.2,0.34).castShadow=false;          // blade antennas on the spine
    mesh(new THREE.SphereGeometry(0.05,8,6),redLightMat,plane,0,roofT(-1.1)+0.035,-1.1).castShadow=false;                                              // anti-collision beacon
    mesh(new THREE.SphereGeometry(0.05,8,6),whtLightMat,plane,0,-0.08,-10.6).castShadow=false;                                           // tail light

    // ======================= LANDING GEAR =======================
    // Reference (land-based Su-27/30 family, not the carrier Su-33): three-leg tricycle gear, each leg
    // a SINGLE wheel (a twin-wheel nose gear is a Su-33/carrier-only strengthening and doesn't belong on
    // the land-based SM); telescopic oleo-pneumatic shock struts with a scissor (torque) link pair
    // across the sliding joint to carry braking/steering loads without letting the wheel rotate loose;
    // a folding drag/retraction strut that also locks the leg rigid once down; a side brace for lateral
    // stays; and a prominent FOD deflector guard behind the nose wheel (the D-intakes sit low and close
    // behind it). All three legs retract forward - unchanged from before, still driven by gearPos via
    // pivot.rotation.x.
    //
    // Strut compression (the actual suspension) is layered on top of that hinge: each leg's lower piston
    // is its OWN object (pivot.userData.piston) whose local Y applyGearSuspension() animates between 0
    // (fully extended) and -maxTravel (fully compressed). Because the piston's rod mesh is a fixed length
    // sitting right below the fixed-length cylinder above it, sliding the piston group UP simply buries
    // more of the rod inside the cylinder - exactly how a real telescopic strut reads from outside, with
    // no geometry needing to resize.
    function buildLeg(parent,wheelR,strutLen,mainGear){
      const pivot=new THREE.Object3D(); parent.add(pivot);                                 // retraction hinge
      const cylLen=strutLen*0.54, pistonLen=strutLen-cylLen, maxTravel=pistonLen*0.5;
      box(pivot,steelMat,0,-cylLen*0.5,0,0.1,cylLen,0.1);                                  // upper strut cylinder (fixed, painted)
      box(pivot,steelMat,0,-cylLen*0.46,0.075,0.045,cylLen*0.64,0.045,0.24);                // drag/retraction strut
      box(pivot,steelMat,0,-cylLen*0.3,-0.075,0.035,cylLen*0.42,0.035,-0.16);                // side brace
      box(pivot,skinBot,mainGear?0.13:0,-strutLen*0.42,0,0.025,strutLen*0.66,0.46);         // gear-bay door, retracts with the leg

      // Piston: bare polished rod, telescopes into the cylinder above (see the compression note up top).
      const piston=new THREE.Object3D(); piston.position.set(0,-cylLen,0); pivot.add(piston);
      box(piston,oleoMat,0,-pistonLen*0.5,0,0.072,pistonLen,0.072);
      mesh(new THREE.CylinderGeometry(0.018,0.018,pistonLen*0.85,6),darkMat,piston,0.065,-pistonLen*0.47,0).castShadow=false;   // brake/hydraulic line

      // Scissor (torque) link: an upper arm hung from the cylinder and a lower arm rising from the
      // piston, meeting partway down - the classic zig-zag that stops the wheel rotating about the
      // strut axis while still letting it telescope. Each arm is a free pivot so applyGearSuspension can
      // nudge its fold angle with compression (a stylised approximation, not a solved 4-bar linkage, but
      // it reads right at this scale).
      const scU=new THREE.Object3D(); scU.position.set(0,-cylLen*0.94,0.095); pivot.add(scU);
      mesh(new THREE.CylinderGeometry(0.026,0.026,pistonLen*0.46,6),steelMat,scU,0,-pistonLen*0.23,0).castShadow=false;
      const scL=new THREE.Object3D(); scL.position.set(0,-pistonLen*0.16,0.095); piston.add(scL);
      mesh(new THREE.CylinderGeometry(0.024,0.024,pistonLen*0.46,6),steelMat,scL,0,-pistonLen*0.23,0).castShadow=false;

      const wheelMount=new THREE.Object3D(); wheelMount.position.set(0,-pistonLen,0); piston.add(wheelMount);
      box(wheelMount,steelMat,0,0.02,0.02,0.1,0.14,0.26,0.1);                               // axle fork
      mesh(new THREE.CylinderGeometry(wheelR,wheelR,mainGear?0.34:0.3,22),tireMat,wheelMount,0,0,0,0,0,Math.PI/2);
      mesh(new THREE.CylinderGeometry(wheelR*0.5,wheelR*0.5,mainGear?0.35:0.31,14),hubMat,wheelMount,0,0,0,0,0,Math.PI/2);
      if(mainGear) mesh(new THREE.CylinderGeometry(wheelR*0.62,wheelR*0.62,0.025,20),darkMat,wheelMount,0.18,0,0,0,0,Math.PI/2).castShadow=false;   // brake disc (nose wheel is unbraked)
      // Mudguard / FOD deflector, arced over the wheel's top-rear so the nose wheel can't throw debris
      // back into the intakes; the main gear gets a smaller version of the same guard.
      box(wheelMount,skinBot,mainGear?-wheelR*0.1:0,wheelR*0.85,mainGear?-wheelR*0.5:-wheelR*0.6,wheelR*1.9,0.03,wheelR*(mainGear?1.1:1.7),mainGear?0.5:0.55).castShadow=false;

      pivot.userData={piston,maxTravel,wheelMount,scU,scL,cylLen,pistonLen};
      return pivot;
    }
    const noseGearMount=new THREE.Object3D(); noseGearMount.position.set(0,-0.30,7.4); plane.add(noseGearMount);
    const noseGear=buildLeg(noseGearMount,0.27,1.76,false);
    const leftGearMount=new THREE.Object3D(); leftGearMount.position.set(-1.35,-0.44,0.1); plane.add(leftGearMount);
    const rightGearMount=new THREE.Object3D(); rightGearMount.position.set(1.35,-0.44,0.1); plane.add(rightGearMount);
    const leftGear=buildLeg(leftGearMount,0.33,1.55,true), rightGear=buildLeg(rightGearMount,0.33,1.55,true);
    const gearLegs=[noseGear,leftGear,rightGear];
    // Landing/taxi light pair, bracket-mounted low on the fixed cylinder (not the sliding piston - a
    // real light's wiring couldn't take riding the oleo stroke), matching the twin-light cluster real
    // Flanker nose gear carries.
    const noseCylLen=noseGear.userData.cylLen;
    mesh(new THREE.SphereGeometry(0.042,8,6),whtLightMat,noseGear,0.085,-noseCylLen*0.88,0.15).castShadow=false;
    mesh(new THREE.SphereGeometry(0.036,8,6),whtLightMat,noseGear,-0.085,-noseCylLen*0.8,0.16).castShadow=false;

    const exhaustPoints=[-1,1].map(sd=>{ const o=new THREE.Object3D(); o.position.set(sd*1.15,-0.76,-8.6); plane.add(o); return o; });

    // New front-seat cockpit component. Its root is shown only in cockpit view;
    // the original cockpit group remains available for the external/chase view.
    let su30Cockpit = null;
    if (typeof window.buildSu30Cockpit === 'function') {
      try {
        su30Cockpit = window.buildSu30Cockpit(THREE, plane, {
          canopyAt: z => sectionAtZ(canopy.userData.S, z),
          glassMat,
        });
        if (su30Cockpit && su30Cockpit.root) su30Cockpit.root.visible = false;
      } catch (err) {
        console.error('[Su-30 cockpit] Could not build the new cockpit; using the legacy interior.', err);
      }
    } else {
      console.warn('[Su-30 cockpit] su30-cockpit.js was not loaded; using the legacy interior.');
    }

    plane.traverse(o=>{ if(o.isMesh){ o.castShadow=o.castShadow!==false; o.receiveShadow=true; } });
    // Interior meshes do not need to cast or receive shadows; avoid extra shadow-pass work.
    if (su30Cockpit && su30Cockpit.root) su30Cockpit.root.traverse(o=>{
      if(o.isMesh){ o.castShadow=false; o.receiveShadow=false; }
    });

    return {
      kind:'su30sm', isAircraft:true, dirtBase:{value:0}, modules, group:plane,
      // Dummy tank-shaped fields so generic code that reads these on ANY vehicle (bot targeting,
      // shot-result panel, HUD glyph rotation, etc.) has something sane to read instead of crashing.
      turretPivot:cockpitGroup, gunTraversePivot:null, barrel:null, barrelPitchPivot:cockpitGroup,
      gunSlide:null, baseBarrelZ:0, recoil:0, recoilVelocity:0, muzzleFlash:null, muzzleLight:null, flashRemaining:0,
      armorMeshes, updateTracks:()=>{}, trackGauge:1.35, exhaustPoints,
      wheelPositions:[], trackY:0, config:null, hullTurnVelocity:0, addOnPanels:[], blowOffPanels:[],
      // Aircraft-only state, used by updatePlaneFlight()/updatePlaneCamera()
      throttle:0, airspeed:0, velocity:new THREE.Vector3(), stickX:0, stickY:0,
      gearDeployed:true, gearPos:1, cockpitView:false, nacellePivots, gearLegs,
      noseGearZ:7.4, mainGearZ:0.1, mainGearX:1.35,
      // Cockpit API returned by su30-cockpit.js, plus the original interior group.
      cockpit:su30Cockpit, legacyCockpitGroup:cockpitGroup,
      surf, crewMeshes
    };
  }

  const player = buildTank(config.bodyColor, config.turretColor, tankId);
  player.config = config; // Assign config for suspension system
  
  // Initialize shell selection for tanks with multiple shell types
  if(config.shells){
    config.shell = config.shells[0]; // Start with first shell
    player.currentShellIndex = 0;
    player.availableShells = config.shells;
    // Show shell type HUD
    const shellTypeEl = document.getElementById('shellType');
    if(shellTypeEl){
      shellTypeEl.textContent = config.shells[0].name;
      shellTypeEl.style.display = 'block';
    }
  }
  
  scene.add(player.group);

  // ---------- Exhaust smoke ----------
  // A small soft round sprite, reused as the texture for every smoke puff.
  const smokeCanvas = document.createElement('canvas');
  smokeCanvas.width = smokeCanvas.height = 64;
  const smokeCtx = smokeCanvas.getContext('2d');
  const smokeGrad = smokeCtx.createRadialGradient(32,32,0,32,32,32);
  smokeGrad.addColorStop(0,'rgba(210,205,195,0.55)');
  smokeGrad.addColorStop(1,'rgba(210,205,195,0)');
  smokeCtx.fillStyle = smokeGrad;
  smokeCtx.fillRect(0,0,64,64);
  const smokeTex = new THREE.CanvasTexture(smokeCanvas);
  const smokeParticles = [];
  const MAX_SMOKE = 90;
  for(let i=0;i<MAX_SMOKE;i++){
    const mat = new THREE.SpriteMaterial({map:smokeTex, transparent:true, opacity:0, depthWrite:false});
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(0.01,0.01,1);
    scene.add(sprite);
    smokeParticles.push({sprite, life:0, maxLife:0, vel:new THREE.Vector3(), active:false});
  }
  
  // Spark particles (bright yellow/orange)
  const sparkCanvas = document.createElement('canvas');
  sparkCanvas.width = sparkCanvas.height = 32;
  const sparkCtx = sparkCanvas.getContext('2d');
  const sparkGrad = sparkCtx.createRadialGradient(16,16,0,16,16,16);
  sparkGrad.addColorStop(0,'rgba(255,220,100,1)');
  sparkGrad.addColorStop(0.4,'rgba(255,160,60,0.9)');
  sparkGrad.addColorStop(1,'rgba(255,100,30,0)');
  sparkCtx.fillStyle = sparkGrad;
  sparkCtx.fillRect(0,0,32,32);
  const sparkTex = new THREE.CanvasTexture(sparkCanvas);
  const sparkParticles = [];
  const MAX_SPARKS = 260;
  for(let i=0;i<MAX_SPARKS;i++){
    const mat = new THREE.SpriteMaterial({map:sparkTex, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending, fog:false, toneMapped:false});
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(0.01,0.01,1);
    scene.add(sprite);
    sparkParticles.push({sprite, life:0, maxLife:0, vel:new THREE.Vector3(), active:false, gravity:true});
  }
  let smokeSpawnTimer = 0;
  function spawnSmokePuff(worldPos){
    const p = smokeParticles.find(p=>!p.active) || smokeParticles[0];
    p.active = true;
    p.life = 0;
    p.maxLife = 1.6 + Math.random()*0.8;
    p.sprite.position.copy(worldPos);
    p.sprite.position.x += (Math.random()-0.5)*0.06;
    p.sprite.position.z += (Math.random()-0.5)*0.06;
    p.vel.set((Math.random()-0.5)*0.35, 0.9+Math.random()*0.4, (Math.random()-0.5)*0.35);
    p.sprite.scale.set(0.12,0.12,1);
    p.sprite.material.opacity = 0.45;
  }
  function spawnMuzzleSmoke(worldPos,direction){
    const p=smokeParticles.find(p=>!p.active) || smokeParticles[0];
    p.active=true;p.life=0;p.maxLife=0.65+Math.random()*0.25;
    p.sprite.position.copy(worldPos);
    p.vel.copy(direction).multiplyScalar(1.2).add(new THREE.Vector3((Math.random()-0.5)*0.3,0.2,(Math.random()-0.5)*0.3));
    p.sprite.scale.set(0.22,0.22,1);p.sprite.material.opacity=0.42;
  }
  // Muzzle blast / recoil reaction acts through the hull's spring suspension: the nose lifts, the whole
  // tank is pressed down, and any sideways turret angle rocks it onto one track. The springs then
  // wobble it back to rest. Reaction direction is opposite to where the turret points.
  function kickHullFromGun(tank,k=1){
    const s=tank.suspension;
    if(!s) return;
    const a=tank.turretPivot.rotation.y;
    s.vpitch-=0.75*k*Math.cos(a);   // negative pitch = nose up
    s.vroll+=0.55*k*Math.sin(a);    // + = +x side up (hull pushed away from the gun's side)
    s.vy-=0.9*k;                    // sudden downward shove, the springs rebound it
  }
  function triggerGunEffect(tank,tankId,dir){
    tank.recoilVelocity-=tankId==='tiger'?10:tankId==='sturer'?18:tankId==='is7'?14:tankId==='fv4005'?12:tankId==='t54e1'?5:tankId==='amx50'?7:tankId==='leopard1a5'?5.5:tankId==='m1abrams'?5.8:tankId==='t72b'?6.2:tankId==='challenger1'?6.6:tankId==='k1'?5.4:6.3;
    if(tankId==='fv4005') kickHullFromGun(tank); // the 183 mm shoves the whole 50-ton hull
    else if(tankId==='t54e1') kickHullFromGun(tank,0.4); // the 105 mm rocks the sprung hull, but far less
    else if(tankId==='m1abrams') kickHullFromGun(tank,0.34); // 105 mm on a heavy 54-ton hull
    else if(tankId==='t72b') kickHullFromGun(tank,0.45); // 125 mm on a 46-ton hull
    else if(tankId==='leopard1a5') kickHullFromGun(tank,0.38); // the 105 mm on a light 40-ton hull
    else if(tankId==='amx50') kickHullFromGun(tank,0.55); // the 120 mm on a 58-ton hull
    else if(tankId==='challenger1') kickHullFromGun(tank,0.42); // the 120 mm on a heavy 62-ton hull
    else if(tankId==='k1') kickHullFromGun(tank,0.37); // the 105 mm on a 51-ton hull
    // The Emil's 128 mm round gives the whole 35-ton hull a short backward
    // shove as the gun recoils. Feed it into the existing drive momentum so
    // terrain, tracks and steering all respond naturally.
    if(tank===player && tankId==='sturer') speed=Math.max(MAX_REV,speed-1.0);
    if(tank===player && tankId==='fv4005') speed=Math.max(MAX_REV,speed-0.9);
    else if(tank!==player && tankId==='fv4005') tank.driveSpeed=(tank.driveSpeed||0)-0.9;
    tank.flashRemaining=0.12;
    tank.muzzleFlash.visible=true;
    tank.muzzleLight.intensity=16;
    const tip=muzzlePosition(tank,tankId);
    spawnMuzzleSmoke(tip,dir);
    fxMuzzle(tank,tip,dir);
    playShotSound(tankId,tank);
    if(tank===player){
      const kick=tankId==='fv4005'?0.085:tankId==='sturer'?0.075:tankId==='tiger'?0.035:tankId==='is7'?0.045:0.024;
      cameraKick=Math.max(cameraKick,kick);
      camTrauma=Math.min(1,camTrauma+kick*6);
    }
  }
  function updateGunRecoil(tank,dt){
    const recoilStiffness=tank.kind==='sturer'?42:tank.kind==='fv4005'?52:65;
    const recoilDamping=tank.kind==='sturer'?10:tank.kind==='fv4005'?10:13;
    tank.recoilVelocity+=(-tank.recoil*recoilStiffness-tank.recoilVelocity*recoilDamping)*dt;
    tank.recoil+=tank.recoilVelocity*dt;
    if(Math.abs(tank.recoil)<0.001 && Math.abs(tank.recoilVelocity)<0.01){tank.recoil=0;tank.recoilVelocity=0;}
    if(tank.gunSlide) tank.gunSlide.position.z=tank.recoil;   // oscillating turret: only the gun recoils, not the turret
    else tank.barrelPitchPivot.position.z=tank.baseBarrelZ+tank.recoil;
    tank.flashRemaining=Math.max(0,tank.flashRemaining-dt);
    tank.muzzleFlash.visible=tank.flashRemaining>0;
    tank.muzzleLight.intensity=tank.flashRemaining>0?16*(tank.flashRemaining/0.12):0;
  }
  function updateSmoke(dt){
    smokeSpawnTimer -= dt;
    if(smokeSpawnTimer <= 0){
      smokeSpawnTimer = 0.09;
      player.exhaustPoints.forEach(mouth=>{
        const worldPos = new THREE.Vector3();
        mouth.getWorldPosition(worldPos);
        spawnSmokePuff(worldPos);
      });
    }
    smokeParticles.forEach(p=>{
      if(!p.active) return;
      p.life += dt;
      if(p.life >= p.maxLife){ p.active = false; p.sprite.material.opacity = 0; return; }
      const t = p.life / p.maxLife;
      p.sprite.position.addScaledVector(p.vel, dt);
      p.vel.y += dt*0.15; // smoke accelerates upward slightly as it thins out
      const scale = 0.12 + t*0.55;
      p.sprite.scale.set(scale, scale, 1);
      p.sprite.material.opacity = 0.45 * (1 - t);
    });
    
    // Update spark particles
    sparkParticles.forEach(p=>{
      if(!p.active) return;
      p.life += dt;
      if(p.life >= p.maxLife){ p.active = false; p.sprite.material.opacity = 0; return; }
      const t = p.life / p.maxLife;
      if(p.gravity) p.vel.y -= GRAVITY_WORLD * dt * 0.5; // Sparks fall
      p.sprite.position.addScaledVector(p.vel, dt);
      p.sprite.material.opacity = Math.max(0, 1 - t*1.5);
      // Sparks shrink as they fade
      const scale = p.sprite.scale.x * (1 - dt*2);
      p.sprite.scale.set(scale, scale, 1);
    });
  }

  // ---------- Damage Effects ----------
  function spawnArmorSparks(worldPos, normal){
    playArmorHitSound();
    fxArmorHit(worldPos, normal);
    // Non-penetration hit - spawn bright sparks flying off the armor
    for(let i=0; i<10; i++){
      const p = sparkParticles.find(p=>!p.active);
      if(p){
        p.active = true;
        p.life = 0;
        p.maxLife = 0.4 + Math.random()*0.3;
        p.sprite.position.copy(worldPos);
        p.sprite.position.x += (Math.random()-0.5)*0.1;
        p.sprite.position.z += (Math.random()-0.5)*0.1;
        const spread = new THREE.Vector3(
          (Math.random()-0.5)*1.2,
          Math.random()*1.0 + 0.3,
          (Math.random()-0.5)*1.2
        ).add(normal.clone().multiplyScalar(0.8));
        p.vel.copy(spread).multiplyScalar(2.5 + Math.random()*2);
        p.sprite.scale.set(0.12, 0.12, 1);
        p.sprite.material.opacity = 1.0;
        p.gravity = true;
      }
    }
    // Also add some smoke
    spawnSmokePuff(worldPos);
  }

  function spawnRicochetSparks(worldPos, bounceDir, normal){
    playRicochetSound();
    fxRicochet(worldPos, bounceDir, normal);
    // Ricochet - bright sparks along the ricochet direction
    for(let i=0; i<15; i++){
      const p = sparkParticles.find(p=>!p.active);
      if(p){
        p.active = true;
        p.life = 0;
        p.maxLife = 0.5 + Math.random()*0.3;
        p.sprite.position.copy(worldPos);
        const spread = bounceDir.clone().add(new THREE.Vector3(
          (Math.random()-0.5)*0.6,
          (Math.random()-0.5)*0.6,
          (Math.random()-0.5)*0.6
        ));
        p.vel.copy(spread).multiplyScalar(4 + Math.random()*4);
        p.sprite.scale.set(0.14, 0.14, 1);
        p.sprite.material.opacity = 1.0;
        p.gravity = true;
      }
    }
    // Smoke trail
    for(let i=0; i<3; i++){
      setTimeout(()=>spawnSmokePuff(worldPos), i*50);
    }
  }

  function spawnPenetrationEffect(entryPoint, detonationPoint, dir){
    playPenetrationSound();
    // Penetration - a sharp internal burst plus smoke at entry and detonation.
    spawnSmokePuff(entryPoint);
    for(let i=0;i<10;i++){
      const p=sparkParticles.find(p=>!p.active);
      if(!p)break;
      p.active=true;p.life=0;p.maxLife=0.2+Math.random()*0.18;
      p.sprite.position.copy(entryPoint);
      p.vel.copy(dir).multiplyScalar(3+Math.random()*3).add(new THREE.Vector3((Math.random()-0.5)*2,(Math.random()-0.5)*2,(Math.random()-0.5)*2));
      p.sprite.scale.set(0.1,0.1,1);p.sprite.material.opacity=1;p.gravity=true;
    }
    for(let i=0; i<3; i++){
      const p = smokeParticles.find(p=>!p.active) || smokeParticles[0];
      if(!p.active){
        p.active = true;
        p.life = 0;
        p.maxLife = 1.2 + Math.random()*0.6;
        p.sprite.position.copy(detonationPoint);
        p.sprite.position.x += (Math.random()-0.5)*0.3;
        p.sprite.position.z += (Math.random()-0.5)*0.3;
        p.vel.set((Math.random()-0.5)*0.5, 0.6+Math.random()*0.4, (Math.random()-0.5)*0.5);
        p.sprite.scale.set(0.15, 0.15, 1);
        p.sprite.material.opacity = 0.5;
      }
    }
  }

  function spawnAmmoExplosion(worldPos, target){
    playExplosionSound();
    // The full fireball, turret launch and debris play from fxTankDestroyed() once the tank is destroyed.
    target.ammoBlown = true;
    target.burnTime = 20;
  }

  // ---------- Combat effects: impacts, explosions, fire, smoke, wrecks ----------
  // Every effect uses small pools that are created once, so a long fight never allocates
  // new meshes. Sprite pools handle smoke/fire/dust, a mesh pool handles flying debris.
  const fxV=new THREE.Vector3(), fxV2=new THREE.Vector3(), fxWind=new THREE.Vector3(0.7,0,0.25);
  const fxRand=(a,b)=>a+Math.random()*(b-a);
  function fxMakeTexture(draw){
    const c=document.createElement('canvas'); c.width=c.height=128;
    draw(c.getContext('2d')); return new THREE.CanvasTexture(c);
  }
  // Puffy smoke: a cluster of soft blobs, faded out toward the edge so it never shows a square.
  const fxSmokeTex=fxMakeTexture(g=>{
    for(let i=0;i<18;i++){
      const x=64+fxRand(-22,22), y=64+fxRand(-22,22), r=fxRand(22,42);
      const gr=g.createRadialGradient(x,y,0,x,y,r);
      gr.addColorStop(0,'rgba(255,255,255,0.62)'); gr.addColorStop(1,'rgba(255,255,255,0)');
      g.fillStyle=gr; g.fillRect(0,0,128,128);
    }
    g.globalCompositeOperation='destination-in';
    const m=g.createRadialGradient(64,64,6,64,64,64);
    m.addColorStop(0,'rgba(0,0,0,1)'); m.addColorStop(0.7,'rgba(0,0,0,0.8)'); m.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=m; g.fillRect(0,0,128,128);
  });
  // Wispy vapor: unlike fxSmokeTex above, this has NO final circular destination-in mask - each blob just fades
  // to 0 on its own at a random offset/radius, so the overall silhouette is ragged and irregular rather than a
  // clean disc. Real condensation never has a hard round edge, and a single big sprite with a circular alpha
  // mask reads as "a circle" the moment there aren't many overlapping to hide the boundary.
  const fxVaporTex=fxMakeTexture(g=>{
    for(let i=0;i<16;i++){
      const x=64+fxRand(-26,26), y=64+fxRand(-26,26), r=fxRand(20,38);
      const gr=g.createRadialGradient(x,y,0,x,y,r);
      gr.addColorStop(0,'rgba(255,255,255,0.8)'); gr.addColorStop(0.5,'rgba(255,255,255,0.4)'); gr.addColorStop(1,'rgba(255,255,255,0)');
      g.fillStyle=gr; g.fillRect(0,0,128,128);
    }
  });
  const fxFireTex=fxMakeTexture(g=>{
    const gr=g.createRadialGradient(64,64,0,64,64,64);
    gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(0.25,'rgba(255,235,170,0.95)');
    gr.addColorStop(0.55,'rgba(255,140,40,0.55)'); gr.addColorStop(1,'rgba(255,60,10,0)');
    g.fillStyle=gr; g.fillRect(0,0,128,128);
  });
  function fxMakePool(count,tex,additive){
    const list=[];
    for(let i=0;i<count;i++){
      const mat=new THREE.SpriteMaterial({map:tex,transparent:true,opacity:0,depthWrite:false,
        blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,fog:!additive,toneMapped:!additive});
      const sp=new THREE.Sprite(mat); sp.visible=false; sp.scale.set(0.01,0.01,1); sp.renderOrder=2; scene.add(sp);
      list.push({sp,mat,active:false,life:0,max:1,vel:new THREE.Vector3(),drag:0,buoy:0,grav:0,s0:1,s1:1,o0:1,
        c0:new THREE.Color(),c1:new THREE.Color(),spin:0,fade:0.1,wind:0});
    }
    return {list,next:0,additive:!!additive};
  }
  // Star flash: hot white core with long thin rays. Used for muzzle blasts and shell hits so the exact
  // moment and place of every shot reads instantly, even in busy scenes.
  const fxStarTex=fxMakeTexture(g=>{
    g.translate(64,64);
    const glow=g.createRadialGradient(0,0,0,0,0,40);
    glow.addColorStop(0,'rgba(255,255,255,1)'); glow.addColorStop(0.3,'rgba(255,240,200,0.55)'); glow.addColorStop(1,'rgba(255,200,120,0)');
    g.fillStyle=glow; g.fillRect(-64,-64,128,128);
    g.globalCompositeOperation='lighter';
    for(let i=0;i<8;i++){
      g.save(); g.rotate(i*Math.PI/4);
      const len=i%2===0?62:38, w=i%2===0?5:3, gr=g.createLinearGradient(0,0,len,0);
      gr.addColorStop(0,'rgba(255,250,225,0.95)'); gr.addColorStop(1,'rgba(255,200,120,0)');
      g.fillStyle=gr; g.beginPath(); g.moveTo(0,-w); g.lineTo(len,0); g.lineTo(0,w); g.closePath(); g.fill(); g.restore();
    }
  });
  const fxSmoke=fxMakePool(520,fxSmokeTex,false);
  const fxVapor=fxMakePool(220,fxVaporTex,false);   // Short-lived wing-condensation puffs; separate from ground smoke/dust.
  const fxFire=fxMakePool(160,fxFireTex,true);
  const fxStar=fxMakePool(60,fxStarTex,true);
  function fxEmit(pool,pos,vel,o){
    let p=null;
    for(let k=0;k<pool.list.length;k++){
      const c=pool.list[(pool.next+k)%pool.list.length];
      if(!c.active){p=c;pool.next=(pool.next+k+1)%pool.list.length;break;}
    }
    if(!p){p=pool.list[pool.next];pool.next=(pool.next+1)%pool.list.length;} // recycle the oldest
    p.active=true; p.life=0; p.max=o.life; p.sp.position.copy(pos); p.vel.copy(vel);
    p.drag=o.drag||0; p.buoy=o.buoy||0; p.grav=o.grav||0; p.wind=o.wind||0;
    p.s0=o.s0; p.s1=o.s1; p.o0=o.o; p.c0.set(o.c0); p.c1.set(o.c1!==undefined?o.c1:o.c0); if(!pool.additive){ const sh=TOD.unlit; p.c0.multiplyScalar(sh); p.c1.multiplyScalar(sh); if(todKey==='sunset'){ p.c0.r*=1.1; p.c0.b*=0.93; p.c1.r*=1.06; p.c1.b*=0.95; } else if(todKey==='night'){ p.c0.b*=1.5; p.c1.b*=1.5; } }
    p.mat.color.copy(p.c0); p.mat.rotation=Math.random()*6.283; p.spin=(Math.random()-0.5)*(o.spin||1.2);
    p.fade=o.fade||0.1; p.sp.scale.set(o.s0,o.s0,1); p.mat.opacity=0; p.sp.visible=true;
    return p;
  }
  function fxUpdatePool(pool,dt){
    for(const p of pool.list){
      if(!p.active) continue;
      p.life+=dt;
      if(p.life>=p.max){p.active=false;p.sp.visible=false;p.mat.opacity=0;continue;}
      const t=p.life/p.max;
      p.vel.multiplyScalar(Math.exp(-p.drag*dt));
      p.vel.y+=(p.buoy-p.grav)*dt;
      if(p.wind) p.vel.addScaledVector(fxWind,p.wind*dt);
      p.sp.position.addScaledVector(p.vel,dt);
      if(p.grav>0){
        const gy=terrainHeightAt(p.sp.position.x,p.sp.position.z);
        if(p.sp.position.y<gy+0.05){p.sp.position.y=gy+0.05;p.vel.set(0,0,0);p.grav=0;p.buoy=0;}
      }
      const e=1-(1-t)*(1-t); // ease-out growth: fast at first, then settles
      const s=p.s0+(p.s1-p.s0)*e;
      p.sp.scale.set(s,s,1);
      p.mat.color.copy(p.c0).lerp(p.c1,Math.min(1,t*1.3));
      p.mat.opacity=p.o0*Math.min(1,t/p.fade)*(1-t);
      p.mat.rotation+=p.spin*dt;
    }
  }
  // One shared point light lights up the surroundings for the instant of an explosion.
  const fxLight=new THREE.PointLight(0xff9a40,0,55,2); scene.add(fxLight);
  // Muzzle light pool. Per-tank point lights used to be toggled with the muzzle flash, which changed the number of
  // visible lights on every shot and made three recompile every lit shader (a lag spike whenever any tank fired).
  // Two lights now stay in the scene permanently (intensity 0 when idle) and are moved onto the brightest muzzle flashes.
  const muzzlePool=[0,1].map(()=>{ const l=new THREE.PointLight(0xffa13a,0,14,2); scene.add(l); return l; });
  const _mlPos=new THREE.Vector3(), _mlBest=[null,null], _mlVal=[0,0];
  function updateMuzzlePool(){
    _mlBest[0]=_mlBest[1]=null; _mlVal[0]=_mlVal[1]=0;
    const consider=t=>{
      if(!t||!t.muzzleLight||t.muzzleLight.intensity<=0.01) return;
      const d=t.group.position.distanceTo(camera.position), v=t.muzzleLight.intensity/(1+d*0.02);
      if(v>_mlVal[0]){ _mlBest[1]=_mlBest[0]; _mlVal[1]=_mlVal[0]; _mlBest[0]=t; _mlVal[0]=v; }
      else if(v>_mlVal[1]){ _mlBest[1]=t; _mlVal[1]=v; }
    };
    consider(player); for(const t of allies) consider(t); for(const t of enemies) consider(t);
    for(let i=0;i<2;i++){
      const t=_mlBest[i], l=muzzlePool[i];
      if(t){ t.muzzleFlash.getWorldPosition(_mlPos); l.position.copy(_mlPos); l.intensity=t.muzzleLight.intensity; }
      else l.intensity=0;
    }
  }
  const fxLightState={t:0,dur:0.01,peak:0};
  function fxFlashLight(pos,peak,dur){
    if(peak<fxLight.intensity) return;
    fxLight.position.copy(pos); fxLightState.t=0; fxLightState.dur=dur; fxLightState.peak=peak; fxLight.intensity=peak;
  }
  // Expanding ground shockwave rings.
  const fxRings=[];
  for(let i=0;i<4;i++){
    const m=new THREE.Mesh(new THREE.RingGeometry(0.88,1,48),new THREE.MeshBasicMaterial({color:0xffc277,transparent:true,opacity:0,
      depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
    m.rotation.x=-Math.PI/2; m.visible=false; scene.add(m);
    fxRings.push({m,active:false,t:0,dur:0.6,r1:10});
  }
  let fxRingNext=0;
  function fxShockwave(pos,radius,dur){
    const r=fxRings[fxRingNext]; fxRingNext=(fxRingNext+1)%fxRings.length;
    r.active=true; r.t=0; r.dur=dur; r.r1=radius; r.m.visible=true;
    r.m.position.set(pos.x,terrainHeightAt(pos.x,pos.z)+0.2,pos.z);
  }
  // Flying wreckage: chunks of hull plate that tumble, bounce and settle.
  const fxDebrisMats=[0x2b2926,0x4a4034,0x3a3d36].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:0.9,metalness:0.3,flatShading:true}));
  const fxDebris=[];
  for(let i=0;i<40;i++){
    const m=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),fxDebrisMats[i%3]); m.visible=false; m.castShadow=true; scene.add(m);
    fxDebris.push({m,active:false,vel:new THREE.Vector3(),spin:new THREE.Vector3(),life:0,max:8,burning:false,landed:false,size:0.3,acc:0});
  }
  let fxDebrisNext=0;
  function fxSpawnDebris(pos,count,power,burning){
    for(let i=0;i<count;i++){
      const d=fxDebris[fxDebrisNext]; fxDebrisNext=(fxDebrisNext+1)%fxDebris.length;
      const a=Math.random()*6.283, h=fxRand(2,7)*power;
      d.active=true; d.landed=false; d.life=0; d.max=fxRand(6,9); d.burning=burning&&Math.random()<0.6;
      d.size=fxRand(0.15,0.5)*(0.7+power*0.4);
      d.m.visible=true; d.m.position.copy(pos); d.m.position.x+=fxRand(-0.6,0.6); d.m.position.z+=fxRand(-0.6,0.6);
      d.m.scale.set(d.size*fxRand(0.6,1.8),d.size*fxRand(0.2,0.7),d.size*fxRand(0.6,1.8));
      d.m.rotation.set(Math.random()*6,Math.random()*6,Math.random()*6);
      d.vel.set(Math.cos(a)*h,fxRand(4,10)*power,Math.sin(a)*h);
      d.spin.set(fxRand(-9,9),fxRand(-9,9),fxRand(-9,9));
    }
  }
  function fxUpdateDebris(dt){
    updateFlyingPanels(dt);
    for(const d of fxDebris){
      if(!d.active) continue;
      d.life+=dt;
      if(d.life>=d.max){d.active=false;d.m.visible=false;continue;}
      if(!d.landed){
        d.vel.y-=GRAVITY_WORLD*1.7*dt;
        d.m.position.addScaledVector(d.vel,dt);
        d.m.rotation.x+=d.spin.x*dt; d.m.rotation.y+=d.spin.y*dt; d.m.rotation.z+=d.spin.z*dt;
        if(d.burning){
          d.acc+=dt*18; while(d.acc>=1){d.acc-=1;
            fxEmit(fxSmoke,d.m.position,fxV.set(0,0.5,0),{life:1.3,s0:0.3,s1:1.3,o:0.5,c0:0x2a2622,c1:0x55504a,buoy:0.5,drag:1});
          }
        }
        const gy=terrainHeightAt(d.m.position.x,d.m.position.z)+d.size*0.2;
        if(d.m.position.y<gy){
          d.m.position.y=gy;
          if(d.vel.y<-2.5){ // bounce, kicking up a little dust
            d.vel.y*=-0.3; d.vel.x*=0.55; d.vel.z*=0.55; d.spin.multiplyScalar(0.45);
            fxEmit(fxSmoke,d.m.position,fxV.set(0,0.8,0),{life:0.9,s0:0.3,s1:1.2,o:0.35,c0:fxDustColor(),drag:2});
          } else {d.landed=true;}
        }
      } else if(d.burning && d.life<d.max-2){
        d.acc+=dt*5; while(d.acc>=1){d.acc-=1;
          fxEmit(fxSmoke,d.m.position,fxV.set(0,0.6,0),{life:1.6,s0:0.25,s1:1.0,o:0.4,c0:0x2a2622,c1:0x55504a,buoy:0.4,drag:1,wind:0.5});
        }
      }
      const left=d.max-d.life; if(left<1) d.m.scale.multiplyScalar(Math.max(0.01,1-dt*2.5));
    }
  }
  // Dust is drawn unlit, so it uses the light, sun-struck tone (against dark grass it reads far better than the soil
  // colour); fxDustShade is the darker tone it settles to as it thins out.
  function fxDustColor(){ return town?0x9a8b6c:desert?0xb89a66:0x86755a; }
  function fxDustShade(){ return town?0x6d6049:desert?0x8a6e42:0x4f402c; }

  // Scorch marks and shell craters pressed onto the ground.
  const fxDecalGeo=new THREE.CircleGeometry(1,28); fxDecalGeo.rotateX(-Math.PI/2);
  const fxCraters=[]; let fxCraterNext=0;
  for(let i=0;i<28;i++){
    const m=new THREE.Mesh(fxDecalGeo,new THREE.MeshBasicMaterial({color:0x14110d,transparent:true,opacity:0,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}));
    m.visible=false; m.renderOrder=1; scene.add(m); fxCraters.push({m,t:0,peak:0.5});
  }
  function fxAddDecal(x,z,radius,opacity){
    const c=fxCraters[fxCraterNext]; fxCraterNext=(fxCraterNext+1)%fxCraters.length;
    c.m.position.set(x,terrainHeightAt(x,z)+0.07,z); c.m.scale.setScalar(radius);
    c.m.rotation.y=Math.random()*6.283; c.m.visible=true; c.t=0; c.peak=opacity; c.m.material.opacity=0;
  }

  function fxSparks(pos,dir,count,speed,spread,life){
    for(let i=0;i<count;i++){
      const p=sparkParticles.find(q=>!q.active); if(!p) break;
      p.active=true; p.life=0; p.maxLife=life*(0.6+Math.random()*0.7); p.gravity=true;
      p.sprite.position.copy(pos);
      p.vel.copy(dir).add(fxV.set(fxRand(-spread,spread),fxRand(-spread,spread),fxRand(-spread,spread))).normalize().multiplyScalar(speed*fxRand(0.5,1.2));
      p.sprite.scale.set(0.16,0.16,1); p.sprite.material.opacity=1;
    }
  }
  function fxFlash(pos,size,life){
    // Flashes grow a little with distance from the camera so far-off shots still show up.
    size*=1+Math.min(0.8,pos.distanceTo(camera.position)/120);
    life=life||0.12;
    fxEmit(fxFire,pos,fxV.set(0,0,0),{life,s0:size*0.6,s1:size,o:1,c0:0xfff4cf,c1:0xffb050,fade:0.02});
    fxEmit(fxStar,pos,fxV.set(0,0,0),{life:life*0.85,s0:size*1.1,s1:size*2.3,o:1,c0:0xffffff,c1:0xffcf80,fade:0.02,spin:0.4});
  }
  // Adds camera 'trauma' (see updateCamera): only nearby blasts count, and it fades within a fraction of a second.
  function fxShake(pos,strength){
    const d=pos.distanceTo(camera.position);
    camTrauma=Math.min(1,camTrauma+Math.min(1,strength*7)/(1+d*d/900));
  }

  // --- Shell impacts ---
  // Every impact type has its own look so the result of a shot is readable at a glance:
  //  ground  = tall tan dust column + low ring of dust + dirt chips,
  //  armour  = white star flash, dense sparks, grey puff (shell stopped),
  //  glance  = long bright spark streak along the bounce path.
  function fxTerrainImpact(pos,dir){
    const gp=fxV2.set(pos.x,terrainHeightAt(pos.x,pos.z)+0.1,pos.z).clone();
    const k=1+Math.min(1.4,gp.distanceTo(camera.position)/90); // bigger at range so it stays visible
    fxFlash(gp,1.6*k,0.1);
    for(let i=0;i<9;i++){ // rising dust column
      const h=i/8;
      fxEmit(fxSmoke,fxV2.copy(gp).setY(gp.y+h*1.2),fxV.set(fxRand(-0.8,0.8),fxRand(3,6.5)*(0.5+h*0.7),fxRand(-0.8,0.8)),
        {life:fxRand(1.3,2.1),s0:0.7*k,s1:fxRand(3.2,4.8)*k,o:0.8,c0:fxDustColor(),c1:fxDustShade(),drag:1.4,buoy:0.15,wind:0.5});
    }
    for(let i=0;i<10;i++){ // low ring of dust pushed outward
      const a=i/10*6.283+fxRand(-0.2,0.2);
      fxEmit(fxSmoke,gp,fxV.set(Math.cos(a)*fxRand(4,7),fxRand(0.2,0.8),Math.sin(a)*fxRand(4,7)),
        {life:fxRand(0.9,1.4),s0:0.8*k,s1:fxRand(2.4,3.4)*k,o:0.6,c0:fxDustColor(),c1:fxDustShade(),drag:3,wind:0.3});
    }
    for(let i=0;i<14;i++){ // dirt chips thrown up and back toward the shooter
      fxEmit(fxSmoke,gp,fxV.set(fxRand(-3,3)-dir.x*2,fxRand(3.5,8),fxRand(-3,3)-dir.z*2),
        {life:fxRand(0.7,1.2),s0:0.26,s1:0.12,o:0.95,c0:0x5a4630,c1:0x3a2f20,grav:11,fade:0.01});
    }
    fxSparks(gp,fxV2.set(0,1,0),6,6,0.8,0.45);
    fxShockwave(gp,2.4*k,0.3);
    fxFlashLight(gp,3.5,0.1);
    fxAddDecal(gp.x,gp.z,fxRand(0.9,1.5),0.5);
    fxShake(gp,0.012);
  }
  function fxArmorHit(pos,normal){
    fxFlash(pos,1.5,0.1);
    fxSparks(pos,normal,24,8,0.9,0.55);
    for(let i=0;i<4;i++){
      fxEmit(fxSmoke,pos,fxV.set(normal.x*1.6+fxRand(-0.6,0.6),normal.y*1.6+fxRand(0.2,1),normal.z*1.6+fxRand(-0.6,0.6)),
        {life:fxRand(0.8,1.3),s0:0.3,s1:1.5,o:0.5,c0:0xc9c4b8,c1:0x6f6b64,drag:1.5,buoy:0.3});
    }
    fxFlashLight(pos,2.5,0.08);
  }
  function fxRicochet(pos,bounce,normal){
    fxFlash(pos,1.1,0.08);
    fxSparks(pos,bounce,32,17,0.3,0.65); // a fast, bright streak of sparks along the bounce path
    fxSparks(pos,normal,8,4,0.8,0.35);
    for(let i=0;i<3;i++){
      fxEmit(fxSmoke,pos,fxV.set(bounce.x*2,bounce.y*2+0.4,bounce.z*2),{life:1.0,s0:0.25,s1:1.1,o:0.38,c0:0xd5d0c4,c1:0x77736b,drag:1.8});
    }
    fxFlashLight(pos,2,0.07);
  }
  function fxPenetration(entry,det,dir,target){
    // Bright spray back out of the hole, then a fireball and spall inside the hull.
    fxFlash(entry,1.8,0.1);
    fxSparks(entry,fxV2.copy(dir).negate(),14,7,0.7,0.45);
    fxFlash(det,4.0,0.16);
    for(let i=0;i<4;i++){
      fxEmit(fxFire,det,fxV.set(fxRand(-1.2,1.2),fxRand(0.8,2.4),fxRand(-1.2,1.2)),
        {life:fxRand(0.3,0.55),s0:0.9,s1:fxRand(1.8,2.6),o:0.95,c0:0xffe6a0,c1:0xc4310c,buoy:1.5,drag:1.2});
    }
    for(let i=0;i<5;i++){
      fxEmit(fxSmoke,det,fxV.set(fxRand(-1,1),fxRand(1.2,3),fxRand(-1,1)),
        {life:fxRand(1.6,2.6),s0:0.5,s1:fxRand(2,3.2),o:0.6,c0:0x2e2a26,c1:0x58534c,buoy:0.5,drag:0.8,wind:0.4});
    }
    fxSparks(det,fxV2.set(0,0.4,0),22,8,1.4,0.7); // red-hot spall
    fxFlashLight(det,7,0.2); fxShockwave(det,3.5,0.3);
    if(target){ target.smoulder=Math.max(target.smoulder||0,7); }
    fxShake(det,target===player?0.03:0.012);
  }

  // --- Tank explosions and wrecks ---
  function fxExplosion(pos,s){
    fxFlash(pos,7*s,0.2);
    fxFlashLight(pos,11*s,0.5);
    for(let i=0;i<10;i++){
      fxEmit(fxFire,pos,fxV.set(fxRand(-4,4)*s,fxRand(2,7)*s,fxRand(-4,4)*s),
        {life:fxRand(0.6,1.2),s0:1.4*s,s1:fxRand(3.5,5.5)*s,o:0.95,c0:0xffe8a8,c1:0xb02c0a,buoy:2,drag:1.6});
    }
    for(let i=0;i<24;i++){
      fxEmit(fxSmoke,pos,fxV.set(fxRand(-3,3)*s,fxRand(2,6)*s,fxRand(-3,3)*s),
        {life:fxRand(4.5,8),s0:2.0*s,s1:fxRand(7,11)*s,o:0.97,c0:0x080706,c1:0x2a2723,buoy:0.8,drag:0.9,wind:0.5});
    }
    fxSparks(pos,fxV2.set(0,1,0),32,12*s,1.6,1.0);
    fxShockwave(pos,9*s,0.55);
    for(let i=0;i<12;i++){ // dust ring pushed outward along the ground
      const a=i/12*6.283, gp=fxV2.set(pos.x,terrainHeightAt(pos.x,pos.z)+0.4,pos.z);
      fxEmit(fxSmoke,gp,fxV.set(Math.cos(a)*8*s,0.4,Math.sin(a)*8*s),
        {life:1.5,s0:1.2,s1:4.2*s,o:0.55,c0:fxDustColor(),drag:2.6});
    }
    fxShake(pos,0.11*s);
  }
  // Darken every surface so the hulk reads as burnt out.
  const fxCharColor=new THREE.Color(0x121110);
  function fxChar(tank){
    const seen=new Set();
    tank.group.traverse(o=>{
      if(!o.isMesh||!o.material||seen.has(o.material)) return;
      const m=o.material; seen.add(m);
      if(!m.isMeshStandardMaterial||m.transparent||!m.color) return;
      m.color.lerp(fxCharColor,0.78); m.roughness=1; m.metalness=0.05;
    });
  }
  function fxTankDestroyed(tank){
    tank.wrecked=true; tank.wreckAge=0;
    tank.group.updateMatrixWorld(true);
    const centre=tank.group.localToWorld(new THREE.Vector3(0,1.3,0));
    const sc=tank.group.scale.x||1;
    const ammo=!!tank.ammoBlown;
    fxExplosion(centre,(ammo?1.35:0.8)*Math.min(1.25,0.8+sc*0.25));
    if(!ammo) playExplosionSound();
    fxSpawnDebris(centre,ammo?18:8,ammo?1.3:0.7,true);
    fxChar(tank);
    fxAddDecal(tank.group.position.x,tank.group.position.z,3.4*sc,0.6);
    if(ammo){ // the turret is blown clean off its ring
      tank.turretFX={y:0,vy:fxRand(8,12),vx:fxRand(-1.2,1.2),vz:fxRand(-1.2,1.2),sx:fxRand(-1.6,1.6),sz:fxRand(-1.6,1.6),
        bounced:false,landed:false,baseY:tank.turretPivot.position.y,baseX:tank.turretPivot.position.x,baseZ:tank.turretPivot.position.z,ox:0,oz:0};
    }
  }
  function fxUpdateTurretPop(tank,dt){
    const f=tank.turretFX; if(!f||f.landed) return;
    f.vy-=GRAVITY_WORLD*1.3*dt; f.y+=f.vy*dt; f.ox+=f.vx*dt; f.oz+=f.vz*dt;
    tank.turretPivot.rotation.x+=f.sx*dt; tank.turretPivot.rotation.z+=f.sz*dt;
    if(f.y<=0&&f.vy<0){
      f.y=0;
      if(!f.bounced){f.bounced=true;f.vy=-f.vy*0.28;f.sx*=0.35;f.sz*=0.35;f.vx*=0.4;f.vz*=0.4;
        const wp=tank.turretPivot.getWorldPosition(new THREE.Vector3());
        fxShockwave(wp,3.5,0.35); fxShake(wp,0.05);
        for(let i=0;i<6;i++) fxEmit(fxSmoke,wp,fxV.set(fxRand(-3,3),fxRand(0.3,1.2),fxRand(-3,3)),{life:1.3,s0:0.8,s1:3,o:0.5,c0:fxDustColor(),drag:2});
      } else {
        f.landed=true; // settle at a slight tilt, sitting crooked on the hull
        tank.turretPivot.rotation.x=THREE.MathUtils.clamp(tank.turretPivot.rotation.x,-0.3,0.3);
        tank.turretPivot.rotation.z=THREE.MathUtils.clamp(tank.turretPivot.rotation.z,-0.3,0.3);
      }
    }
    tank.turretPivot.position.set(f.baseX+f.ox,f.baseY+f.y,f.baseZ+f.oz);
  }
  const fxEngineLocal=new THREE.Vector3();
  function fxTankPoint(tank,x,y,z){ return tank.group.localToWorld(fxEngineLocal.set(x,y,z)).clone(); }
  function fxRate(tank,key,rate,dt){
    tank.fxAcc=tank.fxAcc||{}; const a=(tank.fxAcc[key]||0)+rate*dt, n=Math.floor(a); tank.fxAcc[key]=a-n; return n;
  }
  function fxFlame(pos,size){
    size*=1.4;
    fxEmit(fxFire,pos,fxV.set(fxRand(-0.5,0.5),fxRand(1.6,3.0),fxRand(-0.5,0.5)),
      {life:fxRand(0.55,1.0),s0:size,s1:size*0.45,o:1,c0:0xffb838,c1:0xc42a04,buoy:1.5,drag:0.8,fade:0.05});
  }
  function fxBlackSmoke(pos,size,life){
    fxEmit(fxSmoke,pos,fxV.set(fxRand(-0.3,0.3),fxRand(1.6,2.6),fxRand(-0.3,0.3)),
      {life:life*1.5,s0:size*0.9,s1:size*4.6,o:0.97,c0:0x0b0a09,c1:0x2c2925,buoy:0.55,drag:0.45,wind:0.9,fade:0.1});
  }
  function fxUpdateTank(tank,dt){
    const sc=tank.group.scale.x||1;
    if(tank.wrecked){
      tank.wreckAge+=dt;
      fxUpdateTurretPop(tank,dt);
      const age=tank.wreckAge, ammo=!!tank.ammoBlown;
      const fireLevel=Math.max(0,1-age/(ammo?55:32));
      const smokeRate=age<140?Math.min(14,18*(1-age/150)):0;
      const engine=()=>fxTankPoint(tank,fxRand(-0.5,0.5),1.5,fxRand(-2.2,-1.5));
      const hatch=()=>tank.turretFX&&!tank.turretFX.landed?tank.turretPivot.getWorldPosition(new THREE.Vector3()):fxTankPoint(tank,fxRand(-0.4,0.4),1.9,0.1);
      for(let i=fxRate(tank,'fl',36*fireLevel,dt);i>0;i--) fxFlame(Math.random()<0.55?engine():hatch(),0.9*sc*(0.6+fireLevel*0.5));
      for(let i=fxRate(tank,'sm',smokeRate,dt);i>0;i--) fxBlackSmoke(Math.random()<0.5?engine():hatch(),1.0*sc,fxRand(2.6,3.8));
      if(ammo&&age<3.2){ // cook-off: rounds keep going up, throwing jets of flame out of the hull
        for(let i=fxRate(tank,'ck',7,dt);i>0;i--){
          const p=hatch();
          fxEmit(fxFire,p,fxV.set(fxRand(-2,2),fxRand(5,9),fxRand(-2,2)),{life:fxRand(0.4,0.7),s0:1.2,s1:0.5,o:1,c0:0xfff0b0,c1:0xd2400c,grav:3,drag:0.3});
          fxSparks(p,fxV2.set(0,1,0),6,8,1,0.8);
        }
        if(Math.random()<dt*2.5){const p=hatch();fxFlash(p,3.2,0.12);fxFlashLight(p,6,0.15);}
      }
      return;
    }
    // Track dust: both tracks kick up a trail behind a moving tank, in proportion to its speed.
    if(tank.fxLast&&dt>0){
      const gp=tank.group.position, v=Math.hypot(gp.x-tank.fxLast.x,gp.z-tank.fxLast.z)/dt;
      tank.fxSpeed=(tank.fxSpeed||0)*0.85+v*0.15;
    } else tank.fxLast=new THREE.Vector3();
    tank.fxLast.copy(tank.group.position);
    if(!tank.destroyed&&tank.fxSpeed>0.6){
      const gauge=tank.trackGauge||1.5, amt=Math.min(1,tank.fxSpeed/6);
      for(const side of [-1,1]) for(let i=fxRate(tank,'td'+side,9*amt,dt);i>0;i--){
        fxEmit(fxSmoke,fxTankPoint(tank,side*gauge,0.2,-2.3),fxV.set(fxRand(-0.4,0.4),fxRand(0.5,1.2),fxRand(-0.4,0.4)),
          {life:fxRand(1.2,2.0),s0:0.7*sc,s1:fxRand(2.6,4.0)*sc,o:0.3+0.34*amt,c0:fxDustColor(),drag:1.5,buoy:0.2,wind:0.6,fade:0.15});
      }
    }
    // Living tank: burning or smouldering after a pen.
    if(tank.burnTime>0&&!tank.destroyed){
      for(let i=fxRate(tank,'bf',32,dt);i>0;i--) fxFlame(fxTankPoint(tank,fxRand(-0.5,0.5),1.5,fxRand(-2.2,-1.5)),0.8*sc);
      for(let i=fxRate(tank,'bs',17,dt);i>0;i--) fxBlackSmoke(fxTankPoint(tank,fxRand(-0.5,0.5),1.6,fxRand(-2.2,-1.5)),0.9*sc,fxRand(2.4,3.4));
    } else if(tank.smoulder>0&&!tank.destroyed){
      tank.smoulder-=dt;
      for(let i=fxRate(tank,'ss',11,dt);i>0;i--){
        fxEmit(fxSmoke,fxTankPoint(tank,fxRand(-0.6,0.6),1.6,fxRand(-1.2,0.8)),fxV.set(fxRand(-0.3,0.3),fxRand(1.1,1.8),fxRand(-0.3,0.3)),
          {life:fxRand(2.4,3.4),s0:0.6*sc,s1:3.0*sc,o:0.75,c0:0x201d1a,c1:0x4a4640,buoy:0.45,drag:0.6,wind:0.7});
      }
    }
  }
  function fxMuzzle(tank,tip,dir){
    // Muzzle blast: a big star flash, a jet of fire down the barrel, a dark smoke cloud, a ring of dust blown off
    // the ground, and a brief light that picks out the hull and the terrain around the gun.
    fxFlash(tip,7,0.18);
    for(let i=0;i<6;i++) fxEmit(fxFire,fxV2.copy(tip).addScaledVector(dir,0.5*i),fxV.copy(dir).multiplyScalar(9+i*1.5),
      {life:0.22+0.03*i,s0:1.2,s1:3.2,o:1,c0:0xffd070,c1:0xff5a14,drag:3.5,fade:0.03});
    for(let i=0;i<5;i++) fxEmit(fxFire,tip,fxV.set(fxRand(-3,3),fxRand(-1,3),fxRand(-3,3)).addScaledVector(dir,fxRand(1,4)),
      {life:fxRand(0.2,0.4),s0:0.8,s1:fxRand(1.6,2.5),o:0.9,c0:0xffb040,c1:0xd23808,drag:4,fade:0.03});
    fxSparks(tip,dir,16,18,0.6,0.55);
    for(let i=0;i<14;i++) fxEmit(fxSmoke,tip,fxV.copy(dir).multiplyScalar(fxRand(2,8)).add(fxV2.set(fxRand(-1.4,1.4),fxRand(-0.2,1.3),fxRand(-1.4,1.4))),
      {life:fxRand(2.2,3.8),s0:0.9,s1:fxRand(4,6.5),o:0.92,c0:0x2a2623,c1:0x4d4944,drag:2.0,buoy:0.28,wind:0.3});
    // Blast wash kicks light dust off the ground in front of and under the tank.
    for(let i=0;i<12;i++){
      const gp=fxV2.set(tip.x+fxRand(-2.6,2.6),terrainHeightAt(tip.x,tip.z)+0.3,tip.z+fxRand(-2.6,2.6)).clone();
      fxEmit(fxSmoke,gp,fxV.set(dir.x*3+fxRand(-2.4,2.4),fxRand(0.3,1.3),dir.z*3+fxRand(-2.4,2.4)),
        {life:fxRand(1.5,2.4),s0:1.1,s1:fxRand(3.4,5.2),o:0.7,c0:fxDustColor(),c1:fxDustShade(),drag:2});
    }
    fxShockwave(tip,5.5,0.32);
    fxFlashLight(tip,16,0.14);
    if(tank!==player) fxShake(tip,0.03); // a nearby gun going off rattles the camera a little
  }
  function fxUpdate(dt){
    updateMuzzlePool();
    fxUpdatePool(fxSmoke,dt); fxUpdatePool(fxVapor,dt); fxUpdatePool(fxFire,dt); fxUpdatePool(fxStar,dt); fxUpdateDebris(dt);
    for(const r of fxRings){
      if(!r.active) continue; r.t+=dt;
      if(r.t>=r.dur){r.active=false;r.m.visible=false;continue;}
      const k=r.t/r.dur, e=1-(1-k)*(1-k);
      r.m.scale.setScalar(0.6+r.r1*e); r.m.material.opacity=0.55*(1-k);
    }
    if(fxLight.intensity>0){
      fxLightState.t+=dt; const k=fxLightState.t/fxLightState.dur;
      fxLight.intensity=k>=1?0:fxLightState.peak*(1-k)*(1-k);
    }
    for(const c of fxCraters){
      if(!c.m.visible||c.t>=1) continue;
      c.t=Math.min(1,c.t+dt*1.5); c.m.material.opacity=c.peak*c.t;
    }
    for(const t of [player,...allies,...enemies]){
      if(t.destroyed&&!t.wrecked){ fxTankDestroyed(t); matchOnDestroyed(t); }
      fxUpdateTank(t,dt);
    }
  }

  // ---------- Team marker dots ----------
  function makeTeamDot(team='neutral'){
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const color=team==='ally'?'#48b9ff':team==='enemy'?'#ff5148':'#eaf2db';
    ctx.beginPath(); ctx.arc(32,32,15,0,Math.PI*2); ctx.fillStyle='rgba(8,12,15,0.78)'; ctx.fill();
    ctx.lineWidth=5; ctx.strokeStyle='rgba(245,248,240,0.92)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(32,32,9,0,Math.PI*2); ctx.fillStyle=color; ctx.fill();
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({map:tex, transparent:true, depthTest:false, depthWrite:false});
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(0.58, 0.58, 1);
    sprite.renderOrder = 999;
    return sprite;
  }

  // ---------- Damage flash visual feedback ----------
  let damageFlashEl=null,damageFlashTimer=0;
  function showDamageFlash(){
    if(!damageFlashEl){damageFlashEl=document.createElement('div');damageFlashEl.id='damageFlash';document.body.appendChild(damageFlashEl);}
    damageFlashEl.classList.remove('active');void damageFlashEl.offsetWidth;damageFlashEl.classList.add('active');
    clearTimeout(damageFlashTimer);damageFlashTimer=setTimeout(()=>damageFlashEl.classList.remove('active'),340);
  }

  // Each match gets a small mixed force. Tank types are selected independently,
  // so teams can contain duplicates as well as different vehicles.
  // Spatial hash over the map's collider circles (the airport has ~24,000 trees; a linear scan per tank per frame would crawl).
  const COL_CELL=40, colGrid=new Map();
  for(const t of treeColliders){ const k=Math.floor(t.x/COL_CELL)*100003+Math.floor(t.z/COL_CELL); let a=colGrid.get(k); if(!a){ a=[]; colGrid.set(k,a); } a.push(t); }
  function colliderHit(x,z,pad,fromX,fromZ){      // true if (x,z) is inside a collider; with fromX/fromZ only counts ones the unit is moving INTO
    const gx=Math.floor(x/COL_CELL), gz=Math.floor(z/COL_CELL);
    for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++){
      const a=colGrid.get((gx+i)*100003+(gz+j)); if(!a) continue;
      for(const t of a){
        const r=t.radius+pad, dn=(x-t.x)**2+(z-t.z)**2;
        if(dn<r*r && (fromX===undefined || dn<(fromX-t.x)**2+(fromZ-t.z)**2)) return true;
      }
    }
    return false;
  }
  // Bots are ground vehicles only: the Su-30SM is an aircraft stub (no muzzleFlash/muzzleLight/suspension), so a bot using it crashes updateGunRecoil.
  const tankIds=Object.keys(TANK_CONFIGS).filter(id=>!TANK_CONFIGS[id].isAircraft);
  const enemies=[], allies=[];
  function spawnUnit(team,x,z){
    const tankId=tankIds[Math.floor(Math.random()*tankIds.length)];
    const unitConfig=TANK_CONFIGS[tankId];
    const unit=buildTank(team==='red'?0x596246:0x667553,team==='red'?0x4b573a:0x536445,tankId);
    unit.team=team; unit.config=unitConfig; unit.destroyed=false; unit.burnTime=0; unit.totalBurnTime=0;
    unit.driveSpeed=0; unit.hullTurnVelocity=0; unit.turretVelocity=0; unit.pitchVelocity=0;
    unit.reloadRemaining=1.7+Math.random()*2.2;
    // Initialize autoloader for bots
    unit.shotsInMagazine = unitConfig.magazineSize || 0;
    unit.isReloadingMagazine = false;
    unit.group.position.set(x,terrainHeightAt(x,z),z);
    unit.group.rotation.y=team==='red'?Math.PI:0;
    alignTankToTerrain(unit); scene.add(unit.group);
    const marker=makeTeamDot(team==='red'?'enemy':'ally');
    marker.position.set(0,3.05,0); marker.visible=team!=='red'; unit.group.add(marker);
    unit.teamMarker=marker;
    (team==='red'?enemies:allies).push(unit);
    return unit;
  }
  const slotIndex={blue:0,red:0};
  function randomTeamSpawn(team,ignorePlayer=false){
    // Maps with airfields line each team up on its own runway (the player takes the first blue slot).
    if(mapSpawnSlots){ const slots=mapSpawnSlots(team), slot=slots[slotIndex[team]++ % slots.length]; return {x:slot.x,z:slot.z}; }
    const side=team==='red'?1:-1;
    const zNear=Math.max(32,groundSize*0.22);
    const zFar=Math.min(groundSize/2-18,groundSize*0.43);
    const xLimit=groundSize*0.34;
    const placed=[player,...allies,...enemies].filter(unit=>!ignorePlayer||unit!==player);
    let best=null,bestClearance=-Infinity;
    for(let attempt=0;attempt<240;attempt++){
      const x=(Math.random()*2-1)*xLimit;
      const z=side*(zNear+Math.random()*(zFar-zNear));
      const obstacleClearance=treeColliders.reduce((clearance,obstacle)=>
        Math.min(clearance,Math.hypot(x-obstacle.x,z-obstacle.z)-obstacle.radius-2.2),Infinity);
      const tankClearance=placed.reduce((clearance,unit)=>
        Math.min(clearance,Math.hypot(x-unit.group.position.x,z-unit.group.position.z)-22),Infinity);
      const clearance=Math.min(obstacleClearance,tankClearance);
      if(clearance>bestClearance){ bestClearance=clearance; best={x,z}; }
      if(clearance>=0) return {x,z};
    }
    // Maps can be crowded; use the safest sampled point if no perfect spot exists.
    return best || {x:(Math.random()*2-1)*xLimit,z:side*((zNear+zFar)/2)};
  }
  const playerSpawn=randomTeamSpawn('blue',true);
  player.group.position.set(playerSpawn.x,terrainHeightAt(playerSpawn.x,playerSpawn.z),playerSpawn.z);
  player.group.rotation.y=0;
  alignTankToTerrain(player);
  for(let i=0;i<6;i++){
    const spawn=randomTeamSpawn('red');
    spawnUnit('red',spawn.x,spawn.z);
  }
  for(let i=0;i<5;i++){ // 5 allied bots + the player = 6
    const spawn=randomTeamSpawn('blue');
    spawnUnit('blue',spawn.x,spawn.z);
  }

  player.team='blue'; player.config=config; player.destroyed=false; player.burnTime=0; player.totalBurnTime=0;

  // ---------- Input ----------
  const keys = {};
  let aimView = false;
  const aimWorldPoint=new THREE.Vector3();
  const aimRange=140;
  let audioContext=null,engineGain=null,engineTone=null,engineTone2=null,engineNoiseBuffer=null,shotNoiseBuffer=null,masterAudioGain=null,engineNoiseFilter=null;
  function loadAudioClip(path,loop=false){
    const clip=new Audio();clip.preload='auto';clip.src=new URL(path,document.baseURI).href;clip.loop=loop;return clip;
  }
  const lightEngineMix=config.spotClass==='light';
  const tankShiftClip=loadAudioClip('audio/shifting-of-a-tank.mp3');
  const tankReloadClip=loadAudioClip('audio/freesound_community-tank-reload-47828.mp3');
  const tankReadyClip=loadAudioClip('audio/mixkit-metal-tank-door-closing-2754.wav');
  const distantBlastClip=loadAudioClip('audio/freesound_community-distant-explosion-39685.mp3');
  let lastDriveDirection=0;
  function playAudioClip(clip,volume=0.6,delay=0){
    if(!clip)return;
    const play=()=>{
      try{clip.pause();clip.currentTime=0;clip.volume=Math.max(0,Math.min(1,volume));const result=clip.play();if(result&&result.catch)result.catch(()=>{});}catch(_){/* Audio may not be ready until the next user gesture. */}
    };
    if(delay>0)setTimeout(play,delay*1000);else play();
  }
  function makeNoiseBuffer(context,seconds){
    const buffer=context.createBuffer(1,Math.floor(context.sampleRate*seconds),context.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++) data[i]=Math.random()*2-1;
    return buffer;
  }
  function ensureAudio(){
    const AudioContextClass=window.AudioContext||window.webkitAudioContext;
    if(!AudioContextClass) return;
    if(!audioContext){
      audioContext=new AudioContextClass();
      masterAudioGain=audioContext.createGain();masterAudioGain.gain.value=0.82;
      const audioCompressor=audioContext.createDynamicsCompressor();
      audioCompressor.threshold.value=-10;audioCompressor.knee.value=12;audioCompressor.ratio.value=4;
      audioCompressor.attack.value=0.004;audioCompressor.release.value=0.28;
      masterAudioGain.connect(audioCompressor);audioCompressor.connect(audioContext.destination);
      engineGain=audioContext.createGain();engineGain.gain.value=0.2;engineGain.connect(masterAudioGain);
      engineNoiseBuffer=makeNoiseBuffer(audioContext,2);
      shotNoiseBuffer=makeNoiseBuffer(audioContext,1.2);
      const motorNoise=audioContext.createBufferSource();motorNoise.buffer=engineNoiseBuffer;motorNoise.loop=true;
      engineNoiseFilter=audioContext.createBiquadFilter();engineNoiseFilter.type='lowpass';engineNoiseFilter.frequency.value=105;
      motorNoise.connect(engineNoiseFilter);engineNoiseFilter.connect(engineGain);motorNoise.start();
      engineTone=audioContext.createOscillator();engineTone.type='sawtooth';engineTone.frequency.value=34;
      const toneFilter=audioContext.createBiquadFilter();toneFilter.type='lowpass';toneFilter.frequency.value=125;
      const toneGain=audioContext.createGain();toneGain.gain.value=0.16;
      engineTone.connect(toneFilter);toneFilter.connect(toneGain);toneGain.connect(engineGain);engineTone.start();
      engineTone2=audioContext.createOscillator();engineTone2.type='triangle';engineTone2.frequency.value=68;
      const tone2Gain=audioContext.createGain();tone2Gain.gain.value=0.09;
      engineTone2.connect(tone2Gain);tone2Gain.connect(engineGain);engineTone2.start();
      startAmbientAudio();
      ensureShotFx();
    }
    if(audioContext.state==='suspended') audioContext.resume().catch(()=>{});
  }
  window.addEventListener('pointerdown',ensureAudio);
  window.addEventListener('keydown',ensureAudio);

  // ========== AMBIENT LIFE + SOUND ==========
  // Birds (day/sunset), vultures (desert), bats and fireflies (night), tumbleweeds (desert), a passing aircraft with a
  // Doppler drone, and far-off artillery / machine-gun fire. Wind, birdsong, owls and coyotes are synthesised
  // with Web Audio (no sample files). Everything follows the time of day. Nothing here is a collider.
  const ambRnd=(a,b)=>a+Math.random()*(b-a);
  const ambGlowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
    const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(0.3,'rgba(255,255,255,0.45)');gr.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
  const ambNight=todKey==='night', ambSunset=todKey==='sunset';
  const _aq=new THREE.Quaternion(), _aqy=new THREE.Quaternion(), _aqz=new THREE.Quaternion(), _aY=new THREE.Vector3(0,1,0), _aZ=new THREE.Vector3(0,0,1);
  const _ad=new THREE.Object3D(), _aS=new THREE.Vector3(), _aR=new THREE.Vector3(), _aV=new THREE.Vector3();

  // ----- Flyers: flocks of birds by day, vultures over the desert, bats at night -----
  const flyers=(()=>{
    const spec = ambNight ? {count:desert?4:10,per:5,speed:[7,11],radius:[10,22],alt:[5,14],scale:0.5,flap:[13,17],amp:0.9,color:0x050507,low:true}
      : desert ? {count:4,per:2,speed:[6,8],radius:[45,75],alt:[45,80],scale:2.3,flap:[1.0,1.6],amp:0.28,color:ambSunset?0x1a1210:0x241e19}
      : {count:ambSunset?7:14,per:7,speed:[9,13],radius:[20,45],alt:[24,55],scale:0.95,flap:[6,9],amp:0.75,color:ambSunset?0x120e12:0x1b1c1e};
    const n=spec.count;
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0.22, 0,0,-0.12, 1,0,-0.38, 1,0,0.02],3));
    geo.setIndex([0,1,2, 0,2,3]);
    const mat=new THREE.MeshBasicMaterial({color:spec.color,side:THREE.DoubleSide});
    const mk=()=>{const m=new THREE.InstancedMesh(geo,mat,n);m.frustumCulled=false;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(m);return m;};
    const wr=mk(), wl=mk();
    const flocks=[];
    function place(f){
      const a=Math.random()*Math.PI*2, d=ambRnd(90,210);
      f.cx=camera.position.x+Math.cos(a)*d; f.cz=camera.position.z+Math.sin(a)*d;
      f.g=terrainHeightAt(THREE.MathUtils.clamp(f.cx,-groundSize/2,groundSize/2),THREE.MathUtils.clamp(f.cz,-groundSize/2,groundSize/2));
    }
    for(let i=0,left=n;left>0;i++){
      const k=Math.min(spec.per,left); left-=k;
      const f={r:ambRnd(...spec.radius),alt:ambRnd(...spec.alt),dir:Math.random()<0.5?1:-1,a:Math.random()*6.28,members:[]};
      f.w=ambRnd(...spec.speed)/f.r; place(f);
      for(let j=0;j<k;j++) f.members.push({da:ambRnd(-0.18,0.18),or:ambRnd(-4,4),oy:ambRnd(-4,4),ph:Math.random()*6.28,fr:ambRnd(...spec.flap),sc:spec.scale*ambRnd(0.85,1.15)});
      flocks.push(f);
    }
    return {update(dt,t){
      let idx=0;
      for(const f of flocks){
        f.a+=f.w*f.dir*dt;
        if(Math.hypot(f.cx-camera.position.x,f.cz-camera.position.z)>260) place(f);
        const ca=Math.cos(f.a), sa=Math.sin(f.a), yaw=Math.atan2(-sa*f.dir,ca*f.dir);
        for(const m of f.members){
          const ang=f.a+m.da, rr=f.r+m.or, px=f.cx+Math.cos(ang)*rr, pz=f.cz+Math.sin(ang)*rr;
          const gy=spec.low?terrainHeightAt(THREE.MathUtils.clamp(px,-groundSize/2,groundSize/2),THREE.MathUtils.clamp(pz,-groundSize/2,groundSize/2)):f.g;
          const py=gy+f.alt+m.oy+Math.sin(t*0.4+m.ph)*1.5+(spec.low?Math.sin(t*3+m.ph)*1.2:0);
          const flap=Math.sin(t*m.fr*6.283+m.ph)*spec.amp, roll=0.3*f.dir;
          _aqy.setFromAxisAngle(_aY,yaw);
          _ad.position.set(px,py,pz);
          _aqz.setFromAxisAngle(_aZ,roll+flap); _ad.quaternion.copy(_aqy).multiply(_aqz); _ad.scale.set(m.sc,m.sc,m.sc); _ad.updateMatrix(); wr.setMatrixAt(idx,_ad.matrix);
          _aqz.setFromAxisAngle(_aZ,roll-flap); _ad.quaternion.copy(_aqy).multiply(_aqz); _ad.scale.set(-m.sc,m.sc,m.sc); _ad.updateMatrix(); wl.setMatrixAt(idx,_ad.matrix);
          idx++;
        }
      }
      wr.instanceMatrix.needsUpdate=true; wl.instanceMatrix.needsUpdate=true;
    }};
  })();

  // ----- Fireflies drifting through the trees and streets on forest/town nights -----
  const fireflies=(!ambNight||desert)?null:(()=>{
    const N=130, SPAN=140, pts=[], pos=new Float32Array(N*3), col=new Float32Array(N*3);
    for(let i=0;i<N;i++) pts.push({ox:ambRnd(-70,70),oz:ambRnd(-70,70),ph:Math.random()*6.28,sp:ambRnd(0.4,1.1),h:ambRnd(0.6,3.2),cellX:1e9,cellZ:1e9,gy:0});
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    const mat=new THREE.PointsMaterial({size:0.6,map:ambGlowTex,vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,sizeAttenuation:true});
    const pm=new THREE.Points(geo,mat); pm.frustumCulled=false; scene.add(pm);
    return {update(dt,t){
      const px=player.group.position.x, pz=player.group.position.z;
      pts.forEach((p,i)=>{
        const cx=Math.round((px-p.ox)/SPAN), cz=Math.round((pz-p.oz)/SPAN);
        const wx=p.ox+cx*SPAN, wz=p.oz+cz*SPAN;
        if(cx!==p.cellX||cz!==p.cellZ){ p.cellX=cx; p.cellZ=cz; p.gy=terrainHeightAt(THREE.MathUtils.clamp(wx,-groundSize/2,groundSize/2),THREE.MathUtils.clamp(wz,-groundSize/2,groundSize/2)); }
        pos[i*3]=wx+Math.sin(t*p.sp+p.ph)*1.6; pos[i*3+2]=wz+Math.cos(t*p.sp*0.8+p.ph)*1.6;
        pos[i*3+1]=p.gy+p.h+Math.sin(t*p.sp*0.7+p.ph*2)*0.7;
        const b=Math.max(0,Math.sin(t*(1.1+p.sp)+p.ph*3)); const v=b*b*b;
        col[i*3]=0.72*v; col[i*3+1]=1.0*v; col[i*3+2]=0.35*v;
      });
      geo.attributes.position.needsUpdate=true; geo.attributes.color.needsUpdate=true;
    }};
  })();

  // ----- Tumbleweeds blown across the desert -----
  const weeds=!desert?null:(()=>{
    const list=[], SPAN=400, mat=new THREE.MeshStandardMaterial({color:ambNight?0x4a4030:0x8a7448,roughness:1,wireframe:true});
    const geo=new THREE.IcosahedronGeometry(1,1);
    for(let i=0;i<9;i++){
      const m=new THREE.Mesh(geo,mat); m.castShadow=false; scene.add(m);
      list.push({m,ox:ambRnd(-200,200),oz:ambRnd(-200,200),r:ambRnd(0.7,1.3),ph:Math.random()*6.28,off:0,spd:ambRnd(2.5,5)});
    }
    return {update(dt,t){
      const px=player.group.position.x, pz=player.group.position.z, wl=Math.hypot(fxWind.x,fxWind.z)||1;
      for(const w of list){
        const gust=0.55+0.45*Math.sin(t*0.23+w.ph), v=w.spd*gust;
        w.ox+=fxWind.x/wl*v*dt; w.oz+=fxWind.z/wl*v*dt; w.off+=v*dt;
        const cx=Math.round((px-w.ox)/SPAN), cz=Math.round((pz-w.oz)/SPAN), x=w.ox+cx*SPAN, z=w.oz+cz*SPAN;
        const cxm=THREE.MathUtils.clamp(x,-groundSize/2,groundSize/2), czm=THREE.MathUtils.clamp(z,-groundSize/2,groundSize/2);
        const hop=Math.abs(Math.sin(w.off*0.9+w.ph))*0.5*gust;
        w.m.position.set(x,terrainHeightAt(cxm,czm)+w.r*0.75+hop,z);
        w.m.scale.set(w.r,w.r*0.9,w.r);
        w.m.rotation.z-=v*dt/w.r; w.m.rotation.y+=dt*0.4;
        w.m.visible=Math.hypot(x-px,z-pz)<190;
      }
    }};
  })();

  // ----- Aircraft flyover (with navigation lights at night) -----
  const planeMat=new THREE.MeshBasicMaterial({color:ambNight?0x050608:ambSunset?0x1c1416:0x2c3034});
  const planeGroup=new THREE.Group(); planeGroup.visible=false; scene.add(planeGroup);
  [[1.4,1.4,11,0,0,0],[15,0.25,2.4,0,0.1,0.8],[4.4,0.25,1.3,0,0.2,-5],[0.25,2.2,1.4,0,1,-5]].forEach(([w,h,d,x,y,z])=>{
    const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),planeMat); b.position.set(x,y,z); planeGroup.add(b);
  });
  const planeLights=ambNight?[[-7.5,0.2,0.8,0xff2a2a,0],[7.5,0.2,0.8,0x2aff5a,0],[0,1.9,-5,0xffffff,1]].map(([x,y,z,c,blink])=>{
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:ambGlowTex,color:c,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
    s.scale.set(7,7,1); s.position.set(x,y,z); planeGroup.add(s); return {s,blink};
  }):[];
  const plane={active:false,t:0,vel:new THREE.Vector3(),audio:null};
  function startPlane(){
    const th=Math.random()*Math.PI*2, off=ambRnd(-140,140), speed=ambRnd(55,80);
    const dx=Math.cos(th), dz=Math.sin(th);
    planeGroup.position.set(camera.position.x+dx*440-dz*off, camera.position.y+ambRnd(170,260), camera.position.z+dz*440+dx*off);
    plane.vel.set(-dx*speed,0,-dz*speed); plane.t=0; plane.active=true; planeGroup.visible=true;
    planeGroup.rotation.set(0,Math.atan2(plane.vel.x,plane.vel.z),0);
    if(audioContext&&ambientAudio){
      const c=audioContext, lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=560;
      const g=c.createGain(); g.gain.value=0; const pan=c.createStereoPanner?c.createStereoPanner():null;
      const o1=c.createOscillator(), o2=c.createOscillator(); o1.type='sawtooth'; o2.type='sawtooth'; o1.frequency.value=74; o2.frequency.value=78.5;
      const ns=c.createBufferSource(); ns.buffer=engineNoiseBuffer; ns.loop=true; const nb=c.createBiquadFilter(); nb.type='bandpass'; nb.frequency.value=380; nb.Q.value=0.7;
      const ng=c.createGain(); ng.gain.value=0.15;
      o1.connect(lp); o2.connect(lp); ns.connect(nb); nb.connect(ng); ng.connect(lp); lp.connect(g);
      if(pan){ g.connect(pan); pan.connect(ambientAudio.bus); } else g.connect(ambientAudio.bus);
      o1.start(); o2.start(); ns.start();
      plane.audio={g,pan,o1,o2,ns};
    }
  }
  function stopPlane(){
    plane.active=false; planeGroup.visible=false;
    if(plane.audio){ const a=plane.audio; try{a.g.gain.setTargetAtTime(0,audioContext.currentTime,0.2);}catch(e){} setTimeout(()=>{try{a.o1.stop();a.o2.stop();a.ns.stop();}catch(e){}},900); plane.audio=null; }
  }
  function updatePlane(dt,t){
    if(!plane.active) return;
    plane.t+=dt; planeGroup.position.addScaledVector(plane.vel,dt);
    _aR.copy(planeGroup.position).sub(camera.position); const dist=_aR.length()||1;
    const vr=_aR.dot(plane.vel)/dist; // >0 moving away
    if(plane.t>4&&vr>0&&dist>470){ stopPlane(); return; }
    planeLights.forEach(l=>{ l.s.material.opacity=l.blink?(Math.sin(t*5)>0.7?1:0.05):0.9; });
    if(plane.audio&&audioContext){
      const now=audioContext.currentTime, dop=340/(340+vr), el=camera.matrixWorld.elements;
      plane.audio.o1.frequency.setTargetAtTime(74*dop,now,0.1); plane.audio.o2.frequency.setTargetAtTime(78.5*dop,now,0.1);
      plane.audio.g.gain.setTargetAtTime(0.1/(1+(dist/260)*(dist/260)),now,0.15);
      if(plane.audio.pan) plane.audio.pan.pan.setTargetAtTime(THREE.MathUtils.clamp((_aR.x*el[0]+_aR.y*el[1]+_aR.z*el[2])/dist,-1,1)*0.9,now,0.1);
    }
  }

  // ----- Distant fighting: horizon flashes at dusk/night, plus the rumble that arrives a moment later -----
  const flashes=(ambNight||ambSunset)?[0,1].map(()=>{
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:ambGlowTex,color:0xffa850,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
    s.scale.set(170,80,1); s.visible=false; scene.add(s); return {s,t:9};
  }):[];
  let flashNext=0;
  function horizonFlash(){
    if(!flashes.length) return;
    const f=flashes[flashNext]; flashNext=(flashNext+1)%flashes.length;
    const a=Math.random()*Math.PI*2;
    f.s.position.set(camera.position.x+Math.cos(a)*400,camera.position.y+ambRnd(6,26),camera.position.z+Math.sin(a)*400); f.t=0; f.s.visible=true;
  }
  function updateFlashes(dt){
    for(const f of flashes){ if(f.t>=1) continue; f.t+=dt/0.6; f.s.material.opacity=f.t>=1?0:0.9*(1-f.t)*(1-f.t); if(f.t>=1) f.s.visible=false; }
  }

  // ----- Audio -----
  let ambientAudio=null;
  function ambChirp(f0,f1,dur,vol,pan,delay){
    const c=audioContext, t=c.currentTime+(delay||0), o=c.createOscillator(), g=c.createGain();
    o.type='sine'; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f1,t+dur);
    g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+dur*0.25); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g); let out=g;
    if(c.createStereoPanner){ const p=c.createStereoPanner(); p.pan.value=pan; g.connect(p); out=p; }
    out.connect(ambientAudio.bus); o.start(t); o.stop(t+dur+0.05);
  }
  function ambBirdCall(){
    const pan=ambRnd(-0.9,0.9), v=ambRnd(0.03,0.07), kind=Math.random();
    if(desert){ ambChirp(2600,1700,0.7,v*0.9,pan); return; }               // raptor-ish cry
    if(kind<0.4){ const n=3+Math.floor(Math.random()*4), f=ambRnd(2800,3600); for(let i=0;i<n;i++) ambChirp(f,f*1.3,0.09,v,pan,i*0.13); }
    else if(kind<0.7){ ambChirp(2500,2100,0.26,v,pan); ambChirp(2000,1750,0.3,v*0.85,pan,0.34); ambChirp(2300,2700,0.2,v*0.8,pan,0.72); }
    else { const n=7+Math.floor(Math.random()*5), f=ambRnd(4200,5000); for(let i=0;i<n;i++) ambChirp(f+(i%2)*500,f+300+(i%2)*500,0.04,v*0.8,pan,i*0.055); }
  }
  function ambOwl(){
    const pan=ambRnd(-0.8,0.8);
    if(desert){ // distant coyote howl
      const c=audioContext, t=c.currentTime, o=c.createOscillator(), g=c.createGain(), lp=c.createBiquadFilter(), vib=c.createOscillator(), vg=c.createGain();
      o.type='sine'; o.frequency.setValueAtTime(520,t); o.frequency.linearRampToValueAtTime(880,t+0.6); o.frequency.linearRampToValueAtTime(760,t+1.3); o.frequency.linearRampToValueAtTime(560,t+2.1);
      vib.frequency.value=7; vg.gain.value=22; vib.connect(vg); vg.connect(o.frequency);
      g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.05,t+0.35); g.gain.setValueAtTime(0.05,t+1.5); g.gain.exponentialRampToValueAtTime(0.0001,t+2.2);
      lp.type='lowpass'; lp.frequency.value=1300; o.connect(lp); lp.connect(g); let out=g;
      if(c.createStereoPanner){ const p=c.createStereoPanner(); p.pan.value=pan; g.connect(p); out=p; }
      out.connect(ambientAudio.bus); o.start(t); vib.start(t); o.stop(t+2.3); vib.stop(t+2.3); return;
    }
    [[0,0.3,420,370],[0.58,0.28,400,360],[0.95,0.4,390,320]].forEach(([d,dur,a,b])=>ambChirp(a,b,dur,0.07,pan,d));
  }
  function ambBoom(){
    const c=audioContext, t=c.currentTime+ambRnd(0.8,2.4), pan=ambRnd(-0.8,0.8), dist=ambRnd(0.6,1);
    const mk=(lpf,vol,dur)=>{
      const s=c.createBufferSource(); s.buffer=shotNoiseBuffer; const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=lpf;
      const g=c.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol*dist,t+0.03); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
      s.connect(lp); lp.connect(g); let out=g; if(c.createStereoPanner){ const p=c.createStereoPanner(); p.pan.value=pan; g.connect(p); out=p; }
      out.connect(ambientAudio.bus); s.start(t); s.stop(t+Math.min(1.2,dur+0.05));
    };
    mk(220,0.34,1.1); mk(90,0.45,1.15);
    const o=c.createOscillator(), og=c.createGain(); o.frequency.setValueAtTime(54,t); o.frequency.exponentialRampToValueAtTime(30,t+0.7);
    og.gain.setValueAtTime(0.0001,t); og.gain.linearRampToValueAtTime(0.28*dist,t+0.04); og.gain.exponentialRampToValueAtTime(0.0001,t+0.8);
    o.connect(og); og.connect(ambientAudio.bus); o.start(t); o.stop(t+0.9);
  }
  function ambGunfire(){
    const c=audioContext, pan=ambRnd(-0.9,0.9), n=8+Math.floor(Math.random()*10), base=c.currentTime+ambRnd(0.5,1.5);
    for(let i=0;i<n;i++){
      const t=base+i*ambRnd(0.07,0.1), s=c.createBufferSource(); s.buffer=shotNoiseBuffer; const bp=c.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=1500; bp.Q.value=0.8;
      const g=c.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.03,t+0.004); g.gain.exponentialRampToValueAtTime(0.0001,t+0.06);
      s.connect(bp); bp.connect(g); let out=g; if(c.createStereoPanner){ const p=c.createStereoPanner(); p.pan.value=pan; g.connect(p); out=p; }
      out.connect(ambientAudio.bus); s.start(t); s.stop(t+0.08);
    }
  }
  function startAmbientAudio(){
    const c=audioContext; if(!c||ambientAudio||!masterAudioGain) return;
    const A=ambientAudio={bus:c.createGain(),wind:[]};
    A.bus.gain.value=1; A.bus.connect(masterAudioGain);
    const pan=(node,p)=>{ if(c.createStereoPanner){ const sp=c.createStereoPanner(); sp.pan.value=p; node.connect(sp); sp.connect(A.bus); } else node.connect(A.bus); };
    // wind: two decorrelated noise layers, left and right
    const wbuf=makeNoiseBuffer(c,4);
    [-0.75,0.75].forEach((p,i)=>{
      const src=c.createBufferSource(); src.buffer=wbuf; src.loop=true;
      const bp=c.createBiquadFilter(); bp.type='lowpass'; bp.frequency.value=260+i*60; bp.Q.value=0.4;
      const bp2=c.createBiquadFilter(); bp2.type='lowpass'; bp2.frequency.value=420; bp2.Q.value=0.3; // two poles: a soft rumble, no hiss
      const g=c.createGain(); g.gain.value=0; src.connect(bp); bp.connect(bp2); bp2.connect(g); pan(g,p); src.start(0,Math.random()*3);
      A.wind.push({g,bp});
    });
  }

  const ambT={bird:ambRnd(6,14),boom:ambRnd(30,60),mg:ambRnd(80,150),owl:ambRnd(25,50),plane:ambRnd(90,180),wind:0};
  function updateAmbience(rawDt){
    const dt=Math.min(rawDt,0.1), t=performance.now()/1000;
    flyers.update(dt,t); if(fireflies) fireflies.update(dt,t); if(weeds) weeds.update(dt,t); updatePlane(dt,t); updateFlashes(dt);
    ambT.plane-=dt; if(ambT.plane<=0){ ambT.plane=ambRnd(180,360); if(!plane.active) startPlane(); }
    ambT.boom-=dt; if(ambT.boom<=0){ ambT.boom=ambRnd(town?30:45,town?70:100); horizonFlash(); if(ambientAudio) ambBoom(); }
    ambT.mg-=dt; if(ambT.mg<=0){ ambT.mg=ambRnd(90,200); horizonFlash(); if(ambientAudio) ambGunfire(); }
    if(!ambientAudio||!audioContext) return;
    const A=ambientAudio, now=audioContext.currentTime;
    if(!ambNight){ ambT.bird-=dt; if(ambT.bird<=0){ ambT.bird=(desert?ambRnd(30,70):town?ambRnd(10,25):ambRnd(8,20))*(ambSunset?1.6:1); ambBirdCall(); } }
    else { ambT.owl-=dt; if(ambT.owl<=0){ ambT.owl=desert?ambRnd(60,120):ambRnd(30,70); ambOwl(); } }
    ambT.wind-=dt;
    if(ambT.wind<=0){
      ambT.wind=0.3;
      const base=(desert?0.5:town?0.3:0.36)*(ambNight?0.7:1);
      const gust=0.5+0.5*(Math.sin(t*0.17)*0.6+Math.sin(t*0.41+2)*0.4);
      A.wind.forEach((w,i)=>{ w.g.gain.setTargetAtTime(base*(0.35+0.65*gust),now,0.8); w.bp.frequency.setTargetAtTime(200+i*60+gust*200,now,0.8); });
    }
  }
  // ---------- Main-gun report ----------
  // Built from layers, like a real tank cannon heard in the open: a razor-sharp muzzle crack (distorted), the pressure wave of the
  // blast (distorted brown noise sweeping down), a chest-thumping sub drop, a low body rumble, then an outdoor tail, a
  // slap-back echo off distant terrain and a convolution reverb. Size follows the gun's calibre (bigger = deeper, longer,
  // louder). Other tanks are delayed by the speed of sound, muffled and quietened by distance, and panned to where they are.
  const SHOT_CALIBER={tiger:88,panther:75,sturer:128,is7:130,fv4005:183,amx50:120,t54e1:105,leopard1a5:105,m1abrams:105,t72b:125,challenger1:120,k1:105,su30sm:30};
  let shotFx=null;
  function ensureShotFx(){
    if(shotFx||!audioContext||!masterAudioGain) return shotFx;
    const c=audioContext, sr=c.sampleRate;
    const bl=Math.floor(sr*2), brown=c.createBuffer(1,bl,sr), bd=brown.getChannelData(0); let last=0, peak=0;
    for(let i=0;i<bl;i++){ last=(last+0.02*(Math.random()*2-1))/1.02; bd[i]=last; peak=Math.max(peak,Math.abs(last)); }
    for(let i=0;i<bl;i++) bd[i]*=0.9/peak;
    const irLen=Math.floor(sr*2.4), ir=c.createBuffer(2,irLen,sr);
    for(let ch=0;ch<2;ch++){
      const d=ir.getChannelData(ch); let y=0;
      for(let i=0;i<irLen;i++){
        const t=i/irLen, x=(Math.random()*2-1)*Math.pow(1-t,3), a=0.04+0.5*Math.pow(1-t,2);
        y+=(x-y)*a; d[i]=y*2*Math.min(1,i/(sr*0.012));
      }
    }
    const conv=c.createConvolver(); conv.buffer=ir;
    const verbIn=c.createGain(), verbOut=c.createGain(); verbOut.gain.value=0.7;
    verbIn.connect(conv); conv.connect(verbOut); verbOut.connect(masterAudioGain);
    const curve=new Float32Array(1024);
    for(let i=0;i<1024;i++){ const x=i/512-1; curve[i]=Math.tanh(x*3.5)/Math.tanh(3.5); }
    return (shotFx={brown,verbIn,curve});
  }
  function playShotSound(tankId='tiger',shooter=player){
    ensureAudio(); if(!audioContext||!masterAudioGain) return;
    const fx=ensureShotFx(); if(!fx) return;
    const c=audioContext, now=c.currentTime;
    const k=THREE.MathUtils.clamp((SHOT_CALIBER[tankId]||105)/105,0.72,1.75);
    const own=!shooter||shooter===player;
    const dist=own?0:shooter.group.position.distanceTo(camera.position);
    const t0=now+(own?0:Math.min(2.8,dist/343));
    // Per-shot output: distance volume + air absorption (high frequencies die first) + stereo position, plus a reverb send.
    const out=c.createGain(); out.gain.value=own?0.85:Math.max(0.1,0.95/(1+dist/65));
    const air=c.createBiquadFilter(); air.type='lowpass'; air.frequency.value=own?20000:Math.max(420,15000/(1+dist/40));
    out.connect(air);
    let tail=air;
    if(!own&&c.createStereoPanner){
      const rel=new THREE.Vector3().copy(shooter.group.position).sub(camera.position), el=camera.matrixWorld.elements, p=c.createStereoPanner();
      p.pan.value=THREE.MathUtils.clamp((rel.x*el[0]+rel.y*el[1]+rel.z*el[2])/Math.max(dist,1),-1,1)*0.85;
      air.connect(p); tail=p;
    }
    tail.connect(masterAudioGain);
    const send=c.createGain(); send.gain.value=own?0.42:Math.min(0.9,0.5+dist/400); tail.connect(send); send.connect(fx.verbIn);
    const env=(g,t,pk,att,dec)=>{ g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(pk,t+att); g.gain.exponentialRampToValueAtTime(0.0001,t+att+dec); };
    const noise=(buf,t,filt,f0,f1,sweep,pk,att,dec,q,shape)=>{
      const s=c.createBufferSource(); s.buffer=buf; s.loop=true;
      const f=c.createBiquadFilter(); f.type=filt; f.Q.value=q; f.frequency.setValueAtTime(f0,t); if(f1!==f0) f.frequency.exponentialRampToValueAtTime(f1,t+sweep);
      const g=c.createGain(); env(g,t,pk,att,dec);
      s.connect(f); let n=f; if(shape){ const w=c.createWaveShaper(); w.curve=fx.curve; f.connect(w); n=w; }
      n.connect(g); g.connect(out); s.start(t,Math.random()*0.4); s.stop(t+att+dec+0.05);
    };
    const tone=(t,f0,f1,sweep,pk,att,dec,type)=>{
      const o=c.createOscillator(); o.type=type; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f1,t+sweep);
      const g=c.createGain(); env(g,t,pk,att,dec); o.connect(g); g.connect(out); o.start(t); o.stop(t+att+dec+0.05);
    };
    const kk=1/Math.sqrt(k);
    noise(shotNoiseBuffer,t0,'highpass',1400,1400,0,0.7,0.0015,0.05+0.025*k,0.7,true);           // muzzle crack
    noise(shotNoiseBuffer,t0,'bandpass',3200,900,0.08,0.45,0.002,0.12*k,0.9,false);              // sharp report
    noise(fx.brown,t0,'lowpass',2800,240,0.5*k,1.25,0.004,0.5*k,0.8,true);                        // blast pressure wave
    noise(fx.brown,t0+0.02,'bandpass',150,110,0.4,0.7,0.02,0.85*k,0.9,false);                     // low body
    tone(t0,82*kk,32*kk,0.26*k,1.0,0.003,0.45*k,'sine');                                          // thump
    tone(t0,150*kk,60*kk,0.16*k,0.35,0.003,0.22*k,'triangle');                                    // punch (audible on small speakers)
    tone(t0+0.015,46*kk,21,0.8*k,0.65,0.01,0.85*k,'sine');                                        // sub drop
    noise(shotNoiseBuffer,t0+0.25,'lowpass',1000,180,1.4,0.16*k,0.18,1.3*k,0.5,false);            // outdoor tail
    noise(fx.brown,t0+0.55+Math.random()*0.35,'lowpass',380,150,0.8,0.32*k,0.06,0.7*k,0.7,false); // slap-back echo
    // The concussion of your own gun briefly knocks the surrounding ambience down, then it swells back.
    if(own&&ambientAudio){ const g=ambientAudio.bus.gain; g.cancelScheduledValues(now); g.setValueAtTime(0.3,now); g.linearRampToValueAtTime(1,now+1.8); }
  }
  function updateEngineSound(){
    if(!audioContext || !engineGain || !engineTone || !engineTone2) return;
    const load=Math.min(1,Math.abs(speed)/MAX_FWD),now=audioContext.currentTime;
    const synthesizedEngineLevel=lightEngineMix?0.018+load*0.025:0.022+Math.pow(load,1.35)*0.15;
    engineGain.gain.setTargetAtTime(synthesizedEngineLevel,now,0.24);
    engineTone.frequency.setTargetAtTime(34+load*24,now,0.22);
    engineTone2.frequency.setTargetAtTime(68+load*42,now,0.22);
    if(engineNoiseFilter)engineNoiseFilter.frequency.setTargetAtTime(100+load*130,now,0.22);
  }
  
  function playExplosionSound(){
    ensureAudio(); if(!audioContext || !masterAudioGain) return;
    playAudioClip(distantBlastClip,0.9);
    const now = audioContext.currentTime;
    // Deep rumble explosion
    const rumble = audioContext.createOscillator();
    rumble.type = 'sawtooth';
    rumble.frequency.setValueAtTime(80, now);
    rumble.frequency.exponentialRampToValueAtTime(25, now + 0.6);
    const rumbleGain = audioContext.createGain();
    rumbleGain.gain.setValueAtTime(0.7, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    rumble.connect(rumbleGain); rumbleGain.connect(masterAudioGain);
    rumble.start(now); rumble.stop(now + 0.7);
    
    // Crackle
    const crackle = audioContext.createBufferSource();
    crackle.buffer = shotNoiseBuffer;
    const crackleFilter = audioContext.createBiquadFilter();
    crackleFilter.type = 'lowpass';
    crackleFilter.frequency.setValueAtTime(2200, now);
    crackleFilter.frequency.exponentialRampToValueAtTime(400, now + 0.5);
    const crackleGain = audioContext.createGain();
    crackleGain.gain.setValueAtTime(0.6, now);
    crackleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    crackle.connect(crackleFilter); crackleFilter.connect(crackleGain);
    crackleGain.connect(masterAudioGain); crackle.start(now); crackle.stop(now + 0.6);
  }
  
  function playArmorHitSound(){
    ensureAudio(); if(!audioContext || !masterAudioGain) return;
    const now = audioContext.currentTime;
    const clang=audioContext.createOscillator();clang.type='triangle';clang.frequency.setValueAtTime(235,now);clang.frequency.exponentialRampToValueAtTime(92,now+0.16);
    const clangGain=audioContext.createGain();clangGain.gain.setValueAtTime(0.32,now);clangGain.gain.exponentialRampToValueAtTime(0.001,now+0.2);
    clang.connect(clangGain);clangGain.connect(masterAudioGain);clang.start(now);clang.stop(now+0.21);
    const rattle=audioContext.createBufferSource();rattle.buffer=shotNoiseBuffer;
    const filter=audioContext.createBiquadFilter();filter.type='bandpass';filter.frequency.value=780;filter.Q.value=1.2;
    const rattleGain=audioContext.createGain();rattleGain.gain.setValueAtTime(0.16,now);rattleGain.gain.exponentialRampToValueAtTime(0.001,now+0.11);
    rattle.connect(filter);filter.connect(rattleGain);rattleGain.connect(masterAudioGain);rattle.start(now);rattle.stop(now+0.12);
  }
  function playRicochetSound(){
    ensureAudio();if(!audioContext||!masterAudioGain)return;
    const now=audioContext.currentTime,ping=audioContext.createOscillator(),gain=audioContext.createGain();
    ping.type='sine';ping.frequency.setValueAtTime(1450,now);ping.frequency.exponentialRampToValueAtTime(520,now+0.19);
    gain.gain.setValueAtTime(0.17,now);gain.gain.exponentialRampToValueAtTime(0.001,now+0.2);
    ping.connect(gain);gain.connect(masterAudioGain);ping.start(now);ping.stop(now+0.21);
    const ring=audioContext.createOscillator(),ringGain=audioContext.createGain();ring.type='triangle';ring.frequency.value=680;
    ringGain.gain.setValueAtTime(0.001,now);ringGain.gain.setValueAtTime(0.075,now+0.035);ringGain.gain.exponentialRampToValueAtTime(0.001,now+0.3);
    ring.connect(ringGain);ringGain.connect(masterAudioGain);ring.start(now+0.035);ring.stop(now+0.31);
  }
  function playPenetrationSound(){
    ensureAudio();if(!audioContext||!masterAudioGain)return;
    const now=audioContext.currentTime,thud=audioContext.createOscillator(),gain=audioContext.createGain();
    thud.type='triangle';thud.frequency.setValueAtTime(155,now);thud.frequency.exponentialRampToValueAtTime(48,now+0.25);
    gain.gain.setValueAtTime(0.4,now);gain.gain.exponentialRampToValueAtTime(0.001,now+0.28);
    thud.connect(gain);gain.connect(masterAudioGain);thud.start(now);thud.stop(now+0.29);
    const snap=audioContext.createBufferSource();snap.buffer=shotNoiseBuffer;
    const snapFilter=audioContext.createBiquadFilter();snapFilter.type='highpass';snapFilter.frequency.value=900;
    const snapGain=audioContext.createGain();snapGain.gain.setValueAtTime(0.28,now);snapGain.gain.exponentialRampToValueAtTime(0.001,now+0.085);
    snap.connect(snapFilter);snapFilter.connect(snapGain);snapGain.connect(masterAudioGain);snap.start(now);snap.stop(now+0.09);
  }
  function captureMouse(){
    if(document.pointerLockElement === document.body || !document.body.requestPointerLock) return;
    try{
      const request=document.body.requestPointerLock();
      if(request && request.catch) request.catch(()=>{});
    } catch(_){ /* Keep the visible-cursor controls if pointer lock is unavailable. */ }
  }
  window.addEventListener('keydown', e=>{
    keys[e.key.toLowerCase()] = true;
    if(e.key === '0'){
      freeCam = !freeCam;
      if(freeCam){
        freeCamPos.copy(camera.position); freeCamYaw = viewYaw; freeCamPitch = viewPitch;
        orbitDragging = false; // don't fight the held over-turret view
        captureMouse();
      }
      // Hide the HUD/reticle clutter for clean screenshots while free-cam is out; restore it on exit.
      ['hud','aimReticle','gunCrosshair','turretCircle','tankIndicator','scopeTitle','scopeZoom','instructions'].forEach(id=>{
        const el=document.getElementById(id); if(el) el.style.display = freeCam ? 'none' : '';
      });
      const hint=document.getElementById('freeCamHint'); if(hint) hint.style.display = freeCam ? 'block' : 'none';
    }
    if(e.key === 'Shift' && !freeCam && !player.isAircraft) setAimView(true);
    if(e.code === 'Space' && !player.isAircraft) { fire(); e.preventDefault(); }
    if(e.key.toLowerCase()==='f' && !freeCam && !player.isAircraft) useExtinguisher();
    if(e.key.toLowerCase()==='c' && !freeCam){
      if(player.isAircraft){
        player.cockpitView = !player.cockpitView;
        // Pointer lock keeps the physical mouse at the screen centre in cockpit mode.
        // The cockpit camera then looks along the persistent aim direction, so the green aim cue
        // doesn't drift to the screen edges as the jet turns underneath it.
        if(player.cockpitView) captureMouse();
      } else cameraLocked = !cameraLocked;
    }
    if(e.key.toLowerCase()==='g' && !freeCam && player.isAircraft && !e.repeat){
      player.gearDeployed = !player.gearDeployed;
    }
    if(e.key.toLowerCase()==='i' && !freeCam && player.isAircraft && !e.repeat) planeProtect = !planeProtect;   // instructor stall protection
    if(e.key.toLowerCase()==='t' && !freeCam && player.isAircraft && !e.repeat) planeTVC = !planeTVC;           // thrust vectoring on/off (V is taken by the cinematic-look toggle)
    if(e.key.toLowerCase()==='x' && !freeCam && player.isAircraft && !e.repeat){       // cobra / post-stall manual law: alpha+g limiter off, mouse up/down + E/Q pitch the nose directly
      planeCobra = !planeCobra; planeCobraStick = 0;
      if(planeFM){ const st=planeFM.state; if(st.speed>5) planeAimPitch=THREE.MathUtils.clamp(Math.asin(THREE.MathUtils.clamp(st.vy/st.speed,-1,1)),-1.25,1.25); }   // leave cobra: aim ring back on the flight path so the instructor doesn't snap the nose
    }
    // Shell switching (1, 2, 3, etc.) for tanks with multiple shell types
    if(player.availableShells && (e.key >= '1' && e.key <= '9')){
      const shellIndex = parseInt(e.key) - 1;
      if(shellIndex < player.availableShells.length && shellIndex !== player.currentShellIndex){
        player.currentShellIndex = shellIndex;
        const newShell = player.availableShells[shellIndex];
        player.config.shell = newShell;
        // Update shell speed if specified in shell config
        if(newShell.shellSpeed) player.config.shellSpeed = newShell.shellSpeed;
        if(newShell.damage) player.config.damage = newShell.damage;
        reloadTime = player.config.reloadTime; // Reset reload when switching shells
        const shellTypeEl = document.getElementById('shellType');
        if(shellTypeEl){
          shellTypeEl.textContent = newShell.name;
          shellTypeEl.style.display = 'block';
        }
      }
    }
  });
  window.addEventListener('keyup', e=> {
    keys[e.key.toLowerCase()] = false;
    if(e.key === 'Shift') setAimView(false);
  });
  window.addEventListener('blur', ()=>{ keys.shift = false; setAimView(false); });
  function setAimView(active){
    if(aimView === active) return;
    aimView = active;
    if(active){
      captureMouse();
    } else {
      // Hand the sight direction back to the chase camera so the view doesn't snap.
      const d=aimWorldPoint.clone().sub(aimOrigin()).normalize();
      viewYaw=Math.atan2(d.x,d.z); viewPitch=THREE.MathUtils.clamp(Math.asin(d.y),-0.45,0.38);
    }
    if(!active) document.body.classList.remove('aiming'); // the scope overlay fades in from updateCamera as the view settles
  }

  // Chrome sometimes reports one huge bogus movement right when pointer lock turns on or off; that used to
  // whip the camera around. Ignore mouse input for a moment after a lock change, and throw out absurd deltas.
  let mouseIgnoreUntil=0;
  document.addEventListener('pointerlockchange',()=>{ mouseIgnoreUntil=performance.now()+120; });
  window.addEventListener('mousemove', e=>{
    if(performance.now()<mouseIgnoreUntil) return;
    const locked=document.pointerLockElement===document.body;
    if(Math.abs(e.movementX)>400||Math.abs(e.movementY)>400) return;
    const mx=THREE.MathUtils.clamp(e.movementX,-150,150), my=THREE.MathUtils.clamp(e.movementY,-150,150);
    if(player.isAircraft && !freeCam){
      if(orbitDragging){   // hold right mouse button: look around the jet; release and the view swings back
        planeLookYaw = THREE.MathUtils.clamp(planeLookYaw - mx*0.004, -Math.PI, Math.PI);
        planeLookPitch = THREE.MathUtils.clamp(planeLookPitch - my*0.003, -1.2, 1.2);
        return;
      }
      // Mouse aim: the mouse moves a PERSISTENT aim direction in the world (it stays where you leave it; nothing
      // decays). The instructor in flight.js rolls and pulls the jet towards it (see updatePlaneFlight).
      planeAimYaw -= mx*0.0030;                                   // screen-right is -X, and yaw is measured towards +X
      planeAimYaw = Math.atan2(Math.sin(planeAimYaw),Math.cos(planeAimYaw));
      if(planeCobra){   // cobra mode: the instructor is off on the pitch axis, so mouse up/down drives the pitch stick directly (springs back to centre = hold pitch rate at zero)
        planeCobraStick = THREE.MathUtils.clamp(planeCobraStick - my*0.012, -1, 1);   // mouse up = nose up
      } else planeAimPitch = THREE.MathUtils.clamp(planeAimPitch - my*0.0026, -1.25, 1.25);   // mouse up = aim up
      return;
    }
    if(freeCam){
      freeCamYaw -= mx*0.0024;
      freeCamPitch = THREE.MathUtils.clamp(freeCamPitch - my*0.0018, -1.5, 1.5);
      return;
    }
    if(aimView){
      // Gunner sight: sensitivity scales with the zoom, so a magnified view doesn't feel twitchy.
      const zoomScale=sightFov/10;
      retargetWorldAim(mx,my,(locked?0.00012:0.0006)*zoomScale,(locked?0.00008:0.0004)*zoomScale);
      return;
    }
    if(orbitDragging) return; // right-click holds the over-turret view instead of free-looking
    // Chase view: the mouse turns the camera 1:1; the gun follows the point under the screen centre.
    viewYaw -= mx*0.0024;
    viewPitch = THREE.MathUtils.clamp(viewPitch - my*0.0018, -0.5, 0.42);
  });
  window.addEventListener('mousedown', e=>{
    if(e.button === 0){ captureMouse(); if(!player.isAircraft) fire(); }
    if(e.button === 2 && !freeCam) orbitDragging = true;
  });
  window.addEventListener('mouseup', e=>{
    if(e.button === 2) orbitDragging = false;
  });
  window.addEventListener('mouseleave', ()=> orbitDragging = false);
  window.addEventListener('contextmenu', e=> e.preventDefault());
  window.addEventListener('wheel', e=>{
    const step=THREE.MathUtils.clamp(e.deltaY,-120,120);
    if(freeCam){          // free cam: scroll changes fly speed instead of zoom/distance
      freeCamSpeed=THREE.MathUtils.clamp(freeCamSpeed-step*0.1,2,100);
      return;
    }
    if(player.isAircraft){
      if(player.cockpitView){
        // In the Su-30 cockpit, mouse wheel changes lens FOV rather than chase-camera distance.
        // Scroll up (negative deltaY) narrows the FOV to zoom in; scroll down zooms out.
        e.preventDefault();
        cockpitFovOffset=THREE.MathUtils.clamp(cockpitFovOffset+step*0.08,-22,35);
        return;
      }
      planeCamDistTarget=THREE.MathUtils.clamp(planeCamDistTarget+step*0.03,9,48);
      return;
    }
    if(aimView){            // gunner sight: scroll changes magnification
      sightFov=THREE.MathUtils.clamp(sightFov+step*0.012,SIGHT_FOV_MIN,SIGHT_FOV_MAX);
      const el=document.getElementById('scopeZoom');
      if(el) el.innerHTML=Math.round(7*Math.tan(5*Math.PI/180)/Math.tan(sightFov*Math.PI/360))+'× &nbsp; / &nbsp; GUN SIGHT';
      return;
    }
    camDistTarget=THREE.MathUtils.clamp(camDistTarget+step*0.012,CAM_DIST_MIN,CAM_DIST_MAX); // third person: scroll = camera distance
  }, {passive:false});

  // ---------- Projectiles & fire cooldown ----------
  const projectiles = [];
  let cameraKick = 0;
  // Trauma-style camera shake: 0..1, fed by nearby blasts, hits and our own gun. Shake size follows trauma squared, so
  // small events are barely felt and big ones are short and sharp. It decays in a fraction of a second, is weakened in
  // the gunner sight, and (like cameraKick) is applied to the frame's final pose only, so it never changes aiming.
  let camTrauma = 0;
  const _shakeE = new THREE.Euler(0,0,0,'YXZ');
  // Camera pose before kick/shake, read by the motion-blur pass so shake does not smear the picture.
  const blurPos = new THREE.Vector3(), blurQuat = new THREE.Quaternion();
  const METERS_PER_WORLD_UNIT=7.5/3.6;
  const GRAVITY_WORLD=9.81/METERS_PER_WORLD_UNIT;
  const SPOTTING_RANGE_METERS={light:700,medium:250,heavy:200,tankDestroyer:250};
  let spottingClock=0;
  function updateSpotting(dt){
    spottingClock+=dt;
    const observers=[player,...allies].filter(unit=>!unit.destroyed);
    for(const enemy of enemies){
      if(enemy.destroyed){ enemy.teamMarker.visible=false; continue; }
      const detected=observers.some(observer=>{
        const dx=observer.group.position.x-enemy.group.position.x;
        const dz=observer.group.position.z-enemy.group.position.z;
        const distanceMeters=Math.hypot(dx,dz)*METERS_PER_WORLD_UNIT;
        const observerClass=observer.config.spotClass || 'medium';
        const observerRange=SPOTTING_RANGE_METERS[observerClass] || 250;
        return distanceMeters<=observerRange;
      });
      if(detected) enemy.spottedUntil=spottingClock+2.5;
      enemy.teamMarker.visible=detected || spottingClock<(enemy.spottedUntil||0);
    }
  }
  const shellBodyMat = new THREE.MeshStandardMaterial({color:0xb7a36d,metalness:0.72,roughness:0.28});
  const shellTipMat = new THREE.MeshStandardMaterial({color:0x8d9387,metalness:0.8,roughness:0.24});
  const shellBandMat = new THREE.MeshStandardMaterial({color:0xc64d22,emissive:0x361008,metalness:0.35,roughness:0.35});
  const tracerMat = new THREE.LineBasicMaterial({color:0xffc16b,transparent:true,opacity:0.62});
  const FIRE_COOLDOWN = config.reloadTime;
  let reloadRemaining = 0, reloadDuration = 0;
  // Autoloader magazine system for IS-7
  let shotsInMagazine = config.magazineSize || 0;
  let isReloadingMagazine = false;
  const reloadEl = document.getElementById('reload');
  function muzzlePosition(tank,tankId){
    tank.group.updateMatrixWorld(true);
    const muzzleOffsets = {tiger: 3.34, panther: 3.53, sturer: 4.43, is7: 4.88, t54e1: 4.9, amx50: 5.4, leopard1a5: 3.65, m1abrams: 3.1, t72b: 3.74, challenger1: 4.62, k1: 3.2};
    return tank.barrelPitchPivot.localToWorld(new THREE.Vector3(0,0,muzzleOffsets[tankId] || 3.53));
  }
  // Aim from a fixed point on the turret, so slewing the gun never moves its own aim origin.
  function aimOrigin(){
    player.group.updateMatrixWorld(true);
    return player.turretPivot.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,0.4,0));
  }
  // The point under the screen-centre cursor, War Thunder style.
  // One ray from the camera through the screen centre; the first solid thing it touches IS the aim point, and
  // the gun converges on that exact point (so the barrel sits slightly off the reticle line by the camera/gun
  // parallax, just like War Thunder's separate gun marker). Rules:
  //  - Instant: no smoothing, no hysteresis. The point is whatever the ray lands on this frame.
  //  - Solid = terrain, buildings (map solidAt), and ANY tank: enemy, ally or wreck.
  //  - Only the stretch of ray right at the gun is skipped (AIM_MIN_HIT_RANGE), so the camera/hull edge can't
  //    snag it. A wall 15 units away is a real target, same as War Thunder.
  //  - Nothing hit (sky, off-map) -> the gun converges on the far horizon (AIM_MAX_RANGE).
  // The point may jump; the barrel may not. update() chases it with moveHeavyAxis(), capped by
  // TURRET_SPEED / TURRET_PITCH_SPEED, so the gun itself stays heavy and slow.
  const AIM_MIN_HIT_RANGE=6;     // world units from the turret: only hits this close to the gun are skipped
  const AIM_MAX_RANGE=Math.max(400,groundSize*1.5); // longer than any possible shot on the map, so far targets can still be picked
  const _aimP=new THREE.Vector3();
  // Armour plates only matter to a ray if their tank is anywhere near it. Testing one bounding sphere per tank first
  // (instead of handing every plate of every tank to the raycaster, in a freshly built array, every frame) removes most
  // of the cost and nearly all of the garbage. The radius is far larger than any hull + turret, so results are unchanged.
  const PICK_RADIUS=10, _pickSph=new THREE.Sphere(new THREE.Vector3(),PICK_RADIUS), _pickMeshes=[];
  function gatherMeshesNearRay(ray){
    _pickMeshes.length=0;
    for(let k=0;k<2;k++){
      const list=k?allies:enemies;
      for(let i=0;i<list.length;i++){
        const ms=list[i].armorMeshes;
        if(!ms||!ms.length) continue;
        _pickSph.center.copy(list[i].group.position); _pickSph.center.y+=1.5;
        if(ray.intersectsSphere(_pickSph)) for(let j=0;j<ms.length;j++) _pickMeshes.push(ms[j]);
      }
    }
    return _pickMeshes;
  }
  function cameraAimPoint(){
    const origin=chasePos, cpAim=Math.cos(viewPitch);
    const direction=new THREE.Vector3(Math.sin(viewYaw)*cpAim,Math.sin(viewPitch),Math.cos(viewYaw)*cpAim);
    // Distance along the view ray to the point level with the turret. Everything before it is behind the gun.
    const pivotAlong=Math.max(0,aimOrigin().sub(origin).dot(direction));
    const nearLimit=pivotAlong+AIM_MIN_HIT_RANGE;
    const farLimit=pivotAlong+AIM_MAX_RANGE;
    let hitDistance=farLimit;                       // default: far horizon
    // Tanks (every one, including allies and wrecks): the raycaster's near/far window drops anything too close.
    shellRay.set(origin,direction); shellRay.near=nearLimit; shellRay.far=farLimit;
    const targetMeshes=gatherMeshesNearRay(shellRay.ray);
    const hits=targetMeshes.length?shellRay.intersectObjects(targetMeshes,false):[];
    shellRay.near=0; shellRay.far=Infinity;
    if(hits.length) hitDistance=hits[0].distance;
    // Terrain and buildings: march outward from the minimum range until the ray is inside something solid.
    const blockedAt=d=>{
      _aimP.copy(origin).addScaledVector(direction,d);
      return _aimP.y<=terrainHeightAt(_aimP.x,_aimP.z) || (mapSolidAt && mapSolidAt(_aimP.x,_aimP.y,_aimP.z));
    };
    // Already inside solid at the minimum range means the contact was right at the gun, so it is skipped.
    if(!blockedAt(nearLimit)){
      let previousDistance=nearLimit,solidDistance=Infinity;
      // Fine steps near the gun, growing 2% per unit of distance further out (about 225 samples to 400 units instead of
      // 1577). Distant terrain and buildings are large, so coarse steps cannot skip them, and the bisection below
      // refines the exact contact point.
      for(let distance=nearLimit;distance<hitDistance;distance+=Math.max(0.25,(distance-nearLimit)*0.02)){
        if(blockedAt(distance)){solidDistance=distance;break;}
        previousDistance=distance;
      }
      if(Number.isFinite(solidDistance)){
        let lo=previousDistance,hi=solidDistance;
        for(let i=0;i<10;i++){const mid=(lo+hi)*0.5; if(blockedAt(mid))hi=mid;else lo=mid;}
        hitDistance=Math.min(hitDistance,hi);
      }
    }
    // Nothing hit: the barrel must run PARALLEL to the view ray. Converging on a point a fixed distance out along a
    // ray that starts at the (higher, further back) camera tilts the barrel up by (camera height / distance), which
    // at long range is as big as the bullet drop and made far shots overshoot.
    if(hitDistance>=farLimit-1e-3) return aimOrigin().addScaledVector(direction,AIM_MAX_RANGE);
    return origin.clone().addScaledVector(direction,hitDistance);   // instant, no filter
  }
  // Distance along the barrel's own axis to the first thing it points at (tank, terrain, building), no gravity.
  // The gunner sight sits above the barrel, so the sight line and the shell's line are parallel but ~1.6 units apart;
  // the sight is focused on this range so the reticle centre is exactly where the barrel axis is pointing.
  const BARREL_MIN_RANGE=40;
  function barrelRange(o,d){
    let R=AIM_MAX_RANGE;
    shellRay.set(o,d); shellRay.near=3; shellRay.far=AIM_MAX_RANGE;
    const meshes=gatherMeshesNearRay(shellRay.ray);
    const hits=meshes.length?shellRay.intersectObjects(meshes,false):[];
    shellRay.near=0; shellRay.far=Infinity;
    if(hits.length) R=hits[0].distance;
    for(let dist=3;dist<R;dist+=Math.max(0.25,dist*0.012)){
      const x=o.x+d.x*dist,y=o.y+d.y*dist,z=o.z+d.z*dist;
      if(y<=terrainHeightAt(x,z)||(mapSolidAt&&mapSolidAt(x,y,z))){R=dist;break;}
    }
    return Math.max(BARREL_MIN_RANGE,R);
  }
  let sightInvR=1/AIM_MAX_RANGE;   // smoothed 1/range the sight is focused at
  function retargetWorldAim(dx,dy,yawSensitivity,pitchSensitivity){
    if(dx===0 && dy===0) return;
    const origin=aimOrigin();
    const direction=aimWorldPoint.clone().sub(origin).normalize();
    let yaw=Math.atan2(direction.x,direction.z)-dx*yawSensitivity;
    let elevation=Math.atan2(direction.y,Math.hypot(direction.x,direction.z))-dy*pitchSensitivity;
    elevation=THREE.MathUtils.clamp(elevation,-0.22,0.28);
    const cosElevation=Math.cos(elevation);
    direction.set(Math.sin(yaw)*cosElevation,Math.sin(elevation),Math.cos(yaw)*cosElevation);
    aimWorldPoint.copy(origin).addScaledVector(direction,aimRange);
  }
  player.group.updateMatrixWorld(true);
  const initialAimOrigin=muzzlePosition(player,tankId);
  const initialAimDirection=player.barrelPitchPivot.localToWorld(new THREE.Vector3(0,0,1))
    .sub(player.barrelPitchPivot.getWorldPosition(new THREE.Vector3())).normalize();
  aimWorldPoint.copy(initialAimOrigin).addScaledVector(initialAimDirection,aimRange);
  function launchShell(tip,dir,damage,owner,shooter=player){
    const proj = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.09,0.62,12),shellBodyMat);
    body.position.y = -0.02;
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.075,0.24,12),shellTipMat);
    nose.position.y = 0.41;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.092,0.092,0.075,12),shellBandMat);
    band.position.y = -0.25;
    proj.add(body,nose,band);
    proj.position.copy(tip);
    proj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);
    proj.traverse(part=>{if(part.isMesh) part.castShadow=true;});
    scene.add(proj);
    const trailPositions = new Float32Array(6);
    const trailGeometry = new THREE.BufferGeometry();
    trailGeometry.setAttribute('position',new THREE.BufferAttribute(trailPositions,3));
    const trail = new THREE.Line(trailGeometry,tracerMat);
    trail.frustumCulled = false;
    scene.add(trail);
    const weapon=shooter.config||config;
    const speed=weapon.shellSpeed/METERS_PER_WORLD_UNIT;
    projectiles.push({mesh:proj,trail,dir:dir.clone(),velocity:dir.clone().multiplyScalar(speed),speed,life:2.2,damage,owner,team:shooter.team||'blue',shooter,shell:weapon.shell,dist:0});
  }
  // Shot dispersion in radians. A tank with an accuracyFalloff is perfectly accurate up to perfectKmh and loses
  // accuracy linearly towards topKmh (the Leopard 1A5's stabilizer cannot keep up at full speed).
  function shotSpread(cfg,kmh){
    let s=(1-cfg.accuracy)*0.15; const f=cfg.accuracyFalloff;
    if(f&&kmh>f.perfectKmh) s+=f.maxSpread*Math.min(1,(kmh-f.perfectKmh)/(f.topKmh-f.perfectKmh));
    return s;
  }
  function fire(){
    if(player.destroyed || M.over) return;
    if(reloadRemaining > 0) return;
    if(isReloadingMagazine) return; // Can't fire while reloading magazine
    
    // IS-7 autoloader: check magazine
    if(config.magazineSize && shotsInMagazine <= 0) return;
    
    const tip=muzzlePosition(player,tankId);
    const spread = shotSpread(config, Math.abs(speed)*7.5);
    const spreadYaw = (Math.random() - 0.5) * spread;
    const spreadPitch = (Math.random() - 0.5) * spread;
    player.group.updateMatrixWorld(true);
    const dir=player.barrelPitchPivot.localToWorld(new THREE.Vector3(0,0,1))
      .sub(player.barrelPitchPivot.getWorldPosition(new THREE.Vector3())).normalize();
    dir.applyAxisAngle(new THREE.Vector3(0,1,0),spreadYaw)
      .applyAxisAngle(new THREE.Vector3(1,0,0),spreadPitch).normalize();
    launchShell(tip,dir,config.damage,'player');
    M.shots++;
    triggerGunEffect(player,tankId,dir);
    playAudioClip(tankReloadClip,0.48,0.18);
    
    // Autoloader mechanics for IS-7
    if(config.magazineSize){
      shotsInMagazine--;
      if(shotsInMagazine <= 0){
        // Magazine empty, start full reload
        isReloadingMagazine = true;
        reloadRemaining = config.magazineReloadTime;
      } else {
        // Still have shots in magazine, normal reload between shots
        reloadRemaining = FIRE_COOLDOWN;
      }
    } else {
      // Standard reload for non-autoloader tanks
      reloadRemaining = FIRE_COOLDOWN;
    }
    reloadDuration = reloadRemaining;
    updateReloadHUD();
  }
  function updateReloadHUD(){
    const progress=reloadRemaining>0&&reloadDuration>0?THREE.MathUtils.clamp(1-reloadRemaining/reloadDuration,0,1):1;
    const aimRing=document.getElementById('aimCursor');
    const sightRing=document.getElementById('gunCrosshair');
    [aimRing,sightRing].forEach(ring=>{
      if(!ring) return;
      ring.style.setProperty('--reload-progress',(progress*100).toFixed(1)+'%');
      ring.classList.toggle('reloading',reloadRemaining>0);
      ring.classList.toggle('reload-ready',reloadRemaining<=0);
    });
    if(isReloadingMagazine){
      reloadEl.textContent = 'RELOADING MAGAZINE';
      reloadEl.style.opacity = '1.0';
      reloadEl.style.color = '#ff9a3c';
    } else if(reloadRemaining > 0){
      reloadEl.textContent = 'RELOADING';
      reloadEl.style.opacity = '0.9';
      reloadEl.style.color = '';
    } else {
      if(config.magazineSize){
        reloadEl.textContent = 'MAG: ' + shotsInMagazine + '/' + config.magazineSize;
        reloadEl.style.opacity = shotsInMagazine > 2 ? '0.7' : '0.95';
        reloadEl.style.color = shotsInMagazine <= 2 ? '#d6903c' : '';
      } else {
        reloadEl.textContent = 'Ready';
        reloadEl.style.opacity = '0.6';
        reloadEl.style.color = '';
      }
    }
  }
  updateReloadHUD(); // Initialize reload/magazine HUD after magazine state exists.

  // ---------- Camera: adjustable chase zoom plus a held over-turret view ----------
  let orbitAngle = Math.PI;   // current camera yaw (world space)
  let orbitPitch = 0.18;      // current camera pitch (radians above horizontal) - much lower for heavy feel
  const defaultPitch = 0.18;
  let viewYaw = 0, viewPitch = -0.06;   // mouse-driven view direction (world space)
  let orbitDragging = false;
  let cameraLocked = false; // 'C' toggles this: when true, the camera stops snapping back behind the hull
  // Free-fly camera for reference screenshots: '0' toggles it. Detached from the tank entirely - no
  // distance clamp, no terrain collision, no driving - so it can be pulled back arbitrarily far for a
  // clean, unobstructed front/side/rear/top-down shot instead of fighting the chase-cam's limits.
  let freeCam = false, freeCamYaw = 0, freeCamPitch = 0, freeCamSpeed = 14;
  const freeCamPos = new THREE.Vector3();
  // Fixed vertical FOV for the third-person view; scrolling changes distance instead (like War Thunder).
  const CHASE_FOV = 40, CAM_DIST_MIN = 6, CAM_DIST_MAX = 12, CAM_PIVOT_HEIGHT = 2.85;
  const SIGHT_FOV_MIN = 4, SIGHT_FOV_MAX = 14;
  let camDistTarget = 9.5, camDistZoom = 9.5;   // closer default chase view; scroll still adjusts distance
    const _fe=new THREE.Euler(0,0,0,'YXZ'), _pcNose=new THREE.Vector3(), _pcSmooth=new THREE.Vector3(0,0,1), _pcLook=new THREE.Vector3();
  const _pcQ=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI);
  let _pcFov=40;   // eased speed-dependent field of view
  let cockpitFovOffset=0; // user-controlled cockpit zoom: negative narrows FOV, positive widens it
  // Declared up here (not next to their functions) because the camera is built once at startup, before the flight code below runs.
  let planeFM=null;
  const SPK_N=160, SPK_AHEAD=170, SPK_RMIN=8, SPK_RMAX=72;
  let spk=null, spkFade=0, _spkSeed=true;
  const _skV=new THREE.Vector3(), _skU=new THREE.Vector3(), _skW=new THREE.Vector3(), _skS=new THREE.Vector3(), _skR=new THREE.Vector3();
  let _pcInit=false, _pcCobra=0;   // _pcCobra: 0..1 eased blend into the cobra camera
  const _pcEye=new THREE.Vector3(), _pcHeadE=new THREE.Euler(), _pcHeadQ=new THREE.Quaternion(), _pcFlipQ=new THREE.Quaternion(0,1,0,0);
  // Depth precision: the airport map draws out to 7000 units, and with near = 0.1 flat decals (runway paint, taxiway lines)
  // shimmer in motion. The chase camera is never closer than ~9 units to the jet, so it can use a much larger near plane;
  // only the cockpit view needs the small one.
  function setPlaneNear(n){ if(Math.abs(camera.near-n)>1e-4){ camera.near=n; camera.updateProjectionMatrix(); } }
  const _pcUp2=new THREE.Vector3(0,1,0), _pcBank=new THREE.Vector3(0,1,0);
  let planeLookYaw=0, planeLookPitch=0;   // free-look offsets (hold right mouse button)
  let _pcYaw=0, _pcPitch=0, _pcTgtYaw=0;  // horizon-locked chase camera: smoothed view heading and pitch
  let planeAimYaw=0, planeAimPitch=0;     // the persistent aim direction (world yaw towards +X, pitch up)
  let planeProtect=true, planeTVC=true, planeCobra=false, planeCobraStick=0;   // I = instructor stall protection, T = thrust vectoring, X = cobra / post-stall mode
  let gearSusp=null, gearWasOnGround=true, gearPrevVy=0;   // oleo-strut suspension state, see applyGearSuspension()
  const _pcP=new THREE.Vector3();
  let planeAimEl=null, planeNoseEl=null;  // on-screen aim ring / nose chevron (created on first use)
  const _pcDir=new THREE.Vector3(), _pcAxis=new THREE.Vector3(), _pcUp=new THREE.Vector3(0,1,0);
  let planeCamDistTarget = 20, planeCamDist = 20; const planeChaseCamPos = new THREE.Vector3(); // aircraft chase-cam state
  let camDistClear = 13;                      // distance actually allowed by the terrain in the way
  let sightFov = 10, sightBlend = 0;          // gunner-sight magnification, and 0 (chase) -> 1 (sight) transition
  let camPivotY = null;                       // low-passed pivot height, so suspension bounce doesn't shake the view
  let overheadBlend = 0;                      // smooth transition to held right-click over-turret view
  let camFrame = 0, camRigFrame = -1;          // lets updateCamera rebuild the chase pose if nothing did this frame (e.g. player destroyed)
  let camRealDt = 1/60;                       // real frame time (the kill-cam slow motion must not slow the camera)
  viewYaw = player.group.rotation.y;
  const chasePos = new THREE.Vector3(), chaseQuat = new THREE.Quaternion();
  const chaseGoal = new THREE.Vector3();
  let chaseSmoothReady = false;
  const sightPosS = new THREE.Vector3(), sightQuatS = new THREE.Quaternion();
  let sightSmoothReady = false;
  const camTmp = new THREE.PerspectiveCamera();   // lookAt helper with camera (-Z) semantics
  const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _q1 = new THREE.Quaternion();
  const gunCrosshair = document.getElementById('gunCrosshair');
  const turretCircle = document.getElementById('turretCircle');
  const aimCursor = document.createElement('div'); aimCursor.id='aimCursor'; document.body.appendChild(aimCursor);
  updateReloadHUD();
  const projectedAim = new THREE.Vector3();
  function angleLerp(a, b, t){
    let diff = ((b - a + Math.PI) % (Math.PI*2)) - Math.PI;
    if(diff < -Math.PI) diff += Math.PI*2;
    return a + diff*t;
  }
  const damp = (rate,dt) => 1 - Math.exp(-rate*dt);

  // Third-person camera pose for the current mouse direction. The mouse sets the view direction exactly (no
  // rotation lag, so the aim point under the screen centre is always where you're looking). The lower, lightly
  // damped shoulder view leaves more space ahead of the tank while keeping the camera aim ray in sync.
  function updateChaseRig(dt){
    camRigFrame = camFrame;
    dt = Math.min(dt, 1/20);
    const gp = player.group.position;
    if(camPivotY === null) camPivotY = gp.y;
    camPivotY += (gp.y - camPivotY) * damp(7, dt);
    camPivotY = THREE.MathUtils.clamp(camPivotY, gp.y-0.8, gp.y+0.8);      // never lag far behind a real climb/drop
    camDistZoom += (camDistTarget - camDistZoom) * damp(10, dt);

    const cp = Math.cos(viewPitch);
    _v1.set(Math.sin(viewYaw)*cp, Math.sin(viewPitch), Math.cos(viewYaw)*cp);     // view direction
    _v2.set(gp.x, camPivotY + CAM_PIVOT_HEIGHT, gp.z);                              // pivot
    // Terrain between pivot and camera: march outward, stop short of the first spot that is inside the ground.
    let allowed = camDistZoom;
    for(let d=1.5; d<=camDistZoom; d+=0.75){
      const x=_v2.x-_v1.x*d, y=_v2.y-_v1.y*d, z=_v2.z-_v1.z*d;
      if(y < terrainHeightAt(x,z)+0.9){ allowed = Math.max(2.2, d-0.9); break; }
    }
    // Come in at once, drift back out gently, so the camera never pops through terrain nor jerks back.
    camDistClear = allowed < camDistClear ? allowed : camDistClear + (allowed-camDistClear)*damp(3.5, dt);
    camDistClear = Math.min(camDistClear, camDistZoom);
    const shoulder = (aimView || orbitDragging) ? 0 : 0.82;
    chaseGoal.set(_v2.x-_v1.x*camDistClear + Math.cos(viewYaw)*shoulder,
      _v2.y-_v1.y*camDistClear,
      _v2.z-_v1.z*camDistClear - Math.sin(viewYaw)*shoulder);
    const goalFloor = terrainHeightAt(chaseGoal.x, chaseGoal.z) + 1.0;
    if(chaseGoal.y < goalFloor) chaseGoal.y = goalFloor;
    if(!chaseSmoothReady){ chasePos.copy(chaseGoal); chaseSmoothReady = true; }
    else chasePos.lerp(chaseGoal, damp(16, dt));
    const floor = terrainHeightAt(chasePos.x, chasePos.z) + 1.0;
    if(chasePos.y < floor) chasePos.y = floor;
    camTmp.position.copy(chasePos);
    camTmp.up.set(0,1,0);
    camTmp.lookAt(_v3.copy(chasePos).addScaledVector(_v1, 50));
    chaseQuat.copy(camTmp.quaternion);
    overheadBlend += ((orbitDragging?1:0)-overheadBlend)*damp(14,dt);
    if(overheadBlend>0.001){
      // Hold right-click for a close, elevated view just behind the turret, looking in barrel direction.
      const yaw=player.group.rotation.y,back=3.7;
      const overPos=new THREE.Vector3(gp.x-Math.sin(yaw)*back,gp.y+5.4,gp.z-Math.cos(yaw)*back);
      overPos.y=Math.max(overPos.y,terrainHeightAt(overPos.x,overPos.z)+1.2);
      player.group.updateMatrixWorld(true);
      // Look along the barrel direction instead of just at the turret
      const barrelDir = player.barrelPitchPivot.localToWorld(new THREE.Vector3(0,0,50))
        .sub(player.barrelPitchPivot.getWorldPosition(new THREE.Vector3()));
      const overTarget = player.turretPivot.getWorldPosition(new THREE.Vector3()).add(barrelDir.normalize().multiplyScalar(8));
      camTmp.position.copy(overPos);camTmp.lookAt(overTarget);
      chasePos.lerp(overPos,overheadBlend);chaseQuat.slerp(camTmp.quaternion,overheadBlend);
    }
    // Ground the camera at the chase pose now: the aim ray for this frame's gun targeting uses it.
    if(sightBlend < 0.001 && !aimView){
      camera.position.copy(chasePos); camera.quaternion.copy(chaseQuat);
      if(camera.fov !== CHASE_FOV){ camera.fov = CHASE_FOV; camera.updateProjectionMatrix(); }
      camera.updateMatrixWorld(true);
    }
  }
  // Final camera for the frame: blends from the chase pose into the gunner sight (position, rotation and
  // zoom together) and back, then adds the recoil kick on top.
  // Free-fly pose: moves freeCamPos directly from WASD/Q/E (no vehicle, no terrain clamp, no distance
  // limit) and points the camera along freeCamYaw/freeCamPitch. Hold Shift to move faster.
  function updateFreeCamPose(dt){
    dt = Math.min(dt, 1/20);
    const cp = Math.cos(freeCamPitch);
    _v1.set(Math.sin(freeCamYaw)*cp, Math.sin(freeCamPitch), Math.cos(freeCamYaw)*cp); // forward
    _v2.set(Math.sin(freeCamYaw+Math.PI/2), 0, Math.cos(freeCamYaw+Math.PI/2));        // right
    const spd = freeCamSpeed * (keys['shift'] ? 3 : 1) * dt;
    if(keys['w']) freeCamPos.addScaledVector(_v1, spd);
    if(keys['s']) freeCamPos.addScaledVector(_v1, -spd);
    if(keys['d']) freeCamPos.addScaledVector(_v2, -spd); // _v2 as computed below points left, not right - swapped to fix inverted A/D
    if(keys['a']) freeCamPos.addScaledVector(_v2, spd);
    if(keys['e']) freeCamPos.y += spd;
    if(keys['q']) freeCamPos.y -= spd;
    camera.position.copy(freeCamPos);
    camTmp.position.copy(freeCamPos); camTmp.up.set(0,1,0);
    camTmp.lookAt(_v3.copy(freeCamPos).addScaledVector(_v1, 50));
    camera.quaternion.copy(camTmp.quaternion);
    if(camera.fov !== CHASE_FOV){ camera.fov = CHASE_FOV; camera.updateProjectionMatrix(); }
    camera.updateMatrixWorld(true);
  }
  function updateCamera(dt){
    dt = Math.min(camRealDt, 1/20);
    if(freeCam){ updateFreeCamPose(dt); return; }
    if(camRigFrame !== camFrame) updateChaseRig(dt);
    const target = aimView ? 1 : 0;
    sightBlend += (target - sightBlend) * damp(15, dt);
    if(Math.abs(target - sightBlend) < 0.004) sightBlend = target;
    document.body.classList.toggle('aiming', aimView && sightBlend > 0.6);

    let fov = CHASE_FOV;
    if(sightBlend > 0){
      // Sight pose from the barrel's real axis, so the optic stays aligned as hull, turret and gun move.
      player.group.updateMatrixWorld(true);
      const barrelOrigin = player.barrelPitchPivot.localToWorld(_v1.set(0,0,0));
      const sightTarget = player.barrelPitchPivot.localToWorld(_v2.set(0,0,100));
      _v3.copy(sightTarget).sub(barrelOrigin).normalize();                      // barrel direction
      const rawPos = player.turretPivot.getWorldPosition(new THREE.Vector3());
      rawPos.y += config.isCasemate ? 2.2 : 1.65;
      camTmp.position.copy(rawPos); camTmp.up.set(0,1,0);
      sightInvR+=(1/barrelRange(_v1,_v3)-sightInvR)*damp(10,dt);
      camTmp.lookAt(_v2.copy(_v1).addScaledVector(_v3,1/sightInvR));   // converge sight line onto the barrel line at range
      if(!sightSmoothReady){ sightPosS.copy(rawPos); sightQuatS.copy(camTmp.quaternion); sightSmoothReady = true; }
      const f = damp(sightBlend > 0.98 ? 22 : 40, dt);        // light smoothing only: no lag, just no jitter
      sightPosS.lerp(rawPos, f); sightQuatS.slerp(camTmp.quaternion, f);
      const e = sightBlend*sightBlend*(3 - 2*sightBlend);       // smoothstep ease
      camera.position.copy(chasePos).lerp(sightPosS, e);
      camera.quaternion.copy(chaseQuat).slerp(sightQuatS, e);
      fov = Math.exp(Math.log(CHASE_FOV) + (Math.log(sightFov) - Math.log(CHASE_FOV))*e);
    } else {
      sightSmoothReady = false;
      camera.position.copy(chasePos);
      camera.quaternion.copy(chaseQuat);
    }
    if(Math.abs(camera.fov - fov) > 1e-3){ camera.fov = fov; camera.updateProjectionMatrix(); }
    // Recoil / explosion kick: applied to this frame's pose only, so it never feeds back into aiming.
    blurPos.copy(camera.position); blurQuat.copy(camera.quaternion);
    if(cameraKick > 1e-4){ _q1.setFromAxisAngle(_v1.set(1,0,0), cameraKick); camera.quaternion.multiply(_q1); }
    cameraKick *= Math.exp(-dt*9);
    if(camTrauma > 0.002){
      const amp = camTrauma*camTrauma*0.016*(1-0.7*sightBlend), tt = performance.now()*0.001;
      const n = f => Math.sin(tt*f)+0.5*Math.sin(tt*f*2.37+1.7);   // smooth pseudo-noise
      _shakeE.set(n(47)*amp, n(39)*amp, n(31)*amp*0.6);
      _q1.setFromEuler(_shakeE); camera.quaternion.multiply(_q1);
    }
    camTrauma = Math.max(0, camTrauma*Math.exp(-dt*5) - dt*0.6);
    camera.updateMatrixWorld(true);
  }
  if(player.isAircraft){ planeChaseCamPos.copy(player.group.localToWorld(new THREE.Vector3(0,2.6+planeCamDist*0.12,-planeCamDist))); updatePlaneCamera(0); }
  else { updateChaseRig(0); sightBlend = 0; updateCamera(0); }

  // ---------- Game loop ----------
  const clock = new THREE.Clock();
  const fpsEl = document.getElementById('fps');
  let fpsElapsed = 0, fpsFrames = 0, fpsLastTime = performance.now(), fpsWorst = 0;
  // DOM writes restyle/relayout even when the value is identical, so HUD text, transforms and markup are cached.
  function setTxt(el,s){ if(el.__v!==s){ el.__v=s; el.textContent=s; } }
  function setHTML(el,s){ if(el.__v!==s){ el.__v=s; el.innerHTML=s; } }
  function setCss(el,s){ if(el.__t!==s){ el.__t=s; el.style.transform=s; } }
  const half = groundSize/2 - 2;

  // War Thunder-style momentum: throttle builds/decays speed, steering rate eases off at high speed
  let speed = 0; // units/sec, signed (negative = reverse)
  let hullTurnVelocity = 0;
  // Tank-specific physics
  const MAX_FWD = config.maxSpeed;
  const MAX_REV = config.maxRevSpeed;
  const ACCEL = config.accel;
  const BRAKE = config.accel * 1.8;
  const REVERSE_ACCEL = config.accel * 0.62;
  const FRICTION = config.accel * 0.24; // Let go of throttle and the tank coasts down gradually.
  const TURRET_SPEED = config.turretSpeed;
  const TURRET_PITCH_SPEED = config.turretPitchSpeed;
  const TURRET_ACCEL = TURRET_SPEED * 1.5;
  const TURRET_PITCH_ACCEL = TURRET_PITCH_SPEED * 1.5;
  let turretVelocity = 0;
  let barrelPitchVelocity = 0;
  let stabPrevQuat = null; // hull attitude last frame, for the gun stabilizer
  let lrfEl = null;
  if(config.laserRangefinder){
    lrfEl = document.createElement('div'); lrfEl.id = 'lrfReadout';
    lrfEl.style.cssText = 'position:fixed;left:calc(50% + 92px);top:calc(50% + 26px);font:700 13px/1.25 Arial,sans-serif;letter-spacing:.08em;color:#9dff9d;text-shadow:0 0 4px #000;pointer-events:none;z-index:6;white-space:nowrap';
    document.body.appendChild(lrfEl);
  }
  const speedEl = document.getElementById('speed');
  const tankHeadingEl = document.getElementById('tankHeading');
  const tankGlyphEl = document.getElementById('tankGlyph');
  const tankTurretGlyphEl = document.getElementById('tankTurretGlyph');
  const tankGearEl = document.getElementById('tankGear');
  const tankSpeedEl = document.getElementById('tankSpeed');

  function approach(value, target, amount){
    return value < target ? Math.min(target,value+amount) : Math.max(target,value-amount);
  }
  // Slope climbing: top speed on a grade is limited by engine power. The engine delivers P = hp * 745.7 W * eff, and
  // climbing at v needs F*v = m*g*(sin(theta) + Crr*cos(theta))*v, so v_max = P / (m*g*(sin + Crr*cos)).
  // High power/weight tanks (Abrams) keep moving on a hill, heavy low-power ones (Tiger, FV4005) crawl.
  // Downhill and flat ground are not limited here (the tank's normal top speed applies). `dir` = +1 forward, -1 reverse.
  const SLOPE_EFF=0.62, SLOPE_ROLL_RES=0.04, SLOPE_MIN_MS=0.8, SLOPE_PROBE=3.5;
  function slopeSpeedLimit(unit,cfg,dir){
    const hp=cfg.hp; if(!hp) return Infinity;
    const yaw=unit.group.rotation.y, fx=Math.sin(yaw)*dir, fz=Math.cos(yaw)*dir, p=unit.group.position;
    const grade=(terrainHeightAt(p.x+fx*SLOPE_PROBE,p.z+fz*SLOPE_PROBE)-terrainHeightAt(p.x-fx*SLOPE_PROBE,p.z-fz*SLOPE_PROBE))/(2*SLOPE_PROBE);
    const theta=Math.atan(grade), resist=Math.sin(theta)+SLOPE_ROLL_RES*Math.cos(theta);
    if(resist<=0) return Infinity;
    const ms=Math.max(SLOPE_MIN_MS, hp*745.7*SLOPE_EFF/((cfg.weight||50)*1000*9.81*resist));
    return ms/METERS_PER_WORLD_UNIT;
  }
  function moveHeavyAxis(current, velocity, error, maxSpeed, acceleration, dt){
    const desiredSpeed = Math.sign(error) * Math.min(maxSpeed, Math.sqrt(2*acceleration*Math.abs(error)));
    velocity = approach(velocity, desiredSpeed, acceleration*dt);
    let step = velocity*dt;
    if(Math.abs(step) > Math.abs(error) && Math.sign(step) === Math.sign(error)){
      step = error;
      velocity = 0;
    }
    return {value:current+step, velocity};
  }
  function distanceToProjectileSegment(start,end,point){
    const segment=end.clone().sub(start), lengthSq=segment.lengthSq();
    const t=lengthSq>0?Math.max(0,Math.min(1,point.clone().sub(start).dot(segment)/lengthSq)):0;
    return point.distanceTo(start.addScaledVector(segment,t));
  }

  // ---------- Penetration model ----------
  const DEG=Math.PI/180, shellRay=new THREE.Raycaster();
  const BEARINGS=['front','front-left','left','rear-left','rear','rear-right','right','front-right'];
  function resolveShellHit(p,start,target){
    const end=p.mesh.position, seg=end.clone().sub(start), len=seg.length();
    if(len<1e-6) return false;
    const centre=target.group.position.clone(); centre.y+=1.3;
    if(distanceToProjectileSegment(start.clone(),end,centre)>5) return false;
    target.group.updateMatrixWorld(true);
    const dir=seg.divideScalar(len);
    shellRay.set(start,dir); shellRay.far=len;
    for(const h of shellRay.intersectObjects(target.armorMeshes,false)){
      const nW=h.face.normal.clone().transformDirection(h.object.matrixWorld);
      if(nW.dot(dir)>0) continue; // inside/exit surface
      const ud=h.object.userData;
      if(ud.addOnPanel){
        // Spaced add-on armour: HEAT / HESH / HE rounds detonate on the panel and blow it off the tank; kinetic
        // rounds punch straight through the thin module and carry on to the cast steel behind it.
        if(p.shell.isHEAT||p.shell.isHESH||p.shell.isHE) return addOnPanelHit(p,target,h,dir,nW);
        continue;
      }
      const plate=ud.armorByNormal?ud.armorByNormal(h.face.normal):{t:ud.armorThicknessMM,zone:ud.armorZone};
      return plateHit(p,target,h.point,dir,nW,plate.t,plate.zone,plate);
    }
    return false;
  }
  function addOnPanelHit(p,target,h,dir,nW){
    const panel=h.object.userData.panelRef;
    const q=target.group.getWorldQuaternion(new THREE.Quaternion()).invert();
    const rep={owner:p.owner,team:p.team,target,zone:'turret-addon',T:60,ang:0,Teff:0,pen:0,dirL:dir.clone().applyQuaternion(q),
      ptL:target.group.worldToLocal(h.point.clone()),mods:[],notes:[],dmg:0,result:'nopen',addOn:true};
    knockOffPanel(target,panel,h.point,nW);
    matchOnShot(p,target,'nopen',rep,dir);
    if(p.owner==='player') showShotFeedback('blocked','ADD-ON ARMOR BLOWN OFF');
    showShotReport(rep);
    return true;
  }
  const flyingPanels=[];
  function knockOffPanel(target,panel,point,nW){
    if(!panel||panel.destroyed) return;
    panel.destroyed=true;
    const mesh=panel.mesh, i=target.armorMeshes.indexOf(mesh); if(i>=0) target.armorMeshes.splice(i,1);
    mesh.updateWorldMatrix(true,false);
    const wp=new THREE.Vector3(), wq=new THREE.Quaternion(), ws=new THREE.Vector3();
    mesh.matrixWorld.decompose(wp,wq,ws);
    mesh.parent.remove(mesh); mesh.position.copy(wp); mesh.quaternion.copy(wq); mesh.scale.copy(ws); scene.add(mesh);
    if(panel.scar) panel.scar.visible=true; // scorched, bolt-studded bare steel where the module was
    flyingPanels.push({mesh,life:0,
      vel:nW.clone().multiplyScalar(5+Math.random()*3).add(new THREE.Vector3((Math.random()-0.5)*3,5+Math.random()*4,(Math.random()-0.5)*3)),
      spin:new THREE.Vector3((Math.random()-0.5)*9,(Math.random()-0.5)*9,(Math.random()-0.5)*9)});
    spawnArmorSparks(point,nW);
    fxFlash(point,2.4,0.16); fxSparks(point,nW,14,16,0.6,0.6); fxSpawnDebris(point,3,0.45,false); fxShake(point,0.06);
  }
  function updateFlyingPanels(dt){
    for(let i=flyingPanels.length-1;i>=0;i--){
      const f=flyingPanels[i]; f.life+=dt;
      f.vel.y-=GRAVITY_WORLD*1.7*dt; f.mesh.position.addScaledVector(f.vel,dt);
      f.mesh.rotation.x+=f.spin.x*dt; f.mesh.rotation.y+=f.spin.y*dt; f.mesh.rotation.z+=f.spin.z*dt;
      const gy=terrainHeightAt(f.mesh.position.x,f.mesh.position.z)+0.08;
      if(f.mesh.position.y<gy){
        f.mesh.position.y=gy;
        if(f.vel.y<-2){ f.vel.y*=-0.25; f.vel.x*=0.5; f.vel.z*=0.5; f.spin.multiplyScalar(0.4); }
        else { f.vel.set(0,0,0); f.spin.set(0,0,0); }
      }
      if(f.life>12){ scene.remove(f.mesh); flyingPanels.splice(i,1); }
    }
  }
  // Effective thickness = nominal / cos(angle) (a few degrees of normalization for capped shells),
  // so angling the hull raises it. Very oblique hits can ricochet unless the shell overmatches the plate.
  // HESH (High Explosive Squash Head) ignores angle entirely - it always uses nominal thickness.
  // Composite ("special") armour carries separate RHA-equivalents: ke vs kinetic rounds at its design angle (ref),
  // ce vs shaped-charge / HESH. Ceramic layers are tougher against short blunt cores, so rounds that are not
  // long-rod penetrators (no defeatsComposite flag) see 20% more kinetic protection.
  function effectiveThickness(sh,plate,T,ang){
    if(plate && plate.ke){
      if(sh.isHEAT||sh.isHESH||sh.isHE) return plate.ce;
      const c=a=>Math.max(0.28,Math.cos(Math.max(0,a-sh.normalization*DEG)));
      return plate.ke*c(plate.ref||0)/c(ang)*(sh.defeatsComposite?1:1.2);
    }
    return (sh.isHESH||sh.isHEAT)?T:T/Math.max(0.28,Math.cos(Math.max(0,ang-sh.normalization*DEG)));
  }
  // M1 ammunition compartments vent through blow-off panels: the rack burns off and the crew usually survives.
  function ventBlowOff(target,bustle){
    if(bustle) (target.blowOffPanels||[]).forEach(pn=>{
      if(pn.destroyed) return;
      pn.mesh.updateWorldMatrix(true,false);
      const wp=new THREE.Vector3().setFromMatrixPosition(pn.mesh.matrixWorld);
      knockOffPanel(target,pn,wp,new THREE.Vector3(0,1,0));
    });
    target.burnTime=Math.max(target.burnTime||0,10);
  }
  function plateHit(p,target,point,dir,nW,T,zone,plate){
    const sh=p.shell, toPlayer=target===player;
    const Tn=(plate&&plate.ke)?plate.ke*Math.cos(plate.ref||0):T; // normal-incidence thickness, used for the ricochet test
    const ang=Math.acos(THREE.MathUtils.clamp(-dir.dot(nW),0.02,1));
    
    // HESH and HEAT-FS shells ignore angle multipliers
    const Teff = effectiveThickness(sh,plate,T,ang);
    
    const pen=(sh.penNear+(sh.penFar-sh.penNear)*Math.min(1,p.dist/220))*(0.94+Math.random()*0.12);
    const q=target.group.getWorldQuaternion(new THREE.Quaternion()).invert();
    const rep={owner:p.owner,team:p.team,target,zone,T,ang:ang/DEG,Teff,pen,dirL:dir.clone().applyQuaternion(q),
      ptL:target.group.worldToLocal(point.clone()),mods:[],notes:[],dmg:0,result:'nopen',comp:!!(plate&&plate.ke)};
    const ricAng=68*DEG;
    // HESH and HEAT-FS shells don't ricochet - they stick/detonate or penetrate
    if(!sh.isHESH && !sh.isHEAT && ang>ricAng && sh.caliber<2.5*Tn && Math.random()<Math.min(1,(ang-ricAng)/(12*DEG))){
      rep.result='ricochet';
      p.dir.reflect(nW).add(new THREE.Vector3((Math.random()-0.5)*0.1,(Math.random()-0.5)*0.1,(Math.random()-0.5)*0.1)).normalize();
      const ricochetSpeed=p.velocity.length()*0.62;
      p.velocity.copy(p.dir).multiplyScalar(ricochetSpeed);
      p.speed=ricochetSpeed;
      p.mesh.position.copy(point).addScaledVector(nW,0.12);
      p.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),p.dir);
      p.shell={...sh,penNear:sh.penNear*0.6,penFar:sh.penFar*0.6}; p.damage*=0.5; p.life=Math.min(p.life,1.2);
      rep.bounceL=p.dir.clone().applyQuaternion(q);
      spawnRicochetSparks(point, p.dir, nW);
      matchOnShot(p,target,'ricochet',rep,dir);
      if(p.owner==='player')showShotFeedback('ricochet','RICOCHET');
      showShotReport(rep);
      return false;
    }
    if(pen<Teff){ 
      spawnArmorSparks(point, nW); // Non-pen hit sparks
      matchOnShot(p,target,'nopen',rep,dir);
      if(p.owner==='player')showShotFeedback('blocked','ARMOR HIT · NO PEN');
      showShotReport(rep); 
      return true; 
    }
    rep.result='pen';
    const det=point.clone().addScaledVector(dir,sh.fuse);
    rep.detL=target.group.worldToLocal(det.clone());
    let dmg=p.damage*0.4, destroyed=false;
    target.modules.forEach(m=>{
      if(m.type==='crew' && m.dead) return;
      const wp=m.parent.localToWorld(new THREE.Vector3(m.x,m.y,m.z));
      const direct=distanceToProjectileSegment(point.clone(),det,wp)<m.r+0.15;
      if(!direct && wp.distanceTo(det)>=m.r+sh.blast) return;
      const f=direct?1:0.5; rep.mods.push({m,direct});
      m.damaged=true;
      if(m.type==='engine') target.engineHealth=Math.max(0,(target.engineHealth??1)-0.4*f);
      if(m.type==='trans') target.transHealth=Math.max(0,(target.transHealth??1)-0.45*f);
      if(m.type==='crew'){ m.dead=true; dmg+=p.damage*0.6*f; rep.notes.push(m.name+' knocked out'); }
      else if(m.type==='engine'){ dmg+=p.damage*0.8*f; rep.notes.push('Engine hit'); if(Math.random()<0.35*f){target.burnTime=8; rep.notes.push('Fire!');} }
      else if(m.type==='fuel'){ dmg+=p.damage*0.6*f; rep.notes.push('Fuel tank hit'); if(Math.random()<0.25*f){target.burnTime=8; rep.notes.push('Fire!');} }
      else if(m.type==='trans'){ dmg+=p.damage*0.5*f; rep.notes.push('Transmission hit'); }
      else if(m.type==='ammo' && m.blowOff && Math.random()<0.85){
        if(Math.random()<(direct?0.25:0.1)){
          ventBlowOff(target,m.name==='Bustle ammo');
          dmg+=p.damage*0.9*f; rep.notes.push('Ammo cooked off · blow-off panels vented, crew spared');
        } else { dmg+=p.damage*1.2*f; rep.notes.push('Ammo rack hit'); }
      }
      else if(m.type==='ammo'){ 
        if(Math.random()<(direct?0.25:0.1)){
          destroyed=true; 
          rep.notes.push('AMMO DETONATION');
          rep.ammoExplosion = true; // Flag for explosion effect
        } else {
          dmg+=p.damage*1.2*f; 
          rep.notes.push('Ammo rack hit');
        } 
      }
    });

    // Spalling damage system - works differently for HESH vs kinetic shells
    if(sh.isHESH){
      // HESH: Shell detonates on OUTSIDE of armor, shockwave travels through plate,
      // interior surface spalls in a cone perpendicular to the armor surface.
      // Spalling originates from the impact point, not the fuse detonation point.
      const spallingOrigin = point.clone(); // Impact point on exterior armor
      const spallingDirection = dir.clone().negate(); // Into the tank (opposite of shell direction)
      const spallingRadius = sh.blast; // HESH has massive spalling radius (3.8m for 183mm)
      const spallingConeAngle = Math.PI / 3; // 60 degree cone
      
      target.modules.forEach(m => {
        if (m.type !== 'crew' || m.dead) return;
        const wp = m.parent.localToWorld(new THREE.Vector3(m.x, m.y, m.z));
        const toModule = wp.clone().sub(spallingOrigin);
        const dist = toModule.length();
        
        if (dist > spallingRadius) return; // Outside spalling radius
        
        // Check if module is within the spalling cone
        toModule.normalize();
        const angleToModule = Math.acos(THREE.MathUtils.clamp(toModule.dot(spallingDirection), -1, 1));
        
        if (angleToModule > spallingConeAngle) return; // Outside spalling cone
        
        // Spalling is extremely lethal - distance and angle both matter
        const distanceFactor = 1 - (dist / spallingRadius);
        const angleFactor = 1 - (angleToModule / spallingConeAngle);
        const knockoutChance = Math.min(0.95, distanceFactor * angleFactor * 1.2); // HESH is devastating
        
        if (Math.random() < knockoutChance) {
          m.dead = true;
          dmg += p.damage * 0.5;
          rep.notes.push(m.name + ' killed by HESH spalling');
        }
      });
      
      // HESH also damages modules in the cone
      target.modules.forEach(m => {
        if (m.dead || m.damaged) return;
        const wp = m.parent.localToWorld(new THREE.Vector3(m.x, m.y, m.z));
        const toModule = wp.clone().sub(spallingOrigin);
        const dist = toModule.length();
        
        if (dist > spallingRadius * 0.8) return; // Modules need to be closer
        
        toModule.normalize();
        const angleToModule = Math.acos(THREE.MathUtils.clamp(toModule.dot(spallingDirection), -1, 1));
        
        if (angleToModule > spallingConeAngle * 0.9) return;
        
        const distanceFactor = 1 - (dist / (spallingRadius * 0.8));
        const damageProbability = distanceFactor * 0.6;
        
        if (Math.random() < damageProbability) {
          m.damaged = true;
          if(m.type === 'ammo' && Math.random() < 0.35){
            destroyed = true;
            rep.notes.push('AMMO DETONATION from HESH spalling');
            rep.ammoExplosion = true;
          } else if(m.type === 'engine'){
            target.engineHealth = Math.max(0, (target.engineHealth??1) - 0.5);
            rep.notes.push('Engine damaged by spalling');
          } else if(m.type === 'fuel' && Math.random() < 0.4){
            target.burnTime = 10;
            rep.notes.push('Fuel tank ruptured - Fire!');
          }
        }
      });
    } else {
      // Kinetic shells: Traditional spalling from fuse detonation point inside tank
      const shellPower = sh.caliber * (pen / 100);
      const spallingRadius = Math.min(1.5, shellPower / 80);
      const spallingKnockoutChance = Math.min(0.5, shellPower / 300);
      
      target.modules.forEach(m => {
        if (m.type !== 'crew' || m.dead) return;
        const wp = m.parent.localToWorld(new THREE.Vector3(m.x, m.y, m.z));
        const distToImpact = wp.distanceTo(det);
        
        if (distToImpact <= spallingRadius) {
          const distanceFactor = 1 - (distToImpact / spallingRadius);
          const knockoutChance = spallingKnockoutChance * distanceFactor;
          
          if (Math.random() < knockoutChance) {
            m.dead = true;
            dmg += p.damage * 0.4;
            rep.notes.push(m.name + ' killed by spalling');
          }
        }
      });
    }

    if(target.modules.filter(m=>m.type==='crew'&&m.dead).length>=4){ destroyed=true; rep.notes.push('Crew lost'); }
    if(destroyed) target.destroyed = true;
    
    matchOnShot(p,target,'pen',rep,dir);
    // Spawn visual effects based on hit result
    if(rep.ammoExplosion){
      spawnAmmoExplosion(det, target);
    } else {
      spawnPenetrationEffect(point, det, dir);
      fxPenetration(point, det, dir, target);
    }
    if(p.shooter===player)showShotFeedback(rep.ammoExplosion?'critical':'penetration',rep.ammoExplosion?'AMMO DETONATION':'PENETRATION');
    
    // Check if tank was destroyed
    if(destroyed){
      target.burnTime=15;
    }
    
    showShotReport(rep);
    return true;
  }
  let shotPanel=null, shotHideTimer=0;
  let shotFeedbackEl=null,shotFeedbackTimer=0;
  function showShotFeedback(kind,label){
    if(!shotFeedbackEl){
      shotFeedbackEl=document.createElement('div');
      shotFeedbackEl.id='shotFeedback';
      shotFeedbackEl.innerHTML='<span class="sf-mark"></span><span class="sf-label"></span>';
      document.body.appendChild(shotFeedbackEl);
    }
    shotFeedbackEl.className='shot-feedback sf-'+kind;
    const marks={penetration:'✓',blocked:'×',ricochet:'◇',critical:'✹'};
    shotFeedbackEl.querySelector('.sf-mark').textContent=marks[kind]||'•';
    shotFeedbackEl.querySelector('.sf-label').textContent=label;
    void shotFeedbackEl.offsetWidth;
    shotFeedbackEl.classList.add('show');
    clearTimeout(shotFeedbackTimer);
    shotFeedbackTimer=setTimeout(()=>shotFeedbackEl.classList.remove('show'),720);
  }
  function showShotReport(r){
    if(r.owner!=='player') return;
    if(!shotPanel){
      shotPanel=document.createElement('div'); shotPanel.id='shotReport';
      shotPanel.innerHTML='<div class="sr-title"></div><canvas width="260" height="200"></canvas><div class="sr-head"></div><div class="sr-body"></div>';
      document.body.appendChild(shotPanel);
    }
    const bearing=BEARINGS[(Math.round(Math.atan2(-r.dirL.x,-r.dirL.z)/(Math.PI/4))+8)%8];
    const cls=r.result==='pen'?'sr-pen':(r.result==='ricochet'?'sr-ric':'sr-no');
    shotPanel.querySelector('.sr-title').textContent=(r.owner==='player'?'YOUR SHOT · ':r.team==='blue'?'ALLY SHOT · ':'INCOMING SHOT · ')+(r.target.kind==='tiger'?'TIGER 131':r.target.kind==='sturer'?'STURER EMIL':r.target.kind==='leopard1a5'?'LEOPARD 1A5':r.target.kind==='is7'?'IS-7':r.target.kind==='t54e1'?'T54E1':r.target.kind==='fv4005'?'FV4005':r.target.kind==='amx50'?'M-V-YOH':r.target.kind==='t72b'?'T-72B':r.target.kind==='m1abrams'?'M1 ABRAMS':r.target.kind==='challenger1'?'CHALLENGER 1':r.target.kind==='k1'?'K1':r.target.kind==='leopard1a5'?'LEOPARD 1A5':'PANTHER');
    const h=shotPanel.querySelector('.sr-head');
    h.textContent=r.result==='pen'?'PENETRATION':(r.result==='ricochet'?'RICOCHET':'NO PENETRATION'); h.className='sr-head '+cls;
    shotPanel.querySelector('.sr-body').innerHTML='Hit: '+r.zone.replace('-',' ')+' · '+Math.round(r.T)+(r.comp?' mm RHAe (composite) · angle ':' mm · angle ')+Math.round(r.ang)+'°<br>'+
      'Effective '+Math.round(r.Teff)+' mm vs pen '+Math.round(r.pen)+' mm<br>Shell flew from the '+bearing+
      (r.result==='pen'?'<br>'+(r.notes.length?r.notes.join(' · '):'No vital module hit'):'');
    if(r.addOn){
      h.textContent='ADD-ON ARMOR DESTROYED'; h.className='sr-head sr-no';
      shotPanel.querySelector('.sr-body').innerHTML='Hit: turret add-on armour panel<br>Spaced armour set the round off early<br>Shell flew from the '+bearing+'<br>That spot is now bare cast steel';
    }
    drawShotCanvas(shotPanel.querySelector('canvas'),r);
    shotPanel.classList.add('show'); clearTimeout(shotHideTimer);
    shotHideTimer=setTimeout(()=>shotPanel.classList.remove('show'),6500);
  }
  // Top-down view of the target as it was hit: shell trace, impact point and modules.
  function drawShotCanvas(cv,r){
    const g=cv.getContext('2d'), s=13, cx=130, cy=108, X=x=>cx-x*s, Y=z=>cy-z*s, t=r.target;
    const D=t.kind==='tiger'?{hw:1.8,z0:-2.62,z1:2.62,a:1.27,b:1.93,tz0:-2.8,tz1:2.85}:{hw:1.6,z0:-2.6,z1:3.0,a:0.9,b:1.5,tz0:-2.85,tz1:3.25};
    g.fillStyle='#0b0f0a'; g.fillRect(0,0,260,200);
    g.fillStyle='#262b22';
    g.fillRect(X(D.b),Y(D.tz1),(D.b-D.a)*s,(D.tz1-D.tz0)*s); g.fillRect(X(-D.a),Y(D.tz1),(D.b-D.a)*s,(D.tz1-D.tz0)*s);
    g.fillStyle='#5f6b49'; g.fillRect(X(D.hw),Y(D.z1),2*D.hw*s,(D.z1-D.z0)*s);
    const tz=t.turretPivot.position.z, yaw=t.turretPivot.rotation.y;
    g.strokeStyle='#7d8a62'; g.lineWidth=4; g.beginPath(); g.moveTo(X(0),Y(tz)); g.lineTo(X(Math.sin(yaw)*3.6),Y(tz+Math.cos(yaw)*3.6)); g.stroke();
    g.fillStyle='#6f7c54'; g.beginPath(); g.arc(X(0),Y(tz),1.05*s,0,Math.PI*2); g.fill();
    t.group.updateMatrixWorld(true);
    t.modules.forEach(m=>{
      const lp=t.group.worldToLocal(m.parent.localToWorld(new THREE.Vector3(m.x,m.y,m.z)));
      const hit=r.mods.find(h=>h.m===m);
      g.beginPath(); g.arc(X(lp.x),Y(lp.z),Math.max(3,m.r*s*0.55),0,Math.PI*2);
      if(m.dead||hit){ g.fillStyle=m.dead?'#e0432f':'#ff9a3c'; g.fill(); } else { g.strokeStyle='#a9b99a66'; g.lineWidth=1; g.stroke(); }
    });
    const col=r.result==='pen'?'#ff5a3c':(r.result==='ricochet'?'#ffd35a':'#9aa7b0');
    const p0={x:r.ptL.x-r.dirL.x*3.6,z:r.ptL.z-r.dirL.z*3.6};
    g.strokeStyle=col; g.lineWidth=2.5; g.beginPath(); g.moveTo(X(p0.x),Y(p0.z)); g.lineTo(X(r.ptL.x),Y(r.ptL.z)); g.stroke();
    const ax=X(r.ptL.x), ay=Y(r.ptL.z), ang=Math.atan2(Y(r.ptL.z)-Y(p0.z),X(r.ptL.x)-X(p0.x));
    g.fillStyle=col; g.beginPath(); g.moveTo(ax,ay); g.lineTo(ax-9*Math.cos(ang-0.4),ay-9*Math.sin(ang-0.4)); g.lineTo(ax-9*Math.cos(ang+0.4),ay-9*Math.sin(ang+0.4)); g.fill();
    if(r.result==='pen'){ g.setLineDash([4,3]); g.beginPath(); g.moveTo(ax,ay); g.lineTo(X(r.detL.x),Y(r.detL.z)); g.stroke(); g.setLineDash([]); }
    if(r.bounceL){ g.setLineDash([3,3]); g.beginPath(); g.moveTo(ax,ay); g.lineTo(X(r.ptL.x+r.bounceL.x*2),Y(r.ptL.z+r.bounceL.z*2)); g.stroke(); g.setLineDash([]); }
  }

  function updateBot(bot,dt){
    if(bot.destroyed) return;
    const opponents=bot.team==='red'?[player,...allies]:enemies;
    const targets=opponents.filter(t=>!t.destroyed);
    if(!targets.length) return;
    const target=targets.reduce((best,t)=>t.group.position.distanceToSquared(bot.group.position)<best.group.position.distanceToSquared(bot.group.position)?t:best,targets[0]);
    const cfg=bot.config, bp=bot.group.position;
    const ai=bot.ai||(bot.ai={stuckAcc:0,lastX:bp.x,lastZ:bp.z,escapeT:0,escapeDir:1,strafeT:0,strafeDir:Math.random()<.5?1:-1,losT:0,los:true});
    const dx=target.group.position.x-bp.x;
    const dz=target.group.position.z-bp.z;
    const distance=Math.hypot(dx,dz);
    const shellSpeed=cfg.shellSpeed/METERS_PER_WORLD_UNIT;
    const fireRange=Math.min(320,shellSpeed*1.6);   // shells live 2.2 s, so this is comfortably inside their reach

    // ---- Line of sight (cached ~4x/s): terrain or buildings between gun and target block the shot ----
    ai.losT-=dt;
    if(ai.losT<=0){
      ai.losT=0.25;
      const ox=bp.x, oy=bp.y+2.2, tx=target.group.position.x, ty=target.group.position.y+1.2, tz=target.group.position.z;
      const n=Math.max(2,Math.ceil(distance/5)); let clear=true;
      for(let i=1;i<n&&clear;i++){
        const f=i/n, x=ox+(tx-ox)*f, z=bp.z+(tz-bp.z)*f, y=oy+(ty-oy)*f;
        if(y<terrainHeightAt(x,z)+0.3 || (mapSolidAt && mapSolidAt(x,y,z))) clear=false;
      }
      ai.los=clear;
    }

    // ---- Obstacle test: only blocks movement INTO something (so a tank that spawned overlapping can drive out) ----
    const others=[player,...allies,...enemies].filter(o=>o!==bot&&!o.destroyed);
    const blockedAt=(x,z)=>{
      if(Math.abs(x)>half||Math.abs(z)>half) return true;
      if(colliderHit(x,z,1.65,bp.x,bp.z)) return true;
      if(mapBlockedAt && mapBlockedAt(x,z) && !mapBlockedAt(bp.x,bp.z)) return true;     // deep water
      for(const o of others){
        const op=o.group.position, dn=(x-op.x)**2+(z-op.z)**2;
        if(dn<4.8*4.8 && dn<(bp.x-op.x)**2+(bp.z-op.z)**2) return true;
      }
      return false;
    };

    // ---- Decide where to go ----
    const maxFwd=cfg.maxSpeed*0.9;
    let desiredHullYaw=Math.atan2(dx,dz), desired=0;
    const yawOf=y=>Math.atan2(Math.sin(y-bot.group.rotation.y),Math.cos(y-bot.group.rotation.y));
    let hullError=yawOf(desiredHullYaw);
    if(ai.escapeT>0){
      // Recovery manoeuvre after getting stuck: reverse out while turning, then pull away forwards.
      ai.escapeT-=dt;
      desired=ai.escapeT>0.9?-maxFwd*0.55:maxFwd*0.5;
      desiredHullYaw=bot.group.rotation.y+ai.escapeDir*1.0;
    } else {
      ai.strafeT-=dt; if(ai.strafeT<=0){ ai.strafeT=3+Math.random()*3; ai.strafeDir*=-1; }
      const holdFar=Math.min(110,fireRange*0.55), holdNear=40;
      if(!ai.los || distance>holdFar) desired=maxFwd;               // close in / flank round cover
      else if(distance<holdNear) desired=-maxFwd*0.5;               // too close: back off while still facing it
      else desired=ai.strafeDir*maxFwd*0.25;                        // in the sweet spot: shuffle so it isn't a sitting duck
      if(desired>0){
        // Whiskers: if the way ahead is blocked, steer to the nearest free angle on the side nearest the target.
        const fy=bot.group.rotation.y, look=10+Math.abs(bot.driveSpeed)*0.8;
        const free=a=>!blockedAt(bp.x+Math.sin(fy+a)*look,bp.z+Math.cos(fy+a)*look);
        if(!free(0)){
          const side=Math.sign(hullError)||ai.strafeDir;
          for(const a of [0.5,1.0,1.5,2.0]){
            if(free(a*side)){desiredHullYaw=fy+a*side;break;}
            if(free(-a*side)){desiredHullYaw=fy-a*side;break;}
          }
        }
        hullError=yawOf(desiredHullYaw);
        if(Math.abs(hullError)>0.9) desired*=0.35;                  // pivot first, drive second
      }
    }
    const desiredHullRate=THREE.MathUtils.clamp(hullError*1.4,-cfg.turnSpeed,cfg.turnSpeed);
    bot.hullTurnVelocity=approach(bot.hullTurnVelocity,desiredHullRate,cfg.turnSpeed*1.8*dt);
    const hullStep=bot.hullTurnVelocity*dt;
    bot.group.rotation.y+=hullStep;

    desired*=mobilityOf(bot);
    if(desired>0) desired=Math.min(desired,slopeSpeedLimit(bot,cfg,1));
    else if(desired<0) desired=Math.max(desired,-slopeSpeedLimit(bot,cfg,-1));
    if(bot.driveSpeed>desired+0.05 && desired>0) bot.driveSpeed=Math.max(desired,bot.driveSpeed-cfg.accel*0.6*dt);
    const reversing=desired!==0 && bot.driveSpeed!==0 && Math.sign(desired)!==Math.sign(bot.driveSpeed);
    bot.driveSpeed=approach(bot.driveSpeed,desired,cfg.accel*(desired===0||reversing?1.8:1)*dt);
    if(Math.abs(bot.driveSpeed)>0.001){
      const fx=Math.sin(bot.group.rotation.y), fz=Math.cos(bot.group.rotation.y);
      const nx=bp.x+fx*bot.driveSpeed*dt, nz=bp.z+fz*bot.driveSpeed*dt;
      if(!blockedAt(nx,nz)){bp.x=nx;bp.z=nz;}
      else if(!blockedAt(nx,bp.z)){bp.x=nx;bot.driveSpeed*=0.92;}     // slide along the obstacle
      else if(!blockedAt(bp.x,nz)){bp.z=nz;bot.driveSpeed*=0.92;}
      else bot.driveSpeed=approach(bot.driveSpeed,0,cfg.accel*2*dt);
    }
    // ---- Stuck detection: commanded to move but barely did, for half a second -> run the recovery manoeuvre ----
    ai.stuckAcc+=dt;
    if(ai.stuckAcc>=0.5){
      const moved=Math.hypot(bp.x-ai.lastX,bp.z-ai.lastZ);
      if(ai.escapeT<=0 && Math.abs(desired)>0.6 && moved<Math.abs(desired)*0.5*0.3){
        ai.escapeT=1.8; ai.escapeDir=Math.random()<0.5?1:-1;
      }
      ai.stuckAcc=0; ai.lastX=bp.x; ai.lastZ=bp.z;
    }
    bp.y=terrainHeightAt(bp.x,bp.z);
    if(!bot.wheelPositions?.length)alignTankToTerrain(bot); // sprung tanks (Panther, IS-7) are driven by the suspension
    applyRealSuspension(bot,bot.driveSpeed,dt);
    const turnRate=dt>0?hullStep/dt:0;
    bot.updateTracks(bot.driveSpeed-turnRate*bot.trackGauge,bot.driveSpeed+turnRate*bot.trackGauge,dt);

    // ---- Gun laying ----
    // Work out the world-space firing solution (lead + bullet-drop compensation), then convert it into the hull's
    // local axes exactly like the player's gun does. The old code ignored hull pitch/roll, so on any slope the gun
    // was laid relative to a tilted hull and shots went high or low.
    const leadTime=Math.min(distance/shellSpeed,0.9);
    const targetSpeed=target===player?speed:target.driveSpeed;
    const targetVelocity=new THREE.Vector3(0,0,targetSpeed).applyAxisAngle(new THREE.Vector3(0,1,0),target.group.rotation.y);
    const aimX=target.group.position.x+targetVelocity.x*leadTime;
    const aimZ=target.group.position.z+targetVelocity.z*leadTime;
    const aimDx=aimX-bp.x, aimDz=aimZ-bp.z;
    const aimDistance=Math.max(1,Math.hypot(aimDx,aimDz));
    const traverse=bot.gunTraversePivot||bot.turretPivot;
    const traverseLimit=cfg.isCasemate?(cfg.maxTraverse||0.174):Infinity;
    bot.group.updateMatrixWorld(true);
    const muzzle=muzzlePosition(bot,bot.kind);
    const flightTime=aimDistance/shellSpeed;
    const targetHeight=target.group.position.y+1.15+targetVelocity.y*leadTime;
    const compensatedHeight=targetHeight-muzzle.y+0.5*GRAVITY_WORLD*flightTime*flightTime;
    const worldElev=Math.atan2(compensatedHeight,aimDistance), worldYaw=Math.atan2(aimDx,aimDz), ce=Math.cos(worldElev);
    const hullDir=new THREE.Vector3(Math.sin(worldYaw)*ce,Math.sin(worldElev),Math.cos(worldYaw)*ce)
      .applyQuaternion(bot.group.quaternion.clone().invert());
    const localYaw=Math.atan2(hullDir.x,hullDir.z);
    const gunDir=hullDir.clone().applyAxisAngle(new THREE.Vector3(0,1,0),-localYaw);
    const desiredYaw=THREE.MathUtils.clamp(localYaw,-traverseLimit,traverseLimit);
    const pitchTarget=THREE.MathUtils.clamp(-Math.atan2(gunDir.y,Math.hypot(gunDir.x,gunDir.z)),cfg.minPitch??-0.28,cfg.maxPitch??0.22);
    const yawError=Math.atan2(Math.sin(desiredYaw-traverse.rotation.y),Math.cos(desiredYaw-traverse.rotation.y));
    const botTraverseSpeed=cfg.isCasemate?0.3:cfg.turretSpeed;
    const yawMove=moveHeavyAxis(traverse.rotation.y,bot.turretVelocity,yawError,botTraverseSpeed,botTraverseSpeed*1.5,dt);
    traverse.rotation.y=yawMove.value; bot.turretVelocity=yawMove.velocity;
    const pitchMove=moveHeavyAxis(bot.barrelPitchPivot.rotation.x,bot.pitchVelocity,pitchTarget-bot.barrelPitchPivot.rotation.x,cfg.turretPitchSpeed,cfg.turretPitchSpeed*1.5,dt);
    bot.barrelPitchPivot.rotation.x=pitchMove.value; bot.pitchVelocity=pitchMove.velocity;

    bot.reloadRemaining-=dt/reloadMult(bot);
    
    // Check magazine reload complete for bots
    if(bot.reloadRemaining <= 0 && bot.isReloadingMagazine){
      bot.isReloadingMagazine = false;
      bot.shotsInMagazine = bot.config.magazineSize || 0;
    }
    
    if(bot.reloadRemaining<=0 && !bot.isReloadingMagazine && distance<fireRange && ai.los && Math.abs(yawError)<0.04 && Math.abs(pitchTarget-bot.barrelPitchPivot.rotation.x)<0.03){
      // Check if bot has ammo (for autoloader tanks)
      if(bot.config.magazineSize && bot.shotsInMagazine <= 0) return; // Can't fire, magazine empty
      
      bot.group.updateMatrixWorld(true);
      const shotDirection=bot.barrelPitchPivot.localToWorld(new THREE.Vector3(0,0,1))
        .sub(bot.barrelPitchPivot.getWorldPosition(new THREE.Vector3())).normalize();
      const enemySpread=shotSpread(bot.config, Math.abs(bot.driveSpeed)*7.5);
      shotDirection.applyAxisAngle(new THREE.Vector3(0,1,0),(Math.random()-0.5)*enemySpread)
        .applyAxisAngle(new THREE.Vector3(1,0,0),(Math.random()-0.5)*enemySpread).normalize();
      triggerGunEffect(bot,bot.kind,shotDirection);
      launchShell(muzzlePosition(bot,bot.kind),shotDirection,bot.config.damage,'ai',bot);
      
      // Autoloader mechanics for bots
      if(bot.config.magazineSize){
        bot.shotsInMagazine--;
        if(bot.shotsInMagazine <= 0){
          // Magazine empty, reload full magazine
          bot.isReloadingMagazine = true;
          bot.reloadRemaining = bot.config.magazineReloadTime;
        } else {
          // Still have shots, normal reload
          bot.reloadRemaining = Math.max(6, bot.config.reloadTime*0.9)*(0.9+Math.random()*0.2);
        }
      } else {
        // Standard reload for non-autoloader
        bot.reloadRemaining = Math.max(6, bot.config.reloadTime*0.9)*(0.9+Math.random()*0.2);
      }
    }
  }

  // ========================================================================
  // SU-30SM FLIGHT & CAMERA — entirely separate from the tank drive code above. Runs instead of the tank
  // movement/turret block inside update(dt) whenever player.isAircraft is true.
  // The physics (lift/drag/thrust, fly-by-wire g-limiter, takeoff roll, touchdown) is in flight.js. This function only
  // turns the pilot's inputs into model inputs and copies the resulting pose onto the mesh:
  //   W/S  throttle lever (holds its position), afterburner above 70%
  //   mouse  virtual stick: up = nose up (pulls g), right = roll right. It relaxes to centre over ~1 s; centred
  //          stick holds the current flight path, so a banked jet does not simply fall out of the sky
  //   A/D  rudder, B  wheel brake (also applied automatically with the throttle closed)
  //   X  toggle cobra mode: the fly-by-wire alpha/g limiter and auto-trim switch off entirely, and E/Q and mouse up/down take over
  //      the pitch axis as a raw rate command straight to the elevator/TVC - the nose can be hauled past the
  //      stall and held there on command (Pugachev's Cobra, kulbit, other post-stall maneuvers). Mouse keeps
  //      banking the jet; the instructor's own stall recovery is suppressed while cobra is on.
  //   T  toggle thrust vectoring (V is already the cinematic-look toggle)
  // ========================================================================
  let planeCrashMsgT=0, planeCrashMsg='', planeHudT=0;   // (planeFM is declared with the camera state further up: the init-time camera call reads it)
  const planeInput={sx:0,sy:0,nDem:NaN,protect:true,tvc:true,cobra:false,rudder:0,throttle:0,gear:1,brake:false};

  // ========================================================================
  // LANDING-GEAR SUSPENSION — purely cosmetic (the rigid-body ground contact that keeps the jet from
  // sinking through the terrain is still entirely flight.js's job; this never feeds back into it). Each
  // leg is an independent 1-DOF spring-damper acting on strut COMPRESSION (0 = fully extended, maxTravel
  // = fully bottomed out), the same spring-damper idea as the tank road-wheel suspension above but with
  // one scalar per leg instead of a wheel's ride height.
  //   - While the gear is down and the jet is on the ground, each leg eases toward a small static "weight
  //     on wheels" sag (mains sag more than the nose - they carry most of the aircraft's weight).
  //   - The instant touchdown happens (onGround flips false -> true) the leg carrying it gets a compression
  //     kick sized by the actual sink rate at the moment of contact, so a greased-on landing barely moves
  //     the struts and a hard one visibly stuffs them in before the (heavy, realistic) damping eases them
  //     back out to the taxi sag with no bounce.
  //   - Retracting/retracted gear always relaxes straight back to fully extended, so nothing is left
  //     frozen mid-stroke inside the gear bay.
  const GEAR_SUSPENSION={
    stiffness:150,          // spring constant (1/s^2 of compression) - stiff, like a real oleo strut
    damping:26,             // close to critically damped for this stiffness: settles in a few tenths of a second, no bounce
    noseSagFrac:0.14,       // static compression at rest, as a fraction of that leg's maxTravel
    mainSagFrac:0.32,
    impactGain:0.3,         // immediate compression (fraction of maxTravel) per unit of touchdown sink rate
    scissorFlex:0.5,        // rad of extra scissor-arm fold at full compression (purely visual)
    maxSubstep:1/120
  };
  function initGearSuspension(){
    gearSusp=player.gearLegs.map((leg,i)=>({compression:0,velocity:0,isMain:i>0,ud:leg.userData}));
  }
  function applyGearSuspension(dt,st){
    if(!player.isAircraft || !player.gearLegs?.length) return;
    if(!gearSusp || gearSusp.length!==player.gearLegs.length) initGearSuspension();
    // Sink rate at the instant of touchdown: read BEFORE flight.js's own contact response has zeroed vy
    // this frame, i.e. from last frame's vy, and only on the false->true edge of onGround.
    const touchdownSink=(!gearWasOnGround && st.onGround)?Math.max(0,-gearPrevVy):0;
    gearWasOnGround=st.onGround; gearPrevVy=st.vy;
    const cfg=GEAR_SUSPENSION, deployed=player.gearPos>0.98, onGround=deployed&&st.onGround;
    dt=Math.min(dt,0.05);
    const steps=Math.ceil(dt/cfg.maxSubstep), h=dt/steps;
    gearSusp.forEach(leg=>{
      const ud=leg.ud; if(!ud||!ud.piston) return;
      if(!deployed){ leg.compression=0; leg.velocity=0; }                 // snap extended while stowed/retracting
      else {
        // The "thump" of first contact: jump the strut straight toward compression (not just a velocity
        // nudge) so even a brief touchdown clearly reads, then let the spring-damper below ease it back
        // out to the static sag - the heavy damping means that ease-back is smooth, never a bounce.
        if(touchdownSink>0) leg.compression=Math.min(ud.maxTravel,leg.compression+touchdownSink*cfg.impactGain*ud.maxTravel);
        const target=onGround?ud.maxTravel*(leg.isMain?cfg.mainSagFrac:cfg.noseSagFrac):0;
        for(let i=0;i<steps;i++){
          const force=cfg.stiffness*(target-leg.compression)-cfg.damping*leg.velocity;
          leg.velocity+=force*h; leg.compression+=leg.velocity*h;
          if(leg.compression<0){ leg.compression=0; if(leg.velocity<0) leg.velocity=0; }
          else if(leg.compression>ud.maxTravel){ leg.compression=ud.maxTravel; if(leg.velocity>0) leg.velocity=0; }
        }
      }
      ud.piston.position.y=-ud.cylLen+leg.compression;
      const fold=(leg.compression/Math.max(1e-4,ud.maxTravel))*cfg.scissorFlex;
      if(ud.scU) ud.scU.rotation.x=fold; if(ud.scL) ud.scL.rotation.x=-fold;
    });
  }
  function updatePlaneFlight(dt){
    if(dt<=0) return;
    dt=Math.min(dt,0.05);
    const config=player.config, g=player.group;
    if(!planeFM){
      planeFM=createFlightModel(Object.assign({
        gravity:GRAVITY_WORLD, halfExtent:half, terrainHeightAt:(x,z)=>terrainHeightAt(x,z),
        noseGearZ:player.noseGearZ, mainGearZ:player.mainGearZ
      },config.flight||{}));
      _fe.setFromQuaternion(g.quaternion,'YXZ');
      player.spawnPose={x:g.position.x,z:g.position.z,yaw:_fe.y};
      planeFM.reset(player.spawnPose.x,player.spawnPose.z,player.spawnPose.yaw,player.gearPos);
      planeAimYaw=player.spawnPose.yaw; planeAimPitch=0;
    }

    // Throttle: a lever, not a joystick axis - it holds its position when neither key is held.
    if(!freeCam){
      if(keys['w']) player.throttle=Math.min(1,player.throttle+config.throttleRate*dt);
      else if(keys['s']) player.throttle=Math.max(0,player.throttle-config.throttleRate*dt);
    }

    // Instructor: turns the aim direction into roll / load-factor demands (it banks into turns, pulls the g the turn
    // needs, holds the flight path when the cursor is straight ahead, recovers from stalls when protection is on).
    // On the runway only A/D (rudder, added below) steers the nose wheel; raising the cursor above the horizon
    // at rotation speed still lifts the nose. In cobra mode the instructor's own stall recovery would otherwise
    // fight a deliberate post-stall pull, so it's forced off for this call regardless of the I toggle.
    // In cobra mode the aim ring's vertical component is ignored by the instructor (it only banks towards the ring's
    // heading), so a raised or lowered ring can't roll the jet while the pilot is flying pitch by hand.
    const st0=planeFM.state, fpPitch=st0.speed>5?Math.asin(THREE.MathUtils.clamp(st0.vy/st0.speed,-1,1)):0;
    const ins=planeFM.instruct(planeAimYaw,planeCobra?fpPitch:planeAimPitch,planeCobra?false:planeProtect);
    const rudderRaw=freeCam?0:((keys['a']?1:0)-(keys['d']?1:0));            // A = nose left, D = nose right (added on top)
    player.rudderS=(player.rudderS||0)+(rudderRaw-(player.rudderS||0))*(1-Math.exp(-dt/0.15));

    // Landing gear retraction animation (press G) - a simple hinge swing, same rate up and down.
    player.gearPos=approach(player.gearPos,player.gearDeployed?1:0,dt/config.gearAnimTime);

    // Cobra mode: mouse up/down (and E/Q) command raw pitch rate; roll stays with the mouse/instructor.
    // The mouse stick relaxes to centre in ~0.4 s; E/Q add on top (held keys give a steady pull / push).
    planeCobraStick*=Math.exp(-dt/0.4); if(Math.abs(planeCobraStick)<0.004) planeCobraStick=0;
    const cobraPitch=freeCam?0:THREE.MathUtils.clamp((keys['e']?1:0)-(keys['q']?1:0)+planeCobraStick,-1,1);
    planeInput.sx=ins.sx;
    planeInput.sy=planeCobra?cobraPitch:ins.sy;
    planeInput.nDem=planeCobra?NaN:ins.nDem;
    planeInput.protect=planeProtect; planeInput.tvc=planeTVC; planeInput.cobra=planeCobra;
    planeInput.rudder=THREE.MathUtils.clamp(ins.rudder+player.rudderS,-1,1);
    planeInput.throttle=player.throttle; planeInput.gear=player.gearPos;
    planeInput.brake=!!keys['b'] || player.throttle<0.03;
    planeFM.step(dt,planeInput);
    const st=planeFM.state;

    if(st.crashed){      // crashed into the ground: back to the runway, refuelled
      const sp=player.spawnPose;
      planeCrashMsg=st.failReason||'CRASHED';
      planeFM.reset(sp.x,sp.z,sp.yaw,1);
      player.throttle=0; player.gearDeployed=true; player.gearPos=1;
      player.rudderS=0; planeAimYaw=sp.yaw; planeAimPitch=0;
      planeCrashMsgT=4; _pcInit=false;
      gearWasOnGround=true; gearPrevVy=0;                     // back on the runway already resting - no false "impact" next frame
      if(gearSusp) gearSusp.forEach(leg=>{ leg.compression=0; leg.velocity=0; });
    }

    g.position.set(st.x,st.y,st.z);
    g.quaternion.set(st.qx,st.qy,st.qz,st.qw);
    player.airspeed=st.speed; player.velocity.set(st.vx,st.vy,st.vz);

    const gearAngle=(1-player.gearPos)*1.65;
    player.gearLegs.forEach(leg=>{ leg.rotation.x=gearAngle; });
    applyGearSuspension(dt,st);                                // oleo-strut compression (visual only, see definition above)
    // Thrust-vectoring nozzles: these now show the REAL deflection the model is using to make force and moment
    // (exaggerated a little so it reads from the chase camera).
    player.nacellePivots.forEach(np=>{ np.rotation.x=st.tvcP*1.3; np.rotation.y=-st.tvcY*1.3; });

    // Moving control surfaces (driven by what the flight computer is actually doing). Sign convention of every
    // surface's set(): + = trailing edge UP (leading-edge slats: + = leading edge DOWN). sd=+1 is the jet's left side.
    if(player.surf){
      const S=player.surf, cl=THREE.MathUtils.clamp, kS=1-Math.exp(-dt*16);
      const pCmd=(planeCobra||st.onGround)?cl(planeInput.sy,-1,1):cl(st.q*1.3+(st.aCmd-st.alpha)*3,-1,1);   // nose-up demand
      const rCmd=cl(planeInput.sx,-1,1), yCmd=cl(planeInput.rudder,-1,1);                                    // roll right +, nose left +
      const flap=player.gearPos*cl(1-st.speed*7.5/420,0,1);                                                  // take-off / landing flap droop
      const slat=cl(Math.max(flap*0.30,(st.alpha-0.12)*1.5),0,0.30);                                          // modest ~17 deg slat droop, not a dangling plate
      const drive=(list,fn)=>list.forEach(s=>{ s.cur+=(fn(s)-s.cur)*kS; s.set(s.cur); });
      drive(S.canard, s=>-pCmd*0.42);                                    // nose up = canard trailing edge DOWN (leading edge up)
      drive(S.stab,   s=>pCmd*0.40 - s.sd*rCmd*0.18);                    // tailplanes: pitch + differential roll
      drive(S.flapIn, s=>-s.sd*rCmd*0.30 - flap*0.50 + pCmd*0.05);       // inboard flaperons
      drive(S.flapOut,s=>-s.sd*rCmd*0.50 - flap*0.25 + pCmd*0.08);       // outboard flaperons / ailerons
      drive(S.slat,   s=>slat);
      drive(S.rudder, s=>-yCmd*0.50);                                    // rudder trailing edge swings toward the side the nose goes
    }
    // Keep the new cockpit, legacy cockpit and canopy in sync with the C-key camera mode.
    // Send actual flight-model state to the instruments only while the cockpit is active.
    const cockpitActive = !!player.cockpitView;
    if (player.legacyCockpitGroup) player.legacyCockpitGroup.visible = !cockpitActive;
    if (player.crewMeshes) player.crewMeshes.forEach(m=>{ m.visible=!cockpitActive; });
    if (player.cockpit) {
      if (player.cockpit.root) player.cockpit.root.visible = cockpitActive;
      player.cockpit.setActive(cockpitActive);
      if (cockpitActive) {
        const fuelCap = planeFM.config.fuelCapKg || 1;
        player.cockpit.update(dt, {
          kmh: st.speed * 7.5,
          altM: Math.max(0, st.y * METERS_PER_WORLD_UNIT),
          aglM: Math.max(0, st.agl * METERS_PER_WORLD_UNIT),
          vsMS: st.vy * METERS_PER_WORLD_UNIT,
          mach: st.mach,
          nz: st.nz,
          alpha: st.alpha,
          stall: st.stall,
          vx: st.vx, vy: st.vy, vz: st.vz,
          throttle: player.throttle,
          fuelPct: THREE.MathUtils.clamp(100 * st.fuel / fuelCap, 0, 100),
          gear: player.gearPos,
          brake: !!planeInput.brake,
          tvc: !!planeTVC,
          sx: planeInput.sx,
          sy: planeInput.sy
        });
      }
    }

    // Wing vapor shroud: the same physics as a wingtip vortex - low pressure (and temperature) over the wing in
    // a hard turn or high-alpha pull condenses humid air. At the extreme end (hard break turns, cobra) real jets
    // can get enveloped almost wing-root-to-wingtip in a dense white cloud, not just a thin wisp off the tip, so
    // this emits from a spread of points along each wing rather than one point at the tip.
    // Ramps in from two cues so it shows up both for a fast, high-G turn and for a slow, high-AoA one (cobra).
    if(!st.onGround){
      const aoaAmt=THREE.MathUtils.clamp((Math.abs(st.alpha)/planeFM.config.alphaStall-0.5)/0.6,0,1);
      const gAmt=THREE.MathUtils.clamp((Math.abs(st.nz)-3.5)/3.0,0,1);
      const vaporAmt=Math.max(aoaAmt,gAmt)*THREE.MathUtils.clamp((st.speed-12)/10,0,1);
      if(vaporAmt>0.02) [-1,1].forEach(sd=>{
        for(let wp=0;wp<4;wp++){
          const t=wp/3;                                     // 0 = wing root (near the fuselage), 1 = near the tip
          const lx=sd*THREE.MathUtils.lerp(2.1,7.0,t), lz=THREE.MathUtils.lerp(-0.7,-3.0,t);
          // Real wing/shock-induced vapor (as opposed to an engine contrail) is a transient pressure effect that
          // can dissipate in a fraction of a second once the airflow condition eases - nothing like engine
          // contrails, which can hang around for minutes. Each puff lives for only 0.1 seconds, so the cloud refreshes directly over the wing and does not form a
          // long world-space trail. The emission rate keeps the effect visually continuous while the maneuver holds.
          for(let i=fxRate(player,'vp'+sd+wp,50*vaporAmt,dt);i>0;i--){
            // Drift set in the wing's own local axes, then rotated to world - outward a little, up off the
            // suction side, and aft towards the trailing edge, the way the real condensation sheet trails back.
            // (The jet is usually banked hard when this shows up, so a world-space drift would go the wrong way.)
            fxV.set(sd*fxRand(0.15,0.4),fxRand(0.15,0.4),fxRand(-0.5,-0.15)).applyQuaternion(g.quaternion);
            const sz=fxRand(1.0,1.8)*(1+2.0*vaporAmt);              // small wisps at low intensity, a billowing cloud at high
            // Starts close to full size rather than growing from tiny - the pool's opacity curve (see fxUpdatePool)
            // peaks early and fades over the rest of the life, so a slow grow-in would mean it's never big AND
            // opaque at the same time. Real vapor doesn't billow up gradually like smoke either - it's just there.
            fxEmit(fxVapor,fxTankPoint(player,lx,0.3,lz),fxV,
              {life:0.1,s0:0.7*sz,s1:sz,o:0.22+0.72*vaporAmt,c0:0xeef3f3,c1:0xffffff,drag:0.9,fade:0.025});
          }
        }
      });
    }

    updateSunShadow(g.position);

    planeCrashMsgT=Math.max(0,planeCrashMsgT-dt);
    planeHudT-=dt;
    if(planeHudT<=0 || planeCrashMsgT>0){
      planeHudT=0.1;
      const kmh=Math.round(st.speed*7.5), alt=Math.round(st.agl*METERS_PER_WORLD_UNIT);
      let txt;
      const fuelPct=Math.round(100*st.fuel/planeFM.config.fuelCapKg);
      const warn=(st.stall>0.25?' · STALL':(st.alpha>0.36&&st.speed>5?' · AOA':''))+(st.fuel<=0?' · NO FUEL':(fuelPct<10?' · FUEL LOW':''));
      if(planeCrashMsgT>0) txt=planeCrashMsg+' - back on the runway';
      else if(st.onGround) txt=kmh+' km/h'+(st.speed<1?' (parked)':' (taxi)')+' · THR '+Math.round(player.throttle*100)+'% · FUEL '+fuelPct+'% · '+Math.round(st.mass)+' kg';
      else txt=kmh+' km/h · M'+st.mach.toFixed(2)+' · ALT '+alt+' m · '+st.nz.toFixed(1)+' G · THR '+Math.round(player.throttle*100)+'%'+(player.throttle>0.7?' AB':'')+' · FUEL '+fuelPct+'%'+warn+(planeProtect?'':' · FREE')+(planeTVC&&Math.abs(st.tvcP)>0.02?' · TVC':'')+(planeCobra?' · COBRA':'');
      setTxt(speedEl,txt);
    }
    const heading=((Math.atan2(2*(st.qx*st.qz+st.qy*st.qw),1-2*(st.qx*st.qx+st.qy*st.qy))*180/Math.PI)%360+360)%360;
    setTxt(tankHeadingEl, 'HDG · '+String(Math.round(heading)%360).padStart(3,'0')+'°');
    setCss(tankGlyphEl, 'rotate('+(Math.round(heading*10)/10)+'deg)');
    setTxt(tankGearEl, player.gearDeployed?'GEAR DN':'GEAR UP');
    setTxt(tankSpeedEl, Math.round(st.speed*7.5)+' km/h');
  }

  // Chase camera, War Thunder style: it is locked to the HORIZON, not to the aircraft. Only the aircraft's heading and
  // nose pitch (smoothed) steer the camera; its roll never does, so when you roll the jet it rolls on the screen
  // while the world stays level. Camera position is exactly "aircraft position minus a fixed distance along the
  // (smoothed) view direction", so there is no speed-dependent lag; only the view direction eases, with
  // frame-rate independent smoothing. Cockpit view is bolted to the airframe and does roll with it.
  // Pitch the camera / aim ring should use. Normally that is the aim direction the mouse moves. In cobra mode the mouse's
  // vertical axis drives the pitch STICK instead, so the aim pitch is stale and meaningless; the view then follows the
  // flight path (velocity) pitch, which stays near level through a cobra while the jet itself rotates on screen.
  function planeViewPitch(){
    let fp=0;
    if(planeFM){ const st=planeFM.state; if(st.speed>5) fp=THREE.MathUtils.clamp(Math.asin(THREE.MathUtils.clamp(st.vy/st.speed,-1,1)),-1,1); }
    return THREE.MathUtils.lerp(THREE.MathUtils.clamp(planeAimPitch,-1.25,1.25),fp,_pcCobra);
  }
  function updatePlaneCamera(dt){
    const g=player.group;
    if(dt<=0) _pcCobra=planeCobra?1:0; else _pcCobra+=((planeCobra?1:0)-_pcCobra)*(1-Math.exp(-dt/0.35));
    planeCamDist=approach(planeCamDist,planeCamDistTarget,20*dt);
    // Free look: held while the right mouse button is down, otherwise the view eases back behind the jet.
    if(!orbitDragging){ const k=1-Math.exp(-dt*6); planeLookYaw-=planeLookYaw*k; planeLookPitch-=planeLookPitch*k; }
    setPlaneNear(player.cockpitView?0.1:0.5);
    // Speed cues (the jet moves with the camera, so without these 1200 km/h looks like hovering): the field of view opens up
    // with speed and the chase camera stretches back a little. Streaks and blur are added in planeCamFinish().
    const spKmh=planeFM?planeFM.state.speed*7.5:0, spT=THREE.MathUtils.smoothstep(spKmh,350,1300);
    const fovTgt=CHASE_FOV+(player.cockpitView?7:15)*spT;
    if(dt<=0) _pcFov=fovTgt; else _pcFov+=(fovTgt-_pcFov)*(1-Math.exp(-dt/0.6));
    // Retain the speed-based FOV effect, but let the player zoom the cockpit independently.
    // Limits keep the view usable and prevent extreme perspective distortion.
    const planeFov=player.cockpitView
      ? THREE.MathUtils.clamp(_pcFov+cockpitFovOffset,20,85)
      : _pcFov;
    if(Math.abs(camera.fov-planeFov)>0.02){ camera.fov=planeFov; camera.updateProjectionMatrix(); }
    if(player.cockpitView){
      // The eye position goes through the jet's world matrix, which three.js only refreshes at render time, so without this
      // it would still be last frame's pose while the rotation below is this frame's: the camera trailed the jet by one
      // frame of travel (metres, at jet speeds) and that mismatch, varying with frame time, read as first-person jitter.
      g.updateMatrixWorld(true);
      camera.position.copy(g.localToWorld(_pcEye.set(0,1.27,5.9)));
      // Cockpit view is locked to the airframe: mouse aim still steers the jet, but it does NOT swivel the camera.
      // Only holding right mouse changes planeLookYaw/Pitch. Releasing it eases those offsets back to the nose.
      // Orientation = jet attitude * optional head-look offset * a half-turn (camera looks down -Z, jet nose is +Z).
      _pcHeadE.set(-THREE.MathUtils.clamp(planeLookPitch,-1.25,1.25),planeLookYaw,0,'YXZ');
      _pcHeadQ.setFromEuler(_pcHeadE);
      camera.quaternion.copy(g.quaternion).multiply(_pcHeadQ).multiply(_pcFlipQ);
      camera.updateMatrixWorld(true);
      planeCamFinish(dt);
      return;
    }
    // The view direction IS the aim direction (the mouse moves it), so the screen centre is where you are asking the jet to
    // go. Only a few ms of smoothing, to hide whole-pixel mouse steps. The camera sits behind the jet along that direction
    // and never rolls.
    const tgtPitch=planeViewPitch();
    if(!_pcInit || dt<=0){ _pcYaw=planeAimYaw; _pcPitch=tgtPitch; _pcInit=true; }
    else {
      let d=planeAimYaw-_pcYaw; d=Math.atan2(Math.sin(d),Math.cos(d));
      const k=1-Math.exp(-dt/0.04);
      _pcYaw+=d*k;
      _pcPitch+=(tgtPitch-_pcPitch)*(1-Math.exp(-dt/THREE.MathUtils.lerp(0.04,0.22,_pcCobra)));   // slower pitch easing in cobra so velocity noise doesn't jitter the view
    }
    const yaw=_pcYaw+planeLookYaw, pit=THREE.MathUtils.clamp(_pcPitch+planeLookPitch,-1.3,1.3), cp=Math.cos(pit);
    _pcDir.set(Math.sin(yaw)*cp,Math.sin(pit),Math.cos(yaw)*cp);
    const camD=planeCamDist*(1+0.3*_pcCobra+0.12*spT);                  // pull back a little in cobra so the whole jet stays in frame as the nose swings up
    camera.position.copy(g.position).addScaledVector(_pcDir,-camD);
    camera.position.y+=2.6+camD*0.12;
    const floor=terrainHeightAt(camera.position.x,camera.position.z)+2.5;
    if(camera.position.y<floor) camera.position.y=floor;
    _pcLook.copy(g.position).addScaledVector(_pcDir,40);
    camera.up.set(0,1,0);                                      // horizon-locked: never tilts with the aircraft
    camera.lookAt(_pcLook);
    planeCamFinish(dt);
  }

  // On-screen markers: green ring = where you are aiming (persistent), amber chevron = where the nose points.
  // The cockpit camera follows the aim direction, so the green ring stays near the screen centre; the nose cue shows
  // where the aircraft itself is pointing relative to that aim direction.
  function planeMarker(el,dx,dy,dz){
    const g=player.group;
    _pcP.set(g.position.x+dx*800,g.position.y+dy*800,g.position.z+dz*800).project(camera);
    if(_pcP.z>1 || Math.abs(_pcP.x)>1.4 || Math.abs(_pcP.y)>1.4){ el.style.display='none'; return; }
    el.style.display='block';
    el.style.left=((_pcP.x+1)*0.5*window.innerWidth)+'px'; el.style.top=((1-_pcP.y)*0.5*window.innerHeight)+'px';
  }
  // ---- Speed streaks ----
  // Thin streaks of 'air' fixed in the world around the flight path. As the jet flies past them they whip by, which gives the
  // parallax the eye reads as speed (a bare sky or a distant ground has none). Each streak is a camera-facing ribbon that
  // fades out towards its tail, stretched along the direction of flight. They fade in from ~350 km/h and are recycled as
  // they fall behind the camera, so the cost is a fixed ~160 small quads.
  function initSpeedStreaks(){
    const cv=document.createElement('canvas'); cv.width=64; cv.height=4;
    const g=cv.getContext('2d'), gr=g.createLinearGradient(0,0,64,0);
    gr.addColorStop(0,'rgba(255,255,255,0.95)'); gr.addColorStop(0.25,'rgba(255,255,255,0.55)'); gr.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=gr; g.fillRect(0,0,64,4);
    const tex=new THREE.CanvasTexture(cv);
    const pos=new Float32Array(SPK_N*12), uv=new Float32Array(SPK_N*8), idx=new Uint16Array(SPK_N*6);
    for(let i=0;i<SPK_N;i++){
      uv.set([0,0, 0,1, 1,0, 1,1],i*8);                       // head (bright) at u=0, tail (clear) at u=1
      const v=i*4; idx.set([v,v+1,v+2, v+1,v+3,v+2],i*6);
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));
    geo.setIndex(new THREE.BufferAttribute(idx,1));
    const mat=new THREE.MeshBasicMaterial({map:tex,color:0xeef4fb,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,fog:false});
    const mesh=new THREE.Mesh(geo,mat); mesh.frustumCulled=false; mesh.renderOrder=3; mesh.visible=false; mesh.castShadow=false; mesh.receiveShadow=false;
    scene.add(mesh);
    spk={mesh,geo,mat,p:new Float32Array(SPK_N*3),len:new Float32Array(SPK_N)};
  }
  function updateSpeedStreaks(dt){
    const st=planeFM&&planeFM.state;
    const kmh=st?st.speed*7.5:0, want=THREE.MathUtils.smoothstep(kmh,350,950);
    if(!spk){ if(want<=0.01) return; initSpeedStreaks(); }
    spkFade += (want-spkFade)*(dt>0?1-Math.exp(-dt/0.4):1);
    if(spkFade<0.01 || !st){ if(spk.mesh.visible){ spk.mesh.visible=false; _spkSeed=true; } return; }   // hidden: reseed on the next show
    spk.mesh.visible=true; spk.mat.opacity=0.6*spkFade;
    const cam=camera.position, sp=st.speed;
    _skV.set(st.vx/sp,st.vy/sp,st.vz/sp);
    if(Math.abs(_skV.y)>0.95) _skU.set(1,0,0); else _skU.set(0,1,0);
    _skU.cross(_skV).normalize(); _skW.crossVectors(_skV,_skU);
    const baseLen=THREE.MathUtils.clamp(sp*0.05,1.2,9), P=spk.p, L=spk.len, pos=spk.geo.attributes.position.array;
    for(let i=0;i<SPK_N;i++){
      let px=P[i*3],py=P[i*3+1],pz=P[i*3+2];
      _skR.set(px-cam.x,py-cam.y,pz-cam.z);
      const along=_skR.dot(_skV), lat2=_skR.lengthSq()-along*along;
      if(_spkSeed || along<-30 || along>SPK_AHEAD*1.25 || lat2>SPK_RMAX*SPK_RMAX*1.7){
        const a=_spkSeed?(-30+Math.random()*(SPK_AHEAD+30)):SPK_AHEAD*(0.55+0.45*Math.random());
        const r=SPK_RMIN+Math.sqrt(Math.random())*(SPK_RMAX-SPK_RMIN), th=Math.random()*Math.PI*2, c=Math.cos(th)*r, s2=Math.sin(th)*r;
        px=cam.x+_skV.x*a+_skU.x*c+_skW.x*s2; py=cam.y+_skV.y*a+_skU.y*c+_skW.y*s2; pz=cam.z+_skV.z*a+_skU.z*c+_skW.z*s2;
        P[i*3]=px; P[i*3+1]=py; P[i*3+2]=pz; L[i]=0.6+0.8*Math.random();
        _skR.set(px-cam.x,py-cam.y,pz-cam.z);
      }
      const len=baseLen*L[i], dist=_skR.length();
      _skS.crossVectors(_skV,_skR); const sl=_skS.length();
      if(sl<1e-4) _skS.copy(_skU); else _skS.multiplyScalar(1/sl);
      const hw=0.012+dist*0.0007; _skS.multiplyScalar(hw);
      const o=i*12, tx=px+_skV.x*len, ty=py+_skV.y*len, tz=pz+_skV.z*len;
      pos[o]=px-_skS.x;   pos[o+1]=py-_skS.y;   pos[o+2]=pz-_skS.z;
      pos[o+3]=px+_skS.x; pos[o+4]=py+_skS.y;   pos[o+5]=pz+_skS.z;
      pos[o+6]=tx-_skS.x; pos[o+7]=ty-_skS.y;   pos[o+8]=tz-_skS.z;
      pos[o+9]=tx+_skS.x; pos[o+10]=ty+_skS.y;  pos[o+11]=tz+_skS.z;
    }
    _spkSeed=false;
    spk.geo.attributes.position.needsUpdate=true;
  }
  // Everything that depends on the final camera pose for this frame.
  function planeCamFinish(dt){
    blurPos.copy(camera.position); blurQuat.copy(camera.quaternion);   // feeds the motion-blur pass (was only fed in the tank camera)
    updateSpeedStreaks(dt);
    updatePlaneMarkers();
  }

  function updatePlaneMarkers(){
    if(!planeAimEl){
      planeAimEl=document.createElement('div');
      planeAimEl.style.cssText='position:fixed;width:30px;height:30px;margin:-15px 0 0 -15px;border:2px solid #9fe870;border-radius:50%;box-shadow:0 0 6px #000a,inset 0 0 6px #0008;pointer-events:none;z-index:45;display:none';
      planeAimEl.innerHTML='<i style="position:absolute;left:50%;top:50%;width:4px;height:4px;margin:-2px;background:#9fe870;border-radius:50%"></i>';
      planeNoseEl=document.createElement('div');
      planeNoseEl.style.cssText='position:fixed;width:16px;height:16px;margin:-8px 0 0 -8px;border:2px solid #ffd34d;border-top:none;border-right:none;transform:rotate(135deg) scale(.8);box-shadow:-1px 1px 4px #000a;pointer-events:none;z-index:45;display:none';
      document.body.appendChild(planeAimEl); document.body.appendChild(planeNoseEl);
    }
    camera.updateMatrixWorld();
    // In cockpit mode the mouse is pointer-locked, so physical movement supplies deltas for flight control
    // while the visible aim cursor stays planted in the exact screen centre. Do NOT project the persistent
    // world-space aim direction here: that makes the ring slide towards the edges while the jet turns.
    // Mouse deltas still update planeAimYaw/planeAimPitch in the mousemove handler, so the jet keeps
    // responding exactly as it did before. Right mouse temporarily diverts those deltas to head-look.
    if(player.isAircraft && player.cockpitView){
      planeAimEl.style.display='block';
      planeAimEl.style.left=(window.innerWidth*0.5)+'px';
      planeAimEl.style.top=(window.innerHeight*0.5)+'px';
      planeNoseEl.style.display='none';
      return;
    }
    const rp=planeViewPitch(), cp=Math.cos(rp);
    planeMarker(planeAimEl,cp*Math.sin(planeAimYaw),Math.sin(rp),cp*Math.cos(planeAimYaw));
    _pcNose.set(0,0,1).applyQuaternion(player.group.quaternion);
    planeMarker(planeNoseEl,_pcNose.x,_pcNose.y,_pcNose.z);
  }

  function update(dt){
    if(!player.isAircraft){
      if(player.destroyed){ keys['w']=keys['s']=keys['a']=keys['d']=false; } // a wreck can't drive
      const mobility = mobilityOf(player);
      // Build speed progressively. Pressing the opposite direction brakes to a
      // stop first, then starts reversing instead of instantly snapping through 0.
      const fwdCap=Math.min(MAX_FWD*mobility,slopeSpeedLimit(player,config,1));
      const revCap=Math.min(-MAX_REV*mobility,slopeSpeedLimit(player,config,-1));
      if(freeCam){
        speed=approach(speed,0,FRICTION*dt); // let the tank coast to a stop while the free cam is out flying around
      } else if(keys['w']){
        speed=approach(speed,speed<0?0:fwdCap,(speed<0?BRAKE:ACCEL)*dt);
      } else if(keys['s']){
        speed=approach(speed,speed>0?0:-revCap,(speed>0?BRAKE:REVERSE_ACCEL)*dt);
      } else {
        speed=approach(speed,0,FRICTION*dt);
      }
      speed = Math.max(MAX_REV*mobility, Math.min(MAX_FWD*mobility, speed));
      // Entering a slope faster than the engine can sustain: bleed speed off smoothly instead of snapping to the cap.
      if(speed>fwdCap) speed=Math.max(fwdCap,speed-BRAKE*0.6*dt);
      else if(speed<-revCap) speed=Math.min(-revCap,speed+BRAKE*0.6*dt);
      const driveDirection=speed>0.2?1:speed<-0.2?-1:0;
      if(config.armor==='heavy'&&driveDirection&&lastDriveDirection&&driveDirection!==lastDriveDirection)playAudioClip(tankShiftClip,0.16);
      if(driveDirection)lastDriveDirection=driveDirection;
      updateEngineSound();

      // Heavy hulls take time to build and shed steering rate instead of
      // snapping to a new heading as soon as a steering key is pressed.
      const speedFrac = Math.min(Math.abs(speed)/MAX_FWD, 1);
      const rotSpeed = config.turnSpeed * (1 - 0.52*speedFrac);
      const desiredTurnRate=freeCam?0:((keys['a']?1:0)-(keys['d']?1:0))*rotSpeed;
      // Track mass takes time to wind up and settle; this also eases the hull
      // when the player releases or reverses the steering input.
      hullTurnVelocity=approach(hullTurnVelocity,desiredTurnRate,config.turnSpeed*0.82*dt);
      player.group.rotation.y+=hullTurnVelocity*dt;
    
      // IS-7 turning speed penalty: large tracks cause significant slowdown while turning
      const isTurning = Math.abs(hullTurnVelocity) > 0.05;
      const turnPenalty = (config.turnPenalty && isTurning) ? config.turnPenalty : 1.0;

      if(Math.abs(speed) > 0.001){
        const dir = new THREE.Vector3(0,0,1).applyAxisAngle(new THREE.Vector3(0,1,0), player.group.rotation.y);
        const effectiveSpeed = speed * turnPenalty; // Apply turn penalty to movement speed
        const nextX = Math.max(-half, Math.min(half, player.group.position.x + dir.x*effectiveSpeed*dt));
        const nextZ = Math.max(-half, Math.min(half, player.group.position.z + dir.z*effectiveSpeed*dt));
        const blocked = colliderHit(nextX,nextZ,1.65) || (mapBlockedAt && mapBlockedAt(nextX,nextZ) && !mapBlockedAt(player.group.position.x,player.group.position.z));
        if(!blocked){ player.group.position.x=nextX; player.group.position.z=nextZ; }
        else speed=approach(speed,0,BRAKE*dt);
      }
      player.group.position.y = terrainHeightAt(player.group.position.x,player.group.position.z);
      if(!player.wheelPositions?.length)alignTankToTerrain(player); // sprung tanks (Panther, IS-7) are driven by the suspension
      applyRealSuspension(player,speed,dt);
      player.hullTurnVelocity = hullTurnVelocity; // Store for reference
      updateSunShadow(player.group.position);
      // Drive the tracks: differential speed while turning, counter-rotation when pivoting
      player.updateTracks(speed - hullTurnVelocity*player.trackGauge, speed + hullTurnVelocity*player.trackGauge, dt);
      const actualSpeedKmh = Math.round(speed*7.5);
      const speedKmh = tankId==='panther'
        ? Math.sign(actualSpeedKmh)*Math.min(60,Math.abs(actualSpeedKmh))
        : actualSpeedKmh;
      setTxt(speedEl, speedKmh + ' km/h' + (speed < -0.05 ? ' (reverse)' : ''));
      const heading = ((player.group.rotation.y * 180 / Math.PI) % 360 + 360) % 360;
      setTxt(tankHeadingEl, 'HULL · ' + String(Math.round(heading)%360).padStart(3,'0') + '°');
      setCss(tankGlyphEl, 'rotate(' + (Math.round(heading*10)/10) + 'deg)');
  { const tg='rotate(' + (Math.round(-player.turretPivot.rotation.y*1800/Math.PI)/10) + ' 24 43)';
        if(tankTurretGlyphEl.__t!==tg){ tankTurretGlyphEl.__t=tg; tankTurretGlyphEl.setAttribute('transform', tg); } }
      setTxt(tankGearEl, Math.abs(speed) < 0.05 ? 'GEAR N' : (speed < 0 ? 'GEAR R' : 'GEAR F'));
      setTxt(tankSpeedEl, Math.abs(speedKmh) + ' km/h');

      // Convert the fixed world aim point back into the moving hull's local axes.
      // Hull steering and translation therefore make the turret compensate.
      if(!freeCam) updateChaseRig(camRealDt); // camera pose for this frame, before it is used to pick the aim point
      // Instant convergence: the aim point follows the camera ray immediately (free look freezes it). Only the turret
      // and barrel below are slow - they chase this point through moveHeavyAxis() at TURRET_SPEED / TURRET_PITCH_SPEED.
      if(!freeCam && !aimView && !(orbitDragging||cameraLocked)) aimWorldPoint.copy(cameraAimPoint());
      const aimDirection=aimWorldPoint.clone().sub(aimOrigin()).normalize();
      const aimWorldDir=aimDirection.clone();
      const hullDirection=aimDirection.applyQuaternion(player.group.quaternion.clone().invert());
      let targetTurretY=Math.atan2(hullDirection.x,hullDirection.z);
      const gunDirection=hullDirection.clone().applyAxisAngle(new THREE.Vector3(0,1,0),-targetTurretY);
      let targetPitch=-Math.atan2(gunDirection.y,Math.hypot(gunDirection.x,gunDirection.z));
      targetTurretY = Math.atan2(Math.sin(targetTurretY), Math.cos(targetTurretY));
      const lrfUnits=aimView?1/sightInvR:aimWorldPoint.distanceTo(aimOrigin());
      if(lrfEl) lrfEl.textContent='LRF '+(lrfUnits>=AIM_MAX_RANGE-1?'----':Math.round(lrfUnits*METERS_PER_WORLD_UNIT/5)*5)+' m · STAB '+(Math.abs(speedKmh)>40?'LIMIT':'ON');
      if(config.stabilizer && !player.destroyed){
        // Two-axis gun stabilizer: whatever the hull did since last frame (bump, pitch, roll, steering) is cancelled
        // at once on the turret ring and the trunnions, so the gun stays laid on the point it was aimed at.
        if(stabPrevQuat){
          const hd=aimWorldDir.clone().applyQuaternion(stabPrevQuat.clone().invert());
          const y0=Math.atan2(hd.x,hd.z);
          const gd=hd.clone().applyAxisAngle(new THREE.Vector3(0,1,0),-y0);
          const p0=-Math.atan2(gd.y,Math.hypot(gd.x,gd.z));
          const lim=config.stabilizer.rate*Math.max(dt,0.001);
          const dYaw=THREE.MathUtils.clamp(Math.atan2(Math.sin(targetTurretY-y0),Math.cos(targetTurretY-y0)),-lim,lim);
          const dPitch=THREE.MathUtils.clamp(targetPitch-p0,-lim,lim);
          player.turretPivot.rotation.y+=dYaw;
          player.barrelPitchPivot.rotation.x=THREE.MathUtils.clamp(player.barrelPitchPivot.rotation.x+dPitch,
            config.minPitch!==undefined?config.minPitch:-0.28, config.maxPitch!==undefined?config.maxPitch:0.22);
        }
        stabPrevQuat=player.group.quaternion.clone();
      }
      // Apply pitch limits (casemate tanks have custom limits, others use default)
      const maxPitch = config.maxPitch !== undefined ? config.maxPitch : 0.22;
      const minPitch = config.minPitch !== undefined ? config.minPitch : -0.28;
      targetPitch = Math.max(minPitch, Math.min(maxPitch, targetPitch));
    
      // Handle turret/gun traverse (casemate vs rotating turret)
      if(config.isCasemate && player.gunTraversePivot){
        // Casemate: gun traverse is limited, traverse the gun mount within limits
        const maxTraverse = config.maxTraverse || 0.174; // default ±10°
        const yawError = Math.atan2(Math.sin(targetTurretY), Math.cos(targetTurretY)); // error from center (0)
        const clampedTarget = Math.max(-maxTraverse, Math.min(maxTraverse, yawError));
        const traverseError = clampedTarget - player.gunTraversePivot.rotation.y;
        const TRAVERSE_SPEED = 0.3; // Slow manual traverse for casemate
        const TRAVERSE_ACCEL = TRAVERSE_SPEED * 1.5;
        const traverseMove = moveHeavyAxis(player.gunTraversePivot.rotation.y, turretVelocity, traverseError, TRAVERSE_SPEED, TRAVERSE_ACCEL, dt);
        player.gunTraversePivot.rotation.y = Math.max(-maxTraverse, Math.min(maxTraverse, traverseMove.value));
        turretVelocity = traverseMove.velocity;
      } else {
        // Rotating turret: normal traverse
        const yawError = Math.atan2(Math.sin(targetTurretY-player.turretPivot.rotation.y), Math.cos(targetTurretY-player.turretPivot.rotation.y));
        const yawMove = moveHeavyAxis(player.turretPivot.rotation.y, turretVelocity, yawError, TURRET_SPEED, TURRET_ACCEL, dt);
        player.turretPivot.rotation.y = yawMove.value;
        turretVelocity = yawMove.velocity;
      }
    
      const pitchMove = moveHeavyAxis(player.barrelPitchPivot.rotation.x, barrelPitchVelocity, targetPitch-player.barrelPitchPivot.rotation.x, TURRET_PITCH_SPEED, TURRET_PITCH_ACCEL, dt);
      player.barrelPitchPivot.rotation.x = pitchMove.value;
      barrelPitchVelocity = pitchMove.velocity;

      for(const bot of [...allies,...enemies]){
        updateBot(bot,dt);
        if(bot.burnTime>0){
          bot.burnTime-=dt;
          bot.totalBurnTime=(bot.totalBurnTime||0)+dt;
          if(!bot.destroyed && (bot.engineHealth??1)<=0 && bot.totalBurnTime>25) {
            bot.destroyed=true;
          }
        }
        updateGunRecoil(bot,dt);
      }
      if(player.burnTime>0){
        player.burnTime-=dt;
        player.totalBurnTime=(player.totalBurnTime||0)+dt;
        if(!player.destroyed && (player.engineHealth??1)<=0 && player.totalBurnTime>25) {
          player.destroyed=true;
        }
      }
      updateGunRecoil(player,dt);
    } else {
      updatePlaneFlight(dt);
    }

    // Projectiles
    for(let i=projectiles.length-1;i>=0;i--){
      const p = projectiles[i];
      let impact=false;
      const steps=Math.max(1,Math.ceil(p.velocity.length()*dt/2.5));
      const stepDt=dt/steps;
      for(let step=0;step<steps && !impact;step++){
        const previousPosition=p.mesh.position.clone();
        p.velocity.y-=GRAVITY_WORLD*stepDt;
        p.mesh.position.addScaledVector(p.velocity,stepDt);
        const segment=p.mesh.position.clone().sub(previousPosition);
        const travel=segment.length();
        if(travel>0){p.dir.copy(segment).divideScalar(travel);p.dist+=travel;}
        p.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),p.dir);
        const targets=p.team==='red'?[player,...allies]:enemies;
        for(const target of targets){
          if(!target.destroyed&&resolveShellHit(p,previousPosition,target)){impact=true;break;}
        }
        if(!impact && p.mesh.position.y<=terrainHeightAt(p.mesh.position.x,p.mesh.position.z)+0.08){ impact=true; fxTerrainImpact(p.mesh.position,p.dir); }
        // Town map: shells burst against walls and roofs.
        if(!impact && mapSolidAt && mapSolidAt(p.mesh.position.x,p.mesh.position.y,p.mesh.position.z)){ impact=true; fxTerrainImpact(p.mesh.position,p.dir); }
      }
      const trailPositions = p.trail.geometry.attributes.position.array;
      const tail = p.mesh.position.clone().addScaledVector(p.dir,-3.2);
      trailPositions[0]=tail.x; trailPositions[1]=tail.y; trailPositions[2]=tail.z;
      trailPositions[3]=p.mesh.position.x; trailPositions[4]=p.mesh.position.y; trailPositions[5]=p.mesh.position.z;
      p.trail.geometry.attributes.position.needsUpdate=true;
      p.life -= dt;
      if(impact || p.life<=0){
        scene.remove(p.mesh);
        scene.remove(p.trail);
        p.trail.geometry.dispose();
        projectiles.splice(i,1);
      }
    }

    if(!player.isAircraft && reloadRemaining > 0){
      reloadRemaining = Math.max(0, reloadRemaining - dt/reloadMult(player));
      if(reloadRemaining===0)playAudioClip(tankReadyClip,0.24);
      
      // Check if magazine reload is complete
      if(reloadRemaining === 0 && isReloadingMagazine){
        isReloadingMagazine = false;
        shotsInMagazine = config.magazineSize || 0;
      }
      
      updateReloadHUD();
    }

    updateSmoke(dt);
    fxUpdate(dt);
    if(player.isAircraft) updatePlaneCamera(dt); else updateCamera(dt);
    
    if(!player.isAircraft){
      // Update penetration indicator and crosshair position (works in both normal and aim view)
      player.group.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);
    
      // Calculate where shell will actually hit (with ballistic drop)
      const impactResult = calculateShellImpact();
    
      // Always show the crosshair at the shell impact point (or barrel direction if no hit)
      let displayPoint;
      if(impactResult.willHit){
        displayPoint = impactResult.hitPoint;
      } else {
        // If not hitting tank, show where barrel is pointing
        displayPoint = impactResult.landing || player.barrelPitchPivot.localToWorld(new THREE.Vector3(0,0,100));
      }
    
      // Project to screen
      const impactScreen = displayPoint.clone().project(camera);
      const px = (impactScreen.x * 0.5 + 0.5) * window.innerWidth;
      const py = (-impactScreen.y * 0.5 + 0.5) * window.innerHeight;
      const onScreen = impactScreen.z > -1 && impactScreen.z < 1 && px > 12 && px < window.innerWidth - 12 && py > 12 && py < window.innerHeight - 12;
    
      gunCrosshair.style.visibility = onScreen ? 'visible' : 'hidden';
      if(onScreen){
        gunCrosshair.style.left = px + 'px';
        gunCrosshair.style.top = py + 'px';
        gunCrosshair.className = impactResult.willHit ? 'pen-auto' : 'pen-black';
        if(impactResult.willHit){
          // Blend the penetration cue across the armor margin instead of flipping
          // from yellow to green at one exact millimeter threshold.
          const margin=impactResult.penMargin??-60;
          const mix=THREE.MathUtils.clamp((margin+25)/75,0,1);
          const red=mix<0.5?239:Math.round(239+(74-239)*(mix-0.5)*2);
          const green=mix<0.5?Math.round(68+(187-68)*mix*2):222;
          const blue=mix<0.5?Math.round(68+(36-68)*mix*2):Math.round(36+(128-36)*(mix-0.5)*2);
          gunCrosshair.style.setProperty('--pen-color',`rgb(${red}, ${green}, ${blue})`);
        }
      }
    
      // Turret marker follows the actual elevated barrel axis, not just turret yaw.
      if(!aimView){
        player.group.updateMatrixWorld(true);
        const barrelOrigin=player.barrelPitchPivot.localToWorld(new THREE.Vector3());
        const turretAim=player.barrelPitchPivot.localToWorld(new THREE.Vector3(0,0,80));
        const barrelDirection=turretAim.sub(barrelOrigin).normalize();
        turretAim.copy(barrelOrigin).addScaledVector(barrelDirection,80);
        turretAim.project(camera);
        const tcx = (turretAim.x * 0.5 + 0.5) * window.innerWidth;
        const tcy = (-turretAim.y * 0.5 + 0.5) * window.innerHeight;
        const tcOnScreen = turretAim.z > -1 && turretAim.z < 1 && tcx > 12 && tcx < window.innerWidth - 12 && tcy > 12 && tcy < window.innerHeight - 12;
        turretCircle.style.visibility = tcOnScreen ? 'visible' : 'hidden';
        if(tcOnScreen){
          turretCircle.style.left = tcx + 'px';
          turretCircle.style.top = tcy + 'px';
        }
      } else {
        turretCircle.style.visibility = 'hidden';
      }
    } else {
      gunCrosshair.style.visibility = 'hidden';
      turretCircle.style.visibility = 'hidden';
    }
  }
  
  // Calculate where the shell will actually impact (including ballistic drop)
  const _siPrev=new THREE.Vector3(), _siSeg=new THREE.Vector3(), _siCand=[], _NO_HITS=[];
  function segmentNearPoint(a,b,c,yOff,R){   // is point c (raised by yOff) within R of segment a-b? (no allocations)
    const dx=b.x-a.x, dy=b.y-a.y, dz=b.z-a.z, px=c.x-a.x, py=c.y+yOff-a.y, pz=c.z-a.z, l2=dx*dx+dy*dy+dz*dz;
    let t=l2>0?(px*dx+py*dy+pz*dz)/l2:0; t=t<0?0:t>1?1:t;
    const ex=px-dx*t, ey=py-dy*t, ez=pz-dz*t;
    return ex*ex+ey*ey+ez*ez<=R*R;
  }
  function calculateShellImpact(){
    const liveEnemies=enemies.filter(unit=>!unit.destroyed);
    
    // Use the same direction calculation as fire()
    player.group.updateMatrixWorld(true);
    const barrelOrigin = muzzlePosition(player, tankId);
    const barrelDir = player.barrelPitchPivot.localToWorld(new THREE.Vector3(0,0,1))
      .sub(player.barrelPitchPivot.getWorldPosition(new THREE.Vector3())).normalize();
    
    // Simulate ballistic trajectory
    const shellSpeed = config.shellSpeed / METERS_PER_WORLD_UNIT;
    const velocity = barrelDir.clone().multiplyScalar(shellSpeed);
    const pos = barrelOrigin.clone();
    const dt = 0.02;
    const maxTime = 2.2; // same as the real shell's life in launchShell()
    
    for(let t = 0; t < maxTime; t += dt){
      const prevPos = _siPrev.copy(pos);
      velocity.y -= GRAVITY_WORLD * dt;
      pos.addScaledVector(velocity, dt);
      
      const segment = _siSeg.copy(pos).sub(prevPos);
      const segLen = segment.length();
      if(segLen > 0){
        const dir = segment.divideScalar(segLen);
        shellRay.set(prevPos, dir);
        shellRay.far = segLen;
        
        // The whole ~110-step flight is simulated every frame. Only tanks near this short stretch can be hit, so test one
        // sphere per tank and raycast just those tanks' plates (it used to rebuild the plate list of ALL enemies, and
        // raycast every plate, at every single step).
        _siCand.length = 0;
        for(let u=0; u<liveEnemies.length; u++){
          const ms = liveEnemies[u].armorMeshes;
          if(ms && segmentNearPoint(prevPos, pos, liveEnemies[u].group.position, 1.5, PICK_RADIUS))
            for(let j=0; j<ms.length; j++) _siCand.push(ms[j]);
        }
        const hits = _siCand.length ? shellRay.intersectObjects(_siCand, false) : _NO_HITS;
        const shK = config.shell, shotKinetic = !(shK && (shK.isHEAT || shK.isHESH || shK.isHE));
        const hit = hits.find(hh => !(hh.object.userData.addOnPanel && shotKinetic) && hh.face.normal.clone().transformDirection(hh.object.matrixWorld).dot(dir) <= 0);
        if(hit){
          const nW = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
          
          if(nW.dot(dir) > 0) continue;
          
          const ud = hit.object.userData;
          if(ud.addOnPanel) return {willHit: true, hitPoint: hit.point, penColor: 'red', penMargin: -60}; // HEAT/HE would be wasted on the spaced armour
          const plate = ud.armorByNormal ? ud.armorByNormal(hit.face.normal) : {t:ud.armorThicknessMM, zone:ud.armorZone};
          
          const distance = hit.point.distanceTo(barrelOrigin);
          const ang = Math.acos(THREE.MathUtils.clamp(-dir.dot(nW), 0.02, 1));
          const sh = config.shell;
          const Teff = plate.ke ? effectiveThickness(sh, plate, plate.t, ang) : plate.t / Math.max(0.28, Math.cos(Math.max(0, ang - sh.normalization * DEG)));
          const Tn = plate.ke ? plate.ke * Math.cos(plate.ref || 0) : plate.t;
          const pen = sh.penNear + (sh.penFar - sh.penNear) * Math.min(1, distance / 220);
          
          const ricAng = 68 * DEG;
          let penColor = 'red',penMargin=-60;
          if(ang > ricAng && sh.caliber < 2.5 * Tn){
            penColor = 'red';
          } else {
            const margin = pen - Teff;
            penMargin=margin;
            if(margin > 30) penColor = 'green';
            else if(margin > 0) penColor = 'yellow';
            else penColor = 'red';
          }
          
          return {willHit: true, hitPoint: hit.point, penColor: penColor, penMargin};
        }
      }
      
      if(pos.y <= terrainHeightAt(pos.x, pos.z) || (mapSolidAt && mapSolidAt(pos.x,pos.y,pos.z))) break;
    }
    
    return {willHit: false, penColor: 'black', landing: pos.clone()};   // where the shell comes down
  }


  // ---------- Match layer: hit feedback, kill feed, scoring, module damage, minimap, match flow ----------
  const KIND_NAME={tiger:'TIGER 131',panther:'PANTHER',sturer:'STURER EMIL',is7:'IS-7',fv4005:'FV4005',amx50:'M-V-YOH',t54e1:'T54E1',leopard1a5:'LEOPARD 1A5',m1abrams:'M1 ABRAMS',t72b:'T-72B',challenger1:'CHALLENGER 1',k1:'K1',su30sm:'SU-30SM'};
  const M={kills:0,damage:0,shots:0,hits:0,pens:0,score:0,over:false,spectating:false,slow:0,extinguishers:2,
    start:performance.now(),uiT:0,mapT:0,deadAt:0,endAt:0,endKind:null,deadShown:false};
  const mk=(tag,id)=>{const e=document.createElement(tag);e.id=id;document.body.appendChild(e);return e;};
  const killFeedEl=mk('div','killFeed'), scoreBoardEl=mk('div','scoreBoard'), scoreFeedEl=mk('div','scoreFeed');
  const killBannerEl=mk('div','killBanner'), moduleHudEl=mk('div','moduleHud'), fireWarnEl=mk('div','fireWarn');
  const hitDirEl=mk('div','hitDir'), resultEl=mk('div','resultOverlay'), miniCv=mk('canvas','minimap');
  hitDirEl.innerHTML='<i></i>'; miniCv.width=miniCv.height=180;
  const instr=document.getElementById('instructions');
  if(instr){
    if(player.isAircraft) instr.textContent='MOUSE AIM: move the mouse to steer toward a persistent aim direction; in cockpit mode the green cursor stays fixed at screen centre while mouse deltas still control the jet · Right mouse = look around in cockpit/chase view · Release right mouse to return · Takeoff: hold W for throttle (afterburner above 70%), lift the nose near 280 km/h and press G for gear up · A/D rudder · B brake · I = instructor protection · T = thrust vectoring · X = cobra mode · C cockpit · Scroll = cockpit FOV / chase zoom · 0 free cam';
    else instr.textContent+=' · F fire extinguisher'+(player.availableShells?' · 1-'+player.availableShells.length+' select shell':'')+' · V cinematic look';
  }

  // Module panel: engine, transmission, fuel, ammo, and one pip per crew member.
  moduleHudEl.innerHTML='<span class="mh-chip" data-k="engine">ENGINE</span><span class="mh-chip" data-k="trans">TRANS</span>'+
    '<span class="mh-chip" data-k="fuel">FUEL</span><span class="mh-chip" data-k="ammo">AMMO</span><span class="mh-crew"></span><span class="mh-ext"></span>';
  const crewBox=moduleHudEl.querySelector('.mh-crew'), extBox=moduleHudEl.querySelector('.mh-ext');
  const playerCrew=player.modules.filter(m=>m.type==='crew');
  playerCrew.forEach(m=>{const i=document.createElement('i');i.title=m.name;crewBox.appendChild(i);});

  function teamClass(t){return (t===player||t.team==='blue')?'ally':'enemy';}
  function unitLabel(t){return t===player?'YOU':(KIND_NAME[t.kind]||'TANK');}
  const mobilityOf=t=>(0.3+0.7*(t.engineHealth??1))*(0.7+0.3*(t.transHealth??1))*((t.modules||[]).some(m=>m.name==='Driver'&&m.dead)?0.5:1);
  const reloadMult=t=>Math.min(2.6,1+0.4*(t.modules||[]).filter(m=>m.type==='crew'&&m.dead).length);

  // --- audio (short synthesized cues, same WebAudio context as the rest of the game) ---
  function tone(freq,at,dur,type,gain,endFreq){
    ensureAudio(); if(!audioContext||!masterAudioGain) return;
    const t=audioContext.currentTime+at, o=audioContext.createOscillator(), g=audioContext.createGain();
    o.type=type; o.frequency.setValueAtTime(freq,t); if(endFreq) o.frequency.exponentialRampToValueAtTime(endFreq,t+dur);
    g.gain.setValueAtTime(gain,t); g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    o.connect(g); g.connect(masterAudioGain); o.start(t); o.stop(t+dur+0.02);
  }
  function playHitConfirm(kind){
    if(kind==='pen'){tone(1900,0,0.07,'sine',0.26);tone(1250,0.07,0.1,'sine',0.26);tone(140,0,0.18,'sine',0.35,60);}
    else if(kind==='nopen'){tone(950,0,0.06,'triangle',0.2);}
    else if(kind==='ric'){tone(2300,0,0.04,'sine',0.14);}
    else if(kind==='taken'){tone(95,0,0.32,'sine',0.55,38);tone(420,0,0.08,'square',0.12,160);}
  }
  function playKillSound(won){
    if(won){tone(660,0,0.12,'triangle',0.3);tone(880,0.11,0.12,'triangle',0.3);tone(1320,0.22,0.35,'triangle',0.32);tone(70,0,0.5,'sine',0.4,30);}
    else{tone(330,0,0.3,'sawtooth',0.18,110);tone(110,0.05,0.6,'sine',0.35,40);}
  }

  // --- feedback widgets ---
  function pushTimed(parent,html,cls,ms,max){
    const d=document.createElement('div'); d.className=cls; d.innerHTML=html; parent.prepend(d);
    while(parent.children.length>max) parent.lastChild.remove();
    setTimeout(()=>d.classList.add('out'),ms); setTimeout(()=>d.remove(),ms+500);
  }
  function addScore(pts,label){
    M.score+=pts; pushTimed(scoreFeedEl,'<b>+'+pts+'</b> '+label,'sc-row',2200,5);
  }
  function showBanner(text,cls){
    killBannerEl.textContent=text; killBannerEl.className=cls; void killBannerEl.offsetWidth; killBannerEl.classList.add('show');
    clearTimeout(showBanner.t); showBanner.t=setTimeout(()=>killBannerEl.classList.remove('show'),1700);
  }
  function addKillFeed(attacker,victim){
    const v='<span class="kf-'+teamClass(victim)+'">'+unitLabel(victim)+'</span>';
    const html=attacker&&attacker!==victim
      ?'<span class="kf-'+teamClass(attacker)+'">'+unitLabel(attacker)+'</span><em>▸</em>'+v
      :v+'<em class="kf-fire">burned out</em>';
    pushTimed(killFeedEl,html,'kf-row',7000,5);
  }
  function hitIndicator(dir,result){
    if(!dir) return;
    const f=camera.getWorldDirection(new THREE.Vector3()); f.y=0; f.normalize();
    const sx=-dir.x, sz=-dir.z, l=Math.hypot(sx,sz)||1, rx=-f.z, rz=f.x;
    const ang=Math.atan2((sx*rx+sz*rz)/l,(sx*f.x+sz*f.z)/l);
    hitDirEl.style.transform='rotate('+ang+'rad)';
    hitDirEl.className=result==='pen'?'pen':'block'; void hitDirEl.offsetWidth; hitDirEl.classList.add('show');
  }

  // --- hooks called from the penetration model and the effects system ---
  const NOTE_POINTS=[[/knocked out/,30,'CREW KNOCKED OUT'],[/Fire!/,30,'SET ON FIRE'],[/Engine hit/,15,'ENGINE DAMAGED'],
    [/Transmission/,15,'TRANSMISSION DAMAGED'],[/Ammo rack hit/,20,'AMMO RACK HIT'],[/Fuel tank/,10,'FUEL TANK HIT']];
  function matchOnShot(p,target,result,rep,dir){
    if(result==='pen'&&p.shooter) target.lastAttacker=p.shooter;
    if(target===player){ hitIndicator(dir,result); if(result==='pen'){playHitConfirm('taken');cameraKick=Math.max(cameraKick,0.03);camTrauma=Math.min(1,camTrauma+0.3);} }
    if(p.shooter!==player) return;
    M.hits++;
    if(result==='ricochet'){addScore(5,'RICOCHET');playHitConfirm('ric');return;}
    if(result==='nopen'){addScore(10,'ARMOR HIT');playHitConfirm('nopen');return;}
    M.pens++; M.damage+=rep.dmg;
    addScore(40+Math.round(rep.dmg/10),'PENETRATION');
    for(const n of rep.notes){const hit=NOTE_POINTS.find(r=>r[0].test(n)); if(hit) addScore(hit[1],hit[2]);}
    playHitConfirm('pen');
  }
  function matchOnDestroyed(t){
    const a=t.lastAttacker;
    addKillFeed(a,t);
    if(t===player){M.deadAt=performance.now();showBanner('YOU WERE DESTROYED','lost');playKillSound(false);return;}
    if(a===player){
      M.kills++; addScore(150,'DESTROYED '+unitLabel(t)); if(t.ammoBlown) addScore(100,'AMMUNITION DETONATION');
      showBanner('TARGET DESTROYED','kill'); playKillSound(true); M.slow=t.ammoBlown?1.5:1.0; // brief slow-motion kill cam
    }
  }
  function useExtinguisher(){
    if(player.destroyed) return;
    if(player.burnTime<=0){ showBanner('NO FIRE','info'); return; }
    if(M.extinguishers<=0){ showBanner('NO EXTINGUISHERS LEFT','lost'); return; }
    M.extinguishers--; player.burnTime=0; player.totalBurnTime=0; showBanner('FIRE EXTINGUISHED','info');
    tone(900,0,0.5,'sawtooth',0.06,300);
  }

  // --- per-frame update ---
  function matchTick(dt){
    updateSpotting(dt);
    // Bots put out their own fires after a short panic delay.
    for(const b of [...allies,...enemies]){
      if(b.destroyed) continue;
      if(b.burnTime>0){
        b.fireClock=(b.fireClock||0)+dt; b.extDelay=b.extDelay||(3+Math.random()*4);
        if(b.fireClock>b.extDelay&&(b.ext??1)>0){b.burnTime=0;b.totalBurnTime=0;b.ext=(b.ext??1)-1;b.fireClock=0;b.extDelay=0;}
      } else b.fireClock=0;
    }
    M.uiT+=dt; M.mapT+=dt;
    if(M.uiT>0.1){M.uiT=0; updateModuleHud(); updateScoreBoard(); updateFireWarn(); checkMatchEnd();}
    if(M.mapT>0.06){M.mapT=0; drawMinimap();}
  }
  function updateModuleHud(){
    const st=(h)=>h>0.7?'ok':(h>0.3?'warn':'bad');
    const set=(k,s)=>moduleHudEl.querySelector('[data-k="'+k+'"]').className='mh-chip '+s;
    set('engine',st(player.engineHealth??1)); set('trans',st(player.transHealth??1));
    const dmg=type=>player.modules.some(m=>m.type===type&&m.damaged);
    set('fuel',player.burnTime>0?'bad':(dmg('fuel')?'warn':'ok')); set('ammo',dmg('ammo')?'warn':'ok');
    [...crewBox.children].forEach((i,k)=>i.className=playerCrew[k].dead?'dead':'');
    extBox.textContent='EXT ×'+M.extinguishers; extBox.className='mh-ext'+(M.extinguishers?'':' none');
    moduleHudEl.classList.toggle('dead',player.destroyed);
  }
  function updateScoreBoard(){
    const side=list=>list.filter(t=>!t.destroyed).length;
    const a=side(allies)+(!player.destroyed?1:0), e=side(enemies), s=Math.floor((performance.now()-M.start)/1000);
    setHTML(scoreBoardEl,'<div class="sb-main"><span class="sb-ally">'+a+'<small>/'+(allies.length+1)+'</small></span>'+
      '<span class="sb-time">'+String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')+'</span>'+
      '<span class="sb-enemy">'+e+'<small>/'+enemies.length+'</small></span></div><div class="sb-score">SCORE '+M.score+'</div>');
  }
  function updateFireWarn(){
    const burning=player.burnTime>0&&!player.destroyed;
    fireWarnEl.classList.toggle('on',burning);
    if(burning) fireWarnEl.textContent=M.extinguishers?'ENGINE FIRE · PRESS F':'ENGINE FIRE · NO EXTINGUISHERS';
  }
  function checkMatchEnd(){
    if(M.over) return;
    const now=performance.now();
    const enemiesLeft=enemies.some(t=>!t.destroyed), teamLeft=!player.destroyed||allies.some(t=>!t.destroyed);
    const kind=!enemiesLeft?'victory':(!teamLeft?'defeat':null);
    if(kind){ if(!M.endAt){M.endAt=now;M.endKind=kind;} if(now-M.endAt>2400){M.over=true;showResult(kind);} return; }
    if(player.destroyed&&M.deadAt&&!M.deadShown&&now-M.deadAt>3200){M.deadShown=true;showResult('destroyed');}
  }
  function showResult(kind){
    if(document.exitPointerLock) document.exitPointerLock();
    const secs=Math.round((performance.now()-M.start)/1000), acc=M.shots?Math.round(M.hits/M.shots*100):0;
    const bonus=kind==='victory'?1500:(kind==='defeat'?300:200);
    const credits=M.score*10+bonus, xp=Math.round(M.score*1.4+bonus/10);
    const title=kind==='victory'?'VICTORY':(kind==='defeat'?'DEFEAT':'YOU WERE DESTROYED');
    const sub=kind==='destroyed'?'Your team is still fighting':(kind==='victory'?'All enemy vehicles destroyed':'Your team has been destroyed');
    const row=(k,v)=>'<div><span>'+k+'</span><b>'+v+'</b></div>';
    resultEl.className='show '+kind;
    resultEl.innerHTML='<div class="rs-card"><div class="rs-title">'+title+'</div><div class="rs-sub">'+sub+'</div><div class="rs-grid">'+
      row('Vehicles destroyed',M.kills)+row('Damage dealt',Math.round(M.damage))+row('Shots / hits',M.shots+' / '+M.hits+' ('+acc+'%)')+
      row('Penetrations',M.pens)+row('Time in battle',Math.floor(secs/60)+'m '+(secs%60)+'s')+row('Battle score',M.score)+
      '</div><div class="rs-reward"><span>Credits <b>+'+credits.toLocaleString()+'</b></span><span>XP <b>+'+xp+'</b></span></div><div class="rs-btns">'+
      (kind==='destroyed'?'<button id="rsSpec">SPECTATE</button>':'')+'<button id="rsAgain" class="primary">PLAY AGAIN</button></div></div>';
    resultEl.querySelector('#rsAgain').onclick=()=>location.reload();
    const spec=resultEl.querySelector('#rsSpec'); if(spec) spec.onclick=()=>{resultEl.className='';M.spectating=true;};
  }

  // North-up tactical map: allies blue, enemies red, wrecks as crosses, plus the camera's view cone.
  function drawMinimap(){
    const g=miniCv.getContext('2d'), S=180, k=S/groundSize, X=x=>S/2-x*k, Y=z=>S/2-z*k;
    g.clearRect(0,0,S,S); g.fillStyle=town?'rgba(52,58,38,0.82)':desert?'rgba(58,52,38,0.82)':airport?'rgba(46,56,34,0.82)':'rgba(32,42,28,0.82)'; g.fillRect(0,0,S,S);
    if(overviewImage||mapFootprints||mapFeatures){ // town buildings, generic map shapes or a pre-rendered map image (airport), drawn once and reused
      if(!drawMinimap.base){
        const bc=document.createElement('canvas'); bc.width=bc.height=S; const bg=bc.getContext('2d');
        if(overviewImage) bg.drawImage(overviewImage,0,0,S,S);
        if(mapFeatures) for(const f of mapFeatures){
          bg.save(); bg.translate(X(f.x),Y(f.z)); bg.fillStyle=f.color;
          if(f.shape==='ellipse'){ bg.beginPath(); bg.ellipse(0,0,Math.max(1,f.rx*k),Math.max(1,f.rz*k),0,0,Math.PI*2); bg.fill(); }
          else{ bg.rotate(Math.atan2(f.s||0,-(f.c===undefined?1:f.c)));
            bg.fillRect(-Math.max(1,f.w*k)/2,-Math.max(1,f.d*k)/2,Math.max(1,f.w*k),Math.max(1,f.d*k)); }
          bg.restore();
        }
        if(mapFootprints) for(const f of mapFootprints){
          bg.save(); bg.translate(X(f.x),Y(f.z)); bg.rotate(Math.atan2(f.s,-f.c));
          bg.fillStyle=f.level===2?'rgba(70,52,40,0.9)':f.level===1?'rgba(122,108,92,0.9)':'rgba(176,168,150,0.9)';
          bg.fillRect(-Math.max(1,f.w*k)/2,-Math.max(1,f.d*k)/2,Math.max(1,f.w*k),Math.max(1,f.d*k)); bg.restore();
        }
        drawMinimap.base=bc;
      }
      g.drawImage(drawMinimap.base,0,0);
    }
    g.strokeStyle='rgba(220,230,200,0.12)'; g.lineWidth=1; g.beginPath();
    for(let i=1;i<6;i++){g.moveTo(i*S/6,0);g.lineTo(i*S/6,S);g.moveTo(0,i*S/6);g.lineTo(S,i*S/6);}
    g.stroke();
    const px=X(player.group.position.x), py=Y(player.group.position.z), cd=camera.getWorldDirection(fxV2), ca=Math.atan2(-cd.z,-cd.x);
    g.fillStyle='rgba(230,240,210,0.16)'; g.beginPath(); g.moveTo(px,py); g.arc(px,py,52,ca-0.62,ca+0.62); g.closePath(); g.fill();
    const draw=(t,col,big)=>{
      const x=X(t.group.position.x), y=Y(t.group.position.z), r=big?6:5;
      if(t.destroyed){g.strokeStyle='rgba(150,150,150,0.8)';g.lineWidth=1.5;g.beginPath();g.moveTo(x-3,y-3);g.lineTo(x+3,y+3);g.moveTo(x+3,y-3);g.lineTo(x-3,y+3);g.stroke();return;}
      g.save(); g.translate(x,y); g.rotate(-t.group.rotation.y);
      g.fillStyle=col; g.strokeStyle=big?'#fff':'rgba(0,0,0,0.7)'; g.lineWidth=big?1.6:1;
      g.beginPath(); g.moveTo(0,-r-1); g.lineTo(r*0.8,r); g.lineTo(0,r*0.45); g.lineTo(-r*0.8,r); g.closePath(); g.fill(); g.stroke();
      if(t.burnTime>0){g.fillStyle='#ff9a3c';g.beginPath();g.arc(0,0,2,0,6.3);g.fill();}
      g.restore();
    };
    enemies.forEach(t=>draw(t,'#e0553d',false)); allies.forEach(t=>draw(t,'#4aa3e8',false)); draw(player,'#7fd1ff',true);
    g.strokeStyle='rgba(199,212,180,0.5)'; g.lineWidth=1.5; g.strokeRect(0.5,0.5,S-1,S-1);
  }

  // Frame time. The rAF timestamp is the vsync-aligned frame start, steadier than reading the clock inside the callback.
  // For the jet the result is also lightly smoothed: the model advances by dt each frame, so a 1 ms wobble in dt at
  // ~300 m/s is a ~0.3 m wobble in position - visible judder against the runway and horizon. A real hitch (dt far from the
  // running average) is passed through untouched so the sim never lags behind real time after a stall.
  let _lastRafTs=0, _dtAvg=0;
  function frameDt(ts){
    let d;
    if(ts>0 && _lastRafTs>0 && ts>_lastRafTs) d=(ts-_lastRafTs)/1000; else d=clock.getDelta();
    if(ts>0) _lastRafTs=ts;
    d=Math.min(d,1/30);
    if(!player.isAircraft || !(d>0)) return d;
    if(_dtAvg===0 || Math.abs(d-_dtAvg)>0.35*_dtAvg+0.003) _dtAvg=d; else _dtAvg+=(d-_dtAvg)*0.25;
    return _dtAvg;
  }
  function animate(ts){
    requestAnimationFrame(animate);
    // Discard long frame stalls instead of allowing one large movement/camera
    // step to jolt the tank. The smoothed camera catches up cleanly afterward.
    const rawDt = frameDt(ts);
    const fpsNow = performance.now();
    const frameMs = fpsNow-fpsLastTime;
    fpsElapsed += frameMs;
    fpsLastTime = fpsNow;
    fpsFrames++;
    if(frameMs > fpsWorst) fpsWorst = frameMs;
    if(fpsElapsed >= 500){   // was `>= 0.5` on a millisecond counter, i.e. the text was rewritten every single frame
      setTxt(fpsEl, 'FPS: ' + Math.round(fpsFrames*1000/fpsElapsed) + ' · worst ' + Math.round(fpsWorst) + ' ms');
      fpsElapsed = 0;
      fpsFrames = 0;
      fpsWorst = 0;
    }
    // Kill-cam slow motion: drop to ~28% speed, then ease back to normal over the last 0.35 s.
    let timeScale = 1;
    if(M.slow>0){ M.slow-=rawDt; timeScale = M.slow>0.35 ? 0.28 : 0.28+0.72*(1-Math.max(0,M.slow)/0.35); }
    const dt = rawDt*timeScale;
    camRealDt = rawDt; camFrame++;
    update(dt);
    matchTick(dt);
    updateAmbience(rawDt);
    [player,...enemies,...allies].forEach(t=>{ if(t&&t.dirtBase) t.dirtBase.value=t.group.position.y; });
    skyDome.position.copy(camera.position);
    // Ground chunks, trees and rocks pick their detail level from the camera position (tanks are not touched).
    // The elapsed-seconds second argument drives tree wind sway; maps that don't use it simply ignore it.
    if(mapUpdateLOD) mapUpdateLOD(camera.position, performance.now()/1000);
    skyMat.uniforms.time.value = performance.now()/1000;
    post.update(rawDt);
    post.render();
  }
  
  // Pre-warm the renderer before the first visible frame. Three.js compiles a shader the first time something using it is
  // drawn, and uploads a mesh's buffers / a texture the first time it is not frustum-culled - so the first shot, the first
  // explosion, or the first time you whip the camera round to a tank or a patch of forest used to stall for a moment.
  // One offscreen frame with culling off and hidden effect objects switched on does all of that up front. Everything is
  // put back afterwards, and the frame is never shown. Add ?prewarm=0 to the URL to skip it.
  (function prewarm(){
    if(new URLSearchParams(location.search).get('prewarm')==='0') return;
    const saved=[];
    try{
      scene.traverse(o=>{ saved.push(o,o.frustumCulled,o.visible); o.frustumCulled=false; o.visible=true; });
      camera.updateMatrixWorld(true);
      post.render();
    }catch(err){ console.warn('Renderer pre-warm skipped:',err); }
    finally{ for(let i=0;i<saved.length;i+=3){ saved[i].frustumCulled=saved[i+1]; saved[i].visible=saved[i+2]; } }
  })();

  // Start the game loop
  ensureAudio();
  animate();
  }

(function(){
  "use strict";

  /* =========================================================
     DATA: members, levels, colors
  ========================================================= */
  const MEMBERS = [
    { id:'rm',    name:'RM',      full:'Kim Namjoon', color:'#6b8fd6', accent:'#3f5aa6', skin:'#f2c199', hair:'#241a12', hairStyle:'corto',     song:'inspirado en "Persona"',     songTitle:'RM Persona official MV', bg:['#1a2340','#2a3866'], msg:'Anahi, gracias por venir a buscarme. Espero que este año se cumplan todos los planes que tienes en esa cabeza brillante. ¡Feliz cumpleaños, ARMY!' },
    { id:'jin',   name:'Jin',     full:'Kim Seokjin', color:'#f2a6c9', accent:'#c6608f', skin:'#f2c199', hair:'#2b1a10', hairStyle:'side',      song:'inspirado en "Epiphany"',    songTitle:'BTS Epiphany official MV', bg:['#3a1f33','#5c2e4f'], msg:'¡Eres la ARMY más brillante que conozco! Que este nuevo año te traiga tantas risas como las que tú nos regalas a nosotros. Feliz cumpleaños, Anahi.' },
    { id:'suga',  name:'Suga',    full:'Min Yoongi',  color:'#e0555a', accent:'#8a1e22', skin:'#e8b48c', hair:'#9fd8c9', hairStyle:'corto',     song:'inspirado en "Daechwita"',   songTitle:'Agust D Daechwita official MV', bg:['#2b1414','#4a1c1c'], msg:'Descansa cuando lo necesites y sueña en grande, Anahi. Hoy es tu día, disfrútalo sin prisa. Feliz cumpleaños de mi parte.' },
    { id:'jhope', name:'J-Hope',  full:'Jung Hoseok', color:'#f2c14e', accent:'#c98f1e', skin:'#e8b48c', hair:'#f2b23e', hairStyle:'despeinado',song:'inspirado en "Chicken Noodle Soup"', songTitle:'j-hope Chicken Noodle Soup official MV', bg:['#3a2c0e','#5c451a'], msg:'¡Hoy el sol brilla especialmente para ti, Anahi! Que la pases increíble, bailando y sonriendo todo el día. ¡Feliz cumpleaños!' },
    { id:'jimin', name:'Jimin',   full:'Park Jimin',  color:'#f27ab0', accent:'#a83c73', skin:'#f2d1b3', hair:'#8a5a34', hairStyle:'flequillo', song:'inspirado en "Filter"',      songTitle:'Jimin Filter official MV', bg:['#3a1230','#5c1e4d'], msg:'Gracias por tu cariño de siempre, Anahi. Te mando un abrazo enorme y todo mi cariño en tu cumpleaños. Te lo mereces todo 💗.' },
    { id:'v',     name:'V',       full:'Kim Taehyung',color:'#7a5cc9', accent:'#4a3487', skin:'#e8b48c', hair:'#3a2418', hairStyle:'largo',     song:'inspirado en "Singularity"', songTitle:'V Singularity official MV', bg:['#160f2e','#241849'], msg:'Eres única, Anahi, tal cual como suenas cuando hablas de nosotros. Que cumplas muchos años más rodeada de quienes te quieren. Feliz cumpleaños.' },
  ];
  const JK = { id:'jk', name:'Jungkook', full:'Jeon Jungkook', color:'#8fd6f2', accent:'#3f7fa6', skin:'#e8b48c', hair:'#1c1310', hairStyle:'corto', song:'inspirado en "Euphoria"', songTitle:'Jungkook Euphoria official MV', bg:['#0e2233','#173a52'], msg:'Gracias por rescatarnos, Anahi. Hoy todo Bangtan quiere cantarte, solo a ti. Borahae, y feliz cumpleaños.' };

  function youtubeSearchUrl(q){
    return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
  }

  /* ---------------------------------------------------------------
     REAL PHOTOS (optional, makes the members look "real" instead of
     drawn). Drop a square-ish photo for each member into a "photos/"
     folder next to index.html, named exactly:
       photos/rm.jpg  photos/jin.jpg  photos/suga.jpg  photos/jhope.jpg
       photos/jimin.jpg  photos/v.jpg  photos/jk.jpg
     If a photo is missing, the game quietly falls back to the drawn
     (vector) version — nothing breaks.
  --------------------------------------------------------------- */
  const MEMBER_PHOTOS = {};
  MEMBERS.concat([JK]).forEach(m=>{
    const img = new Image();
    img.src = 'photos/' + m.id + '.jpg';
    img.loaded = false; img.failed = false;
    img.onload = ()=>{ img.loaded = true; };
    img.onerror = ()=>{ img.failed = true; };
    MEMBER_PHOTOS[m.id] = img;
  });
  function photoReady(id){
    const img = MEMBER_PHOTOS[id];
    return img && img.loaded && !img.failed;
  }
  // Draws a member's real photo, cropped to a circle, centered at (cx,cy) with radius r.
  function drawPhotoCircle(targetCtx, id, cx, cy, r){
    const img = MEMBER_PHOTOS[id];
    targetCtx.save();
    targetCtx.beginPath();
    targetCtx.arc(cx, cy, r, 0, 7);
    targetCtx.closePath();
    targetCtx.clip();
    // cover-fit the image into the circle
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const scale = Math.max((r*2)/iw, (r*2)/ih);
    const dw = iw*scale, dh = ih*scale;
    targetCtx.drawImage(img, cx-dw/2, cy-dh/2, dw, dh);
    targetCtx.restore();
  }

  const W = 800, H = 450, GROUND = 410, GRAV = 0.55, MOVE = 4.2, JUMP = -11.2;

  // Level layouts. Platforms are ground-relative rectangles. Pits are gaps in the ground.
  function groundSegments(pits){
    // pits: array of [start,end] in px where ground is missing
    const segs = [];
    let cursor = 0;
    pits.sort((a,b)=>a[0]-b[0]).forEach(p=>{
      if(p[0] > cursor) segs.push({x:cursor, w:p[0]-cursor});
      cursor = p[1];
    });
    if(cursor < W) segs.push({x:cursor, w:W-cursor});
    return segs.map(s=>({x:s.x, y:GROUND, w:s.w, h:40}));
  }

  function buildLevels(){
    return [
      { // 1 RM - short intro, but no longer a total freebie
        member: MEMBERS[0],
        pits: [[300,368]],
        platforms: [ {x:220,y:330,w:78,h:16}, {x:420,y:300,w:78,h:16}, {x:600,y:340,w:70,h:16} ],
        enemies: [ {x:260, y:GROUND-24, xMin:220, xMax:300, speed:1.7}, {x:480, y:GROUND-24, xMin:440, xMax:600, speed:1.9} ],
        coins: [ {x:250,y:300},{x:460,y:270},{x:630,y:310},{x:150,y:370} ],
        cage: {x:730,y:GROUND-70,w:44,h:70},
        start: {x:40,y:GROUND-40}
      },
      { // 2 Jin
        member: MEMBERS[1],
        pits: [[180,236],[420,478]],
        platforms: [ {x:120,y:340,w:70,h:16}, {x:300,y:310,w:68,h:16}, {x:470,y:280,w:60,h:16}, {x:610,y:330,w:70,h:16} ],
        enemies: [ {x:210, y:GROUND-24, xMin:170, xMax:260, speed:2.0}, {x:300, y:GROUND-24, xMin:260, xMax:380, speed:2.1}, {x:640, y:GROUND-24, xMin:600, xMax:700, speed:2.2} ],
        coins: [ {x:150,y:310},{x:330,y:280},{x:500,y:250},{x:640,y:300},{x:30,y:370} ],
        cage: {x:730,y:GROUND-70,w:44,h:70},
        start: {x:40,y:GROUND-40}
      },
      { // 3 Suga
        member: MEMBERS[2],
        pits: [[140,198],[330,388],[520,568]],
        platforms: [ {x:90,y:340,w:60,h:16}, {x:230,y:300,w:60,h:16}, {x:390,y:260,w:60,h:16}, {x:470,y:330,w:52,h:16}, {x:600,y:290,w:68,h:16} ],
        enemies: [ {x:150, y:GROUND-24, xMin:110, xMax:190, speed:2.2}, {x:230, y:GROUND-24, xMin:200, xMax:300, speed:2.3}, {x:600, y:GROUND-24, xMin:560, xMax:700, speed:2.4} ],
        coins: [ {x:120,y:310},{x:260,y:270},{x:420,y:230},{x:620,y:260},{x:700,y:370} ],
        cage: {x:735,y:GROUND-70,w:44,h:70},
        start: {x:40,y:GROUND-40}
      },
      { // 4 J-Hope - bouncy, faster enemies
        member: MEMBERS[3],
        pits: [[160,218],[300,350],[470,528],[600,648]],
        platforms: [ {x:100,y:330,w:60,h:16}, {x:250,y:290,w:52,h:16}, {x:360,y:250,w:60,h:16}, {x:460,y:300,w:52,h:16}, {x:560,y:260,w:60,h:16}, {x:670,y:320,w:70,h:16} ],
        enemies: [ {x:190, y:GROUND-24, xMin:160, xMax:250, speed:2.5}, {x:260, y:GROUND-24, xMin:220, xMax:340, speed:2.6}, {x:460, y:GROUND-24, xMin:420, xMax:540, speed:2.8} ],
        coins: [ {x:130,y:300},{x:280,y:260},{x:390,y:220},{x:490,y:270},{x:590,y:230} ],
        cage: {x:740,y:GROUND-70,w:44,h:70},
        start: {x:40,y:GROUND-40}
      },
      { // 5 Jimin - precise jumps
        member: MEMBERS[4],
        pits: [[110,158],[260,310],[400,450],[540,590],[650,700]],
        platforms: [ {x:60,y:340,w:52,h:16}, {x:190,y:300,w:52,h:16}, {x:320,y:260,w:52,h:16}, {x:450,y:300,w:52,h:16}, {x:580,y:260,w:52,h:16}, {x:700,y:320,w:60,h:16} ],
        enemies: [ {x:190, y:GROUND-24, xMin:170, xMax:250, speed:2.4}, {x:320, y:GROUND-24, xMin:290, xMax:380, speed:2.5}, {x:450, y:GROUND-24, xMin:430, xMax:510, speed:2.5}, {x:700, y:GROUND-24, xMin:660, xMax:760, speed:2.7} ],
        coins: [ {x:80,y:310},{x:210,y:270},{x:340,y:230},{x:470,y:270},{x:600,y:230} ],
        cage: {x:750,y:GROUND-70,w:44,h:70},
        start: {x:40,y:GROUND-40}
      },
      { // 6 V - hardest regular level
        member: MEMBERS[5],
        pits: [[100,148],[220,270],[340,390],[460,510],[580,630],[680,730]],
        platforms: [ {x:50,y:340,w:48,h:16}, {x:160,y:300,w:48,h:16}, {x:270,y:260,w:48,h:16}, {x:390,y:230,w:48,h:16}, {x:500,y:270,w:48,h:16}, {x:620,y:240,w:48,h:16}, {x:730,y:310,w:55,h:16} ],
        enemies: [ {x:160, y:GROUND-24, xMin:140, xMax:210, speed:2.7}, {x:270, y:GROUND-24, xMin:240, xMax:330, speed:2.6}, {x:390, y:GROUND-24, xMin:360, xMax:440, speed:2.9}, {x:620, y:GROUND-24, xMin:590, xMax:680, speed:3.0} ],
        coins: [ {x:70,y:310},{x:180,y:270},{x:290,y:230},{x:410,y:200},{x:520,y:240},{x:640,y:210} ],
        cage: {x:750,y:GROUND-70,w:44,h:70},
        start: {x:40,y:GROUND-40}
      },
      { // 7 Jungkook - final course, toughest
        member: JK,
        pits: [[90,138],[200,250],[320,370],[430,480],[540,590],[650,700]],
        platforms: [ {x:40,y:340,w:44,h:16}, {x:150,y:300,w:44,h:16}, {x:260,y:260,w:44,h:16}, {x:370,y:230,w:44,h:16}, {x:480,y:270,w:44,h:16}, {x:590,y:240,w:44,h:16}, {x:700,y:300,w:55,h:16} ],
        enemies: [ {x:150, y:GROUND-24, xMin:130, xMax:200, speed:2.9}, {x:260, y:GROUND-24, xMin:230, xMax:320, speed:3.0}, {x:370, y:GROUND-24, xMin:340, xMax:420, speed:3.1}, {x:590, y:GROUND-24, xMin:560, xMax:650, speed:3.2} ],
        coins: [ {x:60,y:310},{x:170,y:270},{x:280,y:230},{x:390,y:200},{x:500,y:240},{x:610,y:210},{x:720,y:270} ],
        cage: {x:750,y:GROUND-70,w:44,h:70},
        start: {x:40,y:GROUND-40}
      },
    ];
  }

  const LEVELS = buildLevels();

  /* =========================================================
     AUDIO — tiny original chiptune motifs (no copyrighted material)
  ========================================================= */
  let actx = null, muted = false;
  function ensureAudio(){
    if(!actx){ actx = new (window.AudioContext||window.webkitAudioContext)(); }
    if(actx.state === 'suspended') actx.resume();
  }
  function beep(freq, start, dur, type, gainMul){
    if(muted || !actx) return;
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type || 'square';
    o.frequency.value = freq;
    g.gain.value = 0;
    o.connect(g); g.connect(actx.destination);
    const t0 = actx.currentTime + start;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.06*(gainMul||1), t0+0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t0+dur);
    o.start(t0);
    o.stop(t0+dur+0.02);
  }
  function sfxJump(){ ensureAudio(); beep(880,0,0.12,'square',1); }
  function sfxCoin(){ ensureAudio(); beep(1200,0,0.08,'square',1); beep(1600,0.05,0.08,'square',0.8); }
  function sfxHit(){ ensureAudio(); beep(140,0,0.25,'sawtooth',1); }
  function sfxWin(){ ensureAudio(); [523,659,784,1047,1319].forEach((f,i)=>beep(f,i*0.1,0.2,'triangle',1)); }

  /* =========================================================
     STATE
  ========================================================= */
  const AVATAR_SKINS = ['#ffe0c2','#f2c199','#c98a5c','#8a5a34','#5c3a20'];
  const AVATAR_HAIR  = ['#2b1810','#5c3a20','#8a5a34','#c98a5c','#a83c73','#7a5cc9','#e0555a','#f2c14e'];
  const AVATAR_OUTFITS = ['#f2789f','#8a63d2','#8fd6f2','#f2c14e','#e0555a','#6b8fd6'];
  const AVATAR_HAIRSTYLES = [
    {id:'largo', label:'Largo'},
    {id:'corto', label:'Corto'},
    {id:'coleta', label:'Coleta'},
  ];

  const avatar = {
    skin: AVATAR_SKINS[0],
    hair: AVATAR_HAIR[0],
    hairStyle: 'largo',
    outfit: AVATAR_OUTFITS[0],
  };

  const S = {
    levelIdx: 0,
    lives: 3,
    coins: 0,
    running: false,
    keys: { left:false, right:false, jump:false },
    player: null,
    enemies: [],
    coinsArr: [],
    platforms: [],
    cage: null,
    startPos: null,
    camX: 0,
  };

  const els = {};
  ['screen-title','screen-avatar','screen-level-intro','screen-rescued','screen-gameover','screen-finale',
   'game-wrap','btn-start','btn-play-level','btn-continue','btn-retry','btn-replay',
   'intro-title','intro-sub','intro-eyebrow','intro-song-link','intro-badge','progress-dots',
   'rescued-badge','rescued-title','rescued-sub',
   'lives','coin-count','level-name','mute-btn',
   'roster-preview','finale-text','btn-avatar-done',
   'music-toggle','music-panel',
   'playlist-list','btn-prev-song','btn-next-song',
   'btn-play-pause','playlist-audio','now-playing',
   'btn-left','btn-right','btn-jump','touch-controls',
   'rotate-hint','rescued-cloud','finale-cloud'
  ].forEach(id => els[id] = document.getElementById(id));

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  /* =========================================================
     UI helpers
  ========================================================= */
  function show(id){ Object.keys(els).forEach(k=>{}); }
  function switchScreen(id){
    ['screen-title','screen-avatar','screen-level-intro','screen-rescued','screen-gameover','screen-finale'].forEach(s=>{
      els[s].classList.add('hidden');
    });
    els['game-wrap'].classList.add('hidden');
    if(id === 'game'){ els['game-wrap'].classList.remove('hidden'); }
    else { els[id].classList.remove('hidden'); }
    updateRotateHint();
  }

  // Suggests rotating the phone to landscape while actually playing a
  // level, on small touch screens — the game plays best in landscape.
  function updateRotateHint(){
    const inGame = !els['game-wrap'].classList.contains('hidden');
    const isSmall = Math.min(window.innerWidth, window.innerHeight) < 640;
    const isPortrait = window.innerHeight > window.innerWidth;
    const isTouch = 'ontouchstart' in window;
    if(inGame && isTouch && isSmall && isPortrait){
      els['rotate-hint'].classList.remove('hidden');
    } else {
      els['rotate-hint'].classList.add('hidden');
    }
  }
  window.addEventListener('resize', updateRotateHint);
  window.addEventListener('orientationchange', updateRotateHint);

  function renderRoster(){
    els['roster-preview'].innerHTML = MEMBERS.concat([JK]).map(m =>
      `<div class="chip" style="background:${m.color};">${m.name.slice(0,2).toUpperCase()}<img class="badge-img" src="photos/${m.id}.jpg" alt="${m.name}" onerror="this.remove()"></div>`
    ).join('');
  }
  renderRoster();

  
 
  const PLAYLIST_SONGS = [
    { name: 'Jungkook - Yes or No',  src: 'Jungkook - Yes or No.mp3'  },
    { name: 'Jimin - Like Crazy',  src: 'Jimin - Like Crazy.mp3'  },
    { name: 'Jin - Heart on  The Windows',  src: 'Jin - Heart on The Windows.mp3'  },
    { name: 'Jungkook - Standing Next to You',  src: 'Jungkook - Standing Next to You.mp3'  },
    { name: 'Jungkook - Still With You',  src: 'Jungkook - Still With You.mp3'  },
    { name: 'BTS - Run',  src: 'BTS - Run.mp3'  },
    { name: 'BTS - Pied Piper',  src: 'BTS - Pied Piper.mp3'  },
    { name: 'BTS - Fake Love',  src: 'BTS - Fake Love.mp3'  },
    { name: 'BTS - MIC Drop',  src: 'BTS - MIC Drop.mp3'  },
    { name: 'BTS - Blood Sweat & Tears', src: 'BTS - Blood Sweat & Tears.mp3' },
  ];

  let playlist = PLAYLIST_SONGS.map(s => ({ ...s }));
  let currentSongIdx = -1;
  const audioEl = els['playlist-audio'];
  audioEl.preload = 'auto';

  function renderPlaylist(){
    const list = els['playlist-list'];
    if(playlist.length === 0){
      list.innerHTML = '<li class="playlist-empty">No hay canciones en la lista todavía 🎶</li>';
      return;
    }
    list.innerHTML = playlist.map((song, i) => `
      <li class="playlist-item ${i === currentSongIdx ? 'playing' : ''}" data-idx="${i}">
        <span class="pl-play">${i === currentSongIdx && !audioEl.paused ? '🎵' : '▶️'}</span>
        <span class="pl-name">${song.name}</span>
      </li>
    `).join('');

    list.querySelectorAll('.playlist-item').forEach(item=>{
      item.addEventListener('click', ()=>{
        playSongAt(parseInt(item.dataset.idx, 10));
      });
    });
  }

  function updateNowPlaying(msg){
    els['now-playing'].textContent = msg !== undefined ? msg
      : (currentSongIdx >= 0 && playlist[currentSongIdx]) ? `Sonando: ${playlist[currentSongIdx].name}` : '';
    els['btn-play-pause'].textContent = (currentSongIdx >= 0 && !audioEl.paused) ? '⏸️' : '▶️';
  }

  // Guards against overlapping play attempts (this is what caused the
  // "vuelve loca" cascade: switching tracks super fast while one was still
  // mid-error retriggered another switch, and so on).
  let switching = false;

  function playSongAt(idx){
    if(idx < 0 || idx >= playlist.length) return;
    if(switching) return;
    switching = true;

    currentSongIdx = idx;
    audioEl.pause();
    audioEl.src = playlist[idx].src;
    audioEl.load();

    const playPromise = audioEl.play();
    if(playPromise && typeof playPromise.then === 'function'){
      playPromise
        .then(()=>{ switching = false; })
        .catch(()=>{
          // Play was blocked or the file failed — either way, stop trying
          // automatically. The 'error' listener below shows the real reason
          // when it's actually a missing/broken file.
          switching = false;
        });
    } else {
      switching = false;
    }
    renderPlaylist();
    updateNowPlaying();
  }

  els['music-toggle'].addEventListener('click', ()=>{
    els['music-panel'].classList.toggle('hidden');
  });

  els['btn-play-pause'].addEventListener('click', ()=>{
    if(currentSongIdx === -1){
      if(playlist.length > 0) playSongAt(0);
      return;
    }
    if(audioEl.paused) audioEl.play().catch(()=>{});
    else audioEl.pause();
  });
  audioEl.addEventListener('playing', ()=>{ updateNowPlaying(); renderPlaylist(); });
  audioEl.addEventListener('play', ()=>{ renderPlaylist(); updateNowPlaying(); });
  audioEl.addEventListener('pause', ()=>{ renderPlaylist(); updateNowPlaying(); });
  audioEl.addEventListener('ended', ()=>{
    if(playlist.length === 0) return;
    switching = false;
    playSongAt((currentSongIdx + 1) % playlist.length);
  });
  audioEl.addEventListener('error', ()=>{
    switching = false;
    if(currentSongIdx === -1 || playlist.length === 0) return;
    updateNowPlaying(`⚠️ No encontré "${playlist[currentSongIdx].src}". Revisa que el archivo esté en la carpeta "music" y que el nombre sea idéntico (mayúsculas y extensión incluidas).`);
  });

  els['btn-next-song'].addEventListener('click', ()=>{
    if(playlist.length === 0) return;
    switching = false;
    playSongAt((currentSongIdx + 1 + playlist.length) % playlist.length);
  });
  els['btn-prev-song'].addEventListener('click', ()=>{
    if(playlist.length === 0) return;
    switching = false;
    playSongAt((currentSongIdx - 1 + playlist.length) % playlist.length);
  });

  renderPlaylist();

  function renderDots(){
    let html = '';
    for(let i=0;i<LEVELS.length;i++){
      html += `<div class="dot ${i < S.levelIdx ? 'done':''}"></div>`;
    }
    els['progress-dots'].innerHTML = html;
  }

  function updateHud(){
    let hearts = '';
    for(let i=0;i<3;i++){ hearts += `<span class="heart ${i<S.lives?'':'lost'}">❤</span>`; }
    els['lives'].innerHTML = hearts;
    els['coin-count'].textContent = `🪙 ${S.coins}`;
    els['level-name'].textContent = `Nivel ${S.levelIdx+1}/7 · ${LEVELS[S.levelIdx].member.name}`;
  }

  /* =========================================================
     LEVEL SETUP
  ========================================================= */
  function loadLevel(idx){
    const lvl = LEVELS[idx];
    S.platforms = groundSegments(lvl.pits).concat(lvl.platforms.map(p=>({x:p.x,y:p.y,w:p.w,h:p.h})));
    S.enemies = lvl.enemies.map(e => ({...e, dir:1, alive:true}));
    S.coinsArr = lvl.coins.map(c => ({...c, r:8, got:false}));
    S.cage = {...lvl.cage};
    S.startPos = {...lvl.start};
    S.player = { x:lvl.start.x, y:lvl.start.y, w:26, h:34, vx:0, vy:0, onGround:false, facing:1, hitTimer:0, walkPhase:0 };
    S.camX = 0;
    S.cageOpening = false;
    S.cageOpenT = 0;
  }

  function showLevelIntro(idx){
    S.levelIdx = idx;
    const lvl = LEVELS[idx];
    els['intro-eyebrow'].textContent = `NIVEL ${idx+1} DE 7`;
    els['intro-badge'].style.background = `linear-gradient(160deg, ${lvl.member.color}, ${lvl.member.accent})`;
    els['intro-badge'].innerHTML = `${lvl.member.name.slice(0,2).toUpperCase()}<img class="badge-img" src="photos/${lvl.member.id}.jpg" alt="${lvl.member.name}" onerror="this.remove()">`;
    els['intro-title'].textContent = `Rescata a ${lvl.member.name}`;
    els['intro-sub'].textContent = idx < 6
      ? `Zona ${lvl.song}. Cruza la plataforma, esquiva a los guardias y llega a la jaula para liberar a ${lvl.member.full}.`
      : `Última zona ${lvl.song}. Llega hasta Jungkook — algo especial te espera al final.`;
    els['intro-song-link'].href = youtubeSearchUrl(lvl.member.songTitle);
    els['intro-song-link'].textContent = `🎵 Escuchar "${lvl.member.song.replace('inspirado en ','')}" en YouTube`;
    renderDots();
    switchScreen('screen-level-intro');
  }

  function startLevelPlay(){
    loadLevel(S.levelIdx);
    S.lives = S.lives; // keep lives across levels
    S.running = true;
    updateHud();
    switchScreen('game');
  }

  /* =========================================================
     GAME LOOP
  ========================================================= */
  function rectsOverlap(a,b){
    return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  }

  function resetPlayerPosition(){
    S.player.x = S.startPos.x;
    S.player.y = S.startPos.y;
    S.player.vx = 0; S.player.vy = 0;
    S.camX = 0;
  }

  function loseLife(){
    S.lives--;
    sfxHit();
    updateHud();
    if(S.lives <= 0){
      S.running = false;
      switchScreen('screen-gameover');
    } else {
      resetPlayerPosition();
    }
  }

  function update(){
    if(!S.running) return;

    // the cage door is opening: freeze the player and let the little
    // door-opening animation play out before switching to the rescued screen
    if(S.cageOpening){
      S.cageOpenT += 0.032;
      S.cageWave = (S.cageWave || 0) + 0.16;
      if(S.cageOpenT >= 1){
        S.cageOpening = false;
        onLevelComplete();
      }
      return;
    }

    const p = S.player;

    // horizontal movement
    if(S.keys.left){ p.vx = -MOVE; p.facing=-1; }
    else if(S.keys.right){ p.vx = MOVE; p.facing=1; }
    else { p.vx = 0; }

    // walk-cycle timer (only advances while actually moving on the ground)
    if(p.onGround && p.vx !== 0) p.walkPhase += 0.22;
    else if(p.onGround) p.walkPhase *= 0.8; // settle back to standing pose

    // captive member waves from the cage + guardian dragon breathing animation
    S.cageWave = (S.cageWave || 0) + 0.06;

    // jump
    if(S.keys.jump && p.onGround){
      p.vy = JUMP; p.onGround = false; sfxJump();
    }

    // apply gravity
    p.vy += GRAV;
    if(p.vy > 14) p.vy = 14;

    // move X then resolve
    p.x += p.vx;
    p.x = Math.max(0, Math.min(p.x, LEVELS[S.levelIdx].cage.x + 120 - p.w));
    for(const pl of S.platforms){
      if(rectsOverlap(p, pl)){
        if(p.vx > 0) p.x = pl.x - p.w;
        else if(p.vx < 0) p.x = pl.x + pl.w;
      }
    }

    // move Y then resolve
    const prevBottom = p.y + p.h;
    p.y += p.vy;
    p.onGround = false;
    for(const pl of S.platforms){
      if(rectsOverlap(p, pl)){
        if(p.vy > 0 && prevBottom <= pl.y + 1){
          p.y = pl.y - p.h; p.vy = 0; p.onGround = true;
        } else if(p.vy < 0){
          p.y = pl.y + pl.h; p.vy = 0;
        }
      }
    }

    // fell into pit
    if(p.y > H + 60){ loseLife(); return; }

    // coins
    for(const c of S.coinsArr){
      if(!c.got && Math.hypot((p.x+p.w/2)-c.x, (p.y+p.h/2)-c.y) < 22){
        c.got = true; S.coins++; sfxCoin(); updateHud();
      }
    }

    // enemies
    for(const e of S.enemies){
      if(!e.alive) continue;
      e.x += e.speed * e.dir;
      if(e.x < e.xMin) { e.x = e.xMin; e.dir = 1; }
      if(e.x > e.xMax) { e.x = e.xMax; e.dir = -1; }
      const er = {x:e.x, y:e.y, w:26, h:24};
      if(rectsOverlap(p, er)){
        if(p.vy > 0 && (p.y + p.h) - er.y < 16){
          e.alive = false; p.vy = -7; sfxCoin();
        } else {
          loseLife(); return;
        }
      }
    }

    // cage / goal — reaching it starts the door-opening animation
    // instead of jumping straight to the rescued screen
    const cg = S.cage;
    if(rectsOverlap(p, cg)){
      S.cageOpening = true;
      S.cageOpenT = 0;
      sfxCoin();
      return;
    }

    // camera follows player, clamps to level width
    const targetCam = Math.max(0, Math.min(p.x - W/2.6, (LEVELS[S.levelIdx].cage.x+140) - W));
    S.camX += (targetCam - S.camX) * 0.15;
  }

  function onLevelComplete(){
    S.running = false;
    sfxWin();
    const lvl = LEVELS[S.levelIdx];
    if(S.levelIdx < 6){
      els['rescued-badge'].style.background = `linear-gradient(160deg, ${lvl.member.color}, ${lvl.member.accent})`;
      els['rescued-badge'].innerHTML = `${lvl.member.name.slice(0,2).toUpperCase()}<img class="badge-img" src="photos/${lvl.member.id}.jpg" alt="${lvl.member.name}" onerror="this.remove()">`;
      els['rescued-title'].textContent = `¡Rescataste a ${lvl.member.name}!`;
      els['rescued-sub'].textContent = lvl.member.msg;
      switchScreen('screen-rescued');
    } else {
      runFinale();
    }
  }

  /* =========================================================
     RENDER
  ========================================================= */
  function drawBackground(){
    const lvl = LEVELS[S.levelIdx];
    const grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0, lvl.member.bg[0]);
    grad.addColorStop(1, lvl.member.bg[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,W,H);

    // soft parallax dots
    ctx.save();
    ctx.globalAlpha = 0.5;
    for(let i=0;i<26;i++){
      const bx = (i*97 - S.camX*0.3) % (W+100);
      const by = 30 + (i*53)%180;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(((bx+W+100)%(W+100)), by, 1.6, 0, 7);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPlatform(pl){
    const x = pl.x - S.camX;
    if(x + pl.w < -20 || x > W+20) return;
    const lvl = LEVELS[S.levelIdx];
    ctx.fillStyle = lvl.member.accent;
    ctx.fillRect(x, pl.y, pl.w, pl.h);
    ctx.fillStyle = lvl.member.color;
    ctx.fillRect(x, pl.y, pl.w, 5);
  }

  function drawCoin(c){
    if(c.got) return;
    const x = c.x - S.camX;
    if(x < -20 || x > W+20) return;
    ctx.save();
    ctx.translate(x, c.y);
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath();
    ctx.arc(0,0,8,0,7);
    ctx.fill();
    ctx.strokeStyle = '#a5761a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  function drawEnemy(e){
    if(!e.alive) return;
    const x = e.x - S.camX;
    if(x < -40 || x > W+40) return;
    const lvl = LEVELS[S.levelIdx];
    const scaleColor = lvl.member.accent || '#4a1c6e';
    const bellyColor = lvl.member.color || '#7a2fb0';
    const flap = Math.sin((S.cageWave||0)*2 + e.x*0.05) * 3; // wing flap
    const dir = e.dir >= 0 ? 1 : -1;

    ctx.save();
    ctx.translate(x + 13, e.y + 12);
    ctx.scale(dir, 1); // face travel direction

    // tail
    ctx.strokeStyle = '#241033';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-11, 4);
    ctx.quadraticCurveTo(-22, 2 + flap*0.6, -26, -4 - flap*0.4);
    ctx.stroke();
    // tail spike
    ctx.fillStyle = scaleColor;
    ctx.beginPath();
    ctx.moveTo(-26,-4-flap*0.4); ctx.lineTo(-30,-8-flap*0.4); ctx.lineTo(-23,-6-flap*0.4);
    ctx.closePath(); ctx.fill();

    // back wing
    ctx.fillStyle = 'rgba(36,16,51,.85)';
    ctx.beginPath();
    ctx.moveTo(-2, -2);
    ctx.quadraticCurveTo(-14, -14 - flap, -22, -6 - flap*0.5);
    ctx.quadraticCurveTo(-10, -4, -2, 4);
    ctx.closePath();
    ctx.fill();

    // body
    ctx.fillStyle = '#2b1440';
    ctx.beginPath();
    ctx.ellipse(0, 2, 13, 10, 0, 0, 7);
    ctx.fill();
    // belly plates
    ctx.fillStyle = bellyColor;
    ctx.beginPath();
    ctx.ellipse(2, 6, 7, 5, 0, 0, 7);
    ctx.fill();
    for(let i=-1;i<2;i++){
      ctx.beginPath();
      ctx.moveTo(2+i*4, 3); ctx.lineTo(4+i*4, 6); ctx.lineTo(0+i*4, 6);
      ctx.closePath(); ctx.fill();
    }

    // front wing (drawn over body)
    ctx.fillStyle = 'rgba(58,24,84,.95)';
    ctx.beginPath();
    ctx.moveTo(1, -1);
    ctx.quadraticCurveTo(-9, -13 - flap, -18, -4 - flap*0.5);
    ctx.quadraticCurveTo(-7, -2, 1, 5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = scaleColor;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-3,-2); ctx.lineTo(-12,-8-flap*0.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-1,1); ctx.lineTo(-11,-2-flap*0.4); ctx.stroke();

    // neck + head
    ctx.fillStyle = '#2b1440';
    ctx.beginPath();
    ctx.moveTo(9, -2);
    ctx.quadraticCurveTo(15, -8, 20, -6);
    ctx.quadraticCurveTo(22, -1, 17, 2);
    ctx.quadraticCurveTo(12, 2, 9, -2);
    ctx.closePath();
    ctx.fill();
    // snout
    ctx.beginPath();
    ctx.moveTo(18,-6); ctx.lineTo(25,-4); ctx.lineTo(18,0);
    ctx.closePath(); ctx.fill();
    // horns
    ctx.fillStyle = scaleColor;
    ctx.beginPath(); ctx.moveTo(13,-8); ctx.lineTo(11,-13); ctx.lineTo(15,-9); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(17,-8); ctx.lineTo(17,-13); ctx.lineTo(19,-8.5); ctx.closePath(); ctx.fill();
    // glowing eye
    ctx.fillStyle = '#ff5c7a';
    ctx.beginPath(); ctx.arc(17,-4,1.6,0,7); ctx.fill();
    // little fire breath puff, only mid-flap
    if(flap > 1.6){
      ctx.fillStyle = 'rgba(242,150,60,.7)';
      ctx.beginPath(); ctx.arc(26,-3,2.4,0,7); ctx.fill();
      ctx.fillStyle = 'rgba(242,193,78,.7)';
      ctx.beginPath(); ctx.arc(29,-3,1.4,0,7); ctx.fill();
    }

    ctx.restore();
  }

  function drawMemberFigure(targetCtx, x, y, w, h, member, wavePhase, facing){
    // A little captive figure built the same way as the playable character
    // (head, hair, torso, arms with hands, legs) but styled after this
    // member's own colors and hair — waving hello through the bars.
    facing = facing || 1;
    const wave = Math.sin(wavePhase || 0);
    const cx = w/2;
    const skin = member.skin || '#f2c199', hair = member.hair || '#2b1a10';
    const outfit = member.color, accent = member.accent || outfit;
    const neckY = h*0.15, hipY = h*0.76, footY = h*0.97;

    targetCtx.save();
    targetCtx.translate(x, y);
    targetCtx.lineCap = 'round';
    targetCtx.lineJoin = 'round';

    // legs
    targetCtx.strokeStyle = shadeColor(outfit, -45);
    targetCtx.lineWidth = Math.max(2.4, w*0.09);
    targetCtx.beginPath(); targetCtx.moveTo(cx - w*0.09, hipY); targetCtx.lineTo(cx - w*0.11, footY); targetCtx.stroke();
    targetCtx.beginPath(); targetCtx.moveTo(cx + w*0.09, hipY); targetCtx.lineTo(cx + w*0.11, footY); targetCtx.stroke();
    // shoes
    targetCtx.fillStyle = '#1c1330';
    targetCtx.beginPath(); targetCtx.ellipse(cx - w*0.11, footY, w*0.08, h*0.02, 0, 0, 7); targetCtx.fill();
    targetCtx.beginPath(); targetCtx.ellipse(cx + w*0.11, footY, w*0.08, h*0.02, 0, 0, 7); targetCtx.fill();

    // back arm (waving)
    targetCtx.strokeStyle = shadeColor(skin, -10);
    targetCtx.lineWidth = Math.max(2.2, w*0.08);
    const backHandX = cx - w*0.32, backHandY = neckY - h*0.05 - wave*h*0.07;
    targetCtx.beginPath();
    targetCtx.moveTo(cx - w*0.16, neckY + h*0.04);
    targetCtx.lineTo(backHandX, backHandY);
    targetCtx.stroke();
    targetCtx.fillStyle = skin;
    targetCtx.beginPath(); targetCtx.arc(backHandX, backHandY, w*0.06, 0, 7); targetCtx.fill();

    // torso — a soft, tapered silhouette (rounded shoulders, narrower
    // waist) instead of a flat rectangle, shaded for a bit of depth
    const shoulderW = w*0.195, waistW = w*0.14, r = w*0.05;
    const topY = neckY, botY = hipY, midY = topY + (botY-topY)*0.55;
    targetCtx.beginPath();
    targetCtx.moveTo(cx-shoulderW, topY+r);
    targetCtx.quadraticCurveTo(cx-shoulderW, topY, cx-shoulderW+r, topY);
    targetCtx.lineTo(cx+shoulderW-r, topY);
    targetCtx.quadraticCurveTo(cx+shoulderW, topY, cx+shoulderW, topY+r);
    targetCtx.quadraticCurveTo(cx+shoulderW*0.94, midY, cx+waistW, botY-r);
    targetCtx.quadraticCurveTo(cx+waistW, botY, cx+waistW-r, botY);
    targetCtx.lineTo(cx-waistW+r, botY);
    targetCtx.quadraticCurveTo(cx-waistW, botY, cx-waistW, botY-r);
    targetCtx.quadraticCurveTo(cx-shoulderW*0.94, midY, cx-shoulderW, topY+r);
    targetCtx.closePath();
    const torsoGrad = targetCtx.createLinearGradient(cx-shoulderW, topY, cx+shoulderW, botY);
    torsoGrad.addColorStop(0, shadeColor(outfit, 12));
    torsoGrad.addColorStop(1, shadeColor(outfit, -14));
    targetCtx.fillStyle = torsoGrad;
    targetCtx.fill();
    // collar accent, curved to match the shoulder line
    targetCtx.fillStyle = accent;
    targetCtx.beginPath();
    targetCtx.moveTo(cx-shoulderW+r*0.4, topY);
    targetCtx.lineTo(cx+shoulderW-r*0.4, topY);
    targetCtx.lineTo(cx+shoulderW*0.92, topY+h*0.045);
    targetCtx.lineTo(cx-shoulderW*0.92, topY+h*0.045);
    targetCtx.closePath();
    targetCtx.fill();

    // head — use the member's real photo when available for a more
    // realistic look; otherwise fall back to the drawn vector head+hair.
    const usePhoto = photoReady(member.id);
    if(usePhoto){
      const headCx = cx, headCy = neckY - h*0.05, headR = w*0.235;
      targetCtx.save();
      targetCtx.shadowColor = accent + 'aa';
      targetCtx.shadowBlur = Math.max(4, w*0.06);
      drawPhotoCircle(targetCtx, member.id, headCx, headCy, headR);
      targetCtx.restore();
      targetCtx.strokeStyle = '#ffffff';
      targetCtx.lineWidth = Math.max(1.4, w*0.02);
      targetCtx.beginPath(); targetCtx.arc(headCx, headCy, headR, 0, 7); targetCtx.stroke();
      targetCtx.strokeStyle = accent;
      targetCtx.lineWidth = Math.max(1, w*0.012);
      targetCtx.beginPath(); targetCtx.arc(headCx, headCy, headR + Math.max(1.4,w*0.02), 0, 7); targetCtx.stroke();
    } else {
    targetCtx.fillStyle = skin;
    targetCtx.beginPath(); targetCtx.arc(cx, neckY - h*0.06, w*0.19, 0, 7); targetCtx.fill();

    // hair, per member style
    targetCtx.fillStyle = hair;
    const hY = neckY - h*0.06;
    const hR = w*0.205;
    switch(member.hairStyle){
      case 'largo':
        targetCtx.beginPath(); targetCtx.arc(cx, hY - h*0.03, hR, Math.PI, 0); targetCtx.fill();
        targetCtx.beginPath();
        targetCtx.moveTo(cx - hR*0.9, hY - h*0.02);
        targetCtx.quadraticCurveTo(cx - hR*1.3, hY + h*0.14, cx - hR*0.75, hY + h*0.2);
        targetCtx.quadraticCurveTo(cx - hR*0.6, hY + h*0.06, cx - hR*0.55, hY - h*0.02);
        targetCtx.closePath(); targetCtx.fill();
        targetCtx.beginPath();
        targetCtx.moveTo(cx + hR*0.9, hY - h*0.02);
        targetCtx.quadraticCurveTo(cx + hR*1.3, hY + h*0.14, cx + hR*0.75, hY + h*0.2);
        targetCtx.quadraticCurveTo(cx + hR*0.6, hY + h*0.06, cx + hR*0.55, hY - h*0.02);
        targetCtx.closePath(); targetCtx.fill();
        break;
      case 'despeinado':
        targetCtx.beginPath(); targetCtx.arc(cx, hY - h*0.02, hR*0.96, Math.PI, 0); targetCtx.fill();
        for(let i=-2;i<=2;i++){
          targetCtx.beginPath();
          targetCtx.moveTo(cx + i*hR*0.35, hY - h*0.05);
          targetCtx.lineTo(cx + i*hR*0.35 - hR*0.12, hY - h*0.16 - Math.abs(i)*h*0.01);
          targetCtx.lineTo(cx + i*hR*0.35 + hR*0.2, hY - h*0.05);
          targetCtx.closePath(); targetCtx.fill();
        }
        break;
      case 'side':
        targetCtx.beginPath(); targetCtx.arc(cx, hY - h*0.02, hR*0.96, Math.PI, 0); targetCtx.fill();
        targetCtx.beginPath();
        targetCtx.moveTo(cx - hR*0.9, hY - h*0.03);
        targetCtx.quadraticCurveTo(cx + hR*0.3, hY - h*0.12, cx + hR*1.0, hY - h*0.01);
        targetCtx.quadraticCurveTo(cx + hR*0.2, hY - h*0.05, cx - hR*0.9, hY - h*0.03);
        targetCtx.fill();
        break;
      case 'flequillo':
        targetCtx.beginPath(); targetCtx.arc(cx, hY - h*0.02, hR*0.96, Math.PI, 0); targetCtx.fill();
        targetCtx.beginPath();
        targetCtx.moveTo(cx - hR*0.8, hY - h*0.01);
        targetCtx.quadraticCurveTo(cx, hY + h*0.05, cx + hR*0.8, hY - h*0.01);
        targetCtx.quadraticCurveTo(cx, hY + h*0.01, cx - hR*0.8, hY - h*0.01);
        targetCtx.fill();
        break;
      default: // corto
        targetCtx.beginPath(); targetCtx.arc(cx, hY - h*0.02, hR*0.96, Math.PI, 0); targetCtx.fill();
    }

    // face
    targetCtx.fillStyle = '#1c1330';
    targetCtx.beginPath(); targetCtx.arc(cx - w*0.07, hY + h*0.01, w*0.028, 0, 7); targetCtx.fill();
    targetCtx.beginPath(); targetCtx.arc(cx + w*0.07, hY + h*0.01, w*0.028, 0, 7); targetCtx.fill();
    targetCtx.strokeStyle = '#7a3350';
    targetCtx.lineWidth = 1;
    targetCtx.beginPath();
    targetCtx.arc(cx, hY + h*0.05, w*0.05, 0.15*Math.PI, 0.85*Math.PI);
    targetCtx.stroke();
    } // end vector-head fallback (usePhoto branch)

    // front arm (waving, drawn last, over the torso)
    targetCtx.strokeStyle = skin;
    targetCtx.lineWidth = Math.max(2.4, w*0.09);
    const frontHandX = cx + w*0.34, frontHandY = neckY - h*0.06 - wave*h*0.08;
    targetCtx.beginPath();
    targetCtx.moveTo(cx + w*0.16, neckY + h*0.04);
    targetCtx.lineTo(frontHandX, frontHandY);
    targetCtx.stroke();
    targetCtx.fillStyle = skin;
    targetCtx.beginPath(); targetCtx.arc(frontHandX, frontHandY, w*0.065, 0, 7); targetCtx.fill();

    targetCtx.restore();
  }

  function drawCage(){
    const cg = S.cage;
    const x = cg.x - S.camX;
    const lvl = LEVELS[S.levelIdx];
    const openT = S.cageOpening ? S.cageOpenT : 0;
    ctx.save();
    ctx.translate(x, cg.y);
    ctx.fillStyle = `rgba(255,255,255,${(0.08 + openT*0.14).toFixed(3)})`;
    ctx.fillRect(0,0,cg.w,cg.h);

    // the rescued member — waves from inside, then steps forward as the door opens
    ctx.save();
    ctx.translate(0, openT*cg.h*0.1);
    drawMemberFigure(ctx, 0, cg.h*0.04, cg.w, cg.h*0.9, lvl.member, S.cageWave || 0, 1);
    ctx.restore();

    ctx.strokeStyle = lvl.member.color;
    ctx.lineWidth = 3;
    ctx.strokeRect(0,0,cg.w,cg.h);
    // bars (drawn on top so the captive reads as behind them). Once the
    // cage is triggered they swing open outward from the middle.
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.lineWidth = 2;
    for(let i=1;i<4;i++){
      const baseX = i*cg.w/4;
      const dir = baseX < cg.w/2 ? -1 : 1;
      const bx = baseX + dir*openT*cg.w*0.75;
      ctx.beginPath(); ctx.moveTo(bx,4); ctx.lineTo(bx,cg.h-4); ctx.stroke();
    }
    // little name tag under the cage
    ctx.fillStyle = lvl.member.color;
    ctx.font = 'bold 11px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(openT > 0.4 ? '¡Libre!' : lvl.member.name, cg.w/2, cg.h + 13);
    ctx.restore();
  }

  function drawCharacter(targetCtx, x, y, w, h, cfg, facing, walkPhase, onGround){
    // walkPhase/onGround are optional — the avatar-creator preview passes none,
    // which just yields a calm standing pose.
    const phase = walkPhase || 0;
    const grounded = onGround === undefined ? true : onGround;
    const swing = grounded ? Math.sin(phase) : 0;          // leg/arm swing while walking
    const bob = grounded ? Math.abs(Math.sin(phase)) * 1.6 : 0; // little up/down bounce

    targetCtx.save();
    targetCtx.translate(x, y - bob);

    const cx = w/2;
    const skin = cfg.skin, hair = cfg.hair, outfit = cfg.outfit, accent = cfg.accent || '#8a63d2';
    const neckY = 12, hipY = h - 12;

    targetCtx.lineCap = 'round';
    targetCtx.lineJoin = 'round';

    // ---- back leg (draw first so it's behind the dress) ----
    const legSwing = grounded ? swing * 7 : -4; // legs tucked up a bit mid-air
    const legLiftF = grounded ? 0 : 6;
    targetCtx.strokeStyle = shadeColor(skin, -12);
    targetCtx.lineWidth = 3.4;
    targetCtx.beginPath();
    targetCtx.moveTo(cx - 3, hipY - 2);
    targetCtx.lineTo(cx - 3 - legSwing*0.4, h - 4 + legLiftF);
    targetCtx.stroke();
    // back shoe
    targetCtx.fillStyle = '#2b1a2a';
    targetCtx.beginPath();
    targetCtx.ellipse(cx - 3 - legSwing*0.55, h - 3 + legLiftF, 3.6, 2, 0, 0, 7);
    targetCtx.fill();

    // ---- back arm ----
    targetCtx.strokeStyle = shadeColor(skin, -8);
    targetCtx.lineWidth = 3;
    targetCtx.beginPath();
    targetCtx.moveTo(cx - 7, neckY + 3);
    targetCtx.lineTo(cx - 7 - swing*5, neckY + 13 - swing*2);
    targetCtx.stroke();

    // ---- dress / outfit (curved A-line silhouette, rounded hem instead of straight edges) ----
    const dressGrad = targetCtx.createLinearGradient(cx-8.5, neckY, cx+8.5, hipY);
    dressGrad.addColorStop(0, shadeColor(outfit, 10));
    dressGrad.addColorStop(1, shadeColor(outfit, -12));
    targetCtx.fillStyle = dressGrad;
    targetCtx.beginPath();
    targetCtx.moveTo(cx - 5, neckY);
    targetCtx.quadraticCurveTo(cx - 8, neckY + (hipY-neckY)*0.5, cx - 8.5, hipY - 1.5);
    targetCtx.quadraticCurveTo(cx, hipY + 1.5, cx + 8.5, hipY - 1.5);
    targetCtx.quadraticCurveTo(cx + 8, neckY + (hipY-neckY)*0.5, cx + 5, neckY);
    targetCtx.closePath();
    targetCtx.fill();
    // waist sash accent, curved to hug the silhouette
    targetCtx.fillStyle = accent;
    targetCtx.beginPath();
    targetCtx.moveTo(cx - 6.4, neckY + (hipY-neckY)*0.52);
    targetCtx.quadraticCurveTo(cx, neckY + (hipY-neckY)*0.58, cx + 6.4, neckY + (hipY-neckY)*0.52);
    targetCtx.lineTo(cx + 6, neckY + (hipY-neckY)*0.52 + 2.4);
    targetCtx.quadraticCurveTo(cx, neckY + (hipY-neckY)*0.58 + 2.4, cx - 6, neckY + (hipY-neckY)*0.52 + 2.4);
    targetCtx.closePath();
    targetCtx.fill();

    // ---- front leg ----
    targetCtx.strokeStyle = shadeColor(skin, -4);
    targetCtx.lineWidth = 3.6;
    targetCtx.beginPath();
    targetCtx.moveTo(cx + 3, hipY - 2);
    targetCtx.lineTo(cx + 3 + legSwing*0.4, h - 4);
    targetCtx.stroke();
    // front shoe
    targetCtx.fillStyle = '#3a2140';
    targetCtx.beginPath();
    targetCtx.ellipse(cx + 3 + legSwing*0.55, h - 3, 3.8, 2.1, 0, 0, 7);
    targetCtx.fill();

    // ---- head ----
    targetCtx.fillStyle = skin;
    targetCtx.beginPath();
    targetCtx.arc(cx, 6, 8.6, 0, 7);
    targetCtx.fill();

    // ---- hair styles (feminine cuts) ----
    targetCtx.fillStyle = hair;
    if(cfg.hairStyle === 'largo'){
      targetCtx.beginPath();
      targetCtx.arc(cx, 2, 9.6, Math.PI*0.95, Math.PI*0.05);
      targetCtx.fill();
      // flowing strands down the sides, sway a little opposite to the walk
      const sway = swing * 1.2;
      targetCtx.beginPath();
      targetCtx.moveTo(cx - 9, 1);
      targetCtx.quadraticCurveTo(cx - 12 + sway, 14, cx - 8 + sway, 24);
      targetCtx.quadraticCurveTo(cx - 6, 14, cx - 6, 2);
      targetCtx.closePath();
      targetCtx.fill();
      targetCtx.beginPath();
      targetCtx.moveTo(cx + 9, 1);
      targetCtx.quadraticCurveTo(cx + 12 + sway, 14, cx + 8 + sway, 24);
      targetCtx.quadraticCurveTo(cx + 6, 14, cx + 6, 2);
      targetCtx.closePath();
      targetCtx.fill();
    } else if(cfg.hairStyle === 'coleta'){
      targetCtx.beginPath();
      targetCtx.arc(cx, 2, 9.2, Math.PI, 0);
      targetCtx.fill();
      const tailX = facing>0 ? cx + 10 : cx - 10;
      const tailSway = swing * 3;
      targetCtx.beginPath();
      targetCtx.ellipse(tailX + tailSway, 5, 3.6, 8, 0.35*facing, 0, 7);
      targetCtx.fill();
    } else { // corto
      targetCtx.beginPath();
      targetCtx.arc(cx, 2, 9.2, Math.PI, 0);
      targetCtx.fill();
      targetCtx.beginPath();
      targetCtx.ellipse(cx - (facing>0?7:-9), 4, 3, 5, 0, 0, 7);
      targetCtx.fill();
    }

    // ---- bow accessory ----
    targetCtx.fillStyle = accent;
    targetCtx.beginPath();
    targetCtx.moveTo(cx-8,-4); targetCtx.lineTo(cx-1,1); targetCtx.lineTo(cx-8,6); targetCtx.closePath(); targetCtx.fill();
    targetCtx.beginPath();
    targetCtx.moveTo(cx+8,-4); targetCtx.lineTo(cx+1,1); targetCtx.lineTo(cx+8,6); targetCtx.closePath(); targetCtx.fill();
    targetCtx.fillRect(cx-1.5,-1,3,4);

    // ---- face ----
    targetCtx.fillStyle = '#1c1330';
    const eyeX = facing>0 ? 2 : -2;
    targetCtx.beginPath(); targetCtx.arc(cx-3+eyeX,6,1.3,0,7); targetCtx.fill();
    targetCtx.beginPath(); targetCtx.arc(cx+3+eyeX,6,1.3,0,7); targetCtx.fill();
    // little smile
    targetCtx.strokeStyle = '#7a3350';
    targetCtx.lineWidth = 1;
    targetCtx.beginPath();
    targetCtx.arc(cx+eyeX*0.5, 8.5, 2, 0.15*Math.PI, 0.85*Math.PI);
    targetCtx.stroke();
    // blush
    targetCtx.fillStyle = 'rgba(242,120,159,.45)';
    targetCtx.beginPath(); targetCtx.arc(cx-5+eyeX, 8.5, 1.3, 0, 7); targetCtx.fill();
    targetCtx.beginPath(); targetCtx.arc(cx+5+eyeX, 8.5, 1.3, 0, 7); targetCtx.fill();

    // ---- front arm (drawn last, over the dress) ----
    targetCtx.strokeStyle = shadeColor(skin, 0);
    targetCtx.lineWidth = 3.2;
    targetCtx.beginPath();
    targetCtx.moveTo(cx + 7, neckY + 3);
    targetCtx.lineTo(cx + 7 + swing*5, neckY + 13 + swing*2);
    targetCtx.stroke();

    targetCtx.restore();
  }

  function shadeColor(hex, percent){
    // lighten/darken a #rrggbb color by percent (-100..100)
    const num = parseInt(hex.replace('#',''), 16);
    let r = (num >> 16) + Math.round(255 * (percent/100));
    let g = ((num >> 8) & 0x00FF) + Math.round(255 * (percent/100));
    let b = (num & 0x0000FF) + Math.round(255 * (percent/100));
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return '#' + (0x1000000 + r*0x10000 + g*0x100 + b).toString(16).slice(1);
  }

  function drawPlayer(){
    const p = S.player;
    drawCharacter(ctx, p.x - S.camX, p.y, p.w, p.h, avatar, p.facing, p.walkPhase, p.onGround);
  }

  function drawPits(){
    // subtle glow to indicate danger under gaps
  }

  function render(){
    drawBackground();
    for(const pl of S.platforms) drawPlatform(pl);
    for(const c of S.coinsArr) drawCoin(c);
    for(const e of S.enemies) drawEnemy(e);
    drawCage();
    drawPlayer();
  }

  function loop(){
    update();
    render();
    if(S.running) requestAnimationFrame(loop);
  }

  /* =========================================================
     INPUT
  ========================================================= */
  window.addEventListener('keydown', e=>{
    if(['ArrowLeft','a','A'].includes(e.key)) S.keys.left = true;
    if(['ArrowRight','d','D'].includes(e.key)) S.keys.right = true;
    if(['ArrowUp','w','W',' '].includes(e.key)) S.keys.jump = true;
    if(e.key === ' ') e.preventDefault();
  });
  window.addEventListener('keyup', e=>{
    if(['ArrowLeft','a','A'].includes(e.key)) S.keys.left = false;
    if(['ArrowRight','d','D'].includes(e.key)) S.keys.right = false;
    if(['ArrowUp','w','W',' '].includes(e.key)) S.keys.jump = false;
  });

  function bindHold(el, onDown, onUp){
    el.addEventListener('touchstart', e=>{ e.preventDefault(); onDown(); }, {passive:false});
    el.addEventListener('touchend', e=>{ e.preventDefault(); onUp(); }, {passive:false});
    el.addEventListener('mousedown', onDown);
    el.addEventListener('mouseup', onUp);
    el.addEventListener('mouseleave', onUp);
  }
  bindHold(els['btn-left'], ()=>S.keys.left=true, ()=>S.keys.left=false);
  bindHold(els['btn-right'], ()=>S.keys.right=true, ()=>S.keys.right=false);
  bindHold(els['btn-jump'], ()=>S.keys.jump=true, ()=>S.keys.jump=false);

  if('ontouchstart' in window){ els['touch-controls'].classList.remove('hidden'); }
  else { els['touch-controls'].classList.add('hidden'); }

  /* =========================================================
     FLOW WIRING
  ========================================================= */
  /* --- Avatar creator --- */
  const avatarPreviewCanvas = document.getElementById('avatar-preview');
  const avatarPreviewCtx = avatarPreviewCanvas.getContext('2d');

  let previewWalkPhase = 0;
  let previewAnimId = null;
  function renderAvatarPreview(){
    avatarPreviewCtx.clearRect(0,0,avatarPreviewCanvas.width,avatarPreviewCanvas.height);
    const grad = avatarPreviewCtx.createLinearGradient(0,0,0,140);
    grad.addColorStop(0,'#2c1c4a'); grad.addColorStop(1,'#1a1030');
    avatarPreviewCtx.fillStyle = grad;
    avatarPreviewCtx.fillRect(0,0,120,140);
    drawCharacter(avatarPreviewCtx, 30, 60, 60, 70, avatar, 1, previewWalkPhase, true);
  }
  function startPreviewWalkLoop(){
    if(previewAnimId) return; // already running
    function step(){
      previewWalkPhase += 0.09;
      renderAvatarPreview();
      previewAnimId = requestAnimationFrame(step);
    }
    step();
  }

  function buildSwatches(containerId, values, key, isColor){
    const el = document.getElementById(containerId);
    el.innerHTML = '';
    values.forEach(v=>{
      const item = document.createElement('div');
      if(isColor){
        item.className = 'swatch' + (avatar[key]===v ? ' selected' : '');
        item.style.background = v;
        item.addEventListener('click', ()=>{
          avatar[key] = v;
          buildSwatches(containerId, values, key, true);
          renderAvatarPreview();
        });
      }
      el.appendChild(item);
    });
  }

  function buildHairStyleOptions(){
    const el = document.getElementById('style-hair');
    el.innerHTML = '';
    AVATAR_HAIRSTYLES.forEach(hs=>{
      const item = document.createElement('div');
      item.className = 'style-swatch' + (avatar.hairStyle===hs.id ? ' selected':'');
      item.textContent = hs.label;
      item.addEventListener('click', ()=>{
        avatar.hairStyle = hs.id;
        buildHairStyleOptions();
        renderAvatarPreview();
      });
      el.appendChild(item);
    });
  }

  function setupAvatarScreen(){
    buildSwatches('swatch-skin', AVATAR_SKINS, 'skin', true);
    buildSwatches('swatch-hair', AVATAR_HAIR, 'hair', true);
    buildSwatches('swatch-outfit', AVATAR_OUTFITS, 'outfit', true);
    buildHairStyleOptions();
    renderAvatarPreview();
    startPreviewWalkLoop();
  }

  els['btn-start'].addEventListener('click', ()=>{
    ensureAudio();
    S.levelIdx = 0; S.lives = 3; S.coins = 0;
    setupAvatarScreen();
    switchScreen('screen-avatar');
  });

  els['btn-avatar-done'].addEventListener('click', ()=>{
    showLevelIntro(0);
  });

  els['btn-play-level'].addEventListener('click', ()=>{
    startLevelPlay();
    requestAnimationFrame(loop);
  });

  els['btn-continue'].addEventListener('click', ()=>{
    const next = S.levelIdx + 1;
    showLevelIntro(next);
  });

  els['btn-retry'].addEventListener('click', ()=>{
    S.lives = 3;
    startLevelPlay();
    requestAnimationFrame(loop);
  });

  els['btn-replay'].addEventListener('click', ()=>{
    S.levelIdx = 0; S.lives = 3; S.coins = 0;
    switchScreen('screen-title');
  });

  els['mute-btn'].addEventListener('click', ()=>{
    muted = !muted;
    els['mute-btn'].textContent = muted ? '🔇' : '🔊';
  });

  /* =========================================================
     FINALE — Anahi & Jungkook + confetti
  ========================================================= */
  const finaleLines = [
    '¡Los rescataste a los siete! Y ahora Bangtan armó un escenario entero solo para ti, Anahi.',
    'Te entregan un micrófono dorado con tu nombre grabado: un recuerdo de esta aventura.',
  ].concat(
    MEMBERS.concat([JK]).map(m => `${m.name}: "${m.msg}"`)
  ).concat([
    '"Borahae, Anahi" — dicen los siete a la vez, mientras el cielo se llena de luces moradas. ¡Que cumplas muchos más!'
  ]);
  function spawnBalloons(){
    const el = document.getElementById('balloons');
    el.innerHTML = '';
    const hues = [0, 40, 90, 160, 200, 260, 320];
    const count = 16;
    for(let i=0;i<count;i++){
      const b = document.createElement('div');
      b.className = 'balloon';
      b.textContent = '🎈';
      b.style.left = (Math.random()*94) + '%';
      b.style.filter = `hue-rotate(${hues[i % hues.length]}deg) drop-shadow(0 6px 8px rgba(0,0,0,.35))`;
      b.style.animationDuration = (6 + Math.random()*5) + 's';
      b.style.animationDelay = (Math.random()*6) + 's';
      b.style.fontSize = (2 + Math.random()*1.3) + 'rem';
      el.appendChild(b);
    }
  }

  function runFinale(){
    switchScreen('screen-finale');
    spawnBalloons();
    let i = 0;
    els['finale-text'].textContent = finaleLines[0];
    const cycle = setInterval(()=>{
      i = (i+1) % finaleLines.length;
      els['finale-text'].style.opacity = 0;
      setTimeout(()=>{
        els['finale-text'].textContent = finaleLines[i];
        els['finale-text'].style.opacity = 1;
      }, 300);
    }, 4200);
    els['btn-replay'].addEventListener('click', ()=>clearInterval(cycle), {once:true});
    startConfetti();
    startConcertLoop();
    els['btn-replay'].addEventListener('click', stopConcertLoop, {once:true});
  }

  /* =========================================================
     CONCERT STAGE — all 7 members performing for Anahi's finale
  ========================================================= */
  let concertAnim = null, concertActive = false;
  function drawConcertStage(t){
    const cc = document.getElementById('concert-canvas');
    const cx2 = cc.getContext('2d');
    const W2 = cc.width, H2 = cc.height;
    cx2.clearRect(0,0,W2,H2);

    // night sky backdrop
    const grad = cx2.createLinearGradient(0,0,0,H2);
    grad.addColorStop(0,'#160f2e');
    grad.addColorStop(0.6,'#241849');
    grad.addColorStop(1,'#3a1230');
    cx2.fillStyle = grad;
    cx2.fillRect(0,0,W2,H2);

    // twinkling stars
    cx2.save(); cx2.globalAlpha = 0.6;
    for(let i=0;i<40;i++){
      const sx = (i*53)%W2, sy = 10+(i*37)%150;
      cx2.fillStyle = '#fff';
      cx2.beginPath(); cx2.arc(sx, sy + Math.sin(t+i)*2, 1.4, 0, 7); cx2.fill();
    }
    cx2.restore();

    const performers = MEMBERS.concat([JK]);
    const n = performers.length;
    const stageTop = H2*0.42, stageBottom = H2*0.9;

    // sweeping spotlights, one per member
    performers.forEach((m,i)=>{
      const px = W2*(i+0.5)/n;
      const sway = Math.sin(t*0.5 + i*1.3)*26;
      const bg = cx2.createLinearGradient(px+sway, 0, px, stageTop);
      bg.addColorStop(0, m.color + '55');
      bg.addColorStop(1, m.color + '00');
      cx2.fillStyle = bg;
      cx2.beginPath();
      cx2.moveTo(px+sway-60,0); cx2.lineTo(px+sway+60,0);
      cx2.lineTo(px+26, stageTop); cx2.lineTo(px-26, stageTop);
      cx2.closePath(); cx2.fill();
    });

    // stage floor
    const floorGrad = cx2.createLinearGradient(0,stageTop,0,stageBottom);
    floorGrad.addColorStop(0,'#2c1c4a');
    floorGrad.addColorStop(1,'#150c26');
    cx2.fillStyle = floorGrad;
    cx2.fillRect(0, stageTop, W2, stageBottom-stageTop);
    cx2.fillStyle = 'rgba(255,255,255,.06)';
    for(let i=0;i<10;i++) cx2.fillRect(i*W2/10, stageTop, 2, stageBottom-stageTop);
    cx2.fillStyle = 'rgba(0,0,0,.35)';
    cx2.fillRect(0, stageBottom, W2, H2-stageBottom);

    // the seven members, singing in a row
    performers.forEach((m,i)=>{
      const px = W2*(i+0.5)/n;
      const figW = Math.min(72, (W2/n)*0.6);
      const figH = figW*1.95;
      const bounce = Math.abs(Math.sin(t*2.1 + i*0.8)) * figH*0.05;
      const py = stageBottom - figH - bounce;

      // mic stand
      cx2.strokeStyle = 'rgba(201,174,242,.8)';
      cx2.lineWidth = 2;
      cx2.beginPath(); cx2.moveTo(px, stageBottom-2); cx2.lineTo(px, py+figH*0.3); cx2.stroke();
      cx2.fillStyle = '#1c1330';
      cx2.beginPath(); cx2.arc(px, py+figH*0.26, 4.2, 0, 7); cx2.fill();

      drawMemberFigure(cx2, px-figW/2, py, figW, figH, m, t*2.3 + i*1.1, 1);

      cx2.fillStyle = m.color;
      cx2.font = 'bold 11px Poppins, sans-serif';
      cx2.textAlign = 'center';
      cx2.fillText(m.name, px, stageBottom + 15);
    });
  }

  function startConcertLoop(){
    concertActive = true;
    const t0 = performance.now();
    function frame(now){
      if(!concertActive) return;
      drawConcertStage((now-t0)/1000);
      concertAnim = requestAnimationFrame(frame);
    }
    concertAnim = requestAnimationFrame(frame);
  }
  function stopConcertLoop(){
    concertActive = false;
    if(concertAnim) cancelAnimationFrame(concertAnim);
  }

  function startConfetti(){
    const cc = document.getElementById('confetti-canvas');
    const cx = cc.getContext('2d');
    const colors = ['#f2c14e','#f2789f','#8a63d2','#8fd6f2','#ffffff'];
    let pieces = [];
    for(let i=0;i<90;i++){
      pieces.push({
        x: Math.random()*cc.width,
        y: Math.random()*-cc.height,
        w: 5+Math.random()*5,
        h: 8+Math.random()*6,
        vy: 1.5+Math.random()*2.5,
        vx: -1+Math.random()*2,
        rot: Math.random()*Math.PI,
        vr: -0.1+Math.random()*0.2,
        color: colors[Math.floor(Math.random()*colors.length)]
      });
    }
    let active = true;
    els['btn-replay'].addEventListener('click', ()=>{active=false;}, {once:true});
    function frame(){
      if(!active){ cx.clearRect(0,0,cc.width,cc.height); return; }
      cx.clearRect(0,0,cc.width,cc.height);
      for(const p of pieces){
        p.y += p.vy; p.x += p.vx; p.rot += p.vr;
        if(p.y > cc.height) p.y = -10;
        cx.save();
        cx.translate(p.x,p.y);
        cx.rotate(p.rot);
        cx.fillStyle = p.color;
        cx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
        cx.restore();
      }
      requestAnimationFrame(frame);
    }
    frame();
  }

})();

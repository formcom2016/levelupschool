/* ═══════════════════════════════════════════════════════════
   EDUVERSE CE1 — Logique du jeu (version démo)
   Sauvegarde locale (localStorage). Le code est structuré
   pour brancher plus tard un backend Google Apps Script :
   voir les fonctions apiSave() / apiLoad() en bas de fichier.
   ═══════════════════════════════════════════════════════════ */

// ── CONFIGURATION ──────────────────────────────────────────
var CONFIG = {
  DEMO_MODE: true,          // true = sauvegarde locale uniquement
  APPS_URL: '',             // URL Apps Script à renseigner en phase 2
  QUESTIONS_PAR_MISSION: 10,
  TEMPS_PAR_QUESTION: 20,   // secondes
  XP_BONNE_REPONSE: 10,
  XP_BONUS_PARFAIT: 20,
  XP_BONUS_DEFI: 100,
  PIECES_BONNE_REPONSE: 2,
  PIECES_MISSION_REUSSIE: 10,
  XP_PAR_NIVEAU: 200,
  VIES_MAX: 5
};

// ── DONNÉES DE RÉFÉRENCE ───────────────────────────────────
var AVATARS = ['🦊','🐱','🐼','🦁','🐸','🦄','🤖','👾','🧑‍🚀','🐯'];

var MATIERES = [
  { key: 'maths',    nom: 'Mathématiques', unlocked: true,  art: 'crystal' },
  { key: 'francais', nom: 'Français',      unlocked: false, art: 'tower'   },
  { key: 'sciences', nom: 'Sciences',      unlocked: false, art: 'dome'    },
  { key: 'histoire', nom: 'Histoire',      unlocked: false, art: 'castle'  },
  { key: 'arabe',    nom: 'Arabe',         unlocked: false, art: 'minaret' }
];

var COMPETENCES = [
  { key: 'addition',       nom: 'Addition',          ico: '➕' },
  { key: 'soustraction',   nom: 'Soustraction',      ico: '➖' },
  { key: 'multiplication', nom: 'Multiplication',    ico: '✖️' },
  { key: 'doubles',        nom: 'Doubles & moitiés', ico: '🪞' },
  { key: 'problemes',      nom: 'Petits problèmes',  ico: '🧩' },
  { key: 'geometrie',      nom: 'Géométrie',         ico: '📐' }
];

var BADGES = [
  { key: 'premiere',  nom: 'Première mission', ico: '🚀' },
  { key: 'parfait',   nom: 'Sans-faute',       ico: '💯' },
  { key: 'trois',     nom: '3 étoiles',        ico: '🌟' },
  { key: 'serie5',    nom: 'Série de 5',       ico: '🔥' },
  { key: 'defi',      nom: 'Défi quotidien',   ico: '⚡' },
  { key: 'xp500',     nom: '500 XP',           ico: '🏅' },
  { key: 'niveau3',   nom: 'Niveau 3 atteint', ico: '👑' },
  { key: 'explorateur', nom: '10 missions',    ico: '🗺️' }
];

var BOTS = [
  { nom: 'Yassine', ava: '🐺', xp: 2540 },
  { nom: 'Salma',   ava: '🦋', xp: 2120 },
  { nom: 'Imane',   ava: '🐨', xp: 1980 },
  { nom: 'Adam',    ava: '🦖', xp: 980 },
  { nom: 'Nour',    ava: '🐬', xp: 870 },
  { nom: 'Lina',    ava: '🐰', xp: 640 },
  { nom: 'Rayan',   ava: '🐢', xp: 310 }
];

// ── ÉTAT DU JOUEUR ─────────────────────────────────────────
var state = null;

function defaultState(){
  var comps = {};
  COMPETENCES.forEach(function(c){
    comps[c.key] = { niveau: 1, etoiles: [0, 0, 0] }; // meilleures étoiles par niveau
  });
  return {
    prenom: '', avatar: AVATARS[0],
    xp: 0, pieces: 0, vies: CONFIG.VIES_MAX,
    comps: comps, badges: [], missions: 0,
    dailyDone: '', history: []
  };
}
function saveState(){
  try { localStorage.setItem('eduverse_ce1', JSON.stringify(state)); } catch(e){}
  if(!CONFIG.DEMO_MODE) apiSave();
}
function loadState(){
  try {
    var raw = localStorage.getItem('eduverse_ce1');
    if(raw) return JSON.parse(raw);
  } catch(e){}
  return null;
}

// ── OUTILS ─────────────────────────────────────────────────
function $(id){ return document.getElementById(id); }
function todayStr(){ return new Date().toISOString().slice(0, 10); }
function playerLevel(){ return Math.floor(state.xp / CONFIG.XP_PAR_NIVEAU) + 1; }
function compPct(key){
  var e = state.comps[key].etoiles;
  return Math.round((e[0] + e[1] + e[2]) / 9 * 100);
}
function globalPct(){
  var t = 0;
  COMPETENCES.forEach(function(c){ t += compPct(c.key); });
  return Math.round(t / COMPETENCES.length);
}
function toast(msg){
  var t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(function(){ t.classList.remove('show'); }, 2600);
}
function fireConfetti(big){
  if(typeof confetti !== 'function') return;
  confetti({ particleCount: big ? 130 : 70, spread: 80, origin: { y: .35 },
    colors: ['#F5C518', '#8B5CF6', '#22D3EE', '#22C55E', '#fff'] });
  if(big) setTimeout(function(){
    confetti({ particleCount: 55, angle: 60, spread: 55, origin: { x: 0, y: .5 } });
    confetti({ particleCount: 55, angle: 120, spread: 55, origin: { x: 1, y: .5 } });
  }, 350);
}

// ── NAVIGATION ─────────────────────────────────────────────
function show(name){
  document.querySelectorAll('.screen').forEach(function(s){ s.classList.remove('active'); });
  $('screen-' + name).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(function(b){
    b.classList.toggle('active', b.getAttribute('data-nav') === name);
  });
  $('bottomNav').style.display = (name === 'login' || name === 'mission') ? 'none' : 'flex';
  if(name === 'home') renderHome();
  if(name === 'world') renderWorld();
  if(name === 'profil') renderProfil();
  if(name === 'classement') renderClassement();
  window.scrollTo(0, 0);
}
document.addEventListener('click', function(e){
  var nav = e.target.closest('[data-nav]');
  if(nav) show(nav.getAttribute('data-nav'));
});

// ── FOND ÉTOILÉ ────────────────────────────────────────────
(function stars(){
  var bg = $('spaceBg');
  for(var i = 0; i < 90; i++){
    var s = document.createElement('div');
    s.className = 'star';
    var size = Math.random() * 2.2 + .6;
    s.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + (Math.random() * 100) + '%;top:'
      + (Math.random() * 100) + '%;animation-delay:' + (Math.random() * 3.4) + 's';
    bg.appendChild(s);
  }
})();

// ── ÉCRAN LOGIN ────────────────────────────────────────────
var selAvatar = AVATARS[0];
(function initLogin(){
  var grid = $('avatarGrid');
  AVATARS.forEach(function(a, i){
    var b = document.createElement('button');
    b.className = 'avatar-opt' + (i === 0 ? ' sel' : '');
    b.textContent = a;
    b.setAttribute('aria-label', 'Avatar ' + a);
    b.onclick = function(){
      selAvatar = a;
      grid.querySelectorAll('.avatar-opt').forEach(function(x){ x.classList.remove('sel'); });
      b.classList.add('sel');
    };
    grid.appendChild(b);
  });
  $('btnStart').onclick = function(){
    var name = $('loginName').value.trim();
    if(!name){ toast('Écris ton prénom pour commencer !'); $('loginName').focus(); return; }
    state = defaultState();
    state.prenom = name.charAt(0).toUpperCase() + name.slice(1);
    state.avatar = selAvatar;
    saveState();
    fireConfetti(false);
    show('home');
  };
  $('loginName').addEventListener('keydown', function(e){ if(e.key === 'Enter') $('btnStart').click(); });
})();

// ── ÎLES : petites silhouettes SVG ─────────────────────────
function islandSvg(kind, active){
  var glow = active ? '#22D3EE' : '#4A5578';
  var body = active ? 'url(#islGrad)' : '#232B4A';
  var top = '';
  if(kind === 'crystal') top = '<polygon points="48,4 58,26 38,26" fill="' + glow + '" opacity=".9"/><polygon points="30,12 38,28 22,28" fill="' + glow + '" opacity=".55"/><polygon points="66,14 74,28 58,28" fill="' + glow + '" opacity=".55"/>';
  else if(kind === 'tower') top = '<rect x="42" y="6" width="12" height="22" rx="2" fill="' + glow + '" opacity=".8"/><rect x="28" y="16" width="9" height="12" rx="2" fill="' + glow + '" opacity=".5"/><rect x="59" y="16" width="9" height="12" rx="2" fill="' + glow + '" opacity=".5"/>';
  else if(kind === 'dome') top = '<path d="M32 28 a16 16 0 0 1 32 0 z" fill="' + glow + '" opacity=".8"/><rect x="46" y="6" width="4" height="10" fill="' + glow + '"/>';
  else if(kind === 'castle') top = '<rect x="34" y="12" width="28" height="16" fill="' + glow + '" opacity=".7"/><rect x="34" y="8" width="6" height="6" fill="' + glow + '"/><rect x="45" y="8" width="6" height="6" fill="' + glow + '"/><rect x="56" y="8" width="6" height="6" fill="' + glow + '"/>';
  else top = '<rect x="44" y="4" width="8" height="24" rx="4" fill="' + glow + '" opacity=".85"/><circle cx="48" cy="6" r="3.4" fill="' + glow + '"/>';
  return '<svg viewBox="0 0 96 56" aria-hidden="true">'
    + '<defs><linearGradient id="islGrad" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0" stop-color="#3B2E8C"/><stop offset="1" stop-color="#131048"/></linearGradient></defs>'
    + top
    + '<path d="M10 32 Q 48 22 86 32 L 74 50 Q 48 58 22 50 Z" fill="' + body + '" stroke="' + glow + '" stroke-opacity=".5" stroke-width="1.5"/>'
    + '</svg>';
}

// ── ÉCRAN ACCUEIL ──────────────────────────────────────────
function renderHome(){
  $('homeAvatar').textContent = state.avatar;
  $('homeName').textContent = state.prenom;
  $('homeLevel').textContent = 'Niveau ' + playerLevel() + ' · CE1';
  $('homeXp').textContent = state.xp.toLocaleString('fr-FR');
  var inLevel = state.xp % CONFIG.XP_PAR_NIVEAU;
  $('homeXpNext').textContent = inLevel + ' / ' + CONFIG.XP_PAR_NIVEAU;
  $('homeXpBar').style.width = (inLevel / CONFIG.XP_PAR_NIVEAU * 100) + '%';
  $('homeCoins').textContent = state.pieces;
  $('homeLives').textContent = state.vies + '/' + CONFIG.VIES_MAX;
  $('btnRecharge').style.display = (CONFIG.DEMO_MODE && state.vies < CONFIG.VIES_MAX) ? 'inline-flex' : 'none';

  var grid = $('islandsGrid');
  grid.innerHTML = '';

  // Rangée 1 : Maths · Défi · Français — Rangée 2 : Histoire · Sciences · Arabe
  var order = [MATIERES[0], null, MATIERES[1], MATIERES[3], MATIERES[2], MATIERES[4]];
  order.forEach(function(m){
    if(m === null){
      var daily = document.createElement('div');
      daily.className = 'daily-card';
      var done = state.dailyDone === todayStr();
      daily.innerHTML = '<div class="daily-flame">' + (done ? '✅' : '☄️') + '</div>'
        + '<div class="daily-title">Défi quotidien</div>'
        + '<div class="daily-xp">+' + CONFIG.XP_BONUS_DEFI + ' XP</div>'
        + (done
            ? '<div class="daily-done">Défi du jour réussi ! Reviens demain 🌙</div>'
            : '<div style="margin-top:10px"><span class="btn btn-gold" style="font-size:11px;padding:9px 20px">Commencer</span></div>');
      if(!done) daily.onclick = function(){ startMission('daily', 0); };
      grid.appendChild(daily);
      return;
    }
    var card = document.createElement('div');
    card.className = 'island ' + (m.unlocked ? 'unlocked' : 'locked');
    var pct = m.unlocked ? globalPct() : 0;
    card.innerHTML = '<div class="island-art">' + islandSvg(m.art, m.unlocked) + '</div>'
      + '<div class="island-name">' + m.nom + '</div>'
      + '<div class="island-sub"><span>Niveau ' + (m.unlocked ? playerLevel() : 1) + '</span>'
      + '<span class="mini-bar"><i style="width:' + pct + '%"></i></span><span>' + pct + '%</span></div>'
      + (m.unlocked ? '<div class="island-cta">Explorer →</div>' : '<div class="lock-badge">🔒</div>');
    if(m.unlocked) card.onclick = function(){ show('world'); };
    else card.onclick = function(){ toast('🔒 Ce monde sera bientôt débloqué !'); };
    grid.appendChild(card);
  });
}
$('btnRecharge').onclick = function(e){
  e.stopPropagation();
  state.vies = CONFIG.VIES_MAX;
  saveState(); renderHome();
  toast('❤️ Vies rechargées !');
};

// ── ÉCRAN MONDE (compétences maths) ────────────────────────
function starsStr(n){
  var out = '';
  for(var i = 1; i <= 3; i++) out += '<span class="' + (i <= n ? '' : 'off') + '">★</span>';
  return out;
}
function renderWorld(){
  var grid = $('compGrid');
  grid.innerHTML = '';
  COMPETENCES.forEach(function(c){
    var st = state.comps[c.key];
    var card = document.createElement('div');
    card.className = 'comp-card';
    var pct = compPct(c.key);
    var nivBtns = '';
    for(var n = 1; n <= 3; n++){
      var unlocked = n === 1 || st.etoiles[n - 2] >= 2;
      nivBtns += '<button class="niv-btn" ' + (unlocked ? '' : 'disabled')
        + ' data-comp="' + c.key + '" data-niv="' + n + '">'
        + '<span>' + (unlocked ? 'Niv. ' + n : '🔒 Niv. ' + n) + '</span>'
        + '<span class="niv-stars">' + starsStr(st.etoiles[n - 1]) + '</span></button>';
    }
    card.innerHTML = '<div class="comp-head"><div class="comp-ico">' + c.ico + '</div>'
      + '<div style="flex:1"><div class="comp-name">' + c.nom + '</div>'
      + '<div class="comp-pct">' + pct + '% maîtrisé</div></div></div>'
      + '<div class="bar comp-bar"><i style="width:' + pct + '%;background:linear-gradient(90deg,#22C55E,#86EFAC)"></i></div>'
      + '<div class="niv-row">' + nivBtns + '</div>';
    grid.appendChild(card);
  });
  grid.querySelectorAll('.niv-btn:not([disabled])').forEach(function(b){
    b.onclick = function(){
      startMission(b.getAttribute('data-comp'), parseInt(b.getAttribute('data-niv'), 10));
    };
  });
}

// ── MOTEUR DE MISSION ──────────────────────────────────────
var mission = null;
var timerHandle = null;

function levelsSnapshot(){
  var out = {};
  COMPETENCES.forEach(function(c){ out[c.key] = state.comps[c.key].niveau; });
  return out;
}

function startMission(compKey, niveau){
  if(state.vies <= 0){
    toast('💔 Plus de vies ! Recharge-les sur l\u2019accueil.');
    return;
  }
  var isDaily = compKey === 'daily';
  var questions = isDaily
    ? EDU_QUESTIONS.buildDaily(levelsSnapshot(), CONFIG.QUESTIONS_PAR_MISSION)
    : EDU_QUESTIONS.buildMission(compKey, niveau, CONFIG.QUESTIONS_PAR_MISSION);

  mission = {
    comp: compKey, niveau: niveau, daily: isDaily,
    questions: questions, index: 0, bonnes: 0, streak: 0, bestStreak: 0,
    xp: 0, answers: [], startedAt: Date.now()
  };
  var compNom = isDaily ? 'Défi quotidien' : COMPETENCES.filter(function(c){ return c.key === compKey; })[0].nom;
  $('missionTag').textContent = (isDaily ? '☄️ ' : '🎯 ') + compNom.toUpperCase() + (isDaily ? '' : ' · NIV. ' + niveau);
  show('mission');
  renderQuestion();
}

function renderLives(){
  var el = $('missionLives');
  el.innerHTML = '';
  for(var i = 1; i <= CONFIG.VIES_MAX; i++){
    var s = document.createElement('span');
    s.textContent = '❤️';
    if(i > state.vies) s.className = 'lost';
    el.appendChild(s);
  }
}

var TIMER_CIRC = 2 * Math.PI * 38;
function startTimer(){
  stopTimer();
  var left = CONFIG.TEMPS_PAR_QUESTION;
  var circle = $('timerCircle');
  circle.style.strokeDasharray = TIMER_CIRC;
  circle.style.strokeDashoffset = 0;
  circle.style.stroke = 'var(--cyan)';
  $('timerNum').textContent = left;
  timerHandle = setInterval(function(){
    left--;
    $('timerNum').textContent = Math.max(left, 0);
    circle.style.strokeDashoffset = TIMER_CIRC * (1 - left / CONFIG.TEMPS_PAR_QUESTION);
    if(left <= 5) circle.style.stroke = 'var(--red)';
    if(left <= 0){ stopTimer(); answer(-1); }
  }, 1000);
}
function stopTimer(){ if(timerHandle){ clearInterval(timerHandle); timerHandle = null; } }

function renderQuestion(){
  var q = mission.questions[mission.index];
  renderLives();
  $('qCount').textContent = 'QUESTION ' + (mission.index + 1) + ' / ' + mission.questions.length;
  $('qBar').style.width = (mission.index / mission.questions.length * 100) + '%';
  $('qText').textContent = q.q;
  var vis = $('qVisual');
  if(q.svg){ vis.innerHTML = q.svg; vis.style.display = 'flex'; }
  else { vis.innerHTML = ''; vis.style.display = 'none'; }
  var box = $('answers');
  box.innerHTML = '';
  var letters = ['A', 'B', 'C', 'D'];
  q.choices.forEach(function(c, i){
    var b = document.createElement('button');
    b.className = 'ans-btn';
    b.innerHTML = '<span class="ans-letter">' + letters[i] + '</span><span>' + c + '</span>';
    b.onclick = function(){ answer(i); };
    box.appendChild(b);
  });
  var fb = $('feedback');
  fb.className = 'feedback';
  startTimer();
}

function answer(idx){
  stopTimer();
  var q = mission.questions[mission.index];
  var good = idx === q.answer;
  var btns = $('answers').querySelectorAll('.ans-btn');
  btns.forEach(function(b, i){
    b.disabled = true;
    if(i === q.answer) b.classList.add('correct');
    if(i === idx && !good) b.classList.add('wrong');
  });
  mission.answers.push({ q: q.q, choisi: idx >= 0 ? q.choices[idx] : '⏱ temps écoulé', bon: q.choices[q.answer], ok: good });

  var fb = $('feedback');
  if(good){
    mission.bonnes++;
    mission.streak++;
    mission.bestStreak = Math.max(mission.bestStreak, mission.streak);
    mission.xp += CONFIG.XP_BONNE_REPONSE;
    $('feedbackTxt').textContent = pickMsg(['Bonne réponse !', 'Bravo !', 'Super !', 'Génial !', 'Exact !']);
    $('feedbackXp').textContent = '+' + CONFIG.XP_BONNE_REPONSE + ' XP ⚡';
    fb.className = 'feedback show good';
  } else {
    mission.streak = 0;
    state.vies = Math.max(0, state.vies - 1);
    renderLives();
    $('feedbackTxt').textContent = (idx < 0 ? '⏱ Temps écoulé ! ' : 'Presque ! ') + 'La bonne réponse était ' + q.choices[q.answer] + '.';
    $('feedbackXp').textContent = '−1 ❤️';
    fb.className = 'feedback show bad';
  }
  saveState();

  setTimeout(function(){
    mission.index++;
    if(mission.index >= mission.questions.length || state.vies <= 0) endMission();
    else renderQuestion();
  }, good ? 1100 : 1900);
}
function pickMsg(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

$('btnQuitMission').onclick = function(){
  stopTimer();
  if(confirm('Quitter la mission ? Ta progression de cette mission sera perdue.')) show(mission && mission.daily ? 'home' : 'world');
  else if(mission) startTimer();
};

// ── FIN DE MISSION ─────────────────────────────────────────
function computeStars(bonnes, total){
  var r = bonnes / total;
  if(r >= .9) return 3;
  if(r >= .7) return 2;
  if(r >= .5) return 1;
  return 0;
}

function endMission(){
  stopTimer();
  var total = mission.questions.length;
  var stars = computeStars(mission.bonnes, total);
  var xp = mission.xp;
  var coins = mission.bonnes * CONFIG.PIECES_BONNE_REPONSE;
  var gagneVie = false;
  var newBadges = [];

  if(mission.bonnes === total) xp += CONFIG.XP_BONUS_PARFAIT;
  if(stars >= 2) coins += CONFIG.PIECES_MISSION_REUSSIE;
  if(mission.daily && stars >= 1){
    xp += CONFIG.XP_BONUS_DEFI;
    state.dailyDone = todayStr();
    if(state.badges.indexOf('defi') < 0){ state.badges.push('defi'); newBadges.push('defi'); }
  }
  if(mission.bonnes >= 8 && state.vies < CONFIG.VIES_MAX){ state.vies++; gagneVie = true; }

  // Étoiles + déblocage du niveau suivant
  if(!mission.daily){
    var st = state.comps[mission.comp];
    st.etoiles[mission.niveau - 1] = Math.max(st.etoiles[mission.niveau - 1], stars);
    if(stars >= 2 && mission.niveau < 3 && st.niveau < mission.niveau + 1){
      st.niveau = mission.niveau + 1;
      if(st.niveau === 3 && state.badges.indexOf('niveau3') < 0){ state.badges.push('niveau3'); newBadges.push('niveau3'); }
    }
  }

  state.xp += xp;
  state.pieces += coins;
  state.missions++;
  state.history.unshift({
    date: todayStr(),
    comp: mission.daily ? 'Défi quotidien' : COMPETENCES.filter(function(c){ return c.key === mission.comp; })[0].nom + ' · Niv. ' + mission.niveau,
    score: mission.bonnes + '/' + total, xp: xp
  });
  state.history = state.history.slice(0, 12);

  // Badges
  function earn(k){ if(state.badges.indexOf(k) < 0){ state.badges.push(k); newBadges.push(k); } }
  if(state.missions === 1) earn('premiere');
  if(mission.bonnes === total) earn('parfait');
  if(stars === 3) earn('trois');
  if(mission.bestStreak >= 5) earn('serie5');
  if(state.xp >= 500) earn('xp500');
  if(state.missions >= 10) earn('explorateur');

  saveState();

  // Affichage
  $('resultTitle').textContent = mission.daily ? 'Défi terminé !' : 'Mission terminée !';
  $('resultStars').innerHTML = starsStr(stars);
  $('resultMsg').textContent = stars === 3 ? 'Excellent travail !' : stars === 2 ? 'Très beau vol, explorateur !'
    : stars === 1 ? 'Bien joué, continue !' : 'Courage, réessaie ta mission !';
  $('resultScore').textContent = 'Tu as réussi ' + mission.bonnes + ' question' + (mission.bonnes > 1 ? 's' : '') + ' sur ' + total + ' · Tu as gagné :';
  $('rewXp').textContent = '+' + xp;
  $('rewCoins').textContent = '+' + coins;
  $('rewLifeCard').style.display = gagneVie ? 'block' : 'none';

  var bt = $('badgeToast');
  if(newBadges.length){
    var names = newBadges.map(function(k){
      return BADGES.filter(function(b){ return b.key === k; })[0].nom;
    }).join(' · ');
    $('badgeName').textContent = names;
    bt.classList.add('show');
  } else bt.classList.remove('show');

  var review = document.getElementById('reviewPanel');
  if(review) review.remove();

  show('result');
  if(stars >= 2) fireConfetti(stars === 3);
}

$('btnContinue').onclick = function(){ show(mission && mission.daily ? 'home' : 'world'); };
$('btnReview').onclick = function(){
  var old = document.getElementById('reviewPanel');
  if(old){ old.remove(); return; }
  var panel = document.createElement('div');
  panel.id = 'reviewPanel';
  panel.className = 'panel';
  panel.style.cssText = 'margin-top:20px;text-align:left';
  panel.innerHTML = '<div class="panel-title">Revoir les réponses</div>'
    + mission.answers.map(function(a, i){
        return '<div class="hist-row"><span class="hist-lbl" style="flex:1">'
          + (i + 1) + '. ' + a.q + '<br><span style="color:' + (a.ok ? 'var(--green)' : 'var(--red)') + ';font-weight:800">'
          + (a.ok ? '✔ ' + a.choisi : '✘ ' + a.choisi + ' → ' + a.bon) + '</span></span></div>';
      }).join('');
  document.querySelector('.result-wrap').appendChild(panel);
};

// ── ÉCRAN PROFIL ───────────────────────────────────────────
var DONUT_CIRC = 2 * Math.PI * 46;
function renderProfil(){
  $('profilSub').textContent = state.avatar + ' ' + state.prenom + ' · Élève CE1 · Niveau ' + playerLevel();
  var pct = globalPct();
  $('donutNum').textContent = pct + '%';
  var d = $('donutProg');
  d.style.strokeDasharray = DONUT_CIRC;
  d.style.strokeDashoffset = DONUT_CIRC * (1 - pct / 100);
  $('donutBravo').textContent = pct >= 60 ? 'Bravo ' + state.prenom + ' !' : 'En route, ' + state.prenom + ' !';
  $('donutTxt').textContent = pct >= 60 ? 'Tu progresses très bien. Continue comme ça !'
    : 'Chaque mission te fait gagner des étoiles et des XP.';

  $('skillsList').innerHTML = COMPETENCES.map(function(c){
    var p = compPct(c.key);
    var col = p >= 70 ? '#22C55E' : p >= 40 ? '#F5C518' : '#FF7849';
    return '<div class="skill-row"><span class="skill-name">' + c.ico + ' ' + c.nom + '</span>'
      + '<span class="bar"><i style="width:' + p + '%;background:' + col + ';box-shadow:0 0 8px ' + col + '"></i></span>'
      + '<span class="skill-pct" style="color:' + col + '">' + p + '%</span></div>';
  }).join('');

  $('badgesGrid').innerHTML = BADGES.map(function(b){
    var got = state.badges.indexOf(b.key) >= 0;
    return '<div class="badge-item ' + (got ? 'earned' : 'locked') + '">'
      + '<div class="b-ico">' + b.ico + '</div><div class="b-name">' + b.nom + '</div></div>';
  }).join('');

  $('histList').innerHTML = state.history.length
    ? state.history.map(function(h){
        return '<div class="hist-row"><span class="hist-lbl">' + h.comp + ' · ' + h.score + '</span>'
          + '<span class="hist-val">+' + h.xp + ' XP</span></div>';
      }).join('')
    : '<div class="hist-row"><span class="hist-lbl">Lance ta première mission pour écrire ton histoire ! 🚀</span></div>';
}

// ── ÉCRAN CLASSEMENT ───────────────────────────────────────
function renderClassement(){
  var all = BOTS.map(function(b){ return { nom: b.nom, ava: b.ava, xp: b.xp, me: false }; });
  all.push({ nom: state.prenom, ava: state.avatar, xp: state.xp, me: true });
  all.sort(function(a, b){ return b.xp - a.xp; });

  var podium = $('podium');
  var order = [1, 0, 2]; // 2e, 1er, 3e
  podium.innerHTML = order.map(function(i){
    var p = all[i];
    if(!p) return '';
    return '<div class="pod-col pod-' + (i + 1) + '">'
      + '<div class="pod-avatar">' + p.ava + '</div>'
      + '<div class="pod-name">' + p.nom + (p.me ? ' (toi)' : '') + '</div>'
      + '<div class="pod-xp">' + p.xp.toLocaleString('fr-FR') + ' XP</div>'
      + '<div class="pod-base">' + (i + 1) + '</div></div>';
  }).join('');

  $('rankList').innerHTML = all.slice(3).map(function(p, i){
    return '<div class="rank-row' + (p.me ? ' me' : '') + '">'
      + '<span class="rank-num">' + (i + 4) + '</span>'
      + '<span class="rank-ava">' + p.ava + '</span>'
      + '<span class="rank-name">' + p.nom + (p.me ? ' (toi)' : '') + '<small>Niveau '
      + (Math.floor(p.xp / CONFIG.XP_PAR_NIVEAU) + 1) + '</small></span>'
      + '<span class="rank-xp">' + p.xp.toLocaleString('fr-FR') + ' XP</span></div>';
  }).join('');
}

// ── PHASE 2 : BACKEND GOOGLE SHEETS (préparé, inactif) ─────
// Quand CONFIG.APPS_URL sera renseignée et DEMO_MODE = false,
// ces fonctions synchroniseront la progression avec Apps Script
// (même architecture ?action=... que Form'Com).
function apiSave(){
  if(!CONFIG.APPS_URL) return;
  var p = new URLSearchParams({
    action: 'saveProgress', prenom: state.prenom, xp: state.xp,
    pieces: state.pieces, data: JSON.stringify(state.comps)
  });
  fetch(CONFIG.APPS_URL + '?' + p.toString()).catch(function(){});
}
function apiLoad(){ /* action=getProgress — à implémenter en phase 2 */ }

// ── DÉMARRAGE ──────────────────────────────────────────────
(function boot(){
  var saved = loadState();
  if(saved && saved.prenom){
    state = saved;
    // Recharge quotidienne des vies
    if(state.lastDay !== todayStr()){
      state.lastDay = todayStr();
      state.vies = CONFIG.VIES_MAX;
      saveState();
    }
    show('home');
  } else {
    state = defaultState();
    show('login');
  }
})();

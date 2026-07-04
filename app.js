/* ═══════════════════════════════════════════════════════════
   EDUVERSE — Logique du jeu · v2 multi-niveaux + backend
   Deux modes :
   · DÉMO  (APPS_URL vide)      → tout en local, classement fictif
   · EN LIGNE (APPS_URL rempli) → connexion code+PIN, classement réel,
     progression synchronisée avec Google Sheets via Apps Script
   ═══════════════════════════════════════════════════════════ */

// ── CONFIGURATION ──────────────────────────────────────────
var CONFIG = {
  APPS_URL: 'https://script.google.com/macros/s/AKfycbzhOLq15kMwmzvxw1mPG5otjVp3x7d7d55cs-0LGJ1025DyYVUxQEjE91vyXLd8sUnU/exec',             // ← coller ici l'URL /exec du script Google (phase en ligne)
  QUESTIONS_PAR_MISSION: 10,
  XP_BONNE_REPONSE: 10,
  XP_BONUS_PARFAIT: 20,
  XP_BONUS_DEFI: 100,
  PIECES_BONNE_REPONSE: 2,
  PIECES_MISSION_REUSSIE: 10,
  XP_PAR_NIVEAU: 200,
  VIES_MAX: 5
};
function isOnline(){ return !!CONFIG.APPS_URL; }

// ── DONNÉES DE RÉFÉRENCE ───────────────────────────────────
var AVATARS = ['🦊','🐱','🐼','🦁','🐸','🦄','🤖','👾','🧑‍🚀','🐯'];

var CLASSES = [
  { key: 'gs',        label: 'Grande Section' },
  { key: 'ce1',       label: 'CE1' },
  { key: 'cm2',       label: 'CM2' },
  { key: 'sixieme',   label: '6e' },
  { key: 'quatrieme', label: '4e' },
  { key: 'seconde',   label: 'Seconde' }
];
function classeLabel(k){
  var c = CLASSES.filter(function(x){ return x.key === k; })[0];
  return c ? c.label : k;
}

var BADGES = [
  { key: 'premiere',    nom: 'Première mission', ico: '🚀' },
  { key: 'parfait',     nom: 'Sans-faute',       ico: '💯' },
  { key: 'trois',       nom: '3 étoiles',        ico: '🌟' },
  { key: 'serie5',      nom: 'Série de 5',       ico: '🔥' },
  { key: 'defi',        nom: 'Défi quotidien',   ico: '⚡' },
  { key: 'xp500',       nom: '500 XP',           ico: '🏅' },
  { key: 'niveau3',     nom: 'Niveau 3 atteint', ico: '👑' },
  { key: 'explorateur', nom: '10 missions',      ico: '🗺️' }
];

var BOTS = [ // classement fictif du mode démo uniquement
  { nom: 'Yassine', ava: '🐺', xp: 2540, classe: 'sixieme' },
  { nom: 'Salma',   ava: '🦋', xp: 2120, classe: 'cm2' },
  { nom: 'Imane',   ava: '🐨', xp: 1980, classe: 'ce1' },
  { nom: 'Adam',    ava: '🦖', xp: 980,  classe: 'quatrieme' },
  { nom: 'Nour',    ava: '🐬', xp: 870,  classe: 'seconde' },
  { nom: 'Lina',    ava: '🐰', xp: 640,  classe: 'gs' },
  { nom: 'Rayan',   ava: '🐢', xp: 310,  classe: 'ce1' }
];

// ── ÉTAT DU JOUEUR ─────────────────────────────────────────
var state = null;
var session = null; // { id, pin } en mode en ligne

function prog(){ return EDU_QUESTIONS.programme(state.classe); }
function competences(){ return prog().comps; }

function defaultComps(classe){
  var comps = {};
  EDU_QUESTIONS.programme(classe).comps.forEach(function(c){
    comps[c.key] = { niveau: 1, etoiles: [0, 0, 0] };
  });
  return comps;
}
function defaultState(classe){
  return {
    prenom: '', avatar: AVATARS[0], classe: classe || 'ce1',
    xp: 0, pieces: 0, vies: CONFIG.VIES_MAX,
    comps: defaultComps(classe || 'ce1'), badges: [], missions: 0,
    dailyDone: '', lastDay: '', history: []
  };
}
function saveState(){
  try { localStorage.setItem('eduverse_save', JSON.stringify(state)); } catch(e){}
}
function loadState(){
  try {
    var raw = localStorage.getItem('eduverse_save');
    if(raw) return JSON.parse(raw);
  } catch(e){}
  return null;
}
function saveSession(){ try { localStorage.setItem('eduverse_session', JSON.stringify(session)); } catch(e){} }
function loadSession(){
  try {
    var raw = localStorage.getItem('eduverse_session');
    if(raw) return JSON.parse(raw);
  } catch(e){}
  return null;
}
function clearSession(){
  session = null;
  try { localStorage.removeItem('eduverse_session'); localStorage.removeItem('eduverse_save'); } catch(e){}
}

// ── OUTILS ─────────────────────────────────────────────────
function $(id){ return document.getElementById(id); }
function todayStr(){ return new Date().toISOString().slice(0, 10); }
function playerLevel(){ return Math.floor(state.xp / CONFIG.XP_PAR_NIVEAU) + 1; }
function compPct(key){
  var c = state.comps[key];
  if(!c) return 0;
  return Math.round((c.etoiles[0] + c.etoiles[1] + c.etoiles[2]) / 9 * 100);
}
function globalPct(){
  var t = 0, list = competences();
  list.forEach(function(c){ t += compPct(c.key); });
  return Math.round(t / list.length);
}
function toast(msg){
  var t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(function(){ t.classList.remove('show'); }, 2800);
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
// Lecture à voix haute (précieux pour GS/CE1)
function speak(text){
  try {
    if(!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR'; u.rate = .92;
    window.speechSynthesis.speak(u);
  } catch(e){}
}

// ── API BACKEND (Apps Script) ──────────────────────────────
function api(params){
  return new Promise(function(resolve, reject){
    var id = 'cb_' + Math.random().toString(36).slice(2);
    var p = new URLSearchParams(params);
    p.set('callback', id);
    var s = document.createElement('script');
    s.src = CONFIG.APPS_URL + '?' + p.toString();
    s.onerror = function(){ cleanup(); reject(new Error('JSONP error')); };
    var timer = setTimeout(function(){ cleanup(); reject(new Error('JSONP timeout')); }, 12000);
    window[id] = function(data){ cleanup(); resolve(data); };
    function cleanup(){ clearTimeout(timer); delete window[id]; if(s.parentNode) s.parentNode.removeChild(s); }
    document.head.appendChild(s);
  });
}
function stateFromServer(el){
  var classe = el.classe || 'ce1';
  var s = defaultState(classe);
  s.prenom = el.prenom || '';
  s.avatar = el.avatar || AVATARS[0];
  s.classe = classe;
  s.xp = parseInt(el.xp, 10) || 0;
  s.pieces = parseInt(el.pieces, 10) || 0;
  s.vies = CONFIG.VIES_MAX;
  s.missions = parseInt(el.missions, 10) || 0;
  s.dailyDone = el.dailyDone || '';
  try { if(el.comps) s.comps = Object.assign(defaultComps(classe), JSON.parse(el.comps)); } catch(e){}
  try { if(el.badges) s.badges = JSON.parse(el.badges); } catch(e){}
  try { if(el.history) s.history = JSON.parse(el.history); } catch(e){}
  return s;
}
function apiSaveProgress(detail, xpGain){
  if(!isOnline() || !session) return Promise.resolve();
  return api({
    action: 'save', id: session.id, pin: session.pin,
    xp: state.xp, pieces: state.pieces, missions: state.missions,
    comps: JSON.stringify(state.comps), badges: JSON.stringify(state.badges),
    history: JSON.stringify(state.history.slice(0, 12)),
    dailyDone: state.dailyDone, detail: detail || '', xpGain: xpGain || 0
  }).catch(function(){ toast('📡 Hors ligne — progression gardée sur cet appareil'); });
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
var selClasse = 'ce1';

function initLoginDemo(){
  $('loginDemo').style.display = 'block';
  $('loginOnline').style.display = 'none';
  var grid = $('avatarGrid');
  grid.innerHTML = '';
  AVATARS.forEach(function(a, i){
    var b = document.createElement('button');
    b.className = 'avatar-opt' + (i === 0 ? ' sel' : '');
    b.textContent = a;
    b.onclick = function(){
      selAvatar = a;
      grid.querySelectorAll('.avatar-opt').forEach(function(x){ x.classList.remove('sel'); });
      b.classList.add('sel');
    };
    grid.appendChild(b);
  });
  var cg = $('classeGrid');
  cg.innerHTML = '';
  CLASSES.forEach(function(c, i){
    var b = document.createElement('button');
    b.className = 'classe-opt' + (c.key === selClasse ? ' sel' : '');
    b.textContent = c.label;
    b.onclick = function(){
      selClasse = c.key;
      cg.querySelectorAll('.classe-opt').forEach(function(x){ x.classList.remove('sel'); });
      b.classList.add('sel');
    };
    cg.appendChild(b);
  });
}
function initLoginOnline(){
  $('loginDemo').style.display = 'none';
  $('loginOnline').style.display = 'block';
  try {
    var urlId = new URLSearchParams(window.location.search).get('id');
    if(urlId) $('loginCode').value = urlId.toUpperCase();
  } catch(e){}
}

$('btnStart').onclick = function(){
  var name = $('loginName').value.trim();
  if(!name){ toast('Écris ton prénom pour commencer !'); $('loginName').focus(); return; }
  state = defaultState(selClasse);
  state.prenom = name.charAt(0).toUpperCase() + name.slice(1);
  state.avatar = selAvatar;
  state.lastDay = todayStr();
  saveState();
  fireConfetti(false);
  show('home');
};
$('loginName').addEventListener('keydown', function(e){ if(e.key === 'Enter') $('btnStart').click(); });

$('btnLoginOnline').onclick = function(){
  var code = $('loginCode').value.trim().toUpperCase();
  var pin = $('loginPin').value.trim();
  if(!code || pin.length < 4){ toast('Entre ton code et ton PIN à 4 chiffres'); return; }
  var btn = $('btnLoginOnline');
  btn.disabled = true; btn.textContent = 'Connexion…';
  api({ action: 'login', id: code, pin: pin }).then(function(res){
    btn.disabled = false; btn.textContent = '🚀 Se connecter';
    if(res.status !== 'ok'){ toast(res.message || 'Code ou PIN incorrect'); return; }
    session = { id: code, pin: pin };
    saveSession();
    state = stateFromServer(res.eleve);
    state.lastDay = todayStr();
    saveState();
    fireConfetti(false);
    show('home');
  }).catch(function(){
    btn.disabled = false; btn.textContent = '🚀 Se connecter';
    toast('Connexion impossible — vérifie ta connexion internet');
  });
};
$('loginPin').addEventListener('keydown', function(e){ if(e.key === 'Enter') $('btnLoginOnline').click(); });

// ── ÎLES SVG ───────────────────────────────────────────────
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

var MATIERES = [
  { key: 'maths',    nom: 'Mathématiques', unlocked: true,  art: 'crystal' },
  { key: 'francais', nom: 'Français',      unlocked: false, art: 'tower'   },
  { key: 'sciences', nom: 'Sciences',      unlocked: false, art: 'dome'    },
  { key: 'histoire', nom: 'Histoire',      unlocked: false, art: 'castle'  },
  { key: 'arabe',    nom: 'Langues',       unlocked: false, art: 'minaret' }
];

// ── ÉCRAN ACCUEIL ──────────────────────────────────────────
function renderHome(){
  document.body.classList.toggle('cls-gs', state.classe === 'gs');
  $('homeAvatar').textContent = state.avatar;
  $('homeName').textContent = state.prenom;
  $('homeLevel').textContent = 'Niveau ' + playerLevel() + ' · ' + classeLabel(state.classe);
  $('homeXp').textContent = state.xp.toLocaleString('fr-FR');
  var inLevel = state.xp % CONFIG.XP_PAR_NIVEAU;
  $('homeXpNext').textContent = inLevel + ' / ' + CONFIG.XP_PAR_NIVEAU;
  $('homeXpBar').style.width = (inLevel / CONFIG.XP_PAR_NIVEAU * 100) + '%';
  $('homeCoins').textContent = state.pieces;
  $('homeLives').textContent = state.vies + '/' + CONFIG.VIES_MAX;
  $('btnRecharge').style.display = state.vies < CONFIG.VIES_MAX ? 'inline-flex' : 'none';

  var grid = $('islandsGrid');
  grid.innerHTML = '';
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

// ── ÉCRAN MONDE ────────────────────────────────────────────
function starsStr(n){
  var out = '';
  for(var i = 1; i <= 3; i++) out += '<span class="' + (i <= n ? '' : 'off') + '">★</span>';
  return out;
}
function renderWorld(){
  $('worldSub').textContent = classeLabel(state.classe)
    + ' · Chaque mission : ' + CONFIG.QUESTIONS_PAR_MISSION + ' questions · Gagne 2 étoiles ⭐⭐ pour débloquer le niveau suivant';
  var grid = $('compGrid');
  grid.innerHTML = '';
  competences().forEach(function(c){
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
  competences().forEach(function(c){ out[c.key] = state.comps[c.key].niveau; });
  return out;
}
function compName(key){
  var c = competences().filter(function(x){ return x.key === key; })[0];
  return c ? c.nom : key;
}

function startMission(compKey, niveau){
  if(state.vies <= 0){
    toast('💔 Plus de vies ! Recharge-les sur l\u2019accueil.');
    return;
  }
  var isDaily = compKey === 'daily';
  var questions = isDaily
    ? EDU_QUESTIONS.buildDaily(state.classe, levelsSnapshot(), CONFIG.QUESTIONS_PAR_MISSION)
    : EDU_QUESTIONS.buildMission(state.classe, compKey, niveau, CONFIG.QUESTIONS_PAR_MISSION);

  mission = {
    comp: compKey, niveau: niveau, daily: isDaily,
    questions: questions, index: 0, bonnes: 0, streak: 0, bestStreak: 0,
    xp: 0, answers: []
  };
  $('missionTag').textContent = (isDaily ? '☄️ DÉFI QUOTIDIEN' : '🎯 ' + compName(compKey).toUpperCase() + ' · NIV. ' + niveau);
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
function tempsQuestion(){ return prog().temps || 20; }
function startTimer(){
  stopTimer();
  var total = tempsQuestion();
  var left = total;
  var circle = $('timerCircle');
  circle.style.strokeDasharray = TIMER_CIRC;
  circle.style.strokeDashoffset = 0;
  circle.style.stroke = 'var(--cyan)';
  $('timerNum').textContent = left;
  timerHandle = setInterval(function(){
    left--;
    $('timerNum').textContent = Math.max(left, 0);
    circle.style.strokeDashoffset = TIMER_CIRC * (1 - left / total);
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
$('btnSpeak').onclick = function(){
  if(mission) speak(mission.questions[mission.index].q);
};

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

  var detailMission = mission.daily ? 'Défi quotidien' : compName(mission.comp) + ' · Niv. ' + mission.niveau;
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
  state.history.unshift({ date: todayStr(), comp: detailMission, score: mission.bonnes + '/' + total, xp: xp });
  state.history = state.history.slice(0, 12);

  function earn(k){ if(state.badges.indexOf(k) < 0){ state.badges.push(k); newBadges.push(k); } }
  if(state.missions === 1) earn('premiere');
  if(mission.bonnes === total) earn('parfait');
  if(stars === 3) earn('trois');
  if(mission.bestStreak >= 5) earn('serie5');
  if(state.xp >= 500) earn('xp500');
  if(state.missions >= 10) earn('explorateur');

  saveState();
  apiSaveProgress(detailMission + ' · ' + mission.bonnes + '/' + total, xp);

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
  $('profilSub').textContent = state.avatar + ' ' + state.prenom + ' · Élève ' + classeLabel(state.classe) + ' · Niveau ' + playerLevel();
  var pct = globalPct();
  $('donutNum').textContent = pct + '%';
  var d = $('donutProg');
  d.style.strokeDasharray = DONUT_CIRC;
  d.style.strokeDashoffset = DONUT_CIRC * (1 - pct / 100);
  $('donutBravo').textContent = pct >= 60 ? 'Bravo ' + state.prenom + ' !' : 'En route, ' + state.prenom + ' !';
  $('donutTxt').textContent = pct >= 60 ? 'Tu progresses très bien. Continue comme ça !'
    : 'Chaque mission te fait gagner des étoiles et des XP.';

  $('skillsList').innerHTML = competences().map(function(c){
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
$('btnLogout').onclick = function(){
  if(confirm('Changer de joueur ? (la progression en ligne est conservée)')){
    clearSession();
    state = defaultState('ce1');
    if(isOnline()) initLoginOnline(); else initLoginDemo();
    show('login');
  }
};

// ── ÉCRAN CLASSEMENT ───────────────────────────────────────
function renderClassement(){
  if(isOnline()){
    $('rankList').innerHTML = '<div class="rank-row"><span class="rank-name">Chargement du classement… 📡</span></div>';
    $('podium').innerHTML = '';
    api({ action: 'leaderboard' }).then(function(res){
      if(res.status !== 'ok'){ paintClassement(demoBoard()); return; }
      var rows = res.eleves.map(function(e){
        return { nom: e.prenom, ava: e.avatar || '🙂', xp: parseInt(e.xp, 10) || 0,
                 classe: e.classe, me: session && e.id === session.id };
      });
      paintClassement(rows);
    }).catch(function(){ paintClassement(demoBoard()); });
  } else {
    paintClassement(demoBoard());
  }
}
function demoBoard(){
  var all = BOTS.map(function(b){ return { nom: b.nom, ava: b.ava, xp: b.xp, classe: b.classe, me: false }; });
  all.push({ nom: state.prenom, ava: state.avatar, xp: state.xp, classe: state.classe, me: true });
  return all;
}
function paintClassement(all){
  all.sort(function(a, b){ return b.xp - a.xp; });
  var podium = $('podium');
  var order = [1, 0, 2];
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
      + '<span class="rank-name">' + p.nom + (p.me ? ' (toi)' : '') + '<small>'
      + classeLabel(p.classe) + ' · Niveau ' + (Math.floor(p.xp / CONFIG.XP_PAR_NIVEAU) + 1) + '</small></span>'
      + '<span class="rank-xp">' + p.xp.toLocaleString('fr-FR') + ' XP</span></div>';
  }).join('') || '<div class="rank-row"><span class="rank-name">Le classement se remplit dès que les explorateurs jouent !</span></div>';
}

// ── DÉMARRAGE ──────────────────────────────────────────────
(function boot(){
  session = loadSession();
  var saved = loadState();

  if(isOnline()){
    if(session){
      // reconnexion silencieuse : cache local puis rafraîchissement serveur
      if(saved && saved.prenom){ state = saved; refreshDay(); show('home'); }
      else { state = defaultState('ce1'); show('login'); initLoginOnline(); }
      api({ action: 'login', id: session.id, pin: session.pin }).then(function(res){
        if(res.status === 'ok'){
          var fresh = stateFromServer(res.eleve);
          // on garde le meilleur des deux (au cas où la sync avait échoué)
          if(state && state.xp > fresh.xp){ apiSaveProgress('Resynchronisation', 0); }
          else { state = fresh; refreshDay(); saveState(); }
          if($('screen-home').classList.contains('active')) renderHome();
          else { show('home'); }
        } else {
          clearSession();
          state = defaultState('ce1');
          initLoginOnline(); show('login');
        }
      }).catch(function(){ /* hors ligne : on reste sur le cache */ });
    } else {
      state = defaultState('ce1');
      initLoginOnline(); show('login');
    }
  } else {
    if(saved && saved.prenom){ state = saved; refreshDay(); show('home'); }
    else { state = defaultState('ce1'); initLoginDemo(); show('login'); }
  }

  function refreshDay(){
    if(state.lastDay !== todayStr()){
      state.lastDay = todayStr();
      state.vies = CONFIG.VIES_MAX;
      saveState();
    }
  }
})();

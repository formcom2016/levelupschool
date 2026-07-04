/* ═══════════════════════════════════════════════════════════
   EDUVERSE CE1 — Banque de questions Mathématiques
   6 compétences × 3 niveaux, génération procédurale.
   Une question = { q, choices[4], answer(index), svg? }
   Pour ajouter une matière plus tard : créer un nouvel objet
   de générateurs sur ce même modèle.
   ═══════════════════════════════════════════════════════════ */

var EDU_QUESTIONS = (function(){

  // ── Utilitaires ─────────────────────────────────────────
  function rnd(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr){ return arr[rnd(0, arr.length - 1)]; }
  function shuffle(arr){
    var a = arr.slice();
    for(var i = a.length - 1; i > 0; i--){
      var j = rnd(0, i); var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // Construit les 4 choix autour de la bonne réponse (nombres)
  function buildChoices(answer){
    var set = {}; set[answer] = true;
    var pool = [answer + 1, answer - 1, answer + 2, answer - 2, answer + 10, answer - 10, answer + 3];
    var distractors = [];
    for(var i = 0; i < pool.length && distractors.length < 3; i++){
      var d = pool[i];
      if(d >= 0 && !set[d]){ set[d] = true; distractors.push(d); }
    }
    var k = 4;
    while(distractors.length < 3){ // filet de sécurité
      var d2 = answer + k; k++;
      if(d2 >= 0 && !set[d2]){ set[d2] = true; distractors.push(d2); }
    }
    var choices = shuffle([answer].concat(distractors));
    return { choices: choices.map(String), answer: choices.indexOf(answer) };
  }

  function numQ(text, answer, svg){
    var c = buildChoices(answer);
    return { q: text, choices: c.choices, answer: c.answer, svg: svg || null };
  }

  // Question à choix textuels (la bonne réponse est une chaîne)
  function textQ(text, good, wrongs, svg){
    var choices = shuffle([good].concat(shuffle(wrongs).slice(0, 3)));
    return { q: text, choices: choices, answer: choices.indexOf(good), svg: svg || null };
  }

  // ── Figures SVG pour la géométrie ───────────────────────
  var S = 'stroke="#22D3EE" stroke-width="5" fill="rgba(34,211,238,.12)" stroke-linejoin="round"';
  var SHAPES = {
    carre:     { name: 'un carré',      cotes: 4, svg: '<svg viewBox="0 0 120 120"><rect x="22" y="22" width="76" height="76" ' + S + '/></svg>' },
    rectangle: { name: 'un rectangle',  cotes: 4, svg: '<svg viewBox="0 0 120 120"><rect x="12" y="35" width="96" height="50" ' + S + '/></svg>' },
    triangle:  { name: 'un triangle',   cotes: 3, svg: '<svg viewBox="0 0 120 120"><polygon points="60,16 106,100 14,100" ' + S + '/></svg>' },
    cercle:    { name: 'un cercle',     cotes: 0, svg: '<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="42" ' + S + '/></svg>' },
    losange:   { name: 'un losange',    cotes: 4, svg: '<svg viewBox="0 0 120 120"><polygon points="60,12 100,60 60,108 20,60" ' + S + '/></svg>' },
    hexagone:  { name: 'un hexagone',   cotes: 6, svg: '<svg viewBox="0 0 120 120"><polygon points="60,12 100,36 100,84 60,108 20,84 20,36" ' + S + '/></svg>' },
    pentagone: { name: 'un pentagone',  cotes: 5, svg: '<svg viewBox="0 0 120 120"><polygon points="60,12 105,47 88,102 32,102 15,47" ' + S + '/></svg>' }
  };
  var SHAPE_NAMES = ['un carré','un rectangle','un triangle','un cercle','un losange','un hexagone','un pentagone'];

  function shapeQ(keys){
    var key = pick(keys);
    var sh = SHAPES[key];
    var wrongs = SHAPE_NAMES.filter(function(n){ return n !== sh.name; });
    return textQ('Comment s\u2019appelle cette figure ?', sh.name, wrongs, sh.svg);
  }
  function sidesQ(keys){
    var key = pick(keys);
    var sh = SHAPES[key];
    return numQ('Combien de c\u00f4t\u00e9s a cette figure ?', sh.cotes, sh.svg);
  }

  // ── Prénoms et objets pour les problèmes ────────────────
  var KIDS = ['L\u00e9a','Tom','Nour', 'Adam','Lina','Rayan','Salma','Hugo','Imane','Malo'];
  var THINGS = [
    { s: 'bille',   p: 'billes' },
    { s: 'image',   p: 'images' },
    { s: 'bonbon',  p: 'bonbons' },
    { s: 'crayon',  p: 'crayons' },
    { s: 'carte',   p: 'cartes' },
    { s: 'gommette',p: 'gommettes' }
  ];

  // ── Générateurs par compétence ──────────────────────────
  var GEN = {

    addition: function(niv){
      var a, b;
      if(niv === 1){ a = rnd(2, 10); b = rnd(2, 10); }              // jusqu'à 20
      else if(niv === 2){ a = rnd(11, 40); b = rnd(3, 29); }        // jusqu'à 69
      else { a = rnd(25, 70); b = rnd(15, 30); }                    // jusqu'à 100, retenues
      return numQ('Combien font ' + a + ' + ' + b + ' ?', a + b);
    },

    soustraction: function(niv){
      var a, b;
      if(niv === 1){ a = rnd(6, 20); b = rnd(1, a - 1); }
      else if(niv === 2){ a = rnd(20, 50); b = rnd(4, 19); }
      else { a = rnd(45, 99); b = rnd(12, 40); }
      return numQ('Combien font ' + a + ' \u2212 ' + b + ' ?', a - b);
    },

    multiplication: function(niv){
      var table, n;
      if(niv === 1){ table = 2; n = rnd(1, 10); }
      else if(niv === 2){ table = pick([2, 5, 10]); n = rnd(1, 10); }
      else { table = pick([2, 3, 4, 5]); n = rnd(2, 10); }
      return numQ('Combien font ' + table + ' \u00d7 ' + n + ' ?', table * n);
    },

    doubles: function(niv){
      if(niv === 1){
        var n = rnd(1, 10);
        return numQ('Quel est le double de ' + n + ' ?', n * 2);
      }
      if(niv === 2){
        if(rnd(0, 1) === 0){
          var m = rnd(6, 25);
          return numQ('Quel est le double de ' + m + ' ?', m * 2);
        }
        var pair = rnd(1, 10) * 2;
        return numQ('Quelle est la moiti\u00e9 de ' + pair + ' ?', pair / 2);
      }
      var pair2 = rnd(6, 49) * 2;
      return numQ('Quelle est la moiti\u00e9 de ' + pair2 + ' ?', pair2 / 2);
    },

    problemes: function(niv){
      var kid = pick(KIDS), kid2 = pick(KIDS.filter(function(k){ return k !== kid; }));
      var th = pick(THINGS);
      var a, b, c;
      if(niv === 1){
        a = rnd(3, 9); b = rnd(2, 8);
        if(rnd(0, 1) === 0){
          return numQ(kid + ' a ' + a + ' ' + th.p + '. ' + kid2 + ' lui en donne ' + b + '. Combien ' + kid + ' a-t-il de ' + th.p + ' maintenant ?', a + b);
        }
        var big = Math.max(a, b) + rnd(1, 4), small = Math.min(a, b);
        return numQ(kid + ' a ' + big + ' ' + th.p + '. Il en perd ' + small + '. Combien lui en reste-t-il ?', big - small);
      }
      if(niv === 2){
        a = rnd(12, 35); b = rnd(5, 15);
        if(rnd(0, 1) === 0){
          return numQ('Dans la classe, il y a ' + a + ' livres. La ma\u00eetresse en apporte ' + b + ' de plus. Combien y a-t-il de livres en tout ?', a + b);
        }
        return numQ(kid + ' a ' + a + ' ' + th.p + ' et en offre ' + b + ' \u00e0 ' + kid2 + '. Combien lui en reste-t-il ?', a - b);
      }
      // Niveau 3 : problème en deux étapes
      a = rnd(15, 40); b = rnd(6, 15); c = rnd(3, 10);
      return numQ(kid + ' a ' + a + ' ' + th.p + '. Il en gagne ' + b + ', puis en donne ' + c + ' \u00e0 ' + kid2 + '. Combien lui en reste-t-il ?', a + b - c);
    },

    geometrie: function(niv){
      if(niv === 1){
        return shapeQ(['carre', 'rectangle', 'triangle', 'cercle']);
      }
      if(niv === 2){
        return rnd(0, 1) === 0
          ? sidesQ(['carre', 'rectangle', 'triangle'])
          : shapeQ(['carre', 'rectangle', 'triangle', 'cercle', 'losange']);
      }
      var mode = rnd(0, 2);
      if(mode === 0) return sidesQ(['losange', 'hexagone', 'pentagone', 'triangle']);
      if(mode === 1) return shapeQ(['losange', 'hexagone', 'pentagone', 'carre']);
      return textQ(
        'Quelle figure a 4 c\u00f4t\u00e9s tous de la m\u00eame longueur ?',
        'le carr\u00e9',
        ['le rectangle', 'le triangle', 'le cercle', 'l\u2019hexagone'],
        SHAPES.carre.svg
      );
    }
  };

  // ── Assembler une mission de N questions ────────────────
  function buildMission(compKey, niveau, nb){
    nb = nb || 10;
    var out = [], seen = {}, guard = 0;
    while(out.length < nb && guard < 300){
      guard++;
      var q = GEN[compKey](niveau);
      if(!seen[q.q]){ seen[q.q] = true; out.push(q); }
    }
    return out;
  }

  // Défi quotidien : mélange de toutes les compétences au niveau courant du joueur
  function buildDaily(levels, nb){
    nb = nb || 10;
    var keys = Object.keys(GEN);
    var out = [], seen = {}, guard = 0;
    while(out.length < nb && guard < 300){
      guard++;
      var k = pick(keys);
      var q = GEN[k]((levels && levels[k]) || 1);
      if(!seen[q.q]){ seen[q.q] = true; out.push(q); }
    }
    return out;
  }

  return { buildMission: buildMission, buildDaily: buildDaily };
})();

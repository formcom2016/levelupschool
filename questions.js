/* ═══════════════════════════════════════════════════════════
   EDUVERSE — Banque de questions Mathématiques multi-niveaux
   Classes : GS, CE1, CM2, 6e, 4e, Seconde
   Chaque classe = 6 compétences × 3 niveaux de difficulté.
   Une question = { q, choices[], answer(index), svg? }
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

  // Choix numériques autour de la bonne réponse
  function buildChoices(answer, count){
    count = count || 4;
    var set = {}; set[answer] = true;
    var pool = [answer + 1, answer - 1, answer + 2, answer - 2, answer + 10, answer - 10, answer + 3, answer + 5];
    var ds = [];
    for(var i = 0; i < pool.length && ds.length < count - 1; i++){
      var d = pool[i];
      if(d >= 0 && !set[d]){ set[d] = true; ds.push(d); }
    }
    var k = 4;
    while(ds.length < count - 1){
      var d2 = answer + k; k++;
      if(d2 >= 0 && !set[d2]){ set[d2] = true; ds.push(d2); }
    }
    var choices = shuffle([answer].concat(ds));
    return { choices: choices.map(String), answer: choices.indexOf(answer) };
  }
  function numQ(text, answer, svg, count){
    var c = buildChoices(answer, count);
    return { q: text, choices: c.choices, answer: c.answer, svg: svg || null };
  }
  // Choix textuels : good = chaîne, wrongs = chaînes
  function textQ(text, good, wrongs, svg, count){
    count = count || 4;
    var uniq = [];
    shuffle(wrongs).forEach(function(w){
      if(w !== good && uniq.indexOf(w) < 0 && uniq.length < count - 1) uniq.push(w);
    });
    var choices = shuffle([good].concat(uniq));
    return { q: text, choices: choices, answer: choices.indexOf(good), svg: svg || null };
  }
  // Réponses décimales françaises (calcul en dixièmes pour éviter les flottants)
  function fr(nTenths){ return (nTenths / 10).toLocaleString('fr-FR'); }
  function decQ(text, answerTenths){
    var wrongsT = shuffle([answerTenths + 1, answerTenths - 1, answerTenths + 10, answerTenths - 10, answerTenths + 5])
      .filter(function(x){ return x >= 0 && x !== answerTenths; }).slice(0, 3);
    return textQ(text, fr(answerTenths), wrongsT.map(fr));
  }

  // ── Visuels ─────────────────────────────────────────────
  var S = 'stroke="#22D3EE" stroke-width="5" fill="rgba(34,211,238,.12)" stroke-linejoin="round"';
  var SHAPES = {
    carre:     { name: 'un carré',     cotes: 4, svg: '<svg viewBox="0 0 120 120"><rect x="22" y="22" width="76" height="76" ' + S + '/></svg>' },
    rectangle: { name: 'un rectangle', cotes: 4, svg: '<svg viewBox="0 0 120 120"><rect x="12" y="35" width="96" height="50" ' + S + '/></svg>' },
    triangle:  { name: 'un triangle',  cotes: 3, svg: '<svg viewBox="0 0 120 120"><polygon points="60,16 106,100 14,100" ' + S + '/></svg>' },
    cercle:    { name: 'un cercle',    cotes: 0, svg: '<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="42" ' + S + '/></svg>' },
    losange:   { name: 'un losange',   cotes: 4, svg: '<svg viewBox="0 0 120 120"><polygon points="60,12 100,60 60,108 20,60" ' + S + '/></svg>' },
    hexagone:  { name: 'un hexagone',  cotes: 6, svg: '<svg viewBox="0 0 120 120"><polygon points="60,12 100,36 100,84 60,108 20,84 20,36" ' + S + '/></svg>' },
    pentagone: { name: 'un pentagone', cotes: 5, svg: '<svg viewBox="0 0 120 120"><polygon points="60,12 105,47 88,102 32,102 15,47" ' + S + '/></svg>' }
  };
  var SHAPE_NAMES = ['un carré','un rectangle','un triangle','un cercle','un losange','un hexagone','un pentagone'];
  function shapeQ(keys, count){
    var sh = SHAPES[pick(keys)];
    return textQ('Comment s\u2019appelle cette figure ?', sh.name, SHAPE_NAMES.filter(function(n){ return n !== sh.name; }), sh.svg, count);
  }
  function sidesQ(keys){
    var sh = SHAPES[pick(keys)];
    return numQ('Combien de c\u00f4t\u00e9s a cette figure ?', sh.cotes, sh.svg);
  }
  function emojiBlock(str){
    return '<div style="font-size:36px;line-height:1.6;text-align:center;max-width:290px;word-break:break-all">' + str + '</div>';
  }
  function repeatE(e, n){ var s = ''; for(var i = 0; i < n; i++) s += e; return s; }

  var KIDS = ['Léa','Tom','Nour','Adam','Lina','Rayan','Salma','Hugo','Imane','Malo'];
  var THINGS = [
    { e: '🍎', p: 'pommes' }, { e: '⚽', p: 'ballons' }, { e: '⭐', p: 'étoiles' },
    { e: '🚗', p: 'voitures' }, { e: '🍓', p: 'fraises' }, { e: '✏️', p: 'crayons' }
  ];
  var COLORS = [
    { name: 'rouge', hex: '#EF4444' }, { name: 'bleu', hex: '#3B82F6' }, { name: 'vert', hex: '#22C55E' },
    { name: 'jaune', hex: '#F5C518' }, { name: 'violet', hex: '#8B5CF6' }, { name: 'orange', hex: '#FB923C' }
  ];

  // ═════════════════════════════════════════════════════════
  //  GÉNÉRATEURS PAR CLASSE
  // ═════════════════════════════════════════════════════════

  // ── GRANDE SECTION (visuel, peu de texte, 3 choix) ──────
  var GEN_GS = {
    compter: function(niv){
      var max = niv === 1 ? 5 : niv === 2 ? 8 : 10;
      var n = rnd(2, max), th = pick(THINGS);
      return numQ('Combien y a-t-il de ' + th.p + ' ?', n, emojiBlock(repeatE(th.e, n)), 3);
    },
    formes: function(niv){
      return niv <= 2 ? shapeQ(['carre','triangle','cercle'], 3) : shapeQ(['carre','triangle','cercle','rectangle'], 3);
    },
    comparer: function(niv){
      var max = niv === 1 ? 5 : 9;
      var a = rnd(1, max), b = rnd(1, max);
      while(b === a) b = rnd(1, max);
      var th = pick(THINGS);
      var k1 = pick(KIDS), k2 = pick(KIDS.filter(function(k){ return k !== k1; }));
      var vis = emojiBlock(k1 + ' : ' + repeatE(th.e, a) + '<br>' + k2 + ' : ' + repeatE(th.e, b));
      return textQ('Qui a le plus de ' + th.p + ' ?', a > b ? k1 : k2, [a > b ? k2 : k1], vis, 2);
    },
    petitscalculs: function(niv){
      var max = niv === 1 ? 3 : niv === 2 ? 4 : 5;
      var a = rnd(1, max), b = rnd(1, max), th = pick(THINGS);
      return numQ(a + ' ' + th.p + ' et ' + b + ' ' + th.p + '. Combien de ' + th.p + ' en tout ?',
        a + b, emojiBlock(repeatE(th.e, a) + ' ➕ ' + repeatE(th.e, b)), 3);
    },
    suites: function(niv){
      var max = niv === 1 ? 8 : niv === 2 ? 15 : 25;
      var n = rnd(1, max - 1);
      return rnd(0, 1) === 0
        ? numQ('Quel nombre vient juste après ' + n + ' ?', n + 1, null, 3)
        : numQ('Quel nombre vient juste avant ' + (n + 1) + ' ?', n, null, 3);
    },
    couleurs: function(niv){
      var c = pick(COLORS);
      var svg = '<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="42" fill="' + c.hex + '"/></svg>';
      return textQ('De quelle couleur est ce rond ?', c.name,
        COLORS.map(function(x){ return x.name; }).filter(function(n){ return n !== c.name; }), svg, 3);
    }
  };

  // ── CE1 ─────────────────────────────────────────────────
  var GEN_CE1 = {
    addition: function(niv){
      var a, b;
      if(niv === 1){ a = rnd(2, 10); b = rnd(2, 10); }
      else if(niv === 2){ a = rnd(11, 40); b = rnd(3, 29); }
      else { a = rnd(25, 70); b = rnd(15, 30); }
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
      var t = niv === 1 ? 2 : niv === 2 ? pick([2, 5, 10]) : pick([2, 3, 4, 5]);
      var n = rnd(niv === 3 ? 2 : 1, 10);
      return numQ('Combien font ' + t + ' \u00d7 ' + n + ' ?', t * n);
    },
    doubles: function(niv){
      if(niv === 1){ var n = rnd(1, 10); return numQ('Quel est le double de ' + n + ' ?', n * 2); }
      if(niv === 2){
        if(rnd(0, 1) === 0){ var m = rnd(6, 25); return numQ('Quel est le double de ' + m + ' ?', m * 2); }
        var p = rnd(1, 10) * 2; return numQ('Quelle est la moitié de ' + p + ' ?', p / 2);
      }
      var p2 = rnd(6, 49) * 2; return numQ('Quelle est la moitié de ' + p2 + ' ?', p2 / 2);
    },
    problemes: function(niv){
      var kid = pick(KIDS), kid2 = pick(KIDS.filter(function(k){ return k !== kid; }));
      var th = pick(THINGS), a, b, c;
      if(niv === 1){
        a = rnd(3, 9); b = rnd(2, 8);
        if(rnd(0, 1) === 0) return numQ(kid + ' a ' + a + ' ' + th.p + '. ' + kid2 + ' lui en donne ' + b + '. Combien en a-t-il maintenant ?', a + b);
        var big = Math.max(a, b) + rnd(1, 4);
        return numQ(kid + ' a ' + big + ' ' + th.p + '. Il en perd ' + Math.min(a, b) + '. Combien lui en reste-t-il ?', big - Math.min(a, b));
      }
      if(niv === 2){
        a = rnd(12, 35); b = rnd(5, 15);
        if(rnd(0, 1) === 0) return numQ('Dans la classe, il y a ' + a + ' livres. La maîtresse en apporte ' + b + '. Combien de livres en tout ?', a + b);
        return numQ(kid + ' a ' + a + ' ' + th.p + ' et en offre ' + b + ' à ' + kid2 + '. Combien lui en reste-t-il ?', a - b);
      }
      a = rnd(15, 40); b = rnd(6, 15); c = rnd(3, 10);
      return numQ(kid + ' a ' + a + ' ' + th.p + '. Il en gagne ' + b + ', puis en donne ' + c + ' à ' + kid2 + '. Combien lui en reste-t-il ?', a + b - c);
    },
    geometrie: function(niv){
      if(niv === 1) return shapeQ(['carre','rectangle','triangle','cercle']);
      if(niv === 2) return rnd(0, 1) === 0 ? sidesQ(['carre','rectangle','triangle']) : shapeQ(['carre','rectangle','triangle','cercle','losange']);
      var m = rnd(0, 2);
      if(m === 0) return sidesQ(['losange','hexagone','pentagone','triangle']);
      if(m === 1) return shapeQ(['losange','hexagone','pentagone','carre']);
      return textQ('Quelle figure a 4 côtés tous de la même longueur ?', 'le carré', ['le rectangle','le triangle','le cercle','l\u2019hexagone'], SHAPES.carre.svg);
    }
  };

  // ── CM2 ─────────────────────────────────────────────────
  var GEN_CM2 = {
    grandsnombres: function(niv){
      if(niv === 1){
        var n = rnd(100, 999);
        var pos = pick([['unités', n % 10], ['dizaines', Math.floor(n / 10) % 10], ['centaines', Math.floor(n / 100) % 10]]);
        return numQ('Dans ' + n + ', quel est le chiffre des ' + pos[0] + ' ?', pos[1]);
      }
      if(niv === 2){
        var m = rnd(1000, 99999);
        var pos2 = pick([['centaines', Math.floor(m / 100) % 10], ['milliers', Math.floor(m / 1000) % 10], ['dizaines', Math.floor(m / 10) % 10]]);
        return numQ('Dans ' + m.toLocaleString('fr-FR') + ', quel est le chiffre des ' + pos2[0] + ' ?', pos2[1]);
      }
      var base = rnd(10000, 90000);
      var nums = shuffle([base, base + rnd(100, 900), base - rnd(100, 900), base + rnd(1000, 5000)]);
      var best = Math.max.apply(null, nums);
      return textQ('Quel est le plus grand nombre ?', best.toLocaleString('fr-FR'),
        nums.filter(function(x){ return x !== best; }).map(function(x){ return x.toLocaleString('fr-FR'); }));
    },
    multiplication: function(niv){
      if(niv === 1){ var t = rnd(3, 9), n = rnd(3, 9); return numQ('Combien font ' + t + ' \u00d7 ' + n + ' ?', t * n); }
      if(niv === 2){ var a = rnd(3, 99); var f = pick([10, 100]); return numQ('Combien font ' + a + ' \u00d7 ' + f + ' ?', a * f); }
      var b = rnd(12, 49), c = rnd(3, 9);
      return numQ('Combien font ' + b + ' \u00d7 ' + c + ' ?', b * c);
    },
    division: function(niv){
      if(niv === 1){ var d = rnd(2, 9), q = rnd(2, 9); return numQ('Combien font ' + (d * q) + ' \u00f7 ' + d + ' ?', q); }
      if(niv === 2){ var d2 = rnd(3, 9), q2 = rnd(6, 15); return numQ('Combien font ' + (d2 * q2) + ' \u00f7 ' + d2 + ' ?', q2); }
      var d3 = rnd(3, 9), q3 = rnd(4, 12), r = rnd(1, d3 - 1);
      return numQ('Quel est le reste de la division de ' + (d3 * q3 + r) + ' par ' + d3 + ' ?', r);
    },
    fractions: function(niv){
      if(niv === 1){ var n = rnd(2, 12) * 2; return numQ('Combien vaut la moitié de ' + n + ' ?', n / 2); }
      if(niv === 2){ var m = rnd(2, 10) * 4; return numQ('Combien vaut le quart de ' + m + ' ?', m / 4); }
      var k = rnd(2, 8) * 4;
      return numQ('Combien valent les trois quarts de ' + k + ' ?', k * 3 / 4);
    },
    decimaux: function(niv){
      if(niv === 1){ var a = rnd(10, 89), b = rnd(2, 9); return decQ('Combien font ' + fr(a) + ' + ' + fr(b) + ' ?', a + b); }
      if(niv === 2){ var c = rnd(30, 99), d = rnd(11, 29); return decQ('Combien font ' + fr(c) + ' \u2212 ' + fr(d) + ' ?', c - d); }
      var e = rnd(11, 45);
      return decQ('Combien font ' + fr(e) + ' \u00d7 10 ?', e * 10);
    },
    mesures: function(niv){
      if(niv === 1){ var m = rnd(2, 9); return numQ('Combien y a-t-il de centimètres dans ' + m + ' m ?', m * 100); }
      if(niv === 2){ var h = rnd(1, 3), mn = pick([15, 30, 45]); return numQ('Combien de minutes dans ' + h + ' h ' + mn + ' min ?', h * 60 + mn); }
      var prix = rnd(3, 9), nb = rnd(3, 8), billet = 50;
      return numQ('Un cahier coûte ' + prix + ' €. ' + pick(KIDS) + ' en achète ' + nb + ' et paie avec un billet de ' + billet + ' €. Combien lui rend-on ?', billet - prix * nb);
    }
  };

  // ── SIXIÈME ─────────────────────────────────────────────
  function simplifiable(){
    var f = pick([[2,4],[3,4],[2,6],[4,6],[6,8],[3,9],[4,10],[6,10],[5,10],[8,12],[9,12]]);
    return f;
  }
  function pgcd(a, b){ return b ? pgcd(b, a % b) : a; }
  var GEN_6E = {
    fractions: function(niv){
      if(niv === 1){ var n = rnd(3, 12) * 2; return numQ('Combien vaut 1/2 de ' + n + ' ?', n / 2); }
      if(niv === 2){
        var f = simplifiable(), g = pgcd(f[0], f[1]);
        return textQ('Simplifie la fraction ' + f[0] + '/' + f[1], (f[0] / g) + '/' + (f[1] / g),
          [f[0] + '/' + (f[1] / g), (f[0] / g) + '/' + f[1], (f[0] * 2) + '/' + (f[1] * 2), '1/' + f[1]]);
      }
      var k = rnd(2, 8) * 4;
      return numQ('Combien valent 3/4 de ' + k + ' ?', k * 3 / 4);
    },
    decimaux: function(niv){
      if(niv === 1){ var a = rnd(15, 89), b = rnd(6, 30); return decQ('Combien font ' + fr(a) + ' + ' + fr(b) + ' ?', a + b); }
      if(niv === 2){ var c = rnd(12, 60); return decQ('Combien font ' + fr(c) + ' \u00d7 100 ?', c * 100); }
      var d = rnd(5, 30), e = rnd(2, 9);
      return decQ('Combien font ' + fr(d) + ' \u00d7 ' + e + ' ?', d * e);
    },
    proportionnalite: function(niv){
      var prix = rnd(2, 6), n1 = rnd(2, 4), n2 = rnd(5, 9);
      if(niv === 1) return numQ('Un stylo coûte ' + prix + ' €. Combien coûtent ' + n2 + ' stylos ?', prix * n2);
      if(niv === 2) return numQ(n1 + ' croissants coûtent ' + (prix * n1) + ' €. Combien coûtent ' + n2 + ' croissants ?', prix * n2);
      var v = rnd(4, 9) * 10;
      return numQ('Une voiture roule à ' + v + ' km/h. Quelle distance parcourt-elle en 3 heures ?', v * 3);
    },
    perimetres: function(niv){
      var L = rnd(5, 12), l = rnd(2, L - 1);
      if(niv === 1){ var c = rnd(3, 12); return numQ('Quel est le périmètre d\u2019un carré de côté ' + c + ' cm ? (en cm)', c * 4); }
      if(niv === 2) return numQ('Quel est le périmètre d\u2019un rectangle de longueur ' + L + ' cm et de largeur ' + l + ' cm ? (en cm)', 2 * (L + l));
      return numQ('Quelle est l\u2019aire d\u2019un rectangle de longueur ' + L + ' cm et de largeur ' + l + ' cm ? (en cm²)', L * l);
    },
    divisibilite: function(niv){
      var d = niv === 1 ? pick([2, 5]) : niv === 2 ? pick([3, 5, 10]) : pick([3, 4, 9]);
      var good = d * rnd(4, 20);
      var wrongs = [];
      while(wrongs.length < 3){
        var w = good + rnd(1, d - 1) + d * rnd(-2, 2);
        if(w > 0 && w % d !== 0 && wrongs.indexOf(String(w)) < 0) wrongs.push(String(w));
      }
      return textQ('Quel nombre est divisible par ' + d + ' ?', String(good), wrongs);
    },
    calculmental: function(niv){
      if(niv === 1){ var a = rnd(3, 9), b = rnd(3, 9), c = rnd(2, 9); return numQ('Combien font ' + a + ' + ' + b + ' \u00d7 ' + c + ' ? (attention aux priorités !)', a + b * c); }
      if(niv === 2){ var d = rnd(20, 60), e = rnd(2, 9), f = rnd(2, 9); return numQ('Combien font ' + d + ' \u2212 ' + e + ' \u00d7 ' + f + ' ?', d - e * f); }
      var g = rnd(2, 6), h = rnd(2, 6), i = rnd(2, 9);
      return numQ('Combien font (' + g + ' + ' + h + ') \u00d7 ' + i + ' ?', (g + h) * i);
    }
  };

  // ── QUATRIÈME ───────────────────────────────────────────
  var TRIPLES = [[3,4,5],[6,8,10],[5,12,13],[9,12,15],[8,15,17]];
  var GEN_4E = {
    relatifs: function(niv){
      var a = rnd(2, 15), b = rnd(2, 15);
      if(niv === 1) return numQ('Combien font (\u2212' + a + ') + (+' + b + ') ?', b - a);
      if(niv === 2) return numQ('Combien font (\u2212' + a + ') \u2212 (+' + b + ') ?', -a - b);
      return numQ('Combien font (\u2212' + a + ') \u00d7 (\u2212' + b + ') ?', a * b);
    },
    puissances: function(niv){
      if(niv === 1){ var n = rnd(2, 12); return numQ('Combien vaut ' + n + '² ?', n * n); }
      if(niv === 2){ var p = rnd(2, 5); return numQ('Combien vaut 10^' + p + ' ?', Math.pow(10, p)); }
      var m = rnd(2, 5);
      return numQ('Combien vaut ' + m + '³ ?', m * m * m);
    },
    litteral: function(niv){
      var a = rnd(2, 9), b = rnd(2, 9), x = rnd(2, 6);
      if(niv === 1) return textQ('Réduis : ' + a + 'x + ' + b + 'x', (a + b) + 'x', [(a + b + 1) + 'x', (a * b) + 'x', (a + b) + 'x²', Math.abs(a - b) + 'x']);
      if(niv === 2) return textQ('Développe : ' + a + '(x + ' + b + ')', a + 'x + ' + (a * b), [a + 'x + ' + b, a + 'x + ' + (a + b), (a * b) + 'x', 'x + ' + (a * b)]);
      return numQ('Si x = ' + x + ', combien vaut ' + a + 'x + ' + b + ' ?', a * x + b);
    },
    fractions: function(niv){
      var d = pick([3, 4, 5, 7]), a = rnd(1, d - 1), b = rnd(1, d - 1);
      if(niv === 1) return textQ('Combien font ' + a + '/' + d + ' + ' + b + '/' + d + ' ?', (a + b) + '/' + d,
        [(a + b) + '/' + (d * 2), (a * b) + '/' + d, (a + b + 1) + '/' + d, a + '/' + d]);
      if(niv === 2){ var k = rnd(2, 4); return textQ('Combien font ' + a + '/' + d + ' \u00d7 ' + k + ' ?', (a * k) + '/' + d,
        [(a * k) + '/' + (d * k), (a + k) + '/' + d, a + '/' + (d * k), (a * k + 1) + '/' + d]); }
      var n2 = rnd(1, 4);
      return textQ('Combien font 1/2 + ' + n2 + '/4 ?', (2 + n2) + '/4', [(1 + n2) + '/4', (1 + n2) + '/6', (2 + n2) + '/8', n2 + '/4']);
    },
    pythagore: function(niv){
      var t = pick(TRIPLES);
      if(niv === 1){ var n = rnd(3, 13); return numQ('Combien vaut ' + n + '² ?', n * n); }
      if(niv === 2) return numQ('Un triangle rectangle a des côtés de ' + t[0] + ' cm et ' + t[1] + ' cm. Quelle est la longueur de l\u2019hypoténuse ? (en cm)', t[2]);
      return numQ('Un triangle rectangle a une hypoténuse de ' + t[2] + ' cm et un côté de ' + t[0] + ' cm. Quelle est la longueur du troisième côté ? (en cm)', t[1]);
    },
    pourcentages: function(niv){
      if(niv === 1){ var n = rnd(2, 9) * 10; return numQ('Combien vaut 50 % de ' + n + ' ?', n / 2); }
      if(niv === 2){ var m = rnd(2, 9) * 10; var p = pick([10, 20, 25]); return numQ('Combien vaut ' + p + ' % de ' + m + ' ?', m * p / 100); }
      var prix = rnd(4, 20) * 10, r = pick([10, 20, 30, 50]);
      return numQ('Un article coûte ' + prix + ' €. Il est soldé à \u2212' + r + ' %. Quel est le nouveau prix ? (en €)', prix - prix * r / 100);
    }
  };

  // ── SECONDE ─────────────────────────────────────────────
  var GEN_2NDE = {
    numerique: function(niv){
      if(niv === 1){ var n = rnd(4, 15); return numQ('Combien vaut \u221a(' + (n * n) + ') ?', n); }
      if(niv === 2){ var a = rnd(2, 6), p = rnd(2, 3), q = rnd(2, 3); return numQ('Combien vaut ' + a + '^' + p + ' \u00d7 ' + a + '^' + q + ' ? (donne le résultat sous forme ' + a + '^n : n = ?)', p + q); }
      var b = rnd(2, 9), c = rnd(2, 9);
      return textQ('Combien font ' + b + '/10 + ' + c + '/100 ?', fr10c(b * 10 + c), [fr10c(b + c), fr10c(b * 10 + c + 10), fr10c(b * 100 + c), fr10c(b * 10 + c + 1)]);
    },
    algebrique: function(niv){
      var a = rnd(2, 6), b = rnd(2, 9);
      if(niv === 1) return textQ('Factorise : ' + a + 'x + ' + (a * b), a + '(x + ' + b + ')',
        [a + '(x + ' + (a * b) + ')', b + '(x + ' + a + ')', a + 'x(1 + ' + b + ')', '(x + ' + a + ')(x + ' + b + ')']);
      if(niv === 2) return textQ('Développe : (x + ' + a + ')²', 'x² + ' + (2 * a) + 'x + ' + (a * a),
        ['x² + ' + a + 'x + ' + (a * a), 'x² + ' + (a * a), 'x² + ' + (2 * a) + 'x + ' + (2 * a), 'x² \u2212 ' + (2 * a) + 'x + ' + (a * a)]);
      return textQ('Développe : (x + ' + a + ')(x \u2212 ' + a + ')', 'x² \u2212 ' + (a * a),
        ['x² + ' + (a * a), 'x² \u2212 ' + (2 * a) + 'x', 'x² \u2212 ' + (2 * a), '2x \u2212 ' + (a * a)]);
    },
    equations: function(niv){
      var a = rnd(2, 9), x = rnd(2, 12), b = rnd(1, 20);
      if(niv === 1) return numQ('Résous : x + ' + b + ' = ' + (x + b) + '. x = ?', x);
      if(niv === 2) return numQ('Résous : ' + a + 'x = ' + (a * x) + '. x = ?', x);
      return numQ('Résous : ' + a + 'x + ' + b + ' = ' + (a * x + b) + '. x = ?', x);
    },
    fonctions: function(niv){
      var a = rnd(2, 6), b = rnd(1, 10), x = rnd(2, 9);
      if(niv === 1) return numQ('Soit f(x) = ' + a + 'x + ' + b + '. Combien vaut f(' + x + ') ?', a * x + b);
      if(niv === 2) return numQ('Soit f(x) = ' + a + 'x + ' + b + '. Quel est l\u2019antécédent de ' + (a * x + b) + ' ?', x);
      return numQ('Soit f(x) = x² + ' + b + '. Combien vaut f(' + x + ') ?', x * x + b);
    },
    pourcentages: function(niv){
      if(niv === 1){ var n = rnd(2, 9) * 100; var p = pick([10, 20, 25, 50]); return numQ('Combien vaut ' + p + ' % de ' + n + ' ?', n * p / 100); }
      if(niv === 2){ var h = pick([10, 20, 50]); return textQ('Une hausse de ' + h + ' % correspond à quel coefficient multiplicateur ?', fr10c(100 + h), [fr10c(h), fr10c(100 - h), fr10c(100 + h * 10), '1/' + fr10c(100 + h)]); }
      var prix = rnd(2, 9) * 100, hh = pick([10, 20, 50]);
      return numQ('Un article à ' + prix + ' € augmente de ' + hh + ' %. Quel est le nouveau prix ? (en €)', prix * (100 + hh) / 100);
    },
    inequations: function(niv){
      var a = rnd(2, 9), x = rnd(2, 12), b = rnd(1, 15);
      if(niv === 1) return numQ('Résous : x + ' + b + ' > ' + (x + b) + '. La solution est x > ?', x);
      if(niv === 2) return numQ('Résous : ' + a + 'x < ' + (a * x) + '. La solution est x < ?', x);
      return numQ('Résous : ' + a + 'x \u2212 ' + b + ' \u2265 ' + (a * x - b) + '. La solution est x \u2265 ?', x);
    }
  };
  // centièmes → chaîne française ("1,2")
  function fr10c(nHundredths){ return (nHundredths / 100).toLocaleString('fr-FR'); }

  // ═════════════════════════════════════════════════════════
  //  PROGRAMMES : compétences affichées par classe
  // ═════════════════════════════════════════════════════════
  var PROGRAMMES = {
    gs: {
      label: 'Grande Section', temps: 45, gens: GEN_GS,
      comps: [
        { key: 'compter',       nom: 'Compter',           ico: '🔢' },
        { key: 'petitscalculs', nom: 'Petits calculs',    ico: '➕' },
        { key: 'comparer',      nom: 'Plus ou moins',     ico: '⚖️' },
        { key: 'suites',        nom: 'Avant / après',     ico: '➡️' },
        { key: 'formes',        nom: 'Les formes',        ico: '🔷' },
        { key: 'couleurs',      nom: 'Les couleurs',      ico: '🎨' }
      ]
    },
    ce1: {
      label: 'CE1', temps: 20, gens: GEN_CE1,
      comps: [
        { key: 'addition',       nom: 'Addition',          ico: '➕' },
        { key: 'soustraction',   nom: 'Soustraction',      ico: '➖' },
        { key: 'multiplication', nom: 'Multiplication',    ico: '✖️' },
        { key: 'doubles',        nom: 'Doubles & moitiés', ico: '🪞' },
        { key: 'problemes',      nom: 'Petits problèmes',  ico: '🧩' },
        { key: 'geometrie',      nom: 'Géométrie',         ico: '📐' }
      ]
    },
    cm2: {
      label: 'CM2', temps: 25, gens: GEN_CM2,
      comps: [
        { key: 'grandsnombres',  nom: 'Grands nombres',    ico: '🔢' },
        { key: 'multiplication', nom: 'Multiplication',    ico: '✖️' },
        { key: 'division',       nom: 'Division',          ico: '➗' },
        { key: 'fractions',      nom: 'Fractions',         ico: '🍕' },
        { key: 'decimaux',       nom: 'Nombres décimaux',  ico: '🔟' },
        { key: 'mesures',        nom: 'Mesures & problèmes', ico: '📏' }
      ]
    },
    sixieme: {
      label: '6e', temps: 25, gens: GEN_6E,
      comps: [
        { key: 'fractions',        nom: 'Fractions',        ico: '🍕' },
        { key: 'decimaux',         nom: 'Décimaux',         ico: '🔟' },
        { key: 'proportionnalite', nom: 'Proportionnalité', ico: '⚖️' },
        { key: 'perimetres',       nom: 'Périmètres & aires', ico: '📐' },
        { key: 'divisibilite',     nom: 'Divisibilité',     ico: '➗' },
        { key: 'calculmental',     nom: 'Calcul & priorités', ico: '🧠' }
      ]
    },
    quatrieme: {
      label: '4e', temps: 30, gens: GEN_4E,
      comps: [
        { key: 'relatifs',     nom: 'Nombres relatifs',  ico: '🌡️' },
        { key: 'puissances',   nom: 'Puissances',        ico: '⚡' },
        { key: 'litteral',     nom: 'Calcul littéral',   ico: '🔤' },
        { key: 'fractions',    nom: 'Fractions',         ico: '🍕' },
        { key: 'pythagore',    nom: 'Pythagore',         ico: '📐' },
        { key: 'pourcentages', nom: 'Pourcentages',      ico: '💯' }
      ]
    },
    seconde: {
      label: 'Seconde', temps: 35, gens: GEN_2NDE,
      comps: [
        { key: 'numerique',    nom: 'Calcul numérique',      ico: '🧮' },
        { key: 'algebrique',   nom: 'Développer / factoriser', ico: '🔤' },
        { key: 'equations',    nom: 'Équations',             ico: '⚖️' },
        { key: 'fonctions',    nom: 'Fonctions',             ico: '📈' },
        { key: 'pourcentages', nom: 'Pourcentages & évolutions', ico: '💯' },
        { key: 'inequations',  nom: 'Inéquations',           ico: '↔️' }
      ]
    }
  };

  // ═════════════════════════════════════════════════════════
  //  API PUBLIQUE
  // ═════════════════════════════════════════════════════════
  function programme(classe){ return PROGRAMMES[classe] || PROGRAMMES.ce1; }

  function buildMission(classe, compKey, niveau, nb){
    nb = nb || 10;
    var gens = programme(classe).gens;
    var out = [], seen = {}, guard = 0;
    while(out.length < nb && guard < 400){
      guard++;
      var q = gens[compKey](niveau);
      if(!seen[q.q + q.choices.join('|')]){ seen[q.q + q.choices.join('|')] = true; out.push(q); }
    }
    return out;
  }

  function buildDaily(classe, levels, nb){
    nb = nb || 10;
    var prog = programme(classe);
    var keys = prog.comps.map(function(c){ return c.key; });
    var out = [], seen = {}, guard = 0;
    while(out.length < nb && guard < 400){
      guard++;
      var k = pick(keys);
      var q = prog.gens[k]((levels && levels[k]) || 1);
      if(!seen[q.q + q.choices.join('|')]){ seen[q.q + q.choices.join('|')] = true; out.push(q); }
    }
    return out;
  }

  return { programme: programme, buildMission: buildMission, buildDaily: buildDaily, CLASSES: Object.keys(PROGRAMMES) };
})();

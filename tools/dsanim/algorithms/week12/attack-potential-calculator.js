// CEN429 — Week 12 — Demo 2 (code/week-12/02-attack-potential/attack_potential.c: compute_score(), rating()).
// Five factors (elapsed time, expertise, knowledge of the TOE, window of opportunity, equipment) are summed
// and mapped to a resistance rating through rating()'s threshold chain — byte-identical to the real file.
(function (D) {
  'use strict';
  var T = D.T;

  var C = [
    'static const int ELAPSED_TIME[] = {0, 4, 10, 19};',
    'static const int EXPERTISE[]    = {0, 3, 6, 8};',
    'static const int KNOWLEDGE[]    = {0, 3, 7, 11};',
    'static const int OPPORTUNITY[]  = {0, 4, 10};',
    'static const int EQUIPMENT[]    = {0, 4, 7};',
    '',
    'static int compute_score(int t, int e, int k, int w, int q)',
    '{',
    '    return ELAPSED_TIME[t] + EXPERTISE[e] + KNOWLEDGE[k] + OPPORTUNITY[w] + EQUIPMENT[q];',
    '}',
    '',
    'static const char *rating(int p)',
    '{',
    '    if (p <= 9)  return "BASIC";',
    '    if (p <= 13) return "MODERATE";',
    '    if (p <= 19) return "HIGH";',
    '    if (p <= 24) return "VERY HIGH";',
    '    return "BEYOND";',
    '}'
  ];

  var FACTOR_NAMES = [T('Geçen süre', 'Elapsed time'), T('Uzmanlık', 'Expertise'), T('Hedef bilgisi', 'Knowledge of TOE'),
                       T('Fırsat', 'Opportunity'), T('Ekipman', 'Equipment')];
  var TABLES = [[0, 4, 10, 19], [0, 3, 6, 8], [0, 3, 7, 11], [0, 4, 10], [0, 4, 7]];

  function ratingWord(p) {
    if (p <= 9) return 'BASIC';
    if (p <= 13) return 'MODERATE';
    if (p <= 19) return 'HIGH';
    if (p <= 24) return 'VERY HIGH';
    return 'BEYOND';
  }

  /** levels: [t, e, k, w, q] indices into TABLES. */
  function mk(levels) { return { levels: levels.slice() }; }

  /** Independent: a plain loop-sum over TABLES (never calls compute_score/rating from build()). */
  function reference(data) {
    var sum = 0;
    for (var i = 0; i < 5; i++) sum += TABLES[i][data.levels[i]];
    var band;
    if (sum < 10) band = 'BASIC';
    else if (sum < 14) band = 'MODERATE';
    else if (sum < 20) band = 'HIGH';
    else if (sum < 25) band = 'VERY HIGH';
    else band = 'BEYOND';
    return { score: sum, rating: band };
  }

  function build(S, data) {
    var W = 190, H = 30, GAP = 6;
    for (var i = 0; i < 5; i++) {
      S.box('f' + i, { x: 0, y: i * (H + GAP), w: W, h: H, size: 12, text: FACTOR_NAMES[i], style: 'normal' });
      S.box('v' + i, { x: W + 10, y: i * (H + GAP), w: 60, h: H, size: 13, text: String(TABLES[i][data.levels[i]]), style: 'dim' });
    }
    S.step(T('Beş faktörün seviyeleri seçildi; her biri kendi tablosundan bir puana karşılık gelir.',
              'The five factors\' levels are chosen; each maps to a point from its own table.'), { c: [1, 2, 3, 4, 5] });

    var running = 0;
    for (i = 0; i < 5; i++) {
      S.at(i);
      S.set('v' + i, { style: 'hl' });
      running += TABLES[i][data.levels[i]];
      S.step(T('`' + FACTOR_NAMES[i].tr + '` seviye ' + data.levels[i] + ' -> ' + TABLES[i][data.levels[i]] + ' puan; ara toplam = ' + running + '.',
                '`' + FACTOR_NAMES[i].en + '` level ' + data.levels[i] + ' -> ' + TABLES[i][data.levels[i]] + ' points; running total = ' + running + '.'),
             { c: [{ n: 9, note: T('return sum of the five table lookups (satır ' + (i + 1) + '/5 eklendi)', 'return sum of the five table lookups (term ' + (i + 1) + '/5 added)') }] });
      S.set('v' + i, { style: 'new' });
    }
    S.at(null);
    var score = running;
    S.box('total', { x: 0, y: 5 * (H + GAP) + 10, w: 260, h: 36, size: 15, text: T('Toplam puan = ', 'Total score = ').tr + score, style: 'active' });
    S.set('total', { text: T('Toplam = ', 'Total = ').en + score });

    // Each threshold's condition AND its return share one line (14=BASIC/<=9, 15=MODERATE/<=13,
    // 16=HIGH/<=19, 17=VERY HIGH/<=24, 18=BEYOND/unconditional) -- build the guard-chain program
    // counter the same way rasp-pipeline.js's declineLines() does: every earlier threshold is
    // evaluated (and found false, with a note) before the one that fires; everything after it is
    // never reached (skip:true), since the line that fires returns immediately.
    var band = ratingWord(score);
    var THRESH = [9, 13, 19, 24];
    var lines = [];
    var fired = false;
    for (var t = 0; t < 4; t++) {
      var yes = score <= THRESH[t];
      lines.push({ n: 14 + t, note: T('p(' + score + ') <= ' + THRESH[t] + '? ' + (yes ? 'evet' : 'hayır'), 'p(' + score + ') <= ' + THRESH[t] + '? ' + (yes ? 'yes' : 'no')) });
      if (yes) { fired = true; for (var s = t + 1; s < 4; s++) lines.push({ n: 14 + s, skip: true }); break; }
    }
    if (!fired) lines.push(18);   // BEYOND: falls through to the unconditional final return

    S.box('rating', { x: 280, y: 5 * (H + GAP) + 10, w: 220, h: 36, size: 15, text: band, style: band === 'BASIC' ? 'del' : (band === 'BEYOND' ? 'new' : 'hl') });
    S.step(T('rating(' + score + ') dallanıyor: sonuç = ' + band + '.', 'rating(' + score + ') branches: result = ' + band + '.'), { c: lines });

    S.result = { score: score, rating: band };
    S.step(T(band === 'BASIC' ? 'DÜŞÜK puan = KOLAY saldırı = CİDDİ bulgu.' : (band === 'BEYOND' ? 'Çok yüksek puan = neredeyse imkânsız = düşük öncelikli bulgu.' : 'Orta düzey direnç; CVSS ile birlikte önceliklendirilir.'),
              band === 'BASIC' ? 'LOW score = EASY attack = SERIOUS finding.' : (band === 'BEYOND' ? 'A very high score = nearly impossible = a low-priority finding.' : 'Moderate resistance; prioritized together with CVSS.')), {});
  }

  D.define({
    id: 'attack-potential-calculator',
    title: T('Saldırı potansiyeli hesaplayıcı: 5 faktör → toplam → derece (attack_potential.c)', 'Attack potential calculator: 5 factors → total → rating (attack_potential.c)'),
    code: { c: C },
    minSize: 5,
    presets: [
      { id: 'normal-license-unprotected', level: 'normal', small: true, name: T('Normal: lisans denetimi, korumasız -> BASIC (puan 3)', 'Normal: license check, unprotected -> BASIC (score 3)'), data: mk([0, 1, 0, 0, 0]) },
      { id: 'hard-license-protected', level: 'hard', small: true, name: T('Zor: aynı denetim, 9. hafta korumalarıyla -> HIGH (puan 17)', 'Hard: the same check, with the Week 9 protections -> HIGH (score 17)'), data: mk([1, 2, 1, 1, 0]) },
      { id: 'edge-all-zero', level: 'edge', small: true, name: T('Uç durum: bütün faktörler seviye 0 -> en düşük puan', 'Edge case: every factor at level 0 -> the lowest possible score'), data: mk([0, 0, 0, 0, 0]) },
      { id: 'edge-secure-element', level: 'edge', small: true, name: T('Uç durum: güvenli öğe çıkarma, bütün faktörler en üst seviye -> BEYOND (puan 55)', 'Edge case: secure-element extraction, every factor at its top level -> BEYOND (score 55)'), data: mk([3, 3, 3, 2, 2]) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function () { return 5; },
    random: function (level, r) {
      var maxLevel = { easy: 1, normal: 2, hard: 3, extreme: 3 }[level] || 1;
      return mk([D.randInt(r, 0, maxLevel > 3 ? 3 : maxLevel), D.randInt(r, 0, maxLevel > 3 ? 3 : maxLevel),
                 D.randInt(r, 0, maxLevel > 3 ? 3 : maxLevel), D.randInt(r, 0, Math.min(maxLevel, 2)), D.randInt(r, 0, Math.min(maxLevel, 2))]);
    },
    input: {
      hint: T('süre uzmanlık bilgi fırsat ekipman (indeks, 0..3/0..3/0..3/0..2/0..2)', 'time expertise knowledge opportunity equipment (index, 0..3/0..3/0..3/0..2/0..2)'),
      format: function (data) { return data.levels.join(' '); },
      tokens: function () { return FACTOR_NAMES; },
      parse: function (text) {
        var parts = String(text).trim().split(/\s+/);
        if (parts.length !== 5) throw T('Tam olarak 5 sayı girin (süre uzmanlık bilgi fırsat ekipman).', 'Enter exactly 5 numbers (time expertise knowledge opportunity equipment).');
        var maxIdx = [3, 3, 3, 2, 2], levels = [];
        for (var i = 0; i < 5; i++) {
          if (!/^\d+$/.test(parts[i])) throw T('"' + parts[i] + '" bir tam sayı değil.', '"' + parts[i] + '" is not a whole number.');
          var v = parseInt(parts[i], 10);
          if (v > maxIdx[i]) throw T('Faktör ' + (i + 1) + ' en çok ' + maxIdx[i] + ' olabilir.', 'Factor ' + (i + 1) + ' can be at most ' + maxIdx[i] + '.');
          levels.push(v);
        }
        return mk(levels);
      },
      bad: ['', '1 2 3', '0 0 0 0 x', '9 0 0 0 0', '0 0 0 9 0']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));

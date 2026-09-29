// CEN429 — Week 12 — the SAME finding scored two ways (docs/week-12 section 5): a simplified,
// teaching-only CVSS-style impact/exploitability score (NOT the official CVSS formula — see
// first.org/cvss for that) next to the attack-potential score reused from
// code/week-12/02-attack-potential/attack_potential.c. High impact does not always mean high urgency:
// the two scores can disagree, and the report's priority (section 8) comes from BOTH together.
(function (D) {
  'use strict';
  var T = D.T;

  var AP_TABLES = [[0, 4, 10, 19], [0, 3, 6, 8], [0, 3, 7, 11], [0, 4, 10], [0, 4, 7]];
  var AP_NAMES = [T('Geçen süre', 'Elapsed time'), T('Uzmanlık', 'Expertise'), T('Hedef bilgisi', 'Knowledge'),
                  T('Fırsat', 'Opportunity'), T('Ekipman', 'Equipment')];
  // Simplified, teaching-only CVSS-style sub-scores (weights are a classroom simplification).
  var CVSS_NAMES = [T('Saldırı vektörü (AV)', 'Attack vector (AV)'), T('Saldırı karmaşıklığı (AC)', 'Attack complexity (AC)'),
                     T('Gerekli yetki (PR)', 'Privileges required (PR)'), T('Kullanıcı etkileşimi (UI)', 'User interaction (UI)'),
                     T('Etki (C/I/A)', 'Impact (C/I/A)')];
  var CVSS_TABLES = [[2, 1, 0], [1, 0], [2, 1, 0], [1, 0], [0, 1, 2, 3]];
  var CVSS_WEIGHT = [1, 1, 1, 1, 2];

  var C = [
    '/* teaching-only CVSS-style sub-score, weighted sum, NOT the official CVSS formula */',
    'static int cvss_lite(int av, int ac, int pr, int ui, int impact)',
    '{',
    '    return av + ac + pr + ui + impact * 2;',
    '}',
    '',
    'static const char *cvss_band(int c)',
    '{',
    '    if (c <= 2)  return "LOW";',
    '    if (c <= 5)  return "MEDIUM";',
    '    if (c <= 8)  return "HIGH";',
    '    return "CRITICAL";',
    '}',
    '',
    '/* attack_potential.c: the same 5-factor sum used in the attack-potential-calculator animation */',
    'static int compute_score(int t, int e, int k, int w, int q)',
    '{',
    '    return ELAPSED_TIME[t] + EXPERTISE[e] + KNOWLEDGE[k] + OPPORTUNITY[w] + EQUIPMENT[q];',
    '}'
  ];

  function cvssScore(levels) {
    var av = CVSS_TABLES[0][levels[0]], ac = CVSS_TABLES[1][levels[1]], pr = CVSS_TABLES[2][levels[2]],
        ui = CVSS_TABLES[3][levels[3]], impact = CVSS_TABLES[4][levels[4]];
    return av + ac + pr + ui + impact * CVSS_WEIGHT[4];
  }
  function cvssBand(c) {
    if (c <= 2) return 'LOW';
    if (c <= 5) return 'MEDIUM';
    if (c <= 8) return 'HIGH';
    return 'CRITICAL';
  }
  function apScore(levels) {
    var sum = 0;
    for (var i = 0; i < 5; i++) sum += AP_TABLES[i][levels[i]];
    return sum;
  }
  function apBand(p) {
    if (p <= 9) return 'BASIC';
    if (p <= 13) return 'MODERATE';
    if (p <= 19) return 'HIGH';
    if (p <= 24) return 'VERY HIGH';
    return 'BEYOND';
  }
  /** priority: the 2-axis matrix from docs/week-12 section 8 (urgent/high/medium/low). */
  function priority(cBand, apBandVal) {
    var easyAp = apBandVal === 'BASIC' || apBandVal === 'MODERATE';
    var hardAp = apBandVal === 'HIGH' || apBandVal === 'VERY HIGH';
    var bigC = cBand === 'CRITICAL' || cBand === 'HIGH';
    var medC = cBand === 'MEDIUM';
    if (bigC && easyAp) return 'URGENT';
    if (bigC && hardAp) return 'HIGH';
    if (bigC) return 'MEDIUM';
    if (medC && easyAp) return 'HIGH';
    if (medC) return 'MEDIUM';
    if (easyAp) return 'MEDIUM';
    return 'LOW';
  }

  /** cvssLevels: [av, ac, pr, ui, impact] indices. apLevels: [t, e, k, w, q] indices. */
  function mk(cvssLevels, apLevels) { return { cvssLevels: cvssLevels.slice(), apLevels: apLevels.slice() }; }

  function reference(data) {
    var c = cvssScore(data.cvssLevels), a = apScore(data.apLevels);
    var cb = cvssBand(c), ab = apBand(a);
    return { cvss: c, cvssBand: cb, attackPotential: a, apBand: ab, priority: priority(cb, ab) };
  }

  function build(S, data) {
    var c = cvssScore(data.cvssLevels), a = apScore(data.apLevels);
    var cb = cvssBand(c), ab = apBand(a);

    var W = 190, H = 26, GAP = 5;
    for (var i = 0; i < 5; i++) S.box('c' + i, { x: 0, y: i * (H + GAP), w: W, h: H, size: 11, text: CVSS_NAMES[i], style: 'normal' });
    S.label('cvssLbl', { x: 0, y: -16, text: T('CVSS-benzeri (basitleştirilmiş)', 'CVSS-style (simplified)'), anchor: 'start', bold: true, size: 14 });
    S.step(T('Aynı bulgu, iki eksende değerlendiriliyor. Önce CVSS-benzeri (basitleştirilmiş, öğretim amaçlı) etki puanı.',
              'The same finding is assessed on two axes. First, a simplified, teaching-only CVSS-style impact score.'), { c: [1, 2, 3, 4] });
    S.at(0);
    S.step(T('cvss_lite() = AV+AC+PR+UI+etki*2 = ' + c + ' -> ' + cb + '.', 'cvss_lite() = AV+AC+PR+UI+impact*2 = ' + c + ' -> ' + cb + '.'),
           { c: [2, 3, { n: 8, note: T('c(' + c + ') <= 2? ' + (c <= 2 ? 'evet' : 'hayır'), 'c(' + c + ') <= 2? ' + (c <= 2 ? 'yes' : 'no')) }] });
    S.box('cvssResult', { x: 0, y: 5 * (H + GAP) + 6, w: 220, h: 32, size: 14, text: cb + ' (' + c + ')', style: cb === 'CRITICAL' || cb === 'HIGH' ? 'del' : 'dim' });

    var DX = 280;
    for (i = 0; i < 5; i++) S.box('a' + i, { x: DX, y: i * (H + GAP), w: W, h: H, size: 11, text: AP_NAMES[i], style: 'normal' });
    S.label('apLbl', { x: DX, y: -16, text: T('Saldırı potansiyeli (attack_potential.c)', 'Attack potential (attack_potential.c)'), anchor: 'start', bold: true, size: 14 });
    S.at(1);
    S.step(T('Şimdi AYNI bulgu, saldırı potansiyeliyle (5 faktör, gerçek demo kodu) puanlanıyor: ' + a + ' -> ' + ab + '.',
              'Now the SAME finding is scored with attack potential (5 factors, the real demo code): ' + a + ' -> ' + ab + '.'),
           { c: [15, 16] });
    S.box('apResult', { x: DX, y: 5 * (H + GAP) + 6, w: 220, h: 32, size: 14, text: ab + ' (' + a + ')', style: ab === 'BASIC' || ab === 'MODERATE' ? 'del' : 'new' });
    S.at(null);

    var pr = priority(cb, ab);
    S.box('priority', { x: 140, y: 6 * (H + GAP) + 50, w: 280, h: 40, size: 16, text: pr, style: pr === 'URGENT' ? 'del' : (pr === 'HIGH' ? 'hl' : (pr === 'MEDIUM' ? 'active' : 'dim')) });
    S.arrow('pa1', { from: 'cvssResult', to: 'priority', kind: 'center', head: false });
    S.arrow('pa2', { from: 'apResult', to: 'priority', kind: 'center', head: false });
    S.step(T('İkisi birlikte önceliği belirler: CVSS ' + cb + ' + saldırı pot. ' + ab + ' -> öncelik ' + pr + '.',
              'Together they set the priority: CVSS ' + cb + ' + attack potential ' + ab + ' -> priority ' + pr + '.'), {});

    S.result = { cvss: c, cvssBand: cb, attackPotential: a, apBand: ab, priority: pr };
    S.step(T(cb === 'HIGH' || cb === 'CRITICAL'
             ? (ab === 'BEYOND' || ab === 'VERY HIGH' ? 'Etki büyük ama saldırı zor: acil değil, izlenir.' : 'Etki büyük VE saldırı kolay: bu, önce kapatılacak bulgu.')
             : 'Etki sınırlı: öncelik saldırı potansiyeline göre belirlenir.',
              cb === 'HIGH' || cb === 'CRITICAL'
             ? (ab === 'BEYOND' || ab === 'VERY HIGH' ? 'Impact is large but the attack is hard: not urgent, just monitored.' : 'Impact is large AND the attack is easy: this is the finding to close first.')
             : 'Impact is limited: priority is set by the attack potential.'), {});
  }

  D.define({
    id: 'cvss-vs-attack-potential',
    title: T('Aynı bulgu, iki puan: CVSS-benzeri ve saldırı potansiyeli', 'The same finding, two scores: CVSS-style and attack potential'),
    code: { c: C },
    minSize: 10,
    presets: [
      { id: 'normal-agree', level: 'normal', name: T('Normal: yüksek etki + kolay saldırı -> ACİL', 'Normal: high impact + easy attack -> URGENT'), data: mk([2, 1, 2, 1, 3], [0, 1, 0, 0, 0]) },
      { id: 'hard-disagree', level: 'hard', name: T('Zor: yüksek etki ama çok zor saldırı -> izlenir, acil değil', 'Hard: high impact but a very hard attack -> monitored, not urgent'), data: mk([2, 1, 2, 1, 3], [3, 3, 3, 2, 2]) },
      { id: 'edge-lowest', level: 'edge', name: T('Uç durum: her iki eksende de en düşük puan', 'Edge case: the lowest score on both axes'), data: mk([0, 0, 0, 0, 0], [0, 0, 0, 0, 0]) },
      { id: 'edge-highest', level: 'edge', name: T('Uç durum: her iki eksende de en yüksek puan', 'Edge case: the highest score on both axes'), data: mk([2, 1, 2, 1, 3], [3, 3, 3, 2, 2]) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function () { return 10; },
    random: function (level, r) {
      var capAp = { easy: 1, normal: 2, hard: 3, extreme: 3 }[level] || 1;
      var capCvss = { easy: 1, normal: 2, hard: 2, extreme: 3 }[level] || 1;
      return mk(
        [D.randInt(r, 0, Math.min(capCvss, 2)), D.randInt(r, 0, 1), D.randInt(r, 0, Math.min(capCvss, 2)), D.randInt(r, 0, 1), D.randInt(r, 0, Math.min(capCvss + 1, 3))],
        [D.randInt(r, 0, capAp), D.randInt(r, 0, capAp), D.randInt(r, 0, capAp), D.randInt(r, 0, Math.min(capAp, 2)), D.randInt(r, 0, Math.min(capAp, 2))]
      );
    },
    input: {
      hint: T('cvss=AV,AC,PR,UI,etki ap=süre,uzmanlık,bilgi,fırsat,ekipman', 'cvss=AV,AC,PR,UI,impact ap=time,expertise,knowledge,opportunity,equipment'),
      format: function (data) { return 'cvss=' + data.cvssLevels.join(',') + ' ap=' + data.apLevels.join(','); },
      tokens: function () { return CVSS_NAMES.concat(AP_NAMES); },
      parse: function (text) {
        var m = String(text).trim().match(/^cvss=([\d,]+)\s+ap=([\d,]+)$/i);
        if (!m) throw T('Biçim: "cvss=a,b,c,d,e ap=a,b,c,d,e" olmalı.', 'Format must be "cvss=a,b,c,d,e ap=a,b,c,d,e".');
        var cvssParts = m[1].split(','), apParts = m[2].split(',');
        if (cvssParts.length !== 5 || apParts.length !== 5) throw T('Her grupta tam olarak 5 sayı olmalı.', 'Each group must have exactly 5 numbers.');
        var cvssMax = [2, 1, 2, 1, 3], apMax = [3, 3, 3, 2, 2];
        var cvssLevels = cvssParts.map(function (t, i) {
          var v = parseInt(t, 10);
          if (!/^\d+$/.test(t) || v > cvssMax[i]) throw T('cvss[' + i + '] en çok ' + cvssMax[i] + ' olabilir.', 'cvss[' + i + '] can be at most ' + cvssMax[i] + '.');
          return v;
        });
        var apLevels = apParts.map(function (t, i) {
          var v = parseInt(t, 10);
          if (!/^\d+$/.test(t) || v > apMax[i]) throw T('ap[' + i + '] en çok ' + apMax[i] + ' olabilir.', 'ap[' + i + '] can be at most ' + apMax[i] + '.');
          return v;
        });
        return mk(cvssLevels, apLevels);
      },
      bad: ['', 'cvss=1,1,1,1,1', 'cvss=1,1,1,1,1 ap=0,0,0,0', 'cvss=9,0,0,0,0 ap=0,0,0,0,0', 'cvss=x,0,0,0,0 ap=0,0,0,0,0']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));

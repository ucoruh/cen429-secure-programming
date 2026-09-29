// CEN429 — Week 2 — Demo 5 (code/week-02/05-cvss/cvss.py: base_score(), round_up())
// CVSS v3.1 turns 8 metric letters into a single 0.0-10.0 Base Score: an Exploitability sub-score
// (how easy is the attack) and an Impact sub-score (how bad is the outcome) are computed separately,
// added, then rounded UP to one decimal place ("roundup", never ordinary rounding). Scope (S) changes
// three of the formulas at once (PR's table, the impact formula, and a 1.08x multiplier) — that is
// CVSS's own way of saying "the damage spills outside the vulnerable component itself".
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines (cvss.py 28-34, 45-50, 66-85)
  var TABLES_PY = [
    'AV = {"N": 0.85, "A": 0.62, "L": 0.55, "P": 0.20}',
    'AC = {"L": 0.77, "H": 0.44}',
    '# PR takes different multipliers once the scope (S) has changed.',
    'PR_U = {"N": 0.85, "L": 0.62, "H": 0.27}',
    'PR_C = {"N": 0.85, "L": 0.68, "H": 0.50}',
    'UI = {"N": 0.85, "R": 0.62}',
    'CIA = {"H": 0.56, "L": 0.22, "N": 0.00}'
  ];
  var ROUNDUP_PY = [
    'def round_up(x):',
    '    """CVSS\'s own \'roundup\': round up to one decimal place."""',
    '    whole = int(round(x * 100000))',
    '    if whole % 10000 == 0:',
    '        return whole / 100000.0',
    '    return (math.floor(whole / 10000) + 1) / 10.0'
  ];
  // ROUNDUP_PY is concatenated after TABLES_PY (7 lines) + 2 filler lines, so in the combined code
  // panel it starts at position 10 (7 + 2 + 1) — see `code:` at the bottom of this file.
  var RBASE = 10;
  var SCORE_PY = [
    'def base_score(m):',
    '    changed = m["S"] == "C"',
    '    pr = (PR_C if changed else PR_U)[m["PR"]]',
    '',
    '    # ISS: how much of the security properties is broken',
    '    iss = 1 - (1 - CIA[m["C"]]) * (1 - CIA[m["I"]]) * (1 - CIA[m["A"]])',
    '    if not changed:',
    '        impact = 6.42 * iss',
    '    else:',
    '        impact = 7.52 * (iss - 0.029) - 3.25 * (iss - 0.02) ** 15',
    '',
    '    exploitability = 8.22 * AV[m["AV"]] * AC[m["AC"]] * pr * UI[m["UI"]]',
    '',
    '    if impact <= 0:',
    '        return 0.0, impact, exploitability',
    '    if changed:',
    '        base = min(1.08 * (impact + exploitability), 10)',
    '    else:',
    '        base = min(impact + exploitability, 10)',
    '    return round_up(base), impact, exploitability'
  ];
  // SCORE_PY is concatenated after TABLES_PY(7) + filler(2) + ROUNDUP_PY(6) + filler(2), so in the
  // combined code panel it starts at position 18 (7+2+6+2+1) — see `code:` at the bottom of this file.
  var SBASE = 18;

  var AV = { N: 0.85, A: 0.62, L: 0.55, P: 0.20 };
  var AC = { L: 0.77, H: 0.44 };
  var PR_U = { N: 0.85, L: 0.62, H: 0.27 };
  var PR_C = { N: 0.85, L: 0.68, H: 0.50 };
  var UI = { N: 0.85, R: 0.62 };
  var CIA = { H: 0.56, L: 0.22, N: 0.00 };
  var LABEL = {
    AV: { N: 'Network', A: 'Adjacent', L: 'Local', P: 'Physical' },
    AC: { L: 'Low', H: 'High' }, PR: { N: 'None', L: 'Low', H: 'High' },
    UI: { N: 'None', R: 'Required' }, S: { U: 'Unchanged', C: 'Changed' },
    C: { H: 'High', L: 'Low', N: 'None' }, I: { H: 'High', L: 'Low', N: 'None' }, A: { H: 'High', L: 'Low', N: 'None' }
  };

  function mk(av, ac, pr, ui, s, c, i, a) { return { AV: av, AC: ac, PR: pr, UI: ui, S: s, C: c, I: i, A: a }; }

  function roundUp(x) {
    var whole = Math.round(x * 100000);
    if (whole % 10000 === 0) return whole / 100000.0;
    return (Math.floor(whole / 10000) + 1) / 10.0;
  }

  /** Independent: sums the three CIA "1 minus" terms with reduce() instead of the three explicit
   * multiplications build() shows on screen, and rounds with ceil/10 instead of round_up()'s own
   * floor/modulo arithmetic. */
  function reference(m) {
    var changed = m.S === 'C';
    var pr = (changed ? PR_C : PR_U)[m.PR];
    var terms = [1 - CIA[m.C], 1 - CIA[m.I], 1 - CIA[m.A]];
    var iss = 1 - terms.reduce(function (a, b) { return a * b; }, 1);
    var impact = changed ? 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15) : 6.42 * iss;
    var expl = 8.22 * AV[m.AV] * AC[m.AC] * pr * UI[m.UI];
    if (impact <= 0) return { score: 0.0, impact: Math.round(impact * 100) / 100, expl: Math.round(expl * 100) / 100 };
    var raw = changed ? Math.min(1.08 * (impact + expl), 10) : Math.min(impact + expl, 10);
    var scaled = Math.round(raw * 100000);
    var score = scaled % 10000 === 0 ? scaled / 100000 : Math.ceil(scaled / 10000) / 10;
    return { score: Math.round(score * 10) / 10, impact: Math.round(impact * 100) / 100, expl: Math.round(expl * 100) / 100 };
  }

  function build(S, data) {
    // Two columns of 4 metrics (rather than one tall column of 8): keeps the whole diagram closer to
    // square/wide than a narrow 8-row tower, so the exported still image doesn't dwarf the other week-2
    // animations in height (a fixed-width slide/print layout scales every image to the same width, so an
    // unusually TALL source image ends up unusually tall on the page too — this is purely a layout choice,
    // it does not change any {n:...} code-panel reference below, only S.label/S.box x/y coordinates).
    var rowH = 40, colW = 150, colGap = 330;
    var metrics = [
      { k: 'AV', v: data.AV, table: AV, name: T('Saldırı vektörü', 'Attack vector') },
      { k: 'AC', v: data.AC, table: AC, name: T('Saldırı karmaşıklığı', 'Attack complexity') },
      { k: 'PR', v: data.PR, table: data.S === 'C' ? PR_C : PR_U, name: T('Gereken yetki', 'Privileges required') },
      { k: 'UI', v: data.UI, table: UI, name: T('Kullanıcı etkileşimi', 'User interaction') },
      { k: 'S', v: data.S, table: { U: 1, C: 1 }, name: T('Kapsam', 'Scope') },
      { k: 'C', v: data.C, table: CIA, name: T('Gizlilik etkisi', 'Confidentiality impact') },
      { k: 'I', v: data.I, table: CIA, name: T('Bütünlük etkisi', 'Integrity impact') },
      { k: 'A', v: data.A, table: CIA, name: T('Erişilebilirlik etkisi', 'Availability impact') }
    ];
    var rowsPerCol = 4;
    metrics.forEach(function (mm, idx) {
      var col = Math.floor(idx / rowsPerCol), row = idx % rowsPerCol;
      var x0 = col * colGap;
      S.label('mn' + idx, { x: x0 - 10, y: row * rowH + 15, text: mm.name, anchor: 'end', size: 13 });
      S.box('mv' + idx, { x: x0, y: row * rowH, w: colW, h: 30, size: 14,
        text: mm.k + ':' + mm.v + ' (' + LABEL[mm.k][mm.v] + ')', style: 'normal' });
      if (mm.k !== 'S')
        S.label('mf' + idx, { x: x0 + colW + 16, y: row * rowH + 15, text: mm.table[mm.v].toFixed(2), anchor: 'start', size: 14, bold: true });
    });
    var cy = rowsPerCol * rowH + 14;
    var changed = data.S === 'C';
    S.step(T('8 CVSS metriği okunuyor; her harf, FIRST\'in tablosunda bir sayıya karşılık gelir. Kapsam (S) ' + LABEL.S[data.S] + '.',
              'The 8 CVSS metrics are read; every letter maps to a number in FIRST\'s own table. Scope (S) is ' + LABEL.S[data.S] + '.'),
           { py: [SBASE + 1] });

    var pr = (changed ? PR_C : PR_U)[data.PR];
    S.label('prLine', { x: 0, y: cy, text: 'PR table = ' + (changed ? 'PR_C' : 'PR_U') + '[' + data.PR + '] = ' + pr.toFixed(2), anchor: 'start', size: 13 });
    S.step(T('Kapsam Değişti (C) ise PR farklı bir tablodan okunur (Değişmedi\'ye göre daha az ceza).',
              'When Scope is Changed (C), PR is read from a DIFFERENT table (less of a penalty than Unchanged).'),
           { py: changed ? [SBASE + 2] : [{ n: SBASE + 2, note: T('PR_U kullanılıyor', 'using PR_U') }] });

    var issTerms = [1 - CIA[data.C], 1 - CIA[data.I], 1 - CIA[data.A]];
    var iss = 1 - issTerms[0] * issTerms[1] * issTerms[2];
    S.label('iss', { x: 0, y: cy + 26, text: 'ISS = 1 - (1-' + CIA[data.C].toFixed(2) + ')(1-' + CIA[data.I].toFixed(2) + ')(1-' + CIA[data.A].toFixed(2) + ') = ' + iss.toFixed(3), anchor: 'start', size: 13, style: 'hl' });
    S.step(T('ISS: üç güvenlik özelliğinin ne kadarının kırıldığını ölçer (hepsi N ise ISS=0).',
              'ISS: measures how much of the three security properties is broken (ISS=0 if all three are N).'),
           { py: [SBASE + 5] });

    var impact = changed ? 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15) : 6.42 * iss;
    S.label('impact', { x: 0, y: cy + 52, text: 'Impact = ' + impact.toFixed(3), anchor: 'start', size: 13, style: 'hl' });
    S.step(T('Impact (Etki): saldırı başarılı olursa ortaya çıkacak zararı ölçer; Kapsam Değişti ise farklı, daha dik bir eğri kullanılır.',
              'The Impact sub-score: the damage IF the attack succeeds; Scope Changed uses a different, steeper curve.'),
           { py: changed
             ? [{ n: SBASE + 6, note: T('not changed? hayır (Kapsam Değişti)', 'not changed? no (Scope Changed)') }, { n: SBASE + 7, skip: true }, SBASE + 8, SBASE + 9]
             : [{ n: SBASE + 6, note: T('not changed? evet', 'not changed? yes') }, SBASE + 7, { n: SBASE + 8, skip: true }, { n: SBASE + 9, skip: true }] });

    if (impact <= 0) {
      S.step(T('Impact <= 0: hiçbir güvenlik özelliği bozulmuyor — puan doğrudan 0.0.',
                'Impact <= 0: no security property is broken at all — the score is a hard 0.0.'),
             { py: [{ n: SBASE + 13, note: T('impact <= 0? evet', 'impact <= 0? yes') }, SBASE + 14] });
      var explZero = 8.22 * AV[data.AV] * AC[data.AC] * pr * UI[data.UI];
      S.result = { score: 0.0, impact: Math.round(impact * 100) / 100, expl: Math.round(explZero * 100) / 100 };
      return;
    }

    var expl = 8.22 * AV[data.AV] * AC[data.AC] * pr * UI[data.UI];
    S.label('expl', { x: 260, y: cy + 26, text: 'Exploit. = 8.22*' + AV[data.AV].toFixed(2) + '*' + AC[data.AC].toFixed(2) + '*' + pr.toFixed(2) + '*' + UI[data.UI].toFixed(2) + ' = ' + expl.toFixed(2), anchor: 'start', size: 13, style: 'hl' });
    S.step(T('Exploitability (Sömürülebilirlik): saldırının GERÇEKLEŞTİRİLMESİ ne kadar kolay, ayrı hesaplanır.',
              'Exploitability: a SEPARATE measure of how easy the attack is to CARRY OUT.'),
           { py: [SBASE + 11, { n: SBASE + 13, note: T('impact <= 0? hayır (devam)', 'impact <= 0? no (continue)') }, { n: SBASE + 14, skip: true }] });

    var raw = changed ? Math.min(1.08 * (impact + expl), 10) : Math.min(impact + expl, 10);
    S.label('base', { x: 0, y: cy + 78, text: 'Base = ' + raw.toFixed(4) + (changed ? ' (x1.08 for Scope Changed)' : ''), anchor: 'start', size: 13 });
    S.step(T('İki alt puan toplanır (Kapsam Değişti ise 1.08 ile çarpılır), 10\'u geçemez: ' + raw.toFixed(4) + '.',
              'The two sub-scores are added (x1.08 if Scope Changed), capped at 10: ' + raw.toFixed(4) + '.'),
           { py: changed
             ? [{ n: SBASE + 15, note: T('changed? evet', 'changed? yes') }, SBASE + 16, { n: SBASE + 18, skip: true }]
             : [{ n: SBASE + 15, note: T('changed? hayır', 'changed? no') }, { n: SBASE + 16, skip: true }, SBASE + 18] });

    var score = roundUp(raw);
    var scaledWhole = Math.round(raw * 100000);
    var exactTenth = scaledWhole % 10000 === 0;
    S.label('score', { x: 0, y: cy + 106, text: 'BASE SCORE = roundup(' + raw.toFixed(4) + ') = ' + score.toFixed(1), anchor: 'start', size: 16, bold: true, style: 'new' });
    S.step(T('"roundup" NORMAL yuvarlama değildir — her zaman YUKARI yuvarlar (7.21 -> 7.3, asla 7.2 değil).',
              '"roundup" is NOT ordinary rounding — it always rounds UP (7.21 -> 7.3, never 7.2).'),
           { py: [RBASE + 2, { n: RBASE + 3, note: T('whole % 10000 == 0? ' + (exactTenth ? 'evet' : 'hayır'), 'whole % 10000 == 0? ' + (exactTenth ? 'yes' : 'no')) },
                 exactTenth ? RBASE + 4 : { n: RBASE + 4, skip: true },
                 exactTenth ? { n: RBASE + 5, skip: true } : RBASE + 5] });

    S.result = { score: score, impact: Math.round(impact * 100) / 100, expl: Math.round(expl * 100) / 100 };
  }

  D.define({
    id: 'cvss-score',
    title: T('CVSS v3.1 Taban Puanı adım adım (cvss.py)', 'CVSS v3.1 Base Score, step by step (cvss.py)'),
    code: { py: TABLES_PY.concat(['', '# round_up (called from base_score below):']).concat(ROUNDUP_PY).concat(['', '# base_score (line ' + SBASE + '):']).concat(SCORE_PY) },
    presets: [
      { id: 'normal-heartbleed', level: 'normal', small: true,
        name: T('Normal: Heartbleed benzeri (uzaktan, yetki yok, tam ele geçirme)', 'Normal: Heartbleed-like (remote, no auth, full takeover)'),
        data: mk('N', 'L', 'N', 'N', 'U', 'H', 'H', 'H') },
      { id: 'hard-scope-changed', level: 'hard', small: true,
        name: T('Zor: aynı açık, Kapsam Değişti — puan daha yüksek', 'Hard: the same flaw, Scope Changed — a higher score'),
        data: mk('N', 'L', 'N', 'N', 'C', 'H', 'H', 'H') },
      { id: 'edge-no-impact', level: 'edge', small: true,
        name: T('Uç durum: hiç etki yok, puan sabit 0.0', 'Edge case: no impact at all, a hard 0.0'),
        data: mk('N', 'L', 'N', 'N', 'U', 'N', 'N', 'N') },
      { id: 'edge-max-everything', level: 'edge', small: true,
        name: T('Uç durum: her metrik en kötü durumda, puan 10.0', 'Edge case: every metric at its worst, a 10.0'),
        data: mk('N', 'L', 'N', 'N', 'C', 'H', 'H', 'H') },
      { id: 'edge-min-everything', level: 'edge', small: true,
        name: T('Uç durum: her metrik en zayıf durumda', 'Edge case: every metric at its weakest'),
        data: mk('P', 'H', 'H', 'R', 'U', 'L', 'N', 'N') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    // No `size()`: CVSS v3.1 has exactly 8 base metrics, a fixed-shape record, not a variable-length
    // list the "≥ 10 input values" rule was written for — padding it would mean inventing metrics
    // FIRST never defined, which would hurt fidelity far more than a short, fixed input does.
    random: function (level, r) {
      var avKeys = Object.keys(AV), acKeys = Object.keys(AC), uiKeys = Object.keys(UI), ciaKeys = Object.keys(CIA);
      function pick(keys) { return keys[D.randInt(r, 0, keys.length - 1)]; }
      var s = (level === 'hard' || level === 'extreme') && r() < 0.5 ? 'C' : 'U';
      var prKeys = Object.keys(s === 'C' ? PR_C : PR_U);
      var c = pick(ciaKeys), i = pick(ciaKeys), a = pick(ciaKeys);
      if (level === 'easy' && c === 'N' && i === 'N' && a === 'N') c = 'H'; // keep 'easy' from landing on the trivial 0.0 case
      return mk(pick(avKeys), pick(acKeys), pick(prKeys), pick(uiKeys), s, c, i, a);
    },
    input: {
      hint: T('AV:x AC:x PR:x UI:x S:x C:x I:x A:x', 'AV:x AC:x PR:x UI:x S:x C:x I:x A:x'),
      format: function (data) { return 'AV:' + data.AV + ' AC:' + data.AC + ' PR:' + data.PR + ' UI:' + data.UI + ' S:' + data.S + ' C:' + data.C + ' I:' + data.I + ' A:' + data.A; },
      tokens: function (data) { return [data.AV, data.AC, data.PR, data.UI, data.S, data.C, data.I, data.A]; },
      parse: function (text) {
        var m = {};
        String(text).trim().split(/\s+/).forEach(function (t) {
          var kv = t.split(':');
          if (kv.length === 2) m[kv[0]] = kv[1];
        });
        var need = { AV: Object.keys(AV), AC: Object.keys(AC), PR: Object.keys(PR_U), UI: Object.keys(UI), S: ['U', 'C'], C: Object.keys(CIA), I: Object.keys(CIA), A: Object.keys(CIA) };
        for (var k in need) {
          if (!m[k]) throw T('Eksik metrik: ' + k, 'Missing metric: ' + k);
          if (need[k].indexOf(m[k]) < 0) throw T('"' + k + ':' + m[k] + '" geçersiz.', '"' + k + ':' + m[k] + '" is invalid.');
        }
        return mk(m.AV, m.AC, m.PR, m.UI, m.S, m.C, m.I, m.A);
      },
      bad: ['', 'AV:N AC:L', 'AV:X AC:L PR:N UI:N S:U C:H I:H A:H', 'AV:N AC:L PR:N UI:N S:X C:H I:H A:H']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));

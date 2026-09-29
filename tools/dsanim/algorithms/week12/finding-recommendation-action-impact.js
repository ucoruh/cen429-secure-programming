// CEN429 — Week 12 — the finding -> recommendation -> action -> closure cycle and its impact-analysis
// question (docs/week-12 section 6): every finding walks the same four stages, then closes as CLOSED
// (the developer's action was verified), ACCEPTED (a documented, accepted residual risk) or NOT-APPLICABLE
// (not a security issue). All finding ids and product names here are synthetic/anonymous.
(function (D) {
  'use strict';
  var T = D.T;

  var C = [
    'static closure_t close_finding(bool evidence_ok, bool developer_acted, bool risk_accepted, bool is_security_issue)',
    '{',
    '    if (!is_security_issue)',
    '        return NOT_APPLICABLE;',
    '    if (developer_acted && evidence_ok)',
    '        return CLOSED;',
    '    if (risk_accepted)',
    '        return ACCEPTED;',
    '    return OPEN;',
    '}'
  ];

  /** findings: [{isSecurityIssue, developerActed, evidenceOk, riskAccepted}, …]. */
  function mk(findings) { return { findings: findings.slice() }; }

  function closureOf(f) {
    if (!f.isSecurityIssue) return 'NOT_APPLICABLE';
    if (f.developerActed && f.evidenceOk) return 'CLOSED';
    if (f.riskAccepted) return 'ACCEPTED';
    return 'OPEN';
  }

  function reference(data) {
    var tally = { CLOSED: 0, ACCEPTED: 0, NOT_APPLICABLE: 0, OPEN: 0 };
    data.findings.forEach(function (f) { tally[closureOf(f)]++; });
    return { tally: tally, total: data.findings.length };
  }

  function build(S, data) {
    var n = data.findings.length;
    var STAGE_X = [0, 210, 420, 630];
    var STAGE_NAMES = [T('Bulgu', 'Finding'), T('Öneri', 'Recommendation'), T('Aksiyon', 'Action'), T('Kapanış', 'Closure')];
    for (var s = 0; s < 4; s++) S.label('h' + s, { x: STAGE_X[s], y: -18, text: STAGE_NAMES[s], anchor: 'start', bold: true, size: 14 });
    S.step(T(n + ' bulgu, aynı dört aşamadan geçiyor: bulgu -> öneri -> aksiyon -> kapanış.',
              n + ' findings go through the same four stages: finding -> recommendation -> action -> closure.'), {});

    var detailed = 0, tally = { CLOSED: 0, ACCEPTED: 0, NOT_APPLICABLE: 0, OPEN: 0 };
    for (var i = 0; i < n; i++) {
      var f = data.findings[i], y = i * 40;
      S.at(i);
      S.box('f' + i, { x: STAGE_X[0], y: y, w: 190, h: 30, size: 11, text: 'F-' + String(i + 1).padStart(2, '0'), style: 'active' });
      S.box('r' + i, { x: STAGE_X[1], y: y, w: 190, h: 30, size: 11, text: T('öneri yazıldı', 'recommendation written'), style: 'dim' });
      var closure = closureOf(f);
      S.box('a' + i, { x: STAGE_X[2], y: y, w: 190, h: 30, size: 11,
                        text: f.developerActed ? T('geliştirici aksiyon aldı', 'developer acted') : T('aksiyon yok', 'no action'),
                        style: f.developerActed ? 'new' : 'dim' });
      S.box('c' + i, { x: STAGE_X[3], y: y, w: 190, h: 30, size: 11, text: closure.replace('_', '-'),
                        style: closure === 'CLOSED' ? 'new' : (closure === 'OPEN' ? 'del' : (closure === 'NOT_APPLICABLE' ? 'dim' : 'hl')) });
      tally[closure]++;
      if (detailed < 4) {
        var lines;
        if (!f.isSecurityIssue) lines = [{ n: 3, note: T('is_security_issue? hayır', 'is_security_issue? no') }, 4];
        else if (f.developerActed && f.evidenceOk) lines = [{ n: 3, skip: true }, { n: 5, note: T('developer_acted && evidence_ok? evet', 'developer_acted && evidence_ok? yes') }, 6];
        else if (f.riskAccepted) lines = [{ n: 3, skip: true }, { n: 5, note: T('developer_acted && evidence_ok? hayır', 'developer_acted && evidence_ok? no') }, { n: 7, note: T('risk_accepted? evet', 'risk_accepted? yes') }, 8];
        else lines = [{ n: 3, skip: true }, { n: 5, note: T('developer_acted && evidence_ok? hayır', 'developer_acted && evidence_ok? no') }, { n: 7, note: T('risk_accepted? hayır', 'risk_accepted? no') }, 9];
        S.step(T('F-' + String(i + 1).padStart(2, '0') + ' dört aşamadan geçti -> kapanış: ' + closure.replace('_', '-') + '.',
                  'F-' + String(i + 1).padStart(2, '0') + ' went through all four stages -> closure: ' + closure.replace('_', '-') + '.'), { c: lines });
        detailed++;
      }
    }
    S.at(null);
    if (n > detailed) {
      S.step(T('Kalan ' + (n - detailed) + ' bulgu da aynı döngüden geçti; sonuçlar aşağıda.',
                'The remaining ' + (n - detailed) + ' finding(s) went through the same cycle; results are below.'), {});
    }

    S.label('tally', { x: STAGE_X[3] + 220, y: (n - 1) * 40 / 2,
                        text: T('kapandı ', 'closed ').tr + tally.CLOSED + ' · ' + T('kabul ', 'accepted ').tr + tally.ACCEPTED +
                              ' · ' + T('etkilenmez ', 'n/a ').tr + tally.NOT_APPLICABLE + ' · ' + T('açık ', 'open ').tr + tally.OPEN,
                        anchor: 'start', size: 12 });
    S.set('tally', { text: 'closed ' + tally.CLOSED + ' · accepted ' + tally.ACCEPTED + ' · n/a ' + tally.NOT_APPLICABLE + ' · open ' + tally.OPEN });

    S.result = { tally: tally, total: n };
    S.step(T(tally.OPEN > 0 ? tally.OPEN + ' bulgu hâlâ AÇIK — kalan risk olarak ya kabul edilmeli ya da kapatılmalı.'
                             : 'Hiçbir bulgu açık kalmadı: her biri kapandı, kabul edildi ya da etkilenmez olarak işaretlendi.',
              tally.OPEN > 0 ? tally.OPEN + ' finding(s) are still OPEN — must either be accepted as residual risk or closed.'
                             : 'No finding is left open: each one was closed, accepted, or marked not-applicable.'), {});
  }

  function f(isSec, acted, evOk, accepted) { return { isSecurityIssue: isSec, developerActed: acted, evidenceOk: evOk, riskAccepted: accepted }; }

  D.define({
    id: 'finding-recommendation-action-impact',
    title: T('Bulgu → öneri → aksiyon → kapanış döngüsü', 'Finding → recommendation → action → closure cycle'),
    code: { c: C },
    presets: [
      { id: 'normal-mostly-closed', level: 'normal', name: T('Normal: çoğu bulgu kapandı, biri kalan risk', 'Normal: most findings closed, one a residual risk'),
        data: mk([f(true, true, true, false), f(true, true, true, false), f(true, true, true, false), f(true, false, false, true),
                  f(true, true, true, false), f(true, true, true, false), f(false, false, false, false), f(true, true, true, false),
                  f(true, true, true, false), f(true, true, true, false)]) },
      { id: 'hard-several-open', level: 'hard', name: T('Zor: birkaç bulgu hâlâ açık (aksiyon henüz yok)', 'Hard: several findings still open (no action yet)'),
        data: mk([f(true, false, false, false), f(true, true, true, false), f(true, false, false, false), f(true, false, false, true),
                  f(true, false, false, false), f(true, true, true, false), f(true, false, false, false), f(true, true, true, false),
                  f(true, false, false, false), f(false, false, false, false), f(true, false, false, false)]) },
      { id: 'edge-all-closed', level: 'edge', name: T('Uç durum: bütün bulgular kapandı', 'Edge case: every finding is closed'),
        data: mk(Array(10).fill(0).map(function () { return f(true, true, true, false); })) },
      { id: 'edge-all-open', level: 'edge', name: T('Uç durum: hiçbir bulgu kapanmadı, kabul edilmedi', 'Edge case: no finding is closed or accepted'),
        data: mk(Array(10).fill(0).map(function () { return f(true, false, false, false); })) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.findings.length; },
    random: function (level, r) {
      var n = { easy: 10, normal: D.randInt(r, 10, 13), hard: D.randInt(r, 11, 14), extreme: D.randInt(r, 13, 16) }[level] || 10;
      // Only the four CANONICAL closure shapes are ever generated (matches parse()'s letter mapping exactly,
      // so parse(format(data)) always round-trips losslessly).
      var CANON = [f(true, true, true, false), f(true, false, false, true), f(false, false, false, false), f(true, false, false, false)];
      var weights = { easy: [0.7, 0.15, 0.1, 0.05], normal: [0.5, 0.2, 0.1, 0.2], hard: [0.25, 0.2, 0.1, 0.45], extreme: [0.15, 0.15, 0.1, 0.6] }[level] || [0.5, 0.2, 0.1, 0.2];
      var arr = [];
      for (var i = 0; i < n; i++) {
        var x = r(), acc = 0, pick = 3;
        for (var k = 0; k < 4; k++) { acc += weights[k]; if (x < acc) { pick = k; break; } }
        arr.push(CANON[pick]);
      }
      return mk(arr);
    },
    input: {
      hint: T('dizi=<harfler> C=kapandı A=kabul N=etkilenmez O=açık (ör. CCANO)', 'sequence=<letters> C=closed A=accepted N=n/a O=open (e.g. CCANO)'),
      format: function (data) {
        return data.findings.map(function (fd) {
          var c = closureOf(fd);
          return c === 'CLOSED' ? 'C' : c === 'ACCEPTED' ? 'A' : c === 'NOT_APPLICABLE' ? 'N' : 'O';
        }).join('');
      },
      tokens: function (data) { return data.findings.map(function (fd, i) { return 'F-' + (i + 1); }); },
      parse: function (text) {
        var s = String(text).trim().toUpperCase();
        if (!/^[CANO]+$/.test(s)) throw T('Biçim: yalnız C, A, N, O harfleri (ör. "CCANO").', 'Format must consist only of the letters C, A, N, O (e.g. "CCANO").');
        if (s.length < 1 || s.length > 30) throw T('Uzunluk 1..30 aralığında olmalı.', 'The length must be in the range 1..30.');
        var arr = s.split('').map(function (ch) {
          if (ch === 'C') return f(true, true, true, false);
          if (ch === 'A') return f(true, false, false, true);
          if (ch === 'N') return f(false, false, false, false);
          return f(true, false, false, false);
        });
        return mk(arr);
      },
      bad: ['', 'CCANX', 'ccan7', String(new Array(40).join('C')), 'C A N O']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));

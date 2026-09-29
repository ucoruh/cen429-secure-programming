// CEN429 — Week 12 — the report's five sections and its production-readiness verdict (docs/week-12
// section 8): executive summary, method & scope, findings, finding-action table, residual risk. The
// findings below are all synthetic/anonymous (F-01, F-02, …); the readiness verdict follows a single rule:
// any OPEN finding rated URGENT blocks production readiness.
(function (D) {
  'use strict';
  var T = D.T;

  var C = [
    'static bool is_ready_for_production(int open_urgent_count)',
    '{',
    '    return open_urgent_count == 0;',
    '}',
    '',
    'int open_urgent = 0;',
    'for (i = 0; i < n; i++)',
    '    if (findings[i].status == OPEN && findings[i].priority == URGENT)',
    '        open_urgent++;'
  ];

  var SECTIONS = [
    T('Yönetici özeti', 'Executive summary'), T('Yöntem ve kapsam', 'Method & scope'),
    T('Bulgular', 'Findings'), T('Bulgu-aksiyon tablosu', 'Finding-action table'), T('Kalan risk', 'Residual risk')
  ];

  /** findings: [{priority: 'urgent'|'high'|'medium'|'low', status: 'open'|'closed'|'accepted'}, …]. */
  function mk(findings) { return { findings: findings.slice() }; }

  function reference(data) {
    var openUrgent = data.findings.filter(function (f) { return f.status === 'open' && f.priority === 'urgent'; }).length;
    var byStatus = { open: 0, closed: 0, accepted: 0 };
    data.findings.forEach(function (f) { byStatus[f.status]++; });
    return { total: data.findings.length, openUrgent: openUrgent, byStatus: byStatus, ready: openUrgent === 0 };
  }

  function build(S, data) {
    var n = data.findings.length;
    for (var s = 0; s < 5; s++) {
      S.box('sec' + s, { x: 0, y: s * 46, w: 240, h: 36, size: 13, text: SECTIONS[s], style: 'active' });
    }
    S.step(T('Rapor beş bölümden oluşuyor; her biri farklı bir okuyucu için yazılır.',
              'The report has five sections; each is written for a different reader.'), {});

    var byStatus = { open: 0, closed: 0, accepted: 0 };
    var openUrgent = 0, detailed = 0;
    for (var i = 0; i < n; i++) {
      var f = data.findings[i];
      S.at(i);
      byStatus[f.status]++;
      if (f.status === 'open' && f.priority === 'urgent') openUrgent++;
      if (detailed < 5) {
        var label = 'F-' + String(i + 1).padStart(2, '0');
        S.box('f' + i, { x: 280, y: 40 * detailed, w: 220, h: 32, size: 11,
                          text: label + ' ' + f.priority.toUpperCase() + '/' + f.status.toUpperCase(),
                          style: f.status === 'open' ? (f.priority === 'urgent' ? 'del' : 'hl') : 'new' });
        S.step(T(label + ': öncelik ' + f.priority.toUpperCase() + ', durum ' + f.status.toUpperCase() + ' -> bulgular bölümüne ve bulgu-aksiyon tablosuna girdi.',
                  label + ': priority ' + f.priority.toUpperCase() + ', status ' + f.status.toUpperCase() + ' -> entered into the findings section and the finding-action table.'),
               { c: f.status === 'open' && f.priority === 'urgent'
                 ? [{ n: 7, note: T('i < n? her bulgu için tekrarlanır', 'i < n? repeats for every finding') }, { n: 8, note: T('OPEN && URGENT? evet', 'OPEN && URGENT? yes') }, 9]
                 : [{ n: 7, note: T('i < n? her bulgu için tekrarlanır', 'i < n? repeats for every finding') }, { n: 8, note: T('OPEN && URGENT? hayır', 'OPEN && URGENT? no') }, { n: 9, skip: true }] });
        detailed++;
      }
    }
    S.at(null);
    if (n > detailed) S.step(T('Kalan ' + (n - detailed) + ' bulgu da aynı kurala göre sınıflandırıldı.', 'The remaining ' + (n - detailed) + ' finding(s) were classified under the same rule.'), {});

    S.box('residual', { x: 0, y: 250, w: 240, h: 36, size: 12, text: T('Kalan risk: ', 'Residual risk: ').tr + byStatus.accepted + T(' kabul edilmiş', ' accepted').tr, style: byStatus.accepted > 0 ? 'hl' : 'dim' });
    S.set('residual', { text: 'Residual risk: ' + byStatus.accepted + ' accepted' });
    S.step(T(byStatus.accepted + ' bulgu "kalan risk" olarak kabul edilmiş; rapor bunu gerekçesiyle yazar.',
              byStatus.accepted + ' finding(s) are accepted as "residual risk"; the report states each with its rationale.'), {});

    var ready = openUrgent === 0;
    S.box('verdict', { x: 0, y: 300, w: 460, h: 44, size: 15, text: ready ? T('ÜRETİME HAZIR', 'READY FOR PRODUCTION').tr : T('ÜRETİME HAZIR DEĞİL', 'NOT READY').tr, style: ready ? 'new' : 'del' });
    S.set('verdict', { text: ready ? 'READY FOR PRODUCTION' : 'NOT READY' });
    S.step(T('is_ready_for_production(' + openUrgent + '): açık ve ACİL bulgu sayısı ' + openUrgent + ' -> ' + (ready ? 'HAZIR' : 'HAZIR DEĞİL') + '.',
              'is_ready_for_production(' + openUrgent + '): open-and-URGENT finding count is ' + openUrgent + ' -> ' + (ready ? 'READY' : 'NOT READY') + '.'),
           { c: [{ n: 3, note: T('open_urgent_count == 0? ' + (ready ? 'evet' : 'hayır'), 'open_urgent_count == 0? ' + (ready ? 'yes' : 'no')) }] });

    S.result = { total: n, openUrgent: openUrgent, byStatus: byStatus, ready: ready };
    S.step(T(ready ? 'Yönetici özeti bunu tek cümleyle söyler: "üretime hazır."' : 'Yönetici özeti şunu söyler: "' + openUrgent + ' acil bulgu kapatılmadan üretime hazır değil."',
              ready ? 'The executive summary says it in one sentence: "ready for production."' : 'The executive summary says: "not ready for production until ' + openUrgent + ' urgent finding(s) are closed."'), {});
  }

  function f(priority, status) { return { priority: priority, status: status }; }
  // Canonical letter -> finding shape (used by presets, random() and parse() alike, so every finding this
  // animation ever draws is one of exactly these four shapes -- guarantees a lossless format/parse round trip).
  function letterFinding(ch) {
    if (ch === 'u') return f('urgent', 'open');
    if (ch === 'c') return f('urgent', 'closed');
    if (ch === 'm') return f('medium', 'open');
    return f('low', 'accepted');
  }
  function fromLetters(s) { return mk(s.split('').map(letterFinding)); }

  D.define({
    id: 'report-structure',
    title: T('Rapor yapısı: beş bölüm ve üretime hazır olma kararı', 'Report structure: five sections and the production-readiness verdict'),
    code: { c: C },
    presets: [
      { id: 'normal-ready', level: 'normal', name: T('Normal: açık acil bulgu yok -> HAZIR', 'Normal: no open urgent findings -> READY'),
        data: fromLetters('ccmmoocmoc') },
      { id: 'hard-one-urgent-open', level: 'hard', name: T('Zor: bir açık acil bulgu -> HAZIR DEĞİL', 'Hard: one open urgent finding -> NOT READY'),
        data: fromLetters('cmomocmocu') },
      { id: 'edge-all-closed', level: 'edge', name: T('Uç durum: bütün bulgular kapandı (hiç açık acil yok)', 'Edge case: every finding is closed (no open urgent findings)'),
        data: fromLetters('cccccccccc') },
      { id: 'edge-all-urgent-open', level: 'edge', name: T('Uç durum: bütün bulgular açık VE acil -> kesinlikle HAZIR DEĞİL', 'Edge case: every finding is open AND urgent -> definitely NOT READY'),
        data: fromLetters('uuuuuuuuuu') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.findings.length; },
    random: function (level, r) {
      var n = { easy: 10, normal: D.randInt(r, 10, 13), hard: D.randInt(r, 11, 14), extreme: D.randInt(r, 12, 15) }[level] || 10;
      var weights = { easy: [0, 0.4, 0.3, 0.3], normal: [0.1, 0.3, 0.3, 0.3], hard: [0.25, 0.25, 0.25, 0.25], extreme: [0.4, 0.2, 0.2, 0.2] }[level] || [0.1, 0.3, 0.3, 0.3];
      var letters = 'ucmo';
      var arr = [];
      for (var i = 0; i < n; i++) {
        var x = r(), acc = 0, pick = 3;
        for (var k = 0; k < 4; k++) { acc += weights[k]; if (x < acc) { pick = k; break; } }
        arr.push(letterFinding(letters[pick]));
      }
      return mk(arr);
    },
    input: {
      hint: T('dizi=<harfler> u=acil-açık c=acil-kapandı m=orta-açık o=diğer (ör. uucmo)', 'sequence=<letters> u=urgent-open c=urgent-closed m=medium-open o=other (e.g. uucmo)'),
      format: function (data) {
        return data.findings.map(function (fd) {
          if (fd.priority === 'urgent' && fd.status === 'open') return 'u';
          if (fd.priority === 'urgent') return 'c';
          if (fd.priority === 'medium' && fd.status === 'open') return 'm';
          return 'o';
        }).join('');
      },
      tokens: function (data) { return data.findings.map(function (fd, i) { return 'F-' + (i + 1); }); },
      parse: function (text) {
        var s = String(text).trim().toLowerCase();
        if (!/^[ucmo]+$/.test(s)) throw T('Biçim: yalnız u, c, m, o harfleri (ör. "uucmo").', 'Format must consist only of the letters u, c, m, o (e.g. "uucmo").');
        if (s.length < 1 || s.length > 30) throw T('Uzunluk 1..30 aralığında olmalı.', 'The length must be in the range 1..30.');
        return fromLetters(s);
      },
      bad: ['', 'uucXo', 'UUCM7', String(new Array(40).join('u')), 'u u c m']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));

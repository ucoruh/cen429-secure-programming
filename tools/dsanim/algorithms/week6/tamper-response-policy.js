// CEN429 — Week 6 — Demo 8 (code/week-06/08-tamper-response/rasp.c)
// decide_response() classifies each independent invocation into one of four response states — a small
// state machine, not a single block-or-allow switch. This animation walks a MONITORING TIMELINE: a
// sequence of independent invocations (each with its own failed-check count and device-mismatch flag, just
// like rasp.c's "mode" argument), and for every one highlights which state it lands in and the transition
// from a shared "start" into that state.
(function (D) {
  'use strict';
  var T = D.T;

  var C = [
    'static rasp_state_t decide_response(int failed_checks, int device_mismatch)',
    '{',
    '    if (device_mismatch)     return RASP_LOCK;',
    '    if (failed_checks <= 0)  return RASP_NORMAL;',
    '    if (failed_checks == 1)  return RASP_WARN;',
    '    if (failed_checks == 2)  return RASP_DEGRADE;',
    '    return RASP_LOCK;    /* failed_checks >= 3 */',
    '}'
  ];

  var STATES = ['NORMAL', 'WARN', 'DEGRADE', 'LOCK'];

  function decide(failed, deviceMismatch) {
    if (deviceMismatch) return 'LOCK';
    if (failed <= 0) return 'NORMAL';
    if (failed === 1) return 'WARN';
    if (failed === 2) return 'DEGRADE';
    return 'LOCK';
  }
  /** Mirrors decide()'s guard-clause chain but also records, for the CODE PANEL, exactly which line
   * was evaluated (with its comparison outcome) and which later lines were never reached because an
   * earlier guard already returned — matching decide_response()'s real C control flow line by line. */
  function declineLines(failed, deviceMismatch) {
    var out = [];
    var dm = !!deviceMismatch;
    out.push({ n: 3, note: T('device_mismatch? ' + (dm ? 'evet' : 'hayır'), 'device_mismatch? ' + (dm ? 'yes' : 'no')) });
    if (dm) { out.push({ n: 4, skip: true }, { n: 5, skip: true }, { n: 6, skip: true }, { n: 7, skip: true }); return out; }
    var normal = failed <= 0;
    out.push({ n: 4, note: T('failed_checks <= 0? ' + (normal ? 'evet' : 'hayır'), 'failed_checks <= 0? ' + (normal ? 'yes' : 'no')) });
    if (normal) { out.push({ n: 5, skip: true }, { n: 6, skip: true }, { n: 7, skip: true }); return out; }
    var warn = failed === 1;
    out.push({ n: 5, note: T('failed_checks == 1? ' + (warn ? 'evet' : 'hayır'), 'failed_checks == 1? ' + (warn ? 'yes' : 'no')) });
    if (warn) { out.push({ n: 6, skip: true }, { n: 7, skip: true }); return out; }
    var degrade = failed === 2;
    out.push({ n: 6, note: T('failed_checks == 2? ' + (degrade ? 'evet' : 'hayır'), 'failed_checks == 2? ' + (degrade ? 'yes' : 'no')) });
    if (degrade) { out.push({ n: 7, skip: true }); return out; }
    out.push(7);
    return out;
  }
  /** Independent expression of the SAME table (used only by reference()): a lookup array indexed by a
   * clamped failure count, instead of build()'s if/else chain. */
  function decideRef(failed, deviceMismatch) {
    if (deviceMismatch) return 'LOCK';
    var clamped = failed < 0 ? 0 : (failed > 3 ? 3 : failed);
    return STATES[clamped];
  }

  /** rounds: a monitoring timeline — [{label, failed, deviceMismatch}, …], each an independent
   * decide_response() call (rasp.c's policy is stateless per call; this animates several calls in
   * sequence, the way a real session's log would read). */
  function mk(rounds) { return { rounds: rounds.slice() }; }

  function reference(data) {
    var states = data.rounds.map(function (r) { return decideRef(r.failed, r.deviceMismatch); });
    var counts = { NORMAL: 0, WARN: 0, DEGRADE: 0, LOCK: 0 };
    states.forEach(function (s) { counts[s]++; });
    return { states: states, counts: counts };
  }

  function build(S, data) {
    var rounds = data.rounds, n = rounds.length;
    // ---- the 4-state diagram (drawn once, stays on screen) ----
    var CX = { NORMAL: 0, WARN: 160, DEGRADE: 340, LOCK: 520 };
    var CY = 0, R = 46;
    STATES.forEach(function (s) { S.circle('st' + s, { x: CX[s], y: CY, r: R, text: s, size: 13, style: 'dim' }); });
    for (var i = 0; i < STATES.length - 1; i++) {
      S.arrow('flow' + i, { from: 'st' + STATES[i], to: 'st' + STATES[i + 1], kind: 'center', style: 'dim',
        text: i === 0 ? T('1 başarısız', '1 failed') : i === 1 ? T('2 başarısız', '2 failed') : T('3+ başarısız / cihaz uyuşmuyor', '3+ failed / device mismatch') });
    }
    S.step(T('Dört durumlu tepki politikası: NORMAL -> WARN -> DEGRADE -> LOCK. Her çağrı bağımsız olarak birine sınıflandırılır.',
              'A four-state response policy: NORMAL -> WARN -> DEGRADE -> LOCK. Every call is independently classified into one of them.'), { c: [1, 2] });

    // ---- walk the timeline ----
    var TY = 140, TW = 130, TGAP = 6;
    var counts = { NORMAL: 0, WARN: 0, DEGRADE: 0, LOCK: 0 };
    S.label('timelineLbl', { x: (n * (TW + TGAP)) / 2, y: TY - 16, text: T('izleme zaman çizelgesi (bağımsız çağrılar):', 'monitoring timeline (independent calls):'), anchor: 'middle', bold: true, size: 14 });
    for (i = 0; i < n; i++) S.box('r' + i, { x: i * (TW + TGAP), y: TY, w: TW, h: 40, size: 11, text: rounds[i].label, style: 'normal' });

    var states = [];
    S.at(0);
    for (i = 0; i < n; i++) {
      var s = decide(rounds[i].failed, rounds[i].deviceMismatch);
      states.push(s);
      counts[s]++;
      S.styleAll('dim', 'circle');
      S.set('st' + s, { style: 'hl' });
      S.set('r' + i, { style: s === 'NORMAL' ? 'new' : (s === 'LOCK' ? 'del' : 'active') });
      S.at(Math.min(i, n - 1));
      var reason = rounds[i].deviceMismatch ? T('cihaz uyuşmuyor', 'device mismatches') : T(rounds[i].failed + ' kontrol başarısız', rounds[i].failed + ' check(s) failed');
      if (i < 5) {
        S.step(T('"' + rounds[i].label + '": ' + reason.tr + ' -> durum = ' + s + '.',
                  '"' + rounds[i].label + '": ' + reason.en + ' -> state = ' + s + '.'),
               { c: declineLines(rounds[i].failed, rounds[i].deviceMismatch) });
      }
    }
    S.at(null);
    S.styleAll('dim', 'circle');
    var lastState = states[states.length - 1];
    if (lastState) S.set('st' + lastState, { style: 'hl' });

    S.label('summary', { x: (n * (TW + TGAP)) / 2, y: TY + 70,
      text: T('özet: NORMAL=' + counts.NORMAL + ' WARN=' + counts.WARN + ' DEGRADE=' + counts.DEGRADE + ' LOCK=' + counts.LOCK,
              'summary: NORMAL=' + counts.NORMAL + ' WARN=' + counts.WARN + ' DEGRADE=' + counts.DEGRADE + ' LOCK=' + counts.LOCK),
      anchor: 'middle', size: 14, bold: true });
    S.result = { states: states, counts: counts };
    S.step(T(n + ' çağrı sınıflandırıldı: ' + counts.NORMAL + ' NORMAL, ' + counts.WARN + ' WARN, ' + counts.DEGRADE + ' DEGRADE, ' + counts.LOCK + ' LOCK.',
              n + ' calls classified: ' + counts.NORMAL + ' NORMAL, ' + counts.WARN + ' WARN, ' + counts.DEGRADE + ' DEGRADE, ' + counts.LOCK + ' LOCK.'), {});
  }

  function roundsFrom(pattern) {
    // pattern: array of [failed, deviceMismatch]. label is a language-neutral call number ("#1", "#2", …).
    return pattern.map(function (p, i) { return { label: '#' + (i + 1), failed: p[0], deviceMismatch: !!p[1] }; });
  }

  D.define({
    id: 'tamper-response-policy',
    title: T('Tepki politikası durum makinesi: uyar -> düşür -> kilitle (rasp.c)', 'Response policy state machine: warn -> degrade -> lock (rasp.c)'),
    code: function () { return { c: C }; },
    presets: [
      { id: 'escalating', level: 'normal', name: T('Normal: giderek kötüleşen bir oturum (NORMAL -> WARN -> DEGRADE -> LOCK)', 'Normal: a gradually worsening session (NORMAL -> WARN -> DEGRADE -> LOCK)'),
        data: mk(roundsFrom([[0, 0], [0, 0], [1, 0], [1, 0], [2, 0], [2, 0], [3, 0], [3, 0], [4, 0], [5, 0]])) },
      { id: 'noisy', level: 'hard', name: T('Zor: durumlar arasında sık sık ileri geri sıçrayan bir oturum', 'Hard: a session bouncing frequently between states'),
        data: mk(roundsFrom([[0, 0], [3, 0], [0, 0], [1, 0], [0, 1], [2, 0], [0, 0], [1, 0], [0, 1], [0, 0], [2, 0]])) },
      { id: 'edge-all-device-mismatch', level: 'edge', name: T('Uç durum: kontroller hep geçiyor ama cihaz HİÇ uyuşmuyor -> hep LOCK', 'Edge case: checks always pass but the device NEVER matches -> always LOCK'),
        data: mk(roundsFrom([[0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1]])) },
      { id: 'edge-all-clean', level: 'edge', name: T('Uç durum: on çağrının hepsi tertemiz -> hep NORMAL', 'Edge case: all ten calls are perfectly clean -> always NORMAL'),
        data: mk(roundsFrom([[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]])) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.rounds.length; },
    random: function (level, r) {
      var n = { easy: 10, normal: D.randInt(r, 10, 12), hard: D.randInt(r, 11, 13), extreme: D.randInt(r, 12, 14) }[level] || 10;
      var maxFailed = { easy: 2, normal: 3, hard: 4, extreme: 5 }[level] || 2;
      var pattern = [];
      for (var i = 0; i < n; i++) {
        var deviceMismatch = D.randInt(r, 0, 9) === 0;
        var failed = deviceMismatch ? 0 : D.randInt(r, 0, maxFailed);
        pattern.push([failed, deviceMismatch ? 1 : 0]);
      }
      return mk(roundsFrom(pattern));
    },
    input: {
      hint: T('failed,device; failed,device; … (device: 0 ya da 1)', 'failed,device; failed,device; … (device: 0 or 1)'),
      format: function (data) { return data.rounds.map(function (r) { return r.failed + ',' + (r.deviceMismatch ? 1 : 0); }).join('; '); },
      tokens: function (data) { return data.rounds.map(function (r) { return r.label; }); },
      parse: function (text) {
        var toks = String(text).split(';').map(function (t) { return t.trim(); }).filter(Boolean);
        if (!toks.length) throw T('En az bir çağrı girin.', 'Enter at least one call.');
        var pattern = [];
        for (var i = 0; i < toks.length; i++) {
          var m = toks[i].match(/^(\d+),([01])$/);
          if (!m) throw T('"' + toks[i] + '" "başarısız,cihaz" biçiminde olmalı (cihaz: 0 ya da 1).', '"' + toks[i] + '" must be "failed,device" (device: 0 or 1).');
          pattern.push([parseInt(m[1], 10), parseInt(m[2], 10)]);
        }
        return mk(roundsFrom(pattern));
      },
      bad: ['', '1', '1,2', 'a,0', '-1,0']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));

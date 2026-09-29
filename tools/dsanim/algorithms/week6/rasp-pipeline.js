// CEN429 — Week 6 — Demo 8 (code/week-06/08-tamper-response/rasp.c)
// RASP is not one check — it is a PIPELINE: DETECT (a set of independent checks, like Demos 1/2/3/4/7)
// -> DECIDE (how many failed? does device/version binding hold?) -> RESPOND (a graded policy, never a single
// block-or-allow switch). This animation walks the whole pipeline once, left to right, for one run.
(function (D) {
  'use strict';
  var T = D.T;

  var C = [
    'static rasp_state_t decide_response(int failed_checks, int device_mismatch)',
    '{',
    '    if (device_mismatch)   return RASP_LOCK;',
    '    if (failed_checks <= 0) return RASP_NORMAL;',
    '    if (failed_checks == 1) return RASP_WARN;',
    '    if (failed_checks == 2) return RASP_DEGRADE;',
    '    return RASP_LOCK;',
    '}'
  ];

  // Short labels for the in-scene box (box text never wraps — see the drawing standard); the full
  // explanation is in the step captions below (which do wrap) via ACTIONS_LONG.
  var ACTIONS = {
    NORMAL: T('aç, kullan, sil', 'open, use, wipe'),
    WARN: T('aç + kaydet + izle', 'open + log + monitor'),
    DEGRADE: T('sil + sansürlü sonuç', 'wipe + redacted result'),
    LOCK: T('sil + sahte sonuç + bayrak', 'wipe + decoy + flag')
  };
  var ACTIONS_LONG = {
    NORMAL: T('sır açılır, kullanılır, silinir', 'the secret opens, is used, then wiped'),
    WARN: T('sır yine açılır; olay kaydedilir, izleme sıkılaştırılır', 'the secret still opens; the event is logged, monitoring tightens'),
    DEGRADE: T('sır silinir; yalnız SANSÜRLÜ bir sonuç döner', 'the secret is wiped; only a REDACTED result is returned'),
    LOCK: T('sır silinir; sahte (decoy) sonuç döner, bayrak kaldırılır', 'the secret is wiped; a decoy result is returned, a flag is raised')
  };

  function decide(failed, deviceMismatch) {
    if (deviceMismatch) return 'LOCK';
    var level = ['NORMAL', 'WARN', 'DEGRADE', 'LOCK'][Math.min(failed, 3)];
    return level;
  }
  /** For the CODE PANEL: which line of decide_response()'s guard-clause chain was evaluated (with its
   * comparison outcome), and which later lines were never reached because an earlier guard already
   * returned. Line numbers match the `C` array above (1-based). */
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
   * clamped failure count, instead of build()'s nested if/else branches. */
  function decideRef(failed, deviceMismatch) {
    if (deviceMismatch) return 'LOCK';
    var clamped = failed < 0 ? 0 : (failed > 3 ? 3 : failed);
    var table = ['NORMAL', 'WARN', 'DEGRADE', 'LOCK'];
    return table[clamped];
  }

  var POOL = ['integrity', 'anti-debug', 'environment', 'hook-scan', 'root-check', 'signature',
    'timing', 'flow-guard', 'attest', 'watchdog', 'canary', 'checksum'];

  /** checks: [{name, passed}], in scan order. deviceMismatch: did device/version binding fail? */
  function mk(checks, deviceMismatch) { return { checks: checks.slice(), deviceMismatch: !!deviceMismatch }; }

  function reference(data) {
    var failed = data.checks.filter(function (c) { return !c.passed; }).length;
    return { failed: failed, state: decideRef(failed, data.deviceMismatch) };
  }

  function build(S, data) {
    var checks = data.checks, n = checks.length;
    S.label('detectLbl', { x: 0, y: -18, text: T('ALGILAMA', 'DETECT'), anchor: 'start', bold: true, size: 16 });
    var W = 140, H = 30, GAP = 5;
    for (var i = 0; i < n; i++) S.box('c' + i, { x: 0, y: i * (H + GAP), w: W, h: H, size: 12, text: checks[i].name, style: 'normal' });
    S.step(T(n + ' bağımsız kontrol çalıştırılıyor.', n + ' independent checks run.'), {});
    var failed = 0;
    S.at(0);
    for (i = 0; i < n; i++) {
      S.set('c' + i, { style: checks[i].passed ? 'new' : 'del' });
      S.at(Math.min(i, n - 1));
      if (!checks[i].passed) failed++;
      if (i < 4) S.step(T('`' + checks[i].name + '` -> ' + (checks[i].passed ? 'GEÇTİ' : 'BAŞARISIZ'), '`' + checks[i].name + '` -> ' + (checks[i].passed ? 'PASSED' : 'FAILED')), {});
    }
    S.at(null);

    var DX = W + 60;
    S.label('decideLbl', { x: DX, y: -18, text: T('KARAR', 'DECIDE'), anchor: 'start', bold: true, size: 16 });
    S.box('failedBox', { x: DX, y: 0, w: 160, h: 34, size: 14, text: T(failed + ' başarısız', failed + ' failed'), style: 'active' });
    S.box('devBox', { x: DX, y: 44, w: 160, h: 34, size: 13, text: data.deviceMismatch ? T('cihaz UYUŞMUYOR', 'device MISMATCH').en : T('cihaz uyuyor', 'device matches').en, style: data.deviceMismatch ? 'del' : 'new' });
    S.step(T('Karar: ' + failed + ' kontrol başarısız, cihaz ' + (data.deviceMismatch ? 'uyuşmuyor' : 'uyuyor') + '.',
              'Decide: ' + failed + ' check(s) failed, device ' + (data.deviceMismatch ? 'mismatches' : 'matches') + '.'), { c: [1, 2] });

    var state = decide(failed, data.deviceMismatch);
    var states = ['NORMAL', 'WARN', 'DEGRADE', 'LOCK'];
    var SX = DX + 200, SY = 0;
    for (i = 0; i < states.length; i++) S.box('s' + states[i], { x: SX, y: SY + i * 46, w: 110, h: 34, size: 14, text: states[i], style: states[i] === state ? 'hl' : 'dim' });
    S.step(T('SONUÇ durum: ' + state + '.', 'Resulting state: ' + state + '.'), { c: declineLines(failed, data.deviceMismatch) });

    var RX = SX + 150;
    S.label('respondLbl', { x: RX, y: -18, text: T('TEPKİ', 'RESPOND'), anchor: 'start', bold: true, size: 16 });
    S.box('action', { x: RX, y: 60, w: 220, h: 60, size: 13, text: ACTIONS[state], style: state === 'NORMAL' ? 'new' : (state === 'LOCK' ? 'del' : 'active') });
    S.arrow('a1', { from: 's' + state, to: 'action', kind: 'center' });

    S.result = { failed: failed, state: state };
    S.step(T('Politika: ' + ACTIONS_LONG[state].tr, 'Policy: ' + ACTIONS_LONG[state].en), {});
  }

  D.define({
    id: 'rasp-pipeline',
    title: T('RASP hattı: algıla -> karar ver -> tepki ver (rasp.c)', 'RASP pipeline: detect -> decide -> respond (rasp.c)'),
    code: function () { return { c: C }; },
    presets: [
      { id: 'normal', level: 'normal', name: T('Normal: hepsi geçti -> NORMAL', 'Normal: everything passed -> NORMAL'),
        data: mk(POOL.map(function (nm) { return { name: nm, passed: true }; }), false) },
      { id: 'two-failed', level: 'hard', name: T('Zor: iki kontrol başarısız -> DEGRADE', 'Hard: two checks failed -> DEGRADE'),
        data: mk(POOL.map(function (nm, i) { return { name: nm, passed: i !== 1 && i !== 4 }; }), false) },
      { id: 'edge-one-failed', level: 'edge', name: T('Uç durum: tam olarak bir kontrol başarısız -> WARN', 'Edge case: exactly one check failed -> WARN'),
        data: mk(POOL.map(function (nm, i) { return { name: nm, passed: i !== 0 }; }), false) },
      { id: 'edge-device-mismatch-all-pass', level: 'edge', name: T('Uç durum: bütün kontroller geçti ama cihaz uyuşmuyor -> yine LOCK', 'Edge case: every check passed but the device mismatches -> still LOCK'),
        data: mk(POOL.map(function (nm) { return { name: nm, passed: true }; }), true) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.checks.length; },
    random: function (level, r) {
      var n = { easy: 10, normal: D.randInt(r, 10, 12), hard: D.randInt(r, 10, 12), extreme: POOL.length }[level] || 10;
      var maxFail = { easy: 1, normal: 2, hard: 4, extreme: POOL.length }[level] || 1;
      var failCount = D.randInt(r, 0, Math.min(maxFail, n));
      var idxs = [];
      var pool = []; for (var i = 0; i < n; i++) pool.push(i);
      for (i = 0; i < failCount; i++) idxs.push(pool.splice(D.randInt(r, 0, pool.length - 1), 1)[0]);
      var checks = POOL.slice(0, n).map(function (nm, idx) { return { name: nm, passed: idxs.indexOf(idx) < 0 }; });
      var deviceMismatch = D.randInt(r, 0, 3) === 0;   // rarer than a failed check
      return mk(checks, deviceMismatch);
    },
    input: {
      hint: T('n=<kontrol sayısı> failed=<indeksler> device=uyuyor|uyuşmuyor', 'n=<check count> failed=<indexes> device=match|mismatch'),
      format: function (data) {
        var failedIdx = data.checks.map(function (c, i) { return c.passed ? null : i; }).filter(function (v) { return v !== null; });
        return 'n=' + data.checks.length + ' failed=' + failedIdx.join(',') + ' device=' + (data.deviceMismatch ? 'mismatch' : 'match');
      },
      tokens: function (data) { return data.checks.map(function (c) { return c.name; }); },
      parse: function (text) {
        var m = String(text).trim().match(/^n=(\d+)\s+failed=([\d,]*)\s+device=(match|mismatch)$/i);
        if (!m) throw T('Biçim: "n=<sayı> failed=<indeksler> device=match|mismatch" olmalı.', 'Format must be "n=<count> failed=<indexes> device=match|mismatch".');
        var n = parseInt(m[1], 10);
        if (n < 1 || n > POOL.length) throw T('n, 1..' + POOL.length + ' aralığında olmalı.', 'n must be in the range 1..' + POOL.length + '.');
        var failedText = m[2];
        var idxs = failedText === '' ? [] : failedText.split(',').map(function (t) { return parseInt(t, 10); });
        for (var i = 0; i < idxs.length; i++) if (!(idxs[i] >= 0 && idxs[i] < n)) throw T('failed indeksleri 0..' + (n - 1) + ' aralığında olmalı.', 'failed indexes must be in the range 0..' + (n - 1) + '.');
        var checks = POOL.slice(0, n).map(function (nm, idx) { return { name: nm, passed: idxs.indexOf(idx) < 0 }; });
        return mk(checks, /mismatch/i.test(m[3]));
      },
      bad: ['', 'n=3 failed=9 device=match', 'n=3 failed=a device=match', 'n=3 failed= device=perhaps', 'failed= device=match']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));

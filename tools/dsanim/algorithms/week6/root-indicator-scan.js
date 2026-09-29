// CEN429 — Week 6 — Demo 7 (code/week-06/07-environment-privilege/privilege.c)
// The program checks its own privilege level, then scans a list of known root/emulator marker PATHS,
// reading only whether each one EXISTS. No single marker is proof (root hiding can fake any of them); the
// count of markers found is one more signal for the response policy (Demo 8) to weigh.
(function (D) {
  'use strict';
  var T = D.T;

  var C = [
    'static const char *INDICATOR_PATHS[] = {',
    '    "/system/xbin/su", "/system/bin/su", "/sbin/su", "/su/bin/su",',
    '    "/system/app/Superuser.apk", "/data/adb/magisk", "/dev/socket/magisk",',
    '    NULL',
    '};',
    '',
    'int found = 0;',
    'for (int i = 0; INDICATOR_PATHS[i]; i++)',
    '    if (path_exists(INDICATOR_PATHS[i]))',
    '        found++;'
  ];

  /** paths: the full scan list, in order. foundSet: indices (into paths) that DO exist on this run.
   * elevated: is the process running as root/admin? */
  function mk(paths, foundSet, elevated) { return { paths: paths.slice(), foundSet: foundSet.slice().sort(function (a, b) { return a - b; }), elevated: !!elevated }; }

  function reference(data) {
    var found = data.foundSet.length;
    var suspicious = found + (data.elevated ? 1 : 0);
    return { found: found, elevated: data.elevated, suspicious: suspicious, flagged: suspicious > 0 };
  }

  function build(S, data) {
    var paths = data.paths, n = paths.length;
    var foundSetSorted = data.foundSet;
    S.label('privLbl', { x: -14, y: 20, text: T('ayrıcalık seviyesi =', 'privilege level ='), anchor: 'end', size: 14, mono: true });
    S.box('priv', { x: 0, y: 0, w: 200, h: 32, size: 14, text: data.elevated ? T('YÜKSELTİLMİŞ', 'ELEVATED').en : T('normal', 'normal').en, style: data.elevated ? 'del' : 'new' });
    S.set('priv', { text: data.elevated ? 'root/admin' : T('normal kullanıcı', 'normal user') });
    S.step(T('1) Ayrıcalık seviyesi kontrol ediliyor: ' + (data.elevated ? 'YÜKSELTİLMİŞ (root/admin)' : 'normal kullanıcı') + '.',
              '1) Checking the privilege level: ' + (data.elevated ? 'ELEVATED (root/admin)' : 'normal user') + '.'), {});

    var W = 260, H = 28, GAP = 3, Y = 60;
    S.label('title', { x: W / 2, y: Y - 16, text: T('2) tehlikeli gösterge taraması:', '2) dangerous-indicator scan:'), anchor: 'middle', bold: true, size: 14 });
    for (var i = 0; i < n; i++) S.box('p' + i, { x: 0, y: Y + i * (H + GAP), w: W, h: H, size: 11, mono: true, text: paths[i], style: 'normal', above: String(i) });
    S.pointer('cursor', { target: 'p0', side: 'left', text: T('taranıyor', 'scanning') });
    var found = 0, detailed = 0;
    for (i = 0; i < n; i++) {
      S.set('cursor', { target: 'p' + i });
      S.at(i);
      var exists = foundSetSorted.indexOf(i) >= 0;
      if (exists) {
        found++;
        S.set('p' + i, { style: 'del' });
        if (detailed < 3) {
          S.step(T('`' + paths[i] + '` VAR -> [BULUNDU]', '`' + paths[i] + '` EXISTS -> [FOUND]'),
                 { c: [{ n: 8, note: T('INDICATOR_PATHS[i] != NULL? evet', 'INDICATOR_PATHS[i] != NULL? yes') },
                        { n: 9, note: T('path_exists(...)? evet', 'path_exists(...)? yes') }, 10] });
          detailed++;
        }
      } else {
        S.set('p' + i, { style: 'dim' });
        if (detailed < 3) {
          S.step(T('`' + paths[i] + '` yok, devam.', '`' + paths[i] + '` not present, keep going.'),
                 { c: [{ n: 8, note: T('INDICATOR_PATHS[i] != NULL? evet', 'INDICATOR_PATHS[i] != NULL? yes') },
                        { n: 9, note: T('path_exists(...)? hayır', 'path_exists(...)? no') }, { n: 10, skip: true }] });
          detailed++;
        }
      }
    }
    S.remove('cursor');
    S.at(null);
    S.label('foundLbl', { x: W + 16, y: Y + (n - 1) * (H + GAP) / 2, text: T(found + '/' + n + ' bulundu', found + '/' + n + ' found'), anchor: 'start', size: 14, bold: true });
    S.step(T('Tarama tamam: ' + found + '/' + n + ' bilinen gösterge bulundu.', 'Scan complete: ' + found + '/' + n + ' known indicator(s) found.'), {});

    var suspicious = found + (data.elevated ? 1 : 0);
    S.result = { found: found, elevated: data.elevated, suspicious: suspicious, flagged: suspicious > 0 };
    if (suspicious > 0) {
      S.step(T('SONUÇ: ayrıcalıklı/riskli ortam GÖSTERGESİ var (' + suspicious + ' sinyal).', 'RESULT: an elevated/risky environment INDICATOR is present (' + suspicious + ' signal(s)).'), {});
    } else {
      S.step(T('SONUÇ: temiz - riskli ortam göstergesi yok.', 'RESULT: clean - no risky-environment indicator.'), {});
    }
  }

  var POOL = ['/system/xbin/su', '/system/bin/su', '/sbin/su', '/su/bin/su', '/system/app/Superuser.apk',
    '/data/adb/magisk', '/dev/socket/magisk', '/data/local/tmp/frida-server', '/system/bin/.ext/su',
    '/cache/.disable_magisk', '/system/bin/failsafe/su', '/system/sd/xbin/su', '/system/usr/we-need-root/su-backup', '/vendor/bin/su'];

  D.define({
    id: 'root-indicator-scan',
    title: T('Kök/ayrıcalık gösterge taraması (privilege.c)', 'Root/privilege indicator scan (privilege.c)'),
    code: function () { return { c: C }; },
    presets: [
      { id: 'clean', level: 'normal', name: T('Normal: root değil, hiçbir gösterge yok', 'Normal: not root, no indicator found'),
        data: mk(POOL, [], false) },
      { id: 'rooted-one-mark', level: 'hard', name: T('Zor: normal kullanıcı ama bir "su" göstergesi bulundu', 'Hard: normal user, but one "su" indicator found'),
        data: mk(POOL, [0], false) },
      { id: 'edge-elevated-clean-scan', level: 'edge', name: T('Uç durum: yönetici/root olarak çalışıyor ama tarama temiz', 'Edge case: running as admin/root, but the scan itself is clean'),
        data: mk(POOL, [], true) },
      { id: 'edge-multiple-marks', level: 'edge', name: T('Uç durum: birden çok gösterge + yükseltilmiş ayrıcalık', 'Edge case: several indicators + elevated privilege'),
        data: mk(POOL, [0, 5, 6, 8], true) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.paths.length; },
    random: function (level, r) {
      var n = { easy: 10, normal: D.randInt(r, 10, 12), hard: D.randInt(r, 11, 13), extreme: POOL.length }[level] || 10;
      var paths = POOL.slice(0, n);
      var maxFound = { easy: 1, normal: 2, hard: 3, extreme: 5 }[level] || 1;
      var howMany = D.randInt(r, 0, maxFound);
      var foundSet = [];
      var pool = paths.map(function (_, i) { return i; });
      for (var i = 0; i < howMany && pool.length; i++) foundSet.push(pool.splice(D.randInt(r, 0, pool.length - 1), 1)[0]);
      var elevated = D.randInt(r, 0, 1) === 1;
      return mk(paths, foundSet, elevated);
    },
    input: {
      hint: T('n=<taranan yol sayısı> elevated=evet|hayir; bulunanlar=<indeksler, virgülle>', 'n=<paths scanned> elevated=yes|no; found=<indexes, comma-separated>'),
      format: function (data) { return 'n=' + data.paths.length + ' elevated=' + (data.elevated ? 'yes' : 'no') + '; found=' + data.foundSet.join(','); },
      tokens: function (data) { return data.paths; },
      parse: function (text) {
        var parts = String(text).split(';');
        if (parts.length !== 2) throw T('Biçim: "n=<sayı> elevated=yes|no; found=<indeksler>" olmalı.', 'Format must be "n=<count> elevated=yes|no; found=<indexes>".');
        var head = parts[0].trim().match(/^n=(\d+)\s+elevated=(yes|no)$/i);
        if (!head) throw T('Biçim: "n=<sayı> elevated=yes|no; found=<indeksler>" olmalı.', 'Format must be "n=<count> elevated=yes|no; found=<indexes>".');
        var n = parseInt(head[1], 10);
        if (n < 1 || n > POOL.length) throw T('n, 1.. ' + POOL.length + ' aralığında olmalı.', 'n must be in the range 1.. ' + POOL.length + '.');
        var elevated = /yes/i.test(head[2]);
        var foundText = parts[1].trim().replace(/^found=/i, '');
        var foundSet = foundText === '' ? [] : foundText.split(',').map(function (t) { return t.trim(); });
        var idxs = [];
        for (var i = 0; i < foundSet.length; i++) {
          if (!/^\d+$/.test(foundSet[i])) throw T('"' + foundSet[i] + '" bir indeks değil.', '"' + foundSet[i] + '" is not an index.');
          var v = parseInt(foundSet[i], 10);
          if (v < 0 || v >= n) throw T('İndeks 0..' + (n - 1) + ' aralığında olmalı.', 'The index must be in the range 0..' + (n - 1) + '.');
          idxs.push(v);
        }
        return mk(POOL.slice(0, n), idxs, elevated);
      },
      bad: ['', 'n=3 elevated=maybe; found=', 'found=0,1', 'n=3 elevated=yes; found=99', 'n=3 elevated=yes; found=x']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
